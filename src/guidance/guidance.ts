// The guidance engine: given a garment recipe and measurements, it returns plain-
// English notes about whether the pattern is sound. It is GARMENT-AGNOSTIC — the
// garment-specific checks come from `recipe.guidance`; guide() only adds the
// measurement-sanity tiers, which apply to any set of numbers.

import { Measurements, GarmentRecipe } from "../drafting";
import { plausibilityChecks, coherenceChecks } from "./plausibility";

// Note / Level / SEVERITY_ICON now live in the dependency-free ./note module so a
// recipe can speak in Notes without a cycle. Re-exported here so existing importers
// of "../guidance" / "./guidance" are unaffected.
export { SEVERITY_ICON } from "./note";
export type { Note, Level } from "./note";
import { Note } from "./note";

/** Run every check for a garment: its own guidance, then the sanity tiers. Garment-
 *  agnostic — it never names a seam, so a sleeveless garment runs through it. */
export function guide(recipe: GarmentRecipe, m: Measurements): Note[] {
  const block = recipe.draft(m);
  // Garment-specific first (does it sew as this garment?), then the number-sanity
  // tiers (are the inputs real?). The sanity tiers warn only — they never change a
  // measurement.
  return [
    ...recipe.guidance(block, m),
    ...plausibilityChecks(m, recipe.fields),
    ...coherenceChecks(m, recipe.fields),
  ];
}
