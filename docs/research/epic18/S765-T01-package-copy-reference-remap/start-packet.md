# Slice 765 — T01 package-copy provenance-reference correction

**Status:** In Progress. **Start:** 2026-10-12 21:18:07 UTC. **Reserved
slice:** 765, confirmed unused after S764 commit
`238c29f1f71bf3e74ee3d74ba5d97766e07d9f2a`. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. Fresh fetch
confirms `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an
ancestor. Canonical board starts at revision 4546 with EPIC-18 and G05-T01 In
Progress, G05-T02 and UIQ-10 Backlog, and UIQ-09 Backlog pending EPIC-19.

## Authority and finding

This separately numbered S764 follow-up is authorized by the standing rule in
`AGENTS.md` that a discovered correction receives its own next unique slice.
It amends the conditional execution sequence in
`docs/planning/EPIC-18-ADMISSION.md`; the unchanged T01 acceptance rule requires
copy import to remap G02 revision identity through the package maps.

Final review of S764 found that `remapTechPackForCopy` maps the record's direct
`revisionId` and style identity, but leaves nested field-level
`inheritedFrom.revisionId` links unchanged. Such links occur in T01 cover,
material, BOM, and colorway field envelopes. S764's copy test checks the direct
link and approval reset but does not include an inherited-source reference.
The copied pack can therefore retain a revision identifier that should point
at a revision included and remapped in the copied package history.

## Scope and exact behavior

Update the package-copy transformation and focused tests only:

- Traverse every T01 field envelope in the copied `TechPackRecord`.
- If an `inheritedFrom.revisionId` is present in the package's
  `revisionIds` map, replace it with the corresponding copied revision ID.
- Preserve an `inheritedFrom.revisionId` absent from that map as an external
  source-lineage reference. It is attribution to a revision outside this
  package, not the copied style's own revision binding; do not invent a local
  mapping or erase provenance.
- Keep the S764 behavior: remap the record's style identity and direct G02
  binding; fail closed when the required direct binding cannot map; reset
  approval to DRAFT on copy; preserve all other pack content. Do not mutate the
  validated source archive.

Only `src/ui/project-package.ts`, its test, this evidence, the admitted slice
sequence/current status, and board start/exit command records are in scope.
No T01 schema, SaveFile/package version, style-revision payload/hash,
repository, migration, UI, output, export or source-fact change is authorized.
S766 remains T01 style-revision payload integration; all later boundaries move
forward one position per the updated admission packet.

## Acceptance and verification

1. Copying a valid pack maps inherited-source references in representative
   cover, material, BOM and colorway envelopes to the matching copied revisions
   when those revisions are present in the package.
2. A reference outside the package revision map remains byte/value-identical as
   explicit external provenance; it is not mistaken for the copied style's own
   revision link.
3. Style identity, direct revision binding, approval reset, pack facts,
   revision chain, exact non-copy restore and original package data retain S764
   semantics. Copying never mutates the source archive.
4. Focused package tests cover mapped/unmapped references and malformed or
   unmappable direct identity behavior. `src/ui/project-package.ts` has 100%
   statement, branch, function and line coverage. Typecheck, Control Center
   and diff checks pass; protected export hashes and package manifest versions
   remain unchanged.
5. No generated/rendered pack, browser or full global suite is due: this slice
   changes copy serialization only. The settled full gate remains S780.

The S764 exit report remains a correct historical boundary report; this later
audit adds a separately tracked correction and does not rewrite its
digest-bound evidence. S765 has no blocking product decision: the source
reference is remapped only when the exact source revision is present in the
package map, and otherwise remains external provenance. No independent
low-risk disjoint task is safe because all field envelopes share one
copy-normalization boundary. External-agent wait: 0. Maintainer-decision wait:
0.

## Next action

After the focused correction, replay digest-bound S765 exit evidence to
G05-T01 and EPIC-18. The single next action is S766: version the immutable
style-revision payload to include T01 while continuing to verify historical
payload-v1 hashes and using concurrency-safe saves. The full S765 commit SHA,
board revision and verification boundary will be recorded in the S766 start
packet.
