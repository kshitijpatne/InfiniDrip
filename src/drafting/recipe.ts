// A garment recipe: everything that is specific to ONE garment, in one object.
//
// This is the seam between engine and recipe made explicit. The engine (grading,
// POM, checker, render, export, UI) takes a GarmentRecipe and works — it never
// mentions "t-shirt" again. Adding a garment means adding a recipe here, not
// touching any engine file.

import { Measurements } from "./measurements";
import { Block } from "./block";
import { AllowanceSpec } from "./allowance";
import { Pom } from "./pom";
import { GradeRule, SizeStep } from "./grading";
import { PieceNotches } from "./tshirt-notches";
import { draftTshirt } from "./tshirt";
import { draftFitted } from "./fitted";
import { TSHIRT_NOTCHES } from "./tshirt-notches";
import { TSHIRT_POMS } from "./tshirt-pom";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS } from "./fitted-tables";

/**
 * The garment facts the production-readiness checker needs, which it cannot
 * infer from geometry alone.
 *  - frontSideEdges: the front edge(s) that together make the side seam. A darted
 *    front splits its side around the dart mouth, so it names two.
 *  - hemSquareToFold: only a *trued* hem meets the fold at a right angle. An
 *    untrued darted front slants at the side by design, so it opts out.
 */
export interface CheckSpec {
  readonly frontSideEdges: readonly string[];
  readonly hemSquareToFold: boolean;
}

/**
 * Tech-pack scaffolding: the bill of materials and construction notes a maker
 * needs but the geometry can't produce. This is deliberately *user-owned* data,
 * not a derived value — the app carries a sensible default per garment and the
 * tech-pack document renders whatever the recipe holds. (In-app editing of these
 * is a later slice; here they're edit-as-data on the recipe.)
 */
export interface BomRow {
  readonly material: string;
  readonly placement: string;
  readonly qty: string;
}

export interface TechPack {
  readonly bom: readonly BomRow[];
  readonly construction: readonly string[]; // ordered sew steps
}

export interface GarmentRecipe {
  readonly name: string;  // stable id, e.g. "tee"
  readonly label: string; // what the UI shows, e.g. "Tee"
  readonly draft: (m: Measurements) => Block;
  readonly notches: readonly PieceNotches[];
  readonly poms: readonly Pom[];
  readonly grade: GradeRule;
  readonly sizes: readonly SizeStep[];
  readonly checks: CheckSpec;
  readonly techPack: TechPack;
  readonly allowances: AllowanceSpec;
}

/**
 * The knit-tee cutting allowances, shared by tee and fitted.
 * A fold gets NOTHING — the pattern edge lies on the fabric fold, so any
 * allowance there would make the finished garment wider than the spec sheet says.
 * Hems turn up deep; a knit neckline takes a narrow band.
 */
const KNIT_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    centerFront: 0, // fold
    centerBack: 0,  // fold
    hem: 2,         // body + sleeve turn-up
    neckline: 0.6,  // narrow, for the rib band
  },
};

/** The knit-tee scaffolding, shared by both tee and fitted (same materials). */
const KNIT_BOM: readonly BomRow[] = [
  { material: "Cotton jersey, main", placement: "Body & sleeves", qty: "1.2 m" },
  { material: "Rib knit", placement: "Neckband", qty: "0.1 m" },
  { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
  { material: "Care/content label", placement: "Left side seam", qty: "1" },
  { material: "Overlock thread", placement: "All seams", qty: "1 cone" },
];

export const TEE: GarmentRecipe = {
  name: "tee",
  label: "Tee",
  draft: draftTshirt,
  notches: TSHIRT_NOTCHES,
  poms: TSHIRT_POMS,
  grade: TSHIRT_GRADE,
  sizes: TSHIRT_SIZES,
  checks: { frontSideEdges: ["side"], hemSquareToFold: true },
  allowances: KNIT_ALLOWANCES,
  techPack: {
    bom: KNIT_BOM,
    construction: [
      "Staystitch the front and back necklines.",
      "Join the shoulder seams, front to back.",
      "Attach the neckband, matching centre-front and shoulder notches.",
      "Set in the sleeves flat, easing the cap to the armhole.",
      "Close the side and underarm seams in one pass.",
      "Hem the sleeves and the body.",
    ],
  },
};

export const FITTED: GarmentRecipe = {
  name: "fitted",
  label: "Fitted",
  draft: draftFitted,
  notches: FITTED_NOTCHES,
  poms: FITTED_POMS,
  grade: TSHIRT_GRADE, // the same body grade drives both garments
  sizes: TSHIRT_SIZES,
  checks: { frontSideEdges: ["sideUpper", "sideLower"], hemSquareToFold: false },
  allowances: KNIT_ALLOWANCES,
  techPack: {
    bom: KNIT_BOM,
    construction: [
      "Staystitch the front and back necklines.",
      "Sew the bust darts; press them toward the hem.",
      "Join the shoulder seams, front to back.",
      "Attach the neckband, matching centre-front and shoulder notches.",
      "Set in the sleeves flat, easing the cap to the armhole.",
      "Close the side and underarm seams in one pass.",
      "Hem the sleeves and the body.",
    ],
  },
};

export const GARMENTS: readonly GarmentRecipe[] = [TEE, FITTED];

/** Look a recipe up by its stable id; falls back to the tee. */
export function garmentByName(name: string): GarmentRecipe {
  return GARMENTS.find((g) => g.name === name) ?? TEE;
}
