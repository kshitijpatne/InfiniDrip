# V03 gate delta after S697

Evidence is for the generated Polo STANDARD_M/M/default-option source package;
the six-decimal candidate was not imported into a receiver during this slice.

| Gate | Status after S697 | Evidence / remaining proof |
|---|---|---|
| Candidate DXF coordinate precision | **Passed at source serialization** | The actual candidate stores all coordinates to six decimal places. Maximum measured two-axis serialization displacement falls from `0.000701218851 cm` at three decimals to `0.000000702921 cm` at six decimals. The fixed receiver contour threshold remains `0.001 cm`. |
| Legacy DXF and protected identities | **Preserved** | Default `exportDxf` remains three-decimal; all eight protected regression hashes pass unchanged. |
| Source recipes/options/grades/package | **Passed at source/package level** | Focused package suite passes the seven registered recipes and grade rows plus all 73 canonical supported option cases. Receiver-side breadth remains unproven. |
| Receiver CUT/SEW round trip | **Unproven for the new six-decimal candidate; failed on the earlier three-decimal S693 candidate in CLO Standard** | No receiver trial was repeated. S696 remains the strongest actual CLO Standard evidence and fails six CUT contours while all nine SEW contours pass. The new source candidate must be tested only after a qualifying profile is established. |
| Visible marks and semantics | **Unproven for the new candidate; failed for the S696 CLO Standard return** | S697 emits higher-precision coordinates for marks too, but this does not recover CLO's three displaced buttonhole stations or typed mark/layer identities. Receiver verification is still required. |
| Qualified industrial/apparel receiver profile and rights | **Unproven / no qualifying installed route evidenced** | Existing route reconciliation remains controlling; S697 does not change receiver eligibility. No ANSI/AAMA/ASTM conformance claim. |
| Piece identity, grade/seam association, malformed-input rejection, repeatability, readable receiver output | **Unproven** | Still require one passing representative import, return/reopen, identity and negative-input checks, and rendered review on a qualifying receiver. |
| Seven recipes, all 73 options and registered grades at receiver | **Unproven** | Source package tests pass; execute existing matrix only after representative receiver proof passes. |
| V02, all-seven flats | **Unchanged; Done** | No V02 code, views, holds, or acceptance changed. |
| Final repository gate, cleanup, PR, merge, deployment | **Pending** | Run once on a settled candidate after V03 acceptance; review only necessary tracked artifacts before PR. |

S697 fixes a source-side precision loss. It does not establish receiver
round-trip behavior and does not promote V03.
