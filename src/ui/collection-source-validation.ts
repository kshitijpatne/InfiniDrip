/** Resolves collection source pins against immutable, project-owned style history. */
import type { CollectionRecord } from "./collection-records";
import { projectCollections, type RecordResult } from "./project-records";
import type { ProjectRecord, StyleRecord } from "./project-records";
import type { StyleRevisionRecord } from "./style-revisions";

export interface CollectionSourceStatus {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly skuId: string;
  readonly skuCode: string;
  readonly skuName: string;
  readonly styleId: string;
  readonly styleName: string;
  readonly styleRevisionId: string;
  readonly pinnedRevisionNumber: number;
  readonly headRevisionNumber: number;
  readonly isStale: boolean;
  readonly isArchived: boolean;
}

const key = (id: string): string => id.toLowerCase();

function fail<T>(error: string): RecordResult<T> {
  return { ok: false, error };
}

function materialReferencesBySku(collection: CollectionRecord): ReadonlyMap<string, readonly {
  readonly path: string;
  readonly materialId: string;
}[]> {
  const references = new Map<string, { path: string; materialId: string }[]>();
  for (const [groupIndex, group] of collection.sharedMaterialGroups.entries()) {
    for (const [memberIndex, member] of group.members.entries()) {
      const skuId = key(member.skuId);
      const current = references.get(skuId) ?? [];
      current.push({
        path: `sharedMaterialGroups[${groupIndex}].members[${memberIndex}].materialId`,
        materialId: member.materialId,
      });
      references.set(skuId, current);
    }
  }
  return references;
}

interface FrozenSourceIds {
  readonly colorways: ReadonlySet<string>;
  readonly materials: ReadonlySet<string>;
}

/** Source IDs are checked only against the named revision's frozen payload-v2 T01. */
export function resolveCollectionSourceStatuses(
  project: ProjectRecord,
  styles: readonly StyleRecord[],
  revisions: readonly StyleRevisionRecord[],
): RecordResult<readonly CollectionSourceStatus[]> {
  const collections = projectCollections(project);
  if (collections.length === 0) return { ok: true, value: [] };

  const styleById = new Map<string, StyleRecord>();
  for (const style of styles) {
    const styleId = key(style.id);
    if (styleById.has(styleId)) return fail(`styles.${style.id}: duplicate project style ID.`);
    styleById.set(styleId, style);
  }
  const revisionById = new Map<string, StyleRevisionRecord>();
  for (const revision of revisions) {
    const revisionId = key(revision.revisionId);
    if (revisionById.has(revisionId)) return fail(`styleRevisions.${revision.revisionId}: duplicate immutable revision ID.`);
    revisionById.set(revisionId, revision);
  }
  const projectStyleIds = new Set(project.styleIds.map(key));
  const sourceIdsByRevision = new Map<string, FrozenSourceIds>();

  const statuses: CollectionSourceStatus[] = [];
  for (const [collectionIndex, collection] of collections.entries()) {
    if (collection.projectId !== project.id) {
      return fail(`collections[${collectionIndex}].projectId: collection must belong to this project.`);
    }
    const materialRefsBySku = materialReferencesBySku(collection);
    for (const [skuIndex, sku] of collection.skus.entries()) {
      const path = `collections[${collectionIndex}].skus[${skuIndex}]`;
      const style = styleById.get(key(sku.styleId));
      if (!style || style.projectId !== project.id || !projectStyleIds.has(key(sku.styleId))) {
        return fail(`${path}.styleId: reference a style retained by this project.`);
      }
      const pinned = revisionById.get(key(sku.styleRevisionId));
      if (!pinned || key(pinned.styleId) !== key(style.id)) {
        return fail(`${path}.styleRevisionId: reference an immutable revision belonging to the linked style.`);
      }
      const headId = style.revisionHeadId;
      const head = headId === null ? undefined : revisionById.get(key(headId));
      if (!head || key(head.styleId) !== key(style.id)) {
        return fail(`${path}.styleRevisionId: linked style is missing its current immutable revision head.`);
      }

      const materialRefs = materialRefsBySku.get(key(sku.id)) ?? [];
      const hasSourceReferences = sku.colorways.length > 0 || materialRefs.length > 0;
      if (pinned.payload.payloadVersion !== 2) {
        if (hasSourceReferences) {
          const referencePath = sku.colorways.length > 0
            ? `${path}.colorways[0].sourceColorwayId`
            : `collections[${collectionIndex}].${materialRefs[0]!.path}`;
          return fail(`${referencePath}: source references require frozen T01 payload version 2 on the pinned revision.`);
        }
      } else {
        const pinnedRevisionId = key(pinned.revisionId);
        let sourceIds = sourceIdsByRevision.get(pinnedRevisionId);
        if (!sourceIds) {
          sourceIds = {
            colorways: new Set(pinned.payload.techPack.colorways.map((colorway) => key(colorway.id))),
            materials: new Set(pinned.payload.techPack.materials.map((material) => key(material.id))),
          };
          sourceIdsByRevision.set(pinnedRevisionId, sourceIds);
        }
        for (const [colorwayIndex, colorway] of sku.colorways.entries()) {
          if (!sourceIds.colorways.has(key(colorway.sourceColorwayId))) {
            return fail(`${path}.colorways[${colorwayIndex}].sourceColorwayId: not present in the pinned revision's frozen T01 colorways.`);
          }
        }
        for (const reference of materialRefs) {
          if (!sourceIds.materials.has(key(reference.materialId))) {
            return fail(`collections[${collectionIndex}].${reference.path}: not present in the pinned revision's frozen T01 materials.`);
          }
        }
      }

      statuses.push({
        collectionId: collection.id,
        collectionName: collection.name,
        skuId: sku.id,
        skuCode: sku.code,
        skuName: sku.name,
        styleId: style.id,
        styleName: style.name,
        styleRevisionId: pinned.revisionId,
        pinnedRevisionNumber: pinned.revisionNumber,
        headRevisionNumber: head.revisionNumber,
        isStale: key(pinned.revisionId) !== key(head.revisionId),
        isArchived: style.archivedAt !== null,
      });
    }
  }
  return { ok: true, value: statuses };
}
