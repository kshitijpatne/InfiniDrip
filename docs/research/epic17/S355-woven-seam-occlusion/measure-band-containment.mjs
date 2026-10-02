import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const sourceDir = new URL("../S348-woven-role-token/production-replay/", import.meta.url);
const matrix = JSON.parse(await readFile(new URL("matrix.json", sourceDir), "utf8"));
const browser = await chromium.launch({ headless: true });
const rows = [];
try {
  const page = await browser.newPage();
  for (const item of matrix.cases.filter((entry) => entry.caseId.startsWith("woven-shirt-"))) {
    const face = item.faces.find((entry) => entry.kind === "BACK_FLAT");
    const svg = await readFile(new URL(`${item.caseId}-back_flat.svg`, sourceDir), "utf8");
    if (!face || !svg.includes(`data-revision-id="${face.revisionId}"`)) {
      throw new Error(`${item.caseId}: missing face or exact revision mismatch`);
    }
    await page.setContent(svg);
    const measurement = await page.evaluate(() => {
      const paths = [...document.querySelectorAll("path")];
      const bodyAndYoke = paths.filter((path) => [
        "flat:woven-shirt:BACK_FLAT:component:back:outline",
        "flat:woven-shirt:BACK_FLAT:component:yoke:outline",
      ].includes(path.getAttribute("data-colorway-fill-for")));
      const bands = paths.filter((path) => path.getAttribute("data-source-id")
        === "pattern:woven-shirt:role:sleeveBand"
        && path.getAttribute("data-feature") === "silhouette"
        && path.getAttribute("fill") !== "none");
      if (bodyAndYoke.length !== 2 || bands.length !== 1) {
        throw new Error(`expected two body/yoke fills and one compound mirrored band fill; got ${bodyAndYoke.length}/${bands.length}`);
      }
      const svgRoot = document.querySelector("svg");
      const pointCoveredByBody = (x, y) => {
        const point = svgRoot.createSVGPoint();
        point.x = x;
        point.y = y;
        return bodyAndYoke.some((path) => path.isPointInFill(point));
      };
      const band = bands[0];
      const length = band.getTotalLength();
      const boundarySamples = Math.ceil(length / 0.08);
      let boundaryInside = 0;
      for (let index = 0; index <= boundarySamples; index += 1) {
        const point = band.getPointAtLength(length * index / boundarySamples);
        if (pointCoveredByBody(point.x, point.y)) boundaryInside += 1;
      }
      const bounds = band.getBBox();
      let areaSamples = 0;
      let areaInside = 0;
      for (let y = bounds.y; y <= bounds.y + bounds.height; y += 0.1) {
        for (let x = bounds.x; x <= bounds.x + bounds.width; x += 0.1) {
          const point = svgRoot.createSVGPoint();
          point.x = x;
          point.y = y;
          if (!band.isPointInFill(point)) continue;
          areaSamples += 1;
          if (pointCoveredByBody(x, y)) areaInside += 1;
        }
      }
      return {
        revisionId: svgRoot.getAttribute("data-revision-id"),
        boundarySamples: boundarySamples + 1,
        boundaryInside,
        boundaryCoverage: boundaryInside / (boundarySamples + 1),
        areaSamples,
        areaInside,
        areaCoverage: areaInside / areaSamples,
      };
    });
    rows.push({ caseId: item.caseId, expectedRevisionId: face.revisionId, ...measurement });
  }
  await page.close();
} finally {
  await browser.close();
}

if (rows.length !== 28) throw new Error(`expected 28 Woven back options, got ${rows.length}`);
const report = {
  purpose: "Measure whether body+yoke colorway coverage contains the complete compound sleeveBand filled silhouette in each exact-revision Woven back SVG; a body-over-band clip would conceal any contained band area.",
  source: "S348 Woven production-replay SVGs; per-face revision IDs checked against matrix.json. Woven production projection has not changed since this source replay.",
  boundarySampleStepCm: 0.08,
  areaSampleStepCm: 0.1,
  rows,
  allBandAreaContained: rows.every((row) => row.areaCoverage > 0.999),
  minAreaCoverage: Math.min(...rows.map((row) => row.areaCoverage)),
  maxAreaCoverage: Math.max(...rows.map((row) => row.areaCoverage)),
};
await writeFile(new URL("band-boundary-coverage.json", import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  views: rows.length,
  minAreaCoverage: report.minAreaCoverage,
  maxAreaCoverage: report.maxAreaCoverage,
  allBandAreaContained: report.allBandAreaContained,
}, null, 2));
