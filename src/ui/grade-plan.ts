/** Strict local record and review lifecycle for user-authored grade plans.
 * This module does not generate graded geometry or enable any export. */

export const GRADE_PLAN_RECORD_VERSION = 1;
export type GradePlanStatus = "draft" | "reviewed" | "approved";
export type GradePlanTargetKind = "measurement" | "option" | "pom";

export type GradePlanBasis =
  | {
      readonly kind: "population-source";
      readonly population: string;
      readonly sourceName: string;
      readonly sourceVersion: string;
      readonly sourceScope: string;
    }
  | {
      readonly kind: "user-authored-digital-rule";
      readonly decision: string;
      readonly digitalRange: string;
    };

export interface GradePlanSize {
  readonly label: string;
  /** User-declared order relative to the base; exactly one size is at zero. */
  readonly position: number;
}

export interface GradePlanSizeDelta {
  readonly sizeLabel: string;
  /** Explicit value change from the base. Null means unfinished draft input. */
  readonly deltaFromBase: number | null;
}

export interface GradePlanTarget {
  readonly targetId: string;
  readonly kind: GradePlanTargetKind;
  readonly label: string;
  readonly unit: string;
  readonly baseValue: number;
  readonly deltas: readonly GradePlanSizeDelta[];
}

export interface GradePlanException {
  readonly targetId: string;
  readonly sizeLabel: string;
  readonly reason: string;
}

/** A plan is tied to the exact project/style, immutable design head, capture
 * session revision, and caller-computed recipe-input fingerprint. */
export interface GradePlanBaseBinding {
  readonly projectId: string;
  readonly styleId: string;
  readonly recipeId: string;
  readonly revisionHeadId: string;
  readonly captureRevision: number;
  readonly fingerprint: string;
}

export interface GradePlanRecord extends GradePlanBaseBinding {
  readonly schemaVersion: typeof GRADE_PLAN_RECORD_VERSION;
  readonly revision: number;
  readonly basis: GradePlanBasis | null;
  readonly declaredRange: string;
  readonly baseSizeLabel: string | null;
  readonly sizes: readonly GradePlanSize[];
  readonly targets: readonly GradePlanTarget[];
  readonly exceptions: readonly GradePlanException[];
  readonly status: GradePlanStatus;
  readonly reviewedAt: string | null;
  readonly approvedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type GradePlanResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly string[] };

const PLAN_KEYS = [
  "schemaVersion", "projectId", "styleId", "recipeId", "revisionHeadId", "captureRevision", "fingerprint",
  "revision", "basis", "declaredRange", "baseSizeLabel", "sizes", "targets", "exceptions", "status",
  "reviewedAt", "approvedAt", "createdAt", "updatedAt",
];
const SIZE_KEYS = ["label", "position"];
const TARGET_KEYS = ["targetId", "kind", "label", "unit", "baseValue", "deltas"];
const DELTA_KEYS = ["sizeLabel", "deltaFromBase"];
const EXCEPTION_KEYS = ["targetId", "sizeLabel", "reason"];
const POPULATION_BASIS_KEYS = ["kind", "population", "sourceName", "sourceVersion", "sourceScope"];
const USER_BASIS_KEYS = ["kind", "decision", "digitalRange"];
const STATUS_SET = new Set<GradePlanStatus>(["draft", "reviewed", "approved"]);
const TARGET_KIND_SET = new Set<GradePlanTargetKind>(["measurement", "option", "pom"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const labelKey = (value: string): string => value.toLocaleLowerCase("en-US");

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && actual.every((key, index) => key === [...keys].sort()[index]);
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function text(value: unknown, max = 240): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim() === value && value.length <= max;
}

function sizeList(value: unknown): GradePlanResult<readonly GradePlanSize[]> {
  if (!Array.isArray(value) || value.length > 32) return { ok: false, errors: ["Sizes must be an array with at most 32 entries."] };
  const sizes: GradePlanSize[] = [];
  const labels = new Set<string>();
  const positions = new Set<number>();
  let previousPosition: number | null = null;
  for (const [index, item] of value.entries()) {
    if (!object(item) || !exactKeys(item, SIZE_KEYS) || !text(item.label, 48)
      || typeof item.position !== "number" || !Number.isSafeInteger(item.position) || Math.abs(item.position) > 100) {
      return { ok: false, errors: [`Size ${index + 1} is malformed.`] };
    }
    const normalizedLabel = labelKey(item.label);
    if (labels.has(normalizedLabel)) return { ok: false, errors: [`Size label “${item.label}” is duplicated.`] };
    if (positions.has(item.position)) return { ok: false, errors: [`Size position ${item.position} is duplicated.`] };
    if (previousPosition !== null && item.position <= previousPosition) {
      return { ok: false, errors: ["Sizes must be listed in increasing position order."] };
    }
    labels.add(normalizedLabel);
    positions.add(item.position);
    previousPosition = item.position;
    sizes.push({ label: item.label, position: item.position });
  }
  return { ok: true, value: sizes };
}

function parseBasis(value: unknown): GradePlanResult<GradePlanBasis | null> {
  if (value === null) return { ok: true, value: null };
  if (!object(value)) return { ok: false, errors: ["Grade-plan basis is malformed."] };
  if (value.kind === "population-source") {
    if (!exactKeys(value, POPULATION_BASIS_KEYS) || !text(value.population)
      || !text(value.sourceName) || !text(value.sourceVersion) || !text(value.sourceScope)) {
      return { ok: false, errors: ["Population/source basis requires its population, named source, version and scope."] };
    }
    return { ok: true, value: {
      kind: "population-source", population: value.population, sourceName: value.sourceName,
      sourceVersion: value.sourceVersion, sourceScope: value.sourceScope,
    } };
  }
  if (value.kind === "user-authored-digital-rule") {
    if (!exactKeys(value, USER_BASIS_KEYS) || !text(value.decision) || !text(value.digitalRange)) {
      return { ok: false, errors: ["User-authored basis requires a decision and declared digital range."] };
    }
    return { ok: true, value: {
      kind: "user-authored-digital-rule", decision: value.decision, digitalRange: value.digitalRange,
    } };
  }
  return { ok: false, errors: ["Grade-plan basis kind is unsupported."] };
}

function targetList(value: unknown): GradePlanResult<readonly GradePlanTarget[]> {
  if (!Array.isArray(value) || value.length > 128) return { ok: false, errors: ["Targets must be an array with at most 128 entries."] };
  const targets: GradePlanTarget[] = [];
  const ids = new Set<string>();
  for (const [index, item] of value.entries()) {
    if (!object(item) || !exactKeys(item, TARGET_KEYS) || !text(item.targetId, 100)
      || !TARGET_KIND_SET.has(item.kind as GradePlanTargetKind) || !text(item.label, 100)
      || !text(item.unit, 24) || typeof item.baseValue !== "number" || !Number.isFinite(item.baseValue)
      || !Array.isArray(item.deltas) || item.deltas.length > 32) {
      return { ok: false, errors: [`Target ${index + 1} is malformed.`] };
    }
    if (ids.has(item.targetId)) return { ok: false, errors: [`Target ${item.targetId} is duplicated.`] };
    ids.add(item.targetId);
    const deltas: GradePlanSizeDelta[] = [];
    const deltaLabels = new Set<string>();
    for (const [deltaIndex, rawDelta] of item.deltas.entries()) {
      if (!object(rawDelta) || !exactKeys(rawDelta, DELTA_KEYS) || !text(rawDelta.sizeLabel, 48)
        || (rawDelta.deltaFromBase !== null
          && (typeof rawDelta.deltaFromBase !== "number" || !Number.isFinite(rawDelta.deltaFromBase)))) {
        return { ok: false, errors: [`Target ${item.targetId} size value ${deltaIndex + 1} is malformed.`] };
      }
      if (deltaLabels.has(labelKey(rawDelta.sizeLabel))) {
        return { ok: false, errors: [`Target ${item.targetId} has duplicate size values.`] };
      }
      deltaLabels.add(labelKey(rawDelta.sizeLabel));
      deltas.push({ sizeLabel: rawDelta.sizeLabel, deltaFromBase: rawDelta.deltaFromBase });
    }
    targets.push({
      targetId: item.targetId, kind: item.kind as GradePlanTargetKind, label: item.label,
      unit: item.unit, baseValue: item.baseValue, deltas,
    });
  }
  return { ok: true, value: targets };
}

function exceptionList(value: unknown): GradePlanResult<readonly GradePlanException[]> {
  if (!Array.isArray(value) || value.length > 256) return { ok: false, errors: ["Exceptions must be an array with at most 256 entries."] };
  const exceptions: GradePlanException[] = [];
  const keys = new Set<string>();
  for (const [index, item] of value.entries()) {
    if (!object(item) || !exactKeys(item, EXCEPTION_KEYS) || !text(item.targetId, 100)
      || !text(item.sizeLabel, 48) || !text(item.reason)) {
      return { ok: false, errors: [`Exception ${index + 1} is malformed.`] };
    }
    const key = `${item.targetId}\u0000${labelKey(item.sizeLabel)}`;
    if (keys.has(key)) return { ok: false, errors: [`Exception for ${item.targetId} at ${item.sizeLabel} is duplicated.`] };
    keys.add(key);
    exceptions.push({ targetId: item.targetId, sizeLabel: item.sizeLabel, reason: item.reason });
  }
  return { ok: true, value: exceptions };
}

/** Issues that prevent a draft from entering review or approval. */
export function gradePlanCompletionIssues(
  plan: Pick<GradePlanRecord, "basis" | "declaredRange" | "baseSizeLabel" | "sizes" | "targets" | "exceptions">,
  expectedTargetIds?: readonly string[],
): readonly string[] {
  const issues: string[] = [];
  if (!plan.basis) issues.push("Choose a named population/source or an explicit user-authored digital rule.");
  if (!text(plan.declaredRange)) issues.push("Describe the declared size range and unsupported edge cases.");
  if (!text(plan.baseSizeLabel, 48)) issues.push("Name the plan’s base size.");
  if (plan.sizes.length < 2) issues.push("A grade plan needs at least two explicitly named sizes.");
  const baseRows = plan.sizes.filter((size) => size.position === 0);
  if (baseRows.length !== 1 || labelKey(baseRows[0]!.label) !== labelKey(plan.baseSizeLabel ?? "")) {
    issues.push("The base size must appear exactly once at position zero.");
  }
  const labels = plan.sizes.map((size) => size.label);
  const labelSet = new Set(labels.map(labelKey));
  if (expectedTargetIds) {
    const expected = [...expectedTargetIds].sort();
    const actual = plan.targets.map((target) => target.targetId).sort();
    if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
      issues.push("Every current recipe measurement, control and POM must have exactly one explicit target.");
    }
  }
  for (const target of plan.targets) {
    if (target.deltas.length !== labels.length || target.deltas.some((delta, index) => labelKey(delta.sizeLabel) !== labelKey(labels[index]!))) {
      issues.push(`${target.label}: add an explicit value for every declared size in size order.`);
      continue;
    }
    for (const delta of target.deltas) {
      const exception = plan.exceptions.find((entry) => entry.targetId === target.targetId && labelKey(entry.sizeLabel) === labelKey(delta.sizeLabel));
      if (delta.deltaFromBase === null && !exception) {
        issues.push(`${target.label} at ${delta.sizeLabel}: enter a change from base or document an exception.`);
      } else if (delta.deltaFromBase !== null && exception) {
        issues.push(`${target.label} at ${delta.sizeLabel}: resolve the value or exception, not both.`);
      } else if (labelKey(delta.sizeLabel) === labelKey(plan.baseSizeLabel ?? "") && delta.deltaFromBase !== 0) {
        issues.push(`${target.label} at the base size must have a zero change.`);
      }
    }
  }
  for (const exception of plan.exceptions) {
    const target = plan.targets.find((candidate) => candidate.targetId === exception.targetId);
    const row = target?.deltas.find((delta) => labelKey(delta.sizeLabel) === labelKey(exception.sizeLabel));
    if (!target || !labelSet.has(labelKey(exception.sizeLabel)) || !row) {
      issues.push(`Exception ${exception.targetId} at ${exception.sizeLabel} must identify a declared target and size.`);
    } else if (labelKey(exception.sizeLabel) === labelKey(plan.baseSizeLabel ?? "")) {
      issues.push(`Exception ${exception.targetId} cannot replace the base-size value.`);
    } else if (row.deltaFromBase !== null) {
      issues.push(`Exception ${exception.targetId} at ${exception.sizeLabel} must leave its value unfinished.`);
    }
  }
  return [...new Set(issues)];
}

function stateConsistent(plan: GradePlanRecord): boolean {
  if (plan.status === "draft") return plan.reviewedAt === null && plan.approvedAt === null;
  if (gradePlanCompletionIssues(plan).length > 0 || plan.reviewedAt === null) return false;
  return plan.status === "reviewed" ? plan.approvedAt === null : plan.approvedAt !== null;
}

export function parseGradePlanRecord(value: unknown): GradePlanResult<GradePlanRecord> {
  if (!object(value) || !exactKeys(value, PLAN_KEYS)) return { ok: false, errors: ["Grade-plan record fields are incomplete or unknown."] };
  if (value.schemaVersion !== GRADE_PLAN_RECORD_VERSION) return { ok: false, errors: ["Unsupported grade-plan record version."] };
  if (typeof value.projectId !== "string" || !UUID.test(value.projectId)
    || typeof value.styleId !== "string" || !UUID.test(value.styleId)
    || typeof value.revisionHeadId !== "string" || !UUID.test(value.revisionHeadId)
    || typeof value.recipeId !== "string" || !/^[a-z][a-z0-9-]{1,40}$/.test(value.recipeId)) {
    return { ok: false, errors: ["Grade-plan project, style, recipe or base revision identity is invalid."] };
  }
  if (!Number.isSafeInteger(value.revision) || (value.revision as number) < 1
    || !Number.isSafeInteger(value.captureRevision) || (value.captureRevision as number) < 1
    || typeof value.fingerprint !== "string" || !SHA256.test(value.fingerprint)) {
    return { ok: false, errors: ["Grade-plan revisions or base fingerprint are invalid."] };
  }
  if (typeof value.declaredRange !== "string" || value.declaredRange.length > 240
    || (value.baseSizeLabel !== null && !text(value.baseSizeLabel, 48))) {
    return { ok: false, errors: ["Grade-plan range or base label is malformed."] };
  }
  const basis = parseBasis(value.basis);
  if (!basis.ok) return basis;
  const sizes = sizeList(value.sizes);
  if (!sizes.ok) return sizes;
  const targets = targetList(value.targets);
  if (!targets.ok) return targets;
  const exceptions = exceptionList(value.exceptions);
  if (!exceptions.ok) return exceptions;
  if (!STATUS_SET.has(value.status as GradePlanStatus)
    || (value.reviewedAt !== null && !canonicalTimestamp(value.reviewedAt))
    || (value.approvedAt !== null && !canonicalTimestamp(value.approvedAt))
    || !canonicalTimestamp(value.createdAt) || !canonicalTimestamp(value.updatedAt)
    || Date.parse(value.updatedAt as string) < Date.parse(value.createdAt as string)) {
    return { ok: false, errors: ["Grade-plan status or timestamps are invalid."] };
  }
  if ((value.reviewedAt !== null && Date.parse(value.reviewedAt as string) < Date.parse(value.createdAt as string))
    || (value.status === "reviewed" && value.reviewedAt !== value.updatedAt)
    || (value.approvedAt !== null && (value.reviewedAt === null
      || Date.parse(value.approvedAt as string) < Date.parse(value.reviewedAt as string)
      || value.approvedAt !== value.updatedAt))) {
    return { ok: false, errors: ["Grade-plan review and approval timestamps do not match its latest revision."] };
  }
  const plan: GradePlanRecord = {
    schemaVersion: GRADE_PLAN_RECORD_VERSION,
    projectId: value.projectId, styleId: value.styleId, recipeId: value.recipeId,
    revisionHeadId: value.revisionHeadId, captureRevision: value.captureRevision as number,
    fingerprint: value.fingerprint, revision: value.revision as number,
    basis: basis.value, declaredRange: value.declaredRange, baseSizeLabel: value.baseSizeLabel as string | null,
    sizes: sizes.value, targets: targets.value, exceptions: exceptions.value,
    status: value.status as GradePlanStatus, reviewedAt: value.reviewedAt as string | null,
    approvedAt: value.approvedAt as string | null, createdAt: value.createdAt, updatedAt: value.updatedAt,
  };
  if (!stateConsistent(plan)) return { ok: false, errors: ["Grade-plan review state does not match its content."] };
  return { ok: true, value: plan };
}

export function createGradePlanDraft(
  binding: GradePlanBaseBinding,
  targets: readonly Omit<GradePlanTarget, "deltas">[],
  at: string,
): GradePlanResult<GradePlanRecord> {
  const initial = parseGradePlanRecord({
    schemaVersion: GRADE_PLAN_RECORD_VERSION,
    ...binding,
    revision: 1,
    basis: null,
    declaredRange: "",
    baseSizeLabel: null,
    sizes: [],
    targets: targets.map((target) => ({ ...target, deltas: [] })),
    exceptions: [],
    status: "draft",
    reviewedAt: null,
    approvedAt: null,
    createdAt: at,
    updatedAt: at,
  });
  return initial;
}

function resetReview(plan: GradePlanRecord, updatedAt: string, patch: Partial<GradePlanRecord>): GradePlanResult<GradePlanRecord> {
  if (!canonicalTimestamp(updatedAt) || Date.parse(updatedAt) < Date.parse(plan.updatedAt)) {
    return { ok: false, errors: ["A grade-plan edit must use a canonical timestamp no earlier than its latest revision."] };
  }
  return parseGradePlanRecord({
    ...plan,
    ...patch,
    revision: plan.revision + 1,
    status: "draft",
    reviewedAt: null,
    approvedAt: null,
    updatedAt,
  });
}

export function configureGradePlan(
  plan: GradePlanRecord,
  update: {
    readonly basis: GradePlanBasis | null;
    readonly declaredRange: string;
    readonly baseSizeLabel: string | null;
    readonly sizes: readonly GradePlanSize[];
    readonly exceptions: readonly GradePlanException[];
  },
  updatedAt: string,
): GradePlanResult<GradePlanRecord> {
  const labels = update.sizes.map((size) => size.label);
  const baseChanged = labelKey(plan.baseSizeLabel ?? "") !== labelKey(update.baseSizeLabel ?? "");
  const byTarget = plan.targets.map((target) => ({
    ...target,
    deltas: labels.map((sizeLabel) => ({
      sizeLabel,
      deltaFromBase: labelKey(sizeLabel) === labelKey(update.baseSizeLabel ?? "") ? 0
        : baseChanged ? null
          : target.deltas.find((delta) => labelKey(delta.sizeLabel) === labelKey(sizeLabel))?.deltaFromBase ?? null,
    })),
  }));
  return resetReview(plan, updatedAt, {
    basis: update.basis,
    declaredRange: update.declaredRange,
    baseSizeLabel: update.baseSizeLabel,
    sizes: update.sizes,
    targets: byTarget,
    exceptions: update.exceptions,
  });
}

/** Applies the complete editor form as one persisted revision. */
export function updateGradePlanDraft(
  plan: GradePlanRecord,
  update: {
    readonly basis: GradePlanBasis | null;
    readonly declaredRange: string;
    readonly baseSizeLabel: string | null;
    readonly sizes: readonly GradePlanSize[];
    readonly targets: readonly GradePlanTarget[];
    readonly exceptions: readonly GradePlanException[];
  },
  updatedAt: string,
): GradePlanResult<GradePlanRecord> {
  return resetReview(plan, updatedAt, {
    basis: update.basis,
    declaredRange: update.declaredRange,
    baseSizeLabel: update.baseSizeLabel,
    sizes: update.sizes,
    targets: update.targets,
    exceptions: update.exceptions,
  });
}

export function setGradePlanDelta(
  plan: GradePlanRecord,
  targetId: string,
  sizeLabel: string,
  deltaFromBase: number | null,
  updatedAt: string,
): GradePlanResult<GradePlanRecord> {
  if (deltaFromBase !== null && !Number.isFinite(deltaFromBase)) {
    return { ok: false, errors: ["A grade-plan change must be a finite number or an unfinished value."] };
  }
  const target = plan.targets.find((candidate) => candidate.targetId === targetId);
  const size = plan.sizes.find((candidate) => labelKey(candidate.label) === labelKey(sizeLabel));
  if (!target || !size) {
    return { ok: false, errors: ["Choose a declared grade-plan target and size."] };
  }
  const existingDelta = target.deltas.find((entry) => labelKey(entry.sizeLabel) === labelKey(size.label));
  if (!existingDelta) return { ok: false, errors: ["The selected target has no row for that declared size."] };
  if (labelKey(size.label) === labelKey(plan.baseSizeLabel ?? "") && deltaFromBase !== 0) {
    return { ok: false, errors: ["The base size must remain at zero change."] };
  }
  return resetReview(plan, updatedAt, {
    exceptions: plan.exceptions.filter((entry) => entry.targetId !== targetId || labelKey(entry.sizeLabel) !== labelKey(size.label)
      || deltaFromBase === null),
    targets: plan.targets.map((candidate) => candidate.targetId !== targetId ? candidate : {
      ...candidate,
      deltas: candidate.deltas.map((entry) => labelKey(entry.sizeLabel) === labelKey(size.label) ? { ...entry, deltaFromBase } : entry),
    }),
  });
}

export function reviewGradePlan(
  plan: GradePlanRecord,
  expectedTargetIds: readonly string[],
  currentBinding: GradePlanBaseBinding,
  at: string,
): GradePlanResult<GradePlanRecord> {
  const parsed = parseGradePlanRecord(plan);
  if (!parsed.ok) return parsed;
  plan = parsed.value;
  if (plan.status !== "draft") return { ok: false, errors: ["Save an edit as a draft before reviewing it again."] };
  if (gradePlanIsStale(plan, currentBinding)) return { ok: false, errors: ["The base design changed; refresh the grade-plan base before review."] };
  if (!canonicalTimestamp(at) || Date.parse(at) < Date.parse(plan.updatedAt)) {
    return { ok: false, errors: ["Review must be recorded at or after the latest grade-plan edit."] };
  }
  const issues = gradePlanCompletionIssues(plan, expectedTargetIds);
  if (issues.length > 0) return { ok: false, errors: issues };
  return parseGradePlanRecord({ ...plan, revision: plan.revision + 1, status: "reviewed", reviewedAt: at, approvedAt: null, updatedAt: at });
}

export function approveGradePlan(
  plan: GradePlanRecord,
  expectedTargetIds: readonly string[],
  currentBinding: GradePlanBaseBinding,
  at: string,
): GradePlanResult<GradePlanRecord> {
  const parsed = parseGradePlanRecord(plan);
  if (!parsed.ok) return parsed;
  plan = parsed.value;
  if (plan.status !== "reviewed") return { ok: false, errors: ["Review the complete plan before approval."] };
  if (gradePlanIsStale(plan, currentBinding)) return { ok: false, errors: ["The base design changed after review; review the plan again."] };
  if (!canonicalTimestamp(at) || Date.parse(at) < Date.parse(plan.updatedAt)) {
    return { ok: false, errors: ["Approval must be recorded at or after the latest grade-plan review."] };
  }
  const issues = gradePlanCompletionIssues(plan, expectedTargetIds);
  if (issues.length > 0) return { ok: false, errors: issues };
  return parseGradePlanRecord({ ...plan, revision: plan.revision + 1, status: "approved", approvedAt: at, updatedAt: at });
}

export function gradePlanIsStale(plan: GradePlanRecord, current: GradePlanBaseBinding): boolean {
  return plan.projectId !== current.projectId || plan.styleId !== current.styleId || plan.recipeId !== current.recipeId
    || plan.revisionHeadId !== current.revisionHeadId || plan.captureRevision !== current.captureRevision
    || plan.fingerprint !== current.fingerprint;
}

/** Copying a style retains authored rules but always strips the approval. */
export function copyGradePlanAsDraft(
  plan: GradePlanRecord,
  binding: GradePlanBaseBinding,
  currentTargets: readonly Omit<GradePlanTarget, "deltas">[],
  updatedAt: string,
): GradePlanResult<GradePlanRecord> {
  const current = new Map(currentTargets.map((target) => [target.targetId, target]));
  if (current.size !== plan.targets.length || plan.targets.some((target) => {
    const replacement = current.get(target.targetId);
    return !replacement || replacement.kind !== target.kind || replacement.unit !== target.unit;
  })) {
    return { ok: false, errors: ["The copied style has a different target catalog; create a new grade plan for its base."] };
  }
  return parseGradePlanRecord({
    ...plan,
    ...binding,
    targets: plan.targets.map((target) => ({ ...target, baseValue: current.get(target.targetId)!.baseValue })),
    revision: 1,
    status: "draft",
    reviewedAt: null,
    approvedAt: null,
    createdAt: updatedAt,
    updatedAt,
  });
}
