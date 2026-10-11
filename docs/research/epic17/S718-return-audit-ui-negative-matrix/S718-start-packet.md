# EPIC-17 / G04 V03 — S718 return-audit UI negative matrix

## Verified start

- Start: 2026-10-11 03:38 UTC from S717 commit
  `d89c3805` (`Slice 717: exercise real DXF audit UI path`) on
  `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor; S718 is uniquely reserved after S717.
- Canonical board revision is 4199. EPIC-17 and G04-V03 remain In Progress;
  V01 and V02 are Done. The two pre-existing untracked S700 coverage
  diagnostics remain untouched.
- S717 proves a real package pass and actual missing-units/tampered-source
  failures through the live panel. Existing return-auditor tests cover more
  malformed receiver cases, but those cases have not all been routed through
  the actual panel and displayed as fail-closed UI outcomes.

## Objective and acceptance

Use the existing generated Polo M package and existing return-auditor
failure shapes to verify that malformed or misleading returned files show the
auditor's exact failure reason in an accessible alert and never show partial
success counts. Cover representative failures for malformed DXF, missing
piece identity, wrong semantic layer, non-finite geometry, and a contour
deviation beyond the fixed tolerance. Compare each displayed result to the
real auditor result; do not mock the auditor.

This is a test-only slice. No source package, threshold, receiver/profile,
pattern, product behavior, output, option/grade acceptance, or legacy export
may change. No additional CAD application, mode, format, setting, or encoding
trial is allowed. Keep all other V03 gates open until independently proved.

## Verification and ownership

- Codex owns one test file and its evidence. No independent low-risk work is
  identified.
- Run the focused UI suite with 100% statement/branch/function/line coverage
  for the panel module, `git diff --check`, and the Control Center suite after
  validated board updates. No full repository gate is due until the settled
  integrated Epic/PR candidate.
- Close only if every selected failure renders the real auditor's reason as
  `role="alert"` with no piece/outline/mark summary. If a mutation passes or
  yields ambiguous output, preserve the evidence and fix the test/product
  path within scope before closeout.

## Time accounting

At exit, separately record implementation, focused verification, external
waits, and maintainer-decision time. No external wait or maintainer input is
planned.
