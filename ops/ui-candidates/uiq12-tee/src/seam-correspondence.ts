import { edgeLength, edgeStart, edgeEnd, type Edge } from '../../../../src/drafting/piece';
import { cubicPoint, cubicLength } from '../../../../src/geometry/curve';
import { lerp } from '../../../../src/geometry/point';
import type { Point2, BoundaryTrace, AssemblyPanel, AssemblySeam } from './assembly-contract';
import { xyz } from './assembly-contract';

export interface Arc {
  readonly edge: Edge;
  readonly length: number;
  readonly auditError: number;
  readonly analyticLength: number;
  readonly referenceLength: number;
  at(fraction: number): { point: Point2; t: number };
}
/** Invert analytic arclength without changing the signed lengths used by the source stitch validator. */
export function arc(edge: Edge): Arc {
  const length = edgeLength(edge);
  if (!(length > 0 && Number.isFinite(length))) throw new Error(`Invalid sewing length on ${edge.name}`);
  if (edge.kind === 'line')
    return {
      edge,
      length,
      analyticLength: length,
      referenceLength: length,
      auditError: 0,
      at: (t) => ({ point: lerp(edge.start, edge.end, t), t }),
    };
  const segments = 512;
  const cumulative = [0];
  const curve = edge.curve;
  const speed = (t: number) => {
    const u = 1 - t;
    const dx =
      u * u * (curve.control1.x - curve.start.x) +
      2 * u * t * (curve.control2.x - curve.control1.x) +
      t * t * (curve.end.x - curve.control2.x);
    const dy =
      u * u * (curve.control1.y - curve.start.y) +
      2 * u * t * (curve.control2.y - curve.control1.y) +
      t * t * (curve.end.y - curve.control2.y);
    return 3 * Math.hypot(dx, dy);
  };
  // Two-node Gauss-Legendre quadrature on each interval of the inverse station table.
  const half = 0.5 / segments,
    offset = half / Math.sqrt(3);
  for (let i = 0; i < segments; i++) {
    const mid = (i + 0.5) / segments;
    cumulative.push(cumulative[i] + half * (speed(mid - offset) + speed(mid + offset)));
  }
  const trueLength = cumulative[segments];
  // Richardson extrapolation cancels the O(h²) chord-walk error independently of speed quadrature.
  const fine = cubicLength(curve, 1024),
    coarse = cubicLength(curve, 512);
  const referenceLength = (4 * fine - coarse) / 3;
  return {
    edge,
    length,
    analyticLength: trueLength,
    referenceLength,
    auditError: Math.abs(length - referenceLength),
    at(fraction) {
      if (fraction === 0) return { point: edgeStart(edge), t: 0 };
      if (fraction === 1) return { point: edgeEnd(edge), t: 1 };
      const station = fraction * trueLength;
      let lo = 0,
        hi = segments;
      while (hi - lo > 1) {
        const mid = (lo + hi) >>> 1;
        if (cumulative[mid] < station) lo = mid;
        else hi = mid;
      }
      const t = (lo + (station - cumulative[lo]) / (cumulative[hi] - cumulative[lo])) / segments;
      return { point: cubicPoint(edge.curve, t), t };
    },
  };
}
export function reverseTrace(trace: BoundaryTrace): BoundaryTrace {
  return {
    ...trace,
    reversed: !trace.reversed,
    indices: [...trace.indices].reverse(),
    parameters: [...trace.parameters].reverse(),
  };
}
/** Both traces retain their independent source parameters and lengths. No source vertex is rescaled. */
export function joinTraces(
  id: string,
  label: string,
  a: BoundaryTrace,
  b: BoundaryTrace,
  panels: ReadonlyMap<string, AssemblyPanel<string>>,
): AssemblySeam {
  if (a.indices.length !== b.indices.length || a.indices.length < 2)
    throw new Error(`${id}: missing or unequal seam stations`);
  const points = a.indices.map((i) => xyz(panels.get(a.panel)!.positions, i));
  return { id, label, points, sides: [a, b] };
}
