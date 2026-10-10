# EPIC-17 / G04 V03 — S695 start packet: localize S694 Polo CUT differences

## Verified start and reserved slice

- Start: 2026-10-10 22:38:09 UTC.
- Branch/worktree: `codex/epic-17-g04`,
  `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- Clean start commit: S694 `ee132a30da9df569da09db6f91902c38fa32f408`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. Highest assigned slice across refs is 694; reserve S695.
- Canonical board revision 4113: EPIC-17 In Progress, V01/V02 Done,
  G04-V03 Blocked. The active goal's objective and status match the admitted
  EPIC; it remains active and is not modified.
- Current usage check: primary window 12% used, weekly window 29% used.

## Exact scope

Read-only comparison of the exact S693 Polo STANDARD_M size-M centimeter DXF
and exact S694 CLO Standard DXF return. Pin both hashes before analysis. Extract
the nine CUT and nine SEW paths by the existing source inventory/fixture
mapping; compare emitted source vertices and segments with the returned block
paths at all seven measured CUT maxima, focusing on source index 182 / y=
75.791 cm in outer stand, inner stand, upper collar and under collar. Inspect
the candidate-generation code that produced those exact paths and distinguish
source candidate approximation/serialization from a change made by the
receiver. Preserve ordered point sequences, joins, closure, multiplicity and
piece mapping in a machine-readable report and annotated detail views.

All temporary parsers, reports and images remain under
`C:\G04-CAD-Interchange\S694-clo-candidate-cuts\S695-localization\`.
The S693 input and S694 return remain immutable. No CLO operation, app/mode/
format/setting/fixture variation, production-code edit, cut-pattern edit, test
threshold change, or V03 acceptance change is in scope.

## Acceptance and stops

- Prove whether the 0.001 cm residuals already exist in the submitted S693
  candidate relative to its intended source cut locus, or arise only in the
  receiver return. Do not infer cause from vertex counts or a nearest-point
  residual alone.
- Account for all seven measured CUT maxima and the four shared stand/collar
  index-182 stations; confirm the passing SEW/placket paths remain comparison
  controls.
- Trace any proposed repair to a precise code path and explain why it preserves
  the same physical cut locus and exact source shape. If evidence cannot
  distinguish the causes, report the unresolved evidence precisely and make
  no code change. If CLO changed an exact submitted locus, retire this route
  without a compensating shape distortion.
- Preserve all V03 criteria, all-seven/73-option/grade requirements, protected
  exports, legacy DXF behavior, and V01/V02 acceptance. No standards claim or
  physical/factory claim.

## Files and verification

- Exact source: `C:\G04-CAD-Interchange\S693-adaptive-cut-review\candidate.dxf`,
  SHA-256 `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`.
- Exact receiver return:
  `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\polo-adaptive-clo-standard-return.dxf`,
  SHA-256 `1fe2683a27e87afffd3686b174a3c9fd9189077562e101e003f24a128347ce89`.
- Fixed comparator and detailed per-piece results:
  `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\S694-roundtrip-comparison.json`.
- Product-source implementation to inspect: `src/export/adaptive-cut.ts`,
  `src/export/dxf-interchange-package.ts`, `src/export/dxf-centimeters.ts`,
  and the exact S693 tests/exit packet. No code edits are authorized by this
  diagnostic scope.
- Required checks: verify artifact hashes; run deterministic path/segment
  comparisons and inspect the actual source/return detail rendering; run
  focused source-inspection tooling checks and `git diff --check`. No changed
  production code means changed-code coverage is not applicable. Do not run
  the full repository gate before the settled integrated candidate.

## Decisions, delegation, and next boundary

No maintainer decision is pending. This read-only diagnosis is coupled to the
same source and exact return; no independent low-risk, disjoint delegated work
is available. Codex owns it. At exit, update the durable evidence and board
through the validated command layer, record time buckets, and choose exactly
one evidence-backed next action. Keep the goal active.
