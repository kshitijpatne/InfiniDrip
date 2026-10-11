# EPIC-17 / G04 V03 — CLO LWPOLYLINE DXF-ASTM import — Slice 636 exit

## Outcome and gate disposition

S636 completed the last source-bounded CLO import matrix cell in the existing
CLO 2026.1.310 (r58944) session. It imported the exact coordinate-identical
nine-CUT-LWPOLYLINE derivative from S635 using CLO's `DXF-ASTM` format. The
original S617 source revision, CUT representation, centimeter units, 100%
scale, no rotation, grain handling, grading/curve/notch settings and geometry
threshold were held fixed; import format was the only changed variable.

CLO returned all nine numeric pattern identities with no native-query errors.
The unchanged `0.001 cm` contour gate gives four exact passes (front, sleeve,
button placket and buttonhole placket) and five failures. Back P13
`(37.489, 74.514)` is absent with a `0.012736 cm` joined-chord deviation.
Outer stand P14 `(139.277, 66.459)` is absent with `0.012983 cm`; inner stand
P14 `(156.921, 66.459)` with `0.013970 cm`; upper collar P14
`(174.564, 66.459)` with `0.012983 cm`; and under collar P14
`(194.164, 66.459)` with `0.012983 cm`. Retained vertices match to less than
`0.000014 cm`. Every failing deviation exceeds the unchanged gate.

The S635/S636 reconciliation uses the same S617 source SHA
`71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`, same
LWPOLYLINE derivative SHA
`606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360`, same
CLO build, numeric piece identity binding, ordered source CUT points, native
comparison algorithm and `0.001 cm` gate. Standard and DXF-ASTM each produce
the same four passes and five failures. The CLO API reports a different total
child-shape count for the button placket (S635 9; S636 6) while its CUT
contour still passes. This is retained as an unexplained native-shape-count
delta; it is not interpreted as a mark or profile result.

The actual CLO 2D overview and five source/native contour-detail PNGs were
rendered, visually inspected and hash-pinned. The detail SVG and PNG renders
use the same 1000×440 Playwright Chromium renderer. The live ASTM settings
dialog was inspected before import. CLO then displayed its informational
notice that this DXF has no seam allowances and is imported in Custom mode to
preserve its original shape. This notice is recorded as receiver behavior,
not an error.

The packet's stop condition is met: no source CUT passes the full gate, so no
DXF export or round-trip was attempted. The CLO LWPOLYLINE × Standard/ASTM
matrix is complete and does not justify further CLO format/settings
permutations for these five contours. This result does not establish CLO's
internal simplification mechanism or normative ASTM conformance. It does not
clear industrial-profile selection, rights, marks, grades/options,
malformed-input, repeatability or readable-output requirements. No V03 hold,
acceptance threshold, board status or physical/factory claim changed. CLO
remains open because V03 work is still active.

## Pinned evidence

All exchange files are under
`C:\G04-CLO-DXF-Exchange\S636-lwpolyline-astm-import\`:

| Artifact | SHA-256 |
|---|---|
| Original S617 source copy | `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5` |
| Imported LWPOLYLINE derivative | `606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360` |
| CLO native project | `E206A23C3158B24751F91664D5749DD01D3834EB31FC45085A7B90337BF9B008` |
| CLO native API query | `9FD7325C408BD2A6E32E12238E70F14AD5659F5C56511D846D589943D719588B` |
| Native contour comparison | `832565017ED363CD7FF2912E4BC102C76ABF3E4F5C78E15B112AFF53FFEE9748` |
| Actual CLO 2D overview | `0BD6FA4B97B755932C786B88AB235140BE94E1890B1EC3C97DA360620652B993` |
| S635/S636 matrix reconciliation | `A4D6820ABBD053AE686C2F999F7D692E705D540054FD3097DFFA6B741B598AB3` |
| Renderer and ten detail-render hashes | `573407773B2546AA2F4E54F5FCDC3AD883958A3BF75FC3113C276CD0806A3103` |

Evidence inventory also pins each of the five SVG and PNG contour crops. The
S636 `Output` directory contains no DXF. There is no exported geometry to
mistake for a round-trip pass.

## Verification and time accounting

- Start: `2026-10-09 20:02:47 UTC`, after committed S635
  `3f3c6b9b4034ac615e03a7c448f127cbc4c9d260`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  Board start replay `3684→3686` preserved V01/V02 Done and V03/EPIC-17 In
  Progress.
- CLO import, save and read-only query used one ASTM import in the one existing
  app session; no reopen or repeat import occurred.
- Analyzer verification: nine identities, four passes, five failures,
  stop-before-export. S635/S636 reconciliation confirms identical CUT results
  at the same source revision and representation. Five SVG and five Chromium
  PNG crops plus the actual CLO overview were hash-pinned and visually
  reviewed. `Output` remains export-free.
- Focused verification: analyzer/reconciler/renderer syntax and source-bound
  assertions, validated board tests, and `git diff --check`. This is
  research/evidence only; no production code changed and production coverage
  does not apply. Full repository coverage/build/browser gates stay on the
  settled integrated Epic/PR candidate.
- Elapsed through the verified pre-commit closeout: `20m15s`
  (`20:02:47–20:23:02 UTC`). Approximate categories: CLO setup/import/query
  and project capture `8m`; geometry analysis, rendering and cross-run
  reconciliation `6m`; focused verification `3m`; durable packet, board and
  state closeout `3m15s`; external-agent waits `0`; maintainer-decision time
  `0`.

## Scope and next action

No application source, pattern geometry, legacy DXF path, protected export
identity, acceptance rule, recipe coverage, status or hold changed. Do not
repeat the completed CLO Standard/ASTM × POLYLINE/LWPOLYLINE CUT matrix or
claim that a file-format menu label proves conformance. Next, use this compact
negative matrix to select one distinct receiver/profile candidate whose
documented industrial exchange path and local rights are supportable, then
design one source-bound import/native/output experiment before making another
exchange. Keep all remaining V03 gates and all V02 holds in force.

No physical-fit, factory-acceptance, normative ASTM-conformance or
production-readiness claim is made.
