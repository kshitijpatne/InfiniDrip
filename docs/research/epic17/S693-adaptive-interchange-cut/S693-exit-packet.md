# EPIC-17 / G04 V03 — S693 exit: adaptive interchange cut candidate

## Result

S693 implements a new DXF interchange-package geometry revision,
`adaptive-normal-offset/1` under manifest schema
`infinidrip.g04.dxf-package/3`. It offsets each source edge by its configured
allowance; cubic offsets subdivide adaptively using quarter, midpoint and
three-quarter flatness checks with a maximum parameter span of 1/64. It trims
the established inner offset loops, rejects invalid allowances, degenerate
tangents, non-finite/unbounded joins, nonconvergent curves and point-limit
overflow. The algorithm name and exact DXF bytes are bound into the package
revision.

No source pattern edge, measurement, option, sew graph, allowance value, legacy
`exportDxf` body, protected baseline or acceptance criterion changed. Schema
version 2 remains verifiable; new package creation uses version 3. This is a
candidate-side source correction, not an industrial profile or a receiver
pass.

## Evidence and verification

- The focused DXF/package/export tests pass **46/46**. Package test matrices
  cover all seven registered recipes, every registered grade row and all 73
  canonical supported option cases. The new test verifies the retained Polo
  neckline offset at 899 dense source parameters before the inner-loop trim,
  detects the trimmed S692 cusp loop, checks mixed allowances, collinear joins,
  invalid input, miter limits, point ceilings and nonconvergence, and verifies
  legacy schema-2 package reading.
- Focused coverage for every changed production module is **100% statements,
  branches, functions and lines**. The coverage run selected changed-area tests
  to avoid instrumenting the large 73-case matrix; the full normal matrix ran
  separately and passed. One initial instrumented matrix run hit its 15 s
  timeout because instrumentation slowed each matrix test to about 15.6 s; no
  runner default was changed.
- `npx tsc --noEmit` passes. The existing export/byte-identity suites pass;
  no DXF baseline moved.
- The actual generated Polo STANDARD_M, size M candidate DXF was parsed and
  rendered beside its legacy DXF at whole-pattern and back-neckline detail.
  Nine CUT paths and nine SEW paths render. The sewn outlines are unchanged;
  the red candidate CUT contour tracks the old gray contour except where the
  old fixed sampler formed the cusp step. The actual output has 531/448/489
  CUT vertices on its first three pieces versus legacy 33/33/31. The visual
  output showed no seam/piece join crossings at whole-pattern scale; the cusp
  detail shows the smoothly sampled cut curve beside the unchanged sewn curve.
- Candidate file and rendered evidence remain outside the repository under
  `C:\G04-CAD-Interchange\S693-adaptive-cut-review\` (respecting the C:-only
  interchange-file rule). Candidate DXF SHA-256:
  `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`;
  manifest package revision:
  `cc0e1c5f111b2485ffdc7fafac60820f654d6bd541620fff47af51e747a3846d`.
  Render report SHA-256:
  `2c9181e0d7df977a4bd534e4b38483a960eef632e6b11cd0a8459083f22d5754`;
  whole-pattern PNG SHA-256:
  `265002a93f626c04d267e079e2596d4814fb96afd32a99965bee11d1f34f41aa`;
  detail PNG SHA-256:
  `66d2369f598573890a825862a7ebf641ed79ae93e669340f5e903878e4c284a9`.

## Gate status and next action

This removes the current source-backed candidate geometry defect from the V03
work queue. It does **not** by itself prove CLO or any other receiver accepts
the new paths. Independent profile eligibility, rights/use record, marks,
piece/revision identity, malformed-input rejection, repeatability, readability
and exact receiver-side all-seven/73-option/grade behavior remain unproven or
failed according to the S691 matrix and earlier evidence.

Next, use the already-installed CLO 2026.1.310 and the exact prior Standard-DXF
route/fixture once with the updated version-3 Polo M candidate, solely to
measure whether the five-cut-vertex gate is repaired. Do not change import
mode, unit setting, format, encoding or fixture. Keep all files in the existing
named C: evidence area. Stop on any source CUT miss or warning. This is a
candidate-specific diagnosis; even a clean geometry result does not pass CLO's
other measured mark/identity/negative/readability issues or make an industrial
profile claim. Use the actual result to choose the next smallest gate-bearing
step; no new app installation or supplier contact.

The Control Center remains G04-V03 Blocked, EPIC-17 In Progress, V01/V02 Done;
the goal remains active. No acceptance change, cleanup, physical-fit,
factory-acceptance, standards-conformance or production-readiness claim.

## Start/exit accounting

- Started 2026-10-10 22:01:56 UTC from clean S692 commit
  `146b60a9d0961e8cfb76be58637cb53efcaf14e4`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S693 was unique after S692. Board was revision 4106; start replay 4107.
- Board exit replay reached revision 4109; `E-G04-S693-EXIT` is linked and
  the closeout comment is recorded. G04-V03 remains Blocked, EPIC-17 remains
  In Progress, and V01/V02 remain Done. No dependency, threshold, protected
  identity or V02 hold changed.
- Approximate elapsed time to validated board exit: 21m38s. Algorithm/design,
  implementation and tests: 12m; focused tests/coverage/typecheck and rendered
  review: 7m; durable reconciliation, Control Center test and board closeout:
  2m38s; external wait: 0; maintainer decision: 0.
- No full repository suite/build gate is due until the settled integrated
  Epic/PR candidate. The only full-repository gate attempted during S693 was
  not run; the 15 s timeout was on the explicitly scoped instrumented package
  test invocation, which then passed in the isolated 100%-coverage run.
