# EPIC-17 / G04 V03 — Standard DXF import-mode follow-up — Slice 614 start

## Verified boundary and timing

- Formal closeout slice starts 2026-10-09 12:03:51 UTC on
  `codex/epic-17-g04` at `1f633603c035c6f53331857c59a03838e2d5ed08`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; repository tree was clean. S613 is the highest assigned slice;
  S614 is the next unique number. Canonical board is revision 3586; EPIC-17
  and G04-V03 remain In Progress; G04-V02 is Done.
- The planned practical interaction was executed earlier in this turn after
  live native CLO controls became available, before this S614 packet was
  written. This packet records that chronology explicitly and bounds the
  remaining work to analysis, rendered-output review and durable closeout.
- CLO 2026.1.310 (r58944) is left open. Before resetting the app scene, the
  existing S603 disposable project was saved as
  `C:\G04-CLO-DXF-Exchange\S614-standard-dxf-import-mode\Evidence\session-recovery.zprj`
  (SHA-256 `728bb4f57006ec8f691c6d76834b18ba8280b73f7f2358042e52b4275c603011`).
  The exact original source was copied into S614 `Input` and re-hash-verified
  against S536/S609 at
  `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
- Maintainer has writtenly authorized this CLO product-development test and
  local-only processing. All newly saved/imported/exported test material is
  restricted to the named S614 folder on C:. No external transfer occurred.

## Objective and controlled method

Determine whether replacing S609's DXF-AAMA input mode with CLO's
`Standard DXF` mode changes the known short-edge CUT loss, while holding the
same hash-pinned Polo M source, units, scale, rotation, grain, notch and
curve-point options, CLO build, and DXF-ASTM / Graded Nest export settings.
The actual S614 sequence was:

1. Opened a blank disposable CLO scene and imported the staged
   `Input/polo-standard-m.dxf` as Standard DXF, centimeters, 100%, no rotation,
   maintain original grain angle; pattern annotations/auto-trace/swap/auto-
   distribute/curve optimization/remove-non-grading-points off; import notch
   Both at Ratio position; import draw curve points on.
2. Exported once to `Output/polo-m-standard-input-astm-output.dxf` using
   DXF-ASTM, Graded Nest, centimeter, 100%, Do Not Rotate; grading and seam
   allowance included; duplicate notch on seam allowance on; other export
   options off. Output SHA-256 is
   `e4fb13c77ac92f572a632ce875f3304627ab729ed362c99579c619a09c867534`.
3. Reimported that exact output using DXF-ASTM, centimeter, 100%, Do Not Rotate,
   Maintain Original grain; the same notch and curve-point options as S609.
   CLO showed its informational notice that seam allowances were imported in
   Custom mode to preserve original shape; it did not show a format error.
   Nine pieces rendered. A CLO-native one-page 2D PDF snapshot was saved as
   `Evidence/polo-m-standard-dxf-astm-reimport-render.pdf`, SHA-256
   `47b0e783118441a252ff71eb396c056d0ffa8d076eda7b34dc6d50d4d4f2d5b8`.

The single changed experimental variable is input selector Standard DXF vs
S609's AAMA. Source geometry, product behavior, grading, thresholds, protected
export identities and V03 acceptance remain unchanged. The source-bound
analyzer will compare all nine CUT and nine SEW contours against the exact
source at `0.001 cm`, inspect piece blocks and output layers without inferring
their manufacturing meanings, and compare the CUT residual pattern with S609.

## Gates, non-goals, and stop conditions

- This is diagnostic evidence for one Polo M fixture and one CLO build; a
  successful menu operation or AC1009 header does not qualify an industrial
  profile, prove a normative ASTM edition, or clear V03.
- Keep all-seven-recipe acceptance, every geometry/identity/semantics/marks/
  grading/option/malformed-input/repeated-round-trip gate, V02-before-V03,
  legacy DXF behavior, protected export byte identities, and all holds intact.
- No source repair, geometry adaptation, threshold relaxation, product-code
  change, alternate trial, hosted transfer, physical sample, factory claim, or
  production-readiness claim is in scope.
- Stop interpretation at evidence: report exactly which contours pass and
  fail and whether the same five short-corner omissions persist. If export
  geometry is malformed or piece association is ambiguous, keep the V03 hold.

## Verification and ownership

- Codex owns the experiment, analyzer adaptation, rendered PDF review, board
  validation and final evidence. No safe disjoint ownership split exists; no
  external-agent wait is planned.
- Run the adapted source-bound analyzer against hash-pinned S614 C: files,
  render and inspect the CLO PDF, run its preflight and the focused Control
  Center suite, replay board commands only through the validated command layer,
  and run `git diff --check`. No production source/test code changes, so
  changed-code coverage is not applicable. Full repository gates remain for
  the settled Epic/PR candidate.
- Elapsed app exchange work occurred before formal S614 packet creation in
  this turn; record closeout timing separately for post-packet analysis,
  focused verification, external-agent waits and maintainer-decision time.

## Single next action

Run the S614 adapted source-bound analyzer and inspect the rendered PDF page;
then write the S614 exit packet, update project state and current V03 matrix,
and close the board slice with validated exit commands. Keep all V03 criteria
open pending the remaining independent profile and all-seven evidence.
