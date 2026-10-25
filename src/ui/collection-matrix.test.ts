import { describe, expect, it } from "vitest";
import type { CollectionRecord, CollectionSku } from "./collection-records";
import type { CollectionSourceStatus } from "./collection-source-validation";
import type { StyleRevisionRecord } from "./style-revisions";
import { renderCollectionMatrix } from "./collection-matrix";

const COLLECTION_ID = "44000000-0000-4000-8000-000000000001";
const FIRST_SKU_ID = "44000000-0000-4000-8000-000000000002";
const SECOND_SKU_ID = "44000000-0000-4000-8000-000000000003";
const THIRD_SKU_ID = "44000000-0000-4000-8000-000000000004";
const STYLE_ID = "44000000-0000-4000-8000-000000000005";
const OTHER_STYLE_ID = "44000000-0000-4000-8000-000000000006";
const FIRST_REVISION_ID = "44000000-0000-4000-8000-000000000007";
const HEAD_REVISION_ID = "44000000-0000-4000-8000-000000000008";
const COLORWAY_ID = "44000000-0000-4000-8000-000000000009";
const MATERIAL_ID = "44000000-0000-4000-8000-000000000010";
const GROUP_ID = "44000000-0000-4000-8000-000000000011";

function sku(
  id: string,
  code: string,
  styleRevisionId = HEAD_REVISION_ID,
  styleId = STYLE_ID,
  colorways: CollectionSku["colorways"] = [],
): CollectionSku {
  return {
    id,
    code,
    name: `${code} style`,
    styleId,
    styleRevisionId,
    sizePlan: { id: `${id.slice(0, 8)}-0000-4000-8000-000000000012`, name: "Core sizes", sizeIds: ["XS", "M", "XL"] },
    colorways,
    variants: [],
  };
}

function collection(skus: readonly CollectionSku[], groups: CollectionRecord["sharedMaterialGroups"] = []): CollectionRecord {
  return {
    schemaVersion: 1,
    id: COLLECTION_ID,
    projectId: "44000000-0000-4000-8000-000000000020",
    name: "Spring line",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    revision: 1,
    skus,
    sharedMaterialGroups: groups,
  };
}

function revision(
  revisionId: string,
  revisionNumber: number,
  colorwayName: string | null,
  materialName: string | null,
  styleId = STYLE_ID,
  payloadVersion: 1 | 2 = 2,
): StyleRevisionRecord {
  const payload = payloadVersion === 2
    ? {
      payloadVersion,
      styleId,
      revisionId,
      parentRevisionId: null,
      revisionNumber,
      ruleVersions: {},
      design: {},
      fieldObservations: {},
      artwork: [],
      techPack: {
        colorways: [{ id: COLORWAY_ID, name: { value: colorwayName } }],
        materials: [{ id: MATERIAL_ID, name: { value: materialName } }],
      },
    }
    : {
      payloadVersion,
      styleId,
      revisionId,
      parentRevisionId: null,
      revisionNumber,
      ruleVersions: {},
      design: {},
      fieldObservations: {},
      artwork: [],
    };
  return {
    schemaVersion: 1,
    revisionId,
    styleId,
    revisionNumber,
    parentRevisionId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    canonicalization: "RFC8785",
    digestAlgorithm: "SHA-256",
    revisionContentDigest: "0".repeat(64),
    payload,
  } as unknown as StyleRevisionRecord;
}

function status(
  skuId: string,
  styleRevisionId: string,
  options: Partial<CollectionSourceStatus> = {},
): CollectionSourceStatus {
  return {
    collectionId: COLLECTION_ID,
    collectionName: "Spring line",
    skuId,
    skuCode: skuId,
    skuName: `${skuId} style`,
    styleId: STYLE_ID,
    styleName: "Everyday tee",
    styleRevisionId,
    pinnedRevisionNumber: styleRevisionId === FIRST_REVISION_ID ? 1 : 2,
    headRevisionNumber: 2,
    isStale: styleRevisionId === FIRST_REVISION_ID,
    isArchived: false,
    ...options,
  };
}

describe("renderCollectionMatrix", () => {
  it("renders the exact pinned snapshot, source state, authored size plan and material membership", () => {
    const oldSku = sku(FIRST_SKU_ID, "TEE-OLD", FIRST_REVISION_ID, STYLE_ID, [
      { id: "44000000-0000-4000-8000-000000000021", name: "Night & <Ink>", sourceColorwayId: COLORWAY_ID },
    ]);
    const currentSku = sku(SECOND_SKU_ID, "TEE-CURRENT", HEAD_REVISION_ID, STYLE_ID, [
      { id: "44000000-0000-4000-8000-000000000022", name: "Bright red", sourceColorwayId: COLORWAY_ID },
    ]);
    const archivedSku = sku(THIRD_SKU_ID, "TEE-ARCHIVE");
    const inputCollection = collection([oldSku, currentSku, archivedSku], [{
      id: GROUP_ID,
      name: "Cross-SKU & shared",
      members: [
        { skuId: FIRST_SKU_ID, materialId: MATERIAL_ID },
        { skuId: SECOND_SKU_ID, materialId: MATERIAL_ID },
      ],
    }]);
    const html = renderCollectionMatrix({
      collections: [inputCollection],
      sourceStatuses: [
        status(FIRST_SKU_ID, FIRST_REVISION_ID, { styleName: "Everyday <tee>" }),
        status(SECOND_SKU_ID, HEAD_REVISION_ID),
        status(THIRD_SKU_ID, HEAD_REVISION_ID, { isStale: false, isArchived: true }),
      ],
      styleRevisions: [
        revision(FIRST_REVISION_ID, 1, "Draft <navy>", "Cotton & twill"),
        revision(HEAD_REVISION_ID, 2, "Current red", "Recycled jersey"),
      ],
    });

    expect(html).toContain("Collection and SKU matrix");
    expect(html).toContain("Night &amp; &lt;Ink&gt;");
    expect(html).toContain("Everyday &lt;tee&gt;");
    const oldRow = html.match(/<article class="project-collection-sku" aria-label="TEE-OLD · TEE-OLD style">([\s\S]*?)<\/article>/)?.[1] ?? "";
    const currentRow = html.match(/<article class="project-collection-sku" aria-label="TEE-CURRENT · TEE-CURRENT style">([\s\S]*?)<\/article>/)?.[1] ?? "";
    expect(oldRow).toContain("Draft &lt;navy&gt;");
    expect(oldRow).not.toContain("Current red");
    expect(currentRow).toContain("Current red");
    expect(html).toContain("Current pin — saved revision r2 is the current style head.");
    expect(html).toContain("Stale pin — still uses saved revision r1; current style head is r2.");
    expect(html).toContain("Source style is archived; its saved revision remains retained.");
    expect(html).toContain("Core sizes · XS, M, XL");
    expect(html).toContain("Cross-SKU &amp; shared");
    expect(html).toContain("Cotton &amp; twill");
    expect(html).toContain("Recycled jersey");
    expect(html).toContain("No local colorways linked.");
    expect(html).toContain("No shared-material group membership.");
    expect(html).toContain("do not establish material equivalence, supplier availability or physical performance");
    expect(html).not.toContain("data-collection-action");
  });

  it("shows empty and unresolved states without substituting the mutable style head", () => {
    expect(renderCollectionMatrix({ collections: [], styleRevisions: [] })).toBe("");

    const emptyCollection = collection([]);
    const missingRevisionSku = sku(SECOND_SKU_ID, "TEE-UNRESOLVED", "44000000-0000-4000-8000-000000000099", STYLE_ID, [
      { id: "44000000-0000-4000-8000-000000000023", name: "Local", sourceColorwayId: COLORWAY_ID },
    ]);
    const noStatusSku = sku(FIRST_SKU_ID, "TEE-NO-STATUS");
    const mismatchedStyleStatusSku = sku(THIRD_SKU_ID, "TEE-WRONG-STATUS-STYLE");
    const mismatchedRevisionStatusSku = sku("44000000-0000-4000-8000-000000000026", "TEE-WRONG-STATUS-REVISION");
    const unknownStyleSku = sku("44000000-0000-4000-8000-000000000027", "TEE-WRONG-STYLE", HEAD_REVISION_ID, OTHER_STYLE_ID, [
      { id: "44000000-0000-4000-8000-000000000024", name: "Local", sourceColorwayId: COLORWAY_ID },
    ]);
    const html = renderCollectionMatrix({
      collections: [emptyCollection, collection([noStatusSku, missingRevisionSku, mismatchedStyleStatusSku, mismatchedRevisionStatusSku, unknownStyleSku])],
      sourceStatuses: [
        status(SECOND_SKU_ID, missingRevisionSku.styleRevisionId),
        status(THIRD_SKU_ID, HEAD_REVISION_ID, { styleId: OTHER_STYLE_ID }),
        status(mismatchedRevisionStatusSku.id, FIRST_REVISION_ID),
        status(unknownStyleSku.id, HEAD_REVISION_ID, { styleId: OTHER_STYLE_ID }),
      ],
      styleRevisions: [
        revision(FIRST_REVISION_ID, 1, "Old revision only", "Old material"),
        revision(HEAD_REVISION_ID, 2, "Current head only", "Current material"),
      ],
    });

    expect(html).toContain("No SKUs saved in this collection.");
    expect(html).toContain("Unresolved — the saved style/revision status is unavailable; current or stale state is unknown.");
    expect(html).toContain("Source colorway name unavailable (ID 44000000)");
    expect(html).not.toContain("Current head only");
    expect(html.match(/data-state="unresolved"/g)).toHaveLength(5);
  });

  it("uses unnamed-source fallbacks and marks a legacy pin's names unavailable", () => {
    const unnamedSku = sku(FIRST_SKU_ID, "TEE-UNNAMED", FIRST_REVISION_ID, STYLE_ID, [
      { id: "44000000-0000-4000-8000-000000000025", name: "Local", sourceColorwayId: COLORWAY_ID },
    ]);
    const legacySku = sku(SECOND_SKU_ID, "TEE-LEGACY", HEAD_REVISION_ID);
    const html = renderCollectionMatrix({
      collections: [collection([unnamedSku, legacySku], [{
        id: GROUP_ID,
        name: "Legacy group",
        members: [{ skuId: SECOND_SKU_ID, materialId: MATERIAL_ID }, { skuId: FIRST_SKU_ID, materialId: MATERIAL_ID }],
      }])],
      sourceStatuses: [status(FIRST_SKU_ID, FIRST_REVISION_ID), status(SECOND_SKU_ID, HEAD_REVISION_ID, { isStale: false })],
      styleRevisions: [
        revision(FIRST_REVISION_ID, 1, null, null),
        revision(HEAD_REVISION_ID, 2, null, null, STYLE_ID, 1),
      ],
    });

    expect(html).toContain("Unnamed source colorway (ID 44000000)");
    expect(html).toContain("Unnamed source material (ID 44000000)");
    expect(html).toContain("Source material name unavailable (ID 44000000)");
  });

  it("keeps malformed missing group members visible as unresolved", () => {
    const html = renderCollectionMatrix({
      collections: [collection([], [{ id: GROUP_ID, name: "Incomplete group", members: [
        { skuId: "44000000-0000-4000-8000-000000000098", materialId: MATERIAL_ID },
      ] }, { id: "44000000-0000-4000-8000-000000000028", name: "Empty group", members: [] }])],
      styleRevisions: [],
    });

    expect(html).toContain("Unresolved SKU (ID 44000000)");
    expect(html).toContain("Unresolved — the member SKU row is missing.");
    expect(html).toContain("Source material name unavailable (ID 44000000)");
    expect(html).toContain("No member details are available.");
  });
});
