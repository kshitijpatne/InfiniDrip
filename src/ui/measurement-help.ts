/** Source-aware, factual measurement help for the G03 guided route.
 *
 * Each entry separates the field's semantic meaning and reference frame from
 * the actual current draft consumer, states that no capture technique is
 * qualified, and records the relevant unresolved mapping or limit from the
 * M01 source audit and the one-size mapping audit §12 dispositions.
 *
 * This module gives no anatomical measuring steps and claims no fit or
 * standards validation. Guardrails are existing software limits, not
 * industry values. Draft behavior is read from current recipe code and is a
 * digital rule only.
 */
import { GARMENTS } from "../drafting";
import { getFieldDefinitions } from "./field-provenance";

export interface MeasurementHelpSource {
  readonly id: string;
  readonly scope: string;
}

export interface MeasurementHelpEntry {
  readonly recipeId: string;
  readonly fieldId: string;
  readonly inputKey: string;
  readonly inputKind: "measurement" | "option";
  readonly label: string;
  readonly semanticKind: string;
  readonly referenceFrame: "body" | "finished-garment" | "pattern" | "design-control";
  readonly meaning: string;
  readonly draftUse: string;
  readonly techniqueQualified: false;
  readonly qualificationNote: string;
  readonly limits: string;
  readonly guardrailNote: string;
  readonly sources: readonly MeasurementHelpSource[];
}

const QUALIFICATION_NOTE =
  "No accepted fit-qualified capture procedure exists for this field. " +
  "This help explains meaning and digital use only; it gives no measuring steps and claims no fit.";

const SRC_C03: MeasurementHelpSource = Object.freeze({
  id: "C03",
  scope: "Contract meaning only; no capture procedure; does not validate fit or formula.",
});

const SRC_CODE: MeasurementHelpSource = Object.freeze({
  id: "CODE",
  scope: "Current draft code read directly; digital behavior only; does not validate fit or formula.",
});

const SRC_S14: MeasurementHelpSource = Object.freeze({
  id: "S14",
  scope: "WCAG label guidance only; supports name, unit, and format; says nothing about anatomy; does not validate fit.",
});

const SRC_S13: MeasurementHelpSource = Object.freeze({
  id: "S13",
  scope: "WCAG error guidance only; supports visible text errors and no silent fixes; says nothing about anatomy; does not validate fit.",
});

const SRC_S10: MeasurementHelpSource = Object.freeze({
  id: "S10",
  scope: "Teaching guide; plain wording only; not a qualified procedure; heuristics are not standards; does not validate fit.",
});

const SRC_S06: MeasurementHelpSource = Object.freeze({
  id: "S06",
  scope: "Health waist protocol at one site; not a garment wear line; does not validate fit.",
});

const SRC_S08: MeasurementHelpSource = Object.freeze({
  id: "S08",
  scope: "Midpoint waist protocol; shows sites differ by centimeters; not a garment path; does not validate fit.",
});

const SRC_S07: MeasurementHelpSource = Object.freeze({
  id: "S07",
  scope: "Health hip protocol at one site; not a garment seat mapping; does not validate fit.",
});

const SRC_S09: MeasurementHelpSource = Object.freeze({
  id: "S09",
  scope: "Small clinical self-measure study; mid-neck site differs from neck base; does not validate garment fit.",
});

const SRC_S11: MeasurementHelpSource = Object.freeze({
  id: "S11",
  scope: "Nonprofit sewing guide; plain ease wording only; inches are rules of thumb, not standards; does not validate fit.",
});

const BASE_SOURCES: readonly MeasurementHelpSource[] = Object.freeze([SRC_C03, SRC_CODE, SRC_S14, SRC_S13]);

const DRAFT_USE_BASE: Readonly<Record<string, string>> = Object.freeze({
  neck: "The woven-shirt draft quarters this value with neck ease to set the neckline half-width at the shoulder line. The neck-circumference POM is a separate pattern curve length. Checked: 40 plus 1 ease reports a 51.55 pattern POM, not 41.",
  chest: "The current draft sets panel width from (chest plus ease) divided by 4 and derives the neckline width from chest divided by 20 plus 2. The body-chest POM reads back chest plus ease.",
  shoulderWidth: "The current draft uses half this value as the horizontal shoulder-point position.",
  bicep: "The current draft sets sleeve width from bicep plus half the shared ease value.",
  length: "The current draft sets the hem distance from the shoulder or waist reference by this value.",
  armholeDepth: "The current draft sets the underarm station distance below the shoulder origin by this value. It shapes the armhole length and through it the sleeve cap.",
  sleeveLength: "The current draft sets the sleeve hem at cap-base plus this value. The sleeve-length POM adds the solved cap height and reads larger. Checked: 22 reports 23.79.",
  waist: "The current draft sets quarter-panel width from (waist plus ease) divided by 4 at the waist reference.",
  hip: "The current draft sets quarter-panel width from (hip plus ease) divided by 4 at the hip station.",
  hipDepth: "The current draft sets the hip-station distance below the waist reference by this value.",
  crotchDepth: "The current draft sets front and back rise from this value plus rise ease, with the crotch station offset by waistband depth.",
  thigh: "The current draft sets each trouser panel width to one quarter of the finished thigh value at a fixed station 2.5 below the back-crotch station. The thigh POM reports four times one panel span. Checked: 66 POM corresponds to 33 summed one-leg panels.",
  knee: "The current draft sets each trouser panel width to one quarter of the finished knee value at a station 52 percent of inseam below the back-crotch station. The knee POM reports four times one panel span. Checked: 45 POM corresponds to 22.5 summed one-leg panels.",
  inseam: "The current draft sets the hem station one inseam below the crotch station vertically. The inseam POM follows the sloped sewn seam and reads slightly larger. Checked: 78 reports 78.42.",
  ease: "This shared control adds room in the draft; the affected regions differ by recipe.",
  strapWidth: "The current tank draft sets the strap point from the chest-derived neck half-width plus this value. Guidance and views add the neck-width adjustment while the pattern does not; positions differ when that adjustment is non-zero. No independent strap-width POM exists.",
  neckDrop: "The current tank draft adds this value to the front neckline depth beyond the chest-derived baseline.",
  neckWidthEase: "The current tank draft widens each side of the front and back neckline by this value.",
});

const DRAFT_USE_FALLBACK =
  "Digital construction choice for this recipe. The entered value is kept verbatim in the draft; an out-of-range value stays visible and blocks dependent actions without automatic changes.";

const DRAFT_USE_SUFFIX: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  tee: Object.freeze({
    chest: "No neck input is used; the opening is chest-derived.",
    shoulderWidth: "Slope is a fixed 4 draft constant, not a personal value.",
    length: "Hem is at the stated distance from the shoulder origin.",
    ease: "Full value at chest; half value at sleeve width.",
  }),
  fitted: Object.freeze({
    chest: "No neck input is used; the opening is chest-derived. Dart apex uses panel width including ease.",
    shoulderWidth: "Slope is a fixed 4 draft constant, not a personal value.",
    length: "Center-front hem is at the stated distance; side hem adds a fixed 4 dart intake; bust height uses a fixed proportion of this value and armhole depth.",
    ease: "Full value at chest; half value at sleeve width.",
  }),
  tank: Object.freeze({
    chest: "No neck input is used; the opening is chest-derived. The strap point builds from the derived width.",
    shoulderWidth: "The tank pattern block does not read this value; it is kept for the body view and guidance only. The tank Across-shoulder POM follows the strap point, not this input.",
    length: "Hem is at the stated distance from the shoulder origin.",
    ease: "Applies at chest only.",
  }),
  polo: Object.freeze({
    chest: "No neck input is used; the opening is chest-derived. The collar and stand are solved from the derived neckline edges.",
    shoulderWidth: "Slope is a fixed 4 draft constant, not a personal value.",
    length: "Front hem is at the stated distance; back hem adds back-hem drop; vent top is offset from the side end.",
    ease: "Full value at chest; half value at sleeve width.",
  }),
  "woven-shirt": Object.freeze({
    chest: "Pocket placement uses chest divided by 20.",
    shoulderWidth: "Slope is a fixed 2.5 draft constant, not a personal value.",
    length: "Hem is at the stated distance; the waist station is a fixed proportion of this value and armhole depth.",
    ease: "Full value at chest, waist, and hip; half value at sleeve width.",
  }),
  skirt: Object.freeze({
    length: "Hem distance runs from the panel waist seam, excluding the waistband. Guided entry allows 40 to 100; the Maxi label to 120 is unavailable here.",
    ease: "Applies at waist and hip.",
  }),
  trouser: Object.freeze({
    ease: "Applies at waist and seat only; thigh and knee have separate ease options.",
  }),
});

const LIMITS_ADDITION: Readonly<Record<string, string>> = Object.freeze({
  neck: "Open gate G-neck-path: exact path and posture are unreviewed. Never infer from chest, appearance, or gender. Confidence stays NOT_ASSESSED; no fit claim.",
  chest: "Open gate G-chest-path: exact level and plane are unreviewed. The derived neckline is a formula, not a measurement. Confidence stays NOT_ASSESSED; no fit claim.",
  shoulderWidth: "Open gate G-shoulder-endpoints: endpoints and straight-span versus tape path are unreviewed. Confidence stays NOT_ASSESSED; no fit claim.",
  bicep: "Open gate G-bicep-station: level, side, and posture are undefined. Do not read the sleeve as fit-validated. Confidence stays NOT_ASSESSED.",
  length: "Finished-target control only; not stature. Confidence stays NOT_ASSESSED.",
  armholeDepth: "Pattern target only; no body record exists. Older body or finished labels are superseded. Confidence stays NOT_ASSESSED; no fit claim.",
  sleeveLength: "Finished-target control only; not a body arm path. D-01: the draft uses a cap-base offset while the label names a cap-top target. Confidence stays NOT_ASSESSED.",
  waist: "Open gate G-waist-line: the wear line is unconfirmed. Iliac-crest and midpoint sites differ by centimeters and are not interchangeable. Do not mix lines between waist, hip, and depth. Confidence stays NOT_ASSESSED.",
  hip: "Open gate G-hip-level: level, path, and posture are method-dependent. One girth does not describe shape. Use the same level as hip depth. Confidence stays NOT_ASSESSED.",
  hipDepth: "Open gate G-hipdepth-refs: endpoints and vertical method are unreviewed. Must share the wear line and hip level with waist and hip. A draft POM is calculated, not observed. Confidence stays NOT_ASSESSED.",
  crotchDepth: "Open gate G-seated-protocol: seated surface, posture, and waistband reference are unreviewed. One value does not establish front/back balance or fit. Confidence stays NOT_ASSESSED.",
  thigh: "Open gate G-thigh-map: the fixed-offset station has no reviewed anatomical mapping. Finished-target control only; not a body capture. Do not read the POM as a leg girth. Confidence stays NOT_ASSESSED.",
  knee: "Open gate G-knee-map: the 52-percent-of-inseam station has no reviewed anatomical mapping. Finished-target control only; not a body capture. Confidence stays NOT_ASSESSED.",
  inseam: "Finished-target control only; not a body inseam or outseam. D-09: the draft uses a vertical target while the POM follows the sloped seam. Confidence stays NOT_ASSESSED.",
  ease: "Digital design control, not a validated standard. Review affected regions and material choice. Confidence stays NOT_ASSESSED.",
  strapWidth: "Design control, not a body value or sourced default. D-04 and D-05: pattern and guidance positions differ when the neck-width adjustment is non-zero; the Across-shoulder POM follows the strap point. Confidence stays NOT_ASSESSED.",
  neckDrop: "Design control, not a body value or sourced default. Added depth beyond the derived baseline. Confidence stays NOT_ASSESSED.",
  neckWidthEase: "Design control, not a body value or sourced default. Per-side adjustment applied to front and back. Confidence stays NOT_ASSESSED.",
});

const LIMITS_FALLBACK =
  "Digital construction choice; range is a UI guardrail, not a production tolerance or standard. Invalid values stay visible; do not rely on silent defaults. Confidence stays NOT_ASSESSED.";

const LIMITS_SUFFIX: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  skirt: Object.freeze({
    length: "Values above 100 stay visible and block continuation; no automatic changes. The 100 to 120 band is unavailable until the contradiction is resolved.",
  }),
  "woven-shirt": Object.freeze({
    length: "D-07: some combinations place the hip station below the hem; a visible check is owned by a later M01 slice; no automatic correction.",
  }),
});

const EXTRA_SOURCES: Readonly<Record<string, readonly MeasurementHelpSource[]>> = Object.freeze({
  neck: Object.freeze([SRC_S09]),
  chest: Object.freeze([SRC_S10]),
  shoulderWidth: Object.freeze([SRC_S10]),
  waist: Object.freeze([SRC_S06, SRC_S08]),
  hip: Object.freeze([SRC_S07]),
  crotchDepth: Object.freeze([SRC_S11]),
  inseam: Object.freeze([SRC_S10]),
  ease: Object.freeze([SRC_S11]),
});

function draftUseFor(recipeId: string, inputKey: string): string {
  const base = DRAFT_USE_BASE[inputKey] ?? DRAFT_USE_FALLBACK;
  const suffix = (DRAFT_USE_SUFFIX[recipeId] as Readonly<Record<string, string>>)[inputKey] as
    | string
    | undefined;
  return suffix === undefined ? base : `${base} ${suffix}`;
}

function limitsFor(recipeId: string, inputKey: string, captureBoundary: string): string {
  const base = LIMITS_ADDITION[inputKey] ?? LIMITS_FALLBACK;
  const suffix = LIMITS_SUFFIX[recipeId]?.[inputKey];
  const extra = suffix ? ` ${suffix}` : "";
  return `${captureBoundary} ${base}${extra}`;
}

function sourcesFor(inputKey: string): readonly MeasurementHelpSource[] {
  const extra = EXTRA_SOURCES[inputKey] ?? [];
  return Object.freeze([...BASE_SOURCES, ...extra]);
}

function guardrailNoteFor(min: number, max: number, unit: string): string {
  return `Existing software guardrail ${min}–${max} ${unit}; not an industry standard or fit range. Values outside stay visible and block continuation without automatic changes.`;
}

function buildEntry(
  recipeId: string,
  fieldId: string,
  inputKey: string,
  inputKind: "measurement" | "option",
  label: string,
  semanticKind: string,
  referenceFrame: "body" | "finished-garment" | "pattern" | "design-control",
  meaning: string,
  captureBoundary: string,
  min: number,
  max: number,
  unit: string,
): MeasurementHelpEntry {
  return Object.freeze({
    recipeId,
    fieldId,
    inputKey,
    inputKind,
    label,
    semanticKind,
    referenceFrame,
    meaning,
    draftUse: draftUseFor(recipeId, inputKey),
    techniqueQualified: false as const,
    qualificationNote: QUALIFICATION_NOTE,
    limits: limitsFor(recipeId, inputKey, captureBoundary),
    guardrailNote: guardrailNoteFor(min, max, unit),
    sources: sourcesFor(inputKey),
  });
}

function buildCatalog(): Readonly<Record<string, Readonly<Record<string, MeasurementHelpEntry>>>> {
  const catalog: Record<string, Record<string, MeasurementHelpEntry>> = {};
  for (const recipe of GARMENTS) {
    const byField: Record<string, MeasurementHelpEntry> = {};
    for (const definition of getFieldDefinitions(recipe.name)) {
      byField[definition.id] = buildEntry(
        recipe.name,
        definition.id,
        definition.inputKey,
        definition.inputKind,
        definition.label,
        definition.semanticKind,
        definition.referenceFrame,
        definition.meaning,
        definition.captureBoundary,
        definition.min,
        definition.max,
        definition.unit,
      );
    }
    catalog[recipe.name] = Object.freeze(byField);
  }
  return Object.freeze(catalog);
}

export const MEASUREMENT_HELP: Readonly<Record<string, Readonly<Record<string, MeasurementHelpEntry>>>> =
  buildCatalog();

export function measurementHelpFor(recipeId: string, fieldId: string): MeasurementHelpEntry | null {
  const byRecipe = MEASUREMENT_HELP[recipeId];
  if (!byRecipe) return null;
  return byRecipe[fieldId] ?? null;
}
