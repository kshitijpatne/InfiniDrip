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
import { technicalFlatLeaderCrossesBox } from "./technical-flat-poms";

const FONT_SIZE_CM = 0.32;
const FONT_FAMILY = "Arial, sans-serif";
const EDGE_STROKE_CM = 0.035;
const MARK_RADIUS_CM = 0.11;
const PADDING_CM = 0.7;
const NOTICE_WIDTH_CM = 30;
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
    | "COLORWAY_REVISION_MISMATCH" | "TEXT_COLLISION";
  readonly entityId?: string;
  readonly message: string;
}

export interface TechnicalFlatSvgResult {
  readonly svg: string | null;
  readonly issues: readonly TechnicalFlatSvgIssue[];
  readonly textBounds: Readonly<Record<string, { readonly minX: number; readonly minY: number; readonly maxX: number; readonly maxY: number }>>;
}

interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

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

function roleFor(primitive: TechnicalFlatPrimitive): string | null {
  const prefix = `pattern:${primitive.source.sourceId.split(":")[1]}:role:`;
  return primitive.source.sourceId.startsWith(prefix) ? primitive.source.sourceId.slice(prefix.length) : null;
}

function styleFor(primitive: TechnicalFlatPrimitive, colorway?: TechnicalFlatColorwayOverlay): string {
  const shared = `data-entity-id="${escapeXml(primitive.id)}" data-feature="${primitive.feature}" data-source-id="${escapeXml(primitive.source.sourceId)}" data-source-class="${primitive.source.sourceClass}" data-revision-id="${escapeXml(primitive.source.revisionId)}"`;
  switch (primitive.kind) {
    case "path": {
      const silhouette = primitive.layer === "GARMENT_SILHOUETTE";
      const role = silhouette ? roleFor(primitive) : null;
      const fill = silhouette && role && colorway?.targetRoleIds.includes(role) ? colorway.colorHex : "none";
      const dash = primitive.patternMark?.kind === "foldLine" ? ` stroke-dasharray="0.18 0.1"` : "";
      const fillOpacity = fill === "none" ? "1" : "0.16";
      return `<path ${shared} data-layer="${primitive.layer}" d="${pathData(primitive.commands)}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="#19222b" stroke-width="${EDGE_STROKE_CM}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;
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
    case "callout": return `<g ${shared} data-layer="${primitive.layer}" data-callout-target="${escapeXml(primitive.anchor.primitiveId)}"><path d="M${fmt(primitive.anchor.point.x)} ${fmt(primitive.anchor.point.y)} L${fmt(primitive.labelAt.x)} ${fmt(primitive.labelAt.y)}" fill="none" stroke="#344d60" stroke-width="${EDGE_STROKE_CM}"/><circle cx="${fmt(primitive.anchor.point.x)}" cy="${fmt(primitive.anchor.point.y)}" r="${MARK_RADIUS_CM / 2}" fill="#fff" stroke="#344d60" stroke-width="${EDGE_STROKE_CM}"/></g>`;
  }
}

function intersects(a: Bounds, b: Bounds): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
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

  const geometry = view.primitives.map(primitiveBounds).filter((bounds): bounds is Bounds => bounds !== null);
  let bounds = geometry[0] ?? { minX: -0.5, minY: -0.5, maxX: 0.5, maxY: 0.5 };
  for (const item of geometry.slice(1)) bounds = union(bounds, item);
  const textItems: Array<{ id: string; text: string; at: FlatPoint; anchor: "start" | "middle";
    source: TechnicalFlatPrimitive["source"]; feature: TechnicalFlatPrimitive["feature"]; layer: TechnicalFlatLayer }> = [];
  const addText = (primitive: TechnicalFlatPrimitive, text: string, at: FlatPoint, anchor: "start" | "middle") => {
    textItems.push({ id: primitive.id, text, at, anchor, source: primitive.source, feature: primitive.feature, layer: primitive.layer });
  };
  for (const primitive of view.primitives) {
    if (primitive.kind === "text") addText(primitive, primitive.text, primitive.at, "start");
    else if (primitive.kind === "callout") addText(primitive, primitive.text, primitive.labelAt, "middle");
    else if (primitive.kind === "mark" && primitive.label) addText(primitive, primitive.label,
      { x: primitive.at.x + MARK_RADIUS_CM * 1.5, y: primitive.at.y }, "start");
    else if (primitive.kind === "path" && primitive.patternMark?.label) {
      const path = pathBounds(primitive.commands)!;
      addText(primitive, primitive.patternMark.label, { x: path.maxX + MARK_RADIUS_CM, y: path.minY }, "start");
    }
  }
  const measured: Record<string, Bounds> = {};
  for (const item of textItems) {
    const metric = metricFor(item.text, options.measureText);
    if (!metric) {
      issues.push({ code: "INVALID_FONT_METRICS", entityId: item.id,
        message: "The browser returned invalid font metrics; keep the flat unreviewed until text can be measured." });
      continue;
    }
    const textBox = textBounds(item.at, metric, item.anchor);
    measured[item.id] = textBox;
    bounds = union(bounds, textBox);
  }
  for (let left = 0; left < textItems.length; left += 1) {
    for (let right = left + 1; right < textItems.length; right += 1) {
      const a = measured[textItems[left]!.id];
      const b = measured[textItems[right]!.id];
      if (a && b && intersects(a, b)) issues.push({ code: "TEXT_COLLISION", entityId: textItems[right]!.id,
        message: `Text labels “${textItems[left]!.text}” and “${textItems[right]!.text}” overlap at the active browser font size; reposition them before review.` });
    }
  }
  for (const callout of view.primitives.filter((primitive) => primitive.kind === "callout")) {
    for (const item of textItems) {
      if (item.id === callout.id) continue;
      const textBox = measured[item.id];
      if (textBox && technicalFlatLeaderCrossesBox(callout.anchor.point, callout.labelAt, textBox)) {
        issues.push({ code: "TEXT_COLLISION", entityId: item.id,
          message: `POM leader for “${callout.text}” crosses text “${item.text}”; reposition the callout or annotation before review.` });
      }
    }
  }
  for (const artwork of view.primitives.filter((primitive) => primitive.kind === "artwork")) {
    const area = artworkBounds(artwork);
    for (const item of textItems) {
      const textBox = measured[item.id];
      if (textBox && intersects(area, textBox)) issues.push({ code: "TEXT_COLLISION", entityId: item.id,
        message: `Text “${item.text}” overlaps the artwork placement “${artwork.sourceName}”; reposition it before review.` });
    }
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
  const textHeight = FONT_SIZE_CM * 1.5;
  const noticeTop = padBounds.maxY + 0.45;
  const noticeHeight = noticeLines.length ? 0.5 + noticeLines.length * textHeight : 0;
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
    const shapes = ordered.filter((primitive) => primitive.layer === layer)
      .map((primitive) => styleFor(primitive, options.colorway)).join("");
    return `<g data-layer-group="${layer}" aria-label="${layer.toLowerCase().replace(/_/g, " ")}">${shapes}</g>`;
  }).join("");
  const labels = textItems.map((item) => {
    const metric = metricFor(item.text, options.measureText);
    if (!metric) return "";
    const anchor = item.anchor === "middle" ? "middle" : "start";
    return `<text data-label-for="${escapeXml(item.id)}" data-feature="${item.feature}" data-source-id="${escapeXml(item.source.sourceId)}" data-source-class="${item.source.sourceClass}" data-revision-id="${escapeXml(item.source.revisionId)}" data-source-layer="${item.layer}" x="${fmt(item.at.x)}" y="${fmt(item.at.y)}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_CM}" text-anchor="${anchor}" fill="#19222b">${escapeXml(item.text)}</text>`;
  }).join("");
  const renderedNotices = noticeLines.map(({ notice, line }, lineIndex) => `<text data-notice-id="${escapeXml(notice.id)}" data-notice-reason="${notice.reason}" data-notice-source="${escapeXml(notice.sourceId ?? "")}" x="${fmt(padBounds.minX + 0.2)}" y="${fmt(noticeTop + 0.25 + lineIndex * textHeight)}" font-family="${FONT_FAMILY}" font-size="${FONT_SIZE_CM}" fill="#713c16">${escapeXml(line)}</text>`).join("");
  const fabric = options.colorway ? ` data-colorway-id="${escapeXml(options.colorway.id)}" data-colorway-revision="${escapeXml(options.colorway.revisionId)}" data-color="${escapeXml(options.colorway.colorHex)}" data-texture="${options.colorway.texture}" data-shine="${fmt(options.colorway.shine)}"` : "";
  const title = escapeXml(options.title ?? `${view.recipeId} ${view.kind.replace("_", " ")}`);
  const svg = `<svg xmlns="${SVG_NS}" role="img" aria-labelledby="flat-title" data-view-id="${escapeXml(view.viewId)}" data-revision-id="${escapeXml(view.revisionId)}" data-recipe-id="${escapeXml(view.recipeId)}" data-view-kind="${view.kind}" data-units="cm"${fabric} width="${fmt(width)}cm" height="${fmt(height)}cm" viewBox="${viewBox}"><title id="flat-title">${title}</title><desc>Pattern-derived technical flat in centimetres. Source and design revision are attached to every entity.</desc><rect data-technical-flat-paper="true" x="${fmt(padBounds.minX)}" y="${fmt(padBounds.minY)}" width="${fmt(width)}" height="${fmt(height)}" fill="#fff"/>${body}<g data-layer-group="TEXT_LABELS">${labels}</g>${noticeLines.length ? `<g data-layer-group="SOURCE_NOTICES" role="note"><rect x="${fmt(padBounds.minX)}" y="${fmt(noticeTop)}" width="${fmt(width)}" height="${fmt(noticeHeight)}" fill="#fff7ed" stroke="#b45309" stroke-width="0.025"/>${renderedNotices}</g>` : ""}</svg>`;
  return { svg: issues.length ? null : svg, issues, textBounds: measured };
}

/** Keep an import-time guard available to tests without relying on DOM globals. */
export const TECHNICAL_FLAT_SVG_NAMESPACE = SVG_NS;
