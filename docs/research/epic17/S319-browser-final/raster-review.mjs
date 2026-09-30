import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(await fs.readFile(path.join(outputDir, "matrix.json"), "utf8"));
const emitted = matrix.faces.filter((face) => !face.blocked && face.svg);
assert.ok(emitted.length > 0, "The integrated output matrix must contain emitted SVGs.");

const browser = await chromium.launch({ headless: true });
const outputs = [];
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 1 });
  for (const face of emitted) {
    const markup = await fs.readFile(path.join(outputDir, face.svg), "utf8");
    await page.setContent(`<html><body>${markup}</body></html>`, { waitUntil: "load" });
    const result = await page.evaluate(async () => {
      const svg = document.querySelector("svg");
      if (!(svg instanceof SVGSVGElement)) throw new Error("Expected the captured production technical-flat SVG.");
      const box = svg.viewBox.baseVal;
      const fills = [...svg.querySelectorAll("[data-colorway-fill-for]")];
      const color = svg.getAttribute("data-color") ?? "";
      const revision = svg.getAttribute("data-revision-id") ?? "";
      const bytes = new TextEncoder().encode(new XMLSerializer().serializeToString(svg));
      const image = new Image();
      image.src = `data:image/svg+xml;base64,${btoa(String.fromCharCode(...bytes))}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = Math.max(1, Math.round(1200 * box.height / box.width));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Raster context unavailable.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixelAt = (x, y) => [...context.getImageData(
        Math.max(0, Math.min(canvas.width - 1, Math.round((x - box.x) / box.width * canvas.width))),
        Math.max(0, Math.min(canvas.height - 1, Math.round((y - box.y) / box.height * canvas.height))), 1, 1).data.slice(0, 3)];
      const inside = (shape, x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return shape.isPointInFill(p); };
      const outside = [];
      for (let gx = 0; gx <= 20; gx += 1) for (let gy = 0; gy <= 20; gy += 1) {
        const x = box.x + box.width * gx / 20; const y = box.y + box.height * gy / 20;
        if (fills.some((shape) => inside(shape, x, y))) continue;
        const rgb = pixelAt(x, y);
        outside.push({ rgb, error: rgb.reduce((sum, value) => sum + Math.abs(255 - value), 0) });
      }
      const paper = outside.sort((a, b) => a.error - b.error)[0]?.rgb;
      if (!paper || paper.some((channel) => channel < 252)) throw new Error("Could not sample white paper outside colorway regions.");
      const colorMatch = color.match(/^#([0-9a-f]{6})$/iu);
      if (fills.length > 0 && !colorMatch) throw new Error("Colorway fill exists without a six-digit color.");
      const rgb = colorMatch ? colorMatch[1].match(/../gu).map((v) => Number.parseInt(v, 16)) : null;
      const expected = rgb?.map((channel, index) => Math.round(channel * 0.16 + paper[index] * 0.84)) ?? null;
      const regions = fills.map((shape) => {
        const parent = shape.closest("[data-colorway-area-group]");
        const bounds = shape.getBBox();
        const samples = [];
        for (let gx = 2; gx <= 8; gx += 1) for (let gy = 2; gy <= 8; gy += 1) {
          const x = bounds.x + bounds.width * gx / 10; const y = bounds.y + bounds.height * gy / 10;
          if (!inside(shape, x, y)) continue;
          const observed = pixelAt(x, y);
          const error = observed.reduce((sum, value, index) => sum + Math.abs(value - expected[index]), 0);
          samples.push({ x, y, rgb: observed, error });
        }
        const sample = samples.sort((a, b) => a.error - b.error)[0] ?? null;
        return { entityId: shape.getAttribute("data-colorway-fill-for"), sourceId: shape.getAttribute("data-source-id"),
          revisionId: shape.getAttribute("data-revision-id"), fill: shape.getAttribute("fill"),
          groupRevision: parent?.getAttribute("data-colorway-revision"), groupOpacity: parent?.getAttribute("opacity"),
          sample, maxSampleError: sample?.error ?? null };
      });
      return { recipeId: svg.getAttribute("data-recipe-id"), viewKind: svg.getAttribute("data-view-kind"), revision,
        color, paper, expected, fills: regions, mixedRevisions: [...svg.querySelectorAll("[data-revision-id]")]
          .some((node) => node.getAttribute("data-revision-id") !== revision) };
    });
    assert.equal(result.mixedRevisions, false, `${face.name} has mixed revisions.`);
    for (const region of result.fills) {
      assert.equal(region.revisionId, result.revision, `${face.name}/${region.entityId}: source revision mismatch.`);
      assert.equal(region.groupRevision, result.revision, `${face.name}/${region.entityId}: area group revision mismatch.`);
      assert.equal(region.fill, result.color, `${face.name}/${region.entityId}: fill/color mismatch.`);
      assert.equal(region.groupOpacity, "0.16", `${face.name}/${region.entityId}: unexpected compositing opacity.`);
      assert.ok(region.sample && region.sample.error <= 36, `${face.name}/${region.entityId}: tint did not rasterize: ${JSON.stringify(region)}`);
    }
    const raster = `${face.svg.replace(/\.svg$/u, "-raster.png")}`;
    await page.locator("svg").screenshot({ path: path.join(outputDir, raster), animations: "disabled" });
    outputs.push({ face: face.name, ...result, raster, fillCount: result.fills.length });
  }
} finally {
  await browser.close();
}

const summary = { generatedAt: new Date().toISOString(), browser: "Playwright Chromium raster of production UI captured SVG output",
  matrixSvgCount: emitted.length, colorwaySvgCount: outputs.filter((item) => item.fillCount > 0).length,
  fillCount: outputs.reduce((sum, item) => sum + item.fillCount, 0), outputs };
await fs.writeFile(path.join(outputDir, "raster-review.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ matrixSvgCount: summary.matrixSvgCount, colorwaySvgCount: summary.colorwaySvgCount,
  fillCount: summary.fillCount, passed: true }, null, 2));
