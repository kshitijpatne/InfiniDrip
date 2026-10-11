# EPIC-17 / G04 V03 — S690 exit: LibreCAD DXF 2000 unit check

## Result

The one planned LibreCAD 2.2.1.5 Save As test passed its measured Polo M
geometry, units, marks, and semantic-layer checks. This is a **single-fixture
generic-CAD observation**, not a qualified industrial apparel profile and not
a standards-conformance claim. G04-V03 and EPIC-17 remain In Progress; V03
acceptance and all-seven coverage are unchanged.

The unchanged S671 source fixture was copied to the S690 C: Input folder with
SHA-256
`487fad7533bda83306d3f4fa2dfef523e469e62f3d808eff0a9c98a7e38b77f8`.
LibreCAD's Save As selector explicitly offered **Drawing Exchange DXF 2000**;
the one saved output is AC1015 with `$INSUNITS=5` (centimeters), 78,610 bytes,
SHA-256
`11ea44a7fa6f88a53990d056b69fbeca6ab18a47f52e93434afd676860b20b1a`.
All source, output, comparison, and rendered files are confined to
`C:\G04-LibreCAD-Exchange\S690-librecad-r2000-unit-check\`.

## Measured gates for this fixture

| Check | Result | Evidence |
|---|---|---|
| Units | Passed | Source and output both AC1015 / `$INSUNITS=5`; output self-declares centimeters. |
| CUT/SEW geometry | Passed | 18/18 paths; exact vertex and closure correspondence, maximum coordinate residual 0.000 cm and bulge residual 0, within 0.001 cm. Source `POLYLINE` records are represented as equivalent output `LWPOLYLINE` records. |
| Typed marks | Passed | 38/38 `LINE`/`POINT`/`CIRCLE` marks matched one-to-one with zero coordinate/radius residual. |
| Semantic layers | Passed | All eight source layer names match the output. |
| Clean re-open | Passed | After saving, the drawing was closed and the exact saved output was opened from disk in LibreCAD with no warning dialog. |
| Render observation | Passed, limited | Overall and magnified views show the contours and mark glyphs. This does not establish apparel-workroom readability. |
| Piece/revision/grade identity | Unproven | The tested fixture has no identity payload or companion sidecar. |
| All seven recipes, options, and grades | Unproven | One Polo M configuration only. |
| Malformed-input rejection | Unproven | Not tested. |
| Repeatability | Unproven | One import/export generation only; the clean re-open is not a second export. |
| Full readable-output requirement | Unproven | A generic CAD render of one fixture cannot prove complete labels, identity, and option-wide readability. |
| Industrial profile qualification | Unproven | LibreCAD is generic 2D CAD. Identify the route precisely as the empirical LibreCAD 2.2.1.5 / DXF 2000 test; make no ANSI/AAMA/ASTM claim. |

Full machine-readable comparison: `C:\G04-LibreCAD-Exchange\S690-librecad-r2000-unit-check\Evidence\Analysis\librecad-r2000-roundtrip.json`.
The copied analyzer is in the same C: Analysis folder. LibreCAD rendered
captures are in the C: `Evidence\Rendered` folder (`roundtrip-r2000-overall.jpg`
and `roundtrip-r2000-detail.jpg`). The 11 validated start/exit board command
inputs are also retained under the C: `Evidence\BoardCommands` folder, outside
the project tree.

The validated board moved from revision 4078 at slice start through 4084 for
the start evidence and to 4089 for this exit. EPIC-17/G04-V03 remain In
Progress; V01/V02 remain Done.

## Verification note

The existing S674 comparator initially recognized legacy `POLYLINE` only and
reported no output contours; its mark count consequently included the 18
`LWPOLYLINE` paths. Inspection of the exact saved DXF showed LibreCAD changed
the entity representation while retaining contour topology. The C:-only copy
of that comparator was extended to parse `LWPOLYLINE` vertices, bulges, and
closure flags and to keep them out of the typed-mark set. Re-running against
the same unchanged source/output hashes yielded the passes above. This was a
verification-parser correction, not an output repair or production-code
change.

No pattern geometry, DXF writer behavior, export baseline, protected bytes,
acceptance threshold, or V03 criterion changed. No physical fit, factory
acceptance, or production-readiness claim is made.

## Next action

At S691, reconcile every V03 gate against the refreshed source, receiver
output, rendered evidence, and S690 result; write a short prioritized plan
with one decisive proof and stop condition per blocker group; and obtain the
already requested bounded read-only Sol high-reasoning review. Do that before
reserving another receiver experiment. The immediate question is whether the
measured generic LibreCAD/DXF 2000 route can credibly cover the admitted
identity, grades/options, malformed-input, repeatability, readable-output,
rights, and industrial-profile requirements without a new candidate or a
scope change.

## Slice accounting

- Production implementation: 0 minutes; no product source changed.
- Receiver interaction and rendered review: approximately 4 minutes.
- Focused parser/output verification: approximately 2 minutes, including
  diagnosis and correction of the entity-type mismatch in the copied
  comparator.
- Durable packet/state/board work and focused verification: approximately
  3 minutes. `npm run control-center:test` passes 42/42. Its first run exposed
  eight stale expectations that V03 was Blocked; only those current-board
  status assertions were updated to In Progress, and the focused suite then
  passed. `git diff --check` passes.
- External-agent wait: 0 minutes for S690.
- Maintainer-decision time: 0 minutes; no decision was requested.
