# EPIC-17 / G04 V03 — CLO Standard DXF import-mode trial — Slice 612 start

## Verified start

- Started 2026-10-09 11:43:51 UTC on `codex/epic-17-g04` from S611 commit
  `c2b24705a53a02663e9c5073151b4b7150200be0`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; tree
  is clean. S611 is highest, so S612 is reserved. Board revision is 3578;
  G04-V02 is Done and G04-V03/EPIC-17 are In Progress.
- CLO 2026.1.310 remains open from S609; preserve the existing session/window
  and keep it open. Written permission for this local CLO DXF evaluation and
  local-only file handling is confirmed. All trial files stay under
  `C:\G04-CLO-DXF-Exchange\S612-clo-standard-dxf-import-mode\`.

## Objective and controlled method

Test one variable that official CLO documentation exposes: import the exact
hash-pinned S609 Polo M source using **Standard DXF** instead of **AAMA**.
Hold unit, scale, rotation, grain, notch, point-optimization, removal,
grading, seam-allowance, and export settings to S609. Export once as
DXF-ASTM / Graded Nest / centimeters / 100% / Do Not Rotate with the same
options, reimport that exact output in ASTM, and measure all nine CUT and nine
SEW source contours at the unchanged `0.001 cm` gate. Inspect a rendered
snapshot. This can isolate whether choosing the AAMA import-mode selector is
necessary for the same vertex loss; it cannot qualify a full profile or prove
all-seven coverage.

Do not alter source geometry, product code, pattern topology, grading,
thresholds, protected export identities, or acceptance criteria. If Standard
mode cannot import the file, loses piece/mark/scale semantics, or produces an
ambiguous dialog, capture it, retain the hold, and stop the test. Do not toggle
additional settings in this slice. Do not save over any source or previous
project. No physical/factory/production claim.

## Verification and ownership

- Codex owns coupled UI interaction and source-bound analysis; no independent
  delegation is safe. Import/export/render operations remain in the one
  authorized CLO session. No app restart or close.
- Hash-pin source and output, record actual dialog choices and notices, compare
  by source-bound piece geometry, preserve a render, verify with focused
  analyzer/preflight, Control Center suite, board preflight/replay and
  `git diff --check`.
- Preserve all V03 holds, all-seven criteria, legacy DXF behavior and
  protected export identities.

## Single next action

Using the existing identified CLO session, run the one Standard DXF import
mode with other S609 input/export settings fixed, then measure and inspect the
ASTM reimported output. Do not start a second import if the first path is
ambiguous or fails.
