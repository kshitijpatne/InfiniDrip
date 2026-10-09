# Official CLO DXF help review — S610

Reviewed 2026-10-09: [CLO 2D Pattern (DXF) Import/Export help](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), last updated by CLO on 2026-09-28.

The help documents a user-selected input mode (Standard DXF / AAMA / ASTM),
separate AAMA-only removal of non-grading points, input curve-point
optimization, and export curve-point optimization. It also documents that
DXF seam allowances are automatically converted to locked Custom Seam
Allowance in CLO 2026.1. On export, AAMA, ASTM and Standard DXF are selectable;
grading can be embedded or supplied separately as a Rule File, and one size
group can be exported per file.

S609 recorded input curve optimization, removal of non-grading points, and
export curve optimization as **off**. The file's seam allowances were read in
Custom mode, but prior S536 evidence used a geometry-identical source variant
with no seam allowances and showed the same five missing-vertex CUT roles.
That weakens seam-allowance conversion as a sufficient explanation, but does
not isolate import, internal normalization, or export.

The official article explains what these controls do; it does not say which
one-vertex changes S536/S609 show, identify numeric layer roles in these
outputs, or guarantee preservation at the `0.001 cm` gate. Re-running the same
round trip with the existing point-optimization controls changed has no
source-backed expectation of a pass; do not do it as a guess. The one-size-
group export detail also means that a future multi-size acceptance fixture
must record each selected size group and whether grade rules are embedded.

## Evidence classes

- **Directly measured:** S609 source/output hashes, the five CUT piece roles,
  vertex-count differences, source sample coordinates and measured distance
  are in `C:\G04-CLO-DXF-Exchange\S610-astm-vertex-loss-source-diagnosis\Evidence\s610-vertex-loss-comparison.json`.
- **Prior directly measured:** S536's R2000 LWPOLYLINE diagnostic source and
  AAMA export showed the same five CUT roles with one fewer vertex; its
  source-reported residuals were `0.012741–0.013974 cm`.
- **Documented by CLO:** selectable format modes, optimization controls,
  custom seam-allowance behavior and one-size-group export described above.
- **Still inference / unknown:** the exact CLO stage and internal reason for
  losing the vertex. Neither the UI notice nor public help establishes it.
