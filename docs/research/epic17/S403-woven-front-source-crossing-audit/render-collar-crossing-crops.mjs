import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const folder = import.meta.dirname;
const source = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const matrix = JSON.parse(await readFile(join(folder, 'woven-front-path-crossings.json'), 'utf8'));
const out = join(folder, 'rendered');
await mkdir(out, { recursive: true });
const caseIds = ['woven-shirt-default', 'woven-shirt-neckEase-min', 'woven-shirt-neckEase-max',
  'woven-shirt-standHeight-min', 'woven-shirt-standHeight-max', 'woven-shirt-collarLeafDepth-min',
  'woven-shirt-collarLeafDepth-max', 'woven-shirt-combined-supported'];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 1 });
  for (const caseId of caseIds) {
    const path = join(source, `${caseId}-front_flat-current.svg`);
    await page.setContent(await readFile(path, 'utf8'), { waitUntil: 'load' });
    const audit = matrix.records.find((record) => record.caseId === caseId);
    const crossing = audit.pathPairCrossings.find((pair) => /component:front:outline$/u.test(pair.firstEntityId)
      && /component:outerStand:outline$/u.test(pair.secondEntityId))?.points[0];
    if (!crossing) throw new Error(`${caseId}: expected same-option shoulder intersection missing`);
    const result = await page.evaluate((point) => {
      const root = document.documentElement;
      const colors = [
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:front:outline']", '#334155'],
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:outerStand:outline']", '#dc2626'],
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:underCollar:outline']", '#2563eb'],
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:upperCollar:outline']", '#7c3aed'],
        ["path[data-entity-id^='flat:woven-shirt:FRONT_FLAT:view-seam:front:neckline']", '#16a34a'],
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline']", '#ea580c'],
        ["path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:buttonholePlacket:outline:approved-left-closure']", '#0891b2'],
      ];
      const found = [];
      for (const [selector, color] of colors) for (const el of root.querySelectorAll(selector)) {
        el.setAttribute('stroke', color); el.setAttribute('stroke-width', '0.13'); el.setAttribute('data-s403-color', color);
        found.push({ id: el.getAttribute('data-entity-id'), source: el.getAttribute('data-source-id'), color });
      }
      const marker = document.createElementNS(root.namespaceURI, 'g'); marker.setAttribute('data-s403-crossing-marker', 'true');
      const circle = document.createElementNS(root.namespaceURI, 'circle');
      circle.setAttribute('cx', String(point.x)); circle.setAttribute('cy', String(point.y)); circle.setAttribute('r', '0.32');
      circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#f59e0b'); circle.setAttribute('stroke-width', '0.1'); marker.append(circle);
      const label = document.createElementNS(root.namespaceURI, 'text'); label.setAttribute('x', '13.1'); label.setAttribute('y', '0.4');
      label.setAttribute('font-size', '0.5'); label.setAttribute('fill', '#92400e'); label.textContent = 'front-outline / outerStand intersection'; marker.append(label);
      root.append(marker);
      return found;
    }, crossing);
    await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-14 -1.5 30 15'); root.setAttribute('width', '1800'); root.setAttribute('height', '900'); });
    await page.locator('svg').screenshot({ path: join(out, `${caseId}-collar-front-crossing.png`) });
    await writeFile(join(out, `${caseId}-collar-front-crossing.svg`), await page.locator('svg').evaluate((root) => root.outerHTML));
    await writeFile(join(out, `${caseId}-collar-front-crossing-path-index.json`), `${JSON.stringify({ caseId, highlighted: result }, null, 2)}\n`);
  }
} finally { await browser.close(); }
