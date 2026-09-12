# P1 execution and evidence

Owner: Codex (GPT-6; reasoning setting not exposed to the agent). Date: 2026-09-12.
One master goal covers P1 → P2 → P3. This run stops after P1 for the maintainer's
model switch to Luna/max. Epic 3 and physical validation remain deferred.

## Bounded slices

| Slice | Scope / acceptance | Dependencies / model impact | Non-goals |
| --- | --- | --- | --- |
| BF-P1-01 | BUG-UI-002/003: verbatim negative ease and invalid values, inline correction, safe draft pause/recovery | Existing field/option contracts; no draft model change | Persistence and downstream verdict integration |
| BF-P1-02 | BUG-UI-004/005/012: live totals, one digital verdict across surfaces and export gating, honest copy | BF-P1-01; no geometry changes | P2 guidance layout and P3 copy |
| BF-P1-03 | BUG-UI-006/007/008: validated full workspace round trip and visible synchronization | BF-P1-02; versioned save schema change | Persisting exploratory edits |
| BF-P1-04 | BUG-UI-009/010: confirmed write/cancel/error feedback and stale-export invalidation | BF-P1-03; output identity in UI state | Export writer or baseline changes |
| BF-P1-05 | BUG-UI-011: woven front/back preview follows drafted component geometry/options | Woven component contract; render only | Drape or physical-fit claims |
| BF-P1-06 | BUG-UI-001: primary workflow reflows at 390/768/desktop widths | Completed P1 state flows; CSS only | P2 zoom/inspection and full accessibility epic |

Every slice receives diff review, live/rendered review, 100% coverage,
TypeScript/build, parsed export suites and unchanged eight legacy hashes.
Commit subjects contain the slice and affected IDs; immutable hashes are added
in the following slice and consolidated in the epic exit report.

## BF-P1-01

Confirmed cause: `applyChange` silently clamped and treated empty input as zero;
the change listener replaced the typed value on blur. Ease prohibited negatives.
Now fields retain values, identify errors through `aria-invalid` and associated
correction text, and pause drawing/export for incomplete or out-of-contract input.
The existing finite draft model is unchanged; incomplete UI values do not enter it.

Live review: local app, Chest 20 stays 20 with “enter 60–160”, no misleading SVG,
all six export buttons disabled. Restoring 100 and entering Ease -8 renders the
narrower real draft and guidance reports -8. Screenshot inspected. Edit also
recovers from empty measurements and invalid options. Remaining stale totals,
verdict and export completion belong to the next scoped slices.

Tests: `src/ui/controls.test.ts`, `src/ui/bugfix-p1.test.ts`, updated original
clamp regression in `src/ui/app.test.ts`; original reproduction retained in ledger.

Gate: 73 test files / 919 tests; 100% statements/branches/functions/lines;
TypeScript and production build pass; parsed export suites and all eight
legacy export hashes pass unchanged. Actual implementation diff reviewed.

## BF-P1-02

BUG-UI-004/005/012 are closed. In-place totals eliminate the stale 110 cm readout;
the UI validity predicate includes input errors, every recipe/plausibility warning,
and geometric checks. It drives Check, Style, journey and six export handlers.
The existing geometry-only report and legacy output bytes remain stable.

Live review: Chest 120 immediately produces “Finished chest: 130 cm”. Woven
button count 6.5 is shown verbatim, its actionable warning is visible, Check
withholds pass, Style withholds green, journey checks are incomplete and all six
exports disable. Correcting to 6 restores the digital-pass state. Screenshot and
diff inspected. Physical validation remains pending; remaining stale export
completion is scoped to BF-P1-04.

Gate: 73 files / 921 tests, 100% statements/branches/functions/lines,
TypeScript/build, all parsed export consumers and eight unchanged legacy hashes.
BF-P1-01 immutable implementation reference: `8f44f05`.
