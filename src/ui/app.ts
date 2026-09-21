// The thin DOM glue: mount the shell, then on every measurement (or fabric)
// change re-draft, re-render the canvas, garment, guidance, and style. All real
// logic lives in the pure modules.

import { Measurements, STANDARD_M, Piece, STRETCH_FABRICS, fabricEaseNote, GarmentOptionsByRecipe, GarmentOptions, defaultGarmentOptions } from "../drafting";
import { gradeRun, draftAtSize, specSheet, GARMENTS, GarmentRecipe, garmentByName } from "../drafting";
import { blockPieces, rolePiece } from "../drafting";
import { exportSvg, exportDxf, exportPdf, exportTechPack, exportProjectorSvg, exportA0Pdf, exportSurfaceSheet, flattenPiece, nestPieces, gradedMarker } from "../export";
import { renderBlueprint, renderGarment, renderNest, renderFabricNest, renderEditor, renderBody, renderBodyPair, renderSkirtGarment, renderSkirtBody, renderTrouserGarment, renderTrouserBody, renderTrouserBodyPair, renderTrouserSide, renderSideCroquis, DEFAULT_FABRIC } from "../render";
import { pieceHandles, moveHandle, nearestHandle, editorViewBox, viewboxPointToCm, Handle } from "../edit";
import { dartOf, transferDart, trueSeam, edgesMeet } from "../drafting";
import { BLUEPRINT } from "../render";
import { guide, Note } from "../guidance";
import { garmentReport, implausibleFields } from "../guidance";
import { surfaceGuidance } from "../guidance/surface-notes";
import { availableLengthError, bufferError } from "../export/nesting-intelligence";
import { matchStyle, styleNames } from "../style";
import { FIELDS, applyChange, inputError, numericRangePosition, numericRangeState, stepNumericValue } from "./controls";
import { appShellMarkup, controlsMarkup, guidanceMarkup, styleMarkup, surfaceMarkup, nestIntelReadout, specTableMarkup, checkMarkup, editorHintMarkup, editorHandleControlsMarkup, dartControlsMarkup, inspectionMarkup, BodyCroquisView } from "./view";
import { saveToStorage, loadFromStorage, readFromStorage, serialize, deserialize, DEFAULT_WORKSPACE, defaultStretchFabricForGarment, Workspace, SaveFile, RecoveryFile, readRecoveryFromStorage, saveRecoveryToStorage, clearRecoveryFromStorage } from "./persist";
import { Appearance, APPEARANCE_TEXTURES, DEFAULT_APPEARANCE, applyAppearanceToSvg, hexToHsl, hslToHex, normalizeHex } from "./appearance";
import { emptyHistory, recordHistory, redoHistory, undoHistory, HistoryState } from "./history";
import { EMPTY_TRANSFORM, placementError, type ArtworkPlacement } from "../surface/placement";
import { artworkCorners, boundingBox } from "../surface/transform";
import { overlayItem, surfaceOverlay } from "../render/surface-overlay";
import {
  nextZOrder, surfaceAdd, surfaceKey, surfaceList, surfacePlaceable, surfaceRemoveAt, surfaceSetAt,
  type SurfaceBook,
} from "../surface/store";
import { pieceFrames } from "../surface/piece-frames";
import {
  JourneyStep, ViewName, StageReadiness, StageBlocker, COACHED_STEPS, disclosureFor, stepView, journeyChecklist,
  journeyBarMarkup, checklistMarkup, welcomeMarkup, celebrationMarkup,
  loadJourney, saveJourney,
} from "./journey";

// The desktop shell's bridge (Slice 46) — see electron/preload.cts for the
// other end. Optional: undefined everywhere this app runs as a plain web page.
declare global {
  interface Window {
    electronAPI?: {
      saveFile(filename: string, content: string): Promise<{ saved: boolean; filePath?: string }>;
      onExportRequested?(callback: (kind: string) => void): void;
    };
  }
}

interface DraftSnapshot {
  readonly measurements: Measurements;
  readonly rawMeasurements: Partial<Record<keyof Measurements, string>>;
  readonly fabric: string;
  readonly appearance: Appearance;
  readonly garmentOptions: GarmentOptionsByRecipe;
  readonly rawOptions: Record<string, Record<string, string>>;
  readonly garment: string;
  readonly targetStyle: string;
  readonly stretchFabric: string;
  readonly materialSelectionExplicit: boolean;
  readonly view: ViewName;
  readonly bodyCroquisView: BodyCroquisView;
  readonly exportStep: number;
  readonly fabricWidth: number;
  readonly nestScope: "single" | "marker";
}

const HISTORY_LIMIT = 30;
let activeMountRoot: HTMLElement | null = null;

const correctionStepForField = (field: string): JourneyStep =>
  field === "ease" || field === "stretchFabric" || field.startsWith("option-") ||
  field.startsWith("surface-") ? "fit" : field.startsWith("nesting-") ? "output" : "measure";

export function stageBlockerFromNote(note: Note | undefined): StageBlocker {
  if (!note) return { message: "Review the flagged digital checks.", step: "refine" };
  if (!note.field) return { message: note.text, step: "refine" };
  return { message: note.text, step: correctionStepForField(note.field), field: note.field };
}

export function mountApp(root: HTMLElement): void {
  activeMountRoot = root;
  const saved = loadFromStorage();
  let measurements: Measurements = saved ? saved.measurements : STANDARD_M;
  let fabric = saved ? saved.fabric : DEFAULT_FABRIC;
  let garmentOptions: GarmentOptionsByRecipe = saved ? saved.garmentOptions : {};
  const initialWorkspace = saved?.workspace ?? {
    ...DEFAULT_WORKSPACE,
    stretchFabric: defaultStretchFabricForGarment(DEFAULT_WORKSPACE.garment),
  };
  let recipe: GarmentRecipe = garmentByName(initialWorkspace.garment);
  let appearance: Appearance = saved?.appearance ?? DEFAULT_APPEARANCE;
  let surfaceBook: SurfaceBook = saved?.surface ?? {};
  let appearanceOpen = false;
  root.innerHTML = appShellMarkup(measurements, fabric, recipe.sizes, recipe.fields, initialWorkspace.stretchFabric, recipe.name, appearance);

  const canvasHost = root.querySelector<HTMLDivElement>("#canvas-host")!;
  const guidanceHost = root.querySelector<HTMLDivElement>("#guidance-host")!;
  const styleHost = root.querySelector<HTMLDivElement>("#style-host")!;
  const fabricWidthHost = root.querySelector<HTMLDivElement>("#fabric-width-host")!;
  const journeyHost = root.querySelector<HTMLDivElement>("#journey-host")!;
  const recoveryHost = root.querySelector<HTMLDivElement>("#recovery-host")!;
  const undoButton = root.querySelector<HTMLButtonElement>("#undo-pattern")!;
  const redoButton = root.querySelector<HTMLButtonElement>("#redo-pattern")!;

  // The guided journey (F2): a coached Start→Output path over the existing views.
  // Its state is presentation-only and persisted separately from the pattern.
  let journey = loadJourney();
  if (saved && journey.step === "start" && !journey.familiar) journey = { ...journey, step: "measure", familiar: true };
  let celebrating = false; // the light, dismissible export confirmation
  let styleReviewed = false;
  let checkReviewed = false;
  let outputRevision = 0;
  let savedRevision = 0;
  let history: HistoryState<DraftSnapshot> = emptyHistory();
  let historyPresent: DraftSnapshot | null = null;
  let historyRestoring = false;
  let recoveryTrackingEnabled = false;
  let pendingRecovery: Omit<RecoveryFile, "v"> | null = null;
  const recoveryRead = readRecoveryFromStorage();
  if (recoveryRead.ok) pendingRecovery = recoveryRead;
  let pendingLoad: Omit<SaveFile, "v"> | null = null;
  let pendingLoadFocus: HTMLElement | null = null;
  let currentNotes: readonly Note[] = [];
  const ignoredGuidance = new Set<string>();
  const selectedControlPages = new Map<JourneyStep, number>();

  let targetStyle = initialWorkspace.targetStyle;
  let stretchFabric = STRETCH_FABRICS.find((f) => f.name === initialWorkspace.stretchFabric)!;
  let materialSelectionExplicit = saved !== null;
  let view: ViewName = saved ? initialWorkspace.view : stepView(journey.step);
  let bodyCroquisView: BodyCroquisView = initialWorkspace.bodyCroquisView;
  let editedFront: Piece | null = null; // freeform snapshot of the front (override, not parametric)
  let dragId: string | null = null; // handle being dragged
  let selectedId: string | null = null; // handle highlighted in the editor
  let fabricWidth = initialWorkspace.fabricWidth;
  let nestScope: "single" | "marker" = initialWorkspace.nestScope;
  // Nesting-intelligence planning state. Raw strings stay verbatim (invalid
  // included) like measurement inputs; the section persists validated values.
  let nestBufferRaw = "10";
  let nestAvailableRaw = "";
  let nestNap = true;
  const savedIntel = saved?.nestingIntelligence;
  if (savedIntel !== undefined) {
    nestBufferRaw = String(savedIntel.bufferPct);
    nestAvailableRaw = savedIntel.availableLengthCm === null ? "" : String(savedIntel.availableLengthCm);
    nestNap = savedIntel.napAware;
  }
  /** Nesting-intelligence planning state as validated numbers. Raw strings
   * stay in the inputs; only finite usable values reach the estimators. */
  const parseNestBuffer = (): number =>
    nestBufferRaw.trim() === "" ? NaN : Number(nestBufferRaw);
  const nestIntelErrors = (): Map<string, string> => {
    const errors = new Map<string, string>();
    const bufferProblem = bufferError(parseNestBuffer());
    if (bufferProblem) errors.set("nesting-buffer", bufferProblem);
    const availableProblem = availableLengthError(nestAvailableRaw);
    if (availableProblem) errors.set("nesting-available", availableProblem);
    return errors;
  };
  /** Push the current nest result through the planning readout into the panel. */
  const renderNestIntel = (requiredLengthCm: number, utilization: number): void => {
    const readout = nestIntelReadout(requiredLengthCm, utilization, nestBufferRaw,
      nestAvailableRaw, nestNap, nestScope === "marker" ? "Graded marker" : "Single size");
    const set = (id: string, text: string): void => {
      root.querySelector<HTMLElement>(`#${id}`)!.textContent = text;
    };
    set("nest-intel-scope", readout.scope);
    set("nest-required", readout.required);
    set("nest-planned", readout.planned);
    set("nest-waste", readout.waste);
    set("nest-available-state", readout.available);
    set("nest-verdict", readout.verdict);
    set("nest-nap-notice", readout.nap);
    set("error-nest-buffer", readout.bufferError);
    set("error-nest-available", readout.availableError);
    const bufferInput = root.querySelector<HTMLInputElement>("#nest-buffer")!;
    bufferInput.setAttribute("aria-invalid", String(readout.bufferError !== ""));
    bufferInput.setCustomValidity(readout.bufferError);
    const availableInput = root.querySelector<HTMLInputElement>("#nest-available")!;
    availableInput.setAttribute("aria-invalid", String(readout.availableError !== ""));
    availableInput.setCustomValidity(readout.availableError);
  };
  let exportStep = initialWorkspace.exportStep;
  let activeDim: string | null = null; // the measurement field spotlighted on the body view
  let hoveredDim: string | null = null;
  let focusedDim: string | null = null;
  let inspectionZoom = 1;
  let previewActive = false;
  let inactiveInspection = { zoom: 1, left: 0, top: 0 };

  const currentWorkspace = (): Workspace => ({ garment: recipe.name, targetStyle, stretchFabric: stretchFabric.name,
    view, bodyCroquisView, exportStep, fabricWidth, nestScope });
  const copyOptions = (options: GarmentOptionsByRecipe): GarmentOptionsByRecipe =>
    Object.fromEntries(Object.entries(options).map(([name, values]) => [name, { ...values }])) as GarmentOptionsByRecipe;
  const currentRawMeasurements = (): Partial<Record<keyof Measurements, string>> =>
    Object.fromEntries([...root.querySelectorAll<HTMLInputElement>("input[data-field]")]
      .map((input) => [input.dataset.field, input.value])) as Partial<Record<keyof Measurements, string>>;
  const currentRawOptions = (): Record<string, Record<string, string>> => ({
    [recipe.name]: Object.fromEntries([...root.querySelectorAll<HTMLInputElement>("input[data-option]")]
      .map((input) => [input.dataset.option, input.value])),
  });
  const captureDraftSnapshot = (): DraftSnapshot => ({
    measurements: { ...measurements },
    rawMeasurements: currentRawMeasurements(),
    fabric,
    appearance: { ...appearance },
    garmentOptions: copyOptions(garmentOptions),
    rawOptions: currentRawOptions(),
    garment: recipe.name,
    targetStyle,
    stretchFabric: stretchFabric.name,
    materialSelectionExplicit,
    view,
    bodyCroquisView,
    exportStep,
    fabricWidth,
    nestScope,
  });
  const captureRecoveryFile = (): Omit<RecoveryFile, "v"> => ({
    savedAt: Date.now(),
    measurements: Object.fromEntries(FIELDS.map((field) => [field.id,
      Number.isFinite(measurements[field.id]) ? measurements[field.id] : null])) as RecoveryFile["measurements"],
    rawMeasurements: currentRawMeasurements(),
    fabric,
    appearance: { ...appearance },
    garmentOptions: Object.fromEntries(Object.entries(garmentOptions).map(([name, values]) => [name,
      Object.fromEntries(Object.entries(values).map(([id, value]) => [id, Number.isFinite(value) ? value : null]))])),
    rawOptions: currentRawOptions(),
    workspace: currentWorkspace(),
    materialSelectionExplicit,
    surface: surfaceBook,
    rawNestingIntelligence: { buffer: nestBufferRaw, available: nestAvailableRaw, napAware: nestNap },
  });
  const sameSnapshot = (left: DraftSnapshot, right: DraftSnapshot): boolean =>
    JSON.stringify(left) === JSON.stringify(right);
  const syncHistoryControls = (): void => {
    undoButton.disabled = history.past.length === 0;
    redoButton.disabled = history.future.length === 0;
  };
  const renderRecoveryPrompt = (): void => {
    if (!pendingRecovery) {
      recoveryHost.replaceChildren();
      return;
    }
    recoveryHost.innerHTML = `<div class="workspace-recovery-card" role="dialog" aria-modal="true" aria-labelledby="workspace-recovery-title">` +
      `<h2 id="workspace-recovery-title">Unfinished draft found</h2>` +
      `<p>Recover the last local edit? It may contain incomplete values; drafting and export stay paused until they are corrected.</p>` +
      `<div class="workspace-recovery-actions"><button id="recovery-discard" type="button">Discard draft</button>` +
      `<button id="recovery-accept" type="button">Recover draft</button></div></div>`;
    recoveryHost.querySelector<HTMLButtonElement>("#recovery-discard")!.addEventListener("click", () => {
      pendingRecovery = null;
      clearRecoveryFromStorage();
      renderRecoveryPrompt();
    });
    recoveryHost.querySelector<HTMLButtonElement>("#recovery-accept")!.addEventListener("click", () => {
      if (pendingRecovery) acceptRecovery(pendingRecovery);
    });
    recoveryHost.querySelector<HTMLButtonElement>("#recovery-accept")!.focus();
  };

  /** Design options live per recipe, never in body measurements. Existing saved
   * values stay verbatim so guidance can explain an invalid combination. */
  const recipeOptions = (forRecipe: GarmentRecipe = recipe): GarmentOptions => ({
    ...defaultGarmentOptions(forRecipe.options ?? []),
    ...(garmentOptions[forRecipe.name] ?? {}),
  });
  const draftCurrent = (): ReturnType<GarmentRecipe["draft"]> => recipe.draft(measurements, recipeOptions());

  /** Surface artwork sets live per garment/style pair, shared across graded
   * sizes by construction (sizes never enter the key). Drafting, checks, and
   * exports never read this state; cutting files cannot change under it. */
  const surfaceKeyNow = (): string => surfaceKey(recipe.name, targetStyle);
  const surfacePlacementsNow = (): readonly ArtworkPlacement[] =>
    surfaceList(surfaceBook, surfaceKeyNow());
  const round3 = (n: number): number => Math.round(n * 1000) / 1000;
  /** True-scale artwork-space preview. Unplaceable entries are listed with
   * their error and skipped here; positions on pieces arrive with print output. */
  const surfacePreviewSvg = (): string => {
    const items = surfacePlacementsNow().flatMap((p) =>
      surfacePlaceable(p) ? [overlayItem(p, artworkCorners(p.widthCm, p.heightCm, p.transform))] : []);
    if (items.length === 0) return "";
    const points = items.flatMap((item) => [...item.polygon]);
    // Non-empty by construction above: at least one four-corner polygon exists.
    const box = boundingBox(points)!;
    const pad = 2;
    const shifted = items.map((item) => ({ ...item,
      polygon: item.polygon.map((pt) => ({ x: pt.x - box.minX + pad, y: pt.y - box.minY + pad })) }));
    const width = box.maxX - box.minX + pad * 2;
    const height = box.maxY - box.minY + pad * 2;
    return `<svg viewBox="0 0 ${round3(width)} ${round3(height)}" width="100%" ` +
      `xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Surface artwork preview">` +
      surfaceOverlay(shifted) + `</svg>`;
  };
  /** Placement index → actionable error. Rows are identified by position so
   * duplicate or hostile ids can never confuse one row for another. */
  const surfaceErrorMap = (): Map<number, string> => {
    const errors = new Map<number, string>();
    surfacePlacementsNow().forEach((p, index) => {
      const error = placementError(p);
      if (error) errors.set(index, error);
    });
    return errors;
  };
  /** Surface inputs are rebuilt with the panel every draw, so validity syncs
   * here — right after the panel markup lands — mirroring the measurement loop. */
  const syncSurfaceValidity = (): void => {
    const errors = surfaceErrorMap();
    styleHost.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      "input[data-surface-index], select[data-surface-index]").forEach((input) => {
      const error = errors.get(Number(input.dataset.surfaceIndex));
      input.setAttribute("aria-invalid", String(error !== undefined));
      input.setCustomValidity(error ?? "");
    });
  };
  const renderSurface = (): string => surfaceMarkup({
    style: targetStyle,
    placements: surfacePlacementsNow(),
    errors: surfaceErrorMap(),
    preview: surfacePreviewSvg(),
  });
  const inputErrors = (): Map<string, string> => {
    const errors = new Map<string, string>();
    for (const field of FIELDS.filter((f) => recipe.fields.includes(f.id))) {
      const error = inputError(measurements[field.id], field);
      if (error) errors.set(field.id, error);
    }
    for (const option of recipe.options ?? []) {
      const error = inputError(recipeOptions()[option.id], option);
      if (error) errors.set(`option-${option.id}`, error);
    }
    return errors;
  };
  const materialCompatibilityNote = (): Note | null =>
    (recipe.name === "woven-shirt" || recipe.name === "trouser") && stretchFabric.family === "knit"
      ? { level: "warn", field: "stretchFabric", text: `${recipe.label} is drafted for stable woven material; choose Cotton woven or Linen, or review the construction before using a knit.` }
      : null;
  // Include recipe warnings without changing the geometry-only export report.
  const designValid = (): boolean => inputErrors().size === 0
    && !guide(recipe, measurements, recipeOptions()).some((note) => note.level === "warn")
    && materialCompatibilityNote() === null
    && garmentReport(recipe, measurements, recipeOptions()).ok;
  const poloVisual = () => {
    if (recipe.name !== "polo") return undefined;
    const options = recipeOptions();
    return {
      placketLength: options.placketLength,
      placketWidth: options.placketWidth,
      standHeight: options.standHeight,
      collarLeafDepth: options.collarLeafDepth,
    };
  };
  const wovenShirtVisual = () => {
    if (recipe.name !== "woven-shirt") return undefined;
    const options = recipeOptions();
    const neckWidthHalf = (measurements.neck + options.neckEase) / 4;
    return {
      neckWidthHalf,
      frontNeckDepth: neckWidthHalf * 0.8,
      backNeckDepth: neckWidthHalf * 0.3,
      buttonCount: options.buttonCount,
      buttonSpacing: options.buttonSpacing,
      frontOverlap: options.frontOverlap,
      placketWidth: options.placketWidth,
      standHeight: options.standHeight,
      collarLeafDepth: options.collarLeafDepth,
      yokeDepth: options.yokeDepth,
      pocketWidth: options.pocketWidth,
      pocketHeight: options.pocketHeight,
      sleeveBandDepth: options.sleeveBandDepth,
      sideVentDepth: options.sideVentDepth,
      hemTurn: options.hemTurn,
    };
  };
  const wovenBodyNeckline = () => {
    if (recipe.name !== "woven-shirt") return undefined;
    const options = recipeOptions();
    const widthHalf = (measurements.neck + options.neckEase) / 4;
    return { widthHalf, frontDepth: widthHalf * 0.8, backDepth: widthHalf * 0.3 };
  };
  const wovenBodyLowerShape = () => {
    if (recipe.name !== "woven-shirt") return undefined;
    const waistY = measurements.armholeDepth +
      (measurements.length - measurements.armholeDepth) * 0.35;
    return {
      waistHalf: (measurements.waist + measurements.ease) / 4,
      hipHalf: (measurements.hip + measurements.ease) / 4,
      waistY,
      hipY: waistY + measurements.hipDepth,
    };
  };

  // Spotlight one measurement on the body view: its dimension line AND the outline
  // edges it shapes stay at full opacity, everything else drops back. A group
  // carries its field in `data-dim` (the dimension line) or `data-edge` (the
  // outline segments, plus the silhouette itself tagged "figure" — never a field
  // name, so it always dims). `null` restores the whole figure.
  const spotlight = (field: string | null): void => {
    const analysisHost = root.querySelector<HTMLElement>("#analysis-host");
    const assembledHost = root.querySelector<HTMLElement>("#garment-host");
    const hasTarget = (host: HTMLElement | null): boolean => host !== null && [...host.querySelectorAll<SVGElement>("[data-dim], [data-edge]")]
      .some((element) => (element.dataset.dim ?? element.dataset.edge) === field);
    root.querySelectorAll<HTMLElement>("#analysis-host, #garment-host").forEach((host) => {
      const elements = [...host.querySelectorAll<SVGElement>("[data-dim], [data-edge]")];
      const hostHasTarget = field !== null && elements.some((element) => (element.dataset.dim ?? element.dataset.edge) === field);
      elements.forEach((element) => {
        const owns = element.dataset.dim ?? element.dataset.edge;
        element.style.opacity = !hostHasTarget || owns === field ? "1" : "0.15";
      });
    });
    const cue = root.querySelector<HTMLElement>("#spatial-cue");
    const action = root.querySelector<HTMLButtonElement>("#spatial-cue-action");
    const text = root.querySelector<HTMLElement>("#spatial-cue-text");
    if (!cue || !action || !text || field === null || previewActive) {
      if (cue) cue.hidden = true;
      return;
    }
    const visibleTarget = hasTarget(analysisHost);
    const assembledTarget = hasTarget(assembledHost);
    const label = field.startsWith("option-")
      ? field.slice("option-".length).replace(/([A-Z])/g, " $1").toLowerCase()
      : FIELDS.find((candidate) => candidate.id === field)?.label ?? field;
    cue.hidden = visibleTarget;
    text.textContent = assembledTarget
      ? `${label} is highlighted in Assembled.`
      : `No direct highlight for ${label} in this view.`;
    action.hidden = !assembledTarget;
  };

  const readiness = (): StageReadiness => ({
    inputsOk: inputErrors().size === 0 && implausibleFields(measurements, recipe.fields).length === 0,
    styleReviewed,
    checksOk: designValid(),
    checkReviewed,
    exported: journey.exported,
  });
  const canExport = (): boolean => styleReviewed && checkReviewed && designValid();
  const stageBlocker = (): StageBlocker | undefined => {
    if (journey.step === "start") return undefined;
    const error = inputErrors().entries().next().value;
    const implausible = implausibleFields(measurements, recipe.fields)[0];
    if (error) return { message: error[1], field: error[0], step: correctionStepForField(error[0]) };
    if (implausible) return {
      message: "Review the highlighted measurement before continuing.", field: implausible, step: "measure",
    };
    if (journey.step === "refine" || journey.step === "output") {
      if (!styleReviewed) return { message: "Review your current fit and construction choices in Style.", step: "fit" };
      if (!designValid()) {
        return stageBlockerFromNote(currentNotes.find((candidate) => candidate.level === "warn"));
      }
    }
    return undefined;
  };

  const renderJourney = (): void => {
    const status = readiness();
    const parts: string[] = [];
    root.querySelector<HTMLElement>("#welcome-host")!.innerHTML = journey.step === "start" && !journey.familiar ? welcomeMarkup() : "";
    parts.push(journeyBarMarkup(journey.step, status, stageBlocker()));
    if (celebrating) parts.push(celebrationMarkup(status.checksOk));
    root.querySelector<HTMLElement>("#readiness-host")!.innerHTML = checklistMarkup(journeyChecklist(status));
    journeyHost.innerHTML = parts.join("");
    if (journey.step === "start" && !journey.familiar) root.querySelector<HTMLElement>("#journey-next")!.hidden = true;
  };
  const markOutputDirty = (designChanged = true): void => {
    if (historyRestoring) return;
    outputRevision++;
    if (designChanged) {
      ignoredGuidance.clear();
      styleReviewed = false;
      checkReviewed = false;
      if (journey.step === "output") journey = { ...journey, step: "refine" };
    }
    journey = { ...journey, exported: false };
    celebrating = false;
    saveJourney(journey);
    if (historyPresent) {
      const next = captureDraftSnapshot();
      if (!sameSnapshot(historyPresent, next)) {
        history = recordHistory(history, historyPresent, HISTORY_LIMIT);
        historyPresent = next;
      }
    }
    if (recoveryTrackingEnabled) saveRecoveryToStorage(captureRecoveryFile());
    syncHistoryControls();
  };
  const renderGuidance = (notes: readonly Note[]): void => {
    currentNotes = notes;
    guidanceHost.innerHTML = guidanceMarkup(notes, ignoredGuidance);
    const warnings = notes.filter((note) => note.level === "warn").length;
    root.querySelector<HTMLElement>("#guidance-details summary")!.textContent = warnings
      ? `⚠ ${warnings} to review · Guidance` : "Guidance & material advice";
  };

  /** Keep every SVG inside a bounded, keyboard-reachable inspection viewport.
   * The SVG's aspect ratio is preserved; portrait drawings get a capped height,
   * while unusually wide drawings get an intentional horizontal inspection
   * surface instead of making the entire page microscopic. */
  const applyInspectionPresentation = (): void => {
    const section = root.querySelector<HTMLElement>("#canvas-inspection");
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport");
    const content = root.querySelector<HTMLElement>(previewActive ? "#garment-host" : "#analysis-host");
    if (!section || !viewport || !content) return;
    const svgs = [...content.querySelectorAll<SVGSVGElement>("svg")];
    const title = section.querySelector<HTMLElement>("#inspection-title")?.textContent ?? "Canvas";
    svgs.forEach((svg, index) => {
      svg.classList.add("inspection-svg");
      svg.setAttribute("role", "img");
      if (!svg.getAttribute("aria-label")) {
        const label = view === "body" && svgs.length === 2
          ? `${title} ${index === 0 ? "front" : "back"}`
          : `${title} graphic`;
        svg.setAttribute("aria-label", label);
      }
    });
    const viewportWidth = Math.max(260, viewport.clientWidth - 16 || 560);
    const zoomOutput = root.querySelector<HTMLOutputElement>("#inspection-zoom");
    if (svgs.length === 0) {
      content.style.width = "100%";
      content.style.display = "block";
      if (zoomOutput) zoomOutput.textContent = "";
      return;
    }
    if (svgs.length > 1) {
      content.style.display = "block";
      content.style.width = `${Math.max(100, Math.round(inspectionZoom * 100))}%`;
      svgs.forEach((svg) => {
        svg.style.width = "100%";
        svg.style.height = "auto";
        svg.style.maxWidth = "none";
      });
      if (zoomOutput) zoomOutput.textContent = `${Math.round(inspectionZoom * 100)}%`;
      return;
    }
    const svg = svgs[0];
    const values = (svg.getAttribute("viewBox") ?? "0 0 100 100")
      .trim().split(/[ ,]+/).map(Number);
    const ratio = values.length === 4 && values[2] > 0 && values[3] > 0 ? values[2] / values[3] : 1;
    const maxHeight = Math.max(80, (viewport.clientHeight || 536) - 16);
    let height = Math.min(maxHeight, viewportWidth / ratio);
    let width = height * ratio;
    width *= inspectionZoom;
    height *= inspectionZoom;
    svg.style.width = `${Math.round(width)}px`;
    svg.style.height = `${Math.round(height)}px`;
    svg.style.maxWidth = "none";
    svg.style.display = "block";
    content.style.display = "flex";
    content.style.flexDirection = "column";
    content.style.alignItems = "center";
    content.style.width = `${Math.max(viewportWidth, Math.ceil(width))}px`;
    if (zoomOutput) zoomOutput.textContent = `${Math.round(inspectionZoom * 100)}%`;
  };

  /** Put actionable warnings beside the rendered seam or dimension they name.
   * The note is a screen overlay only: it never enters an SVG or an export. */
  const renderSpatialGuidance = (): void => {
    const host = root.querySelector<HTMLElement>("#spatial-guidance-host")!;
    const section = root.querySelector<HTMLElement>("#canvas-inspection");
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport");
    const targetHost = root.querySelector<HTMLElement>(previewActive ? "#garment-host" : "#analysis-host");
    const requiredSection = section!;
    const requiredViewport = viewport!;
    const requiredTargetHost = targetHost!;
    host.replaceChildren();
    const candidates = [...new Map(currentNotes
      .filter((note) => note.level === "warn" && note.field !== undefined && !ignoredGuidance.has(note.field))
      .map((note) => [note.field!, note])).values()];
    if (candidates.length === 0) return;
    const sectionRect = requiredSection.getBoundingClientRect();
    const viewportRect = requiredViewport.getBoundingClientRect();
    const targetElements = [...requiredTargetHost.querySelectorAll<SVGElement>("[data-dim], [data-edge]")];
    const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
    const targeted = candidates.map((note) => {
      const target = targetElements.find((element) => {
        const owns = element.dataset.dim ?? element.dataset.edge;
        if (owns !== note.field) return false;
        const rect = element.getBoundingClientRect();
        return (rect.width > 0 || rect.height > 0) && rect.right >= viewportRect.left &&
          rect.left <= viewportRect.right && rect.bottom >= viewportRect.top && rect.top <= viewportRect.bottom;
      });
      return target ? { note, target } : null;
    }).filter((entry): entry is { note: Note; target: SVGElement } => entry !== null);
    const visible = targeted.slice(0, 4);
    const placed: { left: number; top: number; width: number; height: number }[] = [];
    const connections: { note: HTMLElement; target: SVGElement }[] = [];
    visible.forEach(({ note, target }) => {
      const targetRect = target.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      const noteElement = document.createElement("article");
      noteElement.className = "spatial-guidance-note";
      noteElement.dataset.guidanceField = note.field!;
      noteElement.setAttribute("role", "note");
      const copy = document.createElement("span");
      copy.className = "spatial-guidance-copy";
      copy.textContent = note.text;
      const ignore = document.createElement("button");
      ignore.type = "button";
      ignore.dataset.ignoreGuidance = note.field!;
      ignore.textContent = "Ignore for this draft";
      ignore.setAttribute("aria-label", `Ignore ${note.field} guidance for this draft`);
      noteElement.append(copy, ignore);
      const widthLimit = viewportRect.width > 0 ? Math.max(160, Math.min(230, viewportRect.width - 20)) : 230;
      noteElement.style.width = `${widthLimit}px`;
      host.append(noteElement);
      const width = noteElement.getBoundingClientRect().width || widthLimit;
      const height = noteElement.getBoundingClientRect().height || 92;
      const minLeft = viewportRect.left - sectionRect.left + 10;
      const maxLeft = Math.max(minLeft, viewportRect.right - sectionRect.left - width - 10);
      const minTop = viewportRect.top - sectionRect.top + 10;
      const maxTop = Math.max(minTop, viewportRect.bottom - sectionRect.top - height - 10);
      const centerLeft = clamp(targetX - sectionRect.left - width / 2, minLeft, maxLeft);
      const options = [
        { left: minLeft, top: minTop }, { left: maxLeft, top: minTop },
        { left: minLeft, top: maxTop }, { left: maxLeft, top: maxTop },
        { left: centerLeft, top: minTop }, { left: centerLeft, top: maxTop },
      ];
      const overlapArea = (a: { left: number; top: number; width: number; height: number }, b: { left: number; top: number; width: number; height: number }): number =>
        Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));
      const targetBox = {
        left: targetRect.left - sectionRect.left - 8, top: targetRect.top - sectionRect.top - 8,
        width: targetRect.width + 16, height: targetRect.height + 16,
      };
      const choice = options.reduce((best, option) => {
        const candidate = { ...option, width, height };
        const overlap = placed.reduce((sum, existing) => sum + overlapArea(candidate, existing), 0);
        const targetOverlap = overlapArea(candidate, targetBox);
        const distance = Math.hypot(targetX - sectionRect.left - option.left - width / 2,
          targetY - sectionRect.top - option.top - height / 2);
        const score = targetOverlap * 100000 + overlap * 1000 + distance;
        return score < best.score ? { option, score } : best;
      }, { option: options[0], score: Number.POSITIVE_INFINITY }).option;
      const left = choice.left;
      const top = choice.top;
      noteElement.style.left = `${left}px`;
      noteElement.style.top = `${top}px`;
      placed.push({ left, top, width, height });
      connections.push({ note: noteElement, target });
    });
    connections.forEach(({ note, target }) => {
      const targetRect = target.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2;
      const targetY = targetRect.top + targetRect.height / 2;
      const noteRect = note.getBoundingClientRect();
      const startX = clamp(targetX, noteRect.left, noteRect.right);
      const startY = clamp(targetY, noteRect.top, noteRect.bottom);
      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.hypot(dx, dy);
      if (distance < 8) return;
      const connector = document.createElement("span");
      connector.className = "spatial-guidance-connector";
      connector.setAttribute("aria-hidden", "true");
      connector.style.left = `${startX - sectionRect.left}px`;
      connector.style.top = `${startY - sectionRect.top}px`;
      connector.style.width = `${distance}px`;
      connector.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
      host.append(connector);
    });
    if (candidates.length > visible.length) {
      const more = document.createElement("span");
      more.className = "spatial-guidance-more";
      more.textContent = `+${candidates.length - visible.length} more in Guidance`;
      host.append(more);
    }
  };

  /** Keep each boundary rail truthful after typing, a +/- action, a garment
   * switch, or a redraw. The input stays the source of truth; the rail is a
   * visual/accessibility projection of its declared range. */
  const syncRangeIndicators = (): void => {
    root.querySelectorAll<HTMLElement>("[data-range-control]").forEach((control) => {
      const input = control.querySelector<HTMLInputElement>("input");
      const rail = control.querySelector<HTMLElement>("[data-range-rail]");
      if (!input || !rail) return;
      const min = control.dataset.rangeMin === undefined ? undefined : Number(control.dataset.rangeMin);
      const max = control.dataset.rangeMax === undefined ? undefined : Number(control.dataset.rangeMax);
      const state = numericRangeState(input.value, min, max);
      const position = numericRangePosition(input.value, min, max);
      const raw = input.value.trim();
      const value = raw === "" ? NaN : Number(raw);
      const unit = control.dataset.rangeUnit ? ` ${control.dataset.rangeUnit}` : "";
      const markerColor = state === "valid" ? "#2E9B63"
        : state === "empty" ? BLUEPRINT.label : BLUEPRINT.lineActive;
      const marker = control.querySelector<HTMLElement>("[data-range-marker]");
      const fill = control.querySelector<HTMLElement>("[data-range-fill]");
      if (marker) {
        marker.style.display = position === null ? "none" : "block";
        marker.style.background = markerColor;
        if (position !== null) marker.style.left = `${Math.max(0, Math.min(100, position))}%`;
      }
      if (fill) {
        fill.style.width = position === null ? "0%" : `${Math.max(0, Math.min(100, position))}%`;
        fill.style.background = markerColor;
      }
      control.dataset.rangeState = state;
      rail.dataset.rangeState = state;
      const allowed = min === undefined || max === undefined
        ? "Open range"
        : `Allowed range ${min}–${max}${unit}`;
      const current = !Number.isFinite(value)
        ? "current value unavailable"
        : `current value ${value}${unit}${state === "under" ? " (below minimum)" : state === "over" ? " (above maximum)" : ""}`;
      rail.setAttribute("aria-label", `${allowed}; ${current}`);
      if (Number.isFinite(value)) input.setAttribute("aria-valuenow", String(value));
      else input.removeAttribute("aria-valuenow");
      control.querySelectorAll<HTMLButtonElement>("button[data-step-direction]").forEach((button) => {
        const direction = button.dataset.stepDirection;
        button.disabled = state === "valid" && ((direction === "-1" && min !== undefined && value <= min) ||
          (direction === "1" && max !== undefined && value >= max));
      });
    });
  };

  const draw = (): void => {
    applyDisclosure();
    const errors = inputErrors();
    const valid = designValid();
    root.querySelectorAll<HTMLElement>("[data-finished]").forEach((total) => {
      const value = measurements[total.dataset.finished as keyof Measurements] + measurements.ease;
      total.textContent = Number.isFinite(value) ? `${value} cm` : "Enter complete measurements";
    });
    root.querySelectorAll<HTMLInputElement>("[data-field], [data-option]").forEach((input) => {
      const key = input.dataset.field ?? `option-${input.dataset.option}`;
      const error = errors.get(key);
      input.setAttribute("aria-invalid", String(!!error));
      input.setCustomValidity(error ?? "");
      root.querySelector<HTMLElement>(`#error-${key}`)!.textContent = error ?? "";
    });
    syncRangeIndicators();
    root.querySelectorAll<HTMLButtonElement>('#export-host button[id^="export-"]').forEach((button) => {
      const needsArtwork = button.id === "export-surface-sheet" && surfacePlacementsNow().length === 0;
      button.disabled = !canExport() || needsArtwork;
      button.title = !canExport()
        ? "Review Style and the current digital checks before exporting."
        : needsArtwork ? "Add artwork on the Style panel first." : "";
    });
    if (errors.size > 0) {
      canvasHost.innerHTML = inspectionMarkup("<p role=\"status\">Draft paused — correct the flagged inputs to render your current design.</p>", previewActive ? "assembled" : view);
      renderGuidance([...errors.entries()].map(([field, text]) => ({ level: "warn", field, text })));
      styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle, recipe.styles), styleNames(recipe.styles), false) + renderSurface();
      syncSurfaceValidity();
      renderJourney();
      return;
    }
    // Presentation follows the recipe's declared body region. Legacy/custom
    // recipes without it retain the historical field-based fallback.
    const isTop = (recipe.region ?? (recipe.fields.includes("chest") ? "upper" : "lower")) === "upper";
    const isTrouser = recipe.name === "trouser";
    // A sleeveless top (the tank) still carries a `sleeveLength` value on
    // `measurements` (fields not shown in a garment's UI don't disappear from
    // the object) — without this check both figures would draw it with a
    // short sleeve regardless (Slice 60).
    const hasSleeve = recipe.fields.includes("sleeveLength");
    const fabricNote: Note = { level: "info", field: "ease", text: fabricEaseNote(stretchFabric, isTop ? measurements.chest : measurements.hip) };
    const failedChecks: Note[] = garmentReport(recipe, measurements, recipeOptions()).checks
      .filter((check) => !check.ok).map((check) => ({ field: CHECK_FIELDS[check.name], level: "warn", text: `${check.name}: ${check.detail}` }));
    const materialNote = materialCompatibilityNote();
    // Piece frames for surface bounds/coverage checks, at base size. Built
    // only when artwork exists, so empty styles cost nothing extra here.
    const surfaceFrames = surfacePlacementsNow().length === 0
      ? null
      : pieceFrames(draftCurrent(), recipe.allowances);
    const guidanceNotes: Note[] = [
      ...guide(recipe, measurements, recipeOptions()),
      ...failedChecks,
      fabricNote,
      ...(materialNote ? [materialNote] : []),
      // Surface artwork warnings ride the same panel: same warn-only contract,
      // same dismissal, same Review-to-control path. They never gate exports.
      ...surfaceGuidance(surfaceBook, surfaceKey(recipe.name, targetStyle), targetStyle,
        surfaceFrames ?? undefined),
      // Nesting-intelligence warnings are planning advice with the same
      // contract. They never pause the draft or gate exports.
      ...[...nestIntelErrors()].map(([field, text]) => ({ field, level: "warn" as const, text })),
    ];
    fabricWidthHost.style.display = view === "fabric" && !previewActive ? "flex" : "none";
    root.querySelector<HTMLElement>("#nest-intel-host")!.style.display =
      view === "fabric" && !previewActive ? "flex" : "none";
    bodyCroquisHost.style.display = view === "body" && !previewActive ? "flex" : "none";
    let canvasContent: string;
    if (view === "nest") {
      canvasContent = renderNest(
        gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, recipeOptions()));
    } else if (view === "fabric") {
      const nest = nestScope === "marker"
        ? gradedMarker(recipe, measurements, fabricWidth, recipeOptions())
        : nestPieces(blockPieces(draftAtSize(
          measurements, recipe.grade, exportStep, recipe.draft, recipeOptions()
        )).map((p) => flattenPiece(p, recipe.allowances)), fabricWidth);
      canvasContent = renderFabricNest(
        nest.placed, nest.fabricWidth, nest.fabricLength, nest.utilization, nest.fits);
      renderNestIntel(nest.fabricLength, nest.utilization);
    } else if (view === "check") {
      const dismissedGuidance = guidanceNotes.filter((note) =>
        note.level === "warn" && note.field !== undefined && ignoredGuidance.has(note.field));
      canvasContent = checkMarkup(garmentReport(recipe, measurements, recipeOptions()), valid, dismissedGuidance);
    } else if (view === "edit") {
      const piece = editedFront ?? rolePiece(draftCurrent(), recipe.editRole ?? "front");
      editedFront = piece;
      const vb = editorViewBox(piece);
      const hasDart = dartOf(piece) !== null;
      // Truing consumes `sideLower`, so only offer it while both halves still exist
      // AND the dart has moved off the side (leaving the two halves touching).
      const sideSplit = ["sideUpper", "sideLower"].every((n) =>
        piece.edges.some((e) => e.name === n));
      const canTrue = hasDart && sideSplit && edgesMeet(piece, "sideUpper", "sideLower");
      canvasContent =
        renderEditor(piece, pieceHandles(piece), vb, selectedId) +
        editorHintMarkup() +
        editorHandleControlsMarkup(pieceHandles(piece)) +
        dartControlsMarkup(hasDart, canTrue);
    } else if (view === "spec") {
      const graded = gradeRun(measurements, recipe.grade, recipe.sizes, recipe.draft, recipeOptions());
      const baseIndex = graded.findIndex((g) => g.step === 0);
      canvasContent = specTableMarkup(
        specSheet(graded, recipe.poms), graded.map((g) => g.label), baseIndex);
    } else if (view === "body") {
      if (bodyCroquisView === "side") {
        canvasContent = isTrouser
          ? renderTrouserSide(measurements, recipeOptions())
          : renderSideCroquis(measurements, isTop ? "upper" : "lower");
      } else if (!isTop) {
        canvasContent = isTrouser
          ? bodyCroquisView === "front"
            ? renderTrouserBody(measurements, recipeOptions(), "front")
            : bodyCroquisView === "back"
              ? renderTrouserBody(measurements, recipeOptions(), "back")
              : renderTrouserBodyPair(measurements, recipeOptions())
          : renderSkirtBody(measurements);
      } else if (bodyCroquisView === "front") {
        canvasContent = renderBody(measurements, hasSleeve, recipe.frontNeckline?.(measurements), recipe.strapWidth?.(measurements), "front", poloVisual(), wovenBodyNeckline(), wovenBodyLowerShape());
      } else if (bodyCroquisView === "back") {
        canvasContent = renderBody(measurements, hasSleeve, recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), "back", poloVisual(), wovenBodyNeckline(), wovenBodyLowerShape());
      } else {
        canvasContent = renderBodyPair(measurements, hasSleeve, recipe.frontNeckline?.(measurements), recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), poloVisual(), wovenBodyNeckline(), wovenBodyLowerShape());
      }
    } else {
      const block = draftCurrent();
      const pieces = blockPieces(block);
      canvasContent = renderBlueprint(
        pieces,
        { active: pieces[0].name, notches: recipe.notches, allowances: recipe.allowances,
          layout: recipe.name === "polo" ? "polo" : "linear" });
    }
    const assembled = isTop
      ? renderGarment(measurements, fabric, hasSleeve,
          recipe.frontNeckline?.(measurements), recipe.backNeckline?.(measurements), recipe.strapWidth?.(measurements), poloVisual(), wovenShirtVisual())
      : isTrouser
        ? renderTrouserGarment(measurements, fabric, recipeOptions())
        : renderSkirtGarment(measurements, fabric);
    const assembledPreview = applyAppearanceToSvg(assembled, fabric, appearance);
    canvasHost.innerHTML = inspectionMarkup(
      `<div id="analysis-host"${previewActive ? " hidden" : ""}>${canvasContent}</div>` +
      `<div id="garment-host"${previewActive ? "" : " hidden"}>${assembledPreview}</div>`,
      previewActive ? "assembled" : view,
    );
    syncRangeIndicators();
    applyInspectionPresentation();
    // One sanity read for the whole frame: are the numbers a real body? It gates
    // every green "validated" signal — the check banner, the style ✓ — and flags
    // the offending fields, so geometry passing can never masquerade as "ready".
    const plausible = valid;
    renderGuidance(guidanceNotes);
    // Style = prescriptive: the gap from current measurements to the chosen target.
    styleHost.innerHTML = styleMarkup(targetStyle, matchStyle(measurements, targetStyle, recipe.styles), styleNames(recipe.styles), plausible) + renderSurface();
    syncSurfaceValidity();
    // Amber-outline any measurement input whose value is out of plausible range
    // (same outline convention as the fabric swatches). Controls aren't re-rendered
    // per draw, so this is applied imperatively.
    const flagged = new Set<string>(implausibleFields(measurements, recipe.fields));
    root.querySelectorAll<HTMLInputElement>("[data-field]").forEach((inp) => {
      inp.style.outline = flagged.has(inp.dataset.field!) ? `2px solid ${BLUEPRINT.lineActive}` : "";
    });
    // The body SVG was just re-rendered; restore any active dimension spotlight.
    if (activeDim !== null) spotlight(activeDim);
    renderJourney();
    // The journey blocker can change the canvas height; place notes against the
    // settled inspection frame rather than the pre-banner geometry.
    renderSpatialGuidance();
  };

  const viewBtns = {
    pattern: root.querySelector<HTMLButtonElement>("#view-pattern")!,
    body: root.querySelector<HTMLButtonElement>("#view-body")!,
    nest: root.querySelector<HTMLButtonElement>("#view-nest")!,
    spec: root.querySelector<HTMLButtonElement>("#view-spec")!,
    fabric: root.querySelector<HTMLButtonElement>("#view-fabric")!,
    check: root.querySelector<HTMLButtonElement>("#view-check")!,
    edit: root.querySelector<HTMLButtonElement>("#view-edit")!,
  };
  const bodyCroquisHost = root.querySelector<HTMLElement>("#body-croquis-toggle-host")!;
  const bodyCroquisBtns = {
    frontBack: root.querySelector<HTMLButtonElement>("#body-front-back")!,
    front: root.querySelector<HTMLButtonElement>("#body-front")!,
    back: root.querySelector<HTMLButtonElement>("#body-back")!,
    side: root.querySelector<HTMLButtonElement>("#body-side")!,
  };
  const syncBodyCroquisButton = (button: HTMLButtonElement, on: boolean): void => {
    button.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
    button.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
    button.setAttribute("aria-pressed", String(on));
  };
  const setBodyCroquisView = (v: BodyCroquisView): void => {
    bodyCroquisView = v;
    syncBodyCroquisButton(bodyCroquisBtns.frontBack, v === "front-back");
    syncBodyCroquisButton(bodyCroquisBtns.front, v === "front");
    syncBodyCroquisButton(bodyCroquisBtns.back, v === "back");
    syncBodyCroquisButton(bodyCroquisBtns.side, v === "side");
    draw();
  };
  const setView = (v: "pattern" | "body" | "nest" | "spec" | "fabric" | "check" | "edit"): void => {
    if (v === "edit" && editedFront === null && inputErrors().size === 0) editedFront = rolePiece(draftCurrent(), recipe.editRole ?? "front");
    view = v;
    if (v === "check" && journey.step === "refine") checkReviewed = true;
    previewActive = false;
    inactiveInspection = { zoom: 1, left: 0, top: 0 };
    syncPreviewToggle();
    inspectionZoom = 1;
    (["pattern", "body", "nest", "spec", "fabric", "check", "edit"] as const).forEach((k) => {
      const on = k === v;
      viewBtns[k].style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      viewBtns[k].style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
      viewBtns[k].setAttribute("aria-pressed", String(on));
    });
    const advancedViews = root.querySelector<HTMLDetailsElement>("#advanced-views")!;
    const fromMenu = advancedViews.open;
    advancedViews.open = false;
    root.querySelector<HTMLElement>("#advanced-view-label")!.textContent = v === "pattern" || v === "body" ? "More views" : viewBtns[v].textContent;
    bodyCroquisHost.style.display = v === "body" ? "flex" : "none";
    draw();
    if (fromMenu) root.querySelector<HTMLElement>("#advanced-view-label")!.focus();
  };
  viewBtns.pattern.addEventListener("click", () => setView("pattern"));
  viewBtns.body.addEventListener("click", () => setView("body"));
  viewBtns.nest.addEventListener("click", () => setView("nest"));
  viewBtns.spec.addEventListener("click", () => setView("spec"));
  viewBtns.fabric.addEventListener("click", () => setView("fabric"));
  viewBtns.check.addEventListener("click", () => setStep("refine"));
  viewBtns.edit.addEventListener("click", () => setView("edit"));
  bodyCroquisBtns.frontBack.addEventListener("click", () => setBodyCroquisView("front-back"));
  bodyCroquisBtns.front.addEventListener("click", () => setBodyCroquisView("front"));
  bodyCroquisBtns.back.addEventListener("click", () => setBodyCroquisView("back"));
  bodyCroquisBtns.side.addEventListener("click", () => setBodyCroquisView("side"));

  // Progressive disclosure: each journey step reveals only what it needs; the
  // advanced views stay one click away once unlocked, never front-loaded.
  const applyDisclosure = (): void => {
    const d = disclosureFor(journey.step);
    root.querySelector<HTMLElement>("#infini-shell")!.dataset.stage = journey.step;
    root.querySelector<HTMLElement>("#current-garment")!.textContent = recipe.label;
    root.querySelector<HTMLElement>("#garment-toggle-host")!.style.display = journey.step === "start" ? "flex" : "none";
    root.querySelector<HTMLElement>("#controls-panel")!.style.display = d.controls ? "" : "none";
    root.querySelector<HTMLElement>("#stretch-host")!.style.display = d.stretch ? "flex" : "none";
    root.querySelector<HTMLElement>("#swatch-host")!.style.display = d.swatches ? "flex" : "none";
    root.querySelector<HTMLElement>("#export-host")!.style.display = d.exports ? "flex" : "none";
    styleHost.style.display = d.style ? "" : "none";
    guidanceHost.style.display = d.guidance ? "" : "none";
    root.querySelector<HTMLElement>("#guidance-details")!.hidden = !d.guidance;
    root.querySelector<HTMLElement>("#readiness-details")!.hidden = journey.step !== "refine" && journey.step !== "output";
    const context = root.querySelector<HTMLElement>("#review-context")!;
    context.hidden = journey.step !== "refine" && journey.step !== "output";
    context.textContent = journey.step === "output"
      ? "Choose a size, then a cutting or reference file. Digital checks are not physical fit validation."
      : "Review the current draft and any guidance before exporting. Digital checks do not replace a sewn sample.";
    root.querySelector<HTMLElement>("#view-toggle-host")!.style.display = "flex";
    bodyCroquisHost.style.display = view === "body" && !previewActive && d.views.includes("body") ? "flex" : "none";
    root.querySelector<HTMLElement>("#advanced-views")!.hidden = journey.step === "start";
    syncControlPages();
  };

  const setStep = (s: JourneyStep): void => {
    if (s === "output" && !canExport()) return;
    journey = { ...journey, step: s, familiar: true };
    saveJourney(journey);
    celebrating = false;
    applyDisclosure();
    root.querySelector<HTMLElement>("#studio-inspector")!.scrollTop = 0;
    setView(stepView(s));
    root.querySelector<HTMLElement>('#journey-host [aria-current="step"]')!.focus();
  };

  const focusGuidanceField = (field: string): void => {
    setStep(correctionStepForField(field));
    const control = root.querySelector<HTMLElement>(`[data-guidance-control="${field}"]`);
    if (!control) return;
    const page = control.closest<HTMLElement>("[data-control-page]");
    if (page) setControlPage(Number(page.dataset.controlPage));
    control.focus();
  };

  // The journey host is rebuilt every draw, so its clicks are delegated.
  root.addEventListener("click", (e) => {
    const element = e.target as HTMLElement;
    const menu = root.querySelector<HTMLDetailsElement>("#advanced-views")!;
    if (menu.open && !menu.contains(element)) menu.open = false;
    const target = element.closest<HTMLElement>("button");
    if (!target) return;
    const id = target.id;
    const idx = COACHED_STEPS.findIndex((st) => st.id === journey.step);
    if (id === "welcome-start" || id === "welcome-skip") {
      setStep("measure");
    } else if (id === "journey-next" && !stageBlocker()) {
      if (journey.step === "fit") styleReviewed = true;
      setStep(COACHED_STEPS[Math.min(idx + 1, COACHED_STEPS.length - 1)].id);
    } else if (id === "journey-back") {
      setStep(COACHED_STEPS[Math.max(idx - 1, 0)].id);
    } else if (id === "journey-correction") {
      const field = target.dataset.correctionField;
      if (field) focusGuidanceField(field);
      else setStep(target.dataset.correctionStep as JourneyStep);
    } else if (id === "celebrate-dismiss") {
      celebrating = false;
      renderJourney();
    } else if (id.startsWith("journey-step-")) {
      setStep(id.slice("journey-step-".length) as JourneyStep);
    }
  });
  root.addEventListener("keydown", (event) => {
    const menu = root.querySelector<HTMLDetailsElement>("#advanced-views")!;
    if (event.key !== "Escape" || !menu.open) return;
    menu.open = false;
    root.querySelector<HTMLElement>("#advanced-view-label")!.focus();
  });
  window.addEventListener("resize", applyInspectionPresentation);

  const previewToggle = root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!;
  const syncPreviewToggle = (): void => {
    previewToggle.setAttribute("aria-pressed", String(previewActive));
    previewToggle.textContent = previewActive ? `↩ ${viewBtns[view].textContent}` : "Assembled";
    previewToggle.setAttribute("aria-label", previewActive ? `Return to ${viewBtns[view].textContent} view` : "Show assembled preview");
  };
  previewToggle.addEventListener("click", () => {
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    const current = { zoom: inspectionZoom, left: viewport.scrollLeft, top: viewport.scrollTop };
    previewActive = !previewActive;
    inspectionZoom = inactiveInspection.zoom;
    syncPreviewToggle();
    draw();
    const nextViewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    nextViewport.scrollLeft = inactiveInspection.left;
    nextViewport.scrollTop = inactiveInspection.top;
    inactiveInspection = current;
  });
  root.querySelector<HTMLButtonElement>("#spatial-cue-action")!.addEventListener("click", () => {
    if (!previewActive) previewToggle.click();
  });
  canvasHost.addEventListener("click", (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-ignore-guidance], button[data-restore-guidance]");
    if (!target) return;
    const field = target.dataset.ignoreGuidance ?? target.dataset.restoreGuidance;
    if (!field) return;
    if (target.dataset.ignoreGuidance) ignoredGuidance.add(field);
    else ignoredGuidance.delete(field);
    draw();
  });

  const syncControlPages = (): void => {
    const stage = journey.step === "fit" ? "fit" : "measure";
    const pages = [...root.querySelectorAll<HTMLElement>("[data-control-page]")];
    const available = pages.filter((page) => page.dataset.controlStage === stage);
    const current = available.find((page) => Number(page.dataset.controlPage) === selectedControlPages.get(stage)) ?? available[0];
    pages.forEach((page) => { page.hidden = page !== current; });
    const select = root.querySelector<HTMLSelectElement>("#control-page-select")!;
    select.replaceChildren(...available.map((page, index) =>
      new Option(`${index + 1} / ${available.length} · ${page.dataset.controlLabel}`, page.dataset.controlPage)));
    select.value = current.dataset.controlPage!;
    const position = available.indexOf(current);
    root.querySelector<HTMLButtonElement>('[data-control-page-step="-1"]')!.disabled = position === 0;
    root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.disabled = position === available.length - 1;
  };
  const setControlPage = (index: number): void => {
    selectedControlPages.set(journey.step === "fit" ? "fit" : "measure", index);
    syncControlPages();
  };
  root.addEventListener("change", (event) => {
    const target = event.target as HTMLSelectElement;
    if (target.id === "control-page-select") setControlPage(Number(target.value));
  });
  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-control-page-step]");
    if (!button || button.disabled) return;
    const select = root.querySelector<HTMLSelectElement>("#control-page-select")!;
    const next = select.options[select.selectedIndex + Number(button.dataset.controlPageStep)];
    setControlPage(Number(next.value));
  });

  // Guidance rows are rebuilt every draw, so the stable host delegates their
  // correction affordance back to the matching control. This keeps warnings
  // actionable even when the controls are far away or the panel has wrapped.
  guidanceHost.addEventListener("click", (e) => {
    const element = e.target as HTMLElement;
    const restore = element.closest<HTMLButtonElement>("button[data-restore-guidance]");
    if (restore) {
      const field = restore.dataset.restoreGuidance;
      if (field) {
        ignoredGuidance.delete(field);
        draw();
      }
      return;
    }
    // Panel rows carry the same Set-aside affordance as canvas spatial cues,
    // so warnings without a canvas target (surface artwork) can be dismissed too.
    const ignore = element.closest<HTMLButtonElement>("button[data-ignore-guidance]");
    if (ignore) {
      const field = ignore.dataset.ignoreGuidance;
      if (field) {
        ignoredGuidance.add(field);
        draw();
      }
      return;
    }
    const target = element.closest<HTMLButtonElement>("button[data-guidance-focus]");
    if (!target) return;
    const field = target.dataset.guidanceFocus;
    if (!field) return;
    focusGuidanceField(field);
  });

  // Freeform drag: pointer -> nearest handle -> moveHandle -> redraw. All the
  // maths is pure (edit engine); these three handlers are the only impure glue.
  const handleAt = (e: MouseEvent): { handle: Handle | null; at: ReturnType<typeof viewboxPointToCm> } => {
    const svg = canvasHost.querySelector("svg")!;
    const piece = editedFront!;
    const vb = editorViewBox(piece);
    const at = viewboxPointToCm(e.clientX, e.clientY, svg.getBoundingClientRect(), vb);
    return { handle: nearestHandle(pieceHandles(piece), at, 2), at };
  };
  canvasHost.addEventListener("mousedown", (e) => {
    if (view !== "edit" || previewActive || inputErrors().size > 0) return;
    const hit = handleAt(e);
    if (hit.handle) {
      dragId = hit.handle.id;
      selectedId = hit.handle.id;
      draw();
    }
  });
  canvasHost.addEventListener("change", (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>("input[data-editor-coordinate]");
    if (!input || !editedFront) return;
    const axis = input.dataset.editorAxis;
    const raw = input.value.trim();
    const value = raw === "" ? NaN : Number(raw);
    if ((axis !== "x" && axis !== "y") || !Number.isFinite(value)) {
      input.setAttribute("aria-invalid", "true");
      input.setCustomValidity("Enter a finite coordinate.");
      return;
    }
    input.setAttribute("aria-invalid", "false");
    input.setCustomValidity("");
    const handle = pieceHandles(editedFront).find((candidate) => candidate.id === input.dataset.editorHandleId);
    if (!handle) return;
    editedFront = moveHandle(editedFront, handle, { ...handle.pos, [axis]: value });
    selectedId = handle.id;
    draw();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragId) return;
    const piece = editedFront!;
    const handle = pieceHandles(piece).find((h) => h.id === dragId)!;
    editedFront = moveHandle(piece, handle, handleAt(e).at);
    draw();
  });
  window.addEventListener("mouseup", () => { dragId = null; });
  // The dart tools pivot the snapshot about the apex. Like every edit-view change,
  // they are a manual override: they never touch `measurements` or the recipe.
  const DART_TOOLS: Record<string, (p: Piece) => Piece> = {
    "dart-shoulder": (p) => transferDart(p, "shoulder", 0.5, "centerFront"),
    "dart-hem": (p) => transferDart(p, "hem", 0.5, "centerFront"),
    "dart-true": (p) => trueSeam(p, "sideUpper", "sideLower"),
  };
  canvasHost.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const zoomButton = target.closest<HTMLButtonElement>("button[data-inspection-zoom]");
    if (zoomButton) {
      const action = zoomButton.dataset.inspectionZoom;
      inspectionZoom = action === "fit" ? 1
        : action === "in" ? Math.min(2.5, inspectionZoom + 0.25)
          : Math.max(0.5, inspectionZoom - 0.25);
      applyInspectionPresentation();
      return;
    }
    const id = target.id;
    if (id === "editor-reset") {
      editedFront = rolePiece(draftCurrent(), recipe.editRole ?? "front");
      selectedId = null;
      draw();
    } else if (DART_TOOLS[id] && editedFront) {
      editedFront = DART_TOOLS[id](editedFront);
      selectedId = null;
      draw();
    }
  });

  const setGarment = (name: string): void => {
    recipe = garmentByName(name);
    if (!materialSelectionExplicit) {
      const defaultMaterial = defaultStretchFabricForGarment(recipe.name);
      stretchFabric = STRETCH_FABRICS.find((f) => f.name === defaultMaterial)!;
      stretchSelect.value = stretchFabric.name;
      syncMaterialCards();
    }
    selectedControlPages.clear();
    hoveredDim = null;
    focusedDim = null;
    highlightDim(null);
    syncBodyCroquisButton(bodyCroquisBtns.frontBack, bodyCroquisView === "front-back");
    syncBodyCroquisButton(bodyCroquisBtns.front, bodyCroquisView === "front");
    syncBodyCroquisButton(bodyCroquisBtns.back, bodyCroquisView === "back");
    syncBodyCroquisButton(bodyCroquisBtns.side, bodyCroquisView === "side");
    targetStyle = recipe.styles[0].name; // the old target may not exist for this garment
    GARMENTS.forEach((g) => {
      const btn = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      btn.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      btn.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
      btn.setAttribute("aria-pressed", String(on));
    });
    editedFront = null; // a new garment invalidates the freeform snapshot
    selectedId = null;
    // Re-render the measurement panel to this garment's fields (a skirt shows
    // waist/hip, not chest/sleeve), then re-attach its listeners.
    root.querySelector<HTMLElement>("#controls-panel")!.outerHTML = controlsMarkup(
      measurements, recipe.fields, recipe.options, recipeOptions());
    wireMeasurementInputs();
    syncExportSizes();
    if (view === "edit" && inputErrors().size === 0) editedFront = rolePiece(draftCurrent(), recipe.editRole ?? "front");
    applyDisclosure();
    markOutputDirty();
    draw();
  };
  GARMENTS.forEach((g) => {
    root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!
      .addEventListener("click", () => setGarment(g.name));
  });

  const widthInput = root.querySelector<HTMLInputElement>("#fabric-width")!;
  widthInput.addEventListener("input", () => {
    const v = Number(widthInput.value);
    if (Number.isFinite(v) && v > 0) {
      fabricWidth = v;
      markOutputDirty(false);
      draw();
    }
  });

  const single = root.querySelector<HTMLButtonElement>("#nest-single")!;
  const marker = root.querySelector<HTMLButtonElement>("#nest-marker")!;  const setScope = (s: "single" | "marker"): void => {
    nestScope = s;
    markOutputDirty(false);
    single.style.background = s === "single" ? BLUEPRINT.lineActive : "transparent";
    single.style.color = s === "single" ? BLUEPRINT.background : BLUEPRINT.label;
    single.setAttribute("aria-pressed", String(s === "single"));
    marker.style.background = s === "marker" ? BLUEPRINT.lineActive : "transparent";
    marker.style.color = s === "marker" ? BLUEPRINT.background : BLUEPRINT.label;
    marker.setAttribute("aria-pressed", String(s === "marker"));
    draw();
  };
  single.addEventListener("click", () => setScope("single"));
  marker.addEventListener("click", () => setScope("marker"));

  // Nesting-intelligence planning inputs. Raw strings stay verbatim (invalid
  // included); the estimators only ever see validated numbers. Planning edits
  // never pause the draft — they mark output dirty like fabric-width edits.
  const bufferInput = root.querySelector<HTMLInputElement>("#nest-buffer")!;
  bufferInput.addEventListener("input", () => {
    nestBufferRaw = bufferInput.value;
    markOutputDirty(false);
    draw();
  });
  const availableInput = root.querySelector<HTMLInputElement>("#nest-available")!;
  availableInput.addEventListener("input", () => {
    nestAvailableRaw = availableInput.value;
    markOutputDirty(false);
    draw();
  });
  const napInput = root.querySelector<HTMLInputElement>("#nest-nap")!;
  napInput.addEventListener("change", () => {
    nestNap = napInput.checked;
    markOutputDirty(false);
    draw();
  });
  const syncNestIntelInputs = (): void => {
    bufferInput.value = nestBufferRaw;
    availableInput.value = nestAvailableRaw;
    napInput.checked = nestNap;
  };
  // Wire the measurement rows: value inputs + body-view hover linking. Extracted
  // so it can re-run after the controls panel is re-rendered on a garment switch
  // (a garment with different fields renders different inputs).
  const highlightDim = (field: string | null): void => {
    activeDim = field;
    spotlight(field);
  };
  const syncDimSpotlight = (): void => highlightDim(focusedDim ?? hoveredDim);
  const wireMeasurementInputs = (): void => {
    root.querySelectorAll<HTMLInputElement>("input[data-field]").forEach((input) => {
      const field = FIELDS.find((f) => f.id === input.dataset.field)!;
      input.addEventListener("input", () => {
        measurements = applyChange(measurements, field, input.value);
        markOutputDirty();
        draw();
      });
    });
    root.querySelectorAll<HTMLInputElement>("input[data-option]").forEach((input) => {
      const id = input.dataset.option!;
      input.addEventListener("input", () => {
        const value = input.value.trim() === "" ? NaN : Number(input.value);
        garmentOptions = {
          ...garmentOptions,
          [recipe.name]: { ...recipeOptions(), [id]: value },
        };
        editedFront = null;
        markOutputDirty();
        draw();
      });
    });
    root.querySelectorAll<HTMLElement>("[data-dim-row]").forEach((row) => {
      const field = row.dataset.dimRow!;
      row.addEventListener("mouseenter", () => {
        hoveredDim = field;
        syncDimSpotlight();
      });
      row.addEventListener("mouseleave", () => {
        if (hoveredDim === field) hoveredDim = null;
        syncDimSpotlight();
      });
      row.addEventListener("focusin", () => {
        focusedDim = field;
        syncDimSpotlight();
      });
      row.addEventListener("focusout", () => {
        if (focusedDim === field) focusedDim = null;
        syncDimSpotlight();
      });
    });
  };
  wireMeasurementInputs();

  // +/- buttons are delegated from the stable root because controls are
  // replaced when the garment changes and editor coordinates are rebuilt on
  // every edit. A short delay followed by a steady repeat makes click/hold
  // useful without changing the direct-entry or validation contract.
  let activeStepper: HTMLButtonElement | null = null;
  let repeatDelay = 0;
  let repeatInterval = 0;
  let suppressNextStepperClick: HTMLButtonElement | null = null;
  const stopStepperRepeat = (suppressClick: boolean): void => {
    if (repeatDelay !== 0) window.clearTimeout(repeatDelay);
    if (repeatInterval !== 0) window.clearInterval(repeatInterval);
    if (suppressClick && activeStepper) suppressNextStepperClick = activeStepper;
    repeatDelay = 0;
    repeatInterval = 0;
    activeStepper = null;
  };
  const stepFromButton = (button: HTMLButtonElement): HTMLButtonElement | null => {
    if (button.disabled) return null;
    const control = button.closest<HTMLElement>("[data-range-control]");
    const input = control?.querySelector<HTMLInputElement>("input");
    if (!control || !input) return null;
    const step = Number(control.dataset.rangeStep);
    if (!Number.isFinite(step) || step <= 0) return null;
    const min = control.dataset.rangeMin === undefined ? undefined : Number(control.dataset.rangeMin);
    const max = control.dataset.rangeMax === undefined ? undefined : Number(control.dataset.rangeMax);
    const direction: -1 | 1 = button.dataset.stepDirection === "1" ? 1 : -1;
    input.value = stepNumericValue(input.value, direction, step, min, max);
    const eventName = input.matches("[data-editor-coordinate]") ? "change"
      : input.matches("[data-surface-index]") ? "surface-step" : "input";
    input.dispatchEvent(new Event(eventName, { bubbles: true }));
    const nextInput = input.id ? root.querySelector<HTMLInputElement>(`#${input.id}`) : input;
    nextInput?.focus();
    return root.querySelector<HTMLButtonElement>(
      `button[data-step-target="${control.dataset.rangeControl}"][data-step-direction="${direction}"]`
    );
  };
  root.addEventListener("pointerdown", (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-step-direction]");
    if (!button || button.disabled) return;
    e.preventDefault();
    stopStepperRepeat(false);
    suppressNextStepperClick = null;
    activeStepper = stepFromButton(button);
    if (!activeStepper) return;
    repeatDelay = window.setTimeout(() => {
      if (!activeStepper || activeStepper.disabled || !root.contains(activeStepper)) {
        stopStepperRepeat(false);
        return;
      }
      repeatDelay = 0;
      repeatInterval = window.setInterval(() => {
        const current = activeStepper;
        if (!current || current.disabled || !root.contains(current)) {
          stopStepperRepeat(false);
          return;
        }
        activeStepper = stepFromButton(current) ?? current;
      }, 80);
    }, 350);
  });
  root.addEventListener("click", (e) => {
    const button = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-step-direction]");
    if (!button) return;
    if (suppressNextStepperClick === button) {
      suppressNextStepperClick = null;
      return;
    }
    stepFromButton(button);
  });
  window.addEventListener("pointerup", () => stopStepperRepeat(true));
  window.addEventListener("pointercancel", () => stopStepperRepeat(true));
  window.addEventListener("blur", () => stopStepperRepeat(false));

  const swatchHost = root.querySelector<HTMLElement>("#swatch-host")!;
  const swatches = swatchHost.querySelectorAll<HTMLButtonElement>("button[data-fabric]");
  const syncAppearanceControls = (): void => {
    const hsl = hexToHsl(fabric)!;
    const hex = swatchHost.querySelector<HTMLInputElement>("#appearance-hex")!;
    const native = swatchHost.querySelector<HTMLInputElement>("#appearance-color-native")!;
    const lightness = swatchHost.querySelector<HTMLInputElement>("#appearance-lightness")!;
    const shine = swatchHost.querySelector<HTMLInputElement>("#appearance-shine")!;
    const wheel = swatchHost.querySelector<HTMLElement>("#appearance-wheel")!;
    const knob = swatchHost.querySelector<HTMLElement>("[data-wheel-knob]")!;
    const angle = (hsl.h - 90) * Math.PI / 180;
    hex.value = fabric;
    native.value = fabric;
    lightness.value = String(Math.round(hsl.l * 100));
    shine.value = String(appearance.shine);
    swatchHost.querySelector<HTMLElement>("#appearance-lightness-output")!.textContent = `${lightness.value}%`;
    swatchHost.querySelector<HTMLElement>("#appearance-shine-output")!.textContent = `${shine.value}%`;
    swatchHost.querySelector<HTMLElement>("#appearance-readout")!.textContent = `${fabric} · H ${Math.round(hsl.h)}°`;
    swatchHost.querySelector<HTMLElement>(".appearance-current-chip")!.style.background = fabric;
    wheel.style.setProperty("--wheel-hue", `${hsl.h}deg`);
    wheel.setAttribute("aria-valuenow", String(Math.round(hsl.h)));
    wheel.setAttribute("aria-valuetext", `Hue ${Math.round(hsl.h)}, saturation ${Math.round(hsl.s * 100)} percent`);
    knob.style.left = `${50 + Math.cos(angle) * hsl.s * 42}%`;
    knob.style.top = `${50 + Math.sin(angle) * hsl.s * 42}%`;
    swatches.forEach((swatch) => {
      const on = swatch.dataset.fabric === fabric;
      swatch.style.outline = on ? `2px solid ${BLUEPRINT.lineActive}` : "none";
      swatch.setAttribute("aria-pressed", String(on));
    });
    swatchHost.querySelectorAll<HTMLButtonElement>("[data-texture]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.texture === appearance.texture));
    });
    const toggle = swatchHost.querySelector<HTMLButtonElement>("#appearance-toggle")!;
    const panel = swatchHost.querySelector<HTMLElement>("#appearance-editor")!;
    toggle.setAttribute("aria-expanded", String(appearanceOpen));
    panel.hidden = !appearanceOpen;
  };
  const commitColor = (value: string): boolean => {
    const next = normalizeHex(value.trim());
    const status = swatchHost.querySelector<HTMLElement>("#appearance-hex-status")!;
    const hex = swatchHost.querySelector<HTMLInputElement>("#appearance-hex")!;
    if (!next) {
      status.textContent = "Use #RRGGBB";
      hex.setCustomValidity("Enter a six-digit hexadecimal color.");
      return false;
    }
    status.textContent = "";
    hex.setCustomValidity("");
    fabric = next;
    markOutputDirty(false);
    syncAppearanceControls();
    draw();
    return true;
  };
  const commitAppearance = (next: Appearance): void => {
    appearance = next;
    markOutputDirty(false);
    syncAppearanceControls();
    draw();
  };
  swatches.forEach((swatch) => swatch.addEventListener("click", () => commitColor(swatch.dataset.fabric!)));
  const chooseWheelColor = (clientX: number, clientY: number): void => {
    const wheel = swatchHost.querySelector<HTMLElement>("#appearance-wheel")!;
    const rect = wheel.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    if (radius <= 0) return;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
    const saturation = Math.min(1, Math.hypot(dx, dy) / radius);
    const hsl = hexToHsl(fabric)!;
    commitColor(hslToHex(hue, saturation, hsl.l));
  };
  swatchHost.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const toggle = target.closest<HTMLButtonElement>("#appearance-toggle");
    if (toggle) {
      appearanceOpen = !appearanceOpen;
      syncAppearanceControls();
      if (appearanceOpen) {
        const panel = swatchHost.querySelector<HTMLElement>("#appearance-editor")!;
        if (typeof panel.scrollIntoView === "function") panel.scrollIntoView({ block: "nearest" });
      }
      return;
    }
    const texture = target.closest<HTMLButtonElement>("[data-texture]");
    if (texture && APPEARANCE_TEXTURES.some((option) => option.id === texture.dataset.texture)) {
      commitAppearance({ ...appearance, texture: texture.dataset.texture as Appearance["texture"] });
    }
  });
  swatchHost.addEventListener("change", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.id === "appearance-hex") commitColor(input.value);
  });
  swatchHost.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.id === "appearance-hex") {
      if (input.value.length === 7) commitColor(input.value);
    } else if (input.id === "appearance-color-native") {
      commitColor(input.value);
    } else if (input.id === "appearance-lightness") {
      const hsl = hexToHsl(fabric)!;
      commitColor(hslToHex(hsl.h, hsl.s, Number(input.value) / 100));
    } else if (input.id === "appearance-shine") {
      const shine = Number(input.value);
      if (Number.isFinite(shine) && shine >= 0 && shine <= 100) commitAppearance({ ...appearance, shine });
    }
  });
  swatchHost.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest("#appearance-wheel")) chooseWheelColor(e.clientX, e.clientY);
  });
  swatchHost.addEventListener("pointermove", (e) => {
    if (e.buttons > 0 && (e.target as HTMLElement).closest("#appearance-wheel")) chooseWheelColor(e.clientX, e.clientY);
  });
  swatchHost.addEventListener("keydown", (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest("#appearance-wheel")) return;
    const hsl = hexToHsl(fabric)!;
    let hue = hsl.h;
    let saturation = hsl.s;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") hue += e.key === "ArrowRight" ? 5 : -5;
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") saturation += e.key === "ArrowUp" ? 0.05 : -0.05;
    else return;
    e.preventDefault();
    commitColor(hslToHex(hue, Math.min(1, Math.max(0, saturation)), hsl.l));
  });
  syncAppearanceControls();

  // Style target lives inside styleHost, which is rebuilt every draw — so we
  // delegate the change event from the stable host element.
  styleHost.addEventListener("change", (e) => {
    const sel = e.target as HTMLSelectElement;
    if (sel.id === "style-target") {
      targetStyle = sel.value;
      markOutputDirty();
      draw();
    }
  });
  styleHost.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-style-target]");
    if (!card) return;
    const select = styleHost.querySelector<HTMLSelectElement>("#style-target")!;
    if (select.value === card.dataset.styleTarget) return;
    select.value = card.dataset.styleTarget!;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Surface artwork rows are rebuilt every draw, so the stable style host
  // delegates their edits. Native controls retain keystrokes; change/blur
  // commits the preview and validation redraw.
  const TRANSFORM_FIELDS = new Set(["dx", "dy", "scale", "rotationDeg"]);
  const TEXT_FIELDS = new Set(["id", "kind", "pieceRole", "sourceName"]);
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
  const applySurfaceField = (index: number, field: string, raw: string): void => {
    const key = surfaceKeyNow();
    const placements = surfaceList(surfaceBook, key);
    const current = placements[index];
    if (!current) return;
    const value: unknown = TEXT_FIELDS.has(field) ? raw : raw.trim() === "" ? NaN : Number(raw);
    const base = isRecord(current.transform) ? current.transform : { ...EMPTY_TRANSFORM };
    const next = (TRANSFORM_FIELDS.has(field)
      ? { ...current, transform: { ...base, [field]: value } }
      : { ...current, [field]: value }) as ArtworkPlacement;
    surfaceBook = surfaceSetAt(surfaceBook, key, index, next);
    markOutputDirty(false);
    draw();
  };
  const removeSurfacePlacement = (index: number): void => {
    surfaceBook = surfaceRemoveAt(surfaceBook, surfaceKeyNow(), index);
    markOutputDirty(false);
    draw();
  };
  const addSurfacePlacement = (): void => {
    const idInput = styleHost.querySelector<HTMLInputElement>("#surface-new-id")!;
    const kindSelect = styleHost.querySelector<HTMLSelectElement>("#surface-new-kind")!;
    const roleInput = styleHost.querySelector<HTMLInputElement>("#surface-new-role")!;
    const formError = styleHost.querySelector<HTMLElement>("#surface-form-error")!;
    const fail = (message: string, focus: HTMLElement): void => {
      formError.textContent = message;
      focus.focus();
    };
    const id = idInput.value.trim();
    if (id === "") { fail("Name the artwork before adding.", idInput); return; }
    if (surfacePlacementsNow().some((p) => p.id === id)) {
      fail(`"${id}" already exists on ${targetStyle}; pick another name.`, idInput);
      return;
    }
    const role = roleInput.value.trim();
    if (role === "") { fail("Name the piece role the artwork belongs to.", roleInput); return; }
    surfaceBook = surfaceAdd(surfaceBook, surfaceKeyNow(), targetStyle, {
      id,
      kind: kindSelect.value as ArtworkPlacement["kind"],
      pieceRole: role,
      widthCm: 20,
      heightCm: 25,
      transform: { ...EMPTY_TRANSFORM },
      zOrder: nextZOrder(surfacePlacementsNow()),
      sourceName: "",
    });
    markOutputDirty(false);
    draw();
    styleHost.querySelector<HTMLInputElement>("#surface-new-id")?.focus();
  };
  styleHost.addEventListener("change", (e) => {
    const control = (e.target as HTMLElement).closest<HTMLSelectElement>("select[data-surface-index]");
    if (!control) return;
    applySurfaceField(Number(control.dataset.surfaceIndex), control.dataset.surfaceField!, control.value);
  });
  styleHost.addEventListener("surface-step", (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>("input[data-surface-index]");
    if (!input) return;
    applySurfaceField(Number(input.dataset.surfaceIndex), input.dataset.surfaceField!, input.value);
  });
  styleHost.addEventListener("focusout", (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>("input[data-surface-index]");
    if (!input) return;
    applySurfaceField(Number(input.dataset.surfaceIndex), input.dataset.surfaceField!, input.value);
  });
  styleHost.addEventListener("click", (e) => {
    const remove = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-surface-remove-index]");
    if (remove) {
      removeSurfacePlacement(Number(remove.dataset.surfaceRemoveIndex));
      return;
    }
    if ((e.target as HTMLElement).closest<HTMLButtonElement>("#surface-add")) addSurfacePlacement();
  });

  const stretchSelect = root.querySelector<HTMLSelectElement>("#stretch-select")!;
  const stretchHost = root.querySelector<HTMLElement>("#stretch-host")!;
  const syncMaterialCards = (): void => {
    stretchHost.querySelectorAll<HTMLButtonElement>("[data-material-option]").forEach((card) => {
      card.setAttribute("aria-pressed", String(card.dataset.materialOption === stretchSelect.value));
    });
  };
  stretchSelect.addEventListener("change", () => {
    materialSelectionExplicit = true;
    stretchFabric = STRETCH_FABRICS.find((f) => f.name === stretchSelect.value)!;
    syncMaterialCards();
    markOutputDirty();
    draw();
  });
  stretchHost.addEventListener("click", (e) => {
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-material-option]");
    if (!card) return;
    materialSelectionExplicit = true;
    if (card.dataset.materialOption === stretchSelect.value) return;
    stretchSelect.value = card.dataset.materialOption!;
    stretchSelect.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Export-local state: which size the download buttons emit. Defaults to base (M);
  // it scopes ONLY the exports, never the other views.
  const exportSizeEl = root.querySelector<HTMLSelectElement>("#export-size")!;
  const syncNestSelectedSize = (): void => {
    const selected = recipe.sizes.find((size) => size.step === exportStep)!;
    const label = root.querySelector<HTMLElement>("#nest-selected-size");
    label!.textContent = selected.label;
  };
  const syncExportSizes = (): void => {
    if (!recipe.sizes.some((s) => s.step === exportStep)) exportStep = 0;
    exportSizeEl.replaceChildren(...recipe.sizes.map((size) => new Option(size.label, String(size.step))));
    exportSizeEl.value = String(exportStep);
    syncNestSelectedSize();
  };
  exportSizeEl.addEventListener("change", () => {
    exportStep = Number(exportSizeEl.value);
    markOutputDirty(false);
    syncNestSelectedSize();
    draw();
  });
  // exportStep always comes from the picker, which is populated from recipe.sizes,
  // so the step is guaranteed to resolve to a real size.
  const exportSizeLabel = (): string =>
    recipe.sizes.find((s) => s.step === exportStep)!.label;
  const exportPieces = (): Piece[] => {
    const block = draftAtSize(measurements, recipe.grade, exportStep, recipe.draft, recipeOptions());
    return [...blockPieces(block)];
  };
  // The desktop shell's only bridge into this app (Slice 46): when running
  // inside Electron, `window.electronAPI` is set by electron/preload.cts via
  // contextBridge, and download() below routes through it instead of the
  // browser Blob-download trick. Absent it — `npm run dev` in a plain
  // browser, or any other web host — the app is exactly what it was before
  // this slice. Additive, not a fork: every export button, every test of
  // this function's browser path, is unchanged.
  const statusEl = root.querySelector<HTMLSpanElement>("#persist-status")!;
  let statusTimer = 0;
  const flash = (msg: string, color: string): void => {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { statusEl.textContent = ""; }, 2000);
  };
  const confirmHost = root.querySelector<HTMLElement>("#workspace-confirm")!;
  const confirmCancel = root.querySelector<HTMLButtonElement>("#workspace-confirm-cancel")!;
  const confirmAccept = root.querySelector<HTMLButtonElement>("#workspace-confirm-accept")!;
  const closeLoadConfirmation = (): void => {
    pendingLoad = null;
    confirmHost.hidden = true;
    const focus = pendingLoadFocus;
    pendingLoadFocus = null;
    focus?.focus();
  };
  const applyLoaded = (loaded: Omit<SaveFile, "v">): void => {
    historyRestoring = true;
    measurements = loaded.measurements;
    fabric = loaded.fabric;
    garmentOptions = loaded.garmentOptions;
    recipe = garmentByName(loaded.workspace.garment);
    targetStyle = loaded.workspace.targetStyle;
    stretchFabric = STRETCH_FABRICS.find((f) => f.name === loaded.workspace.stretchFabric)!;
    appearance = loaded.appearance;
    surfaceBook = loaded.surface;
    materialSelectionExplicit = true;
    view = loaded.workspace.view;
    bodyCroquisView = loaded.workspace.bodyCroquisView;
    exportStep = loaded.workspace.exportStep;
    fabricWidth = loaded.workspace.fabricWidth;
    nestScope = loaded.workspace.nestScope;
    nestBufferRaw = String(loaded.nestingIntelligence.bufferPct);
    nestAvailableRaw = loaded.nestingIntelligence.availableLengthCm === null
      ? "" : String(loaded.nestingIntelligence.availableLengthCm);
    nestNap = loaded.nestingIntelligence.napAware;
    styleReviewed = false;
    checkReviewed = false;
    journey = { ...journey, exported: false };
    celebrating = false;
    saveJourney(journey);
    syncWorkspace(true);
    historyRestoring = false;
    savedRevision = outputRevision;
    history = emptyHistory();
    historyPresent = captureDraftSnapshot();
    pendingRecovery = null;
    clearRecoveryFromStorage();
    renderRecoveryPrompt();
    syncHistoryControls();
    flash("Loaded ✓", "#2E9B63");
  };
  const requestLoad = (loaded: Omit<SaveFile, "v">): void => {
    if (outputRevision === savedRevision) {
      applyLoaded(loaded);
      return;
    }
    pendingLoad = loaded;
    pendingLoadFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    confirmHost.hidden = false;
    confirmAccept.focus();
  };
  confirmCancel.addEventListener("click", closeLoadConfirmation);
  confirmAccept.addEventListener("click", () => {
    const loaded = pendingLoad;
    if (!loaded) {
      closeLoadConfirmation();
      return;
    }
    pendingLoad = null;
    pendingLoadFocus = null;
    confirmHost.hidden = true;
    applyLoaded(loaded);
  });
  confirmHost.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLoadConfirmation();
  });
  const completeExport = (): void => {
    journey = { ...journey, step: "output", exported: true };
    saveJourney(journey);
    celebrating = true;
    renderJourney();
  };
  const download = async (filename: string, text: string, mime: string): Promise<void> => {
    const requestedRevision = outputRevision;
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveFile(filename, text);
        if (!result.saved) {
          flash("Export canceled — choose a file location to complete it.", BLUEPRINT.lineActive);
          return;
        }
        if (requestedRevision === outputRevision) completeExport();
        else flash("File saved for the earlier design — review the current design before exporting again.", BLUEPRINT.lineActive);
        return;
      } catch {
        flash("Export failed — check the destination and retry.", BLUEPRINT.lineActive);
        return;
      }
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      flash("Download started — verify the file before marking export complete.", BLUEPRINT.label);
    } catch {
      flash("Export failed — the browser could not start the download.", BLUEPRINT.lineActive);
    }
  };
  const onExport = (id: string, action: () => void): void => {
    root.querySelector<HTMLButtonElement>(id)!.addEventListener("click", () => {
      if (canExport()) action();
    });
  };
  onExport("#export-svg", () => {
    download(`${recipe.name}-${exportSizeLabel()}.svg`, exportSvg(exportPieces(), recipe.allowances, recipe.notches), "image/svg+xml");
  });
  onExport("#export-dxf", () => {
    download(`${recipe.name}-${exportSizeLabel()}.dxf`, exportDxf(exportPieces(), recipe.allowances), "image/vnd.dxf");
  });
  onExport("#export-pdf", () => {
    download(`${recipe.name}-${exportSizeLabel()}.pdf`, exportPdf(
      exportPieces(), recipe.allowances, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true
    ), "application/pdf");
  });
  // The tech pack is a whole-style document (sample-size sketch + graded table),
  // so it uses the live measurements directly and ignores the per-size picker.
  // The current style's artwork rides along as a fifth section when present.
  onExport("#export-techpack", () => {
    download(`${recipe.name}-techpack.pdf`, exportTechPack(
      recipe, measurements, undefined, stretchFabric, recipeOptions(), surfacePlacementsNow(), targetStyle
    ), "application/pdf");
  });
  // The projector file carries EVERY graded size as a toggleable layer, so it too
  // is a whole-style file and ignores the per-size picker.
  onExport("#export-projector", () => {
    download(`${recipe.name}-projector.svg`, exportProjectorSvg(recipe, measurements, recipeOptions()), "image/svg+xml");
  });
  // The print sheet carries one style's artwork at true scale, so like the
  // tech pack and projector it is a whole-style file and ignores the picker.
  onExport("#export-surface-sheet", () => {
    download(`${recipe.name}-surface-sheet.svg`, exportSurfaceSheet(surfacePlacementsNow(), targetStyle), "image/svg+xml");
  });
  onExport("#export-a0", () => {
    download(`${recipe.name}-${exportSizeLabel()}-A0.pdf`, exportA0Pdf(
      exportPieces(), recipe.allowances, recipe.notches, undefined, recipe.a0Overflow === true
    ), "application/pdf");
  });

  // Slice 47: the desktop shell's File > Export menu clicks the SAME button
  // above rather than duplicating any export logic — main only knows which
  // kind was picked, never how to build the file. Absent electronAPI (a
  // plain browser tab), this is simply never registered.
  window.electronAPI?.onExportRequested?.((kind) => {
    const buttonId: Record<string, string> = {
      svg: "export-svg", dxf: "export-dxf", pdf: "export-pdf",
      techpack: "export-techpack", projector: "export-projector", a0: "export-a0",
    };
    const id = buttonId[kind];
    if (!id) return;
    if (!canExport()) {
      setStep("refine");
      flash("Review Style and the current digital checks before exporting.", BLUEPRINT.lineActive);
      return;
    }
    setStep("output");
    root.querySelector<HTMLButtonElement>(`#${id}`)?.click();
  });

  root.querySelector<HTMLButtonElement>("#save-pattern")!.addEventListener("click", () => {
    const workspace = currentWorkspace();
    const bufferValue = nestBufferRaw.trim() === "" ? NaN : Number(nestBufferRaw);
    const availableValue = nestAvailableRaw.trim() === "" ? null : Number(nestAvailableRaw);
    const nestingIntelligence = { bufferPct: bufferValue, availableLengthCm: availableValue, napAware: nestNap };
    const validation = deserialize(serialize(measurements, fabric, garmentOptions, workspace, appearance, surfaceBook, nestingIntelligence));
    if (!validation.ok) { flash(`Save failed: ${validation.error}`, BLUEPRINT.lineActive); return; }
    if (saveToStorage(measurements, fabric, garmentOptions, workspace, appearance, surfaceBook, nestingIntelligence)) {
      savedRevision = outputRevision;
      pendingRecovery = null;
      clearRecoveryFromStorage();
      renderRecoveryPrompt();
      flash("Saved ✓", "#2E9B63");
    } else flash("Save failed", BLUEPRINT.lineActive);
  });

  root.querySelector<HTMLButtonElement>("#load-pattern")!.addEventListener("click", () => {
    const loaded = readFromStorage();
    if (!loaded.ok) { flash(loaded.error, BLUEPRINT.label); return; }
    requestLoad(loaded);
  });

  const syncWorkspace = (restoring: boolean): void => {
    selectedControlPages.clear();
    editedFront = null;
    selectedId = null;
    dragId = null;
    activeDim = null;
    hoveredDim = null;
    focusedDim = null;
    root.querySelector<HTMLElement>("#controls-panel")!.outerHTML = controlsMarkup(
      measurements, recipe.fields, recipe.options, recipeOptions());
    wireMeasurementInputs();
    GARMENTS.forEach((g) => {
      const button = root.querySelector<HTMLButtonElement>(`#garment-${g.name}`)!;
      const on = g.name === recipe.name;
      button.style.background = on ? BLUEPRINT.lineActive : BLUEPRINT.background;
      button.style.color = on ? BLUEPRINT.background : BLUEPRINT.line;
      button.setAttribute("aria-pressed", String(on));
    });
    swatches.forEach((swatch) => {
      const on = swatch.dataset.fabric === fabric;
      swatch.style.outline = on ? `2px solid ${BLUEPRINT.lineActive}` : "none";
      swatch.setAttribute("aria-pressed", String(on));
    });
    stretchSelect.value = stretchFabric.name;
    syncMaterialCards();
    syncAppearanceControls();
    widthInput.value = String(fabricWidth);
    syncNestIntelInputs();
    syncExportSizes();
    if (restoring && journey.step === "start") journey = { ...journey, step: "measure", familiar: true };
    setBodyCroquisView(bodyCroquisView);
    setScope(nestScope);
    setView(view);
    applyDisclosure();
  };

  const applyRawDraft = (
    rawMeasurements: Partial<Record<keyof Measurements, string>>,
    rawOptions: Record<string, Record<string, string>>
  ): void => {
    root.querySelectorAll<HTMLInputElement>("input[data-field]").forEach((input) => {
      const raw = rawMeasurements[input.dataset.field as keyof Measurements];
      if (raw !== undefined) input.value = raw;
    });
    const options = rawOptions[recipe.name] ?? {};
    root.querySelectorAll<HTMLInputElement>("input[data-option]").forEach((input) => {
      const raw = options[input.dataset.option!];
      if (raw !== undefined) input.value = raw;
    });
  };

  function acceptRecovery(file: Omit<RecoveryFile, "v">): void {
    historyRestoring = true;
    const nextMeasurements = { ...STANDARD_M };
    FIELDS.forEach((field) => {
      const value = file.measurements[field.id];
      nextMeasurements[field.id] = value === null ? NaN : value;
    });
    measurements = nextMeasurements;
    garmentOptions = Object.fromEntries(Object.entries(file.garmentOptions).map(([name, values]) => [name,
      Object.fromEntries(Object.entries(values).map(([id, value]) => [id, value === null ? NaN : value]))])) as GarmentOptionsByRecipe;
    fabric = file.fabric;
    appearance = { ...file.appearance };
    surfaceBook = file.surface;
    nestBufferRaw = file.rawNestingIntelligence.buffer;
    nestAvailableRaw = file.rawNestingIntelligence.available;
    nestNap = file.rawNestingIntelligence.napAware;
    recipe = garmentByName(file.workspace.garment);
    targetStyle = file.workspace.targetStyle;
    stretchFabric = STRETCH_FABRICS.find((candidate) => candidate.name === file.workspace.stretchFabric)!;
    materialSelectionExplicit = file.materialSelectionExplicit;
    view = file.workspace.view;
    bodyCroquisView = file.workspace.bodyCroquisView;
    exportStep = file.workspace.exportStep;
    fabricWidth = file.workspace.fabricWidth;
    nestScope = file.workspace.nestScope;
    styleReviewed = false;
    checkReviewed = false;
    journey = { ...journey, exported: false };
    celebrating = false;
    saveJourney(journey);
    syncWorkspace(true);
    applyRawDraft(file.rawMeasurements, file.rawOptions);
    historyRestoring = false;
    pendingRecovery = null;
    clearRecoveryFromStorage();
    renderRecoveryPrompt();
    history = emptyHistory();
    historyPresent = captureDraftSnapshot();
    markOutputDirty(true);
    draw();
  }

  function applyHistorySnapshot(snapshot: DraftSnapshot): void {
    historyRestoring = true;
    measurements = { ...snapshot.measurements };
    garmentOptions = copyOptions(snapshot.garmentOptions);
    fabric = snapshot.fabric;
    appearance = { ...snapshot.appearance };
    recipe = garmentByName(snapshot.garment);
    targetStyle = snapshot.targetStyle;
    stretchFabric = STRETCH_FABRICS.find((candidate) => candidate.name === snapshot.stretchFabric)!;
    materialSelectionExplicit = snapshot.materialSelectionExplicit;
    view = snapshot.view;
    bodyCroquisView = snapshot.bodyCroquisView;
    exportStep = snapshot.exportStep;
    fabricWidth = snapshot.fabricWidth;
    nestScope = snapshot.nestScope;
    syncWorkspace(true);
    applyRawDraft(snapshot.rawMeasurements, snapshot.rawOptions);
    historyRestoring = false;
    historyPresent = captureDraftSnapshot();
    markOutputDirty(true);
    draw();
  }

  const performUndo = (): boolean => {
    const current = historyPresent!;
    const transition = undoHistory(history, current);
    if (!transition) return false;
    history = transition.history;
    applyHistorySnapshot(transition.current);
    return true;
  };
  const performRedo = (): boolean => {
    const current = historyPresent!;
    const transition = redoHistory(history, current);
    if (!transition) return false;
    history = transition.history;
    applyHistorySnapshot(transition.current);
    return true;
  };

  const nativeEditingTarget = (target: EventTarget | null): boolean => {
    const element = target as HTMLElement | null;
    return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
      || element instanceof HTMLSelectElement || element?.isContentEditable === true;
  };
  window.addEventListener("keydown", (event) => {
    if (activeMountRoot !== root) return;
    if (!(event.ctrlKey || event.metaKey) || event.altKey || nativeEditingTarget(event.target)) return;
    const key = event.key.toLowerCase();
    const handled = key === "z" ? (event.shiftKey ? performRedo() : performUndo())
      : key === "y" ? performRedo() : false;
    if (handled) event.preventDefault();
  });
  window.addEventListener("beforeunload", (event) => {
    if (activeMountRoot !== root) return;
    if (outputRevision === savedRevision) return;
    event.preventDefault();
    event.returnValue = "";
  });

  syncWorkspace(saved !== null);
  savedRevision = outputRevision;
  historyPresent = captureDraftSnapshot();
  recoveryTrackingEnabled = true;
  undoButton.addEventListener("click", () => { performUndo(); });
  redoButton.addEventListener("click", () => { performRedo(); });
  syncHistoryControls();
  renderRecoveryPrompt();
}

/** Geometry checks remain owned by their recipe, but a failed fact still needs
 * a useful correction target when it is repeated in Guidance. */
const CHECK_FIELDS: Readonly<Record<string, string>> = {
  "Shoulder seam (front ↔ back)": "shoulderWidth",
  "Side seam (front ↔ back)": "chest",
  "Sleeve underarm (left ↔ right)": "bicep",
  "Sleeve-cap ease": "bicep",
  "Dart legs equal": "chest",
  "Hem square to the fold": "length",
  "Waist square to the fold": "waist",
};
