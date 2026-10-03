import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const previousDir = fileURLToPath(new URL('../S388-polo-keyed-label-obstacles/', import.meta.url));
const matrix = JSON.parse(await readFile(join(dir, 'polo-keyed-marker-trial-matrix.json'), 'utf8'));
const oldMatrix = JSON.parse(await readFile(join(previousDir, 'polo-keyed-marker-trial-matrix.json'), 'utf8'));
assert.equal(matrix.rows.length, 17);
assert.equal(oldMatrix.rows.length, 17);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });

function keyed(svg, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const group = svg.match(new RegExp(`(<g\\b[^>]*data-pom-key="${escaped}"[^>]*>[\\s\\S]*?<text\\b[^>]*\\bx=")(-?\\d+(?:\\.\\d+)?)(" y=")(-?\\d+(?:\\.\\d+)?)(")`));
  assert.ok(group, `missing ${key} glyph`);
  const circle = svg.match(new RegExp(`<g\\b[^>]*data-pom-key="${escaped}"[^>]*>[\\s\\S]*?<circle\\b[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"`));
  assert.ok(circle, `missing ${key} ring`);
  return { x: Number(group[2]), y: Number(group[4]), cx: Number(circle[1]), cy: Number(circle[2]), r: Number(circle[3]) };
}

const samples = [];
const renderedDir = join(dir, 'rendered');
await mkdir(renderedDir, { recursive: true });
for (const row of matrix.rows) {
  const oldRow = oldMatrix.rows.find((candidate) => candidate.caseId === row.caseId);
  assert.ok(oldRow, `missing S388 baseline for ${row.caseId}`);
  assert.deepEqual(row.options, oldRow.options, `${row.caseId}: option values changed`);
  const filename = `${row.caseId}-collar-point.svg`;
  const svg = await readFile(join(renderedDir, filename), 'utf8');
  const oldSvg = await readFile(join(previousDir, 'rendered', filename), 'utf8');
  assert.equal((svg.match(/data-schedule-for=/gu) ?? []).length, 11, `${row.caseId}: schedule rows`);
  assert.equal(row.revisionId, `live-draft:polo:S390:${row.caseId}`);
  assert.ok(svg.includes(`data-revision-id="${row.revisionId}"`));
  assert.deepEqual(row.keyedRenderIssues, [], `${row.caseId}: renderer issues`);
  for (const key of ['E', 'I']) {
    const before = keyed(oldSvg, key), after = keyed(svg, key);
    const dx = key === 'E' ? -0.38 : 0.34;
    const dy = key === 'E' ? -0.34 : -0.32;
    assert.ok(Math.abs(after.x - before.x - dx) <= 0.00011, `${row.caseId}/${key}: x offset`);
    assert.ok(Math.abs(after.y - before.y - dy) <= 0.00011, `${row.caseId}/${key}: y offset`);
    assert.deepEqual([after.cx, after.cy, after.r], [before.cx, before.cy, before.r], `${row.caseId}/${key}: ring changed`);
    assert.equal(after.r, 0.22);
  }
  const currentE = keyed(svg, 'E'), currentI = keyed(svg, 'I');
  let restored = svg;
  for (const [key, offset] of [['E', { x: -0.38, y: -0.34 }], ['I', { x: 0.34, y: -0.32 }]]) {
    const old = keyed(oldSvg, key);
    const pattern = new RegExp(`(<g\\b[^>]*data-pom-key="${key}"[^>]*>[\\s\\S]*?<text\\b[^>]*\\bx=")-?\\d+(?:\\.\\d+)?(" y=")-?\\d+(?:\\.\\d+)?(")`);
    restored = restored.replace(pattern, `$1${old.x}$2${old.y}$3`);
  }
  assert.equal(restored.replaceAll('S390', 'S388'), oldSvg, `${row.caseId}: changes beyond approved E/I glyphs or revision`);
  await page.setContent(svg, { waitUntil: 'load' });
  const keyGeometry = await page.evaluate(({ svgText }) => {
    const doc = document;
    const root = doc.querySelector('svg');
    const metrics = ['E', 'I'].map((key) => {
      const group = doc.querySelector(`g[data-pom-key="${key}"]`);
      const text = group.querySelector('text');
      const circle = group.querySelector('circle');
      const b = text.getBBox();
      const box = { minX: b.x, maxX: b.x + b.width, minY: b.y, maxY: b.y + b.height };
      const gapBox = (other) => Math.hypot(Math.max(0, box.minX - other.maxX, other.minX - box.maxX), Math.max(0, box.minY - other.maxY, other.minY - box.maxY));
      const ring = { minX: Number(circle.getAttribute('cx')) - Number(circle.getAttribute('r')),
        maxX: Number(circle.getAttribute('cx')) + Number(circle.getAttribute('r')),
        minY: Number(circle.getAttribute('cy')) - Number(circle.getAttribute('r')),
        maxY: Number(circle.getAttribute('cy')) + Number(circle.getAttribute('r')) };
      const texts = [...doc.querySelectorAll('text[data-label-for]')].map((node) => { const r = node.getBBox(); return { id: node.getAttribute('data-label-for'), b: { minX: r.x, maxX: r.x + r.width, minY: r.y, maxY: r.y + r.height } }; });
      const paths = [...doc.querySelectorAll('path[data-entity-id]')].filter((path) => (path.getAttribute('data-source-id') ?? '').startsWith('pattern:polo:')
        && !path.hasAttribute('data-colorway-fill-for'));
      const pathGap = (path) => {
        const length = path.getTotalLength(), steps = Math.max(1, Math.ceil(length / 0.01));
        let best = Infinity;
        for (let index = 0; index <= steps; index++) {
          const p = path.getPointAtLength(length * index / steps);
          const d = Math.hypot(Math.max(0, box.minX - p.x, p.x - box.maxX), Math.max(0, box.minY - p.y, p.y - box.maxY));
          best = Math.min(best, d - Number.parseFloat(path.getAttribute('stroke-width') ?? '0') / 2);
        }
        return best;
      };
      const nearestText = texts.map((candidate) => ({ id: candidate.id, clearanceCm: gapBox(candidate.b) })).sort((a, b) => a.clearanceCm - b.clearanceCm)[0];
      const nearestPath = paths.map((path) => ({ id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'), clearanceCm: pathGap(path) })).sort((a, b) => a.clearanceCm - b.clearanceCm)[0];
      const marks = [...doc.querySelectorAll('[data-mark-kind]')].map((node) => {
        const r = node.getBBox(); return { id: node.getAttribute('data-entity-id'), clearanceCm: gapBox({ minX: r.x, maxX: r.x + r.width, minY: r.y, maxY: r.y + r.height }) };
      }).sort((a, b) => a.clearanceCm - b.clearanceCm);
      return { key, x: Number(text.getAttribute('x')), y: Number(text.getAttribute('y')), ringCenter: [Number(circle.getAttribute('cx')), Number(circle.getAttribute('cy'))],
        textBox: box, glyphToRingClearanceCm: gapBox(ring), nearestSourceText: nearestText, nearestSourcePath: nearestPath, nearestSourceMark: marks[0] };
    });
    return { revisionId: root.getAttribute('data-revision-id'), keyGeometry: metrics,
      sourcePathAndMarkCounts: [doc.querySelectorAll('path[data-entity-id][data-source-id^="pattern:polo:"]').length, doc.querySelectorAll('[data-mark-kind]').length],
      schedule: [...doc.querySelectorAll('[data-layer-group="POM_SCHEDULE"] [data-schedule-for]')].map((item) => item.textContent) };
  }, { svgText: svg });
  assert.equal(keyGeometry.revisionId, row.revisionId);
  assert.equal(keyGeometry.schedule.length, 11);
  if (['polo-default', 'polo-placketLength-min', 'polo-placketLength-max', 'polo-collarLeafDepth-min', 'polo-collarLeafDepth-max', 'polo-standFrontRise-min'].includes(row.caseId)) {
    await page.screenshot({ path: join(renderedDir, `${row.caseId}-S390-whole.png`), fullPage: true });
    for (const key of ['E', 'I']) {
      const item = keyGeometry.keyGeometry.find((candidate) => candidate.key === key);
      const size = 5;
      await page.setContent(svg.replace(/viewBox="[^"]+"/u, `viewBox="${item.ringCenter[0] - size / 2} ${item.ringCenter[1] - size / 2} ${size} ${size}"`), { waitUntil: 'load' });
      await page.screenshot({ path: join(renderedDir, `${row.caseId}-${key}-S390-detail.png`), fullPage: true });
    }
  }
  samples.push({ caseId: row.caseId, options: row.options, revisionId: row.revisionId, ...keyGeometry });
}
assert.deepEqual(browserErrors, []);
await writeFile(join(dir, 'polo-glyph-offset-output-review.json'), `${JSON.stringify({ source: 'S390 actual production-renderer SVGs compared to S388 output; actual Chromium geometry and rendered views', configurations: samples.length, browserErrors, offsetsCm: { E: [-0.38, -0.34], I: [0.34, -0.32] }, allChangesConfinedToApprovedGlyphCoordinatesAndRevision: true, ringCentersAndRadiiUnchanged: true, scheduleRowsPerOption: 11, samples }, null, 2)}\n`);
await browser.close();
console.log(`verified ${samples.length} actual renderer outputs; browser errors ${browserErrors.length}`);
