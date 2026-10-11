import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = new URL('../', import.meta.url);
const s370 = JSON.parse(await readFile(new URL('S370-woven-band-detail-feasibility/detached-band-layout-matrix.json', base), 'utf8'));
const s373 = JSON.parse(await readFile(new URL('S373-woven-sleeve-crossing/current-sleeve-crossing-trace.json', base), 'utf8'));
const s406Dir = new URL('S406-woven-approved-view-conventions/production-replay/', base);
assert.equal(s370.revisionId, 'live-draft:woven-shirt:14:14');
assert.equal(s373.revisionId, 'live-draft:woven-shirt:14:14');
assert.equal(s370.rows.length, 28); assert.equal(s373.records.length, 28);

const parsePoints = d => [...d.matchAll(/[ML]\s*([-+\d.eE]+)[ ,]+([-+\d.eE]+)/g)].map(m => ({ x: +m[1], y: +m[2] }))
  .filter((p, i, all) => i === 0 || Math.hypot(p.x - all[i - 1].x, p.y - all[i - 1].y) > 1e-8);
const polygonFromPath = d => {
  const tokens = d.match(/[MLCZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  const polygons = []; let polygon = [], current = null, first = null, command = '';
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i++];
    if (/^[MLCZ]$/.test(token)) {
      command = token;
      if (command === 'Z') { if (first) polygon.push(first); polygons.push(polygon); polygon = []; current = first = null; }
      continue;
    }
    const p = { x: +token, y: +tokens[i++] };
    if (command === 'M') { current = p; first = p; polygon.push(p); command = 'L'; }
    else if (command === 'L') { current = p; polygon.push(p); }
    else if (command === 'C' && current) {
      const c1 = p, c2 = { x: +tokens[i++], y: +tokens[i++] }, end = { x: +tokens[i++], y: +tokens[i++] };
      const start = current;
      for (let step = 1; step <= 24; step++) { const t = step / 24, u = 1 - t;
        polygon.push({ x: u ** 3 * start.x + 3 * u ** 2 * t * c1.x + 3 * u * t ** 2 * c2.x + t ** 3 * end.x,
          y: u ** 3 * start.y + 3 * u ** 2 * t * c1.y + 3 * u * t ** 2 * c2.y + t ** 3 * end.y }); }
      current = end;
    }
  }
  if (polygon.length) polygons.push(polygon);
  return polygons;
};
const insidePolygon = (p, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
const segmentEntersPolygon = (a, b, poly) => {
  const onBoundary = p => {
    for (let i = 1; i < poly.length; i++) {
      const c = poly[i - 1], d = poly[i];
      const dx = d.x - c.x, dy = d.y - c.y;
      const cross = (p.x - c.x) * dy - (p.y - c.y) * dx;
      if (Math.abs(cross) <= 1e-9
        && p.x >= Math.min(c.x, d.x) - 1e-9 && p.x <= Math.max(c.x, d.x) + 1e-9
        && p.y >= Math.min(c.y, d.y) - 1e-9 && p.y <= Math.max(c.y, d.y) + 1e-9) return true;
    }
    return false;
  };
  const strictlyInside = p => !onBoundary(p) && insidePolygon(p, poly);
  if (strictlyInside(a) || strictlyInside(b)) return true;
  const r = { x: b.x - a.x, y: b.y - a.y };
  const cross = (u, v) => u.x * v.y - u.y * v.x;
  const cuts = [0, 1];
  for (let i = 1; i < poly.length; i++) {
    const c = poly[i - 1], d = poly[i];
    const s = { x: d.x - c.x, y: d.y - c.y };
    const q = { x: c.x - a.x, y: c.y - a.y };
    const denominator = cross(r, s);
    if (Math.abs(denominator) > 1e-10) {
      const t = cross(q, s) / denominator;
      const u = cross(q, r) / denominator;
      if (t >= -1e-10 && t <= 1 + 1e-10 && u >= -1e-10 && u <= 1 + 1e-10) cuts.push(Math.max(0, Math.min(1, t)));
      continue;
    }
    if (Math.abs(cross(q, r)) > 1e-10) continue;
    const axis = Math.abs(r.x) >= Math.abs(r.y) ? 'x' : 'y';
    const component = r[axis];
    if (Math.abs(component) < 1e-10) continue;
    for (const point of [c, d]) {
      const t = (point[axis] - a[axis]) / component;
      if (t >= -1e-10 && t <= 1 + 1e-10) cuts.push(Math.max(0, Math.min(1, t)));
    }
  }
  cuts.sort((x, y) => x - y);
  const unique = cuts.filter((value, index) => index === 0 || Math.abs(value - cuts[index - 1]) > 1e-9);
  for (let i = 1; i < unique.length; i++) {
    const t = (unique[i - 1] + unique[i]) / 2;
    if (strictlyInside({ x: a.x + r.x * t, y: a.y + r.y * t }, poly)) return true;
  }
  return false;
};
const square = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }];
assert.equal(segmentEntersPolygon({ x: -1, y: 0.5 }, { x: 2, y: 0.5 }, square), true, 'segment crossing polygon interior is rejected');
assert.equal(segmentEntersPolygon({ x: -1, y: -1 }, { x: -1, y: 2 }, square), false, 'disjoint segment stays clear');
assert.equal(segmentEntersPolygon({ x: 0, y: 0 }, { x: 1, y: 0 }, square), false, 'boundary-only contact is not interior penetration');
assert.equal(segmentEntersPolygon({ x: 0.5, y: 0.5 }, { x: 2, y: 0.5 }, square), true, 'interior endpoint is rejected');
const crossesRect = (a, b, r) => {
  let lo = 0, hi = 1; const dx = b.x - a.x, dy = b.y - a.y;
  for (const [p, q] of [[-dx, a.x - r.minX], [dx, r.maxX - a.x], [-dy, a.y - r.minY], [dy, r.maxY - a.y]]) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
    const v = q / p; if (p < 0) lo = Math.max(lo, v); else hi = Math.min(hi, v);
    if (lo > hi) return false;
  }
  return true;
};
const properCross = (a, b, c, d) => {
  const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const e = 1e-8; const u = o(a, b, c), v = o(a, b, d), w = o(c, d, a), z = o(c, d, b);
  return ((u > e && v < -e) || (u < -e && v > e)) && ((w > e && z < -e) || (w < -e && z > e));
};
const rotate = (p, origin, angle) => {
  const x = p.x - origin.x, y = p.y - origin.y, c = Math.cos(angle), s = Math.sin(angle);
  return { x: origin.x + x * c - y * s, y: origin.y + x * s + y * c };
};
const rows = [];
for (const record of s373.records) {
  const band = s370.rows.find(r => r.caseId === record.caseId);
  assert.ok(band, `${record.caseId}: S370 detail placement exists`);
  const right = parsePoints(record.instances.find(i => i.entityId.endsWith(':component:sleeve:outline'))?.pathData ?? '');
  assert.equal(right.length, 3, `${record.caseId}: exact right sleeve chain has two source runs`);
  const svgText = await readFile(new URL(`${record.caseId}-back_flat.svg`, s406Dir), 'utf8');
  const viewBox = svgText.match(/viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"/);
  assert.ok(viewBox, `${record.caseId}: exact S406 viewBox exists`);
  const [, minX, minY, width, height] = viewBox.map(Number);
  const backFill = svgText.match(/<path data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:back:outline"[^>]* d="([^"]+)"/)?.[1];
  const yokeFill = svgText.match(/<path data-colorway-fill-for="flat:woven-shirt:BACK_FLAT:component:yoke:outline"[^>]* d="([^"]+)"/)?.[1];
  assert.ok(backFill && yokeFill, `${record.caseId}: exact back/yoke source fills exist`);
  rows.push({ caseId: record.caseId, options: record.options, U: right[0], C: right[1], M: right[2],
    bandRight: band.detailPlacementCm.rightBandBox, bodyPolygons: [...polygonFromPath(backFill), ...polygonFromPath(yokeFill)],
    frame: { minX, maxX: minX + width, minY, maxY: minY + height } });
}

const stepDegrees = 0.1, steps = Math.round(360 / stepDegrees), clearanceCm = 0.05;
const pass = [], passBeforeBody = [];
const constraintCounts = { frame: 0, band: 0, pair: 0, torsoExterior: 0, frameBand: 0, frameBandPair: 0, frameBandTorso: 0, allFour: 0 };
const perOption = rows.map(row => ({ caseId: row.caseId, frame: 0, band: 0, reflectedPair: 0, torso: 0, combined: 0 }));
for (let i = 0; i < steps; i++) {
  const deg = i * stepDegrees, rad = deg * Math.PI / 180;
  let allFrame = true, allBand = true, allPair = true, allTorso = true;
  for (const [index, row] of rows.entries()) {
    const U = row.U, C = rotate(row.C, U, rad), M = rotate(row.M, U, rad);
    const reflect = p => ({ x: -p.x, y: p.y });
    const rightRuns = [[U, C], [C, M]], leftRuns = rightRuns.map(([a, b]) => [reflect(a), reflect(b)]);
    const points = [...rightRuns.flat(), ...leftRuns.flat()];
    const frameOK = points.every(p => p.x >= row.frame.minX && p.x <= row.frame.maxX && p.y >= row.frame.minY && p.y <= row.frame.maxY);
    const pad = clearanceCm;
    const rightBox = { minX: row.bandRight.minX - pad, maxX: row.bandRight.maxX + pad,
      minY: row.bandRight.minY - pad, maxY: row.bandRight.maxY + pad };
    const leftBox = { minX: -row.bandRight.maxX - pad, maxX: -row.bandRight.minX + pad,
      minY: row.bandRight.minY - pad, maxY: row.bandRight.maxY + pad };
    const bandOK = rightRuns.every(([a, b]) => !crossesRect(a, b, rightBox))
      && leftRuns.every(([a, b]) => !crossesRect(a, b, leftBox));
    const pairOK = rightRuns.every(([a, b]) => leftRuns.every(([c, d]) => !properCross(a, b, c, d)));
    const torsoOK = [...rightRuns, ...leftRuns].every(([a, b]) =>
      row.bodyPolygons.every(poly => !segmentEntersPolygon(a, b, poly)));
    if (frameOK) perOption[index].frame++;
    if (bandOK) perOption[index].band++;
    if (pairOK) perOption[index].reflectedPair++;
    if (torsoOK) perOption[index].torso++;
    if (frameOK && bandOK && pairOK && torsoOK) perOption[index].combined++;
    allFrame &&= frameOK; allBand &&= bandOK; allPair &&= pairOK; allTorso &&= torsoOK;
  }
  if (allFrame) constraintCounts.frame++;
  if (allBand) constraintCounts.band++;
  if (allPair) constraintCounts.pair++;
  if (allTorso) constraintCounts.torsoExterior++;
  if (allFrame && allBand) constraintCounts.frameBand++;
  if (allFrame && allBand && allPair) { constraintCounts.frameBandPair++; passBeforeBody.push(Number(deg.toFixed(1))); }
  if (allFrame && allBand && allTorso) constraintCounts.frameBandTorso++;
  if (allFrame && allBand && allPair && allTorso) { constraintCounts.allFour++; pass.push(Number(deg.toFixed(1))); }
}

const compressAngles = values => {
  const ranges = [];
  for (const value of values) {
    const previous = ranges.at(-1);
    if (previous && Math.abs(previous[1] + stepDegrees - value) < 1e-8) previous[1] = value;
    else ranges.push([value, value]);
  }
  return ranges;
};

const result = {
  candidate: 'Rotate the entire source sideRight + hem[0,0.5] chain rigidly about the exact underarm endpoint; reflect the second instance across back.centerBack. Keep approved cap-to-armhole depiction and the S370 detached-band details fixed. This is a diagnostic view proposal, not source-encoded assembly order.',
  sourceRevision: 'live-draft:woven-shirt:14:14', configurationCount: rows.length, faces: rows.length,
  search: { stepDegrees, testedAngles: steps, obstacleClearanceCm: clearanceCm,
    constraints: ['both reflected chains inside each exact production viewBox', 'both chains avoid the full S370 band-detail bounding boxes plus 0.05 cm clearance', 'no proper crossings between reflected sleeve line segments', 'neither line chain enters the exact back or yoke colorway-fill polygon (exact segment/polygon interval test on the SVG cubic tessellation)'] },
  constraintCounts,
  sourceVectorChecks: rows.map(row => ({ caseId: row.caseId, sideCm: Math.hypot(row.C.x-row.U.x,row.C.y-row.U.y),
    hemHalfCm: Math.hypot(row.M.x-row.C.x,row.M.y-row.C.y), U: row.U })),
  angleRangesPassingFrameBandAndPair: compressAngles(passBeforeBody), angleCountPassingFrameBandAndPair: passBeforeBody.length,
  aggregateAnglesPassingAllRows: compressAngles(pass), angleCountPassingAllRows: pass.length,
  perOptionSampledAnglesPassing: perOption,
  limits: 'This screen samples 0.1-degree rigid rotations. The no-body-overlap test uses exact segment intervals against same-revision back/yoke polygons whose cubic curves are tessellated at 24 steps. No accepted candidate exists, so no candidate SVG or rendered trial was generated. It does not establish cap/side tangent continuity, closure shape, body/collar layer order, POM/artwork clearance or truthful product semantics.',
};
assert.ok(result.sourceVectorChecks.every(row => Math.abs(row.sideCm - 22.2036033112) < 0.0002 && Math.abs(row.hemHalfCm - 18.5) < 0.0002));
await writeFile(new URL('./S440-rigid-orientation-scan.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ revisionId: result.sourceRevision, configurationCount: result.configurationCount,
  testedAngles: result.search.testedAngles, angleCountPassingAllRows: result.angleCountPassingAllRows,
  angleCountPassingFrameBandAndPair: result.angleCountPassingFrameBandAndPair,
  angleRangesPassingFrameBandAndPair: result.angleRangesPassingFrameBandAndPair,
  constraintCounts: result.constraintCounts,
  perOption: perOption.map(({ caseId, combined }) => ({ caseId, combined })) }, null, 2));
