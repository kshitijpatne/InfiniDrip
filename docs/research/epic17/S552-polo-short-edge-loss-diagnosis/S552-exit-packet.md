# EPIC-17 / G04 V03 — Polo short-edge loss diagnosis — Slice 552 exit

## Finding

The same five Polo CUT contours lose the same source vertex in both S545 centimeter generations and S551's geometry-equivalent millimeter CLO exchange. Unit representation does not explain the loss. All remaining V03 holds stay in force.

## Exact source-to-output mapping

All coordinates below are source centimeters. The analyzer matched each contour by exact source ordinal and named receiver block, enumerated one-vertex deletions and cyclic/reversed correspondences, normalized millimeter output coordinates by 0.1, and required every retained coordinate to remain within the unchanged 0.001 cm gate. Full hash-pinned mapping is in `C:\G04-CLO-DXF-Exchange\S552-polo-short-edge-loss-diagnosis\polo-short-edge-mapping.json`.

| Source CUT ordinal / role | Receiver block; dropped source vertex | Source point (cm) | Incoming / outgoing (cm) | Turn | Dropped point to replacement chord | S545 gen1 / gen2 / S551 mm symmetric contour residual (cm) |
|---|---|---|---|---:|---:|---|
| 2 / back | `1_M`; index 13 | (37.489, 74.514) | 0.04562 / 1.24402 | 16.80° | 0.012736 | 0.01274073 / 0.01274635 / 0.01274155 |
| 10 / outer collar stand | `5_M`; index 14 | (139.277, 66.459) | 0.04652 / 9.40341 | 16.28° | 0.012983 | 0.01298255 / 0.01298255 / 0.01298757 |
| 12 / inner collar stand | `6_M`; index 14 | (156.921, 66.459) | 0.04696 / 9.40325 | 17.39° | 0.013970 | 0.01396952 / 0.01396952 / 0.01396927 |
| 14 / upper pointed collar | `7_M`; index 14 | (174.564, 66.459) | 0.04652 / 9.40341 | 16.28° | 0.012983 | 0.01298255 / 0.01298255 / 0.01298806 |
| 16 / under pointed collar | `8_M`; index 14 | (194.164, 66.459) | 0.04652 / 9.40341 | 16.28° | 0.012983 | 0.01298255 / 0.01298255 / 0.01298806 |

Each receiver block emitted one fewer vertex. For every row, the largest retained source-coordinate difference is at most 0.000038 cm in either cm generation and at most 0.000009 cm in the mm generation. CLO repeats closed paths on multiple numeric layers: these are receiver layers `8` and/or `1`; the DXF output does not establish CUT/SEW meaning from numeric layer alone. The S551 whole-file analysis finds the other 13/18 source contours pass; five fail, none are missing. Their residuals are 12.7–14.0 times the fixed gate.

These measurements establish the omitted source vertices and their relation to short incoming edges and 16–17° turns. They do not establish why CLO drops them.

## Official CLO evidence

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated 2026-09-28, describes import/export formats, units and options. It says curve-point optimization changes the point count and `Remove Non-Grading Points` deletes straight/curve points without grading information. It specifies no minimum edge-length rule or preservation guarantee for these five points.
- CLO Help Center, [Optimize All Curve Points](https://support.clo3d.com/hc/en-us/articles/115000527527-Optimize-All-Curve-Points), updated 2024-08-24, describes reducing curve points and warns that lower ratios may deviate from original curvature. S503/S516 already compared the import optimizer on/off; both retained the failure.
- CLO Help Center, [Delete All Overlapping Points](https://support.clo3d.com/hc/en-us/articles/115002272547-Delete-All-Overlapping-Points), updated 2026-09-21, describes a manual cleanup for two points closer than CLO's minimum distance when imported patterns cannot be edited or moved. This is not documentation that the AAMA importer/exporter automatically removes these five corners, nor does it promise to preserve them.
- Existing S519 tested `Import Draw Curve Points` on with all other settings fixed; the same five contours failed. S522 already screened the documented options and found no new safe retention switch. Do not repeat these same setting trials. `Remove Non-Grading Points` explicitly deletes points and is not a justified remedy.

## What this means and next action

**Established:** CLO 2026.1.310 (r58944), DXF-AAMA, M/default, and the recorded settings produced the same five above-gate failures across two cm generations and one mm generation. The mm output is not a new cause and does not clear V03. No format error appeared and major pieces rendered, but that does not pass contour fidelity.

**Still unknown:** whether the first omission occurs during import, internal save, or DXF export. S518 saved a pre-export `.zprj`, but its proprietary garment payload exposed no measurable contour records; no exact native-geometry checkpoint exists. The official help pages do not document an applicable threshold or fix.

**Recommended next step:** stop repeating CLO point-setting/unit cycles for this fixture. Resume V03 candidate work by qualifying a rights-reviewed industrial apparel receiver/profile using primary evidence, then use it against the hash-pinned seven-recipe fixtures. If stage attribution becomes necessary, require a genuinely measurable pre-export geometry checkpoint before any further CLO cycle. Keep the exact industrial-profile, semantics, marks, grading/options, malformed-input rejection, two-generation round-trip, all-seven coverage and 0.001 cm gates unchanged.

## Scope and gates

- Read-only source/output comparison and official-help review only. No source or view geometry, stitch graph, production code, export baseline, or acceptance threshold changed.
- Confirmed maintainer authorization for CLO product-development evaluation and local processing is recorded in `docs/PROJECT-DECISIONS.md`. All trial files stay under `C:\G04-CLO-DXF-Exchange\<named-slice-folder>`; CLO stays open for admitted work.
- No physical-fit, factory-acceptance, or production-readiness claim. G04-V03 remains In Progress; V01/V02 remain Done; no V03 gates were cleared by this diagnostic.

## Durable evidence and verification

- Analyzer: `analyze-cross-run-mapping.mjs`; `node --check` passed and replay passed all five expected block/index matches and retained-coordinate assertions.
- C:-only report: `C:\G04-CLO-DXF-Exchange\S552-polo-short-edge-loss-diagnosis\polo-short-edge-mapping.json`.
- Inputs were hash-pinned in the report: source `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`; S545 gen1 `cac8d2d90a7b72bfebcf9bedbef7c1c91e3558c3386423f833e080c283bb0470`; S545 gen2 `ae3731633a396cc94911dfe7ee53cd0dc85e847a04420a0c6e985b8cf57c1241`; S551 mm export `864cbc16df325c041ac3b1acea16e660f9056ef5cc78a7140852adbaf2242b17`. The report SHA-256 is `92a5ca1013e8cce90614840024105b9bc2ce6881678d3a8d3bb8d0d68f85981f`.
- `npm run control-center:test` passes 42/42; `git diff --check` passes.
- No production code changed; changed-code coverage/full repository gate is not applicable to this evidence-only slice.
- Board start replay advanced revision 3321→3323; validated exit evidence/comment advance it 3323→3325. G04-V03 remains In Progress.
- Started 2026-10-08 23:17:32 UTC; exited 2026-10-08 23:21:36 UTC (4m04s): analysis and source review 2m25s; durable record/board/focused verification 1m39s; external-agent waits 0m; maintainer-decision time 0m. No safe disjoint delegation existed for this coupled exact-file comparison.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of S551. S552 is the next unique slice after S551.

**Next boundary:** reserve a fresh unique slice to qualify a concrete rights-reviewed industrial apparel CAD receiver/profile candidate against primary capability and rights evidence before any fixture transfer.

