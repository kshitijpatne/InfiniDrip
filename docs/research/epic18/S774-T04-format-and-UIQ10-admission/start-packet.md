# Slice 774 — T04 format decision and UIQ-10 admission

**Status:** Starting. **Start:** 2026-10-13 05:02:34 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `e673e282855c14d39db41d198b9a0272f632a84b` (`Slice 773:
reconcile T03 pattern references and review recipes`). Fresh
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor. The
worktree is clean; the highest assigned slice on active refs is 773, so 774
is the next unique slice. Canonical board revision 4611 records G05-T01/T02/T03
Done, EPIC-18 In Progress, G05-T04 Backlog, and UIQ-10 Backlog.

## Authority and goal

The maintainer admitted EPIC-18/G05 at Slice 762. The current sequence is
`docs/planning/EPIC-18-S765-RESEQUENCING.md`, which moves T04 format/import
selection and UIQ-10's separate admission to S774 after accepted T01–T03.
S773 exit and replay evidence confirms the precondition at board revision
4611. This packet is limited to the S774 decision and admission work; it does
not authorize the S775 writer or S776 UIQ-10 implementation.

## Scope

1. Inspect the current `TechPackRecord` parser/revision contract, PDF writer,
   local project-backup ZIP and asset paths. Select a portable editable output
   format and define strict import, revision-match, preview/diff, attachment,
   error and round-trip semantics. Keep it additive and separate from project
   backup and legacy export formats.
2. Define the production-pack section and preset matrix, mandatory disclosure
   content, and the simple/difficult style fixtures from observed repository
   structure. Preserve unresolved fields as unresolved and do not fabricate
   construction or supplier facts.
3. Write a separate bounded UIQ-10 admission using the now-stable T01–T03
   records. Specify exact data inputs, screen ownership/files, fallback,
   preserved behavior, selected sections, supported viewport/render evidence,
   focused/global coverage gates, and exclusions. Keep UIQ-10 Backlog.
4. Reconcile the active UI sequence and project checkpoint links to S774 while
   preserving the hash-bound S762 admission as historical evidence.

## Expected output and acceptance

- A decision record names the chosen format, envelope/files, section matrix,
  revision and import contract, limitations, fixture rationale, and the gates
  deferred to S775–S780.
- UIQ-10 has a separately linked and hash-verifiable admission. Its board card
  remains Backlog and UIQ-09/EPIC-19 remains unchanged.
- The active plan, project state, architecture and context index agree that
  S773/T03 is complete at revision 4611 and S774 is active; the active UI
  sequence names S774 for UIQ-10 admission. Do not rewrite hash-bound S762
  evidence or its original admission.
- The Control Center accepts all evidence/status replays; its focused suite
  passes, hashes resolve, and `git diff --check` is clean. This decision-only
  slice changes no production module, so no production-code coverage gate is
  claimed. S775 must add focused round-trip coverage and review actual files.
- Commit exactly one `Slice 774:` change after the decisions and replay
  evidence are complete. Record time spent on decisions, document work,
  focused verification, and any external/maintainer wait separately.

## Explicit holds, risks, and delegation

- No output writer, importer, schema migration, revision-payload change, PDF
  change, approval/freeze behavior, export baseline move, or broad UI work in
  this slice.
- No supplier contact, quotes, paid tools/licenses, hosted services, network
  import, new recipe, physical sewing/fit, factory acceptance, or production
  readiness claim.
- Treat the project ZIP as a whole-project backup only. Do not conflate it with
  a style-scoped tech-pack exchange format.
- S774's format/import and UI data contracts are coupled to the same
  revision-bound record APIs; no safe disjoint implementation/research owner
  is available without duplicating decisions. Codex retains ownership; no
  external coding agent is assigned.
- Unresolved facts remain explicit. Byte-for-byte determinism is promised only
  where the decision packet names it and is later verified; S780 remains the
  global coverage/build/browser/Electron/output gate.

## Start verification

- Branch: `codex/epic-18-g05`; starting commit and clean state verified.
- Fresh `origin/main` ancestry verified; no later S774+ commit or open G05 PR
  found.
- Board revision 4611 and the T01/T02/T03/T04/UIQ-10 statuses above were
  inspected in the active worktree; the older shared checkout is separate and
  remains untouched.
