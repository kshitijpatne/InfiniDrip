# G04 V02 — Polo cap/armhole residual lower-bound diagnostic — Slice 423

## Start boundary

- Started 2026-10-07 09:38:09 UTC from clean S422 `2d6b018469823f0204d5d3bf31340f799d215712` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice 422; 423 is unique. Board revision 2464; V01 Done, V02 In Progress, V03 Backlog. Goal remains active and matches EPIC-17's full objective. Usage at entry: 50% primary / 8% weekly.
- **Current blockers:** 0.68 cm production RMS across the 17 Polo option rows exceeds the maintainer-fixed 0.25 cm gate on all 34 faces. S415 already distinguishes authored 1.5 cm ease from that residual. S422's separate Woven clipping and Polo H annotation decisions are pending and do not affect this geometry metric.

## Scope and testable question

Determine from exact current source curves and S415/S382 matrices whether the existing normalized-arclength projection's 0.68 cm landmark RMS can be reduced below 0.25 cm by a source-supported one-to-one correspondence while keeping rigid transforms and cut curves unchanged. Identify the exact production landmark set and derive its endpoint-chord lower bound. Reuse saved option geometry and production metric code. Do not change production source, stitch graph, cut geometry, transform, acceptance threshold, or view state.

### Required evidence

- Bind all 17 saved Polo options to exact source revisions, sleeve cap halves and receiving armhole halves; inspect endpoint incidence and lengths per option.
- Reproduce the production-mapped RMS and test only correspondence weights/stations that are explicitly supported by source endpoints, source stitch joins or existing approved projection landmarks. Report endpoint-only, interior and total residuals, not a replacement metric.
- If the 0.25 cm gate is not reachable under supported mappings without deforming geometry, adding non-source seam stations, changing construction, or altering the gate, document that lower-bound limitation and preserve all 34 holds. Any unapproved nonlinear/wrap convention is diagnostic only.
- Preserve all 56 Woven and 34 Polo holds, all-seven V02, V02-before-V03, legacy DXF and protected export identities. No face is released by this diagnostic.

## Non-goals and delegation

No physical fit/ease claim, source repair, threshold change, production renderer change, alternate design semantics, CAD work, output release, or general research. No safe disjoint contribution is identified: the metric, exact geometry and option matrix are one coupled diagnostic. Codex owns the complete trace and any design question.

## Findings and disposition

The exact source revision is the current `draftPolo(STANDARD_M, values)` output for each of the 17 S415 option rows. All rows use the unchanged `Sleeve-cap ease` source stitch: front `sleeve.capLeft` to `front.armhole` and back `sleeve.capRight` to `back.armhole`. Their edge endpoints are the source-encoded underarm/shoulder stations; the receiver is reversed/reflected for the face view. The approved projection is view-only and the metric's current `stitchRelations` emits only parameters 0 and 1 for each curve pair, so this RMS is endpoint-landmark-only; it does not measure the interior curve shape or authored arc-length ease.

Across all 17 options on both faces, cap-half arc length is 21.595729 cm and receiving half-armhole length is 20.845729 cm, retaining the source-authored 0.75 cm ease per half / 1.5 cm total. Cap endpoint chord is 21.574132 cm; armhole endpoint chord is 20.615528 cm. The 0.958604 cm chord mismatch gives hard-anchored endpoint RMS `0.958604 / sqrt(2) = 0.677835 cm`, which rounds to the actual production diagnostic of 0.68 cm. The live `assembleTechnicalFlatRoles` compiler reproduced exactly two 0.68 cm issues per option row, front and back. The best unconstrained rigid two-endpoint least-squares residual is `0.958604 / 2 = 0.479302 cm`, still above the maintainer-fixed 0.25 cm gate. For hard endpoint anchors, meeting 0.25 cm would require chord mismatch no greater than `0.25 * sqrt(2) = 0.353553 cm`.

Thus no source-supported correspondence or rigid transform using these unchanged source curves can meet the existing gate. The option values do not resolve this invariant. A passing result requires a separately approved pattern-geometry/source repair or a changed acceptance gate; this slice authorizes neither. The gate remains 0.25 cm, all-seven recipe acceptance remains, and every one of the 34 Polo faces stays held. No source, stitch, cut geometry, transform, renderer, status, or acceptance changed; no physical fit or factory claim is made.

Actual diagnostic output was reviewed against S332's rendered held candidate images (`front_flat-candidate.png`, `back_flat-candidate.png`): the endpoint gap is visible on both faces. Those crops remain diagnostic evidence, not released flats. The exact option matrix and reproducible source/production calculation are `endpoint-chord-matrix.json` and `measure-chord-lower-bound.ts` in this packet.

## Exit evidence

- Exact 17-option source-bound matrix and invariant assertions pass; live production assembly reports two 0.68 cm holds for every row.
- `npm run control-center:test`: 42/42 passed.
- Start and exit replay scripts pass `node --check`; `git diff --check` passes.
- No production code/test changed, so changed-production coverage, global coverage, build, export-identity and browser gates are not due in this diagnostic slice; run the integrated gates on the settled Epic/PR candidate.
- Validated board exit evidence is linked to G04-V02 and EPIC-17. V01 remains Done, V02 In Progress, V03 Backlog. All 56 Woven and 34 Polo faces remain held.

Elapsed from 09:38:09 to 09:44:04 UTC: source/metric trace and exact option replay ~3m; lower-bound derivation and rendered evidence review ~1m; packet/state/board closeout and focused verification ~2m; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** prepare a bounded, source-only Polo geometry-repair proposal for maintainer review, without editing pattern source; retain all 34 Polo holds and the fixed 0.25 cm gate.
