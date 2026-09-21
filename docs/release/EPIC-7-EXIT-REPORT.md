# EPIC 7 — Nesting Intelligence Pack exit report

_Status: complete on `origin/main` at `598c0b9` after Codex review and
integration of `opencode/epic-7-nesting-intelligence`. No physical cutting,
fit, cross-OS, signing, or geometry claim is made anywhere in this record._

## Codex review and integration record

Codex reviewed contributor commits `9c951c3` (Slice 132), `22c4946` (Slice
133), `4c75338` and `c85a115` (Slice 134), then integrated them with the
current main baseline `eaae2af`. No production defect or scope violation was
found; the only integration repair retained both the Epic 7 contract and the
Slice 148 Polo V2 architecture boundary. The reviewed branch was merged by
`598c0b9` and pushed by Codex to `origin/main`.

The mounted app was also checked in a live local browser: a fresh launch
allowed the unfinished draft to be discarded; the Nesting view rendered the
planning controls; buffer `51` stayed visible with actionable invalid-input
guidance; on-hand values `50` and `100` produced the expected short and fits
verdicts; Single size versus Graded marker changed the estimate and marker;
Save/reload restored scope, buffer, and on-hand state; and the browser
reported no warnings or errors. This is local mounted-app evidence only and
does not widen the cross-OS or physical-validation boundary.

## Implemented boundary

Epic 7 derives planning metrics around the untouched deterministic
`nestPieces` shelf estimator:

- Waste share from utilization, shown as percent of cloth with clear units.
- Buffered planned length: `required × (1 + buffer/100)`, buffer default
  10%, editable 0–50%, step 1%. The raw estimator result is unchanged.
- Optional fabric-on-hand length: blank means unknown (never a verdict);
  finite positive values judge fits against the planned length or measure
  the exact shortfall.
- Directional-print flag defaulting to true, advisory only: the estimator
  keeps grain upright and never rotates pieces either way, and the UI states
  this outright.
- Invalid planning inputs stay visible with field-linked warn-only guidance
  and never pause the draft or gate exports. Save/recovery persist validated
  values through an optional additive section with no version bump; missing
  sections load defaults, malformed current sections reject visibly, and raw
  invalid recovery entries restore verbatim.

Out of scope and untouched: difficulty rating (roadmap 0.5.8 stays backlog),
Sparrow/irregular nesting, rotation, interlocking, drafted geometry, grading,
grainline rules, export writers, legacy hashes, EPIC 9/10 files, Electron
files, coverage thresholds, and governance rules.

## Verification gate

| Command | Result |
|---|---|
| `npm test -- --maxWorkers=1 --minWorkers=1` | 101 files / 1375 tests passed |
| `npm run coverage -- --maxWorkers=1 --minWorkers=1` | 100% statements, branches, functions, and lines |
| `npx tsc --noEmit` | passed |
| `npm run build` | passed |
| `git diff --check` | passed |

Serial Vitest mode follows the packet: host contention makes parallel
execution unreliable on the shared box, so the gate runs
`--maxWorkers=1 --minWorkers=1` throughout.

## Parsed consumers and legacy hashes

`src/export/regression.test.ts` 8/8 green with planning state present: no
cutting writer, grainline rule, or export byte changed, so empty and
non-empty planning state alike preserve all eight legacy hashes. The full
SVG/DXF/tiled-PDF/A0/projector/tech-pack parsed suites pass inside the gate
above.

## Mounted-app matrix (Slice 134 exit audit)

`src/ui/nesting-exit.test.ts` drives the real mounted app across all seven
garments (tee, fitted, tank, polo, woven-shirt, skirt, trouser): empty-state
readouts, valid/invalid/too-short/too-narrow planning states, deterministic
scope round-trips, per-garment save/load, assembled-preview integrity, and
responsive rendering at 1280/900/700/560/390 px. Slice 133 tests additionally
cover nap toggling with placement-stable canvas, invalid-save rejection,
pre-intelligence save migration, raw invalid recovery restore, style/garment
switches, and Review-to-control focus.

## Limitations

- The seven-garment responsive matrix is jsdom evidence; the additional live
  browser check above covered the mounted nesting flow and console state at
  the review viewport. No cross-OS guarantee is inferred.
- `type=number` controls sanitize non-numeric typing to blank (shared
  Slice-104 control behavior); zero/negative entries stay visible as invalid.
- Review-to-control for nesting fields navigates to the output step; the
  fabric view is not a journey step target, so exact-control correction also
  rides inline errors plus aria.
- Planning state is global like fabric width; per-garment planning sets are
  out of scope.

## Defects found and fixed during the Epic

- Exit-audit trouser state: fixed per-garment role selection in the audit
  itself (no product change).
- Three Slice-133 coverage gaps closed with targeted tests (strict
  missing-key rejection, blank-save rejection, null on-hand mount).
- Guidance Review for rebuilt panels resolves the control post-navigation
  (Slice 128 lesson, applied to nesting focus tests).
