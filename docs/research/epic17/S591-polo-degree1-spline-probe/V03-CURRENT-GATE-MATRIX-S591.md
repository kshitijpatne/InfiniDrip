# G04 / V03 current evidence matrix — Slice 591

This matrix carries forward S590 and adds one clean-scene, one-generation
CLO 2026.1.310 DXF-AAMA trial of five exchange-only degree-1 SPLINE cut
outlines. It does not change any V03 acceptance criterion or the fixed
`0.001 cm` gate.

| V03 gate | Current disposition | Evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **Narrow identity supported; compatibility not qualified** | CLO 2026.1.310, DXF-AAMA, exact import/export settings recorded in S536/S590. S590 completed one clean-scene exchange without an error; CLO showed a seam-allowance Custom-mode notice. | Keep the exact build, format and settings attached to every fixture. No formal AAMA conformance claim. |
| Permission and local handling | **Settled for this evaluation** | Written product-development trial and local-file-processing permission are confirmed by the maintainer and recorded in `docs/PROJECT-DECISIONS.md`. Exchange and render artifacts are in the named C: folders. | No repeat permission request. Keep future receiver files in their named C: folders. |
| Seven-recipe presence and repeated exchange | **Partial pass** | S523/S545/S547 cover seven M/default recipes and 41 pieces over two generations. S591 adds a single Polo M diagnostic exchange only. | All seven supported recipes/options and applicable repeated round trips must pass every relevant gate. |
| CUT/SEW geometry at 0.001 cm | **Fail** | S590's source-bounded fillet failed its five changed CUT corners. S591's degree-1 SPLINE controls exactly represent those five original piecewise-linear contours at source side; after one CLO generation, 9/9 SEW and 4/9 CUT pass. Back fails at `13.113897 cm`; outer stand `0.853255 cm`; inner stand `0.841822 cm`; upper collar `0.853243 cm`; under collar `0.853248 cm` conservative upper bounds. Four unaffected CUT pass at `0.000257–0.000271 cm`. See `Evidence/Analysis/S591-roundtrip-analysis.json`. | Keep the five contours held. Any distinct encoding needs a fresh source-side proof below `0.001 cm`; no S591 SPLINE geometry is accepted. |
| Piece/revision identity | **Partial; tested XDATA route fails** | S536/S547 associate 41/41 M/default pieces using sew geometry, not serialized identity. S586 found no source piece/revision IDs in the generic writer. S588 retained 0/56 custom XDATA IDs. S590 binds its nine output blocks to unchanged SEW geometry only to measure contours. | Establish stable, unambiguous source piece/revision/size identity through the candidate round trip; do not infer it from order, handles, or the tested XDATA route. |
| CUT/SEW semantics and layers | **Fail** | S557/S573 recorded nine mixed CUT/SEW assignments on numeric output layer 8. S590/S591 report numeric layer IDs only and do not assign manufacturing meaning. | Demonstrate an explicit stable CUT/SEW mapping in representative exchange and re-import. |
| Marks, notches, labels and seam allowance | **Incomplete** | S557/S573/S586 find 22/100 marks with direct same-kind geometry matches; the other 78 are not proof of loss. S590/S591 full 2D snapshots show nine pieces at gross scale but do not certify fine-mark semantics or detail. | Map required marks/labels/notches/allowances to source identity and verify geometry, readable rendered detail and round-trip persistence. |
| Units and scale | **Partial setup evidence** | S536/S590 import and export use centimeters at 100%; product DXF does not declare `$INSUNITS`. Generic header changes did not repair Polo geometry. | State units/scale in a candidate profile and independently measure all fixture coordinates after round trip. |
| Sizes, grading and supported options | **Fail / incomplete** | The prior seven-recipe matrix is M/default only. Source has five-size material; CLO graded tests failed non-base geometry. S565's disposable waistband correction did not fix larger-size SEW or multi-size re-import. S590 is one Polo M case. | Pass source-backed sizes/options per recipe, preserving grade relationships and the geometry threshold. |
| Malformed-input handling | **Fail for one tested negative fixture** | S531's malformed AAMA DXF was silently accepted while an inset SEW contour disappeared. This finding is limited to the tested build/input/settings. | Candidate must reject or clearly report malformed input and retain expected geometry over the documented negative fixtures. |
| Rendered/detail evidence | **Gross presence shown; fine detail incomplete** | S591's clean-scene snapshot shows nine expected Polo M pieces from the SPLINE input; the back and collar outlines visibly diverge from source. It is a first-generation import view, not a second-generation rendering. | Inspect source-bound marks, notches, construction paths and legibility at useful zoom on accepted candidate fixtures. |
| Actual repeated-round-trip compatibility | **Fail / incomplete** | S591 is one import/export generation; 5/9 CUT outlines fail the unchanged threshold, while semantic, mark, grade/options and malformed-input gates remain. | A changed, evidence-backed candidate must pass representative all-seven fixtures, exact geometry, semantics, negative cases and repeated round trips before any exact compatibility statement. |
| Legacy DXF and protected export byte identities | **Preserved to date** | S590 creates only disposable diagnostic input/output and research evidence; no production writer or protected baseline changed. | Preserve legacy behavior and protected byte identities through any future implementation and the final PR gate. |

## Reading the S591 result

The receiver accepted and exported the input without a format error. The
degree-1 SPLINE controls are an exact piecewise-linear representation at source
side, but the five exported CUT contours miss the source by sampled maxima
`0.841572–13.113647 cm` before conservative allowance. Four unaffected CUT
paths and all nine SEW paths pass. This is measured output, not an assertion
about CLO's undocumented internal SPLINE interpretation. The candidate is
rejected for the tested build/profile/fixture only.

Permission, profile identity and a visible successful file operation do not
clear technical acceptance. Keep the strict gate and all other V03 holds.

## Shortest evidence-backed continuation

1. S592 tests one closure-flag variable on the exact same degree-1 control
   sequence: omit only the SPLINE closed bit while retaining the repeated first
   control point. Import only after a fresh hash-pinned source proof below
   `0.001 cm` and preserve all other file/entity data.
2. Do not repeat the S590 fillet, R2000/LWPOLYLINE, LINE, XDATA or settings
   trials. If the closure-flag probe fails, do not generate unbounded SPLINE
   variants; retain the Polo geometry hold and choose the next diagnostic from
   measured evidence or a bounded scope decision.
3. After a geometry route passes, continue the still-open identity,
   CUT/SEW-layer, marks, grading/options, malformed-input, seven-recipe and
   repeated-round-trip gates. Preserve V02, legacy DXF behavior and protected
   byte identities.
4. At the settled integrated candidate, perform final rendered/output review,
   full repository coverage/build and protected-export gates before PR, safe
   merge, ancestry and required deployment verification.
