# EPIC-16 / G03 Slice 255 — full-gate test isolation

**Status:** Test isolation correction implemented; full coverage thresholds are
not confirmed; final independent reviews pending.
**Date:** 2026-09-29
**Parent:** Slice 254 at `505c439`

## Finding and scope

The Slice 254 production changes and their targeted integration checks passed,
but repeated full coverage attempts exposed two order-dependent app tests:
`draws the canvas and the garment on mount` and `keeps the reviewed journey
incomplete when Electron cancels a file write`. Both passed when run alone.
The new project-workflow preview test saved `localStorage` state and did not
clean it up. Later tests assumed a fresh saved journey, so the shared JSDOM
storage could change the initial view/stage and the resulting assertion path.

Slice 255 makes the affected app tests explicitly isolate browser state: the
Single/Marker workflow test clears storage during cleanup; the canvas, Electron
cancellation, and older-export tests clear storage before mounting; and the
cancellation and older-export tests clear it during cleanup. The older-export
test now checks its transient status immediately after the pending save promise
resolves instead of polling past the app's two-second status lifetime. No
product behavior, output writer, baseline, grade rule, or approval policy
changes.

## Attempts that identified the issue

- Full coverage with six workers and Vitest's default timeout: 132/133 test
  files passed, 2,028/2,030 tests passed. Two app tests timed out at the
  default five seconds; the Single/Marker test and the first-run Electron
  bridge test took about 7.2 and 5.2 seconds under coverage.
- Full coverage with six workers and a 15-second timeout: 132/133 files and
  2,028/2,030 tests passed. The canvas-mount assertion found no Pattern key,
  and the cancellation assertion did not find its status message.
- Full coverage with three workers and a 15-second timeout: the same two
  assertions failed. All other 132 test files passed.
- Isolated reproduction of the two failing cases: 2/2 passed before the
  isolation correction.
- After the correction, the Single/Marker persistence test and both affected
  app tests passed together: 3/3, with 265 unrelated tests skipped.
- Final single full-coverage attempt, with three workers and a 15-second
  default timeout: 132/133 files passed and 2,029/2,030 tests passed. The only
  failure was the older-export test observing an empty status after waiting
  for the temporary “earlier design” message; that message is cleared after
  two seconds. The long exact-plan integration test and forced-review guard
  both passed in that run. No global coverage table was emitted, so this run
  does not confirm the 100% coverage thresholds.
- After isolating that assertion, the cancellation, older-export, exact-plan,
  and forced-review tests passed together: 4/4, with 264 unrelated tests
  skipped. This focused run took 173.67 seconds and did not run coverage.
- No further full-coverage rerun was made. The full-coverage gate remains
  unverified; do not describe the candidate as having a passing full-coverage
  result.

## Exact product boundaries

POM reconciliation requires exact equality of raw numeric centimetre values;
there is no rounding allowance or tolerance. A mismatch blocks the affected
size and any whole run containing it. An N/A row must have an explicit reason
and is not a numeric match. One-size selected outputs remain available under
the existing policy; whole-run files remain withheld until an approved grade
plan exists and every declared size passes. No physical fit, population
validity, manufacturing tolerance, sample approval, or factory-readiness claim
is made.
