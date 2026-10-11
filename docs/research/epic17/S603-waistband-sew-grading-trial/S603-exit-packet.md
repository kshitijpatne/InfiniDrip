# EPIC-17 / G04 V03 — waistband sewn-line grading trial — Slice 603 exit

- Closed: 2026-10-09 10:17 UTC.
- Started: 2026-10-09 10:05:22 UTC from S602 commit
  `b351fc82eeeca90e7158dd26f44013c272e9e0b7` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Board start revision: 3542; S603 start evidence replayed through
  the validated command layer at revisions 3543–3544.
- CLO 2026.1.310 (r58944) stayed in its existing running process. Product-
  development use and local-only exchange handling were confirmed in writing.
  All working files and the rendered capture are confined to
  `C:\G04-CLO-DXF-Exchange\S603-waistband-sew-grading-trial\`.

## Trial and finding

Opened the byte-verified copy of S565's disposable project
`C:\G04-CLO-DXF-Exchange\S603-waistband-sew-grading-trial\s603-waistband-workcopy.zprj`
(SHA-256 `CD2D620B42148A21E800F6D7DD6183757955B2BEC19FD745BB86FDCD3D3B8423`).
The original S601 output-side project and the S565 source fixtures were not
opened for writing or overwritten.

The visible waistband is a long rectangular piece with a smaller, inset
four-sided internal path. Its relative shape is consistent with the source
waistband CUT and SEW contours. In Edit Grading, clicks at the apparent
internal-path top endpoints did not establish that CLO had selected those
internal segment points. The grading property table instead exposed a selected
point with `20.0 mm` X and `0.0 mm` Y at every size step (XS→S, S→M, M→L,
L→XL). The required source-derived SEW deltas at those stations are respectively
`(+20,+15) mm` and `(+40,+15) mm`. The UI did not identify the selected path
or point semantically, and the highlighted outline is consistent with a CUT
point. Therefore this observation is ambiguous; it is not evidence that the
SEW path was selected or graded.

**Fail-closed result:** no grade values were entered, no CLO project was saved,
and no DXF was exported or re-imported. The five-size CUT/SEW contour comparison
and rendered re-import could not run. The trial does not pass and clears no
grading, receiver-profile, round-trip, or all-seven V03 gate. Preserve the
`0.001 cm` contour threshold, all-seven-recipe coverage, V02-before-V03 order,
legacy DXF behavior, and protected export identities.

## Rendered evidence and verification

- Actual CLO view with Edit Grading active and the selected grading values:
  `C:\G04-CLO-DXF-Exchange\S603-waistband-sew-grading-trial\s603-ambiguous-internal-grade-selection.jpg`
  (132,231 bytes; SHA-256
  `2ca92f80cfecaa22168bf6aa0089a79e9bb14b0d10395b0cbeed8f50cafb8956`).
- Source coordinate and size-step table: S567 exit packet,
  `docs/research/epic17/S567-clo-dxf-grade-guidance/S567-exit-packet.md`.
- CLO GUI confirmed version 2026.1.310 (r58944). No format/import/export error
  occurred because exchange was stopped before export. No source pattern,
  stitch graph, product source, test, export baseline, or acceptance rule changed.
- Focused closeout: validate this packet and the S603 board replay; run the
  Control Center test suite and `git diff --check`. No production code changed,
  so no changed-code coverage or full-repository gate is due.

## Exit and next action

- V02 remains Done; V03 and EPIC-17 remain In Progress. All seven-recipe V02
  acceptance and every outstanding V03 gate remain unchanged.
- Next: at S604, refresh the V03 gate matrix and choose a distinct, evidence-
  capable remaining gate. Do not repeat the S603 selection trial unless a
  trustworthy UI method can distinguish the sewn path's segment points from
  the CUT contour before any grading input.
- Timing estimate: CLO load/inspection, selection and capture 9m; focused
  verification/closeout 3m; external-agent waits 0m; maintainer-decision time
  0m.
