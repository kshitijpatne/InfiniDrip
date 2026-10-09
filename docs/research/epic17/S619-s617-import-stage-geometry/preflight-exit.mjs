import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange";
async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}
const project = `${root}/S617-standard-dxf-units-header/Evidence/source-import-standard-dxf-cm-units.zprj`;
const output = `${root}/S617-standard-dxf-units-header/Output/polo-m-cm-header-standard-input-astm-output.dxf`;
const native = `${root}/S619-s617-import-stage-geometry/Evidence/preexport-input-information.json`;
const reportPath = `${root}/S619-s617-import-stage-geometry/Evidence/preexport-cut-contour-comparison.json`;
assert.equal(await sha256(project), "e98096ac1ac6afabd08dda6e05c8dbc6320013c194c89f2ce90f35cafcadca48");
assert.equal(await sha256(output), "42db6b2c7974637047bdcb39763a5e677d10b6d4a2696ce13ed837581be46525");
assert.equal(await sha256(native), "272615b163b1720af32418cbd847bbaa6b9960e1537555426495ce8f03a3b569");
assert.equal(await sha256(reportPath), "4291c68fb274388850f378d1ac691d95689cf89e6f01117757ebb86a5dfe6475");
const report = JSON.parse(await readFile(reportPath, "utf8"));
assert.equal(report.slice, "S619");
assert.equal(report.preexportProject.inAppPatternCount, 9);
assert.equal(report.outputCutToImported.length, 9);
const expected = new Map([
  ["back", [1, 32, 33]],
  ["outer collar stand", [5, 53, 54]],
  ["inner collar stand", [6, 53, 54]],
  ["upper pointed collar", [7, 43, 44]],
  ["under pointed collar", [8, 43, 44]],
]);
for (const [piece, [patternIndex, outputPoints, sourcePoints]] of expected) {
  const result = report.outputCutToImported.find((entry) => entry.piece === piece);
  assert(result, `missing output match for ${piece}`);
  assert.equal(result.outputCutVertices, outputPoints);
  assert.equal(result.sourceCutVertices, sourcePoints);
  assert(result.bestImportedContourMatches.some((match) =>
    match.patternIndex === patternIndex && match.pointCount === outputPoints && match.delta.maxDeltaMm <= 0.001,
  ), `no exact pre-export contour correspondence for ${piece}`);
}
console.log("S619 exit preflight passed: pinned CLO inputs/output and all five reduced CUT contours match pre-export native point lists.");
