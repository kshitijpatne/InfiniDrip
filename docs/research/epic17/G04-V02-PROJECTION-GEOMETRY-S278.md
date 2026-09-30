# G04 V02 projected source geometry — Slice 278

## Start and authority

- **Slice start:** 2026-09-30 01:10:48 UTC.
- **Goal:** continue the explicitly maintainer-authorized EPIC-17/G04 V01 → V02 → V03 sequence through safe merge and deployment verification.
- **Starting Git:** clean branch `codex/epic-17-g04` at `23a11a4b38d65fb343cbee253e7cf539b3e44b66` (`Slice 277: define face projection mapping contract`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Active history's highest assigned slice is 277; reserve S278.
- **Starting board:** revision 421; EPIC-17 In Progress, V01 Done, V02 In Progress, V03 Backlog. `E-G04-S277-EXIT` records the exact edge/run and held-edge metadata contract.
- **Dependencies:** S262/S264 source inventory and recipe mapping, S266 geometry compiler, S270 face assembly, S272 live renderer, S276 rejected visual experiment, and S277 validated projection-map contract.

## Slice boundary

Teach the source-geometry compiler to consume an optional validated `TechnicalFlatProjectionMap`. Emit only exact source edge runs selected for that face, retain each edge's source identity in the resulting geometry, and turn unresolved visible edges into explicit geometry issues so live composition cannot present a partial face as accepted. Preserve current behavior when no projection map is supplied. Hidden interior roles remain intentionally hidden per the existing role treatment.

This slice supplies the mapping-to-geometry adapter; it does not author the seven recipe maps, change live defaults, or claim that the V02 rendered faces are coherent. The next mapping/output boundary must provide actual source-backed maps and production Chromium review.

## Acceptance criteria

1. The optional path validates exact recipe, revision, face, role, instance and edge references against the supplied `Block`; invalid maps emit no projected primitives.
2. Emitted paths include only explicitly projected edge runs, preserve line and cubic endpoints/controls in forward or reversed direction, retain the existing role-outline identity used by POM anchoring, and list the exact contributing source edge IDs.
3. Visible held edges create actionable issues and withhold the face; intentionally hidden interior edges do not create a false visible-face failure. Every source edge remains accounted for under S277's validator.
4. Calls without a projection map retain legacy S266 source-geometry behavior byte-for-byte at the primitive structure level.
5. Focused tests cover line/cubic/reversed edge runs, exact identity, malformed/stale maps, visible holds, hidden-role holds, and legacy behavior. Changed production modules achieve 100% statement, branch, function and line coverage; TypeScript/Vite build passes.
6. Default and numeric-option-endpoint drafts for all seven recipes validate through the optional adapter using explicit test maps. No pattern coordinate, renderer default, export implementation or protected baseline changes.
7. `npm run control-center:test`, applicable protected export/DXF identity tests and `git diff --check` pass; context, architecture, state, admission plan, packet and board evidence are updated.

## Required gates

- Inspect the existing geometry, POM target IDs, validator, live composition and exact S277 tests before edits.
- Run focused coverage for every changed production module at 100% across statements, branches, functions and lines; run the TypeScript/Vite build; prove legacy no-map output parity; run current Control Center tests and protected export identities.
- Use actual drafted blocks and option endpoints as geometry fixtures. Do not call parser or unit-test results visual acceptance; this slice adds no new browser output because the production renderer is not switched to a projection map.
- Reserve the full repository/global 100% coverage gate and integrated browser/Electron/output replay for the settled Epic/PR candidate.

## Non-goals and holds

- No static recipe face-projection maps or live renderer default switch; those require their own exact mapping and rendered review.
- No guessed interior contour split, role reflection, role omission, seam visibility, or transform from screenshots or stitch lengths alone.
- No pattern or cut-coordinate change; no DXF, export identity or baseline change.
- No G09/D04 side/oblique/inside views, G05 tech-pack content, physical sampling, supplier contact, spending, hosted service, broad UI redesign, or production-readiness claim.
- MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed` at the V02 rendered exit; MQF-015 remains assigned to V03. Preserve post-G17 deferrals.

## Blocking facts, risk, delegation

- No maintainer decision blocks this bounded compiler adapter.
- Missing face split landmarks remain a blocking fact for any map that would require them. A held contour must withhold that visible face; it cannot be silently dropped.
- **Risk:** source-edge aggregation feeds existing POM target identities. The adapter must preserve those IDs while adding per-edge traceability, or it would detach callouts.
- **Delegation:** no safe disjoint low-risk ownership; source geometry, validation, callout anchors and live composition share identities. Codex owns this slice; external-agent waits expected 0m.
- **Effort:** one compiler-adapter boundary within the provisional 25–29-slice Epic estimate; revise only if retained mapping/output evidence requires additional boundaries.

## Exit evidence

- **Implementation:** `compileTechnicalFlatSourceGeometry` accepts an optional validated projection map and compiles only its explicitly named source-edge runs into the existing role-outline geometry ID. It preserves ordered source edge IDs, exact line/cubic geometry and reversed cubic control order; it validates same-revision metadata, emits source-specific issues for visible holds, and returns no projected primitives when a visible face is unresolved. Hidden interior roles remain handled by existing face policy. The live renderer still calls the legacy no-map path.
- **Acceptance:** passed for this adapter boundary. Synthetic but source-bound maps built against actual Blocks compile default and declared option endpoint drafts for all seven recipes; explicit visible holds, stale maps and malformed source coordinates withhold output. POM outline-target identities remain unchanged. No static recipe map or rendered-face acceptance claim is made.
- **Verification/output evidence:** final focused command `npm run coverage -- src/render/technical-flat-geometry.test.ts src/render/technical-flat.test.ts src/render/technical-flat-options.test.ts --coverage.include=src/render/technical-flat-geometry.ts --coverage.include=src/render/technical-flat.ts --coverage.include=src/render/technical-flat-options.ts` passed 24/24 with 100% statements, branches, functions and lines for all changed production modules. `npm run test -- src/render/technical-flat-options.test.ts src/render/technical-flat-live.test.ts src/render/technical-flat-poms.test.ts src/render/technical-flat-geometry.test.ts src/render/technical-flat.test.ts` passed 37/37. `npm run build` passed TypeScript and Vite (existing chunk-size advisory). `npm run control-center:test` passed 33/33; protected DXF/export identities passed 17/17; `git diff --check` passed. A first build reported tuple casts and missing propagation of projection issues through `technical-flat-options`; both were corrected and the final build passed. The first Control Center run caught a stale S277 comment assertion; the fixture now asserts S278 and passes. No browser matrix is applicable because live rendering does not yet supply projection maps.
- **Board/Git:** started clean at `23a11a4b38d65fb343cbee253e7cf539b3e44b66` after refreshing `origin/main`; S278 was uniquely reserved after S277, and `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board began at revision 421; packet link/comment is recorded at revision 422. Final verified exit evidence `E-G04-S278-EXIT` is linked through the validated command layer. The unique landing subject is `Slice 278: compile mapped source geometry`.
- **Blockers/next action:** no maintainer decision blocks the adapter. S279 must author source-backed maps, connect them to live rendering, and review actual browser output across recipes/options; any unresolved visible edge continues to withhold that face. Do not infer missing interior splits or seam visibility.
- **Elapsed-time breakdown:** implementation 6m; focused verification/corrections 4m; build and adjacent-consumer/protected-output review 2m; board/docs closeout 2m; external-agent waits 0m; maintainer-decision time 0m. About 14m from 01:10:48 to 01:24:24 UTC.
