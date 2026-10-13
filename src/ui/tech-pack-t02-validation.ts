import { gradeRun, type GarmentOptions, type GarmentRecipe, type Measurements, type SizeStep } from "../drafting";
import type { TechPackPomDefinition } from "./tech-pack-pom-records";
import type { TechPackPomRecordSet } from "./tech-pack-sample-qa-records";
import type { TechPackRecord } from "./tech-pack-records";

export type TechPackT02FindingStatus = "UNRESOLVED" | "CONFLICT" | "INVALID";

export interface TechPackT02Finding {
  readonly calloutLabel: string | null;
  readonly field: string;
  readonly status: TechPackT02FindingStatus;
  readonly message: string;
  readonly nextAction: string;
}

export interface TechPackT02CalloutCheck {
  readonly label: string;
  readonly definitionId: string | null;
  readonly ready: boolean;
}

export interface TechPackT02Prediction {
  readonly label: string;
  readonly values: readonly {
    readonly sizeId: string;
    readonly value: number | null;
  }[];
}

export interface TechPackT02Validation {
  readonly recipeId: string;
  readonly sizeIds: readonly string[];
  readonly baseSizeId: string | null;
  readonly callouts: readonly TechPackT02CalloutCheck[];
  readonly predictions: readonly TechPackT02Prediction[];
  readonly findings: readonly TechPackT02Finding[];
  readonly completeCalloutCount: number;
  readonly sizeRunReady: boolean;
  readonly ready: boolean;
}

export interface EvaluateTechPackT02Input {
  readonly record: TechPackRecord;
  readonly data: TechPackPomRecordSet;
  readonly recipe: GarmentRecipe;
  readonly measurements: Measurements;
  readonly options: GarmentOptions;
  readonly sizeSteps: readonly SizeStep[];
}

function messageOf(error: unknown): string {
  return error instanceof Error && error.message.length > 0 ? error.message : "Pattern calculation failed.";
}

function addFinding(
  findings: TechPackT02Finding[],
  calloutLabel: string | null,
  field: string,
  status: TechPackT02FindingStatus,
  message: string,
  nextAction: string,
): void {
  findings.push({ calloutLabel, field, status, message, nextAction });
}

function checkSource(
  findings: TechPackT02Finding[],
  label: string,
  field: string,
  value: TechPackPomDefinition["method"] | TechPackPomDefinition["landmarks"]
    | TechPackPomDefinition["tolerance"] | TechPackPomDefinition["sizeRangeSource"]
    | TechPackPomDefinition["gradeRuleSource"],
): void {
  if (value.status === "SOURCE_CONFIRMED") return;
  addFinding(
    findings,
    label,
    field,
    value.status === "CONFLICT" ? "CONFLICT" : "UNRESOLVED",
    value.unresolvedReason,
    value.nextAction,
  );
}

function sameOrderedValues(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function evaluateTechPackT02(input: EvaluateTechPackT02Input): TechPackT02Validation {
  const { record, data, recipe, measurements, options, sizeSteps } = input;
  const findings: TechPackT02Finding[] = [];
  const sizeIds = sizeSteps.map((size) => size.label);
  const baseSteps = sizeSteps.filter((size) => size.step === 0);
  const recipeId = recipe.name;

  if (record.recipeId !== recipe.name || data.definitions.recipeId !== recipe.name) {
    addFinding(findings, null, "Recipe", "INVALID",
      "The T02 record, definition set, and active recipe do not match.",
      "Reload the active style and edit T02 only for its recorded recipe.");
  }
  if (sizeIds.length === 0) {
    addFinding(findings, null, "Size run", "INVALID", "The recipe declares no sizes.",
      "Repair the recipe size run before checking a T02 record.");
  }
  if (new Set(sizeIds).size !== sizeIds.length) {
    addFinding(findings, null, "Size run", "INVALID", "The recipe has duplicate size IDs.",
      "Make each recipe size ID unique before checking its POM run.");
  }
  if (baseSteps.length !== 1) {
    addFinding(findings, null, "Base size", "INVALID",
      `The recipe run must contain exactly one base step (step 0); found ${baseSteps.length}.`,
      "Repair the recipe size steps so exactly one size is the base.");
  }

  const predictions: TechPackT02Prediction[] = [];
  let graded: ReturnType<typeof gradeRun> | null = null;
  try {
    graded = gradeRun(measurements, recipe.grade, sizeSteps, recipe.draft, options);
  } catch (error) {
    addFinding(findings, null, "Size run", "INVALID",
      `Pattern predictions could not be calculated: ${messageOf(error)}`,
      "Correct the saved design inputs or recipe grading configuration, then recalculate.");
  }

  for (const pom of recipe.poms) {
    const values = sizeSteps.map((size, index) => {
      if (!graded) return { sizeId: size.label, value: null };
      try {
        const value = pom.measure(graded[index]!.block);
        if (typeof value !== "number" || !Number.isFinite(value)) {
          addFinding(findings, pom.label, "Pattern prediction", "INVALID",
            `The predicted value is not finite for size ${size.label}.`,
            "Correct the saved design inputs or recipe POM calculation; no value was substituted.");
          return { sizeId: size.label, value: null };
        }
        return { sizeId: size.label, value: Math.round(value * 10) / 10 };
      } catch (error) {
        addFinding(findings, pom.label, "Pattern prediction", "INVALID",
          `The predicted value could not be calculated for size ${size.label}: ${messageOf(error)}`,
          "Correct the saved design inputs or recipe POM calculation; no value was substituted.");
        return { sizeId: size.label, value: null };
      }
    });
    predictions.push({ label: pom.label, values });

    const matches = data.definitions.definitions.filter((definition) => definition.label === pom.label);
    if (matches.length === 0) {
      addFinding(findings, pom.label, "POM definition", "UNRESOLVED",
        "No T02 definition matches this recipe POM label.",
        "Add a T02 definition with this exact label and attach its method, landmarks, tolerance, size-range, and grade-rule sources.");
      continue;
    }
    if (matches.length > 1) {
      addFinding(findings, pom.label, "POM definition", "INVALID",
        `More than one T02 definition matches this recipe POM label (${matches.length}).`,
        "Keep one definition for the exact recipe POM label and remove or rename duplicates.");
      continue;
    }
    const definition = matches[0]!;
    checkSource(findings, pom.label, "Method", definition.method);
    checkSource(findings, pom.label, "Landmarks", definition.landmarks);
    checkSource(findings, pom.label, "Tolerance", definition.tolerance);
    checkSource(findings, pom.label, "Size-range source", definition.sizeRangeSource);
    checkSource(findings, pom.label, "Grade-rule source", definition.gradeRuleSource);
  }

  for (const definition of data.definitions.definitions) {
    if (!recipe.poms.some((pom) => pom.label === definition.label)) {
      addFinding(findings, definition.label, "POM definition", "INVALID",
        "This T02 definition does not match a current recipe POM label.",
        "Use an exact current recipe POM label or keep the item unresolved until a supported callout exists.");
    }
  }

  const supportedRunIds = baseSteps.length === 1 ? sizeIds : [];
  const sourceRanges = data.definitions.definitions.flatMap((definition) =>
    definition.sizeRangeSource.status === "SOURCE_CONFIRMED"
      ? [{ definition, value: definition.sizeRangeSource.value }]
      : []);
  const uniqueRangeIds = new Set(sourceRanges.map(({ value }) => JSON.stringify(value)));
  const canonicalRange = sourceRanges[0]?.value ?? null;

  if (sourceRanges.length === 0) {
    addFinding(findings, null, "Size run", "UNRESOLVED",
      "No source-confirmed size range is available for the T02 callouts.",
      "Record a sourced ordered size range and base size for every callout.");
  } else {
    if (uniqueRangeIds.size > 1) {
      addFinding(findings, null, "Size run", "INVALID",
        "T02 callouts cite different size ranges or base sizes.",
        "Resolve the source discrepancy and use one consistent size range across the callouts.");
    }
    if (!sameOrderedValues(canonicalRange!.sizeIds, supportedRunIds)) {
      addFinding(findings, null, "Size run", "INVALID",
        `The sourced size run (${canonicalRange!.sizeIds.join(", ")}) does not match the recipe run (${supportedRunIds.join(", ")}).`,
        "Use a sourced size range that matches the full supported recipe run or correct the style to a supported run.");
    }
    if (!canonicalRange!.sizeIds.includes(canonicalRange!.baseSizeId)) {
      addFinding(findings, null, "Base size", "INVALID",
        "The sourced base size is not a member of its sourced size range.",
        "Choose a base size contained in the sourced range.");
    }
    if (baseSteps.length === 1 && canonicalRange!.baseSizeId !== baseSteps[0]!.label) {
      addFinding(findings, null, "Base size", "INVALID",
        `The sourced base size ${canonicalRange!.baseSizeId} does not match the recipe base ${baseSteps[0]!.label}.`,
        "Align the source-confirmed base size with the recipe's step-0 size.");
    }
    for (const round of data.sampleQaRounds) {
      if (!canonicalRange!.sizeIds.includes(round.sampleSizeId)) {
        addFinding(findings, null, "Sample size", "INVALID",
          `Sample ${round.sampleLabel} uses ${round.sampleSizeId}, which is outside the sourced size run.`,
          "Correct the sample size ID or resolve the cited source range; the value was not changed.");
      }
    }
  }

  const styleBaseSizeId = record.cover.baseSizeId.value;
  if (typeof styleBaseSizeId !== "string" || styleBaseSizeId.trim().length === 0) {
    addFinding(findings, null, "Style base size", "UNRESOLVED",
      record.cover.baseSizeId.unresolvedReason ?? "The T01 style base size is not recorded.",
      record.cover.baseSizeId.nextAction ?? "Record the style base size before approving a size run.");
  } else if (record.cover.baseSizeId.validationStatus === "INVALID") {
    addFinding(findings, null, "Style base size", "INVALID",
      record.cover.baseSizeId.unresolvedReason ?? "The T01 style base size is marked invalid.",
      record.cover.baseSizeId.nextAction ?? "Correct the T01 base-size field before approving a size run.");
  } else if (canonicalRange && styleBaseSizeId !== canonicalRange.baseSizeId) {
    addFinding(findings, null, "Style base size", "INVALID",
      `The T01 style base size ${styleBaseSizeId} does not match the sourced base ${canonicalRange.baseSizeId}.`,
      "Resolve the base-size mismatch against the source before using the size run.");
  }

  const sizeRunFields = new Set(["Size run", "Base size", "Style base size", "Sample size"]);
  const sizeRunReady = findings.every((finding) => !sizeRunFields.has(finding.field)
    && finding.field !== "Size-range source" && finding.field !== "Grade-rule source");
  const callouts = recipe.poms.map((pom) => {
    const definition = data.definitions.definitions.find((candidate) => candidate.label === pom.label);
    const ready = sizeRunReady && !findings.some((finding) => finding.calloutLabel === pom.label);
    return { label: pom.label, definitionId: definition?.id ?? null, ready };
  });

  return {
    recipeId,
    sizeIds,
    baseSizeId: canonicalRange?.baseSizeId ?? (baseSteps.length === 1 ? baseSteps[0]!.label : null),
    callouts,
    predictions,
    findings,
    completeCalloutCount: callouts.filter((callout) => callout.ready).length,
    sizeRunReady,
    ready: findings.length === 0,
  };
}
