// EPIC 10 — bounded, seeded fast-check properties for the workspace
// persistence contract: deterministic serialization, round-trip fidelity,
// crash-proof handling of hostile/stale optional state, and a permanent,
// explicit-outcome fixture for every supported old-save version.
//
// Test/developer-only: fast-check is a dev dependency, never imported by
// production code. This file never edits `src/ui/persist.ts`; it only
// exercises its exported contract more broadly than the existing example
// tests in `persist.test.ts`, which this file complements rather than
// duplicates.
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { GARMENTS, STANDARD_M, STRETCH_FABRICS, type Measurements } from "../drafting";
import { serialize, deserialize, DEFAULT_WORKSPACE, SAVE_VERSION, type Workspace } from "../ui/persist";
import { DEFAULT_APPEARANCE, APPEARANCE_TEXTURES, type Appearance } from "../ui/appearance";
import { FIELDS } from "../ui/controls";
import { type ArtworkPlacement } from "../surface/placement";
import { surfaceKey, type SurfaceBook } from "../surface/store";

// Mirrors persist.ts's private VIEWS list; ViewName's own union type keeps this
// from silently drifting out of sync with a removed view.
const VIEWS: readonly Workspace["view"][] = ["pattern", "body", "nest", "spec", "fabric", "check", "edit"];

// Builds on top of `{ ...STANDARD_M }`, exactly as `deserialize` itself does,
// so the resulting object's key insertion order always matches production's —
// JSON.stringify is key-order-sensitive, and this is not a claim under test.
const measurementsArb: fc.Arbitrary<Measurements> = fc
  .record(
    Object.fromEntries(FIELDS.map((f) => [f.id, fc.double({ min: f.min, max: f.max, noNaN: true, noDefaultInfinity: true })])),
  )
  .map((partial) => ({ ...STANDARD_M, ...(partial as Partial<Measurements>) }));

const fabricArb: fc.Arbitrary<string> = fc
  .tuple(fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }), fc.integer({ min: 0, max: 255 }))
  .map(([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`);

const appearanceArb: fc.Arbitrary<Appearance> = fc.record({
  texture: fc.constantFrom(...APPEARANCE_TEXTURES.map((t) => t.id)),
  shine: fc.double({ min: 0, max: 100, noNaN: true, noDefaultInfinity: true }),
});
const workspaceArb: fc.Arbitrary<Workspace> = fc.constantFrom(...GARMENTS).chain((recipe) =>
  fc.record({
    garment: fc.constant(recipe.name),
    targetStyle: fc.constantFrom(...recipe.styles.map((s) => s.name)),
    stretchFabric: fc.constantFrom(...STRETCH_FABRICS.map((f) => f.name)),
    view: fc.constantFrom(...VIEWS),
    bodyCroquisView: fc.constantFrom("front-back", "front", "back", "side") as fc.Arbitrary<Workspace["bodyCroquisView"]>,
    exportStep: fc.constantFrom(...recipe.sizes.map((s) => s.step)),
    fabricWidth: fc.double({ min: 1, max: 300, noNaN: true, noDefaultInfinity: true }),
    nestScope: fc.constantFrom("single", "marker") as fc.Arbitrary<Workspace["nestScope"]>,
  }),
);

const garmentOptionsArb = fc.constantFrom(...GARMENTS).chain((recipe) => {
  const defs = recipe.options ?? [];
  if (defs.length === 0) return fc.constant({});
  return fc
    .record(Object.fromEntries(defs.map((d) => [d.id, fc.double({ min: d.min, max: d.max, noNaN: true, noDefaultInfinity: true })])))
    .map((values) => ({ [recipe.name]: values }));
});

const placementArb: fc.Arbitrary<ArtworkPlacement> = fc.record({
  id: fc.stringMatching(/^[a-z][a-z0-9-]{0,12}$/),
  kind: fc.constantFrom("print", "patch", "color-block") as fc.Arbitrary<ArtworkPlacement["kind"]>,
  pieceRole: fc.constantFrom("front", "back", "sleeve"),
  widthCm: fc.double({ min: 0.1, max: 60, noNaN: true, noDefaultInfinity: true }),
  heightCm: fc.double({ min: 0.1, max: 60, noNaN: true, noDefaultInfinity: true }),
  transform: fc.record({
    dx: fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
    dy: fc.double({ min: -50, max: 50, noNaN: true, noDefaultInfinity: true }),
    scale: fc.double({ min: 0.1, max: 3, noNaN: true, noDefaultInfinity: true }),
    rotationDeg: fc.double({ min: -720, max: 720, noNaN: true, noDefaultInfinity: true }),
  }),
  zOrder: fc.integer({ min: 0, max: 10 }),
  sourceName: fc.constantFrom("art.svg", "logo.png", ""),
});

// Slice 141 — deterministic serialization and round-trip fidelity.
describe("EPIC 10 — persistence properties (Slice 141)", () => {
  it("serialize is byte-stable for equal state, and deserialize(serialize(x)) round-trips x", () => {
    fc.assert(
      fc.property(
        measurementsArb,
        fabricArb,
        garmentOptionsArb,
        workspaceArb,
        appearanceArb,
        fc.array(placementArb, { maxLength: 3 }),
        (measurements, fabric, garmentOptions, workspace, appearance, placements) => {
          const surface: SurfaceBook = placements.length === 0 ? {} : {
            [surfaceKey(workspace.garment, workspace.targetStyle)]: { styleName: workspace.targetStyle, placements },
          };
          const first = serialize(measurements, fabric, garmentOptions, workspace, appearance, surface);
          const second = serialize(measurements, fabric, garmentOptions, workspace, appearance, surface);
          expect(second).toBe(first); // byte-stable for equal input

          const loaded = deserialize(first);
          expect(loaded.ok).toBe(true);
          if (!loaded.ok) return;
          expect(loaded.measurements).toEqual(measurements);
          expect(loaded.fabric).toBe(fabric);
          expect(loaded.workspace).toEqual(workspace);
          expect(loaded.appearance).toEqual(appearance);

          // Re-serializing the round-tripped state must reproduce the same bytes.
          const replayed = serialize(loaded.measurements, loaded.fabric, loaded.garmentOptions, loaded.workspace, loaded.appearance, loaded.surface);
          expect(replayed).toBe(first);
        },
      ),
      { seed: 1411410, numRuns: 40 },
    );
  });

  it("deserialize never throws on hostile or stale extra/renamed/mistyped fields", () => {
    const validJson = () => JSON.parse(serialize(STANDARD_M, "#334455"));
    const hostileArb = fc.record({
      base: fc.constant(undefined),
      extraKey: fc.constantFrom("__proto__", "constructor", "toString", "unexpectedField", "v2"),
      extraValue: fc.oneof(fc.string(), fc.double({ noNaN: false }), fc.boolean(), fc.constant(null), fc.array(fc.string(), { maxLength: 3 })),
      mistypeKey: fc.constantFrom("fabric", "workspace", "measurements", "garmentOptions", "appearance", "surface", "v"),
      mistypeValue: fc.oneof(fc.string(), fc.double({ noNaN: false }), fc.boolean(), fc.constant(null), fc.constant(undefined), fc.array(fc.string(), { maxLength: 2 })),
    });
    fc.assert(
      fc.property(hostileArb, ({ extraKey, extraValue, mistypeKey, mistypeValue }) => {
        const raw = validJson();
        (raw as Record<string, unknown>)[extraKey] = extraValue;
        if (mistypeValue === undefined) delete (raw as Record<string, unknown>)[mistypeKey];
        else (raw as Record<string, unknown>)[mistypeKey] = mistypeValue;
        let result: ReturnType<typeof deserialize>;
        expect(() => { result = deserialize(JSON.stringify(raw)); }).not.toThrow();
        // A well-formed reporting contract either way: ok:true with the full
        // shape, or ok:false with a human-readable error — never a crash and
        // never a half-populated object.
        expect(typeof result!.ok).toBe("boolean");
        if (!result!.ok) expect(typeof result!.error).toBe("string");
      }),
      { seed: 1411411, numRuns: 60 },
    );
  });

  it("deserialize never throws on arbitrary hostile top-level JSON shapes", () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        expect(() => deserialize(JSON.stringify(value))).not.toThrow();
      }),
      { seed: 1411412, numRuns: 80 },
    );
  });

  // Permanent fixtures — one explicit expected outcome per supported legacy
  // save version. v1/v2/v3 predate the workspace/garmentOptions/appearance/
  // surface sections entirely; v4 predates only the Slice-95 lower-body
  // fields (crotchDepth/thigh/knee/inseam) that v5 introduced.
  describe("old-save compatibility fixtures (permanent)", () => {
    const legacyMeasurements = (): Record<string, number> => {
      const { crotchDepth: _c, thigh: _t, knee: _k, inseam: _i, ...rest } = STANDARD_M;
      return rest;
    };

    it("v1: loads with default workspace/appearance/empty surface", () => {
      const result = deserialize(JSON.stringify({ v: 1, measurements: legacyMeasurements() }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.workspace).toEqual(DEFAULT_WORKSPACE);
      expect(result.appearance).toEqual(DEFAULT_APPEARANCE);
      expect(result.surface).toEqual({});
      expect(result.garmentOptions).toEqual({});
    });

    it("v1: migrates a legacy strapWidth-as-strap-point value into a finished strap span", () => {
      const legacy = { ...legacyMeasurements(), strapWidth: 12 };
      const result = deserialize(JSON.stringify({ v: 1, measurements: legacy }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.measurements.strapWidth).toBeCloseTo(12 - (STANDARD_M.chest / 20 + 2), 6);
    });

    it("v2: loads with default workspace, no v1 strap migration applied", () => {
      const legacy = { ...legacyMeasurements(), strapWidth: 12 };
      const result = deserialize(JSON.stringify({ v: 2, measurements: legacy }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.measurements.strapWidth).toBe(12); // v2+: no migration
    });

    it("v3: loads with default workspace and drops an unrecognised legacy field silently ignored by FIELDS", () => {
      const legacy = { ...legacyMeasurements(), ghostField: 999 };
      const result = deserialize(JSON.stringify({ v: 3, measurements: legacy }));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.measurements).not.toHaveProperty("ghostField");
    });

    it("v4: loads and defaults the v5 lower-body fields from STANDARD_M", () => {
      const legacy = legacyMeasurements();
      const result = deserialize(JSON.stringify({ v: 4, measurements: legacy, fabric: "#112233" }));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.measurements.crotchDepth).toBe(STANDARD_M.crotchDepth);
      expect(result.measurements.thigh).toBe(STANDARD_M.thigh);
      expect(result.measurements.knee).toBe(STANDARD_M.knee);
      expect(result.measurements.inseam).toBe(STANDARD_M.inseam);
      expect(result.fabric).toBe("#112233");
      expect(result.workspace).toEqual(DEFAULT_WORKSPACE);
    });

    it("v4: an out-of-range legacy-required field still rejects the whole save (no silent clamp)", () => {
      const legacy = { ...legacyMeasurements(), chest: 99999 };
      const result = deserialize(JSON.stringify({ v: 4, measurements: legacy }));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/chest/i);
    });

    it("v5 (current): rejects a truncated legacy-shaped payload missing the required workspace section", () => {
      const result = deserialize(JSON.stringify({ v: SAVE_VERSION, measurements: legacyMeasurements() }));
      expect(result.ok).toBe(false);
    });
  });
});
