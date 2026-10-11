# UIQ-03 integration — Slice 736 pre-merge exit

Status: implementation and pre-merge verification gates passed. This slice is
not merged or deployed; UIQ-03 remains in Review until the independent PR
review/merge and Slice 737 production closeout.

## Boundary and accounting

- Started 2026-10-11 18:10:25 UTC from `origin/main`
  `f25ff25779c9223284106cf745c94d0ebc5cb885`.
- Worktree/branch: `C:\Users\kshit\.codex\worktrees\uiq03-integration\designApp`,
  `codex/uiq03-integration`.
- Slice 736 is bounded to read-only UIQ-03 presentation integration in the
  existing Design readiness disclosure, its embedded feature-flag/fallback,
  focused tests, documentation, board status and pre-merge evidence. Slice 737
  remains post-merge deployment and board closeout only.
- The accepted candidate source, test and CSS blobs still match the immutable
  hashes in `docs/research/uiq-clarity/CANDIDATE-EXIT.json` and were not edited.
- Elapsed focused implementation, browser review, package and operational-gate
  wall time was not separately stopwatch-recorded. The full coverage run took
  1,702.41s; focused/smoke suites took only seconds. External-agent wait: 0.
  Maintainer decision wait: 0. Do not infer a combined duration from shell or
  chat timestamps.

## Implementation boundary

The accepted guidance panel mounts once on stable `#readiness-host`, updates
from existing readiness/journey/blocker/note state, and disposes on remount.
`uiq_guidance` is embedded/default-on and expires 2027-01-11; its deterministic
local override is test-only. OFF, unknown or stale retains the exact existing
readiness checklist. Existing journey navigation, blockers, correction
behavior, data, measurements, saved workspace, engine decisions and exports
are unchanged. Fit intent is withheld until the existing Style review; unresolved
semantic evaluation is labelled unknown. Duplicate blocker text is removed
only from the panel's ordinary notes list while its blocker card and existing
journey warning/action remain. Guided capture correction resolves recipe input
keys to semantic capture IDs and focuses the existing input without rewriting
its raw value.

No candidate source, dependency, lockfile, geometry, baseline, global CSS,
journey logic, provider integration, persistent preference, or other feature
was added. UIQ-04/05/07 remain Backlog. No physical-fit, garment-fit, or
production-readiness claim is made.

## Verification

- Settled full repository: 164/164 test files; 2,647/2,647 tests passed;
  global statements, branches, functions and lines each 100%; one worker;
  1,702.41s. All nine export-byte-identity tests passed. Machine report:
  `docs/research/uiq03-integration/evidence/S736-full-coverage.json`.
- Coverage diagnosis retained in `docs/planning/UIQ-03-GOAL.md`: the first
  attempt had 2,644 passing tests and 99.98% coverage (guided capture/fieldless
  branches); the second had 2,646 passing tests and 99.99% coverage (unknown
  recipe-key fallback). The field mapping helper and direct mapped/unmapped-key
  tests addressed the final branch; third settled gate passed at 100%.
- Production build and TypeScript checks passed as part of `npm run
  electron:pack`. Existing >500 kB chunk warning and package metadata/icon
  notices remain; no dependency was introduced.
- Packaged Electron release verifier passed on Windows x64 / Electron 44.1.0:
  72-file inventory, no absolute dev path, fresh welcome profile, offline reload,
  malformed save/recovery handling, valid SVG/DXF/PDF/Tech Pack/Projector/A0
  output, byte-identical button/menu routes for all six output families,
  cancellation/write-failure handling and window recovery/lifecycle; zero
  errors. Machine summary:
  `docs/research/uiq03-integration/evidence/S736-electron-packaged-verification.json`.
- Operational checks after the full gate: Control Center 42/42, web release
  10/10, readiness drill 5/5, `git diff --check` passed.
- Rendered pressure test: desktop 1440, 720 (200%-equivalent) and 320 CSS-px
  layouts; no horizontal document overflow; 254×44 px correction target; exact
  flag-off legacy fallback; forced-colors/reduced-motion; Axe whole-page scan
  zero violations; no external requests or page errors. After the final resolver
  change a new production-preview session confirmed visible guidance at Refine,
  309 CSS-px panel width, preserved Next navigation and the truthful no-fit
  default; zero requests beyond loopback and zero page errors. Mounted-app test
  routes the actual `body.chest-girth` field and preserves invalid raw input.
  Screenshots and complete observations:
  `docs/research/uiq03-integration/S736-RENDERED-PRESSURE-TEST.md`.
- `git diff --check` emitted only existing Windows LF/CRLF working-copy notices
  for the board and unrelated S425 artifact; no whitespace errors.

## Scope and protected work

No user-owned change in the primary `F:\designApp` checkout was accessed or
modified. Existing S425 Polo-H rendered artifacts in this integration worktree
are excluded from this slice, remain untouched and must not be staged. Generated
coverage directories, Electron output and temporary verification artifacts are
also excluded; only the explicit Slice 736 source, test, planning and evidence
files belong in its commit. Current `origin/main` remains the admitted base as
of the last check; the final ancestry/remote check is required before PR.

## Remaining gates

Passed: accepted candidate identity, flag and exact fallback, mounted
presentation and correction behavior, full 100% repository coverage, build,
export-byte-identity, rendered/accessibility/no-egress review, operational
checks, packaged offline/export/lifecycle verification, and scoped diff review.

Pending: final complete-diff/source-boundary review; one `Slice 736:` commit;
validated board transition to Review with exit evidence; push/open PR; Codex
review and fixes if any; then Codex merge after required checks. No production
release is considered shipped until Slice 737 confirms the automatic Pages
workflow and public URL, records deploy evidence, and closes the canonical
board. UIQ-04/05/07 remain Backlog.
