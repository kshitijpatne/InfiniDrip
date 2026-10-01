import {
  TECHNICAL_FLAT_LAYER_ORDER,
  validateTechnicalFlat,
  type FlatPathCommand,
  type FlatPoint,
  type TechnicalFlatPrimitive,
  type TechnicalFlatView,
  type TechnicalFlatLayer,
} from "./technical-flat";
import type { TechnicalFlatColorwayOverlay } from "./technical-flat-overlays";
import { technicalFlatLeaderCrossesBox, technicalFlatLeaderSegmentsCross } from "./technical-flat-poms";

const FONT_SIZE_CM = 0.32;
const FONT_FAMILY = "Arial, sans-serif";
const EDGE_STROKE_CM = 0.035;
const MARK_RADIUS_CM = 0.11;
const PADDING_CM = 0.7;
const NOTICE_WIDTH_CM = 30;
const LABEL_GAP_CM = 0.08;
const LABEL_SEARCH_STEP_CM = 0.25;
const LABEL_SEARCH_RINGS = 48;
const SVG_NS = "http://www.w3.org/2000/svg";

export interface TechnicalFlatTextMetrics {
  readonly widthCm: number;
  readonly ascentCm: number;
  readonly descentCm: number;
}

/** Metrics are measured in the same browser/font settings that will display the SVG. */
export type TechnicalFlatMeasureText = (text: string, fontSizeCm: number, fontFamily: string) => TechnicalFlatTextMetrics;

export interface TechnicalFlatSvgOptions {
  readonly measureText: TechnicalFlatMeasureText;
  readonly colorway?: TechnicalFlatColorwayOverlay;
  readonly title?: string;
}

export interface TechnicalFlatSvgIssue {
  readonly code: "INVALID_VIEW" | "FONT_METRICS_UNAVAILABLE" | "INVALID_FONT_METRICS"
    | "COLORWAY_REVISION_MISMATCH" | "COLORWAY_TARGET_MISSING" | "COLORWAY_CONTOUR_UNCLOSED" | "TEXT_COLLISION";
  readonly entityId?: string;
  readonly message: string;
}

export interface TechnicalFlatSvgResult {
  readonly svg: string | null;
  readonly issues: readonly TechnicalFlatSvgIssue[];
  readonly textBounds: Readonly<Record<string, { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number }>>;
}

interface Bounds { minX: number; minY: number; maxX: number; maxY: number }
interface TextItem {
  id: string;
  text: string;
  at: FlatPoint;
  anchor: "start" | "middle";
  source: TechnicalFlatPrimitive["source"];
  feature: TechnicalFlatPrimitive["feature"];
  layer: TechnicalFlatLayer;
  callout?: Extract<TechnicalFlatPrimitive, { kind: "callout" }>;
}
interface PlacedText { readonly item: TextItem; readonly bounds: Bounds; readonly at: FlatPoint }

const finite = (value: number): boolean => Number.isFinite(value);
const escapeXml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
const fmt = (value: number): string => Number(value.toFixed(4)).toString();

function union(a: Bounds, b: Bounds): Bounds {
  return { minX: Math.min(a.minX, b.minX), minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX), maxY: Math.max(a.maxY, b.maxY) };
}

function pointBounds(point: FlatPoint, radius = 0): Bounds {
  return { minX: point.x - radius, minY: point.y - radius, maxX: point.x + radius, maxY: point.y + radius };
}

function pathBounds(commands: readonly FlatPathCommand[]): Bounds | null {
  let bounds: Bounds | null = null;
  for (const command of commands) {
    const points = command.op === "cubic"
      ? [command.control1, command.control2, command.point]
      : command.op === "close" ? [] : [command.point];
    for (const point of points) bounds = bounds ? union(bounds, pointBounds(point)) : pointBounds(point);
  }
  return bounds;
}

function artworkBounds(primitive: Extract<TechnicalFlatPrimitive, { kind: "artwork" }>): Bounds {
  const radians = primitive.transform.rotationDegrees * Math.PI / 180;
  const sx = primitive.widthCm * primitive.transform.scale / 2;
  const sy = primitive.heightCm * primitive.transform.scale / 2;
  const corners = [[-sx, -sy], [sx, -sy], [sx, sy], [-sx, sy]] as const;
  const points = corners.map(([x, y]) => ({
    x: primitive.transform.dx + x * Math.cos(radians) - y * Math.sin(radians),
    y: primitive.transform.dy + x * Math.sin(radians) + y * Math.cos(radians),
  }));
  return points.reduce((result, point) => union(result, pointBounds(point)), pointBounds(points[0]!));
}

function primitiveBounds(primitive: TechnicalFlatPrimitive): Bounds | null {
  switch (primitive.kind) {
    case "path": return pathBounds(primitive.commands);
    case "circle": return pointBounds(primitive.center, primitive.radius);
    case "mark": return pointBounds(primitive.at, MARK_RADIUS_CM);
    case "text": return pointBounds(primitive.at);
    case "artwork": return artworkBounds(primitive);
    case "callout": return union(pointBounds(primitive.anchor.point), pointBounds(primitive.labelAt));
  }
}

function pathData(commands: readonly FlatPathCommand[]): string {
  return commands.map((command) => {
    if (command.op === "close") return "Z";
    if (command.op === "move") return `M${fmt(command.point.x)} ${fmt(command.point.y)}`;
    if (command.op === "line") return `L${fmt(command.point.x)} ${fmt(command.point.y)}`;
    return `C${fmt(command.control1.x)} ${fmt(command.control1.y)} ${fmt(command.control2.x)} ${fmt(command.control2.y)} ${fmt(command.point.x)} ${fmt(command.point.y)}`;
  }).join(" ");
}

/** Connect only explicitly coincident authored edge endpoints for area paint.
 * The separate source edge path remains responsible for all visible strokes. */
interface ContourEdge {
  readonly from: FlatPoint;
  readonly to: FlatPoint;
  readonly command: Extract<FlatPathCommand, { op: "line" | "cubic" }>;
  readonly ownerId: string;
  readonly sourceEdgeId?: string;
}

function sourceEdges(commands: readonly FlatPathCommand[], ownerId: string, sourceEdgeIds?: readonly string[]): ContourEdge[] | null {
  let start: FlatPoint | null = null;
  let current: FlatPoint | null = null;
  let subpathHasEdge = false;
  let subpathIndex = -1;
  let sourceEdgeId: string | undefined;
  const edges: ContourEdge[] = [];
  for (const command of commands) {
    if (command.op === "move") {
      subpathIndex += 1;
      sourceEdgeId = sourceEdgeIds?.[subpathIndex];
      start = command.point;
      current = command.point;
      subpathHasEdge = false;
    } else if (command.op === "line") {
      edges.push({ from: current!, to: command.point, command, ownerId, sourceEdgeId });
      current = command.point;
      subpathHasEdge = true;
    } else if (command.op === "cubic") {
      edges.push({ from: current!, to: command.point, command, ownerId, sourceEdgeId });
      current = command.point;
      subpathHasEdge = true;
    } else {
      // A source close command explicitly authors the final segment back to
      // the first point; unlike separate edge subpaths, this needs no inferred
      // join or assumed closure.
      if (!start || !current || !subpathHasEdge) return null;
      edges.push({ from: current, to: start, command: { op: "line", point: start }, ownerId,
        sourceEdgeId });
      start = null;
      current = null;
    }
  }
  return edges;
}

function contourEdgeData(edge: ContourEdge, reverse = false): string {
  const command = edge.command;
  const point = reverse ? edge.from : edge.to;
  if (command.op === "line") return `L${fmt(point.x)} ${fmt(point.y)}`;
  if (reverse) return `C${fmt(command.control2.x)} ${fmt(command.control2.y)} ${fmt(command.control1.x)} ${fmt(command.control1.y)} ${fmt(point.x)} ${fmt(point.y)}`;
  return `C${fmt(command.control1.x)} ${fmt(command.control1.y)} ${fmt(command.control2.x)} ${fmt(command.control2.y)} ${fmt(command.point.x)} ${fmt(command.point.y)}`;
}

function pointKey(point: FlatPoint): string {
  // The SVG path serializer emits four decimal centimetres. Compare the
  // canonical values that will actually be emitted, so shared mapped
  // landmarks remain exactly coincident after serialization.
  return `${fmt(point.x)},${fmt(point.y)}`;
}

function closedContourData(primitives: readonly Extract<TechnicalFlatPrimitive, { kind: "path" }>[]): string | null {
  const edges: ContourEdge[] = [];
  for (const primitive of primitives) {
    const source = sourceEdges(primitive.commands, primitive.id, primitive.sourceEdgeIds);
    if (!source) return null;
    edges.push(...source);
  }
  const excludedAxisEdges = new Set<string>();
  for (const primitive of primitives) {
    if (!primitive.sourceEdgeIds) continue;
    const reflected = primitives.find((candidate) => candidate.id === `${primitive.id}:attached-fold-reflection`
      && candidate.source.sourceId === primitive.source.sourceId && candidate.source.revisionId === primitive.source.revisionId);
    if (reflected?.kind !== "path" || !reflected.sourceEdgeIds) continue;
    for (const sourceEdgeId of primitive.sourceEdgeIds) {
      if (!reflected.sourceEdgeIds.includes(sourceEdgeId)) excludedAxisEdges.add(`${primitive.id}\u0000${sourceEdgeId}`);
    }
  }
  const contourEdges = edges.filter((edge) => !edge.sourceEdgeId || !excludedAxisEdges.has(`${edge.ownerId}\u0000${edge.sourceEdgeId}`));
  if (contourEdges.length < 3) return null;
  const adjacency = new Map<string, number[]>();
  contourEdges.forEach((edge, index) => {
    const from = pointKey(edge.from); const to = pointKey(edge.to);
    adjacency.set(from, [...(adjacency.get(from) ?? []), index]);
    adjacency.set(to, [...(adjacency.get(to) ?? []), index]);
  });
  if ([...adjacency.values()].some((incident) => incident.length !== 2)) return null;

  const used = new Set<number>();
  const contours: string[] = [];
  for (let seed = 0; seed < contourEdges.length; seed += 1) {
    if (used.has(seed)) continue;
    const first = contourEdges[seed]!;
    const start = first.from;
    let current = first.to;
    const path = [`M${fmt(start.x)} ${fmt(start.y)}`, contourEdgeData(first)];
    used.add(seed);
    let edgeCount = 1;
    while (pointKey(current) !== pointKey(start)) {
      const next = adjacency.get(pointKey(current))!.filter((index) => !used.has(index));
      const index = next[0]!;
      const edge = contourEdges[index]!;
      const forward = pointKey(edge.from) === pointKey(current);
      path.push(contourEdgeData(edge, !forward));
      current = forward ? edge.to : edge.from;
      used.add(index);
      edgeCount += 1;
    }
    if (edgeCount < 3) return null;
    contours.push(`${path.join(" ")} Z`);
  }
  return contours.join(" ");
}

function colorwayFillPaths(view: TechnicalFlatView, colorway: TechnicalFlatColorwayOverlay): Map<string, string> {
  const fills = new Map<string, string>();
  for (const roleId of colorway.targetRoleIds) {
    const outlines = view.primitives.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
      primitive.kind === "path" && primitive.layer === "GARMENT_SILHOUETTE" && roleFor(primitive) === roleId);
    const contourPaths = [...outlines];
    if (view.recipeId === "trouser" && roleId === "waistband") {
      const attachedPanelRoles = new Set(outlines.flatMap((primitive) => {
        const match = /:waistband:waistband:(frontLeft|frontRight|backLeft|backRight):waist:side-boundary$/u.exec(primitive.id);
        return match ? [match[1]!] : [];
      }));
      for (const panelRole of attachedPanelRoles) {
        const panelOutline = view.primitives.find((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
          primitive.kind === "path" && primitive.layer === "GARMENT_SILHOUETTE"
          && primitive.source.sourceId === `pattern:trouser:role:${panelRole}`);
        if (!panelOutline) continue;
        const seamEdgeId = `pattern:trouser:role:${panelRole}:edge:waist`;
        const seamPath = selectSourceEdgeSubpaths(panelOutline, [seamEdgeId]);
        if (seamPath) contourPaths.push(seamPath);
      }
    }
    const contour = closedContourData(contourPaths);
    if (contour && outlines[0]) fills.set(outlines[0].id, contour);
  }
  return fills;
}

function roleHasCompleteFill(outlines: readonly TechnicalFlatPrimitive[], fills: ReadonlyMap<string, string>): boolean {
  return outlines.length > 0 && fills.has(outlines[0]!.id);
}

function roleFor(primitive: TechnicalFlatPrimitive): string | null {
  const pattern = /^pattern:[^:]+:role:([^:]+)(?::edge:[^:]+)?$/u.exec(primitive.source.sourceId);
  if (pattern) return pattern[1]!;
  const boundary = /^view:[^:]+:role:([^:]+):/u.exec(primitive.source.sourceId);
  if (boundary) return boundary[1]!;
  return /:waistband:waistband:(?:frontLeft|frontRight|backLeft|backRight):waist:side-boundary$/u.test(primitive.id) ? "waistband" : null;
}

function selectSourceEdgeSubpaths(
  primitive: Extract<TechnicalFlatPrimitive, { kind: "path" }>,
  sourceEdgeIds: readonly string[],
): Extract<TechnicalFlatPrimitive, { kind: "path" }> | null {
  if (!primitive.sourceEdgeIds) return null;
  const groups: FlatPathCommand[][] = [];
  let current: FlatPathCommand[] = [];
  for (const command of primitive.commands) {
    if (command.op === "move" && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(command);
  }
  if (current.length > 0) groups.push(current);
  if (groups.length !== primitive.sourceEdgeIds.length) return null;
  const selected = primitive.sourceEdgeIds.flatMap((sourceEdgeId, index) =>
    sourceEdgeIds.includes(sourceEdgeId) ? [{ id: sourceEdgeId, commands: groups[index]! }] : []);
  if (selected.length !== sourceEdgeIds.length) return null;
  return { ...primitive, id: `${primitive.id}:colorway-boundary`, sourceEdgeIds: selected.map((item) => item.id),
    commands: selected.flatMap((item) => item.commands) };
}

function styleFor(primitive: TechnicalFlatPrimitive, positions: ReadonlyMap<string, FlatPoint> = new Map()): string {
  const shared = `data-entity-id="${escapeXml(primitive.id)}" data-feature="${primitive.feature}" data-source-id="${escapeXml(primitive.source.sourceId)}" data-source-class="${primitive.source.sourceClass}" data-revision-id="${escapeXml(primitive.source.revisionId)}"`;
  switch (primitive.kind) {
    case "path": {
      const dash = primitive.patternMark?.kind === "foldLine" ? ` stroke-dasharray="0.18 0.1"` : "";
      return `<path ${shared} data-layer="${primitive.layer}" d="${pathData(primitive.commands)}" fill="none" stroke="#19222b" stroke-width="${EDGE_STROKE_CM}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
    }
    case "circle": return `<circle ${shared} data-layer="${primitive.layer}" cx="${fmt(primitive.center.x)}" cy="${fmt(primitive.center.y)}" r="${fmt(primitive.radius)}" fill="none" stroke="#19222b" stroke-width="${EDGE_STROKE_CM}"/>`;
    case "mark": {
      const shape = primitive.markKind === "buttonhole"
        ? `<rect x="${fmt(primitive.at.x - MARK_RADIUS_CM)}" y="${fmt(primitive.at.y - MARK_RADIUS_CM / 2)}" width="${MARK_RADIUS_CM * 2}" height="${MARK_RADIUS_CM}" rx="${MARK_RADIUS_CM / 2}"/>`
        : `<circle cx="${fmt(primitive.at.x)}" cy="${fmt(primitive.at.y)}" r="${MARK_RADIUS_CM}"/>`;
      return `<g ${shared} data-layer="${primitive.layer}" data-mark-kind="${primitive.markKind}" fill="none" stroke="#19222b" stroke-width="${EDGE_STROKE_CM}">${shape}</g>`;
    }
    case "text": return "";
    case "artwork": {
      const radians = primitive.transform.rotationDegrees;
      const x = primitive.transform.dx - primitive.widthCm * primitive.transform.scale / 2;
      const y = primitive.transform.dy - primitive.heightCm * primitive.transform.scale / 2;
      const width = primitive.widthCm * primitive.transform.scale;
      const height = primitive.heightCm * primitive.transform.scale;
      const transform = `rotate(${fmt(radians)} ${fmt(primitive.transform.dx)} ${fmt(primitive.transform.dy)})`;
      return `<g ${shared} data-layer="ARTWORK" data-artwork-kind="${primitive.artworkKind}" data-placement-id="${escapeXml(primitive.placementId)}" data-asset-id="${escapeXml(primitive.assetId ?? "")}" data-z-order="${primitive.zOrder}" transform="${transform}"><rect x="${fmt(x)}" y="${fmt(y)}" width="${fmt(width)}" height="${fmt(height)}" fill="none" stroke="#526677" stroke-dasharray="0.12 0.08" stroke-width="${EDGE_STROKE_CM}"/><title>Artwork placement: ${escapeXml(primitive.sourceName)}${primitive.assetId ? `; asset ${escapeXml(primitive.assetId)} is not embedded` : "; asset reference missing"}</title></g>`;
    }
    case "callout": {
      const labelAt = positions.get(primitive.id) ?? primitive.labelAt;
      return `<g ${shared} data-layer="${primitive.layer}" data-callout-target="${escapeXml(primitive.anchor.primitiveId)}"><path d="M${fmt(primitive.anchor.point.x)} ${fmt(primitive.anchor.point.y)} L${fmt(labelAt.x)} ${fmt(labelAt.y)}" fill="none" stroke="#344d60" stroke-width="${EDGE_STROKE_CM}"/><circle cx="${fmt(primitive.anchor.point.x)}" cy="${fmt(primitive.anchor.point.y)}" r="${MARK_RADIUS_CM / 2}" fill="#fff" stroke="#344d60" stroke-width="${EDGE_STROKE_CM}"/></g>`;
    }
  }
}

function colorwayAreaMarkup(primitive: Extract<TechnicalFlatPrimitive, { kind: "path" }>, d: string,
  colorway: TechnicalFlatColorwayOverlay): string {
  return `<path data-colorway-fill-for="${escapeXml(primitive.id)}" data-feature="silhouette" data-source-id="${escapeXml(primitive.source.sourceId)}" data-source-class="${primitive.source.sourceClass}" data-revision-id="${escapeXml(primitive.source.revisionId)}" data-layer="${primitive.layer}" d="${d}" fill="${colorway.colorHex}" stroke="none" pointer-events="none"/>`;
}

function intersects(a: Bounds, b: Bounds): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
}

function padded(bounds: Bounds, gap: number): Bounds {
  return { minX: bounds.minX - gap, minY: bounds.minY - gap,
    maxX: bounds.maxX + gap, maxY: bounds.maxY + gap };
}

function pathSegments(commands: readonly FlatPathCommand[]): Array<readonly [FlatPoint, FlatPoint]> {
  const result: Array<readonly [FlatPoint, FlatPoint]> = [];
  let current: FlatPoint | null = null;
  let subpath: FlatPoint | null = null;
  for (const command of commands) {
    if (command.op === "move") { current = command.point; subpath = command.point; }
    else if (command.op === "line") {
      if (current) result.push([current, command.point]);
      current = command.point;
    } else if (command.op === "cubic") {
      if (current) {
        let previous = current;
        for (let step = 1; step <= 16; step += 1) {
          const t = step / 16;
          const inverse = 1 - t;
          const point = { x: inverse ** 3 * current.x + 3 * inverse ** 2 * t * command.control1.x
            + 3 * inverse * t ** 2 * command.control2.x + t ** 3 * command.point.x,
          y: inverse ** 3 * current.y + 3 * inverse ** 2 * t * command.control1.y
            + 3 * inverse * t ** 2 * command.control2.y + t ** 3 * command.point.y };
          result.push([previous, point]);
          previous = point;
        }
      }
      current = command.point;
    } else if (command.op === "close" && current && subpath) {
      result.push([current, subpath]);
      current = subpath;
    }
  }
  return result;
}

function primitiveBlocksText(primitive: TechnicalFlatPrimitive, box: Bounds): boolean {
  if (primitive.kind === "artwork") return intersects(artworkBounds(primitive), box);
  if (primitive.kind === "path") return pathSegments(primitive.commands)
    .some(([start, end]) => technicalFlatLeaderCrossesBox(start, end, box));
  if (primitive.kind === "circle") return intersects(pointBounds(primitive.center, primitive.radius + EDGE_STROKE_CM / 2), box);
  if (primitive.kind === "mark") return intersects(pointBounds(primitive.at, MARK_RADIUS_CM + EDGE_STROKE_CM / 2), box);
  return false;
}

function calloutLeadersConflict(a: FlatPoint, b: FlatPoint, c: FlatPoint, d: FlatPoint): boolean {
  // Two leaders may meet at a source vertex they both represent. Same-ray
  // overlap is still prevented because the later leader may not cross the
  // earlier callout's measured text box.
  return (a.x !== c.x || a.y !== c.y) && technicalFlatLeaderSegmentsCross(a, b, c, d);
}

function labelCandidates(item: TextItem, metric: TechnicalFlatTextMetrics): FlatPoint[] {
  const candidates = [item.at];
  const directions = Array.from({ length: 32 }, (_, index) => ({
    x: Math.cos(index * Math.PI / 16), y: Math.sin(index * Math.PI / 16),
  }));
  for (let ring = 1; ring <= LABEL_SEARCH_RINGS; ring += 1) {
    const radius = ring * LABEL_SEARCH_STEP_CM + Math.max(metric.widthCm, metric.ascentCm + metric.descentCm) / 2;
    for (const direction of directions) candidates.push({ x: item.at.x + direction.x * radius,
      y: item.at.y + direction.y * radius });
  }
  return candidates;
}

function placeMeasuredLabel(item: TextItem, metric: TechnicalFlatTextMetrics,
  placed: readonly PlacedText[], primitives: readonly TechnicalFlatPrimitive[]): FlatPoint | null {
  for (const at of labelCandidates(item, metric)) {
    const box = textBounds(at, metric, item.anchor);
    const separated = padded(box, LABEL_GAP_CM);
    if (placed.some((previous) => intersects(separated, padded(previous.bounds, LABEL_GAP_CM)))) continue;
    if (primitives.some((primitive) => primitive.id !== item.id && primitiveBlocksText(primitive, separated))) continue;
    const leaderConflict = placed.some((previous) => previous.item.callout
      && technicalFlatLeaderCrossesBox(previous.item.callout.anchor.point, previous.at, separated));
    if (leaderConflict) continue;
    if (item.callout && placed.some((previous) => technicalFlatLeaderCrossesBox(
      item.callout!.anchor.point, at, padded(previous.bounds, LABEL_GAP_CM)))) continue;
    if (item.callout && placed.some((previous) => previous.item.callout
      && calloutLeadersConflict(item.callout!.anchor.point, at,
        previous.item.callout.anchor.point, previous.at))) continue;
    return at;
  }
  return null;
}

function metricFor(text: string, measureText: TechnicalFlatMeasureText): TechnicalFlatTextMetrics | null {
  let metric: TechnicalFlatTextMetrics;
  try { metric = measureText(text, FONT_SIZE_CM, FONT_FAMILY); }
  catch { return null; }
  if (!metric || !finite(metric.widthCm) || !finite(metric.ascentCm) || !finite(metric.descentCm)
    || metric.widthCm < 0 || metric.ascentCm < 0 || metric.descentCm < 0) return null;
  return metric;
}

function textBounds(at: FlatPoint, metric: TechnicalFlatTextMetrics, anchor: "start" | "middle" = "start"): Bounds {
  const left = anchor === "middle" ? at.x - metric.widthCm / 2 : at.x;
  return { minX: left, minY: at.y - metric.ascentCm, maxX: left + metric.widthCm, maxY: at.y + metric.descentCm };
}

function wrap(text: string, maxWidth: number, measureText: TechnicalFlatMeasureText): string[] | null {
  const result: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    const metric = metricFor(candidate, measureText);
    if (!metric) return null;
    if (metric.widthCm > maxWidth && line) {
      result.push(line);
      line = word;
      const wordMetric = metricFor(line, measureText);
      if (!wordMetric || wordMetric.widthCm > maxWidth) return null;
    } else if (metric.widthCm > maxWidth) return null;
    else line = candidate;
  }
  if (line) result.push(line);
  return result;
}

/** Measure in SVG user units with the active browser's SVG text engine. */
export function createBrowserTechnicalFlatTextMeasurer(doc: Document): TechnicalFlatMeasureText {
  if (!doc.body) return () => ({ widthCm: Number.NaN, ascentCm: Number.NaN, descentCm: Number.NaN });
  const measuringSvg = doc.createElementNS(SVG_NS, "svg");
  measuringSvg.setAttribute("aria-hidden", "true");
  measuringSvg.setAttribute("style", "position:fixed;left:-10000px;top:-10000px;visibility:hidden;overflow:visible");
  measuringSvg.setAttribute("width", "100cm");
  measuringSvg.setAttribute("height", "100cm");
  measuringSvg.setAttribute("viewBox", "0 0 100 100");
  doc.body.append(measuringSvg);
  return (text, fontSizeCm, fontFamily) => {
    const element = doc.createElementNS(SVG_NS, "text");
    element.setAttribute("font-size", fmt(fontSizeCm));
    element.setAttribute("font-family", fontFamily);
    element.textContent = text;
    measuringSvg.append(element);
    try {
      const box = element.getBBox();
      return { widthCm: element.getComputedTextLength(), ascentCm: Math.max(0, -box.y),
        descentCm: Math.max(0, box.y + box.height) };
    } finally {
      element.remove();
    }
  };
}

/** Render a fully revision-validated semantic view as ordered, inspectable SVG. */
export function renderTechnicalFlatSvg(view: TechnicalFlatView, options: TechnicalFlatSvgOptions): TechnicalFlatSvgResult {
  const issues: TechnicalFlatSvgIssue[] = [];
  const viewIssues = validateTechnicalFlat(view);
  if (viewIssues.length) {
    return { svg: null, issues: viewIssues.map((issue) => ({ code: "INVALID_VIEW", entityId: issue.entityId,
      message: issue.message })), textBounds: {} };
  }
  if (!options || typeof options.measureText !== "function") {
    return { svg: null, issues: [{ code: "FONT_METRICS_UNAVAILABLE", message: "Open this flat in a browser with text measurement enabled before judging label readability." }], textBounds: {} };
  }
  if (options.colorway && options.colorway.revisionId !== view.revisionId) {
    issues.push({ code: "COLORWAY_REVISION_MISMATCH", entityId: options.colorway.id,
      message: "Fabric colorway and flat must use the same saved design revision." });
  }
  const fillPaths = options.colorway ? colorwayFillPaths(view, options.colorway) : new Map<string, string>();
  if (options.colorway) {
    for (const roleId of options.colorway.targetRoleIds) {
      const outlines = view.primitives.filter((primitive) => primitive.kind === "path"
        && primitive.layer === "GARMENT_SILHOUETTE" && roleFor(primitive) === roleId);
      if (outlines.length === 0) {
        issues.push({ code: "COLORWAY_TARGET_MISSING", entityId: options.colorway.id,
          message: `The ${roleId} colorway has no emitted source outline; keep this face withheld until its role is mapped.` });
        continue;
      }
      if (!roleHasCompleteFill(outlines, fillPaths)) {
        issues.push({ code: "COLORWAY_CONTOUR_UNCLOSED", entityId: outlines[0]?.id,
          message: `The ${roleId} colorway has no exact closed source contour; review its mapped source edges and view boundaries before rendering a color area.` });
      }
    }
  }

  const geometry = view.primitives.map(primitiveBounds).filter((bounds): bounds is Bounds => bounds !== null);
  let bounds = geometry[0] ?? { minX: -0.5, minY: -0.5, maxX: 0.5, maxY: 0.5 };
  for (const item of geometry.slice(1)) bounds = union(bounds, item);
  const textItems: TextItem[] = [];
  const addText = (primitive: TechnicalFlatPrimitive, text: string, at: FlatPoint, anchor: "start" | "middle") => {
    textItems.push({ id: primitive.id, text, at, anchor, source: primitive.source, feature: primitive.feature, layer: primitive.layer });
  };
  for (const primitive of view.primitives) {
    if (primitive.kind === "text") addText(primitive, primitive.text, primitive.at, "start");
    else if (primitive.kind === "callout") {
      addText(primitive, primitive.text, primitive.labelAt, "middle");
      textItems[textItems.length - 1]!.callout = primitive;
    }
    else if (primitive.kind === "mark" && primitive.label) addText(primitive, primitive.label,
      { x: primitive.at.x + MARK_RADIUS_CM * 1.5, y: primitive.at.y }, "start");
    else if (primitive.kind === "path" && primitive.patternMark?.label) {
      const path = pathBounds(primitive.commands)!;
      addText(primitive, primitive.patternMark.label, { x: path.maxX + MARK_RADIUS_CM, y: path.minY }, "start");
    }
  }
  const measured: Record<string, Bounds> = {};
  const positions = new Map<string, FlatPoint>();
  const placed: PlacedText[] = [];
  for (const item of textItems) {
    const metric = metricFor(item.text, options.measureText);
    if (!metric) {
      issues.push({ code: "INVALID_FONT_METRICS", entityId: item.id,
        message: "The browser returned invalid font metrics; keep the flat unreviewed until text can be measured." });
      continue;
    }
    const at = placeMeasuredLabel(item, metric, placed, view.primitives);
    if (!at) {
      issues.push({ code: "TEXT_COLLISION", entityId: item.id,
        message: `Text “${item.text}” has no collision-free measured position near its source; reposition the annotation before review.` });
      continue;
    }
    positions.set(item.id, at);
    const textBox = textBounds(at, metric, item.anchor);
    measured[item.id] = textBox;
    placed.push({ item, bounds: textBox, at });
    bounds = union(bounds, textBox);
  }

  const padBounds = { minX: bounds.minX - PADDING_CM, minY: bounds.minY - PADDING_CM,
    maxX: bounds.maxX + PADDING_CM, maxY: bounds.maxY + PADDING_CM };
  const visibleNotices = [
    ...view.notices,
    ...view.primitives.flatMap((primitive) => primitive.kind === "artwork" ? [{
      id: `notice:${view.recipeId}:${view.kind}:${primitive.id}:asset-content`,
      feature: "artwork" as const,
      reason: "SOURCE_NOT_REPRESENTED" as const,
      sourceId: primitive.source.sourceId,
      message: `Artwork “${primitive.sourceName}” is shown as a placement boundary only; its image content is not embedded in this SVG flat.`,
    }] : []),
  ];
  const noticeLines = visibleNotices.flatMap((notice) => {
    const lines = wrap(notice.message, NOTICE_WIDTH_CM, options.measureText);
    if (!lines) {
      issues.push({ code: "INVALID_FONT_METRICS", entityId: notice.id,
        message: "A visible source notice could not be measured or wrapped; keep the flat blocked until browser text metrics are available." });
      return [];
    }
    return lines.map((line, index) => ({ notice, line, index, count: lines.length }));
  });
  const noticeTop = padBounds.maxY + 0.45;
  const noticeMetrics = noticeLines.map(({ line }) => metricFor(line, options.measureText));
  if (noticeMetrics.some((metric) => metric === null)) {
    issues.push({ code: "INVALID_FONT_METRICS",
      message: "A visible source notice could not be measured for panel placement; keep the flat blocked until browser text metrics are available." });
  }
  const validNoticeMetrics = noticeMetrics.filter((metric): metric is TechnicalFlatTextMetrics => metric !== null);
  const noticeAscent = Math.max(0, ...validNoticeMetrics.map((metric) => metric.ascentCm));
  const noticeDescent = Math.max(0, ...validNoticeMetrics.map((metric) => metric.descentCm));
  const noticeLineHeight = noticeAscent + noticeDescent + 0.12;
  const noticeTextOffset = noticeAscent + 0.12;
  const noticeHeight = noticeLines.length
    ? noticeTextOffset + Math.max(0, noticeLines.length - 1) * noticeLineHeight + noticeDescent + 0.12 : 0;
  const width = Math.max(padBounds.maxX - padBounds.minX, NOTICE_WIDTH_CM + PADDING_CM * 2);
  const height = padBounds.maxY - padBounds.minY + noticeHeight + (noticeLines.length ? 0.7 : 0);
  const viewBox = `${fmt(padBounds.minX)} ${fmt(padBounds.minY)} ${fmt(width)} ${fmt(height)}`;

  const ordered = [...view.primitives].sort((a, b) => {
    const layer = TECHNICAL_FLAT_LAYER_ORDER.indexOf(a.layer) - TECHNICAL_FLAT_LAYER_ORDER.indexOf(b.layer);
    if (layer) return layer;
    if (a.kind === "artwork" && b.kind === "artwork") return a.zOrder - b.zOrder;
    return a.id.localeCompare(b.id);
  });
  const body = TECHNICAL_FLAT_LAYER_ORDER.map((layer: TechnicalFlatLayer) => {
    const layerPrimitives = ordered.filter((primitive) => primitive.layer === layer);
    const areaPaths = layer === "GARMENT_SILHOUETTE" && options.colorway
      ? [...fillPaths.entries()].map(([id, d]) => {
        const primitive = layerPrimitives.find((candidate) => candidate.id === id)! as Extract<TechnicalFlatPrimitive, { kind: "path" }>;
        return colorwayAreaMarkup(primitive, d, options.colorway!);
      }).join("") : "";
    const areas = areaPaths && options.colorway
      ? `<g data-colorway-area-group="${escapeXml(options.colorway.id)}" data-colorway-revision="${escapeXml(options.colorway.revisionId)}" opacity="0.16">${areaPaths}</g>` : "";
    const shapes = layerPrimitives.map((primitive) => styleFor(primitive, positions)).join("");
    return `<g data-layer-group="${layer}" aria-label="${layer.toLowerCase().replace(/_/g, " ")}">${areas}${shapes}</g>`;
  }).join("");
  const labels = textItems.map((item) => {
    const metric = metricFor(item.text, options.measureText);
    if (!metric) return "";
    const anchor = item.anchor === "middle" ? "middle" : "start";
    const at = positions.get(item.id) ?? item.at;
    return `<text data-label-for="${escapeXml(item.id)}" data-feature="${item.feature}" data-source-id="${escapeXml(item.source.sourceId)}" data-source-class="${item.source.sourceClass}" data-revision-id="${escapeXml(item.source.revisionId)}" data-source-layer="${item.layer}" x="${fmt(at.x)}" y="${fmt(at.y)}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_CM}" text-anchor="${anchor}" fill="#19222b">${escapeXml(item.text)}</text>`;
  }).join("");
  const renderedNotices = noticeLines.map(({ notice, line }, lineIndex) => `<text data-notice-id="${escapeXml(notice.id)}" data-notice-reason="${notice.reason}" data-notice-source="${escapeXml(notice.sourceId ?? "")}" x="${fmt(padBounds.minX + 0.2)}" y="${fmt(noticeTop + noticeTextOffset + lineIndex * noticeLineHeight)}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_CM}" fill="#713c16">${escapeXml(line)}</text>`).join("");
  const fabric = options.colorway ? ` data-colorway-id="${escapeXml(options.colorway.id)}" data-colorway-revision="${escapeXml(options.colorway.revisionId)}" data-color="${escapeXml(options.colorway.colorHex)}" data-texture="${options.colorway.texture}" data-shine="${fmt(options.colorway.shine)}"` : "";
  const title = escapeXml(options.title ?? `${view.recipeId} ${view.kind.replace("_", " ")}`);
  const svg = `<svg xmlns="${SVG_NS}" role="img" aria-labelledby="flat-title" data-view-id="${escapeXml(view.viewId)}" data-revision-id="${escapeXml(view.revisionId)}" data-recipe-id="${escapeXml(view.recipeId)}" data-view-kind="${view.kind}" data-units="cm"${fabric} width="${fmt(width)}cm" height="${fmt(height)}cm" viewBox="${viewBox}"><title id="flat-title">${title}</title><desc>Pattern-derived technical flat in centimetres. Source and design revision are attached to every entity.</desc><rect data-technical-flat-paper="true" x="${fmt(padBounds.minX)}" y="${fmt(padBounds.minY)}" width="${fmt(width)}" height="${fmt(height)}" fill="#fff"/>${body}<g data-layer-group="TEXT_LABELS">${labels}</g>${noticeLines.length ? `<g data-layer-group="SOURCE_NOTICES" role="note"><rect x="${fmt(padBounds.minX)}" y="${fmt(noticeTop)}" width="${fmt(width)}" height="${fmt(noticeHeight)}" fill="#fff7ed" stroke="#b45309" stroke-width="0.025"/>${renderedNotices}</g>` : ""}</svg>`;
  return { svg: issues.length ? null : svg, issues, textBounds: measured };
}

/** Keep an import-time guard available to tests without relying on DOM globals. */
export const TECHNICAL_FLAT_SVG_NAMESPACE = SVG_NS;
