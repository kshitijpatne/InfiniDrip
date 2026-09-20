// EPIC 10 — empty-placement export identity across all seven recipes
// (Slice 144 acceptance: "Empty-placement export identity, including all
// eight legacy hashes, with no baseline movement").
//
// The eight legacy SHA-256 hashes themselves stay exactly as recorded in
// `src/export/regression.test.ts`, which this branch does not touch — running
// that file (part of the full gate) is the actual eight-hash proof. What this
// file adds is new, bounded coverage: `techpack-surface.test.ts` already
// proves byte-identity with empty artwork for ONE recipe (TEE) at ONE
// measurement set (STANDARD_M). This generalizes that same claim, with a
// seeded property, to all seven recipes and many valid measurement sets —
// directly exercising every recipe identifier, as Slice 144 asks.
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { GARMENTS, STANDARD_M, type Measurements } from "../drafting";
import { exportTechPack } from "../export/techpack";
import { FIELDS } from "../ui/controls";

describe("EPIC 10 — empty-placement export identity (Slice 144)", () => {
  for (const recipe of GARMENTS) {
    it(`${recipe.name}: an empty artwork set produces a byte-identical tech pack to no artwork argument at all, across valid measurements`, () => {
      const bound = new Map(FIELDS.map((f) => [f.id, f]));
      const arb = fc
        .record(Object.fromEntries(recipe.fields.map((id) => {
          const b = bound.get(id)!;
          return [id, fc.double({ min: b.min, max: b.max, noNaN: true, noDefaultInfinity: true })];
        })))
        .map((partial) => ({ ...STANDARD_M, ...(partial as Partial<Measurements>) }));

      fc.assert(
        fc.property(arb, (measurements) => {
          const withoutArg = exportTechPack(recipe, measurements);
          const withEmptyArray = exportTechPack(recipe, measurements, undefined, undefined, {}, [], "");
          expect(withEmptyArray).toBe(withoutArg);
        }),
        { seed: 1441710, numRuns: 15 },
      );
    });
  }

  it("all seven recipe identifiers are exercised (registry drift guard)", () => {
    expect(GARMENTS.map((r) => r.name).sort()).toEqual(
      ["fitted", "polo", "skirt", "tank", "tee", "trouser", "woven-shirt"],
    );
  });

  // Permanent regression fixture: the exact byte-identity claim at the app's
  // own default state, kept as a plain literal example independent of
  // fast-check so a future change that breaks it fails immediately and
  // legibly without needing to read a property/seed.
  it("regression fixture: STANDARD_M tech pack is byte-identical with/without an explicit empty artwork array, for every recipe", () => {
    for (const recipe of GARMENTS) {
      expect(exportTechPack(recipe, STANDARD_M, undefined, undefined, {}, [], "")).toBe(
        exportTechPack(recipe, STANDARD_M),
      );
    }
  });
});
