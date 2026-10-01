import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
const browser = await chromium.launch({ headless: true });
try {
  for (const name of ["tee-front-flat", "tee-back-flat", "fitted-front-flat", "fitted-back-flat"]) {
    const svg = await readFile(new URL(`./S329-${name}-candidate.svg`, import.meta.url), "utf8");
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
    await page.setContent(svg, { waitUntil: "load" });
    await page.screenshot({ path: fileURLToPath(new URL(`./S329-${name}-candidate.png`, import.meta.url)) });
    await page.close();
  }
} finally { await browser.close(); }
