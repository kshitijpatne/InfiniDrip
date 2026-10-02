import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("./", import.meta.url);
const sourceDir = new URL("../S348-woven-role-token/production-replay/", root);
const matrix = JSON.parse(await readFile(new URL("matrix.json", sourceDir), "utf8"));
const outputDir = new URL("annotated-views/", root);
await mkdir(outputDir, { recursive: true });
const cases = new Set([
  "woven-shirt-default",
  "woven-shirt-combined-supported",
  "woven-shirt-yokeDepth-min",
  "woven-shirt-yokeDepth-max",
]);
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const item of matrix.cases.filter((entry) => cases.has(entry.caseId))) {
    const face = item.faces.find((entry) => entry.kind === "BACK_FLAT");
    const sourceName = `${item.caseId}-back_flat.svg`;
    const source = await readFile(new URL(sourceName, sourceDir), "utf8");
    if (!face || !source.includes(`data-revision-id="${face.revisionId}"`)) {
      throw new Error(`${item.caseId}: missing face or revision mismatch`);
    }
    const opening = source.match(/<svg\b[^>]*>/)?.[0];
    if (!opening) throw new Error(`${item.caseId}: missing SVG root`);
    const style = `<style>
      path[data-source-id="pattern:woven-shirt:role:sleeveBand"][data-feature="silhouette"][fill]:not([fill="none"]) { fill:#ef4444!important; fill-opacity:.42!important; stroke:#b91c1c!important; stroke-width:.22!important }
      path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:back:outline"], path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:yoke:outline"] { fill-opacity:.12!important; stroke:#0284c7!important; stroke-width:.22!important; stroke-dasharray:.8 .45!important }
      </style>`;
    const annotated = source.replace(opening, `${opening}${style}`);
    const svgPath = new URL(`annotated-views/${item.caseId}-back_flat-band-coverage.svg`, root);
    await writeFile(svgPath, annotated);
    const page = await browser.newPage({ viewport: { width: 1500, height: 1700 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(annotated);
    const inspection = await page.evaluate(() => ({
      revisionIds: new Set([...document.querySelectorAll("svg [data-revision-id]")]
        .map((node) => node.getAttribute("data-revision-id"))).size,
      highlightedBandFills: document.querySelectorAll(
        'path[data-source-id="pattern:woven-shirt:role:sleeveBand"][fill]:not([fill="none"])').length,
      bodyYokeFills: document.querySelectorAll(
        'path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:back:outline"], path[data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:yoke:outline"]').length,
    }));
    if (inspection.revisionIds !== 1 || inspection.highlightedBandFills !== 1 || inspection.bodyYokeFills !== 2) {
      throw new Error(`${item.caseId}: incomplete overlay ${JSON.stringify(inspection)}`);
    }
    const pngName = `${item.caseId}-back_flat-band-coverage.png`;
    await page.locator("svg").screenshot({ path: fileURLToPath(new URL(pngName, outputDir)) });
    await page.close();
    if (errors.length) throw new Error(`${item.caseId}: Chromium errors ${JSON.stringify(errors)}`);
    results.push({ caseId: item.caseId, revisionId: face.revisionId, source: sourceName,
      overlaySvg: `annotated-views/${item.caseId}-back_flat-band-coverage.svg`,
      screenshot: `annotated-views/${pngName}`, inspection, errors });
  }
} finally {
  await browser.close();
}
if (results.length !== cases.size) throw new Error(`expected ${cases.size} annotated cases, got ${results.length}`);
await writeFile(new URL("annotated-view-manifest.json", root), `${JSON.stringify({ results }, null, 2)}\n`);
console.log(`Chromium rendered ${results.length} exact-revision band/body overlays with no errors.`);
