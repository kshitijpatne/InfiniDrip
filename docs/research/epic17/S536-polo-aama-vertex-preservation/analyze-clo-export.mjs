import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation";
const inputPath = `${root}/Input/polo-standard-m-lwpolyline-r2000.dxf`;
const outputPath = `${root}/Output/polo-lwpolyline-aama-output.dxf`;
const expectedInputHash = "9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes, label) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete DXF group pair`);
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1]]);
  assert(pairs.every(([code]) => Number.isInteger(code)), `${label}: invalid group code`);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], entities: [] };
      sections.push(section); i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i)); i--;
    }
  }
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const getPolylines = (entities, block = null) => entities.flatMap((entity, index) => {
    const kind = entity[0]?.[1];
    if (kind === "LWPOLYLINE") {
      const vertices = [];
      for (const [code, raw] of entity.slice(1)) {
        if (code === 10) vertices.push({ x: Number(raw), y: NaN, bulge: 0 });
        else if (code === 20 && vertices.length) vertices.at(-1).y = Number(raw);
        else if (code === 42 && vertices.length) vertices.at(-1).bulge = Number(raw);
      }
      const flags = Number(value(entity, 70) ?? 0);
      return [{ block, layer: value(entity, 8) ?? "(none)", closed: Boolean(flags & 1), vertices }];
    }
    if (kind !== "POLYLINE") return [];
    const vertices = [];
    for (let j = index + 1; j < entities.length && entities[j][0]?.[1] !== "SEQEND"; j++) {
      if (entities[j][0]?.[1] !== "VERTEX") continue;
      vertices.push({ x: Number(value(entities[j], 10)), y: Number(value(entities[j], 20)), bulge: Number(value(entities[j], 42) ?? 0) });
    }
    return [{ block, layer: value(entity, 8) ?? "(none)", closed: Boolean(Number(value(entity, 70) ?? 0) & 1), vertices }];
  });
  const sourceEntities = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const sourcePolys = getPolylines(sourceEntities);
  const outputPolys = [];
  let block;
  const blockEntities = sections.find(({ name }) => name === "BLOCKS")?.entities ?? [];
  for (let i = 0; i < blockEntities.length; i++) {
    const entity = blockEntities[i];
    const kind = entity[0]?.[1];
    if (kind === "BLOCK") block = value(entity, 2);
    else if (kind === "ENDBLK") block = undefined;
    else if (block && kind === "POLYLINE") {
      const group = [entity];
      while (i + 1 < blockEntities.length && blockEntities[i + 1][0]?.[1] !== "SEQEND") group.push(blockEntities[++i]);
      if (i + 1 < blockEntities.length) group.push(blockEntities[++i]);
      outputPolys.push(...getPolylines(group, block));
    } else if (block && kind === "LWPOLYLINE") outputPolys.push(...getPolylines([entity], block));
  }
  const inserts = sourceEntities.filter((entity) => entity[0]?.[1] === "INSERT").map((entity) => ({
    block: value(entity, 2), x: Number(value(entity, 10) ?? 0), y: Number(value(entity, 20) ?? 0),
    sx: Number(value(entity, 41) ?? 1), sy: Number(value(entity, 42) ?? 1), rotation: Number(value(entity, 50) ?? 0),
  }));
  const byBlock = new Map(inserts.map((insert) => [insert.block, insert]));
  for (const line of outputPolys) {
    const t = byBlock.get(line.block) ?? { x: 0, y: 0, sx: 1, sy: 1, rotation: 0 };
    const angle = t.rotation * Math.PI / 180;
    line.vertices = line.vertices.map(({ x, y, bulge }) => ({
      x: t.x + (x * t.sx) * Math.cos(angle) - (y * t.sy) * Math.sin(angle),
      y: t.y + (x * t.sx) * Math.sin(angle) + (y * t.sy) * Math.cos(angle), bulge,
    }));
  }
  return { sourcePolys, outputPolys, inserts, acadver: value(pairs, 1) };
}
const exactCycleDelta = (a, b) => {
  if (a.length !== b.length) return null;
  let best = Infinity;
  for (let start = 0; start < b.length; start++) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const point = b[(start + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.abs(a[i].x - point.x), Math.abs(a[i].y - point.y));
    }
    best = Math.min(best, max);
  }
  return best;
};
const pointSegmentDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, q = dx * dx + dy * dy;
  const t = q ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / q)) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};
const sampledDistance = (a, b, step = 0.0025) => {
  let max = { distanceCm: 0 };
  for (const [from, to, direction] of [[a, b, "input-to-output"], [b, a, "output-to-input"]]) {
    for (let i = 0; i < from.length; i++) {
      const start = from[i], end = from[(i + 1) % from.length];
      const n = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / step));
      for (let k = 0; k <= n; k++) {
        const p = { x: start.x + (end.x - start.x) * k / n, y: start.y + (end.y - start.y) * k / n };
        let nearest = { distanceCm: Infinity, segmentIndex: -1 };
        for (let j = 0; j < to.length; j++) {
          const distanceCm = pointSegmentDistance(p, to[j], to[(j + 1) % to.length]);
          if (distanceCm < nearest.distanceCm) nearest = { distanceCm, segmentIndex: j };
        }
        if (nearest.distanceCm > max.distanceCm) max = { ...nearest, direction, sample: p, sampledSegmentIndex: i, segmentT: k / n };
      }
    }
  }
  return max;
};

const inputBytes = await readFile(inputPath), outputBytes = await readFile(outputPath);
assert.equal(sha(inputBytes), expectedInputHash, "hash-pinned LWPOLYLINE input");
const source = parse(inputBytes, "LWPOLYLINE source"), output = parse(outputBytes, "CLO output");
assert.equal(source.sourcePolys.length, 18, "all nine CUT/SEW pairs exist");
assert(source.sourcePolys.every((line) => line.vertices.every(({ bulge }) => Math.abs(bulge) < 1e-10)), "straight-segment distance sampler requires zero-bulge input contours");
assert.equal(source.sourcePolys.filter((p) => p.layer === "CUT").length, 9);
assert.equal(source.sourcePolys.filter((p) => p.layer === "SEW").length, 9);
assert.equal(output.inserts.length, 9, "CLO output retains nine inserted pieces");
const pieces = ["front", "back", "sleeve", "button placket", "buttonhole placket", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const results = pieces.map((piece, i) => {
  const cut = source.sourcePolys[i * 2], sew = source.sourcePolys[i * 2 + 1];
  const sewCandidates = output.outputPolys.map((line) => ({ line, delta: exactCycleDelta(sew.vertices, line.vertices) }))
    .filter(({ delta }) => delta !== null).sort((a, b) => a.delta - b.delta);
  const sewMatch = sewCandidates[0];
  assert(sewMatch && sewMatch.delta <= 0.001, `${piece}: SEW outline not bound to a receiver piece within 0.001 cm`);
  const sameBlock = output.outputPolys.filter((line) => line.block === sewMatch.line.block);
  const cutCandidates = sameBlock.map((line) => ({ line, exact: exactCycleDelta(cut.vertices, line.vertices), distance: sampledDistance(cut.vertices, line.vertices) }))
    .sort((a, b) => a.distance.distanceCm - b.distance.distanceCm);
  const best = cutCandidates[0];
  return { piece, receiverBlock: sewMatch.line.block, sew: { inputVertices: sew.vertices.length, receiverVertices: sewMatch.line.vertices.length, maxCoordinateDeltaCm: sewMatch.delta }, cut: {
    inputVertices: cut.vertices.length, receiverVertices: best?.line.vertices.length ?? null, outputLayer: best?.line.layer ?? null,
    exactCyclicDeltaCm: best?.exact ?? null, symmetricSampledPolylineDistance: best?.distance ?? null,
    samplingStepCm: 0.0025, strictGateCm: 0.001, passesStrictGate: Boolean(best?.exact !== null && best.exact <= 0.001),
  } };
});
const report = {
  experiment: "CLO 2026.1.310 (r58944), DXF-AAMA import of the geometry-identical R2000 LWPOLYLINE diagnostic and DXF-AAMA export; one visible-profile exchange generation.",
  input: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes), all18ContoursAreLwpolylines: true, sourceGeometryEqualsPinnedS516Geometry: "proven exactly by S536 variant preflight" },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes), acadver: output.acadver, insertedPieces: output.inserts.length, blockPolylineCount: output.outputPolys.length },
  method: "Piece binding uses exact cyclic/reverse equality of each source SEW contour to CLO block geometry at 0.001 cm. CUT comparison is restricted to its associated block; exact cyclic coordinate comparison is reported where vertex counts match, and a symmetric sampled polyline distance at <=0.0025 cm is diagnostic only where receiver vertices differ.",
  results, strictCutPassCount: results.filter((r) => r.cut.passesStrictGate).length,
  sourceLayerSemantics: "CUT/SEW are source labels; CLO numeric output layer identifiers are reported without assigning manufacturing semantics.",
  limitations: "This first-generation output check does not prove generation-two re-import, all-seven recipe coverage, grades, complete mark semantics, normative AAMA conformance, receiver/profile rights, physical fit, or factory acceptance.",
};
const dir = `${root}/Evidence/Analysis`;
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/clo-export-analysis.json`, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ input: report.input, output: report.output, strictCutPassCount: report.strictCutPassCount, results }, null, 2));
