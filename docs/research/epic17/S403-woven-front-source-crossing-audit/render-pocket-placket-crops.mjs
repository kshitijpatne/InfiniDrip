import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const folder = import.meta.dirname;
const rendered = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const output = join(folder, 'rendered');
await mkdir(output, { recursive: true });
const cases = ['woven-shirt-default', 'woven-shirt-placketWidth-max', 'woven-shirt-combined-supported'];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
  for (const caseId of cases) {
    const svg = await readFile(join(rendered, `${caseId}-front_flat-current.svg`), 'utf8');
    await page.setContent(svg, { waitUntil: 'load' });
    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const button = root.querySelector("path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline']");
      const pocket = root.querySelector("path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:pocket:outline']");
      if (!button || !pocket) return { found: false };
      button.setAttribute('stroke', '#dc2626'); button.setAttribute('stroke-width', '0.20');
      pocket.setAttribute('stroke', '#2563eb'); pocket.setAttribute('stroke-width', '0.20');
      button.setAttribute('data-s403-highlight', 'button-placket-outline');
      pocket.setAttribute('data-s403-highlight', 'patch-pocket-outline');
      const key = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      key.setAttribute('data-s403-key', 'true');
      const text = (x, y, fill, value) => { const el = document.createElementNS(key.namespaceURI, 'text');
        el.setAttribute('x', String(x)); el.setAttribute('y', String(y)); el.setAttribute('font-size', '0.55');
        el.setAttribute('font-weight', '700'); el.setAttribute('fill', fill); el.setAttribute('stroke', '#fff');
        el.setAttribute('stroke-width', '0.12'); el.setAttribute('paint-order', 'stroke'); el.textContent = value; key.append(el); };
      text(7.1, 29.5, '#dc2626', 'button placket outline');
      text(7.1, 31.0, '#2563eb', 'patch pocket outline');
      root.append(key);
      return { found: true, buttonPath: button.getAttribute('d'), pocketPath: pocket.getAttribute('d'),
        buttonOrder: [...root.querySelectorAll('path[data-entity-id]')].indexOf(button),
        pocketOrder: [...root.querySelectorAll('path[data-entity-id]')].indexOf(pocket),
        buttonFill: button.getAttribute('fill'), pocketFill: pocket.getAttribute('fill') };
    });
    if (!result.found) throw new Error(`${caseId}: expected source outlines missing`);
    await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-1 27 21 20'); root.setAttribute('width', '1500'); root.setAttribute('height', '1428'); });
    await page.locator('svg').screenshot({ path: join(output, `${caseId}-pocket-placket-crossing.png`) });
    await writeFile(join(output, `${caseId}-pocket-placket-crossing.svg`), await page.locator('svg').evaluate((root) => root.outerHTML));
    await writeFile(join(output, `${caseId}-pocket-placket-dom-order.json`), `${JSON.stringify({ caseId, ...result }, null, 2)}\n`);
  }
} finally { await browser.close(); }
