import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("./", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("candidate-matrix.json", root), "utf8"));
const destination = new URL("review-overlays/", root);
await mkdir(destination, { recursive: true });
const selections = [
  ["woven-shirt-default", "FRONT_FLAT"],
  ["woven-shirt-default", "BACK_FLAT"],
  ["woven-shirt-combined-supported", "FRONT_FLAT"],
  ["woven-shirt-combined-supported", "BACK_FLAT"],
  ["woven-shirt-yokeDepth-min", "BACK_FLAT"],
  ["woven-shirt-yokeDepth-max", "BACK_FLAT"],
];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [caseId, face] of selections) {
    const row = manifest.rows.find((entry) => entry.caseId === caseId && entry.face === face);
    if (!row) throw new Error(`missing candidate ${caseId}/${face}`);
    const svg = await readFile(new URL(row.candidateSvg, root), "utf8");
    const opening = svg.match(/<svg\b[^>]*>/)?.[0];
    if (!opening || !svg.includes(`data-revision-id="${row.revisionId}"`)) {
      throw new Error(`${caseId}/${face}: missing SVG root or exact revision`);
    }
    const styles = `<style>
      path[data-source-id="pattern:woven-shirt:role:sleeve"][fill]:not([fill="none"]) { fill:#38bdf8!important; fill-opacity:.38!important; stroke:#0369a1!important; stroke-width:.18!important }
      path[data-source-id="pattern:woven-shirt:role:sleeveBand"][fill]:not([fill="none"]) { fill:#fb923c!important; fill-opacity:.52!important; stroke:#c2410c!important; stroke-width:.18!important }
      path[data-colorway-fill-for^="flat:woven-shirt:"][fill] { fill-opacity:.10!important; stroke:#0f766e!important; stroke-width:.12!important; stroke-dasharray:.55 .35!important }
      </style>`;
    const annotated = svg.replace(opening, `${opening}${styles}`);
    const name = `${caseId}-${face.toLowerCase()}-reflected-sleeve-band`;
    await writeFile(new URL(`${name}.svg`, destination), annotated);
    const page = await browser.newPage({ viewport: { width: 1600, height: 1700 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.setContent(annotated, { waitUntil: "load" });
    const check = await page.evaluate(() => ({
      revisionIds: new Set([...document.querySelectorAll("[data-revision-id]")]
        .map((node) => node.getAttribute("data-revision-id"))).size,
      transformedSleeve: document.querySelectorAll(
        'path[data-source-id="pattern:woven-shirt:role:sleeve"][transform]').length,
      transformedBand: document.querySelectorAll(
        'path[data-source-id="pattern:woven-shirt:role:sleeveBand"][transform]').length,
      visibleBandFolds: document.querySelectorAll(
        'path[data-source-id="pattern:woven-shirt:mark:sleeveBand:bandFold"][transform]').length,
    }));
    if (check.revisionIds !== 1 || check.transformedSleeve < 2
      || check.transformedBand < 2 || check.visibleBandFolds !== 2 || errors.length) {
      throw new Error(`${caseId}/${face}: invalid review view ${JSON.stringify({ check, errors })}`);
    }
    await page.locator("svg").screenshot({ path: fileURLToPath(new URL(`${name}.png`, destination)) });
    await page.close();
    results.push({ caseId, face, revisionId: row.revisionId, check, errors,
      svg: `review-overlays/${name}.svg`, png: `review-overlays/${name}.png` });
  }
} finally {
  await browser.close();
}
await writeFile(new URL("review-overlay-manifest.json", root), `${JSON.stringify({ results }, null, 2)}\n`);
console.log(`Rendered ${results.length} exact-revision transformed overlays; all source identity and fold-mark checks pass.`);
