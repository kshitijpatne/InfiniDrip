# EPIC-17 / G04 current blocker and board reconciliation — Slice 448

## Start boundary

- Started 2026-10-07 23:00:59 UTC from clean S447 commit `38c7deee6c636c823e4dfef7fcc76dd374663f71` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. `git log --all` confirms S447 is the highest assigned slice; reserve S448.
- Canonical Control Center revision 2679: EPIC-17 and G04-V02 In Progress; V01 Done; V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces. The admitted goal is active and matches the required V01→V02→V03 completion and safe merge.
- Usage at start: 48% primary / 22% weekly; ordinary work allowed.

## Scope and authority

Reconcile the live Epic and V02 board descriptions with the latest verified S443–S447 state, record the maintainer's latest decision to preserve S370 Woven band positions and retain the affected back holds, and make the exact V02/V03 blockers durable on the canonical board. This is documentation and board maintenance only. No production code, pattern geometry, projection metadata, view acceptance, option, source stitch, face status, or export baseline may change.

## Accepted scope and limits

- Preserve every admitted V02 criterion, including all-seven recipe coverage, same-revision joins/topology, readable/rendered output, and the 0.25 cm residual gate. Preserve V02-before-V03, legacy DXF behavior and protected export byte identities.
- Preserve S422's continuous Woven body neckline and all 28 front holds. Preserve the maintainer's S442 choice: S370 detached-band detail positions remain fixed and all 28 Woven backs remain held.
- No physical sampling, fit/factory acceptance, production-readiness claim, new recipe, G05/G09/D04 work, supplier contact, launch spending, hosted service, or broad UI work.
- G04-V03 must not start before all-seven V02 passes. Its rights-cleared receiver/profile and representative import/round-trip evidence remain required.

## Verified evidence to reconcile

- S443's exact Claude Opus 5.5 xhigh research plus independent Codex source/output check found no source-backed Woven front or back fix under the current decisions. Its completed result and evidence are durable in `S443-claude-output.txt` and `G04-WOVEN-V02-SOURCE-EVIDENCE-REVIEW-S443.md`.
- The front hold is source/output-bound: supported `standHeight h=1.5–3.5 cm` and `collarLeafDepth d=4–8 cm` imply `d-h >= 0.5 cm`; the approved S359 collar projection crosses offset 0 while S422 preserves the complete body neckline. S417/S437 show two contacts in each of 28 fronts. S410 confirms production painter order is already the tested full-seam-over-collar order; S422 rejects clipping because it interrupts the continuous seam.
- The back hold is source/output-bound: exact same-revision S440/S441 evidence finds the unmirrored pose crosses; the local-Y pose clears those crossings but collides with both fixed S370 band-detail footprints in all 28 options and expands the viewBox by 41.1474–44.863 cm. The maintainer explicitly chose to keep the S370 positions and holds.
- S447 screened 13 in-memory source-owned taper values across all 28 Woven options; every candidate retains sleeve-pair crossing and body/yoke fill penetration. No further taper sweep is justified.
- Polo has no current local output blocker in S436; its 34 faces remain held under the all-seven gate. Current integrated tally remains 56 accepted / 90 held.
- V03 remains gated. S421 found no qualified no-cost industrial apparel receiver; rights, profile selection, and actual round-trip remain to be proven after V02.

## Board reconciliation plan

- Update only the EPIC-17 summary and G04-V02 description to point at S443/S446/S447 as current evidence, state the two Woven hold classes and the latest S370 decision, remove stale implication that prior Polo callout defects are current blockers, and retain every acceptance, status, dependency and tally.
- Link this packet on G04-V02 and EPIC-17 through the validated Control Center command layer. Do not change statuses or acceptance criteria.
- Focused verification: Control Center regression tests, canonical board read/schema validation, command preflight/replay, packet/script syntax checks, and `git diff --check`. No production test, build, coverage or export gate is due for this documentation/board-only slice.

## Decision boundary / next action

The existing approved choices leave no verified view-only fix for the two Woven blocker classes. Do not silently change source geometry, projection, seam continuity, band layout, or acceptance. After this reconciliation, the next work requires a concrete maintainer-authorized Woven source-design proposal or an explicit revision to one of the controlling constraints. No implementation or face release is authorized by S448.

## Exit evidence

### Board reconciliation

- Before S448, the EPIC-17 and G04-V02 descriptions were still led by S435/S436 summaries even though their linked recent packets documented later Woven no-go evidence. The summary also repeated completed Polo callout work as if it were a current blocker.
- S448 updates only the EPIC-17 and G04-V02 narrative descriptions and links this packet as verified evidence. The descriptions now identify the exact remaining Woven front/back blocker classes, cite the controlling user decisions and S443/S446/S447 results, state that Polo has no current local output blocker but remains held under all-seven V02, and retain the V03 dependency/rights/round-trip gate.
- Start-board commands preflighted and replayed through `applyBoardCommand`/`executeBoardCommand`: revision 2679→2681. Exit preflight/replay: revision 2681→2686. The first Control Center run exposed historical-summary assertions; S448 preserved those exact legacy phrases while keeping the new current-state summaries authoritative through additive validated command replays 2686→2688→2690→2691→2692→2693→2694→2696→2697→2698→2699. EPIC-17 and G04-V02 records and the EPIC-17 summary card now agree on the current evidence. EPIC-17/G04-V02 remain In Progress, V01 Done, V03 Backlog; tally remains 56 accepted / 90 held across 73 configurations / 146 faces. No face or criterion changed.

### Verification and closeout

- The first `npm run control-center:test` run had four failures because replacing current-state descriptions dropped historical strings asserted by board regression tests. The captured output is `initial-control-center-test.log`; diagnosis confirmed no behavior or evidence-link failure. Descriptions were corrected additively. An intermediate parallel run also reported the server test worker failed; the isolated server suite passes 4/4. After the EPIC summary card was also brought current, affected `board.test.mjs` passes 18/18 and the final serial full Control Center suite passes 42/42 (`final-control-center-test.log`). Canonical `readBoardFile()` validates board revision 2699 and exact descriptions/evidence references. Every S448 board command preflight and replay script passes; all S448 `.mjs` scripts pass `node --check`; `git diff --check` passes.
- This is a documentation/board-only slice. No production source or tests changed; focused production tests, changed-code coverage, build, output replay, export-identity gate, and full repository coverage remain reserved for the settled integrated Epic candidate.
- No independent delegated work was safe: reconciling a coupled Epic/V02 summary and its evidence is a single-owner board operation. External-agent waits: 0m.
- Elapsed 2026-10-07 23:00:59–23:09:42 UTC (8m43s): production implementation 0m; source/evidence reconciliation ~1m20s; packet/state/context/board updates ~3m45s; focused verification/board-command diagnosis ~3m38s; external-agent waits 0m; maintainer-decision time 0m.

### Remaining blocker and next action

- Current tally and holds are unchanged. The two Woven blocker classes prevent all-seven V02; V03 must remain Backlog. S448 does not authorize a source-design proposal, semantic mapping change, acceptance exception, or implementation.
- **Next action:** obtain maintainer authority for a bounded, proposal-only Woven source-design study (no production edits, output mapping changes, acceptance changes, or face releases). Return exact source geometry/topology impacts for approval before implementing anything. If that authority is not granted, preserve the current holds and report that G04 cannot complete under the present constraints.
