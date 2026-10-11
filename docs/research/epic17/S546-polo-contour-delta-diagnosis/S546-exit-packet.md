# EPIC-17 / G04 V03 — Polo contour delta diagnosis — Slice 546 exit

## Result

S546 reconciled the current S545 Polo M/default output against existing CLO
geometry evidence. It found no basis for another CLO settings trial and did not
change a pattern, acceptance gate, export, or production code.

S545's hash-pinned AAMA gen1 and gen2 report independently confirms the same
five CUT contour roles are above the unchanged `0.001 cm` threshold in both
outputs:

| Source ordinal / piece block | Vertices in → out | Gen1 distance | Gen2 distance |
|---|---:|---:|---:|
| 2 / back `1_M` | 33 → 32 | 0.01274073 cm | 0.01274635 cm |
| 10 / outer collar stand `5_M` | 54 → 53 | 0.01297744 cm | 0.01297639 cm |
| 12 / inner collar stand `6_M` | 54 → 53 | 0.01397421 cm | 0.01398789 cm |
| 14 / upper pointed collar `7_M` | 44 → 43 | 0.01299019 cm | 0.01298914 cm |
| 16 / under pointed collar `8_M` | 44 → 43 | 0.01299893 cm | 0.01299781 cm |

These distances are source-to-output symmetric vertex/path distances, not
gen1-to-gen2 measurements. The near-equal values show the second generation
did not materially worsen the failures. S500's hash-pinned geometry diagnosis
identifies the corresponding omitted points for its S498 pair: back vertex 13
at `(37.489, 74.514) cm`; each collar-family vertex 14 at `y=66.459 cm`.
S517/S519 report the same five point removals for S516/S519 outputs. S545
confirms the same source contour ordinals, blocks, one-vertex reductions and
residual band. S546's new parser did **not** independently establish those
point identities across all historical files, so no stronger cross-run
identity claim is made.

## Failed diagnostic and visual evidence

The S546 analyzer syntax check passed. Its attempted all-profile parse stopped
at S498 ASTM gen1: it selected a cyclic correspondence with a `0.775008 cm`
retained-point error. This contradicts the established S500 analyzer on the
same pinned S498 files, which passes with `0.000013 cm` retained-point error.
The S546 result is therefore rejected as a parser/matcher defect; it is not a
CLO result. The exact error is preserved at
`C:\G04-CLO-DXF-Exchange\S546-polo-contour-delta-diagnosis\Evidence\analysis-attempt.txt`
(SHA-256 `5F99F766F5E99FEB119C7633180F72E0F0AB8FD8CC5E1CF565ABA4B03C724EE6`).
No new JSON/SVG was emitted by the failed analyzer.

S500's rendered source/gen1/gen2 contour overlay remains the validated exact
point-location view. S545's current CLO screenshots show all nine Polo pieces
and retained major outlines in both generations; they are gross visual
evidence, not a substitute for the numeric gate. No S546 screenshot or
import/export file was generated.

## Decision and next action

Do not repeat CLO's already-tested point-preservation controls. S503 tested
curve optimization on/off; S519 tested `Import Draw Curve Points`; and S522
reviewed the current official CLO controls, finding no safe, documented,
untested setting that promises preservation. S518 could not read exact
pre-export contours from CLO's native project, so stage attribution remains
unresolved. The direct, useful conclusion is that the tested CLO AAMA path
does not pass Polo's strict geometry gate; it is not a global statement about
all CLO use or all exchange profiles.

Next: evaluate one concrete alternative apparel-CAD receiver/profile from
primary documentation, checking exact build, applicable rights, local file
handling, geometry semantics and round-trip capability before moving any
fixture. Preserve the existing all-seven, 0.001 cm, semantics, grades, marks,
negative-input, profile and rights gates. G04-V03 remains In Progress; no
claim of industrial compatibility, physical fit, factory acceptance, or
production readiness is made. CLO remains open for the admitted work.

## Verification and time

- Replayed the trusted S500 geometry analyzer against its hash-pinned S498
  inputs: five point removals confirmed, retained sequences within
  `0.000013–0.000038 cm`; its rendered overlay is already checked in.
- Read S517, S519, S522, S536 and S545 evidence; no new CLO setting was
  exercised and no DXF/native project was changed.
- S546's proposed multi-file analyzer: `node --check` passed; execution failed
  the S498 retained-point assertion. The failure is preserved and explicitly
  excluded from conclusions.
- No production code changed. `node --check` passes for the analyzer and replay
  helpers; S546 analyzer execution fails as described above. `npm run
  control-center:test` passes 42/42; board preflight/replay and `git diff
  --check` pass. No full repository test/coverage/build gate applies.
  Board start/exit: `3295→3297→3299`.
- Started `2026-10-08 22:38:29 UTC` from S545 `e9edce65e3d687f84218ca0c4c80ee37b285a70a`;
  refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains
  an ancestor. S546 is unique. Closed `2026-10-08 22:45:52 UTC` (7m23s):
  evidence reconciliation 3m; diagnostic implementation/diagnosis 2m; records,
  board and focused verification 2m23s; external-agent wait 0m; maintainer-
  decision time 0m. No safe independent delegation existed. At the boundary,
  `get_goal` confirms the objective still covers G04 through safe merge and the
  goal status is `active`; it remains needed.
