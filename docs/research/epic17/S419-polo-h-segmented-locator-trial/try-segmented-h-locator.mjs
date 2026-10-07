import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dir = new URL('./', import.meta.url);
const sourceDir = new URL('../S399-polo-fg-glyph-offset/rendered/', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('../S399-polo-fg-glyph-offset/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8'));
const files = await readdir(sourceDir);
const n = 720;
const radiusCm = 0.22;
const paddingCm = 0.045;
const results = [];
const renderedCases = [];
const errors = [];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

function pathForArc(cx, cy, radius, start, end) {
  const x1 = cx + Math.cos(start) * radius, y1 = cy + Math.sin(start) * radius;
  const x2 = cx + Math.cos(end) * radius, y2 = cy + Math.sin(end) * radius;
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x1.toFixed(6)} ${y1.toFixed(6)} A ${radius} ${radius} 0 ${large} 1 ${x2.toFixed(6)} ${y2.toFixed(6)}`;
}

try {
  for (const row of matrix.rows) {
    const name = `${row.caseId}-collar-point.svg`;
    assert.ok(files.includes(name), `missing exact saved S399 SVG ${name}`);
    const svg = await readFile(new URL(name, sourceDir), 'utf8');
    assert.ok(svg.includes(`data-revision-id="live-draft:polo:S399:${row.caseId}"`), `${row.caseId}: source revision mismatch`);
    await page.setContent(svg, { waitUntil: 'load' });
    const measured = await page.evaluate(({ n, radiusCm, paddingCm }) => {
      const root = document.querySelector('svg');
      const marker = root?.querySelector('[data-entity-id="H:key-marker"]');
      const ring = marker?.querySelector('circle');
      if (!root || !marker || !ring) throw new Error('source-centered H ring missing');
      const cx = Number(ring.getAttribute('cx')), cy = Number(ring.getAttribute('cy'));
      const sourceRadius = Number(ring.getAttribute('r'));
      if (Math.abs(sourceRadius - radiusCm) > 1e-8) throw new Error(`unexpected source radius ${sourceRadius}`);
      const toScreen = (x, y) => new DOMPoint(x, y).matrixTransform(ring.getScreenCTM());
      const obstacles = [
        ...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]'),
        ...[...root.querySelectorAll('[data-entity-id*="mark:"]')]
          .filter((element) => element.matches('g') && !element.closest('[data-entity-id="H:key-marker"]'))
          .flatMap((group) => [...group.querySelectorAll('circle,path,line')]),
      ];
      const blockedBy = Array.from({ length: n }, () => new Set());
      const points = Array.from({ length: n }, (_, i) => {
        const a = 2 * Math.PI * i / n;
        return toScreen(cx + Math.cos(a) * radiusCm, cy + Math.sin(a) * radiusCm);
      });
      for (const obstacle of obstacles) {
        if (typeof obstacle.isPointInStroke !== 'function') continue;
        const inverse = obstacle.getScreenCTM().inverse();
        const id = obstacle.getAttribute('data-entity-id')
          ?? obstacle.closest('[data-entity-id]')?.getAttribute('data-entity-id')
          ?? 'unnamed-source-mark';
        for (let i = 0; i < n; i += 1) {
          const local = points[i].matrixTransform(inverse);
          if (obstacle.isPointInStroke(local)) blockedBy[i].add(id);
        }
      }
      const rawBlocked = blockedBy.map((set) => set.size > 0);
      const pad = Math.ceil(paddingCm / (2 * Math.PI * radiusCm / n));
      const blocked = rawBlocked.slice();
      for (let i = 0; i < n; i += 1) if (rawBlocked[i]) {
        for (let d = -pad; d <= pad; d += 1) blocked[(i + d + n) % n] = true;
      }
      const keep = blocked.map((value) => !value);
      let start = keep.findIndex((value, i) => value && !keep[(i + n - 1) % n]);
      const arcs = [];
      if (start >= 0) {
        let i = start, visited = 0;
        while (visited < n) {
          if (!keep[i]) { i = (i + 1) % n; visited += 1; continue; }
          const first = i; let count = 0;
          while (keep[i] && count < n) { count += 1; i = (i + 1) % n; visited += 1; }
          arcs.push({ start: first * 2 * Math.PI / n, end: (first + count) * 2 * Math.PI / n, samples: count,
            lengthCm: Number((count * 2 * Math.PI * radiusCm / n).toFixed(5)) });
        }
      }
      const obstacleRows = [...new Set(blockedBy.flatMap((set) => [...set]))].sort();
      const minimumArcCm = 0.04;
      const retainedArcs = arcs.filter((arc) => arc.lengthCm >= minimumArcCm);
      return { cx, cy, sourceRadius, rawBlockedSamples: rawBlocked.filter(Boolean).length,
        bufferedGapSamples: blocked.filter(Boolean).length, paddedSamplesEachSide: pad, obstacleIds: obstacleRows,
        arcs: retainedArcs, discardedMicroArcCount: arcs.length - retainedArcs.length,
        retainedCoverage: Number((retainedArcs.reduce((sum, arc) => sum + arc.samples, 0) / n).toFixed(5)),
        minArcLengthCm: retainedArcs.length ? Math.min(...retainedArcs.map((arc) => arc.lengthCm)) : 0,
        markerOrder: [...marker.parentElement.children].indexOf(marker),
      };
    }, { n, radiusCm, paddingCm });
    const d = measured.arcs.map((arc) => pathForArc(measured.cx, measured.cy, radiusCm, arc.start, arc.end)).join(' ');
    const diagnostic = await page.evaluate(({ d }) => {
      const root = document.querySelector('svg');
      const marker = root.querySelector('[data-entity-id="H:key-marker"]');
      const circle = marker.querySelector('circle');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', circle.getAttribute('stroke'));
      path.setAttribute('stroke-width', circle.getAttribute('stroke-width'));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('data-diagnostic-segmentation', 'S419');
      circle.replaceWith(path);
      root.setAttribute('viewBox', '2 -4 10 8');
      root.setAttribute('width', '1200'); root.setAttribute('height', '900');
      return root.outerHTML;
    }, { d });
    const outputName = `${row.caseId}-segmented-H.svg`;
    await writeFile(new URL(outputName, dir), diagnostic, 'utf8');
    await page.setContent(diagnostic, { waitUntil: 'load' });
    const postPaint = await page.evaluate(() => {
      const root = document.querySelector('svg');
      const markerPath = root.querySelector('[data-diagnostic-segmentation="S419"]');
      const obstacles = [
        ...root.querySelectorAll('path[data-entity-id^="flat:polo:FRONT_FLAT:component:"]'),
        ...[...root.querySelectorAll('[data-entity-id*="mark:"]')]
          .filter((element) => element.matches('g') && !element.closest('[data-entity-id="H:key-marker"]'))
          .flatMap((group) => [...group.querySelectorAll('circle,path,line')]),
      ];
      const length = markerPath.getTotalLength();
      const count = Math.max(2, Math.ceil(length / 0.002));
      let collidingSamples = 0;
      const contacts = new Set();
      for (let i = 0; i <= count; i += 1) {
        const point = markerPath.getPointAtLength(length * i / count);
        const screen = new DOMPoint(point.x, point.y).matrixTransform(markerPath.getScreenCTM());
        for (const obstacle of obstacles) {
          const inverse = obstacle.getScreenCTM().inverse();
          if (obstacle.isPointInStroke(screen.matrixTransform(inverse))) {
            collidingSamples += 1;
            contacts.add(obstacle.getAttribute('data-entity-id')
              ?? obstacle.closest('[data-entity-id]')?.getAttribute('data-entity-id')
              ?? 'unnamed-source-mark');
          }
        }
      }
      return { sampledPoints: count + 1, collidingSamples, contacts: [...contacts].sort() };
    });
    results.push({ caseId: row.caseId, revisionId: row.revisionId, options: row.options,
      radiusCm, paddingCm, ...measured, postPaint, output: outputName });
  }


  const renderRows = [results[0], ...results.slice(1).sort((a, b) =>
    a.retainedCoverage - b.retainedCoverage || a.minArcLengthCm - b.minArcLengthCm).slice(0, 1)];
  renderedCases.push(...renderRows.map((row) => row.caseId));
  await mkdir(new URL('./rendered/', dir), { recursive: true });
  for (const row of renderRows) {
    const baseline = await readFile(new URL(`${row.caseId}-collar-point.svg`, sourceDir), 'utf8');
    await page.setContent(baseline, { waitUntil: 'load' });
    await page.locator('svg').evaluate((element) => {
      element.setAttribute('viewBox', '2 -4 10 8');
      element.setAttribute('width', '1200'); element.setAttribute('height', '900');
    });
    await page.screenshot({ path: fileURLToPath(new URL(`${row.caseId}-baseline-H.png`, new URL('./rendered/', dir))) });
    const svg = await readFile(new URL(row.output, dir), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    await page.screenshot({ path: fileURLToPath(new URL(`${row.caseId}-segmented-H.png`, new URL('./rendered/', dir))) });
  }
} finally { await browser.close(); }
assert.deepEqual(errors, []);
assert.equal(results.length, 17);
const output = { source: 'exact saved S399 production FRONT_FLAT SVGs; diagnostic-only arc segmentation',
  revisionIds: results.map((row) => row.revisionId), options: results.length, radiusCm, paddingCm,
  samplesPerRing: n, browserErrors: errors, summary: {
    minRetainedCoverage: Math.min(...results.map((row) => row.retainedCoverage)),
    maxRetainedCoverage: Math.max(...results.map((row) => row.retainedCoverage)),
    minArcCount: Math.min(...results.map((row) => row.arcs.length)), maxArcCount: Math.max(...results.map((row) => row.arcs.length)),
    minArcLengthCm: Math.min(...results.map((row) => row.minArcLengthCm)),
    optionsWithNoArcs: results.filter((row) => row.arcs.length === 0).length,
    optionsUnderHalfCoverage: results.filter((row) => row.retainedCoverage < 0.5).length,
  }, rows: results };
await writeFile(new URL('segmented-h-locator-matrix.json', dir), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ...output.summary, rendered: renderedCases, browserErrors: errors }, null, 2));

