import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = fileURLToPath(new URL('./', import.meta.url));
const input = JSON.parse(await readFile(new URL('./current-production-replay/matrix.json', import.meta.url), 'utf8'));
const coverage = JSON.parse(await readFile(new URL('./silhouette-coverage-matrix.json', import.meta.url), 'utf8'));
assert.equal(input.rows.length, 28);
assert.equal(coverage.configurations, 28);
const trialDir = join(folder, 'leaf-mask-trial');
const screenshotDir = join(trialDir, 'rendered');
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const rows = [];
for (const row of input.rows) {
  const rootDoc = new JSDOM(row.svg, { contentType: 'image/svg+xml' }).window.document;
  const root = rootDoc.documentElement;
  assert.equal(root.getAttribute('data-revision-id'), 'live-draft:woven-shirt:14:14');
  const vb = (root.getAttribute('viewBox') ?? '').split(/\s+/u).map(Number);
  assert.equal(vb.length, 4);
  const defs = root.querySelector('defs');
  assert.ok(defs, `${row.caseId}: no defs`);
  const maskId = `s454-leaf-only-${row.caseId}`;
  const mask = rootDoc.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.setAttribute('id', maskId);
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
  mask.setAttribute('mask-type', 'luminance');
  mask.setAttribute('x', String(vb[0])); mask.setAttribute('y', String(vb[1]));
  mask.setAttribute('width', String(vb[2])); mask.setAttribute('height', String(vb[3]));
  const rect = rootDoc.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(vb[0])); rect.setAttribute('y', String(vb[1]));
  rect.setAttribute('width', String(vb[2])); rect.setAttribute('height', String(vb[3])); rect.setAttribute('fill', '#fff');
  mask.append(rect);
  const maskSources = [];
  for (const role of ['underCollar', 'upperCollar']) {
    const source = [...root.querySelectorAll('path[data-source-id]')].find(path =>
      path.getAttribute('data-source-id') === `pattern:woven-shirt:role:${role}`
      && !path.hasAttribute('data-entity-id') && path.getAttribute('fill') !== 'none');
    assert.ok(source, `${row.caseId}: missing ${role} fill`);
    const silhouette = source.cloneNode(false);
    silhouette.removeAttribute('id'); silhouette.removeAttribute('data-entity-id');
    silhouette.setAttribute('fill', '#000'); silhouette.setAttribute('stroke', 'none');
    silhouette.setAttribute('data-s454-mask-source', source.getAttribute('data-source-id'));
    mask.append(silhouette);
    maskSources.push({ role, sourceId: source.getAttribute('data-source-id'), pathD: source.getAttribute('d') });
  }
  defs.append(mask);
  const necklines = [...root.querySelectorAll('path[data-source-id="pattern:woven-shirt:role:front:edge:neckline"]')]
    .filter(path => path.hasAttribute('data-entity-id'));
  assert.equal(necklines.length, 2, `${row.caseId}: expected two mirrored source neckline paths`);
  const before = necklines.map(path => ({ id: path.getAttribute('data-entity-id'), d: path.getAttribute('d'), source: path.getAttribute('data-source-id') }));
  for (const path of necklines) {
    path.setAttribute('mask', `url(#${maskId})`);
    path.setAttribute('data-s454-trial', 'mask-only-inside-under-and-upper-collar-filled-silhouettes');
  }
  root.setAttribute('width', '1500px'); root.setAttribute('height', '900px');
  const svg = new (new JSDOM().window.XMLSerializer)().serializeToString(root);
  await writeFile(join(trialDir, `${row.caseId}-leaf-mask.svg`), svg);
  await page.setContent(svg, { waitUntil: 'load' });
  await page.locator('svg').evaluate((node) => node.setAttribute('viewBox', '-6 5 12 7'));
  await page.locator('svg').screenshot({ path: join(screenshotDir, `${row.caseId}-collar-detail.png`) });
  const c = coverage.rows.find(item => item.caseId === row.caseId);
  assert.ok(c, `${row.caseId}: no coverage row`);
  rows.push({ caseId: row.caseId, revisionId: row.revisionId, maskId, maskSources,
    unchangedNecklinePathGeometry: before.every((old, index) => old.d === necklines[index].getAttribute('d')),
    necklineEntityIds: before.map(path => path.id), leafCoveredIntervals: c.necklines.map(path => path.coveredIntervals),
    svgBytes: svg.length });
}
await browser.close();
assert.equal(errors.length, 0, `Browser errors: ${errors.join('; ')}`);
assert.ok(rows.every(row => row.unchangedNecklinePathGeometry));
const report = { candidateOnly: true, sourceRevision: 'live-draft:woven-shirt:14:14', configurations: rows.length,
  browserErrors: errors.length, changedPatternGeometry: false, changedStitchGraph: false, changedSourcePathGeometry: false,
  operation: 'For each FRONT_FLAT, apply an SVG luminance mask only to the two front:neckline stroke entities. The mask preserves white outside and paints black using the actual emitted filled underCollar and upperCollar role paths; outerStand fill is excluded because its neckline boundary is the directly joined body base seam. The neckline path d values and source identities remain unchanged.', rows };
await writeFile(join(trialDir, 'trial-matrix.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: rows.length, browserErrors: errors.length,
  changedNecklineGeometry: false, renderedTrialImages: rows.length,
  intervalStartBoundsCm: { min: Math.min(...rows.flatMap(r => r.leafCoveredIntervals.map(i => i[0]?.startCm ?? NaN))),
    max: Math.max(...rows.flatMap(r => r.leafCoveredIntervals.map(i => i[0]?.startCm ?? NaN))) } }, null, 2));
