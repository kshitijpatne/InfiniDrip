import { GARMENTS, type GarmentRecipe } from "../drafting";
import { FIELDS } from "./controls";
import { canonicalizeJcs, sha256Hex } from "./style-revisions";
import { isCustomOneSizeStyle, type MeasurementCaptureRecord, type StyleRecord } from "./project-records";
import type { GradePlanBaseBinding, GradePlanResult, GradePlanTargetKind } from "./grade-plan";
import type { Block } from "../drafting/block";

export interface GradePlanContext {
  readonly binding: GradePlanBaseBinding;
  readonly targets: readonly {
    readonly targetId: string;
    readonly kind: GradePlanTargetKind;
    readonly label: string;
    readonly unit: string;
    readonly baseValue: number;
  }[];
}

function invalid(message: string): GradePlanResult<never> {
  return { ok: false, errors: [message] };
}

function requireRecipe(name: string): GarmentRecipe | null {
  return GARMENTS.find((candidate) => candidate.name === name) ?? null;
}

/** Builds the explicit base catalog from the current custom style and saved capture. */
export async function createGradePlanContext(
  projectId: string,
  style: StyleRecord,
  capture: MeasurementCaptureRecord,
  crypto?: Crypto,
  baseBlockOverride?: Block,
): Promise<GradePlanResult<GradePlanContext>> {
  if (!isCustomOneSizeStyle(style)) return invalid("Grade plans are available only for a custom one-size style.");
  if (style.projectId !== projectId || capture.projectId !== projectId || capture.styleId !== style.id
    || capture.recipeId !== style.recipeId || capture.revision < 1) {
    return invalid("The grade plan needs the matching saved capture for this project, style and recipe.");
  }
  if (!style.revisionHeadId) return invalid("Save the style revision before creating a grade plan.");
  const recipe = requireRecipe(style.recipeId);
  if (!recipe) return invalid("The style recipe is not supported by this application version.");
  const baseOptions = style.design.garmentOptions[recipe.name] ?? {};
  const optionTargets = (recipe.options ?? []).map((option) => {
    const value = baseOptions[option.id];
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    return {
      targetId: `option.${recipe.name}.${option.id}`,
      kind: "option" as const,
      label: option.label,
      unit: option.unit ?? "unitless",
      baseValue: value,
    };
  });
  if (optionTargets.some((target) => target === null)) {
    return invalid("Save an explicit value for every recipe control before creating a grade plan.");
  }
  const measurementTargets = recipe.fields.map((field) => {
    const baseValue = style.design.measurements[field];
    if (typeof baseValue !== "number" || !Number.isFinite(baseValue)) return null;
    return {
      targetId: `measurement.${String(field)}`,
      kind: "measurement" as const,
      label: FIELDS.find((definition) => definition.id === field)?.label ?? String(field),
      unit: "cm",
      baseValue,
    };
  });
  if (measurementTargets.some((target) => target === null)) {
    return invalid("The saved base measurements are incomplete. Correct and save the style before creating a grade plan.");
  }
  const resolvedMeasurementTargets = measurementTargets.filter((target) => target !== null);
  const resolvedOptionTargets = optionTargets.filter((target) => target !== null);

  let pomTargets: GradePlanContext["targets"];
  try {
    const block = baseBlockOverride ?? recipe.draft(style.design.measurements, baseOptions);
    pomTargets = recipe.poms.map((pom) => ({
      targetId: `pom.${recipe.name}.${encodeURIComponent(pom.label)}`,
      kind: "pom" as const,
      label: pom.label,
      unit: "cm",
      baseValue: pom.measure(block),
    }));
  } catch (error) {
    return invalid(error instanceof Error
      ? `The saved base cannot produce its current ${recipe.label} POM targets: ${error.message}`
      : `The saved base cannot produce its current ${recipe.label} POM targets.`);
  }
  const targets = [...resolvedMeasurementTargets, ...resolvedOptionTargets, ...pomTargets];
  if (targets.some((target) => !Number.isFinite(target.baseValue))) {
    return invalid("The saved base contains a non-finite measurement, control or POM value.");
  }
  try {
    const fingerprint = await sha256Hex(new TextEncoder().encode(canonicalizeJcs({
      schemaVersion: 1,
      recipeId: recipe.name,
      design: style.design,
    })), crypto);
    return {
      ok: true,
      value: {
        binding: {
          projectId,
          styleId: style.id,
          recipeId: style.recipeId,
          revisionHeadId: style.revisionHeadId,
          captureRevision: capture.revision,
          fingerprint,
        },
        targets: targets as GradePlanContext["targets"],
      },
    };
  } catch (error) {
    return invalid(error instanceof Error ? error.message : "The grade-plan base digest could not be calculated.");
  }
}
