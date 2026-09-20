// EPIC 10 — bounded, seeded fast-check properties for invalid-input guidance.
// The standing product invariant (AGENTS.md, docs/PROJECT-DECISIONS.md) is:
// invalid or implausible input stays visible and raw, and guidance explains
// the problem with an actionable correction — it never silently clamps or
// rewrites a user's value. These properties fail loudly if a future change
// starts clamping, or starts emitting a guidance note that does not name the
// actual offending field/value.
//
// Test/developer-only: fast-check is a dev dependency, never imported by
// production code.
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { GARMENTS, STANDARD_M, type Measurements } from "../drafting";
import { FIELDS, applyChange, inputError, type Field } from "../ui/controls";
import { guide } from "../guidance/guidance";
import { implausibleFields, plausibilityChecks, MEASUREMENT_BOUNDS } from "../guidance/plausibility";

const FIELD_BY_ID = new Map(FIELDS.map((f) => [f.id, f]));

const belowMinArb = (f: Field) => fc.double({ min: f.min - 1000, max: Math.fround(f.min) - Number.EPSILON, noNaN: true, noDefaultInfinity: true }).filter((v) => v < f.min);
const aboveMaxArb = (f: Field) => fc.double({ min: f.max + Number.EPSILON, max: f.max + 1000, noNaN: true, noDefaultInfinity: true }).filter((v) => v > f.max);
const outOfRangeArb = (f: Field) => fc.oneof(belowMinArb(f), aboveMaxArb(f));

describe("EPIC 10 — invalid-input guidance properties (Slice 141)", () => {
  it("applyChange never clamps: the stored value is always exactly the typed number (or NaN for unparsable text)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...FIELDS),
        fc.oneof(
          fc.double({ noNaN: false }).map(String),
          fc.constant(""),
          fc.constant("   "),
          fc.constant("not-a-number"),
          fc.constant("-Infinity"),
        ),
        (field, raw) => {
          const result = applyChange(STANDARD_M, field, raw);
          const expected = raw.trim() === "" ? NaN : Number(raw);
          if (Number.isNaN(expected)) expect(Number.isNaN(result[field.id])).toBe(true);
          else expect(result[field.id]).toBe(expected); // verbatim — never rounded to a bound
        },
      ),
      { seed: 1411510, numRuns: 60 },
    );
  });

  it("every out-of-range field produces an actionable inputError naming the field and its declared bounds", () => {
    fc.assert(
      fc.property(fc.constantFrom(...FIELDS).chain((f) => fc.tuple(fc.constant(f), outOfRangeArb(f))), ([field, value]) => {
        const error = inputError(value, field);
        expect(error).not.toBeNull();
        expect(error).toContain(field.label);
        expect(error).toContain(String(field.min));
        expect(error).toContain(String(field.max));
      }),
      { seed: 1411511, numRuns: 60 },
    );
  });

  it("a non-finite measurement is always flagged, never treated as silently valid", () => {
    fc.assert(
      fc.property(fc.constantFrom(...FIELDS), fc.constantFrom(NaN, Infinity, -Infinity), (field, value) => {
        expect(inputError(value, field)).not.toBeNull();
      }),
      { seed: 1411512, numRuns: 30 },
    );
  });

  it("recipe guidance flags a plausibility-bound field with a warn note naming that exact field and value", () => {
    // Fields that appear in BOTH a plausible-bound table AND at least one
    // recipe's exposed fields — pushing one out of its plausible (not UI)
    // bound must produce a truthful, field-linked warn note.
    const boundedFieldIds = (Object.keys(MEASUREMENT_BOUNDS) as (keyof Measurements)[]);
    const candidates = GARMENTS.flatMap((recipe) =>
      recipe.fields.filter((id) => boundedFieldIds.includes(id)).map((id) => ({ recipe, id })));
    fc.assert(
      fc.property(fc.constantFrom(...candidates), ({ recipe, id }) => {
        const bound = MEASUREMENT_BOUNDS[id]!;
        // Push just past the plausible bound, but stay inside the UI's own
        // (wider or equal) declared range so drafting itself stays well-formed.
        const uiField = FIELD_BY_ID.get(id)!;
        const over = Math.min(bound.max + 1, uiField.max);
        const measurements: Measurements = { ...STANDARD_M, [id]: over };
        if (measurements[id] <= bound.max) return; // UI bound too tight to exceed the plausible one; skip
        const notes = plausibilityChecks(measurements, recipe.fields);
        const match = notes.find((n) => n.field === id);
        expect(match).toBeDefined();
        expect(match!.level).toBe("warn");
        expect(match!.text).toContain(String(measurements[id])); // truthful: names the actual value
      }),
      { seed: 1411513, numRuns: 40 },
    );
  });

  it("implausibleFields is scoped to the garment's own exposed fields (a frozen default is never flagged)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GARMENTS), (recipe) => {
        // Push every bounded field, including ones this garment does NOT
        // expose, far out of range on a shared measurements object.
        const wild = { ...STANDARD_M } as { -readonly [K in keyof Measurements]: number };
        for (const key of Object.keys(MEASUREMENT_BOUNDS) as (keyof Measurements)[]) {
          wild[key] = 100000;
        }
        const flagged = implausibleFields(wild, recipe.fields);
        for (const key of flagged) expect(recipe.fields).toContain(key);
      }),
      { seed: 1411514, numRuns: 15 },
    );
  });

  it("guide() never throws for any single field pushed out of its UI range, and still reports notes", () => {
    fc.assert(
      fc.property(fc.constantFrom(...GARMENTS).chain((recipe) =>
        fc.constantFrom(...recipe.fields).chain((id) =>
          fc.record({ recipe: fc.constant(recipe), id: fc.constant(id), value: outOfRangeArb(FIELD_BY_ID.get(id)!) }))),
        ({ recipe, id, value }) => {
          const measurements: Measurements = { ...STANDARD_M, [id]: value };
          expect(() => guide(recipe, measurements, {})).not.toThrow();
        },
      ),
      { seed: 1411515, numRuns: 40 },
    );
  });

  // Permanent regression fixture: a concrete, previously-real product
  // decision (docs/PROJECT-DECISIONS.md — "Adjustability and guidance") is
  // that an out-of-range ease must remain visible and produce a named,
  // actionable correction rather than silently clamping to the nearest
  // acceptable value.
  it("regression fixture: an absurd ease value (9999) is rejected verbatim, never clamped to the band", () => {
    const field = FIELD_BY_ID.get("ease")!;
    const applied = applyChange(STANDARD_M, field, "9999");
    expect(applied.ease).toBe(9999);
    expect(inputError(applied.ease, field)).toBe(`${field.label}: enter ${field.min}–${field.max}.`);
  });
});
