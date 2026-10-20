import { describe, expect, it } from "vitest";
import {
  STARTER_REGISTRY,
  starterControlError,
  starterEntryById,
  starterOriginError,
  starterOriginForEntry,
} from "./starter-registry";
import { currentStyles, TEE_STYLES } from "../style/style";
import { STANDARD_M } from "../drafting";

const entry = STARTER_REGISTRY.entries[0]!;
const blankEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.catalogKind === "blank")!;
const relaxedEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-relaxed-digital-v1")!;
const boxyCropEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-boxy-crop-digital-v1")!;
const validOrigin = starterOriginForEntry(entry);

describe("Tee Classic starter registry", () => {
  it("preserves the bounded existing custom-measurement candidate and its claim limits", () => {
    expect(STARTER_REGISTRY.entries).toHaveLength(4);
    expect(entry).toMatchObject({
      entryId: "tee-classic-custom-v1",
      entryRevision: "2026-10-19.3",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "custom-measurement",
      configuration: { targetStyle: "Classic tee", measurements: { ease: 7 }, options: { chestEase: 7 } },
      gates: { b1: "approved for digital scope", physical: "not-validated" },
    });
    expect(entry.supportedControls.find((control) => control.fieldId === "length"))
      .toMatchObject({ min: 59, max: 74, defaultValue: null });
    expect(entry.limits.join(" ")).toContain("does not capture or qualify measurement technique");
    expect(entry.limits.join(" ")).toContain("physical-fit");
    expect(entry.limits.join(" ")).toContain("starter-specific grading");
    expect(entry.limits.join(" ")).toContain("approves this limited digital scope");
    expect(starterEntryById(entry.entryId)).toBe(entry);
    expect(starterEntryById("unknown-entry")).toBeNull();
    expect(entry.supportedControls.find((control) => control.fieldId === "shoulderWidth"))
      .toMatchObject({ kind: "measurement", label: "Shoulder width (biacromial breadth)" });
    expect(entry.supportedControls.find((control) => control.fieldId === "bicep"))
      .toMatchObject({ kind: "measurement", label: "Bicep" });
    expect(entry.supportedControls.find((control) => control.fieldId === "ease")).toMatchObject({ kind: "design", label: "Ease" });
    expect(entry.supportedControls.find((control) => control.fieldId === "length")).toMatchObject({ kind: "design" });
    expect(entry.limits.join(" ")).toContain("Exports do not carry this registry entry ID or revision");
    expect(entry.limits.join(" ")).toContain("generic material selector and stretch heuristic do not model");
    expect(entry.intent.sizeScope).toContain("HPS-to-hem");
    expect(entry.intent.sizeScope).toContain("Tol columns are generic recipe references");
    expect(entry.limits.join(" ")).toContain("Tech Pack size labels (such as M) and XS–XL graded outputs");
    expect(entry.limits.join(" ")).toContain("not starter-specific size or grade guidance");
    expect(entry.limits.join(" ")).toContain("unavailable in the separate project custom-one-size workflow");
    const ids = STARTER_REGISTRY.entries.map((candidate) => candidate.entryId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const candidate of STARTER_REGISTRY.entries) for (const control of candidate.supportedControls) {
      expect(control.min).toBeLessThanOrEqual(control.max);
      expect(control.step).toBeGreaterThan(0);
    }
  });

  it("defines one complete editable T01 blank with explicit software-only defaults and gates", () => {
    expect(STARTER_REGISTRY.catalogRevision).toBe("g18-catalog-v1");
    expect(blankEntry).toMatchObject({
      entryId: "tee-classic-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      configuration: {
        targetStyle: "Classic tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { chestEase: 7 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(blankEntry.label).toContain("software defaults");
    expect(blankEntry.intent.fit).toContain("not validated fit targets");
    expect(blankEntry.intent.sizeScope).toContain("not a population chart or validated size-M profile");
    expect(blankEntry.limits.join(" ")).toContain("STANDARD_M contributes software starting values only");
    expect(blankEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    for (const [fieldId, defaultValue] of Object.entries(blankEntry.configuration.measurements)) {
      expect(blankEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    for (const [fieldId, defaultValue] of Object.entries(blankEntry.configuration.options)) {
      expect(blankEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(blankEntry.supportedControls.find((control) => control.fieldId === "shoulderWidth"))
      .toMatchObject({ kind: "measurement", min: 30, max: 70, step: 0.1, defaultValue: 45 });
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(3);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "custom-measurement")).toHaveLength(1);
  });

  it("defines T02 as a complete editable Relaxed Tee blank with a code-aligned software default", () => {
    expect(relaxedEntry).toMatchObject({
      entryId: "tee-relaxed-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      configuration: {
        targetStyle: "Relaxed tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 13 },
        options: {},
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(relaxedEntry.label).toBe("Tee Relaxed · software defaults");
    expect(relaxedEntry.intent.fit).toContain("13 cm ease is a software choice");
    expect(relaxedEntry.intent.sizeScope).toContain("not a population chart or validated size-M profile");
    expect(relaxedEntry.limits.join(" ")).toContain("13 cm ease is a product choice");
    expect(relaxedEntry.limits.join(" ")).toContain("not a fit, fabric, or wearer recommendation");
    expect(relaxedEntry.supportedControls).toHaveLength(7);
    for (const [fieldId, defaultValue] of Object.entries(relaxedEntry.configuration.measurements)) {
      expect(relaxedEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(relaxedEntry.supportedControls.find((control) => control.fieldId === "ease"))
      .toMatchObject({ kind: "design", min: 13, max: 18, step: 1, defaultValue: 13 });
    expect(relaxedEntry.supportedControls.find((control) => control.fieldId === "chestEase")).toBeUndefined();
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(3);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "custom-measurement")).toHaveLength(1);
  });

  it("defines T03 as a complete editable Boxy Crop Tee profile without adding drop-shoulder construction", () => {
    expect(boxyCropEntry).toMatchObject({
      entryId: "tee-boxy-crop-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      label: "Tee Boxy Crop · software defaults",
      configuration: {
        targetStyle: "Boxy crop",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 54, armholeDepth: 24, sleeveLength: 22, ease: 17 },
        options: {},
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(currentStyles({ ...STANDARD_M, ...boxyCropEntry.configuration.measurements }, TEE_STYLES)).toEqual(["Boxy crop"]);
    expect(boxyCropEntry.supportedControls).toHaveLength(7);
    for (const [fieldId, defaultValue] of Object.entries(boxyCropEntry.configuration.measurements)) {
      expect(boxyCropEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(boxyCropEntry.supportedControls.find((control) => control.fieldId === "ease"))
      .toMatchObject({ kind: "design", min: 13, max: 30, step: 1, defaultValue: 17 });
    expect(boxyCropEntry.supportedControls.find((control) => control.fieldId === "length"))
      .toMatchObject({ kind: "design", min: 40, max: 57, step: 1, defaultValue: 54 });
    expect(boxyCropEntry.supportedControls.find((control) => control.fieldId === "chestEase")).toBeUndefined();
    expect(boxyCropEntry.intent.construction).toContain("standard shoulder/sleeve attachment");
    expect(boxyCropEntry.intent.construction).toContain("drop-shoulder geometry is not implemented");
    expect(boxyCropEntry.intent.fit).toContain("not validated fit targets");
    expect(boxyCropEntry.limits.join(" ")).toContain("17 cm ease and 54 cm length are product choices");
    expect(boxyCropEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(starterControlError(boxyCropEntry.entryId, "ease", 12)).toContain("13–30 cm");
    expect(starterControlError(boxyCropEntry.entryId, "ease", 31)).toContain("13–30 cm");
    expect(starterControlError(boxyCropEntry.entryId, "length", 39)).toContain("40–57 cm");
    expect(starterControlError(boxyCropEntry.entryId, "length", 58)).toContain("40–57 cm");
    expect(starterControlError(boxyCropEntry.entryId, "ease", 18)).toBeNull();
    expect(starterControlError(boxyCropEntry.entryId, "length", 55)).toBeNull();
  });

  it("creates and strictly validates an order-independent persisted origin snapshot", () => {
    expect(validOrigin).toEqual({
      entryId: entry.entryId,
      entryRevision: entry.entryRevision,
      recipeId: entry.recipeId,
      recipeRevision: entry.recipeRevision,
      configurationSnapshot: { targetStyle: "Classic tee", measurements: { ease: 7 }, options: { chestEase: 7 } },
    });
    expect(validOrigin.configurationSnapshot).not.toBe(entry.configuration);
    expect(starterOriginError(undefined)).toBeNull();
    expect(starterOriginError(null)).toBeNull();
    expect(starterOriginError(validOrigin)).toBeNull();
    expect(starterOriginError({ ...validOrigin, entryRevision: "2026-10-19.1" })).toBeNull();
    expect(starterOriginError({ ...validOrigin, entryRevision: "2026-10-19.2" })).toBeNull();
    expect(starterOriginError({
      configurationSnapshot: { options: { chestEase: 7 }, measurements: { ease: 7 }, targetStyle: "Classic tee" },
      recipeRevision: entry.recipeRevision,
      recipeId: entry.recipeId,
      entryRevision: entry.entryRevision,
      entryId: entry.entryId,
    })).toBeNull();
  });

  it("strictly validates the complete T01 default snapshot without making edits part of its origin", () => {
    const origin = starterOriginForEntry(blankEntry);
    expect(origin.configurationSnapshot).toEqual({
      targetStyle: "Classic tee",
      measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
      options: { chestEase: 7 },
    });
    expect(starterOriginError(origin)).toBeNull();
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Classic tee",
      measurements: { ...origin.configurationSnapshot.measurements, chest: 101 },
      options: { chestEase: 7 },
    } })).toContain("revision is unavailable");
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Classic tee",
      measurements: { ...origin.configurationSnapshot.measurements, extra: 1 },
      options: { chestEase: 7 },
    } })).toContain("revision is unavailable");
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Classic tee",
      measurements: { ...origin.configurationSnapshot.measurements },
      options: null,
    } })).toContain("revision is unavailable");
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Classic tee",
      measurements: { ...origin.configurationSnapshot.measurements },
      options: { chestEase: 8 },
    } })).toContain("revision is unavailable");
  });

  it("creates and strictly validates the T02 origin snapshot without a Classic chest-ease option", () => {
    const origin = starterOriginForEntry(relaxedEntry);
    expect(origin.configurationSnapshot).toEqual({
      targetStyle: "Relaxed tee",
      measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 13 },
      options: {},
    });
    expect(starterOriginError(origin)).toBeNull();
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Relaxed tee",
      measurements: { ...origin.configurationSnapshot.measurements, ease: 12 },
      options: {},
    } })).toContain("revision is unavailable");
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      targetStyle: "Relaxed tee",
      measurements: { ...origin.configurationSnapshot.measurements },
      options: { chestEase: 7 },
    } })).toContain("revision is unavailable");
  });

  it("creates and strictly validates the T03 origin snapshot separately from edited values", () => {
    const origin = starterOriginForEntry(boxyCropEntry);
    expect(origin.configurationSnapshot).toEqual({
      targetStyle: "Boxy crop",
      measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 54, armholeDepth: 24, sleeveLength: 22, ease: 17 },
      options: {},
    });
    expect(starterOriginError(origin)).toBeNull();
    expect(starterOriginError({ ...origin, configurationSnapshot: {
      ...origin.configurationSnapshot,
      measurements: { ...origin.configurationSnapshot.measurements, length: 55 },
    } })).toContain("revision is unavailable");
  });

  it("rejects malformed, unknown, stale, and changed snapshots with specific outcomes", () => {
    for (const malformed of [42, [], { ...validOrigin, unexpected: true }]) {
      expect(starterOriginError(malformed)).toBe("Saved starter origin is malformed.");
    }
    expect(starterOriginError({ entryId: entry.entryId, entryRevision: entry.entryRevision, recipeId: entry.recipeId,
      recipeRevision: entry.recipeRevision, unexpected: validOrigin.configurationSnapshot })).toBe("Saved starter origin is malformed.");
    expect(starterOriginError({ ...validOrigin, entryId: " " })).toBe("Saved starter origin has no entry ID.");
    expect(starterOriginError({ ...validOrigin, entryId: "missing-entry" }))
      .toContain("saved starter entry is unavailable");
    for (const changed of [
      { ...validOrigin, entryRevision: "old" },
      { ...validOrigin, recipeId: "fitted" },
      { ...validOrigin, recipeRevision: "old" },
      { ...validOrigin, configurationSnapshot: null },
      { ...validOrigin, configurationSnapshot: { targetStyle: "Classic tee" } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, targetStyle: "Fitted tee" } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, measurements: null } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, measurements: { ease: 7, extra: 1 } } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, measurements: { other: 7 } } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, measurements: { ease: 8 } } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, options: null } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, options: { chestEase: 7, extra: 1 } } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, options: { other: 7 } } },
      { ...validOrigin, configurationSnapshot: { ...validOrigin.configurationSnapshot, options: { chestEase: 8 } } },
    ]) {
      expect(starterOriginError(changed)).toContain("revision is unavailable");
    }
  });

  it("validates candidate-specific editable control bounds without clamping", () => {
    expect(starterControlError(null, "length", 80)).toBeNull();
    expect(starterControlError("missing-entry", "length", 70)).toContain("unavailable");
    expect(starterControlError(entry.entryId, "unsupported", 12)).toBeNull();
    expect(starterControlError(entry.entryId, "length", Number.NaN)).toContain("finite number");
    expect(starterControlError(entry.entryId, "length", 58)).toContain("59–74 cm");
    expect(starterControlError(entry.entryId, "length", 75)).toContain("59–74 cm");
    expect(starterControlError(entry.entryId, "length", 70)).toBeNull();
    expect(starterControlError(entry.entryId, "chestEase", 7.25)).toContain("0.5 cm increments");
    expect(starterControlError(entry.entryId, "ease", 7.5)).toContain("1 cm increments");
    expect(starterControlError(blankEntry.entryId, "chest", 59)).toContain("supports 60–160 cm");
    expect(starterControlError(blankEntry.entryId, "chest", 102)).toBeNull();
    expect(starterControlError(blankEntry.entryId, "shoulderWidth", 45.05)).toContain("0.1 cm increments");
    expect(starterControlError(blankEntry.entryId, "chestEase", 6.5)).toContain("supports 7–12 cm");
    expect(starterControlError(relaxedEntry.entryId, "ease", 12)).toContain("supports 13–18 cm");
    expect(starterControlError(relaxedEntry.entryId, "ease", 13)).toBeNull();
    expect(starterControlError(relaxedEntry.entryId, "ease", 18)).toBeNull();
    expect(starterControlError(relaxedEntry.entryId, "ease", 19)).toContain("supports 13–18 cm");
  });
});
