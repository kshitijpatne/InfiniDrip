// Shared measurement-honest croquis geometry. These figures are presentation
// scaffolding only: they do not draft pattern pieces and never enter exports.
// Front, side, and back are named separately so a future view cannot silently
// substitute a front figure for a side or back representation.

import { Measurements, derive, necklineEdge, NECKLINE_DEFAULT } from "../drafting";
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

/** Reusable lower-body croquis paths. The lower front/back are identical at
 * this measurement level; the side is a truthful profile envelope, not a
 * drape simulation. */
export function lowerCroquisPath(m: Measurements, view: CroquisView): string {
  const waist = (m.waist + m.ease) / 4;
  const hip = (m.hip + m.ease) / 4;
  if (view === "side") {
    return `M 0 0 C ${round(hip * 0.35)} ${round(m.hipDepth * 0.4)} ${round(hip * 0.45)} ${round(m.hipDepth * 0.8)} ${round(hip * 0.35)} ${round(m.hipDepth)} L ${round(hip * 0.35)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.length)} L ${round(-hip * 0.25)} ${round(m.hipDepth)} C ${round(-hip * 0.25)} ${round(m.hipDepth * 0.7)} ${round(-waist * 0.6)} ${round(m.hipDepth * 0.3)} 0 0 Z`;
  }
  return [
    `M ${round(-waist)} 0 L ${round(waist)} 0`,
    `L ${round(hip)} ${round(m.hipDepth)}`,
    `L ${round(hip)} ${round(m.length)}`,
    `L ${round(-hip)} ${round(m.length)}`,
    `L ${round(-hip)} ${round(m.hipDepth)} Z`,
  ].join(" ");
}

/** One public entry point for callers that select a croquis by region/view. */
export function croquisPath(region: CroquisRegion, m: Measurements, view: CroquisView): string {
  return region === "upper" ? upperCroquisPath(m, view) : lowerCroquisPath(m, view);
}
