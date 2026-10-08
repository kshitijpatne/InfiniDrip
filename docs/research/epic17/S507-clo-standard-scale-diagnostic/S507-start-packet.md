# EPIC-17 / G04 V03 — CLO Standard DXF inverse-scale diagnostic — Slice 507 start

## Verified start

- Started `2026-10-08 16:37:25 UTC` from clean S506 commit
  `968c72644bd6dde9e7ca8e13764dee0c5b155878` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. S506 is the highest assigned slice; S507 is reserved.
- Canonical board revision is 3139; EPIC-17/G04-V03 In Progress, V01/V02
  Done. The active EPIC goal remains required through merge and deployment.
- The source copy for the trial is S505's 24,261-byte Polo M Standard DXF,
  SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- S505 established the specific failure: under its centimeter/100% Standard
  DXF import, all nine exported pieces measured about `0.1×` source bounds.
  Source, first export and second export contain no `$INSUNITS` header
  variable. S505 also found five known Polo contour deviations and six
  missing polyline records after the round trip.

## Bounded test objective

Test one direct inverse-factor hypothesis: keep every S505 import/export
setting fixed except change the first Standard DXF import's Scale from 100% to
1000%. This is the exact reciprocal of the measured `0.1×` bound ratio. Check
whether the first ASTM export restores source-scale dimensions and whether a
normal ASTM reimport at 100% preserves that result. The factor is a diagnostic
input, not an acceptance adjustment or proposed user-facing workaround.

Use existing installed CLO 2026.1.310 only, under the maintainer's documented
S503 authorization for bounded local import/export evaluation. Keep all source
copies, native projects, DXFs, comparison scripts/reports and screenshots in
`C:\G04-CLO-DXF-Exchange\S507-clo-standard-scale-diagnostic`. Do not use
CLO-SET/CONNECT, network transfer, or other cloud features. Close the app
normally after the evidence is captured, as previously requested.

### Exact settings

First import: Standard DXF; centimeter; **1000% scale**; Do Not Rotate;
Maintain Original grain; Import Notches Both / Ratio; Optimize All Curve Points
off; all other S505 toggles unchanged/off.

First export: DXF-ASTM; Graded Nest; centimeter/100%; Do Not Rotate; Duplicate
Notch on Seam Allowance on; Optimize All Curve Points off.

Reimport first export: DXF-ASTM; centimeter/100%; Do Not Rotate; Maintain
Original grain; notches Both / Ratio; Optimize All Curve Points off.

Second export: same ASTM settings as the first export.

## Acceptance and interpretation

1. Confirm the input hash before interaction; record the unique target CLO
   window, About version, exact dialog values, warnings, and visible result.
2. Save a distinct native project before each export. Capture full-view and
   settings screenshots for import, first export, reimport, and second export.
3. Parse both outputs and compare all nine source piece dimensions, CUT
   contours, closure, and entity records to the hash-pinned source and S505
   outputs. Report all values at original scale against the unchanged
   `0.001 cm` gate; do not normalize, rescale a comparison reference, or
   compensate the acceptance threshold.
4. If 1000% restores scale, report only that this one configuration corrected
   the measured bound scale. It cannot pass V03 while the five contour errors,
   missing round-trip records, rights/local-handling, profile, grading,
   negative-control, and all-seven gates remain open.
5. If it over-scales, leaves scale unchanged, errors, or produces malformed
   output, preserve that concrete result and do not guess another factor in
   this slice.

## Non-goals / holds

No pattern-source or stitch-graph edit, user-facing setting, generic DXF code
change, baseline update, profile selection, acceptance/gate change, Richpeace
installation, terms acceptance, account/vendor action, new garment, physical
fit claim, factory claim, or production-readiness claim. The user-approved
1000% test does not clear CLO's separate rights review or establish commercial
use, standards conformance, native grading, or compatibility beyond this exact
input/configuration. Preserve V02/all-seven Done, V03 In Progress, legacy DXF
behavior, protected export identities, and all numerical thresholds.

## Verification and delegation

This slice is GUI evidence plus read-only analysis; no production files,
fixtures, tests, or protected exports will change. Focused checks are the input
SHA-256, actual screen/settings captures, the S505 geometry/entity analyzer
replayed against both outputs, validated board evidence, Control Center tests,
and staged/unstaged diff checks. The integrated build, browser output review,
full test/100% coverage and protected-output gate remain at the settled
Epic/PR candidate. No safe disjoint task exists because one import, export,
reimport and capture chain must share a unique live CLO session; Codex owns it.

## Blocking decisions and next action

No new design decision is required. The already authorized local trial can
proceed. This experiment addresses only the measured unit-scale symptom;
V03 cannot pass on this one recipe/configuration. Next: perform the controlled
1000% CLO import/export/reimport with C-only files, then update the result and
all remaining V03 gates without treating the import display as acceptance.
