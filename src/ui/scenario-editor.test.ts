// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  calculateScenarioDraft,
  reduceScenarioDrafts,
  renderScenarioEditor,
  updateScenarioEditorControls,
} from "./scenario-editor";
import type { CollectionRecord } from "./collection-records";
import type { ScenarioRecord } from "./scenario-records";

const PROJECT = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const COLLECTION = "b02b8322-8f57-46bb-9d16-16ac1fcf6811";
const VARIANT = "c02b8322-8f57-46bb-9d16-16ac1fcf6811";
const TIME = "2026-09-24T16:00:00.000Z";
let sequence = 10;
const uuid = () => `00000000-0000-4000-8000-${String(sequence++).padStart(12, "0")}`;
const provenance = { kind: "user-input", sourceLabel: "Plan", asOf: "2026-09-01", validThrough: "2026-10-01" };
const scope = { kind: "order", styleId: "", skuId: "", colorwayId: "", variantId: "" };

function collection(): CollectionRecord {
  return {
    schemaVersion: 1,
    id: COLLECTION,
    projectId: PROJECT,
    name: "Spring line",
    createdAt: TIME,
    updatedAt: TIME,
    revision: 1,
    skus: [{
      id: "d02b8322-8f57-46bb-9d16-16ac1fcf6811",
      code: "TEE",
      name: "Tee",
      styleId: "e02b8322-8f57-46bb-9d16-16ac1fcf6811",
      styleRevisionId: "f02b8322-8f57-46bb-9d16-16ac1fcf6811",
      sizePlan: { id: "11000000-0000-4000-8000-000000000001", name: "Core", sizeIds: ["M"] },
      colorways: [{ id: "12000000-0000-4000-8000-000000000001", name: "Ink", sourceColorwayId: "13000000-0000-4000-8000-000000000001" }],
      variants: [{ id: VARIANT, skuCode: "TEE-M-INK", sizeId: "M", colorwayId: "12000000-0000-4000-8000-000000000001" }],
    }],
    sharedMaterialGroups: [],
  };
}

function scenario(overrides: Partial<ScenarioRecord> = {}): ScenarioRecord {
  return {
    schemaVersion: 1,
    id: "14000000-0000-4000-8000-000000000001",
    projectId: PROJECT,
    collectionId: COLLECTION,
    name: "Plan A",
    revision: 1,
    createdAt: TIME,
    updatedAt: TIME,
    evaluationDate: "2026-09-24",
    currencyCode: "USD",
    units: [{ id: "15000000-0000-4000-8000-000000000001", variantId: VARIANT, units: "bad", provenance }],
    prices: [{ id: "16000000-0000-4000-8000-000000000001", variantId: VARIANT, amount: "12.50", currencyCode: "USD", provenance }],
    costs: [{ id: "17000000-0000-4000-8000-000000000001", variantId: VARIANT, amount: "4.00", currencyCode: "USD", provenance }],
    moqs: [{ id: "18000000-0000-4000-8000-000000000001", scope, unit: "garment", minimumUnits: "5", provenance }],
    capacityDelivery: [{
      id: "19000000-0000-4000-8000-000000000001", scope, unitsPerPeriod: "100", periodUnit: "calendar-week",
      minimumPeriods: "1", maximumPeriods: "2", provenance,
    }],
    ...overrides,
  };
}

describe("scenario editor and calculation adapter", () => {
  it("keeps raw invalid input blocked and calculates corrected numeric and decimal values", () => {
    const invalid = scenario();
    const blocked = calculateScenarioDraft(invalid, [collection()]);
    expect(blocked?.state).toBe("blocked");
    expect(blocked?.blockers.map((item) => item.code)).toContain("PLANNED_UNITS_INVALID");
    const corrected = { ...invalid, units: [{ ...invalid.units[0]!, units: "10" }] };
    const result = calculateScenarioDraft(corrected, [collection()]);
    expect(result).toMatchObject({ state: "complete", financialSummary: { totalUnits: "10", totalPrice: "125", totalCost: "40", totalMargin: "85" } });
    expect(calculateScenarioDraft(corrected, [])).toBeNull();
    expect(calculateScenarioDraft({ ...corrected, evaluationDate: "bad" }, [collection()])?.blockers.map((item) => item.code))
      .toContain("EVALUATION_DATE_INVALID");
    expect(calculateScenarioDraft({
      ...corrected, units: [{ ...corrected.units[0]!, units: "9007199254740992" }],
    }, [collection()])?.blockers.map((item) => item.code)).toContain("PLANNED_UNITS_INVALID");
  });

  it("renders project-owned controls, exact raw values, result blockers, constraints and orphan repair choices", () => {
    const value = scenario({ name: "<Plan>" });
    const html = renderScenarioEditor({ scenarios: [value], savedScenarios: [], collections: [collection()] });
    expect(html).toContain("Scenario planner");
    expect(html).toContain("&lt;Plan&gt;");
    expect(html).toContain("PLANNED_UNITS_INVALID");
    expect(html).toContain("data-se-row-kind=\"capacityDelivery\"");
    expect(html).toContain("data-se-nested=\"scope\"");
    expect(html).toContain("data-se-nested=\"provenance\"");
    expect(renderScenarioEditor({
      scenarios: [{ ...value, collectionId: "22000000-0000-4000-8000-000000000001" }],
      savedScenarios: [], collections: [], disabled: true,
    })).toContain("Unavailable collection");
    expect(renderScenarioEditor({
      scenarios: [{ ...value, collectionId: "22000000-0000-4000-8000-000000000001" }],
      savedScenarios: [], collections: [collection()],
    })).toContain("Unresolved saved ID");
    expect(renderScenarioEditor({ scenarios: [], savedScenarios: [], collections: [] })).toContain("No scenarios saved");
    expect(renderScenarioEditor({
      scenarios: [value], savedScenarios: [], collections: [{ ...collection(), name: "" }],
    })).toContain("Unnamed collection");
    expect(renderScenarioEditor({
      scenarios: [{ ...value, moqs: [{ ...value.moqs[0]!, scope: { ...scope, kind: "future-scope" } }] }],
      savedScenarios: [], collections: [collection()],
    })).toContain("Unsupported saved value · future-scope");
    expect(renderScenarioEditor({
      scenarios: [scenario({ name: "" })], savedScenarios: [], collections: [collection()],
    })).toContain("Untitled scenario");
    expect(renderScenarioEditor({
      scenarios: [{ ...value, revision: 0 }], savedScenarios: [], collections: [collection()],
    })).toContain('class="scenario-validation"');
    expect(renderScenarioEditor({
      scenarios: [value, { ...value, name: "Duplicate identity" }], savedScenarios: [], collections: [collection()],
    })).toContain('class="scenario-validation"');
  });

  it("omits the source-status section when the calculation has no source-backed rows", () => {
    const empty = scenario({ units: [], prices: [], costs: [], moqs: [], capacityDelivery: [] });
    const html = renderScenarioEditor({ scenarios: [empty], savedScenarios: [], collections: [collection()] });
    expect(html).not.toContain("<h5>Source status</h5>");
  });

  it("reduces top-level and nested raw field edits without touching other scenarios", () => {
    const first = scenario();
    const second = scenario({ id: "23000000-0000-4000-8000-000000000001", name: "Other" });
    const secondUnit = { ...first.units[0]!, id: "24000000-0000-4000-8000-000000000001" };
    const withTwoUnits = { ...first, units: [first.units[0]!, secondUnit] };
    const untouched = reduceScenarioDrafts([withTwoUnits], {
      type: "update-row", scenarioId: first.id, rowKind: "units", rowId: first.units[0]!.id, field: "units", value: "12",
    });
    expect(untouched[0]?.units[1]).toBe(secondUnit);
    const updated = reduceScenarioDrafts([first, second], { type: "update", scenarioId: first.id, field: "evaluationDate", value: "raw-date" });
    expect(updated[0]?.evaluationDate).toBe("raw-date");
    expect(updated[1]).toBe(second);
    expect(reduceScenarioDrafts([first], { type: "update", scenarioId: first.id, field: "unsupported", value: "x" })[0]).toBe(first);
    const rowEdit = reduceScenarioDrafts([first], {
      type: "update-row", scenarioId: first.id, rowKind: "units", rowId: first.units[0]!.id, field: "units", value: "10",
    });
    expect(rowEdit[0]?.units[0]?.units).toBe("10");
    const provenanceEdit = reduceScenarioDrafts([first], {
      type: "update-row", scenarioId: first.id, rowKind: "units", rowId: first.units[0]!.id,
      field: "sourceLabel", value: "Updated source", nested: "provenance",
    });
    expect(provenanceEdit[0]?.units[0]?.provenance.sourceLabel).toBe("Updated source");
    const scopeEdit = reduceScenarioDrafts([first], {
      type: "update-row", scenarioId: first.id, rowKind: "moqs", rowId: first.moqs[0]!.id,
      field: "kind", value: "variant", nested: "scope",
    });
    expect(scopeEdit[0]?.moqs[0]?.scope.kind).toBe("variant");
  });

  it("adds and removes constraint rows, scenarios, and missing collection variants immutably", () => {
    const first = scenario({ units: [], prices: [], costs: [], moqs: [], capacityDelivery: [] });
    const moq = { id: uuid(), scope, unit: "", minimumUnits: "", provenance: { kind: "", sourceLabel: "", asOf: "", validThrough: "" } };
    const capacity = {
      id: uuid(), scope, unitsPerPeriod: "", periodUnit: "", minimumPeriods: "", maximumPeriods: "",
      provenance: { kind: "", sourceLabel: "", asOf: "", validThrough: "" },
    };
    const withMoq = reduceScenarioDrafts([first], { type: "add-moq", scenarioId: first.id, row: moq });
    const withCapacity = reduceScenarioDrafts(withMoq, { type: "add-capacity-delivery", scenarioId: first.id, row: capacity });
    expect(withCapacity[0]?.moqs).toEqual([moq]);
    expect(withCapacity[0]?.capacityDelivery).toEqual([capacity]);
    expect(reduceScenarioDrafts(withCapacity, {
      type: "delete-row", scenarioId: first.id, rowKind: "moqs", rowId: moq.id,
    })[0]?.moqs).toEqual([]);
    expect(reduceScenarioDrafts(withCapacity, { type: "delete", scenarioId: first.id })).toEqual([]);
    const withVariants = reduceScenarioDrafts([first], {
      type: "add-missing", scenarioId: first.id, collection: collection(), projectScenarios: [first], uuid,
    });
    expect(withVariants[0]?.units).toHaveLength(1);
    expect(withVariants[0]?.prices).toHaveLength(1);
    expect(withVariants[0]?.costs).toHaveLength(1);

    const capped = scenario({
      units: Array.from({ length: 500 }, (_, index) => ({
        id: `25000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
        variantId: "removed-variant", units: "", provenance,
      })),
      prices: [], costs: [], moqs: [], capacityDelivery: [],
    });
    const rejectedAdd = reduceScenarioDrafts([capped], {
      type: "add-missing", scenarioId: capped.id, collection: collection(), projectScenarios: [capped], uuid,
    });
    expect(rejectedAdd[0]).toBe(capped);
  });

  it("refreshes only calculation output and save/discard state after raw inputs change", () => {
    const first = scenario();
    const root = document.createElement("div");
    root.innerHTML = renderScenarioEditor({ scenarios: [first], savedScenarios: [first], collections: [collection()] });
    const changed = { ...first, units: [{ ...first.units[0]!, units: "10" }] };
    updateScenarioEditorControls(root, [changed], [collection()], [first], false);
    expect(root.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(false);
    expect(root.querySelector("[data-scenario-action='discard']")?.hasAttribute("disabled")).toBe(false);
    expect(root.querySelector("[data-scenario-result]")?.textContent).toContain("Total margin");
    updateScenarioEditorControls(root, [changed], [collection()], [first], true);
    expect(root.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(true);
    updateScenarioEditorControls(root, [first], [collection()], [first], false);
    expect(root.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(true);

    const duplicateRoot = document.createElement("div");
    const duplicate = { ...first, name: "Duplicate identity" };
    duplicateRoot.innerHTML = renderScenarioEditor({ scenarios: [first], savedScenarios: [], collections: [collection()] });
    updateScenarioEditorControls(duplicateRoot, [first, duplicate], [collection()], [], false);
    expect(duplicateRoot.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(true);
    updateScenarioEditorControls(duplicateRoot, [{ ...first, revision: 0 }], [collection()], [], false);
    expect(duplicateRoot.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(true);
    updateScenarioEditorControls(duplicateRoot, [], [collection()], [], false);
    expect(duplicateRoot.querySelector("[data-scenario-action='save']")?.hasAttribute("disabled")).toBe(true);
  });
});
