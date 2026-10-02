import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from '../../../../src/drafting/index.ts';
import { pieceEdge, edgeLength } from '../../../../src/drafting/piece.ts';
import { assembleTechnicalFlatRoles } from '../../../../src/render/technical-flat-assembly.ts';
import { createG04TechnicalFlatProjectionMap } from '../../../../src/render/technical-flat-projection.ts';
import { transformFlatPoint } from '../../../../src/render/technical-flat-transform.ts';

const dir = new URL('./', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('../S363-woven-pom-leader-readability/production-replay/matrix.json', import.meta.url), 'utf8'));
const trace = JSON.parse(await readFile(new URL('../S365-woven-back-sleeve-band-diagnosis/production-instance-trace/production-sleeve-band-instance-trace.json', import.meta.url), 'utf8'));
const recipe = GARMENTS.find((entry) => entry.name === 'woven-shirt');
if (!recipe) throw new Error('Woven recipe is missing');

const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a, b) => a.x * b.y - a.y * b.x;
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const transform = (point, rigid) => transformFlatPoint(point, { ...rigid, mirrorX: rigid.mirrorX ?? false });
function edgePoint(edge, t) {
  if (edge.kind === 'line') return lerp(edge.start, edge.end, t);
  const u = 1 - t;
  const p0 = edge.curve.start, p1 = edge.curve.control1, p2 = edge.curve.control2, p3 = edge.curve.end;
  return {
    x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
    y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
  };
}
function arclengthTable(edge, steps = 1000) {
  const points = Array.from({ length: steps + 1 }, (_, index) => edgePoint(edge, index / steps));
  const cumulative = [0];
  for (let index = 1; index < points.length; index++) cumulative.push(cumulative[index - 1] + d(points[index - 1], points[index]));
  return { points, cumulative, total: cumulative.at(-1) };
}
function pointAtFraction(edge, fraction, table = arclengthTable(edge)) {
  const target = table.total * fraction;
  let index = 1;
  while (index < table.cumulative.length - 1 && table.cumulative[index] < target) index++;
  const low = table.cumulative[index - 1], high = table.cumulative[index];
  const local = high === low ? 0 : (target - low) / (high - low);
  return lerp(table.points[index - 1], table.points[index], local);
}
function tangentAtFraction(edge, fraction, table) {
  const delta = 0.0005;
  const a = pointAtFraction(edge, Math.max(0, fraction - delta), table);
  const b = pointAtFraction(edge, Math.min(1, fraction + delta), table);
  const length = d(a, b);
  if (!(length > 0)) throw new Error('Degenerate sampled tangent');
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}
function lineSegments(points) { return points.slice(1).map((point, index) => [points[index], point]); }
function properIntersection(first, second) {
  const [a, b] = first, [c, e] = second;
  const r = { x: b.x - a.x, y: b.y - a.y }, s = { x: e.x - c.x, y: e.y - c.y };
  const denominator = cross(r, s);
  if (Math.abs(denominator) < 1e-10) return undefined;
  const ca = { x: c.x - a.x, y: c.y - a.y };
  const t = cross(ca, s) / denominator, u = cross(ca, r) / denominator;
  if (t <= 1e-6 || t >= 1 - 1e-6 || u <= 1e-6 || u >= 1 - 1e-6) return undefined;
  const point = { x: a.x + t * r.x, y: a.y + t * r.y };
  return { point, endpointDistanceCm: Math.min(d(point, a), d(point, b), d(point, c), d(point, e)) };
}
function compareSegments(a, b, sharedNodeTolerance = 0.001) {
  const hits = [];
  for (const first of a) for (const second of b) {
    const hit = properIntersection(first, second);
    if (hit) hits.push({ ...hit, nearSharedNode: hit.endpointDistanceCm <= sharedNodeTolerance });
  }
  return { visible: hits.filter((hit) => !hit.nearSharedNode), nearNode: hits.filter((hit) => hit.nearSharedNode) };
}
function selfCrossings(segments, adjacentPairs = new Set()) {
  const hits = [];
  for (let i = 0; i < segments.length; i++) for (let j = i + 2; j < segments.length; j++) {
    if (adjacentPairs.has(`${i}:${j}`)) continue;
    const hit = properIntersection(segments[i], segments[j]);
    if (hit) hits.push(hit);
  }
  return hits;
}
function parsePath(data) {
  const tokens = data.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const polygons = [];
  let index = 0, current, start, active = [];
  while (index < tokens.length) {
    const op = tokens[index++];
    if (op === 'M') {
      if (active.length > 2) polygons.push(active);
      current = { x: +tokens[index++], y: +tokens[index++] };
      start = current;
      active = [current];
    } else if (op === 'L') {
      current = { x: +tokens[index++], y: +tokens[index++] };
      active.push(current);
    } else if (op === 'C') {
      const p0 = current;
      const p1 = { x: +tokens[index++], y: +tokens[index++] };
      const p2 = { x: +tokens[index++], y: +tokens[index++] };
      const p3 = { x: +tokens[index++], y: +tokens[index++] };
      for (let step = 1; step <= 120; step++) {
        const t = step / 120, u = 1 - t;
        active.push({
          x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
          y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
        });
      }
      current = p3;
    } else if (op === 'Z') {
      if (current && start && d(current, start) > 1e-8) active.push(start);
      if (active.length > 2) polygons.push(active);
      current = start;
      active = [];
    }
  }
  if (active.length > 2) polygons.push(active);
  return polygons;
}
function inside(point, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if (((a.y > point.y) !== (b.y > point.y))
      && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) result = !result;
  }
  return result;
}
function edgePolyline(edge, steps = 80) {
  return Array.from({ length: steps + 1 }, (_, index) => edgePoint(edge, index / steps));
}
function stitchOutline(edges, firstEdgeName = 'top') {
  const first = edges.find((edge) => edge.name === firstEdgeName);
  if (!first) throw new Error(`Outline edge ${firstEdgeName} is absent`);
  const ordered = [{ edge: first, reversed: false }];
  const remaining = edges.filter((edge) => edge !== first);
  let end = edgePoint(first, 1);
  while (remaining.length) {
    const distances = remaining.flatMap((edge) => [
      { edge, reversed: false, gap: d(end, edgePoint(edge, 0)) },
      { edge, reversed: true, gap: d(end, edgePoint(edge, 1)) },
    ]).sort((a, b) => a.gap - b.gap);
    const next = distances[0];
    if (!next || next.gap > 1e-7) throw new Error(`Band outline is not joined at ${next?.gap}`);
    ordered.push({ edge: next.edge, reversed: next.reversed });
    remaining.splice(remaining.indexOf(next.edge), 1);
    end = edgePoint(next.edge, next.reversed ? 0 : 1);
  }
  return ordered;
}
function path(points) { return points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(5)} ${point.y.toFixed(5)}`).join(' '); }
function reflected(points) { return points.map((point) => ({ x: -point.x, y: point.y })); }
function svgFor(row, source, candidate) {
  const backgrounds = source.rolePaths.filter((entry) => ['back', 'yoke', 'sleeve'].includes(entry.roleId));
  const body = backgrounds.map((entry) => `<path d="${entry.pathData}" fill="none" stroke="${entry.roleId === 'sleeve' ? '#334155' : entry.roleId === 'yoke' ? '#8b5cf6' : '#111827'}" stroke-width="0.12"/>`).join('');
  const bandPaths = candidate.edges.map((edge) => `<path d="${path(edge.right)}" fill="none" stroke="${edge.name === 'top' ? '#111827' : '#2563eb'}" stroke-width="${edge.name === 'top' ? '0.18' : '0.15'}"/>`).join('')
    + candidate.edges.map((edge) => `<path d="${path(edge.left)}" fill="none" stroke="${edge.name === 'top' ? '#111827' : '#2563eb'}" stroke-width="${edge.name === 'top' ? '0.18' : '0.15'}"/>`).join('');
  const fold = `<path d="${path(candidate.foldRight)}" fill="none" stroke="#dc2626" stroke-width="0.13" stroke-dasharray="0.5 0.3"/><path d="${path(candidate.foldLeft)}" fill="none" stroke="#dc2626" stroke-width="0.13" stroke-dasharray="0.5 0.3"/>`;
  const labels = `<text x="-37" y="-4" font-size="1.25">Woven BACK · ${row.caseId} · S369 uncut band diagnostic</text><text x="-37" y="-1.8" font-size="0.85">Blue: complete uncut band outline · black: single mapped top seam · red dash: complete bandFold · purple: yoke</text><text x="-37" y="0" font-size="0.75">Normalized full-band top → BACK hem [0,0.5]; no cut/stitch change; all faces held</text>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;font-family:Arial,sans-serif}svg{width:1200px;height:1000px}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -6 80 82">${labels}${body}${bandPaths}${fold}</svg></body></html>`;
}

const results = [];
for (const row of matrix.cases) {
  const source = trace.records.find((record) => record.caseId === row.caseId);
  if (!source || source.revisionId !== 'live-draft:woven-shirt:14:14') throw new Error(`${row.caseId}: revision mismatch`);
  const options = { ...defaultGarmentOptions(recipe.options ?? []), ...row.options };
  const block = recipe.draft(STANDARD_M, options);
  const projection = createG04TechnicalFlatProjectionMap('woven-shirt', block, source.revisionId);
  const face = projection.faces.find((entry) => entry.kind === 'BACK_FLAT');
  const bandView = face.roles.find((entry) => entry.roleId === 'sleeveBand');
  const sleeveView = face.roles.find((entry) => entry.roleId === 'sleeve');
  const hemRun = sleeveView.runs.find((run) => run.edgeId === 'hem');
  if (hemRun?.from.endpoint !== 'start' || hemRun?.to.fraction !== 0.5) throw new Error(`${row.caseId}: exact BACK hem run is absent`);
  if (bandView.runs.length !== block.roles.sleeveBand.edges.length) throw new Error(`${row.caseId}: complete band run identity changed`);
  const assembly = assembleTechnicalFlatRoles('woven-shirt', block, 'BACK_FLAT', projection);
  const sleeveTransform = assembly.transforms.sleeve;
  const sleeve = block.roles.sleeve;
  const band = block.roles.sleeveBand;
  const hem = pieceEdge(sleeve, 'hem');
  const top = pieceEdge(band, 'top');
  const topTable = arclengthTable(top);
  const hemTable = arclengthTable(hem);
  const sourceTopLength = edgeLength(top), sourceHemLength = edgeLength(hem);
  const targetLength = sourceHemLength * 0.5;
  const scale = targetLength / sourceTopLength;
  const sourceTopSamples = Array.from({ length: 501 }, (_, index) => pointAtFraction(top, index / 500, topTable));
  const sleeveContour = stitchOutline(sleeve.edges, 'hem').flatMap(({ edge, reversed }, index) => {
    const points = edgePolyline(edge, 120);
    const directed = reversed ? points.reverse() : points;
    const placed = directed.map((point) => transform(point, sleeveTransform));
    return index === 0 ? placed : placed.slice(1);
  });
  const sleevePolygons = [sleeveContour];
  const target = (u) => transform(pointAtFraction(hem, u * 0.5, hemTable), sleeveTransform);
  const targetTangent = (u) => {
    const delta = 0.0005;
    const a = target(Math.max(0, u - delta)), b = target(Math.min(1, u + delta));
    const length = d(a, b);
    if (!(length > 0)) throw new Error(`${row.caseId}: zero receiver tangent`);
    return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  };
  const exteriorNormal = (u) => {
    const center = target(u), tangent = targetTangent(u), normal = { x: -tangent.y, y: tangent.x };
    const epsilon = 0.02;
    const positiveInside = sleevePolygons.some((polygon) => inside({ x: center.x + normal.x * epsilon, y: center.y + normal.y * epsilon }, polygon));
    const negativeInside = sleevePolygons.some((polygon) => inside({ x: center.x - normal.x * epsilon, y: center.y - normal.y * epsilon }, polygon));
    if (positiveInside === negativeInside) throw new Error(`${row.caseId}: receiver exterior side is ambiguous at hem station ${u}`);
    return positiveInside ? { x: -normal.x, y: -normal.y } : normal;
  };
  const nearestSourceStation = (point) => {
    let bestIndex = 0, bestDistance = Infinity;
    for (let index = 0; index < sourceTopSamples.length; index++) {
      const distance = d(point, sourceTopSamples[index]);
      if (distance < bestDistance) { bestIndex = index; bestDistance = distance; }
    }
    const u = bestIndex / 500;
    const origin = pointAtFraction(top, u, topTable);
    const tangent = tangentAtFraction(top, u, topTable);
    const signedDistance = cross(tangent, { x: point.x - origin.x, y: point.y - origin.y });
    return { u, signedDistance };
  };
  const mapBandPoint = (point) => {
    const { u, signedDistance } = nearestSourceStation(point);
    const center = target(u), normal = exteriorNormal(u), offset = Math.abs(signedDistance);
    return { x: center.x + normal.x * offset, y: center.y + normal.y * offset };
  };
  const orderedEdges = stitchOutline(band.edges);
  const candidateEdges = orderedEdges.map(({ edge, reversed }) => {
    const local = edgePolyline(edge, 120);
    const directed = reversed ? local.reverse() : local;
    const right = directed.map(mapBandPoint);
    return { name: edge.name, right, left: reflected(right), segmentsRight: lineSegments(right), segmentsLeft: lineSegments(reflected(right)) };
  });
  const mark = band.marks?.find((entry) => entry.name === 'bandFold' && entry.kind === 'foldLine');
  if (!mark) throw new Error(`${row.caseId}: authored bandFold is absent`);
  const foldRight = edgePolyline({ kind: 'line', start: mark.start, end: mark.end }, 120).map(mapBandPoint);
  const foldLeft = reflected(foldRight);
  const outerEdges = candidateEdges.filter((edge) => edge.name !== 'top');
  const bandOutsideRight = outerEdges.flatMap((edge) => edge.segmentsRight);
  const bandOutsideLeft = outerEdges.flatMap((edge) => edge.segmentsLeft);
  const allSegments = candidateEdges.flatMap((edge) => [...edge.segmentsRight, ...edge.segmentsLeft]);
  const self = selfCrossings(allSegments);
  const pair = compareSegments(bandOutsideRight, bandOutsideLeft);
  const sleeveSegments = source.rolePaths.filter((entry) => entry.roleId === 'sleeve').flatMap((entry) => parsePath(entry.pathData).flatMap(lineSegments));
  const bodyPaths = source.rolePaths.filter((entry) => ['back', 'yoke'].includes(entry.roleId));
  const bodyCrossings = bodyPaths.map((entry) => ({
    roleId: entry.roleId,
    count: compareSegments([...bandOutsideRight, ...bandOutsideLeft], parsePath(entry.pathData).flatMap(lineSegments)).visible.length,
  }));
  const bandSleeve = compareSegments([...bandOutsideRight, ...bandOutsideLeft], sleeveSegments);
  const mappedJoin = Array.from({ length: 101 }, (_, index) => {
    const u = index / 100;
    return d(mapBandPoint(pointAtFraction(top, u, topTable)), target(u));
  });
  const record = {
    caseId: row.caseId,
    options,
    revisionId: source.revisionId,
    source: {
      stitchLabel: source.sourceStitches.find((entry) => entry.label === 'Folded sleeve band ↔ sleeve hem'),
      bandTop: 'sleeveBand.top[0,1]',
      receiverHem: 'sleeve.hem[0,0.5]',
      sourceBandTopLengthCm: sourceTopLength,
      sourceSleeveHemLengthCm: sourceHemLength,
      receiverHalfLengthCm: targetLength,
      displayedLengthRatio: scale,
      hemProjectionRun: hemRun,
      sourceFoldMark: mark,
      instanceCount: 2,
      reflectionAxis: 'back.centerBack',
    },
    joins: {
      sourceFullJoinResidualCm: source.sleeveToBandTopJoin.endpointResidualCm,
      mappedTopResidualMaxCm: Math.max(...mappedJoin),
    },
    geometry: { edges: candidateEdges, foldRight, foldLeft },
    checks: {
      uncutBandEdgeIds: orderedEdges.map((entry) => entry.edge.name),
      bandOutlineSelfCrossings: self.length,
      mirroredOuterCrossings: pair.visible.length,
      mirroredSharedNodeContacts: pair.nearNode.length,
      outerBandToSleeveCrossings: bandSleeve.visible.length,
      outerBandToSleeveNearNodeContacts: bandSleeve.nearNode.length,
      bodyYokeCrossings: bodyCrossings,
    },
  };
  results.push(record);
}

const selected = ['woven-shirt-default', 'woven-shirt-yokeDepth-min', 'woven-shirt-yokeDepth-max', 'woven-shirt-sleeveBandDepth-max', 'woven-shirt-combined-supported'];
const errors = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const caseId of selected) {
    const row = matrix.cases.find((entry) => entry.caseId === caseId);
    const record = results.find((entry) => entry.caseId === caseId);
    const source = trace.records.find((entry) => entry.caseId === caseId);
    const page = await browser.newPage({ viewport: { width: 1200, height: 1000 }, deviceScaleFactor: 1 });
    page.on('pageerror', (error) => errors.push(`${caseId}: ${error.message}`));
    await page.setContent(svgFor(row, source, record.geometry));
    const svg = await page.locator('svg').evaluate((element) => element.outerHTML);
    await writeFile(new URL(`${caseId}-uncut-band.svg`, dir), svg);
    await page.screenshot({ path: fileURLToPath(new URL(`${caseId}-uncut-band.png`, dir)) });
    await page.close();
  }
} finally { await browser.close(); }

const summary = {
  candidate: 'complete uncut band; full source top normalized onto exact BACK hem [0,0.5]; extension maps away from source-bound sleeve interior',
  revisionId: 'live-draft:woven-shirt:14:14',
  configurationCount: results.length,
  faceRequests: 56,
  sourceFacts: { stitchLabel: 'Folded sleeve band ↔ sleeve hem', physicalRoles: 2, crop: false },
  selectedRenderedCases: selected,
  browserErrors: errors,
  counts: {
    optionsWithSelfCrossing: results.filter((entry) => entry.checks.bandOutlineSelfCrossings > 0).length,
    selfCrossingEvents: results.reduce((sum, entry) => sum + entry.checks.bandOutlineSelfCrossings, 0),
    optionsWithMirroredOuterCrossings: results.filter((entry) => entry.checks.mirroredOuterCrossings > 0).length,
    mirroredOuterCrossingEvents: results.reduce((sum, entry) => sum + entry.checks.mirroredOuterCrossings, 0),
    optionsWithBandSleeveCrossings: results.filter((entry) => entry.checks.outerBandToSleeveCrossings > 0).length,
    bandSleeveCrossingEvents: results.reduce((sum, entry) => sum + entry.checks.outerBandToSleeveCrossings, 0),
    optionsWithBodyYokeCrossings: results.filter((entry) => entry.checks.bodyYokeCrossings.some((hit) => hit.count > 0)).length,
    maxMappedTopResidualCm: Math.max(...results.map((entry) => entry.joins.mappedTopResidualMaxCm)),
    maxSourceFullJoinResidualCm: Math.max(...results.map((entry) => entry.joins.sourceFullJoinResidualCm)),
    minBandLengthRatio: Math.min(...results.map((entry) => entry.source.displayedLengthRatio)),
    maxBandLengthRatio: Math.max(...results.map((entry) => entry.source.displayedLengthRatio)),
  },
  results,
};
await writeFile(new URL('uncut-band-hem-half-matrix.json', dir), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({
  configurationCount: summary.configurationCount,
  faceRequests: summary.faceRequests,
  browserErrors: summary.browserErrors,
  counts: summary.counts,
  perOption: results.map((entry) => ({ caseId: entry.caseId, scale: entry.source.displayedLengthRatio,
    self: entry.checks.bandOutlineSelfCrossings, mirrored: entry.checks.mirroredOuterCrossings,
    bandSleeve: entry.checks.outerBandToSleeveCrossings,
    bodyYoke: entry.checks.bodyYokeCrossings.reduce((sum, hit) => sum + hit.count, 0),
    residual: entry.joins.mappedTopResidualMaxCm })),
}, null, 2));
