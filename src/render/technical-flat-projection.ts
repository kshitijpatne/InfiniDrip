import { edgeEnd, edgeLength, edgeStart, type Edge, type Piece } from "../drafting/piece";
import type { Block } from "../drafting/block";
import type { EdgeRef, Stitch } from "../drafting/stitch";
import { G04_TECHNICAL_FLAT_MAPPINGS, type FlatRoleTreatment } from "./technical-flat-mapping";
import type { TechnicalFlatViewKind } from "./technical-flat";

export type FlatProjectionLandmark =
  | { readonly kind: "edge-endpoint"; readonly edgeId: string; readonly endpoint: "start" | "end" }
  | { readonly kind: "pattern-mark"; readonly markId: string; readonly point: "at" | "start" | "end" }
  | { readonly kind: "woven-neckline-shoulder"; readonly stitchLabel: "Outer stand ↔ woven neckline" }
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

export interface FlatProjectionViewBoundary {
  readonly id: string;
  readonly from: FlatProjectionLandmark;
  readonly to: FlatProjectionLandmark;
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
  tee: {
    sleeve: "The sleeve-cap stitch locates sewn cap intervals but the source does not identify the front/back visible sleeve contour or supported sleeve view instances.",
  },
  fitted: {
    sleeve: "The sleeve-cap stitch locates sewn cap intervals but the source does not identify the front/back visible sleeve contour or supported sleeve view instances.",
  },
  polo: {
    outerStand: "The stand's exterior contour has no authored front/back split landmark.",
    upperCollar: "The collar's exterior contour has no authored front/back split landmark.",
  },
  "woven-shirt": {
    front: "Slice 286 production Chromium showed the assembled Woven front with separated and crossing source roles. The source joins the full sleeve cap to three ordered armhole edges with ease but supplies no front/back cap split or sleeve-view instance rule; keep the face held until source-backed assembly and rendered output are coherent.",
  },
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

function wovenCollarRoleProjection(
  roleId: "outerStand" | "upperCollar", kind: TechnicalFlatViewKind, piece: Piece,
  treatment: FlatRoleTreatment,
): FlatProjectionRole {
  const front = kind === "FRONT_FLAT";
  const baseEdge = roleId === "outerStand" ? "collar" : "stand";
  const outerEdge = roleId === "outerStand" ? "neckline" : "outer";
  const frontEndEdge = roleId === "outerStand" ? "frontEnd" : "frontTip";
  const boundary = (): FlatProjectionLandmark => ({
    kind: "woven-neckline-shoulder", stitchLabel: "Outer stand ↔ woven neckline",
  });
  const endpoint = (edgeId: string, endpointName: "start" | "end"): FlatProjectionLandmark => ({
    kind: "edge-endpoint", edgeId, endpoint: endpointName,
  });
  const centerBack = foldAxisEdge(piece);
  const splitRuns: FlatProjectionEdgeRun[] = front
    ? [
      { edgeId: baseEdge, from: boundary(), to: endpoint(baseEdge, "end") },
      { edgeId: outerEdge, from: endpoint(outerEdge, "start"), to: boundary() },
      { edgeId: frontEndEdge, from: endpoint(frontEndEdge, "start"), to: endpoint(frontEndEdge, "end") },
    ]
    : [
      { edgeId: baseEdge, from: endpoint(baseEdge, "start"), to: boundary() },
      { edgeId: outerEdge, from: boundary(), to: endpoint(outerEdge, "end") },
    ];
  const faceExcludedEdges: FlatProjectionHeldEdge[] = [
    ...(centerBack ? [
      { edgeId: centerBack.name, reason: "The source-declared center-back fold is the reflection axis, not an exterior cut edge." },
      ...(!front ? [{ edgeId: frontEndEdge, reason: "The collar/front-end edge belongs to the front face beyond the source shoulder station." }] : []),
    ] : []),
  ];
  return {
    roleId,
    instanceId: roleId,
    treatment,
    runs: centerBack ? splitRuns : [],
    heldEdges: centerBack ? [] : piece.edges.map((edge) => ({ edgeId: edge.name, reason: "The source-declared center-back axis is missing." })),
    faceExcludedEdges,
    ...(centerBack ? { foldAxisReflection: { edgeId: centerBack.name, axis: "LOCAL_Y" as const, source: "Piece.onFold" as const } } : {}),
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
        if (recipeId === "woven-shirt" && (role.roleId === "outerStand" || role.roleId === "upperCollar")) {
          return wovenCollarRoleProjection(role.roleId, face.kind, piece, role.treatment);
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
        const nonMirrorReason = G04_NON_MIRRORED_ON_FOLD_ROLES[recipeId]?.[role.roleId];
        const axisEdge = role.treatment === "INTERIOR_HIDDEN" || nonMirrorReason ? undefined : foldAxisEdge(piece);
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
  | "INVALID_STITCH_BOUNDARY" | "INVALID_PAIRED_EDGE" | "INVALID_VIEW_BOUNDARY";

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

function wovenNecklineShoulderPoint(
  block: Block, roleId: string, edge: Edge, piece: Piece,
): { readonly x: number; readonly y: number } | undefined {
  if (edge.kind !== "line") return undefined;
  if (!piece.onFold) return undefined;
  if (!foldAxisEdge(piece)) return undefined;
  if (roleId !== "outerStand" && roleId !== "upperCollar") return undefined;
  const matches = block.stitches.filter((stitch) => stitch.label === "Outer stand ↔ woven neckline");
  const stitch = matches[0];
  if (matches.length !== 1 || !stitch || stitch.ease !== undefined || stitch.a.edges.length !== 1
    || stitch.b.edges.length !== 2) return undefined;
  const outerNeckRef = stitch.a.edges[0];
  if (!outerNeckRef || !("edge" in outerNeckRef)
    || outerNeckRef.piece !== "outerStand" || outerNeckRef.edge !== "neckline") return undefined;
  const [frontRef, backRef] = stitch.b.edges;
  if (!frontRef || !backRef || !("edge" in frontRef) || !("edge" in backRef)
    || frontRef.piece !== "front" || frontRef.edge !== "neckline"
    || !(backRef.piece === "back" || backRef.piece === "yoke") || backRef.edge !== "neckline") return undefined;
  const front = block.roles.front;
  const back = block.roles[backRef.piece];
  const frontNeck = front?.edges.find((candidate) => candidate.name === "neckline");
  const backNeck = back?.edges.find((candidate) => candidate.name === "neckline");
  if (!front || !back || !frontNeck || !backNeck) return undefined;
  const shared = [edgeStart(frontNeck), edgeEnd(frontNeck)].filter((candidate) =>
    [edgeStart(backNeck), edgeEnd(backNeck)].some((other) => samePoint(candidate, other)));
  if (shared.length !== 1) return undefined;
  const frontLength = edgeLength(frontNeck);
  const backLength = edgeLength(backNeck);
  const total = frontLength + backLength;
  const sewnTo = roleId === "outerStand" ? block.roles.underCollar : block.roles.innerStand;
  const ownBaseName = roleId === "outerStand" ? "collar" : "stand";
  const counterpartBaseName = roleId === "outerStand" ? "stand" : "collar";
  const receiverBase = sewnTo?.edges.find((candidate) => candidate.name === counterpartBaseName);
  const ownBase = piece.edges.find((candidate) => candidate.name === ownBaseName);
  const standNeckline = block.roles.outerStand?.edges.find((candidate) => candidate.name === "neckline");
  if (!sewnTo?.onFold || !receiverBase || !ownBase || !standNeckline
    || Math.abs(edgeLength(receiverBase) - total) > 1e-8
    || Math.abs(edgeLength(ownBase) - total) > 1e-8
    || Math.abs(edgeLength(standNeckline) - total) > 1e-8) return undefined;
  const minX = Math.min(edge.start.x, edge.end.x);
  const maxX = Math.max(edge.start.x, edge.end.x);
  const stationX = backLength;
  if (edge.start.y !== edge.end.y || stationX < minX || stationX > maxX || edge.start.x === edge.end.x) return undefined;
  const t = (stationX - edge.start.x) / (edge.end.x - edge.start.x);
  return { x: stationX, y: edge.start.y + (edge.end.y - edge.start.y) * t };
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
  if (landmark.kind === "woven-neckline-shoulder") {
    if (landmark.stitchLabel !== "Outer stand ↔ woven neckline") {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: "Woven collar shoulder landmark must name the source neckline stitch." });
      return undefined;
    }
    const resolved = wovenNecklineShoulderPoint(block, roleId, edge, piece);
    if (!resolved) {
      issues.push({ code: "INVALID_STITCH_BOUNDARY", sourceId, message: `Woven collar shoulder station does not resolve on “${roleId}.${edge.name}” from the current ordered neckline stitch and collar-edge topology.` });
    }
    return resolved;
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
        validateRole(faceKind, rawRole, block, "SHELL", usedInstances, issues);
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
      validateRole(faceKind, rawRole, block, treatment, usedInstances, issues);
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
