import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const inputDir = new URL('../S425-polo-h-segmented-locator-implementation/rendered/', import.meta.url);
const outputDir = new URL('./rendered-full/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('../S425-polo-h-segmented-locator-implementation/S425-rendered-output-matrix.json', import.meta.url), 'utf8'));
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const rows = [];
try {
  for (const option of manifest.rows) {
    const svg = await readFile(new URL(option.output, inputDir), 'utf8');
    const view = await page.evaluate(async (input) => {
      document.body.innerHTML = input.replace('</svg>', '</svg>');
      document.body.style.cssText = 'margin:0;padding:0;background:white';
      const root = document.querySelector('svg');
      root.style.cssText = 'display:block;width:100vw;height:auto;max-height:none';
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const sampleShape = (shape) => {
        const stroke = Number.parseFloat(getComputedStyle(shape).strokeWidth) || 0.035;
        const points = [];
        if (shape instanceof SVGPathElement) {
          const length = shape.getTotalLength();
          const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let i = 0; i <= steps; i += 1) points.push(shape.getPointAtLength(length * i / steps));
        } else if (shape instanceof SVGLineElement) {
          const x1 = Number(shape.getAttribute('x1')); const y1 = Number(shape.getAttribute('y1'));
          const x2 = Number(shape.getAttribute('x2')); const y2 = Number(shape.getAttribute('y2'));
          const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
          for (let i = 0; i <= steps; i += 1) points.push({ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps });
        } else if (shape instanceof SVGCircleElement) {
          const cx = Number(shape.getAttribute('cx')); const cy = Number(shape.getAttribute('cy'));
          const radius = Number(shape.getAttribute('r')); const steps = Math.max(48, Math.ceil(2 * Math.PI * radius / 0.01));
          for (let i = 0; i < steps; i += 1) { const angle = 2 * Math.PI * i / steps; points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) }); }
        } else if (shape instanceof SVGRectElement) {
          const x = Number(shape.getAttribute('x')); const y = Number(shape.getAttribute('y'));
          const w = Number(shape.getAttribute('width')); const h = Number(shape.getAttribute('height'));
          for (const [x1, y1, x2, y2] of [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]]) {
            const length = Math.hypot(x2 - x1, y2 - y1); const steps = Math.max(1, Math.ceil(length / 0.01));
            for (let i = 0; i <= steps; i += 1) points.push({ x: x1 + (x2 - x1) * i / steps, y: y1 + (y2 - y1) * i / steps });
          }
        }
        return { stroke, points };
      };
      const gapToBox = (point, box) => {
        const dx = Math.max(box.x - point.x, 0, point.x - (box.x + box.width));
        const dy = Math.max(box.y - point.y, 0, point.y - (box.y + box.height));
        return Math.hypot(dx, dy);
      };
      const sourcePaths = [...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]')]
        .map((shape) => ({ id: shape.getAttribute('data-entity-id'), ...sampleShape(shape) }));
      const sourceMarks = [...root.querySelectorAll('g[data-entity-id^="flat:polo:FRONT_FLAT:mark:"]')]
        .flatMap((group) => [...group.querySelectorAll('path,line,circle,rect')]
          .map((shape) => ({ id: group.getAttribute('data-entity-id'), ...sampleShape(shape) })));
      const markers = [...root.querySelectorAll('g[data-pom-key]')].map((group) => {
        const glyph = group.querySelector('text'); const box = glyph.getBBox();
        const nearest = (shapes) => shapes.map((shape) => ({ id: shape.id,
          clearanceCm: Math.min(...shape.points.map((point) => gapToBox(point, box))) - shape.stroke / 2 }))
          .sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? null;
        return { key: group.getAttribute('data-pom-key'), sourceIds: group.getAttribute('data-source-id')?.split('|') ?? [],
          targets: group.getAttribute('data-callout-target')?.split('|') ?? [], glyph: { x: box.x, y: box.y, width: box.width, height: box.height },
          nearestComponentPath: nearest(sourcePaths), nearestSourceMark: nearest(sourceMarks),
          arcCount: group.getAttribute('data-marker-arc-count') ? Number(group.getAttribute('data-marker-arc-count')) : null,
          retainedCoverage: group.getAttribute('data-marker-retained-coverage') ? Number(group.getAttribute('data-marker-retained-coverage')) : null };
      });
      const textPairs = [];
      for (let a = 0; a < markers.length; a += 1) for (let b = a + 1; b < markers.length; b += 1) {
        const left = markers[a].glyph; const right = markers[b].glyph;
        const dx = Math.max(left.x - (right.x + right.width), right.x - (left.x + left.width), 0);
        const dy = Math.max(left.y - (right.y + right.height), right.y - (left.y + left.height), 0);
        const gap = Math.hypot(dx, dy);
        if (gap < 0.02) textPairs.push({ leftKey: markers[a].key, rightKey: markers[b].key, gapCm: gap });
      }
      const schedule = [...root.querySelectorAll('[data-schedule-for]')].map((row) => ({
        id: row.getAttribute('data-schedule-for'), key: row.getAttribute('data-pom-key'),
        sourceId: row.getAttribute('data-source-id'), targetId: row.getAttribute('data-callout-target'),
        text: row.textContent, bounds: (() => { const b = row.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; })(),
      }));
      const screenshot = await new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const width = 1440; const height = Math.min(1800, Math.ceil(root.getBoundingClientRect().height));
        canvas.width = width; canvas.height = height;
        resolve({ width, height });
      });
      return { viewId: root.getAttribute('data-view-id'), revisionId: root.getAttribute('data-revision-id'),
        dimensions: screenshot, markers, markerTextOverlaps: textPairs, schedule };
    }, svg);
    if (view.revisionId !== option.revisionId) throw new Error(`Revision mismatch for ${option.caseId}`);
    const png = await page.screenshot({ fullPage: true });
    await writeFile(new URL(`${option.caseId}-full.png`, outputDir), png);
    rows.push({ caseId: option.caseId, revisionId: view.revisionId, options: option.options,
      viewId: view.viewId, markers: view.markers, markerTextOverlaps: view.markerTextOverlaps,
      scheduleRows: view.schedule.length, schedule: view.schedule, fullImage: `${option.caseId}-full.png` });
  }
} finally { await browser.close(); }
const failures = rows.flatMap((row) => row.markers.flatMap((marker) => [
  ...(marker.nearestComponentPath?.clearanceCm < 0 ? [{ caseId: row.caseId, key: marker.key, kind: 'component-path', ...marker.nearestComponentPath }] : []),
  ...(marker.nearestSourceMark?.clearanceCm < 0 ? [{ caseId: row.caseId, key: marker.key, kind: 'source-mark', ...marker.nearestSourceMark }] : []),
  ...row.markerTextOverlaps.map((overlap) => ({ caseId: row.caseId, kind: 'glyph-overlap', ...overlap })),
]));
const matrix = { source: 'S425 current-renderer exact S399 revision SVGs', options: rows.length, facesStillHeld: manifest.facesStillHeld,
  browserErrors: errors, collisionRows: failures.length, failures, rows };
await writeFile(new URL('./S426-polo-label-collision-matrix.json', import.meta.url), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ options: rows.length, collisionRows: failures.length, browserErrors: errors.length,
  worstComponentClearance: Math.min(...rows.flatMap((row) => row.markers.map((marker) => marker.nearestComponentPath?.clearanceCm ?? Infinity))),
  worstSourceMarkClearance: Math.min(...rows.flatMap((row) => row.markers.map((marker) => marker.nearestSourceMark?.clearanceCm ?? Infinity))) }));
