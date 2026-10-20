import { analyzeBandStretch, BandStretchAnalysis } from "../guidance/band-stretch";
import { point } from "../geometry";
import { Block } from "./block";
import { GradeOptionResolutionContext } from "./grading";
import { GarmentOptions } from "./options";
import { Piece } from "./piece";
import { edgeRef, iface, Interface, interfaceLength } from "./stitch";
import { lineMark } from "./pattern-mark";

export type CrewneckBandRole = "neckband" | "cuffLeft" | "cuffRight" | "hemBand";

export interface CrewneckBandJoinDefinition {
  readonly role: CrewneckBandRole;
  readonly optionId: "neckbandLength" | "cuffLength" | "hemBandLength";
  readonly opening: Interface;
  /** One of the two aligned layers at the folded band's attachment edge. */
  readonly band: Interface;
}

const fullNecklineInterface: Interface = iface(
  edgeRef("front", "neckline"),
  edgeRef("back", "neckline", true),
  edgeRef("back", "neckline"),
  edgeRef("front", "neckline", true),
);

const fullBodyHemInterface: Interface = iface(
  edgeRef("front", "hem", true),
  edgeRef("back", "hem"),
  edgeRef("back", "hem", true),
  edgeRef("front", "hem"),
);

/**
 * Ratio-based band joins intentionally live outside Block.stitches: Stitch.ease
 * represents only an absolute centimetre difference, not stretch-to-fit.
 */
export const CREWNECK_BAND_JOIN_DEFINITIONS: readonly CrewneckBandJoinDefinition[] = [
  {
    role: "neckband",
    optionId: "neckbandLength",
    opening: fullNecklineInterface,
    band: iface(edgeRef("neckband", "join")),
  },
  {
    role: "cuffLeft",
    optionId: "cuffLength",
    opening: iface(edgeRef("sleeveLeft", "hem")),
    band: iface(edgeRef("cuffLeft", "join")),
  },
  {
    role: "cuffRight",
    optionId: "cuffLength",
    opening: iface(edgeRef("sleeveRight", "hem")),
    band: iface(edgeRef("cuffRight", "join")),
  },
  {
    role: "hemBand",
    optionId: "hemBandLength",
    opening: fullBodyHemInterface,
    band: iface(edgeRef("hemBand", "join")),
  },
];

export interface CrewneckBandMeasurement {
  readonly role: CrewneckBandRole;
  readonly optionId: CrewneckBandJoinDefinition["optionId"];
  readonly openingLengthCm: number;
  /** The raw user-owned input passed to band stretch math. */
  readonly bandLengthCm: number;
  /** The drafted edge length; valid positive input matches bandLengthCm. */
  readonly bandEdgeLengthCm: number;
  readonly analysis: BandStretchAnalysis;
}

function numericOption(options: GarmentOptions, id: string): number {
  const value = options[id];
  return typeof value === "number" ? value : Number.NaN;
}

export function crewneckBandPiece(
  role: CrewneckBandRole,
  lengthCm: number,
  finishedDepthCm: number,
): Piece {
  const pieceNames: Record<CrewneckBandRole, string> = {
    neckband: "crewneck rib neckband",
    cuffLeft: "left crewneck rib cuff",
    cuffRight: "right crewneck rib cuff",
    hemBand: "crewneck rib hem band",
  };
  // The geometry is the sew-line rectangle. The later recipe allowance table
  // adds allowance at both long edges, yielding 2 x finished depth + 2 x SA
  // for the cut depth. The middle mark is the lengthwise fold.
  const twoLayerDepth = 2 * finishedDepthCm;
  return {
    name: pieceNames[role],
    onFold: false,
    edges: [
      { kind: "line", name: "join", start: point(0, 0), end: point(lengthCm, 0) },
      { kind: "line", name: "sideRight", start: point(lengthCm, 0), end: point(lengthCm, twoLayerDepth) },
      { kind: "line", name: "joinLayer", start: point(lengthCm, twoLayerDepth), end: point(0, twoLayerDepth) },
      { kind: "line", name: "sideLeft", start: point(0, twoLayerDepth), end: point(0, 0) },
    ],
    marks: [
      lineMark(
        "foldLine",
        "bandFold",
        point(0, finishedDepthCm),
        point(lengthCm, finishedDepthCm),
      ),
      lineMark(
        "placementLine",
        "greatestStretchDirection",
        point(0, finishedDepthCm / 2),
        point(lengthCm, finishedDepthCm / 2),
        "GREATEST STRETCH ALONG BAND LENGTH",
        "instruction",
      ),
    ],
  };
}

export function crewneckBandMeasurements(
  drafted: Block,
  options: GarmentOptions,
): readonly CrewneckBandMeasurement[] {
  return CREWNECK_BAND_JOIN_DEFINITIONS.map((definition) => {
    const openingLengthCm = interfaceLength(drafted, definition.opening);
    const bandLengthCm = numericOption(options, definition.optionId);
    const bandEdgeLengthCm = interfaceLength(drafted, definition.band);
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

const BAND_LENGTH_RESOLVER_BINDINGS: readonly {
  readonly role: CrewneckBandRole;
  readonly optionId: CrewneckBandJoinDefinition["optionId"];
}[] = [
  { role: "neckband", optionId: "neckbandLength" },
  // One shared user option controls both mirrored cuffs; geometry tests assert
  // their actual openings and drafted bands are equal.
  { role: "cuffLeft", optionId: "cuffLength" },
  { role: "hemBand", optionId: "hemBandLength" },
];

/** Resolve each base circumference by the accepted actual-opening proportion. */
export function resolveCrewneckOptionsForSize(
  context: GradeOptionResolutionContext,
): GarmentOptions {
  const baseBlock = context.draft(context.baseMeasurements, context.baseOptions);
  const sizeBlock = context.draft(context.sizeMeasurements, context.baseOptions);
  const baseMeasurements = crewneckBandMeasurements(baseBlock, context.baseOptions);
  const sizeMeasurements = crewneckBandMeasurements(sizeBlock, context.baseOptions);
  const resolved: Record<string, number> = { ...context.baseOptions };

  for (const binding of BAND_LENGTH_RESOLVER_BINDINGS) {
    const baseJoin = baseMeasurements.find((measurement) => measurement.role === binding.role)!;
    const sizeJoin = sizeMeasurements.find((measurement) => measurement.role === binding.role)!;
    const baseLength = numericOption(context.baseOptions, binding.optionId);
    if (!analyzeBandStretch(baseJoin.openingLengthCm, baseLength).calculable) continue;

    const resolvedLength = baseLength * sizeJoin.openingLengthCm / baseJoin.openingLengthCm;
    if (analyzeBandStretch(sizeJoin.openingLengthCm, resolvedLength).calculable) {
      resolved[binding.optionId] = resolvedLength;
    }
  }

  return resolved;
}
