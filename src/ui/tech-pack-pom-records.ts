/** Strict, source-aware contract for T02 points of measure.
 * Revision binding, sample/QA persistence, editing and output are later slices. */
import type { RecordResult } from "./project-records";

export const TECH_PACK_POM_RECORD_VERSION = 1;
export const TECH_PACK_POM_MAX_DEFINITIONS = 500;
export const TECH_PACK_POM_MAX_LANDMARKS = 20;
export const TECH_PACK_POM_MAX_SIZE_IDS = 100;
export const TECH_PACK_POM_MAX_CONFLICT_SOURCES = 8;

export const TECH_PACK_POM_RECIPE_IDS = Object.freeze([
  "tee",
  "fitted",
  "tank",
  "polo",
  "woven-shirt",
  "skirt",
  "trouser",
  "shorts",
  "crewneck",
  "jogger",
  "hoodie",
] as const);

export const TECH_PACK_POM_UNITS = Object.freeze(["cm", "mm", "in"] as const);
export const TECH_PACK_POM_METHOD_KINDS = Object.freeze([
  "STRAIGHT_LINE",
  "EDGE_LENGTH",
  "CLOSED_GIRTH",
  "OTHER",
] as const);

export type TechPackPomRecipeId = typeof TECH_PACK_POM_RECIPE_IDS[number];
export type TechPackPomUnit = typeof TECH_PACK_POM_UNITS[number];
export type TechPackPomMethodKind = typeof TECH_PACK_POM_METHOD_KINDS[number];

export interface TechPackPomSourceReference {
  readonly uri: string;
  readonly title: string;
  readonly locator: string;
}

export type TechPackPomSourcedValue<T> =
  | {
      readonly status: "SOURCE_CONFIRMED";
      readonly value: T;
      readonly source: TechPackPomSourceReference;
    }
  | {
      readonly status: "UNRESOLVED";
      readonly value: null;
      readonly unresolvedReason: string;
      readonly nextAction: string;
    }
  | {
      readonly status: "CONFLICT";
      readonly value: null;
      readonly sourceRefs: readonly TechPackPomSourceReference[];
      readonly unresolvedReason: string;
      readonly nextAction: string;
    };

export interface TechPackPomMethod {
  readonly kind: TechPackPomMethodKind;
  readonly instructions: string;
}

export interface TechPackPomLandmark {
  readonly id: string;
  readonly label: string;
}

export interface TechPackPomTolerance {
  /** Signed lower deviation from the spec value; must be zero or negative. */
  readonly lowerDelta: number;
  /** Signed upper deviation from the spec value; must be zero or positive. */
  readonly upperDelta: number;
}

export interface TechPackPomSizeRangeSource {
  readonly rangeLabel: string;
  readonly sizeIds: readonly string[];
  readonly baseSizeId: string;
}

export interface TechPackPomGradeRuleSource {
  readonly ruleId: string;
  readonly version: string;
}

export interface TechPackPomDefinition {
  /** Stable lowercase key that is independent of the editable display label. */
  readonly id: string;
  readonly label: string;
  readonly method: TechPackPomSourcedValue<TechPackPomMethod>;
  readonly landmarks: TechPackPomSourcedValue<readonly TechPackPomLandmark[]>;
  readonly unit: TechPackPomUnit;
  /** Bounds are deltas in `unit`, not inclusive measurement values. */
  readonly tolerance: TechPackPomSourcedValue<TechPackPomTolerance>;
  readonly sizeRangeSource: TechPackPomSourcedValue<TechPackPomSizeRangeSource>;
  readonly gradeRuleSource: TechPackPomSourcedValue<TechPackPomGradeRuleSource>;
}

/** Recipe-scoped template definitions; no style revision or sample actuals. */
export interface TechPackPomDefinitionSet {
  readonly schemaVersion: typeof TECH_PACK_POM_RECORD_VERSION;
  readonly recipeId: TechPackPomRecipeId;
  readonly definitions: readonly TechPackPomDefinition[];
}

const RECIPE_IDS = new Set<string>(TECH_PACK_POM_RECIPE_IDS);
const UNIT_IDS = new Set<string>(TECH_PACK_POM_UNITS);
const METHOD_KINDS = new Set<string>(TECH_PACK_POM_METHOD_KINDS);
const SOURCE_STATUSES = new Set(["SOURCE_CONFIRMED", "UNRESOLVED", "CONFLICT"]);
const DEFINITION_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const LANDMARK_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
const MAX_TEXT = 512;

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  if (actual.length !== keys.length) return false;
  return keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function text(value: unknown, maxLength = MAX_TEXT): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function stableId(value: unknown, pattern: RegExp): value is string {
  return typeof value === "string" && pattern.test(value);
}

function portableSourceUri(value: string): boolean {
  if (value.startsWith("https://")) {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }
  if (value.startsWith("/") || value.includes("\\") || /^[a-z]:/i.test(value)) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.split("/").includes("..")) return false;
  return true;
}

function parseSourceReference(value: unknown): RecordResult<TechPackPomSourceReference> {
  if (!isRecord(value) || !exactKeys(value, ["uri", "title", "locator"])) {
    return fail("POM source must contain exactly uri, title, and locator.");
  }
  if (!text(value.uri, MAX_TEXT) || !portableSourceUri(value.uri)) {
    return fail("POM source URI must be portable (HTTPS or a repository-relative reference), not a machine path.");
  }
  if (!text(value.title, 240)) return fail("POM source title must be non-empty text of at most 240 characters.");
  if (!text(value.locator, 240)) return fail("POM source locator must name a page, section, table, or stable location.");
  return { ok: true, value: { uri: value.uri, title: value.title, locator: value.locator } };
}

function parseConflictSources(value: unknown): RecordResult<readonly TechPackPomSourceReference[]> {
  if (!Array.isArray(value)) return fail("Conflicting POM evidence requires a source-reference list.");
  if (value.length < 2) return fail("Conflicting POM evidence requires at least two sources.");
  if (value.length > TECH_PACK_POM_MAX_CONFLICT_SOURCES) return fail("Conflicting POM evidence exceeds the source limit.");
  const sources: TechPackPomSourceReference[] = [];
  const keys = new Set<string>();
  for (const raw of value) {
    const parsed = parseSourceReference(raw);
    if (!parsed.ok) return parsed;
    const key = `${parsed.value.uri}#${parsed.value.locator}`;
    if (keys.has(key)) return fail("Conflicting POM source references must be unique.");
    keys.add(key);
    sources.push(parsed.value);
  }
  return { ok: true, value: sources };
}

function parseSourcedValue<T>(
  value: unknown,
  parseValue: (candidate: unknown) => RecordResult<T>,
): RecordResult<TechPackPomSourcedValue<T>> {
  if (!isRecord(value) || typeof value.status !== "string" || !SOURCE_STATUSES.has(value.status)) {
    return fail("POM fact must explicitly be source-confirmed, unresolved, or conflicting.");
  }
  if (value.status === "SOURCE_CONFIRMED") {
    if (!exactKeys(value, ["status", "value", "source"])) return fail("Source-confirmed POM fact has missing or unknown fields.");
    const source = parseSourceReference(value.source);
    if (!source.ok) return source;
    const parsed = parseValue(value.value);
    if (!parsed.ok) return parsed;
    return { ok: true, value: { status: "SOURCE_CONFIRMED", value: parsed.value, source: source.value } };
  }
  if (value.status === "UNRESOLVED") {
    if (!exactKeys(value, ["status", "value", "unresolvedReason", "nextAction"])) {
      return fail("Unresolved POM fact has missing or unknown fields.");
    }
    if (value.value !== null) return fail("Unresolved POM facts cannot carry an assumed value.");
    if (!text(value.unresolvedReason)) return fail("Unresolved POM fact requires a reason.");
    if (!text(value.nextAction)) return fail("Unresolved POM fact requires an actionable next step.");
    return {
      ok: true,
      value: {
        status: "UNRESOLVED",
        value: null,
        unresolvedReason: value.unresolvedReason,
        nextAction: value.nextAction,
      },
    };
  }
  if (!exactKeys(value, ["status", "value", "sourceRefs", "unresolvedReason", "nextAction"])) {
    return fail("Conflicting POM fact has missing or unknown fields.");
  }
  if (value.value !== null) return fail("Conflicting POM facts cannot present one source as the accepted value.");
  const sources = parseConflictSources(value.sourceRefs);
  if (!sources.ok) return sources;
  if (!text(value.unresolvedReason)) return fail("Conflicting POM fact requires a reason.");
  if (!text(value.nextAction)) return fail("Conflicting POM fact requires an actionable resolution step.");
  return {
    ok: true,
    value: {
      status: "CONFLICT",
      value: null,
      sourceRefs: sources.value,
      unresolvedReason: value.unresolvedReason,
      nextAction: value.nextAction,
    },
  };
}

function parseMethod(value: unknown): RecordResult<TechPackPomMethod> {
  if (!isRecord(value) || !exactKeys(value, ["kind", "instructions"])) {
    return fail("POM method must contain exactly kind and instructions.");
  }
  if (typeof value.kind !== "string" || !METHOD_KINDS.has(value.kind)) return fail("POM measurement method is unsupported.");
  if (!text(value.instructions)) return fail("POM method instructions must be explicit.");
  return { ok: true, value: { kind: value.kind as TechPackPomMethodKind, instructions: value.instructions } };
}

function parseLandmarks(value: unknown): RecordResult<readonly TechPackPomLandmark[]> {
  if (!Array.isArray(value)) return fail("POM landmarks must be a list.");
  if (value.length === 0) return fail("A sourced POM requires at least one measurement landmark.");
  if (value.length > TECH_PACK_POM_MAX_LANDMARKS) return fail("POM landmark list exceeds its supported limit.");
  const landmarks: TechPackPomLandmark[] = [];
  const ids = new Set<string>();
  for (const raw of value) {
    if (!isRecord(raw) || !exactKeys(raw, ["id", "label"])) return fail("Each POM landmark must contain exactly id and label.");
    if (!stableId(raw.id, LANDMARK_ID)) return fail("POM landmark ID must be a stable lowercase key.");
    if (ids.has(raw.id)) return fail("POM landmark IDs must be unique within a definition.");
    if (!text(raw.label, 160)) return fail("POM landmark label must be non-empty text of at most 160 characters.");
    ids.add(raw.id);
    landmarks.push({ id: raw.id, label: raw.label });
  }
  return { ok: true, value: landmarks };
}

function parseTolerance(value: unknown): RecordResult<TechPackPomTolerance> {
  if (!isRecord(value) || !exactKeys(value, ["lowerDelta", "upperDelta"])) {
    return fail("POM tolerance must contain exactly lowerDelta and upperDelta.");
  }
  if (typeof value.lowerDelta !== "number" || !Number.isFinite(value.lowerDelta)) return fail("Lower tolerance delta must be finite.");
  if (typeof value.upperDelta !== "number" || !Number.isFinite(value.upperDelta)) return fail("Upper tolerance delta must be finite.");
  if (value.lowerDelta > 0) return fail("Lower tolerance delta must be zero or negative.");
  if (value.upperDelta < 0) return fail("Upper tolerance delta must be zero or positive.");
  return { ok: true, value: { lowerDelta: value.lowerDelta, upperDelta: value.upperDelta } };
}

function uniqueTexts(value: unknown, maxItems: number): value is readonly string[] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0 || value.length > maxItems) return false;
  const values = new Set<string>();
  for (const entry of value) {
    if (!text(entry, 120)) return false;
    if (values.has(entry)) return false;
    values.add(entry);
  }
  return true;
}

function parseSizeRangeSource(value: unknown): RecordResult<TechPackPomSizeRangeSource> {
  if (!isRecord(value) || !exactKeys(value, ["rangeLabel", "sizeIds", "baseSizeId"])) {
    return fail("Size-range source value must contain exactly rangeLabel, sizeIds, and baseSizeId.");
  }
  if (!text(value.rangeLabel, 120)) return fail("Size-range source needs a name or source label.");
  if (!uniqueTexts(value.sizeIds, TECH_PACK_POM_MAX_SIZE_IDS)) return fail("Size-range source needs unique, ordered size IDs.");
  if (!text(value.baseSizeId, 120)) return fail("Size-range source needs an explicit base size ID.");
  if (!value.sizeIds.includes(value.baseSizeId)) return fail("Base size must appear in the sourced size range.");
  return { ok: true, value: { rangeLabel: value.rangeLabel, sizeIds: [...value.sizeIds], baseSizeId: value.baseSizeId } };
}

function parseGradeRuleSource(value: unknown): RecordResult<TechPackPomGradeRuleSource> {
  if (!isRecord(value) || !exactKeys(value, ["ruleId", "version"])) {
    return fail("Grade-rule source value must contain exactly ruleId and version.");
  }
  if (!text(value.ruleId, 160)) return fail("Grade-rule source needs a stable rule ID.");
  if (!text(value.version, 80)) return fail("Grade-rule source needs an explicit version.");
  return { ok: true, value: { ruleId: value.ruleId, version: value.version } };
}

function parseDefinition(value: unknown): RecordResult<TechPackPomDefinition> {
  if (!isRecord(value) || !exactKeys(value, [
    "id", "label", "method", "landmarks", "unit", "tolerance", "sizeRangeSource", "gradeRuleSource",
  ])) return fail("POM definition has missing or unknown fields.");
  if (!stableId(value.id, DEFINITION_ID)) return fail("POM definition ID must be a stable lowercase key.");
  if (!text(value.label, 160)) return fail("POM label must be non-empty text of at most 160 characters.");
  if (typeof value.unit !== "string" || !UNIT_IDS.has(value.unit)) return fail("POM unit must be explicitly cm, mm, or in.");
  const method = parseSourcedValue(value.method, parseMethod);
  if (!method.ok) return method;
  const landmarks = parseSourcedValue(value.landmarks, parseLandmarks);
  if (!landmarks.ok) return landmarks;
  const tolerance = parseSourcedValue(value.tolerance, parseTolerance);
  if (!tolerance.ok) return tolerance;
  const sizeRangeSource = parseSourcedValue(value.sizeRangeSource, parseSizeRangeSource);
  if (!sizeRangeSource.ok) return sizeRangeSource;
  const gradeRuleSource = parseSourcedValue(value.gradeRuleSource, parseGradeRuleSource);
  if (!gradeRuleSource.ok) return gradeRuleSource;
  return {
    ok: true,
    value: {
      id: value.id,
      label: value.label,
      method: method.value,
      landmarks: landmarks.value,
      unit: value.unit as TechPackPomUnit,
      tolerance: tolerance.value,
      sizeRangeSource: sizeRangeSource.value,
      gradeRuleSource: gradeRuleSource.value,
    },
  };
}

/** Parses a detached copy and rejects any source/value ambiguity. */
export function parseTechPackPomDefinitionSet(value: unknown): RecordResult<TechPackPomDefinitionSet> {
  if (!isRecord(value) || !exactKeys(value, ["schemaVersion", "recipeId", "definitions"])) {
    return fail("T02 POM definition set has missing or unknown fields.");
  }
  if (value.schemaVersion !== TECH_PACK_POM_RECORD_VERSION) return fail("Unsupported T02 POM definition schema version.");
  if (typeof value.recipeId !== "string" || !RECIPE_IDS.has(value.recipeId)) return fail("T02 POM definitions require a supported recipe ID.");
  if (!Array.isArray(value.definitions)) return fail("T02 POM definitions must be a list.");
  if (value.definitions.length > TECH_PACK_POM_MAX_DEFINITIONS) return fail("T02 POM definition list exceeds its supported limit.");
  const definitions: TechPackPomDefinition[] = [];
  const ids = new Set<string>();
  for (const raw of value.definitions) {
    const parsed = parseDefinition(raw);
    if (!parsed.ok) return parsed;
    if (ids.has(parsed.value.id)) return fail("T02 POM definition IDs must be unique within a recipe.");
    ids.add(parsed.value.id);
    definitions.push(parsed.value);
  }
  return { ok: true, value: { schemaVersion: TECH_PACK_POM_RECORD_VERSION, recipeId: value.recipeId as TechPackPomRecipeId, definitions } };
}
