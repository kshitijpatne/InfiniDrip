# Claude Code independent review — PR #43 at S780

**Decision:** REQUEST_CHANGES. **Signal:** `WORK FINISHED` received.
**Reviewer:** Claude Code CLI 2.1.283, configured Claude.ai account. **Worktree:**
`C:/Users/kshit/.codex/worktrees/epic-18-g05-review-claude`, branch
`claude/slice-781-pr43-review`, HEAD
`bfacbf68ef242f366e77b6c43ed548ee4fe130b8`; base
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75`.

The reviewer made no repository changes, ran no tests, and did not change
GitHub review state or contact anyone. Raw CLI result:
`claude-review-cli-output.txt`, SHA-256
`3d0ce60b93ee10f2129c2458a25b47642bd4cdbec0a6a7ba8480414956deb670`.

## Blocking finding — high severity

Styles saved before EPIC-18 can have a payload-v1 immutable revision head and
no T01 data in that historical payload. On database upgrade, parsing creates
an empty T01 record with `revisionId: null` and `revisionNumber: 0`. Startup
only seeds styles with no revision head, so these records remain unlinked.

`ProjectWorkflow.saveActiveTechPack` rejects the first T01 edit because the
candidate's null `revisionId` does not equal the existing head ID
(`src/ui/project-workflow.ts:462–466`). It also compares the old head's
revision number with the unlinked T01 number (`:495–496`). Meanwhile,
`saveDesignInQueue` only detects T01 changes for payload-v2 heads
(`src/ui/project-workflow.ts:735–742`). The user can save T01 only after an
unrelated design change creates a v2 revision. Review/freeze controls remain
disabled, and the production-pack route refuses the old revision.

Codex confirmed the actual migrated state in
`src/ui/project-repository.test.ts:4401–4438`, the save guards in
`src/ui/project-workflow.ts:454–532`, and the v1 branch in
`src/ui/project-workflow.ts:731–755`. The migration test already asserts the
unlinked T01 shape; the workflow tests use a linked T01 for their historical
v1 parent case, so the real upgraded save path has no regression test.

## Nonblocking observations

- Frozen Tech Pack artifacts and the total manifest share the same 128 MiB
  limit; large packages fail safely, though the per-file message can mislead.
- Local share freeze binds supplied bytes to a revision and digest without
  regenerating those bytes. This is documented as a local, self-attested
  review and is not treated as a blocker.
- The disclosed optional-test timeout and standard Windows Electron rename
  failures do not invalidate the first passing S780 gate.
- All-seven evidence is a documented crosswalk; T04's numeric/output fixtures
  are the admitted synthetic Tee and Woven Shirt cases. No physical, supplier,
  factory, or production acceptance is established.

The reviewer independently confirmed the retained S780 coverage evidence,
unchanged coverage configuration and export code/fixtures, unchanged protected
export identities, local-only boundaries, and inspected PDF/ZIP hashes. The
review decision applies to the exact S780 head above; both agents must review
the eventual remediated PR head before merge.
