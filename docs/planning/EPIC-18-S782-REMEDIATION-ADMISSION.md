# EPIC-18/G05 Slice 782 — legacy payload-v1 T01 save remediation

**Status:** Admitted under the existing EPIC-18 goal's explicit failed-gate
remediation allowance. **Started:** 2026-10-13 22:36:30 UTC. **Usage at
start:** primary 17%, weekly 24%. **Owner:** Codex.

## Authority and verified checkpoint

The active goal is
[`EPIC-18-GOAL.md`](EPIC-18-GOAL.md); it authorizes separately numbered
remediation slices for failed gates. The original, digest-bound
[`EPIC-18-ADMISSION.md`](EPIC-18-ADMISSION.md) remains unchanged. This additive
packet admits only the compatibility correction below.

S780 candidate: `bfacbf68ef242f366e77b6c43ed548ee4fe130b8` on
`codex/epic-18-g05`. Fresh `origin/main` is
`e9221ea5033ccfdd91bf1ebb353926f189477d75` and is an ancestor. PR #43 remains
OPEN, head `bfacbf68ef242f366e77b6c43ed548ee4fe130b8`, base `main`, and
MERGEABLE/CLEAN. Canonical board revision 4706 has EPIC-18 and G05-EXIT In
Progress, G05-T01–T05 and UIQ-10 Done, and UIQ-09 Backlog behind EPIC-19.

S781's first review gate found a blocker. OpenCode approved the S780 candidate;
Claude Code requested changes for the legacy T01 save defect. Codex verified
the defect against the real v8 database migration fixture and current workflow
guards. The results are in
[`S781 review reconciliation`](../research/epic18/S781-merge-closeout/review-reconciliation.md).
The owner requires both internal agents to approve before merge. GitHub has no
formal approval gate on `main`; no merge has been attempted and no outside user
has been contacted.

## Scope and acceptance

On a real v8 database upgrade, an existing style with a payload-v1 revision
head receives an empty unlinked T01 record (`revisionId: null`,
`revisionNumber: 0`). A user-authored first T01 change currently fails because
the save path insists that this unlinked record already match the old
revision-head ID and number. This prevents T01 persistence and keeps the
revision-bound review, freeze, and output paths unavailable until the user
makes an unrelated design edit.

**S782 changes only the first-save compatibility path and its tests.** Allow a
changed, same-style/same-recipe T01 candidate to create a child revision only
when the current verified head is payload-v1 and the live stored T01 record is
unlinked with the legacy null/zero revision identity. Bind the saved T01 to a
new payload-v2 child. Preserve the v1 parent and its digest exactly. Keep
ordinary v2 identity checks, malformed-record rejection, stale-tab/CAS
protection, recipe checks, and sample/QA history validation intact. Do not
create a revision for a no-op save.

Acceptance evidence:

1. A regression opens the actual migrated v8 fixture (v4 style, v1 revision,
   no persisted `techPack`), edits T01, and saves through `ProjectWorkflow`.
2. Exactly one new payload-v2 child is created; it names the untouched v1 head
   as parent, preserves the v1 digest, and binds the saved T01 record to its
   new revision ID/number. Repeat or stale writes do not create duplicate
   children or bypass the repository CAS.
3. After that save, revision-bound local review/freeze and production-pack
   generation work from the v2 head without an unrelated design edit; package
   approval remains self-attested and synthetic/local.
4. Changed production modules pass focused tests with 100% statement, branch,
   function, and line coverage. The regression is verified in actual rendered
   app/browser output with retained evidence.
5. The settled integrated candidate passes the full repository coverage gate
   (100% all four metrics), build, readiness, protected export identities,
   Control Center, browser/Electron, and actual output checks once after all
   source/test changes settle. No export baseline moves.
6. Claude Code and OpenCode independently review the exact updated PR head and
   both return APPROVE plus `WORK FINISHED`; Codex verifies the actual diff and
   evidence. Only then may the existing PR #43 be normally rebase-merged.

## Ordered boundary and non-goals

- **S781:** the initial closeout review found a blocker. No merge or closure;
  keep G05-EXIT and EPIC-18 In Progress.
- **S782:** implement and verify the narrow payload-v1 first-save correction;
  push the uniquely numbered remediation commit to PR #43 for independent
  review. The full/global gate must be rerun because production source changes.
- **S783:** after both approvals, normal rebase merge, successful main
  test/build/web-proof/deployment workflow, and actual deployed preview
  verification, reconcile and close the canonical board and durable records.

No automatic database rewrite on project open, general history migration,
schema expansion, export behavior change, new garment, recipe-specific default,
physical fit, supplier/factory acceptance, paid/provider feature, code signing,
or production-readiness claim is authorized. Keep the existing local-first and
no-cost boundary. Preserve all eight protected legacy export identities.

## Execution and risk controls

The S780 candidate is already on the EPIC feature branch. Codex owns the
workflow/test integration because the fix crosses immutable revision identity,
migration output, and compare-and-swap persistence. No safe independent coding
work has disjoint ownership. Claude Code and OpenCode have separate
read-only review worktrees and will be assigned the settled S782 PR candidate
after its full gate. No concurrent editing of shared contract files.

Risks are a false-positive legacy exception that weakens stale-write checks,
failure to preserve the v1 parent's digest, and a hidden dependency on an
unrelated design edit. Test the exact legacy conditions and a real migrated
fixture; retain separate stale/v2 tests. Existing optional S780 timeout and
Windows Electron/board `EPERM` observations remain disclosed and do not change
runner defaults or coverage thresholds. No completion date is promised; use the
verified gate sequence and record elapsed implementation, focused verification,
agent-wait, and maintainer-decision times at each boundary.

## Required commands and exit gates

- Focused: run `project-workflow.test.ts` and the real migration regression
  under coverage; require 100% of all four metrics for each changed production
  module.
- Full settled candidate: `npm run coverage -- --maxWorkers=1 --minWorkers=1`,
  `npm run build`, `npm run web:release:test`, `npm run readiness:drill:test`,
  `npm run electron:build-main`, `npm run control-center:test`, protected
  export-identity checks, and the existing actual browser/Electron/output
  replay. Run full coverage once after all source/test/config changes are
  complete; preserve and diagnose any failure before one settled rerun.
- Before commit, refresh `origin/main` and active branch history, verify the
  unique next slice subject is `Slice 782: ...`, and inspect the exact diff.
- Merge gate and S783 deployment evidence are recorded separately after
  S782's source and review gates pass.

**Immediate next action:** register this packet and the S781 review
reconciliation through validated Control Center commands, update the current
EPIC state/context to S782, pass focused Control Center verification, then
implement the guarded legacy first-save path and its real-upgrade regression.
