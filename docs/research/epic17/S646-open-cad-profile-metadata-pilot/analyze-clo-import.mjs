import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S646-open-cad-profile-metadata-pilot";
const files = {
  source: "C:/G04-CLO-DXF-Exchange/S642-polo-block-wrapper-cut-retention/Input/polo-m-named-block-wrapper.dxf",
  receiverOutput: `${root}/Output/polo-m-idr-profile-r14-first.dxf`,
  profile: `${root}/Evidence/profile-pilot.json`,
  native: `${root}/Evidence/clo-native-import.json`,
};
const output = `${root}/Evidence/clo-native-contour-comparison.json`;
const toleranceMm = 0.01; // unchanged 0.001 cm V03 gate
const scale = 10; // DXF source is cm; CLO native points are mm
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex").toUpperCase();

function parseDxf(bytes) {
  const lines = bytes.toString("utf8").replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(lines.length % 2, 0, "DXF must contain complete group/value pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1].trimEnd()]);
  const sections = new Map();
  let section;
  for (let i = 0; i < pairs.length;) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") { section = pairs[i + 1]?.[1]; sections.set(section, []); i += 2; continue; }
    if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") { section = undefined; i++; continue; }
    if (!section || pairs[i][0] !== 0) { i++; continue; }
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
    sections.get(section).push(record);
  }
  return sections;
}
const value = (record, code) => record.find(([group]) => group === code)?.[1];
function polylinePoints(record) {
  const points = [];
  for (let i = 0; i < record.length; i++) if (record[i][0] === 0 && record[i][1] === "VERTEX") {
    let end = i + 1;
    while (end < record.length && record[end][0] !== 0) end++;
    const fields = record.slice(i + 1, end);
    points.push({ x: Number(value(fields, 10)), y: Number(value(fields, 20)) });
  }
  return points;
}
function namedBlocks(section) {
  const blocks = new Map();
  for (let i = 0; i < section.length;) {
    const head = section[i++];
    if (head[0]?.[1] !== "BLOCK") continue;
    const name = value(head, 2);
    const records = [];
    while (i < section.length && section[i][0]?.[1] !== "ENDBLK") records.push(section[i++]);
    if (section[i]?.[0]?.[1] === "ENDBLK") i++;
    if (name?.startsWith("IDR_POLO_")) blocks.set(name, records);
  }
  return blocks;
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

const [sourceBytes, receiverBytes, profileBytes, nativeBytes] = await Promise.all(Object.values(files).map((path) => readFile(path)));
const sourceBlocks = namedBlocks(parseDxf(sourceBytes).get("BLOCKS") ?? []);
const profile = JSON.parse(profileBytes.toString("utf8"));
const native = JSON.parse(nativeBytes.toString("utf8"));
assert.equal(hash(receiverBytes), profile.first.sha256, "the CLO candidate must equal OpenCAD's hash-pinned first R14 output");
const normalizedPath = (path) => path.replaceAll("\\", "/").toLowerCase();
assert.equal(normalizedPath(native.input), normalizedPath(files.receiverOutput), "the CLO query must identify the exact candidate path");
assert.equal(native.receiver, "CLO 2026.1.310");
assert.equal(native.settings.file_format, "DXF-AAMA");
assert.equal(native.settings.units, "Centimeter");
assert.equal(native.settings.scale_percent, 100);
assert.equal(native.pattern_count, 9);
assert.deepEqual(native.errors, []);
assert.deepEqual(native.patterns.map(({ pattern_name }) => pattern_name), [...sourceBlocks.keys()], "CLO must preserve all nine named piece identities in source order");

const nativeShapes = native.patterns.flatMap((pattern) => {
  const rootInfo = pattern.input_information["Pattern InputInformation"][0];
  return (rootInfo["Children Information"] ?? []).slice(1).map((shape) => ({
    patternName: pattern.pattern_name,
    shapeIndex: Number(shape["Shape index"]),
    shapeName: shape["Shape name"],
    shapeType: shape["Shape type"],
    points: (shape.PointList ?? []).filter((point) => point["Point positionX"] != null)
      .map((point) => ({ x: Number(point["Point positionX"]), y: Number(point["Point positionY"]) })),
  }));
});
const expected = [...sourceBlocks].flatMap(([role, records]) => records
  .filter((record) => record[0]?.[1] === "POLYLINE" && ["CUT", "SEW"].includes(value(record, 8)))
  .map((record) => ({ role, layer: value(record, 8), points: polylinePoints(record) })));
assert.equal(expected.length, 18, "expected one CUT and one SEW contour per source piece");
const results = expected.map((source, sourceOrdinal) => {
  const candidates = nativeShapes.filter((shape) => shape.patternName === source.role).map((shape) => ({
    shapeIndex: shape.shapeIndex, shapeName: shape.shapeName, shapeType: shape.shapeType,
    pointCount: shape.points.length, exact: closestCyclic(source.points, shape.points),
  }));
  const passing = candidates.filter((candidate) => candidate.exact && candidate.exact.maxDeltaMm <= toleranceMm);
  const best = candidates.filter((candidate) => candidate.exact).sort((a, b) => a.exact.maxDeltaMm - b.exact.maxDeltaMm)[0];
  return {
    sourceOrdinal, role: source.role, layer: source.layer, sourceVertexCount: source.points.length,
    exactNativeMatches: passing.map(({ exact, ...candidate }) => ({ ...candidate, ...exact })),
    bestNativeCandidate: best ? { shapeIndex: best.shapeIndex, shapeName: best.shapeName, pointCount: best.pointCount, ...best.exact } : null,
    status: passing.length > 0 ? "PASS_SOURCE_CONTOUR" : "FAIL_CONTOUR_GEOMETRY_OR_VERTEX_COUNT",
  };
});
const failures = results.filter((result) => result.status !== "PASS_SOURCE_CONTOUR");
const summary = {
  slice: "S646", receiver: "CLO 2026.1.310", importMode: "DXF-AAMA", units: "cm", scalePercent: 100,
  source: { path: files.source, sha256: hash(sourceBytes), bytes: sourceBytes.length },
  openedR14: { path: files.receiverOutput, sha256: hash(receiverBytes), bytes: receiverBytes.length },
  profilePilot: { path: files.profile, sha256: hash(profileBytes), expectedCandidateSha256: profile.first.sha256 },
  nativeQuery: { path: files.native, sha256: hash(nativeBytes), patternCount: native.pattern_count, errors: native.errors },
  identity: { expectedPieceCount: 9, actualPieceCount: native.pattern_count, names: native.patterns.map(({ pattern_name }) => pattern_name), preservedExactly: true },
  method: "Compare every source CUT and SEW classic POLYLINE in named piece blocks against that same-named CLO native child contour, cyclically in both windings after cm-to-mm scaling. No alignment, repair, transformation, or tolerance relaxation is applied.",
  toleranceCm: toleranceMm / 10,
  results,
  verdict: failures.length ? "FAIL_STOP_BEFORE_EXPORT" : "PASS_PRE_EXPORT_CUT_SEW_GATE",
  exportPerformed: false,
  limitations: [
    "One Polo M fixture only. This does not qualify marks, options/grades, malformed input, a repeated CLO round trip, readability, or an industrial apparel standard.",
    "CLO native child type labels are observations only; source layers establish intended CUT/SEW identity.",
    "OpenCAD two-pass byte reproducibility and geometry preservation are independent of this actual receiver import result.",
  ],
};
await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ output, verdict: summary.verdict, exactContours: results.filter((item) => item.status === "PASS_SOURCE_CONTOUR").length, totalContours: results.length, failures: failures.map(({ role, layer, sourceVertexCount, bestNativeCandidate }) => ({ role, layer, sourceVertexCount, bestNativeCandidate })) }, null, 2));
