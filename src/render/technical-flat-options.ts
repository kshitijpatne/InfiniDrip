import type { GarmentRecipe } from "../drafting/recipe";
import type { GarmentOptions } from "../drafting/options";
import type { Measurements } from "../drafting/measurements";
import { mapTechnicalFlatSources, type FlatMappingIssue } from "./technical-flat-mapping";
import {
  compileTechnicalFlatSourceGeometry,
  type TechnicalFlatGeometryIssue,
  type TechnicalFlatSourceGeometry,
} from "./technical-flat-geometry";

export interface TechnicalFlatOptionIssue {
  readonly code:
    | "INVALID_OPTIONS_OBJECT"
    | "UNKNOWN_OPTION"
    | "INVALID_OPTION_VALUE"
    | "OPTION_OUT_OF_RANGE"
    | "OPTION_OFF_STEP"
    | "DRAFT_FAILED"
    | "INVALID_REVISION_ID";
  readonly optionId?: string;
  readonly message: string;
}

export interface ValidatedTechnicalFlatOptions {
  readonly recipeId: string;
  readonly revisionId: string;
  readonly options: GarmentOptions | null;
  readonly faces: readonly [TechnicalFlatSourceGeometry, TechnicalFlatSourceGeometry] | null;
  readonly issues: readonly (TechnicalFlatOptionIssue | FlatMappingIssue | TechnicalFlatGeometryIssue)[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateValues(recipe: GarmentRecipe, raw: unknown): { options: GarmentOptions | null; issues: TechnicalFlatOptionIssue[] } {
  if (raw !== undefined && !isRecord(raw)) {
    return { options: null, issues: [{ code: "INVALID_OPTIONS_OBJECT", message: "Garment options must be a named set of numeric values." }] };
  }
  const input = raw === undefined ? {} : raw as Record<string, unknown>;
  const definitions = recipe.options ?? [];
  const definitionIds = new Set(definitions.map((definition) => definition.id));
  const issues: TechnicalFlatOptionIssue[] = [];
  for (const optionId of Object.keys(input)) {
    if (!definitionIds.has(optionId)) {
      issues.push({ code: "UNKNOWN_OPTION", optionId, message: `Option “${optionId}” is not supported by ${recipe.label}; remove it or choose a supported garment.` });
    }
  }

  const values: Record<string, number> = {};
  for (const definition of definitions) {
    const supplied = Object.prototype.hasOwnProperty.call(input, definition.id);
    const candidate = supplied ? input[definition.id] : definition.defaultValue;
    if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
      issues.push({ code: "INVALID_OPTION_VALUE", optionId: definition.id,
        message: `${definition.label} must be a finite number; enter a value from ${definition.min} to ${definition.max} ${definition.unit ?? ""}.`.trim() });
      continue;
    }
    if (candidate < definition.min || candidate > definition.max) {
      issues.push({ code: "OPTION_OUT_OF_RANGE", optionId: definition.id,
        message: `${definition.label} must be between ${definition.min} and ${definition.max} ${definition.unit ?? ""}; adjust this option before viewing the flat.`.trim() });
      continue;
    }
    const stepCount = (candidate - definition.min) / definition.step;
    if (!Number.isFinite(definition.step) || definition.step <= 0
      || Math.abs(stepCount - Math.round(stepCount)) > 1e-8) {
      issues.push({ code: "OPTION_OFF_STEP", optionId: definition.id,
        message: `${definition.label} must follow ${definition.step} ${definition.unit ?? ""} increments from ${definition.min}; choose a declared step value.`.trim() });
      continue;
    }
    values[definition.id] = candidate;
  }
  return { options: issues.length === 0 ? values : null, issues };
}

/** Validate raw supported options before recipe resolvers can substitute
 * fallback values, then draft and check both exact face topologies. */
export function validateTechnicalFlatOptions(
  recipe: GarmentRecipe,
  measurements: Measurements,
  rawOptions: unknown,
  revisionId: string,
): ValidatedTechnicalFlatOptions {
  const base = { recipeId: recipe.name, revisionId };
  if (typeof revisionId !== "string" || !revisionId.trim()) {
    return { ...base, options: null, faces: null, issues: [{
      code: "INVALID_REVISION_ID", message: "Choose or restore a valid saved design revision before viewing its flat.",
    }] };
  }

  const checked = validateValues(recipe, rawOptions);
  if (!checked.options) return { ...base, options: null, faces: null, issues: checked.issues };

  let block;
  try {
    block = recipe.draft(measurements, checked.options);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The recipe rejected this option combination.";
    return { ...base, options: checked.options, faces: null, issues: [{
      code: "DRAFT_FAILED", message: `The selected options could not draft a valid pattern: ${reason}`,
    }] };
  }

  const sourceMap = mapTechnicalFlatSources(recipe.name, block, recipe.poms);
  if (sourceMap.issues.length > 0) {
    return { ...base, options: checked.options, faces: null, issues: sourceMap.issues };
  }
  const front = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, "FRONT_FLAT");
  const back = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, "BACK_FLAT");
  const geometryIssues = [...front.issues, ...back.issues];
  if (geometryIssues.length > 0) {
    return { ...base, options: checked.options, faces: null, issues: geometryIssues };
  }
  return { ...base, options: checked.options, faces: [front, back], issues: [] };
}
