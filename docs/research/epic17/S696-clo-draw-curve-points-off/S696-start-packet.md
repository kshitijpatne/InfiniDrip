# EPIC-17 / G04 V03 — S696 controlled CLO import option check

## Start and verified state

- Started 2026-10-10 22:48:54 UTC on `codex/epic-17-g04` at S695 commit
  `54897bee`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  is an ancestor. Highest assigned slice is 695; reserve S696.
- Canonical Control Center board is revision 4117, EPIC-17 In Progress,
  V01/V02 Done, G04-V03 Blocked. Board start evidence will be recorded through
  its validated command layer. The goal record is active and matches the
  admitted EPIC objective; it remains active.
- Usage at start: primary 14% used, weekly 29% used.
- CLO 2026.1.310 is already open. Current screen shows an existing nine-piece
  Polo-like layout and no import dialog. Its file/source is not assumed. Keep
  this session open; preserve its state to the C: task folder before using a
  clean project for the controlled import.

## Exact one-variable check

Use only the exact existing candidate
`C:\G04-CAD-Interchange\S693-adaptive-cut-review\candidate.dxf`, SHA-256
`7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`.
Import it once into a fresh CLO project in the already-open session. Use the
same Standard DXF path/build, millimeter scale, 100% scale, no rotation,
original grain angle and notch position ratio as S694. Keep all other import
settings observed in S694, changing only **Import Draw Curve Points** from
enabled to disabled. Visually verify the setting before importing and save
the dialog capture when possible. Do not make another setting/encoding/file
variation.

Export once using S694's same Standard DXF / graded-nest / millimeter / 100% /
no-rotation selections. Save every input, returned file, session copy,
capture and render only under
`C:\G04-CAD-Interchange\S696-clo-draw-curve-points-off\`. Compare returned
units, all nine CUT and SEW contours, marks, identity, joins and piece count
against the exact source at the unchanged `0.001 cm` gate, and render/inspect
the actual returned output at whole-pattern and relevant close-up scales.

## Scope and stop condition

- This is a single receiver diagnostic, not a product source or DXF exporter
  change. No cut geometry, pattern, tolerance, export baseline, legacy DXF
  behavior, protected identity, or V03 acceptance changes.
- If any contour exceeds `0.001 cm`, any piece/mark is missing or misplaced,
  a warning appears, or rendered output is unreadable/misleading, record the
  exact failure and retire CLO Standard from further experiments. Do not
  compensate by altering the source outline.
- Even if the representative fixture passes, V03 remains unaccepted pending
  rights/profile, identity/sidecar, seven-recipe and supported-option/grade,
  malformed-input, repeatability, and readable-output gates. No ANSI/AAMA or
  ASTM conformance claim; no physical-fit, factory-acceptance or production-
  readiness claim.
- No UI redesign, new recipe, physical sampling, supplier contact, hosted
  service, launch spend, or untracked CAD evidence in the repository.

## Verification, handoff and next action

- No independent contributor is assigned: controlling one desktop session and
  comparing a hash-pinned output is coupled work; parallel work would add risk.
- Focused review uses the existing S694 comparator and S695 source/output
  localization reports. Save the raw receiver output and rendered review
  outside the repository on C:.
- At closeout, record the actual setting evidence, hashes, per-piece/mark
  results, rendered review, focused verification, board revisions, separate
  elapsed-time categories and the next evidence gate in the exit packet,
  `PROJECT-STATE.md`, `CONTEXT-INDEX.md` and canonical board.
- Next action: perform this one visually verified import-setting check, then
  reconcile its actual result against the fixed V03 gate matrix.
\n