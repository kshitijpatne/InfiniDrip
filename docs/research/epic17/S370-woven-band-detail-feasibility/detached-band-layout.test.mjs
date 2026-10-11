import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const matrix = JSON.parse(readFileSync(new URL('./detached-band-layout-matrix.json', import.meta.url), 'utf8'));

test('S370 detached detail covers all exact-revision Woven options without changing holds', () => {
  assert.equal(matrix.configurationCount, 28);
  assert.equal(matrix.faceRequests, 56);
  assert.equal(matrix.revisionId, 'live-draft:woven-shirt:14:14');
  assert.ok(matrix.rows.every((row) => row.revisionId === matrix.revisionId));
  assert.ok(matrix.rows.every((row) => row.checks.instances === 2));
  assert.ok(matrix.rows.every((row) => row.checks.sourceOutlineClosed));
  assert.ok(matrix.rows.every((row) => row.checks.sourceOutlineClosingGapCm <= 1e-7));
  assert.ok(matrix.rows.every((row) => row.checks.faceHoldsReleased === 0));
  assert.deepEqual(matrix.browserErrors, []);
});

test('S370 detached bands preserve source scale, closure, clearance, and render-frame bounds', () => {
  assert.equal(matrix.candidate.includes('not at assembly location'), true);
  assert.equal(matrix.counts.allFramesFit, true);
  assert.equal(matrix.counts.minScale, 1);
  assert.equal(matrix.counts.maxScale, 1);
  assert.equal(matrix.counts.totalBandSelfCrossings, 0);
  assert.equal(matrix.counts.optionsWithBandSelfCrossing, 0);
  assert.ok(matrix.counts.minBodyClearanceCm >= 1);
  assert.equal(matrix.selectedRenderedCases.length, 5);
});
