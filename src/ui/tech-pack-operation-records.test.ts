import { describe, expect, it } from "vitest";
import {
  emptyTechPackOperationRecordSet,
  emptyTechPackOperationRecordSetV2,
  parseTechPackOperationRecordSet,
  unresolvedTechPackOperation,
  TECH_PACK_OPERATION_FACT_IDS,
  TECH_PACK_OPERATION_MAX_CONFLICT_SOURCES,
  TECH_PACK_OPERATION_MAX_RECORDS,
  TECH_PACK_OPERATION_MAX_REFERENCES,
  TECH_PACK_OPERATION_MAX_SEQUENCE,
  TECH_PACK_OPERATION_RECIPE_IDS,
  type TechPackOperationSourcedValue,
} from "./tech-pack-operation-records";

const source = { uri: "docs/test-fixtures/sewing-spec.pdf", title: "Synthetic sewing spec", locator: "Table 2, row 4" };
const otherSource = { uri: "https://example.test/spec", title: "Synthetic alternate", locator: "Page 3" };

function confirmed<T>(value: T, evidence = source): TechPackOperationSourcedValue<T> {
  return { status: "SOURCE_CONFIRMED", value, source: evidence };
}

function unresolved(overrides: Record<string, unknown> = {}): unknown {
  return { status: "UNRESOLVED", value: null, unresolvedReason: "No source was supplied.", nextAction: "Attach the construction source.", ...overrides };
}

function conflicted(overrides: Record<string, unknown> = {}): unknown {
  return {
    status: "CONFLICT",
    value: null,
    sourceRefs: [source, otherSource],
    unresolvedReason: "The sources disagree.",
    nextAction: "Resolve the documented source discrepancy.",
    ...overrides,
  };
}

function operation(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "join-side-seams",
    name: confirmed("Join side seams"),
    sequence: confirmed(1),
    componentRefs: confirmed(["front", "back"]),
    seamRefs: confirmed(["side-seam"]),
    facts: [],
    ...overrides,
  };
}

function recordSet(operations: readonly unknown[] = [operation()], overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { schemaVersion: 1, recipeId: "tee", operations, ...overrides };
}

function expectRejected(value: unknown): void {
  const result = parseTechPackOperationRecordSet(value);
  expect(result.ok).toBe(false);
}

describe("T03 operation source record contract", () => {
  it("creates and parses an explicitly empty source set for every supported recipe", () => {
    for (const recipeId of TECH_PACK_OPERATION_RECIPE_IDS) {
      const empty = emptyTechPackOperationRecordSet(recipeId);
      expect(empty.operations).toEqual([]);
      expect(parseTechPackOperationRecordSet(empty, recipeId)).toEqual({ ok: true, value: empty });
    }
  });

  it("creates empty schema-v2 sets and unresolved operation shells for each supported recipe", () => {
    for (const recipeId of TECH_PACK_OPERATION_RECIPE_IDS) {
      expect(parseTechPackOperationRecordSet(emptyTechPackOperationRecordSetV2(recipeId), recipeId))
        .toEqual({ ok: true, value: emptyTechPackOperationRecordSetV2(recipeId) });
    }
    const shell = unresolvedTechPackOperation("operation-1");
    expect(parseTechPackOperationRecordSet({ schemaVersion: 2, recipeId: "tee", operations: [shell] }, "tee").ok).toBe(true);
    expect(shell.facts).toEqual([]);
  });

  it("keeps recipe defaults, estimates, and user decisions distinct from source evidence in schema v2", () => {
    const data = {
      ...recordSet([operation({
        name: { status: "RECIPE_DEFAULT", value: "Plain seam", recipeId: "tee", recipeVersionMarker: "tee-default-v1", inAppLocator: "Tee recipe defaults / seam method" },
        sequence: { status: "ESTIMATE", value: 2, method: "Synthetic ordering estimate", assumptions: "Fixture assumes the second operation follows the first." },
        componentRefs: { status: "USER_DECISION", value: ["front", "back"], rationale: "Synthetic fixture decision only." },
        seamRefs: confirmed(["side-seam"]),
        facts: [
          { factId: "method", value: { status: "RECIPE_DEFAULT", value: "Plain seam", recipeId: "tee", recipeVersionMarker: "tee-default-v1", inAppLocator: "Tee recipe defaults / seam method" } },
          { factId: "seamAllowance", value: { status: "ESTIMATE", value: { amount: 1, unit: "cm" }, method: "Synthetic estimate", assumptions: "No source supplied in this fixture." } },
          { factId: "finish", value: { status: "USER_DECISION", value: "Leave raw", rationale: "Synthetic user choice." } },
          { factId: "labels", value: unresolved() },
          { factId: "packaging", value: conflicted() },
        ],
      })]),
      schemaVersion: 2,
    };
    const result = parseTechPackOperationRecordSet(data, "tee");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = result.value.operations[0]!;
      expect(result.value.schemaVersion).toBe(2);
      expect(parsed.name.status).toBe("RECIPE_DEFAULT");
      expect(parsed.sequence.status).toBe("ESTIMATE");
      expect(parsed.componentRefs.status).toBe("USER_DECISION");
      expect(parsed.facts.map((fact) => fact.value.status)).toEqual([
        "RECIPE_DEFAULT", "ESTIMATE", "USER_DECISION", "UNRESOLVED", "CONFLICT",
      ]);
    }
    expect(parseTechPackOperationRecordSet({ ...data, schemaVersion: 1 }).ok).toBe(false);
    expect(parseTechPackOperationRecordSet({ schemaVersion: 2, recipeId: "tee", operations: [operation({
      name: { status: "UNSUPPORTED", value: "fixture" },
    })] }).ok).toBe(false);
  });

  it("requires complete, recipe-matched provenance metadata for every non-source origin", () => {
    const base = operation();
    const defaultValue = { status: "RECIPE_DEFAULT", value: "Plain seam", recipeId: "tee", recipeVersionMarker: "tee-v1", inAppLocator: "defaults/seam" };
    const estimate = { status: "ESTIMATE", value: "Plain seam", method: "synthetic", assumptions: "fixture only" };
    const decision = { status: "USER_DECISION", value: "Plain seam", rationale: "synthetic fixture" };
    const invalidValues = [
      { ...defaultValue, recipeId: "polo" },
      { ...defaultValue, recipeVersionMarker: " " },
      { ...defaultValue, inAppLocator: "" },
      { ...defaultValue, extra: true },
      { ...estimate, method: "" },
      { ...estimate, assumptions: " " },
      { ...estimate, extra: true },
      { ...decision, rationale: "" },
      { ...decision, extra: true },
      { ...estimate, value: " ", assumptions: "fixture only" },
    ];
    for (const value of invalidValues) {
      expect(parseTechPackOperationRecordSet({ schemaVersion: 2, recipeId: "tee", operations: [{ ...base, name: value }] }, "tee").ok).toBe(false);
    }
  });

  it("parses a complete synthetic source-backed operation without converting it to production evidence", () => {
    const raw = recordSet([operation({ facts: [
      { factId: "method", value: confirmed("Single-needle stitch") },
      { factId: "machineSettings", value: confirmed("Unspecified in this synthetic fixture") },
      { factId: "stitchType", value: confirmed("Class 301") },
      { factId: "seamConstruction", value: confirmed("Plain seam") },
      { factId: "seamAllowance", value: confirmed({ amount: 1, unit: "cm" }) },
      { factId: "finish", value: confirmed("Overlock raw edge") },
      { factId: "pressing", value: confirmed("Press seam open") },
      { factId: "labels", value: confirmed("Care label at side seam") },
      { factId: "packaging", value: confirmed("Fold for storage") },
      { factId: "tests", value: confirmed("Record wash-test method") },
      { factId: "compliance", value: confirmed("Review applicable market requirements") },
    ] })]);
    const result = parseTechPackOperationRecordSet(raw, "tee");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.operations[0]?.componentRefs).toEqual(confirmed(["front", "back"]));
      expect(result.value.operations[0]?.facts).toHaveLength(TECH_PACK_OPERATION_FACT_IDS.length);
      expect(result.value.operations[0]?.facts[4]).toEqual({
        factId: "seamAllowance",
        value: confirmed({ amount: 1, unit: "cm" }),
      });
    }
  });

  it("preserves unresolved and conflicting source states without selecting values", () => {
    const raw = recordSet([operation({
      name: unresolved(),
      sequence: conflicted(),
      componentRefs: unresolved(),
      seamRefs: conflicted(),
      facts: [{ factId: "stitchType", value: conflicted() }, { factId: "finish", value: unresolved() }],
    })]);
    const result = parseTechPackOperationRecordSet(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsed = result.value.operations[0]!;
      expect(parsed.name.status).toBe("UNRESOLVED");
      expect(parsed.sequence.status).toBe("CONFLICT");
      expect(parsed.componentRefs).toMatchObject({ status: "UNRESOLVED", value: null });
      expect(parsed.seamRefs.status).toBe("CONFLICT");
      expect(parsed.facts.map((fact) => fact.value.status)).toEqual(["CONFLICT", "UNRESOLVED"]);
    }
  });

  it("rejects unknown, missing, extra, or mismatched record-set fields", () => {
    expectRejected({ ...recordSet(), extra: true });
    expectRejected({ schemaVersion: 1, recipeId: "tee" });
    expectRejected({ ...recordSet(), schemaVersion: 3 });
    expectRejected({ ...recordSet(), recipeId: "unknown" });
    expectRejected(recordSet([], { recipeId: null }));
    expectRejected(recordSet("not-an-array" as unknown as readonly unknown[]));
    expectRejected(recordSet(new Array(TECH_PACK_OPERATION_MAX_RECORDS + 1).fill(operation())));
  });

  it("rejects malformed operations, invalid stable IDs, and duplicate operation IDs", () => {
    expectRejected(recordSet([null]));
    expectRejected(recordSet([{ ...operation(), extra: true }]));
    expectRejected(recordSet([{ ...operation(), id: "UpperCase" }]));
    expectRejected(recordSet([operation(), operation()]));
  });

  it("requires unique source-confirmed sequence values and bounded positive integers", () => {
    expectRejected(recordSet([operation(), operation({ id: "another", sequence: confirmed(1) })]));
    for (const value of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, TECH_PACK_OPERATION_MAX_SEQUENCE + 1]) {
      expectRejected(recordSet([operation({ sequence: confirmed(value) })]));
    }
    expectRejected(recordSet([operation({ sequence: { ...confirmed(1), extra: true } })]));
  });

  it("accepts non-sequential unique order and rejects malformed component or seam references", () => {
    expect(parseTechPackOperationRecordSet(recordSet([
      operation({ sequence: confirmed(4) }), operation({ id: "press", sequence: confirmed(9), componentRefs: confirmed([]), seamRefs: confirmed([]) }),
    ])).ok).toBe(true);
    expectRejected(recordSet([operation({ componentRefs: confirmed(["Front"]) })]));
    expectRejected(recordSet([operation({ seamRefs: confirmed(["side", "side"]) })]));
    expectRejected(recordSet([operation({ componentRefs: confirmed(new Array(TECH_PACK_OPERATION_MAX_REFERENCES + 1).fill("part")) })]));
    expectRejected(recordSet([operation({ seamRefs: confirmed("side-seam") })]));
  });

  it("requires explicit source states for operation identity, links, and facts", () => {
    expectRejected(recordSet([operation({ name: "Join seams" })]));
    expectRejected(recordSet([operation({ sequence: { status: "MISSING" } })]));
    expectRejected(recordSet([operation({ componentRefs: confirmed(["part"], { uri: "C:\\spec.pdf", title: "spec", locator: "p1" }) })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "unsupported", value: confirmed("x") }] })]));
    expectRejected(recordSet([operation({ facts: [null] })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "method", value: confirmed(" ") }] })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "method", value: confirmed("x".repeat(513)) }] })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "method", value: confirmed("x") }, { factId: "method", value: confirmed("y") }] })]));
    expectRejected(recordSet([operation({ facts: "method" as unknown as readonly unknown[] })]));
    const tooManyFacts: unknown[] = [
      ...TECH_PACK_OPERATION_FACT_IDS.map((factId) => ({ factId, value: confirmed("x") })),
      { factId: "extra", value: confirmed("x") },
    ];
    expectRejected(recordSet([operation({ facts: tooManyFacts })]));
  });

  it("requires unresolved facts to carry null value, reason, and actionable next step", () => {
    expectRejected(recordSet([operation({ name: unresolved({ value: "assumed" }) })]));
    expectRejected(recordSet([operation({ name: unresolved({ unresolvedReason: " " }) })]));
    expectRejected(recordSet([operation({ name: unresolved({ nextAction: "" }) })]));
    expectRejected(recordSet([operation({ name: unresolved({ extra: true }) })]));
  });

  it("requires conflicting facts to cite multiple distinct sources without selecting a value", () => {
    expectRejected(recordSet([operation({ sequence: conflicted({ sourceRefs: "not-an-array" }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ sourceRefs: [source] }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ sourceRefs: new Array(TECH_PACK_OPERATION_MAX_CONFLICT_SOURCES + 1).fill(source).map((item, index) => ({ ...item, locator: `p${index}` })) }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ sourceRefs: [source, source] }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ value: 1 }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ unresolvedReason: "" }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ nextAction: " " }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ extra: true }) })]));
    expectRejected(recordSet([operation({ sequence: conflicted({ sourceRefs: [{ ...source, title: "" }, otherSource] }) })]));
  });

  it("rejects malformed source references and accepts HTTPS or portable relative sources", () => {
    expect(parseTechPackOperationRecordSet(recordSet([operation({ name: confirmed("Join", otherSource) })])).ok).toBe(true);
    for (const uri of ["/machine/path", "D:\\spec.pdf", "D:spec.pdf", "docs/../private", "mailto:maker@example.test", "https://%", " docs/source.pdf"]) {
      expectRejected(recordSet([operation({ name: confirmed("Join", { ...source, uri }) })]));
    }
    expectRejected(recordSet([operation({ name: confirmed("Join", { ...source, title: "" }) })]));
    expectRejected(recordSet([operation({ name: confirmed("Join", { ...source, locator: "" }) })]));
    expectRejected(recordSet([operation({ name: confirmed("Join", { ...source, extra: true } as unknown as typeof source) })]));
    expectRejected(recordSet([operation({ name: confirmed("Join", null as never) })]));
  });

  it("validates seam allowance shape, units, finite non-negative amounts, and permits explicit zero", () => {
    const zero = recordSet([operation({ facts: [{ factId: "seamAllowance", value: confirmed({ amount: 0, unit: "mm" }) }] })]);
    expect(parseTechPackOperationRecordSet(zero).ok).toBe(true);
    for (const amount of [-0.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expectRejected(recordSet([operation({ facts: [{ factId: "seamAllowance", value: confirmed({ amount, unit: "cm" }) }] })]));
    }
    expectRejected(recordSet([operation({ facts: [{ factId: "seamAllowance", value: confirmed({ amount: 1, unit: "yd" }) }] })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "seamAllowance", value: confirmed({ amount: 1, unit: "cm", extra: true }) }] })]));
    expectRejected(recordSet([operation({ facts: [{ factId: "seamAllowance", value: confirmed(1) }] })]));
  });

  it("rejects cross-recipe use when an expected recipe is supplied", () => {
    expect(parseTechPackOperationRecordSet(recordSet(), "fitted").ok).toBe(false);
    expect(parseTechPackOperationRecordSet(recordSet(), "tee").ok).toBe(true);
  });
});
