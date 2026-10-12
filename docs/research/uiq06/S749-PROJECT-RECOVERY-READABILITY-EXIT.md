# Slice 749 — project and recovery readability exit

Started 2026-10-12 02:33:42 UTC on `codex/uiq06-admission`, after S748
`24c6bcb2`; refreshed `origin/main` `7923a7f4323d713b069817adfd7626f19c7b48f5`
remained an ancestor. The shared `F:\designApp` checkout and the separate
EPIC-17 lane were not changed. Final implementation and verification completed
2026-10-12 03:15:47 UTC (42m05s from the S749 start); the durable closeout time
is recorded in the goal ledger after the final board replay.

## Finding and bounded change

The project panel's initial status said “Saved project is ready on this
device.” while the app could simultaneously show unsaved field edits. That
wording could imply the current draft had already been saved. It now says
“Project data is stored locally on this device,” describing storage location
without claiming a save state.

The recovery dialog asked whether to recover a local edit but did not state
what recovery does to the last saved version. It now makes the boundary
explicit: the saved version stays unchanged until the user chooses Save, the
latest local draft may be incomplete, and drafting/export remain paused until
correction. Recover and Discard actions, persistence, validation, atomicity,
and the explicit Save contract are unchanged. Both clearer messages are
selected only by the existing `uiq_operational_clarity` flag; OFF restores the
exact pre-S749 project and recovery wording.

The audit retained existing stale/conflict/revision-history/package and frozen
output behavior and copy where no independently demonstrated ambiguity
justified change. No data, storage, project identity, format, confirmation,
cancellation, export bytes, feature-flag catalog/default, or baseline changed.
No cloud or account capability was added.

## Verification

- `src/ui/project-manager.test.ts` plus `src/ui/project-app.test.ts`: 33/33
  passed; the project-manager suite includes revision restore, exact frozen
  outputs, package export/import, conflict/idempotency, and local persistence
  coverage. Its app workflow suite includes an explicit flag-OFF replay that
  asserts the exact legacy recovery and project-status wording.
- Recovery-specific `src/ui/app.test.ts` case: 1/1 passed (285 unrelated tests
  were intentionally filtered). Coverage instrumentation confirms the
  modified recovery-render statement and its associated branch executed. The
  selected-test app-wide coverage report is diagnostic only, not a module or
  global coverage pass.
- `src/ui/project-app.test.ts` with `src/ui/app.ts` instrumentation: 19/19
  passed. Both sides of the new recovery-copy and initial project-message flag
  branches executed; the selected test file reports 47.06% app-module
  statements, 66.73% branches, 58.44% functions, 47.06% lines, so this is
  changed-branch evidence only, not a full-module or global coverage pass.
- Focused coverage for `src/ui/project-manager.ts`: 100% statements, branches,
  functions, and lines. This includes the exact legacy default, the clarity
  message, and both absent/present existing freeze-blocker branches. App tests
  exercise flag-on and flag-off recovery branches; full app/global coverage
  remains pending at S750.
- `node electron/verify-project-workflow.cjs`: PASS in clean disposable
  browser and Electron profiles. Both retained two styles and selected style
  through restart, restored style-scoped recovery, preserved source-aware
  chest history and the explicitly saved value 104, then confirmed Save
  cleared stale recovery. Browser was Chromium 151.0.7922.34; Electron
  44.1.0/Chromium 152.0.7977.65.
- Real Electron recovery dialog renders at 1280x720 and 320x720 were visually
  inspected. Document width equaled client width at both sizes (1280/1280 and
  305/305; the narrow viewport's 15px scrollbar accounts for the latter).
  Dialog bounds were x=390..890, y=271.125..448.875 at desktop and
  x=18..286.8, y=219.85..500.15 at 320x720. Both fit; screenshots and hashes
  are in `evidence/S749-project-recovery-pressure.json`.
- `npm run build`: PASS (TypeScript and production Vite build); existing
  greater-than-500kB bundle advisory remains unchanged.
- `npm run control-center:test`: 42/42 passed.
- `git diff --check`: PASS before evidence/board closeout.

An earlier combined app-test attempt was stopped after worker memory rose to
about 2.9GB; it was not counted as a pass. The bounded 31-test focused rerun
and recovery-specific test above passed. The full global 100% coverage and
release gate are still required at S750. The historical S240 package verifier
was not rerun because it writes to its old tracked S240 report path; current
package behavior is covered by the focused project-manager tests and the
workflow replay. No historical report was overwritten.

One prior uncontrolled browser profile displayed its existing fail-closed
“legacy recovery version is missing or unsupported” message and stated that
saved data was not intentionally replaced. That profile was not touched or
treated as a clean S749 fixture; no user data was modified. This observation
is not a product-data-loss claim or a passing recovery test. It remains a
separate diagnostic if the maintainer later supplies a safe reproduction.

## Scope and next boundary

The two copy corrections are presentation-only. The specific stale/conflict,
import-failure, project switching, and export contracts remain protected; this
slice does not claim to introduce a new feature or change an operation. No
export baseline moved.

**S749 exit is accepted locally.** Its final report is digest-bound on the
canonical UIQ-06 board; the validated closeout comment records the boundary
and S750 next action.
S750 is the sole next boundary: refresh main/history/ownership and run the
settled full repository 100% coverage, protected export-byte identity,
type/build, Control Center/readiness/web checks, packaged Electron, and final
rendered/no-egress/flag-off matrix; then Codex reviews the exact diff and PR.
S751 alone handles merge, deployment, live verification and board closeout.
UIQ-06 remains In Progress; no PR, merge or deployment occurs at this boundary.
