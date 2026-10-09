# EPIC-17 / G04 V03 — CLO DXF-ASTM size-group probe — Slice 563 start

- Started: 2026-10-09 00:41:33 UTC.
- Start commit: S562 `1011fed`; branch `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  an ancestor of the branch. Working tree was clean at slice start.
- Board start revision 3365; S562 is latest; reserve S563. V01/V02 Done;
  V03 In Progress. Usage: primary 14%, ordinary use available.
- CLO 2026.1.310 (r58944) remains in its existing session. A fresh visible
  capture and accessibility tree both show the same 2D pattern workspace;
  the earlier S561 state mismatch is not present now. Keep all imported and
  exported CAD files and any saved captures under
  `C:\G04-CLO-DXF-Exchange\S563-clo-dxf-astm-size-probe`.

## Scope

Use the S559 source-generated five-size fixture for one previously untested
recipe (Skirt, XS/S/M/L/XL) to determine whether CLO's documented DXF-ASTM
route can form, export, and re-import a source-backed size group with
identifiable sizes and measurable geometry. First inspect the actual CLO DXF
import/export dialogs and the current DXF-ASTM controls. Proceed with one
controlled exchange only if the UI provides a truthful way to associate the
five source files with the same size group without inventing file syntax or
grade values. Compare every emitted size/piece contour to the exact S559
source fixture and record whether the result carries a recoverable size/grade
relationship. Preserve actual UI captures and files in the named C: folder.

## Acceptance and holds

- Demonstrate whether CLO 2026.1.310 can consume the exact source-backed
  multi-size geometry through its documented DXF-ASTM UI path and return it
  with source size identity, point correspondence, and the admitted geometry
  tolerance; otherwise record the specific UI or output fact that blocks it.
- Preserve all seven-recipe V03 acceptance, every existing geometry/semantic,
  marks, malformed-input, options, generation-two, rights/profile and
  round-trip gate. Do not treat an ungraded set of separate outlines as a
  grading pass or CLO's DXF-ASTM label as conformance proof.
- Do not repeat the S559 single-size Tee case, prior M/default exchanges, or
  known contour/settings trials. Do not author guessed ASTM/RUL syntax,
  change product or pattern code, geometry, legacy output, protected byte
  identities, or any acceptance threshold.
- No physical-fit, factory-acceptance, or production-readiness claim.

## Exit evidence

Record exact input/output identities, import/export settings, the rendered
CLO result, source-to-output contour and size/grade disposition, focused
verification, validated board replay and elapsed time buckets. If the native
route cannot represent the source size group, stop without a speculative
format workaround and report the precise observed limitation and next
evidence needed. No safe disjoint work exists because this is a single-session
receiver probe; Codex owns UI operation, review and closeout.
