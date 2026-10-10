# V03 gate delta after S698

Fixture: Polo STANDARD_M, size M, default options, source package revision
`088c91bcee7b308b0b19f7f68a2c4d43e6d9ae37a6f42504f642961a93d937b5`.
Receiver: CLO 2026.1.310 / Standard DXF, millimeter/100%/no-rotation path.
This is one empirical vendor-specific result; no standards claim is made.

| Gate | Status | Strongest evidence / remaining proof |
|---|---|---|
| Candidate coordinate precision | **Passed at source serialization** | S697's six decimals reduce measured candidate quantization to 0.000000702921 cm. In S698, front and sleeve CUT now pass; other CUT paths still fail. |
| Units | **Passed for this fixture** | The returned file declares millimeters; deterministic comparison copy returns coordinates to centimeters. |
| CUT outline fidelity | **Failed** | Six of nine exceed 0.001 cm: back 0.002576509 cm; outer/inner stand 0.032929600/0.032929728 cm; upper/under collar 0.010843247/0.010843239 cm. Front, sleeve, and both plackets pass. |
| SEW outline fidelity | **Passed for this fixture only** | All nine are 0.000001649–0.000009235 cm, within 0.001 cm. Other recipes/options/grades remain untested in this route. |
| Mark geometry / count | **Failed** | 105 of 108 source marks are found within tolerance; three buttonhole points are absent by 1.499998 cm. Returned output has no typed LINE/POINT/CIRCLE entities. |
| Layer and source identity | **Failed for this route** | Ten named source layers become numeric layers 1, 7, 8, 14; nine returned blocks are numbered `0_M`–`8_M`. Stable pattern/revision/entity association is not preserved. |
| Receiver presentation | **Failed / incomplete** | Actual reopened result was rendered and inspected. CLO reports no seam allowances and imports in Custom mode; readable industrial use and semantic marks are not established. |
| Rights and local processing | **Confirmed by maintainer** | Written confirmation already recorded in S694/S696. It does not pass the geometry, semantics, or profile gates. |
| Qualified profile / standards | **Unproven** | CLO Standard DXF is an empirical vendor/version/mode route. No ANSI/AAMA/ASTM conformance evidence. No different receiver is selected by this slice. |
| Seven recipes, supported options, grades | **Unproven at receiver** | The source package suite covers all seven recipes, grade rows, and 73 options. S698 tests one exact Polo configuration only. |
| Malformed-input rejection | **Unproven** | No receiver negative-input test. |
| Repeatability | **Unproven** | One import/export/reopen sequence only. |
| Final output review, global test/100% coverage, cleanup, PR, merge, deployment | **Pending** | Keep as explicit Epic completion gates after all V03 acceptance is satisfied. |

S698 clears no V03 acceptance gate beyond confirming unit declaration and the
S697 source-precision correction for this fixture. It does not promote V03
from held or alter any V02/V03 requirement.
