import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import path from "node:path";
const dir = path.resolve("docs/research/epic17/S332-polo-sleeve");
const browser = await chromium.launch({ headless: true });
for (const file of ["front_flat-candidate.svg","back_flat-candidate.svg"]) {
 const page = await browser.newPage({ viewport: { width: 1200, height: 820 }, deviceScaleFactor: 1 });
 await page.goto(pathToFileURL(path.join(dir,file)).href);
 await page.locator("svg").screenshot({ path: path.join(dir,file.replace(".svg",".png")) });
 await page.close();
}
await browser.close();
