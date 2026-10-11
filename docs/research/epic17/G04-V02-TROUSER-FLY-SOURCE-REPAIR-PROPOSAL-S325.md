# G04 V02 — Trouser front fly source-repair proposal — Slice 325

## Start record and verified boundary

- **Started:** 2026-10-01 04:36:21 UTC.
- **Goal:** investigate the 24 held Trouser front views and return a concrete source-repair proposal with exact geometry/stitch changes and digital feasibility evidence. This is research/proposal only; no drafting source, cut geometry, marks, or stitch graph may be edited in S325.
- **Git:** clean S324 `4beeafe3f8805b0b0685ae8d03175ed406432fb9` (`Slice 324: map Woven sleeve and closure views`) on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice 324; reserve S325.
- **Board:** canonical revision 851; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. S324 evidence is linked. Current integrated tally remains 28 accepted / 118 held of 146 faces, across 73 configurations and 32 option fields. All 24 Trouser front views remain held; Trouser backs remain accepted.
- **Authority:** maintainer explicitly authorized investigation and a proposal only. Preserve upright `frontLeft`/`frontRight`, exact front/back waistband center joins, exact existing source identities/options, and separate attachment of the two fly sides to distinct shield edges. Return the proposed source change and verification evidence for approval before implementation.

## Scope and gates

1. Re-read the exact current Trouser draft and options, the S289/S307/S308 source/solver findings, S321's annotated exact source overlay, relevant Trouser research, and the current 24-configuration browser hold.
2. Classify each asserted fact as source-encoded, pattern-specific reference evidence, or proposed design choice. Recompute exact edge orientation, length, location, stitch relations and waistband fragment joins from current source; do not rely on prior chat or historical packet claims without refreshing them.
3. Produce a new annotated overlay of the actual default and option-extreme source pieces, identifying panel/edge/mark/shield identity and proposed change. Do not alter saved pattern geometry or stitch graph.
4. Propose one precise source patch that keeps both front panels upright and preserves the exact waistband center joins while assigning `frontLeft.flyEdge` and `frontRight.flyEdge` to distinct shield edges. Separate source-derived dimensions from product decisions and explain remaining assumptions and consequences.
5. Provide repeatable digital feasibility evidence using non-persisted fixtures or a proposal-level calculation only. Any test-like probe is research evidence; it must not become a source edit or imply implementation approval. Keep all 24 fronts held until the maintainer separately approves the proposal and a future implementation passes the full option/render matrix.
6. Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the validated board. Run focused read-only checks, annotated-output inspection, Control Center tests and diff validation. Preserve the protected export gate; no production code changes means no production coverage/build gate applies.

## Non-goals and blocking decisions

- No production source, pattern geometry, stitch graph, role identities, option ranges, DXF, or export-byte baseline changes.
- No guessed fly construction represented as sourced fact; no partial Trouser front; all 24 front faces remain held.
- No fit, physical sample, factory acceptance, or production-readiness claim; no general reference search already covered by S289/S308/S321.
- The specific source-repair proposal and any needed front-overlap convention remain subject to explicit maintainer approval. Do not proceed to implementation in this slice.
- No safe disjoint delegated work exists across pattern topology, sewn placement and front-flat validation; Codex retains ownership. OpenCode is not used.

## Refreshed source analysis and proposed change

### Current source findings

**Directly encoded in the current S325 draft (`src/drafting/trouser.ts`):**

- Both `frontLeft.waist` and `frontRight.waist` start at `(0,0)`; at `STANDARD_M` their endpoints are `(23.5,0)` and `(-23.5,0)`. Both `centerFront` edges are vertical at `x=0` and end at the same front crotch level. They are already mirror-drafted, upright half-fronts.
- Both current `flyEdge` marks are the same directed line `(0,0) → (0, flyLength)`. Default `flyLength` is 15 cm.
- `flyShield` has fixed width 3.5 cm and option-driven length `flyLength`. Its `left` edge is `(0,L) → (0,0)`; its distinct `right` edge is `(3.5,0) → (3.5,L)`. Current stitches name `frontLeft.flyEdge` ↔ `flyShield.left` and `frontRight.flyEdge` ↔ `flyShield.right`.
- The one waistband lower edge is stitched to the ordered four-leg waist interface. Its front center boundary is exactly between `frontLeft.waist` and `frontRight.waist`; the fragment compiler derives the two same-revision front band intervals from those original edges. The live draft's waistband center and original panel endpoints need not move to solve the fly placement.
- Current assembly replay at default leaves `frontLeft` at `(0,0), 0°` and places `frontRight` at `(-3.5, flyLength), 180°` to satisfy the two direct fly-to-shield joins. That turns one leg upside down. The front fragment/center join checks then withhold the complete front. S289/S308 documented this same incompatibility; this refreshed S325 probe confirms the current default behavior.

**References checked:** `docs/research/garments/TROUSER-RESEARCH.md`, S289, S307/S308, S319 and S321's source overlay. The project research and S289/S308 already compared the relevant fly construction examples. They do not establish an exact underlap role, which front it belongs to, its overlap layer, or a geometry for these named pieces. No additional general construction-reference search can settle those recipe-specific decisions.

### Concrete proposal — add a distinct front-right underlap support

This is a **proposed design/source change**, not an encoded fact or an implementation:

1. Keep `frontLeft`, `frontRight`, their `waist`/`centerFront` edges, all four-leg waistband order, waistband geometry, and the existing `flyShield` unchanged.
2. Add one physical interior role `flyUnderlap`, sized **3.5 cm wide × current `flyLength`**. In its source coordinates use `frontEdge: (0,0) → (0,L)`, `bottom: (0,L) → (-3.5,L)`, `shieldEdge: (-3.5,L) → (-3.5,0)`, and `top: (-3.5,0) → (0,0)`. Apply the existing default seam-allowance policy to this new role. Its top/bottom finishing operation is not established by the inspected recipe references and is not claimed here.
3. Keep `Left front fly ↔ shield`: `frontLeft.flyEdge` to `flyShield.left`. Replace the direct right stitch with `frontRight.flyEdge` to `flyUnderlap.frontEdge`, then stitch `flyUnderlap.shieldEdge` to the distinct `flyShield.right`. The left and right fly paths therefore reach separate source shield edges; the right path is mediated by the new underlap role.
4. Set the view layer proposal explicitly: `flyUnderlap` is an interior backing behind the viewer-facing `frontLeft` closure layer; the shield remains a separate interior piece. The front-right garment panel stays upright. This front-side ownership/layer choice is a product decision; current pattern source does not select it.

The dimensions use the already-authored 3.5 cm shield width and live `flyLength`; no new user option is proposed. The change adds one physical role and changes two stitches, while leaving both panels and the exact waistband center joins at their current coordinates. Its practical cost is an additional cut piece and a new interior layer; the cut role, edge allowances, closure depiction and all 24 supported configurations would need normal source/quality/output checks after approval. The underlap's top/bottom finish and exact overlap ownership remain product/construction assumptions. This does not claim physical sewability, fit or factory acceptance.

### Proposal-level feasibility evidence

`ops/web/render-g04-s325-trouser-proposal.mjs` drafts the exact current recipe in memory and adds only the proposed role/stitches to a temporary block inside the verifier process. It changes no tracked pattern source, no production object, and no saved recipe data. `S325-trouser-source-proposal/assembly-feasibility-matrix.json` records the default, minima/maxima for all **11** Trouser option fields, and the existing combined-supported fixture (**24 configurations** total).

- Current default topology requires `frontRight` rotation 180° and offset `(-3.5,15)` to satisfy the two direct fly stitches.
- In the proposal fixture all 24 cases have zero assembly issues; `frontLeft` and `frontRight` remain at 0° with zero offset; both original waist-edge JSON records and both front waistband fragment records are unchanged; center-front join residual is 0 cm.
- The visual evidence `trouser-source-and-proposal.png` overlays exact current drafted front pieces, source marks and shield-edge identities with the proposed role. `trouser-source-and-proposal.svg` is the vector source and `trouser-source-and-proposal.json` retains the exact default source topology.
- The figure and matrix are not production flat output, and do not validate rendered layer overlap, contour closure, crossing, callout legibility, short-edge finishing, physical construction, fit or factory acceptance. The 24 Trouser fronts remain held. The existing production S319 matrix remains the current face acceptance evidence.

## Maintainer decision required before implementation

**Recommended:** approve the precise proposal above, including `frontRight` as the underlap side, the new 3.5 cm × `flyLength` interior role, the two right-side stitch relations, and the new underlap behind `frontLeft` in the exterior front closure stack. Consequence: it adds one cut role and an explicit seam path but keeps both leg panels upright and the current waist/center joins unchanged. The top/bottom finish remains unclaimed and must be represented honestly in the future output/research.

If this construction/layer choice is not approved, keep all 24 Trouser fronts held and provide a different construction decision or retain the hold; no pattern or stitch change is made by S325.

## Superseding maintainer decision

On 2026-10-01 the maintainer approved the exact proposal above: add the
3.5 cm × live `flyLength` `flyUnderlap`, route the right fly edge through it
to the distinct shield-right edge, keep the left fly/shield-left relation, and
place the underlap behind the front-left exterior closure layer. The approval
did not establish short-edge finishing and did not accept any front face.
Slice 326 implements the approved source repair and records the protected
export boundary, all-24 topology check, rendered holds and next blockers in
`docs/research/epic17/G04-V02-TROUSER-FLY-UNDERLAP-IMPLEMENTATION-S326.md`.

## Slice exit

- **Result:** a concrete, separately approval-gated fly-underlap source proposal is recorded above. No pattern or stitch graph was changed. All 24 Trouser front configurations remain held; the 24 back views retain their existing accepted status.
- **Verification:** S325's in-memory feasibility matrix covers 24 configurations / 11 option fields. The proposed seam chain has no solver issues; both front panels stay upright, original waist edges and exact band fragments are unchanged, and the front center-join residual is 0 cm in every case. This is proposal evidence only, not production output or a face acceptance.
- **Rendered review:** inspected the exact-draft annotated SVG and Chromium PNG. It labels source edges and the proposal separately; the top-panel views are intentionally cropped to the waist/fly area. This does not establish final join appearance, crossings, layer overlap or readability.
- **Scope/status:** EPIC-17/G04-V02 remain In Progress; V01 Done; V03 Backlog. The integrated tally remains 28 accepted / 118 held of 146 faces. The decision on the proposed extra role/layer remains pending. The appropriate next implementation step is blocked on maintainer approval; do not change the draft before that answer.
- **Board:** start evidence/comment linked at revision 856. `E-G04-S325-EXIT`, `E-G04-S325-PROPOSAL-OVERLAY`, and `E-G04-S325-FEASIBILITY` are linked to G04-V02, the EPIC-17 summary card and Epic record through the validated command layer. Exit comments are at final revision **867**. The Epic and V02 remain In Progress, V01 Done, V03 Backlog; all 24 front holds remain.
- **Elapsed time:** 2026-10-01 04:36:21–04:58:20 UTC (**21m59s**): source/topology investigation 8m; in-memory option feasibility probe 5m; annotated-output inspection 2m; durable packet/context and validated board closeout 6m59s; external-agent waits 0m; maintainer-decision time during S325 0m.
