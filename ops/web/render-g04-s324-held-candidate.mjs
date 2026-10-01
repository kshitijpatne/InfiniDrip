import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";

const output = path.resolve("docs/research/epic17/S324-woven-browser-current");
await fs.mkdir(output, { recursive: true });
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
let browser;
try {
  const [{ GARMENTS }, { STANDARD_M }, { defaultGarmentOptions }, { compileTechnicalFlatLiveView }, { renderTechnicalFlatSvg }] =
    await Promise.all([
      vite.ssrLoadModule("/src/drafting/recipe.ts"),
      vite.ssrLoadModule("/src/drafting/measurements.ts"),
      vite.ssrLoadModule("/src/drafting/options.ts"),
      vite.ssrLoadModule("/src/render/technical-flat-live.ts"),
      vite.ssrLoadModule("/src/render/technical-flat-svg.ts"),
    ]);
  const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt");
  const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
  const live = compileTechnicalFlatLiveView({ recipe, block, revisionId: "s324-held-candidate-default",
    kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
  if (!live.view) throw new Error(`Front geometry candidate unavailable: ${JSON.stringify(live.issues)}`);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent("<html><body></body></html>");
  await page.evaluate(() => document.fonts.ready);
  const labels = [...new Set(live.view.primitives.flatMap((primitive) =>
    primitive.kind === "text" || primitive.kind === "callout" ? [primitive.text] : []))];
  const metrics = await page.evaluate((strings) => {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("style", "position:fixed;left:-10000px;top:-10000px;visibility:hidden");
    document.body.append(svg);
    const rows = strings.map((text) => {
      const node = document.createElementNS(svgNS, "text");
      node.setAttribute("font-size", "0.32");
      node.setAttribute("font-family", "Arial, sans-serif");
      node.textContent = text;
      svg.append(node);
      const box = node.getBBox();
      return [text, { widthCm: node.getComputedTextLength(), ascentCm: Math.max(0, -box.y), descentCm: Math.max(0, box.y + box.height) }];
    });
    svg.remove();
    return rows;
  }, labels);
  const metricByText = new Map(metrics);
  const rendered = renderTechnicalFlatSvg(live.view, { title: "S324 Woven front — held geometry candidate (no colorway fill)",
    measureText: (text) => metricByText.get(text) ?? { widthCm: 0, ascentCm: 0, descentCm: 0 } });
  if (!rendered.svg) throw new Error(`Candidate SVG withheld by renderer: ${JSON.stringify(rendered.issues)}`);
  await fs.writeFile(path.join(output, "woven-shirt-default-front-candidate.svg"), rendered.svg, "utf8");
  const report = {
    candidateOnly: true,
    acceptance: "NOT ACCEPTED: production replay withholds the face because exact colorway contours do not close.",
    revisionId: live.view.revisionId,
    liveIssues: live.issues,
    renderIssues: rendered.issues,
    colorwayApplied: false,
    renderedPrimitiveCounts: Object.fromEntries([...new Set(live.view.primitives.map((primitive) => primitive.feature))]
      .map((feature) => [feature, live.view.primitives.filter((primitive) => primitive.feature === feature).length])),
    renderedSourceRoles: [...new Set(live.view.primitives.map((primitive) => primitive.source.sourceId.match(/role:([^:]+)/)?.[1]).filter(Boolean))],
    primitiveIds: live.view.primitives.map((primitive) => primitive.id),
  };
  await fs.writeFile(path.join(output, "woven-shirt-default-front-candidate.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await page.setContent(`<html><head><style>body{margin:0;padding:16px;background:#e7edf2;color:#172b3a;font:16px Arial,sans-serif}.banner{padding:12px 16px;margin-bottom:12px;background:#8b1d2c;color:white;font-weight:700}.canvas{background:white;padding:12px;border:1px solid #8998a3}svg{display:block;width:100%;height:auto;max-height:1000px}</style></head><body><div class="banner">HELD CANDIDATE ONLY · no colorway fill · not accepted output</div><div class="canvas">${rendered.svg}</div></body></html>`);
  await page.screenshot({ path: path.join(output, "woven-shirt-default-front-candidate.png"), fullPage: true, animations: "disabled" });
  process.stdout.write(`${JSON.stringify({ image: "woven-shirt-default-front-candidate.png", svg: "woven-shirt-default-front-candidate.svg", ...report }, null, 2)}\n`);
} finally {
  await browser?.close();
  await vite.close();
}
