# G04 / V03 current evidence matrix — Slice 589

This matrix reconciles the admitted V03 exit language and corrected S573 table
with retained evidence through S588. “Pass” means only the bounded fixture and
assertion named in the evidence; it does not imply overall V03 acceptance.
No gate is changed here.

| Admitted V03 gate or supporting claim | Current disposition | Evidence and exact limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **Supported, narrow** | CLO 2026.1.310 / DXF-AAMA is named in official CLO guidance and was used with recorded settings (S558, S573, S585, S588). It is a profile identity, not an edition/conformance certificate. | Keep recording the exact build, import/export mode and settings with each accepted fixture. Do not claim formal AAMA conformance. |
| Permission and local handling | **Settled for this evaluation** | The maintainer reports written confirmation of product-development evaluation and local DXF processing; recorded in `docs/PROJECT-DECISIONS.md`. | No additional permission decision is needed for this bounded local evaluation. Continue C:-only exchange storage. |
| Seven-recipe presence and repeated exchange | **Partial pass** | All seven M/default recipes and 41 expected pieces were exchanged over two generations (S523, S545, S547). This is not grade/options coverage and does not pass where another gate fails. | Repeat with a source-backed supported-configuration/grade fixture after a credible representation is selected. |
| CUT/SEW geometry at 0.001 cm | **Fail** | S547 records 77/82 contours passing in each of two generations; the same five Polo CUT contours miss by 0.01274–0.01399 cm. S585 confirms failure across tested CLO Standard/AAMA/ASTM paths and reports that connected-LINE input fails all nine Polo CUT contours. | A changed, technically justified source/profile representation must pass the exact 0.001 cm comparison, all seven recipes, and repeated import/export. Do not retry tested encodings/settings as-is. |
| Piece/revision identity | **Partial; stable entity IDs fail in tested route** | 41/41 M/default output pieces can be associated by sew geometry, which is not serialized identity. S586 finds no source piece/revision IDs in the generic writer. S588 preserved 0/56 custom registered-app XDATA IDs; the tested CLO route dropped its APPID/XDATA. | Establish unambiguous source-to-output piece/revision/size identity in a changed profile path; do not infer identity from output order, handles, or XDATA for this tested route. |
| CUT/SEW semantics and layers | **Fail** | S557/S573 find nine mixed CUT/SEW assignments on output layer 8 across the seven-recipe cohort; numeric layer numbers do not establish manufacturing meaning. The product source itself emits separate CUT and SEW layers (S586). | Prove an explicit, stable layer/role mapping in the candidate exchange and round trip. |
| Marks, notches, labels, seam allowance | **Incomplete** | S557/S573/S586 find 22/100 marks with direct same-kind geometry matches; the other 78 are not proof of loss. CLO controls for annotation/notches/allowance were exercised, but there is no complete semantic mapping or fine-detail verification. S588's XDATA failure applies to custom IDs, not proof all visible marks were lost. | Map each required mark/label/notch/allowance to source identity and receiver output; verify dimensions, path association, and readable rendered detail. |
| Units and scale | **Partial setup evidence** | Product DXF uses centimetre coordinates but no `$INSUNITS`; CLO's UI requires operator unit/scale selection. The tested CLO operations used centimetres and 100%; generic header changes did not repair Polo geometry (S536, S587). | Candidate profile must state units/scale and independently measure all fixture coordinates after round trip. |
| Sizes, grading, supported options | **Fail / incomplete** | Seven exchange cohort is M/default only. Source has five-size material (S559/S562); CLO graded tests failed non-base geometry. S565 corrected a disposable waistband CUT subset, but larger-size SEW and multi-size re-import still failed. No all-seven graded/option exchange passes (S573). | Source-backed multi-size fixtures and per-recipe/options round-trip checks must pass geometry and preserve grade relationships. |
| Malformed-input handling | **Fail for one tested negative fixture** | S531's malformed AAMA DXF was silently accepted while an inset SEW contour disappeared. This is specific to the tested input/build/settings, not every malformed file. | Candidate must reject or clearly report malformed input and retain all expected geometry under the documented negative fixture set. |
| Rendered/detail evidence | **Partial** | S523/S545 prove gross piece presence/layout. Screens are too coarse to certify fine marks. S588's rendered snapshot shows nine pieces only; geometry from that exchange is not attributable because Draw Curve Points was unchecked versus the pinned S536 setup and two pre-existing inserts were in the scene. | Capture a controlled, isolated candidate round trip and inspect fine marks, notches, construction paths, and legibility at useful zoom. |
| Actual repeated round-trip compatibility | **Fail / incomplete** | Seven M/default generation-two files exist, but Polo geometry fails, semantics are mixed, marks/grades are unresolved, and the malformed test fails. S585 closes CLO 2026.1.310 only as a candidate for the exact configurations already tested, not universally. | A changed, evidence-backed candidate must pass every applicable V03 criterion on representative fixtures before an exact compatibility statement. No second receiver or normative-edition search is independently required by S573. |
| Legacy DXF and protected export byte identities | **Preserved to date** | S589 changes only research/status documents and board evidence. No product writer or baseline changes. | Preserve byte-identity regression and legacy behavior on any later implementation candidate; full gate remains for the settled Epic/PR. |

## Reading the result

The user authorization concern is not a blocker. CLO has rendered and exported
files without format errors, but the tested profile/configurations have measured
technical failures; a successful dialog operation is not a V03 pass. The 0/56
XDATA result rules out that custom-identity mechanism for the tested path. The
S588 geometry cannot be used to infer a new geometry outcome because its import
settings and scene were not isolated. The stronger S536/S547/S585 geometry
evidence remains authoritative.

This does not support claiming all CLO versions or DXF apparel workflows are
incompatible. It does support stopping repeat trials of the same build,
profile, geometry, and settings. The profile identity is documented; exact
compatibility stays unclaimed until the technical gates pass.

## Shortest evidence-backed continuation

1. **S590 — resolve one measured geometry defect before another exchange.**
   Inspect the exact five failing Polo CUT source paths and hash-pinned outputs
   together, including vertex order, precision, duplicate/near-duplicate
   points, curve/bulge representation, and the observed one-vertex omission.
   Compare against the already failed S536 R2000/LWPOLYLINE and S574 LINE
   variants. Produce a concrete, falsifiable alternate representation and a
   standalone round-trip checker. Do not change the 0.001 cm gate, touch the
   legacy writer, or run CLO until the representation differs in a specific
   evidence-backed way.
2. If that proposal is technically coherent, isolate its fixture under the
   next named C: folder and run one controlled import/export with the pinned
   CLO settings and clean scene; inspect its actual rendered result and exact
   geometry. If it fails the same fixed gate, record that and do not repeat it.
3. Only after geometry passes, develop a separate additive professional
   exchange path for explicit piece/revision/size identity, CUT/SEW roles,
   marks/labels/notches/allowances and source-backed grades/options. Exercise
   the malformed controls and all-seven repeated fixture matrix in the real
   receiver. Keep generic DXF byte identities unchanged.
4. Run final rendered/output review, full repository 100% coverage/build and
   protected-export gates on the settled integrated Epic/PR; then review and
   safely merge, verify `origin/main` ancestry and any required Actions deploy.

This ordering makes the recurring blocker concrete: one cut-contour geometry
failure is already enough to reject every tested CLO round trip, so expanding
metadata or repeating unchanged UI settings first cannot unblock V03.
