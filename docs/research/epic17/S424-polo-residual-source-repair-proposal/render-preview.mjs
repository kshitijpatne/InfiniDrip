import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const folder = new URL('./', import.meta.url);
const svg = await readFile(new URL('./candidate-sleeve-overlay.svg', folder), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
  await page.setContent(svg, { waitUntil: 'load' });
  await page.locator('svg').screenshot({ path: fileURLToPath(new URL('./candidate-sleeve-overlay.png', folder)) });
  await page.close();
} finally {
  await browser.close();
}
console.log('Rendered S424 in-memory source candidate overlay with Chromium.');
