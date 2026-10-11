# G04 V03 gate update — S694 actual CLO candidate return

This is an addendum to the historical S691 matrix using the actual S693
candidate and the exact S694 CLO 2026.1.310 Standard DXF import/export. It does
not combine results from different receivers, raise a gate, or change
acceptance. CLO Standard remains an empirical vendor-specific candidate; the
menu label makes no ANSI/AAMA or ASTM conformance claim.

| Gate | Status after S694 | Strongest current evidence | Remaining proof / relationship |
|---|---|---|---|
| Rights and local handling | **Passed for this bounded evaluation** | Maintainer's recorded written permission covers InfiniDrip product-development use and local processing. All S694 files stayed under `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\`. | Candidate-specific record only; does not qualify the route technically. |
| Named receiver and profile | **Unproven / route not qualified** | Exact CLO Standalone 2026.1.310 Standard DXF path was used with recorded import/export settings. | One valid Polo M round trip is insufficient. Do not call this a standard or qualified profile until the same route passes its complete gates. |
| Units / scale | **Passed for this Polo M run** | Input and return declare millimeters; S689's exact cm-to-mm coordinate conversion was independently replayed on the S693 input. Return hash `1fe2683a27e87afffd3686b174a3c9fd9189077562e101e003f24a128347ce89`. | Candidate-specific only. Geometry, marks, and semantics fail independently. |
| CUT / SEW geometry | **Failed** | Fixed `0.001 cm` comparator on the actual return: all 9 SEW paths pass (`0.0000049–0.0000093 cm`); only the two plackets' CUT paths pass. Seven CUT failures: front `0.001035292`, back `0.002991975`, sleeve `0.001491971`, outer stand `0.011015115`, inner stand `0.039767881`, upper collar `0.011015117`, under collar `0.011018607 cm`. | The comparator establishes the residuals, not their cause. The four stand/collar maxima share source vertex index 182 and y=`75.791 cm`; returned/source path vertex counts differ. Localize these exact paths and determine whether a serializer-only remedy is supported. Do not distort source shape to hide the mismatch. |
| Visible marks and layer/type semantics | **Failed** | 105/108 source mark geometries match. Three `MARK_BUTTONHOLE` points are each `1.4999966 cm` from the expected source location. The saved return contains 132 `LWPOLYLINE` entities, no `LINE`, `POINT`, or `CIRCLE`, and numeric layers `1`, `7`, `8`, `14`. | The missing buttonhole anchors and lost mark types/layers are separate from CUT approximation. A version/hash-bound sidecar cannot recreate missing visible geometry. |
| Piece, revision, grade and seam identity | **Unproven** | Nine generic output inserts/blocks `0_M` through `8_M`; the package's source identity remains digest-bound. | No returned-file sidecar association or mismatch rejection was tested. Establish a deterministic source-to-return mapping without relying on generic labels. |
| All seven recipes / 73 options / grade rows | **Passed at source package; unproven at receiver** | S693's focused package matrix covers all seven recipes, registered grade rows and 73 canonical supported options. | S694 is one Polo M receiver result only. Do not infer receiver breadth from source coverage. |
| Malformed/unsupported input | **Unproven for this Standard DXF route** | Existing CLO AAMA evidence records a failure on that distinct format route. | Do not repeat the known AAMA failure or mix its result into Standard DXF. Use existing negative fixtures only after the same route clears valid-file geometry and mark/identity gates. |
| Repeatability | **Unproven** | One exact S694 import/export; no second pass. | No repeat is justified while the current valid-file route fails CUT and mark gates. |
| Readable receiver output | **Unproven for acceptance** | CLO visibly displayed nine pieces; actual exported DXF was rendered as a whole-pattern overlay and an inner-stand detail and inspected. | Mark loss/type loss and lack of identity/grades prevent an acceptance-level readability pass. |
| Legacy DXF / protected byte identities | **Preserved in S693; integrated recheck pending** | S693 changed only the separate version-3 package candidate and retained the legacy exporter/protected tests. | Recheck on the settled integrated candidate before merge. |
| V02 / all-seven front/back flat output | **Passed; unchanged** | S459's accepted evidence covers seven recipes, 73 supported configurations and 146 front/back faces. S694 made no V02 changes. | No V02 gate is reopened by this receiver result. |
| Full integrated gates / PR / merge / ancestry / deployment | **Pending** | No PR or merge for the settled candidate exists. | One final full repository coverage/build/browser/output gate, final review and cleanup, PR, safe merge, refreshed `origin/main` ancestry and required deployment remain due. |

S694 input/output, transform report, exact comparator report, inventory and
render evidence are hash-pinned in `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\`
and summarized in `S694-exit-packet.md`.
