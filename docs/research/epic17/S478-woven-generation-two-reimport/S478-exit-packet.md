# EPIC-17 / G04 V03 Woven generation-two reimport — Slice 478 exit

## Result

S478 reimported the S477 Woven DXF in the owner-installed CLO interface and
saved a separate native project. The installed receiver reports CLO
`2026.1.310 (r58944)`. The 2D window visibly showed twelve distinct Woven
pieces in one laid-out row. The import dialog used DXF-AAMA, centimeters,
100%, Do Not Rotate, Maintain Original grain, Import Notches to Both, and Ratio
notch position. CLO displayed its no-seam-allowance notice and retained the
import in Custom mode. No DXF or pattern geometry was edited.

The saved native project is
`C:\G04-CLO-DXF-Exchange\Output\woven-shirt-standard-m-clo-second-generation-reimport.zprj`,
2,306,224 bytes, SHA-256
`8e6895521827254b8a7a9559cd2be3236c1d62b882ce5cdec40f0c47b264c489`.
The imported DXF was the S477 re-export,
`Output\woven-shirt-standard-m-clo-reexport-from-reimport.dxf`, 140,107 bytes,
SHA-256
`44f3580f1175b84342f1d21ef847214cbbe5bc883c0795fdc4e69c09e2e21579`.

The comparison inputs are hash-bound as follows:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `Input/woven-shirt-standard-m.dxf` | 14,923 | `9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5` |
| `Output/woven-shirt-standard-m-clo-export.dxf` | 140,091 | `88b01c44701f8c73e10ab898356bdaa47d0a3b317b6a0a7e33d9d260cb74502c` |
| `Output/woven-shirt-standard-m-clo-reexport-from-reimport.dxf` | 140,107 | `44f3580f1175b84342f1d21ef847214cbbe5bc883c0795fdc4e69c09e2e21579` |
| `Output/woven-shirt-standard-m-clo-second-generation-reimport.zprj` | 2,306,224 | `8e6895521827254b8a7a9559cd2be3236c1d62b882ce5cdec40f0c47b264c489` |
| `Evidence/woven-second-generation-clo-2d-snapshot.png` | 662,807 | `7d4f091b76303361466f9402686b1cfca846ae98fdec15664fd63c54cd087fc` |
| `Evidence/woven-second-generation-clo-2d-snapshot-white.png` | 543,279 | `7a933b57b40105acb42016fd640f3248f47147cc46b4c4b3dd1c15fa579123b8` |
| `Evidence/woven-second-generation-roundtrip-analysis.json` | 15,479 | `ca16d1d524cf85c62a6dd7f6cb731ead8a8ddb0a363b24b6066ad96baa913613` |

The raw CLO snapshot is 16,412 × 3,643 pixels. The white-background composite
is a presentation derivative; both files are preserved.

## Hash-bound comparison

`analyze-woven-roundtrip.mjs` verifies the source, first export, and second
export hashes and sizes, parses their polyline/block structure, performs
cyclic/reverse vertex matching, and writes the result only to
`C:\G04-CLO-DXF-Exchange\Evidence\woven-second-generation-roundtrip-analysis.json`.

- The source fixture has 24 closed outlines. All 24 have a matching output
  contour within the unchanged 0.001 cm coordinate gate in both CLO exports;
  the maximum best-match delta is `0.000074 cm`.
- Both exports contain twelve named piece blocks, twelve model-space inserts,
  and 114 stored block polylines (96 closed and 18 open). Their block names and
  per-block entity counts are identical.
- One-to-one same-block, same-layer, same-closure, equal-vertex-count matching
  pairs all 114 first-export contours to the second export within 0.001 cm; the
  maximum matched delta is `0.000031 cm`.
- Both DXFs declare AC1009 and omit `$INSUNITS`. Repeated polylines across
  undocumented numeric layers remain; this geometric comparison does not
  establish what those layers mean or prove mark semantics.

This sample demonstrates stable geometry representation for this one
standard-M Woven fixture over this additional CLO import/export generation.
It does not establish standards conformance, industrial compatibility,
rights, grade or option coverage, other-recipe behavior, or factory acceptance.
The CLO `DXF-ASTM` export label remains unverified against a licensed complete
profile, and V03 remains In Progress.

## Rendered evidence and limits

CLO's 2D Snapshot command saved
`C:\G04-CLO-DXF-Exchange\Evidence\woven-second-generation-clo-2d-snapshot.png`
(PNG, 44-inch wide preset, 127 ppi; 16,412 × 3,643 pixels). CLO returned the
transparent-background image with thin, low-contrast strokes at fit-to-page
size. The raw image is preserved; a white-background inspection composite is
`woven-second-generation-clo-2d-snapshot-white.png`. The live CLO screenshot
also showed the twelve distinct piece outlines. These images establish visible
piece presence and layout only; they do not identify individual numeric layers
or prove sewing/topology semantics.

All import/export/native-project/rendered files remain beneath
`C:\G04-CLO-DXF-Exchange`. CLO is left open. No file was uploaded.

## Scope, acceptance, and holds

- S478 is an evidence-only local receiver trial. No product code, source
  geometry, stitch graph, legacy DXF behavior, protected export byte identity,
  V02 acceptance, V03 exit gate, or compatibility claim changed.
- The all-seven-recipe V02 acceptance remains as previously recorded; this
  Woven M exchange fixture does not amend or broaden it.
- V03 still requires the admitted rights/profile review, full semantic and
  mark/layer handling, representative options/grades, strict round-trip proof,
  and independent receiver evidence. No ASTM or broad industrial compatibility
  claim is made.
- No physical fit, factory acceptance, or production-readiness claim is made.

## Focused verification and boundary

- `node docs/research/epic17/S478-woven-generation-two-reimport/analyze-woven-roundtrip.mjs`
  passed all hash, size, structure, block, and geometry assertions and wrote
  the hash-bound analysis to the C: evidence folder.
- Native-project and DXF file sizes/SHA-256 values were rechecked from disk.
- The CLO PNG was opened and visually inspected; the white-background
  inspection composite is explicitly a presentation derivative, while the raw
  CLO export remains preserved.
- `npm run control-center:test` passes 42/42 after board replay;
  `git diff --check` and all three changed S478 module syntax checks pass.
- The validated exit command replay completed at board revision 2959; EPIC-17
  and G04-V03 remain In Progress.
- No production code or tests changed; changed-code coverage is not
  applicable. The full repository/global coverage gate remains due only on the
  settled integrated Epic/PR candidate.

Started `2026-10-08 07:15:28 UTC` from S477 commit
`68cc8f35423463fbc6dc54165c97816776fde105`. Refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S478 was
uniquely reserved after S477. The start board revision 2951 advanced to 2955;
the validated exit replay advanced 2955 to 2959 while EPIC-17 and G04-V03
remain In Progress. Goal remains active and aligned.

Elapsed-time accounting (approximate, UTC): implementation/CLO operations 5m;
focused DXF and artifact verification 5m; rendered review 2m; durable
packet/state/context/board closeout 3m; external-agent wait 0m; maintainer-
decision time 0m. Total is approximately 15m, from `07:15:28` to the S478
closeout boundary.

**Next action:** continue the already-admitted V03 rights/profile and receiver
evidence work from the unresolved gates in S476–S478. Keep compatibility claims
fail-closed until those gates pass; do not reopen V02 or relax its criteria.
