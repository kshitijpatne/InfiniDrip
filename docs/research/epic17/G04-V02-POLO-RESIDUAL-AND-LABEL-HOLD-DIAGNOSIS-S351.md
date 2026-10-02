# G04 V02 — Polo sleeve-cap residual and POM-label hold diagnosis — Slice 351

## Start boundary

- **Started:** 2026-10-02 02:05 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, evidence-backed
  V03, final output review, required gates and safe merge into `origin/main`.
- **Git:** clean `codex/epic-17-g04` at S350 `aaa12c32f901cbcf1b2255cd6069f31ca3a9aa23`
  (`Slice 350: reject Woven body occlusion candidate`). Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned
  slice is 350; reserve 351.
- **Board:** canonical revision 1365. EPIC-14/15/16 Closed, EPIC-17/G04-V02 In
  Progress, V01 Done, V03 Backlog. S350's rejected candidate is linked.
  Integrated status remains 56 accepted / 90 held across 73 configurations /
  146 faces.
- **Usage:** primary 12% used; weekly 22% informational.
- **Current hold evidence:** S341's integrated Chromium replay, after S340,
  recorded 17 Polo configurations / 34 faces and no emitted SVGs. Every front
  and back has the same 0.68 cm `Sleeve-cap ease` endpoint residual against the
  0.25 cm gate. Fronts also hold `Finished collar stand height` and
  `Stand front rise` POM labels (17 each); backs hold `Sleeve bicep width` POM
  labels (17). S340 has source-option and annotation anchor matrices, plus
  diagnostic and production replay artifacts.

## Scope

Trace the exact Polo draft, source edge order, stitch graph, selected front/back
sleeve-cap projection and rigid assembly residual across all 17 supported
option configurations. Separately reconstruct the three blocked POM label
placements and candidate search bounds from the exact source anchors, applied
view transforms and rendered dimensions. Use S340's same-option/source
matrices, production hold screenshots and prior S332/S333 source trace. Produce
annotated geometry showing source points and transformed endpoints; do not
conflate the assembly gap with the label collisions.

Classify each result as (a) directly encoded in source geometry/stitches,
(b) an already-approved view convention, (c) a renderer/layout constraint, or
(d) unresolved design semantics. If code does not establish a unique valid
correction, prepare a concrete source-based proposal and retain the current
holds. Do not change pattern geometry, stitch/ease graph, assembly threshold,
POM method/value/tolerance, option ranges, accepted count, DXF, protected export
identities, or production label placement in this diagnostic slice.

## Acceptance and verification

- Crosswalk exact source and view endpoints, ordered stitch refs, transforms,
  residuals, source revision and options for all 17 configurations / 34 faces.
- Audit all three recurring POM collisions independently, including exact
  anchor entity, screen/view coordinate, bounded label search placements,
  collision geometry and source labels involved.
- Retain source coordinate tables and annotated/rendered evidence for default,
  collar/stand extremes and any residual-changing options. Distinguish
  production hold output from diagnostic-only overlays.
- Do not accept any face unless its 0.68 cm residual is within the existing
  0.25 cm gate, all its POM labels have readable non-overlapping placement,
  and every other full-face V02 requirement passes. Preserve 34 held Polo
  faces absent complete verified output.
- Run focused verification for newly authored diagnostic artifacts, Control
  Center tests and `git diff --check`; no production coverage/build/export gate
  applies unless this slice changes production source. Full Epic gates remain
  at the settled integrated candidate.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical
  board through the validated command layer. MQF-004–007, MQF-011, MQF-012 and
  MQF-015 remain review checks; preserve post-G17 deferrals.
- No safe disjoint task is identified. Source projection, assembly, POM
  anchoring and rendered callout layout are coupled; Codex owns the work.

## Non-goals

No new construction claim, physical sampling, fit/factory/production-readiness
claim, G05 tech-pack work, G09/D04 views, broad UI redesign, supplier contact,
launch spend, hosted service, new garment, V03 receiver/profile choice, or
all-seven criterion change. Do not begin V03 while V02 is unmet.

## Exit record

### Findings and exact source crosswalk

- **Directly encoded:** all 17 source configurations use the same authored
  `Sleeve-cap ease` relation. Each selected source cap half is `sleeve.capLeft`
  for `front.armhole` or `sleeve.capRight` for `back.armhole`; the source edge
  run and orientation are the S333-approved map, with two mirrored sleeve
  view instances and no partition stroke. The source cap half is
  `21.59572903238069 cm`; its paired body armhole is
  `20.845729033384988 cm`, leaving `0.7499999989957011 cm` per half. The
  assembled transforms meet at the underarm endpoint (`0 cm`) but separate at
  the shoulder station by `0.9586038005636853 cm`. The rigid solver separately
  reports `0.68 cm` endpoint residual, above the unchanged `0.25 cm` gate,
  on both faces in all 17 configurations. The shoulder-station distance and
  solver residual measure different geometry checks and are not conflated.
- **Approved view decision:** S333's cap/side/hem segment selection and paired
  sleeve reflection remain in force. It does not specify how to distribute
  the 0.75 cm drafted ease within an assembled flat; S333 explicitly preserves
  the residual hold. No source edge, stitch, or fold mark names an ease
  distribution station or placement rule. This is the remaining product
  decision, not a fact inferred from a general sewing convention.
- **Concrete proposed view rule for a later decision:** within each face,
  retain the source cap cut contour and exact underarm/shoulder landmarks, but
  represent the sewn cap/armhole stitch relation with a view-only normalized
  arclength correspondence from the armhole underarm endpoint to its shoulder
  endpoint. Store both source curves and the mapping on the same revision;
  do not rewrite either source curve or the stitch/ease graph. This would
  remove the endpoint gap in the assembled stitch depiction while indicating
  where drafted cap ease is consumed. The open design effect is that the
  assembled seam stroke follows the receiving armhole coordinate instead of
  depicting the cap's longer cut-edge contour as an identical stitch path. It
  must be tested for contour intersections and legibility before any face is
  accepted. Until explicitly approved and verified, keep all 34 Polo faces
  held.

### POM anchor and placement audit

- **Directly encoded front anchors:** `Finished collar stand height` targets
  `outerStand.frontEnd.start`; `Stand front rise` targets
  `outerStand.frontNeckline.start`. They remain independent measurements with
  their existing methods, values and tolerances. At the default view revision
  `s337-diagnostic:polo-default`, rigid assembly maps them to `(2.02973,
  7.88389) cm` and `(0.03134, 7.96418) cm`, respectively.
- **Directly encoded back anchor:** `Sleeve bicep width` targets
  `sleeve.sideRight.start`. At the default revision it maps to `(27.5,
  24.0) cm`, the exact point also used by `Body chest (finished)` and
  `Sleeve length (cap–hem)`. That shared coordinate is source-derived, not an
  anchor mismatch.
- **Renderer constraint:** source label boxes are `max(2.4 cm, 0.18 cm × text
  length)` by `0.45 cm`. Placement tries eight fixed directions over eight
  radii from `1.5 cm` through `6.75 cm`, while rejecting box overlaps and
  leaders that cross labels or other leaders. The existing S340 result blocks
  both front labels in every configuration and the back bicep label in every
  configuration: 51 blocked callouts across 34 faces. No POM method, anchor,
  value or tolerance needs changing.
- A replay-only search experiment preserved source POM order and each
  previously accepted label/leader position, then ran the same eight straight
  leader directions out to `60.75 cm`. None of the 51 blocked callouts found a
  collision-free straight-ray position. This does not change the production
  search limit; it shows that simply adding more radial rings is not a sound
  repair. The next layout work should test a short shared-anchor escape and
  orthogonal routed leaders into a bounded outside label rail, with measured
  boxes, crossing checks, full source anchors and Chromium output. It remains
  a rendering/layout change, not a pattern-source or construction claim.

### Retained evidence and visual review

- `S351-polo-residual-labels/current-source-matrix.json` is a fresh S351 HEAD
  re-draft of all 17 S331 option cases. It contains 34 exact-revision face
  rows, selected source cap/armhole edge lengths, transformed endpoints, all
  assembly issues, 51 blocked callout identities, exact source entities,
  source points and transformed anchors. It supersedes the earlier S337/S340
  matrix values for this boundary.
- `S351-polo-residual-labels/current-render-diagnostic-matrix.json` and
  `render-current-diagnostic.ts` record source projection, assembly, diagnostic
  callout selection and SVG-render results for all options using the current
  S351 source. Blocked labels were omitted only from diagnostic geometry.
- `S351-polo-residual-labels/label-ring-expansion-analysis.json` and its
  reproducible `analyze-label-rings.mjs` retain the bounded layout experiment.
- `S351-polo-residual-labels/polo-default-{front,back}_flat-blocked-anchor-overlay.svg/.png`
  annotate same-option current S351 diagnostic geometry. The red marks identify
  the blocked anchors; existing black callouts show the crowded neckline and
  the coincident back-underarm POM anchors. The source view overlays are
  diagnostic and are not production flat output or acceptance evidence.
- The upstream exact-edge/control-point overlays and option rows remain in
  `S337-polo-holds/`; current production withholding remains recorded by
  `S341-integrated-browser/production-replay/`. No new construction reference
  was needed or found for these code-derived facts.

### Slice exit

- **Disposition:** source-first diagnosis and replay-only annotations; no
  unique source-determined non-rigid ease distribution or straight-leader
  placement was found. No production code, source geometry, stitch/ease graph,
  threshold, POM definition, export identity or accepted count changed.
- **Acceptance:** all 17 configurations / 34 faces crosswalked. Both faces in
  every configuration remain blocked by the `0.68 cm` residual. Front has two
  blocked POM callouts per option and back has one. Preserve all 34 Polo holds;
  integrated tally remains 56 accepted / 90 held across 73 configurations /
  146 faces. G04-V02 remains In Progress, V03 remains gated.
- **Verification:** `vite-node docs/research/epic17/S351-polo-residual-labels/trace-current.ts`
  freshly drafted the exact 17 option cases through current S351 source and
  found 34/34 `Sleeve-cap ease` 0.68 cm issues and 51 blocked POM callouts.
  `vite-node .../render-current-diagnostic.ts` compiled 17 configurations / 34
  diagnostic face renders; diagnostic-only successful callouts remain separate
  from production acceptance. Chromium rendered and manually inspected both
  current-source default crop overlays. `node .../analyze-label-rings.mjs`
  used the current exact label text, preceding POMs in source order, and the
  production collision predicates; 51/51 anchors remain unplaceable by any of
  eight straight leader directions across radii through 60.75 cm. No
  production code changed, so production module coverage/build and
  protected-export gates do not apply. `npm run control-center:test` passes
  33/33 after the validated board updates; `git diff --check` passes. Board
  revision 1380 links S351 exit, source matrix, current render matrix, label
  search and both rendered anchor overlays to G04-V02 and EPIC-17, with the
  exit comment on G04-V02.
- **Manual findings:** MQF-004–007, MQF-011, MQF-012 and MQF-015 remain review
  checks at their applicable accepted-output exits; post-G17 deferrals are
  unchanged.
- **Blockers:** the user has approved the tested Woven body-occlusion
  projection; S350's retained output proves it hides both cuffs and leaves
  sleeve-cap X strokes, so those views remain held. Polo requires an explicit
  view-only seam-registration decision for the authored cap ease and a routed
  callout layout that passes measured collision/output checks. Other recipe
  holds remain unchanged; all-seven acceptance continues to gate V03.
- **Elapsed 02:05–02:35 UTC (30m):** production implementation 0m; current
  source/data crosswalk and label-search experiment 12m; diagnostic SVG
  generation and visual review 5m; durable packet/context/board closeout 10m;
  focused verification 3m; external-agent waits 0m; maintainer-decision wait
  0m.
- **Single next action:** close S351 through validated evidence links and
  Control Center checks, then reserve S352 for the Polo POM routed-leader
  layout experiment and rendered collision review. Keep all 34 Polo faces
  held while that layout and the separate sleeve-cap ease decision are open.
