# EPIC-17 / G04 V03 — S709 exit packet

## Result

S709 reconciles the fixed V03 gates against current source/receiver evidence
and one bounded read-only Sol high review. The gate matrix is
`V03-GATE-MATRIX-S709.md`; the ranked completion plan is
`V03-COMPLETION-PLAN-S709.md`. No gate was newly declared passed, no
acceptance/threshold/hold changed, and no production code or export baseline
changed.

The review caught an inefficient order in the older S704 plan: running 73
LibreCAD cases first would not satisfy the separate industrial-apparel
receiver/profile requirement. LibreCAD remains a generic CAD route regardless
of breadth. The reviewer also verified that exact source-hash validation is
not a returned-DXF sidecar comparison. S710 is therefore a source-side
returned-file identity audit plus existing malformed-input fail-closed
fixtures; it needs no new app and no receiver UI operation.

## Accountability: GetonAgain/GMS-DGS decision

The candidate was selected from first-party pages advertising a downloadable
free desktop edition and DXF import/export, with maintainer authorization.
That explains why it was considered; it does not excuse the sequence. Before
installing, I should have verified the exact free build's installed import
path, pattern-registration behavior and returned-file contract using a simple
native control. Instead, that decisive check came after install and led to
more GUI experiments. The measured results are specific: S667's Design mode
rendered nine outlines but registered zero patterns and its export lost
geometry/units/identities/layers; S670's native ASTM export contained only
metadata TEXT and no pattern geometry. These results retire the tested modes,
but they do not prove every failure was caused solely by the app or solely by
our DXF. Do not repeat those modes.

S708 separately demonstrates a source-side mistake we actually made and
fixed: the opt-in R2000 writer omitted block ownership/space/linetype
structure. The same LibreCAD fixture now retains CUT layers and the exact
outlines/marks/units. This is measurable progress in our code, but it does
not convert LibreCAD into the required industrial profile.

## Verification and status

- Bounded reviewer: `gpt-6-sol`, high reasoning, read-only; explicit
  `WORK FINISHED` received. Codex checked the source verifier, current G04
  board contract and C04 negative/unsupported clause against the review.
- `npm run control-center:test`: 42/42 passed after board start/exit evidence.
- `git diff --check`: passed; only standard LF-to-CRLF working-copy notices.
- No production code changed; code coverage does not apply to this
  documentation/board slice. Full repository suite/global coverage and
  integrated build remain for the settled candidate.
- Canonical board: revision 4163 before start; start replay 4163→4165;
  exit evidence/comment 4165→4167. G04-V03 and EPIC-17 remain In Progress.
- Repository contains only the two pre-existing untracked S700 diagnostic
  text files plus this required S709 packet. No CAD binaries or outputs are
  in the repository; final cleanup must decide whether the diagnostic files
  belong in the final PR. Do not delete them in S709.
- Start: 2026-10-11 01:56 UTC from S708 `17ffedd2`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  Slice 709 is unique. Exit: 2026-10-11 02:03 UTC.
- Elapsed: approximately 7 minutes. Evidence/source reconciliation: 2m;
  Sol review wait: about 1m; durable matrix/plan/state/board work: 3m;
  focused board verification: 1m. Maintainer-decision time: 0m.

## Next action

Begin S710 source-side returned-file identity comparison and fail-closed
negative-fixture verification. Preserve every acceptance criterion. Do not
run a 73-option receiver matrix or any new application/mode unless exact
existing evidence first qualifies the already-authorized route's industrial
profile and a source-backed reason predicts it can clear a fixed gate. Keep
the goal active; final cleanup, full gate, PR, safe merge, ancestry, deployment
and production end-to-end checks are still due.
