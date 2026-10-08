# G04 V02 — Woven front and back resolution — Slice 457

## Boundary and authority

Started 2026-10-08 02:56 UTC from clean S456 commit `61f69681d48e990cd8c3568e62705c435ca7f614` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 456; S457 is unique. Canonical Control Center board revision at start was 2754: EPIC-17 In Progress, V01 Done, V02 In Progress, V03 Backlog; 56 accepted / 90 held over 73 configurations / 146 face requests. The S457 start packet is `S457-start-packet.md`.

The maintainer approved (1) S454's same-revision collar-leaf silhouette mask for Woven fronts, superseding S425's continuous-visible-base-neckline decision, and (2) revisiting S442's fixed S370 detached-band positions to use S441's local-Y sleeve reflection for Woven backs, including the measured outward relocation needed to retain band clearance. These are explicit view-only decisions, not pattern-source evidence. The maintainer separately approved the S396 Woven W marker, S402 D marker, S403 pocket foreground, S404 shoulder/collar occlusion trial, collar-over-plackets front layer order, and the S441 decision on band layout. Those precedents are preserved; this slice changes no unrelated approved mapping.

## Implemented scope

- **Fronts:** mask only the exact same-revision `front.neckline` seam strokes where they lie inside the rendered `underCollar` or `upperCollar` leaf silhouettes. Source paths, joins, geometry, POMs, colorway, options, open-V segment, and source revision remain unchanged. The mask is a front-view display convention and does not add a physical notch or stitch.
- **Backs:** apply the approved local-Y reflection to the whole Woven sleeve pair in BACK_FLAT only. Keep both source-scale sleeve-band details at two instances each and relocate them outward to maintain measured separation. Do not alter the source stitch graph, piece cut geometry, role multiplicity, revision, or S370's band scale.
- **No other face or acceptance behavior changed.** Polo's 34-face hold, the all-seven V02 gate, the 0.25 cm residual threshold, V02-before-V03, legacy DXF behavior, protected export byte identities, and all V03 rights/profile/round-trip gates remain in force.

## Evidence and acceptance

Production replay used the actual current compiler/renderer and Chromium with `live-draft:woven-shirt:14:14`: 28 option configurations, 56 face requests, 28 front and 28 back SVGs emitted; zero compile issues, renderer issues, browser errors, or mismatched full POM schedules. Exact D-marker/full-schedule checks passed in 28/28 options.

The browser-based front audit in `front-leaf-mask-audit.json` confirms 56 same-revision neckline-stroke mask instances and zero missing instances across 28 options. The projected open-V neckline remains visible, with measured path length 0.508812–1.286568 cm per mirrored side. The mask follows actual upper/under collar fill geometry; it does not change the cut/stitch paths.

The back scan in `local-y-candidate-geometry.json` used actual Chromium SVG output, strict proper intersections, source-scale S370 detail bounds, and segment-in-fill checks across all 28 options: sleeve-pair crossing histogram is zero in all 28; no body-fill penetration, body-outline crossing, or frame failure; exactly two detached band details remain per option; minimum band-to-sleeve clearance is 1 cm. `back-band-layout-audit.json` records outward movement 20.5737–22.4315 cm per side and a viewBox width of 105.5474–111.8849 cm, an increase of 41.1474–44.863 cm over S401. This is the disclosed layout cost of the approved convention, not an inference that the source specifies sleeve handedness.

Codex inspected default, `collarLeafDepth-min`, and `combined-supported` front crops and default, `collarLeafDepth-min`, and `combined-supported` full back views in the actual Chromium output under `production-rendered/png/`. The fronts retain the open-V line and show the leaf silhouette in front. The backs show separated upright sleeve halves and two detached source-scale bands outside the sleeve silhouettes; text and POM schedules remain readable at the rendered output scale. No crossing, incorrect join, fill penetration, output error, or hidden unrelated source mark was found in these inspected outputs.

## Focused verification

- Renderer suites: `npx vitest run src/render/technical-flat-live.test.ts src/render/technical-flat-projection.test.ts src/render/technical-flat-assembly.test.ts src/render/technical-flat-svg.test.ts src/render/woven-detached-band-detail.test.ts` — 5 files, 148 tests passed. Focused coverage measured 100% on `technical-flat-projection.ts`; `technical-flat-live.ts` measured 99.77% statements/lines, 99.84% branches and 100% functions. The only uncovered live-module lines are the existing Polo sleeve-residual diagnostic formatter (843–844), outside the S457 changed hunk; S457's changed mask and projection branches are covered. The integrated repository gate remains required at the settled Epic candidate.
- Broader render sub-suite with coverage: `npx vitest run src/render --coverage --coverage.include=src/render/technical-flat-live.ts --coverage.include=src/render/technical-flat-projection.ts` — 31 files, 443 tests passed; same unrelated Polo formatter lines remain uncovered.
- Protected export identity and regression checks: `npx vitest run src/quality/export-identity.test.ts src/export/regression.test.ts` — 2 files, 17 tests passed. No export baseline or legacy DXF behavior changed.
- `npm run build` passed with the existing Vite large-chunk advisory. `git diff --check` passed. The full repository coverage gate, integrated all-recipe production replay and final review are reserved for the settled Epic/PR candidate.

## Status, holds, risks, and next gate

Woven's two prior view blockers now pass the applicable 28-option output/geometry checks. Woven's 56 face requests may be counted accepted after this evidence is linked to the canonical board. The integrated matrix therefore becomes **112 accepted / 34 held** over 73 configurations / 146 face requests; all 34 remaining held requests are Polo. This is face-level progress only: **V02 remains In Progress** because all seven recipes must pass one integrated V02 review. The Polo source sleeve-cap residual remains 0.68 cm against the fixed 0.25 cm gate. **V03 remains Backlog and cannot begin until V02 passes.**

V03 still requires a rights-reviewed receiver/version/profile and observed representative import/export/round-trip evidence. No exact industrial format compatibility, physical fit, factory acceptance, or production readiness is claimed. No physical sampling, supplier contact, spending, broad UI redesign, G05 tech-pack content, or G09/D04 pattern-linked side/oblique/inside assembly scope is admitted.

At the relevant G04 output exit, review MQF-004–007, MQF-011, MQF-012 and MQF-015 as review checks and mark applicable findings “To be reviewed”; retain the findings document's post-G17 deferrals. These checks do not expand implementation scope.

## Board closeout, timing, and next action

The canonical Control Center command sequence was preflighted and replayed through the shared validated command layer. Board revision advanced 2754→2760. EPIC-17 and G04-V02 remain In Progress; V01 Done; V03 Backlog. The Epic summary, V02 card, verified evidence links and current tally now agree. Two intermediate board-suite runs found stale S454/S419 assertions after the summary refresh; the test expectations were updated to assert the current S457 state, and the final `npm run control-center:test` passes 42/42. Canonical board validation and `git diff --check` pass.

Elapsed 02:56–03:15 UTC (about 19 minutes): implementation 3m; focused tests/coverage/build/export verification 5m; production replay and geometry audits 3m; rendered review 2m; durable records, board regression repair and replay 6m; external-agent waits 0m; maintainer decision time 0m during this slice (decisions were supplied before implementation began).

**Next action:** begin the next uniquely reserved V02 slice with a consolidated exact-source diagnosis of Polo's remaining 0.68 cm sleeve-cap residual against the fixed 0.25 cm threshold. Preserve all 34 Polo holds unless a same-revision, all-option fix passes source/topology, rendered-output, POM/readability and option-matrix checks. Keep V03 gated.
