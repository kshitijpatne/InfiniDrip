import { cubicPoint, point } from "../geometry";
import type { Point } from "../geometry";
import type { Note } from "../guidance/note";
import { block } from "./block";
import type { Block } from "./block";
import type { Edge, Piece } from "./piece";
import { lineMark, pointMark } from "./pattern-mark";
import type { PatternMark } from "./pattern-mark";
import { draftShortsLegs, shortsMetrics } from "./shorts-geometry";
import type { ShortsMeasurements } from "./shorts-geometry";
import {
  DEFAULT_SHORTS_COMPONENT_OPTIONS,
  SHORTS_OPTION_DEFINITIONS,
} from "./shorts-contract";
import type { ShortsOptions } from "./shorts-contract";
import { edgeRef, iface, markRef } from "./stitch";
import type { Stitch } from "./stitch";
import { resolveShortsGeometryOptions } from "./shorts-geometry";

const FLY_SHIELD_WIDTH = 3.5;
const POCKET_SIDE_WAIST_OFFSET = 3.5;
const HEM_TURN = 2.5;
const SEAM_ALLOWANCE = 1;
const GEOMETRY_EPSILON = 1e-8;

/** Preserve raw invalid values; the UI can report them without repairing geometry. */
export function resolveShortsOptions(raw: Partial<ShortsOptions> = {}): ShortsOptions {
  const geometry = resolveShortsGeometryOptions(raw);
  return {
    ...geometry,
    flyLength: raw.flyLength ?? DEFAULT_SHORTS_COMPONENT_OPTIONS.flyLength,
    pocketOpening: raw.pocketOpening ?? DEFAULT_SHORTS_COMPONENT_OPTIONS.pocketOpening,
    pocketAngle: raw.pocketAngle ?? DEFAULT_SHORTS_COMPONENT_OPTIONS.pocketAngle,
    pocketBagDepth: raw.pocketBagDepth ?? DEFAULT_SHORTS_COMPONENT_OPTIONS.pocketBagDepth,
    pocketDrop: raw.pocketDrop ?? DEFAULT_SHORTS_COMPONENT_OPTIONS.pocketDrop,
  };
}

export function draftShortsWaistband(
  finishedWaist: number,
  rawOptions: Partial<ShortsOptions> = {},
): Piece {
  const depth = resolveShortsOptions(rawOptions).waistbandDepth;
  const start = point(0, 0);
  const end = point(finishedWaist, 0);
  const endBottom = point(finishedWaist, depth);
  const bottom = point(0, depth);
  return {
    name: "shorts waistband",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start, end },
      { kind: "line", name: "endRight", start: end, end: endBottom },
      { kind: "line", name: "bottom", start: endBottom, end: bottom },
      { kind: "line", name: "endLeft", start: bottom, end: start },
    ],
    marks: [
      pointMark("placementPoint", "centerBack", point(0, depth / 2), "center back"),
      pointMark("placementPoint", "centerFront", point(finishedWaist / 2, depth / 2), "center front"),
      pointMark("button", "waistbandButton", point(finishedWaist / 2, depth / 2), "waistband button"),
    ],
  };
}

export interface ShortsFlyPieces {
  readonly flyShield: Piece;
  readonly flyUnderlap: Piece;
}

export function draftShortsFly(rawOptions: Partial<ShortsOptions> = {}): ShortsFlyPieces {
  const { flyLength } = resolveShortsOptions(rawOptions);
  const width = FLY_SHIELD_WIDTH;
  const underlap: Piece = {
    name: "shorts fly underlap",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(-width, 0), end: point(0, 0) },
      { kind: "line", name: "frontEdge", start: point(0, 0), end: point(0, flyLength) },
      { kind: "line", name: "bottom", start: point(0, flyLength), end: point(-width, flyLength) },
      { kind: "line", name: "shieldEdge", start: point(-width, flyLength), end: point(-width, 0) },
    ],
  };
  const shield: Piece = {
    name: "shorts fly shield",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(width, 0) },
      { kind: "line", name: "right", start: point(width, 0), end: point(width, flyLength) },
      { kind: "line", name: "bottom", start: point(width, flyLength), end: point(0, flyLength) },
      { kind: "line", name: "left", start: point(0, flyLength), end: point(0, 0) },
    ],
    marks: [
      lineMark("foldLine", "flyFold", point(width / 2, 0), point(width / 2, flyLength), "fly fold"),
      pointMark("buttonhole", "waistbandButtonhole", point(width / 2, 2), "waistband buttonhole"),
    ],
  };
  return { flyShield: shield, flyUnderlap: underlap };
}

export interface ShortsPocketOpening {
  readonly start: Point;
  readonly end: Point;
}

type ShortsBagPiece = Omit<Piece, "edges"> & {
  readonly edges: readonly Extract<Edge, { readonly kind: "line" }>[];
};

export function shortsPocketOpening(
  measurements: ShortsMeasurements,
  rawOptions: Partial<ShortsOptions> = {},
): ShortsPocketOpening {
  const options = resolveShortsOptions(rawOptions);
  const metrics = shortsMetrics(measurements, options);
  const waistQuarter = metrics.finishedWaist / 4;
  const angle = options.pocketAngle * Math.PI / 180;
  const start = point(waistQuarter - POCKET_SIDE_WAIST_OFFSET, options.pocketDrop);
  return {
    start,
    end: point(
      start.x - Math.cos(angle) * options.pocketOpening,
      start.y + Math.sin(angle) * options.pocketOpening,
    ),
  };
}

function mirrorPoint(value: Point): Point {
  return point(-value.x, value.y);
}

function mirrorMark(mark: PatternMark): PatternMark {
  return "start" in mark
    ? { ...mark, start: mirrorPoint(mark.start), end: mirrorPoint(mark.end) }
    : { ...mark, at: mirrorPoint(mark.at) };
}

function mirrorPiece(piece: ShortsBagPiece, name: string): ShortsBagPiece {
  return {
    ...piece,
    name,
    edges: piece.edges.map((edge) => ({ ...edge, start: mirrorPoint(edge.start), end: mirrorPoint(edge.end) })),
    marks: piece.marks?.map(mirrorMark),
  };
}

function pocketBagPiece(opening: ShortsPocketOpening, depth: number, name: string): ShortsBagPiece {
  const bottomY = opening.end.y + depth;
  const bottomEnd = point(opening.end.x, bottomY);
  const bottomStart = point(opening.start.x, bottomY);
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "opening", start: opening.start, end: opening.end },
      { kind: "line", name: "bagLower", start: opening.end, end: bottomEnd },
      { kind: "line", name: "bagOuter", start: bottomEnd, end: bottomStart },
      { kind: "line", name: "bagClose", start: bottomStart, end: opening.start },
    ],
    marks: [
      lineMark("placementLine", "bagOpeningMatch", opening.start, opening.end, "MATCH FRONT OPENING", "instruction"),
      pointMark("placementPoint", "bagBottom", point((bottomStart.x + bottomEnd.x) / 2, bottomY), "bag bottom"),
    ],
  };
}

function addFrontComponentMarks(
  legs: Block,
  opening: ShortsPocketOpening,
  flyLength: number,
): Block {
  const roles = Object.fromEntries(Object.entries(legs.roles).map(([role, piece]) => {
    if (role === "frontLeft") {
      return [role, {
        ...piece,
        marks: [
          ...(piece.marks ?? []),
          lineMark("placementLine", "flyEdge", point(0, 0), point(0, flyLength), "front fly edge"),
          lineMark("placementLine", "pocketOpening", opening.start, opening.end, "pocket opening"),
          pointMark("placementPoint", "pocketOpeningStart", opening.start, "pocket start"),
        ],
      }];
    }
    if (role === "frontRight") {
      const rightOpening = { start: mirrorPoint(opening.start), end: mirrorPoint(opening.end) };
      return [role, {
        ...piece,
        marks: [
          ...(piece.marks ?? []),
          lineMark("placementLine", "flyEdge", point(0, 0), point(0, flyLength), "front fly edge"),
          lineMark("placementLine", "pocketOpening", rightOpening.start, rightOpening.end, "pocket opening"),
          pointMark("placementPoint", "pocketOpeningStart", rightOpening.start, "pocket start"),
        ],
      }];
    }
    return [role, piece];
  }));
  return block(roles, legs.stitches);
}

function shortsWaistInterface(): ReturnType<typeof iface> {
  return iface(
    edgeRef("backLeft", "waist"),
    edgeRef("frontLeft", "waist", true),
    edgeRef("frontRight", "waist"),
    edgeRef("backRight", "waist", true),
  );
}

function shortsComponentStitches(): Stitch[] {
  return [
    {
      label: "Waistband (four leg panels ↔ separate waistband)",
      a: shortsWaistInterface(),
      b: iface(edgeRef("waistband", "bottom")),
    },
    {
      label: "Fly underlap ↔ shield",
      a: iface(edgeRef("flyUnderlap", "shieldEdge")),
      b: iface(edgeRef("flyShield", "right")),
    },
    {
      label: "Left front fly ↔ shield",
      a: iface(markRef("frontLeft", "flyEdge", "left")),
      b: iface(edgeRef("flyShield", "left")),
    },
    {
      label: "Right front fly ↔ underlap",
      a: iface(markRef("frontRight", "flyEdge", "right")),
      b: iface(edgeRef("flyUnderlap", "frontEdge")),
    },
    {
      label: "Left pocket opening ↔ bag",
      a: iface(markRef("frontLeft", "pocketOpening", "left")),
      b: iface(edgeRef("pocketBagLeft", "opening")),
    },
    {
      label: "Right pocket opening ↔ bag",
      a: iface(markRef("frontRight", "pocketOpening", "right")),
      b: iface(edgeRef("pocketBagRight", "opening")),
    },
  ];
}

/** Assemble the nine P0 parts. Allowance, notch, grade and export data remain later boundaries. */
export function draftShortsWithComponents(
  measurements: ShortsMeasurements,
  rawOptions: Partial<ShortsOptions> = {},
): Block {
  const options = resolveShortsOptions(rawOptions);
  const legs = draftShortsLegs(measurements, options);
  const opening = shortsPocketOpening(measurements, options);
  const markedLegs = addFrontComponentMarks(legs, opening, options.flyLength);
  const metrics = shortsMetrics(measurements, options);
  const fly = draftShortsFly(options);
  const leftPocket = pocketBagPiece(opening, options.pocketBagDepth, "shorts pocket bag left");
  const roles = {
    ...markedLegs.roles,
    waistband: draftShortsWaistband(metrics.finishedWaist, options),
    ...fly,
    pocketBagLeft: leftPocket,
    pocketBagRight: mirrorPiece(leftPocket, "shorts pocket bag right"),
  };
  return block(roles, [...markedLegs.stitches, ...shortsComponentStitches()]);
}

function edgeXAtY(edge: Edge, y: number): number[] {
  if (edge.kind === "line") {
    const low = Math.min(edge.start.y, edge.end.y);
    const high = Math.max(edge.start.y, edge.end.y);
    if (y < low || y > high) return [];
    const dy = edge.end.y - edge.start.y;
    if (Math.abs(dy) <= GEOMETRY_EPSILON) return [Math.max(edge.start.x, edge.end.x)];
    const t = (y - edge.start.y) / dy;
    return [edge.start.x + (edge.end.x - edge.start.x) * t];
  }

  const samples = 64;
  const xs: number[] = [];
  let previous = cubicPoint(edge.curve, 0);
  for (let index = 1; index <= samples; index += 1) {
    const current = cubicPoint(edge.curve, index / samples);
    const low = Math.min(previous.y, current.y);
    const high = Math.max(previous.y, current.y);
    if (y >= low && y <= high) {
      const dy = current.y - previous.y;
      if (Math.abs(dy) <= GEOMETRY_EPSILON) xs.push(Math.max(previous.x, current.x));
      else {
        const t = (y - previous.y) / dy;
        xs.push(previous.x + (current.x - previous.x) * t);
      }
    }
    previous = current;
  }
  return xs;
}

const FRONT_INNER_BOUNDARIES = new Set([
  "centerFront",
  "crotch",
  "innerThighToCrotch",
  "inseamThighToHem",
]);

function boundaryXAtY(piece: Piece, y: number, isSide: boolean): number | null {
  const xs = piece.edges.flatMap((edge) => {
    const matches = isSide
      ? edge.name.startsWith("side")
      : FRONT_INNER_BOUNDARIES.has(edge.name);
    return matches ? edgeXAtY(edge, y) : [];
  });
  return xs.length > 0 ? Math.max(...xs) : null;
}

function sideBoundaryXAtY(piece: Piece, y: number): number | null {
  return boundaryXAtY(piece, y, true);
}

function innerBoundaryXAtY(piece: Piece, y: number): number | null {
  return boundaryXAtY(piece, y, false);
}

function frontPanelPointInside(piece: Piece, value: Point, clearance: number): boolean {
  const side = sideBoundaryXAtY(piece, value.y);
  const inner = innerBoundaryXAtY(piece, value.y);
  return inner !== null && side !== null
    && value.x - inner > clearance
    && side - value.x > clearance;
}

function segmentInsideFront(piece: Piece, start: Point, end: Point, clearance: number): boolean {
  const deltaY = end.y - start.y;
  const lowY = Math.min(start.y, end.y);
  const highY = Math.max(start.y, end.y);
  const stations = new Set([start.y, end.y]);
  for (const edge of piece.edges) {
    const isSide = edge.name.startsWith("side");
    const isInner = FRONT_INNER_BOUNDARIES.has(edge.name);
    if (!isSide && !isInner) continue;
    const endpoints = edge.kind === "line"
      ? [edge.start.y, edge.end.y]
      : [edge.curve.start.y, edge.curve.end.y];
    for (const y of endpoints) {
      if (y > lowY && y < highY) stations.add(y);
    }
    if (edge.kind === "curve") {
      for (let index = 1; index < 64; index += 1) {
        const y = cubicPoint(edge.curve, index / 64).y;
        if (y > lowY && y < highY) stations.add(y);
      }
    }
  }
  if (Math.abs(deltaY) <= GEOMETRY_EPSILON) {
    return frontPanelPointInside(piece, start, clearance)
      && frontPanelPointInside(piece, end, clearance);
  }
  return [...stations].every((y) => {
    const t = (y - start.y) / deltaY;
    const value = point(start.x + (end.x - start.x) * t, y);
    return frontPanelPointInside(piece, value, clearance);
  });
}

function bagContained(
  front: Piece,
  opening: ShortsPocketOpening,
  depth: number,
  hemY: number,
): boolean {
  const bottomY = opening.end.y + depth;
  if (bottomY + HEM_TURN + SEAM_ALLOWANCE >= hemY) return false;
  const bottomStart = point(opening.start.x, bottomY);
  const bottomEnd = point(opening.end.x, bottomY);
  const edges = [
    [opening.start, opening.end],
    [opening.end, bottomEnd],
    [bottomEnd, bottomStart],
    [bottomStart, opening.start],
  ] as const;
  return edges.every(([start, end]) => segmentInsideFront(front, start, end, SEAM_ALLOWANCE));
}

function maxContainedBagDepth(front: Piece, opening: ShortsPocketOpening, hemY: number): number {
  let low = 0;
  let high = Math.max(0, hemY - opening.end.y);
  if (!bagContained(front, opening, low, hemY)) return 0;
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const middle = (low + high) / 2;
    if (bagContained(front, opening, middle, hemY)) low = middle;
    else high = middle;
  }
  return Math.floor((low + GEOMETRY_EPSILON) / 0.5) * 0.5;
}

function maxOpeningWithinPanel(
  front: Piece,
  start: Point,
  angleDegrees: number,
  upperBound: number,
): number {
  let low = 0;
  let high = Math.max(0, upperBound);
  const rad = angleDegrees * Math.PI / 180;
  for (let iteration = 0; iteration < 30; iteration += 1) {
    const length = (low + high) / 2;
    const end = point(start.x - Math.cos(rad) * length, start.y + Math.sin(rad) * length);
    if (segmentInsideFront(front, start, end, SEAM_ALLOWANCE)) low = length;
    else high = length;
  }
  return Math.floor((low + GEOMETRY_EPSILON) / 0.5) * 0.5;
}

function formatCm(value: number): string {
  return Number(value.toFixed(1)).toString();
}

function maximumCorrection(id: keyof ShortsOptions, limit: number, alternative: string): string {
  const definition = SHORTS_OPTION_DEFINITIONS.find((candidate) => candidate.id === id)!;
  const maximum = Math.min(
    definition.max,
    Math.floor((limit + GEOMETRY_EPSILON) / definition.step) * definition.step,
  );
  if (maximum < definition.min) {
    return `No in-range ${definition.label.toLowerCase()} (${definition.min}–${definition.max} cm) fits; the computed maximum is ${formatCm(maximum)} cm; ${alternative}`;
  }
  return `reduce it to at most ${formatCm(maximum)} cm`;
}

function minimumCorrection(id: keyof ShortsOptions, limit: number, alternative: string): string {
  const definition = SHORTS_OPTION_DEFINITIONS.find((candidate) => candidate.id === id)!;
  const minimum = Math.max(
    definition.min,
    Math.ceil((limit - GEOMETRY_EPSILON) / definition.step) * definition.step,
  );
  if (minimum > definition.max) {
    return `No in-range ${definition.label.toLowerCase()} (${definition.min}–${definition.max} cm) fits; the computed minimum is ${formatCm(minimum)} cm; ${alternative}`;
  }
  return `increase it to at least ${formatCm(minimum)} cm`;
}

function optionRangeNotes(options: ShortsOptions): Note[] {
  const notes: Note[] = [];
  for (const definition of SHORTS_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof ShortsOptions];
    if (!Number.isFinite(value)) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} must be a finite number; enter a value from ${definition.min} to ${definition.max}${definition.unit === "°" ? "°" : " cm"}.`,
      });
    } else if (value < definition.min || value > definition.max) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} (${value}${definition.unit === "°" ? "°" : " cm"}) is outside the ${definition.min}–${definition.max}${definition.unit === "°" ? "°" : " cm"} range; adjust it into that range.`,
      });
    }
  }
  return notes;
}

/** Report the actual panel and component collisions without changing any option or outline. */
export function shortsComponentGuidance(
  drafted: Block,
  measurements: ShortsMeasurements,
  rawOptions: Partial<ShortsOptions> = {},
): Note[] {
  const options = resolveShortsOptions(rawOptions);
  const notes = optionRangeNotes(options);
  const metrics = shortsMetrics(measurements, options);
  const finiteGeometry = [
    metrics.finishedWaist, metrics.frontRise, metrics.backRise, metrics.frontCrotchY,
    metrics.backCrotchY, metrics.hemY, metrics.thighY,
    options.waistbandDepth, options.flyLength, options.pocketOpening,
    options.pocketAngle, options.pocketBagDepth, options.pocketDrop,
  ].every(Number.isFinite);
  if (!finiteGeometry) return notes;

  const shortestRise = Math.min(metrics.frontRise, metrics.backRise);
  if (options.waistbandDepth >= shortestRise) {
    notes.push({
      field: "option-waistbandDepth",
      level: "warn",
      text: `Waistband depth must stay below both finished rises (${formatCm(metrics.frontRise)} cm front, ${formatCm(metrics.backRise)} cm back); ${maximumCorrection("waistbandDepth", shortestRise - GEOMETRY_EPSILON, "increase the shorter finished rise")}.`,
    });
  }

  if (options.flyLength + SEAM_ALLOWANCE >= metrics.frontCrotchY) {
    notes.push({
      field: "option-flyLength",
      level: "warn",
      text: `Fly length must end at least ${SEAM_ALLOWANCE} cm above the front rise (${formatCm(metrics.frontCrotchY)} cm); ${maximumCorrection("flyLength", metrics.frontCrotchY - SEAM_ALLOWANCE - GEOMETRY_EPSILON, "increase front rise ease")}.`,
    });
  }
  const maximumFlyBeforeHem = metrics.hemY - HEM_TURN - SEAM_ALLOWANCE;
  if (options.flyLength >= maximumFlyBeforeHem) {
    const minimumLength = options.flyLength + HEM_TURN + SEAM_ALLOWANCE - metrics.backCrotchY + GEOMETRY_EPSILON;
    notes.push({
      field: "option-shortsInseam",
      level: "warn",
      text: `Fly length enters the ${HEM_TURN} cm hem turn; ${minimumCorrection("shortsInseam", minimumLength, "shorten the fly")}.`,
    });
  }

  const front = drafted.roles.frontLeft;
  if (!front) {
    notes.push({ field: "recipe-shorts", level: "warn", text: "The shorts front panel is missing; restore the four base leg roles before checking components." });
    return notes;
  }
  const opening = shortsPocketOpening(measurements, options);
  const openingInside = segmentInsideFront(front, opening.start, opening.end, SEAM_ALLOWANCE);
  if (!openingInside) {
    const maximumOpening = maxOpeningWithinPanel(front, opening.start, options.pocketAngle, Math.max(options.pocketOpening, 20));
    notes.push({
      field: "option-pocketOpening",
      level: "warn",
      text: `Pocket opening leaves the front panel or enters its ${SEAM_ALLOWANCE} cm seam clearance; ${maximumCorrection("pocketOpening", maximumOpening, "reduce its drop or angle")}.`,
    });
  }
  if (opening.end.y + SEAM_ALLOWANCE >= metrics.frontCrotchY) {
    const maximumDrop = metrics.frontCrotchY - SEAM_ALLOWANCE - Math.sin(options.pocketAngle * Math.PI / 180) * options.pocketOpening;
    notes.push({
      field: "option-pocketDrop",
      level: "warn",
      text: `Pocket opening reaches the front rise (${formatCm(opening.end.y)} cm); ${maximumCorrection("pocketDrop", maximumDrop, "shorten the opening or increase front rise ease")}.`,
    });
  }
  if (openingInside) {
    const maximumDepth = maxContainedBagDepth(front, opening, metrics.hemY);
    if (!bagContained(front, opening, options.pocketBagDepth, metrics.hemY)) {
      notes.push({
        field: "option-pocketBagDepth",
        level: "warn",
        text: `Pocket bag must stay inside the front panel and above the ${HEM_TURN} cm hem turn plus ${SEAM_ALLOWANCE} cm seam clearance; ${maximumCorrection("pocketBagDepth", maximumDepth, "reduce the opening/drop or increase shorts length")}.`,
      });
    }
  }
  return notes;
}
