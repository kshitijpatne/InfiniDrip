import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const output = path.resolve("docs/research/epic17/S284-browser");
const matrix = JSON.parse(await fs.readFile(path.join(output, "matrix.json"), "utf8"));
const acceptedDefaults = matrix.faces.filter((face) => !face.blocked && face.caseId.endsWith("-default"));
assert.ok(acceptedDefaults.length > 0, "the matrix should identify at least one accepted default face");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 3000 }, deviceScaleFactor: 1 });
  for (const face of acceptedDefaults) {
    assert.ok(face.svg, `${face.name} needs retained SVG evidence`);
    const svgPath = path.join(output, face.svg);
    await fs.access(svgPath);
    const svg = await fs.readFile(svgPath, "utf8");
    await page.setContent(`<main>${svg}</main>`, { waitUntil: "load" });
    const rendered = page.locator("svg");
    assert.equal(await rendered.count(), 1);
    const parserError = await rendered.evaluate((root) => Boolean(new DOMParser()
      .parseFromString(root.outerHTML, "image/svg+xml").querySelector("parsererror")));
    assert.equal(parserError, false, `${face.name} must parse when replayed`);
    const screenshot = `${face.name}.png`;
    await rendered.screenshot({ path: path.join(output, screenshot), animations: "disabled" });
    face.screenshot = screenshot;
  }
  matrix.acceptedDefaultReplay = {
    browser: "Playwright Chromium replay of exact accepted production-preview SVG output",
    faceNames: acceptedDefaults.map((face) => face.name),
    errors: [],
  };
  await fs.writeFile(path.join(output, "matrix.json"), `${JSON.stringify(matrix, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ faceNames: acceptedDefaults.map((face) => face.name), errors: [] }, null, 2)}\n`);
} finally {
  await browser.close();
}
