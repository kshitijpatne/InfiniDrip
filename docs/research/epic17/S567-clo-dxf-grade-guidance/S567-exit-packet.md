# EPIC-17 / G04 V03 — CLO DXF grade guidance — Slice 567 exit

- Closed: 2026-10-09 03:25:30 UTC.
- Started: 2026-10-09 03:23:32 UTC at S566 commit `f2dd0ec` on
  `codex/epic-17-g04`.
- Refreshed `origin/main` was `a5af5e1`, an ancestor of start commit. Board
  start revision 3381; exit replay 3383→3385. G04-V03 remains In Progress.
- CLO remains open. This documentation review sent no UI input and performed
  no exchange.

## Official source findings

1. CLO's [Set Grading help page](https://support.clo3d.com/hc/en-us/articles/115015798567-Set-Grading),
   updated September 29, 2026, says Edit Grading selects a pattern outline or
   point to enter grade values. Its Set Options section says alignment can be
   by internal lines and graphics. It does not itself specify a per-point
   internal-line export rule.
2. In the CLO Help Center's [Internal lines follow grading thread](https://support.clo3d.com/hc/en-us/community/posts/4437185131417-Internal-lines-follow-grading?page=1),
   a CLO Designers staff reply dated February 22, 2022 says internal lines
   can be graded with Edit Grading by selecting their segment points and
   extending them to meet the grading edges. This is a direct CLO staff
   instruction, but it is not version-specific to 2026.1.310.
3. CLO's [2D Pattern DXF Import/Export page](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
   updated September 28, 2026, documents DXF-AAMA, DXF-ASTM and Standard DXF;
   one Size Group per file; graded information included in DXF or exported
   separately as a Rule File; and a swap option for cutting/sewing line
   interpretation. These menu descriptions do not claim that CLO preserves
   this product's source-point mapping or passes a round trip.
4. CLO's [DXF deformation guidance](https://support.clo3d.com/hc/en-us/articles/360042849934-The-patterns-are-deformed-when-I-import-my-DXF-file-into-CLO-How-can-I-fix-the-problem),
   updated August 24, 2024, warns that swapped CUT/SEW interpretation can
   deform outlines when a source contour is an open baseline rather than a
   closed outline. Our S565 source fixture has closed CUT and SEW contours;
   this guidance does not explain the measured base-shaped path.

## Pattern-specific mapping and proposed test

**Direct source fact (S562/S559):** waistband sewn-outline corners, ordered
from the upper-left around the contour, are:

| Size | Source SEW vertices (cm) |
|---|---|
| XS | `(59,70.5) (102,70.5) (102,67) (59,67)` |
| S | `(61,72) (106,72) (106,68.5) (61,68.5)` |
| M | `(63,73.5) (110,73.5) (110,70) (63,70)` |
| L | `(65,75) (114,75) (114,71.5) (65,71.5)` |
| XL | `(67,76.5) (118,76.5) (118,73) (67,73)` |

Each size step therefore moves the four corresponding SEW points by
`(+2,+1.5)`, `(+4,+1.5)`, `(+4,+1.5)`, and `(+2,+1.5)` cm respectively.
These are source-derived changes; they are not yet verified as CLO internal
line grading values in version 2026.1.310.

**S566 output fact:** in S/M/L/XL, a candidate path is within 0.000015 cm of
the XS source SEW contour after layout alignment, while every candidate fails
the corresponding larger-size source sew path at the unchanged 0.001 cm
threshold. This supports the diagnosis that the sew-shaped internal path
remained at base-size geometry while the CUT outline graded correctly. Output
layer IDs alone do not prove that path's semantic identity.

**Next practical test, conditional on a trustworthy CLO window observation:**
open the saved S565 corrected trial, select the four-segment internal path
that matches the XS sew contour, use Edit Grading on its four segment points,
and assign each size step the source-derived deltas above. Export once using
the existing DXF-ASTM / Graded Nest / centimeter / 100% / Do Not Rotate
profile into a new named C:-only slice folder, compare all five CUT and SEW
contours at 0.001 cm, then re-import and verify grade identity and rendered
behavior. If the path is not selectable as an internal line, stop that trial
and record the visible classification; do not substitute a CUT/SEW swap or
alter source geometry.

## Limits and gate disposition

- Documentation provides a specific, source-compatible grading action to
  test. It does not prove that the action is available on this saved CLO
  project, that its values survive DXF export, or that the exported numeric
  layer has the expected industrial semantics.
- The current CLO screenshot shows the base workspace while accessibility
  reports an `Export DXF` dialog. The discrepancy remains a real obstacle to
  inspecting/selecting the internal line safely. No UI action was attempted.
- S567 clears no V03 gate. The actual receiver, rights/profile, seven-recipe
  coverage, geometric and semantic fidelity, marks, malformed-input behavior,
  supported options, grading, and round-trip gates remain held as recorded.
  No format compatibility claim or product code/source change.
- Focused verification: official page dates and instructions recorded above;
  start/exit command preflight and replay validated; `git diff --check` passes.
  No production/test code changed; no test suite or full coverage gate was
  due.
- Timing estimate: official-source research and source-specific comparison
  1m30s; focused verification and durable closeout 30s; external-agent waits 0m;
  maintainer-decision time 0m.
- Next action: use this exact four-point test only when the CLO capture and
  accessibility state agree. Meanwhile proceed with other independently
  closable V03 evidence; do not reopen the question of product-development
  permission or local processing.
