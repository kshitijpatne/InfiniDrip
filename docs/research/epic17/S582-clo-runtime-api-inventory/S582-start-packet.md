# EPIC-17 / G04 V03 — CLO runtime API inventory — Slice 582 start

## Verified start

- Start: 2026-10-09 05:27:44 UTC from S581 commit
  `207ef4d946be09b2c26afc7d4f481376ab624eef` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and remains an ancestor; worktree is clean.
- Canonical board revision 3441: G04-V02 Done, G04-V03 In Progress.
- Highest assigned slice is 581; reserve unique S582. Goal record is active
  and remains the EPIC-17/G04 objective through safe merge. Ordinary usage is
  available (primary 9%, weekly 69%).
- CLO 2026.1.310 remains open. Product-development trial use and local-only
  handling of the DXF exchange were confirmed in writing and recorded in the
  project decision record; no further confirmation is needed.

## Objective

Run one read-only exact-build inventory of the public names exposed by
`pattern_api`. Save the public name list, selected geometry-related names,
runtime version shown by the application, and query exceptions only under
`C:\G04-CLO-DXF-Exchange\S582-clo-runtime-api-inventory\Evidence`.
The inventory is selected because S581 proved that a documented
`GetInternalShapeInformation` method is absent from the installed module. It
will establish which potential line/outline/shape getters this exact build
actually exposes before choosing another method-specific query.

## Scope and safety boundary

- This is namespace introspection only: `dir(pattern_api)` and serialization
  of returned names. It calls no pattern getter, setter, importer, exporter,
  project save, simulation, cloud operation, or undocumented name.
- Do not invoke any candidate method in this slice. Match the observed names
  against first-party CLO documentation first; a later exact-build query must
  have its own bounded slice and evidence.
- Do not interpret an exported API name as proof it works, returns source CUT
  geometry, has a particular unit/frame, labels CUT/SEW, or establishes which
  interchange stage changed a contour.
- Keep the 0.001 cm geometry gate, all-seven V02, receiver/profile and
  round-trip gates, legacy DXF behavior, protected export identities, rights,
  and claim boundaries unchanged. No V03 gate can pass from an API-name list.
- Use C: only for all CLO input, output and screenshots. Leave CLO running.

## Acceptance and verification

Pass this slice only if one live application run returns a complete JSON list
of public module names, records query/build errors without obscuring them,
and a live screenshot corroborates the current editor/run. This slice records
capability discovery only. V02 remains Done; V03 remains In Progress. No
product source or output changes.

At exit, hash the JSON and screenshot, review the exact relevant public names,
preflight/replay the exit board commands, run `npm run control-center:test`,
schema/script checks, and `git diff --check`; update `PROJECT-STATE.md` and
`CONTEXT-INDEX.md`. No full repository gate is due for this evidence-only
slice. Codex retains review/integration. No safe independent task exists for
this one live-app inventory; do not create a delegated packet for it.

## Next-action rule

Choose a later documented getter only if the namespace actually exposes it
and first-party documentation supports its behavior. If no relevant getter is
exposed, stop this route and select a different remaining V03 acceptance item
from the existing evidence; do not guess names or repeat unsupported queries.
