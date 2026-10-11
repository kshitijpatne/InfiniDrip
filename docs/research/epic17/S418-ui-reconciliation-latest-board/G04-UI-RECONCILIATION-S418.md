# G04/UI recommendation reconciliation against latest board — Slice 418

## Start boundary and authority

- Started 2026-10-07 09:03:48 UTC from clean S417 `06e0ca492d12613b6069d029879f401c711e81bf` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice is 417; S418 is uniquely reserved. Canonical board is revision 2428, with EPIC-17 In Progress, G04-V01 Done, V02 In Progress and V03 Backlog. Goal remains active and covers admitted V01→V02→V03, gates and safe merge. Usage at start: 43% primary / 7% weekly.
- Read current `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `docs/planning/EPIC-17-ADMISSION.md`, latest S417 packet, canonical board, `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, `UI-ENHANCEMENT-EPIC17-NOTE.md`, and relevant existing S354/S385 reconciliation evidence.
- The exact UI recommendation reconciliation and 29-card registration were already completed at S354; S385 preflighted/replayed all 29 as identical against board revision 1997. This slice verifies the same approved command sequence against the latest S417 board revision 2428 and confirms the G04 disposition. No scope is reopened and no new UIQ work is admitted.

## Scope and acceptance

- Against the revision-2428 board, preflight all commands in `docs/planning/UI-ENHANCEMENT-BOARD-COMMANDS.json` on a board clone using the validated command layer. Compare each existing item/evidence/comment to the approved command identity/content; skip identical entries, apply only genuinely missing approved entries through the validated layer, and stop on any conflicting identity.
- Reconcile current G04 boundary: source-bound geometry/construction, piece and revision identity, exact POM anchors/targets, applicable artwork overlays and inspection readability remain admitted V02 requirements. Existing source/render evidence determines what passes; current Woven/Polo holds and all-seven acceptance remain. Typography, presentation panels, toolbar, catalog polish, 3D, tech-pack forms, and assembled/oblique/inside views remain outside G04 under their own UIQ/G05/G09 packets.
- Confirm all UIQ items remain Backlog, EPIC-17 has no UIQ dependency, V02/V03 gates and current holds are unchanged, and the stale local-status command set is not applied. No production source, tests, gate, board scope, or UI package status changes unless a genuinely missing identical additive command must be replayed.

## Required checks and non-goals

- Preserve the full global coverage/build/export/browser gate for the settled integrated Epic/PR candidate; this is planning/board-only. Run validated-command preflight/replay, the focused Control Center suite, and `git diff --check`.
- No renderer duplication, cosmetic expansion, V02/V03 gate relaxation, production UI implementation, candidate integration, shared app/view/persist/style changes, new G04 closure dependency, pattern/stitch/POM edits, status reset, stale board replacement, physical-fit/factory/launch/hosted-service claims, or V03 commencement.
- No safe delegated ownership: this is a small identity-bound governance replay on one canonical board; Codex retains integration/review.

## Start board record

Validated start replay: `S418-start-board-commands.json`, board revision 2428→2431.

## Exit evidence

Pending.

## Reconciliation and exit evidence

### G04 scope mapping

| Area | Disposition at S418 | Boundary |
|---|---|---|
| Source-bound construction geometry and technical-flat primitives | Already admitted and implemented incrementally in G04 V01/V02. | Continue exact piece, edge, landmark, face orientation, multiplicity, seam/mark role, layer order, option topology and same-revision checks; one production renderer only. Any unresolved topology or visible-join conflict remains held. |
| Piece/revision identity | Existing V02 contract. | Bind every view primitive, overlay, POM anchor and emitted result to the same pattern/style revision. |
| Exact POM anchors/targets and readable callouts | Existing V02 acceptance; current blockers remain in scope. | Source-bound values/methods/targets, inspect markers/leaders/labels in actual rendered options. Do not drop or relabel POMs or relax the collision gate. |
| Artwork/colorway overlays | Existing V02 behavior only where recipe/face supports it. | Validate mapped source role, region, revision, placement and closures in actual output; no artwork schema/acquisition expansion. |
| App-wide typography, panel styling, guidance, toolbar and catalog presentation | Outside G04 critical path; independent UIQ cards remain Backlog. | Own admission and UIQ-GATE where applicable; registration is not implementation authorization. No contributor edits shared production host/view/journey/persistence/style files under these cards. |
| Recipe thumbnails, production-pack forms, assembled/side/oblique/inside views | Later work outside G04. | G06/G05/G09 with their own admissions; retain established post-G17 deferrals. |

This matches S354's accepted reconciliation and the current admission/roadmap. The seven-recipe V02 criterion, current holds, exact output evidence, V02-before-V03 sequence, CAD rights/round-trip requirements, and all export/coverage gates are unchanged. This S418 slice does not produce any new G04 decision or remove any G04 blocker.

### Current-board additive replay

- Latest preflight base: board revision 2431 (S418 start evidence/comment already validated and present).
- `preflight-replay-ui-board.mjs` applies the full 29-command sequence to a cloned latest board through `applyBoardCommand` and performs canonical writes only for non-identical approved entries through `executeBoardCommand`.
- Result: 29/29 existing commands matched exact approved identity/content; 29 skipped; 0 replayed. The board remained revision 2431 during UIQ replay. All 14 UIQ items remain Backlog; EPIC-17 and G04-V02 remain In Progress; G04-V03 remains Backlog; EPIC-17 has no UIQ-GATE dependency. No local-status command file exists at the referenced path in this checkout, and none was applied.
- The canonical board was then updated only through validated `executeBoardCommand` exit commands, linking this packet/replay result and recording the no-new-dependency disposition. Start/exit revisions: 2428→2431 / 2431→2435.

### Verification and slice timing

- `node --check` passes for the replay script. Identity-aware preflight/replay reports 29 skipped, 0 replayed and no conflicts. `npm run control-center:test` passes 42/42 against the closed S418 board state; `git diff --check` passes.
- This changes no production code, tests, UI implementation or acceptance. No changed-production coverage/full build/export/browser gate is due; the full repository gate remains scheduled for the settled integrated Epic/PR candidate.
- Elapsed approximately 3 minutes (09:03:48–09:06 UTC): authority and latest-board reconciliation 1m; clone preflight/replay 1m; durable packet/board/state/context and focused verification 1m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Disposition:** S418 is a current-board duplicate-skip verification of the already-completed S354 planning reconciliation; it adds no implementation authority, UIQ dependency or G04 acceptance change. The only next G04 action remains review of an independent V02 blocker, with all current holds preserved.
