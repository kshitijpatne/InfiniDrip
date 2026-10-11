# EPIC-17 / G04 — S730 repository evidence hygiene exit

## Result

S730 removed 6,390 unreferenced generated research/render/diagnostic files
from the repository tree after copying and SHA-256 verifying the entire
6,471-file candidate corpus to
`C:\G04-CAD-Interchange\S730-repository-evidence-hygiene\archive\`.
The candidate corpus was 414,529,553 bytes; removed content was 409,943,310
bytes. The final 81 retained candidate files are the direct-link and dynamic
test inputs required by the current board, repository links, and test harnesses.
No archive copy is missing. The archive manifest SHA-256 is
`3e45def8c8abd08a4f7e1e49dd8c477b058b3c63d57f6b582b09cd1486b78d92`.
An independent Markdown-link scan reports zero moved and zero missing links.
The board evidence URIs were preserved.

Transient `dist`, `dist-electron`, `release`, `tmp/epic9-release`, and the
ignored S425 rendered-output directory were removed from the worktree after
their packaged evidence or all 19 generated S425 outputs were hash-verified
against the C: archive. The packaged release evidence contains 16 files and
685,609 bytes; its manifest is in the archive directory. These paths are
build/test outputs, not required source files. The archive remains outside the
repository on C:.

## Scope and V03 decision

This is repository evidence hygiene only. It does not alter application
behavior, the accepted V03 profile, source geometry, tolerances, acceptance,
fixtures, protected export identities, or release requirements. S726 remains
the approved V03 technical acceptance: 365/365 product-side option-by-grade
packages; ten selected LibreCAD fixtures covering the ten observed serialized
DXF structure classes across seven recipes; and the additional Trouser XL
boundary fixture. The empirical compatibility statement remains limited to
the 11 exact LibreCAD 2.2.1.5 / Drawing Exchange DXF 2000 returns that were
saved, reopened, source-audited, and visually reviewed. It does not claim 315
coordinate signatures were individually round-tripped or make any industrial,
ANSI/AAMA/ASTM, physical-fit, factory-acceptance, or production-readiness
claim. No paid or additional software was acquired, installed, or used.

## Verification

- `npm run coverage`: 158/158 test files and 2,366/2,366 tests pass; the final
  all-files row is 100% statements, branches, functions, and lines. Full log:
  `C:\G04-CAD-Interchange\S730-repository-evidence-hygiene\coverage-full-cleaned-final3.log`.
- The final non-coverage full suite also passes 158 files / 2,366 tests; this
  is recorded separately and is not represented as a coverage run.
- `npm run build` and `npm run electron:pack` pass. Packaged release
  verification reports 72 inventory files, no absolute development paths,
  and no errors; report and packaged evidence are archived on C:.
- Focused suites pass: Control Center 42/42, web release 10/10, and Epic-17
  research 12/12. `git diff --check` and the full Markdown-link scan pass.
- The S728 production Chromium replay remains applicable: later code changes
  are test-timeout-only, and this slice changes no production source. Its
  verified 73-option / 146-face replay, 0 holds/issues/mismatches/browser
  errors, all-layer text audit, and visual review are linked from S728.
- The test-timeout increases are limited to the slow tests identified by
  actual instrumented-run failures. No assertions, worker defaults, global
  timeouts, or coverage thresholds changed.

## Boundary and remaining work

- Start: 2026-10-11 10:27 UTC, commit `0fcf2d0cbd441f6511618668596db5165c8c6319`,
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` (ancestor), board
  revision 4273. Exit: 2026-10-11 12:22 UTC (closeout timestamp; board revision
  is recorded by the validated command layer).
- Duration accounting: implementation/archive/closeout approximately 94 min;
  focused verification approximately 9 min; global coverage 12 min 56 sec;
  external-agent wait 0 min; maintainer decision time 0 min. Total elapsed
  time at this recorded boundary is approximately 116 min. Other than gate
  runtimes, activity durations are estimates because no per-command timer ran.
- Remaining: review the cleaned origin/main diff; commit the single S730 slice;
  push the branch, open and review the PR, pass required checks, merge safely,
  refresh and verify `origin/main` ancestry, confirm any required automatic
  deployment and production end-to-end behavior, then close the Epic and goal
  through the validated workflow.
- No physical sampling, supplier/factory acceptance, standards conformance,
  or production-readiness claim is made.
