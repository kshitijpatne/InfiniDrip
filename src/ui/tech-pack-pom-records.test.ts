import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import {
  TECH_PACK_POM_MAX_CONFLICT_SOURCES,
  TECH_PACK_POM_MAX_DEFINITIONS,
  TECH_PACK_POM_MAX_LANDMARKS,
  TECH_PACK_POM_MAX_SIZE_IDS,
  TECH_PACK_POM_METHOD_KINDS,
  TECH_PACK_POM_RECIPE_IDS,
  parseTechPackPomDefinitionSet,
} from "./tech-pack-pom-records";

const source = (overrides: Record<string, unknown> = {}) => ({
  uri: "docs/research/pom-methods.md",
  title: "POM source contract",
  locator: "Measurement methods / chest",
  ...overrides,
});

const sourced = (value: unknown, overrides: Record<string, unknown> = {}) => ({
  status: "SOURCE_CONFIRMED",
  value,
  source: source(),
  ...overrides,
});

const unresolved = (overrides: Record<string, unknown> = {}) => ({
  status: "UNRESOLVED",
  value: null,
  unresolvedReason: "No reviewed source establishes this fact.",
  nextAction: "Attach a permitted source and confirm the method.",
  ...overrides,
});

const conflicting = (overrides: Record<string, unknown> = {}) => ({
  status: "CONFLICT",
  value: null,
  sourceRefs: [source(), source({ uri: "docs/research/alternate.md", locator: "Table 4" })],
  unresolvedReason: "The sources describe incompatible methods.",
  nextAction: "Review both sources and record the accepted method.",
  ...overrides,
});

const definition = (overrides: Record<string, unknown> = {}) => ({
  id: "finished.chest-width",
  label: "Finished chest width",
  method: sourced({ kind: "STRAIGHT_LINE", instructions: "Measure flat between the named side landmarks." }),
  landmarks: sourced([
    { id: "front.side.chest", label: "Front side seam at chest level" },
    { id: "back.side.chest", label: "Back side seam at chest level" },
  ]),
  unit: "cm",
  tolerance: sourced({ lowerDelta: -1, upperDelta: 1.5 }),
  sizeRangeSource: sourced({ rangeLabel: "S–XL", sizeIds: ["S", "M", "L", "XL"], baseSizeId: "M" }),
  gradeRuleSource: sourced({ ruleId: "bodice.grade", version: "1" }),
  ...overrides,
});

const definitionSet = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  recipeId: "tee",
  definitions: [definition()],
  ...overrides,
});

function setDefinitionField(field: string, value: unknown): Record<string, unknown> {
  const candidate: Record<string, unknown> = definition();
  candidate[field] = value;
  return candidate;
}

describe("tech-pack POM definition records", () => {
  it("matches the current supported recipe IDs and parses an asymmetric sourced definition", () => {
    expect([...TECH_PACK_POM_RECIPE_IDS]).toEqual(GARMENTS.map((recipe) => recipe.name));
    expect(TECH_PACK_POM_METHOD_KINDS).toContain("OTHER");
    const result = parseTechPackPomDefinitionSet(definitionSet());
    expect(result).toEqual({ ok: true, value: definitionSet() });
    if (result.ok) {
      expect(result.value.definitions[0]!.tolerance).toEqual(sourced({ lowerDelta: -1, upperDelta: 1.5 }));
      expect(result.value.definitions[0]!.unit).toBe("cm");
    }
  });

  it.each(TECH_PACK_POM_RECIPE_IDS)("accepts recipe-scoped definitions for %s", (recipeId) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ recipeId })).ok).toBe(true);
  });

  it("parses explicit unresolved and conflicting source states without choosing a value", () => {
    const input = definition({
      method: unresolved(),
      landmarks: unresolved(),
      tolerance: unresolved(),
      sizeRangeSource: conflicting(),
      gradeRuleSource: unresolved(),
    });
    const result = parseTechPackPomDefinitionSet(definitionSet({ definitions: [input] }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = result.value.definitions[0]!;
      expect(parsed.method).toMatchObject({ status: "UNRESOLVED", value: null });
      expect(parsed.tolerance).toMatchObject({ status: "UNRESOLVED", value: null });
      expect(parsed.sizeRangeSource).toMatchObject({ status: "CONFLICT", value: null, sourceRefs: expect.any(Array) });
    }
  });

  it("allows an empty draft definition set and returns detached nested data", () => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [] }))).toEqual({
      ok: true,
      value: { schemaVersion: 1, recipeId: "tee", definitions: [] },
    });
    const input = definitionSet();
    const parsed = parseTechPackPomDefinitionSet(input);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value).not.toBe(input);
      expect(parsed.value.definitions).not.toBe(input.definitions);
      expect(parsed.value.definitions[0]!.landmarks).not.toBe(input.definitions[0]!.landmarks);
      (input.definitions[0]!.landmarks as { status: string; value: Array<{ id: string; label: string }> }).value[0]!.label = "Changed after parse";
      expect(parsed.value.definitions[0]!.landmarks).toEqual(definition().landmarks);
    }
  });

  it("accepts portable HTTPS source references", () => {
    const withWebSource = sourced(
      { kind: "OTHER", instructions: "Measure as stated in the cited source." },
      { source: source({ uri: "https://example.test/pom-guide.pdf" }) },
    );
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ method: withWebSource })] })).ok).toBe(true);
  });

  it.each([
    { value: null },
    { value: [] },
    { value: { schemaVersion: 1, recipeId: "tee" } },
    { value: { ...definitionSet(), unexpected: true } },
    { value: { ...definitionSet(), schemaVersion: 2 } },
    { value: { ...definitionSet(), recipeId: "unknown-recipe" } },
    { value: { ...definitionSet(), recipeId: 1 } },
    { value: { ...definitionSet(), definitions: null } },
    { value: { ...definitionSet(), definitions: Array.from({ length: TECH_PACK_POM_MAX_DEFINITIONS + 1 }, () => definition()) } },
  ])("rejects malformed definition-set roots (%#)", ({ value }) => {
    expect(parseTechPackPomDefinitionSet(value).ok).toBe(false);
  });

  it.each([
    null,
    { ...definition(), extra: true },
    setDefinitionField("id", "Uppercase-ID"),
    setDefinitionField("id", ""),
    setDefinitionField("label", "  "),
    setDefinitionField("label", "x".repeat(161)),
    setDefinitionField("unit", "inches"),
    setDefinitionField("unit", null),
    setDefinitionField("unit", ""),
  ])("rejects malformed POM definition fields (%#)", (value) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [value] })).ok).toBe(false);
  });

  it.each([
    null,
    { ...sourced({ kind: "STRAIGHT_LINE", instructions: "measure" }), extra: true },
    sourced({ kind: "UNKNOWN", instructions: "measure" }),
    sourced({ kind: "STRAIGHT_LINE", instructions: " " }),
    sourced({ kind: "STRAIGHT_LINE", instructions: "x".repeat(513) }),
    sourced(null),
    sourced({ kind: "STRAIGHT_LINE", other: "missing required key" }),
  ])("rejects unsupported or incomplete sourced methods (%#)", (method) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ method })] })).ok).toBe(false);
  });

  it.each([
    null,
    { ...source(), extra: true },
    source({ uri: "C:/private/source.pdf" }),
    source({ uri: "/private/source.pdf" }),
    source({ uri: "docs\\source.pdf" }),
    source({ uri: "docs/../private.pdf" }),
    source({ uri: "file:///private/source.pdf" }),
    source({ uri: "ftp://example.test/source.pdf" }),
    source({ uri: "mailto:pattern@example.test" }),
    source({ uri: "https://" }),
    source({ title: "" }),
    source({ title: "x".repeat(241) }),
    source({ locator: " " }),
  ])("rejects invalid source references (%#)", (invalidSource) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ method: sourced({ kind: "OTHER", instructions: "measure" }, { source: invalidSource }) })] })).ok).toBe(false);
  });

  it.each([
    unresolved({ extra: true }),
    unresolved({ value: "assumed" }),
    unresolved({ unresolvedReason: " " }),
    unresolved({ nextAction: " " }),
    { status: "NOT_REVIEWED", value: null },
    { status: "SOURCE_CONFIRMED", value: null, source: source(), extra: true },
    conflicting({ value: "selected" }),
    conflicting({ unresolvedReason: " " }),
    conflicting({ nextAction: " " }),
    conflicting({ extra: true }),
    { status: "CONFLICT", value: null, sourceRefs: [source()], unresolvedReason: "conflict", nextAction: "review" },
    { status: "CONFLICT", value: null, sourceRefs: Array.from({ length: TECH_PACK_POM_MAX_CONFLICT_SOURCES + 1 }, (_, i) => source({ uri: `docs/source-${i}.md` })), unresolvedReason: "conflict", nextAction: "review" },
    { status: "CONFLICT", value: null, sourceRefs: [source(), source()], unresolvedReason: "conflict", nextAction: "review" },
  ])("rejects ambiguous or incomplete source states (%#)", (fact) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ method: fact })] })).ok).toBe(false);
  });

  it.each([
    { landmarks: null },
    { landmarks: [] },
    { landmarks: Array.from({ length: TECH_PACK_POM_MAX_LANDMARKS + 1 }, (_, i) => ({ id: `landmark-${i}`, label: `Point ${i}` })) },
    { landmarks: [{ id: "Bad-ID", label: "Point" }] },
    { landmarks: [{ id: "point.one", label: "Point" }, { id: "point.one", label: "Duplicate" }] },
    { landmarks: [{ id: "point.one", label: " " }] },
    { landmarks: [{ id: "point.one", label: "x".repeat(161) }] },
    { landmarks: [{ id: "point.one", label: "Point", extra: true }] },
  ])("rejects invalid landmark definitions (%#)", ({ landmarks }) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ landmarks: sourced(landmarks) })] })).ok).toBe(false);
  });

  it.each([
    null,
    { lowerDelta: -1 },
    { lowerDelta: -1, upperDelta: 1, other: true },
    { lowerDelta: "-1", upperDelta: 1 },
    { lowerDelta: Number.NaN, upperDelta: 1 },
    { lowerDelta: -1, upperDelta: Number.POSITIVE_INFINITY },
    { lowerDelta: 0.1, upperDelta: 1 },
    { lowerDelta: -1, upperDelta: -0.1 },
  ])("rejects invalid tolerance bounds (%#)", (tolerance) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ tolerance: sourced(tolerance) })] })).ok).toBe(false);
  });

  it.each([
    null,
    { rangeLabel: "S–XL", sizeIds: ["S", "M", "M"], baseSizeId: "M" },
    { rangeLabel: "S–XL", sizeIds: null, baseSizeId: "M" },
    { rangeLabel: "S–XL", sizeIds: [], baseSizeId: "M" },
    { rangeLabel: "S–XL", sizeIds: Array.from({ length: TECH_PACK_POM_MAX_SIZE_IDS + 1 }, (_, i) => `S${i}`), baseSizeId: "S0" },
    { rangeLabel: " ", sizeIds: ["S", "M"], baseSizeId: "M" },
    { rangeLabel: "S–XL", sizeIds: ["S", 3], baseSizeId: "S" },
    { rangeLabel: "S–XL", sizeIds: ["S", "M"], baseSizeId: null },
    { rangeLabel: "S–XL", sizeIds: ["S", "M"], baseSizeId: "L" },
    { rangeLabel: "S–XL", sizeIds: ["S", "M"], baseSizeId: "M", extra: true },
  ])("rejects invalid size-range references (%#)", (range) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ sizeRangeSource: sourced(range) })] })).ok).toBe(false);
  });

  it.each([
    null,
    { ruleId: "", version: "1" },
    { ruleId: "grade.rule", version: " " },
    { ruleId: "grade.rule", version: "1", extra: true },
  ])("rejects incomplete grade-rule references (%#)", (gradeRule) => {
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ gradeRuleSource: sourced(gradeRule) })] })).ok).toBe(false);
  });

  it("rejects duplicate POM IDs and duplicate or invalid conflict sources", () => {
    const repeated = definition();
    expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [repeated, repeated] })).ok).toBe(false);
    const badSources = [
      null,
      [],
      [source(), null],
      [source(), source({ uri: "docs\\bad.md" })],
    ];
    for (const sourceRefs of badSources) {
      const fact = conflicting({ sourceRefs });
      expect(parseTechPackPomDefinitionSet(definitionSet({ definitions: [definition({ method: fact })] })).ok).toBe(false);
    }
  });
});
