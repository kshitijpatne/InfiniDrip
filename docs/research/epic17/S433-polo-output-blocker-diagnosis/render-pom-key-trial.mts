import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";
import type { FlatCalloutPrimitive, TechnicalFlatPrimitive } from "../../../../src/render/technical-flat";

const fixtures = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8")).cases as Array<{
  caseId: string; options: Record<string, number>;
}>;
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const choices = [
  { label: "Finished collar stand height", key: "J" },
  { label: "Stand front rise", key: "FG" },
] as const;
const trialRows = fixtures.map((fixture) => {
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...fixture.options });
  const revisionId = `live-draft:polo:S433:${fixture.caseId}`;
  const input = { block, revisionId, kind: "FRONT_FLAT" as const, placements: [],
    colorHex: "#456789", texture: "smooth" as const, shine: 0 };
  const base = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: recipe.poms!.filter((pom) => !choices.some((choice) => choice.label === pom.label)) }, ...input });
  assert.ok(base.view && base.colorway, `${fixture.caseId}: missing base front view/colorway`);
  const keyed: FlatCalloutPrimitive[] = [];
  for (const choice of choices) {
    const single = compileTechnicalFlatLiveView({ recipe: { ...recipe, poms: recipe.poms!.filter((pom) => pom.label === choice.label) }, ...input });
    assert.deepEqual(single.issues.filter((issue) => issue.stage === "pom"), [], `${fixture.caseId}: isolated ${choice.label}`);
    const callout = single.view?.primitives.find((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout");
    assert.ok(callout, `${fixture.caseId}: missing ${choice.label} callout`);
    keyed.push({ ...callout, layer: "ANNOTATION", presentation: { kind: "keyed-marker-schedule", key: choice.key,
      markerRadiusCm: 0.22, markerStyle: "open-halo" } });
  }
  const standRise = keyed.find((callout) => callout.source.sourceId === "pom:polo:stand-front-rise")!;
  const existingFG = base.view.primitives.filter((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout"
    && primitive.presentation?.key === "FG");
  const sourceEntityIds = [...existingFG.map((callout) => callout.anchor.sourceEntityId!), standRise.anchor.sourceEntityId!];
  const markerPoint = { point: standRise.anchor.point, sourceEntityIds };
  const basePrimitives = base.view.primitives.map((primitive) => primitive.kind === "callout" && primitive.presentation?.key === "FG"
    ? { ...primitive, presentation: { ...primitive.presentation, markerPoint } } : primitive);
  const positionedKeyed = keyed.map((callout) => callout.source.sourceId === "pom:polo:stand-front-rise"
    ? { ...callout, presentation: { ...callout.presentation!, markerPoint } } : callout);
  const view = { ...base.view, primitives: [...basePrimitives, ...positionedKeyed] };
  return { ...fixture, revisionId, view, colorway: base.colorway, keyed: positionedKeyed };
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
  for (let start = 0; start < words.length; start += 1) for (let end = start + 1; end <= words.length; end += 1) phraseSet.add(words.slice(start, end).join(" "));
};
addTextPhrases("SOURCE POM");
for (const row of trialRows) {
  for (const primitive of row.view.primitives) {
    for (const text of texts(primitive)) addTextPhrases(text);
    if (primitive.kind === "callout" && primitive.presentation) addTextPhrases(`${primitive.presentation.key}  ${primitive.text}`);
  }
  for (const notice of row.view.notices) addTextPhrases(notice.message);
  for (const callout of row.keyed) addTextPhrases(`${callout.presentation!.key}  ${callout.text}`);
}
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
  try {
    for (const size of [0.28, 0.32]) for (const text of allText) {
      const node = document.createElementNS(ns, "text"); node.setAttribute("font-size", size.toFixed(4));
      node.setAttribute("font-family", "Arial, sans-serif"); node.textContent = text; svg.append(node);
      const box = node.getBBox(); result[`${size.toFixed(4)}|Arial, sans-serif|${text}`] = {
        widthCm: node.getComputedTextLength(), ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) };
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
const renderDir = join(folder, "rendered-pom-trial"); await mkdir(renderDir, { recursive: true });
const matrix = [];
try {
  for (const row of trialRows) {
    const output = renderTechnicalFlatSvg(row.view, { measureText, colorway: row.colorway,
      title: `${row.caseId} Polo front keyed POM trial ${row.revisionId}` });
    assert.deepEqual(output.issues, [], `${row.caseId}: ${JSON.stringify(output.issues)}`);
    assert.ok(output.svg);
    await writeFile(join(renderDir, `${row.caseId}-front_flat.svg`), output.svg);
    const fg = row.view.primitives.find((primitive) => primitive.kind === "callout" && primitive.presentation?.key === "FG");
    const rise = row.keyed.find((callout) => callout.source.sourceId === "pom:polo:stand-front-rise")!;
    const gap = Math.hypot(fg && fg.kind === "callout" ? fg.anchor.point.x - rise.anchor.point.x : Number.NaN,
      fg && fg.kind === "callout" ? fg.anchor.point.y - rise.anchor.point.y : Number.NaN);
    if (row.caseId === "polo-default" || row.caseId === "polo-standFrontRise-max") {
      await page.setContent(`<html><body style="margin:0;background:white;font:16px Arial">${output.svg}</body></html>`);
      if (row.caseId === "polo-default") await page.locator("svg").screenshot({ path: join(renderDir, "polo-default-front_flat.png"), animations: "disabled" });
      await page.locator("svg").evaluate((element) => { element.setAttribute("viewBox", "-8 -2 25 20"); element.setAttribute("width", "1800"); element.setAttribute("height", "1400"); });
      await page.locator("svg").screenshot({ path: join(renderDir, `${row.caseId}-neck-detail.png`), animations: "disabled" });
    }
    matrix.push({ caseId: row.caseId, revisionId: row.revisionId, issues: output.issues,
      keyMappings: row.keyed.map((callout) => ({ sourceId: callout.source.sourceId, key: callout.presentation?.key,
        anchor: callout.anchor.point, target: callout.anchor.primitiveId, sourceEntityId: callout.anchor.sourceEntityId })),
      standFrontRiseToExistingFGStationCm: gap,
      existingFgRingGroups: [...new Set(row.view.primitives.filter((primitive) => primitive.kind === "callout"
        && primitive.presentation?.key === "FG").map((primitive) => primitive.kind === "callout" ? primitive.anchor.point : null))] });
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
await writeFile(new URL("S433-polo-key-trial-matrix.json", import.meta.url), `${JSON.stringify({ options: matrix.length,
  trialOnly: true, approvedProductMappingChanged: false, browserErrors, rows: matrix }, null, 2)}\n`);
console.log(JSON.stringify({ options: matrix.length, rendered: matrix.length, trialOnly: true,
  maximumRiseToExistingFGStationCm: Math.max(...matrix.map((row) => row.standFrontRiseToExistingFGStationCm)), browserErrors }, null, 2));
