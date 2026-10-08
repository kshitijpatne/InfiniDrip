import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S519-clo-point-retention-control";
const input = `${root}/Input/polo-standard-m.dxf`;
const output = `${root}/Output/polo-draw-curve-points-on-aama.dxf`;
const previous = "C:/G04-CLO-DXF-Exchange/S516-clo-aama-roundtrip/Evidence/Analysis/polo-contour-diagnosis.json";
const destination = `${root}/Evidence/Analysis/s519-draw-curve-points-on-contour-diagnosis.json`;
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const decodePairs = (bytes, label) => {
  const lines = bytes.toString("utf8").trimEnd().split(/\r?\n/);
  assert.equal(lines.length % 2, 0, `${label}: incomplete group pair`);
  return Array.from({ length: lines.length / 2 }, (_, i) => {
    const code = Number(lines[i * 2].trim());
    assert.ok(Number.isInteger(code), `${label}: invalid group code at ${i * 2 + 1}`);
    return [code, lines[i * 2 + 1]];
  });
};
const sectionEntities = (pairs, expectedName) => {
  const start = pairs.findIndex((pair, i) => pair[0] === 0 && pair[1] === "SECTION" && pairs[i + 1]?.[1] === expectedName);
  assert.notEqual(start, -1, `missing ${expectedName} section`);
  let end = start + 2;
  while (end < pairs.length && !(pairs[end][0] === 0 && pairs[end][1] === "ENDSEC")) end++;
  return pairs.slice(start + 2, end);
};
const parsePolylines = (entities) => {
  const polylines = [];
  let block = null;
  for (let i = 0; i < entities.length;) {
    if (entities[i][0] !== 0) { i++; continue; }
    const kind = entities[i][1];
    if (kind === "BLOCK") {
      const header = [];
      i++;
      while (i < entities.length && entities[i][0] !== 0) header.push(entities[i++]);
      block = header.find(([code]) => code === 2)?.[1] ?? null;
      continue;
    }
    if (kind === "ENDBLK") { block = null; i++; continue; }
    if (kind !== "POLYLINE") {
      i++;
      while (i < entities.length && entities[i][0] !== 0) i++;
      continue;
    }
    const header = [];
    i++;
    while (i < entities.length && entities[i][0] !== 0) header.push(entities[i++]);
    const vertices = [];
    while (i < entities.length && entities[i][0] === 0 && entities[i][1] === "VERTEX") {
      const vertex = [];
      i++;
      while (i < entities.length && entities[i][0] !== 0) vertex.push(entities[i++]);
      const x = Number(vertex.find(([code]) => code === 10)?.[1]);
      const y = Number(vertex.find(([code]) => code === 20)?.[1]);
      vertices.push({ x, y });
    }
    if (entities[i]?.[0] === 0 && entities[i][1] === "SEQEND") {
      i++;
      while (i < entities.length && entities[i][0] !== 0) i++;
    }
    const get = (code) => header.find(([group]) => group === code)?.[1];
    polylines.push({ block, layer: get(8) ?? "(none)", closed: (Number(get(70) ?? 0) & 1) === 1, vertices });
  }
  return polylines;
};
const pointSegment = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
  if (length2 < 1e-18) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};
const nearestOnPolyline = (point, line) => {
  let best = { distance: Infinity, segmentIndex: -1 };
  const count = line.closed ? line.vertices.length : line.vertices.length - 1;
  for (let i = 0; i < count; i++) {
    const distance = pointSegment(point, line.vertices[i], line.vertices[(i + 1) % line.vertices.length]);
    if (distance < best.distance) best = { distance, segmentIndex: i };
  }
  return best;
};
const maximumCoordinateDecimals = (pairs) => Math.max(...pairs.filter(([code]) => code === 10 || code === 20)
  .map(([, value]) => value.trim()).filter((value) => /^-?\d+(?:\.\d+)?$/.test(value))
  .map((value) => value.includes(".") ? value.length - value.indexOf(".") - 1 : 0));
const sourceBytes = await readFile(input), outputBytes = await readFile(output);
const report = JSON.parse(await readFile(previous, "utf8"));
assert.equal(sha(sourceBytes), report.input.sha256, "pinned source identity");
const sourcePairs = decodePairs(sourceBytes, "S516 source");
const outputPairs = decodePairs(outputBytes, "S516 output");
const source = parsePolylines(sectionEntities(sourcePairs, "ENTITIES"));
const outputBlocks = parsePolylines(sectionEntities(outputPairs, "BLOCKS"));
const details = report.unresolvedContours.map((item) => {
  const src = source[item.sourceOrdinal];
  const receiver = report.output.polylineGeometries.find((line) => line.outputPolylineOrdinal === item.nearestGeometryInBlock.outputPolylineOrdinal);
  const target = outputBlocks.find((line) => line.block === item.associatedBlock && line.layer === receiver.layer && line.vertices.length === receiver.vertices.length &&
    Math.abs(line.vertices[0].x - receiver.vertices[0][0]) < 1e-5 && Math.abs(line.vertices[0].y - receiver.vertices[0][1]) < 1e-5);
  assert.ok(src && target, `mapped path exists for ${item.sourcePiece}`);
  const vertexDistances = src.vertices.map((point, index) => ({ sourceVertexIndex: index, point, ...nearestOnPolyline(point, target) }));
  let maxSample = { distance: -1 };
  const segmentCount = src.closed ? src.vertices.length : src.vertices.length - 1;
  for (let i = 0; i < segmentCount; i++) {
    const a = src.vertices[i], b = src.vertices[(i + 1) % src.vertices.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(length / 0.005));
    for (let step = 0; step <= steps; step++) {
      const t = step / steps, point = { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
      const nearest = nearestOnPolyline(point, target);
      if (nearest.distance > maxSample.distance) maxSample = { sourceSegmentIndex: i, segmentT: t, point, ...nearest };
    }
  }
  const farthestVertex = vertexDistances.reduce((a, b) => b.distance > a.distance ? b : a);
  const missingIndex = farthestVertex.sourceVertexIndex;
  const sourceNeighbor = (index) => src.vertices[(index + src.vertices.length) % src.vertices.length];
  const receiverSegmentStart = target.vertices[farthestVertex.segmentIndex];
  const receiverSegmentEnd = target.vertices[(farthestVertex.segmentIndex + 1) % target.vertices.length];
  return {
    sourcePiece: item.sourcePiece,
    sourceOrdinal: item.sourceOrdinal,
    receiverBlock: item.associatedBlock,
    receiverLayer: target.layer,
    sourceCut: { closed: src.closed, vertexCount: src.vertices.length },
    receiverCandidate: { closed: target.closed, vertexCount: target.vertices.length },
    farthestSourceVertex: farthestVertex,
    sourceLocalTriplet: { predecessor: sourceNeighbor(missingIndex - 1), omittedCandidate: sourceNeighbor(missingIndex), successor: sourceNeighbor(missingIndex + 1) },
    receiverShortcutSegment: { start: receiverSegmentStart, end: receiverSegmentEnd },
    topFiveSourceVertexDistances: [...vertexDistances].sort((a, b) => b.distance - a.distance).slice(0, 5),
    maximumSampledSourceToReceiverDistance: { ...maxSample, sampleSpacingAtMostCm: 0.005, strictGateCm: 0.001 },
    sourceCoordinates: src.vertices,
    receiverCoordinates: target.vertices,
  };
});
const result = {
  method: "S519 parses the hash-pinned source ENTITIES and CLO receiver BLOCKS, binds the same five exact roles using S516's existing piece association, compares source CUT vertices with the identified receiver contour, and samples source segments at <=0.005 cm against exact receiver segments.",
  input: { path: input, bytes: sourceBytes.length, sha256: sha(sourceBytes), maximumObservedCoordinateDecimals: maximumCoordinateDecimals(sourcePairs) },
  output: { path: output, bytes: outputBytes.length, sha256: sha(outputBytes), maximumObservedCoordinateDecimals: maximumCoordinateDecimals(outputPairs) },
  unitAndTransformEvidence: { sourceHasInsunits: /\$INSUNITS/i.test(sourceBytes.toString("utf8")), receiverInserts: report.output.inserts, sourceCoordinateContract: "centimeters per S463 generator contract; no $INSUNITS", importScalePercent: 100, receiverInsertScale: "all nine insert scales are 1; rotations 0" },
  affectedContours: details.map(({ sourceCoordinates, receiverCoordinates, ...summary }) => summary),
  stageAttribution: "This one-cell trial enabled CLO's documented Import Draw Curve Points control while holding the other observed import/export settings and fixture constant. These combined-path output bytes can determine whether that control changes the five CUT contours, but cannot independently attribute any remaining change to CLO's import or export stage.",
};
await writeFile(destination, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ destination, input: result.input, output: result.output, contours: result.affectedContours.map(({ sourcePiece, receiverBlock, receiverLayer, sourceCut, receiverCandidate, farthestSourceVertex, maximumSampledSourceToReceiverDistance }) => ({ sourcePiece, receiverBlock, receiverLayer, sourceCut, receiverCandidate, farthestSourceVertex, maximumSampledSourceToReceiverDistance })), stageAttribution: result.stageAttribution }, null, 2));
