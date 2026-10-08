import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const JSDOM = require("jsdom").JSDOM;
const folder = fileURLToPath(new URL("./", import.meta.url));
const cases = JSON.parse(await readFile(new URL("../S363-woven-pom-leader-readability/production-replay/matrix.json", import.meta.url), "utf8"))
  .cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
assert.equal(cases.length, 28);
const oldBacks = await Promise.all(cases.map((item) => readFile(new URL(
  `../S401-woven-paired-live-output-review/rendered/${item.caseId}-back_flat-current.svg`, import.meta.url), "utf8")));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await page.goto(process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4191/", { waitUntil: "networkidle" });
const output = await page.evaluate(async ({ testCases }) => {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView },
    { renderTechnicalFlatSvg, createBrowserTechnicalFlatTextMeasurer }] = await Promise.all([
    import("/src/drafting/recipe.ts"), import("/src/drafting/measurements.ts"), import("/src/drafting/options.ts"),
    import("/src/render/technical-flat-live.ts"), import("/src/render/technical-flat-svg.ts"),
  ]);
  const recipe = GARMENTS.find((item) => item.name === "woven-shirt");
  if (!recipe) throw new Error("Woven recipe missing");
  const revisionId = "live-draft:woven-shirt:14:14";
  const measureText = createBrowserTechnicalFlatTextMeasurer(document);
  return testCases.map((testCase) => {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    return { caseId: testCase.caseId, options, faces: ["FRONT_FLAT", "BACK_FLAT"].map((kind) => {
      const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind, placements: [],
        colorHex: "#3669a4", texture: "woven", shine: 24 });
      if (!live.view) return { kind, compileIssues: live.issues, rendererIssues: [], svg: null };
      const rendered = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway,
        title: `Woven S457 ${kind} — ${testCase.caseId}` });
      if (!rendered.svg) return { kind, compileIssues: live.issues, rendererIssues: rendered.issues, svg: null };
      const root = new DOMParser().parseFromString(rendered.svg, "image/svg+xml").documentElement;
      const marker = root.querySelector("g[data-pom-key='D']");
      const ring = root.querySelector("g[data-marker-underlay-for='D'] circle");
      return { kind, compileIssues: live.issues, rendererIssues: rendered.issues,
        svg: new XMLSerializer().serializeToString(root), revisionId: root.getAttribute("data-revision-id"),
        sourcePathIdentities: [...root.querySelectorAll("path[data-entity-id]")].map((path) => [path.getAttribute("data-entity-id"),
          path.getAttribute("d"), path.getAttribute("data-source-id"), path.getAttribute("data-revision-id")]),
        marker: marker ? { key: marker.getAttribute("data-pom-key"), source: marker.getAttribute("data-source-id"),
          target: marker.getAttribute("data-callout-target"), sourceEntity: marker.getAttribute("data-callout-source-entity"),
          referenceEntities: marker.getAttribute("data-marker-source-entities"), glyphX: Number(marker.querySelector("text")?.getAttribute("x")),
          glyphY: Number(marker.querySelector("text")?.getAttribute("y")), ring: ring && {
            cx: Number(ring.getAttribute("cx")), cy: Number(ring.getAttribute("cy")), r: Number(ring.getAttribute("r")) } }
          : null,
        clips: [...root.querySelectorAll("path[data-view-clip]")].map((path) => ({ id: path.getAttribute("data-entity-id"),
          source: path.getAttribute("data-source-id"), decision: path.getAttribute("data-view-clip"), mask: path.getAttribute("mask") })),
        pomRows: [...root.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")].map((row) => ({
          id: row.getAttribute("data-schedule-for"), key: row.getAttribute("data-pom-key"), text: row.textContent,
          source: row.getAttribute("data-source-id"), target: row.getAttribute("data-callout-target"),
          sourceEntity: row.getAttribute("data-callout-source-entity") })),
        layerIds: [...root.querySelectorAll("[data-layer-group='GARMENT_SILHOUETTE'] > path[data-entity-id]")]
          .map((path) => path.getAttribute("data-entity-id")) };
    }) };
  });
}, { testCases: cases });
await browser.close();

const parser = new (new JSDOM().window.DOMParser)();
const identity = (svg) => [...parser.parseFromString(svg, "image/svg+xml").querySelectorAll("path[data-entity-id]")]
  .map((path) => [path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
    path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for")]);
const backs = [];
for (let index = 0; index < output.length; index += 1) {
  const back = output[index].faces.find((face) => face.kind === "BACK_FLAT");
  const before = oldBacks[index];
  back.backSvgByteIdentityMatchesS401 = !!back.svg && back.svg === before;
  back.backPathIdentityMatchesS401 = !!back.svg && JSON.stringify(identity(back.svg)) === JSON.stringify(identity(before));
  backs.push(back);
}

const renderDir = join(folder, "production-rendered");
const screenshotDir = join(renderDir, "png");
await mkdir(screenshotDir, { recursive: true });
const screenshots = await chromium.launch({ headless: true });
const screenshotPage = await screenshots.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
for (const row of output) for (const face of row.faces) if (face.svg) {
  await writeFile(join(renderDir, `${row.caseId}-${face.kind.toLowerCase()}.svg`), face.svg);
  if (!["woven-shirt-default", "woven-shirt-placketWidth-min", "woven-shirt-placketWidth-max", "woven-shirt-pocketWidth-max",
    "woven-shirt-collarLeafDepth-min", "woven-shirt-collarLeafDepth-max", "woven-shirt-combined-supported"].includes(row.caseId)) continue;
  await screenshotPage.setContent(face.svg, { waitUntil: "load" });
  await screenshotPage.screenshot({ path: join(screenshotDir, `${row.caseId}-${face.kind.toLowerCase()}-whole.png`), fullPage: true });
  if (face.kind === "FRONT_FLAT") {
    const crops = await screenshotPage.locator("svg").evaluate((root) => {
      const b = (selector) => [...root.querySelectorAll(selector)].map((node) => node.getBBox())
        .reduce((acc, box) => ({ minX: Math.min(acc.minX, box.x), minY: Math.min(acc.minY, box.y),
          maxX: Math.max(acc.maxX, box.x + box.width), maxY: Math.max(acc.maxY, box.y + box.height) }),
        { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
      const collar = b("path[data-source-id^='pattern:woven-shirt:role:outerStand'], path[data-source-id^='pattern:woven-shirt:role:underCollar'], path[data-source-id^='pattern:woven-shirt:role:upperCollar']");
      const marker = root.querySelector("g[data-marker-underlay-for='D'] circle");
      const collarBox = { x: collar.minX - 1, y: collar.minY - 0.7, width: collar.maxX - collar.minX + 2,
        height: collar.maxY - collar.minY + 2.6 };
      const pocket = b("path[data-source-id^='pattern:woven-shirt:role:pocket']");
      const pocketBox = { x: pocket.minX - 1, y: pocket.minY - 1, width: pocket.maxX - pocket.minX + 2,
        height: pocket.maxY - pocket.minY + 2 };
      const markerBox = marker ? { x: Number(marker.getAttribute("cx")) - 4, y: Number(marker.getAttribute("cy")) - 3,
        width: 8, height: 6 } : collarBox;
      return { collarBox, pocketBox, markerBox, full: root.getAttribute("viewBox") };
    });
    await screenshotPage.locator("svg").evaluate((root, box) => root.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`), crops.collarBox);
    await screenshotPage.screenshot({ path: join(screenshotDir, `${row.caseId}-front-flat-collar-closure-detail.png`), fullPage: true });
    if (row.caseId === "woven-shirt-pocketWidth-max") {
      await screenshotPage.locator("svg").evaluate((root, box) => root.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`), crops.pocketBox);
      await screenshotPage.screenshot({ path: join(screenshotDir, `${row.caseId}-front-flat-pocket-overlap-detail.png`), fullPage: true });
    }
    await screenshotPage.locator("svg").evaluate((root, box) => root.setAttribute("viewBox", `${box.x} ${box.y} ${box.width} ${box.height}`), crops.markerBox);
    await screenshotPage.screenshot({ path: join(screenshotDir, `${row.caseId}-front-flat-D-marker-detail.png`), fullPage: true });
    await screenshotPage.locator("svg").evaluate((root, box) => root.setAttribute("viewBox", box), crops.full);
  }
}
await screenshots.close();

const faces = output.flatMap((row) => row.faces);
const fronts = faces.filter((face) => face.kind === "FRONT_FLAT");
const summary = { sourceRevision: "live-draft:woven-shirt:14:14", configurations: output.length, faceRequests: faces.length,
  frontEmitted: fronts.filter((face) => face.svg).length, backEmitted: backs.filter((face) => face.svg).length,
  compileIssues: faces.reduce((total, face) => total + face.compileIssues.length, 0),
  rendererIssues: faces.reduce((total, face) => total + face.rendererIssues.length, 0), browserErrors: browserErrors.length,
  exactDMarkerAndFullSchedule: fronts.filter((face) => face.marker?.key === "D"
    && face.marker.source === "pom:woven-shirt:front-button-spacing"
    && face.marker.target === "flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1"
    && face.marker.sourceEntity === "pattern:woven-shirt:mark:buttonPlacket:button-1"
    && face.marker.referenceEntities === "pattern:woven-shirt:mark:buttonPlacket:button-1|pattern:woven-shirt:mark:buttonPlacket:button-2"
    && face.marker.ring?.r === 0.22
    && face.pomRows.some((row) => row.id === "flat:woven-shirt:FRONT_FLAT:callout:front-button-spacing"
      && row.text.includes("Front button spacing") && row.text.includes("(±0.2 cm)"))).length,
  frontClipCounts: fronts.map((face) => ({ caseId: output.find((row) => row.faces.includes(face))?.caseId, count: face.clips.length })),
  backSvgByteIdentityMatchesS401: backs.filter((face) => face.backSvgByteIdentityMatchesS401).length,
  backPathIdentityMatchesS401: backs.filter((face) => face.backPathIdentityMatchesS401).length,
  all56WovenViewsHeldPendingIntegratedGate: true };
assert.equal(summary.configurations, 28);
assert.equal(summary.faceRequests, 56);
assert.equal(summary.frontEmitted, 28);
assert.equal(summary.backEmitted, 28);
assert.equal(summary.exactDMarkerAndFullSchedule, 28);
assert.equal(summary.backSvgByteIdentityMatchesS401, 0, "local-Y candidate must differ from the unreflected S401 baseline");
assert.equal(summary.backPathIdentityMatchesS401, 0, "local-Y candidate must change the projected sleeve paths");
assert.equal(summary.compileIssues, 0);
assert.equal(summary.rendererIssues, 0);
assert.equal(summary.browserErrors, 0);
await writeFile(join(renderDir, "matrix.json"), `${JSON.stringify({ summary, cases: output }, null, 2)}\n`);
await writeFile(join(renderDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
