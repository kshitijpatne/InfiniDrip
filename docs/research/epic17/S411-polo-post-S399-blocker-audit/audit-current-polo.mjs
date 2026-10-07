import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('./', import.meta.url));
const s399 = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const s392 = JSON.parse(await readFile(new URL('../S392-polo-current-blocker-reconciliation/polo-current-blocker-reconciliation.json', import.meta.url), 'utf8'));
const s391 = JSON.parse(await readFile(new URL('../S391-polo-keyed-marker-current-state/polo-keyed-marker-current-state-matrix.json', import.meta.url), 'utf8'));

assert.equal(s399.rows.length, 17);
assert.equal(s392.cases.length, 17);
assert.equal(s391.samples.length, 17);
const s392ById = new Map(s392.cases.map((row) => [row.caseId, row]));
const s391ById = new Map(s391.samples.map((row) => [row.caseId, row]));
const keys = ['A', 'B', 'C', 'D', 'E', 'FG', 'H', 'I'];
const rows = s399.rows.map((row) => {
  const prior = s392ById.get(row.caseId);
  const stationReview = s391ById.get(row.caseId);
  assert.ok(prior && stationReview, `missing prior option row ${row.caseId}`);
  assert.deepEqual(row.options, prior.options, `${row.caseId}: options differ from S392 residual row`);
  assert.deepEqual(row.options, stationReview.options, `${row.caseId}: options differ from S391 source-path row`);
  assert.equal(row.revisionId, `live-draft:polo:S399:${row.caseId}`);
  assert.deepEqual(row.keyedRenderIssues, [], `${row.caseId}: unexpected keyed renderer issue`);
  assert.equal(row.visibleMarkerKeys.length, keys.length);
  assert.deepEqual([...row.visibleMarkerKeys].sort(), [...keys].sort());
  assert.equal(row.fullScheduleRows, 11);
  assert.equal(row.sourceCenteredPoms.length, 10);
  assert.equal(row.pairedBackUnchanged, true);
  assert.equal(prior.keyedIssueCount, 0);
  assert.equal(prior.keyedPomCount, 10);
  assert.equal(prior.keyedScheduleRows, 11);
  assert.equal(prior.pairedBackUnchanged, true);
  const faceResiduals = prior.faces.map((face) => ({
    face: face.kind,
    revisionId: face.revisionId,
    source: face.assemblyIssue.sourceId,
    residualCm: face.assemblyIssue.residualCm,
    code: face.assemblyIssue.code,
  }));
  assert.equal(faceResiduals.length, 2);
  for (const face of faceResiduals) {
    assert.equal(face.source, 'stitch:Sleeve-cap ease');
    assert.equal(face.residualCm, 0.68);
  }
  return {
    caseId: row.caseId,
    options: row.options,
    revisionId: row.revisionId,
    keyedRendererIssues: row.keyedRenderIssues,
    baselineIssues: row.originalBaseIssues,
    keyedStations: row.visibleMarkerKeys,
    keyedPoms: row.sourceCenteredPoms,
    fullScheduleRows: row.fullScheduleRows,
    colorwayRendered: row.colorwayFillRendered,
    pairedBackUnchanged: row.pairedBackUnchanged,
    sleeveResiduals: faceResiduals,
  };
});

const baselineFailures = rows.flatMap((row) => row.baselineIssues.map((issue) => ({
  caseId: row.caseId,
  code: issue.code,
  entityId: issue.entityId,
  message: issue.message,
})));
assert.equal(baselineFailures.length, 3);
assert.deepEqual(baselineFailures.map(({ caseId }) => caseId).sort(), [
  'polo-collarLeafDepth-max',
  'polo-collarPointExtension-min',
  'polo-standFrontRise-max',
].sort());
assert.ok(baselineFailures.every((issue) => issue.entityId === 'flat:polo:FRONT_FLAT:callout:collar-point-extension'));
assert.equal(s399.summary.keyedBaseFailures.length, 0);
assert.equal(s399.summary.keyedRendered, 17);
assert.equal(s399.summary.browserErrors, 0);
assert.equal(s399.summary.independentSleeveResidualCm, 0.68);
assert.equal(s399.summary.residualGateCm, 0.25);
assert.equal(s392.acceptanceThresholdCm, 0.25);

const contactsByKey = s392.currentKeyStationObservations.byKey.map((entry) => ({
  key: entry.key,
  candidateCount: entry.candidateCount,
  affectedOptionRows: entry.affectedOptionRows,
  sourceEntities: entry.sourceEntities,
  targetEntities: entry.targetEntities,
  classification: entry.classification,
}));
assert.deepEqual(contactsByKey.map((entry) => entry.key).sort(), [...keys].sort());
const output = {
  source: 'S399 actual production renderer matrix reconciled to S392 residual rows and S391 source-path classifications',
  configurations: rows.length,
  sameOptionRowsAsS391AndS392: true,
  keyedRendererIssues: 0,
  unkeyedBaselineFailures: baselineFailures,
  contactsByKey,
  summary: {
    fullScheduleRowsPerOption: 11,
    sourcePomsPerOption: 10,
    colorwayRows: s399.summary.colorwayRows,
    pairedBackUnchangedRows: s399.summary.pairedBackUnchanged,
    faceCount: rows.reduce((count, row) => count + row.sleeveResiduals.length, 0),
    sleeveResidualCm: 0.68,
    residualGateCm: 0.25,
    facesAboveResidualGate: rows.reduce((count, row) => count + row.sleeveResiduals.filter((face) => face.residualCm > 0.25).length, 0),
    productionHoldsReleased: 0,
  },
  rows,
  renderedReview: [
    'S399 rendered/polo-default-collar-point-detail.png',
    'S399 rendered/polo-collarPointExtension-min-collar-point-detail.png',
    'S399 rendered/polo-default-H-S399-detail.png',
  ],
};
assert.equal(output.summary.colorwayRows, 17);
assert.equal(output.summary.pairedBackUnchangedRows, 17);
assert.equal(output.summary.faceCount, 34);
assert.equal(output.summary.facesAboveResidualGate, 34);
assert.equal(output.summary.productionHoldsReleased, 0);
await writeFile(new URL('./polo-post-S399-current-blockers.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({configurations: rows.length, keyedRendererIssues: 0, unkeyedBaselineFailures: baselineFailures.length, faceResiduals: output.summary.faceCount, residualCm: 0.68, gateCm: 0.25, facesAboveGate: output.summary.facesAboveResidualGate}));
