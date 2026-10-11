# G04 V02 — Polo full default placement search — Slice 376

## Start boundary

- Started 2026-10-02 17:04:09 UTC from clean S375 commit `bbb8bc65f6c581cd17751cbfe7a04f8d568727a4` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 375; reserve unique slice 376. Canonical board starts at revision 1851; G04-V02 remains In Progress. Integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. All 34 Polo faces remain held.
- Goal record remains `active` and still needed for EPIC-17/G04 through V01→V02→V03, final gates and merge. The “Begin by admitting” phrase is historical and should be replaced at a later goal wording reconciliation; this slice does not mutate the goal record. Usage at start: primary 89% used with ordinary work allowed; weekly 76% informational.
- S375 establishes that the 48 nearest legal boxes did not yield a joint route in 15 configurations, but it did not search farther legal placements. The default Polo view is required, so this slice exhaustively evaluates every legal integer-centimeter label box in its bounded ±18 cm X/Y square before considering more configurations.
- No safe delegation: candidate generation, geometry clearance, joint callout placement, and same-revision rendering use the same Polo geometry and callout sources; Codex retains the slice.

## Scope and acceptance

Determine whether either exact Polo front POM can participate in any readable, joint default layout when every legal label box on the existing 1 cm lattice is searched, rather than only the nearest 48. Use the exact `polo-default` source revision, current front geometry, Chromium-measured text, and S375's three verbatim two-/three-line variants per callout. For every legal box, test the same seven leader shapes and unchanged 0.25 cm clearance, collar-tracking, leader-length, detour, pair-overlap, crossing and target-association checks.

- Enumerate the full bounded lattice and record legal-box counts by wrap variant, all route rejection counts, and every accepted individual route.
- Search the two POMs together for at least one joint pair. If found, render and inspect it as a diagnostic proposal; do not implement or release it in this slice. Its existence would require a later all-17-option check before any V02 claim.
- If no joint default pair exists on this lattice, record that no placement within this tested candidate set can satisfy the required default view. Do not extend the conclusion to sub-centimeter placements or prove mathematical nonexistence.
- Keep exact text, method, displayed value, tolerance, source revision, anchors, targets, pattern geometry, stitches, overlays, 0.25 cm gate, issue/hold behavior, all 34 Polo holds, all-seven V02 and V02-before-V03 unchanged.

## Non-goals and verification

No production code/POM changes, cut geometry, stitch graph, projection map, POM source metadata, thresholds, options, colorway changes, exports, board acceptance, or V02/V03 advancement. This diagnostic's rendered evidence omits colorway fill. No physical fit/factory claim, G05/G09 work or launch activity.

Focused evidence: deterministic Chromium search assertions, any candidate SVG/PNG (if found), manual visual review, validated Control Center board start/exit, `npm run control-center:test`, and `git diff --check`. Changed-production coverage/build/export gates are not applicable unless production code changes. Full integrated gates remain due once at the settled Epic/PR candidate.

## Exit record

## Findings and evidence

- The `polo-default` row resolved both unchanged source callouts to their exact `outerStand.frontEnd` and `outerStand.frontNeckline` targets. It enumerated every legal text box on the 1 cm lattice in the ±18 cm X/Y square for each of the six wrap variants: 865, 817, 870, 871, 853, and 870 legal boxes (5,146 total). No top-N cut was applied.
- Seven leader shapes were checked from each legal box: 36,022 total route attempts. None met 0.25 cm geometry clearance, so there was no individual route and no joint pair. All 36,022 failed geometry clearance; 35,792 also tracked the collar contour. Overlapping secondary rejection counts: 13,573 routes exceeded the 24 cm length cap and 5,961 exceeded the 1.75 detour ratio.
- Chromium reported zero browser errors. Manually inspected the emitted whole and detail source-anchor views. The exact A/B source anchors are about 2.001 cm apart in the crowded center-front outer-stand/neckline/placket region. Current unrelated callout leaders pass through this area. The target labels themselves remain blocked/omitted from the diagnostic view; no accepted wrapped-layout image exists. Colorway fill is omitted.
- **Conclusion:** no joint wrapped layout exists among the legal boxes tested for the mandatory default view on this lattice and within this search square. This does not rule out sub-centimeter placement, a placement outside the square, or a different layout model. Since the required default view has no candidate in this tested set, there is no candidate to validate across the remaining 16 options. No V02 claim or implementation follows from this result.
- Preserve all 34 Polo face holds. The independent 0.68 cm sleeve-cap residual still fails the unchanged 0.25 cm gate, and the exact callout/readability failures remain. Integrated tally stays 56 accepted / 90 held across 73 configurations / 146 faces; all-seven V02 and V02-before-V03 remain unchanged. S373's separate Woven sleeve-overlap decision is still pending.

Artifacts: `docs/research/epic17/S376-polo-full-default-route-search/wrapped-polo-feasibility.json` records all six layout counts, individual and joint candidate outcomes, rejected route counts, source identities and residuals. `search-summary.json` gives the aggregate. `source-anchor-views/polo-default-source-anchors.svg` and its whole/detail PNGs show the exact source geometry and A/B anchors. The reproducible search is `search-polo-wrapped-poms-default.ts`; launch Vite, set `G04_PREVIEW_URL` to its local URL, and run it with `npx tsx`.

## Exit verification and remaining work

- Diagnostic assertions pass: one required default case, both exact POM callouts resolved, zero browser errors, no accepted route or joint pair.
- No production source, tests, geometry, exports, or behavior changed. Changed-production coverage/build/export gates do not apply. The settled Epic/PR candidate still requires the complete global gates and rendered/output review.
- Validated board entry/exit revisions were 1851/1868. `npm run control-center:test` passes 42/42 after the final board mutation; `git diff --check` passes. Diagnostic assertions pass with one default row, both exact target callouts, and zero browser errors. No production files changed, so production-code coverage/build/export gates do not apply to this slice.
- **Next action:** keep the Polo default fail-closed and resume the next independent held G04 issue. Do not relax the route/clearance acceptance, all-seven requirement, 0.25 cm gate, or V02-before-V03 ordering.

## Slice timing

Elapsed wall time from the S376 start boundary to verification: about 9 minutes. Tracked estimates: diagnostic search harness 2m; focused full-lattice Chromium search and data checks 2m; rendered review 1m; durable packet/state/board work 3m; Control Center/diff verification 1m; external-agent waits 0m; maintainer-decision time 0m. No production changes or decision-dependent implementation occurred.
