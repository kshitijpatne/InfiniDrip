# G04 V02 Woven POM bent-leader route — Slice 364

## Start and verified boundary

- **Goal:** determine whether a view-only multi-segment route can connect the Woven finished-placket-width POM's exact source anchor to a readable label without crossing the four projected collar outlines. Keep S363's straight-leader fail-closed guard until a routed candidate passes the exact-option and rendered review.
- **Start:** 2026-10-02 09:56:39 UTC, from clean S363 commit `b637f1d2952c497d836d3aceb520fb10cc7f4fe9`, branch `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is S363; S364 is reserved. Board revision is 1559; EPIC-17/G04-V02 remain In Progress, V01 Done, V03 Backlog.
- **Goal record:** active and still matches the admitted V01→V02→V03 through safe-merge objective. The current user decision retains Polo's 0.25 cm gate.
- **Prior commit closeout:** import the verified S363 commit onto its five start/exit/matrix/hold/anchor evidence records with the canonical validated `importFacts` command layer.

## Scope and acceptance

Inspect the exact production SVG, source/revision identities, projected contour paths and open path endpoints. Investigate a bounded view-only route from the exact current-revision midpoint of `pattern:woven-shirt:role:buttonPlacket:edge:top` to a measured label position. The source anchor is option-dependent: the retained S363 combined-supported example is `(3, 8.2)` cm, while the S362 default-front diagnostic is `(2.5, 8.2)` cm. Do not hardcode either point. Route segments must avoid all four projected `outerStand`, `innerStand`, `upperCollar`, and `underCollar` outline paths; the route must visibly remain attached to the exact source anchor and must not disguise another seam or garment edge. Keep label collision/clearance checks and fail closed when no route is found.

Implement only if the route is deterministic, source/revision-bound, tested for segment intersections, and readable in Chromium. If implemented, require 100% statement/branch/function/line coverage for changed production code and replay all 28 Woven configurations / 56 faces; inspect default, max stand height, combined-supported, collar/stand extremes and any altered output. A route that merely removes `TEXT_COLLISION` without readable rendered evidence does not pass.

## Non-goals and holds

- No changes to pattern/cut geometry, role topology, stitch graph, POM anchor/value/tolerance, collar projection, callout semantics, Polo mapping or the 0.25 cm gate.
- No hold is lifted by this slice. Keep all 56 Woven and 34 Polo faces held, all-seven V02 acceptance, V02-before-V03, legacy DXF, protected byte identities, and CAD rights/profile/receiver gates unchanged.
- No G05 tech-pack, G09/D04 assembled view, new recipe, UI redesign, sampling, supplier contact, spending, hosted service, fit/factory acceptance, or production-readiness claim.

## Decision and delegation

No new construction/design decision is required: only leader presentation is in scope, and the exact source POM remains authoritative. If a bent leader cannot be shown without misleading depiction, retain S363 fail-closed holds and record the specific route obstruction. This shared renderer/path-layout work has no independent low-risk file owner; Codex owns it, with no external agent assigned.

## Required gates

Run focused renderer tests and changed-module 100% four-metric coverage; typecheck/build and protected export identities for the changed paths; the full Woven 28-configuration / 56-face production replay and manual Chromium output review if behavior changes; canonical Control Center tests/validated commands and `git diff --check`. Do not run full repository coverage/browser gates before the settled integrated Epic/PR candidate.

## Exit result

**Result: no production route implemented; keep S363's fail-closed guard.** The default-front source/revision is `live-draft:woven-shirt:14:14`; the callout remains bound to `pattern:woven-shirt:role:buttonPlacket:edge:top`, target `flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline`, and anchor `(2.5, 8.2)` cm. The measured label endpoint remains `(8.5632, 10.7637)` cm. The contour diagnostic includes the actual visible reflected paths: two `outerStand`, two `upperCollar`, and two `underCollar` instances, with 256 flattened path segments; `innerStand` is not emitted on this exterior face.

An offline 5 mm grid route search with 25 mm centerline clearance found a candidate with zero intersections against those collar segments and 25.66 cm total route length. The straight span is 6.583 cm, making the route 3.90 times longer. The route has seven segments and six intermediate turns after the source anchor; it passes around the outerStand tip, then runs alongside the projected collar perimeter to reach the current label. The rendered review overlay (`S364-woven-pom-bent-leader-route/route-feasibility-default-overlay.png`) shows that path reading as a second collar edge/outline, despite its measured 0.251 cm minimum centerline clearance. It is geometrically non-crossing but visually misleading, so it does not meet the route readability gate. This is a concrete failed candidate, not evidence that every possible label relocation is mathematically impossible.

The first exploratory overlay used a thinner 8 mm clearance. Correction to the interim investigation note: the selector already included fold-reflected path IDs; it did not omit them. The final route diagnostic retains all six visible collar path instances, uses 25 mm clearance, and records the exact crossing count and minimum clearance. No production renderer, pattern, cut geometry, stitch graph, POM anchor/value/tolerance, projection, Polo threshold, exporter, or acceptance status changed. All 56 Woven and 34 Polo faces remain held; integrated acceptance remains 56 accepted / 90 held across 73 configurations / 146 faces. Polo's user-confirmed 0.25 cm gate and all-seven V02 / V02-before-V03 remain.

### Verification and evidence

- `node docs/research/epic17/S364-woven-pom-bent-leader-route/route-feasibility.mjs`: passed; found route, zero collar crossings, minimum clearance 0.251 cm, 25.66 cm route length versus 6.583 cm direct span. Durable measurements: `route-feasibility-default.json`.
- Chromium render of the candidate is retained at `route-feasibility-default-overlay.svg` and `.png`; manual inspection rejects its perimeter-following appearance.
- No production tests, coverage, build, or full 28-option replay were run because no production behavior changed and this diagnostic candidate is rejected. The full integrated Epic gate remains required at the settled PR candidate.
- Canonical Control Center commands were preflighted and applied at revision 1565 → 1579; board description corrections were separately preflighted/applied at 1579 → 1582 and 1582 → 1585. The corrections retained durable S364 results while restoring exact S361/S362/S363 phrases still asserted by existing board regression tests.
- First Control Center test run exposed two stale phrase expectations in the S361/EPIC board checks; a second run exposed an additional existing S362 summary phrase in the G04 check. The implementation/board regression was in overwritten descriptive text, not command behavior. Preserved all existing facts in expanded descriptions and replayed each correction through the validated layer. Final `npm run control-center:test`: 42/42 pass at board revision 1588.
- Final route diagnostic rerun: passed, six visible collar instances and 256 flattened segments, zero route/collar intersections, 0.251 cm measured clearance, 25.66 cm route length. Chromium overlay was regenerated and manually inspected. `git diff --check`: passed.

Elapsed from 2026-10-02 09:56:39 UTC to the verified slice boundary: approximately 22 minutes. Route diagnostic implementation and correction ~8 minutes; focused route checks and rendered review ~6 minutes; packet/context/board closeout, including board-test diagnosis ~8 minutes; production implementation 0 minutes; external-agent waits 0 minutes; maintainer-decision time 0 minutes. No safe disjoint delegation existed.

**Next action:** start a fresh numbered diagnostic slice to inspect the still-rejected Woven back sleeve/band X against the exact reflected instances, source joins, and current assembly transforms. Preserve all holds and only propose a view change if existing source and the S321 approval uniquely support it; otherwise record the conflict and retain the hold. Do not advance V02 or start V03.
