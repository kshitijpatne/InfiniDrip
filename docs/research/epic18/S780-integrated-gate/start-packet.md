# Slice 780 start — Integrated G05 gate and pre-merge review

**Status:** Started 2026-10-13 19:24:52 UTC. **Owner:** Codex.
**Branch/worktree:** codex/epic-18-g05 at
C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp.
**Starting commit:** S779 0e557553e881add962c67dea49f282b3dbdd227d.

## Verified checkpoint and authority

- Fresh origin/main is e9221ea5033ccfdd91bf1ebb353926f189477d75 and remains
  an ancestor of the active branch. The latest assigned slice on origin/main
  is 761; the active branch ends at 779. Slice 780 is the unique next number.
- No tracked or staged changes remain after S779. Pre-existing untracked
  files are the two S778 viewport captures under
  docs/research/epic18/S778-T05-freeze/evidence/ and the root tmp/ directory;
  they are outside this slice and remain untouched.
- Canonical Control Center revision is 4673 before this start replay.
  EPIC-18 is In Progress; G05-T01 through G05-T05 and UIQ-10 are Done;
  G05-EXIT is Backlog. UIQ-09 remains Backlog behind EPIC-19.
- The S779 exit and post-replay records are in
  docs/research/epic18/S779-T05-change-control/. They verify the final T05
  acceptance, board revision 4673, and 42/42 Control Center tests. S779 landed
  as Slice 779: mark frozen shares stale after edits.
- The immutable admission is docs/planning/EPIC-18-ADMISSION.md. The active
  ordered sequence and S780/S781 split are defined by
  docs/planning/EPIC-18-S765-RESEQUENCING.md, with the running ledger in
  docs/planning/EPIC-18-GOAL.md. Cross-project current state is recorded in
  CONTEXT-INDEX.md, PROJECT-STATE.md, docs/PROJECT-DECISIONS.md, ARCHITECTURE.md
  and the canonical board.
- Usage at start: 33% of the primary window and 21% of the weekly window used;
  ordinary usage is allowed. No blocking product decision is open.

## Intended outcome and exact boundary

Complete the admitted settled integrated G05 gate after T01–T05 and UIQ-10.
This slice is verification and review of the candidate as it stands at S779;
it does not authorize additional product scope. If a gate finds a defect, keep
its output, diagnose it, and use a separately numbered remediation slice.
Source or test changes after a passing global gate require a new settled gate.

The reviewed result must prove all seven supported recipes and every G05 and
UIQ-10 acceptance criterion while retaining the local-only, no-cost boundary,
all eight protected legacy export byte identities, and the explicit absence of
physical-fit, supplier, factory, production-release, or production-readiness
claims. No export baseline may move.

## Required gates and evidence

1. Run the settled repository test suite with 100% global statement, branch,
   function and line coverage. Preserve the complete output and coverage
   report.
2. Run the production build and the required release/readiness and Control
   Center checks. Preserve their outputs and final board validation.
3. Complete integrated browser/Electron/package verification for the admitted
   workflows. Inspect actual output files and rendered states, covering all
   seven recipes and the two selected T04 numeric/output fixtures; retain
   exact output hashes and viewport evidence where the workflow requires it.
4. Recheck all eight protected export identities against the tracked fixtures.
   Do not update a baseline.
5. Review the complete S779-based candidate diff, durable records and actual
   output evidence for consistency with the admission, S765 sequence, current
   maintainer decisions and all scope holds.
6. Prepare the reviewed PR candidate only after the gates pass. Do not merge in
   S780; S781 owns merge, main CI/deployment, board closure and downstream
   reforecast.

The prior S778 broad app-coverage attempt stopped under memory pressure at
about 2.6 GB without a report. Before the integrated full gate, compare the
configured Vitest worker setting with one worker on the same representative
heavy app-coverage range, recording elapsed time and peak memory. This is a
measurement only; do not change worker defaults without evidence.

## Ownership, non-goals, and stopping rule

Codex owns integrated verification, output review and the final diff review.
No safe disjoint contributor task exists for this verification-only boundary;
delegation would add coordination without reducing a separable risk.
Implementation fixes, if required, receive new unique slice numbers and do
not land as S780 fixups. No new garment, paid/provider-backed service, supplier
contact, external data flow, physical sample/fit claim or production claim is
authorized. S781 remains the later merge/deployment/closeout boundary.

## Time accounting

Slice start: 2026-10-13 19:24:52 UTC. At exit, record implementation,
focused/resource profiling, full-gate and rendered/output review, documentation
and board replay, external-agent waits, and maintainer-decision waits
separately. There is no approval or product decision currently blocking work.

## Single next action

Link this start packet to G05-EXIT and EPIC-18 through the validated Control
Center command layer, mark G05-EXIT In Progress, verify the final start replay,
then profile the representative memory-heavy app-coverage range before the
single settled global gate.
