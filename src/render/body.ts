// The body view: a schematic front-facing upper-body figure drawn from the
// measurements, with each RAW input marked on the body as a dimension line — so a
// designer can see what every number means on a body before drafting.
//
// Honesty is the whole point (this tool measures, it doesn't invent):
//   • The figure only bends where we have a number. There is no waist or hip in
//     the measurement set, so the torso sides run straight — we don't draw a curve
//     we didn't measure.
//   • Girth inputs (chest, bicep) are marked "(circ)"; the drawn span is a body
//     width, not the circumference, and the label says so.
//   • The head and neck are a faint, fixed-proportion placeholder for orientation
//     only — height and head size aren't measured, so they carry no data.
//
// Pure: measurements in, one SVG string out. A sibling to render/garment.ts.

import { Measurements } from "../drafting";
import { BLUEPRINT as T } from "./theme";

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

// A horizontal dimension line with end caps and a centred label above it.
function dimH(xa: number, xb: number, y: number, label: string): string {
  return line(xa, y, xb, y, T.marker) +
    line(xa, y - 1.2, xa, y + 1.2, T.marker) +
    line(xb, y - 1.2, xb, y + 1.2, T.marker) +
    txt((xa + xb) / 2, y - 1.8, label);
}

// A vertical dimension line with end caps and a label to one side.
function dimV(x: number, ya: number, yb: number, label: string, side: "left" | "right"): string {
  const lx = side === "right" ? x + 1.8 : x - 1.8;
  const anchor = side === "right" ? "start" : "end";
  return line(x, ya, x, yb, T.marker) +
    line(x - 1.2, ya, x + 1.2, ya, T.marker) +
    line(x - 1.2, yb, x + 1.2, yb, T.marker) +
    txt(lx, (ya + yb) / 2, label, anchor);
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** The body view: an annotated upper-body figure, measurement-honest. */
export function renderBody(m: Measurements): string {
  const shoulderHalf = m.shoulderWidth / 2;
  const bodyHalf = m.chest * 0.22; // a body width driven by chest; girth is labelled "(circ)"
  const ad = m.armholeDepth;
  const len = m.length;
  const slope = m.shoulderWidth * 0.07; // a gentle shoulder fall (schematic)

  const headR = m.shoulderWidth * 0.17;
  const neckHalf = m.shoulderWidth * 0.11;
  const neckLen = m.shoulderWidth * 0.08;
  const headCy = -(neckLen + headR);
  const headTop = headCy - headR;

  // arm limb geometry (depicts the sleeve reach — a measured value — not full arm)
  const dx = m.sleeveLength * 0.55;
  const dy = m.sleeveLength * 0.92;
  const w = m.bicep * 0.28;

  // Right-arm quad: shoulder tip → outer cuff → inner cuff → armpit.
  const a1 = { x: shoulderHalf, y: slope };
  const a2 = { x: shoulderHalf + dx + w * 0.5, y: slope + dy };
  const a3 = { x: shoulderHalf + dx - w * 0.5, y: slope + dy + w };
  const a4 = { x: bodyHalf, y: ad };
  const armPath = (sx: number): string =>
    `<path d="M ${round(sx * a1.x)} ${round(a1.y)} L ${round(sx * a2.x)} ${round(a2.y)} ` +
    `L ${round(sx * a3.x)} ${round(a3.y)} L ${round(sx * a4.x)} ${round(a4.y)} Z" ` +
    `fill="${T.fill}" stroke="${T.line}" stroke-width="1.2" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`;

  // Torso outline (straight sides — no waist taper, because none is measured).
  const torso = [
    `M ${round(neckHalf)} 0`,
    `L ${round(shoulderHalf)} ${round(slope)}`,
    `L ${round(bodyHalf)} ${round(ad)}`,
    `L ${round(bodyHalf)} ${round(len)}`,
    `L ${round(-bodyHalf)} ${round(len)}`,
    `L ${round(-bodyHalf)} ${round(ad)}`,
    `L ${round(-shoulderHalf)} ${round(slope)}`,
    `L ${round(-neckHalf)} 0`,
    `Q 0 ${round(neckHalf * 0.6)} ${round(neckHalf)} 0`,
    "Z",
  ].join(" ");
  const torsoPath = `<path d="${torso}" fill="${T.fill}" stroke="${T.line}" ` +
    `stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;

  // Faint head + neck: orientation only, carries no measurement.
  const head =
    `<circle cx="0" cy="${round(headCy)}" r="${round(headR)}" fill="none" ` +
    `stroke="${T.marker}" stroke-width="0.8" stroke-opacity="0.5" vector-effect="non-scaling-stroke"/>` +
    line(neckHalf, 0, neckHalf * 0.7, -neckLen, T.marker, 0.5) +
    line(-neckHalf, 0, -neckHalf * 0.7, -neckLen, T.marker, 0.5);

  // Dimension lines for the raw inputs.
  const armMaxX = shoulderHalf + dx + w * 0.5;
  const rightDimX = armMaxX + 6;
  const leftDimX = -(armMaxX + 6);
  const bOut = { x: lerp(a1.x, a2.x, 0.3), y: lerp(a1.y, a2.y, 0.3) };
  const bIn = { x: lerp(a4.x, a3.x, 0.3), y: lerp(a4.y, a3.y, 0.3) };

  // Each dimension is wrapped in a group tagged with the measurement FIELD it
  // reads, so the UI can highlight "the chest line" when the chest slider is
  // focused. `ease` has no body dimension — it isn't a body measurement.
  const dim = (field: string, body: string): string => `<g data-dim="${field}">${body}</g>`;
  const dims =
    dim("shoulderWidth", dimH(-shoulderHalf, shoulderHalf, headTop - 3, `Shoulder ${m.shoulderWidth}`)) +
    dim("chest", dimH(-bodyHalf, bodyHalf, ad + (len - ad) * 0.22, `Chest ${m.chest} (circ)`)) +
    dim("length", dimV(rightDimX, 0, len, `Length ${m.length}`, "right")) +
    dim("armholeDepth", dimV(leftDimX, 0, ad, `Armhole depth ${m.armholeDepth}`, "left")) +
    dim("sleeveLength",
      line(a1.x, a1.y, (a2.x + a3.x) / 2, (a2.y + a3.y) / 2, T.marker) +
      txt((a2.x + a3.x) / 2 + 2, (a2.y + a3.y) / 2, `Sleeve ${m.sleeveLength}`, "start")) +
    dim("bicep",
      line(bIn.x, bIn.y, bOut.x, bOut.y, T.marker) +
      txt(bOut.x + 2, bOut.y - 1, `Bicep ${m.bicep} (circ)`, "start"));

  const minX = leftDimX - 22;
  const maxX = rightDimX + 26;
  const minY = headTop - 8;
  const maxY = len + 8;
  const width = maxX - minX;
  const height = maxY - minY;

  return `<svg viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" ` +
    `width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" ` +
    `fill="${T.background}"/>` +
    head + armPath(1) + armPath(-1) + torsoPath + dims +
    `</svg>`;
}
