import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange";
async function bytes(path) { return readFile(path); }
async function sha256(path) { return createHash("sha256").update(await bytes(path)).digest("hex"); }
const project = `${root}/S574-polo-line-chain-representation/Evidence/clo-after-line-chain-import.zprj`;
const output = `${root}/S574-polo-line-chain-representation/Output/polo-line-chain-gen1.dxf`;
const inputInfo = `${root}/S620-aama-preexport-contour-check/Evidence/preexport-input-information.json`;
const comparison = `${root}/S620-aama-preexport-contour-check/Evidence/preexport-cut-contour-comparison.json`;
assert.equal(await sha256(project), "43ab4cd6de6a823cf671bf7fe748abc4052744a396e3dbcb0fe9539055d39e25");
assert.equal(await sha256(output), "346f38a02748f96247716d9e5a992912cc018cb2eeb4506c092c4f43eedaf1e3");
assert.equal(await sha256(inputInfo), "873a12aa58579e04172b67e53649b640c667cf3a36f779e45de6ac50eb33f5ed");
assert.equal(await sha256(comparison), "68c26baa491b949c87cf5e1a14cda0757c7fa1759f6cd8c69ca543ee1c82e6f7");
const info = JSON.parse((await bytes(inputInfo)).toString("utf8"));
const report = JSON.parse((await bytes(comparison)).toString("utf8"));
assert.equal(info.slice, "S620");
assert.equal(info.pattern_count, 9);
assert.equal(info.errors.length, 0);
assert.equal(report.source.cutPaths, 9);
assert.equal(report.source.sewPaths, 9);
assert.equal(report.results.filter((row) => row.source.layer === "CUT").length, 9);
assert.equal(report.results.filter((row) => row.source.layer === "SEW").length, 9);
const sewRows = report.results.filter((item) => item.source.layer === "SEW");
assert.equal(sewRows.length, 9);
for (const [index, row] of sewRows.entries()) {
  assert(row.bestImportedMatches.some((match) => match.patternIndex === index && match.maxDeltaMm <= 0.001), `source SEW ordinal ${index} did not match its CLO pattern within tolerance`);
}
for (const row of report.results.filter((item) => item.source.layer === "CUT")) {
  assert(!row.bestImportedMatches.some((match) => match.maxDeltaMm <= 0.01), `unexpected within-gate CUT match at ordinal ${row.source.ordinal}`);
}
assert.equal(report.outputCutToImported.length, 9);
for (const row of report.outputCutToImported) {
  assert.equal(row.outputClosedContourCount, 3);
  assert(row.bestImportedContourMatches.some((match) => match.patternIndex === Number(row.piece.split("_")[0]) && match.delta.maxDeltaMm <= 0.001));
}
console.log("S620 exit preflight passed: hash-pinned S574 scene; nine SEW native matches, zero CUT within 0.001 cm, output contour carry-through verified.");
