import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";
import type { TechnicalFlatPrimitive } from "../../../../src/render/technical-flat";

const fixtures = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8")).cases as Array<{
  caseId: string; options: Record<string, number>;
}>;
assert.equal(fixtures.length, 17);
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const rows = fixtures.map((fixture) => {
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...fixture.options });
  const revisionId = `live-draft:polo:S433:${fixture.caseId}`;
  const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind: "BACK_FLAT", placements: [],
    colorHex: "#456789", texture: "smooth", shine: 0 });
  assert.deepEqual(live.issues, [], `${fixture.caseId}: live back view issues`);
  assert.ok(live.view && live.colorway, `${fixture.caseId}: missing exact-revision view/colorway`);
  return { ...fixture, revisionId, view: live.view!, colorway: live.colorway! };
});

function texts(primitive: TechnicalFlatPrimitive): string[] {
  if (primitive.kind === "text" || primitive.kind === "callout") return [primitive.text];
  if (primitive.kind === "mark" && primitive.label) return [primitive.label];
  if (primitive.kind === "path" && primitive.patternMark?.label) return [primitive.patternMark.label];
  return [];
}
const phraseSet = new Set<string>();
const addTextPhrases = (text: string) => {
  phraseSet.add(text);
  const words = text.trim().split(/\s+/u).filter(Boolean);
  for (let start = 0; start < words.length; start += 1) for (let end = start + 1; end <= words.length; end += 1) {
    phraseSet.add(words.slice(start, end).join(" "));
  }
};
for (const row of rows) for (const primitive of row.view.primitives) for (const text of texts(primitive)) addTextPhrases(text);
for (const row of rows) for (const notice of row.view.notices) addTextPhrases(notice.message);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors: string[] = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
const metrics = await page.evaluate((allText) => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "100cm"); svg.setAttribute("height", "100cm"); svg.setAttribute("viewBox", "0 0 100 100");
  Object.assign(svg.style, { position: "fixed", left: "-10000px", top: "-10000px", visibility: "hidden" });
  document.body.append(svg);
  const result: Record<string, { widthCm: number; ascentCm: number; descentCm: number }> = {};
  try {
    for (const size of [0.28, 0.32]) for (const text of allText) {
      const node = document.createElementNS(ns, "text"); node.setAttribute("font-size", size.toFixed(4));
      node.setAttribute("font-family", "Arial, sans-serif"); node.textContent = text; svg.append(node);
      const box = node.getBBox();
      result[`${size.toFixed(4)}|Arial, sans-serif|${text}`] = { widthCm: node.getComputedTextLength(),
        ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) };
      node.remove();
    }
  } finally { svg.remove(); }
  return result;
}, [...phraseSet]);
const measureText = (text: string, size: number, font: string) => {
  const metric = metrics[`${Number(size.toFixed(4)).toFixed(4)}|${font}|${text}`];
  if (!metric) throw new Error(`Missing browser font metrics for ${text}`);
  return metric;
};

const folder = fileURLToPath(new URL("./", import.meta.url));
const renderDir = join(folder, "rendered-colorway");
await mkdir(renderDir, { recursive: true });
const matrix = [];
try {
  for (const row of rows) {
    const rendered = renderTechnicalFlatSvg(row.view, { measureText, colorway: row.colorway,
      title: `${row.caseId} Polo BACK_FLAT ${row.revisionId}` });
    assert.deepEqual(rendered.issues, [], `${row.caseId}: ${JSON.stringify(rendered.issues)}`);
    assert.ok(rendered.svg, `${row.caseId}: missing SVG`);
    const path = join(renderDir, `${row.caseId}-back_flat.svg`);
    await writeFile(path, rendered.svg);
    if (["polo-default", "polo-placketWidth-min", "polo-placketWidth-max"].includes(row.caseId)) {
      await page.setContent(`<html><body style="margin:0;background:white;font:16px Arial"><div style="padding:10px">${row.caseId} ${row.revisionId}</div>${rendered.svg}</body></html>`);
      await page.locator("svg").screenshot({ path: join(renderDir, `${row.caseId}-back_flat.png`), animations: "disabled" });
    }
    const sourceRevisions = [...new Set([...rendered.svg.matchAll(/data-revision-id="([^"]+)"/gu)].map((match) => match[1]))];
    assert.deepEqual(sourceRevisions, [row.revisionId], `${row.caseId}: stale or mixed source revisions`);
    matrix.push({ caseId: row.caseId, revisionId: row.revisionId, svgPath: `rendered-colorway/${row.caseId}-back_flat.svg`,
      svgBytes: Buffer.byteLength(rendered.svg), sourceRevisions, issueCount: rendered.issues.length,
      sleeveFillPath: rendered.svg.match(/data-colorway-fill-for="flat:polo:BACK_FLAT:component:sleeve:outline"/u)?.[0] ?? null });
  }
} finally {
  await browser.close();
}
assert.deepEqual(browserErrors, []);
assert.ok(matrix.every((row) => row.sleeveFillPath !== null));
await writeFile(new URL("S433-polo-back-colorway-render-matrix.json", import.meta.url), `${JSON.stringify({ options: matrix.length,
  browserErrors, rows: matrix }, null, 2)}\n`);
console.log(JSON.stringify({ options: matrix.length, outputs: matrix.length, allSleeveFillsPresent: true, browserErrors }, null, 2));
