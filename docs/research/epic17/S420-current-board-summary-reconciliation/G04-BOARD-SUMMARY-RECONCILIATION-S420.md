# G04 current board summary reconciliation — Slice 420

## Start boundary and scope

- Started 2026-10-07 09:23:40 UTC on `codex/epic-17-g04` from clean S419 `c90e89f0a677111762a47de6b8fa8692b720341c`; refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 419; S420 is reserved. Canonical board revision is 2443. EPIC-17/G04-V02 is In Progress, V01 Done, V03 Backlog. The active goal still matches the admitted EPIC-17 objective. Primary usage was 46%; weekly 7%.
- The active state packet is S419, but the canonical EPIC-17 and G04-V02 descriptions lag at S413. Reconcile only those summaries to the latest verified repository/board state and the maintainer's latest explicit confirmation of S406's collar-over-plackets mapping.
- Do not change source, tests, acceptance, status, face holds, goal objective, or any pending decision. Keep the S419 segmented Polo H-ring choice and S410 Woven neckline/base-seam choice pending. Do not treat approval of S406 collar-over-plackets as a response to S410.

## Acceptance

- Update EPIC-17's canonical description, its summary work-item description, and G04-V02's description through the validated Control Center command layer only.
- Keep the last verified integrated tally at 56 accepted / 90 held across 73 configurations / 146 faces; no S414–S419 slice changed acceptance or released a face.
- Record current verified blocker evidence: all 34 Polo faces remain held at 0.68 cm RMS versus the maintainer-fixed 0.25 cm gate plus outstanding callout/readability checks; all 56 Woven faces remain held. S417 classifies source-joined endpoint contacts, the approved S406 collar/placket order, and the distinct S410 neckline contact. S381 does not support an artificial back-hem gap. S419's segmented H locator remains diagnostic and awaits approval.
- Preserve all-seven V02, V02-before-V03, legacy DXF, protected export identities, V03 rights/receiver/round-trip gates, physical/factory claim boundaries, and the G05/G09 exclusions.
- Link the S420 packet and reconciliation evidence to G04-V02 and EPIC-17. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the admission progress log. No production gate is triggered by these documentation/board-only changes; run Control Center tests and `git diff --check`.

## Start board record

The validated start replay is recorded in `S420-start-board-commands.json`; it begins at board revision 2443. No board file is edited directly.

## Exit evidence

The validated start replay preflighted on a clone at board revisions 2443→2446. The exit replay preflighted on a clone reconstructed from committed S419 plus the S420 start commands at 2443→2453, preserving every Epic and work-item status. The canonical board was advanced 2446→2452 through the validated replay, then the exit evidence was linked to the EPIC-17 summary card at revision 2453 through the validated CLI. No board JSON was edited directly.

The EPIC-17 Epic record, its summary card and G04-V02 description now reflect S419/current hold evidence and the maintainer's latest confirmation of S406's already-implemented collar-over-plackets mapping. They explicitly preserve the distinct pending S410 neckline/base-seam choice, the unapproved S419 segmented H locator, all 90 held faces, and the V02/V03 ordering and acceptance criteria. All EPIC/work-item statuses are unchanged.

The first `npm run control-center:test` run failed two stale board-description assertions and a follow-up focused run found additional assertions for the same superseded descriptions. This was expected summary drift, not a status/evidence regression. Updated those checks to assert the current S419 summaries while retaining all historical S361 evidence-link and comment assertions. `node --test ops/control-center/app/board.test.mjs` passes 18/18, `npm run control-center:test` passes 42/42, canonical board schema validation passes at revision 2453, and `git diff --check` passes. No production code changed; no full repository gate is due at this documentation/board-only boundary.

Elapsed 3m50s (board/current-state review and docs 1m30s; focused verification and failure diagnosis 2m20s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m).

**Next action:** continue the unresolved, option-wide V02 work only after the exact pending maintainer decisions are resolved; preserve all face holds and the V02/V03 gate.
