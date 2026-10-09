import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S615-standard-dxf-explicit-scale";
const inputPath = `${root}/Input/polo-standard-m.dxf`;
const fixturePath = `${root}/Input/polo-standard-m.dxf`;
const preflightPath = "C:/G04-CLO-DXF-Exchange/S614-standard-dxf-import-mode/source-preflight.json";
const outputPath = `${root}/Output/polo-m-standard-1000pct-input-astm-output.dxf`;
const reportPath = `${root}/Evidence/Analysis/S615-standard-dxf-roundtrip-analysis.json`;
const gateCm = 0.001;
const sampleStepCm = 0.05;
const expectedInputHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedFixtureHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedPreflightHash = "299f7b2a85019e07ae5d197a5c5b3590085d05e66e68d59e5e11e9cae0edbecb";
const expectedOutputHash = "66e883f34672511aeee60621c7deb3544843e80a3f4b16a337a344da112918de";
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
      sections.push(section);
      i++;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) {
      const start = i++;
      while (i < pairs.length && pairs[i][0] !== 0) i++;
      section.entities.push(pairs.slice(start, i));
      i--;
    }
  }
  const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
  const polyline = (entity, block = null) => {
    const kind = entity[0]?.[1];
    let vertices = [];
    if (kind === "LWPOLYLINE") {
      for (const [code, raw] of entity.slice(1)) {
        if (code === 10) vertices.push({ x: Number(raw), y: NaN, bulge: 0 });
        else if (code === 20 && vertices.length) vertices.at(-1).y = Number(raw);
        else if (code === 42 && vertices.length) vertices.at(-1).bulge = Number(raw);
      }
    } else if (kind === "POLYLINE") {
      const sectionEntities = label === "output" ? sections.find(({ name }) => name === "BLOCKS")?.entities ?? [] : sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
      const start = sectionEntities.indexOf(entity);
      for (let j = start + 1; j < sectionEntities.length && sectionEntities[j][0]?.[1] !== "SEQEND"; j++) {
        if (sectionEntities[j][0]?.[1] !== "VERTEX") continue;
        vertices.push({ x: Number(value(sectionEntities[j], 10)), y: Number(value(sectionEntities[j], 20)), bulge: Number(value(sectionEntities[j], 42) ?? 0) });
      }
    } else return null;
    return { block, layer: value(entity, 8) ?? "(none)", closed: Boolean(Number(value(entity, 70) ?? 0) & 1), vertices };
  };
  const entitySection = sections.find(({ name }) => name === "ENTITIES")?.entities ?? [];
  const sourcePolys = entitySection.map((e) => polyline(e)).filter(Boolean);
  const blocks = sections.find(({ name }) => name === "BLOCKS")?.entities ?? [];
  const outputPolys = [];
  let block;
  for (let i = 0; i < blocks.length; i++) {
    const entity = blocks[i], kind = entity[0]?.[1];
    if (kind === "BLOCK") block = value(entity, 2);
    else if (kind === "ENDBLK") block = undefined;
    else if (block && kind === "LWPOLYLINE") outputPolys.push(polyline(entity, block));
    else if (block && kind === "POLYLINE") {
      outputPolys.push(polyline(entity, block));
      while (i + 1 < blocks.length && blocks[i + 1][0]?.[1] !== "SEQEND") i++;
      if (blocks[i + 1]?.[0]?.[1] === "SEQEND") i++;
    }
  }
  const inserts = entitySection.filter((e) => e[0]?.[1] === "INSERT").map((entity) => ({
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
  return { sourcePolys, outputPolys, inserts, acadver: pairs.find(([code]) => code === 1)?.[1] };
}

const valueAt = (p, q, t) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });
function segments(path) {
  const { vertices, closed } = path;
  const result = [];
  const count = closed ? vertices.length : vertices.length - 1;
  for (let i = 0; i < count; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    if (Math.abs(a.bulge) < 1e-12) result.push({ a, b, length: Math.hypot(b.x - a.x, b.y - a.y), bulge: 0 });
    else {
      const theta = 4 * Math.atan(a.bulge);
      const chord = Math.hypot(b.x - a.x, b.y - a.y);
      const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));
      const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const left = { x: -(b.y - a.y) / chord, y: (b.x - a.x) / chord };
      const offset = chord / (2 * Math.tan(theta / 2));
      const center = { x: midpoint.x + left.x * offset, y: midpoint.y + left.y * offset };
      result.push({ a, b, center, radius, theta, start: Math.atan2(a.y - center.y, a.x - center.x), length: radius * Math.abs(theta), bulge: a.bulge });
    }
  }
  return result;
}
function pointOnSegment(seg, t) {
  if (!seg.bulge) return valueAt(seg.a, seg.b, t);
  const angle = seg.start + seg.theta * t;
  return { x: seg.center.x + seg.radius * Math.cos(angle), y: seg.center.y + seg.radius * Math.sin(angle) };
}
function angleOnArc(angle, start, theta) {
  const tau = 2 * Math.PI;
  const progress = theta >= 0 ? ((angle - start) % tau + tau) % tau : ((start - angle) % tau + tau) % tau;
  return progress <= Math.abs(theta) + 1e-10;
}
function pointDistanceToSegment(point, seg) {
  if (!seg.bulge) {
    const dx = seg.b.x - seg.a.x, dy = seg.b.y - seg.a.y, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, ((point.x - seg.a.x) * dx + (point.y - seg.a.y) * dy) / den)) : 0;
    return Math.hypot(point.x - (seg.a.x + t * dx), point.y - (seg.a.y + t * dy));
  }
  const angle = Math.atan2(point.y - seg.center.y, point.x - seg.center.x);
  if (angleOnArc(angle, seg.start, seg.theta)) return Math.abs(Math.hypot(point.x - seg.center.x, point.y - seg.center.y) - seg.radius);
  return Math.min(Math.hypot(point.x - seg.a.x, point.y - seg.a.y), Math.hypot(point.x - seg.b.x, point.y - seg.b.y));
}
function distanceToPath(point, targetSegments) {
  let best = Infinity;
  for (const seg of targetSegments) best = Math.min(best, pointDistanceToSegment(point, seg));
  return best;
}
function sampledDirectedDistance(fromPath, toPath, direction) {
  const from = segments(fromPath), to = segments(toPath);
  let max = { distanceCm: 0 };
  for (let i = 0; i < from.length; i++) {
    const seg = from[i];
    const n = Math.max(1, Math.ceil(seg.length / sampleStepCm));
    for (let k = 0; k <= n; k++) {
      const point = pointOnSegment(seg, k / n);
      const distanceCm = distanceToPath(point, to);
      if (distanceCm > max.distanceCm) max = { distanceCm, direction, segmentIndex: i, sampleFraction: k / n, point };
    }
  }
  return max;
}
function sampledSymmetricDistance(a, b) {
  const ab = sampledDirectedDistance(a, b, "input-to-output");
  const ba = sampledDirectedDistance(b, a, "output-to-input");
  const max = ab.distanceCm >= ba.distanceCm ? ab : ba;
  return { ...max, sampledMaxCm: max.distanceCm, conservativeUpperBoundCm: max.distanceCm + sampleStepCm / 2, sampleStepCm };
}
function exactCycleDelta(a, b) {
  if (a.length !== b.length) return null;
  let best = Infinity;
  const starts = b.flatMap((p, i) => Math.hypot(a[0].x - p.x, a[0].y - p.y) <= gateCm ? [i] : []);
  for (const start of starts) for (const direction of [1, -1]) {
    let max = 0;
    for (let i = 0; i < a.length; i++) {
      const p = b[(start + direction * i + b.length * 2) % b.length];
      max = Math.max(max, Math.hypot(a[i].x - p.x, a[i].y - p.y));
    }
    best = Math.min(best, max);
  }
  return Number.isFinite(best) ? best : null;
}

const inputBytes = await readFile(inputPath), fixtureBytes = await readFile(fixturePath), preflightBytes = await readFile(preflightPath), outputBytes = await readFile(outputPath);
assert.equal(sha(inputBytes), expectedInputHash, "hash-pinned original geometry baseline changed");
assert.equal(sha(fixtureBytes), expectedFixtureHash, "hash-pinned CLO-imported S615 1000-percent imported fixture changed");
assert.equal(sha(preflightBytes), expectedPreflightHash, "hash-pinned source preflight report changed");
const preflight = JSON.parse(preflightBytes);
assert.equal(preflight.output.sha256, expectedFixtureHash, "source preflight does not attest to imported fixture hash");
assert.equal(sha(outputBytes), expectedOutputHash, "hash-pinned CLO export changed");
const source = parse(inputBytes, "input"), output = parse(outputBytes, "output");
if (process.argv.includes("--scale-diagnostic")) {
  const closes = (a, b, eps = 1e-8) => Math.abs(a - b) <= eps;
  const scaled = (path, factor) => ({ ...path, vertices: path.vertices.map((p) => ({ ...p, x: p.x * factor, y: p.y * factor })) });
  const result = [];
  for (let i = 0; i < 9; i++) {
    const block = `${i}_M`;
    const lines = output.outputPolys.filter((p) => p.block === block && p.closed);
    for (const role of ["CUT", "SEW"]) {
      const inputPath = source.sourcePolys[i * 2 + (role === "SEW" ? 1 : 0)];
      const candidates = lines.map((line) => ({ line, matches: [0.1, 1, 10].map((factor) => ({ factor, exactDelta: exactCycleDelta(scaled(inputPath, factor).vertices, line.vertices) })) }));
      const best = candidates.flatMap(({ line, matches }) => matches.map((match) => ({ block, role, sourceVertices: inputPath.vertices.length, outputVertices: line.vertices.length, outputLayer: line.layer, ...match })))
        .sort((a, b) => (a.exactDelta ?? Infinity) - (b.exactDelta ?? Infinity))[0];
      result.push(best);
    }
  }
  console.log(JSON.stringify({ coordinateScaleDiagnostic: "Exact cyclic/reverse vertex correspondence only; this is a scale diagnostic and does not infer layer semantics or prove piece identity. Factors compare source raw coordinates against DXF output block coordinates.", results: result }, null, 2));
  process.exit(0);
}
if (process.argv.includes("--inventory")) {
  const boundsFor = (path) => ({ minX: Math.min(...path.vertices.map((v) => v.x)), maxX: Math.max(...path.vertices.map((v) => v.x)),
    minY: Math.min(...path.vertices.map((v) => v.y)), maxY: Math.max(...path.vertices.map((v) => v.y)) });
  const blocks = [...new Set(output.outputPolys.map((p) => p.block))].map((block) => ({ block,
    insert: output.inserts.find((i) => i.block === block),
    closedPolylines: output.outputPolys.filter((p) => p.block === block && p.closed).map((p) => ({ layer: p.layer, vertices: p.vertices.length, arcSegments: p.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length, bounds: boundsFor(p) })) }));
  console.log(JSON.stringify({ source: source.sourcePolys.map((p, i) => ({ index: i, layer: p.layer, vertices: p.vertices.length, bounds: boundsFor(p) })),
    inserts: output.inserts.length, outputPolylines: output.outputPolys.length, outputLayers: [...new Set(output.outputPolys.map((p) => p.layer))], blocks }, null, 2));
  process.exit(0);
}
assert.equal(source.sourcePolys.length, 18, "input contains all 18 CUT/SEW outlines");
assert(source.sourcePolys.every((p) => p.closed), "all input outlines are closed");
assert.equal(source.sourcePolys.filter((p) => p.layer === "CUT").length, 9);
assert.equal(source.sourcePolys.filter((p) => p.layer === "SEW").length, 9);
assert.equal(output.inserts.length, 9, "CLO output retains nine inserted pieces");
assert(output.outputPolys.length >= 18, "CLO output contains at least one CUT/SEW candidate per piece");
function bounds(path) {
  const xs = path.vertices.map(({ x }) => x), ys = path.vertices.map(({ y }) => y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}
function boxGap(a, b) {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.hypot(dx, dy);
}
const pieces = ["front", "back", "sleeve", "button placket", "buttonhole placket", "outer collar stand", "inner collar stand", "upper pointed collar", "under pointed collar"];
const results = pieces.map((piece, i) => {
  const cut = source.sourcePolys[i * 2], sew = source.sourcePolys[i * 2 + 1];
  const sameBlockGeometry = (sourcePath, line) => ({
    line,
    exact: exactCycleDelta(sourcePath.vertices, line.vertices),
    distance: sampledSymmetricDistance(sourcePath, line),
  });
  const sewCandidates = output.outputPolys.filter((line) => line.closed)
    .map((line) => ({ line, boxGapCm: boxGap(bounds(sew), bounds(line)) }))
    .sort((a, b) => a.boxGapCm - b.boxGapCm)
    .slice(0, 16)
    .map(({ line, boxGapCm }) => ({ ...sameBlockGeometry(sew, line), boxGapCm }))
    .sort((a, b) => a.distance.conservativeUpperBoundCm - b.distance.conservativeUpperBoundCm);
  const exactSewCandidates = sewCandidates.filter(({ exact }) => exact !== null && exact <= gateCm)
    .sort((a, b) => a.exact - b.exact);
  const sewMatch = exactSewCandidates[0] ?? sewCandidates[0];
  const exactPieceBinding = exactSewCandidates.length > 0;
  const sameBlockRaw = output.outputPolys.filter((line) => line.block === sewMatch.line.block && line.closed && line !== sewMatch.line);
  const sameBlock = [...new Map(sameBlockRaw.map((line) => [line.vertices.map(({ x, y, bulge }) => `${x.toFixed(6)},${y.toFixed(6)},${(bulge ?? 0).toFixed(6)}`).join(";"), line])).values()];
  const cutCandidates = (sameBlock.length ? sameBlock : output.outputPolys.filter((line) => line.closed))
    .map((line) => ({ line, boxGapCm: boxGap(bounds(cut), bounds(line)) }))
    .sort((a, b) => a.boxGapCm - b.boxGapCm)
    .slice(0, 16)
    .map(({ line, boxGapCm }) => ({ line, exact: exactCycleDelta(cut.vertices, line.vertices), distance: sampledSymmetricDistance(cut, line), boxGapCm }))
    .sort((a, b) => a.distance.conservativeUpperBoundCm - b.distance.conservativeUpperBoundCm);
  const best = cutCandidates[0];
  const passes = exactPieceBinding && best.distance.conservativeUpperBoundCm <= gateCm;
  return {
    piece, receiverBlock: sewMatch.line.block, pieceBinding: exactPieceBinding ? "exact-sew-vertex-match" : "best-geometric-sew-candidate-only",
    sew: { inputVertices: sew.vertices.length, outputVertices: sewMatch.line.vertices.length, receiverLayer: sewMatch.line.layer,
      exactCyclicCoordinateDeltaCm: sewMatch.exact, conservativeUpperBoundCm: sewMatch.distance.conservativeUpperBoundCm,
      passes: sewMatch.distance.conservativeUpperBoundCm <= gateCm,
      bestCandidates: sewCandidates.slice(0, 5).map(({ line, exact, distance, boxGapCm }) => ({ block: line.block, layer: line.layer,
        outputVertices: line.vertices.length, boxGapCm, exactCyclicCoordinateDeltaCm: exact, conservativeUpperBoundCm: distance.conservativeUpperBoundCm })) },
    cut: { inputVertices: cut.vertices.length, inputArcSegments: cut.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length,
      outputVertices: best.line.vertices.length, outputArcSegments: best.line.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length,
      outputLayer: best.line.layer, ...best.distance, gateCm, passes,
      closedOutlineCandidates: cutCandidates.map(({ line, exact, distance, boxGapCm }) => ({ layer: line.layer, vertices: line.vertices.length,
        block: line.block, boxGapCm,
        arcSegments: line.vertices.filter((v) => Math.abs(v.bulge) > 1e-12).length,
        exactCyclicDeltaCm: exact,
        sampledMaxCm: distance.sampledMaxCm, conservativeUpperBoundCm: distance.conservativeUpperBoundCm })) },
  };
});
const report = {
  experiment: "One-generation CLO 2026.1.310 Standard DXF import and DXF-ASTM export of the hash-pinned original Polo M fixture, followed by same-profile CLO ASTM reimport; settings recorded in the slice packet.",
  geometryBaseline: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes), closedOutlineCount: source.sourcePolys.length, layerCounts: Object.fromEntries(["CUT", "SEW"].map((layer) => [layer, source.sourcePolys.filter((p) => p.layer === layer).length])) },
  importedFixture: { path: fixturePath, bytes: fixtureBytes.length, sha256: sha(fixtureBytes), sourcePreflight: { path: preflightPath, sha256: sha(preflightBytes) } },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes), acadver: output.acadver, insertedPieces: output.inserts.length, blockPolylineCountIncludingInternalPaths: output.outputPolys.length, outputLayers: [...new Set(output.outputPolys.map((p) => p.layer))] },
  method: "First attempt the S609 exact cyclic/reverse source-SEW vertex binding. If that fails, report the five closest closed output contours by sampled symmetric distance as geometric candidates only; no exact piece identity is inferred from a nearest match. CUT is compared within the bound block where exact SEW binding succeeds, or globally as unbound diagnostic evidence where it does not. The conservative geometric pass requires both exact piece binding and a symmetric-distance upper bound <=0.001 cm. Straight and bulge-arc paths are sampled at <=0.0005 cm, with half-spacing (0.00025 cm) added using the 1-Lipschitz distance-to-curve bound.",
  thresholdCm: gateCm, sampleStepCm, results,
  strictCutPassCount: results.filter((r) => r.cut.passes).length,
  strictSewPassCount: results.filter((r) => r.sew.passes).length,
  limitations: "This is first-generation round-trip evidence for one Polo base configuration and one CLO version/profile. It does not establish all-seven coverage, all options or grades, complete semantics, malformed-input rejection, multi-generation stability, normative AAMA conformance, physical fit, factory acceptance, or production readiness.",
};
await mkdir(`${root}/Evidence/Analysis`, { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ geometryBaseline: report.geometryBaseline, importedFixture: report.importedFixture, output: report.output, strictCutPassCount: report.strictCutPassCount, strictSewPassCount: report.strictSewPassCount, results: results.map(({ piece, receiverBlock, sew, cut }) => ({ piece, receiverBlock, sew, cut: { inputVertices: cut.inputVertices, inputArcSegments: cut.inputArcSegments, outputVertices: cut.outputVertices, outputArcSegments: cut.outputArcSegments, outputLayer: cut.outputLayer, sampledMaxCm: cut.sampledMaxCm, conservativeUpperBoundCm: cut.conservativeUpperBoundCm, sampleStepCm: cut.sampleStepCm, passes: cut.passes } })) }, null, 2));
