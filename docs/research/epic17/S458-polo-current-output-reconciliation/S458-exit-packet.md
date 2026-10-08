# G04 V02 — Polo current-output and residual reconciliation — Slice 458 exit

## Disposition

The Polo 0.68 cm hold reason repeated in the S457 handoff, board and current-state summary is stale and incorrect. The approved S351 exception applies to exactly the source-mapped Polo `Sleeve-cap ease` relation when its same-revision arclength projection validates; it does not relax the 0.25 cm gate for other relations. The current S458 production replay reports zero diagnostics for this exact exempted relation and zero other output issues.

S458 replayed the canonical S331 17-option fixture through the current live compiler, SVG renderer and Chromium. All 17 exact option rows produced front/back output (34 faces), each pair sharing one fresh `live-draft:polo:S458:<caseId>` revision. The audit found 0 compiler/renderer/browser issues, 0 Polo sleeve-ease residual diagnostics, 0 source/colorway revision mismatches, 0 path-identity differences from the qualified S434 Polo output, 13 keyed POM markers and full-text schedule rows on every front, and 0 full-label rectangle overlaps across 660 source labels / 153 key glyphs. The schedule correctly has 16 rows in ordinary configurations and omits only the source POM absent when `sideVentDepth=0`. The exact full-label method is applied to actual S458 SVGs, not reconstructed geometry.

Codex reviewed current default front/back and relevant extreme-option Chromium renders. The output carries the previously approved source-bound Polo mappings: keyed POMs and full-text schedule, approved construction callout marker adjustments, same-revision sleeve-cap arclength projection with the exact S351 relation exception, and source-bound collar/stand/placket display rules. No new source defect or mapping conflict was found in this replay. Rendered SVGs, PNGs, raw matrices and the auditable scripts are preserved alongside this packet.

## Holds and acceptance

This closes the stale residual claim; it does **not** release the 34 Polo face requests or close V02. S458 intentionally retains those face-level requests as pending the integrated seven-recipe/all-supported-option acceptance review, with all existing V02 criteria unchanged. Current face tally remains 112 accepted / 34 pending (73 configurations / 146 faces). V02 remains In Progress; V03 remains Backlog and gated behind V02. Polo's local checks are evidenced as passed at this slice; the all-seven integrated decision is outstanding. Do not reintroduce a 0.68 cm-vs-0.25 cm blocker. Keep the 0.25 cm gate for all non-exempted relations.

No production code, pattern geometry, stitch graph, POM definition, export behavior, byte identity, or acceptance threshold changed. There is no physical-fit, factory-acceptance or production-readiness claim. The user-approved front/back view decisions remain limited to view presentation and are validated against unchanged source paths.

## Verification and evidence

- Actual renderer / Chromium replay: 17 options, 34 faces; 0 issue rows and 0 browser errors (`S458-current-output-matrix.json`; source runner `render-current.mts`).
- Revision/colorway/path/residual audit: 17 same-revision front/back pairs; 0 exact S351 residuals; 0 revision mismatches; 0 source-path differences from S434 (`S458-output-identity-audit.json`; `audit-current-output.mjs`).
- Actual-SVG text audit: 17 fronts, 660 source labels, 153 key glyphs, 13 keyed schedule rows per front, 0 rectangle collisions (`S458-full-label-clearance-matrix.json`; `review-label-clearance.mjs`). This is not a substitute for the all-seven visual/topology acceptance review.
- Selected current default and edge-option Chromium PNGs visually inspected; all 34 images are retained in `rendered-production/`.
- Board command-layer replay: start 2760→2762; exit/evidence reconciliation 2762→2773. The exact final reconciliation commands are preserved in `S458-board-reconciliation-commands.json` and `S458-v02-board-summary-command.json`; start commands remain in `S458-start-board-commands.json`. Board validation passes at revision 2773; `npm run control-center:test` passes 42/42; `git diff --check` passes. The first Control Center runs exposed stale assertions tied to the superseded S457 summary; after diagnosing and updating those board regressions, the focused suite passes. No production changes means no changed-code coverage, build, DXF or protected-export gate is triggered by S458. Full global coverage remains at the settled integrated candidate.

## Slice accounting and next action

Started 2026-10-08 03:18 UTC from clean S457 `e602a6722a769edf82a8b666a34e00094d9ebdcc`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Verified closeout at 03:30 UTC (12m elapsed): production implementation 0m; focused renderer/output and board verification 4m; Chromium visual review 2m; durable docs/board updates and regression repair 6m; external-agent waits 0m; maintainer-decision time 0m. Initial focused board tests found stale expected-summary assertions, which were updated and then passed 42/42. No new decision is required.

**Next action:** reserve S459 from refreshed Git/board state and perform the integrated seven-recipe, supported-option front/back V02 acceptance review, including the approved Polo front/back output mappings and remaining manual-quality finding disposition. Close V02 only if all applicable criteria pass; then begin the rights-reviewed V03 receiver/profile/round-trip work. Preserve all-seven scope, V02-before-V03, legacy DXF behavior, protected export identities and all stated non-goals.
