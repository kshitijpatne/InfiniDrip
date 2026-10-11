import type { FlatPathPrimitive, FlatPoint, TechnicalFlatPrimitive } from "./technical-flat";
import { transformFlatPrimitive } from "./technical-flat-transform";

export interface WovenDetachedBandDetailInput {
  readonly bodyPrimitives: readonly TechnicalFlatPrimitive[];
  readonly bandPrimitives: readonly TechnicalFlatPrimitive[];
  readonly axisX: number;
  readonly revisionId: string;
}

export interface WovenDetachedBandDetailResult {
  readonly primitives: readonly TechnicalFlatPrimitive[];
  readonly issue?: string;
}

function pathPoints(primitive: TechnicalFlatPrimitive): FlatPoint[] {
  if (primitive.kind !== "path") return [];
  return primitive.commands.flatMap((command) => command.op === "cubic"
    ? [command.control1, command.control2, command.point]
    : command.op === "close" ? [] : [command.point]);
}

function bandOutline(primitive: TechnicalFlatPrimitive): primitive is FlatPathPrimitive {
  return primitive.kind === "path" && primitive.sourceEdgeIds?.length === 4
    && primitive.source.sourceId === "pattern:woven-shirt:role:sleeveBand";
}

function bandFold(primitive: TechnicalFlatPrimitive): primitive is FlatPathPrimitive {
  return primitive.kind === "path" && primitive.patternMark?.name === "bandFold"
    && primitive.source.sourceId === "pattern:woven-shirt:mark:sleeveBand:bandFold";
}

/** Build only the approved BACK_FLAT detail instances from exact source paths. */
export function composeWovenDetachedBandDetails(input: WovenDetachedBandDetailInput): WovenDetachedBandDetailResult {
  const outlines = input.bandPrimitives.filter(bandOutline);
  const folds = input.bandPrimitives.filter(bandFold);
  if (!Number.isFinite(input.axisX) || outlines.length !== 1 || folds.length !== 1
    || input.bandPrimitives.some((primitive) => primitive.source.revisionId !== input.revisionId)) {
    return { primitives: [], issue: "The approved detached Woven band detail requires the exact same-revision outline, bandFold mark, and vertical back.centerBack axis; this face is withheld." };
  }
  const bodyPoints = input.bodyPrimitives.flatMap(pathPoints);
  const outlinePoints = pathPoints(outlines[0]!);
  if (bodyPoints.length === 0 || outlinePoints.length === 0) {
    return { primitives: [], issue: "The approved detached Woven band detail cannot determine source-bound body and band extents; this face is withheld." };
  }
  const min = (values: readonly number[]) => Math.min(...values);
  const max = (values: readonly number[]) => Math.max(...values);
  const bodyLeft = min(bodyPoints.map((point) => point.x));
  const bodyRight = max(bodyPoints.map((point) => point.x));
  const bodyTop = min(bodyPoints.map((point) => point.y));
  const bodyBottom = max(bodyPoints.map((point) => point.y));
  const sourceMinX = min(outlinePoints.map((point) => point.x));
  const sourceMaxX = max(outlinePoints.map((point) => point.x));
  const sourceMinY = min(outlinePoints.map((point) => point.y));
  const clearance = Math.max(bodyRight - input.axisX, input.axisX - bodyLeft) + 1;
  const centerY = (bodyTop + bodyBottom) / 2;
  const transforms = [
    { instance: "left", rotationDegrees: 90, mirrorX: false,
      offset: { x: input.axisX - clearance + sourceMinY, y: centerY - (sourceMinX + sourceMaxX) / 2 } },
    { instance: "right", rotationDegrees: -90, mirrorX: true,
      offset: { x: input.axisX + clearance - sourceMinY, y: centerY - (sourceMinX + sourceMaxX) / 2 } },
  ] as const;
  const result = transforms.flatMap(({ instance, ...transform }) => input.bandPrimitives.map((primitive) => ({
    ...transformFlatPrimitive(primitive, transform), id: `${primitive.id}:detached-detail:${instance}`,
  })));
  result.push({ kind: "text", id: "view:woven-shirt:BACK_FLAT:detached-band-detail:source-stitch",
    layer: "ANNOTATION", feature: "annotation",
    source: { sourceClass: "PATTERN_DERIVED", sourceId: "view:woven-shirt:decision:G04-S370-WOVEN-DETACHED-BAND-DETAIL",
      revisionId: input.revisionId }, at: { x: input.axisX - clearance, y: bodyTop - 1.5 },
    text: "DETAIL ONLY—not at assembly location · source stitch: sleeveBand.top ↔ full sleeve.hem; BACK receiver interval [0,0.5]" });
  return { primitives: result };
}
