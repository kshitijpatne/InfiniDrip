import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { assembleTechnicalFlatRoles } from "../../../../src/render/technical-flat-assembly";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";
import { createG04TechnicalFlatProjectionMap } from "../../../../src/render/technical-flat-projection";
import type { TechnicalFlatPrimitive } from "../../../../src/render/technical-flat";

const out = fileURLToPath(new URL("./", import.meta.url));
const fixtures = JSON.parse(await readFile(new URL("../S331-polo-browser-final/matrix.json", import.meta.url), "utf8")).cases as Array<{
  caseId: string; options: Record<string, number>;
}>;
assert.equal(fixtures.length, 17);
const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
const cases = fixtures.map((fixture) => {
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...fixture.options });
  const revisionId = `live-draft:polo:S432:${fixture.caseId}`;
  const projection = createG04TechnicalFlatProjectionMap("polo", block, revisionId)!;
  const faces = (["FRONT_FLAT", "BACK_FLAT"] as const).map((kind) => {
    const assembly = assembleTechnicalFlatRoles("polo", block, kind, projection);
    const sleeveResidual = assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId === "stitch:Sleeve-cap ease");
    assert.deepEqual(sleeveResidual, [], `${fixture.caseId}.${kind}: S351 residual remains`);
    const live = compileTechnicalFlatLiveView({ recipe, block, revisionId, kind, placements: [],
      colorHex: "#456789", texture: "smooth", shine: 0 });
    assert.equal(live.issues.some((issue) => issue.stage === "assembly"
      && issue.sourceId === "stitch:Sleeve-cap ease"), false, `${fixture.caseId}.${kind}: stale assembly hold`);
    return { kind, revisionId, assemblyIssues: assembly.issues, liveIssues: live.issues,
      view: live.view, colorway: live.colorway };
  });
  return { ...fixture, revisionId, faces };
});

const renderedFaces = cases.flatMap((item) => item.faces.filter((face) => face.view));
assert.equal(renderedFaces.filter((face) => face.kind === "BACK_FLAT").length, 17);
assert.equal(renderedFaces.filter((face) => face.kind === "FRONT_FLAT").length, 0,
  "Polo fronts remain withheld by the existing POM placement issues");
const frontFaces = cases.flatMap((item) => item.faces.filter((face) => face.kind === "FRONT_FLAT"));
assert.ok(frontFaces.every((face) => face.liveIssues.some((issue) => issue.stage === "pom")));
assert.ok(renderedFaces.every((face) => face.assemblyIssues.length === 0));

function primitiveTexts(primitive: TechnicalFlatPrimitive): string[] {
  if (primitive.kind === "text" || primitive.kind === "callout") return [primitive.text];
  if (primitive.kind === "mark" && primitive.label) return [primitive.label];
  if (primitive.kind === "path" && primitive.patternMark?.label) return [primitive.patternMark.label];
  return [];
}
const phrases = new Set(["SOURCE POM"]);
for (const face of renderedFaces) for (const text of [...face.view!.primitives.flatMap(primitiveTexts),
  ...face.view!.notices.map((notice) => notice.message)]) {
  phrases.add(text);
  const words = text.trim().split(/\s+/u).filter(Boolean);
  for (let start = 0; start < words.length; start += 1) for (let end = start + 1; end <= words.length; end += 1) {
    phrases.add(words.slice(start, end).join(" "));
  }
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1400 }, deviceScaleFactor: 1 });
const browserErrors: string[] = [];
page.on("pageerror", (error) => browserErrors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
const metrics = await page.evaluate((texts) => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", "100cm"); svg.setAttribute("height", "100cm");
  svg.setAttribute("viewBox", "0 0 100 100");
  Object.assign(svg.style, { position: "fixed", left: "-10000px", top: "-10000px", visibility: "hidden" });
  document.body.append(svg);
  const result: Record<string, { widthCm: number; ascentCm: number; descentCm: number }> = {};
  try {
    for (const size of [0.28, 0.32]) for (const text of texts) {
      const node = document.createElementNS(ns, "text");
      node.setAttribute("font-size", size.toFixed(4)); node.setAttribute("font-family", "Arial, sans-serif");
      node.textContent = text; svg.append(node);
      const box = node.getBBox();
      result[`${size.toFixed(4)}|Arial, sans-serif|${text}`] = { widthCm: node.getComputedTextLength(),
        ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) };
      node.remove();
    }
  } finally { svg.remove(); }
  return result;
}, [...phrases]);
const measureText = (text: string, size: number, font: string) => {
  const metric = metrics[`${Number(size.toFixed(4)).toFixed(4)}|${font}|${text}`];
  if (!metric) throw new Error(`Chromium metrics missing for ${size} cm “${text}”`);
  return metric;
};

const renderDir = join(out, "rendered"); await mkdir(renderDir, { recursive: true });
const rows = [];
try {
  for (const item of cases) for (const face of item.faces) {
    if (!face.view) {
      rows.push({ caseId: item.caseId, options: item.options, kind: face.kind, revisionId: face.revisionId,
        liveViewEmitted: false, assemblyIssues: face.assemblyIssues, compilerIssues: face.liveIssues });
      continue;
    }
    const colorwayAttempt = renderTechnicalFlatSvg(face.view, { measureText, colorway: face.colorway,
      title: `${item.caseId} ${face.kind} ${face.revisionId}` });
    const output = renderTechnicalFlatSvg(face.view, { measureText, title: `${item.caseId} ${face.kind} ${face.revisionId} · linework-only diagnostic` });
    assert.deepEqual(output.issues, [], `${item.caseId}.${face.kind}: linework renderer issues ${JSON.stringify(output.issues)}`);
    assert.ok(output.svg, `${item.caseId}.${face.kind}: missing SVG`);
    const basename = `${item.caseId}-${face.kind.toLowerCase()}`;
    await writeFile(join(renderDir, `${basename}.svg`), output.svg);
    const ids = [...output.svg.matchAll(/data-source-id="(pattern:polo:[^"]+)"/gu)].map((match) => match[1]);
    const sourceRevisions = new Set([...output.svg.matchAll(/data-revision-id="([^"]+)"/gu)].map((match) => match[1]));
    assert.ok(ids.length > 0, `${basename}: missing source-bound paths`);
    assert.deepEqual([...sourceRevisions], [face.revisionId], `${basename}: mixed/stale revisions`);
    if (item.caseId === "polo-default" || item.caseId === "polo-collarPointExtension-min") {
      await page.setContent(`<html><body style="margin:0;background:white;font:16px Arial"><div style="padding:10px">${basename} · ${face.revisionId}</div>${output.svg}</body></html>`);
      await page.locator("svg").screenshot({ path: join(renderDir, `${basename}.png`), animations: "disabled" });
    }
    rows.push({ caseId: item.caseId, options: item.options, kind: face.kind, revisionId: face.revisionId,
      liveViewEmitted: true, assemblyIssues: face.assemblyIssues, compilerIssues: [],
      colorwayIssues: colorwayAttempt.issues, colorwayIncludedInDiagnosticSvg: false,
      svgPath: `rendered/${basename}.svg`, sourceBoundPathCount: ids.length, sourceRevisionCount: sourceRevisions.size,
      primitiveCount: face.view.primitives.length, noticeCount: face.view.notices.length });
  }
} finally { await browser.close(); }
assert.deepEqual(browserErrors, []);
const matrix = { sourceOptionFixture: "S331-polo-browser-final/matrix.json", options: cases.length, faces: rows.length,
  residualThresholdCm: 0.25, s351EndpointResiduals: 0, frontViewsWithheldForPOMPlacement: frontFaces.length,
  backViewsRendered: renderedFaces.length, browserErrors, rows };
assert.equal(matrix.faces, 34); assert.equal(matrix.s351EndpointResiduals, 0);
await writeFile(new URL("S432-polo-output-matrix.json", import.meta.url), `${JSON.stringify(matrix, null, 2)}\n`);
console.log(JSON.stringify({ options: matrix.options, faces: matrix.faces, s351EndpointResiduals: matrix.s351EndpointResiduals,
  frontViewsWithheldForPOMPlacement: matrix.frontViewsWithheldForPOMPlacement, backViewsRendered: matrix.backViewsRendered,
  browserErrors, remainingFrontIssueCounts: Object.fromEntries([...new Set(frontFaces.flatMap((face) => face.liveIssues.map((issue) => issue.sourceId)))]
    .map((sourceId) => [sourceId, frontFaces.filter((face) => face.liveIssues.some((issue) => issue.sourceId === sourceId)).length])) }, null, 2));
