import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const root = new URL('../S386-polo-keyed-callout-trial/rendered/', import.meta.url);
const out = new URL('./rendered/', import.meta.url);
const cases = JSON.parse(await readFile(new URL('../S386-polo-keyed-callout-trial/polo-keyed-marker-trial-matrix.json', import.meta.url), 'utf8')).rows;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const rows = [];
const representative = new Set(['polo-default', 'polo-collarPointExtension-min', 'polo-collarPointExtension-max', 'polo-placketWidth-min', 'polo-placketWidth-max']);
const keys = ['D', 'E', 'FG', 'H', 'I'];
for (const item of cases) {
  const name = `polo-${item.caseId.replace(/^polo-/, '')}-collar-point.svg`;
  const svg = await readFile(new URL(name, root), 'utf8');
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'load' });
  const result = await page.evaluate(() => {
    const box = (node) => { const b = node.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height, right: b.x + b.width, bottom: b.y + b.height }; };
    const intersects = (a, b) => a.x <= b.right && a.right >= b.x && a.y <= b.bottom && a.bottom >= b.y;
    const gap = (a, b) => Math.hypot(Math.max(b.x - a.right, a.x - b.right, 0), Math.max(b.y - a.bottom, a.y - b.bottom, 0));
    const labels = [...document.querySelectorAll('text[data-label-for]')].map(node => ({
      id: node.getAttribute('data-label-for'), sourceId: node.getAttribute('data-source-id'), layer: node.getAttribute('data-source-layer'), text: node.textContent, box: box(node),
    }));
    const markers = [...document.querySelectorAll('g[data-pom-key]')].map(group => {
      const circle = group.querySelector('circle'); const glyph = group.querySelector('text');
      const c = box(circle), g = box(glyph); const ring = { x: c.x, y: c.y, right: c.right, bottom: c.bottom };
      const cx = Number(circle.getAttribute('cx')), cy = Number(circle.getAttribute('cy')), radius = Number(circle.getAttribute('r'));
      const annotationLabels = labels.filter(label => label.sourceId?.startsWith('pattern:polo:'));
      const labelMetrics = annotationLabels.map(label => {
        const dx = Math.max(label.box.x - cx, cx - label.box.right, 0), dy = Math.max(label.box.y - cy, cy - label.box.bottom, 0);
        return { id: label.id, sourceId: label.sourceId, layer: label.layer, text: label.text, box: label.box,
          glyphBoxGapCm: gap(g, label.box), ringCircleGapCm: Math.max(0, Math.hypot(dx, dy) - radius - 0.035),
          glyphOverlap: intersects(g, label.box), ringBoxOverlap: intersects(ring, label.box) };
      }).sort((a, b) => a.glyphBoxGapCm - b.glyphBoxGapCm);
      return { key: group.getAttribute('data-pom-key'), sourceIds: group.getAttribute('data-source-id').split('|'), targets: group.getAttribute('data-callout-target').split('|'), anchor: { x: cx, y: cy }, ring, glyph: g, labelContacts: labelMetrics.filter(label => label.glyphOverlap || label.ringCircleGapCm === 0).map(label => ({ ...label, ringOverlap: label.ringBoxOverlap })), ringLabelContacts: labelMetrics.filter(label => label.ringCircleGapCm === 0).map(label => ({ ...label, glyphOverlap: label.glyphOverlap })), nearestLabels: labelMetrics.slice(0, 4),
      };
    });
    return { revisionId: document.querySelector('svg')?.getAttribute('data-revision-id'), labels, markers };
  });
  if (result.revisionId !== item.revisionId) throw new Error(`${item.caseId}: revision mismatch ${result.revisionId}`);
  rows.push({ caseId: item.caseId, revisionId: result.revisionId, options: item.options, markers: result.markers.filter(m => keys.includes(m.key)) });
  if (representative.has(item.caseId)) {
    const wanted = result.markers.filter(m => keys.includes(m.key));
    const bounds = wanted.flatMap(m => [m.ring, ...m.labelContacts.map(c => c.box), ...m.ringLabelContacts.map(c => c.box)]);
    const minX = Math.min(...bounds.map(b => b.x)) - 1.8, maxX = Math.max(...bounds.map(b => b.right)) + 2.2;
    const minY = Math.min(...bounds.map(b => b.y)) - 1.4, maxY = Math.max(...bounds.map(b => b.bottom)) + 1.4;
    await page.evaluate(({ minX, minY, maxX, maxY }) => {
      const svg = document.querySelector('svg'); svg.setAttribute('viewBox', `${minX} ${minY} ${maxX-minX} ${maxY-minY}`);
      svg.setAttribute('width', `${(maxX-minX)*80}px`); svg.setAttribute('height', `${(maxY-minY)*80}px`);
      const ns = 'http://www.w3.org/2000/svg'; const g = document.createElementNS(ns, 'g'); g.setAttribute('data-s387-diagnostic', 'true');
      for (const marker of document.querySelectorAll('g[data-pom-key]')) {
        if (!['D','E','FG','H','I'].includes(marker.getAttribute('data-pom-key'))) continue;
        const c = marker.querySelector('circle'); const cx = Number(c.getAttribute('cx')), cy = Number(c.getAttribute('cy'));
        const ring = document.createElementNS(ns, 'circle'); ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('r', '0.6'); ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#e11d48'); ring.setAttribute('stroke-width', '0.035'); g.append(ring);
        const t = document.createElementNS(ns, 'text'); t.setAttribute('x', cx + 0.62); t.setAttribute('y', cy - 0.55); t.setAttribute('font-size', '0.38'); t.setAttribute('fill', '#e11d48'); t.textContent = marker.getAttribute('data-pom-key'); g.append(t);
      }
      svg.append(g);
    }, { minX, minY, maxX, maxY });
    await page.locator('svg').screenshot({ path: fileURLToPath(new URL(`polo-${item.caseId}-source-label-overlaps.png`, out)) });
  }
  if (item.caseId === 'polo-default') {
    for (const [key, dx, dy, crop] of [
      ['E', -0.38, -0.34, { x: -2.4, y: 20.7, w: 3.5, h: 3.0 }],
      ['I', 0.34, -0.32, { x: 2.2, y: -8.1, w: 3.5, h: 3.0 }],
    ]) {
      const candidatePage = await browser.newPage({ viewport: { width: 1000, height: 850 }, deviceScaleFactor: 2 });
      await candidatePage.setContent(`<html><body style="margin:0">${svg}</body></html>`, { waitUntil: 'load' });
      await candidatePage.evaluate(({ key, dx, dy, crop }) => {
        const root = document.querySelector('svg'); root.setAttribute('viewBox', `${crop.x} ${crop.y} ${crop.w} ${crop.h}`);
        root.setAttribute('width', '900px'); root.setAttribute('height', `${900 * crop.h / crop.w}px`);
        const marker = [...root.querySelectorAll('g[data-pom-key]')].find(node => node.getAttribute('data-pom-key') === key);
        const letter = marker?.querySelector('text'); if (!letter) throw new Error(`missing ${key} keyed glyph`);
        letter.setAttribute('x', String(Number(letter.getAttribute('x')) + dx));
        letter.setAttribute('y', String(Number(letter.getAttribute('y')) + dy));
        root.setAttribute('data-s387-display-only-glyph-candidate', key);
      }, { key, dx, dy, crop });
      await candidatePage.locator('svg').screenshot({ path: fileURLToPath(new URL(`polo-default-${key}-glyph-offset-candidate.png`, out)) });
      await candidatePage.close();
    }
  }
}
await browser.close();
const summary = {};
for (const key of keys) {
  const pairCounts = new Map();
  let glyphContacts = 0, ringContacts = 0;
  for (const row of rows) for (const marker of row.markers.filter(m => m.key === key)) {
    for (const contact of marker.labelContacts) glyphContacts++;
    for (const contact of marker.ringLabelContacts) ringContacts++;
    for (const contact of new Map([...marker.labelContacts, ...marker.ringLabelContacts].map(item => [`${item.id} | ${item.text}`, item])).values()) {
      const pair = `${contact.id} | ${contact.text}`;
      const options = pairCounts.get(pair) ?? new Set(); options.add(row.caseId); pairCounts.set(pair, options);
    }
  }
  summary[key] = { options: rows.length, glyphLabelIntersections: glyphContacts, ringLabelIntersections: ringContacts, repeatedSourceLabels: [...pairCounts].map(([pair, optionIds]) => ({ pair, optionCount: optionIds.size })) };
}
const output = { source: 'committed S386 actual-renderer SVG output', renderer: 'Chromium SVG DOM getBBox on committed S386 output', optionRows: rows.length, browserErrors: errors, keys: summary, rows };
await writeFile(new URL('./keyed-marker-overlap-matrix.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ optionRows: rows.length, browserErrors: errors.length, keys: summary }, null, 2));
