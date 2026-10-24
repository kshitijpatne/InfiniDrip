import { describe, expect, it } from "vitest";
import {
  COLLECTION_GRAPH_ENTRY_LIMIT,
  COLLECTION_RECORD_VERSION,
  parseCollectionRecord,
  type CollectionRecord,
} from "./collection-records";

const ID = {
  collection: "10000000-0000-4000-8000-000000000001",
  project: "10000000-0000-4000-8000-000000000002",
  skuOne: "10000000-0000-4000-8000-000000000003",
  skuTwo: "10000000-0000-4000-8000-000000000004",
  styleOne: "10000000-0000-4000-8000-000000000005",
  revisionOne: "10000000-0000-4000-8000-000000000006",
  planOne: "10000000-0000-4000-8000-000000000007",
  colorwayOne: "10000000-0000-4000-8000-000000000008",
  sourceColorwayOne: "10000000-0000-4000-8000-000000000009",
  variantOne: "10000000-0000-4000-8000-000000000010",
  styleTwo: "10000000-0000-4000-8000-000000000011",
  revisionTwo: "10000000-0000-4000-8000-000000000012",
  planTwo: "10000000-0000-4000-8000-000000000013",
  colorwayTwo: "10000000-0000-4000-8000-000000000014",
  sourceColorwayTwo: "10000000-0000-4000-8000-000000000015",
  variantTwo: "10000000-0000-4000-8000-000000000016",
  materialGroup: "10000000-0000-4000-8000-000000000017",
  materialOne: "10000000-0000-4000-8000-000000000018",
  materialTwo: "10000000-0000-4000-8000-000000000019",
} as const;

type Input = Record<string, unknown>;

function validCollection(): CollectionRecord {
  return {
    schemaVersion: COLLECTION_RECORD_VERSION,
    id: ID.collection,
    projectId: ID.project,
    name: "Autumn Study",
    createdAt: "2026-10-24T00:00:00.000Z",
    updatedAt: "2026-10-24T00:01:00.000Z",
    revision: 1,
    skus: [
      {
        id: ID.skuOne,
        code: "TOP-01",
        name: "Everyday tee",
        styleId: ID.styleOne,
        styleRevisionId: ID.revisionOne,
        sizePlan: { id: ID.planOne, name: "Alpha sizes", sizeIds: ["S", "M"] },
        colorways: [{ id: ID.colorwayOne, name: "Ink", sourceColorwayId: ID.sourceColorwayOne }],
        variants: [{ id: ID.variantOne, skuCode: "TOP-INK-S", sizeId: "S", colorwayId: ID.colorwayOne }],
      },
      {
        id: ID.skuTwo,
        code: "BOTTOM-01",
        name: "Straight trouser",
        styleId: ID.styleTwo,
        styleRevisionId: ID.revisionTwo,
        sizePlan: { id: ID.planTwo, name: "Beta sizes", sizeIds: ["S", "M"] },
        colorways: [{ id: ID.colorwayTwo, name: "Fog", sourceColorwayId: ID.sourceColorwayTwo }],
        variants: [{ id: ID.variantTwo, skuCode: "BOTTOM-FOG-M", sizeId: "M", colorwayId: ID.colorwayTwo }],
      },
    ],
    sharedMaterialGroups: [{
      id: ID.materialGroup,
      name: "Possible woven shell",
      members: [
        { skuId: ID.skuOne, materialId: ID.materialOne },
        { skuId: ID.skuTwo, materialId: ID.materialTwo },
      ],
    }],
  };
}

function mutableCollection(): Input {
  return structuredClone(validCollection()) as unknown as Input;
}

function sku(input: Input, index = 0): Record<string, unknown> {
  return (input.skus as Record<string, unknown>[])[index];
}

function sizePlan(input: Input, index = 0): Record<string, unknown> {
  return sku(input, index).sizePlan as Record<string, unknown>;
}

function colorway(input: Input, skuIndex = 0, colorwayIndex = 0): Record<string, unknown> {
  return (sku(input, skuIndex).colorways as Record<string, unknown>[])[colorwayIndex];
}

function variant(input: Input, skuIndex = 0, variantIndex = 0): Record<string, unknown> {
  return (sku(input, skuIndex).variants as Record<string, unknown>[])[variantIndex];
}

function materialGroup(input: Input, index = 0): Record<string, unknown> {
  return (input.sharedMaterialGroups as Record<string, unknown>[])[index];
}

function member(input: Input, groupIndex = 0, memberIndex = 0): Record<string, unknown> {
  return (materialGroup(input, groupIndex).members as Record<string, unknown>[])[memberIndex];
}

function expectError(input: unknown, expected: string): void {
  const result = parseCollectionRecord(input);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error).toBe(expected);
}

describe("Collection record contract", () => {
  it("accepts a multi-SKU graph with separate source-bound size plans, colorways, variants and user-linked materials", () => {
    const input = validCollection();
    const result = parseCollectionRecord(input);
    expect(result).toEqual({ ok: true, value: input });
    expect(result.ok && result.value).toBe(input);
    expect(input.skus[0].styleRevisionId).toBe(ID.revisionOne);
    expect(input.sharedMaterialGroups[0].members).toHaveLength(2);
  });

  it("accepts an empty collection shell and preserves authored text without normalization", () => {
    const input = {
      ...validCollection(),
      name: "  Autumn Study  ",
      skus: [],
      sharedMaterialGroups: [],
    };
    const emptyResult = parseCollectionRecord({ ...input, name: "Autumn Study" });
    const textResult = parseCollectionRecord(input);
    expect(emptyResult.ok).toBe(true);
    expect(textResult).toEqual({ ok: true, value: input });
  });

  it.each([null, [], "collection", 3])("rejects a non-object collection (%s)", (input) => {
    expectError(input, "collection: fields are incomplete or unknown.");
  });

  it.each([
    { schemaVersion: 1 },
    { ...validCollection(), extra: true },
  ])("rejects incomplete or unknown root fields", (input) => {
    expectError(input, "collection: fields are incomplete or unknown.");
  });

  it("rejects a missing required root field", () => {
    const input = mutableCollection();
    delete input.skus;
    expectError(input, "collection: fields are incomplete or unknown.");
  });

  it("rejects an unsupported schema version", () => {
    expectError({ ...validCollection(), schemaVersion: 2 }, "collection.schemaVersion: expected 1.");
  });

  it.each([
    ["id", 4, "collection.id: expected a UUID."],
    ["projectId", "missing", "collection.projectId: expected a project UUID."],
    ["name", " ", "collection.name: enter a name of at most 80 characters."],
    ["name", "x".repeat(81), "collection.name: enter a name of at most 80 characters."],
    ["createdAt", null, "collection.createdAt: expected a canonical ISO timestamp."],
    ["createdAt", "not a date", "collection.createdAt: expected a canonical ISO timestamp."],
    ["createdAt", "2026-10-24T00:00:00Z", "collection.createdAt: expected a canonical ISO timestamp."],
    ["updatedAt", "bad", "collection.updatedAt: expected a canonical ISO timestamp."],
    ["revision", 0, "collection.revision: expected a positive safe integer."],
    ["revision", 1.5, "collection.revision: expected a positive safe integer."],
    ["revision", Number.MAX_SAFE_INTEGER + 1, "collection.revision: expected a positive safe integer."],
    ["revision", "1", "collection.revision: expected a positive safe integer."],
  ] as const)("rejects invalid collection %s values", (field, value, expected) => {
    expectError({ ...validCollection(), [field]: value }, expected);
  });

  it("rejects an update time before creation", () => {
    expectError(
      { ...validCollection(), updatedAt: "2026-10-23T23:59:59.000Z" },
      "collection.updatedAt: must not precede createdAt.",
    );
  });

  it.each([
    ["skus", null, "collection.skus: expected a list."],
    ["sharedMaterialGroups", null, "collection.sharedMaterialGroups: expected a list."],
  ] as const)("requires a list for %s", (field, value, expected) => {
    expectError({ ...validCollection(), [field]: value }, expected);
  });

  it("rejects an oversized top-level graph before traversing rows", () => {
    expectError(
      { ...validCollection(), skus: Array.from({ length: COLLECTION_GRAPH_ENTRY_LIMIT }, () => null), sharedMaterialGroups: [] },
      `collection: collection graph exceeds ${COLLECTION_GRAPH_ENTRY_LIMIT} entries.`,
    );
  });

  it("bounds nested size-plan entries before traversing IDs", () => {
    const input = mutableCollection();
    const rows = input.skus as Record<string, unknown>[];
    const first = rows[0];
    rows.splice(1);
    first.sizePlan = {
      ...sizePlan({ ...input, skus: [first] }),
      sizeIds: Array.from({ length: COLLECTION_GRAPH_ENTRY_LIMIT }, (_, index) => `SIZE-${index}`),
    };
    expectError(input, `collection.skus[0].sizePlan: collection graph exceeds ${COLLECTION_GRAPH_ENTRY_LIMIT} entries.`);
  });

  it.each([
    [null, "collection.skus[0]: fields are incomplete or unknown."],
    [{ ...validCollection().skus[0], unknown: true }, "collection.skus[0]: fields are incomplete or unknown."],
    [{ ...validCollection().skus[0], id: "bad" }, "collection.skus[0].id: expected a UUID."],
    [{ ...validCollection().skus[0], styleId: "bad" }, "collection.skus[0].styleId: expected a stable style UUID."],
    [{ ...validCollection().skus[0], styleRevisionId: "bad" }, "collection.skus[0].styleRevisionId: expected an immutable style revision UUID."],
    [{ ...validCollection().skus[0], code: " " }, "collection.skus[0].code: enter a SKU row code of at most 80 characters."],
    [{ ...validCollection().skus[0], name: "x".repeat(81) }, "collection.skus[0].name: enter a name of at most 80 characters."],
  ])("rejects malformed SKU rows", (badSku, expected) => {
    const input = mutableCollection();
    input.skus = [badSku, (validCollection().skus[1] as unknown) as Record<string, unknown>];
    expectError(input, expected as string);
  });

  it("rejects duplicate SKU row IDs and codes", () => {
    const duplicateId = mutableCollection();
    sku(duplicateId, 1).id = ID.skuOne.toUpperCase();
    expectError(duplicateId, "collection.skus[1].id: duplicate record ID.");

    const duplicateCode = mutableCollection();
    sku(duplicateCode, 1).code = "TOP-01";
    expectError(duplicateCode, "collection.skus[1].code: duplicate SKU row code.");
  });

  it.each([
    [null, "collection.skus[0].sizePlan: fields are incomplete or unknown."],
    [{ ...validCollection().skus[0].sizePlan, extra: true }, "collection.skus[0].sizePlan: fields are incomplete or unknown."],
    [{ id: "bad", name: "Sizes", sizeIds: [] }, "collection.skus[0].sizePlan.id: expected a UUID."],
    [{ id: ID.planOne, name: "", sizeIds: [] }, "collection.skus[0].sizePlan.name: enter a name of at most 80 characters."],
    [{ id: ID.planOne, name: "Sizes", sizeIds: "M" }, "collection.skus[0].sizePlan.sizeIds: expected a list."],
  ])("rejects malformed size plans", (badPlan, expected) => {
    const input = mutableCollection();
    sku(input).sizePlan = badPlan;
    expectError(input, expected as string);
  });

  it("rejects duplicate size IDs and IDs reused by another record", () => {
    const duplicateSize = mutableCollection();
    sizePlan(duplicateSize).sizeIds = ["S", "S"];
    expectError(duplicateSize, "collection.skus[0].sizePlan.sizeIds[1]: duplicate size ID.");

    const duplicateId = mutableCollection();
    sizePlan(duplicateId).id = ID.skuOne;
    expectError(duplicateId, "collection.skus[0].sizePlan.id: duplicate record ID.");
  });

  it("rejects malformed size IDs", () => {
    const input = mutableCollection();
    sizePlan(input).sizeIds = ["S", " ".repeat(2)];
    expectError(input, "collection.skus[0].sizePlan.sizeIds[1]: enter a nonempty size ID of at most 80 characters.");
  });

  it("rejects an empty size plan", () => {
    const input = mutableCollection();
    sizePlan(input).sizeIds = [];
    expectError(input, "collection.skus[0].sizePlan.sizeIds: choose at least one size for this plan.");
  });

  it.each([
    [null, "collection.skus[0].colorways: expected a list."],
    [[null], "collection.skus[0].colorways[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().skus[0].colorways[0], extra: true }], "collection.skus[0].colorways[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().skus[0].colorways[0], id: "bad" }], "collection.skus[0].colorways[0].id: expected a UUID."],
    [[{ ...validCollection().skus[0].colorways[0], name: " " }], "collection.skus[0].colorways[0].name: enter a name of at most 80 characters."],
    [[{ ...validCollection().skus[0].colorways[0], sourceColorwayId: "missing" }], "collection.skus[0].colorways[0].sourceColorwayId: expected a UUID from the linked style revision."],
  ])("rejects malformed colorways", (badColorways, expected) => {
    const input = mutableCollection();
    sku(input).colorways = badColorways;
    expectError(input, expected as string);
  });

  it("rejects duplicate colorway IDs or repeated source colorways for one SKU", () => {
    const duplicateId = mutableCollection();
    sku(duplicateId).colorways = [
      ...validCollection().skus[0].colorways,
      { ...validCollection().skus[0].colorways[0], name: "Second label", sourceColorwayId: ID.sourceColorwayTwo },
    ];
    colorway(duplicateId, 0, 1).id = ID.colorwayOne.toUpperCase();
    expectError(duplicateId, "collection.skus[0].colorways[1].id: duplicate record ID.");

    const duplicateSource = mutableCollection();
    sku(duplicateSource).colorways = [
      ...validCollection().skus[0].colorways,
      { ...validCollection().skus[0].colorways[0], id: "10000000-0000-4000-8000-000000000020", name: "Second label" },
    ];
    expectError(duplicateSource, "collection.skus[0].colorways[1].sourceColorwayId: duplicate source colorway for this SKU.");
  });

  it.each([
    [null, "collection.skus[0].variants: expected a list."],
    [[null], "collection.skus[0].variants[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().skus[0].variants[0], extra: true }], "collection.skus[0].variants[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().skus[0].variants[0], id: "bad" }], "collection.skus[0].variants[0].id: expected a UUID."],
    [[{ ...validCollection().skus[0].variants[0], skuCode: " " }], "collection.skus[0].variants[0].skuCode: enter a unique variant SKU code of at most 80 characters."],
    [[{ ...validCollection().skus[0].variants[0], sizeId: "" }], "collection.skus[0].variants[0].sizeId: expected a size ID in this SKU's size plan."],
    [[{ ...validCollection().skus[0].variants[0], colorwayId: "bad" }], "collection.skus[0].variants[0].colorwayId: expected a UUID for a colorway in this SKU."],
  ])("rejects malformed variants", (badVariants, expected) => {
    const input = mutableCollection();
    sku(input).variants = badVariants;
    expectError(input, expected as string);
  });

  it("rejects duplicate variant IDs, codes, missing references and repeated combinations", () => {
    const duplicateId = mutableCollection();
    sku(duplicateId).variants = [
      ...validCollection().skus[0].variants,
      { ...validCollection().skus[0].variants[0], id: ID.variantTwo, skuCode: "TOP-INK-M", sizeId: "M" },
    ];
    variant(duplicateId, 0, 1).id = ID.variantOne.toUpperCase();
    expectError(duplicateId, "collection.skus[0].variants[1].id: duplicate record ID.");

    const duplicateCode = mutableCollection();
    variant(duplicateCode, 1).skuCode = "TOP-INK-S";
    expectError(duplicateCode, "collection.skus[1].variants[0].skuCode: duplicate variant SKU code.");

    const missingSize = mutableCollection();
    variant(missingSize).sizeId = "XL";
    expectError(missingSize, "collection.skus[0].variants[0].sizeId: reference a size in this SKU's size plan.");

    const missingColorway = mutableCollection();
    variant(missingColorway).colorwayId = ID.colorwayTwo;
    expectError(missingColorway, "collection.skus[0].variants[0].colorwayId: reference a colorway in this SKU.");

    const duplicatePair = mutableCollection();
    sku(duplicatePair).variants = [
      ...validCollection().skus[0].variants,
      { ...validCollection().skus[0].variants[0], id: ID.variantTwo, skuCode: "TOP-INK-S-SECOND" },
    ];
    expectError(duplicatePair, "collection.skus[0].variants[1]: duplicate size/colorway variant.");
  });

  it.each([
    [null, "collection.sharedMaterialGroups: expected a list."],
    [[null], "collection.sharedMaterialGroups[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().sharedMaterialGroups[0], extra: true }], "collection.sharedMaterialGroups[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().sharedMaterialGroups[0], id: "bad" }], "collection.sharedMaterialGroups[0].id: expected a UUID."],
    [[{ ...validCollection().sharedMaterialGroups[0], name: " " }], "collection.sharedMaterialGroups[0].name: enter a name of at most 80 characters."],
    [[{ ...validCollection().sharedMaterialGroups[0], members: null }], "collection.sharedMaterialGroups[0].members: expected a list."],
    [[{ ...validCollection().sharedMaterialGroups[0], members: [null, { skuId: ID.skuTwo, materialId: ID.materialTwo }] }],
      "collection.sharedMaterialGroups[0].members[0]: fields are incomplete or unknown."],
    [[{ ...validCollection().sharedMaterialGroups[0], members: [{ skuId: ID.skuOne, materialId: ID.materialOne }] }], "collection.sharedMaterialGroups[0].members: link at least two distinct SKU rows."],
  ])("rejects malformed shared-material groups", (groups, expected) => {
    expectError({ ...validCollection(), sharedMaterialGroups: groups }, expected as string);
  });

  it("bounds shared-material references", () => {
    const hugeMembers = Array.from({ length: COLLECTION_GRAPH_ENTRY_LIMIT }, (_, index) => ({
      skuId: ID.skuOne,
      materialId: `10000000-0000-4000-8000-${String(index + 20).padStart(12, "0")}`,
    }));
    expectError(
      { ...validCollection(), sharedMaterialGroups: [{ ...validCollection().sharedMaterialGroups[0], members: hugeMembers }] },
      `collection.sharedMaterialGroups[0].members: collection graph exceeds ${COLLECTION_GRAPH_ENTRY_LIMIT} entries.`,
    );
  });

  it("rejects duplicate group IDs and malformed or unresolved member references", () => {
    const duplicateGroupId = mutableCollection();
    duplicateGroupId.sharedMaterialGroups = [
      ...validCollection().sharedMaterialGroups,
      { ...validCollection().sharedMaterialGroups[0], name: "Second group" },
    ];
    materialGroup(duplicateGroupId, 1).id = ID.materialGroup.toUpperCase();
    expectError(duplicateGroupId, "collection.sharedMaterialGroups[1].id: duplicate record ID.");

    const malformedMember = mutableCollection();
    member(malformedMember).skuId = "missing";
    expectError(malformedMember, "collection.sharedMaterialGroups[0].members[0].skuId: expected a SKU UUID.");

    const malformedMaterial = mutableCollection();
    member(malformedMaterial).materialId = "missing";
    expectError(malformedMaterial, "collection.sharedMaterialGroups[0].members[0].materialId: expected a source material UUID.");

    const missingSku = mutableCollection();
    member(missingSku).skuId = "10000000-0000-4000-8000-000000000020";
    expectError(missingSku, "collection.sharedMaterialGroups[0].members[0].skuId: reference a SKU in this collection.");

    const repeatedSku = mutableCollection();
    member(repeatedSku, 0, 1).skuId = ID.skuOne;
    expectError(repeatedSku, "collection.sharedMaterialGroups[0].members[1].skuId: link each SKU at most once in a material group.");

    const repeatedSourceMaterial = mutableCollection();
    repeatedSourceMaterial.sharedMaterialGroups = [
      ...validCollection().sharedMaterialGroups,
      {
        id: "10000000-0000-4000-8000-000000000020",
        name: "Repeated link",
        members: [
          { skuId: ID.skuOne, materialId: ID.materialOne },
          { skuId: ID.skuTwo, materialId: ID.materialTwo },
        ],
      },
    ];
    expectError(
      repeatedSourceMaterial,
      "collection.sharedMaterialGroups[1].members[0].materialId: this source material is already linked to a shared-material group.",
    );
  });
});
