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
const cropEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-cropped-digital-v1")!;
const longlineEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-longline-digital-v1")!;
const vNeckEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-vneck-digital-v1")!;
const scoopEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-scoop-digital-v1")!;
const validOrigin = starterOriginForEntry(entry);

describe("Tee Classic starter registry", () => {
  it("preserves the bounded existing custom-measurement candidate and its claim limits", () => {
    expect(STARTER_REGISTRY.entries).toHaveLength(8);
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
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(7);
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
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(7);
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

  it("defines T04 as a complete cropped crew Tee using existing style and geometry contracts", () => {
    expect(cropEntry).toMatchObject({
      entryId: "tee-cropped-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      label: "Tee Crop · software defaults",
      configuration: {
        targetStyle: "Crop tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: {},
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(currentStyles({ ...STANDARD_M, ...cropEntry.configuration.measurements }, TEE_STYLES)).toEqual(["Crop tee"]);
    expect(cropEntry.supportedControls).toHaveLength(7);
    for (const [fieldId, defaultValue] of Object.entries(cropEntry.configuration.measurements)) {
      expect(cropEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(cropEntry.supportedControls.find((control) => control.fieldId === "ease"))
      .toMatchObject({ kind: "design", min: 0, max: 12, step: 1, defaultValue: 7 });
    expect(cropEntry.supportedControls.find((control) => control.fieldId === "length"))
      .toMatchObject({ kind: "design", min: 40, max: 57, step: 1, defaultValue: 53 });
    expect(cropEntry.supportedControls.find((control) => control.fieldId === "chestEase")).toBeUndefined();
    expect(cropEntry.intent.fit).toContain("7 cm ease and 53 cm length are software choices");
    expect(cropEntry.intent.construction).toContain("existing Tee draft logic and pattern topology");
    expect(cropEntry.intent.sizeScope).toContain("not a population chart or validated size-M profile");
    expect(cropEntry.limits.join(" ")).toContain("The 7 cm ease and 53 cm length are product choices");
    expect(cropEntry.limits.join(" ")).toContain("not sewn measurements or physical-fit evidence");
    expect(cropEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(starterControlError(cropEntry.entryId, "ease", -1)).toContain("0–12 cm");
    expect(starterControlError(cropEntry.entryId, "ease", 13)).toContain("0–12 cm");
    expect(starterControlError(cropEntry.entryId, "length", 39)).toContain("40–57 cm");
    expect(starterControlError(cropEntry.entryId, "length", 58)).toContain("40–57 cm");
    expect(starterControlError(cropEntry.entryId, "ease", 8)).toBeNull();
    expect(starterControlError(cropEntry.entryId, "length", 51)).toBeNull();
  });

  it("defines T05 as a complete Longline crew Tee profile inside existing style bounds", () => {
    expect(longlineEntry).toMatchObject({
      entryId: "tee-longline-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      label: "Tee Longline · software defaults",
      configuration: {
        targetStyle: "Longline tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 80, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: {},
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(currentStyles({ ...STANDARD_M, ...longlineEntry.configuration.measurements }, TEE_STYLES))
      .toEqual(["Longline tee"]);
    expect(starterEntryById("tee-longline-digital-v1")).toBe(longlineEntry);
    expect(longlineEntry.supportedControls).toHaveLength(7);
    for (const [fieldId, defaultValue] of Object.entries(longlineEntry.configuration.measurements)) {
      expect(longlineEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(longlineEntry.supportedControls.find((control) => control.fieldId === "ease"))
      .toMatchObject({ kind: "design", min: 7, max: 18, step: 1, defaultValue: 7 });
    expect(longlineEntry.supportedControls.find((control) => control.fieldId === "length"))
      .toMatchObject({ kind: "design", min: 78, max: 100, step: 1, defaultValue: 80 });
    expect(longlineEntry.supportedControls.find((control) => control.fieldId === "chestEase")).toBeUndefined();
    expect(longlineEntry.intent.fit).toContain("7 cm ease and 80 cm length are software choices");
    expect(longlineEntry.intent.construction).toContain("existing Tee draft logic and pattern topology");
    expect(longlineEntry.intent.sizeScope).toContain("not a population chart or validated size-M profile");
    expect(longlineEntry.intent.sizeScope).toContain("maps modeled length to HPS-to-hem");
    expect(longlineEntry.intent.sizeScope).toContain("generic Tee recipe references, not validated tolerances for this starter");
    expect(longlineEntry.limits.join(" ")).toContain("The 7 cm ease and 80 cm length are product choices");
    expect(longlineEntry.limits.join(" ")).toContain("not sewn measurements or physical-fit evidence");
    expect(longlineEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(starterControlError(longlineEntry.entryId, "ease", 6)).toContain("7–18 cm");
    expect(starterControlError(longlineEntry.entryId, "ease", 19)).toContain("7–18 cm");
    expect(starterControlError(longlineEntry.entryId, "length", 77)).toContain("78–100 cm");
    expect(starterControlError(longlineEntry.entryId, "length", 101)).toContain("78–100 cm");
    expect(starterControlError(longlineEntry.entryId, "ease", 18)).toBeNull();
    expect(starterControlError(longlineEntry.entryId, "length", 100)).toBeNull();
  });

  it("defines T06 as an explicitly incomplete digital V-neck candidate", () => {
    expect(vNeckEntry).toMatchObject({
      entryId: "tee-vneck-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      label: "Tee V-neck · software defaults",
      configuration: {
        targetStyle: "Classic tee",
        measurements: { chest: 100, shoulderWidth: 45, length: 70, ease: 7 },
        options: { chestEase: 7, teeVNeckDropCm: 5 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(vNeckEntry.supportedControls.find((control) => control.fieldId === "teeVNeckDropCm"))
      .toMatchObject({ kind: "option", min: 0, max: 15, step: 0.5, defaultValue: 5 });
    expect(vNeckEntry.intent.construction).toContain("V-neck finish and band construction are unresolved");
    expect(vNeckEntry.limits.join(" ")).toContain("outside the 56 digitally complete count");
    expect(starterEntryById(vNeckEntry.entryId)).toBe(vNeckEntry);
    expect(starterControlError(vNeckEntry.entryId, "teeVNeckDropCm", -0.5)).toContain("0–15 cm");
    expect(starterControlError(vNeckEntry.entryId, "teeVNeckDropCm", 15.5)).toContain("0–15 cm");
    expect(starterControlError(vNeckEntry.entryId, "teeVNeckDropCm", 5.25)).toContain("0.5 cm increments");
    expect(starterControlError(vNeckEntry.entryId, "teeVNeckDropCm", 7.5)).toBeNull();
  });

  it("defines T07 as an editable Scoop Tee with a bounded software default and separate claim gates", () => {
    expect(scoopEntry).toMatchObject({
      entryId: "tee-scoop-digital-v1",
      entryRevision: "2026-10-21.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      catalogKind: "blank",
      label: "Tee Scoop-neck · software defaults",
      configuration: {
        targetStyle: "Classic tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { chestEase: 7, teeScoopNeckDropCm: 5 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(scoopEntry.supportedControls).toHaveLength(9);
    expect(scoopEntry.supportedControls.find((control) => control.fieldId === "teeScoopNeckDropCm"))
      .toMatchObject({ kind: "option", min: 0, max: 15, step: 0.5, defaultValue: 5 });
    expect(scoopEntry.intent.fit).toContain("5 cm added front depth");
    expect(scoopEntry.intent.fit).toContain("not validated fit targets");
    expect(scoopEntry.intent.construction).toContain("provisional rectangle derived from the active neckline seamline");
    expect(scoopEntry.limits.join(" ")).toContain("fabric stretch/recovery and physical construction have not been validated");
    expect(scoopEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(starterControlError(scoopEntry.entryId, "teeScoopNeckDropCm", -0.5)).toContain("0–15 cm");
    expect(starterControlError(scoopEntry.entryId, "teeScoopNeckDropCm", 15.5)).toContain("0–15 cm");
    expect(starterControlError(scoopEntry.entryId, "teeScoopNeckDropCm", 5.25)).toContain("0.5 cm increments");
    expect(starterControlError(scoopEntry.entryId, "teeScoopNeckDropCm", 7.5)).toBeNull();
    expect(starterEntryById(scoopEntry.entryId)).toBe(scoopEntry);
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

  it("creates and validates a T04 origin snapshot for the exact cropped Tee defaults", () => {
    const origin = starterOriginForEntry(cropEntry);
    expect(origin).toEqual({
      entryId: "tee-cropped-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
      configurationSnapshot: {
        targetStyle: "Crop tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: {},
      },
    });
    expect(starterOriginError(origin)).toBeNull();
    expect(starterOriginError({
      ...origin,
      configurationSnapshot: {
        ...origin.configurationSnapshot,
        measurements: { ...origin.configurationSnapshot.measurements, length: 51 },
      },
    })).toContain("revision is unavailable");
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
