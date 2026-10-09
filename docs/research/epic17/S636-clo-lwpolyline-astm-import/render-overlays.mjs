import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { pathToFileURL } from "node:url";

const dir = "C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import/Evidence/Rendered-CUT-comparison";
const files = (await readdir(dir)).filter((name) => name.endsWith(".svg")).sort();
assert.equal(files.length, 5, "expected one SVG for every affected contour");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 440 }, deviceScaleFactor: 1 });
  for (const name of files) {
    const path = `${dir}/${name}`;
    await page.goto(pathToFileURL(path).href, { waitUntil: "load" });
    await page.locator("svg").waitFor();
    await page.screenshot({ path: `${dir}/${name.replace(/\.svg$/u, ".png")}` });
  }
} finally {
  await browser.close();
}
const rendered = (await readdir(dir)).filter((name) => name.endsWith(".png"));
assert.equal(rendered.length, 5, "expected five rendered contour overlays");
for (const name of rendered) assert((await stat(`${dir}/${name}`)).size > 1000, `${name} screenshot is empty`);
const renderer = { engine: "Playwright Chromium headless", browserVersion: browser.version() };
const artifacts = [];
for (const name of [...files, ...rendered]) {
  const bytes = await readFile(`${dir}/${name}`);
  artifacts.push({ name, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex").toUpperCase() });
}
await writeFile("C:/G04-CLO-DXF-Exchange/S636-lwpolyline-astm-import/Evidence/render-manifest.json", `${JSON.stringify({ renderer, viewport: { width: 1000, height: 440, deviceScaleFactor: 1 }, artifacts }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ directory: dir, renderer, artifacts }, null, 2));
