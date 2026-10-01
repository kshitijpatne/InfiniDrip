# G04 V02 — Polo source-exact POM anchors — Slice 338

## Start boundary

- **Slice start:** 2026-10-01 17:37:45 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, evidence-backed V03, integrated final output review, required gates, and safe merge to `origin/main`.
- **Verified Git:** clean `codex/epic-17-g04` at `b113f25da4b28d075326c5ec30f73030a79c2f35` (`Slice 337: diagnose Polo flat holds and anchors`). Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest active slice is 337; reserve 338.
- **Verified board:** revision 1193. EPIC-17 and G04-V02 are In Progress, V01 Done, V03 Backlog. Integrated baseline is 56 accepted / 90 held across 73 configurations / 146 face requests / 32 option fields. All Polo and Woven faces remain held.
- **Usage:** primary 25%, weekly 9% informational; ordinary work allowed.
- **Admission:** this is an ordered, bounded implementation slice within the existing EPIC-17/G04 admission, not a scope or acceptance change.

## Scope and acceptance

Implement a same-revision, per-POM source-role resolver for Polo anchors and add only source-exact anchor references whose represented source entity is available on that face. Cover visible body/sleeve/closure/stand/collar-tip/vent/hem landmarks from S337's audit. Preserve the current POM measurements, tolerance values, cut geometry, stitch graph, assembly transforms, assembly tolerance, source-to-view semantics, legacy DXF behavior and all protected export identities. Resolve exact piece/role identity separately per view; do not infer a back anchor from a front anchor. Reuse existing exact-point/mark callouts and fail closed on missing role, source entity, revision, or readable label placement. Do not add new dimension geometry, project an unshown point, draw an excluded fold edge, or modify the represented garment contour.

Implement only source-exact visible Polo POM anchors in this slice. The maintainer has separately approved dimension-only display for `upperCollar.centerBack` and the `front.hem.start` → `back.hem.start` hem-drop reference; implement them in a numbered follow-up after this bounded anchor slice so their projected geometry and output checks have explicit exit evidence. Keep any other POM whose source reference is not actually represented in a face table-only. This slice cannot accept any Polo face while the `Sleeve-cap ease` residual exceeds 0.25 cm; preserve every existing complete-face hold and all-seven acceptance.

## Bounded source anchor set

Use the exact same-revision source edge/mark/vertex roles recorded in `G04-V02-POLO-REMAINING-HOLDS-S337.md`: four existing body anchors; shoulder and armhole source edges; sleeve cap/hem/side references; button-placket construction marks/edge; outer-stand front end/front neckline; upper-collar `frontTip`; face-specific body vents and HPS-to-hem vertices. Front and back role/instance selection comes from the approved S333 face map and S337 exact topology matrix. POM values remain those of the recipe methods. Do not change the measurement semantics.

Pattern vertices/marks and same-revision face membership are direct source facts. A single leader to the exact selected source vertex or emitted mark is the existing renderer convention. If the callout would need a hidden role, second endpoint dimension line, projected reference, new overlap rule, or new deformed registration, stop and keep it table-only. The maintainer approved the two dimension-only conventions during S338 on 2026-10-01; their exact scope and limits are recorded in `docs/PROJECT-DECISIONS.md`. They do not authorize drawing the fold edge as a garment contour or implying that the front and back panels join at the hem. S338 remains limited to source-visible same-face anchors; implement the two approved dimensions in the next numbered slice.

## Verification gates

- Add focused tests for per-POM front/back roles, source vertex and mark anchors, same-revision target identity, absent role/mark behavior, duplicate/malformed POMs, notices, label collisions and preservation of current other-recipe behavior.
- For every changed production module, attain 100% statement, branch, function and line coverage. Run only focused suites first; retain complete failure output and diagnose before repair.
- Build the production app, preserve legacy DXF behavior and protected export byte identities, and replay all 17 Polo configurations / 34 face requests in production Chromium. Confirm the unresolved sleeve assembly hold still withholds all faces and does not leak candidate callouts.
- Inspect a separately labelled diagnostic rendering of the actual same-revision Polo geometry and visible POM leaders on both views; verify each target lands on its intended entity and labels do not cross/overlap. This diagnostic is not an accepted production flat.
- Run Control Center tests after board updates, board-schema validation, and `git diff --check`.
- Reserve full repository tests/global 100% coverage and seven-recipe 73-configuration / 146-face replay for the settled integrated Epic/PR candidate. No full-repo gate is needed for this independently non-mergeable slice.

## Dependencies, holds, and non-goals

- Depends on admitted G04 V02 and the exact S333 Polo projection / S337 source and POM trace.
- The maintainer's “approved, proceed” reply to the S336 question means retain the recommended Woven sleeve-cap and collar-base holds; it authorizes no nonrigid view mapping.
- The two Polo dimension-only display decisions are approved; keep their implementation in the next bounded slice after visible same-face anchor work. All implementation remains conditional on rendered readability and exact same-revision identity.
- No new garment, broad UI redesign, source geometry or stitch change, physical sample/fit claim, supplier contact, spending, hosted service, G05 production-tech-pack content, G09/D04 assembled view, or production-readiness claim. V03 remains gated on all-seven V02 acceptance.
- No safe disjoint, low-risk delegated task is available; Codex owns implementation, integration, tests and rendered review. Do not use an alternate OpenCode configuration.
- Effort/date assumptions are conditional. Estimate this slice at 1–3 implementation slices including any callout layout follow-up, plus the settled full Epic gates; no completion date is claimed.

## Exit record

### Implementation and evidence

- Added per-POM front/back role and edge identities, exact emitted mark identities, and option-topology availability guards. Polo now has a Polo-local body POM map; Tee's shared POM definitions are unchanged. Missing face-specific source entities remain table-only or fail closed. Dimension-only references approved during this slice were not implemented here.
- The live resolver binds each callout to its same-revision mapped source role/edge/mark and validates source identity before emitting. The technical-flat validator now rejects a source-edge callout targeting a non-path role primitive. No pattern/cut geometry, stitches, measurement formulas, assembly transforms/tolerance, DXF code, or export baseline changed.
- Focused tests: 120/120 across seven changed-area suites. TypeScript: pass. Production build: pass (existing Vite chunk-size advisory). Protected DXF/export regression set: 63/63. Control Center suite: 33/33 before exit board mutation. `git diff --check`: pass before final docs/board edits; rerun at boundary.
- A 65-file drafting/render verification selection passed 748/748 tests when excluding two stale Trouser assertions. The selection also exposed the same two failures when included: `drafting/recipe.test.ts` still expects eight roles (S326 adds `flyUnderlap`) and `drafting/trouser-tables.test.ts` still expects ten stitches (S326 adds two). These assertions are unrelated to S338 and must be corrected in their own numbered follow-up before the settled full gate.
- Focused coverage selection reached 100% statements, functions and lines, but branch coverage remained 98.13% against the repository's 100% threshold (POM resolver 96.62%, live resolver 97.28%, mapping 97.07%, flat validator 99.21%; POM interface and SVG emitter 100%). The missing branch paths are a failed gate, not an accepted threshold change. Retain output and close these branches with focused tests before merge; do not change runner defaults or threshold.
- Fresh production Chromium replay covers 17 Polo configurations / 34 face requests: 0 SVG faces, 34 held, 0 browser errors. The same 0.68 cm sleeve-cap residual vs 0.25 cm remains. Front also reports `Finished collar stand height` and `Stand front rise` label collisions; back reports `Sleeve bicep width` collision. All 17 configurations retain these same face holds.
- Manually inspected `production-replay/polo-default-front_flat.png` and both labeled diagnostic overlays. The production hold notice is readable and no partial face leaks. The diagnostic candidate places many POM labels in crowded shoulder/placket clusters; some are visibly overlapping at rendered size. It is diagnostic-only and not acceptable output. Keep every Polo face held; a later layout pass must resolve all actual readable-label conflicts before a face can pass.
- Exact per-POM source identity and option-presence matrix: `S338-polo-pom-anchors/source-anchor-diagnostic-matrix.json`. Default front/back diagnostic overlays are explicitly non-production. Production matrix and screenshots are in `S338-polo-pom-anchors/production-replay/`.

### Acceptance and stopping point

- **Passed:** implementation behavior in focused tests; typecheck/build; protected export identities; complete option replay and fail-closed output; visible hold messaging; no source geometry or export identity changes.
- **Failed/pending:** 100% branch coverage; stale Trouser assertions discovered by the broader selection; diagnostic candidate label readability; all Polo and Woven faces remain held, so the all-seven V02 acceptance is unmet. V03 remains Backlog.
- **Decision:** no issue was hidden by weakening a threshold or acceptance criterion. Codex remains responsible for exact branch and rendering fixes. No independent low-risk delegated task was safe; agent waits 0m. Maintainer time for the two S338 approvals was not separately timed.
- **Elapsed:** approximately 82m05s (17:37:45–18:59:50 UTC), recorded by category as implementation/source edits 20m; focused verification/build/export checks 37m; option replay and rendered inspection 15m; durable packet/board closeout 10m; external-agent waits 0m; maintainer-decision time not separately timed. Categories are approximate active effort; the elapsed interval includes tool execution and review.
- **Single next action:** reserve S339 for focused branch-coverage completion and the two stale, source-repair-specific Trouser regression expectations; keep the Polo face holds. After that boundary, implement the already-approved Polo fold-axis leaf and back-hem-drop dimension-only references in a separate numbered slice with exact same-revision provenance and rendered readability checks. Do not begin V03.

Validated board evidence and comments are recorded at revision 1217 for G04-V02 and the EPIC-17 summary. `npm run control-center:test` passes 33/33 after those updates, and `git diff --check` passes. The S338 commit is recorded in the next slice's verified start boundary; the failed coverage/readability items remain open in G04 V02.
