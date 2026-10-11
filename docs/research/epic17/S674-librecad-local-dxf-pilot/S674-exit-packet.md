# S674 exit — LibreCAD 2.2.1.5 R12 exact-fixture pilot

## Result

S674 closes after the one authorized native import/export/re-open pilot. LibreCAD 2.2.1.5 opened the hash-pinned Polo M DXF, saved one R12 DXF, and cleanly re-opened that exact saved file without a warning dialog. The empirical result is mixed and **does not qualify a V03 profile**. No standard conformance is claimed.

The source fixture is `C:\G04-CLO-DXF-Exchange\S671-polo-cut-source-path-density\Input\polo-standard-m-cm-units-header-exact-path-density.dxf`, SHA-256 `487fad7533bda83306d3f4fa2dfef523e469e62f3d808eff0a9c98a7e38b77f8`. The saved output is `C:\G04-LibreCAD-Exchange\S674-librecad-r12-profile\RoundTrip\polo-roundtrip-r12.dxf`, SHA-256 `d904829c08ecb50c972f9e7427326e39494ff2294f4a5f0cc03a49b00cdec2ea`. The installed receiver was LibreCAD 2.2.1.5. All imported/exported DXF and generated parse evidence stayed within the named C: exchange folders.

## Measurements and rendered review

The source is AC1015 with `$INSUNITS=5` (centimeters): 18 `POLYLINE` paths (9 CUT, 9 SEW), 14 LINE, 21 POINT and 3 CIRCLE entities across eight semantic layers. LibreCAD wrote AC1009 (R12) and omitted `$INSUNITS`. All 18 CUT/SEW paths preserve their vertex count, closed state and bulges; maximum coordinate residual is `0 cm` against the unchanged `0.001 cm` gate. All 38 typed marks match one-to-one with `0` coordinate/radius residual. All eight layer names survive. The report is `C:\G04-LibreCAD-Exchange\S674-librecad-r12-profile\Evidence\Analysis\librecad-r12-roundtrip.json`; the repeatable analyzer is `analyze-librecad-r12-roundtrip.mjs`.

During the native open and clean re-open, the actual LibreCAD 2D view visibly rendered the pattern geometry and the layer list retained CUT, SEW and all MARK_* layers; the clean re-open status named the saved C: file and displayed no import warning. This establishes a rendered open/re-open observation only. A durable image capture is not in the evidence folder, and source piece/revision labels, detailed mark legibility at fit, sidecar binding, and apparel-CAD readability were not proven. Do not mark the readable-output gate passed from the visible outlines alone.

## Gate disposition for this candidate

- **Passed:** exact CUT/SEW coordinates and bulges at `0.001 cm`; all 38 typed marks; all eight semantic layer names; clean re-open with no warning observed.
- **Failed:** unit self-description. The centimeter source header is absent from R12 output, so the file does not carry an unambiguous unit interpretation. No external unit manifest was part of the tested profile.
- **Unproven:** source piece/revision identity (fixture has no identity payload), repeatability (only one generation was authorized), grade/options, malformed-input rejection, seven recipes/73 options, full readable output, apparel-specific semantics, and industrial apparel-CAD qualification.
- **Unaffected/pending:** legacy DXF behavior and protected byte identities were not modified; final regression evidence is still required at the settled Epic candidate.

The missing unit header is sufficient to stop this exact R12 profile under the fixed units gate. Do not compensate by assuming the receiver's local unit setting, infer centimeters from coordinates, or run another format/setting variation under S674. The profile is a generic-CAD empirical observation, not an industrial apparel profile. No ANSI/AAMA/ASTM claim, production-readiness statement, physical-fit claim, or factory-acceptance claim is supported.

## Process and next action

The comparison script's first draft had two zero-advance parser loops. The pilot comparison was stopped, both record-walker cases were corrected, and the analyzer was rerun to completion. The final report distinguishes coordinate residuals from bulge residuals and labels source identity/repeatability as unproven rather than failed. The analyzer exits successfully and verifies the pinned input hash before comparing records.

No production source, export baseline, or acceptance criterion changed. V01/V02 remain Done, V03 and EPIC-17 remain In Progress, and all existing V03 gates remain. The next action is a bounded V03 route decision based on the reconciled evidence: identify a rights-cleared industrial apparel-CAD receiver/profile with an explicit unit/identity contract before any more software or format trial. If no such route is in the already approved environment, stop candidate churn and report the smallest access/scope decision; do not select a new candidate silently.

## Verification and time ledger

- Focused verification: analyzer passed; 18/18 paths exact; 38/38 typed marks matched; eight layers equal; input/output hashes pinned.
- Control Center focused test: `npm run control-center:test` passes 42/42 after board replay (revision 4010). `git diff --check` passes; only existing LF-to-CRLF warnings were emitted.
- Production changes: none; changed-code coverage is not applicable. Full repository coverage/build/render/legacy/protected-identity gates remain for the settled integrated Epic/PR candidate.
- External-agent wait: `0 min` during closeout; no independent, disjoint low-risk task was available.
- Maintainer-decision time: `0 min` during closeout; no design decision was requested.
- Implementation/receiver wall-clock window: from S674 start `2026-10-10 11:36:37 UTC` through this exit at `16:58 UTC`, about `5 h 22 min`; active time was not separately instrumented, and the wall-clock interval includes installer/elevation and unattended waits.
- Focused verification wall time: final analyzer run about `1 s`; Control Center suite about `2.1 s`; `git diff --check` about `1.4 s`. Earlier UI interaction and parser debugging time were not separately instrumented.
