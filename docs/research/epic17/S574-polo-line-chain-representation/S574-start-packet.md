# EPIC-17 / G04 V03 — Polo R12 line-chain representation probe — Slice 574 start

- Started: 2026-10-09 04:11:27 UTC.
- Branch: `codex/epic-17-g04`.
- Start commit: `52b0adec7d4ce984099c59aef2d0667d141032c1` (S573).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Start board revision: 3409; V01/V02 Done; G04-V03 In Progress.
- Highest assigned slice: 573; this reserves unique S574.

## Hypothesis and scope

Run one evidence-led CLO 2026.1.310 / DXF-AAMA diagnostic on the exact
hash-pinned Polo M fixture. The current exporter uses closed R12 `POLYLINE`
entities; a geometry-identical R2000 `LWPOLYLINE` derivative already lost the
same five CUT vertices. This test asks whether CLO assembles exact, contiguous
R12 `LINE` segments into closed cut outlines without simplifying those
vertices. It is one representation change, not an assumed fix or an AAMA
conformance claim. If the DXF-AAMA importer does not reconstruct closed
pieces, stop after the first import; do not export malformed/open outlines.

The diagnostic derivative must preserve every original coordinate, contour
closure, layer, label and non-CUT entity. Only the CUT polyline entity type
changes to an explicit closed chain of LINE records. Compare the actual CLO
output at the unchanged 0.001 cm threshold against the source fixture, inspect
the rendered import and first-generation output, and continue to generation
two only if generation one passes geometry and renders as closed pieces.

## Representation basis and limit

Autodesk's DXF reference defines `LINE` entities with explicit start and end
points and defines the closed flag for `POLYLINE` separately. This supports
encoding each existing straight source segment as one line with the same
endpoints; it does not establish how CLO's apparel importer joins adjacent
lines, assigns piece identity, or conforms to DXF-AAMA. The CLO result remains
an empirical diagnostic. References: [Autodesk LINE (DXF)](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-DXF/files/GUID-FCEF5726-53AE-4C43-B4EA-C84EB8686A66.htm)
and [Autodesk POLYLINE (DXF)](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-ABF6B778-BE20-4B49-9B58-A94E64CEFFF3.htm).

## Acceptance and holds

- Pass this representation probe only if CLO renders the expected nine pieces
  as closed cut shapes and all 18 source contours, identities, marks and
  geometry pass the applicable measured checks; geometry tolerance remains
  0.001 cm.
- A geometry-only pass does not prove layer/mark semantics, sizes/grades,
  malformed-input rejection, all-seven recipe coverage, or exact AAMA
  conformance. Keep V03 open until every admitted criterion passes.
- No production source, legacy DXF writer, export identity, source geometry,
  tolerance, profile/acceptance scope, or baseline changes. All exchanged or
  saved app files remain under
  `C:\G04-CLO-DXF-Exchange\S574-polo-line-chain-representation`.
- Preserve the open CLO session. Save a pre-test project copy inside the
  named folder; import and export locally. No cloud transfer or app restart.

## Ownership and verification

Codex owns the diagnostic encoder/analyzer, current-session CLO interaction,
render/output review, packet, and board. The shared live CLO session and one
source-to-output mapping make parallel ownership unsafe. Create DXF input,
output, project copy and analysis only under the named C: folder. Run focused
helper checks, `npm run control-center:test`, and `git diff --check` at exit.
No production-code coverage/full-repository gate is due unless production
source or tests change.

## Required evidence

Record the input/derivative/project/output hashes; prove the derivative changes
only target CUT entity encoding and preserves coordinate sequences; record
visible CLO format notices/errors/settings; inspect actual rendered output;
measure all contours against source at 0.001 cm; report generation-one and,
only if warranted, generation-two results. Keep export compatibility claims
fail-closed and CLO open.
