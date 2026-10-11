# G04 V02 — Woven front post-clip intersection audit — Slice 417

## Start boundary and authority

- Started 2026-10-07 08:48:43 UTC from clean S416 `2952b33e1b471b935470e94eaf5cce8c24f762b6` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 416; S417 is uniquely reserved. Canonical board revision 2420; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Goal is active and matches admitted objective through safe merge. Usage at start: 42% primary / 7% weekly.
- The canonical G04 board still says “Other Woven front junctions/crossings remain.” S406 applies four approved view-only conventions, S407 inventories source-path contacts before visible clipping, and S414 reconciles the neckline/collar hold. S417 will resolve the board's remaining broad wording against the exact current S406 output after those masks.

## Acceptance and boundaries

- Bind all evidence to exact S406 revision `live-draft:woven-shirt:14:14` and all 28 supported option rows / 28 FRONT_FLAT outputs. Trace each residual pair to SVG entity, source role/edge, reflected instance, approved clip/order, and source stitch topology.
- Analyze post-clip visible path geometry, not only pre-mask intersections. Corroborate metrics in actual Chromium crops for default and geometrically distinct options. Distinguish a sewn/source-coded station from a visual crossing with no corresponding source join; do not declare an inferred intersection to be a sewn junction.
- Record which collisions are already removed by approved clips and which truly remain visible after clipping. If a new unapproved display convention is the only remedy, formulate one exact proposal and preserve all holds. No mapping is implemented without approval.
- Preserve all 56 Woven and 34 Polo holds, all-seven V02, V02-before-V03, Polo's fixed 0.25 cm gate and 0.68 cm residual, DXF/protected export identities, V03 rights/round-trip gates and physical/factory claim boundaries. No source geometry, stitch graph, POM, schedule, threshold or acceptance change.
- No safe disjoint agent work: source topology, renderer clipping, same-revision option outputs and Chromium intersection evidence are one coupled audit.

## Start-board record

Validated start replay: `S417-start-board-commands.json`, board revision 2420→2423.

## Exit evidence

Pending.

## S417 result — exact post-clip classification

### Output binding and method

S417 used the exact 28 FRONT_FLAT SVG strings emitted by S406's production replay at revision `live-draft:woven-shirt:14:14`, not reconstructed geometry. The audit retains each stroked entity ID, source ID, layer group, source clip provenance, SVG painter order, and strict interior intersection coordinates. It excludes mask definitions and fills. Cubic paths are sampled into 120 chords; intersections are clustered to 0.015 cm. This is a geometric crossing screen, then corroborated against actual Chromium renders; a point intersection alone is not treated as a bad join.

Across all 28 configurations, the screen finds three different classes:

1. **Source-joined shoulder endpoints — not a new crossing hold.** At approximately `(-12.7156, 0.5032)` and `(12.7156, 0.5032)` cm, clipped `front:outline` / its physical-pair reflection meet the reflected/source `outerStand:outline`. These are at the approved S404 shoulder-clip boundary. `WOVEN_SHIRT_COLLAR_STITCHES` directly joins `outerStand.neckline` to `front.neckline` (and the back/yoke neckline). Chromium shows the matched endpoints, not an extra path through the shoulder. The crossing script reports these as geometric contacts at a clipped path endpoint; it does not establish a defect.
2. **One unresolved neckline/collar contact on each side.** At approximately `(-0.8424, 8.1727)` and `(0.8424, 8.1727)` cm, emitted `front:neckline` view-seam entities cross the reflected and unreflected upper/under-collar outer contours. This appears in 28/28 options and survives S406's six approved clips. Source directly encodes the body-to-outer-stand neckline join and the upper/under collar outer seam; the exterior collar station is a previously approved normalized-arclength view convention, not a physical notch or a direct neckline-to-exterior stitch. The actual default and `neckEase-max` Chromium overlays show two visible contacts. S410's distinct question—retain the continuous S342 base-seam stroke with these contacts, or approve the exact 0.8426–0.8433 cm per-side view-only seam occlusion—remains unanswered. Keep all affected Woven faces held.
3. **Approved closure/collar overlap boundaries — already resolved by S406 and reaffirmed by the maintainer.** The right `buttonPlacket` and left `buttonholePlacket` meet the projected collar at the exact emitted clip boundaries around `x=±0.8333, y=8.2` and `x=±5, y=9.8412` cm. The front source joins each placket's `attachmentRaw` edge to its `front.centerFront`; it does not encode collar/placket foreground order. S406 clips only placket outline portions inside the approved collar mask, leaves the button placket above the buttonhole placket, then paints the collar over both. Actual Chromium overlays show those edges terminate beneath the foreground collar. The user's latest approval reaffirms this already implemented convention; it does not settle S410's base-seam display question.

The two collar exterior contours are intentionally coincident because `collarPiece()` derives upper/under geometry from the same formulas and `WOVEN_SHIRT_COLLAR_STITCHES` joins their `frontTip` and `outer` edges. This is a source-encoded seam, not a separate unjoined crossing. No new geometry, stitch, layer rule, cut, POM, schedule, option, threshold, or acceptance change is proposed.

### Rendered evidence

- `woven-shirt-default-post-clip-overlay.png` and `woven-shirt-neckEase-max-post-clip-overlay.png` are actual Chromium renders of the S406 SVG at the bound revision, cropped to the collar/shoulder area and annotated with measured post-clip contacts. Red marks the unresolved neckline/collar contact; blue marks the source-joined shoulder/clip endpoints; amber marks approved collar/placket boundaries.
- The matching `*-post-clip-overlay.svg` derivatives preserve the S406 paths and add only audit markers/text. The original S406 SVG and raster outputs are unchanged.
- `woven-collar-stack-crossings.json` is the reproducible 28-option trace with exact entity/source IDs, layers, painter order, clip provenance, points, and pair incidences. `audit-post-clip.mjs` and `render-post-clip-overlay.mjs` reproduce the trace and overlays.

### Slice closeout

- S417 resolves the vague “other Woven front junction/crossings” board wording into source-joined shoulder endpoints, the one repeated unanswered neckline/collar display contact, and the already-approved collar-over-plackets boundaries. It does not clear a view hold.
- All 56 Woven and 34 Polo faces remain held; all-seven V02, V02-before-V03, Polo's 0.25 cm residual gate and 0.68 cm residual, legacy DXF/protected export identities, and V03 rights/round-trip gates are unchanged. The S381 Woven back hem remains held; no gap or false seam was added.
- `npm run control-center:test` passes 42/42 before closeout. Audit script and renderer both execute successfully; the actual Chromium render reports zero browser errors. The classified SVG coordinates match both rendered overlays. No production code changed, so no changed-production coverage or global gate is due; integrated full coverage/build/export/browser gates remain at the settled Epic candidate.
- Start/exit board revisions: 2420→2423 / 2423→2428. Refreshed `origin/main` remains `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the slice base `2952b33e1b471b935470e94eaf5cce8c24f762b6`.
- Elapsed approximately 12 minutes (08:48:43–09:01 UTC): source/output audit and trace 4m; rendered review 1m; durable packet/state/context/board closeout 5m; focused verification 2m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** preserve the unresolved S410 neckline/base-seam hold and continue with the next independent V02 blocker. Do not treat the collar-over-plackets reaffirmation as approval to interrupt the S342 base seam or release any Woven face.



