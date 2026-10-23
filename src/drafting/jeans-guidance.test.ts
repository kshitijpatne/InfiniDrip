import { describe, expect, it } from "vitest";
import { rolePiece } from "./block";
import { JEANS_OPTION_DEFINITIONS, resolveJeansOptions, type JeansOptions } from "./jeans-contract";
import { draftJeansWithGuidance, inspectJeansStitches, jeansDraftFailure, jeansSizeRunWithGuidance, reviewJeansDraft } from "./jeans-guidance";
import { draftJeansCore } from "./jeans";
import { STANDARD_M, type Measurements } from "./measurements";
import { JEANS_SIZES } from "./jeans-tables";

const withMeasurements = (patch: Partial<Measurements>): Measurements => ({ ...STANDARD_M, ...patch });
const withOptions = (patch: Partial<JeansOptions>): Partial<JeansOptions> => patch;

describe("Jeans guidance and size-run gates", () => {
  it("accepts the default draft only after all live stitch checks pass", () => {
    const result = draftJeansWithGuidance(STANDARD_M);
    expect(result.ready).toBe(true);
    expect(result.block).not.toBeNull();
    expect(result.notes).toEqual([]);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks.every(({ ok }) => ok)).toBe(true);
  });

  it.each(JEANS_OPTION_DEFINITIONS.flatMap((definition) => [
    { definition, raw: definition.min - 1 },
    { definition, raw: definition.max + 1 },
  ]))("keeps an out-of-range $definition.id value visible and blocks the draft", ({ definition, raw }) => {
    const supplied = { [definition.id]: raw } as Partial<JeansOptions>;
    const result = draftJeansWithGuidance(STANDARD_M, supplied);
    expect(result.ready).toBe(false);
    expect(result.block).toBeNull();
    expect(result.notes).toContainEqual(expect.objectContaining({
      field: `option-${definition.id}`,
      level: "warn",
    }));
    expect(resolveJeansOptions(supplied)[definition.id as keyof JeansOptions]).toBe(raw);
  });

  it.each(JEANS_OPTION_DEFINITIONS.flatMap((definition) => [
    { definition, boundary: "minimum", raw: definition.min },
    { definition, boundary: "maximum", raw: definition.max },
  ]))("keeps the declared $definition.id $boundary available for relationship review", ({ definition, raw }) => {
    const supplied = { [definition.id]: raw } as Partial<JeansOptions>;
    const result = draftJeansWithGuidance(STANDARD_M, supplied);
    expect(resolveJeansOptions(supplied)[definition.id as keyof JeansOptions]).toBe(raw);
    expect(result.notes.some((note) => note.field === `option-${definition.id}`
      && note.text.includes("outside the supported"))).toBe(false);
    if (!result.ready) expect(result.notes.length).toBeGreaterThan(0);
  });

  it.each([
    ["NaN", Number.NaN],
    ["Infinity", Number.POSITIVE_INFINITY],
    ["a non-number", "invalid"],
  ] as const)("rejects %s without replacing the raw control value", (_label, raw) => {
    const supplied = { frontPocketOpening: raw } as unknown as Partial<JeansOptions>;
    const result = draftJeansWithGuidance(STANDARD_M, supplied);
    expect(result.ready).toBe(false);
    expect(result.block).toBeNull();
    expect(result.notes).toContainEqual(expect.objectContaining({ field: "option-frontPocketOpening" }));
    const resolved = resolveJeansOptions(supplied).frontPocketOpening;
    if (Number.isNaN(raw)) expect(Number.isNaN(resolved)).toBe(true);
    else expect(resolved).toBe(raw);
  });

  it.each([
    ["waist and hip order", withMeasurements({ waist: 104, hip: 100 }), {}, "waist"],
    ["hip and crotch stations", withMeasurements({ hipDepth: 28, crotchDepth: 27 }), {}, "hipDepth"],
    ["front and back rise", STANDARD_M, withOptions({ frontRiseEase: 8, backRiseEase: 2 }), "option-backRiseEase"],
    ["waistband and rise", withMeasurements({ hipDepth: 8, crotchDepth: 12 }), withOptions({ waistbandDepth: 8, frontRiseEase: -2 }), "option-waistbandDepth"],
    ["fly and front rise", STANDARD_M, withOptions({ flyLength: 25, frontRiseEase: -2 }), "option-flyLength"],
    ["pocket drop and hip", withMeasurements({ hipDepth: 10 }), withOptions({ frontPocketDrop: 12 }), "option-frontPocketDrop"],
    ["yoke and hip station", withMeasurements({ hipDepth: 7 }), withOptions({ yokeDepth: 15 }), "option-yokeDepth"],
    ["nonpositive finished waist", withMeasurements({ ease: -100 }), {}, "ease"],
  ] as const)("flags the invalid %s relationship", (_name, measurements, options, field) => {
    const result = draftJeansWithGuidance(measurements, options);
    expect(result.ready).toBe(false);
    expect(result.block).toBeNull();
    expect(result.notes.some((note) => note.field === field)).toBe(true);
  });

  it("reports non-finite and nonpositive body fields, while allowing finite negative design ease", () => {
    const nonFinite = draftJeansWithGuidance(withMeasurements({ waist: Number.NaN }));
    expect(nonFinite.notes.some(({ field, text }) => field === "waist" && text.includes("finite"))).toBe(true);
    const nonpositive = draftJeansWithGuidance(withMeasurements({ thigh: 0 }));
    expect(nonpositive.notes.some(({ field, text }) => field === "thigh" && text.includes("positive"))).toBe(true);
    const invalidThigh = draftJeansWithGuidance(withMeasurements({ thigh: -100 }));
    expect(invalidThigh.notes.some(({ field, text }) => field === "thigh" && text.includes("Finished thigh and knee"))).toBe(true);
    const invalidKnee = draftJeansWithGuidance(withMeasurements({ knee: -100 }));
    expect(invalidKnee.notes.some(({ field, text }) => field === "thigh" && text.includes("Finished thigh and knee"))).toBe(true);
    const negativeEase = draftJeansWithGuidance(withMeasurements({ ease: -2 }));
    expect(negativeEase.ready).toBe(true);
    expect(negativeEase.notes.some(({ field }) => field === "ease")).toBe(false);
  });

  it("maps a component geometry failure to an actionable field and preserves its cause", () => {
    const result = draftJeansWithGuidance(withMeasurements({ inseam: 30 }), {
      yokeDepth: 15,
      backPocketHeight: 22,
      backPocketDrop: 15,
    });
    expect(result.ready).toBe(false);
    expect(result.block).toBeNull();
    expect(result.notes.length).toBeGreaterThan(0);
    expect(result.notes[0]!.field).toMatch(/^option-/);
    expect(result.notes[0]!.text).toContain("no input value was substituted");
  });

  it.each([
    ["a named option", "backPocketWidth exceeds the panel", "option-backPocketWidth"],
    ["a back pocket center-back collision", "Back pocket envelope reaches the center-back seam.", "option-backPocketOffset"],
    ["a back pocket side collision", "Back pocket envelope reaches the side seam.", "option-backPocketOffset"],
    ["a back pocket leg collision", "Back pocket envelope reaches the lower-leg station.", "option-backPocketHeight"],
    ["an unspecified back pocket issue", "Back pocket could not be placed.", "option-backPocketDrop"],
    ["a pocket bag issue", "Pocket bag cannot fit.", "option-frontPocketBagDepth"],
    ["a pocket opening issue", "Pocket opening does not resolve.", "option-frontPocketOpening"],
    ["a front pocket issue", "Front pocket placement is invalid.", "option-frontPocketOpening"],
    ["a fly issue", "Fly crosses the seam.", "option-flyLength"],
    ["a belt loop issue", "Belt loop is outside the waistband.", "option-beltLoopWidth"],
    ["a waistband issue", "Waistband geometry is invalid.", "option-waistbandDepth"],
    ["an unrelated failure", "Draft geometry is invalid.", "measurements"],
  ] as const)("maps %s to a correction field", (_label, message, field) => {
    expect(jeansDraftFailure(new RangeError(message)).field).toBe(field);
  });

  it("provides a safe actionable fallback for empty and non-Error failures", () => {
    expect(jeansDraftFailure(new Error(""), "XS")).toMatchObject({
      field: "measurements",
      level: "warn",
      text: expect.stringContaining("XS: The digital Jeans draft could not be resolved."),
    });
    expect(jeansDraftFailure("unavailable")).toMatchObject({
      field: "measurements",
      level: "warn",
      text: expect.stringContaining("The digital Jeans draft could not be resolved."),
    });
    const centerBack = jeansDraftFailure(new RangeError(
      "Back pocket and its 1.9 cm allowance envelope reach the center-back seam; increase backPocketOffset or reduce backPocketWidth.",
    ));
    expect(centerBack.text).toContain("reduce backPocketOffset or reduce backPocketWidth");
    expect(centerBack.text).not.toContain("increase backPocketOffset");
  });

  it("reports a failed live join rather than returning a ready draft", () => {
    const draft = draftJeansCore(STANDARD_M);
    const front = rolePiece(draft, "frontLeft");
    const waist = front.edges.find(({ name }) => name === "waist")!;
    const invalidFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "waist" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 4 } }
        : edge),
    };
    const invalid = { ...draft, roles: { ...draft.roles, frontLeft: invalidFront } };
    const result = inspectJeansStitches(invalid);
    const gated = reviewJeansDraft(invalid);
    expect(waist.name).toBe("waist");
    expect(result.checks.some(({ ok }) => !ok)).toBe(true);
    expect(result.notes.some(({ field }) => field === "jeans-construction")).toBe(true);
    expect(gated.ready).toBe(false);
    expect(gated.block).toBeNull();
  });

  it("redrafts XS through XL and emits live POMs only for a complete valid run", () => {
    const result = jeansSizeRunWithGuidance(STANDARD_M);
    expect(result.ready).toBe(true);
    expect(result.graded.map(({ label }) => label)).toEqual(JEANS_SIZES.map(({ label }) => label));
    expect(result.poms.length).toBeGreaterThan(0);
    expect(result.poms.every(({ values }) => values.length === JEANS_SIZES.length && values.every(Number.isFinite))).toBe(true);
    expect(result.notes).toEqual([]);
  });

  it("rejects an invalid base and a size run that cannot produce every size", () => {
    const invalidOption = jeansSizeRunWithGuidance(STANDARD_M, { coinPocketWidth: 11 });
    expect(invalidOption.ready).toBe(false);
    expect(invalidOption.graded).toEqual([]);
    expect(invalidOption.poms).toEqual([]);
    expect(invalidOption.notes[0]!.field).toBe("option-coinPocketWidth");

    const narrowBase = jeansSizeRunWithGuidance(withMeasurements({
      waist: 38, hip: 50, hipDepth: 10, crotchDepth: 14, thigh: 24, knee: 20, inseam: 45,
    }));
    expect(narrowBase.ready).toBe(false);
    expect(narrowBase.graded).toEqual([]);
    expect(narrowBase.poms).toEqual([]);
    expect(narrowBase.notes.length).toBeGreaterThan(0);

    const relationshipRun = jeansSizeRunWithGuidance(STANDARD_M, { frontRiseEase: 2, backRiseEase: 2 });
    expect(relationshipRun.ready).toBe(false);
    expect(relationshipRun.graded).toEqual([]);
    expect(relationshipRun.poms).toEqual([]);
    expect(relationshipRun.notes.some(({ field }) => field === "option-backRiseEase")).toBe(true);
  });
});
