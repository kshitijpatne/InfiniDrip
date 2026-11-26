import {
  xyz,
  type AssemblyPanel,
  type AssemblySeam,
  type Point3,
  type JoinDefinition,
  type PanelOrientation,
} from './assembly-contract';

const EPS = 1e-8;
const sub = (a: Point3, b: Point3): Point3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Point3, b: Point3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Point3, b: Point3): Point3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: Point3) => Math.hypot(a[0], a[1], a[2]);
const key = (a: number, b: number) => (a < b ? `${a}/${b}` : `${b}/${a}`);
const dominant = (v: Point3) =>
  Math.abs(v[0]) > Math.abs(v[1])
    ? Math.abs(v[0]) > Math.abs(v[2])
      ? 0
      : 2
    : Math.abs(v[1]) > Math.abs(v[2])
      ? 1
      : 2;
interface Face {
  points: [Point3, Point3, Point3];
  ids: number[];
  normal: Point3;
  low: number[];
  high: number[];
  name: string;
}
function limits(ds: number[], pts: Point3[], k: number): [number, number] {
  const ts: number[] = [];
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    if (Math.abs(ds[i]) <= EPS) ts.push(pts[i][k]);
    if ((ds[i] > EPS && ds[j] < -EPS) || (ds[i] < -EPS && ds[j] > EPS))
      ts.push(pts[i][k] + ((pts[j][k] - pts[i][k]) * ds[i]) / (ds[i] - ds[j]));
  }
  return [Math.min(...ts), Math.max(...ts)];
}
/** For coplanar faces, classify vertices and all segment crossings in the dominant projection.
 * Only points on the explicitly shared welded segment/vertex may touch. */
function coplanarIntersection(a: Face, b: Face, shared: Point3[]): boolean {
  const drop = dominant(a.normal),
    x = (drop + 1) % 3,
    y = (drop + 2) % 3;
  const orient = (u: Point3, v: Point3, w: Point3) =>
    (v[x] - u[x]) * (w[y] - u[y]) - (v[y] - u[y]) * (w[x] - u[x]);
  const allowed = (p: Point3) => {
    if (!shared.length) return false;
    if (shared.length === 1) return norm(sub(p, shared[0])) <= EPS;
    return (
      Math.abs(orient(shared[0], shared[1], p)) <= EPS && dot(sub(p, shared[0]), sub(p, shared[1])) <= EPS
    );
  };
  const inside = (p: Point3, face: Face) => {
    const o = face.points.map((u, i) => orient(u, face.points[(i + 1) % 3], p));
    return o.every((v) => v >= -EPS) || o.every((v) => v <= EPS);
  };
  if (a.points.some((p) => inside(p, b) && !allowed(p)) || b.points.some((p) => inside(p, a) && !allowed(p)))
    return true;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const p = a.points[i],
        q = a.points[(i + 1) % 3],
        r = b.points[j],
        s = b.points[(j + 1) % 3];
      const d1 = orient(p, q, r),
        d2 = orient(p, q, s),
        d3 = orient(r, s, p),
        d4 = orient(r, s, q);
      if (d1 * d2 < -EPS * EPS && d3 * d4 < -EPS * EPS) {
        const t = d3 / (d3 - d4);
        const intersection: Point3 = [
          p[0] + (q[0] - p[0]) * t,
          p[1] + (q[1] - p[1]) * t,
          p[2] + (q[2] - p[2]) * t,
        ];
        if (!allowed(intersection)) return true;
      }
    }
  return false;
}
function forbiddenContact(a: Face, b: Face): boolean {
  const da = a.points.map((p) => dot(b.normal, sub(p, b.points[0])));
  const outside = (d: number[]) => d.every((v) => v > EPS) || d.every((v) => v < -EPS);
  if (outside(da)) return false;
  const db = b.points.map((p) => dot(a.normal, sub(p, a.points[0])));
  if (outside(db)) return false;
  const shared = a.points.filter((p, i) => {
    const j = b.ids.indexOf(a.ids[i]);
    return j >= 0 && norm(sub(p, b.points[j])) <= EPS;
  });
  if (shared.length === 3) return true;
  if (da.every((d) => Math.abs(d) <= EPS) && db.every((d) => Math.abs(d) <= EPS))
    return coplanarIntersection(a, b, shared);
  if (shared.length === 2) return false;
  const k = dominant(cross(a.normal, b.normal));
  const [loA, hiA] = limits(da, a.points, k),
    [loB, hiB] = limits(db, b.points, k);
  const low = Math.max(loA, loB),
    high = Math.min(hiA, hiB);
  if (low > high + EPS) return false;
  return shared.length === 0 || low < shared[0][k] - EPS || high > shared[0][k] + EPS;
}
export function checkIntersections(faces: Face[]) {
  faces.sort((a, b) => a.low[0] - b.low[0]);
  for (let i = 0; i < faces.length; i++)
    for (let j = i + 1; j < faces.length; j++) {
      const a = faces[i],
        b = faces[j];
      if (b.low[0] > a.high[0] + EPS) break;
      if (
        b.low[1] > a.high[1] + EPS ||
        a.low[1] > b.high[1] + EPS ||
        b.low[2] > a.high[2] + EPS ||
        a.low[2] > b.high[2] + EPS
      )
        continue;
      if (forbiddenContact(a, b))
        throw new Error(`Unintended triangle intersection: ${a.name} and ${b.name}`);
    }
}
function inspectPanel(
  panel: AssemblyPanel<string>,
  orientation: PanelOrientation,
  offset: number,
  welded: number[],
  faces: Face[],
) {
  const edgeUse = new Map<string, number>();
  const directed = new Set<string>();
  let minWorldAreaCm2 = Infinity,
    minRestAreaCm2 = Infinity;
  const count = panel.rest.length;
  if (panel.positions.length !== 3 * count || panel.indices.length % 3 || !panel.indices.length)
    throw new Error(`${panel.id}: invalid triangle buffers`);
  const restDirection = orientation.restSign;
  for (let i = 0; i < panel.indices.length; i += 3) {
    const ids = panel.indices.slice(i, i + 3);
    if (ids.some((v) => !Number.isInteger(v) || v < 0 || v >= count))
      throw new Error(`${panel.id} face ${i / 3}: invalid vertex reference`);
    const points = ids.map((v) => xyz(panel.positions, v)) as Face['points'];
    const rest = ids.map((v) => panel.rest[v]);
    const restArea =
      (((rest[1].x - rest[0].x) * (rest[2].y - rest[0].y) -
        (rest[2].x - rest[0].x) * (rest[1].y - rest[0].y)) *
        restDirection) /
      2;
    const normal = cross(sub(points[1], points[0]), sub(points[2], points[0]));
    const magnitude = norm(normal),
      area = magnitude / 2;
    if (!(restArea > 1e-6 && area > 1e-6 && Number.isFinite(area)))
      throw new Error(
        `${panel.id} face ${i / 3}: inverted or degenerate triangle (${restArea}, ${area} cm²)`,
      );
    if (dot(normal, orientation.outward(ids)) <= 0)
      throw new Error(`${panel.id} face ${i / 3}: inverted world winding`);
    for (let k = 0; k < 3; k++) {
      const a = ids[k],
        b = ids[(k + 1) % 3],
        e = key(a, b),
        d = `${a}/${b}`;
      if (directed.has(d)) throw new Error(`${panel.id} face ${i / 3}: repeated directed triangle edge`);
      directed.add(d);
      edgeUse.set(e, (edgeUse.get(e) ?? 0) + 1);
    }
    minWorldAreaCm2 = Math.min(minWorldAreaCm2, area);
    minRestAreaCm2 = Math.min(minRestAreaCm2, restArea);
    faces.push({
      points,
      ids: ids.map((v) => welded[offset + v]),
      normal: [normal[0] / magnitude, normal[1] / magnitude, normal[2] / magnitude],
      low: [0, 1, 2].map((k) => Math.min(...points.map((p) => p[k]))),
      high: [0, 1, 2].map((k) => Math.max(...points.map((p) => p[k]))),
      name: `${panel.id}#${i / 3}`,
    });
  }
  const boundary = new Set([...edgeUse].filter(([, count]) => count === 1).map(([edge]) => edge));
  for (const trace of panel.traces) {
    for (let i = 1; i < trace.indices.length; i++) {
      const e = key(trace.indices[i - 1], trace.indices[i]);
      if (orientation.folds.includes(trace.edge)) {
        if (edgeUse.get(e) !== 2)
          throw new Error(`${trace.instance}/${trace.edge}: fold has broken incidence`);
      } else if (!boundary.delete(e))
        throw new Error(`${trace.instance}/${trace.edge}: dropped or repeated boundary edge`);
    }
  }
  if (boundary.size) throw new Error(`${panel.id}: unaccounted mesh boundary ${[...boundary][0]}`);
  return { minWorldAreaCm2, minRestAreaCm2 };
}
export function validateMesh<R extends string>(
  panels: readonly AssemblyPanel<R>[],
  seams: readonly AssemblySeam[],
  expected: readonly JoinDefinition[],
  orientation: (p: AssemblyPanel<R>) => PanelOrientation,
) {
  const byId = new Map(panels.map((p) => [p.id, p]));
  const offsets = new Map<string, number>();
  let vertexCount = 0;
  for (const panel of panels) {
    offsets.set(panel.id, vertexCount);
    vertexCount += panel.rest.length;
  }
  const parent = Array.from({ length: vertexCount }, (_, i) => i);
  const root = (k: number) => {
    while (k !== parent[k]) {
      parent[k] = parent[parent[k]];
      k = parent[k];
    }
    return k;
  };
  let maxSeamGapCm = 0;
  if (seams.length !== expected.length) throw new Error('Missing or repeated physical seam');
  const joinIds = new Set<string>(),
    usedEdges = new Set<string>();
  for (const definition of expected) {
    if (joinIds.has(definition.id)) throw new Error(`Repeated physical seam ID ${definition.id}`);
    joinIds.add(definition.id);
    const seam = seams.find((s) => s.id === definition.id);
    if (!seam) throw new Error(`Missing ${definition.id}`);
    const [a, b] = seam.sides;
    for (const [k, side] of seam.sides.entries()) {
      const spec = definition.sides[k];
      const edgeId = JSON.stringify([spec.instance, spec.edge]);
      if (usedEdges.has(edgeId))
        throw new Error(`${definition.id}: repeated physical sewing edge ${spec.instance}/${spec.edge}`);
      usedEdges.add(edgeId);
      const original = byId
        .get(side.panel)
        ?.traces.find((t) => t.instance === spec.instance && t.edge === spec.edge);
      if (
        !original ||
        side.edge !== spec.edge ||
        side.role !== spec.role ||
        side.instance !== spec.instance ||
        side.reversed !== spec.reversed ||
        side.indices.length !== original.indices.length ||
        side.parameters.length !== original.parameters.length
      )
        throw new Error(`${definition.id}: wrongly oriented or referenced source trace`);
      for (let i = 0; i < original.indices.length; i++) {
        const j = spec.reversed ? original.indices.length - 1 - i : i;
        if (side.indices[i] !== original.indices[j] || side.parameters[i] !== original.parameters[j])
          throw new Error(`${definition.id}: wrong landmark/station for ${side.instance}/${side.edge}`);
      }
    }
    if (a.indices.length !== b.indices.length || seam.points.length !== a.indices.length)
      throw new Error(`${seam.id}: missing paired stations`);
    for (let i = 0; i < a.indices.length; i++) {
      const ai = a.indices[i],
        bi = b.indices[i],
        p = xyz(byId.get(a.panel)!.positions, ai),
        q = xyz(byId.get(b.panel)!.positions, bi);
      const gap = Math.max(norm(sub(p, q)), norm(sub(p, seam.points[i])));
      if (!(gap <= 0.01)) throw new Error(`${seam.id} station ${i}: seam gap ${gap} cm`);
      maxSeamGapCm = Math.max(maxSeamGapCm, gap);
      parent[root(offsets.get(b.panel)! + bi)] = root(offsets.get(a.panel)! + ai);
    }
  }
  const welded = parent.map((_, i) => root(i)),
    faces: Face[] = [];
  const areas = panels.map((p) => inspectPanel(p, orientation(p), offsets.get(p.id)!, welded, faces));
  const globalDirected = new Set<string>();
  for (const f of faces)
    for (let i = 0; i < 3; i++) {
      const d = `${f.ids[i]}/${f.ids[(i + 1) % 3]}`;
      if (globalDirected.has(d)) throw new Error(`${f.name}: same-directed or nonmanifold edge after sewing`);
      globalDirected.add(d);
    }
  checkIntersections(faces);
  return {
    maxSeamGapCm,
    intersections: 0,
    triangles: faces.length,
    minWorldAreaCm2: Math.min(...areas.map((a) => a.minWorldAreaCm2)),
    minRestAreaCm2: Math.min(...areas.map((a) => a.minRestAreaCm2)),
  };
}
