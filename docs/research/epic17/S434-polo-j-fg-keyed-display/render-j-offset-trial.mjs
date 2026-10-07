import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = new URL("./", import.meta.url);
const outputDir = new URL("rendered-j-offset-trial/", folder);
await mkdir(outputDir, { recursive: true });
const options = ["polo-default", "polo-standFrontRise-min", "polo-standFrontRise-max"];
const dyCm = 0.7;
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
try {
  for (const caseId of options) {
    const source = await readFile(new URL(`rendered-production/${caseId}-front_flat.svg`, folder), "utf8");
    const pattern = /(<g\b[^>]*data-pom-key="J"[^>]*>[\s\S]*?<text\b[^>]*\by=")(-?[\d.]+)("[^>]*>J<\/text>)/u;
    const match = source.match(pattern);
    assert.ok(match, `${caseId}: exact J keyed marker text missing`);
    const nextY = Number(match[2]) + dyCm;
    const candidate = source.replace(pattern, `$1${nextY.toFixed(4)}$3`);
    await writeFile(new URL(`${caseId}-front_flat.svg`, outputDir), candidate);
    await page.setContent(`<html><body style="margin:0;background:white;font:16px Arial">${candidate}</body></html>`);
    await page.locator("svg").evaluate((svg) => { svg.setAttribute("viewBox", "-8 -2 25 20"); svg.setAttribute("width", "1800"); svg.setAttribute("height", "1400"); });
    await page.locator("svg").screenshot({ path: join(fileURLToPath(outputDir), `${caseId}-neck-detail.png`), animations: "disabled" });
  }
} finally { await browser.close(); }
assert.deepEqual(errors, []);
await writeFile(new URL("S434-j-offset-render-trial.json", folder), `${JSON.stringify({
  status: "diagnostic-only; not implemented", options, glyphTranslationCm: { x: 0, y: dyCm },
  fixedMarker: "J ring remains exactly at outerStand.frontEnd; only J text moves",
  clearanceBasis: "S434-j-glyph-offset-scan.json", rendererBrowserErrors: errors,
  renders: options.map((caseId) => `rendered-j-offset-trial/${caseId}-neck-detail.png`),
}, null, 2)}\n`);
console.log(JSON.stringify({ options: options.length, glyphTranslationCm: { x: 0, y: dyCm }, rendererBrowserErrors: errors }, null, 2));
