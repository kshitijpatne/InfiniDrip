// Notches and grainlines as *rules*, not saved points.
//
// A notch is "the point t% along edge E of piece P" — re-evaluated on every
// rebuild from the live geometry. That means:
//   - notches stay correct when any measurement changes
//   - they grade for free when Slice 14 runs the engine over a size table
//   - matched notches on two seams come from the *same* rule on both edges,
//     so they can never drift apart
//
// This file is pure engine: it knows how to derive a point on an edge.
// Which notches a t-shirt needs is recipe (tshirt-notches.ts).
//
// Convention: a notch is drawn as a small perpendicular tick on the sewing line.
// We give callers the point + the inward normal so they can draw the tick.

import { Point, cubicPoint } from "../geometry";
import { Edge, Piece, pieceEdge } from "../drafting";

// ── Point on an edge at parameter t ∈ [0, 1] ────────────────────────────────

/** Sample a point at fractional position t along an edge. */
export function pointOnEdge(edge: Edge, t: number): Point {
  if (edge.kind === "line") {
    return {
      x: edge.start.x + (edge.end.x - edge.start.x) * t,
      y: edge.start.y + (edge.end.y - edge.start.y) * t,
    };
  }
  return cubicPoint(edge.curve, t);
}

/** Tangent direction at t along an edge (not normalised — callers normalise). */
function tangentOnEdge(edge: Edge, t: number): Point {
  const dt = 0.001;
  const t1 = Math.max(0, t - dt);
  const t2 = Math.min(1, t + dt);
  const p1 = pointOnEdge(edge, t1);
  const p2 = pointOnEdge(edge, t2);
  return { x: p2.x - p1.x, y: p2.y - p1.y };
}

/** Unit inward normal at t — perpendicular to the edge, pointing into the piece. */
export function normalOnEdge(edge: Edge, t: number): Point {
  const tan = tangentOnEdge(edge, t);
  const len = Math.hypot(tan.x, tan.y);
  // Rotate 90° clockwise to get the right-hand normal (inward for a CCW outline).
  return { x: tan.y / len, y: -tan.x / len };
}

// ── Notch descriptor ─────────────────────────────────────────────────────────

export interface NotchRule {
  readonly edgeName: string; // which edge the notch sits on
  readonly t: number;        // position along that edge, 0 = start, 1 = end
}

export interface Notch {
  readonly point: Point;   // where the notch sits on the sewing line
  readonly normal: Point;  // unit inward normal — tick extends outward (-normal)
}

/** Resolve a rule against a live piece into a concrete notch. */
export function resolveNotch(piece: Piece, rule: NotchRule): Notch {
  const edge = pieceEdge(piece, rule.edgeName);
  return {
    point: pointOnEdge(edge, rule.t),
    normal: normalOnEdge(edge, rule.t),
  };
}

// ── Grainline descriptor ─────────────────────────────────────────────────────

export interface GrainlineRule {
  readonly topEdge: string;
  readonly topT: number;
  readonly bottomEdge: string;
  readonly bottomT: number;
}

export interface Grainline {
  readonly top: Point;
  readonly bottom: Point;
}

/** Resolve a grainline rule against a live piece. */
export function resolveGrainline(piece: Piece, rule: GrainlineRule): Grainline {
  return {
    top: pointOnEdge(pieceEdge(piece, rule.topEdge), rule.topT),
    bottom: pointOnEdge(pieceEdge(piece, rule.bottomEdge), rule.bottomT),
  };
}

// ── SVG helpers ───────────────────────────────────────────────────────────────

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** SVG for a single notch tick of length `len` cm. */
export function notchSvg(
  notch: Notch,
  len: number,
  stroke: string,
  strokeWidth: number
): string {
  const x1 = round(notch.point.x);
  const y1 = round(notch.point.y);
  const x2 = round(notch.point.x - notch.normal.x * len);
  const y2 = round(notch.point.y - notch.normal.y * len);
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
    `stroke="${stroke}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`;
}

/** SVG for a grainline with double-headed chevrons. */
export function grainlineSvg(
  gl: Grainline,
  stroke: string,
  strokeWidth: number,
  chevronSize: number
): string {
  const { top: t, bottom: b } = gl;
  const c = chevronSize;
  const cx = (t.x + b.x) / 2;

  const line = `<line x1="${round(t.x)}" y1="${round(t.y)}" x2="${round(b.x)}" y2="${round(b.y)}" ` +
    `stroke="${stroke}" stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`;

  const chevronUp =
    `<path d="M ${round(cx - c)} ${round(t.y + c)} L ${round(cx)} ${round(t.y)} ` +
    `L ${round(cx + c)} ${round(t.y + c)}" fill="none" stroke="${stroke}" ` +
    `stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`;

  const chevronDown =
    `<path d="M ${round(cx - c)} ${round(b.y - c)} L ${round(cx)} ${round(b.y)} ` +
    `L ${round(cx + c)} ${round(b.y - c)}" fill="none" stroke="${stroke}" ` +
    `stroke-width="${strokeWidth}" vector-effect="non-scaling-stroke"/>`;

  return line + chevronUp + chevronDown;
}
