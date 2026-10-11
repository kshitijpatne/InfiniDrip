# EPIC-17 / G04 V03 — Polo SPLINE semantics audit — Slice 594 start

## Verified start and authority

- Started `2026-10-09 08:14:48 UTC` on `codex/epic-17-g04` from committed
  S593 `42317d233677d4d2fae10b494f12feeb2cf73f4c`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  Slice 593 is the highest assigned number; S594 is reserved uniquely.
- Canonical Control Center board is revision `3500`: EPIC-17 and G04-V03
  remain In Progress; G04-V02 remains Done. The S593 exit and current V03
  matrix are linked from `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, and the
  admission history.
- The maintained goal is active and matches the admitted Epic through final
  review, required gates and safe merge. The maintainer's written permission
  for this product-development trial and local file processing is settled.
  CLO remains open; S594 performs no application interaction and stores no
  exchange file outside `C:\G04-CLO-DXF-Exchange\`.

## Question and scope

S591 encoded five Polo M CUT corners as degree-1 SPLINE entities with group-70
value 25 (closed + planar + linear) and repeated the first source vertex as
the final control point. S592 changed only group 70 from 25 to 24, preserving
the coordinates, knot sequence and control points. CLO 2026.1.310 rendered
both trials, but the five target CUT contours still failed the unchanged
`0.001 cm` source-to-round-trip gate. S593 found no alternate passing closed
CUT path in the bound output blocks.

S594 answers one bounded question before any other receiver trial: do the exact
S591/S592 entities conform to Autodesk's published SPLINE field semantics,
and does an independent implementation of the degree-1 B-spline evaluate to
the original piecewise-linear source contours? Distinguish (1) directly
encoded values, (2) what the primary DXF/API documentation establishes, and
(3) independently calculated geometry. The audit must not attribute CLO's
output discrepancy to an internal cause.

## Method and exit gates

1. Hash-check the original S536 Polo M DXF, the S591 derivative and source
   preflight, plus the S592 derivative and preflight against their recorded
   hashes. Locate the five target SPLINE records by their exact source record
   correspondence, not by receiver layer labels.
2. Record group 70 bit decomposition, degree, knot and control-point counts,
   actual knot arrays, weights/fit points, endpoint controls, plane normal,
   tolerances and exact raw decimal controls for all five entities in both
   variants.
3. Independently evaluate the nonrational degree-1 B-splines with the pinned
   knot vectors using an explicit de Boor implementation. Compare each open
   parameter span against its expected adjacent source polyline edge; compare
   the final span to the final source vertex→first-vertex edge. Record maximum
   coordinate residual, endpoint closure and whether group-70's closed bit
   changes the evaluated curve. Keep the method reproducible with a small
   repository script and machine-readable C:-only report.
4. Compare observations with primary Autodesk SPLINE DXF reference and
   Autodesk API definitions of closed versus periodic splines. Link sources
   and state what they do and do not establish about CLO.
5. Conclude whether S591/S592 already use source-exact documented semantics.
   If they do, reject further flag-only SPLINE experiments absent a different
   specific representation hypothesis; preserve the measured Polo hold and
   continue with the next V03 dependency. If they do not, specify the single
   source-exact correction and its preflight, without applying it in this
   slice.

## Non-goals and preserved gates

- No CLO UI operation, input/output file generation, format trial, pattern or
  product-source edit, geometry/stitch-graph change, legacy writer change,
  protected export baseline update, or production implementation.
- Do not reinterpret numeric layers as CUT/SEW semantics. Do not change V02,
  all-seven acceptance, the `0.001 cm` geometry gate, exact profile/right
  review, identity, mark, grade/options, malformed-input, detail or repeated
  round-trip criteria.
- No industrial conformance, universal interoperability, physical fit,
  factory acceptance or production-readiness claim.

## Focused verification and ownership

Codex owns the hash-pinned analysis, DXF curve evaluator, technical source
review, rendered-evidence reuse and integrated review. No safe disjoint task
was found to delegate. Verify script syntax and deterministic report hashes,
source references, canonical board replay, `npm run control-center:test`, and
`git diff --check`. No production-code coverage/build or new rendered replay
is in scope; full repository gates remain for the settled Epic/PR candidate.
Record implementation, analysis, focused verification, record/board work,
external-agent waits and maintainer-decision time separately at exit.

## Single next action

Run the hash-pinned mathematical/specification audit. Do not launch another
CLO encoding trial until this evidence identifies a different representation
that is both source-exact and testable under the unchanged acceptance gate.

## Audit result and disposition

The exact S536 source, S591/S592 fixtures, and both source-preflight reports
match their pinned SHA-256 values. Each target source POLYLINE binds to exactly
one SPLINE by matching its entire ordered source-coordinate sequence and the
repeated closing control point; the DXF handle is absent, so the audit does not
invent one. The reported flags, counts, knots, tolerances, controls, and
endpoint coordinates are emitted per entity in the C:-only machine report.

| Polo M CUT entity | Source vertices | Degree-1 controls | Knots | S591 flag | S592 flag | Independent max residual |
|---|---:|---:|---:|---:|---:|---:|
| Back | 33 | 34 | 36 | 25 | 24 | 0 cm |
| Outer collar stand | 54 | 55 | 57 | 25 | 24 | 0 cm |
| Inner collar stand | 54 | 55 | 57 | 25 | 24 | 0 cm |
| Upper pointed collar | 44 | 45 | 47 | 25 | 24 | 0 cm |
| Under pointed collar | 44 | 45 | 47 | 25 | 24 | 0 cm |

The evaluator sampled seven parameters (including endpoints) per nonzero
active knot span, comparing with that source edge's linear interpolation. All
3,206 samples across the two variants returned zero coordinate residual in
the JavaScript calculation. Because degree one is linear on each span and its
control endpoints match each source segment, this certifies the whole active
source curve, not merely the sampled points. The final span returns from the
last source vertex to the first. S591 and S592 therefore describe identical
piecewise-linear loci under the documented degree-1 B-spline evaluation even
though only S591 sets the closed bit.

**Directly encoded:** S591 group 70 is 25 (`1+8+16`: closed, planar, linear);
S592 is 24 (`8+16`). Neither sets periodic or rational bits. Each has degree
1, a clamped nondecreasing integer knot vector, no fit points, no explicit
weights, and an exact repeated first/last control coordinate. Both encode a
nonperiodic knot vector with count `control-point count + degree + 1`, and the
same source values. DXF's group 41 weight is optional when weights are 1.

**Documented:** Autodesk's [SPLINE DXF reference](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm)
defines the five flag bits, degree/count fields, knot/control-point records,
and default tolerances. Autodesk's [AcDbSpline constructor reference](https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/GUID-AcDbSpline__AcDbSpline_int_Adesk__Boolean_Adesk__Boolean_Adesk__Boolean_AcGePoint3dArray__AcGeDoubleArray__AcGeDoubleArray__double_double.html)
separates closed-loop state from periodicity; a periodic spline must already
be closed, and a nonperiodic knot array is longer than the control array by
degree + 1. It also documents endpoint coincidence within control-point
tolerance as a closure condition independent of the `closed` parameter. These
references define AutoCAD fields/API behavior; they do not establish CLO's
internal parser or explain the observed round-trip deviations.

**Independently calculated:** the explicit de Boor evaluator gives zero
residual from each source edge across all five contours in both S591 and
S592. This is a source-side math result, not receiver round-trip acceptance.
The observed CLO outputs still fail five Polo CUTs at `0.001 cm`; S593's
candidate inventory contains no alternate passing CUT path. No more
closed-bit-only SPLINE trial is justified. A distinct, bounded S595 candidate
is a proper periodic degree-1 encoding using unique cyclic controls and the
documented periodic knot-count form. Before any CLO trial, S595 must derive and
independently verify the complete periodic curve against all five source
contours, hash-pin a preflight, and preserve the all-seven/V03 gates. If the
candidate cannot be proven source-exact, no receiver trial occurs.

## Machine evidence and verification

- Independent analyzer:
  `docs/research/epic17/S594-polo-spline-semantics-audit/audit-splines.mjs`.
  It verifies all five input/preflight hashes, unique source-geometry binding,
  entity field/count invariants, flag decomposition, exact controls/knots,
  and 3,206 degree-1 de Boor/source-edge evaluations.
- Machine report:
  `C:\G04-CLO-DXF-Exchange\S594-polo-spline-semantics-audit\Evidence\Analysis\S594-spline-semantics-audit.json`,
  SHA-256 `4e5aedb57dc5c42436bfb2f8cc4f6045120db4379ecb5e6d8ff30df9d3c910ad`.
- The independent analysis script's first run exposed an incorrect record
  binding: original old-style POLYLINE index 2 was mistakenly compared with a
  compacted post-conversion POLYLINE index. The audit was corrected to bind
  SPLINEs to original records by exact complete control geometry, then rerun
  against all saved hashes; the final unique bindings and residual checks
  pass. A later review corrected the report's source entity name from
  LWPOLYLINE to the actual source POLYLINE and regenerated the pinned report.
- No CLO UI, source/product code, DXF, pattern/stitch graph, legacy writer or
  protected export was changed. No V03 criterion is passed by this source
  audit. CLO stays open for any later evidence-led trial.
