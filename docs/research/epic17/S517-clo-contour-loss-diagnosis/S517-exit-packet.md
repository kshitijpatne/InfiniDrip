# EPIC-17 / G04 V03 — CLO contour-loss diagnosis — Slice 517 exit

## Finding

The five S516 failures are each one localized CUT-outline point removed from
the receiver candidate, followed by a shortcut segment between its neighbors.
For the back, source vertex 13 `(37.489, 74.514)` is 0.0127407 cm from that
shortcut; the next-farthest source vertex is only 0.0000136 cm from the
receiver. On the outer stand, inner stand, upper collar, and under collar,
source vertex 14 at y `66.459 cm` is respectively 0.0129774, 0.0139742,
0.0129902, and 0.0129989 cm from the shortcut. All other source vertices on
those contours are within 0.000024 cm of a receiver vertex. Vertex counts are
33→32, 54→53, 54→53, 44→43, and 44→43. The exact source neighbors and receiver
shortcut endpoints are included in the JSON artifact.

Source coordinates use three decimal places; receiver coordinates retain up
to six. The re-imported file has nine identity-scale, zero-rotation inserts,
and the recorded CLO import was centimeters at 100%. The remaining matches
are within the 0.001 cm gate, while one source vertex in each contour misses
by roughly 13–14 times that gate. This supports a localized point-drop or
smoothing signature, not a global scale or coordinate-precision explanation.

**Stage attribution remains unresolved.** S516 did not save the in-memory CLO
geometry before exporting. Its source-to-output bytes include both import and
export transformations, so they cannot prove whether CLO simplified the
point on import or on export. S503 varied AAMA/ASTM import and Optimize All
Curve Points on/off while exporting ASTM; the same five CUT contours failed
in every cell. S516 exported AAMA and reproduced them. These trials show the
loss is stable across those tested settings, but do not identify its internal
stage or establish a fix.

## Evidence and verification

- Reproducible diagnostic: `analyze-s516-contour-loss.mjs`. It parses only the
  S516 source/output files under
  `C:\\G04-CLO-DXF-Exchange\\S516-clo-aama-roundtrip\\`, binds each source
  contour to the already-established block/layer/vertex-count receiver, and
  samples source segments at no more than 0.005 cm against exact receiver
  segments. It asserts both pinned file hashes before writing results.
- JSON result:
  `C:\\G04-CLO-DXF-Exchange\\S516-clo-aama-roundtrip\\Evidence\\Analysis\\s517-contour-loss-detail.json`.
  Source SHA-256 is
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`; AAMA
  output SHA-256 is
  `bb5d4d572f51cb30eeb9ef983c3d600757117f8a9c0863a1146b33409ce55ed1`.
- Analyzer replay succeeded for all five mapped paths. Control Center tests
  pass 42/42; board preflight/replay and diff checks pass. No product code,
  fixture, threshold, protected export baseline, or V03 acceptance changed.
- No CLO UI action or duplicate export was needed for this diagnosis. CLO
  remains open and idle, as requested.

## Exit gates and next action

- V03 remains **In Progress**. These results diagnose the geometry but do not
  clear fidelity, all-seven, grading, marks/layers, negative-control, rights,
  exact industrial profile, or generation-two round-trip gates.
- The next useful single experiment is a cause-isolation import: import the
  same pinned file once, save a CLO native project immediately before DXF
  export, then export once and compare whichever exact outline records the
  native project exposes against the input. If the native project does not
  expose measurable outlines, stop that branch and record the boundary; do
  not repeat the import/export matrix. This determines whether a later fix
  should target import handling or export encoding. Preserve every current
  acceptance and export-identity gate.
- No independent low-risk ownership split exists for this narrow paired-file
  geometry analysis; Codex retained ownership.

Started `2026-10-08 18:17:16 UTC` from S516 `890e09a8058db7b23181212ed145addf3f466283`;
refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
ancestor. Board start/exit is `3179→3181→3183`. Total elapsed closeout time was
approximately 6m30s: geometry parsing and evidence synthesis `~3m`; focused
analysis/board/tests `~1m`; durable packet/state/board review `~2m30s`; external
agent waits `0m`; maintainer-decision time `0m`.
