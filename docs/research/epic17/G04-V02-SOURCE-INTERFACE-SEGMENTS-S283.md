# G04 V02 source-interface face segments — Slice 283

## Start and authority

- **Goal:** continue admitted EPIC-17/G04 V01 → V02 → V03 through safe merge
  and verified deployment.
- **Slice start:** 2026-09-30 04:10:07 UTC.
- **Starting Git:** clean at `fc54deb13cb87d57bcfcd49aa30b13192e6fc561`
  (`Slice 282: define source-backed face-segment contract`) on
  `codex/epic-17-g04`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Active and
  reachable history's highest slice is S282; S283 is reserved.
- **Starting board:** canonical `ops/control-center/data/board.json`, revision
  433. EPIC-17 In Progress; G04-V01 Done, G04-V02 In Progress, G04-V03
  Backlog. `E-G04-S282-EXIT` is linked to G04-V02.
- **Authority/dependencies:** admitted G04 V02 face-source mapping; maintainer
  authorization “Authorize source-backed view metadata”; S277–S282, especially
  `G04-V02-FACE-SEGMENT-CONTRACT-S282.md` and the current source-coordinate
  audit. No additional scope decision is required for a view-only, exact
  source-interface rule. This does not authorize changing cut geometry,
  notch/export content, or other held role contours.
- **Previous slice:** S282 landed as
  `fc54deb13cb87d57bcfcd49aa30b13192e6fc561`; its source probes and 44 focused
  drafting/assembly tests passed, Control Center passed 33/33 and V02 remains
  open.

## Scope

Implement the S282 candidate for the Skirt waistband, bound to the exact live
`Block` and revision:

1. Correct the ordered waistband stitch traversal so front waist runs
   center-to-side and back waist is traversed side-to-center. Preserve every
   authored `Piece`, edge, cut coordinate, option, notch coordinate and legacy
   export byte identity.
2. Extend the G04 projection mapping only as needed to express a boundary
   derived from the named ordered stitch interface and its exact shared
   side-seam endpoints. Derive the same point on the straight, paired band
   edge from actual source topology; reject stale/missing/ambiguous/nonlinear or
   length-inconsistent references with actionable visible holds.
3. Give the front and back face only the band segment attached to its matching
   panel. Permit view-only reflection of that segment across the exact
   sewn-to front/back panel center-fold axis, not across `waistband.fold`.
   Any generated side connector is a view silhouette boundary with explicit
   source provenance; it must not be classified as a new cut edge, seam,
   stitch, or notch.
4. Keep source pattern notches unchanged. The known inconsistent historical
   Skirt notch comment/test wording is corrected in documentation only; do not
   move the existing DXF/pattern marks. The S282 packet has duplicate
   acceptance labels; reconcile its text in this slice report while retaining
   its already-landed acceptance result.
5. Keep Tee/Fitted sleeve, Polo/Woven collar, Trouser cycle, and Woven vent
   holds unchanged. Do not make a V02 completion claim in S283.

## Acceptance criteria and gates

1. Focused tests prove the reversed back traversal places both adjacent panel
   side endpoints at the exact interface transition and the band split at the
   correct source point across representative valid Skirt measurements.
2. Projection validation binds stitch label/reference, side, boundary index,
   paired source edge and fold-axis role/edge to the same exact live block and
   revision. Invalid, stale, duplicate, reversed-inconsistently, non-parallel,
   non-line, wrong-role or wrong-face maps fail closed with useful source
   guidance. Every source edge remains explicitly accounted for.
3. Derived face contours retain stable source IDs, dimensions, assembly
   transforms, layer/feature semantics and POM target identities. The view-only
   side connector is not serialized as pattern geometry. Back/front projection
   has no overlapping duplicate at a center axis.
4. Every changed production module has 100% statement, branch, function and
   line coverage. Run focused drafting/stitch, projection, geometry, assembly,
   live, POM and transform tests as applicable. Run TypeScript/Vite build,
   Control Center tests for changed fixtures, protected export/DXF identity
   regressions, and `git diff --check`.
5. Render production Chromium Skirt front/back at the default and representative
   valid measurement values. Manually inspect band/body junctions, outline and
   seam semantics, fold duplication, overlays, labels and anchored POMs. If
   they fail, preserve screenshots and keep both affected faces held. S284
   still owns the full 73-configuration/146-face matrix and integrated review.
6. Update this packet, S282 packet correction, `PROJECT-STATE.md`,
   `ARCHITECTURE.md`, context/admission, and canonical board with exact results,
   blockers and separate elapsed categories. Land exactly one `Slice 283:`
   commit.

## Non-goals and holds

- No pattern/cut coordinate, notch, seam allowance, graded block, recipe option
  or export-baseline change. Do not claim physical fit, factory acceptance or
  CAD compatibility. Preserve protected byte identities.
- No guessed face split, inferred sleeve/collar instance, generalized garment
  assembly redesign, or partial face acceptance.
- No G09/D04 assembled views, G05 tech-pack content, broad UI redesign, recipe
  addition, physical sampling, supplier contact, spending, hosted service or
  production-readiness claim.
- MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed` for the successful
  V02 rendered exit; MQF-015 remains assigned to V03. Respect post-G17
  deferrals.
- V03 receiver, profile, rights, exchange and round-trip proof remain separate
  and unresolved.

## Risks, delegation and estimate

- **Risk:** a face-specific segment creates an interior source edge endpoint
  and a view-only boundary. If the renderer cannot preserve provenance and
  avoid implying a physical seam or cut, the feature must remain held.
- **Integration risk:** role-specific reflection currently targets the role's
  own source fold edge. The Skirt band must explicitly reference its sewn-to
  body-panel axis, with an exact assembled-view transform; do not reuse the
  waistband's own fold metadata.
- **Delegation:** no independent low-risk ownership exists because drafting
  traversal, validator, geometry compiler, live transforms, provenance and
  output fixtures are coupled. Codex owns implementation/review; external waits
  expected 0m. OpenCode is not invoked.
- **Estimate:** this is the planned S283 implementation boundary inside the
  provisional 27–31 landed-slice Epic range. S284 remains the full output review.
  Re-estimate if the generated view boundary needs a separate correction.

## Exit evidence

- **Implementation and diff review:** `src/drafting/skirt.ts` reverses only
  the back waist `EdgeRef` traversal. Projection metadata now types the
  source stitch-interface boundary and paired strip edge, validates exact
  same-block/revision topology and fold axes, and accounts for face-excluded
  edges. Geometry compilation preserves source IDs and emits the connector as
  a provenance-tagged view silhouette boundary. Live projection reflects only
  the attached segment around the exact sewn-to body axis. Invalid/unsupported
  roles fail closed. No authored points, cut geometry, notch, option, seam
  allowance or export path changed.
- **Focused verification:** the changed production modules
  `skirt.ts`, `technical-flat-projection.ts`,
  `technical-flat-geometry.ts`, and `technical-flat-live.ts` reached 100% of
  statements, branches, functions and lines. The focused suite passed 191/191.
  `npm run build` passed (existing large-chunk advisory). Control Center passed
  33/33. Protected export identity, legacy DXF regression and tech-pack surface
  passed 24/24. `git diff --check` passed after closeout. An earlier panel
  fixture failure was traced to a stale Tee-success expectation despite the
  correct source hold; the fixture was updated to use supported Tank geometry,
  and the separate unsupported-role case asserts no partial face.
- **Rendered/output review:** production Chromium retained six face outputs
  for default, waist/ease 70/2 and 112/12, on three distinct live draft
  revisions, with zero console/page errors. Manually inspected default front
  and back PNGs show assembled body/band outlines without a continuous body
  fold line or overlapping center-axis outline. The remaining source-notice
  panel accurately says the pattern model lacks topstitch, pleat, dart, pocket,
  closure and back POM anchor geometry; those absences remain visible rather
  than invented. See `S283-skirt-browser/evidence.json` plus its SVG/PNG files.
  This is digital geometry review only.
- **Board/Git:** started clean at S282
  `fc54deb13cb87d57bcfcd49aa30b13192e6fc561`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board was at 433;
  validated S283 start comment at 434; `E-G04-S283-EXIT` was created/linked to
  G04-V02 at 435 and linked to EPIC-17 at 436; validated exit comment at 437.
  Reserve the unique landing subject
  `Slice 283: implement source-backed skirt face segments`.
- **Acceptance:** S283's bounded implementation and its focused/output gates
  passed. G04 V02 acceptance remains pending the integrated 73-configuration/
  146-face S284 review and any resulting unique follow-up slices. No MQF
  finding is closed at this partial output boundary; MQF-004–007, MQF-011 and
  MQF-012 remain `To be reviewed` for the applicable V02 exit, MQF-015 remains
  for V03, and post-G17 deferrals remain in force.
- **Blockers / next action:** Tee/Fitted sleeve exterior contours and view
  instances, Polo/Woven collar split construction reference, Trouser join
  cycles, Woven vent edges, unsupported detail anchors and other recorded
  output holds remain. S284 must rerun and inspect the full matrix, preserve
  visible holds, and reconcile mapped output findings only at the applicable
  exit. Keep V02 In Progress.
- **Delegation:** no safe disjoint low-risk assignment; Codex owned the coupled
  change and output review. External-agent waits 0m; OpenCode not invoked.
- **Elapsed time:** implementation ~32m; focused verification/build/protected
  identity checks ~24m; rendered run and review ~8m; durable closeout/board
  validation ~8m (workstreams overlap). External-agent waits 0m. Maintainer
  decision wait was approximately 67m from slice start to the source-backed
  metadata authorization supplied in this resumed turn; the response itself
  arrived without an additional blocking wait. Start 2026-09-30 04:10:07 UTC;
  rendered evidence regenerated 05:18 UTC; exit recorded at 05:21:50 UTC;
  total 1h11m43s (workstreams overlap).
