# G04 V02 — Polo H shoulder marker readability — Slice 393

## Start boundary and authority

- Started 2026-10-03 04:04:09 UTC from clean S392 commit `d05c70a` on `codex/epic-17-g04`. `origin/main` refreshed to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and verified as ancestor. Highest assigned slice is 392; S393 is uniquely reserved. Canonical board revision 2147 records S392; EPIC-17 and G04-V02 are In Progress, V01 Done, V03 Backlog. Usage at start: primary 30%, weekly 98% informational; ordinary work allowed.
- S392 corrected the C baseline-only wording and reaffirmed the independent sleeve residual. Its next open Polo output hold is H: `shoulder-seam` and `neck-width` are represented at the front shoulder station, where separately sourced front and outer-stand shoulder marks and the outer-stand outline crowd the keyed letter/ring display. S384 records no stitch-graph join between those marks; do not infer one.
- This slice is a bounded diagnostic and candidate-render review, not permission to implement a new H placement. Use the exact 17 S390 supported Polo options and same-revision current production output, then trace each H POM/ring/glyph to exact pattern and rendered entity IDs. Any candidate may move only the H letter while preserving both source-centered rings, labels/schedule entries, source paths/marks, projection, geometry, stitch graph, option values and paired-back output. Ask for a design decision only if the verified source/output evidence cannot settle H readability.

## Scope and acceptance criteria

- Reconcile H's exact source POM anchors/targets with S384 topology, the S391 contact matrix, S392's current revision join, and the actual S391 default H render. Confirm all 17 option rows/revision identities and 11 same-revision schedule rows.
- Trace the `front:shoulder` and `outerStand:shoulder` marks, outer-stand outline and H ring/text in current vector coordinates. Determine which displayed marks/strokes remain obscured by the halo/letter and whether the authored source supports any semantic suppression. Preserve both marks absent explicit source evidence.
- If a view-only glyph placement can be diagnosed, produce an annotated overlay and actual rendered trial crops for default and the limiting supported options. Report exact offset, ring-to-anchor and text/path/mark clearances, affected options, and any remaining overlap. Keep diagnostic trials separate from production behavior until an explicitly approved proposal exists.
- **Pass:** evidence binds exact source/revision/option identity, H's two POM schedule rows remain distinct, all geometry/source marks remain, and the full set of relevant rendered views clearly shows both shoulder marks and the keyed callout without implying an unencoded join. **If no trial passes or a design choice remains:** preserve all 34 Polo holds and return the measured options/trade-off; do not change source, marker centers, style, acceptance or gate in this slice.
- Keep all seven recipes required for V02, V02 before V03, the 0.25 cm assembly residual gate, legacy DXF behavior, protected export identities, and all V03 rights/round-trip gates unchanged. No physical-fit/factory-acceptance claim.

## Required verification and non-goals

- Reuse the S391/S392 option, keyed output and current-source harnesses; run focused diagnostic syntax/option replay, inspect the generated rendered output, run `npm run control-center:test` after validated board replay, validate the canonical board and `git diff --check`.
- No production edit, source/cut/stitch/POM change, source mark/path suppression, marker center relocation, threshold/hold/acceptance change, DXF/export baseline change, UI redesign, or V03 work. Do not spend a slice re-researching construction references.
- Full repository coverage and integrated build/export/browser/output gates remain for the settled Epic candidate. No independent low-risk delegation is identified because the exact same-revision renderer geometry and rendered H review form one coupled diagnostic.

## Start-board record

Preflighted against canonical revision 2147 and replayed through `executeBoardCommand`, advancing the board to 2151. G04-V02 and EPIC-17 remain In Progress; no status or acceptance change.

## Exit record

### Source and output findings

- S384 topology and current S390/S391 outputs match on all 17 supported Polo option rows. Both source POMs `pom:polo:shoulder-seam` and `pom:polo:neck-width` target the same front outline source edge `pattern:polo:role:front:edge:shoulder` at `(7,0)` cm, and share keyed station H. Their two complete schedule rows remain separate; each current source SVG has 11 same-revision schedule rows. The marker is an open 0.22 cm ring centered at that source point.
- The independently authored `pattern:polo:mark:front:shoulder` and `pattern:polo:mark:outerStand:shoulder` are both present at the same coordinate. S384 found no stitch-graph join between these distinct marks. The current H halo/letter bbox contacts both marks and `flat:polo:FRONT_FLAT:component:outerStand:outline`; the S391 actual crop shows the H halo masks strokes at this crowded station. Neither mark nor path can be suppressed from available source evidence.
- A diagnostic-only scan applied 20 text-only offsets to the exact 17 S390 actual-renderer SVGs. The selected trial translates only the H glyph by `(+0.45,+0.45) cm` from its current baseline; positive SVG Y is downward. The resulting H baseline is `(7.45,0.52)` cm. Both POM rings, their `(7,0)` anchor, radius, target/source/revision metadata, source labels, all path/mark geometry and the complete POM schedule remain unchanged. No connector or join is added.
- This exact trial yields 17/17 rows with positive sampled-path, independent-mark and source-label bounding-box clearance. Minimum clearances across all options: 0.086563 cm to a source path (`polo-default`, `outerStand:outline`), 0.258235 cm to an independent mark (`front:shoulder`), 0.144421 cm to source text (`standFrontRise=max`); the minimum H-letter-to-ring-stroke gap is 0.186332 cm. These are geometry-screen results, not a universal typographic tolerance. Browser errors: 0. All 17 candidate crops plus actual-renderer default and limiting crops are saved in `rendered/`; manual review confirms H is legible and the two source marks remain exposed in the candidate. The letter is outside and adjacent to its ring, which weakens its direct association without a leader.
- The first candidate scan had a stale-coordinate accumulation bug; the next run compared a point object to the matrix's coordinate tuple. Both diagnostic-only errors were corrected, then the 20-offset/17-option run passed with offsets reset from each exact source SVG. A first slow implementation redundantly sampled source paths per candidate; the final scan caches same-revision path/mark/text geometry per option and completes in about 7 seconds. The invalid intermediate matrices/renders are superseded by the final generated matrix and images.

### Decision and disposition

- **Proposed design decision, not source evidence:** use the view-only H-letter translation `(+0.45,+0.45) cm`; keep the source-centered ring fixed at `(7,0) cm`, radius `0.22 cm`, and keep both same-point source marks and the two distinct POM rows. This improves H glyph clearance on all 17 exact options; trade-off: the letter sits 0.186 cm beyond the ring stroke and has no leader, so the POM-to-letter association is less direct. No geometric or stitch relationship is inferred.
- No implementation is authorized by this diagnostic. Until the maintainer approves this exact view-only placement, retain the current H placement and keep all 34 Polo faces held. If approved, a subsequent bounded slice may implement and verify only the H glyph offset across all 17 options and rendered output; every face still requires all applicable V02 checks, including the separate 0.68 cm sleeve-cap assembly residual against 0.25 cm. If not approved, retain the current hold and bring a different evidence-backed display proposal without source edits.
- V02 does not pass. Preserve all-seven recipe acceptance, V02-before-V03, every existing hold, legacy DXF behavior, protected export byte identities, V03 rights/round-trip gates and the no-fit/no-factory-acceptance boundary. No production source changed, so global coverage and integrated build/export/browser gates remain for the settled Epic candidate.

### Verification and elapsed closeout

- `node --check docs/research/epic17/S393-polo-h-shoulder-readability/diagnose-h-glyph-placement.mjs` and the final 17-option Chromium diagnostic pass; `npm run control-center:test` passes 42/42 after the validated exit board replay; board validation passes; `git diff --check` passes. The final matrix binds source IDs, target IDs, options, same-revision POM schedules, all candidate clearances and rendered file references.
- S393 elapsed 04:04:09–04:20:03 UTC (15m54s): diagnostic script/evidence work about 5m; focused 17-option browser metrics and rendered review about 7m; board/state/packet closeout about 3m54s; external-agent waits 0m; maintainer-decision time 0m (decision remains pending).
- **Next action:** request a decision on the exact H glyph-only offset above. Do not implement it or accept any Polo face before approval and a passing full option/rendered V02 review.
