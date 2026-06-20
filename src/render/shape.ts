// Turning a Piece (named edges in cm) into render-ready data:
//  - pieceToPath:  the SVG path "d" string that draws the outline
//  - pieceBounds:  the box the piece occupies, used to lay pieces out

import { Piece, edgeStart, edgeEnd } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** The SVG path "d" string for a piece outline, in centimetre coordinates. */
export function pieceToPath(piece: Piece): string {
  const parts: string[] = [];
  piece.edges.forEach((edge, i) => {
    if (i === 0) {
      const s = edgeStart(edge);
      parts.push(`M ${round(s.x)} ${round(s.y)}`);
    }
    if (edge.kind === "line") {
      parts.push(`L ${round(edge.end.x)} ${round(edge.end.y)}`);
    } else {
      const c = edge.curve;
      parts.push(
        `C ${round(c.control1.x)} ${round(c.control1.y)} ` +
        `${round(c.control2.x)} ${round(c.control2.y)} ` +
        `${round(c.end.x)} ${round(c.end.y)}`
      );
    }
  });
  parts.push("Z");
  return parts.join(" ");
}

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

/** The bounding box of a piece, from its edge endpoints. */
export function pieceBounds(piece: Piece): Bounds {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const e of piece.edges) {
    for (const p of [edgeStart(e), edgeEnd(e)]) {
      xs.push(p.x);
      ys.push(p.y);
    }
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}
