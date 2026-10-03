import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const baseline = JSON.parse(await readFile(new URL("../S363-woven-pom-leader-readability/production-replay/matrix.json", import.meta.url), "utf8"));
const cases = baseline.cases.filter((item) => item.caseId.startsWith("woven-shirt-"));
assert.equal(cases.length, 28);
const previewUrl = process.env.G04_PREVIEW_URL ?? "http://127.0.0.1:4190/";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1500, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
await page.goto(previewUrl, { waitUntil: "networkidle" });
const result = await page.evaluate(async (testCases) => {
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
  const calloutId = "flat:woven-shirt:FRONT_FLAT:callout:finished-placket-width";
  const targetId = "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline";
  const sourceEntityId = "pattern:woven-shirt:role:buttonPlacket:edge:top";
  const svgPaths = (svg) => {
    const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
    return [...parsed.querySelectorAll("path[data-entity-id]")].map((path) => [
      path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
      path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for"),
    ]);
  };
  const rows = [];
  for (const testCase of testCases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...testCase.options };
    const block = recipe.draft(STANDARD_M, options);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "FRONT_FLAT", placements: [],
      colorHex: "#3669a4", texture: "woven", shine: 24 });
    if (!live.view) throw new Error(`${testCase.caseId}: current source view did not compile`);
    const callouts = live.view.primitives.filter((primitive) => primitive.kind === "callout");
    const matches = callouts.filter((primitive) => primitive.source.sourceId === sourceId);
    if (matches.length !== 1) throw new Error(`${testCase.caseId}: expected one exact Woven POM, found ${matches.length}`);
    const pom = matches[0];
    if (pom.id !== calloutId || pom.anchor.primitiveId !== targetId || pom.anchor.sourceEntityId !== sourceEntityId
      || pom.source.revisionId !== revisionId || pom.source.sourceClass !== "PATTERN_DERIVED") {
      throw new Error(`${testCase.caseId}: current POM identity/target/revision differs from S374 source trace`);
    }
    if (pom.presentation) throw new Error(`${testCase.caseId}: source POM already has a presentation convention`);
    const candidatePom = { ...pom, layer: "ANNOTATION", presentation: {
      kind: "keyed-marker-schedule", key: "W", markerRadiusCm: 0.22, markerStyle: "open-halo",
    } };
    const candidateView = { ...live.view, primitives: live.view.primitives.map((primitive) =>
      primitive.id === pom.id ? candidatePom : primitive) };
    const baselineView = { ...live.view, primitives: live.view.primitives.filter((primitive) => primitive.id !== pom.id) };
    const originalRender = renderTechnicalFlatSvg(live.view, { measureText, colorway: live.colorway,
      title: `Woven S395 original — ${testCase.caseId}` });
    const baselineRender = renderTechnicalFlatSvg(baselineView, { measureText, colorway: live.colorway,
      title: `Woven S395 baseline — ${testCase.caseId}` });
    const rendered = renderTechnicalFlatSvg(candidateView, { measureText, colorway: live.colorway,
      title: `Woven S395 keyed W candidate — ${testCase.caseId}` });
    if (!baselineRender.svg) throw new Error(`${testCase.caseId}: geometry-only baseline failed: ${JSON.stringify(baselineRender.issues)}`);
    let marker = null, schedule = null, textMetrics = null;
    if (rendered.svg) {
      const host = document.createElement("div");
      host.style.cssText = "position:fixed;left:-20000px;top:0;width:1px;height:1px;overflow:hidden";
      host.innerHTML = rendered.svg;
      document.body.append(host);
      const root = host.querySelector("svg");
      const group = root.querySelector("g[data-pom-key='W']");
      const circle = group?.querySelector("circle");
      const glyph = group?.querySelector("text");
      const row = root.querySelector(`[data-schedule-for='${pom.id}']`);
      if (!group || !circle || !glyph || !row) throw new Error(`${testCase.caseId}: W marker or schedule row missing`);
      const glyphBox = glyph.getBBox();
      const gap = (a, b) => Math.hypot(Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width)),
        Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height)));
      const textCandidates = [...root.querySelectorAll("text[data-label-for]")].map((node) => ({
        id: node.getAttribute("data-label-for"), text: node.textContent, box: node.getBBox(),
      }));
      const pathCandidates = [...root.querySelectorAll("path[data-entity-id]")]
        .filter((path) => path.getAttribute("data-source-id")?.startsWith("pattern:woven-shirt:"))
        .map((path) => {
          const box = path.getBBox(), total = path.getTotalLength(), steps = Math.max(1, Math.ceil(total / 0.02));
          let clearance = Infinity;
          let ringClearance = Infinity;
          for (let index = 0; index <= steps; index += 1) {
            const point = path.getPointAtLength(total * index / steps);
            const distance = Math.hypot(Math.max(0, glyphBox.x - point.x, point.x - glyphBox.x - glyphBox.width),
              Math.max(0, glyphBox.y - point.y, point.y - glyphBox.y - glyphBox.height));
            clearance = Math.min(clearance, distance - Number.parseFloat(path.getAttribute("stroke-width") ?? "0") / 2);
            ringClearance = Math.min(ringClearance, Math.hypot(point.x - Number(circle.getAttribute("cx")),
              point.y - Number(circle.getAttribute("cy"))) - Number(circle.getAttribute("r"))
              - Number.parseFloat(path.getAttribute("stroke-width") ?? "0") / 2);
          }
          return { id: path.getAttribute("data-entity-id"), sourceId: path.getAttribute("data-source-id"), box,
            glyphClearanceCm: clearance, ringClearanceCm: ringClearance, element: path };
        });
      const sourceMarkPaths = pathCandidates.filter((path) => path.sourceId.includes(":mark:"));
      const allOtherPaths = pathCandidates.filter((path) => path.id !== targetId);
      const nearest = (items, clearance) => items.sort((a, b) => clearance(a) - clearance(b))[0] ?? null;
      const refineRingClearance = (item) => {
        if (!item) return null;
        const total = item.element.getTotalLength(), steps = Math.max(1, Math.ceil(total / 0.001));
        let ringClearanceCm = Infinity;
        for (let index = 0; index <= steps; index += 1) {
          const point = item.element.getPointAtLength(total * index / steps);
          ringClearanceCm = Math.min(ringClearanceCm, Math.hypot(point.x - Number(circle.getAttribute("cx")),
            point.y - Number(circle.getAttribute("cy"))) - Number(circle.getAttribute("r"))
            - Number.parseFloat(item.element.getAttribute("stroke-width") ?? "0") / 2);
        }
        return { id: item.id, sourceId: item.sourceId, box: item.box,
          glyphClearanceCm: item.glyphClearanceCm, ringClearanceCm };
      };
      const sourceGlyphText = textCandidates.filter((item) => item.id !== pom.id);
      const parsedSchedule = [...root.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")]
        .map((item) => ({ id: item.getAttribute("data-schedule-for"), text: item.textContent,
          sourceId: item.getAttribute("data-source-id"), revisionId: item.getAttribute("data-revision-id"),
          targetId: item.getAttribute("data-callout-target") }));
      marker = { key: group.getAttribute("data-pom-key"), sourceId: group.getAttribute("data-source-id"),
        revisionId: group.getAttribute("data-revision-id"), targetId: group.getAttribute("data-callout-target"),
        cx: Number(circle.getAttribute("cx")), cy: Number(circle.getAttribute("cy")), r: Number(circle.getAttribute("r")),
        glyph: glyph.textContent, glyphX: Number(glyph.getAttribute("x")), glyphY: Number(glyph.getAttribute("y")),
        glyphBox: { x: glyphBox.x, y: glyphBox.y, width: glyphBox.width, height: glyphBox.height },
        nearestOtherPath: refineRingClearance(nearest(allOtherPaths, (item) => item.ringClearanceCm)),
        nearestMark: refineRingClearance(nearest(sourceMarkPaths, (item) => item.ringClearanceCm)),
        nearestOtherLabel: nearest(sourceGlyphText, (item) => gap(glyphBox, item.box)) && (() => {
          const item = nearest(sourceGlyphText, (candidate) => gap(glyphBox, candidate.box));
          return item ? { id: item.id, text: item.text, clearanceCm: gap(glyphBox, item.box) } : null;
        })() };
      const svg = root;
      const scheduleBox = svg.querySelector("g[data-layer-group='POM_SCHEDULE'] rect")?.getBBox();
      schedule = { rowCount: parsedSchedule.length, exactPOMRow: parsedSchedule.find((item) => item.id === pom.id),
        rows: parsedSchedule, box: scheduleBox ? { x: scheduleBox.x, y: scheduleBox.y, width: scheduleBox.width, height: scheduleBox.height } : null,
        overflow: parsedSchedule.some((item) => {
          const node = svg.querySelector(`[data-schedule-for='${item.id}']`);
          if (!node || !scheduleBox) return true;
          const b = node.getBBox();
          return b.x < scheduleBox.x || b.y + b.height > scheduleBox.y + scheduleBox.height;
        }) };
      textMetrics = { pathCount: pathCandidates.length,
        sourceMarkPathCount: sourceMarkPaths.length,
        colorwayGroups: root.querySelectorAll("[data-colorway-area-group]").length,
        sourceLabels: textCandidates.length };
      host.remove();
    }
    rows.push({ caseId: testCase.caseId, options, revisionId, sourcePOM: {
      id: pom.id, sourceId: pom.source.sourceId, sourceClass: pom.source.sourceClass, revisionId: pom.source.revisionId,
      fullText: pom.text, layerBefore: pom.layer, anchor: pom.anchor, targetId: pom.anchor.primitiveId,
      sourceEntityId: pom.anchor.sourceEntityId, measure: block.poms?.find((candidate) => candidate.label === "Finished placket width")?.value,
    }, originalIssues: originalRender.issues, originalStatus: originalRender.svg ? "rendered" : "held-render-failure",
    geometryOnlyIssues: baselineRender.issues, candidateIssues: rendered.issues, candidateStatus: rendered.svg ? "rendered" : "held-render-failure",
    geometryPathIdentityUnchanged: rendered.svg ? JSON.stringify(svgPaths(baselineRender.svg)) === JSON.stringify(svgPaths(rendered.svg)) : false,
    marker, schedule, output: rendered.svg, textMetrics });
  }
  return { configurations: testCases.length, rows, browserErrors: [] };
}, cases);
await browser.close();
assert.equal(result.rows.length, 28);
assert.deepEqual(browserErrors, []);
const renderedDir = join(outputDir, "rendered");
await mkdir(renderedDir, { recursive: true });
const summaries = result.rows.map(({ output, ...row }) => row);
for (const row of result.rows ) if (row.output) {
  await writeFile(join(renderedDir, `${row.caseId}-keyed-W-candidate.svg`), row.output);
}
const screenshotBrowser = await chromium.launch({ headless: true });
const screenshotPage = await screenshotBrowser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const screenshotErrors = [];
screenshotPage.on("pageerror", (error) => screenshotErrors.push(error.message));
screenshotPage.on("console", (message) => { if (message.type() === "error") screenshotErrors.push(message.text()); });
for (const row of result.rows ) if (row.output
  && ["woven-shirt-default", "woven-shirt-combined-supported", "woven-shirt-standHeight-max", "woven-shirt-sleeveBandDepth-max", "woven-shirt-placketWidth-min"].includes(row.caseId)) {
  const stem = `${row.caseId}-keyed-W-candidate`;
  await screenshotPage.setContent(row.output, { waitUntil: "load" });
  await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-whole.png`), fullPage: true });
  const point = row.marker;
  const detail = row.output.replace(/viewBox="([^"]+)"/u,
    `viewBox="${(point.cx - 8).toFixed(3)} ${(point.cy - 7).toFixed(3)} 16 14"`);
  await screenshotPage.setContent(detail, { waitUntil: "load" });
  await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-detail.png`), fullPage: true });
  const scheduleBox = row.schedule.box;
  if (scheduleBox) {
    const schedule = row.output.replace(/viewBox="([^"]+)"/u,
      `viewBox="${(scheduleBox.x - 0.5).toFixed(3)} ${(scheduleBox.y - 0.4).toFixed(3)} ${(scheduleBox.width + 1).toFixed(3)} ${(scheduleBox.height + 0.8).toFixed(3)}"`);
    await screenshotPage.setContent(schedule, { waitUntil: "load" });
    await screenshotPage.screenshot({ path: join(renderedDir, `${stem}-schedule.png`), fullPage: true });
  }
}
await screenshotBrowser.close();
assert.deepEqual(screenshotErrors, []);
const summary = { configurations: result.rows.length, exactRevisionRows: result.rows.filter((row) => row.revisionId === "live-draft:woven-shirt:14:14").length,
  candidateRenders: result.rows.filter((row) => row.candidateStatus === "rendered").length,
  candidateRendererFailures: result.rows.filter((row) => row.candidateStatus !== "rendered").map((row) => ({ caseId: row.caseId, issues: row.candidateIssues })),
  originalRendererFailures: result.rows.filter((row) => row.originalStatus !== "rendered").map((row) => ({ caseId: row.caseId, issues: row.originalIssues })),
  originalIssueRows: result.rows.filter((row) => row.originalIssues.length).map((row) => ({ caseId: row.caseId, issues: row.originalIssues })),
  geometryOnlyBaselineFailures: result.rows.filter((row) => row.geometryOnlyIssues.length).map((row) => ({ caseId: row.caseId, issues: row.geometryOnlyIssues })),
  geometryPreserved: result.rows.filter((row) => row.geometryPathIdentityUnchanged).length,
  exactWMarkers: result.rows.filter((row) => row.marker?.key === "W" && Math.abs(row.marker.cx - row.sourcePOM.anchor.point.x) < 0.00011
    && Math.abs(row.marker.cy - row.sourcePOM.anchor.point.y) < 0.00011 && row.marker.r === 0.22).length,
  exactScheduleRows: result.rows.filter((row) => row.schedule?.exactPOMRow?.text === `W  ${row.sourcePOM.fullText}`
    && row.schedule.rowCount === 1 && !row.schedule.overflow).length,
  colorwayRows: result.rows.filter((row) => row.textMetrics?.colorwayGroups > 0).length,
  sourcePathRingOverlaps: result.rows.filter((row) => row.marker?.nearestOtherPath?.ringClearanceCm < 0)
    .map((row) => ({ caseId: row.caseId, pathId: row.marker.nearestOtherPath.id,
      clearanceCm: row.marker.nearestOtherPath.ringClearanceCm })),
  sourcePathRingNearContacts: result.rows.filter((row) => row.marker?.nearestOtherPath?.ringClearanceCm >= 0
    && row.marker.nearestOtherPath.ringClearanceCm <= 0.01).map((row) => ({ caseId: row.caseId,
    pathId: row.marker.nearestOtherPath.id, clearanceCm: row.marker.nearestOtherPath.ringClearanceCm })),
  minimumIndependentPathRingClearanceCm: Math.min(...result.rows.map((row) => row.marker.nearestOtherPath.ringClearanceCm)),
  minimumSourceMarkRingClearanceCm: Math.min(...result.rows.map((row) => row.marker.nearestMark.ringClearanceCm)),
  visualSafetyPass: result.rows.every((row) => row.marker?.nearestOtherPath?.ringClearanceCm > 0.01),
  visualSafetyDisposition: "No-go: source-centered 0.22 cm ring overlaps or nearly contacts the independent front neckline in the supported option matrix.",
  browserErrors: browserErrors.length + screenshotErrors.length,
  nonSourceDisplayProposal: { key: "W", markerStyle: "open-halo", markerRadiusCm: 0.22,
    markerCenter: "exact current source-bound POM anchor at buttonPlacket.top midpoint", schedule: "complete unchanged source POM text once in keyed schedule", leader: "none" },
  allFacesHeld: true, sourceOrStitchGraphChanges: 0, productionMappingImplemented: false };
await writeFile(join(outputDir, "woven-keyed-marker-feasibility.json"), `${JSON.stringify({ summary, rows: summaries }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
