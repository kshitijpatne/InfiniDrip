import type { Edge } from "../../../../src/drafting/piece";
import type { Assembly, AssemblySeam } from "./assembly-contract";
import type { TeeRenderer } from "./direct-three";
import { createHistory, createLatest } from "./preview-state";
import {
  addTeeMove, asymmetricAnchor, editedTeeInputs, initialClassicTeeInputs, reopenCandidateTee, saveCandidateTee,
  resolveTeeDraft, sizeSteps, teeFields, type TeeDraft, type TeeInputs,
} from "./tee-source";
import "./styles.css";

const get = <T extends Element>(id: string) => document.querySelector<T>(`#${id}`)!;
const input = (id: string) => get<HTMLInputElement>(id);
const select = (id: string) => get<HTMLSelectElement>(id);
const button = (id: string) => get<HTMLButtonElement>(id);
const pattern = get<SVGSVGElement>("pattern");
const status = get<HTMLElement>("status");
const message = get<HTMLElement>("draft-message");
const receipt = get<HTMLOutputElement>("draft-revision");
const rendererSlot = get<HTMLElement>("renderer");
const storageKey = "infinidrip-uiq12-tee-draft-v1";
const hands = ["right", "left"] as const;
type State = "closed" | "loading" | "ready" | "unsupported" | "lost" | "error";

interface View {
  readonly canvas: HTMLCanvasElement;
  readonly context: WebGL2RenderingContext;
  readonly events: AbortController;
  renderer: TeeRenderer | null;
  lost: boolean;
}

const history = createHistory(initialClassicTeeInputs());
const latest = createLatest();
const sourceIntent = createLatest();
let wants3D = false;
let view: View | null = null;
let draft: TeeDraft | null = null;
let assembly: Assembly | null = null;
let selectedSeam: string | null = null;
let preferredSeam: string | null = null;
let generation = 0;
let timings = { sourceMs: 0, assemblyMs: 0, readyMs: 0 };

function show(state: State, text: string) {
  status.dataset.state = state;
  status.textContent = text;
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function edgePath(edge: Edge) {
  if (edge.kind === "line") return `M ${edge.start.x} ${edge.start.y} L ${edge.end.x} ${edge.end.y}`;
  const { start, control1, control2, end } = edge.curve;
  return `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
}

function drawPattern(current: TeeDraft) {
  // Use one scale for all outlines so source edits visibly change dimensions.
  pattern.innerHTML = Object.entries(current.drawing.block.roles).flatMap(([role, piece], i) => hands.map((hand, row) => {
    const cut = current.drawing.cuts[role].map(point => `${point.x} ${point.y}`).join(" L ");
    const x = i * 175 + (hand === "right" ? 28 : 147);
    const y = row * 194;
    const transform = `translate(${x} ${y + 25}) scale(${hand === "right" ? 1.55 : -1.55} 1.55)`;
    const sewing = piece.edges.map(edge => `<path class="sew" data-edge="${edge.name}" d="${edgePath(edge)}"/>`).join("");
    return `<text x="${i * 175 + 12}" y="${y + 16}">${role} · ${hand}</text>` +
      `<g data-role="${role}" data-instance="${role}:${hand}" transform="${transform}">` +
      `<path class="cut" data-line="cut" d="M ${cut} Z"/>${sewing}</g>`;
  })).join("");
  pattern.dataset.revision = current.revision;
  receipt.dataset.revision = current.revision;
  receipt.dataset.workingRevision = current.workingRevision;
  receipt.dataset.effectiveBlockDigest = current.identity.effectiveBlockDigest;
  const provenance = current.identity.provenance;
  receipt.dataset.starterId = provenance?.starter?.entryId ?? "";
  receipt.dataset.starterRevision = provenance?.starter?.entryRevision ?? "";
  receipt.dataset.recipeRevision = provenance?.starter?.recipeRevision ?? "";
  receipt.dataset.projectStyleId = provenance?.projectStyle?.styleId ?? "";
  receipt.dataset.projectStyleRevision = String(provenance?.projectStyle?.styleRevision ?? "");
  receipt.value = `${current.source ? "Draft" : "Base 2D only"} ${current.revision.slice(0, 12)}`;
  get<HTMLElement>("guidance").textContent = current.guidance.join(" ");
  const anchor = select("anchor");
  const previous = anchor.value;
  anchor.replaceChildren(...current.anchors.map(value => new Option(value.id.split("/").slice(2).join(" / "), value.id)));
  if (current.anchors.some(value => value.id === previous)) anchor.value = previous;
}

function showSelection(seam: AssemblySeam | undefined) {
  selectedSeam = seam?.id ?? null;
  select("seams").value = selectedSeam ?? "";
  view?.renderer?.select(selectedSeam);
  for (const edge of pattern.querySelectorAll<SVGPathElement>("[data-highlighted]")) {
    delete edge.dataset.highlighted;
    delete edge.dataset.parameterStart;
    delete edge.dataset.parameterEnd;
  }
  if (seam) {
    for (const side of seam.sides) {
      const edge = pattern.querySelector<SVGPathElement>(`[data-instance="${side.instance}"] [data-edge="${side.edge}"]`)!;
      edge.dataset.highlighted = "true";
      edge.dataset.parameterStart = String(side.parameters[0]);
      edge.dataset.parameterEnd = String(side.parameters.at(-1));
    }
  }
  const detail = get<HTMLElement>("seam-detail");
  if (seam && assembly) detail.dataset.sourceRevision = assembly.revision;
  else delete detail.dataset.sourceRevision;
  detail.textContent = seam ? seam.sides.map(side =>
    `${side.instance} ${side.edge} t=${side.parameters[0]}→${side.parameters.at(-1)}`).join(" ↔ ") : "";
}

function pick(revision: string, id: string | null) {
  if (!assembly || !draft?.identity.provenance || assembly.revision !== revision
    || draft.source?.revision !== revision || status.dataset.state !== "ready") return;
  const seam = assembly.seams.find(candidate => candidate.id === id);
  preferredSeam = seam?.id ?? null;
  showSelection(seam);
}

function clearAssembly() {
  assembly = null;
  if (view) {
    view.canvas.hidden = true;
    view.renderer?.clear();
  }
  select("seams").replaceChildren(new Option("Choose a seam", ""));
  showSelection(undefined);
}

function retireView() {
  const old = view;
  view = null;
  if (!old) return;
  old.events.abort();
  old.canvas.remove();
  if (old.renderer) old.renderer.dispose();
  else if (!old.context.isContextLost()) old.context.getExtension("WEBGL_lose_context")?.loseContext();
}

function unsupportedWebGL(context: WebGL2RenderingContext): string | null {
  const debug = context.getExtension("WEBGL_debug_renderer_info");
  const renderer = debug ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null;
  if (typeof renderer === "string") {
    if (/swiftshader|llvmpipe|softpipe|lavapipe|software|warp|basic render/i.test(renderer)) {
      return "3D requires hardware acceleration. Software WebGL was detected. The 2D draft remains available.";
    }
    if (/\b(?:intel|nvidia|radeon|amd|apple|adreno|mali|powervr)\b/i.test(renderer)) return null;
  }
  return "3D could not verify hardware acceleration. The 2D draft remains available.";
}

function createView(): View | string {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  canvas.hidden = true;
  canvas.setAttribute("aria-label", "3D view of the current Tee draft");
  let context;
  const unavailable = "WebGL 2 is unavailable. The 2D draft can still be inspected.";
  try {
    context = canvas.getContext("webgl2", { alpha: false, antialias: true });
  } catch {
    return unavailable;
  }
  if (!context) return unavailable;
  const reason = unsupportedWebGL(context);
  if (reason) {
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return reason;
  }
  const created: View = { canvas, context, events: new AbortController(), renderer: null, lost: false };
  const options = { signal: created.events.signal };
  canvas.addEventListener("webglcontextlost", event => {
    event.preventDefault();
    created.lost = true;
    clearAssembly();
    created.renderer?.dispose();
    created.renderer = null;
    canvas.hidden = false;
    show("lost", "3D context lost. Continue inspecting the 2D draft while it recovers.");
  }, options);
  canvas.addEventListener("webglcontextrestored", () => {
    queueMicrotask(() => {
      if (view !== created || !created.lost || !wants3D) return;
      retireView();
      void rebuild();
    });
  }, options);
  rendererSlot.append(canvas);
  return created;
}

async function rebuild(feedback?: string) {
  const ticket = latest.next();
  generation = ticket;
  const started = performance.now();
  clearAssembly();
  if (wants3D && !view?.lost) show("loading", "Building the current Tee assembly…");
  let current: TeeDraft;
  try {
    current = await resolveTeeDraft(history.current());
  } catch (error) {
    if (latest.isCurrent(ticket)) {
      message.textContent = `${errorText(error)} The last 2D drawing remains visible.`;
      if (wants3D) show("error", "3D paused. Correct the draft inputs to continue.");
    }
    return;
  }
  if (!latest.isCurrent(ticket)) return;
  const sourceMs = performance.now() - started;
  draft = current;
  drawPattern(current);
  message.textContent = current.issue ? `${current.issue} Showing the base 2D draft.` : (feedback ?? "");
  if (!wants3D) return;
  if (!current.source || !current.identity.provenance) {
    show("error", "3D paused until the draft has a verified source and passes source checks.");
    return;
  }
  if (view?.lost) return;
  const active = view ?? createView();
  if (typeof active === "string") {
    wants3D = false;
    show("unsupported", active);
    return;
  }
  view = active;
  const ownsView = () => latest.isCurrent(ticket) && view === active && !active.lost;
  try {
    const [mesh, renderer] = await Promise.all([import("./assembly-mesh"), import("./direct-three")]);
    if (!ownsView()) return;
    const assemblyStarted = performance.now();
    const result = mesh.assembleTee(current.source);
    const assemblyMs = performance.now() - assemblyStarted;
    if (result.revision !== current.revision) throw new Error("The assembled revision does not match the 2D draft.");
    active.renderer ??= renderer.default(active.canvas, active.context, pick);
    active.canvas.hidden = false;
    active.renderer.show(result);
    active.canvas.dataset.revision = result.revision;
    assembly = result;
    select("seams").append(...result.seams.map(seam => new Option(seam.label, seam.id)));
    showSelection(result.seams.find(seam => seam.id === preferredSeam));
    timings = { sourceMs, assemblyMs, readyMs: performance.now() - started };
    show("ready", "3D matches the displayed draft. Choose or click a seam to inspect its sewing lines.");
  } catch (error) {
    if (!ownsView()) return;
    clearAssembly();
    show("error", `${errorText(error)} The 2D draft remains available.`);
  }
}

function syncControls() {
  const current = history.current();
  for (const field of teeFields) input(field.id).value = String(current.measurements[field.id]);
  select("size").value = String(current.size);
  select("size").disabled = !!current.provenance?.projectStyle;
  input("use-chest-ease").checked = current.chestEase !== null;
  input("chestEase").disabled = current.chestEase === null;
  input("chestEase").value = String(current.chestEase ?? current.measurements.ease);
  button("undo").disabled = !history.canUndo();
  button("redo").disabled = !history.canRedo();
}

function commit(next: TeeInputs) {
  sourceIntent.next();
  history.commit(next);
  syncControls();
  void rebuild();
}

async function replaceFrom(make: () => Promise<TeeInputs>) {
  const ticket = sourceIntent.next();
  try {
    const next = await make();
    if (sourceIntent.isCurrent(ticket)) commit(next);
  } catch (error) {
    if (sourceIntent.isCurrent(ticket)) void rebuild(errorText(error));
  }
}

get<HTMLElement>("measurements").innerHTML = teeFields.map(field =>
  `<label>${field.label} (cm)<input id="${field.id}" type="number" min="${field.min}" max="${field.max}" step="${field.step}"></label>`).join("");
select("size").append(...sizeSteps.map(item => new Option(item.label, String(item.step))));
const form = get<HTMLFormElement>("tee-inputs");
form.addEventListener("submit", event => event.preventDefault());
form.addEventListener("input", () => {
  sourceIntent.next();
  const current = history.current();
  const size = select("size").value;
  const measurements = { ...current.measurements };
  for (const field of teeFields) measurements[field.id] = input(field.id).valueAsNumber;
  const chestEase = input("use-chest-ease").checked ? input("chestEase").valueAsNumber : null;
  history.commit({ ...current, measurements, size: size === "custom" ? size : Number(size), chestEase });
  input("chestEase").disabled = chestEase === null;
  if (chestEase === null) input("chestEase").value = String(measurements.ease);
  button("undo").disabled = false;
  button("redo").disabled = true;
  void rebuild();
});

function edit(anchor: string, x: number, y: number) {
  return replaceFrom(() => addTeeMove(history.current(), anchor, x, y, globalThis.crypto.randomUUID()));
}

const actions: Record<string, () => void> = {
  "fixture-default": () => commit(initialClassicTeeInputs()),
  "fixture-edited": () => void replaceFrom(() => editedTeeInputs(initialClassicTeeInputs())),
  "apply-asymmetric": () => void edit(asymmetricAnchor, -3, 0),
  "apply-anchor": () => void edit(select("anchor").value, input("delta-x").valueAsNumber, input("delta-y").valueAsNumber),
  "clear-edits": () => commit({ ...history.current(), edits: null }),
  undo: () => { sourceIntent.next(); history.undo(); syncControls(); void rebuild(); },
  redo: () => { sourceIntent.next(); history.redo(); syncControls(); void rebuild(); },
  "save-draft": async () => {
    try {
      localStorage.setItem(storageKey, await saveCandidateTee(history.current()));
      message.textContent = "Draft saved locally.";
    } catch (error) {
      message.textContent = `Could not save. ${errorText(error)}`;
    }
  },
  "reopen-draft": () => {
    const ticket = sourceIntent.next();
    void Promise.resolve().then(() => {
      const saved = localStorage.getItem(storageKey);
      if (saved === null) throw new Error("There is no saved Tee draft.");
      return reopenCandidateTee(saved);
    }).then(next => {
      if (sourceIntent.isCurrent(ticket)) commit(next);
    }, error => {
      if (sourceIntent.isCurrent(ticket)) message.textContent = `Could not reopen. ${errorText(error)}`;
    });
  },
  "open-3d": () => { wants3D = true; void rebuild(); },
  "close-3d": () => { wants3D = false; clearAssembly(); retireView(); show("closed", "3D is closed."); void rebuild(); },
  "turn-left": () => view?.renderer?.turn(-0.22),
  "turn-right": () => view?.renderer?.turn(0.22),
  "zoom-in": () => view?.renderer?.zoomBy(1.15),
  "zoom-out": () => view?.renderer?.zoomBy(1 / 1.15),
  "reset-view": () => view?.renderer?.resetView(),
};

for (const [id, action] of Object.entries(actions)) button(id).addEventListener("click", action);
select("seams").addEventListener("change", () => pick(pattern.dataset.revision ?? "", select("seams").value || null));
window.addEventListener("pagehide", () => {
  latest.next();
  sourceIntent.next();
  clearAssembly();
  retireView();
  if (wants3D) show("loading", "3D paused while this page is hidden.");
});
window.addEventListener("pageshow", event => { if (event.persisted) void rebuild(); });
Object.assign(window, {
  teeProof: Object.freeze({
    diagnostics: () => ({ state: status.dataset.state, revision: draft?.revision ?? null,
      identity: draft?.identity ?? null, generation, selectedSeam, timings, assembly,
      renderer: view?.renderer?.stats() ?? null, camera: view?.renderer?.viewState() ?? null,
    }),
    projectSeam: (id: string) => view?.renderer?.projectSeam(id) ?? null,
    projectLandmarks: () => view?.renderer?.projectLandmarks() ?? {},
  }),
});
syncControls();
void rebuild();
