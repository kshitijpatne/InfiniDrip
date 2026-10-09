# EPIC-17 / G04 V03 — CLO native size-group probe — Slice 564 start

- Started: 2026-10-09 00:58:51 UTC.
- Start commit: S563 `3a2a06b` on `codex/epic-17-g04`.
- `origin/main` was refreshed before S563 closeout to
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the branch.
  S563 `3a2a06b` is current HEAD; board starts at revision 3369; reserve S564.
- S563 established that multi-selecting five ungraded files through CLO's
  `Open` path exported only XS geometry mislabeled M. The user has confirmed
  written authorization for product-development evaluation and local DXF
  processing; no further permission decision is pending.

## Scope and source basis

Test whether CLO 2026.1.310's documented native Size Group workflow can carry
the exact source-derived Skirt XS/S/M/L/XL geometry through DXF-ASTM export and
re-import. CLO Help says to create a Size Group in Object Browser > Grading,
add sizes, assign the group to selected patterns, and select that group at DXF
export; DXF-ASTM is a listed exchange format, and the export menu can include
grading information. Primary sources:

- https://support.clo3d.com/hc/en-us/articles/360000742668-Grading
- https://support.clo3d.com/hc/en-us/articles/360000742948-Apply-Grading
- https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export

Use only source-derived size differences and same-piece point correspondence
that can be established from the exact S559 fixtures and S562 mapping. If a
pattern point / piece / size cannot be matched exactly, do not invent a CLO
grade value or silently substitute a measurement estimate; preserve the
unresolved rows and record the exact limitation. This is a disposable receiver
project and report, not a product pattern, source, or legacy-export change.

## Acceptance and non-goals

- Create a native, explicitly named XS/S/M/L/XL Size Group and assign it to
  the exact source-backed Skirt pieces only if the UI permits a source-traceable
  mapping for every graded point.
- Export DXF-ASTM with Graded Nest and grading enabled; re-import through the
  same mode and compare every source size/piece contour against exact source
  fixtures at the unchanged 0.001 cm threshold. Verify size labels/group
  survival from file contents and CLO's rendered/UI result, not the selector
  label alone.
- Capture the actual CLO settings, dialogs, output DXF, report and rendered
  re-import in `C:\G04-CLO-DXF-Exchange\S564-clo-native-size-group-probe`.
- Stop safely if UI mapping is not exact, the 2D grade properties cannot be
  derived from source, or a real output mismatch/error occurs. No guessed
  industry rules, fabricated DXF/RUL syntax, physical-fit assumption, or
  factory claim.
- Preserve the named-profile rights/edition, all-seven-recipe round-trip,
  remaining geometry, CUT/SEW semantics, marks, malformed-input, options,
  protected byte identity and all V03 acceptance gates. S564 itself can only
  pass/fail this bounded Skirt proof; it cannot close all V03.
- No production code, pattern source, cut geometry, product DXF output, test
  threshold, board status, or G04 acceptance criteria changes. No source
  transfer outside local C:; no cloud upload or external receiver.

## Delegation and gates

No safe disjoint work exists: exact source-point mapping and one persistent CLO
UI exchange are coupled. Codex owns the interface, fixture, output comparison,
render review and closeout. Run `node --check` / focused analyzer assertions,
Control Center tests for the board replay, and `git diff --check`. Do not run
full repository coverage because production code/tests are unchanged and this
is not independently releaseable. Refresh origin/history, verify slice number
and C: paths, update project state and board through the validated command
layer, and record separate timing for setup/source analysis, CLO work,
comparison/render review, durable closeout, external waits and maintainer
decisions.
