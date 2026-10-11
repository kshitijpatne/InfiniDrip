# G04 V02 — Woven collar-stack source/output diagnosis — Slice 407

## Start boundary

- Started 2026-10-07 07:49 UTC from clean S406 `f31f79767c742866ea2c519c60e3d43da4e9e52e` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 406; S407 is uniquely reserved. Canonical board revision is 2329; EPIC-17/G04-V02 remain In Progress, V01 Done and V03 Backlog. Primary usage is 28%; ordinary usage is allowed.
- The approved Woven front collar-over-plackets decision is implemented and verified by S406. The recent maintainer reply confirms the same convention; no duplicate implementation is authorized or needed.
- S381 already resolved the Woven back sleeve-hem gap proposal: no source-backed gap or crossing order is established, so all 28 back views remain held. S407 will not repeat that investigation.

## Scope and objective

Use S406's exact same-revision 28-option Woven production SVGs and the existing source-path/topology matrices to diagnose the **remaining front collar-stack contacts** after the approved shoulder clipping and collar-over-plackets rules. Trace `outerStand`, `underCollar`, `upperCollar`, body neckline, and both placket roles to their exact source edges, transforms, instances, stitch joins, clip intervals, and SVG layer order. Determine which repeated intersections are source-encoded sewn interfaces, approved view overlaps, duplicated display edges, or genuinely unresolved geometry. Identify a source-supported correction if one exists; otherwise keep the affected views held and prepare one concrete decision only if an unavoidable design choice remains.

The chosen work is based on S406's actual reviewed detail, which still shows repeated collar/neckline/closure contacts. This supersedes S406's stale next-action suggestion to reopen S381's already-settled back-crossing gap question.

## Acceptance and verification

- Reconcile all 28 option configurations against exact S406 output revision `live-draft:woven-shirt:14:14`; report pair incidence, source path IDs/edges, view transforms/instances, intersection stations, and whether the approved clips alter the relevant path intervals.
- Trace each candidate contact against current `src/drafting/shirt.ts`, the current projection metadata/compiler and exact source stitch graph. Clearly label source-encoded facts, approved conventions, and any proposed convention. Do not infer a seam or physical layer from geometry alone.
- Inspect actual Chromium default and geometrically distinct limiting crops from S406; create new annotated/cropped output only when needed to resolve a specific ambiguity. Preserve the original source geometry and all approved metadata.
- Do not implement a new semantic overlap/order unless it is directly established by source or already approved. Keep all 56 Woven and 34 Polo views held; preserve all-seven V02, Polo's 0.25 cm residual gate, V02-before-V03, protected export identities, legacy DXF, and V03 rights/round-trip gates.
- Run reproducible focused source/output checks, `npm run control-center:test`, validate the board replay and `git diff --check`. This diagnostic slice changes no production code; full repository/global coverage and integrated build/export/browser gates remain for the settled Epic/PR candidate.

## Non-goals, dependencies and ownership

No general construction-reference search, repeat of the S381 gap decision, modification of S406's approved collar/placket rule, cut/source geometry or stitch changes, POM or option changes, threshold/acceptance/hold changes, V03 work, G05/G09 scope, UI redesign, physical/factory claim, supplier contact, launch spend, hosted service, or production-readiness claim. No safe disjoint delegated task exists: this is one same-revision source-to-projection trace; Codex retains control and review.

## Start board record

`S407-start-board-commands.json` is replayed through the validated Control Center command layer.

## Exit record

### S410 source-paint-order correction

Slice 410 traced the exact S406 path order across all 28 Woven front SVGs and corrected the display explanation for this proposal. The production SVG paints the four projected under/upper-collar outline instances before the two complete source `front.neckline` strokes (indices 17–20 vs. 21–22). Thus the body neckline already appears on top and crosses the collar at the two mirrored stations. The S407 diagnostic does not change layer order: it clips the center-front-to-contact interval of `front.neckline`, hiding 0.8426–0.8433 cm per side so the collar outline is exposed there. This leaves an interruption in the base seam. It remains an unapproved design choice; the earlier collar-over-plackets approval does not settle it. Exact all-28 order evidence: `docs/research/epic17/S410-woven-neckline-layer-order-trial/woven-neckline-paint-order-matrix.json`; full comparison: `docs/research/epic17/S410-woven-neckline-layer-order-trial/G04-V02-WOVEN-NECKLINE-LAYER-ORDER-TRIAL-S410.md`.

### Source and current-output findings

- **Directly encoded source geometry:** `collarPiece()` in `src/drafting/shirt.ts` constructs `underCollar` and `upperCollar` from the same edge formulas and same option values. Their `centerBack`, `stand`, `frontTip` and `outer` shapes are identical at the same revision. `WOVEN_SHIRT_COLLAR_STITCHES` joins `upperCollar.frontTip/outer` to `underCollar.frontTip/outer`; it separately joins the under-collar stand to the outer stand collar edge and upper-collar stand to inner stand. This explains the duplicate coincident collar outlines as a sewn source interface, not an independent join or added garment piece.
- **Directly encoded base seam:** `Outer stand ↔ woven neckline` joins `outerStand.neckline` to `front.neckline` and `yoke.neckline`. S342's approved view mapping draws the body neckline as the single base-seam stroke and suppresses the duplicate stand-base stroke. S359/S321's approved exterior arclength transfer maps each collar exterior from the CB-to-CF source station; it does not declare a physical notch at the transferred point.
- **Current output trace:** the reproducible script reads the exact S406 production-renderer SVGs at `live-draft:woven-shirt:14:14`, validates all 28 revision IDs and considers only stroked path entities (excluding colorway fills and mask definitions). `front.neckline` crosses the coincident projected `underCollar.outer`/`upperCollar.outer` contour at two mirrored center-front stations in every option. Their absolute x coordinate ranges 0.5033–1.2818 cm; y ranges 7.9719–8.5739 cm. The exact option-by-option paths, points, clip provenance and identical under/upper path counts are in `woven-collar-stack-crossings.json`.
- The same geometric pre-mask audit still finds shoulder/collar and collar/placket path intersections. Those records are not treated as remaining visible defects by themselves: S406 clips the approved shoulder and placket intervals, and its actual Chromium review confirms those approved foreground effects. S381's 28-option back hem crossing and unsupported-gap disposition remain settled; this slice did not reopen or alter them.

### Exact diagnostic proposal and consequence

- **Trial only:** on each Woven `FRONT_FLAT`, retain the collar in front and clip only the source `front.neckline` seam from its source center-front endpoint to the first same-revision projected upper/under-collar intersection, mirrored on both sides. Do not change the source stitch graph, cut geometry, collar transfer, placket order, POMs or back view. The trial edits only the emitted view-seam SVG path in memory.
- The first source edge is `pattern:woven-shirt:role:front:edge:neckline`, emitted as `flat:woven-shirt:FRONT_FLAT:view-seam:front:neckline` and its `:physical-pair-reflection`. Across the three rendered trials, it hides 0.8426–0.8433 cm of source neckline per side, with the cut at t=0.0477–0.0514 from each center-front endpoint. The exact current default and `neckEase-min/max` intersections, split parameters and retained seam endpoints are in `rendered/front-neckline-occlusion-trial/trial-matrix.json`.
- **Effect:** the body neckline remains one same-revision source seam outside the collar contact, while a short center-front portion is concealed under the projected collar. The default and both neck-ease extreme derivatives render without Chromium errors; actual baseline and trial crops are saved side by side. The trial makes the collar read as foreground at the contact, but creates a visible short interruption in the base-seam stroke. That interruption can be read as a seam break and narrows S342's approved “single base-seam stroke” convention. Source topology confirms the sewn interface but does not prescribe this view-layer occlusion.
- **Decision needed before implementation:** approve the exact front-neckline foreground clip above for all 28 Woven options, or retain S342's fully visible base-neckline stroke and the current Woven front hold. Recommendation: approve only if the maintainer accepts that the 0.84 cm per-side seam interruption depicts concealment beneath the collar; otherwise preserve S342 and keep the affected fronts held. Approval, if given, authorizes implementation and all-28 review only—not view acceptance. All 56 Woven and 34 Polo views remain held until their full V02 gates pass.

### Verification, board and elapsed time

- `node --check` passes for all four S407 evidence/replay scripts. `audit-collar-stack.mjs` reconciles all 28 current S406 outputs, exact source revision and repeated contact incidence. `render-neckline-occlusion-trial.mjs` modifies only derivative in-memory SVGs for default, `neckEase-min`, and `neckEase-max`; it renders paired baseline/trial Chromium crops with zero browser errors. No production code or tests changed.
- Validated start-board replay advanced revision 2329→2332; exit evidence and comments replayed through revision 2343. The first Control Center run correctly caught one missing exact historical summary assertion for the 0.25 cm Polo gate. The Epic summary was repaired additively through validated `editEpic` at revision 2344, preserving all prior assertions; `npm run control-center:test` then passes 42/42. `git diff --check` passes. EPIC-17/G04-V02 remain In Progress and all holds/all-seven acceptance remain unchanged.
- Active elapsed time is approximately 9 minutes (2026-10-07 07:49–07:58 UTC): source/context and option trace 2m; analysis script and option matrix 2m; rendered comparison 2m; packet/state/context and validated board closeout 2m; focused board rerun/correction 1m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m (decision not yet received).
- **Next action:** keep the trial unimplemented and all affected views held pending the specific display decision; continue other independent G04 work while waiting. Do not re-open the S381 hem-gap decision or begin V03.
