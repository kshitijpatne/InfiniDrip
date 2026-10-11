# EPIC-17 / G04 V03 — Source grade-point topology map — Slice 562 exit

## Result

The product's digital grade geometry has a stable source-side point mapping
for every recipe/default size in the S559 cohort. For each of seven recipes
and XS/S/M/L/XL, piece-role order, piece identity, on-fold state, edge-name
and edge-kind sequence, named source points, and sampled sewing-outline
vertex sequence are stable. The sewn outline samples carry edge names in
source; their DXF SEW-layer vertex indices can therefore be derived without
guessing from the source edge graph.

The analysis regenerated all 35 existing S559 per-size exports. Every file's
SHA-256 matches the S559 manifest, and the ordered source sewing vertices map
exactly to the regenerated DXF's corresponding SEW polylines after the legacy
layout translation, Y flip, and 0.001 cm rounding. Protected export bytes
remain identical.

This closes **source-side point correspondence**, not grade interchange. The
DXF contains unnamed ordered vertices and no size/grade relationship; CLO
previously relabeled a one-size XS import as M. The computed data is product
default digital geometry, not an apparel industry grade standard or physical
fit evidence. The cut contour is allowance-expanded and is not the same
source-vertex path as the sewn outline. No grade semantics are inferred for
the CUT boundary.

## Exact evidence

- Analyzer: `analyze-source-grade-topology.mjs`.
- Full machine-readable evidence remains on C: at
  `C:\G04-CLO-DXF-Exchange\S562-grade-point-topology-map\source-grade-topology.json`.
  SHA-256: `1BBD78E07A17AB2F181E0DE7640565FBE5BF54654EADB333E7027EF8156BD69A`.
- The report records exact source file hashes, all recipe grade rules, all
  edge endpoint/control-point deltas from base M, each source-edge-labeled
  sewn outline sample and its per-size movement, regenerated DXF hashes, and
  the source-to-SEW-vertex correspondence result.
- Per default M pattern, the recipe totals are Tee 95, Fitted 98, Tank 64,
  Polo 309, Woven 176, Skirt 14, and Trouser 116 sewn-outline vertices. Those
  sample counts and the ordered named-edge mapping stay the same through all
  five sizes; the per-size coordinates change according to `gradeRun`.
- All 35 regenerated hashes match S559; all 35 source-to-SEW-path maps pass.
  There were zero topology exceptions in this cohort.

## Gate disposition

| Gate | S562 disposition |
|---|---|
| Source edge/vertex identity across sizes | **Pass, source only:** named role/piece/edge and sewn-sample path is deterministic across all seven default-size runs. |
| Existing DXF byte identity | **Pass:** all 35 fixture hashes match the S559 manifest exactly. |
| Source-to-DXF SEW vertex map | **Pass, legacy output only:** exact ordered coordinates for all 35 files under existing translation, Y-flip, and rounding. DXF does not preserve the source names. |
| Graded DXF / Rule File interchange | **Still held:** no size names or grade rules are encoded by the current writer; no standards-backed DXF-ASTM/Rule File representation has been emitted or round-tripped. |
| CLO practical exchange | Not attempted: the S561 screenshot/accessibility mismatch remains unresolved; no file action is safe while those views disagree. This is not a format failure. |
| Other V03 gates | Unchanged: Polo CUT contour, CUT/SEW semantics, marks, malformed input, supported options, all-seven round trip, and profile/right evidence remain as matrixed. |

## Verification, board, and time

The deterministic source analyzer passed across 35 generated files and all
7×5 source runs; its output is stored under the C:-only exchange folder.
`node --check` passed for the helper. The output hash and all regenerated DXF
hashes were checked. No source or test code changed and no full repository
gate was due. No independent low-risk task had disjoint ownership; agent waits
0m; maintainer decision time 0m. Board commands were preflighted and replayed
through the validated command layer, advancing 3361→3363→3365.

Started 2026-10-09 00:32:02 UTC from S561 `5dc8b34`; refreshed `origin/main`
must be rechecked before commit. At the S562 boundary (00:39:07 UTC), elapsed
time is 7m05s: source/topology analysis about 4m50s, focused verification
about 0m17s, durable closeout/board and final integrity check about 1m58s,
agent waits 0m, maintainer decisions 0m. Board start/exit revisions are
3361→3363→3365.

## Next action

Use this proven source-point mapping to prepare a reviewable, profile-backed
graded fixture only when a lawful exact DXF-ASTM representation or verified
current CLO API route is available and the visible/accessibility views agree.
Then run one real exchange and compare names, grade points, geometry and
rendered output. Keep all seven recipe, all V03 acceptance, legacy DXF, and
protected byte-identity gates unchanged. Do not claim physical fit, factory
acceptance, or production readiness.
