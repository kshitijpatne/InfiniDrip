// A garment recipe: everything that is specific to ONE garment, in one object.
//
// This is the seam between engine and recipe made explicit. The engine (grading,
// POM, checker, render, export, UI) takes a GarmentRecipe and works — it never
// mentions "t-shirt" again. Adding a garment means adding a recipe here, not
// touching any engine file.

import { Measurements } from "./measurements";
import { StretchFabric } from "./ease";
import { Block, blockPieces } from "./block";
import { CheckResult } from "../guidance/check";
import { Note } from "../guidance/note";
import { sleevedTopPanelChecks, frontHemWidth } from "./tshirt-checks";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { draftSkirt, SKIRT_GRAMMAR, skirtPanelChecks, skirtGuidance, SKIRT_GRADE, SKIRT_POMS, SKIRT_NOTCHES } from "./skirt";
import { StyleDef, TEE_STYLES, FITTED_STYLES, SKIRT_STYLES, TANK_STYLES, POLO_STYLES, WOVEN_SHIRT_STYLES, TROUSER_STYLES, SHORTS_STYLES, JEANS_STYLES } from "../style";
import { allowanceFor, type AllowanceSpec } from "./allowance";
import { Pom } from "./pom";
import { draftAtSize, gradeRun, type GradeOptionResolver, type GradeRule, type SizeStep } from "./grading";
import { PieceNotches } from "./tshirt-notches";
import { TEE_SELECTED_SIZE_NECKBAND_OUTPUT_OPTION, TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION } from "./vneck-band-output";
import {
  draftTshirt,
  TEE_GRAMMAR,
  TEE_NECKBAND_OPTIONS,
  hasConflictingTeeNecklineOptions,
  hasTeeNecklineOverride,
  isTeeScoopNeckActive,
  isTeeVNeckActive,
  teeFrontNecklineParams,
  teeNecklineNotes,
  TEE_SCOOP_NECK_DROP_OPTION_ID,
  TEE_V_NECK_DROP_OPTION_ID,
} from "./tshirt";
import { draftFitted, FITTED_GRAMMAR, FITTED_OPTIONS, FITTED_PRINCESS_PHYSICAL_ROLES,
  usesFittedPrincessSeam, fittedGuidance } from "./fitted";
import { draftTank, TANK_GRAMMAR, tankGuidance, TANK_NOTCHES, TANK_POMS, tankFrontNeckline, tankBackNeckline } from "./tank";
import { NecklineParams, NECKLINE_DEFAULT } from "./neckline";
import { TSHIRT_NOTCHES } from "./tshirt-notches";
import { TEE_POMS } from "./tshirt-pom";
import {
  draftRaglanTshirt,
  raglanTeeGuidance,
  TEE_RAGLAN_GRAMMAR,
  TEE_RAGLAN_NOTCHES,
  TEE_RAGLAN_PANEL_CHECKS,
  TEE_RAGLAN_POMS,
} from "./tshirt-raglan";
import type { TeeConstruction } from "./tshirt";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS, FITTED_PRINCESS_POMS, fittedPanelChecks } from "./fitted-tables";
import { GarmentOption, GarmentOptions } from "./options";
import { draftPolo, POLO_GRAMMAR, poloGuidance, POLO_ALLOWANCES, POLO_NOTCHES, POLO_OPTION_DEFINITIONS, POLO_POMS, POLO_BODY_POMS, resolvePoloOptions } from "./polo";
import { draftWovenShirt, WOVEN_SHIRT_GRAMMAR, wovenShirtGuidance, WOVEN_SHIRT_ALLOWANCES, WOVEN_SHIRT_GRADE, WOVEN_SHIRT_NOTCHES, WOVEN_SHIRT_POMS } from "./shirt";
import { WOVEN_SHIRT_FIELDS, WOVEN_SHIRT_OPTION_DEFINITIONS } from "./shirt-contract";
import { edgeLength, pieceEdge } from "./piece";
import { rolePiece } from "./block";
import {
  draftTrouserWithPockets,
  TROUSER_GRAMMAR,
  TROUSER_ALLOWANCES,
  TROUSER_NOTCHES,
} from "./trouser";
import {
  TROUSER_FIELDS,
  TROUSER_OPTION_DEFINITIONS,
  TrouserOptions,
} from "./trouser-contract";
import {
  TROUSER_GRADE,
  TROUSER_POMS,
  TROUSER_SIZES,
  TROUSER_TECH_PACK,
} from "./trouser-tables";
import { trouserGuidance } from "./trouser-guidance";
import { draftShortsWithComponents, SHORTS_GRAMMAR, shortsComponentGuidance } from "./shorts-components";
import type { ShortsOptions } from "./shorts-contract";
import { SHORTS_FIELDS, SHORTS_OPTION_DEFINITIONS } from "./shorts-contract";
import {
  SHORTS_ALLOWANCES,
  SHORTS_GRADE,
  SHORTS_NOTCHES,
  SHORTS_POMS,
  SHORTS_SIZES,
  SHORTS_TECH_PACK,
} from "./shorts-tables";
import type { GarmentGrammar } from "./grammar";
import { draftCrewneck, CREWNECK_GRAMMAR } from "./crewneck";
import { resolveCrewneckOptionsForSize } from "./crewneck-components";
import { CREWNECK_FIELDS, CREWNECK_OPTION_DEFINITIONS, CREWNECK_DEFAULT_OPTIONS, CREWNECK_STYLES } from "./crewneck-contract";
import { CREWNECK_ALLOWANCES, CREWNECK_GRADE, CREWNECK_NOTCHES, CREWNECK_POMS, CREWNECK_SIZES, CREWNECK_TECH_PACK, crewneckGuidance } from "./crewneck-tables";
import { draftJogger, JOGGER_GRAMMAR } from "./jogger";
import type { JoggerOptions } from "./jogger-contract";
import { JOGGER_FIELDS, JOGGER_OPTION_DEFINITIONS, JOGGER_DEFAULT_OPTIONS, JOGGER_STYLES } from "./jogger-contract";
import { JOGGER_ALLOWANCES, JOGGER_GRADE, JOGGER_NOTCHES, JOGGER_POMS, JOGGER_SIZES, JOGGER_TECH_PACK, joggerTechPackForOptions } from "./jogger-tables";
import { joggerGuidance } from "./jogger-guidance";
import { draftHoodie, HOODIE_GRAMMAR } from "./hoodie";
import type { HoodieOptions } from "./hoodie-contract";
import {
  HOODIE_FIELDS,
  HOODIE_OPTION_DEFINITIONS,
  HOODIE_DEFAULT_OPTIONS,
  HOODIE_STYLES,
  resolveHoodieOptions,
} from "./hoodie-contract";
import {
  HOODIE_ALLOWANCES,
  HOODIE_GRADE,
  HOODIE_NOTCHES,
  HOODIE_POMS,
  HOODIE_SIZES,
  HOODIE_TECH_PACK,
  hoodieTechPackForOptions,
  resolveHoodieOptionsForSize,
} from "./hoodie-tables";
import { hoodieGuidance } from "./hoodie-guidance";
import { draftJeansCore, JEANS_GRAMMAR } from "./jeans";
import { JEANS_FIELDS, JEANS_OPTION_DEFINITIONS, type JeansOptions } from "./jeans-contract";
import { draftJeansWithGuidance, reviewJeansDraft } from "./jeans-guidance";
import { JEANS_ALLOWANCES, JEANS_GRADE, JEANS_NOTCHES, JEANS_POMS, JEANS_SIZES, JEANS_TECH_PACK } from "./jeans-tables";

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
  /** Optional limitation note rendered immediately before construction steps. */
  readonly constructionNotice?: string;
}

/** A recipe may preflight inputs and withhold its block when relationships or
 * construction geometry cannot be represented safely. */
export interface RecipeDraftReview {
  readonly block: Block | null;
  readonly notes: readonly Note[];
}

export interface GarmentRecipe {
  readonly name: string;  // stable id, e.g. "tee"
  readonly label: string; // what the UI shows, e.g. "Tee"
  /** Body region used by application presentation routing. */
  readonly region?: "upper" | "lower";
  /** Role used by the exploratory Edit view; defaults to the conventional "front". */
  readonly editRole?: string;
  /** Permit a whole-piece multi-page A0 export when the true-scale layout overflows one sheet. */
  readonly a0Overflow?: boolean;
  /** Use page-local coordinates for the tiled PDF; legacy recipes keep their byte-identity path. */
  readonly tiledPdfLocalCoordinates?: boolean;
  readonly fields: readonly (keyof Measurements)[]; // which measurements this garment uses (drives the UI, in order)
  readonly styles: readonly StyleDef[];             // the target-fit presets this garment offers
  readonly draft: (m: Measurements, options?: GarmentOptions) => Block;
  /** Optional fail-closed draft review for recipes with cross-field geometry constraints. */
  readonly draftReview?: (m: Measurements, options?: GarmentOptions) => RecipeDraftReview;
  readonly notches: readonly PieceNotches[];
  /** Optional option-aware construction marks for recipes with alternate panel roles. */
  readonly notchesForOptions?: (options: GarmentOptions) => readonly PieceNotches[];
  readonly poms: readonly Pom[];
  /** Optional option-aware POM set for construction-specific digital output. */
  readonly pomsForOptions?: (options: GarmentOptions) => readonly Pom[];
  /** Optional option-aware counts for marker and nesting shape instances. */
  readonly pieceQuantitiesForOptions?: (options: GarmentOptions) => Readonly<Record<string, number>> | undefined;
  readonly grade: GradeRule;
  readonly sizes: readonly SizeStep[];
  readonly checks: (block: Block, m: Measurements) => CheckResult[]; // sewability
  readonly guidance: (block: Block, m: Measurements, options?: GarmentOptions) => Note[]; // advisory notes
  readonly sizeMetric: (block: Block) => number;                     // size-run ordering
  readonly techPack: TechPack;
  /** Recipe-owned design controls; absent means this garment has no such options. */
  readonly options?: readonly GarmentOption[];
  /** Derive non-base-size numeric options from the explicit base inputs. */
  readonly resolveOptionsForSize?: GradeOptionResolver;
  /** Option-aware production notes/BOM; absent keeps the static tech pack. */
  readonly techPackForOptions?: (this: GarmentRecipe, options: GarmentOptions) => TechPack;
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
  readonly frontNeckline?: (m: Measurements, options?: GarmentOptions) => NecklineParams;
  readonly backNeckline?: (m: Measurements) => NecklineParams;
  // Slice 63: a sleeveless garment's real strap position (`m.strapWidth`),
  // so body/garment preview views draw the real strap instead of the full
  // sleeved shoulder point. Optional — only sleeveless garments (the tank)
  // carry one; absent means "use the sleeved shoulder point," same
  // optional-is-inert convention as frontNeckline/backNeckline above.
  readonly strapWidth?: (m: Measurements) => number;
  /** The declarative component graph behind this recipe, when migrated. */
  readonly grammar?: GarmentGrammar;
}

/** Resolve the active POM contract while preserving each recipe's legacy default. */
export function pomsForRecipeOptions(recipe: GarmentRecipe, options: GarmentOptions = {}): readonly Pom[] {
  return recipe.pomsForOptions?.(options) ?? recipe.poms;
}

/** Resolve construction marks for the active option-selected panel topology. */
export function notchesForRecipeOptions(recipe: GarmentRecipe, options: GarmentOptions = {}): readonly PieceNotches[] {
  return recipe.notchesForOptions?.(options) ?? recipe.notches;
}

/** Expand only declared physical cut quantities; all other recipes keep one
 * marker shape per drafted role. Copies retain the exact authored geometry. */
export function piecesForRecipeBlock(
  recipe: GarmentRecipe,
  block: Block,
  options: GarmentOptions = {},
) {
  const quantities = recipe.pieceQuantitiesForOptions?.(options);
  if (quantities === undefined) return blockPieces(block);
  for (const [roleId, quantity] of Object.entries(quantities)) {
    if (!block.roles[roleId]) throw new RangeError(`Declared cut quantity references missing role "${roleId}".`);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new RangeError(`Cut quantity for role "${roleId}" must be a positive safe integer.`);
    }
  }
  return Object.entries(block.roles).flatMap(([roleId, piece]) => {
    const quantity = quantities[roleId] ?? 1;
    if (quantity === 1) return [piece];
    return Array.from({ length: quantity }, (_, index) => ({
      ...piece,
      name: `${piece.name} (${index + 1} of ${quantity})`,
    }));
  });
}

/** Draft one registered recipe size through its optional recipe-owned resolver. */
export function draftRecipeAtSize(
  recipe: GarmentRecipe,
  base: Measurements,
  step: number,
  options: GarmentOptions = {},
): Block {
  return draftAtSize(base, recipe.grade, step, recipe.draft, options, recipe.resolveOptionsForSize);
}

/** Draft a registered recipe's whole size run through one shared resolver. */
export function gradeRecipeRun(
  recipe: GarmentRecipe,
  base: Measurements,
  sizes: readonly SizeStep[] = recipe.sizes,
  options: GarmentOptions = {},
): ReturnType<typeof gradeRun> {
  return gradeRun(base, recipe.grade, sizes, recipe.draft, options, recipe.resolveOptionsForSize);
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
    princessUpper: 1,
    princessLower: 1,
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

const TEE_BOM: readonly BomRow[] = [
  ...KNIT_BOM,
  { material: "Knit-compatible stabilizing tape", placement: "Shoulder seams", qty: "2 lengths" },
];

export const TEE: GarmentRecipe = {
  name: "tee",
  label: "Tee",
  fields: ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"],
  styles: TEE_STYLES,
  draft: (m, options = {}) => draftTshirt(m, options),
  grammar: TEE_GRAMMAR,
  notches: TSHIRT_NOTCHES,
  poms: TEE_POMS,
  grade: TSHIRT_GRADE,
  sizes: TSHIRT_SIZES,
  checks: sleevedTopPanelChecks(true),
  options: [
    {
      id: "chestEase",
      label: "Classic chest ease",
      unit: "cm",
      group: "Fit allowance",
      help: "Optional Classic Tee chest-only draft allowance. It starts from the shared fit allowance; when enabled, it must be 7–12 cm. This software range is not a validated fit specification.",
      defaultValue: 10,
      min: 7,
      max: 12,
      step: 0.5,
      optional: true,
      fallbackMeasurement: "ease",
      appliesToStyle: "Classic tee",
    },
    {
      id: TEE_V_NECK_DROP_OPTION_ID,
      label: "Front V-neck drop",
      unit: "cm",
      group: "Neckline",
      help: "Sets the additional front V depth. This 0–15 cm software range is not a fit specification; reduce the V drop or review armhole depth when guidance appears.",
      defaultValue: 5,
      min: 0,
      max: 15,
      step: 0.5,
      optional: true,
      optionalSetLabel: "Use V neckline",
      optionalResetLabel: "Use crew neckline",
      optionalSetStatus: "V neckline active only while Scoop is inactive. Additional front drop: {value} {unit}.",
      optionalUnsetStatus: "V option inactive; crew remains unless another Tee neckline is active.",
    },
    {
      id: TEE_SCOOP_NECK_DROP_OPTION_ID,
      label: "Front Scoop extra depth",
      unit: "cm",
      group: "Neckline",
      help: "Adds depth to the existing rounded front neckline. The 0–15 cm range and 5 cm default are software choices, not fit guidance; reduce the extra depth or review armhole depth when guidance appears.",
      defaultValue: 5,
      min: 0,
      max: 15,
      step: 0.5,
      optional: true,
      optionalSetLabel: "Use Scoop neckline",
      optionalResetLabel: "Use crew neckline",
      optionalSetStatus: "Rounded Scoop active only while V is inactive. Additional front drop: {value} {unit}.",
      optionalUnsetStatus: "Scoop option inactive; crew remains unless another Tee neckline is active.",
    },
  ],
  guidance: (block, m, options = {}) => [...sleevedTopGuidance(block, m), ...teeNecklineNotes(m, options)],
  sizeMetric: frontHemWidth,
  allowances: KNIT_ALLOWANCES,
  // The optional Tee neckline option selects one front shape; absent options
  // keep crew. The back never consumes a front neckline option.
  frontNeckline: (_m, options = {}) => teeFrontNecklineParams(options),
  backNeckline: () => NECKLINE_DEFAULT,
  techPack: {
    bom: TEE_BOM,
    construction: [
      "Staystitch the front and back necklines.",
      "Test the knit-compatible stabilizing tape on a fabric offcut and cut two lengths to match the drafted shoulder seams.",
      "Join the shoulder seams, front to back, stabilizing each seam with the tape during sewing.",
      "Attach the neckband, matching centre-front and shoulder notches.",
      "Set in the sleeves flat, easing the cap to the armhole.",
      "Close the side and underarm seams in one pass.",
      "Hem the sleeves and the body.",
    ],
  },
  techPackForOptions: function (this: GarmentRecipe, options) {
    if (hasConflictingTeeNecklineOptions(options)) {
      return {
        bom: this.techPack.bom.filter((row) => row.placement !== "Neckband"),
        constructionNotice: "Both V and Scoop neckline options are active. Reset one before generating neckline finishing output; no neckband geometry, cut template, or sewing steps are provided while they conflict.",
        construction: this.techPack.construction.filter((step) => !step.startsWith("Attach the neckband")),
      };
    }
    if (!isTeeVNeckActive(options)) return this.techPack;
    const withoutNeckband = this.techPack.construction.filter((step) => !step.startsWith("Attach the neckband"));
    if (options[TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION] !== 1) {
      return {
        bom: this.techPack.bom.filter((row) => row.placement !== "Neckband"),
        constructionNotice: "V-band output is available only in the selected-size V-band Tech Pack; whole-run Tech Packs do not include graded-size V-band instructions or pattern output.",
        construction: withoutNeckband,
      };
    }
    const lengthOption = TEE_NECKBAND_OPTIONS[0]!;
    const widthOption = TEE_NECKBAND_OPTIONS[1]!;
    const lengthPercent = options[lengthOption.id] ?? lengthOption.defaultValue;
    const finishedWidthCm = options[widthOption.id] ?? widthOption.defaultValue;
    const validLength = Number.isFinite(lengthPercent)
      && lengthPercent >= lengthOption.min
      && lengthPercent <= lengthOption.max
      && Math.abs((lengthPercent - lengthOption.min) / lengthOption.step
        - Math.round((lengthPercent - lengthOption.min) / lengthOption.step)) <= 1e-7;
    const validWidth = Number.isFinite(finishedWidthCm)
      && finishedWidthCm >= widthOption.min
      && finishedWidthCm <= widthOption.max
      && Math.abs((finishedWidthCm - widthOption.min) / widthOption.step
        - Math.round((finishedWidthCm - widthOption.min) / widthOption.step)) <= 1e-7;
    if (!validLength || !validWidth) {
      return {
        bom: this.techPack.bom.filter((row) => row.placement !== "Neckband"),
        constructionNotice: "V-band output is unavailable while its length or finished-width setting is invalid. Correct the Tee band settings before generating the selected-size V-band SVG and Tech Pack.",
        construction: withoutNeckband,
      };
    }
    const necklineCm = options.teeVNecklineCircumferenceCm;
    const bandTargetCm = options.teeVNeckbandTargetLengthCm;
    const geometrySummary = Number.isFinite(necklineCm) && necklineCm! > 0
      && Number.isFinite(bandTargetCm) && bandTargetCm! > 0
      ? `Measured selected-size body neckline ${necklineCm!.toFixed(1)} cm; selected band target ${bandTargetCm!.toFixed(1)} cm at ${lengthPercent}% of that measured length.`
      : `Selected band target ${lengthPercent}% of the measured neckline; the selected-size SVG reports both measured neckline and target lengths.`;
    const vNeckConstruction = [
      "Mark and staystitch the front V point; clip to, but not through, the point stitching.",
      "Join the band ends at center front along the opposing V-forming seams shown in the separate selected-size band SVG.",
      "Match the band center-front to the garment V point, then align shoulder and center-back registration notches.",
      "Attach the band to the neckline, clipping only to the V-point stitching as needed; complete the seam around the neckline.",
    ];
    const attachIndex = this.techPack.construction.findIndex((step) => step.startsWith("Attach the neckband"));
    const construction = [
      ...this.techPack.construction.slice(0, attachIndex),
      ...vNeckConstruction,
      ...this.techPack.construction.slice(attachIndex + 1),
      `V-band settings: ${geometrySummary} Finished width ${finishedWidthCm.toFixed(1)} cm; these are product-software choices, not fabric or fit recommendations. The band SVG and these measurements apply to the selected size only; no graded-size band output is supplied.`,
    ];
    return {
      bom: [
        ...this.techPack.bom.filter((row) => row.placement !== "Neckband"),
        // The Fitted Tech Pack has a narrow Qty column; its construction retains the SVG reference.
        {
          material: "User-selected band material",
          placement: "Provisional V-neck band",
          qty: this.name === "fitted"
            ? "1 strip"
            : "1 strip; see selected-size V-band SVG",
        },
      ],
      constructionNotice: "Provisional digital V-band construction. Join geometry and allowances are product-software choices; physical fit, comfort, wear, fabric behavior and recovery are unvalidated.",
      construction,
    };
  },
};

const TEE_RAGLAN_TECH_PACK: TechPack = {
  bom: KNIT_BOM,
  constructionNotice: "Digital raglan construction candidate. Paired seam lengths and the selected-size neckline are software-derived; no sewn sample, physical fit, fabric performance, comfort, wear, validated grading, or production review is represented.",
  construction: [
    "Staystitch the body and sleeve neckline edges.",
    "Join the front body raglan seam to the front sleeve raglan seam, matching the single registration notch.",
    "Join the back body raglan seam to the back sleeve raglan seam, matching the double registration notch.",
    "Join the neckband short ends at center back; use the seam-length-derived band notches to align center front and all four body-to-sleeve raglan joins.",
    "Attach the selected-size neckband around the assembled body and sleeve neckline, matching the center-front, center-back, and sleeve-neck joins.",
    "Close each side-to-cuff path in one continuous pass from the body hem, through the joined side and sleeve underarm, to the sleeve cuff.",
    "Hem the sleeves and the body.",
  ],
};

/** T08 is a construction variant in the Tee root; the seven-root registry stays unchanged. */
export const TEE_RAGLAN: GarmentRecipe = {
  ...TEE,
  label: "Raglan Tee",
  draft: (m, options = {}) => draftRaglanTshirt(m, options),
  grammar: TEE_RAGLAN_GRAMMAR,
  notches: TEE_RAGLAN_NOTCHES,
  poms: TEE_RAGLAN_POMS,
  checks: TEE_RAGLAN_PANEL_CHECKS,
  guidance: (block, m, options = {}) => raglanTeeGuidance(block, m, options),
  options: TEE.options?.filter((option) =>
    option.id !== TEE_V_NECK_DROP_OPTION_ID && option.id !== TEE_SCOOP_NECK_DROP_OPTION_ID),
  frontNeckline: () => NECKLINE_DEFAULT,
  backNeckline: () => NECKLINE_DEFAULT,
  techPack: TEE_RAGLAN_TECH_PACK,
  techPackForOptions: function (this: GarmentRecipe, options) {
    return hasTeeNecklineOverride(options)
      ? {
          ...this.techPack,
          constructionNotice: `${this.techPack.constructionNotice ?? ""} Raglan is crew-neck only; saved V-neck or Scoop settings are inactive while this construction is selected.`,
        }
      : this.techPack;
  },
};

export const FITTED: GarmentRecipe = {
  name: "fitted",
  label: "Darted tee",
  region: "upper",
  editRole: "front",
  fields: ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"],
  styles: FITTED_STYLES,
  draft: draftFitted,
  grammar: FITTED_GRAMMAR,
  options: FITTED_OPTIONS,
  notches: FITTED_NOTCHES,
  notchesForOptions: (options) => {
    const princess = usesFittedPrincessSeam(options);
    return FITTED_NOTCHES.filter(({ pieceName }) => princess
      ? pieceName !== "fitted front"
      : pieceName !== "fitted front center" && pieceName !== "fitted side front (cut 2 mirrored)");
  },
  poms: FITTED_POMS,
  pomsForOptions: (options) => usesFittedPrincessSeam(options) ? FITTED_PRINCESS_POMS : FITTED_POMS,
  pieceQuantitiesForOptions: (options) => usesFittedPrincessSeam(options)
    ? Object.fromEntries(FITTED_PRINCESS_PHYSICAL_ROLES.map((role) => [role.id, role.quantity]))
    : undefined,
  grade: TSHIRT_GRADE, // the same body grade drives both garments
  sizes: TSHIRT_SIZES,
  checks: fittedPanelChecks,
  guidance: fittedGuidance,
  sizeMetric: frontHemWidth,
  allowances: KNIT_ALLOWANCES,
  // The entry-scoped F04 option selects the same straight-V geometry as Tee;
  // absent options keep the established Fitted crew neckline.
  frontNeckline: (_m, options = {}) => teeFrontNecklineParams(options),
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
  techPackForOptions: function (this: GarmentRecipe, options) {
    if (usesFittedPrincessSeam(options)) {
      return {
        ...this.techPack,
        constructionNotice: "F03 is a digital pattern construction. Cut quantity and modeled POMs describe the authored geometry only; material use, physical fit, comfort, wear, and production behavior are unvalidated.",
        construction: [
          "Cut 1 front-center piece on the fold, 2 side-front pieces as a mirrored pair, 1 back piece on the fold, and 2 sleeves.",
          "Staystitch the front and back necklines.",
          "Join each shoulder-origin princess seam from shoulder through the modeled apex to hem; true and press the seam toward the side front.",
          "Join the shoulder seams, matching the center-front and side-front shoulder sections to the back.",
          "Attach the neckband, matching centre-front and shoulder notches.",
          "Set in the sleeves flat, easing the cap to the armhole.",
          "Close the side and underarm seams in one pass.",
          "Hem the sleeves and the body.",
        ],
      };
    }
    const fittedTechPack = options.waistDartIntake === undefined
      ? this.techPack
      : {
          ...this.techPack,
          construction: [
            ...this.techPack.construction.slice(0, 2),
            "Sew the marked front waist dart by matching both legs to the apex; orient the sewn fold toward center front.",
            ...this.techPack.construction.slice(2),
          ],
        };
    if (hasConflictingTeeNecklineOptions(options)) {
      return TEE.techPackForOptions!.call({ ...this, techPack: fittedTechPack }, options);
    }
    if (isTeeScoopNeckActive(options)) {
      const withoutNeckband = fittedTechPack.construction.filter((step) => !step.startsWith("Attach the neckband"));
      const noBandBom = fittedTechPack.bom.filter((row) => row.placement !== "Neckband");
      if (options[TEE_SELECTED_SIZE_NECKBAND_OUTPUT_OPTION] !== 1) {
        return {
          ...fittedTechPack,
          bom: noBandBom,
          constructionNotice: "Fitted Scoop neckband output is available only for a selected size; whole-run Tech Packs do not include graded-size neckband instructions or pattern output.",
          construction: withoutNeckband,
        };
      }

      const lengthOption = TEE_NECKBAND_OPTIONS[0]!;
      const widthOption = TEE_NECKBAND_OPTIONS[1]!;
      const lengthPercent = options[lengthOption.id] ?? lengthOption.defaultValue;
      const finishedWidthCm = options[widthOption.id] ?? widthOption.defaultValue;
      const validSetting = (value: number, option: GarmentOption): boolean => Number.isFinite(value)
        && value >= option.min
        && value <= option.max
        && Math.abs((value - option.min) / option.step - Math.round((value - option.min) / option.step)) <= 1e-7;
      if (!validSetting(lengthPercent, lengthOption) || !validSetting(finishedWidthCm, widthOption)) {
        return {
          ...fittedTechPack,
          bom: noBandBom,
          constructionNotice: "Fitted Scoop neckband output is unavailable while its length or finished-width setting is invalid. Correct the band settings before generating the selected-size SVG and Tech Pack.",
          construction: withoutNeckband,
        };
      }

      const necklineCm = options.teeNecklineCircumferenceCm;
      const bandTargetCm = options.teeNeckbandTargetLengthCm;
      const geometrySummary = Number.isFinite(necklineCm) && necklineCm! > 0
        && Number.isFinite(bandTargetCm) && bandTargetCm! > 0
        ? "Measured selected-size body neckline " + necklineCm!.toFixed(1) + " cm; selected band target "
          + bandTargetCm!.toFixed(1) + " cm at " + lengthPercent + "% of that measured length."
        : "Selected band target " + lengthPercent + "% of the measured neckline; the selected-size SVG reports both measured neckline and target lengths.";
      const attachIndex = fittedTechPack.construction.findIndex((step) => step.startsWith("Attach the neckband"));
      const construction = [
        ...fittedTechPack.construction.slice(0, attachIndex),
        "Join the neckband short ends into a loop and align its quarter marks to the garment center front, shoulder seams, and center back.",
        "Attach the band to the selected-size neckline, distributing the quarter sections evenly; follow the separate selected-size neckband SVG.",
        "Neckband settings: " + geometrySummary + " Finished width " + finishedWidthCm.toFixed(1)
          + " cm; these are product-software choices, not fabric or fit recommendations. The band SVG and these measurements apply to the selected size only; no graded-size band output is supplied.",
        ...fittedTechPack.construction.slice(attachIndex + 1),
      ];
      return {
        ...fittedTechPack,
        bom: [
          ...noBandBom,
          { material: "User-selected band material", placement: "Provisional Scoop neckband", qty: "1 strip; see selected-size neckband SVG" },
        ],
        constructionNotice: "Provisional digital Scoop neckband construction. The rectangular cut template and allowances are software choices; physical fit, comfort, wear, fabric behavior, and recovery are unvalidated.",
        construction,
      };
    }
    if (!isTeeVNeckActive(options)) return fittedTechPack;
    const vBandTechPack = TEE.techPackForOptions!.call({ ...this, techPack: fittedTechPack }, options);
    return {
      ...vBandTechPack,
      constructionNotice: vBandTechPack.constructionNotice!.replace("Tee band settings", "Fitted Tee band settings"),
    };
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
  region: "upper",
  editRole: "front",
  fields: ["chest", "shoulderWidth", "length", "armholeDepth", "strapWidth", "neckDrop", "neckWidthEase", "ease"],
  styles: TANK_STYLES,
  draft: draftTank,
  grammar: TANK_GRAMMAR,
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

const POLO_TECH_PACK: TechPack = {
  bom: [
    { material: "Cotton jersey, main", placement: "Body, sleeves, collar & plackets", qty: "1.3 m" },
    { material: "Lightweight knit fusible stabilizer", placement: "Plackets, collar & stands", qty: "0.25 m" },
    { material: "Buttons", placement: "Front placket", qty: "3" },
    { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
    { material: "Care/content label", placement: "Left side seam", qty: "1" },
    { material: "Stretch sewing thread", placement: "All seams", qty: "1 cone" },
  ],
  construction: [
    "Apply lightweight knit-compatible stabilizer to placket, collar, and stand layers.",
    "Reinforce the marked placket base, clip the two diagonal corners, and cut the centre-front slit; sew and fold both plackets at their marked lines.",
    "Make buttonholes and attach three buttons at the marked 3.5 cm centres.",
    "Join upper and under collar around the outer edge; turn and press the points.",
    "Sew collar layers into outer and inner stands, matching centre-back folds and front ends.",
    "Attach the outer stand to the neckline; turn inner stand inside and finish securely.",
    "Join shoulder seams, set sleeves flat, then close side and underarm seams only to the marked vent tops.",
    "Finish and bar-tack the open side vents; press the sewn-to-open transitions before hemming.",
    "Hem front and back body edges separately to preserve the selected back drop; hem sleeves and inspect placket flatness, collar roll, and neckline recovery.",
  ],
};

const POLO_TECH_PACK_FOR_OPTIONS = (rawOptions: GarmentOptions): TechPack => {
  const options = resolvePoloOptions(rawOptions);
  const ventOpen = options.sideVentDepth > 0;
  const ventClosed = options.sideVentDepth === 0;
  const backDrop = options.backHemDrop > 0;
  const levelBack = options.backHemDrop === 0;
  const ventSteps = ventOpen
    ? [
        "Join shoulder seams, set sleeves flat, then close side and underarm seams only to the marked vent tops.",
        "Finish and bar-tack the open side vents; press the sewn-to-open transitions before hemming.",
      ]
    : ventClosed
      ? ["Join shoulder seams, set sleeves flat, then close the side and underarm seams continuously."]
      : ["Resolve the side-vent value before cutting; do not assume an open or closed vent topology."];
  const hemStep = backDrop
    ? "Hem front and back body edges separately to preserve the selected back drop; hem sleeves and inspect placket flatness, collar roll, and neckline recovery."
    : levelBack
      ? "Hem the front and back body edges level with each other; hem sleeves and inspect placket flatness, collar roll, and neckline recovery."
      : "Resolve the back-hem value before cutting; do not assume a level or dropped back hem.";
  return { ...POLO_TECH_PACK, construction: [...POLO_TECH_PACK.construction.slice(0, 6), ...ventSteps, hemStep] };
};

export const POLO: GarmentRecipe = {
  name: "polo",
  label: "Polo",
  region: "upper",
  editRole: "front",
  fields: ["chest", "shoulderWidth", "bicep", "length", "armholeDepth", "sleeveLength", "ease"],
  styles: POLO_STYLES,
  draft: (m, options = {}) => draftPolo(m, options),
  grammar: POLO_GRAMMAR,
  notches: POLO_NOTCHES,
  poms: [...POLO_BODY_POMS, ...POLO_POMS],
  grade: TSHIRT_GRADE,
  sizes: TSHIRT_SIZES,
  checks: sleevedTopPanelChecks(true),
  guidance: (block, m, options = {}) => poloGuidance(block, m, options),
  sizeMetric: frontHemWidth,
  techPack: POLO_TECH_PACK,
  techPackForOptions: POLO_TECH_PACK_FOR_OPTIONS,
  options: POLO_OPTION_DEFINITIONS,
  allowances: POLO_ALLOWANCES,
  a0Overflow: true,
  frontNeckline: () => NECKLINE_DEFAULT,
  backNeckline: () => NECKLINE_DEFAULT,
};

const WOVEN_HEM_TURN_OPTION = WOVEN_SHIRT_OPTION_DEFINITIONS.find((option) => option.id === "hemTurn")!;
const WOVEN_DEFAULT_HEM_ALLOWANCE = allowanceFor(WOVEN_SHIRT_ALLOWANCES, "hem");

const WOVEN_SHIRT_TECH_PACK = (
  buttonCount: number,
  hemTurn = WOVEN_HEM_TURN_OPTION.defaultValue,
): TechPack => {
  if (!Number.isFinite(hemTurn) || hemTurn < WOVEN_HEM_TURN_OPTION.min || hemTurn > WOVEN_HEM_TURN_OPTION.max) {
    throw new RangeError("Woven-shirt hem turn is outside its supported range.");
  }
  const construction = [
    "Fuse the collar, stand, and front placket areas according to the selected fabric and interfacing instructions.",
    "Join the front plackets to the two centre-front edges; press the folds and work the marked buttonholes.",
    `Attach ${buttonCount} front buttons at the marked even spacing, plus one additional button on the collar stand.`,
    "Sew the yoke to the lower back with the enclosed shoulder construction; match the yoke notches.",
    "Join the upper and under collar, turn the points, and sew the collar into the two stand layers.",
    "Attach the outer stand to the neckline, turn the inner stand, and secure the inside edge.",
    "Sew the patch pocket to its placement mark, set the sleeves, and attach the folded sleeve bands.",
    "Close side seams above the marked vents, finish the vent edges, and turn the curved hem.",
  ];
  if (hemTurn !== WOVEN_DEFAULT_HEM_ALLOWANCE) {
    construction.splice(construction.length - 1, 0,
      `Apply a ${hemTurn.toFixed(1)} cm turn-under allowance to the front body and lower-back body hems only; the sleeve hem remains at the default ${WOVEN_DEFAULT_HEM_ALLOWANCE.toFixed(1)} cm allowance. This is a cutting allowance, not a finished POM.`);
  }
  return {
    bom: [
      { material: "Lightweight woven fabric", placement: "Body, sleeves, yoke, collar & pocket", qty: "1.5 m" },
      { material: "Fusible interfacing", placement: "Collar, stand & front plackets", qty: "0.35 m" },
      { material: "Buttons", placement: "Front placket + collar stand", qty: `${buttonCount} front + 1 stand` },
      { material: "Woven brand label", placement: "Centre back neck", qty: "1" },
      { material: "Care/content label", placement: "Left side seam", qty: "1" },
      { material: "All-purpose thread", placement: "All seams", qty: "1 spool" },
    ],
    construction,
  };
};

export const WOVEN_SHIRT: GarmentRecipe = {
  name: "woven-shirt",
  label: "Woven shirt",
  region: "upper",
  editRole: "front",
  fields: WOVEN_SHIRT_FIELDS,
  styles: WOVEN_SHIRT_STYLES,
  draft: (m, options = {}) => draftWovenShirt(m, options),
  grammar: WOVEN_SHIRT_GRAMMAR,
  notches: WOVEN_SHIRT_NOTCHES,
  poms: WOVEN_SHIRT_POMS,
  grade: WOVEN_SHIRT_GRADE,
  sizes: TSHIRT_SIZES,
  checks: () => [],
  guidance: (block, m, options = {}) => wovenShirtGuidance(block, m, options),
  sizeMetric: (block) => edgeLength(pieceEdge(rolePiece(block, "front"), "hem")),
  techPack: WOVEN_SHIRT_TECH_PACK(7),
  techPackForOptions: (options) => WOVEN_SHIRT_TECH_PACK(
    Number(options.buttonCount ?? 7), Number(options.hemTurn ?? WOVEN_HEM_TURN_OPTION.defaultValue),
  ),
  options: WOVEN_SHIRT_OPTION_DEFINITIONS,
  allowances: WOVEN_SHIRT_ALLOWANCES,
  frontNeckline: () => NECKLINE_DEFAULT,
  backNeckline: () => NECKLINE_DEFAULT,
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
  { material: "Invisible zip", placement: "One side seam, waistband top to hip", qty: "1" },
  { material: "All-purpose thread", placement: "All seams", qty: "1 spool" },
];

export const SKIRT: GarmentRecipe = {
  name: "skirt",
  label: "Skirt",
  editRole: "front",
  fields: ["waist", "hip", "hipDepth", "length", "ease"],
  styles: SKIRT_STYLES,
  draft: draftSkirt,
  grammar: SKIRT_GRAMMAR,
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
    constructionNotice: "Draft guidance only; verify waistband joins, zipper method, and hip-notch placement before sewing or production.",
    construction: [
      "Overlock the exposed raw edges of the panels and waistband pieces.",
      "Join each waistband to its matching front or back panel waist edge, matching the center fold and side endpoint.",
      "Install one invisible zipper in a side opening, continuing from the waistband top through the upper skirt side seam to the hip notch.",
      "Sew the opposite side seam from waistband to hem; close the zipper-side seam from the hip notch to the hem and secure the zipper end.",
      "Turn up and hem the skirt.",
    ],
  },
};

export const TROUSER: GarmentRecipe = {
  name: "trouser",
  label: "Trouser",
  region: "lower",
  editRole: "frontLeft",
  a0Overflow: true,
  tiledPdfLocalCoordinates: true,
  fields: TROUSER_FIELDS,
  styles: TROUSER_STYLES,
  draft: (m, options = {}) => draftTrouserWithPockets(m, options as Partial<TrouserOptions>),
  grammar: TROUSER_GRAMMAR,
  notches: TROUSER_NOTCHES,
  poms: TROUSER_POMS,
  grade: TROUSER_GRADE,
  sizes: TROUSER_SIZES,
  checks: () => [],
  guidance: (block, m, options = {}) => trouserGuidance(block, m, options as Partial<TrouserOptions>),
  sizeMetric: (block) => edgeLength(pieceEdge(rolePiece(block, "frontLeft"), "waist")),
  techPack: TROUSER_TECH_PACK,
  options: TROUSER_OPTION_DEFINITIONS,
  allowances: TROUSER_ALLOWANCES,
};

export const JEANS: GarmentRecipe = {
  name: "jeans",
  label: "Jeans",
  region: "lower",
  editRole: "frontLeft",
  a0Overflow: true,
  tiledPdfLocalCoordinates: true,
  fields: JEANS_FIELDS,
  styles: JEANS_STYLES,
  draft: (m, options = {}) => draftJeansCore(m, options as Partial<JeansOptions>),
  grammar: JEANS_GRAMMAR,
  draftReview: (m, options = {}) => {
    const review = draftJeansWithGuidance(m, options as Partial<JeansOptions>);
    return { block: review.block, notes: review.notes };
  },
  notches: JEANS_NOTCHES,
  poms: JEANS_POMS,
  grade: JEANS_GRADE,
  sizes: JEANS_SIZES,
  checks: () => [],
  guidance: (block) => [...reviewJeansDraft(block).notes],
  sizeMetric: (block) => edgeLength(pieceEdge(rolePiece(block, "frontLeft"), "waist")),
  techPack: JEANS_TECH_PACK,
  options: JEANS_OPTION_DEFINITIONS,
  allowances: JEANS_ALLOWANCES,
};

export const SHORTS: GarmentRecipe = {
  name: "shorts",
  label: "Shorts",
  region: "lower",
  editRole: "frontLeft",
  fields: SHORTS_FIELDS,
  styles: SHORTS_STYLES,
  draft: (m, options = {}) => draftShortsWithComponents(m, options as Partial<ShortsOptions>),
  grammar: SHORTS_GRAMMAR,
  notches: SHORTS_NOTCHES,
  poms: SHORTS_POMS,
  grade: SHORTS_GRADE,
  sizes: SHORTS_SIZES,
  checks: () => [],
  guidance: (block, m, options = {}) =>
    shortsComponentGuidance(block, m, options as Partial<ShortsOptions>),
  sizeMetric: (block) => edgeLength(pieceEdge(rolePiece(block, "frontLeft"), "waist")),
  techPack: SHORTS_TECH_PACK,
  options: SHORTS_OPTION_DEFINITIONS,
  allowances: SHORTS_ALLOWANCES,
  tiledPdfLocalCoordinates: true,
};

export const CREWNECK: GarmentRecipe = {
  name: "crewneck",
  label: "Crewneck sweatshirt",
  region: "upper",
  editRole: "front",
  fields: CREWNECK_FIELDS,
  styles: CREWNECK_STYLES,
  draft: (m, options = CREWNECK_DEFAULT_OPTIONS) => draftCrewneck(m, options),
  grammar: CREWNECK_GRAMMAR,
  notches: CREWNECK_NOTCHES,
  poms: CREWNECK_POMS,
  grade: CREWNECK_GRADE,
  sizes: CREWNECK_SIZES,
  checks: sleevedTopPanelChecks(true),
  guidance: (block, m, options = CREWNECK_DEFAULT_OPTIONS) => crewneckGuidance(block, m, options),
  sizeMetric: frontHemWidth,
  techPack: CREWNECK_TECH_PACK,
  options: CREWNECK_OPTION_DEFINITIONS,
  resolveOptionsForSize: resolveCrewneckOptionsForSize,
  allowances: CREWNECK_ALLOWANCES,
  frontNeckline: (m) => ({ shape: "crew", widthEase: m.neckWidthEase, frontDrop: m.neckDrop }),
  backNeckline: (m) => ({ shape: "crew", widthEase: m.neckWidthEase, frontDrop: m.neckDrop }),
};

export const JOGGER: GarmentRecipe = {
  name: "jogger",
  label: "Jogger",
  region: "lower",
  editRole: "frontLeft",
  a0Overflow: true,
  tiledPdfLocalCoordinates: true,
  fields: JOGGER_FIELDS,
  styles: JOGGER_STYLES,
  draft: (m, options = JOGGER_DEFAULT_OPTIONS) => draftJogger(m, options as Partial<JoggerOptions>),
  grammar: JOGGER_GRAMMAR,
  notches: JOGGER_NOTCHES,
  poms: JOGGER_POMS,
  grade: JOGGER_GRADE,
  sizes: JOGGER_SIZES,
  checks: () => [],
  guidance: (block, m, options = JOGGER_DEFAULT_OPTIONS) =>
    joggerGuidance(block, m, options as Partial<JoggerOptions>),
  sizeMetric: (block) => edgeLength(pieceEdge(rolePiece(block, "frontLeft"), "waist")),
  techPack: JOGGER_TECH_PACK,
  techPackForOptions: joggerTechPackForOptions,
  options: JOGGER_OPTION_DEFINITIONS,
  allowances: JOGGER_ALLOWANCES,
};

export const HOODIE: GarmentRecipe = {
  name: "hoodie",
  label: "Pullover hoodie",
  region: "upper",
  editRole: "front",
  fields: HOODIE_FIELDS,
  styles: HOODIE_STYLES,
  draft: (m, options = HOODIE_DEFAULT_OPTIONS) =>
    draftHoodie(m, resolveHoodieOptions(options as Partial<HoodieOptions>)),
  grammar: HOODIE_GRAMMAR,
  notches: HOODIE_NOTCHES,
  poms: HOODIE_POMS,
  grade: HOODIE_GRADE,
  sizes: HOODIE_SIZES,
  checks: sleevedTopPanelChecks(true),
  guidance: (block, m, options = HOODIE_DEFAULT_OPTIONS) =>
    hoodieGuidance(block, m, options as Partial<HoodieOptions>),
  sizeMetric: frontHemWidth,
  techPack: HOODIE_TECH_PACK,
  techPackForOptions: hoodieTechPackForOptions,
  options: HOODIE_OPTION_DEFINITIONS,
  resolveOptionsForSize: resolveHoodieOptionsForSize,
  allowances: HOODIE_ALLOWANCES,
  a0Overflow: true,
  tiledPdfLocalCoordinates: true,
};

export const GARMENTS: readonly GarmentRecipe[] = [TEE, FITTED, TANK, POLO, WOVEN_SHIRT, SKIRT, TROUSER, JEANS, SHORTS, CREWNECK, JOGGER, HOODIE];

/** Look a recipe up by its stable id; falls back to the tee. */
export function garmentByName(name: string): GarmentRecipe {
  return GARMENTS.find((g) => g.name === name) ?? TEE;
}

/** Resolve the saved Tee construction while keeping the root registry stable. */
export function garmentForConstruction(name: string, teeConstruction: TeeConstruction = "set-in"): GarmentRecipe {
  const recipe = garmentByName(name);
  return recipe.name === "tee" && teeConstruction === "raglan" ? TEE_RAGLAN : recipe;
}
