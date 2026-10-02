import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { chromium } from 'playwright';

const root = 'docs/research/epic17/S384-polo-anchor-topology-review';
const source = 'docs/research/epic17/S383-polo-keyed-callout-layout/rendered/colorway-on';
const cases = ['polo-default', 'polo-placketWidth-min', 'polo-standFrontRise-min', 'polo-collarPointExtension-max'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
const evidence = [];
try {
  await mkdir(join(root, 'rendered'), { recursive: true });
  for (const caseId of cases) {
    const input = await readFile(join(source, `${caseId}.svg`), 'utf8');
    const dom = new JSDOM(input, { contentType: 'image/svg+xml' }); const doc = dom.window.document;
    for (const group of doc.querySelectorAll('g[data-s383-marker]')) {
      const circle = group.querySelector('circle'); circle.setAttribute('fill', 'none');
      const letter = group.querySelector('text'); letter.setAttribute('stroke', '#fff'); letter.setAttribute('stroke-width', '0.045');
      letter.setAttribute('paint-order', 'stroke fill');
    }
    const svg = new dom.window.XMLSerializer().serializeToString(doc.documentElement);
    const path = join(root, 'rendered', `${caseId}-open-marker.svg`); await writeFile(path, `${svg}\n`);
    const detail = svg.replace(/viewBox="([^"]+)"/u, (_all, value) => {
      const [, , , height] = value.split(/\s+/u).map(Number); return `viewBox="-10 -17 48 ${Math.min(height, 42)}"`;
    });
    await page.setContent(detail, { waitUntil: 'load' });
    const png = join(root, 'rendered', `${caseId}-open-marker.png`);
    await page.screenshot({ path: png, fullPage: true });
    evidence.push({ caseId, inputRevision: doc.documentElement.getAttribute('data-revision-id'),
      openRings: doc.querySelectorAll('g[data-s383-marker] circle[fill="none"]').length,
      sourcePathsPreserved: true, screenshot: png, svg: path });
  }
  assert.equal(errors.length, 0, errors.join('; '));
  await writeFile(join(root, 'marker-style-comparison.json'), `${JSON.stringify({ cases: evidence, browserErrors: errors.length,
    method: 'Diagnostic only: compared S383 white-filled marker disks with open red rings and a white key-glyph halo; retained exact S380 source paths and unchanged S383 key coordinates.' }, null, 2)}\n`);
  console.log(JSON.stringify({ cases: evidence.length, browserErrors: errors.length,
    openRings: evidence.map((row) => row.openRings) }, null, 2));
} finally { await browser.close(); }
