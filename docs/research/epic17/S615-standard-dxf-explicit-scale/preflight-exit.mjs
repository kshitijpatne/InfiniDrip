import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S615-standard-dxf-explicit-scale";
const root = "C:/G04-CLO-DXF-Exchange/S615-standard-dxf-explicit-scale";
const sha = (data) => createHash("sha256").update(data).digest("hex");
const [diagnosticBytes, reportBytes, inventoryBytes, outputBytes, renderBytes, sceneBytes, sourceBytes] = await Promise.all([
  readFile(`${root}/Evidence/Analysis/S615-scale-diagnostic.json`),
  readFile(`${root}/Evidence/Analysis/S615-standard-dxf-roundtrip-analysis.json`),
  readFile(`${root}/Evidence/Analysis/S615-output-inventory.json`),
  readFile(`${root}/Output/polo-m-standard-1000pct-input-astm-output.dxf`),
  readFile(`${root}/Evidence/reimport-1000pct-session.png`),
  readFile(`${root}/Evidence/reimport-roundtrip-scene.zprj`),
  readFile(`${root}/Input/polo-standard-m.dxf`),
]);
const diagnostic = JSON.parse(diagnosticBytes), report = JSON.parse(reportBytes), inventory = JSON.parse(inventoryBytes);
assert.equal(sha(sourceBytes), "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
assert.equal(sha(outputBytes), "66e883f34672511aeee60621c7deb3544843e80a3f4b16a337a344da112918de");
assert.equal(sha(diagnosticBytes), "cb78eba0cec1f116c7cdb50626e000d942958968875b0c7d4d0609e60508ca7f");
assert.equal(sha(reportBytes), "7dee4e7b45b2b056177bb6bdecfbcb7691970f0b804aa9053a51e67cd0467fda");
assert.equal(sha(inventoryBytes), "80d013a27a07389434e074fbd27421971dc9539ab5c1ff52184a7545db933695");
assert.equal(sha(renderBytes), "835aa4799621c02d511b54170e3ab016db19b6b3053dfbc4a059a17b944e4119");
assert.equal(sha(sceneBytes), "39e0b44457cfd35715cb88345f0e0401a839f7c28d4e2f0a556da8ccc9435cfd");
assert.equal(diagnostic.results.length, 18);
assert(diagnostic.results.every(({ factor }) => factor === 0.1));
assert.equal(diagnostic.results.filter(({ exactDelta }) => exactDelta !== null && exactDelta <= 0.001).length, 8);
assert.equal(report.strictCutPassCount, 0);
assert.equal(report.strictSewPassCount, 0);
assert.equal(inventory.inserts, 9);
assert.equal(inventory.outputPolylines, 100);
assert.deepEqual(inventory.blocks[0].closedPolylines[0].bounds, { minX: 0.1, maxX: 2.950001, minY: 0.246799, maxY: 7.574199 });
const packet = await readFile(`${dir}/S615-exit-packet.md`, "utf8");
for (const phrase of ["1000%", "0.1×", "unchanged", "0.001 cm", "neither `$INSUNITS`", "all V03 holds"]) assert(packet.includes(phrase), `missing packet phrase: ${phrase}`);
let board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3593, 3596].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, verified }) => id === "E-G04-S615-START" && verified));
if (board.revision === 3593) {
  for (const name of ["S615-exit-add-evidence.json", "S615-exit-add-comment.json", "S615-exit-add-matrix-evidence.json"]) {
    board = applyBoardCommand(board, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
  }
}
assert.equal(board.revision, 3596);
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-EXIT" && uri === `${dir}/S615-exit-packet.md` && verified));
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S615-MATRIX" && uri === `${dir}/V03-CURRENT-GATE-MATRIX-S615.md` && verified));
console.log("S615 exit preflight passed: hash-pinned 1000% test retains the 0.1x scale failure; 8/18 exact paths only at factor 0.1; holds preserved; exit board commands valid for 3593→3596.");
