import { describe, expect, it } from "vitest";
import {
  STARTER_REGISTRY,
  starterControlError,
  starterEntryById,
  starterOriginError,
  starterOriginForEntry,
} from "./starter-registry";
import { currentStyles, TEE_STYLES, FITTED_STYLES, TANK_STYLES } from "../style/style";
import { STANDARD_M } from "../drafting";

const entry = STARTER_REGISTRY.entries[0]!;
const blankEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.catalogKind === "blank")!;
const relaxedEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-relaxed-digital-v1")!;
const boxyCropEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-boxy-crop-digital-v1")!;
const cropEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-cropped-digital-v1")!;
const longlineEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-longline-digital-v1")!;
const vNeckEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-vneck-digital-v1")!;
const scoopEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-scoop-digital-v1")!;
const raglanEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tee-raglan-digital-v1")!;
const fittedEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-tee-digital-v1")!;
const fittedWaistDartEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-waist-dart-tee-digital-v1")!;
const fittedPrincessEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-princess-tee-digital-v1")!;
const fittedVneckEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-vneck-tee-digital-v1")!;
const fittedScoopEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-scoop-tee-digital-v1")!;
const fittedCapSleeveEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-cap-sleeve-tee-digital-v1")!;
const fittedThreeQuarterSleeveEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-three-quarter-sleeve-tee-digital-v1")!;
const fittedCropEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "fitted-cropped-tee-digital-v1")!;
const tankEntry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === "tank-classic-scoop-digital-v1")!;
const validOrigin = starterOriginForEntry(entry);

describe("Tee Classic starter registry", () => {
  it("preserves the bounded existing custom-measurement candidate and its claim limits", () => {
    expect(STARTER_REGISTRY.entries).toHaveLength(18);
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
    expect(STARTER_REGISTRY.catalogRevision).toBe("g18-catalog-v11");
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
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(17);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "custom-measurement")).toHaveLength(1);
  });

  it("defines N01 as an editable Classic scoop Tank with software-only defaults and honest limits", () => {
    expect(tankEntry).toMatchObject({
      entryId: "tank-classic-scoop-digital-v1",
      entryRevision: "2026-10-24.1",
      recipeId: "tank",
      recipeRevision: "tank-classic-scoop-v1",
      catalogKind: "blank",
      label: "Classic scoop Tank · software defaults",
      configuration: {
        targetStyle: "Classic tank",
        measurements: {
          chest: 100, shoulderWidth: 45, length: 70, armholeDepth: 24,
          strapWidth: 8, neckDrop: 5, neckWidthEase: 0, ease: 10,
        },
        options: {},
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(tankEntry.supportedControls).toEqual([
      { fieldId: "chest", label: "Chest", kind: "measurement", unit: "cm", min: 60, max: 160, step: 1, defaultValue: 100 },
      { fieldId: "shoulderWidth", label: "Shoulder width (biacromial breadth)", kind: "measurement", unit: "cm", min: 30, max: 70, step: 0.1, defaultValue: 45 },
      { fieldId: "length", label: "Length", kind: "design", unit: "cm", min: 59, max: 74, step: 1, defaultValue: 70 },
      { fieldId: "armholeDepth", label: "Armhole depth", kind: "design", unit: "cm", min: 12, max: 40, step: 1, defaultValue: 24 },
      { fieldId: "strapWidth", label: "Strap width (finished)", kind: "design", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 8 },
      { fieldId: "neckDrop", label: "Neck scoop depth", kind: "design", unit: "cm", min: 0, max: 18, step: 0.5, defaultValue: 5 },
      { fieldId: "neckWidthEase", label: "Neckline width adjustment", kind: "design", unit: "cm", min: -4, max: 12, step: 0.5, defaultValue: 0 },
      { fieldId: "ease", label: "Ease", kind: "design", unit: "cm", min: 5, max: 10, step: 1, defaultValue: 10 },
    ]);
    expect(TANK_STYLES.find((style) => style.name === tankEntry.configuration.targetStyle)?.ranges)
      .toMatchObject({ ease: [5, 10], length: [59, 74] });
    expect(tankEntry.intent.construction).toContain("two body panels, scoop front, crew back");
    expect(tankEntry.intent.construction).toContain("no separate strap-width POM");
    expect(tankEntry.intent.sizeScope).toContain("not a validated N01 grade");
    expect(tankEntry.limits.join(" ")).toContain("not a sourced physical wide/narrow standard");
    expect(tankEntry.limits.join(" ")).toContain("generic Tank size run and Tech Pack");
    expect(tankEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    for (const [fieldId, defaultValue] of Object.entries(tankEntry.configuration.measurements)) {
      expect(tankEntry.supportedControls.find((control) => control.fieldId === fieldId)?.defaultValue).toBe(defaultValue);
    }
    expect(tankEntry.supportedControls).toHaveLength(8);
    expect(starterEntryById(tankEntry.entryId)).toBe(tankEntry);
    expect(starterOriginError(starterOriginForEntry(tankEntry))).toBeNull();
    expect(starterControlError(tankEntry.entryId, "strapWidth", 8)).toBeNull();
    expect(starterControlError(tankEntry.entryId, "strapWidth", 16)).toContain("0–15 cm");
    expect(starterControlError(tankEntry.entryId, "strapWidth", 8.2)).toContain("0.5 cm increments from 0 cm");
    expect(STARTER_REGISTRY.entries).toHaveLength(18);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(17);
  });

  it("defines F01 as a complete editable Fitted Tee with software-only controls and limits", () => {
    expect(fittedEntry).toMatchObject({
      entryId: "fitted-tee-digital-v1", entryRevision: "2026-10-22.1",
      recipeId: "fitted", recipeRevision: "fitted-bust-dart-v1", catalogKind: "blank",
      label: "Fitted crew Tee · software defaults",
      configuration: { targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 } },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedEntry.supportedControls).toHaveLength(10);
    expect(fittedEntry.supportedControls.find((control) => control.fieldId === "chestEase")).toBeUndefined();
    expect(fittedEntry.supportedControls.find((control) => control.fieldId === "bustApexHorizontal"))
      .toMatchObject({ kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 55 });
    expect(fittedEntry.supportedControls.find((control) => control.fieldId === "bustApexVertical"))
      .toMatchObject({ kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 28 });
    expect(fittedEntry.intent.construction).toContain("digital construction check");
    expect(fittedEntry.limits.join(" ")).toContain("not been independently validated for this Fitted starter");
    expect(currentStyles({ ...STANDARD_M, ...fittedEntry.configuration.measurements }, FITTED_STYLES)).toEqual(["Fitted tee"]);
    expect(starterControlError(fittedEntry.entryId, "bustApexHorizontal", 19)).toContain("20–80 %");
    expect(starterControlError(fittedEntry.entryId, "bustApexHorizontal", 20.5)).toContain("1 % increments");
    expect(starterControlError(fittedEntry.entryId, "bustApexHorizontal", 20)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedEntry))).toBeNull();
    expect(fittedEntry.configuration.options).not.toHaveProperty("waistDartIntake");
    expect(fittedEntry.supportedControls.some((control) => control.fieldId.startsWith("waistDart"))).toBe(false);
  });

  it("defines F02 as a separate editable waist-darted Fitted Tee without changing F01's target fit", () => {
    expect(fittedWaistDartEntry).toMatchObject({
      entryId: "fitted-waist-dart-tee-digital-v1", entryRevision: "2026-10-22.1",
      recipeId: "fitted", recipeRevision: "fitted-waist-dart-v1", catalogKind: "blank",
      label: "Waist-darted fitted Tee · software defaults",
      configuration: { targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28,
          waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45 } },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedWaistDartEntry.supportedControls).toHaveLength(14);
    expect(fittedWaistDartEntry.supportedControls.filter((control) => control.fieldId.startsWith("waistDart")))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ fieldId: "waistDartWaistlineFromHps", min: 30, max: 60, defaultValue: 43 }),
        expect.objectContaining({ fieldId: "waistDartIntake", min: 0.5, max: 6, defaultValue: 2 }),
        expect.objectContaining({ fieldId: "waistDartLength", min: 4, max: 18, defaultValue: 10 }),
        expect.objectContaining({ fieldId: "waistDartPosition", min: 20, max: 80, defaultValue: 45 }),
      ]));
    expect(fittedWaistDartEntry.intent.construction).toContain("internal construction marks");
    expect(fittedWaistDartEntry.intent.construction).toContain("does not simulate sewn take-up");
    expect(fittedWaistDartEntry.limits.join(" ")).toContain("not a body-waist measurement");
    expect(fittedWaistDartEntry.limits.join(" ")).toContain("B1 technical-design review is pending");
    expect(currentStyles({ ...STANDARD_M, ...fittedWaistDartEntry.configuration.measurements }, FITTED_STYLES))
      .toEqual(["Fitted tee"]);
    expect(starterControlError(fittedWaistDartEntry.entryId, "waistDartIntake", 6.5)).toContain("0.5–6 cm");
    expect(starterControlError(fittedWaistDartEntry.entryId, "waistDartPosition", 20.5)).toContain("1 % increments");
    expect(starterControlError(fittedWaistDartEntry.entryId, "waistDartLength", 18)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedWaistDartEntry))).toBeNull();
  });

  it("defines F03 as an editable princess-seam Fitted Tee with distinct digital controls and claims", () => {
    expect(fittedPrincessEntry).toMatchObject({
      entryId: "fitted-princess-tee-digital-v1", entryRevision: "2026-10-23.1",
      recipeId: "fitted", recipeRevision: "fitted-princess-seam-v1", catalogKind: "blank",
      label: "Princess-seam fitted Tee · software defaults",
      configuration: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { princessSeamShaping: 2, princessApexHorizontal: 55, princessApexVertical: 28, princessShoulderOrigin: 60 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedPrincessEntry.supportedControls).toHaveLength(11);
    expect(fittedPrincessEntry.supportedControls.map((control) => control.fieldId)).not.toEqual(
      expect.arrayContaining(["dartIntake", "bustApexHorizontal", "waistDartIntake"]));
    expect(fittedPrincessEntry.supportedControls.find((control) => control.fieldId === "princessSeamShaping"))
      .toMatchObject({ kind: "option", unit: "cm", min: 0, max: 6, step: 0.5, defaultValue: 2 });
    expect(fittedPrincessEntry.supportedControls.find((control) => control.fieldId === "princessShoulderOrigin"))
      .toMatchObject({ kind: "option", unit: "%", min: 20, max: 80, step: 1, defaultValue: 60 });
    expect(fittedPrincessEntry.intent.construction).toContain("center-front piece on fold");
    expect(fittedPrincessEntry.intent.construction).toContain("mirrored side-front pieces");
    expect(fittedPrincessEntry.limits.join(" ")).toContain("B1 technical-design review is pending");
    expect(fittedPrincessEntry.limits.join(" ")).toContain("physical-fit, comfort, wear");
    expect(starterControlError(fittedPrincessEntry.entryId, "princessSeamShaping", 6.5)).toContain("0–6 cm");
    expect(starterControlError(fittedPrincessEntry.entryId, "princessApexHorizontal", 20.5)).toContain("1 % increments");
    expect(starterControlError(fittedPrincessEntry.entryId, "princessShoulderOrigin", 20)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedPrincessEntry))).toBeNull();
  });

  it("defines F04 as a bust-darted V-neck Fitted Tee with selected-size-only band output", () => {
    expect(fittedVneckEntry).toMatchObject({
      entryId: "fitted-vneck-tee-digital-v1", entryRevision: "2026-10-23.1",
      recipeId: "fitted", recipeRevision: "fitted-v-neck-v1", catalogKind: "blank",
      label: "Fitted V-neck Tee · software defaults",
      configuration: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, teeVNeckDropCm: 5 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedVneckEntry.supportedControls).toHaveLength(11);
    expect(fittedVneckEntry.supportedControls.find((control) => control.fieldId === "teeVNeckDropCm"))
      .toMatchObject({ kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 });
    expect(fittedVneckEntry.intent.construction).toContain("entry-scoped straight V neckline");
    expect(fittedVneckEntry.intent.construction).toContain("not sewn-fit or material evidence");
    expect(fittedVneckEntry.limits.join(" ")).toContain("graded V-band output is not supplied");
    expect(fittedVneckEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(currentStyles({ ...STANDARD_M, ...fittedVneckEntry.configuration.measurements }, FITTED_STYLES))
      .toEqual(["Fitted tee"]);
    expect(starterControlError(fittedVneckEntry.entryId, "teeVNeckDropCm", 15.5)).toContain("0–15 cm");
    expect(starterControlError(fittedVneckEntry.entryId, "teeVNeckDropCm", 5.25)).toContain("0.5 cm increments");
    expect(starterOriginError(starterOriginForEntry(fittedVneckEntry))).toBeNull();
  });

  it("defines F05 as an entry-scoped fitted Scoop blank with selected-size band output limits", () => {
    expect(fittedScoopEntry).toMatchObject({
      entryId: "fitted-scoop-tee-digital-v1",
      entryRevision: "2026-10-23.1",
      recipeId: "fitted",
      recipeRevision: "fitted-scoop-v1",
      catalogKind: "blank",
      label: "Fitted Scoop-neck Tee · software defaults",
      configuration: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, teeScoopNeckDropCm: 5 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedScoopEntry.supportedControls).toHaveLength(11);
    expect(fittedScoopEntry.supportedControls.find((control) => control.fieldId === "teeScoopNeckDropCm"))
      .toMatchObject({ kind: "option", unit: "cm", min: 0, max: 15, step: 0.5, defaultValue: 5 });
    expect(fittedScoopEntry.intent.construction).toContain("entry-scoped rounded Scoop neckline");
    expect(fittedScoopEntry.intent.construction).toContain("not sewn-fit or material evidence");
    expect(fittedScoopEntry.limits.join(" ")).toContain("graded neckband output is not supplied");
    expect(fittedScoopEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear, material-performance");
    expect(currentStyles({ ...STANDARD_M, ...fittedScoopEntry.configuration.measurements }, FITTED_STYLES))
      .toEqual(["Fitted tee"]);
    expect(starterControlError(fittedScoopEntry.entryId, "teeScoopNeckDropCm", 15.5)).toContain("0–15 cm");
    expect(starterControlError(fittedScoopEntry.entryId, "teeScoopNeckDropCm", 5.25)).toContain("0.5 cm increments");
    expect(starterOriginError(starterOriginForEntry(fittedScoopEntry))).toBeNull();
  });

  it("defines F06 with a bounded short sleeve and entry-scoped underarm taper", () => {
    expect(fittedCapSleeveEntry).toMatchObject({
      entryId: "fitted-cap-sleeve-tee-digital-v1",
      entryRevision: "2026-10-24.1",
      recipeId: "fitted",
      recipeRevision: "fitted-cap-sleeve-v1",
      catalogKind: "blank",
      label: "Fitted Cap-Sleeve Tee · software defaults",
      configuration: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 8, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28, capSleeveUnderarmTrimCm: 0.6 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedCapSleeveEntry.supportedControls).toHaveLength(11);
    expect(fittedCapSleeveEntry.supportedControls.find((control) => control.fieldId === "sleeveLength"))
      .toMatchObject({ label: "Sleeve length below modeled cap base", min: 8, max: 10, step: 1, defaultValue: 8 });
    expect(fittedCapSleeveEntry.supportedControls.find((control) => control.fieldId === "capSleeveUnderarmTrimCm"))
      .toMatchObject({ kind: "option", min: 0, max: 1.5, step: 0.1, defaultValue: 0.6 });
    expect(fittedCapSleeveEntry.intent.construction).toContain("actual assembled armhole");
    expect(fittedCapSleeveEntry.intent.construction).toContain("separate sleeve-length POM includes cap height");
    expect(fittedCapSleeveEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear");
    expect(starterControlError(fittedCapSleeveEntry.entryId, "sleeveLength", 7)).toContain("8–10 cm");
    expect(starterControlError(fittedCapSleeveEntry.entryId, "sleeveLength", 8.5)).toContain("1 cm increments");
    expect(starterControlError(fittedCapSleeveEntry.entryId, "sleeveLength", 8)).toBeNull();
    expect(starterControlError(fittedCapSleeveEntry.entryId, "capSleeveUnderarmTrimCm", 1.6)).toContain("0–1.5 cm");
    expect(starterControlError(fittedCapSleeveEntry.entryId, "capSleeveUnderarmTrimCm", 0.65)).toContain("0.1 cm increments");
    expect(starterControlError(fittedCapSleeveEntry.entryId, "capSleeveUnderarmTrimCm", 1.5)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedCapSleeveEntry))).toBeNull();
  });

  it("defines F07 as a distinct fitted three-quarter-sleeve profile with an explicit digital length guardrail", () => {
    expect(fittedThreeQuarterSleeveEntry).toMatchObject({
      entryId: "fitted-three-quarter-sleeve-tee-digital-v1",
      entryRevision: "2026-10-24.1",
      recipeId: "fitted",
      recipeRevision: "fitted-three-quarter-sleeve-v1",
      catalogKind: "blank",
      label: "Fitted Three-Quarter-Sleeve Tee · software defaults",
      configuration: {
        targetStyle: "Fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 38, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedThreeQuarterSleeveEntry.supportedControls).toHaveLength(10);
    expect(fittedThreeQuarterSleeveEntry.supportedControls.find((control) => control.fieldId === "sleeveLength"))
      .toMatchObject({ label: "Sleeve length below modeled cap base", min: 34, max: 44, step: 1, defaultValue: 38 });
    expect(fittedThreeQuarterSleeveEntry.supportedControls.find((control) => control.fieldId === "capSleeveUnderarmTrimCm")).toBeUndefined();
    expect(fittedThreeQuarterSleeveEntry.intent.construction).toContain("actual assembled armhole");
    expect(fittedThreeQuarterSleeveEntry.intent.construction).toContain("does not guarantee an elbow-to-wrist endpoint");
    expect(fittedThreeQuarterSleeveEntry.limits.join(" ")).toContain("software choices");
    expect(fittedThreeQuarterSleeveEntry.limits.join(" ")).toContain("does not locate the wearer's elbow or wrist");
    expect(fittedThreeQuarterSleeveEntry.limits.join(" ")).toContain("No physical-fit, comfort, mobility, wear");
    expect(starterControlError(fittedThreeQuarterSleeveEntry.entryId, "sleeveLength", 33)).toContain("34–44 cm");
    expect(starterControlError(fittedThreeQuarterSleeveEntry.entryId, "sleeveLength", 34.5)).toContain("1 cm increments");
    expect(starterControlError(fittedThreeQuarterSleeveEntry.entryId, "sleeveLength", 44)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedThreeQuarterSleeveEntry))).toBeNull();
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(17);
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "custom-measurement")).toHaveLength(1);
  });

  it("defines F08 as a distinct cropped Fitted starter with editable software defaults", () => {
    expect(fittedCropEntry).toMatchObject({
      entryId: "fitted-cropped-tee-digital-v1",
      entryRevision: "2026-10-24.1",
      recipeId: "fitted",
      recipeRevision: "fitted-cropped-v1",
      catalogKind: "blank",
      label: "Cropped fitted Tee · software defaults",
      configuration: {
        targetStyle: "Cropped fitted tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 53, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(fittedCropEntry.supportedControls).toHaveLength(10);
    expect(fittedCropEntry.supportedControls.find((control) => control.fieldId === "length"))
      .toMatchObject({ kind: "design", min: 40, max: 57, step: 1, defaultValue: 53 });
    expect(fittedCropEntry.supportedControls.filter((control) => control.fieldId !== "length"))
      .toEqual(fittedEntry.supportedControls.filter((control) => control.fieldId !== "length"));
    expect(fittedCropEntry.intent.fit).toContain("not validated fit targets or a physical crop landmark");
    expect(fittedCropEntry.intent.construction).toContain("digital construction check");
    expect(fittedCropEntry.limits.join(" ")).toContain("does not locate a physical crop endpoint");
    expect(fittedCropEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear");
    expect(currentStyles({ ...STANDARD_M, ...fittedCropEntry.configuration.measurements }, FITTED_STYLES))
      .toEqual(["Cropped fitted tee"]);
    expect(starterControlError(fittedCropEntry.entryId, "length", 39)).toContain("40–57 cm");
    expect(starterControlError(fittedCropEntry.entryId, "length", 58)).toContain("40–57 cm");
    expect(starterControlError(fittedCropEntry.entryId, "length", 52.5)).toContain("1 cm increments");
    expect(starterControlError(fittedCropEntry.entryId, "length", 40)).toBeNull();
    expect(starterControlError(fittedCropEntry.entryId, "length", 57)).toBeNull();
    expect(starterOriginError(starterOriginForEntry(fittedCropEntry))).toBeNull();
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
    expect(STARTER_REGISTRY.entries.filter((candidate) => candidate.catalogKind === "blank")).toHaveLength(17);
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

  it("defines T08 as a crew-neck Raglan Tee construction variant with separate digital and physical gates", () => {
    expect(raglanEntry).toMatchObject({
      entryId: "tee-raglan-digital-v1",
      entryRevision: "2026-10-22.1",
      recipeId: "tee",
      recipeRevision: "raglan-tee-v1",
      teeConstruction: "raglan",
      catalogKind: "blank",
      label: "Tee Raglan · software defaults",
      configuration: {
        targetStyle: "Classic tee",
        measurements: { chest: 100, shoulderWidth: 45, bicep: 38, length: 70, armholeDepth: 24, sleeveLength: 22, ease: 7 },
        options: { chestEase: 7 },
      },
      gates: { b1: "pending", physical: "not-validated" },
    });
    expect(raglanEntry.intent.construction).toContain("distinct digital Raglan body and sleeve topology");
    expect(raglanEntry.limits.join(" ")).toContain("generic Tee grade rule is reused as a software starting point");
    expect(raglanEntry.limits.join(" ")).toContain("No physical-fit, comfort, wear");
    expect(starterOriginError(starterOriginForEntry(raglanEntry))).toBeNull();
    expect(starterControlError(raglanEntry.entryId, "length", 70)).toBeNull();
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
