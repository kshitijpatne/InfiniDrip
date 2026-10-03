import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const priorDir = fileURLToPath(new URL('../S388-polo-keyed-label-obstacles/', import.meta.url));
const matrix = JSON.parse(await readFile(join(dir, '../S390-polo-centerback-glyph-candidates/polo-keyed-marker-trial-matrix.json'), 'utf8'));
const priorMatrix = JSON.parse(await readFile(join(priorDir, 'polo-keyed-marker-trial-matrix.json'), 'utf8'));
const keys = ['A', 'B', 'C', 'D', 'E', 'FG', 'H', 'I'];
assert.equal(matrix.rows.length, 17);
assert.equal(priorMatrix.rows.length, 17);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on('pageerror', (error) => browserErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
const samples = [];
const renderedDir = join(dir, 'rendered');
await mkdir(renderedDir, { recursive: true });

function readKey(svg, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const group = svg.match(new RegExp(`(<g\\b[^>]*data-pom-key="${escaped}"[^>]*>[\\s\\S]*?<text\\b[^>]*\\bx=")(-?\\d+(?:\\.\\d+)?)(" y=")(-?\\d+(?:\\.\\d+)?)(")`));
  const circle = svg.match(new RegExp(`<g\\b[^>]*data-pom-key="${escaped}"[^>]*>[\\s\\S]*?<circle\\b[^>]*cx="([^"]+)"[^>]*cy="([^"]+)"[^>]*r="([^"]+)"`));
  assert.ok(group && circle, `missing keyed ${key}`);
  return { x: Number(group[2]), y: Number(group[4]), cx: Number(circle[1]), cy: Number(circle[2]), r: Number(circle[3]) };
}

for (const row of matrix.rows) {
  const prior = priorMatrix.rows.find((candidate) => candidate.caseId === row.caseId);
  assert.ok(prior, `missing S388 option ${row.caseId}`);
  assert.deepEqual(row.options, prior.options, `${row.caseId}: option values changed`);
  const filename = `${row.caseId}-collar-point.svg`;
  const svg = await readFile(join(dir, '../S390-polo-centerback-glyph-candidates/rendered', filename), 'utf8');
  const oldSvg = await readFile(join(priorDir, 'rendered', filename), 'utf8');
  assert.equal(row.revisionId, `live-draft:polo:S390:${row.caseId}`);
  assert.ok(svg.includes(`data-revision-id="${row.revisionId}"`));
  assert.deepEqual(row.keyedRenderIssues, [], `${row.caseId}: renderer issues`);
  assert.equal((svg.match(/data-schedule-for=/gu) ?? []).length, 11, `${row.caseId}: schedule count`);
  let restored = svg;
  for (const key of keys) {
    const before = readKey(oldSvg, key), after = readKey(svg, key);
    const dx = key === 'E' ? -0.38 : key === 'I' ? 0.34 : 0;
    const dy = key === 'E' ? -0.34 : key === 'I' ? -0.32 : 0;
    assert.ok(Math.abs(after.x - before.x - dx) <= 0.00011, `${row.caseId}/${key}: unexpected x`);
    assert.ok(Math.abs(after.y - before.y - dy) <= 0.00011, `${row.caseId}/${key}: unexpected y`);
    assert.deepEqual([after.cx, after.cy, after.r], [before.cx, before.cy, before.r], `${row.caseId}/${key}: ring changed`);
    const coordinatePattern = new RegExp(`(<g\\b[^>]*data-pom-key="${key}"[^>]*>[\\s\\S]*?<text\\b[^>]*\\bx=")-?\\d+(?:\\.\\d+)?(" y=")-?\\d+(?:\\.\\d+)?(")`);
    restored = restored.replace(coordinatePattern, `$1${before.x}$2${before.y}$3`);
  }
  assert.equal(restored.replaceAll('S390', 'S388'), oldSvg, `${row.caseId}: non-glyph SVG changes`);

  await page.setContent(svg, { waitUntil: 'load' });
  const geometry = await page.evaluate((expectedKeys) => {
    const doc = document;
    const root = doc.querySelector('svg');
    const paper = doc.querySelector('rect[data-technical-flat-paper]');
    const pb = paper.getBBox();
    const frame = { minX: pb.x, minY: pb.y, maxX: pb.x + pb.width, maxY: pb.y + pb.height };
    const gapBox = (a, b) => Math.hypot(Math.max(0, a.minX - b.maxX, b.minX - a.maxX), Math.max(0, a.minY - b.maxY, b.minY - a.maxY));
    const textNodes = [...doc.querySelectorAll('text[data-label-for]')].map((node) => {
      const b = node.getBBox();
      return { id: node.getAttribute('data-label-for'), sourceId: node.getAttribute('data-source-id'),
        revisionId: node.getAttribute('data-revision-id'), box: { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height } };
    });
    const pathNodes = [...doc.querySelectorAll('path[data-entity-id]')].filter((node) =>
      (node.getAttribute('data-source-id') ?? '').startsWith('pattern:polo:') && !node.hasAttribute('data-colorway-fill-for'));
    const sampledPaths = pathNodes.map((path) => {
      const length = path.getTotalLength();
      const steps = Math.max(1, Math.ceil(length / 0.025));
      const points = [];
      for (let index = 0; index <= steps; index++) {
        const point = path.getPointAtLength(length * index / steps);
        points.push({ x: point.x, y: point.y });
      }
      return { id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'),
        stroke: Number.parseFloat(path.getAttribute('stroke-width') ?? '0') / 2, points };
    });
    const sourceMarks = [...doc.querySelectorAll('[data-mark-kind]')].map((node) => {
      const b = node.getBBox();
      return { id: node.getAttribute('data-entity-id'), sourceId: node.getAttribute('data-source-id') ?? node.closest('[data-source-id]')?.getAttribute('data-source-id'),
        box: { minX: b.x, minY: b.y, maxX: b.x + b.width, maxY: b.y + b.height } };
    });
    const keyedGroups = [...doc.querySelectorAll('g[data-pom-key]')];
    const stations = expectedKeys.map((key) => {
      const group = keyedGroups.find((candidate) => candidate.getAttribute('data-pom-key') === key);
      if (!group) throw new Error(`missing ${key} station`);
      const text = group.querySelector('text'), circle = group.querySelector('circle');
      const tb = text.getBBox(), stroke = Number.parseFloat(text.getAttribute('stroke-width') ?? '0') / 2;
      const glyph = { minX: tb.x - stroke, minY: tb.y - stroke, maxX: tb.x + tb.width + stroke, maxY: tb.y + tb.height + stroke };
      const cx = Number(circle.getAttribute('cx')), cy = Number(circle.getAttribute('cy')), radius = Number(circle.getAttribute('r'));
      const ringStroke = Number.parseFloat(circle.getAttribute('stroke-width') ?? '0') / 2;
      const ring = { minX: cx - radius - ringStroke, minY: cy - radius - ringStroke, maxX: cx + radius + ringStroke, maxY: cy + radius + ringStroke };
      const corners = [{ x: glyph.minX, y: glyph.minY }, { x: glyph.minX, y: glyph.maxY },
        { x: glyph.maxX, y: glyph.minY }, { x: glyph.maxX, y: glyph.maxY }];
      const maxCornerRadius = Math.max(...corners.map((point) => Math.hypot(point.x - cx, point.y - cy)));
      const dxToBox = Math.max(0, glyph.minX - cx, cx - glyph.maxX), dyToBox = Math.max(0, glyph.minY - cy, cy - glyph.maxY);
      const minBoxRadius = Math.hypot(dxToBox, dyToBox);
      const glyphRingRelationship = maxCornerRadius <= radius - ringStroke
        ? { kind: 'glyph-inside-ring', boundaryClearanceCm: radius - ringStroke - maxCornerRadius }
        : minBoxRadius >= radius + ringStroke
          ? { kind: 'glyph-outside-ring', boundaryClearanceCm: minBoxRadius - radius - ringStroke }
          : { kind: 'glyph-box-touches-ring-stroke', boundaryClearanceCm: 0 };
      const targetIds = (group.getAttribute('data-callout-target') ?? '').split('|');
      const sourceEntityIds = (group.getAttribute('data-callout-source-entities') ?? group.getAttribute('data-callout-source-entity') ?? '').split('|');
      const nearest = (items, distanceKey) => items.map((item) => ({ ...item, clearanceCm: distanceKey(item) })).sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? null;
      const textGap = (item) => gapBox(glyph, item.box);
      const pathGap = (path) => {
        let best = Infinity;
        for (const point of path.points) {
          const dx = Math.max(0, glyph.minX - point.x, point.x - glyph.maxX);
          const dy = Math.max(0, glyph.minY - point.y, point.y - glyph.maxY);
          best = Math.min(best, Math.hypot(dx, dy) - path.stroke);
        }
        return best;
      };
      const unrelatedPaths = sampledPaths.filter((path) => !targetIds.includes(path.id));
      const peers = keyedGroups.filter((candidate) => candidate !== group).map((candidate) => {
        const otherText = candidate.querySelector('text'), otherCircle = candidate.querySelector('circle');
        const b = otherText.getBBox(), s = Number.parseFloat(otherText.getAttribute('stroke-width') ?? '0') / 2;
        const otherGlyph = { minX: b.x - s, minY: b.y - s, maxX: b.x + b.width + s, maxY: b.y + b.height + s };
        const x = Number(otherCircle.getAttribute('cx')), y = Number(otherCircle.getAttribute('cy')), r = Number(otherCircle.getAttribute('r')) + Number.parseFloat(otherCircle.getAttribute('stroke-width') ?? '0') / 2;
        const otherRing = { minX: x - r, minY: y - r, maxX: x + r, maxY: y + r };
        return { key: candidate.getAttribute('data-pom-key'), glyphClearanceCm: gapBox(glyph, otherGlyph), ringClearanceCm: gapBox(glyph, otherRing) };
      }).sort((a, b) => a.glyphClearanceCm - b.glyphClearanceCm);
      const markContacts = sourceMarks.filter((mark) => !targetIds.includes(mark.id) && gapBox(glyph, mark.box) <= 0)
        .map((mark) => ({ id: mark.id, sourceId: mark.sourceId, clearanceCm: gapBox(glyph, mark.box) }));
      const pathContacts = unrelatedPaths.filter((path) => pathGap(path) <= 0)
        .map((path) => ({ id: path.id, sourceId: path.sourceId, clearanceCm: pathGap(path) }));
      const frameClearanceCm = Math.min(glyph.minX - frame.minX, glyph.minY - frame.minY, frame.maxX - glyph.maxX, frame.maxY - glyph.maxY);
      return { key, x: Number(text.getAttribute('x')), y: Number(text.getAttribute('y')), sourceIds: group.getAttribute('data-source-id'), targetIds, sourceEntityIds,
        revisionId: group.getAttribute('data-revision-id'), ringCenterCm: [cx, cy], ringRadiusCm: radius,
        glyphRingRelationship, nearestSourceText: nearest(textNodes, textGap),
        nearestUnrelatedPath: nearest(unrelatedPaths.map((path) => ({ id: path.id, sourceId: path.sourceId, path })), (item) => pathGap(item.path)),
        nearestIndependentMark: nearest(sourceMarks.filter((mark) => !targetIds.includes(mark.id)), (mark) => gapBox(glyph, mark.box)),
        nearestPeer: peers[0] ?? null, glyphToFrameClearanceCm: frameClearanceCm, unrelatedPathContacts: pathContacts, independentMarkContacts: markContacts };
    });
    return { revisionId: root.getAttribute('data-revision-id'), stations,
      sourcePathCount: pathNodes.length, sourceMarkCount: sourceMarks.length,
      schedule: [...doc.querySelectorAll('[data-layer-group="POM_SCHEDULE"] [data-schedule-for]')].map((item) => ({ text: item.textContent, sourceId: item.getAttribute('data-source-id'), targetId: item.getAttribute('data-callout-target'), revisionId: item.getAttribute('data-revision-id') })) };
  }, keys);
  assert.equal(geometry.revisionId, row.revisionId);
  assert.equal(geometry.stations.length, 8);
  assert.equal(geometry.schedule.length, 11);
  assert.ok(geometry.schedule.every((entry) => entry.revisionId === row.revisionId));
  if (row.caseId === 'polo-default') {
    await page.screenshot({ path: join(renderedDir, 'polo-default-S391-keyed-whole.png'), fullPage: true });
    for (const station of geometry.stations) {
      const size = 5;
      const view = svg.replace(/viewBox="[^"]+"/u, `viewBox="${station.ringCenterCm[0] - size / 2} ${station.ringCenterCm[1] - size / 2} ${size} ${size}"`);
      await page.setContent(view, { waitUntil: 'load' });
      await page.screenshot({ path: join(renderedDir, `polo-default-${station.key}-S391-keyed-detail.png`), fullPage: true });
    }
  }
  if (row.caseId === 'polo-standFrontRise-min') {
    const station = geometry.stations.find((candidate) => candidate.key === 'I');
    const size = 5;
    const view = svg.replace(/viewBox="[^"]+"/u, `viewBox="${station.ringCenterCm[0] - size / 2} ${station.ringCenterCm[1] - size / 2} ${size} ${size}"`);
    await page.setContent(view, { waitUntil: 'load' });
    await page.screenshot({ path: join(renderedDir, 'polo-standFrontRise-min-I-S391-keyed-detail.png'), fullPage: true });
  }
  samples.push({ caseId: row.caseId, options: row.options, revisionId: row.revisionId, keyedRendererIssues: row.keyedRenderIssues,
    pairedBackUnchanged: true, colorwayEmitted: true, ...geometry });
}
assert.deepEqual(browserErrors, []);
const potentialOverlays = samples.flatMap((sample) => sample.stations.flatMap((station) => [
  ...station.unrelatedPathContacts.map((contact) => ({ caseId: sample.caseId, key: station.key, kind: 'unrelated-path', ...contact })),
  ...station.independentMarkContacts.map((contact) => ({ caseId: sample.caseId, key: station.key, kind: 'independent-mark', ...contact })),
]));
// Persist nearest-path identity and clearance, not every sampled point on that
// path. The browser samples remain an in-memory measurement aid; duplicating
// thousands of coordinates into all 136 station records inflated this matrix
// without adding review evidence.
const compactSamples = samples.map((sample) => ({ ...sample, stations: sample.stations.map((station) => ({ ...station,
  nearestUnrelatedPath: station.nearestUnrelatedPath ? { id: station.nearestUnrelatedPath.id,
    sourceId: station.nearestUnrelatedPath.sourceId, clearanceCm: station.nearestUnrelatedPath.clearanceCm } : null })) }));
await writeFile(join(dir, 'polo-keyed-marker-current-state-matrix.json'), `${JSON.stringify({ source: 'all 17 actual S390 production-renderer SVGs; exact S388 comparison with only approved S390 E/I coordinates and revision normalized', configurations: samples.length,
  keys, browserErrors, scheduleRowsPerConfiguration: 11, sourcePathAndMarkGeometryUnchanged: true, pairedBackUnchanged: true,
  measurementCaution: 'Path and independent-mark overlaps are conservative key-glyph bounding-box contacts, not vector glyph intersections. Consult the actual Chromium detail renders and exact S384 source/stitch incidence before classifying any potential overlay as a crossing or construction join.',
  offsetsOnly: { E: [-0.38, -0.34], I: [0.34, -0.32], allOtherKeys: [0, 0] },
  summary: { measuredStations: samples.reduce((sum, sample) => sum + sample.stations.length, 0), potentialPathOverlays: potentialOverlays.filter((item) => item.kind === 'unrelated-path').length,
    potentialIndependentMarkOverlays: potentialOverlays.filter((item) => item.kind === 'independent-mark').length, potentialOverlays }, samples: compactSamples }, null, 2)}\n`);
await browser.close();
console.log(`diagnosed ${samples.length} options / ${samples.reduce((sum, sample) => sum + sample.stations.length, 0)} keyed stations; browser errors ${browserErrors.length}; conservative bounding-box overlays ${potentialOverlays.length}`);
