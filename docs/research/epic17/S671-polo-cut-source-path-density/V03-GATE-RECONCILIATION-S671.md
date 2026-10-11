# G04 V03 gate reconciliation after Slice 670 / S671 preflight

This status refresh uses actual source-linked CLO results through S646/S640,
DGS results S667–S670, and S671's verified source-path derivative. S671's CLO
native import has **not** run. This is a status refresh only: no V03 criterion,
scope, threshold, hold or product claim changes.

| Gate | Current status | Strongest evidence | Shared cause | Exact remaining proof |
|---|---|---|---|---|
| Receiver rights/local handling | **Passed for bounded CLO evaluation/local files** | Maintainer's written confirmation in `docs/PROJECT-DECISIONS.md`; approved C:-only folder. | Candidate eligibility, independent of fidelity. | Use the existing CLO local session; no new rights decision. |
| Named industrial receiver/profile and any conformance claim | **Unproven** | CLO 2026.1.310's menu-labelled Standard/DXF-AAMA/DXF-ASTM routes are vendor-specific; DGS `VID:20250610` is retired after product imports blank and native export has zero geometry. | Candidate eligibility precedes all technical gates. | Exact empirically tested route must pass V03; describe it as vendor-specific. No ANSI/AAMA/ASTM conformance claim. |
| Units, orientation, origin, scale, precision | **Unproven for an eligible profile** | Source is pinned cm `$INSUNITS=5`; S646 OpenCAD generic R14 retained it, but is not an industrial apparel profile. DGS S667 changed units without numeric conversion; S670 omitted `$INSUNITS` and geometry. | Tied to candidate import/export path. | On one passing candidate, verify no scale/rotation/translation and `0.001 cm` source-bound coordinates through two directions. |
| CUT/SEW validity and geometry | **Failed on existing CLO/DGS candidates; S671 derivative unproven** | CLO Standard/ASTM tests S632/S635/S636/S640 repeat 4/9 CUT and 9/9 SEW; five CUT features differ `0.012741–0.013974 cm`. S643 proves deleting the source points exceeds the gate. DGS S670 export has zero geometry. S671 independently proves the 66,206-byte derivative retains the exact mathematical source path; no receiver import yet. | Primary current failure; blocks all later exchange gates. | One CLO import of the already-prepared derivative, compare all nine CUT and nine SEW contours to source at `0.001 cm`, without alignment. |
| Seven recipes, 73 supported options and required grades | **Unproven** | V02 evidence is 7 recipes/73 options/146 faces, not CAD. S643 shows five Polo locations repeat across the 17 options by recipe code; no full CAD-grade cohort passed. | Requires a valid representative profile first. | After representative interchange passes, run existing 73-option/seven-recipe and required grade matrix on the exact profile. |
| Piece/revision/grade/seam relation identity | **Unproven as complete C04 exchange** | S646 preserved nine names and metadata through generic OpenCAD R14; CLO returned nine patterns. Version-bound relationships/grade association are not fully round-tripped. | Same profile plus breadth; sidecar needs integrity binding. | Verify stable IDs and C04-compatible versioned sidecar association, relations and mismatch rejection through two rounds. |
| CUT/SEW layers, notches, allowance, artwork/manufacturing marks/grainline | **Failed on measured cases; otherwise unproven** | S632 mark audit: only partial POINT/LINE identity and no three button circles within tolerance; S639 native trim geometry differs from the source circle/point by about `0.07616 cm`. S670 DGS cannot provide geometry. | Receiver semantics and readable rendering, separate from contour geometry. | On a geometry-passing import, inventory every typed source item by identity/location/layer/value; compare native/exported output and actual detailed renders. |
| Clean valid imports/warning handling | **Unproven for a passing profile** | S640 CLO returned nine patterns; its Custom seam-allowance message was informational. DGS S668 blank import without warning is a failure, not clean acceptance. | Receiver-specific interpretation. | Capture the selected import's warning state and prove no omissions/loss notices remain. |
| Malformed-input and invalid-option fail-closed behavior | **Failed for tested paths** | S531 CLO AAMA accepted malformed input silently and omitted SEW; S626 generic OpenCAD accepted nonfinite values. | Parser policy is profile-specific. | Reuse the existing negative fixtures against any otherwise eligible exact profile and require rejection without partial output/repair/clamp. |
| Repeatability and two-way round trip | **Failed for tested candidates; otherwise unproven** | S632 ASTM repeated files differed and retained same geometry/mark failures. DGS S670 export contains no geometry and was correctly not self-imported. S646 generic R14 outputs are byte-identical but not industrial apparel CAD. | Depends on passing import and export semantics. | After representative import passes: two frozen-revision exports and clean reimports, compare all gates and either stable bytes or documented semantic equivalence. |
| Receiver whole-view/detail readability | **Unproven** | Existing CLO 9-piece overview proves gross presence only; failed mark/geometry cases have no passing detail review. Source-only S671 overlay is not receiver evidence. | Depends on semantic completeness at real viewing scale. | Save and inspect whole-layout plus detail crops from actual receiver and reimport. |
| Rights/profile/documentation | **Candidate-specific / unproven** | CLO rights/locality passed for evaluation; menu names do not establish normative standards. DGS first-party manual and build are pinned but measured routes fail. | Candidate route identity. | Document exact build, route, import/export settings, sidecar contract, and observed limits after a full pass. |
| Legacy DXF / protected output identities | **Passed so far; final gate pending** | S670–S671 change no production exporter, recipes, baselines or protected identities. | Any future production change. | Run locked identity and legacy regressions at final integrated gate. |
| V02 prerequisite | **Passed** | S459 verified all seven recipes, 73 configurations and 146 faces; current board records V01/V02 Done. | None. | Keep accepted; no change absent a specific exchanged-output defect. |

## S671 source preflight (not a receiver result)

The original S617 source hash is
`71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`.
S671's exact-path derivative hash is
`487FAD7533BDA83306D3F4FA2DFEF523E469E62F3D808EFF0A9C98A7E38B77F8`.
Independent parsing verifies 2,724 original group/value pairs preserved in
order; only five named CUT polylines receive 776 collinear vertices; every old
vertex remains; maximum numeric collinearity residual is
`5.68e-13 cm`; mathematical source path residual is 0.000 cm. The annotated
PNG under the C:-only S671 evidence directory shows all five neighborhoods.
None of this establishes CLO acceptance.

The Windows process is running as PID 62304, but this task's computer-use
connector reports no native applications and exposes browser-only controls.
Thus the import has not been performed and no receiver result is fabricated.
