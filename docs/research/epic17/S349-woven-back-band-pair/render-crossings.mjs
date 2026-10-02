import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const folder = new URL("./", import.meta.url);
const s348 = new URL("../S348-woven-role-token/", folder);
const replay = new URL("production-replay/", s348);
const output = new URL("./annotated-views/", folder);
await mkdir(output, { recursive: true });
const matrix = JSON.parse(await readFile(new URL("production-replay/matrix.json", s348), "utf8"));
const crosswalk = JSON.parse(await readFile(new URL("source-crossing-crosswalk.json", folder), "utf8"));
const targets = ["woven-shirt-default", "woven-shirt-yokeDepth-min", "woven-shirt-yokeDepth-max", "woven-shirt-combined-supported"];
const browser = await chromium.launch({ headless: true });
try {
  for (const caseId of targets) {
    const face = matrix.cases.find((entry) => entry.caseId === caseId)?.faces.find((entry) => entry.kind === "BACK_FLAT");
    const trace = crosswalk.configurationsByOption.find((entry) => entry.caseId === caseId)?.faces.find((entry) => entry.kind === "BACK_FLAT");
    if (!face || !trace) throw new Error(`Missing back-face output/trace for ${caseId}`);
    const source = await readFile(new URL(`${caseId}-back_flat.svg`, replay), "utf8");
    const points = trace.renderedBandPairIntersections.map(({ point }, index) =>
      `<circle data-s349-crossing="${index + 1}" cx="${point.x}" cy="${point.y}" r="0.28" fill="#d946ef" stroke="#701a75" stroke-width="0.06"/>`).join("");
    const annotated = source.replace("</svg>", `${points}</svg>`);
    const stem = `${caseId}-back_flat`;
    await writeFile(new URL(`${stem}-crossings.svg`, output), annotated);
    const page = await browser.newPage({ viewport: { width: 1500, height: 1700 }, deviceScaleFactor: 1 });
    await page.setContent(`<html><head><style>
      body{margin:16px;background:#111827;color:#f9fafb;font:14px/1.4 Arial,sans-serif}
      h1{font-size:18px;margin:0 0 8px}.legend{display:flex;gap:20px;margin:0 0 12px}
      .key{display:inline-block;width:13px;height:7px;margin-right:6px;border:2px solid currentColor}
      .sleeve{color:#0284c7}.band{color:#f97316}.cross{color:#d946ef}
      svg{display:block;margin:auto;background:#fff}
      path[data-entity-id*="component:sleeve:outline"]{stroke:#0284c7!important;stroke-width:.14!important}
      path[data-source-id="pattern:woven-shirt:role:sleeveBand"]{stroke:#f97316!important;stroke-width:.14!important}
      path[data-colorway-fill-for$="component:sleeveBand:outline"]{fill:#f97316!important;fill-opacity:.18!important}
      circle[data-s349-crossing]{stroke:#701a75!important;fill:#d946ef!important}
    </style></head><body><h1>${caseId} / BACK_FLAT — production SVG with band intersections marked</h1>
      <div class="legend"><span class="sleeve"><i class="key"></i>sleeve</span><span class="band"><i class="key"></i>sleeveBand</span><span class="cross"><i class="key"></i>proper contour intersection</span></div>${annotated}</body></html>`);
    await page.locator("svg").screenshot({ path: join(fileURLToPath(output), `${stem}-crossings.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify({ views: targets.length, markedIntersectionsPerView: 4, output: fileURLToPath(output) }));
