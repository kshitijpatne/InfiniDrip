import { describe, expect, it } from "vitest";
import {
  GRADE_PLAN_RECORD_VERSION,
  approveGradePlan,
  configureGradePlan,
  copyGradePlanAsDraft,
  createGradePlanDraft,
  gradePlanCompletionIssues,
  gradePlanIsStale,
  parseGradePlanRecord,
  reviewGradePlan,
  setGradePlanDelta,
  updateGradePlanDraft,
  type GradePlanBaseBinding,
  type GradePlanBasis,
  type GradePlanRecord,
  type GradePlanResult,
  type GradePlanSize,
  type GradePlanTarget,
  type GradePlanTargetKind,
} from "./grade-plan";

const PROJECT_ID = "0f8b8e2a-7c1d-4a5e-9b3f-2d6c8a1e4f70";
const STYLE_ID = "5a1c3e7b-2f4d-4e6a-8c9b-1d3f5a7c9e0b";
const STYLE_ID_2 = "e5f7a9b1-3c4d-4e5f-9a6b-c7d8e9f0a1b2";
const HEAD_ID = "c3d5e7f9-1a2b-4c3d-a4e5-f6a7b8c9d0e1";
const HEAD_ID_2 = "d4e6f8a0-2b3c-4d4e-b5f6-a7b8c9d0e1f2";
const FINGERPRINT = "a".repeat(64);
const FINGERPRINT_2 = "b".repeat(64);

const BEFORE_T0 = "2026-09-27T07:59:59.999Z";
const T0 = "2026-09-27T08:00:00.000Z";
const T1 = "2026-09-27T08:01:00.000Z";
const T2 = "2026-09-27T08:02:00.000Z";
const T3 = "2026-09-27T08:03:00.000Z";
const T4 = "2026-09-27T08:04:00.000Z";
const T5 = "2026-09-27T08:05:00.000Z";
const T6 = "2026-09-27T08:06:00.000Z";

const BINDING: GradePlanBaseBinding = {
  projectId: PROJECT_ID,
  styleId: STYLE_ID,
  recipeId: "tee",
  revisionHeadId: HEAD_ID,
  captureRevision: 3,
  fingerprint: FINGERPRINT,
};

const CHEST_ID = "body.chest-girth";
const SLEEVE_ID = "option.sleeve-length";
const HEM_ID = "pom.hps-to-hem";
const CHEST: Omit<GradePlanTarget, "deltas"> = {
  targetId: CHEST_ID, kind: "measurement", label: "Chest girth", unit: "cm", baseValue: 100,
};
const TARGETS: readonly Omit<GradePlanTarget, "deltas">[] = [
  CHEST,
  { targetId: SLEEVE_ID, kind: "option", label: "Sleeve length", unit: "cm", baseValue: 20 },
  { targetId: HEM_ID, kind: "pom", label: "HPS to hem", unit: "cm", baseValue: 70 },
];
const TARGET_IDS = [CHEST_ID, SLEEVE_ID, HEM_ID];

const POPULATION_BASIS: GradePlanBasis = {
  kind: "population-source",
  population: "Adult women, US misses",
  sourceName: "ASTM D5585",
  sourceVersion: "2021",
  sourceScope: "Misses sizes 2–20",
};
const USER_BASIS: GradePlanBasis = {
  kind: "user-authored-digital-rule",
  decision: "Grade chest by 5 cm per size step",
  digitalRange: "S–L digital preview only",
};
const SIZES: readonly GradePlanSize[] = [
  { label: "S", position: -1 },
  { label: "M", position: 0 },
  { label: "L", position: 1 },
];
const CONFIG: Parameters<typeof configureGradePlan>[1] = {
  basis: USER_BASIS,
  declaredRange: "S–L only; petite and tall fits are unsupported",
  baseSizeLabel: "M",
  sizes: SIZES,
  exceptions: [],
};

const FIELDS_ERROR = "Grade-plan record fields are incomplete or unknown.";
const VERSION_ERROR = "Unsupported grade-plan record version.";
const IDENTITY_ERROR = "Grade-plan project, style, recipe or base revision identity is invalid.";
const REVISION_ERROR = "Grade-plan revisions or base fingerprint are invalid.";
const RANGE_ERROR = "Grade-plan range or base label is malformed.";
const POPULATION_BASIS_ERROR = "Population/source basis requires its population, named source, version and scope.";
const USER_BASIS_ERROR = "User-authored basis requires a decision and declared digital range.";
const SIZES_ERROR = "Sizes must be an array with at most 32 entries.";
const TARGETS_ERROR = "Targets must be an array with at most 128 entries.";
const EXCEPTIONS_ERROR = "Exceptions must be an array with at most 256 entries.";
const TIMESTAMP_ERROR = "Grade-plan status or timestamps are invalid.";
const STATE_ERROR = "Grade-plan review state does not match its content.";
const BASIS_ISSUE = "Choose a named population/source or an explicit user-authored digital rule.";
const RANGE_ISSUE = "Describe the declared size range and unsupported edge cases.";
const BASE_NAME_ISSUE = "Name the plan’s base size.";
const SIZE_COUNT_ISSUE = "A grade plan needs at least two explicitly named sizes.";
const BASE_ROW_ISSUE = "The base size must appear exactly once at position zero.";
const COVERAGE_ISSUE = "Every current recipe measurement, control and POM must have exactly one explicit target.";
const REVIEW_STALE_ERROR = "The base design changed; refresh the grade-plan base before review.";
const APPROVE_STALE_ERROR = "The base design changed after review; review the plan again.";
const REVIEW_FIRST_ERROR = "Review the complete plan before approval.";
const DELTA_VALUE_ERROR = "A grade-plan change must be a finite number or an unfinished value.";
const DELTA_TARGET_ERROR = "Choose a declared grade-plan target and size.";
const BASE_ZERO_ERROR = "The base size must remain at zero change.";

function unwrap<T>(result: GradePlanResult<T>): T {
  if (!result.ok) throw new Error(`Expected grade-plan success: ${result.errors.join("; ")}`);
  return result.value;
}

function errorsOf<T>(result: GradePlanResult<T>): readonly string[] {
  if (result.ok) throw new Error("Expected the grade-plan operation to fail.");
  return result.errors;
}

function jsonRecord(plan: GradePlanRecord): Record<string, unknown> {
  return JSON.parse(JSON.stringify(plan)) as Record<string, unknown>;
}

function deltasOf(plan: GradePlanRecord, targetId: string) {
  return plan.targets.find((target) => target.targetId === targetId)?.deltas;
}

function lifecycle(basis: GradePlanBasis = USER_BASIS) {
  const draft = unwrap(createGradePlanDraft(BINDING, TARGETS, T0));
  const configured = unwrap(configureGradePlan(draft, { ...CONFIG, basis }, T1));
  let complete = configured;
  for (const target of TARGETS) {
    complete = unwrap(setGradePlanDelta(complete, target.targetId, "S", -5, T2));
    complete = unwrap(setGradePlanDelta(complete, target.targetId, "L", 5, T2));
  }
  const reviewed = unwrap(reviewGradePlan(complete, TARGET_IDS, BINDING, T3));
  const approved = unwrap(approveGradePlan(reviewed, TARGET_IDS, BINDING, T4));
  return { draft, configured, complete, reviewed, approved };
}

const unfilledIssues = (label: string) => [
  `${label} at S: enter a change from base or document an exception.`,
  `${label} at L: enter a change from base or document an exception.`,
];

describe("grade-plan draft creation", () => {
  it("starts as an unconfigured revision-one draft bound to the base with empty target values", () => {
    const draft = unwrap(createGradePlanDraft(BINDING, TARGETS, T0));
    expect(draft).toEqual({
      schemaVersion: GRADE_PLAN_RECORD_VERSION,
      ...BINDING,
      revision: 1,
      basis: null,
      declaredRange: "",
      baseSizeLabel: null,
      sizes: [],
      targets: TARGETS.map((target) => ({ ...target, deltas: [] })),
      exceptions: [],
      status: "draft",
      reviewedAt: null,
      approvedAt: null,
      createdAt: T0,
      updatedAt: T0,
    });
    expect(parseGradePlanRecord(jsonRecord(draft))).toEqual({ ok: true, value: draft });
  });

  it("rejects invalid bindings, targets and creation timestamps", () => {
    expect(errorsOf(createGradePlanDraft({ ...BINDING, styleId: "style-1" }, TARGETS, T0))).toEqual([IDENTITY_ERROR]);
    expect(errorsOf(createGradePlanDraft({ ...BINDING, captureRevision: 0 }, TARGETS, T0))).toEqual([REVISION_ERROR]);
    expect(errorsOf(createGradePlanDraft(BINDING, [{ ...CHEST, kind: "control" as GradePlanTargetKind }], T0)))
      .toEqual(["Target 1 is malformed."]);
    expect(errorsOf(createGradePlanDraft(BINDING, [CHEST, CHEST], T0))).toEqual([`Target ${CHEST_ID} is duplicated.`]);
    expect(errorsOf(createGradePlanDraft(BINDING, TARGETS, "2026-09-27T08:00:00Z"))).toEqual([TIMESTAMP_ERROR]);
  });
});

describe("strict grade-plan record parser", () => {
  it("round-trips every lifecycle state through JSON", () => {
    const { draft, configured, complete, reviewed, approved } = lifecycle();
    for (const plan of [draft, configured, complete, reviewed, approved]) {
      expect(parseGradePlanRecord(jsonRecord(plan))).toEqual({ ok: true, value: plan });
    }
  });

  it("rejects non-records and records with missing or unknown fields", () => {
    const record = jsonRecord(lifecycle().reviewed);
    const missing = { ...record };
    delete missing.exceptions;
    for (const value of [null, undefined, [], "record", 1, { ...record, notes: "x" }, missing]) {
      expect(errorsOf(parseGradePlanRecord(value))).toEqual([FIELDS_ERROR]);
    }
  });

  it("rejects each malformed field with its specific error", () => {
    const reviewedJson = JSON.stringify(lifecycle().reviewed);
    const deltas = [
      { sizeLabel: "S", deltaFromBase: -5 },
      { sizeLabel: "M", deltaFromBase: 0 },
      { sizeLabel: "L", deltaFromBase: 5 },
    ];
    const rawTarget = (overrides: Record<string, unknown> = {}) => ({ ...CHEST, deltas, ...overrides });
    const cases: readonly { name: string; patch: Record<string, unknown>; error: string }[] = [
      { name: "future schema", patch: { schemaVersion: 2 }, error: VERSION_ERROR },
      { name: "non-UUID project", patch: { projectId: "not-a-uuid" }, error: IDENTITY_ERROR },
      { name: "nil-version style UUID", patch: { styleId: "00000000-0000-0000-0000-000000000000" }, error: IDENTITY_ERROR },
      { name: "uppercase recipe", patch: { recipeId: "Tee" }, error: IDENTITY_ERROR },
      { name: "one-character recipe", patch: { recipeId: "t" }, error: IDENTITY_ERROR },
      { name: "numeric revision head", patch: { revisionHeadId: 7 }, error: IDENTITY_ERROR },
      { name: "zero revision", patch: { revision: 0 }, error: REVISION_ERROR },
      { name: "fractional revision", patch: { revision: 1.5 }, error: REVISION_ERROR },
      { name: "string capture revision", patch: { captureRevision: "3" }, error: REVISION_ERROR },
      { name: "short fingerprint", patch: { fingerprint: "a".repeat(63) }, error: REVISION_ERROR },
      { name: "oversized range", patch: { declaredRange: "x".repeat(241) }, error: RANGE_ERROR },
      { name: "non-string range", patch: { declaredRange: 5 }, error: RANGE_ERROR },
      { name: "padded base label", patch: { baseSizeLabel: " M" }, error: RANGE_ERROR },
      { name: "string basis", patch: { basis: "ASTM" }, error: "Grade-plan basis is malformed." },
      { name: "unknown basis kind", patch: { basis: { kind: "estimate" } }, error: "Grade-plan basis kind is unsupported." },
      { name: "blank source version", patch: { basis: { ...POPULATION_BASIS, sourceVersion: "" } }, error: POPULATION_BASIS_ERROR },
      { name: "mixed population basis", patch: { basis: { ...POPULATION_BASIS, decision: "x" } }, error: POPULATION_BASIS_ERROR },
      { name: "padded digital range", patch: { basis: { ...USER_BASIS, digitalRange: "S–L " } }, error: USER_BASIS_ERROR },
      { name: "mixed user basis", patch: { basis: { ...USER_BASIS, sourceName: "x" } }, error: USER_BASIS_ERROR },
      { name: "string sizes", patch: { sizes: "S,M,L" }, error: SIZES_ERROR },
      {
        name: "33 sizes",
        patch: { sizes: Array.from({ length: 33 }, (_, index) => ({ label: `S${index}`, position: index })) },
        error: SIZES_ERROR,
      },
      { name: "fractional position", patch: { sizes: [SIZES[0], { label: "M", position: 0.5 }] }, error: "Size 2 is malformed." },
      { name: "out-of-range position", patch: { sizes: [{ label: "XXL", position: 101 }] }, error: "Size 1 is malformed." },
      { name: "extra size key", patch: { sizes: [{ label: "S", position: -1, note: "x" }] }, error: "Size 1 is malformed." },
      {
        name: "case-insensitive duplicate size label",
        patch: { sizes: [{ label: "M", position: 0 }, { label: "m", position: 1 }] },
        error: "Size label “m” is duplicated.",
      },
      {
        name: "duplicate size position",
        patch: { sizes: [{ label: "S", position: -1 }, { label: "M", position: -1 }] },
        error: "Size position -1 is duplicated.",
      },
      { name: "object targets", patch: { targets: {} }, error: TARGETS_ERROR },
      { name: "unknown target kind", patch: { targets: [rawTarget({ kind: "control" })] }, error: "Target 1 is malformed." },
      { name: "string base value", patch: { targets: [rawTarget({ baseValue: "100" })] }, error: "Target 1 is malformed." },
      { name: "duplicate target", patch: { targets: [rawTarget(), rawTarget()] }, error: `Target ${CHEST_ID} is duplicated.` },
      {
        name: "infinite delta",
        patch: { targets: [rawTarget({ deltas: [{ sizeLabel: "S", deltaFromBase: Number.POSITIVE_INFINITY }] })] },
        error: `Target ${CHEST_ID} size value 1 is malformed.`,
      },
      {
        name: "string delta",
        patch: { targets: [rawTarget({ deltas: [{ sizeLabel: "S", deltaFromBase: "-5" }] })] },
        error: `Target ${CHEST_ID} size value 1 is malformed.`,
      },
      {
        name: "duplicate delta size",
        patch: {
          targets: [rawTarget({ deltas: [{ sizeLabel: "S", deltaFromBase: -5 }, { sizeLabel: "S", deltaFromBase: -4 }] })],
        },
        error: `Target ${CHEST_ID} has duplicate size values.`,
      },
      { name: "null exceptions", patch: { exceptions: null }, error: EXCEPTIONS_ERROR },
      { name: "exception without reason", patch: { exceptions: [{ targetId: CHEST_ID, sizeLabel: "L" }] }, error: "Exception 1 is malformed." },
      {
        name: "case-insensitive duplicate exception",
        patch: {
          exceptions: [
            { targetId: CHEST_ID, sizeLabel: "L", reason: "Fabric width" },
            { targetId: CHEST_ID, sizeLabel: "l", reason: "Fabric width" },
          ],
        },
        error: `Exception for ${CHEST_ID} at l is duplicated.`,
      },
      { name: "unknown status", patch: { status: "archived" }, error: TIMESTAMP_ERROR },
      { name: "second-precision createdAt", patch: { createdAt: "2026-09-27T08:00:00Z" }, error: TIMESTAMP_ERROR },
      { name: "offset updatedAt", patch: { updatedAt: "2026-09-27T09:03:00.000+01:00" }, error: TIMESTAMP_ERROR },
      { name: "non-ISO reviewedAt", patch: { reviewedAt: "2026-09-27 08:03:00" }, error: TIMESTAMP_ERROR },
      { name: "non-string createdAt", patch: { createdAt: 4 }, error: TIMESTAMP_ERROR },
      { name: "updatedAt before createdAt", patch: { updatedAt: BEFORE_T0 }, error: TIMESTAMP_ERROR },
    ];
    for (const { name, patch, error } of cases) {
      const record = JSON.parse(reviewedJson) as Record<string, unknown>;
      expect(errorsOf(parseGradePlanRecord({ ...record, ...patch })), name).toEqual([error]);
    }
  });

  it("accepts updatedAt equal to createdAt but not earlier", () => {
    const draft = jsonRecord(unwrap(createGradePlanDraft(BINDING, TARGETS, T0)));
    expect(unwrap(parseGradePlanRecord({ ...draft, updatedAt: T0 })).updatedAt).toBe(T0);
    expect(errorsOf(parseGradePlanRecord({ ...draft, updatedAt: BEFORE_T0 }))).toEqual([TIMESTAMP_ERROR]);
  });

  it("rejects review state that contradicts the record content", () => {
    const { configured, reviewed, approved } = lifecycle();
    const nullChestL = jsonRecord(reviewed).targets as Record<string, unknown>[];
    const chest = nullChestL[0] as { deltas: { deltaFromBase: number | null }[] };
    chest.deltas[2]!.deltaFromBase = null;
    const inconsistent: readonly [GradePlanRecord, Record<string, unknown>][] = [
      [configured, { reviewedAt: T1 }],
      [configured, { reviewedAt: T1, approvedAt: T1 }],
      [reviewed, { reviewedAt: null }],
      [reviewed, { approvedAt: T3 }],
      [reviewed, { targets: nullChestL }],
      [reviewed, { exceptions: [{ targetId: "pom.unknown", sizeLabel: "L", reason: "Not in recipe" }] }],
      [approved, { approvedAt: null }],
      [approved, { basis: null }],
      [approved, { declaredRange: " " }],
    ];
    for (const [plan, patch] of inconsistent) {
      expect(errorsOf(parseGradePlanRecord({ ...jsonRecord(plan), ...patch }))).toEqual(
        "reviewedAt" in patch && patch.reviewedAt === null
          ? ["Grade-plan review and approval timestamps do not match its latest revision."]
          : [STATE_ERROR],
      );
    }
    expect(parseGradePlanRecord(jsonRecord(configured)).ok).toBe(true);
  });
});

describe("grade-plan completion rules", () => {
  it("lists every missing plan decision for a fresh draft without duplicating messages", () => {
    const { draft } = lifecycle();
    const base = [BASIS_ISSUE, RANGE_ISSUE, BASE_NAME_ISSUE, SIZE_COUNT_ISSUE, BASE_ROW_ISSUE];
    expect(gradePlanCompletionIssues(draft)).toEqual(base);
    expect(gradePlanCompletionIssues(draft, TARGET_IDS)).toEqual(base);
    expect(gradePlanCompletionIssues(draft, [...TARGET_IDS, "pom.cuff-opening"])).toEqual([...base, COVERAGE_ISSUE]);
    const unknownException = { targetId: "pom.unknown", sizeLabel: "L", reason: "One" };
    const { complete } = lifecycle();
    expect(gradePlanCompletionIssues({
      ...complete,
      exceptions: [unknownException, { ...unknownException, reason: "Two" }],
    })).toEqual(["Exception pom.unknown at L must identify a declared target and size."]);
  });

  it("requires an explicit value per declared size, in size order, with zero change at the base", () => {
    const { configured, complete } = lifecycle();
    expect(gradePlanCompletionIssues(configured)).toEqual([
      ...unfilledIssues("Chest girth"), ...unfilledIssues("Sleeve length"), ...unfilledIssues("HPS to hem"),
    ]);
    expect(gradePlanCompletionIssues(complete)).toEqual([]);
    const withChest = (deltas: GradePlanTarget["deltas"]) => ({
      ...complete,
      targets: complete.targets.map((target) => target.targetId === CHEST_ID ? { ...target, deltas } : target),
    });
    const chestDeltas = deltasOf(complete, CHEST_ID)!;
    const orderIssue = "Chest girth: add an explicit value for every declared size in size order.";
    expect(gradePlanCompletionIssues(withChest([...chestDeltas].reverse()))).toEqual([orderIssue]);
    expect(gradePlanCompletionIssues(withChest(chestDeltas.slice(0, 2)))).toEqual([orderIssue]);
    expect(gradePlanCompletionIssues(withChest(chestDeltas.map((delta) => delta.sizeLabel === "M" ? { ...delta, deltaFromBase: 1 } : delta))))
      .toEqual(["Chest girth at the base size must have a zero change."]);
    expect(gradePlanCompletionIssues({ ...complete, baseSizeLabel: "L" })).toContain(BASE_ROW_ISSUE);
    expect(gradePlanCompletionIssues({
      ...complete,
      sizes: [...complete.sizes, { label: "XL", position: 0 }],
    })).toContain(BASE_ROW_ISSUE);
    expect(gradePlanCompletionIssues({ ...complete, sizes: [{ label: "M", position: 0 }] })).toContain(SIZE_COUNT_ISSUE);
    expect(gradePlanCompletionIssues({ ...complete, declaredRange: "  " })).toEqual([RANGE_ISSUE]);
  });

  it("accepts only documented exceptions for declared non-base target sizes", () => {
    const { complete } = lifecycle();
    const exception = { targetId: CHEST_ID, sizeLabel: "L", reason: "Chest ease capped at L by fabric width" };
    const unfinished = unwrap(setGradePlanDelta(complete, CHEST_ID, "L", null, T3));
    const withException = unwrap(configureGradePlan(unfinished, { ...CONFIG, exceptions: [exception] }, T3));
    expect(withException.exceptions).toEqual([exception]);
    expect(gradePlanCompletionIssues(withException, TARGET_IDS)).toEqual([]);
    const reviewed = unwrap(reviewGradePlan(withException, TARGET_IDS, BINDING, T4));
    expect(unwrap(approveGradePlan(reviewed, TARGET_IDS, BINDING, T5)).exceptions).toEqual([exception]);

    const unknownTarget = unwrap(configureGradePlan(complete, {
      ...CONFIG, exceptions: [{ ...exception, targetId: "pom.unknown" }],
    }, T3));
    expect(errorsOf(reviewGradePlan(unknownTarget, TARGET_IDS, BINDING, T4)))
      .toEqual(["Exception pom.unknown at L must identify a declared target and size."]);
    const caseMismatch = unwrap(configureGradePlan(unfinished, {
      ...CONFIG, exceptions: [{ ...exception, sizeLabel: "l" }],
    }, T3));
    expect(gradePlanCompletionIssues(caseMismatch, TARGET_IDS)).toEqual([]);
    expect(errorsOf(configureGradePlan(complete, {
      ...CONFIG, exceptions: [exception, { ...exception, sizeLabel: "l" }],
    }, T3))).toEqual([`Exception for ${CHEST_ID} at l is duplicated.`]);
    expect(errorsOf(configureGradePlan(complete, {
      ...CONFIG, exceptions: [{ ...exception, reason: " padded" }],
    }, T3))).toEqual(["Exception 1 is malformed."]);
    const unresolvedException = unwrap(configureGradePlan(complete, { ...CONFIG, exceptions: [exception] }, T3));
    expect(errorsOf(reviewGradePlan(unresolvedException, TARGET_IDS, BINDING, T4)))
      .toEqual([
        `Chest girth at L: resolve the value or exception, not both.`,
        `Exception ${CHEST_ID} at L must leave its value unfinished.`,
      ]);
    const baseException = unwrap(configureGradePlan(complete, {
      ...CONFIG,
      exceptions: [{ targetId: CHEST_ID, sizeLabel: "M", reason: "Cannot grade the base" }],
    }, T3));
    expect(gradePlanCompletionIssues(baseException, TARGET_IDS)).toEqual([
      "Chest girth at M: resolve the value or exception, not both.",
      `Exception ${CHEST_ID} cannot replace the base-size value.`,
    ]);
  });
});

describe("grade-plan basis and size configuration", () => {
  const bases: [string, GradePlanBasis][] = [
    ["population/source", POPULATION_BASIS],
    ["user-authored digital rule", USER_BASIS],
  ];
  it.each(bases)("reviews and approves a complete plan with a %s basis", (_name, basis) => {
    const { reviewed, approved } = lifecycle(basis);
    expect(reviewed).toMatchObject({ basis, status: "reviewed", revision: 9, reviewedAt: T3, approvedAt: null, updatedAt: T3 });
    expect(approved).toMatchObject({ basis, status: "approved", revision: 10, reviewedAt: T3, approvedAt: T4, updatedAt: T4 });
    expect(parseGradePlanRecord(jsonRecord(approved))).toEqual({ ok: true, value: approved });
  });

  it("rejects malformed or incomplete basis declarations", () => {
    const { draft, complete } = lifecycle();
    expect(errorsOf(configureGradePlan(draft, {
      ...CONFIG, basis: { kind: "population-source", population: "Adults" } as unknown as GradePlanBasis,
    }, T1))).toEqual([POPULATION_BASIS_ERROR]);
    expect(errorsOf(configureGradePlan(draft, {
      ...CONFIG, basis: { ...USER_BASIS, decision: "" } as GradePlanBasis,
    }, T1))).toEqual([USER_BASIS_ERROR]);
    const withoutBasis = unwrap(configureGradePlan(complete, { ...CONFIG, basis: null }, T3));
    expect(errorsOf(reviewGradePlan(withoutBasis, TARGET_IDS, BINDING, T4))).toEqual([BASIS_ISSUE]);
  });

  it("rejects duplicate labels ignoring case and resolves edits case-insensitively", () => {
    const { draft, configured } = lifecycle();
    expect(errorsOf(configureGradePlan(draft, {
      ...CONFIG, sizes: [{ label: "M", position: 0 }, { label: "m", position: 1 }],
    }, T1))).toEqual(["Size label “m” is duplicated."]);
    expect(errorsOf(configureGradePlan(draft, {
      ...CONFIG, sizes: [{ label: "S ", position: -1 }, { label: "M", position: 0 }],
    }, T1))).toEqual(["Size 1 is malformed."]);
    expect(errorsOf(configureGradePlan(draft, {
      ...CONFIG, sizes: [{ label: "M", position: 0 }, { label: "S", position: -1 }],
    }, T1))).toEqual(["Sizes must be listed in increasing position order."]);
    expect(unwrap(setGradePlanDelta(configured, CHEST_ID, "s", -5, T2)).targets[0]?.deltas[0]?.deltaFromBase).toBe(-5);
  });

  it("builds target values in declared size order with the base forced to zero", () => {
    const { configured } = lifecycle();
    for (const targetId of TARGET_IDS) {
      expect(deltasOf(configured, targetId)).toEqual([
        { sizeLabel: "S", deltaFromBase: null },
        { sizeLabel: "M", deltaFromBase: 0 },
        { sizeLabel: "L", deltaFromBase: null },
      ]);
    }
  });
});

describe("grade-plan timestamp ordering", () => {
  it("rejects lifecycle operations timestamped before the record was created", () => {
    const { configured, complete, reviewed } = lifecycle();
    expect(errorsOf(configureGradePlan(configured, CONFIG, BEFORE_T0))).toEqual(["A grade-plan edit must use a canonical timestamp no earlier than its latest revision."]);
    expect(errorsOf(setGradePlanDelta(configured, CHEST_ID, "S", -5, BEFORE_T0))).toEqual(["A grade-plan edit must use a canonical timestamp no earlier than its latest revision."]);
    expect(errorsOf(reviewGradePlan(complete, TARGET_IDS, BINDING, BEFORE_T0))).toEqual(["Review must be recorded at or after the latest grade-plan edit."]);
    expect(errorsOf(approveGradePlan(reviewed, TARGET_IDS, BINDING, BEFORE_T0))).toEqual(["Approval must be recorded at or after the latest grade-plan review."]);
    expect(errorsOf(setGradePlanDelta(configured, CHEST_ID, "S", -5, "2026-09-27T08:02:00Z")))
      .toEqual(["A grade-plan edit must use a canonical timestamp no earlier than its latest revision."]);
  });

  it("keeps createdAt fixed while updatedAt follows each accepted change", () => {
    const { draft, configured, complete, reviewed, approved } = lifecycle();
    expect([draft, configured, complete, reviewed, approved].map((plan) => [plan.createdAt, plan.updatedAt])).toEqual([
      [T0, T0], [T0, T1], [T0, T2], [T0, T3], [T0, T4],
    ]);
    expect(unwrap(configureGradePlan(draft, CONFIG, T0)).updatedAt).toBe(T0);
    const unnamedBase = unwrap(configureGradePlan(draft, { ...CONFIG, baseSizeLabel: null }, T1));
    expect(unnamedBase.targets.every((target) => target.deltas.every((delta) => delta.deltaFromBase === null))).toBe(true);
    expect(gradePlanCompletionIssues(unnamedBase)).toContain(BASE_ROW_ISSUE);
    const unnamedEdited = unwrap(setGradePlanDelta(unnamedBase, CHEST_ID, "S", -5, T2));
    expect(unnamedEdited.targets[0]?.deltas[0]?.deltaFromBase).toBe(-5);
    expect(gradePlanCompletionIssues(unnamedEdited)).toContain(BASE_ROW_ISSUE);
    expect(gradePlanCompletionIssues({
      ...unnamedEdited,
      exceptions: [{ targetId: CHEST_ID, sizeLabel: "S", reason: "Explicit exception" }],
    })).toContain(`Exception ${CHEST_ID} at S must leave its value unfinished.`);
  });
});

describe("grade-plan review and approval", () => {
  it("requires exact recipe target coverage at review, independent of order", () => {
    const { configured, complete } = lifecycle();
    expect(errorsOf(reviewGradePlan({} as GradePlanRecord, TARGET_IDS, BINDING, T3))).toEqual([FIELDS_ERROR]);
    expect(errorsOf(reviewGradePlan(complete, [CHEST_ID, SLEEVE_ID], BINDING, T3))).toEqual([COVERAGE_ISSUE]);
    expect(errorsOf(reviewGradePlan(complete, [...TARGET_IDS, "pom.cuff-opening"], BINDING, T3))).toEqual([COVERAGE_ISSUE]);
    expect(errorsOf(reviewGradePlan(complete, [...TARGET_IDS, CHEST_ID], BINDING, T3))).toEqual([COVERAGE_ISSUE]);
    expect(errorsOf(reviewGradePlan(complete, [], BINDING, T3))).toEqual([COVERAGE_ISSUE]);
    expect(unwrap(reviewGradePlan(complete, [...TARGET_IDS].reverse(), BINDING, T3)).status).toBe("reviewed");
    expect(errorsOf(reviewGradePlan(configured, TARGET_IDS, BINDING, T3))).toEqual([
      ...unfilledIssues("Chest girth"), ...unfilledIssues("Sleeve length"), ...unfilledIssues("HPS to hem"),
    ]);
    expect(gradePlanCompletionIssues(complete)).toEqual([]);
  });

  it("approves exactly the reviewed target set and rejects forged or stale reviewed records", () => {
    const { configured, complete, reviewed, approved } = lifecycle();
    expect(approved.targets).toEqual(reviewed.targets);
    expect(approved.targets.map((target) => target.targetId).sort()).toEqual([...TARGET_IDS].sort());

    const forgedUnfilled: GradePlanRecord = { ...configured, status: "reviewed", reviewedAt: T3, updatedAt: T3 };
    expect(errorsOf(approveGradePlan(forgedUnfilled, TARGET_IDS, BINDING, T4))).toEqual([STATE_ERROR]);
    const forgedMissingValues: GradePlanRecord = {
      ...complete,
      targets: complete.targets.map((target) => target.targetId === CHEST_ID ? { ...target, deltas: [] } : target),
      status: "reviewed",
      reviewedAt: T3,
      updatedAt: T3,
    };
    expect(errorsOf(approveGradePlan(forgedMissingValues, TARGET_IDS, BINDING, T4))).toEqual([STATE_ERROR]);
    expect(errorsOf(approveGradePlan(reviewed, TARGET_IDS, { ...BINDING, fingerprint: FINGERPRINT_2 }, T4))).toEqual([APPROVE_STALE_ERROR]);
    expect(errorsOf(approveGradePlan(reviewed, TARGET_IDS.slice(0, 2), BINDING, T4))).toEqual([COVERAGE_ISSUE]);
    expect(errorsOf(approveGradePlan({} as GradePlanRecord, TARGET_IDS, BINDING, T4))).toEqual([FIELDS_ERROR]);
  });

  it("rejects approval unless the plan is currently reviewed", () => {
    const { draft, configured, complete, approved } = lifecycle();
    for (const plan of [draft, configured, complete, approved]) {
      expect(errorsOf(approveGradePlan(plan, TARGET_IDS, BINDING, T5))).toEqual([REVIEW_FIRST_ERROR]);
    }
    expect(errorsOf(reviewGradePlan(approved, TARGET_IDS, BINDING, T5)))
      .toEqual(["Save an edit as a draft before reviewing it again."]);
  });
});

describe("grade-plan edits", () => {
  it("resets a reviewed plan to a new draft revision on any value edit without mutating the input", () => {
    const { reviewed } = lifecycle();
    const before = JSON.stringify(reviewed);
    const edited = unwrap(setGradePlanDelta(reviewed, CHEST_ID, "L", 6, T5));
    expect(edited).toMatchObject({
      status: "draft", revision: reviewed.revision + 1, reviewedAt: null, approvedAt: null, createdAt: T0, updatedAt: T5,
    });
    expect(deltasOf(edited, CHEST_ID)).toEqual([
      { sizeLabel: "S", deltaFromBase: -5 },
      { sizeLabel: "M", deltaFromBase: 0 },
      { sizeLabel: "L", deltaFromBase: 6 },
    ]);
    expect(deltasOf(edited, SLEEVE_ID)).toEqual(deltasOf(reviewed, SLEEVE_ID));
    expect(JSON.stringify(reviewed)).toBe(before);
    expect(unwrap(reviewGradePlan(edited, TARGET_IDS, BINDING, T6)).status).toBe("reviewed");
  });

  it("strips approval when a value is cleared and blocks re-approval until re-review", () => {
    const { approved } = lifecycle();
    const cleared = unwrap(setGradePlanDelta(approved, CHEST_ID, "L", null, T5));
    expect(cleared).toMatchObject({ status: "draft", revision: approved.revision + 1, reviewedAt: null, approvedAt: null });
    expect(errorsOf(approveGradePlan(cleared, TARGET_IDS, BINDING, T6))).toEqual([REVIEW_FIRST_ERROR]);
    expect(errorsOf(reviewGradePlan(cleared, TARGET_IDS, BINDING, T6))).toEqual(["Chest girth at L: enter a change from base or document an exception."]);
    expect(approved.status).toBe("approved");
  });

  it("resets approval on reconfiguration, retaining values only for sizes that remain", () => {
    const { approved } = lifecycle();
    const extended = unwrap(configureGradePlan(approved, { ...CONFIG, sizes: [...SIZES, { label: "XL", position: 2 }] }, T5));
    expect(extended).toMatchObject({ status: "draft", revision: approved.revision + 1, reviewedAt: null, approvedAt: null, updatedAt: T5 });
    expect(deltasOf(extended, CHEST_ID)).toEqual([
      { sizeLabel: "S", deltaFromBase: -5 },
      { sizeLabel: "M", deltaFromBase: 0 },
      { sizeLabel: "L", deltaFromBase: 5 },
      { sizeLabel: "XL", deltaFromBase: null },
    ]);
    expect(errorsOf(reviewGradePlan(extended, TARGET_IDS, BINDING, T6))).toEqual([
      "Chest girth at XL: enter a change from base or document an exception.",
      "Sleeve length at XL: enter a change from base or document an exception.",
      "HPS to hem at XL: enter a change from base or document an exception.",
    ]);

    const narrowed = unwrap(configureGradePlan(approved, { ...CONFIG, sizes: SIZES.slice(1) }, T5));
    expect(deltasOf(narrowed, CHEST_ID)).toEqual([
      { sizeLabel: "M", deltaFromBase: 0 },
      { sizeLabel: "L", deltaFromBase: 5 },
    ]);
    expect(unwrap(reviewGradePlan(narrowed, TARGET_IDS, BINDING, T6)).status).toBe("reviewed");

    const rebased = unwrap(configureGradePlan(approved, {
      ...CONFIG,
      baseSizeLabel: "S",
      sizes: [{ label: "S", position: 0 }, { label: "M", position: 1 }, { label: "L", position: 2 }],
    }, T5));
    expect(deltasOf(rebased, CHEST_ID)).toEqual([
      { sizeLabel: "S", deltaFromBase: 0 },
      { sizeLabel: "M", deltaFromBase: null },
      { sizeLabel: "L", deltaFromBase: null },
    ]);
  });

  it("rejects invalid value edits without producing a record or changing the input", () => {
    const { reviewed } = lifecycle();
    const before = JSON.stringify(reviewed);
    expect(errorsOf(setGradePlanDelta(reviewed, CHEST_ID, "L", Number.NaN, T5))).toEqual([DELTA_VALUE_ERROR]);
    expect(errorsOf(setGradePlanDelta(reviewed, CHEST_ID, "L", Number.POSITIVE_INFINITY, T5))).toEqual([DELTA_VALUE_ERROR]);
    expect(errorsOf(setGradePlanDelta(reviewed, "pom.unknown", "L", 5, T5))).toEqual([DELTA_TARGET_ERROR]);
    expect(errorsOf(setGradePlanDelta(reviewed, CHEST_ID, "XL", 5, T5))).toEqual([DELTA_TARGET_ERROR]);
    expect(unwrap(setGradePlanDelta(reviewed, CHEST_ID, "l", 6, T5)).targets[0]?.deltas[2]?.deltaFromBase).toBe(6);
    expect(errorsOf(setGradePlanDelta(reviewed, CHEST_ID, "M", 1, T5))).toEqual([BASE_ZERO_ERROR]);
    expect(errorsOf(setGradePlanDelta(reviewed, CHEST_ID, "M", null, T5))).toEqual([BASE_ZERO_ERROR]);
    const missingRow = { ...reviewed, targets: reviewed.targets.map((target) => target.targetId === CHEST_ID
      ? { ...target, deltas: target.deltas.slice(0, 1) } : target) };
    expect(errorsOf(setGradePlanDelta(missingRow, CHEST_ID, "L", 8, T5)))
      .toEqual(["The selected target has no row for that declared size."]);
    expect(JSON.stringify(reviewed)).toBe(before);
  });

  it("does not special-case same-value edits: they still invalidate review as a new draft revision", () => {
    const { reviewed } = lifecycle();
    for (const [sizeLabel, value] of [["L", 5], ["M", 0]] as const) {
      const same = unwrap(setGradePlanDelta(reviewed, CHEST_ID, sizeLabel, value, T5));
      expect(same.targets).toEqual(reviewed.targets);
      expect(same).toMatchObject({ status: "draft", revision: reviewed.revision + 1, reviewedAt: null });
    }
  });
});

describe("grade-plan base binding", () => {
  const changes: readonly Partial<GradePlanBaseBinding>[] = [
    { projectId: STYLE_ID_2 },
    { styleId: STYLE_ID_2 },
    { recipeId: "polo" },
    { revisionHeadId: HEAD_ID_2 },
    { captureRevision: 4 },
    { fingerprint: FINGERPRINT_2 },
  ];

  it("detects a change to any bound field and blocks review and approval", () => {
    const { configured, complete, reviewed } = lifecycle();
    expect(gradePlanIsStale(reviewed, { ...BINDING })).toBe(false);
    for (const change of changes) {
      const current = { ...BINDING, ...change };
      expect(gradePlanIsStale(reviewed, current)).toBe(true);
      expect(errorsOf(reviewGradePlan(complete, TARGET_IDS, current, T3))).toEqual([REVIEW_STALE_ERROR]);
      expect(errorsOf(reviewGradePlan(configured, TARGET_IDS, current, T3))).toEqual([REVIEW_STALE_ERROR]);
      expect(errorsOf(approveGradePlan(reviewed, TARGET_IDS, current, T4))).toEqual([APPROVE_STALE_ERROR]);
    }
  });
});

describe("copying a grade plan as a draft", () => {
  const newBinding: GradePlanBaseBinding = {
    ...BINDING, styleId: STYLE_ID_2, revisionHeadId: HEAD_ID_2, captureRevision: 1, fingerprint: FINGERPRINT_2,
  };

  it("retains authored rules, rebinds to the new base and strips review and approval", () => {
    const { approved } = lifecycle(POPULATION_BASIS);
    const exception = { targetId: HEM_ID, sizeLabel: "S", reason: "Hem length floor for cropped fits" };
    const unfinished = unwrap(setGradePlanDelta(approved, HEM_ID, "S", null, T5));
    const withException = unwrap(approveGradePlan(unwrap(reviewGradePlan(
      unwrap(configureGradePlan(unfinished, { ...CONFIG, basis: POPULATION_BASIS, exceptions: [exception] }, T5)),
      TARGET_IDS, BINDING, T5,
    )), TARGET_IDS, BINDING, T5));
    const copy = unwrap(copyGradePlanAsDraft(withException, newBinding, TARGETS, T6));
    expect(copy).toEqual({
      ...withException,
      ...newBinding,
      revision: 1,
      status: "draft",
      reviewedAt: null,
      approvedAt: null,
      createdAt: T6,
      updatedAt: T6,
    });
    expect(copy.basis).toEqual(POPULATION_BASIS);
    expect(copy.exceptions).toEqual([exception]);
    expect(withException.status).toBe("approved");
    expect(gradePlanIsStale(copy, newBinding)).toBe(false);
    expect(gradePlanIsStale(copy, BINDING)).toBe(true);
    expect(errorsOf(approveGradePlan(copy, TARGET_IDS, newBinding, T6))).toEqual([REVIEW_FIRST_ERROR]);
    expect(errorsOf(reviewGradePlan(copy, TARGET_IDS, BINDING, T6))).toEqual([REVIEW_STALE_ERROR]);
    const reviewedCopy = unwrap(reviewGradePlan(copy, TARGET_IDS, newBinding, T6));
    expect(unwrap(approveGradePlan(reviewedCopy, TARGET_IDS, newBinding, T6))).toMatchObject({ ...newBinding, status: "approved", revision: 3 });
  });

  it("copies incomplete drafts and rejects invalid target bindings", () => {
    const { configured } = lifecycle();
    const copy = unwrap(copyGradePlanAsDraft(configured, newBinding, TARGETS, T6));
    expect(copy).toMatchObject({ ...newBinding, revision: 1, status: "draft", targets: configured.targets });
    expect(errorsOf(copyGradePlanAsDraft(configured, newBinding, TARGETS.slice(0, 1), T6)))
      .toEqual(["The copied style has a different target catalog; create a new grade plan for its base."]);
    expect(errorsOf(copyGradePlanAsDraft(configured, { ...newBinding, styleId: "style-2" }, TARGETS, T6))).toEqual([IDENTITY_ERROR]);
    expect(errorsOf(copyGradePlanAsDraft(configured, { ...newBinding, fingerprint: "xyz" }, TARGETS, T6))).toEqual([REVISION_ERROR]);
    expect(errorsOf(copyGradePlanAsDraft(configured, newBinding, TARGETS, "2026-09-27T08:06:00Z"))).toEqual([TIMESTAMP_ERROR]);
  });
});

describe("saving an edited grade-plan form", () => {
  it("persists all form changes as one draft revision and clears prior review state", () => {
    const approved = lifecycle().approved;
    const targets = approved.targets.map((target) => ({
      ...target,
      deltas: target.deltas.map((delta) => ({ ...delta, deltaFromBase: delta.sizeLabel === "M" ? 0 : 3 })),
    }));
    const updated = unwrap(updateGradePlanDraft(approved, {
      ...CONFIG,
      basis: USER_BASIS,
      declaredRange: "S to L; reviewed digital range",
      targets,
    }, T6));
    expect(updated.revision).toBe(approved.revision + 1);
    expect(updated.status).toBe("draft");
    expect(updated.reviewedAt).toBeNull();
    expect(updated.approvedAt).toBeNull();
    expect(updated.targets).toEqual(targets);
    expect(updated.updatedAt).toBe(T6);
  });

  it("rejects malformed targets and non-monotonic timestamps", () => {
    const approved = lifecycle().approved;
    expect(errorsOf(updateGradePlanDraft(approved, {
      ...CONFIG,
      targets: [{ ...approved.targets[0]!, unit: "" }],
    }, T6))).toEqual(["Target 1 is malformed."]);
    expect(errorsOf(updateGradePlanDraft(approved, {
      ...CONFIG,
      targets: approved.targets,
    }, T3))).toEqual(["A grade-plan edit must use a canonical timestamp no earlier than its latest revision."]);
  });
});
