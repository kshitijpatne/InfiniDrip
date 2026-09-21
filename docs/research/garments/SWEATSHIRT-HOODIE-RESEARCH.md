# Cut-and-sew sweatshirt and pullover-hoodie research

_Slice 152 research record, prepared 2026-09-20. Research only: this document
authorizes no implementation, no recipe id, no new engine input, no save-format
change, no export-baseline movement and no physical claim. Every adopted
finding is a claim for Codex to verify independently._

**Codex review resolution.** Slice 154 rejects the no-band fallback as too
narrow to be an honest sweatshirt product. P0 includes a rib neckband, sleeve
cuffs and hem band using explicit user-owned finished circumferences. A shared
ratio-aware stretch-to-fit interface reports opening length, band length and
implied stretch without pretending to know recovery or automatically deriving
the band from the selected material. Exact defaults remain product seeds for a
future execution packet and must be validated across the rendered size run.
No new body measurement or save version is introduced. The pullover hood and
kangaroo pocket remain stage two, adult-only; zip front, raglan and true
fully-fashioned knitting remain outside this wave.

**Standing limitation.** No InfiniDrip garment has been cut, sewn, washed or
worn. Nothing here is evidence of fit, stretch recovery, shrinkage, drape,
sewability, comfort, safety, manufacturability or production readiness. Where
this record uses "stretch", "recovery", "negative ease" or "rib", it is
reporting a *source's* statement or a *digital input requirement*, never a
measured InfiniDrip result.

**Dependency order is deliberate.** §§1–9 establish a **crewneck sweatshirt**
as a standalone garment. §§10–13 add the **pullover hood** and **kangaroo
pocket** on top of it. The hood sections assume the sweatshirt sections are
settled; a hood must not be scoped before the band contract it depends on.

---

# PART A — CREWNECK SWEATSHIRT

## 1. Product scope

### 1.1 Named garment and intended variants

A **cut-and-sew crewneck sweatshirt**: a knit pullover cut from piece goods
(sweatshirt fleece or French terry), with a set-in sleeve, a rib neckband, and
rib cuffs and hem band. It is *cut and sewn*, not knitted to shape.

| Variant | Status |
|---|---|
| Crewneck sweatshirt, set-in sleeve, plain hemmed cuffs and hem | **Reject as P0 after Codex review** — digitally easy but not an honest sweatshirt target |
| Crewneck sweatshirt with rib neckband, cuffs and hem band | **Include as P0** through the explicit user-owned band contract in §7 |
| Pullover hoodie (hood + kangaroo pocket) | **Include as a second stage**, after Part A ships |
| Raglan sweatshirt or hoodie | **Defer** — new sleeve/armhole topology (§4.4) |
| Zip-up hoodie / lightweight zip jacket | **Defer** — named a later family by the wave packet; §16 records why |
| True fully-fashioned knitted sweater | **Reject** — a different engine domain (§16) |
| Quarter-zip, half-zip, crop, oversized-drop-shoulder | **Reject** — no evidence reviewed, no stated user problem |

### 1.2 Why this garment, and what it costs

A crewneck sweatshirt is the shortest honest path from the shipped tee to a
genuinely new knit outerlayer: it reuses the bodice, the set-in sleeve and the
neckline machinery with real construction justification (§4). Its cost is that
the feature a maker would actually name as "what makes it a sweatshirt" — the
rib neckband, cuffs and hem band — is precisely the feature the engine cannot
express today (§7). This record refuses to resolve that with a constant.

### 1.3 A finding that shapes everything below

**The shipped knit tops describe a neckband they never draft.** `TEE` /
`FITTED` / `TANK` produce exactly the roles `front`, `back` and (for sleeved
tops) `sleeve`. `KNIT_ALLOWANCES` sets `neckline: 0.6` with the in-code comment
"narrow, for the rib band"; `KNIT_BOM` lists "Rib knit / Neckband / 0.1 m"; the
tee construction step reads "Attach the neckband, matching centre-front and
shoulder notches." No neckband piece exists in any block.

So a rib band is already *assumed* by the shipped allowance, BOM and
construction text, and has simply never had to be geometry. A sweatshirt is the
first garment where that stops being acceptable — and the reason it was never
drafted is the same reason it still cannot be: its length depends on the trim's
stretch, which the draft graph does not receive.

### 1.4 Out of scope

Physical sampling; fit, drape, recovery, shrinkage or wash claims; any 3D or
drape simulation; a stretch-aware grading model; changes to `nestPieces`,
Epic 7 planning state, Electron release code or any protected export baseline.

---

## 2. Evidence boundary and independence rules

Sources were opened and read. Retailer listings and blogs restating one another
count once. A single commercial pattern establishes that a feature exists and
how one publisher realises it; it does not establish a universal formula.

Independence groupings:

- **Institutional:** T9 (University of Kentucky Cooperative Extension).
- **Professional patternmaking publisher:** T5 (M. Mueller & Sohn).
- **Official pattern publisher:** T4 (Jalie).
- **Open-source parametric drafting:** T1/T2/T3 (FreeSewing Sven, Hugo, Huey).
  These are **one project** and count once for independence — but their
  *internal disagreement* is itself evidence and is recorded as such (§6, C2).
- **Pattern-company and designer technique guidance:** T10 (In the Folds),
  T11 (Megan Nielsen), T12 (O! Jolly!), T13 (Greenstyle), T8 (Curvy Sewing
  Collective), T7 (TREASURIE). Independent of each other; individually weaker
  than institutional sources; used for corroboration and for conflict mapping.
- **Parametric generator:** T6 (Nastix Patterns) — exposes its inputs, which is
  what makes it useful; its outputs were not purchased or inspected.
- **Regulatory guidance:** T14 (US CPSC business guidance page).
- **Local project references:** L1–L4, routed in `CONTEXT-INDEX.md`.
- **Encyclopaedic, definition only:** T16. Explicitly **not** used for any
  numeric or geometric claim.

No pattern shapes, drafting diagrams, source code or long passages were copied.

---

## 3. What the shipped engine actually provides for a knit top

Read from the code, so the reuse audit below is grounded rather than assumed.

- `bodice` (`src/drafting/bodice.ts`) drafts one on-fold panel — `neckline`,
  `shoulder`, `armhole`, `side`, `hem`, `centerFront`/`centerBack` — and
  exposes an `armhole` interface. It takes optional `necklineParams` and an
  optional `strapWidth` (sleeveless).
- `derive(m)` gives `chestWidthHalf = (chest + ease) / 4`,
  `shoulderHalf = shoulderWidth / 2`, `neckWidthHalf = chest / 20 + 2`,
  `frontNeckDepth = neckWidthHalf + 1`, `backNeckDepth = 2.5`,
  `shoulderSlope = 4`.
- `necklineEdge` (`src/drafting/neckline.ts`) builds a true quarter-ellipse with
  `QUARTER_ELLIPSE_K = 0.5523`, pinned so the curve meets the centre fold
  perpendicular. It accepts `widthEase` (per side) and `frontDrop`, and emits
  warn-never-clamp notes when the neckline reaches the shoulder seam or drops
  below the underarm.
- `sleeve` (`src/drafting/sleeve.ts`) solves the cap height so the cap length
  equals `targetArmhole + CAP_EASE`, where `CAP_EASE = 1.5` cm is a **module
  constant**. Width is `bicep + ease * 0.5`; taper is a constant 3.
- `sleevedTopStitches` declares shoulder, side, sleeve underarm and a
  sleeve-cap-ease stitch with `ease: { lo: -1, hi: 4 }` cm.
- `TSHIRT_GRADE` is `chest +5, shoulderWidth +1.2, bicep +1.5, length +2,
  armholeDepth +0.6, sleeveLength +0.8` per step; `neck` is absent, so the
  neckline grades implicitly through `chest` (about +0.25 cm per side per step
  from `chest / 20 + 2`).
- `KNIT_ALLOWANCES`: default 1, `centerFront`/`centerBack` 0 (folds), `hem` 2,
  `neckline` 0.6.

---

## 4. Existing-engine reuse audit (sweatshirt)

### 4.1 Reuse unchanged

| Capability | Why it is construction-correct for a cut-and-sew sweatshirt |
|---|---|
| `bodice` on-fold front and back panels | A cut-and-sew sweatshirt body is a front and a back panel joined at shoulders and sides, cut on the centre fold. This is the same construction, not a convenient likeness. FreeSewing Sven confirms the piece set: "Cut **1 back** on the fold, Cut **1 front** on the fold, Cut **2 sleeves**" (T1). |
| `necklineEdge` crew geometry | A crewneck is a round neckline meeting the centre fold at a right angle. Slice 62 rebuilt this curve specifically to satisfy that rule, and the rule is why the mirrored halves do not spike. Nothing about it is tee-specific. |
| `sleeve` set-in cap solved to the real armhole | Two independent sources draft a sweatshirt with a **set-in** sleeve: FreeSewing Sven uses "Set-in sleeves using flat-sleeve technique (not raglan)" with a full sleevecap option set (T1); Jalie 3355 View A is "Sweatshirt with set-in sleeves and banded neck/cuffs" (T4). The Slice 54 fix — measuring the armhole off the *actual* assembled panels via `context.interfaceLength` — is exactly what a wider sweatshirt armhole needs. |
| `Stitch` / `interfaceLength` / `stitchChecks` | Seam truth via `cubicLength`-walked paths. The neckband and hood seams below depend entirely on this being a real arc length, not a span. |
| `PatternMark` | Fold lines, quarter/centre marks, pocket placement, drawcord exits — all internal construction data outside the cut outline. |
| Grade-by-redraft, POM engine, checker primitives, all six writers | Garment-agnostic. |
| Boundary Rail controls, `inputError`, warn-never-clamp | Unchanged. |

### 4.2 Parameterized derivative

| Feature | Evidence | Parameterization |
|---|---|---|
| **Body and sleeve ease** | FreeSewing Sven's sweatshirt defaults sit above its shirt-block baseline: chest ease 15% (range −4…35%), biceps ease 15% (0…50%), hips ease 8%, shoulder ease 0%, collar ease 10% (T1). Jalie 3355 asks for a knit with 10% stretch, i.e. the pattern is drafted expecting the fabric to supply part of the room (T4). | The shipped `ease` (applied at `(chest + ease) / 4`) and the sleeve's `bicep + ease * 0.5` reach the same place in centimetres rather than percent. **New defaults only.** No mechanism change. |
| **Neckline width and depth** | A sweatshirt crew neck is wider and slightly deeper than a tee's. `NecklineParams.widthEase` and `frontDrop` already exist and the tank already consumes non-default values. | Defaults only. **Critical constraint in §4.5.** |
| **Length** | FreeSewing Sven "Length bonus", default 15%, range 0–30% — explicitly longer than its base block (T1). | The shipped `length` measurement already covers this. |
| **Armhole depth** | Sven exposes armhole depth as its own option, default 2% (range −10…50%) on its v3 calculation (T1). | The shipped `armholeDepth` is already a user field. Defaults only. |
| **Grade** | `TSHIRT_GRADE` is a body-girth/length delta table applied by redrafting; nothing in it is tee-specific. | Reuse, with the band and hood exceptions in §9. |

### 4.3 New component contract

| Feature | Note |
|---|---|
| **Rib neckband** | A folded band whose lower edge joins the combined front + back neckline. FreeSewing Sven: "Cut **1 strip** for the neck opening binding" (T1). Jalie 3355 A: "banded neck/cuffs" (T4). This is a genuinely new role — see §1.3. Its **length** is blocked (§7). |
| **Rib cuffs** | Sven: "Cut **2 strips** for the cuffs" (T1). Same blocker. |
| **Rib hem band** | Sven: "Cut **1 strip** for the hem" (T1). Same blocker. |
| **Neckline interface exposure** | To size a band from the real neckline, the grammar resolver needs a measured length. `bodice` currently exposes only `armhole`. Either add a `neckline` interface to `bodice` (additive — an interface is a name, not geometry; must be proven byte-identical for tee, fitted, tank and polo), or have the sweatshirt's own component function measure `front.neckline` + `back.neckline` directly. Both are small; the choice is Codex's. |

### 4.4 New engine input — stop / defer signals

| Requirement | Why it cannot be a constant | Smallest unblocking decision |
|---|---|---|
| **Rib band negative ease** (neckband, cuffs, hem band) | Sources span **66.7% to 95%** of the opening and every one of them conditions the number on the specific trim's stretch (§6, C1). The draft graph receives no stretch value. A fixed factor is a hidden material assumption — the precise reason Epic 11 deferred the Polo sleeve rib. | **G1:** may `GarmentRecipe.draft` receive the selected `StretchFabric`, or a declared trim-stretch input? Until then: draft bands **1:1** and report the required stretch as guidance, or omit bands entirely (§15). |
| **Ease expressed as a percentage that grades** | The existing `Stitch.ease` band is evaluated by `inBand` as an **absolute centimetre** difference. The neckline circumference grows on the order of a centimetre per size step — a derived estimate from `neckWidthHalf = chest / 20 + 2` under `chest +5`, not a measured value, and one Codex should confirm against the real drafted arc lengths. A constant cm ease band is therefore a *different percentage at every size* — a silent grading defect. | **G6:** decide whether band joins use a stitch ease band at all, and whether band length grades. |
| **A head / overhead body measurement** | Mueller & Sohn ties hood depth to "the overhead measurement" (T5). `Measurements` has no head field, and `TSHIRT_GRADE` has no head row. See §12.4. | **G2:** adding any `Measurements` field breaks existing `SAVE_VERSION = 5` saves — see the jogger packet §3.4 for the read-from-code proof — so it requires a version bump, which is a permanent stop condition. |
| **Raglan armhole and sleeve** | FreeSewing Hugo is raglan (T2); Mueller publishes raglan construction as its own method. `bodice` and `sleeve` have no raglan topology, and the raglan seam runs neckline-to-underarm across both panels. | Genuinely new geometry. **Defer**; set-in has two independent sources for the sweatshirt (T1, T4). |
| **Eyelet / grommet mark kind** | `PatternMark` has no eyelet kind (see the jogger packet §3.4). Greenstyle specifies "large eyelet size (1/4")" for a hood drawcord (T13). | **G3:** represent as a `buttonhole` mark plus BOM text, or extend the shared union. |
| **Per-fabric nesting** | `nestPieces` takes one width for all pieces. A sweatshirt uses main fleece plus rib trim in every source. | **G4:** a future epic; explicitly not Epic 7. |
| **Direction of greatest stretch on a piece** | UKY: "the greatest amount of stretch should go around the body" (T9); rib "may stretch 100 percent in the crosswise direction" (T9). The grainline contract is a two-point line with no stretch semantics. | **G5:** declare stretch direction as data, or fix an unambiguous construction-note convention. |

### 4.5 Reuse that looks safe and is not — the shoulder-seam trap

Widening the neckline is the obvious way to make a tee crew into a sweatshirt
crew, and it is a real trap in **this** codebase.

`necklineEdge` sets `hps = point(neckWidthHalf + widthEase, 0)`. The shoulder
edge runs from `hps` to `point(shoulderHalf, shoulderSlope)`. So changing
`widthEase` on one panel changes that panel's shoulder length. Slice 62 hit
exactly this: widening the tank front surfaced a shoulder-seam mismatch that
`stitchChecks` caught during verification, and the fix was to widen the back
equally (`TANK_BACK_NECKLINE`).

**Adopted rule:** any sweatshirt or hoodie neckline `widthEase` must be applied
**equally to front and back**, and `frontDrop` applied to the front only (the
front drop does not move `hps`, so it does not disturb the shoulder). A test
must assert the shoulder stitch matches at every neckline setting, not just at
defaults. This is a reuse-correctness proof, not a style preference.

### 4.6 Explicitly rejected reuse

- **Do not reuse the woven shirt's folded `sleeveBand` as a rib cuff.** It is
  drafted to the exact sleeve-hem length with no negative-ease rule; reusing it
  would silently assert 1:1 where the entire point of a rib cuff is that it is
  not. The Polo V2 record rejected the same reuse for the same reason.
- **Do not reuse the woven shirt's collar/stand for a neckband.** A stand is a
  shaped, stabilised, woven structure; a rib neckband is a folded stretch
  strip. Matching a length does not make the construction the same.
- **Do not inherit `CAP_EASE = 1.5` unexamined.** It is a module constant in
  `sleeve.ts` chosen for a jersey tee. A sweatshirt fleece is thicker and the
  cap-ease stitch band is `{ lo: -1, hi: 4 }` cm. Whether 1.5 cm is right for
  fleece is a **material question this engine cannot answer**; it must be
  recorded as an inherited assumption, not silently re-blessed.
- **Do not reuse `TANK`'s sleeveless armhole.** Irrelevant here, but noted so
  a future contributor does not reach for it when widening the armhole.

### 4.7 Physical unknowns

Rib recovery after wear and laundering; whether a drafted neckband opening
passes over a head; fleece shrinkage; cap-ease behaviour in a thick knit; band
roll; hood stand and drape; whether topstitching distorts a fleece pocket; bulk
at the shoulder/neckband/hood intersection.

---

## 5. Set-in versus raglan scope

| | Set-in | Raglan |
|---|---|---|
| Sources for a sweatshirt | FreeSewing Sven (T1); Jalie 3355 A and B (T4) — **two independent** | FreeSewing Hugo (T2) — one, and it is a hoodie not a crewneck |
| Engine support today | Complete: `bodice` armhole + `sleeve` cap solved to the real armhole | None: no raglan armhole, no raglan sleeve, no raglan neckline join |
| Seam-check impact | The existing cap-ease stitch already models the non-1:1 join | Would need new interfaces and a new check family |

**Verdict: set-in for v1; raglan deferred.** Raglan is a legitimate future
variant — Hugo shows a working parametric raglan hoodie — but it is new
geometry, not a parameter, and scoping it alongside a first band contract would
compound two hard problems.

---

## 6. Source-conflict table

| # | Question | Source A | Source B | Conflict | Treatment |
|---|---|---|---|---|---|
| C1 | Rib band length as a fraction of the opening | UKY CT-MMB.165: "Cut ribbing two-thirds the measured length of garment seam lines plus ½ inch for seam allowances" → **66.7%**. The same document adds an exception: "V-necklines are cut the same measurement as the garment neckline seam measures" → **100%** (T9). | In the Folds: "around 80% of the neckline measurement" for self fabric, "around 70-75%" for ribbing, and "Stretchier ribbing may go below 70%" (T10). Megan Nielsen: for knits with "around 20/30% stretch … make the neck band 15% smaller" → **85%** (T11). FreeSewing "Ribbing stretch": Sven default **15%** (0–30%), Huey default 15% (0–30%), Hugo default **5%** (0–10%) (T1, T2, T3). | **Spread of roughly 66.7% to 95%,** plus a 100% exception for one neckline shape. | **No universal ratio is adopted.** Every source that explains itself conditions the number on the trim's measured stretch, and one adds a *shape* exception. This is the single strongest argument that band length is a material input (G1), not a constant. |
| C2 | Does one project even agree with itself? | FreeSewing Sven: ribbing stretch 0–30%, default 15% (T1). Huey: identical (T3). | FreeSewing Hugo: ribbing stretch **0–10%, default 5%** (T2). | Same option name, same project, one third the range and one third the default. | Recorded as evidence that the value tracks the *design's chosen trim*, not the garment class. Not a defect in FreeSewing; a fact about the quantity. |
| C3 | How is band length actually determined in practice? | O! Jolly!: no ratio at all — "lay the tape measure flat on a table and stretch the folded ribbing until it reaches the length measured for the neckline", with a worked example of 20 inches of ribbing stretching to a 25-inch neckline (i.e. 80%) (T12). | Jalie 3355 publishes band pieces as **graded pattern pieces** and the maker stretches them to fit (T4). | No conflict in mechanism; both make the ratio an *outcome* of the specific trim rather than an input. | **Adopted framing:** the honest digital model is "draft a band the user specifies and report the required stretch", not "compute the band from a factor". |
| C4 | Band cut width | UKY: "cut ribbing twice the desired width … Add ½ inch for seam allowances in both directions" (T9). | O! Jolly!: for a 1-inch finished neckband, cut 3 inches total — "0.5 inch seam allowance, one inch for the public layer of the rib, one inch for the inside layer, and another 0.5 inch seam allowance" (T12). | **No conflict** — identical rule stated twice. | **Adopted sourced rule:** cut depth = 2 × finished depth + 2 × seam allowance. This is a *geometric* rule with no material dependency and can be implemented. |
| C5 | Finished band depth | In the Folds: 2 cm finished for self fabric, 2.5 cm (1 inch) for ribbing (T10). | FreeSewing "Ribbing height": Sven 8% (3–15%), Hugo 10% (4–20%), Huey 10% (5–15%) — percentages of a derived dimension, not centimetres (T1, T2, T3). | Absolute cm versus proportional. | **Finished depth is a user-owned option in centimetres**, consistent with every other InfiniDrip control. No default is proposed for a *sweatshirt* band because In the Folds' figures are for tee necklines, not sweatshirt hem bands. |
| C6 | Does a band stretch out if over-stretched? | In the Folds: "if it is stretched out too much, it may create gathers around the neckline" (T10). | UKY: "Check for fabric recovery after stretching. When the fabric is released, it should spring back to its original size. If the fabric remains distorted, it will likely stretch out of shape with handling and wear and should be avoided." (T9) | No conflict. | **Guidance content, not geometry.** Supports reporting the required stretch percentage so a user can judge it against their own swatch. |
| C7 | Hood piece count | FreeSewing Hugo: "Cut **4 hood sides** (2x2 pairs) … Cut **2 hood centers**" — a **three-piece** hood, lined (T2). | FreeSewing Huey: "Cut **4 Hood** parts" — a **two-piece** hood, lined (T3). Nastix generator output: "Two-piece side hood (cut 2 mirrored)" (T6). TREASURIE: cut "2 from the outside fabric and 2 from the inside fabric" (T7). | Two-piece is the majority; three-piece is real and adds a centre panel. | **Two-piece adopted for v1** (three independent sources), three-piece recorded as an evidenced later variant. Mueller notes contoured hoods with centre panels among its hood types (T5). |
| C8 | Hood parameter vocabulary | Mueller & Sohn: close-fitting hood depth "30–34 cm", loose-fitting "30–36 cm", hood width "26 – 28 cm" — absolute centimetres tied to "the overhead measurement" (T5). | Nastix generator separates **hood height** (default 38 cm) from **hood depth** (default 30 cm) (T6). FreeSewing Huey uses percentages: hood height 59% (55–65%), hood depth 8.5% (5–12%), plus hood angle 5° (2–8°) and hood cutback 10% (5–15%) (T3). | **Definitional conflict.** "Depth" means a different dimension in each source, and the magnitudes are not comparable. | **No hood dimension default is adopted from any source.** Any implementation must define its own named dimensions from first principles and state, explicitly, that published hood numbers are not interchangeable. |
| C9 | Hood neck seam versus garment neckline | Curvy Sewing Collective drafts from **separate front and back neckline stitching distances**, each measured along the stitching line "stopping 1/2" before shoulder", with point 0 defined as "the shoulder notch – right where the hood crosses the shoulder seam"; "combined front and back stitching distances equal the hood's neck edge length" (T8). | Mueller & Sohn: the attachment seam is "Neck width plus the amount the neckline is lowered at the centre front", and for a loose-fitting hood "plus 4 – 5 cm" (T5). TREASURIE: the hood bottom edge is "half your neck measurement" for a two-piece hood (T7). Nastix: "The hood neckline seam must align with the finished garment neckline", with a separate "Neckline ease" input (T6). | Agree that the hood neck edge is derived from the *garment* neckline; disagree on whether ease is added and how much. | **Adopted sourced rule:** the hood neck edge is built from the real front and back neckline arc lengths, walked separately. **Ease is an option with no adopted default** (4–5 cm is Mueller's loose-fit figure for their draft, not a universal). |
| C10 | Does a hood change the body neckline? | Mueller's attachment-seam formula explicitly includes "the amount the neckline is lowered at the centre front" (T5). | Nastix exposes "Front overlap" as affecting "usable lower seam and face opening position" (T6); Curvy Sewing Collective notes its method yields a large-volume hood "without significant center front overlap" (T8). | Agree that CF lowering / overlap is a first-class hood variable. | **Adopted, and it is the key finding of Part B:** a hoodie is **not** "crewneck sweatshirt plus hood". The neckline must change. Fortunately `NecklineParams.frontDrop` and `widthEase` already exist (§12.1). |
| C11 | Kangaroo pocket proportions | FreeSewing Huey: pocket width 60% (50–70%), pocket height 30% (25–35%), pocket opening 90% (60–90%) (T3). Hugo: pocket width 50% (35–65%) (T2). | LearnMYOG: positioned "2 inches (5cm) above the bottom edge", centred on the front panel, topstitched "along the top, bottom, and both short sides … using a 3/8" (10mm) seam allowance", with the diagonal edges left unsewn as the openings and bartacks at the corners (T15). | Proportional versus absolute; no numeric overlap to compare. | Proportions **and** the hem clearance are both adopted as *mechanisms*. **No default is adopted** — Hugo and Huey disagree by 10 points on width alone, and Huey's is a split two-piece pocket for a zip front. |
| C12 | Kangaroo pocket piece count | Hugo (pullover): "Cut **1 pocket** (on fold)" plus "Cut **2 pocket facings**" (T2). | Huey (zip-up): "Cut **2 pocket** parts" (T3). | No conflict — the split follows the front closure. | **Adopted:** one on-fold pocket for a pullover; the two-piece form belongs to the deferred zip variant. |
| C13 | Children's hood/neck drawstrings | CPSC business guidance: upper outerwear means "clothing, such as jackets and sweatshirts"; drawstrings at the hood and neck are **prohibited entirely** in sizes 2T to 12; waist/bottom drawstrings in sizes 2T to 16 are limited to "3 inches outside the drawstring channel when the garment is expanded to its fullest width", must be "free of toggles, knots, and other attachments", and a continuous drawstring "must be bar tacked" (T14). | — | No conflict. | **Flagged as a regulatory question, not answered.** Unlike the jogger, a sweatshirt **is** within the described scope. See §17. This record makes no legal or compliance claim. |
| C14 | Fabric requirement | Jalie 3355: "knit with 10% stretch in the width (medium-weight sweatshirt fleece, French terry)" (T4). | UKY classifies sweatshirt knit among "Firm, stable knits [that] have very little stretch"; stable knits "stretch ½ inch or less (10 percent)" on a 4-inch gauge (T9). | **Agree**, and usefully: Jalie's minimum is exactly UKY's stable-knit ceiling. | **Adopted as context:** a sweatshirt body fabric is at the *stable* end, which is precisely why the bands must be a **different, stretchier** material. Two materials, one garment — see G4. |

---

## 7. The band contract — the central blocker

Every sweatshirt band (neck, cuffs, hem) reduces to one question: **how long is
the band relative to the opening it joins?**

What is *not* in dispute and **can** be implemented today:

- **Cut depth** = 2 × finished depth + 2 × seam allowance (C4 — two sources,
  identical).
- **Application** = fold lengthwise, match centre and quarter marks, stretch to
  fit (T9, T2, T4 — agree).
- **The opening must be measured along the seam line, not as a span.** UKY is
  explicit: "To measure necklines and armholes, stand measuring tape on end
  along pattern seam line to determine length accurately." (T9) The engine's
  `interfaceLength` → `edgeLength` → `cubicLength` already does exactly this.
- **Rib is cut with its greatest stretch along the band's length** (T9).

What **is** in dispute and cannot be implemented as a constant:

- **The ratio.** 66.7% to 95% across sources, with a 100% exception for
  V-necks, and one project disagreeing with itself by 3× (C1, C2).

### 7.1 Three candidate treatments and the adopted contract

| Option | What it does | Honest? | Cost |
|---|---|---|---|
| **B0 — no bands** | Research fallback with plain turned hems at neck, cuff and hem, like the shipped tee. | Digitally honest, product-incomplete | Not recognisably a sweatshirt to a maker; rejected as P0 |
| **B1 — 1:1 bands** | Draft real band pieces whose length equals the measured opening. Every seam is 1:1 and checkable. Guidance states plainly that the band is drafted at the opening length and that the user must shorten it for their trim. | Yes, and it produces the right *pieces* | Every source that specifies a crew neckband specifies one **shorter** than the opening (C1), so the app would be shipping a piece it simultaneously tells the user to change. Whether a 1:1 band behaves acceptably is a physical unknown this record cannot settle. |
| **B2 — user-owned finished band length** | `neckbandLength`, `cuffLength`, `hemBandLength` as finished circumferences the user sets, exactly as the jogger packet proposes for `cuffOpening`. The engine reports the implied stretch percentage. | Yes, and consistent with the maintainer's "every meaningful aspect adjustable" decision | Needs the §4.4 **G6** check-semantics decision, and the grading question in §9 |

**B2 is adopted for P0 by Codex review.** G6 resolves as a ratio-aware
stretch-to-fit relationship: the checker validates finite positive interfaces
and reports `openingLength / bandLength` as the user-selected requirement. It
does not force a universal pass band without material recovery evidence. B0 is
retained only as a research fallback and is rejected as the product target;
B1 and any fixed ratio are rejected outright.

### 7.2 Why the existing `Stitch.ease` mechanism is not a free answer

`stitchChecks` calls `inBand(label, la - lb, lo, hi)` — an **absolute cm**
difference. Under `TSHIRT_GRADE` the neckline circumference grows with every
size step (see §4.4 for the derivation and its caveat). A band declared with a
constant cm ease band is therefore a different *percentage* at XS than at XL. Any implementation that hard-codes
`ease: { lo: -4, hi: -2 }` on a band join has introduced a silent grading
defect that no existing test would catch. Recorded as **G6**.

---

## 8. Measurements and adjustable parameters (sweatshirt)

### 8.1 Body measurements

**No new body measurement proposed.** The sweatshirt reuses the shipped sleeved
knit-top field set: `chest`, `shoulderWidth`, `bicep`, `length`,
`armholeDepth`, `sleeveLength`, `ease`. Adding `neckWidthEase` and `neckDrop`
(already real `Measurements` fields used by the tank) is preferable to adding
anything new, and covers the hoodie neckline change in §12.1 at zero
persistence cost.

### 8.2 Proposed recipe options

| Option | Meaning | Default | Classification |
|---|---|---|---|
| `neckbandDepth` | Finished neckband depth; cut depth follows C4 | **no default proposed** | Product decision; C5 shows published depths are garment-area-specific |
| `cuffDepth` | Finished cuff depth | **no default proposed** | Product decision |
| `hemBandDepth` | Finished hem band depth | **no default proposed** | Product decision |
| `bandFinish` | `0` = turned hems (research fallback), `1` = bands at 1:1, `2` = user-owned band lengths | `2` | **Codex-reviewed product decision** — §7.1 |
| `neckbandLength`, `cuffLength`, `hemBandLength` | Finished band circumferences, active when `bandFinish = 2` | **future execution packet sets visible product seeds** | Adopted; ratio-aware guidance, never automatic material derivation |

**Deliberate omission.** No sweatshirt defaults are proposed for ease, length,
armhole depth, neckline width or band depth. Every candidate number found was
expressed as a percentage of a FreeSewing-internal dimension (T1–T3), or as one
publisher's graded piece (T4), or for a different garment area (T10). Codex
should set these from the shipped tee's rendered geometry and label them as
digital starting values.

---

## 9. Grading (sweatshirt)

`TSHIRT_GRADE` reused by redraft: `chest +5, shoulderWidth +1.2, bicep +1.5,
length +2, armholeDepth +0.6, sleeveLength +0.8`.

**Band grading is a real unresolved question.** Options are constant across the
size run in every shipped recipe. If band lengths are options, the band is the
same circumference at XS and XL while the neckline, wrist and hem all grow —
so the implied stretch differs at every size (§7.2). Three possible answers,
none adopted:

1. Bands grade proportionally with their opening (preserves the ratio, requires
   the ratio to exist — blocked by C1).
2. Bands are graded by their own declared delta table (needs evidence; **no
   source publishes band grade increments**).
3. Bands are drafted at the opening length at every size (B1), so grading is
   automatic and the ratio question moves entirely to the user.

Option 3 is the only one this evidence supports today. It must be labelled as a
deliberate limitation in the POM table, not presented as a band specification.

**Grading pressure to test:** at XS the neckband opening may approach the head
question; at XL the sleeve-cap ease band `{ lo: -1, hi: 4 }` may be approached
from either end as `bicep` and `armholeDepth` grade at different rates.

---

# PART B — PULLOVER HOOD AND KANGAROO POCKET

## 10. Sequencing

The hood and pocket are scoped **after** Part A because both depend on
decisions Part A owns: the hood attaches to a neckline whose width and drop
Part A controls (§12.1); the hood drawcord shares the eyelet representation
question (G3); and the kangaroo pocket's lower boundary depends on whether a
hem band exists (§13.3).

---

## 11. Hood — what the sources agree on

1. **The hood neck edge is derived from the garment neckline, walked along the
   seam line.** Curvy Sewing Collective measures front and back neckline
   stitching distances separately, "stopping 1/2" before shoulder", with the
   shoulder notch as the draft origin, and states that the combined distances
   equal the hood neck edge (T8). Nastix takes "Finished Neckline Length" as
   its primary input with the instruction "Measure the garment neckline along
   its stitching line", default 42 cm (T6). Mueller derives the attachment seam
   from neck width plus CF lowering (T5).

   **This maps exactly onto the engine's strength.** `interfaceLength` sums
   `cubicLength`-walked curves. A hood-to-neckline stitch would be
   `iface(edgeRef("front","neckline"), edgeRef("back","neckline"))` against the
   hood's own neck edges — a real arc-length match, never an endpoint span.

2. **The hood is at least two pieces, mirrored, and usually lined** (C7).

3. **A drawcord runs around the front edge in a casing, with eyelets or
   buttonholes.** FreeSewing Hugo: optional eyelets made with "the buttonhole
   feature" or manual holes, allowing "a cord … run around the front edge of
   the hood" (T2). Greenstyle specifies a ¼" eyelet, placed "2 inches up from
   the bottom of the hood" and "close to the front edge" because "I like to
   stitch the casing 1 inch wide", with grommets installed **before** the
   casing is stitched, over "fusible tricot interfacing … at least 2 layers"
   (T13).

4. **The hood front edge is finished by folding the edge into a casing, or by
   the lining seam.** Hugo joins outer and inner hoods "along the outer edge of
   the hood with a 1cm seam allowance", turns, and topstitches "approximately
   1.5-2cm from the edge" (T2). TREASURIE uses ½" (12 mm) allowance throughout
   and cuts 2 outer + 2 lining (T7).

5. **The hood attaches through or under a neckband.** Hugo: "match the outside
   of the hood to the right side of the neckline" and "serge or zig-zag all
   layers together with 1cm seam allowance", with a separate neck binding piece
   in the piece list (T2).

## 12. Hood — what the sources do not agree on, and what follows

### 12.1 The hoodie neckline is not the sweatshirt neckline

Mueller's attachment seam explicitly includes "the amount the neckline is
lowered at the centre front" (T5); Nastix exposes a separate "Front overlap";
Curvy Sewing Collective characterises its result as high-volume "without
significant center front overlap" (T8). All three treat the CF relationship as
a hood variable.

**Consequence:** a pullover hoodie is **not** a crewneck sweatshirt with a hood
bolted on. The body neckline must be wider and/or deeper, and the hood neck
edge must then be re-derived from *that* neckline.

**The engine already has the exact mechanism**, and it is already exercised:
`NecklineParams.widthEase` and `frontDrop`, which the tank passes as
`{ shape: "scoop", widthEase: 1.5, frontDrop: 5 }`. Two existing
`Measurements` fields — `neckWidthEase` and `neckDrop` — already surface these
to the user with plausibility bounds, controls and persistence.

**Two constraints carry over unchanged:**

- `widthEase` must be applied **equally front and back** or the shoulder seam
  mismatches (§4.5, the Slice 62 precedent).
- `necklineEdge`'s existing warn-never-clamp notes already fire when the
  neckline reaches the shoulder seam or drops below the underarm. Slice 63
  found those notes were computed and then **dropped by every caller**, and
  fixed it only for the tank. A hoodie recipe must actually surface them, or it
  reintroduces the same gap.

### 12.2 Hood piece count

Two-piece adopted for v1 on three independent sources (Nastix, TREASURIE,
FreeSewing Huey — C7). Three-piece is evidenced by Hugo and by Mueller's
contoured-hood family and is a legitimate later variant; the centre panel
absorbs the crown shaping that a two-piece hood puts into its back curve.

### 12.3 Hood dimensions — no default is adopted

C8 records a **definitional** conflict: Mueller's "depth" (30–36 cm), Nastix's
separate height (38 cm) and depth (30 cm), and FreeSewing's percentages are not
interchangeable quantities. Publishing any of them as an InfiniDrip default
would be presenting a number as sourced when the definition behind it does not
transfer.

**Proposed named dimensions**, defined from first principles, defaults left to
Codex:

| Option | Definition in InfiniDrip terms |
|---|---|
| `hoodHeight` | Vertical rise from the hood's neck seam at the shoulder notch to the crown |
| `hoodDepth` | Horizontal extent from the centre-back seam to the face opening |
| `hoodNeckEase` | Extra length added to the hood neck edge beyond the measured garment neckline (Mueller's 4–5 cm is one publisher's loose-fit figure, not a default) |
| `hoodFrontOverlap` | How far the two hood front edges overlap at centre front |
| `hoodCasingWidth` | Front-edge casing width; drives the drawcord exit placement |

### 12.4 Hood grading — an unresolved problem worth stating plainly

`TSHIRT_GRADE` has no head measurement, and `Measurements` has no head field.
Mueller ties hood depth to "the overhead measurement" (T5). So:

- The hood **neck seam** grades automatically and correctly, because it is
  re-derived from each size's actual neckline. That part is sound.
- The hood **height and depth** would be constant options across XS–XL, i.e.
  the same hood on every size. For adult sizing that may be closer to reality
  than grading a head with a chest; for a wide size run it is a visible
  limitation.
- Adding a head measurement triggers **G2** (the v5 save breakage).

**No answer is adopted.** Both readings are recorded, and any implementation
must state in the spec sheet which one it chose.

## 13. Kangaroo pocket

### 13.1 Definition and construction

A single front pouch with an opening at each side and no divider (T16, used for
definition only). One piece, cut on fold, for a pullover (C12). Attached by
topstitching the top, bottom and both short sides, leaving the diagonal edges
open, with bartacks at the opening corners (T15).

### 13.2 Geometry parameters

Mechanisms are evidenced; numbers are not transferable (C11).

| Option | Definition | Default |
|---|---|---|
| `pocketWidth` | Finished full width of the pouch | **none proposed** (Hugo 50%, Huey 60%, ranges overlapping but not equal) |
| `pocketHeight` | Finished vertical extent | **none proposed** |
| `pocketOpeningLength` | Length of each diagonal opening | **none proposed** |
| `pocketHemClearance` | Vertical gap from the pocket's lower edge to the body hem | LearnMYOG's "2 inches (5cm) above the bottom edge" is one publisher's figure (T15); recorded, not adopted |

### 13.3 Containment — the checks that matter

The front panel is cut **on fold**, so the pocket is a half-width problem in
piece coordinates, exactly like the trouser pocket's front-panel containment.
Required guidance, modelled on `trouserPocketGuidance`:

- Pocket half-width must stay inside the front panel's side edge at the
  pocket's own `y`, at **every** graded size (the panel narrows at XS while a
  constant-option pocket does not).
- Pocket lower edge must clear the hem, and — if `bandFinish` is not `0` — must
  clear the **hem band seam**, not the raw hem. This is the concrete dependency
  that makes the pocket a Part B feature.
- Pocket upper edge must clear the armhole/underarm region.
- Opening endpoints must lie inside the panel.
- Zero-width or zero-height pocket must restore the no-pocket topology rather
  than emit a degenerate piece.

### 13.4 Pocket facings

Hugo cuts "2 pocket facings" alongside the on-fold pocket (T2). Whether v1
drafts facings or names them in the BOM only is a product decision; a facing is
a real cut piece and should not be invisible to nesting if it is drafted.

---

# PART C — SHARED CONTRACTS AND PLAN

## 14. Pieces, quantities, folds, grain, seams and allowances

### 14.1 Proposed roles

**Sweatshirt v1 (B0, no bands):** `front` (1, on fold), `back` (1, on fold),
`sleeve` (2, off fold). Identical role set to the shipped tee.

**Sweatshirt with bands:** add `neckband` (1), `cuffLeft`/`cuffRight` (2),
`hemBand` (1).

**Pullover hoodie:** add `hoodLeft`/`hoodRight` outer (2, mirrored, off fold)
and, if lined, `hoodLiningLeft`/`hoodLiningRight` (2). Add `pocket` (1, on
fold) and optionally `pocketFacing` (2).

### 14.2 Fold and mirror semantics

`export/unfold.ts` mirrors any `onFold: true` piece about `x = 0` for the
projector, and fold edges take zero allowance by convention. The front, back and
kangaroo pocket are genuinely on-fold and already fit that model. Hood sides are
**mirrored pairs, not on-fold** — they must be drafted as two real pieces, as
`trouser.ts` already does with `mirrorPiece`, so the projector does not try to
unfold a piece that has no fold.

Bands raise the same question the jogger packet records in its §9.2: a doubled
band may be drafted at full cut depth off fold (simplest, one grain line,
`unfold` untouched) or on fold with the fold at `x = 0` (matches the reviewed
instructions). **Open question for Codex**, and it must be answered before any
band piece is drafted — the two choices produce different projector output and
different allowance on the fold edge.

### 14.3 Grain and stretch direction

UKY requires a "with nap" one-way layout for knits and the greatest stretch
around the body (T9). `nestPieces` never rotates and keeps grain upright, which
satisfies the directional requirement; Epic 7's advisory nap flag is consistent
and must not be modified here. The unrepresentable part remains **G5**: no
piece can declare which direction stretches, which matters most for rib bands
and for a hood whose stretch direction is not the body's.

### 14.4 Seam allowance ownership

The sweatshirt must own its own `AllowanceSpec`. It may start from
`KNIT_ALLOWANCES` — whose `neckline: 0.6` "narrow, for the rib band" is already
band-aware — but every edge needs a deliberate decision:

- fold edges: zero (existing convention);
- `hem`: 2 cm turn-up under B0, but a seam allowance under a hem band;
- band join edges, hood outer edge (Hugo uses 1 cm, TREASURIE ½"), hood neck
  edge, pocket edges (LearnMYOG topstitches at 3/8"/10 mm);
- Jalie's whole-garment 6 mm is a third convention (T4 family).

**Concave-offset risk:** the Slice 145 repair added a crossing-loop trim in
`src/render/allowance.ts` after a real concave allowance loop was found in the
shipped trouser back. A hood's back/crown curve and a widened, dropped neckline
are the same family of geometry. Allowance validity at the deepest neckline
drop and at the hood crown must be exercised deliberately (§18).

### 14.5 Interfaces and stitches

Shoulder (front ↔ back); side (front ↔ back); sleeve underarm; sleeve-cap ease
(existing `{ lo: -1, hi: 4 }` cm band, **inherited assumption** per §4.6);
neckband lower edge ↔ combined front + back neckline (non-1:1 when
`bandFinish = 2` — G6); cuff ↔ sleeve hem; hem band ↔ body hem; hood centre-back
seam (left ↔ right); hood neck edge ↔ combined neckline; hood outer edge ↔
lining outer edge; pocket top/bottom/side attachments as topstitched placements
against marks rather than closed seams.

---

## 15. Smallest honest P0

**An adult crewneck sweatshirt with explicit rib bands.**

- The shipped `bodice` front and back, on fold, with sweatshirt ease, length
  and armhole-depth defaults and an equally-widened front/back neckline
  (§4.5).
- The shipped set-in `sleeve`, cap solved to the real assembled armhole.
- Separate neckband, paired cuffs and hem-band roles. Their finished
  circumferences are visible user-owned options; the app reports each real
  opening-to-band ratio and never silently derives it from nominal stretch.
- Its own allowance map, notch table, POM list, style table, guidance and tech
  pack; a knit material default; `necklineEdge`'s existing warn notes actually
  surfaced (§12.1).
- Nesting output labelled as a single-bolt estimate if any second material is
  ever named in the BOM.

This is the smallest product-complete sweatshirt. It contains no hidden
material formula: band lengths remain explicit, invalid/implausible ratios stay
visible, and actual recovery remains a physical unknown. The first
implementation slice must define the shared ratio-aware stretch-to-fit
interface before drafting any band.

**Stage two, after Part A ships:** two-piece lined pullover hood with a
drawcord casing, plus an on-fold kangaroo pocket. Both depend on Part A's
neckline and hem decisions and on G3.

---

## 16. Deferred and rejected

| Item | Verdict | Reason |
|---|---|---|
| Rib neckband, cuffs, hem band | **Include in P0** | Use user-owned finished lengths plus ratio-aware guidance; automatic material-derived reductions stay deferred. |
| Pullover hood + kangaroo pocket | **Defer to stage two** | Evidenced and scoped here; depends on Part A |
| Three-piece hood | **Defer** | Evidenced (T2, T5); a later variant once a two-piece hood is proven |
| Raglan | **Defer** | New geometry, not a parameter; set-in has two independent sources for this garment |
| Hood lining | **Include with the hood** | Three sources line the hood (T2, T3, T7); an unlined hood front edge needs a different finish |
| **Zip-up hoodie / lightweight zip jacket** | **Defer — named a later family by the wave packet** | Beyond the packet boundary, it is a real topology change: the front splits into two off-fold pieces, the hood front becomes part of the closure (Huey's "Hood Closure" option controls exactly this, 10–15%, default 13.5% — T3), the kangaroo pocket splits in two (C12), and the band set changes. It is not a variant of a pullover; it is a second front architecture. |
| **True fully-fashioned knitted sweater** | **Reject for this engine** | The wave packet already places it outside this wave, and the reason is structural, not scheduling: a fully-fashioned sweater is shaped by stitch counts, yarn gauge, and increase/decrease schedules, not by cut outlines of named edges. Every layer of this app — `Piece`, `Edge`, `AllowanceSpec`, `flattenPiece`, the cutting writers — assumes a cut-and-sew piece. A knitted sweater has no cut line and no seam allowance. Supporting it means a different engine, not a new recipe. |
| Quarter-zip, half-zip, crop, drop-shoulder | **Reject** | No evidence reviewed, no stated user problem |
| Any fixed rib ratio | **Reject** | C1, C2, C3 |
| Any hood dimension copied from a source | **Reject** | C8 — the definitions are not interchangeable |

---

## 17. Drawcord safety and regulatory questions

Recorded as **open questions for the maintainer**. This record makes no legal,
compliance or safety claim, and nothing below should be encoded in behaviour
without a maintainer decision.

The CPSC business-guidance page read on 2026-09-20 states that upper outerwear
is "clothing, such as jackets and sweatshirts", that drawstrings at the hood and
neck area are prohibited in sizes 2T to 12, and that waist/bottom drawstrings in
sizes 2T to 16 are limited to 3 inches outside the channel with no toggles or
knots and with bar-tacking for a continuous string (T14). **A sweatshirt or
hoodie is within the described scope — unlike the jogger.**

1. Does the product intend to offer child sizes at all? The shipped size run is
   XS–XL derived from the user's own base measurements, with no absolute size
   semantics and no age mapping. Until that changes, the app cannot know whether
   a given draft is a covered size.
2. If child sizing is ever introduced, should the app refuse to draft a hood
   drawcord for covered sizes, warn, or stay silent? Refusing would be the first
   place this app clamps rather than warns, which cuts against the maintainer's
   standing decision — so it needs an explicit decision, not a default.
3. Should the bar-tack / anchor construction step be emitted for **every**
   drawcord garment as a plain construction-quality default, regardless of
   scope? Jalie instructs it independently for an adult jogger (jogger packet
   S1).
4. Is any non-US market in scope? One US government guidance page was examined
   and no other jurisdiction, standard, market requirement or certification
   regime.
5. Do hood drawcord **hardware** choices (metal eyelet versus worked
   buttonhole) carry any obligation the product should surface? No source
   reviewed addresses this.

---

## 18. Verification plan — future, not evidence

**This is a plan for work that has not been done.** No sweatshirt or hoodie
geometry, render or output exists. Nothing below asserts that any output has
been produced or inspected.

### 18.1 Parameter and size matrix

1. Default M with proposed defaults; XS and XL from the same base.
2. Full XS–XL graded run, redrafted and re-checked at every size.
3. Every static option boundary at min and at max.
4. Shortest relevant lengths: minimum `length` (40) with a hem band present;
   minimum `sleeveLength` (8) with a cuff present — the combination where a
   band can consume the whole sleeve.
5. Zero-length optional features: `hemBandDepth = 0`; `cuffDepth = 0`;
   `neckbandDepth = 0`; pocket width or height `0`; `hoodFrontOverlap = 0`;
   `hoodCasingWidth = 0`. Each must restore the uninterrupted topology rather
   than emit a zero-length edge or a degenerate piece, mirroring the Polo V2
   zero-vent rule.
6. Boundary-adjacent optional features: smallest non-zero band depth; overlap
   one step above zero; pocket clearance one step above zero.
7. Adjacent-component collisions: pocket versus hem band seam; pocket versus
   armhole; hood neck seam versus neckband; neckline drop versus armhole depth
   (the existing `necklineEdge` note must fire); neckline width versus shoulder
   seam (the §4.5 equal-widening rule must hold); cuff versus sleeve cap at
   minimum sleeve length.
8. Absent, low and high stretch: the same draft with Cotton woven (must warn),
   Cotton jersey (25%), Rib knit (50%), Spandex blend (80%). **Expected result
   today: geometry identical in all four cases.** A test should assert that
   identity so the day geometry starts depending on material cannot pass
   unnoticed.

### 18.2 Geometry and seam truth

9. Every curved interface verified by its **real walked seam path**. The
   hood-to-neckline join is the headline case: front and back neckline arc
   lengths summed via `interfaceLength`, never a horizontal span, never an
   endpoint chord — the same discipline Epic 11 imposed on the Polo stand.
10. Shoulder seam equality asserted across the full range of neckline width
    settings (§4.5).
11. Allowance joins at the hood crown, the deepest neckline drop, the pocket
    opening corners and the band corners, through the existing exact-corner
    solve and the Slice 145 crossing-loop trim; a broken outline must be
    visibly rejected, never scaled or clipped.
12. Zero-length edge rejection; non-self-intersecting outlines at every extreme.
13. Hood left/right mirror symmetry on pieces, marks and notches.
14. Band cut depth equals 2 × finished + 2 × allowance at every size (C4).

### 18.3 Persistence

15. A pre-sweatshirt v5 save loads unchanged with the new garment absent.
16. A sweatshirt/hoodie save round-trips, including all recipe options.
17. Raw invalid option values survive save, recovery and reload and stay
    visible to guidance.
18. Confirm by test that **no** new `Measurements` field was added. If one was
    (a head measurement — §12.4), the v5 breakage described in the jogger
    packet §3.4 must be reproduced and the version bump verified.
19. `DEFAULT_STRETCH_BY_GARMENT` in `src/ui/persist.ts` must gain an entry;
    `defaultStretchFabricForGarment` falls back to `STRETCH_FABRICS[0]`, which
    is **Cotton woven**, so omitting it silently defaults a knit garment to a
    woven.

### 18.4 Views, nesting, surface and outputs

20. All seven current views — Pattern, Body (front / back / pair / Side
    schematic), Size run, Spec, Nesting, Check, Edit — plus the reversible
    Assembled lens. The Body and assembled renderers take `hasSleeve`,
    `frontNeckline`, `backNeckline` and `strapWidth`; a hood and a kangaroo
    pocket have **no** render representation today, so either they are absent
    from the preview (and the preview is then knowingly incomplete, which must
    be stated) or a shared pure-geometry helper feeds both the draft and the
    schematic — the same rule Epic 11 adopted for the Polo collar so previews
    cannot drift from the draft.
21. Nesting at narrow and wide fabric widths, including a width narrower than
    the widest hood or pocket piece so the `fits = false` path is exercised;
    plus fabric-on-hand and the directional/nap notice **as Epic 7 ships them**,
    with no modification to `nestPieces`.
22. Surface placements empty and populated, including artwork anchored to a new
    role (hood, pocket, band) with true-scale cut-box containment, the 59 px/cm
    resolution floor and the coverage warning. A kangaroo pocket is the most
    likely real artwork target in this garment and the cut-box anchor must stay
    truthful once the front panel bounds change.
23. All six output families — SVG, DXF, tiled PDF, A0 PDF, projector SVG,
    tech pack — parsed with real consumers (DOMParser, DXF entity inspection,
    pdf-lib) **and** visually inspected as rendered pages, not accepted on
    parser success alone. The opt-in surface print sheet is a seventh,
    artwork-scoped output and should be exercised too.
24. Projector `unfold` behaviour confirmed for the on-fold front, back and
    pocket, and confirmed **not** applied to the mirrored hood sides.
25. Whether `a0Overflow` / `tiledPdfLocalCoordinates` are needed — a lined hood
    plus body plus sleeves plus bands is a large piece count, and the trouser
    needed both at Slice 101.
26. All eight protected legacy export hashes byte-identical; every non-
    sweatshirt output byte-identical. If a `neckline` interface is added to the
    shared `bodice` (§4.3), tee, fitted, tank and polo output must be proven
    byte-identical.

---

## 19. Construction order

Assembled from the reviewed sources; tech-pack text, not a sewability claim.

**Crewneck sweatshirt**

1. Confirm the knit against the pattern's stated stretch requirement and
   pre-treat the main fabric; do not pre-wash rib intended as trim (T9).
2. Stay or tape the shoulder and neckline seams (T9).
3. Join the shoulder seams, front to back.
4. Set the sleeves flat into the armholes, easing the cap.
5. Close the side and underarm seams in one pass.
6. Neck finish: turn and stitch (B0), or form the neckband into a loop, fold
   lengthwise, match centre and quarter marks, and stretch to fit (T9, T2).
7. Cuffs and hem: turned hems (B0), or folded bands applied as loops with
   quarter matching.
8. Press; inspect the neckline and band seams.

**Pullover hood and pocket, added**

9. Attach the kangaroo pocket to its placement marks: topstitch the top, bottom
   and both short sides, leaving the diagonals open; bartack the opening
   corners (T15).
10. Stabilise the hood front edge where the drawcord exits and install the
    eyelets or work the buttonholes **before** closing the casing (T13, T2).
11. Join each hood layer at its centre-back seam.
12. Join outer and lining hoods along the front/outer edge; turn and topstitch
    to form the casing (T2, T7).
13. Attach the hood to the neckline, matching centre back, both shoulder
    notches and centre front; secure through the neckband/binding (T2).
14. Thread the drawcord and anchor it so it cannot be pulled through (T14 and
    jogger packet S1).
15. Press; inspect the hood seam, casing and pocket corners.

---

## 20. Slice-band estimate

Planning estimates with stated uncertainty. They assume Codex owns geometry per
the standing delegation boundary.

| Scope | Estimate | Dominant uncertainty |
|---|---|---|
| Part A P0 (§15) — crewneck sweatshirt with explicit bands | **6–9 slices** | Combines the former 3–5-slice body derivative with the 3–4-slice ratio-aware band contract; shared integration can remove overlap but no smaller commitment is justified. |
| Part B — two-piece lined hood + kangaroo pocket | **+5–8 slices** | Hood geometry is genuinely new; the neckline must change and be re-proved; the preview-drift question (§18.4 item 20) is a real design decision; pocket containment must hold across the graded run. |
| Raglan variant | **+4–6 slices** | New armhole/sleeve topology and a new check family |
| Zip-up hoodie | **not estimable from this packet** | A second front architecture, deliberately out of scope |
| G1 (material stretch as a drafting input) | **an architecture epic, not a slice** | Changes a shared drafting signature across every recipe, the grammar, grading and the checker. Estimating it from inside a garment packet would be dishonest. |

Confidence: **moderate** for Part A P0 (the body is close to the shipped tee,
but the stretch-to-fit interface is new); **low** for Part B until hood dimensions are
defined from first principles; **none offered** past G1.

---

## 21. Verdicts

| Question | Verdict |
|---|---|
| Does a cut-and-sew crewneck sweatshirt belong in this app? | **Yes, include.** The block, sleeve and neckline reuse are construction-correct with two independent sources. P0 also introduces the bounded ratio-aware band-interface enhancement rather than shipping a tee-like no-band substitute. |
| Does a pullover hoodie belong? | **Yes, include as a second stage.** The hood-to-neckline seam is exactly the kind of real arc-length interface this engine is good at, and the neckline change it requires is already expressible. It must not be scoped before the sweatshirt. |
| Do they fit the current architecture? | **Partly.** The body/hood/pocket fit the component pipeline. Bands trigger the bounded ratio-aware interface; automatic material derivation, multi-material nesting and stretch-direction semantics remain separate future architecture. |
| Are they scalable and maintainable? | **Yes**, provided the band contract is resolved once and shared with the jogger's cuff contract rather than solved twice. Both packets hit the same wall for the same reason; a single decision unblocks both. |
| Do they improve user outcomes? | **Yes.** A sweatshirt and hoodie are among the most-made cut-and-sew knit garments, and the app currently offers no outerlayer at all. |
| Should they be implemented before the shipped gates clear? | **No.** Epic 11 remains the next implementation-ready geometry epic after its unchanged Epic 7 gate. |
| Which of the two knit-family packets should go first if only one can? | **This one after the shared band-interface slice.** It yields the largest visible new upper-body capability; the jogger remains the next lower-body derivative after shorts. |

---

## 22. Physical validation plan

Physical sampling remains explicitly paused at the maintainer's request. When
reopened, a sweatshirt/hoodie record must capture: the wearer's measurements
with the same landmarks; the exact main knit with a measured stretch percentage
and a recovery test, and the same for every trim separately; calibration of the
printed or projected output; the tops POMs from L1 — A (length from HSP/CB),
B (½ chest), D (½ hem), E (½ hip), F (neck width), F1/F2 (front/back neck drop),
F8/F9 (hood length and width, "Lay hood flat. Length is shoulder-neck meeting
point to hood top; width is widest point"), and sleeve length "including cuff" —
with, per L1, **relaxed and stretched states recorded separately** for every rib
band and elastic hem; the sewn result against the predicted POMs; band recovery,
neckband lay-flat, hood stand, pocket corner strain; and shrinkage after
laundering. None of this evidence exists.

The app can only ever predict a **relaxed** POM today, because it holds no
stretch input. A spec sheet that prints one neck-opening number for a rib
neckband without saying "relaxed" would be misleading; L1's two-state
convention should be adopted in the POM labels from the first banded garment,
and shared with the jogger packet's cuff POMs.

---

## 23. Decisions, estimates and unresolved questions

### 23.1 Product decisions proposed

- Crewneck sweatshirt first; pullover hood and kangaroo pocket second.
- Set-in sleeve; raglan deferred.
- Two-piece lined hood; three-piece deferred.
- One on-fold kangaroo pocket for a pullover.
- P0 ships with explicit user-owned rib neckband, cuff and hem-band lengths
  (B2); the no-band B0 fallback is not the product target.
- P0 is adult-only; child-age mapping and covered-size drawcord behavior are
  outside this packet.
- Drawcord exits represented as buttonhole marks; hardware named in BOM text.

### 23.2 Engineering decisions proposed

- The sweatshirt owns its own allowance map, notch table, POM list, guidance
  and style table; it imports no tee table wholesale.
- Neckline `widthEase` applied equally front and back, asserted by a shoulder-
  seam test across the full range.
- `necklineEdge`'s existing warn notes are actually surfaced by this recipe.
- The hood neck edge is built from separately walked front and back neckline
  arc lengths.
- Band cut depth = 2 × finished depth + 2 × seam allowance (the one band rule
  with no material dependency and two agreeing sources).
- Band and hood geometry facts come from one pure helper consumed by both the
  draft and any schematic preview, so a preview cannot drift from the draft.
- `CAP_EASE = 1.5` is recorded as an **inherited assumption** carried from the
  jersey tee, not re-blessed for fleece.

### 23.3 Estimates and starting values

**None proposed.** No default is published here for ease, length, armhole
depth, neckline width or drop, band depth, band length, hood height, hood
depth, hood neck ease, hood overlap, casing width, or any pocket dimension.
Every candidate number found was a percentage of a source-internal dimension, a
single publisher's graded piece, a figure for a different garment area, or —
for hood dimensions — a quantity whose *definition* does not transfer (C8).
Codex should set defaults deliberately from the shipped tee's rendered geometry
and label them as digital starting values.

### 23.4 Open questions requiring maintainer or Codex input

1. **G1** — Slice 154 resolves P0 without passing material into drafting:
   explicit band lengths plus reported ratios. Automatic material-derived
   lengths remain deferred.
2. **G2** — Slice 154 rejects a new head measurement/save bump for P0; hood
   dimensions remain recipe options and make no head-fit claim.
3. **G3** — Slice 154 uses buttonhole marks plus BOM/construction text for P0;
   a distinct eyelet union member waits for a consumer that needs it.
4. **G4** — per-piece material and multi-bolt nesting: which epic?
5. **G5** — how is direction-of-greatest-stretch declared on a piece?
6. **G6** — Slice 154 selects a ratio-aware stretch-to-fit interface that
   reports the user-owned ratio and does not reuse absolute-cm `Stitch.ease`.
   Exact grading behavior remains an execution-packet decision.
7. Fold policy for doubled bands (§14.2) — must be shared with the jogger
   packet, not decided twice.
8. Expose a `neckline` interface on the shared `bodice`, or measure it inside
   the sweatshirt's own component? (§4.3)
9. Hood height/depth grading: constant across the run, or a new body
   measurement? (§12.4)
10. Preview fidelity: does the assembled/Body view represent the hood and
    pocket, or is the preview knowingly incomplete and labelled so? (§18.4)
11. The five drawcord-safety questions in §17.
12. Sequencing against the jogger packet — this record recommends the
    sweatshirt first (§21).

---

## 24. Sources

All web sources opened and read on **2026-09-20**. No source code, pattern
shape, drafting diagram or long passage was copied. Quoted fragments are short
factual statements recorded for comparison.

### Open-source parametric drafting (one project — T1–T3 count once)

- **T1** — FreeSewing, *Sven sweatshirt* — design page and Design Options
  (set-in flat sleeve; cutting instructions; ribbing binding at the neck;
  "Ribbing stretch" described as "The amount of negative ease to apply to the
  ribbing used for cuffs and hem", default 15%, range 0–30%; ribbing height 8%
  (3–15%); chest ease 15%, biceps ease 15%, cuff ease 20%, collar ease 10%,
  hips ease 8%, length bonus 15%).
  <https://freesewing.eu/docs/designs/sven/> ·
  <https://freesewing.eu/docs/designs/sven/options/>
- **T2** — FreeSewing, *Hugo hoodie* — design page, Design Options and
  Instructions (pullover with raglan sleeves; cutting list of 4 hood sides,
  2 hood centers, 1 neck binding, 1 on-fold pocket, 2 pocket facings, ribbing
  cuffs and waistband; ribbing stretch default 5%, range 0–10%; ribbing height
  10%, range 4–20%; pocket width 50%, range 35–65%; hood assembly, 1 cm outer
  seam, 1.5–2 cm topstitched rim, optional eyelets for a front-edge cord).
  <https://freesewing.eu/docs/designs/hugo/> ·
  <https://freesewing.eu/docs/designs/hugo/options/> ·
  <https://freesewing.eu/docs/designs/hugo/instructions/>
- **T3** — FreeSewing, *Huey hoodie* — design page and Design Options (zip-up;
  "Cut 4 Hood parts", 2 pockets, ribbing cuffs and waistband; hood angle 5°
  (2–8°), hood closure 13.5% (10–15%), hood cutback 10% (5–15%), hood depth
  8.5% (5–12%), hood height 59% (55–65%); pocket height 30% (25–35%), pocket
  opening 90% (60–90%), pocket width 60% (50–70%); ribbing stretch 15%,
  range 0–30%).
  <https://freesewing.eu/docs/designs/huey/> ·
  <https://freesewing.eu/docs/designs/huey/options/>

### Official pattern publisher

- **T4** — Jalie, *Sewing Pattern Jalie 3355 — Sweatshirt, Hoodie and Sweat
  Pants* (product page; View A sweatshirt with set-in sleeves and banded
  neck/cuffs; View B hoodie with set-in sleeves, banded cuffs and a kangaroo
  pocket; View C sweat pants; fabric "knit with 10% stretch in the width
  (medium-weight sweatshirt fleece, French terry)"; 6 mm seam allowances
  included).
  <https://jalie.com/products/sweatshirt-hoodie-and-sweat-pants-sewing-pattern>

### Institutional

- **T9** — University of Kentucky Cooperative Extension Service, *Sewing with
  Knit Fabric*, publication **CT-MMB.165** (knit classes and stretch
  percentages, with stable knits at "½ inch or less (10 percent)"; recovery
  testing; "the greatest amount of stretch should go around the body"; "with
  nap" layout; ribbing cut "twice the desired width" with "½ inch for seam
  allowances in both directions"; "Cut ribbing two-thirds the measured length
  of garment seam lines"; the V-neckline exception; "stand measuring tape on
  end along pattern seam line"; fold-match-quarter-stretch application;
  stabilising shoulder, neckline and waistline seams; knit seams must stretch).
  <https://fcs.mgcafe.uky.edu/sites/fcs.mgcafe.uky.edu/files/ct-mmb-165.pdf>

### Professional patternmaking publisher

- **T5** — Rundschau / M. Mueller & Sohn, *Pattern Construction for Hoods*,
  published 2025-08-04 (close-fitting hood attachment seam as "Neck width plus
  the amount the neckline is lowered at the centre front"; loose-fitting
  "plus 4 – 5 cm"; hood depth "30–34 cm" close and "30–36 cm" loose, tied to
  "the overhead measurement"; hood width "26 – 28 cm"; "3 – 4 cm for the dart
  or pleat"; a family of hood types including contoured designs with centre
  panels).
  <https://www.muellerundsohn.com/en/allgemein/basic-hood-constructions/>

### Parametric generator

- **T6** — Nastix Patterns, *Free Hood Pattern Generator* (inputs: finished
  neckline length, default 42 cm, "Measure the garment neckline along its
  stitching line"; hood height default 38 cm; hood depth default 30 cm; fit
  level presets; crown shape; neckline ease; front overlap. Output: "Two-piece
  side hood (cut 2 mirrored)" with seam/cut lines, centre-back seam, face
  opening, grainline, neckline notches; states the hood neckline seam must
  align with the finished garment neckline). Inputs inspected; no pattern was
  generated, purchased or copied.
  <https://nastix-patterns.com/patterns/hood>

### Designer and pattern-company technique guidance

- **T7** — Luisa Clare, *How to Make a Hood (DIY Pattern and Sewing)*,
  TREASURIE, last updated 2026-06-04 (hood bottom edge = half the garment neck
  measurement for a two-piece hood; front edge = shoulder-to-top-of-head plus
  4 inches (10 cm), optionally 6 inches; front edge 1 inch (2.5 cm) lower than
  the back; back inside curve 2–3 inches (5–7.5 cm) from the back corner;
  ½ inch (12 mm) seam allowance; cut 2 outer and 2 lining).
  <https://blog.treasurie.com/how-to-make-a-hood/>
- **T8** — Kelly Hogaboom, *Hoodie Hacks: Drafting a Hood from Scratch*, Curvy
  Sewing Collective, 2017-08-25 (front and back neckline stitching distances
  measured along the stitching line "stopping 1/2" before shoulder"; centre
  depth; head/neck height plus 1–2 inches; point 0 as "the shoulder notch –
  right where the hood crosses the shoulder seam"; combined front and back
  stitching distances equal the hood neck edge; concave front edge; large
  volume "without significant center front overlap").
  <https://curvysewingcollective.com/hoodie-hacks-drafting-a-hood-from-scratch/>
- **T10** — Emily ITF / Alys, *Tips for sewing knit necklines*, In the Folds,
  2023-04-16 ("around 80% of the neckline measurement" for self fabric;
  "around 70-75%" for ribbing; "Stretchier ribbing may go below 70%, but if it
  is stretched out too much, it may create gathers around the neckline";
  finished band widths 2 cm self fabric and 2.5 cm ribbing; "The more stretch
  the ribbing has, the shorter the neckband should be").
  <https://inthefolds.com/q-a-series/2023/tips-for-sewing-knit-necklines>
- **T11** — Meg, *How to Sew a Knit Neckline Band*, Megan Nielsen Patterns
  blog, 2015-12-11 ("for knits with around 20/30% stretch it works well to make
  the neck band 15% smaller than the neck opening"; 5/8" band fold seam and
  1/4" attachment; "sometimes you just really need to experiment to get the
  right fit depending on your fabric").
  <https://blog.megannielsen.com/2015/12/how-to-sew-a-knit-neckline-band/>
- **T12** — O. Jolly!, *Determining the Length and Width of Rib Bands*,
  Crafting Fashion, last updated 2019-01-20 (for a 1-inch finished neckband,
  cut 3 inches total — 0.5 inch allowance, 1 inch public layer, 1 inch inside
  layer, 0.5 inch allowance; determine length by stretching the folded ribbing
  on a flat tape until it reaches the neckline measurement, with a 20-inch /
  25-inch worked example; "Good recovery is helpful, if you want a snug band").
  <https://www.craftingfashion.com/2015/08/determining-length-and-width-of-rib.html>
- **T13** — Joni Pearce, *Adding Grommets to the Hudson Pullover*, Greenstyle
  Creations blog, 2017-10-18 ("large eyelet size (1/4")", with the ¼" being the
  inside hole; placed "2 inches up from the bottom of the hood" and close to
  the front edge because the casing is stitched 1 inch wide; fusible tricot
  interfacing with "at least 2 layers"; grommets installed before the casing is
  stitched).
  <https://greenstyle.com/blogs/news/adding-grommets-to-the-hudson-hoodie>
- **T15** — *Adding Pockets to the Alpha Raglan Hoodie*, LearnMYOG, pattern
  dated 2025-02-24 (pocket positioned 2 inches (5 cm) above the bottom edge and
  centred on the front panel; diagonal edges left unsewn as the openings;
  "Topstitch along the top, bottom, and both short sides to secure the pocket
  to the FRONT, using a 3/8" (10mm) seam allowance", with bartacks at the
  corners; exact pocket dimensions live only in the downloadable pattern file,
  which was **not** downloaded or inspected).
  <https://learnmyog.com/articles/alphaRaglanHoodiePockets.html>

### Regulatory guidance

- **T14** — U.S. Consumer Product Safety Commission, *Drawstrings in Children's
  Upper Outerwear — Frequently Asked Questions* (business guidance; upper
  outerwear as "clothing, such as jackets and sweatshirts"; hood/neck
  drawstrings prohibited in sizes 2T to 12; waist/bottom drawstrings in sizes
  2T to 16 limited to 3 inches outside the channel, free of toggles and knots,
  bar-tacked when continuous; pants, shorts and skirts excluded from scope).
  <https://cpsc.gov/business--manufacturing/business-education/business-guidance/drawstrings-in-childrens-upper-outerwear/frequently-asked-questions-faqs>

### Definition only — not used for any numeric or geometric claim

- **T16** — *Kangaroo pocket*, Wikipedia (definition: a pocket "large enough to
  fit both hands into", with an opening on either side and no divider; also
  called a muff or hoodie pocket). Its own citations are thin; used here solely
  to fix terminology.
  <https://en.wikipedia.org/wiki/Kangaroo_pocket>

### Local project references (product-owner supplied, routed in `CONTEXT-INDEX.md`)

Directory: `F:\tank-sketches\scribd - garment-design - files\`

- **L1** — `garment_measurement_quick_reference.docx`, *Garment Measurement
  Quick Reference*. Tops codes A, B, C, D, E, F, F1/F2, and F8/F9 for hood
  length and width; sleeve length "including cuff"; and the stretch-measurement
  section requiring relaxed and stretched states to be recorded separately for
  a rib cuff or elastic hem.
- **L2** — `pattern_making_body_measurements_reference.docx`, *Pattern Making
  and Grading Reference*. Grain and layout; ease added deliberately after body
  measurement; manual and master grading by increments; collar-family grading
  derived from the neck seam.
- **L3** — `pattern_drafting_quick_reference.docx`, *Pattern Drafting Quick
  Reference*. Wearing versus design ease as separate, intentional quantities.
- **L4** — `stitches_seams_detailed_reference.docx`, *Stitches and Seams
  Detailed Reference*. Cover-stitch classes 406/407 "Used for hems on knit
  garments, T-shirt necklines, and attaching bindings", with 407 more elastic
  than 406; overedge/overlock formation for knit seams; class 301 not suited to
  elastic or knit fabrics. Construction metadata only — explicitly not proof of
  sewability and not a source for machine settings.

### Prior InfiniDrip records consulted (not re-derived here)

`docs/research/garments/TANK-RESEARCH.md` (the strap/armhole precedent and the
"never recycled from our own garments" research standard),
`docs/research/garments/POLO-V2-RESEARCH.md` (the sleeve-rib deferral and the
seam-walking-not-endpoint-span rule),
`docs/research/garments/WOVEN-SHIRT-RESEARCH.md`,
`docs/research/garments/TROUSER-RESEARCH.md`, `ARCHITECTURE.md`,
`PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md` and
`docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md`.
