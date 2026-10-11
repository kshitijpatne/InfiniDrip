import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = new URL("./", import.meta.url);
const source = new URL("../S348-woven-role-token/production-replay/", root);
const matrix = JSON.parse(await readFile(new URL("matrix.json", source), "utf8"));
const candidateDir = new URL("candidate-svg/", root);
const renderedDir = new URL("candidate-rendered/", root);
await mkdir(candidateDir, { recursive: true });
await mkdir(renderedDir, { recursive: true });
const targetCases = new Set([
  "woven-shirt-default",
  "woven-shirt-combined-supported",
  "woven-shirt-yokeDepth-min",
  "woven-shirt-yokeDepth-max",
]);
const results = [];
for (const entry of matrix.cases) {
  if (!entry.caseId.startsWith("woven-shirt-")) continue;
  const face = entry.faces.find((candidate) => candidate.kind === "BACK_FLAT");
  if (!face || face.svgCount !== 1) throw new Error(`${entry.caseId}: expected one production back SVG`);
  const name = `${entry.caseId}-back_flat.svg`;
  const original = await readFile(new URL(name, source), "utf8");
  if (!original.includes(`data-revision-id="${face.revisionId}"`)) throw new Error(`${entry.caseId}: revision mismatch`);
  const opening = original.match(/<svg\b[^>]*>/)?.[0];
  const viewBox = opening?.match(/viewBox="([^"]+)"/)?.[1];
  if (!opening || !viewBox) throw new Error(`${entry.caseId}: missing SVG root/viewBox`);
  const [x, y, width, height] = viewBox.split(/[ ,]+/).map(Number);
  if (![x, y, width, height].every(Number.isFinite)) throw new Error(`${entry.caseId}: invalid viewBox`);
  const paths = [...original.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
  const attr = (tag, key) => tag.match(new RegExp(`\\b${key}="([^"]*)"`))?.[1];
  const bodyMasks = paths.filter((tag) => tag.includes("data-colorway-fill-for=")
    && (attr(tag, "data-colorway-fill-for") === "flat:woven-shirt:BACK_FLAT:component:back:outline"
      || attr(tag, "data-colorway-fill-for") === "flat:woven-shirt:BACK_FLAT:component:yoke:outline"));
  if (bodyMasks.length !== 2 || bodyMasks.some((tag) => !attr(tag, "d")?.trim().endsWith("Z"))) {
    throw new Error(`${entry.caseId}: expected closed exact-revision body and yoke colorway contours`);
  }
  const maskId = `s350-body-occlusion-${entry.caseId}`;
  const definition = `<defs><mask id="${maskId}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="${x}" y="${y}" width="${width}" height="${height}" style="mask-type:luminance"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>${bodyMasks.map((tag) => `<path d="${attr(tag, "d")}" fill="black" fill-rule="evenodd"/>`).join("")}</mask></defs>`;
  let maskedRolePaths = 0;
  const candidate = original.replace(opening, `${opening}${definition}`).replace(/<path\b[^>]*>/g, (tag) => {
    const sourceId = attr(tag, "data-source-id");
    const layer = attr(tag, "data-layer");
    if (layer === "GARMENT_SILHOUETTE"
      && (sourceId === "pattern:woven-shirt:role:sleeve" || sourceId === "pattern:woven-shirt:role:sleeveBand")) {
      maskedRolePaths += 1;
      return tag.replace(/\s*\/?\s*>$/, ` mask="url(#${maskId})">`);
    }
    return tag;
  });
  if (maskedRolePaths < 4) throw new Error(`${entry.caseId}: incomplete sleeve/band target set (${maskedRolePaths})`);
  await writeFile(new URL(name, candidateDir), candidate);
  results.push({ caseId: entry.caseId, revisionId: face.revisionId, sourceSvg: basename(name),
    masks: bodyMasks.length, maskedRolePaths, unchangedSource: true,
    faceIssueCount: face.issueCount, candidateSvg: `candidate-svg/${name}` });
}
if (results.length !== 28) throw new Error(`Expected 28 Woven backs; got ${results.length}`);
const browser = await chromium.launch({ headless: true });
const browserErrors = [];
try {
  for (const result of results) {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1700 }, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => browserErrors.push({ caseId: result.caseId, kind: "pageerror", message: error.message }));
    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push({ caseId: result.caseId, kind: "console", message: message.text() });
    });
    const candidate = await readFile(new URL(result.candidateSvg, root), "utf8");
    await page.setContent(`<html><body style="margin:0;background:white"><style>
      path[data-layer="GARMENT_SILHOUETTE"][data-source-id="pattern:woven-shirt:role:sleeve"]{stroke:#0284c7!important;stroke-width:.22!important}
      path[data-layer="GARMENT_SILHOUETTE"][data-source-id="pattern:woven-shirt:role:sleeveBand"]{stroke:#f97316!important;stroke-width:.22!important}
      </style>${candidate}</body></html>`);
    const inspection = await page.evaluate(() => ({
      svgCount: document.querySelectorAll("svg").length,
      maskCount: document.querySelectorAll("svg mask[id^='s350-body-occlusion-']").length,
      maskedSleevePaths: document.querySelectorAll("svg path[data-layer='GARMENT_SILHOUETTE'][data-source-id='pattern:woven-shirt:role:sleeve'][mask]").length,
      maskedBandPaths: document.querySelectorAll("svg path[data-layer='GARMENT_SILHOUETTE'][data-source-id='pattern:woven-shirt:role:sleeveBand'][mask]").length,
      revisionIds: new Set([...document.querySelectorAll("svg [data-revision-id]")].map((item) => item.getAttribute("data-revision-id"))).size,
    }));
    if (inspection.svgCount !== 1 || inspection.maskCount !== 1
      || inspection.maskedSleevePaths + inspection.maskedBandPaths !== result.maskedRolePaths
      || inspection.revisionIds !== 1) {
      throw new Error(`${result.caseId}: incomplete browser candidate ${JSON.stringify(inspection)}`);
    }
    if (targetCases.has(result.caseId)) {
      await page.locator("svg").screenshot({ path: join(fileURLToPath(renderedDir), `${result.caseId}-back_flat-body-mask.png`) });
    }
    await page.close();
  }
} finally {
  await browser.close();
}
if (browserErrors.length) throw new Error(`Chromium candidate errors: ${JSON.stringify(browserErrors)}`);
await writeFile(new URL("body-mask-matrix.json", root), `${JSON.stringify({
  candidate: "same-revision back and yoke closed fills mask only the sleeve and sleeveBand silhouette paths inside the body region",
  configurations: results.length,
  outputFaces: results.length,
  browserErrors,
  allExactRevisions: results.every((item) => item.revisionId.length > 0),
  allSourceSvgBytesRetainedAsInputs: true,
  totalTargetPaths: results.reduce((sum, item) => sum + item.maskedRolePaths, 0),
  results,
}, null, 2)}\n`);
console.log(JSON.stringify({ configurations: results.length, renderedInChromium: results.length, screenshots: targetCases.size,
  targetPaths: results.reduce((sum, item) => sum + item.maskedRolePaths, 0), renderedDir: fileURLToPath(renderedDir) }));
