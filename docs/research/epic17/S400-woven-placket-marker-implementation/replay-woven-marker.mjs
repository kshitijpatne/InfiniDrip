import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = fileURLToPath(new URL("./", import.meta.url));
const baseline = JSON.parse(await readFile(new URL("../S363-woven-pom-leader-readability/production-replay/matrix.json", import.meta.url), "utf8"));
const cases = baseline.cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
assert.equal(cases.length, 28);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await page.goto(process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4190/", { waitUntil: "networkidle" });
const results = await page.evaluate(async (testCases) => {
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
  const sourceId = "pom:woven-shirt:finished-placket-width";
  const targetId = "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline";
  const sourceEntityId = "pattern:woven-shirt:role:buttonPlacket:edge:top";
  const rows = [];
  for (const testCase of testCases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT", placements: [],
      colorHex: "#3669a4", texture: "woven", shine: 24 });
    if (!live.view) throw new Error(`${testCase.caseId}: current source view failed to compile`);
    const pom = live.view.primitives.filter((primitive) => primitive.kind === "callout" && primitive.source.sourceId === sourceId);
    if (pom.length !== 1 || pom[0].anchor.primitiveId !== targetId || pom[0].anchor.sourceEntityId !== sourceEntityId
      || pom[0].source.revisionId !== revisionId || pom[0].source.sourceClass !== "PATTERN_DERIVED"
      || pom[0].layer !== "ANNOTATION" || pom[0].presentation?.kind !== "keyed-marker-schedule"
      || pom[0].presentation.key !== "W" || pom[0].presentation.markerRadiusCm !== 0.22) {
      throw new Error(`${testCase.caseId}: approved production source-to-view W mapping is missing or identity changed`);
    }
    const rendered = renderTechnicalFlatSvg(live.view,
      { measureText, colorway: live.colorway, title: `Woven S400 — ${testCase.caseId}` });
    if (!rendered.svg) throw new Error(`${testCase.caseId}: renderer failed: ${JSON.stringify(rendered.issues)}`);
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-20000px;top:0;width:1px;height:1px;overflow:hidden";
    host.innerHTML = rendered.svg;
    document.body.append(host);
    const svg = host.querySelector("svg");
    const silhouette = svg.querySelector("g[data-layer-group='GARMENT_SILHOUETTE']");
    const fill = silhouette.querySelector("[data-colorway-area-group]");
    const underlay = silhouette.querySelector("g[data-marker-underlay-for='W']");
    const ring = underlay?.querySelector("circle");
    const marker = svg.querySelector("g[data-pom-key='W']");
    const glyph = marker?.querySelector("text");
    const sourcePaths = [...svg.querySelectorAll("path[data-entity-id][data-source-id^='pattern:woven-shirt:']")];
    const sourcePathIdentity = sourcePaths.map((path) => [path.getAttribute("data-entity-id"), path.getAttribute("d"),
      path.getAttribute("data-source-id"), path.getAttribute("data-revision-id")]);
    const underlayIndex = [...silhouette.children].indexOf(underlay);
    const fillIndex = [...silhouette.children].indexOf(fill);
    const sourceStrokeOverRing = sourcePaths.length > 0 && sourcePaths.every((path) =>
      (underlay.compareDocumentPosition(path) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
    const schedule = [...svg.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")]
      .map((node) => ({ id: node.getAttribute("data-schedule-for"), text: node.textContent,
        sourceId: node.getAttribute("data-source-id"), revisionId: node.getAttribute("data-revision-id"),
        targetId: node.getAttribute("data-callout-target") }));
    const scheduleRect = svg.querySelector("g[data-layer-group='POM_SCHEDULE'] rect")?.getBBox();
    const row = schedule.find((item) => item.id === pom[0].id);
    const rowNode = row && svg.querySelector(`[data-schedule-for='${row.id}']`);
    const rowBox = rowNode?.getBBox();
    const labelBox = glyph?.getBBox();
    const measureGap = (a, b) => Math.hypot(Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width)),
      Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height)));
    const unrelatedLabels = [...svg.querySelectorAll("text[data-label-for]")].map((node) => ({
      id: node.getAttribute("data-label-for"), box: node.getBBox(), text: node.textContent,
    }));
    let glyphPathClearance = Infinity;
    if (labelBox) for (const path of sourcePaths) {
      const length = path.getTotalLength(), steps = Math.max(1, Math.ceil(length / 0.02));
      for (let index = 0; index <= steps; index += 1) {
        const point = path.getPointAtLength(length * index / steps);
        glyphPathClearance = Math.min(glyphPathClearance,
          Math.hypot(Math.max(0, labelBox.x - point.x, point.x - labelBox.x - labelBox.width),
            Math.max(0, labelBox.y - point.y, point.y - labelBox.y - labelBox.height))
          - Number.parseFloat(path.getAttribute("stroke-width") ?? "0") / 2);
      }
    }
    const nearestLabel = labelBox ? unrelatedLabels.map((item) => ({ ...item, gapCm: measureGap(labelBox, item.box) }))
      .sort((a, b) => a.gapCm - b.gapCm)[0] ?? null : null;
    const colorwayPaths = [...svg.querySelectorAll("path[data-colorway-fill-for]")].map((path) => [
      path.getAttribute("data-colorway-fill-for"), path.getAttribute("d"), path.getAttribute("data-source-id"),
    ]);
    const originalView = renderTechnicalFlatSvg({ ...live.view,
      primitives: live.view.primitives.filter((primitive) => primitive.id !== pom[0].id) },
    { measureText, colorway: live.colorway });
    if (!originalView.svg) throw new Error(`${testCase.caseId}: baseline renderer failed`);
    const original = new DOMParser().parseFromString(originalView.svg, "image/svg+xml");
    const originalPaths = [...original.querySelectorAll("path[data-entity-id]")].map((path) => [
      path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
      path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for"),
    ]);
    const currentPaths = [...svg.querySelectorAll("path[data-entity-id]")].map((path) => [
      path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
      path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for"),
    ]);
    const rowClear = !!rowBox && !!scheduleRect && rowBox.x >= scheduleRect.x && rowBox.y + rowBox.height <= scheduleRect.y + scheduleRect.height;
    rows.push({ caseId: testCase.caseId, options, revisionId, sourcePOM: { id: pom[0].id, sourceId, sourceClass: pom[0].source.sourceClass,
      revisionId: pom[0].source.revisionId, fullText: pom[0].text, anchor: pom[0].anchor, targetId,
      mappedPresentation: { layer: pom[0].layer, key: pom[0].presentation.key,
        markerRadiusCm: pom[0].presentation.markerRadiusCm, markerStyle: pom[0].presentation.markerStyle } },
      rendererIssues: rendered.issues, sourcePathCount: sourcePaths.length, sourceStrokeOverRing, underlayAfterColorway: underlayIndex > fillIndex,
      ring: ring ? { cx: Number(ring.getAttribute("cx")), cy: Number(ring.getAttribute("cy")), r: Number(ring.getAttribute("r")),
        sourceId: underlay.getAttribute("data-source-id"), revisionId: underlay.getAttribute("data-revision-id") } : null,
      marker: marker ? { key: marker.getAttribute("data-pom-key"), sourceId: marker.getAttribute("data-source-id"),
        targetId: marker.getAttribute("data-callout-target"), sourceEntityId: marker.getAttribute("data-callout-source-entity"),
        revisionId: marker.getAttribute("data-revision-id"), glyph: glyph?.textContent, glyphX: Number(glyph?.getAttribute("x")),
        glyphY: Number(glyph?.getAttribute("y")), foregroundRingCount: marker.querySelectorAll("circle").length,
        glyphPathClearanceCm: glyphPathClearance, nearestLabel } : null,
      scheduleRows: schedule.length, scheduleBox: scheduleRect ? { x: scheduleRect.x, y: scheduleRect.y,
        width: scheduleRect.width, height: scheduleRect.height } : null,
      exactSchedule: !!row && row.text === `W  ${pom[0].text}` && row.sourceId === sourceId
        && row.revisionId === revisionId && row.targetId === targetId, scheduleInsideFrame: rowClear,
      colorwayPathIdentityUnchanged: JSON.stringify(colorwayPaths) === JSON.stringify([...original.querySelectorAll("path[data-colorway-fill-for]")]
        .map((path) => [path.getAttribute("data-colorway-fill-for"), path.getAttribute("d"), path.getAttribute("data-source-id")])),
      allPathIdentityUnchanged: JSON.stringify(originalPaths) === JSON.stringify(currentPaths), output: new XMLSerializer().serializeToString(svg) });
    host.remove();
  }
  return rows;
}, cases);
await browser.close();
assert.equal(results.length, 28);
assert.deepEqual(browserErrors, []);
const renderedDir = join(rootDir, "rendered");
await mkdir(renderedDir, { recursive: true });
const retained = [];
const screenshotBrowser = await chromium.launch({ headless: true });
const screenshotPage = await screenshotBrowser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const screenshotErrors = [];
screenshotPage.on("pageerror", (error) => screenshotErrors.push(error.message));
screenshotPage.on("console", (message) => { if (message.type() === "error") screenshotErrors.push(message.text()); });
for (const row of results) {
  const out = row.output;
  await writeFile(join(renderedDir, `${row.caseId}-woven-W.svg`), out);
  if (["woven-shirt-default", "woven-shirt-placketWidth-min", "woven-shirt-neckEase-max", "woven-shirt-combined-supported"].includes(row.caseId)) {
    const stem = `${row.caseId}-woven-W`;
    await screenshotPage.setContent(out, { waitUntil: "load" });
    await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-whole.png`), fullPage: true });
    const detail = out.replace(/viewBox="([^"]+)"/u, `viewBox="${(row.ring.cx - 8).toFixed(3)} ${(row.ring.cy - 7).toFixed(3)} 16 14"`);
    await screenshotPage.setContent(detail, { waitUntil: "load" });
    await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-detail.png`), fullPage: true });
    const schedule = out.replace(/viewBox="([^"]+)"/u,
      `viewBox="${(row.scheduleBox.x - 0.5).toFixed(3)} ${(row.scheduleBox.y - 0.4).toFixed(3)} ${(row.scheduleBox.width + 1).toFixed(3)} ${(row.scheduleBox.height + 0.8).toFixed(3)}"`);
    await screenshotPage.setContent(schedule, { waitUntil: "load" });
    await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-schedule.png`), fullPage: true });
  }
  const { output, sourcePOM, ...summary } = row;
  retained.push(summary);
}
await screenshotBrowser.close();
assert.deepEqual(screenshotErrors, []);
const summary = { configurations: results.length,
  rendered: results.filter((row) => row.rendererIssues.length === 0 && row.output).length,
  exactSourcePOM: results.filter((row) => row.sourcePOM.sourceId === "pom:woven-shirt:finished-placket-width"
    && row.sourcePOM.targetId === "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline"
    && row.sourcePOM.anchor.sourceEntityId === "pattern:woven-shirt:role:buttonPlacket:edge:top").length,
  liveCompilerMappedCallout: results.filter((row) => row.sourcePOM.mappedPresentation.layer === "ANNOTATION"
    && row.sourcePOM.mappedPresentation.key === "W" && row.sourcePOM.mappedPresentation.markerRadiusCm === 0.22
    && row.sourcePOM.mappedPresentation.markerStyle === "open-halo").length,
  underlayAfterColorway: results.filter((row) => row.underlayAfterColorway).length,
  ringBelowEverySourceStroke: results.filter((row) => row.sourceStrokeOverRing).length,
  exactRingAndGlyph: results.filter((row) => Math.abs(row.ring?.cx - row.sourcePOM.anchor.point.x) < 0.00011
    && Math.abs(row.ring?.cy - row.sourcePOM.anchor.point.y) < 0.00011 && row.ring?.r === 0.22
    && Math.abs(row.marker?.glyphX - row.ring.cx - 0.2121) < 0.00011
    && Math.abs(row.marker?.glyphY - row.ring.cy - 0.2821) < 0.00011
    && row.marker?.foregroundRingCount === 0).length,
  exactSchedule: results.filter((row) => row.exactSchedule && row.scheduleRows === 1 && row.scheduleInsideFrame).length,
  allPathIdentityUnchanged: results.filter((row) => row.allPathIdentityUnchanged && row.colorwayPathIdentityUnchanged).length,
  minimumGlyphToSourcePathClearanceCm: Math.min(...results.map((row) => row.marker.glyphPathClearanceCm)),
  minimumGlyphToExistingLabelClearanceCm: Math.min(...results.map((row) => row.marker.nearestLabel.gapCm)),
  browserErrors: browserErrors.length + screenshotErrors.length,
  all56WovenAnd34PoloFacesRemainHeld: true,
  independentWovenBackHemCrossingRemainsHeld: true };
assert.equal(summary.rendered, 28);
assert.equal(summary.exactSourcePOM, 28);
assert.equal(summary.liveCompilerMappedCallout, 28);
assert.equal(summary.underlayAfterColorway, 28);
assert.equal(summary.ringBelowEverySourceStroke, 28);
assert.equal(summary.exactRingAndGlyph, 28);
assert.equal(summary.exactSchedule, 28);
assert.equal(summary.allPathIdentityUnchanged, 28);
assert.equal(summary.browserErrors, 0);
assert(summary.minimumGlyphToSourcePathClearanceCm > 0);
assert(summary.minimumGlyphToExistingLabelClearanceCm > 0);
await writeFile(join(rootDir, "woven-W-actual-renderer-matrix.json"), `${JSON.stringify({ summary, rows: retained }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
