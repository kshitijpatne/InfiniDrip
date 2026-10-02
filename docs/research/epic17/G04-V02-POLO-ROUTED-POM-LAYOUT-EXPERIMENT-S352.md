# G04 V02 — Polo routed POM label-layout experiment — Slice 352

## Start boundary

- **Started:** 2026-10-02 02:37:02 UTC.
- **Git:** clean `codex/epic-17-g04` at S351 `4b988e94ff87a5144259248f9e3db44212e88ed4`
  (`Slice 351: diagnose Polo residual and label holds`). Refreshed
  `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor.
  Highest assigned slice is 351; reserve 352.
- **Board:** canonical revision 1380, EPIC-14/15/16 Closed, EPIC-17 and
  G04-V02 In Progress, V01 Done, V03 Backlog. S351 exit/source/current-render/
  label-search/front-overlay/back-overlay evidence is linked. Its landed
  commit evidence will be linked with the next validated board update.
- **Usage:** primary 16% used; weekly 23% informational.
- **Baseline:** 17 Polo configurations / 34 faces; all 34 held. Integrated G04
  remains 56 accepted / 90 held across 73 configurations / 146 faces.
- **Maintainer decision (2026-10-02):** the S351 view-only normalized-
  arclength projection is approved. The exact decision is recorded in
  `docs/PROJECT-DECISIONS.md`; S352 remains diagnostic-only and independent.

## Scope

Create a diagnostic-only view of a bounded external label rail with routed
leaders for Polo's exact three recurring blockers: front `Finished collar
stand height` and `Stand front rise`; back `Sleeve bicep width`. Read the exact
anchors, values, measured label boxes, visible paths and all already-positioned
same-face callouts from the fresh S351 current-source matrix. Preserve source
POM methods, text, values, tolerance, source entity, revision, cut/assembly
geometry and production renderer behavior.

Try a small set of explicit path candidates (direct or one-bend orthogonal
leaders) from each exact anchor to label boxes outside the visible garment
silhouette. Candidate routing must treat the full path as a leader, including
shared-anchor escape, and reject routes that cross one another, collide with
any label box, cross visible garment/construction geometry, clip the rendered
view, or make the anchor/measurement association unclear. Keep every
pre-existing accepted diagnostic POM in its source order and position.

If a candidate requires a new presentation convention, unbounded whitespace,
geometry masking, changing POM text/value/anchor, or excluding an existing
callout to fit, record the exact failure rather than treating it as a pass. All
51 blockers across 17 options are measured; diagnostic SVGs are not production
output. The approved S351 Polo cap-ease mapping remains a separate
implementation and output-validation gate. No Polo face can be accepted from
this layout experiment.

## Acceptance and verification

- Replay all 17 exact Polo option cases / 34 faces from the current source and
  revision; all 51 recurring blocked POM instances must have an explicit
  candidate disposition.
- Record exact path coordinates, label boxes, rail bounds and collision
  results. Retain candidate JSON/SVG/PNG with source revision IDs.
- Chromium-load the full 34 candidate views with zero page/console/request
  errors; manually inspect default front/back plus collar/measurement option
  extremes. Check all three callouts, paths, labels and surrounding garment
  output at readable scale.
- Do not change production code, pattern source, stitch/ease graph, accepted
  counts, assembly threshold, POM definitions, option ranges, DXF behavior or
  protected export identities in this diagnostic slice. If a coherent route
  is found, implementation requires a separately numbered production slice
  with focused 100% changed-code coverage, build, protected exports, full
  Polo option replay and production rendered review.
- Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, this packet and the canonical
  Control Center through its validated command layer. Run
  `npm run control-center:test` and `git diff --check`.
- No safe disjoint ownership is available; anchor resolution, callout
  collision rules and view rendering are coupled. Codex owns candidate
  generation and review. OpenCode/Claude are not used.

## Non-goals

No implementation of the cap-ease seam projection, cut/pattern/stitch changes,
POM definition/value changes, production UI redesign, acceptance-threshold
change, partial-face
release, other recipe work, G05 tech-pack scope, G09/D04 assembled views, V03
CAD work, physical sampling, fit/factory/production-readiness claim, supplier
contact, launch spending or hosted service.

## Exit record

**Disposition: no safe routed-label implementation candidate.** Chromium
replayed the exact S351 current-source render for all 17 Polo option cases /
34 faces. The bounded rail search tried 20 placements per each of the 51
blocked POM instances (four external sides and five lane offsets), measured
the existing browser text boxes, sampled visible SVG strokes along candidate
leader polylines, and rejected labels over represented garment geometry.
None passed. All 51 candidates cross a visible rendered stroke; the 17 Back
`Sleeve bicep width` instances additionally cross an existing text label on
every tested route. The default FRONT/ BACK overlays were manually inspected:
their blocked anchors lie in the dense neckline/body assembly, and the tested
long rail escape paths would cross represented construction geometry. The
diagnostic candidate generator therefore renders red held-anchor marks and no
blue candidate labels/routes in all 34 views.

Evidence is retained in `docs/research/epic17/S352-polo-pom-routing/`:
`all-source-render-matrix.json` and 34 source-revision-bound source SVGs;
`external-rail-route-matrix.json` (51 targets / 20 routes each, exact anchor,
text, label box and path coordinates); `candidate-render-manifest.json`; and
34 rendered candidate SVG/PNG pairs. Static Chromium loads reported zero SVG
parser errors across the 34 files. The default front and back output was
visually checked; no candidate route is marked accepted. The current-source
`0.68 cm` assembly residual remains above the unchanged `0.25 cm` gate, and
all 34 Polo face requests remain held. The integrated tally remains 56
accepted / 90 held; all-seven V02 and V03 gating are unchanged. Board revision
1392 links the exit, route matrix and rendered evidence to G04-V02 and EPIC-17.

The maintainer approved the separate S351 view-only cap-to-armhole
normalized-arclength projection during S352. Its approval is durable in
`docs/PROJECT-DECISIONS.md`; it has not been implemented by this diagnostic
slice and does not waive the residual threshold or any output checks.

No production source, test, pattern, stitch, POM, threshold, export, or board
acceptance behavior changed. `npm run control-center:test` passes 33/33 and
`git diff --check` passes. No independent delegation or agent wait occurred.
Elapsed (2026-10-02 02:37:02–03:00 UTC, approximately 23 minutes): production
implementation 0m; focused source/render/collision experiment and visual review
approximately 17m; maintainer decision time less than 1m (approval received
during the slice); durable records, board updates and focused verification
approximately 6m.

**Next action:** begin a separate production slice for the approved Polo
cap-to-armhole display projection, with revision-bound metadata, focused
100%-coverage tests and all 17 options / 34 production-rendered faces. Keep
the recurring callout blockers and every Polo hold intact. Do not start V03.
