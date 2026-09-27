import type { GarmentOptionsByRecipe, Measurements } from "../drafting";
import { GARMENTS, STANDARD_M } from "../drafting";
import { getFieldDefinitions } from "./field-provenance";
import type { SavedDesign } from "./project-records";
import {
  measurementCaptureReadiness,
  parseMeasurementCaptureSession,
  selectedCaptureValues,
  type MeasurementCaptureSession,
} from "./measurement-capture";

/**
 * Applies one ready M01 capture to a fresh, recipe-specific design seed.
 * The caller supplies the seed so its non-capture defaults remain explicit
 * and inspectable; this helper never reads another style or another recipe.
 */
export function materializeCustomSizeDesign(
  seed: SavedDesign,
  session: MeasurementCaptureSession,
): SavedDesign {
  const parsedSession = parseMeasurementCaptureSession(session);
  if (!parsedSession.ok) throw new Error("The saved capture session is malformed; reload it before creating a custom style.");
  session = parsedSession.value;
  const recipe = GARMENTS.find((candidate) => candidate.name === session.recipeId);
  if (!recipe || seed.workspace.garment !== recipe.name) {
    throw new Error("Choose the captured garment's fresh design seed before creating a custom style.");
  }
  const definitions = getFieldDefinitions(recipe.name);
  if (!measurementCaptureReadiness(session).ready) {
    throw new Error("Resolve every measurement field before creating a custom one-size style.");
  }
  const values = selectedCaptureValues(session);
  if (!values) throw new Error("The selected measurement readings are not ready to create a custom style.");

  // SaveFile still has a complete shared measurement object. Start its
  // non-recipe slots at the explicit digital baseline so no values from an
  // earlier style or garment can leak into this new recipe.
  const measurements: Measurements = { ...STANDARD_M };
  const recipeOptions: Record<string, number> = {};
  for (const definition of definitions) {
    const value = values[definition.inputKey];
    if (value === undefined || !Number.isFinite(value)) {
      throw new Error(`The selected value for ${definition.label} is missing or invalid.`);
    }
    if (definition.inputKind === "measurement") {
      (measurements as unknown as Record<string, number>)[definition.inputKey] = value;
    } else {
      recipeOptions[definition.inputKey] = value;
    }
  }

  const garmentOptions: GarmentOptionsByRecipe = { [recipe.name]: recipeOptions };
  return {
    ...seed,
    measurements,
    garmentOptions,
    workspace: {
      ...seed.workspace,
      garment: recipe.name,
      exportStep: 0,
      nestScope: "single",
    },
    semanticEdits: null,
  };
}

export function requireMatchingCaptureSession(
  session: MeasurementCaptureSession | null,
  recipeId: string,
): MeasurementCaptureSession {
  if (!session || session.recipeId !== recipeId) {
    throw new Error("Reload the active garment's guided capture before continuing.");
  }
  return session;
}

export function requireSavedCaptureCopy<T extends { readonly session: MeasurementCaptureSession }>(capture: T | null): T {
  if (!capture) throw new Error("The custom style was saved, but its capture copy could not be reloaded.");
  return capture;
}

export function customStyleCreationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The custom one-size style could not be saved.";
}

export function gradedMarkerAvailabilityTitle(isCustomOneSize: boolean): string {
  return isCustomOneSize
    ? "Graded Marker is unavailable until you review and approve a grade plan."
    : "Nest every graded size";
}
