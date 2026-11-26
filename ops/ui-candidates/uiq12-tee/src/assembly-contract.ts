import type { Block } from '../../../../src/drafting/block';
import type { Arc } from './seam-correspondence';
import type { Edge, Piece } from '../../../../src/drafting/piece';
import type { Point } from '../../../../src/geometry/point';

export type Point2 = Point;
export type Point3 = readonly [number, number, number];
export type Role = 'front' | 'back' | 'sleeve';
export type Hand = 'left' | 'right';
export interface AssemblySource {
  readonly revision: string;
  readonly block: Block;
  readonly cuts: Readonly<Record<string, readonly Point2[]>>;
}
export interface Side {
  readonly role: string;
  readonly edge: string;
  readonly instance: string;
  readonly reversed: boolean;
}
export interface BoundaryTrace extends Side {
  readonly panel: string;
  readonly indices: readonly number[];
  readonly parameters: readonly number[];
  readonly restLengthCm: number;
}
export interface AssemblyPanel<R extends string = Role> {
  readonly id: string;
  readonly role: R;
  readonly positions: readonly number[];
  readonly indices: readonly number[];
  /** Source chart per vertex, in cm. Folded charts have signed transverse x. */
  readonly rest: readonly Point2[];
  readonly seed: readonly Point3[];
  readonly traces: readonly BoundaryTrace[];
  readonly sewingPiece: Piece;
  readonly cutLine: readonly Point2[];
}
export interface AssemblySeam {
  readonly id: string;
  readonly label: string;
  readonly points: readonly Point3[];
  readonly sides: readonly [BoundaryTrace, BoundaryTrace];
}
export interface Assembly {
  readonly version: 1;
  readonly units: 'cm';
  readonly revision: string;
  readonly panels: readonly AssemblyPanel[];
  readonly seams: readonly AssemblySeam[];
  readonly diagnostics: {
    readonly triangles: number;
    readonly minWorldAreaCm2: number;
    readonly minRestAreaCm2: number;
    readonly maxSeamGapCm: number;
    readonly maxArcAuditErrorCm: number;
    readonly maxIntegrationErrorCm: number;
    readonly arcAudit: readonly {
      role: string;
      edge: string;
      nativeCm: number;
      integratedCm: number;
      measuredEdge: Edge;
      referenceCm: number;
      nativeDifferenceCm: number;
      integrationDifferenceCm: number;
    }[];
    readonly signedCapEaseCm: number;
    readonly wrongWholeSeamApexMissCm: number;
    readonly capIntervals: readonly { id: string; capCm: number; armholeCm: number; easeCm: number }[];
    readonly landmarks: readonly {
      id: string;
      references: readonly string[];
      point: Point3;
      residualCm: number;
    }[];
    readonly frontHemSpanCm: number;
    readonly frontVerticalSpanCm: number;
    readonly seedPlacement: string;
    readonly intersections: number;
  };
}
export function xyz(positions: readonly number[], i: number): Point3 {
  return [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
}
export function mix(a: Point3, b: Point3, t: number): Point3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export interface JoinDefinition {
  id: string;
  label: string;
  sides: readonly [Side, Side];
}
export interface PanelOrientation {
  readonly restSign: number;
  readonly folds: readonly string[];
  /** Outward direction in the placement chart at this face. Independent of face winding. */
  outward(vertexIds: readonly number[]): Point3;
}
/** Transfinite interpolation reproduces all four analytic sewing boundaries. */
export function patch(
  top: Point3,
  bottom: Point3,
  left: Point3,
  right: Point3,
  corners: readonly Point3[],
  u: number,
  v: number,
): Point3 {
  const horizontal = mix(top, bottom, v),
    vertical = mix(left, right, u);
  const bilinear = mix(mix(corners[0], corners[1], u), mix(corners[2], corners[3], u), v);
  return [
    horizontal[0] + vertical[0] - bilinear[0],
    horizontal[1] + vertical[1] - bilinear[1],
    horizontal[2] + vertical[2] - bilinear[2],
  ];
}
export class Chart<R extends string> {
  readonly positions: number[] = [];
  readonly rest: Point2[] = [];
  readonly seed: Point3[] = [];
  readonly indices: number[] = [];
  readonly traces: BoundaryTrace[] = [];
  constructor(
    readonly id: string,
    readonly role: R,
  ) {}
  vertex(rest: Point2, seed: Point3, world: Point3) {
    this.positions.push(...world);
    this.seed.push(seed);
    return this.rest.push(rest) - 1;
  }
  cell(a: number, b: number, c: number, d: number, invert: boolean) {
    // A concave quad requires its interior diagonal, independent of left/right face winding.
    const turn = (i: number, j: number, k: number) => {
      const p = this.rest[i],
        q = this.rest[j],
        r = this.rest[k];
      return (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    };
    const useOther = turn(a, b, c) * turn(a, c, d) <= 0 && turn(a, b, d) * turn(b, c, d) > 0;
    if (useOther) this.indices.push(...(invert ? [a, d, b, b, d, c] : [a, b, d, b, c, d]));
    else this.indices.push(...(invert ? [a, c, b, a, d, c] : [a, b, c, a, c, d]));
  }
  trace(instance: string, arc: Arc, indices: number[], stations: number[]) {
    this.traces.push({
      role: this.role,
      instance,
      panel: this.id,
      edge: arc.edge.name,
      reversed: false,
      indices,
      parameters: stations.map((s) => arc.at(s).t),
      restLengthCm: arc.length,
    });
  }
  finish(sewingPiece: Piece, cutLine: readonly Point2[]): AssemblyPanel<R> {
    return {
      id: this.id,
      role: this.role,
      positions: this.positions,
      indices: this.indices,
      rest: this.rest,
      seed: this.seed,
      traces: this.traces,
      sewingPiece,
      cutLine,
    };
  }
}
