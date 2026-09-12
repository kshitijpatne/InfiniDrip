# BUGFIX P2 execution record

Phase: `EPIC-BUGFIX-P2`, sequentially after P1 and before P3/Epic 3.
Source of truth: `docs/BUG-LEDGER.md`. Physical sewing, physical fit, and
production-readiness validation remain out of scope.

## Scope and exit criteria

P2 closes BUG-UI-013 through BUG-UI-026 in bounded slices. Each slice must
preserve the stable ledger IDs, update the affected durable documents in the
same behavior commit, review the actual diff, and inspect the rendered/live
result before the next slice.

The P2 exit gate is: 100% test coverage; TypeScript; production build; parsed
SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech-pack checks; and all eight
legacy export hashes unchanged. The P2 exit report is not passing until every
affected ledger record is Closed and the gate is recorded here.

## Bounded slices

| Slice | Records | Scope | Non-goals |
| --- | --- | --- | --- |
| BF-P2-01 | 013–016 | Bounded inspection frame, shelf layout, Body focus, Side context | No physical fit claim; no export-writer change |
| BF-P2-02 | 017–018 | Preview ownership/collapse and grouped woven options with units/help | No new garment construction |
| BF-P2-03 | 019–020 | Option-to-feature highlighting and material/color compatibility semantics | No silent material conversion or clamping |
| BF-P2-04 | 021–022 | Button-count semantics and explicit export scope | No change to legacy export bytes |
| BF-P2-05 | 023–024 | Journey progression/finish and defined Start landing state | No Epic 3 journey expansion |
| BF-P2-06 | 025–026 | Landmarks, names, keyboard-equivalent edit controls, field-linked guidance | No physical validation or production sign-off |

## BF-P2-01 — Closed

Implementation: pending immutable behavior commit reference.

The linear canvas now wraps component-heavy drawings into readable shelves. A
local inspection section provides a named viewport with Fit, Zoom out, and Zoom
in controls; SVG aspect ratios are preserved while portrait views are capped
and centered. Body offers Front + Back, Front, Back, and Side modes, with the
single-body modes persisted as workspace choices. The Side SVG retains its
explicit schematic label and has no fabricated side measurements.

Focused verification: 166 tests pass across canvas, view, app, and persistence
suites. Live review at 1280×720 confirmed woven Pattern viewBox
`0 0 178.5 239.6` rendered at 387×520, Front focus at 564×423, and Side at
170×520. Fit/zoom was exercised from 100% to 125% and back. Actual diff and
rendered screenshots were inspected before proceeding.

## BF-P2-02 — Closed

Implementation: pending immutable behavior commit reference.

The assembled garment is now a separately titled, collapsible secondary
preview. Woven construction options carry semantic groups, correct units, and
short feature/correction help; the controls render as five fieldset groups.
Focused verification: 122 tests pass across the contract, view, and app
suites. The live 1280×720 Woven route showed five groups with the expected
counts (3/4/1/2/3), `buttons` for button count, `cm` for dimensions, and the
preview Hide/Show state changed the rendered content while keeping its owner.

## BF-P2-03 — Closed

Implementation: pending immutable behavior commit reference.

Woven assembled details now expose a matching marker for every option; the
spotlight searches both analytical and assembled surfaces so a focused option
has a real target. Material/stretch and Color have separate labels and scope
copy. Selecting knit material for the woven shirt produces an actionable
compatibility warning and gates the digital readiness state without silently
changing the selection.

Focused verification: 74 app tests plus renderer/view suites pass. Live review
at 1280×720 confirmed Back yoke focus leaves its assembled marker at opacity 1;
Woven + Spandex blend showed the stable-woven warning and disabled SVG export.

## BF-P2-04 — Closed

Implementation: pending immutable behavior commit reference.

Woven button-count guidance is unit-aware and no longer duplicates an integer
warning when the count is out of range. The control explains the six/seven
front-placket buttons plus the additional stand button. Export controls now
separate one-selected-size formats from whole-graded-run Tech Pack/Projector
formats and state the consequence of the selected-size picker.

Focused verification: 61 tests pass across woven guidance and view markup;
TypeScript passes. Live Output review confirmed the two visible export scopes.

## BF-P2-05 — Pending

Journey progression/finish behavior and the defined Start landing state remain
to be implemented and verified.

## P2 exit report — Pending

No P2 exit gate is claimed yet. P3 and Epic 3 remain blocked by sequencing
until this report records a passing full gate.
