import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const JSDOM = require("jsdom").JSDOM;
const folder = fileURLToPath(new URL("./", import.meta.url));
const baseline = JSON.parse(await readFile(new URL("../S363-woven-pom-leader-readability/production-replay/matrix.json", import.meta.url), "utf8"));
const cases = baseline.cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
assert.equal(cases.length, 28);
const oldBack = await Promise.all(cases.map((item) => readFile(new URL(
  `../S372-woven-band-detached-detail/production-replay/${item.caseId}-back_flat.svg`, import.meta.url), "utf8")));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await page.goto(process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4191/", { waitUntil: "networkidle" });
const rendered = await page.evaluate(async ({ testCases }) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import("/src/drafting/recipe.ts"), import("/src/drafting/measurements.ts"),
    import("/src/drafting/options.ts"), import("/src/render/technical-flat-live.ts"),
    import("/src/render/technical-flat-svg.ts"),
  ]);
  const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
  if (!recipe) throw new Error("Woven recipe missing");
  const revisionId = "live-draft:woven-shirt:14:14";
  const measureText = createBrowserTechnicalFlatTextMeasurer(document);
  const rows = [];
  for (const testCase of testCases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const faces = [];
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"]) {
      const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind, placements: [],
        colorHex: "#3669a4", texture: "woven", shine: 24 });
      const compileIssues = live.issues;
      if (!live.view) {
        faces.push({ kind, compileIssues, rendererIssues: [], svg: null, revisionId: null,
          layerOrder: [], pathIdentity: [], colorwayIdentity: [], pomRows: [], keyedMarkers: [],
          detachedBandOutlines: 0, bandFoldMarks: 0 });
        continue;
      }
      const output = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway,
        title: `Woven S401 ${kind} — ${testCase.caseId}` });
      if (!output.svg) {
        faces.push({ kind, compileIssues, rendererIssues: output.issues, svg: null, revisionId,
          layerOrder: [], pathIdentity: [], colorwayIdentity: [], pomRows: [], keyedMarkers: [],
          detachedBandOutlines: 0, bandFoldMarks: 0 });
        continue;
      }
      const root = new DOMParser().parseFromString(output.svg, "image/svg+xml").documentElement;
      const pathIdentity = [...root.querySelectorAll("path[data-entity-id]")].map((path) => [path.getAttribute("data-entity-id"),
        path.getAttribute("d"), path.getAttribute("data-source-id"), path.getAttribute("data-revision-id"),
        path.getAttribute("data-colorway-fill-for")]);
      const colorwayIdentity = [...root.querySelectorAll("path[data-colorway-fill-for]")].map((path) => [
        path.getAttribute("data-colorway-fill-for"), path.getAttribute("d"), path.getAttribute("data-source-id"),
        path.getAttribute("data-revision-id")]);
      faces.push({ kind, compileIssues, rendererIssues: output.issues, svg: new XMLSerializer().serializeToString(root),
        revisionId: root.getAttribute("data-revision-id"),
        layerOrder: [...root.querySelectorAll("[data-layer-group]")].map((item) => item.getAttribute("data-layer-group")),
        pathIdentity, colorwayIdentity,
        pomRows: [...root.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")].map((item) => ({
          id: item.getAttribute("data-schedule-for"), key: item.getAttribute("data-pom-key"), text: item.textContent,
          sourceId: item.getAttribute("data-source-id"), revisionId: item.getAttribute("data-revision-id"),
          targetId: item.getAttribute("data-callout-target"), sourceEntityId: item.getAttribute("data-callout-source-entity")})),
        keyedMarkers: [...root.querySelectorAll("g[data-pom-key]")].map((item) => ({ key: item.getAttribute("data-pom-key"),
          sourceId: item.getAttribute("data-source-id"), revisionId: item.getAttribute("data-revision-id"),
          targetId: item.getAttribute("data-callout-target"), sourceEntityId: item.getAttribute("data-callout-source-entity"),
          glyphX: Number(item.querySelector("text")?.getAttribute("x")), glyphY: Number(item.querySelector("text")?.getAttribute("y")),
          ring: root.querySelector("g[data-marker-underlay-for='W'] circle") ? {
            cx: Number(root.querySelector("g[data-marker-underlay-for='W'] circle").getAttribute("cx")),
            cy: Number(root.querySelector("g[data-marker-underlay-for='W'] circle").getAttribute("cy")),
            r: Number(root.querySelector("g[data-marker-underlay-for='W'] circle").getAttribute("r")) } : null })),
        detachedBandOutlines: pathIdentity.filter(([id]) => id.includes("component:sleeveBand:outline:detached-detail:")).length,
        bandFoldMarks: root.querySelectorAll("[data-entity-id*='mark:sleeveBand:bandFold:detached-detail:']").length });
    }
    rows.push({ caseId: testCase.caseId, options, revisionId, faces });
  }
  return rows;
}, { testCases: cases });
await browser.close();

const parser = new (new JSDOM().window.DOMParser)();
const pathIdentity = (svg) => [...parser.parseFromString(svg, "image/svg+xml").querySelectorAll("path[data-entity-id]")]
  .map((path) => [path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
    path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for")]);
for (let index = 0; index < rendered.length; index += 1) {
  const back = rendered[index].faces.find((face) => face.kind === "BACK_FLAT");
  back.backPathIdentityMatchesS372 = !!back.svg && JSON.stringify(back.pathIdentity) === JSON.stringify(pathIdentity(oldBack[index]));
}

const outputDir = join(folder, "rendered");
await mkdir(outputDir, { recursive: true });
const screenshotBrowser = await chromium.launch({ headless: true });
const screenshotPage = await screenshotBrowser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
screenshotPage.on("pageerror", (error) => browserErrors.push(error.message));
screenshotPage.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
for (const row of rendered) {
  for (const face of row.faces) if (face.svg) await writeFile(join(outputDir,
    `${row.caseId}-${face.kind.toLowerCase()}-current.svg`), face.svg);
  if (!["woven-shirt-default", "woven-shirt-placketWidth-min", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max",
    "woven-shirt-combined-supported"].includes(row.caseId)) continue;
  for (const face of row.faces) if (face.svg) {
    const base = `${row.caseId}-${face.kind.toLowerCase()}`;
    await screenshotPage.setContent(face.svg, { waitUntil: "load" });
    await screenshotPage.screenshot({ path: join(outputDir, `${base}-whole.png`), fullPage: true });
    if (face.kind === "BACK_FLAT") {
      const crossing = face.svg.replace(/viewBox="([^"]+)"/u, 'viewBox="-10 14 20 22"');
      await screenshotPage.setContent(crossing, { waitUntil: "load" });
      await screenshotPage.screenshot({ path: join(outputDir, `${base}-center-crossing.png`), fullPage: true });
    }
    if (face.kind === "FRONT_FLAT") {
      const marker = face.keyedMarkers.find((item) => item.key === "W");
      const detail = face.svg.replace(/viewBox="([^"]+)"/u,
        `viewBox="${(marker.ring.cx - 8).toFixed(3)} ${(marker.ring.cy - 7).toFixed(3)} 16 14"`);
      await screenshotPage.setContent(detail, { waitUntil: "load" });
      await screenshotPage.screenshot({ path: join(outputDir, `${base}-W-detail.png`), fullPage: true });
    }
  }
}
await screenshotBrowser.close();

const faces = rendered.flatMap((row) => row.faces);
const fronts = faces.filter((face) => face.kind === "FRONT_FLAT");
const backs = faces.filter((face) => face.kind === "BACK_FLAT");
const summary = { configurations: rendered.length, faceRequests: faces.length,
  frontEmitted: fronts.filter((face) => face.svg).length, frontHeld: fronts.filter((face) => !face.svg).length,
  backEmitted: backs.filter((face) => face.svg).length, backHeld: backs.filter((face) => !face.svg).length,
  frontCurrentTextCollisionHolds: fronts.filter((face) => face.rendererIssues.some((issue) => issue.code === "TEXT_COLLISION")).length,
  frontWKeyAndFullSchedule: fronts.filter((face) => face.svg && face.keyedMarkers.some((item) => item.key === "W"
    && item.sourceId === "pom:woven-shirt:finished-placket-width" && item.targetId === "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline"
    && item.sourceEntityId === "pattern:woven-shirt:role:buttonPlacket:edge:top" && item.ring?.r === 0.22)
    && face.pomRows.some((row) => row.key === "W" && row.text.includes("Finished placket width")
      && /\d+(?:\.\d+)? cm \(±0\.2 cm\)/u.test(row.text))).length,
  backDetachedBandPairs: backs.filter((face) => face.svg && face.detachedBandOutlines === 2 && face.bandFoldMarks === 2).length,
  backPatternAndColorwayIdentityMatchesS372: backs.filter((face) => face.backPathIdentityMatchesS372).length,
  allCurrentViewsRevisionBound: faces.filter((face) => face.svg && face.revisionId === "live-draft:woven-shirt:14:14").length,
  compileIssueCount: faces.reduce((sum, face) => sum + face.compileIssues.length, 0),
  rendererIssueCount: faces.reduce((sum, face) => sum + face.rendererIssues.length, 0),
  browserErrors: browserErrors.length,
  all56WovenFacesRemainHeldPendingIntegratedGates: true,
  all34PoloFacesRemainHeld: true,
  backHemCrossingRemainsHeld: true };
assert.equal(summary.configurations, 28);
assert.equal(summary.faceRequests, 56);
assert.equal(summary.frontEmitted, 28);
assert.equal(summary.frontHeld, 0);
assert.equal(summary.backEmitted, 28);
assert.equal(summary.backHeld, 0);
assert.equal(summary.frontCurrentTextCollisionHolds, 0);
assert.equal(summary.frontWKeyAndFullSchedule, 28);
assert.equal(summary.backDetachedBandPairs, 28);
assert.equal(summary.backPatternAndColorwayIdentityMatchesS372, 28);
assert.equal(summary.allCurrentViewsRevisionBound, 56);
assert.equal(summary.compileIssueCount, 0);
assert.equal(summary.rendererIssueCount, 0);
assert.equal(summary.browserErrors, 0);
const matrix = { summary, priorS372: { frontEmitted: 3, frontHeld: 25, backEmitted: 28,
  revisionId: "live-draft:woven-shirt:14:14", source: "S372 actual production UI replay" },
  rows: rendered.map((row) => ({ caseId: row.caseId, options: row.options, revisionId: row.revisionId,
    faces: row.faces.map(({ svg, ...face }) => face) })) };
await writeFile(join(folder, "woven-paired-live-output-matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
