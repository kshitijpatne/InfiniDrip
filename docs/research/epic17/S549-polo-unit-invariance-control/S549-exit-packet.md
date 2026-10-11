# EPIC-17 / G04 V03 — Polo unit-invariance control — Slice 549 exit

## Result

The geometry-preserving cm-to-mm fixture was generated and verified, but the CLO exchange did not run. The screenshot showed the loaded pattern canvas while the accessibility tree reported an `Export DXF` dialog that was not visible. An attempted click on its reported Cancel control had an unknown outcome; a fresh capture still showed the canvas and hidden dialog, and `list_windows()` returned no separate modal. No further UI input, import, or export was attempted. CLO remains open.

## Evidence from the files

- The S545/S500 Polo source is byte-identical: 24,261 bytes, SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`. S545's current AAMA analysis asserts the same source hash.
- The derived fixture is `C:\G04-CLO-DXF-Exchange\S549-polo-unit-invariance-control\polo-standard-m-mm.dxf`, SHA-256 `8fb314343cdf54557e4d331b5aabc1916dc1ab77f45ac5a791d76f9ebe6874af`. Its 1,327 length-coded values were scaled by 10. Dividing them by 10 recovers each source value with maximum floating calculation difference `1.42e-14 cm`; all non-length DXF code/value pairs remained unchanged. No source pattern or production file was edited.
- S545's actual AAMA analysis reports five of 18 Polo CUT contours over the `0.001 cm` gate in both generations, each with one fewer output vertex; the peak errors are `0.0139742 cm` and `0.0139879 cm`.
- Replaying the trusted S500 source-point mapping against the byte-identical source yields the shared geometric signature in `S549-microsegment-analysis.json`.

| Source ordinal / piece | Omitted vertex index | Incoming segment | Outgoing segment | Local turn | Lost-point deviation |
|---|---:|---:|---:|---:|
| 2 / back | 13 | 0.04562 cm | 1.24402 cm | 16.80° | 0.012736 cm |
| 10 / outer collar stand | 14 | 0.04652 cm | 9.40341 cm | 16.28° | 0.012983 cm |
| 12 / inner collar stand | 14 | 0.04696 cm | 9.40325 cm | 17.39° | 0.013970 cm |
| 14 / upper pointed collar | 14 | 0.04652 cm | 9.40341 cm | 16.28° | 0.012983 cm |
| 16 / under pointed collar | 14 | 0.04652 cm | 9.40341 cm | 16.28° | 0.012983 cm |

This is a shared source feature and a plausible simplification signature, not proof CLO uses a unit-dependent or short-segment rule. The planned unit-invariance control would distinguish a numeric-unit issue from a physical-feature-size issue, but is untested.

## Gate disposition and next action

No geometry, source topology, pattern options, stitch graph, protected export identity, or V03 acceptance changed. V03 remains In Progress with prior failures and gates intact. S549 clears no part of V03.

Keep the generated mm fixture and original input under their C: folders. Resume only when CLO presents one observable state in both screenshot and accessibility output. Then perform exactly one AAMA import/export with millimeters selected, 100% scale, no rotation, and the previously pinned remaining settings. Save the DXF and captures under `C:\G04-CLO-DXF-Exchange\S549-polo-unit-invariance-control\`. If CLO is still not targetable, do not repeat clicks or close/reopen it; continue independent non-UI work and retain the hold.

## Verification and time

- Fixture generator: `node docs/research/epic17/S549-polo-unit-invariance-control/generate-mm-fixture.mjs`; asserted the source hash and inverse coordinate error below `1e-12 cm`.
- Analysis: `analyze-microsegments.mjs` and `map-current-aama-points.mjs`; source and both AAMA output hashes asserted, five identical omitted indexes in gen1/gen2 reproduced, retained-point deltas `0.000013–0.000038 cm`.
- No exchange output or rendered exchange evidence exists because the app precondition failed. The desktop screenshot was inspected directly and was not copied outside the UI.
- `npm run control-center:test` 42/42; `git diff --check` and board preflight passed. No production code changed; the full repository gate is not due.
- Start `2026-10-08 22:56:52 UTC`; close `2026-10-08 23:02 UTC` (~5m): file transform and geometry analysis ~2m; UI observation/recovery ~1m; packet/state/board/focused verification ~2m; external-agent waits 0; maintainer-decision time 0.
- Board start/exit `3307→3309→3311`; supplemental exact mapping `3311→3313`.
- At the S548 safe boundary, `get_goal` confirmed the admitted objective remains active through safe merge and is still needed.
