# EPIC-17 / G04 — S727 integrated release-gate attempt

## Result and scope

S727 reconciled the durable V03 records to S726 and ran the integrated full
coverage gate. The gate completed on the one-worker setting but **failed**:
12 files failed and 152 passed; 8 tests failed and 2,354 passed. It did not
produce a valid 100% global-coverage pass. EPIC-17 and G04 remain In Progress.
No V03 or V02 acceptance was reduced, no CAD application was installed or
retested, and no production source was changed in S727.

## Reconciled V03 scope

S726's maintainer-directed correction is the current V03 contract: check all
365 recipe/option/size source packages; sample each distinct serialized DXF
exchange-structure/semantic class across all seven recipes; include the
Trouser XL boundary return; keep the 0.001 cm return threshold and all units,
identity, layers/marks, readability, repeat, malformed-input, legacy-DXF and
protected-byte gates. Compatibility is limited to the exact 11
saved/reopened/audited/render-reviewed LibreCAD 2.2.1.5 / DXF 2000 returns.
No industrial, ANSI/AAMA/ASTM, all-315-shape, physical-fit, factory, or
production-readiness claim is made. No further receiver/software selection is
in scope.

## Integrated gate evidence

- First default-worker attempt: preserved at
  `C:\G04-CAD-Interchange\S727-integrated-epic-release\coverage.log`. The
  14-worker run saturated memory and timed out in the DXF interchange file;
  it was stopped after 153/154 files had completed. No runner default changed.
- Required worker comparison used the same DXF interchange test: default
  workers passed 10/10 in 81.1 s at 1,108.4 MB peak aggregate process-tree
  memory; one worker passed 10/10 in 73.9 s at 435.4 MB. The representative
  check is materially lower-memory and slightly faster with one worker.
- Full one-worker run:
  `C:\G04-CAD-Interchange\S727-integrated-epic-release\coverage-one-worker.log`.
  Runtime was 26m36s. It records 12 failed/152 passed files and 8
  failed/2,354 passed tests. There is no coverage-pass claim.
- Focused Control Center assertions after restoring the required historical
  board summary phrases passed 2/2. The full Control Center suite remains due
  at the settled candidate boundary.

## Failure diagnosis and next slice

| Finding | Classification | S728 action |
| --- | --- | --- |
| Six `docs/research/epic17/*.test.mjs` files ran with Node's built-in test API; Vitest reported “No test suite found” even though their Node assertions passed during module load. | Test-runner ownership mismatch. | Exclude these Node-runner files from Vitest and invoke the same six files explicitly with `node --test`; retain all assertions. |
| Two Woven closed-vent assertions expected an edge that the exact zero-depth source recipe removes. The malformed-adjacency check also mutated that closed block, so it never contained a vent edge. | Stale test fixture/expectation; fail-closed behavior still needs a valid open-vent corruption fixture. | Assert the closed source has no vent edge; build malformed adjacency from an open-vent source and require the mapped role to be held. |
| Pattern-measurement inventory omitted the new `trouser fly underlap`. | Current inventory regression. | Add an explicit option-only definition tied to front-closure options and count the piece. |
| Two technical-flat panel tests require Woven/Polo holds that S459 later cleared with reviewed mappings. | Superseded acceptance assertions. | Assert the accepted current faces render with source identities and no obsolete hold text. |
| S348 band audit requires the sleeve band to be displayed at the source stitch location, while S370/S459 explicitly label back bands as detached detail-only. | Superseded display expectation. | Verify source stitch identity and band length in the pattern; verify rendered back detail identities and “DETAIL ONLY” notice without asserting a false displayed seam. |
| S425's 17-option Chromium replay exceeded the default 5-second unit timeout by about 0.26 seconds under coverage. | Test timeout too short for the full existing evidence. | Give this unchanged 17-option replay a 30-second timeout; keep every assertion and rendered check. |

No other CAD candidate or design decision is needed. S728 will make only these
test/inventory corrections plus the narrow open-vent topology validation
required by the corrected malformed-adjacency test. The test runner will keep
the Node-native research checks and Vitest TypeScript checks distinct. After
focused checks and changed-code coverage, rerun the integrated full gate once.

## Other completion gates

| Gate | S727 result |
| --- | --- |
| V01/V02/V03 technical acceptance | Existing S459/S726 records remain accepted under their exact claim boundaries. |
| Full repository 100% statement/branch/function/line coverage | Failed; 12 files/8 tests above. |
| Full Control Center suite | Pending. |
| Build, browser/Electron integration, final seven-recipe/option output replay and visual review | Pending after S728. |
| Necessary-file cleanup and staged-tree review | Pending final-candidate boundary; S700 diagnostics remain untracked and untouched. |
| PR review, safe merge, refreshed origin ancestry, required deployment and production E2E | Pending. |

## Slice exit and next action

S727 records a failed integrated gate, not Epic completion. Keep the goal and
Epic active. Next reserve S728, reconcile only the specific runner, inventory,
projection-test, panel-test, detached-detail-test, and timeout issues above;
then rerun focused checks, changed-code coverage, and the full integrated gate
once. No unresolved maintainer decision or external CAD dependency remains.

## Time accounting

- Setup, refreshed state and scope reconciliation: recorded in the S727 start
  packet.
- Full one-worker verification: 26m36s; default-worker attempt and required
  comparison are separately recorded in the C:-only logs.
- Focused Control Center verification after board correction: 2/2 passed.
- External-agent wait: 0m. Maintainer-decision time: 0m; S726 acceptance is
  already approved.
