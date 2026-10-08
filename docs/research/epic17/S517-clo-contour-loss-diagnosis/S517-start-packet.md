# EPIC-17 / G04 V03 — CLO contour-loss diagnosis — Slice 517 start

## Objective and boundary

Identify exactly what the five measured S516 CUT-contour deviations represent
in the pinned source and exported DXF, and establish which stage is supported
by available evidence. Reuse the S516 report/analyzer and the copied input and
output already confined to
`C:\\G04-CLO-DXF-Exchange\\S516-clo-aama-roundtrip\\`; inspect relevant DXF
writer/read-path behavior in the repository only as needed to distinguish
source geometry, encoding precision, and receiver behavior.

Do not reopen CLO, re-import/export the same fixture, change a CLO preference,
edit garment source/stitch topology, relax the 0.001 cm tolerance, alter
protected export identities, or claim a cause the source/output cannot prove.
No production implementation is admitted by this diagnostic slice. If the
available evidence cannot locate the loss to a specific stage or establish a
documented corrective control, record that limit and propose one targeted next
experiment rather than another broad matrix.

## Scope and gates

- Bind the five source CUT roles to their exact receiver candidate paths and
  vertices/segments; quantify source vertex-to-output distances and identify
  the local shape change. Check all other roles for parsing/mapping evidence.
- Check DXF coordinate resolution/units and the application settings already
  recorded in S516. Compare with prior S503 analyzer evidence only to identify
  what is stable across cases, not to claim the exporter/importer stage where
  information was lost.
- Keep V03 acceptance unchanged: rights-cleared industrial receiver/profile,
  all seven supported recipes, profile-specific representative round trips,
  cut/sew/marks/grades/layers, negative control, and required render/output
  evidence. V01/V02, legacy DXF behavior, protected export identities, and
  physical-claim boundaries remain intact.
- Use focused analyzer replay/assertions and validated board commands; run the
  Control Center suite for this board-only/evidence-only slice. No global
  coverage/build/Electron gate applies without production changes.

## Verified start and reservation

- Started `2026-10-08 18:17:16 UTC` from clean S516 commit
  `890e09a8058db7b23181212ed145addf3f466283` on `codex/epic-17-g04`.
- Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Active history
  confirms S516 was the highest assigned number; S517 is reserved.
- Board revision is 3179; EPIC-17 and G04-V03 remain In Progress, V01/V02
  Done. Primary usage is 58%; ordinary usage is available.

## Exit evidence

Record the exact contour/vertex mapping and measured distances, findings about
precision and possible stage attribution, focused check outputs, board
revision, risks/unknowns, and one bounded next action. No independent,
low-risk delegation is separated from this source/output comparison; Codex
retains ownership. CLO remains open but idle for this slice.
