// Darts — the engine half. A dart is a wedge folded out of a flat piece to build
// shape (a bust dart cones the fabric over the bust). In the flat pattern it is
// two straight LEG edges that meet at the APEX, with the wedge open at the MOUTH
// on a seam. We store only the leg edge NAMES on the piece; everything else is
// read live off the outline, so editing a leg moves the apex/mouth with it.
//
// This is garment-agnostic engine. Which piece gets a dart, and where, is recipe
// (see fitted.ts).

import { Point } from "../geometry";
import { Edge, Piece, edgeStart, edgeEnd, pieceEdge } from "./piece";

export interface ResolvedDart {
  readonly apex: Point;                       // where the two legs meet (interior)
  readonly mouth: readonly [Point, Point];    // the two open ends on the seam
}

/**
 * Resolve a piece's dart to live points, or null if it has none.
 * Convention: leg[0] runs mouthUpper → apex, leg[1] runs apex → mouthLower, so the
 * shared apex is leg[0].end === leg[1].start.
 */
export function dartOf(piece: Piece): ResolvedDart | null {
  if (!piece.dart) return null;
  const upper = pieceEdge(piece, piece.dart.legs[0]);
  const lower = pieceEdge(piece, piece.dart.legs[1]);
  return { apex: edgeEnd(upper), mouth: [edgeStart(upper), edgeEnd(lower)] };
}

/** The take-up (intake) of a dart: the straight gap across its mouth, in cm. */
export function dartIntake(piece: Piece): number {
  const d = dartOf(piece);
  if (!d) return 0;
  return Math.hypot(d.mouth[0].x - d.mouth[1].x, d.mouth[0].y - d.mouth[1].y);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dart manipulation: moving a dart without changing the fit.
//
// A dart is a wedge of fabric removed so the cloth can cone over a curve. WHERE
// the wedge is removed is a style choice; HOW MUCH is removed is the fit. So you
// may slash the pattern from the apex to anywhere on the edge, swing the cut
// piece around the apex until the old dart shuts, and the same wedge re-opens at
// the new place. Same apex, same angle, same seam lengths — a different look.
//
// The swing is a rigid rotation, which is why every seam it carries keeps its
// length. That is the conservation law, and it falls straight out of the maths.
// The chain holding the FOLD must never move, so we always rotate the other one.
// ─────────────────────────────────────────────────────────────────────────────

import { rotatePoint, angleBetween, lerp } from "../geometry";

/** The wedge angle of the dart: how far the mouth must swing to shut. */
export function dartAngle(piece: Piece): number {
  const d = dartOf(piece);
  if (!d) return 0;
  return angleBetween(d.mouth[0], d.apex, d.mouth[1]);
}

function rotateEdge(e: Edge, about: Point, angle: number): Edge {
  const r = (p: Point): Point => rotatePoint(p, about, angle);
  return e.kind === "line"
    ? { ...e, start: r(e.start), end: r(e.end) }
    : { ...e, curve: {
        start: r(e.curve.start),
        control1: r(e.curve.control1),
        control2: r(e.curve.control2),
        end: r(e.curve.end),
      } };
}

type LineEdge = Edge & { kind: "line" };

/** Split a straight edge at t into [start→P, P→end]; the far half is renamed. */
function splitLine(e: LineEdge, t: number): [LineEdge, LineEdge] {
  const p = lerp(e.start, e.end, t);
  return [
    { kind: "line", name: e.name, start: e.start, end: p },
    { kind: "line", name: `${e.name}Outer`, start: p, end: e.end },
  ];
}

const idx = (piece: Piece, name: string): number => {
  const i = piece.edges.findIndex((e) => e.name === name);
  if (i < 0) throw new Error(`no edge named ${name}`);
  return i;
};

/** Walk edge indices forward from `from` (exclusive) to `to` (exclusive), wrapping. */
function between(n: number, from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = (from + 1) % n; i !== to; i = (i + 1) % n) out.push(i);
  return out;
}

/**
 * Move the dart to `target` (a straight edge), pivoting about the apex.
 *
 * `anchor` names the edge that must not move — the centre fold. We rotate
 * whichever side of the slash does not contain it, so the fold stays put.
 * Returns a new piece: the old dart is closed (its seam becomes continuous) and
 * an identical wedge opens on `target` at parameter `t`.
 */
export function transferDart(piece: Piece, target: string, t: number, anchor: string): Piece {
  const d = dartOf(piece);
  if (!d) return piece;

  const n = piece.edges.length;
  const [upperName, lowerName] = piece.dart!.legs;
  const iUpper = idx(piece, upperName);
  const iLower = idx(piece, lowerName);
  const iTarget = idx(piece, target);
  const iAnchor = idx(piece, anchor);
  const theta = dartAngle(piece);

  const targetEdge = piece.edges[iTarget];
  if (targetEdge.kind !== "line") throw new Error(`dart target ${target} must be a straight edge`);
  const [near, far] = splitLine(targetEdge, t);

  // Two chains leave the apex. The one running FORWARD from the lower leg, and
  // the one running BACKWARD from the upper leg. Rotate the fold-free chain.
  const forward = between(n, iLower, iTarget); // lower leg → … → target
  const foldIsForward = forward.includes(iAnchor);

  if (foldIsForward) {
    // Rotate the backward chain: target's far half, …, up to the upper leg.
    // Swinging it by +theta lands mouthUpper exactly on mouthLower.
    const moving = between(n, iTarget, iUpper);
    const spun = (e: Edge): Edge => rotateEdge(e, d.apex, theta);
    const edges: Edge[] = [
      near,                                                   // anchor side of target
      { kind: "line", name: upperName, start: near.end, end: d.apex },
      { kind: "line", name: lowerName, start: d.apex, end: rotatePoint(near.end, d.apex, theta) },
      spun(far),                                              // swung far half of target
      ...moving.map((i) => spun(piece.edges[i])),             // the swung chain
      ...between(n, iLower, iTarget).map((i) => piece.edges[i]), // untouched, incl. fold
    ];
    return { ...piece, edges };
  }

  // Rotate the forward chain: lower leg's chain, …, up to target's near half.
  // Swinging it by -theta lands mouthLower exactly on mouthUpper.
  const moving = forward;
  const spun = (e: Edge): Edge => rotateEdge(e, d.apex, -theta);
  const P = near.end;
  const edges: Edge[] = [
    ...between(n, iTarget, iUpper).map((i) => piece.edges[i]), // untouched, incl. fold
    ...moving.map((i) => spun(piece.edges[i])),                // the swung chain
    spun(near),                                                // swung near half of target
    { kind: "line", name: upperName, start: rotatePoint(P, d.apex, -theta), end: d.apex },
    { kind: "line", name: lowerName, start: d.apex, end: P },
    far,                                                       // anchor side of target
  ];
  return { ...piece, edges };
}

/** Do these two edges meet end-to-start? Only then can the seam between them be trued. */
export function edgesMeet(piece: Piece, nameA: string, nameB: string): boolean {
  const a = pieceEdge(piece, nameA);
  const b = pieceEdge(piece, nameB);
  const end = edgeEnd(a);
  const start = edgeStart(b);
  return Math.hypot(end.x - start.x, end.y - start.y) < 1e-9;
}

/**
 * The kink (degrees) where two consecutive straight edges meet: 0 = straight on.
 * Transferring a dart away from a seam leaves a corner there, exactly the size of
 * the dart angle — that corner is what truing removes.
 */
export function seamKink(piece: Piece, nameA: string, nameB: string): number {
  const a = pieceEdge(piece, nameA);
  const b = pieceEdge(piece, nameB);
  const corner = edgeEnd(a);
  const u = { x: edgeStart(a).x - corner.x, y: edgeStart(a).y - corner.y };
  const v = { x: edgeEnd(b).x - corner.x, y: edgeEnd(b).y - corner.y };
  const dot = u.x * v.x + u.y * v.y;
  const mag = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
  return 180 - (Math.acos(dot / mag) * 180) / Math.PI;
}

/**
 * True a seam: replace two consecutive straight edges with one straight edge
 * running corner to corner. This is the patternmaker's "blend" — it removes the
 * kink a transferred dart leaves behind.
 *
 * Honest cost: a straight line is SHORTER than the bent path it replaces, so the
 * seam loses a little length. That is truing, not a bug — you re-check the seam
 * against its partner afterwards.
 */
export function trueSeam(piece: Piece, nameA: string, nameB: string): Piece {
  const iA = idx(piece, nameA);
  const a = piece.edges[iA];
  const b = pieceEdge(piece, nameB);
  if (a.kind !== "line" || b.kind !== "line") throw new Error("can only true straight seams");
  const merged: Edge = { kind: "line", name: nameA, start: a.start, end: b.end };
  const edges = piece.edges.filter((e) => e.name !== nameA && e.name !== nameB);
  edges.splice(iA, 0, merged);
  return { ...piece, edges };
}
