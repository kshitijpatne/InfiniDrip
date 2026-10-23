import { analyzeBandStretch, type BandStretchAnalysis } from "../guidance/band-stretch";
import type { AllowanceSpec } from "./allowance";
import type { Block } from "./block";
import { rolePiece } from "./block";
import type { GradeOptionResolutionContext, GradeRule, SizeStep } from "./grading";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { seam, spanX, spanY, type Pom, type PointRef } from "./pom";
import type { PieceNotches } from "./tshirt-notches";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import type { BomRow, TechPack } from "./recipe";
import type { GarmentOptions } from "./options";
import { edgeRef, iface, interfaceLength, type Interface } from "./stitch";
import { hoodieNecklineMeasurements } from "./hoodie";
import {
  HOODIE_DEFAULT_OPTIONS,
  resolveHoodieOptions,
  type HoodieOptions,
} from "./hoodie-contract";

export const HOODIE_GRADE: GradeRule = TSHIRT_GRADE;
export const HOODIE_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

/** Fold allowances are zero; all other seam and cut edges use a 1 cm digital default. */
export const HOODIE_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byPieceEdge: {
    front: { centerFront: 0 },
    back: { centerBack: 0 },
    "Hoodie kangaroo pouch": { fold: 0 },
  },
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

// This is a CAD layout axis from center-back toward the face opening, not a
// greatest-stretch direction; the current engine has no stretch-direction data.
const HOOD_GRAINLINE = {
  topEdge: "centerBack",
  topT: 0.5,
  bottomEdge: "faceOpening",
  bottomT: 0.5,
} as const;

const POCKET_GRAINLINE = {
  topEdge: "top",
  topT: 0.5,
  bottomEdge: "bottom",
  bottomT: 0.5,
} as const;

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

/** Notch and layout references use exact current piece names and edge names. */
export const HOODIE_NOTCHES: readonly PieceNotches[] = [
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
    pieceName: "left hoodie set-in sleeve",
    notches: [
      { edgeName: "capLeft", t: 0.5 },
      { edgeName: "capRight", t: 0.5 },
      { edgeName: "sideLeft", t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ],
    grainline: SLEEVE_GRAINLINE,
  },
  {
    pieceName: "right hoodie set-in sleeve",
    notches: [
      { edgeName: "capLeft", t: 0.5 },
      { edgeName: "capRight", t: 0.5 },
      { edgeName: "sideLeft", t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ],
    grainline: SLEEVE_GRAINLINE,
  },
  ...(["outer", "lining"] as const).flatMap((layer) =>
    (["left", "right"] as const).map((side) => ({
      pieceName: "hoodie " + side + " " + layer + " hood side",
      notches: [
        { edgeName: "necklineFront", t: 0.5 },
        { edgeName: "necklineBack", t: 0.5 },
        { edgeName: "centerBack", t: 0.5 },
        { edgeName: "faceOpening", t: 0.5 },
      ],
      grainline: HOOD_GRAINLINE,
    })),
  ),
  {
    pieceName: "Hoodie kangaroo pouch",
    notches: [
      { edgeName: "top", t: 0.5 },
      { edgeName: "side", t: 0.5 },
      { edgeName: "bottom", t: 0.5 },
    ],
    grainline: POCKET_GRAINLINE,
  },
  { pieceName: "left hoodie rib cuff", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
  { pieceName: "right hoodie rib cuff", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
  { pieceName: "hoodie rib hem band", notches: BAND_MATCH_NOTCHES, grainline: BAND_GRAINLINE },
];

const FOLD: PointRef = { edge: "centerFront", at: "start" };
const front = (drafted: Block) => rolePiece(drafted, "front");
const leftSleeve = (drafted: Block) => rolePiece(drafted, "sleeveLeft");
const band = (drafted: Block, role: "cuffLeft" | "cuffRight" | "hemBand") =>
  rolePiece(drafted, role);

const BODY_HEM_INTERFACE: Interface = iface(
  edgeRef("front", "hem", true),
  edgeRef("back", "hem"),
  edgeRef("back", "hem", true),
  edgeRef("front", "hem"),
);

const BAND_JOINS = [
  { role: "cuffLeft", optionId: "cuffLength", opening: iface(edgeRef("sleeveLeft", "hem")) },
  { role: "cuffRight", optionId: "cuffLength", opening: iface(edgeRef("sleeveRight", "hem")) },
  { role: "hemBand", optionId: "hemBandLength", opening: BODY_HEM_INTERFACE },
] as const;

export interface HoodieBandMeasurement {
  readonly role: typeof BAND_JOINS[number]["role"];
  readonly optionId: typeof BAND_JOINS[number]["optionId"];
  readonly openingLengthCm: number;
  readonly bandLengthCm: number;
  readonly bandEdgeLengthCm: number;
  readonly analysis: BandStretchAnalysis;
}

function numericOption(options: GarmentOptions, optionId: string): number {
  const value = options[optionId];
  return typeof value === "number" ? value : Number.NaN;
}

/** Walk the actual paired sleeve openings and full body hem against band inputs. */
export function hoodieBandMeasurements(
  drafted: Block,
  options: GarmentOptions,
): readonly HoodieBandMeasurement[] {
  return BAND_JOINS.map((definition) => {
    const openingLengthCm = interfaceLength(drafted, definition.opening);
    const bandLengthCm = numericOption(options, definition.optionId);
    const bandEdgeLengthCm = interfaceLength(
      drafted,
      iface(edgeRef(definition.role, "join")),
    );
    return {
      role: definition.role,
      optionId: definition.optionId,
      openingLengthCm,
      bandLengthCm,
      bandEdgeLengthCm,
      analysis: analyzeBandStretch(openingLengthCm, bandLengthCm),
    };
  });
}

/** Preserve the base settings unless actual opening ratios yield a valid size value. */
export function resolveHoodieOptionsForSize(
  context: GradeOptionResolutionContext,
): GarmentOptions {
  const baseOptions = resolveHoodieOptions(context.baseOptions as Partial<HoodieOptions>);
  const baseBlock = context.draft(context.baseMeasurements, baseOptions);
  const sizeBlock = context.draft(context.sizeMeasurements, baseOptions);
  const baseJoins = hoodieBandMeasurements(baseBlock, baseOptions);
  const sizeJoins = hoodieBandMeasurements(sizeBlock, baseOptions);
  const resolved: Record<string, number> = { ...baseOptions };

  for (const binding of [
    { role: "cuffLeft", optionId: "cuffLength" },
    { role: "hemBand", optionId: "hemBandLength" },
  ] as const) {
    const baseJoin = baseJoins.find(({ role }) => role === binding.role)!;
    const sizeJoin = sizeJoins.find(({ role }) => role === binding.role)!;
    if (!baseJoin.analysis.calculable) continue;

    const resolvedLength = baseJoin.bandLengthCm *
      sizeJoin.openingLengthCm / baseJoin.openingLengthCm;
    if (analyzeBandStretch(sizeJoin.openingLengthCm, resolvedLength).calculable) {
      resolved[binding.optionId] = resolvedLength;
    }
  }

  return resolved;
}

function pouchWidth(drafted: Block): number {
  const pouch = drafted.roles.pocket;
  if (pouch === undefined) return 0;
  return 2 * spanX(pouch, { edge: "top", at: "start" }, { edge: "top", at: "end" });
}

function pouchHeight(drafted: Block): number {
  const pouch = drafted.roles.pocket;
  if (pouch === undefined) return 0;
  return seam(pouch, "fold");
}

function pouchOpeningLength(drafted: Block): number {
  const pouch = drafted.roles.pocket;
  if (pouch === undefined) return 0;
  return seam(pouch, "opening");
}

/** POMs are live digital-pattern readings; none is a physical target or tolerance. */
export const HOODIE_POMS: readonly Pom[] = [
  {
    label: "Drafted chest circumference (digital)",
    measure: (drafted) => 4 * spanX(front(drafted), { edge: "side", at: "start" }, FOLD),
  },
  {
    label: "Drafted body length HPS-to-hem (digital)",
    measure: (drafted) => spanY(front(drafted), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
    anchor: (drafted) => edgeStart(pieceEdge(front(drafted), "hem")),
  },
  {
    label: "Across shoulder (digital)",
    measure: (drafted) => 2 * spanX(front(drafted), { edge: "shoulder", at: "end" }, FOLD),
    anchor: (drafted) => edgeEnd(pieceEdge(front(drafted), "shoulder")),
  },
  {
    label: "Sleeve length cap-to-cuff join (digital)",
    measure: (drafted) => spanY(leftSleeve(drafted), { edge: "capLeft", at: "end" }, { edge: "hem", at: "start" }),
  },
  {
    label: "Front and back neckline length per half (walked, digital)",
    measure: (drafted) => hoodieNecklineMeasurements(drafted).garmentHalfNecklineCm,
  },
  {
    label: "Outer hood neck seam per half (walked, digital)",
    measure: (drafted) => hoodieNecklineMeasurements(drafted).hoodPieces[0]!.hoodNecklineCm,
  },
  {
    label: "Outer hood center-back seam per side (digital)",
    measure: (drafted) => seam(rolePiece(drafted, "hoodOuterLeft"), "centerBack"),
  },
  {
    label: "Outer hood face-opening edge per side (digital)",
    measure: (drafted) => seam(rolePiece(drafted, "hoodOuterLeft"), "faceOpening"),
  },
  {
    label: "Left cuff join length (digital)",
    measure: (drafted) => seam(band(drafted, "cuffLeft"), "join"),
  },
  {
    label: "Right cuff join length (digital)",
    measure: (drafted) => seam(band(drafted, "cuffRight"), "join"),
  },
  {
    label: "Finished cuff depth (digital)",
    measure: (drafted) => seam(band(drafted, "cuffLeft"), "sideLeft") / 2,
  },
  {
    label: "Body hem-band opening length (walked, digital)",
    measure: (drafted) => interfaceLength(drafted, BODY_HEM_INTERFACE),
  },
  {
    label: "Hem-band join length (digital)",
    measure: (drafted) => seam(band(drafted, "hemBand"), "join"),
  },
  {
    label: "Finished hem-band depth (digital)",
    measure: (drafted) => seam(band(drafted, "hemBand"), "sideLeft") / 2,
  },
  {
    label: "Pouch total width (digital; 0 when omitted)",
    measure: pouchWidth,
  },
  {
    label: "Pouch height (digital; 0 when omitted)",
    measure: pouchHeight,
  },
  {
    label: "Pouch opening length per side (digital; 0 when omitted)",
    measure: pouchOpeningLength,
  },
];

const HOODIE_TECH_PACK_NOTICE =
  "Digital construction notes only. Any nesting amount is a single-bolt draft estimate; yardage, material suitability, physical fit, and production approval are not verified.";

const HOODIE_BASE_BOM = [
  {
    material: "Selected fabric context",
    placement: "On-fold body front and back, two sleeves, two mirrored outer hood sides, and two mirrored lining sides",
    qty: "Digital piece roles only; yardage is unknown. Single-bolt draft estimate; width, marker yield, and material suitability are not verified.",
  },
  {
    material: "Selected fabric context",
    placement: "Two cuffs and one hem-band piece",
    qty: "Digital piece roles only; no separate rib/trim bolt or per-piece material is modeled.",
  },
] as const;

const HOODIE_POUCH_BOM = {
  material: "Selected fabric context",
  placement: "Single on-fold kangaroo pouch",
  qty: "One half-pattern piece when both pouch dimensions are nonzero; the fold mirrors it.",
};

const HOODIE_TECH_PACK_STEPS = [
  "Join the shoulder seams and side seams; set both sleeves into the actual drafted armholes.",
  "Join the mirrored outer hood sides along their center-back seam and join the mirrored lining sides along their center-back seam.",
  "Join outer and lining along the hood face opening, turn, and finish the edge as selected; no separate hood facing is modeled.",
  "Attach the hood neckline to the walked garment neckline; no separate neckband or binding cut piece is modeled.",
  "Attach one cuff to each sleeve opening and join the hem band to the walked body hem opening.",
  "Topstitch the pouch top, bottom, and short sides; leave both diagonal openings free and bartack their corners. No pocket-facing pieces are modeled.",
] as const;

/** Keep digital counts and cord disclosure aligned with the selected Hoodie options. */
export function hoodieTechPackForOptions(options: GarmentOptions = HOODIE_DEFAULT_OPTIONS): TechPack {
  const resolved = resolveHoodieOptions(options as Partial<HoodieOptions>);
  const bom: BomRow[] = [...HOODIE_BASE_BOM];
  if (resolved.pocketWidth !== 0 && resolved.pocketHeight !== 0) {
    bom.push(HOODIE_POUCH_BOM);
  }
  const cordAmount = String(resolved.hoodDrawcordLength);
  const casingNote = resolved.hoodCasingWidth === 0
    ? " It is unused while hood casing width is zero."
    : "";
  return {
    constructionNotice: HOODIE_TECH_PACK_NOTICE,
    bom,
    construction: [
      ...HOODIE_TECH_PACK_STEPS,
      "Digital drawcord amount: " + cordAmount +
        " cm; not a cut length or manufacturing quantity." + casingNote,
    ],
  };
}

export const HOODIE_TECH_PACK: TechPack = hoodieTechPackForOptions(HOODIE_DEFAULT_OPTIONS);
