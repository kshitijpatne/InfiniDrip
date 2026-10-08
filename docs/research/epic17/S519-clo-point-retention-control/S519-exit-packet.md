# EPIC-17 / G04 V03 — CLO source-point retention control — Slice 519 exit

## Purpose and result

S519 tested one new CLO import control that had a vendor-support lead; it did
not repeat S503's AAMA/ASTM or curve-optimization matrix. The tested control
was `Import Draw Curve Points (When curve is not loaded)`, checked while all
other import settings and the AAMA export profile matched S516. The strict
cut-geometry result did not improve. Stop further CLO trials of this fixture
for this point-retention cause.

## Evidence classes

- **Pattern source:** the hash-pinned file contains 18 `POLYLINE` entities and
  610 `VERTEX` records, with no `SPLINE` or `LWPOLYLINE`. The five failed CUT
  paths are the closed source polylines previously mapped in S516/S517.
- **Vendor support lead, not a compatibility guarantee:** a CLO staff response
  in the CLO Help Center community recommends enabling `Import Draw Curve
  Points` when a DXF pattern imports incomplete. The current CLO DXF guide
  describes AAMA/ASTM import and export and other point controls, but does not
  document this option's exact geometry semantics. It describes curve-point
  optimization as reducing point count; the CLO import/export guide says its
  import variant optimizes curve points. Neither promises source-vertex
  preservation.
- **Observed in receiver:** CLO 2026.1.310 (r58944) visibly exposed the exact
  import option, and it was checked. DXF-AAMA; centimeters; 100%; Do Not
  Rotate; Maintain Original grain; Import Notch to Both at Ratio; all other
  import boxes stayed unchecked. The imported nine-piece workspace rendered
  without a format error and showed CLO's informational Custom seam-allowance
  notice.
- **Observed export settings:** DXF-AAMA; Graded Nest; centimeters at 100%; Do
  Not Rotate; Duplicate Notch on Seam Allowance checked; export without
  grading/baselines/seam allowance, curve conversion, curve optimization,
  pattern bounds, and selected-pattern export unchecked/disabled, matching
  the S516 AAMA settings.

## Measured exchange output

- Source:
  `C:\G04-CLO-DXF-Exchange\S519-clo-point-retention-control\Input\polo-standard-m.dxf`
  — 24,261 bytes; SHA-256
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- One output:
  `C:\G04-CLO-DXF-Exchange\S519-clo-point-retention-control\Output\polo-draw-curve-points-on-aama.dxf`
  — 148,011 bytes; SHA-256
  `773348e9207292f29c41fb1804344565fca4767abc7bcb0bc3121e6b6f6f8bba`.
- Reproducible analyzer:
  `analyze-s519-draw-curve-points.mjs`; report:
  `C:\G04-CLO-DXF-Exchange\S519-clo-point-retention-control\Evidence\Analysis\s519-draw-curve-points-on-contour-diagnosis.json`.
  It binds the same five source CUT polylines to their existing receiver
  blocks/layers and samples source segments at no more than 0.005 cm against
  exact receiver segments.
- **Failed, unchanged:** all five cuts still lose one point and exceed the
  strict 0.001 cm gate: back `33→32`, 0.0127407 cm; outer stand `54→53`,
  0.0129774 cm; inner stand `54→53`, 0.0139742 cm; upper collar `44→43`,
  0.0129902 cm; under collar `44→43`, 0.0129989 cm. These are the same five
  points and measured distances as S516/S517. The new import control therefore
  does not fix the tested AAMA Polo M output.
- No output reimport, second-generation export, or additional option cell was
  run after the five-cut failure. The native save in S518 still cannot
  attribute the change to import versus export. The new test does not prove
  that CLO is generally unsuitable or that every CLO profile fails; it proves
  only that this build/profile/fixture/control combination fails the unchanged
  gate.

Rendered and settings evidence is in the named S519 C: folder:

- `Evidence/01-import-dialog-draw-curve-points-on.jpg`
- `Evidence/02-imported-pattern-with-draw-curve-points.jpg`
- `Evidence/03-export-dialog-aama-settings.jpg`
- `Evidence/04-after-export-pattern-view.jpg`

## V03 disposition and next action

V03 remains In Progress. The practical CLO AAMA candidate still fails strict
Polo M cut geometry after the one evidence-led new setting; this branch has no
verified CLO correction to justify another same-fixture test. Keep all-seven
recipe coverage, the 0.001 cm gate, grading/marks/layers, negative-control,
round-trip, industrial profile and rights gates unchanged. Do not make a
general suitability or exact compatibility claim. Next, assess a different
rights-reviewed receiver/profile against actual capability and geometry
evidence; only return to CLO for a genuinely new, source-backed mechanism.

No production source, pattern geometry, stitch graph, baseline, or acceptance
criterion changed. CLO is left running and idle for the ongoing Epic, in line
with maintainer direction. All S519 fixture and rendered/output evidence
remains within `C:\G04-CLO-DXF-Exchange\S519-clo-point-retention-control\`.

## Sources

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
  updated 2026-09-28. Documents import/export profiles and the stated purposes
  of point optimization and non-grading-point removal; it does not define the
  `Import Draw Curve Points` control.
- CLO Help Center community, [Problems to Import Pattern DXF](https://support.clo3d.com/hc/en-us/community/posts/4408039776281-PROBLEMS-TO-IMPORT-PATTERN-DXF),
  CLO staff reply dated 2021-10-19. Suggests checking `Import Draw Curve
  Points` when a pattern is incomplete; it does not claim exact vertex or
  round-trip preservation.
- CLO Help Center, [Optimize All Curve Points](https://support.clo3d.com/hc/en-us/articles/115000527527-Optimize-All-Curve-Points),
  updated 2024-08-24. Says lower point ratios may deviate from original
  curvature; S503 already tested the import optimizer off/on.

## Verification and closeout

- `analyze-s519-draw-curve-points.mjs` replay: passed and reproduced the five
  strict gate failures above.
- Actual imported-pattern render and live import/export settings were reviewed
  in CLO. No format error occurred. The output DXF was hash-identified and
  measured; all captures remain on C:.
- Board start replay `3187→3189`; exit replay `3189→3191`. Focused Control
  Center tests pass 42/42; exit board preflight/replay and `git diff --check`
  pass. This evidence-only slice does not invoke the full repository gate.
- No safe independent ownership split existed for a one-option live receiver
  test; Codex retained ownership.

Started `2026-10-08 18:40:10 UTC` from S518 commit `7b20f20` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S519 was the next
unique slice after S518. Closed at `2026-10-08 18:48:17 UTC` (8m07s total):
implementation and live receiver trial 5m30s; focused analysis and verification
2m37s; external-agent wait 0; maintainer-decision wait 0. Primary usage was
2% at the last check and ordinary usage remained available. CLO remains open
and idle for the admitted V03 work.
