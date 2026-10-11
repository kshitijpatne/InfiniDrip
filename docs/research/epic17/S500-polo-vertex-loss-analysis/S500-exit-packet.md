# EPIC-17 / G04 V03 — Slice 500 Polo contour-loss geometry diagnosis

## Findings

Hash-pinned parsing of the existing S498 Polo M source and both CLO outputs
shows each failing CUT contour lost exactly one source vertex. The same source
vertex index is absent in both output generations, and every remaining source
vertex matches in order within `0.000013–0.000038 cm`. The removed source
point's distance from the straight chord joining its retained neighbors is
`0.012736–0.013970 cm`; local direction change is `16.2845–17.3922°`. These
points are not collinear cleanup. The observed contour change is over 12× the
fixed `0.001 cm` C04 threshold. S498's independent exact-segment witnesses
also exceed the gate (`0.01019–0.01119 cm`).

| Piece / CLO block | Source point (cm) | Source vertex index | Chord residual | Direction change | Gen 1 output layer | Gen 2 output layer |
|---|---:|---:|---:|---:|---:|---:|
| Back / `1_M` | `(37.489, 74.514)` | 13 | 0.012736 cm | 16.7985° | `8` | `1` |
| Outer collar stand / `5_M` | `(139.277, 66.459)` | 14 | 0.012983 cm | 16.2845° | `8` | `8` |
| Inner collar stand / `6_M` | `(156.921, 66.459)` | 14 | 0.013970 cm | 17.3922° | `8` | `8` |
| Upper pointed collar / `7_M` | `(174.564, 66.459)` | 14 | 0.012983 cm | 16.2845° | `1` | `1` |
| Under pointed collar / `8_M` | `(194.164, 66.459)` | 14 | 0.012983 cm | 16.2845° | `8` | `8` |

The four collar-family removals occur at the same local source point translated
across the piece layout. Gen 1/2 retain all other vertices within the 0.001 cm
gate, which localizes the discrepancy. Numeric layer IDs differ for the back
candidate and are not interpreted as semantic layer identity. The rendered
overlay shows the source outline with the omitted vertex and replacement
chord in red, over the two CLO outputs:
`S500-vertex-loss-overlays.png` (source file:
`S500-vertex-loss-overlays.svg`). The five rows show the point is on a curved
turn rather than a redundant straight run.
Overlay legend: solid black is the source, blue dashed is generation 1, green
dashed is generation 2, and red marks the omitted point plus replacement chord.

After S499's inaccessible startup window was recorded, a single graceful
Windows `CloseMainWindow` request was sent to the exact CLO executable. It was
accepted and the process exited; the app is now closed.

## Conclusion and limits

**Established by direct coordinates:** CLO output in both captured generations
omits the same one vertex on each piece; the resulting polyline geometry
differs from the exact source by more than tolerance. The loss is repeatable
across generations and localized to these source points.

**Not established:** whether CLO's AAMA/ASTM import mode, another hidden import
setting, its export path, or internal point optimization causes the change.
S499's setting matrix did not run because the app's startup window became
untargetable. S500 therefore does not claim an exporter defect or propose a
production workaround. In particular, no alteration of garment source
geometry, coordinates, tolerance, or output baseline is authorized.

V03 remains In Progress. Preserve Polo M's five contour failures, malformed
negative-input failure, and all rights/local-handling, industrial-profile,
layer/mark, native-grade, independent-receiver, all-recipe and round-trip
gates. Do not claim AAMA/ASTM compatibility, physical fit, factory acceptance
or production readiness.

## Methods and verification

`analyze-polo-point-loss.mjs` asserts input byte counts and SHA-256 for source,
generation 1 and generation 2; associates the five source CUT ordinals to
S498's exact CLO blocks; checks each possible one-vertex deletion under cyclic
and reverse traversal; requires a unique best retained-vertex match below
0.001 cm in each generation; and asserts the same source index was removed
twice. Its report is `S500-vertex-loss-analysis.json`. The companion SVG was
rendered in headless Chromium and visually inspected; the first full-page
screenshot timed out while waiting for browser capture, then a viewport render
from inline SVG succeeded. No source/receiver file was modified.

Board start/exit revisions `3107→3109→3113`; EPIC-17/G04-V03 remain In Progress,
V01/V02 Done. `npm run control-center:test` and `git diff --check` pass. No
production code changed, so global coverage/build/browser/output gates are
reserved for the settled Epic candidate.

Elapsed estimate (`14:56:43–15:02:29 UTC`): implementation `0m`; focused
geometry analysis and rendered review `3m`; durable packet/board and focused
verification `2m`; external-agent waits `0m`; maintainer-decision time `0m`.

**Next:** use the exact localized point evidence in a changed-state CLO import
option trial when the app exposes a responsive window. Test one variable at a
time and compare those five point neighborhoods at the unchanged tolerance.
If the UI remains unavailable, continue only with independent evidence work;
do not guess at or ship a workaround.
