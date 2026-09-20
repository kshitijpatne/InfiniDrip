// EPIC 10 — bounded, seeded fast-check properties covering geometry finiteness
// and deterministic repeated drafting/grading across all seven registered
// recipes (tee, fitted, tank, polo, woven-shirt, skirt, trouser).
//
// Test/developer-only: fast-check is a dev dependency and is never imported by
// production code. Every property below uses a fixed seed and an explicit
// bounded numRuns so a failure is exactly replayable with
// `{ seed, path }` from the reported counterexample. Generators are
// domain-aware: they only draw values inside each field's/option's own
// declared bounds (the same bounds the UI and persistence layer already
// enforce), so "valid" here means "a real person could type this."
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  GARMENTS,
  STANDARD_M,
  draftAtSize,
  blockPieces,
  stitchChecks,
  type Measurements,
  type GarmentRecipe,
  type GarmentOptions,
} from "../drafting";
import type { Edge } from "../drafting/piece";
import type { PatternMark } from "../drafting/pattern-mark";
import { FIELDS } from "../ui/controls";

const FIELD_BOUNDS = new Map(FIELDS.map((f) => [f.id, f]));

/** A generator for one recipe's own valid domain: only its declared
 * measurement fields vary (bounded by the shared UI field ranges), every
 * other field stays at STANDARD_M, and any recipe-owned numeric options vary
 * within their own declared min/max. */
function validInputArbitrary(recipe: GarmentRecipe): fc.Arbitrary<{
  readonly measurements: Measurements;
  readonly options: GarmentOptions;
  readonly step: number;
}> {
  const fieldEntries = recipe.fields.map((id) => {
    const bound = FIELD_BOUNDS.get(id);
    if (!bound) throw new Error(`No declared UI bound for measurement field "${id}"`);
    return [id, fc.double({ min: bound.min, max: bound.max, noNaN: true, noDefaultInfinity: true })] as const;
  });
  const measurementsArb = fc.record(Object.fromEntries(fieldEntries)) as fc.Arbitrary<Partial<Measurements>>;

  const optionDefs = recipe.options ?? [];
  const optionEntries = optionDefs.map((d) =>
    [d.id, fc.double({ min: d.min, max: d.max, noNaN: true, noDefaultInfinity: true })] as const);
  const optionsArb = fc.record(Object.fromEntries(optionEntries)) as fc.Arbitrary<GarmentOptions>;

  const stepArb = fc.constantFrom(...recipe.sizes.map((s) => s.step));

  return fc.record({ partial: measurementsArb, options: optionsArb, step: stepArb }).map(({ partial, options, step }) => ({
    measurements: { ...STANDARD_M, ...partial },
    options,
    step,
  }));
}

function finitePoint(p: { readonly x: number; readonly y: number }): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}

function edgeFinite(e: Edge): boolean {
  if (e.kind === "line") return finitePoint(e.start) && finitePoint(e.end);
  const c = e.curve;
  return finitePoint(c.start) && finitePoint(c.control1) && finitePoint(c.control2) && finitePoint(c.end);
}

function markFinite(mark: PatternMark): boolean {
  return "at" in mark ? finitePoint(mark.at) : finitePoint(mark.start) && finitePoint(mark.end);
}

// Slice 142 — geometry finiteness for every recipe. Seed and run bound are
// fixed and reported here for replay: `fc.assert(property, { seed: 1401420, numRuns: 30 })`.
describe("EPIC 10 — geometry finiteness (Slice 142)", () => {
  for (const recipe of GARMENTS) {
    it(`${recipe.name}: every drafted coordinate stays finite across its declared domain`, () => {
      fc.assert(
        fc.property(validInputArbitrary(recipe), ({ measurements, options, step }) => {
          const block = draftAtSize(measurements, recipe.grade, step, recipe.draft, options);
          for (const piece of blockPieces(block)) {
            for (const edge of piece.edges) {
              if (!edgeFinite(edge)) return false;
            }
            for (const mark of piece.marks ?? []) {
              if (!markFinite(mark)) return false;
            }
          }
          return true;
        }),
        { seed: 1401420, numRuns: 30 },
      );
    });

    it(`${recipe.name}: repeated drafting of the same valid input is deterministic`, () => {
      fc.assert(
        fc.property(validInputArbitrary(recipe), ({ measurements, options, step }) => {
          const first = draftAtSize(measurements, recipe.grade, step, recipe.draft, options);
          const second = draftAtSize(measurements, recipe.grade, step, recipe.draft, options);
          expect(second).toEqual(first);
        }),
        { seed: 1401421, numRuns: 20 },
      );
    });

    it(`${recipe.name}: every declared stitch resolves to a real edge or mark (no dangling interface reference)`, () => {
      fc.assert(
        fc.property(validInputArbitrary(recipe), ({ measurements, options, step }) => {
          const block = draftAtSize(measurements, recipe.grade, step, recipe.draft, options);
          // stitchChecks calls rolePiece/pieceEdge internally, both of which
          // throw loudly on a missing role/edge/mark reference — so a clean
          // run IS the assertion that every declared stitch resolves.
          stitchChecks(block, block.stitches);
        }),
        { seed: 1401422, numRuns: 20 },
      );
    });
  }

  it("all seven recipe identifiers are exercised (registry drift guard)", () => {
    expect(GARMENTS.map((r) => r.name).sort()).toEqual(
      ["fitted", "polo", "skirt", "tank", "tee", "trouser", "woven-shirt"],
    );
  });

  // Permanent regression fixture: a base-size, base-step draft for every
  // recipe must never regress to non-finite geometry. This is the smallest
  // possible reproduction of the property above, kept as a literal example so
  // a future change that breaks it fails fast without needing fast-check.
  it("regression fixture: STANDARD_M at step 0 drafts finite geometry for every recipe", () => {
    for (const recipe of GARMENTS) {
      const block = draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft, {});
      for (const piece of blockPieces(block)) {
        for (const edge of piece.edges) expect(edgeFinite(edge)).toBe(true);
      }
    }
  });
});
