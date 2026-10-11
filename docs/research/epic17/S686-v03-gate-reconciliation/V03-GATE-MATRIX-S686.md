# V03 gate status — S686 reconciliation

This updates, rather than replaces, the historical S682 matrix. `Passed` and
`failed` are scoped to the named source or receiver evidence. The complete V03
gate passes only when one rights-cleared, specifically documented receiver
profile satisfies the full admitted matrix. No acceptance criterion or
threshold changed.

| Gate | Status | Strongest current evidence | Shared cause / relationship | Exact remaining proof or change |
|---|---|---|---|---|
| Trial rights and local handling | **Passed** for the authorized local evaluations | Maintainer's written confirmations in `docs/PROJECT-DECISIONS.md`; all S674/S684/S685 exchange files remained in their named C: folders | Separate from technical exchange correctness | No new rights action for the bounded local evidence already authorized. Any different product/service route requires its own rights check before use. |
| Qualified industrial apparel receiver/profile | **No qualifying route evidenced among tested candidates** | CLO 2026.1.310 Standard DXF S685 fails units, five CUT paths and eight visible mark geometries on Polo M. LibreCAD R12 S674 is generic and loses units. DGS S668 imports a blank 0/0 pattern; S670 exports metadata text only. OpenCAD R14 S627 accepts malformed values and is generic. S682 records the earlier route comparison. | Root route-eligibility blocker. Other candidate-specific misses below are independent reasons each route cannot qualify. | The exchange must use an available receiver/profile with evidence that it meets G04's industrial exchange contract, plus the C04-permitted package/sidecar contract. Do not infer conformance from a menu label. No source-code change can make an unqualified receiver satisfy this gate. |
| Source unit declaration | **Passed** | S679–S681 emit centimeters and `$INSUNITS=5`; package verifier binds units to manifest and drawing hash | Source package is correct; receiver may alter the declaration | None source-side. A qualifying receiver must preserve a truthful unit contract on returned output. |
| Returned unit declaration | **Failed** on CLO S685 and LibreCAD R12 S674; **unproven** for any eligible route | CLO changes source code 5 (cm) to 4 (mm) without scaling the numeric coordinates; LibreCAD R12 omits the unit declaration | Same receiver route cause as profile/round-trip; not a source writer defect | One exact qualified-route return must declare units matching its coordinates and bound package. Do not relabel CLO's current output: geometry and marks also differ. |
| Source CUT/SEW geometry | **Passed** at source/package level | S680/S681 cover the 73 supported option configurations and every recipe grade row; source hashes are pinned | Independent of receiver conversion | No source geometry change is supported by current measurements. |
| Returned CUT/SEW geometry at 0.001 cm | **Failed** on CLO S685; other passes are fixture-only and do not qualify a profile | CLO S685: all 9 SEW paths pass; 5/9 CUT paths exceed the gate: back 0.012741 cm, outer stand 0.012977 cm, inner stand 0.013974 cm, upper collar 0.012990 cm, under collar 0.012999 cm. LibreCAD S674 passes 18/18 only for one Polo M, but fails its unit/profile gates. CLO S498/S503/S516/S574/S671–S684 provide repeated measured Polo failures. | Shares the receiver's output-conversion cause with units and marks; still its own fixed gate | No code change is justified without evidence that a specific source serialization defect causes these receiver deviations. A qualifying exact-file round trip must pass every contour at the unchanged 0.001 cm limit. |
| Seven recipes and every supported option | **Passed** for source package generation; **unproven** for receiver exchange | S330/S680/S681 pin 73 valid source configurations across Tee, Fitted, Tank, Polo, Woven, Skirt and Trouser. OpenCAD's 73-case check is generic and is disqualified by malformed-input/profile failures. | Depends on first obtaining an eligible receiver route; missing matrix evidence is not fixed by another source package generation | Use the existing 73-row matrix through the same qualifying route only after a representative pilot passes. |
| Grade/size exchange | **Passed** source-side; **unproven** in an eligible receiver | S678/S681 bind selected size, grade rule and full size run; S559/S562 provide 35 source grade fixtures | Same missing qualified receiver/profile | Demonstrate native grading or the C04-permitted bound sidecar for all admitted recipe grade rows; verify version, revision, association, integrity and limits. |
| Piece, revision and seam identity | **Passed** source package integrity; **unproven** for returned receiver package | S678/S681 bind piece roles, revision ID, drawing hash and stitch graph. CLO S685 output has generic numbered blocks and no source IDs; the CLO trial did not test a returned C04 sidecar. S649 review confirms C04 permits a version-matched sidecar for grade, piece identity and seam relations. | Shares candidate eligibility with grade/seam exchange, but C04 permits a sidecar instead of requiring receiver-native fields | Round-trip the drawing and integrity-bound sidecar through a qualifying route; confirm revision association, piece IDs, grade, seam graph, limits, and rejection of mismatched sidecars. |
| Visible construction marks and mark geometry | **Passed** source-side; **failed** for CLO S685; **fixture-only pass** for LibreCAD S674 | S681 records source mark names, labels, shapes and layers. CLO S685: 100/108 simple source drawing entities match within 0.001 cm; eight do not (one front cut-line, three buttonhole points, four collar notches). LibreCAD S674 matches 38 typed marks on one Polo M, but fails unit/profile qualification. | Shares receiver conversion with units/CUT, and semantic layer loss with identity | A qualifying route must preserve or faithfully represent all mark geometry and typed meaning across the full matrix; sidecar supplements visible marks and cannot replace them. |
| Mark and layer identity | **Passed** source package integrity; **unproven** as returned semantics | Source uses named `CUT`, `SEW`, `MARK_*` layers and sidecar IDs. CLO output uses numeric layers; S685 did not test a returned sidecar binding. C04 sidecars do not excuse missing visible marks or their documented entity/layer type. | Shares receiver serialization/readability; piece/revision fields have a C04 sidecar allowance | Verify returned mark entities and documented type/layer meaning, plus separately verify any permitted, integrity-bound sidecar fields. |
| Malformed/unsupported input rejection | **Failed** for tested CLO and generic OpenCAD cases | S531 CLO DXF-AAMA silently accepted a malformed fixture and omitted its inset SEW contour; S627 OpenCAD accepted malformed non-finite input. S682 records these tested-route limits. | Independent receiver safety gate; passing geometry does not clear this | A qualifying route must visibly reject the existing malformed fixtures without producing a misleading valid-looking output. Do not repeat already failing controls on retired candidates. |
| Repeatable second round trip | **Partial** on generic OpenCAD only; **unproven** for a qualifying route | S627 reports stable second-generation bytes for valid generic fixtures; CLO S685 is one returned generation and fails earlier gates; LibreCAD S674 is one generation | Requires a candidate that first passes unit, geometry, marks and identity | On the same candidate/profile that passes the representative pilot and full matrix, repeat exchange and compare all fixed semantics/geometry. |
| Readable returned output | **Unproven overall**; **failed for specific prior CLO cases** | S684 visually inspected nine CLO piece profiles/marks at import, but did not reopen the returned file after the unit miss; S508 reports collapsed CLO output. S674 saw LibreCAD outlines/layers but no durable fine-detail readability proof. S685 is exact-file numeric comparison, not a receiver screenshot. | Shares generic block/layer identity loss with piece/mark readability, but needs human visual proof | Inspect saved returned output overview and close-ups at useful scale from the qualifying route; retain rendered evidence showing all pieces and marks readable. |
| Legacy DXF and protected export bytes | **Preserved by S676–S685; final integrated proof pending** | Candidate package work is additive; S680/S681 drawing hashes match prior candidates; no S685 production code changed | Separate from receiver route | Run exact protected identity regressions and full 100% global coverage on the settled integrated PR candidate. Do not move baselines. |
| Final output review, PR, merge, ancestry and deployment | **Unproven / pending** | No EPIC-17 PR or merge exists; origin/main at `a5af5e13` is an ancestor of the active branch | Final gates depend on a complete integrated candidate | Complete the full gate, rendered/output review, PR review, safe merge, origin/main ancestry check and required Actions deployment before closing G04/goal. |

## S685 cause determination

The source writer emits centimeters and the exact input passed its manifest
verifier. S685's actual CLO return—not the source package—changes the unit
label, misses five CUT contours and eight mark geometries, and drops named
layer/piece identities. This is measured for this one Polo M Standard DXF route.
It is not evidence that every CLO route fails, but it is sufficient to reject a
unit-label-only source normalizer and to keep this exact route from qualifying.
No safe product-code correction is established by current evidence. Existing
LibreCAD and DGS/OpenCAD results fail separate gates; their passing subchecks
cannot be combined into a fictional composite receiver.

## Prioritized completion path

1. **Stop candidate churn and establish route eligibility.** Reuse the existing
   rights/profile findings. Only reopen a route if it is already available,
   rights-cleared, and has an exact documented apparel profile plus the
   C04-permitted version-matched sidecar contract. Units, geometry, visible
   marks and their documented types remain direct drawing/exchange checks;
   grade, piece IDs and seam relations may use a bound sidecar. **Decisive
   verification:** inspect that exact profile/package contract and its locally
   available import/export controls.
   **Stop:** if no such route exists in the already authorized environment,
   V03 has no evidence-supported completion path without access to a qualifying
   receiver or an explicit change to the admitted requirement. No import trial
   is justified before this preflight.
2. **One representative exact-file pilot on the eligible route.** Reuse the
   current hash-pinned Polo M source and identity sidecar. Verify truthful unit
   declaration, every CUT/SEW path at 0.001 cm, all typed marks and layers,
   piece/revision/stitch identity, and actual readable saved output. **Stop:**
   the first fixed-gate miss; no format/settings/encoding variations without a
   distinct documented cause and gate.
3. **Only after pilot pass, run the existing full matrix once.** Reuse the
   pinned 73 option rows and all recipe grade fixtures; check malformed-input
   rejection, two-generation repeatability, semantics and rendered output.
   **Stop:** any fixed-gate miss; preserve its evidence, do not relax criteria.
4. **Integrated Epic completion.** Run one settled repository-wide 100%
   coverage/build gate, protected export identity checks, final output review,
   PR, safe merge, ancestry and required deployment. Close G04 and the goal only
   after all succeed.

## Remaining decision

The current records do not identify an already available receiver/profile
that satisfies the fixed industrial exchange gates. No maintainer approval or
design decision is pending, and no more CLO, LibreCAD, DGS or OpenCAD trial is
queued. The unresolved prerequisite is a qualifying route, not a source-file
coding change established by the measurements. Until that prerequisite is
met, do not claim V03 complete, weaken acceptance, or spend time on another
source representation without evidence of a causal defect.

## Bounded Sol review and Codex disposition

One read-only S686 Sol review returned `WORK FINISHED`. It found the gate
classifications materially sound and no overlooked existing receiver pass or
causally supported product-code repair. It identified one correction: C04
allows grades, piece identity and seam relations in a version-matched sidecar,
so route eligibility and final proof assess the drawing and bound package
together. Codex verified the accepted C04 contract and S649 review record, then
updated the route, grade, identity and mark/layer rows. S685 did not test a
returned sidecar, so the CLO identity gate remains unproven, not failed. Its
unit, CUT and visible-mark failures remain measured. Reviewer input did not
mark any gate passed.
