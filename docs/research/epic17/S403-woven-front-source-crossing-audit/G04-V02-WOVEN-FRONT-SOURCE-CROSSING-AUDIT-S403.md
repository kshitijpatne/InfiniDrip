# G04 V02 — Woven front source-path crossing audit — Slice 403

## Start boundary and authority

- Started 2026-10-07 06:14:05 UTC from clean S402 `ff7d2cb33a9270b2e814de4d1dcfa6af9cc2061f` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S402 is the highest landed slice; S403 is uniquely reserved. Canonical board revision is 2269; G04-V02 is In Progress, V01 Done, V03 Backlog. Primary usage was 11%; ordinary work allowed.
- S402's D interval-key proposal remains pending maintainer decision; this diagnostic does not implement or depend on it. S402's collision finding remains documented. S381 back-crossing and Polo residual holds remain unchanged.
- Authority: EPIC-17 admission, current state/decisions/architecture, S359 full-collar mapping approval, S381 source crossing evidence, S401 current production-renderer matrix and SVGs, and S402 exit packet. No source change or new semantic mapping is authorized by this packet.

## Scope and acceptance

- Audit the same 28 S401 Woven `FRONT_FLAT` production-renderer SVGs at exact revision `live-draft:woven-shirt:14:14` for source-path self-intersections, path-to-path intersections/near contacts, duplicate strokes, and possible unclosed contours, independent of the POM leaders/key trials.
- Retain for each tested path its output entity ID, source piece/role/edge, revision, layer, instance/mapping identity and options. Use curve-aware path sampling for screening, then a separately checked geometric method for relevant crossings; inspect actual Chromium views for default and any distinct/outlier cases.
- Separate expected adjacency/overlap under the approved collar/seam/layer mappings from independent or ambiguous contacts. A crossing is not called erroneous solely because curves intersect; the source stitch graph, same-revision piece identity and approved view layer must support the distinction.
- Produce a reproducible per-option result and state only what the current output/source can establish. This slice is diagnostic: no face can be released from this audit alone. Keep the proposed D interval-marker question separate.
- Preserve every hold, the all-seven V02 criterion, Polo's 0.25 cm residual gate, V02-before-V03, DXF behavior, protected export byte identities and V03 rights/round-trip gates. No topology/geometry, source stitch, POM, renderer, threshold or acceptance changes.
- Focused actual-output diagnostics, rendered inspection, `npm run control-center:test`, validated board replay, syntax checks and `git diff --check`; reserve full repository coverage/build/export gates for the settled integrated Epic candidate.

## Non-goals, blockers, ownership

- No physical/factory claim, new construction convention, D-marker implementation, Woven back repair, Polo ease or residual change, recipe/UI expansion, V03 exchange-profile claim, G05/G09 work, supplier contact, spending, service hosting, or acceptance change.
- Blocking decisions: none to conduct the source-path audit. An ambiguous crossing requiring a new semantic construction choice will be reported with a specific proposal and remain held pending maintainer approval. No safe disjoint delegation exists for one coupled geometry/output audit; Codex retains review and integration ownership.

## Start-board record

- `S403-start-board-commands.json` is replayed through the validated `executeBoardCommand` layer.

## Exit record

## Exit findings and face disposition

The audit uses the exact 28 S401 production-renderer Woven front SVGs at `live-draft:woven-shirt:14:14`. Each has 19 component-outline or view-seam paths in this audit. Cubic curves were divided into 80 chords for proper finite-segment screening; straight line relations such as the pocket/placket result are exact. Same-revision path IDs, role source IDs, layer group, full path data, per-option output and overlap segments are retained in `woven-front-path-crossings.json`.

- **No self-crossing component path:** none of the 19 selected paths has a detected proper self-intersection in any of the 28 option outputs. There are proper intersections between paths in every configuration; the full machine report distinguishes 550 pair records and 28 faces with at least one. These counts include expected coincident/adjacent views of sewn collar pieces; they are not a count of 550 separate defects.
- **Repeated collar/shoulder crossing:** the `front:outline` source path crosses `outerStand:outline` in 28/28 outputs (the mirrored collar instance also crosses the reflected body outline). The default intersection is `(12.7156, 0.5032) cm`; across the option rows it varies from `(11.7294,0.3019)` to `(13.7019,0.7045) cm`. The same point also appears for the co-projected `underCollar` and `upperCollar` contours. It lies on the front shoulder outline segment, not on the source front neckline edge. Directly encoded construction has `Outer stand ↔ woven neckline` joining `outerStand.neckline` to `front.neckline`/`yoke.neckline`; it does not define this separate crossing as a sewn junction. The full-collar projection has maintainer approval as a view convention, conditional on crossings and layer checks; this crossing therefore remains an output blocker, not an accepted seam or new construction fact. Actual Chromium crops for default, neckEase min/max, standHeight min/max, collarLeafDepth min/max, and combined-supported are in `rendered/` with the crossing and source contours highlighted.
- **Pocket/placket boundary, source geometry:** the woven pocket is a single front-side patch piece with source bounds `x=5..17 cm`, `y=30..43 cm` in default. `pocketX` is source-derived as chest/20 (=5 cm); the pocket cut width/height are option values. Its source stitch list attaches only `pocket.top` to the front `pocketPlacement` mark. The button-placket cut width is `placketWidth + 2 cm`, so its right outer edge is `x=placketWidth+2` (default 5 cm). No source stitch relates a pocket edge to a button-placket edge.
- **Pocket/placket boundary, actual output:** 25/28 configurations draw the pocket's left edge exactly coincident with the placket's right outline for the full pocket height (10–18 cm; default 13 cm). `placketWidth-min` leaves a 1 cm gap. `placketWidth-max` and `combined-supported` extend the placket outline 1 cm into the pocket bounds, for 13 cm and 15 cm vertically respectively. Current SVGs draw both in `GARMENT_SILHOUETTE`; in those two outputs the placket stroke remains visible through the pocket region. This is a real option-dependent overlap, not a detected stitch, and source gives no pocket/placket z-order. Actual rendered default, min-gap, max-overlap and combined crops are captured in `rendered/woven-shirt-*-pocket-placket-crossing.png`.
- **Decision proposal (not approved):** preserve the pocket's exact source position and one pocket instance. Recommended display convention is that the patch-pocket outline is the foreground edge where its bounds overlap the button-placket footprint: suppress only the hidden segment of `buttonPlacket.outerRaw` under the pocket, leave the pocket left boundary visible, and represent a source-coincident pocket/placket boundary once without describing it as a seam. This changes no cut geometry or stitch graph and makes the two 1 cm overlap cases readable while leaving the other 26 configurations' positions intact. It does assert a pocket-over-placket display order that source topology does not encode. The alternative is to fail those two combinations closed with an actionable correction to `placketWidth ≤ 3 cm` for this chest/pocket placement, rather than silently clamping. Neither choice is implemented here.
- **Face disposition:** no Woven front is accepted. All 28 fronts remain held for the proposed S402 D marker decision, the repeated shoulder/collar crossing and the independent pocket/placket display/topology ambiguity, in addition to remaining per-face join, callout, colorway, overlay and output gates. All 28 backs stay held at the source-continuous sleeve/hem crossing. All 34 Polo views remain held at 0.68 cm versus the 0.25 cm residual gate. No production source, geometry, stitch, mapping, POM, acceptance criterion, all-seven gate, export or V03 gate changed.

## Verification and elapsed time

- `audit-front-path-intersections.mjs` regenerated the 28-option matrix at exact revision, with source entity/revision validation and path-pair intersection plus collinear-overlap analysis. Straight pocket/placket edge coordinates match the emitted source-derived paths exactly.
- `render-pocket-placket-crops.mjs` and `render-collar-crossing-crops.mjs` produce actual Chromium crops; default, min-gap, max-overlap, combined, and collar topology extremes were inspected. `node --check` passes for the S403 audit and render scripts.
- `npm run control-center:test` passes 42/42; `git diff --check` and three script syntax checks pass. No production code changed, so no changed-code coverage/build/export run is due in this diagnostic slice; the settled integrated candidate still requires the full unchanged gates.
- Validated board revisions: start 2269→2272; exit 2272→2281.

**Next action:** ask for the concrete pocket/placket decision described above. Continue independent collar station/crossing diagnosis without implementing either the pending S402 D key or this proposed pocket order. Preserve all view holds and acceptance gates.

- Validated board revisions: start 2269→2272; exit 2272→2281.
- Elapsed approximately 9m (06:14:05–06:23:05 UTC): implementation 0m; source and exact option-matrix audit 3m; rendered crops/generation and visual review 4m; packet/context/state/validated-board closeout and Control Center verification 2m; external-agent waits 0m; maintainer-decision time 0m.
