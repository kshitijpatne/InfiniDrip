// Jogger guidance reports raw inputs and geometry conflicts without repairing
// either. It is recipe-owned and does not require the recipe to be registered.

import { Note } from "../guidance/note";
import { edgeEnd, pieceEdge } from "./piece";
import { Block, rolePiece } from "./block";
import { Measurements } from "./measurements";
import { lowerBodyUpperMetrics } from "./lower-body-upper";
import { JOGGER_OPTION_DEFINITIONS, resolveJoggerOptions, type JoggerOptions } from "./jogger-contract";

const DRAWCORD_CHANNEL_CLEARANCE = 0.6;
const BODY_FIELDS = ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"] as const;

function optionRangeNotes(options: JoggerOptions): Note[] {
  const notes: Note[] = [];
  for (const definition of JOGGER_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof JoggerOptions];
    const unit = definition.unit ? ` ${definition.unit}` : "";
    if (!Number.isFinite(value)) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} (${String(value)}) must be a finite value — enter a finite${unit} value.`,
      });
    } else if (value < definition.min || value > definition.max) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} (${value}${unit}) is outside the ${definition.min}–${definition.max}${unit} range — adjust it into that range.`,
      });
    }
  }
  return notes;
}

function measurementFiniteNotes(m: Measurements): Note[] {
  const notes: Note[] = [];
  for (const field of BODY_FIELDS) {
    if (!Number.isFinite(m[field])) {
      notes.push({
        field,
        level: "warn",
        text: `${field} (${String(m[field])}) must be finite — enter a finite body measurement before drafting.`,
      });
    } else if (field !== "ease" && field !== "inseam" && m[field] <= 0) {
      notes.push({
        field,
        level: "warn",
        text: `${field} (${m[field]} cm) must be positive — enter a positive body measurement before drafting.`,
      });
    }
  }
  return notes;
}

function sideBoundaryXAtY(front: ReturnType<typeof rolePiece>, y: number): number | null {
  for (const edge of front.edges) {
    if (edge.kind !== "line" || !edge.name.startsWith("side")) continue;
    const low = Math.min(edge.start.y, edge.end.y);
    const high = Math.max(edge.start.y, edge.end.y);
    if (y < low || y > high) continue;
    const dy = edge.end.y - edge.start.y;
    if (Math.abs(dy) < 1e-9) continue;
    const t = (y - edge.start.y) / dy;
    return edge.start.x + (edge.end.x - edge.start.x) * t;
  }
  return null;
}

function pointInsideFrontPanel(front: ReturnType<typeof rolePiece>, x: number, y: number): boolean {
  const side = sideBoundaryXAtY(front, y);
  return x > 0 && side !== null && x < side;
}

function pocketGuidance(drafted: Block, front: ReturnType<typeof rolePiece>, frontCrotchY: number, kneeY: number, hemY: number): Note[] {
  const notes: Note[] = [];
  const openingMark = rolePiece(drafted, "frontLeft").marks?.find((candidate) => candidate.name === "pocketOpening");
  if (!openingMark || !("start" in openingMark)) {
    return [{ field: "option-pocketOpening", level: "warn", text: "The Jogger front has no line pocket-opening mark — restore the Jogger opening geometry before using this draft." }];
  }
  const { start, end } = openingMark;
  if (!pointInsideFrontPanel(front, start.x, start.y) || !pointInsideFrontPanel(front, end.x, end.y)) {
    notes.push({
      field: "option-pocketOpening",
      level: "warn",
      text: "Pocket opening leaves the Jogger front panel — shorten the opening, reduce its angle/drop, or add waist ease.",
    });
  }
  if (end.y >= frontCrotchY) {
    notes.push({
      field: "option-pocketDrop",
      level: "warn",
      text: `Pocket opening reaches the front rise (${end.y.toFixed(1)} cm versus ${frontCrotchY.toFixed(1)} cm) — reduce pocket drop/angle or shorten the opening.`,
    });
  }
  const bagLowerEnd = edgeEnd(pieceEdge(rolePiece(drafted, "pocketBagLeft"), "bagLower"));
  if (bagLowerEnd.y >= kneeY) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: `Pocket bag reaches the knee region (${bagLowerEnd.y.toFixed(1)} cm) — shorten pocket-bag depth or increase inseam.`,
    });
  }
  if (bagLowerEnd.y >= hemY) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: `Pocket bag reaches the hem (${bagLowerEnd.y.toFixed(1)} cm versus ${hemY.toFixed(1)} cm) — shorten pocket-bag depth or increase inseam.`,
    });
  }
  if (bagLowerEnd.y < hemY &&
      (!pointInsideFrontPanel(front, edgeEnd(pieceEdge(rolePiece(drafted, "pocketBagLeft"), "bagOuter")).x, bagLowerEnd.y) ||
       !pointInsideFrontPanel(front, edgeEnd(pieceEdge(rolePiece(drafted, "pocketBagLeft"), "bagLower")).x, bagLowerEnd.y))) {
    notes.push({
      field: "option-pocketBagDepth",
      level: "warn",
      text: "Pocket bag extends past the Jogger front-panel boundary — shorten the bag or reduce the opening/drop so its bottom stays inside the panel.",
    });
  }
  return notes;
}

/** Complete digital guidance for the hidden P0 Jogger. */
export function joggerGuidance(
  drafted: Block,
  m: Measurements,
  rawOptions: Partial<JoggerOptions> = {},
): Note[] {
  const options = resolveJoggerOptions(rawOptions);
  const notes = optionRangeNotes(options);
  if (JOGGER_OPTION_DEFINITIONS.some((definition) =>
    !Number.isFinite(options[definition.id as keyof JoggerOptions]))) return notes;
  const invalidMeasurements = measurementFiniteNotes(m);
  notes.push(...invalidMeasurements);
  if (BODY_FIELDS.some((field) => !Number.isFinite(m[field]))) return notes;

  const upper = lowerBodyUpperMetrics(m, options, m.thigh + options.thighEase);
  const finishedKnee = m.knee + options.kneeEase;
  const kneeY = upper.backCrotchY + m.inseam * 0.52;
  const hemY = upper.backCrotchY + m.inseam;

  if (m.waist >= m.hip) {
    notes.push({ field: "waist", level: "warn", text: `Waist (${m.waist} cm) is not smaller than the hip (${m.hip} cm) — increase hip or reduce waist to restore lower-body ordering.` });
  }
  if (m.hipDepth >= m.crotchDepth) {
    notes.push({ field: "hipDepth", level: "warn", text: `Hip depth (${m.hipDepth} cm) reaches the sitting crotch depth (${m.crotchDepth} cm) — reduce hip depth or increase crotch depth so the seat station comes first.` });
  }
  if (!(m.inseam > 0)) {
    notes.push({ field: "inseam", level: "warn", text: `Inseam (${m.inseam} cm) must be positive — enter the finished crotch-to-hem length.` });
  }
  if (upper.finishedWaist <= 0 || upper.finishedSeat <= 0) {
    notes.push({ field: "ease", level: "warn", text: "Finished waist and seat must stay positive — increase the body measurement or ease instead of drafting a reversed panel." });
  }
  if (upper.backRise <= upper.frontRise) {
    notes.push({ field: "option-backRiseEase", level: "warn", text: `Back rise (${upper.backRise.toFixed(1)} cm) is not greater than the front rise (${upper.frontRise.toFixed(1)} cm) — increase back rise ease or reduce front rise ease for seat room.` });
  }
  if (options.waistbandDepth >= upper.frontCrotchY) {
    notes.push({ field: "option-waistbandDepth", level: "warn", text: "Casing depth reaches the front rise station — reduce casing depth or increase front rise ease." });
  }
  if (options.waistbandDepth >= upper.backCrotchY) {
    notes.push({ field: "option-waistbandDepth", level: "warn", text: "Casing depth reaches the back rise station — reduce casing depth or increase back rise ease." });
  }

  const requiredChannelDepth = options.elasticWidth + options.drawcordCutWidth / 4 + DRAWCORD_CHANNEL_CLEARANCE;
  if (options.waistbandDepth < requiredChannelDepth) {
    notes.push({
      field: "option-waistbandDepth",
      level: "warn",
      text: `Casing depth (${options.waistbandDepth} cm) is below the declared elastic/drawcord channel need (${requiredChannelDepth.toFixed(1)} cm) — increase casing depth or reduce elastic width/drawcord cut width.`,
    });
  }
  if (options.drawcordExit === 1 && options.drawcordExitSpacing >= upper.finishedWaist) {
    notes.push({
      field: "option-drawcordExitSpacing",
      level: "warn",
      text: `Drawcord exit spacing (${options.drawcordExitSpacing} cm) does not fit the finished waist (${upper.finishedWaist.toFixed(1)} cm) — reduce exit spacing or increase waist/ease.`,
    });
  }

  if (upper.finishedThigh <= 0 || finishedKnee <= 0 || options.legOpening <= 0) {
    notes.push({ field: "option-thighEase", level: "warn", text: "Finished thigh, knee and leg opening must stay positive — increase the body girth/ease values before drafting." });
  }
  if (upper.finishedThigh <= finishedKnee) {
    notes.push({ field: "thigh", level: "warn", text: `Finished thigh (${upper.finishedThigh.toFixed(1)} cm) is not wider than the knee (${finishedKnee.toFixed(1)} cm) — increase thigh room or reduce knee ease.` });
  }
  if (finishedKnee < options.legOpening) {
    notes.push({ field: "option-legOpening", level: "warn", text: `Leg opening (${options.legOpening} cm) is wider than the finished knee (${finishedKnee.toFixed(1)} cm) — reduce the opening or increase knee girth/ease for a coherent taper.` });
  }
  if (finishedKnee - options.legOpening > 12) {
    notes.push({ field: "option-legOpening", level: "warn", text: `The knee-to-opening drop is ${(finishedKnee - options.legOpening).toFixed(1)} cm — increase the opening or reduce knee ease to soften the taper.` });
  }

  const front = rolePiece(drafted, "frontLeft");
  notes.push(...pocketGuidance(drafted, front, upper.frontCrotchY, kneeY, hemY));
  return notes;
}
