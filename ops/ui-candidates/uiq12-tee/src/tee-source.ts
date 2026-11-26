import { DEFAULT_WORKSPACE, deserialize, serialize } from "../../../../src/ui/persist";
import { STANDARD_M, type Measurements } from "../../../../src/drafting/measurements";
import { garmentForConstruction, draftRecipeAtSize } from "../../../../src/drafting/recipe";
import type { Block } from "../../../../src/drafting/block";
import { gradeMeasurements } from "../../../../src/drafting/grading";
import type { GarmentOptions } from "../../../../src/drafting/options";
import {
  appendSemanticEditOperations, createAnchorMoveOperation, emptySemanticEditDocument,
  evaluateSemanticEditDocument, inspectSemanticEditCandidate, parseSemanticEditDocument,
  semanticAnchorCatalog, semanticEditSourceFingerprint, type SemanticEditDocument,
} from "../../../../src/edit/semantic-edit";
import { seamAllowance } from "../../../../src/render/allowance";
import { FIELDS, inputError } from "../../../../src/ui/controls";
import { TEE_STYLES } from "../../../../src/style/style";
import { coherenceChecks, plausibilityChecks } from "../../../../src/guidance/plausibility";
import { starterControlError, starterEntryById, starterOriginForEntry, type StarterOrigin } from "../../../../src/ui/starter-registry";
import { hasTeeNecklineOverride, TEE_NECKBAND_OPTIONS } from "../../../../src/drafting/tshirt";
import type { ProjectRecord, CustomOneSizeStyleRecord, SavedDesign } from "../../../../src/ui/project-records";
import type { AssemblySource } from "./assembly-contract";

const baselineCommit = "d43370b686852d279d347257d06fde8ae824c5dc";
const classic = TEE_STYLES.find(style => style.name === "Classic tee")!;
const recipe = garmentForConstruction("tee", "set-in");
const chestOption = recipe.options!.find(option => option.id === "chestEase")!;
export const asymmetricAnchor = "anchor:v1/tee/front/edge/armhole/control/2";
export const teeFields = FIELDS.filter(field => recipe.fields.includes(field.id));
export const sizeSteps = [...recipe.sizes, { label: "Custom one size", step: "custom" as const }];

interface ClassicProvenance {
  readonly starter: StarterOrigin | null;
  readonly projectStyle?: {
    readonly projectId: string;
    readonly styleId: string;
    readonly styleRevision: number;
    readonly revisionHeadId: string | null;
    readonly parentDesignDigest: string;
  };
  readonly variant: {
    readonly recipeId: "tee";
    readonly style: string;
    readonly construction: "set-in";
    readonly neckline: "crew";
  };
}

interface ProjectSource {
  readonly project: ProjectRecord;
  readonly activeStyle: CustomOneSizeStyleRecord;
  readonly parentDesignDigest: string;
}

const verifiedOrigins = new WeakSet<ClassicProvenance>();
const projectSources = new WeakMap<ClassicProvenance, ProjectSource>();
const verifiedTeeSource = Symbol("verified Tee assembly source");
export type VerifiedTeeSource = AssemblySource & { readonly [verifiedTeeSource]: true };
const assemblySources = new WeakSet<AssemblySource>();

export function requireVerifiedTeeSource(source: AssemblySource | null): asserts source is VerifiedTeeSource {
  if (!source || !assemblySources.has(source)) throw new Error("Tee assembly requires a validated source revision.");
}


export interface TeeInputs {
  readonly measurements: Readonly<Measurements>;
  readonly size: number | "custom";
  readonly chestEase: number | null;
  readonly edits: SemanticEditDocument | null;
  readonly neckband?: GarmentOptions;
  readonly provenance?: ClassicProvenance;
}

export interface TeeDraft {
  readonly drawing: Omit<AssemblySource, "revision">;
  readonly revision: string;
  readonly source: VerifiedTeeSource | null;
  readonly workingRevision: string;
  readonly identity: {
    readonly baselineCommit: string;
    readonly provenance: ClassicProvenance | null;
    readonly recipeId: string;
    readonly construction: "set-in";
    readonly sizeStep: TeeInputs["size"];
    readonly baseSourceFingerprint: string;
    readonly effectiveBlockDigest: string;
    readonly editOperationDigest: string;
  };
  readonly issue: string | null;
  readonly guidance: readonly string[];
  readonly anchors: ReturnType<typeof semanticAnchorCatalog>;
}

export function defaultTeeInputs(): TeeInputs {
  return { measurements: { ...STANDARD_M }, size: 0, chestEase: null, edits: null };
}

export function loadSavedClassicTee(json: string) {
  const saved = deserialize(json);
  if (!saved.ok) throw new Error(saved.error);
  const origin = saved.workspace.starterOrigin;
  const starter = origin && starterEntryById(origin.entryId);
  if (starter?.entryId !== "tee-classic-digital-v1" || !origin) {
    throw new Error("Choose a saved Tee Classic software-default starter.");
  }
  const canonicalStarter = starterOriginForEntry(starter);
  const inputs = resolvedSavedInputs(saved, canonicalStarter);
  return { inputs, starter: canonicalStarter, variant: inputs.provenance.variant };
}

function resolvedSavedInputs(saved: SavedDesign, starter: StarterOrigin | null, projectSource?: ProjectSource) {
  const { workspace, measurements, garmentOptions, semanticEdits } = saved;
  const options = garmentOptions.tee ?? {};
  if (workspace.garment !== "tee" || workspace.targetStyle !== classic.name
    || workspace.teeConstruction !== "set-in" || hasTeeNecklineOverride(options)) {
    throw new Error("The saved variant must be a Classic crew-neck set-in Tee.");
  }
  if (projectSource && (workspace.starterOrigin != null || workspace.exportStep !== 0)) {
    throw new Error("A project-resolved one-size Tee must have step 0 and no catalog starter.");
  }
  const neckband: Record<string, number> = {};
  for (const [key, value] of Object.entries(options)) {
    if (key === "chestEase") continue;
    if (TEE_NECKBAND_OPTIONS.some(option => option.id === key)) {
      neckband[key] = value;
    } else {
      throw new Error(`Unsupported saved Tee option: ${key}.`);
    }
  }
  const style = projectSource?.activeStyle;
  const provenance: ClassicProvenance = freeze({
    starter,
    ...(style && projectSource && { projectStyle: {
      projectId: style.projectId, styleId: style.id, styleRevision: style.revision, revisionHeadId: style.revisionHeadId,
      parentDesignDigest: projectSource.parentDesignDigest,
    } }),
    variant: { recipeId: "tee", style: workspace.targetStyle, construction: "set-in", neckline: "crew" },
  });
  const inputs = {
    measurements, size: projectSource ? "custom" as const : workspace.exportStep,
    chestEase: options.chestEase ?? null, edits: semanticEdits, neckband: freeze(neckband), provenance,
  };
  validate(inputs);
  verifiedOrigins.add(provenance);
  if (projectSource) projectSources.set(provenance, projectSource);
  return inputs;
}

async function readProjectSource(snapshot: { readonly project: unknown; readonly activeStyle: unknown }): Promise<ProjectSource> {
  // The parsers accept JSON records. Take a detached copy so the archived source
  // cannot be mutated by the preview or by its caller after verification.
  const { project, activeStyle } = JSON.parse(JSON.stringify(snapshot));
  const { isCustomOneSizeStyle, parseProjectRecord, parseStyleRecord } = await import("../../../../src/ui/project-records");
  const parsedProject = parseProjectRecord(project);
  if (!parsedProject.ok) throw new Error(parsedProject.error);
  const parsedStyle = parseStyleRecord(activeStyle);
  if (!parsedStyle.ok) throw new Error(parsedStyle.error);
  const style = parsedStyle.value;
  if (!isCustomOneSizeStyle(style) || style.archivedAt !== null || style.projectId !== parsedProject.value.id
    || style.id !== parsedProject.value.activeStyleId) {
    throw new Error("Choose the active custom one-size style from its owning project.");
  }
  const parentDesignDigest = await fingerprintText(style.design);
  return freeze({ project: parsedProject.value, activeStyle: style, parentDesignDigest });
}

export async function loadProjectClassicTee(snapshot: { readonly project: unknown; readonly activeStyle: unknown }): Promise<TeeInputs> {
  const source = await readProjectSource(snapshot);
  return resolvedSavedInputs(source.activeStyle.design, null, source);
}

export function loadGenericClassicTee(json: string): TeeInputs {
  const saved = deserialize(json);
  if (!saved.ok) throw new Error(saved.error);
  if (saved.workspace.starterOrigin != null) throw new Error("Choose a Classic Tee without a catalog starter.");
  return resolvedSavedInputs(saved, null);
}

export function initialClassicTeeInputs(): TeeInputs {
  const starter = starterEntryById("tee-classic-digital-v1")!;
  // Keep the established numeric fixture after the app’s optional chest-ease reset.
  return loadSavedClassicTee(serialize(
    { ...STANDARD_M, ...starter.configuration.measurements, ease: STANDARD_M.ease },
    "#123456",
    { tee: {} },
    { ...DEFAULT_WORKSPACE, targetStyle: starter.configuration.targetStyle, starterOrigin: starterOriginForEntry(starter) },
  )).inputs;
}

export async function saveCandidateTee(input: TeeInputs): Promise<string> {
  input = snapshotInputs(input);
  const provenance = verifiedProvenance(input);
  if (!provenance) throw new Error("Choose a verified saved Classic Tee before saving.");
  validate(input);
  const customSize = input.size === "custom";
  const projectSource = projectSources.get(provenance);
  if (projectSource) {
    const workingCopy = workingInputs(input);
    const workingRevision = await completeWorkingRevision(input, provenance);
    const { project, activeStyle } = projectSource;
    return JSON.stringify({ projectSource: { project, activeStyle }, workingCopy, workingRevision });
  }
  const appSave = serialize(
    input.measurements, "#123456",
    { tee: { ...input.neckband, ...(input.chestEase === null ? {} : { chestEase: input.chestEase }) } },
    {
      ...DEFAULT_WORKSPACE,
      garment: provenance.variant.recipeId,
      targetStyle: provenance.variant.style,
      teeConstruction: provenance.variant.construction,
      exportStep: input.size === "custom" ? 0 : input.size,
      starterOrigin: provenance.starter,
    },
    undefined, undefined, undefined, input.edits,
  );
  if (provenance.starter) loadSavedClassicTee(appSave);
  else loadGenericClassicTee(appSave);
  return JSON.stringify({ appSave, customSize });
}

export async function reopenCandidateTee(json: string): Promise<TeeInputs> {
  const saved: unknown = JSON.parse(json);
  if (!saved || typeof saved !== "object") throw new Error("The saved preview lacks a verified Classic Tee draft.");
  if ("projectSource" in saved) {
    const parent = saved.projectSource;
    if (!parent || typeof parent !== "object" || !("project" in parent) || !("activeStyle" in parent)
      || !("workingCopy" in saved) || !("workingRevision" in saved) || "appSave" in saved) {
      throw new Error("The saved preview is missing its bound custom one-size working copy.");
    }
    const source = await readProjectSource(parent);
    const base = resolvedSavedInputs(source.activeStyle.design, null, source);
    const input = { ...parseTeeInputs(saved.workingCopy), provenance: base.provenance };
    validate(input);
    if (saved.workingRevision !== await completeWorkingRevision(input, base.provenance)) {
      throw new Error("The working copy does not match its saved project and revision.");
    }
    return input;
  }
  if (!("appSave" in saved) || typeof saved.appSave !== "string"
    || !("customSize" in saved) || typeof saved.customSize !== "boolean") {
    throw new Error("The saved preview lacks a verified Classic Tee draft.");
  }
  const design = deserialize(saved.appSave);
  if (!design.ok) throw new Error(design.error);
  const inputs = design.workspace.starterOrigin == null
    ? resolvedSavedInputs(design, null)
    : loadSavedClassicTee(saved.appSave).inputs;
  if (saved.customSize && inputs.size !== 0) throw new Error("The saved preview has inconsistent size choices.");
  return saved.customSize ? { ...inputs, size: "custom" } : inputs;
}

function workingInputs(input: TeeInputs) {
  const { measurements, size, chestEase, edits, neckband = {} } = input;
  return { measurements, size, chestEase, edits, neckband };
}

function snapshotInputs(input: TeeInputs): TeeInputs {
  return {
    ...input,
    measurements: { ...input.measurements },
    edits: input.edits === null ? null : JSON.parse(JSON.stringify(input.edits)),
    neckband: { ...input.neckband },
  };
}

function completeWorkingRevision(input: TeeInputs, provenance: ClassicProvenance | null) {
  return fingerprintText(["tee-working-v1", baselineCommit, provenance, workingInputs(input)]);
}

function verifiedProvenance(input: TeeInputs): ClassicProvenance | null {
  const provenance = input.provenance;
  if (provenance && !verifiedOrigins.has(provenance)) throw new Error("The Classic Tee source identity was not verified.");
  return provenance ?? null;
}

function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function validate(input: TeeInputs) {
  if (input.provenance?.projectStyle && input.size !== "custom") {
    throw new Error("The project-resolved style must stay on custom one-size.");
  }
  for (const [id, value] of Object.entries(input.neckband ?? {})) {
    const option = TEE_NECKBAND_OPTIONS.find(candidate => candidate.id === id);
    if (!option) throw new Error(`Unsupported neckband template option: ${id}.`);
    const error = inputError(value, option);
    if (error) throw new Error(error);
    const steps = (value - option.min) / option.step;
    if (Math.abs(steps - Math.round(steps)) > 1e-7) {
      throw new Error(`${option.label}: use increments of ${option.step} ${option.unit}.`);
    }
  }
  const size = sizeSteps.find(candidate => candidate.step === input.size);
  if (!size) throw new Error("Choose an existing XS–XL or custom one-size draft.");
  const starter = input.provenance?.starter?.entryId ?? null;
  for (const field of teeFields) {
    const error = starterControlError(starter, field.id, input.measurements[field.id]) ?? inputError(input.measurements[field.id], field);
    if (error) throw new Error(error);
  }
  if (input.chestEase !== null) {
    const error = starterControlError(starter, chestOption.id, input.chestEase) ?? inputError(input.chestEase, chestOption);
    if (error) throw new Error(error);
  }
  const [minLength, maxLength] = classic.ranges.length!;
  const [minEase, maxEase] = classic.ranges.ease!;
  if (input.measurements.length < minLength || input.measurements.length > maxLength) {
    throw new Error(`Choose a Classic base body length of ${minLength}–${maxLength} cm.`);
  }
  const effectiveEase = input.chestEase ?? input.measurements.ease;
  if (effectiveEase < minEase || effectiveEase > maxEase) {
    throw new Error(`Choose a Classic torso ease of ${minEase}–${maxEase} cm.`);
  }
  return { label: size.label, step: size.step === "custom" ? 0 : size.step };
}

async function sourceInfo(input: TeeInputs) {
  const size = validate(input);
  const options: GarmentOptions = input.chestEase === null ? {} : { chestEase: input.chestEase };
  const sourceInputs = { measurements: Object.fromEntries(recipe.fields.map(field => [field, input.measurements[field]])), options };
  const base = recipe.draft(input.measurements, options);
  const baseFingerprint = await semanticEditSourceFingerprint(recipe.name, base, globalThis.crypto, sourceInputs);
  return { size, options, sourceInputs, base, baseFingerprint };
}

async function fingerprintText(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]))
      : item));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function serializedOperations(edits: SemanticEditDocument | null) {
  return edits?.operations.map(operation => [operation.id, operation.sourceFingerprint, operation.moves.map(
    move => [move.anchorId, move.signature, move.deltaCm.x, move.deltaCm.y],
  )]) ?? [];
}

function makeCuts(block: Block) {
  return Object.fromEntries(Object.entries(block.roles).map(([role, piece]) => [role, seamAllowance(piece, recipe.allowances)]));
}

export async function resolveTeeDraft(input: TeeInputs): Promise<TeeDraft> {
  input = snapshotInputs(input);
  const provenance = verifiedProvenance(input);
  const { size, options, sourceInputs, baseFingerprint } = await sourceInfo(input);
  const measurements = gradeMeasurements(input.measurements, recipe.grade, size.step);
  let block = draftRecipeAtSize(recipe, input.measurements, size.step, options);
  let issue: string | null = inspectSemanticEditCandidate(recipe, measurements, block, size.label, options)[0]?.message ?? null;
  if (input.edits) {
    const evaluation = evaluateSemanticEditDocument(recipe, input.measurements, options,
      input.edits, baseFingerprint, sourceInputs, [size]);
    if (evaluation.status === "ready") {
      block = evaluation.sizes[0].block;
      issue = null;
    } else {
      issue = evaluation.issues[0].message;
    }
  }
  const [effectiveBlockDigest, editOperationDigest] = await Promise.all([
    semanticEditSourceFingerprint(recipe.name, block, globalThis.crypto, sourceInputs),
    fingerprintText(serializedOperations(input.edits)),
  ]);
  const identity = {
    baselineCommit, provenance, recipeId: recipe.name, construction: "set-in" as const, sizeStep: input.size,
    baseSourceFingerprint: baseFingerprint, effectiveBlockDigest, editOperationDigest,
  };
  const [revision, workingRevision] = await Promise.all([
    fingerprintText(["tee-source-v3", identity, issue]),
    completeWorkingRevision(input, provenance),
  ]);
  const cuts = makeCuts(block);
  if (Object.values(cuts).some(points => points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y)))) {
    throw new Error(issue ?? "The draft has an invalid cutting contour.");
  }
  const drawing = { block, cuts };
  const source = issue === null
    ? freeze({ revision, ...drawing, [verifiedTeeSource]: true } satisfies VerifiedTeeSource)
    : null;
  if (source) assemblySources.add(source);
  return freeze({
    drawing, revision, workingRevision, source, identity, issue,
    guidance: [...recipe.guidance(block, measurements, options), ...plausibilityChecks(measurements, recipe.fields),
      ...coherenceChecks(measurements, recipe.fields)].filter(note => note.level === "warn").map(note => note.text),
    anchors: issue === null ? semanticAnchorCatalog(recipe.name, block) : [],
  });
}

export async function addTeeMove(input: TeeInputs, anchor: string, x: number, y: number, operationId: string): Promise<TeeInputs> {
  input = snapshotInputs(input);
  const { sourceInputs, base, baseFingerprint } = await sourceInfo(input);
  const existing = input.edits ?? emptySemanticEditDocument(recipe.name, baseFingerprint, sourceInputs);
  const operation = createAnchorMoveOperation(recipe.name, baseFingerprint, base, operationId, anchor, { x, y });
  return { ...input, edits: appendSemanticEditOperations(existing, [operation]) };
}

export async function editedTeeInputs(input = defaultTeeInputs()): Promise<TeeInputs> {
  return addTeeMove({ ...input, measurements: { ...input.measurements, chest: 104, length: 73 } },
    asymmetricAnchor, -3, 0, "uiq12-front-armhole-control");
}

export function parseTeeInputs(value: unknown): TeeInputs {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The saved Tee draft is invalid.");
  const saved = value as Partial<TeeInputs>;
  if (!saved.measurements || typeof saved.measurements !== "object" || Array.isArray(saved.measurements)
    || saved.size === undefined || saved.chestEase === undefined
    || teeFields.some(field => !Object.hasOwn(saved.measurements!, field.id))) {
    throw new Error("The saved Tee draft is missing inputs.");
  }
  if (Object.keys(saved).some(key => !["measurements", "size", "chestEase", "edits", "neckband"].includes(key))
    || Object.keys(saved.measurements).some(key => !Object.hasOwn(STANDARD_M, key))) {
    throw new Error("The saved Tee draft contains an unsupported input or option.");
  }
  const edits = saved.edits === null ? null : parseSemanticEditDocument(saved.edits);
  if (saved.edits !== null && !edits) throw new Error("The saved Tee edits are invalid.");
  if (saved.neckband !== undefined && (!saved.neckband || typeof saved.neckband !== "object" || Array.isArray(saved.neckband))) {
    throw new Error("The saved neckband settings are invalid.");
  }
  const input = { measurements: { ...STANDARD_M, ...saved.measurements }, size: saved.size, chestEase: saved.chestEase, edits,
    ...(saved.neckband !== undefined && { neckband: saved.neckband }) };
  validate(input);
  return input;
}
