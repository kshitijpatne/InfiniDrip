# EPIC-17 / G04 V03 — Standard-DXF connected-LINE import check — Slice 622 exit

## Result

CLO 2026.1.310 (r58944) accepted the hash-pinned S574 Polo M connected-LINE DXF through **Standard DXF** import with centimeters, 100%, no rotation, Maintain Original grain angle, swap off, auto-distribute off, Optimize All Curve Points off, Import Draw Curve Points on, Remove Non-Grading Points off, annotations off, and auto-trace off. With swap off, CLO disabled the dependent Include Notches control; the remaining visible values matched the S574 baseline. CLO showed nine patterns, returned the read-only native-geometry queries without errors, and rendered nine pieces. No import error appeared.

The native cut/sew comparison **fails** the unchanged `0.001 cm` (0.01 mm) gate. Comparing every source contour to every returned native child shape, without relying on CLO's pattern order or the undocumented `Base Line` label, the nearest cut candidates pass for **4/9** contours and the nearest sew candidates pass for **4/9**. The failing source contour ordinals are 1, 5, 6, 7, and 8. Their conservative upper-bound deviations are:

| Source contour | Native pattern name | CUT deviation | SEW deviation |
| ---: | ---: | ---: | ---: |
| 1 | 5 | 1.86781 mm | 0.45497 mm |
| 5 | 0 | 2.33035 mm | 0.45187 mm |
| 6 | 1 | 2.34013 mm | 0.44230 mm |
| 7 | 2 | 93.11350 mm | 0.45184 mm |
| 8 | 3 | 93.11350 mm | 0.45179 mm |

For the five CUT misses, candidate identities are checked against all nine native patterns; no alternate returned shape comes within tolerance. CLO's reported coordinates align numerically with this centimeter DXF. Both sides were converted to millimeters for measurement, with no translation, rotation, scale fitting, or vertex relocation. The source-to-input line-chain check stays within the gate (conservative bound 0.005 mm for each contour), so these mismatches are not attributable to changed CUT vertices in the disposable fixture.

S621's AAMA swap-on import used the same input hash and passed all 9 SEW contours while failing all 9 CUT contours. Standard DXF recovers four CUT matches on this fixture but fails five; it also fails five SEW matches that pass under AAMA. This comparison is bounded to the exact fixture, CLO build, observed profile settings, and queried native geometry. The raw CLO shape name does not establish which internal import stage or DXF layer role produced it.

**No DXF export was attempted.** The pre-export geometry gate failed, so the guarded workflow forbade proceeding to output or round-trip tests on this Standard-DXF candidate. The rendered snapshot shows all nine outlines and internal lines, but rendering does not override the numeric failures. This closes the Standard-DXF profile trial for this fixture without changing V03 acceptance, threshold, all-seven scope, or any other hold.

## Evidence

All application files and rendered evidence are under `C:\G04-CLO-DXF-Exchange\S622-standard-dxf-connected-line-import\`:

- Input: `Input\polo-source-m-cut-lines.dxf`, SHA-256 `A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675`. The original source and derivative report are independently hash-pinned by the comparison helper.
- CLO project: `Project\clo-standard-dxf-connected-line-import.zprj`, SHA-256 `4828A5A3FBA81A10CEFA179BE5D95C85055108E6731D12315145513223286A0F`.
- Read-only API result: `Evidence\preexport-input-information.json`, SHA-256 `F826186542EAA39785D5266718B448628B15B210344918517F2829E10629105B`; 9 patterns, 0 getter errors.
- Geometry analysis: `Evidence\preexport-cut-sew-comparison.json`, SHA-256 `A62100C92A1DD8160BBA2B3DD1CF7C0ED7C6BFDCAFD6FEE75CFB1D144F770DDB`; produced by `analyze-standard-import-geometry.mjs`. It pins the input, source, S574 derivative, project, prior AAMA comparison, and rendered evidence hashes; records only CLO child contours whose line count equals their point count, plus candidate ties and conservative bounds.
- CLO-native 2D snapshot: `Evidence\standard-dxf-import-scene.pdf`, SHA-256 `60CBE775239095EB5986F76B6916523EBF5B0AC718053FD489716AB478E07694`; rendered PNG `Evidence\standard-dxf-import-scene-1.png`, SHA-256 `B35AE71EF0EA3812100EC7E27026A471C82F6679AC78B7A9A127C225E83299C1`. The 2017 × 1374 output was visually inspected; all nine pieces fit in frame with their linework visible.
- The `Output` folder is empty. No outbound DXF, cloud transfer, or export/reimport was made.

## Gates and next action

- **Pass:** authorized local trial; hash-verified input and project; Standard-DXF import accepted without error; 9 patterns returned; rendered snapshot reviewed; query API returned 0 errors; source CUT line-chain preprocessing retains the source vertices within the fixed tolerance.
- **Fail:** native CUT geometry is within tolerance for 4/9 only; native SEW geometry is within tolerance for 4/9 only. Standard-DXF import does not clear this fixture's required pre-export gate.
- **Not run:** DXF export, output parse, round trip, other sizes/options, other recipes, profile-wide capability or conformance. No acceptance gate is inferred from nine visible pieces.
- **Unchanged:** V02 remains Done; V03 and EPIC-17 remain In Progress. All seven-recipe coverage, receiver/profile rights and scope, geometry semantics, marks, grading/options, malformed-input rejection, repeatable round trip, output readability, exact-compatibility evidence, legacy DXF behavior, protected export identities and the `0.001 cm` threshold remain in force. No physical fit, factory acceptance, or production-readiness claim is made. CLO remains open for the continuing goal.
- **Next:** discontinue import-profile permutations on the S574 line-chain fixture. Qualify one technically distinct receiver/exchange candidate against the already-recorded written rights and local-handling authorization before any files are supplied to it. Carry the measured S622 evidence forward; do not start another attempt without a new bounded question that addresses the observed native-geometry loss.

## Verification and timing

- Helper validation: `node --check`, start/exit preflights, hash-pinned geometry analysis, validated Control Center board replay (3624→3627), `npm run control-center:test` (42/42), and `git diff --check` pass. The measured geometry gate intentionally reports fail (4/9 CUT, 4/9 SEW); this is the test outcome, not a failed script assertion.
- CLO rendered output was reviewed; no DXF output exists to review.
- Focused repository validation and validated board exit replay are recorded at the boundary. Research/evidence only; no production source or tests changed, so changed-code coverage and the full repository gate are not due for this slice. Preserve the single full repository coverage/build gate for the settled integrated Epic/PR candidate.
- Started 2026-10-09 13:49:32 UTC; closed 2026-10-09 14:18:43 UTC (29m11s). CLO import/native query/snapshot: about 9m; geometry analysis/helper implementation and comparison: about 13m; focused verification and durable packet/state/board work: about 7m11s; external-agent waits: 0; maintainer-decision time: 0.
