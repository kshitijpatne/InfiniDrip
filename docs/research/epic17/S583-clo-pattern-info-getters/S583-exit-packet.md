# EPIC-17 / G04 V03 — CLO pattern information getters — Slice 583 exit

## Result

S583 began at 2026-10-09 05:35:27 UTC from S582 commit
`80c6a44a8636ee746b6d965ff3157503a147d0b1` on `codex/epic-17-g04`.
Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained
an ancestor. The start command replay advanced the board 3445→3447; G04-V02
remained Done and G04-V03 In Progress. Goal status was active and aligned to
the admitted EPIC-17 objective.

One run in the already-open CLO 2026.1.310 Python Editor called the two
documented, runtime-present JSON getters on all nine indexed patterns.
`GetPatternInformation(index)` and `GetPatternInputInformation(index)` each
returned a Python string that parsed as JSON for all nine indexes: 18 calls,
zero call or parse errors. No other CLO method, import/export, geometry edit,
project save, or app restart occurred.

`GetPatternInformation` returned only the observed metadata fields `id`,
`isSeamlessBlock`, `isTrimItem`, `itemNo`, `name`, `thumbnail`, and `uuid`;
none are geometry fields. Each `GetPatternInputInformation` object had one
root with `Children Information`, `LineList`, `Pattern index`, `Pattern name`,
and `PointList`. The line and point arrays contained 4–58 indexed records per
pattern (including the fixture's small four-point case); the child-shape
count varied from 3 to 7. The official API list calls these JSON-string
getters but does not define their schema or promise source-layer semantics.

## Geometry comparison and exact limits

The comparison script maps the returned point sequences to the hash-pinned
S574 Polo M source DXF contours. It uses the S574 DXF-AAMA centimeter / 100%
profile's fixed 10 mm per source cm, tests the two possible y-axis signs,
permits cyclic start shifts and forward/reverse traversal, and derives only a
translation from the first vertex. It performs no scale or free rotation fit;
the fixed G04 gate is 0.001 cm = 0.01 mm.

- Eight of the nine CLO indexed point sequences have at least one source
  closed-contour correspondence at the fixed gate. All exact candidates are
  literal source `SEW` contours. Their maximum residual is
  0.0003725365 mm (0.0000372537 cm), below the 0.01 mm gate.
- No returned pattern point sequence matches a literal source `CUT` contour
  within the gate.
- Pattern index 3 returns a 3 mm diamond (points retained in the machine
  report) and has no corresponding source CUT/SEW closed-contour candidate;
  its best same-vertex-count SEW candidate is 158.6473 mm away after the
  permitted translation-only mapping.
- Pattern index 4 is geometrically congruent with two different rectangular
  source SEW contours. Indexes 7 and 8 each are also congruent with both of
  two repeated SEW contours. Shape geometry alone therefore does not establish
  one-to-one physical piece identity for these repeated shapes.
- The matching set spans all nine literal source SEW contour ordinals, but
  because candidate shapes are repeated and translation is allowed, this is
  not a one-to-one nine-pattern identity proof. No layer meaning or pipeline
  stage is inferred from getter names or field labels.

This getter snapshot does not identify whether the current CLO project was at
the original-import or re-import stage, and the public schema has no documented
stage contract. It therefore cannot attribute the previously measured CUT
loss to import, internal representation, or export. It does provide a useful
comparison of exact-build pattern input-information points against the pinned
fixture. It clears no V03 acceptance gate and does not alter any hold or claim.

## Evidence and verification

- S583 raw getter strings and parsed values:
  `C:\G04-CLO-DXF-Exchange\S583-clo-pattern-info-getters\Evidence\pattern-information.json`
  — SHA-256 `FFF4513B122A5EC8099CE00995EF0D15585EABD5985D1BD6CAA10F08DD69F670`.
- Constrained source comparison:
  `C:\G04-CLO-DXF-Exchange\S583-clo-pattern-info-getters\Evidence\source-geometry-comparison.json`
  — SHA-256 `558B82DB0AE24192E8F4F779F9877ECD765C8A8E7FF34ECBA90196950F9CEE50`.
- Live CLO screenshot:
  `C:\G04-CLO-DXF-Exchange\S583-clo-pattern-info-getters\Evidence\clo-s583-run.jpg`
  — SHA-256 `EC7A2B99BCB1AD0307EB226320DCC8A4B4565C7430138314205B32C7D63A7F39`.
- CLO script:
  `C:\G04-CLO-DXF-Exchange\S583-clo-pattern-info-getters\Scripts\read_pattern_information.py`
  — SHA-256 `15559693A96756181AB475862A1E1BDB1C63557A077986D15573B30D7FAA4235`.
- Comparison helper:
  `docs/research/epic17/S583-clo-pattern-info-getters/compare-input-info.mjs`
  — SHA-256 `2F69EF84821F3A290C4796860600195A92C03471423A40DD9E862A5C03522158`.
- Pinned source input SHA-256:
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`.
  The S574 imported derivative SHA-256 is
  `A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675`;
  S574 records that it converts only the nine CUT closed polylines into
  coordinate-preserving connected LINE chains and copies the SEW contours
  unchanged.
- Verification: JSON parsing and exact-nine/two-getter/no-error assertions;
  comparison helper syntax and deterministic report checks; focused Control
  Center tests 42/42; validated exit-board preflight/replay/status checks; and
  `git diff --check`. No production source/tests changed, so the full
  repository coverage/build gate is reserved for the settled PR candidate.
- During analysis, the first comparison-helper run exposed a null-candidate
  handling defect when a returned path had no same-vertex-count source contour.
  The helper was corrected to report that case explicitly and preserve it as
  a non-match; the final run and preflight pass. CLO output and product source
  were unaffected.

## Scope, gates and next action

All-seven V02 remains Done; V03 remains In Progress. Preserve the 0.001 cm
geometry gate, admitted all-seven/representative-fixture criteria, rights- and
profile evidence, malformed-input rejection, CUT/SEW semantics, marks/notches,
grading/options, fine-detail output, protected export byte identities, and
legacy DXF behavior. This evidence supports no exact-format compatibility,
factory, fit, or production-readiness claim. CLO stays open.

S583 confirms the rights and local-handling prerequisites are settled and
closes the bounded API-information survey. Next, use the saved S574
**pre-export imported project** (SHA-256
`43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25`) in the
existing CLO session. Make one read-only `GetPatternInputInformation` capture
before any export, with the matching S574 source fixture and settings. Compare
against S583 and the independent S574 output analysis. This is a stage-isolation
check: it can determine whether the anomalous pattern paths are already present
before export, while still avoiding stage claims beyond what the getter
contract proves. Do not repeat the API survey, change project geometry, alter
the profile/tolerance, or weaken V03 gates. After this one check, return to
direct representative import/export acceptance evidence or close the receiver
candidate on the measured failure.

S583 ended 2026-10-09 05:47:19 UTC (elapsed 11m52s from the recorded start).
Timings: comparison/evidence implementation and analysis 5m40s; focused
verification and output review 3m47s; durable packet/state/board closeout 2m25s;
external-agent waits 0; maintainer-decision time 0. The validated board start
replay is 3445→3447; exit evidence/comment replay is 3447→3449.
