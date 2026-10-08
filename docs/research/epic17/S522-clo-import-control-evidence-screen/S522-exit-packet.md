# EPIC-17 / G04 V03 — CLO import-control evidence screen — Slice 522 exit

## Finding

The current official CLO import/export guide exposes no new safe, documented
point-preservation control for the measured S519 failure:

- `Optimize All Curve Points` changes the curve point count. S503 already
  compared the import optimization on and off; both retained the same failure.
- `Import Draw Curve Points` was the vendor-suggested new control tested once
  in S519. The imported pieces rendered without an application error, but the
  same five Polo M CUT vertices remained lost beyond the unchanged gate.
- `Remove Non-Grading Points` explicitly deletes points without grading
  information. The hash-pinned input is generic, ungraded DXF with no native
  grade relationship. This option is counter-indicated as a point-retention
  remedy and is not tested.
- The guide also describes `Auto-Trace as Internal Line`, which converts a
  baseline to an internal line rather than preserving a cut contour;
  `Convert to Seam Allowance`, removed from the menu in 2026.1; and
  `Convert Curve Point to Straight Point (AI Only)`, limited to Illustrator
  imports. None is a justified fix for these old-style DXF CUT polylines.
- Export-side `Optimize All Curve Points` is also documented; it changes
  curve-point count. S503/S516/S519 did not show a safe point-retention path,
  and the failure stage remains unresolved because the CLO native payload was
  not measurable in S518.

The source has 18 old-style `POLYLINE` and 610 `VERTEX` entities, without
`SPLINE`, `LWPOLYLINE`, or native grade data. S517 measured one omitted point
on each of five CUT paths, with shortcut deviations of `0.0127407–0.0139742
cm`; all other source points on those paths are within `0.000024 cm`. S519's
actual `Import Draw Curve Points` trial preserved the same failure against the
`0.001 cm` gate. Those results establish a real failure for the tested
Polo AAMA path, not general CLO incompatibility.

## Decision and next action

No CLO application was opened or closed, and no DXF or native project was
read/written. The current help-page review identifies no new safe UI trial.
Do not toggle `Remove Non-Grading Points` to chase the missing geometry. Keep
the CLO session as the user left it. Further CLO trials need a genuinely new
source-backed encoding/profile/build mechanism and rights evidence for the
intended receiver use; otherwise use a distinct rights-reviewed apparel-CAD
receiver. S521's LibreCAD candidate remains generic-only and is not pursued as
a substitute for the industrial apparel-profile gate.

The following G04/V03 requirements are still incomplete and unchanged:

- no rights-cleared exact receiver/build and local file-handling basis;
- no documented industrial apparel exchange profile selected;
- Polo's five CUT contours fail the strict fidelity threshold on the tested
  CLO path;
- receiver-specific layer/mark semantics, native size/grade relationships,
  negative-input rejection, and generation-two behavior across representative
  fixtures are not all accepted;
- V03 remains In Progress. V01/V02 remain Done; the all-seven V02 gate,
  legacy DXF behavior, protected export byte identities, and physical/factory
  claim boundaries are preserved.

No product code, test, pattern geometry, exporter behavior, threshold, or
output identity changed.

## Verification and closeout

- Official CLO guide reviewed at its current 2026-09-28 update; source lines
  55–69 list import controls and explain `Remove Non-Grading Points`, while
  lines 79–93 list export controls. The page does not promise exact vertex
  preservation.
- Cross-checked the recorded settings/results in S503, S517, and S519 and
  verified the source-entity facts in the S519 packet.
- Board start/exit: `3199→3201→3203`; G04-V03 remains In Progress; V01/V02
  remain Done.
- Focused Control Center tests pass 42/42; `git diff --check` passes. No
  production code changed, so changed-code coverage is not applicable. This
  evidence-only slice does not require the full repository gate.
- No safe, independent ownership split existed for a single shared CLO setting
  and acceptance review; Codex retained ownership.

Started `2026-10-08 19:06:47 UTC`; closed `2026-10-08 19:07:58 UTC`
(`1m11s`): source/evidence reconciliation 0m36s; durable packet/state/board
work 0m25s; focused verification 0m10s; external-agent waits 0m; maintainer-
decision time 0m. Primary usage remained available.

## Source

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
  updated 2026-09-28; accessed 2026-10-08. CLO lists the import/export
  controls but makes no source-vertex-preservation guarantee.
- InfiniDrip, `docs/research/epic17/S517-clo-contour-loss-diagnosis/S517-exit-packet.md`
  and `docs/research/epic17/S519-clo-point-retention-control/S519-exit-packet.md`.
