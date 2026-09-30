import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.dirname(fileURLToPath(import.meta.url));
const cases = [
  ...["tank", "skirt"].flatMap((recipe) => ["default", "measurement-variant"].flatMap((caseId) =>
    ["front_flat", "back_flat"].map((face) => ({ recipe, file: `${recipe}-${caseId}-${face}.svg` })))),
  ...["default", "waistbandDepth-min", "waistbandDepth-max", "legOpening-min", "legOpening-max"]
    .map((caseId) => ({ recipe: "trouser", file: `back-${caseId}.svg` })),
];

const browser = await chromium.launch({ headless: true });
const output = [];
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  for (const testCase of cases) {
    const file = path.join(root, testCase.recipe, testCase.file);
    const markup = await fs.readFile(file, "utf8");
    await page.setContent(`<html><body>${markup}</body></html>`, { waitUntil: "load" });
    const review = await page.evaluate(async () => {
      const svg = document.querySelector("svg");
      if (!(svg instanceof SVGSVGElement)) throw new Error("A production SVG flat is required.");
      const viewBox = svg.getAttribute("viewBox")?.split(/\s+/u).map(Number);
      if (!viewBox || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) throw new Error("Invalid viewBox.");
      const [minX, minY, width, height] = viewBox;
      const fills = [...svg.querySelectorAll("[data-colorway-fill-for]")];
      if (fills.length === 0) throw new Error("No source-backed colorway region was emitted.");
      const bytes = new TextEncoder().encode(new XMLSerializer().serializeToString(svg));
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(String.fromCharCode(...bytes))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = Math.max(1, Math.round(1200 * height / width));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas raster context unavailable.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixelAt = (x, y) => [...context.getImageData(
        Math.max(0, Math.min(canvas.width - 1, Math.round((x - minX) / width * canvas.width))),
        Math.max(0, Math.min(canvas.height - 1, Math.round((y - minY) / height * canvas.height))), 1, 1).data.slice(0, 3)];
      const pointInside = (shape, x, y) => {
        const point = svg.createSVGPoint(); point.x = x; point.y = y;
        return shape.isPointInFill(point);
      };
      const paperCandidates = [];
      for (let gx = 0; gx <= 18; gx += 1) for (let gy = 0; gy <= 18; gy += 1) {
        const x = minX + width * gx / 18; const y = minY + height * gy / 18;
        if (fills.some((shape) => pointInside(shape, x, y))) continue;
        const pixel = pixelAt(x, y);
        const whiteError = pixel.reduce((sum, value) => sum + Math.abs(255 - value), 0);
        paperCandidates.push({ x, y, pixel, whiteError });
      }
      const paper = paperCandidates.sort((a, b) => a.whiteError - b.whiteError)[0];
      if (!paper || paper.whiteError > 3) throw new Error("Could not find a white paper reference pixel.");
      const color = (svg.getAttribute("data-color") ?? "").match(/^#([0-9a-f]{6})$/iu)?.[1];
      if (!color) throw new Error("Expected a six-digit source colorway value.");
      const sourceRgb = color.match(/../gu).map((channel) => Number.parseInt(channel, 16));
      const expected = sourceRgb.map((channel, index) => Math.round(channel * 0.16 + paper.pixel[index] * 0.84));
      const fillResults = fills.map((shape) => {
        const box = shape.getBBox();
        const samples = [];
        for (let gx = 2; gx <= 8; gx += 1) for (let gy = 2; gy <= 8; gy += 1) {
          const x = box.x + box.width * gx / 10; const y = box.y + box.height * gy / 10;
          if (!pointInside(shape, x, y)) continue;
          const pixel = pixelAt(x, y);
          const error = pixel.reduce((sum, value, index) => sum + Math.abs(value - expected[index]), 0);
          samples.push({ x, y, pixel, error });
        }
        const sample = samples.sort((a, b) => a.error - b.error)[0];
        const visible = Boolean(sample) && sample.pixel.reduce((sum, value, index) =>
          sum + Math.abs(value - paper.pixel[index]), 0) >= 30;
        const closeToExpected = Boolean(sample) && sample.error <= 36;
        return { entityId: shape.getAttribute("data-colorway-fill-for"), sourceId: shape.getAttribute("data-source-id"),
          revision: shape.getAttribute("data-revision-id"), fill: shape.getAttribute("fill"),
          opacity: shape.closest("[data-colorway-area-group]")?.getAttribute("opacity"),
          sample, insideSamples: samples.length, visible, closeToExpected };
      });
      return { recipeId: svg.getAttribute("data-recipe-id"), kind: svg.getAttribute("data-view-kind"),
        revision: svg.getAttribute("data-revision-id"), color: svg.getAttribute("data-color"), paperPixel: paper.pixel,
        expectedAreaPixel: expected, mixedRevisions: [...svg.querySelectorAll("[data-revision-id]")]
          .some((node) => node.getAttribute("data-revision-id") !== svg.getAttribute("data-revision-id")), fills: fillResults };
    });
    assert.equal(review.recipeId, testCase.recipe);
    assert.equal(review.mixedRevisions, false);
    assert.ok(review.fills.length > 0);
    assert.ok(review.fills.every((fill) => fill.visible && fill.closeToExpected && fill.opacity === "0.16"
          && fill.fill === review.color && fill.revision === review.revision), `${testCase.recipe}/${testCase.file}: ${JSON.stringify(review.fills)}`);
    const rasterPath = path.join(root, testCase.recipe, testCase.file.replace(/\.svg$/u, "-raster.png"));
    await page.locator("svg").screenshot({ path: rasterPath, animations: "disabled" });
    output.push({ ...testCase, rasterPath: path.basename(rasterPath), ...review });
  }
} finally {
  await browser.close();
}

const result = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium rasterized captured production live-UI SVG output",
  caseCount: output.length, fillCount: output.reduce((sum, item) => sum + item.fills.length, 0), cases: output };
await fs.writeFile(path.join(root, "raster-review.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ caseCount: result.caseCount, fillCount: result.fillCount,
  allVisible: output.every((item) => item.fills.every((fill) => fill.visible && fill.closeToExpected)),
  rasterReview: path.join(root, "raster-review.json") }, null, 2));
