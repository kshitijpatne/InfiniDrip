import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m.dxf";
const mapPath = "C:/G04-CLO-DXF-Exchange/S552-polo-short-edge-loss-diagnosis/polo-short-edge-mapping.json";
const s590VariantPath = "C:/G04-CLO-DXF-Exchange/S590-polo-cut-corner-curve-trial/Input/polo-standard-m-fillet-r005cm.dxf";
const s590ReportPath = "C:/G04-CLO-DXF-Exchange/S590-polo-cut-corner-curve-trial/Evidence/Analysis/S590-roundtrip-analysis.json";
const outputPath = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Input/polo-standard-m-cut-degree1-spline.dxf";
const reportPath = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Evidence/S591-source-preflight.json";
const expectedSourceSha = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const expectedS590VariantSha = "db1932397a17b07ccdd85e566c966d74ac82b806931d13a4e94c3174d7ed9078";
const expectedS590ReportSha = "8439654fd220238cd288bf1e485cbffbafae9005c69d1927e15246dc19f61a1d";
const expectedS590OutputSha = "3efa330d125664449e3d092e92f096afdb607c867e7bebd3ddbc9fa40536c457";
const cutIndexes = new Map([[2, "back"], [10, "outer collar stand"], [12, "inner collar stand"], [14, "upper pointed collar"], [16, "under pointed collar"]]);
const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");
const sourceBytes = await readFile(sourcePath);
const s590VariantBytes = await readFile(s590VariantPath);
const s590ReportBytes = await readFile(s590ReportPath);
assert.equal(sha(sourceBytes), expectedSourceSha, "pinned original source changed");
assert.equal(sha(s590VariantBytes), expectedS590VariantSha, "pinned S590 derivative changed");
assert.equal(sha(s590ReportBytes), expectedS590ReportSha, "pinned S590 output analysis changed");
const map = JSON.parse(await readFile(mapPath, "utf8"));
const s590Report = JSON.parse(s590ReportBytes);

function pairsFrom(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group/value pair");
  return Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[i * 2].trim()), lines[i * 2 + 1]]);
}
function sectionsOf(pairs) {
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1]?.[1], pairs: [], records: [] };
      sections.push(section);
      section.pairs.push(pairs[i], pairs[++i]);
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") {
      section?.pairs.push(pairs[i]);
      section = undefined;
    } else if (section) section.pairs.push(pairs[i]);
  }
  for (const item of sections) {
    let current;
    for (const pair of item.pairs.slice(2, -1)) {
      if (pair[0] === 0) {
        current = [pair];
        item.records.push(current);
      } else current?.push(pair);
    }
    if (item.name === "ENTITIES" || item.name === "BLOCKS") {
      const grouped = [];
      for (let i = 0; i < item.records.length; i++) {
        const record = item.records[i];
        if (record[0]?.[1] !== "POLYLINE") { grouped.push(record); continue; }
        const compound = [...record];
        while (item.records[i + 1]?.[0]?.[1] === "VERTEX") compound.push(...item.records[++i]);
        assert.equal(item.records[i + 1]?.[0]?.[1], "SEQEND", "POLYLINE missing SEQEND");
        compound.push(...item.records[++i]);
        grouped.push(compound);
      }
      item.records = grouped;
    }
  }
  return sections;
}
const value = (entity, code) => entity.find(([group]) => group === code)?.[1];
function polylineVertices(record) {
  const vertices = [];
  if (record[0]?.[1] === "LWPOLYLINE") {
    for (const [group, raw] of record.slice(1)) {
      if (group === 10) vertices.push({ rawX: raw, rawY: undefined, rawZ: "0", x: Number(raw), y: NaN, z: 0, bulge: 0, flags: 0 });
      else if (group === 20 && vertices.length) { vertices.at(-1).rawY = raw; vertices.at(-1).y = Number(raw); }
      else if (group === 42 && vertices.length) vertices.at(-1).bulge = Number(raw);
    }
    return vertices;
  }
  for (let i = 1; i < record.length; i++) {
    if (record[i][0] !== 0 || record[i][1] !== "VERTEX") continue;
    const start = i;
    while (i + 1 < record.length && record[i + 1][0] !== 0) i++;
    const vertex = record.slice(start, i + 1);
    const rawX = value(vertex, 10), rawY = value(vertex, 20), rawZ = value(vertex, 30) ?? "0";
    vertices.push({ rawX, rawY, rawZ, x: Number(rawX), y: Number(rawY), z: Number(rawZ), flags: Number(value(vertex, 70) ?? 0) });
  }
  return vertices;
}
function parseInsert(record) {
  return { block: value(record, 2), x: Number(value(record, 10) ?? 0), y: Number(value(record, 20) ?? 0), sx: Number(value(record, 41) ?? 1), sy: Number(value(record, 42) ?? 1), angle: Number(value(record, 50) ?? 0) * Math.PI / 180 };
}
function transformPoint(point, insert) {
  const a = insert.angle;
  return { x: insert.x + point.x * insert.sx * Math.cos(a) - point.y * insert.sy * Math.sin(a), y: insert.y + point.x * insert.sx * Math.sin(a) + point.y * insert.sy * Math.cos(a) };
}
function nearestPointOnSegment(point, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
  const t = den ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / den)) : 0;
  const closestPoint = { x: a.x + t * dx, y: a.y + t * dy };
  return { closestPoint, distanceCm: Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y) };
}
function splineRecord(originalRecord, vertices) {
  const n = vertices.length;
  assert(n >= 3, "target contour too short");
  const headerPairs = originalRecord.slice(0, originalRecord.findIndex(([code, v]) => code === 0 && v === "VERTEX"));
  const layer = value(headerPairs, 8);
  assert.equal(layer, "CUT", "only CUT records may be changed");
  const retainedProperties = headerPairs.filter(([code]) => ![0, 66, 70, 10, 20, 30, 39, 100, 210, 220, 230].includes(code));
  const controlPoints = [...vertices, vertices[0]];
  const knots = [0, 0, ...Array.from({ length: n - 1 }, (_, i) => i + 1), n, n];
  assert.equal(controlPoints.length, n + 1);
  assert.equal(knots.length, n + 3);
  const out = [[0, "SPLINE"], ...retainedProperties, [100, "AcDbEntity"], [100, "AcDbSpline"], [210, "0"], [220, "0"], [230, "1"], [70, "25"], [71, "1"], [72, String(knots.length)], [73, String(controlPoints.length)], [74, "0"], [42, "0.0000001"], [43, "0.0000001"], [44, "0.0000000001"]];
  for (const knot of knots) out.push([40, String(knot)]);
  for (const p of controlPoints) out.push([10, p.rawX], [20, p.rawY], [30, p.rawZ]);
  return out;
}
function serialize(pairs) { return `${pairs.map(([code, v]) => `${code}\r\n${v}`).join("\r\n")}\r\n`; }

const sections = sectionsOf(pairsFrom(sourceBytes));
const entities = sections.find(({ name }) => name === "ENTITIES");
assert(entities, "source has no ENTITIES section");
const polyRecords = entities.records.filter((record) => record[0]?.[1] === "POLYLINE");
assert.equal(polyRecords.length, 18, "unexpected source polyline count");
assert.deepEqual(polyRecords.map((r) => value(r, 8)), ["CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW"]);
const sourceByIndex = new Map(polyRecords.map((record, index) => [index, record]));
const targetFindings = new Map(map.findings.map((finding) => [finding.sourceOrdinal, finding]));
const s590ByPiece = new Map(s590Report.results.map((result) => [result.piece, result]));
const s590VariantSections = sectionsOf(pairsFrom(s590VariantBytes));
const s590VariantPolylines = s590VariantSections.find(({ name }) => name === "ENTITIES").records.filter((record) => ["POLYLINE", "LWPOLYLINE"].includes(record[0]?.[1]));
const s590VariantByIndex = new Map(s590VariantPolylines.map((record, index) => [index, record]));
const s590OutputBytes = await readFile(s590Report.output.path);
assert.equal(sha(s590OutputBytes), expectedS590OutputSha, "pinned S590 CLO output changed");
const s590OutputSections = sectionsOf(pairsFrom(s590OutputBytes));
const outputEntities = s590OutputSections.find(({ name }) => name === "ENTITIES").records;
const inserts = outputEntities.filter((record) => record[0]?.[1] === "INSERT").map(parseInsert);
const outputByBlock = new Map();
let blockName;
for (const record of s590OutputSections.find(({ name }) => name === "BLOCKS").records) {
  if (record[0]?.[1] === "BLOCK") blockName = value(record, 2);
  else if (record[0]?.[1] === "ENDBLK") blockName = undefined;
  else if (blockName && record[0]?.[1] === "POLYLINE") {
    const insertion = inserts.find(({ block }) => block === blockName) ?? { x: 0, y: 0, sx: 1, sy: 1, angle: 0 };
    const candidate = { block: blockName, layer: value(record, 8), closed: Boolean(Number(value(record, 70) ?? 0) & 1), vertices: polylineVertices(record).map(({ x, y }) => transformPoint({ x, y }, insertion)) };
    const rows = outputByBlock.get(blockName) ?? [];
    rows.push(candidate);
    outputByBlock.set(blockName, rows);
  }
}
const changed = [];
const originalEntityRecords = [...entities.records];
const nextRecords = entities.records.map((record) => {
  const index = record[0]?.[1] === "POLYLINE" ? polyRecords.indexOf(record) : -1;
  if (!cutIndexes.has(index)) return record;
  const vertices = polylineVertices(record);
  const finding = targetFindings.get(index);
  assert(finding, `S552 mapping missing source outline index ${index}`);
  assert.equal(Number(value(record, 70)) & 1, 1, "target contour must be closed via POLYLINE flag");
  assert(vertices.every(({ z, flags }) => z === 0 && flags === 0), "unexpected source Z/vertex flags");
  const spline = splineRecord(record, vertices);
  const piece = cutIndexes.get(index), s590Result = s590ByPiece.get(piece);
  const sourcePoint = vertices[finding.sourceVertexIndex];
  const witness = s590Result.cut.point;
  const bestSegments = (outputByBlock.get(finding.receiverBlock) ?? []).filter(({ closed }) => closed).flatMap((candidate) => candidate.vertices.map((a, segmentIndex) => {
    const b = candidate.vertices[(segmentIndex + 1) % candidate.vertices.length];
    return { layer: candidate.layer, vertexCount: candidate.vertices.length, segmentIndex, segmentStart: a, segmentEnd: b, ...nearestPointOnSegment(witness, a, b) };
  })).sort((a, b) => a.distanceCm - b.distanceCm);
  const nearestOutputSegment = bestSegments[0];
  assert(Math.abs(nearestOutputSegment.distanceCm - s590Result.cut.sampledMaxCm) < 0.00002, `${piece}: rederived S590 witness does not match pinned output analysis`);
  const s590VariantVertices = polylineVertices(s590VariantByIndex.get(index));
  const neighborhood = (points, center, before, after) => points.slice(Math.max(0, center - before), center + after + 1).map(({ x, y, bulge = 0 }, offset) => ({ index: Math.max(0, center - before) + offset, x, y, bulge }));
  changed.push({ index, piece, layer: value(record, 8), sourceVertexCount: vertices.length, sourcePoint, predecessor: vertices[(finding.sourceVertexIndex - 1 + vertices.length) % vertices.length], successor: vertices[(finding.sourceVertexIndex + 1) % vertices.length], sourceNeighborhood: neighborhood(vertices, finding.sourceVertexIndex, 2, 2), s590VariantNeighborhood: neighborhood(s590VariantVertices, finding.sourceVertexIndex, 2, 3), witness, nearestOutputSegment, splineControlCount: vertices.length + 1, splineKnotCount: vertices.length + 3, removedPointChordResidualCm: finding.pointToReplacementChordCm, s552Finding: finding, s590Result });
  return spline;
});
entities.records = nextRecords;
assert.equal(changed.length, 5);
assert.deepEqual(changed.map(({ piece }) => piece), [...cutIndexes.values()]);
for (let i = 0; i < nextRecords.length; i++) {
  const originalIndex = polyRecords.indexOf(originalEntityRecords[i]);
  if (originalIndex < 0 || !cutIndexes.has(originalIndex)) assert.deepEqual(nextRecords[i], originalEntityRecords[i]);
}

// Only insert the version declaration needed for the R13+ SPLINE entity.
const header = [[0, "SECTION"], [2, "HEADER"], [9, "$ACADVER"], [1, "AC1015"], [0, "ENDSEC"]];
const sectionPairs = sections.flatMap((item) => [
  ...item.pairs.slice(0, 2),
  ...item.records.flat(),
  item.pairs.at(-1),
]);
const outputPairs = [...header, ...sectionPairs, [0, "EOF"]];
const outputBytes = Buffer.from(serialize(outputPairs), "utf8");
const outputSections = sectionsOf(pairsFrom(outputBytes));
const outEntities = outputSections.find(({ name }) => name === "ENTITIES");
const splineRecords = outEntities.records.filter((record) => record[0]?.[1] === "SPLINE");
assert.equal(splineRecords.length, 5);
assert.equal(outEntities.records.filter((record) => record[0]?.[1] === "POLYLINE").length, 13);
for (let i = 0; i < changed.length; i++) {
  const record = splineRecords[i], item = changed[i];
  assert.equal(Number(value(record, 70)), 25);
  assert.equal(Number(value(record, 71)), 1);
  assert.equal(Number(value(record, 72)), item.splineKnotCount);
  assert.equal(Number(value(record, 73)), item.splineControlCount);
  assert.equal(Number(value(record, 74)), 0);
  const controls = [];
  for (let k = 0; k < record.length; k++) if (record[k][0] === 10) controls.push({ x: Number(record[k][1]), y: Number(record[k + 1]?.[1]), z: Number(record[k + 2]?.[1]) });
  assert.equal(controls.length, item.sourceVertexCount + 1);
  for (let k = 0; k < item.sourceVertexCount; k++) {
    assert.equal(controls[k].x, Number(polylineVertices(sourceByIndex.get(item.index))[k].rawX));
    assert.equal(controls[k].y, Number(polylineVertices(sourceByIndex.get(item.index))[k].rawY));
  }
  assert.deepEqual(controls.at(-1), controls[0], "closed spline must return to first control point");
  const knots = record.filter(([code]) => code === 40).map(([, raw]) => Number(raw));
  assert.equal(knots.length, item.splineKnotCount);
  assert.deepEqual(knots, [0, 0, ...Array.from({ length: item.sourceVertexCount - 1 }, (_, k) => k + 1), item.sourceVertexCount, item.sourceVertexCount]);
}
await mkdir("C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Evidence", { recursive: true });
await writeFile(outputPath, outputBytes);
const report = {
  slice: 591,
  source: { path: sourcePath, bytes: sourceBytes.length, sha256: sha(sourceBytes) },
  s590Variant: { path: s590VariantPath, sha256: sha(s590VariantBytes) },
  s590Analysis: { path: s590ReportPath, sha256: sha(s590ReportBytes) },
  output: { path: outputPath, bytes: outputBytes.length, sha256: sha(outputBytes), acadver: "AC1015", entityCounts: { originalPolylines: 18, retainedPolylines: 13, newClosedLinearSplines: 5 } },
  thresholdCm: 0.001,
  exactRepresentationClaim: "Each target spline is degree 1, with a clamped integer knot sequence and consecutive original source vertices as control points plus a duplicate first control point. In ideal DXF spline evaluation this is exactly the source piecewise-linear contour; encoded decimal controls preserve the source coordinate values exactly. This is not evidence CLO accepts or retains the entity.",
  changedContours: changed.map(({ index, piece, layer, sourcePoint, predecessor, successor, sourceNeighborhood, s590VariantNeighborhood, witness, nearestOutputSegment, splineControlCount, splineKnotCount, removedPointChordResidualCm, s552Finding, s590Result }) => ({ sourcePolylineIndexZeroBased: index, piece, layer, sourcePointIndex: s552Finding.sourceVertexIndex, sourcePoint, predecessor, successor, sourceNeighborhood, s590VariantNeighborhood, originalIncomingCm: s552Finding.incomingCm, originalOutgoingCm: s552Finding.outgoingCm, originalTurnDegrees: s552Finding.turnDegrees, originalDeletedCornerChordResidualCm: removedPointChordResidualCm, splineControlCount, splineKnotCount, s590: { sourceVertexCount: s590Result.cut.inputVertices, outputVertexCount: s590Result.cut.outputVertices, outputArcCount: s590Result.cut.outputArcSegments, sampledFailureWitnessCm: s590Result.cut.sampledMaxCm, witness, direction: s590Result.cut.direction, segmentIndex: s590Result.cut.segmentIndex, conservativeUpperBoundCm: s590Result.cut.conservativeUpperBoundCm, nearestOutputSegment: { ...nearestOutputSegment, note: "numeric layer is a path locator only; no manufacturing semantics are inferred" } } })),
  checks: { targetCutEntitiesOnly: true, allOtherInputEntityRecordsPreserved: true, originalSourceControlCoordinatesPreserved: true, sourceSideDeviationCm: 0, belowGate: true, extraSupportClaim: false },
};
assert(report.checks.sourceSideDeviationCm < report.thresholdCm);
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, outputSha256: report.output.sha256, reportPath, changedContours: report.changedContours.map(({ piece, sourcePointIndex, sourcePoint, predecessor, s590 }) => ({ piece, sourcePointIndex, sourcePoint, predecessor, outputResidualCm: s590.sampledFailureWitnessCm })), sourceSideDeviationCm: 0 }, null, 2));
