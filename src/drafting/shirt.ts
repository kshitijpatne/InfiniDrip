import { point } from "../geometry";
import { Block, block } from "./block";
import { Measurements } from "./measurements";
import { Piece, Edge } from "./piece";
import { edgeRef, iface, Stitch } from "./stitch";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { WovenShirtOptions, resolveWovenShirtOptions } from "./shirt-contract";

/** The relaxed woven body is drafted as a half-width back on fold and a
 * separate half-width front. Fronts are cut as a mirrored pair later; keeping
 * centre front as a real edge gives the placket a named attachment boundary. */
function shirtPanel(m: Measurements, position: "front" | "back", options: WovenShirtOptions): Piece {
  const chestHalf = (m.chest + m.ease) / 4;
  const waistHalf = (m.waist + m.ease) / 4;
  const hipHalf = (m.hip + m.ease) / 4;
  const shoulderHalf = m.shoulderWidth / 2;
  const neckHalf = (m.neck + options.neckEase) / 4;
  const baseDepth = position === "front" ? neckHalf * 0.8 : neckHalf * 0.3;
  const neckline = necklineEdge(
    position, neckHalf, baseDepth, shoulderHalf, m.armholeDepth, NECKLINE_DEFAULT
  );
  const shoulder = point(shoulderHalf, 2.5);
  const underarm = point(chestHalf, m.armholeDepth);
  const waist = point(waistHalf, m.armholeDepth + (m.length - m.armholeDepth) * 0.35);
  const hip = point(hipHalf, waist.y + m.hipDepth);
  const sideHem = point(hipHalf, m.length);
  const cHem = point(0, m.length);
  const armhole: Edge = {
    kind: "curve", name: "armhole", curve: {
      start: shoulder,
      control1: point(shoulderHalf, 2.5 + (m.armholeDepth - 2.5) * 0.45),
      control2: point(chestHalf - 2, m.armholeDepth - 3),
      end: underarm,
    },
  };
  return {
    name: position === "front" ? "woven front" : "woven back",
    onFold: position === "back",
    edges: [
      neckline.edge,
      { kind: "line", name: "shoulder", start: neckline.hps, end: shoulder },
      armhole,
      { kind: "line", name: "sideUpper", start: underarm, end: waist },
      { kind: "line", name: "sideMiddle", start: waist, end: hip },
      { kind: "line", name: "sideLower", start: hip, end: sideHem },
      { kind: "line", name: "hem", start: sideHem, end: cHem },
      { kind: "line", name: position === "front" ? "centerFront" : "centerBack", start: cHem, end: neckline.cNeck },
    ],
  };
}

export const WOVEN_SHIRT_BODY_STITCHES: readonly Stitch[] = [
  {
    label: "Shoulder seam (front ↔ back)",
    a: iface(edgeRef("front", "shoulder")),
    b: iface(edgeRef("back", "shoulder")),
  },
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideMiddle"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideMiddle"), edgeRef("back", "sideLower")),
  },
];

/** Slice 87's woven-only body component. It deliberately does not reuse
 * `bodice()`: neck circumference, front closure edge, and lower shaping have
 * different semantics from the knit tee block. */
export function draftWovenShirtBody(
  m: Measurements, rawOptions: Partial<WovenShirtOptions> = {}
): Block {
  const options = resolveWovenShirtOptions(rawOptions);
  return block({
    front: shirtPanel(m, "front", options),
    back: shirtPanel(m, "back", options),
  }, WOVEN_SHIRT_BODY_STITCHES);
}
