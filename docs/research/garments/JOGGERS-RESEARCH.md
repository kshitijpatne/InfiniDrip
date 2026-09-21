# Jogger research and digital contract

_Slice 151 research record, prepared 2026-09-20. Research only: this document
authorizes no implementation, no recipe id, no new engine input, no save-format
change, no export-baseline movement and no physical claim. Every adopted
finding is a claim for Codex to verify independently._

**Codex review resolution.** Slice 154 accepts the adult knit jogger but does
not make fabric stretch a draft-time geometry input. P0 uses a separate
self-fabric casing band, an explicit elastic-width control, and elastic listed
as a user-cut/test-fit notion whose cut length is recorded rather than
calculated. The engine must not invent an elastic reduction. A rib cuff remains
an evidenced addition after the shared ratio-aware stretch-to-fit interface is
defined; it uses a user-owned finished cuff circumference and reports the
implied stretch ratio. Child sizing is out. Shorts are a preferred sequencing
predecessor because both touch the lower-body source of truth, not a geometry
prerequisite for a full-length jogger.

**Standing limitation.** No InfiniDrip garment has been cut, sewn, washed or
worn. Nothing in this document is evidence of fit, stretch recovery, shrinkage,
sewability, comfort, safety, manufacturability or production readiness. Where
this record uses the words "stretch", "recovery" or "elastic", it is describing
a *source's* statement or a *digital input requirement*, never a measured
InfiniDrip result.

---

## 1. Product scope

### 1.1 Named garment and intended variants

A **knit jogger**: a pull-on lower-body garment with an elasticated waist, a
drawcord, a tapered leg and a closed or tapered lower-leg treatment. It is a
derivative of the shipped relaxed straight-leg `trouser` block, not a length or
style toggle on it.

| Variant | Status in this packet |
|---|---|
| Knit jogger, self-fabric casing waist, drawcord, plain tapered hem | **Include** — proposed smallest honest v1 |
| Knit jogger, rib ankle cuff | **Include as an option** only after the cuff-length contract in §6.3 is decided |
| Knit jogger, elasticated ankle hem | **Defer** — a second elastic channel with the same blocked material question |
| Separate rib waistband with internal elastic (the Jalie construction) | **Defer** — depends on the same rib negative-ease gate as the sweatshirt packet |
| Woven jogger / track pant | **Defer** — §1.3 |
| Jogger shorts | **Reject for this packet** — Slice 150 owns casual shorts |
| Cargo, zip-ankle, side-stripe, articulated-knee joggers | **Reject** — no evidence reviewed and no user problem stated |

### 1.2 Target users and use case

The existing user driving the shipped Measure → Style → Check → Export
workflow, who wants a pull-on knit lower-body garment. A fully automatic
material-aware jogger would make material behaviour a geometric input rather
than advisory text. P0 deliberately avoids that architectural expansion by
keeping elastic length user-cut/test-fit and band/cuff lengths user-owned.

### 1.3 Knit versus woven scope

Every publisher reviewed sells the jogger as a **knit** garment and states a
**minimum fabric stretch**:

- Jalie 3909 HENRI: "Medium-weight knit with at least 10% stretch across the
  grain (sweatshirt fleece, french terry). Rib knit for the waistband and
  cuff. Jersey knit for the pocket and drawstring." (S2)
- Jalie 3355 View C sweat pants: "knit with 10% stretch in the width
  (medium-weight sweatshirt fleece, French terry)". (S4)
- Sew Over It Ellis Joggers: medium-weight knits including cotton
  sweatshirting, fleece, French terry, Ponte di Roma and double knits,
  requiring "at least 15% stretch". (S5)
- Seamwork Mel: "medium-weight knits like ponte, French terry, sweatshirt
  fleece, double knit, and jersey". (S6)

The University of Kentucky extension guide states the underlying principle:
"The amount of ease built into the pattern design is based on the number of
inches or the percentage stretch the specific knit will stretch. If the fabric
has more stretch than recommended, the garment may fit looser. If less stretch,
then the garment will fit tighter." (S7)

**Adopted scope decision (product decision, evidence-informed):** the jogger is
**knit-only** in this packet. A woven track pant is a different ease and
closure problem and is deferred.

**Consequence that must not be glossed over.** Two independent publishers
publish a minimum required stretch percentage for the same garment class and
they disagree (10% vs 15%). The shipped engine carries `stretchPercent` on
`STRETCH_FABRICS` in `src/drafting/ease.ts`, but it reaches only
`suggestedEase()` / `fabricEaseNote()` — advisory text. `GarmentRecipe.draft`
has the signature `(m: Measurements, options?: GarmentOptions) => Block`; no
fabric value enters drafting. Any automatic jogger geometry derived from the
selected knit's stretch is therefore a **new engine input** and a stop
condition under the wave packet, not something to replace with a constant.
Explicit user-owned finished lengths remain valid recipe options because they
make no material-performance claim.

### 1.4 Out of scope

Physical sampling; fit, recovery, shrinkage or wash claims; a stretch-aware
grading model; a second geometry source of truth; changes to `nestPieces`,
Epic 7 planning state, Electron release code or any protected export baseline;
zip ankles; cargo pockets; knee articulation; gusseted crotch.

---

## 2. Evidence boundary and independence rules

Sources were opened and read, not taken from search snippets. Two retailers, or
two blogs restating one another, are treated as **one** line of evidence. A
single commercial pattern establishes that a feature exists and how one
publisher realises it; it does not establish a universal drafting formula.

Independence groupings used in this record:

- **Institutional:** S7 (University of Kentucky Cooperative Extension), S8
  (New Mexico State University Extension), S9 (University of Nebraska–Lincoln
  Extension — metadata only; see §12.2).
- **Official pattern instructions:** S1/S2/S3 (Jalie 3909) and S4 (Jalie 3355)
  are **one publisher** and count once for independence purposes.
- **Second and third independent publishers:** S5 (Sew Over It), S6 (Seamwork).
- **Open-source parametric drafting:** S11 (FreeSewing Paco) — documented
  option semantics, not copied geometry.
- **Regulatory guidance:** S12 (US CPSC business guidance page).
- **Local project references:** L1–L4, supplied by the product owner and
  already routed in `CONTEXT-INDEX.md`.
- **Manufacturer/retailer educational:** S10 — used only where it corroborates
  an institutional source, never as sole evidence for a number.

No pattern shapes, pattern pieces, drafting diagrams or long passages were
copied. Numbers quoted below are short factual measurements stated in the
sources, recorded for comparison.

---

## 3. Existing-engine reuse audit

Classified with the wave packet's five categories. "Reuse unchanged" is claimed
only where the shipped construction is correct for a knit jogger, not merely
available.

### 3.1 Reuse unchanged

| Engine capability | Why it is construction-correct here |
|---|---|
| `Piece` / named `Edge` / `Block` / `rolePiece` | Role-keyed pieces with named edges carry no woven assumption. A jogger panel is still a closed outline of named edges. |
| `Stitch` / `Interface` / `interfaceLength` / `stitchChecks` | Seam truth is computed from `edgeLength`, which uses `cubicLength` for curves — a real walked path, not an endpoint span. That is exactly what a curved crotch seam and a curved waist edge require. |
| `PatternMark` (`foldLine`, `placementLine`, `placementPoint`, `button`, `buttonhole`) | Casing stitch lines, drawcord exits, quarter marks and crease/knee/hip balance lines are internal construction data that must not alter the cut outline, bounds, allowance or nesting. That is precisely the boundary `Piece.marks` already enforces. |
| `AllowanceSpec` keyed by edge name | Allowance is a per-edge production number; a knit hem allowance differs from a knit seam allowance exactly as a woven one does. |
| `grading.ts` / `draftAtSize` / `gradeRun` | Grade-by-redraft means every size is a fresh draft through the same contract. No second grade system is introduced. |
| `pom.ts` `seam` / `spanX` / `spanY` | POMs read live geometry rather than stored values. |
| Generic SVG / DXF / tiled PDF / A0 PDF / projector / tech-pack writers | Format-agnostic; they consume `Block`. |
| `a0Overflow` and `tiledPdfLocalCoordinates` recipe capabilities | Already proven necessary for long lower-body pieces by the shipped trouser (Slice 101). A jogger has the same piece lengths and would need both. |
| Boundary Rail numeric controls, `inputError`, raw-invalid preservation | Warn-never-clamp behaviour is unchanged and remains mandatory. |

### 3.2 Parameterized derivative (the existing block stays authoritative)

| Feature | Evidence that reuse is construction-correct | Required parameterization |
|---|---|---|
| **Rise and crotch curves** | The shipped trouser already separates `frontRiseEase` and `backRiseEase` from body `crotchDepth` and draws two independently named cubic crotch curves ending at independently derived rise references (`src/drafting/trouser.ts`, `trouserMetrics`). FreeSewing Paco reaches a relaxed pull-on pant the same way — a rise plus a separate "Crotch drop" option, default 2%, range 0–10% (S11). Neither source introduces a different crotch topology for a pull-on knit pant. | New **defaults** only, plus optionally one added `crotchDrop` control (§6.2). No new curve family. |
| **Leg taper** | The shipped block already sets horizontal stations at waist, seat, thigh, knee and hem, and takes `legOpening` as a direct finished circumference (25–65 cm, default 40). A taper *is* the relationship `finishedThigh → finishedKnee → legOpening`; nothing about it is woven-specific. Jalie 3909 and Sew Over It Ellis both describe the jogger leg as tapered rather than as a new leg shape (S1, S5). | New default `legOpening`, plus a separate finished `cuffOpening` when a cuff is used (§6.3). |
| **Angled front pocket and quadrilateral bag** | The one pocket reuse with direct evidence: Sew Over It Ellis ships "stylish slanted pockets with a topstitching detail" (S5) — the same slant-opening-plus-bag topology `trouserPocket` already drafts, with the bag's `opening` edge matched to a live mark on the front panel. | Defaults only. Every existing containment check in `trouserPocketGuidance` must be re-derived against the changed waist treatment (§7.3). |
| **Separate full waistband strip** | `trouserWaistband` already drafts one off-fold strip whose lower edge length is taken from the measured four-panel waist interface via `context.interfaceLength("legs", "waist")`. A 1:1 self-fabric casing band has exactly that topology. | Depth default and casing stitch-line marks. **Not** a rib band — §3.6. |
| **Grade rule** | `TROUSER_GRADE` (waist +4, hip +4, hipDepth +1, crotchDepth +1, thigh +2, knee +1.5, inseam +1.5 per step) is a measurement-delta table applied by redrafting; nothing in it is woven-specific. | See §8 for what must **not** be graded by this table. |

### 3.3 New component contract (new piece/interface, existing pipeline)

| Feature | Note |
|---|---|
| **Rib ankle cuff** | A new band role whose upper edge joins the leg hem edge, built with the existing `Component` / `assembleComponents` / grammar machinery. It is a new *piece*, not a new engine. Its **length** is the blocked part — §6.3. |
| **Drawcord piece** | Jalie 3909 includes a jersey drawstring as a real cut piece: "G - DRAWSTRING / Cut 1 on fold (jersey)" (S1). A flat rectangle with a fold mark is trivially draftable and is genuine cut yardage that nesting should see. |
| **Casing channel representation** | Two `placementLine` marks on the waistband plus two `buttonhole` point marks at the drawcord exits. Jalie 3909 states one publisher's exact channel: "Sew two rows of topstitching on the waistband to create a casing … First 1.2 cm (½'') from top edge / Second 1.5 cm (⅝'') from first topstitch", with "1.2 cm (½'') buttonholes through fabric AND elastic" (S1). These are marks, not edges, and must never enter the cut outline. |

### 3.4 New engine input — stop / defer signals

These are the reasons this packet does **not** propose a complete jogger.

| Requirement | Why it cannot be a constant | Smallest decision that could unblock it |
|---|---|---|
| **Rib and elastic negative ease** (rib waistband length, rib cuff length, elastic length) | Every reviewed source that gives a number gives a different one, and all of them make the number a function of the specific trim's stretch and recovery. The draft graph receives no stretch value. A fixed factor would be a hidden material assumption — the exact reason Epic 11 deferred the Polo sleeve rib (`docs/PROJECT-DECISIONS.md`). | Codex decides whether `GarmentRecipe.draft` may receive the selected `StretchFabric`, or a separate declared trim-stretch input, as a first-class drafting argument. Until then: draft 1:1 and **report** the required stretch as guidance. |
| **A body ankle (or wrist) girth field** | Both the institutional and the parametric source derive a cuff from the *body part*, not from the leg opening. UKY says cut trim "long enough to fit around wrists, upper arms, and ankles" (S7); FreeSewing Sven derives its cuff from the wrist measurement plus a "Cuff ease" option (default 20%, range 0–200%) before applying "Ribbing stretch" (T1, cited in the sweatshirt packet). `Measurements` has no ankle field. | See the persistence blocker below, then a Codex field-versus-option decision. §6.3 proposes an option-only path that avoids the new field entirely. |
| **Adding any new `Measurements` field** | **Confirmed save-compatibility defect, read from the shipped code.** `src/ui/persist.ts` sets `const legacy = p.v !== SAVE_VERSION;` and inside the `FIELDS` loop only skips a failed field when `legacy && !LEGACY_REQUIRED.includes(field.id)`. A file already saved at the current `SAVE_VERSION = 5` cannot contain a newly added field; `legacy` is `false`; `inputError(NaN, field)` returns an error; `deserialize` returns `{ ok: false }`. Adding a body field therefore **breaks existing v5 saves** unless `SAVE_VERSION` is bumped to 6 with 5 accepted as legacy. | A save-format change — an explicit permanent stop condition in `docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md`. Recorded as a blocker, not worked around. (Recipe-owned `GarmentOptions` do **not** have this problem: `deserialize` iterates only the keys present in the payload, and `resolveTrouserOptions`-style resolvers default anything absent.) |
| **An eyelet / grommet mark kind** | `PatternMark` is exactly `cutLine \| foldLine \| placementLine \| button \| buttonhole \| placementPoint`. Sources treat eyelets and buttonholes as different hardware with different preparation: Sew Over It offers "the choice of eyelets or buttonholes" (S5); Seamwork specifies "2 pieces of 1" (2.5 cm) x 1" (2.5 cm) fusible interfacing" at the openings (S6); Jalie uses buttonholes only (S1). | Either represent an eyelet as a `buttonhole` mark plus BOM/construction text (no shared-type change), or Codex approves extending the shared `PatternMark` union — which touches `render/pattern-mark.ts`, `export/pattern-mark.ts` and every writer. §6.5 proposes the former. |
| **Per-fabric nesting** | `nestPieces(pieces, fabricWidth, …)` takes **one** width and nests **all** pieces. Every reviewed jogger uses three materials (main knit, rib trim, jersey for pockets and drawcord — S1, S2). The estimator would silently price rib and jersey pieces against the main bolt width. | Codex decides whether a per-piece material tag and a multi-bolt estimate belong to a future epic. Until then, a multi-fabric garment's nesting figure is **not** a truthful yardage estimate and must be labelled as such in the UI and tech pack. Epic 7 must not be modified by this packet. |

### 3.5 Physical unknowns (digital geometry checkable, behaviour not)

Recovery of any trim after wear; whether a drafted cuff opening is actually
enterable over a foot; elastic roll and twist; knit growth at the knee and
seat; shrinkage; whether a casing channel accepts the chosen cord; bar-tack
durability; whether topstitching distorts a fleece casing; whether a jersey
self-drawcord holds a knot.

### 3.6 Explicitly rejected reuse

- **Do not reuse `trouserFly`.** A pull-on jogger has no fly; every reviewed
  jogger source omits one (S1, S4, S5, S6). Carrying a `flyShield` role because
  the composition already produces one would emit a piece nobody cuts and a
  fly-length option nobody can act on.
- **Do not reuse the skirt `waistband` component.** It is an on-fold
  half-circumference strip with skirt assumptions, already rejected for the
  trouser in `TROUSER-RESEARCH.md`. That rejection stands unchanged.
- **Do not reuse the woven shirt's folded `sleeveBand`.** It is drafted to the
  exact sleeve-hem length with no negative-ease rule. Reusing it as a rib cuff
  would silently assert 1:1 where the entire point of a rib cuff is that it is
  not 1:1. The Polo V2 record rejected the same reuse for the same reason.
- **Do not treat the trouser's two-panel back with a `centerBack` seam as a
  jogger requirement.** It is correct and harmless, but it is a V1 role choice
  inherited from the trouser, and must stay labelled as such rather than
  presented as a jogger construction rule.

---

## 4. Source-conflict table

| # | Question | Source A | Source B | Conflict | Treatment |
|---|---|---|---|---|---|
| C1 | Elastic cut length versus body waist | Jalie 3909 publishes a per-size table for 5 cm (2") elastic. Compared against the same chart's natural-waist column, the smallest boys' sizes run **~110%** of the waist (F: 49 cm waist / 54.0 cm elastic) and adult sizes converge to **~99–102%** (X: 84 / 84.5; GG: 117 / 116.0), with a stated ~1 cm overlap (S1, S2). | fabrics-store tutorial: cut elastic "a few inches smaller than our waist measurement plus added 1" for seam allowances" (S10). Widely repeated blog guidance quotes 8–12% negative ease. | **Direct contradiction.** One officially graded table puts the elastic at or above the waist measurement; the popular rule puts it several inches below. | **No universal elastic factor is adopted.** Both readings are recorded. A plausible reconciliation — Jalie's elastic sits inside a *rib* band that supplies the grip; Jalie's size is chosen by **hip**, with an instruction to cut band and elastic to a smaller size when the waist maps to one; and a 5 cm sport elastic is a different article from a 1 cm braided one — is an **inference by this record**, not a statement any source makes. Elastic length stays a BOM/hardware value outside drafted geometry. |
| C2 | Is the published elastic table itself reliable? | Jalie 3909 ships the table headed "TABLEAU CORRIGÉ OCTOBRE 2024"; the product page carries the errata note "Error on the elastic chart" (S1, S3). | — | A professional publisher corrected its own elastic chart. | Recorded as direct evidence that elastic length is error-prone and article-specific, reinforcing C1. |
| C3 | Casing width rule | NMSU C-234: an all-in-one casing "measures twice the width of elastic called for in the pattern" (S8). | fabrics-store: the casing "should be at least ¼" (6 mm) wider" than the elastic (S10). | Different constructions described with different rules. | Both adopted, **scoped**: `2 × elastic width` for a **fold-down self casing**, `elastic width + clearance` for an **applied/stitched channel**. Any implementation must name which construction it drafts and derive the depth from the user's declared elastic width. |
| C4 | Ankle treatment | Jalie 3909 View A: "F - ANKLE CUFF (VIEW A) / Cut 2 in rib knit, on fold"; "Stitch, stretching the cuff as you sew to fit the opening" (S1). | Jalie 3355 View C: "elastic at ankle and waist" (S4). Sew Over It Ellis: "slightly tapered, with the option to add some elastic at the hem" (S5). | The same publisher ships both a rib cuff and an elasticated hem; a second publisher makes hem elastic optional. | **Three ankle treatments are real and none is *the* jogger rule.** Ankle treatment becomes a first-class user option, defaulting to the treatment with no material dependency (plain hem). |
| C5 | Cuff length rule | Jalie 3909 publishes the cuff as a **graded pattern piece** and never publishes a ratio; the maker stretches it to fit (S1). | UKY CT-MMB.165 states *both* framings in one document: cut trim "long enough to fit around wrists, upper arms, and ankles", and separately "Cut ribbing two-thirds the measured length of garment seam lines plus ½ inch for seam allowances" for necklines, armholes and hemlines (S7). FreeSewing Sven derives the cuff from wrist + "Cuff ease", then applies "Ribbing stretch" (T1). | Two incompatible framings: cuff-from-opening (a ratio) versus cuff-from-body-part (a girth plus ease). | **No reduction factor is adopted.** §6.3 proposes the cuff opening as a user-owned finished circumference so the engine never has to choose between the two framings. |
| C6 | Minimum fabric stretch for the same garment class | Jalie 3909 / 3355: "at least 10% stretch across the grain" (S2, S4). | Sew Over It Ellis: "at least 15% stretch" (S5). | 10% vs 15%. | Neither is adopted as a threshold. Recorded as evidence that a stretch requirement is **pattern-specific**, which is only expressible once stretch is a real input (§3.4). |
| C7 | Elastic width | Jalie 3909: 5 cm (2") (S1, S2). Seamwork Mel: 2" (5 cm) braided (S6). | Sew Over It Ellis: 38 mm (1½") (S5). | 38 mm vs 50 mm. | Elastic width is a **user-owned product choice**, never a derived constant. If a casing is drafted, its depth follows the user's declared elastic width per C3. |
| C8 | Do elastics behave alike? | UKY CT-MMB.165: "Elastics differ in their stretch and recovery characteristics. Braided elastic narrows when stretched and can lose stretch and recovery if it is pierced when stitched. Knitted and woven elastics retain their original width when stretched. Non-roll elastic is appropriate for pull-on pants and skirts." (S7) | NMSU C-234 treats decorative/sport elastic at least 1" wide as a separate class that "does not have the same elasticity" and must be fitted to the body (S8). | **No conflict** — two institutional sources agree. | **Adopted as the governing rule.** Elastic type changes both geometry (a braided elastic narrows under tension, so the channel clearance is type-dependent) and behaviour. This is the strongest single argument against any elastic constant. |
| C9 | Pocket type | Jalie 3909: in-seam hip pockets, "D - HIP POCKET / Cut 4", plus "E - PATCH POCKET / Cut 1 on fold" at the back (S1). Jalie 3355 View C: "side seam pockets" (S4). | Sew Over It Ellis: "stylish slanted pockets with a topstitching detail" (S5). | In-seam versus slant front pocket. | **Slant pocket adopted for v1** because it is the only one the shipped `trouserPocket` realises construction-correctly. In-seam is a genuine new component contract (§9.4) and is deferred, not dismissed. |
| C10 | Regulatory scope of a waist drawcord | CPSC business guidance: upper outerwear means "clothing, such as jackets and sweatshirts"; "pants, shorts, and skirts are not intended for the upper portion of the body and are excluded from the scope of the standard"; sweatpants are described as explicitly excluded (S12). | — | No conflict. | A jogger waist drawcord appears to be **outside** the scope described on that page for 16 CFR Part 1120 / ASTM F1816. This is a scope observation from one government guidance page read on 2026-09-20. It is **not** legal advice, **not** a compliance determination, and **not** a claim that no other rule, market or standard applies. See §11. |

---

## 5. Construction and geometry research

Cross-vetted rules. "Adopted" means adopted **as a research position for Codex
to review**, never as implemented behaviour.

| Rule or dimension | Source 1 | Source 2 | Agreement / conflict | Adopted treatment |
|---|---|---|---|---|
| Jogger is a pull-on knit garment with elasticated waist plus drawcord | Jalie 3909: "elasticized rib knit waistband, with adjustable drawstring" (S2) | Sew Over It Ellis: "elasticated waistband with the choice of eyelets or buttonholes to thread a drawstring through" (S5); Seamwork Mel: "elasticized drawstring waistband" (S6) | Agree across three publishers | **Sourced construction rule.** Elastic plus drawcord is the defining waist. |
| The waist is closed — no fly, no closure hardware | Jalie 3909 piece list contains no fly or closure piece (S1) | Sew Over It and Seamwork descriptions list no closure (S5, S6) | Agree | **Sourced.** `trouserFly` is dropped (§3.6). |
| The drawcord must be prevented from pulling out | Jalie 3909: "To prevent the drawstring from being pulled out completely, stitch through all layers at center back (stitch in the ditch)" (S1) | CPSC describes the same mechanism for regulated garments — a continuous drawstring "must be bar tacked … to prevent the drawstring from being pulled through its channel" (S12) | Agree on mechanism | **Sourced.** A centre-back anchor is a named construction step plus one `placementPoint` mark; it is not geometry. |
| The casing channel is formed by two stitch rows | Jalie 3909: "First 1.2 cm (½'') from top edge / Second 1.5 cm (⅝'') from first topstitch" (S1) | NMSU C-234 describes the casing as "a part of the pattern piece" sized around the elastic (S8); fabrics-store supplies the applied-channel clearance rule (S10) | Agree on mechanism; the 1.2 / 1.5 cm numbers are one publisher's | **Sourced mechanism, product-specific numbers.** Channel position and width must derive from the user's declared elastic and cord, never from 1.2 / 1.5 cm literals. |
| Elastic is applied by quartering and stretching | Jalie 3909: "Divide into fourths with pins … Pin elastic to wrong side of waistband, matching pins" (S1) | NMSU C-234: "divide the elastic into four equal sections, then pin to the center front, center back, and side seams" while stretching (S8) | Agree — institutional plus official pattern | **Sourced.** Quarter marks are real `placementPoint` marks worth emitting on the waistband. |
| Direction of greatest stretch must run around the body | UKY CT-MMB.165: "As with all knits, the greatest amount of stretch should go around the body." (S7) | UKY, same document, for trim: rib "may stretch 100 percent in the crosswise direction" and is used for "band trims around necklines, armholes, and hemlines" (S7) | One institutional source, stated for two cases | **Sourced but currently unrepresentable.** See §9.5 — the app's grainline is a two-point line with no declared stretch semantics. |
| Knit layout is directional | UKY CT-MMB.165: "Lay out all pattern pieces going the same direction by following the 'with nap' layout." (S7) | Epic 7's directional/nap flag defaults to `true` and is advisory because `nestPieces` never rotates | Agree in effect | **Sourced.** The shipped estimator's no-rotation, grain-upright behaviour happens to satisfy the knit requirement. Record as a favourable alignment to verify, **not** as a claim that Epic 7 was designed for knits. |
| Knits shrink more than wovens | UKY CT-MMB.165: "Washable knits tend to shrink more often and to a greater degree than woven fabrics." (S7) | UKY, same document: "Generally, rib knit should not be prewashed if being used as a trim." (S7) | One institutional source | **Physical unknown for this project.** Shrinkage is never modelled; it belongs in construction notes only. |
| Stitch and seam classes for knit and elastic work | L4: stitch class 401 "Used for setting elastic in waistbands"; 406/407 "Used for hems on knit garments, T-shirt necklines, and attaching bindings" | UKY CT-MMB.165: knit seams "must stretch with the knits or broken stitches will occur"; serger and coverstitch recommended (S7) | Agree | **Sourced construction metadata only.** Tech-pack text — never a machine setting, and never a sewability claim. |
| Stress seams need stabilising | UKY CT-MMB.165: "Seams that get a lot of stress and may stretch out of shape, such as shoulder, neckline, and waistline, need to be taped for stability." (S7) | Seamwork Mel's notions list includes small fusible interfacing squares at the drawcord openings (S6) | Agree in principle | **Sourced.** Construction and BOM text. |
| Crotch drop is how a relaxed pull-on pant differs from a trouser | FreeSewing Paco: "Crotch drop", default 2%, range 0–10%, described as lowering the crotch for a relaxed fit (S11) | The shipped trouser reaches the same place through `frontRiseEase` / `backRiseEase` (`trouser.ts`) | Agree in effect, differ in parameterization | **Engineering decision required** (§6.2). Recorded as a Codex decision, not decided here. |
| The ankle cuff is a folded band joined as a closed loop | Jalie 3909: "Fold band in half and stitch ends together to form a loop … Bring wrong sides together, matching seams and half marks" (S1) | UKY CT-MMB.165, for bands generally: "fold ribbing is half lengthwise and press crease, match center and quarter marks to each other, and stretch ribbing to fit as it is sewn in place" (S7) | Agree | **Sourced.** The cuff is a folded double band; its cut depth is twice the finished depth plus allowances. |
| Rib trim cut width | UKY CT-MMB.165: "cut ribbing twice the desired width … Add ½ inch for seam allowances in both directions" (S7) | Jalie cuts cuff and waistband "on fold", achieving the same doubling through the fold instead (S1) | Agree on geometry, differ on fold policy | **Sourced rule; fold policy is a product decision** (§9.2). |
| Seam allowance in knit patterns is often narrow | Jalie 3909: "Sew this garment 6 mm (¼'') from edge", allowances included (S1) | UKY CT-MMB.165: "Some patterns designed for knits will have ¼-inch seam allowances, eliminating the need for trimming but also eliminating any margin for adjusting size." (S7) | Agree, including on the trade-off | **Sourced.** Supports a jogger-specific allowance map rather than inheriting `TROUSER_ALLOWANCES` unexamined (§9.3). |

---

## 6. Measurements and adjustable parameters

Proposals below are made **only where evidence supports them**. Where evidence
does not support a number, the row says so and no default is invented. All
values in centimetres unless stated.

### 6.1 Body measurements

No new body measurement is proposed. The jogger reuses the shipped
`TROUSER_FIELDS` set exactly: `waist`, `hip`, `hipDepth`, `crotchDepth`,
`thigh`, `knee`, `inseam`, `ease`.

**Why an ankle girth field is not proposed**, despite §3.4 showing that both
UKY and FreeSewing derive a cuff from the body part: adding it triggers the
confirmed v5 save-compatibility defect and therefore a save-format change,
which is a permanent stop condition. §6.3 proposes an option-only alternative
that stays inside the existing contract. If Codex later decides the body field
is the right model, the save-version bump must be planned first.

### 6.2 Rise, taper and fit options — defaults only, no new mechanisms

| Option | Shipped trouser value | Proposed jogger treatment | Classification |
|---|---|---|---|
| `frontRiseEase` | default 1, range −2…8 | Reuse mechanism. **No default proposed.** No reviewed source publishes a jogger front-rise number in a form comparable to this parameterization. | Open question |
| `backRiseEase` | default 9, range 2…14 | Reuse mechanism. **No default proposed**, same reason. The shipped guidance rule "back rise must exceed front rise" remains correct and must be kept. | Open question |
| `crotchDrop` (new, optional) | — | Only if Codex prefers FreeSewing's explicit parameterization (S11) over expressing the same change through the two rise eases. Adding it creates two ways to say one thing, which is a maintainability cost. | **Engineering decision for Codex** |
| `waistbandDepth` | default 4, range 2…8 | Reuse mechanism, but its **meaning changes**: for a jogger it is the finished casing band depth. It stays a **user-owned** option — deriving it from `elasticWidth` would be silent clamping, which the project forbids. Instead, guidance checks it against the C3 rule for the declared elastic and warns when the casing cannot contain it (§7.4). **No jogger default proposed.** | Parameterized derivative + guidance obligation |
| `thighEase` | default 8, range 0…20 | Reuse mechanism. **No default proposed** — every source expresses knit jogger fit as a percentage stretch requirement (§1.3), which this engine cannot consume. | Open question, blocked on §3.4 |
| `kneeEase` | default 5, range 0…15 | As above. | Open question, blocked on §3.4 |
| `legOpening` | default 40, range 25…65 | Reuse unchanged as the finished hem circumference. A jogger taper is expressed by choosing a smaller `legOpening` relative to `finishedKnee`; no new mechanism is needed. **No default proposed** — publishers describe the taper qualitatively ("slightly tapered", S5) and never publish the circumference. | Open question |
| `ease` | −30…30 | Reuse unchanged. Note the shipped trouser applies `ease` to waist **and** seat only (`trouserMetrics`: `finishedWaist = m.waist + m.ease`, `finishedSeat = m.hip + m.ease`); thigh and knee have their own eases. That separation is correct for a jogger too and must not be quietly merged. | Reuse unchanged |

**Deliberate omission.** This record does **not** propose jogger defaults for
rise, thigh, knee or leg opening. Publishing a seeded number here would look
sourced when it would in fact be a guess, and the project's standing rule after
Slice 60 is that "it happened to reuse cleanly" and "it is correct for this
garment" are different claims. Codex should set these defaults deliberately,
from the shipped trouser's rendered geometry, and label them as digital
starting values.

### 6.3 Ankle treatment — the central open contract

Three treatments are evidenced (C4). Proposed option:

| Option | Meaning | Values | Classification |
|---|---|---|---|
| `ankleFinish` | `0` = plain hem, `1` = rib cuff, `2` = elasticated hem | enumerated numeric, default `0` | **Product decision.** Default `0` is chosen because it is the only treatment with **no** material dependency, so v1 can ship a truthful garment while §3.4 stays blocked. |
| `cuffOpening` | Finished cuff circumference, active only when `ankleFinish = 1` | user-owned cm, **no default proposed** | **Engineering decision + open question** |
| `cuffDepth` | Finished cuff depth (the band doubles by fold) | user-owned cm, **no default proposed** | Open question |

**Why `cuffOpening` is an option rather than a derived value.** Sources give two
irreconcilable framings (C5). Making the finished cuff circumference a
user-owned number means:

1. the engine never invents a reduction factor;
2. the user can express either framing (set it from their ankle girth, or set
   it as a fraction of the leg opening) — consistent with the maintainer's
   standing decision that meaningful garment aspects are adjustable
   (`docs/PROJECT-DECISIONS.md`);
3. the drafted cuff and the drafted leg hem are both exact, so every downstream
   consumer measures something real.

**The consequence that needs a Codex decision.** `stitchChecks` compares
interfaces with `matchLengths` (0.1 cm tolerance) unless the stitch declares
`ease: { lo, hi }`, which `inBand` evaluates as an **absolute centimetre**
difference. A cuff-to-hem join is intentionally not 1:1, so it must declare an
ease band. Two candidate treatments, neither adopted here:

- **(a) Declared geometric sanity band.** The stitch declares an ease band
  derived from the option definitions' own declared bounds, so the check
  verifies the draft realised the user's numbers rather than judging whether
  the numbers are good. Separately, a guidance note reports the exact required
  stretch as a percentage. Honest, but the check becomes close to tautological.
- **(b) No stitch, an explicit stretched-to-fit interface.** The cuff join is
  declared as a named interface pair with its own check that reports both
  measured lengths and the required percentage, and never returns a pass/fail
  on the difference. More honest, but it adds a check kind.

Both keep the fact that an absolute-cm ease band **does not grade correctly**:
the leg opening changes across XS–XL, so a fixed cm difference is a different
percentage at every size. Any implementation that puts a constant in `ease`
introduces a silent grading defect. This is a **decision gate**, not a
preference.

### 6.4 Waist construction

| Option | Meaning | Proposal | Classification |
|---|---|---|---|
| `waistFinish` | `0` = separate 1:1 self-fabric casing band, `1` = fold-down self casing on the leg panels, `2` = separate rib band with internal elastic | default `0` | **Product decision.** `0` reuses the proven `trouserWaistband` topology and keeps every seam 1:1 and checkable. `2` is the Jalie construction and stays **deferred** behind §3.4. |
| `elasticWidth` | User's declared elastic width, drives casing depth per C3 | user-owned cm, **no default proposed** (sources give 38 mm and 50 mm — C7) | Product decision, user-owned |
| `drawcordExit` | `0` = none, `1` = two buttonholes at centre front | default `1` | **Product decision**, supported by S1, S5, S6 |

Elastic **length** is deliberately **not** an option that affects geometry. It
is BOM/construction data: the user measures/test-fits the actual elastic,
records the chosen cut length and overlap, and follows the construction notes.
Given C1, C2 and C8, the app computes no length rule.

### 6.5 Drawcord hardware

Sources split between buttonholes (S1) and eyelets-or-buttonholes (S5), with
interfacing at the opening (S6). `PatternMark` has no eyelet kind (§3.4).

**Proposed treatment:** represent the exit as a `buttonhole` point mark and
name the hardware choice in the BOM and construction notes. This yields correct
marks in every writer with **no** shared-type change. Extending `PatternMark`
remains available to Codex as a separate, wider decision.

---

## 7. Guardrails and actionable guidance

Warn, never clamp. Every note names the field or option to change and a
direction. `option-<id>` field keys keep the existing Review-focus routing.

### 7.1 Inherited trouser guidance that stays correct

`waist < hip`; `hipDepth < crotchDepth`; positive finite `inseam`; positive
finished waist and seat; back rise greater than front rise; coherent
thigh → knee → leg-opening progression; all option range checks.

### 7.2 Removed

Every `flyLength` check in `trouserGuidance` becomes dead once the fly is
dropped. Leaving it would produce a warning about a control that no longer
exists.

### 7.3 Changed, and the reason it must be re-derived rather than inherited

`trouserPocketGuidance` measures pocket containment against
`metrics.frontCrotchY`, which is `frontRise − waistbandDepth`, and against the
front panel's `side*` boundary. Under `waistFinish = 1` (fold-down casing)
there is **no separate band**, so the panel top is *raised* rather than
lowered, and `waistbandDepth` no longer offsets the panel. Inheriting the
existing expression unchanged would shift every pocket check by the band depth.
This is exactly the "reuse is convenient, not correct" failure the project's
standing principle exists to catch. It must be re-derived from whichever waist
construction is drafted, and covered by a test that fails if the two
constructions share one expression.

### 7.4 New jogger guidance

| Invalid or risky state | Detection | Required correction behaviour |
|---|---|---|
| Woven material selected | selected `StretchFabric.family === "woven"` | Warn and gate the digital verdict, mirroring the existing inverse warning for trouser/woven-shirt plus knit in `app.ts`. Name the material control; never change the selection. |
| Cuff opening not smaller than the leg opening | `cuffOpening >= legOpening` with `ankleFinish = 1` | "The cuff is not smaller than the leg opening, so it cannot taper — reduce the cuff opening or increase the leg opening." Report both measured values. |
| Cuff opening implies a large stretch | `1 − cuffOpening / legOpening` above a declared review threshold | Report the exact required percentage and name it as a **material question**, not a failure: this app holds no stretch value for the selected trim. Never clamp. |
| Zero-length optional feature | `cuffDepth = 0`, or `ankleFinish = 1` with `cuffOpening = 0` | Must restore the uninterrupted plain-hem topology rather than emit a zero-length edge or a degenerate piece. This mirrors the Polo V2 zero-vent rule. |
| Casing depth cannot contain the declared elastic | casing depth below the C3 rule for the declared `elasticWidth` | "The casing is narrower than the declared elastic — increase waistband depth or choose narrower elastic." Report both numbers. |
| Drawcord exits collide with the casing stitch line | exit mark outside the channel bounds | Name the exact channel bounds and the offending value. |
| Pocket bag reaches the hem, the knee, the crotch, or leaves the front panel | existing `trouserPocketGuidance` checks, re-derived per §7.3 | Keep the existing actionable wording. |
| Leg opening smaller than the finished knee by an implausible amount | existing progression check | Keep. |
| Multi-fabric nesting is not a yardage estimate | recipe declares more than one material | The nesting view and tech pack must say the estimate assumes a single bolt width. Not a warning about the design — a truthfulness label about the output. |

---

## 8. Grading

The jogger reuses grade-by-redraft. `TROUSER_GRADE` is a reasonable starting
table for body girths and lengths, and every size must be redrafted and
re-checked through the same contract.

**What must not be graded by that table, and why:**

- **Cuff opening.** `TROUSER_GRADE` has no cuff row. If `cuffOpening` stays a
  constant option across the run (as all shipped recipes do with options), the
  cuff is the *same* circumference at XS and XL while the leg opening grows —
  the implied stretch percentage then differs at every size. Codex must decide
  whether `cuffOpening` grades, and if so, from what evidence. No reviewed
  source publishes a cuff grade increment.
- **Casing depth / elastic width.** These are hardware-driven and should not
  grade.
- **Elastic length.** Jalie grades it explicitly with a published per-size
  table (S1) — direct evidence that it is size-dependent *and* that it is
  published as data rather than derived. Since this packet keeps elastic length
  out of geometry, nothing grades; the BOM must say the length is unspecified
  rather than print a computed number.

**Grading pressure to test:** at XS the leg opening may approach or fall below
the cuff opening; at XL the casing depth relative to the front rise may
approach the crotch station. Both must produce actionable guidance, not a
clamped or broken draft.

---

## 9. Pattern pieces, interfaces, stitches, quantities, folds and grain

### 9.1 Proposed roles for the smallest honest v1

| Role | Purpose | Quantity | Fold |
|---|---|---|---|
| `frontLeft`, `frontRight` | Mirrored front leg panels | 2 physical | off fold |
| `backLeft`, `backRight` | Back leg panels with a real `centerBack` | 2 physical | off fold |
| `waistband` | One full-length self-fabric casing band, lower edge 1:1 with the measured four-panel waist interface | 1 | off fold |
| `pocketBagLeft`, `pocketBagRight` | Paired slant-pocket bags | 2 physical | off fold |
| `drawcord` | Flat self-fabric cord strip with a lengthwise fold mark | 1 | on fold (per S1) |

Optional when `ankleFinish = 1`: `cuffLeft`, `cuffRight` — 2 physical bands.

`flyShield` is **not** present (§3.6).

### 9.2 Fold and mirror semantics — an unresolved interaction

Jalie cuts the waistband and cuffs "on fold" (S1); the shipped trouser
waistband is a full off-fold strip. These reach the same finished band by
different routes, and the choice is **not** cosmetic in this codebase:

`export/unfold.ts` mirrors any `onFold: true` piece about `x = 0` for the
projector output, and fold edges take zero allowance by recipe convention (the
`centerFront: 0` / `centerBack: 0` entries in `KNIT_ALLOWANCES`, and `center`/
`fold` in `WOVEN_SKIRT_ALLOWANCES`). A band cut on fold along its *length*
(Jalie's convention,
folding the band left-to-right at its centre) and a band folded along its
*depth* (the doubling in UKY's "cut ribbing twice the desired width") are
different folds, and `unfold.ts` has exactly one fold axis (`x = 0`).

**Open question for Codex:** whether a doubled band is drafted at full cut
depth off fold (no fold semantics, one grain line, simplest for `unfold`), or
on fold with the fold on `x = 0`. The first is recommended by this record
because it keeps `unfoldLoop` and the projector path unchanged; the second
matches the reviewed official instructions. This must be decided before any
piece is drafted, not discovered during export QA.

### 9.3 Seam allowance ownership

The jogger must own its **own** `AllowanceSpec`; it must not import
`TROUSER_ALLOWANCES`. Two independent sources support a narrower knit
allowance (Jalie 6 mm included; UKY notes ¼-inch knit allowances and their
trade-off — §5), and the trouser map's `hem: 2` reflects a woven turn-up.

Edges needing explicit decisions rather than the `default`: `hem` (plain hem
turn-up vs a cuff join at a seam allowance), the waistband `top` / `bottom`,
the cuff join edge, the drawcord long edges, and every fold edge (which takes
zero — the shipped convention in `KNIT_ALLOWANCES` and `WOVEN_SKIRT_ALLOWANCES`).

**Corner and concave-offset risk:** Slice 145's repair added a local
crossing-loop trim in `src/render/allowance.ts` after the oracle found a
concave seam-allowance loop in the shipped **trouser back**. A jogger's back
crotch curve is the same family of geometry, and a deeper crotch drop makes it
more concave, not less. Allowance offset validity at the extreme crotch and at
the narrow cuff must be exercised deliberately (§13).

### 9.4 Interfaces and stitches

Side seams (front side ↔ back side, four named edges each, per side); inseams;
centre-back seam; waistband lower edge ↔ the four leg waist edges as one
multi-edge interface; pocket opening mark ↔ bag `opening` edge, per side; and
— only when `ankleFinish = 1` — the cuff join, which is **not** a 1:1 stitch
(§6.3).

**In-seam pockets, deferred with reason.** Jalie's hip pocket (S1) is set into
the side seam, which means the side interface must split into
`sideAbovePocket` / `pocketOpening` / `sideBelowPocket`, with only the sewn
segments participating in the side stitch. The shipped woven shirt already
proves this topology for its vent (`curvedHemAndVent` in `src/drafting/shirt.ts`
splits `sideLower` and emits a separate open `vent` edge with a `ventTop` mark),
so the pattern is known and reusable in spirit. It is nonetheless a **new
component contract**, it multiplies the pressure matrix, and the slant pocket
already has direct jogger evidence (C9). Defer.

### 9.5 Grain and direction of greatest stretch

The shipped grainline contract is `{ topEdge, topT, bottomEdge, bottomT }` — a
two-point line with no declared semantics beyond "this direction". For knits,
UKY states an additional requirement: "the greatest amount of stretch should go
around the body", and knit layout must follow a "with nap" one-way layout (S7).

Two distinct facts follow:

1. **The existing trouser waistband grainline happens to run the right way.**
   `TROUSER_NOTCHES` gives the waistband `grainline: { topEdge: "top",
   topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 }` — a line across the band's
   *depth*, not along its length. If that line is read as the fabric's
   lengthwise grain, the crosswise (stretch) direction runs along the band's
   length, which is what a rib band requires. This is a **favourable
   coincidence to verify**, not a designed behaviour, and it must be asserted
   by a test rather than assumed.
2. **The requirement is not expressible.** Nothing in the data model says which
   direction stretches. A future rib or elastic-bearing piece needs either an
   explicit stretch-direction declaration or, at minimum, an unambiguous
   construction-note convention. This is a **shared-contract question** for
   Codex, recorded here rather than papered over.

`nestPieces` never rotates and keeps grain upright, so the directional
requirement is satisfied by the shipped estimator. Epic 7's advisory
directional flag is consistent with this and must not be modified by a jogger.

---

## 10. Persistence and default compatibility

| Concern | Finding |
|---|---|
| New recipe id | Safe. `validWorkspace` resolves `garment` against `GARMENTS` and `targetStyle` against that recipe's styles. Older saves reference older garments and still load. |
| New recipe options | Safe and **no version bump**. `deserialize` iterates only the option keys present in the payload, and a `resolveJoggerOptions`-style resolver defaults anything absent — exactly how Polo V2 adds four options to the existing v4/v5 map. |
| New `Measurements` field | **Breaks existing v5 saves.** See §3.4. Requires `SAVE_VERSION = 6` with 5 accepted as legacy — a stop condition. |
| Material default | `DEFAULT_STRETCH_BY_GARMENT` in `src/ui/persist.ts` must gain a jogger entry. `defaultStretchFabricForGarment` falls back to `STRETCH_FABRICS[0]`, which is **Cotton woven** — so omitting the entry silently defaults a knit-only garment to a woven. This is a concrete implementation prerequisite, not a nicety. |
| Explicit material choice | An explicit material selection already persists across garment changes (Epic 5 boundary). A user arriving at the jogger with an explicitly chosen woven must see the §7.4 warning, not a silent reinterpretation. |
| Raw invalid values | Live invalid option values stay verbatim and visible; the existing `inputError` / Boundary Rail behaviour is unchanged. Recovery payloads (`patternworks_recovery_v1`) keep raw strings. |
| Surface placements | `SurfaceBook` is keyed by garment and style, so a new garment id starts empty and no old artwork is misapplied. New roles (waistband, cuff, drawcord) become new placement targets with true-scale cut frames from `src/surface/piece-frames.ts`. |

---

## 11. Drawcord safety and regulatory questions

Recorded as **open questions for the maintainer**, not answers. This record
makes no legal, compliance or safety claim.

1. The CPSC business-guidance page read on 2026-09-20 describes children's
   upper outerwear as "clothing, such as jackets and sweatshirts" and states
   that "pants, shorts, and skirts are not intended for the upper portion of
   the body and are excluded from the scope of the standard", with sweatpants
   described as excluded (S12). **Question:** does the maintainer accept that a
   jogger waist drawcord falls outside 16 CFR Part 1120 / ASTM F1816 as
   described there, and is that sufficient for the intended markets?
2. The same guidance describes bar-tacking a continuous drawstring so it cannot
   be pulled through its channel (S12), and Jalie independently instructs a
   centre-back anchor (S1). **Question:** should the app emit that anchor as a
   default construction step for every drawcord garment, regardless of
   regulatory scope, as a plain construction-quality default?
3. **Question:** does the product intend to offer child sizes at all? The
   shipped size run is XS–XL derived from the user's own base measurements
   (`TSHIRT_SIZES`), with no absolute size semantics. If child sizing is ever
   intended, the sweatshirt/hoodie packet's neck-and-hood drawstring prohibition
   becomes a live design constraint and this question must be reopened for both
   garments together.
4. **Question:** is any non-US market in scope? This record examined one US
   government guidance page and no other jurisdiction, standard or market
   requirement.

These questions are logged for Codex and the maintainer. No implementation
should encode an answer to them.

---

## 12. Material and hardware state

### 12.1 What the engine holds today

`STRETCH_FABRICS` carries `{ name, family, stretchPercent }`. It reaches
`suggestedEase()` advice, the `techPackForFabric` BOM variant, the fresh-
workspace default, and the woven/knit compatibility warning. It does **not**
reach `draft`, grading, checks, POMs, nesting or any writer.

No engine state exists for: trim stretch, trim recovery, elastic type, elastic
width, elastic length, cord diameter, eyelet size, shrinkage, or fabric weight.

### 12.2 Blockers and decision gates

| Gate | Blocking what | Owner |
|---|---|---|
| **G1** — may `draft` receive material stretch and recovery? | Rib waistband, rib cuff length, any negative-ease band | Codex + maintainer |
| **G2** — save-version bump to 6 | Any new `Measurements` field (e.g. ankle girth) | Codex + maintainer |
| **G3** — extend `PatternMark` with an eyelet kind? | Eyelet-versus-buttonhole hardware fidelity | Codex |
| **G4** — per-piece material tag and multi-bolt nesting | A truthful yardage estimate for any multi-fabric garment | Codex; a future epic, explicitly not Epic 7 |
| **G5** — declared direction-of-greatest-stretch on a piece | Rib grain correctness expressed as data rather than convention | Codex |
| **G6** — cuff-join check semantics (§6.3 (a) vs (b)) and its grading behaviour | Any non-1:1 band join | Codex |

---

## 13. Verification plan — future, not evidence

**This is a plan for work that has not been done.** No jogger geometry, render
or output exists. Nothing below asserts that any output has been produced or
inspected.

### 13.1 Parameter and size matrix

1. Default size M with proposed defaults; XS and XL from the same base.
2. Full XS–XL graded run, redrafted and re-checked at every size.
3. Every static option boundary, at min and at max.
4. Shortest relevant lengths: minimum `inseam` (55) combined with maximum
   `pocketBagDepth` (35) — the combination that already produced a real
   front-side-seam warning in the shipped trouser at Slice 102 — and minimum
   `inseam` with a cuff present.
5. Zero-length optional features: `cuffDepth = 0`; `ankleFinish = 1` with
   `cuffOpening = 0`; `drawcordExit = 0`. Each must restore the uninterrupted
   topology rather than emit a degenerate edge or piece.
6. Boundary-adjacent optional features: `cuffDepth` at its smallest non-zero
   value; `cuffOpening` one step below `legOpening`.
7. Adjacent-component collisions: casing depth versus the front crotch station;
   pocket bag versus the cuff top; pocket opening versus the casing stitch
   line; drawcord exit versus the pocket opening.
8. Absent, low and high stretch: the same draft with Cotton woven (must warn),
   Cotton jersey (25%), Rib knit (50%) and Spandex blend (80%). **Expected
   result today: the geometry is identical in all four cases.** That identity is
   itself the finding, and a test should assert it so the day geometry starts
   depending on material is impossible to miss.

### 13.2 Geometry and seam truth

9. Every curved interface verified by its **real walked seam path** via
   `interfaceLength` / `cubicLength`, never by an endpoint span or a shared
   horizontal extent. Front and back crotch curves, the waist edge and the
   cuff join all fall under this.
10. Allowance joins at the concave back crotch, at the pocket-bag corners and
    at the narrow cuff, exercised through the existing exact-corner solve and
    the Slice 145 crossing-loop trim; a broken outline must be visibly rejected,
    never scaled or clipped.
11. Zero-length edge rejection; non-self-intersecting outlines at every option
    extreme.
12. Left/right mirror symmetry asserted on pieces, marks and notches.

### 13.3 Persistence

13. A pre-jogger v5 save loads with the jogger absent and nothing changed.
14. A jogger save round-trips.
15. Raw invalid option values survive save, recovery and reload and remain
    visible to guidance.
16. Confirm — by test, not by reading — whether any new `Measurements` field was
    added. If one was, the §3.4 v5 breakage must be reproduced and the version
    bump verified.

### 13.4 Views, nesting, surface and outputs

17. All seven current views: Pattern, Body (front / back / pair / Side
    schematic), Size run, Spec, Nesting, Check, Edit — plus the reversible
    Assembled lens.
18. Nesting at narrow and wide fabric widths, including a width narrower than
    the full-length waistband strip so the `fits = false` path is exercised;
    plus the optional fabric-on-hand and directional/nap notice **as Epic 7
    ships them**, with no modification to `nestPieces`.
19. Surface placements empty and populated, including artwork anchored to a new
    role (waistband, cuff, drawcord) and the true-scale cut-box containment,
    resolution-floor and coverage warnings.
20. All six output families — SVG, DXF, tiled PDF, A0 PDF, projector SVG,
    tech pack — parsed with real consumers (DOMParser, DXF entity inspection,
    pdf-lib) **and** visually inspected as rendered pages, not accepted on
    parser success. The opt-in surface print sheet is a seventh, artwork-scoped
    output and should be exercised too.
21. `a0Overflow` and `tiledPdfLocalCoordinates` behaviour confirmed for the
    long leg panels, as the trouser required at Slice 101.
22. Projector `unfold` behaviour confirmed for whichever fold policy §9.2
    resolves to.
23. All eight protected legacy export hashes byte-identical, and every non-
    jogger output byte-identical.

---

## 14. Construction sequence

Ordered operations for the proposed v1, assembled from the reviewed sources.
This is tech-pack text, not a sewability claim.

1. Confirm the knit's stretch against the pattern's stated requirement and
   pre-treat the main fabric; do not pre-wash rib trim intended as trim (S7).
2. Stabilise the drawcord opening area on the waistband (S6, S7).
3. Attach each pocket bag to its marked slant opening on the front panel;
   understitch and secure the bag inside the panel.
4. Join each front leg to its matching back leg at the side seam, matching
   balance notches.
5. Sew both inseams, then close the centre-back seam.
6. Work the drawcord exits on the waistband at the marked positions.
7. Form the waistband into a loop; fold and stitch the casing channel at the
   marked lines (S1, S8).
8. Insert and join the elastic, quartering and matching to centre front,
   centre back and the side seams (S1, S8).
9. Join the waistband to the four-panel waist perimeter, matching quarter
   marks.
10. Make the drawcord; thread it through the casing; anchor it at centre back so
    it cannot be pulled through (S1). S12 is child upper-outerwear guidance and
    explicitly excludes pants, so it is not authority for this construction.
11. Ankle: plain hem (default), or attach the folded cuff as a loop matching
    seam and half marks, or insert hem elastic — per `ankleFinish`.
12. Press; inspect the casing, the pocket openings and the ankle finish.

---

## 15. Smallest honest v1

A **knit jogger** that is:

- the shipped four-panel leg block with jogger defaults and the fly removed;
- a separate **self-fabric** casing waistband whose lower edge is 1:1 with the
  measured waist interface — every seam checkable, no negative ease anywhere;
- elastic as a declared notion with user-entered width and a user-measured,
  test-fit cut length recorded in the tech pack; the app never computes a
  universal reduction;
- a drawcord piece plus two buttonhole exit marks and a centre-back anchor
  note;
- the shipped slant pocket, with containment guidance **re-derived** for the
  new waist construction;
- a **plain tapered hem** — no cuff, no hem elastic;
- its own allowance map, notch table, POM list, style table, guidance and
  tech pack;
- a knit material default and an inverse (woven) compatibility warning;
- a nesting output explicitly labelled as a single-bolt estimate.

Automatic material-derived geometry — rib reductions, elastic length and
stretch thresholds — is **absent**, not approximated. The actual elastic is
still present as a notion and construction step. This version makes no claim
the engine cannot support.

---

## 16. Deferred and rejected

| Item | Verdict | Reason |
|---|---|---|
| Rib ankle cuff | **Defer** — include immediately after G1 or G6 resolves | Evidenced and wanted, but its length is either material-dependent or needs the §6.3 check decision |
| Elasticated ankle hem | **Defer** | Second elastic channel; same blocked question; lower value than the cuff |
| Separate rib waistband with internal elastic | **Defer** | The most faithful construction (S1) and the most blocked |
| In-seam / side-seam pockets | **Defer** | Genuine new component contract; slant pocket already has jogger evidence |
| Back patch pocket | **Defer** | Evidenced (S1) and cheap, but it is additive polish, not the jogger's defining feature |
| Woven track pant | **Defer** | Different ease and closure problem |
| Elastic length in geometry or as a computed BOM number | **Reject** | C1, C2, C8 — no defensible rule exists |
| A universal cuff reduction factor | **Reject** | C5 — sources give two incompatible framings |
| A universal minimum-stretch threshold | **Reject** | C6 — publishers disagree, and the engine holds no stretch input |
| Zip ankles, cargo pockets, knee articulation, gusset | **Reject** | No evidence reviewed, no stated user problem |

---

## 17. Slice-band estimate

Ranges, with the uncertainty stated. These are **planning estimates**, not
commitments, and they assume Codex owns geometry per the standing delegation
boundary.

| Scope | Estimate | Dominant uncertainty |
|---|---|---|
| §15 v1 only, no new engine input, no save bump | **4–6 slices** | Whether the slant-pocket guidance re-derivation (§7.3) and the fold-policy decision (§9.2) surface downstream export work, as the trouser's A0 and tiled-PDF corrections did at Slice 101. That precedent is the main reason this is not 3 slices. |
| v1 plus rib cuff, after G6 resolves but **without** material input | **+2–3 slices** | The cuff-join check semantics and its grading behaviour; the narrow-cuff allowance offset. |
| Full jogger with rib waistband and cuffs, after G1 | **+4–7 slices**, and G1 itself is an **architecture epic, not a slice** | G1 changes a shared drafting signature and touches every recipe, the grammar, grading and the checker. Estimating it from inside a garment packet would be dishonest. |

Confidence: **moderate** for the v1 band (the trouser gives a close precedent);
**low** for anything past G1.

---

## 18. Verdicts

| Question | Verdict |
|---|---|
| Does a jogger belong in this app? | **Yes, include.** It is the natural next lower-body derivative, it reuses a shipped block with genuine construction correctness on rise, taper and slant pocket, and it improves user outcomes by adding the most common knit bottom. |
| Does it fit the current architecture? | **Partly.** The v1 in §15 is a recognisable adult jogger and fits without automatic material geometry. Rib waistband/cuff calculations and computed elastic sizing do not. |
| Is it scalable and maintainable? | **Yes for v1**, because it adds a recipe and no engine file. **Not yet** beyond v1: three separate gates (G1, G4, G5) would otherwise be answered with hidden constants, which is the failure mode this project has repeatedly had to repair. |
| Should it be implemented before the shipped gates clear? | **No.** Epic 11 remains the next implementation-ready geometry epic after its unchanged Epic 7 gate. |
| Is the shorts packet a prerequisite? | **No geometrically.** It is the preferred implementation predecessor because both change the lower-body source of truth and should not be developed concurrently. The jogger does not inherit short-inseam or short-hem topology. |

---

## 19. Physical validation plan

Physical sampling remains explicitly paused at the maintainer's request. When
and only when it is reopened, a jogger record must capture: the wearer's
measurements taken with the same landmarks; the exact knit with a measured
stretch percentage and recovery test, and the same for any trim; the exact
elastic type, width and cut length; calibration of the printed or projected
output; the bottoms POMs from L1 — waist, upper hip, hip, front and back rise,
outseam, inseam, thigh, knee, leg opening, waistband height — and, per L1,
**relaxed and stretched states recorded separately** ("For a rib cuff or
elastic hem, first record the relaxed half opening, then stretch evenly without
distorting the seam or fabric"); the sewn result against the predicted POMs;
casing behaviour, drawcord retention, cuff entry and recovery after wear; and
shrinkage after laundering. None of this evidence exists.

Note that the app can only ever predict a **relaxed** POM today, because it has
no stretch input. A future spec sheet that prints a single ankle-opening number
for a rib cuff without saying "relaxed" would be misleading; L1's two-state
convention should be adopted in the POM labels from the first cuffed garment.

---

## 20. Decisions, estimates and unresolved questions

### 20.1 Product decisions proposed by this record

- Knit-only scope for v1.
- Adult-only scope for v1; no child-size or age mapping is inferred from XS–XL.
- Plain hem as the default ankle finish.
- Separate self-fabric casing band as the default waist finish.
- Elastic width is explicit; elastic cut length is user-measured/test-fit and
  recorded, never computed from a universal reduction.
- Slant pocket retained, in-seam deferred.
- Fly removed entirely.
- Drawcord exits represented as buttonhole marks; hardware named in BOM text.

### 20.2 Engineering decisions proposed by this record

- The jogger owns its own allowance map, notch table, POM list, guidance and
  style table; it imports no trouser table wholesale.
- `cuffOpening` is a user-owned finished circumference, never a derived
  reduction.
- Pocket containment expressions are re-derived per waist construction and
  covered by a test that fails if the two constructions share one expression.
- The nesting figure for a multi-fabric garment is labelled as a single-bolt
  estimate.

### 20.3 Estimates and starting values

**None proposed.** This record deliberately publishes no seeded jogger numbers
for rise, thigh ease, knee ease, leg opening, cuff opening, cuff depth, casing
depth or elastic length. Every candidate number found was either publisher-
specific, material-dependent, or contradicted by a second source. Codex should
set defaults explicitly from the shipped trouser's rendered geometry and label
them as digital starting values.

### 20.4 Open questions requiring maintainer or Codex input

1. G1 — Slice 154 resolves P0 without passing material into drafting: use
   explicit finished band/cuff lengths and report the implied stretch ratio.
   Automatic material-derived lengths remain deferred.
2. G2 — is a `SAVE_VERSION` bump acceptable, and when?
3. G3 — extend `PatternMark` with an eyelet kind?
4. G4 — per-piece material and multi-bolt nesting: which epic?
5. G5 — how is direction-of-greatest-stretch declared?
6. G6 — cuff-join check semantics, and whether `cuffOpening` grades.
7. Fold policy for doubled bands (§9.2).
8. Whether `crotchDrop` is added or the two rise eases carry it (§6.2).
9. The four drawcord-safety questions in §11.
10. Whether the jogger waits for the Slice 150 shorts answers (recommended) or
    proceeds in parallel.

---

## 21. Sources

All web sources opened and read on **2026-09-20**. No source code, pattern
shape, drafting diagram or long passage was copied. Quoted fragments are short
factual statements recorded for comparison.

### Official pattern instructions (one publisher — S1–S4 count once)

- **S1** — Jalie, *Sewing Instructions, Pattern #3909 HENRI, Joggers and
  Shorts*, instruction PDF (pages 5–10 reviewed: pattern-piece list and cut
  quantities, pocket, waistband, drawstring, ankle cuff, hem, and the corrected
  elastic table headed "TABLEAU CORRIGÉ OCTOBRE 2024").
  <https://cdn.shopify.com/s/files/1/0267/4075/2568/files/3909R_887ef1ed-42e1-4a29-ac10-c8e6ab3f77c3.pdf>
- **S2** — Jalie, *3909 HENRI — sizing and yardage chart* (body-measurement
  tables for boys and men, fabric requirement "at least 10% stretch across the
  grain", notions, and the 5 cm elastic quantities).
  <https://cdn.shopify.com/s/files/1/0267/4075/2568/files/product_sizes_3909_b223a36a-9204-455c-8fbb-5b6c66b67831.pdf>
- **S3** — Jalie, *Sewing Pattern Jalie 3909 — HENRI Joggers and Shorts*
  (product page; features, seam allowance, errata notes).
  <https://jalie.com/products/henri-joggers-and-shorts-sewing-pattern>
- **S4** — Jalie, *Sewing Pattern Jalie 3355 — Sweatshirt, Hoodie and Sweat
  Pants* (product page; View C sweat pants with side-seam pockets and elastic
  at ankle and waist; "knit with 10% stretch in the width").
  <https://jalie.com/products/sweatshirt-hoodie-and-sweat-pants-sewing-pattern>

### Independent publishers

- **S5** — Sew Over It, *Ellis Joggers PDF Sewing Pattern* (product page;
  elasticated waistband, eyelets or buttonholes, 38 mm elastic, 1.3 m cord,
  slanted pockets, optional hem elastic, "at least 15% stretch").
  <https://sewoverit.com/products/ellis-joggers-pdf-sewing-pattern>
- **S6** — Seamwork, *All About the Mel Joggers*, published 2019-12-31, and the
  *Mel Knit Jogger Pants* pattern page (2" braided elastic, ¼" drawstring,
  1" × 1" fusible interfacing pieces, cuffs, recommended knits).
  <https://www.seamwork.com/issues/2020/01/all-about-the-mel-joggers> ·
  <https://www.seamwork.com/pdf-sewing-patterns/mel-knit-jogger-pants>

### Institutional

- **S7** — University of Kentucky Cooperative Extension Service, *Sewing with
  Knit Fabric*, publication **CT-MMB.165** (knit classes and stretch
  percentages; recovery testing; "the greatest amount of stretch should go
  around the body"; "with nap" layout; elastic type differences; the
  two-thirds ribbing rule; standing a tape on end to measure a neckline along
  the seam line; stabilising stress seams).
  <https://fcs.mgcafe.uky.edu/sites/fcs.mgcafe.uky.edu/files/ct-mmb-165.pdf>
- **S8** — Robin C. Mack-Haynes (reviser), *Waistbands Made Easy*, Guide
  **C-234**, New Mexico State University, College of Agricultural, Consumer and
  Environmental Sciences, revised and electronically printed June 2011
  (all-in-one versus separate casing; elastic measured to the body with a 1"
  overlap; quartering; decorative/sport elastic as a separate class).
  <https://pubs.nmsu.edu/_c/C234/index.html>
- **S9** — Rose Marie Tondl, *NF00-412 Sewing with Elastic*, University of
  Nebraska–Lincoln Extension, 2000. **Metadata and abstract only** — the
  repository returned HTTP 403 for the full text on 2026-09-20, so **no numeric
  claim in this record rests on it**. Listed so a future revision can retrieve
  it. <https://digitalcommons.unl.edu/extensionhist/1142/>

### Open-source parametric drafting

- **S11** — FreeSewing, *Paco pants — Design Options* (waistband width, waist
  height and angle, elasticated cuff boolean, ankle/hem elastic width, crotch
  drop 2% default / 0–10%, crotch seam angle and bend, leg balance, front and
  back pocket booleans, waist and seat ease, length bonus).
  <https://freesewing.eu/docs/designs/paco/options/>

### Regulatory guidance

- **S12** — U.S. Consumer Product Safety Commission, *Drawstrings in Children's
  Upper Outerwear — Frequently Asked Questions* (business guidance; definition
  of upper outerwear; covered sizes 2T–12 and 2T–16; hood/neck prohibition;
  waist/bottom 3-inch limit, no toggles or knots, bar-tack requirement; and the
  statement that pants, shorts and skirts are excluded from scope).
  <https://cpsc.gov/business--manufacturing/business-education/business-guidance/drawstrings-in-childrens-upper-outerwear/frequently-asked-questions-faqs>

### Manufacturer / retailer educational (corroborating only)

- **S10** — Rima Khusainova, *Sewing Glossary: Three Ways To Sew Elastic
  Waistband Tutorial*, the thread (blog.fabrics-store.com), 2018-07-10 (casing
  at least ¼" wider than the elastic; elastic cut "a few inches smaller" than
  the waist plus 1"; tiered and paperbag casing allowances; lapped-and-boxed
  elastic join).
  <https://blog.fabrics-store.com/2018/07/10/sewing-glossary-three-ways-to-sew-elastic-waistband-tutorial/>

### Local project references (product-owner supplied, routed in `CONTEXT-INDEX.md`)

Directory: `F:\tank-sketches\scribd - garment-design - files\`

- **L1** — `garment_measurement_quick_reference.docx`, *Garment Measurement
  Quick Reference*. Bottoms codes M, N1, N, O/P, Q, Q1/Q2, R, S/T, U and WB;
  the pocket codes V5/V6; and the stretch-measurement section requiring relaxed
  and stretched states to be recorded separately.
- **L2** — `pattern_making_body_measurements_reference.docx`, *Pattern Making
  and Grading Reference*. Grain and layout; ease added deliberately after body
  measurement; manual and master grading by increments.
- **L3** — `pattern_drafting_quick_reference.docx`, *Pattern Drafting Quick
  Reference*. Wearing versus design ease as separate, intentional quantities.
- **L4** — `stitches_seams_detailed_reference.docx`, *Stitches and Seams
  Detailed Reference*. Stitch class 401 for setting elastic in waistbands;
  406/407 for knit hems and bindings; 407 more elastic than 406; class 301 not
  suited to elastic or knit fabrics. Construction metadata only — explicitly
  not proof of sewability and not a source for machine settings.

### Prior InfiniDrip records consulted (not re-derived here)

`docs/research/garments/TROUSER-RESEARCH.md` (the shipped lower-body contract,
including its own NMSU C-227, Cornell, University of Minnesota and Virginia
Tech evidence for rise and crotch), `docs/research/garments/POLO-V2-RESEARCH.md`
(the sleeve-rib deferral precedent), `docs/research/garments/TANK-RESEARCH.md`,
`ARCHITECTURE.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md` and
`docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md`.
