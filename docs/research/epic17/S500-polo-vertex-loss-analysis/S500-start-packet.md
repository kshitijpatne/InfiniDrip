# EPIC-17 / G04 V03 — Slice 500 Polo contour-loss geometry diagnosis

## Verified start

Started `2026-10-08 14:56:43 UTC` from clean S499 `b999d89b7d6f217c14e8e1be024353e03ee13cb8` on `codex/epic-17-g04`; refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S499
was highest; S500 is reserved. Board revision 3107 records the Epic and
G04-V03 In Progress, V01/V02 Done. Goal is active and matches this work.
Primary usage was 15% and weekly usage 40%.

## Scope

Use only the S498 hash-identified Polo M source, first export and generation-two
export already stored under `C:\G04-CLO-DXF-Exchange\S498-practical-retest`.
Trace the five repeatedly failing CUT contours (back, outer/inner collar
stands, upper/under collar) by source piece/block identity. Identify which
source vertex is absent per generation; measure its distance to the replacement
receiver segment and its local geometric significance; verify whether the
change is stable across generations and compare unaffected contours. Inspect
the exact source/output coordinate sequences and rendered overlay evidence.
Classify only what the geometry proves (for example, near-collinear reduction
versus changed contour); do not infer the importing setting or claim a cause
that cannot be distinguished from these artifacts.

No UI use is planned because S499's CLO window could not be targeted and the
app was still listed as running. No source/pattern geometry, export, threshold,
test, acceptance rule, V03 profile claim or rights/local-handling state changes.
All import/export files remain in their named C: folders; this slice reads
those existing C: artifacts and writes its analysis packet/report in the
repository only.

## Gates

1. Verify the exact source/output SHA-256 values before parsing.
2. Use piece/block and same-role associations from the existing S498 report;
   report all five contours for both generations and retain the fixed 0.001 cm
   threshold.
3. Produce a compact, reviewable missing-vertex and nearest-segment report,
   plus actual geometry overlays for the affected piece contours; distinguish
   direct coordinate facts from any numerical interpretation.
4. No source/receiver changes from a diagnosis alone. If the point is
   shape-critical or evidence cannot determine its semantic role, preserve the
   failure and identify the next controlled receiver experiment.

Focused verification is the hash-pinned analysis script and report assertions,
board validation, and `git diff --check`. No full repository test/coverage/build
gate is due for this documentation/evidence-only slice.

## Board and next action

Start board replay links `E-G04-S500-START`; exit must preserve V03 In Progress
and every gate/hold. No delegation is safe or useful for this deterministic
single-source geometry audit. First action: confirm S498 file hashes and parse
all affected source/output polylines without changing them.
