# EPIC-17 / G04 V03 — CLO lightweight-polyline CUT import — Slice 635 start

## Verified boundary and admission

- Started `2026-10-09 19:29:40 UTC` after committed S634
  `10ed333ecb8323e7a3b1cb2a381e3c0a414af4eb` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S634 is highest; S635 is reserved. Worktree is clean. The
  canonical board is revision 3680: V01/V02 Done; V03/EPIC-17 In Progress.
- The current admitted V03 gate is still failing on the five Polo M CUT
  contours. S634 ties each omission to a product allowance sample and shows a
  small source CUT segment. Standard versus ASTM import produced the same
  loss, so S635 varies only the DXF entity encoding while preserving source
  coordinates and every other entity.
- CLO 2026.1.310 product-development and local-file-processing authorization
  is already recorded. Use the existing CLO session; do not restart or close
  it. Keep all experimental CAD, scripts, CLO project/render files, and any
  exported DXF only under
  `C:\G04-CLO-DXF-Exchange\S635-cut-lwpolyline-import\`.

## Objective and controlled variable

Create a disposable derivative of the hash-pinned S617 cm-header Polo M
fixture. Convert exactly the nine closed `CUT` entities from classic
`POLYLINE`/`VERTEX`/`SEQEND` sequences to coordinate-identical
`LWPOLYLINE` entities. Keep entity order, point order, every 3-decimal X/Y
coordinate, closure, layer name, SEW polylines, marks, header/version, units,
and all other group values unchanged. No bulges or width values are added.
Verify that all nine CUT coordinate arrays are exactly identical before CLO
import. LWPOLYLINE is an R13/R2000-era entity; this test makes no standards
conformance claim.

Import the disposable derivative through CLO **Standard DXF** using the exact
S617 Standard import settings: centimeters, 100%, Do Not Rotate, and the
documented grading, notch, curve-point, curve-optimization,
remove-non-grading-point, and seam-allowance choices. Change no unrelated
setting. First compare the imported/native contours and nine piece identities
against the original source at the unchanged `0.001 cm` gate. Inspect the
actual CLO window and a usable rendered crop of every affected contour.

- If any of the five named CUT points is still omitted, if any passing control
  regresses, if a piece is missing/duplicated, or if a UI error/modal/settings
  mismatch occurs, stop before export. Record the concrete result; do not
  change settings or pattern geometry.
- Only if all nine native CUT contours and identities pass may this slice
  continue to one export and one reimport under the already recorded S617
  Standard-import / DXF-ASTM Graded-Nest export settings. That conditional
  branch does not waive the separate V03 marks, profile, rights, options,
  grade, malformed-input, repeatability, or detailed-readability gates.

## Evidence, verification, and non-goals

- Preflight pins the source and derivative, verifies exact CUT coordinates,
  asserts precisely nine CUT entity-type changes, and proves non-CUT entities
  and all remaining coordinates unchanged before opening CLO.
- If native contour inspection proceeds, reuse the proven S619 read-only
  `pattern_api.GetPatternCount`, `GetPatternPieceName`, and
  `GetPatternInputInformation` approach. Treat CLO's API shape labels as
  opaque; establish source correspondence geometrically and by piece identity.
  Save any query result, screenshots, CLO project, and rendered crops only in
  the named S635 C: evidence folder. Hash-pin each input/output artifact.
- Focused gates: converter/preflight syntax and assertions, output-bound
  contour analyzer, validated board replay, `npm run control-center:test`,
  and `git diff --check`. No production code or source geometry change is
  allowed; changed-production-code coverage is not applicable. Full repository
  tests/100% coverage, build, integrated browser/output review, PR, safe merge,
  origin ancestry and required deployment stay at the settled Epic candidate.
- No export is made after a failed native import gate. No DXF mode permutation,
  altered units, scaling, tolerance, vertex deletion, stitch/POM/mark changes,
  baseline move, acceptance/status change, hold release, profile/conformance
  claim, physical sampling, supplier contact, spending, hosting, or production-
  readiness claim. No safe independent delegation exists for one stateful CLO
  import and its source-bound native geometry check; Codex owns it.

## Single next action

Build and preflight one C:-only, coordinate-preserving CUT
POLYLINE-to-LWPOLYLINE derivative, then use the currently open CLO application
for exactly one Standard-DXF import and inspect the native contours before any
export decision.
