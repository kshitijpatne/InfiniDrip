import { cubicLength, distance, point, type CubicBezier, type Point } from "../geometry";
import { armholeDepthCheck, easeRange } from "./tshirt-guidance";
import type { Note } from "../guidance/note";
import { rolePiece, type Block } from "./block";
import type { Component } from "./component";
import { derive, type Measurements } from "./measurements";
import { edgeLength, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import { necklineEdge, NECKLINE_DEFAULT } from "./neckline";
import { componentNode, composeBlock, garmentGrammar, type CompositionContext } from "./grammar";
import { edgeRef, iface, matchedNotch, stitchChecks, type Stitch } from "./stitch";
import { seam, spanX, spanY, type Pom } from "./pom";
import { sleevedTopPanelChecks } from "./tshirt-checks";
import { hasTeeNecklineOverride } from "./tshirt";
import type { GarmentOptions } from "./options";
import type { PieceNotches } from "./tshirt-notches";

const NECKLINE_SPLIT = 0.78;
const NECKLINE_SPREAD_FACTOR = 0.25;
const SLEEVE_UNDERARM_DEPTH_FACTOR = 0.15;
const RAGLAN_CURVE_BEND_FACTOR = 0.08;

type TeePanelParams = {
  readonly position: "front" | "back";
  readonly chestEase?: number;
};

function lerp(a: Point, b: Point, t: number): Point {
  return point(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
}

function splitCurve(curve: CubicBezier, t: number): readonly [CubicBezier, CubicBezier] {
  const p01 = lerp(curve.start, curve.control1, t);
  const p12 = lerp(curve.control1, curve.control2, t);
  const p23 = lerp(curve.control2, curve.end, t);
  const p012 = lerp(p01, p12, t);
  const p123 = lerp(p12, p23, t);
  const split = lerp(p012, p123, t);
  return [
    { start: curve.start, control1: p01, control2: p012, end: split },
    { start: split, control1: p123, control2: p23, end: curve.end },
  ];
}

export function necklinePrefix(edge: Edge, t: number): readonly [Edge, Point] {
  if (edge.kind === "line") {
    const cut = lerp(edge.start, edge.end, t);
    return [{ kind: "line", name: "neckline", start: edge.start, end: cut }, cut];
  }
  const [prefix] = splitCurve(edge.curve, t);
  return [{ kind: "curve", name: "neckline", curve: prefix }, prefix.end];
}

export function bodyRaglanCurve(start: Point, end: Point): CubicBezier {
  const chord = distance(start, end);
  const normal = chord === 0 ? point(0, 0) : point(-(end.y - start.y) / chord, (end.x - start.x) / chord);
  const bend = chord * RAGLAN_CURVE_BEND_FACTOR;
  const control1 = lerp(start, end, 0.28);
  const control2 = lerp(start, end, 0.72);
  return {
    start,
    control1: point(control1.x + normal.x * bend, control1.y + normal.y * bend),
    control2: point(control2.x + normal.x * bend, control2.y + normal.y * bend),
    end,
  };
}

function raglanBodice(m: Measurements, params: TeePanelParams): {
  readonly pieces: Readonly<Record<string, Piece>>;
  readonly stitches: readonly Stitch[];
  readonly interfaces: Readonly<Record<string, ReturnType<typeof iface>>>;
} {
  const panelMeasurements = params.chestEase === undefined ? m : { ...m, ease: params.chestEase };
  const d = derive(panelMeasurements);
  const neck = necklineEdge(
    params.position,
    d.neckWidthHalf,
    params.position === "front" ? d.frontNeckDepth : d.backNeckDepth,
    d.shoulderHalf,
    panelMeasurements.armholeDepth,
    NECKLINE_DEFAULT,
  );
  const [neckline, raglanStart] = necklinePrefix(neck.edge, NECKLINE_SPLIT);
  const underarm = point(d.chestWidthHalf, panelMeasurements.armholeDepth);
  const sideHem = point(d.chestWidthHalf, panelMeasurements.length);
  const hemFold = point(0, panelMeasurements.length);
  const centerName = params.position === "front" ? "centerFront" : "centerBack";
  const raglan: Edge = { kind: "curve", name: "raglan", curve: bodyRaglanCurve(raglanStart, underarm) };
  const piece: Piece = {
    name: params.position,
    onFold: true,
    edges: [
      neckline,
      raglan,
      { kind: "line", name: "side", start: underarm, end: sideHem },
      { kind: "line", name: "hem", start: sideHem, end: hemFold },
      { kind: "line", name: centerName, start: hemFold, end: edgeStart(neckline) },
    ],
  };
  return {
    pieces: { [params.position]: piece },
    stitches: [],
    interfaces: { raglan: iface(edgeRef(params.position, "raglan")) },
  };
}

export function curveAtLength(start: Point, end: Point, targetLength: number, direction: 1 | -1): CubicBezier {
  const chord = distance(start, end);
  const normal = chord === 0 ? point(0, 0) : point(-(end.y - start.y) / chord, (end.x - start.x) / chord);
  const curveAt = (bend: number): CubicBezier => {
    const c1 = lerp(start, end, 1 / 3);
    const c2 = lerp(start, end, 2 / 3);
    return {
      start,
      control1: point(c1.x + normal.x * bend * direction, c1.y + normal.y * bend * direction),
      control2: point(c2.x + normal.x * bend * direction, c2.y + normal.y * bend * direction),
      end,
    };
  };
  if (!Number.isFinite(targetLength) || targetLength <= chord) return curveAt(0);
  let low = 0;
  let high = Math.max(targetLength, 1);
  for (let i = 0; i < 48 && cubicLength(curveAt(high)) < targetLength; i++) high *= 2;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (cubicLength(curveAt(mid)) < targetLength) low = mid;
    else high = mid;
  }
  return curveAt((low + high) / 2);
}

interface RaglanSleeveParams {
  readonly frontLength: number;
  readonly backLength: number;
}

const raglanSleeve: Component<RaglanSleeveParams> = (m, params) => {
  const width = m.bicep + m.ease * 0.5;
  const underarmY = m.armholeDepth * SLEEVE_UNDERARM_DEPTH_FACTOR;
  const neckSpread = derive(m).neckWidthHalf * NECKLINE_SPREAD_FACTOR;
  const frontNeck = point(width / 2 - neckSpread / 2, 0);
  const backNeck = point(width / 2 + neckSpread / 2, 0);
  const frontUnderarm = point(0, underarmY);
  const backUnderarm = point(width, underarmY);
  const taper = 3;
  const hemY = m.sleeveLength;
  const leftHem = point(taper, hemY);
  const rightHem = point(width - taper, hemY);
  const frontCurve = curveAtLength(frontUnderarm, frontNeck, params.frontLength, -1);
  const backCurve = curveAtLength(backNeck, backUnderarm, params.backLength, 1);
  const sleeve: Piece = {
    name: "sleeve",
    onFold: false,
    edges: [
      { kind: "curve", name: "frontRaglan", curve: frontCurve },
      { kind: "line", name: "neckline", start: frontNeck, end: backNeck },
      { kind: "curve", name: "backRaglan", curve: backCurve },
      { kind: "line", name: "sideRight", start: backUnderarm, end: rightHem },
      { kind: "line", name: "hem", start: rightHem, end: leftHem },
      { kind: "line", name: "sideLeft", start: leftHem, end: frontUnderarm },
    ],
  };
  return { pieces: { sleeve }, stitches: [], interfaces: {} };
};

export const TEE_RAGLAN_STITCHES: readonly Stitch[] = [
  {
    label: "Front raglan seam (body ↔ sleeve)",
    a: iface(edgeRef("front", "raglan")),
    b: iface(edgeRef("sleeve", "frontRaglan", true)),
  },
  {
    label: "Back raglan seam (body ↔ sleeve)",
    a: iface(edgeRef("back", "raglan")),
    b: iface(edgeRef("sleeve", "backRaglan")),
  },
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "side")),
    b: iface(edgeRef("back", "side")),
  },
  {
    label: "Sleeve underarm (left ↔ right)",
    a: iface(edgeRef("sleeve", "sideLeft", true)),
    b: iface(edgeRef("sleeve", "sideRight")),
  },
  {
    label: "Continuous side-to-cuff path (front body + sleeve ↔ sleeve + back body)",
    a: iface(edgeRef("front", "side", true), edgeRef("sleeve", "sideLeft", true)),
    b: iface(edgeRef("sleeve", "sideRight", true), edgeRef("back", "side")),
  },
];

export const TEE_RAGLAN_GRAMMAR = garmentGrammar(
  "tee-raglan",
  [
    componentNode("front", "raglan-bodice", raglanBodice, (context) => ({
      position: "front" as const,
      ...(context.options.chestEase === undefined ? {} : { chestEase: context.options.chestEase }),
    })),
    componentNode("back", "raglan-bodice", raglanBodice, (context) => ({
      position: "back" as const,
      ...(context.options.chestEase === undefined ? {} : { chestEase: context.options.chestEase }),
    })),
    componentNode(
      "sleeve",
      "raglan-sleeve",
      raglanSleeve,
      (context: CompositionContext) => ({
        frontLength: context.interfaceLength("front", "raglan"),
        backLength: context.interfaceLength("back", "raglan"),
      }),
      ["front", "back"],
    ),
  ],
  () => TEE_RAGLAN_STITCHES,
);

export const TEE_RAGLAN_PANEL_CHECKS = sleevedTopPanelChecks(true);

export function draftRaglanTshirt(m: Measurements, options: GarmentOptions = {}): Block {
  return composeBlock(TEE_RAGLAN_GRAMMAR, m, options);
}

const FRONT_RAGLAN = TEE_RAGLAN_STITCHES[0]!;
const BACK_RAGLAN = TEE_RAGLAN_STITCHES[1]!;
const BODY_SIDE = TEE_RAGLAN_STITCHES[2]!;
const SLEEVE_UNDERARM = TEE_RAGLAN_STITCHES[3]!;

export const TEE_RAGLAN_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      matchedNotch(FRONT_RAGLAN, "a", 0.5),
      matchedNotch(BODY_SIDE, "a", 0.5),
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(BACK_RAGLAN, "a", 0.5),
      matchedNotch(BACK_RAGLAN, "a", 0.66),
      matchedNotch(BODY_SIDE, "b", 0.5),
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "sleeve",
    notches: [
      matchedNotch(FRONT_RAGLAN, "b", 0.5),
      matchedNotch(BACK_RAGLAN, "b", 0.5),
      matchedNotch(BACK_RAGLAN, "b", 0.66),
      matchedNotch(SLEEVE_UNDERARM, "a", 0.5),
      matchedNotch(SLEEVE_UNDERARM, "b", 0.5),
    ],
    grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
] as const;

const raglanPom = (label: string, measure: (block: Block) => number): Pom => ({ label, tolerance: 0.6, measure });

export const TEE_RAGLAN_POMS: readonly Pom[] = [
  raglanPom("Body chest (finished)", (block) => 4 * spanX(rolePiece(block, "front"),
    { edge: "side", at: "start" }, { edge: "centerFront", at: "start" })),
  raglanPom("Body length (raglan neck join–hem)", (block) => spanY(rolePiece(block, "front"),
    { edge: "raglan", at: "start" }, { edge: "hem", at: "start" })),
  raglanPom("Front raglan seam (digital)", (block) => seam(rolePiece(block, "front"), "raglan")),
  raglanPom("Back raglan seam (digital)", (block) => seam(rolePiece(block, "back"), "raglan")),
  raglanPom("Neck width at raglan join", (block) => 2 * edgeStart(pieceEdge(rolePiece(block, "front"), "raglan")).x),
  raglanPom("Front neck depth to raglan join", (block) => spanY(rolePiece(block, "front"),
    { edge: "neckline", at: "start" }, { edge: "neckline", at: "end" })),
  raglanPom("Sleeve length (neck edge–hem)", (block) => spanY(rolePiece(block, "sleeve"),
    { edge: "neckline", at: "start" }, { edge: "hem", at: "start" })),
  raglanPom("Sleeve bicep width", (block) => spanX(rolePiece(block, "sleeve"),
    { edge: "sideLeft", at: "end" }, { edge: "sideRight", at: "start" })),
  raglanPom("Sleeve hem", (block) => seam(rolePiece(block, "sleeve"), "hem")),
];

export function raglanTeeGuidance(block: Block, m: Measurements, options: Record<string, number> = {}): Note[] {
  const notes: Note[] = [easeRange(m, "raglan tee")];
  const depth = armholeDepthCheck(m);
  if (depth) notes.push(depth);
  const underarmDepth = m.armholeDepth * SLEEVE_UNDERARM_DEPTH_FACTOR;
  if (m.sleeveLength <= underarmDepth) {
    notes.push({
      level: "warn",
      field: "sleeveLength",
      text: `Sleeve length (${m.sleeveLength} cm) does not extend below the modeled underarm (${underarmDepth.toFixed(1)} cm). Increase sleeve length or reduce armhole depth; the input was kept unchanged.`,
    });
  }
  for (const result of stitchChecks(block, block.stitches).filter((check) => !check.ok)) {
    const raglan = result.name.toLowerCase().includes("raglan");
    notes.push({
      level: "warn",
      field: raglan ? "bicep" : "sleeveLength",
      text: `${result.name}: ${result.detail}. Review bicep width, sleeve length, or armhole depth; the entered measurements were kept unchanged.`,
    });
  }
  if (hasTeeNecklineOverride(options)) {
    notes.push({
      level: "info",
      field: "teeConstruction",
      text: "Raglan is crew-neck only. Saved V-neck or Scoop settings are inactive while Raglan is selected; choose Set-in to reactivate them.",
    });
  }
  return notes;
}

export function raglanNecklineLength(block: Block): number {
  const front = rolePiece(block, "front");
  const back = rolePiece(block, "back");
  const sleeve = rolePiece(block, "sleeve");
  return 2 * (edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline"))
    + edgeLength(pieceEdge(sleeve, "neckline")));
}
