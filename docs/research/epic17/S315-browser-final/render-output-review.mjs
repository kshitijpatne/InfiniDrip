import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const directory = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
  for (const face of ["front", "back"]) {
    const file = path.join(directory, `tank-default-${face}.svg`);
    await page.setContent(await fs.readFile(file, "utf8"), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(directory, `tank-default-${face}.png`), fullPage: true });
  }
} finally {
  await browser.close();
}
