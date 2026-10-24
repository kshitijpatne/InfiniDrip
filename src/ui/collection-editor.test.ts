import { describe, expect, it } from "vitest";
import { parseCollectionRecord, type CollectionRecord, type CollectionSku } from "./collection-records";
import {
  collectionDraftsAreDirty,
  emptyCollectionColorway,
  emptyCollectionRecord,
  emptyCollectionSku,
  emptyCollectionVariant,
  emptySharedMaterialGroup,
  prepareCollectionRecordsForSave,
  reduceCollectionDrafts,
  renderCollectionEditor,
  updateCollectionDraftField,
} from "./collection-editor";
import type { CollectionSourceStatus } from "./collection-source-validation";
import type { CollectionDraftAction, CollectionFieldUpdate } from "./collection-editor";
import { SCENARIO_PROJECT_RECORD_VERSION, type ProjectRecord, type StyleRecord } from "./project-records";
import type { StyleRevisionRecord } from "./style-revisions";

const TIME = "2026-10-01T12:00:00.000Z";
const PROJECT = "11111111-1111-4111-8111-000000000001";
const STYLE = "22222222-2222-4222-8222-000000000001";
const REVISION = "33333333-3333-4333-8333-000000000001";
const REVISION_TWO = "33333333-3333-4333-8333-000000000002";
const COLLECTION = "44444444-4444-4444-8444-000000000001";
const SKU_ONE = "55555555-5555-4555-8555-000000000001";
const SKU_TWO = "55555555-5555-4555-8555-000000000002";
const SKU_THREE = "55555555-5555-4555-8555-000000000003";
const COLORWAY = "66666666-6666-4666-8666-000000000001";
const COLORWAY_TWO = "66666666-6666-4666-8666-000000000002";
const COLORWAY_SOURCE = "77777777-7777-4777-8777-000000000001";
const COLORWAY_SOURCE_TWO = "77777777-7777-4777-8777-000000000002";
const VARIANT = "88888888-8888-4888-8888-000000000001";
const GROUP = "99999999-9999-4999-8999-000000000001";
const MATERIAL = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const MATERIAL_TWO = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2";

function sku(id: string, code: string, sourceColorway = COLORWAY_SOURCE): CollectionSku {
  const colorwayId = id === SKU_ONE ? COLORWAY : "66666666-6666-4666-8666-000000000002";
  return {
    id, code, name: `${code} name`, styleId: STYLE, styleRevisionId: REVISION,
    sizePlan: { id: id === SKU_ONE ? "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1" : "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", name: "Core", sizeIds: ["M", "L"] },
    colorways: [{ id: colorwayId, name: "Ink & <mist>", sourceColorwayId: sourceColorway }],
    variants: id === SKU_ONE ? [{ id: VARIANT, skuCode: "TEE-M-INK", sizeId: "M", colorwayId }] : [],
  };
}

function collection(overrides: Partial<CollectionRecord> = {}): CollectionRecord {
  return {
    schemaVersion: 1,
    id: COLLECTION,
    projectId: PROJECT,
    name: "Spring",
    createdAt: TIME,
    updatedAt: TIME,
    revision: 1,
    skus: [sku(SKU_ONE, "TEE-A"), sku(SKU_TWO, "TEE-B", COLORWAY_SOURCE_TWO)],
    sharedMaterialGroups: [{
      id: GROUP,
      name: "User category",
      members: [{ skuId: SKU_ONE, materialId: MATERIAL }, { skuId: SKU_TWO, materialId: MATERIAL_TWO }],
    }],
    ...overrides,
  };
}

function style(head = REVISION, archivedAt: string | null = null): StyleRecord {
  return { id: STYLE, projectId: PROJECT, name: "Tee", recipeId: "tee", archivedAt, revisionHeadId: head } as StyleRecord;
}

function revision(revisionId = REVISION, revisionNumber = 1): StyleRevisionRecord {
  return {
    schemaVersion: 1,
    revisionId,
    styleId: STYLE,
    revisionNumber,
    parentRevisionId: null,
    createdAt: TIME,
    canonicalization: "RFC8785",
    digestAlgorithm: "SHA-256",
    revisionContentDigest: "digest",
    payload: {
      payloadVersion: 2,
      styleId: STYLE,
      revisionId,
      techPack: {
        colorways: [
          { id: COLORWAY_SOURCE, name: { value: "Ink & <deep>" } },
          { id: COLORWAY_SOURCE_TWO, name: { value: "Fog" } },
        ],
        materials: [
          { id: MATERIAL, name: { value: "Cotton twill" } },
          { id: MATERIAL_TWO, name: { value: "Linen blend" } },
        ],
      },
    },
  } as unknown as StyleRevisionRecord;
}

function status(overrides: Partial<CollectionSourceStatus> = {}): CollectionSourceStatus {
  return {
    collectionId: COLLECTION,
    collectionName: "Spring",
    skuId: SKU_ONE,
    skuCode: "TEE-A",
    skuName: "TEE-A name",
    styleId: STYLE,
    styleName: "Tee",
    styleRevisionId: REVISION,
    pinnedRevisionNumber: 1,
    headRevisionNumber: 1,
    isStale: false,
    isArchived: false,
    ...overrides,
  };
}

function editorInput(overrides: Partial<Parameters<typeof renderCollectionEditor>[0]> = {}) {
  const record = collection();
  const project = {
    schemaVersion: 4,
    id: PROJECT,
    styleIds: [STYLE],
    brandProfile: null,
    collections: [record],
  } as unknown as ProjectRecord;
  return {
    project,
    collections: [record],
    savedCollections: [record],
    styles: [style()],
    styleRevisions: [revision()],
    sourceStatuses: [status(), status({ skuId: SKU_TWO, skuCode: "TEE-B", skuName: "TEE-B name" })],
    ...overrides,
  };
}

describe("collection editor draft model", () => {
  it("creates blank local records and applies graph operations without cascading shared references", () => {
    const blank = emptyCollectionRecord(PROJECT, COLLECTION, TIME);
    const newSku = emptyCollectionSku(SKU_ONE, SKU_TWO);
    const newColorway = emptyCollectionColorway(COLORWAY);
    const newVariant = emptyCollectionVariant(VARIANT);
    const newGroup = emptySharedMaterialGroup(GROUP);
    expect(blank).toMatchObject({ name: "", revision: 1, createdAt: TIME, updatedAt: TIME, skus: [], sharedMaterialGroups: [] });
    expect(newSku).toMatchObject({ code: "", name: "", styleId: "", styleRevisionId: "", sizePlan: { name: "", sizeIds: [] } });
    expect(newColorway).toEqual({ id: COLORWAY, name: "", sourceColorwayId: "" });
    expect(newVariant).toEqual({ id: VARIANT, skuCode: "", sizeId: "", colorwayId: "" });
    expect(newGroup).toEqual({ id: GROUP, name: "", members: [] });

    const original = collection();
    let drafts = reduceCollectionDrafts([original], { type: "add-sku", collectionId: COLLECTION, sku: newSku });
    expect(drafts[0]!.skus).toHaveLength(3);
    drafts = reduceCollectionDrafts(drafts, { type: "delete-sku", collectionId: COLLECTION, skuId: SKU_ONE.toUpperCase() });
    expect(drafts[0]!.skus.map((item) => item.id)).not.toContain(SKU_ONE);
    expect(drafts[0]!.sharedMaterialGroups[0]!.members[0]!.skuId).toBe(SKU_ONE);
    drafts = reduceCollectionDrafts(drafts, { type: "add-colorway", collectionId: COLLECTION, skuId: SKU_TWO, colorway: newColorway });
    drafts = reduceCollectionDrafts(drafts, { type: "delete-colorway", collectionId: COLLECTION, skuId: SKU_TWO, colorwayId: COLORWAY_TWO });
    drafts = reduceCollectionDrafts(drafts, { type: "add-variant", collectionId: COLLECTION, skuId: SKU_TWO, variant: newVariant });
    drafts = reduceCollectionDrafts(drafts, { type: "delete-variant", collectionId: COLLECTION, skuId: SKU_TWO, variantId: VARIANT });
    drafts = reduceCollectionDrafts(drafts, { type: "add-group", collectionId: COLLECTION, group: newGroup });
    drafts = reduceCollectionDrafts(drafts, { type: "add-member", collectionId: COLLECTION, groupId: GROUP });
    const members = drafts[0]!.sharedMaterialGroups[0]!.members;
    expect(members[members.length - 1]).toEqual({ skuId: "", materialId: "" });
    drafts = reduceCollectionDrafts(drafts, { type: "delete-member", collectionId: COLLECTION, groupId: GROUP, index: 0 });
    expect(drafts[0]!.sharedMaterialGroups[0]!.members).toHaveLength(2);
    drafts = reduceCollectionDrafts(drafts, { type: "delete-group", collectionId: COLLECTION, groupId: GROUP });
    const secondCollection = emptyCollectionRecord(PROJECT, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", TIME);
    drafts = reduceCollectionDrafts(drafts, { type: "add-collection", collection: secondCollection });
    expect(drafts).toHaveLength(2);
    expect(reduceCollectionDrafts(drafts, { type: "delete-collection", collectionId: COLLECTION })).toHaveLength(1);
    expect(reduceCollectionDrafts(drafts, { type: "delete-group", collectionId: "missing", groupId: GROUP })).toBe(drafts);

    const base = collection();
    const thirdSku: CollectionSku = {
      ...sku(SKU_TWO, "TEE-C"),
      id: SKU_THREE,
      sizePlan: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3", name: "Core", sizeIds: ["M", "L"] },
      colorways: [{ id: "66666666-6666-4666-8666-000000000003", name: "Ink", sourceColorwayId: COLORWAY_SOURCE }],
    };
    const withThreeMembers: CollectionRecord = {
      ...base,
      skus: [...base.skus, thirdSku],
      sharedMaterialGroups: [{
        ...base.sharedMaterialGroups[0]!,
        members: [...base.sharedMaterialGroups[0]!.members, { skuId: SKU_THREE, materialId: MATERIAL }],
      }],
    };
    const orphaned = reduceCollectionDrafts([withThreeMembers], {
      type: "delete-sku", collectionId: COLLECTION, skuId: SKU_ONE,
    })[0]!;
    expect(parseCollectionRecord(orphaned)).toEqual({
      ok: false,
      error: "collection.sharedMaterialGroups[0].members[0].skuId: reference a SKU in this collection.",
    });
  });

  it("updates every authored field and keeps raw whitespace and blank size lines", () => {
    let drafts: readonly CollectionRecord[] = [collection()];
    const edit = (update: Parameters<typeof updateCollectionDraftField>[1]): void => {
      drafts = updateCollectionDraftField(drafts, update);
    };
    edit({ collectionId: COLLECTION, scope: "collection", field: "name", value: "  Capsule  " });
    edit({ collectionId: COLLECTION, scope: "sku", skuId: SKU_ONE, field: "code", value: " NEW " });
    edit({ collectionId: COLLECTION, scope: "sku", skuId: SKU_ONE, field: "styleId", value: "bad style" });
    edit({ collectionId: COLLECTION, scope: "sizePlan", skuId: SKU_ONE, field: "name", value: "Sizes" });
    edit({ collectionId: COLLECTION, scope: "sizePlan", skuId: SKU_ONE, field: "sizeIds", value: " XS \n\nXL " });
    edit({ collectionId: COLLECTION, scope: "colorway", skuId: SKU_ONE, recordId: COLORWAY, field: "name", value: " Ink " });
    edit({ collectionId: COLLECTION, scope: "colorway", skuId: SKU_ONE, recordId: COLORWAY, field: "sourceColorwayId", value: COLORWAY_SOURCE_TWO });
    edit({ collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, recordId: VARIANT, field: "skuCode", value: " A-M " });
    edit({ collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, recordId: VARIANT, field: "sizeId", value: "M" });
    edit({ collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, recordId: VARIANT, field: "colorwayId", value: COLORWAY });
    edit({ collectionId: COLLECTION, scope: "group", recordId: GROUP, field: "name", value: "Group" });
    edit({ collectionId: COLLECTION, scope: "member", recordId: GROUP, index: 0, field: "skuId", value: SKU_TWO });
    edit({ collectionId: COLLECTION, scope: "member", recordId: GROUP, index: 0, field: "materialId", value: MATERIAL_TWO });
    const changed = drafts[0]!;
    expect(changed.name).toBe("  Capsule  ");
    expect(changed.skus[0]!.code).toBe(" NEW ");
    expect(changed.skus[0]!.styleId).toBe("bad style");
    expect(changed.skus[0]!.sizePlan.sizeIds).toEqual([" XS ", "", "XL "]);
    expect(changed.skus[0]!.colorways[0]!.name).toBe(" Ink ");
    expect(changed.skus[0]!.variants[0]!.skuCode).toBe(" A-M ");
    expect(changed.sharedMaterialGroups[0]!.members[0]).toEqual({ skuId: SKU_TWO, materialId: MATERIAL_TWO });
    const unchanged = updateCollectionDraftField(drafts, {
      collectionId: "missing", scope: "collection", field: "name", value: "ignored",
    });
    expect(unchanged).toBe(drafts);
    expect(updateCollectionDraftField(drafts, {
      collectionId: COLLECTION, scope: "member", recordId: GROUP, index: -1, field: "name", value: "ignored",
    })[0]).toBe(changed);

    const noOpEdits: CollectionFieldUpdate[] = [
      { collectionId: COLLECTION, scope: "collection", field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "sku", skuId: SKU_ONE, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "sizePlan", skuId: SKU_ONE, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "colorway", skuId: SKU_ONE, recordId: COLORWAY, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "colorway", skuId: SKU_ONE, recordId: "missing", field: "name", value: "ignored" },
      { collectionId: COLLECTION, scope: "colorway", skuId: SKU_ONE, field: "name", value: "ignored" },
      { collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, recordId: VARIANT, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, recordId: "missing", field: "skuCode", value: "ignored" },
      { collectionId: COLLECTION, scope: "variant", skuId: SKU_ONE, field: "skuCode", value: "ignored" },
      { collectionId: COLLECTION, scope: "group", recordId: GROUP, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "group", recordId: "missing", field: "name", value: "ignored" },
      { collectionId: COLLECTION, scope: "group", field: "name", value: "ignored" },
      { collectionId: COLLECTION, scope: "member", recordId: GROUP, field: "skuId", value: "ignored" },
      { collectionId: COLLECTION, scope: "member", recordId: GROUP, index: 0, field: "unknown", value: "ignored" },
      { collectionId: COLLECTION, scope: "member", recordId: "missing", index: 0, field: "skuId", value: "ignored" },
    ];
    for (const noOp of noOpEdits) {
      expect(updateCollectionDraftField([changed], noOp)[0]).toEqual(changed);
    }

    const unknownAction = { type: "unsupported" } as unknown as CollectionDraftAction;
    const actionSource = [changed];
    expect(reduceCollectionDrafts(actionSource, unknownAction)).toBe(actionSource);
    expect(reduceCollectionDrafts(actionSource, {
      type: "add-variant", collectionId: COLLECTION, skuId: "missing", variant: emptyCollectionVariant(VARIANT),
    })[0]).toEqual(changed);
    expect(reduceCollectionDrafts(actionSource, { type: "add-member", collectionId: COLLECTION, groupId: "missing" })[0]).toEqual(changed);
  });

  it("prepares changed-only revision metadata and preserves the live draft on rejected candidates", () => {
    const saved = collection();
    const unchanged = prepareCollectionRecordsForSave([saved], [saved], TIME);
    expect(unchanged[0]).toBe(saved);
    const changed = { ...saved, name: "Summer" };
    const candidate = prepareCollectionRecordsForSave([changed], [saved], TIME)[0]!;
    expect(candidate).toMatchObject({ revision: 2, createdAt: saved.createdAt });
    expect(Date.parse(candidate.updatedAt)).toBeGreaterThan(Date.parse(saved.updatedAt));
    expect(changed).toMatchObject({ revision: 1, updatedAt: saved.updatedAt });
    const added = prepareCollectionRecordsForSave([emptyCollectionRecord(PROJECT, SKU_ONE, TIME)], [], TIME)[0]!;
    expect(added.revision).toBe(1);
    expect(() => prepareCollectionRecordsForSave([changed], [saved], "not-a-time")).toThrow("canonical UTC ISO timestamp");
    expect(() => prepareCollectionRecordsForSave(
      [{ ...changed, name: "Beyond supported revisions" }],
      [{ ...saved, revision: Number.MAX_SAFE_INTEGER }],
      TIME,
    )).toThrow("maximum supported value");
    expect(collectionDraftsAreDirty([changed], [saved])).toBe(true);
    expect(collectionDraftsAreDirty([saved], [saved])).toBe(false);
  });
});

describe("collection editor rendering", () => {
  it("shows exact frozen-revision choices, pin state and escaped authored text", () => {
    const escapedCollection = collection({ name: "Spring <Drop>" });
    const html = renderCollectionEditor(editorInput({
      collections: [escapedCollection],
      savedCollections: [escapedCollection],
    }));
    expect(html).toContain("Spring &lt;Drop&gt;");
    expect(html).toContain("Ink &amp; &lt;mist&gt;");
    expect(html).toContain("Ink &amp; &lt;deep&gt;");
    expect(html).toContain("Cotton twill");
    expect(html).toContain("Current pin — saved r1 is the current style head.");
    expect(html).toContain("Variant SKU code");
    expect(html).toContain("Size IDs · one per line");
    expect(html).toContain("Save collection changes");
    expect(html).toContain("data-collection-action=\"save\"  disabled");
    expect(html).not.toContain("Invalid source references remain in this draft until deliberately repaired.");

    const stale = renderCollectionEditor(editorInput({
      styles: [style(REVISION_TWO)],
      styleRevisions: [revision(REVISION), revision(REVISION_TWO, 2)],
    }));
    expect(stale).toContain("Stale pin — saved r1; current style head r2.");
    expect(stale).not.toContain("Invalid source references remain in this draft until deliberately repaired.");

    const scenarioInput = editorInput();
    const scenarioProject = {
      ...scenarioInput.project,
      schemaVersion: SCENARIO_PROJECT_RECORD_VERSION,
      scenarios: [],
    } as unknown as ProjectRecord;
    const scenarioHtml = renderCollectionEditor({ ...scenarioInput, project: scenarioProject });
    expect(scenarioHtml).toContain("Current pin — saved r1 is the current style head.");
    expect(scenarioHtml).not.toContain("Invalid source references remain in this draft until deliberately repaired.");
  });

  it("keeps invalid source IDs visible and marks unresolved or archived references", () => {
    const invalidSource = collection({
      skus: [sku(SKU_ONE, "TEE-A", MATERIAL), sku(SKU_TWO, "TEE-B", COLORWAY_SOURCE_TWO)],
      name: "",
    });
    const invalidHtml = renderCollectionEditor(editorInput({
      collections: [invalidSource],
      sourceStatuses: [status({ isArchived: true }), status({ skuId: SKU_TWO, skuCode: "TEE-B", skuName: "TEE-B name" })],
    }));
    expect(invalidHtml).toContain("collection.name: enter a name");
    expect(invalidHtml).toContain(`value=\"${MATERIAL}\" selected>Unresolved saved ID`);
    expect(invalidHtml).toContain("Source style is archived; the saved revision remains available.");
    expect(invalidHtml).not.toContain("Unresolved — choose a project style");

    const unresolved = renderCollectionEditor(editorInput({ collections: [collection({
      skus: [sku(SKU_ONE, "TEE-A", MATERIAL), sku(SKU_TWO, "TEE-B", COLORWAY_SOURCE_TWO)],
    })] }));
    expect(unresolved).toContain("Unresolved — choose a project style and one of its immutable revisions.");
    expect(unresolved).toContain("collections[0].skus[0].colorways[0].sourceColorwayId: not present in the pinned revision");
    expect(unresolved).toContain("Invalid source references remain in this draft until deliberately repaired.");

    const archived = renderCollectionEditor(editorInput({ styles: [style(REVISION, TIME)] }));
    expect(archived).toContain("Source style is archived; the saved revision remains available.");
    const disabled = renderCollectionEditor(editorInput({ disabled: true }));
    expect(disabled).toContain(`data-collection-action=\"add-collection\"  disabled`);
  });

  it("renders empty graphs, unresolved nested IDs, unsupported source versions and source-name fallbacks", () => {
    const noCollections = renderCollectionEditor(editorInput({ collections: [], savedCollections: [] }));
    expect(noCollections).toContain("No collections in this project.");

    const noRows = collection({ skus: [], sharedMaterialGroups: [] });
    const noRowsHtml = renderCollectionEditor(editorInput({ collections: [noRows], savedCollections: [noRows] }));
    expect(noRowsHtml).toContain("No SKU rows yet.");
    expect(noRowsHtml).toContain("No shared-material groups in this draft.");

    const blankGroup = emptySharedMaterialGroup("99999999-9999-4999-8999-000000000002");
    const unresolvedGroup = {
      ...emptySharedMaterialGroup("99999999-9999-4999-8999-000000000003"),
      name: "Unresolved member",
      members: [{ skuId: SKU_THREE, materialId: MATERIAL }],
    };
    const blankNamedColorwaySku = {
      ...sku(SKU_TWO, "TEE-B", MATERIAL),
      colorways: [{ id: COLORWAY_TWO, name: "", sourceColorwayId: MATERIAL }],
      variants: [{ id: VARIANT, skuCode: "TEE-B-M", sizeId: "M", colorwayId: COLORWAY_TWO }],
    };
    const blankSkuCollection = collection({
      name: "Blank graph",
      skus: [emptyCollectionSku(SKU_ONE, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4"), blankNamedColorwaySku],
      sharedMaterialGroups: [blankGroup, unresolvedGroup],
    });
    const blankGraphHtml = renderCollectionEditor(editorInput({
      collections: [blankSkuCollection], savedCollections: [], sourceStatuses: undefined,
    }));
    expect(blankGraphHtml).toContain("SKU · Unnamed");
    expect(blankGraphHtml).toContain("No colorways in this SKU draft.");
    expect(blankGraphHtml).toContain("No variants in this SKU draft.");
    expect(blankGraphHtml).toContain("Add at least two distinct SKU members to complete this group.");
    expect(blankGraphHtml).toContain(`Unresolved saved ID · ${SKU_THREE}`);
    expect(blankGraphHtml).toContain("Unresolved — choose a project style and one of its immutable revisions.");
    expect(blankGraphHtml).toContain("Unnamed colorway ·");

    const legacyRevision = { ...revision(), payload: { payloadVersion: 1 } } as unknown as StyleRevisionRecord;
    const legacyHtml = renderCollectionEditor(editorInput({
      collections: [collection()],
      savedCollections: [collection()],
      styleRevisions: [legacyRevision],
    }));
    expect(legacyHtml).toContain("source references require frozen T01 payload version 2");

    const unnamedRevision = {
      ...revision(),
      payload: {
        payloadVersion: 2,
        styleId: STYLE,
        revisionId: REVISION,
        techPack: {
          colorways: [{ id: COLORWAY_SOURCE, name: { value: "   " } }],
          materials: [{ id: MATERIAL, name: { value: "" } }, { id: MATERIAL_TWO, name: { value: null } }],
        },
      },
    } as unknown as StyleRevisionRecord;
    const unnamedHtml = renderCollectionEditor(editorInput({
      collections: [collection()],
      savedCollections: [collection()],
      styleRevisions: [unnamedRevision],
    }));
    expect(unnamedHtml).toContain("Unnamed colorway");
    expect(unnamedHtml).toContain("Unnamed material");

    const projectWithoutBrandProfile = {
      schemaVersion: 4,
      id: PROJECT,
      styleIds: [STYLE],
    } as unknown as ProjectRecord;
    const legacyProjectHtml = renderCollectionEditor(editorInput({
      project: projectWithoutBrandProfile,
      collections: [collection()],
      savedCollections: [collection()],
    }));
    expect(legacyProjectHtml).toContain("Current pin — saved r1 is the current style head.");

    const missingStyleCollection = collection({
      skus: collection().skus.map((item, index) => index === 0
        ? { ...item, styleId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3" }
        : item),
    });
    const missingStyleHtml = renderCollectionEditor(editorInput({
      collections: [missingStyleCollection],
      savedCollections: [missingStyleCollection],
    }));
    expect(missingStyleHtml).toContain("styleId: reference a style retained by this project.");
  });
});
