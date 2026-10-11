# G04 / V03 current evidence matrix — Slice 590

This matrix carries forward S589 and adds one clean-scene, one-generation
CLO 2026.1.310 DXF-AAMA trial of an exchange-only Polo corner-curve variant.
It does not change any V03 acceptance criterion or the fixed `0.001 cm` gate.

| V03 gate | Current disposition | Evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **Narrow identity supported; compatibility not qualified** | CLO 2026.1.310, DXF-AAMA, exact import/export settings recorded in S536/S590. S590 completed one clean-scene exchange without an error; CLO showed a seam-allowance Custom-mode notice. | Keep the exact build, format and settings attached to every fixture. No formal AAMA conformance claim. |
| Permission and local handling | **Settled for this evaluation** | Written product-development trial and local-file-processing permission are confirmed by the maintainer and recorded in `docs/PROJECT-DECISIONS.md`. Exchange and render artifacts are in the named C: folders. | No repeat permission request. Keep future receiver files in their named C: folders. |
| Seven-recipe presence and repeated exchange | **Partial pass** | S523/S545/S547 cover seven M/default recipes and 41 pieces over two generations. S590 adds a single Polo M diagnostic exchange only. | All seven supported recipes/options and applicable repeated round trips must pass every relevant gate. |
| CUT/SEW geometry at 0.001 cm | **Fail** | S590's radius-0.05 cm fillet derivative itself stays within an analytic `0.000509158–0.000581477 cm` bound of the original five corners; all unchanged contours are byte/group-identical in the derivative preflight. After one CLO generation, 4/9 CUT contours and all 9/9 SEW contours pass. The same five modified CUT contours fail at sampled maxima `0.006813382–0.007584680 cm` (conservative upper bounds `0.007063382–0.007834680 cm`); their output paths have one fewer vertex and no bulge arcs. Exact measurements and hashes are in the S590 analyzer report. | Diagnose these exact source/output residuals. A new exchange representation must independently pass `0.001 cm` before another CLO run and then pass all seven recipes and repeated exchange. |
| Piece/revision identity | **Partial; tested XDATA route fails** | S536/S547 associate 41/41 M/default pieces using sew geometry, not serialized identity. S586 found no source piece/revision IDs in the generic writer. S588 retained 0/56 custom XDATA IDs. S590 binds its nine output blocks to unchanged SEW geometry only to measure contours. | Establish stable, unambiguous source piece/revision/size identity through the candidate round trip; do not infer it from order, handles, or the tested XDATA route. |
| CUT/SEW semantics and layers | **Fail** | S557/S573 recorded nine mixed CUT/SEW assignments on numeric output layer 8. S590 reports numeric layer IDs only and does not assign manufacturing meaning. | Demonstrate an explicit stable CUT/SEW mapping in representative exchange and re-import. |
| Marks, notches, labels and seam allowance | **Incomplete** | S557/S573/S586 find 22/100 marks with direct same-kind geometry matches; the other 78 are not proof of loss. S590's full 2D snapshot shows all nine pieces at gross scale but does not certify fine-mark semantics or detail. | Map required marks/labels/notches/allowances to source identity and verify geometry, readable rendered detail and round-trip persistence. |
| Units and scale | **Partial setup evidence** | S536/S590 import and export use centimeters at 100%; product DXF does not declare `$INSUNITS`. Generic header changes did not repair Polo geometry. | State units/scale in a candidate profile and independently measure all fixture coordinates after round trip. |
| Sizes, grading and supported options | **Fail / incomplete** | The prior seven-recipe matrix is M/default only. Source has five-size material; CLO graded tests failed non-base geometry. S565's disposable waistband correction did not fix larger-size SEW or multi-size re-import. S590 is one Polo M case. | Pass source-backed sizes/options per recipe, preserving grade relationships and the geometry threshold. |
| Malformed-input handling | **Fail for one tested negative fixture** | S531's malformed AAMA DXF was silently accepted while an inset SEW contour disappeared. This finding is limited to the tested build/input/settings. | Candidate must reject or clearly report malformed input and retain expected geometry over the documented negative fixtures. |
| Rendered/detail evidence | **Gross presence shown; fine detail incomplete** | S590's clean-scene snapshot shows nine expected Polo M pieces. It was captured after import and before export; it is not a second-generation rendering. | Inspect source-bound marks, notches, construction paths and legibility at useful zoom on accepted candidate fixtures. |
| Actual repeated-round-trip compatibility | **Fail / incomplete** | S590 is one import/export generation; 5/9 CUT outlines fail the unchanged threshold, while semantic, mark, grade/options and malformed-input gates remain. | A changed, evidence-backed candidate must pass representative all-seven fixtures, exact geometry, semantics, negative cases and repeated round trips before any exact compatibility statement. |
| Legacy DXF and protected export byte identities | **Preserved to date** | S590 creates only disposable diagnostic input/output and research evidence; no production writer or protected baseline changed. | Preserve legacy behavior and protected byte identities through any future implementation and the final PR gate. |

## Reading the S590 result

The receiver accepted and exported the input without a format error. The
fillet's source-side deviation is below the gate, but the exported geometry is
not: all five intended repairs still miss by more than six times the threshold.
The five receiver contours contain no arc bulges and each has one fewer vertex
than the corresponding S590 derivative; this is the observed output shape,
not a claim about CLO's undocumented internal cause. The other four CUT paths
and all nine SEW paths pass the bounded comparison. No universal claim about
CLO or DXF follows from this one build/profile/configuration.

Permission, profile identity and a visible successful file operation do not
clear technical acceptance. Keep the strict gate and all other V03 holds.

## Shortest evidence-backed continuation

1. S591 should map the five largest S590 source-to-output residuals to their
   exact input/output vertices and segments, then assess one genuinely
   different representation with a source-side proof below `0.001 cm`.
2. Do not import another fixture unless its hash-pinned preflight passes that
   unchanged gate and isolates only the intended corner segments. Do not
   repeat the fillet, R2000/LWPOLYLINE, LINE, XDATA, or settings trials.
3. After a geometry route passes, continue the still-open identity,
   CUT/SEW-layer, marks, grading/options, malformed-input, seven-recipe and
   repeated-round-trip gates. Preserve V02, legacy DXF behavior and protected
   byte identities.
4. At the settled integrated candidate, perform final rendered/output review,
   full repository coverage/build and protected-export gates before PR, safe
   merge, ancestry and required deployment verification.
