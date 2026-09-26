# EPIC-16 G03 — One-size recipe input-to-draft mapping audit (M01/M02 support)

**Status:** Read-only contributor audit for Codex review. It is evidence and recommendations, not a decision record.
**Base:** Slice 244 commit `433aeee`, clean worktree. No code, test, board or shared planning file was changed.
**Contributor:** Claude Code CLI, model `claude-opus-5-5`. The requested effort is high; the active effort level cannot be confirmed from inside the session.
**Scope:** The seven current recipes (Tee, Darted tee, Tank, Polo, Woven shirt, Skirt, Trouser) compared against:

- the accepted C03 contract (`docs/research/epic14/C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md`)
- the EPIC-16 admission (`docs/planning/EPIC-16-ADMISSION.md`)

**Out of scope:** implementation, product copy, fit or production claims, standards claims, and the findings the admission defers (§8).

## 0. Evidence labels and execution boundary

Every important statement carries one of these tags.

| Tag | Meaning |
| --- | --- |
| **[CODE]** | A fact read directly from source at `433aeee`, cited as `path:line`. |
| **[TEST]** | A value or relationship asserted by an existing test, cited as `path:line`. The test was read, not run. |
| **[C03]** | A decision or statement in the accepted C03 contract, cited by line. |
| **[ADM]** | A rule in `docs/planning/EPIC-16-ADMISSION.md`, cited by line. |
| **[INF — UNEXECUTED]** | An inference from code (arithmetic or geometric reasoning about the cited formulas). No code was executed; this worktree has no `node_modules`, and the handoff forbids running tests. Codex must confirm each of these by evaluating the cited function before treating it as fact. §10 lists them all. |
| **[REVIEW]** | A question that needs a qualified technical designer or expert decision. Code or C03 alone cannot settle it. |
| **[REC]** | A recommendation, kept separate from evidence. |

The report contains no expected numeric outputs. Every number it quotes is one of:

- a code constant
- an existing test assertion
- a C03 value
- a symbolic formula taken from code

## 1. Source and file inventory

### Governing documents read

| Document | Used for |
| --- | --- |
| `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md` (lines 1–63), `ARCHITECTURE.md` | Authority order, current status, digital-only boundary |
| `docs/PROJECT-DECISIONS.md:718-749`, `:899-916` | One-size-first decision; manual-findings handling |
| `docs/planning/EPIC-16-ADMISSION.md` (whole file) | M01/M02 rules and slice boundaries |
| `docs/research/epic14/C03-MEASUREMENT-AND-DONOR-CAPTURE-CONTRACT.md` (lines 1–699) | Field semantics, recipe tables, traps |
| `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md` | Scoping MQF-001, -013, -014 and -015; deferring the rest |
| `docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md:33-103` | The 85-input matrix and the P4 tank `shoulderWidth` gap |
| `docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md:55-74`, `:136-138`, `:194-196` | Tank shoulder/strap boundary; woven `hemTurn` |
| `docs/research/garments/TROUSER-RESEARCH.md:128`, `:328-342` | The Slice 96 quarter-per-panel decision; the thigh landmark source note |

### Code files checked (all at `433aeee`)

**Drafting** (`src/drafting/`):
- Shared: `measurements.ts`, `recipe.ts`, `facets.ts`, `bodice.ts`, `sleeve.ts`, `neckline.ts`, `armhole.ts`, `grading.ts`, `options.ts`, `pom.ts`
- Tee and Darted tee: `tshirt.ts`, `tshirt-pom.ts`, `tshirt-grade.ts`, `tshirt-guidance.ts`, `fitted.ts`, `fitted-tables.ts`, `dart.ts`
- Tank and Polo: `tank.ts`, `polo.ts`; only the entry point of `polo-collar.ts` was checked
- Woven shirt and Skirt: `shirt-contract.ts`, `shirt.ts`, `skirt.ts`, `waistband.ts`
- Trouser: `trouser-contract.ts`, `trouser.ts`, `trouser-tables.ts`, `trouser-guidance.ts`

**Guidance and style:** `src/guidance/plausibility.ts`, `src/style/style.ts`.

**UI and persistence** (`src/ui/`):
- `controls.ts`, `field-provenance.ts`, `pattern-measurements.ts`
- `view.ts`, lines 110–310
- `app.ts`, targeted ranges cited below, plus a grep for `measurements =` assignments
- `persist.ts`, lines 1–240
- `project-records.ts:143-159`, `project-workflow.ts:494-547`

**Render** (tank strap parity only): `src/render/garment.ts:64-91`, `src/render/body.ts:103-175`.

**Export:** `src/export/regression.test.ts`, plus the `gradeRun` call sites `techpack.ts:497,535`, `projector.ts:107` and `marker.ts:27`.

**Tests read as evidence (not run):** `src/drafting/pom.test.ts`, `src/drafting/trouser.test.ts`, `src/drafting/tank.test.ts:95-101,167`.

## 2. Shared engine facts

- **[CODE] One shared record.** `Measurements` is a single object of 18 numeric-centimetre fields (`src/drafting/measurements.ts:5-29`). Every recipe draft takes the whole object plus optional recipe options (`src/drafting/recipe.ts:94-96`).
- **[CODE] No reset on garment switch.** The UI keeps one `measurements` value, initialised from `STANDARD_M` (`src/ui/app.ts:270`). It is reassigned only on field input, style load, recovery and history restore (`app.ts:2603,3407,3728,3768`). The garment switch (`app.ts:2398-2440`) changes `recipe` without reassigning `measurements`, so a value typed for one recipe carries into the next.
- **[CODE] Shared upper-body derivations** (`src/drafting/measurements.ts:51-61`):
  - `chestWidthHalf = (chest + ease)/4`
  - `shoulderHalf = shoulderWidth/2`
  - `neckWidthHalf = chest/20 + 2`
  - `frontNeckDepth = neckWidthHalf + 1`
  - fixed `backNeckDepth = 2.5` and `shoulderSlope = 4`
- **[CODE] Knit-bodice geometry** (`src/drafting/bodice.ts:59-111`):
  - HPS is at `y=0`.
  - Underarm is at `(chestWidthHalf, armholeDepth)`; the hem is at `y=length` (`:70-72`).
  - The sleeved shoulder point is `(shoulderHalf, 4)` (`:83`).
  - The armhole control points use fixed factors 0.45, −2 and −3 (`:88-89`).
- **[CODE] Shared sleeve** (`src/drafting/sleeve.ts:70-91`):
  - width is `bicep + ease×0.5` (`:71`)
  - cap height is binary-searched so the cap equals the measured armhole plus `CAP_EASE` 1.5 (`:18`, `:72`)
  - hem taper is fixed at 3 per side (`:73`)
  - **the hem is at `y = capHeight + sleeveLength`** (`:74`), with the cap top at `y=0` (`:29`)
- **[CODE] POMs are read from the drafted block** (`src/drafting/pom.ts:44-62`). `specSheet` rounds to 0.1 cm (`:70-82`). A POM tolerance is a code property, not a sourced tolerance (C03 `:459-462`).
- **[CODE] Grading** adds per-step deltas and re-drafts every size (`src/drafting/grading.ts:35-78`). The run is XS/S/M/L/XL at steps −2…+2, and base step 0 is labelled “M” (`src/drafting/tshirt-grade.ts:18-24`).
- **[CODE] Option resolvers substitute defaults.** `resolvePoloOptions`, `resolveWovenShirtOptions` and `resolveTrouserOptions` replace any non-finite option with its default (`polo.ts:59-74`, `shirt-contract.ts:60-71`, `trouser-contract.ts:45-56`). The UI stores an emptied option as `NaN` (`app.ts:2622-2627`), and readiness is blocked by `inputErrors` (`app.ts:845-856`, `:863-872`). Not verified: whether the live preview in `draw()` (`app.ts:1399`) calls `recipe.draft` while such an option is invalid.
- **[CODE] Unknown recipe IDs fall back to Tee.** `garmentByName` returns Tee for an unrecognised ID (`recipe.ts:491-494`).

## 3. Per-recipe input tables

Column meanings:

- **C03 kind** follows C03 and `src/ui/field-provenance.ts:102-198`.
- **Geometry-required** means the current pattern geometry reads the value. It does not mean the value is fit-qualified (C03 `:313-315`).
- Units are cm unless stated.

### 3.1 Tee — `TEE` (`recipe.ts:158-189`)

`draftTshirt` composes the grammar with two `bodice` nodes and a `sleeve` fitted to the measured armhole (`tshirt.ts:56-79`). The Tee has no options. It grades by `TSHIRT_GRADE` (`tshirt-grade.ts:8-15`) and reports the 10 `TSHIRT_POMS` rows (`tshirt-pom.ts:16-72`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `chest` | Panel half-width `(chest+ease)/4` at underarm, side and hem (`bodice.ts:70-72`). Neck half-width `chest/20+2`; front neck depth `chest/20+3` (`measurements.ts:52,57`). | BODY_MEASURE (C03 `:118`) | Yes | **Body chest (finished)** = 4 × underarm x = `chest+ease` [TEST `pom.test.ts:36-39`]. **Neck width** = 2 × (`chest/20+2`) [TEST `pom.test.ts:21-26`]. **Front neck drop**. Indirectly: Armhole, and the sleeve cap through armhole length. | One scalar drives body width and a chest-derived neckline (C03 `:118`). No neck input exists [CODE `recipe.ts:161`]. Guidance: `armholeDepthCheck` uses `chest/8` (`tshirt-guidance.ts:62-73`); `shoulderCheck` (`:76-87`); ratios (`plausibility.ts:101-108`). |
| `shoulderWidth` | Shoulder point x = `shoulderWidth/2` at fixed slope 4 (`bodice.ts:83`) | BODY_MEASURE (C03 `:119`) | Yes | **Across shoulder** = `shoulderWidth` [TEST `pom.test.ts:41-44`]; **Shoulder seam**; armhole length, and through it cap height | Treated as a straight horizontal span. The slope is a fixed constant, not a captured value (C03 `:119`, `:323`). |
| `bicep` | Sleeve width = `bicep + ease/2` (`sleeve.ts:71`) | BODY_MEASURE; station unresolved (C03 `:120`, `:573`) | Yes | **Sleeve bicep width** = sleeve width. **Sleeve hem** = sleeve width − 6 (`sleeve.ts:73-77`, `tshirt-pom.ts:62-71`). Cap height. | `armholeMatch` guidance routes to field `bicep` (`tshirt-guidance.ts:20-46`). The code stores no body station for this girth. |
| `length` | Hem at `y=length` from HPS (`bodice.ts:71-72`) | GARMENT_MEASURE target `target.top-hps-to-hem` (C03 `:121`; `field-provenance.ts:123-127`) | Yes | **Body length (HPS–hem)** = `length` [TEST `pom.test.ts:28-32`] | Used by style bands (`style.ts:22-32`). Plausibility warns above 95 (`plausibility.ts:40`); the UI max is 100 (`controls.ts:20`). |
| `armholeDepth` | Underarm station y (`bodice.ts:70`) and armhole control points (`:88-89`) | PATTERN_PARAMETER `TARGET_UNDERARM_DROP` (C03 `:122`, `:574`) | Yes | No direct POM. It feeds **Armhole (front + back)**, cap height, and therefore **Sleeve length (cap–hem)**. | Conflicting labels: the source comment says body (`measurements.ts:11`), `facets.ts:41` says finished (shown by the UI, `view.ts:155-157`), and only the definition label says “Target underarm drop” (`field-provenance.ts:128-133`). See D-14. |
| `sleeveLength` | Hem y = **`capHeight + sleeveLength`** (`sleeve.ts:74`) | GARMENT_MEASURE target, “cap top to sleeve hem” (C03 `:123`; `field-provenance.ts:134-139`) | Yes | **Sleeve length (cap–hem)** = span from cap top (`y=0`) to hem = `capHeight + sleeveLength` [CODE `tshirt-pom.ts:57-61`, `sleeve.ts:29`] | **Mismatch [CODE].** The entered value places the hem measured from cap base, not cap top. The POM therefore exceeds the entered value by `capHeight`, which is positive whenever the solved cap has height [INF — UNEXECUTED]. See D-01. |
| `ease` | Full ease at chest; half ease at sleeve width (`measurements.ts:54`, `sleeve.ts:71`) | STYLE_CONTROL (C03 `:131`) | Yes | Body chest (finished), sleeve width, and the POMs above | Not graded (`tshirt-grade.ts:2-3`). The guidance bands (below 5 warns, above 16 is “roomy”) are uncited code advice (`tshirt-guidance.ts:51-59`; C03 `:441`). |

Fixed constants [CODE]:

- `shoulderSlope` 4 and `backNeckDepth` 2.5 (`measurements.ts:58-59`)
- `CAP_EASE` 1.5 and taper 3 (`sleeve.ts:18,73`)
- the neckline quarter-ellipse constant (`neckline.ts:90`)

Stored but not consumed: `neck`, `waist`, `hip`, `hipDepth`, `crotchDepth`, `thigh`, `knee`, `inseam`, `strapWidth`, `neckDrop` and `neckWidthEase` (see D-11).

### 3.2 Darted tee — `FITTED` (`recipe.ts:191-223`)

The Darted tee uses the same seven fields as Tee (`:196`) and has no options. It reuses the Tee back and sleeve and replaces the front with `draftFittedFront` (`fitted.ts:26-67`, `:77-95`). It grades by the Tee grade (`recipe.ts:202`) and reports the 11 `FITTED_POMS` rows (`fitted-tables.ts:37-85`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `chest` | As Tee, plus dart apex x = `0.55 × chestWidthHalf`, which includes ease (`fitted.ts:41`) | BODY_MEASURE | Yes | Body chest (finished), measured at `sideUpper` start (`fitted-tables.ts:38-43`); Neck width; Front neck drop | The bust apex is a proportion of panel width, not a wearer bust point (C03 `:195`, `:324`). |
| `shoulderWidth` | As Tee (`fitted.ts:29`) | BODY_MEASURE | Yes | Across shoulder; Shoulder seam; Armhole | As Tee. |
| `bicep` | Sleeve width (`sleeve.ts:71`) | BODY_MEASURE | Yes | `FITTED_POMS` has **no bicep-width row**. Only Sleeve hem and the armhole-match guidance reflect it (`fitted-tables.ts:79-84`). | Weakly represented in the tech pack (§4.2). |
| `length` | CF hem at `y=length` and side hem at `length + DART_INTAKE` (`fitted.ts:36-37`). **Bust y = `armholeDepth + 0.28×(length − armholeDepth)`** (`:40`). | GARMENT_MEASURE target | Yes | Body length (HPS–hem), measured at CF (`fitted-tables.ts:45-49`); Side seam (dart closed) | A finished-length target moves the dart apex [CODE]. This coupling is a draft proportion, not a body relation [REVIEW]. |
| `armholeDepth` | Underarm y and bust y (`fitted.ts:30,40`) | PATTERN_PARAMETER target | Yes | Armhole; Side seam; Sleeve length (cap–hem) | As Tee; it also shifts the dart. |
| `sleeveLength` | `capHeight + sleeveLength` (`sleeve.ts:74`) | GARMENT_MEASURE target | Yes | Sleeve length (cap–hem) (`fitted-tables.ts:79-83`) | Same mismatch as Tee (D-01). |
| `ease` | Chest and dart apex x; half at sleeve | STYLE_CONTROL | Yes | As above | Fixed `DART_INTAKE` of 4 cm (`fitted.ts:24`), reported by the **Bust dart intake** POM (`fitted-tables.ts:67`, `dart.ts:31-35`). |

### 3.3 Tank — `TANK` (`recipe.ts:236-280`)

Fields are declared at `recipe.ts:241`. The Tank has no `GarmentOptions`; its three design controls live in `Measurements`. The grammar is two `bodice` nodes: a scoop front and a crew back, each with `strapWidth` (`tank.ts:79-94`). It grades by the Tee grade (`recipe.ts:247`) and reports `TSHIRT_POMS.slice(0,7)` (`tank.ts:141`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `chest` | Panel half-width; base neck half-width `chest/20+2`; **strap point x = `chest/20+2 + strapWidth`** (`bodice.ts:94`) | BODY_MEASURE | Yes | Body chest (finished); Neck width; Front neck drop; **Across shoulder** (see `strapWidth`) | Chest-derived neckline (C03 `:196`, `:325`). |
| `shoulderWidth` | **Not read by Tank geometry.** `sleevelessArmhole` builds the strap and armhole without it (`armhole.ts:48-82`, `bodice.ts:93-100`). It is read only by: the strap ≥ shoulder-half guard (`armhole.ts:60`); the neckline guard (`neckline.ts:119`); `shoulderCheck` (`tank.ts:109`); and the body/garment views. | BODY_MEASURE (C03 `:196`, `:325`) | **No** [CODE; F02 `:54`; F03 `:64-74`, `:194-196`] | None. The graded measurement record still changes it (`TSHIRT_GRADE`). | C03 lists it as a body fact the current Tank draft needs (`:325`). C03 `:119` states “pattern shoulder endpoint is `shoulderWidth/2`”. Neither holds for Tank. It also conflicts with admission rule 2, “only fields that its current geometry actually consumes” (ADM `:38`). See D-03. |
| `length` | Hem y | GARMENT_MEASURE target | Yes | Body length (HPS–hem) | As Tee. |
| `armholeDepth` | Underarm y; neckline-drop guard (`neckline.ts:122-124`) | PATTERN_PARAMETER target | Yes | Armhole (front + back) | As Tee. |
| `strapWidth` | Strap point measured from the **base** chest-derived neck half-width, not the adjusted neckline edge (`bodice.ts:94`) | STYLE_CONTROL (C03 `:132`) | Yes | **Across shoulder** = 2 × strap x [INF — UNEXECUTED]; **Shoulder seam** = HPS→strap. There is no strap POM (C03 `:196`). | The label says “finished span from neckline edge” (`measurements.ts:26`; `controls.ts:33`). By the cited code that is true only when `neckWidthEase = 0` [INF — UNEXECUTED]. See D-04. |
| `neckDrop` | Added to front depth (`tank.ts:66`, `neckline.ts:113`) | STYLE_CONTROL (C03 `:133`) | Yes | Front neck drop = `chest/20+3+neckDrop` [INF — UNEXECUTED; from `measurements.ts:57`, `neckline.ts:113`, `tshirt-pom.ts:51-56`] | The body view labels this dimension “Neck depth `neckDrop`” but draws it to the total neckline depth `cNeck.y` (`render/body.ts:172-173`). |
| `neckWidthEase` | Per-side widening on front and back (`tank.ts:66-69`, `neckline.ts:112`) | STYLE_CONTROL, per side (C03 `:134`) | Yes | Neck width = 2 × (`chest/20+2+neckWidthEase`) [INF — UNEXECUTED]; Shoulder seam | Guidance and views place the strap at `hps.x + strapWidth` (`tank.ts:113-114`; `render/garment.ts:87-88`). The pattern uses `neckWidthHalf + strapWidth` (`bodice.ts:94`). These differ when `neckWidthEase ≠ 0` (D-04). |
| `ease` | Chest only (no sleeve) | STYLE_CONTROL | Yes | Body chest (finished) | `easeRange(m,"tank")` (`tank.ts:109`). |

Fixed constants [CODE]: `SCOOP_PULL` 0.35 (`armhole.ts:36`); shoulder slope 4.

### 3.4 Polo — `POLO` (`recipe.ts:326-349`)

The Polo uses the Tee's seven fields (`:331`) plus 8 options (`polo.ts:35-44`). Its grammar builds front, back, sleeve, plackets and collar (`polo.ts:402-440`). It grades by the Tee grade, with options constant across sizes. It reports 21 POMs: the Tee rows except the generic body length, plus `POLO_POMS` (`recipe.ts:336`; `polo.ts:533-623`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `chest` | Body as Tee (`poloBodyPiece` → `bodice`, `polo.ts:142-143`) with the default crew neckline. **Collar and stand are solved from the drafted neckline edges** (`polo.ts:425-437`). | BODY_MEASURE | Yes | Body chest; Neck width; Front neck drop; all collar/stand pieces | There is no wearer neck input; the collar follows the chest-derived neckline [CODE; C03 `:197`, `:326`]. |
| `shoulderWidth` | As Tee | BODY_MEASURE | Yes | Across shoulder; Shoulder seam; Armhole | — |
| `bicep` | Sleeve width | BODY_MEASURE | Yes | Sleeve bicep width; Sleeve hem | — |
| `length` | Front hem y = `length`. **Back hem y = `length + backHemDrop`** (`polo.ts:144,150-151`). Vent top = side end − `sideVentDepth` (`:152`). | GARMENT_MEASURE target | Yes | **Front body length (HPS–hem)**; **Back body length**; Back hem drop (`polo.ts:607-622`) | Guidance caps the vent at `length − (armholeDepth+4)` (`polo.ts:505-508`). |
| `armholeDepth` | Underarm y; vent guidance | PATTERN_PARAMETER target | Yes | Armhole; Sleeve length (cap–hem) | — |
| `sleeveLength` | `capHeight + sleeveLength` | GARMENT_MEASURE target | Yes | Sleeve length (cap–hem) | D-01. |
| `ease` | As Tee | STYLE_CONTROL | Yes | — | The ease note reads “Most tees use 8–12 cm” because `sleevedTopGuidance` calls `easeRange(m)` with the default label (`tshirt-guidance.ts:51-53,94`). This is copy, not mapping. |

Options (all STYLE_CONTROL, cm):

| Option | Geometry effect | POM |
| --- | --- | --- |
| `placketLength` | Placket length (`:121-123`) and CF slit (`:179-180`) | Finished placket length |
| `placketWidth` | Cut width 2w + 2 (`:111`) | Finished placket width (attachment → fold) |
| `standHeight` | Collar solver (`polo-collar.ts:312`) | Finished collar stand height |
| `collarLeafDepth` | Collar solver | Finished pointed collar leaf |
| `standFrontRise` | Collar solver | Stand front rise |
| `collarPointExtension` | Collar solver | Collar point extension |
| `sideVentDepth` | Vent edge (`:152-157`) | Front and back side-vent depth |
| `backHemDrop` | Back hem y (`:144`) | Back hem drop |

Button centres are fixed at 3.5, 7 and 10.5 (`polo.ts:76`). Non-finite options fall back to their defaults (`:59-74`).

### 3.5 Woven shirt — `WOVEN_SHIRT` (`recipe.ts:388-412`)

Fields are declared at `shirt-contract.ts:11-14` and the 13 options at `:40-54`. The woven body is its own panel, not `bodice` (`shirt.ts:20-58`). It grades by `WOVEN_SHIRT_GRADE`, which has 10 keys (`shirt.ts:500-504`), and reports 10 POMs (`shirt.ts:512-553`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `neck` | `neckHalf = (neck + neckEase)/4` is used as the **neckline half-width at the shoulder line**. Front depth = `0.8×neckHalf`; back depth = `0.3×neckHalf` (`shirt.ts:25-29`). | BODY_MEASURE, guide blocked (C03 `:117`, `:361`, `:570`) | Yes | **Neck circumference (pattern)** = 2 × (front neckline curve + yoke neckline curve) (`:521-524`). Also stand/collar length and placket length, via CF length. | A quarter of a circumference sets a half-width, and the POM is a curve length. No code constrains the POM to equal `neck + neckEase`, so they are expected to differ [INF — UNEXECUTED]. See D-06. |
| `chest` | `(chest+ease)/4` at underarm (`:21,31`). **Pocket x = `chest/20`**, without ease (`:659`). | BODY_MEASURE | Yes | Body chest (finished) (`:514-515`); pocket placement mark | — |
| `shoulderWidth` | Shoulder point `(shoulderWidth/2, 2.5)` — **woven slope 2.5, not 4** (`:24,30`) | BODY_MEASURE | Yes | No across-shoulder POM | Guidance flags when the neck half-width reaches the shoulder half (`:609-612`). |
| `bicep` | Sleeve width `bicep + ease/2` (`:386`); sleeve band length (`:443`, `:758`) | BODY_MEASURE | Yes | **No POM** | Weakly represented (C03 `:198`). |
| `length` | Hem y. **Waist station y = `armholeDepth + 0.35×(length − armholeDepth)`** (`:32`). Placket length via CF length (`:795`). | GARMENT_MEASURE target | Yes | Body length (HPS–hem) (`:517-520`) | The body waist girth is placed at a station derived from the length target (C03 `:121`). See D-07. |
| `armholeDepth` | Underarm y; waist station; pocket y = `armholeDepth + 6` (`:660`); yoke guard (`:606-608`) | PATTERN_PARAMETER target | Yes | None directly | — |
| `sleeveLength` | `capHeight + sleeveLength` (`:390`), with a separate band piece below | GARMENT_MEASURE target | Yes | **No sleeve-length POM** | D-01. |
| `waist` | `(waist+ease)/4` at the length-derived station (`:22,32`) | BODY_MEASURE at wear line (C03 `:124`, `:575`) | Yes | **No POM** | No input captures a body waist level (D-07). |
| `hip` | `(hip+ease)/4` at `waist.y + hipDepth` and at the hem (`:23,33-34`) | BODY_MEASURE | Yes | **No POM** (the hem width follows hip) | — |
| `hipDepth` | Hip station = waist station + `hipDepth` (`:33`) | BODY_MEASURE | Yes | **No POM** | Woven guidance (`:576-617`) has no check for a hip station below the hem (D-07). |
| `ease` | Full ease at chest, waist and hip; half at bicep (`:21-23`, `:386`) | STYLE_CONTROL | Yes | Body chest (finished) | For this recipe the UI “Finished” summary shows chest only (`view.ts:234-240`). |

Options:

| Option | Consumer | POM / note |
| --- | --- | --- |
| `neckEase` | `neckHalf` (`:25`) | Neck circumference (pattern) |
| `buttonCount` | Marks and BOM only (`:622-625`, `:636-638`; `recipe.ts:405-407`) | None; F02 profile P1 (`F02:51`) |
| `buttonSpacing` | Marks | Front button spacing (F02 profile P2) |
| `frontOverlap` | Closure-line mark x (`:634,651`) | None |
| `placketWidth` | Placket cut width (`:631`) | Finished placket width = top − 2 (`:530-532`) |
| `standHeight` | Stand pieces (`:708-709`) | **None** |
| `collarLeafDepth` | Collar pieces (`:724-725`) | **None** |
| `yokeDepth` | Back split (`:190-226`) | Back yoke depth |
| `pocketWidth`, `pocketHeight` | Pocket piece and placement | Patch pocket width and height |
| `sleeveBandDepth` | Band piece height, with the FOLD mark at depth/2 (`:406-418`) | “Finished sleeve band depth” = band side length = the entered value (`:545-548`). Whether the finished depth after folding is half of it is [REVIEW]; deferred (§8). |
| `sideVentDepth` | Vent (`:312-341`) | Side vent depth |
| `hemTurn` | Cutting allowance on the front and lower-back hem only (`:485-498`) | None; not a sewing-line POM (F03 `:55-63`) |

### 3.6 Skirt — `SKIRT` (`recipe.ts:438-464`)

Fields are declared at `:442`; there are no options. The Skirt is two straight panels plus a waistband (`skirt.ts:112-131`). Its grade adds waist +4, hip +4 and length +1.5 per step (`skirt.ts:188`). It reports 3 POMs (`:192-210`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `waist` | `(waist+ease)/4` at panel top `y=0` (`skirt.ts:31-36,43`). The waistband is sized from the panel waist interface (`:117-127`). | BODY_MEASURE at wear line | Yes | **Waist (finished)** | Waistband depth is a fixed 3.5, not an input (`waistband.ts:39`). |
| `hip` | `(hip+ease)/4` at `y=hipDepth` and at the hem (`:44-45`) | BODY_MEASURE | Yes | **Hip (finished)** | Straight, dartless block (C03 `:199`, `:328`). |
| `hipDepth` | Hip station y (`:44`) | BODY_MEASURE | Yes | **No POM** (C03 `:199`) | Guidance warns when `length ≤ hipDepth` (`:166-174`). |
| `length` | Hem y from the panel waist seam (`:45-46`) | GARMENT_MEASURE `target.skirt-waistline-to-hem` (`field-provenance.ts:294-302`) | Yes | **Length (waist–hem)** = panel waist seam to hem, excluding the band (`:205-209`) | **Range conflict:** the Maxi style allows 95–120 (`style.ts:39`), the UI max is 100 (`controls.ts:20`), plausibility max is 95 (`plausibility.ts:40`), and SaveFile validation rejects values over 100 (D-10). Whether “length” includes the waistband is [REVIEW]. |
| `ease` | Waist and hip (`:33-34`) | STYLE_CONTROL | Yes | Waist, Hip | Skirt guidance warns below 2 and calls above 12 loose (`:175-181`). For this recipe the UI “Finished” summary shows hip only (`view.ts:238-239`). |

### 3.7 Trouser — `TROUSER` (`recipe.ts:466-487`)

Fields are declared at `trouser-contract.ts:7-9` and the 11 options at `:27-39`. Draft stations come from `trouserMetrics` (`trouser.ts:45-69`). The grade has 7 keys (`trouser-tables.ts:16-24`), and it reports 17 POMs (`:41-138`).

| Input | Current consumer / formula | C03 kind | Geometry-required? | Derived outputs / POMs | Assumptions, defaults, mismatches |
| --- | --- | --- | --- | --- | --- |
| `waist` | `(waist+ease)/4` per panel at the leg-panel top (`trouser.ts:57,74,86`). Pocket start x = that value − 3.5 (`:317,323-325`). The waistband equals the sum of the leg waist edges (`:449`). | BODY_MEASURE at wear line | Yes | **Waist (finished)** = 4 × front waist seam (`trouser-tables.ts:42-47`) | `finishedWaist` is 94 at STANDARD_M with default options [TEST `trouser.test.ts:79`]. |
| `hip` | Seat quarter at `y=hipDepth` (`:58,75,87`); crotch x = `0.32×seatQ` (`:79`) | BODY_MEASURE | Yes | **Seat / hip (finished)** | — |
| `hipDepth` | Side-hip station y, measured from the **leg-panel top**, which is the waistband seam (`:87`; header `:3-4`) | BODY_MEASURE | Yes | **Hip depth (body reference)** = `hipDepth` (`trouser-tables.ts:59-64`) | Reference-frame risk against `crotchDepth`; see D-08. |
| `crotchDepth` | Front and back rise = `crotchDepth + rise ease`. Crotch station y = rise − `waistbandDepth` (`:49-52`). | BODY_MEASURE (C03 `:127`, `:578`) | Yes | **Front/Back rise (finished incl. waistband)** (`trouser-tables.ts:65-75`) | Front rise 28 and back rise 36 at defaults [TEST `trouser.test.ts:81-82`]. |
| `thigh` | `finishedThigh = thigh + thighEase`. **Each panel width = finishedThigh/4** at `thighY = backCrotchY + 2.5` (`:59,67,76,88,91`). | GARMENT_MEASURE target, exploratory (C03 `:128`, `:579`; `field-provenance.ts:160-165`) | Yes | **Thigh (finished)** = 4 × front-panel span (`trouser-tables.ts:76-83`) | Stitches join one front and one back panel into each leg (`trouser.ts:205-209`). The assembled leg girth at this station would then be `finishedThigh/2`, not the POM value [INF — UNEXECUTED] (D-02). The UI tags and groups this field as body (D-14). |
| `knee` | `finishedKnee = knee + kneeEase`. Panel width is /4 at `kneeY = backCrotchY + 0.52×inseam` (`:60,66,77,89`). | GARMENT_MEASURE target, exploratory (C03 `:129`, `:580`) | Yes | **Knee (finished)** = 4 × front span (`trouser-tables.ts:84-91`) | Same two-panel concern as `thigh` [INF — UNEXECUTED] (D-02). |
| `inseam` | `hemY = backCrotchY + inseam`, a vertical distance (`:55`); also the knee station (`:66`) | GARMENT_MEASURE target (C03 `:130`) | Yes | **Inseam (finished seam)** = sum of three inner-leg edge lengths (`trouser-tables.ts:92-96`) | The inner-leg x offsets −1.5, −1.8 and −2.0 (`:80-82`) make those edges non-vertical, so the POM should not equal the entered vertical distance [INF — UNEXECUTED] (D-09). `hemY` is 110 at defaults [TEST `trouser.test.ts:83`]. |
| `ease` | Waist and seat only (`:57-58`) | STYLE_CONTROL | Yes | Waist, Seat | Thigh and knee have separate ease options (C03 `:131`). |

Options (STYLE_CONTROL; cm, except `pocketAngle` in degrees):

| Option | Consumer | POM |
| --- | --- | --- |
| `frontRiseEase`, `backRiseEase` | Rise and crotch y (`:49-52`) | Front and back rise |
| `waistbandDepth` | Crotch-y subtraction; band piece (`:51-52,235`) | Waistband depth; rises; outseam |
| `thighEase`, `kneeEase` | Finished girths (`:59-60`) | Thigh, Knee |
| `legOpening` | Hem width per panel = `legOpening/4` (`:78,90`) | Leg opening = 4 × front hem (`trouser-tables.ts:102-107`). The same two-panel concern applies [INF — UNEXECUTED] (D-02). |
| `flyLength` | Fly shield and mark (`:265-307`) | Front fly length |
| `pocketOpening`, `pocketAngle`, `pocketDrop` | Opening line (`:319-333`) | Left/right pocket opening; pocket drop |
| `pocketBagDepth` | Bag (`:370-390`) | Pocket bag depth and width |

## 4. Cross-recipe analysis

### 4.1 Same key, different meaning by recipe

| Key | Meanings [CODE unless tagged] | Consequence |
| --- | --- | --- |
| `length` | Tops (Tee, Darted, Tank, Polo front, Woven): HPS → hem. Polo back: `length + backHemDrop`. Skirt: panel waist seam → hem, excluding the band. It also locates the Woven waist station and the Darted-tee bust apex. Trouser does not use it (`trouser-contract.ts:4-6`). | One shared value across recipes (§2). F02 marks carry-over values `UNRESOLVED` (`field-provenance.ts:458-464,516-518`). |
| `sleeveLength` | In geometry, the cap-base → hem distance; in labels, C03 and the POM label, cap top → hem (D-01). | Style bands such as Muscle 8–12 and Long-sleeve 55–70 (`style.ts:30-31`) match against the entered value through `matchStyle` reading `m[id]` (`style.ts:93-108`), not against the reported POM [CODE]. |
| `ease` | Tee family: chest ×1, sleeve ×0.5. Tank: chest. Woven: chest, waist and hip ×1, bicep ×0.5. Skirt: waist, hip. Trouser: waist, seat. | One scalar serving different regions (C03 `:131`, `:691`). |
| `shoulderWidth` | Sleeved tops: shoulder endpoint. Woven: endpoint at slope 2.5. Tank: guidance, views and grade record only. | D-03. |
| `neck` | Consumed only by Woven, as a quartered half-width. Stored but unused by every other recipe. | Traps T1 and T2. |
| `hipDepth` | Woven: below a length-derived waist station. Skirt: below panel top. Trouser: below leg-panel top, i.e. the waistband seam. | D-07, D-08. |
| Neckline width | Tee, Darted, Tank, Polo: `chest/20+2` (Tank adds `neckWidthEase`). Woven: `(neck+neckEase)/4`. | T1. |
| POM “Across shoulder” | Tee, Darted, Polo: equals `shoulderWidth` [TEST for Tee]. Tank: 2 × (`chest/20+2+strapWidth`) [INF — UNEXECUTED]. | D-05. |

### 4.2 Unused or weakly represented inputs

- **Stored but not consumed [CODE].** Each recipe carries all 18 keys, and the SaveFile requires every key to be present and within UI range (`persist.ts:181-193`; `project-records.ts:145-146`). For example, `neck` is stored for the Tee family, Tank and Polo; `chest` is stored for Skirt and Trouser.
- **No geometry effect:** Tank `shoulderWidth` (D-03).
- **Consumed by geometry but with no POM [CODE]:**
  - Woven: `bicep`, `waist`, `hip`, `hipDepth`, `armholeDepth`, `sleeveLength`, `standHeight`, `collarLeafDepth`, `frontOverlap`
  - Skirt: `hipDepth`
  - Tee family: `armholeDepth` (indirect only)
  - Darted tee: `bicep` (no bicep-width row)
  - Tank: `strapWidth` (no strap row; C03 `:196`)
- **No geometry effect or no production caller [CODE]:**
  - Woven `buttonCount` changes marks and BOM only.
  - Woven `hemTurn` changes the cutting allowance only.
  - `WaistbandParams.closure` is never read (`waistband.ts:20-26`).
  - `NecklineParams` shape `"boat"` throws, and no recipe passes `"v"` (`neckline.ts:108-110`).
  - A non-test grep finds only the definition of `restoreGarmentOptions` (`options.ts:36-47`); no production code calls it.
- **Fixed drafting constants, not inputs [CODE]:**
  - Shoulder slope: 4 on knit bodices, 2.5 on Woven.
  - Back neck depth 2.5; `CAP_EASE` 1.5; sleeve taper 3; `SCOOP_PULL` 0.35.
  - Darted tee: dart intake 4; bust fractions 0.28 and 0.55.
  - Woven: waist fraction 0.35; neck-depth fractions 0.8 and 0.3; pocket at `chest/20` and `armholeDepth + 6`; first button drop 5 (`shirt.ts:620`).
  - Skirt waistband 3.5.
  - Trouser: thigh offset 2.5; knee at 0.52 × inseam; crotch x at 0.32 × seatQ; inner-leg offsets; pocket clearance 3.5.
  - Polo button centres.

### 4.3 Body-to-pattern formulas

All of these are digital draft rules, not reviewed transformations (C03 `:331-337`; ADM `:95`):

- chest → panel width and neckline (`measurements.ts:52-57`)
- bicep → sleeve width (`sleeve.ts:71`)
- shoulderWidth → shoulder endpoint (`bodice.ts:83`; `shirt.ts:30`)
- neck → Woven neckline half-width (`shirt.ts:25`)
- waist and hip → quarter widths (`shirt.ts:22-23`; `skirt.ts:33-34`; `trouser.ts:74-75`)
- hipDepth → hip station (`shirt.ts:33`; `skirt.ts:44`; `trouser.ts:87`)
- crotchDepth plus rise ease → crotch station (`trouser.ts:49-52`)
- thigh and knee → quarter-per-panel at heuristic stations (`trouser.ts:66-67,76-77`)

[REVIEW] Each mapping still needs the G07 body-to-pattern review (C03 `:417-421`).

### 4.4 Disconnected fields, options and surfaces

- **Two sources of UI semantics [CODE].**
  - Control tags come from `roleTag` in `facets.ts` (`view.ts:155-157`), and the “Body measurements” grouping uses the same source (`view.ts:251-256`).
  - Control labels come from `field-provenance.ts` (`view.ts:261-263`).
  - The two disagree. `facets.ts` classes thigh and knee as `body` (`:37-38`) and armholeDepth as `finished` (`:41`). `field-provenance.ts` classes thigh and knee as GARMENT_MEASURE targets and armholeDepth as PATTERN_PARAMETER.
  - Guidance rows use the legacy `FIELDS` labels, such as “Armhole depth” and “Thigh girth” (`view.ts:303-305`).
  - `facets.finishedOf` covers only chest and bicep (`facets.ts:54-58`).
- **Tank strap position [CODE].** The pattern (`bodice.ts:94`), guidance (`tank.ts:113-114`) and views (`render/garment.ts:87-88`) compute the strap point differently when `neckWidthEase ≠ 0` (D-04).
- **One-size outputs versus the grade run [CODE].**
  - Tech pack, projector and marker call `gradeRun` over XS–XL (`techpack.ts:497,535`; `projector.ts:107`; `marker.ts:27`).
  - The tech pack is registered as a whole-run artifact (`app.ts:3866`).
  - Selected-size file names use the step label, and the base step's label is “M” (`app.ts:171-176`, `:3513-3542`; `tshirt-grade.ts:21`) (D-13).

## 5. C03 trap confirmations

| # | Trap | Result | Evidence |
| --- | --- | --- | --- |
| T1 | No neck input for Tee, Darted tee, Tank or Polo | **Confirmed [CODE].** `neck` is absent from their `fields`; the neckline comes from chest; the Polo collar is solved from that neckline. | `recipe.ts:161,196,241,331`; `measurements.ts:52,57`; `polo.ts:425-437`; C03 `:117`, `:214-215`, `:361` |
| T2 | Woven-shirt neck remains unresolved | **Confirmed.** Code consumes `neck` as a quartered half-width (`shirt.ts:25`). C03 blocks the capture guide (`:570`). The field definition says it is not reviewed (`field-provenance.ts:103-107`). No code field exists for C03's fallback, a “separately named finished neckline target” (`:361`). Whether the POM equals `neck + neckEase` is [INF — UNEXECUTED] (D-06). | as cited |
| T3 | `armholeDepth` is a target underarm drop | **Confirmed in geometry and definitions; contradicted in a comment and a UI tag.** Geometry: underarm y = `armholeDepth` from HPS (`bodice.ts:70`; `shirt.ts:31`). Definition: PATTERN_PARAMETER (`field-provenance.ts:128-133`). Comment: body (`measurements.ts:11`). Facet tag: finished (`facets.ts:41`). | C03 `:122`, `:574`; ADM `:32` |
| T4 | `sleeveLength` and Trouser `inseam` are finished targets | **Inseam confirmed** (`trouser.ts:55`; `field-provenance.ts:172-177`). **`sleeveLength` is defined as a finished target, but its geometric reference point differs from its label** (D-01). | C03 `:123`, `:130`, `:367` |
| T5 | Trouser thigh and knee are finished targets | **Confirmed in definitions** (`field-provenance.ts:160-171`). **Contradicted by UI tags and grouping** (`facets.ts:37-38`; `view.ts:253-254`). Suspected geometry-to-POM halving is [INF — UNEXECUTED] (D-02). | C03 `:579-580`; ADM `:31` |
| T6 | Knee and thigh mappings are exploratory | **Confirmed [CODE].** `thighY = backCrotchY + 2.5` and `kneeY = backCrotchY + 0.52×inseam` (`trouser.ts:66-67`). `TROUSER-RESEARCH.md:128` notes that sources support the 2.5 cm point, but C03's later accepted decision governs and keeps the mapping exploratory and not anatomically registered (`:128-129`, `:579-580`, `:692`). | as cited |
| T7 | Skirt length range conflict | **Confirmed and extended [CODE].** Maxi 95–120 (`style.ts:39`) versus UI 40–100 (`controls.ts:20`) versus advisory 45–95 (`plausibility.ts:40`). New: current SaveFile validation rejects lengths over 100 (`persist.ts:171,187-190`; `project-records.ts:152-156`). A style saved through this parser therefore cannot store a Maxi length above 100 (D-10). | C03 `:121`, `:297`, `:300-305`; ADM `:31`, `:54` |
| T8 | `STANDARD_M` is not wearer data | **Confirmed as a code hazard [CODE].** The code comment calls it “A standard size M” (`measurements.ts:31`). It seeds app start (`app.ts:270`), blank designs (`app.ts:430-439`; `project-repository.ts:676`), legacy-load fill (`persist.ts:181,189`) and every field definition's `defaultValue` (`field-provenance.ts:318`). The plausibility comment calls it the “known-good sample” (`plausibility.ts:14`). | C03 `:148-162`, `:395`, `:689`; ADM `:30`, `:40` |
| T9 | No fit qualification or population-grade claim | **Confirmed as a boundary; some code surfaces conflict [CODE].** The grade rule is repository-owned and unsourced (`tshirt-grade.ts:7` says “a typical tee grade”). The base size is labelled “M” (D-13). The verdict “Digital checks pass” covers digital checks only (`view.ts:295-297`). | C03 `:39-50`, `:480-505`; ADM `:18`, `:33`, `:78` |

## 6. G03-scoped discrepancies

Ranked by risk to M01/M02 truthfulness and parity. “Owner” names the slice where the admission places the decision.

| ID | Discrepancy | Evidence | Risk to G03 | Owner / needed decision |
| --- | --- | --- | --- | --- |
| **D-01** | **`sleeveLength` reference point.** Geometry measures it cap-base → hem [CODE], while the label, C03 meaning and POM label say cap-top → hem. The POM formula is `capHeight + input` [CODE]. C03 itself records both (`:123`: “Sleeve hem station is cap height plus this value” alongside “cap top to hem”). | `sleeve.ts:29,74`; `shirt.ts:390`; `tshirt-pom.ts:57-61`; `field-provenance.ts:134-139` | M01 would ask for a “cap-to-hem target” that the draft does not reproduce. | Slice 245: relabel, or change the formula. A formula change moves the protected Tee/Darted baselines and needs maintainer approval (AGENTS.md:98-100). [REVIEW] |
| **D-02** | **Trouser leg girths (thigh, knee, leg opening).** The draft sets each panel to `finished/4`, and each leg is stitched from one front and one back panel [CODE]. The assembled leg girth would therefore be `finished/2`, while the POMs report 4 × panel [INF — UNEXECUTED]. This follows the Slice 96 “quarter” decision (`TROUSER-RESEARCH.md:332-333`). Four panels sum correctly around the body for waist and seat, but a single leg has two [INF — UNEXECUTED]. | `trouser.ts:59-60,76-78,88-94,205-209`; `trouser-tables.ts:76-107` | M01's “Target finished thigh/knee girth” may not describe the drafted leg. M02 parity is unaffected because both paths share this code. | [REVIEW] plus Codex runtime verification. The fix belongs to G07 or remediation. M01 copy must not call these achieved girths until the question is resolved. |
| **D-03** | **Tank `shoulderWidth` is visible but unused by geometry** [CODE]. C03's dependency map lists it as required, while admission rule 2 says the route lists only consumed fields. | `recipe.ts:241`; `bodice.ts:93-100`; `armhole.ts:48-82`; F02 `:54`; F03 `:64-74`; C03 `:325`; ADM `:38` | Conflicting rules for the M01 field list. | Slice 245: exclude it, or keep it as a guidance-only body input with explicit copy. The S238 edit-rebase boundary stays in place (`app.ts:535-537`). |
| **D-04** | **Tank strap reference.** The strap point ignores `neckWidthEase` in the pattern but includes it in guidance and views [CODE]. The label “from neckline edge” holds only when `neckWidthEase = 0` [INF — UNEXECUTED]. | `bodice.ts:94` versus `tank.ts:113-114` and `render/garment.ts:87-88`; `measurements.ts:26`. Not covered by `tank.test.ts:95-101`. | Guidance may warn about, and views may draw, a strap position that is not the drafted one. | Slice 245 decides the semantics. A code change could alter Tank outputs; Tank is not one of the eight protected identities. |
| **D-05** | **Tank “Across shoulder” POM** reads the strap point, not a shoulder breadth [CODE]. There is no strap POM. | `tank.ts:141`; `tshirt-pom.ts:29-34`; C03 `:196` | Label truthfulness in the M01 trace and M02 tech pack. | Slice 245/249 copy or POM decision. |
| **D-06** | **Woven neck.** The input is quartered into a half-width, and the “Neck circumference (pattern)” POM is a curve length [CODE]. Equality with `neck + neckEase` is not constrained; a difference is expected [INF — UNEXECUTED]. The finished-neckline target field that C03 falls back to does not exist. | `shirt.ts:25-29,521-524`; C03 `:361`, `:570` | M01 cannot offer a truthful finished-neckline target without a defined mapping. | Slice 245 [REVIEW]. The neck guide stays withheld (ADM `:39`). |
| **D-07** | **Woven waist and hip stations.** The waist station is derived from `length`; the hip station is the waist station plus `hipDepth` [CODE]. By these formulas, the hip station falls below the hem when `hipDepth > 0.65×(length − armholeDepth)` [INF — UNEXECUTED]. No Woven guidance check was found for this. Whether Cropped style values (45–60, `style.ts:67`) meet that condition depends on the other inputs [INF — UNEXECUTED]. | `shirt.ts:32-35`; guidance `:576-617` | A potentially invalid geometry with no correction path (ADM `:40`, `:70`). | Slices 245/247 validation; [REVIEW] of the waist station. |
| **D-08** | **Trouser reference frames.** Rise includes the waistband, and the crotch y is `crotchDepth + rise ease − waistbandDepth` from panel top [CODE]. `hipDepth` is applied from panel top, i.e. the waistband seam [CODE]. If the finished waistband top sits at the body waist used for `crotchDepth`, the hip station lies `waistbandDepth` below the body hip [INF — UNEXECUTED]. | `trouser.ts:49-52,87`; `trouser-tables.ts:59-75` | Mixed body reference frames within one draft. | [REVIEW]; C03 `:575` “intended wear line”. Owner G07; M01 copy must name the reference. |
| **D-09** | **Trouser inseam POM** is a sloped seam length, while the input is a vertical station distance [CODE]. A small positive difference is expected [INF — UNEXECUTED]. | `trouser.ts:55,80-82`; `trouser-tables.ts:92-96` | Label or tolerance only. | Slice 245/249 copy. |
| **D-10** | **Skirt length range.** Style allows 95–120, the UI stops at 100, the advisory band at 95, and current SaveFile validation rejects values over 100 [CODE]. | `style.ts:39`; `controls.ts:20`; `plausibility.ts:40`; `persist.ts:171,187-190` | M02 save would fail for a Maxi length above 100, or tempt a hidden clamp. | Slice 245 must resolve it (ADM `:54`). A range change touches SaveFile validation and needs strict versioning (ADM `:44`). |
| **D-11** | **`STANDARD_M` filler and provenance origins.** `STANDARD_M` is the template for non-consumed fields, and a current SaveFile requires all 18 keys valid regardless of recipe [CODE]. `createStyle` accepts only `first-run-default` (PRESET) or `copied-style` (INHERITED) origins, so there is no guided-capture origin [CODE]. | `persist.ts:181-193`; `project-records.ts:145-146`; `project-workflow.ts:494-519`; `field-provenance.ts:231-245` | M02 would store fixture values as silent filler, or mislabel captured values. | Slices 245/248: decide how non-consumed fields are represented; add a capture origin without relabelling existing edits (ADM `:28`, `:69`). |
| **D-12** | **Silent option defaults.** Option resolvers replace non-finite options with defaults inside drafting [CODE]. Readiness and export are gated by `inputErrors`; preview behaviour was not verified. Legacy (pre-v5) out-of-range options are dropped at load, leaving defaults [CODE]. | `polo.ts:59-74`; `shirt-contract.ts:60-71`; `trouser-contract.ts:45-56`; `persist.ts:205-212`; `app.ts:845-872` | M02 parity; ADM `:40`. | Slice 248: pass complete explicit options and never rely on resolver defaults. |
| **D-13** | **One-size identity.** The base step label is “M” and appears in file names and the nest label. Tech pack, projector and marker always compute the XS–XL run. `exportStep` must be a step in `recipe.sizes` [CODE]. | `tshirt-grade.ts:21`; `app.ts:171-176,3346-3374,3513-3542,3866`; `techpack.ts:497,535`; `projector.ts:107`; `marker.ts:27`; `persist.ts:162` | Conflicts with “no grade inheritance” and “no custom base called M” (C03 `:504`, `:690`; ADM `:57`, `:83`). | Slices 248/249: define which outputs count as one-size. Keep legacy bytes intact (ADM `:79`, `:87`). |
| **D-14** | **UI semantic tags.** Tags and grouping (from `facets.ts`) contradict `field-provenance.ts`; guidance uses legacy labels; the “Finished” summary is partial [CODE]. | `facets.ts:37-41,54-58`; `view.ts:155-157,234-240,251-256,303-305` | M01 would show “body · circ” on finished targets (C03 `:209-210`). | Slices 246/247, within the scoped MQF-013/014 review. |
| **D-15** | **Measurements carry across garment switches** [CODE]. `length` changes meaning between tops and the skirt. | `app.ts:2398-2440` plus the assignment grep (§2); `field-provenance.ts:458-464` | A guided route could inherit another recipe's target. | Slice 245 session model. |
| **D-16** | **An unknown recipe id silently drafts Tee** [CODE]. | `recipe.ts:491-494` | Guided-route data errors would draft the wrong garment. | Slice 245/248: strict recipe-id parse. |
| **D-17** | **A preset is chosen automatically.** `setGarment` selects `styles[0]` as `targetStyle`, which `createStyle` saves as `recipePresetId` [CODE]. | `app.ts:2425`; `project-workflow.ts:511` | A preset label appears without an explicit user choice (ADM `:41`). | Slice 245. |
| **D-18** | **The Darted-tee bust apex moves with the `length` target**, and its x includes ease [CODE]. | `fitted.ts:40-41` | The M01 trace must say so; this is not a bust fit (C03 `:324`). | Copy only. G07 owns any change. |
| **D-19** | **C03 wording.** C03 says the woven rule changes “nine listed body fields” (`:486`), but the rule has 10 keys, 3 of which are targets (`shirt.ts:500-504`; C03 `:198`). | as cited | Documentation precision only. | Codex may note it at Slice 245. C03 edits are outside this audit. |

## 7. M02 parity test and evidence matrix

### Fixture policy [REC]

1. **`LEGACY-PRESET` — one per recipe.** `STANDARD_M` plus default options, labelled PRESET.
   - Use it only to prove that byte identity and legacy parity are unchanged (`regression.test.ts:29-63`).
   - Never use it as a guided-capture example.
2. **`M02-EXPLICIT` — one per recipe.**
   - Write every `recipe.fields` value and every `recipe.options` id literally in the test.
   - Do not spread `STANDARD_M` into any consumed field.
   - Represent non-consumed keys according to the D-11 decision, and assert that none of them has a USER_CAPTURED observation.
   - Codex chooses the values inside UI and advisory ranges; this report proposes none.
3. **Edge fixtures — one each, only where G03 must show a visible state:**
   - Skirt length at the resolved boundary (D-10).
   - Tank `neckWidthEase ≠ 0` (D-04).
   - Polo with vent 0 and back drop 0 (the `polo.ts:145` topology path).
   - Woven with a cropped length that meets the D-07 inequality; expect a visible issue, not a clamp.
   - An emptied option; expect blocked output (D-12).
4. **Golden derivation.**
   - Generate every expected value by calling the existing full-editor functions on the **parent commit**, then store the hashes or deep snapshots.
   - Never hand-type expected numbers.
   - Record the command, commit and recipe in the evidence file.

### Matrix

All rows cover all seven recipes unless stated.

| # | Evidence | How to derive it (existing functions) | Existing test to extend |
| --- | --- | --- | --- |
| P1 | Resolved-input equality | The guided route's resolved `recipe.fields` measurements and `recipe.options` deep-equal the full editor's `measurements` and `recipeOptions()` (`app.ts:529-532`). | New M02 test; `field-provenance.test.ts` |
| P2 | Geometry | Deep-equal the Block roles, edges, marks and stitches from `recipe.draft(m, options)` and `draftAtSize(m, recipe.grade, 0, recipe.draft, options)` (`grading.ts:53-61`). | `recipe.test.ts`; per-recipe draft tests |
| P3 | Options consumed | The same options object reaches `recipe.draft`, `guidance` and `techPackForOptions`, and no resolver fallback is exercised (D-12). | New |
| P4 | POMs | Raw, unrounded `pom.measure(block)` values match exactly; `specSheet` rows at step 0 only for one-size (`pom.ts:73-82`). | `pom.test.ts` pattern |
| P5 | Guidance and readiness | `recipe.guidance` notes and `garmentReport` match; readiness gate `baseDesignValid` (`app.ts:863-872`) agrees. | `app.test.ts` |
| P6 | Selected-size exports | SHA-256 of `exportSvg`, `exportDxf`, `exportPdf` and `exportA0Pdf` for pieces from the same step-0 block with `currentAllowances()`. File-name policy follows D-13. | `regression.test.ts` style; `export.test.ts` |
| P7 | Whole-run outputs (tech pack, projector, marker) | Assert the D-13 decision explicitly: excluded from one-size output, or produced only after an approved plan (M03). | techpack / projector tests |
| P8 | Nesting | The single-size layout from `nestPieces(flattenPiece(...))` matches (`app.ts:1517`). | `nesting.test.ts` |
| P9 | Deterministic repeat | Two guided creations from identical inputs produce identical `SavedDesign` JSON, P2/P4/P6 hashes and revision-manifest digests. | New; `style-revisions.test.ts` |
| P10 | Save → reload → full editor | Create through `ProjectWorkflow.createStyle` / `saveActiveDesign` over fake IndexedDB, reopen, and re-run P1–P8. Captured and default values keep distinct provenance, and no STANDARD_M value appears as USER_CAPTURED. | `project-workflow.test.ts`; `persistence-properties.test.ts` |
| P11 | Migration | SaveFile v1–v6, style/recovery schemas, IndexedDB versions and package v1/v2 still load unchanged; any new capture schema migrates additively (ADM `:44`, `:94`). | `persist.test.ts`; `project-records.test.ts` |
| P12 | Byte-identity protection | The eight `BASELINE` hashes stay unchanged (`regression.test.ts:29-38`), and S239 frozen output digests are unchanged for untouched legacy styles. | `regression.test.ts` (no edits); S239 evidence |
| P13 | Rendered replay | In the browser, create → save → reload → open the editor for each recipe, and compare downloaded bytes to P6 (ADM `:108`). | `electron/verify-*` pattern |
| P14 | Dependency coverage | The 85-input matrix still covers exactly each recipe's inputs after any field-list change (D-03). | `artifact-dependencies.test.ts` |

## 8. Deferred items

Per the admission and the findings register, these are outside G03 and no action is proposed here:

- **Findings register:**
  - MQF-012: broader Polo collar and neckline fidelity (`UI-MANUAL-QUALITY-FINDINGS-2026-09.md:35`, `:153-162`)
  - MQF-011: artwork and catalog behaviour
  - MQF-002 and MQF-008: colour system and selected-card contrast
  - MQF-005, -006 and -007: pattern key and label placement
  - MQF-015 beyond M02 parity: export-format redesign and standards comparison
  - MQF-009: side schematic
  - MQF-003 and MQF-010: app layout and IA
  - MQF-004: Woven body-view buttons
- **Code observations in the same areas:**
  - Woven `sleeveBandDepth` fold semantics (§3.5)
  - the missing Woven stand and collar POMs
  - the Polo ease copy that says “tees”

G03 reviews only MQF-001, MQF-013, MQF-014 and the parity part of MQF-015 at its exits (ADM `:22`, `:47`; `PROJECT-DECISIONS.md:899-916`).

## 9. Questions Codex must answer before Slice 245 implementation

1. **D-01 — sleeve length.** Relabel `sleeveLength` as cap-base → hem, or change the formula? The formula option needs maintainer approval to move the Tee/Darted baselines.
2. **D-02 — trouser leg girths.** Does runtime evaluation confirm the leg-panel quarter concern? If so, how should M01 label thigh, knee and opening until G07?
3. **D-03 and D-05 — Tank shoulder.** Is Tank `shoulderWidth` in the guided field list or out, and with what copy? How should the strap-based “Across shoulder” POM be labelled?
4. **D-04 — Tank strap reference.** What does `strapWidth` measure from when `neckWidthEase ≠ 0`? Would a fix change outputs for any saved Tank style?
5. **D-06 — Woven neck.** Should M02 allow an UNCONFIRMED user-entered `neck`, an explicitly selected PRESET, or no value? Should a finished-neckline target field be added, and how would it map to `neck`?
6. **D-10 — Skirt length.** How is the range resolved for this route? Any range change affects SaveFile validation and needs a strict version bump.
7. **D-11 — non-consumed fields and provenance.** How are non-consumed keys represented in a guided style: keep the 18 required keys, or introduce a new schema? What are the new `createStyle` origin and the meaning of `recordedAt`?
8. **D-13 — one-size identity.** Which exports count as one-size for M02? What file and size label replaces “M”? Are the tech pack and projector withheld until M03 approval?
9. **D-07 and D-08 — station validity.** Are these added as visible M01 validation, or recorded for G07 with M01 copy only?
10. **D-14 to D-17 — route rules.**
    - Does the guided route use `field-provenance` semantics exclusively?
    - Is carry-over between garments blocked?
    - Are unknown recipe ids rejected?
    - Is a preset never applied without an explicit user choice?

## 10. Findings that require runtime verification

Each of these is an unexecuted inference from code. Codex must evaluate the cited function and record the actual values before relying on it.

| Ref | Inference to verify | How to verify |
| --- | --- | --- |
| D-01 | The “Sleeve length (cap–hem)” POM exceeds the entered `sleeveLength` by the solved `capHeight` (> 0) | Draft any sleeved recipe; compare the POM with the input and with the sleeve `capLeft` start y. |
| D-02 | The assembled leg girth at thigh, knee and hem is half of the reported Thigh, Knee and Leg-opening POMs | Sum the front-left and back-left panel widths at `thighY`, `kneeY` and `hemY`, then compare with the POM values. |
| D-04 | The Tank drafted strap span ≠ `strapWidth` when `neckWidthEase ≠ 0`, and guidance/views use a different strap x | Draft Tank with `neckWidthEase ≠ 0`; compare the shoulder-edge end x with `hps.x + strapWidth` and with the `render/garment.ts` strap x. |
| D-05 | Tank “Across shoulder” = 2 × (`chest/20+2+strapWidth`) | Evaluate the POM on a drafted Tank. |
| D-06 | Woven “Neck circumference (pattern)” ≠ `neck + neckEase` | Evaluate the POM against the input sum. |
| D-07 | The Woven hip station lies below the hem when `hipDepth > 0.65×(length − armholeDepth)`, with no guidance note | Draft a cropped Woven that meets the inequality; inspect the side-edge y values and the guidance output. |
| D-08 | The Trouser hip station is offset by `waistbandDepth` relative to the rise reference | Compare the `sideUpper` end y with `frontCrotchY + waistbandDepth` framing; needs [REVIEW] of the intended waist reference. |
| D-09 | The Trouser “Inseam (finished seam)” POM is slightly larger than the entered `inseam` | Evaluate the POM against the input. |
| §3.3 | Tank Front neck drop = `chest/20+3+neckDrop`; Neck width = 2 × (`chest/20+2+neckWidthEase`) | Evaluate the POMs. |
| §2 / D-12 | Whether the live preview drafts with substituted defaults while an option is `NaN` | Inspect `draw()` at `app.ts:1399` onward, or run the UI with an emptied option. |

## 11. Verification record

- The worktree started clean at `433aeee`. This report is the only file created.
- Not touched: code, tests, dependencies, the board, planning, state, architecture, admission, and `MEASUREMENT-HELP-SOURCE-AUDIT.md`. No commit, push or PR.
- No code or test was executed: `node_modules` is absent and the handoff forbids test runs. Every [INF — UNEXECUTED] item is listed in §10.
- No external source was consulted. The report makes no physical-fit, standards, population or production claim.

## 12. Codex runtime validation and Slice 245 dispositions

Codex evaluated the following functions against the Slice 245 checkout using
`npx tsx -e` and `STANDARD_M` (2026-09-26). These are digital implementation
facts only. They do not validate fit, construction, or an industry method.

| Ref | Executed result | Slice disposition |
| --- | --- | --- |
| D-01 | `draftTshirt(STANDARD_M)` reports sleeve length **23.786943892482668 cm** for the entered `sleeveLength` **22 cm**. `capLeft.end.y` is 0; the hem starts at y=23.7869. | Keep the legacy drafting formula and protected outputs in Slice 245. M01 must preserve the entered value and explain that the current draft treats it as a cap-base offset; display the computed cap-top-to-hem POM and difference. Any change to the legacy formula requires a separately documented maintainer-approved baseline move. |
| D-02 | Trouser draft POMs report thigh/knee/opening **66/45/40 cm**. Summing front-left and back-left panel widths for one sewn leg gives **33/22.5/20 cm**. | Preserve the legacy block at Slice 245. M01 must call these user-entered digital targets and show the current pattern/POM relationship accurately; it must not claim the POM is a matched leg girth. Record the quarter-per-panel mapping for qualified body-to-pattern review under G07. |
| D-03 | Tank pattern shoulder endpoint x=15 cm at `neckWidthEase=2`; the existing body view separately uses `shoulderWidth`. Tank's inherited “Across shoulder” POM is 30 cm, not the 45 cm body input. | Keep `shoulderWidth` as a body-view input, clearly disclose that it does not alter the Tank pattern block, and do not represent the inherited POM as body shoulder breadth. The M01 recipe trace must distinguish these two uses. |
| D-04 / D-05 | With `neckWidthEase=2`, the Tank pattern shoulder endpoint is x=15 cm, while the stated neckline-edge-plus-strap point is x=17 cm. Tank “Across shoulder” is 30 cm under `STANDARD_M`, versus the 45 cm body `shoulderWidth`. | No geometry or POM label change in the capture-contract slice. M01 must expose the current draft rule and discrepancy. Carry correction and output-label review into the M01/M02 rendered and parity gates; do not report those values as wearer-fit measurements. |
| D-06 | Woven neck POM is **51.55440766290162 cm** with the default 1 cm neck ease, while `neck + neckEase` is **41 cm**. | Keep the guide unqualified and retain `neck` only as an explicitly user-entered/unconfirmed digital input. Do not add a finished-neckline target without a separately reviewed mapping. Show the current pattern POM independently. |
| D-07 | A Woven draft with length 45, armhole depth 24 and hip depth 20 places its hip station at **y=51.35 cm**, below the y=45 hem; its guidance has no hip-below-hem correction. | This is a M01 validation gap. Slice 247 must add a visible actionable invalid state for the demonstrated geometry without clamping; if it cannot, add a numbered remediation slice before M01 closure. |
| D-09 | Trouser inseam POM is **78.41719245694959 cm** for the entered 78 cm because the measured sewn path is sloped. | Describe the input as a vertical draft target and show the resulting seam POM separately; do not imply equality. |
| D-10 | The capture contract resolves the guided Skirt route to the existing **40–100 cm** shared control. Values above 100 through the Maxi label's 120 cm maximum remain stored and visibly invalid; no value is clamped. | Resolved for the M01 guided route. No SaveFile range/schema change is made in Slice 245. |
| D-11, D-15–D-17 | The session is recipe-specific, rejects unsupported recipe IDs, starts empty, and creates a preset reading only after an explicit user action. It records the recipe's defined inputs only; unrelated `Measurements` keys are not represented as captured facts. | M02 must fill any required legacy `Measurements` keys using explicit, visibly labeled digital defaults and attach provenance additively through G02 persistence. Never relabel those values as body readings or infer another garment's fields. |
| D-08, D-12–D-14, D-18–D-19 | These require a technical reference decision, invalid-option/output-path verification, one-size product/output decisions, or UI presentation work. | Keep within the assigned later M01/M02 slices or G07 review stated in §6. M01 must use the C03 field semantics, and M02 must resolve one-size identity before output parity is accepted. They do not authorize widening Slice 245. |

The focused session-model coverage passed 11/11 with 100% statement, branch,
function and line coverage for `measurement-capture.ts`. The first full
repository coverage run passed 1,845/1,847 tests; two unrelated project-package
cases hit Vitest's default five-second timeout under the allocation-heavy full
suite. Both cases passed alone in 1.06 seconds with the default timeout. A full
rerun with `--testTimeout=30000 --maxWorkers=4 --minWorkers=4` passed all 125
files and 1,847 tests. The final coverage table reported 100% statements,
branches, functions and lines across all included source files. These were
command-line run settings only; the repository configuration and product code
were unchanged by the timeout adjustment.
