# Slice 782 start — legacy payload-v1 T01 first-save compatibility

**Started:** 2026-10-13 22:36:30 UTC. **Usage:** primary 17%, weekly 24%.
**Worktree:** `C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`.
**Branch:** `codex/epic-18-g05`. **Starting candidate:** S780 commit
`bfacbf68ef242f366e77b6c43ed548ee4fe130b8`. **Fresh `origin/main`:**
`e9221ea5033ccfdd91bf1ebb353926f189477d75`, verified ancestor.

The PR #43 candidate is OPEN/CLEAN/MERGEABLE. The initial S781 review
reconciliation records OpenCode APPROVE and Claude Code REQUEST_CHANGES for a
high-severity legacy T01 first-save defect. Codex confirmed the exact migrated
v8 fixture and workflow guards. No PR merge was attempted. The owner's two
internal approvals remain required; no outside GitHub reviewer is to be
contacted. Canonical board revision 4706 has EPIC-18 and G05-EXIT In Progress,
G05-T01–T05 and UIQ-10 Done, and UIQ-09 Backlog behind EPIC-19.

The existing database-upgrade test verifies that a v8 database with a
payload-v1 head and no stored `techPack` loads an unlinked T01 record. The
workflow then rejects a changed T01 candidate because the record has no
revision ID/number corresponding to that older head. The bounded S782 scope is
in `docs/planning/EPIC-18-S782-REMEDIATION-ADMISSION.md`.

## Exact execution boundary

1. Register this packet, the reviewer reconciliation, and the remediation
   admission through the validated Control Center command layer. Keep
   EPIC-18/G05-EXIT In Progress; set no item to Done.
2. Add a regression from the actual migrated v8 fixture and implement the
   narrow legacy first-save exception. The exception must require an
   unlinked null/zero T01 record and a verified payload-v1 head for the same
   active style. The first authored T01 save creates exactly one v2 child and
   leaves the v1 parent untouched. Preserve v2 stale/CAS checks and no-op
   behavior.
3. Run focused tests and require 100% statement/branch/function/line coverage
   for every changed production module. Inspect the saved revision and local
   review/export paths in actual browser output.
4. On the settled source/test candidate, run the full global 100% coverage
   gate once, build/readiness/Electron main checks, protected export checks,
   Control Center tests, actual browser/Electron/output replay and
   `git diff --check`. Preserve the previous S780 gate; the new S782 report
   supersedes it as the current candidate gate because source changes.
5. Reserve the unique S782 commit number after refreshing `origin/main` and
   active history. Push the S782 commit to PR #43 for fresh independent
   read-only Claude Code/OpenCode reviews at the exact updated head. Wait for
   both `WORK FINISHED` signals and explicit APPROVE results.
6. Only after both approvals and Codex acceptance may S783 rebase-merge and
   verify the main deployment and live preview. Final board closure remains
   S783 work.

**Not yet done at start:** S782 product changes, S782 focused/full tests,
rendered proof, the S782 commit, and fresh reviews of a remediated candidate.
The S780 gate remains historical evidence and is not being represented as a
post-fix gate. Nonblocking review observations remain documented; they do not
expand S782 scope.
