// Save/Load: the pattern state that matters is just measurements + fabric colour.
// Everything else (the draft, the canvas, guidance, styles) is re-derived on every
// draw, so it never needs saving.
//
// Format: a plain JSON object with a "v" version field so future changes can
// migrate old saves gracefully. V1 holds measurements + fabric.
//
// The serialise/deserialise functions are pure and storage-agnostic — the UI layer
// is the only thing that touches localStorage, so these stay fully testable.

import { Measurements, STANDARD_M } from "../drafting";

export const SAVE_VERSION = 1;

export interface SaveFile {
  readonly v: number;
  readonly measurements: Measurements;
  readonly fabric: string;
}

/** Turn the current state into a JSON string ready to store or download. */
export function serialize(m: Measurements, fabric: string): string {
  const file: SaveFile = { v: SAVE_VERSION, measurements: m, fabric };
  return JSON.stringify(file, null, 2);
}

// The set of keys a valid save MUST contain. waist/hip/hipDepth are intentionally
// absent: they arrived in Slices 37 and 42, so older saves won't have them — they
// are read leniently below (defaulted from STANDARD_M) rather than required.
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
};

/**
 * Parse and validate a JSON string previously produced by `serialize`.
 * Returns the measurements + fabric on success, or an error message on failure.
 */
export function deserialize(
  json: string
): { ok: true; measurements: Measurements; fabric: string } | { ok: false; error: string } {
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

  if (p["v"] !== SAVE_VERSION) {
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

  return {
    ok: true,
    measurements: {
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
    },
    fabric,
  };
}

const STORAGE_KEY = "patternworks_save_v1";

/** Persist to localStorage. Returns false if storage is unavailable. */
export function saveToStorage(m: Measurements, fabric: string): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(m, fabric));
    return true;
  } catch {
    return false;
  }
}

/**
 * Load from localStorage.
 * Returns the saved state on success, or null if nothing is stored / it's invalid.
 */
export function loadFromStorage(): { measurements: Measurements; fabric: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const result = deserialize(raw);
    return result.ok ? { measurements: result.measurements, fabric: result.fabric } : null;
  } catch {
    return null;
  }
}
