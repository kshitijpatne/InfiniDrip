# EPIC-17 / G04 V03 — Slice 498 live CLO practical retest

## Result

S498 used the already-running CLO 2026.1.310 (r58944) window and completed
fresh DXF-AAMA imports, DXF-ASTM exports, ASTM reimports, second-generation
exports, geometry analysis, a malformed-file negative control, and separate
Tee XS/M/XL imports. Every exchange input/output and screenshot is beneath
`C:\G04-CLO-DXF-Exchange\S498-practical-retest` (source fixtures remain in
the sibling `Input` directory). CLO was exited through File → Quit after the
last scenario; a subsequent window query returned “foreground window did not
report a process id,” indicating the process/window had closed.

This is mixed practical evidence, not V03 acceptance. Tee and Woven M geometry
survive the measured round trips at the existing 0.001 cm threshold; Polo's
five CUT contour failures reproduce; CLO accepts the deliberately malformed
negative control without an error or warning; and size samples were imported
as separate files, so native graded-nest behavior is unproven. DXF-ASTM UI
labels, AC1009 headers, and geometry matches do not establish an industrial
exchange profile, unit declaration, semantic layer/mark mapping, rights, or
local-only data handling. All existing V03 gates and holds remain.

## Start and scope

Started `2026-10-08 14:20:55 UTC` from clean S497 `586fcf3` on
`codex/epic-17-g04`; refreshed `origin/main` is
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S497 was highest;
S498 is unique. Start board revisions `3095→3097`; G04-V03 remained In
Progress and V01/V02 Done. The maintainer directed practical CLO operation,
required all exchange files on C: in the named S498 folder, and requested CLO
close once no longer needed. No design/pattern source, account, rights,
security, driver, network, ACL, cloud upload, CLO-SET, or CONNECT changes.

The tested profile was the CLO UI's DXF-AAMA import and DXF-ASTM export,
centimeters, 100%, no rotation, maintain original grain, and import notches to
both at ratio. CLO displayed a seam-allowance informational notice on source
imports and ASTM reimports: imported seam allowances were preserved in Custom
mode. It did not prevent the observed imports. No warning/error appeared for
the malformed fixture.

## Per-recipe outcomes

### Tee M

- Source: `C:\G04-CLO-DXF-Exchange\Input\tee-standard-m.dxf`, 6,750 bytes,
  SHA-256 `0B6CBA95C9AFD4CC6F17A2171F67303E0891BABB94828816C149767935165FC9`.
- First ASTM export: `Output\tee-standard-m-s498-clo-export.dxf`, 67,181
  bytes, SHA-256 `E94D81E5A7429F39AA8B8731F2E02CD4B03537829BECCD47BA0B60475AC0E281`.
- Second generation: `Output\tee-standard-m-s498-generation-2.dxf`, 67,183
  bytes, SHA-256 `BAFAA58763486D1BBD6346C4B6467D59524A21E5572799789D2AE5E74E254912`.
- Six source CUT/SEW outlines map to same-piece output contours within
  0.001 cm; maximum best coordinate delta `0.0000160001 cm`. Output contains
  three unrotated/unit-scale piece INSERTs and 24 closed polylines. The same
  source CUT contours coincide with multiple numeric layers and SEW contours
  also have numeric duplicates; semantic layer meaning remains unproven.
- CLO reimport displayed three pieces and the seam-allowance notice. See
  `Evidence\tee-roundtrip-analysis.json`, `tee-imported-workspace.jpg`,
  `tee-reimport-seam-allowance-notice.jpg`, and export-profile screenshots.

### Polo M

- Source: `Input\polo-standard-m.dxf`, 24,261 bytes, SHA-256
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
- First export: `Output\polo-standard-m-s498-clo-export.dxf`, 221,652 bytes,
  SHA-256 `523DBD2D7F2E1E6440A1DEFF254EFA1137B1BF37BB0C9070DA6681144594722C`.
- Second generation: `Output\polo-standard-m-s498-generation-2.dxf`, 221,654
  bytes, SHA-256 `2A878FA0D00D289CF733718DEBC77B755C2E033B9834E53B1A9E76D948F0A0F8`.
- The source-to-output diagnostic reproduced all five failing CUT contours
  after each generation. Independent point-to-exact-segment witnesses exceed
  the 0.001 cm gate by lower bounds `0.01019–0.01119 cm`; output contours
  remove one vertex on each failing source contour. No threshold or fixture
  changed. This independently reproduces the earlier 13/18 result.
- See `Evidence\polo-contour-diagnosis.json`,
  `Evidence\generation2\polo-contour-diagnosis.json`, their SVG overlays,
  and the UI import/reimport/export captures.

### Woven M

- Source: `Input\woven-shirt-standard-m.dxf`, 14,923 bytes, SHA-256
  `9FE52D808EC94A6B8AB86A3B55066B11E6BB1B6AD4BF34E480AE9060165196A5`.
- First export: `Output\woven-shirt-standard-m-s498-clo-export.dxf`, 140,096
  bytes, SHA-256 `B25416C5E083DB97BE0CB23818276415603AC40FFC113168A9AE7323B817084F`.
- Second generation: `Output\woven-shirt-standard-m-s498-generation-2.dxf`,
  140,098 bytes, SHA-256
  `DC1518364EAEA8C2CAD4C5A6355B2A9E987DF56875D208E9CF2DF2FC746E48D5`.
- All 24 source outlines match first and second generation within 0.001 cm;
  maximum `0.000074 cm`. All 114 same-block/same-layer contours match between
  generations, maximum `0.000031 cm`. Exports contain 12 piece blocks and 12
  inserts; all 114 polylines persist (96 closed, 18 open). Both are AC1009 and
  omit `$INSUNITS`; numeric layer meanings remain unproven.
- See `Evidence\woven-roundtrip-analysis.json`, CLO workspace captures,
  informational warning captures, and export-profile screenshots. No S498
  native Woven project or 1:1 output snapshot was saved.

## Negative input and sizes

The copied malformed control
`Input\negative-truncated-group-value.dxf` (6,746 bytes, SHA-256
`89C01B3DCE1424E9D6655A7D7383543EDDD4C070B801726DFE91BCF0832CBC24`)
is generated from the Tee M fixture by replacing its terminal pair `0 / EOF`
with a lone terminal group code `0`; the negative file ends `0 / ENDSEC / 0`,
so its final group code has no value. S502 corrected the earlier incomplete
description that only mentioned a missing EOF marker. CLO imported this exact
malformed input using DXF-AAMA settings with no error/warning dialog and
rendered three Tee piece outlines. This fails the S463 negative-control rule
requiring rejection or an explicit report of an unmatched group code. The
observation does not reveal whether CLO ignored, discarded, or repaired the
trailing code, and makes no claim about other malformed DXFs. Captures:
`Evidence\negative-import-profile.jpg` and
`Evidence\negative-import-workspace.jpg`.

Separate Tee XS/M/XL fixture files were each imported at 100% cm, no rotation.
All displayed three pieces without an error. Captures are
`Evidence\tee-grade-xs-imported.jpg`, `tee-grade-m-imported.jpg`, and
`tee-grade-xl-imported.jpg`, plus M/XL profile captures. These are separately
authored size fixtures, not a single graded file; they do not exercise native
nesting, grade increments, or grade-rule preservation. Their exact input
  hashes are XS `565D1413ECF213900017F96A3F6E3E5B3686C511CAC2B644CDDE0878141FC030`,
  M `0B6CBA95C9AFD4CC6F17A2171F67303E0891BABB94828816C149767935165FC9`, and
  XL `B4DAED074B1E261A4D20CB00A186D6D723F1D08D554E44A3F3774AFF5A06D9B3`.

## Gate disposition

- **Observed technical subset:** Tee and Woven M contours survive the two
  measured generations within threshold; Polo remains a measured failure.
- **Observed negative-control failure:** the terminal unmatched group code is
  accepted and rendered without explicit error/warning. See the S502
  correction and primary DXF structure references in
  `../S502-negative-dxf-validity-check/S502-exit-packet.md`.
- **Not established:** a documented industrial exchange profile, header unit
  declaration, semantically correct layer/mark transfer, native graded-nest
  fidelity, receiver rights for this profile/use, local-only processing, or
  an independent receiver. Trial use was explicitly authorized for these
  practical tests but is not a rights/data-handling attestation.
- **V03 remains In Progress.** Do not claim exact ASTM/AAMA compatibility,
  interoperability acceptance, physical fit, factory acceptance, or
  production readiness. V02 is unchanged (V01/V02 Done); no V03 acceptance
  criteria or all-seven-recipe gates were relaxed.
- **Full Epic gates:** repository coverage, build, browser/Electron integration,
  protected export identity, and final output review remain due on the settled
  integrated Epic candidate. This evidence-only retest is not that candidate.

## Verification and elapsed time

Fresh analyzer runs verified the Tee and Woven output hashes, DXF structure,
piece associations, polyline multiplicities, and coordinate thresholds; Polo
generation-one and generation-two reports were inspected separately. UI
screenshots document import/export profiles, notices, and rendered pieces.
Three separate grade files and the malformed control were exercised in the
real CLO UI. Control Center validation and `git diff --check` are recorded by
the exit replay. No full repository tests or coverage run applies to this
evidence-only slice.

Elapsed estimate, `14:20:55–14:45 UTC`: implementation `0m`; focused
verification/CLO interaction and geometry analysis `20m`; durable evidence,
board, and state update `4m`; external-agent waits `0m`; maintainer-decision
time `0m`. This includes UI orchestration and screenshot capture, not only
machine execution time.

**Next:** retain V03 In Progress and use the concrete negative-control and
Polo geometry failures to choose the next bounded investigation. Do not spend
another slice repeating already-settled Tee/Woven M round trips. Any later
receiver/profile acceptance still requires documented rights/local handling,
semantic marks/layers, grade behavior, and independent evidence under the
unchanged G04 V03 gates.
