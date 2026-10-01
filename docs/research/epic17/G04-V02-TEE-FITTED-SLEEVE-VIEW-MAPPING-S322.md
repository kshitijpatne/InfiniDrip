# G04 V02 — Tee/Fitted approved sleeve view mapping — Slice 322

## Start record and verified boundary

- **Goal:** continue admitted EPIC-17/G04 through V01 → V02 → V03 and verified merge; this slice owns only the maintainer-approved Tee/Fitted sleeve view mapping.
- **Slice start:** 2026-10-01 01:53:34 UTC.
- **Starting Git:** branch `codex/epic-17-g04`, clean at `5731dd123bf600a61d655c17956e0762dc64859f` (`Slice 321: propose V02 source topology mappings`). `git fetch origin main` returned `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an ancestor of HEAD. Active branch/history highest assigned is 321; S322 is reserved.
- **Starting board:** validated canonical `ops/control-center/data/board.json`, revision 799; EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog. S319's retained matrix is 73 configurations / 146 faces / 32 option fields, with 28 accepted and 118 held. No current face status is presumed passed by the S321 decisions.
- **Upstream dependencies:** G01/EPIC-14, G02/EPIC-15, and G03/EPIC-16 are recorded complete and merged, including S259 G03 closure. Their current board state and origin ancestry are rechecked as part of the Epic admission record; this slice does not reopen them.
- **Usage at start:** ordinary use allowed; primary window 2% used. Weekly meter is informational.

## Authority and decision record

The maintainer's 2026-10-01 instruction in the active goal explicitly approves the exact S321 Tee/Fitted proposal: a view-only cap-half, side, and hem-half mapping; two mirrored sleeve instances; no visible partition line; no cut geometry change and no stitch line at the mapping boundary. This is a product/view decision, not source-encoded construction evidence. The distinction and exact geometry evidence are in `G04-V02-SOURCE-MAPPING-PROPOSALS-S321.md` and the annotated source overlays under `S321-pattern-overlays/`.

The approved roles are:

- `FRONT_FLAT`: `capLeft`, `sideLeft`, and the left hem half ending at the live hem arclength midpoint.
- `BACK_FLAT`: `capRight`, `sideRight`, and the right hem half beginning at that same live midpoint.
- Each view shows two sleeve instances mirrored across the center axis of its corresponding front/back body role. The join and partition remain view metadata; the partition itself emits no stroke or source mark.
- Map against the exact draft/revision in the active configuration. Never copy S321 default coordinates into the production map.

The geometry basis, per face, comes from `src/drafting/sleeve.ts`: the cap halves meet at the authored crown; `sideLeft` and `sideRight` connect their respective underarm and hem ends; the hem is a straight edge. Tee and Fitted each order the sleeve-cap stitch as `capLeft + capRight` against front then back armhole interfaces. The order supports assigning front/back cap halves; the hem midpoint and second mirrored display instance are approved conventions. No pattern source, stitch graph, recipe geometry, export or baseline may be edited in this slice.

## Scope and gates

**In scope:** typed, fail-closed view metadata for source-bound edge-arclength hem halves and paired sleeve display; exact front/back Tee and Fitted mapping; focused tests; production renderer integration if required to consume that metadata; production-rendered output and configuration evidence.

**Acceptance evidence required:**

1. Both recipes map every visible sleeve contour edge exactly once per face, account for opposite-face edges without treating them as unresolved, bind every landmark to the same drafted block/revision, and produce no partition stroke.
2. Two mirrored sleeve instances appear across the exact assembled body center axis while preserving source lengths and original coordinates. Sleeve cap joins align to front/back armhole source interfaces without double outlines or crossing contours.
3. Every applicable Tee/Fitted configuration and declared option endpoint is rendered and inspected; unsupported/incoherent or unreadable cases remain fully held with no partial face. Existing holds are released only when full face checks pass.
4. Focused changed-production tests achieve 100% statement, branch, function and line coverage; build/typecheck as applicable; legacy DXF/protected export identities pass unchanged; focused Control Center suite and schema validation pass.
5. Retain machine-readable matrix, SVG and browser-rendered images plus manual crossing/overlap/callout review. Review MQF-004–007, MQF-011, MQF-012 and MQF-015 only where the G04 output exit applies; keep mapped findings `To be reviewed` and preserve the research register's post-G17 deferrals.
6. Write slice timing split between implementation, focused verification/diagnosis, browser/rendered review, durable records/board/closeout, external-agent waits, and maintainer-decision time.

**Non-goals:** changing cut geometry, adding a stitch/seam at the view partition, Woven sleeve or collar mapping, Polo collar mapping, Woven closure overlap, Trouser front repair, any other recipe, face status advancement without evidence, V03/CAD receiver selection, G09/D04 assembled views, G05 tech-pack content, UI redesign, physical fit/sampling, supplier/factory/launch work, or production-readiness claims.

## Dependencies, risks, and decisions

- S321 exact source audit and five overlays; approval is now recorded above. No additional generic construction-source search is needed.
- The paired display needs a view-space reflection across the assembled body center axis, not the sleeve's local on-fold reflection used for a different physical pair. Validate axis role and edge against the current same-revision body piece.
- A visually coherent mapped sleeve does not automatically pass the full face: retain each recipe/option hold if seam joins, body/sleeve overlap, POM labels or any other existing face check fails.
- No safe independent delegated ownership exists: mapping metadata, shared geometry compilation, assembly transforms and production rendering form one behavior boundary. Codex owns implementation and review. OpenCode is not used.
- Re-estimate the conditional total/reminder at slice exit from observed work; dates remain conditional on unresolved V02 families and V03 rights/receiver evidence.

## Current blocking decisions

- **Resolved for S322:** exact Tee/Fitted sleeve partition and paired-instance convention, approved by maintainer on 2026-10-01.
- **Resolved for later slices:** Woven sleeve normalized-arclength mapping (conditional on checks), Polo/Woven collar exterior normalized-arclength convention, and Woven right button-placket-over-left buttonhole-placket order A. These decisions do not pass their views; each remains held until its own checks pass.
- **Still blocking:** Trouser source repair implementation requires a concrete proposal and separate maintainer approval. Keep all 24 Trouser front views held. Woven sleeve/collar joins and topology conflicts remain held if checks fail. All-seven-recipe V02 acceptance remains mandatory.
- **Required gates before close:** settled integrated candidate receives one global full test/100%-coverage run, full-Epic build/browser/Electron/output replay as applicable, protected export/DXF byte identity checks, final manual output review, PR review, safe merge, origin/main ancestry verification and required automatic deployment check.

## Verified S322 exit

- **Implementation:** `technical-flat-projection.ts` now describes Tee/Fitted front `capLeft + sideLeft + left hem half` and back `capRight + sideRight + right hem half`, splitting the straight hem at live arclength 0.5. It records the exact source panel center axis plus the approved decision ID and quantity two. The live compiler reflects each mapped sleeve primitive across that assembled axis. No partition stroke is emitted. The source piece, stitch graph, exports and cut coordinates are unchanged.
- **Source/decision classification:** cap/side/hem edge IDs and their order are directly encoded, as is the ordered `Sleeve-cap ease` interface. A midpoint on the straight hem and front/back face assignment are the approved view convention; the mirrored second displayed instance is the maintainer-approved convention. The reflected instance is not claimed as a second source piece.
- **Focused verification:** `npx vitest run --coverage --coverage.include=src/render/technical-flat-projection.ts --coverage.include=src/render/technical-flat-live.ts src/render/technical-flat-projection.test.ts src/render/technical-flat-live.test.ts` passes 42 tests with 100% statement, branch, function and line coverage in both changed modules. The projection map tests include default and changed Tee/Fitted measurements, exact live hem midpoint calculations, approval/axis rejection and same-revision edge accounting. The live tests assert two contour primitives and no visible partition. `npm run build` and `node --check` for both Chromium harnesses pass. `src/quality/export-identity.test.ts` and `src/export/regression.test.ts` are required at final slice closeout; neither baseline nor export code changed.
- **Production browser evidence:** `S322-tee-fitted-browser/matrix.json` records 2 default configurations, 4 front/back requests and zero browser/page/request errors. These recipes expose no recipe-option fields in the live UI, so the recipe option matrix count is zero. `S322-measurement-browser/matrix.json` records default and changed-measurement Tee/Fitted drafts, 8 total front/back requests, zero browser errors, and zero emitted partial SVGs. Default drafts are held on all four faces by `COLORWAY_CONTOUR_UNCLOSED` for the mapped sleeve outline. Changed measurement drafts are held on all four faces because `Sleeve-cap ease` does not provide a length-compatible rigid placement; the sleeve has no supported placement and the complete face is withheld.
- **Rendered review:** all 8 Chromium screenshots were inspected. They visibly show the complete hold state and exact blocker text; no candidate flat SVG was emitted, so these are hold-output checks and do not establish visual approval of the sleeve contours. The separate S321 annotated source overlays remain the inspected pattern-edge evidence. No joins, crossings, fill overlap or callout placement can be claimed as passed for these held candidates.
- **Acceptance:** metadata shape, revision binding, hidden partition and paired instance implementation pass their focused tests. Generated output acceptance fails and all 4 Tee/Fitted faces remain held. The integrated tally is unchanged at 28 accepted / 118 held out of 146 from S319. V02 remains In Progress; V03 remains Backlog. All-seven-recipe acceptance is unchanged.
- **Other approvals:** no Polo, Woven or Trouser mapping/source change was made in S322. Woven A overlap is approved but still held pending other checks. Woven sleeve mapping is conditional on actual output checks. All 24 Trouser front views remain held pending a separate approved source-repair proposal.
- **Findings and scope:** MQF-004–007, MQF-011, MQF-012 and MQF-015 remain `To be reviewed` at their applicable G04 exits; no review result here expands scope. Post-G17 deferrals remain unchanged. No fit, physical sample, factory acceptance, CAD compatibility or production-readiness claim.
- **Board closeout:** canonical board revision 823. The S322 test update initially failed because the EPIC-17 summary description no longer retained its admission link and planning lower-bound phrases; restoring those strings exposed that `editEpic` appends a metadata comment, so the S322 reconciliation comment was restored as the newest card note. Control Center suite then passed 33/33. One pair of board edits was initially given future command timestamps (02:30–02:32 UTC); this was disclosed and corrected with an actual-time audit note at 02:25:33 UTC. Board content and evidence status are validated at revision 823.
- **Elapsed time:** 2026-10-01 01:53:34–02:25:33 UTC (31m59s). Admission/context and durable start 4m; implementation 5m; focused coverage/build verification 4m; Chromium matrix and measurement replay 6m; screenshot/output review 1m; board regression diagnosis and repair 6m; packet/state/architecture/board closeout 5m; external-agent waits 0m; maintainer-decision time 0m within this slice.
- **Next action:** continue with the separately approved Polo/Woven collar exterior station mapping in a new numbered slice; preserve these Tee/Fitted holds. Do not start V03 until every supported recipe and accepted configuration passes the all-seven V02 gate.
