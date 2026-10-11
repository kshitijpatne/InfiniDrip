# G04 V02 sewn-role assembly — Slice 270

## Boundary

- **Goal start:** 2026-09-29 16:37:02 UTC.
- **Starting Git:** Slice 269 at `32a493793a0e5b6bc7cf16b22475f6288f8e5208`; refreshed `origin/main` at `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- **Reserved number:** 270, after inspecting `origin/main` and the active branch's S261–S269 history.
- **Starting board:** revision 392; G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog.
- **Elapsed:** 2026-09-29 16:37:02–17:38:58 UTC (1h 01m 56s), before the Slice 270 commit.
- **Scope:** derive per-face rigid transforms from ordered stitch interfaces, including curves, face-specific portions of multi-edge joins, easing, and one-to-many waist joins. Preserve drafted geometry; disclose missing, incompatible, unplaced, residual and conflicting joins. No SVG renderer or UI changes in this slice.
- **Blocked decisions:** none. Actual font and view legibility, rendered MQF review, and V03 receiver/profile rights remain later gates.
- **Delegation:** no safe disjoint owner; seam ordering and visible-role transforms share this source model. No external agent was used.
- **Required gates:** changed-module focused test with 100% statement/branch/function/line coverage; production build; all seven default recipe pairs; Control Center validation; protected export identities; `git diff --check`; new board evidence through the validated command layer.

## Result

`src/render/technical-flat-assembly.ts` now measures source edges and line marks in the order declared by `Block.stitches`, samples each interface in source order, and solves translation/rotation from the matched endpoints of each face-visible role pair. It preserves edge direction, uses full ordered interfaces to select front/back portions of multi-edge joins, and splits a single waistband edge across its sewn partners. Declared ease can be retained without changing scale. Hidden mapped pieces can serve as placement links but are omitted from the visible transform map. Missing or invalid references, incompatible total seam lengths, unplaced visible roles, endpoint residuals above 0.25 cm, and inconsistent cycles return explicit issues.

The model keeps original source curves intact; it does not claim that the transformed outlines already form a clean garment silhouette. Endpoint residuals still need to be shown in the live rendered view. This slice does not yet provide rendered evidence or complete V02.

## Acceptance and verification

- All seven supported default recipes are drafted on both faces; mapped visible roles receive finite rigid transforms, and hidden supports never appear in returned visible transforms. The default trouser back graph retains an explicit waistband-cycle conflict; it is not treated as resolved.
- Tee/fitted sleeve joins and the skirt front/back waistband midpoint are checked against actual source edge points; trouser, polo and woven role pairs are checked for source-backed transforms. Contradictory alternative joins are reported rather than silently selected.
- Negative fixtures cover unsupported recipe/view, absent mapped role, missing role/edge/mark, point-only mark used as a seam, empty and unequal interfaces, non-finite curve geometry, disconnected components and inconsistent cycles.
- `npm run coverage -- src/render/technical-flat-assembly.test.ts --coverage.include=src/render/technical-flat-assembly.ts` passes 8/8 tests and 100% statement, branch, function and line coverage.
- `npm run build` passes with the repository's existing Vite large-chunk advisory.
- `npm run control-center:test` passes 33/33.
- `npm run test -- src/quality/export-identity.test.ts src/export/regression.test.ts src/export/techpack-surface.test.ts` passes 24/24, including protected export identities and generic DXF regressions.
- `git diff --check` passes.
- An initial all-role-presence fixture failed to catch a bad cumulative interface offset. The later fixture checks that both skirt waist edges meet at the waistband seam midpoint; it exposed and drove the cumulative-offset correction. A symmetric two-point tie also exposed floating-point-dependent reversal, so the solver now follows declared source-edge direction. Initial production builds exposed a missing type import/narrowing issue; it was fixed before the final passing build. No protected baseline, generic DXF writer, or export code changed.

## Board and remaining work

The validated Control Center command layer linked `E-G04-S270-EXIT` to G04-V02 at board revision 395, after refreshing the Epic estimate and both Epic summary descriptions at revisions 393–394. V02 remains In Progress; V01 remains Done; V03 remains Backlog. MQF-004–007, MQF-011, MQF-012 and MQF-015 remain for their applicable rendered output review. No physical fit, factory acceptance, or CAD compatibility claim is made.

**Next action:** implement layered SVG rendering with measured text extents and source/revision validation in Slice 271, then integrate a narrow front/back entry into the current product surface in Slice 272.

## Elapsed-time breakdown

- Implementation and repair: 33m.
- Focused tests and 100% coverage repair: 11m.
- Production build: 2m.
- Control Center/export identity gates: 3m.
- Documentation and validated board exit work: 12m.
- External-agent waits: 0m.
- Maintainer-decision time: 0m.
