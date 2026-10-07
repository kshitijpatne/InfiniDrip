import type { Block } from "../drafting/block";
import type { Pom } from "../drafting/pom";
import { edgeEnd, edgeStart, type Piece } from "../drafting/piece";
import type { Point } from "../geometry/point";
import type { PatternMark } from "../drafting/pattern-mark";
import type { FlatCalloutPrimitive, TechnicalFlatNotice, TechnicalFlatPrimitive, TechnicalFlatViewKind } from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";

export interface TechnicalFlatPomIssue {
  readonly code:
    | "INVALID_REVISION_ID"
    | "UNSUPPORTED_RECIPE"
    | "MISSING_ANCHOR_ROLE"
    | "MISSING_ANCHOR_GEOMETRY"
    | "INVALID_POM"
    | "INVALID_POM_MEASURE"
    | "INVALID_POM_ANCHOR"
    | "DUPLICATE_POM_ID"
    | "LABEL_COLLISION";
  readonly sourceId: string;
  readonly message: string;
}

/** Resolve only the authored point name; an absent property remains undefined and fails validation. */
function authoredMarkPoint(mark: PatternMark, pointName: "at" | "start" | "end"): Point | undefined {
  return (mark as unknown as Readonly<Record<"at" | "start" | "end", Point>>)[pointName];
}

export interface TechnicalFlatPomCallouts {
  readonly recipeId: string;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly callouts: readonly FlatCalloutPrimitive[] | null;
  readonly notices: readonly TechnicalFlatNotice[];
  readonly issues: readonly TechnicalFlatPomIssue[];
}

export interface TechnicalFlatPomResolvedAnchor {
  readonly targetGeometryId: string;
  readonly point: Point;
  /** Optional untransformed source point used to validate the exact source entity. */
  readonly sourcePoint?: Point;
  /** Stable pattern source identity represented by this callout anchor. */
  readonly sourceEntityId?: string;
}

interface LabelBox {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

interface PositionedCallout {
  readonly anchor: Point;
  readonly labelAt: Point;
  readonly box: LabelBox;
}

const finitePoint = (value: unknown): value is Point => typeof value === "object" && value !== null
  && !Array.isArray(value)
  && typeof (value as Point).x === "number" && Number.isFinite((value as Point).x)
  && typeof (value as Point).y === "number" && Number.isFinite((value as Point).y);

function stableSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isSourceVertex(piece: Piece, point: Point): boolean {
  return piece.edges.some((edge) => {
    const start = edgeStart(edge);
    const end = edgeEnd(edge);
    return (start.x === point.x && start.y === point.y) || (end.x === point.x && end.y === point.y);
  });
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Point, b: Point, point: Point): boolean {
  return Math.min(a.x, b.x) <= point.x && point.x <= Math.max(a.x, b.x)
    && Math.min(a.y, b.y) <= point.y && point.y <= Math.max(a.y, b.y);
}

export function technicalFlatLeaderSegmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  const abc = orientation(a, b, c);
  const abd = orientation(a, b, d);
  const cda = orientation(c, d, a);
  const cdb = orientation(c, d, b);
  if (((abc > 0 && abd < 0) || (abc < 0 && abd > 0))
    && ((cda > 0 && cdb < 0) || (cda < 0 && cdb > 0))) return true;
  return (abc === 0 && onSegment(a, b, c)) || (abd === 0 && onSegment(a, b, d))
    || (cda === 0 && onSegment(c, d, a)) || (cdb === 0 && onSegment(c, d, b));
}

export function technicalFlatLeaderCrossesBox(start: Point, end: Point, box: LabelBox): boolean {
  if (start.x >= box.minX && start.x <= box.maxX && start.y >= box.minY && start.y <= box.maxY) return true;
  const topLeft = { x: box.minX, y: box.minY };
  const topRight = { x: box.maxX, y: box.minY };
  const bottomRight = { x: box.maxX, y: box.maxY };
  const bottomLeft = { x: box.minX, y: box.maxY };
  return technicalFlatLeaderSegmentsCross(start, end, topLeft, topRight)
    || technicalFlatLeaderSegmentsCross(start, end, topRight, bottomRight)
    || technicalFlatLeaderSegmentsCross(start, end, bottomRight, bottomLeft)
    || technicalFlatLeaderSegmentsCross(start, end, bottomLeft, topLeft);
}

function labelBox(labelAt: Point, text: string): LabelBox {
  // Source-space print sizing contract: 1.8 mm per character, 4.5 mm line
  // height. The integrated renderer scales these with the view transform.
  const width = Math.max(2.4, text.length * 0.18);
  const height = 0.45;
  return { minX: labelAt.x - width / 2, minY: labelAt.y - height / 2,
    maxX: labelAt.x + width / 2, maxY: labelAt.y + height / 2 };
}

function placeLabel(anchor: Point, text: string, placed: readonly PositionedCallout[]): Point | null {
  const directions = [
    { x: 1, y: -0.4 }, { x: 1, y: 0.4 }, { x: -1, y: -0.4 }, { x: -1, y: 0.4 },
    { x: 0.4, y: -1 }, { x: -0.4, y: -1 }, { x: 0.4, y: 1 }, { x: -0.4, y: 1 },
  ];
  for (let ring = 0; ring < 8; ring += 1) {
    const radius = 1.5 + ring * 0.75;
    for (const direction of directions) {
      const magnitude = Math.hypot(direction.x, direction.y);
      const labelAt = { x: anchor.x + direction.x / magnitude * radius,
        y: anchor.y + direction.y / magnitude * radius };
      const box = labelBox(labelAt, text);
      if (placed.some((previous) => boxesOverlap(previous.box, box)
        || technicalFlatLeaderCrossesBox(anchor, labelAt, previous.box)
        || technicalFlatLeaderCrossesBox(previous.anchor, previous.labelAt, box)
        || ((anchor.x !== previous.anchor.x || anchor.y !== previous.anchor.y)
          && technicalFlatLeaderSegmentsCross(anchor, labelAt, previous.anchor, previous.labelAt)))) continue;
      return labelAt;
    }
  }
  return null;
}

/** Bind face-specific POM methods to exact same-revision outline vertices. */
export function compileTechnicalFlatPomCallouts(
  recipeId: string,
  block: Block,
  revisionId: string,
  kind: TechnicalFlatViewKind,
  poms: readonly Pom[],
  availableGeometry: readonly TechnicalFlatPrimitive[],
  resolveAnchor?: (pom: Pom, sourcePoint: Point) => TechnicalFlatPomResolvedAnchor | undefined,
  keyedScheduleOnlySourceIds: readonly string[] = [],
): TechnicalFlatPomCallouts {
  const issues: TechnicalFlatPomIssue[] = [];
  const notices: TechnicalFlatNotice[] = [];
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (typeof revisionId !== "string" || !revisionId.trim()) {
    issues.push({ code: "INVALID_REVISION_ID", sourceId: recipeId,
      message: "POM callouts need a non-empty design revision." });
  }
  if (!mapping) {
    issues.push({ code: "UNSUPPORTED_RECIPE", sourceId: recipeId,
      message: `Recipe “${recipeId}” has no admitted POM anchor map.` });
  }
  if (issues.length > 0 || !mapping) {
    return { recipeId, revisionId, kind, callouts: null, notices, issues };
  }
  const roleIdFor = (pom: Pom) => kind === "FRONT_FLAT"
    ? pom.anchorRoleId ?? mapping.pomAnchorRole
    : pom.backAnchorRoleId ?? mapping.backPomAnchorRole;
  const faceAnchor = (pom: Pom) => typeof pom === "object" && pom !== null && !Array.isArray(pom)
    ? kind === "FRONT_FLAT" ? pom.anchor : pom.backAnchor
    : undefined;
  const markAnchorFor = (pom: Pom) => typeof pom === "object" && pom !== null && !Array.isArray(pom)
    ? kind === "FRONT_FLAT" ? pom.frontMarkAnchor
      : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined
    : undefined;
  const hasFaceAnchors = poms.some((pom) => faceAnchor(pom) !== undefined || markAnchorFor(pom) !== undefined);
  for (const [index, pom] of poms.entries()) {
    if ((faceAnchor(pom) !== undefined || markAnchorFor(pom) !== undefined) && !roleIdFor(pom)) {
      const segment = typeof pom?.label === "string" ? stableSegment(pom.label) || String(index) : String(index);
      issues.push({ code: "MISSING_ANCHOR_ROLE", sourceId: `pom:${recipeId}:${segment}`,
        message: `POM “${String(pom?.label ?? segment)}” has a face anchor but no mapped source role.` });
    }
  }
  if (kind === "BACK_FLAT") {
    for (const [index, pom] of poms.entries()) {
      if (typeof pom === "object" && pom !== null && !Array.isArray(pom)
        && (pom.anchor || pom.frontMarkAnchor) && !pom.backAnchor && !pom.backMarkAnchor) {
        notices.push({ id: `notice:${recipeId}:BACK_FLAT:pom:${stableSegment(pom.label) || index}:front-only`,
          feature: "pom", reason: "SOURCE_NOT_REPRESENTED", sourceId: `pom:${recipeId}:${stableSegment(pom.label) || index}`,
          message: `POM “${pom.label}” has a front-only source anchor; no back anchor is inferred.` });
      }
    }
    if (!hasFaceAnchors) return { recipeId, revisionId, kind, callouts: [], notices, issues };
  }

  const ids = new Set<string>();
  const positioned: PositionedCallout[] = [];
  const callouts: FlatCalloutPrimitive[] = [];
  for (const [index, pom] of poms.entries()) {
    if (typeof pom !== "object" || pom === null || Array.isArray(pom)) {
      issues.push({ code: "INVALID_POM", sourceId: `pom:${recipeId}:${index}`,
        message: "POM callouts need a valid method record." });
      continue;
    }
    const segment = typeof pom.label === "string" ? stableSegment(pom.label) || String(index) : String(index);
    const sourceId = `pom:${recipeId}:${segment}`;
      if (typeof pom.label !== "string" || !pom.label.trim() || typeof pom.measure !== "function") {
      issues.push({ code: "INVALID_POM", sourceId,
        message: "POM callouts need a non-empty method label and a measurement function." });
      continue;
    }
    const id = `flat:${recipeId}:${kind}:callout:${segment}`;
    if (ids.has(id)) {
      issues.push({ code: "DUPLICATE_POM_ID", sourceId,
        message: `POM “${pom.label}” duplicates another callout identity; give each method a unique label.` });
      continue;
    }
    ids.add(id);
    const anchorMethod = faceAnchor(pom);
    const roleId = roleIdFor(pom);
    const anchorPiece = roleId ? block.roles[roleId] : undefined;
    const markReference = markAnchorFor(pom);
    if (roleId && !anchorPiece && (anchorMethod !== undefined || markReference !== undefined)) {
      issues.push({ code: "MISSING_ANCHOR_ROLE", sourceId,
        message: `POM “${pom.label}” references source role “${roleId}” which is absent from this pattern revision.` });
      continue;
    }
      if (anchorMethod === undefined) {
        if (!markReference) {
        const hasBackOnlyReference = kind === "FRONT_FLAT" && (pom.backAnchor || pom.backMarkAnchor);
        if (kind === "BACK_FLAT" && (pom.anchor || pom.frontMarkAnchor) && !pom.backAnchor && !pom.backMarkAnchor) continue;
        notices.push({ id: `notice:${recipeId}:${kind}:pom:${segment}:table-only`, feature: "pom",
          reason: hasBackOnlyReference ? "SOURCE_NOT_REPRESENTED" : "SOURCE_REFERENCE_MISSING", sourceId,
          message: hasBackOnlyReference
            ? `POM “${pom.label}” has a back-face anchor and remains table-only on the front view.`
            : `POM “${pom.label}” has no geometry anchor and remains table-only.` });
        continue;
      }
      if (typeof markReference.roleId !== "string" || !markReference.roleId
        || typeof markReference.markName !== "string" || !markReference.markName
        || !["at", "start", "end"].includes(markReference.point)) {
          issues.push({ code: "INVALID_POM_ANCHOR", sourceId,
            message: `POM “${pom.label}” needs an exact authored face mark reference.` });
          continue;
      }
      const mark = block.roles[markReference.roleId]?.marks?.find((candidate) => candidate.name === markReference.markName);
      const markPoint = mark && authoredMarkPoint(mark, markReference.point);
      if (!mark || !markPoint || !finitePoint(markPoint)) {
          issues.push({ code: "INVALID_POM_ANCHOR", sourceId,
            message: `POM “${pom.label}” references missing mark point “${markReference.roleId}.${markReference.markName}.${markReference.point}”.` });
          continue;
      }
        let value: number;
        try { value = pom.measure(block); }
        catch (error) {
          const detail = error instanceof Error ? error.message : "the POM method rejected this pattern";
          issues.push({ code: "INVALID_POM_MEASURE", sourceId, message: `POM “${pom.label}” could not be evaluated from this draft: ${detail}.` });
          continue;
        }
        if (typeof value !== "number" || !Number.isFinite(value) || value < 0
          || (pom.tolerance !== undefined && (!Number.isFinite(pom.tolerance) || pom.tolerance < 0))) {
          issues.push({ code: "INVALID_POM_MEASURE", sourceId,
            message: `POM “${pom.label}” must return a finite non-negative centimetre value and any tolerance must be finite and non-negative.` });
          continue;
        }
        const entityId = `pattern:${recipeId}:mark:${markReference.roleId}:${markReference.markName}`;
        const defaultTargetId = `flat:${recipeId}:${kind}:mark:${markReference.roleId}:${markReference.markName}`;
        const resolved = resolveAnchor ? resolveAnchor(pom, markPoint) : { targetGeometryId: defaultTargetId, point: markPoint,
          sourcePoint: markPoint, sourceEntityId: entityId };
        const target = resolved && availableGeometry.find((primitive) => primitive.id === resolved.targetGeometryId
          && primitive.source.sourceId === entityId && primitive.source.revisionId === revisionId
          && (primitive.kind === "mark" ? primitive.at.x === (resolved.sourcePoint ?? resolved.point).x
            && primitive.at.y === (resolved.sourcePoint ?? resolved.point).y
            : primitive.kind === "path" && primitive.patternMark?.name === markReference.markName
              && primitive.commands.some((command) => command.op !== "close"
                && command.point.x === (resolved.sourcePoint ?? resolved.point).x
                && command.point.y === (resolved.sourcePoint ?? resolved.point).y)));
        if (!resolved || !target || !finitePoint(resolved.point)
          || (resolved.sourcePoint !== undefined && (resolved.sourcePoint.x !== markPoint.x
            || resolved.sourcePoint.y !== markPoint.y))
          || (resolved.sourceEntityId !== undefined && resolved.sourceEntityId !== entityId)) {
          issues.push({ code: "MISSING_ANCHOR_GEOMETRY", sourceId: resolved?.targetGeometryId ?? entityId,
            message: "POM mark callouts need the exact emitted mark entity in the same face and revision." });
          continue;
        }
        const tolerance = pom.tolerance === undefined ? "" : ` (±${pom.tolerance.toFixed(1)} cm)`;
        const text = `${pom.label}: ${value.toFixed(1)} cm${tolerance}`;
        const labelAt = placeLabel(resolved.point, text, positioned);
        if (!labelAt) {
          issues.push({ code: "LABEL_COLLISION", sourceId, message: `POM “${pom.label}” has no readable label/leader position in the supported search area; adjust the view layout before rendering.` });
          continue;
        }
        positioned.push({ anchor: resolved.point, labelAt, box: labelBox(labelAt, text) });
        callouts.push({ kind: "callout", id, layer: "CALLOUT", feature: "pom",
          source: { sourceClass: "PATTERN_DERIVED", sourceId, revisionId }, text,
          anchor: { primitiveId: resolved.targetGeometryId, point: { ...resolved.point }, sourceEntityId: entityId }, labelAt });
        continue;
    }
    if (typeof anchorMethod !== "function") {
      issues.push({ code: "INVALID_POM", sourceId,
        message: `POM “${pom.label}” has an invalid anchor method.` });
      continue;
    }
    const anchorAvailable = kind === "FRONT_FLAT" ? pom.anchorAvailable : pom.backAnchorAvailable;
    if (anchorAvailable && !anchorAvailable(block)) {
      notices.push({ id: `notice:${recipeId}:${kind}:pom:${segment}:anchor-not-represented`, feature: "pom",
        reason: "SOURCE_NOT_REPRESENTED", sourceId,
        message: `POM “${pom.label}” has no represented source anchor on this option and remains table-only.` });
      continue;
    }

    let value: number;
    let anchor: Point;
    try {
      value = pom.measure(block);
      anchor = anchorMethod(block);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "the POM method rejected this pattern";
      issues.push({ code: "INVALID_POM_MEASURE", sourceId,
        message: `POM “${pom.label}” could not be evaluated from this draft: ${detail}.` });
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0
      || (pom.tolerance !== undefined && (!Number.isFinite(pom.tolerance) || pom.tolerance < 0))) {
      issues.push({ code: "INVALID_POM_MEASURE", sourceId,
        message: `POM “${pom.label}” must return a finite non-negative centimetre value and any tolerance must be finite and non-negative.` });
      continue;
    }
    const anchorEdgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
    const anchorEdge = anchorPiece?.edges.find((edge) => edge.name === anchorEdgeId);
    const dimensionOnlyEdge = pom.viewDimension?.view === kind && pom.viewDimension.kind === "edge-length"
      && pom.viewDimension.roleId === roleId && pom.viewDimension.edgeId === anchorEdgeId
      && anchorEdge !== undefined;
    const edgeMidpoint = anchorEdge ? { x: (edgeStart(anchorEdge).x + edgeEnd(anchorEdge).x) / 2,
      y: (edgeStart(anchorEdge).y + edgeEnd(anchorEdge).y) / 2 } : undefined;
    const edgeOwnsAnchor = anchorEdge && [edgeStart(anchorEdge), edgeEnd(anchorEdge)].some((endpoint) =>
      endpoint.x === anchor.x && endpoint.y === anchor.y);
    const dimensionAnchorIsExactMidpoint = dimensionOnlyEdge && anchorEdge?.kind === "line"
      && anchor.x === edgeMidpoint?.x && anchor.y === edgeMidpoint.y;
    if (!finitePoint(anchor) || !anchorPiece || (!isSourceVertex(anchorPiece, anchor) && !dimensionAnchorIsExactMidpoint)
      || (anchorEdgeId !== undefined && !edgeOwnsAnchor && !dimensionAnchorIsExactMidpoint)) {
      issues.push({ code: "INVALID_POM_ANCHOR", sourceId,
        message: `POM “${pom.label}” must anchor to a finite source vertex on mapped role “${roleId}” and declared edge “${anchorEdgeId ?? "any"}”.` });
      continue;
    }
    const targetGeometryId = `flat:${recipeId}:${kind}:component:${roleId}:outline`;
    const targetGeometry = availableGeometry.find((primitive) => primitive.id === targetGeometryId
      && primitive.kind === "path" && primitive.source.revisionId === revisionId);
    const sourceEntityId = anchorEdgeId ? `pattern:${recipeId}:role:${roleId}:edge:${anchorEdgeId}` : undefined;
    if (!targetGeometry) {
      issues.push({ code: "MISSING_ANCHOR_GEOMETRY", sourceId: targetGeometryId,
        message: `POM “${pom.label}” targets an edge that is not represented in this face and revision.` });
      continue;
    }
    const edgeIsRepresented = targetGeometry.kind === "path"
      && (!targetGeometry.sourceEdgeIds || !sourceEntityId || targetGeometry.sourceEdgeIds.includes(sourceEntityId));
    if (!edgeIsRepresented && !dimensionOnlyEdge) {
      notices.push({ id: `notice:${recipeId}:${kind}:pom:${segment}:edge-not-represented`, feature: "pom",
        reason: "SOURCE_NOT_REPRESENTED", sourceId,
        message: `POM “${pom.label}” names a source edge that is not drawn on this face; its value remains table-only.` });
      continue;
    }
    const tolerance = pom.tolerance === undefined ? "" : ` (±${pom.tolerance.toFixed(1)} cm)`;
    const text = `${pom.label}: ${value.toFixed(1)} cm${tolerance}`;
    const resolved = resolveAnchor ? resolveAnchor(pom, anchor) : { targetGeometryId, point: anchor, sourcePoint: anchor, sourceEntityId };
    if (!resolved || !finitePoint(resolved.point) || !resolved.targetGeometryId || !availableGeometry.some((primitive) => primitive.id === resolved.targetGeometryId
      && primitive.kind === "path" && primitive.source.revisionId === revisionId)
      || (sourceEntityId !== undefined && ((resolved.sourcePoint ?? resolved.point).x !== anchor.x
        || (resolved.sourcePoint ?? resolved.point).y !== anchor.y
        || resolved.sourceEntityId !== sourceEntityId))) {
      issues.push({ code: "MISSING_ANCHOR_GEOMETRY", sourceId: resolved?.targetGeometryId ?? targetGeometryId,
        message: "POM callouts need the exact mapped same-revision source entity in the composed view." });
      continue;
    }
    const scheduleOnly = keyedScheduleOnlySourceIds.includes(sourceId);
    const labelAt = scheduleOnly ? resolved.point : placeLabel(resolved.point, text, positioned);
    if (!labelAt) {
      issues.push({ code: "LABEL_COLLISION", sourceId,
        message: `POM “${pom.label}” has no readable label/leader position in the supported search area; adjust the view layout before rendering.` });
      continue;
    }
    const box = labelBox(labelAt, text);
    if (!scheduleOnly) positioned.push({ anchor: resolved.point, labelAt, box });
    callouts.push({ kind: "callout", id, layer: "CALLOUT", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId, revisionId }, text,
      anchor: { primitiveId: resolved.targetGeometryId, point: { ...resolved.point }, ...(sourceEntityId ? { sourceEntityId } : {}) }, labelAt });
  }
  return { recipeId, revisionId, kind, callouts: issues.length === 0 ? callouts : null, notices, issues };
}
