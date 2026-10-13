# Slice 780 post-replay verification

## Validated canonical-board replay

Before final S780 closeout evidence was replayed, the canonical board was at
revision 4682. The validated Control Center command files under
`docs/planning/EPIC-18-S780-*-BOARD-COMMAND.json` record:

| Change | Board revision |
| --- | ---: |
| Link `E-G05-S780-EXIT` to G05-EXIT and EPIC-18 | 4683–4684 |
| Link `E-G05-S780-RENDERED` to G05-EXIT and EPIC-18 | 4685–4686 |
| Link `E-G05-S780-COVERAGE-CONFIRMATION` to G05-EXIT and EPIC-18 | 4687–4688 |
| Reconcile the EPIC-18 record description | 4689 |
| Reconcile the EPIC-18 summary-card description | 4690 |
| Reconcile the G05-EXIT description for S780/S781 | 4691 |
| Link this replay report to G05-EXIT and EPIC-18 | 4692–4693 |
| Refresh the initial replay report digest | 4694 |
| Refresh the final exit/replay report digests after candidate review | 4695 |

Two initial command attempts received Windows `EPERM` during the atomic rename
of a board temp file to `board.json`. After each failure, read-back confirmed
that the expected revision was unchanged and no temp or lock file remained.
The same validated command was retried at that exact revision and succeeded;
no board mutation was applied twice. The command attempts and read-backs are
recorded in `board-command-diagnostics.md`. They are separate from the two
standard Electron package-path rename failures documented in
`rendered-output-review.md`.

## Final board read-back

After replay and the validated digest refresh, the canonical board is revision
**4695**.
EPIC-18 and its summary card are In Progress. G05-EXIT remains In Progress for
the S781 merge/deployment closeout. G05-T01 through G05-T05 and UIQ-10 remain
Done; UIQ-09 remains Backlog behind EPIC-19. Both Epic descriptions preserve
the S779 T05 checkpoint and now record S780 as passed and S781 as next. The
G05-EXIT description records the S780 gate result, the standard Electron
output-path limitation, and the S781 exit work.

The S780 evidence read-back confirms the following verified reports resolve
to their current repository files and hashes:

| Evidence | SHA-256 |
| --- | --- |
| `E-G05-S780-GLOBAL-COVERAGE` | `519eacaecff9118c8ece26b4b377e44bbdd40edd731caed2543bc8117a575c04` |
| `E-G05-S780-EXIT` | `446d5074d6f9f174ea624c90f939c7f6e46c520ea109b2dca7c7fa9137f4edf2` |
| `E-G05-S780-RENDERED` | `a55a3491ae64776dbc3127d3a8c475172dfaafb297f39a5e545c62fc52fe3d48` |
| `E-G05-S780-COVERAGE-CONFIRMATION` | `d3914deaca915f128ac672a898eeca12835059007e35ee0b05a318c1c5668dd4` |
| `E-G05-S780-REPLAY` | Stored in the canonical board and read back against this report after the revision 4695 digest refresh. |

The final `npm run control-center:test` run passes **42/42** at board revision
4695; its full output is `control-center-final.txt`. Final `git diff --check`
passes. The status and digest read-back retain G05-EXIT In Progress; no Epic
or exit status was prematurely closed.

## Git and next boundary

The S780 source candidate is based on landed S779 commit
`0e557553e881add962c67dea49f282b3dbdd227d`. Refreshed
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
The one S780 commit ID is recorded at the S781 start boundary; this avoids a
same-slice fixup. S780 changes no production behavior and no export baseline.

The single next action is the admitted S781 closeout: open the S780-reviewed
candidate as a PR, merge it after required checks, verify updated main
ancestry and deployment, check applicable live output, then close EPIC-18 and
G05-EXIT with evidence and synchronize project context. The physical, supplier, factory, signing,
compliance, launch-cost and production-readiness holds remain in force.
