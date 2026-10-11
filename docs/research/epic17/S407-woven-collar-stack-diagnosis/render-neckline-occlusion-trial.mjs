import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = fileURLToPath(new URL('./', import.meta.url));
const matrix = JSON.parse(await readFile(join(folder, '../S406-woven-approved-view-conventions/production-replay/matrix.json'), 'utf8'));
const diagnosis = JSON.parse(await readFile(join(folder, 'woven-collar-stack-crossings.json'), 'utf8'));
const cases = ['woven-shirt-default', 'woven-shirt-neckEase-min', 'woven-shirt-neckEase-max'];
const point = (x, y) => ({ x, y });
const lerp = (a, b, t) => point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return point(u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y);
}
function splitAtX(p0, p1, p2, p3, targetX) {
  const increasing = p3.x > p0.x;
  let low = 0, high = 1;
  for (let i = 0; i < 64; i++) {
    const mid = (low + high) / 2;
    if ((cubic(p0, p1, p2, p3, mid).x < targetX) === increasing) low = mid; else high = mid;
  }
  const t = (low + high) / 2;
  const p01 = lerp(p0, p1, t), p12 = lerp(p1, p2, t), p23 = lerp(p2, p3, t);
  const p012 = lerp(p01, p12, t), p123 = lerp(p12, p23, t), seam = lerp(p012, p123, t);
  const right = [seam, p123, p23, p3];
  let arc = 0, previous = p0;
  for (let i = 1; i <= 1000; i++) { const next = cubic(p0, p1, p2, p3, t * i / 1000); arc += Math.hypot(next.x - previous.x, next.y - previous.y); previous = next; }
  return { t, seam, right, hiddenLengthCm: arc };
}
function fmt(p) { return `${Number(p.x.toFixed(7))} ${Number(p.y.toFixed(7))}`; }

const renderDir = join(folder, 'rendered', 'front-neckline-occlusion-trial');
await mkdir(renderDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const rows = [];
for (const caseId of cases) {
  const item = matrix.cases.find((candidate) => candidate.caseId === caseId);
  assert.ok(item, `Missing S406 case ${caseId}`);
  const front = item.faces.find((candidate) => candidate.kind === 'FRONT_FLAT');
  assert.equal(front.revisionId, 'live-draft:woven-shirt:14:14');
  await page.setContent(front.svg, { waitUntil: 'load' });
  await page.locator('svg').evaluate((root) => root.setAttribute('viewBox', '-4 6.4 8 5.8'));
  await page.screenshot({ path: join(renderDir, `${caseId}-baseline-detail.png`), fullPage: true });
  const doc = new JSDOM(front.svg, { contentType: 'image/svg+xml' }).window.document;
  const crossings = diagnosis.rows.find((candidate) => candidate.caseId === caseId).crossings
    .find((candidate) => candidate.pair === 'front <> underCollar').points.filter((candidate) => Math.abs(candidate.x) < 2);
  assert.equal(crossings.length, 2, `${caseId}: expected paired center-front stations`);
  const edits = [];
  for (const path of doc.querySelectorAll('path[data-entity-id*="view-seam:front:neckline"]')) {
    const d = path.getAttribute('d') ?? '';
    const m = d.match(/^M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+C\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)$/u);
    assert.ok(m, `${caseId}: unexpected neckline path ${d}`);
    const [, x0, y0, x1, y1, x2, y2, x3, y3] = m;
    const p0 = point(+x0, +y0), p1 = point(+x1, +y1), p2 = point(+x2, +y2), p3 = point(+x3, +y3);
    const target = crossings.find((candidate) => (p3.x > p0.x) === (candidate.x > 0));
    assert.ok(target, `${caseId}: no collar crossing for neckline half`);
    const split = splitAtX(p0, p1, p2, p3, target.x);
    assert.ok(Math.abs(split.seam.y - target.y) < 0.01, `${caseId}: intersection is not on neckline curve`);
    path.setAttribute('d', `M${fmt(split.right[0])} C${fmt(split.right[1])} ${fmt(split.right[2])} ${fmt(split.right[3])}`);
    path.setAttribute('data-diagnostic-trial', 'G04-S407-COLLAR-FOREGROUND-OVER-BASE-NECKLINE');
    edits.push({ entityId: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'),
      crossingCm: target, tFromCenterFront: split.t, removedNecklineLengthCm: split.hiddenLengthCm, retainedStart: split.seam });
  }
  assert.equal(edits.length, 2, `${caseId}: both reflected neckline seam segments must be clipped`);
  const svg = new (new JSDOM().window.XMLSerializer)().serializeToString(doc.documentElement);
  await writeFile(join(renderDir, `${caseId}-trial.svg`), svg);
  await page.setContent(svg, { waitUntil: 'load' });
  await page.locator('svg').evaluate((root) => root.setAttribute('viewBox', '-4 6.4 8 5.8'));
  await page.screenshot({ path: join(renderDir, `${caseId}-detail.png`), fullPage: true });
  rows.push({ caseId, revisionId: front.revisionId, edits });
}
await browser.close();
const report = { trialOnly: true,
  proposedOrder: 'projected collar remains foreground; clip only the body front.neckline seam from its source center-front endpoint through the first same-revision collar intersection on each reflected side',
  sourceIdentityPreserved: true, cutGeometryChanged: false, stitchGraphChanged: false,
  productionOutputChanged: false, browserErrors: errors.length, rows,
  hiddenLengthBoundsCm: {
    min: Math.min(...rows.flatMap((row) => row.edits.map((edit) => edit.removedNecklineLengthCm))),
    max: Math.max(...rows.flatMap((row) => row.edits.map((edit) => edit.removedNecklineLengthCm))),
  } };
assert.equal(errors.length, 0);
await writeFile(join(renderDir, 'trial-matrix.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ cases: rows.length, browserErrors: errors.length, hiddenLengthBoundsCm: report.hiddenLengthBoundsCm }, null, 2));
