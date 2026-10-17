// Skirt waistband pieces. Each piece follows its matching on-fold body panel
// from the center fold to a side seam, so the band and body openings can meet
// at the same side zipper.

import { point } from "../geometry";
import { Component } from "./component";
import { Edge, Piece } from "./piece";
import { edgeRef, iface } from "./stitch";

export interface WaistbandParams {
  readonly depth: number; // cm, the band's height
  /** Length of the front panel waist edge, supplied by the skirt grammar. */
  readonly frontSeamLength?: number;
  /** Length of the back panel waist edge, supplied by the skirt grammar. */
  readonly backSeamLength?: number;
}

export const WAISTBAND_DEFAULT: WaistbandParams = { depth: 3.5 };

function bandPiece(name: string, seamLength: number, depth: number): Piece {
  const foldTop = point(0, 0);
  const sideTop = point(seamLength, 0);
  const sideBottom = point(seamLength, depth);
  const foldBottom = point(0, depth);

  const edges: Edge[] = [
    { kind: "line", name: "top", start: foldTop, end: sideTop },
    { kind: "line", name: "side", start: sideTop, end: sideBottom },
    { kind: "line", name: "seam", start: sideBottom, end: foldBottom },
    { kind: "line", name: "fold", start: foldBottom, end: foldTop },
  ];

  return { name, onFold: true, edges };
}

/** Draft separate front/back bands. Each is cut on its matching center fold;
 * its side edge aligns with the body side seam and carries the zipper path. */
export const waistband: Component<WaistbandParams> = (m, params) => {
  const defaultQuarterWaist = (m.waist + m.ease) / 4;
  const frontLength = params.frontSeamLength ?? defaultQuarterWaist;
  const backLength = params.backSeamLength ?? defaultQuarterWaist;

  return {
    pieces: {
      waistbandFront: bandPiece("waistbandFront", frontLength, params.depth),
      waistbandBack: bandPiece("waistbandBack", backLength, params.depth),
    },
    stitches: [],
    interfaces: {
      frontWaist: iface(edgeRef("waistbandFront", "seam", true)),
      backWaist: iface(edgeRef("waistbandBack", "seam", true)),
      frontSide: iface(edgeRef("waistbandFront", "side")),
      backSide: iface(edgeRef("waistbandBack", "side")),
    },
  };
};
