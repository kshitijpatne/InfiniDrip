# G04 V02 — Polo S351 eased-seam residual rule — Slice 432

## Start boundary and authority

- Started 2026-10-07 17:53:50 UTC from clean `985dc274abbf39e859d362adf21eefa5adb9e4a3` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 431; 432 is reserved. Board revision is 2550; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog.
- Maintainer explicitly approved the narrow S351 eased-seam residual rule in response to S431. Preserve the numeric 0.25 cm residual threshold for all other stitch relations and retain every other V02 gate.

## Scope and acceptance

Implement a fail-closed exception only for a Polo stitch relation whose label is exactly `Sleeve-cap ease`, when the exact same-revision projection map has already validated and the sleeve role contains the exact S351 `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH` representation. This rule recognizes that the approved view replaces each eased cap half with a normalized-arclength trace along its receiving armhole; the endpoint-only rigid residual is not an applicable metric for that displayed seam.

Accept this slice only if:

1. The 0.25 cm check continues to report every non-Polo residual and every other Polo stitch residual.
2. Malformed, stale, wrong-recipe, wrong-role, wrong-stitch, or otherwise invalid projection metadata does not suppress the residual.
3. Exact current Polo option fixtures compile/render through the real output path; output identities, mapped edge/revision evidence, closure, callouts and all other issue gates remain active. The residual rule alone does not accept a face.
4. Full 17-option/34-face rendered review has no new joins, crossings, overlap or readability defects attributable to this change. Any remaining issue keeps its face held.
5. Focused tests and changed-code statement, branch, function and line coverage are 100%. Protected export byte identities remain unchanged.

## Scope boundaries and risks

- No change to source pattern/cut geometry, stitch graph, authored ease, options, POMs, view mapping, or numeric 0.25 cm limit.
- No broad residual suppression: only the one exact, validated S351 `Sleeve-cap ease` relation may bypass the endpoint-only residual diagnostic.
- No other recipe or seam is exempt. Crossings, transform conflicts, wrong piece/revision, missing geometry, unreadable output, and all other V02 gates remain blocking.
- Preserve all-seven-recipe acceptance, legacy DXF behavior, protected export identities, and V02-before-V03. No face is accepted by approval or by this rule alone.
- Woven's 56 holds remain unchanged. V03 rights/profile and fixture round-trip gates remain downstream.

## Delegation

No safe disjoint code or output work is identified. The change touches the exact assembly gate, its tests, option replay and project decision record; Codex owns implementation and integration.

## Start-board record

`S432-start-board-commands.json` records this bounded approved implementation through the validated Control Center command layer. V02/V03 statuses and all existing face holds remain unchanged.

## Exit — narrow rule implemented; all Polo faces remain held

- Implementation: `src/render/technical-flat-assembly.ts` consults the Polo sleeve role's S351 metadata only when the complete current-revision projection map validates. The endpoint-only residual diagnostic is suppressed only for exact label `Sleeve-cap ease` and decision `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH`. A stale decision, other stitch label, other recipe, or invalid map retains normal residual behavior. No geometry, stitch graph, ease, POM, renderer threshold, or view mapping changed.
- Maintainer decision is recorded in `docs/PROJECT-DECISIONS.md`. It supersedes prior descriptions that treated this exact endpoint residual as an unconditionally applicable gate. It leaves the numeric 0.25 cm threshold in force for every other relation, and changes no V02 acceptance criterion or face status.
- Focused verification: assembly 17/17; focused assembly/live/projection/geometry suites 122/122; protected export tests 17/17. Changed production module statement/branch/function/line coverage is 100% (coverage report retained as `S432-assembly-coverage.log`). The first focused live suite had two stale assertions expecting the superseded exact residual; those expectations were updated to the approved behavior and the focused suite then passed. No full repository gate was run; reserve it for the settled integrated Epic candidate.
- Current 17-option output replay is retained in `S432-polo-output-matrix.json`, with actual SVGs/screenshots under `rendered/`. Across 17 same-revision option fixtures / 34 faces: zero S351 endpoint-residual assembly issues. All 17 front faces remain held by `pom:polo:finished-collar-stand-height` and `pom:polo:stand-front-rise` (`no readable label/leader position`). Each of the 17 back faces compiles linework, but the actual colorway renderer rejects `flat:polo:BACK_FLAT:component:sleeve:outline` as `COLORWAY_CONTOUR_UNCLOSED`. To inspect linework only, the diagnostic SVG omits the rejected colorway; therefore it is not passing final rendered-output acceptance. Chromium/browser errors are zero. Default and collarPointExtension-min linework screenshots were reviewed; neither establishes full-colorway acceptance.
- No new join, crossing, overlap, readability or geometry defect is attributed to this rule in the reviewed linework outputs. This review does not clear any face and does not establish final V02 readability/overlay acceptance. All 34 Polo faces remain held; Woven remains 56 held. Overall tally remains 56 accepted / 90 held across 73 configurations / 146 faces. V02 stays In Progress; V03 stays Backlog.
- The protected export byte-identity test pair passed 17/17. No export baseline moved. Legacy DXF behavior was not modified. Rights-cleared industrial receiver/profile and round-trip evidence remain absent downstream (S421); no compatibility claim is made.
- Verification history: the first option replay was too strict because it required all live compiler stages to be issue-free; it exposed the already-known two front POM layout failures. After changing the replay to preserve and report these failures, a second pass exposed the known back sleeve colorway closure error. The retained replay now records exact failing stages and creates inspectable linework-only diagnostics without treating omission of colorway as a pass.
- Board start replay: 2550→2552. Exit commands preflight from committed S431 and replay through the validated command layer at 2552→2558. V02 remains In Progress, V03 Backlog, EPIC-17 In Progress, and 56 accepted / 90 held is unchanged. `npm run control-center:test` passes 42/42; `readBoardFile()` validates revision 2558 and the status/evidence links; all three new `.mjs` scripts pass `node --check`; `git diff --check` passes.

### Elapsed time and next gate

Started 2026-10-07 17:53:50 UTC; closeout boundary 2026-10-07 18:16:48 UTC (about 22m58s). Implementation: about 3m; focused verification/option replay/rendered inspection: about 12m; durable records and board closeout: about 8m; agent waits: 0m; maintainer decision time: 0m (approval arrived before implementation resumed). No slice work remains unverified at closeout. Next action: reserve S433 from a fresh Git/board/usage check and address Polo's 17/17 front POM label/leader placements and 17/17 back sleeve colorway contour failures as separate, source-bound output issues. Preserve all 34 face holds until all applicable V02 checks pass. Do not begin V03 before all-seven V02 completion.
