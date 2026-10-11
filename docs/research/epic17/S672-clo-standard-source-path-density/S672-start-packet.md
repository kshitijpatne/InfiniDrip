# EPIC-17 / G04 V03 — Exact-path density in CLO Standard — Slice 672 start

## Verified start boundary

- Start: 2026-10-10 10:59:07 UTC. Branch `codex/epic-17-g04`, clean at
  commit `c8ed2a7d` (`Slice 671: prepare exact-path CLO fixture`). Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S671 is the highest assigned slice; 672 is unique. Canonical board is
  revision 3984; EPIC-17/G04-V03 remain In Progress, V01/V02 Done.
- CLO 2026.1.310 is running with an existing test document. Native UI access
  is available in this task. The first selection accidentally opened the
  Add-DXF path, whose dialog defaulted to DXF-AAMA. The exact S671 derivative
  was added in memory under that wrong route and the receiver showed its
  informational seam-allowance Custom-mode notice. This is recorded as an
  unscored setup misroute, not as the planned Standard-DXF trial or a V03
  result. No DXF was exported and no file was saved from this action. The
  in-memory trial will be replaced by the planned clean Open/Standard route.
- No approval is pending. The `/2` grainline mapping and all other approved
  design decisions remain settled.

## Single controlled receiver operation

Use the exact S671 C:-only derivative:

`C:\G04-CLO-DXF-Exchange\S671-polo-cut-source-path-density\Input\polo-standard-m-cm-units-header-exact-path-density.dxf`

SHA-256: `487FAD7533BDA83306D3F4FA2DFEF523E469E62F3D808EFF0A9C98A7E38B77F8`.
The S617 source SHA-256 is
`71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`.

Run one **File → Import → DXF** operation (Open, not Add) using the already
recorded S617 settings: File Format `Standard DXF`, Unit `Centimeter`, Scale
100%, Rotation `Do Not Rotate`, Reset Grain Angle `Maintain Original`, Import
Notch to `Both`, Notch Position `Ratio`, Import Draw Curve Points enabled;
pattern annotation, auto-trace, optimize, auto-distribute, and remove
non-grading-points disabled. Save receiver project, settings capture, and
receiver output evidence only under
`C:\G04-CLO-DXF-Exchange\S672-clo-standard-source-path-density\`.

## Required result and fixed stop conditions

Bind the nine source pieces through their exact identity and unchanged SEW
paths. Inspect native CUT/SEW outlines, grainlines, notches, marks and the
actual whole/detail views. Compare all nine CUT and nine SEW paths to the
original source, with no alignment, at the existing `0.001 cm` limit. Retain
the S671 proof that the derivative's represented paths are mathematically
identical to source and that every original source vertex/record is present.
Record all app notices and errors exactly.

Advance to a separately numbered round-trip slice only if the representative
native input passes geometry, source-mark/layer/identity review and readable
output. Export only after that pass. A miss on any fixed gate ends this
candidate test; do not run another format, import setting, encoding, density,
or profile variant. No acceptance, gate, or hold is relaxed. This single
representative test cannot establish seven-recipe/options/grades, full
identity/relations/sidecar, malformed-input, repeatability, or two-way
round-trip acceptance.

## Scope, non-goals and ownership

This is one receiver-evidence slice only. It does not change production code,
pattern geometry, stitch graph, output baseline, thresholds, V02 decisions or
all-seven recipe acceptance. DGS remains retired. CLO menu names are not
standards evidence; if the route qualifies, describe it as the tested
vendor-specific route and make no ANSI/AAMA or ASTM conformance claim. No
physical sampling, fit, factory-acceptance, supplier, spending, or
production-readiness claim.

The stateful receiver interaction and exact-source analysis are coupled; no
safe disjoint delegation is available. Codex owns the operation and evidence
review. Focused verification: exact source/fixture hashes, independent
DXF/scene comparison, rendered whole/detail inspection, relevant script
syntax/checks, Control Center focused suite if its records change, and
`git diff --check`. No changed production code means changed-code coverage is
not applicable. Full repository 100% coverage, integrated build/browser/
Electron/output checks, legacy behavior, and protected export identities are
required once on the settled Epic/PR candidate.

## Slice ledger and exit

- Implementation / receiver interaction: record actual elapsed time at exit.
- Focused verification: record separately at exit.
- External-agent waits: 0 minutes; this receiver operation has no safe
  independent delegation.
- Maintainer-decision time: 0 minutes; no decision is pending.
- Current blockers: V03 candidate qualification gates remain open pending
  this actual CLO Standard result and the later breadth, invalid-input,
  repeatability, identity, marks, round-trip and final integrated gates.
- Next action: execute the one prepared Open/Standard import; inspect and
  measure the receiver result. Gate: export is permitted only after complete
  representative native pass.
