import { Note } from "../guidance/note";
import { bodice } from "./bodice";
import { Block, block } from "./block";
import { ComponentResult } from "./component";
import { Measurements, derive } from "./measurements";
import { NecklineParams, necklineEdge } from "./neckline";
import { Piece } from "./piece";
import { GarmentOptions } from "./options";
import { edgeRef, iface, interfaceLength, Stitch } from "./stitch";
import { sleeve } from "./sleeve";
import {
  crewneckBandPiece,
  CrewneckBandRole,
} from "./crewneck-components";

export const CREWNECK_ROLE_ORDER = [
  "front",
  "back",
  "sleeveLeft",
  "sleeveRight",
  "neckband",
  "cuffLeft",
  "cuffRight",
  "hemBand",
] as const;

function namedPiece(result: ComponentResult, role: string): Piece {
  return result.pieces[role]!;
}

function optionValue(options: GarmentOptions, id: string): number {
  const value = options[id];
  return typeof value === "number" ? value : Number.NaN;
}

function bandClosureStitch(role: CrewneckBandRole): Stitch {
  return {
    label: "Crewneck band end closure: " + role,
    a: iface(edgeRef(role, "sideRight")),
    b: iface(edgeRef(role, "sideLeft")),
  };
}

function sleeveUnderarmStitch(role: "sleeveLeft" | "sleeveRight"): Stitch {
  return {
    label: "Crewneck sleeve underarm: " + role,
    a: iface(edgeRef(role, "sideRight")),
    b: iface(edgeRef(role, "sideLeft")),
  };
}

function sleeveCapStitch(role: "sleeveLeft" | "sleeveRight"): Stitch {
  return {
    label: "Crewneck set-in sleeve cap: " + role,
    a: iface(edgeRef(role, "capLeft"), edgeRef(role, "capRight")),
    b: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
    ease: { lo: -1, hi: 4 },
  };
}

/**
 * Draft the crewneck block from real bodice/armhole geometry. Options are
 * supplied by the later recipe contract; missing numeric controls remain
 * visibly invalid rather than receiving a hidden product default.
 */
export function draftCrewneck(
  measurements: Measurements,
  options: GarmentOptions = {},
): Block {
  const necklineParams: NecklineParams = {
    shape: "crew",
    widthEase: measurements.neckWidthEase,
    frontDrop: measurements.neckDrop,
  };
  const front = namedPiece(bodice(measurements, { position: "front", necklineParams }), "front");
  const back = namedPiece(bodice(measurements, { position: "back", necklineParams }), "back");
  const body = block({ front, back }, []);

  const targetArmhole = interfaceLength(
    body,
    iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
  );
  // The shared sleeve solver supplies its inherited 1.5 cm cap ease. S1109
  // records that as an inherited, fleece-unvalidated assumption.
  const sleeveTemplate = namedPiece(sleeve(measurements, { targetArmhole }), "sleeve");
  const sleeveLeft = { ...sleeveTemplate, name: "left crewneck set-in sleeve" };
  const sleeveRight = { ...sleeveTemplate, name: "right crewneck set-in sleeve" };

  const neckband = crewneckBandPiece(
    "neckband",
    optionValue(options, "neckbandLength"),
    optionValue(options, "neckbandDepth"),
  );
  const cuffLeft = crewneckBandPiece(
    "cuffLeft",
    optionValue(options, "cuffLength"),
    optionValue(options, "cuffDepth"),
  );
  const cuffRight = crewneckBandPiece(
    "cuffRight",
    optionValue(options, "cuffLength"),
    optionValue(options, "cuffDepth"),
  );
  const hemBand = crewneckBandPiece(
    "hemBand",
    optionValue(options, "hemBandLength"),
    optionValue(options, "hemBandDepth"),
  );

  const roles = {
    front,
    back,
    sleeveLeft,
    sleeveRight,
    neckband,
    cuffLeft,
    cuffRight,
    hemBand,
  };

  const stitches: readonly Stitch[] = [
    {
      label: "Crewneck shoulder seams",
      a: iface(edgeRef("front", "shoulder")),
      b: iface(edgeRef("back", "shoulder")),
    },
    {
      label: "Crewneck side seams",
      a: iface(edgeRef("front", "side")),
      b: iface(edgeRef("back", "side")),
    },
    sleeveUnderarmStitch("sleeveLeft"),
    sleeveUnderarmStitch("sleeveRight"),
    sleeveCapStitch("sleeveLeft"),
    sleeveCapStitch("sleeveRight"),
    bandClosureStitch("neckband"),
    bandClosureStitch("cuffLeft"),
    bandClosureStitch("cuffRight"),
    bandClosureStitch("hemBand"),
  ];

  return block(roles, stitches);
}

/** Surface the warn-never-clamp notes emitted by the same neckline function
 * used to draft each bodice panel; the Bodice component currently drops notes. */
export function crewneckNecklineNotes(measurements: Measurements): readonly Note[] {
  const derived = derive(measurements);
  const params: NecklineParams = {
    shape: "crew",
    widthEase: measurements.neckWidthEase,
    frontDrop: measurements.neckDrop,
  };
  const front = necklineEdge(
    "front",
    derived.neckWidthHalf,
    derived.frontNeckDepth,
    derived.shoulderHalf,
    measurements.armholeDepth,
    params,
  );
  const back = necklineEdge(
    "back",
    derived.neckWidthHalf,
    derived.backNeckDepth,
    derived.shoulderHalf,
    measurements.armholeDepth,
    params,
  );
  return [...front.notes, ...back.notes];
}
