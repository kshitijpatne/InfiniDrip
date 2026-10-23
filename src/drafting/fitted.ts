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
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd } from "./piece";
import { dartOf, edgesMeet, transferDart } from "./dart";
import { Block, rolePiece } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { Component, ComponentResult } from "./component";
import { iface, edgeRef } from "./stitch";
import { necklineEdge } from "./neckline";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { GarmentOption, GarmentOptions } from "./options";
import { Note } from "../guidance/note";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { lineMark } from "./pattern-mark";

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
  const { cNeck: cfNeck, hps, edge: neckline } = necklineEdge("front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, m.armholeDepth);
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

const fittedFrontComponent: Component<GarmentOptions> = (m, options): ComponentResult => ({
  pieces: { front: draftFittedFront(m, options) },
  stitches: [],
  interfaces: { armhole: iface(edgeRef("front", "armhole")) },
});

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
      }),
      ["front", "back"],
    ),
  ],
  () => sleevedTopStitches(["sideUpper", "sideLower"], true),
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
  const notes = [...sleevedTopGuidance(block, m)];
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
    const bustApex = dartOf(waistFront)!.apex;
    const waistCenterX = derive(m).chestWidthHalf * waistDart.positionPercent / 100;
    if (Math.hypot(waistCenterX - bustApex.x, waistApexY - bustApex.y) < 2) {
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
