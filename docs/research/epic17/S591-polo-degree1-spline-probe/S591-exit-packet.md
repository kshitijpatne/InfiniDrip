# EPIC-17 / G04 V03 — Polo degree-1 SPLINE probe — Slice 591 exit

## Verified boundary

- Started `2026-10-09 07:27:04 UTC` on `codex/epic-17-g04` from S590
  `0ae63b191a8f021f65f33ea331164f27fb652eae`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S591 was the unique next slice. Start board replay `3479→3481`; G04-V02
  remains Done and G04-V03/EPIC-17 remain In Progress.
- CLO 2026.1.310 remained in its existing session. The prior scene was saved
  before starting the empty project at
  `C:\G04-CLO-DXF-Exchange\S591-polo-degree1-spline-probe\Evidence\clo-before-S591.zprj`.
- Maintainer-confirmed written authorization for product-development trial
  use and local file processing is settled. All S591 DXF, project, render and
  analysis files are under the named C: folder. No rights or upload concern
  is reopened.

## Question and exact fixture

S590 mapped five remaining Polo M CUT residuals after its 0.05 cm fillet
candidate failed: back vertex 13 and vertex 14 on each collar piece. S591
tested a distinct exchange-only representation: those five closed outlines
were encoded as planar degree-1 SPLINE entities using each original source
vertex as a control point plus a repeated first point. All other input entity
records and the nine SEW contours were preserved. This expresses the same
piecewise-linear contour mathematically; it does not establish that an apparel
receiver treats this DXF entity as exact piece geometry.

- Original S536 M/default geometry baseline:
  `C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\Input\polo-standard-m-lwpolyline-r2000.dxf`, SHA-256
  `9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2`.
- Imported S591 fixture:
  `C:\G04-CLO-DXF-Exchange\S591-polo-degree1-spline-probe\Input\polo-standard-m-cut-degree1-spline.dxf`, 29,638 bytes, SHA-256
  `06d93e8a5a55a76f52d4c38ee3b9d74ec3309bd8f9a1bdd71de82a7b75dabcca`.
- Source preflight:
  `Evidence\S591-source-preflight.json`; SHA-256
  `665562e1bfdb3e709ac13f1d84887448bd5b1bc510c157314fc9498c913bf3f1`.
  It asserts only the five mapped CUT entities changed, all original control
  coordinates and other entity records stayed identical, and ideal source
  deviation is `0 cm`, below the unchanged `0.001 cm` limit.

## One controlled CLO import, render and export

A clean project received one S591 fixture import using the S536 settings:
Load Type `Open`; File Format `DXF-AAMA`; Unit `Centimeter`; Scale `100%`;
Rotation `Do Not Rotate`; Grain `Maintain Original`; pattern annotation,
autotrace, cut/sew swap, automatic distribution, curve optimization and
removal of non-grading points off; Import Notches on (`Both` / `Ratio`); Import
Draw Curve Points on. CLO displayed the seam-allowance Custom-mode notice and
continued; it did not show a format error. Nine pieces were visible.

One DXF-AAMA export used the S536 settings: `Graded Nest`, centimeters at
100%, `Do Not Rotate`, Duplicate Notch on Seam Allowance on; Export without
Grading, Base Lines or Seam Allowance off; Convert Curve Points, Optimize All
Curve Points and Export Pattern Bounding Box off. Export returned to the
scene without an error dialog. A single 2D snapshot was saved at 127 dpi,
1:1, 100%, no rotation, with the standard line categories selected and no
extra labels or images. The saved one-page PDF and its rendered PNG show all
nine pieces; the large view visibly differs around the affected back and
collar outlines. This is visual presence evidence, not a geometry pass or
fine-mark readability certification. The imported project was saved.

## Measured round-trip result

The hash-pinned output
`C:\G04-CLO-DXF-Exchange\S591-polo-degree1-spline-probe\Output\polo-degree1-spline-clo-aama.dxf`
is 286,238 bytes, SHA-256
`0dfb0829b0037b4754438f44db5dbdc54ac53ac0e8b00f635940280b6a64232e`, DXF
version `AC1009`. It contains nine inserted pieces and 49 block polylines,
including internal paths. Numeric output layer IDs are treated only as path
locators.

The analyzer binds every receiver block by exact cyclic/reverse coordinate
comparison of its unchanged SEW outline, then compares the CUT only inside
that block. It samples straight/bulge paths at no more than `0.0005 cm` and
adds `0.00025 cm` as the conservative sampling allowance. Results against the
unchanged `0.001 cm` gate:

| Piece | SEW max coordinate delta (cm) | CUT sampled max (cm) | Conservative upper bound (cm) | Result |
|---|---:|---:|---:|---|
| Front | 0.000013039 | 0.000007465 | 0.000257465 | Pass |
| Back | 0.000013601 | 13.113647000 | 13.113897000 | **Fail** |
| Sleeve | 0.000013454 | 0.000011180 | 0.000261180 | Pass |
| Button placket | 0.000006708 | 0.000006708 | 0.000256708 | Pass |
| Buttonhole placket | 0.000021213 | 0.000021213 | 0.000271213 | Pass |
| Outer collar stand | 0.000023770 | 0.853005459 | 0.853255459 | **Fail** |
| Inner collar stand | 0.000024352 | 0.841572015 | 0.841822015 | **Fail** |
| Upper pointed collar | 0.000035128 | 0.852992653 | 0.853242653 | **Fail** |
| Under pointed collar | 0.000022204 | 0.852997974 | 0.853247974 | **Fail** |

Thus 9/9 SEW paths and 4/9 CUT paths pass; the five target CUT paths all
still fail. CLO accepted and displayed the spline-based fixture, but its
output polylines do not preserve the five original piecewise-linear CUT
contours within tolerance. The observed back error is much larger than the
collar errors. This report describes the measured import/render/export result;
it does not attribute an undocumented internal cause to CLO. The candidate is
rejected for this build, profile and fixture only. No second-generation
exchange was run.

## Acceptance, remaining gates and non-goals

S591 does not clear G04-V03. The all-seven-recipe requirement, all applicable
options/sizes, stable source piece/revision/size identity, CUT/SEW semantics,
mark and notch retention, malformed-input behavior, useful rendered detail,
and repeated-round-trip gates remain. The CLO build/profile identity is still
narrow evidence, not normative AAMA conformance. No V02 scope, mapping or
acceptance was reopened. Pattern/stitch source, generic or legacy DXF behavior,
protected export identities, acceptance thresholds and production code were
not changed. No physical-fit, factory-acceptance or production-readiness claim
is made.

The next technically distinct low-cost probe is S592: keep the same exact
degree-1 control sequence and all other data, but remove only DXF SPLINE's
closed flag while retaining the repeated first control point. This separates
the explicit-closure interpretation from entity/curve handling. It requires a
fresh preflight and one clean import/export only if the exact geometry proof
passes. If that representation is also rejected or misses tolerance, preserve
the geometry hold and use the measured failures to decide whether a bounded
SPLINE semantics audit or a reviewed scope decision is the next step; do not
generate unbounded encoding variants.

## Evidence and verification

- Source-preflight report: `Evidence\S591-source-preflight.json` (above).
- Round-trip report:
  `Evidence\Analysis\S591-roundtrip-analysis.json`, SHA-256
  `2b2f644e921b66742671c6745bc587a1ae0da42bb2095781392bcc04b845ab2e`.
- Rendered output: `Evidence\clo-spline-import-render.pdf` and
  `Evidence\clo-spline-import-render.png`; PDF SHA-256
  `64506f43d77de3069ae271840058a87ddc02cb463662edfc42ba75d24cda2c69`, PNG
  SHA-256 `a02d9ab4f816ca1f5fcf91e742b10668b50c2d9a6f875a24cf99de371afdd2c0`.
- Saved CLO scene: `Evidence\clo-spline-import-scene.zprj`.
  SHA-256 `a8f5ec69fcaf2c3383e16c5de1f4716448020e6f7683e4e4f25c772b94d82d84`.
- Native CLO output and all input files remain in the C: exchange folder; no
  CAD binary artifact is committed.
- Focused preflight and analysis source: `build-preflight.mjs` and
  `analyze-roundtrip.mjs`. Source preflight passes with derivative SHA-256
  `06d93e8a5a55a76f52d4c38ee3b9d74ec3309bd8f9a1bdd71de82a7b75dabcca`.
  Both scripts pass `node --check`; the round-trip analysis reproduces the
  pinned 9/9 SEW, 4/9 CUT results. The sampled analysis took 55.91 seconds.
- Board exit commands passed a cloned-board `applyBoardCommand` preflight and
  were replayed through the validated CLI at revision `3481→3485`. The Epic,
  V02 and V03 statuses remain In Progress, Done and In Progress respectively.
  `npm run control-center:test` passes 42/42. The first run before board-summary
  replay failed two stale description assertions; updating the canonical Epic
  summary with all retained V02/history summary clauses resolved them. The
  final focused suite passes. `git diff --check` passes; no production code or
  protected baseline changed.
- No production code changed; changed-production-code coverage is not
  applicable. Record Control Center tests, board command preflight/replay,
  schema validation and `git diff --check` in the final boundary below.

## Slice time accounting and final boundary

- Start `2026-10-09 07:27:04 UTC`; starting commit S590 above.
- Implementation/preflight/CLO interaction and durable artifacts: about
  17 minutes within the 23-minute slice interval.
- Focused verification/analysis: about 6 minutes including analyzer wall time
  `55.91 s`, source and board preflights, command replay, 42/42 Control Center
  tests and `git diff --check`.
- External-agent wait: `0` (no safe disjoint task).
- Maintainer-decision time: `0` (the only required rights/handling decision
  was already explicitly settled).
- Board start revision `3481`; verified exit revision `3485`.
- The requested goal audit at this normal boundary returned status `active`;
  its objective still matches the admitted Epic through safe merge. No goal
  status or wording change is needed, and no manual UI resume is needed.
- S591 landed as commit `f8c45b1a83dfc8052120710a505f1bc69ab9b8e7`
  (`Slice 591: probe Polo degree-one spline transfer`). Before S592 start,
  refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was verified
  as an ancestor. S592 proceeded from that verified boundary.
