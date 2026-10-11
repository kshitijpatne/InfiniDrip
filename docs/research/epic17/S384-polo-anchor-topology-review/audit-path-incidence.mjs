import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const root = 'docs/research/epic17/S384-polo-anchor-topology-review';
const inputs = 'docs/research/epic17/S380-polo-collar-callout-key-implementation/rendered';
const candidates = JSON.parse(await readFile('docs/research/epic17/S383-polo-keyed-callout-layout/candidate-matrix.json', 'utf8'));
assert.equal(candidates.results.length, 17);

function parse(svg) { return new JSDOM(svg, { contentType: 'image/svg+xml' }).window.document; }
function segments(d) {
  const t = d.match(/[MLCZ]|-?\d+(?:\.\d+)?/gu) ?? []; let i = 0, p = null, start = null; const out = [];
  while (i < t.length) {
    const op = t[i++];
    if (op === 'M') { p = { x: +t[i++], y: +t[i++] }; start = p; }
    else if (op === 'L') { const q = { x: +t[i++], y: +t[i++] }; if (p) out.push([p, q]); p = q; }
    else if (op === 'C') {
      const a = { x: +t[i++], y: +t[i++] }, b = { x: +t[i++], y: +t[i++] }, q = { x: +t[i++], y: +t[i++] };
      if (p) { let prev = p; for (let n = 1; n <= 200; n++) { const u = n / 200, v = 1 - u;
        const next = { x: v ** 3 * p.x + 3 * v ** 2 * u * a.x + 3 * v * u ** 2 * b.x + u ** 3 * q.x,
          y: v ** 3 * p.y + 3 * v ** 2 * u * a.y + 3 * v * u ** 2 * b.y + u ** 3 * q.y };
        out.push([prev, next]); prev = next; } }
      p = q;
    } else if (op === 'Z' && p && start) { out.push([p, start]); p = start; }
    else throw new Error(`unsupported path operator ${op}`);
  }
  return out;
}
function pointDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, den = dx * dx + dy * dy;
  const u = den ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den)) : 0;
  return Math.hypot(p.x - (a.x + dx * u), p.y - (a.y + dy * u));
}
function distanceToPath(p, path) { return Math.min(Infinity, ...path.segments.map(([a,b]) => pointDistance(p,a,b))); }

const rows = [];
for (const entry of candidates.results) {
  const file = join(inputs, `${entry.caseId}-collar-point.svg`);
  const doc = parse(await readFile(file, 'utf8'));
  assert.equal(doc.documentElement.getAttribute('data-revision-id'), entry.revisionId);
  const paths = [...doc.querySelectorAll('path[data-entity-id]')]
    .filter((path) => !path.hasAttribute('data-colorway-fill-for') && path.getAttribute('pointer-events') !== 'none')
    .map((path) => ({ id: path.getAttribute('data-entity-id'), sourceId: path.getAttribute('data-source-id') ?? '',
      feature: path.getAttribute('data-feature') ?? '', layer: path.getAttribute('data-layer') ?? '',
      revisionId: path.getAttribute('data-revision-id') ?? '', segments: segments(path.getAttribute('d') ?? '') }));
  const points = entry.markers.map((marker) => ({ key: marker.key, poms: marker.poms.split(' '), targets: marker.targets.split(' '),
    x: marker.x, y: marker.y }));
  const c = doc.querySelector('g[data-pom-key="C"] circle');
  assert.ok(c, `${entry.caseId}: approved C source marker absent`);
  points.push({ key: 'C', poms: ['pom:polo:collar-point-extension'],
    targets: [doc.querySelector('g[data-pom-key="C"]').getAttribute('data-callout-target')], x: +c.getAttribute('cx'), y: +c.getAttribute('cy') });
  const stationRows = points.map((station) => {
    const distances = paths.map((path) => ({ path, centerDistanceCm: distanceToPath(station, path) }))
      .sort((a,b) => a.centerDistanceCm - b.centerDistanceCm);
    const incident = distances.filter((item) => item.centerDistanceCm <= 1e-5);
    return { key: station.key, pomSourceIds: station.poms, currentTargetIds: station.targets,
      station: { x: station.x, y: station.y }, optionCase: entry.caseId, revisionId: entry.revisionId,
      exactIncidentPaths: incident.map(({ path, centerDistanceCm }) => ({ entityId: path.id, sourceId: path.sourceId,
        feature: path.feature, layer: path.layer, pathRevisionId: path.revisionId, centerDistanceCm })),
      pathsWithinMarkerPlusGateRadius: distances.filter((item) => item.centerDistanceCm <= 0.47).map(({ path, centerDistanceCm }) => ({
        entityId: path.id, sourceId: path.sourceId, feature: path.feature, layer: path.layer, centerDistanceCm,
        diskEdgeClearanceCm: centerDistanceCm - 0.22, isDeclaredTarget: station.targets.includes(path.id), pathRevisionId: path.revisionId,
      })),
      nearestOtherThanTarget: distances.filter((item) => !station.targets.includes(item.path.id)).slice(0,5).map(({path,centerDistanceCm}) => ({
        entityId:path.id,sourceId:path.sourceId,feature:path.feature,layer:path.layer,centerDistanceCm,diskEdgeClearanceCm:centerDistanceCm-0.22,
      })) };
  });
  rows.push({ caseId: entry.caseId, options: entry.options, revisionId: entry.revisionId,
    allPatternPathRevisionsMatch: paths.every((path) => path.revisionId === entry.revisionId), stations: stationRows });
}

const keyGroups = [...new Set(rows.flatMap((row) => row.stations.map((station) => station.key)))].sort().map((key) => {
  const entries = rows.flatMap((row) => row.stations.filter((station) => station.key === key).map((station) => ({ caseId: row.caseId, ...station })));
  const pathMap = new Map();
  for (const entry of entries) for (const path of entry.exactIncidentPaths) {
    const prior = pathMap.get(path.entityId) ?? { ...path, optionRows: 0, cases: [] };
    prior.optionRows++; prior.cases.push(entry.caseId); pathMap.set(path.entityId, prior);
  }
  return { key, optionRows: entries.length, pomSourceIds: [...new Set(entries.flatMap((entry) => entry.pomSourceIds))],
    declaredTargets: [...new Set(entries.flatMap((entry) => entry.currentTargetIds))],
    exactIncidentPathFrequency: [...pathMap.values()], examples: entries.slice(0,2).map(({caseId,station,exactIncidentPaths,nearestOtherThanTarget}) => ({caseId,station,exactIncidentPaths,nearestOtherThanTarget})) };
});
const summary = { configurations: rows.length, sameRevision: rows.every((row) => row.allPatternPathRevisionsMatch),
  keys: keyGroups, rows };
assert.equal(summary.sameRevision, true);
await mkdir(join(root, 'rendered'), { recursive: true });
await writeFile(join(root, 'station-path-incidence.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify({ configurations: summary.configurations, sameRevision: summary.sameRevision,
  keys: keyGroups.map(({key,exactIncidentPathFrequency}) => ({key,paths:exactIncidentPathFrequency.map(({entityId,optionRows})=>({entityId,optionRows}))})) }, null, 2));
