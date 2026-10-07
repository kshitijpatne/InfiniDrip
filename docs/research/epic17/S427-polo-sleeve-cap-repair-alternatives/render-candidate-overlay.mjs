import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const svg = await readFile(new URL('./candidate-sleeve-cap-span-overlay.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
  await page.setContent(svg);
  await page.locator('svg').screenshot({ path: fileURLToPath(new URL('./candidate-sleeve-cap-span-overlay.png', import.meta.url)) });
  const rendered = await page.evaluate(() => ({
    rendered: Boolean(document.querySelector('svg path')),
    pathCount: document.querySelectorAll('svg path').length,
    svgBounds: document.querySelector('svg')?.getBoundingClientRect().toJSON(),
  }));
  const result = { browserErrors, ...rendered };
  if (!result.rendered || result.pathCount !== 2 || result.browserErrors.length !== 0) throw new Error(JSON.stringify(result));
  await writeFile(new URL('./candidate-overlay-render-result.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
