import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const inputPath = "C:/G04-CLO-DXF-Exchange/S617-standard-dxf-units-header/Input/polo-standard-m-cm-units-header.dxf";
const derivativePath = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import/Output/polo-m-five-cut-contours-as-lines.dxf";
const manifestPath = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import/Evidence/derivative-manifest.json";
const nativePath = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import/Evidence/native-input-information.json";
const projectPath = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import/Evidence/S640-segmented-lines-standard-import.zprj";
const outputPath = "C:/G04-CLO-DXF-Exchange/S640-polo-cut-segmented-line-import/Evidence/native-cut-contour-comparison.json";
const expected = {
  input: "71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5",
  derivative: "9CD017391E428BB26B12644D01814ABC3EFFA5CE02BC7D0DB368BDCBEB7370F3",
  project: "F1B34462C189F33E676F3CE9418493AB2886D9FE45FD53666BF71F8A684EB603",
};
const scale = 10; // CLO's native coordinate unit is mm; source header declares cm.
const toleranceMm = 0.01; // 0.001 cm, unchanged V03 gate.
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
function readClassicPolyline(record) {
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

const [inputBytes, derivativeBytes, manifestBytes, nativeBytes, projectBytes] = await Promise.all([
  readFile(inputPath), readFile(derivativePath), readFile(manifestPath), readFile(nativePath), readFile(projectPath),
]);
assert.equal(sha(inputBytes), expected.input, "S617 input hash changed");
assert.equal(sha(derivativeBytes), expected.derivative, "S640 derivative hash changed");
assert.equal(sha(projectBytes), expected.project, "S640 CLO project hash changed");
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const native = JSON.parse(nativeBytes.toString("utf8"));
assert.equal(manifest.derivative.sha256, expected.derivative);
assert.equal(native.intended_project_sha256, expected.project);
assert.equal(native.pattern_count, 9);
assert.equal(native.errors.length, 0);
assert(native.patterns.every((pattern, i) => pattern.pattern_index === i && pattern.pattern_name === String(i)));

const sourceRecords = parseDxf(inputBytes).get("ENTITIES") ?? [];
const sourceCuts = sourceRecords.filter((record) => record[0]?.[1] === "POLYLINE" && value(record, 8) === "CUT");
assert.equal(sourceCuts.length, 9, "expected all nine source CUT contours");
const nativeShapes = native.patterns.flatMap((pattern) => {
  const root = pattern.input_information["Pattern InputInformation"][0];
  return (root["Children Information"] ?? []).slice(1).map((shape) => ({
    patternIndex: pattern.pattern_index,
    patternName: pattern.pattern_name,
    shapeIndex: Number(shape["Shape index"]),
    shapeName: shape["Shape name"],
    shapeType: shape["Shape type"],
    points: (shape.PointList ?? []).filter((point) => point["Point positionX"] != null)
      .map((point) => ({ x: Number(point["Point positionX"]), y: Number(point["Point positionY"]) })),
  }));
});
const results = sourceCuts.map((record, index) => {
  const sourcePoints = readClassicPolyline(record);
  const candidates = nativeShapes.map((shape) => ({
    patternIndex: shape.patternIndex, patternName: shape.patternName,
    shapeIndex: shape.shapeIndex, shapeName: shape.shapeName, shapeType: shape.shapeType,
    pointCount: shape.points.length, exact: closestCyclic(sourcePoints, shape.points),
  }));
  const bestByPattern = new Map();
  for (const candidate of candidates.filter((item) => item.exact).sort((a, b) => a.exact.maxDeltaMm - b.exact.maxDeltaMm))
    if (!bestByPattern.has(candidate.patternIndex)) bestByPattern.set(candidate.patternIndex, candidate);
  const ranked = [...bestByPattern.values()].sort((a, b) => a.exact.maxDeltaMm - b.exact.maxDeltaMm);
  const passes = ranked.filter((candidate) => candidate.exact.maxDeltaMm <= toleranceMm);
  const uniqueIdentity = passes.length === 1;
  const best = ranked[0];
  return {
    sourceCutOrdinal: index,
    sourceVertexCount: sourcePoints.length,
    receiverPieceIdentity: uniqueIdentity ? { patternIndex: passes[0].patternIndex, patternName: passes[0].patternName } : null,
    bestNativeCandidate: best ? { patternIndex: best.patternIndex, patternName: best.patternName, shapeIndex: best.shapeIndex, pointCount: best.pointCount, ...best.exact } : null,
    exactIdentityCandidates: passes.map((candidate) => ({ patternIndex: candidate.patternIndex, patternName: candidate.patternName, shapeIndex: candidate.shapeIndex, pointCount: candidate.pointCount, ...candidate.exact })),
    nativeCandidates: candidates.map(({ exact, ...candidate }) => ({ ...candidate, ...(exact ?? {}) })),
    status: uniqueIdentity ? "PASS_EXACT_CUT_CONTOUR" : passes.length ? "FAIL_AMBIGUOUS_NATIVE_IDENTITY" : "FAIL_CUT_CONTOUR_GEOMETRY_OR_VERTEX_COUNT",
  };
});
const exactPatternIndexes = results.filter((item) => item.status === "PASS_EXACT_CUT_CONTOUR").map((item) => item.receiverPieceIdentity.patternIndex);
assert.equal(new Set(exactPatternIndexes).size, exactPatternIndexes.length, "exact source contours resolve to duplicate native pattern identities");

const report = {
  slice: "S640",
  experiment: "Subset-isolation rerun of a previously tested entity-encoding family: replace only five shallow-corner closed CUT POLYLINEs with ordered coordinate-identical CUT LINE segments.",
  receiver: { application: native.clo_build_observed_ui, importMode: "Standard DXF", units: "cm", scalePercent: 100, rotate: false },
  fixtures: {
    source: { path: inputPath, bytes: inputBytes.length, sha256: sha(inputBytes) },
    derivative: { path: derivativePath, bytes: derivativeBytes.length, sha256: sha(derivativeBytes) },
    preflightManifest: { path: manifestPath, sha256: sha(manifestBytes) },
    nativeProject: { path: projectPath, bytes: projectBytes.length, sha256: sha(projectBytes) },
    nativeQuery: { path: nativePath, bytes: nativeBytes.length, sha256: sha(nativeBytes), patternCount: native.pattern_count, errors: native.errors },
  },
  method: "Source classic POLYLINE CUT vertices were read from the hash-pinned original DXF. All native child PointList contours across all nine CLO pattern identities were searched, cyclically in both windings, with centimeter-to-millimeter scaling. Exact matches must resolve to one unique native pattern, and the passing source contours must map one-to-one; the analysis does not assume CLO numeric pattern order is source order. No translation, rotation, geometry repair, or tolerance relaxation was applied. The derivative preflight separately asserts its five LINE replacements exactly reproduce the source coordinate sequence and all other source group/value records are unchanged.",
  toleranceCm: toleranceMm / 10,
  results,
  verdict: results.every((result) => result.status === "PASS_EXACT_CUT_CONTOUR") ? "PASS_PRE_EXPORT_CUT_GATE" : "FAIL_STOP_BEFORE_EXPORT",
  exportPerformed: false,
  limitations: [
    "This experiment compares CUT source geometry only. It does not prove SEW contour, marks, grade/option, receiver-profile, or round-trip acceptance.",
    "A native point-count or coordinate mismatch fails the admitted pre-export gate; this report does not diagnose CLO's internal interpretation of separate LINE entities.",
    "The saved CLO viewport overview is actual rendered output evidence, but this failure means no ASTM export or reimport is authorized by the S640 packet.",
  ],
};
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, verdict: report.verdict, results: results.map(({ sourceCutOrdinal, sourceVertexCount, status, receiverPieceIdentity, bestNativeCandidate }) => ({ sourceCutOrdinal, sourceVertexCount, status, receiverPieceIdentity, bestNativeCandidate })) }, null, 2));
