import { describe, expect, it } from "vitest";
import {
  STARTER_REGISTRY,
  starterControlError,
  starterEntryById,
  starterOriginError,
  starterOriginForEntry,
} from "./starter-registry";

const entry = STARTER_REGISTRY.entries[0]!;
const blankEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.catalogKind === "blank")!;
const validOrigin = starterOriginForEntry(entry);

describe("Tee Classic starter registry", () => {
  it("preserves the bounded existing custom-measurement candidate and its claim limits", () => {
    expect(STARTER_REGISTRY.entries).toHaveLength(2);
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
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(1);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "custom-measurement")).toHaveLength(1);
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
  });
});
