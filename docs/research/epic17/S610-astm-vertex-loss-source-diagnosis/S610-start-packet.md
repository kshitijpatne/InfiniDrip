# EPIC-17 / G04 V03 — ASTM CUT vertex-loss source diagnosis — Slice 610 start

## Verified start

- Started 2026-10-09 11:32:46 UTC on `codex/epic-17-g04` from S609 commit
  `6bead7fe6ad139909f41cadbbf5ff07c72556fde`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. The
  tree was clean after the S609 commit; S609 is highest, so S610 is reserved.
  Canonical board revision is 3570. EPIC-17/G04-V03 remains In Progress and
  G04-V02 remains Done. CLO 2026.1.310 is open and stays open.
- Maintainer has confirmed permission for product-development evaluation and
  local-only DXF handling. No more confirmation or user files are needed.
- S609 materially tested original Polo M AAMA import → CLO DXF-ASTM export →
  same-output ASTM reimport. All nine pieces render and all nine source-SEW
  contours pass, but five of nine CUT outlines fail the unchanged 0.001 cm
  gate and each has one fewer output vertex.

## Objective and bounded method

Determine exactly where and how the five measured Polo M CUT contour changes
occur between the hash-pinned S609 DXF input and its CLO DXF-ASTM output.
Bind by the unchanged source SEW geometry, identify each changed source
vertex and output segment, inspect source/output entity, layer, precision,
and bounding data, and compare these facts with already recorded CLO
import/export settings and previously verified round trips. Search official
or profile-authoritative documentation only for specific mechanisms implicated
by this diff; record what a source can and cannot establish. Keep new derived
files under `C:\G04-CLO-DXF-Exchange\S610-astm-vertex-loss-source-diagnosis\`.

Do not operate CLO again in this slice, change source geometry/writer behavior,
change the exchange profile or export options, weaken the 0.001 cm threshold,
or rerun prior AAMA spline trials. Do not infer CUT semantics from numeric
layer names. End with a prioritized source-backed next practical experiment,
or state exactly why the existing evidence cannot support one. No proposal is
implementation authorization. Preserve all seven-recipe acceptance, every
V03 hold, legacy DXF behavior and protected export byte identities.

## Gates, non-goals, and ownership

- Codex owns this source/output analysis; no safe independent delegation is
  available because it depends on the coupled S609 fixture and geometry
  evidence. No OpenCode/Claude substitution is needed.
- Add a reproducible read-only analyzer and report only if it can bind every
  changed contour unambiguously. Verify hashes, parsed entity identities,
  exact source coordinates and measured output error. Use focused syntax and
  report-preflight checks, board command preflight/replay, Control Center
  tests, and `git diff --check`.
- Do not claim physical fit, factory acceptance, industrial-profile
  conformance, or production readiness.

## Single next action

Analyze the exact S609 source/output pair and the prior already-pinned Polo
fixtures first, then consult only authoritative documentation relevant to the
measured entity transformation. No CLO UI operation occurs unless a subsequent
packet documents a specific supported hypothesis that this analysis directly
identifies.
