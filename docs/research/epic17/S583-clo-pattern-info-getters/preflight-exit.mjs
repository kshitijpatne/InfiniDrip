import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.ok([3447, 3449].includes(board.revision), `unexpected board revision ${board.revision}`);
assert.ok(board.evidence.some(({ id }) => id === "E-G04-S583-START"));
const raw = JSON.parse(await readFile("C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/pattern-information.json", "utf8"));
const report = JSON.parse(await readFile("C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/source-geometry-comparison.json", "utf8"));
assert.equal(raw.pattern_count, 9);
assert.equal(raw.patterns.length, 9);
for (const pattern of raw.patterns) {
  for (const method of ["GetPatternInformation", "GetPatternInputInformation"]) {
    const result = pattern.information[method];
    assert.equal(result.return_type, "str");
    assert.equal(result.call_error, null);
    assert.equal(result.parse_error, null);
    assert.ok(result.parsed && typeof result.parsed === "object");
  }
  const root = raw.patterns[pattern.pattern_index].information.GetPatternInputInformation.parsed["Pattern InputInformation"];
  assert.equal(root.length, 1);
  assert.ok(Array.isArray(root[0].LineList));
  assert.ok(Array.isArray(root[0].PointList));
}
assert.equal(report.source.sha256, "796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA");
assert.equal(report.importedFixture.sha256, "A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675");
assert.equal(report.exactGeometrySummary.patternsMatchingLiteralCut, 0);
assert.equal(report.exactGeometrySummary.patternsMatchingLiteralSew, 8);
assert.equal(report.patterns[3].exactGeometryCandidates.length, 0);
assert.equal(report.patterns[3].returnedPoints.length, 4);
assert.equal(report.patterns[4].exactGeometryCandidates.length, 2);
for (const pattern of report.patterns) {
  for (const candidate of pattern.exactGeometryCandidates) assert.ok(candidate.mapping.maxResidualMm <= 0.01);
}
const screenshot = await readFile("C:/G04-CLO-DXF-Exchange/S583-clo-pattern-info-getters/Evidence/clo-s583-run.jpg");
assert.equal(createHash("sha256").update(screenshot).digest("hex").toUpperCase(), "EC7A2B99BCB1AD0307EB226320DCC8A4B4565C7430138314205B32C7D63A7F39");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log(`S583 evidence and board revision ${board.revision} preflight passed.`);
