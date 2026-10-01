# G04 V02 — POM verification closeout — Slice 339

## Start boundary

- **Slice start:** 2026-10-01 19:04:18 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, evidence-backed V03, final output review, required gates, and safe merge to `origin/main`.
- **Verified Git:** clean `codex/epic-17-g04` at `88f906ed28af49a5d9301e20ab288a8e2ea59bd3` (`Slice 338: add source-exact Polo POM anchors`). Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice is 338; reserve 339.
- **Verified board:** revision 1217. EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. S338 exit, 17-option browser replay, rendered diagnostic, build, export regression, and coverage failure evidence are linked to G04-V02 and EPIC-17. The integration baseline is 56 accepted / 90 held across 73 configurations / 146 face requests / 32 option fields.
- **Usage:** ordinary work allowed, primary 2%, weekly 10% informational.
- **Admission/dependency:** bounded follow-up within the admitted G04 V02 sequence; S338 and its unresolved coverage gate are its direct dependency. The S338 commit is not merged to `main`.

## Scope and acceptance

Close the S338 source-exact POM test-coverage gap and stale S326 Trouser assertions. Add focused tests for the unexercised source-identity, same-face role/edge/mark, option-availability, resolver fallback, and fail-closed paths that S338 introduced. Update `drafting/recipe.test.ts` and `drafting/trouser-tables.test.ts` to reflect the source-approved `flyUnderlap` role and stitch graph without weakening assertions. On 2026-10-01 the maintainer approved adding a midpoint mark to `flyUnderlap.shieldEdge` at `t: 0.5`, using the existing `flyShield.left` midpoint notch as the location convention. Source confirms `flyUnderlap.shieldEdge` actually joins `flyShield.right`, while `flyShield.left` joins `frontLeft.flyEdge`; the new mark is therefore a design choice, not a matched mark on its sewn counterpart. Implement only that approved mark and its rendering regression check. It changes no cut geometry or stitches and leaves short-edge finishing unspecified.

Acceptance requires: changed S338 logic reaches 100% statement, branch, function and line coverage; relevant drafting/render suites pass, including the corrected Trouser role/stitch/notch assertions; `npm run control-center:test`, build/typecheck, and `git diff --check` pass. Verify the approved underlap mark resolves on `shieldEdge` at `t=0.5` in a draft/render/export regression and preserve the distinct `flyShield.right` stitch relation; do not change DXF implementation or protected byte identities. Keep Polo output held; no POM layout or other production changes are in scope.

## Holds and non-goals

- Keep all 34 Polo faces held: S338's latest production replay reports zero SVG, 34 holds, no browser errors, repeated POM label collisions, and a 0.68 cm sleeve-cap residual against 0.25 cm tolerance.
- S338's manually inspected diagnostic labels crowd/overlap; this packet does not resolve their layout. Do not accept any face based on the diagnostic.
- The approved S326 source repair adds `trouser fly underlap`. Before S339, the pocket-composition block had 11 stitches and the universal `Notches + grainline on every piece` check failed solely because the underlap had no notch. The maintainer has approved a midpoint mark on `flyUnderlap.shieldEdge`; its source stitch is to `flyShield.right`, so this mark is not matched to the sewn counterpart. The two short edges remain unmarked. Keep all geometry/stitches unchanged and make no physical sewability claims.
- The maintainer approved the fold-axis `upperCollar.centerBack` dimension-only reference and back hem-drop paired reference in S338. Implement both in a later numbered slice with same-revision provenance and rendered readability evidence; no physical fold edge or hem joining edge may be drawn.
- Preserve all-seven V02 acceptance, legacy DXF behavior and protected export identities. V03 remains gated. No G05 content, G09/D04 assembled views, new recipe, sampling, fit/factory claim, supplier contact, launch spend, hosted service, or production-readiness claim.
- No safe independent, low-risk delegation exists. Codex owns coverage repair, test updates and review. OpenCode remains restricted to Muse Spark 1.3 xhigh in normal mode; no OpenCode task is planned.
- Effort/date remains conditional. Estimate 1–2 focused implementation/test slices for coverage and assertion corrections, then separate Polo POM readability/dimension slices and the settled Epic gate; no completion date is promised.

## Verification plan

1. Implement and test the approved underlap mark location, while documenting the source stitch relation accurately; do not change the universal notches check or source cut geometry.
2. Use retained S338 coverage result (98.13% branch; 100% statements/functions/lines) to add narrow tests only for uncovered new logic. Do not alter coverage thresholds or runner defaults.
3. Run affected suites, then the drafting/render verification selection (excluding no tests) and confirm all tests pass and changed behavior is covered. If a full-repository gate is still required, keep it for the settled integrated Epic candidate.
4. Keep production output holds unchanged. Record any newly discovered output/readability failure for its own bounded slice.
5. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, packet exit and the board through the validated command layer. One unique `Slice 339:` commit only.

## Exit record

- **Implemented:** added focused source-identity and exact mark endpoint coverage; made authored mark-point selection and source-edge checks explicit while preserving fail-closed behavior. Corrected the stale S326 role/stitch expectations. Applied the maintainer-approved underlap midpoint mark (`shieldEdge`, `t=0.5`) as a design convention; documented that it is not seam-matched because that edge stitches to `flyShield.right` while the source notch is on `flyShield.left`.
- **Verification:** drafting/render selection 777/777 across 67 files; all five changed production modules at 100% statement, branch, function and line coverage. TypeScript and production build pass (existing large-chunk advisory). Protected export identity/regression/tech-pack suites pass 24/24. Control Center tests pass 33/33 after board changes. `git diff --check` passes. Drafting and true-scale export assertions locate the new notch at its exact resolved and layout-translated coordinates.
- **Acceptance / remaining holds:** S339 tests and gates pass. No cut geometry, stitches, DXF implementation or export baselines changed. No new V02 face is accepted; integrated status remains 56/146 accepted and 90 held, with all 34 Polo faces held on POM label conflicts and the 0.68 cm sleeve-cap residual versus 0.25 cm. The approved dimension-only Polo references and readable POM label placement remain pending. V02 remains In Progress; V03 remains Backlog.
- **Board:** validated command-layer revisions 1224–1227 link `E-G04-S339-EXIT` to G04-V02 and EPIC-17 and record the exit. Control Center passes 33/33.
- **Time:** approximately 51 minutes from 19:04:18–19:55 UTC. Implementation/test edits about 14m; focused drafting/render/coverage verification about 18m; build/export/Control Center checks about 7m; durable records and board closeout about 12m; external-agent waits 0m; maintainer-decision time not separately measurable. No delegation was used.
- **Next action:** implement the approved Polo fold-axis leaf and back-hem-drop dimension-only references with exact same-revision identities, then review callout readability across all Polo configurations. Keep every Polo face held until the residual and all POM label conflicts pass. Do not start V03 before all-seven V02 acceptance.
