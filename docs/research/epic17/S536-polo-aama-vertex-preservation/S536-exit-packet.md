# EPIC-17 / G04 V03 — Polo AAMA vertex-preservation probe — Slice 536 exit

## Result

The geometry-identical R2000 `LWPOLYLINE` input did **not** clear the five
known Polo CUT-outline failures. CLO 2026.1.310 (r58944) imported and rendered
all nine pieces, exported the file as DXF-AAMA without a format error, and
preserved all nine source SEW contours within `0.000005–0.000035 cm`. Its
first-generation export still removes one vertex from the CUT outlines of
back, outer collar stand, inner collar stand, upper pointed collar, and under
pointed collar. The measured symmetric sampled distance to the nearest CUT
geometry in each SEW-associated piece block is `0.012741–0.013974 cm`, above
the unchanged `0.001 cm` gate. Four of nine CUT outlines pass; five fail.

This attributes the failure to the tested CLO AAMA exchange path even when all
18 source contours are encoded as R2000 lightweight polylines. The source
fixture and prior `POLYLINE` trial have identical path coordinates and layers;
this slice changes only the entity encoding and `$INSUNITS` declaration. The
result does not identify which CLO stage performs the simplification, and it
does not justify changing cut geometry, protected export bytes, or the
acceptance threshold.

## Fixture, receiver, and observed settings

- Original fixture: S516 Polo standard M, `24,261` bytes,
  SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- Diagnostic derivative: `15,640` bytes, SHA-256
  `9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2`;
  AC1015/R2000, `$INSUNITS=4`, 18 closed `LWPOLYLINE` contours, nine each
  labelled `CUT` and `SEW`. Preflight asserted all 18 coordinate sequences,
  closure flags, and source layer identities were preserved exactly.
- CLO import: DXF-AAMA, centimeters, 100%, no rotation, maintain original
  grain; import notches to both at ratio; Import Draw Curve Points checked;
  curve optimization and non-grading-point removal off.
- CLO export: DXF-AAMA, graded nest, centimeters, 100%, no rotation; duplicate
  notch on seam allowance checked; export-without-grading/baselines/seam-
  allowance, curve conversion/optimization, and bounding-box options off.
- CLO showed its informational notice that there are no seam allowances and
  the pieces were imported in Custom mode. No format error was shown. All nine
  pieces and visible internal marks appear in the saved rendered capture at
  `C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\Evidence\clo-import-render.jpg`.
- Output: `148,008` bytes, SHA-256
  `06ede87a504a38b21f7af3529a16ebb064768c14def1ec59287c6ced354ef4de`,
  AC1009/R12, nine inserts, 47 block polylines. DXF numeric output layers are
  recorded without assigning cut/sew manufacturing meaning.

## Geometry evidence and limits

`prepare-lwpolyline-variant.mjs` asserts the exact geometry-preserving input
transformation and writes its C:-only preflight. `analyze-clo-export.mjs`
hash-pins that derivative, binds each source SEW outline to one receiver block
by exact cyclic/reverse coordinate match, then compares each CUT outline only
within its associated block. Where point counts match it uses exact cyclic
coordinate delta. Where they differ it records a symmetric sampled distance
at a maximum `0.0025 cm` step against exact straight output segments, along
with a violating sample and receiver segment. The source contours have zero
bulges. Results and hashes are in
`C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\Evidence\Analysis\clo-export-analysis.json`.

| Piece | CUT vertices in → out | Measured distance | Gate |
|---|---:|---:|---|
| Front | 33 → 33 | 0.000007 cm | Pass |
| Back | 33 → 32 | 0.012741 cm | Fail |
| Sleeve | 31 → 31 | 0.000011 cm | Pass |
| Button placket | 4 → 4 | 0.000007 cm | Pass |
| Buttonhole placket | 4 → 4 | 0.000021 cm | Pass |
| Outer collar stand | 54 → 53 | 0.012977 cm | Fail |
| Inner collar stand | 54 → 53 | 0.013974 cm | Fail |
| Upper pointed collar | 44 → 43 | 0.012990 cm | Fail |
| Under pointed collar | 44 → 43 | 0.012999 cm | Fail |

This was one first-generation export, not a second-generation round trip. The
strict geometry gate already fails on five contours, so re-importing the same
known-failing output would not establish profile acceptance. This slice does
not prove full CLO/AAMA conformance, all-seven recipe coverage, multi-size
grade, complete notch/artwork/mark semantics, industrial profile compatibility,
physical fit, or factory acceptance. Maintainer attestation of written trial
and handling confirmation is recorded; no independent legal review is claimed.

## Gate disposition and next action

- **Passed:** authorized local test; exact source identity; exact coordinate-
  preserving encoding derivative; DXF-AAMA import and export in the existing
  CLO session; nine rendered/imported pieces; nine source SEW associations;
  four of nine CUT contours within `0.001 cm`; no format error.
- **Failed:** Polo M first-generation CUT geometry, five contours outside
  `0.001 cm`, including the same affected roles already observed with legacy
  `POLYLINE` input. The R2000 `LWPOLYLINE` encoding is not a fix.
- **Unchanged:** V03 all-seven representative fixture, round-trip, industrial
  profile evidence, grading, mark/layer semantics, and receiver qualification
  gates. V01/V02 Done; V03 and EPIC-17 In Progress. All export identity and
  legacy DXF protections remain.
- **Next:** choose one evidence-backed V03 path that can meet the all-seven
  import/export and semantic gates. Do not repeat this encoding or the already
  failed Polo AAMA→ASTM path. CLO remains open for the admitted goal; do not
  close it until the CLO exchange work is complete.

## Verification and time ledger

- `node prepare-lwpolyline-variant.mjs`: passed exact source-hash, 18-outline,
  layer, closure, and coordinate equality assertions.
- `node analyze-clo-export.mjs`: passed fixture/output hashes, nine SEW piece
  associations, zero-bulge assumptions, and contour comparisons; `4/9` CUT
  contours pass, `5/9` fail.
- `node --check analyze-clo-export.mjs` and `git diff --check`: passed.
- Focused Control Center tests: `42/42` passed. Exit command preflight passed
  at `3257→3259`, then the validated command layer recorded the evidence and
  comment at those revisions; EPIC-17/G04-V03 remains In Progress.
- No production source/test code changed. Changed-code coverage and the full
  repository gate are not due on this evidence-only slice; the full gate stays
  reserved for the settled integrated Epic/PR candidate.
- Focused Control Center tests and validated board replay are recorded with
  board revisions in the closeout below.
- Started `2026-10-08 21:17:40 UTC` from S535 `ff953649e37efc307e41cc568099f68b39425438`
  on `codex/epic-17-g04`; refreshed `origin/main` was
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S536 is unique.
  Start/exit board revisions `3255→3257→3259`. Approximate elapsed time:
  fixture preparation and CLO import/export/render `5m`; output analysis and
  rendered review `4m`; durable closeout and focused verification `3m30s`;
  external-agent wait `0m`; maintainer-decision time `0m`.
