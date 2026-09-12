// The body view: a schematic front-facing upper-body figure drawn from the
// measurements, with each RAW input marked on the body as a dimension line — so a
// designer can see what every number means on a body before drafting.
//
// Honesty is the whole point (this tool measures, it doesn't invent):
//   • A plain upper-body figure only bends where its garment has a measured
//     number. Garments with lower shaping (the woven shirt) pass those real
//     waist/hip coordinates explicitly; no figure invents a curve.
//   • Girth inputs (chest, bicep) are marked "(circ)"; the drawn span is a body
//     width, not the circumference, and the label says so.
//   • The head and neck are a faint, fixed-proportion placeholder for orientation
//     only — height and head size aren't measured, so they carry no data.
//
// Pure: measurements in, one SVG string out. A sibling to render/garment.ts.

import { Measurements, derive, necklineEdge, NecklineParams, NECKLINE_DEFAULT } from "../drafting";
import { BLUEPRINT as T } from "./theme";
import { armholePathCommand, necklinePathCommand } from "./neckline-path";
import { poloDetailsSvg } from "./polo-details";
import { upperCroquisFigure, UpperCroquisLowerShape } from "./croquis";

export interface PoloBodyVisual {
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
}

/** Optional recipe-owned neckline geometry for a body preview whose neck is
 * independent from the generic upper-body derivation. */
export interface BodyNecklineVisual {
  readonly widthHalf: number;
  readonly frontDepth: number;
  readonly backDepth: number;
}

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

// One outline segment, drawn in the silhouette's own colour and weight so the
// overlay sits invisibly on top of the figure until the UI lifts or fades it.
function seg(x1: number, y1: number, x2: number, y2: number, width: number): string {
  return `<line x1="${round(x1)}" y1="${round(y1)}" x2="${round(x2)}" y2="${round(y2)}" ` +
    `stroke="${T.line}" stroke-width="${width}" stroke-linecap="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
}

/** The body view: an annotated upper-body figure, measurement-honest.
 *  `hasSleeve` (Slice 60): a sleeveless garment (a tank) passes `false` — no
 *  arm quad, no Sleeve/Bicep dimension lines or edges, since neither
 *  measurement drives that garment (the figure would otherwise show a
 *  dimension for a field the garment's own `fields` array doesn't expose).
 *  `frontNeckline` (Slice 61): the garment's REAL declared neckline shape
 *  (`recipe.frontNeckline`) — defaults to crew, matching what an unspecified
 *  garment actually drafts. Fixes two bugs found comparing this view against
 *  the real pattern at identical measurements (see PROJECT-STATE.md, "Tank
 *  rework"): the torso used its own ungrounded `chest * 0.22` body-width
 *  guess instead of `derive()`'s real `chestWidthHalf`, and the collar was a
 *  fixed decorative curve that never reflected crew vs. v vs. scoop.
 *  `strapWidth` (Slice 66): a sleeveless garment's finished strap span from
 *  neckline edge to armhole start; the renderer derives its real x position.
 *  Undefined (the default) keeps the sleeved shoulder
 *  point, `d.shoulderHalf`, byte-identical to every render before this
 *  slice. Passing it moves the torso's shoulder corner in to the real strap
 *  point instead of silently drawing a full sleeveless-tee shoulder for a
 *  tank — the same "the view must match the real pattern" gap Slice 61
 *  closed for the neckline, found here for the strap. */
export function renderBody(
  m: Measurements, hasSleeve = true, frontNeckline: NecklineParams = NECKLINE_DEFAULT,
  strapWidth?: number, position: "front" | "back" = "front", polo?: PoloBodyVisual,
  necklineVisual?: BodyNecklineVisual, lowerShape?: UpperCroquisLowerShape
): string {
  const d = derive(m);

  // The real front collar geometry — the same necklineEdge() the actual
  // bodice draft calls, so this view can't silently diverge from it again.
  const { cNeck, hps, edge: neckEdge } =
    necklineEdge(position, necklineVisual?.widthHalf ?? d.neckWidthHalf,
      necklineVisual
        ? (position === "front" ? necklineVisual.frontDepth : necklineVisual.backDepth)
        : (position === "front" ? d.frontNeckDepth : d.backNeckDepth),
      d.shoulderHalf, m.armholeDepth, frontNeckline);
  const croquis = upperCroquisFigure(m, position, {
    hasSleeve, strapWidth, neckline: { cNeck, hps, edge: neckEdge }, lowerShape,
  });
  const { bodyHalf, shoulderHalf, neckHalf, strapX, slope, armholeDepth: ad, length: len,
    headR, headCy, headTop, neckLen, rightDimX, leftDimX, a1, a2, a3, bOut, bIn } = croquis.anchors;
  const tankArmhole = croquis.armhole;
  const torsoPath = `<path d="${croquis.torsoPath}" fill="${T.fill}" stroke="${T.line}" ` +
    `stroke-width="1.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;

  // Faint head + neck: orientation only, carries no measurement.
  const head =
    `<circle cx="0" cy="${round(headCy)}" r="${round(headR)}" fill="none" ` +
    `stroke="${T.marker}" stroke-width="0.8" stroke-opacity="0.5" vector-effect="non-scaling-stroke"/>` +
    line(neckHalf, 0, neckHalf * 0.7, -neckLen, T.marker, 0.5) +
    line(-neckHalf, 0, -neckHalf * 0.7, -neckLen, T.marker, 0.5);

  // Dimension lines for the raw inputs. The right/left margins only need to
  // clear the arm's reach when there IS an arm to draw.
  // Each dimension is wrapped in a group tagged with the measurement FIELD it
  // reads, so the UI can highlight "the chest line" when the chest slider is
  // focused. `ease` has no body dimension — it isn't a body measurement.
  const dim = (field: string, body: string): string => `<g data-dim="${field}">${body}</g>`;
  const armholeHighlight = (sx: number): string => {
    const edge = tankArmhole as Extract<NonNullable<typeof tankArmhole>, { kind: "curve" }>;
    const c = edge.curve;
    const d = sx === 1
      ? `M ${round(c.start.x)} ${round(c.start.y)} ${armholePathCommand(edge)}`
      : `M ${round(-c.end.x)} ${round(c.end.y)} ${armholePathCommand(edge, true)}`;
    return `<path d="${d}" fill="none" stroke="${T.line}" stroke-width="1.4" ` +
      `stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  };
  const dims =
    dim("shoulderWidth", dimH(-shoulderHalf, shoulderHalf, headTop - 3, `Shoulder ${m.shoulderWidth}`)) +
    (necklineVisual ? dim("neck", dimH(-neckHalf, neckHalf, -4, `Neck ${m.neck} (circ)`)) : "") +
    dim("chest", dimH(-bodyHalf, bodyHalf, ad + (len - ad) * 0.22, `Chest ${m.chest} (circ)`)) +
    (lowerShape ? dim("waist", dimH(-lowerShape.waistHalf, lowerShape.waistHalf, lowerShape.waistY, `Waist ${m.waist} (circ)`)) : "") +
    (lowerShape ? dim("hip", dimH(-lowerShape.hipHalf, lowerShape.hipHalf, lowerShape.hipY - 2.5, `Hip ${m.hip} (circ)`)) : "") +
    (lowerShape ? dim("hipDepth", dimV(leftDimX, 0, lowerShape.hipY, `Hip depth ${m.hipDepth}`, "left")) : "") +
    dim("length", dimV(rightDimX, 0, len, `Length ${m.length}`, "right")) +
    dim("armholeDepth", dimV(leftDimX, 0, ad, `Armhole depth ${m.armholeDepth}`, "left")) +
    (hasSleeve ? dim("sleeveLength",
      line(a1.x, a1.y, (a2.x + a3.x) / 2, (a2.y + a3.y) / 2, T.marker) +
      txt((a2.x + a3.x) / 2 + 2, (a2.y + a3.y) / 2, `Sleeve ${m.sleeveLength}`, "start")) : "") +
    (hasSleeve ? dim("bicep",
      line(bIn.x, bIn.y, bOut.x, bOut.y, T.marker) +
      txt(bOut.x + 2, bOut.y - 1, `Bicep ${m.bicep} (circ)`, "start")) : "") +
    (!hasSleeve ? dim("strapWidth",
      dimH(neckHalf, strapX, slope - 3, `Strap width ${m.strapWidth}`)) : "") +
    (!hasSleeve && position === "front" ? dim("neckDrop",
      dimV(-neckHalf - 5, 0, cNeck.y, `Neck depth ${m.neckDrop}`, "left")) : "") +
    (!hasSleeve ? dim("neckWidthEase",
      dimH(-neckHalf, neckHalf, -4, `Neck width Δ ${m.neckWidthEase}`)) : "");

  // The measurement→EDGES map, the sibling of the measurement→dimension-line map
  // above: the dimension line says what a number IS, these say what it SHAPES.
  // Each measurement owns exactly the outline segments it positions, so the sets
  // don't overlap and a hover has one unambiguous answer:
  //   shoulderWidth → the shoulder slopes      armholeDepth → the underarm diagonals
  //   chest         → the upper side seam       length       → the hem
  //   sleeveLength  → the arm outer edges      bicep        → the cuff edges
  // For a lower-shaped woven shirt, the three real side-seam spans are split
  // across chest/waist/hip and hipDepth also carries the hip cross-reference.
  // Drawn on top of the silhouette, so lifting one to full opacity while the
  // figure fades reads as "this edge is what that number moves". Slice 63: for
  // a sleeveless garment these two use `strapX`, not `shoulderHalf` — the
  // real outline corner moved to the strap, and an edge overlay that floated
  // past the actual drawn silhouette (out to the old, wider shoulder point)
  // would be exactly the kind of "reads correct, isn't" gap this project has
  // already found twice. `shoulderWidth`'s own DIMENSION line (the labelled
  // arrow above the head) is unaffected — the person's real shoulder width
  // hasn't changed, only which edge of the outline it highlights.
  const edge = (field: string, body: string): string => `<g data-edge="${field}">${body}</g>`;
  const neckHighlight = (): string => `<path d="M ${round(-hps.x)} 0 ${necklinePathCommand(cNeck, hps, neckEdge)}" ` +
    `fill="none" stroke="${T.line}" stroke-width="1.4" stroke-linecap="round" ` +
    `vector-effect="non-scaling-stroke"/>`;
  const bothArms = (fn: (sx: number) => string): string => fn(1) + fn(-1);
  const lowerEdges = lowerShape
    ? edge("chest", bothArms((sx) => seg(sx * bodyHalf, ad, sx * lowerShape.waistHalf, lowerShape.waistY, 1.4))) +
      edge("waist", bothArms((sx) => seg(sx * lowerShape.waistHalf, lowerShape.waistY, sx * lowerShape.hipHalf, lowerShape.hipY, 1.4))) +
      edge("hip", bothArms((sx) => seg(sx * lowerShape.hipHalf, lowerShape.hipY, sx * lowerShape.hipHalf, len, 1.4))) +
      edge("hipDepth", seg(-lowerShape.hipHalf, lowerShape.hipY, lowerShape.hipHalf, lowerShape.hipY, 1.4) +
        bothArms((sx) => seg(sx * lowerShape.waistHalf, lowerShape.waistY, sx * lowerShape.hipHalf, lowerShape.hipY, 1.4)))
    : edge("chest", bothArms((sx) => seg(sx * bodyHalf, ad, sx * bodyHalf, len, 1.4)));
  const hemHalf = lowerShape?.hipHalf ?? bodyHalf;
  const edges =
    edge("shoulderWidth", bothArms((sx) => seg(sx * neckHalf, 0, sx * strapX, slope, 1.4))) +
    edge("armholeDepth", tankArmhole
      ? armholeHighlight(1) + armholeHighlight(-1)
      : bothArms((sx) => seg(sx * strapX, slope, sx * bodyHalf, ad, 1.4))) +
    lowerEdges +
    edge("length", seg(-hemHalf, len, hemHalf, len, 1.4)) +
    (!hasSleeve ? edge("strapWidth", bothArms((sx) => seg(sx * neckHalf, 0, sx * strapX, slope, 1.4))) : "") +
    (!hasSleeve && position === "front" ? edge("neckDrop", neckHighlight()) : "") +
    (!hasSleeve ? edge("neckWidthEase", neckHighlight()) : "") +
    (necklineVisual ? edge("neck", neckHighlight()) : "") +
    (hasSleeve ? edge("sleeveLength", bothArms((sx) => seg(sx * a1.x, a1.y, sx * a2.x, a2.y, 1.2))) : "") +
    (hasSleeve ? edge("bicep", bothArms((sx) => seg(sx * a2.x, a2.y, sx * a3.x, a3.y, 1.2))) : "");

  const minX = leftDimX - 22;
  const maxX = rightDimX + 26;
  const minY = headTop - 8;
  const maxY = len + 8;
  const width = maxX - minX;
  const height = maxY - minY;

  const arms = croquis.armPaths.map((path) =>
    `<path d="${path}" fill="${T.fill}" stroke="${T.line}" stroke-width="1.2" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke"/>`).join("");
  const poloDetails = position === "front" && polo ? poloDetailsSvg({
    neckWidthHalf: d.neckWidthHalf, frontNeckDepth: d.frontNeckDepth,
    shoulderHalf, armholeDepth: ad, neckline: frontNeckline, ...polo,
  }).split("currentColor").join(T.line) : "";

  return `<svg viewBox="${round(minX)} ${round(minY)} ${round(width)} ${round(height)}" ` +
    `width="100%" xmlns="http://www.w3.org/2000/svg" ` +
    `style="background:${T.background};border-radius:8px">` +
    `<rect x="${round(minX)}" y="${round(minY)}" width="${round(width)}" height="${round(height)}" ` +
    `fill="${T.background}"/>` +
    // The silhouette is tagged "figure" — never a measurement name, so it always
    // falls to the dimmed state whenever a row is active, letting the tagged edge
    // on top read as the highlight. No special case needed in the UI.
    `<g data-edge="figure">${head + arms + torsoPath}</g>` + poloDetails +
    edges + dims +
    `</svg>`;
}

/** Front and back schematic figures, sharing the same measurement spotlight map. */
export function renderBodyPair(
  m: Measurements, hasSleeve = true,
  frontNeckline: NecklineParams = NECKLINE_DEFAULT,
  backNeckline: NecklineParams = NECKLINE_DEFAULT,
  strapWidth?: number, polo?: PoloBodyVisual, necklineVisual?: BodyNecklineVisual,
  lowerShape?: UpperCroquisLowerShape
): string {
  return `<div style="display:flex;gap:8px;width:100%">` +
    `<div style="flex:1;min-width:0"><div style="font-size:11px;color:${T.label};text-transform:uppercase;text-align:center;margin-bottom:4px">Front</div>` +
    renderBody(m, hasSleeve, frontNeckline, strapWidth, "front", polo, necklineVisual, lowerShape) + `</div>` +
    `<div style="flex:1;min-width:0"><div style="font-size:11px;color:${T.label};text-transform:uppercase;text-align:center;margin-bottom:4px">Back</div>` +
    renderBody(m, hasSleeve, backNeckline, strapWidth, "back", polo, necklineVisual, lowerShape) + `</div></div>`;
}
