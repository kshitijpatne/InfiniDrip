// The skirt's two figures, the lower-body siblings of render/garment.ts and
// render/body.ts:
//   • renderSkirtGarment — the assembled front/back panels, in fabric colour.
//   • renderSkirtBody     — an annotated lower-body figure with a dimension line
//                           for each raw input (waist, hip, length).
//
// Honesty (same rule as the tee body view): the figure only bends where we have a
// number. A skirt DOES measure the waist and hip, so unlike the tee the sides taper
// from waist to hip — that curve is earned. `ease` has no body dimension. Girths
// (waist, hip) are marked "(circ)": the drawn span is a body width, not the
// circumference, and the label says so. A faint head/torso stub above the waist is
// orientation only and carries no data.
//
// Pure: measurements in, one SVG string out.

import { Measurements } from "../drafting";
import { BLUEPRINT as T } from "./theme";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const FONT = 'font-family="system-ui, sans-serif"';
const HIP_DROP = 20; // waist line down to the fullest hip (matches the draft)

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
// A vertical dimension line with end caps and a label on the right.
function dimV(x: number, ya: number, yb: number, label: string): string {
  return line(x, ya, x, yb, T.marker) +
    line(x - 1.2, ya, x + 1.2, ya, T.marker) +
    line(x - 1.2, yb, x + 1.2, yb, T.marker) +
    txt(x + 1.8, (ya + yb) / 2, label, "start");
}
function seg(x1: number, y1: number, x2: number, y2: number, width: number): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="${T.line}" stroke-width="${width}" stroke-linecap="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
}

// ── the assembled view ────────────────────────────────────────────────────────

// One full skirt panel silhouette (front or back), centred on x = 0, waist at y = 0.
// Full panel = two drafted quarters, so the half-width is (girth + ease) / 4.
function skirtPanelPath(waistHalf: number, hipHalf: number, len: number): string {
  return [
    `M ${round(-waistHalf)} 0`,
    `L ${round(waistHalf)} 0`,          // waist
    `L ${round(hipHalf)} ${round(HIP_DROP)}`, // taper out to the hip
    `L ${round(hipHalf)} ${round(len)}`,      // straight to the hem
    `L ${round(-hipHalf)} ${round(len)}`,     // hem
    `L ${round(-hipHalf)} ${round(HIP_DROP)}`, // back up the other side
    "Z",
  ].join(" ");
}

function renderPanel(waistHalf: number, hipHalf: number, len: number, fabric: string,
                     cx: number, top: number, label: string): string {
  const path = `<path d="${skirtPanelPath(waistHalf, hipHalf, len)}" fill="${fabric}" ` +
    `stroke="${T.line}" stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  const band = line(-waistHalf, 4, waistHalf, 4, T.marker, 0.6); // a hint of the waistband
  const group = `<g transform="translate(${round(cx)} ${round(top)})">${path}${band}</g>`;
  const tag = `<text x="${round(cx)}" y="${round(top - 3)}" fill="${T.label}" ` +
    `font-size="2.6" ${FONT} text-anchor="middle">${label}</text>`;
  return group + tag;
}

/** The assembled skirt: front and back panels side by side, in fabric colour. */
export function renderSkirtGarment(m: Measurements, fabric: string): string {
  const waistHalf = (m.waist + m.ease) / 4;
  const hipHalf = (m.hip + m.ease) / 4;
  const len = m.length;

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
    renderPanel(waistHalf, hipHalf, len, fabric, frontCx, top, "FRONT") +
    renderPanel(waistHalf, hipHalf, len, fabric, backCx, top, "BACK") +
    `</svg>`;
}

// ── the annotated body view ───────────────────────────────────────────────────

/** The skirt body view: an annotated lower-body figure, measurement-honest. */
export function renderSkirtBody(m: Measurements): string {
  const waistHalf = m.waist * 0.20; // a body width from the girth; labelled "(circ)"
  const hipHalf = m.hip * 0.22;     // wider than the waist
  const len = m.length;

  // Faint upper-body + head stub above the waist: orientation only, no data.
  const stubTop = -22;
  const headR = 7;
  const headCy = stubTop - headR;
  const stub =
    `<circle cx="0" cy="${round(headCy)}" r="${round(headR)}" fill="none" ` +
    `stroke="${T.marker}" stroke-width="0.8" stroke-opacity="0.45" vector-effect="non-scaling-stroke"/>` +
    line(-waistHalf * 0.75, stubTop, -waistHalf, 0, T.marker, 0.45) +
    line(waistHalf * 0.75, stubTop, waistHalf, 0, T.marker, 0.45) +
    line(-waistHalf * 0.75, stubTop, waistHalf * 0.75, stubTop, T.marker, 0.45);

  // The measured lower body: waist → hip (a real taper) → straight to the hem.
  const body = [
    `M ${round(-waistHalf)} 0`,
    `L ${round(waistHalf)} 0`,
    `L ${round(hipHalf)} ${round(HIP_DROP)}`,
    `L ${round(hipHalf)} ${round(len)}`,
    `L ${round(-hipHalf)} ${round(len)}`,
    `L ${round(-hipHalf)} ${round(HIP_DROP)}`,
    "Z",
  ].join(" ");
  const bodyPath = `<path d="${body}" fill="${T.fill}" stroke="${T.line}" ` +
    `stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;

  // Dimension lines for the raw inputs (ease has none — it isn't a body measurement).
  const rightDimX = hipHalf + 6;
  const dim = (field: string, s: string): string => `<g data-dim="${field}">${s}</g>`;
  const dims =
    dim("waist", dimH(-waistHalf, waistHalf, headCy - headR - 3, `Waist ${m.waist} (circ)`)) +
    dim("hip", dimH(-hipHalf, hipHalf, HIP_DROP + (len - HIP_DROP) * 0.30, `Hip ${m.hip} (circ)`)) +
    dim("length", dimV(rightDimX, 0, len, `Length ${m.length}`));

  // measurement → the outline segments it shapes (no overlap, so a hover is
  // unambiguous):  waist → the waist edge,  hip → the two side seams,
  // length → the hem.
  const edge = (field: string, s: string): string => `<g data-edge="${field}">${s}</g>`;
  const both = (fn: (sx: number) => string): string => fn(1) + fn(-1);
  const edges =
    edge("waist", seg(-waistHalf, 0, waistHalf, 0, 1.4)) +
    edge("hip", both((sx) =>
      seg(sx * waistHalf, 0, sx * hipHalf, HIP_DROP, 1.4) + seg(sx * hipHalf, HIP_DROP, sx * hipHalf, len, 1.4))) +
    edge("length", seg(-hipHalf, len, hipHalf, len, 1.4));

  const minX = -(hipHalf + 26);
  const maxX = rightDimX + 30;
  const minY = headCy - headR - 8;
  const maxY = len + 8;
  const width = maxX - minX;
  const height = maxY - minY;

  return `<svg viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" ` +
    `width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" ` +
    `fill="${T.background}"/>` +
    // The silhouette is tagged "figure" — never a measurement name — so it always
    // falls to the dimmed state when a row is active, letting the tagged edge read
    // as the highlight.
    `<g data-edge="figure">${stub + bodyPath}</g>` +
    edges + dims +
    `</svg>`;
}
