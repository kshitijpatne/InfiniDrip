# EPIC-17 / G04 V03 — Polo exact-linear spline probe — Slice 591 start

## Verified boundary and authority

- Start: `2026-10-09 07:27:04 UTC`; branch `codex/epic-17-g04`; starting
  commit `0ae63b191a8f021f65f33ea331164f27fb652eae` (S590).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. Working tree was clean before S591. Highest assigned slice was
  590; this is unique slice 591.
- Board revision 3479: EPIC-17 and G04-V03 In Progress; G04-V02 Done. CLO
  2026.1.310 remains open. The maintainer has confirmed written permission
  for product-development trial use and local processing; this is settled.
- All S591 input, output, project and rendered evidence files are confined to
  `C:\G04-CLO-DXF-Exchange\S591-polo-degree1-spline-probe\`.

## Scope and question

Map the exact five failing contour neighborhoods from the S536 source, S590
fillet derivative and S590 CLO export. Test one technically distinct
representation: encode only the five affected closed CUT contours as degree-1
DXF `SPLINE` entities whose control sequence follows every original source
vertex, including the closing point. A degree-1 piecewise-linear spline is
intended to trace the original polygon segments exactly; this preserves the
pattern's cut geometry while asking whether CLO retains these corners when
they are expressed as spline control points instead of POLYLINE vertices or a
bulge arc.

This is an exchange-only diagnostic, not a production-writer change or an
assumption that CLO's AAMA importer supports `SPLINE` outlines. Autodesk's DXF
reference defines spline degree, control points, knots, and flags, but does not
establish CLO or apparel-profile support. CLO's public DXF guide describes
formats and user options without specifying entity-level SPLINE outline
support. The practical import test will settle only this build/profile/fixture.

## Ordered work and stop conditions

1. Hash-check S536 source, S590 derivative and S590 export. Bind the five
   pieces using the retained SEW paths and list source, derivative and receiver
   vertices/segments at each residual. Record the actual vertex that S590
   output omits and the point-to-path distances; do not infer an internal CLO
   simplification cause.
2. Create a C:-only derivative changing only those five CUT entities from
   closed polylines to closed, planar, degree-1 SPLINE entities. Preserve
   source control coordinates, piece order, layers, SEW contours and other
   entities. Hash-pin and assert the exact entity delta.
3. Analytically prove the spline traces each source polygon segment exactly
   and conservatively check parsed control/knot structure. If the derivative
   cannot be verified below `0.001 cm`, stop without importing.
4. If preflight passes, perform at most one import, visual outline check, one
   export and geometry comparison in a clean CLO scene with the pinned S536
   settings. Keep CLO open. Stop if the spline is rejected, does not create
   the five expected garment pieces, or any unrelated contour changes. Do not
   re-import generation one unless all first-generation geometry gates pass.
5. Report only what the exact fixture establishes. A geometry pass would not
   clear all-seven coverage, identity, CUT/SEW semantics, marks, grading/options,
   malformed-input, detail-render or repeated-round-trip gates.

## Acceptance and non-goals

- Candidate source deviation: exact zero for the ideal degree-1 piecewise
  representation and below `0.001 cm` including file-coordinate precision.
- CLO round trip: all nine CUT and all nine SEW contours within the unchanged
  `0.001 cm` symmetric-distance threshold, with explicit per-piece association;
  all nine pieces must render in a useful saved snapshot.
- Every remaining V03 gate and the all-seven recipe requirement remain
  unchanged. No universal CLO/DXF claim, industrial AAMA conformance claim,
  source pattern/stitch change, generic or legacy writer change, protected
  export baseline movement, physical-fit, factory-acceptance or readiness
  claim.
- No independent delegation is safe: the exact entity rewrite, hash-pinned
  geometry proof, same-session UI exchange and output comparison are tightly
  coupled. Codex owns and reviews the complete fixture.

## Required verification and board

Hash-pinned fixture and output reports, entity-delta/source-bound preflight,
actual CLO result, rendered evidence, focused script syntax/assertions,
Control Center tests, board schema/CLI validation, `git diff --check`, and
durable context update. No production code is planned; no production-code
coverage gate is triggered. Run the full repository gate only on the settled
integrated Epic/PR candidate.

The validated start replay links `E-G04-S591-START` and a scope comment at
board revision `3479→3481`, preserving EPIC-17/G04-V03 In Progress and
G04-V02 Done.

## Primary technical references

- Autodesk, [SPLINE (DXF)](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm):
  defines degree, knot and control-point groups and the linear/planar flags.
- Autodesk, [POLYLINE (DXF)](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-DXF/files/GUID-ABF6B778-BE20-4B49-9B58-A94E64CEFFF3.htm)
  and [VERTEX (DXF)](https://help.autodesk.com/cloudhelp/2016/ENU/AutoCAD-DXF/files/GUID-0741E831-599E-4CBF-91E1-8ADBCFD6556D.htm):
  distinguish fit/spline vertex flags from an explicit geometry-retention
  guarantee; no CLO-specific outcome is inferred.
- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export):
  documents AAMA/ASTM/Standard settings but does not enumerate accepted DXF
  boundary entity types.

**Next:** after the recorded start replay, generate and preflight the exact
degree-1 SPLINE derivative before using the already-running CLO session.
