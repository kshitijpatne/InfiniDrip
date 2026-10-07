# G04 V02 — Woven hold boundary after sleeve-feasibility no-go — Slice 441

## Start boundary

- Started 2026-10-07 20:52:06 UTC from clean S440 `d282e99ab7512de02e38be774b02aa6531d35f5a` on `codex/epic-17-g04`.
- Refreshed `origin/main` to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it remains an ancestor. Highest assigned slice was 440; reserve 441.
- Canonical board revision 2643: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Integrated tally 56 accepted / 90 held across 73 options / 146 faces. The active goal still covers completion through safe merge.
- Usage at start: 31% primary / 19% weekly. Ordinary work was allowed.

## Scope and controls

Reconcile exact Woven V02 holds and test only the S431 hypothesis of a local-Y reflection for the back-facing Woven sleeve. Bind to exact output revision `live-draft:woven-shirt:14:14`, S406 mappings, S373 back crossing, S417 front contacts, S440 geometry result, and the approved S370 detached-band layout. No production mapping or face release is authorized.

Required controls: preserve both full source-joined sleeves, source geometry/stitches, S344 cap correspondence, S370 band detail scale/instance count/approved footprint, all 56 Woven and 34 Polo holds, all-seven V02 acceptance, V02-before-V03, protected exports and legacy DXF behavior. A view-only convention lacking source or pattern-specific support must be identified as a design choice.

## Exact source findings

- `wovenSleeve` is one uncut, non-on-fold piece. Its source outline is ordered `capLeft`, `sideLeft`, full `hem`, `sideRight`, `capRight`; two cap curves join the source `front.armhole`, `yoke.armhole`, and `back.armhole` intervals through the authored `Woven sleeve-cap ease` relations. Its full hem is source-stitched to `sleeveBand.top`.
- Source topology declares no sleeve-to-sleeve stitch, center crossing station, hem split, over/under order, or on-fold role for the sleeve. No pattern-specific reference located in the reviewed task materials establishes such a back-flat orientation.
- The already approved S344 cap receiver and S370 detached-band footprint constrain the displayed assembly. S370 approved source-scale band details as side-gutter callouts and did not authorize moving their page positions or assembly relations.
- S417's separate front neckline/collar contacts remain present. Resolving the back candidate cannot clear or alter that front hold.

## Candidate evaluated — proposed convention, not source fact

In an isolated diagnostic copy of the exact S440 renderer, reflect the whole source sleeve across its local Y axis (`x → -x`), then create two reflected instances about `back.centerBack`; retain the exact cap arclength correspondences and full hem-to-band source identity. No piece outline, cut geometry, stitch graph, source revision, option or production code was changed. This is a proposed view convention only: source does not designate a handed face or this sleeve orientation.

The trial rendered all 28 options / 56 faces through the actual Chromium SVG path at source revision `live-draft:woven-shirt:14:14`:

- 28/28 front and 28/28 back SVGs emitted; zero compile, renderer or browser errors.
- Full-text D marker and schedule emitted on 28/28 fronts; all front SVGs were byte-identical to the S406/S406-derived baseline.
- Two complete source-identified sleeve outlines appeared on each back. Exact SVG geometry checks found zero proper sleeve-pair crossings, zero sleeve/body-outline crossings, zero back/yoke fill penetrations, and zero frame failures across all 28 options.
- Both detached band details remained complete and source-scale with at least 1.0 cm clearance after automatic relocation. Their current approved S370 positions, however, collide with the candidate sleeves in 28/28 options at 0.05 cm clearance. To clear them, the view moved each band 20.5737–22.4315 cm farther outward (21.7425 cm in the default option); this is not authorized by S370.
- Resulting viewBox width is 105.5474–109.263 cm, versus 64.4 cm in the S406 baseline (+41.1474–44.863 cm; default +43.4849 cm). The actual closeup is clear, but the full sheet expands materially. Keeping the original band locations is not an acceptable variant: it overlaps in every option.

This candidate proves mathematical/rendered separation under a changed detached-detail layout; it does not prove source-backed orientation or preserve the previously approved page footprint. It therefore does not clear the Woven hold without an explicit maintainer decision. The user must choose whether to retain the S370 footprint and holds, or explicitly authorize this exact view convention plus the quantified band-layout/viewBox change for implementation and verification. Neither choice accepts any face.

## Holds and acceptance

- Woven back: all 28 options / 28 faces remain held pending the S370 layout decision and remaining V02 checks.
- Woven front: all 28 options / 28 faces remain held by the S417 neckline/collar contact; this candidate does not change it.
- Polo: all 17 options / 34 faces remain held pending the integrated all-applicable V02 evidence and exact 0.25 cm residual gate. The current Polo FG mapping approval remains the exact S434 recorded decision; this Woven trial changes none of its source POM or schedule behavior.
- Integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces. All-seven V02 and V02-before-V03 are unchanged. V03 remains Backlog.
- No physical fit, factory acceptance, industrial CAD compatibility or production-readiness claim is made.

## External research and build diagnostic

The specifically required Claude Opus 5.5 xhigh read-only attempt was made in a separate exact-S440 checkout, but the CLI returned the session-limit message before producing analysis or `WORK FINISHED`. No result is attributed to Claude and no alternative model was substituted. Exact attempt is recorded in `S441-claude-opus-5-5-attempt.md`.

The diagnostic checkout's `npm run build` failed on existing S440 TypeScript errors. After restoring the checkout's production source to exact S440, the same diagnostics reproduced; this trial therefore did not introduce the build failure. See `S441-build-baseline-failure.md`. No G04 production source/test code changed in the primary worktree.

## Verification and evidence

- Actual candidate render matrix: `local-y-candidate-rendered/matrix.json` (73-option-applicable fixtures subset for Woven: 28 options, 56 faces), with raw emitted SVGs and per-face compiler/render/browser results.
- Geometry checks: `local-y-candidate-crossings.json`, `local-y-candidate-geometry.json`; analysis sources: `analyze-local-y-candidate.mjs`, `analyze-local-y-geometry.mjs`.
- Chromium output review: `local-y-candidate-rendered/png/woven-shirt-default-back_flat-whole.png`, `.../woven-shirt-collarLeafDepth-min-back_flat-whole.png`, `.../woven-shirt-collarLeafDepth-max-back_flat-whole.png`, `.../woven-shirt-combined-supported-back_flat-whole.png`, and `.../woven-shirt-default-back_flat-sleeve-band-closeup.png`.
- The diagnostic-only projection transform is reproducible from `render-local-y-candidate.mjs`; its temporary source delta was never applied to the main worktree and is not retained as a production patch.
- `npm run control-center:test` passes 42/42. Canonical board read validation and exit preflight/replay pass; board advanced 2645→2652 with six verified evidence links and unchanged EPIC-17/G04-V02/V01/V03 statuses and 56 accepted / 90 held tally. Focused analysis/render-script syntax checks and `git diff --check` pass. The first exit-command preflight rejected the unsupported board evidence kind `test-report`; the command was corrected to canonical `test`/`build` kinds, then preflighted and replayed successfully. An initial attempt to run a nonexistent `ops/control-center/validate.mjs` path did not mutate state; canonical validation is through `readBoardFile` and the passing Control Center suite. No changed-production coverage/export/full-Epic gate is due because no production source or test changed. The full repository build must be diagnosed on the integrated candidate before PR merge.

## Slice result and next action

**Result:** evidence complete; no production mapping implemented; all holds and acceptance criteria retained. Candidate resolves the geometric crossing only if a previously fixed detached-band layout is moved; source does not settle the intended orientation. Await the bounded design decision described above. After approval/hold is recorded, reserve the next unique slice and continue independent V02 work without relaxing all-seven acceptance. Do not start V03 before V02 passes.

Elapsed 2026-10-07 20:52:06–21:22:27 UTC (30m21s): production implementation 0m; source/topology review about 4m; diagnostic setup, all-option Chromium replay and geometry analysis about 11m; rendered review about 3m; build-baseline comparison and Opus attempt about 2m; durable records/board closeout and focused Control Center verification about 10m; external-agent/model wait 0m usable result (Opus stopped immediately on session-limit); maintainer-decision time 0m within this slice. Times are approximate because overlapping review and replay were not separately instrumented.
