// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import {
  serialize,
  deserialize,
  saveToStorage,
  loadFromStorage,
  SAVE_VERSION,
  DEFAULT_WORKSPACE,
  defaultStretchFabricForGarment,
  readFromStorage,
  serializeRecovery,
  deserializeRecovery,
  saveRecoveryToStorage,
  readRecoveryFromStorage,
  clearRecoveryFromStorage,
  parseNestingIntelligence,
  parseRawNestingIntelligence,
} from "./persist";
import { DEFAULT_APPEARANCE } from "./appearance";
import { FIELDS } from "./controls";
import { POLO } from "../drafting/recipe";
import { defaultGarmentOptions } from "../drafting/options";

const FABRIC = "#3A4150";

describe("v4 workspace validation", () => {
  const valid = () => JSON.parse(serialize(STANDARD_M, FABRIC));
  it("uses identical edit/save/load bounds, including length 100 and negative ease", () => {
    const m = { ...STANDARD_M, length: 100, shoulderWidth: 70, bicep: 20, armholeDepth: 12, sleeveLength: 8, ease: -8 };
    expect(saveToStorage(m, FABRIC)).toBe(true);
    expect(loadFromStorage()!.measurements).toEqual(m);
    const previous = localStorage.getItem("patternworks_save_v1");
    expect(saveToStorage({ ...m, chest: NaN }, FABRIC)).toBe(false);
    expect(localStorage.getItem("patternworks_save_v1")).toBe(previous);
  });
  it("round-trips every workspace choice and finite design options", () => {
    const workspace = { ...DEFAULT_WORKSPACE, garment: "woven-shirt", targetStyle: "Relaxed woven shirt",
      stretchFabric: "Linen", view: "fabric" as const, bodyCroquisView: "side" as const,
      exportStep: 2, fabricWidth: 120, nestScope: "marker" as const };
    const result = deserialize(serialize(STANDARD_M, FABRIC, { "woven-shirt": { buttonCount: 6 } }, workspace));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.workspace).toEqual(workspace);
      expect(result.garmentOptions["woven-shirt"].buttonCount).toBe(6);
    }
  });
  it("round-trips appearance without changing the workspace contract", () => {
    const appearance = { texture: "rib" as const, shine: 35 };
    const result = deserialize(serialize(STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, appearance));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.appearance).toEqual(appearance);
  });
  it("keeps a current save created before appearance was added", () => {
    const raw = JSON.parse(serialize(STANDARD_M, FABRIC));
    delete raw.appearance;
    const result = deserialize(JSON.stringify(raw));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.appearance).toEqual(DEFAULT_APPEARANCE);
  });
  it("round-trips a single front or back body focus", () => {
    for (const bodyCroquisView of ["front", "back"] as const) {
      const workspace = { ...DEFAULT_WORKSPACE, bodyCroquisView };
      const result = deserialize(serialize(STANDARD_M, FABRIC, {}, workspace));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.workspace.bodyCroquisView).toBe(bodyCroquisView);
    }
  });
  it("rejects corrupt current saves instead of silently defaulting selected state", () => {
    const changes = [{ measurements: null }, { measurements: [] }, { garmentOptions: null },
      { garmentOptions: { polo: null } }, { garmentOptions: { polo: { standHeight: null } } },
      { fabric: "bad" }, { fabric: 42 }, { workspace: null },
      { measurements: { ...STANDARD_M, neck: 999 } }];
    for (const change of changes) expect(deserialize(JSON.stringify({ ...valid(), ...change })).ok).toBe(false);
    for (const change of [{ garment: "missing" }, { targetStyle: "missing" }, { stretchFabric: "missing" },
      { view: "missing" }, { bodyCroquisView: "missing" }, { exportStep: 99 },
      { fabricWidth: "150" }, { fabricWidth: 0 }, { nestScope: "missing" }]) {
      expect(deserialize(JSON.stringify({ ...valid(), workspace: { ...DEFAULT_WORKSPACE, ...change } })).ok).toBe(false);
    }
    expect(deserialize(serialize(STANDARD_M, FABRIC).replace('"fabricWidth": 150', '"fabricWidth": 1e400')).ok).toBe(false);
    expect(deserialize(serialize(STANDARD_M, FABRIC, { polo: { standHeight: 2 } }).replace('"standHeight": 2', '"standHeight": 1e400')).ok).toBe(false);
    expect(deserialize(serialize(STANDARD_M, FABRIC, { "woven-shirt": { buttonCount: 8 } })).ok).toBe(false);
    expect(deserialize("[]").ok).toBe(false);
  });
  it("retains v1/v2/v3 migration and distinguishes missing from corrupt storage", () => {
    for (const v of [1, 2, 3]) {
      const result = deserialize(JSON.stringify({ v, measurements: { ...STANDARD_M, strapWidth: 99 } }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.workspace).toEqual(DEFAULT_WORKSPACE);
    }
    localStorage.clear();
    expect(readFromStorage()).toEqual({ ok: false, error: "Nothing saved" });
    localStorage.setItem("patternworks_save_v1", "broken");
    expect(readFromStorage()).toEqual({ ok: false, error: "Not valid JSON." });
  });

  it("round-trips an unfinished recovery draft without making it a valid save", () => {
    const recovery = {
      savedAt: 123,
      measurements: Object.fromEntries(FIELDS.map((field) => [field.id, field.id === "chest" ? null : STANDARD_M[field.id]])),
      rawMeasurements: { chest: "" },
      fabric: FABRIC,
      appearance: DEFAULT_APPEARANCE,
      garmentOptions: { tee: {} },
      rawOptions: { tee: {} },
      workspace: DEFAULT_WORKSPACE,
      materialSelectionExplicit: false,
      surface: {},
      rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
    } as const;
    const result = deserializeRecovery(serializeRecovery(recovery));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.measurements.chest).toBeNull();
      expect(result.rawMeasurements.chest).toBe("");
    }
    expect(saveRecoveryToStorage(recovery)).toBe(true);
    expect(readRecoveryFromStorage().ok).toBe(true);
    expect(clearRecoveryFromStorage()).toBe(true);
    expect(readRecoveryFromStorage()).toEqual({ ok: false, error: "Nothing to recover" });
  });

  it("rejects malformed recovery data without weakening current-save validation", () => {
    const recovery = {
      savedAt: 123,
      measurements: Object.fromEntries(FIELDS.map((field) => [field.id, STANDARD_M[field.id]])),
      rawMeasurements: {}, fabric: FABRIC, appearance: DEFAULT_APPEARANCE,
      garmentOptions: { tee: {} }, rawOptions: { tee: {} },
      workspace: DEFAULT_WORKSPACE, materialSelectionExplicit: false, surface: {},
      rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
    };
    const valid = JSON.parse(serializeRecovery(recovery));
    expect(deserializeRecovery("[]").ok).toBe(false);
    expect(deserializeRecovery("null").ok).toBe(false);
    for (const change of [
      { v: 99 }, { measurements: [] }, { rawMeasurements: { chest: 1 } },
      { fabric: "bad" }, { garmentOptions: { tee: [] } },
      { rawOptions: { tee: { ease: 1 } } }, { appearance: { texture: "missing", shine: 50 } },
      { workspace: { ...DEFAULT_WORKSPACE, garment: "missing" } }, { materialSelectionExplicit: "no" },
      { rawNestingIntelligence: { buffer: 1 } }, { rawNestingIntelligence: null },
      { rawNestingIntelligence: { buffer: "10", available: 1, napAware: true } },
      { rawNestingIntelligence: { buffer: "10", available: "", napAware: "yes" } },
    ]) expect(deserializeRecovery(JSON.stringify({ ...valid, ...change })).ok).toBe(false);
    localStorage.setItem("patternworks_recovery_v1", "broken");
    expect(readRecoveryFromStorage()).toEqual({ ok: false, error: "Recovery data is not valid JSON." });
    expect(saveRecoveryToStorage({ ...recovery, fabric: "bad" })).toBe(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => { throw new Error("quota"); });
    expect(saveRecoveryToStorage(recovery)).toBe(false);
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => { throw new Error("unavailable"); });
    expect(readRecoveryFromStorage()).toEqual({ ok: false, error: "Recovery data is unavailable. Check storage access and retry." });
    vi.restoreAllMocks();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementationOnce(() => { throw new Error("unavailable"); });
    expect(clearRecoveryFromStorage()).toBe(false);
    vi.restoreAllMocks();
  });
});

describe("fresh workspace material defaults", () => {
  it("uses a garment-appropriate stretch material and a woven fallback", () => {
    expect(defaultStretchFabricForGarment("tee")).toBe("Cotton jersey");
    expect(defaultStretchFabricForGarment("fitted")).toBe("Cotton jersey");
    expect(defaultStretchFabricForGarment("tank")).toBe("Cotton jersey");
    expect(defaultStretchFabricForGarment("polo")).toBe("Cotton jersey");
    expect(defaultStretchFabricForGarment("woven-shirt")).toBe("Cotton woven");
    expect(defaultStretchFabricForGarment("skirt")).toBe("Cotton woven");
    expect(defaultStretchFabricForGarment("trouser")).toBe("Cotton woven");
    expect(defaultStretchFabricForGarment("future")).toBe("Cotton woven");
  });
});

// ── serialize ─────────────────────────────────────────────────────────────────

describe("serialize", () => {
  it("produces valid JSON containing the version, measurements, and fabric", () => {
    const json = serialize(STANDARD_M, FABRIC);
    const parsed = JSON.parse(json);
    expect(parsed.v).toBe(SAVE_VERSION);
    expect(parsed.measurements.chest).toBe(STANDARD_M.chest);
    expect(parsed.fabric).toBe(FABRIC);
    expect(parsed.appearance).toEqual(DEFAULT_APPEARANCE);
  });

  it("round-trips: deserialize(serialize(m, f)) gives back m and f", () => {
    const json = serialize(STANDARD_M, FABRIC);
    const result = deserialize(json);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements).toEqual(STANDARD_M);
    expect(result.fabric).toBe(FABRIC);
    expect(result.garmentOptions).toEqual({});
  });

  it("round-trips recipe-owned design options separately from measurements", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC, { polo: { standHeight: 2, leafDepth: 5 } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garmentOptions).toEqual({ polo: { standHeight: 2, leafDepth: 5 } });
  });

  it("loads pre-Epic-11 Polo options and fills V2 defaults without a save-version bump", () => {
    const legacyOptions = { polo: { placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5 } };
    const poloWorkspace = { ...DEFAULT_WORKSPACE, garment: "polo", targetStyle: "Classic polo" };
    const result = deserialize(serialize(STANDARD_M, FABRIC, legacyOptions, poloWorkspace));
    expect(result.ok).toBe(true);
    expect(JSON.parse(serialize(STANDARD_M, FABRIC, legacyOptions, poloWorkspace)).v).toBe(SAVE_VERSION);
    if (result.ok) {
      const merged = { ...defaultGarmentOptions(POLO.options ?? []), ...result.garmentOptions.polo };
      expect(merged).toMatchObject({ standFrontRise: 0.75, collarPointExtension: 1.5, sideVentDepth: 6, backHemDrop: 1.5 });
      expect(result.garmentOptions.polo).toEqual(legacyOptions.polo);
    }
  });

  it("preserves options for a future recipe without a local definition", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC, { future: { panelCount: 2 } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garmentOptions).toEqual({ future: { panelCount: 2 } });
  });

  it("drops malformed per-recipe option values without rejecting a valid save", () => {
    const result = deserialize(JSON.stringify({
      v: 3,
      measurements: STANDARD_M,
      fabric: FABRIC,
      garmentOptions: { polo: { standHeight: 2, leafDepth: "five" }, broken: null },
    }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garmentOptions).toEqual({ polo: { standHeight: 2 } });
  });

  it("drops out-of-range known options while migrating a legacy save", () => {
    const result = deserialize(JSON.stringify({
      v: 3, measurements: STANDARD_M, fabric: FABRIC,
      garmentOptions: { "woven-shirt": { buttonCount: 8 } },
    }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.garmentOptions).toEqual({ "woven-shirt": {} });
  });
});

// ── deserialize — success ─────────────────────────────────────────────────────

describe("deserialize (success)", () => {
  it("loads a pre-Slice-86 save with no neck, defaulting it from STANDARD_M", () => {
    const { neck, ...legacy } = STANDARD_M;
    const result = deserialize(JSON.stringify({ v: 3, measurements: legacy, fabric: FABRIC }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.measurements.neck).toBe(STANDARD_M.neck);
  });

  it("accepts a valid save and returns measurements + fabric", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.shoulderWidth).toBe(STANDARD_M.shoulderWidth);
    expect(result.fabric).toBe(FABRIC);
  });

  it("round-trips the waist and hip added in Slice 37", () => {
    const m = { ...STANDARD_M, waist: 90, hip: 108 };
    const result = deserialize(serialize(m, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.waist).toBe(90);
    expect(result.measurements.hip).toBe(108);
  });

  it("loads an older save with no waist/hip, defaulting them from STANDARD_M", () => {
    // Simulate a pre-Slice-37 file: measurements without waist/hip.
    const { waist, hip, ...legacy } = STANDARD_M;
    const r = deserialize(JSON.stringify({ v: 3, measurements: legacy, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.waist).toBe(STANDARD_M.waist);
    expect(r.measurements.hip).toBe(STANDARD_M.hip);
    expect(r.measurements.chest).toBe(STANDARD_M.chest); // the rest still load
  });

  it("accepts a v4 save and defaults lower-body fields added in v5", () => {
    const { crotchDepth, thigh, knee, inseam, ...legacy } = STANDARD_M;
    const r = deserialize(JSON.stringify({ v: 4, measurements: legacy, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.crotchDepth).toBe(STANDARD_M.crotchDepth);
    expect(r.measurements.thigh).toBe(STANDARD_M.thigh);
    expect(r.measurements.knee).toBe(STANDARD_M.knee);
    expect(r.measurements.inseam).toBe(STANDARD_M.inseam);
  });

  it("round-trips the lower-body measurements and recipe options", () => {
    const m = { ...STANDARD_M, crotchDepth: 29, thigh: 62, knee: 43, inseam: 82 };
    const options = { trouser: { frontRiseEase: 1.5, pocketDrop: 3 } };
    const result = deserialize(serialize(m, FABRIC, options));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements).toEqual(m);
    expect(result.garmentOptions).toEqual(options);
  });

  it("round-trips the hipDepth added in Slice 42", () => {
    const m = { ...STANDARD_M, hipDepth: 26 };
    const result = deserialize(serialize(m, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.hipDepth).toBe(26);
  });

  it("loads a pre-Slice-42 save with no hipDepth, defaulting it from STANDARD_M", () => {
    const { hipDepth, ...legacy } = STANDARD_M;
    const r = deserialize(JSON.stringify({ v: 3, measurements: legacy, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.hipDepth).toBe(STANDARD_M.hipDepth);
    expect(r.measurements.waist).toBe(STANDARD_M.waist); // the rest still load
  });

  it("defaults an out-of-range hipDepth rather than rejecting the whole save", () => {
    const r = deserialize(JSON.stringify({
      v: 3, measurements: { ...STANDARD_M, hipDepth: 999 }, fabric: FABRIC,
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.hipDepth).toBe(STANDARD_M.hipDepth);
  });

  it("round-trips the strapWidth/neckDrop added in Slice 63", () => {
    const m = { ...STANDARD_M, strapWidth: 12, neckDrop: 7 };
    const result = deserialize(serialize(m, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.strapWidth).toBe(12);
    expect(result.measurements.neckDrop).toBe(7);
  });

  it("migrates a v1 strap point to finished strap span", () => {
    const r = deserialize(JSON.stringify({ v: 1, measurements: { ...STANDARD_M, strapWidth: 15 }, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.measurements.strapWidth).toBe(8);
  });

  it("round-trips the Tank neckline width adjustment", () => {
    const result = deserialize(serialize({ ...STANDARD_M, neckWidthEase: 3 }, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.measurements.neckWidthEase).toBe(3);
  });

  it("loads a pre-Slice-63 save with no strapWidth/neckDrop, defaulting them from STANDARD_M", () => {
    const { strapWidth, neckDrop, ...legacy } = STANDARD_M;
    const r = deserialize(JSON.stringify({ v: 3, measurements: legacy, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.strapWidth).toBe(STANDARD_M.strapWidth);
    expect(r.measurements.neckDrop).toBe(STANDARD_M.neckDrop);
    expect(r.measurements.hipDepth).toBe(STANDARD_M.hipDepth); // the rest still load
  });

  it("loads a save without neckline width adjustment using the derived default", () => {
    const { neckWidthEase, ...legacy } = STANDARD_M;
    const r = deserialize(JSON.stringify({ v: 3, measurements: legacy, fabric: FABRIC }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.neckWidthEase).toBe(STANDARD_M.neckWidthEase);
  });

  it("defaults an out-of-range strapWidth/neckDrop rather than rejecting the whole save", () => {
    const r = deserialize(JSON.stringify({
      v: 3, measurements: { ...STANDARD_M, strapWidth: 999, neckDrop: -5 }, fabric: FABRIC,
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.strapWidth).toBe(STANDARD_M.strapWidth);
    expect(r.measurements.neckDrop).toBe(STANDARD_M.neckDrop);
  });

  it("defaults an out-of-range neckline width adjustment", () => {
    const r = deserialize(JSON.stringify({
      v: 3, measurements: { ...STANDARD_M, neckWidthEase: 999 }, fabric: FABRIC,
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.measurements.neckWidthEase).toBe(STANDARD_M.neckWidthEase);
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
    const r = deserialize(JSON.stringify({ v: 3, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("measurements");
  });

  it("rejects malformed appearance settings in a current save", () => {
    const raw = JSON.parse(serialize(STANDARD_M, FABRIC));
    for (const appearance of [null, { texture: "unknown", shine: 0 }, { texture: "woven", shine: 101 }]) {
      const r = deserialize(JSON.stringify({ ...raw, appearance }));
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("appearance");
    }
  });

  it("rejects an out-of-range measurement", () => {
    const bad = { ...STANDARD_M, chest: 999 };
    const r = deserialize(JSON.stringify({ v: 3, measurements: bad, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("chest");
  });

  it("rejects a non-numeric measurement value", () => {
    const bad = { ...STANDARD_M, ease: "lots" };
    const r = deserialize(JSON.stringify({ v: 3, measurements: bad, fabric: FABRIC }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toContain("ease");
  });
});

// ── localStorage helpers ─────────────────────────────────────────────────────
describe("saveToStorage / loadFromStorage", () => {
  beforeEach(() => localStorage.clear());

  it("saves and loads back the same state", () => {
    saveToStorage(STANDARD_M, FABRIC, { polo: { placketLength: 14 } });
    const loaded = loadFromStorage();
    expect(loaded).not.toBeNull();
    expect(loaded!.measurements).toEqual(STANDARD_M);
    expect(loaded!.fabric).toBe(FABRIC);
    expect(loaded!.garmentOptions).toEqual({ polo: { placketLength: 14 } });
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
    const raw = JSON.stringify({ v: 3, measurements: STANDARD_M });
    const r = deserialize(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(typeof r.fabric).toBe("string");
  });
});

// ── surface artwork section (Slice 126) ───────────────────────────────────────
describe("deserialize (surface artwork section)", () => {
  const artwork = {
    id: "chest-print",
    kind: "print",
    pieceRole: "front",
    widthCm: 20,
    heightCm: 25,
    transform: { dx: 1, dy: 2, scale: 1, rotationDeg: 0 },
    zOrder: 0,
    sourceName: "tiger.svg",
  };
  const book = { "tee/Classic tee": { styleName: "Classic tee", placements: [artwork] } };

  it("round-trips artwork through serialize and localStorage", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE, book));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.surface).toEqual(book);
    expect(saveToStorage(STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE, book)).toBe(true);
    expect(loadFromStorage()!.surface).toEqual(book);
  });

  it("loads pre-surface saves with an empty book", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.surface).toEqual({});
    const legacy = deserialize(JSON.stringify({ v: 3, measurements: STANDARD_M, fabric: FABRIC }));
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) return;
    expect(legacy.surface).toEqual({});
  });

  it("preserves raw invalid placement values instead of rejecting the save", () => {
    const raw = { "tee/A": { styleName: "A", placements: [{ ...artwork, widthCm: "huge" }] } };
    const result = deserialize(serialize(STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE, raw));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.surface).toEqual(raw);
  });

  it("rejects a malformed section in a current-version save", () => {
    const raw = JSON.parse(serialize(STANDARD_M, FABRIC));
    expect(deserialize(JSON.stringify({ ...raw, surface: [] })).ok).toBe(false);
    expect(deserialize(JSON.stringify({ ...raw, surface: { key: null } })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, surface: { key: { styleName: "A", placements: [null] } },
    })).ok).toBe(false);
  });

  it("tolerates a malformed section in a legacy save", () => {
    const legacy = deserialize(JSON.stringify({
      v: 3, measurements: STANDARD_M, fabric: FABRIC, surface: { key: null },
    }));
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) return;
    expect(legacy.surface).toEqual({});
  });

  it("round-trips artwork through recovery storage and rejects a bad section", () => {
    const recovery = {
      savedAt: 7,
      measurements: Object.fromEntries(FIELDS.map((field) => [field.id, STANDARD_M[field.id]])),
      rawMeasurements: {}, fabric: FABRIC, appearance: DEFAULT_APPEARANCE,
      garmentOptions: { tee: {} }, rawOptions: { tee: {} },
      workspace: DEFAULT_WORKSPACE, materialSelectionExplicit: false, surface: book,
      rawNestingIntelligence: { buffer: "10", available: "", napAware: true },
    };
    expect(deserializeRecovery(serializeRecovery(recovery)).ok).toBe(true);
    const valid = JSON.parse(serializeRecovery(recovery));
    expect(deserializeRecovery(JSON.stringify({ ...valid, surface: [] })).ok).toBe(false);
    const without = JSON.parse(JSON.stringify(valid));
    delete without.surface;
    const migrated = deserializeRecovery(JSON.stringify(without));
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;
    expect(migrated.surface).toEqual({});
  });
});

// ── nesting-intelligence section (Slice 133) ────────────────────────────────
describe("deserialize (nesting-intelligence section)", () => {
  const section = { bufferPct: 10, availableLengthCm: 150, napAware: false };

  it("round-trips planning values through serialize and localStorage", () => {
    const result = deserialize(serialize(
      STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE, {}, section));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nestingIntelligence).toEqual(section);
    expect(saveToStorage(
      STANDARD_M, FABRIC, {}, DEFAULT_WORKSPACE, DEFAULT_APPEARANCE, {}, section)).toBe(true);
    expect(loadFromStorage()!.nestingIntelligence).toEqual(section);
  });

  it("loads old saves without the section as defaults", () => {
    const result = deserialize(serialize(STANDARD_M, FABRIC));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.nestingIntelligence).toEqual({ bufferPct: 10, availableLengthCm: null, napAware: true });
    const legacy = deserialize(JSON.stringify({ v: 3, measurements: STANDARD_M, fabric: FABRIC }));
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) return;
    expect(legacy.nestingIntelligence).toEqual({ bufferPct: 10, availableLengthCm: null, napAware: true });
  });

  it("rejects malformed sections in current saves but tolerates legacy ones", () => {
    const raw = JSON.parse(serialize(STANDARD_M, FABRIC));
    expect(deserialize(JSON.stringify({ ...raw, nestingIntelligence: null })).ok).toBe(false);
    expect(deserialize(JSON.stringify({ ...raw, nestingIntelligence: [] })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 60, availableLengthCm: null, napAware: true },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 10, availableLengthCm: 0, napAware: true },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 10, availableLengthCm: null, napAware: "yes" },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: NaN, availableLengthCm: null, napAware: true },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 10, availableLengthCm: "many", napAware: true },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 10, availableLengthCm: null },
    })).ok).toBe(false);
    expect(deserialize(JSON.stringify({
      ...raw, nestingIntelligence: { bufferPct: 10, napAware: true },
    })).ok).toBe(false);
    expect(parseNestingIntelligence({ bufferPct: 10, availableLengthCm: NaN, napAware: true })).toBeNull();
    expect(parseNestingIntelligence({ bufferPct: Infinity, availableLengthCm: null, napAware: true })).toBeNull();
    expect(parseRawNestingIntelligence({ buffer: "10", available: "", napAware: "yes" })).toBeNull();
    const legacy = deserialize(JSON.stringify({
      v: 3, measurements: STANDARD_M, fabric: FABRIC, nestingIntelligence: { bufferPct: 60 },
    }));
    expect(legacy.ok).toBe(true);
    if (!legacy.ok) return;
    expect(legacy.nestingIntelligence).toEqual({ bufferPct: 10, availableLengthCm: null, napAware: true });
  });

  it("round-trips raw planning values through recovery and migrates absent ones", () => {
    const recovery = {
      savedAt: 9,
      measurements: Object.fromEntries(FIELDS.map((field) => [field.id, STANDARD_M[field.id]])),
      rawMeasurements: {}, fabric: FABRIC, appearance: DEFAULT_APPEARANCE,
      garmentOptions: { tee: {} }, rawOptions: { tee: {} },
      workspace: DEFAULT_WORKSPACE, materialSelectionExplicit: false, surface: {},
      rawNestingIntelligence: { buffer: "abc", available: "150", napAware: false },
    };
    const result = deserializeRecovery(serializeRecovery(recovery));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rawNestingIntelligence).toEqual({ buffer: "abc", available: "150", napAware: false });
    expect(saveRecoveryToStorage(recovery)).toBe(true);
    const without = JSON.parse(serializeRecovery({ ...recovery, savedAt: 10 }));
    delete without.rawNestingIntelligence;
    const migrated = deserializeRecovery(JSON.stringify(without));
    expect(migrated.ok).toBe(true);
    if (!migrated.ok) return;
    expect(migrated.rawNestingIntelligence).toEqual({ buffer: "10", available: "", napAware: true });
  });
});
