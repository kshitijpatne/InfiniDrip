# G04 V02 Trouser front center join and fly-shield reconciliation — Slice 308

## Start and verified boundary

- **Start:** 2026-09-30 15:44:39 UTC.
- **Goal:** use S307's newly consumed front waistband fragments to make one bounded source-backed determination about the remaining Trouser front center-front join and fly/shield layout. Implement a view-only correction only if the current exact role/edge/mark/stitch evidence supports one coherent, collision-free front face; otherwise retain a complete actionable hold and record the missing construction fact. Do not alter the drafting pattern or infer overlap.
- **Git:** S307 landed as `54dc71bcd86b172769d71860c595de0fd98f0e6d` (`Slice 307: compile Trouser waistband view fragments`) on `codex/epic-17-g04`; working tree was clean. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Reachable slice history ends at 307; S308 is uniquely reserved.
- **Board:** revision 620; EPIC-17 and G04-V02 are In Progress, V01 Done and V03 Backlog. Verified S307 document/rendered evidence is linked; the all-recipe output tally is 28/146 accepted and 118 held.
- **Dependencies/source:** S307 accepts all 24 Trouser back requests and withholds all 24 fronts because `view:trouser:waistband:center-front` is not a coincident join. S289 records the independent right fly/shield cycle. `TROUSER-RESEARCH.md` specifies one separate waistband, center-front/center-back references, two front fly marks, one 3.5 cm shield, and explicit left/right mark-to-shield edge stitches. The exact source still does not specify which front edge overlaps or an authored face-specific fly offset/overlap landmark; an interface alone must not be treated as proof of finished layer order.

## Scope and acceptance

1. Re-evaluate the exact current Trouser block, same-revision role map, S306 fragment intervals, front-waist edge order/reversal, both `flyEdge` mark geometries, both shield attachment edges, and all option endpoints. Preserve source edge orientation and exact source identities.
2. Test whether the source graph can satisfy the two front waistband fragment joins and both explicit fly-to-shield joins with a single consistent set of rigid view transforms. Do not skip a join, hand-select a preferred cycle, reflect an off-fold piece, translate a piece by an assumed 3.5 cm, or infer fly overlap/layer order.
3. If the evidence uniquely supports a complete front, implement only source-bound, view-only geometry/metadata and validate the closure, waistband top/center join, panel contours and layer representation in all 24 Trouser configurations. Otherwise emit no partial front and retain a specific issue identifying the exact unsatisfied source relation and what reference/metadata is absent.
4. Any changed production module must pass focused tests with 100% statement, branch, function and line coverage. Run the focused renderer/assembly tests, build when production changes, protected export/DXF identity regressions, applicable Control Center tests and `git diff --check`. If view behavior changes, capture and manually inspect production Chromium output for all 24 Trouser configurations / 48 faces. Do not rerun an unaffected full repository gate; global coverage remains at the settled integrated Epic/PR candidate.
5. Preserve the one waistband and one fly-shield physical role, pattern coordinates, role multiplicity, stitch graph, supported options, legacy DXF behavior, all protected export byte identities, G09/D04 boundary, and every admitted non-goal.

## Decisions, risks and ownership

- **Current decision:** no external construction reference is available for Woven closure instances/order; Woven closure and complete Woven flats remain held. The Trouser attempt is local to existing source and independent of that decision.
- **Source risk:** the maintained Trouser record and code define attachment interfaces and component dimensions but may not define the depicted front-panel overlap or a realizable common rigid arrangement. If so, the correct S308 outcome is a held face, not a guessed construction.
- **Delegation:** no safe disjoint task exists; source geometry, shared-front rigid assembly and rendered closure acceptance are coupled. Codex owns analysis, implementation and review; external-agent waits 0m. OpenCode is not invoked.
- **Non-goals:** no pattern/cut geometry, stitch/source interface, option, physical sampling, supplier, cost, hosted-service, G05, G09/D04, broad UI, new recipe, launch or production-readiness change; do not begin V03 while V02 has held supported outputs.
- **Estimate:** S307 reforecast leaves 10–24 conditional slices from that boundary (approximately 2–9 V02, 5–10 V03 after V02, and 3–5 integrated review/merge/deployment). S308 is one bounded map-or-hold attempt; unresolved source waits are unpriced and can stop V02.

## Exit record

### Result

The bounded map-or-hold review retains a complete Trouser front hold. A temporary focused Vitest topology probe evaluated the default and all 22 declared option minima/maxima (23 cases). In every case the current assembly graph uses the explicit fly mark/shield joins to place `frontLeft` at `(0, 0) / 0°` and `frontRight` at approximately `(-3.5, flyLength) / 180°`. The source's `flyEdge` marks are same-directed vertical lines; the shield's named left edge is directed bottom-to-top and its right edge top-to-bottom. The resulting right front panel is rotated upside down in the candidate flat. The S307 fragment compiler independently rejects that candidate at `view:trouser:waistband:center-front`, since the two front band fragments fail to meet at both the sewn and top joins. No partial front is emitted.

The block has exact physical interface identities and matching lengths, but it does not provide a source-backed view orientation/edge-traversal rule that makes both front panels upright while retaining both fly joins and the exact waistband joins, nor does it declare which fly edge lies over the other in the finished view. Fixing this by ignoring a stitch, reversing a mark, reflecting an off-fold panel, translating a front piece, or choosing an overlap would invent a construction rule. No safe view mapping is supported by current evidence. This is consistent with the prior S289 cycle diagnosis and refines it with the S307 fragment endpoints. No production code, pattern geometry, stitch graph, role count, option, DXF, or export behavior changed.

### Acceptance and verification

- **Map-or-hold decision:** passed. The complete front remains fail-closed with the existing exact center-front fragment diagnostic; no unsupported correction is attempted.
- **Source probe:** temporary focused Vitest probe passed 1/1 and measured 23 source cases. The temporary test file was removed after recording its summarized values here. S307's fresh production Chromium matrix covers all 24 configurations including the combined-supported fixture and confirms all 24 front faces remain fully held, with 24 back faces accepted and no parse, revision, label, collision, browser, page or request failures.
- **Control Center:** final suite passes 33/33 after the S308 exit evidence/comment and forecast were added through the validated command layer at board revision 632.
- **Production coverage/build/export:** no production module changed, so no production coverage, build, or export gate is affected. The S307 protected DXF/export byte identities remain unchanged. No full repository gate is due at this non-releaseable source review boundary.
- **MQFs:** reviewed the held front output against mapped MQF checks. MQF-004–007, MQF-011 and MQF-012 remain **To be reviewed** at their applicable G04 output exits; MQF-015 remains **To be reviewed** for V03. No deferred post-G17 finding was promoted into scope.

### Remaining work and next action

The all-recipe output tally remains 28/146 accepted and 118 held. Woven closure and complete Woven flats stay held because the maintainer has no construction reference identifying its physical placket fronts and overlap order. Trouser front, Polo collar, Tee/Fitted sleeve contours and other unaccepted recipe/options remain unresolved; V02 remains In Progress and V03 Backlog. Reforecast from S308: 57–71 total slices remains conditional, with 9–23 from this boundary (approximately 1–8 more V02 evidence/implementation slices, 5–10 V03 after V02 passes, and 3–5 integrated review/merge/deployment). Unavailable source waits remain unpriced.

The next action is S309: audit the next independent, source-tractable held V02 recipe/output against its exact drafting roles and front/back mapping, then implement only a proven view relation or preserve a specific complete-face hold. Do not begin V03 until all supported V02 faces/options pass.

### Board, commit and elapsed time

Board revision 632 records `E-G04-S308-EXIT`, the exact source-topology hold comment on G04-V02, and the refreshed Epic estimate through the validated command layer. The final Control Center suite passes 33/33; `git diff --check` passes. Commit this boundary as `Slice 308: document Trouser front join hold`. Total elapsed time is 15m29s (15:44:39–16:00:08 UTC): source/topology analysis and focused probe 9m00s; Control Center/board verification, durable records and final diff review 6m29s; implementation 0m; external-agent waits 0m; maintainer-decision time 0m. No safe disjoint task existed and OpenCode was not used. Woven remains held under the maintainer's explicit direction.
