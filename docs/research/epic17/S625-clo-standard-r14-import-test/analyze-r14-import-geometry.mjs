import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S625-clo-standard-r14-import-test";
const inputPath = `${root}/Input/polo-m-r14.dxf`;
const sourcePath = "C:/G04-CLO-DXF-Exchange/S624-opencadstudio-desktop-r14-receiver/Input/polo-m.dxf";
const projectPath = `${root}/Project/polo-m-r14-standard-import.zprj`;
const infoPath = `${root}/Evidence/preexport-input-information.json`;
const outputPath = `${root}/Evidence/preexport-cut-sew-comparison.json`;
const expectedInput = "aa6e409e84345db89e094cc3ae8f131bec0ec0b21373b57b3dc0dcdf7d3a7c1c";
const expectedSource = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedProject = "afc60121f8810d3b565415b57828973b681a699d78eba282c188322d513fd990";
const toleranceMm = 0.01;
const sampleStepMm = 0.01;
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

function parseDxfPolylines(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/, "").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const value = (entity, code) => entity.find(([g]) => g === code)?.[1];
  const entities = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1]?.[1]; i++; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = undefined; continue; }
    if (section === "ENTITIES" && pairs[i][0] === 0) {
      const entity = [pairs[i]];
      for (i++; i < pairs.length && pairs[i][0] !== 0; i++) entity.push(pairs[i]);
      i--;
      entities.push(entity);
    }
  }
  const paths = [];
  for (let i = 0; i < entities.length; i++) {
    if (entities[i][0][1] !== "POLYLINE") continue;
    const vertices = [];
    for (let j = i + 1; j < entities.length && entities[j][0][1] !== "SEQEND"; j++) {
      if (entities[j][0][1] === "VERTEX") vertices.push({ x: Number(value(entities[j], 10)), y: Number(value(entities[j], 20)), bulge: Number(value(entities[j], 42) ?? 0) });
    }
    paths.push({ layer: value(entities[i], 8), closed: Boolean(Number(value(entities[i], 70) ?? 0) & 1), vertices });
  }
  return paths;
}

const at = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
function segments(path) {
  const out = [];
  for (let i = 0; i < path.vertices.length; i++) {
    const a = path.vertices[i], b = path.vertices[(i + 1) % path.vertices.length];
    if (Math.abs(a.bulge ?? 0) < 1e-12) { out.push({ a, b, bulge: 0, length: Math.hypot(b.x - a.x, b.y - a.y) }); continue; }
    const theta = 4 * Math.atan(a.bulge), chord = Math.hypot(b.x - a.x, b.y - a.y);
    const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const left = { x: -(b.y - a.y) / chord, y: (b.x - a.x) / chord };
    const offset = chord / (2 * Math.tan(theta / 2));
    const center = { x: midpoint.x + left.x * offset, y: midpoint.y + left.y * offset };
    out.push({ a, b, bulge: a.bulge, theta, radius, center, start: Math.atan2(a.y - center.y, a.x - center.x), length: radius * Math.abs(theta) });
  }
  return out;
}
function pointOn(seg, t) {
  if (!seg.bulge) return at(seg.a, seg.b, t);
  const angle = seg.start + seg.theta * t;
  return { x: seg.center.x + seg.radius * Math.cos(angle), y: seg.center.y + seg.radius * Math.sin(angle) };
}
function pointDistance(p, seg) {
  if (!seg.bulge) {
    const dx = seg.b.x - seg.a.x, dy = seg.b.y - seg.a.y, den = dx * dx + dy * dy;
    const t = den ? Math.max(0, Math.min(1, ((p.x - seg.a.x) * dx + (p.y - seg.a.y) * dy) / den)) : 0;
    return Math.hypot(p.x - (seg.a.x + t * dx), p.y - (seg.a.y + t * dy));
  }
  const angle = Math.atan2(p.y - seg.center.y, p.x - seg.center.x), tau = 2 * Math.PI;
  const progress = seg.theta >= 0 ? ((angle - seg.start) % tau + tau) % tau : ((seg.start - angle) % tau + tau) % tau;
  if (progress <= Math.abs(seg.theta) + 1e-10) return Math.abs(Math.hypot(p.x - seg.center.x, p.y - seg.center.y) - seg.radius);
  return Math.min(Math.hypot(p.x - seg.a.x, p.y - seg.a.y), Math.hypot(p.x - seg.b.x, p.y - seg.b.y));
}
function directedDistance(path, targets, direction) {
  let worst = { mm: 0, direction };
  for (const [segmentIndex, segment] of segments(path).entries()) {
    const count = Math.max(1, Math.ceil(segment.length / sampleStepMm));
    for (let i = 0; i <= count; i++) {
      const p = pointOn(segment, i / count);
      let mm = Infinity;
      for (const target of targets) mm = Math.min(mm, pointDistance(p, target));
      if (mm > worst.mm) worst = { mm, direction, segmentIndex, sampleFraction: i / count, point: p };
    }
  }
  return worst;
}
function symmetricDistance(sourceCm, nativeMm) {
  const src = { closed: true, vertices: sourceCm.vertices.map(p => ({ x: p.x * 10, y: p.y * 10, bulge: p.bulge ?? 0 })) };
  const nat = { closed: true, vertices: nativeMm.map(p => ({ x: p.x * 10, y: p.y * 10, bulge: 0 })) };
  const srcSeg = segments(src), natSeg = segments(nat);
  const a = directedDistance(src, natSeg, "source-to-native");
  const b = directedDistance(nat, srcSeg, "native-to-source");
  const worst = a.mm >= b.mm ? a : b;
  return { ...worst, sampledMaxMm: worst.mm, conservativeUpperBoundMm: worst.mm + sampleStepMm / 2, sampleStepMm };
}
function vertexSymmetricDistance(sourceCm, nativeMm) {
  const src = { closed: true, vertices: sourceCm.vertices.map(p => ({ x: p.x * 10, y: p.y * 10, bulge: p.bulge ?? 0 })) };
  const nat = { closed: true, vertices: nativeMm.map(p => ({ x: p.x * 10, y: p.y * 10, bulge: 0 })) };
  const srcSegments = segments(src), natSegments = segments(nat);
  const directed = (vertices, targets) => vertices.map(p => Math.min(...targets.map(target => pointDistance(p, target))));
  return Math.max(...directed(src.vertices, natSegments), ...directed(nat.vertices, srcSegments));
}

const [inputBytes, sourceBytes, projectBytes, infoBytes] = await Promise.all([readFile(inputPath), readFile(sourcePath), readFile(projectPath), readFile(infoPath)]);
for (const [label, actual, expected] of [["input", sha(inputBytes), expectedInput], ["source", sha(sourceBytes), expectedSource], ["project", sha(projectBytes), expectedProject]]) assert.equal(actual, expected, `${label} SHA-256 mismatch`);
const info = JSON.parse(infoBytes.toString("utf8"));
assert.equal(info.slice, "S625");
assert.equal(info.pattern_count, 9);
assert.equal(info.errors.length, 0);
assert.equal(info.intended_project_sha256.toLowerCase(), expectedProject);
assert.deepEqual(info.import_profile, { format: "Standard DXF", unit: "Centimeter", scale_percent: 100, rotation: "Do Not Rotate", grain: "Maintain Original", swap_cutting_and_sewing: false, include_notches: false, notch_target: null, notch_position: "Ratio", import_notch_to_enabled: true, import_notch_target: "Both", auto_distribute: false, optimize_all_curve_points: false, import_draw_curve_points: true, remove_non_grading_points: false, annotations: false, auto_trace_internal_line: false });

const source = parseDxfPolylines(sourceBytes);
const cut = source.filter(p => p.layer === "CUT" && p.closed);
const sew = source.filter(p => p.layer === "SEW" && p.closed);
assert.equal(cut.length, 9);
assert.equal(sew.length, 9);
const patterns = info.patterns.map(pattern => ({
  index: pattern.pattern_index,
  name: pattern.pattern_name,
  shapes: (pattern.input_information?.["Pattern InputInformation"]?.[0]?.["Children Information"] ?? []).slice(1).map(shape => ({
    index: Number(shape["Shape index"]), name: shape["Shape name"], type: shape["Shape type"],
    lineCount: Number(shape.LineList?.[0]?.["Line count"] ?? -1),
    points: (shape.PointList ?? []).filter(p => p["Point positionX"] != null && p["Point positionY"] != null).map(p => ({ x: Number(p["Point positionX"]), y: Number(p["Point positionY"]) })),
  })).filter(shape => shape.points.length >= 3 && shape.lineCount === shape.points.length),
}));
const nativeShapes = patterns.flatMap(pattern => pattern.shapes.map(shape => ({ ...shape, patternIndex: pattern.index, patternName: pattern.name })));
assert(nativeShapes.length > 0, "No closed native shape candidates returned");
const best = sourcePath => {
  const ranked = nativeShapes.map(shape => ({
    patternIndex: shape.patternIndex, patternName: shape.patternName, shapeIndex: shape.index, shapeName: shape.name, shapeType: shape.type,
    pointCount: shape.points.length, lineCount: shape.lineCount,
    vertexDistanceMm: vertexSymmetricDistance(sourcePath, shape.points),
    points: shape.points,
  })).sort((a,b) => a.vertexDistanceMm - b.vertexDistanceMm);
  const near = ranked.filter(shape => shape.vertexDistanceMm <= ranked[0].vertexDistanceMm + 0.1).slice(0,4).map(shape => ({ ...shape, distance: symmetricDistance(sourcePath, shape.points) })).sort((a,b) => a.distance.conservativeUpperBoundMm - b.distance.conservativeUpperBoundMm);
  return { nearest: near[0], rankedCountWithinGate: ranked.filter(shape => shape.vertexDistanceMm + sampleStepMm / 2 <= toleranceMm).length, nearCandidates: near.map(({points,...shape})=>shape) };
};
const comparisons = [
  ...cut.map((path, i) => ({ role: "CUT", contourOrdinal: i, sourcePoints: path.vertices.length, match: best(path) })),
  ...sew.map((path, i) => ({ role: "SEW", contourOrdinal: i, sourcePoints: path.vertices.length, match: best(path) })),
].map(({ match, ...row }) => ({ ...row, nearest: match.nearest, withinGateCandidateCount: match.rankedCountWithinGate, alternateNear: match.nearCandidates }));
const report = {
  slice: "S625", receiver: "CLO 2026.1.310 (r58944)", inputPath, inputSha256: sha(inputBytes), sourcePath, sourceSha256: sha(sourceBytes), projectPath, projectSha256: sha(projectBytes), infoPath, infoSha256: sha(infoBytes),
  profile: info.import_profile, threshold: { cm: 0.001, mm: toleranceMm },
  association: "Each source CUT and SEW closed polyline is ranked independently against every CLO native child shape with a closed point/line count. No pattern index, display name, or DXF layer is treated as semantic mapping evidence.",
  nativePatternCount: info.pattern_count, nativeShapeCandidateCount: nativeShapes.length, comparisons,
  summary: {
    cutPasses: comparisons.filter(x=>x.role==="CUT"&&x.nearest.distance.conservativeUpperBoundMm<=toleranceMm).length,
    sewPasses: comparisons.filter(x=>x.role==="SEW"&&x.nearest.distance.conservativeUpperBoundMm<=toleranceMm).length,
    all18Pass: comparisons.every(x=>x.nearest.distance.conservativeUpperBoundMm<=toleranceMm),
    maxCutResidualMm: Math.max(...comparisons.filter(x=>x.role==="CUT").map(x=>x.nearest.distance.conservativeUpperBoundMm)),
    maxSewResidualMm: Math.max(...comparisons.filter(x=>x.role==="SEW").map(x=>x.nearest.distance.conservativeUpperBoundMm)),
  },
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, summary: report.summary, comparisons: comparisons.map(({role,contourOrdinal,nearest,withinGateCandidateCount})=>({role,contourOrdinal,patternIndex:nearest.patternIndex,shapeIndex:nearest.shapeIndex,upperMm:nearest.distance.conservativeUpperBoundMm,withinGateCandidateCount}))}, null, 2));
