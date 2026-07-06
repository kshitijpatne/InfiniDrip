// Draw the piece being edited, with its draggable handles as dots: filled
// squares for corner vertices, hollow circles for the curve "magnet" controls,
// and an amber ring on whichever handle is selected. A faint tie-line links each
// control to the vertex it bends, so the Bézier magnets read at a glance.
//
// Pure string out, like the rest of render. The viewBox is handed in (the editor
// and the pointer maths share one box, so a click lands where you'd expect).

import { Piece } from "../drafting";
import { Handle, ViewBox } from "../edit";
import { pieceToPath } from "./shape";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;

const VERTEX = T.lineActive; // corners: amber, filled
const CONTROL = "#5FA8D8"; // controls: cool blue, hollow
const SELECT = "#FFFFFF"; // selection ring

export function renderEditor(
  piece: Piece,
  handles: readonly Handle[],
  vb: ViewBox,
  selectedId: string | null = null
): string {
  const outline = `<path d="${pieceToPath(piece)}" fill="${T.lineActive}" fill-opacity="0.06" ` +
    `stroke="${T.line}" stroke-width="0.15" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;

  // Tie each control back to the vertex it pulls (that curve's start/end corner).
  const ties = handles
    .filter((h) => h.kind === "control")
    .map((h) => {
      // Every edge has a vertex handle, so the anchor for a control always exists.
      const anchor = handles.find(
        (a) => a.kind === "vertex" && (a.edge === h.edge || a.edge === (h.edge + 1) % piece.edges.length)
      )!;
      return `<line x1="${round(h.pos.x)}" y1="${round(h.pos.y)}" x2="${round(anchor.pos.x)}" ` +
        `y2="${round(anchor.pos.y)}" stroke="${CONTROL}" stroke-width="0.08" ` +
        `stroke-dasharray="0.4 0.3" opacity="0.5"/>`;
    })
    .join("");

  const dots = handles
    .map((h) => {
      const sel = h.id === selectedId;
      const ring = sel
        ? `<circle cx="${round(h.pos.x)}" cy="${round(h.pos.y)}" r="1.4" fill="none" ` +
          `stroke="${SELECT}" stroke-width="0.25"/>`
        : "";
      const dot =
        h.kind === "vertex"
          ? `<rect x="${round(h.pos.x - 0.7)}" y="${round(h.pos.y - 0.7)}" width="1.4" height="1.4" ` +
            `fill="${VERTEX}"/>`
          : `<circle cx="${round(h.pos.x)}" cy="${round(h.pos.y)}" r="0.7" fill="none" ` +
            `stroke="${CONTROL}" stroke-width="0.2"/>`;
      return ring + dot;
    })
    .join("");

  return `<svg viewBox="${round(vb.minX)} ${round(vb.minY)} ${round(vb.w)} ${round(vb.h)}" ` +
    `width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px;touch-action:none">` +
    `<rect x="${round(vb.minX)}" y="${round(vb.minY)}" width="${round(vb.w)}" height="${round(vb.h)}" ` +
    `fill="${T.background}"/>` +
    outline + ties + dots + `</svg>`;
}
