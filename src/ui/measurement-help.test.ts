import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import { FITTED_CAP_SLEEVE_ENTRY_ID, FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID } from "../drafting/fitted";
import { getFieldDefinitions } from "./field-provenance";
import { MEASUREMENT_HELP, measurementHelpFor } from "./measurement-help";

const ALLOWED_SOURCE_IDS = new Set([
  "C03",
  "CODE",
  "S06",
  "S07",
  "S08",
  "S09",
  "S10",
  "S11",
  "S13",
  "S14",
  "SIZE-KOREA-8TH",
  "CDC-NHANES-III",
]);

/** Prescriptive measuring-step fragments that must never appear in help body text. */
const FORBIDDEN_PROCEDURE_FRAGMENTS = [
  "place the tape",
  "wrap the tape",
  "run the tape",
  "keep the tape",
  "parallel to the floor",
  "horizontal plane",
  "stand straight",
  "sit upright",
  "breathe",
  "exhal",
  "mirror",
  "palpate",
  "midaxillary",
  "hug position",
  "crossed arms",
  "get a helper",
  "ask someone",
  "wear tight",
  "undergarment",
  "non-stretch",
  "measure around",
  "measure from",
  "measure at",
  "plus 1 inch",
  "should fit",
  "will fit",
  "ensures fit",
  "guarantees fit",
  "proves fit",
  "fit is validated",
  "follow these steps",
  "take the average",
  "average your",
  "round to the",
  "you should measure",
  "you must measure",
];

/** Positive validation claims that must never appear; negated withholding is required instead. */
const FORBIDDEN_POSITIVE_CLAIMS = [
  "ensures fit",
  "guarantees fit",
  "proves fit",
  "validates fit",
  "fit is validated",
  "fit has been validated",
  "qualified to measure",
  "industry target is",
  "meets the standard",
];

function bodyTextOf(recipeId: string, fieldId: string): string {
  const entry = measurementHelpFor(recipeId, fieldId);
  if (!entry) throw new Error(`Missing help for ${recipeId} ${fieldId}`);
  return `${entry.meaning} ${entry.draftUse} ${entry.limits} ${entry.guardrailNote} ${entry.qualificationNote}`.toLowerCase();
}

describe("measurement help catalog", () => {
  it("covers every field definition of all twelve recipes exactly once", () => {
    expect(GARMENTS).toHaveLength(12);
    expect(Object.keys(MEASUREMENT_HELP).sort()).toEqual(GARMENTS.map((recipe) => recipe.name).sort());
    for (const recipe of GARMENTS) {
      const definitions = getFieldDefinitions(recipe.name);
      expect(definitions.length).toBeGreaterThan(0);
      const byField = MEASUREMENT_HELP[recipe.name];
      expect(Object.keys(byField!).sort()).toEqual(definitions.map((definition) => definition.id).sort());
      for (const definition of definitions) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry).toBeDefined();
        expect(entry.recipeId).toBe(recipe.name);
        expect(entry.fieldId).toBe(definition.id);
        expect(entry.inputKey).toBe(definition.inputKey);
        expect(entry.inputKind).toBe(definition.inputKind);
        expect(entry.label).toBe(definition.label);
        expect(entry.meaning).toBe(definition.meaning);
        expect(entry.referenceFrame).toBe(definition.referenceFrame);
        expect(entry.semanticKind).toBe(definition.semanticKind);
        expect(entry.guardrailNote).toContain(`${definition.min}–${definition.max} ${definition.unit}`);
        expect(entry.guardrailNote.toLowerCase()).toContain("not an industry standard");
      }
    }
  });

  it("describes Hoodie shared ease and recipe-owned hood controls in context", () => {
    const definitions = getFieldDefinitions("hoodie");
    const ease = definitions.find(({ inputKey, inputKind }) => inputKey === "ease" && inputKind === "measurement")!;
    const easeHelp = measurementHelpFor("hoodie", ease.id)!;
    expect(easeHelp.draftUse).toContain("Hoodie draft uses this shared ease in the body and sleeve blocks");
    const hoodHeight = definitions.find(({ inputKey, inputKind }) => inputKey === "hoodHeight" && inputKind === "option")!;
    const hoodHeightHelp = measurementHelpFor("hoodie", hoodHeight.id)!;
    expect(hoodHeightHelp.recipeId).toBe("hoodie");
    expect(hoodHeightHelp.inputKind).toBe("option");
    expect(hoodHeightHelp.meaning).toContain("no head measurement is used");
    expect(hoodHeightHelp.techniqueQualified).toBe(false);
  });

  it("returns stable entries and explicit null for unknown or stale IDs", () => {
    const first = measurementHelpFor("tee", "body.chest-girth");
    const second = measurementHelpFor("tee", "body.chest-girth");
    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(measurementHelpFor("unknown-recipe", "body.chest-girth")).toBeNull();
    expect(measurementHelpFor("tee", "unknown-field")).toBeNull();
    expect(measurementHelpFor("tee", "")).toBeNull();
    expect(measurementHelpFor("", "body.chest-girth")).toBeNull();
    // Stale: a trouser-only target is not part of the tee route.
    expect(measurementHelpFor("tee", "target.finished-thigh-girth")).toBeNull();
    // Stale: a woven-only body input is not part of the skirt route.
    expect(measurementHelpFor("skirt", "body.neck-base-girth")).toBeNull();
    // Unknown recipe never throws and stays null on repeat.
    expect(measurementHelpFor("nope", "nope")).toBeNull();
    expect(measurementHelpFor("nope", "nope")).toBeNull();
  });

  it("marks every technique as unqualified with explicit withholding copy", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.techniqueQualified).toBe(false);
        expect(entry.qualificationNote).toContain("No accepted fit-qualified capture procedure exists");
        expect(entry.qualificationNote).toContain("gives no measuring steps");
        expect(entry.qualificationNote).toContain("claims no fit");
        expect(entry.limits).toContain("NOT_ASSESSED");
        expect(entry.limits.length).toBeGreaterThan(definition.captureBoundary.length);
        expect(entry.draftUse.length).toBeGreaterThan(20);
      }
    }
  });

  it("keeps shorts thigh and length help in finished-target and recipe-control terms", () => {
    const thigh = measurementHelpFor("shorts", "target.shorts-finished-thigh-girth")!;
    expect(thigh.semanticKind).toBe("GARMENT_MEASURE");
    expect(thigh.referenceFrame).toBe("finished-garment");
    expect(thigh.meaning).toContain("finished shorts thigh-girth target");
    expect(thigh.draftUse).toContain("finished target directly");
    expect(thigh.limits).toContain("not a wearer thigh value");
    expect(thigh.limits).toContain("NOT_ASSESSED");

    const length = measurementHelpFor("shorts", "style.shorts.shorts-inseam")!;
    expect(length.inputKind).toBe("option");
    expect(length.draftUse).toContain("vertical distance from the back-crotch station");
    expect(length.draftUse).toContain("no knee station");
    expect(length.limits).toContain("45 cm product cap permits lengths that cross the knee");
    expect(length.limits).toContain("no anatomical knee station, mark, or POM");
  });

  it("describes Jeans thigh, knee transition, and inseam as digital targets without Trouser mapping", () => {
    const thigh = measurementHelpFor("jeans", "target.jeans-finished-thigh-girth")!;
    const knee = measurementHelpFor("jeans", "target.jeans-finished-knee-transition-girth")!;
    const inseam = measurementHelpFor("jeans", "target.jeans-crotch-to-hem")!;
    for (const entry of [thigh, knee, inseam]) {
      expect(entry.techniqueQualified).toBe(false);
      expect(entry.qualificationNote).toContain("No accepted fit-qualified capture procedure exists");
      expect(entry.limits).toContain("NOT_ASSESSED");
      expect(`${entry.draftUse} ${entry.limits}`.toLowerCase()).not.toContain("trouser");
    }
    expect(thigh.draftUse).toContain("finished digital girth target");
    expect(thigh.limits).toContain("not a body capture");
    expect(knee.draftUse).toContain("internal knee-transition station");
    expect(knee.limits).toContain("no anatomical mapping");
    expect(knee.draftUse.toLowerCase()).not.toContain("52 percent");
    expect(knee.limits.toLowerCase()).not.toContain("52-percent");
    expect(inseam.draftUse).toContain("vertical crotch-to-hem target");
    expect(inseam.draftUse).toContain("sloped digital seam");
    expect(inseam.limits).toContain("not a body inseam");
  });

  it("describes crewneck neckline controls against the crewneck draft", () => {
    const depth = measurementHelpFor("crewneck", "style.crewneck-front-neck-depth")!;
    const width = measurementHelpFor("crewneck", "style.crewneck-neckline-width-per-side")!;
    expect(depth.meaning).toContain("front crew neckline");
    expect(depth.draftUse).toContain("front neckline depth");
    expect(depth.draftUse).not.toContain("tank");
    expect(width.meaning).toContain("both the front and back crew neckline");
    expect(width.draftUse).toContain("both front and back necklines");
    expect(width.draftUse).not.toContain("tank");
    expect(measurementHelpFor("crewneck", "style.tank-neck-drop")).toBeNull();
  });

  it("describes Jogger inputs and recipe options without assigning anatomy to the inherited knee station", () => {
    const definitions = getFieldDefinitions("jogger");
    expect(definitions.map(({ inputKey }) => inputKey)).toEqual([
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
      "frontRiseEase", "backRiseEase", "waistbandDepth", "thighEase", "kneeEase", "legOpening",
      "elasticWidth", "pocketOpening", "pocketAngle", "pocketBagDepth", "pocketDrop",
      "drawcordLength", "drawcordCutWidth", "drawcordExitSpacing", "drawcordExit",
    ]);
    const kneeDefinition = definitions.find(({ inputKey }) => inputKey === "knee")!;
    const knee = measurementHelpFor("jogger", kneeDefinition.id)!;
    expect(knee.recipeId).toBe("jogger");
    expect(knee.draftUse).toContain("52% of inseam");
    expect(knee.draftUse).toContain("no reviewed anatomical mapping");
    expect(knee.limits).toContain("52-percent-of-inseam");
    expect(knee.techniqueQualified).toBe(false);

    const casingDefinition = definitions.find(({ inputKey }) => inputKey === "waistbandDepth")!;
    const casing = measurementHelpFor("jogger", casingDefinition.id)!;
    expect(casing.inputKind).toBe("option");
    expect(casing.meaning).toContain("elastic and drawcord channel");
  });

  it("describes the accepted Tee source methods without prescribing a home procedure", () => {
    const chest = measurementHelpFor("tee", "body.chest-girth")!;
    expect(chest.limits).toContain("No. 041");
    expect(chest.limits).toContain("axilla-level Chest Circumference");
    expect(chest.limits).toContain("nipple-level Bust");
    expect(chest.limits).toContain("midpoint of the natural breathing cycle");
    expect(chest.limits).toContain("standing");
    expect(chest.limits).toContain("horizontal path");
    expect(chest.limits).toContain("level back line");
    expect(chest.limits).toContain("no qualified home/self capture");
    expect(chest.limits).toContain("Girth omits torso shape");
    expect(chest.limits).toContain("neckline is formula-derived, not measured");
    expect(chest.limits).toContain("Value unconfirmed; repeatability/fit unvalidated.");
    expect(chest.limits).toContain("Confidence NOT_ASSESSED.");
    expect(chest.limits).toContain("Korean Agency for Technology and Standards (KATS)");
    expect(chest.limits).toContain("KATRI report");
    expect(chest.limits).toContain("https://sizekorea.kr/human-info/meas-report?measDegree=8");
    expect(chest.limits).toContain("https://sizekorea.kr/support/pds/view?bbsCntntsSeq=725&currentPageNo=1");
    expect(chest.sources.map((source) => source.id)).toContain("SIZE-KOREA-8TH");
    expect(chest.techniqueQualified).toBe(false);

    const bicep = measurementHelpFor("tee", "body.upper-arm-girth")!;
    expect(bicep.limits).toContain("No. 036");
    expect(bicep.limits).toContain("relaxed right upper-arm circumference");
    expect(bicep.limits).toContain("axillary level");
    expect(bicep.limits).toContain("perpendicular to arm axis");
    expect(bicep.limits).toContain("arm hanging at side");
    expect(bicep.limits).toContain("midpoint of the natural breathing cycle");
    expect(bicep.limits).toContain("no qualified home/self capture");
    expect(bicep.limits).toContain("App records no capture side or posture");
    expect(bicep.limits).toContain("sleeve fit unvalidated");
    expect(bicep.limits).toContain("Value unconfirmed; repeatability/fit unvalidated.");
    expect(bicep.limits).toContain("Confidence NOT_ASSESSED.");
    expect(bicep.limits).toContain("Korean Agency for Technology and Standards (KATS)");
    expect(bicep.limits).toContain("KATRI report");
    expect(bicep.limits).toContain("https://sizekorea.kr/human-info/meas-report?measDegree=8");
    expect(bicep.limits).toContain("https://sizekorea.kr/support/pds/view?bbsCntntsSeq=725&currentPageNo=1");
    expect(bicep.sources.map((source) => source.id)).toContain("SIZE-KOREA-8TH");
    expect(bicep.techniqueQualified).toBe(false);

    const fittedChest = measurementHelpFor("fitted", "body.chest-girth")!;
    expect(fittedChest.limits).toContain("Open gate G-chest-path");
    expect(fittedChest.sources.map((source) => source.id)).not.toContain("SIZE-KOREA-8TH");
  });

  it("cites only directly supporting sources with a fit-disclaiming scope", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.sources.length).toBeGreaterThanOrEqual(3);
        for (const source of entry.sources) {
          expect(ALLOWED_SOURCE_IDS.has(source.id)).toBe(true);
          expect(source.scope.toLowerCase()).toContain("does not validate");
        }
      }
    }
    // Waist disagreement is evidenced by two distinct sites, not one authoritative path.
    const trouserWaist = measurementHelpFor("trouser", "body.girth-at-wear-line")!;
    expect(trouserWaist.sources.map((source) => source.id)).toContain("S06");
    expect(trouserWaist.sources.map((source) => source.id)).toContain("S08");
    expect(trouserWaist.limits.toLowerCase()).toContain("not interchangeable");
    // Tank shoulder input is disclosed as not consumed by its pattern block.
    const tankShoulder = measurementHelpFor("tank", "body.shoulder-breadth")!;
    expect(tankShoulder.draftUse.toLowerCase()).toContain("does not read this value");
    expect(tankShoulder.draftUse.toLowerCase()).toContain("follows the strap point");
    const teeShoulder = measurementHelpFor("tee", "body.shoulder-breadth")!;
    expect(teeShoulder.meaning).toContain("lateral borders of the left and right acromial processes");
    expect(teeShoulder.sources.map((source) => source.id)).toContain("CDC-NHANES-III");
    expect(teeShoulder.limits).toContain("examiner-operated sliding calipers");
    expect(teeShoulder.limits).toContain("reports biacromial breadth to 0.1 cm");
    expect(teeShoulder.limits).toContain("https://wwwn.cdc.gov/nchs/Data/Nhanes3/Manuals/anthro.pdf");
    expect(teeShoulder.qualificationNote).toContain("gives no measuring steps and claims no fit");
    // Skirt guided range keeps the Maxi contradiction visible without clamping.
    const skirtLength = measurementHelpFor("skirt", "target.skirt-waistline-to-hem")!;
    expect(skirtLength.guardrailNote).toContain("40–100 cm");
    expect(skirtLength.limits.toLowerCase()).toContain("100 to 120");
    expect(skirtLength.limits.toLowerCase()).toContain("no automatic changes");
    // Sleeve and trouser stations preserve the Slice 245 executed dispositions.
    expect(measurementHelpFor("tee", "target.sleeve-cap-to-hem")!.draftUse).toContain("23.79");
    expect(measurementHelpFor("trouser", "target.finished-thigh-girth")!.draftUse).toContain("33 summed one-leg");
    expect(measurementHelpFor("trouser", "target.trouser-finished-inseam")!.draftUse).toContain("78.42");
    expect(measurementHelpFor("woven-shirt", "body.neck-base-girth")!.draftUse).toContain("51.55");
    expect(measurementHelpFor("woven-shirt", "target.top-hps-to-hem")!.limits)
      .toContain("blocks continuation when the hip station falls below the hem");
  });

  it("contains no invented procedure, ease, target, or fit-validation copy", () => {
    for (const recipe of GARMENTS) {
      for (const definition of getFieldDefinitions(recipe.name)) {
        const text = bodyTextOf(recipe.name, definition.id);
        for (const fragment of FORBIDDEN_PROCEDURE_FRAGMENTS) {
          expect(text).not.toContain(fragment);
        }
        for (const claim of FORBIDDEN_POSITIVE_CLAIMS) {
          expect(text).not.toContain(claim);
        }
        // Concise novice copy: no dossier dump in any single entry.
        const entry = measurementHelpFor(recipe.name, definition.id)!;
        expect(entry.meaning.length).toBeLessThan(300);
        expect(entry.draftUse.length).toBeLessThan(600);
        expect(entry.limits.length).toBeLessThan(600);
        expect(entry.guardrailNote.length).toBeLessThan(300);
      }
    }
  });

  it("exposes an immutable lookup", () => {
    expect(Object.isFrozen(MEASUREMENT_HELP)).toBe(true);
    for (const recipe of GARMENTS) {
      const byField = MEASUREMENT_HELP[recipe.name]!;
      expect(Object.isFrozen(byField)).toBe(true);
      for (const definition of getFieldDefinitions(recipe.name)) {
        const entry = byField[definition.id]!;
        expect(Object.isFrozen(entry)).toBe(true);
        expect(Object.isFrozen(entry.sources)).toBe(true);
      }
    }
  });

  it("uses cap-base sleeve-length meaning for F06 without changing legacy fitted wording", () => {
    const generic = measurementHelpFor("fitted", "target.sleeve-cap-to-hem")!;
    const f06 = measurementHelpFor("fitted", "target.sleeve-cap-to-hem", FITTED_CAP_SLEEVE_ENTRY_ID)!;

    expect(generic.label).toBe("Sleeve length (cap to hem target)");
    expect(generic.limits).toContain("D-01");
    expect(f06.label).toBe("Sleeve length below modeled cap base");
    expect(f06.meaning).toContain("modeled cap base to the hem");
    expect(f06.draftUse).toContain("separate sleeve-length POM adds the solved cap height");
    expect(f06.guardrailNote).toContain("8–10 cm in 1 cm steps");
    expect(f06.limits).not.toContain("D-01");
    expect(f06.limits).toContain("physical fit is unvalidated");
  });

  it("uses the F07 digital style boundary without implying anatomical sleeve placement", () => {
    const generic = measurementHelpFor("fitted", "target.sleeve-cap-to-hem")!;
    const f07 = measurementHelpFor("fitted", "target.sleeve-cap-to-hem", FITTED_THREE_QUARTER_SLEEVE_ENTRY_ID)!;

    expect(f07.label).toBe("Sleeve length below modeled cap base");
    expect(f07.meaning).toContain("F07 digital sleeve-length target below the modeled cap base");
    expect(f07.draftUse).toContain("separate sleeve-length POM also includes solved cap height");
    expect(f07.limits).toContain("does not guarantee an elbow-to-wrist endpoint");
    expect(f07.guardrailNote).toContain("34–44 cm in 1 cm steps");
    expect(f07.limits).not.toContain("D-01");
    expect(generic.label).toBe("Sleeve length (cap to hem target)");
  });
});
