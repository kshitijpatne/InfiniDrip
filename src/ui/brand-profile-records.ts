import { isLocalArtworkAssetId } from "../surface/artwork-store";

export const BRAND_PROFILE_RECORD_VERSION = 1;

export interface BrandProfileColor {
  readonly id: string;
  readonly name: string;
  readonly hex: string;
}

export type BrandProfileRuleScope = "design" | "materials" | "supplier";
export type BrandProfileRuleKind = "preference" | "block" | "supplier-constraint";

/**
 * User-authored guidance. It is displayed as entered; this record does not
 * define or execute a general expression language.
 */
export interface BrandProfileRule {
  readonly id: string;
  readonly scope: BrandProfileRuleScope;
  readonly kind: BrandProfileRuleKind;
  readonly description: string;
}

/** Optional project-local brand guidance. Asset IDs point to the existing store. */
export interface BrandProfileRecord {
  readonly schemaVersion: typeof BRAND_PROFILE_RECORD_VERSION;
  readonly colors: readonly BrandProfileColor[];
  readonly artworkAssetIds: readonly string[];
  readonly rules: readonly BrandProfileRule[];
}

export type BrandProfileRecordResult =
  | { readonly ok: true; readonly value: BrandProfileRecord }
  | { readonly ok: false; readonly error: string };

const PROFILE_KEYS = ["schemaVersion", "colors", "artworkAssetIds", "rules"];
const COLOR_KEYS = ["id", "name", "hex"];
const RULE_KEYS = ["id", "scope", "kind", "description"];
const RULE_SCOPES: readonly string[] = ["design", "materials", "supplier"];
const RULE_KINDS: readonly string[] = ["preference", "block", "supplier-constraint"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function colorError(value: unknown, index: number): string | null {
  const path = `brandProfile.colors[${index}]`;
  if (!isRecord(value)) return `${path}: expected a color record.`;
  if (!hasExactKeys(value, COLOR_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!isUuid(value.id)) return `${path}.id: expected a UUID.`;
  if (!isNonEmptyText(value.name)) return `${path}.name: enter a color name.`;
  if (typeof value.hex !== "string" || !HEX_COLOR.test(value.hex)) {
    return `${path}.hex: enter a six-digit hex color such as #2A4B6C.`;
  }
  return null;
}

function ruleError(value: unknown, index: number): string | null {
  const path = `brandProfile.rules[${index}]`;
  if (!isRecord(value)) return `${path}: expected a rule record.`;
  if (!hasExactKeys(value, RULE_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!isUuid(value.id)) return `${path}.id: expected a UUID.`;
  if (!RULE_SCOPES.includes(value.scope as string)) {
    return `${path}.scope: choose design, materials, or supplier.`;
  }
  if (!RULE_KINDS.includes(value.kind as string)) {
    return `${path}.kind: choose preference, block, or supplier-constraint.`;
  }
  const supplierConstraint = value.kind === "supplier-constraint";
  if (supplierConstraint !== (value.scope === "supplier")) {
    return `${path}: supplier-constraint must use supplier scope; preference and block must use design or materials.`;
  }
  if (!isNonEmptyText(value.description)) return `${path}.description: enter the user-authored guidance.`;
  return null;
}

function fail(error: string): BrandProfileRecordResult {
  return { ok: false, error };
}

/** Validate without normalizing or mutating caller data. */
export function parseBrandProfileRecord(value: unknown): BrandProfileRecordResult {
  if (!isRecord(value)) return fail("brandProfile: expected an object.");
  if (!hasExactKeys(value, PROFILE_KEYS)) return fail("brandProfile: fields are incomplete or unknown.");
  if (value.schemaVersion !== BRAND_PROFILE_RECORD_VERSION) {
    return fail(`brandProfile.schemaVersion: expected ${BRAND_PROFILE_RECORD_VERSION}.`);
  }
  if (!Array.isArray(value.colors)) return fail("brandProfile.colors: expected a list.");
  const colorIds = new Set<string>();
  for (const [index, color] of value.colors.entries()) {
    const error = colorError(color, index);
    if (error !== null) return fail(error);
    const id = (color as BrandProfileColor).id;
    if (colorIds.has(id)) return fail(`brandProfile.colors[${index}].id: duplicate color ID.`);
    colorIds.add(id);
  }
  if (!Array.isArray(value.artworkAssetIds)) return fail("brandProfile.artworkAssetIds: expected a list.");
  const artworkAssetIds = new Set<string>();
  for (const [index, assetId] of value.artworkAssetIds.entries()) {
    if (!isLocalArtworkAssetId(assetId)) {
      return fail(`brandProfile.artworkAssetIds[${index}]: expected a local artwork asset ID.`);
    }
    if (artworkAssetIds.has(assetId)) return fail(`brandProfile.artworkAssetIds[${index}]: duplicate artwork asset ID.`);
    artworkAssetIds.add(assetId);
  }
  if (!Array.isArray(value.rules)) return fail("brandProfile.rules: expected a list.");
  const ruleIds = new Set<string>();
  for (const [index, rule] of value.rules.entries()) {
    const error = ruleError(rule, index);
    if (error !== null) return fail(error);
    const id = (rule as BrandProfileRule).id;
    if (ruleIds.has(id)) return fail(`brandProfile.rules[${index}].id: duplicate rule ID.`);
    ruleIds.add(id);
  }
  return { ok: true, value: value as unknown as BrandProfileRecord };
}
