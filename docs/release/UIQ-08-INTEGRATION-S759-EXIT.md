# UIQ-08 integration — Slice 759 exit

Status: implementation and pre-merge acceptance complete; submitted for Codex
review. This does not mean the feature is merged or live. Slice 760 remains
required for deployment verification and board closeout.

## Scope landed

- Added the embedded `uiq_inspection_toolbar` flag, public/default-on with a
  local deterministic override, compatible-v1 fallback, and expiry
  `2027-01-13`. It is not a remote kill switch.
- Integrated only the accepted native grouping and scoped CSS adapter on the
  existing toolbar, forcing the solid opaque modifier in normal and paused
  render paths. Glass/translucency was not adopted.
- Flag off retains byte-for-byte identical toolbar markup from the old
  `inspectionMarkup` path. Existing IDs, controls, zoom behavior, focus,
  pointer/keyboard operation, and export/persistence paths remain unchanged.
- No dependencies, services, network calls, geometry/draft/export changes, or
  baseline movement were introduced.

## Verification

| Gate | Result |
|---|---|
| Focused app + flag regressions | 306/306 passed; changed modules retain 100% statements, branches, functions, lines |
| Settled repository coverage | `npm run coverage -- --pool=forks --poolOptions.forks.minForks=2 --poolOptions.forks.maxForks=2` passed; 100% global statements, branches, functions, and lines. Coverage JSON: 33,152 statements, 17,308 branches, 1,899 functions; all covered. |
| Build/type checks | `npm run build` passed (strict `tsc` + production Vite build); `npm run electron:build-main` passed via packaging. No standalone `typecheck` npm script exists. Existing large-bundle advisory remains. |
| Control Center | 42/42 passed after correcting the stale UIQ-08 status assertion to `In Progress` |
| Web release / readiness | 10/10 and 5/5 passed |
| Packaged desktop | `electron:pack`, `electron:verify-release`, `electron:verify-packaged`, and `electron:verify-menu-packaged` passed |
| Production browser | `docs/research/uiq08-integration/evidence/production-browser-report.json`: seven widths (320–1440), no overflow, pointer/keyboard zoom bounds and Fit, unchanged SVG viewBox, visible focus, forced colors/reduced motion, axe 0 violations, inert OFF styling, zero external requests/errors |
| Repository hygiene | `git diff --check` passed; candidate adapter/CSS hashes match accepted Slice 757; protected export identity suite passed; no baseline files changed |

The accepted candidate adapter SHA-256 is
`577d09505a6df8e9af929a1c3fd2c90097e30fc99b4d14764a559c055c7bc16a`; its CSS
SHA-256 is `9e46006a8cd817ab66d500593828debd2e7917995f6ca8a4b3afe4d32c215ed5`.
The rendered browser evidence is digest-bound in the adjacent machine record.

## Review boundary / next action

The canonical board is at revision 4496. UIQ-08 and child Slice 759 are In
Progress; source and evidence are ready for Review, but the board transition
must be applied through the validated Control Center command layer. After that,
independently review the exact PR diff and evidence, open and merge only the
accepted tree, then continue with Slice 760. The main deployment and public URL
remain unchanged at this boundary. The shared `F:\designApp` checkout was not
used or modified.

Elapsed from 17:05 UTC admission to this exit: approximately 75 minutes,
dominated by the two settled global-coverage executions. No Claude/OpenCode
handoff was appropriate because app mount, flag state, fallback and rendered
verification are coupled and the packet assigned this integration to Codex.
