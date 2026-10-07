# G04 V02 — Woven collar/closure crossing source audit — Slice 405

## Start boundary

- Started 2026-10-07 06:34 UTC from clean S404 `204f788ddca4753e6563de33d9b9de163b95291f` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S404 is highest; S405 is uniquely reserved. Canonical board revision is 2291; EPIC-17/G04-V02 remain In Progress, V01 Done and V03 Backlog. Ordinary usage remains allowed (primary 16%, weekly 2%).
- S402's Woven D interval-key, S403's pocket/placket order and S404's shoulder-occlusion decisions were grouped for maintainer response. This diagnostic is independent; it changes no production behavior and releases no views.

## Scope

Trace the repeated Woven center-front intersections between source-derived placket outlines and S359-projected collar role outlines in the exact 28-option S403 matrix. Resolve output points to specific same-revision source edges and the closure/collar stitch graph; inspect actual renderer detail for the default and option-distinct cases. Determine which crossing facts code directly establishes, whether the existing approved closure decision establishes collar-vs-placket layer order, and whether any additional display choice is needed. Preserve the pattern, projection, stitch graph, source edges, cut geometry, all existing holds and every G04 gate.

## Acceptance and gates

- Reconcile all repeated `pathPairCrossings` involving button/buttonhole plackets and `outerStand`, `underCollar`, or `upperCollar`, retaining option, exact revision, point, entity, source role/edge, and mapped view run.
- Trace the point against actual source edge endpoints and source stitches separately from view-only projected geometry. Distinguish the explicit button-placket-over-buttonhole-placket decision from any collar-over-placket relationship it does not state.
- Inspect actual Chromium detail for each geometrically distinct overlap and report whether it is an endpoint meeting, coincident line, or a path continuing through another role. If the layer/order fact is not source-encoded or settled by a prior decision, provide the exact affected edge and consequence; do not implement it here.
- No production source/tests, cut geometry, stitch graph, mapping, POM, option range, acceptance threshold, face status, exporter, legacy DXF, protected export identity, or V03 gate may change.
- Run reproducible focused analysis, actual rendered inspection, `npm run control-center:test`, validated board replay, and `git diff --check`; reserve the global gate for the settled integrated Epic candidate.

## Non-goals, dependencies and ownership

No general construction search, repeated audit of the S403 full path graph, D-marker/pocket/shoulder decision implementation, new recipe, G05/G09 scope, V03 work, physical/factory claim, supplier contact, launch spending, hosted service, or production-readiness claim. No safe disjoint delegation exists for the exact source-edge/view-projection trace. Codex retains the diagnostic and integration review.

## Exit record

## Findings and disposition

The repeat is confirmed against the retained S403 production `FRONT_FLAT` outputs, all at `live-draft:woven-shirt:14:14`. `audit-center-front-overlaps.mjs` re-reads the same 28 exact-option records and writes the reproducible grouped coordinates to `woven-collar-placket-overlap-summary.json`; it does not regenerate or alter output. It found 68 exact point groups across the six pair families formed by `buttonPlacket`/`buttonholePlacket` and `outerStand`/`underCollar`/`upperCollar`. The two recurring geometric stations are the placket outer edge at x=±(placketWidth+2 cm), crossed by the projected collar contour at y=9.6239–10.8970 cm (28/28 per placket/collar role pair, with exact y set by option geometry), and the placket top edge at y=8.0–8.6 cm, met by the projected collar contours at x=±0.8333–1.1667 cm in the option rows recorded in the matrix. Upper- and under-collar paths coincide by their construction dimensions, so their duplicated intersections are not independent physical joints.

Source classification:

- **Directly encoded:** `placketPiece` creates straight `top`, `outerRaw`, `bottom`, and `attachmentRaw` edges. The front button placket's `attachmentRaw` stitches to `front.centerFront`; the buttonhole placket's separate `attachmentRaw` also stitches to `front.centerFront`. `Outer stand ↔ woven neckline` connects `outerStand.neckline` to `front.neckline`/`yoke.neckline`; under-collar stand joins the outer stand collar edge; upper collar stand joins inner stand; upper/under collar front-tip and outer edges join one another. The source does not connect a placket edge to a collar edge or declare a relative collar/placket display layer.
- **Previously approved design decision:** S321's closure A puts the right button placket above the left buttonhole placket. It determines only their mutual order. S404's now-approved shoulder occlusion puts the projected outer stand over the body shoulder on a specific seam interval. Neither decision states the independent collar-over-placket order.
- **Actual-render evidence:** S403's retained actual-Chromium default and collarLeafDepth-max path-index crops show the same collar and closure lines visibly superposed at the two stations above. These are intersections of separate role paths, not source stitch junctions. S404/S403 images have highlighted identities for review and are not production behavior.

No source edge identity, topology, role orientation, option, POM, stitch, or cut geometry changes. The exact source path ownership is: the placket top segment and outer side come from `buttonPlacket.top`/`outerRaw` and `buttonholePlacket.top`/`outerRaw`; the intersecting lines come from the S359-projected `outerStand.collar`, `underCollar.outer`/projected closure, and `upperCollar.outer`/projected closure representations recorded in the S403 paths. The fixed option matrix, role IDs, path strings, intersections and counts are retained in the JSON report.

The remaining design question is whether G04 should display the collar assembly over the closure at center front. A bounded proposal is to keep the approved button-placket-over-buttonhole order, then render the collar surfaces in front and clip only the portions of those two placket outlines lying inside the projected collar silhouette, at their exact computed boundary intersections. That would hide the top/outer placket strokes within the collar footprint (the outer-edge cut is 0.8–2.7 cm down from the top by current projected intersections) and retain the visible closure below the collar. It would not claim or alter a source stitch. The practical tradeoff is that it makes the collars appear to cover both placket ends, a reasonable but not source-encoded display convention; the current alternative is to retain the crossing and hold the affected Woven fronts. This slice implements neither option. All 28 Woven fronts and backs remain held.

The maintainer also approved three previously proposed exact display decisions during S405: the D midpoint marker, pocket foreground, and shoulder/collar occlusion. Those approvals authorize implementation/re-verification only and are recorded in `docs/PROJECT-DECISIONS.md`; S406 is reserved for that work. They release no view and do not waive any topology or output gate. S405 itself remains diagnostic-only.

Focused verification: `node --check` and the audit script pass; its output reconciles to 28/28 exact revisions. Actual Chromium default and collarLeafDepth-max evidence was inspected from S403's rendered outputs. `npm run control-center:test` passes 42/42 after validated board closeout; `git diff --check` passes. No production code changed, so no changed-production coverage or global gate was due. No view or acceptance criterion changed.

- Board start/exit revisions: 2291→2294 / 2294→2301; canonical EPIC summary refresh through validated `editEpic` commands: 2301→2305. Three interim Control Center reruns correctly rejected summaries that omitted required historical assertions (the accepted/held tally, S363 blocker, 31/25 render status, and Polo gate wording). Those assertions were preserved in the current summary; final Control Center result is 42/42. No tests were changed.
- Elapsed time (06:34–06:37 UTC): implementation 0m; source/matrix diagnosis and artifact 1m; rendered review 1m; packet/context/state/validated-board closeout and focused checks 1m; external-agent waits 0m; maintainer-decision time approximately 1m.
- **Next action:** implement only the three approved view-only choices in a fresh S406 packet, with focused changed-code coverage and same-option Woven renderer replay. Keep every Woven/Polo view held. If the collar-over-placket decision is later approved, reserve a separate slice to implement and review it; otherwise report the unresolved center-front collision as a remaining hold.
