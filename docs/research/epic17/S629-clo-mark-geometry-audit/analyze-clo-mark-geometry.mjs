import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const root = "C:/G04-CLO-DXF-Exchange/S628-named-block-piece-identity-pilot";
const reportPath = "C:/G04-CLO-DXF-Exchange/S629-clo-mark-geometry-audit/Evidence/clo-mark-geometry-audit.json";
const thresholdCm = 0.001;
const hash = (b) => createHash("sha256").update(b).digest("hex").toUpperCase();
function parsePairs(text) {
  const rows = text.replace(/^\uFEFF/u, "").trimEnd().split(/\r?\n/u);
  assert.equal(rows.length % 2, 0, "DXF must contain complete code/value pairs");
  return Array.from({ length: rows.length / 2 }, (_, i) => [Number(rows[2 * i].trim()), rows[2 * i + 1].trim()]);
}
function section(pairs, name) {
  for (let i = 0; i < pairs.length - 2; i += 1) {
    if (pairs[i][0] === 0 && pairs[i][1] === "SECTION" && pairs[i + 1][0] === 2 && pairs[i + 1][1] === name) {
      const end = pairs.findIndex((p, n) => n > i + 1 && p[0] === 0 && p[1] === "ENDSEC");
      assert.notEqual(end, -1, `${name} has no ENDSEC`);
      return pairs.slice(i + 2, end);
    }
  }
  return [];
}
const val = (entity, code) => entity.find(([c]) => c === code)?.[1];
function readEntities(rows) {
  const entities = [];
  for (let i = 0; i < rows.length;) {
    if (rows[i][0] !== 0) { i += 1; continue; }
    const start = i;
    const type = rows[i++][1];
    if (type === "POLYLINE") {
      while (i < rows.length && !(rows[i][0] === 0 && rows[i][1] === "SEQEND")) i += 1;
      assert(rows[i]?.[1] === "SEQEND", "POLYLINE without SEQEND");
      i += 1;
    } else {
      while (i < rows.length && rows[i][0] !== 0) i += 1;
    }
    entities.push(rows.slice(start, i));
  }
  return entities;
}
function readBlocks(pairs) {
  const rows = section(pairs, "BLOCKS");
  const blocks = [];
  for (let i = 0; i < rows.length;) {
    assert.equal(rows[i]?.[1], "BLOCK", `unexpected BLOCKS record at ${i}`);
    const hstart = i++;
    while (i < rows.length && rows[i][0] !== 0) i += 1;
    const header = rows.slice(hstart, i);
    const start = i;
    while (i < rows.length && !(rows[i][0] === 0 && rows[i][1] === "ENDBLK")) i += 1;
    assert(rows[i]?.[1] === "ENDBLK", `block ${val(header, 2)} missing ENDBLK`);
    blocks.push({ name: val(header, 2), entities: readEntities(rows.slice(start, i)) });
    i += 1;
    while (i < rows.length && rows[i][0] !== 0) i += 1;
  }
  return blocks;
}
function coords(e) {
  const type = e[0]?.[1];
  const layer = val(e, 8) ?? "0";
  const point = (x, y) => ({ x: Number(val(e, x)), y: Number(val(e, y)) });
  if (type === "POINT") return { type, layer, p: point(10, 20) };
  if (type === "LINE") return { type, layer, a: point(10, 20), b: point(11, 21) };
  if (type === "CIRCLE") return { type, layer, center: point(10, 20), radius: Number(val(e, 40)) };
  if (type === "ARC") return { type, layer, center: point(10, 20), radius: Number(val(e, 40)), startDeg: Number(val(e, 50)), endDeg: Number(val(e, 51)) };
  if (type === "POLYLINE") {
    const flags = Number(val(e, 70) ?? 0);
    const pts = [];
    for (let i = 0; i < e.length;) {
      if (e[i][0] === 0 && e[i][1] === "VERTEX") {
        const fields = []; i += 1;
        while (i < e.length && e[i][0] !== 0) fields.push(e[i++]);
        pts.push({ x: Number(fields.find(([c]) => c === 10)?.[1]), y: Number(fields.find(([c]) => c === 20)?.[1]) });
      } else i += 1;
    }
    return { type, layer, closed: Boolean(flags & 1), points: pts };
  }
  return { type, layer };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const short = (x) => Number.isFinite(x) ? Number(x.toFixed(10)) : null;
function pointSegmentDistance(p, a, b) {
  const vx = b.x - a.x, vy = b.y - a.y, len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  return dist(p, { x: a.x + t * vx, y: a.y + t * vy });
}
function distancePointToEntity(p, e) {
  if (e.type === "POINT") return dist(p, e.p);
  if (e.type === "LINE") return pointSegmentDistance(p, e.a, e.b);
  if (e.type === "POLYLINE" && e.points.length >= 2) {
    let best = Infinity;
    for (let i = 0; i + 1 < e.points.length; i += 1) best = Math.min(best, pointSegmentDistance(p, e.points[i], e.points[i + 1]));
    if (e.closed) best = Math.min(best, pointSegmentDistance(p, e.points.at(-1), e.points[0]));
    return best;
  }
  if (e.type === "CIRCLE") return Math.abs(dist(p, e.center) - e.radius);
  if (e.type === "ARC") {
    const angle = (Math.atan2(p.y - e.center.y, p.x - e.center.x) * 180 / Math.PI + 360) % 360;
    const start = (e.startDeg % 360 + 360) % 360, end = (e.endDeg % 360 + 360) % 360;
    const inside = start <= end ? angle >= start && angle <= end : angle >= start || angle <= end;
    if (inside) return Math.abs(dist(p, e.center) - e.radius);
    const a = { x: e.center.x + e.radius * Math.cos(start * Math.PI / 180), y: e.center.y + e.radius * Math.sin(start * Math.PI / 180) };
    const b = { x: e.center.x + e.radius * Math.cos(end * Math.PI / 180), y: e.center.y + e.radius * Math.sin(end * Math.PI / 180) };
    return Math.min(dist(p, a), dist(p, b));
  }
  return Infinity;
}
function entitySummary(e) {
  const common = { type: e.type, layer: e.layer, entityIndex: e.index };
  if (e.type === "POINT") return { ...common, point: e.p };
  if (e.type === "LINE") return { ...common, a: e.a, b: e.b };
  if (e.type === "CIRCLE" || e.type === "ARC") return { ...common, center: e.center, radiusCm: e.radius, ...(e.type === "ARC" ? { startDeg: e.startDeg, endDeg: e.endDeg } : {}) };
  if (e.type === "POLYLINE") return { ...common, closed: e.closed, vertexCount: e.points.length, points: e.points };
  return common;
}
function nearestPoint(p, candidates) {
  return candidates.map((c) => ({ ...entitySummary(c), distanceCm: distancePointToEntity(p, c) })).sort((a, b) => a.distanceCm - b.distanceCm).slice(0, 5);
}
function lineMatch(source, candidate) {
  let a, b, extra = 0;
  if (candidate.type === "LINE") { a = candidate.a; b = candidate.b; }
  else if (candidate.type === "POLYLINE" && candidate.points.length >= 2) {
    a = candidate.points[0]; b = candidate.points.at(-1);
    const vx = source.b.x - source.a.x, vy = source.b.y - source.a.y, len2 = vx * vx + vy * vy;
    for (const p of candidate.points) {
      const t = len2 ? ((p.x - source.a.x) * vx + (p.y - source.a.y) * vy) / len2 : Infinity;
      const proj = { x: source.a.x + t * vx, y: source.a.y + t * vy };
      extra = Math.max(extra, dist(p, proj), t < -1e-8 ? -t * Math.sqrt(len2) : 0, t > 1 + 1e-8 ? (t - 1) * Math.sqrt(len2) : 0);
    }
  } else return null;
  const direct = Math.max(dist(source.a, a), dist(source.b, b), extra);
  const reverse = Math.max(dist(source.a, b), dist(source.b, a), extra);
  return Math.min(direct, reverse);
}
function lineLiesOnPolyline(line, polyline) {
  if (polyline.type !== "POLYLINE" || polyline.points.length < 2) return false;
  const segments = polyline.points.slice(1).map((b, i) => [polyline.points[i], b]);
  if (polyline.closed) segments.push([polyline.points.at(-1), polyline.points[0]]);
  return segments.some(([a, b]) => pointSegmentDistance(line.a, a, b) <= thresholdCm && pointSegmentDistance(line.b, a, b) <= thresholdCm);
}function circlePolylineStats(source, c) {
  if (c.type !== "POLYLINE" || !c.closed || c.points.length < 4) return null;
  const radial = c.points.map((p) => Math.abs(dist(p, source.center) - source.radius));
  const angles = c.points.map((p) => Math.atan2(p.y - source.center.y, p.x - source.center.x)).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < angles.length; i += 1) {
    const next = i + 1 < angles.length ? angles[i + 1] : angles[0] + 2 * Math.PI;
    maxGap = Math.max(maxGap, next - angles[i]);
  }
  const sagitta = source.radius * (1 - Math.cos(maxGap / 2));
  return { maxRadialErrorCm: Math.max(...radial), maxAngularGapDeg: maxGap * 180 / Math.PI, maxChordSagittaCm: sagitta };
}
const inputBytes = await readFile(`${root}/Input/woven-zero-vent-named-piece-blocks.dxf`);
const outputBytes = await readFile(`${root}/Output/woven-zero-vent-named-piece-blocks-clo-export.dxf`);
const inputBlocks = readBlocks(parsePairs(inputBytes.toString("utf8")));
const outputBlocks = readBlocks(parsePairs(outputBytes.toString("utf8")));
assert.equal(hash(inputBytes), "DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6");
assert.equal(hash(outputBytes), "F17F5F2BC6D838DF52120375C1BA171D5CA56791A14D5CDFEBEEFE1F38A1879C");
const summary = [];
for (const srcBlock of inputBlocks) {
  const outBlock = outputBlocks.find((b) => b.name === `${srcBlock.name}_M`);
  assert(outBlock, `No size-suffixed output block for ${srcBlock.name}`);
  const source = srcBlock.entities.map(coords);
  const output = outBlock.entities.map(coords);
  const marks = srcBlock.entities.map((raw, index) => ({ raw, index, geo: source[index] })).filter((m) => m.geo.layer.startsWith("MARK_"));
  const outputPolys = output.map((e, index) => ({ ...e, index })).filter((e) => e.type === "POLYLINE");
  const cutSew = source.filter((e) => e.type === "POLYLINE" && (e.layer === "CUT" || e.layer === "SEW"));
  const usedOutline = new Set();
  for (const s of cutSew) {
    let best = null;
    for (const [idx, c] of outputPolys.entries()) {
      if (c.points.length !== s.points.length) continue;
      const d = Math.max(...s.points.map((p, i) => dist(p, c.points[i])));
      if (!best || d < best.d) best = { idx: c.index, d };
    }
    if (best && best.d <= thresholdCm) usedOutline.add(best.idx);
  }
  assert.equal(cutSew.length, 2, `${srcBlock.name}: expected source CUT and SEW contours`);
  assert.equal(usedOutline.size, 2, `${srcBlock.name}: CUT/SEW outlines must match distinct output polylines`);
  const allOutput = output.map((e, index) => ({ ...e, index }));
  const geometry = allOutput.filter((e) => !(e.type === "POLYLINE" && usedOutline.has(e.index)));
  const pointCloud = geometry.flatMap((e) => {
    if (e.type === "POINT") return [{ type: e.type, layer: e.layer, entityIndex: e.index, point: e.p }];
    if (e.type === "LINE") return [{ type: e.type, layer: e.layer, entityIndex: e.index, point: e.a }, { type: e.type, layer: e.layer, entityIndex: e.index, point: e.b }];
    if (e.type === "POLYLINE") return e.points.map((point) => ({ type: e.type, layer: e.layer, entityIndex: e.index, point }));
    return [];
  });
  const records = marks.map(({ raw, index, geo }) => {
    const dxfAttributes = Object.fromEntries(raw.filter(([c]) => c !== 0).map(([c, v]) => [String(c), v]));
    const common = { sourceEntityIndex: index, sourceType: geo.type, sourceLayer: geo.layer, dxfAttributes };
    if (geo.type === "POINT") {
      const near = nearestPoint(geo.p, geometry);
      const nearestAnyEntity = nearestPoint(geo.p, allOutput);
      const exactPoints = geometry.filter((candidate) => distancePointToEntity(geo.p, candidate) <= thresholdCm);
      return { ...common, sourceGeometry: geo.p, nearestOutputGeometry: near, nearestOutputAnyEntity: nearestAnyEntity, exactWithinThresholdCandidates: exactPoints.map((candidate) => ({ ...entitySummary(candidate), distanceCm: short(distancePointToEntity(geo.p, candidate)) })), disposition: exactPoints.length === 1 ? "unique output entity passes through or contains the source point within threshold; mark semantics unproved" : exactPoints.length > 1 ? "ambiguous output-geometry coincidence" : "no output entity passes through or contains the source point within threshold" };
    }
    if (geo.type === "LINE") {
      const matches = geometry.map((c) => ({ type: c.type, layer: c.layer, entityIndex: c.index, residualCm: lineMatch(geo, c) })).filter((c) => c.residualCm !== null).sort((a, b) => a.residualCm - b.residualCm).slice(0, 10);
      const sourceBoundaryOverlap = cutSew.filter((contour) => lineLiesOnPolyline(geo, contour)).map((contour) => contour.layer);
      const matchedOutputBoundaries = allOutput.filter((candidate) => usedOutline.has(candidate.index) && lineLiesOnPolyline(geo, candidate)).map((candidate) => candidate.index);
      return { ...common, sourceGeometry: { a: geo.a, b: geo.b }, candidateOutputSegments: matches.map((m) => { const target = geometry.find((candidate) => candidate.index === m.entityIndex); return { ...m, targetGeometry: { type: target.type, vertexCount: target.points?.length ?? null, closed: target.closed ?? null }, residualCm: short(m.residualCm), withinThreshold: m.residualCm <= thresholdCm }; }), coincidentSourceContourLayers: sourceBoundaryOverlap, coincidentOutputContourEntityIndices: matchedOutputBoundaries, disposition: matches[0]?.residualCm <= thresholdCm ? "candidate segment geometry within threshold; semantic role unproved" : "no direct line/polyline segment within threshold" };
    }    if (geo.type === "CIRCLE") {
      const circles = geometry.filter((e) => e.type === "CIRCLE").map((e) => ({ type: e.type, layer: e.layer, entityIndex: e.index, centerResidualCm: dist(geo.center, e.center), radiusResidualCm: Math.abs(geo.radius - e.radius) })).sort((a, b) => a.centerResidualCm + a.radiusResidualCm - (b.centerResidualCm + b.radiusResidualCm));
      const arcs = geometry.filter((e) => e.type === "ARC").map((e) => ({ type: e.type, layer: e.layer, entityIndex: e.index, centerResidualCm: dist(geo.center, e.center), radiusResidualCm: Math.abs(geo.radius - e.radius), startDeg: e.startDeg, endDeg: e.endDeg }));
      const paths = geometry.filter((e) => e.type === "POLYLINE").map((e) => ({ type: e.type, layer: e.layer, entityIndex: e.index, closed: e.closed, vertexCount: e.points.length, stats: circlePolylineStats(geo, e) })).filter((e) => e.stats).sort((a, b) => a.stats.maxRadialErrorCm - b.stats.maxRadialErrorCm);
      const ringPoints = pointCloud.filter((p) => Math.abs(dist(geo.center, p.point) - geo.radius) <= thresholdCm);
      const angles = [...new Set(ringPoints.map((p) => Math.round(Math.atan2(p.point.y - geo.center.y, p.point.x - geo.center.x) * 1e6)))].sort((a,b)=>a-b);
      return { ...common, sourceGeometry: { center: geo.center, radiusCm: geo.radius }, exactOutputCircles: circles.map((x) => ({ ...x, centerResidualCm: short(x.centerResidualCm), radiusResidualCm: short(x.radiusResidualCm) })), outputArcs: arcs.map((x) => ({ ...x, centerResidualCm: short(x.centerResidualCm), radiusResidualCm: short(x.radiusResidualCm) })), closestClosedPolylineCandidates: paths.slice(0, 5).map((x) => ({ ...x, stats: Object.fromEntries(Object.entries(x.stats).map(([k,v])=>[k,short(v)])) })), outputPointsNearSourceCircumference: { count: ringPoints.length, uniqueAngleSamples: angles.length }, disposition: circles.some((x) => x.centerResidualCm <= thresholdCm && x.radiusResidualCm <= thresholdCm) ? "native circle geometry within threshold" : paths.some((x) => x.stats.maxRadialErrorCm <= thresholdCm && x.stats.maxChordSagittaCm <= thresholdCm) ? "closed polyline approximates circle within threshold" : ringPoints.length ? "circumference candidate points exist; complete circle representation not proven" : "no direct circle representation located" };
    }
    return { ...common, dxfAttributes, disposition: "source mark type is not handled by geometric comparator" };
  });
  const lineRecords = records.filter((m) => m.sourceType === "LINE");
  const lineCandidates = lineRecords.map((m) => ({ sourceEntityIndex: m.sourceEntityIndex, valid: m.candidateOutputSegments.filter((c) => c.withinThreshold) }));
  const lineAssigned = lineCandidates.flatMap((x) => x.valid.map((c) => ({ sourceEntityIndex: x.sourceEntityIndex, outputEntityIndex: c.entityIndex, residualCm: c.residualCm })));
  const lineOutputUse = Object.groupBy(lineAssigned, (x) => x.outputEntityIndex);
  const buttonholeRecords = records.filter((m) => m.sourceType === "POINT");
  const buttonholeUse = new Map();
  for (const m of buttonholeRecords) for (const c of m.exactWithinThresholdCandidates) {
    if (!buttonholeUse.has(c.entityIndex)) buttonholeUse.set(c.entityIndex, { candidate: c, sourceMarks: [] });
    buttonholeUse.get(c.entityIndex).sourceMarks.push(m.sourceEntityIndex);
  }
  const pointTargetGroups = [...buttonholeUse.values()].map(({ candidate, sourceMarks }) => ({
    outputEntityIndex: candidate.entityIndex, outputType: candidate.type, outputLayer: candidate.layer,
    sourceMarkEntityIndices: sourceMarks, sourceMarkCount: sourceMarks.length,
    outputPathLengthCm: candidate.type === "POLYLINE" ? candidate.points.slice(1).reduce((sum, p, i) => sum + dist(p, candidate.points[i]), 0) : null,
    isSharedTarget: sourceMarks.length > 1,
  }));
  const circleRecords = records.filter((m) => m.sourceType === "CIRCLE");
  const circleGeometricFits = circleRecords.map((m) => ({ sourceEntityIndex: m.sourceEntityIndex, outputClosedPolylinesWithinRadialTolerance: m.closestClosedPolylineCandidates.filter((c) => c.stats.maxRadialErrorCm <= thresholdCm).map((c) => ({ outputEntityIndex: c.entityIndex, layer: c.layer, radialErrorCm: c.stats.maxRadialErrorCm, chordSagittaCm: c.stats.maxChordSagittaCm, passesWholeCurveThreshold: c.stats.maxRadialErrorCm <= thresholdCm && c.stats.maxChordSagittaCm <= thresholdCm })) }));
  summary.push({ sourceBlock: srcBlock.name, outputBlock: outBlock.name, sourceMarkCount: marks.length, sourceMarkInventory: Object.fromEntries(Object.entries(Object.groupBy(marks, (m) => `${m.geo.layer}/${m.geo.type}`)).map(([k,v]) => [k,v.length])), outputEntityCountsByTypeLayer: Object.fromEntries(Object.entries(Object.groupBy(geometry, (e) => `${e.type}/${e.layer}`)).map(([k,v]) => [k,v.length])), lineMarkMatching: { sourceLineCount: lineRecords.length, passingSourceLineCount: lineCandidates.filter((x) => x.valid.length > 0).length, allPassOneToOne: lineRecords.length === lineAssigned.length && Object.values(lineOutputUse).every((items) => items.length === 1), assignments: lineAssigned, outputEntityUseCounts: Object.fromEntries(Object.entries(lineOutputUse).map(([k,v]) => [k,v.length])) }, buttonholePointMatching: { sourcePointCount: buttonholeRecords.length, coincidentSourcePointCount: buttonholeRecords.filter((m) => m.exactWithinThresholdCandidates.length > 0).length, uniqueOutputEntityCount: pointTargetGroups.length, sharedTargetGroups: pointTargetGroups.filter((x) => x.isSharedTarget), targetGroups: pointTargetGroups }, buttonCircleApproximation: { sourceCircleCount: circleRecords.length, candidateAssessments: circleGeometricFits }, marks: records });
}
const report = { slice:"S629", receiverReuse:"S628 existing CLO 2026.1.310 DXF-AAMA export; no new CLO operation", input:{path:`${root}/Input/woven-zero-vent-named-piece-blocks.dxf`,bytes:inputBytes.length,sha256:hash(inputBytes)}, output:{path:`${root}/Output/woven-zero-vent-named-piece-blocks-clo-export.dxf`,bytes:outputBytes.length,sha256:hash(outputBytes)}, method:{toleranceCm:thresholdCm,noFittedTransforms:true,sourceBinding:"source BLOCK name to exact observed <name>_M output BLOCK",numericOutputLayers:"locators only; semantics not inferred",sourceMarks:"all source entities on MARK_* layers",outlineExclusion:"exclude only output POLYLINE contours matching corresponding source CUT/SEW vertex order within threshold",limits:"coordinate coincidence or segment similarity is geometric evidence only, not proof of apparel meaning, readable display, mark identity contract, normative profile, or V03 acceptance"}, pieces:summary};
const allMarks = summary.flatMap((piece) => piece.marks.map((mark) => ({ ...mark, sourceBlock: piece.sourceBlock })));
const sourceLines = allMarks.filter((m) => m.sourceType === "LINE");
const lineResiduals = sourceLines.flatMap((m) => m.candidateOutputSegments.filter((c) => c.withinThreshold).map((c) => c.residualCm));
const sourceCircles = allMarks.filter((m) => m.sourceType === "CIRCLE");
const circleAssessments = summary.flatMap((piece) => piece.buttonCircleApproximation.candidateAssessments.flatMap((a) => a.outputClosedPolylinesWithinRadialTolerance));
const sourcePoints = allMarks.filter((m) => m.sourceType === "POINT");
const directPointEntities = sourcePoints.filter((m) => m.exactWithinThresholdCandidates.some((c) => c.type === "POINT"));
report.totals = {
  sourceMarkEntityCount: allMarks.length,
  sourceMarksByLayerAndType: Object.fromEntries(Object.entries(Object.groupBy(allMarks, (m) => `${m.sourceLayer}/${m.sourceType}`)).map(([k,v]) => [k,v.length])),
  lineMarks: { sourceCount: sourceLines.length, geometryMatchesWithinThreshold: lineResiduals.length, uniqueOneToOnePerPiece: summary.flatMap((p) => p.lineMarkMatching.lineOutputUseCounts ? Object.values(p.lineMarkMatching.lineOutputUseCounts) : []).every((n) => n === 1), maximumMatchedEndpointResidualCm: Math.max(...lineResiduals) },
  circleMarks: { sourceCount: sourceCircles.length, sourceToCandidateType: "CIRCLE to closed 12-vertex POLYLINE", maximumVertexRadialResidualCm: Math.max(...circleAssessments.map((x) => x.radialErrorCm)), maximumChordSagittaCm: Math.max(...circleAssessments.map((x) => x.chordSagittaCm)), wholeCurveThresholdPassCount: circleAssessments.filter((x) => x.passesWholeCurveThreshold).length },
  pointMarks: { sourceCount: sourcePoints.length, directOutputPointEntityCount: directPointEntities.length, sourcePointsCoincidentWithOneSharedLongOutputPath: summary.flatMap((p) => p.buttonholePointMatching.sharedTargetGroups).reduce((n,g) => n+g.sourceMarkCount,0), sourcePointsWithoutAnyNonOutlineOutputGeometryWithinThreshold: sourcePoints.filter((m) => m.exactWithinThresholdCandidates.length === 0).length },
  acceptedV03MarkSemantics: false
};await writeFile(reportPath, JSON.stringify(report,null,2)+"\n");
const totals={pieces:summary.length,marks:summary.reduce((n,p)=>n+p.sourceMarkCount,0),inventory:Object.fromEntries(Object.entries(Object.groupBy(summary.flatMap(p=>p.marks),(m)=>`${m.sourceLayer}/${m.sourceType}`)).map(([k,v])=>[k,v.length])),dispositions:Object.fromEntries(Object.entries(Object.groupBy(summary.flatMap(p=>p.marks),(m)=>m.disposition)).map(([k,v])=>[k,v.length]))};
console.log(JSON.stringify({reportPath,inputSha256:report.input.sha256,outputSha256:report.output.sha256,totals},null,2));
