// The skirt's two figures, the lower-body siblings of render/garment.ts and
// render/body.ts:
//   • renderSkirtGarment — the assembled front/back panels, in fabric colour.
//   • renderSkirtBody     — an annotated lower-body figure with a dimension line
//                           for each raw input (waist, hip, hipDepth, length).
//
// Honesty (same rule as the tee body view): the figure only bends where we have a
// number. A skirt DOES measure the waist and hip, so unlike the tee the sides taper
// from waist to hip — that curve is earned. `ease` has no body dimension. Girths
// (waist, hip) are marked "(circ)": the drawn span is a body width, not the
// circumference, and the label says so.
//
// The body view draws a BODY and drapes CLOTH over it (Slice 43). Nothing above the
// waist: a head or shoulder stub would be decoration carrying no data. Below the
// waist everything is measured or structural — the hip flare, the waist-to-hip drop
// (`hipDepth`), and the hem. The legs are structural rather than measured: they
// exist so a hem always lands ON a body, and they run past the longest hem the
// length slider allows.
//
// Pure: measurements in, one SVG string out.

import { Measurements, skirtWidths } from "../drafting";
import { BLUEPRINT as T } from "./theme";
import { lowerCroquisFigure, lowerCroquisFlareCommand } from "./croquis";
import type { LowerCroquisAnchors } from "./croquis";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const FONT = 'font-family="system-ui, sans-serif"';

function txt(x: number, y: number, s: string, anchor = "middle", size = 3): string {
  return `<text x="${round(x)}" y="${round(y)}" fill="${T.label}" font-size="${size}" ` +
    `${FONT} text-anchor="${anchor}">${s}</text>`;
}
function line(x1: number, y1: number, x2: number, y2: number, color: string, opacity = 1): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="${color}" stroke-width="0.8" stroke-opacity="${opacity}" vector-effect="non-scaling-stroke"/>`;
}
function dimH(xa: number, xb: number, y: number, label: string): string {
  return line(xa, y, xb, y, T.marker) +
    line(xa, y - 1.2, xa, y + 1.2, T.marker) +
    line(xb, y - 1.2, xb, y + 1.2, T.marker) +
    txt((xa + xb) / 2, y - 1.8, label);
}
// A vertical dimension line with end caps and a label to one side:
// side = 1 puts the label to the right of the line, side = -1 to the left.
function dimV(x: number, ya: number, yb: number, label: string, side: 1 | -1): string {
  return line(x, ya, x, yb, T.marker) +
    line(x - 1.2, ya, x + 1.2, ya, T.marker) +
    line(x - 1.2, yb, x + 1.2, yb, T.marker) +
    txt(x + side * 1.8, (ya + yb) / 2, label, side === 1 ? "start" : "end");
}
function seg(x1: number, y1: number, x2: number, y2: number, width: number): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="${T.line}" stroke-width="${width}" stroke-linecap="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
}
// The curved sibling of `seg`: an outline overlay that follows a path, not a chord.
function curveSeg(d: string, width: number): string {
  return `<path d="${d}" fill="none" stroke="${T.line}" stroke-width="${width}" ` +
    `stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
}

type Pt = readonly [number, number];
const pt = (p: Pt): string => `${round(p[0])} ${round(p[1])}`;

// ── the assembled view ────────────────────────────────────────────────────────

// One full skirt panel silhouette (front or back), centred on x = 0, waist at y = 0.
// Full panel = two drafted quarters, so the half-width is (girth + ease) / 4.
function skirtPanelPath(waistHalf: number, hipHalf: number, len: number, hipDrop: number): string {
  return [
    `M ${round(-waistHalf)} 0`,
    `L ${round(waistHalf)} 0`,          // waist
    `L ${round(hipHalf)} ${round(hipDrop)}`, // taper out to the hip
    `L ${round(hipHalf)} ${round(len)}`,      // straight to the hem
    `L ${round(-hipHalf)} ${round(len)}`,     // hem
    `L ${round(-hipHalf)} ${round(hipDrop)}`, // back up the other side
    "Z",
  ].join(" ");
}

function renderPanel(waistHalf: number, hipHalf: number, len: number, hipDrop: number, fabric: string,
                     cx: number, top: number, label: string): string {
  const path = `<path d="${skirtPanelPath(waistHalf, hipHalf, len, hipDrop)}" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const band = line(-waistHalf, 4, waistHalf, 4, T.marker, 0.6); // a hint of the waistband
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${band}</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" ${FONT} text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** The assembled skirt: front and back panels side by side, in fabric colour. */
export function renderSkirtGarment(m: Measurements, fabric: string): string {
  const { waistHalf, hipHalf } = skirtWidths(m);
  const len = m.length;
  const hipDrop = m.hipDepth;

  const halfW = hipHalf; // the widest half of one panel
  const margin = 6;
  const top = 10;
  const gap = 12;
  const frontCx = margin + halfW;
  const backCx = frontCx + 2 * halfW + gap;
  const width = backCx + halfW + margin;
  const height = top + len + margin;

  return `<svg viewBox="0 0 ${round(width)} ${round(height)}" width="100%" ` +
    `xmlns="http://www.w3.org/2000/svg" style="background:${T.background};border-radius:8px">` +
    `<rect x="0" y="0" width="${round(width)}" height="${round(height)}" fill="${T.background}"/>` +
    renderPanel(waistHalf, hipHalf, len, hipDrop, fabric, frontCx, top, "FRONT") +
    renderPanel(waistHalf, hipHalf, len, hipDrop, fabric, backCx, top, "BACK") +
    `</svg>`;
}

// ── the annotated body view ───────────────────────────────────────────────────

// A silhouette is walked as a CHAIN of cubic segments, not emitted as a fixed
// string. That matters: the left leg is the same chain walked BACKWARDS, so the
// outline runs waist → right hip → right leg → crotch → left leg → LEFT HIP →
// waist. Emitting the left leg forwards (the obvious way) skips the left hip
// entirely and closes the path straight back to the waist — a malformed figure
// that every "is it the right width / the right height" test still passes.
// The shared lower-body figure geometry lives in render/croquis.ts. This module
// retains the skirt-specific cloth overlay and annotated presentation around it.

/** The skirt itself: cloth sitting just outside the body, waist → hip → hem.
 *  Straight from hip to hem, because that is what the draft actually does — no
 *  A-line flare is invented here. */
function clothPath(f: LowerCroquisAnchors, out: number): string {
  const cw = f.waistHalf + out;
  const ch = f.hipHalf + out * 1.5;
  return [
    `M ${pt([-cw, 0])}`,
    `L ${pt([cw, 0])}`,
    lowerCroquisFlareCommand(cw, ch, f.hipY, 1),
    `L ${pt([ch, f.length])}`,
    `L ${pt([-ch, f.length])}`,
    `L ${pt([-ch, f.hipY])}`,
    lowerCroquisFlareCommand(cw, ch, f.hipY, -1, true),
    "Z",
  ].join(" ");
}

/** The skirt body view: an annotated lower-body figure, measurement-honest. */
export function renderSkirtBody(m: Measurements): string {
  const croquis = lowerCroquisFigure(m);
  const f = croquis.anchors;
  const CLOTH_OUT = 1.0;                          // how far the cloth stands off the body
  const clothHalf = f.hipHalf + CLOTH_OUT * 1.5;
  // The dimension gutters must clear the widest thing DRAWN. Normally that is the
  // cloth at the hip, but a waist wider than the hip is a reachable (and warned)
  // state, and then the cloth at the WAIST is widest — the figure would otherwise
  // run straight through its own dimension lines.
  const widest = Math.max(clothHalf, f.waistHalf + CLOTH_OUT);

  const bodyPath = `<path data-part="silhouette" d="${croquis.silhouettePath}" fill="${T.fill}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const cloth = `<path data-part="cloth" d="${clothPath(f, CLOTH_OUT)}" fill="${T.cloth}" ` +
    `stroke="${T.line}" stroke-width="1.2" stroke-linejoin="round" stroke-opacity="0.75" ` +
    `vector-effect="non-scaling-stroke"/>`;

  // Dimension lines for the raw inputs (ease has none — it isn't a body measurement).
  const rightDimX = widest + 6;
  const leftDimX = -(widest + 6);
  const dim = (field: string, s: string): string => `<g data-dim="${field}">${s}</g>`;
  const dims =
    dim("waist", dimH(-f.waistHalf, f.waistHalf, -6, `Waist ${m.waist} (circ)`)) +
    // The hip dim sits just ABOVE the hip line, offset so it never doubles the
    // hipDepth edge. It cannot collide with the waist dim (fixed at y = -6, and
    // hipDepth is never below 10), and below the line it would land on the crotch
    // whenever hipDepth is shallow.
    dim("hip", dimH(-f.hipHalf, f.hipHalf, f.hipY - 2.5, `Hip ${m.hip} (circ)`)) +
    dim("hipDepth", dimV(leftDimX, 0, f.hipY, `Hip depth ${m.hipDepth}`, -1)) +
    dim("length", dimV(rightDimX, 0, f.length, `Length ${m.length}`, 1));

  // measurement → the outline segments it shapes (no overlap, so a hover is
  // unambiguous):  waist → the waist edge,  hip → the two flare seams,
  // hipDepth → the hip line,  length → the hem.
  const edge = (field: string, s: string): string => `<g data-edge="${field}">${s}</g>`;
  const flareOverlay = (sx: 1 | -1): string => {
    return curveSeg(`M ${pt([sx * f.waistHalf, 0])} ${lowerCroquisFlareCommand(
      f.waistHalf, f.hipHalf, f.hipY, sx)}`, 1.4);
  };
  const edges =
    edge("waist", seg(-f.waistHalf, 0, f.waistHalf, 0, 1.4)) +
    edge("hip", flareOverlay(1) + flareOverlay(-1)) +
    edge("hipDepth", seg(-f.hipHalf, f.hipY, f.hipHalf, f.hipY, 1.4)) +
    edge("length", seg(-clothHalf, f.length, clothHalf, f.length, 1.4));

  const minX = leftDimX - 26;
  const maxX = rightDimX + 26;
  const minY = -13;
  const maxY = f.ankleY + 8;
  const width = maxX - minX;
  const height = maxY - minY;

  return `<svg viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" ` +
    `width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" ` +
    `fill="${T.background}"/>` +
    // The body + cloth are tagged "figure" — never a measurement name — so they
    // always fall to the dimmed state when a row is active, letting the tagged
    // edge read as the highlight.
    `<g data-edge="figure">${bodyPath}${cloth}</g>` +
    edges + dims +
    `</svg>`;
}
