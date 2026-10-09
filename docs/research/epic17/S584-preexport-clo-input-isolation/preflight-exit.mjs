import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3451);
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S584-START"));
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
const root = "C:/G04-CLO-DXF-Exchange/S584-preexport-clo-input-isolation/Evidence/";
const rawBytes = await readFile(`${root}preexport-pattern-input-information.json`);
const raw = JSON.parse(rawBytes);
assert.equal(raw.project_sha256, "43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25");
assert.equal(raw.pattern_count, 9);
assert.equal(raw.patterns.length, 9);
assert.equal(raw.error, null);
for (let index = 0; index < 9; index += 1) {
  const pattern = raw.patterns[index];
  assert.equal(pattern.pattern_index, index);
  assert.equal(pattern.pattern_name, String(index));
  const getter = pattern.information.GetPatternInputInformation;
  assert.equal(getter.return_type, "str");
  assert.equal(getter.call_error, null);
  assert.equal(getter.parse_error, null);
  const roots = getter.parsed["Pattern InputInformation"];
  assert.equal(roots.length, 1);
  assert.ok(Array.isArray(roots[0].PointList));
}
const geo = JSON.parse(await readFile(`${root}preexport-source-geometry-comparison.json`));
assert.equal(geo.exactGeometrySummary.patternsWithAtLeastOneSourceContourMatch, 8);
assert.equal(geo.exactGeometrySummary.patternsMatchingLiteralCut, 0);
assert.equal(geo.exactGeometrySummary.patternsMatchingLiteralSew, 8);
assert.equal(geo.patterns[3].exactGeometryCandidates.length, 0);
for (const pattern of geo.patterns) for (const candidate of pattern.exactGeometryCandidates) assert.ok(candidate.mapping.maxResidualMm <= 0.01);
const stage = JSON.parse(await readFile(`${root}preexport-vs-s583-stage-comparison.json`));
assert.equal(stage.failures.getterCalls, 0);
assert.equal(stage.failures.jsonParses, 0);
assert.equal(stage.perPattern.length, 9);
assert.equal(Math.max(...stage.perPattern.map(({ interSnapshotMaxPointDeltaMm }) => interSnapshotMaxPointDeltaMm)), 0.000244140625);
assert.ok(stage.perPattern.every(({ sourceGeometryCandidateOrdinals }) => Array.isArray(sourceGeometryCandidateOrdinals)));
const expected = {
  "preexport-pattern-input-information.json": "E422018EB0735BB4C34004506CCF5B53C810C83FEC4BA8F48EDE1B38515B4736",
  "preexport-source-geometry-comparison.json": "F27D933AE2F0342C6E7E8044395A2F3D238400EBC08F33A02C5083424E66BF04",
  "preexport-vs-s583-stage-comparison.json": "A3CDFA40667F595C42246C892F1E955FAD4F79E041CB9FB052E5F3206C464CF8",
  "clo-s584-preexport-getter.jpg": "A12423717954C372239DAEFAA9D6F6D20B0B42258CABDF5EC0EFAFBB329EB061",
  "clo-s584-python-editor-detail.jpg": "3992FD9E662B6537E41A365E3F5C07AA540E6638606785AF5EAAD60AC31C6B1B",
  "comparator-diagnostic.txt": "784DE517C2149EC72D3888DE9BDCCD5AF9494377C094C02449F53B5EDF397314",
};
for (const [name, expectedHash] of Object.entries(expected)) {
  const bytes = await readFile(`${root}${name}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex").toUpperCase(), expectedHash, `${name} hash changed`);
}
const screenshot = await readFile(`${root}clo-s584-python-editor-detail.jpg`);
assert.ok(screenshot.length > 1000);
console.log("S584 exit evidence and board revision 3451 preflight passed.");
