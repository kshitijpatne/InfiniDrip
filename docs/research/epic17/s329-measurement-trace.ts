import { TEE, FITTED } from "../../../src/drafting/recipe";
import { STANDARD_M } from "../../../src/drafting/measurements";
import { defaultGarmentOptions } from "../../../src/drafting/options";
import { edgeLength } from "../../../src/drafting/piece";
import { interfaceLength } from "../../../src/drafting/stitch";
const changed = { ...STANDARD_M, chest: 92, shoulderWidth: 39, bicep: 38, length: 66, armholeDepth: 21, sleeveLength: 22, ease: 10 };
for (const recipe of [TEE, FITTED]) for (const [variant, measurements] of [["default", STANDARD_M], ["S322-measurement", changed]] as const) {
  const block = recipe.draft(measurements, defaultGarmentOptions(recipe.options ?? []));
  const stitch = block.stitches.find((item) => item.label === "Sleeve-cap ease")!;
  const cap = stitch.a.edges.reduce((sum, ref) => sum + edgeLength(block.roles[ref.piece]!.edges.find((e) => e.name === ("edge" in ref ? ref.edge : ""))!), 0);
  const arm = interfaceLength(block, stitch.b);
  console.log(JSON.stringify({recipe:recipe.name,variant,measurements,capLengthCm:cap,armholeLengthCm:arm,differenceCm:Number((cap-arm).toFixed(6)),allowedEase:stitch.ease,checks:recipe.checks(block,measurements),guidance:recipe.guidance(block,measurements).map((note) => ({severity:note.severity,message:note.message}))}));
}
