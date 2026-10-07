import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const matrix = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const output = new URL('./rendered-detail/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 2048, height: 1600 }, deviceScaleFactor: 1 });
try {
  for (const caseId of ['woven-shirt-default', 'woven-shirt-combined-supported']) {
    const row = matrix.cases.find((entry) => entry.caseId === caseId);
    const front = row.faces.find(({ kind }) => kind === 'FRONT_FLAT');
    await page.setContent(`<style>body{margin:0;background:white}svg{display:block;width:2880px;height:auto}</style>${front.svg}`);
    for (const key of ['D', 'W']) {
      const locator = page.locator(`svg g[data-marker-underlay-for="${key}"]`);
      await locator.scrollIntoViewIfNeeded();
      const rect = await locator.boundingBox();
      if (!rect) throw new Error(`Missing ${key} marker in ${caseId}`);
      const width = 840;
      const height = 640;
      const x = Math.max(0, Math.min(2048 - width, rect.x + rect.width / 2 - width / 2));
      const y = Math.max(0, Math.min(1600 - height, rect.y + rect.height / 2 - height / 2));
      const name = `${caseId}-${key.toLowerCase()}-zoom.png`;
      await page.screenshot({ path: fileURLToPath(new URL(name, output)), clip: { x, y, width, height } });
    }
    const scheduleRows = page.locator('svg text[data-schedule-for]');
    if (!await scheduleRows.count()) throw new Error(`Missing POM schedule rows in ${caseId}`);
    await scheduleRows.first().scrollIntoViewIfNeeded();
    const bounds = await scheduleRows.evaluateAll((nodes) => nodes.map((node) => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }));
    const minX = Math.min(...bounds.map((rect) => rect.x));
    const minY = Math.min(...bounds.map((rect) => rect.y));
    const maxX = Math.max(...bounds.map((rect) => rect.x + rect.width));
    const maxY = Math.max(...bounds.map((rect) => rect.y + rect.height));
    const x = Math.max(0, minX - 120);
    const y = Math.max(0, minY - 80);
    const width = Math.min(2048 - x, Math.max(600, maxX - minX + 240));
    const height = Math.min(1600 - y, Math.max(220, maxY - minY + 160));
    const name = `${caseId}-pom-schedule-zoom.png`;
    await page.screenshot({ path: fileURLToPath(new URL(name, output)), clip: { x, y, width, height } });
  }
} finally {
  await browser.close();
}
