import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { STANDARD_M, blockPieces, draftAtSize, GARMENTS } from "../../../../src/drafting";
import { exportDxfCentimeters } from "../../../../src/export/dxf-centimeters";

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
    while (i < pairs.length && pairs[i].code !== 0) values.push(pairs[i++]);
    if (type === "POLYLINE") {
      const vertices: Pair[] = [];
      while (i < pairs.length && pairs[i].value !== "SEQEND") {
        if (pairs[i].value === "VERTEX") {
          i += 1;
          while (i < pairs.length && pairs[i].code !== 0) vertices.push(pairs[i++]);
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
  const points = records.flatMap((entity) => {
    const values = entity.values;
    const xs = values.filter((pair) => pair.code === 10 || pair.code === 11).map((pair) => Number(pair.value));
    const ys = values.filter((pair) => pair.code === 20 || pair.code === 21).map((pair) => Number(pair.value));
    return [...xs, ...ys].filter(Number.isFinite);
  });
  const xs = records.flatMap((entity) => entity.values.filter((pair) => pair.code === 10 || pair.code === 11).map((pair) => Number(pair.value))).filter(Number.isFinite);
  const ys = records.flatMap((entity) => entity.values.filter((pair) => pair.code === 20 || pair.code === 21).map((pair) => Number(pair.value))).filter(Number.isFinite);
  if (points.length === 0 || xs.length === 0 || ys.length === 0) throw new Error("DXF contains no drawable geometry");
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minY = Math.min(...ys) - 1;
  const maxY = Math.max(...ys) + 1;
  const height = maxY - minY;
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
        if (entity.values[i].code === 10 && entity.values[i + 1]?.code === 20) {
          vertices.push({ x: Number(entity.values[i].value), y: Number(entity.values[i + 1].value) });
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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="${minX} ${minY} ${maxX - minX} ${height}"><rect x="${minX}" y="${minY}" width="${maxX - minX}" height="${height}" fill="white"/>${markup}</svg>`;
}

const out = resolve(process.argv[2] ?? "C:/G04-CAD-Interchange/S677-construction-marks");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const report: Record<string, unknown>[] = [];
try {
  for (const recipe of GARMENTS) {
    const block = draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft);
    const dxf = exportDxfCentimeters(blockPieces(block), recipe.allowances, recipe.notches);
    const base = `${recipe.name}-M`;
    const svg = svgFor(dxf);
    await writeFile(resolve(out, `${base}.dxf`), dxf, "utf8");
    await writeFile(resolve(out, `${base}.svg`), svg, "utf8");
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
    await page.setContent(svg);
    await page.screenshot({ path: resolve(out, `${base}.png`), fullPage: true });
    await page.close();
    const byLayer: Record<string, number> = {};
    for (const entity of entities(dxf)) {
      const layer = entity.values.find((pair) => pair.code === 8)?.value ?? "0";
      byLayer[layer] = (byLayer[layer] ?? 0) + 1;
    }
    report.push({
      recipe: recipe.name,
      size: "M",
      dxfSha256: createHash("sha256").update(dxf).digest("hex"),
      renderedSvgSha256: createHash("sha256").update(svg).digest("hex"),
      screenshotSha256: createHash("sha256").update(await readFile(resolve(out, `${base}.png`))).digest("hex"),
      entityCountsByLayer: byLayer,
      notchEntityCount: byLayer.MARK_NOTCH ?? 0,
      grainlineEntityCount: byLayer.MARK_GRAINLINE ?? 0,
    });
  }
} finally {
  await browser.close();
}
await writeFile(resolve(out, "S677-generated-evidence.json"), JSON.stringify({ source: "S677 opt-in centimeter DXF candidate", recipes: report }, null, 2) + "\n", "utf8");
console.log(`Rendered seven source-generated DXF candidates in ${out}`);
