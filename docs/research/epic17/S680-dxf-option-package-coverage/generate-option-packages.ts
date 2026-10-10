import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { STANDARD_M, GARMENTS, gradeRun } from "../../../../src/drafting";
import { createDxfInterchangePackage, verifyDxfInterchangePackage } from "../../../../src/export/dxf-interchange-package";

const matrixPath = resolve("docs/research/epic17/S330-integrated-browser/matrix.json");
const output = resolve(process.argv[2] ?? "C:/G04-CAD-Interchange/S680-option-packages");
const matrixBytes = await readFile(matrixPath);
const matrix = JSON.parse(matrixBytes.toString("utf8")) as {
  cases: Array<{
    caseId: string;
    recipeId: string;
    options?: Record<string, number>;
    optionValues?: Record<string, number>;
  }>;
};
if (matrix.cases.length !== 73) throw new Error(`Expected 73 canonical option rows; found ${matrix.cases.length}`);

type Pair = { code: number; value: string };
type Entity = { type: string; values: Pair[] };
function entities(text: string): Entity[] {
  const lines = text.trimEnd().split(/\r?\n/);
  const pairs: Pair[] = [];
  for (let i = 0; i < lines.length; i += 2) pairs.push({ code: Number(lines[i]), value: lines[i + 1] ?? "" });
  const result: Entity[] = [];
  for (let i = 0; i < pairs.length;) {
    if (pairs[i].code !== 0) { i += 1; continue; }
    const type = pairs[i].value;
    const values: Pair[] = [];
    i += 1;
    while (i < pairs.length && pairs[i].code !== 0) values.push(pairs[i++]!);
    if (type === "POLYLINE") {
      const vertices: Pair[] = [];
      while (i < pairs.length && pairs[i]!.value !== "SEQEND") {
        if (pairs[i]!.value === "VERTEX") {
          i += 1;
          while (i < pairs.length && pairs[i]!.code !== 0) vertices.push(pairs[i++]!);
        } else i += 1;
      }
      if (i < pairs.length) i += 1;
      result.push({ type, values: [...values, ...vertices] });
    } else if (["LINE", "POINT", "CIRCLE"].includes(type)) result.push({ type, values });
  }
  return result;
}
function svgFor(dxf: string): string {
  const records = entities(dxf);
  const xs = records.flatMap((entity) => entity.values.filter((pair) => pair.code === 10 || pair.code === 11).map((pair) => Number(pair.value))).filter(Number.isFinite);
  const ys = records.flatMap((entity) => entity.values.filter((pair) => pair.code === 20 || pair.code === 21).map((pair) => Number(pair.value))).filter(Number.isFinite);
  if (xs.length === 0 || ys.length === 0) throw new Error("DXF contains no drawable geometry");
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const coordinate = (x: number, y: number) => `${x},${maxY - y}`;
  const color = (layer: string) => layer === "CUT" ? "#172033"
    : layer === "SEW" ? "#8a93a5"
      : layer === "MARK_NOTCH" ? "#cf2477"
        : layer === "MARK_GRAINLINE" ? "#0b875b" : "#2873bd";
  const markup = records.map((entity) => {
    const layer = entity.values.find((pair) => pair.code === 8)?.value ?? "0";
    const stroke = color(layer);
    const attrs = `stroke="${stroke}" stroke-width="0.075" fill="none"`;
    const val = (code: number) => Number(entity.values.find((pair) => pair.code === code)?.value ?? NaN);
    if (entity.type === "POLYLINE") {
      const vertices: { x: number; y: number }[] = [];
      for (let i = 0; i < entity.values.length; i += 1) {
        if (entity.values[i]!.code === 10 && entity.values[i + 1]?.code === 20) {
          vertices.push({ x: Number(entity.values[i]!.value), y: Number(entity.values[i + 1]!.value) });
          i += 1;
        }
      }
      return `<polyline ${attrs} points="${vertices.map((point) => coordinate(point.x, point.y)).join(" ")}"/>`;
    }
    if (entity.type === "LINE") return `<line ${attrs} x1="${val(10)}" y1="${maxY - val(20)}" x2="${val(11)}" y2="${maxY - val(21)}"/>`;
    if (entity.type === "CIRCLE") return `<circle ${attrs} cx="${val(10)}" cy="${maxY - val(20)}" r="${val(40)}"/>`;
    if (entity.type === "POINT") return `<circle stroke="${stroke}" fill="${stroke}" cx="${val(10)}" cy="${maxY - val(20)}" r="0.08"/>`;
    return "";
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}"><rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${maxY - minY}" fill="white"/>${markup}</svg>`;
}

await mkdir(output, { recursive: true });
const packages = [];
const browser = await chromium.launch({ headless: true });
try {
for (const testCase of matrix.cases) {
  const recipe = GARMENTS.find((candidate) => candidate.name === testCase.recipeId);
  if (!recipe) throw new Error(`Unknown recipe in canonical matrix: ${testCase.recipeId}`);
  const options = { ...testCase.options, ...testCase.optionValues };
  const grades = gradeRun(STANDARD_M, recipe.grade, recipe.sizes, recipe.draft, options);
  const graded = grades.find((entry) => entry.label === "M") ?? grades[Math.floor(grades.length / 2)];
  let candidate;
  try {
    candidate = await createDxfInterchangePackage(recipe, graded, options);
  } catch (error) {
    throw new Error(`${testCase.caseId}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  if (!await verifyDxfInterchangePackage(candidate)) throw new Error(`Package verification failed for ${testCase.caseId}`);

  const baseName = `${testCase.caseId}-${graded.label}`;
  const dxfPath = resolve(output, `${baseName}.dxf`);
  const manifestPath = resolve(output, `${baseName}.manifest.json`);
  const svgPath = resolve(output, `${baseName}.svg`);
  const pngPath = resolve(output, `${baseName}.png`);
  await writeFile(dxfPath, candidate.dxf, "utf8");
  const manifestBytes = `${JSON.stringify(candidate.manifest, null, 2)}\n`;
  await writeFile(manifestPath, manifestBytes, "utf8");
  const svg = svgFor(candidate.dxf);
  await writeFile(svgPath, svg, "utf8");
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  await page.setContent(svg);
  const pngBytes = await page.screenshot({ path: pngPath, fullPage: true });
  await page.close();
  const entityCountsByLayer: Record<string, number> = {};
  for (const entity of entities(candidate.dxf)) {
    const layer = entity.values.find((pair) => pair.code === 8)?.value ?? "0";
    entityCountsByLayer[layer] = (entityCountsByLayer[layer] ?? 0) + 1;
  }
  packages.push({
    caseId: testCase.caseId,
    recipe: recipe.name,
    size: graded.label,
    optionCount: Object.keys(candidate.manifest.options).length,
    dxfPath,
    manifestPath,
    svgPath,
    pngPath,
    drawingSha256: candidate.manifest.drawingSha256,
    revisionId: candidate.manifest.revisionId,
    manifestFileSha256: createHash("sha256").update(manifestBytes).digest("hex"),
    renderedSvgSha256: createHash("sha256").update(svg).digest("hex"),
    screenshotSha256: createHash("sha256").update(pngBytes).digest("hex"),
    entityCountsByLayer,
    pieceCount: candidate.manifest.pieces.length,
    stitchCount: candidate.manifest.stitches.length,
    verified: true,
  });
}

const cards = await Promise.all(packages.map(async (entry) => {
  const svgBytes = await readFile(entry.svgPath);
  return `<figure><figcaption>${entry.caseId}</figcaption><img alt="${entry.caseId}" src="data:image/svg+xml;base64,${svgBytes.toString("base64")}"/></figure>`;
}));
const contactSheetHtml = `<!doctype html><meta charset="utf-8"><style>body{font:12px Arial;margin:8px}main{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}figure{margin:0;border:1px solid #bbb;padding:4px;break-inside:avoid}figcaption{height:18px;overflow:hidden;font-weight:600}img{width:100%;height:112px;object-fit:contain;background:white}</style><main>${cards.join("")}</main>`;
const contactSheetHtmlPath = resolve(output, "S680-option-contact-sheet.html");
const contactSheetPngPath = resolve(output, "S680-option-contact-sheet.png");
await writeFile(contactSheetHtmlPath, contactSheetHtml, "utf8");
const sheetPage = await browser.newPage({ viewport: { width: 1500, height: 1200 }, deviceScaleFactor: 1 });
await sheetPage.setContent(contactSheetHtml);
await sheetPage.evaluate(async () => Promise.all(Array.from(document.images, (image) => image.decode())));
const contactSheetBytes = await sheetPage.screenshot({ path: contactSheetPngPath, fullPage: true });
await sheetPage.close();
const evidence = {
  schemaVersion: 1,
  sourceMatrix: "docs/research/epic17/S330-integrated-browser/matrix.json",
  sourceMatrixSha256: createHash("sha256").update(matrixBytes).digest("hex"),
  count: packages.length,
  byRecipe: Object.fromEntries(GARMENTS.map((recipe) => [recipe.name, packages.filter((entry) => entry.recipe === recipe.name).length])),
  contactSheetHtmlPath,
  contactSheetPngPath,
  contactSheetPngSha256: createHash("sha256").update(contactSheetBytes).digest("hex"),
  packages,
};
await writeFile(resolve(output, "S680-option-packages-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`Wrote and verified ${packages.length} option-bound DXF/manifest packages in ${output}`);
} finally {
  await browser.close();
}
