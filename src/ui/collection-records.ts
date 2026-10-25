/** Strict local collection/SKU/variant records; source existence is resolved by the repository boundary. */
import type { RecordResult } from "./project-records";

export const COLLECTION_RECORD_VERSION = 1;
/** Bounds local parsing using the existing Tech Pack record-set limit as precedent. */
export const COLLECTION_GRAPH_ENTRY_LIMIT = 10_000;

export interface CollectionSizePlan {
  readonly id: string;
  readonly name: string;
  readonly sizeIds: readonly string[];
}

export interface CollectionColorway {
  readonly id: string;
  readonly name: string;
  readonly sourceColorwayId: string;
}

export interface CollectionVariant {
  readonly id: string;
  readonly skuCode: string;
  readonly sizeId: string;
  readonly colorwayId: string;
}

export interface CollectionSku {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly styleId: string;
  readonly styleRevisionId: string;
  readonly sizePlan: CollectionSizePlan;
  readonly colorways: readonly CollectionColorway[];
  readonly variants: readonly CollectionVariant[];
}

export interface SharedMaterialMember {
  readonly skuId: string;
  readonly materialId: string;
}

/** A user-authored grouping of source materials; it does not assert equivalence. */
export interface SharedMaterialGroup {
  readonly id: string;
  readonly name: string;
  readonly members: readonly SharedMaterialMember[];
}

export interface CollectionRecord {
  readonly schemaVersion: typeof COLLECTION_RECORD_VERSION;
  readonly id: string;
  readonly projectId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: number;
  readonly skus: readonly CollectionSku[];
  readonly sharedMaterialGroups: readonly SharedMaterialGroup[];
}

const COLLECTION_KEYS = [
  "schemaVersion", "id", "projectId", "name", "createdAt", "updatedAt", "revision", "skus", "sharedMaterialGroups",
];
const SKU_KEYS = ["id", "code", "name", "styleId", "styleRevisionId", "sizePlan", "colorways", "variants"];
const SIZE_PLAN_KEYS = ["id", "name", "sizeIds"];
const COLORWAY_KEYS = ["id", "name", "sourceColorwayId"];
const VARIANT_KEYS = ["id", "skuCode", "sizeId", "colorwayId"];
const MATERIAL_GROUP_KEYS = ["id", "name", "members"];
const MATERIAL_MEMBER_KEYS = ["skuId", "materialId"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type JsonObject = Record<string, unknown>;

interface ValidationState {
  entryCount: number;
  readonly recordIds: Set<string>;
  readonly skuIds: Set<string>;
  readonly skuCodes: Set<string>;
  readonly variantCodes: Set<string>;
  readonly sourceColorwayIdsBySku: Set<string>;
  readonly materialMembers: Set<string>;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: unknown, expected: readonly string[]): value is JsonObject {
  if (!isObject(value)) return false;
  const actual = Object.keys(value);
  return actual.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function validText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 80;
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function addEntries(state: ValidationState, count: number, path: string): string | null {
  state.entryCount += count;
  return state.entryCount <= COLLECTION_GRAPH_ENTRY_LIMIT
    ? null
    : `${path}: collection graph exceeds ${COLLECTION_GRAPH_ENTRY_LIMIT} entries.`;
}

function uniqueRecordId(value: string, path: string, state: ValidationState): string | null {
  const key = value.toLowerCase();
  if (state.recordIds.has(key)) return `${path}: duplicate record ID.`;
  state.recordIds.add(key);
  return null;
}

function validateSizePlan(value: unknown, path: string, state: ValidationState): Set<string> | string {
  if (!hasExactKeys(value, SIZE_PLAN_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!validUuid(value.id)) return `${path}.id: expected a UUID.`;
  if (!validText(value.name)) return `${path}.name: enter a name of at most 80 characters.`;
  if (!Array.isArray(value.sizeIds)) return `${path}.sizeIds: expected a list.`;
  if (value.sizeIds.length === 0) return `${path}.sizeIds: choose at least one size for this plan.`;
  const sizeLimitError = addEntries(state, 1 + value.sizeIds.length, path);
  if (sizeLimitError) return sizeLimitError;
  const idError = uniqueRecordId(value.id, `${path}.id`, state);
  if (idError) return idError;

  const sizeIds = new Set<string>();
  for (const [index, sizeId] of value.sizeIds.entries()) {
    if (!validText(sizeId)) return `${path}.sizeIds[${index}]: enter a nonempty size ID of at most 80 characters.`;
    if (sizeIds.has(sizeId)) return `${path}.sizeIds[${index}]: duplicate size ID.`;
    sizeIds.add(sizeId);
  }
  return sizeIds;
}

function validateColorways(value: unknown, path: string, skuId: string, state: ValidationState): Set<string> | string {
  if (!Array.isArray(value)) return `${path}: expected a list.`;
  const limitError = addEntries(state, value.length, path);
  if (limitError) return limitError;

  const colorwayIds = new Set<string>();
  for (const [index, colorway] of value.entries()) {
    const colorwayPath = `${path}[${index}]`;
    if (!hasExactKeys(colorway, COLORWAY_KEYS)) return `${colorwayPath}: fields are incomplete or unknown.`;
    if (!validUuid(colorway.id)) return `${colorwayPath}.id: expected a UUID.`;
    if (!validText(colorway.name)) return `${colorwayPath}.name: enter a name of at most 80 characters.`;
    if (!validUuid(colorway.sourceColorwayId)) {
      return `${colorwayPath}.sourceColorwayId: expected a UUID from the linked style revision.`;
    }
    const idError = uniqueRecordId(colorway.id, `${colorwayPath}.id`, state);
    if (idError) return idError;
    const sourceKey = `${skuId.toLowerCase()}:${colorway.sourceColorwayId.toLowerCase()}`;
    if (state.sourceColorwayIdsBySku.has(sourceKey)) {
      return `${colorwayPath}.sourceColorwayId: duplicate source colorway for this SKU.`;
    }
    state.sourceColorwayIdsBySku.add(sourceKey);
    colorwayIds.add(colorway.id.toLowerCase());
  }
  return colorwayIds;
}

function validateVariants(
  value: unknown,
  path: string,
  sizeIds: ReadonlySet<string>,
  colorwayIds: ReadonlySet<string>,
  state: ValidationState,
): string | null {
  if (!Array.isArray(value)) return `${path}: expected a list.`;
  const limitError = addEntries(state, value.length, path);
  if (limitError) return limitError;

  const combinations = new Set<string>();
  for (const [index, variant] of value.entries()) {
    const variantPath = `${path}[${index}]`;
    if (!hasExactKeys(variant, VARIANT_KEYS)) return `${variantPath}: fields are incomplete or unknown.`;
    if (!validUuid(variant.id)) return `${variantPath}.id: expected a UUID.`;
    if (!validText(variant.skuCode)) return `${variantPath}.skuCode: enter a unique variant SKU code of at most 80 characters.`;
    if (!validText(variant.sizeId)) return `${variantPath}.sizeId: expected a size ID in this SKU's size plan.`;
    if (!validUuid(variant.colorwayId)) return `${variantPath}.colorwayId: expected a UUID for a colorway in this SKU.`;
    const idError = uniqueRecordId(variant.id, `${variantPath}.id`, state);
    if (idError) return idError;
    if (state.variantCodes.has(variant.skuCode)) return `${variantPath}.skuCode: duplicate variant SKU code.`;
    state.variantCodes.add(variant.skuCode);
    if (!sizeIds.has(variant.sizeId)) return `${variantPath}.sizeId: reference a size in this SKU's size plan.`;
    const colorwayKey = variant.colorwayId.toLowerCase();
    if (!colorwayIds.has(colorwayKey)) return `${variantPath}.colorwayId: reference a colorway in this SKU.`;
    const combination = JSON.stringify([variant.sizeId, colorwayKey]);
    if (combinations.has(combination)) return `${variantPath}: duplicate size/colorway variant.`;
    combinations.add(combination);
  }
  return null;
}

function validateSku(value: unknown, index: number, state: ValidationState): string | null {
  const path = `collection.skus[${index}]`;
  if (!hasExactKeys(value, SKU_KEYS)) return `${path}: fields are incomplete or unknown.`;
  if (!validUuid(value.id)) return `${path}.id: expected a UUID.`;
  if (!validText(value.code)) return `${path}.code: enter a SKU row code of at most 80 characters.`;
  if (!validText(value.name)) return `${path}.name: enter a name of at most 80 characters.`;
  if (!validUuid(value.styleId)) return `${path}.styleId: expected a stable style UUID.`;
  if (!validUuid(value.styleRevisionId)) {
    return `${path}.styleRevisionId: expected an immutable style revision UUID.`;
  }
  if (state.skuCodes.has(value.code)) return `${path}.code: duplicate SKU row code.`;
  const idError = uniqueRecordId(value.id, `${path}.id`, state);
  if (idError) return idError;
  state.skuCodes.add(value.code);
  state.skuIds.add(value.id.toLowerCase());

  const sizePlan = validateSizePlan(value.sizePlan, `${path}.sizePlan`, state);
  if (typeof sizePlan === "string") return sizePlan;
  const colorwayIds = validateColorways(value.colorways, `${path}.colorways`, value.id, state);
  if (typeof colorwayIds === "string") return colorwayIds;
  return validateVariants(value.variants, `${path}.variants`, sizePlan, colorwayIds, state);
}

function validateSharedMaterialGroups(value: unknown, state: ValidationState): string | null {
  if (!Array.isArray(value)) return "collection.sharedMaterialGroups: expected a list.";
  for (const [index, group] of value.entries()) {
    const path = `collection.sharedMaterialGroups[${index}]`;
    if (!hasExactKeys(group, MATERIAL_GROUP_KEYS)) return `${path}: fields are incomplete or unknown.`;
    if (!validUuid(group.id)) return `${path}.id: expected a UUID.`;
    if (!validText(group.name)) return `${path}.name: enter a name of at most 80 characters.`;
    if (!Array.isArray(group.members)) return `${path}.members: expected a list.`;
    if (group.members.length < 2) return `${path}.members: link at least two distinct SKU rows.`;
    const limitError = addEntries(state, group.members.length, `${path}.members`);
    if (limitError) return limitError;
    const idError = uniqueRecordId(group.id, `${path}.id`, state);
    if (idError) return idError;

    const groupSkuIds = new Set<string>();
    for (const [memberIndex, member] of group.members.entries()) {
      const memberPath = `${path}.members[${memberIndex}]`;
      if (!hasExactKeys(member, MATERIAL_MEMBER_KEYS)) return `${memberPath}: fields are incomplete or unknown.`;
      if (!validUuid(member.skuId)) return `${memberPath}.skuId: expected a SKU UUID.`;
      if (!validUuid(member.materialId)) return `${memberPath}.materialId: expected a source material UUID.`;
      const skuKey = member.skuId.toLowerCase();
      if (!state.skuIds.has(skuKey)) return `${memberPath}.skuId: reference a SKU in this collection.`;
      if (groupSkuIds.has(skuKey)) return `${memberPath}.skuId: link each SKU at most once in a material group.`;
      const memberKey = `${skuKey}:${member.materialId.toLowerCase()}`;
      if (state.materialMembers.has(memberKey)) {
        return `${memberPath}.materialId: this source material is already linked to a shared-material group.`;
      }
      groupSkuIds.add(skuKey);
      state.materialMembers.add(memberKey);
    }
  }
  return null;
}

/** Validate the collection-owned graph without resolving external project/style records or normalizing input. */
export function parseCollectionRecord(value: unknown): RecordResult<CollectionRecord> {
  if (!hasExactKeys(value, COLLECTION_KEYS)) return fail("collection: fields are incomplete or unknown.");
  if (value.schemaVersion !== COLLECTION_RECORD_VERSION) {
    return fail(`collection.schemaVersion: expected ${COLLECTION_RECORD_VERSION}.`);
  }
  if (!validUuid(value.id)) return fail("collection.id: expected a UUID.");
  if (!validUuid(value.projectId)) return fail("collection.projectId: expected a project UUID.");
  if (!validText(value.name)) return fail("collection.name: enter a name of at most 80 characters.");
  if (!validTimestamp(value.createdAt)) return fail("collection.createdAt: expected a canonical ISO timestamp.");
  if (!validTimestamp(value.updatedAt)) return fail("collection.updatedAt: expected a canonical ISO timestamp.");
  if (Date.parse(value.updatedAt) < Date.parse(value.createdAt)) {
    return fail("collection.updatedAt: must not precede createdAt.");
  }
  if (!validRevision(value.revision)) return fail("collection.revision: expected a positive safe integer.");
  if (!Array.isArray(value.skus)) return fail("collection.skus: expected a list.");
  if (!Array.isArray(value.sharedMaterialGroups)) return fail("collection.sharedMaterialGroups: expected a list.");

  const state: ValidationState = {
    entryCount: 1,
    recordIds: new Set(),
    skuIds: new Set(),
    skuCodes: new Set(),
    variantCodes: new Set(),
    sourceColorwayIdsBySku: new Set(),
    materialMembers: new Set(),
  };
  state.recordIds.add(value.id.toLowerCase());
  if (value.skus.length + value.sharedMaterialGroups.length + state.entryCount > COLLECTION_GRAPH_ENTRY_LIMIT) {
    return fail(`collection: collection graph exceeds ${COLLECTION_GRAPH_ENTRY_LIMIT} entries.`);
  }
  state.entryCount += value.skus.length + value.sharedMaterialGroups.length;

  for (const [index, sku] of value.skus.entries()) {
    const error = validateSku(sku, index, state);
    if (error) return fail(error);
  }
  const groupError = validateSharedMaterialGroups(value.sharedMaterialGroups, state);
  if (groupError) return fail(groupError);
  return { ok: true, value: value as unknown as CollectionRecord };
}

/** Count the collection graph nodes using the same categories bounded by its parser. */
export function collectionGraphEntryCount(collection: CollectionRecord): number {
  return 1 + collection.skus.length + collection.sharedMaterialGroups.length
    + collection.skus.reduce((count, sku) => count + 1 + sku.sizePlan.sizeIds.length
      + sku.colorways.length + sku.variants.length, 0)
    + collection.sharedMaterialGroups.reduce((count, group) => count + group.members.length, 0);
}
