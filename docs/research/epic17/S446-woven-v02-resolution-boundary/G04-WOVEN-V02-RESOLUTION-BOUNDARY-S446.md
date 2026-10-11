# G04 Woven V02 resolution boundary — Slice 446

## Start boundary

- Started 2026-10-07 22:45:15 UTC from clean S445 commit `f8747c9ef9edddb481e409cd4ff253f17296c62f` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 445; S446 is reserved.
- Board revision 2671: EPIC-17/G04-V02 In Progress; V01 Done; V03 Backlog. Integrated count is 56 accepted / 90 held across 73 configurations / 146 faces. Goal is active and matches admitted EPIC-17 through safe merge.
- S445 preserves the maintainer's choice to keep S370 positions. No production edits or tests are part of this decision-boundary review.

## Scope and limits

Reconcile exact current source, approved decisions, retained all-option output and S443's completed Opus 5.5 xhigh research to state whether either remaining Woven hold has a source-supported fix under the controlling decisions, and identify the smallest design authority needed to continue. Do not repeat general research, redo renderer trials, implement source or view changes, weaken V02/all-seven acceptance, change the 0.25 cm Polo rule, release any face, or start V03.

## Exact unresolved Woven facts

### Front collar/neckline — 28 options, 28 fronts held

- **Source facts:** `src/drafting/shirt.ts` stitches `front.neckline` to `outerStand.neckline`; `underCollar.stand` to `outerStand.collar`; `upperCollar.stand` to `innerStand.collar`; and the paired collar `frontTip`/`outer` edges. There is no stitch from the body neckline to the collar exterior. The collar source piece has a base at local `y=0` and exterior edge at `y=collarLeafDepth`; the stand uses distinct collar/neckline edges.
- **Option facts:** `src/drafting/shirt-contract.ts` allows `standHeight h=1.5–3.5 cm` and `collarLeafDepth d=4–8 cm`, so `d-h` is at least `0.5 cm` in every supported combination.
- **Approved view facts:** S359 maps the collar base to signed offset `-h` from the body neckline and the exterior to `d-h`; the maintainer separately chose to keep the complete continuous body base seam. Since the approved continuous contour starts below offset 0 and ends above offset 0 for every supported option, it crosses the base seam. S417/S437 retain two symmetric contacts per option, 56 total; default and `neckEase-max` Chromium evidence shows them. This is not a collision count discrepancy or missing source edge.
- **Evidence class:** source-coded seam topology and numeric ranges are direct code evidence; exact intersections are production-output/render evidence; the projection and full seam are maintainer-approved display conventions. No pattern-specific source establishes an alternative exterior side, sewn roll, or layer order. W3/W4 general evidence says turn of cloth affects roll and flat layers alone do not determine it.
- **Current effect:** keep all 28 fronts held. A different projection sign/shape, interrupted seam, or source design change would alter a settled convention or drafted construction. None is authorized by existing decisions.

### Back sleeve/hem — 28 options, 28 backs held

- **Source facts:** `wovenSleeve()` drafts one full sleeve with `taper=3 cm` and a complete straight `hem`; the stitch graph joins that entire hem to `sleeveBand.top`. Two view instances are reflected around the source-declared back center line. Source contains no center hem split, sleeve-to-sleeve stitch, handed face, crossing station, or overlap order.
- **Output facts:** S373/S437 show the two complete hem strokes cross once in each standard back. S440's exact rigid-orientation scan found no collision-free pose that also clears the torso/yoke. S441's local-Y candidate removes sleeve-pair/body crossings in all 28 options, but intersects both fixed S370 detached-band details in all 28; clearing them requires moving each detail outward 20.5737–22.4315 cm and expanding the frame 41.1474–44.863 cm. The maintainer chose to retain S370 positions and holds.
- **Evidence class:** piece geometry/stitch are directly encoded; crossing and collision magnitudes are exact same-revision output scans corroborated by Chromium; sleeve pose/order is not source-encoded. No checked pattern-specific reference establishes a different pose or relation.
- **Current effect:** keep all 28 backs held. Moving the S370 detail boxes, drawing a false hem gap, masking whole sleeves, or inventing an over/under relation is outside the current approvals.

## Decision boundary

The approved decisions fully settle the display choices that can be settled without altering the drafted Woven design: retain the full body neckline; keep the approved S359 projection; retain the S370 band layout; preserve complete sleeve hems and all-seven V02. The remaining conflicts are consequently not open implementation defects with a verified patch. They require a new construction/design authority.

**Recommended next work:** authorize a bounded, in-memory Woven source-design candidate study for only the collar/stand and sleeve/back-view conflicts. Codex would use exact current source/options to derive candidate parameter/geometry changes, quantify impact on source seams, silhouette, POMs and option limits, and render only candidates that satisfy source joins and fixed S370 placement. No production source, stitch graph, view mapping, acceptance criterion or output changes would land until an exact proposal is reviewed and separately approved. Preserve physical fit and factory claims as unvalidated.

Other choices, if preferred, are to preserve the all-seven criterion and retain the holds indefinitely, or to revisit a previously approved view/layout constraint through an explicit new decision. The last option changes an existing approval and is not recommended. No scope/acceptance weakening is proposed.

## Verification and exit

- This slice is a source/evidence reconciliation only; no new general reference search or redundant output replay is warranted. Evidence remains bound to Woven revision `live-draft:woven-shirt:14:14` in S417/S437/S441 and S443.
- Board start and exit use `S446-start-board-commands.json` / `S446-exit-board-commands.json` through the validated command layer. Control Center regression, canonical board read validation, script syntax and `git diff --check` are the focused closeout checks.
- Keep the 56 Woven and 34 Polo holds, integrated 56/90 tally, all-seven V02, V02-before-V03, protected exports, legacy DXF, and V03 rights/round-trip gates unchanged.

## Slice exit

- The source/design boundary is confirmed. Existing choices force the Woven front crossing or back layout conflict; no further view trial can clear them without changing an approved projection/line/layer/layout choice or changing drafted construction.
- Recommend authorizing only an in-memory source-design candidate study for Woven collar/stand and sleeve geometry. This slice does not authorize modifying production source, stitches, view mapping, face status, acceptance or V03 scope. Any exact proposed change still returns for separate approval before implementation.
- Exit board replay advanced 2673→2675 using the validated command layer. EPIC-17/G04-V02 remain In Progress, V03 remains Backlog; 56 accepted / 90 held is unchanged. `npm run control-center:test` passes 42/42; canonical read validates; exit preflight, all S446 script syntax checks and `git diff --check` pass.
- No production tests, rendered replay, build, changed-code coverage or export tests were due: only source/evidence reconciliation and planning records changed.
- Elapsed 2026-10-07 22:45:15–22:46:45 UTC (1m30s): implementation 0m; source/decision reconciliation ~35s; durable packet/state/context/board ~35s; focused verification ~20s; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** obtain authorization for the bounded in-memory Woven source-design candidate study, then derive and render concrete candidates without changing production source. If authorization is not granted, preserve the current holds and all-seven acceptance; V03 remains gated.
