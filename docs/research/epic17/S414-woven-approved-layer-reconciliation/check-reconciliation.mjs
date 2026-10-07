import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const dir = new URL('.', import.meta.url);
const [summary, crossings, paint, reconciliation] = await Promise.all([
  readFile(new URL('../S406-woven-approved-view-conventions/production-replay/summary.json', dir), 'utf8').then(JSON.parse),
  readFile(new URL('../S407-woven-collar-stack-diagnosis/woven-collar-stack-crossings.json', dir), 'utf8').then(JSON.parse),
  readFile(new URL('../S410-woven-neckline-layer-order-trial/woven-neckline-paint-order-matrix.json', dir), 'utf8').then(JSON.parse),
  readFile(new URL('./S414-reconciliation.json', dir), 'utf8').then(JSON.parse),
]);

assert.equal(summary.sourceRevision, reconciliation.sourceRevision);
assert.equal(crossings.sourceRevision, reconciliation.sourceRevision);
assert.equal(paint.sourceRevision, reconciliation.sourceRevision);
assert.equal(summary.configurations, 28);
assert.equal(summary.faceRequests, 56);
assert.equal(summary.frontEmitted, 28);
assert.equal(summary.backEmitted, 28);
assert.equal(summary.compileIssues + summary.rendererIssues + summary.browserErrors, 0);
assert.ok(summary.frontClipCounts.every(({ count }) => count === 6));
assert.equal(summary.backSvgByteIdentityMatchesS401, 28);
assert.equal(crossings.configurations, 28);
assert.equal(paint.configurations, 28);
assert.equal(paint.candidateSvgMutation, false);
assert.equal(paint.productionChanged, false);
assert.match(paint.finding, /already paints both complete body-neckline paths after/);
assert.equal(reconciliation.wovenFacesHeld, 56);
assert.equal(reconciliation.poloFacesHeld, 34);
console.log('S414 reconciliation matches exact S406/S407/S410 revision and all 28 options.');
