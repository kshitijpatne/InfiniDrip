import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const inputPath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const candidatePath = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Input/polo-m-named-block-wrapper.dxf";
const manifestPath = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Evidence/wrapper-preflight.json";
const nativePath = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Evidence/native-input-information.json";
const projectPath = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Evidence/S642-polo-named-block-wrapper-import.zprj";
const outputPath = "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Evidence/native-contour-comparison.json";
const expectedHashes = {
  input: "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5",
  candidate: "3632740C8AB672915424D66E2FED996154B457DBA78F02BF05359BDDE3F86CC0",
  project: "57E2EF77A62D970E590C8D3971A89234B921315BD6711AEA4D724DF286388E64",
};
const scale = 10; // source units are cm; CLO native point coordinates are mm.
const toleranceMm = 0.01; // V03 limit remains 0.001 cm.
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0, "DXF must contain complete group/value pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1].trimEnd()]);
  const sections = new Map();
  let current;
  for (let i = 0; i < pairs.length;) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { current = pairs[i + 1]?.[1]; sections.set(current, []); i += 2; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { current = undefined; i++; continue; }
    if (!current || pairs[i][0] !== 0) { i++; continue; }
    const record = [pairs[i++]];
    while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
    if (record[0][1] === "POLYLINE") {
      while (pairs[i]?.[0] === 0 && pairs[i]?.[1] === "VERTEX") {
        record.push(pairs[i++]);
        while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
      }
      if (pairs[i]?.[0] === 0 && pairs[i]?.[1] === "SEQEND") {
        record.push(pairs[i++]);
        while (i < pairs.length && pairs[i][0] !== 0) record.push(pairs[i++]);
      }
    }
    sections.get(current).push(record);
  }
  return sections;
}

const value = (record, code) => record.find(([group]) => group === code)?.[1];
function classicPoints(record) {
  const points = [];
  for (let i = 0; i < record.length; i++) if (record[i][0] === 0 && record[i][1] === "VERTEX") {
    let end = i + 1;
    while (end < record.length && record[end][0] !== 0) end++;
    const vertex = record.slice(i + 1, end);
    points.push({ x: Number(value(vertex, 10)), y: Number(value(vertex, 20)) });
  }
  return points;
}
function closestCyclic(source, candidate) {
  if (source.length !== candidate.length) return null;
  let best;
  for (const direction of [1, -1]) for (let offset = 0; offset < candidate.length; offset++) {
    const deltas = source.map((point, i) => {
      const other = candidate[(offset + direction * i + candidate.length * 2) % candidate.length];
      return Math.hypot(point.x * scale - other.x, point.y * scale - other.y);
    });
    const maxDeltaMm = Math.max(...deltas);
    if (!best || maxDeltaMm < best.maxDeltaMm) best = { direction, offset, maxDeltaMm, rmsDeltaMm: Math.sqrt(deltas.reduce((sum, d) => sum + d ** 2, 0) / deltas.length) };
  }
  return best;
}

const [inputBytes, candidateBytes, manifestBytes, nativeBytes, projectBytes] = await Promise.all([
  readFile(inputPath), readFile(candidatePath), readFile(manifestPath), readFile(nativePath), readFile(projectPath),
]);
assert.equal(sha(inputBytes), expectedHashes.input, "pinned source changed");
assert.equal(sha(candidateBytes), expectedHashes.candidate, "candidate changed after import");
assert.equal(sha(projectBytes), expectedHashes.project, "saved CLO import project changed after native query");
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const native = JSON.parse(nativeBytes.toString("utf8"));
assert.equal(native.intended_project_sha256, expectedHashes.project, "native query targeted a different saved project");
assert.equal(native.pattern_count, 9, "CLO must return all nine pieces");
assert.deepEqual(native.errors, [], "CLO native query must return without errors");
assert.deepEqual(native.patterns.map(({ pattern_name }) => pattern_name), manifest.pieceRoles.map(({ blockName }) => blockName), "named pattern identity must be preserved in source order");

const sections = parseDxf(inputBytes);
const rawEntities = sections.get("ENTITIES") ?? [];
const groups = [];
for (const entity of rawEntities) {
  if (value(entity, 8) === "CUT") groups.push([entity]);
  else {
    assert(groups.length, "an entity precedes first CUT group");
    groups.at(-1).push(entity);
  }
}
assert.equal(groups.length, 9, "expected nine source piece groups");
assert.equal(groups.length, manifest.pieceRoles.length);
const sourceContours = groups.flatMap((group, index) => {
  const role = manifest.pieceRoles[index];
  return group.filter((entity) => entity[0]?.[1] === "POLYLINE" && ["CUT", "SEW"].includes(value(entity, 8))).map((entity) => ({
    role: role.sourceName,
    blockName: role.blockName,
    layer: value(entity, 8),
    points: classicPoints(entity),
  }));
});
assert.equal(sourceContours.length, 18, "expected one source CUT and SEW per piece");

const nativeShapes = native.patterns.flatMap((pattern) => {
  const root = pattern.input_information["Pattern InputInformation"][0];
  return (root["Children Information"] ?? []).slice(1).map((shape) => ({
    patternName: pattern.pattern_name,
    shapeIndex: Number(shape["Shape index"]),
    shapeName: shape["Shape name"],
    shapeType: shape["Shape type"],
    points: (shape.PointList ?? []).filter((point) => point["Point positionX"] != null)
      .map((point) => ({ x: Number(point["Point positionX"]), y: Number(point["Point positionY"]) })),
  }));
});

const results = sourceContours.map((source, sourceOrdinal) => {
  const candidates = nativeShapes.map((shape) => ({
    patternName: shape.patternName,
    shapeIndex: shape.shapeIndex,
    shapeName: shape.shapeName,
    shapeType: shape.shapeType,
    pointCount: shape.points.length,
    exact: closestCyclic(source.points, shape.points),
  }));
  const matches = candidates.filter((candidate) => candidate.exact && candidate.exact.maxDeltaMm <= toleranceMm);
  const ownMatches = matches.filter((candidate) => candidate.patternName === source.blockName);
  const outsideMatches = matches.filter((candidate) => candidate.patternName !== source.blockName);
  const best = candidates.filter((candidate) => candidate.exact).sort((a, b) => a.exact.maxDeltaMm - b.exact.maxDeltaMm)[0];
  const passed = ownMatches.length > 0 && outsideMatches.length === 0;
  return {
    sourceOrdinal,
    pieceRole: source.role,
    blockName: source.blockName,
    layer: source.layer,
    sourceVertexCount: source.points.length,
    exactNativeMatches: ownMatches.map(({ exact, ...candidate }) => ({ ...candidate, ...exact })),
    crossPieceExactMatches: outsideMatches.map(({ exact, ...candidate }) => ({ ...candidate, ...exact })),
    bestNativeCandidate: best ? { patternName: best.patternName, shapeIndex: best.shapeIndex, pointCount: best.pointCount, ...best.exact } : null,
    status: passed ? "PASS_SOURCE_CONTOUR" : outsideMatches.length ? "FAIL_CROSS_PIECE_IDENTITY" : "FAIL_CONTOUR_GEOMETRY_OR_VERTEX_COUNT",
  };
});

const failures = results.filter((result) => result.status !== "PASS_SOURCE_CONTOUR");
const report = {
  slice: "S642",
  experiment: "CLO DXF-AAMA import of exact Polo M source entities grouped one piece per identity BLOCK/INSERT",
  receiver: { application: native.clo_build_observed_ui, importMode: "DXF-AAMA", units: "cm", scalePercent: 100, rotate: false },
  fixtures: {
    source: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes) },
    candidate: { path: candidatePath, bytes: candidateBytes.length, sha256: sha(candidateBytes) },
    preflight: { path: manifestPath, sha256: sha(manifestBytes) },
    nativeProject: { path: projectPath, bytes: projectBytes.length, sha256: sha(projectBytes) },
    nativeQuery: { path: nativePath, bytes: nativeBytes.length, sha256: sha(nativeBytes), patternCount: native.pattern_count, errors: native.errors },
  },
  method: "Native point lists are cyclically compared in both windings to every source CUT/SEW contour after cm-to-mm unit scaling. Piece identity is checked against the unique role encoded in each source block. No alignment, repair, or threshold relaxation is applied.",
  toleranceCm: toleranceMm / 10,
  identity: { expectedPieceCount: 9, actualPieceCount: native.pattern_count, names: native.patterns.map(({ pattern_name }) => pattern_name), preservedExactly: true },
  results,
  verdict: failures.length ? "FAIL_STOP_BEFORE_EXPORT" : "PASS_PRE_EXPORT_CUT_SEW_GATE",
  exportPerformed: false,
  limitations: [
    "This bounded M/default Polo result does not qualify marks, grades/options, malformed inputs, repeated round trip, or an industrial profile and rights basis.",
    "CLO API child-shape type labels are retained as observations only; source identity and geometry are established numerically, not by inferring CUT/SEW semantics from the generic child label.",
    "A failed native contour comparison stops export under the S642 pre-export gate.",
  ],
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, verdict: report.verdict, exactContours: results.filter((result) => result.status === "PASS_SOURCE_CONTOUR").length, totalContours: results.length, failures: results.filter((result) => result.status !== "PASS_SOURCE_CONTOUR").map(({ pieceRole, layer, sourceVertexCount, bestNativeCandidate }) => ({ pieceRole, layer, sourceVertexCount, bestNativeCandidate })) }, null, 2));
