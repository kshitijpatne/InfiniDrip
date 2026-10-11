import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright";

const svgDir = new URL("../S434-polo-j-fg-keyed-display/rendered-production/", import.meta.url);
const outDir = new URL("./rendered/", import.meta.url);
await mkdir(outDir, { recursive: true });
const selected = ["polo-default", "polo-standHeight-max", "polo-backHemDrop-min"];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
const outputs = [];
try {
  for (const caseId of selected) {
    const svg = await readFile(new URL(`${caseId}-back_flat.svg`, svgDir), "utf8");
    await page.setContent(`<html><body style="margin:0;background:white">${svg}</body></html>`);
    await page.locator("svg").screenshot({ path: new URL(`S436-${caseId}-back.png`, outDir).pathname.replace(/^\//u, ""), animations: "disabled" });
    const info = await page.locator("svg").evaluate((root) => ({
      revisionId: root.getAttribute("data-revision-id"),
      colorwayRevision: root.getAttribute("data-colorway-revision"),
      fillCount: root.querySelectorAll("[data-colorway-fill-for]").length,
      roleFillCount: new Set([...root.querySelectorAll("[data-colorway-fill-for]")].map((node) => node.getAttribute("data-colorway-fill-for"))).size,
      pathCount: root.querySelectorAll("path[data-source-id^='pattern:polo:']").length,
      notices: root.querySelectorAll("[data-notice-id]").length,
    }));
    outputs.push({ caseId, ...info, image: `rendered/S436-${caseId}-back.png` });
  }
} finally { await browser.close(); }
if (errors.length) throw new Error(`Chromium page/console errors: ${JSON.stringify(errors)}`);
for (const output of outputs) {
  if (output.revisionId !== `live-draft:polo:S434:${output.caseId}` || output.colorwayRevision !== output.revisionId || output.roleFillCount !== 5) {
    throw new Error(`S436 rendered back identity/colorway assertion failed: ${JSON.stringify(output)}`);
  }
}
console.log(JSON.stringify({ cases: outputs.length, browserErrors: errors, outputs }, null, 2));
