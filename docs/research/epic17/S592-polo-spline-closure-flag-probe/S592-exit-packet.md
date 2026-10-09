# EPIC-17 / G04 V03 — Polo SPLINE closure-flag probe — Slice 592 exit

## Verified boundary

- Started 2026-10-09 07:51:42 UTC on `codex/epic-17-g04` from S591
  `f8c45b1a83dfc8052120710a505f1bc69ab9b8e7`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S592 is unique. Validated start board replay was `3485→3487`; G04-V02 stayed
  Done and G04-V03/EPIC-17 stayed In Progress.
- The maintainer's written product-development trial and local-processing
  authorization remains settled. All DXF, CLO project, PDF/PNG and analysis
  files are under `C:\\G04-CLO-DXF-Exchange\\S592-polo-spline-closure-flag-probe`.
  The already-running CLO session remains open.
- At S592 closeout, refreshed `origin/main` remains
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the verified
  starting commit. S592 is still the unique next slice; commit and ancestry
  verification are completed immediately after the packet closeout.
- The goal audit at this safe boundary returns `active`; its objective still
  matches the admitted EPIC-17 objective through verified merge. No resume or
  goal wording/status change is needed.

## Isolated fixture change and proof

S592 tested only whether the DXF SPLINE closed bit affected the measured S591
failure. Starting from the hash-pinned S591 fixture, the five target Polo M
CUT SPLINE entities changed group 70 from 25 to 24. The repeated first control
point, degree, knots, coordinates, all SEW outlines and every other DXF pair
were retained. The derivative has SHA-256
`e6da8d63056848a2c010ab141dce577cf834b7738155684b4e3a7dcaa1849ce3`;
`S592-source-preflight.json` is hash-pinned at
`ccfc6754f3224c72d0294dd68b459277f4e0f354ddf985960c9896f0918f3c20`.
The preflight proves that only five group-70 pairs changed, all original
control and knot pairs were preserved, and source-side deviation is exactly
0 cm, below the unchanged 0.001 cm limit.

## One CLO import, render and export

One clean CLO 2026.1.310 scene imported the S592 derivative using the pinned
DXF-AAMA settings: Open; centimeters; 100%; Do Not Rotate; Maintain Original
grain; import notches Both/Ratio and draw curve points on; optional annotation,
autotrace, cut/sew swap, auto-distribution and curve optimization off. CLO
displayed nine pieces and the usual seam-allowance Custom-mode notice, but no
format error. The saved one-page 2D snapshot shows all nine pieces; the tested
back and collar outlines are visibly present. It is presence/render evidence,
not geometry acceptance or a fine-mark audit.

One export used DXF-AAMA, Graded Nest, centimeters, 100%, Do Not Rotate, and
Duplicate Notch on Seam Allowance on. Export without grading, base lines or
seam allowance; Convert Curve Points; Optimize All Curve Points; and Export
Pattern Bounding Box were off. Output is 220,075 bytes, DXF `AC1009`, with 9
INSERTs and 47 block polylines including internal paths; SHA-256
`f96e7388de85d02c60b391c45b0465eaeca482a6ff1dc22e68c5ba166f29adc7`.

## Measured round-trip result

The analyzer binds each receiver block to its unchanged source SEW contour by
exact cyclic/reverse coordinates, then compares CUT only inside that block.
Line/arc paths are sampled no more than 0.0005 cm apart; the reported
conservative bound adds 0.00025 cm. The fixed acceptance limit remains
0.001 cm.

| Piece | SEW maximum coordinate delta (cm) | CUT maximum bound (cm) | Result |
|---|---:|---:|---|
| Front | 0.000013039 | 0.000257465 | Pass |
| Back | 0.000013601 | 4.063040000 | **Fail** |
| Sleeve | 0.000013454 | 0.000261180 | Pass |
| Button placket | 0.000006708 | 0.000256708 | Pass |
| Buttonhole placket | 0.000021213 | 0.000271213 | Pass |
| Outer collar stand | 0.000022561 | 0.467174347 | **Fail** |
| Inner collar stand | 0.000023345 | 0.467258409 | **Fail** |
| Upper pointed collar | 0.000035128 | 0.159214023 | **Fail** |
| Under pointed collar | 0.000022204 | 0.159193055 | **Fail** |

Thus 9/9 SEW and 4/9 CUT contours pass; all four failing CUT paths are the
back/collar SPLINE targets. Relative to S591, removing the closed bit reduces
the measured back error from 13.113897 to 4.063040 cm and collar bounds from
0.841822–0.853255 to 0.159193–0.467258 cm. It materially changes this output,
but does not meet the gate. These observations do not establish CLO's internal
SPLINE interpretation or a general CLO/DXF result. The open-flag candidate is
rejected for this fixture, build and profile only. No second-generation import
was run.

## Acceptance and next action

S592 clears no V03 gate. Preserve the all-seven requirement; V02 remains Done;
all identity, CUT/SEW semantics, marks/notches, grade/options, malformed-input,
useful-detail and repeated-round-trip gates remain open. Do not carry either
degree-1 SPLINE variant into product code or claim exact compatibility from
the successful CLO file operations. No source geometry, stitch graph, legacy
DXF behavior, protected export identity, threshold, or production code
changed. No physical-fit, factory-acceptance, normative AAMA-conformance or
production-readiness claim is made.

Next: S593 should be an output-topology diagnosis using the already recorded
S591/S592 source and CLO files: map every receiver CUT candidate, not just the
nearest contour, to source segment/vertex neighborhoods and determine whether
the residuals are localized or indicate a different contour topology. Do not
make another encoding change or CLO trial unless that diagnosis yields one
specific, source-exact hypothesis with a bounded preflight. Retain the Polo
geometry hold and all other V03 gates meanwhile.

## Evidence and verification

- Source fixture: `C:\\G04-CLO-DXF-Exchange\\S592-polo-spline-closure-flag-probe\\Input\\polo-standard-m-cut-degree1-spline-open-flag.dxf`, SHA-256
  `e6da8d63056848a2c010ab141dce577cf834b7738155684b4e3a7dcaa1849ce3`.
- CLO output: `...\\Output\\polo-spline-open-flag-clo-aama.dxf`, SHA-256
  `f96e7388de85d02c60b391c45b0465eaeca482a6ff1dc22e68c5ba166f29adc7`.
- Analyzer: `Evidence/Analysis/S592-roundtrip-analysis.json`, SHA-256
  `a16f193cbf5ecd64cac1db8083923a3816436d5364f3a9f12124820f857559e5`.
- Render: `Evidence/clo-spline-open-flag-import-render.pdf`, SHA-256
  `bd9aac6a2dd881a243cc063c38a4f359ee4b77176397945ab4d8a99cb2b2b575`;
  rendered PNG SHA-256
  `7d959453261c199a2d50e1b8b0ebe6308138f62be9a1c731b7409d6bc2385a10`.
- Native scene: `Evidence/clo-spline-open-flag-import-scene.zprj`, SHA-256
  `e92e3f4af3fc91c779ad6a51cdc50e28e23c13a7760a5af9c85c35f0d0dd96e0`.
- Focused verification passed: `node --check` on all five S592 JavaScript
  scripts; board-command clone preflight at `3487→3491`; validated CLI replay
  at `3487→3491`; board status/schema check; `npm run control-center:test`
  (`42/42`); and `git diff --check`. One initial round-trip analyzer run
  correctly failed its hash assertion because the expected preflight hash was
  entered uppercase while the script computes lowercase; the expected literal
  was normalized, then the analyzer passed and emitted the pinned report. No
  production source or tests changed, so changed-production-code coverage is
  not applicable. Full repository coverage/build remains for the integrated
  Epic/PR candidate.

## Time accounting

- Start: 2026-10-09 07:51:42 UTC. At 08:02:06 UTC the elapsed time is 10 minutes
  24 seconds: implementation and CLO interaction about 4 minutes; round-trip
  analysis and rendered review about 2 minutes; documentation, board
  validation/replay, goal audit and focused suite about 4 minutes.
- External-agent wait: 0. Maintainer-decision time: 0; all relevant trial and
  handling authority was already settled.
- Validated board exit replay is `3487→3491`; V02 remains Done and
  V03/EPIC-17 remain In Progress. The S591 commit and refreshed origin/main
  ancestry were verified before continuing.
