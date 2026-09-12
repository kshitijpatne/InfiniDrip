# P1 execution and evidence

Owner: Codex (GPT-6; reasoning setting not exposed to the agent). Date: 2026-09-12.
One master goal covers P1 → P2 → P3. P1 is complete and execution now continues
through the resumed P2/P3 milestones. Epic 3 and physical validation remain
deferred.

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
Commit subjects contain the slice and affected IDs; immutable hashes are
consolidated in the epic exit report.

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

## BF-P1-03

BUG-UI-006/007/008 are closed. Save format v4 stores the full intentional
workspace in addition to measurements, color and recipe options. Load validates
the selected recipe/style/material/view/size/width/scope and rebuilds controls,
pressed states and the rendered output from the restored values. Existing v1–v3
saves migrate to the standard workspace defaults. `FIELDS` plus `inputError`
provides the shared bounds contract; current invalid measurements/options are
rejected with an exact Save error and the prior stored workspace remains intact.
Exploratory Edit geometry is still intentionally transient.

Live review: a woven-shirt workspace with altered button count, color, Linen,
Relaxed style, Body Side, Nesting Marker, 120 cm width and size step 2 was saved,
changed, loaded, and remounted. All controls, pressed states and the view matched;
the actual render was inspected. Invalid Length/Chest saves reported corrections
and did not overwrite the prior save.

Focused tests: 37 persistence tests, 12 P1 DOM tests and the existing app suite.

## BF-P1-04

BUG-UI-009/010 are closed. Desktop export completion now follows the confirmed
Electron writer result: canceled dialogs and rejected writes show distinct
feedback and leave `Files exported` incomplete. Plain-browser downloads report
that the request started but do not claim that the file was written. Changes to
measurements, recipe/options, fabric/material, target fit, export size, width or
nesting scope clear a prior export completion and celebration.

Confirmed root cause: `download()` was fire-and-forget for the Electron promise,
and the browser anchor click was treated as proof of a filesystem write; the
journey state had no dirty transition on later changes.

Tests: 12 P1 DOM tests plus the original app/journey suites cover confirmed,
canceled, rejected and browser-start failure paths, celebration dismissal, and
post-export invalidation. Actual diff reviewed.

## BF-P1-05

BUG-UI-011 is closed. The woven assembled preview now consumes the complete
visual option contract for both silhouettes: front placket/buttons/pocket and
collar/stand, back-only yoke, sleeve-band cue, curved hem, and open side-vent
cue. The body shape follows the woven chest/waist/hip panel and the selected
hem/vent dimensions; non-woven rendering remains byte-compatible.

Confirmed root cause: the old `wovenShirtFrontDetails()` emitted only a front
placket, buttons, pocket and a yoke guide incorrectly across the front; collar,
stand, sleeve band, curved hem and back yoke were absent from the assembled
preview.

Live/rendered review: live Woven shirt output showed distinct front/back detail
groups, seven default buttons, front-only pocket/placket, back-only yoke and
collar/sleeve/vent/curved-hem cues. Changing live collar/sleeve-band/hem options
changed the SVG. Screenshot and rendered DOM inspected.

Tests: 23 garment-render tests, app woven route tests, all parsed woven export
consumers. Physical sewing and fit remain unverified.

Implementation reference for BF-P1-03 through BF-P1-06: `65fcc86`.

## BF-P1-06

BUG-UI-001 is closed. The primary shell now uses responsive grid/flex layout;
the 390px breakpoint stacks the three work areas, wraps toggle/garment/export
controls and constrains previews to the available width. The 900px breakpoint
places inspection panels below the working columns.

Confirmed root cause: the shell was a fixed three-flex-column row with a 300px
workspace minimum and non-wrapping control rows, so the primary workflow
overflowed narrow screens.

Live/rendered review: at a real 390×844 viewport, document scroll width was 375px
inside the 390px viewport with no overflowing element; the responsive screenshot
showed stacked controls, journey, workflow toggles and preview. Desktop woven
render was also inspected.

Tests: responsive markup assertions, full app/view suites and the live viewport
check. No mobile browser claim extends beyond the verified viewport.

## EPIC-BUGFIX-P1 exit report

All BUG-UI-001 through BUG-UI-012 records are Closed with severity/priority,
confirmed root cause, fix slice, implementation commit subject, tests,
live/rendered/output evidence and closure status preserved in
`docs/BUG-LEDGER.md`. Full gate: 73 test files / 935 tests; 100% statements,
branches, functions and lines; TypeScript; production build; parsed SVG/DXF,
tiled PDF, A0 PDF, projector SVG and tech-pack checks; eight unchanged legacy
export hashes. Diff and rendered UI/output were reviewed after each bounded
slice. P2/P3 continue sequentially under the same master goal; Epic 3 remains
parked until all three bug-fix exit reports pass.
