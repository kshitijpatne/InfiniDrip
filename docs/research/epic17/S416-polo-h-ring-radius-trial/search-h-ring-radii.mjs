import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = fileURLToPath(new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url));
const s399 = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const sourceFiles = await readdir(sourceDir);
const radii = [0.10, 0.12, 0.14, 0.16, 0.18];
const rows = [];
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

try {
  for (const sourceRow of s399.rows) {
    const file = sourceFiles.find((name) => name === `${sourceRow.caseId}-collar-point.svg`);
    assert.ok(file, `missing exact S399 output for ${sourceRow.caseId}`);
    const svg = await readFile(join(sourceDir, file), 'utf8');
    assert.equal(sourceRow.revisionId, `live-draft:polo:S399:${sourceRow.caseId}`);
    await page.setContent(svg, { waitUntil: 'load' });
    const measured = await page.evaluate((candidateRadii) => {
      const root = document.querySelector('svg');
      const marker = root.querySelector('[data-entity-id="H:key-marker"]');
      const ring = marker?.querySelector('circle');
      const glyph = marker?.querySelector('text');
      if (!root || !marker || !ring || !glyph) throw new Error('source-centered H ring or glyph missing');
      const toRoot = (element, x, y) => {
        const screen = new DOMPoint(x, y).matrixTransform(element.getScreenCTM());
        const value = screen.matrixTransform(root.getScreenCTM().inverse());
        return { x: value.x, y: value.y };
      };
      const scale = (element) => {
        const origin = toRoot(element, 0, 0);
        const x = toRoot(element, 1, 0);
        const y = toRoot(element, 0, 1);
        return (Math.hypot(x.x - origin.x, x.y - origin.y) + Math.hypot(y.x - origin.x, y.y - origin.y)) / 2;
      };
      const componentPaths = [...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')].map((path) => {
        const length = path.getTotalLength();
        const count = Math.max(2, Math.ceil(length / 0.025));
        const points = [];
        for (let index = 0; index <= count; index += 1) {
          const sample = path.getPointAtLength(length * index / count);
          points.push(toRoot(path, sample.x, sample.y));
        }
        return { id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id'),
          width: Number(path.getAttribute('stroke-width') ?? 0) * scale(path), points };
      });
      const marks = [...root.querySelectorAll('[data-entity-id*="mark:"]')]
        .filter((element) => element.matches('g') && !element.closest('[data-entity-id="H:key-marker"]'))
        .flatMap((group) => [...group.querySelectorAll('circle,path,line')].map((shape) => {
          const id = group.getAttribute('data-entity-id');
          const width = Number(shape.getAttribute('stroke-width') ?? 0) * scale(shape);
          if (shape.matches('circle')) {
            const center = toRoot(shape, Number(shape.getAttribute('cx')), Number(shape.getAttribute('cy')));
            return { id, kind: 'circle', center, radius: Number(shape.getAttribute('r')) * scale(shape), width };
          }
          if (shape.matches('path')) {
            const length = shape.getTotalLength(); const count = Math.max(2, Math.ceil(length / 0.025)); const points = [];
            for (let index = 0; index <= count; index += 1) {
              const sample = shape.getPointAtLength(length * index / count);
              points.push(toRoot(shape, sample.x, sample.y));
            }
            return { id, kind: 'path', points, width };
          }
          const rect = shape.getBoundingClientRect();
          const corners = [toRoot(shape, 0, 0), toRoot(shape, rect.width / scale(shape), 0),
            toRoot(shape, rect.width / scale(shape), rect.height / scale(shape)), toRoot(shape, 0, rect.height / scale(shape))];
          return { id, kind: 'line', points: corners, width };
        }));
      const center = toRoot(ring, Number(ring.getAttribute('cx')), Number(ring.getAttribute('cy')));
      const ringScale = scale(ring);
      const originalRadius = Number(ring.getAttribute('r')) * ringScale;
      const ringWidth = Number(ring.getAttribute('stroke-width') ?? 0) * ringScale;
      const textRect = glyph.getBoundingClientRect();
      const textCorners = [
        toRoot(glyph, 0, 0), toRoot(glyph, textRect.width / scale(glyph), 0),
        toRoot(glyph, textRect.width / scale(glyph), textRect.height / scale(glyph)), toRoot(glyph, 0, textRect.height / scale(glyph)),
      ];
      const distances = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      const ringSamples = (radius, count = 180) => Array.from({ length: count }, (_, index) => {
        const angle = index * Math.PI * 2 / count;
        return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
      });
      const pointToSegment = (point, start, end) => {
        const dx = end.x - start.x; const dy = end.y - start.y; const length2 = dx * dx + dy * dy;
        const t = length2 ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length2)) : 0;
        return distances(point, { x: start.x + t * dx, y: start.y + t * dy });
      };
      const shapeGap = (samples, shape) => {
        if (shape.kind === 'circle') return Math.min(...samples.map((point) => Math.abs(distances(point, shape.center) - shape.radius))) - shape.width / 2;
        const points = shape.points;
        let minimum = Infinity;
        for (const sample of samples) for (let index = 1; index < points.length; index += 1) {
          minimum = Math.min(minimum, pointToSegment(sample, points[index - 1], points[index]));
        }
        return minimum - shape.width / 2;
      };
      const textGap = (radius) => {
        const edges = textCorners.map((point, index) => [point, textCorners[(index + 1) % textCorners.length]]);
        const minDistance = Math.min(...edges.map(([start, end]) => pointToSegment(center, start, end)));
        const maxDistance = Math.max(...textCorners.map((point) => distances(point, center)));
        if (minDistance <= 1e-8 || (center.x >= Math.min(...textCorners.map((point) => point.x))
          && center.x <= Math.max(...textCorners.map((point) => point.x))
          && center.y >= Math.min(...textCorners.map((point) => point.y))
          && center.y <= Math.max(...textCorners.map((point) => point.y)))) return -ringWidth / 2;
        const gap = radius < minDistance ? minDistance - radius : radius > maxDistance ? radius - maxDistance : -Math.min(radius - minDistance, maxDistance - radius);
        return gap - ringWidth / 2;
      };
      return candidateRadii.map((radiusCm) => {
        const radius = radiusCm * ringScale;
        const samples = ringSamples(radius);
        const pathGaps = componentPaths.map((path) => ({ id: path.id, sourceId: path.sourceId,
          gapCm: Number((shapeGap(samples, { kind: 'path', points: path.points, width: path.width }) / ringScale).toFixed(5)) }));
        const markGaps = marks.map((mark) => ({ id: mark.id, gapCm: Number((shapeGap(samples, mark) / ringScale).toFixed(5)) }));
        const oldRingRadius = ring.getAttribute('r'); ring.setAttribute('r', String(radiusCm));
        root.setAttribute('viewBox', '2 -4 10 8'); root.setAttribute('width', '1200'); root.setAttribute('height', '900');
        const result = { radiusCm, ringToPathClearanceCm: Math.min(...pathGaps.map((item) => item.gapCm)),
          ringToMarkClearanceCm: Math.min(...markGaps.map((item) => item.gapCm)), glyphToRingClearanceCm: Number((textGap(radius) / ringScale).toFixed(5)),
          pathContacts: pathGaps.filter((item) => item.gapCm < 0.02), markContacts: markGaps.filter((item) => item.gapCm < 0.02) };
        ring.setAttribute('r', oldRingRadius);
        return result;
      });
    }, radii);
    rows.push({ caseId: sourceRow.caseId, options: sourceRow.options, revisionId: sourceRow.revisionId, candidates: measured });
  }
  const renderRows = [rows[0], ...rows.slice(1).sort((left, right) =>
    left.candidates[0].ringToMarkClearanceCm - right.candidates[0].ringToMarkClearanceCm).slice(0, 1)];
  for (const row of renderRows) {
    const file = sourceFiles.find((name) => name === `${row.caseId}-collar-point.svg`);
    const svg = await readFile(join(sourceDir, file), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    const root = page.locator('svg');
    await root.evaluate((element) => { element.setAttribute('viewBox', '2 -4 10 8'); element.setAttribute('width', '1200'); element.setAttribute('height', '900'); });
    const ring = page.locator('[data-entity-id="H:key-marker"] circle');
    for (const radiusCm of radii) {
      await ring.evaluate((element, radius) => element.setAttribute('r', String(radius)), radiusCm);
      const target = new URL(`./rendered/${row.caseId}-ring-${String(radiusCm).replace('.', '-')}.png`, import.meta.url);
      await mkdir(new URL('./rendered/', import.meta.url), { recursive: true });
      await page.screenshot({ path: fileURLToPath(target) });
    }
  }
} finally {
  await browser.close();
}

assert.deepEqual(errors, []);
assert.equal(rows.length, 17);
const summary = radii.map((radiusCm) => {
  const perCase = rows.map((row) => row.candidates.find((candidate) => candidate.radiusCm === radiusCm));
  return { radiusCm, options: perCase.length,
    optionsWithClearMarks: perCase.filter((row) => row.markContacts.length === 0).length,
    optionsWithClearPaths: perCase.filter((row) => row.pathContacts.length === 0).length,
    optionsWithSeparatedGlyph: perCase.filter((row) => row.glyphToRingClearanceCm >= 0).length,
    worstMarkClearanceCm: Math.min(...perCase.map((row) => row.ringToMarkClearanceCm)),
    worstPathClearanceCm: Math.min(...perCase.map((row) => row.ringToPathClearanceCm)),
    worstGlyphClearanceCm: Math.min(...perCase.map((row) => row.glyphToRingClearanceCm)),
  };
});
const renderedDir = new URL('./rendered/', import.meta.url);
await mkdir(renderedDir, { recursive: true });
const output = { source: 'S399 saved production SVGs; diagnostic ring-radius mutation only', configurations: rows.length,
  revisionIds: rows.map((row) => row.revisionId), candidateRadiiCm: radii, browserErrors: errors, summary, rows };
await writeFile(new URL('./h-ring-radius-matrix.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(summary, null, 2));
