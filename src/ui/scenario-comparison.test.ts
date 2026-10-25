import { describe, expect, it } from "vitest";
import { COLLECTION_RECORD_VERSION, type CollectionRecord } from "./collection-records";
import type { CollectionSourceStatus } from "./collection-source-validation";
import { renderScenarioComparison } from "./scenario-comparison";
import type { ScenarioRecord } from "./scenario-records";

const ID = {
  project: "62000000-0000-4000-8000-000000000001",
  collection: "62000000-0000-4000-8000-000000000002",
  sku: "62000000-0000-4000-8000-000000000003",
  style: "62000000-0000-4000-8000-000000000004",
  revision: "62000000-0000-4000-8000-000000000005",
  sizePlan: "62000000-0000-4000-8000-000000000006",
  colorway: "62000000-0000-4000-8000-000000000007",
  variantS: "62000000-0000-4000-8000-000000000008",
  variantM: "62000000-0000-4000-8000-000000000009",
  materialGroup: "62000000-0000-4000-8000-000000000010",
  materialS: "62000000-0000-4000-8000-000000000011",
  materialM: "62000000-0000-4000-8000-000000000012",
  skuM: "62000000-0000-4000-8000-000000000013",
  sizePlanM: "62000000-0000-4000-8000-000000000014",
  colorwayM: "62000000-0000-4000-8000-000000000015",
  sourceColorwayM: "62000000-0000-4000-8000-000000000016",
} as const;

const VALIDITY = {
  kind: "user-input",
  sourceLabel: "Supplier quote <&>",
  asOf: "2026-10-20",
  validThrough: "2026-10-24",
};

function collection(): CollectionRecord {
  return {
    schemaVersion: COLLECTION_RECORD_VERSION,
    id: ID.collection,
    projectId: ID.project,
    name: "Autumn <capsule>",
    createdAt: "2026-10-24T00:00:00.000Z",
    updatedAt: "2026-10-24T00:00:00.000Z",
    revision: 2,
    skus: [
      {
        id: ID.sku,
        code: "TEE-S",
        name: "Everyday tee small",
        styleId: ID.style,
        styleRevisionId: ID.revision,
        sizePlan: { id: ID.sizePlan, name: "Small size", sizeIds: ["S"] },
        colorways: [{ id: ID.colorway, name: "Ink", sourceColorwayId: ID.colorway }],
        variants: [{ id: ID.variantS, skuCode: "TEE-INK-S", sizeId: "S", colorwayId: ID.colorway }],
      },
      {
        id: ID.skuM,
        code: "TEE-M",
        name: "Everyday tee medium",
        styleId: ID.style,
        styleRevisionId: ID.revision,
        sizePlan: { id: ID.sizePlanM, name: "Medium size", sizeIds: ["M"] },
        colorways: [{ id: ID.colorwayM, name: "Ink", sourceColorwayId: ID.sourceColorwayM }],
        variants: [{ id: ID.variantM, skuCode: "TEE-INK-M", sizeId: "M", colorwayId: ID.colorwayM }],
      },
    ],
    sharedMaterialGroups: [{
      id: ID.materialGroup,
      name: "Shell links",
      members: [
        { skuId: ID.sku, materialId: ID.materialS },
        { skuId: ID.skuM, materialId: ID.materialM },
      ],
    }],
  };
}

function scenario(overrides: Partial<ScenarioRecord> = {}): ScenarioRecord {
  const provenance = { ...VALIDITY };
  return {
    schemaVersion: 1,
    id: "62000000-0000-4000-8000-000000000020",
    projectId: ID.project,
    collectionId: ID.collection,
    name: "Base plan",
    revision: 1,
    createdAt: "2026-10-24T00:00:00.000Z",
    updatedAt: "2026-10-24T00:00:00.000Z",
    evaluationDate: "2026-10-24",
    currencyCode: "USD",
    units: [
      { id: "62000000-0000-4000-8000-000000000021", variantId: ID.variantS, units: "2", provenance },
      { id: "62000000-0000-4000-8000-000000000022", variantId: ID.variantM, units: "1", provenance },
    ],
    prices: [
      { id: "62000000-0000-4000-8000-000000000023", variantId: ID.variantS, amount: "12.5", currencyCode: "USD", provenance },
      { id: "62000000-0000-4000-8000-000000000024", variantId: ID.variantM, amount: "0.5", currencyCode: "USD", provenance },
    ],
    costs: [
      { id: "62000000-0000-4000-8000-000000000025", variantId: ID.variantS, amount: "8", currencyCode: "USD", provenance },
      { id: "62000000-0000-4000-8000-000000000026", variantId: ID.variantM, amount: "0.75", currencyCode: "USD", provenance },
    ],
    moqs: [{
      id: "62000000-0000-4000-8000-000000000027",
      scope: { kind: "order", styleId: "", skuId: "", colorwayId: "", variantId: "" },
      unit: "garment",
      minimumUnits: "3",
      provenance,
    }],
    capacityDelivery: [{
      id: "62000000-0000-4000-8000-000000000028",
      scope: { kind: "order", styleId: "", skuId: "", colorwayId: "", variantId: "" },
      unitsPerPeriod: "2",
      periodUnit: "calendar-week",
      minimumPeriods: "1",
      maximumPeriods: "2",
      provenance,
    }],
    ...overrides,
  };
}

function sourceStatus(overrides: Partial<CollectionSourceStatus> = {}): CollectionSourceStatus {
  return {
    collectionId: ID.collection,
    collectionName: "Autumn line",
    skuId: ID.sku,
    skuCode: "TEE-01",
    skuName: "Core tee",
    styleId: ID.style,
    styleName: "Everyday tee",
    styleRevisionId: ID.revision,
    pinnedRevisionNumber: 1,
    headRevisionNumber: 2,
    isStale: false,
    isArchived: false,
    ...overrides,
  };
}

describe("saved scenario comparison renderer", () => {
  it("shows an explicit empty state without rendering an empty comparison table", () => {
    const html = renderScenarioComparison({ scenarios: [], collections: [collection()], collectionSourceStatuses: [] });

    expect(html).toContain("No scenarios are available to compare yet.");
    expect(html).not.toContain("<table>");
  });

  it("keeps saved scenarios in order with exact per-currency results, raw intervals and source disclosures", () => {
    const first = scenario({ name: "Base USD" });
    const second = scenario({
      id: "62000000-0000-4000-8000-000000000030",
      name: "Alternate EUR",
      currencyCode: "EUR",
      prices: scenario().prices.map((row) => ({ ...row, currencyCode: "EUR" })),
      costs: scenario().costs.map((row) => ({ ...row, currencyCode: "EUR" })),
      moqs: scenario().moqs.map((row) => ({ ...row, minimumUnits: "4" })),
      capacityDelivery: scenario().capacityDelivery.map((row) => ({
        ...row, unitsPerPeriod: "1", maximumPeriods: "1", minimumPeriods: "1",
        provenance: { ...VALIDITY, validThrough: "2026-10-22" },
      })),
    });
    const html = renderScenarioComparison({
      scenarios: [first, second],
      collections: [collection()],
      collectionSourceStatuses: [
        sourceStatus({ skuCode: "TEE-CURRENT" }),
        sourceStatus({ skuId: "62000000-0000-4000-8000-000000000031", skuCode: "TEE-ARCHIVED", isStale: true, isArchived: true }),
      ],
    });

    expect(html.indexOf("Base USD")).toBeLessThan(html.indexOf("Alternate EUR"));
    expect(html).toContain("Current scenario drafts, constraints and source status");
    expect(html).toContain("USD 25.5");
    expect(html).toContain("EUR 25.5");
    expect(html).toContain("USD 4.5");
    expect(html).toContain("below · 3 planned / 4 minimum");
    expect(html).toContain("within-maximum-window · 3 planned; 2–4 total capacity units for the 1–2 calendar-week interval");
    expect(html).toContain("exceeds-maximum-window · 3 planned; 1–1 total capacity units for the 1–1 calendar-week interval");
    expect(html).not.toContain("capacity units per calendar-week");
    expect(html).toContain("Shell links");
    expect(html).toContain("62000000-0000-4000-8000-000000000011");
    expect(html).toContain("do not establish equivalence, availability or material usage");
    expect(html).toContain("Supplier quote &lt;&amp;&gt;");
    expect(html).toContain("valid through 2026-10-22");
    expect(html).toContain("stale · archived");
    expect(html).toContain("r1 pinned / r2 current");
    expect(html).not.toContain("Best scenario");
    expect(html).toContain("Values are not added across scenarios or ranked.");
  });

  it("keeps malformed raw inputs, constraint blockers, unknown validity and unresolved source paths visible", () => {
    const invalid = scenario({
      name: "Needs repair",
      units: [
        { ...scenario().units[0], units: "not-a-number", provenance: { ...VALIDITY, sourceLabel: "", validThrough: "" } },
        { ...scenario().units[1], provenance: { ...VALIDITY, validThrough: "" } },
        { ...scenario().units[0], id: "62000000-0000-4000-8000-000000000052", variantId: "unknown-variant" },
      ],
      moqs: scenario().moqs.map((row) => ({ ...row, unit: "case", minimumUnits: "invalid" })),
      capacityDelivery: scenario().capacityDelivery.map((row) => ({ ...row, unitsPerPeriod: "invalid", periodUnit: "", minimumPeriods: "", maximumPeriods: "" })),
    });
    const html = renderScenarioComparison({ scenarios: [invalid], collections: [collection()], collectionSourceStatuses: [] });

    expect(html).toContain("scenario-state-blocked");
    expect(html).toContain("PLANNED_UNITS_INVALID");
    expect(html).toContain("needs attention");
    expect(html).toContain("not evaluated");
    expect(html).toContain("validity date not entered");
    expect(html).toContain("No resolved source-revision status is available.");
    expect(html).toContain("Not available; see calculation state and blockers.");
  });

  it("distinguishes unknown and invalid source validity reported by the calculator", () => {
    const unknown = scenario({
      name: "Unknown source validity",
      units: scenario().units.map((row) => ({ ...row, provenance: { ...VALIDITY, validThrough: "" } })),
    });
    const invalid = scenario({
      id: "62000000-0000-4000-8000-000000000051",
      name: "Invalid source date",
      units: scenario().units.map((row) => ({ ...row, provenance: { ...VALIDITY, validThrough: "not-a-date" } })),
    });
    const html = renderScenarioComparison({ scenarios: [unknown, invalid], collections: [collection()], collectionSourceStatuses: [] });

    expect(html).toContain("validity-unknown");
    expect(html).toContain("invalid");
    expect(html).toContain("PROVENANCE_INVALID");
  });

  it("renders orphaned collections and empty calculation sections without inventing data", () => {
    const orphan = scenario({ collectionId: "62000000-0000-4000-8000-000000000040", name: "Orphan" });
    const emptyInputs = scenario({
      id: "62000000-0000-4000-8000-000000000041",
      name: "Empty inputs",
      units: [], prices: [], costs: [], moqs: [], capacityDelivery: [],
    });
    const unnamedCollection = { ...collection(), id: "62000000-0000-4000-8000-000000000053", name: "" };
    const unnamed = scenario({
      id: "62000000-0000-4000-8000-000000000054",
      collectionId: unnamedCollection.id,
      name: "",
    });
    const noMaterialMembers = {
      ...collection(),
      id: "62000000-0000-4000-8000-000000000050",
      sharedMaterialGroups: [{ ...collection().sharedMaterialGroups[0], members: [] }],
    } as unknown as CollectionRecord;
    const malformedLinks = scenario({
      id: "62000000-0000-4000-8000-000000000042",
      name: "Malformed links",
      collectionId: noMaterialMembers.id,
    });
    const html = renderScenarioComparison({
      scenarios: [orphan, emptyInputs, malformedLinks, unnamed],
      collections: [collection(), noMaterialMembers, unnamedCollection],
      collectionSourceStatuses: [],
    });

    expect(html).toContain("Unavailable collection");
    expect(html).toContain("Calculation unavailable until this scenario has a saved collection.");
    expect(html).toContain("Unavailable collection source revision.");
    expect(html).toContain("No input provenance rows recorded.");
    expect(html).toContain("No MOQ result recorded.");
    expect(html).toContain("No capacity result recorded.");
    expect(html).toContain("No delivery interval entered.");
    expect(html).toContain("No member links.");
    expect(html).toContain("Untitled scenario");
    expect(html).toContain("Unnamed collection");
  });

  it("escapes user-authored scenario, collection and provenance text", () => {
    const hostileCollection = { ...collection(), sharedMaterialGroups: [] };
    const hostileScenario = scenario({
      name: `<>\"'&`,
      units: scenario().units.map((row) => ({ ...row, provenance: { ...VALIDITY, sourceLabel: `<img src=x onerror='alert(1)'>&` } })),
    });
    const html = renderScenarioComparison({
      scenarios: [hostileScenario],
      collections: [hostileCollection],
      collectionSourceStatuses: [sourceStatus({ collectionId: "different-collection" })],
    });

    expect(html).toContain("&lt;&gt;&quot;&#39;&amp;");
    expect(html).toContain("&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;");
    expect(html).toContain("&lt;capsule&gt;");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("No shared-material group recorded.");
    expect(html).toContain("No resolved source-revision status is available.");
  });
});
