# S695 — exact Polo source/return localization

## Pinning and reproduction

The candidate was regenerated from the current repository code using Polo,
`STANDARD_M`, size M, step 0, and the eight defaults in the package manifest.
The regenerated file is byte-identical to S694's submitted centimeter DXF:
SHA-256 `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`.
Its manifest revision is
`cc0e1c5f111b2485ffdc7fafac60820f654d6bd541620fff47af51e747a3846d`.
Thus the inspected receiver input is exactly the output of
`createDxfInterchangePackage` / `adaptiveSeamAllowance` at that source
revision, not a hand-edited substitute.

The source DXF contains closed `POLYLINE` CUT and SEW outlines; its planar
points are straight segment vertices (the exact transform inventory contains
no bulge group 42 or spline flag 75). The S694 import conversion changes only
units/scale and preserves entity type/order, layers, vertex count, closed
flags, layout and physical coordinates. The return was normalized to cm using
the already-verified S689 transform and compared at the fixed `0.001 cm`
limit, piece by piece.

## Findings

The return has nine CUT paths in its nine output blocks. The seven failing CUT
paths are:

| Piece | Submitted CUT vertices | Returned CUT vertices | Maximum distance | Source maximum |
|---|---:|---:|---:|---|
| Polo front | 531 | 380 | 0.001035292 cm | vertex 12 |
| Polo back | 448 | 341 | 0.002991975 cm | vertex 173 |
| Polo sleeve | 489 | 487 | 0.001491971 cm | vertex 240 |
| Outer stand | 751 | 414 | 0.011015115 cm | vertex 182 |
| Inner stand | 751 | 413 | 0.039767881 cm | vertex 182 |
| Upper collar | 763 | 424 | 0.011015117 cm | vertex 182 |
| Under collar | 763 | 424 | 0.011018607 cm | vertex 182 |

Both placket CUTs pass at `0.000004342 cm`; all nine SEW paths pass at
`0.000004906–0.000009242 cm`. This rules out a general unit/scale or whole-file
translation explanation for the measured losses. The 0.001 cm limit was not
changed.

On all four stand/collar pieces, source vertex 182 is the same mapped cubic
station: source edge `backCollar` on both stands and `backCollarBase` on both
collar leaves. It lies at `y=75.791 cm` in the packed DXF. Re-evaluating the
current recipe curve's one-centimeter normal offset puts the candidate vertex
within `0.000235–0.000319 cm` of that curve at `t=0.93468`, matching S692's
analytic cusp parameter `t=0.9346892443`. In the returned outlines, the nearest
segments are `0.011015–0.039768 cm` away; the inner stand is the largest miss.
These are direct calculations from the exact code, source, and return.

The measured conclusion is **receiver round-trip geometry loss for this exact
candidate and setting set**. The evidence does not identify CLO's internal
cause and does not justify changing our cut shape, segment density, or
threshold. Annotated crops of all seven source/return maxima are rendered in
`S695-localized-cut-overlay.png` (SHA-256
`d86ab2bebcc6e2efeb5178a03679cf91dd766a9bb44bd51e56d09dbefb51f022`). Exact
per-piece points, closest return segments, source-curve matches, and hashes
are in `S695-localization-report.json` under
`C:\G04-CAD-Interchange\S694-clo-candidate-cuts\S695-localization\`.

## Specific remaining CLO setting hypothesis

S694 imported with **Import Draw Curve Points enabled**. CLO's current
first-party [2D Pattern DXF Import/Export guide](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export)
documents curve-point optimization controls and says non-grading-point
removal is an AAMA-specific option; the separate older [CLO support answer for
incomplete DXF patterns](https://support.clo3d.com/hc/en-us/community/posts/4408039776281-PROBLEMS-TO-IMPORT-PATTERN-DXF)
recommends enabling “Import draw curve points.” Neither source defines this
checkbox's exact effect on this version's sampled, straight-segment candidate.
This does not establish the setting as the cause.

One controlled follow-up is justified because S694 tested only the enabled
setting and the error is specifically in densely sampled CUT curves. In S696,
import the same hash-pinned candidate with **only Import Draw Curve Points
unchecked**; keep receiver build, Standard DXF mode, millimeter/100% scale,
rotation, all other import/export settings, and source bytes fixed. Render and
measure the exact returned contours at `0.001 cm`, and check whether pieces or
marks disappear. If any CUT contour still fails, or any content is lost, stop
all CLO Standard route trials. Do not compensate the pattern or try another
setting/encoding. If it passes, it clears only this representative geometry
and mark gate; all remaining route/profile/identity/breadth/grade/negative/
repeatability/readability gates still apply.

## Classification

- **Directly encoded in source:** recipe roles and named cubic edges; selected
  option values and grade; adaptive true-normal offset implementation; closed
  linear CUT/SEW polyline entity form; fixed per-edge allowance.
- **Directly observed in receiver output:** returned block/path inventory,
  reduced CUT vertex counts, exact point-to-segment residuals, unchanged
  near-identical SEW controls, render differences, and the return's hashes.
- **Not established:** why the receiver transforms the imported polylines;
  whether disabling the one import checkbox prevents that transformation; any
  physical construction/fit effect or standards conformance.

No production source or pattern geometry changed.
