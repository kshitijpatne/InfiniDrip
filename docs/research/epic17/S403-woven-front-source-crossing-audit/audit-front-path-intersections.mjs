import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = import.meta.dirname;
const sourceDir = join(folder, '..', 'S401-woven-paired-live-output-review', 'rendered');
const matrix = JSON.parse(await readFile(join(folder, '..', 'S401-woven-paired-live-output-review',
  'woven-paired-live-output-matrix.json'), 'utf8'));

function pathSegments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const segments = [];
  let i = 0, current = null, subpathStart = null, subpathIndex = -1;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === 'M') {
      current = { x: +tokens[i++], y: +tokens[i++] };
      subpathStart = current; subpathIndex += 1;
    } else if (op === 'L') {
      const end = { x: +tokens[i++], y: +tokens[i++] };
      segments.push({ start: current, end, subpathIndex }); current = end;
    } else if (op === 'C') {
      const c1 = { x: +tokens[i++], y: +tokens[i++] };
      const c2 = { x: +tokens[i++], y: +tokens[i++] };
      const end = { x: +tokens[i++], y: +tokens[i++] };
      let previous = current;
      for (let step = 1; step <= 80; step += 1) {
        const t = step / 80, u = 1 - t;
        const point = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
          y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y };
        segments.push({ start: previous, end: point, subpathIndex }); previous = point;
      }
      current = end;
    } else if (op === 'Z') {
      if (current && subpathStart) segments.push({ start: current, end: subpathStart, subpathIndex });
      current = subpathStart;
    } else throw new Error(`Unsupported SVG path command ${op}`);
  }
  return segments;
}

function bounds(segments) {
  const points = segments.flatMap(({ start, end }) => [start, end]);
  return { minX: Math.min(...points.map((p) => p.x)), minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)), maxY: Math.max(...points.map((p) => p.y)) };
}

function overlap(a, b, pad = 0) {
  return a.minX - pad <= b.maxX && a.maxX + pad >= b.minX
    && a.minY - pad <= b.maxY && a.maxY + pad >= b.minY;
}

function intersection(a, b) {
  const rx = a.end.x - a.start.x, ry = a.end.y - a.start.y;
  const sx = b.end.x - b.start.x, sy = b.end.y - b.start.y;
  const denominator = rx * sy - ry * sx;
  if (Math.abs(denominator) < 1e-10) return null;
  const qx = b.start.x - a.start.x, qy = b.start.y - a.start.y;
  const t = (qx * sy - qy * sx) / denominator, u = (qx * ry - qy * rx) / denominator;
  if (t <= 1e-7 || t >= 1 - 1e-7 || u <= 1e-7 || u >= 1 - 1e-7) return null;
  return { x: a.start.x + t * rx, y: a.start.y + t * ry };
}

function collinearOverlap(a, b) {
  const rx = a.end.x - a.start.x, ry = a.end.y - a.start.y;
  const sx = b.end.x - b.start.x, sy = b.end.y - b.start.y;
  const rLength = Math.hypot(rx, ry), sLength = Math.hypot(sx, sy);
  if (rLength < 1e-9 || sLength < 1e-9) return null;
  if (Math.abs(rx * sy - ry * sx) > 1e-7 * rLength * sLength) return null;
  const qx = b.start.x - a.start.x, qy = b.start.y - a.start.y;
  if (Math.abs(qx * ry - qy * rx) / rLength > 1e-5) return null;
  const ux = rx / rLength, uy = ry / rLength;
  const b0 = qx * ux + qy * uy;
  const b1 = (b.end.x - a.start.x) * ux + (b.end.y - a.start.y) * uy;
  const start = Math.max(0, Math.min(b0, b1)), end = Math.min(rLength, Math.max(b0, b1));
  if (end - start <= 0.01) return null;
  return { lengthCm: end - start, start: { x: a.start.x + ux * start, y: a.start.y + uy * start },
    end: { x: a.start.x + ux * end, y: a.start.y + uy * end } };
}

function dedupe(points, tolerance = 0.015) {
  const result = [];
  for (const p of points) if (!result.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < tolerance)) result.push(p);
  return result;
}

function properIntersections(a, b) {
  if (!overlap(a.bounds, b.bounds, 0.03)) return [];
  const points = [];
  for (const first of a.segments) for (const second of b.segments) {
    if (!overlap(bounds([first]), bounds([second]), 1e-8)) continue;
    const p = intersection(first, second);
    if (p) points.push(p);
  }
  return dedupe(points);
}

function selfIntersections(path) {
  const points = [];
  for (let i = 0; i < path.segments.length; i += 1) for (let j = i + 1; j < path.segments.length; j += 1) {
    const a = path.segments[i], b = path.segments[j];
    if (a.subpathIndex === b.subpathIndex && j - i <= 1) continue;
    if (a.subpathIndex === b.subpathIndex && i === 0 && j === path.segments.length - 1
      && Math.hypot(a.start.x - b.end.x, a.start.y - b.end.y) < 1e-8) continue;
    if (!overlap(bounds([a]), bounds([b]), 1e-8)) continue;
    const p = intersection(a, b);
    if (p) points.push(p);
  }
  return dedupe(points);
}

const records = [];
for (const item of matrix.rows) {
  const caseId = item.caseId;
  const svg = await readFile(join(sourceDir, `${caseId}-front_flat-current.svg`), 'utf8');
  const doc = new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document;
  const revisionId = doc.documentElement.getAttribute('data-revision-id');
  assert.equal(revisionId, 'live-draft:woven-shirt:14:14', `${caseId}: source revision mismatch`);
  const paths = [...doc.querySelectorAll('path[data-entity-id]')].flatMap((element) => {
    const entityId = element.getAttribute('data-entity-id') ?? '';
    if (!/:component:[^:]+:outline(?:[:]|$)/u.test(entityId) && !/:view-seam:/u.test(entityId)) return [];
    const d = element.getAttribute('d') ?? '';
    const segments = pathSegments(d);
    if (!segments.length) return [];
    const layer = element.closest('[data-layer-group]')?.getAttribute('data-layer-group') ?? null;
    const sourceId = element.getAttribute('data-source-id');
    const pathRevisionId = element.getAttribute('data-revision-id');
    assert.equal(pathRevisionId, revisionId, `${caseId}: ${entityId} revision mismatch`);
    return [{ entityId, sourceId, pathRevisionId, layer, d, segments, bounds: bounds(segments), selfCrossings: selfIntersections({ segments }) }];
  });
  const pairs = [], overlaps = [];
  for (let i = 0; i < paths.length; i += 1) for (let j = i + 1; j < paths.length; j += 1) {
    if (paths[i].entityId === paths[j].entityId || !overlap(paths[i].bounds, paths[j].bounds, 0.03)) continue;
    const points = properIntersections(paths[i], paths[j]);
    if (points.length) pairs.push({ firstEntityId: paths[i].entityId, firstSourceId: paths[i].sourceId,
      firstLayer: paths[i].layer, secondEntityId: paths[j].entityId, secondSourceId: paths[j].sourceId,
      secondLayer: paths[j].layer, intersectionCount: points.length, points });
    const shared = [];
    for (const first of paths[i].segments) for (const second of paths[j].segments) {
      const part = collinearOverlap(first, second);
      if (part) shared.push(part);
    }
    const sharedLength = shared.reduce((sum, part) => sum + part.lengthCm, 0);
    if (sharedLength > 0.05) overlaps.push({ firstEntityId: paths[i].entityId, firstSourceId: paths[i].sourceId,
      secondEntityId: paths[j].entityId, secondSourceId: paths[j].sourceId, totalCollinearOverlapCm: sharedLength,
      segments: shared });
  }
  records.push({ caseId, options: item.options, revisionId, pathCount: paths.length,
    selfIntersections: paths.filter((p) => p.selfCrossings.length).map((p) => ({ entityId: p.entityId, sourceId: p.sourceId, points: p.selfCrossings })),
    pathPairCrossings: pairs, pathPairCollinearOverlaps: overlaps,
    paths: paths.map(({ entityId, sourceId, pathRevisionId, layer, d }) => ({ entityId, sourceId, revisionId: pathRevisionId, layer, d })) });
}

const allPairs = records.flatMap((r) => r.pathPairCrossings.map((p) => ({ caseId: r.caseId, ...p })));
const allOverlaps = records.flatMap((r) => r.pathPairCollinearOverlaps.map((p) => ({ caseId: r.caseId, ...p })));
const grouped = new Map();
for (const pair of allPairs) {
  const key = [pair.firstEntityId, pair.secondEntityId].sort().join(' <> ');
  if (!grouped.has(key)) grouped.set(key, new Set());
  grouped.get(key).add(pair.caseId);
}
const summary = { configurations: records.length, exactRevisionConfigurations: records.filter((r) => r.revisionId === 'live-draft:woven-shirt:14:14').length,
  facePathsPerConfig: [...new Set(records.map((r) => r.pathCount))],
  configurationsWithSelfCrossingPath: records.filter((r) => r.selfIntersections.length).length,
  configurationsWithAnyProperPathCrossing: records.filter((r) => r.pathPairCrossings.length).length,
  totalPathPairRecords: allPairs.length,
  configurationsWithCollinearOutlineOverlap: records.filter((r) => r.pathPairCollinearOverlaps.length).length,
  repeatedCollinearOverlaps: [...new Map(allOverlaps.map((p) => [p.firstEntityId + ' <> ' + p.secondEntityId, p])).values()]
    .map((p) => ({ pair: `${p.firstEntityId} <> ${p.secondEntityId}`,
      configurations: allOverlaps.filter((q) => q.firstEntityId === p.firstEntityId && q.secondEntityId === p.secondEntityId).length,
      overlapLengthsCm: allOverlaps.filter((q) => q.firstEntityId === p.firstEntityId && q.secondEntityId === p.secondEntityId).map((q) => q.totalCollinearOverlapCm) })),
  repeatedPathPairs: [...grouped.entries()].map(([pair, cases]) => ({ pair, configurations: cases.size })).sort((a, b) => b.configurations - a.configurations) };
const output = { method: 'current production-renderer FRONT_FLAT outline/view-seam path commands; cubic Bezier curves split into 80 chords; proper finite-segment intersections with bounding-box pruning; crossing points clustered within 0.015 cm', summary, records };
await writeFile(join(folder, 'woven-front-path-crossings.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
assert.equal(records.length, 28);
