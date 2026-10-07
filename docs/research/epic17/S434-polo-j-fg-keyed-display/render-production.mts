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
const rows = fixtures.flatMap((fixture) => (["FRONT_FLAT", "BACK_FLAT"] as const).map((kind) => {
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...fixture.options });
  const revisionId = `live-draft:polo:S434:${fixture.caseId}`;
  const compiled = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind, placements: [],
    colorHex: "#456789", texture: "smooth", shine: 0 });
  assert.ok(compiled.view && compiled.colorway, `${fixture.caseId}/${kind}: no live view or colorway`);
  assert.deepEqual(compiled.issues, [], `${fixture.caseId}/${kind}: ${JSON.stringify(compiled.issues)}`);
  return { ...fixture, kind, revisionId, view: compiled.view!, colorway: compiled.colorway! };
}));
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
addTextPhrases("SOURCE POM");
for (const row of rows) for (const primitive of row.view.primitives) {
  for (const text of texts(primitive)) addTextPhrases(text);
  if (primitive.kind === "callout" && primitive.presentation) addTextPhrases(`${primitive.presentation.key}  ${primitive.text}`);
} 
for (const row of rows) for (const notice of row.view.notices) addTextPhrases(notice.message);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors: string[] = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
const metrics = await page.evaluate((allText) => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", "100cm"); svg.setAttribute("height", "100cm");
  svg.setAttribute("viewBox", "0 0 100 100"); Object.assign(svg.style, { position: "fixed", left: "-10000px", top: "-10000px", visibility: "hidden" });
  document.body.append(svg);
  const result: Record<string, { widthCm: number; ascentCm: number; descentCm: number }> = {};
  try { for (const size of [0.28, 0.32]) for (const text of allText) {
    const node = document.createElementNS(ns, "text"); node.setAttribute("font-size", size.toFixed(4));
    node.setAttribute("font-family", "Arial, sans-serif"); node.textContent = text; svg.append(node);
    const box = node.getBBox(); result[`${size.toFixed(4)}|Arial, sans-serif|${text}`] = {
      widthCm: node.getComputedTextLength(), ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) };
    node.remove();
  } } finally { svg.remove(); }
  return result;
}, [...phraseSet]);
const measureText = (text: string, size: number, font: string) => {
  const metric = metrics[`${Number(size.toFixed(4)).toFixed(4)}|${font}|${text}`];
  if (!metric) throw new Error(`Missing Chromium font metrics for ${text}`);
  return metric;
};
const root = fileURLToPath(new URL("./", import.meta.url));
const outputDir = join(root, "rendered-production"); await mkdir(outputDir, { recursive: true });
const evidence = [];
try {
  for (const row of rows) {
    const output = renderTechnicalFlatSvg(row.view, { measureText, colorway: row.colorway,
      title: `${row.caseId} Polo ${row.kind} S434 ${row.revisionId}` });
    assert.deepEqual(output.issues, [], `${row.caseId}/${row.kind} renderer: ${JSON.stringify(output.issues)}`);
    assert.ok(output.svg);
    const callouts = row.view.primitives.filter((primitive) => primitive.kind === "callout");
    if (row.kind === "FRONT_FLAT") {
      const keyed = callouts.filter((callout) => callout.presentation);
      const j = keyed.find((callout) => callout.source.sourceId === "pom:polo:finished-collar-stand-height")!;
      assert.equal(j.presentation?.key, "J");
      assert.equal(j.anchor.sourceEntityId, "pattern:polo:role:outerStand:edge:frontEnd");
      assert.ok(j.text.startsWith("Finished collar stand height:"));
      const fg = keyed.filter((callout) => callout.presentation?.key === "FG");
      assert.deepEqual(fg.map((callout) => callout.source.sourceId), ["pom:polo:front-neck-drop", "pom:polo:finished-placket-width", "pom:polo:stand-front-rise"]);
      assert.deepEqual(fg.map((callout) => callout.text.split(":")[0]), ["Front neck drop", "Finished placket width", "Stand front rise"]);
      const standRise = fg.find((callout) => callout.source.sourceId === "pom:polo:stand-front-rise")!;
      assert.equal(standRise.anchor.sourceEntityId, "pattern:polo:role:outerStand:edge:frontNeckline");
      assert.ok(fg.every((callout) => callout.presentation?.markerPoint?.point.x === standRise.anchor.point.x
        && callout.presentation?.markerPoint?.point.y === standRise.anchor.point.y));
      assert.ok(fg.every((callout) => callout.presentation?.markerPoint?.sourceEntityIds.length === 3));
    }
    const filename = `${row.caseId}-${row.kind.toLowerCase()}.svg`;
    await writeFile(join(outputDir, filename), output.svg);
    if (row.caseId === "polo-default" && row.kind === "FRONT_FLAT") {
      await page.setContent(`<html><body style="margin:0;background:white;font:16px Arial">${output.svg}</body></html>`);
      await page.locator("svg").screenshot({ path: join(outputDir, "polo-default-front_flat.png"), animations: "disabled" });
      await page.locator("svg").evaluate((element) => { element.setAttribute("viewBox", "-8 -2 25 20"); element.setAttribute("width", "1800"); element.setAttribute("height", "1400"); });
      await page.locator("svg").screenshot({ path: join(outputDir, "polo-default-neck-detail.png"), animations: "disabled" });
    }
    evidence.push({ caseId: row.caseId, options: row.options, kind: row.kind, revisionId: row.revisionId,
      issueCount: output.issues.length, pomScheduleCount: callouts.length,
      keyedScheduleCount: callouts.filter((callout) => callout.presentation).length,
      keyed: callouts.filter((callout) => callout.presentation).map((callout) => ({ sourceId: callout.source.sourceId,
        key: callout.presentation?.key, anchor: callout.anchor.point, target: callout.anchor.primitiveId,
        sourceEntityId: callout.anchor.sourceEntityId, revisionId: callout.source.revisionId,
        text: callout.text, markerPoint: callout.presentation?.markerPoint })), filename });
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
await writeFile(new URL("S434-production-render-matrix.json", import.meta.url), `${JSON.stringify({
  sourceFixture: "S331-polo-browser-final/matrix.json", optionCount: fixtures.length, renderedFaces: rows.length,
  browserErrors, rows: evidence }, null, 2)}\n`);
console.log(JSON.stringify({ optionCount: fixtures.length, renderedFaces: evidence.length,
  keyedScheduleCounts: [...new Set(evidence.filter((row) => row.kind === "FRONT_FLAT").map((row) => row.keyedScheduleCount))],
  calloutCounts: [...new Set(evidence.map((row) => row.pomScheduleCount))], browserErrors,
  files: ["polo-default-front_flat.png", "polo-default-neck-detail.png"] }, null, 2));
