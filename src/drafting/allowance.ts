// How much seam allowance each edge gets — the production numbers a garment
// carries, not something the UI should invent.
//
// Real patterns do not use one number. A hem needs a deep turn-up, a knit
// neckline takes a narrow band, and an edge that sits on a FOLD gets none at all
// (the pattern edge lies exactly on the fabric fold; adding allowance there makes
// the finished garment wider than the spec says).
//
// `byEdge` is keyed by EDGE NAME, so two pieces that name an edge the same way
// share its allowance — "hem" means the same thing on a body and on a sleeve.
// That is deliberate: the name is the contract.

/** Seam allowance in cm: one default, with per-edge-name overrides. */
export interface AllowanceSpec {
  readonly default: number;
  readonly byEdge?: Readonly<Record<string, number>>;
  /** Per-piece overrides are applied before the shared edge-name rule. */
  readonly byPieceEdge?: Readonly<Record<string, Readonly<Record<string, number>>>>;
}

/** Piece-edge override, then shared edge-name rule, then the default. */
export function allowanceFor(spec: AllowanceSpec, edgeName: string, pieceName?: string): number {
  const byPiece = pieceName === undefined ? undefined : spec.byPieceEdge?.[pieceName];
  if (byPiece && edgeName in byPiece) return byPiece[edgeName];
  const byEdge = spec.byEdge;
  if (byEdge && edgeName in byEdge) return byEdge[edgeName];
  return spec.default;
}

/** No allowance anywhere — the sewing outline itself (used by the tech-pack sketch). */
export const NO_ALLOWANCE: AllowanceSpec = { default: 0 };
