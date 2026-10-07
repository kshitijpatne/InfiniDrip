# G04 V02 — Woven keyed marker line preservation — Slice 400

## Start boundary and authority

- Started 2026-10-07 05:30 UTC from clean S399 commit `220291fd90f44b922f54d29cdcfb90daa311e6e6` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice was 399; S400 is uniquely reserved. Canonical board revision 2232 has EPIC-17/G04-V02 In Progress, V01 Done and V03 Backlog. Primary usage 3%; weekly 0%; ordinary usage allowed.
- The maintainer approved the exact S396 proposal: keep the 0.22 cm open ring at the exact source-centered midpoint of `buttonPlacket.top`, paint it after any colorway fill but underneath source strokes, offset only W by `(+0.2121,+0.2121 cm)`, and retain the full keyed POM schedule. Approval authorizes this view-only implementation and verification only.
- S396's exact 28-option evidence and rendered proposal are the acceptance comparison. Revalidate the treatment in the production SVG renderer, not only by applying an offline SVG transform.

## Scope and acceptance

- Integrate only S396's ring layer placement and W glyph offset for Woven keyed `W` in the renderer. Preserve the POM source ID, target, source revision, anchor, marker radius, measured value/method/tolerance, full-text schedule row, all path identities/geometry, colorway output and paired backs.
- Replay the exact 28 supported Woven options and compare output invariants against S395/S396. Confirm the ring is before every source stroke (and after colorway fill), continuous source strokes paint above the ring, W glyph placement matches approval, keyed schedule is unchanged/readable, and there are no new crossings, overlap, parse or browser errors. Inspect whole-view and detail output for `default` and `placketWidth-min` at minimum.
- Run focused renderer tests with 100% statement, branch, function and line coverage for changed production code; run relevant build and protected export/DXF identity checks if production change impacts them; Control Center tests and `git diff --check`. Do not run global coverage until the settled integrated Epic candidate.

## Non-goals and holds

- No source/cut/stitch geometry, POM semantics, target mapping, schedule wording, key identity, other callout placement, export behavior or baselines change. No accepted face is implied.
- Keep all 56 Woven and 34 Polo views held. The independent 28 Woven back hem crossing and Polo 0.68 cm sleeve-cap residual against the 0.25 cm gate remain. Preserve all-seven-recipe V02 acceptance, V02-before-V03, protected export identities, and V03 rights/receiver/round-trip gates.
- No V03 CAD claim, G05 tech-pack content, G09/D04 assembled side/oblique/inside views, new recipe, UI redesign, physical sampling, supplier contact, launch spend, hosted service, physical-fit/factory-acceptance/production-readiness claim.

## Decisions, dependencies, and delegation

- Resolved decision: maintainer approved exact S396 W ring-under-path and glyph-offset proposal on 2026-10-07. S396 detailed geometry and measured option-wide evidence remain linked at `docs/research/epic17/S396-woven-marker-line-preservation/`.
- No blocking decision for this bounded implementation. Independent Woven back hem topology hold remains blocking for those views only.
- No safe independent low-risk delegated work exists because renderer ordering, same-revision POM metadata and rendered inspection are coupled. Codex owns integration and review; external-agent waits 0m.

## Start-board record

- Start replay is in `S400-start-board-commands.json`, through validated `executeBoardCommand`.

## Exit record

### Implemented output and rendered review

- The live compiler now maps only the exact `pom:woven-shirt:finished-placket-width` front callout after checking the revision, `buttonPlacket:outline` target, and `buttonPlacket:edge:top` source entity; missing or duplicate/mismatched source fails closed. Back views remain unchanged. The production renderer applies S396's approved presentation: the open 0.22 cm ring remains anchored to the same-revision midpoint and renders after colorway fill but before source strokes; only W shifts `(+0.2121,+0.2121 cm)`. The full-text POM schedule remains unchanged.
- The exact 28 Woven option values from S363/S395 were rebuilt through the production recipe compiler and actual renderer at revision `live-draft:woven-shirt:14:14`. All 28 outputs preserve the exact POM source/target/source edge/revision metadata, path and colorway identity. The ring sits below every source stroke in 28/28; the live keyed annotation metadata and ring/glyph coordinates are exact in 28/28; the single unchanged full schedule row fits in its frame in 28/28; zero renderer or browser errors.
- Clearance measurements match S396's diagnostic evidence: minimum W glyph-to-source-path clearance is 0.079391 cm and glyph-to-existing-label clearance is 0.029141 cm. This relies on measuring the actual emitted SVG paths and text in Chromium; the tightest adjacent label remains close but non-overlapping.
- Captured actual-renderer whole/detail/schedule outputs for `default`, `placketWidth-min`, `neckEase-max`, and `combined-supported`. Manually inspected default whole/detail and limiting `placketWidth-min` detail plus the full schedule. The source strokes continue visibly across the ring; W remains associated with the anchored ring; the complete POM value/tolerance is readable in schedule. The S381 back hem crossing is untouched and remains held.
- Unit tests verify exact live compiler mapping/fail-closed behavior and renderer colorway → marker underlay → source stroke order, same-revision marker identity, fixed ring, glyph-only offset, and unchanged full schedule.

### Verification and disposition

- `npm run coverage -- src/render/technical-flat-svg.test.ts src/render/technical-flat-live.test.ts --coverage.include=src/render/technical-flat-svg.ts --coverage.include=src/render/technical-flat-live.ts`: 82/82 tests pass; both changed production modules are 100% statements, branches, functions and lines.
- `node docs/research/epic17/S400-woven-placket-marker-implementation/replay-woven-marker.mjs`: 28/28 outputs generated through compiled live callout mapping and the production renderer; 28/28 source identity, mapped annotation, layer order, ring/glyph, schedule and path/colorway identity checks; zero browser errors. Evidence is `woven-W-actual-renderer-matrix.json` and `rendered/`.
- `npm run build` passes with the existing Vite chunk-size advisory. `npx vitest run src/quality/export-identity.test.ts src/export/regression.test.ts` passes 17/17, including protected byte-identity and legacy DXF regressions. `npm run control-center:test` passed 42/42 on serial rerun. A first concurrent run had one transient server-test failure while build/export commands were running; isolated `node --test ops/control-center/server.test.mjs` passed 4/4, then the full suite passed 42/42. `git diff --check` passes.
- No export identity, baseline, pattern/cut/stitch geometry, source mapping, POM, schedule data, option, paired back, acceptance state, or V03 profile decision changed. All 56 Woven and 34 Polo faces remain held. Polo residual remains 0.68 cm against 0.25 cm; independent Woven hem crossing and other Woven topology/view holds remain. All-seven V02 and V02-before-V03 gates are unchanged. No physical fit, factory acceptance, or production-readiness claim.
- S397's MQF-004–007, MQF-011/012, and MQF-015 findings remain mapped for review at applicable G04 output exits; retain the findings' post-G17 deferrals. S400's local marker check is not closure of those findings.

### Time, board and next action

- Active elapsed time is approximately 18m from 2026-10-07 05:30:14 UTC to close: implementation 4m; focused coverage/build/export/board checks 4m; actual 28-option replay and output review 7m; durable packet/state/board closeout 3m; external-agent waits 0m; maintainer-decision time 0m (approval preceded the slice start). Wall clock included verification waits.
- Validated start replay: board 2232→2234. Validated exit replay is recorded in `S400-exit-board-commands.json` and advances the current board with output matrix, rendered artifacts, packet and closeout comments.
- **Next action:** refresh the clean branch, `origin/main`, board, and usage, then continue with the highest-frequency remaining V02 blocker without relaxing any face hold or acceptance criterion.
