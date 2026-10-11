import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const currentDir = new URL('./rendered/', import.meta.url);
const baselineDir = new URL('../S394-polo-h-glyph-offset/rendered/', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('./polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const rows = [];

for (const row of matrix.rows) {
  const filename = `${row.caseId}-collar-point.svg`;
  const current = await readFile(new URL(filename, currentDir), 'utf8');
  const baseline = await readFile(new URL(filename, baselineDir), 'utf8');
  const currentDoc = new JSDOM(current, { contentType: 'image/svg+xml' }).window.document;
  const baselineDoc = new JSDOM(baseline, { contentType: 'image/svg+xml' }).window.document;
  const currentMarker = currentDoc.querySelector('g[data-pom-key="FG"]');
  const baselineMarker = baselineDoc.querySelector('g[data-pom-key="FG"]');
  assert.ok(currentMarker && baselineMarker, `${row.caseId}: missing FG marker`);
  assert.deepEqual([...currentMarker.querySelector('circle').attributes].map(({ name, value }) => [name, value]),
    [...baselineMarker.querySelector('circle').attributes].map(({ name, value }) => [name, value]), `${row.caseId}: FG ring changed`);
  assert.equal(currentMarker.getAttribute('data-source-id'), 'pom:polo:front-neck-drop|pom:polo:finished-placket-width');
  assert.equal(currentMarker.getAttribute('data-callout-targets'),
    'flat:polo:FRONT_FLAT:component:front:outline|flat:polo:FRONT_FLAT:mark:buttonPlacket:attachmentLine');
  assert.equal(currentMarker.getAttribute('data-callout-source-entities'),
    'pattern:polo:role:front:edge:neckline|pattern:polo:mark:buttonPlacket:attachmentLine');
  assert.equal(currentMarker.getAttribute('data-revision-id'), `live-draft:polo:S399:${row.caseId}`);
  const glyph = currentMarker.querySelector('text');
  assert.equal(glyph.textContent, 'FG');
  assert.equal(glyph.getAttribute('x'), '-0.4243');
  assert.equal(glyph.getAttribute('y'), '7.6457');
  assert.equal(currentDoc.querySelectorAll('[data-schedule-for]').length, 11, `${row.caseId}: schedule row count changed`);
  assert.ok(currentDoc.querySelector('[data-schedule-for="flat:polo:FRONT_FLAT:callout:front-neck-drop"]'));
  assert.ok(currentDoc.querySelector('[data-schedule-for="flat:polo:FRONT_FLAT:callout:finished-placket-width"]'));

  const baselineGlyph = baselineMarker.querySelector('text');
  const restored = current.replace(
    `<text x="${glyph.getAttribute('x')}" y="${glyph.getAttribute('y')}"`,
    `<text x="${baselineGlyph.getAttribute('x')}" y="${baselineGlyph.getAttribute('y')}"`,
  ).replaceAll('S399', 'S394');
  assert.equal(restored, baseline, `${row.caseId}: content differs beyond FG glyph coordinates and revision/title token`);
  rows.push({ caseId: row.caseId, ringUnchanged: true, sourceIds: currentMarker.getAttribute('data-source-id'),
    targets: currentMarker.getAttribute('data-callout-targets'), glyph: { x: glyph.getAttribute('x'), y: glyph.getAttribute('y') },
    scheduleRows: 11, otherwiseByteIdenticalToS394: true });
}

assert.equal(rows.length, 17);
assert.equal(matrix.summary.keyedRendered, 17);
assert.equal(matrix.summary.browserErrors, 0);
assert.equal(matrix.summary.colorwayRows, 17);
assert.equal(matrix.summary.pairedBackUnchanged, 17);
const evidence = {
  baseline: 'S394 actual production-renderer SVGs for the same 17 Polo option values',
  current: 'S399 actual production-renderer SVGs',
  result: 'All 17 SVGs are byte-identical to S394 after restoring only the FG glyph x/y and normalizing the S399 revision/title token. The FG ring attributes, two POM source IDs, exact targets/source entities, revision binding, full schedule, paths, marks, colorway and pattern geometry are preserved.',
  keyedFronts: 17, colorwayFronts: 17, unchangedPairedBacks: 17, browserErrors: 0,
  productionHoldsReleased: 0, sleeveResidualCm: 0.68, residualGateCm: 0.25, rows,
};
await writeFile(new URL('./fg-output-diff-verification.json', import.meta.url), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`verified FG-only SVG changes against S394 across ${rows.length} Polo options`);
