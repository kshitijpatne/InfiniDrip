import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m.dxf";
const s591Path = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Input/polo-standard-m-cut-degree1-spline.dxf";
const s592Path = "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe/Input/polo-standard-m-cut-degree1-spline-open-flag.dxf";
const s591PreflightPath = "C:/G04-CLO-DXF-Exchange/S591-polo-degree1-spline-probe/Evidence/S591-source-preflight.json";
const s592PreflightPath = "C:/G04-CLO-DXF-Exchange/S592-polo-spline-closure-flag-probe/Evidence/S592-source-preflight.json";
const outputDirectory = "C:/G04-CLO-DXF-Exchange/S594-polo-spline-semantics-audit/Evidence/Analysis";
const expectedHashes = {
  source: "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca",
  s591: "06d93e8a5a55a76f52d4c38ee3b9d74ec3309bd8f9a1bdd71de82a7b75dabcca",
  s592: "e6da8d63056848a2c010ab141dce577cf834b7738155684b4e3a7dcaa1849ce3",
  s591Preflight: "665562e1bfdb3e709ac13f1d84887448bd5b1bc510c157314fc9498c913bf3f1",
  s592Preflight: "ccfc6754f3224c72d0294dd68b459277f4e0f354ddf985960c9896f0918f3c20",
};
const targets = new Map([[2, "back"], [10, "outer collar stand"], [12, "inner collar stand"], [14, "upper pointed collar"], [16, "under pointed collar"]]);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parse(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group/value pairs");
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => [Number(lines[2 * i].trim()), lines[2 * i + 1]]);
  const sections = [];
  let section;
  for (let i = 0; i < pairs.length; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION") {
      section = { name: pairs[i + 1][1], records: [] };
      sections.push(section);
      i += 1;
    } else if (pairs[i][0] === 0 && pairs[i][1] === "ENDSEC") section = undefined;
    else if (section && pairs[i][0] === 0) section.records.push([pairs[i]]);
    else if (section) section.records.at(-1)?.push(pairs[i]);
  }
  const entities = sections.find(({ name }) => name === "ENTITIES");
  assert(entities, "missing ENTITIES section");
  const compound = [];
  for (let i = 0; i < entities.records.length; i += 1) {
    const record = entities.records[i];
    if (record[0]?.[1] === "POLYLINE") {
      const all = [...record];
      while (entities.records[i + 1]?.[0]?.[1] === "VERTEX") all.push(...entities.records[++i]);
      assert.equal(entities.records[i + 1]?.[0]?.[1], "SEQEND", "POLYLINE lacks SEQEND");
      all.push(...entities.records[++i]);
      compound.push(all);
    } else compound.push(record);
  }
  return compound;
}
const values = (record, code) => record.filter(([group]) => group === code).map(([, value]) => value);
const one = (record, code) => values(record, code)[0];
function vertices(record) {
  const points = [];
  for (let i = 0; i < record.length; i += 1) {
    if (record[i][0] !== 0 || record[i][1] !== "VERTEX") continue;
    const vertex = record.slice(i, record.findIndex((pair, j) => j > i && pair[0] === 0));
    const point = { x: Number(one(vertex, 10)), y: Number(one(vertex, 20)), rawX: one(vertex, 10), rawY: one(vertex, 20) };
    points.push(point);
  }
  return points;
}
function splineControls(record) {
  const result = [];
  for (let i = 0; i < record.length; i += 1) {
    if (record[i][0] === 10) result.push({ x: Number(record[i][1]), y: Number(record[i + 1]?.[1]), z: Number(record[i + 2]?.[1]), rawX: record[i][1], rawY: record[i + 1]?.[1], rawZ: record[i + 2]?.[1] });
  }
  return result;
}
function deBoorDegreeOne(controls, knots, u) {
  const finalSpan = controls.length - 1;
  let span = finalSpan;
  if (u < knots[finalSpan]) {
    span = -1;
    for (let k = 1; k <= finalSpan; k += 1) {
      if (knots[k] <= u && u < knots[k + 1]) { span = k; break; }
    }
  }
  assert(span >= 1 && span <= finalSpan, `parameter outside the active spline domain: ${u}`);
  const width = knots[span + 1] - knots[span];
  assert(width > 0, `zero-width active knot span ${span}`);
  const alpha = (u - knots[span]) / width;
  const left = controls[span - 1], right = controls[span];
  return { x: (1 - alpha) * left.x + alpha * right.x, y: (1 - alpha) * left.y + alpha * right.y, alpha, span };
}
function evaluateVariant(name, sourceRecords, records, expectedFlag) {
  const polys = records.filter((record) => record[0]?.[1] === "POLYLINE");
  const splines = records.filter((record) => record[0]?.[1] === "SPLINE");
  assert.equal(polys.length, 13);
  assert.equal(splines.length, 5);
  const sourcePolys = sourceRecords.filter((record) => record[0]?.[1] === "POLYLINE");
  assert.equal(sourcePolys.length, 18);
  const results = [];
  for (const [polylineIndex, piece] of targets) {
    const source = sourcePolys[polylineIndex];
    assert.equal(one(source, 8), "CUT");
    assert.equal(Number(one(source, 70)) & 1, 1);
    const sourcePoints = vertices(source);
    const matches = splines.filter((candidate) => {
      const controls = splineControls(candidate);
      return controls.length === sourcePoints.length + 1
        && controls.slice(0, sourcePoints.length).every(({ x, y }, index) => x === sourcePoints[index].x && y === sourcePoints[index].y)
        && controls.at(-1)?.x === controls[0]?.x
        && controls.at(-1)?.y === controls[0]?.y;
    });
    assert.equal(matches.length, 1, `${name}/${piece}: source-exact control geometry must bind exactly one target SPLINE`);
    const spline = matches[0];
    assert.equal(one(spline, 8), "CUT");
    const flags = Number(one(spline, 70));
    assert.equal(flags, expectedFlag);
    const degree = Number(one(spline, 71));
    const knots = values(spline, 40).map(Number);
    const controls = splineControls(spline);
    assert.equal(degree, 1);
    assert.equal(Number(one(spline, 72)), knots.length);
    assert.equal(Number(one(spline, 73)), controls.length);
    assert.equal(Number(one(spline, 74)), 0);
    assert.equal(values(spline, 11).length, 0, "unexpected fit-point data");
    assert.equal(values(spline, 41).length, 0, "unexpected explicit weights");
    assert.equal(controls.length, sourcePoints.length + 1, `${name}/${piece}: ${sourcePoints.length} source vertices vs ${controls.length} controls`);
    assert.deepEqual(controls.slice(0, sourcePoints.length).map(({ x, y }) => [x, y]), sourcePoints.map(({ x, y }) => [x, y]));
    assert.deepEqual(controls.at(-1), controls[0], "last control point must exactly repeat the first");
    assert(knots.every((value, index) => index === 0 || knots[index - 1] <= value), "knot vector must be nondecreasing");
    assert.deepEqual(knots, [0, 0, ...Array.from({ length: sourcePoints.length - 1 }, (_, index) => index + 1), sourcePoints.length, sourcePoints.length]);
    assert.equal(knots.length, controls.length + degree + 1);
    const samples = [];
    for (let segment = 0; segment < sourcePoints.length; segment += 1) {
      for (const fraction of [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
        const u = segment + fraction;
        const actual = deBoorDegreeOne(controls, knots, u);
        const a = sourcePoints[segment], b = sourcePoints[(segment + 1) % sourcePoints.length];
        const expected = { x: (1 - fraction) * a.x + fraction * b.x, y: (1 - fraction) * a.y + fraction * b.y };
        samples.push({ sourceSegment: segment, fraction, parameter: u, xResidual: actual.x - expected.x, yResidual: actual.y - expected.y, distance: Math.hypot(actual.x - expected.x, actual.y - expected.y), splineSpan: actual.span });
      }
    }
    const maxResidual = Math.max(...samples.map(({ distance }) => distance));
    const first = deBoorDegreeOne(controls, knots, knots[degree]);
    const last = deBoorDegreeOne(controls, knots, knots[controls.length]);
    const bitMeaning = { closed: Boolean(flags & 1), periodic: Boolean(flags & 2), rational: Boolean(flags & 4), planar: Boolean(flags & 8), linear: Boolean(flags & 16) };
    assert.equal(bitMeaning.closed, expectedFlag === 25);
    assert.equal(bitMeaning.periodic, false);
    assert.equal(bitMeaning.rational, false);
    assert.equal(bitMeaning.planar, true);
    assert.equal(bitMeaning.linear, true);
    assert.equal(maxResidual < 1e-12, true);
    assert.deepEqual([first.x, first.y], [sourcePoints[0].x, sourcePoints[0].y]);
    assert.deepEqual([last.x, last.y], [sourcePoints[0].x, sourcePoints[0].y]);
    results.push({ variant: name, piece, sourcePolylineIndex: polylineIndex, sourceEntityHandle: one(source, 5) ?? null, group70: flags, flags: bitMeaning, group71Degree: degree, group72KnotCount: knots.length, group73ControlPointCount: controls.length, group74FitPointCount: Number(one(spline, 74)), group42KnotTolerance: one(spline, 42), group43ControlPointTolerance: one(spline, 43), group44FitTolerance: one(spline, 44), group210Normal: [one(spline, 210), one(spline, 220), one(spline, 230)], explicitWeightCount: values(spline, 41).length, knotVector: knots, sourceControlCoordinatesRaw: controls.slice(0, sourcePoints.length).map(({ rawX, rawY, rawZ }) => [rawX, rawY, rawZ]), repeatedClosingControlPointRaw: [controls.at(-1).rawX, controls.at(-1).rawY, controls.at(-1).rawZ], sourceVertexCount: sourcePoints.length, sampleCount: samples.length, maximumIndependentDeBoorResidualCm: maxResidual, firstAndLastEvaluatedCoordinates: [[first.x, first.y], [last.x, last.y]], samples });
  }
  return results;
}

const [sourceBytes, s591Bytes, s592Bytes, s591PreflightBytes, s592PreflightBytes] = await Promise.all([readFile(sourcePath), readFile(s591Path), readFile(s592Path), readFile(s591PreflightPath), readFile(s592PreflightPath)]);
const hashes = { source: sha(sourceBytes), s591: sha(s591Bytes), s592: sha(s592Bytes), s591Preflight: sha(s591PreflightBytes), s592Preflight: sha(s592PreflightBytes) };
assert.deepEqual(hashes, expectedHashes, "one or more hash-pinned source fixtures changed");
const s591Preflight = JSON.parse(s591PreflightBytes), s592Preflight = JSON.parse(s592PreflightBytes);
assert.equal(s591Preflight.output.sha256, hashes.s591);
assert.equal(s592Preflight.output.sha256, hashes.s592);
assert.equal(s592Preflight.source.sha256, hashes.s591);
const sourceRecords = parse(sourceBytes);
const sourcePolys = sourceRecords.filter((record) => record[0]?.[1] === "POLYLINE");
assert.equal(sourcePolys.length, 18);
const s591Records = parse(s591Bytes), s592Records = parse(s592Bytes);
const s591Results = evaluateVariant("S591-group70-25", sourcePolys, s591Records, 25);
const s592Results = evaluateVariant("S592-group70-24", sourcePolys, s592Records, 24);
assert.deepEqual(s591Results.map(({ piece, sourcePolylineIndex }) => [piece, sourcePolylineIndex]), s592Results.map(({ piece, sourcePolylineIndex }) => [piece, sourcePolylineIndex]));
const report = {
  method: "Independent nonrational degree-one de Boor evaluator; seven parameters (including both endpoints) on every active knot span, compared to the corresponding source POLYLINE edge interpolation.",
  sources: {
    dxfEntityReference: "https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm",
    acDbSplineClosedPeriodicReference: "https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/GUID-AcDbSpline__AcDbSpline_int_Adesk__Boolean_Adesk__Boolean_Adesk__Boolean_AcGePoint3dArray__AcGeDoubleArray__AcGeDoubleArray__double_double.html",
    hashes,
  },
  thresholds: { sourceExactCurveNumericResidualCm: 1e-12, exchangeGateCm: 0.001 },
  interpretations: {
    directlyEncoded: "S591 group 70=25 sets bits 1+8+16 (closed, planar, linear); S592 group 70=24 sets 8+16. Both have degree 1, nondecreasing clamped integer knots, no fit points, no rational flag/weights, and a final control point exactly equal to the first.",
    documented: "Autodesk DXF documents flag bits separately: bit 1 closed; bit 2 periodic; bit 4 rational; bit 8 planar; bit 16 linear (with planar bit set). It documents degree/counts, repeated knot and control point records, tolerances, and the optional default weight. Autodesk AcDbSpline API separately defines closed loop and periodicity, and states coincident first/last controls within control-point tolerance close the spline even when the closed parameter is false.",
    calculated: "The independent de Boor values interpolate every adjacent original source vertex pair on each active span. The final span returns from the final source vertex to the first. S591 and S592 evaluate to the same source-exact piecewise-linear geometry despite group 70's closed-bit difference.",
    limits: "Autodesk field/API documentation and an independent mathematical evaluation do not establish CLO's interpretation or explain its observed output. The round-trip gate remains governed by measured imported/exported output, not by the exact source curve alone.",
  },
  results: [...s591Results, ...s592Results],
};
await mkdir(outputDirectory, { recursive: true });
const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(`${outputDirectory}/S594-spline-semantics-audit.json`, reportBytes);
console.log(JSON.stringify({ hashes, targetCountPerVariant: targets.size, maxIndependentResidualCm: Math.max(...report.results.map(({ maximumIndependentDeBoorResidualCm }) => maximumIndependentDeBoorResidualCm)), allCurvesPassSourceExactAudit: report.results.every(({ maximumIndependentDeBoorResidualCm }) => maximumIndependentDeBoorResidualCm < 1e-12), variantsHaveIdenticalEvaluatedSourceCurves: true, reportPath: `${outputDirectory}/S594-spline-semantics-audit.json`, reportSha256: sha(reportBytes) }, null, 2));
