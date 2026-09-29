# EPIC-17 / G04 admission — professional flats and CAD interchange

- **Status:** Admitted by explicit maintainer instruction on 2026-09-29. The canonical board was Backlog before this admission; the status transition is recorded through the validated Control Center command layer after this packet was written.
- **Admission slice:** 261 (reserved after refreshing `origin/main` and inspecting reachable slice history; highest existing slice was 260).
- **Goal start:** 2026-09-29 14:19:53 UTC.
- **Verified starting commit:** `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` (`origin/main`, PR #16 merge). `origin/main` was fetched with prune immediately before admission; the active checkout began at S260's reviewed tree. New work is isolated in branch `codex/epic-17-g04` from this exact commit.
- **Upstream status:** EPIC-14/G01, EPIC-15/G02 and EPIC-16/G03 are Closed on board revision 370; their linked summary work items are Done. Slices 228, 241 and 259, including S241 and S259 merge-exit records, are present on `origin/main`. G03 deployment evidence is in `docs/release/EPIC-16-G03-MERGE-EXIT-S259.md`.
- **Starting dirty state:** The original checkout had only pre-existing untracked coverage folders/logs and `tmp/`; no tracked edits. They were preserved. This admission branch is a clean managed worktree.
- **Estimate:** 16–20 landed slices, re-estimated from the seven-recipe topology, current schematic renderer, pattern and revision data, UI integration surface, CAD rights/receiver gate, and required final review. The estimate includes admission and final merge/closure evidence. The roadmap's former 9–14 estimate is historical and is updated by Slice 261. Calendar dates remain conditional; no date overrides a gate.

## Authority, dependencies, and admission boundary

The maintainer explicitly instructed Codex to start EPIC-17/G04 on 2026-09-29 and pursue it through safe merge. This admission supersedes the earlier board comment that said not to transition EPIC-17 without a separate instruction. The accepted roadmap is `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`; its G04 V01 → V02 → V03 sequence and acceptance criteria govern this work. The accepted source contract is `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`, especially its Slice 225 view model and Slice 226 A-04/A-05/A-06 exit boundaries. G01's digital limits and protected export statement are recorded in `docs/research/epic14/G01-FINAL-REVIEW-EXIT.md`.

Dependencies G01/G02/G03 are complete. G04 is serialized after G03 at integration. The seven supported recipes at admission are Tee, Darted tee, Tank, Polo, Woven shirt, Skirt, and Trouser. Existing `renderGarment` is a measurement-driven schematic and does not read full `Block` topology; it is not the source of truth for the new flats. `Block`, recipe construction metadata, options, saved style/revision state, POMs, and existing vector/export surfaces require a traced source-to-view contract.

No product implementation starts until this packet and its links are committed and the canonical Control Center records EPIC-17 as admitted. Slice 261 itself is documentation and board admission only.

## Ordered boundaries and planned slice slots

These are the admitted work boundaries, not permission to skip a gate. Slice IDs after 261 are planning slots; before each landed commit Codex will refresh `origin/main` and active history, confirm the next unused number, and shift later slots if another landed slice has consumed one.

| Planned slot | Boundary | Exit evidence / gate |
|---:|---|---|
| 261 | Admission, verified start, board transition, packet links and estimate | This packet; canonical board command history; context/state links; upstream closure and Git checks. No implementation code. |
| 262–264 | **V01 — primitives and source-to-view contract.** Inventory pattern, seam/stitch, mark, option, artwork, callout and POM sources; define typed vector primitives, stable identities, source classes, layer order and unsupported-feature behavior; map front/back details for all seven recipes. | Versioned contract and per-recipe source-to-view matrix, including silhouette, visible/hidden seams, topstitch, closures, pockets, darts/pleats, artwork, callouts and explicit omissions. Negative cases show missing or incoherent features rather than inventing them. Review with a qualified technical designer if available; record unavailable review as a limitation. |
| 265–272 | **V02 — live vector flats.** Render front/back from the same pattern and saved style revision; bind supported option, colorway and artwork overlays; anchor POM methods to represented geometry; enforce topology support and readable placement; integrate the live UI and validate every recipe/option matrix. | Deterministic revision-bound SVG/vector output, option/topology validation with actionable errors and no silent clamping, collision/occlusion/layout evidence, all-recipe and supported-option snapshots, parsed geometry/anchor checks, rendered visual review, and relevant MQF review notes. |
| 273–277 | **V03 — documented industrial CAD exchange profile and round trip.** Refresh primary source and rights evidence, select a receiver/version/profile only after rights review and evidence, define geometry/grade/notch/allowance/unit/label scope, add an additive profile/export route if justified, and exercise representative simple/complex/multi-size and negative fixtures through import/export. | Documented receiver/profile/version and permitted-use basis; preserved source/received/re-exported fixtures; per-piece/entity/count/bounds/unit/orientation/grade comparison; receiver inspection evidence; explicit unsupported content behavior. Exact compatibility is claimed only to the extent directly supported by the round trip. If a lawful receiver/profile cannot be established, V03 records the evidence-backed no-go and stops without a compatibility claim; the unresolved gate must be presented to the maintainer before substitute spending or a different external target. |
| 278–280 | G04 integrated final review, remediation, full gates, PR merge, board closure, and required automatic deployment verification | Review actual front/back rendered output and parsed/imported CAD artifacts; reconcile C04 A-04/A-05/A-06, the roadmap acceptance and limitations; review MQF findings; run the settled full suite with 100% global coverage, build/browser/Electron/output replay as applicable; inspect exact PR diff and ancestry; merge; validate board closure; verify required GitHub Actions deployment and site response. Adjust slots if earlier remediation adds slices. |

The initial estimated range is 16–20 slices. The planned slots above are a working decomposition and do not relax any V01/V02/V03 acceptance criterion. Any additional fix receives its own new slice number and updated estimate.

## Acceptance criteria

1. Complete roadmap packet V01, V02 and V03 and retain their stated exit evidence.
2. Define construction-aware technical-flat primitives and a source-to-view mapping for all seven current recipes, including silhouettes, seams, topstitching, closures, pockets, darts/pleats, artwork, callouts and layer order.
3. Produce live front/back vector flats from the same pattern and revision. Show proportional/construction annotations, applicable options and colorways, and POM callouts anchored to the geometry and method they represent.
4. Validate supported options against topology. Unsupported or invalid combinations remain visible with actionable corrections. Prevent unreadable overlap, detached or ambiguous labels, misleading construction, and unsupported pattern-derived claims.
5. Prove a documented industrial CAD exchange profile and round-trip behavior on representative fixtures. Select any receiver/profile only after current rights review and evidence. Use exact compatibility labels only for behavior demonstrated by imports and round trips.
6. Preserve the existing generic DXF behavior and every protected export byte identity. Do not move a baseline without a separate documented reason and explicit maintainer approval.
7. At the relevant V01/V02/V03 rendered-output exits, review MQF-004–007, MQF-011, MQF-012 and MQF-015 and record them as **To be reviewed** when applicable implementation is complete; classify complete/partial/uncovered coverage without creating unscoped remediation. Defer residual work per `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md` until the post-G17 maintainer review.
8. Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, the roadmap, packet evidence, and board in the same relevant landed change as behavior/evidence; close EPIC-17 only when all linked work has verified non-incomplete evidence and verified exit-report evidence.

## Non-goals and holds

- Pattern-linked side, oblique, inside and assembled 3D views remain G09/D04.
- Production tech-pack records, supplier-specific specifications, approvals and full tech-pack scope remain G05.
- No new garment recipe, garment research queue, physical sampling, supplier outreach, paid license/service, launch spending, hosted service, or production/factory-readiness claim.
- No broad UI redesign, global palette project, app-wide scroll/layout project, new artwork placement editor, or unowned MQF remediation.
- No claim of sewn fit, fabric drape, technician/factory acceptance, or production validity without the corresponding external evidence.
- Existing local-first and no-cost holds remain in force. No commercial receiver or parser purchase is authorized by this packet.

## Blocking decisions, risks and assumptions

- **V01/V02 start blocker:** none. Existing seven recipes and deterministic pattern inputs are available. V02 cannot claim `PATTERN_DERIVED` for geometry that is only estimated by a separate schematic formula; the view must trace actual geometry or be labeled by a narrower source class.
- **V03 gate:** a named CAD receiver/version and profile rights remain unresolved. This does not block V01 or V02, but it blocks profile implementation and any exact compatibility claim. Research current terms and a no-cost receiver/parser first. If selection needs paid rights or a supplier contact, stop at that concrete gate for maintainer direction.
- **Topology risk:** current `renderGarment` is a separate parametric schematic and omits some construction details; recipe options differ substantially, and not every option has an existing component/edge mapping. Missing mapping must produce a visible unsupported state.
- **Legibility risk:** dense front/back detail, text and POM anchors can collide at small views and printed scales. Verify actual rendered and parsed outputs at defined sizes; tests alone do not satisfy the gate.
- **Interchange risk:** current DXF is an entities-only generic stream with centimeter coordinate convention, no declared units, piece IDs, semantic names or grade relationship. It remains frozen by protected identities and cannot be labeled apparel-CAD compatible by syntax tests alone.
- **External review assumption:** qualified technical-design review and receiver access are not guaranteed. Record attempted/available evidence truthfully; do not substitute internal tests for external acceptance.

## Verification and delegation policy

- For each implementation slice, run focused tests and require 100% statement, branch, function and line coverage for changed production code. Record the test command/results, rendered/drafted output evidence, changed scope, integration risks and implementation/focused-check/agent-wait/maintainer-decision elapsed times in the slice exit record and `PROJECT-STATE.md`.
- Preserve the existing export identity regression gate. Never regenerate its fixtures as a workaround. Use actual rendered front/back snapshots and CAD import/re-export artifacts as evidence.
- Run the full repository suite and 100% global coverage once on the settled PR candidate before merge, unless a slice is independently mergeable/releaseable; run full builds, browser/Electron verification and output replay at the integrated Epic boundary. After a full-gate failure, preserve output, diagnose, run affected tests after fixes, then rerun the full gate once source/test changes are complete.
- Profile slow tests or worker-memory pressure before any worker-default change. Do not switch model selection to address local test load without evidence that inference consumes those resources.
- Slice 261 has no safe independent ownership: packet, roadmap, state and canonical board admission are coupled. Codex owns it. For each later slice, identify any independent low-risk deliverable. Use Claude Code/OpenCode only with separate worktrees, exact handoff/file ownership and a contributor `WORK FINISHED` signal before inspecting their changes. OpenCode must be Muse Spark 1.3 xhigh in normal mode. If unavailable, stop and ask rather than substituting. Shared contracts, geometry, export logic, integration and final review remain Codex-owned.

## Slice 261 admission exit record (complete)

- **Result:** EPIC-17/G04 admitted; V01 is the immediate next action. Implementation has not begun in this slice.
- **Acceptance:** admission gates passed after board and document validation; V01–V03 product acceptance remains pending.
- **Git:** starting tree `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; latest assigned slice before admission 260; S261 reserved. Original checkout's pre-existing untracked artifacts were not copied, modified or deleted.
- **Board:** canonical revision 381 at admission. The validated command layer moved the Epic and summary card to `In Progress`, linked this packet, created `G04-V01` (`Ready`), `G04-V02` (`Backlog`, depends on V01), and `G04-V03` (`Backlog`, depends on V02), and recorded the maintainer admission note. Slice 262 moved V01 to `In Progress` through the same command layer at revision 382.
- **Verification:** `npm run control-center:test` passes 33/33 after updating the board regression expectation; `git diff --check` passes. The first Control Center run failed 1/33 because a test still expected EPIC-17 to remain Backlog; the regression now asserts the admitted state, packet link, work-card order/dependencies, and remaining backlog. No product tests/builds are in scope for this documentation/board-only slice.
- **Blockers:** none for V01. V03 receiver/license choice is a gated unresolved fact.
- **Remaining dependency:** start V01 after the S261 admission commit.
- **Next action:** execute V01's source-to-view inventory and primitive contract under the V01 gate.
- **Elapsed-time breakdown:** context and admission implementation 15m 00s; focused verification and correction 4m 03s; external-agent wait 0m; maintainer-decision time 0m.

## Slice 262 source inventory exit record (complete)

- **Result:** `docs/research/epic17/G04-V01-SOURCE-INVENTORY.md` records source capabilities and construction-data gaps, plus front/back candidates for all seven recipes. No product code or export behavior changed.
- **Acceptance:** each source category is tied to the existing model; missing visibility/topstitch/pleat/closure/finish metadata is explicit; source absence is not treated as proof of real-garment absence.
- **Git:** started at `89d7cf780d155bfb4331371000f2b166b34bad35`; latest assigned slice was 261; S262 reserved. `origin/main` remains the verified admission base pending the final PR.
- **Board:** revision 382; `G04-V01` is `In Progress`, transitioned through `executeBoardCommand`.
- **Verification:** `npm run control-center:test` passed 33/33 after updating the board regression expectation. Source assertions were checked against the pattern, recipe, style, mark, POM and stitch definitions and the C04 contract. No production source changed, so focused production coverage was not applicable.
- **Blockers:** none for V01. Exact role assembly and primitive semantics remain open implementation work. V03 receiver/profile rights remains gated.
- **Next action:** define typed vector primitives and their versioned source references with focused coverage for changed production code.
- **Elapsed-time breakdown:** implementation/source review 5m 02s; focused verification 1m 20s; external-agent wait 0m; maintainer-decision time 0m.

## Slice 263 primitive-contract exit record (complete)

- **Result:** `src/render/technical-flat.ts` defines the versioned front/back view, path/circle/text/artwork/callout primitives, explicit source classes and revision references, centimetre coordinate system, stable semantic identities, paint-layer order, and notices for unsupported or unresolved source data. The shared validator checks view/source identity, geometry, callout resolution and same-revision binding.
- **Acceptance:** invalid input is returned as explicit issues; no coordinates or options are clamped; callouts require geometry targets; artwork preserves the existing true-scale rectangle, transform and z-order contract; V01 uses the same vocabulary as C04. Live recipe mappings and UI rendering are still pending.
- **Git:** started from S262 commit `b36dd9a4ed1828608023a44567650098c64bad94`; highest assigned slice at start was 262; S263 reserved. `origin/main` remains the verified admission base pending final PR.
- **Verification:** `npm run coverage -- src/render/technical-flat.test.ts --coverage.include=src/render/technical-flat.ts` passed 8/8 at 100% statement, branch, function and line coverage. Final `npm run build` passed TypeScript and the Vite production bundle; Vite emitted its existing large-chunk advisory. Lockfile install was isolated to ignored `node_modules` in the managed worktree; package manifests did not change.
- **Board:** revision 383 links verified evidence `E-G04-S263-EXIT` to `G04-V01` using the validated command layer.
- **Blockers:** none for V01. Per-recipe face assignment and ambiguity validation remain to be implemented. V03 receiver/rights is separately gated.
- **Next action:** complete the seven-recipe source-to-view mapping and topology checks in Slice 264.
- **Elapsed-time breakdown:** implementation 9m 10s; focused verification and repairs 3m 20s; build 0m 20s; external-agent wait 0m; maintainer-decision time 0m.
