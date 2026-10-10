# G04 V03 gate matrix at S691

This matrix reconciles the current package source, the measured LibreCAD
DXF 2000 result, and prior receiver evidence. “Passed” is limited to the
named scope in its evidence; source-package success is not a receiver pass.
No outputs from different receivers are combined into one compatibility claim.

## Candidate disposition

The one new measured positive result is **LibreCAD 2.2.1.5, Drawing Exchange
DXF 2000 / AC1015, centimeters (`$INSUNITS=5`)**. S674 documents LibreCAD as
generic 2D CAD. C04 and G04 admission require a named apparel/industrial CAD
receiver/profile; therefore LibreCAD is not eligible to close that gate under
the unchanged acceptance. Its S690 evidence is useful generic-DXF evidence,
not a qualifying apparel/industrial receiver result.

Keep the two product-side profile labels separate. The current S681 sidecar
schema is `infinidrip.g04.dxf-package/2`, with profile label
`generic-dxf-centimeters-with-recipe-marks`. `idr-pattern-exchange/2` is the
separate DGS grainline/XDATA candidate tested unsuccessfully in S668. Neither
name turns generic DXF into an apparel profile. Any future receiver route must
define how a version-matched sidecar is associated with the rewritten returned
file, because the source manifest binds exact drawing bytes and S681 also
binds one-based entity positions.

## Acceptance gate dispositions

| Gate | Current status | Strongest current evidence | Shared cause / remaining proof |
|---|---|---|---|
| Rights and local handling | **Passed for bounded LibreCAD evaluation** | S674 records first-party GPLv2/free local-app evidence; S690 inputs, outputs, analysis and renders stayed under `C:\G04-LibreCAD-Exchange\...`. | Candidate/use specific. Reconfirm exact build/profile description in final packet; no hosted service was used. This is not legal advice. |
| Exact receiver/profile and compatibility claim | **Failed eligibility for LibreCAD; no surviving route selected** | S674 first-party preflight classifies LibreCAD as generic 2D CAD; C04 §§675–725 and admission §1629/§1646 require an apparel/industrial receiver/profile. CLO and DGS are apparel candidates but their tested routes fail measured gates. | Do not run the proposed LibreCAD identity pilot under unchanged acceptance. Re-entry requires a specifically named, permitted local apparel/industrial receiver and its documented input/sidecar contract. No menu label is a conformance claim. |
| Units, orientation, origin, scale and precision | **Passed on the S690 fixture; full profile unproven** | S690 output is AC1015 / `$INSUNITS=5`; 18/18 path coordinates/closure/bulges are exact at 0.000 cm residual against the fixed 0.001 cm gate. | S690 used the S671 Polo M fixture, which contains no package identity payload. Confirm these properties again on the current S681 package and later option/grade matrix. |
| CUT/SEW contours and topology | **Passed on the S690 fixture; identity-rich/full matrix unproven** | Same 18 source/output paths, exact vertices, closure and bulges; output uses equivalent `LWPOLYLINE` entities. | The S681 package adds current stable piece identity and the accepted v2 package structure. Run one exact same-route round trip of that fixture; stop on any lost/changed/ambiguous path. No source geometry repair is supported by current evidence. |
| Typed marks, semantic layers and grainlines | **Passed on the S690 fixture; current package coverage unproven** | S690 matches all 38 `LINE`/`POINT`/`CIRCLE` marks and all eight layer names exactly. S677/S681 prove the source package emits marks/grainlines and binds mark IDs, types, source geometry, layers and entity positions. | The older S671 fixture is not the S681 identity-bound package. Check exact visible shapes and their source-bound mark identities on the S681 fixture and later all-seven matrix. A sidecar cannot replace missing visible marks. |
| Piece, revision, grade identity and seam relations | **Passed at source-package level; receiver unproven** | S680/S681 generate package pairs across 73 supported options and every registered recipe grade row. S681 binds stable piece/mark identities and revision/drawing digest. | S690's fixture has no identity payload or sidecar. Only after receiver eligibility is proved may a representative fixture test separately selectable pieces, seam relationships and a version-matched returned-sidecar association with mismatch rejection. Never reconstruct lost receiver geometry or infer identity from labels alone. |
| Seven recipes, 73 supported options and grades | **Passed at source; receiver unproven** | S680/S681 verified all 73 canonical option packages; source grade rows are recorded for all seven recipes. | Only one Polo M fixture has been round-tripped in LibreCAD. After its identity-rich pilot passes, replay the existing 73-row/options and grade fixtures through the same exact profile. Do not infer breadth from source renders or OpenCAD's separate generic result. |
| Malformed/unsupported input rejection | **Unproven for LibreCAD** | Existing negative fixtures identify concrete prior fail-open behavior in CLO and OpenCAD; DGS's v2 import silently yielded blank 0/0. | Use the existing malformed/unsupported fixtures against the exact selected route only after a valid identity-rich pilot passes. Require clear rejection with no partial drawing, silent repair or clamping. Do not repeat a known failure in a retired route. |
| Repeatability and round trip | **Unproven for LibreCAD** | S690 is one import/save/clean-reopen, not a second export. Generic OpenCAD's separate repeatability result cannot be combined with LibreCAD. | Same fixed LibreCAD build/profile must complete repeated generations with identical semantic/geometry checks and accepted C04 identity. |
| Receiver readability and piece selectability | **Unproven** | S690 includes actual overall and magnified LibreCAD views; only contours and mark glyph presence were established. Neither piece selectability nor full labels/identity/grade/workroom readability was proven. | An eligible receiver must keep every pattern piece separately selectable. Inspect whole/detail actual receiver output with labels, identity, marks and grade visible; distinguish documented informational messages from loss/validity warnings. Retain captures outside Git. |
| Legacy DXF and protected export byte identities | **Preserved to date; final gate pending** | S676–S681 are additive candidate/package work; S681 records all 73 candidate DXF hashes identical to S680 and protected/legacy tests passing. S690 changes no product source. | Run protected export identity regressions on the settled integrated PR candidate; never move a baseline without explicit documented approval. |
| V02 prerequisite | **Passed** | S459 records seven recipes, 73 configurations and 146 accepted front/back faces after output review; the board retains V01/V02 Done. | No V02 changes are indicated by CAD evidence. Do not reopen approved mappings. |
| Integrated tests, final review, PR, merge, ancestry and deployment | **Pending** | No PR/merge is recorded; S690 is partial receiver evidence only. | Run one global 100% coverage/build/output gate on the settled candidate, review final outputs, open/review/merge PR, verify refreshed `origin/main` ancestry and required automatic deployment. |

## Candidate evidence that is not combined

- **LibreCAD 2.2.1.5 DXF 2000:** S690 passes units, 18/18 exact paths,
  38/38 marks, eight layers, clean reopen, and limited rendered inspection
  for one S671 Polo M file. It is generic-CAD evidence and fails the admitted
  apparel/industrial receiver eligibility gate. C:-only output SHA-256 is
  `11ea44a7fa6f88a53990d056b69fbeca6ab18a47f52e93434afd676860b20b1a`.
- **LibreCAD 2.2.1.5 R12:** S674 passes that fixture's paths/marks/layers but
  fails explicit centimeter declaration. R12 is retired; S690 is a distinct
  DXF 2000 result, not a general LibreCAD pass.
- **CLO Standard and DXF-AAMA/ASTM routes:** S689 passes the one returned unit
  transform but fails five of nine Polo CUT contours and eight visible marks;
  prior negative tests also fail. Stop this permutation family.
- **GetonAgain DGS apparel decoder and AutoCAD/Design routes:** S668 produces
  blank 0/0 for the approved `/2` package; S667 loses units, geometry, layers
  and piece identity; S669 native control exports metadata only and also
  self-imports blank 0/0. Retired; do not repeat another DGS mode/encoding.
- **Open CAD Studio R14:** S627/S626 has useful separate source-matrix and
  repeatability evidence but lacks units/identity/profile and accepts a
  malformed non-finite input. It cannot qualify LibreCAD or satisfy the
  industrial-profile gate.

## Source facts versus receiver facts

Source-side work is not the missing algorithm: S676 adds opt-in centimeter
declaration; S677 emits recipe construction marks/grainlines; S678–S679 bind
units and package identity; S680 validates all 73 option packages and grades;
S681 binds each mark identity to its exact DXF entity. Their focused suites,
100% changed-code coverage and output checks are recorded in those slices.
The accepted legacy DXF stream and protected byte identities remain unchanged.
No current evidence ties the prior receiver losses to a further source-code
defect. Do not change source geometry, manufacture lost receiver output, or
move the export baseline without new causal evidence.
