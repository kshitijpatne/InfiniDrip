# EPIC-16/G03 Slice 256 — Load-state assertion and review handoff

**Status:** Focused Load-state regression passes; final full coverage and build
gates are pending on this test change.
**Date:** 2026-09-29
**Parent:** Slice 255 at `df9f2a9c0fc14634933908cd572306d6b5263c69`

## Scope

Claude Opus 5.5 high and OpenCode Muse Spark 1.3 xhigh independently reviewed
the S254/S255 candidate from isolated read-only worktrees and returned explicit
`WORK FINISHED` signals. Neither found a production-code defect in grade-plan
approval binding, exact POM reconciliation, selected-size availability, or
whole-run release gating. Both identified the unconfirmed full-coverage result
as a merge blocker. Claude also noted that the S254 integration test did not
assert the post-Load output state.

The proposed assertion that every whole-run control must be enabled after Load
did not match this test's state: restored grade sizes coexist with saved
semantic edits that still require review, and the app correctly blocks Tech
Pack and Projector with that exact reason. Slice 256 makes this safety state
explicit in the test. The existing integration flow separately proves that
whole-run exports can be enabled for a ready plan, then verifies that a later
style edit removes graded sizes and blocks them.

## Focused verification

- Initial focused run with the proposed enabled-state expectation: failed at
  the new assertion. The observed reason was “Saved semantic edits need review
  before the graded run can be generated.” This was correct fail-closed app
  behavior, not a product defect.
- Revised regression expectation: `npx vitest run src/ui/app.test.ts -t
  "gates whole-run outputs on exact plan readiness and invalidates approval
  after edits" --testTimeout=360000` — passed 1/1 (267 unrelated tests skipped).
- The final full-coverage attempt before Slice 256 had 132/133 files and
  2,029/2,030 tests pass, but emitted no global coverage table. Its sole failed
  assertion was subsequently corrected in Slice 255 and passed in the focused
  4/4 run. The 100% thresholds are not yet confirmed for the exact Slice 256
  candidate.
- Production and Electron builds after S254 remain pending. The unchanged
  Control Center suite and protected exporter code have prior passing evidence;
  the final review must verify which results are reusable against the exact
  candidate and rerun only gates invalidated by changed inputs.

## Preview-scope revision note

Switching Single/Marker is a preview-only action: it does not itself dirty the
style, add undo history, or trigger recovery persistence. An explicit Save
persists the workspace setting in the style revision; because grade-plan
approval binds to the revision head, that Save can require the plan to be
refreshed and approved again. Custom one-size styles normalize the marker
scope to Single on Load because Marker is unavailable without an approved
graded run. This behavior is fail-safe and is documented as a revalidation
cost; Slice 256 changes no product behavior.

## Remaining merge gates

The full 100% coverage gate must pass on the exact final source/test candidate.
Run the production build and Electron build after the S254 source changes, then
review the final rendered/output evidence and current PR state. The most recent
full attempt's export-identity cases passed; no export writer or baseline has
changed since. Do not claim physical fit, supplier acceptance, or factory
readiness.
