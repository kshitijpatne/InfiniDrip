import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = new URL(".", import.meta.url);
const source = folder;
const anchors = JSON.parse(await readFile(new URL("current-source-matrix.json", folder), "utf8"));
const candidates = [
  { file: "polo-default-front_flat-current-diagnostic.svg", face: "FRONT_FLAT", viewBox: "-5 -2 19 15" },
  { file: "polo-default-back_flat-current-diagnostic.svg", face: "BACK_FLAT", viewBox: "17 14 21 20" },
];
const browser = await chromium.launch({ headless: true });
try {
  for (const candidate of candidates) {
    const svg = await readFile(new URL(candidate.file, source), "utf8");
    const entry = anchors.rows.find((item) => item.caseId === "polo-default")?.faces.find((item) => item.kind === candidate.face);
    if (!entry || entry.blockedPoms.length === 0) throw new Error(`Missing anchor evidence for ${candidate.face}`);
    const marks = entry.blockedPoms.map((item, index) => {
      const { x, y } = item.anchor;
      const label = item.label;
      const offset = index % 2 === 0 ? -0.7 : 0.7;
      return `<g class="s351-anchor" data-source-entity="${item.anchorSourceEntityId}"><circle cx="${x}" cy="${y}" r="0.28" fill="#d61f3c" stroke="#fff" stroke-width="0.12"/><path d="M ${x} ${y} L ${x + offset} ${y - 0.65}" fill="none" stroke="#d61f3c" stroke-width="0.07"/><text x="${x + offset}" y="${y - 0.72}" text-anchor="${offset < 0 ? "end" : "start"}" font-family="Arial,sans-serif" font-size="0.42" font-weight="700" fill="#a20f2a" stroke="#fff" stroke-width="0.1" paint-order="stroke">${label}</text></g>`;
    }).join("");
    const cropped = svg.replace(/<svg\b([^>]*)>/, (_match, sourceAttributes) => {
      const attributes = sourceAttributes.replace(/\swidth="[^"]+"/, " width=\"1600\"")
        .replace(/\sheight="[^"]+"/, " height=\"1200\"")
        .replace(/\sviewBox="[^"]+"/, ` viewBox="${candidate.viewBox}"`);
      return `<svg${attributes}>`;
    });
    const annotated = cropped.replace(/<\/svg>/, `<g id="s351-blocked-pom-anchor-overlay">${marks}</g></svg>`);
    if (annotated === svg) throw new Error(`Could not annotate ${candidate.file}`);
    const svgPath = new URL(candidate.file.replace("-current-diagnostic.svg", "-blocked-anchor-overlay.svg"), folder);
    const pngPath = new URL(candidate.file.replace("-current-diagnostic.svg", "-blocked-anchor-overlay.png"), folder);
    await writeFile(svgPath, annotated);
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });
    await page.setContent(annotated, { waitUntil: "load" });
    await page.locator("svg").screenshot({ path: fileURLToPath(pngPath) });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ overlays: candidates.map((item) => item.file.replace("-current-diagnostic.svg", "-blocked-anchor-overlay.svg")) }));
