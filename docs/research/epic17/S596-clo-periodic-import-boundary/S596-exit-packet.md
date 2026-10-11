# EPIC-17 / G04 V03 — periodic-SPLINE pre-export boundary check — Slice 596 exit

## Verified boundary

- Started `2026-10-09 08:49:06 UTC` from landed S595
  `02c4848326e1edebdf765bf03db25378835dae28` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained
  an ancestor. S595 was highest; S596 was reserved uniquely.
- Board start replay `3514→3516`; exit replay `3516→3518`. EPIC-17 and
  G04-V03 remain In Progress; G04-V02 remains Done.
- User's written product-development and local-processing authorization
  remains settled. No S596 exchange files were created; every prior DXF and
  project remained within its named C: folder. CLO was not closed or relaunched.

## Result: no pattern API call was made

S596's intended read-only `GetPatternLineInfo` capture could not be performed
safely because the computer-use surface gave a contradictory state for the
single CLO window:

- The latest accessibility tree still reports an `Export DXF` dialog, with
  its `100%` scale spinner focused and a `Cancel` control.
- The simultaneous captured image shows the nine-piece 2D pattern canvas and
  no export dialog.
- `list_windows()` returns only the main CLO window, with no separately
  targetable dialog.
- One Escape dismissal left the same accessibility report; a cancel-control
  click and a raise action returned unknown outcomes. After re-enumerating the
  one CLO window and taking a fresh capture, the accessibility/image mismatch
  remained. No follow-up input was sent.

This is a concrete computer-use window/capture inconsistency, not a CLO DXF
error, pattern result, or technical acceptance failure. The S595 saved
post-import/pre-export project was not opened or changed by S596, no getter was
run, and no DXF was imported, exported, or saved. No source-to-receiver
comparison or processing-stage conclusion can be added. S580's existing
line-based `GetPatternLineInfo` result remains limited to its own fixture and
does not settle whether S595's periodic SPLINE geometry is exposed by that
API.

## Scope and gates

S596 changed no product code, pattern/source geometry, production DXF writer,
legacy output, protected identity, V02 output, acceptance threshold, receiver
profile, or V03 criterion. No gate passes or fails based on this UI attempt.
S595's measured five Polo M CUT failures under the fixed `0.001 cm` limit and
all remaining V03 requirements (qualified profile/rights, seven recipes,
identity, CUT/SEW semantics, marks, scale, grades/options, malformed-input,
useful detail, and repeated round trips) remain as recorded in
`docs/research/epic17/S595-polo-periodic-spline-roundtrip/V03-CURRENT-GATE-MATRIX-S595.md`.
The goal stays active; this slice does not mark the Epic or goal blocked.

## Verification and time

- S596 start board clone preflight and validated CLI replay pass at
  `3514→3516`; exit preflight and replay pass at `3516→3518`.
- Control Center tests pass `42/42`; S596 board scripts pass `node --check`;
  `git diff --check` passes. No production code/tests changed; production
  coverage is N/A and full repository gates remain reserved for the settled
  integrated candidate.
- Start `08:49:06 UTC`; verified boundary time recorded with the project
  state. Research of existing API evidence, desktop inspection/recovery,
  verification, and board/docs time are listed separately there. External
  agent wait and maintainer-decision time are both `0m`.

## Next action

Before any S597 CLO action, recover a coherent computer-use view of the same
running CLO window: accessibility and screenshot must agree, and every modal
must be targetable. Then resume only the one read-only S595 pre-export
`GetPatternLineInfo` comparison. If the views remain contradictory, do not
send input; continue with evidence-only analysis and keep every V03 gate open.
