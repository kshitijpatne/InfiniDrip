import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const folder = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const matrix = JSON.parse(await readFile(join(folder, '..', 'S401-woven-paired-live-output-review',
  'woven-paired-live-output-matrix.json'), 'utf8'));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
  const rows = [];
  for (const { caseId, options } of matrix.rows) {
    const svg = await readFile(join(sourceDir, `${caseId}-front_flat-current.svg`), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    const row = await page.evaluate(() => {
      const svgRoot = document.documentElement;
      const sourceId = 'pom:woven-shirt:front-button-spacing';
      const oldCallout = svgRoot.querySelector(`g[data-source-id='${sourceId}']`);
      const oldLabel = svgRoot.querySelector(`text[data-source-id='${sourceId}']`);
      const markPoint = (name) => {
        const group = svgRoot.querySelector(`g[data-entity-id='flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:${name}']`);
        const circle = group?.querySelector('circle');
        return circle ? { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) } : null;
      };
      const first = markPoint('button-1'), second = markPoint('button-2');
      const placket = svgRoot.querySelector("path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline']");
      if (!first || !second || !placket || !oldCallout || !oldLabel) return { valid: false };
      const box = placket.getBBox();
      const x = box.x + box.width + 0.6;
      const yMid = (first.y + second.y) / 2;
      const ns = 'http://www.w3.org/2000/svg';
      const layer = svgRoot.querySelector("g[data-layer-group='CALLOUT']");
      oldCallout.remove(); oldLabel.remove();
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('data-s402-diagnostic', 'source-defined-two-point-pom-dimension');
      g.setAttribute('data-source-id', sourceId);
      g.setAttribute('data-source-entity-start', 'pattern:woven-shirt:mark:buttonPlacket:button-1');
      g.setAttribute('data-source-entity-end', 'pattern:woven-shirt:mark:buttonPlacket:button-2');
      g.setAttribute('data-revision-id', 'live-draft:woven-shirt:14:14');
      const makeLine = (a, b, role) => {
        const line = document.createElementNS(ns, 'path');
        line.setAttribute('d', `M${a.x} ${a.y} L${b.x} ${b.y}`);
        line.setAttribute('fill', 'none'); line.setAttribute('stroke', '#047857');
        line.setAttribute('stroke-width', '0.025'); line.setAttribute('data-s402-dimension-part', role);
        return line;
      };
      // The exact source points define the measured interval. Extension lines
      // project them to a short view-only bracket outside the right placket.
      g.append(makeLine(first, { x, y: first.y }, 'extension-button-1'));
      g.append(makeLine(second, { x, y: second.y }, 'extension-button-2'));
      g.append(makeLine({ x, y: first.y }, { x, y: second.y }, 'measured-interval'));
      const tick = 0.16;
      for (const point of [{ x, y: first.y }, { x, y: second.y }])
        g.append(makeLine({ x: point.x - tick, y: point.y + tick }, { x: point.x + tick, y: point.y - tick }, 'dimension-tick'));
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('data-s402-dimension-label', 'true');
      text.setAttribute('data-source-id', sourceId);
      text.setAttribute('data-source-entity-start', 'pattern:woven-shirt:mark:buttonPlacket:button-1');
      text.setAttribute('data-source-entity-end', 'pattern:woven-shirt:mark:buttonPlacket:button-2');
      text.setAttribute('data-revision-id', 'live-draft:woven-shirt:14:14');
      text.setAttribute('x', String(x + 0.24)); text.setAttribute('y', String(yMid + 0.1));
      text.setAttribute('font-family', 'Arial, sans-serif'); text.setAttribute('font-size', '0.32');
      text.setAttribute('fill', '#047857'); text.textContent = 'Front button spacing: 8.0 cm (±0.2 cm)';
      g.append(text); layer.append(g);
      const labelBox = text.getBBox();
      const labelConflicts = [...svgRoot.querySelectorAll("text[data-source-layer='CALLOUT'], text[data-layer='ANNOTATION']")]
        .filter((other) => !other.closest('[data-s402-diagnostic]'))
        .filter((other) => { const b = other.getBBox(); return labelBox.x < b.x + b.width && labelBox.x + labelBox.width > b.x
          && labelBox.y < b.y + b.height && labelBox.y + labelBox.height > b.y; })
        .map((other) => other.getAttribute('data-source-id') ?? other.textContent.trim());
      const distanceToSegment = (point, a, b) => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
      };
      const lines = [
        [{ x: first.x, y: first.y }, { x, y: first.y }, 'extension-button-1'],
        [{ x: second.x, y: second.y }, { x, y: second.y }, 'extension-button-2'],
        [{ x, y: first.y }, { x, y: second.y }, 'measured-interval'],
      ];
      const unrelatedPathContacts = [];
      for (const path of svgRoot.querySelectorAll('path[data-entity-id][data-source-id^="pattern:"]')) {
        const entity = path.getAttribute('data-entity-id') ?? '';
        if (entity === 'flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline') continue;
        const length = path.getTotalLength();
        const count = Math.max(2, Math.ceil(length / 0.02));
        for (const [a, b, role] of lines) {
          let minimum = Number.POSITIVE_INFINITY;
          for (let i = 0; i <= count; i += 1) {
            const p = path.getPointAtLength(length * i / count);
            minimum = Math.min(minimum, distanceToSegment(p, a, b));
          }
          if (minimum <= 0.035) unrelatedPathContacts.push({ entityId: entity, sourceId: path.getAttribute('data-source-id'),
            dimensionPart: role, minimumCenterlineDistanceCm: minimum });
        }
      }
      return { valid: true, sourceId, targetStart: 'pattern:woven-shirt:mark:buttonPlacket:button-1',
        targetEnd: 'pattern:woven-shirt:mark:buttonPlacket:button-2', revisionId: 'live-draft:woven-shirt:14:14',
        first, second, measurementCm: Math.hypot(second.x - first.x, second.y - first.y),
        placketBounds: { x: box.x, y: box.y, width: box.width, height: box.height }, bracketX: x,
        labelBox: { x: labelBox.x, y: labelBox.y, width: labelBox.width, height: labelBox.height },
        labelConflicts, unrelatedPathContacts,
        svg: new XMLSerializer().serializeToString(svgRoot) };
    });
    assert.equal(row.valid, true, `${caseId}: source marks or target placket missing`);
    assert.ok(Math.abs(row.measurementCm - options.buttonSpacing) < 1e-9, `${caseId}: two-point measure changed`);
    rows.push({ caseId, options, ...row, svg: undefined });
    if (['woven-shirt-default', 'woven-shirt-standHeight-max', 'woven-shirt-collarLeafDepth-min', 'woven-shirt-combined-supported'].includes(caseId)) {
      const dir = join(folder, 'rendered'); await mkdir(dir, { recursive: true });
      const svgText = await page.evaluate(() => new XMLSerializer().serializeToString(document.documentElement));
      await writeFile(join(dir, `${caseId}-front-two-point-spacing-trial.svg`), svgText);
      if (caseId === 'woven-shirt-default') {
        const view = await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-6 7 19 19'); root.setAttribute('width', '1500'); root.setAttribute('height', '1500'); });
        await page.locator('svg').screenshot({ path: join(dir, `${caseId}-front-two-point-spacing-trial-detail.png`) });
      }
    }
  }
  const summary = { configurations: rows.length, exactSourcePointDistanceRows: rows.filter((r) => Math.abs(r.measurementCm - r.options.buttonSpacing) < 1e-9).length,
    labelConflicts: rows.filter((r) => r.labelConflicts.length).length,
    unrelatedPathContactRows: rows.filter((r) => r.unrelatedPathContacts.length).length,
    bracketOutsideButtonPlacketRows: rows.filter((r) => r.bracketX > r.placketBounds.x + r.placketBounds.width).length };
  const output = { summary, rows };
  await writeFile(join(folder, 'woven-front-two-point-dimension-trial.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(summary));
} finally {
  await browser.close();
}
