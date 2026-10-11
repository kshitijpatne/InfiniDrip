import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = new URL('./', import.meta.url);
const sourceDir = new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('segmented-h-locator-matrix.json', folder), 'utf8'));
const { window } = new JSDOM('<!doctype html>');
const componentPaths = (doc) => [...doc.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')]
  .map((node) => [node.getAttribute('data-entity-id'), node.getAttribute('data-source-id'), node.getAttribute('data-revision-id'), node.getAttribute('d')]);
const sourceMarks = (doc) => [...doc.querySelectorAll('[data-entity-id*="mark:"]')]
  .filter((node) => node.getAttribute('data-entity-id') !== 'H:key-marker')
  .map((node) => node.outerHTML);
const attrs = (node) => [...node.attributes].map((a) => [a.name, a.value]).sort(([a], [b]) => a.localeCompare(b));
for (const row of matrix.rows) {
  assert.equal(row.revisionId, `live-draft:polo:S399:${row.caseId}`);
  assert.equal(row.radiusCm, 0.22);
  assert.equal(row.cx, 7); assert.equal(row.cy, 0); assert.equal(row.sourceRadius, 0.22);
  assert.ok(row.retainedCoverage >= 0.5, `${row.caseId}: locator retained under half its circumference`);
  assert.ok(row.arcs.length >= 2 && row.arcs.length <= 3, `${row.caseId}: unexpected arc count`);
  assert.equal(row.postPaint.collidingSamples, 0, `${row.caseId}: segmented stroke still contacts a source stroke`);
  assert.ok(row.obstacleIds.includes('flat:polo:FRONT_FLAT:component:front:outline'));
  assert.ok(row.obstacleIds.includes('flat:polo:FRONT_FLAT:component:outerStand:outline'));
  const original = new window.DOMParser().parseFromString(await readFile(new URL(`${row.caseId}-collar-point.svg`, sourceDir), 'utf8'), 'image/svg+xml');
  const candidate = new window.DOMParser().parseFromString(await readFile(new URL(row.output, folder), 'utf8'), 'image/svg+xml');
  const sourceRoot = original.documentElement, candidateRoot = candidate.documentElement;
  assert.equal(candidateRoot.getAttribute('data-revision-id'), row.revisionId);
  assert.deepEqual(componentPaths(sourceRoot), componentPaths(candidateRoot), `${row.caseId}: component source paths changed`);
  assert.deepEqual(sourceMarks(sourceRoot), sourceMarks(candidateRoot), `${row.caseId}: source mark changed`);
  assert.equal(sourceRoot.querySelector('[data-layer-group="POM_SCHEDULE"]')?.outerHTML,
    candidateRoot.querySelector('[data-layer-group="POM_SCHEDULE"]')?.outerHTML, `${row.caseId}: schedule changed`);
  const sourceMarker = sourceRoot.querySelector('[data-entity-id="H:key-marker"]');
  const candidateMarker = candidateRoot.querySelector('[data-entity-id="H:key-marker"]');
  assert.deepEqual(attrs(sourceMarker), attrs(candidateMarker), `${row.caseId}: H identity/anchor/targets changed`);
  assert.equal(sourceMarker.querySelector('text')?.outerHTML, candidateMarker.querySelector('text')?.outerHTML, `${row.caseId}: H glyph changed`);
  assert.ok(candidateMarker.querySelector('[data-diagnostic-segmentation="S419"]'), `${row.caseId}: diagnostic ring missing`);
}
assert.equal(matrix.options, 17);
assert.equal(matrix.browserErrors.length, 0);
console.log('17-option segmented H trial preserves revision-bound component paths, source marks, H identity/glyph/targets and POM schedule; all sampled segmented strokes clear source paths/marks.');
