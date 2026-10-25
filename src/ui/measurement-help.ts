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
import { FITTED_CAP_SLEEVE_ENTRY_ID, FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID } from "../drafting/fitted";
import { getFieldDefinitions } from "./field-provenance";
import { FITTED_CAP_SLEEVE_LENGTH_LABEL } from "./starter-registry";

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

const SRC_SIZE_KOREA_8TH: MeasurementHelpSource = Object.freeze({
  id: "SIZE-KOREA-8TH",
  scope: "Official No. 041 and No. 036 examiner-survey method definitions only; does not validate home/self capture, repeatability, population transfer, or garment fit.",
});

const SRC_CDC_NHANES_III: MeasurementHelpSource = Object.freeze({
  id: "CDC-NHANES-III",
  scope: "Examiner-administered biacromial breadth method only; does not validate self-measurement, population transfer, or garment fit.",
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

const DRAFT_USE_OVERRIDE: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  jeans: Object.freeze({
    waist: "The Jeans draft combines waist with shared ease and divides that finished digital circumference across the waist edges.",
    hip: "The Jeans draft combines hip with shared ease to set the digital seat geometry; the result does not qualify a body level or fit.",
    hipDepth: "The Jeans draft places its digital seat station this vertical distance below the wear-line reference; reference endpoints remain unreviewed.",
    crotchDepth: "The Jeans draft uses this seated-depth input with separate rise controls to locate front and back digital crotch stations; it is not a qualified capture method.",
    thigh: "The Jeans draft uses this as a finished digital girth target at its internal thigh station. It is not a wearer thigh measurement or a qualified body landmark.",
    knee: "The Jeans draft uses this as a finished digital girth target at its internal knee-transition station. That transition has no reviewed anatomical mapping and is not a body knee landmark.",
    inseam: "The Jeans draft uses this as a vertical crotch-to-hem target. Its finished inseam POM follows the sloped digital seam and may differ; this is not a wearer body inseam.",
    ease: "The Jeans draft applies shared ease at waist and seat; thigh and knee-transition girths have separate Jeans options.",
  }),
  shorts: Object.freeze({
    waist: "The shorts draft sets each quarter waist edge from (waist plus shared ease) divided by four.",
    hip: "The shorts draft sets each quarter seat edge from (hip plus shared ease) divided by four.",
    hipDepth: "The shorts draft places its seat station this vertical distance below the waist reference.",
    crotchDepth: "The shorts draft combines this input with front and back rise controls, then offsets the crotch station by the waistband depth. This inherited digital coordinate seed is not a physical-fit method.",
    thigh: "The shorts draft uses this finished target directly: each leg panel is one quarter of the target at the upper-thigh station. The POM reports four times one panel span; the station is 2.5 cm below the back-crotch station and has no reviewed anatomical mapping.",
    ease: "The shorts draft adds the shared value at waist and seat only. The finished thigh target already includes its intended room and receives no extra ease.",
    shortsInseam: "Sets the vertical distance from the back-crotch station to the finished hem. It is not a sewn inseam or wearer body inseam. The shorts draft has no knee station.",
    hemOpening: "Sets the finished circumference at one leg opening, represented across the four panel hem edges.",
    frontRiseEase: "Adds to the crotch-depth input to place the finished front-rise station before waistband depth is applied.",
    backRiseEase: "Adds to the crotch-depth input to place the finished back-rise station before waistband depth is applied.",
    waistbandDepth: "Sets the separate waistband pattern depth; guidance warns when it reaches either finished rise.",
    flyLength: "Sets the front fly component length; guidance checks its space against the front rise and hem turn.",
    pocketOpening: "Sets each angled front pocket opening length; guidance checks panel clearance and rise clearance.",
    pocketAngle: "Sets the angle of each front pocket opening; guidance checks the resulting line against the front panel.",
    pocketBagDepth: "Sets pocket-bag depth; guidance checks that the bag stays inside the front panel and above the hem turn.",
    pocketDrop: "Moves the pocket opening below the waist seam; guidance checks its clearance from the front rise.",
  }),
  crewneck: Object.freeze({
    neckDrop: "The crewneck draft adds this value to the derived front neckline depth; the back neckline keeps its derived depth.",
    neckWidthEase: "The crewneck draft adds this value per side to the derived width of both front and back necklines.",
    ease: "The crewneck draft uses this shared ease in the body panels and solves the sleeves from the resulting armholes; band circumferences stay separate user controls.",
  }),
  hoodie: Object.freeze({
    ease: "The Hoodie draft uses this shared ease in the body and sleeve blocks; cuff and hem-band lengths remain separate Hoodie options, and selected material does not change geometry.",
  }),
  jogger: Object.freeze({
    waist: "The Jogger draft adds shared ease to waist before dividing the four-panel waist; its separate casing is attached to that drafted opening. Elastic cut length is never calculated.",
    hip: "The Jogger draft adds shared ease to hip before deriving the four-panel seat width.",
    hipDepth: "The Jogger draft places its seat station this vertical distance below the waist reference; its capture endpoints and physical fit remain unreviewed.",
    crotchDepth: "The Jogger draft combines this existing lower-body input with separate front and back rise controls and casing depth; this is inherited digital geometry, not a physical-fit method.",
    thigh: "The Jogger draft adds its separate thigh-ease option to this input at an inherited digital station 2.5 cm below the back-crotch reference. That station has no reviewed anatomical mapping; do not treat the finished POM as a body-thigh capture.",
    knee: "The Jogger draft adds its separate knee-ease option at an inherited digital station 52% of inseam below the back-crotch reference. The station has no reviewed anatomical mapping; do not treat it as a physical knee landmark or fit result.",
    inseam: "The Jogger draft uses this value for its digital vertical crotch-to-hem target. The finished inseam POM follows the sloped sewn seam and may differ; this does not qualify a body-capture method.",
    ease: "Jogger shared ease affects waist and seat; thigh and knee have separate recipe-owned ease controls. Material stretch does not change this geometry.",
  }),
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
  shoulderWidth: "CDC/NCHS NHANES III Body Measurements (Anthropometry) Manual §3.3.1.6 describes examiner-operated sliding calipers and reports biacromial breadth to 0.1 cm. Source: https://wwwn.cdc.gov/nchs/Data/Nhanes3/Manuals/anthro.pdf. Confidence stays NOT_ASSESSED; no fit claim.",
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

const LIMITS_ADDITION_BY_RECIPE: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  jeans: Object.freeze({
    waist: "Jeans wear-line capture remains unresolved; entered values are unconfirmed. Confidence stays NOT_ASSESSED; no fit claim.",
    hip: "Jeans hip/seat level and capture path remain unresolved. Confidence stays NOT_ASSESSED; no fit claim.",
    hipDepth: "Jeans reference endpoints and vertical method remain unresolved; the pattern station is calculated, not observed. Confidence stays NOT_ASSESSED.",
    crotchDepth: "Jeans seated-depth posture and reference remain unresolved. Confidence stays NOT_ASSESSED; no fit claim.",
    thigh: "Finished digital target only; the internal thigh station has no reviewed anatomical mapping and is not a body capture. Confidence stays NOT_ASSESSED.",
    knee: "Finished digital target at an internal pattern transition only; no anatomical mapping or body-knee capture is established. Confidence stays NOT_ASSESSED.",
    inseam: "Vertical crotch-to-hem pattern target only; the finished POM follows the sloped digital seam. This is not a body inseam. Confidence stays NOT_ASSESSED.",
    ease: "Digital Jeans design control, not a validated standard. Review affected regions and material choice. Confidence stays NOT_ASSESSED.",
  }),
});

const TEE_METHOD_LIMITS: Readonly<Record<string, string>> = Object.freeze({
  chest: "Size Korea 8th Survey, No. 041: axilla-level Chest Circumference, not nipple-level Bust; standing, horizontal path, level back line, midpoint of the natural breathing cycle. Examiner-survey only; no qualified home/self capture. Girth omits torso shape; neckline is formula-derived, not measured. Value unconfirmed; repeatability/fit unvalidated. Confidence NOT_ASSESSED. Credit: Korean Agency for Technology and Standards (KATS); KATRI report. Results: https://sizekorea.kr/human-info/meas-report?measDegree=8; protocol: https://sizekorea.kr/support/pds/view?bbsCntntsSeq=725&currentPageNo=1",
  bicep: "Size Korea 8th Survey, No. 036: relaxed right upper-arm circumference at axillary level; tape perpendicular to arm axis, arm hanging at side, midpoint of the natural breathing cycle. Examiner-survey only; no qualified home/self capture. App records no capture side or posture; sleeve fit unvalidated. Value unconfirmed; repeatability/fit unvalidated. Confidence NOT_ASSESSED. Credit: Korean Agency for Technology and Standards (KATS); KATRI report. Results: https://sizekorea.kr/human-info/meas-report?measDegree=8; protocol: https://sizekorea.kr/support/pds/view?bbsCntntsSeq=725&currentPageNo=1",
});

const LIMITS_FALLBACK =
  "Digital construction choice; range is a UI guardrail, not a production tolerance or standard. Invalid values stay visible; do not rely on silent defaults. Confidence stays NOT_ASSESSED.";

const LIMITS_SUFFIX: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  skirt: Object.freeze({
    length: "Values above 100 stay visible and block continuation; no automatic changes. The 100 to 120 band is unavailable until the contradiction is resolved.",
  }),
  "woven-shirt": Object.freeze({
    length: "D-07: guidance checks the current woven-shirt geometry and blocks continuation when the hip station falls below the hem; increase top length or reduce underarm drop or hip depth. Values are not changed automatically.",
  }),
  shorts: Object.freeze({
    thigh: "This is a finished target at the shorts block's fixed upper-thigh station, not a wearer thigh value; its anatomical mapping is not reviewed.",
    shortsInseam: "The accepted 45 cm product cap permits lengths that cross the knee. The draft contains no anatomical knee station, mark, or POM. This vertical target is not a sewn inseam or fit-qualified measurement.",
  }),
});

const EXTRA_SOURCES: Readonly<Record<string, readonly MeasurementHelpSource[]>> = Object.freeze({
  neck: Object.freeze([SRC_S09]),
  chest: Object.freeze([SRC_S10]),
  shoulderWidth: Object.freeze([SRC_S10, SRC_CDC_NHANES_III]),
  waist: Object.freeze([SRC_S06, SRC_S08]),
  hip: Object.freeze([SRC_S07]),
  crotchDepth: Object.freeze([SRC_S11]),
  inseam: Object.freeze([SRC_S10]),
  ease: Object.freeze([SRC_S11]),
});

const TEE_METHOD_SOURCES: Readonly<Record<string, readonly MeasurementHelpSource[]>> = Object.freeze({
  chest: Object.freeze([SRC_SIZE_KOREA_8TH]),
  bicep: Object.freeze([SRC_SIZE_KOREA_8TH]),
});

function draftUseFor(recipeId: string, inputKey: string): string {
  const override = DRAFT_USE_OVERRIDE[recipeId]?.[inputKey];
  if (override !== undefined) return override;
  const base = DRAFT_USE_BASE[inputKey] ?? DRAFT_USE_FALLBACK;
  const suffix = DRAFT_USE_SUFFIX[recipeId]?.[inputKey];
  return suffix === undefined ? base : `${base} ${suffix}`;
}

function limitsFor(recipeId: string, inputKey: string, captureBoundary: string): string {
  const teeMethod = recipeId === "tee" ? TEE_METHOD_LIMITS[inputKey] : undefined;
  if (teeMethod !== undefined) return teeMethod;
  const base = LIMITS_ADDITION_BY_RECIPE[recipeId]?.[inputKey]
    ?? LIMITS_ADDITION[inputKey] ?? LIMITS_FALLBACK;
  const suffix = LIMITS_SUFFIX[recipeId]?.[inputKey];
  const extra = suffix ? ` ${suffix}` : "";
  return `${captureBoundary} ${base}${extra}`;
}

function sourcesFor(recipeId: string, inputKey: string): readonly MeasurementHelpSource[] {
  const extra = EXTRA_SOURCES[inputKey] ?? [];
  const teeMethod = recipeId === "tee" ? TEE_METHOD_SOURCES[inputKey] ?? [] : [];
  return Object.freeze([...BASE_SOURCES, ...extra, ...teeMethod]);
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
    sources: sourcesFor(recipeId, inputKey),
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

export function measurementHelpFor(recipeId: string, fieldId: string, starterEntryId?: string | null): MeasurementHelpEntry | null {
  const byRecipe = MEASUREMENT_HELP[recipeId];
  if (!byRecipe) return null;
  const entry = byRecipe[fieldId];
  if (!entry) return null;
  if (recipeId === "fitted" && starterEntryId === FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID
    && entry.inputKey === "sleeveLength") {
    return Object.freeze({
      ...entry,
      label: "Sleeve length below modeled cap base",
      meaning: "F07 digital sleeve-length target below the modeled cap base. The separately reported cap-crown-to-hem sleeve POM includes solved cap height.",
      draftUse: "The fitted draft places the sleeve hem below the modeled cap base by this value; the separate sleeve-length POM also includes solved cap height.",
      limits: "The 38 cm default and 34–44 cm range are software design choices, not a body-arm measurement or fit range. The three-quarter style label does not guarantee an elbow-to-wrist endpoint; physical fit is unvalidated.",
      guardrailNote: "F07 software guardrail: 34–44 cm in 1 cm steps. This does not locate the wearer's elbow or wrist. Invalid values remain visible and are not clamped.",
    });
  }
  if (recipeId === "fitted" && starterEntryId === FITTED_CAP_SLEEVE_ENTRY_ID
    && entry.inputKey === "sleeveLength") {
    return Object.freeze({
      ...entry,
      label: FITTED_CAP_SLEEVE_LENGTH_LABEL,
      meaning: "F06 digital sleeve-length target from the modeled cap base to the hem. The separately reported sleeve-length POM includes the modeled cap height.",
      draftUse: "The fitted draft places the sleeve hem at modeled cap base plus this value. The separate sleeve-length POM adds the solved cap height.",
      limits: "This F06 value is a software target, not a body arm path or sewn measurement. The 8–10 cm range is an entry-specific digital guardrail, not a fit range or industry standard; physical fit is unvalidated.",
      guardrailNote: "F06 software guardrail 8–10 cm in 1 cm steps; not an industry standard or fit range. Invalid values stay visible and are not clamped.",
    });
  }
  if (recipeId === "tank" && starterEntryId === "tank-high-neck-digital-v1"
    && entry.inputKey === "neckDrop") {
    return Object.freeze({
      ...entry,
      label: "Additional front neckline drop",
      meaning: "N02 is a higher round front-neckline Tank profile relative to N01. This editable software control adds front neckline depth beyond the chest-derived baseline; 0 cm is the N02 software default, not a physical target.",
      draftUse: "The current Tank draft adds this value to the front neckline depth beyond the chest-derived baseline. Only the front neckline changes; the back neckline stays at its derived depth.",
      limits: "The 0–18 cm range in 0.5 cm steps is an InfiniDrip software guardrail, not a sourced physical standard or fit range. At identical other inputs, N02's 0 cm default places front center 5 cm higher than N01's 5 cm default. No qualified capture procedure or physical fit validation exists.",
      guardrailNote: "N02 software guardrail: 0–18 cm in 0.5 cm steps. This is not a sourced physical standard or fit range. Invalid values remain visible and are not clamped.",
    });
  }
  return entry;
}
