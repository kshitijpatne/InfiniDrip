# EPIC-17 / G04 V03 — Standard versus AAMA output diagnostic — Slice 553 exit

## Result

A single CLO Standard DXF export from the already imported S551 Polo mm workspace produced **exactly the same geometry residuals** as S551's AAMA export across all 18 source contours: maximum absolute difference `0 cm` at reported precision. Both formats pass 13/18 and fail the same five CUT contours. The same source vertices are absent in the same receiver blocks in both outputs.

This rules out an AAMA-only output-path explanation for the observed five losses. It still cannot distinguish loss on CLO import/internal representation from behavior common to both exporters. No further setting/unit cycle on this same fixture is justified by this evidence.

## Exact failing mapping

| Source ordinal / role | Receiver block | Omitted source index | Standard DXF layer / residual (cm) | AAMA layer / residual (cm) | Retained coordinate max delta (cm) |
|---:|---|---:|---|---|---:|
| 2 / back | `1_M` | 13 | `14` / 0.0127415491 | `1` / 0.0127415491 | 0.0000088 |
| 10 / outer collar stand | `5_M` | 14 | `8` / 0.0129875674 | `8` / 0.0129875674 | 0.0000059 |
| 12 / inner collar stand | `6_M` | 14 | `8` / 0.0139692693 | `8` / 0.0139692693 | 0.0000059 |
| 14 / upper pointed collar | `7_M` | 14 | `14` / 0.0129880609 | `1` / 0.0129880609 | 0.0000059 |
| 16 / under pointed collar | `8_M` | 14 | `14` / 0.0129880609 | `1` / 0.0129880609 | 0.0000059 |

For every row, one-vertex-deletion matching independently found the same source index in Standard and AAMA. All 13 passing contours also have exactly equal symmetric residuals between these two millimeter outputs. The fixed limit remains `0.001 cm`; these five errors are unchanged at 12.7–14.0 times the limit.

## Actual CLO run

- CLO remained open as version `2026.1.310 (r58944)`. The visible current workspace matched the nine-piece Polo pattern arrangement from S551; no reimport or pattern edit occurred.
- Export changed only the format selection from DXF-AAMA to CLO's menu item `DXF` (Standard DXF). Live dialog values were: Graded Nest (the M/default fixture has no grade matrix), millimeter, 100%, Do Not Rotate; export without grading/baselines/seam allowance off; duplicate notch on seam allowance on; curve-to-straight off; optimize all curve points off.
- CLO completed the export and returned to the same rendered nine-piece workspace without an application error. Saved render: `polo-standard-export-render.png`. The exact settings are also recorded in the machine-readable analysis report.
- No third-party receiver, installation, network transfer, cloud upload, or paid action was involved. The exported DXF and captures are only in `C:\G04-CLO-DXF-Exchange\S553-standard-vs-aama-diagnostic`.

## Hash-pinned evidence

- Source DXF: SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- CLO AAMA mm output: `864cbc16df325c041ac3b1acea16e660f9056ef5cc78a7140852adbaf2242b17`.
- CLO Standard mm output: `e780644500c50a85df6fcec6e275a7511ef44d43f827fa545f29e313cfc39675`.
- Analysis report: `e766f5ec8d92d3c9ca094904144c66a06d6794f6c7ec19319633267e892bb01c`.
- Rendered workspace: `213c0be8f6a436ba3e2c69797143c5dc3bcc152b2c9fd795f254276942569390`.

The reproducible analyzer `analyze-standard-export.mjs` pins all input hashes, parses Standard DXF `LWPOLYLINE` blocks, checks all 18 closed source outlines at the unchanged gate, compares every contour residual against the existing AAMA mm report, and asserts all five same-index omissions. `node --check` and analyzer replay pass.

## Gate disposition and next action

- **Diagnostic pass:** Standard DXF versus AAMA output comparison; the same five losses and exact same measured residuals are reproduced.
- **V03 remains In Progress:** this is not industrial profile qualification or a compatibility claim. It does not establish CUT/SEW semantics, grades/options, marks, malformed-input rejection, or an independent receiver. No V03 gate is waived.
- **Next:** qualify a rights-reviewed industrial apparel receiver/profile from primary capability and rights evidence before fixture transfer. If stage attribution is still needed, require a new measurable pre-export geometry checkpoint; do not repeat the same export-format/unit/point-setting controls.
- Preserve V02 all-seven acceptance, legacy DXF behavior, protected byte identities, `0.001 cm` threshold, and physical/factory claim boundaries. No source, code, baseline or acceptance change occurred.

## Verification and slice record

- Board start replay: revision `3325→3327`; exit evidence/comment replay: `3327→3329`. G04-V03 stays In Progress.
- `npm run control-center:test`: 42/42 passed. Analyzer syntax/replay and `git diff --check` passed.
- No production code changed, so changed-code coverage and the full repository gate are not applicable to this evidence-only slice.
- Started `2026-10-08 23:23:21 UTC`; closed `2026-10-08 23:28:54 UTC` (5m33s): UI export/setup 2m35s; focused geometry/output review 1m10s; packet/board/focused verification 1m48s; agent waits 0m; maintainer-decision time 0m. No safe disjoint task existed for this coupled live UI/output comparison.
- S553 was reserved after S552 and is the next unique slice. Refreshed `origin/main` remains ancestor of the branch.

**Next boundary:** start a fresh uniquely numbered slice for primary-source receiver/profile qualification; do not transfer G04 fixtures until rights and local-handling evidence supports the exact selected receiver/build.
