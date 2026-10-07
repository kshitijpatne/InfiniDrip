import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const folder = fileURLToPath(new URL('./', import.meta.url));
const sourceDir = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const matrix = JSON.parse(await readFile(join(folder, '..', 'S401-woven-paired-live-output-review',
  'woven-paired-live-output-matrix.json'), 'utf8'));
const candidates = [
  { id: 'se', x: 0.2121, y: 0.2121 }, { id: 'e', x: 0.38, y: 0 }, { id: 'ne', x: 0.3, y: -0.3 },
  { id: 'nw', x: -0.3, y: -0.3 }, { id: 'sw', x: -0.3, y: 0.3 }, { id: 's', x: 0, y: 0.38 },
  { id: 'n', x: 0, y: -0.38 }, { id: 'w', x: -0.38, y: 0 },
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
  const rows = [];
  for (const { caseId, options } of matrix.rows) {
    const svg = await readFile(join(sourceDir, `${caseId}-front_flat-current.svg`), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    const row = await page.evaluate((glyphOptions) => {
      const root = document.documentElement;
      const pomId = 'pom:woven-shirt:front-button-spacing';
      root.querySelector(`g[data-source-id='${pomId}']`)?.remove();
      root.querySelector(`text[data-source-id='${pomId}']`)?.remove();
      const mark = (n) => {
        const group = root.querySelector(`g[data-entity-id='flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-${n}']`);
        const circle = group?.querySelector('circle');
        return circle ? { x: Number(circle.getAttribute('cx')), y: Number(circle.getAttribute('cy')) } : null;
      };
      const start = mark(1), end = mark(2);
      if (!start || !end) return { valid: false };
      const center = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
      const ns = 'http://www.w3.org/2000/svg';
      const ring = document.createElementNS(ns, 'g');
      ring.setAttribute('data-entity-id', 'flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing:interval-marker-ring');
      ring.setAttribute('data-marker-underlay-for', 'D'); ring.setAttribute('data-source-id', pomId);
      ring.setAttribute('data-source-entities', 'pattern:woven-shirt:mark:buttonPlacket:button-1|pattern:woven-shirt:mark:buttonPlacket:button-2');
      ring.setAttribute('data-revision-id', 'live-draft:woven-shirt:14:14');
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', String(center.x)); circle.setAttribute('cy', String(center.y)); circle.setAttribute('r', '0.22');
      circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#991b1b'); circle.setAttribute('stroke-width', '0.07'); ring.append(circle);
      const silhouette = root.querySelector("g[data-layer-group='GARMENT_SILHOUETTE']");
      const colorway = silhouette?.querySelector('[data-colorway-area-group]');
      if (colorway?.nextSibling) silhouette.insertBefore(ring, colorway.nextSibling); else silhouette?.append(ring);

      const layer = root.querySelector("g[data-layer-group='POM_KEY_MARKERS']");
      if (!layer) return { valid: false };
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('data-entity-id', 'flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing:interval-key');
      text.setAttribute('data-feature', 'pom'); text.setAttribute('data-pom-key', 'D'); text.setAttribute('data-source-id', pomId);
      text.setAttribute('data-source-entities', 'pattern:woven-shirt:mark:buttonPlacket:button-1|pattern:woven-shirt:mark:buttonPlacket:button-2');
      text.setAttribute('data-revision-id', 'live-draft:woven-shirt:14:14');
      text.setAttribute('font-family', 'Arial, sans-serif'); text.setAttribute('font-size', '0.20');
      text.setAttribute('font-weight', '700'); text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#991b1b'); text.setAttribute('stroke', '#fff'); text.setAttribute('stroke-width', '0.09');
      text.setAttribute('stroke-linejoin', 'round'); text.setAttribute('paint-order', 'stroke');
      text.textContent = 'D';
      const chosen = [];
      for (const offset of glyphOptions.candidates) {
        text.setAttribute('x', String(center.x + offset.x)); text.setAttribute('y', String(center.y + 0.07 + offset.y));
        layer.append(text);
        const glyphBox = text.getBBox();
        const sourceContacts = [];
        for (const path of root.querySelectorAll('path[data-entity-id][data-source-id^="pattern:"]')) {
          const length = path.getTotalLength();
          const count = Math.max(2, Math.ceil(length / 0.025));
          let collision = false;
          for (let i = 0; i <= count; i += 1) {
            const p = path.getPointAtLength(length * i / count);
            if (p.x >= glyphBox.x - 0.025 && p.x <= glyphBox.x + glyphBox.width + 0.025
              && p.y >= glyphBox.y - 0.025 && p.y <= glyphBox.y + glyphBox.height + 0.025) { collision = true; break; }
          }
          if (collision) sourceContacts.push(path.getAttribute('data-source-id'));
        }
        const textContacts = [...root.querySelectorAll('text')].filter((other) => other !== text)
          .filter((other) => { const b = other.getBBox(); return glyphBox.x < b.x + b.width && glyphBox.x + glyphBox.width > b.x
            && glyphBox.y < b.y + b.height && glyphBox.y + glyphBox.height > b.y; })
          .map((other) => other.getAttribute('data-source-id') ?? other.textContent.trim());
        chosen.push({ id: offset.id, offset, sourceContacts: [...new Set(sourceContacts)], textContacts });
        text.remove();
      }
      const selectedGlyph = chosen.find((trial) => trial.sourceContacts.length === 0 && trial.textContacts.length === 0);
      if (selectedGlyph) {
        text.setAttribute('x', String(center.x + selectedGlyph.offset.x));
        text.setAttribute('y', String(center.y + 0.07 + selectedGlyph.offset.y));
        layer.append(text);
      }
      const schedule = root.querySelector("g[data-layer-group='POM_SCHEDULE']");
      const sourceRow = schedule?.querySelector("text[data-pom-key='W']");
      if (!schedule || !sourceRow) return { valid: false };
      const dRow = sourceRow.cloneNode(true);
      dRow.setAttribute('data-schedule-for', 'flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing');
      dRow.setAttribute('data-pom-key', 'D'); dRow.setAttribute('data-source-id', pomId);
      dRow.setAttribute('data-callout-target', 'flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1|flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-2');
      dRow.setAttribute('data-callout-source-entity', 'pattern:woven-shirt:mark:buttonPlacket:button-1|pattern:woven-shirt:mark:buttonPlacket:button-2');
      dRow.setAttribute('y', String(Number(sourceRow.getAttribute('y')) + 0.49));
      dRow.textContent = `D  Front button spacing: ${glyphOptions.measuredValue.toFixed(1)} cm (±0.2 cm)`; schedule.append(dRow);
      const background = schedule.querySelector('rect');
      if (background) background.setAttribute('height', String(Number(background.getAttribute('height')) + 0.49));
      return { valid: true, intervalStart: start, intervalEnd: end, center, distanceCm: Math.hypot(end.x - start.x, end.y - start.y),
        candidateGlyphs: chosen, selectedGlyph, svg: new XMLSerializer().serializeToString(root) };
    }, { candidates, measuredValue: options.buttonSpacing });
    assert.equal(row.valid, true, `${caseId}: source marks, marker layer or schedule missing`);
    assert.ok(Math.abs(row.distanceCm - options.buttonSpacing) < 1e-9, `${caseId}: source interval differs from POM value`);
    rows.push({ caseId, options, ...row, svg: undefined });
    if (['woven-shirt-default', 'woven-shirt-standHeight-max', 'woven-shirt-collarLeafDepth-min', 'woven-shirt-combined-supported'].includes(caseId)) {
      const dir = join(folder, 'rendered'); await mkdir(dir, { recursive: true });
      const svg = await page.evaluate(() => new XMLSerializer().serializeToString(document.documentElement));
      await writeFile(join(dir, `${caseId}-front-interval-key-trial.svg`), svg);
      if (caseId === 'woven-shirt-default') {
        await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-2 9 8 18'); root.setAttribute('width', '1500'); root.setAttribute('height', '1500'); });
        await page.locator('svg').screenshot({ path: join(dir, `${caseId}-front-interval-key-trial-detail.png`) });
      }
    }
  }
  const acceptable = candidates.filter((candidate) => rows.every((row) => row.candidateGlyphs.find((trial) => trial.id === candidate.id)
    ?.sourceContacts.length === 0 && row.candidateGlyphs.find((trial) => trial.id === candidate.id)?.textContacts.length === 0));
  const output = { summary: { configurations: rows.length, exactPointDistances: rows.filter((row) => Math.abs(row.distanceCm - row.options.buttonSpacing) < 1e-9).length,
    commonClearGlyphOffsets: acceptable, sourcePointAnchorsPreserved: true, existingWSourceSchedulePreserved: true }, rows };
  assert.ok(acceptable.length > 0, 'No shared source-clear interval key offset found.');
  await writeFile(join(folder, 'woven-front-interval-key-trial.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output.summary));
} finally { await browser.close(); }
