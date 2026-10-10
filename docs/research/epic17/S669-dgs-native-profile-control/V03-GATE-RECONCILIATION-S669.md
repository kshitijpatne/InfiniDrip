# G04 V03 gate matrix after S669

This refreshes S660/S667 with the exact S668 product-decoder result and S669
DGS-native export/self-import evidence. A status is specific to the named
candidate, receiver build and settings. The label ASTM/AAMA is not proof of
standards conformance.

| Gate | Status | Strongest current evidence | Shared cause | Remaining proof / change |
|---|---|---|---|---|
| Evaluation rights and local handling | **Passed for bounded evaluation** | Maintainer's explicit written confirmation for CLO product-development evaluation/local files and GetonAgain Free evaluation; all receiver data stays under the approved C: folder. | Rights are candidate/use specific; independent of fidelity. | None unless a new contrary fact appears. |
| Receiver/profile identity and conformance claim | **Unproven** | CLO 2026.1.310 DXF-AAMA and GetonAgain DGS `VID:20250610` modes observed. No tested route passes the admitted exchange; DGS's S669 native ASTM export contains 10 metadata TEXT entities and no geometry. | A menu label identifies a UI mode, not an interoperable profile. | Pick a route only from a passing representative import/export/round trip; describe CLO or other route as vendor-specific empirical. No normative claim absent conformance evidence. |
| Units, orientation, origin, scale, precision | **Failed for S667 DGS AutoCAD/Design; unproven for a passing route** | S667 changed `$INSUNITS` 5→4 without numeric scale conversion; physical residual reached 191.201177 cm. S669 has no `$INSUNITS` and no geometry. | Unit declaration and numeric coordinate behavior must be checked together. | A passing candidate must preserve source units and map coordinates within `0.001 cm`, without best-fit alignment. |
| Validity and CUT/SEW geometry | **Failed on tested CLO Polo CUT routes and S667 DGS export; S668 DGS product import failed** | S640: 4/9 Polo CUTs pass; five fail before export. S643 shows deleting their vertices changes source CUT by 0.012741–0.013974 cm. S668: DGS ASTM/AAMA Pattern import blank/0. S669 self-export: zero geometry. | Shared source-to-receiver representation behavior; geometry cannot be repaired by relaxing tolerance or deleting source vertices. | Use the already-measured route evidence. New encoding only with an exact semantic hypothesis and a distinct gate; no source geometry edits. |
| Seven recipes, all supported options and grades | **Unproven** | S459 covers seven recipes/73 supported options/146 front-back V02 views. No CAD receiver completed that matrix; CLO/DGS trials are narrow. | Depends on representative valid round trip and option/grade identity. | After a passing representative receiver route, run all seven recipe fixtures, 73 supported configurations, and grade matrix through the frozen profile. |
| Garment/piece/revision identity and relations | **Failed for S667 DGS AutoCAD export; unproven on a passing candidate** | S667 flattened 9 source INSERTs/11 blocks and omitted profile; CLO retained nine names on some imports, but CUT failures prevented full identity qualification. S669 has no blocks. | Native identity and C04 version-bound sidecar relationships must be proven together. | Preserve piece/revision identity and version-bound sidecar; verify mismatch rejection and all seam/grade relations. |
| CUT/SEW layers, notches, allowances, marks, grainline | **Failed on specific paths; otherwise unproven** | S667 flattened layers; CLO S637/S639 mark losses/substitution; DGS S664 grainline warnings and S669 no-geometry output. | Entity semantics and renderer presentation. | One-to-one source/receiver marks, placement/value, layers and grainline plus detailed rendered crops. |
| Warning-free valid import / malformed rejection | **Failed on tested CLO malformed case; DGS product import silently blank; otherwise unproven** | S531 CLO silently accepted malformed input and omitted SEW; S626 OpenCAD accepted nonfinite input; S668 DGS blank import without warning. | Parser failure policy separate from valid fidelity. | Reuse existing negative fixtures only after a valid representative exchange exists; explicitly reject without partial output, repair or clamp. |
| Repeatability and round trip | **Failed or unproven** | CLO stops at geometry/marks in measured cases; DGS S669 output has no geometry and imports 0/0; generic OpenCAD byte repeatability does not qualify industrial apparel CAD. | Requires a valid first round trip and stable semantic/geometry mapping. | Two frozen-revision rounds must preserve geometry, marks, units, identity and sidecar. |
| Readable receiver output | **Unproven** | CLO gross overviews exist; detailed failed paths did not pass; S668/S669 actual DGS renders are blank. | Depends on all source geometry/marks appearing at useful scale. | Actual whole-layout plus detail views, reviewed for readability across seven recipes/options. |
| V02 prerequisite | **Passed** | S459 integrated render review: 7 recipes, 73 configurations, 146 faces. | None. | No V02 rework absent an exchanged-output regression. |
| Legacy DXF and protected output identities | **Passed to date; final candidate gate pending** | No producer/baseline change in S667–S669. | Any production serializer change. | Keep old DXF behavior and bytes; run protected identity and global regression gates on the final candidate. |

## Decision

DGS is retired on the tested product decoder and observed export routes. S669
is not a successful native positive control: DGS flagged the control as missing
a name and having a grainline outside its border, and emitted no pattern
geometry. A single S670 may resolve that specific validity defect from the
installed first-party instructions; otherwise retire DGS without another
permutation. Existing CLO failures remain candidate-specific and all V03
acceptance/holds remain unchanged.
