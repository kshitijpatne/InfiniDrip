import { edgeEnd, edgeLength, edgeStart, type Edge } from "../drafting/piece";
import type { Block } from "../drafting/block";
import type { FlatPoint, FlatPathCommand, TechnicalFlatPrimitive } from "./technical-flat";
import type { FlatRoleTransform } from "./technical-flat-assembly";
import type { TechnicalFlatViewKind } from "./technical-flat";

export type WovenCollarRoleId = "outerStand" | "innerStand" | "upperCollar" | "underCollar";

const EPSILON = 1e-8;

function distance(a: FlatPoint, b: FlatPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function samePoint(a: FlatPoint, b: FlatPoint): boolean {
  return distance(a, b) <= EPSILON;
}

function sourceEdge(block: Block, roleId: string, edgeId: string): Edge | undefined {
  return block.roles[roleId]?.edges.find((edge) => edge.name === edgeId);
}

function cubicPoint(edge: Extract<Edge, { kind: "curve" }>, t: number): FlatPoint {
  const u = 1 - t;
  const { start, control1, control2, end } = edge.curve;
  return {
    x: u ** 3 * start.x + 3 * u ** 2 * t * control1.x + 3 * u * t ** 2 * control2.x + t ** 3 * end.x,
    y: u ** 3 * start.y + 3 * u ** 2 * t * control1.y + 3 * u * t ** 2 * control2.y + t ** 3 * end.y,
  };
}

function cubicDerivative(edge: Extract<Edge, { kind: "curve" }>, t: number): FlatPoint {
  const u = 1 - t;
  const { start, control1, control2, end } = edge.curve;
  return {
    x: 3 * u ** 2 * (control1.x - start.x) + 6 * u * t * (control2.x - control1.x) + 3 * t ** 2 * (end.x - control2.x),
    y: 3 * u ** 2 * (control1.y - start.y) + 6 * u * t * (control2.y - control1.y) + 3 * t ** 2 * (end.y - control2.y),
  };
}

function transformPoint(point: FlatPoint, transform: FlatRoleTransform): FlatPoint {
  const x = transform.mirrorX ? -point.x : point.x;
  const angle = transform.rotationDegrees * Math.PI / 180;
  return { x: x * Math.cos(angle) - point.y * Math.sin(angle) + transform.offset.x,
    y: x * Math.sin(angle) + point.y * Math.cos(angle) + transform.offset.y };
}

function transformVector(vector: FlatPoint, transform: FlatRoleTransform): FlatPoint {
  const x = transform.mirrorX ? -vector.x : vector.x;
  const angle = transform.rotationDegrees * Math.PI / 180;
  return { x: x * Math.cos(angle) - vector.y * Math.sin(angle),
    y: x * Math.sin(angle) + vector.y * Math.cos(angle) };
}

function inversePoint(point: FlatPoint, transform: FlatRoleTransform): FlatPoint {
  const angle = -transform.rotationDegrees * Math.PI / 180;
  const dx = point.x - transform.offset.x;
  const dy = point.y - transform.offset.y;
  const rotated = { x: dx * Math.cos(angle) - dy * Math.sin(angle), y: dx * Math.sin(angle) + dy * Math.cos(angle) };
  return { x: transform.mirrorX ? -rotated.x : rotated.x, y: rotated.y };
}

function unit(vector: FlatPoint): FlatPoint | undefined {
  const length = Math.hypot(vector.x, vector.y);
  return Number.isFinite(length) && length > EPSILON
    ? { x: vector.x / length, y: vector.y / length } : undefined;
}

function exactWovenNecklineFraction(block: Block): number | undefined {
  const stitches = block.stitches.filter((stitch) => stitch.label === "Outer stand ↔ woven neckline");
  const stitch = stitches[0];
  const stand = stitch?.a.edges[0];
  const front = stitch?.b.edges[0];
  const back = stitch?.b.edges[1];
  const backRole = "yoke";
  if (stitches.length !== 1 || stitch?.ease !== undefined || stitch.a.edges.length !== 1 || stitch.b.edges.length !== 2
    || !stand || !("edge" in stand) || stand.piece !== "outerStand" || stand.edge !== "neckline" || stand.reversed
    || !front || !("edge" in front) || front.piece !== "front" || front.edge !== "neckline" || front.reversed
    || !back || !("edge" in back) || back.piece !== backRole || back.edge !== "neckline" || back.reversed) return undefined;
  const frontEdge = sourceEdge(block, "front", "neckline");
  const backEdge = sourceEdge(block, backRole, "neckline");
  const standEdge = sourceEdge(block, "outerStand", "neckline");
  if (!frontEdge || !backEdge || !standEdge) return undefined;
  const common = [edgeStart(frontEdge), edgeEnd(frontEdge)].filter((a) =>
    [edgeStart(backEdge), edgeEnd(backEdge)].some((b) => distance(a, b) <= EPSILON));
  const frontLength = edgeLength(frontEdge);
  const backLength = edgeLength(backEdge);
  const total = frontLength + backLength;
  if (common.length !== 1 || !(frontLength > EPSILON) || !(backLength > EPSILON)
    || Math.abs(edgeLength(standEdge) - total) > 1e-7) return undefined;
  return backLength / total;
}

function centerAxisEdge(block: Block, roleId: "front" | "yoke" | "back"): Edge | undefined {
  return sourceEdge(block, roleId, roleId === "front" ? "centerFront" : "centerBack");
}

function edgeEndpointAtAxis(edge: Edge, axis: Edge): "start" | "end" | undefined {
  const startOn = [edgeStart(axis), edgeEnd(axis)].some((candidate) => distance(candidate, edgeStart(edge)) <= 1e-6);
  const endOn = [edgeStart(axis), edgeEnd(axis)].some((candidate) => distance(candidate, edgeEnd(edge)) <= 1e-6);
  if (startOn === endOn) return undefined;
  return startOn ? "start" : "end";
}

function orientedTarget(block: Block, roleId: "front" | "yoke" | "back", edgeId: "neckline", fromAxis: boolean) {
  const edge = sourceEdge(block, roleId, edgeId);
  const axis = centerAxisEdge(block, roleId);
  if (!edge || !axis || !(edgeLength(edge) > EPSILON)) return undefined;
  const endpoint = edgeEndpointAtAxis(edge, axis);
  if (!endpoint) return undefined;
  // Back/yoke is center-back to shoulder; front is shoulder to center-front.
  return { edge, reversed: fromAxis ? endpoint === "end" : endpoint === "start" };
}

/** @internal Pure arclength station resolver used by focused topology tests. */
export function orientedPointAndTangent(
  edge: Edge, reversed: boolean, fraction: number,
): { point: FlatPoint; tangent: FlatPoint } | undefined {
  const clamped = Math.max(0, Math.min(1, fraction));
  const requested = reversed ? 1 - fraction : fraction;
  const sourceFraction = reversed ? 1 - clamped : clamped;
  let point: FlatPoint;
  let tangent: FlatPoint;
  if (edge.kind === "line") {
    point = { x: edge.start.x + (edge.end.x - edge.start.x) * sourceFraction,
      y: edge.start.y + (edge.end.y - edge.start.y) * sourceFraction };
    tangent = { x: edge.end.x - edge.start.x, y: edge.end.y - edge.start.y };
  } else {
    let low = 0;
    let high = 1;
    const targetLength = edgeLength(edge) * sourceFraction;
    for (let index = 0; index < 28; index += 1) {
      const mid = (low + high) / 2;
      const partial: Edge = { ...edge, curve: { ...edge.curve,
        control1: { x: edge.curve.start.x + (edge.curve.control1.x - edge.curve.start.x) * mid,
          y: edge.curve.start.y + (edge.curve.control1.y - edge.curve.start.y) * mid },
        control2: { x: edge.curve.start.x + 2 * (edge.curve.control1.x - edge.curve.start.x) * mid * (1 - mid)
          + (edge.curve.control2.x - edge.curve.start.x) * mid ** 2,
          y: edge.curve.start.y + 2 * (edge.curve.control1.y - edge.curve.start.y) * mid * (1 - mid)
          + (edge.curve.control2.y - edge.curve.start.y) * mid ** 2 },
        end: cubicPoint(edge, mid) } };
      if (edgeLength(partial) < targetLength) low = mid;
      else high = mid;
    }
    const t = (low + high) / 2;
    point = cubicPoint(edge, t);
    tangent = cubicDerivative(edge, t);
  }
  if (requested < 0 || requested > 1) {
    const directionAtEnd = requested < 0 ? 0 : 1;
    const endpoint = edge.kind === "line"
      ? (directionAtEnd === 0 ? edge.start : edge.end)
      : cubicPoint(edge, directionAtEnd);
    const endpointTangent = edge.kind === "line"
      ? { x: edge.end.x - edge.start.x, y: edge.end.y - edge.start.y }
      : cubicDerivative(edge, directionAtEnd);
    const direction = unit(endpointTangent);
    if (!direction) return undefined;
    const extrapolation = edgeLength(edge) * (requested - directionAtEnd);
    point = { x: endpoint.x + direction.x * extrapolation, y: endpoint.y + direction.y * extrapolation };
    tangent = direction;
  }
  if (reversed) tangent = { x: -tangent.x, y: -tangent.y };
  const direction = unit(tangent);
  return direction ? { point, tangent: direction } : undefined;
}

export interface WovenCollarProjector {
  readonly roleId: WovenCollarRoleId;
  readonly revisionId: string;
  projectSourcePoint(point: FlatPoint, sourceEdgeId?: string): FlatPoint | undefined;
  projectPlacedPoint(point: FlatPoint, sourceTransform: FlatRoleTransform, sourceEdgeId?: string): FlatPoint | undefined;
}

/** Build a source-validated, view-only point map for one collar role. The
 * returned function keeps the source stitch graph and cut geometry untouched. */
export function createWovenCollarProjector(
  block: Block,
  revisionId: string,
  roleId: WovenCollarRoleId,
  kind: TechnicalFlatViewKind,
  transforms: Readonly<Record<string, FlatRoleTransform>>,
): WovenCollarProjector | undefined {
  const fraction = exactWovenNecklineFraction(block);
  const sourcePiece = block.roles[roleId];
  const baseEdge = sourceEdge(block, roleId, roleId === "outerStand" || roleId === "innerStand" ? "neckline" : "stand");
  const expectedRefs = roleId === "outerStand"
    ? [["outerStand", "neckline"], ["front", "neckline"], ["yoke", "neckline"]]
    : roleId === "innerStand" ? [["innerStand", "neckline"], ["front", "neckline"], ["yoke", "neckline"]]
      : roleId === "upperCollar" ? [["upperCollar", "stand"], ["innerStand", "collar"]]
        : [["underCollar", "stand"], ["outerStand", "collar"]];
  const stitchLabel = roleId === "outerStand" || roleId === "innerStand"
    ? "Outer stand ↔ woven neckline" : roleId === "upperCollar" ? "Upper collar ↔ inner stand" : "Under collar ↔ outer stand";
  const stitches = block.stitches.filter((stitch) => stitch.label === stitchLabel);
  const hasExactStitch = stitches.length === 1 && stitches[0]!.ease === undefined
    && stitches[0]!.a.edges.length === 1 && stitches[0]!.b.edges.length === expectedRefs.length - 1
    && stitches[0]!.a.edges[0] && "edge" in stitches[0]!.a.edges[0] && stitches[0]!.a.edges[0]!.piece === expectedRefs[0]![0]
    && stitches[0]!.a.edges[0]!.edge === expectedRefs[0]![1]
    && !stitches[0]!.a.edges[0]!.reversed
    && stitches[0]!.b.edges.every((ref, index) => "edge" in ref && !ref.reversed
      && ref.piece === expectedRefs[index + 1]![0] && ref.edge === expectedRefs[index + 1]![1]);
  if (!revisionId.trim() || !fraction || !sourcePiece?.onFold || !baseEdge || baseEdge.kind !== "line"
    || !(edgeLength(baseEdge) > EPSILON) || !hasExactStitch) return undefined;
  const sourceTransform = transforms[roleId];
  const backRole = "yoke";
  const backTarget = orientedTarget(block, backRole, "neckline", true);
  const frontTarget = orientedTarget(block, "front", "neckline", false);
  const backTransform = transforms[backRole];
  const frontTransform = transforms.front;
  if (!sourceTransform || !backTarget || !frontTarget || (kind === "BACK_FLAT" && !backTransform)
    || (kind === "FRONT_FLAT" && !frontTransform)) return undefined;
  const baseStart = roleId === "outerStand" || roleId === "innerStand" ? edgeEnd(baseEdge) : edgeStart(baseEdge);
  const baseEnd = roleId === "outerStand" || roleId === "innerStand" ? edgeStart(baseEdge) : edgeEnd(baseEdge);
  const sourceTangent = unit({ x: baseEnd.x - baseStart.x, y: baseEnd.y - baseStart.y });
  // The exact source base edge was checked above as a nonzero line, so this
  // normalization cannot fail without non-finite source coordinates.
  if (!sourceTangent) return undefined;
  const sourceNormal = { x: -sourceTangent.y, y: sourceTangent.x };
  let stitchedBaseOffset = 0;
  if (roleId === "upperCollar" || roleId === "underCollar") {
    const donorRole = roleId === "upperCollar" ? "innerStand" : "outerStand";
    const donorBase = sourceEdge(block, donorRole, "neckline");
    const donorInterface = sourceEdge(block, donorRole, "collar");
    const collarBase = baseEdge;
    const donorRefs = stitches[0]!.b.edges;
    if (donorBase?.kind !== "line" || donorInterface?.kind !== "line" || collarBase.kind !== "line"
      || donorRefs.length !== 1 || !samePoint(edgeStart(donorInterface), baseStart)
      || !samePoint(edgeEnd(donorInterface), baseEnd)
      || Math.abs(edgeLength(donorBase) - edgeLength(donorInterface)) > 1e-7) return undefined;
    const donorTop = { x: donorInterface.start.x - donorBase.end.x, y: donorInterface.start.y - donorBase.end.y };
    stitchedBaseOffset = donorTop.x * sourceNormal.x + donorTop.y * sourceNormal.y;
  }
  const baseLength = distance(baseStart, baseEnd);
  const exteriorEdgeId = roleId === "outerStand" ? "collar" : "outer";

  const projectSourcePoint = (source: FlatPoint, sourceEdgeId?: string): FlatPoint | undefined => {
    if (!Number.isFinite(source.x) || !Number.isFinite(source.y)) return undefined;
    // A cut-piece vertex shared by the front tip and exterior edge has one
    // source identity, even though each incident edge has a different station
    // rule. Resolve that shared point through the approved exterior transfer
    // so the two emitted runs remain exactly joined after projection.
    const exterior = sourceEdge(block, roleId, exteriorEdgeId);
    const isExteriorEndpoint = exterior?.kind === "line"
      && (samePoint(source, edgeStart(exterior)) || samePoint(source, edgeEnd(exterior)));
    const stationEdgeId = isExteriorEndpoint ? exteriorEdgeId : sourceEdgeId;
    const relative = { x: source.x - baseStart.x, y: source.y - baseStart.y };
    let along = (relative.x * sourceTangent.x + relative.y * sourceTangent.y) / baseLength;
    if (stationEdgeId === exteriorEdgeId || stationEdgeId?.endsWith(`:edge:${exteriorEdgeId}`)) {
      const exteriorEdge = exterior;
      if (exteriorEdge?.kind !== "line") return undefined;
      const delta = { x: exteriorEdge.end.x - exteriorEdge.start.x, y: exteriorEdge.end.y - exteriorEdge.start.y };
      const lengthSquared = delta.x ** 2 + delta.y ** 2;
      if (!(lengthSquared > EPSILON)) return undefined;
      const fraction = ((source.x - exteriorEdge.start.x) * delta.x + (source.y - exteriorEdge.start.y) * delta.y) / lengthSquared;
      along = roleId === "outerStand" ? fraction : 1 - fraction;
    }
    const outside = stitchedBaseOffset + relative.x * sourceNormal.x + relative.y * sourceNormal.y;
    const station = Math.max(-0.1, Math.min(1.1, along));
    if (kind === "FRONT_FLAT" && station < fraction - EPSILON) return undefined;
    if (kind === "BACK_FLAT" && station > fraction + EPSILON) return undefined;
    const onBack = kind === "BACK_FLAT";
    const target = onBack ? backTarget : frontTarget;
    const receiverTransform = (onBack ? backTransform : frontTransform)!;
    const localFraction = onBack ? station / fraction : (station - fraction) / (1 - fraction);
    const resolved = orientedPointAndTangent(target.edge, target.reversed, localFraction);
    if (!resolved) return undefined;
    const targetPoint = transformPoint(resolved.point, receiverTransform);
    // `resolved.tangent` is normalized and this orthogonal rigid transform
    // preserves its length.
    const tangent = unit(transformVector(resolved.tangent, receiverTransform))!;
    const normal = { x: -tangent.y, y: tangent.x };
    return { x: targetPoint.x + normal.x * outside, y: targetPoint.y + normal.y * outside };
  };
  const projectPlacedPoint = (point: FlatPoint, placement: FlatRoleTransform, sourceEdgeId?: string): FlatPoint | undefined =>
    projectSourcePoint(inversePoint(point, placement), sourceEdgeId);
  return { roleId, revisionId, projectSourcePoint, projectPlacedPoint };
}

function lerp(a: FlatPoint, b: FlatPoint, t: number): FlatPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function cubicAt(a: FlatPoint, b: FlatPoint, c: FlatPoint, d: FlatPoint, t: number): FlatPoint {
  return lerp(lerp(lerp(a, b, t), lerp(b, c, t), t), lerp(lerp(b, c, t), lerp(c, d, t), t), t);
}

/** Warp all geometric path points after rigid assembly placement. Both source
 * lines and cubics are sampled into bounded line segments because a
 * non-rigid arclength map cannot be represented by mapping only endpoints or
 * by moving the four original Bézier control points. */
export function projectWovenCollarPrimitive(
  primitive: TechnicalFlatPrimitive,
  projector: WovenCollarProjector,
  roleTransform: FlatRoleTransform,
): TechnicalFlatPrimitive | undefined {
  let sourceEdgeIndex = -1;
  let currentSourceEdgeId: string | undefined;
  const isApprovedCollarAreaBoundary = primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
    && primitive.id.includes(":view-boundary:approved-woven-collar-area-closure")
    && primitive.source.sourceId.includes(":decision:G04-S321-COLLAR-EXTERIOR-ARCLENGTH:boundary:approved-woven-collar-area-closure")
    && primitive.projectionEndpointEdgeIds?.length === 2;
  const map = (point: FlatPoint, edgeId = currentSourceEdgeId) => projector.projectPlacedPoint(point, roleTransform, edgeId);
  if (primitive.kind === "path") {
    const commands: FlatPathCommand[] = [];
    let current: FlatPoint | undefined;
    for (const command of primitive.commands) {
      if (command.op === "move" || command.op === "line") {
        if (command.op === "move") {
          sourceEdgeIndex += 1;
          currentSourceEdgeId = primitive.sourceEdgeIds?.[sourceEdgeIndex];
        }
        const endpointEdgeId = isApprovedCollarAreaBoundary
          ? primitive.projectionEndpointEdgeIds?.[command.op === "move" ? 0 : 1] : currentSourceEdgeId;
        if (command.op === "line" && current && !isApprovedCollarAreaBoundary && !primitive.colorwayBoundaryOnly) {
          const mapped = Array.from({ length: 16 }, (_, index) => map(lerp(current!, command.point, (index + 1) / 16)));
          if (mapped.some((point) => !point)) return undefined;
          commands.push(...mapped.map((point) => ({ op: "line" as const, point: point! })));
        } else {
          const mapped = map(command.point, endpointEdgeId);
          if (!mapped) return undefined;
          commands.push({ ...command, point: mapped });
        }
        current = command.point;
      } else if (command.op === "cubic") {
        if (!current) return undefined;
        const mapped = Array.from({ length: 16 }, (_, index) => map(cubicAt(current!, command.control1, command.control2, command.point, (index + 1) / 16)));
        if (mapped.some((point) => !point)) return undefined;
        commands.push(...mapped.map((point) => ({ op: "line" as const, point: point! })));
        current = command.point;
      } else commands.push(command);
    }
    if (primitive.projectionEndpointEdgeIds) {
      const { projectionEndpointEdgeIds: _projectionEndpointEdgeIds, ...projectedPrimitive } = primitive;
      return { ...projectedPrimitive, commands };
    }
    return { ...primitive, commands };
  }
  if (primitive.kind === "mark" || primitive.kind === "text") {
    const at = map(primitive.kind === "mark" ? primitive.at : primitive.at);
    return at ? { ...primitive, at } : undefined;
  }
  if (primitive.kind === "circle") {
    const center = map(primitive.center);
    return center ? { ...primitive, center } : undefined;
  }
  // The current artwork primitive is a rigid rectangle. Mapping only its
  // origin would leave the rest of its footprint in unprojected coordinates.
  // Keep this overlay fail-closed until the full area can share the collar map.
  if (primitive.kind === "artwork") return undefined;
  return undefined;
}
