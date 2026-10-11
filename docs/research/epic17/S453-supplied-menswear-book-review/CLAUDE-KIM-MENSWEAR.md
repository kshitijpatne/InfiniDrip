# S453 — Claude review of the supplied Kim & Kim menswear PDF

- **Contributor:** Claude Code (Opus 5.5), delegated read-only research for Codex.
- **Worktree / base:** `claude/slice-453-kim-book-review` at `3b0832c` (Slice 452), clean at start.
- **Status:** proposal-only evidence. Uncommitted. Codex owns slice numbering, board, `PROJECT-STATE.md`, context links and integration.
- **Date:** 2026-10-07 local session date. The S451–S452 repository records are timestamped 2026-10-08 UTC.

## 1. Scope and constraints

**Asked.** Review only the user-supplied PDF *Patternmaking for Menswear: Classic to Contemporary* (Myoungok Kim; Injoo Kim) for:

- woven shirt collars and stands
- sleeve-cap front/back identity and notches
- the cuff/band join
- paired-sleeve and back-flat presentation

For each, record the exact location, render and visually inspect every cited figure, and separate what the book shows from convention, inference and product decision. Then assess the S451 front-collar tradeoff and the S442 fixed-S370 back hold, and state what the book cannot establish about `live-draft:woven-shirt:14:14`.

**Records read before the PDF:**

- `AGENTS.md`, `CONTEXT-INDEX.md`, and `PROJECT-STATE.md` (S446–S452)
- `docs/PROJECT-DECISIONS.md` entries for S321, S345, S359, S370, S406, S425 and S442
- the S442, S449, S450 and S451 packets
- the S407 packet, trial matrix and default baseline/trial crops
- the S410 packet, plus the S417 packet and its default post-clip overlay
- read-only parts of `src/drafting/shirt.ts`: sleeve, sleeve band, sleeve stitches, collar stitches and the notch table

**Constraints kept:**

- no web search
- no other book or reference
- no purchase
- no change to code, source, view, test, board or state
- no reproduced figures and no extended quotations; book content is paraphrased
- only this file was written

## 2. The supplied source and its limits

- **Edition.** The title page (PDF p.2) identifies the **2014 first edition**: Fairchild Books, DOI `10.5040/9781501303951`, ISBN 978-1-60901-944-0 (paperback), 978-1-60901-971-6 (ePDF), published online 2021. **It is not the 2025 second edition (ISBN 9798765106167) that S449 qualified.** Do not attribute these findings to the second edition. Figure numbers and pages may differ between editions.
- **Format.** This is a reflowed online-platform export. Each chapter carries a DOI and a "Page Range" header, but **individual pages carry no printed page numbers**. Exact printed pages are therefore known only in three ways:
  - chapter ranges and chapter start pages, from the contents (PDF pp.2–3) and chapter headers;
  - the book's own cross-references. Fig. 5.40 is cited as printed page 143 (at PDF p.279), and the two-piece casual sleeve as pages 130–131 (at PDF p.274);
  - nothing else. The offset drifts within a chapter (Ch. 5 opens on PDF p.131 = printed p.117, but Fig. 5.40 sits on PDF pp.162–163 = printed p.143), so I did not interpolate other page numbers.
- **Missing figure images.** Some numbered figures appear in this export as caption or text only:
  - Figs 2.8–2.12 and 2.15 (PDF pp.40–43)
  - Figs 2.42–2.45 (PDF p.63)

  Claims about these figures are text-only.
- **Rendering.** Pages were rasterised by the Claude Code PDF reader at about 820 px page width. No zoom or crop was available, because local Python/PDF utilities were not permitted in this session. Fine strokes in small flats and pattern pieces are at the edge of legibility. Examples are a fold line inside a band piece, or a short neckline stroke at centre front. This is noted wherever it matters.
- **Provenance.** The file name indicates a third-party download. I did not assess its licence or provenance.
- **Page numbering.** PDF pages are given 1-based (viewer numbering), with 0-based indices in parentheses in the register.

## 3. Evidence register

Every page cited below was rendered and visually inspected.

**Class key:**
- **D** — directly depicted or stated by the book
- **C** — an illustration convention repeated across the book's flats; a drawing convention, not a construction rule
- **I** — Claude inference
- **P** — still a product decision

| ID | Topic | Book item | Printed page | PDF p. (0-idx) | What the rendered page shows or states (paraphrased) | Class |
|---|---|---|---|---|---|---|
| K0 | Edition and contents | Title page, contents | front matter | 2–3 (1–2) | Edition, DOI and ISBNs. Chapter ranges: Ch. 2: 17–62; Ch. 4: 77–116; Ch. 5: 117–148; Ch. 8: 215–255 | D |
| K1 | Purpose of the flats | Preface, item 4 | xi–xii | 6 (5) | Flat sketches show designs with details and accurate proportions, and serve as communication between design and patternmaking | D |
| C1 | Collar overview | Ch. 4 opener, shirt-collar flats | 77 (chapter start) | 80 (79) | Four shirt-collar front flats. Collar and stand are drawn as an opaque foreground over the body | D, C |
| C2 | Collar anatomy | Fig. 4.1 and text | 77–116 | 80–81 (79–80) | Collars other than standing collars have a sewing line, a roll line and an edge. The roll line is where the stand turns into the fall | D |
| C3 | Shirt-collar group | Flat 4.5 and text | 77–116 | 88 (87) | Shirt collars have stands. The stand is either a separately sewn band (two-piece) or included in the collar (one-piece) | D |
| C4 | One-piece proportions | Fig. 4.13 | 77–116 | 89 (88) | Collar fall is given as band height + ¾" | D |
| C5 | Two-piece collar, front flat | Unnumbered flat | 77–116 | 91 (90) | Opaque leaves whose front edges converge on the band's top button. The band shows only in the V above the button, and body shoulder lines start at the collar edge. At this resolution no body-neckline stroke is visible through or beside the collar | D, C |
| C6 | Two-piece proportions | Fig. 4.17 | 77–116 | 91–92 (90–91) | Example band height 1⅛–1½" (≈2.86–3.81 cm). Collar fall = band height + ½–¾" (≈1.27–1.91 cm extra) | D |
| C7 | Band draft | Fig. 4.18 | 77–116 | 92 (91) | Band drafted on back + front neck length, with a front extension and a ½" rise at centre front | D |
| C8 | Collar draft | Fig. 4.20 | 77–116 | 93 (92) | Collar section drafted above the band and fitted to the band's upper edge | D |
| C9 | Finished collar pieces | Fig. 4.21 | 77–116 | 94 (93) | Separate collar and band, each reflected about centre back. Side-neck marks on the band; button and buttonhole at the band ends | D |
| C10 | Upper vs under collar | Fig. 4.24 (sport collar) | 77–116 | 95 (94) | Upper collar on straight grain, under collar on bias. Both show the roll line and notches | D |
| C11 | Shirt front flats | Fitted, Western, Military, Princess and Oxford shirts | 215–255 | 244, 257, 264, 270, 277 (243, 256, 263, 269, 276) | The same collar-foreground convention repeats | C |
| C12 | Collar reused in a shirt | Figs 8.6 and 8.7 | 215–255 | 249–250 (248–249) | Fitted-shirt collar drafted from Ch. 4. The finished set includes separate Collar (Cut 2) and Band (Cut 2) pieces | D |
| S1 | Cap identity | Fig. 2.6 and text | 17–62 | 38 (37) | The sleeve sloper labels the back and front sleeve curves on opposite sides. Cap lengths are fixed by the armhole each is sewn to | D |
| S2 | Front cap ≠ back cap | Figs 2.8–2.11 (text only) | 17–62 | 40 (39) | Front cap drafted to front armhole − ¼"; back cap to back armhole − ⅛". Different construction offsets on each side | D (text; images absent) |
| S3 | Cap ease | Table 2.5 and note | 17–62 | 41 (40) | Shirt-sloper ease about 0–⅛" per side, 0–¼" total (≈0–0.64 cm). Little or no cap ease preferred when shirt armholes are topstitched | D |
| S4 | Notch rule | Notches text, Fig. 2.14 (drawn), Fig. 2.15 (text only) | 17–62 | 42–43 (41–42) | Menswear uses two notches on each of the front and back armholes; the second back notch is double. Cap notches are placed to distribute ease, with the double notch at the back | D |
| S5 | Draft orientation and cap marks | Figs 5.1, 5.2, 5.5, 5.8, 5.12, 5.40, 5.48–5.49, 8.4, 8.38 | 117–148 (Fig. 5.40 = p.143); 215–255 | 132, 133, 135, 137, 140, 163, 168–169, 248, 280 (131, 132, 134, 136, 139, 162, 167–168, 247, 279) | Every draft is labelled Back on the left and Front on the right. A double mark sits on the back cap near the underarm, a single mark on the front cap, and single marks either side of the crown | D |
| S6 | Double notch = back | Fig. 5.28 text (raglan) | 117–148 | 153 (152) | Double notches mark the back draft | D (raglan context) |
| S7 | Placket = back half | Fig. 5.3 | 117–148 | 133 (132) | The sleeve placket sits at the midpoint of the back half of the sleeve | D |
| S8 | Finished sleeve sets | Figs 8.7 and 8.40 | 215–255 | 250, 281 (249, 280) | Sleeve (Cut 2) with a double-marked back cap. Fronts carry single armhole notches and backs double | D |
| B1 | Cuff types and length | "Cuffs" text | 117–148 | 163 (162) | Cuffs are either sewn-on or turn-back. A sewn-on cuff's height is subtracted from total sleeve length; a turn-back cuff is cut on as a sleeve extension | D |
| B2 | Hem-to-cuff length | Figs 5.1–5.2 text, Fig. 8.4 | 117–148; 215–255 | 132–133, 248 (131–132, 247) | Sleeve shortened by cuff height − ½". Wrist line = cuff width − ½ placket width; pleat intake is added in Figs 5.5, 5.8 and 8.18 | D |
| B3 | Band cuff | Fig. 5.47 | 117–148 | 167–168 (166–167) | A plain rectangle (wrist + 2" × e.g. 1½"). No fold is drawn | D |
| B4 | Turned-back cuff | Figs 5.48–5.49 | 117–148 | 168–169 (167–168) | A short-sleeve cuff cut on with the sleeve by repeated reflection about stitch and fold lines, held with bar tacks | D |
| B5 | Short sleeve with separate band | Figs 8.38 and 8.40 (Oxford shirt) | 215–255 | 280, 281 (279, 280) | A band (e.g. 1¼") drafted across the narrowed short-sleeve hem, ends on the side seams. The finished set has a separate Sleeve-band (Cut 2). Internal lines on the band piece are not legible as fold vs stitch | D (legibility limit) |
| B6 | Short sleeve, cut-on cuff | Figs 8.43 and 8.45 (Tuxedo shirt) | 215–255 | 284, 285 (283, 284) | Uses the turned-back extension instead of a separate band | D |
| F1 | Half-front / half-back flats | Ch. 5 sleeve flats | 117–148 | 132, 134, 136, 139, 162 (131, 133, 135, 138, 161) | Paired half views, each showing one sleeve | D, C |
| F2 | Full back flats | Fitted, Convertible, Western, Military, Princess, Oxford and Tuxedo shirts | 215–255 | 244, 251, 257, 264, 270, 277, 282 (243, 250, 256, 263, 269, 276, 281) | See §4.4 for detail. Both sleeves mirrored, each on its own side and angled out from its armhole. No sleeve crosses another sleeve or the torso. Cuffs, bands and turn-ups are attached at each hem | D, C |
| F3 | Pattern pieces kept separate | Figs 8.7, 8.13, 8.21, 8.35, 8.40, 8.45 | 215–255 | 250, 255, 262, 275, 281, 285 (249, 254, 261, 274, 280, 284) | Bands and cuffs appear as pattern pieces only in separate finished-pattern sets. No flat shows a detached band or cuff detail | D, C |
| F4 | Chapter 8 overview | Ch. 8 opener thumbnails | 215 (chapter start) | 242 (241) | Front/back thumbnails of eight shirts, in the same convention | C |
| A1 | Closure overlap (outside the requested scope) | Ch. 8 introduction | 215 | 242 (241) | Front-button shirts usually lap the wearer's left panel over the right | D |

## 4. Findings by topic

### 4.1 Collars and stands

**What the book shows or says (D):**
- A men's shirt collar is either two-piece (collar plus separately sewn band) or one-piece (C3).
- Two-piece band and collar are drafted as separate pieces fitted to each other and to the measured neck length (C6–C9).
- Upper and under collar differ in grain (C10).
- The collar fall is drafted deeper than the band. The example is band height plus ½–¾" for two-piece (C6) and plus ¾" for one-piece (C4).

**Illustration convention (C):** In every front flat with a shirt collar (C1, C5, C11), the collar and stand are drawn as an opaque foreground:
- body lines stop at the collar's outer edge;
- the band shows only in the V above the top button;
- the collar front edges converge on that button.

At the rendered resolution, no flat shows the body/band neckline seam as a stroke running across or beside the collar.

**Inference (I):** If the fall is band height plus ½–¾", the turned-down collar edge sits ½–¾" beyond the band-to-body seam wherever the collar exists. So in a sewn shirt that seam is normally covered by the collar. The book does not state this outright; it follows from the stated proportions together with the C1/C5 depiction.

**Source and approved-view comparison (repository facts):**
- The Woven source joins `outerStand.neckline` to the body neckline, and the collar layers to the stand through separate stitches.
- The S359-approved projection places each collar layer between signed offsets `−standHeight` and `collarLeafDepth − standHeight`, where the latter is at least 0.5 cm (S446/S449). The body neckline sits at offset 0, so it lies inside each projected leaf along the leaf's length. The only collar contour it crosses is the leaf's front-tip edge: the two S417 contacts at about x = ±0.84 cm.
- S445 records that this projection is a technical-flat convention, not a claim about sewn roll.
- The book's sewn shirt appearance therefore cannot validate the projected geometry.

### 4.2 Sleeve-cap front/back identity and notches

**What the book shows or says (D):**
- Front and back caps are distinct (S1–S2): drafted to different armhole lengths with different construction offsets.
- Cap ease for a shirt sloper is small (S3).
- Menswear notching (S4): two notches per armhole, with the second back notch doubled. Cap notches are matched to these and positioned to share out the ease.
- Every rendered sleeve draft and finished sleeve piece (S5, S8) has Back on the left and Front on the right, with the double mark on the back cap.
- A raglan instruction states outright that the double notch marks the back (S6).
- The sleeve placket sits on the back half (S7).

**Source comparison (code facts, read-only at `3b0832c`):**
- The current `wovenSleeve()` cap is mirror-symmetric about the crown (`wovenCapCurves`).
- `WOVEN_SHIRT_SLEEVE_STITCHES` joins `capLeft` + `capRight` to `front.armhole` + `yoke.armholeUpper` + `back.armholeLower`. S345 maps `capLeft` to the front armhole.
- `WOVEN_SHIRT_NOTCHES` declares one notch at `t = 0.5` on `capLeft` and none on `capRight`. The body armholes have no notches; the body notches are on the shoulders and the yoke seam.
- The source therefore marks the front cap with a single notch, which is consistent with the book's convention. It has no double back notch, no matched armhole notches, and no geometric front/back difference.
- In this source, cap identity rests entirely on the stitch graph and the S345 mapping.

**Classification:**
- The book's notch scheme and asymmetric cap are **D** for the book's own blocks.
- Applying them to this source would be **P**: a separate source and notch decision. Nothing in the current blocker evidence depends on it.
- The book's left/right drawing orientation is a drafting presentation (**C**). The pieces are cut as mirrored pairs ("Cut 2"), so the orientation does not show which source edge is front.

### 4.3 Cuff/band join

**What the book shows or says (D):**
- A sewn-on cuff or band is a separate rectangle whose joining edge is matched to the finished sleeve hem (B2): wrist line = cuff width minus half the placket width, plus any pleat intake. Its height is subtracted from total sleeve length (B1).
- For a short sleeve with a separate band, the band is drafted across the narrowed hem with its ends on the side seams, and issued as a separate Sleeve-band, Cut 2 (B5).
- Alternatively, a short-sleeve cuff is cut on with the sleeve and turned back (B4, B6).
- The plain band cuff is drawn without a fold (B3).

**Source comparison:**
- `sleeveBand(edgeLength(sleeve.hem), sleeveBandDepth)`, together with the `sleeveBand.top ↔ sleeve.hem` stitch, gives a band whose joining edge exactly equals the hem. This is consistent with the book's length-matched join for a short sleeve with no placket and no pleats.
- The source band is folded, with a FOLD instruction mark at half depth. The book's band piece (B5) cannot confirm or refute a fold at this resolution.
- The source places the hem at `capHeight + m.sleeveLength` and adds the band below it. The book subtracts a sewn-on cuff's height from total sleeve length.
- Whether the Woven sleeve-length measurement includes the band is a measurement-definition question (**P**), and I did not verify it. It is unrelated to the V02 blockers.

### 4.4 Paired sleeves and back-flat presentation

**What the book shows (D, depiction):** Every full back flat (F2) draws:
- two mirrored sleeves, each hanging outward from its own armhole on its own side;
- with no sleeve crossing the other sleeve or the torso;
- with cuffs, bands or turn-ups attached at each sleeve's hem;
- on long sleeves, plackets visible on the back of each sleeve, consistent with S7.

Chapter 5 instead uses paired half-front/half-back flats (F1). No flat shows a detached cuff or band detail; pattern pieces appear only in separate finished-pattern sets (F3).

**Classification:** This is a consistent design-flat **convention (C)**. The book explains no projection or pose rule for the flats, beyond saying the flats show details and accurate proportions (K1).

## 5. Does the book change the S451 front collar tradeoff?

**Short answer.** Not as a matter of fact. It remains a product decision (**P**). Neither S451 option becomes a construction fact for `live-draft:woven-shirt:14:14`. The book does, however, bear on the decision in three ways.

1. **Convention balance (C).** The book never shows a body-neckline seam drawn continuously across a shirt collar; the collar is always foreground. The S425/S342 choice to keep a continuous visible seam therefore has no support in this book's flats. The premise of S451 trial 1, that the seam continues beneath a foreground collar, is consistent with them.

2. **Which interval would be hidden: a flag for Codex (I, unverified).** The two descriptions of trial 1 may select different parts of the neckline:
   - **Where the S407 trial cuts.** The S407 trial matrix removes the body neckline from its centre-front endpoint to the first collar crossing (default: crossing at x = ±0.8424 cm, 0.8430 cm removed per side).
   - **Which side of the crossing the leaf covers.** By the projection math in §4.1, the leaf covers the neckline lateral to each front-tip crossing. S417's placket-mask entry point (about x = ±0.833 cm, y = 8.2 cm) sits at the same station.
   - **What the renders show.** The S417 overlay and S407 crops show the two front-tip contours converging on a point on the collar outer contour, about 2.5 cm below the neckline at centre front (default option; approximate, measured from the crops).
   - **My reading.** The S407 span therefore appears to lie in the open V between the projected collar points, not under a leaf. Meanwhile the lateral neckline inside each leaf stays drawn over the collar, per S410's paint order.
   - **Consequence if confirmed.** "Opaque collar above the neckline" and "covered only over the measured 0.8426–0.8433 cm intervals" would hide different intervals.
     - The book's convention matches the first. It would hide the neckline from each front-tip crossing towards the shoulder clip, far more than 0.84 cm per side.
     - The second would hide seam where the projection shows the V between the collar points.
   - **Not verified.** I did not inspect the mask path data, and S407 itself describes the span as concealed under the projected collar. **Codex should check the exact 14:14 collar mask before putting trial 1 to the maintainer.**

3. **Centre-front configuration differs (D vs approved view).**
   - **In the book:** the collar front edges converge on the band's top button, and the collar points cover centre front below it.
   - **In the approved projection:** the front tips converge about 2.5 cm below the neckline, leaving an open V below it.
   - **What that means:** the book cannot validate S359, which S445 records as a flat convention. Changing S359 would be a separate product decision.

**Net.** Keep all 28 fronts held. If the maintainer wants to follow the book's foreground-collar convention, the honest next trial is not S451 trial 1 as written. It is an exact re-specification: hide the body neckline wherever the same-revision projected collar silhouette covers it, with the hidden length measured per option, and with 28-option renders, colorway closure and readability checks. Alternatively, keep S425. Either way, the choice belongs to the maintainer.

## 6. Does the book change S442 (fixed S370 bands, Woven backs held)?

**No.**
- The book's back flats never show crossing sleeves (F2). This agrees with refusing to accept the current crossing, so keeping the 28 backs held is consistent with the book.
- The book offers nothing that bears on the S370 side-gutter positions. It never draws detached band details; bands are shown attached in place, and pattern pieces live in separate sets (F3).
- It gives no basis for moving the details 20.5737–22.4315 cm, or for the 41.1474–44.863 cm wider viewBox in S451 trial 2.
- Its outward, non-crossing sleeves resemble S441's crossing-free local-Y result only in appearance. The book cannot show that pose is right for this mirror-symmetric source sleeve.

**Optional future composition (I, not tested here).** The book's convention points to a different layout: outward sleeves with bands attached at the hem, and no detached details. That would supersede the S370 composition and the S442 decision; S369/S370 history shows that assembled-band views crossed under the earlier sleeve mapping. If the maintainer ever reopens the back layout, it would need its own exact 28-option trial. It does not alter the current decision.

## 7. What the book cannot establish about `live-draft:woven-shirt:14:14`

- **Source identity.** The book is not a source for this block: no InfiniDrip pieces, edge IDs, stitch graph, option ranges, measurements or revision. It is also a different edition from the one S449 qualified.
- **Which cap is front.** It cannot say which source edge (`capLeft`/`capRight`) is the front cap. That is set by the source stitches and S345, and the source cap is mirror-symmetric.
- **The front-collar geometry.** It cannot validate:
  - the S359 projection;
  - the S417 contact coordinates (about ±0.8424 cm, y ≈ 8.17 cm);
  - the 0.8426–0.8433 cm per-side interval;
  - whether the centre-front span lies inside the projected leaf silhouette;
  - the visible layer at those stations in any of the 28 options.
- **The back layout.** It cannot establish:
  - the S370 gutter positions, frame or viewBox;
  - whether the S441 local-Y pose is correct for this sleeve;
  - how far band details should move, or which over/under order the two reflected full hems should take.
- **Band and cap details.**
  - Whether this source band should be folded: the band piece's fold or stitch lines are not legible.
  - The right band depth.
  - Whether the authored +1.5 cm cap ease suits this block. Table 2.5 suggests 0–¼" for a shirt sloper, but S345 deliberately preserves +1.5 cm.
- **Validation.** It establishes no sewn roll, fit, physical validation, factory acceptance, or CAD/export behaviour.
- **Rights.** This file is not a rights review of the supplied PDF.

## 8. Adjacent observations outside the requested scope (no action implied)

- **A1 — closure overlap.** The book states that front-button shirts usually lap the wearer's left panel over the right. S321 approved "right button placket above left buttonhole placket". I did not check which handedness convention (wearer or viewer) that wording uses, or which source placket carries the buttonholes. If Codex finds a mismatch, it is a maintainer question, not a current V02 blocker.
- **S3 — cap ease.** The book's shirt-sloper cap ease (0–¼" total, ≈0–0.64 cm) is well below the source's authored +1.5 cm. S345 deliberately preserves the +1.5 cm; this is noted for context only.

## 9. Holds, gates and claims

- No change to any face hold.
- The 56 accepted / 90 held tally, V02 all-seven acceptance, V02-before-V03, the continuous-neckline decision (S425), and the fixed S370 positions with all 28 back holds (S442) are unchanged.
- Polo holds, protected export identities, legacy DXF, and the V03 rights/round-trip gates are unchanged.
- No physical fit, factory acceptance, production readiness or CAD compatibility is claimed.

## 10. Method and rendered coverage

- **Pages rendered and inspected** (1-based PDF pages):
  - 1–6
  - 38–45
  - 60–64
  - 74–104
  - 117–124
  - 127–172
  - 238–265
  - 270–290
  - PDF pp.90, 91 and 244 were re-rendered for a closer look at the centre front of the collar.
- **Repository evidence images viewed:**
  - `docs/research/epic17/S417-woven-front-post-clip-intersection-audit/woven-shirt-default-post-clip-overlay.png`
  - `docs/research/epic17/S407-woven-collar-stack-diagnosis/rendered/front-neckline-occlusion-trial/woven-shirt-default-baseline-detail.png`
  - `docs/research/epic17/S407-woven-collar-stack-diagnosis/rendered/front-neckline-occlusion-trial/woven-shirt-default-detail.png`
- **Not inspected:**
  - PDF pp.105–116 and 125–126: wing/lapel collar finishing and hood steps, not shirt-relevant.
  - Chapters 6–7, apart from the Ch. 6 opener (PDF pp.170–172).
  - Chapters 9–15.
- **Verification.** No tests, build or board commands were run or due. This is a documentation-only contribution for Codex review.
