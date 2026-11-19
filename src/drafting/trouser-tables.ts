// Recipe tables for the Epic 3 trouser block.
//
// These functions read the assembled block, not the UI state or a second set
// of drafting formulas. A spec row therefore measures the same live edges the
// renderer, stitch checker, and exports already carry.

import { distance } from "../geometry";
import { Block, rolePiece } from "./block";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { GradeRule, SizeStep } from "./grading";
import { TSHIRT_SIZES } from "./tshirt-grade";
import { Pom, seam, spanY } from "./pom";
import type { TechPack } from "./recipe";
import { TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY,
  type TrouserOptions } from "./trouser-contract";

/** cm added per +1 size step. Ease and recipe options remain constant in V1. */
export const TROUSER_GRADE: GradeRule = {
  waist: 4,
  hip: 4,
  hipDepth: 1,
  crotchDepth: 1,
  thigh: 2,
  knee: 1.5,
  inseam: 1.5,
};

/** The same ordered XS–XL run used by the existing size-run engine. */
export const TROUSER_SIZES: readonly SizeStep[] = TSHIRT_SIZES;

function pointMarkY(b: Block, role: string, name: string): number {
  const mark = rolePiece(b, role).marks!.find((candidate) => candidate.name === name)!;
  return (mark as Extract<typeof mark, { at: { y: number } }>).at.y;
}

const front = (b: Block) => rolePiece(b, "frontLeft");
const back = (b: Block) => rolePiece(b, "backLeft");
const band = (b: Block) => rolePiece(b, "waistband");
const bag = (b: Block, role: "pocketBagLeft" | "pocketBagRight") => rolePiece(b, role);

/** Finished POMs for the assembled V1 trouser. Labels explicitly distinguish
 * body reference values from finished garment values. */
export const TROUSER_POMS: readonly Pom[] = [
  {
    label: "Waist (finished)",
    tolerance: 1.0,
    measure: (b) => 4 * seam(front(b), "waist"),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "waist")),
  },
  {
    label: "Waistband depth (finished)",
    tolerance: 0.2,
    measure: (b) => seam(band(b), "endRight"),
    backMarkAnchor: { roleId: "waistband", markName: "centerBack" },
  },
  {
    label: "Seat / hip (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * edgeEnd(pieceEdge(front(b), "sideUpper")).x,
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
  },
  {
    label: "Hip depth (body reference)",
    tolerance: 0.5,
    measure: (b) => spanY(front(b), { edge: "waist", at: "start" }, { edge: "sideUpper", at: "end" }),
    anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
  },
  {
    label: "Front rise (finished incl. waistband)",
    tolerance: 0.8,
    measure: (b) => spanY(front(b), { edge: "centerFront", at: "start" }, { edge: "centerFront", at: "end" }) + seam(band(b), "endRight"),
    anchor: (b) => edgeStart(pieceEdge(front(b), "centerFront")),
  },
  {
    label: "Back rise (finished incl. waistband)",
    tolerance: 0.8,
    measure: (b) => spanY(back(b), { edge: "centerBack", at: "start" }, { edge: "centerBack", at: "end" }) + seam(band(b), "endRight"),
    backAnchor: (b) => edgeStart(pieceEdge(back(b), "centerBack")),
  },
  {
    label: "Thigh (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * distance(
      edgeEnd(pieceEdge(front(b), "sideHipToThigh")),
      edgeStart(pieceEdge(front(b), "innerThighToCrotch")),
    ),
  },
  {
    label: "Knee (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * distance(
      edgeEnd(pieceEdge(front(b), "sideThighToKnee")),
      edgeEnd(pieceEdge(front(b), "inseamLower")),
    ),
  },
  {
    label: "Inseam (finished seam)",
    tolerance: 1.0,
    measure: (b) => seam(front(b), "innerThighToCrotch") + seam(front(b), "inseamUpper") + seam(front(b), "inseamLower"),
  },
  {
    label: "Outseam (finished incl. waistband)",
    tolerance: 1.0,
    measure: (b) => seam(front(b), "sideUpper") + seam(front(b), "sideHipToThigh") + seam(front(b), "sideThighToKnee") + seam(front(b), "sideKneeToHem") + seam(band(b), "endRight"),
  },
  {
    label: "Leg opening (finished)",
    tolerance: 0.8,
    measure: (b) => 4 * seam(front(b), "hem"),
    anchor: (b) => edgeStart(pieceEdge(front(b), "hem")),
  },
  {
    label: "Front fly length (finished)",
    tolerance: 0.3,
    measure: (b) => seam(rolePiece(b, "flyShield"), "left"),
  },
  {
    label: "Left pocket opening (finished)",
    tolerance: 0.4,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "opening"),
  },
  {
    label: "Right pocket opening (finished)",
    tolerance: 0.4,
    measure: (b) => seam(bag(b, "pocketBagRight"), "opening"),
  },
  {
    label: "Pocket bag depth (finished)",
    tolerance: 0.5,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagLower"),
  },
  {
    label: "Pocket bag width (finished)",
    tolerance: 0.5,
    measure: (b) => seam(bag(b, "pocketBagLeft"), "bagOuter"),
  },
  {
    label: "Pocket drop (finished placement)",
    tolerance: 0.5,
    measure: (b) => pointMarkY(b, "frontLeft", "pocketOpeningStart"),
  },
];

function postPleatWaistMark(b: Block) {
  const mark = front(b).marks?.find((candidate) => candidate.name === "frontWaistAfterPleat");
  return mark && "start" in mark ? mark : undefined;
}

/** Keep shared Trouser POMs unchanged; R06 and R07 measure their waist
 * references from authored post-fold or gather-to lines rather than cut edges. */
export function trouserPomsForOptions(rawOptions: Partial<TrouserOptions> = {}): readonly Pom[] {
  if (rawOptions[TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY] === 1) {
    const casingDepth = rawOptions.casingDepthCm ?? 4;
    const casingMark = (b: Block) => front(b).marks?.find((candidate) => candidate.name === "casingStitchGuide");
    const backCasingMark = (b: Block) => back(b).marks?.find((candidate) => candidate.name === "casingStitchGuide");
    return TROUSER_POMS.filter((pom) => pom.label !== "Waistband depth (finished)"
      && pom.label !== "Front fly length (finished)").map((pom): Pom => {
      if (pom.label === "Waist (finished)") return {
        ...pom,
        label: "Waist opening before gathering (digital seamline)",
        measure: (b) => 4 * seam(front(b), "waist"),
        anchor: (b) => edgeEnd(pieceEdge(front(b), "waist")),
        anchorEdgeId: "waist",
      };
      if (pom.label === "Hip depth (body reference)") return {
        ...pom,
        measure: (b) => {
          const mark = casingMark(b);
          return mark && "start" in mark
            ? Math.abs(edgeEnd(pieceEdge(front(b), "sideUpper")).y - mark.start.y)
            : 0;
        },
        anchor: (b) => edgeEnd(pieceEdge(front(b), "sideUpper")),
        anchorEdgeId: "sideUpper",
      };
      if (pom.label === "Front rise (finished incl. waistband)") return {
        ...pom,
        label: "Front rise (digital gather-to waist reference)",
        measure: (b) => {
          const mark = casingMark(b);
          return mark && "start" in mark ? Math.abs(edgeStart(pieceEdge(front(b), "centerFront")).y - mark.start.y) : 0;
        },
        anchor: (b) => edgeEnd(pieceEdge(front(b), "centerFront")),
        anchorEdgeId: "centerFront",
      };
      if (pom.label === "Back rise (finished incl. waistband)") return {
        ...pom,
        label: "Back rise (digital gather-to waist reference)",
        measure: (b) => {
          const mark = backCasingMark(b);
          return mark && "start" in mark ? Math.abs(edgeStart(pieceEdge(back(b), "centerBack")).y - mark.start.y) : 0;
        },
        backAnchor: (b) => edgeEnd(pieceEdge(back(b), "centerBack")),
        backAnchorEdgeId: "centerBack",
      };
      if (pom.label === "Outseam (finished incl. waistband)") return {
        ...pom,
        label: "Outseam (digital gather-to waist reference)",
        measure: (b) => seam(front(b), "sideUpper") + seam(front(b), "sideHipToThigh")
          + seam(front(b), "sideThighToKnee") + seam(front(b), "sideKneeToHem"),
      };
      return pom;
    }).concat([
      {
        label: "Gather-to waist reference (digital)", tolerance: 1,
        measure: (b) => {
          const mark = casingMark(b);
          return mark && "start" in mark ? 4 * distance(mark.start, mark.end) : 0;
        },
        frontMarkAnchor: { roleId: "frontLeft", markName: "casingStitchGuide", point: "end" as const },
      },
      {
        label: "Casing depth (digital)", tolerance: 0.2, measure: () => casingDepth,
        frontMarkAnchor: { roleId: "frontLeft", markName: "casingFold", point: "end" as const },
      },
    ]);
  }
  if (rawOptions[TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY] !== 1) return TROUSER_POMS;
  return TROUSER_POMS.map((pom) => pom.label !== "Waist (finished)" ? pom : {
    ...pom,
    measure: (b: Block) => {
      const mark = postPleatWaistMark(b);
      return 4 * (mark ? distance(mark.start, mark.end) : seam(front(b), "waist"));
    },
    anchor: (b: Block) => {
      const mark = postPleatWaistMark(b);
      return mark?.end ?? edgeEnd(pieceEdge(front(b), "waist"));
    },
    frontMarkAnchor: { roleId: "frontLeft", markName: "frontWaistAfterPleat", point: "end" as const },
  });
}

/** Quarter-waist size ordering follows an authored post-fold or casing
 * reference when available; other Trouser profiles remain edge based. */
export function trouserWaistSizeMetric(b: Block): number {
  const casingMark = front(b).marks?.find((candidate) => candidate.name === "casingStitchGuide");
  if (casingMark && "start" in casingMark) return distance(casingMark.start, casingMark.end);
  const mark = postPleatWaistMark(b);
  return mark ? distance(mark.start, mark.end) : edgeLength(pieceEdge(front(b), "waist"));
}

/** V1 woven-trouser bill of materials and ordered operations. Quantities and
 * hardware remain provisional until a physical/material sample exists. */
export const TROUSER_TECH_PACK: TechPack = {
  bom: [
    { material: "Midweight woven fabric", placement: "Four leg panels, waistband & pocket bags", qty: "1.8 m" },
    { material: "Lightweight fusible interfacing", placement: "Waistband & fly shield", qty: "0.25 m" },
    { material: "Trouser zipper", placement: "Front fly", qty: "1" },
    { material: "Hook-and-bar fastening", placement: "Waistband", qty: "1 set" },
    { material: "All-purpose sewing thread", placement: "All seams and topstitching", qty: "1 spool" },
  ],
  construction: [
    "Fuse the waistband and fly-support areas according to the selected woven fabric instructions.",
    "Sew each pocket bag to its marked front opening; turn, press, and secure the bag edge inside the front panel.",
    "Join each front leg to its matching back leg at the side seam, matching the side balance notches.",
    "Sew the front and back inseams, then close the centre-back seam between the two back panels.",
    "Install the zipper behind the marked front fly and secure the fly shield and waistband fastening.",
    "Join the separate waistband to the four-leg waist perimeter, matching centre and closure marks.",
    "Press the seams, turn up the deeper hem allowance, and inspect the pocket openings and waistband ends.",
  ],
};

/** Add explicit digital pleat details only for the R06 profile. */
export function trouserTechPackForOptions(options: Partial<TrouserOptions>): TechPack {
  if (options[TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY] === 1) {
    const depth = options.casingDepthCm ?? 4;
    return {
      bom: [
        { material: "Woven fabric", placement: "Four leg panels and pocket bags", qty: "Unspecified" },
        { material: "Elastic (unspecified)", placement: "Waist casing; width, length, material and compatibility not specified", qty: "Unspecified" },
        { material: "Sewing thread (unspecified)", placement: "Construction seams", qty: "Unspecified" },
      ],
      constructionNotice: "Digital pull-on casing construction guide only. Elastic specification and physical pull-on fit are not established.",
      construction: [
        "Cut the four Trouser leg panels with their integrated digital casing extensions; no separate waistband or fly piece is included.",
        `The digital casing depth is ${depth} cm with a product-selected fixed 0.6 cm turn-under guide. These software dimensions are not a universal sewing standard.`,
        "Fold at the casingFold guide and use the casingStitchGuide as the digital gather-to waist reference; no physical fold or stitched result is simulated.",
        "Elastic width, length, material, channel compatibility and quantity remain unspecified; no elastic cut length is calculated.",
        "Sew each pocket bag to its matching front opening, then join the front and back panels at the side and inseam interfaces and close the centre-back seam.",
        "Review the digital opening-before-gathering and gather-to reference values; no physical pass-over, fit, comfort, wear, grading or production result is established.",
      ],
    };
  }
  if (options[TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY] !== 1) return TROUSER_TECH_PACK;
  const intake = options.frontPleatIntakeCm ?? 4;
  const offset = options.frontPleatOffsetCm ?? 6;
  const depth = options.frontPleatStitchDepthCm ?? 8;
  return {
    ...TROUSER_TECH_PACK,
    constructionNotice: "Digital pleat construction guide only. Fabric response, stitched behavior, and physical fit have not been validated.",
    construction: [
      ...TROUSER_TECH_PACK.construction,
      `On each front panel, the digital knife-pleat intake is ${intake} cm at ${offset} cm from centre front, with an ${depth} cm stitch-down guide; fold toward the pocket.`,
      "The waist measurement is the post-fold digital reference; the cut pattern adds the selected intake. Verify the pleat on a sewn sample before production use.",
    ],
  };
}
