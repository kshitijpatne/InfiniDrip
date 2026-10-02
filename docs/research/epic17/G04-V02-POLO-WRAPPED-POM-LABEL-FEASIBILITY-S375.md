# G04 V02 — Polo wrapped POM label feasibility — Slice 375

## Start boundary

- Started 2026-10-02 16:06:23 UTC from clean S374 commit `988385813a3dddb31013477646a7540617b8bd1e` on `codex/epic-17-g04`. `origin/main` was refreshed to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and is an ancestor. Highest assigned slice was 374; reserve 375.
- Canonical Control Center board revision 1834: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. All 34 Polo faces remain held. S374 exit evidence is linked.
- Goal record was checked at the S374 boundary and is active; its remaining objective is still needed through G04 completion and merge. Usage before S375: primary 60% used, weekly 72% informational.
- Verified `origin/main` ancestry, clean working tree, exact recent history through `9883858` and unique next slice 375. No safe disjoint delegated task: exact same-revision geometry, two callout layouts, path/box collisions and joint rendered review are coupled; Codex owns the slice.

## Authority and source facts

The admitted V02 contract requires source-bound, readable exact POM callouts. S352 found no safe external-rail route for the three original Polo POM blockers. S353 implemented the separately approved `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH` seam projection and documented the current split: all 34 Polo faces still fail closed at the 0.68 cm rigid sleeve-cap endpoint residual against the preserved 0.25 cm threshold, while 34 front callouts remain unreadable; the old back bicep-label blocker no longer appears.

The current exact source POMs are:

- `Finished collar stand height`: method `seam(outerStand.frontEnd)`, tolerance ±0.2 cm, anchor at the authored `outerStand.frontEnd` start.
- `Stand front rise`: source method compares the source front/back neckline start Y coordinates against `outerStand.frontNeckline` start Y; tolerance ±0.2 cm, anchor at that exact authored start.

S353's approved cap projection, same-revision source mapping, colorway, cut geometry, stitches, source values and rigid solver are outside this diagnostic. Values are read from each exact draft; do not invent, round, change or remove method/value/tolerance/wording. Candidate variants may change only line breaks and diagnostic label placement.

## Bounded diagnostic scope

Test whether wrapping the two recurring blocked front POMs into two or three lines can yield a readable joint layout across all 17 supported Polo option configurations. Candidate full-text layouts:

- `Finished collar stand height:` / `<exact value> cm (±0.2 cm)`; and `Stand front rise:` / `<exact value> cm (±0.2 cm)`.
- A three-line alternative may split the label phrase and measurement line only if all original words, method/value, units and tolerance remain verbatim.

Compile from the exact current draft/revision and actual visible geometry. Measure with Chromium. Search both labels together so neither can take a placement that conflicts with the other. Preserve all other valid same-face callouts, exact anchor/target/source IDs, current garment geometry and issue/hold behavior. Require no overlap/clipping, at least 0.25 cm clearance, no leader crossings or false seam-like tracking, and a clear association from each anchor to the named dimension. The diagnostic SVGs omit colorway fill, so filled-colorway readability was not verified here.

The search screens the full 1 cm lattice in a ±18 cm X/Y square around each exact anchor for text boxes that fit in the frame and avoid other text and piece paths. For each of the three wrap layouts per POM it routes the 48 nearest legal boxes using seven direct/orthogonal/corridor leader shapes. This is a deliberately bounded candidate sampler, not an exhaustive proof that no other placement exists. The two target callouts are searched jointly for box overlap, leader crossings, and leader-to-other-box crossings. Diagnostic source-anchor SVG/PNG views are saved for every configuration whose base front render can be emitted.

Keep all 34 Polo faces held regardless of diagnostic label success: the 0.68 cm sleeve-cap residual still exceeds 0.25 cm, and full-face V02 acceptance requires all other checks. This work cannot implement labels, waive the threshold, change any production status, or satisfy all-seven V02 by itself.

## Non-goals and gates

- No production renderer/POM changes, cut/pattern geometry, stitch graph, projection map, source POM method/value/tolerance/wording, solver, residual threshold, colorway, options, DXF writer, protected export identities or face acceptance changes.
- No broad UI redesign, G05 tech pack, G09/D04 assembled views, V03 CAD profile, physical sampling, fit/factory claim, supplier contact, launch cost, hosted service or readiness claim.
- Record each tested option and candidate disposition; preserve browser output and manually inspect all selected visual proofs. Focused diagnostic checks, validated board exit, `npm run control-center:test` and `git diff --check` are required. Production coverage/build/export gates do not apply if no production code changes; full Epic coverage and integrated output gates remain at the settled PR candidate.
- MQF-004–007, MQF-011, MQF-012 and MQF-015 remain review checks at their applicable output exits; honor the recorded post-G17 deferrals. No unscoped cosmetic work is authorized.

## Exit record

## Findings and evidence

- The exact source pair remains directly encoded: `Finished collar stand height` anchors to `outerStand.frontEnd`; `Stand front rise` anchors to `outerStand.frontNeckline`. In the default revision the two anchors are 2.001 cm apart, at the center-front stand/neckline/placket junction. This is the geometry visible in the rendered views; it is not an inferred construction relationship.
- The full lattice produced 794–940 legal label boxes per label/layout. Among the 15 configurations whose base diagnostic front view rendered, the nearest 48 legal boxes per each of six label variants produced 30,240 direct/orthogonal/corridor leader attempts. Zero passed the 0.25 cm clearance gate. All 30,240 had at least one geometry-clearance rejection; 29,527 also tracked a collar contour. Additional overlapping rejection counts: 158 routes exceeded 24 cm and 9,611 exceeded the 1.75 detour ratio. No joint pair was accepted in any searched configuration.
- Two of 17 configurations fail before candidate search because a separate, non-target `Collar point extension` callout already emits `TEXT_COLLISION`: `polo-standFrontRise-max` (1.5 cm) and `polo-collarPointExtension-min` (0.5 cm). They remain fail-closed and are not counted as searchable successes.
- Chromium reported zero browser errors. Manually inspected anchor close-ups include default, stand-height minimum/maximum, stand-front-rise minimum, and collar-leaf-depth minimum; whole views cover all 15 renderable configuration rows. The red A/B markers identify the exact source anchors. They show the pair adjacent to the busy collar/neckline/placket geometry, while the existing callout leaders cross the same region. The target labels themselves are omitted in these anchor-only views because the current compiler marks them blocked; these images are not candidate wrapped-layout output.
- Same-revision colorway overlay compilation reports available with no compile issue, but the diagnostic SVGs deliberately render line geometry and callouts without colorway fill. This evidence does not claim filled-colorway readability.
- **Conclusion:** the tested wrap-and-route alternatives do not resolve either recurring callout blocker within this bounded sampler. No source or semantic mapping is proposed. Keep all 34 Polo faces held: the separate 0.68 cm sleeve-cap residual still exceeds the unchanged 0.25 cm gate, in addition to the callout and two base-render failures. Integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. V02 and V03 remain open; all-seven V02 and V02-before-V03 stay in force.

Artifacts: `docs/research/epic17/S375-polo-wrapped-pom-feasibility/wrapped-polo-feasibility.json` records every option, exact source callouts, legal-box counts, route counts, render blockers, and residuals. `search-summary.json` gives the aggregate. `source-anchor-views/` contains whole/detail SVG/PNG evidence for the 15 base-renderable configurations. The deterministic search script is `search-polo-wrapped-poms.ts`; run with `G04_PREVIEW_URL=http://127.0.0.1:<vite-port>/ npx tsx docs/research/epic17/S375-polo-wrapped-pom-feasibility/search-polo-wrapped-poms.ts`.

## Exit verification and remaining work

- Diagnostic assertions pass: 17 option rows accounted for, two target source callouts resolved per row, and zero browser errors. The two render-failing rows are explicitly recorded as fail-closed rather than treated as passes.
- The validated Control Center exit replay adds `E-G04-S375-EXIT`, `E-G04-S375-SEARCH`, and the manually reviewed default whole/detail render evidence to G04-V02 and EPIC-17. Canonical board revision 1851. `npm run control-center:test` passes 42/42 after the final board mutation. `git diff --check` passes.
- No production source or test changed. Therefore changed-production-code coverage/build/export gates do not apply to this diagnostic-only slice. Preserve the full Epic coverage, legacy DXF, protected export identity, and integrated output gates for the settled Epic/PR candidate.
- All 34 Polo faces remain held and no POM layout or production behavior is implemented. S373's separate Woven sleeve-overlap decision remains pending. All seven recipes, V02-before-V03, G05/G09 boundaries, and post-G17 MQF deferrals remain unchanged.
- **Next action:** commit the S375 evidence-only slice, refresh Git and the canonical board, then select the next held G04 area without weakening any acceptance gate.

## Slice timing

Elapsed wall time from the S375 start boundary to verification: about 50 minutes. Tracked estimates: diagnostic implementation/search harness 9m; focused Chromium search and matrix verification 21m; rendered inspection 7m; durable packet/state/board work 11m; Control Center and diff checks 2m; external-agent waits 0m; maintainer-decision time during this slice 0m. No production code or approval-dependent implementation changed.
