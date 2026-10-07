import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const inputDir = new URL('../S425-polo-h-segmented-locator-implementation/rendered/', import.meta.url);
const outputDir = new URL('./rendered-crops/', import.meta.url);
await mkdir(outputDir, { recursive: true });
const cases = [
  ['polo-default', ['A', 'B', 'H', 'C']],
  ['polo-standHeight-max', ['H']],
];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
try {
  for (const [caseId, keys] of cases) {
    const svg = await readFile(new URL(`${caseId}-S425.svg`, inputDir), 'utf8');
    await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:1600px;height:auto}</style>${svg}`);
    await page.waitForFunction(() => document.querySelectorAll('svg g[data-pom-key]').length > 0);
    for (const key of keys) {
      const rect = await page.locator(`svg g[data-pom-key="${key}"] text`).boundingBox();
      if (!rect) throw new Error(`Missing ${key} glyph in ${caseId}`);
      const clip = { x: Math.max(0, rect.x - 130), y: Math.max(0, rect.y - 130),
        width: Math.min(420, 1600 - Math.max(0, rect.x - 130)), height: 300 };
      const png = await page.screenshot({ clip, scale: 'css' });
      await writeFile(new URL(`${caseId}-${key}-marker-crop.png`, outputDir), png);
    }
  }
} finally { await browser.close(); }
