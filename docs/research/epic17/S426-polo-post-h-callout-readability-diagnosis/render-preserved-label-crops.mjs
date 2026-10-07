import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const inputDir = new URL('./rendered-source-labels/', import.meta.url);
const outputDir = new URL('./rendered-crops-source-labels/', import.meta.url);
await mkdir(outputDir, { recursive: true });
const selections = [['polo-default', ['A', 'B', 'H', 'C']], ['polo-standHeight-max', ['H']]];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 2 });
try {
  for (const [caseId, keys] of selections) {
    const svg = await readFile(new URL(`${caseId}-source-labels-S426.svg`, inputDir), 'utf8');
    await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:1600px;height:auto}</style>${svg}`);
    for (const key of keys) {
      const marker = await page.locator(`svg g[data-pom-key="${key}"]`).boundingBox();
      if (!marker) throw new Error(`Missing marker ${key} in ${caseId}`);
      const relatedLabels = await page.locator('svg text[data-label-for]').evaluateAll((nodes, target) => nodes.map((node) => {
        const b = node.getBoundingClientRect();
        const dx = Math.max(b.left - (target.x + target.width), target.x - (b.left + b.width), 0);
        const dy = Math.max(b.top - (target.y + target.height), target.y - (b.top + b.height), 0);
        return { gap: Math.hypot(dx, dy), rect: { x: b.x, y: b.y, width: b.width, height: b.height } };
      }).sort((a, b) => a.gap - b.gap).slice(0, 4).map(({ rect }) => rect), marker);
      const all = [marker, ...relatedLabels];
      const minX = Math.max(0, Math.min(...all.map((rect) => rect.x)) - 50);
      const minY = Math.max(0, Math.min(...all.map((rect) => rect.y)) - 50);
      const maxX = Math.min(1600, Math.max(...all.map((rect) => rect.x + rect.width)) + 60);
      const maxY = Math.min(1200, Math.max(...all.map((rect) => rect.y + rect.height)) + 60);
      await writeFile(new URL(`${caseId}-${key}-labels.png`, outputDir), await page.screenshot({ clip: {
        x: minX, y: minY, width: Math.max(120, maxX - minX), height: Math.max(120, maxY - minY),
      } }));
    }
  }
} finally { await browser.close(); }
