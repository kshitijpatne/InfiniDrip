# EPIC-17 / G04 V03 — remaining DXF-AAMA recipe trials — Slice 544 start

## Verified start

- Started `2026-10-08 22:09:10 UTC` from clean S543 commit
  `4327d8770baeb462ea7074f13369f5ff230c9bd5` on `codex/epic-17-g04`.
  Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  still an ancestor. Highest assigned slice is S543; reserve unique S544.
- Board revision 3287; G04-V03 In Progress. Goal active. CLO 2026.1.310
  remains open. Written product-development authorization and local handling
  confirmation are settled.

## Objective and scope

Complete the same-menu DXF-AAMA cohort for the three recipes not exported in
that mode yet: Tee, Polo, and Woven. Start from S498's hash-pinned M/default
fixtures and the existing running CLO session. For each source: import with
the S523 AAMA settings, export DXF-AAMA generation 1, re-import that output,
then export generation 2 with S523's settings. Save each input copy,
generation, project/workspace capture, screenshots, and analysis only under
`C:\G04-CLO-DXF-Exchange\S544-aama-three-recipe-roundtrip`.

Source fixtures, all in the existing top-level C: `Input` folder (the S498
packet stores its exchanges in `S498-practical-retest/Output`):

- Tee `Input/tee-standard-m.dxf`,
  SHA-256 `0B6CBA95C9AFD4CC6F17A2171F67303E0891BABB94828816C149767935165FC9`.
- Polo `Input/polo-standard-m.dxf`,
  SHA-256 `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
- Woven `Input/woven-shirt-standard-m.dxf`,
  SHA-256 `9FE52D808EC94A6B8AB86A3B55066B11E6BB1B6AD4BF34E480AE9060165196A5`.

This creates a matching observed DXF-AAMA-menu cohort with S523's Fitted,
Tank, Skirt, and Trouser. It does not qualify AAMA-292A, establish an ASTM
profile, or change V03 acceptance. Do not test new sizes/options here.

## Method and acceptance

- Inspect the current CLO screen and preserve any unsaved state before
  changing it. Keep one live CLO session; do not close/reopen between recipes.
- Use the exact S523 profile: Import DXF-AAMA, centimeters, 100%, no rotation,
  Add/maintain original, curve points enabled, optimization/removal disabled;
  Export DXF-AAMA, Graded Nest, centimeters, 100%, no rotation, selected
  patterns only, duplicate notch on seam allowance checked, other curve,
  bounding-box and baseline exclusions off.
- Verify source/output file hashes and parse every result. Match source CUT and
  SEW outlines to same-piece output by cyclic/reverse vertex matching at the
  unchanged `0.001 cm` gate, preserving counts and reporting every miss,
  extra, ambiguity, duplicate layer, mark and grade fact. Record all actual
  UI notices/errors; inspect rendered import, re-import and output evidence.
- If CLO produces an error, malformed or incomplete file, or loses geometry,
  preserve the output and diagnostics. Do not fix by relaxing tolerances or
  editing source pattern geometry.
- Keep all-seven coverage, exact-profile uncertainty, semantic, grading,
  malformed-input, receiver and rendered gates intact. V03 remains In Progress
  unless every existing criterion actually passes.

## Verification, delegation, and next boundary

This is one stateful cross-recipe CLO operation with shared output formats;
there is no safe disjoint contributor task. Use focused deterministic
geometry/hash analysis, inspect rendered evidence, validate/replay the board
through its command layer, and run the focused Control Center suite. No
production code change is expected; if helper production code is added, add
focused tests and require 100% coverage for changed code. Save the full
repository gate for the settled Epic candidate.

At exit, report implementation/CLO time, focused-verification time,
agent-wait time, and maintainer-decision time separately. Preserve every
failure and select only one evidence-backed next step.
