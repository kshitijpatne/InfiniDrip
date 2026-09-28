# EPIC-16/G03 Slice 251 — approved graded-output integration

**Status:** Slice 251 implementation, post-correction targeted tests, full
coverage gate, strict builds, Control Center gate, and rendered Tech Pack review
pass. Slice 252 final review, PR merge, and EPIC-16 closure remain open.
**Verified:** 2026-09-28
**Scope:** Apply a user's separately approved grade plan to declared sizes and
release only outputs whose drafting, exact POM, and quantity checks pass.

## Delivered

- Custom one-size styles use a plan-driven path. Every declared size is derived
  from the saved base and its authored measurement and supported option deltas;
  the path does not consume legacy XS–XL rules or extrapolate absent values.
- Every supported recipe POM is shown as expected target, generated geometry
  value, and raw difference. The maintainer selected exact numeric equality in
  unrounded centimetres, with no tolerance or display-rounding allowance.
  Mismatches block the affected size; any blocked or unresolved size blocks a
  whole run. A POM marked not applicable retains its visible reason and is not
  treated as a numeric match.
- Stale, unapproved, invalid, concurrently changed, or incomplete plans fail
  closed. Plan-driven whole-run Tech Pack, Projector, Marker and frozen output
  captures are available only after all declared sizes pass.
- Per-size Tech Pack/Projector/Marker output and cut-piece quantities are
  generated from the same declared run. Existing custom one-size exports and
  legacy grading/export bytes remain available and unchanged.
- Frozen output manifests bind the approved plan and its output-integrity data;
  repository verification and semantic edit replay retain the same plan state.

## Verification

After all Slice 251 corrections, the full Vitest gate passed 133/133 test files
and 2,023/2,023 tests in 1,846.88 seconds with 100% statements, functions,
branches, and lines. Clover totals were 24,036/24,036 statements, 1,452/1,452
methods, and 11,050/11,050 conditionals. `npm run build` and
`npm run electron:build-main` passed. The Control Center gate passed 33/33
tests. The build retains its existing non-blocking large-chunk warning.

The plan-run integration test drafts the seven admitted recipes (Tee, Darted
tee, Tank, Polo, Woven shirt, Skirt, and Trouser) at three declared sizes. It
uses authored nonzero measurement deltas (chest +3/+8 cm, waist −2/+5 cm, and
+1/+2 cm for every other measurement), option steps where supported, and an
off-centre base size. It verifies that the base size reproduces the saved
block, measurements, and options. Its POM targets are written back from the
generated geometry, so its zero-mismatch result is a round-trip consistency
check of the exact comparison, not independent verification of POM output.
Separately, a 0.01 cm target change is reported as a mismatch and blocks the
run. Plan Tech Pack PDFs load for all seven recipes with every size title
present, projector layers identify every size, and Marker quantities match
every drafted piece across the run. A twelve-size long-label case covers column
pagination and wrapped not-applicable reasons. Other cases cover invalid inputs
and options, missing targets, stale approval, a forged plan digest,
user-controlled XML labels, and freeze gating. The app test also preserves the
standard graded freeze path.

### Plan Tech Pack and evidence corrections

An audit of the plan-driven Tech Pack confirmed three defects, now corrected in
`src/export/techpack.ts`:

- A not-applicable POM cell was still measured and printed as a number. It now
  prints `N/A` in the spec table and the Fit Record, and its measure callback
  is never called. The Fit Record has no Actual/Pass blank for that cell. A page
  note points to the Point-of-measure exceptions page, which prints the full
  reason wrapped, not truncated. An exception that names no declared size or
  recipe POM is rejected.
- The plan Fit Record printed `sampleSpec()` values, which were rounded to
  0.1 cm and read from a fresh, unedited redraft. It now prints raw,
  unrounded values from the supplied approved base block (the block that drives
  every other plan output), reusing the spec table's base column.
- Full-precision raw values overlapped adjacent columns. The plan spec table
  now shows three size columns per page, and the plan Fit Record has a wider
  Predicted column. The `·` separators, which printed as `?` in the ASCII-only
  PDF, now print as ` - `.

Legacy `exportTechPack` and `exportTechPackV2` output is unchanged. The legacy
Fit Record keeps its column geometry and one-decimal values, and no export
baseline moved.

The earlier evidence JSON included a 237-row raw reconciliation table labelled
as a nonlinear fixture. Its inputs step uniformly (+1/+2 cm), no checked-in test
or script reproduces it, and its targets were copied from generated values. It
has been withdrawn. The replacement evidence is in `src/export/techpack.test.ts`.
It is a clearly labelled synthetic digital Tee fixture with hand-authored,
nonlinearly stepped inputs (chest 94/100.125/108.5 cm, shoulder width
43.5/45/47.25 cm, ease 10 cm). Its hand-authored expected values are finished
chest 104/110.125/118.5 cm and across shoulder 43.5/45/47.25 cm, following
`derive()` in `src/drafting/measurements.ts`. The test parses the generated PDF
and compares the printed values with those expectations at 4-decimal
precision. Separate tests parse the N/A output and the edited-block Fit Record.

Post-correction targeted checks passed in the primary checkout:
`src/export/techpack.test.ts` and `src/export/regression.test.ts` (53/53),
`src/ui/grade-plan-run.test.ts`, `src/ui/grade-plan-run-panel.test.ts`,
`src/edit/semantic-edit.test.ts`, and `src/ui/project-package.test.ts` (98/98),
plus the app's exact-plan-readiness integration case (1/1). The Tech Pack was
generated from the synthetic three-size Tee fixture and rendered with PDFium;
the same pages were rerendered with Poppler at 144 DPI. Pages 4 (Measurement
Spec), 8 (Fit Record), and 9 (POM exceptions) were visually reviewed. The review
found and fixed slight overlap between long raw POM values in adjacent spec
columns by fitting each value to its column without rounding. The rerender shows
no overlap or clipping in those cells or in the Fit Record; the N/A reason
remains readable on its exception page. Page images are retained in
`docs/research/epic16/evidence/`. A regression assertion checks the exact values
and a conservative text-width bound. The corrected full coverage gate,
application and Electron builds, and Control Center gate all pass.

The Codex-controlled final review applied the independent Claude Code and
OpenCode audits. It fixed unsaved persistent-output freeze checks, stale selected
size handling, selected-size A0 allowances, direct-export plan freshness,
single-size Fabric Nest geometry and allowances, exact plan-digest verification,
Tech Pack layout and rounding, and repeated grade-run drafting cost. Ordinary
safe projector layer IDs and legacy exports remain compatible.

The built app was inspected in the browser at `http://127.0.0.1:4177/` in Style
stage using the existing saved custom Woven shirt workspace. The rendered grade
plan panel states that no size chart is supplied and that each declared size
must pass exact, unrounded POM reconciliation before whole-run files can be
used. No saved browser data was changed. The machine-readable verified
behaviours, the synthetic fixture, the withdrawn-evidence record, the audit
remediation list, and the protected export hashes (from
`src/export/regression.test.ts`) are in
`docs/research/epic16/evidence/S251-graded-output-verification.json`.

## Limits and remaining work

This proves digital plan-to-output correspondence, not physical fit, a valid
population chart, sample approval, manufacturing tolerance, or factory
readiness. No test yet compares the grade-plan evaluator's generated POMs with
independently authored POM targets for every recipe. The authored oracle covers
two Tee POMs in the plan Tech Pack. The rendered review covers representative
spec, Fit Record, and exception pages from one synthetic Tee run; it is not a
human-factors review of every recipe's complete Tech Pack. The writer is
ASCII-only, so non-ASCII characters in user labels or reasons print as `?`.
The maintainer's 15 high-priority manual
UI findings remain durable
findings only; they have not been added to the implementation roadmap or board.

Slice 252 is the next action: independent final review by Codex, Claude Code
Opus 5.5 at high effort, and OpenCode Muse Spark 1.3 at xhigh; resolve any
findings, prepare and review the PR, merge it safely into `origin/main`, verify
ancestry, and close EPIC-16 through the validated Control Center command
layer.
