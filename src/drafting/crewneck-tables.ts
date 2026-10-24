import type { Note } from "../guidance/note";
import { crewneckBandMeasurements, type CrewneckBandRole } from "./crewneck-components";
import { crewneckNecklineNotes } from "./crewneck";
import type { Block } from "./block";
import type { Measurements } from "./measurements";
import { rolePiece } from "./block";
import type { AllowanceSpec } from "./allowance";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import type { PieceNotches } from "./tshirt-notches";
import { seam, spanX, spanY, type Pom, type PointRef } from "./pom";
import type { GradeRule, SizeStep } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import type { TechPack } from "./recipe";
import { CREWNECK_DEFAULT_OPTIONS, CREWNECK_OPTION_DEFINITIONS, CREWNECK_STABLE_KNIT_DEFAULT } from "./crewneck-contract";
import type { GarmentOptions } from "./options";

export const CREWNECK_GRADE: GradeRule = TSHIRT_GRADE;
export const CREWNECK_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

/** Fold edges get no allowance; band and body joins use the shared 1 cm default. */
export const CREWNECK_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: { centerFront: 0, centerBack: 0 },
};

const BODY_GRAINLINE = {
  topEdge: "neckline",
  topT: 0.5,
  bottomEdge: "hem",
  bottomT: 0.5,
} as const;

const SLEEVE_GRAINLINE = {
  topEdge: "capLeft",
  topT: 1,
  bottomEdge: "hem",
  bottomT: 0.5,
} as const;

/** The band mark carries greatest stretch along its length; this grainline is perpendicular. */
const BAND_GRAINLINE = {
  topEdge: "sideLeft",
  topT: 0.5,
  bottomEdge: "sideRight",
  bottomT: 0.5,
} as const;

const BAND_MATCH_NOTCHES = [
  { edgeName: "join", t: 0.25 },
  { edgeName: "join", t: 0.5 },
  { edgeName: "join", t: 0.75 },
  { edgeName: "joinLayer", t: 0.25 },
  { edgeName: "joinLayer", t: 0.5 },
  { edgeName: "joinLayer", t: 0.75 },
] as const;

/** Every authored piece has explicit match marks and a true grain reference. */
export const CREWNECK_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "side", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
      { edgeName: "neckline", t: 0.5 },
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: BODY_GRAINLINE,
  },
  {
    pieceName: "back",
    notches: [
      { edgeName: "shoulder", t: 0.45 },
      { edgeName: "shoulder", t: 0.55 },
      { edgeName: "side", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
      { edgeName: "neckline", t: 0.5 },
      { edgeName: "hem", t: 0.5 },
    ],
    grainline: BODY_GRAINLINE,
  },
  {
    pieceName: "left crewneck set-in sleeve",
    notches: [
      { edgeName: "capLeft", t: 0.5 },
      { edgeName: "capRight", t: 0.5 },
      { edgeName: "sideLeft", t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ],
    grainline: SLEEVE_GRAINLINE,
  },
  {
    pieceName: "right crewneck set-in sleeve",
    notches: [
      { edgeName: "capLeft", t: 0.5 },
      { edgeName: "capRight", t: 0.5 },
      { edgeName: "sideLeft", t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ],
    grainline: SLEEVE_GRAINLINE,
  },
  { pieceName: "crewneck rib neckband", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
  { pieceName: "left crewneck rib cuff", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
  { pieceName: "right crewneck rib cuff", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
  { pieceName: "crewneck rib hem band", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
];

const FOLD: PointRef = { edge: "centerFront", at: "start" };
const front = (block: Block) => rolePiece(block, "front");
const leftSleeve = (block: Block) => rolePiece(block, "sleeveLeft");
const band = (block: Block, role: CrewneckBandRole) => rolePiece(block, role);
const bandMeasure = (block: Block, role: CrewneckBandRole) =>
  crewneckBandMeasurements(block, CREWNECK_DEFAULT_OPTIONS).find((measurement) => measurement.role === role)!;

/** Digital readings from the actual drafted block; none carries a physical tolerance. */
export const CREWNECK_POMS: readonly Pom[] = [
  {
    label: "Drafted chest circumference (digital)",
    measure: (block) => 4 * spanX(front(block), { edge: "side", at: "start" }, FOLD),
  },
  {
    label: "Drafted body length HPS–hem (digital)",
    measure: (block) => spanY(front(block), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
    anchor: (block) => edgeStart(pieceEdge(front(block), "hem")),
  },
  {
    label: "Across shoulder (digital)",
    measure: (block) => 2 * spanX(front(block), { edge: "shoulder", at: "end" }, FOLD),
    anchor: (block) => edgeEnd(pieceEdge(front(block), "shoulder")),
  },
  {
    label: "Front and back neckline join length (walked)",
    measure: (block) => bandMeasure(block, "neckband").openingLengthCm,
  },
  {
    label: "Neckband join length (digital)",
    measure: (block) => seam(band(block, "neckband"), "join"),
  },
  {
    label: "Finished neckband depth (digital)",
    measure: (block) => seam(band(block, "neckband"), "sideLeft") / 2,
  },
  {
    label: "Sleeve length cap to cuff join (digital)",
    measure: (block) => spanY(leftSleeve(block), { edge: "capLeft", at: "end" }, { edge: "hem", at: "start" }),
  },
  {
    label: "Left cuff join length (digital)",
    measure: (block) => seam(band(block, "cuffLeft"), "join"),
  },
  {
    label: "Right cuff join length (digital)",
    measure: (block) => seam(band(block, "cuffRight"), "join"),
  },
  {
    label: "Finished cuff depth (digital)",
    measure: (block) => seam(band(block, "cuffLeft"), "sideLeft") / 2,
  },
  {
    label: "Body hem opening length (walked)",
    measure: (block) => bandMeasure(block, "hemBand").openingLengthCm,
  },
  {
    label: "Hem-band join length (digital)",
    measure: (block) => seam(band(block, "hemBand"), "join"),
  },
  {
    label: "Finished hem-band depth (digital)",
    measure: (block) => seam(band(block, "hemBand"), "sideLeft") / 2,
  },
  {
    label: "Sleeve bicep width (digital)",
    measure: (block) => spanX(leftSleeve(block), { edge: "sideLeft", at: "end" }, { edge: "sideRight", at: "start" }),
  },
];

/** Recipe guidance uses math only, preserves bad values, and names corrections. */
export function crewneckGuidance(block: Block, measurements: Measurements, options: GarmentOptions): Note[] {
  const notes: Note[] = [...crewneckNecklineNotes(measurements)];
  const bands = crewneckBandMeasurements(block, options);

  for (const measurement of bands) {
    if (measurement.analysis.calculable) {
      notes.push({
        level: "info",
        field: measurement.optionId,
        text: measurement.role + " opening " + measurement.openingLengthCm.toFixed(2) +
          " cm; band " + measurement.bandLengthCm.toFixed(2) + " cm; opening/band " +
          measurement.analysis.openingToBandRatio.toFixed(3) + "; implied required stretch " +
          measurement.analysis.requiredStretchPercent.toFixed(1) +
          "%. This is interface math only, not a material, fit, recovery, or sewability result.",
      });
      continue;
    }

    for (const issue of measurement.analysis.issues) {
      let action: string;
      let field: string | undefined;
      if (issue.field === "bandLengthCm") {
        field = measurement.optionId;
        action = "Set this band length to a finite value greater than zero; the current value remains visible.";
      } else if (issue.field === "openingLengthCm") {
        action = "Review the body measurements and neckline settings until the actual walked opening is finite and greater than zero.";
      } else {
        field = measurement.optionId;
        action = "Review both the actual opening geometry and this band length; the result cannot be represented.";
      }
      notes.push({
        level: "warn",
        field,
        text: measurement.role + ": " + issue.message + " " + action,
      });
    }
  }

  for (const definition of CREWNECK_OPTION_DEFINITIONS) {
    const value = options[definition.id];
    const isDepth = definition.id.endsWith("Depth");
    if (typeof value !== "number" || !Number.isFinite(value)) {
      if (isDepth) {
        notes.push({
          level: "warn",
          field: definition.id,
          text: definition.label + " must be finite and within " + definition.min + "–" + definition.max +
            " cm. Set a valid value; the current input remains visible.",
        });
      }
      continue;
    }
    if (value < definition.min || value > definition.max) {
      notes.push({
        level: "warn",
        field: definition.id,
        text: definition.label + " is outside its declared " + definition.min + "–" + definition.max +
          " cm control range. Adjust within that range; the current input remains visible.",
      });
    }
  }
  notes.push({
    level: "info",
    text: CREWNECK_STABLE_KNIT_DEFAULT.name +
      " is an internal 10% width context seed only. It does not set sweatshirt ease or band length and does not predict material performance.",
  });
  return notes;
}

export const CREWNECK_TECH_PACK: TechPack = {
  constructionNotice: "Digital construction notes only; no physical sample or production approval is represented.",
  bom: [
    { material: "Stable sweatshirt fleece or French terry", placement: "Front, back, and set-in sleeves", qty: "Unknown; no fabric-width or marker study is included." },
    { material: "Rib knit (secondary)", placement: "Neckband, left/right cuffs, and hem band", qty: "1 neckband, 2 cuffs, 1 hem-band piece; rib yardage and combined-bolt yardage unknown." },
  ],
  construction: [
    "Join the front and back shoulder seams.",
    "Fold the neckband on its marked bandFold line and close the band ends.",
    "Attach the neckband to the walked front and back neckline, matching the centre and quarter marks.",
    "Set both sleeves into their armholes using the declared sleeve-cap interface.",
    "Close each side seam and sleeve underarm.",
    "Join one rib cuff to each sleeve hem, matching the band quarter marks.",
    "Join the hem band to the walked body hem, matching the band quarter marks.",
    "Use the greatest-stretch direction mark for rib orientation; it is distinct from the grainline.",
  ],
};
