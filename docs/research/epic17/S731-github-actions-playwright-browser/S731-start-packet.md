# EPIC-17 / G04 — S731 GitHub Actions browser runtime

## Verified start

- Started: 2026-10-11 12:40 UTC.
- Branch: `codex/epic-17-s731-ci-chromium`.
- Base/start commit: `653c01a2589da1b78fec79539f72f2ebf45d48af`, the S730 squash
  merge at refreshed `origin/main`.
- The S730 tree is clean at the start of this slice. Control Center board
  revision is 4284; EPIC-17 and G04-V03 remain In Progress. The goal record is
  active.
- S730 local full coverage and release/build evidence pass. PR #17's post-merge
  production workflow run `38139722106` failed during its full test suite:
  157 files / 2,365 tests passed, while the S425 browser output test failed
  because the Ubuntu runner lacked Playwright's
  `chromium_headless_shell-1234` executable. The full log is preserved at
  `C:\G04-CAD-Interchange\S730-repository-evidence-hygiene\deployment-run-38139722106-failed.log`.

## Bounded scope

Add the Playwright-managed Chromium installation step to
`.github/workflows/pages-deployment.yml` after `npm ci` and before `npm test`.
The browser is a CI test runtime for the existing rendered-output test, not a
CAD receiver and not a user-device installation. No CAD application, product
source, V03 acceptance, pattern geometry, recipe, threshold, or export identity
changes in S731.

## Acceptance and verification

- The workflow installs the exact Chromium revision required by the lockfile's
  Playwright package before the suite launches the existing browser test.
- Focused verification covers the S425 browser-render test and checks the
  workflow structure/order.
- Run the full repository 100% coverage gate on this settled PR candidate;
  then let GitHub Actions run the full non-coverage suite, production build,
  deterministic artifact proof, and Pages deployment.
- After deployment, run a fresh Chromium end-to-end check against the canonical
  production URL using an existing approved LibreCAD return and its source
  package. Require a successful load, same-origin assets, no browser errors,
  and an accepted source-bound audit result.
- Keep legacy DXF behavior, protected byte identities, all-seven scope, and
  S726 V03 acceptance unchanged. No industrial/standards, fit, factory, or
  production-readiness claim.

## Exit

Close only after the PR is reviewed and safely merged, refreshed
`origin/main` contains the verified merge, the required deployment workflow
passes, and the production browser exchange audit passes. Then record the final
merge/deployment/E2E evidence and close EPIC-17 and the goal through the
validated Control Center workflow. The goal must remain active while this work
is in progress.
