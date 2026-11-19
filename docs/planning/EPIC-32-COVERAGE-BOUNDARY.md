# EPIC-32 global coverage boundary

**Owner decision:** Maintainer, 2026-11-19
**Applies to:** The 56-blank EPIC-32/G18 delivery, including S1331/R07 and R08.
**Status:** In force until the final Epic gate.

## Hard boundary

Do not run repository-wide coverage, a coverage-instrumented full suite, or an
equivalent set of broad coverage shards before the final integrated 56/56 Epic
candidate is ready. The final gate starts only after every blank has passed its
required live acceptance, the integrated 56-blank replay and output review are
complete, and product/test changes are frozen. A mandatory main-deployment
workflow may run its ordinary non-coverage test suite once after a merge; do
not run that suite separately as a diagnostic or repeat it.

Before that boundary, run only the exact focused test files and coverage scope
named by the active slice contract. Keep the existing four 100% metrics for
changed production behavior. A narrow focused run must not be expanded into a
suite-wide run merely because a report is incomplete. For large shared modules,
use exact-main baseline evidence plus coverage of the changed behavior; defer
repository-wide reconfirmation to the final Epic gate. Never report a scoped
report as global coverage.

## CI enforcement

The PR global-coverage workflow skips `codex/epic-32-*` implementation
branches and records the deferral as a separate check. The final integrated
candidate must use a `codex/epic-32-final-gate-*` branch, which opts back into
the full global job. Other PR branches keep their existing full-coverage gate.
Keep EPIC-32 branch names within this prefix convention so the global job
cannot start accidentally before the final boundary.

## Run controls

Before starting any local test/coverage process, add a planned row to this
file's ledger with the exact test paths, coverage include paths, source/test
change hash, acceptance gap being checked, and stop condition. Keep one
validation process active at a time. Do not rerun an unchanged test selection
unless a specific prior assertion failed or the relevant source/test changed.
Do not run overlapping batches or parallel shards that collectively recreate
the global coverage gate before the final boundary.

If a focused run produces no test-file result for five minutes, interrupt it,
record the active test and output, and change the selection based on that exact
evidence. Do not restart the same grouping or launch a broader substitute.
Keep assertions, timeouts, and configured thresholds intact.

At the final boundary, run the complete repository suite with four-metric 100%
coverage on the frozen integrated candidate, preserving logs and enabling a
coverage report on failure. If it fails, diagnose and repair only the exact
failures. Run the affected focused checks, freeze the repaired candidate, then
repeat the global gate only while still at this final Epic boundary.

## Verification ledger

| Date | Scope and result | Disposition |
|---|---|---|
| 2026-11-18 | Pre-boundary full candidate run: 237/244 files and 4,578/4,600 tests passed; 22 tests failed after 14,509.34 seconds. No coverage-threshold result was emitted. | Historical failed run; do not repeat before the final Epic boundary. |
| 2026-11-19 | Seven-file isolated no-coverage triage: 239/240 passed. The one failure was the shared artifact-probe fixture omitting the R07 route marker; that fixture was corrected and the focused file passed 8/8. | Closed fixture diagnosis; no product behavior change. |
| 2026-11-19 | Focused domain/render/registry run: 275/275 tests passed; ten measured production modules reached 100% statements, branches, functions, and lines. | Accepted focused evidence for those ten modules. |
| 2026-11-19 | R07 mounted-app scenario: 1/1 passed, exercising save/reopen and all eight default/edited output routes. | Accepted scenario evidence. Its one-test `app.ts` report was partial and is not a module/global coverage claim. |
| 2026-11-19 | Broader mounted-app coverage attempts were interrupted during the legacy accessibility scan before producing results. | Not evidence; do not rerun those batches. Continue with the exact R07 changed-code scope and reserve repository-wide reconfirmation for the final Epic gate. |

EPIC-32 remains 54/56 at this decision. S1331 remains In Progress and R07
receives no blank credit from these test results. The next repository-wide
coverage run is prohibited until the final 56/56 integrated Epic gate.