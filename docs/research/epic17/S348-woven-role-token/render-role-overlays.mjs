import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = new URL("./", import.meta.url);
const replayDir = new URL("./production-replay/", folder);
const output = new URL("./role-overlays/", folder);
await mkdir(output, { recursive: true });
const matrix = JSON.parse(await readFile(new URL("matrix.json", replayDir), "utf8"));
const audit = JSON.parse(await readFile(new URL("band-join-audit.json", folder), "utf8"));
const targets = [
  ["woven-shirt-default", "FRONT_FLAT"],
  ["woven-shirt-default", "BACK_FLAT"],
  ["woven-shirt-yokeDepth-max", "BACK_FLAT"],
  ["woven-shirt-combined-supported", "BACK_FLAT"],
];
const browser = await chromium.launch({ headless: true });
try {
  for (const [caseId, kind] of targets) {
    const face = matrix.cases.find((candidate) => candidate.caseId === caseId)?.faces.find((candidate) => candidate.kind === kind);
    const finding = audit.findings.find((candidate) => candidate.caseId === caseId && candidate.face === kind);
    if (!face || !finding) throw new Error(`Missing matrix/audit record ${caseId}/${kind}`);
    const stem = `${caseId}-${kind.toLowerCase()}`;
    const svg = await readFile(new URL(`${stem}.svg`, replayDir), "utf8");
    const topLines = [finding.sourceBandTop, finding.sourceBandTop.map((point) => ({ x: -point.x, y: point.y }))]
      .map((points) => `<path data-s348-band-top="true" d="M${points[0].x} ${points[0].y} L${points[1].x} ${points[1].y}" fill="none" stroke="#d946ef" stroke-width="0.16" stroke-linecap="round"/>`).join("");
    const coloredSvg = svg.replace("</svg>", `${topLines}</svg>`);
    await writeFile(new URL(`${stem}-role-overlay.svg`, output), coloredSvg);
    const page = await browser.newPage({ viewport: { width: 1500, height: 1700 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><head><style>
      body{margin:16px;background:#111827;color:#f9fafb;font:14px/1.4 Arial,sans-serif}
      h1{font-size:18px;margin:0 0 8px} .legend{display:flex;gap:20px;margin:0 0 12px}
      .key{display:inline-block;width:13px;height:7px;margin-right:6px;border:2px solid currentColor}
      .sleeve{color:#0284c7}.band{color:#f97316}.seam{color:#d946ef}.collar{color:#be123c}
      svg{display:block;margin:auto;background:#fff}
      path[data-entity-id*="component:sleeve:outline"]{stroke:#0284c7!important;stroke-width:.14!important}
      path[data-source-id="pattern:woven-shirt:role:sleeveBand"]{stroke:#f97316!important;stroke-width:.14!important}
      path[data-colorway-fill-for$="component:sleeveBand:outline"]{fill:#f97316!important;fill-opacity:.18!important}
      path[data-entity-id*="component:outerStand:outline"],path[data-entity-id*="component:upperCollar:outline"],path[data-entity-id*="component:underCollar:outline"]{stroke:#be123c!important;stroke-width:.12!important}
      path[data-s348-band-top="true"]{stroke:#d946ef!important;stroke-width:.2!important}
    </style></head><body><h1>${caseId} / ${kind} — production SVG with source-role overlay</h1>
      <div class="legend"><span class="sleeve"><i class="key"></i>sleeve</span><span class="band"><i class="key"></i>sleeveBand</span><span class="seam"><i class="key"></i>band top / sleeve hem exact join</span><span class="collar"><i class="key"></i>held collar roles</span></div>${coloredSvg}</body></html>`);
    await page.locator("svg").screenshot({ path: join(fileURLToPath(output), `${stem}-role-overlay.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ overlays: targets.length, output: new URL("./role-overlays/", folder).pathname }));
