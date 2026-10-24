import type { FlatPathPrimitive, FlatPoint, TechnicalFlatPrimitive } from "./technical-flat";
import { transformFlatPrimitive } from "./technical-flat-transform";

export type CrewneckDetachedBandRole = "neckband" | "cuffLeft" | "cuffRight" | "hemBand";

export interface CrewneckDetachedBandDetailInput {
  readonly occupiedPrimitives: readonly TechnicalFlatPrimitive[];
  readonly bandPrimitives: Readonly<Record<CrewneckDetachedBandRole, readonly TechnicalFlatPrimitive[]>>;
  readonly axisX: number;
  readonly revisionId: string;
}

export interface CrewneckDetachedBandDetailResult {
  readonly primitives: readonly TechnicalFlatPrimitive[];
  readonly issue?: string;
}

interface Bounds { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number }

const EDGE_NAMES = ["join", "sideRight", "joinLayer", "sideLeft"] as const;
const MARK_NAMES = ["bandFold", "greatestStretchDirection"] as const;
const ROLES: readonly CrewneckDetachedBandRole[] = ["neckband", "cuffLeft", "cuffRight", "hemBand"];

function coordinates(value: unknown, output: FlatPoint[]): void {
  if (typeof value !== "object" || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) coordinates(item, output);
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.x === "number" && Number.isFinite(record.x)
    && typeof record.y === "number" && Number.isFinite(record.y)) {
    output.push({ x: record.x, y: record.y });
  }
  for (const [key, child] of Object.entries(record)) {
    if (key !== "x" && key !== "y") coordinates(child, output);
  }
}

function bounds(points: readonly FlatPoint[]): Bounds | undefined {
  if (points.length === 0) return undefined;
  const xs = points.map((candidate) => candidate.x);
  const ys = points.map((candidate) => candidate.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function primitiveMarkName(primitive: TechnicalFlatPrimitive): string | undefined {
  if (primitive.kind === "mark") return primitive.markName;
  if (primitive.kind === "path") return primitive.patternMark?.name;
  return undefined;
}

function roleSources(roleId: CrewneckDetachedBandRole, primitives: readonly TechnicalFlatPrimitive[], revisionId: string) {
  const prefix = `pattern:crewneck:mark:${roleId}:`;
  const outlines = primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path"
    && primitive.source.sourceId === `pattern:crewneck:role:${roleId}`);
  const marks = primitives.filter((primitive) => primitive.source.sourceId.startsWith(prefix));
  const expectedSourceEdges = EDGE_NAMES.map((edgeId) => `pattern:crewneck:role:${roleId}:edge:${edgeId}`);
  const exactOutline = outlines.length === 1 && outlines[0]!.source.revisionId === revisionId
    && JSON.stringify(outlines[0]!.sourceEdgeIds) === JSON.stringify(expectedSourceEdges);
  const exactMarks = marks.length === MARK_NAMES.length && marks.every((primitive) => primitive.source.revisionId === revisionId)
    && JSON.stringify(marks.map(primitiveMarkName).sort()) === JSON.stringify([...MARK_NAMES].sort());
  const sameRevision = primitives.every((primitive) => primitive.source.revisionId === revisionId);
  if (!exactOutline || !exactMarks || !sameRevision) return undefined;
  const outlinePoints: FlatPoint[] = [];
  coordinates(outlines[0]!.commands, outlinePoints);
  const outlineBounds = bounds(outlinePoints);
  return outlineBounds ? { primitives, outline: outlines[0]!, marks, bounds: outlineBounds } : undefined;
}

/** Retain all four detached rib outlines and their source marks at source scale
 * in a labeled detail area below the exact assembled view. */
export function composeCrewneckDetachedBandDetails(
  input: CrewneckDetachedBandDetailInput,
): CrewneckDetachedBandDetailResult {
  if (!Number.isFinite(input.axisX) || !input.revisionId.trim()) {
    return { primitives: [], issue: "Crewneck detached details require a finite assembled center axis and live revision." };
  }
  const occupied: FlatPoint[] = [];
  coordinates(input.occupiedPrimitives, occupied);
  const occupiedBounds = bounds(occupied);
  if (!occupiedBounds) {
    return { primitives: [], issue: "Crewneck detached details cannot determine clear space from the assembled view." };
  }
  const sources = ROLES.map((roleId) => ({ roleId, source: roleSources(roleId, input.bandPrimitives[roleId], input.revisionId) }));
  if (sources.some((entry) => entry.source === undefined)) {
    return { primitives: [], issue: "Crewneck detached details require all four exact same-revision source outlines and marks." };
  }
  const resolved = sources.map((entry) => ({ roleId: entry.roleId, ...entry.source! }));
  const firstRow = resolved.filter((entry) => entry.roleId !== "hemBand");
  const hemBand = resolved.find((entry) => entry.roleId === "hemBand")!;
  const gap = 4;
  const rowWidth = firstRow.reduce((sum, entry) => sum + entry.bounds.maxX - entry.bounds.minX, 0)
    + gap * (firstRow.length - 1);
  const rowX = input.axisX - rowWidth / 2;
  const rowY = occupiedBounds.maxY + 4;
  const rowHeight = Math.max(...firstRow.map((entry) => entry.bounds.maxY - entry.bounds.minY));
  const hemX = input.axisX - (hemBand.bounds.maxX - hemBand.bounds.minX) / 2;
  const hemY = rowY + rowHeight + gap;
  const placements = new Map<CrewneckDetachedBandRole, { readonly x: number; readonly y: number }>();
  let cursorX = rowX;
  for (const entry of firstRow) {
    placements.set(entry.roleId, { x: cursorX - entry.bounds.minX, y: rowY - entry.bounds.minY });
    cursorX += entry.bounds.maxX - entry.bounds.minX + gap;
  }
  placements.set("hemBand", { x: hemX - hemBand.bounds.minX, y: hemY - hemBand.bounds.minY });

  const detailPrimitives = resolved.flatMap((entry) => {
    const offset = placements.get(entry.roleId)!;
    const sourcePrimitives = entry.primitives.map((primitive) => ({
      ...transformFlatPrimitive(primitive, { offset, rotationDegrees: 0, mirrorX: false }),
      id: `${primitive.id}:detached-detail`,
    }));
    const labels: Readonly<Record<CrewneckDetachedBandRole, string>> = {
      neckband: "DETAIL ONLY—not at assembly location · neckband · source scale",
      cuffLeft: "DETAIL ONLY—not at assembly location · left cuff · source scale",
      cuffRight: "DETAIL ONLY—not at assembly location · right cuff · source scale",
      hemBand: "DETAIL ONLY—not at assembly location · hem band · source scale",
    };
    sourcePrimitives.push({ kind: "text", id: `view:crewneck:detached-detail:${entry.roleId}:label`,
      layer: "ANNOTATION", feature: "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: `view:crewneck:decision:G07-S1113-CREWNECK-DETACHED-BAND-DETAILS:${entry.roleId}`, revisionId: input.revisionId },
      at: { x: entry.bounds.minX + offset.x, y: entry.bounds.minY + offset.y - 1.5 }, text: labels[entry.roleId] });
    return sourcePrimitives;
  });
  return { primitives: detailPrimitives };
}
