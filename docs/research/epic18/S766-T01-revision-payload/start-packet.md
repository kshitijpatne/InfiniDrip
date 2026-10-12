# Slice 766 — T01 immutable style-revision payload integration

**Status:** In Progress. **Start:** 2026-10-12 21:33:39 UTC. **Reserved
slice:** 766, confirmed unused after S765 commit
`af6191ed8bb465a59da089ec8362ca5741c28d0a`. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`; the worktree was
clean at start. Fresh fetch confirms `origin/main`
`e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor. The canonical board
starts at revision 4551: EPIC-18 and G05-T01 In Progress; G05-T02 and UIQ-10
Backlog; UIQ-09 Backlog behind EPIC-19.

## Authority and exact boundary

This is the next boundary in the currently active ordered sequence in
`docs/planning/EPIC-18-S765-RESEQUENCING.md`. It carries out the admitted T01
revision-payload integration, moved from S765 to S766 by the separately
numbered package-copy correction. The hash-bound S762 admission remains
unchanged. S766 covers immutable T01 snapshots, new revision digest identity,
strict backward reading of payload v1, and concurrency-safe repository saves.

The current revision payload is version 1 and snapshots design plus field
observations and artwork digests. S764 added T01 as a persisted style child;
new immutable revisions must now capture that exact child. Historical
payload-v1 records must retain their existing shape, digest and frozen-manifest
bindings. New payload-v2 records add the T01 record to JCS/SHA-256 revision
identity. Package-created revision baselines and copied revisions must carry
the same T01 snapshot as their resulting style.

## Scope and owned files

Implement and verify only the revision-snapshot/data-integrity path:

- Version the style-revision payload so new records snapshot the strict
  `TechPackRecord`, and calculate their digest over that complete payload.
- Keep strict parsing and verification for both historical payload v1 and new
  payload v2. V1 retains its old exact key set and byte identity; V2 requires a
  valid style/recipe-bound T01 child and the exact new key set.
- Thread T01 snapshots through all revision creation paths: workflow baseline
  seeding, design revision commits, new regular/custom styles, and
  package-generated missing-history/copy revisions.
- On load and save, verify that a v2 revision head binds both current design
  and T01. A changed design or T01 record must append exactly one child of the
  stored head, and the transaction must fail closed on a stale project/style
  revision or stale immutable head. T01-only revision behavior is exercised
  through the repository contract; the editor remains S767.
- Prove new-v2 digest sensitivity/determinism, v1 read/digest compatibility,
  package backup/copy behavior, head-to-style binding, append-only save rules,
  and concurrent/stale-write rejection.

Expected implementation ownership: `src/ui/style-revisions.ts` and its tests;
`src/ui/project-workflow.ts` and its tests; `src/ui/project-repository.ts` and
its tests; and `src/ui/project-package.ts` and its tests, only where the exact
revision payload or its persistence contract requires it. Update
`ARCHITECTURE.md`, `PROJECT-STATE.md`, the goal ledger and the S766 exit packet
at the boundary. Add S766 evidence only through the validated Control Center
command layer.

## Acceptance and gates

1. New style-revision payloads use a strict, explicitly versioned shape that
   contains the exact T01 child and includes it in deterministic RFC 8785 /
   SHA-256 content identity.
2. Previously stored v1 payloads parse and verify with their original digest;
   existing frozen-output manifests continue to reference those unchanged
   revision digests. V1 payloads do not acquire default T01 content.
3. Every new revision creation path includes the current style's exact T01
   record. Package-created baselines and copied histories preserve both T01
   content and new revision-v2 identity.
4. V2 revision heads must match the saved style's design and T01. T01-only or
   design changes require one immutable child with the exact prior head as
   parent. Existing project-revision and head compare-and-swap checks reject
   stale writers without partial persistence.
5. Focused tests cover versioned parsing, fixed historical-v1 digest fixtures,
   v2 digest tampering/sensitivity, workflow creation/restore, package
   backup/copy and repository stale/concurrent writes. Every changed
   production module reaches 100% statement, branch, function and line
   coverage. TypeScript, the Control Center suite, protected export identity
   and `git diff --check` pass. Preserve the existing package format versions
   and all eight protected legacy export baselines.
6. Browser/rendered output and the full global suite are not due for this
   data-integrity slice. The integrated 100% global gate remains at S780.

No schema-v1 T01 changes, editor or editing UI, costing, output layout,
generated export, format migration, package-format bump, supplier/source fact,
physical-fit claim, production claim, new recipe or launch spending is
authorized here. V1 digests are immutable; any incompatibility requires a new
numbered correction slice, never a baseline move or weakened parser.

No product decision is blocking: v1 stays byte/digest compatible, v2 adds the
current strict T01 child, and stale writes fail closed. Revision creation and
verification are coupled across the workflow, repository and package paths,
so no independent low-risk delegated task is safe. External-agent wait: 0;
maintainer-decision wait: 0. This boundary is conditional on the above gates;
re-estimate only if a concrete compatibility or concurrency failure changes
its scope.

## Single next action

Implement payload-v2 T01 snapshots, preserving verified payload-v1 history.
At exit, write the S766 result/verification packet, replay digest-bound board
evidence to G05-T01 and EPIC-18, commit one `Slice 766:` change, and bind its
full SHA and resulting board revision in the S767 start packet. T01 editing
remains the next separately bounded slice.
