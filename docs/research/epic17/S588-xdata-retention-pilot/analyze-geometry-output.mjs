import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S588-xdata-retention-pilot";
const inputPath = `${root}/Input/polo-standard-m-lwpolyline-xdata.dxf`;
const outputPath = `${root}/Output/polo-standard-m-lwpolyline-xdata-clo.dxf`;
const outputReportPath = `${root}/Evidence/geometry-comparison.json`;
const inputHashExpected = "C4D0D2D29CECF261EFE40D5E56D87F537D42D2931B139D0AD7E534AC1D124293";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: complete group pairs`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1]]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: group codes`);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], records: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i += 1;
      section.records.push(pairs.slice(start, i));
      i -= 1;
    }
  }
  const value = (record, code) => record.find(([group]) => group === code)?.[1];
  const poly = (record, block = null, legacyVertices = []) => {
    if (!(["LWPOLYLINE", "POLYLINE"].includes(record[0]?.[1]))) return null;
    const vertices = [];
    if (record[0][1] === "POLYLINE") {
      for (const vertex of legacyVertices) vertices.push({ x: Number(value(vertex, 10)), y: Number(value(vertex, 20)) });
    } else {
      for (const [code, raw] of record.slice(1)) {
        if (code === 10) vertices.push({ x: Number(raw), y: NaN });
        else if (code === 20 && vertices.length) vertices.at(-1).y = Number(raw);
      }
    }
    return { block, layer: value(record, 8) ?? "(none)", closed: Boolean(Number(value(record, 70) ?? 0) & 1), vertices };
  };
  const entities = sections.find(({ name }) => name === "ENTITIES")?.records ?? [];
  const sourcePolys = entities.map((record) => poly(record)).filter(Boolean);
  const blocks = sections.find(({ name }) => name === "BLOCKS")?.records ?? [];
  const outputPolys = [];
  let block;
  for (let i = 0; i < blocks.length; i += 1) {
    const record = blocks[i];
    const kind = record[0]?.[1];
    if (kind === "BLOCK") block = value(record, 2);
    else if (kind === "ENDBLK") block = undefined;
    else if (kind === "LWPOLYLINE" && block) outputPolys.push(poly(record, block));
    else if (kind === "POLYLINE" && block) {
      const vertices = [];
      for (let j = i + 1; j < blocks.length && blocks[j][0]?.[1] !== "SEQEND"; j += 1) if (blocks[j][0]?.[1] === "VERTEX") vertices.push(blocks[j]);
      outputPolys.push(poly(record, block, vertices));
    }
  }
  const inserts = entities.filter((record) => record[0]?.[1] === "INSERT").map((record) => ({
    block: value(record, 2), x: Number(value(record, 10) ?? 0), y: Number(value(record, 20) ?? 0),
    sx: Number(value(record, 41) ?? 1), sy: Number(value(record, 42) ?? 1), rotation: Number(value(record, 50) ?? 0),
  }));
  const transforms = new Map(inserts.map((insert) => [insert.block, insert]));
  for (const line of outputPolys) {
    const transform = transforms.get(line.block) ?? { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 };
    const angle = transform.rotation * Math.PI / 180;
    line.vertices = line.vertices.map(({ x, y }) => ({
      x: transform.x + (x * transform.sx) * Math.cos(angle) - (y * transform.sy) * Math.sin(angle),
      y: transform.y + (x * transform.sx) * Math.sin(angle) + (y * transform.sy) * Math.cos(angle),
    }));
  }
  return { sourcePolys, outputPolys, inserts, acadver: value(pairs, 1) };
}

const exactCycleDelta = (a, b) => {
  if (a.length !== b.length) return null;
  let best = Infinity;
  for (let start = 0; start < b.length; start += 1) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i += 1) {
      const point = b[(start + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.abs(a[i].x - point.x), Math.abs(a[i].y - point.y));
    }
    best = Math.min(best, max);
  }
  return best;
};
const pointSegmentDistance = (point, start, end) => {
  const dx = end.x - start.x, dy = end.y - start.y, length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length2)) : 0;
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
};
const sampledDistance = (a, b, step = 0.0025) => {
  let maximum = 0;
  for (const [from, to] of [[a, b], [b, a]]) for (let i = 0; i < from.length; i += 1) {
    const start = from[i], end = from[(i + 1) % from.length];
    const count = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / step));
    for (let k = 0; k <= count; k += 1) {
      const p = { x: start.x + (end.x - start.x) * k / count, y: start.y + (end.y - start.y) * k / count };
      let nearest = Infinity;
      for (let j = 0; j < to.length; j += 1) nearest = Math.min(nearest, pointSegmentDistance(p, to[j], to[(j + 1) % to.length]));
      maximum = Math.max(maximum, nearest);
    }
  }
  return maximum;
};

const inputBytes = await readFile(inputPath), outputBytes = await readFile(outputPath);
assert.equal(sha256(inputBytes), inputHashExpected);
const source = parse(inputBytes, "variant"), output = parse(outputBytes, "CLO output");
assert.equal(source.sourcePolys.length, 18);
assert.equal(source.sourcePolys.filter(({ layer }) => layer === "CUT").length, 9);
assert.equal(source.sourcePolys.filter(({ layer }) => layer === "SEW").length, 9);
const report = {
  slice: 588,
  input: { path: inputPath, bytes: inputBytes.length, sha256: sha256(inputBytes), inheritsS536SourceGeometry: "exact; variant adds only APPID/XDATA metadata" },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha256(outputBytes), acadver: output.acadver, insertedPieceCount: output.inserts.length, testedInputPieceCount: 9, additionalSceneInsertCount: Math.max(0, output.inserts.length - 9), blockPolylineCount: output.outputPolys.length },
  geometryComparison: { status: "Not attributed to the XDATA trial", reason: "The CLO import had Import Draw Curve Points unchecked, unlike the S536 protocol, and the active scene included two pre-existing inserts. The output contains 11 inserts and 48 block polylines; without an isolated, protocol-matched scene, those differences prevent a defensible piece-by-piece geometry conclusion.", knownReference: "S536 already measured five of nine Polo CUT contours outside the unchanged 0.001 cm gate under its recorded import settings." },
  limits: ["Do not interpret this output's geometry counts as a product DXF geometry pass or new geometry regression.", "XDATA retention is analyzed independently from contour geometry.", "The known five Polo CUT outline losses from S536 remain a separate V03 failure."],
};
await writeFile(outputReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputBytes: report.output.bytes, outputSha256: report.output.sha256, acadver: report.output.acadver, outputInserts: report.output.insertedPieceCount, polylines: report.output.blockPolylineCount, geometryComparison: report.geometryComparison.status }, null, 2));
