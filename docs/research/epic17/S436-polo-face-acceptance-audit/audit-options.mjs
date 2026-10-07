import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const folder = new URL("./", import.meta.url);
const read = async (url) => JSON.parse(await readFile(url, "utf8"));
const base = new URL("../", import.meta.url);
const fixture = await read(new URL("S331-polo-browser-final/matrix.json", base));
const residual = await read(new URL("S432-polo-s351-residual-rule/S432-polo-output-matrix.json", base));
const colorway = await read(new URL("S433-polo-output-blocker-diagnosis/S433-polo-back-colorway-render-matrix.json", base));
const production = await read(new URL("S434-polo-j-fg-keyed-display/S434-production-render-matrix.json", base));
const labels = await read(new URL("../S435-polo-keyed-marker-clearance/S435-full-label-clearance-matrix.json", folder));
assert.equal(fixture.cases.length, 17);
assert.equal(residual.rows.length, 34);
assert.equal(colorway.rows.length, 17);
assert.equal(production.rows.length, 34);
assert.equal(labels.options, 17);
assert.equal(residual.residualThresholdCm, 0.25);
assert.equal(residual.s351EndpointResiduals, 0);

const rows = await Promise.all(fixture.cases.map(async (option) => {
  const oldFront = residual.rows.find((row) => row.caseId === option.caseId && row.kind === "FRONT_FLAT");
  const oldBack = residual.rows.find((row) => row.caseId === option.caseId && row.kind === "BACK_FLAT");
  const currentFront = production.rows.find((row) => row.caseId === option.caseId && row.kind === "FRONT_FLAT");
  const currentBack = production.rows.find((row) => row.caseId === option.caseId && row.kind === "BACK_FLAT");
  const backColorway = colorway.rows.find((row) => row.caseId === option.caseId);
  const labelRow = labels.rows.find((row) => row.caseId === option.caseId);
  for (const row of [oldFront, oldBack, currentFront, currentBack, backColorway, labelRow]) assert.ok(row, `${option.caseId}: missing artifact row`);
  assert.deepEqual(oldFront.options, option.options, `${option.caseId}: S432 front options mismatch`);
  assert.deepEqual(oldBack.options, option.options, `${option.caseId}: S432 back options mismatch`);
  assert.deepEqual(currentFront.options, option.options, `${option.caseId}: S434 front options mismatch`);
  assert.deepEqual(currentBack.options, option.options, `${option.caseId}: S434 back options mismatch`);
  assert.equal(oldFront.revisionId, oldBack.revisionId, `${option.caseId}: S432 front/back revisions differ`);
  assert.equal(currentFront.revisionId, currentBack.revisionId, `${option.caseId}: S434 front/back revisions differ`);
  assert.equal(currentFront.revisionId, labelRow.revisionId, `${option.caseId}: label audit revision differs`);
  assert.equal(backColorway.sourceRevisions[0], backColorway.revisionId);
  assert.equal(backColorway.issueCount, 0);
  assert.ok(backColorway.sleeveFillPath);
  assert.equal(currentFront.issueCount, 0);
  assert.equal(currentBack.issueCount, 0);
  const expectedFrontPoms = option.caseId === "polo-sideVentDepth-min" ? 15 : 16;
  const expectedBackPoms = option.caseId === "polo-sideVentDepth-min" ? 8 : 9;
  assert.equal(currentFront.pomScheduleCount, expectedFrontPoms);
  assert.equal(currentBack.pomScheduleCount, expectedBackPoms);
  assert.equal(currentFront.keyedScheduleCount, 13);
  assert.equal(currentBack.keyedScheduleCount, 0);
  assert.equal(oldFront.assemblyIssues.length, 0);
  assert.equal(oldBack.assemblyIssues.length, 0);
  assert.equal(oldFront.compilerIssues.filter(({ stage }) => stage === "pom").length, 2);
  assert.equal(oldBack.colorwayIssues.some(({ code }) => code === "COLORWAY_CONTOUR_UNCLOSED"), true);
  assert.equal(labelRow.collisionCount, 0);
  const currentSvgs = {};
  for (const row of [currentFront, currentBack]) {
    const svg = await readFile(new URL(`S434-polo-j-fg-keyed-display/rendered-production/${row.filename}`, base), "utf8");
    const root = svg.match(/<svg\b[^>]*>/u)?.[0] ?? "";
    const viewRevisions = [...new Set([...svg.matchAll(/data-revision-id="([^"]+)"/gu)].map((match) => match[1]))];
    const colorwayRevisions = [...new Set([...svg.matchAll(/data-colorway-revision="([^"]+)"/gu)].map((match) => match[1]))];
    const fillRoles = [...new Set([...svg.matchAll(/data-colorway-fill-for="([^"]+)"/gu)].map((match) => match[1]))];
    assert.match(root, new RegExp(`data-revision-id="${row.revisionId}"`, "u"));
    assert.deepEqual(viewRevisions, [row.revisionId]);
    assert.deepEqual(colorwayRevisions, [row.revisionId]);
    assert.ok(fillRoles.length >= 5);
    currentSvgs[row.kind] = { sourceRevisions: viewRevisions, colorwayRevisions, fillRoles };
  }
  return { caseId: option.caseId, options: option.options,
    optionMatchesAllRuns: true,
    s432: { frontPomsPreviouslyHeld: 2, backSleeveColorwayPreviouslyFailed: true,
      residualThresholdCm: residual.residualThresholdCm, s351ResidualCountAfterApprovedRule: 0,
      revisionId: oldFront.revisionId },
    s433BackColorway: { revisionId: backColorway.revisionId, issueCount: backColorway.issueCount,
      sameOptionValues: JSON.stringify(backColorway.options ?? option.options) === JSON.stringify(option.options),
      sleeveFill: backColorway.sleeveFillPath },
    s434CurrentProduction: { revisionId: currentFront.revisionId,
      front: { issueCount: currentFront.issueCount, sourcePoms: currentFront.pomScheduleCount, keyedRows: currentFront.keyedScheduleCount,
        sourcePOMUnavailableAtSideVentMin: option.caseId === "polo-sideVentDepth-min", svg: currentSvgs.FRONT_FLAT },
      back: { issueCount: currentBack.issueCount, sourcePoms: currentBack.pomScheduleCount, keyedRows: currentBack.keyedScheduleCount,
        frontOnlyAnchorsRemainTableOnly: true, sourcePOMUnavailableAtSideVentMin: option.caseId === "polo-sideVentDepth-min", svg: currentSvgs.BACK_FLAT },
      assemblyIssuesInS432SameOptions: 0 },
    s435FrontLabelCollisions: labelRow.collisionCount };
}));

const matrix = { purpose: "Evidence join by exact option case and values; slice-specific revision IDs are retained and are not falsely equated.",
  optionCount: rows.length, faceCount: production.rows.length, sourceOptionFixture: "S331-polo-browser-final/matrix.json",
  revisionLineage: { residual: "S432 per-case revision", backColorway: "S433 per-case revision", currentViews: "S434 per-case revision", currentFrontReadability: "same S434 revision audited by S435" },
  checks: { all17OptionValuesMatch: true, all34S434RowsPassLiveAndColorwayCompilerRenderer: true,
    all17BackSleeveFillContoursClosed: true, all34S351ResidualDiagnosticsClear: true,
    all17FrontKeyedFullTextSchedulesComplete: true, all17FrontLabelOverlapRowsClear: true,
    all34Held: true, facesAccepted: 0 },
  rows };
await writeFile(new URL("S436-polo-face-audit-matrix.json", folder), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ optionCount: matrix.optionCount, faceCount: matrix.faceCount, checks: matrix.checks,
  all17OptionValuesMatch: matrix.checks.all17OptionValuesMatch,
  passRevisionGroups: [...new Set(rows.map((row) => row.s434CurrentProduction.revisionId.split(":")[2]))] }, null, 2));
