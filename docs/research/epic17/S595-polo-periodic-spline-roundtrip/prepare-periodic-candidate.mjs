import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourcePath = "C:/G04-CLO-DXF-Exchange/S536-polo-aama-vertex-preservation/Input/polo-standard-m.dxf";
const outputPath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input/polo-m-periodic-degree1-spline.dxf";
const reportPath = "C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Evidence/Analysis/S595-periodic-source-preflight.json";
const expectedSourceHash = "796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca";
const targetNames = new Map([[2, "back"], [10, "outer collar stand"], [12, "inner collar stand"], [14, "upper pointed collar"], [16, "under pointed collar"]]);
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");

function parsePairs(bytes) {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, "DXF has incomplete group/value pairs");
  return Array.from({ length: lines.length / 2 }, (_, index) => [Number(lines[index * 2].trim()), lines[index * 2 + 1]]);
}
function sectionsOf(pairs) {
  const sections = [];
  let section;
  for (let index = 0; index < pairs.length; index += 1) {
    if (pairs[index][0] === 0 && pairs[index][1] === "SECTION") {
      section = { name: pairs[index + 1]?.[1], pairs: [], records: [] };
      sections.push(section);
      section.pairs.push(pairs[index], pairs[++index]);
    } else if (pairs[index][0] === 0 && pairs[index][1] === "ENDSEC") {
      section?.pairs.push(pairs[index]);
      section = undefined;
    } else if (section) section.pairs.push(pairs[index]);
  }
  for (const item of sections) {
    let record;
    for (const pair of item.pairs.slice(2, -1)) {
      if (pair[0] === 0) { record = [pair]; item.records.push(record); }
      else record?.push(pair);
    }
    if (item.name === "ENTITIES" || item.name === "BLOCKS") {
      const compound = [];
      for (let index = 0; index < item.records.length; index += 1) {
        const current = item.records[index];
        if (current[0]?.[1] !== "POLYLINE") { compound.push(current); continue; }
        const poly = [...current];
        while (item.records[index + 1]?.[0]?.[1] === "VERTEX") poly.push(...item.records[++index]);
        assert.equal(item.records[index + 1]?.[0]?.[1], "SEQEND", "POLYLINE missing SEQEND");
        poly.push(...item.records[++index]);
        compound.push(poly);
      }
      item.records = compound;
    }
  }
  return sections;
}
const one = (record, code) => record.find(([group]) => group === code)?.[1];
const values = (record, code) => record.filter(([group]) => group === code).map(([, value]) => value);
function polylineVertices(record) {
  const vertices = [];
  for (let index = 0; index < record.length; index += 1) {
    if (record[index][0] !== 0 || record[index][1] !== "VERTEX") continue;
    let end = index + 1;
    while (end < record.length && record[end][0] !== 0) end += 1;
    const vertex = record.slice(index, end);
    vertices.push({ rawX: one(vertex, 10), rawY: one(vertex, 20), rawZ: one(vertex, 30) ?? "0", x: Number(one(vertex, 10)), y: Number(one(vertex, 20)), z: Number(one(vertex, 30) ?? 0), flags: Number(one(vertex, 70) ?? 0), bulge: Number(one(vertex, 42) ?? 0) });
  }
  return vertices;
}
function periodicSpline(original, points) {
  const count = points.length;
  assert(count >= 3);
  const header = original.slice(0, original.findIndex(([code, value]) => code === 0 && value === "VERTEX"));
  assert.equal(one(header, 8), "CUT", "only target CUT records may change");
  const retained = header.filter(([code]) => ![0, 66, 70, 10, 20, 30, 39, 100, 210, 220, 230].includes(code));
  const knots = Array.from({ length: count + 1 }, (_, index) => index);
  const result = [[0, "SPLINE"], ...retained, [100, "AcDbEntity"], [100, "AcDbSpline"], [210, "0"], [220, "0"], [230, "1"], [70, "27"], [71, "1"], [72, String(knots.length)], [73, String(count)], [74, "0"], [42, "0.0000001"], [43, "0.0000001"], [44, "0.0000000001"]];
  for (const knot of knots) result.push([40, String(knot)]);
  for (const point of points) result.push([10, point.rawX], [20, point.rawY], [30, point.rawZ]);
  return result;
}
function periodicDegreeOne(controls, knots, parameter) {
  const count = controls.length;
  const period = knots.at(-1) - knots[0];
  const wrapped = ((parameter % period) + period) % period;
  const span = Math.min(count - 1, Math.floor(wrapped));
  const alpha = wrapped - span;
  const left = controls[(span + count - 1) % count];
  const right = controls[span];
  return { x: (1 - alpha) * left.x + alpha * right.x, y: (1 - alpha) * left.y + alpha * right.y, span, alpha };
}

const sourceBytes = await readFile(sourcePath);
const sourceHash = sha(sourceBytes);
assert.equal(sourceHash, expectedSourceHash, "pinned S536 original source changed");
const sourceSections = sectionsOf(parsePairs(sourceBytes));
const sourceEntities = sourceSections.find(({ name }) => name === "ENTITIES");
assert(sourceEntities, "source lacks ENTITIES");
const originalRecords = [...sourceEntities.records];
const sourcePolylines = originalRecords.filter((record) => record[0]?.[1] === "POLYLINE");
assert.equal(sourcePolylines.length, 18);
assert.deepEqual(sourcePolylines.map((record) => one(record, 8)), ["CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW", "CUT", "SEW"]);
const sourceByIndex = new Map(sourcePolylines.map((record, index) => [index, record]));
const targets = [];
const changedRecords = originalRecords.map((record) => {
  const sourceIndex = sourcePolylines.indexOf(record);
  if (!targetNames.has(sourceIndex)) return record;
  assert.equal(one(record, 8), "CUT");
  assert.equal(Number(one(record, 70)) & 1, 1, "target source contour must be closed");
  const points = polylineVertices(record);
  assert(points.every(({ z, flags, bulge }) => z === 0 && flags === 0 && bulge === 0), "source target must be planar, unbulged, and vertex-flag-free");
  assert.notDeepEqual([points[0].x, points[0].y], [points.at(-1).x, points.at(-1).y], "source storage must not contain an already-repeated closing vertex");
  const periodic = periodicSpline(record, points);
  const controls = points.map(({ x, y }) => ({ x, y }));
  const knots = values(periodic, 40).map(Number);
  assert.equal(Number(one(periodic, 70)), 27);
  assert.equal(Number(one(periodic, 71)), 1);
  assert.equal(Number(one(periodic, 72)), controls.length + 1);
  assert.equal(Number(one(periodic, 73)), controls.length);
  assert.equal(Number(one(periodic, 74)), 0);
  assert.deepEqual(knots, Array.from({ length: controls.length + 1 }, (_, index) => index));
  assert.equal(controls[0].x === controls.at(-1).x && controls[0].y === controls.at(-1).y, false);
  assert.equal((27 & 1) !== 0, true);
  assert.equal((27 & 2) !== 0, true);
  assert.equal((27 & 4) !== 0, false);
  assert.equal((27 & 8) !== 0, true);
  assert.equal((27 & 16) !== 0, true);
  assert.equal(values(periodic, 41).length, 0);
  assert.equal(values(periodic, 11).length, 0);
  const samples = [];
  for (let span = 0; span < controls.length; span += 1) {
    const sourceSegment = (span + controls.length - 1) % controls.length;
    const start = points[sourceSegment], end = points[(sourceSegment + 1) % controls.length];
    for (const fraction of [0, 0.125, 0.25, 0.5, 0.75, 0.875, 1]) {
      const actual = periodicDegreeOne(controls, knots, span + fraction);
      const expected = { x: (1 - fraction) * start.x + fraction * end.x, y: (1 - fraction) * start.y + fraction * end.y };
      samples.push({ span, sourceSegment, fraction, residualCm: Math.hypot(actual.x - expected.x, actual.y - expected.y) });
    }
  }
  const maxResidual = Math.max(...samples.map(({ residualCm }) => residualCm));
  assert.equal(maxResidual, 0, `${targetNames.get(sourceIndex)} periodic curve failed exact source equality`);
  const atPeriodStart = periodicDegreeOne(controls, knots, 0);
  const atPeriodEnd = periodicDegreeOne(controls, knots, controls.length);
  assert.deepEqual([atPeriodStart.x, atPeriodStart.y], [atPeriodEnd.x, atPeriodEnd.y], "periodic endpoints do not coincide");
  const sourceSegmentsRepresented = samples.filter(({ fraction }) => fraction === 0.5).map(({ sourceSegment }) => sourceSegment);
  assert.deepEqual([...sourceSegmentsRepresented].sort((a, b) => a - b), Array.from({ length: controls.length }, (_, index) => index), "each source edge must occur exactly once");
  targets.push({ sourceIndex, piece: targetNames.get(sourceIndex), sourceVertexCount: points.length, controlPointCount: controls.length, knotCount: knots.length, group70: 27, group71: 1, group72: knots.length, group73: controls.length, group74: 0, knots, originalPolylineFlag: Number(one(record, 70)), sourceClosed: true, periodicClosedBitAndPeriodicBitSet: true, firstLastControlPointsDistinct: true, curveSamples: samples.length, maximumSourceResidualCm: maxResidual, atPeriodStart: [atPeriodStart.x, atPeriodStart.y], atPeriodEnd: [atPeriodEnd.x, atPeriodEnd.y], allSourceSegmentsRepresentedOnce: true });
  return periodic;
});
assert.equal(targets.length, 5);
for (let index = 0; index < changedRecords.length; index += 1) {
  const sourceIndex = sourcePolylines.indexOf(originalRecords[index]);
  if (!targetNames.has(sourceIndex)) assert.deepEqual(changedRecords[index], originalRecords[index], `unexpected source record change at index ${index}`);
}
const expectedHeader = [[0, "SECTION"], [2, "HEADER"], [9, "$ACADVER"], [1, "AC1015"], [0, "ENDSEC"]];
const sectionPairs = sourceSections.flatMap((section) => {
  const records = section === sourceEntities ? changedRecords : section.records;
  return [...section.pairs.slice(0, 2), ...records.flat(), section.pairs.at(-1)];
});
const outputBytes = Buffer.from(`${[...expectedHeader, ...sectionPairs, [0, "EOF"]].map(([code, value]) => `${code}\r\n${value}`).join("\r\n")}\r\n`, "utf8");
const outputSections = sectionsOf(parsePairs(outputBytes));
const outputEntities = outputSections.find(({ name }) => name === "ENTITIES");
assert.equal(outputEntities.records.filter((record) => record[0]?.[1] === "SPLINE").length, 5);
assert.equal(outputEntities.records.filter((record) => record[0]?.[1] === "POLYLINE").length, 13);
const outputHash = sha(outputBytes);
await mkdir("C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Input", { recursive: true });
await mkdir("C:/G04-CLO-DXF-Exchange/S595-polo-periodic-spline-roundtrip/Evidence/Analysis", { recursive: true });
await writeFile(outputPath, outputBytes);
const report = {
  method: "Periodic degree-1 basis with cyclic control extension: on knot span [k,k+1], interpolate controls P[(k-1) mod n] to P[k]; compare to corresponding original closed source edge. Seven parameters per span include both endpoints.",
  source: { path: sourcePath, bytes: sourceBytes.length, sha256: sourceHash, entityFormat: "R12 POLYLINE/VERTEX", targetSourcePolylineCount: 18 },
  output: { path: outputPath, bytes: outputBytes.length, sha256: outputHash, acadver: "AC1015", splineCount: 5, retainedPolylineCount: 13, onlyFiveTargetCutContoursReencoded: true },
  threshold: { exactSourceNumericalResidualCm: 1e-12, receiverRoundTripGateCm: 0.001 },
  standards: {
    dxfSPLINE: "https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm",
    acDbSplinePeriodicData: "https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/OARX-RefGuide-AcDbSpline__setNurbsData_int_Adesk__Boolean_Adesk__Boolean_Adesk__Boolean_AcGePoint3dArray__AcGeDoubleArray__AcGeDoubleArray__double_double.html",
    makePeriodicUnclampedFormat: "https://help.autodesk.com/cloudhelp/2026/ENU/AutoCAD-ManagedRefGuide/files/GUID-Autodesk_AutoCAD_Geometry_NurbCurve3d_MakePeriodic.html"
  },
  claims: {
    directlyEncoded: "Five source-closed planar CUT POLYLINEs are replaced with degree-one SPLINEs using group 70=27 (closed, periodic, planar, linear), n unique ordered controls, n+1 distinct integer knots 0..n, no fit points and no rational weights.",
    documented: "Autodesk identifies group 70 closed/periodic/planar/linear bits separately. Its API says periodic is a closed curve, supports knot count equal to control count plus one with distinct knots and non-repeated first/last controls, and uses unclamped knot form for periodic splines.",
    independentlyCalculated: "For the periodic degree-one basis, cyclic control extension makes each knot span a straight segment between adjacent source vertices, with the first span joining the source's last and first vertices. Every edge appears once; all sample residuals are zero and the curve closes over period n.",
    limits: "This exact source-curve proof does not prove CLO's SPLINE import/export behavior or industrial apparel conformance. CLO test is authorized only because every source preflight gate passes."
  },
  targets,
  totalCurveSamples: targets.reduce((sum, { curveSamples }) => sum + curveSamples, 0),
  maximumSourceResidualCm: Math.max(...targets.map(({ maximumSourceResidualCm }) => maximumSourceResidualCm)),
  allFivePeriodicCurvesProvenSourceExact: true,
  allFivePeriodicSplinesPassStructureChecks: true
};
const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(reportPath, reportBytes);
console.log(JSON.stringify({ sourceHash, outputPath, outputHash, targetSummary: targets.map(({ piece, sourceVertexCount, knotCount, curveSamples, maximumSourceResidualCm }) => ({ piece, sourceVertexCount, knotCount, curveSamples, maximumSourceResidualCm })), totalCurveSamples: report.totalCurveSamples, maxResidual: report.maximumSourceResidualCm, reportPath, reportHash: sha(reportBytes) }, null, 2));
