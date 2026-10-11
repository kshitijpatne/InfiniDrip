# EPIC-17 / G04 V03 CLO Polo and Woven representative round trips — Slice 476 exit

## Outcome

S476 completed local CLO `2026.1.310 (r58944)` import → DXF-ASTM export →
matching DXF-ASTM reimport for the S463 standard-M Polo and Woven shirt
fixtures. CLO remained open. All import/export files, native projects,
screenshots and parsed receiver output are under
`C:\G04-CLO-DXF-Exchange`; no CAD file or screenshot was copied into the
repository. No product code, source pattern geometry, protected export
identity or baseline changed.

The check is mixed. Woven passes exact-vertex contour correspondence for all
24 of 24 source contours within C04's unchanged 0.001 cm limit. Polo passes for
13 of 18; three source CUT contours have best same-vertex candidate deltas of
2.000004 cm and 9.298007 cm (two contours), and two more CUT contours have no
output candidate with the same vertex count. Do not claim Polo round-trip
geometry passed or use this trial to release the all-seven V02 / V03 gate.
The exact mismatches, likely CLO block and numeric-layer candidates, and all
section/piece counts are preserved in the analysis JSON on C:.

## Actual files and numeric results

Input copies still match the S463 fixture manifest exactly:

| Fixture | Input bytes / SHA-256 | Export bytes / SHA-256 |
|---|---|---|
| Polo M | 24,261 / `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca` | 221,647 / `734ecfee3c458f7293da3d58e283ad9356bbf8cd856e84f554dacae6a69d804b` |
| Woven shirt M | 14,923 / `9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5` | 140,091 / `88b01c44701f8c73e10ab898356bdaa47d0a3b317b6a0a7e33d9d260cb74502c` |

The configured trial repeated S475's observed options: DXF-AAMA import,
centimeters, 100%, no rotation, original grain, notches to both outline and
seam allowance at ratio; DXF-ASTM graded-nest export/reimport, centimeters,
100%, no rotation, duplicate notch on seam allowance checked and other
optional export toggles off. CLO again displayed its seam-allowance notice;
the source does not carry seam-allowance metadata and was imported in Custom
mode. No option was changed to improve the result.

The outputs both declare `AC1009`, have no `$INSUNITS` declaration, and put
their pieces into unrotated, unit-scale block inserts at the origin. Polo has
nine inserts and nine model-space TEXT entities; Woven has twelve inserts
and nine model-space TEXT entities. Polo contains 94 closed block polylines
(2,499 vertices), 1,255 POINT, 9 LINE and 36 TEXT entities across sections;
Woven contains 114 closed block polylines (1,499 vertices), 754 POINT, 12
LINE and 45 TEXT entities. These counts include CLO's numeric-layer
representations and must not be treated as unique semantic entities.

| Fixture | Exact source contours within 0.001 cm | Finite maximum best delta | Additional unresolved source contours |
|---|---:|---:|---|
| Polo M | 13/18 | 9.298007 cm | 3 over gate; 2 cannot be paired by vertex count |
| Woven shirt M | 24/24 | 0.000074 cm | 0 |

The actual CLO reimport screenshots show nine Polo pieces and twelve Woven
pieces distributed as distinct pieces in the 2D window. Their main outlines
and many marks remain visible; no missing piece or import-error dialog was
observed. This was an overall visual review. Individual mark-by-mark semantic
fidelity, numeric layer meanings, grade-rule/size exchange, and option coverage
were not verified. CLO's numeric layers duplicate coincident source contours;
S475's Tee output had the same unresolved property. No numeric layer meaning
is inferred from these samples.

## Output inventory (C: only)

| File | Bytes | SHA-256 |
|---|---:|---|
| `Input\polo-standard-m.dxf` | 24,261 | `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca` |
| `Input\woven-shirt-standard-m.dxf` | 14,923 | `9fe52d808ec94a6b8ab86a3b55066b11e6bb1b6ad4bf34e480ae9060165196a5` |
| `Output\polo-standard-m-clo-export.dxf` | 221,647 | `734ecfee3c458f7293da3d58e283ad9356bbf8cd856e84f554dacae6a69d804b` |
| `Output\woven-shirt-standard-m-clo-export.dxf` | 140,091 | `88b01c44701f8c73e10ab898356bdaa47d0a3b317b6a0a7e33d9d260cb74502c` |
| `Output\polo-standard-m-clo-reimport.zprj` | 2,336,505 | `1fbbb5292d85a00cecb2a80ad1dd1faf94038856406e26e5a53713ac7e83ca6f` |
| `Output\woven-shirt-standard-m-clo-reimport.zprj` | 2,305,738 | `90bfb41e8d9efbc9642f961d90950785bd758149402e0361d6d54e6b89861870` |
| `Evidence\polo-reimported-output.jpg` | 103,939 | `ff7d3315e4d43550a3fcf7e77991d779f0a1d803483c3aabce8429d2c1c7d512` |
| `Evidence\woven-reimported-output.jpg` | 110,644 | `9f3836649d906279d194d8b6bf76e92e2dcc259802410db24e16d8768f062d27` |
| `Evidence\polo-woven-roundtrip-analysis.json` | 66,311 | `8b10bbb206d08ee07db78c6ee9663c4d23d110e324ec5aeade79c0547a04aa6b` |

The input project and completed export `.zprj` files also remain in `Output`;
the saved hash-identified reimport projects above are the rendered-output
state. CLO profile screenshots from S475 remain at
`Evidence\export-profile-before-confirm.jpg` and
`Evidence\reimport-profile-before-confirm.jpg`; the S476 run repeated those
observed settings. All filenames in this section are relative to the named C:
folder.

## Official-source and independent research result

The OpenCode read-only handoff completed using exactly
`opencode/muse-spark-1.3-contributor-free`, `xhigh`, normal mode. Codex waited
for `WORK FINISHED` and reviewed its evidence against the official public
sources. Its concise findings are retained in
`S476-opencode-research-result.md`.

ASTM's public D6673-04 record states that the profile uses AutoCAD Version 13
DXF. Autodesk identifies AC1009 as R11/R12 and AC1012 as R13. The current ASTM
catalog page marks D6673-04 historical and identifies D6673-10 as withdrawn
in 2019 with no replacement. The observed CLO mode name `DXF-ASTM`, AC1009
header, and external centimeter selection do not establish conformance,
self-describing units, a current standard profile, or factory readiness. CLO's
public help exposes no authoritative numeric-layer mapping for this export.
The full standard's detailed clauses remain unreviewed because its text is
paywalled. Sources: [ASTM D6673-04](https://store.astm.org/d6673-04.html),
[ASTM D6673-10](https://store.astm.org/d6673-10.html),
[CLO import/export help](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
[Autodesk INSUNITS](https://help.autodesk.com/cloudhelp/2025/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm),
[Autodesk DXF reference](https://damassets.autodesk.net/content/dam/autodesk/www/developer-network/platform-technologies/autocad-dxf-archive/acad_dxf_2006.pdf).

## Verification and limits

- `analyze-roundtrips.mjs` rereads the C: copies and actual CLO output, checks
  byte/hash identity, complete group pairs, fixture outline count/closure,
  piece blocks/inserts, section/layer/entity counts, ACADVER/INSUNITS, and
  cyclic forward/reverse coordinate correspondence. It records rather than
  suppresses the Polo nonmatches. Focused result: Woven 24/24 within tolerance;
  Polo 13/18; no full receiver profile passes from these trials.
- Both rendered reimport screenshots were visually inspected after capture.
- OpenCode's cited claims were compared with ASTM, Autodesk, and CLO public
  documentation. No standard full text or CLO numeric-layer table was
  available from those sources.
- V01/V02 remain Done; G04 V03 and EPIC-17 remain In Progress. The all-seven
  V02 acceptance, legacy DXF behavior, export-byte identities, rights/profile
  gates, and V03 evidence requirements are unchanged. The two M fixtures do
  not prove grading, the supported option matrix, all marks, or target-CAD
  acceptance. No ASTM conformance, industrial interchange compatibility,
  physical fit, factory acceptance or production-readiness claim is made.

## Slice timing and next action

Started `2026-10-08 06:26:15 UTC` from verified S475 commit
`84bb186cdda3df600e62911bf81bf182e57108b2`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest
assigned slice was S475; S476 is unique. Start board revision 2935 advanced to
2939 by validated command replay. The validated exit replay advanced revision
2939 to 2943; EPIC-17 and G04-V03 remain In Progress. Control Center tests pass
42/42; `git diff --check` passes. Full source/global coverage and integrated
builds stay scheduled for the settled Epic candidate because this evidence
slice changes no production source.

Elapsed through 06:48 UTC is approximately 22 minutes: CLO interaction and
capture ~10m; focused DXF parsing/comparison and rendered review ~6m; OpenCode
research wait/review ~3m; durable records/board closeout ~3m; product
implementation ~0m; maintainer-decision time 0m. Times are approximate because
the desktop interaction intervals were not individually timestamped.

**Next action:** diagnose Polo's five unmatched source CUT contours against the
input piece geometry and CLO's generated output, using a read-only C: analysis;
do not edit source geometry or product behavior from this evidence alone. Keep
the current observed profile bounded to empirical behavior. Before any
compatibility claim, obtain applicable standard/license rights and independent
target receiver acceptance evidence. V03 remains open.
