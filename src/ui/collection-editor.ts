import {
  COLLECTION_RECORD_VERSION,
  parseCollectionRecord,
  type CollectionColorway,
  type CollectionRecord,
  type CollectionSku,
  type CollectionVariant,
  type SharedMaterialGroup,
} from "./collection-records";
import type { CollectionSourceStatus } from "./collection-source-validation";
import { resolveCollectionSourceStatuses } from "./collection-source-validation";
import {
  COLLECTION_PROJECT_RECORD_VERSION,
  SCENARIO_PROJECT_RECORD_VERSION,
  type CollectionProjectRecord,
  type ProjectRecord,
  type StyleRecord,
} from "./project-records";
import type { StyleRevisionRecord } from "./style-revisions";

export type CollectionEditorScope = "collection" | "sku" | "sizePlan" | "colorway" | "variant" | "group" | "member";

export interface CollectionFieldUpdate {
  readonly collectionId: string;
  readonly scope: CollectionEditorScope;
  readonly field: string;
  readonly value: string;
  readonly skuId?: string;
  readonly recordId?: string;
  readonly index?: number;
}

export type CollectionDraftAction =
  | { readonly type: "add-collection"; readonly collection: CollectionRecord }
  | { readonly type: "delete-collection"; readonly collectionId: string }
  | { readonly type: "add-sku"; readonly collectionId: string; readonly sku: CollectionSku }
  | { readonly type: "delete-sku"; readonly collectionId: string; readonly skuId: string }
  | { readonly type: "add-colorway"; readonly collectionId: string; readonly skuId: string; readonly colorway: CollectionColorway }
  | { readonly type: "delete-colorway"; readonly collectionId: string; readonly skuId: string; readonly colorwayId: string }
  | { readonly type: "add-variant"; readonly collectionId: string; readonly skuId: string; readonly variant: CollectionVariant }
  | { readonly type: "delete-variant"; readonly collectionId: string; readonly skuId: string; readonly variantId: string }
  | { readonly type: "add-group"; readonly collectionId: string; readonly group: SharedMaterialGroup }
  | { readonly type: "delete-group"; readonly collectionId: string; readonly groupId: string }
  | { readonly type: "add-member"; readonly collectionId: string; readonly groupId: string }
  | { readonly type: "delete-member"; readonly collectionId: string; readonly groupId: string; readonly index: number };

export interface CollectionEditorInput {
  readonly project: ProjectRecord;
  readonly collections: readonly CollectionRecord[];
  readonly savedCollections: readonly CollectionRecord[];
  readonly styles: readonly StyleRecord[];
  readonly styleRevisions: readonly StyleRevisionRecord[];
  readonly sourceStatuses?: readonly CollectionSourceStatus[];
  readonly disabled?: boolean;
}

const key = (value: string): string => value.toLowerCase();

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function sameId(left: string, right: string): boolean {
  return key(left) === key(right);
}

function updateCollection(
  collections: readonly CollectionRecord[],
  collectionId: string,
  update: (collection: CollectionRecord) => CollectionRecord,
): readonly CollectionRecord[] {
  let found = false;
  const result = collections.map((collection) => {
    if (!sameId(collection.id, collectionId)) return collection;
    found = true;
    return update(collection);
  });
  return found ? result : collections;
}

/** Keep every editor operation in the existing CollectionRecord graph and preserve unrelated values. */
export function reduceCollectionDrafts(
  collections: readonly CollectionRecord[],
  action: CollectionDraftAction,
): readonly CollectionRecord[] {
  if (action.type === "add-collection") return [...collections, action.collection];
  if (action.type === "delete-collection") {
    return collections.filter((collection) => !sameId(collection.id, action.collectionId));
  }
  if (action.type === "add-sku") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection, skus: [...collection.skus, action.sku],
    }));
  }
  if (action.type === "delete-sku") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection,
      skus: collection.skus.filter((sku) => !sameId(sku.id, action.skuId)),
    }));
  }
  if (action.type === "add-colorway" || action.type === "delete-colorway"
    || action.type === "add-variant" || action.type === "delete-variant") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection,
      skus: collection.skus.map((sku) => {
        if (!sameId(sku.id, action.skuId)) return sku;
        if (action.type === "add-colorway") return { ...sku, colorways: [...sku.colorways, action.colorway] };
        if (action.type === "delete-colorway") {
          return { ...sku, colorways: sku.colorways.filter((colorway) => !sameId(colorway.id, action.colorwayId)) };
        }
        if (action.type === "add-variant") return { ...sku, variants: [...sku.variants, action.variant] };
        return { ...sku, variants: sku.variants.filter((variant) => !sameId(variant.id, action.variantId)) };
      }),
    }));
  }
  if (action.type === "add-group") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection, sharedMaterialGroups: [...collection.sharedMaterialGroups, action.group],
    }));
  }
  if (action.type === "delete-group") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection,
      sharedMaterialGroups: collection.sharedMaterialGroups.filter((group) => !sameId(group.id, action.groupId)),
    }));
  }
  if (action.type === "add-member" || action.type === "delete-member") {
    return updateCollection(collections, action.collectionId, (collection) => ({
      ...collection,
      sharedMaterialGroups: collection.sharedMaterialGroups.map((group) => {
        if (!sameId(group.id, action.groupId)) return group;
        const members = action.type === "add-member"
          ? [...group.members, { skuId: "", materialId: "" }]
          : group.members.filter((_, index) => index !== action.index);
        return { ...group, members };
      }),
    }));
  }
  return collections;
}

/** Update one authored field without trimming or dropping invalid text from the repairable draft. */
export function updateCollectionDraftField(
  collections: readonly CollectionRecord[],
  edit: CollectionFieldUpdate,
): readonly CollectionRecord[] {
  return updateCollection(collections, edit.collectionId, (collection) => {
    if (edit.scope === "collection") {
      return edit.field === "name" ? { ...collection, name: edit.value } : collection;
    }
    if (edit.scope === "sku" || edit.scope === "sizePlan" || edit.scope === "colorway" || edit.scope === "variant") {
      return {
        ...collection,
        skus: collection.skus.map((sku) => {
          if (!edit.skuId || !sameId(sku.id, edit.skuId)) return sku;
          if (edit.scope === "sku") {
            if (edit.field === "code" || edit.field === "name" || edit.field === "styleId" || edit.field === "styleRevisionId") {
              return { ...sku, [edit.field]: edit.value };
            }
            return sku;
          }
          if (edit.scope === "sizePlan") {
            if (edit.field === "name") return { ...sku, sizePlan: { ...sku.sizePlan, name: edit.value } };
            if (edit.field === "sizeIds") return { ...sku, sizePlan: { ...sku.sizePlan, sizeIds: edit.value.split(/\r?\n/) } };
            return sku;
          }
          if (!edit.recordId) return sku;
          if (edit.scope === "colorway") {
            if (edit.field !== "name" && edit.field !== "sourceColorwayId") return sku;
            return {
              ...sku,
              colorways: sku.colorways.map((colorway) => sameId(colorway.id, edit.recordId!)
                ? { ...colorway, [edit.field]: edit.value } : colorway),
            };
          }
          if (edit.field !== "skuCode" && edit.field !== "sizeId" && edit.field !== "colorwayId") return sku;
          return {
            ...sku,
            variants: sku.variants.map((variant) => sameId(variant.id, edit.recordId!)
              ? { ...variant, [edit.field]: edit.value } : variant),
          };
        }),
      };
    }
    if (edit.scope === "group") {
      if (edit.field !== "name" || !edit.recordId) return collection;
      return {
        ...collection,
        sharedMaterialGroups: collection.sharedMaterialGroups.map((group) => sameId(group.id, edit.recordId!)
          ? { ...group, name: edit.value } : group),
      };
    }
    if (!edit.recordId || !Number.isInteger(edit.index) || edit.index! < 0 || edit.field !== "skuId" && edit.field !== "materialId") {
      return collection;
    }
    return {
      ...collection,
      sharedMaterialGroups: collection.sharedMaterialGroups.map((group) => {
        if (!sameId(group.id, edit.recordId!)) return group;
        return {
          ...group,
          members: group.members.map((member, index) => index === edit.index ? { ...member, [edit.field]: edit.value } : member),
        };
      }),
    };
  });
}

/** Create a blank, repairable collection shell without inventing authored data. */
export function emptyCollectionRecord(projectId: string, id: string, now: string): CollectionRecord {
  return {
    schemaVersion: COLLECTION_RECORD_VERSION,
    id,
    projectId,
    name: "",
    createdAt: now,
    updatedAt: now,
    revision: 1,
    skus: [],
    sharedMaterialGroups: [],
  };
}

export function emptyCollectionSku(id: string, sizePlanId: string): CollectionSku {
  return {
    id, code: "", name: "", styleId: "", styleRevisionId: "",
    sizePlan: { id: sizePlanId, name: "", sizeIds: [] }, colorways: [], variants: [],
  };
}

export function emptyCollectionColorway(id: string): CollectionColorway {
  return { id, name: "", sourceColorwayId: "" };
}

export function emptyCollectionVariant(id: string): CollectionVariant {
  return { id, skuCode: "", sizeId: "", colorwayId: "" };
}

export function emptySharedMaterialGroup(id: string): SharedMaterialGroup {
  return { id, name: "", members: [] };
}

function graphContent(collection: CollectionRecord): string {
  return JSON.stringify({
    schemaVersion: collection.schemaVersion,
    id: collection.id,
    projectId: collection.projectId,
    name: collection.name,
    skus: collection.skus,
    sharedMaterialGroups: collection.sharedMaterialGroups,
  });
}

export function collectionDraftsAreDirty(
  drafts: readonly CollectionRecord[],
  saved: readonly CollectionRecord[],
): boolean {
  return JSON.stringify(drafts) !== JSON.stringify(saved);
}

/** Apply system-managed collection metadata to save candidates without mutating the live draft. */
export function prepareCollectionRecordsForSave(
  drafts: readonly CollectionRecord[],
  saved: readonly CollectionRecord[],
  now: string,
): readonly CollectionRecord[] {
  const current = Date.parse(now);
  if (!Number.isFinite(current) || new Date(current).toISOString() !== now) {
    throw new Error("Collection save time must be a canonical UTC ISO timestamp.");
  }
  const savedById = new Map(saved.map((collection) => [key(collection.id), collection] as const));
  return drafts.map((draft) => {
    const previous = savedById.get(key(draft.id));
    if (!previous) return { ...draft, revision: 1 };
    if (graphContent(previous) === graphContent(draft)) return previous;
    if (!Number.isSafeInteger(previous.revision + 1)) throw new Error("Collection revision is at its maximum supported value.");
    const updated = Math.max(current, Date.parse(previous.updatedAt) + 1, Date.parse(previous.createdAt));
    return {
      ...draft,
      createdAt: previous.createdAt,
      revision: previous.revision + 1,
      updatedAt: new Date(updated).toISOString(),
    };
  });
}

function option(value: string, label: string, selected: string): string {
  return `<option value="${escapeHtml(value)}"${sameId(value, selected) ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function choiceSelect(
  label: string,
  value: string,
  choices: readonly { readonly id: string; readonly label: string }[],
  fieldAttributes: string,
  disabled: boolean,
): string {
  const isAvailable = choices.some((choice) => sameId(choice.id, value));
  const unresolved = value && !isAvailable
    ? option(value, `Unresolved saved ID · ${value}`, value)
    : "";
  return `<label>${escapeHtml(label)}<select ${fieldAttributes}${disabled ? " disabled" : ""}>` +
    `<option value=""${value ? "" : " selected"}>Choose an exact saved source…</option>${unresolved}` +
    choices.map((choice) => option(choice.id, choice.label, value)).join("") + `</select></label>`;
}

function field(
  label: string,
  value: string,
  attributes: string,
  disabled: boolean,
  multiline = false,
): string {
  const control = multiline
    ? `<textarea ${attributes}${disabled ? " disabled" : ""}>${escapeHtml(value)}</textarea>`
    : `<input type="text" value="${escapeHtml(value)}" ${attributes}${disabled ? " disabled" : ""}/>`;
  return `<label>${escapeHtml(label)}${control}</label>`;
}

function actionButton(action: string, label: string, attributes = "", disabled = false): string {
  return `<button type="button" data-collection-action="${action}" ${attributes}${disabled ? " disabled" : ""}>${escapeHtml(label)}</button>`;
}

interface PinView {
  readonly statuses: ReadonlyMap<string, CollectionSourceStatus>;
  readonly error: string | null;
}

function sourceStatusesForCollection(input: CollectionEditorInput, collection: CollectionRecord, valid: boolean): PinView {
  if (!valid) {
    const savedStatuses = (input.sourceStatuses ?? []).filter((status) => sameId(status.collectionId, collection.id));
    const skuById = new Map(collection.skus.map((sku) => [key(sku.id), sku] as const));
    const unchangedPins = savedStatuses.filter((status) => {
      const sku = skuById.get(key(status.skuId));
      return sku && sameId(status.styleId, sku.styleId) && sameId(status.styleRevisionId, sku.styleRevisionId);
    });
    return { statuses: new Map(unchangedPins.map((status) => [key(status.skuId), status])), error: null };
  }
  const project: CollectionProjectRecord | Extract<ProjectRecord, { readonly schemaVersion: typeof SCENARIO_PROJECT_RECORD_VERSION }> =
    input.project.schemaVersion === SCENARIO_PROJECT_RECORD_VERSION
      ? { ...input.project, collections: [collection] }
      : {
        ...input.project,
        schemaVersion: COLLECTION_PROJECT_RECORD_VERSION,
        brandProfile: "brandProfile" in input.project ? input.project.brandProfile : null,
        collections: [collection],
      };
  const result = resolveCollectionSourceStatuses(project, input.styles, input.styleRevisions);
  return result.ok
    ? { statuses: new Map(result.value.map((status) => [key(status.skuId), status])), error: null }
    : { statuses: new Map(), error: result.error };
}

function pinMessage(status: CollectionSourceStatus | undefined): string {
  if (!status) return "Unresolved — choose a project style and one of its immutable revisions. No mutable style-head substitute is used.";
  const state = status.isStale
    ? `Stale pin — saved r${status.pinnedRevisionNumber}; current style head r${status.headRevisionNumber}.`
    : `Current pin — saved r${status.pinnedRevisionNumber} is the current style head.`;
  return `${state}${status.isArchived ? " Source style is archived; the saved revision remains available." : ""}`;
}

interface EditorLookups {
  readonly styleChoices: readonly { readonly id: string; readonly label: string }[];
  readonly revisionsByStyle: ReadonlyMap<string, readonly StyleRevisionRecord[]>;
  readonly revisionsById: ReadonlyMap<string, StyleRevisionRecord>;
}

function editorLookups(input: CollectionEditorInput): EditorLookups {
  const revisionsByStyle = new Map<string, StyleRevisionRecord[]>();
  const revisionsById = new Map<string, StyleRevisionRecord>();
  for (const revision of input.styleRevisions) {
    revisionsById.set(key(revision.revisionId), revision);
    const current = revisionsByStyle.get(key(revision.styleId)) ?? [];
    current.push(revision);
    revisionsByStyle.set(key(revision.styleId), current);
  }
  return {
    styleChoices: input.styles.map((style) => ({
      id: style.id,
      label: `${style.archivedAt === null ? "" : "Archived · "}${style.name} · ${style.recipeId}`,
    })),
    revisionsByStyle,
    revisionsById,
  };
}

function sourceChoices(revision: StyleRevisionRecord | undefined, kind: "colorway" | "material"):
readonly { readonly id: string; readonly label: string }[] {
  if (!revision || revision.payload.payloadVersion !== 2) return [];
  const records = kind === "colorway" ? revision.payload.techPack.colorways : revision.payload.techPack.materials;
  return records.map((record) => ({
    id: record.id,
    label: `${record.name.value?.trim() || `Unnamed ${kind}`} · ${record.id.slice(0, 8)}`,
  }));
}

function scopedAttributes(scope: CollectionEditorScope, collectionId: string, fieldName: string, extra = ""): string {
  return `data-ce-scope="${scope}" data-ce-collection-id="${escapeHtml(collectionId)}" ` +
    `data-ce-field="${fieldName}" ${extra}`;
}

function renderSku(
  input: CollectionEditorInput,
  collection: CollectionRecord,
  sku: CollectionSku,
  pinView: PinView,
  lookups: EditorLookups,
): string {
  const disabled = input.disabled === true;
  const revision = lookups.revisionsById.get(key(sku.styleRevisionId));
  const exactRevision = revision && sameId(revision.styleId, sku.styleId) ? revision : undefined;
  const skuAttrs = (name: string): string => scopedAttributes("sku", collection.id, name,
    `data-ce-sku-id="${escapeHtml(sku.id)}"`);
  const sizeAttrs = (name: string): string => scopedAttributes("sizePlan", collection.id, name,
    `data-ce-sku-id="${escapeHtml(sku.id)}"`);
  const revisionChoices = (lookups.revisionsByStyle.get(key(sku.styleId)) ?? [])
    .map((item) => ({ id: item.revisionId, label: `r${item.revisionNumber} · ${item.createdAt} · ${item.revisionId.slice(0, 8)}` }));
  const styles = choiceSelect("Project style", sku.styleId, lookups.styleChoices, skuAttrs("styleId"), disabled);
  const revisions = choiceSelect("Immutable style revision", sku.styleRevisionId, revisionChoices, skuAttrs("styleRevisionId"), disabled);
  const status = pinView.statuses.get(key(sku.id));
  const colors = sku.colorways.map((colorway) => {
    const attrs = (name: string): string => scopedAttributes("colorway", collection.id, name,
      `data-ce-sku-id="${escapeHtml(sku.id)}" data-ce-record-id="${escapeHtml(colorway.id)}"`);
    const source = choiceSelect("Frozen T01 colorway", colorway.sourceColorwayId,
      sourceChoices(exactRevision, "colorway"), attrs("sourceColorwayId"), disabled);
    return `<article class="project-collection-editor-row"><div class="project-collection-editor-fields">` +
      `${field("Local colorway label", colorway.name, attrs("name"), disabled)}${source}</div>` +
      `${actionButton("delete-colorway", "Remove colorway", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-sku-id="${escapeHtml(sku.id)}" data-ce-record-id="${escapeHtml(colorway.id)}"`, disabled)}</article>`;
  }).join("");
  const variants = sku.variants.map((variant) => {
    const attrs = (name: string): string => scopedAttributes("variant", collection.id, name,
      `data-ce-sku-id="${escapeHtml(sku.id)}" data-ce-record-id="${escapeHtml(variant.id)}"`);
    return `<article class="project-collection-editor-row"><div class="project-collection-editor-fields">` +
      `${field("Variant SKU code", variant.skuCode, attrs("skuCode"), disabled)}` +
      `${field("Size ID", variant.sizeId, attrs("sizeId"), disabled)}` +
      `${choiceSelect("Local colorway", variant.colorwayId, sku.colorways.map((colorway) => ({ id: colorway.id, label: `${colorway.name || "Unnamed colorway"} · ${colorway.id.slice(0, 8)}` })), attrs("colorwayId"), disabled)}` +
      `</div>${actionButton("delete-variant", "Remove variant", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-sku-id="${escapeHtml(sku.id)}" data-ce-record-id="${escapeHtml(variant.id)}"`, disabled)}</article>`;
  }).join("");
  return `<article class="project-collection-editor-sku" aria-label="Edit SKU ${escapeHtml(sku.code || sku.id.slice(0, 8))}">` +
    `<div class="project-collection-editor-heading"><h5>SKU · ${escapeHtml(sku.code || "Unnamed")}</h5>` +
    `${actionButton("delete-sku", "Delete SKU", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-sku-id="${escapeHtml(sku.id)}"`, disabled)}</div>` +
    `<div class="project-collection-editor-fields">${field("SKU row code", sku.code, skuAttrs("code"), disabled)}` +
    `${field("SKU name", sku.name, skuAttrs("name"), disabled)}${styles}${revisions}</div>` +
    `<p class="project-collection-editor-state">${escapeHtml(pinMessage(status))}</p>` +
    `<section class="project-collection-editor-subsection"><h6>Size plan</h6><div class="project-collection-editor-fields">` +
    `${field("Size plan name", sku.sizePlan.name, sizeAttrs("name"), disabled)}` +
    `${field("Size IDs · one per line", sku.sizePlan.sizeIds.join("\n"), sizeAttrs("sizeIds"), disabled, true)}</div></section>` +
    `<section class="project-collection-editor-subsection"><div class="project-collection-editor-heading"><h6>Colorways</h6>` +
    `${actionButton("add-colorway", "Add colorway", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-sku-id="${escapeHtml(sku.id)}"`, disabled)}</div>` +
    `${colors || `<p>No colorways in this SKU draft.</p>`}</section>` +
    `<section class="project-collection-editor-subsection"><div class="project-collection-editor-heading"><h6>Variants</h6>` +
    `${actionButton("add-variant", "Add variant", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-sku-id="${escapeHtml(sku.id)}"`, disabled)}</div>` +
    `${variants || `<p>No variants in this SKU draft. Add them explicitly; no size/colorway combinations are generated.</p>`}</section></article>`;
}

function renderGroup(
  input: CollectionEditorInput,
  collection: CollectionRecord,
  group: SharedMaterialGroup,
  skuById: ReadonlyMap<string, CollectionSku>,
  lookups: EditorLookups,
): string {
  const disabled = input.disabled === true;
  const members = group.members.map((member, index) => {
    const memberAttrs = (name: string): string => scopedAttributes("member", collection.id, name,
      `data-ce-record-id="${escapeHtml(group.id)}" data-ce-index="${index}"`);
    const sku = skuById.get(key(member.skuId));
    const revision = sku ? lookups.revisionsById.get(key(sku.styleRevisionId)) : undefined;
    const exactRevision = revision && sku && sameId(revision.styleId, sku.styleId) ? revision : undefined;
    const skuChoices = collection.skus.map((item) => ({
      id: item.id, label: `${item.code || "Unnamed SKU"} · ${item.name || item.id.slice(0, 8)}`,
    }));
    const materials = choiceSelect("Frozen T01 material", member.materialId,
      sourceChoices(exactRevision, "material"), memberAttrs("materialId"), disabled);
    return `<article class="project-collection-editor-row"><div class="project-collection-editor-fields">` +
      `${choiceSelect("Member SKU", member.skuId, skuChoices, memberAttrs("skuId"), disabled)}${materials}</div>` +
      `${actionButton("delete-member", "Remove member", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-record-id="${escapeHtml(group.id)}" data-ce-index="${index}"`, disabled)}</article>`;
  }).join("");
  const attrs = scopedAttributes("group", collection.id, "name", `data-ce-record-id="${escapeHtml(group.id)}"`);
  return `<article class="project-collection-editor-group"><div class="project-collection-editor-heading">` +
    `<h5>Shared-material group · ${escapeHtml(group.name || "Unnamed")}</h5>` +
    `${actionButton("delete-group", "Remove group", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-record-id="${escapeHtml(group.id)}"`, disabled)}</div>` +
    `${field("User-authored group name", group.name, attrs, disabled)}` +
    `<p>Members reference source materials on each SKU's exact pinned revision. This category does not assert equivalence or availability.</p>` +
    `${members || `<p>Add at least two distinct SKU members to complete this group.</p>`}` +
    `${actionButton("add-member", "Add member", `data-ce-collection-id="${escapeHtml(collection.id)}" data-ce-record-id="${escapeHtml(group.id)}"`, disabled)}</article>`;
}

function renderCollection(input: CollectionEditorInput, collection: CollectionRecord, lookups: EditorLookups): string {
  const disabled = input.disabled === true;
  const parsed = parseCollectionRecord(collection);
  const pinView = sourceStatusesForCollection(input, collection, parsed.ok);
  const skuById = new Map(collection.skus.map((sku) => [key(sku.id), sku] as const));
  const skus = collection.skus.map((sku) => renderSku(input, collection, sku, pinView, lookups)).join("");
  const groups = collection.sharedMaterialGroups.map((group) => renderGroup(input, collection, group, skuById, lookups)).join("");
  const attrs = scopedAttributes("collection", collection.id, "name");
  const skuCount = collection.skus.length;
  const variantCount = collection.skus.reduce((sum, sku) => sum + sku.variants.length, 0);
  const validation = parsed.ok ? "" : parsed.error;
  const sourceError = pinView.error ? `<p class="project-collection-editor-error" role="alert">${escapeHtml(pinView.error)}</p>` : "";
  const referenceWarning = pinView.error
    ? " Invalid source references remain in this draft until deliberately repaired."
    : "";
  return `<article class="project-collection-editor-card" aria-label="Edit collection ${escapeHtml(collection.name || collection.id.slice(0, 8))}">` +
    `<div class="project-collection-editor-heading"><h4>Collection · ${escapeHtml(collection.name || "Unnamed")}</h4>` +
    `${actionButton("delete-collection", "Delete collection", `data-ce-collection-id="${escapeHtml(collection.id)}"`, disabled)}</div>` +
    `<p>Saved revision ${collection.revision} · created ${escapeHtml(collection.createdAt)} · updated ${escapeHtml(collection.updatedAt)}</p>` +
    `${field("Collection name", collection.name, attrs, disabled)}` +
    `<p class="project-collection-editor-error" data-ce-validation-for="${escapeHtml(collection.id)}" role="alert">${escapeHtml(validation)}</p>` +
    `${sourceError}` +
    `<section class="project-collection-editor-subsection"><div class="project-collection-editor-heading"><h5>SKU rows · ${skuCount}</h5>` +
    `${actionButton("add-sku", "Add SKU", `data-ce-collection-id="${escapeHtml(collection.id)}"`, disabled)}</div>` +
    `${skus || `<p>No SKU rows yet. Add a SKU, then explicitly choose its style, immutable revision, size plan, colorways and variants.</p>`}</section>` +
    `<section class="project-collection-editor-subsection"><div class="project-collection-editor-heading"><h5>Shared-material groups · ${collection.sharedMaterialGroups.length}</h5>` +
    `${actionButton("add-group", "Add group", `data-ce-collection-id="${escapeHtml(collection.id)}"`, disabled)}</div>` +
    `${groups || `<p>No shared-material groups in this draft.</p>`}</section>` +
    `<p class="project-collection-editor-count">${variantCount} nested variant(s).${referenceWarning}</p>` +
    `</article>`;
}

/** Render the editable local draft while keeping persistence behind the explicit Project Manager Save action. */
export function renderCollectionEditor(input: CollectionEditorInput): string {
  const disabled = input.disabled === true;
  const drafts = input.collections;
  const saved = input.savedCollections;
  const dirty = collectionDraftsAreDirty(drafts, saved);
  const invalid = drafts.some((collection) => !parseCollectionRecord(collection).ok);
  const lookups = editorLookups(input);
  const collections = drafts.map((collection) => renderCollection(input, collection, lookups)).join("");
  return `<section class="project-collection-editor" aria-label="Collection editor">` +
    `<h3>Collection editor</h3>` +
    `<p>Edits stay in this local draft until saved. Style and source choices use exact immutable project revisions. Variants and shared-material groups are user-entered; no combinations or source identities are inferred.</p>` +
    `${actionButton("add-collection", "Add collection", "", disabled)}` +
    `${collections || `<p>No collections in this project. Add one to begin a local collection draft.</p>`}` +
    `<div class="project-collection-editor-actions">` +
    `${actionButton("save", "Save collection changes", "", disabled || !dirty || invalid)}` +
    `${actionButton("discard", "Discard collection edits", "", disabled || !dirty)}` +
    `</div></section>`;
}
