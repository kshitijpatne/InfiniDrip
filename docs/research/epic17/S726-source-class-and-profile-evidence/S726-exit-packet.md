# EPIC-17 / G04 — S726 source classes and empirical profile closeout

## Boundary and result

- Started 2026-10-11 06:37 UTC from S725 commit `29ef0961c2794baf2368c6a4f767a5e092e48c6b`; branch `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S726 was the next unique slice. Board start revision: 4238.
- Validated board exit evidence `E-G04-S726-EXIT` and the acceptance/closeout note are recorded at revision 4245; G04-V03 and EPIC-17 remain In Progress through the integrated release gate.
- S726 closes the source-output, receiver-fixture coverage, receiver rights/profile, and grade-boundary evidence questions using only existing sources and the installed LibreCAD 2.2.1.5 session. No new software, format, setting, or encoding was tried.
- S726 changes no production code, pattern geometry, source stitch graph, legacy DXF behavior, threshold, or protected export baseline.

## Evidence and acceptance clarification

The S725 source matrix contains 365 verified packages (73 supported option scenarios × five sizes) and 315 distinct normalized geometry signatures. A receiver save for each exact coordinate shape would therefore require 315 saves while repeating the same DXF entity and semantic behaviors. The ten current LibreCAD fixtures instead cover ten distinct exchange-structure classes: one each for Tee, Fitted, Tank, Skirt and Trouser; two for Polo; and three for Woven shirt. Each class is represented by an actual saved return, and all ten returns pass the unchanged source-bound audit. The class key is documented in the C:-only `S726-fixture-class-matrix.json`; it uses recipe and piece-role multiplicity, fold and edge roles, CUT/SEW entity form and closure/bulges, mark layers/entity forms/multiplicity, and stitch endpoints/ease presence. It does not pretend that ten fixtures cover all 315 exact shapes.

The maintainer directed that V03 acceptance be corrected to reflect the product's actual contract and stop treating repeated CAD saves of coordinate-only variants as distinct interchange behavior. The clarified criterion is:

1. Verify every supported recipe, option scenario, and grade size on the product side against the source-bound DXF/manifest checks. S725 passes 365/365.
2. Verify the receiver route with at least one current, source-bound, saved/reopened fixture for every distinct serialized exchange-structure/semantic class across all seven recipes. If a supported option changes that structure class, it requires its own representative. Audit every selected return at the unchanged 0.001 cm limit and inspect its rendered output. Add an explicit non-default grade boundary representative.
3. State compatibility only for the exact LibreCAD build, DXF 2000 workflow, and individual returned fixtures actually audited and reviewed. Do not imply that the receiver round-tripped all 315 geometric signatures or every coordinate row.

This clarification preserves all seven recipes, every option and grade in source-package verification, the selected-return fidelity threshold, all existing identity/units/CUT-SEW/mark/readability gates, repeatability, malformed-input behavior, legacy export behavior, and protected byte identities. It does not assert receiver interpretation of option/grade/stitch data stored only in the digest-bound manifest. The previous literal “one receiver fixture for each materially distinct normalized geometry signature” is superseded because normalized dimensional variants are not distinct serialized exchange behavior. This scope change is recorded explicitly, not represented as passing the 315-shape receiver test.

The ten current receiver fixture IDs are `tee-default-M`, `fitted-default-M`,
`tank-default-M`, `polo-default-M`, `woven-shirt-default-M`,
`skirt-default-M`, `trouser-default-M`, `polo-sideVentDepth-min-M`,
`woven-shirt-combined-supported-M`, and `woven-shirt-sideVentDepth-min-M`.
S726 adds `trouser-default-XL` as the explicit grade-boundary fixture. The
source matrix hash is `69627e68f8d8e1c724c91d23fb885cbbc6b9fbccc42512d1d4c3e19ef14d8739`.

## Exact receiver and rights boundary

- Receiver: LibreCAD 2.2.1.5, locally installed at `C:\Program Files\LibreCAD\LibreCAD.exe`.
- Profile: UI `Save As → Drawing Exchange DXF 2000`; one save, close, and reopen; then run the unchanged source-bound round-trip auditor.
- Handling: the source, return and screenshot remain in named folders on drive C:. The observed test did not use a hosted converter or upload flow.
- Rights basis: the exact [upstream v2.2.1.5 tag license](https://github.com/LibreCAD/LibreCAD/blob/v2.2.1.5/LICENSE) states GNU GPL version 2; the [matching upstream release](https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5) identifies that build. The [FSF GPLv2 text](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html) says running the program is unrestricted. The maintainer separately confirmed permission for product-development evaluation and local file handling. This is a documented basis to perform this evaluation, not legal advice about other bundled material.
- Claim: empirical compatibility on the exact fixtures below only. LibreCAD is a general 2D CAD program. No ANSI/AAMA/ASTM conformance, industrial-apparel certification, universal DXF support, physical fit, factory acceptance, or production-readiness claim.

## Grade-boundary round trip

The existing verified Trouser default XL package was saved once in LibreCAD 2.2.1.5 as Drawing Exchange DXF 2000 to `C:\G04-CAD-Interchange\S726-source-class-and-profile-evidence\trouser-default-XL-librecad-return.dxf`. The saved file was closed and reopened in the still-running LibreCAD session. The production source-bound auditor passes: 9 pieces, 18 outlines, 103 typed marks, and 0.000 cm maximum geometry delta (fixed limit 0.001 cm). The whole reopened layout was visually inspected; the separated outlines and marks remain visible without a crossing or overlap. Audit JSON and actual reopened screenshot are in that C:-only evidence folder.

XL source revision `8ae9462579dc1753dc48c2eebef6550144504bee37e3023b86b1d75539abc346`, source drawing SHA-256 `44c1c0936116a9abe627a24de9648a16a3d71948afd96b11070ac6042c43b8c0`, and returned drawing SHA-256 `804a12c0e7c8f468050607f63ac52f7685c04f1c96a2e60c54087a61e9c07674` bind this exact check.

## Gate reconciliation

| V03 gate | Status | Strongest evidence and bound | Remaining proof / shared cause |
| --- | --- | --- | --- |
| Product source packages for all recipes/options/grades | **Passed** | 365/365 source-bound packages across seven recipes, 73 option scenarios and five sizes, matrix SHA-256 `69627e68f8d8e1c724c91d23fb885cbbc6b9fbccc42512d1d4c3e19ef14d8739`. | None for the current source. Re-run only if candidate source changes. |
| Rights, exact receiver, version and workflow | **Passed for the bounded evaluation** | Maintainer's local product-development permission; exact LibreCAD GPLv2 tag; observed build and DXF 2000 Save As/close/reopen workflow. | Does not authorize redistribution of LibreCAD or support a standards/industrial claim. |
| Receiver fixture class coverage | **Passed under the clarified exchange-structure criterion** | Ten named current-source fixtures cover 10/10 distinct exchange-structure classes; no class uncovered. A Trouser XL boundary return adds explicit grade-boundary evidence. | The receiver did not test every one of the 315 normalized shapes. That broader claim is expressly excluded. |
| Selected-return geometry, identities, units, CUT/SEW and marks | **Passed for 11 selected fixture returns** | Ten S724/S725 bound returns plus S726 Trouser XL; all 11 pass the existing auditor at 0.000 cm with expected pieces, outlines, marks and centimeter units. Fixed limit remains 0.001 cm. | Claim stays fixture-specific; no assertion about unselected geometric rows. |
| Receiver repeatability | **Passed for one semantic repeat** | Tee default M was independently saved/reopened twice; both audits pass with identical semantics and 0.000 cm geometry delta. | No claim of repeated behavior across every receiver class. |
| Readable reopened output | **Passed for 11 selected fixtures** | Ten S725-selected fixture drawings were visually reviewed; S726 reopened and inspected the XL boundary return. | Claim remains limited to those saved/reopened outputs. |
| Product malformed/unsupported-input fail-closed behavior | **Passed for recorded local cases** | S716–S718 exercise the product's actual local auditor/panel, including seven S718 negative cases, with no partial acceptance and accessible exact errors. | This is product behavior, not a claim about LibreCAD's malformed-file handling. |
| Legacy DXF and protected export identities | **Passed in focused regressions; final integrated gate pending** | S725 focused legacy/export identity suite passes without baseline changes. | Re-run once in the settled PR candidate's full gate. |
| Full repository gate, final integrated outputs, cleanup, PR, merge, deployment and production E2E | **Unproven** | Not an S726 gate; no release action is claimed. | S727 integrated candidate and release sequence. |

## Verification, timing, and next action

- LibreCAD grade-boundary save/reopen confirmation: saved path and reopened path both recorded in the application; same source output was not modified.
- XL source-bound audit: passed (9 pieces, 18 outlines, 103 marks, 0.000 cm maximum delta).
- Class matrix: 365 packages, 315 normalized geometric signatures, 10 exchange-structure classes, 10 selected receiver fixtures, zero uncovered structure classes.
- No production source/test code changed; no changed-code coverage run was due. The focused source-bound receiver audit and prior focused production/export gates are recorded above. Control Center validation tests and `git diff --check` are run after durable record and board updates.
- Timing: implementation/evidence reconciliation 9 minutes; focused receiver and package verification 5 minutes; durable docs/board validation and final review 7 minutes; external-agent wait 0 minutes; maintainer-decision wait 0 minutes. Total S726 duration: 21 minutes.
- The S700 diagnostics remain untouched and unstaged. All receiver artifacts and screenshots remain under `C:\G04-CAD-Interchange\`.
- V03 technical acceptance is complete under the explicit clarified scope. EPIC-17 remains In Progress while the settled integrated full gate, final minimal-file cleanup, PR, safe merge, ancestry, required deployment, and production end-to-end verification remain.
- Next: S727 is the single integrated Epic/PR candidate gate and closeout preparation. Do not reopen receiver research or install another application.
