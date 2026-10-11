# EPIC-17 / G04 V03 — CLO native-stage isolation — Slice 518 start

## Objective and boundary

Run one targeted CLO experiment to determine whether the S516 contour point
loss exists immediately after DXF import or appears only after DXF export.
Use the pinned Polo M AAMA fixture, the existing import settings, and the
already-open CLO 2026.1.310 process. Save a CLO native project immediately
after import and before any export; inspect that saved artifact for exact
outline data. Export once as AAMA only if a safe parser exposes those exact
pre-export outlines, so the comparison can attribute import- versus
export-stage point loss.

Keep all fixture, native-project, export, analysis, and capture files within
`C:\\G04-CLO-DXF-Exchange\\S518-clo-native-stage-isolation\\`. Do not
close/reopen CLO, upload to CLO-SET/CONNECT, change account/trial state, alter
pattern geometry, change the tolerance, or change protected export baselines.
Do not add more formats, option cells, scales, or recipes. If the native
project does not expose measurable outline geometry with a safe local parser,
stop after preserving the file and evidence; do not use visual guesses or
repeat the DXF cycle.

## Verification and gates

- Reconfirm the input hash; record the visible CLO import settings and the
  native project destination; prove the project was saved before export.
- Determine whether its stored cut outline contains or omits the five
  identified source points. If parseable, compare exact points to source and
  S516 receiver segments; then perform one export and analyze only the same
  five affected paths plus role/block identity.
- If it is not parseable, record the actual container structure and the
  pattern payload that prevents exact measurement. Do not claim an
  import/export stage based on the rendered screenshot alone, and do not run
  an export that cannot distinguish the already-observed combined transform.
- V03 all-seven, 0.001 cm fidelity, grading, marks/layers, negative-control,
  rights/profile, representative round-trip and industrial-conformance gates
  remain unchanged. No production implementation is authorized by this slice.
- Use focused analysis and board tests; no full repository gate applies to
  this evidence-only diagnostic. Require all files remain in the named C:
  folder and leave CLO open after the trial because G04 still needs it.

## Verified experiment result

- CLO remained in the existing 2026.1.310 (r58944) session; no relaunch or
  close occurred. The pinned source SHA-256 was rechecked as
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- The visible import dialog showed DXF-AAMA, centimeters, 100%, Do Not Rotate,
  Maintain Original grain, Import Notch to Both, Ratio position; the other
  import options remained unchecked. CLO imported and rendered all nine
  pieces. It displayed its informational seam-allowance/Custom-mode notice,
  not a format error.
- Before any DXF export, CLO saved
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Projects\polo-aama-pre-export.zprj`
  (2,335,872 bytes; SHA-256
  `2ca9169c472ec8201ddd43284b4ff5a900a740ecfeb21c5009b08a51ff896547`).
  The imported-pattern screen is preserved at
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Evidence\01-imported-pattern-native-project.jpg`.
- A new focused parser verified the native file's 25,180-byte CLO-prefixed
  header, its 15-entry embedded ZIP index, and nested ZIP indexes in the
  `.zpac`, `.vmp`, `.vlp`, and `.vrp` members, including size and CRC checks.
  The garment archive's main `.pac` payload is a 3,815,032-byte proprietary
  binary record. The available safe parser found no directly usable contour
  records; the five known source coordinates were not present as text or
  little-endian float32/float64 signatures. This is a bounded parser result,
  not proof that the proprietary payload contains no geometry.
- Per the stop rule, no second DXF export was run: without measurable
  pre-export outlines it would repeat S516's failing combined import/export
  transform without attributing the point loss. Import-time versus
  export-time simplification therefore remains unresolved; no fix is claimed.
- The reproducible inspector and JSON report are
  `docs/research/epic17/S518-clo-native-stage-isolation/inspect-clo-native-project.mjs`
  and
  `C:\G04-CLO-DXF-Exchange\S518-clo-native-stage-isolation\Evidence\Analysis\s518-native-project-inspection.json`.
  All exchange and capture artifacts remain under the named C: folder.

## Verified start and reservation

- Started `2026-10-08 18:23:45 UTC` from clean S517 commit
  `28f55942fc0315167e6ab5ea37441e74b3723776` on `codex/epic-17-g04`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Active branch and
  origin history show S517 is the highest assigned slice; S518 is reserved.
- Board revision is 3183; EPIC-17/G04-V03 In Progress; V01/V02 Done. Primary
  usage is 59%; ordinary usage is available.

## Exit evidence

Record import and native-save confirmation, exact file identity, whether
stored outlines were accessible, pre-export point checks if possible, single
export hash/result, focused tests, board revision, and any limit. Distinguish
UI operation from geometry-fidelity and rights/profile acceptance. No
independent low-risk task is separated from this one-fixture stage diagnosis;
Codex retains ownership.
