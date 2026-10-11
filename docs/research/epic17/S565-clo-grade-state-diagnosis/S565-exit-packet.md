# EPIC-17 / G04 V03 — CLO graded-state diagnosis — Slice 565 exit

- Closed: 2026-10-09 03:15 UTC.
- Start: 2026-10-09 02:51:30 UTC; start commit S564 `a521b01`.
- Branch: `codex/epic-17-g04`; start board revision 3373, after exit replay
  revision 3375. `origin/main` was `a5af5e1` at slice start and an ancestor.
- CLO 2026.1.310 remains open. Product-development and local-file-processing
  authorization are recorded in `docs/PROJECT-DECISIONS.md`.
- C:-only evidence directory:
  `C:\G04-CLO-DXF-Exchange\S565-clo-grade-state-diagnosis`.

## Finding

The correction was made only in the disposable CLO project. In the selected
Size Group 1 waistband piece, CLO's grading-point editor showed the two
left-side CUT vertices carrying +20 mm offsets at each size step. The source
grade map requires those left coordinates to stay fixed; the right-side CUT
vertices carry the +20 mm width increase. This explains the S564 constant
waistband width: equal translation of both sides preserves width. The left
CUT offsets were set to zero for XS→S→M→L→XL while right CUT offsets remained
20 mm. No product or source pattern was edited.

The corrected DXF was exported as DXF-ASTM / Graded Nest, centimeters, 100%,
Do Not Rotate, with grading and base sizes included. The reproducible S564
analyzer compared its five `2_<size>` waistband blocks against the S559 source
fixtures using the unchanged 0.001 cm contour gate:

| Size | Waistband CUT residual | Nearest waistband SEW residual | Waistband contours passing |
|---|---:|---:|---:|
| XS | 0.000015 cm | 0.000015 cm | 2/2 |
| S | 0.000015 cm | 2.000000 cm | 1/2 |
| M | 0.000015 cm | 2.500000 cm | 1/2 |
| L | 0.000015 cm | 2.915463 cm | 1/2 |
| XL | 0.000015 cm | 2.915463 cm | 1/2 |

The CUT outline therefore matches all five source sizes. The larger-size
SEW contour does not. For L and XL the nearest candidate is an output
polyline without a proven semantic SEW identity; these residuals demonstrate
that no tested candidate satisfies the source contour gate, not which
receiver layer is the intended SEW line. The selected export contains the
waistband group only; the absent front/back contours are outside this
diagnostic's scoped comparison. This is a partial correction, not a graded
garment pass.

The same CLO session re-imported the corrected DXF with Open, DXF-ASTM,
centimeters, 100%, Do Not Rotate, Maintain Original, and notches enabled.
CLO displayed its notice that seam allowances were absent and the shape was
preserved in Custom mode. The actual UI capture shows one waistband outline,
not a five-size overlay. Thus the tested re-import does not prove multi-size
visual round-trip behavior.

## Evidence and hashes

All source/export files and the actual rendered UI capture remain on C: in the
directory above. Key SHA-256 values:

- Corrected disposable project: `s565-corrected-grade-trial.zprj` —
  `CD2D620B42148A21E800F6D7DD6183757955B2BEC19FD745BB86FDCD3D3B8423`.
- Corrected DXF: `s565-corrected-sizegroup1.dxf` —
  `31D6047E361B614781954D0F9A0858C3A80BFA4E6D61BC309E4D86E545476DC6`.
- Analyzer report: `s565-corrected-sizegroup1-analysis.json` —
  `FA6330473157DE458B36B4060D245097E128F63CA8F58377B50AB6A299A84C81`.
- Re-import workspace: `s565-corrected-reimport-workspace.zprj` —
  `CF3ED5C0C450082122E59E906D8E8471FAFDA0213FAE3998CC83C838D9307225`.
- Actual UI image: `s565-corrected-reimport-ui-actual.png` —
  `16F8123EFE6CEBD70CE85502A6FADF50F31125148A1FF3B67C8479ED5DB49E47`.

Analyzer: `docs/research/epic17/S564-clo-native-size-group-probe/analyze-s564-clo-graded-nest.mjs`.
No code, pattern, grade rule, acceptance threshold, legacy behavior, protected
export identity, V02 criterion, or V03 criterion changed. No normative
industrial conformance, all-seven-recipe compatibility, or production claim
is made.

## Slice closeout

- Scope result: diagnosed and corrected the tested CUT point assignment; the
  graded waistband SEW path and same-app multi-size round trip remain held.
- V03 remains In Progress. No profile/rights decision, all-seven-recipe
  evidence, semantic/marks checks, malformed-input checks, or full round-trip
  evidence is cleared by this slice.
- Board: S565 exit evidence and comment are replayed through the validated
  command layer at revisions 3375→3377. All V03 gates remain unchanged.
- Focused verification: rerun the analyzer against the saved DXF and compare
  the SHA; run the Control Center test suite and `git diff --check` at close.
  No production code changed, so no changed-code coverage or full repository
  gate is due.
- Timing (session estimate): implementation/UI/export/import 19 min;
  focused comparison, rendered review and closeout 5 min; external-agent waits
  0 min; maintainer-decision time 0 min.
- Next action: at S566 start, freshly verify Git, board and slice history;
  inspect source-to-CLO SEW-line identity for the corrected waistband and
  design one bounded test that can distinguish the source SEW contour from
  CLO's coincident/internal lines. Do not relax the 0.001 cm gate or claim
  V03 acceptance from this partial result.
