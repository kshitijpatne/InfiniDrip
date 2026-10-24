import type { CollectionRecord, CollectionSku } from "./collection-records";
import type { CollectionSourceStatus } from "./collection-source-validation";
import type { StyleRevisionRecord } from "./style-revisions";

export interface CollectionMatrixInput {
  readonly collections: readonly CollectionRecord[];
  readonly sourceStatuses?: readonly CollectionSourceStatus[];
  readonly styleRevisions: readonly StyleRevisionRecord[];
}

interface SourceNames {
  readonly colorways: ReadonlyMap<string, string>;
  readonly materials: ReadonlyMap<string, string>;
}

interface ResolvedPin {
  readonly status: CollectionSourceStatus;
  readonly revision: StyleRevisionRecord;
}

interface GroupMembership {
  readonly groupName: string;
  readonly materialName: string;
}

const key = (id: string): string => id.toLowerCase();
const skuKey = (collectionId: string, id: string): string => `${key(collectionId)}\u0000${key(id)}`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;",
  })[character]!);
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function sourceName(
  names: ReadonlyMap<string, string> | undefined,
  id: string,
  kind: "colorway" | "material",
): string {
  const name = names?.get(key(id));
  if (name) return escapeHtml(name);
  const fallback = names ? `Unnamed source ${kind}` : `Source ${kind} name unavailable`;
  return `${fallback} (ID ${escapeHtml(shortId(id))})`;
}

function namesById(records: readonly { readonly id: string; readonly name: { readonly value: string | null } }[]): ReadonlyMap<string, string> {
  const names = new Map<string, string>();
  for (const record of records) {
    const name = record.name.value?.trim();
    if (name) names.set(key(record.id), name);
  }
  return names;
}

function pinForSku(
  collectionId: string,
  sku: CollectionSku,
  statuses: ReadonlyMap<string, CollectionSourceStatus>,
  revisions: ReadonlyMap<string, StyleRevisionRecord>,
): ResolvedPin | undefined {
  const status = statuses.get(skuKey(collectionId, sku.id));
  const revision = revisions.get(key(sku.styleRevisionId));
  if (!status || !revision
    || key(status.styleId) !== key(sku.styleId)
    || key(status.styleRevisionId) !== key(sku.styleRevisionId)
    || key(revision.styleId) !== key(sku.styleId)) return undefined;
  return { status, revision };
}

function pinState(pin: ResolvedPin | undefined): { readonly name: string; readonly text: string } {
  if (!pin) return {
    name: "unresolved",
    text: "Unresolved — the saved style/revision status is unavailable; current or stale state is unknown.",
  };
  const { status } = pin;
  const text = status.isStale
    ? `Stale pin — still uses saved revision r${status.pinnedRevisionNumber}; current style head is r${status.headRevisionNumber}.`
    : `Current pin — saved revision r${status.pinnedRevisionNumber} is the current style head.`;
  return {
    name: status.isStale ? "stale" : "current",
    text: `${text}${status.isArchived ? " Source style is archived; its saved revision remains retained." : ""}`,
  };
}

function sourceNamesForSku(
  sku: CollectionSku,
  revisions: ReadonlyMap<string, StyleRevisionRecord>,
  names: ReadonlyMap<string, SourceNames>,
): SourceNames | undefined {
  const revision = revisions.get(key(sku.styleRevisionId));
  if (!revision || key(revision.styleId) !== key(sku.styleId)) return undefined;
  return names.get(key(revision.revisionId));
}

function renderSku(
  collectionId: string,
  sku: CollectionSku,
  statuses: ReadonlyMap<string, CollectionSourceStatus>,
  revisions: ReadonlyMap<string, StyleRevisionRecord>,
  sourceNames: ReadonlyMap<string, SourceNames>,
  memberships: readonly GroupMembership[],
): string {
  const pin = pinForSku(collectionId, sku, statuses, revisions);
  const state = pinState(pin);
  const styleLabel = pin ? escapeHtml(pin.status.styleName) : `Style ${escapeHtml(shortId(sku.styleId))}`;
  const revisionLabel = pin
    ? `r${pin.revision.revisionNumber} · ${escapeHtml(shortId(sku.styleRevisionId))}`
    : `Unresolved · ${escapeHtml(shortId(sku.styleRevisionId))}`;
  const names = sourceNamesForSku(sku, revisions, sourceNames);
  const colorways = sku.colorways.length === 0
    ? `<p>No local colorways linked.</p>`
    : `<ul>${sku.colorways.map((colorway) => `<li><strong>${escapeHtml(colorway.name)}</strong>` +
      `<span>Source: ${sourceName(names?.colorways, colorway.sourceColorwayId, "colorway")}</span></li>`).join("")}</ul>`;
  const sharedGroups = memberships.length === 0
    ? `<p>No shared-material group membership.</p>`
    : `<ul>${memberships.map((membership) => `<li><strong>${escapeHtml(membership.groupName)}</strong>` +
      `<span>Source material: ${membership.materialName}</span></li>`).join("")}</ul>`;
  return `<article class="project-collection-sku" aria-label="${escapeHtml(sku.code)} · ${escapeHtml(sku.name)}">` +
    `<h5>${escapeHtml(sku.code)} · ${escapeHtml(sku.name)}</h5>` +
    `<dl><div><dt>Style</dt><dd>${styleLabel} · ID ${escapeHtml(shortId(sku.styleId))}</dd></div>` +
    `<div><dt>Pinned revision</dt><dd>${revisionLabel}</dd></div>` +
    `<div><dt>Size plan</dt><dd>${escapeHtml(sku.sizePlan.name)} · ${sku.sizePlan.sizeIds.map(escapeHtml).join(", ")}</dd></div></dl>` +
    `<p class="project-collection-pin-state" data-state="${state.name}">${state.text}</p>` +
    `<section><h6>Colorways</h6>${colorways}</section>` +
    `<section><h6>Shared-material groups</h6>${sharedGroups}</section></article>`;
}

function renderCollection(
  collection: CollectionRecord,
  statuses: ReadonlyMap<string, CollectionSourceStatus>,
  revisions: ReadonlyMap<string, StyleRevisionRecord>,
  sourceNames: ReadonlyMap<string, SourceNames>,
): string {
  const skuById = new Map(collection.skus.map((sku) => [key(sku.id), sku] as const));
  const membershipsBySku = new Map<string, GroupMembership[]>();
  const groupCards = collection.sharedMaterialGroups.map((group) => {
    const memberRows = group.members.map((member) => {
      const sku = skuById.get(key(member.skuId));
      const names = sku ? sourceNamesForSku(sku, revisions, sourceNames) : undefined;
      const materialName = sourceName(names?.materials, member.materialId, "material");
      if (sku) {
        const memberships = membershipsBySku.get(key(sku.id)) ?? [];
        memberships.push({ groupName: group.name, materialName });
        membershipsBySku.set(key(sku.id), memberships);
      }
      const memberLabel = sku
        ? `${escapeHtml(sku.code)} · ${escapeHtml(sku.name)}`
        : `Unresolved SKU (ID ${escapeHtml(shortId(member.skuId))})`;
      const memberState = sku ? pinState(pinForSku(collection.id, sku, statuses, revisions)).text
        : "Unresolved — the member SKU row is missing.";
      return `<li><strong>${memberLabel}</strong><span>${materialName}</span><span>${memberState}</span></li>`;
    }).join("");
    const rows = group.members.length === 0 ? `<p>No member details are available.</p>` : `<ul>${memberRows}</ul>`;
    return `<article><h6>${escapeHtml(group.name)}</h6>${rows}</article>`;
  }).join("");
  const skus = collection.skus.length === 0
    ? `<p>No SKUs saved in this collection.</p>`
    : `<div class="project-collection-skus">${collection.skus.map((sku) => renderSku(
      collection.id,
      sku,
      statuses,
      revisions,
      sourceNames,
      membershipsBySku.get(key(sku.id)) ?? [],
    )).join("")}</div>`;
  const groups = collection.sharedMaterialGroups.length === 0 ? "" :
    `<section class="project-collection-groups"><h5>User-entered shared-material groups</h5>${groupCards}</section>`;
  return `<section class="project-collection-card" aria-label="${escapeHtml(collection.name)} collection">` +
    `<h4>${escapeHtml(collection.name)}</h4>${skus}${groups}</section>`;
}

/** Render the validated saved collection graph without adding controls or mutating project state. */
export function renderCollectionMatrix(input: CollectionMatrixInput): string {
  if (input.collections.length === 0) return "";

  const pinnedIds = new Set(input.collections.flatMap((collection) => collection.skus.map((sku) => key(sku.styleRevisionId))));
  const revisions = new Map<string, StyleRevisionRecord>();
  for (const revision of input.styleRevisions) {
    const id = key(revision.revisionId);
    if (pinnedIds.has(id)) revisions.set(id, revision);
  }
  const sourceNames = new Map<string, SourceNames>();
  for (const [id, revision] of revisions) {
    if (revision.payload.payloadVersion !== 2) continue;
    sourceNames.set(id, {
      colorways: namesById(revision.payload.techPack.colorways),
      materials: namesById(revision.payload.techPack.materials),
    });
  }
  const statuses = new Map<string, CollectionSourceStatus>();
  for (const status of input.sourceStatuses ?? []) {
    statuses.set(skuKey(status.collectionId, status.skuId), status);
  }
  const collections = input.collections.map((collection) => renderCollection(collection, statuses, revisions, sourceNames)).join("");
  return `<section class="project-collection-matrix" aria-label="Collection and SKU matrix">` +
    `<h3>Collection and SKU matrix</h3>` +
    `<p>Saved collection sources are read-only here. Stale pins stay on their saved revision. Shared-material groups are user-entered categories; they do not establish material equivalence, supplier availability or physical performance.</p>` +
    collections + `</section>`;
}
