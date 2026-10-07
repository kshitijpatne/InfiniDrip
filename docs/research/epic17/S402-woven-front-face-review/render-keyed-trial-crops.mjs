import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const folder = fileURLToPath(new URL('./', import.meta.url));
const dir = join(folder, 'rendered');
const html = await readFile(join(dir, 'woven-shirt-default-front-interval-key-trial.svg'), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
  for (const name of ['woven-shirt-default', 'woven-shirt-standHeight-max', 'woven-shirt-collarLeafDepth-min', 'woven-shirt-combined-supported']) {
    const source = name === 'woven-shirt-default' ? html : await readFile(join(dir, `${name}-front-interval-key-trial.svg`), 'utf8');
    await page.setContent(source, { waitUntil: 'load' });
    await page.locator('svg').screenshot({ path: join(dir, `${name}-front-interval-key-trial-whole.png`) });
    if (name !== 'woven-shirt-default') {
      await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-2 9 8 18'); root.setAttribute('width', '1500'); root.setAttribute('height', '1500'); });
      await page.locator('svg').screenshot({ path: join(dir, `${name}-front-interval-key-trial-detail.png`) });
    }
  }
  await page.setContent(html, { waitUntil: 'load' });
  await page.locator('svg').evaluate((root) => { root.setAttribute('viewBox', '-54.2 77.2 9.1 3.3'); root.setAttribute('width', '1600'); root.setAttribute('height', '600'); });
  await page.locator('svg').screenshot({ path: join(dir, 'woven-shirt-default-front-interval-key-trial-schedule.png') });
} finally { await browser.close(); }
