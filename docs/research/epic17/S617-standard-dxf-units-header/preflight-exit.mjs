import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = "docs/research/epic17/S617-standard-dxf-units-header";
const root = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header";
const expected = new Map([
  [`${root}/Input/polo-standard-m-cm-units-header.dxf`, "71f45fdca602bbddb32ba53f76f0b5d9b6e92094d96557414c182c5eaf42e5f5"],
  [`${root}/Output/polo-m-cm-header-standard-input-astm-output.dxf`, "42db6b2c7974637047bdcb39763a5e677d10b6d4a2696ce13ed837581be46525"],
  [`${root}/Evidence/source-import-render.jpg`, "7bc307fbb55e7ab0ba2c71c57bc8a76fd82e456723756022047519a45b0d0605"],
  [`${root}/Evidence/source-import-standard-dxf-cm-units.zprj`, "e98096ac1ac6afabd08dda6e05c8dbc6320013c194c89f2ce90f35cafcadca48"],
  [`${root}/Evidence/output-import-settings.jpg`, "7c7e11bb3ab9b1740b2f6cdfc8d63a27ddf24e07c302a4d2f2b265cc531cbe80"],
  [`${root}/Evidence/output-reimport-render.jpg`, "9093d51562f4cac3da6a2efe35c0df3b1ce2a947423666054691fc16efdcda46"],
  [`${root}/Evidence/output-reimport-standard-dxf-cm-units.zprj`, "bffce8d174a6fc5b875b8364f556454ad489a2f5e2b20b59cea8628dad3f09e1"],
  [`${root}/Evidence/Analysis/source-variant-preflight.json`, "f7c9a8ca810e709f2c052da44fc5212b673d92259f30008fdcf035f66b9be99d"],
  [`${root}/Evidence/Analysis/S617-header-fine-roundtrip-analysis.json`, "685ad4c76ca503db2e3b6c5234d1915523ed28722727be441bd1d65acb68a360"],
]);
for (const [path, digest] of expected) {
  const bytes = await readFile(path);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), digest, `SHA-256 mismatch: ${path}`);
  assert((await stat(path)).size > 0, `empty evidence: ${path}`);
}
const report = JSON.parse(await readFile(`${root}/Evidence/Analysis/S617-header-fine-roundtrip-analysis.json`, "utf8"));
assert.equal(report.strictSewPassCount, 9);
assert.equal(report.strictCutPassCount, 4);
assert.equal(report.thresholdCm, 0.001);
assert(report.results.filter(({ cut }) => !cut.passes).every(({ cut }) => cut.inputVertices === cut.outputVertices + 1));
const packet = await readFile(`${dir}/S617-exit-packet.md`, "utf8");
const matrix = await readFile(`${dir}/V03-CURRENT-GATE-MATRIX-S617.md`, "utf8");
assert(packet.includes("fixed this fixture's scale") && packet.includes("4/9") && packet.includes("no format error"));
assert(packet.toLowerCase().includes("all seven recipes") && packet.toLowerCase().includes("remain unproven"));
assert(matrix.includes("**Fail / blocking**") && matrix.includes("all-seven"));
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3603, 3606].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
let simulated = board;
if (board.revision === 3603) {
  for (const name of ["S617-exit-add-evidence.json", "S617-exit-add-matrix.json", "S617-exit-add-comment.json"]) {
    simulated = applyBoardCommand(simulated, JSON.parse(await readFile(`${dir}/${name}`, "utf8")));
  }
}
assert.equal(simulated.revision, 3606);
for (const id of ["E-G04-S617-EXIT", "E-G04-S617-MATRIX"]) assert(simulated.evidence.some((entry) => entry.id === id && entry.verified));
console.log("S617 exit preflight passed: C:-only exchange/render evidence hashes match, 4/9 CUT and 9/9 SEW findings are preserved, and validated commands apply 3603→3606 with all V03 holds.");

