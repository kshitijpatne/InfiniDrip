import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S609-clo-dxf-astm-practical-trial";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3568, 3570].includes(board.revision));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S609-START" && uri === `${dir}/S609-start-packet.md` && verified));
if (board.revision === 3568) assert(!board.evidence.some(({ id }) => id === "E-G04-S609-EXIT"));
if (board.revision === 3570) assert(board.evidence.some(({ id, uri, verified }) => id === "E-G04-S609-EXIT" && uri === `${dir}/S609-exit-packet.md` && verified));
const reportPath = "C:/G04-CLO-DXF-Exchange/S609-clo-dxf-astm-practical-trial/Evidence/Analysis/S609-dxf-astm-roundtrip-analysis.json";
const reportBytes = await readFile(reportPath);
const report = JSON.parse(reportBytes);
assert.equal(report.geometryBaseline.sha256, "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca");
assert.equal(report.output.sha256, "be0f11fc3fca57887bdacce366034e4cf4479c2867be4529181dec34fffcb9e0");
assert.equal(report.strictSewPassCount, 9);
assert.equal(report.strictCutPassCount, 4);
assert.equal(report.results.filter(({ cut }) => !cut.passes && cut.outputVertices === cut.inputVertices - 1).length, 5);
assert.equal(createHash("sha256").update(reportBytes).digest("hex"), "5b8f4a41ad100d119c25a2421f601d72c060ec40926a7cbaf7344c0c8c1009ac");
const pdf = await readFile("C:/G04-CLO-DXF-Exchange/S609-clo-dxf-astm-practical-trial/Evidence/polo-m-astm-reimport-render.pdf");
assert.equal(createHash("sha256").update(pdf).digest("hex"), "9aedf5f54fcf2608b6b1a71b315a19857260cde4f74789e7a03144d81266893a");
for (const file of ["S609-exit-packet.md", "V03-CURRENT-GATE-MATRIX-S609.md", "S609-exit-add-evidence.json", "S609-exit-add-comment.json"]) {
  await readFile(`${dir}/${file}`, "utf8");
}
const packet = await readFile(`${dir}/S609-exit-packet.md`, "utf8");
assert(packet.toLowerCase().includes("no v03 acceptance gate clears"));
assert(packet.toLowerCase().includes("five of nine cut"));
assert(packet.toLowerCase().includes("local-only processing"));
console.log("S609 exit preflight passed: CLO output/report hashes, 9/9 SEW, 4/9 CUT, five missing-vertex CUT failures, rendered PDF and unchanged G04 statuses verified.");
