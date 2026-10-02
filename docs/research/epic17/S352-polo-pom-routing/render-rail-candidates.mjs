import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dir = fileURLToPath(new URL(".", import.meta.url));
const routing = JSON.parse(await readFile(join(dir, "external-rail-route-matrix.json"), "utf8"));
const reviewDir = join(dir, "rendered"); await mkdir(reviewDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1800, height: 1300 }, deviceScaleFactor: 1 });
const outputs = [];
try {
  for (const row of routing.rows) {
    const name = `${row.caseId}-${row.face.toLowerCase()}`;
    let svg = await readFile(join(dir, `${name}-s352-source.svg`), "utf8");
    const additions = [];
    for (const target of row.targets) {
      if (target.route) {
        const points = target.route.bends.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
        const x = (target.route.box.minX + target.route.box.maxX) / 2;
        const y = (target.route.box.minY + target.route.box.maxY) / 2;
        additions.push(`<g data-s352-route="${target.sourceId}"><polyline points="${points}" fill="none" stroke="#245a86" stroke-width="0.055" stroke-linejoin="round"/><text x="${x.toFixed(3)}" y="${y.toFixed(3)}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="0.32" fill="#245a86">${target.text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</text></g>`);
      } else {
        additions.push(`<g data-s352-held="${target.sourceId}"><circle cx="${target.anchor.x}" cy="${target.anchor.y}" r="0.32" fill="none" stroke="#c21e46" stroke-width="0.09"/><path d="M${target.anchor.x - 0.2} ${target.anchor.y - 0.2}L${target.anchor.x + 0.2} ${target.anchor.y + 0.2}M${target.anchor.x + 0.2} ${target.anchor.y - 0.2}L${target.anchor.x - 0.2} ${target.anchor.y + 0.2}" stroke="#c21e46" stroke-width="0.08"/></g>`);
      }
    }
    svg = svg.replace("<title id=\"flat-title\">", "<title id=\"flat-title\">S352 diagnostic candidate — ");
    svg = svg.replace("</svg>", `<g aria-label="S352 label-rail diagnostic overlay">${additions.join("")}</g></svg>`);
    const output = join(reviewDir, `${name}-rail-candidate.svg`);
    await writeFile(output, svg);
    await page.setContent(svg, { waitUntil: "load" });
    const svgNode = page.locator("svg");
    const screenshot = join(reviewDir, `${name}-rail-candidate.png`);
    await svgNode.screenshot({ path: screenshot });
    outputs.push({ caseId: row.caseId, face: row.face, svg: output, screenshot,
      candidateRoutes: row.targets.filter((t) => t.route).length,
      unresolved: row.targets.filter((t) => !t.route).map((t) => t.sourceId),
      pageErrors: await page.evaluate(() => document.querySelector("svg")?.querySelectorAll("parsererror").length ?? 0) });
  }
} finally { await browser.close(); }
await writeFile(join(dir, "candidate-render-manifest.json"), `${JSON.stringify({ basis: "Diagnostic overlay only; blue labels/routes are bounded rail candidates, red X marks are unresolved held source anchors; underlying source SVG geometry and revision are unchanged.", renderedViews: outputs.length, outputs }, null, 2)}\n`);
console.log(JSON.stringify({ renderedViews: outputs.length, candidateRoutes: outputs.reduce((n, row) => n + row.candidateRoutes, 0), held: outputs.reduce((n, row) => n + row.unresolved.length, 0), outputs: "candidate-render-manifest.json" }, null, 2));
