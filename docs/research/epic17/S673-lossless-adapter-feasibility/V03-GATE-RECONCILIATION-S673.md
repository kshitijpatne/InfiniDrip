# G04 V03 gate reconciliation after Slice 673

This updates S672 using the source audit, the accepted C04 sidecar limits, and
a bounded first-party screen of OpenMarker. It does not change any acceptance
criterion.

| Gate | Status | Strongest evidence | Shared cause | Remaining proof/change |
|---|---|---|---|---|
| Bounded receiver rights/locality | **Passed for CLO and GetonAgain evaluation** | Maintainer's written confirmations in `docs/PROJECT-DECISIONS.md`. | Independent from technical performance. | No repeat confirmation; any new candidate requires its own rights evidence. |
| Industrial apparel CAD receiver/profile | **No candidate qualifies** | CLO Standard fails measured geometry, units, semantics and readability (S672); DGS routes are retired (S667–S670); OpenCAD is generic R14. OpenMarker is offline/local Apache-2.0 but currently has no export flow and is not production-ready. | Candidate suitability blocks all downstream gates. | Identify a locally usable, rights-cleared pattern CAD with actual DXF import/export and output evidence; don't select from a menu label or broad category. |
| CUT/SEW, units, scale/origin | **Failed on current apparel candidates** | CLO S672 passes 4/9 CUT and 9/9 SEW at `0.001 cm`; changes cm header to mm without numeric rescale. DGS/OpenCAD failures remain candidate-specific. | Lossy receiver transform. | A new candidate must retain every path and unit/origin/orientation through both directions at `0.001 cm`. |
| Piece/revision/grade/seam identity | **Unproven as full exchange** | The S672 fixture maps nine unique SEW paths to nine blocks only when the exact frozen source is already known; CLO emits ordinal block IDs. C04 allows a bound sidecar for identity, grade and seam relations. | Missing identity payload and source context. | Prove sidecar-to-DXF integrity/revision binding and mismatch rejection on a passing candidate. |
| CUT/SEW semantic layers, marks, notch/allowance | **Failed on CLO; unproven on any eligible route** | S672 numeric layers and no POINT/LINE/CIRCLE output; earlier CLO mark audits fail. C04 forbids sidecar substitution for missing geometry/visible marks. | Receiver entity/layer semantics. | Exact DXF/native representation and rendered marks must survive a complete round trip. |
| Malformed/unsupported input fail-closed | **Failed on tested paths** | CLO S531 silently accepted the malformed AAMA fixture with missing SEW; OpenCAD S626 accepted nonfinite values. | Parser validation behavior. | Reuse existing negatives on the next otherwise-qualified receiver and require explicit rejection without partial output. |
| Seven recipes, 73 options, grades | **Unproven** | V02 breadth passes but is not CAD evidence; no representative CAD route qualifies. | Depends on representative profile pass. | Only after entry gate; replay S627 73 rows and S559/S562 size/grade fixtures. |
| Repeatability and two-way round trip | **Unproven for new adapter; failed on tested candidate routes** | S672 export was not re-imported after failure; no safe CLO lossless adapter exists. DGS has no viable geometry output. OpenCAD byte-repeatability is not apparel-CAD profile evidence. | No eligible candidate. | New receiver must pass one representative import before repeat round-trips. |
| Readable native/rendered output | **Failed on S672 CLO saved snapshot** | Nine very faint unlabelled pieces in actual saved snapshot. | Receiver output styling/identity. | Review legible whole/detail evidence on next eligible route. |
| Legacy DXF/protected output identity | **Passed so far; final gate pending** | S672/S673 do not edit writer or baselines. | Future production changes. | Final locked regression at integrated candidate. |
| V02 prerequisite | **Passed** | S459 seven recipes/73 options/146 rendered faces. | None. | No changes. |

## S673 conclusion

No production adapter is warranted. Reconstructing CUT or visible mark data
from a sidecar would violate the C04 contract; restoring the frozen source over
the S672 receiver output would also risk erasing CAD edits that the receiver
does not distinguish from its own simplification. The next action is a narrow
first-party capability screen for free, offline garment CAD candidates with
both import and export before any installation or fixture operation.
