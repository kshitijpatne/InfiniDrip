# G04 V02 — unresolved display decision checkpoint — Slice 422

## Start boundary and authority

- Started 2026-10-07 09:35:06 UTC from clean S421 commit `9873ffb8fcfeb3d6f16c12c628744f905a878093` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice is 421; 422 is unique. Board revision 2459; V01 Done, V02 In Progress, V03 Backlog. Goal record is active and matches the admitted EPIC-17 objective. Primary usage 49%, weekly 8%.
- Authority: user authorized G04 through merge, and separately approved the Woven collar-over-plackets view order. That order is implemented in S406. The S410 base-seam interruption and S419 variable-arc H locator are separate unresolved display semantics; neither approval nor source topology settles them.

## Scope, gates, and blocking decisions

- Reconcile the exact current evidence and actual rendered crops for the two repeated, still-unanswered view-only decisions. Distinguish source-encoded construction from renderer proposal. Make no implementation or acceptance change pending approval.
- Preserve all 56 Woven and 34 Polo holds, the 73-config/146-face current integrated tally, all-seven V02 criterion, fixed 0.25 cm Polo residual gate, V02-before-V03, generic legacy DXF behavior, protected export identities, and all non-goals/claims.
- Keep the Woven no-gap S381 disposition and the approved S406 collar-over-plackets rule unchanged. No other mapping is reopened. No new research is necessary: use existing source-bound records and reviewed exact-revision Chromium outputs.
- Gates: source/revision/option identity, local rendered-output inspection, a concise paired maintainer decision request, durable decision evidence and validated Control Center replay, focused board tests, schema validation and `git diff --check`. Since this slice changes no production code, changed-code coverage/build/export gates do not apply; full integrated gates remain for the settled Epic candidate.
- Blockers: (1) whether to clip a short segment of the source neckline beneath the projected collar, or keep it continuous and retain the 28-front hold; (2) whether to use per-option segmented arcs for the Polo H locator, or retain the current continuous ring and holds. Any approval authorizes only that view treatment and re-verification, not view release.

## Source-backed evidence and exact proposals

### Woven neckline/collar contact — 28 `FRONT_FLAT` configurations

- **Directly encoded:** on exact `live-draft:woven-shirt:14:14`, source `front.neckline` is a continuous body base-seam stroke. S410 traced its two full source paths at DOM indices 21–22, after the four projected upper/under-collar outlines. S417 maps the repeated contacts at approximately `(-0.8424, 8.1727)` and `(0.8424, 8.1727)` cm on all 28 fronts. Source stitch topology joins body/stand neckline and collar piece edges; it does not declare an overlap order between the body seam and projected collar exterior.
- **Already approved and implemented:** collar is drawn over the button and buttonhole plackets; this masks only the upper placket outline within the collar silhouette. The latest reaffirmation applies to this existing mapping and does not authorize clipping the neckline stroke.
- **Existing actual renders:** S417 Chromium overlay crops for default and `neckEase-max` show the repeated contact in red; the approved collar/placket boundaries are marked separately. S410 confirms drawing the full neckline over the collar is already production painter order and remains the same crossing. The only reviewed alternative is a view clip of 0.8426–0.8433 cm per side, hiding the body seam between center-front and collar contact. The collar outline then appears uninterrupted, but the visible single base-seam stroke is interrupted. Cut geometry, source stitch graph, and source paths remain untouched.
- **Decision choices:** approve this exact mask only for further all-28 option testing, accepting the visible seam interruption; or reject it and keep the continuous source stroke plus the 28-front hold. **Recommendation:** keep the continuous source stroke and hold, because that is source-faithful and neither source topology nor a pattern-specific reference supplies an occlusion convention. A later approved display convention could revisit this.

### Polo H locator — same 17 S399 `FRONT_FLAT` option outputs

- **Directly encoded/previously approved:** both source POM identities (`shoulder-seam`, `neck-width`) share the approved source-centered station `(7,0)`, 0.22 cm ring radius, H key and full text schedule. Source component contours/marks, target identities, options and exact revision IDs remain fixed.
- **S419 diagnostic result:** the continuous ring intersects source strokes in 17/17 options (`front:outline` and `outerStand:outline` every time; collars or the independent shoulder mark in several). A deterministic diagnostic removes only colliding angular spans, with a 0.045 cm arc clearance and 0.04 cm minimum segment. It retains 60.139–72.361% of circumference as two or three arcs; a second Chromium stroke sample found zero source path/mark contacts in 17/17. Actual default and least-coverage `standFrontRise-min` renders show the source strokes unbroken and H remains locatable, though the surrounding “SHOULDER” source labels remain crowded.
- **Decision choices:** approve this exact variable open-arc display rule for implementation and option-wide review; or retain the continuous ring and keep the 34 Polo faces held. It is an annotation convention, not a physical notch. The Polo faces remain held regardless until the 0.68 cm RMS meets the unchanged 0.25 cm gate and all other checks pass. **Recommendation:** approve the segmented diagnostic for production implementation/reverification, since it preserves every source mark/path and removes a repeated annotation crossing without suggesting missing cut material.

## Non-goals

No geometry/stitch/POM changes, physical notch claim, threshold relaxation, face acceptance, new recipe, G05/G09 work, UI redesign, CAD selection/implementation, physical sampling or production-readiness claim.

## Evidence pointers

- Woven: `docs/research/epic17/S410-woven-neckline-layer-order-trial/`, `docs/research/epic17/S417-woven-front-post-clip-intersection-audit/` (28-row JSON and default/`neckEase-max` rendered overlays).
- Polo: `docs/research/epic17/S419-polo-h-segmented-locator-trial/` (17-option matrix and matched baseline/segmented default/least-coverage Chromium crops).
- The S421 V03 rights research remains prerequisite-only and unrelated to this V02 decision packet.

## Exit evidence

- Manually inspected the saved exact-revision S417 default/`neckEase-max` Woven crops and S419 default baseline/segmented Polo crops. This confirms the packet descriptions: Woven clipping interrupts the continuous neckline/base-seam stroke; H segmentation preserves the overlapping source contours while leaving an identifiable but variable 2–3-arc locator. No new output derivative or production output was created.
- Board start evidence/replay advanced 2459→2461 through the validated command layer; exit evidence/comment replay advanced 2461→2464. Clone preflight from committed S421 through both command sets reproduces 2459→2464 and preserves all Epic/work-item statuses; V02 stays In Progress and V03 Backlog.
- No option, output, code, acceptance, view hold or threshold changed. Current integrated tally remains 56 accepted / 90 held over 73 configs / 146 faces; all 56 Woven and 34 Polo remain held. V02 In Progress, V03 Backlog.
- Focused verification: `npm run control-center:test` passes 42/42; board/command schema validation and clone/canonical replays pass; all four S422 preflight/replay scripts pass `node --check`; `git diff --check` passes. No production code changed; no changed-code coverage/build/export gate applies.
- Elapsed time approximately 1m25s (source/evidence reconciliation and render review 35s; packet/board work 35s; focused verification/closeout 15s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m).

**Next action:** ask both exact choices together after exit replay. While waiting, do not implement either semantic mapping; retain all face holds and continue only independent V02 work.
