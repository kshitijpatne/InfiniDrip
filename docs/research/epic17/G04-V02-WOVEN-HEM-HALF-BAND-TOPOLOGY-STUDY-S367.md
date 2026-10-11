# G04 V02 — Woven sleeve/band half-edge topology diagnostic — Slice 367

## Start boundary

- **Start:** 2026-10-02 11:31:58 UTC from landed S366 commit `3b0d3489084fef937306e4295b94a08478743fe1` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 366; S367 is reserved.
- **Board:** canonical revision 1659; EPIC-17 and G04-V02 remain In Progress, V01 Done and V03 Backlog. S366 evidence is verified at its landed commit. Integrated acceptance remains 56 accepted / 90 held over 73 configurations / 146 face requests; all 56 Woven and 34 Polo faces remain held.
- **Goal and usage:** goal is active and still matches the admitted G04 objective. Ordinary usage allowed; primary window 14% and weekly 52% used at entry. Polo's 0.25 cm assembly residual gate is reaffirmed and fixed.
- **Scope correction:** final S366 code audit found `mapSleeveEdge("hem")` sampled the full 37 cm source hem although projection metadata selects the BACK run `sleeve.hem` start → arclength 0.5. The prior 20–25-crossing result rejects that full-hem/full-band outward-normal candidate only; it does not evaluate the exact BACK run. Separately, S321 specifies one uncut band instance, so a half-band crop is not the approved view convention. S367 records both distinctions and tests the crop only as an unapproved diagnostic hypothesis.

## Objective and bounded diagnostic

Audit whether a diagnostic crop of the source band top half can remove the Woven BACK sleeve/band crossings without touching cut/stitch geometry, and compare that hypothesis with the approved full-band view convention. Rebuild all 28 current Woven options at exact revision `live-draft:woven-shirt:14:14`. The projection metadata selects `sleeve.hem` start-to-0.5 for the BACK face. The same-revision stitch connects the full `sleeveBand.top` to full `sleeve.hem`; the transformed endpoints show `sleeveBand.top[0,0.5]` aligns to `sleeve.hem[0,0.5]`. This source-derived endpoint correspondence does not itself authorize cropping the cut band in the view. The S321 research proposal explicitly says to show each folded band as one uncut view instance. Accordingly, the half-band crop below is a diagnostic-only, unapproved alternative and cannot pass or replace the S321 gate.

The diagnostic crop contains `sleeveBand.top[0,0.5]`, `sideLeft[0,1]`, `bottom[0.5,1]`, and `bandFold[0,0.5]`; the artificial half boundary is fill-only. The right-side crop is mirrored across `back.centerBack`. This tests whether cropping a source band piece at its half station can clear crossings; it does not encode the approved uncut-band view and makes no claim about a physical band half.

No production implementation, cut-geometry/stitch-graph edit, option change, solver/acceptance change or face acceptance is authorized in S367. A passing crop could only motivate a separate proposal; it could not replace the approved S321 uncut-band view without maintainer approval. If it fails, retain all holds and report the exact conflicting edge/path pairs. Do not reinterpret the S366 full-hem result as evidence against this corrected half-edge candidate.

## Evidence and acceptance gates

- Rebuild exact source topology and the approved sleeve projection plus the diagnostic crop hypothesis for all 28 Woven options; retain all 56 front/back request IDs, emitted/held status and exact pattern/output revision. Front holds stay holds.
- Record the exact `sleeve.hem` [0,0.5] interval and hypothesized `sleeveBand.top` [0,0.5] crop, piece-edge lengths, paired source role transforms/center-back reflection, the matched band side/bottom/fold-mark intervals, receiving normal derivation, and source stitch identity. Separate measured source join residual from any zero view alignment imposed by shared coordinates.
- Measure same-instance sleeve/band self-intersections, opposite-instance pairs, sleeve-to-band overlap/crossings, receiver/body/yoke crossings and exact endpoints. Do not treat the hidden half boundary as a visible seam or contour.
- Render annotated Chromium views for default, yoke-depth minimum/maximum, sleeve-band-depth maximum and combined-supported options; inspect cuff visibility, fold mark, crossings, overlap, clipping/page bounds and label/callout visibility. Preserve SVG and PNG evidence.
- Passing this diagnostic does not pass V02 or release any face. The complete production front/back option matrix, all recipe gates, MQF review, exact POM/colorway checks and manual output review remain required. A production mapping that encodes a new normal/layer rule requires maintainer approval.
- Preserve Polo's 0.25 cm residual gate; all seven recipes remain required; V03 remains gated by complete V02. Preserve legacy DXF behavior and protected byte identities.

## Non-goals and ownership

No production renderer/projection edit; pattern/cut/stitch mutation; physical construction/fit/factory claim; relaxation of S321 conditions or all-seven acceptance; export/CAD work; V03 work; G05 tech-pack; G09/D04 assembled views; broad UI changes; new recipe; sampling; supplier contact; launch spend; hosted service; or production-readiness claim. Geometry, topology, projection and rendered evidence are coupled, so no safe disjoint owner is assigned. Codex owns the analysis and final review; no Claude/OpenCode work is assigned.

Focused diagnostic test/replay, actual Chromium review, validated Control Center command replay/tests and `git diff --check` are required. No changed-production coverage/build/export gate applies unless production files change. The settled integrated Epic candidate still requires the full repository 100% coverage gate, integrated build, legacy DXF/protected identity check and final rendered-output review before merge.

## Findings and exit record

### Source facts and approved view decision

- **Directly encoded:** the exact revision is `live-draft:woven-shirt:14:14`; the source stitch `Folded sleeve band ↔ sleeve hem` joins unreversed `sleeveBand.top` to unreversed `sleeve.hem`, with no ease. Both are 37 cm in the default option. Across the 28-option matrix, the full source endpoint residual is at most 2.5619e-14 cm.
- **Directly encoded in projection metadata:** the BACK sleeve includes `sleeve.hem` start→arclength 0.5; the reflected role identity uses two sleeve and two band instances around `back.centerBack`.
- **Pattern-specific approved view reference:** `docs/research/epic17/G04-V02-SOURCE-MAPPING-PROPOSALS-S321.md` says each folded sleeve band is shown as one uncut view instance at the sleeve opening, aligns band `top` to sleeve `hem`, and retains its existing `bandFold` mark. S321 is the relevant approved view convention. A 0.5 crop of the band is not authorized by that decision.
- **S366 correction:** its diagnostic's `mapSleeveEdge("hem")` sampled the full 37 cm hem. It tested a full-hem/full-band outward-normal candidate, not the exact BACK hem run. Its 20–25 crossings remain valid for that candidate only.

### Diagnostic crop result — not approval or V02 acceptance

The source half-correspondence script tested both band-top halves against the exact sleeve run. For every configuration, `sleeveBand.top[0,0.5]` matches `sleeve.hem[0,0.5]` in directed transformed order; the maximum sampled residual is 1.8546e-14 cm. The other top half is 37 cm from the chosen hem half. This establishes geometric correspondence for a possible crop, not permission to render a cropped band.

The half-crop uses top [0,0.5], sideLeft [0,1], bottom [0.5,1], and fold mark [0,0.5]; it leaves the source piece and stitch graph unchanged. All 28 configurations and 56 request identities are reconciled at the same revision. The candidate crop has zero self-crossings and zero body/yoke crossings, but fails the view gate in 27 of 28 options: its right/left hem seam strokes cross once in each option; its cropped band outer contours cross once in 27; and band bottom crosses the opposite sleeve path twice in 27. At max `sleeveBandDepth` the last two counts are zero, but the hem seam crossing remains. The default measured points are (approximately) (0,23.6651) cm for the mirrored seam crossing, (0,18.5828) cm for the band outer crossing, and (±1.8583,21.1240) cm for band-to-opposite-sleeve crossings. Two additional rendered line hits per option are within the 0.001 cm shared-node tolerance and are recorded separately, not treated as crossings.

Chromium views for default, minimum/maximum yoke depth, maximum band depth, and the combined supported extreme have zero browser errors. Manual review confirms the central sleeve/band X and overlapping fold-mark region; the crop is visibly misleading and fails. The diagnostic labels all faces held. It does not rerender production acceptance, clear the full-band baseline, validate callout/colorway gates, or accept a face. S349/S365 remain the evidence for the approved uncut full-band candidate's existing crossings.

### Holds, verification, and next gate

No production code, source geometry, stitch graph, options, solver threshold, exporter, acceptance status, or protected output changed. Preserve all 56 Woven and 34 Polo holds; integrated status remains 56 accepted / 90 held across 73 configurations / 146 requests. Preserve all-seven V02, the Polo 0.25 cm residual gate, legacy DXF, protected byte identities, and V02-before-V03. V03 remains blocked pending every V02 recipe/face gate. No fit, factory, or production-readiness claim is made.

Evidence: `source-half-correspondence.json`, `half-band-topology-matrix.json`, `half-band-crossing-pairs.json`, five annotated Chromium SVG/PNG pairs, and focused regression `half-band-topology.test.mjs`. Reproduction: `inspect-source-half-correspondence.mts`, `diagnose-half-band-topology.mts`, and `audit-half-band-crossings.mjs`. The focused test passes 2/2; source correspondence and topology replays cover 28 options; crossing-pair audit covers the 28 same-revision records; five Chromium renders have zero browser errors and were manually reviewed; script syntax checks and `git diff --check` pass. The initial script attempts and one test-selector failure were corrected and logged in `S367-verification-notes.md`. No production coverage/build/export gate applies; the integrated 100% global coverage/build/export/render gate remains due once at the settled Epic candidate.

**Next action:** reserve S368 only after refreshing Git, usage, history and board. Continue V02 with a diagnostic or implementation proposal that preserves S321's uncut-band requirement; do not implement a new band pose or lift a hold without its required approval and all-option rendered checks. Keep V03 Backlog.

**Elapsed accounting:** S367 elapsed 11:31:58–12:07:49 UTC (35m51s): production implementation 0m; source/topology analysis, diagnostic scripting and all-option replay 14m; focused verification and correction 4m; rendered review 4m; packet/context/state/roadmap/board closeout 13m51s; external-agent waits 0m; maintainer-decision wait 0m (the user reaffirmed the existing Polo 0.25 cm gate during the slice; no dependent work paused).
