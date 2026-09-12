// Versioned workspace persistence. Geometry and exploratory Edit snapshots are
// derived/transient; intentional workspace choices are stored explicitly.
import { Measurements, STANDARD_M, GarmentOptionsByRecipe, GARMENTS, STRETCH_FABRICS } from "../drafting";
import { DEFAULT_FABRIC } from "../render";
import { FIELDS, inputError } from "./controls";
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
  readonly garmentOptions: GarmentOptionsByRecipe;
  readonly workspace: Workspace;
}
type LoadResult = ({ ok: true } & Omit<SaveFile, "v">) | { ok: false; error: string };
const object = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function serialize(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}, workspace: Workspace = DEFAULT_WORKSPACE): string {
  return JSON.stringify({ v: SAVE_VERSION, measurements: m, fabric, garmentOptions, workspace }, null, 2);
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
  let workspace = DEFAULT_WORKSPACE;
  if (!legacy) {
    const w = p.workspace;
    if (!object(w)) return { ok: false, error: "Missing workspace choices." };
    const recipe = GARMENTS.find((r) => r.name === w.garment);
    if (!recipe || !recipe.styles.some((style) => style.name === w.targetStyle)
      || !STRETCH_FABRICS.some((f) => f.name === w.stretchFabric)
      || !VIEWS.includes(w.view as string)
      || !["front-back", "front", "back", "side"].includes(w.bodyCroquisView as string)
      || !recipe.sizes.some((size) => size.step === w.exportStep)
      || typeof w.fabricWidth !== "number" || !Number.isFinite(w.fabricWidth) || w.fabricWidth <= 0
      || !["single", "marker"].includes(w.nestScope as string)) {
      return { ok: false, error: "Invalid workspace choices. Check garment, style, material, view, size and fabric width." };
    }
    workspace = w as unknown as Workspace;
  }
  return { ok: true, measurements, fabric, garmentOptions, workspace };
}

const STORAGE_KEY = "patternworks_save_v1";
export function saveToStorage(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}, workspace: Workspace = DEFAULT_WORKSPACE): boolean {
  try {
    const json = serialize(m, fabric, garmentOptions, workspace);
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

export function loadFromStorage(): Omit<SaveFile, "v"> | null {
  const result = readFromStorage();
  if (!result.ok) return null;
  const { ok: _ok, ...saved } = result;
  return saved;
}
