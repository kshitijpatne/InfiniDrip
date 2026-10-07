import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";

const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
  const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `S434-debug-${kind}`, kind, placements: [],
    colorHex: "#456789", texture: "smooth", shine: 0 });
  console.log(JSON.stringify({ kind, hasView: result.view !== null, hasColorway: result.colorway !== null,
    issues: result.issues.map(({ stage, sourceId, message }) => ({ stage, sourceId, message })) }, null, 2));
}
