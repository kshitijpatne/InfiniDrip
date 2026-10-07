import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = new URL("./production-replay/", import.meta.url);
const input = new URL("woven-shirt-pocketWidth-max-front_flat.svg", base);
const svg = await readFile(input, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1000 }, deviceScaleFactor: 1 });
await page.setContent(svg, { waitUntil: "load" });
const box = await page.locator("svg").evaluate((root) => {
  const bounds = [...root.querySelectorAll("path[data-source-id^='pattern:woven-shirt:role:pocket'], path[data-view-clip*='S405']")]
    .map((path) => path.getBBox()).reduce((acc, item) => ({ minX: Math.min(acc.minX, item.x), minY: Math.min(acc.minY, item.y),
      maxX: Math.max(acc.maxX, item.x + item.width), maxY: Math.max(acc.maxY, item.y + item.height) }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  return { x: bounds.minX - 1, y: bounds.minY - 1, width: bounds.maxX - bounds.minX + 2,
    height: bounds.maxY - bounds.minY + 2 };
});
await page.locator("svg").evaluate((root, crop) => root.setAttribute("viewBox",
  `${crop.x} ${crop.y} ${crop.width} ${crop.height}`), box);
await page.screenshot({ path: fileURLToPath(new URL("rendered/woven-shirt-pocketWidth-max-front-pocket-overlap-detail.png", base)),
  fullPage: true });
await browser.close();
