# G04 V02 — Woven uncut band detached-detail feasibility — Slice 370

## Start boundary

- Started 2026-10-02 13:01:54 UTC from clean S369 commit `56015e7a3d3fb427c3ebb8432aa810b7a3d9599b` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 369; S370 is reserved. Canonical board revision is 1727 after S369 exit evidence. EPIC-17/G04-V02 remain In Progress; V01 Done; V03 Backlog. Usage at start: primary 24%; weekly 54% informational.
- S369 rejects the conditional assembled-band projection across all 28 Woven configurations: full band 37 cm is compressed onto an 18.5 cm back hem half (0.5 ratio), with four self-crossings per outline and one crossing per mirrored pair. All 56 Woven faces and 34 Polo faces remain held. The maintainer reaffirms Polo's 0.25 cm residual gate.

## Bounded diagnostic question

Can a source-faithful, detached band detail inside the BACK flat's drawing frame communicate the exact Woven sleeve-band relationship without distorting the cut piece or implying an unverified join? This tests an alternative view composition after S369 failed; it does not revise the approved S321 assembled convention or accept output.

Candidate inspected: preserve the current approved back sleeve/body silhouette; show two complete `sleeveBand` source outlines at source scale, reflected about source-declared `back.centerBack`, in the left and right side gutters. Rotate only the detached detail for page fit, preserving `sleeveBand.top[0,1]`, `sideRight`, `bottom`, `sideLeft` and the `bandFold` mark. Label both pieces as detached details, identify the source stitch `Folded sleeve band ↔ sleeve hem`, and state that the details are not at their assembly locations. At the default option, the detail boxes are x[-31.5,-28.5] and [28.5,31.5], y[17,54] cm; at maximum band depth they widen to x[-33.5,-28.5] and [28.5,33.5]. Minimum body clearance is 1 cm. There are no leader lines; text relates `sleeveBand.top[0,1]` to the represented `sleeve.hem[0,0.5]` intervals without depicting a false direct join.

The pattern source directly establishes the full band outline, 37 cm top and full sleeve-hem stitch; S370 confirms the full sleeve hem is also 37 cm while the back-facing receiver interval is 18.5 cm. Showing two unscaled bands in rotated side-gutter details and the displayed note are proposed design decisions, not source evidence or sewing instructions. The idea fits and avoids band/body overlap, but the rendered main garment still shows crossing sleeve outlines. This alternative only clears the band-detail conflict and cannot accept a face. It changes the previously approved assembled-band convention; do not implement any production view metadata or composition without maintainer approval.

## Acceptance and verification

- Reconcile all 28 exact Woven options / 56 face identities on revision `live-draft:woven-shirt:14:14`; preserve original instance multiplicity, reflection, source piece/edge identity and current layers.
- Produce annotated default and relevant option-extreme overlays showing garment outline, exact receiver intervals, source band outline/fold mark, instance IDs and proposed detached detail/callout positions.
- Measure that inset outlines remain unscaled, source-closed and non-self-crossing; detect inset/body, inset/inset, label, connector and page-frame collisions for every configuration. Confirm connectors are visibly annotations, not seam strokes.
- Render selected Chromium cases and inspect them manually for clear relation, multiplicity, exact uncut geometry, readability, clipping and misleading overlap.
- Diagnostic failure or success does not change any acceptance: keep all 56 Woven and 34 Polo faces held, 56 accepted / 90 held, all-seven V02, V02-before-V03, protected exports and the 0.25 cm residual gate. No production, geometry, stitch graph, option, POM, DXF, V03, UIQ, G05/G09, sampling or physical/factory claim work.
- Run focused diagnostic checks, Control Center tests after board replay, and `git diff --check`; no full production coverage/build/export gate applies unless production code changes. Full integrated gates remain required before merge. Codex retains ownership; no safe disjoint task is available.

## Exit record

**Disposition: feasible as a band-only detail proposal; no complete face passes.** All 28 Woven options / 56 face requests use exact revision `live-draft:woven-shirt:14:14`. The uncut source top remains 37 cm, both reflected instances remain at 1:1 source scale, each outline is closed with zero self-crossings, pair crossings are zero, and the side-gutter placement retains at least 1 cm clearance from the body/sleeve bounding boxes. All five Chromium cases render with zero browser errors and are manually reviewed. The relation is called out in text as a detached detail; no false assembly seam or direct join is drawn. The main garment still has the existing sleeve-outline crossing, so all 56 Woven faces remain held; all 34 Polo faces remain held as well. No production files, source geometry, stitch graph or acceptance logic changed.

**Decision:** the maintainer approved the exact two reflected, unscaled, rotated side-gutter band details with explicit “detail only—not at assembly location” text during the S371 boundary interaction on 2026-10-02. This authorizes a separate S372 implementation of the band-only view composition. It resolves band-outline overlap only; the sleeve-outline crossing and all other holds remain. No face is accepted by the decision.

Evidence: `S370-woven-band-detail-feasibility/detached-band-layout-matrix.json`, five rendered SVG/PNG pairs, `detached-band-layout.test.mjs`, `focused-test.log`, `control-center-test.log`, and `S370-verification-notes.md`. Validated start evidence/comments end at board revision 1731; exit evidence/comments and supplemental Control Center evidence end at revision 1749. The Control Center suite passes 42/42 after the last board replay; `git diff --check` passes. No production coverage/build/export gate applies because no production code changed.
