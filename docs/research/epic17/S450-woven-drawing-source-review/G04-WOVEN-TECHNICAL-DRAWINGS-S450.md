# G04 Woven technical-drawing source review — Slice 450

## Start boundary

- Started 2026-10-08 00:12:39 UTC from clean S449 `4bfc6eea8ab8b04852acb31899b2424bc096ab47` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice was 449; S450 is unique.
- Canonical board revision 2707 at start; EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog; integrated tally 56 accepted / 90 held over 73 configurations / 146 faces. Goal is active.
- This is a bounded literature/source review following the maintainer-authorized proposal-only Woven source-design study. It does not authorize production changes or view release.

## Exact drawing needs

Source/output revision: `live-draft:woven-shirt:14:14`.

1. **Woven collar front (28 configurations):** the technical evidence must show how the body neckline, collar stand, under collar and upper collar sit when sewn, which face/edge is visible in a front technical view, and whether the continuous body-neckline seam is visible where the approved collar projection contacts/crosses it. Generic collar dimensions alone cannot settle this block-specific visible-line decision.
2. **Woven sleeve/back (28 configurations):** evidence must show the two set-in sleeve orientations in a back flat, the source sleeve's front/back cap identity and join, the complete hem-to-band relationship, and a truthful arrangement of both bands that fits the current fixed S370 detail positions. A sewing/drafting diagram of one sleeve alone cannot establish a two-sleeve flat arrangement.

## Primary and institutional drawings inspected

### Peer-reviewed menswear shirt pattern image

Da Som Koo, Jae Sang An and Hye Jun Yoon, “Classification and analysis of fabric types for shirts: A comparison between virtual and real fabrics,” *Journal of Engineered Fibers and Fabrics* 19 (2024), DOI `10.1177/15589250241262318`, Figure 2 “Shirt patterns used for virtual clothing.” [Publisher article and figure](https://journals.sagepub.com/doi/10.1177/15589250241262318).

- The primary publisher identifies Figure 2 and describes the study's use of men's shirt patterns in CLO virtual fitting. The article is open access under CC BY 4.0.
- **Useful drawing:** the published pattern-piece layout is a traceable, shirt-specific visual comparator for panel inventory, grain/center orientation and how separate left/right sleeve and collar pattern pieces are laid out. It can inform source-piece identity and candidate pose review.
- **Cannot establish:** it is a cut-pattern layout used for virtual clothing, not a sewn-sequence diagram or a front/back technical flat. It does not show the exact Woven block, its seam graph, the collar visible-face order, or a pair-of-sleeves/band flat placement that preserves S370's fixed details. It is not a verified fix.
- Rights permit attribution-based reuse under CC BY 4.0; the study needs only a linked citation, so no figure reproduction is included here.

### Industry collar construction drawings

M. Müller & Sohn, Sabine David, “Pattern construction for collar with stand,” published 2022 from *Damen-Rundschau* 02.2012. [Article and drawings](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-collar-with-stand/).

- **Useful drawings:** separate-stand collar draft, pattern separation, finished upper/under collar pieces. Its written instructions explicitly measure the lowered neckline, distinguish collar stand/roll/outer collar width, check seam transitions, and allow material-dependent upper-collar roll.
- **Cannot establish:** the examples are women's collar constructions with different drafted geometry. They support the construction distinction between neckline, stand seam, upper/under collar and rolled exterior, but do not identify which continuous neckline line should be visible in this source's flat or whether its projected collar contour should obscure it.

M. Müller & Sohn, “Pattern Construction for Shirts,” industry patternmaking article with illustrated shirt draft. [Article and figures](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-shirts/).

- **Useful drawings:** pattern-piece identity and draft/edge transitions across a shirt, sleeve, collar, cuff and placket; useful as an industry terminology and pattern-measurement cross-check.
- **Limit:** the cited model is a raglan shirt, not this set-in sleeve construction, so it cannot prove Woven sleeve cap identity or back-view placement. S449 already records this qualification.

### University sleeve construction/drapping sequence

Cornell University, *Draping the Human Form — Shirt Sleeve*, steps 1–20. [Lesson with step and back-view images](https://fit.cit.cornell.edu/textiles/draping/drapes/shirtsleev/steps/default.html).

- **Useful drawings:** a shirt-specific flat-cap sleeve draping sequence relates cap geometry to the armscye and continues through underarm and cuff. This provides an academic comparator for a sleeve attached at the armhole and for front/back orientation cues.
- **Cannot establish:** it is a draping lesson, not a paired-sleeve technical-flat rule. It does not say how to arrange two mirrored sleeves and their bands in one back view, and it does not address the fixed S370 layout.

## Decision-quality conclusion

No public, inspected, reliable drawing exactly answers both blocker questions for `live-draft:woven-shirt:14:14`. The strongest complementary material is (a) SAGE Figure 2 for source-piece inventory/orientation, (b) M. Müller & Sohn's separate collar/stand draft for construction interfaces and collar roll, and (c) Cornell's sleeve sequence for set-in cap/armscye construction. These are **qualified research references**, not source evidence and not a verified semantic fix. A paywalled menswear patternmaking text may supply more complete shirt drafts, but only its publisher/catalog contents are verified in current records; no purchase or restricted-access request is authorized or required by this slice.

Accordingly, no construction convention is inferred from these drawings. The next useful study step is to compare their clearly identified construction interfaces against the exact source edges/stitches and actual 28-option views, then produce bounded in-memory proposals showing precise line visibility/placement, measurable collisions and impacts on fixed detail positions. If no drawing or code-derived topology settles a choice, keep the affected faces held and present that exact decision. No repeated general-reference search is warranted absent a new specific candidate source.

## Scope, gates, and non-goals retained

- No production source, renderer, pattern/cut geometry, source stitch graph, view metadata, POM, test, export, face hold, V02 criterion, CAD profile, or status changed in this study.
- Preserve all-seven V02 acceptance, V02-before-V03, all current face holds, the continuous neckline, fixed S370 band positions, legacy DXF behavior, protected export bytes, and V03 rights/receiver/representative round-trip gates.
- No broad UI, recipe addition, physical sampling, supplier contact, spending, hosted service, or production-readiness claim.

## Slice exit evidence

- Verified the SAGE primary article and Figure 2 identification/license, M. Müller & Sohn collar article and its construction drawings/text, Cornell shirt sleeve lesson, and S449's qualification of the Müller shirt pattern article.
- The new peer-reviewed Figure 2 adds a reliable pattern-piece layout comparator but not a sewn layer order or source-specific answer; the existing V02 blockers remain unresolved and all affected Woven views remain held.
- Board start replay advanced 2707→2709; validated exit replay advanced 2709→2713 and attached the exit record to G04-V02 and EPIC-17. EPIC-17/G04-V02 remain In Progress, V03 remains Backlog; integrated tally remains 56 accepted / 90 held.
- Focused verification: start/exit preflight, board command replay, JSON and JavaScript syntax, canonical board status/evidence, `npm run control-center:test` (42/42), and `git diff --check` pass. No production/global coverage/build/export/browser gate was due for this documentation-only source review.
- Goal inspection at this normal boundary reports the exact admitted EPIC-17/G04 objective as **active**; wording and status match current records.
- Elapsed 00:12:39–00:13:28 UTC (49s): source and drawing qualification ~20s; packet/state/board work ~18s; focused verification ~11s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** continue the already-authorized exact-source in-memory study across all 28 Woven configurations and provide precise candidate overlays and impacts. This drawing-source review changes no production code or face status.
