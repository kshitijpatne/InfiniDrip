// The fitted garment — the first NON-tee recipe, and proof of the engine/recipe
// split: it reuses the tee's own back and sleeve untouched, and only swaps in a
// darted front. The front carries a side BUST DART: a wedge whose apex sits at
// the bust point and whose mouth opens on the side seam. Sew the two legs
// together and the flat panel cones over the bust — that's the shaping a boxy
// tee can't give.
//
// The editable cut pattern opens from a level, dart-closed reference. Closing
// the dart with the shared transfer operation recovers that reference seam.

import { point } from "../geometry";
import { rotatePoint } from "../geometry/rotate";
import { Measurements, derive } from "./measurements";
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { dartOf, edgesMeet, transferDart } from "./dart";
import { Block, rolePiece } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { Component, ComponentResult } from "./component";
import { iface, edgeRef, type Stitch } from "./stitch";
import { necklineEdge } from "./neckline";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { GarmentOption, GarmentOptions } from "./options";
import { Note } from "../guidance/note";
import { teeFrontNecklineParams, teeNecklineNotes, TEE_SCOOP_NECK_DROP_OPTION_ID, TEE_V_NECK_DROP_OPTION_ID } from "./tshirt";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { lineMark } from "./pattern-mark";
import { fittedPrincessLineReferences } from "./fitted-reference";

export const FITTED_PRINCESS_ENTRY_ID = "fitted-princess-tee-digital-v1";
export const FITTED_VNECK_ENTRY_ID = "fitted-vneck-tee-digital-v1";
export const FITTED_SCOOP_ENTRY_ID = "fitted-scoop-tee-digital-v1";
export const FITTED_CAP_SLEEVE_ENTRY_ID = "fitted-cap-sleeve-tee-digital-v1";
export const FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID = "fitted-three-quarter-sleeve-tee-digital-v1";

const DART_INTAKE_OPTION: GarmentOption = {
  id: "dartIntake",
  label: "Bust dart intake",
  unit: "cm",
  group: "Dart shaping",
  help: "The existing 4 cm default is unvalidated. The 0.5–8 cm range is a software geometry guardrail, not a fit specification.",
  defaultValue: 4,
  min: 0.5,
  max: 8,
  step: 0.5,
  excludedForStarterEntryIds: [FITTED_PRINCESS_ENTRY_ID],
};

const BUST_APEX_HORIZONTAL_OPTION: GarmentOption = {
  id: "bustApexHorizontal",
  label: "Bust apex across half-front",
  unit: "%",
  group: "Dart shaping",
  help: "The existing 55% default is unvalidated. The 20–80% range is a software geometry guardrail, not a fit standard.",
  defaultValue: 55,
  min: 20,
  max: 80,
  step: 1,
  excludedForStarterEntryIds: [FITTED_PRINCESS_ENTRY_ID],
};

const BUST_APEX_VERTICAL_OPTION: GarmentOption = {
  id: "bustApexVertical",
  label: "Bust apex from underarm to hem",
  unit: "%",
  group: "Dart shaping",
  help: "The existing 28% default is unvalidated. The 20–80% range is a software geometry guardrail, not a fit standard. Move the apex inward or reduce intake if the opening reaches an edge.",
  defaultValue: 28,
  min: 20,
  max: 80,
  step: 1,
  excludedForStarterEntryIds: [FITTED_PRINCESS_ENTRY_ID],
};

export const FITTED_DART_OPTIONS: readonly GarmentOption[] = [
  DART_INTAKE_OPTION,
  BUST_APEX_HORIZONTAL_OPTION,
  BUST_APEX_VERTICAL_OPTION,
  {
    id: "waistDartWaistlineFromHps",
    label: "Waistline depth from HPS",
    unit: "cm",
    group: "Waist dart",
    help: "This sets an internal pattern-mark depth from the high-point shoulder, not a measured body waist location. The 43 cm default and 30–60 cm guardrail are unvalidated software choices.",
    defaultValue: 43,
    min: 30,
    max: 60,
    step: 1,
    appliesToStarterEntryId: "fitted-waist-dart-tee-digital-v1",
  },
  {
    id: "waistDartIntake",
    label: "Waist dart intake",
    unit: "cm",
    group: "Waist dart",
    help: "The internal placement-mark opening is a software construction choice, not a fit target. Move the dart position or reduce intake if the marks reach the fold or side seam.",
    defaultValue: 2,
    min: 0.5,
    max: 6,
    step: 0.5,
    appliesToStarterEntryId: "fitted-waist-dart-tee-digital-v1",
  },
  {
    id: "waistDartLength",
    label: "Waist dart length",
    unit: "cm",
    group: "Waist dart",
    help: "The vertical internal-mark length is an unvalidated software choice. Shorten it or move the dart toward center front if it approaches the bust dart.",
    defaultValue: 10,
    min: 4,
    max: 18,
    step: 1,
    appliesToStarterEntryId: "fitted-waist-dart-tee-digital-v1",
  },
  {
    id: "waistDartPosition",
    label: "Waist dart across half-front",
    unit: "%",
    group: "Waist dart",
    help: "Positions the dart center as a percentage of the available half-front width from center front. This 20–80% range is a software geometry guardrail, not a body-position rule.",
    defaultValue: 45,
    min: 20,
    max: 80,
    step: 1,
    appliesToStarterEntryId: "fitted-waist-dart-tee-digital-v1",
  },
];

/** Digital cut-role quantities for F03. These describe pattern instances only;
 * they do not certify a manufacturing plan or physical material use. */
export const FITTED_PRINCESS_PHYSICAL_ROLES = [
  { id: "front", quantity: 1, onFold: true },
  { id: "frontSide", quantity: 2, onFold: false },
  { id: "back", quantity: 1, onFold: true },
  { id: "sleeve", quantity: 2, onFold: false },
] as const;

/** Controls scoped to F03. These define digital pattern geometry, not a fit target. */
export const FITTED_PRINCESS_OPTIONS: readonly GarmentOption[] = [
  {
    id: "princessSeamShaping",
    label: "Princess-seam shaping offset",
    unit: "cm",
    group: "Princess seam",
    help: "Controls the opposing digital seam curvature around the selected apex. This is a construction setting, not a fit or bust-volume claim.",
    defaultValue: 2,
    min: 0,
    max: 6,
    step: 0.5,
    appliesToStarterEntryId: FITTED_PRINCESS_ENTRY_ID,
  },
  {
    id: "princessApexHorizontal",
    label: "Seam apex across half-front",
    unit: "%",
    group: "Princess seam",
    help: "Positions the digital seam through the chosen half-front coordinate. The percentage is an InfiniDrip geometry control, not an anatomical standard.",
    defaultValue: 55,
    min: 20,
    max: 80,
    step: 1,
    appliesToStarterEntryId: FITTED_PRINCESS_ENTRY_ID,
  },
  {
    id: "princessApexVertical",
    label: "Seam apex from underarm to hem",
    unit: "%",
    group: "Princess seam",
    help: "Positions the digital seam apex along the front body. This percentage is not a fit or body-landmark claim.",
    defaultValue: 28,
    min: 20,
    max: 80,
    step: 1,
    appliesToStarterEntryId: FITTED_PRINCESS_ENTRY_ID,
  },
  {
    id: "princessShoulderOrigin",
    label: "Seam start across shoulder",
    unit: "%",
    group: "Princess seam",
    help: "Sets the shoulder-origin seam start between neckline and shoulder tip. This is a digital construction choice.",
    defaultValue: 60,
    min: 20,
    max: 80,
    step: 1,
    appliesToStarterEntryId: FITTED_PRINCESS_ENTRY_ID,
  },
];

const FITTED_VNECK_OPTION: GarmentOption = {
  id: TEE_V_NECK_DROP_OPTION_ID,
  label: "Front V-neck drop",
  unit: "cm",
  group: "Neckline",
  help: "The 5 cm starting drop is a software geometry choice, not a fit target. Adjust the V while keeping its point above the underarm; the app will not clamp the value.",
  defaultValue: 5,
  min: 0,
  max: 15,
  step: 0.5,
  appliesToStarterEntryId: FITTED_VNECK_ENTRY_ID,
};

const FITTED_SCOOP_OPTION: GarmentOption = {
  id: TEE_SCOOP_NECK_DROP_OPTION_ID,
  label: "Front Scoop extra depth",
  unit: "cm",
  group: "Neckline",
  help: "The 5 cm starting depth is a software geometry choice, not a fit target. Reduce the extra depth or review armhole depth when guidance appears; the app keeps invalid input visible.",
  defaultValue: 5,
  min: 0,
  max: 15,
  step: 0.5,
  appliesToStarterEntryId: FITTED_SCOOP_ENTRY_ID,
};

const FITTED_CAP_SLEEVE_TRIM_OPTION: GarmentOption = {
  id: "capSleeveUnderarmTrimCm",
  label: "Underarm taper per side",
  unit: "cm",
  group: "Sleeve shape",
  help: "Adds this digital taper from the sleeve cap base to the hem. The 0.6 cm default and 0–1.5 cm range are software geometry choices, not fit standards; invalid values remain visible.",
  defaultValue: 0.6,
  min: 0,
  max: 1.5,
  step: 0.1,
  appliesToStarterEntryId: FITTED_CAP_SLEEVE_ENTRY_ID,
};

export const FITTED_OPTIONS: readonly GarmentOption[] = [
  ...FITTED_DART_OPTIONS,
  ...FITTED_PRINCESS_OPTIONS,
  FITTED_VNECK_OPTION,
  FITTED_SCOOP_OPTION,
  FITTED_CAP_SLEEVE_TRIM_OPTION,
];

export function usesFittedPrincessSeam(options: GarmentOptions): boolean {
  return options.princessSeamShaping !== undefined;
}

interface FittedDartParameters {
  readonly intake: number;
  readonly apexHorizontalPercent: number;
  readonly apexVerticalPercent: number;
}

interface FittedWaistDartParameters {
  readonly waistlineFromHps: number;
  readonly intake: number;
  readonly length: number;
  readonly positionPercent: number;
}

const fittedWaistDartParameters = (options: GarmentOptions): FittedWaistDartParameters | null => {
  if (options.waistDartIntake === undefined) return null;
  return {
    waistlineFromHps: options.waistDartWaistlineFromHps ?? 43,
    intake: options.waistDartIntake,
    length: options.waistDartLength ?? 10,
    positionPercent: options.waistDartPosition ?? 45,
  };
};

export function sideBoundaryAtY(front: Piece, y: number): number | null {
  const candidates = ["sideUpper", "sideLower"].flatMap((name) => {
    const edge = front.edges.find((candidate) => candidate.name === name);
    if (!edge || edge.kind !== "line") return [];
    const minY = Math.min(edge.start.y, edge.end.y);
    const maxY = Math.max(edge.start.y, edge.end.y);
    if (y < minY || y > maxY) return [];
    const vertical = edge.end.y - edge.start.y;
    if (Math.abs(vertical) < 1e-9) return [Math.max(edge.start.x, edge.end.x)];
    const ratio = (y - edge.start.y) / vertical;
    return [edge.start.x + (edge.end.x - edge.start.x) * ratio];
  });
  return candidates.length === 1 ? candidates[0]! : null;
}

function segmentIntersectsInterior(a: { x: number; y: number }, b: { x: number; y: number },
  c: { x: number; y: number }, d: { x: number; y: number }): boolean {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const cdx = d.x - c.x;
  const cdy = d.y - c.y;
  const denominator = abx * cdy - aby * cdx;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const t = (acx * cdy - acy * cdx) / denominator;
  const u = (acx * aby - acy * abx) / denominator;
  return t > 1e-6 && t < 1 - 1e-6 && u > 1e-6 && u < 1 - 1e-6;
}

function waistDartCrossesBustDart(front: Piece): boolean {
  const upper = front.marks?.find((mark) => mark.name === "waistDartUpperLeg");
  const lower = front.marks?.find((mark) => mark.name === "waistDartLowerLeg");
  if (!upper || !lower || !("start" in upper) || !("start" in lower)) return false;
  const bustUpper = front.edges.find((edge) => edge.name === "bustDartUpper") as Extract<Edge, { kind: "line" }>;
  const bustLower = front.edges.find((edge) => edge.name === "bustDartLower") as Extract<Edge, { kind: "line" }>;
  return [upper, lower].some((waistLeg) => [bustUpper, bustLower].some((bustLeg) =>
    segmentIntersectsInterior(waistLeg.start, waistLeg.end, bustLeg.start, bustLeg.end)));
}

const fittedDartParameters = (options: GarmentOptions): FittedDartParameters => ({
  intake: options[DART_INTAKE_OPTION.id] ?? DART_INTAKE_OPTION.defaultValue,
  apexHorizontalPercent: options[BUST_APEX_HORIZONTAL_OPTION.id] ?? BUST_APEX_HORIZONTAL_OPTION.defaultValue,
  apexVerticalPercent: options[BUST_APEX_VERTICAL_OPTION.id] ?? BUST_APEX_VERTICAL_OPTION.defaultValue,
});

export function draftFittedFront(m: Measurements, options: GarmentOptions = {}): Piece {
  const d = derive(m);
  const { intake, apexHorizontalPercent, apexVerticalPercent } = fittedDartParameters(options);
  const { cNeck: cfNeck, hps, edge: neckline } = necklineEdge(
    "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, m.armholeDepth, teeFrontNecklineParams(options),
  );
  const shoulder = point(d.shoulderHalf, d.shoulderSlope);
  const underarm = point(d.chestWidthHalf, m.armholeDepth);
  const sideHem = point(d.chestWidthHalf, m.length);
  const cfHem = point(0, m.length);

  // The closed reference is the source geometry. Opening the dart rotates only
  // the lower side panel around the apex; closing it with the engine's inverse
  // rotation recovers this side and the level hem trace below.
  const bustY = m.armholeDepth + (m.length - m.armholeDepth) * apexVerticalPercent / 100;
  const apex = point(d.chestWidthHalf * apexHorizontalPercent / 100, bustY);
  const mouthUpper = point(d.chestWidthHalf, bustY - intake / 2);
  const closedReference: Piece = {
    name: "fitted front (dart-closed reference)",
    onFold: true,
    edges: [
      neckline,
      { kind: "line", name: "shoulder", start: hps, end: shoulder },
      { kind: "curve", name: "armhole", curve: {
        start: shoulder,
        control1: point(d.shoulderHalf, d.shoulderSlope + (m.armholeDepth - d.shoulderSlope) * 0.45),
        control2: point(d.chestWidthHalf - 2, m.armholeDepth - 3),
        end: underarm } },
      { kind: "line", name: "sideUpper", start: underarm, end: mouthUpper },
      { kind: "line", name: "sideLower", start: mouthUpper, end: sideHem },
      { kind: "line", name: "hem", start: sideHem, end: cfHem },
      { kind: "line", name: "centerFront", start: cfHem, end: cfNeck },
    ],
  };
  const opened = reopenFittedReference(closedReference, apex, intake);
  const waistDart = fittedWaistDartParameters(options);
  if (!waistDart) return opened;
  const sideX = sideBoundaryAtY(opened, waistDart.waistlineFromHps) ?? d.chestWidthHalf;
  const centerX = sideX * waistDart.positionPercent / 100;
  const dartApex = point(centerX, waistDart.waistlineFromHps - waistDart.length);
  const upperBase = point(centerX - waistDart.intake / 2, waistDart.waistlineFromHps);
  const lowerBase = point(centerX + waistDart.intake / 2, waistDart.waistlineFromHps);
  return {
    ...opened,
    marks: [
      lineMark("placementLine", "waistDartUpperLeg", upperBase, dartApex, "WAIST DART", "instruction"),
      lineMark("placementLine", "waistDartLowerLeg", lowerBase, dartApex),
    ],
  };
}

const fittedFrontComponent: Component<GarmentOptions> = (m, options): ComponentResult => {
  const pieces = usesFittedPrincessSeam(options)
    ? draftFittedPrincessFronts(m, options)
    : { front: draftFittedFront(m, options) };
  const armholeRole = "frontSide" in pieces ? "frontSide" : "front";
  return {
  pieces,
  stitches: [],
  interfaces: { armhole: iface(edgeRef(armholeRole, "armhole")) },
  };
};

/** The fitted tee reuses the shared back and sleeve nodes while swapping only
 * its darted front. The sleeve still measures the actual front/back pair. */
export const FITTED_GRAMMAR = garmentGrammar(
  "fitted",
  [
    componentNode("front", "darted-bodice", fittedFrontComponent, (context) => context.options),
    componentNode("back", "bodice", bodice, () => ({ position: "back" as const })),
    componentNode(
      "sleeve",
      "sleeve",
      sleeveComponent,
      (context) => ({
        targetArmhole:
          context.interfaceLength("front", "armhole") +
          context.interfaceLength("back", "armhole"),
        sideTaperAddCm: context.options.capSleeveUnderarmTrimCm ?? 0,
      }),
      ["front", "back"],
    ),
  ],
  (context) => usesFittedPrincessSeam(context.options)
    ? fittedPrincessStitches()
    : sleevedTopStitches(["sideUpper", "sideLower"], true),
);

/** A fitted block: a darted front, with the tee's back and sleeve reused as-is.
 *  Phase B3 (Slice 54, §2.4): the sleeve is fit to the armhole measured off
 *  THIS front (the real darted piece just drafted), not a re-derived generic
 *  one — the actual fix, even though the number comes out identical here
 *  because the fitted front reuses the tee front's exact armhole curve. */
/**
 * The editable cut pattern is opened from a level, straight closed reference.
 * The engine's dart transfer then folds the bust dart closed and moves its
 * wedge to the hem. The resulting closed side is retained directly, while the
 * hem is traced from its closed side endpoint to center-front at the selected
 * body length. Reopening the reference reproduces the cut pattern's side,
 * hem, and dart coordinates. This is digital construction geometry, not sewn
 * fit or physical behavior.
 */
export interface FittedGeometryPair {
  readonly openPattern: Piece;
  /** Intermediate state: the bust-dart mouth is closed and the wedge is at hem. */
  readonly dartClosedBeforeTrueing: Piece;
  readonly bustDartClosed: boolean;
  readonly dartClosedReference: Piece;
}

export function fittedGeometryPair(block: Block): FittedGeometryPair {
  const openPattern = rolePiece(block, "front");
  if (!openPattern.dart) throw new Error("Fitted closed reference requires the open bust dart");

  const dartClosedBeforeTrueing = transferDart(openPattern, "hem", 0.5, "centerFront");
  const bustDartClosed = edgesMeet(dartClosedBeforeTrueing, "sideUpper", "sideLower");
  const sideUpper = pieceEdge(dartClosedBeforeTrueing, "sideUpper");
  const sideLower = pieceEdge(dartClosedBeforeTrueing, "sideLower");
  const centerFront = pieceEdge(dartClosedBeforeTrueing, "centerFront");
  const centerFrontHem = edgeStart(centerFront);
  const sideHem = edgeEnd(sideLower);
  const dartClosedReference: Piece = {
    name: "fitted front (dart-closed reference)",
    onFold: true,
    edges: [
      pieceEdge(dartClosedBeforeTrueing, "neckline"),
      pieceEdge(dartClosedBeforeTrueing, "shoulder"),
      pieceEdge(dartClosedBeforeTrueing, "armhole"),
      sideUpper,
      sideLower,
      { kind: "line", name: "hem", start: sideHem, end: centerFrontHem },
      centerFront,
    ],
  };
  return { openPattern, dartClosedBeforeTrueing, bustDartClosed, dartClosedReference };
}

const lerpPoint = (a: { x: number; y: number }, b: { x: number; y: number }, t: number) =>
  point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

function reflectAcrossLine(value: { x: number; y: number }, start: { x: number; y: number }, end: { x: number; y: number }) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = ((value.x - start.x) * dx + (value.y - start.y) * dy) / lengthSquared;
  const projected = point(start.x + projection * dx, start.y + projection * dy);
  return point(2 * projected.x - value.x, 2 * projected.y - value.y);
}

function reflectedReverseCurve(
  curve: Extract<Edge, { kind: "curve" }>["curve"],
  axisStart: { x: number; y: number },
  axisEnd: { x: number; y: number },
): Extract<Edge, { kind: "curve" }>["curve"] {
  return {
    start: reflectAcrossLine(curve.end, axisStart, axisEnd),
    control1: reflectAcrossLine(curve.control2, axisStart, axisEnd),
    control2: reflectAcrossLine(curve.control1, axisStart, axisEnd),
    end: reflectAcrossLine(curve.start, axisStart, axisEnd),
  };
}

function princessCurvePair(
  shoulderOrigin: { x: number; y: number },
  apex: { x: number; y: number },
  hemOrigin: { x: number; y: number },
  shaping: number,
): readonly [Extract<Edge, { kind: "curve" }>["curve"], Extract<Edge, { kind: "curve" }>["curve"]] {
  const chordX = hemOrigin.x - shoulderOrigin.x;
  const chordY = hemOrigin.y - shoulderOrigin.y;
  const chordLength = Math.hypot(chordX, chordY);
  const tangent = point(chordX / chordLength, chordY / chordLength);
  let normal = point(-tangent.y, tangent.x);
  if (normal.x > 0) normal = point(-normal.x, -normal.y);
  const upperLength = Math.hypot(apex.x - shoulderOrigin.x, apex.y - shoulderOrigin.y);
  const lowerLength = Math.hypot(hemOrigin.x - apex.x, hemOrigin.y - apex.y);
  const handle = Math.min(upperLength, lowerLength, chordLength) / 3;
  const upper = {
    start: point(shoulderOrigin.x, shoulderOrigin.y),
    control1: point(shoulderOrigin.x + (apex.x - shoulderOrigin.x) / 3 + normal.x * shaping,
      shoulderOrigin.y + (apex.y - shoulderOrigin.y) / 3 + normal.y * shaping),
    control2: point(apex.x - tangent.x * handle, apex.y - tangent.y * handle),
    end: point(apex.x, apex.y),
  };
  const lower = {
    start: point(apex.x, apex.y),
    control1: point(apex.x + tangent.x * handle, apex.y + tangent.y * handle),
    control2: point(apex.x + (hemOrigin.x - apex.x) * 2 / 3 + normal.x * shaping,
      apex.y + (hemOrigin.y - apex.y) * 2 / 3 + normal.y * shaping),
    end: point(hemOrigin.x, hemOrigin.y),
  };
  return [upper, lower];
}

/** Draft the center-on-fold and mirrored-pair side fronts from the closed
 * Fitted reference. Opposing seam curves are reflections, so their sewn edge
 * lengths are identical by construction while the shoulder-origin path passes
 * through the selected digital apex. */
export function draftFittedPrincessFronts(m: Measurements, options: GarmentOptions): Record<string, Piece> {
  const reference = fittedGeometryPair({
    roles: { front: draftFittedFront(m, { dartIntake: 4, bustApexHorizontal: 55, bustApexVertical: 28 }) },
    stitches: [],
  }).dartClosedReference;
  const { shoulder, hem, centerFront } = fittedPrincessLineReferences(
    pieceEdge(reference, "shoulder"), pieceEdge(reference, "hem"), pieceEdge(reference, "centerFront"),
  );
  const neckline = pieceEdge(reference, "neckline");
  const armhole = pieceEdge(reference, "armhole");
  const sideUpper = pieceEdge(reference, "sideUpper");
  const sideLower = pieceEdge(reference, "sideLower");
  const shoulderPercent = options.princessShoulderOrigin ?? 60;
  const shoulderOrigin = lerpPoint(shoulder.start, shoulder.end, shoulderPercent / 100);
  const derived = derive(m);
  const apexVerticalPercent = options.princessApexVertical ?? 28;
  const apex = point(derived.chestWidthHalf * (options.princessApexHorizontal ?? 55) / 100,
    m.armholeDepth + (m.length - m.armholeDepth) * apexVerticalPercent / 100);
  const cfHem = centerFront.start;
  const sideHem = hem.start;
  const hemOrigin = lerpPoint(cfHem, sideHem, 0.4);
  const [centerUpper, centerLower] = princessCurvePair(shoulderOrigin, apex, hemOrigin,
    options.princessSeamShaping ?? 2);
  const sideUpperCurve = reflectedReverseCurve(centerUpper, shoulderOrigin, hemOrigin);
  const sideLowerCurve = reflectedReverseCurve(centerLower, shoulderOrigin, hemOrigin);
  const centerFrontPiece: Piece = {
    name: "fitted front center",
    onFold: true,
    edges: [
      neckline,
      { kind: "line", name: "shoulder", start: shoulder.start, end: shoulderOrigin },
      { kind: "curve", name: "princessUpper", curve: centerUpper },
      { kind: "curve", name: "princessLower", curve: centerLower },
      { kind: "line", name: "hem", start: hemOrigin, end: cfHem },
      centerFront,
    ],
  };
  const sideFrontPiece: Piece = {
    name: "fitted side front (cut 2 mirrored)",
    onFold: false,
    edges: [
      { kind: "line", name: "shoulder", start: shoulderOrigin, end: shoulder.end },
      armhole,
      sideUpper,
      sideLower,
      { kind: "line", name: "hem", start: sideHem, end: hemOrigin },
      { kind: "curve", name: "princessLower", curve: sideLowerCurve },
      { kind: "curve", name: "princessUpper", curve: sideUpperCurve },
    ],
  };
  return { front: centerFrontPiece, frontSide: sideFrontPiece };
}

export function fittedPrincessStitches(): Stitch[] {
  return [
    { label: "Shoulder seam (front ↔ back)",
      a: iface(edgeRef("front", "shoulder"), edgeRef("frontSide", "shoulder")),
      b: iface(edgeRef("back", "shoulder")) },
    { label: "Side seam (front ↔ back)",
      a: iface(edgeRef("frontSide", "sideUpper"), edgeRef("frontSide", "sideLower")),
      b: iface(edgeRef("back", "side")) },
    { label: "Princess seam (front center ↔ side front)",
      a: iface(edgeRef("front", "princessUpper"), edgeRef("front", "princessLower")),
      b: iface(edgeRef("frontSide", "princessUpper", true), edgeRef("frontSide", "princessLower", true)) },
    { label: "Sleeve underarm (left ↔ right)",
      a: iface(edgeRef("sleeve", "sideLeft")), b: iface(edgeRef("sleeve", "sideRight")) },
    { label: "Sleeve-cap ease",
      a: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
      b: iface(edgeRef("frontSide", "armhole"), edgeRef("back", "armhole")),
      ease: { lo: -1, hi: 4 } },
  ];
}

/** Reopen the side dart from a traced closed reference without changing the fold. */
export function reopenFittedReference(closedReference: Piece, apex: { x: number; y: number }, intake: number): Piece {
  const upperMouth = edgeEnd(pieceEdge(closedReference, "sideUpper"));
  const horizontalRun = upperMouth.x - apex.x;
  const openingAngle = 2 * Math.atan2(intake / 2, horizontalRun);
  const rotateFromApex = (p: { x: number; y: number }) => rotatePoint(p, apex, openingAngle);
  const closedSideLower = pieceEdge(closedReference, "sideLower");
  if (closedSideLower.kind !== "line") throw new Error("Fitted side-dart reopening requires straight side edges");
  const lowerMouth = rotateFromApex(upperMouth);
  const openSideLower: Edge = {
    kind: "line",
    name: "sideLower",
    start: rotateFromApex(closedSideLower.start),
    end: rotateFromApex(closedSideLower.end),
  };
  const openEdges: Edge[] = [];
  for (const edge of closedReference.edges) {
    if (edge.name === "sideLower") {
      openEdges.push(
        { kind: "line", name: "bustDartUpper", start: upperMouth, end: apex },
        { kind: "line", name: "bustDartLower", start: apex, end: lowerMouth },
        openSideLower,
      );
    } else if (edge.name === "hem") {
      if (edge.kind !== "line") throw new Error("Fitted hem reopening requires a straight hem");
      openEdges.push({ ...edge, start: edgeEnd(openSideLower) });
    } else {
      openEdges.push(edge);
    }
  }
  return {
    ...closedReference,
    name: "fitted front",
    edges: openEdges,
    dart: { legs: ["bustDartUpper", "bustDartLower"] },
  };
}
export function draftFitted(m: Measurements, options: GarmentOptions = {}): Block {
  return composeBlock(FITTED_GRAMMAR, m, options);
}

/** Reuse the shared tee notes and reject dart openings that cross panel edges. */
export function fittedGuidance(block: Block, m: Measurements, options: GarmentOptions = {}): Note[] {
  const princess = usesFittedPrincessSeam(options);
  const capSleeveTrim = options.capSleeveUnderarmTrimCm;
  const notes = [
    ...sleevedTopGuidance(block, m, princess ? "frontSide" : "front"),
    ...teeNecklineNotes(m, options),
  ];
  if (capSleeveTrim !== undefined) {
    const invalidLength = !Number.isFinite(m.sleeveLength) || m.sleeveLength < 8 || m.sleeveLength > 10
      || Math.abs(m.sleeveLength - Math.round(m.sleeveLength)) > 1e-8;
    if (invalidLength) {
      notes.push({ level: "warn", field: "sleeveLength",
        text: "Fitted Cap-Sleeve Tee sleeve length must be 8–10 cm in 1 cm steps below the modeled cap base. Adjust the value; the app will not clamp it." });
    }
    const invalidTrim = !Number.isFinite(capSleeveTrim) || capSleeveTrim < 0 || capSleeveTrim > 1.5
      || Math.abs(capSleeveTrim / 0.1 - Math.round(capSleeveTrim / 0.1)) > 1e-8;
    if (invalidTrim) {
      notes.push({ level: "warn", field: "option-capSleeveUnderarmTrimCm",
        text: "Underarm taper must be 0–1.5 cm per side in 0.1 cm steps. Correct the value; the app will not clamp it." });
    }
    const hem = pieceEdge(rolePiece(block, "sleeve"), "hem");
    const hemWidth = edgeLength(hem);
    if (!Number.isFinite(hemWidth) || hemWidth <= 0) {
      notes.push({ level: "warn", field: "option-capSleeveUnderarmTrimCm",
        text: "The sleeve hem must remain a positive, finite width. Reduce the underarm taper or review the bicep and ease inputs; the app will not change them automatically." });
    }
  }
  if (princess) {
    const shaping = options.princessSeamShaping!;
    const horizontal = options.princessApexHorizontal ?? 55;
    const vertical = options.princessApexVertical ?? 28;
    const shoulder = options.princessShoulderOrigin ?? 60;
    const values = [shaping, horizontal, vertical, shoulder, m.armholeDepth, m.length];
    if (values.some((value) => !Number.isFinite(value))) {
      notes.push({ level: "warn", field: "option-princessSeamShaping",
        text: "Princess-seam controls and body lengths must be finite numbers. Enter values inside their displayed ranges; the app will not replace them automatically." });
      return notes;
    }
    const derived = derive(m);
    const apexY = m.armholeDepth + (m.length - m.armholeDepth) * vertical / 100;
    const apexX = derived.chestWidthHalf * horizontal / 100;
    if (shaping < 0 || shaping > 6) {
      notes.push({ level: "warn", field: "option-princessSeamShaping",
        text: "Princess-seam shaping offset must be between 0 and 6 cm. Reduce the offset; the app will not clamp it." });
    }
    if (horizontal < 20 || horizontal > 80 || apexX <= 0 || apexX >= derived.chestWidthHalf) {
      notes.push({ level: "warn", field: "option-princessApexHorizontal",
        text: "The seam apex must remain inside the half-front. Move it between 20% and 80% of the half-front; the app will not move it automatically." });
    }
    if (vertical < 20 || vertical > 80 || apexY <= m.armholeDepth || apexY >= m.length) {
      notes.push({ level: "warn", field: "option-princessApexVertical",
        text: "The seam apex must remain between the underarm and hem. Move it between 20% and 80% of that interval; the app will not move it automatically." });
    }
    if (shoulder < 20 || shoulder > 80) {
      notes.push({ level: "warn", field: "option-princessShoulderOrigin",
        text: "The seam start must remain on the shoulder between 20% and 80% of its length. Adjust the start; the app will not clamp it." });
    }
    const center = rolePiece(block, "front");
    const side = rolePiece(block, "frontSide");
    const centerUpper = pieceEdge(center, "princessUpper");
    const centerLower = pieceEdge(center, "princessLower");
    const sideUpper = pieceEdge(side, "princessUpper");
    const sideLower = pieceEdge(side, "princessLower");
    const endpointsMeet = Math.hypot(edgeEnd(centerUpper).x - edgeStart(centerLower).x,
      edgeEnd(centerUpper).y - edgeStart(centerLower).y) <= 1e-7
      && Math.hypot(edgeEnd(sideLower).x - edgeStart(sideUpper).x,
        edgeEnd(sideLower).y - edgeStart(sideUpper).y) <= 1e-7;
    const seamDelta = Math.abs(edgeLength(centerUpper) + edgeLength(centerLower)
      - edgeLength(sideUpper) - edgeLength(sideLower));
    const finiteEdges = [centerUpper, centerLower, sideUpper, sideLower].every((edge) => {
      const points = edge.kind === "line" ? [edge.start, edge.end]
        : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end];
      return points.every((candidate) => Number.isFinite(candidate.x) && Number.isFinite(candidate.y));
    });
    if (!finiteEdges || !endpointsMeet || seamDelta > 1e-6) {
      notes.push({ level: "warn", field: "option-princessSeamShaping",
        text: "The digital princess seam is incomplete, non-finite, or untrued. Reduce the shaping offset or move the apex/start into the panel; the app will not substitute a dart pattern." });
    }
    return notes;
  }
  const { intake, apexVerticalPercent } = fittedDartParameters(options);
  const verticalSpan = m.length - m.armholeDepth;
  if (verticalSpan <= 0) {
    notes.push({
      level: "warn",
      field: "armholeDepth",
      text: "Armhole depth must be less than body length to place the bust dart. Reduce armhole depth or increase body length.",
    });
    return notes;
  }

  const apexY = m.armholeDepth + verticalSpan * apexVerticalPercent / 100;
  const front = rolePiece(block, "front");
  const lowerMouth = edgeEnd(pieceEdge(front, "bustDartLower"));
  const openSideHem = edgeStart(pieceEdge(front, "hem"));
  const centerFrontHem = edgeStart(pieceEdge(front, "centerFront"));
  if (apexY - intake / 2 <= m.armholeDepth) {
    notes.push({
      level: "warn",
      field: "option-bustApexVertical",
      text: "The upper bust-dart mouth reaches the underarm line. Move the apex toward the hem or reduce dart intake; the app will not change either value automatically.",
    });
  }
  if (lowerMouth.y >= m.length) {
    notes.push({
      level: "warn",
      field: "option-bustApexVertical",
      text: "The lower bust-dart mouth reaches the hem line. Move the apex toward the underarm or reduce dart intake; the app will not change either value automatically.",
    });
  }
  if (openSideHem.x <= centerFrontHem.x) {
    notes.push({
      level: "warn",
      field: "option-bustApexHorizontal",
      text: "Opening this dart sends the lower hem across the center-front fold. Move the apex toward center front or reduce dart intake; the app will not change either value automatically.",
    });
  }
  const waistDart = fittedWaistDartParameters(options);
  if (waistDart) {
    const invalidNumbers = [waistDart.waistlineFromHps, waistDart.intake, waistDart.length, waistDart.positionPercent]
      .some((value) => !Number.isFinite(value));
    if (invalidNumbers) {
      notes.push({ level: "warn", field: "option-waistDartIntake",
        text: "Waist-dart controls must be finite numbers. Enter values inside their displayed ranges; the app will not replace them automatically." });
      return notes;
    }
    const waistFront = rolePiece(block, "front");
    const sideX = sideBoundaryAtY(waistFront, waistDart.waistlineFromHps);
    if (waistDart.waistlineFromHps <= m.armholeDepth || waistDart.waistlineFromHps >= m.length || sideX === null) {
      notes.push({ level: "warn", field: "option-waistDartWaistlineFromHps",
        text: "Place the waist-dart line between the underarm and hem, outside the bust-dart opening. Move its depth toward the hem; the app will not change it automatically." });
    } else {
      const centerX = sideX * waistDart.positionPercent / 100;
      const leftBaseX = centerX - waistDart.intake / 2;
      const rightBaseX = centerX + waistDart.intake / 2;
      if (leftBaseX <= 0) {
        notes.push({ level: "warn", field: "option-waistDartPosition",
          text: "The waist-dart opening reaches the center-front fold. Move the dart toward the side seam or reduce intake; the app will not change either value automatically." });
      }
      if (rightBaseX >= sideX) {
        notes.push({ level: "warn", field: "option-waistDartPosition",
          text: "The waist-dart opening reaches the side seam. Move the dart toward center front or reduce intake; the app will not change either value automatically." });
      }
    }
    const waistApexY = waistDart.waistlineFromHps - waistDart.length;
    if (waistApexY <= 0) {
      notes.push({ level: "warn", field: "option-waistDartLength",
        text: "The waist-dart apex reaches the HPS neckline. Shorten the dart or move its line toward the hem; the app will not change either value automatically." });
    }
    const bustApex = dartOf(waistFront)?.apex;
    const waistCenterX = sideX === null ? null : sideX * waistDart.positionPercent / 100;
    if (bustApex && waistCenterX !== null
      && Math.hypot(waistCenterX - bustApex.x, waistApexY - bustApex.y) < 2) {
      notes.push({ level: "warn", field: "option-waistDartLength",
        text: "The waist-dart apex is too close to the bust-dart apex for these digital marks. Shorten the waist dart or move it across the half-front; the app will not adjust it automatically." });
    }
    if (waistDartCrossesBustDart(waistFront)) {
      notes.push({ level: "warn", field: "option-waistDartPosition",
        text: "The waist-dart marks cross a bust-dart leg. Shorten the waist dart or move its position; the app will not alter either value automatically." });
    }
  }
  return notes;
}
