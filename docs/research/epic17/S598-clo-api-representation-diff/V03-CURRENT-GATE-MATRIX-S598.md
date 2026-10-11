# G04 / V03 current evidence matrix — Slice 598

This matrix retains the S595 DXF-AAMA round-trip results and S597's read-only
`GetPatternLineInfo` observation, with S598 comparing that capture against
the existing S580 connected-LINE capture. These diagnostic API observations
do not qualify a profile or change any acceptance criterion, threshold, or
V03 gate.

| V03 gate | Current disposition | S595 evidence and limit | Proof still required |
|---|---|---|---|
| Receiver/profile identity | **Narrow CLO test identity only; not qualified** | CLO 2026.1.310 / DXF-AAMA settings and product-development/local handling authorization are recorded. One periodic-SPLINE fixture fails five CUTs. | Qualify and document an industrial apparel exchange receiver/profile. |
| Permission and local handling | **Settled for this bounded evaluation** | Maintainer's written authorization permits product-development use and confirms local file processing. All S595 files are in the named C: folder. | No repeat permission question; no hosted upload. |
| Seven-recipe presence and repeated exchange | **Partial** | S595 is one Polo M generation, with nine receiver pieces. | All seven recipes/configurations and required repeated generations. |
| CUT/SEW geometry at 0.001 cm | **Fail for five Polo CUTs** | Four of nine CUTs pass; back fails 4.063040 cm, outer/inner stands 9.311107947/9.311054798 cm, upper/under pointed collars 0.159214023/0.159193055 cm. All nine SEWs pass. S595's 1,603-sample source proof is exact but does not imply receiver fidelity. S597's separate pre-export API screen finds five direct source-contour proximities (3 literal source CUT-layer, 2 literal source SEW-layer); it is not the round-trip gate measurement and does not assign roles. | Every applicable CUT and SEW under the unchanged threshold. |
| Piece/revision/size identity | **Partial; stable serialized identity absent** | Nine blocks are bound by unchanged SEW geometry for this analysis only. | Stable source identity across representative export/import/re-import. |
| CUT/SEW semantics and layers | **Incomplete** | Numeric layer labels are observed but not assigned manufacturing semantics. S597 matched literal source DXF layers as geometry metadata only; S598 shows the `GetPatternLineInfo` content changes across the two captured source representations, but the API provides no CUT/SEW-role or stable-index contract. | Documented stable CUT/SEW role and layer mapping, verified through round trip. |
| Marks, notches, labels and seam allowance | **Incomplete** | Import/export settings are recorded; the gross render shows pieces but not mark fidelity. | Source-linked mark, notch, label, and seam-allowance checks at useful zoom across required fixtures. |
| Units and scale | **Setup evidence only** | S595 was imported/exported in centimeters at 100%. | Profile-defined units and independent measurements across accepted fixtures. |
| Sizes, grading and options | **Fail / incomplete** | S595 tests one Polo M base configuration. | Supported size, grade and option matrix with intact geometry and relationships. |
| Malformed-input handling | **Fail for one tested negative fixture** | S531's malformed AAMA case was accepted while an inset SEW contour disappeared. | Clear rejection/actionable error and preserved expected geometry on negative fixtures. |
| Rendered/detail evidence | **Gross presence shown; fine detail incomplete** | S595's one-page CLO snapshot shows all nine pieces; its light strokes do not establish useful-zoom mark readability or contour correctness. | Useful-zoom inspection of marks/notches/construction plus numeric gates. |
| Repeated-round-trip compatibility | **Fail / incomplete** | This first-generation periodic candidate still fails five Polo M CUT contours. | All-seven, identity/semantics, marks, grades/options, negative tests, useful output and repeated generations. |
| Legacy DXF and protected export byte identities | **Preserved** | S595 adds research scripts and evidence only; no product writer or baseline changed. | Preserve through integrated Epic/PR gates. |

## S595 round-trip decision and S597 API observation

The source candidate uses unique cyclic controls and periodic group 70=`27`.
Its independently evaluated degree-one basis represents all five original
source contours exactly (1,603 samples, 0 cm maximum residual). This receiver
trial returned 9 pieces and passed all 9 SEWs but failed 5 CUTs. The periodic
encoding is therefore rejected for this receiver test, and all V03 gates
remain open. This evidence does not identify the cause inside CLO and does
not qualify an industrial apparel profile.

S597 queried nine current-scene pieces through CLO's read-only API. All nine
returned line sequences close exactly and their endpoint bounds equal CLO's
reported bounds. A direct-frame symmetric vertex-to-opposing-segment screen
against the hash-pinned original contours finds five uniquely near source
contours at the fixed 0.001 cm screening threshold: three whose literal DXF
layer is `CUT` and two whose literal layer is `SEW`. API indexes 1, 3, 7 and 8
have no direct match; their best screening residuals are respectively
22.9465, 117.2060, 45.2668 and 45.2667 mm. This diagnostic is not the
V03 contour acceptance metric, does not map API indexes to garment-piece
identities, and cannot establish CUT/SEW meaning or the importer/exporter
stage. Details, exact hashes and per-index bounds are in
`docs/research/epic17/S597-clo-helper-recovery/S597-exit-packet.md` and the
machine report at the named C: location recorded there.

S598 confirms that the read-only `GetPatternLineInfo` view is representation-
and project-context-sensitive: S580's line-chain capture matched eight
literal source SEW contours and no CUTs; S597's periodic-SPLINE capture
matched three literal source CUT contours and two SEWs. None of the five
source-exact SPLINE-target contours matched any S597 getter path within the
diagnostic 0.01 mm screen. This helps define the getter's limit but does not
prove that CLO discarded the SPLINEs or identify an import/export stage. The
S574 and S595 actual round-trip results remain the applicable receiver
evidence. See
`docs/research/epic17/S598-clo-api-representation-diff/S598-exit-packet.md`.

S598 clears no V03 gate. Preserve the failed five CUT results from S595 and
all remaining rights/profile, all-seven, identity, semantics, mark,
units/scale, grade/options, malformed-input, rendered-detail, repeated-round-
trip, legacy-output and protected-identity gates. Do not infer a general CLO
format failure or success from the API screen. The next trial must be tied to
one falsifiable source/receiver question and retain the unchanged `0.001 cm`
and all-seven requirements.
