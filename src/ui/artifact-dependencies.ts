/** Recipe-field invalidation map for the live, on-demand derivation pipeline. */
import { GARMENTS, type GarmentRecipe } from "../drafting";
import { getFieldDefinition, getFieldDefinitions, type FieldInputKind } from "./field-provenance";

export interface DerivedArtifactGroup {
  readonly id: string;
  readonly label: string;
}

/** Output families rebuilt from the active recipe's complete input bundle. */
export const FIELD_DEPENDENT_ARTIFACTS: readonly DerivedArtifactGroup[] = Object.freeze([
  Object.freeze({ id: "pattern", label: "pattern pieces" }),
  Object.freeze({ id: "pom-spec", label: "POM/spec values" }),
  Object.freeze({ id: "grade-run", label: "graded measurements and pattern pieces" }),
  Object.freeze({ id: "nesting", label: "single-size/graded nesting" }),
  Object.freeze({ id: "views", label: "pattern/body/assembled/nesting/spec/check/edit views" }),
  Object.freeze({
    id: "garment-exports",
    label: "SVG, DXF, tiled PDF, tech-pack PDF, projector SVG, A0 PDF exports",
  }),
]);

/** This export reads only surface artwork placements and their target style. */
export const FIELD_INDEPENDENT_ARTIFACTS: readonly DerivedArtifactGroup[] = Object.freeze([
  Object.freeze({ id: "surface-sheet-svg", label: "surface-art sheet SVG" }),
]);

/** Woven-shirt button controls alter marks/details without changing cut geometry. */
const BUTTON_COUNT_AFFECTED = Object.freeze(FIELD_DEPENDENT_ARTIFACTS.filter((artifact) =>
  !["pom-spec", "nesting"].includes(artifact.id)));
const BUTTON_SPACING_AFFECTED = Object.freeze(FIELD_DEPENDENT_ARTIFACTS.filter((artifact) =>
  artifact.id !== "nesting"));
const MARK_ONLY_UNAFFECTED = Object.freeze([
  ...FIELD_INDEPENDENT_ARTIFACTS,
  FIELD_DEPENDENT_ARTIFACTS[3]!,
]);
const BUTTON_COUNT_UNAFFECTED = Object.freeze([
  ...MARK_ONLY_UNAFFECTED,
  FIELD_DEPENDENT_ARTIFACTS[1]!,
]);

/** The hem turn affects body cut edges; graded POM values remain sewing-line dimensions. */
const WOVEN_HEM_TURN_AFFECTED = Object.freeze(FIELD_DEPENDENT_ARTIFACTS.filter((artifact) =>
  artifact.id !== "pom-spec"));
const WOVEN_HEM_TURN_UNAFFECTED = Object.freeze([
  ...FIELD_INDEPENDENT_ARTIFACTS,
  FIELD_DEPENDENT_ARTIFACTS[1]!,
]);
const TANK_SHOULDER_NOT_REPRESENTED = Object.freeze([
  FIELD_DEPENDENT_ARTIFACTS[0]!,
  FIELD_DEPENDENT_ARTIFACTS[1]!,
  FIELD_DEPENDENT_ARTIFACTS[3]!,
  FIELD_DEPENDENT_ARTIFACTS[5]!,
]);
const TANK_SHOULDER_CURRENTLY_AFFECTED = Object.freeze([
  Object.freeze({
    id: "grade-run",
    label: "per-size measurement records in the graded size run (the drafted tank pieces remain unchanged)",
  }),
  Object.freeze({
    id: "views.body-assembled-check",
    label: "the body/assembled illustration and shoulder-width guidance/check status",
  }),
]);

export interface FieldArtifactDependency {
  readonly recipeId: string;
  readonly inputKind: FieldInputKind;
  readonly inputKey: string;
  readonly fieldId: string;
  readonly fieldLabel: string;
  readonly affected: readonly DerivedArtifactGroup[];
  readonly unaffected: readonly DerivedArtifactGroup[];
  /** Semantically implied outputs that current code does not encode from this input. */
  readonly notRepresented: readonly DerivedArtifactGroup[];
  /** Recipe-specific explanation when an input intentionally does not define an output. */
  readonly notRepresentedExplanation?: string;
}

export function getFieldArtifactDependency(
  recipeId: string,
  inputKind: FieldInputKind,
  inputKey: string,
): FieldArtifactDependency | undefined {
  const definition = getFieldDefinition(recipeId, inputKey, inputKind);
  if (!definition) return undefined;
  const isWovenShirt = recipeId === "woven-shirt";
  const isWovenHemTurn = isWovenShirt && inputKind === "option" && inputKey === "hemTurn";
  const isTankShoulderWidth = recipeId === "tank" && inputKind === "measurement" && inputKey === "shoulderWidth";
  const isWovenButtonCount = isWovenShirt && inputKind === "option" && inputKey === "buttonCount";
  const isWovenButtonSpacing = isWovenShirt && inputKind === "option" && inputKey === "buttonSpacing";
  const isPreviewOnlyInput = isTankShoulderWidth;
  const affected = isWovenHemTurn
    ? WOVEN_HEM_TURN_AFFECTED
    : isTankShoulderWidth
      ? TANK_SHOULDER_CURRENTLY_AFFECTED
      : isWovenButtonCount
        ? BUTTON_COUNT_AFFECTED
        : isWovenButtonSpacing
          ? BUTTON_SPACING_AFFECTED
        : FIELD_DEPENDENT_ARTIFACTS;
  const unaffected = isWovenHemTurn
    ? WOVEN_HEM_TURN_UNAFFECTED
    : isPreviewOnlyInput
      ? FIELD_INDEPENDENT_ARTIFACTS
    : isWovenButtonCount
      ? BUTTON_COUNT_UNAFFECTED
      : isWovenButtonSpacing
        ? MARK_ONLY_UNAFFECTED
      : FIELD_INDEPENDENT_ARTIFACTS;
  return {
    recipeId,
    inputKind,
    inputKey,
    fieldId: definition.id,
    fieldLabel: definition.label,
    affected,
    unaffected,
    notRepresented: isPreviewOnlyInput ? TANK_SHOULDER_NOT_REPRESENTED : [],
    ...(isTankShoulderWidth ? {
      notRepresentedExplanation: "Body shoulder width does not determine the tank pattern's strap width. Review or change Strap width to change the strap/armhole geometry; unchanged pattern geometry is not evidence of fit.",
    } : {}),
  };
}

/** Enumerate one complete recipe row set for the durable matrix and tests. */
export function getRecipeFieldArtifactMatrix(recipeId: string): readonly FieldArtifactDependency[] {
  return getFieldDefinitions(recipeId).map((definition) =>
    getFieldArtifactDependency(recipeId, definition.inputKind, definition.inputKey)!,
  );
}

/** Fail loudly if a new recipe input can bypass the invalidation matrix. */
export function assertFieldArtifactCoverage(recipes: readonly GarmentRecipe[] = GARMENTS): void {
  for (const recipe of recipes) {
    const definitions = getFieldDefinitions(recipe.name);
    const matrix = getRecipeFieldArtifactMatrix(recipe.name);
    const expectedInputs = recipe.fields.length + (recipe.options?.length ?? 0);
    if (definitions.length !== expectedInputs || matrix.length !== definitions.length
      || matrix.some((row) => row.affected.length === 0 || row.unaffected.length === 0)
      || new Set(matrix.map((row) => `${row.inputKind}/${row.inputKey}`)).size !== definitions.length) {
      throw new Error(`${recipe.name} field inputs do not have a complete artifact dependency row.`);
    }
  }
}

export function describeFieldArtifactImpact(dependency: FieldArtifactDependency): string {
  const affected = dependency.affected.map((artifact) => artifact.label).join("; ");
  const unaffected = dependency.unaffected.map((artifact) => artifact.label).join("; ");
  const notRepresented = dependency.notRepresented.length === 0
    ? ""
    : ` Not represented in current outputs: ${dependency.notRepresented.map((artifact) => artifact.label).join("; ")}. ${dependency.notRepresentedExplanation ?? "These outputs do not consume this input."}`;
  return `Changing ${dependency.fieldLabel} invalidates for recomputation: ${affected}. The open view updates now; other views and exports rebuild on open/export. Unaffected: ${unaffected}.${notRepresented} This does not establish fit or production readiness.`;
}
