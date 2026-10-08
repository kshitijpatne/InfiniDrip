# EPIC-17 / G04 V03 — Slice 503 Polo import-option matrix exit

## Result

CLO 2026.1.310 (r58944) imported, rendered, and exported the same hash-pinned
Polo M fixture under all four planned AAMA/ASTM × Optimize All Curve Points
off/on combinations. Every import showed CLO's informational notice that seam
allowances were imported in Custom mode; all four rendered without an
additional dialog or import error. Every export used DXF-ASTM, Graded Nest,
centimeters at 100%, Do Not Rotate, Duplicate Notch on Seam Allowance checked,
and Optimize All Curve Points unchecked. The export profile was held constant
so the measured difference is attributable to the import choices.

The source SHA-256 was
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA` in every
analysis. All four outputs have nine source-SEW-to-CLO-block matches. Each
output reproduces the same five known CUT contour losses: back (33 source / 32
receiver vertices), outer collar stand (54 / 53), inner collar stand (54 / 53),
upper pointed collar (44 / 43), and under pointed collar (44 / 43). Sampled
source points measured to exact receiver segments give lower bounds of
`0.0101935–0.0111803 cm`, over ten times the unchanged `0.001 cm` gate. The
option matrix therefore does not clear Polo's cut-geometry round-trip gate.
AAMA versus ASTM produced byte-different DXFs but identical ordered geometry
for all 94 parsed output polylines at each optimizer setting.

Turning Optimize All Curve Points on affected four other output polylines in
button-placket block `3_M`: numeric layers `1`, `84`, `14`, and `87` changed
from 12 vertices to 8. Their bounds align with two source `MARK_BUTTON`
`CIRCLE`s centered at `(112.788, 67.742)` and `(112.788, 64.242)` cm, each
radius `0.15 cm`; no numeric layer semantics are inferred. The maximum
vertex-to-segment comparison lower bound between off/on loops is
`0.0096974 cm`. This is a separate, option-sensitive mark representation; it
did not alter the five failed CUT contours. It is recorded as receiver output
evidence, not as approval to change garment geometry or the product default.

## Exchange artifacts and rendered evidence

All source, exchange files, captures, and analysis outputs stayed under
`C:\G04-CLO-DXF-Exchange\S503-polo-import-options`. The source copy is
24,261 bytes with the expected S463 hash. Export outputs:

| Import | Optimize | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| DXF-AAMA | off | 221,643 | `694929062CED7A585C32DD0CAE50A887085E31E2E90742FBC2CB2CDA5B0C025A` |
| DXF-AAMA | on | 220,294 | `630195B57D63EC0D381F5CAD56B301B1D580FF35983C515E1DF9EEC4299E97C6` |
| DXF-ASTM | off | 221,643 | `F2EE29811C7D23442C0AFB23B40E2E69ED20EDF21745841CDF62F2FC9D292582` |
| DXF-ASTM | on | 220,294 | `5468BD3128ED4253B9AE15257474D997EBAFF42B348A33E60180C9DA4C6033D6` |

Per-cell import settings, the repeated Custom seam notice, full-workspace
renders, and fixed ASTM export settings are captured in `Evidence/`. The
ASTM/optimizer-on button-placket zoom is
`Evidence/astm-optimize-on-button-placket-zoom.jpg`. The four parsed reports
and comparison JSON are under `Evidence/Analysis/`; the comparison records each
output polyline's transformed coordinates. `analyze-s503-polo-matrix.mjs` and
`compare-s503-polo-matrix.mjs` reproduce the diagnostic reports from the C:
exchange outputs.

After testing, File → Quit was used and the temporary imported workspace was
not saved. The next `list_apps()` result reported CLO `running: false` and
`windows: []`; the app is closed.

## Gate disposition and limits

- **Failed, unchanged:** all four cells exceed the Polo CUT geometry limit on
the same five contours.
- **Observed option effect:** curve optimization reduces four button-mark
  loops from 12 to 8 vertices. Its receiver geometry is not identical to the
off setting; no DXF layer-to-manufacturing-semantics claim is made.
- **Unchanged:** all-seven recipe acceptance, protected export byte identities,
  rights and local-handling review, exact apparel-CAD profile proof, piece and
  mark semantics, grade relationship, independent receiver, negative-control
  rejection/reporting, and the `0.001 cm` gate. V03 and EPIC-17 remain In
  Progress; V01/V02 remain Done. No source or production code, fixture,
  threshold, profile claim, or acceptance rule changed.
- This is four controlled settings on Polo M in one CLO build. It does not
  establish general CLO behavior, format conformance, native grading, physical
  fit, factory acceptance, or production readiness.

## Verification and closeout

- Four live CLO import/render/export runs completed. The identical source hash
  was asserted by each geometry analyzer.
- Source/output parser verified 94 output polylines, nine SEW piece-block
  associations, the five CUT witnesses per cell, and full output geometry
  comparisons. Output analysis is diagnostic; only the exact continuous
  segment-distance witnesses are used as lower-bound failures against the
  `0.001 cm` gate.
- All four screenshot sets and the zoomed mark view were saved under the C:
  evidence root. CLO's normal close was verified by the app inventory.
- No production behavior or tests changed. The required closeout checks are
  the S463 fixture verifier, S503 analyzer syntax and four-cell replay,
  comparison replay, Control Center tests, exit board preflight/replay, and
  `git diff --check`. S463 fixture verification passed (6 positive, 1
  negative); all four S503 analyzer replays and pairwise comparison passed;
  Control Center passed 42/42; board exit preflight passed at revision 3129
  and validated replay advanced `3127→3129`; the final diff check passed. No
  global coverage/build gate applies to this
  evidence-only, nonreleaseable slice; retain those gates for the settled Epic
  candidate.
- No safe independent delegation exists for the stateful CLO matrix; Codex
  kept the UI run, source/output association, and review together.

Started `2026-10-08 15:11:57 UTC` from S502 `043dbb3` on
`codex/epic-17-g04`; refreshed `origin/main` was
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remained an ancestor. Board
start was `3125→3127`; exit replay is recorded in the S503 board command
packet. Total elapsed time through closeout was approximately 28m38s:
implementation `0m`; focused live CLO work `~16m`; geometry analysis `~5m`;
durable packet, board replay, and focused checks `~7m38s`; external-agent waits
`0m`; maintainer-decision time `0m`.

**Next:** begin S504 with a one-cell practical CLO `Standard DXF` import of the
same hash-pinned Polo M source, using the same units, scale, orientation,
notches, and export profile. This third format was visible in CLO's import
selector but outside S503's AAMA/ASTM matrix. Numerically compare its CUT and
mark geometry under the unchanged gates. Do not change source geometry,
profile rights claims, or acceptance to make it pass.
