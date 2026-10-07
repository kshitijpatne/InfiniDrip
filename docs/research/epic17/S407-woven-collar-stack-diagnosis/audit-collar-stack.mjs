import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const { JSDOM } = createRequire(import.meta.url)('jsdom');
const folder = new URL('./', import.meta.url);
const matrix = JSON.parse(await readFile(new URL('../S406-woven-approved-view-conventions/production-replay/matrix.json', import.meta.url), 'utf8'));
const roles = ['front', 'outerStand', 'underCollar', 'upperCollar', 'buttonPlacket', 'buttonholePlacket'];
const expectedRevision = 'live-draft:woven-shirt:14:14';

function segments(d) {
  const tokens = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? [];
  const out = [];
  let i = 0, current = null, start = null, subpath = -1;
  while (i < tokens.length) {
    const op = tokens[i++];
    if (op === 'M') { current = { x: +tokens[i++], y: +tokens[i++] }; start = current; subpath++; }
    else if (op === 'L') { const end = { x: +tokens[i++], y: +tokens[i++] }; out.push({ a: current, b: end, subpath }); current = end; }
    else if (op === 'C') {
      const c1 = { x: +tokens[i++], y: +tokens[i++] }, c2 = { x: +tokens[i++], y: +tokens[i++] };
      const end = { x: +tokens[i++], y: +tokens[i++] };
      let previous = current;
      for (let k = 1; k <= 120; k++) {
        const t = k / 120, u = 1 - t;
        const p = { x: u ** 3 * current.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
          y: u ** 3 * current.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y };
        out.push({ a: previous, b: p, subpath }); previous = p;
      }
      current = end;
    } else if (op === 'Z') { if (current && start) out.push({ a: current, b: start, subpath }); current = start; }
    else throw new Error(`Unsupported path command: ${op}`);
  }
  return out;
}
const bbox = (s) => ({ minX: Math.min(s.a.x, s.b.x), maxX: Math.max(s.a.x, s.b.x), minY: Math.min(s.a.y, s.b.y), maxY: Math.max(s.a.y, s.b.y) });
const boxesOverlap = (a, b) => a.minX <= b.maxX + 1e-8 && a.maxX + 1e-8 >= b.minX && a.minY <= b.maxY + 1e-8 && a.maxY + 1e-8 >= b.minY;
function cross(a, b) {
  const rx = a.b.x - a.a.x, ry = a.b.y - a.a.y, sx = b.b.x - b.a.x, sy = b.b.y - b.a.y;
  const den = rx * sy - ry * sx;
  if (Math.abs(den) < 1e-10) return null;
  const qx = b.a.x - a.a.x, qy = b.a.y - a.a.y;
  const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  if (t <= 1e-7 || t >= 1 - 1e-7 || u <= 1e-7 || u >= 1 - 1e-7) return null;
  return { x: a.a.x + t * rx, y: a.a.y + t * ry };
}
function dedupe(points) { const out = []; for (const p of points) if (!out.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < 0.015)) out.push(p); return out; }

const rows = [];
for (const record of matrix.cases) {
  const face = record.faces.find((item) => item.kind === 'FRONT_FLAT');
  assert.ok(face?.svg, `${record.caseId}: missing front SVG`);
  const doc = new JSDOM(face.svg, { contentType: 'image/svg+xml' }).window.document;
  const root = doc.documentElement;
  assert.equal(root.getAttribute('data-revision-id'), expectedRevision, `${record.caseId}: revision mismatch`);
  const paths = [...doc.querySelectorAll('path[data-source-id]')].flatMap((node) => {
    const sourceId = node.getAttribute('data-source-id') ?? '';
    const entityId = node.getAttribute('data-entity-id');
    // Exclude colorway fills and mask definitions: they carry provenance but
    // are not emitted stroked geometry and would create false path crossings.
    if (!entityId) return [];
    const role = roles.find((candidate) => sourceId === `pattern:woven-shirt:role:${candidate}`
      || sourceId.startsWith(`pattern:woven-shirt:role:${candidate}:`));
    if (!role) return [];
    assert.equal(node.getAttribute('data-revision-id'), expectedRevision, `${record.caseId}: path revision mismatch`);
    const d = node.getAttribute('d') ?? '';
    const lineSegments = segments(d);
    if (!lineSegments.length) return [];
    return [{ role, entityId, sourceId, d,
      layer: node.closest('[data-layer-group]')?.getAttribute('data-layer-group') ?? null,
      clip: node.getAttribute('data-view-clip'), lineSegments }];
  });
  const pairMap = new Map();
  for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) {
    if (paths[i].role === paths[j].role) continue;
    const points = [];
    for (const a of paths[i].lineSegments) for (const b of paths[j].lineSegments) {
      if (boxesOverlap(bbox(a), bbox(b))) { const p = cross(a, b); if (p) points.push(p); }
    }
    const unique = dedupe(points);
    if (!unique.length) continue;
    const key = [paths[i].role, paths[j].role].sort().join(' <> ');
    const rec = pairMap.get(key) ?? { pair: key, pathPairs: [], points: [] };
    rec.pathPairs.push({ firstEntityId: paths[i].entityId, secondEntityId: paths[j].entityId, count: unique.length });
    rec.points.push(...unique); pairMap.set(key, rec);
  }
  const rolesByData = Object.fromEntries(['outerStand', 'underCollar', 'upperCollar'].map((role) => [role,
    paths.filter((path) => path.role === role).map((path) => ({ entityId: path.entityId, d: path.d, layer: path.layer, clip: path.clip }))]));
  const sameD = (a, b) => rolesByData[a].filter((p) => rolesByData[b].some((q) => p.d === q.d)).length;
  rows.push({ caseId: record.caseId, revisionId: expectedRevision,
    pathCounts: Object.fromEntries(roles.map((role) => [role, paths.filter((p) => p.role === role).length])),
    collarIdenticalPathCounts: { outerStand_underCollar: sameD('outerStand', 'underCollar'),
      outerStand_upperCollar: sameD('outerStand', 'upperCollar'), underCollar_upperCollar: sameD('underCollar', 'upperCollar') },
    crossings: [...pairMap.values()].map((pair) => ({ pair: pair.pair, entityPathPairs: pair.pathPairs.length,
      pointGroups: dedupe(pair.points).length, points: dedupe(pair.points) })),
    clips: paths.filter((p) => p.clip).map((p) => ({ role: p.role, entityId: p.entityId, clip: p.clip })) });
}
assert.equal(rows.length, 28);
const pairs = new Map();
for (const row of rows) for (const crossing of row.crossings) {
  const acc = pairs.get(crossing.pair) ?? { pair: crossing.pair, configurations: 0, totalPathPairs: 0, pointCounts: [] };
  acc.configurations++; acc.totalPathPairs += crossing.entityPathPairs; acc.pointCounts.push(crossing.pointGroups); pairs.set(crossing.pair, acc);
}
const report = { method: 'Exact S406 emitted FRONT_FLAT SVG path data; cubic curves screened at 120 chords; strict interior segment intersections clustered to 0.015 cm. This is a visual-path diagnostic, not a seam-validity test.',
  sourceRevision: expectedRevision, configurations: rows.length, pairs: [...pairs.values()].sort((a, b) => b.configurations - a.configurations), rows };
await writeFile(new URL('woven-collar-stack-crossings.json', folder), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ configurations: report.configurations, pairs: report.pairs }, null, 2));
