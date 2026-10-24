import type { Point } from "../geometry";
import { CREWNECK } from "../drafting/recipe";
import { CREWNECK_DEFAULT_OPTIONS, CREWNECK_OPTION_DEFINITIONS } from "../drafting/crewneck-contract";
import type { Measurements } from "../drafting/measurements";
import { derive } from "../drafting/measurements";
import type { Edge } from "../drafting/piece";
import type { GarmentOption, GarmentOptions } from "../drafting/options";
import { necklineEdge } from "../drafting/neckline";
import { BLUEPRINT } from "./theme";
import { renderGarment } from "./garment";
import { necklinePathCommand } from "./neckline-path";

const round = (value: number): number => Math.round(value * 1000) / 1000;
const svgNumber = (value: number): string => String(round(value));

function optionDefinition(id: string): GarmentOption {
  return CREWNECK_OPTION_DEFINITIONS.find((definition) => definition.id === id)!;
}

function isWithinRange(value: unknown, definition: GarmentOption): value is number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= definition.min &&
    value <= definition.max;
}

function displayValue(value: unknown): string {
  if (typeof value !== "number") return "missing";
  if (!Number.isFinite(value)) return String(value);
  return String(value) + " cm";
}

function optionLabel(id: string, options: GarmentOptions, x: number, y: number): string {
  const definition = optionDefinition(id);
  const value = options[id];
  const valid = isWithinRange(value, definition);
  const correction = valid
    ? ""
    : " — invalid; set within " + definition.min + "–" + definition.max + " cm";
  return '<text data-option-id="' + id + '" data-invalid="' + String(!valid) +
    '" data-option-value="' + displayValue(value) + '" x="' + svgNumber(x) +
    '" y="' + svgNumber(y) + '" fill="' + (valid ? BLUEPRINT.label : "#FFAE9E") +
    '" font-size="2.1" font-family="system-ui, sans-serif">' +
    definition.label + ": " + displayValue(value) + correction + "</text>";
}
function shiftedPoint(point: Point, yOffset: number): Point {
  return { x: point.x, y: point.y + yOffset };
}

function offsetCurve(edge: Extract<Edge, { kind: "curve" }>, yOffset: number): Edge {
  return {
    kind: "curve",
    name: edge.name,
    curve: {
      start: shiftedPoint(edge.curve.start, yOffset),
      control1: shiftedPoint(edge.curve.control1, yOffset),
      control2: shiftedPoint(edge.curve.control2, yOffset),
      end: shiftedPoint(edge.curve.end, yOffset),
    },
  };
}

function neckbandCue(
  m: Measurements,
  position: "front" | "back",
  depth: number,
  centerX: number,
  top: number,
): string {
  const d = derive(m);
  const params = position === "front" ? CREWNECK.frontNeckline!(m) : CREWNECK.backNeckline!(m);
  const neck = necklineEdge(
    position,
    d.neckWidthHalf,
    position === "front" ? d.frontNeckDepth : d.backNeckDepth,
    d.shoulderHalf,
    m.armholeDepth,
    params,
  );
  const curve = neck.edge as Extract<Edge, { kind: "curve" }>;
  const shiftedEdge = offsetCurve(curve, depth);
  const shiftedNeck = shiftedPoint(neck.cNeck, depth);
  const shiftedHps = shiftedPoint(neck.hps, depth);
  const path = "M " + svgNumber(-shiftedHps.x) + " " + svgNumber(shiftedHps.y) + " " +
    necklinePathCommand(shiftedNeck, shiftedHps, shiftedEdge);
  return '<path data-edge="option-neckbandDepth" data-band-cue="neckband" data-position="' +
    position + '" transform="translate(' + svgNumber(centerX) + " " + svgNumber(top) +
    ')" d="' + path + '" fill="none" stroke="' + BLUEPRINT.lineActive +
    '" stroke-width="0.55" vector-effect="non-scaling-stroke"/>';
}

function bandCues(
  m: Measurements,
  position: "front" | "back",
  centerX: number,
  top: number,
  options: GarmentOptions,
): string {
  const d = derive(m);
  const neckDefinition = optionDefinition("neckbandDepth");
  const cuffDefinition = optionDefinition("cuffDepth");
  const hemDefinition = optionDefinition("hemBandDepth");
  const neckDepth = options.neckbandDepth;
  const cuffDepth = options.cuffDepth;
  const hemDepth = options.hemBandDepth;
  const neck = isWithinRange(neckDepth, neckDefinition)
    ? neckbandCue(m, position, neckDepth, centerX, top)
    : "";
  const cuff = isWithinRange(cuffDepth, cuffDefinition)
    ? (() => {
      const cuffTopY = d.shoulderSlope + m.armholeDepth * 0.3;
      const cuffBottomY = cuffTopY + m.bicep * 0.4;
      const outerX = d.shoulderHalf + m.sleeveLength;
      const rightPath = "M " + svgNumber(outerX) + " " + svgNumber(cuffTopY) +
        " L " + svgNumber(outerX - 2) + " " + svgNumber(cuffBottomY) +
        " L " + svgNumber(outerX - 2 - cuffDepth) + " " + svgNumber(cuffBottomY) +
        " L " + svgNumber(outerX - cuffDepth) + " " + svgNumber(cuffTopY) + " Z";
      const leftPath = "M " + svgNumber(-outerX) + " " + svgNumber(cuffTopY) +
        " L " + svgNumber(-(outerX - 2)) + " " + svgNumber(cuffBottomY) +
        " L " + svgNumber(-(outerX - 2 - cuffDepth)) + " " + svgNumber(cuffBottomY) +
        " L " + svgNumber(-(outerX - cuffDepth)) + " " + svgNumber(cuffTopY) + " Z";
      const prefix = '<path data-edge="option-cuffDepth" data-band-cue="cuff" data-position="' +
        position + '" d="';
      return '<g transform="translate(' + svgNumber(centerX) + " " + svgNumber(top) +
        ')" fill="rgba(232,178,58,0.18)" stroke="' + BLUEPRINT.lineActive +
        '" stroke-width="0.55" vector-effect="non-scaling-stroke">' +
        prefix + rightPath + '"/>' + prefix + leftPath + '"/></g>';
    })()
    : "";
  const hem = isWithinRange(hemDepth, hemDefinition)
    ? '<line data-edge="option-hemBandDepth" data-band-cue="hem-band" data-position="' +
      position + '" transform="translate(' + svgNumber(centerX) + " " + svgNumber(top) +
      ')" x1="' + svgNumber(-d.chestWidthHalf) + '" y1="' +
      svgNumber(m.length - hemDepth) + '" x2="' + svgNumber(d.chestWidthHalf) +
      '" y2="' + svgNumber(m.length - hemDepth) + '" fill="none" stroke="' +
      BLUEPRINT.lineActive + '" stroke-width="0.55" vector-effect="non-scaling-stroke"/>'
    : "";
  return neck + cuff + hem;
}

function renderLegend(options: GarmentOptions, width: number, y: number): string {
  const xRight = width / 2 + 3;
  const rowYs = [y + 5.2, y + 8.2, y + 11.2];
  const entries = [
    ["neckbandDepth", "neckbandLength"],
    ["cuffDepth", "cuffLength"],
    ["hemBandDepth", "hemBandLength"],
  ];
  const labels = entries.map((row, index) =>
    optionLabel(row[0], options, 6, rowYs[index]) +
    optionLabel(row[1], options, xRight, rowYs[index])
  ).join("");
  return '<rect data-crewneck-legend-background="true" x="0" y="' + svgNumber(y) +
    '" width="' + svgNumber(width) + '" height="14" fill="' + BLUEPRINT.background + '"/>' +
    '<text data-disclosure="schematic-not-pattern-linked" x="' + svgNumber(width / 2) +
    '" y="' + svgNumber(y + 2.7) + '" text-anchor="middle" fill="' + BLUEPRINT.patternInstruction +
    '" font-size="2.3" font-family="system-ui, sans-serif">' +
    "SCHEMATIC ONLY · NOT PATTERN-LINKED · NO FIT OR MATERIAL CLAIM</text>" + labels;
}
/**
 * Renders an illustrative crewneck view from the existing measurement
 * silhouette. Band cues are schematic and are not derived from sewn pattern
 * pieces. Invalid options remain visible in the legend and are never clamped.
 */
export function renderCrewneckFigure(
  m: Measurements,
  fabric: string,
  options: GarmentOptions = CREWNECK_DEFAULT_OPTIONS,
): string {
  const d = derive(m);
  const halfW = d.shoulderHalf + m.sleeveLength;
  const margin = 6;
  const top = 10;
  const gap = 12;
  const frontCx = margin + halfW;
  const backCx = frontCx + 2 * halfW + gap;
  const width = backCx + halfW + margin;
  const baseHeight = top + m.length + margin;
  const expandedHeight = baseHeight + 14;
  const base = renderGarment(
    m,
    fabric,
    true,
    CREWNECK.frontNeckline!(m),
    CREWNECK.backNeckline!(m),
  );
  const extended = base.replace(
    'viewBox="0 0 ' + svgNumber(width) + " " + svgNumber(baseHeight) + '"',
    'viewBox="0 0 ' + svgNumber(width) + " " + svgNumber(expandedHeight) + '"',
  );
  const cues = bandCues(m, "front", frontCx, top, options) +
    bandCues(m, "back", backCx, top, options);
  const legend = renderLegend(options, width, baseHeight);
  return extended.replace("</svg>", cues + legend + "</svg>");
}
