import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = fileURLToPath(new URL('../S390-polo-centerback-glyph-candidates/rendered/', import.meta.url));
const sourceMatrix = JSON.parse(await readFile(new URL('../S390-polo-centerback-glyph-candidates/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const currentMatrix = JSON.parse(await readFile(new URL('../S391-polo-keyed-marker-current-state/polo-keyed-marker-current-state-matrix.json', import.meta.url), 'utf8'));
assert.equal(sourceMatrix.rows.length, 17);
assert.equal(currentMatrix.samples.length, 17);

const candidates = [
  { name: 'current', dx: 0, dy: 0 },
  { name: 'down-0.35', dx: 0, dy: 0.35 },
  { name: 'down-0.45', dx: 0, dy: 0.45 },
  { name: 'down-0.55', dx: 0, dy: 0.55 },
  { name: 'right-0.35', dx: 0.35, dy: 0 },
  { name: 'right-0.45', dx: 0.45, dy: 0 },
  { name: 'left-0.35', dx: -0.35, dy: 0 },
  { name: 'left-0.45', dx: -0.45, dy: 0 },
  { name: 'up-0.35', dx: 0, dy: -0.35 },
  { name: 'up-0.45', dx: 0, dy: -0.45 },
  { name: 'right-0.55', dx: 0.55, dy: 0 },
  { name: 'left-0.55', dx: -0.55, dy: 0 },
  { name: 'down-right-0.35', dx: 0.35, dy: 0.35 },
  { name: 'down-right-0.45', dx: 0.45, dy: 0.45 },
  { name: 'down-left-0.35', dx: -0.35, dy: 0.35 },
  { name: 'down-left-0.45', dx: -0.45, dy: 0.45 },
  { name: 'up-right-0.35', dx: 0.35, dy: -0.35 },
  { name: 'up-right-0.45', dx: 0.45, dy: -0.45 },
  { name: 'up-left-0.35', dx: -0.35, dy: -0.35 },
  { name: 'up-left-0.45', dx: -0.45, dy: -0.45 },
];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
const samples = [];
const renderDir = join(dir, 'rendered');
await mkdir(renderDir, { recursive: true });
const gap = (a, b) => Math.hypot(Math.max(0, a.minX - b.maxX, b.minX - a.maxX), Math.max(0, a.minY - b.maxY, b.minY - a.maxY));

for (const row of sourceMatrix.rows) {
  const revisionId = `live-draft:polo:S390:${row.caseId}`;
  const current = currentMatrix.samples.find((sample) => sample.caseId === row.caseId);
  assert.ok(current, `${row.caseId}: missing S391 sample`);
  assert.deepEqual(current.options, row.options, `${row.caseId}: option mismatch`);
  assert.equal(current.revisionId, revisionId, `${row.caseId}: S391 revision mismatch`);
  const filename = `${row.caseId}-collar-point.svg`;
  const svg = await readFile(join(sourceDir, filename), 'utf8');
  assert.ok(svg.includes(`data-revision-id="${revisionId}"`), `${row.caseId}: SVG revision mismatch`);
  assert.equal((svg.match(/data-schedule-for=/gu) ?? []).length, 11, `${row.caseId}: schedule row count`);
  const hStation = current.stations.find((station) => station.key === 'H');
  assert.ok(hStation, `${row.caseId}: missing H station`);
  assert.deepEqual(hStation.sourceIds.split('|').sort(), ['pom:polo:neck-width', 'pom:polo:shoulder-seam']);
  assert.deepEqual(hStation.sourceEntityIds, ['pattern:polo:role:front:edge:shoulder', 'pattern:polo:role:front:edge:shoulder']);
  const candidateMetrics = [];
  await page.setContent(svg, { waitUntil: 'load' });
  for (const candidate of candidates) {
    const metrics = await page.evaluate(({ candidate, expectedRevision }) => {
      const gap = (a, b) => Math.hypot(Math.max(0, a.minX - b.maxX, b.minX - a.maxX), Math.max(0, a.minY - b.maxY, b.minY - a.maxY));
      const root = document.querySelector('svg');
      const group = root.querySelector('g[data-pom-key="H"]');
      const text = group.querySelector('text');
      const ring = group.querySelector('circle');
      const origin = window.__s393HText ??= { x: Number(text.getAttribute('x')), y: Number(text.getAttribute('y')) };
      const dx = candidate.dx, dy = candidate.dy;
      text.setAttribute('x', String(origin.x + dx));
      text.setAttribute('y', String(origin.y + dy));
      const box = (node, expand = 0) => {
        const b = node.getBBox();
        return { minX: b.x - expand, minY: b.y - expand, maxX: b.x + b.width + expand, maxY: b.y + b.height + expand };
      };
      const glyph = box(text, 0.045);
      const ringCenter = { x: Number(ring.getAttribute('cx')), y: Number(ring.getAttribute('cy')) };
      const ringRadius = Number(ring.getAttribute('r'));
      const ringStroke = Number(ring.getAttribute('stroke-width')) / 2;
      const cached = window.__s393HGeometry ?? (() => {
        const textNodes = [...root.querySelectorAll('text[data-label-for]')].map((node) => ({
          id: node.getAttribute('data-label-for'), sourceId: node.getAttribute('data-source-id'), box: box(node),
        }));
        const marks = [...root.querySelectorAll('[data-mark-kind]')].map((node) => ({
          id: node.getAttribute('data-entity-id'), sourceId: node.getAttribute('data-source-id') ?? node.closest('[data-source-id]')?.getAttribute('data-source-id'), box: box(node, 0.02),
        }));
        const paths = [...root.querySelectorAll('path[data-entity-id]')].filter((node) =>
          (node.getAttribute('data-source-id') ?? '').startsWith('pattern:polo:') && !node.hasAttribute('data-colorway-fill-for'));
        const pathRows = paths.map((path) => {
          const length = path.getTotalLength();
          const steps = Math.max(1, Math.ceil(length / 0.025));
          const stroke = Number(path.getAttribute('stroke-width') ?? '0') / 2;
          const points = Array.from({ length: steps + 1 }, (_, index) => path.getPointAtLength(length * index / steps));
          return { id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'), stroke, points };
        });
        return { textNodes, marks, paths: pathRows, markCount: marks.length, pathCount: paths.length };
      })();
      window.__s393HGeometry = cached;
      const pathRows = cached.paths.map((path) => {
        let clearance = Infinity;
        for (const point of path.points) {
          const dx = Math.max(0, glyph.minX - point.x, point.x - glyph.maxX);
          const dy = Math.max(0, glyph.minY - point.y, point.y - glyph.maxY);
          clearance = Math.min(clearance, Math.hypot(dx, dy) - path.stroke);
        }
        return { id: path.id, sourceId: path.sourceId, clearanceCm: clearance };
      });
      const nearest = (rows, clearance) => rows.map((row) => ({ ...row, clearanceCm: clearance(row) })).sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? null;
      const scheduleRows = [...root.querySelectorAll('[data-layer-group="POM_SCHEDULE"] [data-schedule-for]')];
      const allSourcePaths = pathRows;
      const nearestPath = nearest(allSourcePaths, (row) => row.clearanceCm);
      const nearestMark = nearest(cached.marks, (row) => gap(glyph, row.box));
      const nearestLabel = nearest(cached.textNodes, (row) => gap(glyph, row.box));
      const radius = Math.hypot(Math.max(0, glyph.minX - ringCenter.x, ringCenter.x - glyph.maxX), Math.max(0, glyph.minY - ringCenter.y, ringCenter.y - glyph.maxY));
      return {
        revisionId: root.getAttribute('data-revision-id'), keySourceIds: group.getAttribute('data-source-id'),
        keyTargets: group.getAttribute('data-callout-target'), ringCenter, ringRadiusCm: ringRadius,
        originGlyph: origin, trialGlyph: { x: origin.x + dx, y: origin.y + dy },
        glyphToRingEdgeClearanceCm: radius >= ringRadius + ringStroke ? radius - ringRadius - ringStroke : 0,
        nearestSourcePath: nearestPath, nearestMark, nearestSourceLabel: nearestLabel,
        scheduleCount: scheduleRows.length, scheduleRevisionMismatchCount: scheduleRows.filter((item) => item.getAttribute('data-revision-id') !== expectedRevision).length,
        sourceMarkIds: cached.marks.map((mark) => mark.sourceId).filter(Boolean), sourcePathCount: cached.pathCount,
        untouchedSourceMarks: cached.markCount,
      };
    }, { candidate, expectedRevision: revisionId });
    assert.equal(metrics.revisionId, revisionId);
    assert.equal(metrics.scheduleCount, 11);
    assert.equal(metrics.scheduleRevisionMismatchCount, 0);
    assert.deepEqual([metrics.ringCenter.x, metrics.ringCenter.y], hStation.ringCenterCm);
    assert.equal(metrics.ringRadiusCm, 0.22);
    candidateMetrics.push({ ...candidate, ...metrics });
    if (candidate.name === 'down-right-0.45') {
      const candidateSvg = await page.locator('svg').evaluate((node) => {
        const wholeClone = node.cloneNode(true);
        const cropClone = node.cloneNode(true);
        const ring = cropClone.querySelector('g[data-pom-key="H"] circle');
        const cx = Number(ring.getAttribute('cx')), cy = Number(ring.getAttribute('cy'));
        cropClone.setAttribute('viewBox', `${cx - 2.5} ${cy - 2.5} 5 5`);
        return { crop: new XMLSerializer().serializeToString(cropClone), whole: new XMLSerializer().serializeToString(wholeClone) };
      });
      await page.setContent(candidateSvg.crop, { waitUntil: 'load' });
      await page.screenshot({ path: join(renderDir, `${row.caseId}-H-down-right-0.45-S393-candidate.png`), fullPage: true });
      if (row.caseId === 'polo-default') {
        await page.setContent(candidateSvg.whole, { waitUntil: 'load' });
        await page.screenshot({ path: join(renderDir, 'polo-default-H-down-right-0.45-S393-whole.png'), fullPage: true });
      }
    }
  }
  samples.push({ caseId: row.caseId, options: row.options, revisionId, hSourceIds: hStation.sourceIds,
    hSourceEntityIds: hStation.sourceEntityIds, hTargetIds: hStation.targetIds, ringCenterCm: hStation.ringCenterCm,
    baselineContacts: { paths: hStation.unrelatedPathContacts, marks: hStation.independentMarkContacts }, candidateMetrics });
}
assert.deepEqual(browserErrors, []);
const summary = candidates.map(({ name, dx, dy }) => {
  const metrics = samples.map((sample) => sample.candidateMetrics.find((row) => row.name === name));
  return { name, dx, dy, optionRows: metrics.length,
    minGlyphToPathClearanceCm: Math.min(...metrics.map((row) => row.nearestSourcePath.clearanceCm)),
    minGlyphToMarkClearanceCm: Math.min(...metrics.map((row) => row.nearestMark.clearanceCm)),
    minGlyphToSourceLabelClearanceCm: Math.min(...metrics.map((row) => row.nearestSourceLabel.clearanceCm)),
    minGlyphToRingClearanceCm: Math.min(...metrics.map((row) => row.glyphToRingEdgeClearanceCm)),
    optionsWithPositiveClearanceToAll: metrics.filter((row) => row.nearestSourcePath.clearanceCm > 0 && row.nearestMark.clearanceCm > 0 && row.nearestSourceLabel.clearanceCm > 0).length };
});
await writeFile(join(dir, 'h-glyph-placement-candidates.json'), `${JSON.stringify({ source: 'actual S390 production-renderer SVGs for the exact S390/S391 17 supported Polo option rows; diagnostic glyph-only coordinate substitutions, no source/revision or ring edits',
  configurations: samples.length, browserErrors, keysAndSchedulePreserved: true, sourceGeometryAndMarksUntouched: true,
  candidateOffsetsCm: candidates, summary, samples }, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({ configurations: samples.length, browserErrors: browserErrors.length, summary }, null, 2));
