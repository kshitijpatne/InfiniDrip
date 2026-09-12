// Save/Load: the pattern state that matters is just measurements + fabric colour.
// Everything else (the draft, the canvas, guidance, styles) is re-derived on every
// draw, so it never needs saving.
//
// Format: a plain JSON object with a "v" version field so future changes can
// migrate old saves gracefully. V2 redefines Tank strapWidth as finished span.
//
// The serialise/deserialise functions are pure and storage-agnostic — the UI layer
// is the only thing that touches localStorage, so these stay fully testable.

import { Measurements, STANDARD_M, GarmentOptionsByRecipe } from "../drafting";

export const SAVE_VERSION = 3;

export interface SaveFile {
  readonly v: number;
  readonly measurements: Measurements;
  readonly fabric: string;
  readonly garmentOptions: GarmentOptionsByRecipe;
}

/** Turn the current state into a JSON string ready to store or download. */
export function serialize(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}): string {
  const file: SaveFile = { v: SAVE_VERSION, measurements: m, fabric, garmentOptions };
  return JSON.stringify(file, null, 2);
}

// The set of keys a valid save MUST contain. waist/hip/hipDepth and neck are
// intentionally absent: they arrived after the original save format, so older
// saves won't have them — they are read leniently below (defaulted from
// STANDARD_M) rather than rejected.
const M_KEYS: ReadonlyArray<keyof Measurements> = [
  "chest", "shoulderWidth", "bicep", "length",
  "armholeDepth", "sleeveLength", "ease",
];

/** True if `v` is a finite number within [min, max]. */
function inRange(v: unknown, min: number, max: number): boolean {
  return typeof v === "number" && isFinite(v) && v >= min && v <= max;
}

// Reasonable bounds (same as the UI slider limits).
const BOUNDS: Record<keyof Measurements, [number, number]> = {
  neck:          [25,   70],
  chest:         [60,  160],
  shoulderWidth: [30,   60],
  bicep:         [25,   60],
  length:        [50,   90],
  armholeDepth:  [15,   35],
  sleeveLength:  [10,   70],
  waist:         [50,  140],
  hip:           [60,  150],
  hipDepth:      [10,   40],
  ease:          [ 0,   30],
  // Added in Slice 63: same lenient treatment as waist/hip/hipDepth below.
  strapWidth:    [ 0,   15],
  neckDrop:      [ 0,   18],
  neckWidthEase: [-4,   12],
};

/**
 * Parse and validate a JSON string previously produced by `serialize`.
 * Returns the measurements + fabric on success, or an error message on failure.
 */
export function deserialize(
  json: string
): { ok: true; measurements: Measurements; fabric: string; garmentOptions: GarmentOptionsByRecipe } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: "Not valid JSON." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Save file is not an object." };
  }

  const p = parsed as Record<string, unknown>;

  if (p["v"] !== SAVE_VERSION && p["v"] !== 2 && p["v"] !== 1) {
    return { ok: false, error: `Unrecognised save version: ${String(p["v"])}.` };
  }

  const raw = p["measurements"];
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "Missing measurements." };
  }
  const m = raw as Record<string, unknown>;

  for (const key of M_KEYS) {
    const [lo, hi] = BOUNDS[key];
    if (!inRange(m[key], lo, hi)) {
      return { ok: false, error: `Invalid value for "${key}": ${String(m[key])}.` };
    }
  }

  const fabric = typeof p["fabric"] === "string" && p["fabric"].length > 0
    ? p["fabric"]
    : STANDARD_M.toString(); // fallback won't be hit in practice

  const legacyStrap = p["v"] === 1 && inRange(m["strapWidth"], 0, 30)
    ? Math.max(0, (m["strapWidth"] as number) - (Number(m["chest"]) / 20 + 2))
    : m["strapWidth"];
  const rawOptions = p["garmentOptions"];
  const garmentOptions: Record<string, Record<string, number>> = {};
  if (typeof rawOptions === "object" && rawOptions !== null) {
    for (const [recipe, raw] of Object.entries(rawOptions as Record<string, unknown>)) {
      if (typeof raw !== "object" || raw === null) continue;
      const values = Object.fromEntries(Object.entries(raw as Record<string, unknown>)
        .filter(([, value]) => typeof value === "number" && Number.isFinite(value))) as Record<string, number>;
      garmentOptions[recipe] = values;
    }
  }
  return {
    ok: true,
    measurements: {
      // Added in Slice 86: older saves lack the independent neck measurement,
      // so they retain the standard starting value rather than being rejected.
      neck:          inRange(m["neck"], BOUNDS.neck[0], BOUNDS.neck[1]) ? (m["neck"] as number) : STANDARD_M.neck,
      chest:         m["chest"]         as number,
      shoulderWidth: m["shoulderWidth"] as number,
      bicep:         m["bicep"]         as number,
      length:        m["length"]        as number,
      armholeDepth:  m["armholeDepth"]  as number,
      sleeveLength:  m["sleeveLength"]  as number,
      // Added in Slice 37: older saves lack these, so default rather than reject.
      waist:         inRange(m["waist"], BOUNDS.waist[0], BOUNDS.waist[1]) ? (m["waist"] as number) : STANDARD_M.waist,
      hip:           inRange(m["hip"],   BOUNDS.hip[0],   BOUNDS.hip[1])   ? (m["hip"]   as number) : STANDARD_M.hip,
      // Added in Slice 42: same lenient treatment, for the same reason.
      hipDepth:      inRange(m["hipDepth"], BOUNDS.hipDepth[0], BOUNDS.hipDepth[1]) ? (m["hipDepth"] as number) : STANDARD_M.hipDepth,
      ease:          m["ease"]          as number,
      // Added in Slice 63: same lenient treatment, for the same reason.
      strapWidth:    inRange(legacyStrap, BOUNDS.strapWidth[0], BOUNDS.strapWidth[1]) ? (legacyStrap as number) : STANDARD_M.strapWidth,
      neckDrop:      inRange(m["neckDrop"], BOUNDS.neckDrop[0], BOUNDS.neckDrop[1]) ? (m["neckDrop"] as number) : STANDARD_M.neckDrop,
      neckWidthEase: inRange(m["neckWidthEase"], BOUNDS.neckWidthEase[0], BOUNDS.neckWidthEase[1]) ? (m["neckWidthEase"] as number) : STANDARD_M.neckWidthEase,
    },
    fabric,
    garmentOptions,
  };
}

const STORAGE_KEY = "patternworks_save_v1";

/** Persist to localStorage. Returns false if storage is unavailable. */
export function saveToStorage(m: Measurements, fabric: string, garmentOptions: GarmentOptionsByRecipe = {}): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(m, fabric, garmentOptions));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load from localStorage.
 * Returns the saved state on success, or null if nothing is stored / it's invalid.
 */
export function loadFromStorage(): { measurements: Measurements; fabric: string; garmentOptions: GarmentOptionsByRecipe } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const result = deserialize(raw);
    return result.ok ? { measurements: result.measurements, fabric: result.fabric, garmentOptions: result.garmentOptions } : null;
  } catch {
    return null;
  }
}
