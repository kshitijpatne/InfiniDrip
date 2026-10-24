import { cubicPoint, type Point } from "../geometry";
import type { Note } from "../guidance/note";
import { hoodieCasingNotes, hoodieNecklineNotes } from "./hoodie";
import { hoodieBandMeasurements } from "./hoodie-tables";
import { HOODIE_OPTION_DEFINITIONS, resolveHoodieOptions, type HoodieOptions } from "./hoodie-contract";
import type { Block } from "./block";
import { edgeEnd, edgeStart, type Edge, type Piece } from "./piece";
import type { Measurements } from "./measurements";

const OUTLINE_CURVE_SEGMENTS = 64;
const POCKET_EDGE_SEGMENTS = 128;
const GEOMETRY_EPSILON = 1e-7;

interface BoundarySegment {
  readonly name: string;
  readonly start: Point;
  readonly end: Point;
}

function optionNotes(options: HoodieOptions): { readonly notes: Note[]; readonly blocksGeometryChecks: boolean } {
  const notes: Note[] = [];
  let blocksGeometryChecks = false;
  for (const definition of HOODIE_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof HoodieOptions];
    const unit = ` ${definition.unit!}`;
    let problem: string | undefined;
    if (!Number.isFinite(value)) {
      problem = `must be finite`;
      blocksGeometryChecks = true;
    } else if (value < definition.min || value > definition.max) {
      problem = `is outside the ${definition.min}–${definition.max}${unit} range`;
      blocksGeometryChecks = true;
    } else if (Math.abs((value - definition.min) / definition.step -
        Math.round((value - definition.min) / definition.step)) > 1e-8) {
      problem = `does not follow the ${definition.step}${unit} step`;
    }
    if (problem !== undefined) {
      notes.push({
        field: definition.id,
        level: "warn",
        text: `${definition.label} (${String(value)}${unit}) ${problem} — adjust it to a finite value in range on the declared step; the current input remains unchanged.`,
      });
    }
  }
  return { notes, blocksGeometryChecks };
}

function edgePoints(edge: Edge, segments: number): Point[] {
  if (edge.kind === "line") {
    return Array.from({ length: segments + 1 }, (_, index) => {
      const t = index / segments;
      return {
        x: edge.start.x + (edge.end.x - edge.start.x) * t,
        y: edge.start.y + (edge.end.y - edge.start.y) * t,
      };
    });
  }
  return Array.from({ length: segments + 1 }, (_, index) =>
    cubicPoint(edge.curve, index / segments));
}

function outlinePoints(piece: Piece): Point[] {
  const points: Point[] = [];
  for (const edge of piece.edges) {
    const sampled = edgePoints(edge, edge.kind === "line" ? 1 : OUTLINE_CURVE_SEGMENTS);
    points.push(...sampled.slice(points.length === 0 ? 0 : 1));
  }
  return points;
}

function pointSegmentDistance(value: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = ((value.x - start.x) * dx + (value.y - start.y) * dy) /
    Math.max(lengthSquared, Number.EPSILON);
  const amount = Math.min(1, Math.max(0, projection));
  return Math.hypot(value.x - (start.x + amount * dx), value.y - (start.y + amount * dy));
}

function pointOnSegment(value: Point, start: Point, end: Point): boolean {
  return pointSegmentDistance(value, start, end) <= GEOMETRY_EPSILON;
}

function pointInsidePanel(value: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index]!;
    const prior = polygon[previous]!;
    if (pointOnSegment(value, prior, current)) return true;
    if ((current.y > value.y) !== (prior.y > value.y) &&
        value.x < (prior.x - current.x) * (value.y - current.y) /
          (prior.y - current.y) + current.x) {
      inside = !inside;
    }
  }
  return inside;
}

function boundarySegments(piece: Piece): BoundarySegment[] {
  const result: BoundarySegment[] = [];
  for (const edge of piece.edges) {
    const points = edgePoints(edge, edge.kind === "line" ? 1 : OUTLINE_CURVE_SEGMENTS);
    for (let index = 0; index < points.length - 1; index += 1) {
      result.push({ name: edge.name, start: points[index]!, end: points[index + 1]! });
    }
  }
  return result;
}

function nearestBoundary(value: Point, boundary: readonly BoundarySegment[]): string {
  let nearestName = "panel";
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const segment of boundary) {
    const currentDistance = pointSegmentDistance(value, segment.start, segment.end);
    if (currentDistance < nearestDistance) {
      nearestName = segment.name;
      nearestDistance = currentDistance;
    }
  }
  return nearestName;
}

function unusedPouchNotes(options: HoodieOptions): Note[] {
  if (options.pocketWidth !== 0 && options.pocketHeight !== 0) return [];
  const notes: Note[] = [];
  if (options.pocketWidth === 0 && options.pocketHeight !== 0) {
    notes.push({
      field: "pocketHeight",
      level: "info",
      text: "Pouch height is unused while pocket width is zero and the pouch is omitted.",
    });
  }
  if (options.pocketHeight === 0 && options.pocketWidth !== 0) {
    notes.push({
      field: "pocketWidth",
      level: "info",
      text: "Pouch width is unused while pocket height is zero and the pouch is omitted.",
    });
  }
  for (const [field, label] of [
    ["pocketOpeningLength", "Pouch opening length"],
    ["pocketOpeningAngle", "Pouch opening angle"],
    ["pocketHemClearance", "Pouch hem clearance"],
  ] as const) {
    notes.push({
      field,
      level: "info",
      text: `${label} is unused while pocket width or height is zero and the pouch is omitted.`,
    });
  }
  return notes;
}

function pouchOpeningNotes(pouch: Piece): Note[] {
  const opening = pouch.edges.find(({ name }) => name === "opening");
  const fold = pouch.edges.find(({ name }) => name === "fold");
  const bottom = pouch.edges.find(({ name }) => name === "bottom");
  if (opening === undefined || fold === undefined || bottom === undefined) {
    return [{
      field: "pocketOpeningLength",
      level: "warn",
      text: "The drafted pouch is missing its opening, fold, or bottom edge — restore the Hoodie pouch geometry before using these controls.",
    }];
  }

  const endpoint = edgeEnd(opening);
  const foldStart = edgeStart(fold);
  const foldEnd = edgeEnd(fold);
  const bottomY = (edgeStart(bottom).y + edgeEnd(bottom).y) / 2;
  const notes: Note[] = [];
  if (endpoint.x <= Math.max(foldStart.x, foldEnd.x) + GEOMETRY_EPSILON) {
    notes.push({
      field: "pocketOpeningLength",
      level: "warn",
      text: "The diagonal pouch opening reaches or crosses the on-fold edge — shorten pocketOpeningLength or increase pocketOpeningAngle so the endpoint stays on the pouch half.",
    });
    notes.push({
      field: "pocketOpeningAngle",
      level: "warn",
      text: "The diagonal pouch opening reaches or crosses the on-fold edge — increase pocketOpeningAngle or shorten pocketOpeningLength so the endpoint stays on the pouch half.",
    });
  }
  if (endpoint.y >= bottomY - GEOMETRY_EPSILON) {
    notes.push({
      field: "pocketOpeningLength",
      level: "warn",
      text: "The diagonal pouch opening reaches or crosses the lower edge — shorten pocketOpeningLength, reduce pocketOpeningAngle, or increase pocketHeight.",
    });
    notes.push({
      field: "pocketOpeningAngle",
      level: "warn",
      text: "The diagonal pouch opening reaches or crosses the lower edge — reduce pocketOpeningAngle or shorten pocketOpeningLength so the opening ends above the pouch bottom.",
    });
  }
  return notes;
}

function pouchPanelNotes(pouch: Piece, front: Piece, alreadyReported: ReadonlySet<string>): Note[] {
  const polygon = outlinePoints(front);
  const boundary = boundarySegments(front);
  const collisions = new Map<string, Set<string>>();
  for (const edge of pouch.edges) {
    for (const value of edgePoints(edge, POCKET_EDGE_SEGMENTS)) {
      if (pointInsidePanel(value, polygon)) continue;
      const boundaryName = nearestBoundary(value, boundary);
      let field: string;
      if (boundaryName === "side") {
        field = "pocketWidth";
      } else if (boundaryName === "hem") {
        field = "pocketHemClearance";
      } else if (edge.name === "opening") {
        field = "pocketOpeningLength";
      } else {
        field = "pocketHeight";
      }
      const names = collisions.get(field) ?? new Set<string>();
      names.add(boundaryName);
      collisions.set(field, names);
    }
  }

  const notes: Note[] = [];
  for (const [field, names] of collisions) {
    if (alreadyReported.has(field)) continue;
    const boundaries = [...names].join(", ");
    const text = field === "pocketWidth"
      ? `The pouch leaves the front at the ${boundaries} boundary — reduce pocketWidth until the full pouch stays inside the panel.`
      : field === "pocketHemClearance"
        ? `The pouch reaches or crosses the actual front hem-band attachment seam (${boundaries}) — increase pocketHemClearance to move its lower edge up.`
        : field === "pocketOpeningLength"
          ? `The diagonal opening leaves the actual front panel near ${boundaries} — shorten pocketOpeningLength or adjust pocketOpeningAngle so both opening endpoints remain inside.`
          : `The pouch leaves the front panel at ${boundaries} — reduce pocketHeight or pocketHemClearance to move the upper edge down. This check uses the live neckline, shoulder, armhole/underarm, side, and hem edges.`;
    notes.push({ field, level: "warn", text });
  }
  return notes;
}

function pouchNotes(drafted: Block, options: HoodieOptions): Note[] {
  const unused = unusedPouchNotes(options);
  if (unused.length > 0) return unused;
  const pouch = drafted.roles.pocket;
  const front = drafted.roles.front;
  if (pouch === undefined) {
    return [{
      field: "pocketWidth",
      level: "warn",
      text: "Pouch width and height are positive, but the drafted block has no pouch piece — restore the Hoodie pouch geometry before using these settings.",
    }];
  }
  if (front === undefined) {
    return [{
      field: "pocketHeight",
      level: "warn",
      text: "The drafted Hoodie block has no front panel for pouch containment — restore its front body geometry before using these settings.",
    }];
  }
  const openingNotes = pouchOpeningNotes(pouch);
  const reportedFields = new Set(openingNotes.map(({ field }) => field!));
  return [...openingNotes, ...pouchPanelNotes(pouch, front, reportedFields)];
}

function bandMathNotes(drafted: Block, options: HoodieOptions): Note[] {
  const requiredEdges: Readonly<Record<string, readonly string[]>> = {
    front: ["hem"],
    back: ["hem"],
    sleeveLeft: ["hem"],
    sleeveRight: ["hem"],
    cuffLeft: ["join"],
    cuffRight: ["join"],
    hemBand: ["join"],
  };
  if (Object.entries(requiredEdges).some(([role, names]) => {
    const piece = drafted.roles[role];
    return piece === undefined || names.some((name) => !piece.edges.some((edge) => edge.name === name));
  })) return [];
  const notes: Note[] = [];
  for (const measurement of hoodieBandMeasurements(drafted, options)) {
    if (measurement.analysis.calculable) continue;
    for (const issue of measurement.analysis.issues) {
      const action = issue.field === "openingLengthCm"
        ? "Review the actual Hoodie opening geometry until its walked length is finite and positive."
        : "Review both actual lengths; no material performance conclusion is implied.";
      notes.push({
        level: "warn",
        text: `${measurement.role}: ${issue.message} ${action}`,
      });
    }
  }
  return notes;
}

/** Complete internal Hoodie guidance; geometry and raw options remain untouched. */
export function hoodieGuidance(
  drafted: Block,
  measurements: Measurements,
  rawOptions: Partial<HoodieOptions> = {},
): Note[] {
  const options = resolveHoodieOptions(rawOptions);
  const validation = optionNotes(options);
  const notes = validation.notes;
  if (validation.blocksGeometryChecks) return notes;

  notes.push(...hoodieNecklineNotes(measurements, options));
  notes.push(...hoodieCasingNotes(measurements, options));
  notes.push(...pouchNotes(drafted, options));
  if (options.hoodCasingWidth === 0) {
    notes.push({
      field: "hoodExitSpacing",
      level: "info",
      text: "Drawcord exit spacing is unused while hoodCasingWidth is zero and the casing and exits are omitted.",
    });
  }
  notes.push(...bandMathNotes(drafted, options));
  return notes;
}
