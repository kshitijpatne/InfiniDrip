# G04 V02 projection-mapping contract — Slice 277

## Start and authority

- **Slice start:** 2026-09-30 00:48:58 UTC.
- **Goal:** continue the explicitly maintainer-authorized EPIC-17/G04 V01 → V02 → V03 scope through safe merge and deployment verification.
- **Starting Git:** clean branch `codex/epic-17-g04`, commit `85783a4422dc728a75b1783513781adb9f52989d` (`Slice 276: record face projection source gap`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Reachable history's highest assigned slice is 276; reserve S277.
- **Starting board:** canonical `ops/control-center/data/board.json`, revision 417. EPIC-17 is In Progress; G04-V01 Done; G04-V02 Blocked; G04-V03 Backlog. The S276 exit evidence records rejected full-role fold reflection and why `Piece.onFold` cannot define face visibility.
- **Admission authority:** G04 V01 explicitly includes a source-to-view mapping for all seven recipes. A G04-owned mapping metadata layer is the bounded representation of that admitted scope. This engineering interpretation does not change pattern cut geometry, pattern coordinates, or the maintainer decisions register. If the exact mapping needs canonical source changes outside G04, stop and present the concrete gap.
- **Dependencies:** S264 source-to-view membership map, S262 source inventory, S276 face visibility investigation, current `Block`/option topology, and V01 primitives in `technical-flat.ts`.

## Slice boundary

Define the source-bound metadata vocabulary and validation contract needed to describe which exact contour runs and landmarks belong in a front/back technical view and which role instances they represent. Preserve same-draft and same-revision identity. Missing, stale, malformed, or unrepresentable metadata must remain a visible hold; it must not be guessed from screenshots, role naming, stitch lengths alone, or a whole-role fold reflection.

This boundary establishes schema and validation behavior; it does not claim coherent rendered output or complete V02. Later admitted slices must author and visually review recipe mappings against actual source geometry and option topology.

## Acceptance criteria

1. The contract identifies a role, face, exact source edge run or endpoint landmark, a logical component instance shared across faces, and semantic treatment without changing the source `Piece` geometry.
2. Every reference resolves against the exact drafted block and live revision used for the view. Current source endpoint and endpoint-coincident mark references are verifiable; arbitrary interior curve/edge splits are rejected and held until authored source landmarks exist.
3. Valid metadata is deterministic across all seven supported recipe defaults and each declared numeric option endpoint wherever current source topology can express it. Unknown recipes, missing roles/entities, duplicate edge assignments, stale revisions, malformed landmarks and inconsistent instance references fail closed with actionable issues.
4. Metadata does not claim a visible seam, topstitch, construction edge, closure, or component multiplicity unless the source mapping explicitly supports it. No unsupported contour is silently omitted from an accepted view.
5. Focused tests cover valid and invalid contracts and achieve 100% statement, branch, function, and line coverage for changed production code. Build passes. Any renderer behavior changed by the contract gets focused output evidence.
6. Protected export identity tests remain unchanged and pass if the shared test grouping is run; no DXF source, fixtures, or baselines are edited.
7. `PROJECT-STATE.md`, `ARCHITECTURE.md`, admission plan, context index, slice packet, and canonical board record the boundary and its evidence. `git diff --check` passes.

## Required gates

- Before implementation: inspect exact role/entity IDs in the current draft sources and validate assumptions against S262/S264/S276; write this linked packet; move G04-V02 from Blocked to In Progress only after the bounded metadata scope is recorded in the validated board.
- Focused tests and 100% all-dimension coverage for changed production modules; TypeScript/Vite build; current Control Center command tests; protected export/DXF identity verification where relevant; direct diff and whitespace review.
- Verify drafted/source-bound fixture mappings against real default drafts and each declared numeric option endpoint that could alter mapped topology. Preserve unresolved contours as holds.
- Do not run the full repository/global coverage gate at this non-releaseable contract boundary. Run it once on the settled integrated Epic/PR candidate, with full browser/Electron/output replay at that boundary.

## Non-goals and holds

- No pattern coordinate, cut shape, seam construction, option range, or source recipe change.
- No V02 completion claim, whole-role reflection, inferred contour split, inferred seam visibility, or visual-appearance guess.
- No G09/D04 side/oblique/inside assembled view; no G05 tech-pack content; no new recipe, physical sampling, supplier contact, spending, hosted service, or production-readiness claim.
- No DXF or other legacy export behavior/baseline changes.
- MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed` for the later V02 rendered exit; MQF-015 remains assigned to V03. These are review checks and do not expand this slice. Preserve findings-document post-G17 deferrals.

## Blocking decisions, risks, and delegation

- No new maintainer decision blocks defining a G04-owned mapping metadata vocabulary under the explicit V01 source-to-view scope.
- **Blocking technical fact:** any requested partition not anchored to exact source topology must remain held. If resolution requires pattern changes outside G04 or materially changes accepted scope, stop and ask before dependent work.
- **V03:** receiver/version/profile rights remain unresolved and gate V03 only.
- **Risk:** role membership currently lacks contour-run visibility and instance semantics; careless defaults could reintroduce crossed or misleading faces. The schema must not make ambiguity look accepted.
- **Delegation:** no safe independent low-risk ownership; contract, renderer/source mappings, and fixtures are coupled. Codex owns this slice. External-agent wait target is 0m.

## Exit evidence (complete after gates)

- **Implementation:** `src/render/technical-flat-projection.ts` defines versioned front/back role mappings with same-revision identity, shared logical instance IDs for a role present on both faces, exact edge-bound runs, and explicit per-edge holds. Every drafted source edge must occur once in that accounting. Endpoint references may name exact drafted edge endpoints or existing pattern marks that resolve exactly to those endpoints. Interior split points remain unsupported; no geometry is inferred or changed.
- **Acceptance:** passed for the contract boundary. Tests validate all seven current recipe maps at defaults and every declared numeric option min/max endpoint; malformed, missing, stale, duplicate, mismatched, hidden-role and unsupported interior-mark references fail closed. Recipe-specific projection records and rendered face acceptance are deferred to S278+; this slice does not complete V02.
- **Verification/output evidence:** `npm run coverage -- src/render/technical-flat-projection.test.ts --coverage.include=src/render/technical-flat-projection.ts` passed 8/8 with 100% statement, branch, function and line coverage. `npm run build` passed TypeScript and Vite (existing large-chunk advisory). `npm run control-center:test` passed 33/33. `npm run test -- src/export/regression.test.ts src/quality/export-identity.test.ts` passed 17/17, with no export sources, fixtures or byte identities changed. Drafted option-topology checks are in the focused projection test; no renderer behavior changed, so no new browser screenshots were produced. `git diff --check` passed.
- **Git/board:** starting commit `85783a4422dc728a75b1783513781adb9f52989d`, S277 uniquely reserved after S276; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. The validated board command layer linked `E-G04-S277-EXIT` to G04-V02 and recorded V02 In Progress; board revision 421 before final exit.
- **Blockers / next action:** no new maintainer decision was required for the admitted mapping contract. Existing missing interior landmarks remain visible technical holds. Next: refresh refs/history and packet S278 for source-supported per-recipe mapping integration plus actual rendered review; stop before any out-of-scope pattern-source change.
- **Elapsed-time breakdown:** implementation/contract design and correction 7m; focused verification and coverage work 5m; build and protected-output review 2m; board/docs closeout 2m; external-agent waits 0m; maintainer-decision time 0m. Total about 16m from 00:48:58 to 01:04:45 UTC.
