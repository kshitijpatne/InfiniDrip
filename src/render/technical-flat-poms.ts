import type { Block } from "../drafting/block";
import type { Pom } from "../drafting/pom";
import { edgeEnd, edgeStart, type Piece } from "../drafting/piece";
import type { Point } from "../geometry/point";
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

export interface TechnicalFlatPomCallouts {
  readonly recipeId: string;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly callouts: readonly FlatCalloutPrimitive[] | null;
  readonly notices: readonly TechnicalFlatNotice[];
  readonly issues: readonly TechnicalFlatPomIssue[];
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

/** Bind existing POM methods to exact front outline vertices. Current recipe
 * anchors are authored for the front piece only; the back view is explicit
 * about that limit instead of mirroring or guessing an anchor. */
export function compileTechnicalFlatPomCallouts(
  recipeId: string,
  block: Block,
  revisionId: string,
  kind: TechnicalFlatViewKind,
  poms: readonly Pom[],
  availableGeometry: readonly TechnicalFlatPrimitive[],
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
  if (kind === "BACK_FLAT") {
    const anchoredPoms = poms.filter((pom) => pom.anchor !== undefined);
    for (const [index, pom] of anchoredPoms.entries()) {
      notices.push({ id: `notice:${recipeId}:BACK_FLAT:pom:${stableSegment(pom.label) || index}:front-only`,
        feature: "pom", reason: "SOURCE_NOT_REPRESENTED", sourceId: `pom:${recipeId}:${stableSegment(pom.label) || index}`,
        message: `POM “${pom.label}” has a front-only source anchor; no back anchor is inferred.` });
    }
    return { recipeId, revisionId, kind, callouts: [], notices, issues };
  }

  const roleId = mapping.pomAnchorRole;
  const anchorPiece = block.roles[roleId];
  if (!anchorPiece) {
    issues.push({ code: "MISSING_ANCHOR_ROLE", sourceId: `pattern:${recipeId}:role:${roleId}`,
      message: `POM anchors require the mapped source role “${roleId}” in this pattern revision.` });
  }
  const targetGeometryId = `flat:${recipeId}:${kind}:component:${roleId}:outline`;
  const targetGeometry = availableGeometry.find((primitive) => primitive.id === targetGeometryId
    && primitive.kind === "path"
    && primitive.source.revisionId === revisionId);
  if (!targetGeometry) {
    issues.push({ code: "MISSING_ANCHOR_GEOMETRY", sourceId: targetGeometryId,
      message: "POM callouts need the mapped role outline in the same face and revision." });
  }
  if (issues.length > 0) return { recipeId, revisionId, kind, callouts: null, notices, issues };

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
    if (pom.anchor === undefined) {
      notices.push({ id: `notice:${recipeId}:${kind}:pom:${segment}:table-only`, feature: "pom",
        reason: "SOURCE_REFERENCE_MISSING", sourceId,
        message: `POM “${pom.label}” has no geometry anchor and remains table-only.` });
      continue;
    }
    if (typeof pom.anchor !== "function") {
      issues.push({ code: "INVALID_POM", sourceId,
        message: `POM “${pom.label}” has an invalid anchor method.` });
      continue;
    }

    let value: number;
    let anchor: Point;
    try {
      value = pom.measure(block);
      anchor = pom.anchor(block);
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
    if (!finitePoint(anchor) || !isSourceVertex(anchorPiece, anchor)) {
      issues.push({ code: "INVALID_POM_ANCHOR", sourceId,
        message: `POM “${pom.label}” must anchor to a finite vertex on mapped role “${roleId}”; edit the method or pattern mapping.` });
      continue;
    }
    const tolerance = pom.tolerance === undefined ? "" : ` (±${pom.tolerance.toFixed(1)} cm)`;
    const text = `${pom.label}: ${value.toFixed(1)} cm${tolerance}`;
    const labelAt = placeLabel(anchor, text, positioned);
    if (!labelAt) {
      issues.push({ code: "LABEL_COLLISION", sourceId,
        message: `POM “${pom.label}” has no readable label/leader position in the supported search area; adjust the view layout before rendering.` });
      continue;
    }
    const box = labelBox(labelAt, text);
    positioned.push({ anchor, labelAt, box });
    callouts.push({ kind: "callout", id, layer: "CALLOUT", feature: "pom",
      source: { sourceClass: "PATTERN_DERIVED", sourceId, revisionId }, text,
      anchor: { primitiveId: targetGeometryId, point: { ...anchor } }, labelAt });
  }
  return { recipeId, revisionId, kind, callouts: issues.length === 0 ? callouts : null, notices, issues };
}
