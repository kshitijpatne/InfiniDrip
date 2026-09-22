# Slice 187 — Control Center item creation and pre-garment planning

_Verification date: 2026-09-22_

## Result

Actual use of the local Control Center exposed that existing items could be
edited but new work could not be created in the UI. Slice 187 adds a validated
`createItem` command to the shared command layer and a local UI form. New work
starts in `Backlog`; the first history entry records actor, role, time, and
reason. UI and CLI continue to mutate the canonical board only through the
shared validator and atomic persistence path.

The maintainer-approved no-cost sequence is documented in
[`../planning/PRE-GARMENT-EXECUTION.md`](../planning/PRE-GARMENT-EXECUTION.md)
and recorded as nine explicit, sequential board items:
`PREQUEUE-PHASE-01`–`PREQUEUE-PHASE-09`. Each has an owner, priority, acceptance
criteria, and a dependency on the preceding phase. Phase 1 records the
maintenance rule: update the relevant phase status, attach evidence, and leave
a concise completion note for each completed implementation slice. The next
garment queue stays gated on Phase 9 and explicit maintainer approval.

## Verification

- `npm run control-center:test`: 25/25 tests passed, including command
  validation, rejected inputs, API persistence, and item-creation rendering.
- `npm run coverage -- --maxWorkers=1 --minWorkers=1`: 105/105 files and
  1,421/1,421 tests passed; statements, branches, functions, and lines are all
  100%. Protected export checks passed: 8/8 regression hashes and 9/9 export
  identity tests.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed; Vite transformed 105 modules.
- Live local-browser use: the item form rendered, filtering did not discard its
  draft, cancellation returned to the selected item, and the UI created all
  nine phase records through revisions 1–9. The Phase 1 item then moved from
  `Backlog` to `In Progress` through the UI at revision 10. The final Phase 1
  evidence was attached at revision 11, a completion note recorded at revision
  12, and reviewer-guided `Review` and `Done` transitions completed at
  revisions 13 and 14. The final canonical board has 27 work items, 25
  evidence records, and Phase 2 queued behind completed Phase 1. A duplicate
  Phase 1 ID was rejected in the UI with a visible error while the board stayed
  at 27 items/revision 10 and the entered draft remained available.

No export baseline or garment behavior changed. No account, database, cloud
sync, hosted service, paid/recurring capability, or remote artwork fetch was
introduced. Existing untracked local artifacts were preserved.
