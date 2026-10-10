# EPIC-17 / G04 V03 — post-S664 gate refresh — Slice 665 start

## Starting state and scope

- Started `2026-10-10 08:46:17 UTC` from S664 commit
  `f4014d6e9c717718e0f6987e7167762ac9ab60ef`, branch
  `codex/epic-17-g04`; refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S664 is highest
  slice across refs; S665 is reserved. Working tree was clean. Control Center
  board was revision 3884, EPIC-17/G04-V03 In Progress, V01/V02 Done.
- S664 closed the sole approved grainline candidate pilot as failed: DGS
  `VID:20250610` AutoCAD-mode imported 9/9 Polo pieces but reported
  `grainline is outside the border` for all 9. The independent source-bound
  check places all 4,509 grainline samples inside their matching CUT
  contours. No export, retry, or mode/setting variation occurred. See the
  S664 exit packet and C:-only receiver capture/report.
- Scope of S665: reconcile every admitted V03 gate against S649/S660's
  matrices and the actual later S650–S664 source, rights, receiver, UI,
  render, parser and round-trip evidence; use the durable S640 result as
  required. Write current pass/fail/unproven status, strongest evidence,
  correlated cause and exact remaining proof/change per gate. Record one
  short prioritized completion plan with a decisive verification and stop
  condition for each blocker group, explicit receiver/profile status, and a
  current conditional slice estimate. Obtain one bounded read-only high
  reasoning critique of this matrix/plan from the already-used Sol reviewer
  when available; Codex remains sole gate authority.
- This is evidence/plan-only: no CAD operation, new profile trial, source
  change, acceptance change, status transition, or standard-conformance claim.
  Do not repeat formats/settings/entities without the updated plan naming the
  distinct gate and unmet evidence. Preserve all seven recipes/options/grades,
  `0.001 cm`, V02/V03 criteria, legacy DXF behavior, protected byte identities,
  all current holds and final merge/deploy gates.

## Verification and delegation

- Create a new status-neutral matrix/plan which supersedes older conditional
  estimates where the post-S664 evidence changes them. Preserve old matrices
  as history.
- Review official S651 manual text about DXF grainline controls as a specific
  potentially relevant source. It documents broad AutoCAD Pattern/Design
  import choices and separate grainline controls but gives no entity/layer
  rule for this candidate's `LINE` encoding; classify only what its wording
  establishes.
- Use existing fixtures, analyzers, and outcomes. Do not run broad gates.
  Focused verification is packet/matrix/plan assertions, reviewer disposition,
  Control Center tests, validated board replay, and `git diff --check`.
- No coding delegation is safe; this slice is a coupled evidence/status
  reconciliation. A bounded read-only review is a check on the authored plan,
  not authority to choose a profile or mark a gate passed.

## Acceptance and next gate

Acceptance is a complete current matrix and a prioritized route plan that
preserves all admitted requirements and cannot be mistaken for a V03 pass.
V03/EPIC-17 remain In Progress. Full repository tests and 100% global
coverage, integrated build/browser/output review, final output review, PR,
safe merge, `origin/main` ancestry, and any required deployment remain final
Epic gates. No physical-fit, factory-acceptance, or production-readiness claim.
