import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../../../../src/drafting";
import { compileTechnicalFlatLiveView } from "../../../../src/render/technical-flat-live";
import { renderTechnicalFlatSvg } from "../../../../src/render/technical-flat-svg";

const outputDir = fileURLToPath(new URL("./", import.meta.url));
const matrixPath = new URL("../S348-woven-role-token/production-replay/matrix.json", import.meta.url);
const matrix = JSON.parse(await readFile(matrixPath, "utf8")) as {
  cases: { caseId: string; options: Record<string, number>; faces: { kind: "FRONT_FLAT" | "BACK_FLAT"; revisionId: string }[] }[];
};
const recipe = GARMENTS.find((item) => item.name === "woven-shirt")!;
const browser = await chromium.launch({ headless: true });
const failures: { caseId: string; face: string; stage: string; sourceId: string; message: string }[] = [];
const rows: Record<string, unknown>[] = [];
const renderCases = new Set(["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max",
  "woven-shirt-standHeight-max", "woven-shirt-combined-supported"]);
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
  for (const row of matrix.cases) {
    const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
    const block = recipe.draft(STANDARD_M, options);
    const caseFaces = [];
    for (const face of row.faces) {
      const compiled = compileTechnicalFlatLiveView({ recipe, block, revisionId: face.revisionId, kind: face.kind,
        placements: [], colorHex: "#334455", texture: "woven", shine: 0.15 });
      for (const issue of compiled.issues) failures.push({ caseId: row.caseId, face: face.kind,
        stage: issue.stage, sourceId: issue.sourceId, message: issue.message });
      const renderIssueRows: { code: string; message: string }[] = [];
      let svg: string | null = null;
      if (compiled.view && compiled.colorway) {
        const labels = compiled.view.primitives.flatMap((primitive) => primitive.kind === "callout"
          ? [primitive.text] : primitive.kind === "text" ? [primitive.text]
            : primitive.kind === "mark" && primitive.label ? [primitive.label]
              : primitive.kind === "path" && primitive.patternMark?.label ? [primitive.patternMark.label] : []);
        const metrics = await page.evaluate((texts) => {
          const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svgNode.setAttribute("style", "position:fixed;left:-10000px;top:-10000px;visibility:hidden");
          document.body.append(svgNode);
          const result: Record<string, { widthCm: number; ascentCm: number; descentCm: number }> = {};
          for (const text of texts) {
            const node = document.createElementNS("http://www.w3.org/2000/svg", "text");
            node.setAttribute("font-size", "0.32"); node.setAttribute("font-family", "Arial, sans-serif"); node.textContent = text;
            svgNode.append(node); const box = node.getBBox();
            result[text] = { widthCm: node.getComputedTextLength(), ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) };
            node.remove();
          }
          svgNode.remove(); return result;
        }, [...new Set(labels)]);
        const rendered = renderTechnicalFlatSvg(compiled.view, { colorway: compiled.colorway, title: `${row.caseId} ${face.kind}`,
          measureText: (text) => metrics[text] ?? { widthCm: text.length * 0.18, ascentCm: 0.24, descentCm: 0.08 } });
        svg = rendered.svg;
        renderIssueRows.push(...rendered.issues.map((issue) => ({ code: issue.code, message: issue.message })));
        if (rendered.issues.length) for (const issue of rendered.issues) failures.push({ caseId: row.caseId,
          face: face.kind, stage: "render", sourceId: issue.entityId ?? row.caseId, message: `${issue.code}: ${issue.message}` });
        if (renderCases.has(row.caseId) && svg) {
          const slug = `${row.caseId}-${face.kind === "FRONT_FLAT" ? "front" : "back"}`;
          await writeFile(join(outputDir, `${slug}.svg`), svg);
          await page.setContent(`<body style="margin:0;background:#fff">${svg}</body>`);
          await page.locator("svg").screenshot({ path: join(outputDir, `${slug}.png`) });
        }
      } else if (compiled.view || compiled.colorway) {
        failures.push({ caseId: row.caseId, face: face.kind, stage: "render", sourceId: row.caseId,
          message: "View and colorway must both be present before SVG rendering." });
      }
      caseFaces.push({ kind: face.kind, revisionId: face.revisionId, optionCount: Object.keys(options).length,
        viewPresent: !!compiled.view, primitiveCount: compiled.view?.primitives.length ?? 0,
        colorwayPresent: !!compiled.colorway, issueCount: compiled.issues.length + renderIssueRows.length,
        renderIssues: renderIssueRows, pomCount: compiled.view?.primitives.filter((primitive) => primitive.kind === "callout").length ?? 0,
        collarProjectionSources: compiled.view?.primitives.filter((primitive) => primitive.source.sourceId.includes("role:outerStand")
          || primitive.source.sourceId.includes("role:upperCollar") || primitive.source.sourceId.includes("role:underCollar"))
          .map((primitive) => primitive.source.sourceId) ?? [] });
    }
    rows.push({ caseId: row.caseId, options, faces: caseFaces });
  }
} finally {
  await browser.close();
}
const result = { schemaVersion: 1, slice: 362, candidate: "integrated Woven full-collar arclength and signed-source-normal view projection",
  source: "S348 production replay matrix, 28 supported Woven configurations, each compiled at its recorded current revision",
  configurations: rows.length, faceRequests: rows.reduce((total, row) => total + ((row.faces as unknown[]).length), 0),
  acceptedViews: rows.flatMap((row) => row.faces as { viewPresent: boolean; issueCount: number }[])
    .filter((face) => face.viewPresent && face.issueCount === 0).length,
  failedFaceRequests: failures.length, failures, cases: rows };
await writeFile(join(outputDir, "collar-projection-matrix.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ configurations: result.configurations, faceRequests: result.faceRequests,
  acceptedViews: result.acceptedViews, failedFaceRequests: result.failedFaceRequests,
  renderedSamples: [...renderCases] }, null, 2));
