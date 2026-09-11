// A garment recipe: everything that is specific to ONE garment, in one object.
//
// This is the seam between engine and recipe made explicit. The engine (grading,
// POM, checker, render, export, UI) takes a GarmentRecipe and works — it never
// mentions "t-shirt" again. Adding a garment means adding a recipe here, not
// touching any engine file.

import { Measurements } from "./measurements";
import { StretchFabric } from "./ease";
import { Block } from "./block";
import { CheckResult } from "../guidance/check";
import { Note } from "../guidance/note";
import { sleevedTopPanelChecks, frontHemWidth } from "./tshirt-checks";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { draftSkirt, skirtPanelChecks, skirtGuidance, SKIRT_GRADE, SKIRT_POMS, SKIRT_NOTCHES } from "./skirt";
import { StyleDef, TEE_STYLES, SKIRT_STYLES, TANK_STYLES } from "../style";
import { AllowanceSpec } from "./allowance";
import { Pom } from "./pom";
import { GradeRule, SizeStep } from "./grading";
import { PieceNotches } from "./tshirt-notches";
import { draftTshirt } from "./tshirt";
import { draftFitted } from "./fitted";
import { draftTank, tankGuidance, TANK_NOTCHES, TANK_POMS, tankFrontNeckline, tankBackNeckline } from "./tank";
import { NecklineParams, NECKLINE_DEFAULT } from "./neckline";
import { TSHIRT_NOTCHES } from "./tshirt-notches";
import { TSHIRT_POMS } from "./tshirt-pom";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS } from "./fitted-tables";

/**
 * How a garment declares its production-readiness checks, so the checker never
 * names a seam itself:
 *  - sewabilityChecks: the garment-specific seam/cap/hem/dart checks (a skirt
 *    supplies waist/hem checks; a tee supplies shoulder/side/sleeve/cap). Returns
 *    a flat list the checker folds into its verdict.
 *  - sizeMetric: the single width the size-run check orders by — front hem for a
 *    top, but a garment defines its own.
 */

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
  readonly fields: readonly (keyof Measurements)[]; // which measurements this garment uses (drives the UI, in order)
  readonly styles: readonly StyleDef[];             // the target-fit presets this garment offers
  readonly draft: (m: Measurements) => Block;
  readonly notches: readonly PieceNotches[];
  readonly poms: readonly Pom[];
  readonly grade: GradeRule;
  readonly sizes: readonly SizeStep[];
  readonly checks: (block: Block, m: Measurements) => CheckResult[]; // sewability
  readonly guidance: (block: Block, m: Measurements) => Note[];      // advisory notes
  readonly sizeMetric: (block: Block) => number;                     // size-run ordering
  readonly techPack: TechPack;
  /** Optional material variant selected from the live fabric family. */
  readonly techPackForFabric?: (fabric: StretchFabric) => TechPack;
  readonly allowances: AllowanceSpec;
  // Slice 61: the neckline shape this garment ACTUALLY drafts, so the body and
  // garment preview views can draw the real curve (necklineEdge()) instead of
  // a placeholder that's never synced to it. Optional — only the top-shaped
  // garments (tee/fitted/tank) carry one; the skirt has no neckline at all,
  // and `render/body.ts`/`render/garment.ts` both default to `NECKLINE_DEFAULT`
  // when it's absent, so leaving it off a garment is inert, not a gap.
  // Functions of `Measurements`, not fixed values (Slice 63) — the tank's
  // front depends on `m.neckDrop`, a real user-adjustable measurement now,
  // not a hardcoded recipe constant. tee/fitted's just ignore `m`.
  readonly frontNeckline?: (m: Measurements) => NecklineParams;
  readonly backNeckline?: (m: Measurements) => NecklineParams;
  // Slice 63: a sleeveless garment's real strap position (`m.strapWidth`),
  // so body/garment preview views draw the real strap instead of the full
  // sleeved shoulder point. Optional — only sleeveless garments (the tank)
  // carry one; absent means "use the sleeved shoulder point," same
  // optional-is-inert convention as frontNeckline/backNeckline above.
  readonly strapWidth?: (m: Measurements) => number;
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
  fields: ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"],
  styles: TEE_STYLES,
  draft: draftTshirt,
  notches: TSHIRT_NOTCHES,
  poms: TSHIRT_POMS,
  grade: TSHIRT_GRADE,
  sizes: TSHIRT_SIZES,
  checks: sleevedTopPanelChecks(true),
  guidance: sleevedTopGuidance,
  sizeMetric: frontHemWidth,
  allowances: KNIT_ALLOWANCES,
  // draftTshirt calls bodice() with no necklineParams on either panel, so both
  // default to NECKLINE_DEFAULT (crew) — declared explicitly here rather than
  // left implicit, matching what the draft actually does.
  frontNeckline: () => NECKLINE_DEFAULT,
  backNeckline: () => NECKLINE_DEFAULT,
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
  fields: ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"],
  styles: TEE_STYLES,
  draft: draftFitted,
  notches: FITTED_NOTCHES,
  poms: FITTED_POMS,
  grade: TSHIRT_GRADE, // the same body grade drives both garments
  sizes: TSHIRT_SIZES,
  checks: sleevedTopPanelChecks(false),
  guidance: sleevedTopGuidance,
  sizeMetric: frontHemWidth,
  allowances: KNIT_ALLOWANCES,
  // draftFitted, like draftTshirt, defaults both panels to NECKLINE_DEFAULT.
  frontNeckline: () => NECKLINE_DEFAULT,
  backNeckline: () => NECKLINE_DEFAULT,
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

const TANK_KNIT_TECH_PACK: TechPack = {
  bom: KNIT_BOM,
  construction: [
    "Staystitch the front and back necklines.",
    "Join the shoulder seams, front to back.",
    "Bind the neckline and both armholes with self-fabric or rib binding.",
    "Close the side seams.",
    "Hem the body.",
  ],
};

export const TANK: GarmentRecipe = {
  name: "tank",
  label: "Tank",
  fields: ["chest", "shoulderWidth", "length", "armholeDepth", "strapWidth", "neckDrop", "neckWidthEase", "ease"],
  styles: TANK_STYLES,
  draft: draftTank,
  notches: TANK_NOTCHES,
  poms: TANK_POMS,
  grade: TSHIRT_GRADE, // the same body grade drives every upper-body garment
  sizes: TSHIRT_SIZES,
  checks: sleevedTopPanelChecks(true), // NOT sleeve-specific — a hem-square check, reused verbatim
  guidance: tankGuidance,
  sizeMetric: frontHemWidth,
  allowances: KNIT_ALLOWANCES,
  // The EXACT same live neckline functions draftTank() passes to bodice() —
  // imported, not re-typed, so these can't drift from what's really drafted. The back
  // isn't NECKLINE_DEFAULT any more (Slice 62): it carries the same
  // widthEase as the front, so the shoulder seam still matches — see
  // TANK_BACK_NECKLINE's own comment in tank.ts.
  frontNeckline: tankFrontNeckline,
  backNeckline: tankBackNeckline,
  strapWidth: (m) => m.strapWidth,
  techPack: TANK_KNIT_TECH_PACK,
  techPackForFabric: (fabric) => fabric.family === "woven"
    ? {
        bom: [
          { material: "Cotton woven, main", placement: "Front & back panels", qty: "1.2 m" },
          { material: "Self-fabric binding", placement: "Neckline & armholes", qty: "0.2 m" },
          { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
          { material: "Care/content label", placement: "Left side seam", qty: "1" },
          { material: "All-purpose thread", placement: "All seams", qty: "1 spool" },
        ],
        construction: [
          "Staystitch the front and back necklines.",
          "Join the shoulder seams, front to back.",
          "Bind the neckline and both armholes with self-fabric binding.",
          "Close the side seams.",
          "Hem the body.",
        ],
      }
    : TANK_KNIT_TECH_PACK,
};

// A woven skirt: deeper hem, a fold at each panel centre, a little at the waist
// for the band. Structurally unrelated to the knit tee's allowances.
// Phase B5 (Slice 57): the waistband is a real piece now — "fold" (its own
// cut-on-fold edge) gets nothing, same reasoning as "center"; "seam" (where
// it sews to the body) gets the same 1 cm the panels' own "waist" edge does.
const WOVEN_SKIRT_ALLOWANCES: AllowanceSpec = {
  default: 1.5,
  byEdge: {
    center: 0, // fold
    hem: 3,    // deep skirt turn-up
    waist: 1,  // waistband seam
    fold: 0,   // waistband's own fold
    seam: 1,   // waistband-to-body seam
  },
};

const WOVEN_SKIRT_BOM: readonly BomRow[] = [
  { material: "Cotton twill, main", placement: "Front & back panels", qty: "0.9 m" },
  { material: "Fusible interfacing", placement: "Waistband", qty: "0.2 m" },
  { material: "Invisible zip", placement: "Centre-back seam", qty: "1" },
  { material: "Hook & bar", placement: "Waistband", qty: "1" },
  { material: "All-purpose thread", placement: "All seams", qty: "1 spool" },
];

export const SKIRT: GarmentRecipe = {
  name: "skirt",
  label: "Skirt",
  fields: ["waist", "hip", "hipDepth", "length", "ease"],
  styles: SKIRT_STYLES,
  draft: draftSkirt,
  notches: SKIRT_NOTCHES,
  poms: SKIRT_POMS,
  grade: SKIRT_GRADE,
  sizes: TSHIRT_SIZES, // the same size run drives every garment
  checks: skirtPanelChecks,
  guidance: skirtGuidance,
  sizeMetric: frontHemWidth, // the front hem grows with the hip → orders the run
  allowances: WOVEN_SKIRT_ALLOWANCES,
  techPack: {
    bom: WOVEN_SKIRT_BOM,
    construction: [
      "Overlock the panel edges that will be exposed.",
      "Sew the side seams, front to back, matching the balance notches.",
      "Insert the invisible zip in the centre-back seam.",
      "Attach the interfaced waistband, easing the waist to fit.",
      "Turn up and hem the skirt.",
    ],
  },
};

export const GARMENTS: readonly GarmentRecipe[] = [TEE, FITTED, TANK, SKIRT];

/** Look a recipe up by its stable id; falls back to the tee. */
export function garmentByName(name: string): GarmentRecipe {
  return GARMENTS.find((g) => g.name === name) ?? TEE;
}
