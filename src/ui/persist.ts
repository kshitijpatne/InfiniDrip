// Versioned workspace persistence. Geometry and exploratory Edit snapshots are
// derived/transient; intentional workspace choices are stored explicitly.
import { Measurements, STANDARD_M, GarmentOptionsByRecipe, GARMENTS, STRETCH_FABRICS } from "../drafting";
import { DEFAULT_FABRIC } from "../render";
import { FIELDS, inputError } from "./controls";
import { Appearance, DEFAULT_APPEARANCE, parseAppearance } from "./appearance";
import { parseSurfaceBook, type SurfaceBook } from "../surface/store";
import type { ViewName } from "./journey";

export const SAVE_VERSION = 5;
export interface Workspace {
  readonly garment: string;
  readonly targetStyle: string;
  readonly stretchFabric: string;
  readonly view: ViewName;
  readonly bodyCroquisView: "front-back" | "front" | "back" | "side";
  readonly exportStep: number;
  readonly fabricWidth: number;
  readonly nestScope: "single" | "marker";
}

const DEFAULT_STRETCH_BY_GARMENT: Readonly<Record<string, string>> = {
  tee: "Cotton jersey",
  fitted: "Cotton jersey",
  tank: "Cotton jersey",
  polo: "Cotton jersey",
  "woven-shirt": "Cotton woven",
  skirt: "Cotton woven",
  trouser: "Cotton woven",
};

/** Fresh-workspace material defaults follow the garment's construction family. */
export function defaultStretchFabricForGarment(garment: string): string {
  return DEFAULT_STRETCH_BY_GARMENT[garment] ?? STRETCH_FABRICS[0].name;
}

export const DEFAULT_WORKSPACE: Workspace = {
  garment: "tee", targetStyle: "Classic tee", stretchFabric: defaultStretchFabricForGarment("tee"),
  view: "pattern", bodyCroquisView: "front-back", exportStep: 0,
  fabricWidth: 150, nestScope: "single",
};
export interface SaveFile {
  readonly v: number;
  readonly measurements: Measurements;
  readonly fabric: string;
  readonly appearance: Appearance;
  readonly garmentOptions: GarmentOptionsByRecipe;
  readonly workspace: Workspace;
  /** Optional artwork state (Slice 126). Absent means empty; malformed in a
   * current-version save is rejected, never silently repaired. */
  readonly surface: SurfaceBook;
}
type LoadResult = ({ ok: true } & Omit<SaveFile, "v">) | { ok: false; error: string };
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export const RECOVERY_VERSION = 1;
export interface RecoveryFile {
  readonly v: number;
  readonly savedAt: number;
  readonly measurements: Record<string, number | null>;
  readonly rawMeasurements: Partial<Record<keyof Measurements, string>>;
  readonly fabric: string;
  readonly appearance: Appearance;
  readonly garmentOptions: Record<string, Record<string, number | null>>;
  readonly rawOptions: Record<string, Record<string, string>>;
  readonly workspace: Workspace;
  readonly materialSelectionExplicit: boolean;
  /** Crash-restore artwork. Absent in older recovery payloads means empty. */
  readonly surface: SurfaceBook;
}
type RecoveryResult = ({ ok: true } & Omit<RecoveryFile, "v">) | { ok: false; error: string };
const RECOVERY_STORAGE_KEY = "patternworks_recovery_v1";

const finiteNumberMap = (value: unknown): value is Record<string, number | null> =>
  object(value) && Object.values(value).every((entry) => entry === null || (typeof entry === "number" && Number.isFinite(entry)));
const stringMap = (value: unknown): value is Record<string, string> =>
  object(value) && Object.values(value).every((entry) => typeof entry === "string");
const recoveryOptions = (value: unknown): value is Record<string, Record<string, number | null>> =>
  object(value) && Object.values(value).every((entry) => finiteNumberMap(entry));
const recoveryRawOptions = (value: unknown): value is Record<string, Record<string, string>> =>
  object(value) && Object.values(value).every((entry) => stringMap(entry));

function validWorkspace(value: unknown): value is Workspace {
  if (!object(value) || typeof value.garment !== "string" || typeof value.targetStyle !== "string"
    || typeof value.stretchFabric !== "string" || typeof value.view !== "string"
    || typeof value.bodyCroquisView !== "string" || typeof value.exportStep !== "number"
    || typeof value.fabricWidth !== "number" || typeof value.nestScope !== "string") return false;
  const recipe = GARMENTS.find((candidate) => candidate.name === value.garment);
  return recipe !== undefined
    && recipe.styles.some((style) => style.name === value.targetStyle)
    && STRETCH_FABRICS.some((fabric) => fabric.name === value.stretchFabric)
    && VIEWS.includes(value.view)
    && ["front-back", "front", "back", "side"].includes(value.bodyCroquisView)
    && recipe.sizes.some((size) => size.step === value.exportStep)
    && Number.isFinite(value.fabricWidth) && value.fabricWidth > 0
    && ["single", "marker"].includes(value.nestScope);
}

export function serialize(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}, workspace: Workspace = DEFAULT_WORKSPACE, appearance: Appearance = DEFAULT_APPEARANCE, surface: SurfaceBook = {}): string {
  return JSON.stringify({ v: SAVE_VERSION, measurements: m, fabric, appearance, garmentOptions, workspace, surface }, null, 2);
}

const LEGACY_REQUIRED = ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"];
const VIEWS = ["pattern", "body", "nest", "spec", "fabric", "check", "edit"];

export function deserialize(json: string): LoadResult {
  let p: unknown;
  try { p = JSON.parse(json); } catch { return { ok: false, error: "Not valid JSON." }; }
  if (!object(p)) return { ok: false, error: "Save file is not an object." };
  if (![1, 2, 3, 4, SAVE_VERSION].includes(p.v as number)) return { ok: false, error: `Unrecognised save version: ${String(p.v)}.` };
  if (!object(p.measurements)) return { ok: false, error: "Missing measurements." };
  const legacy = p.v !== SAVE_VERSION;
  const measurements = { ...STANDARD_M };
  for (const field of FIELDS) {
    let value = p.measurements[field.id];
    if (p.v === 1 && field.id === "strapWidth" && typeof value === "number" && value >= 0 && value <= 30) {
      value = Math.max(0, value - (Number(p.measurements.chest) / 20 + 2));
    }
    const error = inputError(typeof value === "number" ? value : NaN, field);
    if (error) {
      if (legacy && !LEGACY_REQUIRED.includes(field.id)) continue;
      return { ok: false, error: `Invalid ${field.id}. ${error}` };
    }
    measurements[field.id] = value as number;
  }
  const garmentOptions: Record<string, Record<string, number>> = {};
  if (!legacy && !object(p.garmentOptions)) return { ok: false, error: "Invalid garment options." };
  if (object(p.garmentOptions)) {
    for (const [recipe, raw] of Object.entries(p.garmentOptions)) {
      if (!object(raw)) {
        if (legacy) continue;
        return { ok: false, error: `Invalid options for ${recipe}.` };
      }
      const definitions = GARMENTS.find((candidate) => candidate.name === recipe)?.options ?? [];
      garmentOptions[recipe] = {};
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
          if (legacy) continue;
          return { ok: false, error: `${recipe} ${key}: enter a finite number before saving.` };
        }
        const definition = definitions.find((candidate) => candidate.id === key);
        if (definition && inputError(value, definition)) {
          if (legacy) continue;
          return { ok: false, error: `${recipe} ${key}: enter ${definition.min}–${definition.max}.` };
        }
        // Preserve finite work-in-progress choices; guidance still gates output.
        garmentOptions[recipe][key] = value;
      }
    }
  }
  const fabric = typeof p.fabric === "string" && /^#[0-9a-f]{6}$/i.test(p.fabric) ? p.fabric : DEFAULT_FABRIC;
  if (!legacy && fabric !== p.fabric) return { ok: false, error: "Invalid fabric color." };
  const appearance = parseAppearance(p.appearance);
  if (!appearance) return { ok: false, error: "Invalid appearance settings." };
  const surface = parseSurfaceBook(p.surface);
  if (!surface) {
    if (!legacy) return { ok: false, error: "Invalid surface artwork." };
  }
  let workspace = DEFAULT_WORKSPACE;
  if (!legacy) {
    const w = p.workspace;
    if (!validWorkspace(w)) {
      return { ok: false, error: "Invalid workspace choices. Check garment, style, material, view, size and fabric width." };
    }
    workspace = w;
  }
  return { ok: true, measurements, fabric, appearance, garmentOptions, workspace, surface: surface ?? {} };
}

const STORAGE_KEY = "patternworks_save_v1";
export function saveToStorage(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}, workspace: Workspace = DEFAULT_WORKSPACE, appearance: Appearance = DEFAULT_APPEARANCE, surface: SurfaceBook = {}): boolean {
  try {
    const json = serialize(m, fabric, garmentOptions, workspace, appearance, surface);
    if (!deserialize(json).ok) return false;
    localStorage.setItem(STORAGE_KEY, json);
    return true;
  } catch { return false; }
}

/** Distinguish absence/corruption/unavailable storage instead of hiding errors. */
export function readFromStorage(): LoadResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? { ok: false, error: "Nothing saved" } : deserialize(raw);
  } catch { return { ok: false, error: "Saved workspace is unavailable. Check storage access and retry." }; }
}

export function serializeRecovery(file: Omit<RecoveryFile, "v">): string {
  return JSON.stringify({ v: RECOVERY_VERSION, ...file }, null, 2);
}

export function deserializeRecovery(json: string): RecoveryResult {
  let p: unknown;
  try { p = JSON.parse(json); } catch { return { ok: false, error: "Recovery data is not valid JSON." }; }
  if (!object(p)) return { ok: false, error: "Recovery data is not an object." };
  if (p.v !== RECOVERY_VERSION) return { ok: false, error: `Unrecognised recovery version: ${String(p.v)}.` };
  if (typeof p.savedAt !== "number" || !Number.isFinite(p.savedAt)
    || !finiteNumberMap(p.measurements) || !stringMap(p.rawMeasurements)
    || typeof p.fabric !== "string" || !/^#[0-9a-f]{6}$/i.test(p.fabric)
    || !recoveryOptions(p.garmentOptions) || !recoveryRawOptions(p.rawOptions)
    || !validWorkspace(p.workspace) || typeof p.materialSelectionExplicit !== "boolean") {
    return { ok: false, error: "Recovery data is incomplete or invalid." };
  }
  const appearance = parseAppearance(p.appearance);
  if (!appearance) return { ok: false, error: "Recovery appearance settings are invalid." };
  const surface = parseSurfaceBook(p.surface);
  if (!surface) return { ok: false, error: "Recovery surface artwork is invalid." };
  return {
    ok: true,
    savedAt: p.savedAt,
    measurements: p.measurements as Record<keyof Measurements, number | null>,
    rawMeasurements: p.rawMeasurements as Partial<Record<keyof Measurements, string>>,
    fabric: p.fabric,
    appearance,
    garmentOptions: p.garmentOptions,
    rawOptions: p.rawOptions,
    workspace: p.workspace,
    materialSelectionExplicit: p.materialSelectionExplicit,
    surface,
  };
}

export function saveRecoveryToStorage(file: Omit<RecoveryFile, "v">): boolean {
  try {
    const json = serializeRecovery(file);
    if (!deserializeRecovery(json).ok) return false;
    localStorage.setItem(RECOVERY_STORAGE_KEY, json);
    return true;
  } catch { return false; }
}

export function readRecoveryFromStorage(): RecoveryResult {
  try {
    const raw = localStorage.getItem(RECOVERY_STORAGE_KEY);
    return raw === null ? { ok: false, error: "Nothing to recover" } : deserializeRecovery(raw);
  } catch { return { ok: false, error: "Recovery data is unavailable. Check storage access and retry." }; }
}

export function clearRecoveryFromStorage(): boolean {
  try {
    localStorage.removeItem(RECOVERY_STORAGE_KEY);
    return true;
  } catch { return false; }
}

export function loadFromStorage(): Omit<SaveFile, "v"> | null {
  const result = readFromStorage();
  if (!result.ok) return null;
  const { ok: _ok, ...saved } = result;
  return saved;
}
