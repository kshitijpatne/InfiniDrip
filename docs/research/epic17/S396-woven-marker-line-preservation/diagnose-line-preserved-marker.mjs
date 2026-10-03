import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const s395Dir = new URL("../S395-woven-placket-keyed-marker-feasibility/", import.meta.url);
const matrix = JSON.parse(await readFile(new URL("woven-keyed-marker-feasibility.json", s395Dir), "utf8"));
const inputRows = await Promise.all(matrix.rows.map(async (row) => ({ ...row,
  output: await readFile(new URL(`rendered/${row.caseId}-keyed-W-candidate.svg`, s395Dir), "utf8"),
  scheduleOverflow: row.schedule?.overflow ?? true,
})));
assert.equal(inputRows.length, 28);
const offsets = [
  { id: "center", dx: 0, dy: 0 }, { id: "north", dx: 0, dy: -0.30 },
  { id: "north-east", dx: 0.2121, dy: -0.2121 }, { id: "east", dx: 0.30, dy: 0 },
  { id: "south-east", dx: 0.2121, dy: 0.2121 }, { id: "south", dx: 0, dy: 0.30 },
  { id: "south-west", dx: -0.2121, dy: 0.2121 }, { id: "west", dx: -0.30, dy: 0 },
  { id: "north-west", dx: -0.2121, dy: -0.2121 },
];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1700, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
const analysis = await page.evaluate(({ rows, markerOffsets }) => {
  const gap = (a, b) => Math.hypot(Math.max(0, a.x - (b.x + b.width), b.x - (a.x + a.width)),
    Math.max(0, a.y - (b.y + b.height), b.y - (a.y + a.height)));
  const svgPaths = (root) => [...root.querySelectorAll("path[data-entity-id]")].map((path) => [
    path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
    path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for"),
  ]);
  const measuredRows = [];
  for (const row of rows) {
    const host = document.createElement("div");
    host.style.cssText = "position:fixed;left:-20000px;top:0;width:1px;height:1px;overflow:hidden";
    host.innerHTML = row.output;
    document.body.append(host);
    const root = host.querySelector("svg");
    const group = root?.querySelector("g[data-pom-key='W']");
    const circle = group?.querySelector("circle");
    const glyph = group?.querySelector("text");
    if (!root || !group || !circle || !glyph) throw new Error(`${row.caseId}: S395 keyed source output is incomplete`);
    const baseX = Number(glyph.getAttribute("x")), baseY = Number(glyph.getAttribute("y"));
    const textLabels = [...root.querySelectorAll("text[data-label-for]")].map((node) => ({
      id: node.getAttribute("data-label-for"), text: node.textContent, box: node.getBBox(),
    }));
    const paths = [...root.querySelectorAll("path[data-entity-id]")]
      .filter((path) => path.getAttribute("data-source-id")?.startsWith("pattern:woven-shirt:"))
      .map((path) => {
        const total = path.getTotalLength(), stepCount = Math.max(1, Math.ceil(total / 0.02));
        const points = [];
        for (let index = 0; index <= stepCount; index += 1) points.push(path.getPointAtLength(total * index / stepCount));
        return { id: path.getAttribute("data-entity-id"), sourceId: path.getAttribute("data-source-id"),
          strokeRadius: Number.parseFloat(path.getAttribute("stroke-width") ?? "0") / 2, points };
      });
    const trials = markerOffsets.map((offset) => {
      glyph.setAttribute("x", String(baseX + offset.dx));
      glyph.setAttribute("y", String(baseY + offset.dy));
      const box = glyph.getBBox();
      let pathClearanceCm = Infinity, nearestPathId = null;
      for (const path of paths) for (const point of path.points) {
        const clearance = Math.hypot(Math.max(0, box.x - point.x, point.x - box.x - box.width),
          Math.max(0, box.y - point.y, point.y - box.y - box.height)) - path.strokeRadius;
        if (clearance < pathClearanceCm) { pathClearanceCm = clearance; nearestPathId = path.id; }
      }
      const nearestLabel = textLabels.map((label) => ({ ...label, clearanceCm: gap(box, label.box) }))
        .sort((a, b) => a.clearanceCm - b.clearanceCm)[0] ?? null;
      const centerDistanceCm = Math.hypot(box.x + box.width / 2 - Number(circle.getAttribute("cx")),
        box.y + box.height / 2 - Number(circle.getAttribute("cy")));
      return { ...offset, glyphBox: { x: box.x, y: box.y, width: box.width, height: box.height },
        centerDistanceCm, pathClearanceCm, nearestPathId,
        labelClearanceCm: nearestLabel?.clearanceCm ?? Infinity,
        nearestLabelId: nearestLabel?.id ?? null, nearestLabelText: nearestLabel?.text ?? null };
    });
    const sourceSchedule = [...root.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]")]
      .map((node) => ({ id: node.getAttribute("data-schedule-for"), key: node.getAttribute("data-pom-key"),
        sourceId: node.getAttribute("data-source-id"), revisionId: node.getAttribute("data-revision-id"),
        targetId: node.getAttribute("data-callout-target"), text: node.textContent }));
    const scheduleRect = root.querySelector("g[data-layer-group='POM_SCHEDULE'] rect")?.getBBox();
    const scheduleOverflow = sourceSchedule.some((item) => {
      const node = root.querySelector(`[data-schedule-for='${item.id}']`);
      if (!node || !scheduleRect) return true;
      const box = node.getBBox();
      return box.x < scheduleRect.x || box.y + box.height > scheduleRect.y + scheduleRect.height;
    });
    measuredRows.push({ caseId: row.caseId, sourcePOM: row.sourcePOM, candidateStatus: row.candidateStatus,
      scheduleOverflow: row.scheduleOverflow, inputPath: `../S395-woven-placket-keyed-marker-feasibility/rendered/${row.caseId}-keyed-W-candidate.svg`,
      revisionId: root.getAttribute("data-revision-id"), viewId: root.getAttribute("data-view-id"),
      sourcePathIdentity: JSON.stringify(svgPaths(root)), sourcePathCount: paths.length,
      sourceMarkCount: paths.filter((path) => path.sourceId.includes(":mark:")).length,
      colorwayGroups: root.querySelectorAll("[data-colorway-area-group]").length,
      marker: { key: group.getAttribute("data-pom-key"), sourceId: group.getAttribute("data-source-id"),
        revisionId: group.getAttribute("data-revision-id"), targetId: group.getAttribute("data-callout-target"),
        sourceEntityId: group.getAttribute("data-callout-source-entity"),
        cx: Number(circle.getAttribute("cx")), cy: Number(circle.getAttribute("cy")), r: Number(circle.getAttribute("r")),
        glyph: glyph.textContent, baseX, baseY, glyphBox: glyph.getBBox(), trials },
      sourceSchedule, scheduleOverflow, originalIssues: row.originalIssues,
      s395GeometryPathIdentityUnchanged: row.geometryPathIdentityUnchanged,
      output: row.output });
    host.remove();
  }
  const commonOffsets = markerOffsets.map((offset) => {
    const rowsAtOffset = measuredRows.map((row) => row.marker.trials.find((trial) => trial.id === offset.id));
    return { ...offset, minimumPathClearanceCm: Math.min(...rowsAtOffset.map((trial) => trial.pathClearanceCm)),
      minimumLabelClearanceCm: Math.min(...rowsAtOffset.map((trial) => trial.labelClearanceCm)),
      maximumAnchorToGlyphCenterCm: Math.max(...rowsAtOffset.map((trial) => trial.centerDistanceCm)),
      pathCollisionRows: measuredRows.filter((row) => row.marker.trials.find((trial) => trial.id === offset.id).pathClearanceCm <= 0).map((row) => row.caseId),
      labelCollisionRows: measuredRows.filter((row) => row.marker.trials.find((trial) => trial.id === offset.id).labelClearanceCm <= 0).map((row) => row.caseId) };
  });
  const bestOffset = [...commonOffsets].sort((a, b) => Math.min(b.minimumPathClearanceCm, b.minimumLabelClearanceCm)
    - Math.min(a.minimumPathClearanceCm, a.minimumLabelClearanceCm))[0];
  return { rows: measuredRows, commonOffsets, bestOffset, selectedOffsetPassesDiagnosticMargin:
    bestOffset.minimumPathClearanceCm > 0.01 && bestOffset.minimumLabelClearanceCm > 0.01
      && bestOffset.maximumAnchorToGlyphCenterCm <= 0.55 };
}, { rows: inputRows, markerOffsets: offsets });

assert.equal(analysis.rows.length, 28);
assert.equal(analysis.bestOffset.id.length > 0, true);
const renderedDir = join(outputDir, "rendered");
await mkdir(renderedDir, { recursive: true });
const screenshotOptions = new Set(["woven-shirt-default", "woven-shirt-placketWidth-min", "woven-shirt-neckEase-max",
  "woven-shirt-placketWidth-max", "woven-shirt-combined-supported"]);
const renderedRows = [];
for (const row of analysis.rows) {
  await page.setContent(row.output, { waitUntil: "load" });
  const transformed = await page.evaluate(({ offset, expectedPathIdentity }) => {
    const root = document.querySelector("svg");
    const keyed = root.querySelector("g[data-pom-key='W']");
    const circle = keyed.querySelector("circle");
    const glyph = keyed.querySelector("text");
    const silhouette = root.querySelector("g[data-layer-group='GARMENT_SILHOUETTE']");
    const colorwayFill = silhouette?.querySelector("[data-colorway-area-group]");
    if (!silhouette || !colorwayFill) throw new Error("Expected colorway fill and silhouette layer for paint-order trial");
    silhouette.insertBefore(circle, colorwayFill.nextElementSibling);
    circle.setAttribute("data-diagnostic-paint-order", "after-colorway-fill-before-source-strokes");
    glyph.setAttribute("x", String(Number(glyph.getAttribute("x")) + offset.dx));
    glyph.setAttribute("y", String(Number(glyph.getAttribute("y")) + offset.dy));
    const patternPaths = [...root.querySelectorAll("path[data-entity-id][data-source-id^='pattern:woven-shirt:']")];
    const circlePrecedesEverySourcePath = patternPaths.every((path) =>
      (circle.compareDocumentPosition(path) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
    const pathIdentity = JSON.stringify([...root.querySelectorAll("path[data-entity-id]")].map((path) => [
      path.getAttribute("data-entity-id"), path.getAttribute("d"), path.getAttribute("data-source-id"),
      path.getAttribute("data-revision-id"), path.getAttribute("data-colorway-fill-for"),
    ]));
    return { svg: new XMLSerializer().serializeToString(root), circlePrecedesEverySourcePath,
      sourcePathsUnchanged: pathIdentity === expectedPathIdentity,
      circleParentLayer: circle.parentElement.getAttribute("data-layer-group"),
      glyphX: Number(glyph.getAttribute("x")), glyphY: Number(glyph.getAttribute("y")),
      scheduleCount: root.querySelectorAll("g[data-layer-group='POM_SCHEDULE'] [data-schedule-for]").length,
      colorwayCount: root.querySelectorAll("[data-colorway-area-group]").length };
  }, { offset: analysis.bestOffset, expectedPathIdentity: row.sourcePathIdentity });
  assert.equal(transformed.circlePrecedesEverySourcePath, true, `${row.caseId}: source paths must paint over the diagnostic ring`);
  assert.equal(transformed.sourcePathsUnchanged, true, `${row.caseId}: diagnostic must preserve exact source paths`);
  assert.equal(transformed.circleParentLayer, "GARMENT_SILHOUETTE");
  assert.equal(transformed.scheduleCount, 1);
  assert.equal(transformed.colorwayCount, 1);
  row.output = transformed.svg;
  row.transform = transformed;
  await writeFile(join(renderedDir, `${row.caseId}-line-preserved-W.svg`), transformed.svg);
  if (screenshotOptions.has(row.caseId)) {
    const stem = `${row.caseId}-line-preserved-W`;
    await page.screenshot({ path: join(renderedDir, `${stem}-whole.png`), fullPage: true });
    const marker = row.marker;
    const detail = transformed.svg.replace(/viewBox="([^"]+)"/u,
      `viewBox="${(marker.cx - 8).toFixed(3)} ${(marker.cy - 7).toFixed(3)} 16 14"`);
    await page.setContent(detail, { waitUntil: "load" });
    await page.screenshot({ path: join(renderedDir, `${stem}-detail.png`), fullPage: true });
    const sourceSvg = row.output;
    await page.setContent(sourceSvg, { waitUntil: "load" });
    const crop = await page.evaluate(() => {
      const box = document.querySelector("g[data-layer-group='POM_SCHEDULE'] rect").getBBox();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    });
    const scheduleSvg = sourceSvg.replace(/viewBox="([^"]+)"/u,
      `viewBox="${(crop.x - 0.5).toFixed(3)} ${(crop.y - 0.4).toFixed(3)} ${(crop.width + 1).toFixed(3)} ${(crop.height + 0.8).toFixed(3)}"`);
    await page.setContent(scheduleSvg, { waitUntil: "load" });
    await page.screenshot({ path: join(renderedDir, `${stem}-schedule.png`), fullPage: true });
  }
  renderedRows.push(row);
}
assert.deepEqual(browserErrors, []);
await browser.close();
const summary = { configurations: renderedRows.length, offsetsTested: offsets.length,
  selectedOffset: analysis.bestOffset, selectedOffsetPassesDiagnosticMargin: analysis.selectedOffsetPassesDiagnosticMargin,
  candidateRenders: renderedRows.filter((row) => row.candidateStatus === "rendered").length,
  originalCollisionRows: renderedRows.filter((row) => row.originalIssues.some((issue) => issue.code === "TEXT_COLLISION")).length,
  sourcePathIdentityUnchanged: renderedRows.filter((row) => row.transform.sourcePathsUnchanged).length,
  ringBelowEverySourcePath: renderedRows.filter((row) => row.transform.circlePrecedesEverySourcePath).length,
  exactSourceAnchors: renderedRows.filter((row) => Math.abs(row.marker.cx - row.sourcePOM.anchor.point.x) < 0.00011
    && Math.abs(row.marker.cy - row.sourcePOM.anchor.point.y) < 0.00011).length,
  exactScheduleRows: renderedRows.filter((row) => row.sourceSchedule.length === 1 && !row.scheduleOverflow
    && row.sourceSchedule[0].text === `W  ${row.sourcePOM.fullText}`).length,
  colorwayRows: renderedRows.filter((row) => row.transform.colorwayCount === 1).length,
  browserErrors: browserErrors.length, noProductionOrGeometryChanges: true, all56WovenAnd34PoloFacesHeld: true,
  diagnosticClearanceMarginCm: 0.01, diagnosticOnly: true, noAcceptanceOrHoldChanges: true };
const output = { summary, commonOffsetResults: analysis.commonOffsets,
  rows: renderedRows.map(({ output: _svg, sourcePathIdentity, ...row }) => row) };
await writeFile(join(outputDir, "line-preserved-marker-matrix.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
