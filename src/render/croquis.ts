// Shared measurement-honest croquis geometry. These figures are presentation
// scaffolding only: they do not draft pattern pieces and never enter exports.
// Front, side, and back are named separately so a future view cannot silently
// substitute a front figure for a side or back representation.

import { Measurements, derive, necklineEdge, NECKLINE_DEFAULT, skirtWidths } from "../drafting";
import type { Edge } from "../drafting";
import { armholePathCommand, necklinePathCommand } from "./neckline-path";
import { sleevelessArmhole } from "../drafting/armhole";

export type CroquisRegion = "upper" | "lower";
export type CroquisView = "front" | "side" | "back";

const round = (n: number): number => Math.round(n * 1000) / 1000;

export interface UpperCroquisNeckline {
  readonly cNeck: { readonly x: number; readonly y: number };
  readonly hps: { readonly x: number; readonly y: number };
  readonly edge: Edge;
}

/** Optional garment-aware inputs for the upper-body figure. The Body renderer
 * supplies the already-resolved neckline so this library owns the path
 * assembly without re-drafting a neckline of its own. */
export interface UpperCroquisOptions {
  readonly hasSleeve?: boolean;
  readonly neckline?: UpperCroquisNeckline;
  readonly strapWidth?: number;
}

export interface UpperCroquisAnchors {
  readonly bodyHalf: number;
  readonly shoulderHalf: number;
  readonly neckHalf: number;
  readonly strapX: number;
  readonly slope: number;
  readonly armholeDepth: number;
  readonly length: number;
  readonly headR: number;
  readonly headCy: number;
  readonly headTop: number;
  readonly neckLen: number;
  readonly rightDimX: number;
  readonly leftDimX: number;
  readonly a1: { readonly x: number; readonly y: number };
  readonly a2: { readonly x: number; readonly y: number };
  readonly a3: { readonly x: number; readonly y: number };
  readonly a4: { readonly x: number; readonly y: number };
  readonly bOut: { readonly x: number; readonly y: number };
  readonly bIn: { readonly x: number; readonly y: number };
}

/** The shared upper-body render contract. The Body renderer owns presentation
 * styling and measurement annotations; this contract owns the figure paths and
 * the anchors those annotations sit on. */
export interface UpperCroquisFigure {
  readonly torsoPath: string;
  readonly armPaths: readonly string[];
  readonly armhole: Edge | null;
  readonly anchors: UpperCroquisAnchors;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function defaultUpperNeckline(
  m: Measurements, view: "front" | "back", d: ReturnType<typeof derive>
): UpperCroquisNeckline {
  const baseDepth = view === "front" ? d.frontNeckDepth : d.backNeckDepth;
  const { cNeck, hps, edge } = necklineEdge(
    view, d.neckWidthHalf, baseDepth, d.shoulderHalf, m.armholeDepth, NECKLINE_DEFAULT);
  return { cNeck, hps, edge };
}

/** Build the upper-body figure geometry consumed by the annotated Body view.
 * Front and back share the same measured envelope; their supplied neckline
 * geometry is allowed to differ. A side figure remains a separate schematic
 * path in `upperCroquisPath` until side measurements exist. */
export function upperCroquisFigure(
  m: Measurements, view: "front" | "back", options: UpperCroquisOptions = {}
): UpperCroquisFigure {
  const d = derive(m);
  const hasSleeve = options.hasSleeve ?? true;
  const half = d.chestWidthHalf;
  const shoulder = d.shoulderHalf;
  // This is the Body view's established schematic shoulder fall, not a draft
  // coordinate. Keep it in the shared croquis layer so Body does not drift
  // from the figure contract while the drafting slope stays independent.
  const slope = m.shoulderWidth * 0.07;
  const ad = m.armholeDepth;
  const len = m.length;
  const neckline = options.neckline ?? defaultUpperNeckline(m, view, d);
  const neckHalf = neckline.hps.x;
  const strapX = options.strapWidth === undefined ? shoulder : neckHalf + options.strapWidth;
  const armhole = !hasSleeve && options.strapWidth !== undefined
    // Preserve the Body view's established split: its shoulder corner uses a
    // schematic fall, while the drafted tank armhole starts from the draft's
    // shoulder slope. The path pen reaches the schematic corner first, exactly
    // as the pre-contract Body renderer did.
    ? sleevelessArmhole(strapX, neckHalf, shoulder, d.shoulderSlope, half, ad).edge
    : null;

  const headR = m.shoulderWidth * 0.17;
  const neckLen = m.shoulderWidth * 0.08;
  const headCy = -(neckLen + headR);
  const headTop = headCy - headR;

  const dx = m.sleeveLength * 0.55;
  const dy = m.sleeveLength * 0.92;
  const w = m.bicep * 0.28;
  const a1 = { x: shoulder, y: slope };
  const a2 = { x: shoulder + dx + w * 0.5, y: slope + dy };
  const a3 = { x: shoulder + dx - w * 0.5, y: slope + dy + w };
  const a4 = { x: half, y: ad };
  const bOut = { x: lerp(a1.x, a2.x, 0.3), y: lerp(a1.y, a2.y, 0.3) };
  const bIn = { x: lerp(a4.x, a3.x, 0.3), y: lerp(a4.y, a3.y, 0.3) };

  const torsoPath = [
    `M ${round(neckHalf)} 0`,
    `L ${round(strapX)} ${round(slope)}`,
    armhole ? armholePathCommand(armhole) : `L ${round(half)} ${round(ad)}`,
    `L ${round(half)} ${round(len)}`,
    `L ${round(-half)} ${round(len)}`,
    `L ${round(-half)} ${round(ad)}`,
    armhole ? armholePathCommand(armhole, true) : `L ${round(-strapX)} ${round(slope)}`,
    `L ${round(-neckHalf)} 0`,
    necklinePathCommand(neckline.cNeck, neckline.hps, neckline.edge),
    "Z",
  ].join(" ");

  const armPath = (sx: number): string =>
    `M ${round(sx * a1.x)} ${round(a1.y)} L ${round(sx * a2.x)} ${round(a2.y)} ` +
    `L ${round(sx * a3.x)} ${round(a3.y)} L ${round(sx * a4.x)} ${round(a4.y)} Z`;
  const armMaxX = shoulder + dx + w * 0.5;
  const rightDimX = (hasSleeve ? armMaxX : half) + 6;

  return {
    torsoPath,
    armPaths: hasSleeve ? [armPath(1), armPath(-1)] : [],
    armhole,
    anchors: {
      bodyHalf: half, shoulderHalf: shoulder, neckHalf, strapX, slope,
      armholeDepth: ad, length: len, headR, headCy, headTop, neckLen,
      rightDimX, leftDimX: -rightDimX, a1, a2, a3, a4, bOut, bIn,
    },
  };
}

/** A reusable upper-body croquis path. The front/back paths use the shared
 * figure contract; the side figure is deliberately schematic until a side
 * measurement set exists. */
export function upperCroquisPath(
  m: Measurements, view: CroquisView, options: UpperCroquisOptions = {}
): string {
  if (view === "side") {
    const d = derive(m);
    const half = Math.max(2, d.chestWidthHalf * 0.22);
    return `M 0 0 C ${round(half)} ${round(m.armholeDepth * 0.25)} ${round(half)} ${round(m.armholeDepth * 0.75)} ${round(half * 0.8)} ${round(m.armholeDepth)} L ${round(half * 0.8)} ${round(m.length)} L ${round(-half * 0.8)} ${round(m.length)} L ${round(-half * 0.8)} ${round(m.armholeDepth)} C ${round(-half)} ${round(m.armholeDepth * 0.75)} ${round(-half)} ${round(m.armholeDepth * 0.25)} 0 0 Z`;
  }
  const figure = upperCroquisFigure(m, view, options);
  return [figure.torsoPath, ...figure.armPaths].join(" ");
}

type LowerPt = readonly [number, number];
interface LowerCubic { readonly c1: LowerPt; readonly c2: LowerPt; readonly to: LowerPt }
interface LowerChain { readonly start: LowerPt; readonly segs: readonly LowerCubic[] }

/** The same lower-body chain traversed end-to-start. */
function reverseLowerChain(chain: LowerChain): LowerChain {
  const stops: LowerPt[] = [chain.start, ...chain.segs.map((s) => s.to)];
  const segs: LowerCubic[] = [];
  for (let i = chain.segs.length - 1; i >= 0; i--) {
    segs.push({ c1: chain.segs[i].c2, c2: chain.segs[i].c1, to: stops[i] });
  }
  return { start: stops[stops.length - 1], segs };
}

const lowerPt = (p: LowerPt): string => `${round(p[0])} ${round(p[1])}`;
const lowerCurveTo = (chain: LowerChain): string =>
  chain.segs.map((s) => `C ${lowerPt(s.c1)} ${lowerPt(s.c2)} ${lowerPt(s.to)}`).join(" ");

const LOWER_ANKLE_Y = 118; // past the longest hem the length slider allows (100 cm)

export interface LowerCroquisAnchors {
  readonly waistHalf: number;
  readonly hipHalf: number;
  readonly hipY: number;
  readonly length: number;
  readonly crotchY: number;
  readonly ankleY: number;
}

/** The shared lower-body render contract. It contains the measured body
 * silhouette and the anchors needed by a garment-specific cloth overlay. */
export interface LowerCroquisFigure {
  readonly silhouettePath: string;
  readonly anchors: LowerCroquisAnchors;
}

/** Waist → hip on one side: a flare that leaves the waist and meets the hip
 * vertically, so the waist reads as the narrowest point. */
function lowerFlare(waistHalf: number, hipHalf: number, hipY: number, sx: 1 | -1): LowerChain {
  return {
    start: [sx * waistHalf, 0],
    segs: [{
      c1: [sx * waistHalf, hipY * 0.42],
      c2: [sx * hipHalf, hipY * 0.52],
      to: [sx * hipHalf, hipY],
    }],
  };
}

/** Emit a waist-to-hip curve, optionally walked from hip back to waist. This
 * is also the shared curve command used by the skirt's cloth overlay, so the
 * overlay cannot drift away from the body contract's real flare. */
export function lowerCroquisFlareCommand(
  waistHalf: number, hipHalf: number, hipY: number, sx: 1 | -1, reverse = false
): string {
  const chain = lowerFlare(waistHalf, hipHalf, hipY, sx);
  return lowerCurveTo(reverse ? reverseLowerChain(chain) : chain);
}

/** One leg, hip point → outer thigh → knee → ankle → inner thigh → crotch. */
function lowerLeg(f: LowerCroquisAnchors, sx: 1 | -1): LowerChain {
  const kneeY = f.crotchY + (f.ankleY - f.crotchY) * 0.52;
  const h = f.hipHalf;
  const x = (k: number): number => sx * h * k;
  const thigh = kneeY - f.crotchY;
  const shin = f.ankleY - kneeY;
  return {
    start: [sx * h, f.hipY],
    segs: [
      { // outer thigh: full hip width just below the hip, then in to the knee
        c1: [sx * h, f.hipY + (kneeY - f.hipY) * 0.28],
        c2: [x(0.70), kneeY - (kneeY - f.hipY) * 0.22],
        to: [x(0.64), kneeY],
      },
      { // outer calf: a small bulge, then in to the ankle
        c1: [x(0.63), kneeY + shin * 0.30],
        c2: [x(0.44), f.ankleY - shin * 0.25],
        to: [x(0.40), f.ankleY],
      },
      { // across the ankle — a straight run; the figure stops here, no feet
        c1: [x(0.40), f.ankleY],
        c2: [x(0.17), f.ankleY],
        to: [x(0.17), f.ankleY],
      },
      { // inner calf, back up to the knee
        c1: [x(0.17), f.ankleY - shin * 0.30],
        c2: [x(0.11), kneeY + shin * 0.25],
        to: [x(0.12), kneeY],
      },
      { // inner thigh, closing on the crotch at the centre line
        c1: [x(0.13), kneeY - thigh * 0.40],
        c2: [x(0.11), f.crotchY + thigh * 0.16],
        to: [0, f.crotchY],
      },
    ],
  };
}

/** Build the lower-body figure drawn by the annotated skirt Body view. */
export function lowerCroquisFigure(m: Measurements): LowerCroquisFigure {
  const { waistHalf, hipHalf } = skirtWidths(m);
  const anchors: LowerCroquisAnchors = {
    waistHalf, hipHalf, hipY: m.hipDepth, length: m.length,
    crotchY: m.hipDepth * 1.35, ankleY: LOWER_ANKLE_Y,
  };
  const silhouettePath = [
    `M ${lowerPt([-anchors.waistHalf, 0])}`,
    `L ${lowerPt([anchors.waistHalf, 0])}`,
    lowerCroquisFlareCommand(anchors.waistHalf, anchors.hipHalf, anchors.hipY, 1),
    lowerCurveTo(lowerLeg(anchors, 1)),
    lowerCurveTo(reverseLowerChain(lowerLeg(anchors, -1))),
    lowerCroquisFlareCommand(anchors.waistHalf, anchors.hipHalf, anchors.hipY, -1, true),
    "Z",
  ].join(" ");
  return { silhouettePath, anchors };
}

/** Reusable lower-body croquis paths. The lower front/back use the shared
 * figure contract; the side is a truthful profile envelope, not a drape
 * simulation. */
export function lowerCroquisPath(m: Measurements, view: CroquisView): string {
  if (view !== "side") return lowerCroquisFigure(m).silhouettePath;
  const waist = (m.waist + m.ease) / 4;
  const hip = (m.hip + m.ease) / 4;
  return `M 0 0 C ${round(hip * 0.35)} ${round(m.hipDepth * 0.4)} ${round(hip * 0.45)} ${round(m.hipDepth * 0.8)} ${round(hip * 0.35)} ${round(m.hipDepth)} L ${round(hip * 0.35)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.hipDepth)} C ${round(-hip * 0.25)} ${round(m.hipDepth * 0.7)} ${round(-waist * 0.6)} ${round(m.hipDepth * 0.3)} 0 0 Z`;
}

/** One public entry point for callers that select a croquis by region/view. */
export function croquisPath(region: CroquisRegion, m: Measurements, view: CroquisView): string {
  return region === "upper" ? upperCroquisPath(m, view) : lowerCroquisPath(m, view);
}
