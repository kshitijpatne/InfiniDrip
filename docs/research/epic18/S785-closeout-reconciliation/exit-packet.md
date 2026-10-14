# EPIC-18/G05 Slice 785 exit — S784 closeout evidence reconciliation

**Status:** Complete as a supplemental documentation and board-evidence correction. **Owner:** Codex. **Started:** 2026-10-14 01:51:59 UTC. **Unique slice:** 785, following S784.

## Scope and disposition

S785 reconciles two closeout-document findings raised during independent
read-only reviews of PR #44's exact S784 head. Claude Code requested a narrow
documentation follow-up for the stale S784-next heading and incomplete coverage
attempt/change chronology. OpenCode approved the candidate, treating the stale
heading as informational and confirming the worker/configuration and test-timeout
facts in the retained evidence. Codex accepted the factual correction before
merge. No outside GitHub reviewer was contacted; GitHub did not require formal
approvals.

The original S784 start and exit packets and their board-bound hashes are
preserved. This addendum supplements them. The goal ledger now labels the S783
text as a previous execution boundary and records S784 as completed, followed by
the bounded S785 reconciliation.

## Coverage and test record

The retained logs show three relevant global coverage attempts in order:

1. `npm run coverage -- --maxWorkers=1` failed during Vitest worker-pool setup
   with `RangeError: options.minThreads and options.maxThreads must not
   conflict`. No tests were collected or run. The output is
   `../S784-closeout/global-coverage-worker-config-failure.txt`.
2. `npm run coverage -- --maxWorkers=1 --minWorkers=1` ran 179 test files and
   3,161 tests; only the 32 MiB binary Tech Pack round-trip exceeded the default
   5,000 ms timeout, reporting 5,914 ms. The output is
   `../S784-closeout/global-coverage-initial-timeout.txt`.
3. S784 increased only that existing test's timeout to 15,000 ms. Its
   assertions and product behavior were unchanged. The selected case passed in
   a focused run, then the settled global gate passed all 179 files and 3,161
   tests at 100% statement, branch, function, and line coverage. The focused and
   settled outputs are `../S784-closeout/project-package-timeout-fix-test.txt`
   and `../S784-closeout/global-coverage.txt`.

S784 also updated Control Center test expectations for the closeout replay;
that focused suite passed 42/42. S784 therefore changed tests and documentation
but no product implementation, generated output, PDF/ZIP bytes, protected
export identity, threshold, or baseline. No product rendering, browser/Electron,
or export checks were repeated locally. PR #43's main workflow already passed
the integrated tests, production build, deterministic web proof, and Cloudflare
Pages deployment; both recorded preview URLs returned HTTP 200. The corrected
chronology and scope are now explicit in the S784 validation and deployment
records.

## Canonical board and verification

S785 starts from board revision 4745 and uses three validated commands:

1. Add `E-G05-S785-START` to G05-EXIT at revision 4745.
2. Add `E-G05-S785-EXIT` to G05-EXIT at revision 4746.
3. Link `E-G05-S785-EXIT` to the EPIC-18 record at revision 4747.

The replay reaches revision 4748. EPIC-18 remains Closed; its summary card,
G05-EXIT, G05-T01 through G05-T05, and UIQ-10 remain Done; UIQ-09 remains
Backlog. The original S784 evidence IDs and hashes remain intact. Exact command
files are in `docs/planning/EPIC-18-S785-BOARD-COMMANDS/`.

Record-only checks pass: JSON parsing; LF-normalized hashes for the two S785
packets against the canonical board; command-layer replay at revisions
4745→4748; final board-state inspection; and `git diff --check`. No tests,
builds, browser/Electron runs, rendering, export generation, or baseline checks
were repeated because the corrections do not change production code or output.

No next numbered Epic is admitted. UIQ-09 remains behind EPIC-19, and local/no-
cost, physical-fit, supplier/factory, signing, compliance, and production-claim
holds remain unchanged.

## Time accounting

Started at 2026-10-14 01:51:59 UTC. Implementation, focused record verification,
external-review wait, and maintainer-decision time are recorded separately in
`validation-summary.json` when this slice is finalized.
