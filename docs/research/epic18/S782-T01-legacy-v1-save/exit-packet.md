# EPIC-18/G05 Slice 782 — legacy payload-v1 T01 first-save remediation

**Status:** Implementation, focused verification, rendered output, and technical gates pass. The exact updated PR head still needs the two owner-required internal reviews and Codex acceptance before merge. **Started:** 2026-10-13 22:36:30 UTC. **Owner:** Codex.

## Authority and checkpoint

S782 is admitted under the failed-gate remediation allowance in docs/planning/EPIC-18-GOAL.md; the immutable S762 admission remains unchanged. Its narrow scope and exact gates are in docs/planning/EPIC-18-S782-REMEDIATION-ADMISSION.md.

The verified base is origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75. The work is on codex/epic-18-g05, following committed S781 9d5e35bdb5e1a60fe48e60fb9d86c88968a9095d. Before the S782 evidence replay, the canonical board was revision 4713. The replay commands in docs/planning/EPIC-18-S782-EXIT-BOARD-COMMANDS/ record the global coverage and rendered proof, update the Epic/exit summaries, and retain the catalog's historical S780/S781/S782 wording. They advanced the board to 4723 while EPIC-18 and G05-EXIT remained In Progress; the full Control Center suite passed at revision 4723. The final two validated commands add this packet to the Epic and G05-EXIT, with expected final revision 4725. G05-T01–T05 and UIQ-10 remain Done; UIQ-09 remains Backlog behind EPIC-19.

## Change and acceptance

src/ui/project-workflow.ts now recognizes only the legacy migrated state where the verified current head belongs to the active style and is payload-v1, while its stored T01 is the same style/recipe with revisionId: null and revisionNumber: 0. A real T01 edit can then create a payload-v2 child. The v1 parent and content digest are preserved. A no-op save creates no child. Candidate identity, recipe and parsed-record checks remain in force, existing v2 checks are unchanged, and a stale repository write still fails the compare-and-swap check.

src/ui/project-repository.test.ts extends the actual v8-upgrade fixture. It verifies the unlinked record after migration, stable no-op, single v2 child and intact v1 parent, stale-write rejection, revision-bound local review/approval/freeze, and continued local/physical disclaimers.

| Acceptance | Result |
| --- | --- |
| Actual migrated v8 fixture and first authored T01 save | Pass; exactly one payload-v2 child is created. |
| v1 parent/digest, no-op and stale/CAS protections | Pass; parent is unchanged, no-op adds nothing, stale writer is rejected without a duplicate child. |
| Revision-bound review, self-attested approval, local freeze and actual output | Pass; see rendered-proof-verification.json and rendered-output-review.md. |
| Changed-module focused coverage | Pass; 126/126 tests; src/ui/project-workflow.ts has 100% statements, branches, functions and lines. |
| Settled full repository gate | Pass; 179/179 test files, 3,161/3,161 tests, and 100% global statements, branches, functions and lines. |
| Build, Electron, web release, readiness and Control Center | Pass; details in boundary-verification.json. |
| Exact updated-head internal review and Codex acceptance | Pending after the S782 commit is pushed to PR #43. |
| Main merge, deployment and live-preview verification | Pending; assigned to S783 after the review gate. |

The focused command results are summarized in focused-verification.json. The single full coverage log and all four global metrics are in global-coverage.txt. The browser fixture and proof are repeatable through rendered-proof.cjs; Chromium actually migrated the v8 IndexedDB record, saved T01, reviewed and approved it, froze a local share, and read the PDF/ZIP bytes. The PDF has seven rendered A4 pages, visually reviewed for legibility and layout; the ZIP manifest and T01 record bind to the v2 child. Their exact hashes and contents are in rendered-tech-pack-artifact-manifest.json, rendered-tech-pack-zip-inspection.json, and rendered-output-review.md. This evidence is synthetic/local; it establishes no physical fit, supplier acceptance, factory acceptance, compliance, or production release.

npm run electron:verify-project-workflow passed. Its pre-steps npm run build and npm run electron:build-main also passed. The build emitted Vite's existing large-chunk warning. npm run web:release:test passed 10/10 and npm run readiness:drill:test passed 5/5. After the canonical board summaries were replayed, the targeted catalog assertion passed 1/1 and npm run control-center:test passed 42/42 at revision 4723. An earlier Control Center attempt failed because the updated summaries omitted phrases still required by the catalog test; the history and correction are recorded in control-center-attempt-01.txt. No test expectation or production code was changed for that issue.

No export source, fixture, threshold, or baseline changed. The full suite's protected export tests passed. The existing eight protected export hashes remain those already recorded for S780. No garment, paid service, login, cloud/provider feature, or release claim was added.

## Time, delegation and remaining gate

- Implementation edits: 10m07s from the S782 start at 22:36:30 UTC through the final production/test edit at 22:46:37 UTC, based on file timestamps.
- Focused tests and rendered output review: both completed before the global gate began at 23:03:41 UTC. Their individual durations were not recorded during execution; the combined interval after the last source/test edit is 17m04s and also contains rendered-output inspection. No more precise split is inferred.
- Settled full coverage: 21m30.7s wall time, 23:03:41–23:25:12 UTC.
- Remaining boundary checks: web release 2.84s; readiness 2.94s; Control Center 2.46s. The Electron/build workflow completed in the recorded command session.
- External review wait: not started for the updated head. Maintainer-decision wait: 0; no new maintainer decision is open.

No safe independent implementation fragment existed in the single compatibility guard and its migration regression, so Codex implemented this coupled change. The required independent work is the read-only post-push review by Claude Code and OpenCode, each in a separate worktree and with an exact immutable head. The handoff is docs/research/epic18/S782-T01-legacy-v1-save/review-handoff.md. Both reviewers must return APPROVE and WORK FINISHED; Codex must inspect their findings and the exact PR diff. The owner requires these two internal approvals. The effective GitHub rules query for main was empty and classic branch protection returned 404; no formal GitHub approval gate applies, and no outside GitHub reviewer is to be contacted.

**Single next action:** commit S782 once as Slice 782: ..., push it to existing PR #43, then obtain both fresh reviews of that exact head. If they approve and Codex accepts the candidate, S783 proceeds with normal rebase merge, main CI/build/web-proof/deployment, actual preview check and validated closeout. Keep EPIC-18/G05-EXIT In Progress until that deployment gate passes.
