// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import {
  serialize,
  deserialize,
  saveToStorage,
  loadFromStorage,
  SAVE_VERSION,
} from "./persist";

const FABRIC = "#F5F5DC";

// ── serialize ─────────────────────────────────────────────────────────────────

describe("serialize", () => {
  it("produces valid JSON containing the version, measurements, and fabric", () => {
    const json = serialize(STANDARD_M, FABRIC);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(SAVE_VERSION);
    expect(parsed.measurements.chest).toBe(STANDARD_M.chest);
    expect(parsed.fabric).toBe(FABRIC);
  });

  it("round-trips: deserialize(serialize(m, f)) gives back m and f", () => {
    const json = serialize(STANDARD_M, FABRIC);
    const result = deserialize(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements).toEqual(STANDARD_M);
    expect(result.fabric).toBe(FABRIC);
  });
});

// ── deserialize — success ─────────────────────────────────────────────────────

describe("deserialize (success)", () => {
  it("accepts a valid save and returns measurements + fabric", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.shoulderWidth).toBe(STANDARD_M.shoulderWidth);
    expect(result.fabric).toBe(FABRIC);
  });
});

// ── deserialize — error branches ──────────────────────────────────────────────
describe("deserialize (errors)", () => {
  it("rejects non-JSON input", () => {
    const r = deserialize("not json at all {{");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("JSON");
  });

  it("rejects a non-object root", () => {
    const r = deserialize("42");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("object");
  });

  it("rejects a wrong version number", () => {
    const r = deserialize(JSON.stringify({ v: 99, measurements: STANDARD_M, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("version");
  });

  it("rejects a missing measurements field", () => {
    const r = deserialize(JSON.stringify({ v: SAVE_VERSION, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("measurements");
  });

  it("rejects an out-of-range measurement", () => {
    const bad = { ...STANDARD_M, chest: 999 };
    const r = deserialize(JSON.stringify({ v: SAVE_VERSION, measurements: bad, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("chest");
  });

  it("rejects a non-numeric measurement value", () => {
    const bad = { ...STANDARD_M, ease: "lots" };
    const r = deserialize(JSON.stringify({ v: SAVE_VERSION, measurements: bad, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("ease");
  });
});

// ── localStorage helpers ─────────────────────────────────────────────────────
describe("saveToStorage / loadFromStorage", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads back the same state", () => {
    saveToStorage(STANDARD_M, FABRIC);
    const loaded = loadFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.measurements).toEqual(STANDARD_M);
    expect(loaded!.fabric).toBe(FABRIC);
  });

  it("returns null when nothing has been saved", () => {
    expect(loadFromStorage()).toBeNull();
  });

  it("returns null when the stored value is corrupt", () => {
    localStorage.setItem("patternworks_save_v1", "{{corrupt}}");
    expect(loadFromStorage()).toBeNull();
  });

  it("saveToStorage returns true on success", () => {
    expect(saveToStorage(STANDARD_M, FABRIC)).toBe(true);
  });

  it("saveToStorage returns false when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new Error("quota");
    });
    expect(saveToStorage(STANDARD_M, FABRIC)).toBe(false);
    vi.restoreAllMocks();
  });

  it("loadFromStorage returns null when localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    expect(loadFromStorage()).toBeNull();
    vi.restoreAllMocks();
  });
});

// ── missing fabric fallback ───────────────────────────────────────────────────
describe("deserialize (missing fabric fallback)", () => {
  it("accepts a save with a missing fabric field and substitutes a non-empty string", () => {
    const raw = JSON.stringify({ v: SAVE_VERSION, measurements: STANDARD_M });
    const r = deserialize(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(typeof r.fabric).toBe("string");
  });
});
