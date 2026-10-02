import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = dirname(fileURLToPath(import.meta.url));
const replay = join(folder, "production-replay");
const sourcePath = join(replay, "woven-shirt-default-front_flat.json");
const outputSvg = join(replay, "default-front-collar-source-overlay.svg");
const outputPng = join(replay, "default-front-collar-source-overlay.png");
const source = JSON.parse(await readFile(sourcePath, "utf8"));
const colors = { outerStand: "#c2410c", upperCollar: "#1d4ed8", underCollar: "#15803d" };
const overlays = [];
for (const [roleId, color] of Object.entries(colors)) {
  const paths = [...source.svg.matchAll(/<path\b[^>]*>/g)].map(([tag]) => tag);
  const tag = paths.find((candidate) => candidate.includes(`data-colorway-fill-for="flat:woven-shirt:FRONT_FLAT:component:${roleId}:outline"`));
  const pathData = tag?.match(/\sd="([^"]+)"/)?.[1];
  if (!pathData) throw new Error(`Missing exact emitted source outline for ${roleId}.`);
  overlays.push(`<path data-source-role="${roleId}" d="${pathData}" fill="none" stroke="${color}" stroke-width="0.18" stroke-dasharray="0.7 0.35" vector-effect="non-scaling-stroke"/>`);
}
const legend = `<g data-source-overlay-legend="true" font-family="Arial, sans-serif" font-size="1.05" font-weight="bold">
<text x="-50" y="-25" fill="#c2410c">outerStand outline</text>
<text x="-50" y="-23.5" fill="#1d4ed8">upperCollar outline</text>
<text x="-50" y="-22" fill="#15803d">underCollar outline</text>
<text x="-50" y="-20" fill="#111827">Dashed strokes trace emitted same-revision role contours.</text>
</g>`;
const annotated = source.svg.replace("</svg>", `${overlays.join("")}\n${legend}</svg>`);
await writeFile(outputSvg, annotated);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:#fff">${annotated}</body></html>`);
  await page.screenshot({ path: outputPng, fullPage: true });
} finally {
  await browser.close();
}
console.log(JSON.stringify({ revisionId: source.revisionId, sourcePath, outputSvg, outputPng,
  roles: Object.keys(colors) }, null, 2));
