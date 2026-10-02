import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const matrix = JSON.parse(readFileSync(new URL('./uncut-band-hem-half-matrix.json', import.meta.url), 'utf8'));

test('S369 uncut band diagnostic covers every exact-revision Woven option and face request', () => {
  assert.equal(matrix.configurationCount, 28);
  assert.equal(matrix.faceRequests, 56);
  assert.equal(matrix.results.length, 28);
  assert.equal(matrix.revisionId, 'live-draft:woven-shirt:14:14');
  assert.ok(matrix.results.every((row) => row.revisionId === matrix.revisionId));
  assert.deepEqual(matrix.browserErrors, []);
  assert.equal(matrix.sourceFacts.crop, false);
});

test('S369 full-band mapping records the distortion and crossings that retain every hold', () => {
  assert.equal(matrix.candidate, 'complete uncut band; full source top normalized onto exact BACK hem [0,0.5]; extension maps away from source-bound sleeve interior');
  assert.equal(matrix.counts.maxMappedTopResidualCm, 0);
  assert.ok(matrix.counts.maxSourceFullJoinResidualCm < 1e-10);
  assert.equal(matrix.counts.minBandLengthRatio, 0.5);
  assert.equal(matrix.counts.maxBandLengthRatio, 0.5);
  assert.equal(matrix.counts.optionsWithSelfCrossing, 28);
  assert.equal(matrix.counts.selfCrossingEvents, 112);
  assert.equal(matrix.counts.optionsWithMirroredOuterCrossings, 28);
  assert.equal(matrix.counts.mirroredOuterCrossingEvents, 28);
  assert.equal(matrix.counts.optionsWithBandSleeveCrossings, 0);
  assert.equal(matrix.counts.optionsWithBodyYokeCrossings, 0);
  assert.ok(matrix.results.every((row) => row.checks.bandOutlineSelfCrossings === 4));
  assert.ok(matrix.results.every((row) => row.checks.mirroredOuterCrossings === 1));
  assert.equal(matrix.selectedRenderedCases.length, 5);
});
