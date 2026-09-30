# G04 V02 cross-recipe source dependency inventory — Slice 303

## Start and verified boundary

- **Start:** 2026-09-30 12:53:36 UTC.
- **Goal:** consolidate the exact evidence gaps preventing accepted front/back vector flats across the remaining held recipe families, map each gap to affected face/configuration counts and existing source-audit evidence, and state the minimum source artifact needed to unblock a source-backed map. This inventory supports the admitted V02 handoff; it does not alter acceptance or invent construction facts.
- **Git:** clean at S302 `140a1091918c964b6011c24cc238bc5b525155b3`, subject `Slice 302: reconcile G04 estimate and sequence`, on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 302; 303 is reserved.
- **Board:** canonical revision 573; EPIC-17/G04-V02 In Progress, V01 Done and V03 Backlog; S302 exit is linked. Working total estimate is 57–71 slices, 16–30 remaining at S301 boundary, with source waits unpriced.
- **Evidence baseline:** S298 retained the current production Chromium matrix of 73 configurations / 146 front/back faces: 4 accepted and 142 held. The matrix identifies 4 Tee/Fitted faces, 34 Polo, 56 Woven and 48 Trouser held requests. Tank/Skirt defaults are the only accepted faces. Detailed source audits: S289 Trouser, S290 Tee/Fitted, S288/S300/S301 Polo, S292–S299 Woven; user confirmed no marked Woven placket overlap reference exists and requested that closure remain held.

## Scope and acceptance

1. Build a concise, traceable inventory for the 142 held face requests, grouped by recipe/failure family rather than repeating each option row.
2. For each family, cite the local role/stitch/projection issue, prior source/render evidence, exact unsupplied construction fact, minimum pattern-specific/inspectable artifact that could supply that fact, and current hold disposition.
3. Distinguish source artifact requests from inference. Do not mark a reference found or imply a source is required if the local source graph already proves the relation. Keep user-confirmed Woven closure hold; do not ask to override it or silently accept an incomplete V02.
4. No production source/test behavior, pattern/cut geometry, exports, estimate, roadmap acceptance, manual finding status or Epic status changes. Do not start V03; no UI redesign, G09/D04 view, G05 content, sampling, supplier, spending, hosted service or readiness claim.
5. Require `npm run control-center:test` and `git diff --check` for this documentation/board evidence slice. No new browser matrix or full/global coverage gate is warranted because output does not change; preserve and cite the accepted prior output evidence.

## Source questions to resolve or hold

- **Tee/Fitted sleeve (4 faces):** existing S290 sources establish sewing notches and cap ease but not complete view contour runs/instance orientation. Needed artifact: the exact used pattern/source revision or an authoritative recipe-specific flat/pattern key identifying front/back sleeve-edge runs, crown/break landmarks and physical view instance count/orientation.
- **Polo collar/stand (34 faces):** S288 and S301 establish full stitched base placement; S300 reflection rendered crossed components. Needed artifact: the used source drawing/pattern construction that ties a named base shoulder station to a reproducible point on the authored outer collar cubic and defines front/back exposed collar/stand contours and layer interpretation.
- **Woven shirt (56 faces):** S292–S299 map center axes/front pair but do not bind complete sleeve cap, collar exterior or placket roles. Needed artifacts: the exact used Woven block/pattern version annotated with cap-front/back break and physical sleeve instances; collar exterior face runs and shoulder station; typed front role identity and layer order. The placket overlap reference is explicitly unavailable by maintainer decision; keep Woven complete faces held. Do not substitute a generic tutorial or infer overlap.
- **Trouser (48 faces):** S289 exact graph reports right fly/shield and waistband rigid-cycle conflicts. Needed artifact: the actual recipe construction spec/pattern key mapping shield attachment/overlap onto the two front-fly interfaces and the full waistband into face-specific front/back segments/fold axis without changing drafted geometry.

## Ownership and limits

No safe disjoint implementation or low-risk research ownership exists; this is a provenance/inventory boundary. Codex owns reconciliation. External-agent waits 0m; OpenCode is not invoked. Source delivery and maintainer decision time are not priced. Missing artifacts leave their complete faces held; V02 and therefore V03 cannot exit until every admitted option face passes.

## Exit record

- **Inventory result:** the current production matrix covers 73 configurations and 146 front/back requests. The 142 held requests group to Tee 2, Fitted 2, Polo 34, Woven 56, Trouser 48; Tank and Skirt defaults account for the four accepted faces. The packet's “Source questions to resolve or hold” section maps each group to its exact local source issue, existing source/render evidence and minimum pattern-specific artifact needed. Woven placket overlap remains explicitly unavailable per maintainer decision; do not infer it or count held faces as V02 acceptance.
- **Disposition:** no new source artifacts were present in the repository at S303 start; no production code, tests, output, pattern/cut geometry, DXF or protected export identities changed. V02 remains In Progress, V03 remains Backlog. MQF findings stay review checks and no scopes/statuses change.
- **Board closeout:** `E-G04-S303-EXIT` and the exit comment are linked to G04-V02, the EPIC-17 summary card and Epic record through validated commands at revisions 578–581. Board final revision is 581; V02 remains In Progress and V03 remains Backlog.
- **Verification:** Control Center suite and `git diff --check` are the documentation/board gates; final results are recorded at closeout. No production behavior/output changed, so production/browser/global coverage gates are not applicable to S303.
- **Elapsed time:** 2026-09-30 12:53:36–12:57:54 UTC (4m18s): source evidence/inventory 2m; implementation 0m; documentation/board closeout 1m; focused Control Center and diff verification 1m; rendered review 0m; external-agent waits 0m; maintainer-decision time 0m (source dependency decision was already given).
- **Landed slice:** pending `Slice 303: map remaining V02 source dependencies` commit ID.
- **Next action:** process any pattern-specific artifacts supplied by the maintainer into a bounded source-backed V02 packet. If none are available, continue only independently resolvable V02 behavior; keep Woven closure held and V03 gated.
