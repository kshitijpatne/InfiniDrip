import { edgeEnd, edgeLength, edgeStart, type Edge, type Piece } from "../drafting/piece";
import type { Block } from "../drafting/block";
import type { EdgeRef, InterfaceRef, Stitch } from "../drafting/stitch";
import { cubicLength, cubicPoint } from "../geometry/curve";
import { WOVEN_SHIRT_PHYSICAL_ROLES } from "../drafting/shirt-contract";
import { G04_TECHNICAL_FLAT_MAPPINGS, type FlatRoleTreatment } from "./technical-flat-mapping";
import type { TechnicalFlatViewKind } from "./technical-flat";

export type FlatProjectionLandmark =
  | { readonly kind: "edge-endpoint"; readonly edgeId: string; readonly endpoint: "start" | "end" }
  | { readonly kind: "edge-arclength"; readonly edgeId: string; readonly fraction: number }
  | { readonly kind: "normalized-edge-transfer"; readonly edgeId: string; readonly fraction: number;
    readonly basis: "POLO_COLLAR_BASE" | "WOVEN_NECKLINE";
    readonly decisionId: "G04-S321-COLLAR-EXTERIOR-ARCLENGTH" }
  | { readonly kind: "normalized-edge-transfer"; readonly edgeId: string; readonly fraction: number;
    readonly basis: "WOVEN_SLEEVE_CAP";
    readonly decisionId: "G04-S321-WOVEN-SLEEVE-CAP-ARCLENGTH" }
  | { readonly kind: "pattern-mark"; readonly markId: string; readonly point: "at" | "start" | "end" }
  | {
    readonly kind: "stitch-interface-boundary";
    readonly stitchLabel: string;
    readonly boundarySide: "a" | "b";
    readonly afterEdgeIndex: number;
    readonly faceSegmentEdgeIndex: number;
    readonly receiverSide: "a" | "b";
    readonly receiverEdgeIndex: number;
    readonly pairedEdgeId?: string;
  };

export interface FlatProjectionEdgeRun {
  readonly edgeId: string;
  readonly from: FlatProjectionLandmark;
  readonly to: FlatProjectionLandmark;
}

export interface FlatProjectionHeldEdge {
  readonly edgeId: string;
  readonly reason: string;
}

export interface FlatProjectionFoldAxisReflection {
  /** The authored boundary edge that lies on the local garment centre axis. */
  readonly edgeId: string;
  readonly axis: "LOCAL_Y";
  readonly source: "Piece.onFold";
  /** Use a sewn-to panel's center axis for a source-derived component segment. */
  readonly axisRoleId?: string;
  readonly viaStitchLabel?: string;
}

/** A source-declared mirrored pair of separate pieces, distinct from on-fold. */
export interface FlatProjectionPhysicalPairReflection {
  readonly edgeId: string;
  readonly axis: "LOCAL_Y";
  readonly source: "WOVEN_SHIRT_PHYSICAL_ROLES";
  readonly quantity: 2;
}

/** A maintainer-approved second display instance reflected across the exact
 * assembled body center axis. This describes a view convention, not a second
 * cut piece in the source block. */
export interface FlatProjectionViewPairReflection {
  readonly axisRoleId: "front" | "back";
  readonly edgeId: "centerFront" | "centerBack";
  readonly axis: "ASSEMBLED_BODY_CENTER";
  readonly source: "MAINTAINER_VIEW_DECISION" | "WOVEN_SHIRT_PHYSICAL_ROLES";
  readonly decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" | "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR";
  readonly quantity: 2;
}

/** Place the one source-declared left buttonhole placket on its opposite
 * front half while retaining the stitch solver's attachment to front CF. */
export interface FlatProjectionOppositeSideReflection {
  readonly axisRoleId: "front";
  readonly edgeId: "centerFront";
  readonly source: "MAINTAINER_VIEW_DECISION";
  readonly decisionId: "G04-S321-WOVEN-CLOSURE-A";
  readonly side: "LEFT";
  readonly quantity: 1;
}

export interface FlatProjectionViewBoundary {
  readonly id: string;
  readonly from: FlatProjectionLandmark;
  readonly to: FlatProjectionLandmark;
  readonly fillOnlyColorway?: {
    readonly source: "MAINTAINER_VIEW_DECISION";
    readonly decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR";
  };
}

/** Face-local traversal correction for a sewn interface. This affects only
 * rigid placement correspondence; the drafted stitch references stay intact. */
export interface FlatProjectionReversedStitchEdge {
  readonly stitchLabel: "Sleeve-cap ease";
  readonly pieceId: "front";
  readonly edgeId: "armhole";
  readonly source: "SOURCE_ENDPOINT_ORDER";
}

/** A local-Y view reflection used to place the selected back-side sleeve edge
 * on the exterior side of its face while retaining its source edge identity. */
export interface FlatProjectionLocalYReflection {
  readonly axis: "LOCAL_Y";
  readonly basis: "APPROVED_VIEW_CONVENTION";
  readonly decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR";
}

export interface FlatProjectionRole {
  readonly roleId: string;
  /** A logical garment-component identity shared by its front/back projections. */
  readonly instanceId: string;
  readonly treatment: FlatRoleTreatment;
  readonly runs: readonly FlatProjectionEdgeRun[];
  /** Every unprojected source edge remains accounted for as an explicit hold. */
  readonly heldEdges: readonly FlatProjectionHeldEdge[];
  /** Source-authored contour belongs to the opposite orthographic face. */
  readonly faceExcludedEdges?: readonly FlatProjectionHeldEdge[];
  /** View-only reflection across a source-declared cut-on-fold boundary. */
  readonly foldAxisReflection?: FlatProjectionFoldAxisReflection;
  /** View-only second instance for an explicitly authored mirrored physical pair. */
  readonly physicalPairReflection?: FlatProjectionPhysicalPairReflection;
  readonly viewPairReflection?: FlatProjectionViewPairReflection;
  readonly oppositeSideReflection?: FlatProjectionOppositeSideReflection;
  readonly reversedStitchEdges?: readonly FlatProjectionReversedStitchEdge[];
  readonly localYReflection?: FlatProjectionLocalYReflection;
  /** View-only closure for a face segment; it is not a drafted cut or seam edge. */
  readonly viewBoundaries?: readonly FlatProjectionViewBoundary[];
}

export interface FlatProjectionFace {
  readonly kind: TechnicalFlatViewKind;
  readonly roles: readonly FlatProjectionRole[];
}

/** Explicit edge-to-face metadata. Revision binding is supplied by the exact
 * live draft and must match before any mapped geometry can be emitted. */
export interface TechnicalFlatProjectionMap {
  readonly version: 1;
  readonly recipeId: string;
  readonly revisionId: string;
  readonly faces: readonly [FlatProjectionFace, FlatProjectionFace];
}

/** Source roles whose face-visible contour cannot be split from existing
 * authored edge/mark landmarks. Keep the whole affected face unresolved until
 * construction-source landmarks and instance rules are available. */
export const G04_UNRESOLVED_PROJECTION_ROLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  tee: {},
  fitted: {},
  polo: {},
  "woven-shirt": {},
};

/** A cut-on-fold construction does not always describe garment centre
 * symmetry. The skirt waistband fold is the folded strip edge, so its source
 * segment is shown once rather than reflected into a full circumference. */
export const G04_NON_MIRRORED_ON_FOLD_ROLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  skirt: {
    waistband: "The waistband fold is the folded strip edge, not a garment center axis; preserve its authored half-circumference view segment.",
  },
};

const FOLD_AXIS_EDGE_NAME = /^center(?:Front|Back)?$/i;

function foldAxisEdge(piece: Piece): Edge | undefined {
  if (!piece.onFold) return undefined;
  const candidates = piece.edges.filter((edge) => FOLD_AXIS_EDGE_NAME.test(edge.name));
  if (candidates.length !== 1 || candidates[0]?.kind !== "line") return undefined;
  const edge = candidates[0];
  if (edge.start.x !== 0 || edge.end.x !== 0) return undefined;
  const points = piece.edges.flatMap((candidate) => candidate.kind === "line"
    ? [candidate.start, candidate.end]
    : [candidate.curve.start, candidate.curve.control1, candidate.curve.control2, candidate.curve.end]);
  return points.every((point) => point.x >= 0) ? edge : undefined;
}

function wovenFrontPairAxis(piece: Piece): Edge | undefined {
  const candidates = piece.edges.filter((edge) => edge.name === "centerFront");
  if (candidates.length !== 1 || candidates[0]?.kind !== "line") return undefined;
  const edge = candidates[0];
  if (edge.start.x !== 0 || edge.end.x !== 0) return undefined;
  const points = piece.edges.flatMap((candidate) => candidate.kind === "line"
    ? [candidate.start, candidate.end]
    : [candidate.curve.start, candidate.curve.control1, candidate.curve.control2, candidate.curve.end]);
  return points.every((point) => point.x >= 0) ? edge : undefined;
}

function teeFittedSleeveProjection(
  kind: TechnicalFlatViewKind, block: Block, treatment: FlatRoleTreatment,
): FlatProjectionRole | undefined {
  const piece = block.roles.sleeve!;
  const axisRoleId = kind === "FRONT_FLAT" ? "front" : "back";
  const axisPiece = block.roles[axisRoleId];
  const axis = axisPiece && foldAxisEdge(axisPiece);
  const capLeft = piece.edges.find((edge) => edge.name === "capLeft");
  const capRight = piece.edges.find((edge) => edge.name === "capRight");
  const leftSide = piece.edges.find((edge) => edge.name === "sideLeft");
  const rightSide = piece.edges.find((edge) => edge.name === "sideRight");
  const hem = piece.edges.find((edge) => edge.name === "hem");
  const stitch = block.stitches.filter((candidate) => candidate.label === "Sleeve-cap ease");
  const exactStitch = stitch.length === 1
    && stitch[0]!.a.edges.length === 2 && stitch[0]!.b.edges.length === 2
    && stitch[0]!.a.edges[0]?.piece === "sleeve" && "edge" in stitch[0]!.a.edges[0]! && stitch[0]!.a.edges[0]!.edge === "capLeft"
    && stitch[0]!.a.edges[1]?.piece === "sleeve" && "edge" in stitch[0]!.a.edges[1]! && stitch[0]!.a.edges[1]!.edge === "capRight"
    && stitch[0]!.b.edges[0]?.piece === "front" && "edge" in stitch[0]!.b.edges[0]! && stitch[0]!.b.edges[0]!.edge === "armhole"
    && stitch[0]!.b.edges[1]?.piece === "back" && "edge" in stitch[0]!.b.edges[1]! && stitch[0]!.b.edges[1]!.edge === "armhole";
  const valid = !!axis && !!capLeft && capLeft.kind === "curve" && !!capRight && capRight.kind === "curve"
    && !!leftSide && leftSide.kind === "line" && !!rightSide && rightSide.kind === "line"
    && !!hem && hem.kind === "line" && exactStitch
    && samePoint(capLeft.curve.end, capRight.curve.start)
    && samePoint(capLeft.curve.start, leftSide.end)
    && samePoint(leftSide.start, hem.end)
    && samePoint(hem.start, rightSide.end)
    && samePoint(rightSide.start, capRight.curve.end);
  const reason = "The approved front/back sleeve projection requires the current ordered cap edges, straight hem and exact sewn-to on-fold body center axis.";
  const endpoint = (edgeId: string, value: "start" | "end"): FlatProjectionLandmark => ({ kind: "edge-endpoint", edgeId, endpoint: value });
  const midpoint: FlatProjectionLandmark = { kind: "edge-arclength", edgeId: "hem", fraction: 0.5 };
  const frontRuns: FlatProjectionEdgeRun[] = [
    { edgeId: "capLeft", from: endpoint("capLeft", "start"), to: endpoint("capLeft", "end") },
    { edgeId: "sideLeft", from: endpoint("sideLeft", "end"), to: endpoint("sideLeft", "start") },
    { edgeId: "hem", from: endpoint("hem", "end"), to: midpoint },
  ];
  const backRuns: FlatProjectionEdgeRun[] = [
    { edgeId: "capRight", from: endpoint("capRight", "start"), to: endpoint("capRight", "end") },
    { edgeId: "sideRight", from: endpoint("sideRight", "start"), to: endpoint("sideRight", "end") },
    { edgeId: "hem", from: endpoint("hem", "start"), to: midpoint },
  ];
  return {
    roleId: "sleeve", instanceId: "sleeve", treatment,
    runs: valid ? (kind === "FRONT_FLAT" ? frontRuns : backRuns) : [],
    heldEdges: valid ? [] : piece.edges.map((edge) => ({ edgeId: edge.name, reason })),
    faceExcludedEdges: valid
      ? (kind === "FRONT_FLAT"
        ? [{ edgeId: "capRight", reason: "Back-facing sleeve-cap interval is mapped to BACK_FLAT." },
          { edgeId: "sideRight", reason: "Back-facing sleeve side is mapped to BACK_FLAT." }]
        : [{ edgeId: "capLeft", reason: "Front-facing sleeve-cap interval is mapped to FRONT_FLAT." },
          { edgeId: "sideLeft", reason: "Front-facing sleeve side is mapped to FRONT_FLAT." }])
      : [],
    ...(valid ? { viewBoundaries: [{ id: "approved-sleeve-area-closure",
      from: midpoint,
      to: endpoint(kind === "FRONT_FLAT" ? "capLeft" : "capRight", kind === "FRONT_FLAT" ? "end" : "start"),
      fillOnlyColorway: { source: "MAINTAINER_VIEW_DECISION" as const,
        decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" as const },
    }] } : {}),
    ...(valid ? { viewPairReflection: {
      axisRoleId, edgeId: axis!.name as "centerFront" | "centerBack", axis: "ASSEMBLED_BODY_CENTER" as const,
      source: "MAINTAINER_VIEW_DECISION" as const, decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" as const, quantity: 2 as const,
    } } : {}),
    ...(valid && kind === "FRONT_FLAT" ? { reversedStitchEdges: [{
      stitchLabel: "Sleeve-cap ease" as const, pieceId: "front" as const,
      edgeId: "armhole" as const, source: "SOURCE_ENDPOINT_ORDER" as const,
    }] } : {}),
    ...(valid && kind === "BACK_FLAT" ? { localYReflection: {
      axis: "LOCAL_Y" as const, basis: "APPROVED_VIEW_CONVENTION" as const,
      decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" as const,
    } } : {}),
  };
}

function wovenSleeveCapBoundary(block: Block): { edgeId: "capLeft" | "capRight"; fraction: number } | undefined {
  const matches = block.stitches.filter((stitch) => stitch.label === "Woven sleeve-cap ease");
  const stitch = matches[0];
  const expected = [
    ["front", "armhole"], ["yoke", "armholeUpper"], ["back", "armholeLower"],
  ] as const;
  const capRefs = stitch?.a.edges;
  const bodyRefs = stitch?.b.edges;
  const exactRefs = (refs: readonly InterfaceRef[] | undefined, parts: readonly (readonly [string, string])[]) =>
    refs?.length === parts.length && refs.every((ref, index) => "edge" in ref
      && ref.piece === parts[index]?.[0] && ref.edge === parts[index]?.[1] && !ref.reversed);
  if (matches.length !== 1 || !stitch || stitch.ease?.lo !== -1 || stitch.ease.hi !== 4
    || !exactRefs(capRefs, [["sleeve", "capLeft"], ["sleeve", "capRight"]])
    || !exactRefs(bodyRefs, expected)) return undefined;
  const sleeve = block.roles.sleeve;
  const front = block.roles.front;
  const yoke = block.roles.yoke;
  const back = block.roles.back;
  const capLeft = sleeve?.edges.find((edge) => edge.name === "capLeft");
  const capRight = sleeve?.edges.find((edge) => edge.name === "capRight");
  const frontArmhole = front?.edges.find((edge) => edge.name === "armhole");
  const yokeArmhole = yoke?.edges.find((edge) => edge.name === "armholeUpper");
  const backArmhole = back?.edges.find((edge) => edge.name === "armholeLower");
  if (!sleeve || !capLeft || capLeft.kind !== "curve" || !capRight || capRight.kind !== "curve"
    || !frontArmhole || !yokeArmhole || !backArmhole) return undefined;
  const leftLength = edgeLength(capLeft);
  const rightLength = edgeLength(capRight);
  const capLength = leftLength + rightLength;
  const frontLength = edgeLength(frontArmhole);
  const bodyLength = frontLength + edgeLength(yokeArmhole) + edgeLength(backArmhole);
  if (!(leftLength > 0) || !(rightLength > 0) || !(frontLength > 0) || !(bodyLength > frontLength)) return undefined;
  const transferredLength = (frontLength / bodyLength) * capLength;
  if (transferredLength < leftLength) {
    const fraction = transferredLength / leftLength;
    return { edgeId: "capLeft", fraction };
  }
  const fraction = (transferredLength - leftLength) / rightLength;
  return { edgeId: "capRight", fraction };
}

function wovenSleeveProjection(kind: TechnicalFlatViewKind, block: Block, treatment: FlatRoleTreatment): FlatProjectionRole {
  const piece = block.roles.sleeve!;
  const boundary = wovenSleeveCapBoundary(block);
  const capLeft = piece.edges.find((edge) => edge.name === "capLeft");
  const capRight = piece.edges.find((edge) => edge.name === "capRight");
  const sideLeft = piece.edges.find((edge) => edge.name === "sideLeft");
  const sideRight = piece.edges.find((edge) => edge.name === "sideRight");
  const hem = piece.edges.find((edge) => edge.name === "hem");
  const valid = !!boundary && capLeft?.kind === "curve" && capRight?.kind === "curve"
    && sideLeft?.kind === "line" && sideRight?.kind === "line" && hem?.kind === "line"
    && samePoint(edgeStart(hem), edgeEnd(sideRight)) && samePoint(edgeStart(sideLeft), edgeEnd(hem));
  const reason = "The approved Woven sleeve-cap arclength boundary or closed sleeve edge order does not resolve on the exact current stitched Block.";
  if (!valid || !boundary || !capLeft || !capRight || !sideLeft || !sideRight || !hem) {
    return heldProjectionRole("sleeve", treatment, piece, reason);
  }
  const station: FlatProjectionLandmark = { kind: "normalized-edge-transfer", edgeId: boundary.edgeId,
    fraction: boundary.fraction, basis: "WOVEN_SLEEVE_CAP", decisionId: "G04-S321-WOVEN-SLEEVE-CAP-ARCLENGTH" };
  const start = (edgeId: string): FlatProjectionLandmark => endpointLandmark(edgeId, "start");
  const end = (edgeId: string): FlatProjectionLandmark => endpointLandmark(edgeId, "end");
  const middle: FlatProjectionLandmark = { kind: "edge-arclength", edgeId: "hem", fraction: 0.5 };
  const frontRuns: FlatProjectionEdgeRun[] = boundary.edgeId === "capLeft"
    ? [{ edgeId: "capLeft", from: start("capLeft"), to: station },
      { edgeId: "sideLeft", from: end("sideLeft"), to: start("sideLeft") },
      { edgeId: "hem", from: end("hem"), to: middle }]
    : [{ edgeId: "capLeft", from: start("capLeft"), to: end("capLeft") },
      { edgeId: "capRight", from: start("capRight"), to: station },
      { edgeId: "sideLeft", from: end("sideLeft"), to: start("sideLeft") },
      { edgeId: "hem", from: end("hem"), to: middle }];
  const backRuns: FlatProjectionEdgeRun[] = boundary.edgeId === "capLeft"
    ? [{ edgeId: "capLeft", from: station, to: end("capLeft") },
      { edgeId: "capRight", from: start("capRight"), to: end("capRight") },
      { edgeId: "sideRight", from: start("sideRight"), to: end("sideRight") },
      { edgeId: "hem", from: start("hem"), to: middle }]
    : [{ edgeId: "capRight", from: station, to: end("capRight") },
      { edgeId: "sideRight", from: start("sideRight"), to: end("sideRight") },
      { edgeId: "hem", from: start("hem"), to: middle }];
  const yokeAxis = kind === "FRONT_FLAT" ? "centerFront" : "centerBack";
  return {
    roleId: "sleeve", instanceId: "sleeve", treatment,
    runs: kind === "FRONT_FLAT" ? frontRuns : backRuns,
    heldEdges: [],
    faceExcludedEdges: kind === "FRONT_FLAT"
      ? [...(boundary.edgeId === "capLeft" ? [{ edgeId: "capRight",
        reason: "The complementary Woven sleeve-cap suffix belongs to BACK_FLAT." }] : []),
      { edgeId: "sideRight", reason: "The back-facing Woven sleeve side belongs to BACK_FLAT." }]
      : [...(boundary.edgeId === "capRight" ? [{ edgeId: "capLeft",
        reason: "The complementary Woven sleeve-cap prefix belongs to FRONT_FLAT." }] : []),
      { edgeId: "sideLeft", reason: "The front-facing Woven sleeve side belongs to FRONT_FLAT." }],
    viewPairReflection: { axisRoleId: kind === "FRONT_FLAT" ? "front" : "back", edgeId: yokeAxis,
      axis: "ASSEMBLED_BODY_CENTER", source: "WOVEN_SHIRT_PHYSICAL_ROLES",
      decisionId: "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR", quantity: 2 },
  };
}

function wovenSleeveBandProjection(
  kind: TechnicalFlatViewKind, block: Block, treatment: FlatRoleTreatment,
): FlatProjectionRole {
  const piece = block.roles.sleeveBand!;
  const band = block.stitches.filter((stitch) => stitch.label === "Folded sleeve band ↔ sleeve hem");
  const stitch = band[0];
  const valid = band.length === 1 && !!stitch && stitch.ease === undefined
    && stitch.a.edges.length === 1 && stitch.b.edges.length === 1
    && "edge" in stitch.a.edges[0]! && stitch.a.edges[0]!.piece === "sleeveBand" && stitch.a.edges[0]!.edge === "top"
    && "edge" in stitch.b.edges[0]! && stitch.b.edges[0]!.piece === "sleeve" && stitch.b.edges[0]!.edge === "hem"
    && piece.edges.some((edge) => edge.name === "top") && piece.edges.some((edge) => edge.name === "bottom")
    && piece.marks?.some((mark) => mark.name === "bandFold");
  if (!valid) return heldProjectionRole("sleeveBand", treatment, piece,
    "The approved Woven sleeve-band pair lacks the exact same-revision top-to-hem stitch or authored fold mark.");
  const axisRoleId = kind === "FRONT_FLAT" ? "front" : "back";
  const edgeId = kind === "FRONT_FLAT" ? "centerFront" : "centerBack";
  return {
    roleId: "sleeveBand", instanceId: "sleeveBand", treatment,
    runs: piece.edges.map((edge) => ({ edgeId: edge.name,
      from: endpointLandmark(edge.name, "start"), to: endpointLandmark(edge.name, "end") })),
    heldEdges: [],
    viewPairReflection: { axisRoleId, edgeId, axis: "ASSEMBLED_BODY_CENTER",
      source: "WOVEN_SHIRT_PHYSICAL_ROLES", decisionId: "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR", quantity: 2 },
  };
}

function wovenPlacketSideProjection(block: Block): FlatProjectionOppositeSideReflection | undefined {
  const matches = block.stitches.filter((stitch) => stitch.label === "Buttonhole placket ↔ left front centre front");
  const stitch = matches[0];
  const rightMatches = block.stitches.filter((candidate) => candidate.label === "Button placket ↔ right front centre front");
  const right = rightMatches[0];
  const axis = block.roles.front && wovenFrontPairAxis(block.roles.front);
  if (matches.length !== 1 || !stitch || stitch.ease !== undefined || !axis
    || rightMatches.length !== 1 || !right || right.ease !== undefined
    || stitch.a.edges.length !== 1 || stitch.b.edges.length !== 1
    || !("edge" in stitch.a.edges[0]!) || stitch.a.edges[0]!.piece !== "buttonholePlacket"
    || stitch.a.edges[0]!.edge !== "attachmentRaw"
    || !("edge" in stitch.b.edges[0]!) || stitch.b.edges[0]!.piece !== "front"
    || stitch.b.edges[0]!.edge !== "centerFront"
    || right.a.edges.length !== 1 || right.b.edges.length !== 1
    || !("edge" in right.a.edges[0]!) || right.a.edges[0]!.piece !== "buttonPlacket"
    || right.a.edges[0]!.edge !== "attachmentRaw"
    || !("edge" in right.b.edges[0]!) || right.b.edges[0]!.piece !== "front"
    || right.b.edges[0]!.edge !== "centerFront") return undefined;
  return { axisRoleId: "front", edgeId: "centerFront", source: "MAINTAINER_VIEW_DECISION",
    decisionId: "G04-S321-WOVEN-CLOSURE-A", side: "LEFT", quantity: 1 };
}

function transferredLandmark(edgeId: string, fraction: number, basis: "POLO_COLLAR_BASE" | "WOVEN_NECKLINE"): FlatProjectionLandmark {
  return { kind: "normalized-edge-transfer", edgeId, fraction, basis, decisionId: "G04-S321-COLLAR-EXTERIOR-ARCLENGTH" };
}

function endpointLandmark(edgeId: string, endpoint: "start" | "end"): FlatProjectionLandmark {
  return { kind: "edge-endpoint", edgeId, endpoint };
}

function heldProjectionRole(roleId: string, treatment: FlatRoleTreatment, piece: Piece, reason: string): FlatProjectionRole {
  return { roleId, instanceId: roleId, treatment, runs: [],
    heldEdges: piece.edges.map((edge) => ({ edgeId: edge.name, reason })) };
}

function poloOuterStandProjection(kind: TechnicalFlatViewKind, piece: Piece, treatment: FlatRoleTreatment): FlatProjectionRole {
  const centerBack = piece.edges.find((edge) => edge.name === "centerBack");
  const backCollar = piece.edges.find((edge) => edge.name === "backCollar");
  const frontCollar = piece.edges.find((edge) => edge.name === "frontCollar");
  const frontEnd = piece.edges.find((edge) => edge.name === "frontEnd");
  const frontNeckline = piece.edges.find((edge) => edge.name === "frontNeckline");
  const backNeckline = piece.edges.find((edge) => edge.name === "backNeckline");
  const centerBackAxis = centerBack && foldAxisEdge(piece);
  const valid = piece.onFold && centerBack?.kind === "line" && centerBackAxis?.name === centerBack.name
    && !!backCollar && !!frontCollar && !!frontEnd && !!frontNeckline && !!backNeckline
    && samePoint(edgeEnd(centerBack), edgeStart(backCollar))
    && samePoint(edgeEnd(backCollar), edgeStart(frontCollar))
    && samePoint(edgeEnd(frontCollar), edgeStart(frontEnd))
    && samePoint(edgeEnd(frontEnd), edgeStart(frontNeckline))
    && samePoint(edgeEnd(frontNeckline), edgeStart(backNeckline))
    && samePoint(edgeEnd(backNeckline), edgeStart(centerBack));
  if (!valid || !backCollar || !frontCollar || !frontEnd || !frontNeckline || !backNeckline || !centerBack) {
    return heldProjectionRole("outerStand", treatment, piece,
      "The source-encoded Polo backCollar/frontCollar shoulder junction or closed on-fold stand edge order is inconsistent.");
  }
  const front = kind === "FRONT_FLAT";
  return {
    roleId: "outerStand", instanceId: "outerStand", treatment,
    runs: front ? [
      { edgeId: "frontCollar", from: endpointLandmark("frontCollar", "start"), to: endpointLandmark("frontCollar", "end") },
      { edgeId: "frontEnd", from: endpointLandmark("frontEnd", "start"), to: endpointLandmark("frontEnd", "end") },
      { edgeId: "frontNeckline", from: endpointLandmark("frontNeckline", "start"), to: endpointLandmark("frontNeckline", "end") },
    ] : [
      { edgeId: "backCollar", from: endpointLandmark("backCollar", "start"), to: endpointLandmark("backCollar", "end") },
      { edgeId: "backNeckline", from: endpointLandmark("backNeckline", "start"), to: endpointLandmark("backNeckline", "end") },
    ],
    heldEdges: [],
    faceExcludedEdges: front ? [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      { edgeId: "backCollar", reason: "The exact backCollar interval belongs to BACK_FLAT." },
      { edgeId: "backNeckline", reason: "The neckline back interval belongs to BACK_FLAT." },
    ] : [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      { edgeId: "frontCollar", reason: "The exact frontCollar interval belongs to FRONT_FLAT." },
      { edgeId: "frontEnd", reason: "The Polo stand front end belongs to FRONT_FLAT." },
      { edgeId: "frontNeckline", reason: "The neckline front interval belongs to FRONT_FLAT." },
    ],
    foldAxisReflection: { edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold" },
  };
}

function poloCollarPieceProjection(
  roleId: "upperCollar" | "underCollar", kind: TechnicalFlatViewKind, block: Block,
  piece: Piece, treatment: FlatRoleTreatment,
): FlatProjectionRole {
  const backBase = piece.edges.find((edge) => edge.name === "backCollarBase");
  const frontBase = piece.edges.find((edge) => edge.name === "frontCollarBase");
  const tip = piece.edges.find((edge) => edge.name === "frontTip");
  const outer = piece.edges.find((edge) => edge.name === "outer");
  const axis = foldAxisEdge(piece);
  const fraction = outer ? normalizedCollarTransferFraction(block, roleId, outer, "POLO_COLLAR_BASE") : undefined;
  if (!piece.onFold || axis?.name !== "centerBack" || !backBase || !frontBase || !tip || !outer || fraction === undefined) {
    return heldProjectionRole(roleId, treatment, piece,
      `The approved Polo ${roleId} base-to-outer collar arclength transfer does not resolve on the exact current stitch topology and center-back axis.`);
  }
  const station = transferredLandmark("outer", fraction, "POLO_COLLAR_BASE");
  const front = kind === "FRONT_FLAT";
  return {
    roleId, instanceId: roleId, treatment,
    runs: front ? [
      { edgeId: "frontCollarBase", from: endpointLandmark("frontCollarBase", "start"), to: endpointLandmark("frontCollarBase", "end") },
      { edgeId: "frontTip", from: endpointLandmark("frontTip", "start"), to: endpointLandmark("frontTip", "end") },
      { edgeId: "outer", from: endpointLandmark("outer", "start"), to: station },
    ] : [
      { edgeId: "backCollarBase", from: endpointLandmark("backCollarBase", "start"), to: endpointLandmark("backCollarBase", "end") },
      { edgeId: "outer", from: station, to: endpointLandmark("outer", "end") },
    ],
    heldEdges: [],
    faceExcludedEdges: front ? [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      { edgeId: "backCollarBase", reason: "The collar base back interval belongs to BACK_FLAT." },
    ] : [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      { edgeId: "frontCollarBase", reason: "The collar base front interval belongs to FRONT_FLAT." },
      { edgeId: "frontTip", reason: "The Polo front collar point belongs to FRONT_FLAT." },
    ],
    foldAxisReflection: { edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold" },
  };
}

function wovenCollarRoleProjection(
  roleId: "outerStand" | "upperCollar" | "underCollar", kind: TechnicalFlatViewKind,
  block: Block, piece: Piece, treatment: FlatRoleTreatment,
): FlatProjectionRole {
  const exteriorEdgeId = roleId === "outerStand" ? "collar" : "outer";
  const baseEdgeId = roleId === "outerStand" ? "neckline" : "stand";
  const frontEndEdgeId = roleId === "outerStand" ? "frontEnd" : "frontTip";
  const exterior = piece.edges.find((edge) => edge.name === exteriorEdgeId);
  const base = piece.edges.find((edge) => edge.name === baseEdgeId);
  const frontEnd = piece.edges.find((edge) => edge.name === frontEndEdgeId);
  const axis = foldAxisEdge(piece);
  const basisFraction = wovenNecklineFraction(block);
  const fraction = exterior ? normalizedCollarTransferFraction(block, roleId, exterior, "WOVEN_NECKLINE") : undefined;
  if (!piece.onFold || axis?.name !== "centerBack" || !exterior || !base || basisFraction === undefined || fraction === undefined
    || (roleId !== "outerStand" && !frontEnd)) {
    return heldProjectionRole(roleId, treatment, piece,
      `The approved Woven ${roleId} neckline-to-exterior transfer does not resolve on the exact current stitched neckline and center-back axis.`);
  }
  const station = transferredLandmark(exteriorEdgeId, fraction, "WOVEN_NECKLINE");
  const front = kind === "FRONT_FLAT";
  if (roleId === "outerStand") {
    return {
      roleId, instanceId: roleId, treatment,
      runs: front ? [
      { edgeId: "collar", from: station, to: endpointLandmark("collar", "end") },
      { edgeId: "frontEnd", from: endpointLandmark("frontEnd", "start"), to: endpointLandmark("frontEnd", "end") },
        { edgeId: "neckline", from: endpointLandmark("neckline", "start"), to: { kind: "edge-arclength", edgeId: "neckline", fraction: 1 - basisFraction } },
      ] : [
        { edgeId: "collar", from: endpointLandmark("collar", "start"), to: station },
        { edgeId: "neckline", from: { kind: "edge-arclength", edgeId: "neckline", fraction: 1 - basisFraction }, to: endpointLandmark("neckline", "end") },
      ],
      heldEdges: [],
      faceExcludedEdges: front ? [
        { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      ] : [
        { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
        { edgeId: "frontEnd", reason: "The stand front end belongs to FRONT_FLAT." },
      ],
      foldAxisReflection: { edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold" },
    };
  }
  return {
    roleId, instanceId: roleId, treatment,
    runs: front ? [
      { edgeId: "stand", from: { kind: "edge-arclength", edgeId: "stand", fraction: basisFraction }, to: endpointLandmark("stand", "end") },
      { edgeId: "frontTip", from: endpointLandmark("frontTip", "start"), to: endpointLandmark("frontTip", "end") },
      { edgeId: "outer", from: endpointLandmark("outer", "start"), to: station },
    ] : [
      { edgeId: "stand", from: endpointLandmark("stand", "start"), to: { kind: "edge-arclength", edgeId: "stand", fraction: basisFraction } },
      { edgeId: "outer", from: station, to: endpointLandmark("outer", "end") },
    ],
    heldEdges: [],
    faceExcludedEdges: front ? [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
    ] : [
      { edgeId: "centerBack", reason: "The source-declared center-back fold is the reflection axis." },
      { edgeId: "frontTip", reason: "The collar front point belongs to FRONT_FLAT." },
    ],
    foldAxisReflection: { edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold" },
  };
}

function isClosedWovenVent(piece: Piece, edge: Edge): boolean {
  if (edge.name !== "vent" || !samePoint(edgeStart(edge), edgeEnd(edge))) return false;
  const ventTop = piece.marks?.find((mark) => mark.name === "ventTop");
  const sideLower = piece.edges.find((candidate) => candidate.name === "sideLower");
  const hem = piece.edges.find((candidate) => candidate.name === "hem");
  return !!ventTop && "at" in ventTop && samePoint(ventTop.at, edgeStart(edge))
    && !!sideLower && samePoint(edgeEnd(sideLower), ventTop.at)
    && !!hem && samePoint(edgeStart(hem), ventTop.at);
}

/** Build the current per-recipe map from explicit V01 role membership and the
 * exact drafted edges. Whole-role contours are included only where the role
 * map defines their face membership; known unsplittable visible roles and
 * zero-length edges remain explicit holds. */
export function createG04TechnicalFlatProjectionMap(
  recipeId: string,
  block: Block,
  revisionId: string,
): TechnicalFlatProjectionMap | undefined {
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!mapping) return undefined;
  return {
    version: 1,
    recipeId,
    revisionId,
    faces: mapping.faces.map((face) => ({
      kind: face.kind,
      roles: face.roles.map((role) => {
        const piece = block.roles[role.roleId];
        if (!piece) {
          return { roleId: role.roleId, instanceId: role.roleId, treatment: role.treatment, runs: [], heldEdges: [] };
        }
        if (recipeId === "polo" && role.roleId === "outerStand") {
          return poloOuterStandProjection(face.kind, piece, role.treatment);
        }
        if (recipeId === "polo" && (role.roleId === "upperCollar" || role.roleId === "underCollar")) {
          return poloCollarPieceProjection(role.roleId, face.kind, block, piece, role.treatment);
        }
        if (recipeId === "woven-shirt" && role.roleId === "sleeve") {
          return wovenSleeveProjection(face.kind, block, role.treatment);
        }
        if (recipeId === "woven-shirt" && role.roleId === "sleeveBand") {
          return wovenSleeveBandProjection(face.kind, block, role.treatment);
        }
        if (recipeId === "woven-shirt" && (role.roleId === "outerStand"
          || role.roleId === "upperCollar" || role.roleId === "underCollar")) {
          return wovenCollarRoleProjection(role.roleId, face.kind, block, piece, role.treatment);
        }
        if (recipeId === "skirt" && role.roleId === "waistband") {
          const stitchLabel = "Waistband (front + back ↔ waistband)";
          const isFront = face.kind === "FRONT_FLAT";
          const boundary: FlatProjectionLandmark = {
            kind: "stitch-interface-boundary", stitchLabel, boundarySide: "a",
            afterEdgeIndex: 0, faceSegmentEdgeIndex: isFront ? 0 : 1,
            receiverSide: "b", receiverEdgeIndex: 0,
          };
          const topBoundary: FlatProjectionLandmark = { ...boundary, pairedEdgeId: "top" };
          const axisRoleId = isFront ? "front" : "back";
          const axisEdge = block.roles[axisRoleId] && foldAxisEdge(block.roles[axisRoleId]!);
          const heldRoleReason = axisEdge
            ? undefined
            : `The sewn-to ${axisRoleId} panel has no exact on-fold center axis for this waistband segment.`;
          const endpoint = (edgeId: string, point: "start" | "end"): FlatProjectionLandmark => ({
            kind: "edge-endpoint", edgeId, endpoint: point,
          });
          const runs: FlatProjectionEdgeRun[] = isFront
            ? [
              { edgeId: "seam", from: endpoint("seam", "start"), to: boundary },
              { edgeId: "top", from: topBoundary, to: endpoint("top", "end") },
              { edgeId: "end", from: endpoint("end", "start"), to: endpoint("end", "end") },
            ]
            : [
              { edgeId: "seam", from: boundary, to: endpoint("seam", "end") },
              { edgeId: "top", from: endpoint("top", "start"), to: topBoundary },
            ];
          return {
            roleId: role.roleId,
            instanceId: role.roleId,
            treatment: role.treatment,
            runs: heldRoleReason ? [] : runs,
            heldEdges: heldRoleReason ? piece.edges.map((edge) => ({ edgeId: edge.name, reason: heldRoleReason })) : [],
            faceExcludedEdges: heldRoleReason ? [] : [
              { edgeId: isFront ? "fold" : "end",
                reason: `This waistband edge is the opposite face segment's center end and is excluded from the ${isFront ? "front" : "back"} face.` },
              ...(!isFront ? [{ edgeId: "fold",
                reason: "The source-declared cut-on-fold edge is the back center axis and is not a visible garment boundary." }] : []),
            ],
            ...(!heldRoleReason && axisEdge ? {
              foldAxisReflection: {
                edgeId: axisEdge.name, axis: "LOCAL_Y" as const, source: "Piece.onFold" as const,
                axisRoleId, viaStitchLabel: stitchLabel,
              },
              viewBoundaries: [{ id: "side-seam-outline", from: topBoundary, to: boundary }],
            } : {}),
          };
        }
        if ((recipeId === "tee" || recipeId === "fitted") && role.roleId === "sleeve") {
          return teeFittedSleeveProjection(face.kind, block, role.treatment)!;
        }
        const nonMirrorReason = G04_NON_MIRRORED_ON_FOLD_ROLES[recipeId]?.[role.roleId];
        const axisEdge = role.treatment === "INTERIOR_HIDDEN" || nonMirrorReason ? undefined : foldAxisEdge(piece);
        const pairAxisEdge = recipeId === "woven-shirt" && face.kind === "FRONT_FLAT" && role.roleId === "front"
          ? wovenFrontPairAxis(piece) : undefined;
        const heldRoleReason = role.treatment === "INTERIOR_HIDDEN"
          ? `Interior role “${role.roleId}” is intentionally hidden in this exterior view.`
          : G04_UNRESOLVED_PROJECTION_ROLES[recipeId]?.[role.roleId]
            ?? (piece.onFold && !axisEdge && !nonMirrorReason
              ? "This on-fold role does not expose one explicit straight center/fold edge on local x=0 with the rest of the piece on one side."
              : undefined);
        const runs: FlatProjectionEdgeRun[] = [];
        const heldEdges: FlatProjectionHeldEdge[] = [];
        const faceExcludedEdges: FlatProjectionHeldEdge[] = [];
        for (const edge of piece.edges) {
          const start = edgeStart(edge);
          const end = edgeEnd(edge);
          if (recipeId === "woven-shirt" && isClosedWovenVent(piece, edge)) {
            faceExcludedEdges.push({ edgeId: edge.name,
              reason: "The source-drafted zero-depth vent is closed at ventTop and has no visible edge in this option state." });
          } else if (heldRoleReason) {
            heldEdges.push({ edgeId: edge.name, reason: heldRoleReason });
          } else if (axisEdge?.name === edge.name) {
            faceExcludedEdges.push({ edgeId: edge.name,
              reason: "This source-declared cut-on-fold edge is the merged garment center axis, not a visible exterior boundary." });
          } else if (pairAxisEdge?.name === edge.name) {
            faceExcludedEdges.push({ edgeId: edge.name,
              reason: "The source-declared separate-front pair shares this center-front attachment axis; do not draw it as an exterior edge." });
          } else if (start.x === end.x && start.y === end.y) {
            heldEdges.push({ edgeId: edge.name, reason: "This drafted edge has identical endpoints and cannot form a visible contour." });
          } else {
            runs.push({
              edgeId: edge.name,
              from: { kind: "edge-endpoint", edgeId: edge.name, endpoint: "start" },
              to: { kind: "edge-endpoint", edgeId: edge.name, endpoint: "end" },
            });
          }
        }
        return {
          roleId: role.roleId,
          instanceId: role.roleId,
          treatment: role.treatment,
          runs,
          heldEdges,
          ...(faceExcludedEdges.length > 0 ? { faceExcludedEdges } : {}),
          ...(axisEdge && !heldRoleReason ? { foldAxisReflection: { edgeId: axisEdge.name, axis: "LOCAL_Y" as const, source: "Piece.onFold" as const } } : {}),
          ...(pairAxisEdge ? { physicalPairReflection: {
            edgeId: pairAxisEdge.name, axis: "LOCAL_Y" as const, source: "WOVEN_SHIRT_PHYSICAL_ROLES" as const, quantity: 2 as const,
          } } : {}),
          ...(recipeId === "woven-shirt" && role.roleId === "buttonholePlacket"
            ? { oppositeSideReflection: wovenPlacketSideProjection(block) } : {}),
        };
      }),
    })) as unknown as TechnicalFlatProjectionMap["faces"],
  };
}

export type FlatProjectionIssueCode =
  | "UNSUPPORTED_RECIPE" | "INVALID_REVISION" | "REVISION_MISMATCH" | "INVALID_FACES"
  | "INVALID_FACE" | "DUPLICATE_FACE" | "MISSING_ROLE" | "UNEXPECTED_ROLE"
  | "DUPLICATE_ROLE" | "MISSING_INSTANCE" | "DUPLICATE_INSTANCE" | "INSTANCE_MISMATCH" | "TREATMENT_MISMATCH"
  | "MISSING_EDGE_ACCOUNTING" | "DUPLICATE_EDGE_ACCOUNTING" | "UNKNOWN_EDGE"
  | "INVALID_RUN_LANDMARK" | "LANDMARK_ROLE_MISMATCH" | "LANDMARK_EDGE_MISMATCH"
  | "LANDMARK_NOT_ON_EDGE" | "EMPTY_HOLD_REASON" | "RUN_ON_HIDDEN_ROLE" | "INVALID_FOLD_AXIS_REFLECTION"
  | "INVALID_PHYSICAL_PAIR_REFLECTION" | "INVALID_VIEW_PAIR_REFLECTION" | "INVALID_OPPOSITE_SIDE_REFLECTION"
  | "INVALID_COLLAR_TRANSFER" | "INVALID_WOVEN_SLEEVE_TRANSFER" | "INVALID_STITCH_BOUNDARY" | "INVALID_PAIRED_EDGE" | "INVALID_VIEW_BOUNDARY"
  | "INVALID_STITCH_ENDPOINT_ORIENTATION" | "INVALID_LOCAL_Y_REFLECTION";

export interface FlatProjectionIssue {
  readonly code: FlatProjectionIssueCode;
  readonly sourceId: string;
  readonly message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samePoint(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }): boolean {
  return a.x === b.x && a.y === b.y;
}

function pointAtEdgeEnd(edge: Edge, end: "start" | "end") {
  return end === "start" ? edgeStart(edge) : edgeEnd(edge);
}

function refsForSide(stitch: Stitch, side: "a" | "b") {
  return stitch[side].edges;
}

function edgeRefLine(block: Block, rawRef: unknown): { ref: EdgeRef; edge: Extract<Edge, { kind: "line" }>; roleId: string } | undefined {
  if (!isRecord(rawRef) || typeof rawRef.piece !== "string" || typeof rawRef.edge !== "string") return undefined;
  const piece = block.roles[rawRef.piece];
  const edge = piece?.edges.find((candidate) => candidate.name === rawRef.edge);
  if (!piece || !edge || edge.kind !== "line") return undefined;
  return { ref: rawRef as unknown as EdgeRef, edge, roleId: rawRef.piece };
}

function refEndpoints(entry: { ref: EdgeRef; edge: Extract<Edge, { kind: "line" }> }) {
  return entry.ref.reversed ? [entry.edge.end, entry.edge.start] as const : [entry.edge.start, entry.edge.end] as const;
}

function lineLength(edge: Extract<Edge, { kind: "line" }>) {
  return Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y);
}

function pointOnLine(edge: Extract<Edge, { kind: "line" }>, fraction: number) {
  return {
    x: edge.start.x + (edge.end.x - edge.start.x) * fraction,
    y: edge.start.y + (edge.end.y - edge.start.y) * fraction,
  };
}

function lerpPoint(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }, t: number) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function splitCubicAt(curve: Extract<Edge, { kind: "curve" }> ["curve"], t: number) {
  const p01 = lerpPoint(curve.start, curve.control1, t);
  const p12 = lerpPoint(curve.control1, curve.control2, t);
  const p23 = lerpPoint(curve.control2, curve.end, t);
  const p012 = lerpPoint(p01, p12, t);
  const p123 = lerpPoint(p12, p23, t);
  const split = lerpPoint(p012, p123, t);
  return {
    left: { start: curve.start, control1: p01, control2: p012, end: split },
    right: { start: split, control1: p123, control2: p23, end: curve.end },
  };
}

/** Resolve normalized edge arclength to its Bézier parameter using the
 * pattern engine's 64-chord length metric. */
export function edgeParameterAtArclengthFraction(edge: Edge, fraction: number): number | undefined {
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) return undefined;
  if (edge.kind === "line") return fraction;
  if (fraction === 0 || fraction === 1) return fraction;
  const target = cubicLength(edge.curve) * fraction;
  let low = 0;
  let high = 1;
  for (let index = 0; index < 32; index += 1) {
    const middle = (low + high) / 2;
    const partial = splitCubicAt(edge.curve, middle).left;
    if (cubicLength(partial) < target) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

function pointOnEdgeFraction(edge: Edge, fraction: number) {
  if (edge.kind === "line") return pointOnLine(edge, fraction);
  // Callers validate the fraction before resolving the point.
  return cubicPoint(edge.curve, edgeParameterAtArclengthFraction(edge, fraction)!);
}

function wovenNecklineFraction(block: Block): number | undefined {
  const matches = block.stitches.filter((candidate) => candidate.label === "Outer stand ↔ woven neckline");
  const stitch = matches[0];
  if (matches.length !== 1 || !stitch || stitch.ease !== undefined || stitch.a.edges.length !== 1 || stitch.b.edges.length !== 2) return undefined;
  const standRef = stitch.a.edges[0];
  const [frontRef, backRef] = stitch.b.edges;
  const expectedBack = block.roles.yoke ? "yoke" : "back";
  if (!standRef || !("edge" in standRef) || standRef.piece !== "outerStand" || standRef.edge !== "neckline"
    || standRef.reversed || !frontRef || !("edge" in frontRef) || frontRef.piece !== "front" || frontRef.edge !== "neckline" || frontRef.reversed
    || !backRef || !("edge" in backRef) || backRef.piece !== expectedBack || backRef.edge !== "neckline" || backRef.reversed) return undefined;
  const front = block.roles.front;
  const back = block.roles[expectedBack];
  const frontEdge = front?.edges.find((candidate) => candidate.name === "neckline");
  const backEdge = back?.edges.find((candidate) => candidate.name === "neckline");
  const standEdge = block.roles.outerStand?.edges.find((candidate) => candidate.name === "neckline");
  if (!frontEdge || !backEdge || !standEdge) return undefined;
  const shared = [edgeStart(frontEdge), edgeEnd(frontEdge)].filter((point) =>
    [edgeStart(backEdge), edgeEnd(backEdge)].some((other) => samePoint(point, other)));
  const frontLength = edgeLength(frontEdge);
  const backLength = edgeLength(backEdge);
  const total = frontLength + backLength;
  if (shared.length !== 1 || !(frontLength > 0) || !(backLength > 0)
    || Math.abs(edgeLength(standEdge) - total) > 1e-8) return undefined;
  return backLength / total;
}

function normalizedCollarTransferFraction(
  block: Block, roleId: string, edge: Edge, basis: "POLO_COLLAR_BASE" | "WOVEN_NECKLINE" | "WOVEN_SLEEVE_CAP",
): number | undefined {
  if (basis === "WOVEN_SLEEVE_CAP") {
    const boundary = wovenSleeveCapBoundary(block);
    return roleId === "sleeve" && boundary?.edgeId === edge.name ? boundary.fraction : undefined;
  }
  const piece = block.roles[roleId];
  const axis = piece && foldAxisEdge(piece);
  if (!piece?.onFold || axis?.name !== "centerBack") return undefined;
  if (basis === "POLO_COLLAR_BASE") {
    if ((roleId !== "upperCollar" && roleId !== "underCollar") || edge.name !== "outer") return undefined;
    const back = piece.edges.find((candidate) => candidate.name === "backCollarBase");
    const front = piece.edges.find((candidate) => candidate.name === "frontCollarBase");
    const outer = piece.edges.find((candidate) => candidate.name === "outer");
    const tip = piece.edges.find((candidate) => candidate.name === "frontTip");
    const fold = piece.edges.find((candidate) => candidate.name === "centerBack");
    const seamLabel = roleId === "upperCollar" ? "Upper collar ↔ inner stand" : "Under collar ↔ outer stand";
    const counterpartRole = roleId === "upperCollar" ? "innerStand" : "outerStand";
    const counterpart = block.roles[counterpartRole];
    const joins = block.stitches.filter((stitch) => stitch.label === seamLabel);
    const stitch = joins[0];
    const refs = stitch?.a.edges;
    const receiver = stitch?.b.edges;
    const receiverNames = roleId === "upperCollar" ? ["backCollar", "frontCollar"] : ["backCollar", "frontCollar"];
    const baseLength = back && front ? edgeLength(back) + edgeLength(front) : 0;
    if (!back || !front || !outer || outer !== edge || !tip || !fold || !counterpart || joins.length !== 1
      || !samePoint(edgeEnd(back), edgeStart(front)) || !samePoint(edgeEnd(front), edgeStart(tip))
      || !samePoint(edgeEnd(tip), edgeStart(outer)) || !samePoint(edgeEnd(outer), edgeStart(fold))
      || !stitch || stitch.ease !== undefined || !refs || refs.length !== 2 || !receiver || receiver.length !== 2
      || refs.some((ref, index) => !("edge" in ref) || ref.piece !== roleId || ref.edge !== (index === 0 ? "backCollarBase" : "frontCollarBase"))
      || receiver.some((ref, index) => !("edge" in ref) || ref.piece !== counterpartRole || ref.edge !== receiverNames[index])
      || !(baseLength > 0)) return undefined;
    return 1 - edgeLength(back) / baseLength;
  }
  const fraction = wovenNecklineFraction(block);
  if (fraction === undefined) return undefined;
  if (roleId === "outerStand" && edge.name === "collar") {
    const neckline = piece.edges.find((candidate) => candidate.name === "neckline");
    const underBase = block.roles.underCollar?.edges.find((candidate) => candidate.name === "stand");
    const joins = block.stitches.filter((stitch) => stitch.label === "Under collar ↔ outer stand");
    const stitch = joins[0];
    const ownRefs = stitch?.b.edges;
    const receiverRefs = stitch?.a.edges;
    return neckline && underBase && joins.length === 1 && !!stitch && stitch.ease === undefined
      && ownRefs?.length === 1 && "edge" in ownRefs[0]! && ownRefs[0]!.piece === "outerStand" && ownRefs[0]!.edge === "collar"
      && receiverRefs?.length === 1 && "edge" in receiverRefs[0]! && receiverRefs[0]!.piece === "underCollar" && receiverRefs[0]!.edge === "stand"
      && Math.abs(edgeLength(edge) - edgeLength(neckline)) <= 1e-8
      && Math.abs(edgeLength(edge) - edgeLength(underBase)) <= 1e-8 ? fraction : undefined;
  }
  if ((roleId === "upperCollar" || roleId === "underCollar") && edge.name === "outer") {
    const base = piece.edges.find((candidate) => candidate.name === "stand");
    const outer = piece.edges.find((candidate) => candidate.name === "outer");
    const centerBack = piece.edges.find((candidate) => candidate.name === "centerBack");
    const frontTip = piece.edges.find((candidate) => candidate.name === "frontTip");
    const receiverRole = roleId === "upperCollar" ? "innerStand" : "outerStand";
    const standStitchLabel = roleId === "upperCollar" ? "Upper collar ↔ inner stand" : "Under collar ↔ outer stand";
    const stitches = block.stitches.filter((stitch) => stitch.label === standStitchLabel);
    const stitch = stitches[0];
    const ownRefs = stitch?.a.edges;
    const receiverRefs = stitch?.b.edges;
    const receiverBase = block.roles[receiverRole]?.edges.find((candidate) => candidate.name === "collar");
    if (!base || !outer || outer !== edge || !centerBack || !frontTip || !receiverBase || stitches.length !== 1
      || !stitch || stitch.ease !== undefined || !ownRefs || ownRefs.length !== 1 || !receiverRefs || receiverRefs.length !== 1
      || !("edge" in ownRefs[0]!) || ownRefs[0]!.piece !== roleId || ownRefs[0]!.edge !== "stand"
      || !("edge" in receiverRefs[0]!) || receiverRefs[0]!.piece !== receiverRole || receiverRefs[0]!.edge !== "collar"
      || Math.abs(edgeLength(base) - edgeLength(receiverBase)) > 1e-8
      || !samePoint(edgeStart(base), edgeEnd(centerBack)) || !samePoint(edgeEnd(base), edgeStart(frontTip))
      || !samePoint(edgeEnd(frontTip), edgeStart(outer)) || !samePoint(edgeEnd(outer), edgeStart(centerBack))) return undefined;
    return 1 - fraction;
  }
  return undefined;
}

function pointForLandmark(
  roleId: string,
  faceKind: TechnicalFlatViewKind,
  edge: Edge,
  landmark: unknown,
  piece: Piece,
  block: Block,
  issues: FlatProjectionIssue[],
  sourceId: string,
) {
  if (!isRecord(landmark) || typeof landmark.kind !== "string") {
    issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Projection run has a malformed source landmark." });
    return undefined;
  }
  if (landmark.kind === "edge-endpoint") {
    if (landmark.edgeId !== edge.name) {
      issues.push({ code: "LANDMARK_EDGE_MISMATCH", sourceId, message: "Endpoint landmark must name the run's exact drafted edge." });
      return undefined;
    }
    if (landmark.endpoint !== "start" && landmark.endpoint !== "end") {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Endpoint landmark must select start or end." });
      return undefined;
    }
    return pointAtEdgeEnd(edge, landmark.endpoint);
  }
  if (landmark.kind === "edge-arclength") {
    if (landmark.edgeId !== edge.name
      || typeof landmark.fraction !== "number" || !Number.isFinite(landmark.fraction)
      || landmark.fraction <= 0 || landmark.fraction >= 1) {
      issues.push({ code: "LANDMARK_NOT_ON_EDGE", sourceId,
        message: "An interior arclength landmark must identify this source edge and a finite fraction strictly between its endpoints." });
      return undefined;
    }
    return pointOnEdgeFraction(edge, landmark.fraction);
  }
  if (landmark.kind === "normalized-edge-transfer") {
    const basis = landmark.basis === "POLO_COLLAR_BASE" || landmark.basis === "WOVEN_NECKLINE"
      || landmark.basis === "WOVEN_SLEEVE_CAP"
      ? landmark.basis : undefined;
    const approvedDecision = basis === "WOVEN_SLEEVE_CAP"
      ? landmark.decisionId === "G04-S321-WOVEN-SLEEVE-CAP-ARCLENGTH"
      : landmark.decisionId === "G04-S321-COLLAR-EXTERIOR-ARCLENGTH";
    const expected = approvedDecision && basis ? normalizedCollarTransferFraction(block, roleId, edge, basis) : undefined;
    if (landmark.edgeId !== edge.name || typeof landmark.fraction !== "number" || !Number.isFinite(landmark.fraction)
      || landmark.fraction <= 0 || landmark.fraction >= 1 || expected === undefined
      || Math.abs(expected - landmark.fraction) > 1e-10) {
      issues.push({ code: basis === "WOVEN_SLEEVE_CAP" ? "INVALID_WOVEN_SLEEVE_TRANSFER" : "INVALID_COLLAR_TRANSFER", sourceId,
        message: `The normalized view station on “${roleId}.${edge.name}” does not match its approved same-revision source-arclength transfer.` });
      return undefined;
    }
    return pointOnEdgeFraction(edge, landmark.fraction);
  }
  if (landmark.kind === "pattern-mark") {
    if (typeof landmark.markId !== "string" || landmark.markId.length === 0
      || (landmark.point !== "at" && landmark.point !== "start" && landmark.point !== "end")) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Pattern-mark landmark needs a mark ID and valid point selector." });
      return undefined;
    }
    const mark = piece.marks?.find((candidate) => candidate.name === landmark.markId);
    if (!mark) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Pattern mark “${landmark.markId}” does not resolve in role “${roleId}”.` });
      return undefined;
    }
    const point = "at" in mark
      ? landmark.point === "at" ? mark.at : undefined
      : landmark.point === "start" ? mark.start : landmark.point === "end" ? mark.end : undefined;
    if (!point) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Pattern mark “${landmark.markId}” has no selected ${String(landmark.point)} point.` });
      return undefined;
    }
    if (!samePoint(point, edgeStart(edge)) && !samePoint(point, edgeEnd(edge))) {
      issues.push({ code: "LANDMARK_NOT_ON_EDGE", sourceId, message: `Pattern mark “${landmark.markId}” is not an exact endpoint of drafted edge “${edge.name}”; an interior split is unsupported.` });
      return undefined;
    }
    return point;
  }
  if (landmark.kind === "stitch-interface-boundary") {
    const malformed = typeof landmark.stitchLabel !== "string" || !landmark.stitchLabel
      || (landmark.boundarySide !== "a" && landmark.boundarySide !== "b")
      || (landmark.receiverSide !== "a" && landmark.receiverSide !== "b")
      || landmark.boundarySide === landmark.receiverSide
      || !Number.isInteger(landmark.afterEdgeIndex) || !Number.isInteger(landmark.faceSegmentEdgeIndex)
      || !Number.isInteger(landmark.receiverEdgeIndex)
      || (landmark.pairedEdgeId !== undefined && typeof landmark.pairedEdgeId !== "string");
    if (malformed) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: "Stitch boundary must name distinct interface sides and valid edge indexes." });
      return undefined;
    }
    const stitchMatches = block.stitches.filter((candidate) => candidate.label === landmark.stitchLabel);
    if (stitchMatches.length !== 1) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch boundary must resolve one exact stitch named “${String(landmark.stitchLabel)}”.` });
      return undefined;
    }
    const stitch = stitchMatches[0]!;
    const boundarySide = landmark.boundarySide as "a" | "b";
    const receiverSide = landmark.receiverSide as "a" | "b";
    if (stitch.ease !== undefined) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Eased stitch “${stitch.label}” cannot define an exact face-segment boundary.` });
      return undefined;
    }
    const sourceRaw = refsForSide(stitch, boundarySide);
    const targetRaw = refsForSide(stitch, receiverSide);
    const afterIndex = landmark.afterEdgeIndex as number;
    const faceIndex = landmark.faceSegmentEdgeIndex as number;
    const targetIndex = landmark.receiverEdgeIndex as number;
    if (afterIndex < 0 || afterIndex >= sourceRaw.length - 1 || faceIndex < 0 || faceIndex >= sourceRaw.length
      || targetIndex < 0 || targetIndex >= targetRaw.length) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” does not contain the declared source or receiving interface boundary.` });
      return undefined;
    }
    const sourceSegments = sourceRaw.map((ref) => edgeRefLine(block, ref));
    const targetSegments = targetRaw.map((ref) => edgeRefLine(block, ref));
    if (sourceSegments.some((segment) => !segment) || targetSegments.some((segment) => !segment)) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” boundary requires line-edge references on both interfaces.` });
      return undefined;
    }
    const sourceLines = sourceSegments as NonNullable<(typeof sourceSegments)[number]>[];
    const targetLines = targetSegments as NonNullable<(typeof targetSegments)[number]>[];
    const previous = refEndpoints(sourceLines[afterIndex]!)[1];
    const next = refEndpoints(sourceLines[afterIndex + 1]!)[0];
    if (!samePoint(previous, next)) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” ordered references do not share an exact source endpoint.` });
      return undefined;
    }
    const expectedSegmentRole = faceKind === "FRONT_FLAT" ? "front" : "back";
    if (landmark.boundarySide !== "a" || faceIndex !== (faceKind === "FRONT_FLAT" ? afterIndex : afterIndex + 1)
      || sourceLines[faceIndex]!.roleId !== expectedSegmentRole) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” does not assign this boundary to the ${expectedSegmentRole} face segment.` });
      return undefined;
    }
    const sourceTotal = sourceLines.reduce((sum, segment) => sum + lineLength(segment.edge), 0);
    const targetTotal = targetLines.reduce((sum, segment) => sum + lineLength(segment.edge), 0);
    const sourcePrefix = sourceLines.slice(0, afterIndex + 1).reduce((sum, segment) => sum + lineLength(segment.edge), 0);
    if (!(sourceTotal > 0) || Math.abs(sourceTotal - targetTotal) > 1e-8) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” interface lengths do not support an exact source-derived split.` });
      return undefined;
    }
    const target = targetLines[targetIndex]!;
    if (target.roleId !== roleId || (landmark.pairedEdgeId === undefined && target.edge.name !== edge.name)
      || (landmark.pairedEdgeId !== undefined && landmark.pairedEdgeId !== edge.name)) {
      issues.push({ code: "LANDMARK_ROLE_MISMATCH", sourceId, message: "Stitch boundary receiver does not match the mapped component edge." });
      return undefined;
    }
    const targetOffset = targetLines.slice(0, targetIndex).reduce((sum, segment) => sum + lineLength(segment.edge), 0);
    const localDistance = sourcePrefix - targetOffset;
    const targetLength = lineLength(target.edge);
    if (localDistance < -1e-8 || localDistance > targetLength + 1e-8) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Stitch “${stitch.label}” boundary falls outside the declared receiving edge.` });
      return undefined;
    }
    const traversalFraction = Math.max(0, Math.min(1, localDistance / targetLength));
    const point = pointOnLine(target.edge, target.ref.reversed ? 1 - traversalFraction : traversalFraction);
    if (landmark.pairedEdgeId === undefined) return point;
    const paired = piece.edges.find((candidate) => candidate.name === landmark.pairedEdgeId);
    if (!paired || paired.kind !== "line" || target.edge.start.y !== target.edge.end.y
      || paired.start.y !== paired.end.y || target.edge.start.y === paired.start.y
      || target.edge.start.x !== paired.end.x || target.edge.end.x !== paired.start.x) {
      issues.push({ code: "INVALID_PAIRED_EDGE", sourceId, message: "Paired strip edge must be an exact opposite-direction horizontal span of the receiving stitch edge." });
      return undefined;
    }
    return { x: point.x, y: paired.start.y };
  }
  issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Unsupported source landmark kind." });
  return undefined;
}

export function resolveFlatProjectionLandmark(
  block: Block,
  roleId: string,
  faceKind: TechnicalFlatViewKind,
  landmark: unknown,
  receivingEdgeId?: string,
) {
  const piece = block.roles[roleId];
  if (!piece) return undefined;
  let edgeId = receivingEdgeId;
  if (!edgeId && isRecord(landmark)) {
    if (landmark.kind === "edge-endpoint" && typeof landmark.edgeId === "string") edgeId = landmark.edgeId;
      if ((landmark.kind === "edge-arclength" || landmark.kind === "normalized-edge-transfer")
        && typeof landmark.edgeId === "string") edgeId = landmark.edgeId;
    if (landmark.kind === "stitch-interface-boundary" && typeof landmark.stitchLabel === "string"
      && (landmark.receiverSide === "a" || landmark.receiverSide === "b")
      && Number.isInteger(landmark.receiverEdgeIndex)) {
      const matches = block.stitches.filter((stitch) => stitch.label === landmark.stitchLabel);
      const refs = matches.length === 1 ? refsForSide(matches[0]!, landmark.receiverSide) : [];
      const ref = refs[landmark.receiverEdgeIndex as number];
      if (ref && "edge" in ref && ref.piece === roleId) {
        edgeId = typeof landmark.pairedEdgeId === "string" ? landmark.pairedEdgeId : ref.edge;
      }
    }
  }
  const edge = edgeId ? piece.edges.find((candidate) => candidate.name === edgeId) : undefined;
  if (!edge) return undefined;
  const issues: FlatProjectionIssue[] = [];
  const resolved = pointForLandmark(roleId, faceKind, edge, landmark, piece, block, issues, `${faceKind}:${roleId}`);
  return issues.length === 0 ? resolved : undefined;
}

function validateRole(
  recipeId: string,
  faceKind: TechnicalFlatViewKind,
  mappingRole: unknown,
  block: Block,
  expectedTreatment: FlatRoleTreatment,
  usedInstances: Set<string>,
  issues: FlatProjectionIssue[],
) {
  const roleHint = isRecord(mappingRole) && typeof mappingRole.roleId === "string" ? mappingRole.roleId : "?";
  const sourceId = `${faceKind}:${roleHint}`;
  if (!isRecord(mappingRole) || typeof mappingRole.roleId !== "string") {
    issues.push({ code: "UNEXPECTED_ROLE", sourceId, message: "Projection role must identify a mapped drafted role." });
    return;
  }
  const roleId = mappingRole.roleId;
  const piece = block.roles[roleId];
  if (!piece) {
    issues.push({ code: "UNEXPECTED_ROLE", sourceId, message: `Projection role “${roleId}” is absent from the exact drafted block.` });
    return;
  }
  if (mappingRole.treatment !== expectedTreatment) {
    issues.push({ code: "TREATMENT_MISMATCH", sourceId, message: `Projection treatment for “${roleId}” must match the admitted role map.` });
  }
  const reversedStitchEdges = mappingRole.reversedStitchEdges;
  const requiresSleeveEndpointOrder = (recipeId === "tee" || recipeId === "fitted")
    && faceKind === "FRONT_FLAT" && roleId === "sleeve";
  if (reversedStitchEdges !== undefined || requiresSleeveEndpointOrder) {
    const entries = Array.isArray(reversedStitchEdges) ? reversedStitchEdges : [];
    const matches = block.stitches.filter((stitch) => stitch.label === "Sleeve-cap ease");
    const stitch = matches[0];
    const capLeft = block.roles.sleeve?.edges.find((edge) => edge.name === "capLeft");
    const sideLeft = block.roles.sleeve?.edges.find((edge) => edge.name === "sideLeft");
    const armhole = block.roles.front?.edges.find((edge) => edge.name === "armhole");
    const topologyMatches = matches.length === 1 && !!stitch
      && stitch.a.edges.length === 2 && stitch.b.edges.length === 2
      && stitch.a.edges[0]?.piece === "sleeve" && "edge" in stitch.a.edges[0] && stitch.a.edges[0].edge === "capLeft"
      && stitch.a.edges[1]?.piece === "sleeve" && "edge" in stitch.a.edges[1] && stitch.a.edges[1].edge === "capRight"
      && stitch.b.edges[0]?.piece === "front" && "edge" in stitch.b.edges[0] && stitch.b.edges[0].edge === "armhole"
      && stitch.b.edges[1]?.piece === "back" && "edge" in stitch.b.edges[1] && stitch.b.edges[1].edge === "armhole"
      && !!capLeft && capLeft.kind === "curve" && !!sideLeft && sideLeft.kind === "line"
      && samePoint(capLeft.curve.start, sideLeft.end)
      && !!armhole && armhole.kind === "curve";
    const exactRule = entries.length === 1 && isRecord(entries[0])
      && entries[0].stitchLabel === "Sleeve-cap ease" && entries[0].pieceId === "front"
      && entries[0].edgeId === "armhole" && entries[0].source === "SOURCE_ENDPOINT_ORDER";
    if (!requiresSleeveEndpointOrder || !topologyMatches || !exactRule) {
      issues.push({ code: "INVALID_STITCH_ENDPOINT_ORIENTATION", sourceId,
        message: "The reversed view traversal requires the exact Tee/Fitted front armhole and sleeve-cap source endpoint order." });
    }
  }
  const localYReflection = mappingRole.localYReflection;
  const requiresBackSleeveReflection = (recipeId === "tee" || recipeId === "fitted")
    && faceKind === "BACK_FLAT" && roleId === "sleeve";
  if (localYReflection !== undefined || requiresBackSleeveReflection) {
    const capLeft = block.roles.sleeve?.edges.find((edge) => edge.name === "capLeft");
    const capRight = block.roles.sleeve?.edges.find((edge) => edge.name === "capRight");
    const sideRight = block.roles.sleeve?.edges.find((edge) => edge.name === "sideRight");
    const validSourceJoin = !!capLeft && capLeft.kind === "curve" && !!capRight && capRight.kind === "curve"
      && !!sideRight && sideRight.kind === "line"
      && samePoint(capLeft.curve.end, capRight.curve.start)
      && samePoint(capRight.curve.end, sideRight.start);
    const exactReflection = isRecord(localYReflection) && localYReflection.axis === "LOCAL_Y"
      && localYReflection.basis === "APPROVED_VIEW_CONVENTION"
      && localYReflection.decisionId === "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR";
    if (!requiresBackSleeveReflection || !validSourceJoin || !exactReflection) {
      issues.push({ code: "INVALID_LOCAL_Y_REFLECTION", sourceId,
        message: "The back sleeve local-Y view reflection requires the exact sewn cap-to-side source joins and admitted face mapping." });
    }
  }
  if (typeof mappingRole.instanceId !== "string" || mappingRole.instanceId.trim().length === 0) {
    issues.push({ code: "MISSING_INSTANCE", sourceId, message: `Role “${roleId}” needs an explicit physical component instance ID.` });
  } else if (usedInstances.has(mappingRole.instanceId)) {
    issues.push({ code: "DUPLICATE_INSTANCE", sourceId, message: `Component instance “${mappingRole.instanceId}” is repeated in ${faceKind}.` });
  } else {
    usedInstances.add(mappingRole.instanceId);
  }
  if (!Array.isArray(mappingRole.runs) || !Array.isArray(mappingRole.heldEdges)
    || (mappingRole.faceExcludedEdges !== undefined && !Array.isArray(mappingRole.faceExcludedEdges))) {
    issues.push({ code: "MISSING_EDGE_ACCOUNTING", sourceId, message: `Role “${roleId}” must list projected runs and explicit held edges.` });
    return;
  }
  if (expectedTreatment === "INTERIOR_HIDDEN" && mappingRole.runs.length > 0) {
    issues.push({ code: "RUN_ON_HIDDEN_ROLE", sourceId, message: `Hidden interior role “${roleId}” cannot emit exterior edge runs.` });
  }
  if (recipeId === "woven-shirt" && faceKind === "FRONT_FLAT" && roleId === "front") {
    const reflection = mappingRole.physicalPairReflection;
    const physicalRole = WOVEN_SHIRT_PHYSICAL_ROLES.find((candidate) => candidate.id === roleId);
    const axis = isRecord(reflection) && typeof reflection.edgeId === "string"
      ? piece.edges.find((candidate) => candidate.name === reflection.edgeId) : undefined;
    const exactPairAxis = wovenFrontPairAxis(piece);
    if (!isRecord(reflection) || reflection.axis !== "LOCAL_Y"
      || reflection.source !== "WOVEN_SHIRT_PHYSICAL_ROLES" || reflection.quantity !== 2
      || physicalRole?.quantity !== 2 || physicalRole?.onFold !== false || piece.onFold !== false
      || !axis || axis.kind !== "line" || axis.name !== "centerFront"
      || exactPairAxis?.name !== axis.name) {
      issues.push({ code: "INVALID_PHYSICAL_PAIR_REFLECTION", sourceId,
        message: "Woven front-pair reflection needs quantity two, separate-piece source metadata, and the exact straight centerFront axis on local x=0 with the authored piece on one side." });
    }
  } else if (mappingRole.physicalPairReflection !== undefined) {
    issues.push({ code: "INVALID_PHYSICAL_PAIR_REFLECTION", sourceId,
      message: "Physical-pair reflection is supported only for the source-declared Woven front role on the front face." });
  }
  if (mappingRole.viewPairReflection !== undefined) {
    const reflection = mappingRole.viewPairReflection;
    const axisRoleId = faceKind === "FRONT_FLAT" ? "front" : "back";
    const axisPiece = block.roles[axisRoleId];
    const axis = isRecord(reflection) && typeof reflection.edgeId === "string" && axisPiece
      ? axisPiece.edges.find((edge) => edge.name === reflection.edgeId) : undefined;
    const expectedAxisId = faceKind === "FRONT_FLAT" ? "centerFront" : "centerBack";
    const teeFittedPair = (recipeId === "tee" || recipeId === "fitted") && roleId === "sleeve"
      && isRecord(reflection) && reflection.source === "MAINTAINER_VIEW_DECISION"
      && reflection.decisionId === "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR";
    const wovenRole = roleId === "sleeve" || roleId === "sleeveBand";
    const physicalRole = WOVEN_SHIRT_PHYSICAL_ROLES.find((candidate) => candidate.id === roleId);
    const exactAxis = recipeId === "woven-shirt" && axisRoleId === "front" && axisPiece
      ? wovenFrontPairAxis(axisPiece)?.name === axis?.name
      : axisPiece?.onFold && foldAxisEdge(axisPiece)?.name === axis?.name;
    const wovenPair = recipeId === "woven-shirt" && wovenRole && isRecord(reflection)
      && reflection.source === "WOVEN_SHIRT_PHYSICAL_ROLES"
      && reflection.decisionId === "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR"
      && physicalRole?.quantity === 2 && !physicalRole.onFold;
    if ((!teeFittedPair && !wovenPair) || !isRecord(reflection)
      || reflection.axisRoleId !== axisRoleId || reflection.edgeId !== expectedAxisId
      || reflection.axis !== "ASSEMBLED_BODY_CENTER" || reflection.quantity !== 2
      || !exactAxis) {
      issues.push({ code: "INVALID_VIEW_PAIR_REFLECTION", sourceId,
        message: "Paired component reflection requires its approved source/decision, quantity two, and the exact current face panel center axis." });
    }
  } else if ((recipeId === "tee" || recipeId === "fitted") && roleId === "sleeve") {
    issues.push({ code: "INVALID_VIEW_PAIR_REFLECTION", sourceId,
      message: "The approved Tee/Fitted sleeve mapping requires two explicit mirrored view instances." });
  } else if (recipeId === "woven-shirt" && (roleId === "sleeve" || roleId === "sleeveBand")) {
    issues.push({ code: "INVALID_VIEW_PAIR_REFLECTION", sourceId,
      message: "The approved Woven sleeve/band mapping requires two explicit mirrored physical instances." });
  }
  const oppositeSide = mappingRole.oppositeSideReflection;
  if (oppositeSide !== undefined || (recipeId === "woven-shirt" && faceKind === "FRONT_FLAT" && roleId === "buttonholePlacket")) {
    const stitches = block.stitches.filter((stitch) => stitch.label === "Buttonhole placket ↔ left front centre front");
    const stitch = stitches[0];
    const rightStitches = block.stitches.filter((candidate) => candidate.label === "Button placket ↔ right front centre front");
    const rightStitch = rightStitches[0];
    const frontPiece = block.roles.front;
    const axis = frontPiece ? wovenFrontPairAxis(frontPiece) : undefined;
    if (recipeId !== "woven-shirt" || faceKind !== "FRONT_FLAT" || roleId !== "buttonholePlacket"
      || !isRecord(oppositeSide) || oppositeSide.axisRoleId !== "front" || oppositeSide.edgeId !== "centerFront"
      || oppositeSide.source !== "MAINTAINER_VIEW_DECISION" || oppositeSide.decisionId !== "G04-S321-WOVEN-CLOSURE-A"
      || oppositeSide.side !== "LEFT" || oppositeSide.quantity !== 1 || !axis
      || stitches.length !== 1 || !stitch || stitch.ease !== undefined
      || stitch.a.edges.length !== 1 || stitch.b.edges.length !== 1
      || !("edge" in stitch.a.edges[0]!) || stitch.a.edges[0]!.piece !== "buttonholePlacket"
      || stitch.a.edges[0]!.edge !== "attachmentRaw"
      || !("edge" in stitch.b.edges[0]!) || stitch.b.edges[0]!.piece !== "front"
      || stitch.b.edges[0]!.edge !== "centerFront"
      || rightStitches.length !== 1 || !rightStitch || rightStitch.ease !== undefined
      || rightStitch.a.edges.length !== 1 || rightStitch.b.edges.length !== 1
      || !("edge" in rightStitch.a.edges[0]!) || rightStitch.a.edges[0]!.piece !== "buttonPlacket"
      || rightStitch.a.edges[0]!.edge !== "attachmentRaw"
      || !("edge" in rightStitch.b.edges[0]!) || rightStitch.b.edges[0]!.piece !== "front"
      || rightStitch.b.edges[0]!.edge !== "centerFront") {
      issues.push({ code: "INVALID_OPPOSITE_SIDE_REFLECTION", sourceId,
        message: "The approved left buttonhole placket must resolve its exact same-revision attachment to the reflected front center axis." });
    }
  }
  if (mappingRole.foldAxisReflection !== undefined) {
    const reflection = mappingRole.foldAxisReflection;
    const axisRoleId = isRecord(reflection) && typeof reflection.axisRoleId === "string"
      ? reflection.axisRoleId : roleId;
    const axisPiece = block.roles[axisRoleId];
    const edge = isRecord(reflection) && typeof reflection.edgeId === "string" && axisPiece
      ? axisPiece.edges.find((candidate) => candidate.name === reflection.edgeId) : undefined;
    const externalAxis = axisRoleId !== roleId;
    const axisStitches = isRecord(reflection) && typeof reflection.viaStitchLabel === "string"
      ? block.stitches.filter((stitch) => stitch.label === reflection.viaStitchLabel) : [];
    const sourceRoleForFace = faceKind === "FRONT_FLAT" ? "front" : "back";
    const attachedByNamedSeam = axisStitches.length === 1 && [axisStitches[0]!.a, axisStitches[0]!.b].some((side) =>
      side.edges.some((ref) => "edge" in ref && ref.piece === axisRoleId && ref.edge === "waist"))
      && [axisStitches[0]!.a, axisStitches[0]!.b].some((side) =>
        side.edges.some((ref) => "edge" in ref && ref.piece === roleId && ref.edge === "seam"));
    if (!isRecord(reflection) || reflection.axis !== "LOCAL_Y" || reflection.source !== "Piece.onFold"
      || !axisPiece || !axisPiece.onFold || !edge || foldAxisEdge(axisPiece)?.name !== edge.name
      || (externalAxis && (roleId !== "waistband" || axisRoleId !== sourceRoleForFace
        || typeof reflection.viaStitchLabel !== "string" || !attachedByNamedSeam))
      || (!externalAxis && reflection.viaStitchLabel !== undefined)) {
      issues.push({ code: "INVALID_FOLD_AXIS_REFLECTION", sourceId,
        message: `View reflection for “${roleId}” needs the exact source-declared on-fold axis on its own role or its sewn-to face panel.` });
    }
  }
  const accounted = new Set<string>();
  const account = (edgeId: unknown, category: "run" | "hold" | "face exclusion") => {
    if (typeof edgeId !== "string" || edgeId.length === 0 || !piece.edges.some((edge) => edge.name === edgeId)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Projection ${category} references an edge missing from “${roleId}”.` });
      return;
    }
    if (accounted.has(edgeId)) {
      issues.push({ code: "DUPLICATE_EDGE_ACCOUNTING", sourceId, message: `Source edge “${roleId}.${edgeId}” is accounted for more than once.` });
      return;
    }
    accounted.add(edgeId);
  };
  for (const run of mappingRole.runs) {
    if (!isRecord(run)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Projection run for “${roleId}” is malformed.` });
      continue;
    }
    account(run.edgeId, "run");
    const edge = typeof run.edgeId === "string" ? piece.edges.find((candidate) => candidate.name === run.edgeId) : undefined;
    if (!edge) continue;
    const from = pointForLandmark(roleId, faceKind, edge, run.from, piece, block, issues, sourceId);
    const to = pointForLandmark(roleId, faceKind, edge, run.to, piece, block, issues, sourceId);
    if (from && to && samePoint(from, to)) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Run on “${roleId}.${edge.name}” must have distinct source endpoints.` });
    }
  }
  for (const hold of mappingRole.heldEdges) {
    if (!isRecord(hold)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Held edge for “${roleId}” is malformed.` });
      continue;
    }
    account(hold.edgeId, "hold");
    if (typeof hold.reason !== "string" || hold.reason.trim().length === 0) {
      issues.push({ code: "EMPTY_HOLD_REASON", sourceId, message: `Held edge on “${roleId}” needs an actionable visible reason.` });
    }
  }
  for (const exclusion of (mappingRole.faceExcludedEdges ?? []) as unknown[]) {
    if (!isRecord(exclusion)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Face exclusion for “${roleId}” is malformed.` });
      continue;
    }
    account(exclusion.edgeId, "face exclusion");
    if (typeof exclusion.reason !== "string" || exclusion.reason.trim().length === 0) {
      issues.push({ code: "EMPTY_HOLD_REASON", sourceId, message: `Face-excluded edge on “${roleId}” needs a source-based reason.` });
    }
  }
  if (mappingRole.viewBoundaries !== undefined) {
    if (!Array.isArray(mappingRole.viewBoundaries)) {
      issues.push({ code: "INVALID_VIEW_BOUNDARY", sourceId, message: "View boundaries must be an array of source-bound silhouette closures." });
    } else {
      for (const boundary of mappingRole.viewBoundaries) {
        if (!isRecord(boundary) || typeof boundary.id !== "string" || !boundary.id.trim()) {
          issues.push({ code: "INVALID_VIEW_BOUNDARY", sourceId, message: "A view boundary needs a stable non-empty ID." });
          continue;
        }
        if (boundary.fillOnlyColorway !== undefined) {
          const fillOnly = boundary.fillOnlyColorway;
          const expectedCap = faceKind === "FRONT_FLAT" ? "capLeft" : "capRight";
          if ((recipeId !== "tee" && recipeId !== "fitted") || roleId !== "sleeve"
            || boundary.id !== "approved-sleeve-area-closure" || !isRecord(fillOnly)
            || fillOnly.source !== "MAINTAINER_VIEW_DECISION"
            || fillOnly.decisionId !== "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR"
            || !isRecord(boundary.from) || boundary.from.kind !== "edge-arclength"
            || boundary.from.edgeId !== "hem" || boundary.from.fraction !== 0.5
            || !isRecord(boundary.to) || boundary.to.kind !== "edge-endpoint"
            || boundary.to.edgeId !== expectedCap
            || boundary.to.endpoint !== (faceKind === "FRONT_FLAT" ? "end" : "start")) {
            issues.push({ code: "INVALID_VIEW_BOUNDARY", sourceId,
              message: "A colorway-only sleeve closure requires the approved Tee/Fitted decision and exact hem-midpoint-to-cap-crown landmarks." });
          }
        }
        const from = resolveFlatProjectionLandmark(block, roleId, faceKind, boundary.from);
        const to = resolveFlatProjectionLandmark(block, roleId, faceKind, boundary.to);
        if (!from || !to || samePoint(from, to)) {
          issues.push({ code: "INVALID_VIEW_BOUNDARY", sourceId, message: "A view boundary must connect distinct source-resolved endpoints." });
        }
      }
    }
  }
  for (const edge of piece.edges) {
    if (!accounted.has(edge.name)) {
      issues.push({ code: "MISSING_EDGE_ACCOUNTING", sourceId: `${sourceId}:${edge.name}`, message: `Source edge “${roleId}.${edge.name}” is neither projected nor held.` });
    }
  }
}

/** Validate a recipe's exact per-face edge map against its current drafted
 * topology. Every source edge is either a fully source-bounded run or an
 * explicit hold; interior splits require authored source landmarks. */
export function validateTechnicalFlatProjectionMap(
  recipeId: string,
  block: Block,
  liveRevisionId: string,
  input: unknown,
): FlatProjectionIssue[] {
  const base = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!base) return [{ code: "UNSUPPORTED_RECIPE", sourceId: recipeId, message: `Recipe “${recipeId}” has no admitted G04 mapping.` }];
  if (typeof liveRevisionId !== "string" || liveRevisionId.trim().length === 0) {
    return [{ code: "INVALID_REVISION", sourceId: recipeId, message: "Projection mapping requires the live design revision ID." }];
  }
  if (!isRecord(input) || input.version !== 1 || input.recipeId !== recipeId
    || typeof input.revisionId !== "string" || !Array.isArray(input.faces)) {
    return [{ code: "INVALID_FACES", sourceId: recipeId, message: "Projection map must have version 1, the exact recipe/revision, and two face records." }];
  }
  if (input.revisionId !== liveRevisionId) {
    return [{ code: "REVISION_MISMATCH", sourceId: recipeId, message: "Projection metadata belongs to a different live design revision." }];
  }
  if (input.faces.length !== 2) {
    return [{ code: "INVALID_FACES", sourceId: recipeId, message: "Projection map must define exactly front and back faces." }];
  }
  const issues: FlatProjectionIssue[] = [];
  const faceKinds = new Set<string>();
  const instancesByRole = new Map<string, string>();
  for (const [index, rawFace] of input.faces.entries()) {
    if (!isRecord(rawFace) || (rawFace.kind !== "FRONT_FLAT" && rawFace.kind !== "BACK_FLAT") || !Array.isArray(rawFace.roles)) {
      issues.push({ code: "INVALID_FACE", sourceId: `${recipeId}:face:${index}`, message: "Projection face must identify a front/back kind and role list." });
      continue;
    }
    const faceKind = rawFace.kind;
    if (faceKinds.has(faceKind)) issues.push({ code: "DUPLICATE_FACE", sourceId: faceKind, message: `Projection map repeats ${faceKind}.` });
    faceKinds.add(faceKind);
    const expectedFace = base.faces.find((face) => face.kind === faceKind);
    if (!expectedFace) {
      issues.push({ code: "INVALID_FACE", sourceId: faceKind, message: `Recipe “${recipeId}” has no admitted ${faceKind} mapping.` });
      continue;
    }
    const expectedRoles = new Map(expectedFace.roles.map((role) => [role.roleId, role.treatment]));
    const seenRoles = new Set<string>();
    const usedInstances = new Set<string>();
    for (const rawRole of rawFace.roles) {
      if (!isRecord(rawRole) || typeof rawRole.roleId !== "string") {
        validateRole(recipeId, faceKind, rawRole, block, "SHELL", usedInstances, issues);
        continue;
      }
      const roleId = rawRole.roleId;
      if (roleId && seenRoles.has(roleId)) {
        issues.push({ code: "DUPLICATE_ROLE", sourceId: `${faceKind}:${roleId}`, message: `Projection map repeats role “${roleId}”.` });
        continue;
      }
      if (roleId) seenRoles.add(roleId);
      const treatment = expectedRoles.get(roleId);
      if (!treatment) {
        issues.push({ code: "UNEXPECTED_ROLE", sourceId: `${faceKind}:${roleId || "?"}`, message: `Role “${roleId || "?"}” is not admitted on ${faceKind}.` });
        continue;
      }
      validateRole(recipeId, faceKind, rawRole, block, treatment, usedInstances, issues);
      if (typeof rawRole.instanceId === "string" && rawRole.instanceId.trim().length > 0) {
        const existingInstanceId = instancesByRole.get(roleId);
        if (existingInstanceId !== undefined && existingInstanceId !== rawRole.instanceId) {
          issues.push({ code: "INSTANCE_MISMATCH", sourceId: `${faceKind}:${roleId}`, message: `Role “${roleId}” must keep the same component instance ID across front and back.` });
        } else {
          instancesByRole.set(roleId, rawRole.instanceId);
        }
      }
    }
    for (const role of expectedFace.roles) {
      if (!seenRoles.has(role.roleId)) {
        issues.push({ code: "MISSING_ROLE", sourceId: `${faceKind}:${role.roleId}`, message: `Projection map omits admitted role “${role.roleId}” from ${faceKind}.` });
      }
    }
  }
  for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    if (!faceKinds.has(kind)) issues.push({ code: "INVALID_FACES", sourceId: kind, message: `Projection map is missing ${kind}.` });
  }
  return issues;
}
