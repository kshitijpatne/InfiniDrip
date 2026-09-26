# EPIC-16 G03 — Measurement-help source audit (M01 evidence dossier)

**Status:** Research only. No implementation, product copy, recipe/geometry change, or fit claim is authorized by this document.
**Slice/objective:** EPIC-16 G03, supporting M01. Evidence dossier on what measurement guidance can responsibly be shown for the seven existing InfiniDrip recipes.
**Repository start:** Slice 244 commit `433aeee`.
**Authoritative inputs read:** `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/research/epic14/C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md`, `docs/planning/EPIC-16-ADMISSION.md`, plus `src/drafting/measurements.ts`, `src/drafting/recipe.ts`, `src/drafting/shirt-contract.ts`, `src/drafting/trouser-contract.ts`, `src/ui/controls.ts`, `src/ui/field-provenance.ts` (for current code facts only).
**Access date for all external sources:** 2026-09-26. Every URL below was requested directly on that date; the per-source record states what the fetch returned.
**Rule applied throughout:** a search-result snippet is not evidence. Only content returned by a direct fetch is cited as supporting a claim. Anything else is recorded as an access limitation.

## 1. Method and source-qualification rule

1. For each C03 `BODY_MEASURE` field in the seven recipes, the audit looked for free, publicly accessible primary or authoritative sources: official standards scope pages, government agency procedures, peer-reviewed open-access studies, and university/nonprofit educational guides.
2. A source's stated procedure is quoted or paraphrased separately from this dossier's interpretation. Interpretation sentences are marked with "Interpretation:".
3. A scope or landing page is never treated as establishing a detailed procedure. Paywalled standard text was not reproduced or claimed.
4. Per `docs/planning/EPIC-16-ADMISSION.md` §3, M01 may give anatomical landmarks, posture, measuring path, or technique only when supported by an accepted source or qualified review. A sewing-education guide alone is not a qualified apparel-measurement review, so it can support plain-language field explanations but not an authoritative capture procedure.
5. Current-repo facts (field IDs, recipe consumers, guardrails, `STANDARD_M`) come from the source files listed above, not from external sources.

## 2. Source catalog (directly checked 2026-09-26)

### S01 — ISO 8559-1:2017 scope page (supports scope only)

- URL: <https://www.iso.org/standard/61686.html>
- Publisher: International Organization for Standardization (ISO).
- Publication date visible: 2017-03 (Edition 1). Page states the standard was last reviewed and confirmed in 2026 (lifecycle entry 2026-06-30, "International Standard confirmed").
- Access: full page fetched successfully.
- What it actually supports: ISO 8559-1:2017 exists; it is apparel-specific ("Size designation of clothes — Part 1: Anthropometric definitions for body measurement"); its abstract says it provides anthropometric measurement descriptions usable as a basis for physical and digital anthropometric databases and a guide for taking measurements, aimed at population market segments, size/shape profiles, garment types, and fit mannequins. Full text costs CHF 204.
- What it does not support: no field-level landmark, path, posture, or tape procedure (full text not licensed; abstract only). It must not be cited as the source of any M01 measuring step.

### S02 — ISO 7250-1:2017 scope page (access limitation)

- URL: <https://www.iso.org/standard/65246.html>
- Publisher: ISO.
- Access: direct fetch returned HTTP 403 on 2026-09-26. No page content verified by this audit.
- Treatment: this dossier makes no claim about the page's wording. The characterization of ISO 7250-1 as a broader technological-design measurement framework is carried over from the C03 record only, and is labeled as repo-sourced, not independently verified here.

### S03 — ASTM D5219-25 scope page (supports scope only)

- URL: <https://store.astm.org/d5219-25.html>
- Publisher: ASTM International.
- Version/date visible: D5219-25, Active; "Last Updated: Sep 11, 2025". Price $80.00.
- Access: full page fetched successfully.
- What it actually supports: D5219 is a "compilation of terminology related to the body dimensions for apparel sizing"; terms are listed alphabetically "regardless of whether they are horizontal or vertical measurements". Full standard is sold separately (16 pages, Book of Standards Vol. 07.02).
- What it does not support: no definitions, landmarks, or procedures (scope paragraph only). It must not be cited as the source of any M01 measuring step or term definition.

### S04 — NISTIR 5411 landing page and free PDF (supports schema/history, not procedure)

- Landing URL: <https://www.nist.gov/publications/body-dimensions-apparel>
- Free PDF (linked from landing via DOI): <https://doi.org/10.6028/NIST.IR.5411>
- Publisher: U.S. National Institute of Standards and Technology (NIST), Manufacturing Engineering Laboratory. Author: Yung-Tsun T. Lee.
- Dates visible: published January 1, 1994; landing page updated November 10, 2018.
- Access: landing page fetched successfully; its abstract verified. The PDF itself was not text-extracted in this audit, so all statements below rest on the verified abstract, not on full-text reading.
- What it actually supports: NISTIR 5411 is a free compilation of body dimensions used in manufacturing and fitting apparel, produced by comparing five body-measurement reports including national and international sizing-standard documentation; it was intended as a basis for made-to-measure pattern-making information models and future surveys/standards. Its abstract explicitly frames definitions, body-type classifications, measurement techniques, target populations, and database management as open research topics, and notes U.S. sizing data then relied on 1930s USDA data.
- What it does not support: it is a 1994 historical compilation, not a current population dataset and not a substitute for an approved capture protocol. It must not be cited as validating any current InfiniDrip field definition or guardrail.

### S05 — CDC NHANES procedure-manuals index (supports existence and provenance of S06/S07 sources)

- URL: <https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/manuals.aspx?Cycle=2025-2026>
- Publisher: CDC National Center for Health Statistics.
- Access: page fetched successfully. It confirms these manuals are the protocol for NHANES, developed for interviewer/examiner training, and that "all correct procedures, policies, and standards are comprehensively detailed" in them.
- Treatment: the actual anthropometry procedure text used in this audit comes from the freely accessible PhenX reproductions S06/S07 (which name the NHANES Anthropometry Procedures Manual sections as their source). The 2021 NHANES Anthropometry PDF itself returned binary content through this audit's fetch client and is cited only for existence/provenance, not for procedure wording.

### S06 — PhenX Toolkit: Waist Circumference NHANES protocol (verified procedure, health-surveillance context)

- URL: <https://www.phenxtoolkit.org/protocols/view/21604>
- Publisher: PhenX Toolkit (maintained by RTI International); protocol source named as CDC National Center for Health Statistics, NHANES Anthropometry Procedures Manual 2021–2023, Section 3.4.8.
- Dates visible: protocol release September 16, 2024; Steering Committee review October 2023. Page retrieved September 26, 2026 (page footer).
- Access: full page fetched successfully; freely available, permission not required.
- Stated procedure (source's words, paraphrased tightly): abdominal (waist) circumference for ages 2+ is measured at the uppermost lateral border of the ilium: examiner stands on the participant's right, palpates the right ilium, marks a horizontal line just above the uppermost lateral border, crossed at the midaxillary line; arms crossed with hands on opposite shoulders ("hug" position); tape in a horizontal plane at the mark, checked parallel to the floor via wall mirror, snug without compressing skin, zero end below the measured section; read to nearest 0.1 cm at end of normal expiration; two-person examiner/recorder team.
- Interpretation: this supports naming an iliac-crest waist site, a horizontal tape plane, a snug-not-compressing tape tension, expiration timing, 0.1 cm precision, and assisted (two-person) measurement. It does not support a garment wear line, a natural-waist definition, self-measurement equivalence, or any InfiniDrip waist mapping. The PhenX page itself warns this iliac-crest site reads several centimeters larger than midpoint/umbilicus sites and "should not be used to calculate a waist-to-height ratio".

### S07 — PhenX Toolkit: Hip Circumference protocol (verified procedure, health-surveillance context)

- URL: <https://www.phenxtoolkit.org/protocols/view/20803>
- Publisher: PhenX Toolkit (RTI International); protocol source named as CDC/NCHS NHANES Anthropometry Procedures Manual 2021–2023, Section 3.4.9 (via NHANES III lineage).
- Dates visible: protocol release September 16, 2024; Steering Committee review October 2023.
- Access: full page fetched successfully; freely available.
- Stated procedure (paraphrased): hip (buttocks) circumference for ages 12+ is the girth at the maximum protrusion of the buttocks: same crossed-arms position; recorder gathers/folds side seams of exam pants to minimize material and define the maximum protuberance in profile; examiner positions tape in a horizontal plane, mirror-checked parallel to the floor, snug; zero end below measured section; read to nearest 0.1 cm at end of normal expiration.
- Interpretation: this supports naming a maximum-buttocks-protrusion hip site, horizontal plane, snug tape, expiration timing, and 0.1 cm precision. It does not support front/back shape distribution, a garment seat mapping, self-measurement equivalence, or any InfiniDrip hip use.

### S08 — PhenX Toolkit: Waist Circumference NCFS midpoint protocol (verified procedure showing site disagreement)

- URL: <https://www.phenxtoolkit.org/protocols/view/21602>
- Publisher: PhenX Toolkit; protocol source named as Irish Universities Nutrition Alliance, National Children's Food Survey methodology (2003).
- Dates visible: protocol release March 27, 2009.
- Access: full page fetched successfully; freely available.
- Stated procedure (paraphrased): waist measured in duplicate with a non-stretch tape at the midpoint between the iliac crest (top of hip) and the bottom of the rib cage (10th rib), marked first; tape horizontal; nearest 0.1 cm; trained examiner; tip: if the rib is hard to palpate, have the participant breathe in deeply, locate the rib, and follow it down on exhalation. The page states midpoint readings run several centimeters smaller than iliac-crest (NHANES) readings and that "the exact site, ages, and protocols used in the reference data need to be carefully identified" and matched.
- Interpretation: paired with S06, this is direct evidence that "waist" has no single unqualified site: iliac crest vs. rib–crest midpoint differ by centimeters. M01 must therefore never present one waist path as the authoritative garment path. It also supports duplicate readings and non-stretch tape as generic good practice.

### S09 — Barrios et al. 2016, self-measured waist/hip/neck (verified open-access study, clinical context, not garment fit)

- URL: <https://pmc.ncbi.nlm.nih.gov/articles/PMC4855335>
- Publisher/journal: BMC Medical Research Methodology 2016, 16:49 (open access, CC BY 4.0). Authors: Barrios, Martin-Biggers, Quick, Byrd-Bredbenner (Rutgers University).
- Dates visible: received 2015-12-05; accepted 2016-04-22; published 2016-05-04.
- Access: full text fetched successfully.
- What it actually studied: n=41 mothers of young children (71% white, 78% bachelor's or higher) watched a <9-minute instructional video, assembled a paper tape from a downloaded PDF, and self-measured waist (at umbilicus), hips (fullest buttocks), and neck (halfway between collarbone and chin, at the larynx) in duplicate to nearest ½ inch in minimal/snug clothing after voiding, at end of normal expiration, using a mirror; technicians measured the same landmarks with Gulick tape.
- What it actually found: self-vs-technician ICCs 0.97 waist, 0.96 hip, 0.84 neck; home-vs-lab test-retest ICCs ≥0.87; mean self-technician differences small but neck showed systematic positive bias (~0.8 inch); ~80% of neck pairs within the authors' ±10% criterion vs 93–95% for waist/hip.
- Interpretation: this supports that brief video instruction plus a paper tape can produce repeatable self-measurements in a motivated small sample, and that neck self-measurement is the least reliable of the three. It does not support transfer to apparel paths (its waist site is the umbilicus; its neck site is mid-neck, explicitly not a neck base), to garment fit, to universal thresholds, or to populations unlike its sample. M01 may cite it only for "clear instructions help; neck self-measure needs extra care", never as validation of any InfiniDrip capture step.

### S10 — University of Arkansas, Teaching Apparel Production, Ch. 4 "Preparing for Pattern Selection" (verified educational guide, CC BY 4.0)

- URL: <https://uark.pressbooks.pub/teachingappareldesign/chapter/preparing-for-pattern-selection-teaching-apparel-production>
- Publisher/author: University of Arkansas Pressbooks; Sheri Deaton. License: CC BY 4.0. Book copyright 2023.
- Access: full chapter fetched successfully.
- What it actually states (procedure-adjacent wording, paraphrased): use a soft/flexible non-twisting tape, keep it straight and parallel to the floor for chest/hip/waist circumferences, wear tight-fitting clothing or typical undergarments, get a helper for hard measurements; bust/chest around the back over the fullest part (armpits for most men, nipple line for most women); waist around the smallest part, allowed to settle into the natural waistline near the belly button; shoulders as the distance between shoulder bones across the top of the back, tape parallel to the floor; hip/seat over the fullest part (≈7–9″ below waistline for most females, 7½″ for most men); inseam and outseam measured on well-fitting pants laid flat (inseam: crotch seam to leg bottom along inner seam; outseam: waistband to leg bottom along outer seam); men's neck around the base plus ½″ comfort; men's sleeve bent-arm from neck base across back over elbow to wrist; compare results to the pattern envelope, never depend on manufacturer sizing.
- Interpretation: this is the strongest free source found for plain-language garment-measurement explanations. It supports naming the fullest-chest path, the natural-waist/smallest-part path, the fullest-hip path, a bone-to-bone shoulder span, garment-based inseam/outseam checks, and generic tape/clothing/helper practice. It is a teaching text, not a qualified anthropometric review: its drop distances (7–9″), gendered level descriptions, and comfort additions are heuristics, not validated procedures, and it must not be presented as an authoritative capture guide. Its inseam/outseam methods measure existing garments, which aligns with InfiniDrip's finished-target semantics but does not validate any body measurement.

### S11 — Sewing & Craft Alliance, "Taking Body Measurements" (verified nonprofit educational page)

- URL: <https://www.sewing.org/learn_to_sew/taking-body-measurements.html>
- Publisher: Sewing & Craft Alliance (sewing.org). No publication date visible on the fetched page.
- Access: page fetched successfully.
- What it actually states: correct body measurements before pattern selection/alteration; use a non-stretch tape, twill tape/elastic at the waist, and record numbers; a helper ("sewing buddy") is generally needed for accuracy; ease concepts — wearing ease vs. design ease — with rules of thumb (wovens: bust +2–3″, waist +1–1½″, hip +2–3″; knits: bust +1–2″, waist +1″, hip +1–2″); crotch depth (rise) "measurement plus 1 inch, but varies for comfort"; the page's illustrations/instructions are "sufficient for altering patterns" but "drafting a pattern is more complicated and utilizes more measurements".
- Interpretation: this supports helper-assisted measurement, written recording, and the wearing/design-ease distinction in plain language. Its ease inches and crotch-depth-plus-inch are explicitly rules of thumb ("varies for comfort"), not standards, and must never appear in M01 as validated ease values. The page's own drafting disclaimer supports withholding fit-critical capture claims.

### S12 — WHO STEPS surveillance manual and WHO 2011 waist–hip report (access limitations)

- URLs: <https://cdn.who.int/media/docs/default-source/ncds/ncd-surveillance/steps/part3-section5.pdf> and <https://iris.who.int/handle/10665/44583>
- Access: the STEPS PDF returned binary (non-text) content through this audit's fetch client; the IRIS handle page returned only a bare repository shell ("DSpace") with no bibliographic content. No WHO procedure wording was directly verified by this audit.
- Treatment: this dossier draws no procedure claims from S12. The WHO midpoint waist site and posture/tape details are already covered by verified S08; any WHO-specific wording must be re-verified from a text-accessible copy before use. The known protocol-difference point (WHO midpoint vs. NHANES iliac crest) is evidenced by S06+S08, not by S12.

### S13 — W3C WCAG 2.2, Understanding SC 3.3.1 Error Identification (verified UI-behavior spec)

- URL: <https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html>
- Publisher: W3C Accessibility Guidelines Working Group. Page notes update June 12, 2026.
- Access: full page fetched successfully.
- What it actually states: when an input error is automatically detected, the item in error must be identified and the error described in text; crucially, "if a user enters a value that is too high or too low, and the coding on the page automatically changes that value to fall within the allowed range, the user's error would still need to be described to them". Color or icons may supplement but never replace the text description.
- Interpretation: this is primary-spec backing for InfiniDrip's no-silent-clamp rule and for M01's invalid-state copy (name the field, state the problem in text, describe the correction). It says nothing about anatomy.

### S14 — W3C WCAG 2.2, Understanding SC 3.3.2 Labels or Instructions (verified UI-behavior spec)

- URL: <https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html>
- Publisher: W3C Accessibility Guidelines Working Group. Page notes update March 9, 2026.
- Access: full page fetched successfully.
- What it actually states: labels or instructions must identify every input so users know what data is expected, including expected data formats/units when non-customary; enough information to complete the task without confusion, but not clutter.
- Interpretation: this backs M01's per-field label + unit + meaning + reference-frame copy and expected-format notes (cm, precision preserved). It says nothing about anatomy.

## 3. Per-field audit

Conventions: "C03 kind" uses the `field-provenance.ts` classification (which implements the C03 contract). "Consumers" are current recipe facts from `recipe.ts`, `shirt-contract.ts`, `trouser-contract.ts`. "M01 verdict" is one of: **procedure** (may show a capture procedure — not assigned to any field in this audit), **explanation-only** (may show a plain-language field explanation: meaning, reference frame, unit, what it affects, unresolved note — no landmark/posture/tape-path steps), or **withhold** (must not appear as a body-capture question; may appear only in the stated restricted form).

### F01 — `neck` (BODY_MEASURE; woven-shirt only)

- C03 kind / consumers: `body.neck-base-girth`, BODY_MEASURE, frame body. Consumed only by `woven-shirt` (`(neck + neckEase) / 4` quartering). Tee, Darted Tee, Tank, Polo derive their neckline from chest and do not consume it.
- Public-source support: naming a "neck base" landmark — weak partial support only. S10 gives a men's neck "around the base" plus ½″ comfort (a shirt-sizing heuristic, gendered, comfort-adjusted, not a reviewed body path). S09's verified neck site is mid-neck at the larynx — explicitly a different site and therefore evidence *against* treating any neck girth as interchangeable. S01/S03/S04 establish that apparel neck terminology exists but supply no path. No free source verified here defines the exact front/side/back neck-base path, head posture, or tape route for a woven-shirt body neck.
- Remains unverified: the entire neck-base path and posture; any mapping from body neck to the pattern neckline beyond the current unreviewed quartering formula.
- M01 verdict: **explanation-only for Woven Shirt; withhold procedure; withhold the field entirely as body input for Tee/Darted Tee/Tank/Polo** (state "this recipe does not use a neck measurement; its opening comes from a chest formula"). Never infer from chest, appearance, or gender. A finished neckline target may be offered only as an explicitly user-selected design value per C03, not as body neck.

### F02 — `chest` (BODY_MEASURE; all upper recipes)

- C03 kind / consumers: `body.chest-girth`, BODY_MEASURE, frame body. Consumed by Tee, Darted Tee, Tank, Polo, Woven Shirt (half-width `(chest + ease) / 4`; chest-derived neckline `chest / 20 + 2`).
- Public-source support: naming the landmark — partial. S10 supports "fullest part of bust/chest, tape around the back, parallel to the floor, tight clothing/helper" as educational practice, including that the level differs by body (armpits vs. nipple line in its wording). No verified source defines one exact horizontal level, front/back shape handling, or inhale/exhale state for a garment chest path; S06–S08's precision/posture discipline is health-surveillance, not garment, evidence.
- Remains unverified: the exact chest/bust path and tape plane for fit purposes; any bust-projection or torso-shape inference from the scalar; the chest-derived neckline as anything but an unreviewed formula.
- M01 verdict: **explanation-only**. May name the field "full chest/bust girth (fullest part)", unit cm, what it drives (panel widths plus a chest-derived neckline formula, plainly labeled as a calculation). Must retain the user's chosen plain-language label without gender inference, must not give step-by-step landmark/posture/tape instructions, and must state the neckline is calculated, not measured.

### F03 — `shoulderWidth` (BODY_MEASURE; all upper recipes except none — Tee, Darted Tee, Tank, Polo, Woven Shirt)

- C03 kind / consumers: `body.shoulder-breadth`, BODY_MEASURE, frame body. Consumed as straight horizontal pattern span (`shoulderWidth / 2`); across-shoulder POM generated from the block. Shoulder slope is a fixed 4 cm draft constant.
- Public-source support: naming a span — partial. S10 supports "shoulder bone to shoulder bone across the top of the back, tape parallel to the floor". No verified source defines exact endpoint localization (acromion vs. visual shoulder point), straight-span vs. surface-path distinction for the tape, posture repeatability, or slope.
- Remains unverified: endpoint landmarks and method; equivalence between any tape path and the pattern's straight span; slope personalization.
- M01 verdict: **explanation-only**. May name "shoulder-point to shoulder-point breadth", cm, and that the draft uses it as a straight span; must state the straight-span vs. tape-path distinction is unresolved and must not present armhole/shoulder fit as personalized.

### F04 — `bicep` (BODY_MEASURE; sleeved tops: Tee, Darted Tee, Polo, Woven Shirt)

- C03 kind / consumers: `body.upper-arm-girth`, BODY_MEASURE, frame body. Consumed via `bicep + ease/2` sleeve-width relation.
- Public-source support: none sufficient found in this audit. No verified free source names the sleeve block's body station, side, or arm posture. (NHANES mid-upper-arm circumference is a health measure at a marked midpoint and was not verified as a page in this audit; it is not cited and would not validate the garment station anyway.)
- Remains unverified: measured level, side, arm posture, tape plane, and the station mapping to the sleeve block.
- M01 verdict: **explanation-only, with sleeve-fit personalization withheld**. May name "upper-arm girth input used for sleeve width" and state the station/posture are unspecified; must not present the resulting sleeve as fit-validated. A finished sleeve-width target may be offered only as an explicitly user-selected value per C03.

### F05 — `waist` (BODY_MEASURE; Woven Shirt, Skirt, Trouser)

- C03 kind / consumers: `body.girth-at-wear-line`, BODY_MEASURE, frame body. Consumed at a body waist station (woven) and waist circumference with shared ease (skirt, trouser).
- Public-source support: naming a path — conflicting sites, which is itself the finding. S06 verifies the iliac-crest site with full procedure; S08 verifies the rib–crest midpoint site and states it reads centimeters differently; S10 teaches the natural-waist/smallest-part site for pattern sizing. All three are real, mutually inconsistent "waist" definitions; none is a garment wear line.
- Remains unverified: which line the garment sits at (natural waist vs. selected waistband line), the capture path at that line, and posture/clothing state for fit purposes.
- M01 verdict: **explanation-only, wear-line-first**. M01 must ask and record the intended garment waistline before accepting the value, keep any entered value unconfirmed, and must not substitute natural waist for a lower garment's worn line (or vice versa). No single authoritative waist path may be shown.

### F06 — `hip` (BODY_MEASURE; Woven Shirt, Skirt, Trouser)

- C03 kind / consumers: `body.girth-at-selected-seat-level`, BODY_MEASURE, frame body. Consumed for hip/seat width with shared ease.
- Public-source support: naming the path — partial. S07 verifies maximum-buttocks-protrusion site, horizontal plane, snug tape, expiration, 0.1 cm. S10 supports fullest-part practice with heuristic drops (7–9″ / 7½″). Neither supports front/back distribution, level selection rules, or a garment seat mapping.
- Remains unverified: the selected level and its method, the posture, and any relation between one girth and body surface shape or pattern geometry.
- M01 verdict: **explanation-only**. May name "girth at the selected fullest hip/seat level", cm, and that one girth does not encode shape; must use the same named level/posture/method as `hipDepth` and must not present hip fit as personalized.

### F07 — `hipDepth` (BODY_MEASURE; Woven Shirt, Skirt, Trouser)

- C03 kind / consumers: `body.wear-line-to-hip-level`, BODY_MEASURE, frame body. Consumed to place the hip station; trouser POM reports a geometry-derived "hip depth (body reference)" which is a calculation, not an observation.
- Public-source support: no verified procedure. S10's 7–9″/7½″ drops are pattern-size heuristics, not a reviewed vertical method with endpoints, reference (straight vs. surface), or posture. S07/S08 give no waist-to-hip vertical method.
- Remains unverified: both endpoints (must be the same wear line and hip level as F05/F06), direction, and tape/straightedge method.
- M01 verdict: **explanation-only**. May describe the concept (vertical distance between the selected wear line and the selected hip level) and require the shared references; must never combine a waist from one line with a depth from another, and must label the draft POM as calculated.

### F08 — `crotchDepth` (BODY_MEASURE; Trouser only)

- C03 kind / consumers: `body.seated-waist-to-seat-depth`, BODY_MEASURE, frame body. Consumed as the base for front/back rises plus separate rise-ease options; pattern POMs add waistband depth.
- Public-source support: none sufficient. S11's one-line "crotch depth (rise): measurement plus 1 inch, but varies for comfort" is an ease rule of thumb, explicitly comfort-variable — not a seated protocol. No verified source defines the seated surface, posture, waistband reference, or front/back balance handling.
- Remains unverified: the entire seated protocol and waistband reference; front/back rise distribution; crotch-curve shape.
- M01 verdict: **explanation-only, fit status blocked**. May name the field and state it seeds rise geometry through unreviewed scalar rules; must keep the value unconfirmed and separate from finished front/back rise, and must not describe trouser rise fit as established.

### F09 — `thigh` (future-schema GARMENT_MEASURE target; current code consumes it as finished thigh)

- C03 kind / consumers: `target.finished-thigh-girth`, GARMENT_MEASURE, frame finished-garment (per `field-provenance.ts`; the legacy code comment calling it a body circumference is the stale meaning C03 migrates away from). Consumed by Trouser as finished thigh `thigh + thighEase`; station is a fixed 2.5 cm offset from the back-crotch station.
- Public-source support: none found for a body-capture instruction at the pattern station. No verified source maps a generic "upper thigh" tape path to the fixed-offset pattern station.
- Remains unverified: the entire body-landmark-to-pattern-station mapping (C03: exploratory).
- M01 verdict: **withhold as body capture**. May appear only as a labeled finished-target control ("target finished thigh girth at the pattern station shown on the block") with its station displayed; must never be called a body thigh measurement or used for a fit claim.

### F10 — `knee` (future-schema GARMENT_MEASURE target; current code consumes it as finished knee)

- C03 kind / consumers: `target.finished-knee-girth`, GARMENT_MEASURE, frame finished-garment. Consumed by Trouser as finished knee `knee + kneeEase`; station is `backCrotchY + 0.52 × inseam` (pattern heuristic).
- Public-source support: none found for a body-capture instruction at the pattern station. No verified source defines knee posture/level for this mapping or validates the 52%-of-inseam station as anatomy.
- Remains unverified: posture, level, side/asymmetry policy, and the station mapping.
- M01 verdict: **withhold as body capture**. Same restricted form as F09: labeled finished-target control with station shown; never a body-knee capture; never anatomically registered.

### Non-body fields (for completeness; not BODY_MEASURE, included because M01 must label them distinctly)

- `armholeDepth` — PATTERN_PARAMETER (`pattern.target-underarm-drop`). Current code comment calling it body HPS-to-underarm is stale. M01 must show it only as a user-selected pattern target or visibly accepted block preset, never as a body question. No separate body HPS-to-underarm record exists.
- `sleeveLength` — GARMENT_MEASURE (`target.sleeve-cap-to-hem`). Finished cap-to-hem target. S10's bent-arm sleeve method is a body-arm method with a different reference frame and must not be substituted. Explanation-only.
- `inseam` — GARMENT_MEASURE (`target.trouser-finished-inseam`). Finished crotch-seam-to-hem target, not body inseam or outseam. S10's garment-flat inseam/outseam methods support describing a finished-target check on an existing pair in plain language; they do not support a body-inseam capture. Explanation-only.
- `length` — GARMENT_MEASURE with per-recipe meaning (`target.top-hps-to-hem` for tops; `target.skirt-waistline-to-hem` for skirt). Finished target, never body stature. Skirt carries the unresolved shared-control range conflict (see §4). Explanation-only.
- `ease`, `strapWidth`, `neckDrop`, `neckWidthEase`, and all recipe options — STYLE_CONTROL / design controls. S11's ease inches are rules of thumb, not standards; M01 must present only the repo's per-recipe ease behavior and the tank controls' per-side/total conventions, with no validated-ease language. Explanation-only.

## 4. C03 explicit traps — audit disposition

1. **Neck omitted for Tee/Darted Tee/Tank/Polo.** Confirmed in `recipe.ts` fields lists. M01 must not ask for, import, or fabricate a wearer neck value for these four recipes; copy must state the opening is chest-derived. Source basis: code fact + F01 finding (no verified neck-base path exists to substitute).
2. **Woven-shirt neck path unresolved.** F01 verdict stands: explanation-only, no procedure, no chest/appearance/gender inference.
3. **`armholeDepth` is a pattern target.** Confirmed consumer semantics (direct underarm-station control) vs. stale body comment. M01 must never present it as a captured body fact; a distinct `BODY_HPS_TO_UNDERARM` does not exist and may not be implied.
4. **`sleeveLength`/`inseam` are finished targets.** Confirmed by code comments and `field-provenance.ts`. M01 must keep body-arm and body-leg paths out of these controls; a body value may seed a finished target only through an explicit, visible, reviewed mapping — which does not exist, so no seeding copy may imply one.
5. **Trouser thigh/knee mappings remain exploratory.** F09/F10 verdicts stand: finished-target controls only, stations shown on the pattern, no anatomical registration, no fit claim.
6. **Skirt length shared-control range conflict.** Confirmed live: `controls.ts` caps shared `length` at 40–100 cm while the Maxi style label reaches 95–120 cm (per C03 §"Exact current style labels" and `field-provenance.ts` skirt capture boundary). M01 must resolve this visibly before guiding: the smallest safe boundary is to cap guided skirt-target entry at the shared guardrail, mark the 100–120 cm band as unavailable in the guided route until the contradiction is resolved by Codex, and never silently clamp a Maxi selection into range.
7. **STANDARD_M is not a person's values.** Confirmed: fixture (`neck 40, chest 100, shoulderWidth 45, bicep 38, length 70, armholeDepth 24, sleeveLength 22, waist 84, hip 100, hipDepth 20, crotchDepth 27, thigh 58, knee 40, inseam 78, ease 10, strapWidth 8, neckDrop 5, neckWidthEase 0`, all cm) with no population table, source dataset, event, user, date, or uncertainty. M01 must start body fields missing (or as an explicitly named, visibly `PRESET`-labeled starting choice the user accepts field by field); a blank required field must never borrow a STANDARD_M number. Current `field-provenance.ts` provenance labels (`PRESET`/`UNRESOLVED`/edit-time `recordedAt`) already implement this distinction and must be preserved, not relabeled as capture events.
8. **No gender inference, confidence score, fit claim, or silent correction.** No source in this audit supports inferring a measurement path from sex/gender, appearance, or size label (S10's gendered level wording is a teaching heuristic, not a rule, and must not be encoded). No source supports a confidence percentage or threshold — confidence stays `NOT_ASSESSED` everywhere, consistent with current code. No recipe passes a fit-qualified gate, so no passing check, POM, or "validated" state may be worded as fit evidence. All invalid input stays visible with a named correction path (S13 backs the no-silent-clamp behavior as spec-level practice).

## 5. All-seven-recipe matrix (exact field IDs + unresolved source gates)

Field IDs are verbatim from `recipe.ts` / `shirt-contract.ts` (`WOVEN_SHIRT_FIELDS`) / `trouser-contract.ts` (`TROUSER_FIELDS`). "Gate" = the unresolved source/qualified-review item that blocks a capture procedure for that field in M01. Non-body fields list their labeling duty instead of a gate.

| Recipe (stable id) | BODY_MEASURE fields consumed | Finished / pattern targets + style controls consumed | Unresolved source gates for this recipe's M01 route |
| --- | --- | --- | --- |
| Tee (`tee`) | `chest` (G-chest-path), `shoulderWidth` (G-shoulder-endpoints), `bicep` (G-bicep-station) | `length` (HPS–hem target), `sleeveLength` (cap–hem target), `armholeDepth` (pattern target only), `ease` (shared control) | G-chest-path: exact level/plane unreviewed; G-shoulder-endpoints: endpoint localization + straight-vs-surface unreviewed; G-bicep-station: level/side/posture undefined; neck not consumed (trap 1); chest-derived neckline is formula, not measurement |
| Darted Tee (`fitted`) | Same three as Tee | Same four as Tee; fixed 4 cm dart intake + proportion-derived apex (no body input) | Same three gates as Tee, plus: bust-point/shape and dart intake/position have no body source — "fitted" must not be worded as bust-fitted |
| Tank (`tank`) | `chest` (G-chest-path), `shoulderWidth` (G-shoulder-endpoints) | `length`, `armholeDepth` (pattern target only), `strapWidth`, `neckDrop`, `neckWidthEase` (design controls), `ease` | Same chest/shoulder gates; no bicep capture consumed; neckline is chest-derived + design values; no strap-width POM exists — strap copy must not imply pack verification |
| Polo (`polo`) | Same three as Tee | Same four as Tee + 8 options (`placketLength`, `placketWidth`, `standHeight`, `collarLeafDepth`, `standFrontRise`, `collarPointExtension`, `sideVentDepth`, `backHemDrop`) | Same three gates as Tee; collar/neck geometry is chest-derived, not neck-measured; options are construction values with UI guardrails, not tolerances |
| Woven Shirt (`woven-shirt`) | `neck` (G-neck-path), `chest` (G-chest-path), `shoulderWidth` (G-shoulder-endpoints), `bicep` (G-bicep-station), `waist` (G-waist-line), `hip` (G-hip-level), `hipDepth` (G-hipdepth-refs) | `length`, `sleeveLength`, `armholeDepth` (pattern target only), `ease` (site-coupled scalar) + 13 options (incl. `neckEase`, `buttonCount`, `buttonSpacing`, `frontOverlap`, `placketWidth`, `standHeight`, `collarLeafDepth`, `yokeDepth`, `pocketWidth`, `pocketHeight`, `sleeveBandDepth`, `sideVentDepth`, `hemTurn`) | G-neck-path: exact neck-base path/posture unreviewed (only body-neck consumer); G-waist-line: wear line unconfirmed, sites conflict (S06 vs S08 vs S10); G-hip-level: level/path/posture method-dependent; G-hipdepth-refs: shared endpoints + vertical method unreviewed; neck POM is pattern-derived (`neck + neckEase`), not a sewn-garment reading |
| Skirt (`skirt`) | `waist` (G-waist-line), `hip` (G-hip-level), `hipDepth` (G-hipdepth-refs) | `length` (waistline-to-hem target; RANGE CONFLICT — see §4.6), `ease` | Same waist/hip/hipdepth gates; straight dartless block for all style labels — silhouette names must not imply different geometries; hip depth has no output POM |
| Trouser (`trouser`) | `waist` (G-waist-line), `hip` (G-hip-level), `hipDepth` (G-hipdepth-refs), `crotchDepth` (G-seated-protocol) | `thigh`, `knee` (finished-target controls only — G-thigh-map, G-knee-map exploratory), `inseam` (finished seam target), `ease` (waist/seat control) + 11 options (incl. `frontRiseEase`, `backRiseEase`, `waistbandDepth`, `thighEase`, `kneeEase`, `legOpening`, `flyLength`, pocket controls) | G-seated-protocol: seated surface/posture/waistband reference unreviewed, front/back balance uncaptured; G-thigh-map: 2.5 cm fixed offset is a heuristic; G-knee-map: 52%-of-inseam station is a heuristic; finished inseam ≠ body inseam; grade run is not a personalized trouser grade |

Gate summary (10 open, 0 closed by this audit): G-chest-path, G-shoulder-endpoints, G-bicep-station, G-neck-path, G-waist-line, G-hip-level, G-hipdepth-refs, G-seated-protocol, G-thigh-map, G-knee-map. All seven recipes covered; every recipe has at least one open gate, so no recipe qualifies for procedure-level capture copy.

## 6. Recommended smallest safe M01 copy boundary

Without expanding G03, buying standards, or authoring unreviewed anatomical steps, M01 help text for each consumed field may contain only these five elements, all already representable in the current `field-provenance.ts` definition shape (label, meaning, captureBoundary, unit, guardrail basis):

1. What the value means *in this recipe* and its reference frame (body input vs. finished-garment target vs. pattern target vs. style control), using the recipe-specific semantic IDs already in code.
2. The unit (cm), that entered precision is preserved, and the control's existing guardrail restated as a software guardrail ("existing UI guardrail, not an industry standard") — never as a validity or fit range.
3. What the value affects in plain language (named draft behavior/POM it feeds), with calculations labeled as calculations (chest-derived neckline, pattern-derived POMs) and never as sample or sewn-garment data.
4. The explicit unresolved note for that field (the captureBoundary text), including: which references must match (wear line = hip level = depth endpoints), which mappings are heuristics (thigh/knee stations, chest neckline, fixed slope/dart), and which inputs the recipe ignores (neck for four recipes).
5. The provenance label: entered vs. preset vs. carried value, with STANDARD_M values always shown as "built-in digital starting value; not your measurement" until the user replaces them.

Expressly excluded from M01 copy: landmark/path/posture/tape-step instructions, breath-hold or stance directions, site selection between conflicting waist/neck sites, numeric discrepancy thresholds, averaged repeats (repeats shown separately, user chooses — supported as practice by S08 and S13's correction-path principle), ease inches from S11, drop distances from S10, comfort additions, gendered sizing language, confidence language, and any fit/production wording. The skirt 100–120 cm band and thigh/knee body framing stay out of the guided route until their gates close.

## 7. External UI cues for asking/recording measurements (factual; separate from anatomical evidence)

These concern form behavior only and carry no anatomical authority:

1. **Label every input with meaning, unit, and expected format** (S14): each M01 field shows its name, cm unit, reference frame, and entry expectations (e.g., decimals kept, no rounding to step). Long guidance is permissible on focus rather than cluttering the page.
2. **Describe every detected problem in text and never silently fix it** (S13): missing, out-of-guardrail, conflicting, and unresolved states each get a named, field-specific message with the correction action. Auto-moving a value to a boundary counts as a change the UI must announce; InfiniDrip's +/-as-explicit-correction model already matches this.
3. **Use a non-stretch tape, mark the waist line, write values down, and get a helper** (S10, S11): both educational sources agree on helper-assisted measurement, a tape that will not stretch, a waist marker (twill tape/elastic), and recording numbers immediately. These are record-accuracy habits, not capture procedures, and are safe as generic "how to get a steadier number" tips.
4. **Wear tight-fitting clothing or typical undergarments; keep the tape straight, untwisted, and level for girths** (S10): safe as generic preparation tips; they do not define any field's path.
5. **Take duplicates and keep both readings visible; let the user choose or remeasure** (S08's duplicate-measurement protocol; S09's duplicate-to-½-inch home protocol): supports M01's repeat-handling interaction (show delta, no averaging, no invented threshold). The specific 1.0 cm / 0.5 cm third-measure rules on the PhenX pages are research reliability rules for trained teams and must not be copied as product thresholds.
6. **Record the exact method with the value** (S06/S07/S08 all bind site + tool + unit + date to the reading; PhenX warns to match reference data to the exact site): supports M01's provenance capture (method, unit, precision, date, repeats) and the rule against mixing sites (e.g., waist from one line with depth from another).
7. **Instructions improve self-measurement, but evidence does not transfer across sites or populations** (S09: n=41, motivated sample, umbilicus/mid-neck sites, clinical purpose): supports usability-testing M01 copy before calling any guide "accepted", and forbids generalizing the study's ICCs into product accuracy claims.

No app, color, artwork, sizing-chart, or garment-fit content was researched for this section per the non-goal constraint.

## 8. Remaining evidence gaps and verification log

### Remaining gaps (for Codex disposition; nothing here blocks research closure)

- All 10 field gates in §5 remain open: no accepted source or qualified review for any fit-critical capture procedure.
- No free primary source found for bicep station/posture, hipDepth vertical method, seated crotch-depth protocol, or thigh/knee station mapping.
- ISO 7250-1 scope page unverified (403); WHO STEPS/IRIS pages unverified (binary/shell responses). Re-verify from text-accessible copies before citing.
- The sewing.org linked worksheet PDF (`taking_body_measurements.pdf`) was not separately fetched; only the verified HTML page is cited.
- Whether UArk Ch. 4 plus a qualified technical-designer review suffices to close explanation-level wording (not procedures) is a Codex/maintainer decision, not made here.

### Verification log

- 14 sources checked (S01–S14) by direct fetch on 2026-09-26: 12 full-content or landing-page verifications (S01, S03, S04-landing, S05, S06, S07, S08, S09, S10, S11, S13, S14), and 3 access limitations recorded (S02, S04-PDF full text, S12). S04's limitation applies only to its linked PDF; its landing-page abstract was verified.
- No paywalled text reproduced. No claim rests on a search snippet or model memory. Where this dossier repeats C03 characterizations (S02 scope gloss, S04 full-text details, recipe histories), they are labeled repo-sourced.
- Current-code facts verified by direct read: `src/drafting/measurements.ts` (18 keys, STANDARD_M values), `src/drafting/recipe.ts` (tee/fitted/tank/polo/skirt fields), `src/drafting/shirt-contract.ts` (`WOVEN_SHIRT_FIELDS`, 11 keys), `src/drafting/trouser-contract.ts` (`TROUSER_FIELDS`, 8 keys), `src/ui/controls.ts` (field labels, ranges, steps), `src/ui/field-provenance.ts` (semantic kinds, capture boundaries, provenance model).
- Tests run: none (per task: run no tests). No files other than this dossier created or modified; nothing committed.
