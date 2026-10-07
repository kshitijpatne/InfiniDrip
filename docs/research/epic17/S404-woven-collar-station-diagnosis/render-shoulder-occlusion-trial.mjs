import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const folder = new URL('./', import.meta.url);
const outputFolder = fileURLToPath(new URL('./rendered/', import.meta.url));
await mkdir(outputFolder, { recursive: true });
const source = new URL('../S403-woven-front-source-crossing-audit/rendered/woven-shirt-default-collar-front-crossing.svg', import.meta.url);
const outputSvg = fileURLToPath(new URL('./rendered/woven-shirt-default-shoulder-occlusion-trial.svg', import.meta.url));
const outputPng = fileURLToPath(new URL('./rendered/woven-shirt-default-shoulder-occlusion-trial.png', import.meta.url));
const crossing = { x: 12.715632824489138, y: 0.5031903723447217 };
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
  await page.setContent(await readFile(source, 'utf8'), { waitUntil: 'load' });
  const result = await page.evaluate(({ crossingPoint }) => {
    const root = document.querySelector('svg');
    if (!root) throw new Error('Production SVG root is missing.');
    const front = root.querySelector("path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:front:outline']");
    const reflected = root.querySelector("path[data-entity-id='flat:woven-shirt:FRONT_FLAT:component:front:outline:physical-pair-reflection']");
    if (!front || !reflected) throw new Error('Exact source-identified front shoulder paths are missing.');
    const d = front.getAttribute('d') ?? '';
    const reflectedD = reflected.getAttribute('d') ?? '';
    if (!d.startsWith('M10.25 0 L22.5 2.5') || !reflectedD.startsWith('M-10.25 0 L-22.5 2.5')) {
      throw new Error('Exact S403 default shoulder path geometry changed.');
    }
    const point = `${crossingPoint.x.toFixed(6)} ${crossingPoint.y.toFixed(6)}`;
    front.setAttribute('d', d.replace(/^M10\.25 0 L22\.5 2\.5/u, `M${point} L22.5 2.5`));
    reflected.setAttribute('d', reflectedD.replace(/^M-10\.25 0 L-22\.5 2\.5/u,
      `M-${crossingPoint.x.toFixed(6)} ${crossingPoint.y.toFixed(6)} L-22.5 2.5`));
    root.querySelectorAll('[data-s403-crossing-marker]').forEach((node) => node.remove());
    const marker = document.createElementNS(root.namespaceURI, 'g');
    marker.setAttribute('data-s404-diagnostic-only', 'shoulder-occlusion-trial');
    const circle = document.createElementNS(root.namespaceURI, 'circle');
    circle.setAttribute('cx', String(crossingPoint.x)); circle.setAttribute('cy', String(crossingPoint.y));
    circle.setAttribute('r', '0.28'); circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#b45309'); circle.setAttribute('stroke-width', '0.08'); marker.append(circle);
    const label = document.createElementNS(root.namespaceURI, 'text');
    label.setAttribute('x', '-13.4'); label.setAttribute('y', '-0.75');
    label.setAttribute('font-size', '0.38'); label.setAttribute('font-weight', '700');
    label.setAttribute('fill', '#92400e');
    label.textContent = 'DIAGNOSTIC ONLY — shoulder seam hidden to first collar intersection';
    marker.append(label); root.append(marker);
    root.setAttribute('viewBox', '-14 -1.5 30 15'); root.setAttribute('width', '1800'); root.setAttribute('height', '900');
    return { sourcePaths: [front.getAttribute('data-entity-id'), reflected.getAttribute('data-entity-id')],
      revisionId: front.getAttribute('data-revision-id'), originalShoulderRun: 'front.shoulder HPS to shoulder point',
      clippedTo: crossingPoint, change: 'diagnostic SVG path edit only; production source unchanged' };
  }, { crossingPoint: crossing });
  await page.locator('svg').screenshot({ path: outputPng });
  await writeFile(outputSvg, await page.locator('svg').evaluate((root) => root.outerHTML));
  await writeFile(new URL('./rendered/shoulder-occlusion-trial-index.json', folder), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await browser.close();
}
