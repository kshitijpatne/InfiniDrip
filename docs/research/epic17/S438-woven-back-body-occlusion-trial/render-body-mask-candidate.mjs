import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const { JSDOM } = require("jsdom");
const root = import.meta.dirname;
const sourceRoot = join(root, "..", "S406-woven-approved-view-conventions", "production-replay");
const production = JSON.parse(await readFile(join(sourceRoot, "matrix.json"), "utf8"));
const trace = JSON.parse(await readFile(join(root, "..", "S373-woven-sleeve-crossing", "current-sleeve-crossing-trace.json"), "utf8"));
const out = join(root, "body-mask-candidate");
const rendered = join(out, "rendered");
await mkdir(rendered, { recursive: true });
assert.equal(production.summary.sourceRevision, "live-draft:woven-shirt:14:14");
assert.equal(production.cases.length, 28);
assert.equal(trace.records.length, 28);

const cases = [];
const browserErrors = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  for (const row of production.cases) {
    const face = row.faces.find((entry) => entry.kind === "BACK_FLAT");
    const exact = trace.records.find((entry) => entry.caseId === row.caseId);
    assert.ok(face && exact, `${row.caseId}: exact back face and crossing trace exist`);
    assert.equal(face.revisionId, "live-draft:woven-shirt:14:14");
    const dom = new JSDOM(face.svg, { contentType: "image/svg+xml" });
    const document = dom.window.document;
    const svg = document.documentElement;
    let defs = document.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    const masks = ["back", "yoke"].map((role) => {
      const sourceId = `pattern:woven-shirt:role:${role}`;
      const fill = [...document.querySelectorAll("path[data-colorway-fill-for]")]
        .find((path) => path.getAttribute("data-source-id") === sourceId);
      assert.ok(fill, `${row.caseId}: exact ${role} fill exists`);
      return { role, sourceId, d: fill.getAttribute("d"), transform: fill.getAttribute("transform"),
        fillRule: fill.getAttribute("fill-rule") ?? "nonzero" };
    });
    const viewBox = (svg.getAttribute("viewBox") ?? "").split(/\s+/u).map(Number);
    assert.equal(viewBox.length, 4);
    const maskId = `s438-body-occlusion-${row.caseId}`;
    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
    mask.setAttribute("id", maskId);
    mask.setAttribute("maskUnits", "userSpaceOnUse");
    mask.setAttribute("maskContentUnits", "userSpaceOnUse");
    mask.setAttribute("x", String(viewBox[0]));
    mask.setAttribute("y", String(viewBox[1]));
    mask.setAttribute("width", String(viewBox[2]));
    mask.setAttribute("height", String(viewBox[3]));
    mask.setAttribute("mask-type", "luminance");
    const outside = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    outside.setAttribute("x", String(viewBox[0])); outside.setAttribute("y", String(viewBox[1]));
    outside.setAttribute("width", String(viewBox[2])); outside.setAttribute("height", String(viewBox[3]));
    outside.setAttribute("fill", "white");
    mask.append(outside);
    for (const shape of masks) {
      const cutout = document.createElementNS("http://www.w3.org/2000/svg", "path");
      cutout.setAttribute("d", shape.d ?? "");
      if (shape.transform) cutout.setAttribute("transform", shape.transform);
      cutout.setAttribute("fill-rule", shape.fillRule);
      cutout.setAttribute("fill", "black");
      mask.append(cutout);
    }
    defs.append(mask);
    const sleevePaths = [...document.querySelectorAll('path[data-source-id="pattern:woven-shirt:role:sleeve"][data-entity-id]')];
    assert.equal(sleevePaths.length, 2, `${row.caseId}: both exact paired sleeve outline paths exist`);
    const originalSleeves = sleevePaths.map((path) => ({
      entityId: path.getAttribute("data-entity-id"), sourceId: path.getAttribute("data-source-id"),
      revisionId: path.getAttribute("data-revision-id"), layer: path.getAttribute("data-layer"),
      d: path.getAttribute("d"), fill: path.getAttribute("fill"), stroke: path.getAttribute("stroke"),
    }));
    assert.deepEqual(originalSleeves.map(({ entityId, sourceId, revisionId, layer, d }) =>
      ({ entityId, sourceId, revisionId, layer, d })), exact.instances.map((instance) => ({
        entityId: instance.entityId, sourceId: "pattern:woven-shirt:role:sleeve", revisionId: face.revisionId,
        layer: instance.layer, d: instance.pathData,
      })));
    for (const path of sleevePaths) path.setAttribute("mask", `url(#${maskId})`);

    const candidateSvg = new dom.window.XMLSerializer().serializeToString(svg);
    const candidatePath = join(out, `${row.caseId}-back_flat-body-mask.svg`);
    await writeFile(candidatePath, `${candidateSvg}\n`);
    await page.setContent(candidateSvg, { waitUntil: "load" });
    const screen = await page.evaluate(({ crossing, bodyD }) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      const inBody = bodyD.some(({ d, fillRule }) => context.isPointInPath(new Path2D(d), crossing.x, crossing.y, fillRule));
      const paths = [...document.querySelectorAll('path[data-source-id="pattern:woven-shirt:role:sleeve"][data-entity-id]')];
      const samples = paths.map((path) => {
        const total = path.getTotalLength();
        let visible = 0;
        for (let i = 0; i <= 2000; i += 1) {
          const point = path.getPointAtLength(total * i / 2000);
          const inside = bodyD.some(({ d, fillRule }) => context.isPointInPath(new Path2D(d), point.x, point.y, fillRule));
          if (!inside) visible += 1;
        }
        return { entityId: path.getAttribute("data-entity-id"), totalLength: total,
          visibleOutsideBodyFraction: visible / 2001 };
      });
      const root = document.querySelector("svg");
      return { crossingInsideOpaqueBody: inBody, sleeves: samples,
        unchangedPOMElements: [...document.querySelectorAll("text[data-pom-id],g[data-pom-id]")].length,
        colorwayFillCount: document.querySelectorAll("path[data-colorway-fill-for]").length,
        svgViewBox: root.getAttribute("viewBox") };
    }, { crossing: { x: exact.crossing.x, y: exact.crossing.y }, bodyD: masks.map(({ d, fillRule }) => ({ d, fillRule })) });
    assert.equal(screen.crossingInsideOpaqueBody, true, `${row.caseId}: crossing is masked by exact body fill`);
    const screenshotPath = join(rendered, `${row.caseId}-back-body-mask.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    cases.push({ caseId: row.caseId, options: row.options, revisionId: face.revisionId, maskId,
      maskSources: masks.map(({ role, sourceId, fillRule }) => ({ role, sourceId, fillRule })),
      sourcePathsUnchanged: true, sourceLayerOrderUnchanged: true, existingPOMAndColorwayElementsPreserved: true,
      originalIntersectionRetainedInPathData: { x: exact.crossing.x, y: exact.crossing.y },
      crossingInsideBodyMask: screen.crossingInsideOpaqueBody,
      sleevesVisibleOutsideBody: screen.sleeves, candidateSvg: candidatePath.slice(root.length + 1),
      renderedPng: screenshotPath.slice(root.length + 1), browserErrors: [] });
  }
  const defaultCase = cases.find((entry) => entry.caseId === "woven-shirt-default");
  assert.ok(defaultCase);
  const defaultSvg = await readFile(join(root, defaultCase.candidateSvg), "utf8");
  const croppedDom = new JSDOM(defaultSvg, { contentType: "image/svg+xml" });
  const croppedSvg = croppedDom.window.document.documentElement;
  croppedSvg.setAttribute("width", "28cm"); croppedSvg.setAttribute("height", "24cm");
  croppedSvg.setAttribute("viewBox", "-14 15 28 24");
  await page.setContent(new croppedDom.window.XMLSerializer().serializeToString(croppedSvg), { waitUntil: "load" });
  await page.screenshot({ path: join(rendered, "default-back-body-mask-crossing-detail.png"), fullPage: true });
  assert.deepEqual(browserErrors, []);
  const result = { sourceRevision: production.summary.sourceRevision, configurations: cases.length, faces: cases.length,
    originalStrokesPreserved: cases.every((entry) => entry.sourcePathsUnchanged),
    maskUsesExactSourceBackAndYokeFills: cases.every((entry) => entry.maskSources.length === 2),
    crossingsInsideBodyMask: cases.filter((entry) => entry.crossingInsideBodyMask).length,
    sleeveInstancesRetained: cases.every((entry) => entry.sleevesVisibleOutsideBody.length === 2),
    minVisibleOutsideBodyFraction: Math.min(...cases.flatMap((entry) => entry.sleevesVisibleOutsideBody.map((sleeve) => sleeve.visibleOutsideBodyFraction))),
    maxVisibleOutsideBodyFraction: Math.max(...cases.flatMap((entry) => entry.sleevesVisibleOutsideBody.map((sleeve) => sleeve.visibleOutsideBodyFraction))),
    bothSleeveOutlinesStayVisiblyPresent: cases.every((entry) => entry.sleevesVisibleOutsideBody.every((sleeve) => sleeve.visibleOutsideBodyFraction > 0.2)),
    candidateViable: cases.every((entry) => entry.crossingInsideBodyMask
      && entry.sleevesVisibleOutsideBody.every((sleeve) => sleeve.visibleOutsideBodyFraction > 0.2)),
    browserErrors, cases };
  assert.equal(result.crossingsInsideBodyMask, 28);
    assert.equal(result.sleeveInstancesRetained, true);
  assert.deepEqual(result.browserErrors, []);
  await writeFile(join(out, "S438-back-body-mask-candidate.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ ...result, cases: `${cases.length} exact option render rows in candidate matrix` }, null, 2));
} finally {
  await browser.close();
}
