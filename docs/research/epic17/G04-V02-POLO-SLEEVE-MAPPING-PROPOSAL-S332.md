# G04 V02 — Polo sleeve source trace and view-map proposal — Slice 332

## Verified start boundary

- **Goal start:** 2026-10-01 10:18:07 UTC. Goal remains EPIC-17/G04 through seven-recipe V02, documented V03 CAD exchange proof, reviewed PR, safe merge to `origin/main`, ancestry verification, and any required deployment.
- **Scope:** source and output research for the Polo sleeve only. No production mapping is implemented in this slice. G04 all-seven acceptance remains unchanged.
- **Git:** worktree `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`, branch `codex/epic-17-g04`, HEAD `db5647e1729f4b0a5605cd5b632f05fbe470cbf1` (`Slice 331: close Polo collar colorway areas`); refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. At S332 start, the validated admission update to `board.json` and this S332 packet were the expected dirty state.
- **Board:** S332 admitted on canonical validated revision 996. EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog. Settled integrated matrix remains 73 configurations / 146 face requests / 32 option fields: 56 accepted, 90 held. The latest strict Polo replay is 0 accepted / 34 fully held, with no SVG output.
- **Usage at start:** primary-window use 27%; ordinary work allowed; weekly 4% informational. No full gate is needed for this research-only slice.
- **Required gates:** current source/revision trace; current candidate overlay and rendered inspection; review specific Polo source reference already linked in S320/S321 research; option-topology comparison; durable state/context/board exit through validated commands; Control Center regression and `git diff --check`. No production source or pattern change is in scope.

## Exact current source facts

The current live default is `live-draft:polo:1:1`, `STANDARD_M`, resolved default Polo options. The 17-case matrix in `S331-polo-browser-final/matrix.json` contains the default plus both endpoints of all eight Polo options. `option-topology.json` re-drafts those exact options against current source and confirms the sleeve edge set, front/back `armhole` curves and on-fold axis predicates are identical to the default in all 17 configurations. Back hem-drop endpoints change the lower center-back edge, but do not change this sleeve/armhole evidence.

**Directly encoded by the recipe source and present in `source-trace.json`:**

- The single authored `sleeve` role is off-fold. At `STANDARD_M`, its ordered edges are `capLeft`, `capRight`, `sideRight`, `hem`, `sideLeft`. `capLeft.end` and `capRight.start` share the cap crown `(21.5, 0)`. `capLeft.start` meets `sideLeft.end` at the left underarm `(0, 1.7869438925)`. `capRight.end` meets `sideRight.start` at the right underarm `(43, 1.7869438925)`. `sideLeft.start` and `hem.end` share `(3, 23.7869438925)`; `hem.start` and `sideRight.end` share `(40, 23.7869438925)`.
- The exact stitch graph entry is `Sleeve-cap ease`: `sleeve.capLeft + sleeve.capRight ↔ front.armhole + back.armhole`, with allowed ease `[-1, 4]`; no source reference is marked reversed.
- Both on-fold body roles have a `centerFront`/`centerBack` edge on `x=0`. The source armhole starts at the shoulder-side endpoint and ends at the side/underarm endpoint. At default both armholes are the same authored curve: start `(22.5,4)`, controls `(22.5,13)`, `(25.5,21)`, end `(27.5,24)`.
- `capLeft.start` is topologically the sleeve underarm because it joins `sideLeft.end`; `capLeft.end` is the cap crown. `capRight.start` is the crown and `capRight.end` is its underarm because it joins `sideRight.start`. Comparing those joins with the body armhole's shoulder/side endpoints supports front `capLeft` underarm-to-shoulder and back `capRight` shoulder-to-underarm correspondence. This is a source-topology inference; it is not an authored reversal flag or face-visibility declaration.
- The source declares one sleeve pattern role. It does not encode a two-instance technical-flat count, the contour split between front and back, whether to reflect the back source locally, or a visible hem/crown partition rule.

## Specific source checked

S321's garment-specific sleeve sources were already checked; none gives the exact orthographic boundary or transform for this local Polo role. The official Jalie 3137 product/instructions source, linked by the maintainer, states a physical `Sleeve X2`, pins sleeve to the armhole, and has the front/back side and underarm sewn. It supports a two-piece sewn Polo reference and confirms the seam relationship. It does **not** define a view map for InfiniDrip's authored edges, the normalized hem/crown split, local back reflection, or the desired technical-flat instance convention. No unchecked general construction lead is needed to establish those local geometric facts.

## Concrete proposal requiring maintainer approval

This proposal extends the already-approved Tee/Fitted paired sleeve view convention to Polo; it is not yet implemented. It preserves all source cut geometry, marks, role count, stitch graph, ease, and legacy exports.

| Face | Exact sleeve runs | Sewn-interface direction / orientation | Display and layer proposal |
|---|---|---|---|
| Front | `capLeft` start→end; `sideLeft` end→start; `hem` end→arclength 0.5 | Reverse only the front `armhole` traversal for the view relation. Underarm comes from `capLeft.start == sideLeft.end`; crown from `capLeft.end`. | Reflect the paired instance across the assembled body `centerFront` axis; quantity 2. Put sleeve color area in the silhouette layer; emit the cap/body sewn line once in `SEAM`; do not draw a crown-to-hem split stroke. |
| Back | `capRight` start→end; `sideRight` start→end; `hem` start→arclength 0.5 | Direct back `armhole` traversal. For the tested exterior placement, apply a local-X sign reflection (`localYReflection` in the existing contract) before rigid placement; source join `capRight.end == sideRight.start` fixes the underarm. | Reflect the paired instance across `centerBack`; quantity 2. Same layer order and no visible crown-to-hem split stroke. |

The only view-only hem closure station is `hem` arclength fraction `0.5`; the two edge halves share the authored hem midpoint `(21.5,23.7869438925)`. This fraction is proposed because the source hem is one uninterrupted line with no split mark. It adds no pattern seam, stitch, notch, or cut line. For Polo's normal layer order, use `GARMENT_SILHOUETTE → ARTWORK → SEAM → CONSTRUCTION → DART → PLEAT → CLOSURE → TOPSTITCH → CALLOUT → ANNOTATION`; source layer order comes from `technical-flat.ts`, while deciding the paired sleeve face runs and instance convention remains a maintainer view decision.

## Diagnostic assembly and current blocker

`front_flat-candidate.png` and `back_flat-candidate.png` are rendered diagnostic overlays from the exact draft and assembly solver, not accepted production flats. They show the proposed two mirrored sleeve halves, on-fold body, source-derived rigid transforms, and the shoulder endpoint gaps. The source-coordinate annotated overlays in `S321-pattern-overlays/polo-source-topology.png` show separate physical roles and IDs. Exact source curves and transforms are retained in `source-trace.json`.

With the proposed front reversal, back local reflection, and current rigid solver, the default transforms are:

- Front sleeve: offset `(25.736469, 24.288318) cm`, rotation `-99.285101°`; underarm residual `0`, shoulder endpoint gap `0.96 cm`.
- Back sleeve: offset `(18.798540, -18.148283) cm`, rotation `-99.285101°`, `mirrorX=true`; underarm residual `0`, shoulder endpoint gap `0.96 cm`.
- Assembly reports `STITCH_ENDPOINT_RESIDUAL` `0.68 cm` on both faces. This exceeds the renderer's `0.25 cm` assembly acceptance limit. The drawn half-runs sit outside the body and show no crossing in these default diagnostic images, but a visible shoulder gap and the rejected assembly issue remain. Therefore the candidate does **not** pass V02 and cannot remove any hold. Do not hide the gap, average transforms, scale a piece, change ease, or alter the source stitch graph under this proposal.

The existing S331 production output is still authoritative for current acceptance: all 34 Polo requests emit no SVG and remain fully held. Current S331 diagnostic images before hold enforcement show the reason the complete-face hold was added; they are not accepted output. The S332 overlay demonstrates a promising orientation/run mapping, while exposing the independent shoulder/ease conflict that must be investigated after a mapping decision.

## Approval needed and effect

**Recommended:** approve extending the Tee/Fitted view convention to Polo with the exact runs, local back reflection, two mirrored instances and no partition stroke in the table above. This authorizes a bounded implementation and the 17-configuration/34-face production check; it does not waive the `0.25 cm` join/residual threshold or release a face. If the current `0.96 cm` shoulder gap remains after the approved mapping is compiled, all affected Polo faces stay held and the next packet will propose a separate, source-preserving resolution with exact evidence.

If not approved, keep all 34 Polo faces held and leave the existing map unchanged. The all-seven-recipe V02 acceptance criterion is preserved in either case.

## Acceptance disposition, risks and boundaries

- S332 is research-only and accepts no face. All current Polo faces remain held; integrated status is still 56/146 accepted and 90/146 held. V02 remains In Progress and V03 remains Backlog.
- No source/cut/stitch edits; no broad UI, new recipe, G05 tech-pack content, G09/D04 assembled side/oblique/inside views, physical sampling, supplier contact, spending, hosted service, fit, factory-acceptance, exact CAD compatibility or production-readiness claims.
- MQF-004–007, MQF-011, MQF-012 and MQF-015 remain `To be reviewed` at their applicable G04 output exits. S332 does not resolve those UI/tech-pack findings or expand into their deferred work. MQF-011/MQF-012 deferrals and all post-G17 deferrals remain unchanged.
- No safe disjoint low-risk work was delegated. The source interface, proposed face metadata, residual behavior and rendered output form one coupled geometry question; Codex retains review and integration ownership.
- **Conditional lower bound:** at least 8 additional slices remain after S331 / at least 339 total under the existing minimum. Polo endpoint work and other recipe holds plus V03 rights/receiver evidence may add unbounded work.

## Slice exit

- **Validated board:** revision 1015 links `E-G04-S332-EXIT`, `E-G04-S332-OPTIONS`, and `E-G04-S332-RENDERED` to G04-V02, the EPIC-17 work card and the Epic record. Descriptions preserve earlier S330/S331 evidence and current all-seven acceptance. `npm run control-center:test` passes 33/33 after updating its board-contract assertions to the S332 state. `git diff --check` passes. No production source was changed; no source coverage/build/export gate is applicable in this evidence-only slice.
- **Next action:** request the one unresolved Polo sleeve view decision above. If approved, start a new numbered slice to implement only the exact view metadata and validate all 17 Polo configurations; keep every face that fails source, seam-residual, crossing, overlap or callout checks held. If declined, preserve the hold and continue with an independent admitted V02 blocker.
- **Time:** elapsed 38m28s (10:18:07–10:56:35 UTC): product implementation 0m; source/revision trace, proposal and artifact preparation 20m; focused 17-configuration topology and assembly verification 7m; rendered review and residual diagnosis 3m; durable packet/context, validated board, Control Center regression, commit and final checks 8m28s; external-agent waits 0m; maintainer-decision time 0m (decision pending).
