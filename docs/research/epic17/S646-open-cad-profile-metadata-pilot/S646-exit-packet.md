# EPIC-17 / G04 V03 — OpenCAD R14 profile metadata pilot — Slice 646 exit

## Result

S646 tested an additive, application-specific profile record on a Polo M
named-block DXF and used the existing OpenCAD Studio v2026.40.1 portable
receiver to produce two local generic DXF R14/AC1014 generations. The input
declares `$INSUNITS=5` (centimeters), a registered `INFINIDRIP` APPID,
`profile=idr-pattern-exchange/1`, garment/size/source revision, and one stable
role identity for each of nine named blocks. OpenCAD's first output retained
all nine block/insert identities, all nine app/profile/revision/role XDATA
records, the centimeter declaration, AC1014 version and CUT/SEW/MARK layers.
The second output is byte-identical to the first. Independent block/entity
comparison finds all 56 source entities at 0.000 cm maximum residual in both
passes.

At the maintainer's explicit direction to continue practical testing with
available tools, S646 imported that exact, hash-pinned first output once into
the existing CLO 2026.1.310 session using DXF-AAMA, centimeters, 100% scale,
and no rotation. CLO returned nine correctly named patterns and no native
query API errors. The source-bound CUT/SEW contour comparison passes 13/18:
all nine SEW and four CUT contours pass `0.001 cm`; five CUT contours fail:

| Piece role | Native CLO result |
|---|---|
| `IDR_POLO_BACK` | 33 points retained; max cyclic residual 22.360652 mm (2.236065 cm) |
| `IDR_POLO_OUTER_COLLAR_STAND` | 54 source points; no exact native contour candidate |
| `IDR_POLO_INNER_COLLAR_STAND` | 54 source points; no exact native contour candidate |
| `IDR_POLO_UPPER_POINTED_COLLAR` | 44 points; max cyclic residual 93.108496 mm (9.310850 cm) |
| `IDR_POLO_UNDER_POINTED_COLLAR` | 44 points; max cyclic residual 93.108496 mm (9.310850 cm) |

These are the same five failing contours measured in S642. The receiver did
preserve all nine piece names, but neither the generic R14 container nor the
added unit/role/revision metadata changed the geometry result. S646 therefore
stopped before CLO export, as the pre-export gate requires. It does not claim
that OpenCAD is an industrial apparel receiver, that the application-specific
XDATA contract is an industry standard, or that any V03 gate passed.

The actual CLO 1:1 Snapshot PDF is a one-page overview with all nine named
patterns rendered. It confirms piece presence, not fine manufacturing-mark
readability or a valid round-trip output. PDF and visually reviewed raster
render are stored in the C:-only S646 evidence directory.

## Gate disposition

The two OpenCAD generations are a positive generic-R14 result for this single
Polo M fixture: units, named-piece identity metadata, layer inventory,
repeatability and exact geometry are retained. CLO adds evidence that names
survive this import. The industrial receiver/profile qualification, all-seven
recipes/options/grades, complete receiver mark semantics, malformed/invalid
inputs, successful target round trip and readable production output remain
open and blocking. V03 and EPIC-17 remain In Progress; V01/V02 remain Done.
No acceptance, threshold, geometry, source/export code, protected byte
identity, or hold changes.

## Inputs and evidence

All exchange and rendered files are under
`C:\G04-CLO-DXF-Exchange\S646-open-cad-profile-metadata-pilot\`.

| Artifact | SHA-256 / result |
|---|---|
| Source named-block Polo M input from S642 | `3632740C8AB672915424D66E2FED996154B457DBA78F02BF05359BDDE3F86CC0` |
| S646 profile-bearing AC1015 input | `D13C46ABE1A207FE9A1A0E74F99DD0EB5E3C57900209DC1EF27531F72A8D53B0` |
| OpenCAD R14 first output | `ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461` |
| OpenCAD R14 second output | same SHA-256; byte-identical |
| CLO native import query | `Evidence/clo-native-import.json`; 9 patterns, zero API errors |
| CLO contour comparison | `Evidence/clo-native-contour-comparison.json`; 13/18 pass; fail closed before export |
| CLO actual 1:1 PDF render | `Renders/clo-r14-profile-polo-m.pdf`, SHA-256 `73639415DFEAF380BD0C4B32119A689EF5245962B9DDEC9E579E4E92E8D44DC8` |
| Reviewed PDF raster | `Renders/clo-r14-profile-polo-m-review.png`, SHA-256 `F51DD665824A1EB12F99AB556C2AFC5920F6B6C636B33BDD67E4EAC29F76A358` |

## Verification and durable closeout

- Started `2026-10-09 23:14:37 UTC` from clean S645
  `ef28519c21314eed0280ed4e6982849284da16b6` on `codex/epic-17-g04`;
  refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an
  ancestor. S645 was highest; S646 is unique. Board start replay advanced
  `3726→3728` without changing V03/Epic status.
- Preflight and two local R14 conversions pass. `analyze-pilot.mjs` verifies
  9 blocks, 56 entities and 0.000 cm residual in both passes, identity/XDATA,
  layers, units, AC1014 and byte identity. `analyze-clo-import.mjs` verifies
  the exact source, imported candidate, receiver settings, nine names, zero
  API errors and all 18 contours at the unchanged tolerance. It records the
  failed rows without alignment, repair or tolerance relaxation.
- The CLO PDF render was generated from the actual imported pattern window,
  with piece names enabled, then rendered and visually reviewed. No export was
  attempted after the failed native geometry gate.
- `node --check` passed for all three S646 scripts; focused analyzers pass
  their assertions. No production code changed, so changed-production-code
  coverage is not applicable and the global coverage/build gate remains for
  the settled integrated Epic/PR candidate. `npm run control-center:test`,
  validated board replay and `git diff --check` pass. The first CLO-analyzer
  provenance assertion compared Windows backslashes with slash-normalized
  source paths; it failed on string formatting alone. Path normalization was
  corrected and the analyzer rerun passed with the same hash and contour
  measurements.
- Time from `23:14:37 UTC` through closeout: approximately 30 minutes. Split:
  pilot/analyzer corrections 7 minutes; CLO import/query/render operation 9
  minutes; focused analysis and output inspection 7 minutes; durable docs,
  state, board and commit closeout 7 minutes; external-agent wait 0 minutes;
  maintainer-decision wait 0 minutes. No safe independent delegation existed
  for this tightly coupled single-fixture evidence pilot.

## Next action

At the S646 boundary, inspect the active goal record and reconcile it with
this verified repository state without changing its status. Then reserve the
next unique slice only after refreshing Git, board and usage state. Do not
repeat this CLO import or another same-geometry producer permutation. The
next V03-critical work must supply a rights-reviewed industrial apparel
receiver/profile with a credible way to preserve the measured CUT curves, or
record the precise externally dependent decision; keep all seven-recipe
criteria, all holds, legacy behavior and protected export identities intact.
