# EPIC-17 / G04 V03 — Woven button-circle ARC trial — Slice 637 exit

## Outcome

The bounded CLO trial **failed the button-mark visibility/pre-export gate**.
Four same-center/radius quarter-ARCs per source button circle imported without
a CLO error, but the actual 1:1 CLO snapshot did not display the expected
button marks on either placket. The close crop shows both named placket pieces
and their other internal lines, but no button circles. Therefore the ARC
representation did not solve S629's mark problem in this receiver path. No
DXF export or round trip was attempted, because the pre-export gate failed.

The source Woven fixture has eight `MARK_BUTTON` CIRCLE entities: one on the
outer stand and seven on the button placket. S637 replaced those eight entities
only with 32 exact 90-degree ARCs, retaining each circle's center, radius,
layer and complete mathematical locus. The generator asserted that every
non-target parsed entity remained identical. CLO 2026.1.310 (r58944) imported
12 named pattern pieces and returned zero native-query errors. Its read-only
`GetPatternInputInformation` response records the named pieces and geometric
shape data, but does not expose an arc/circle mark or prove mark centers/radii.
On the outer stand it enumerates a single additional 25 mm straight line; on
the button placket it enumerates three additional straight lines. All reported
child shapes are `Base Line` and every reported line is `Straight type`. The
API's child-shape count also exceeds its enumerated shape entries by one on
both affected pieces (stand 5 vs 4; button placket 7 vs 6), an unexplained
query diagnostic. The visible 1:1 output is therefore the decisive mark
check, and it fails.

The actual detail render was saved from CLO's `File > Snapshot > 2D
Patterns(1:1)` as a 127-ppi PNG with all line options and Pattern Name plus
Button/Buttonholes information selected. The close crop was made from that
render on a white background. At this scale, the seven source placket button
marks should be visibly distinct; none appear. The overview also does not show
the expected stand button mark. This is an observed rendering/output failure;
it does not establish why CLO omitted the marks internally.

S637 stops here. No import-setting permutations, new mark encodings, exports,
source pattern changes, product source changes, or V03 acceptance/hold changes
were made. V01 and V02 remain Done; V03 and EPIC-17 remain In Progress. All
V03 rights/profile, units, CUT/SEW geometry, seven-recipe/options/grades,
identity/relationship, mark/layer semantics, malformed-input, repeated
exchange, and detailed readability gates remain in force. This one Woven
configuration is not a profile qualification and makes no physical-fit,
factory-acceptance, or production-readiness claim.

## Pinned inputs and receiver evidence

Every CLO input, project, query and render is confined to
`C:\G04-CLO-DXF-Exchange\S637-woven-circle-arc-trial\`.

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| S628 source fixture copy | 17,039 | `DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6` |
| S637 four-ARC derivative | 18,764 | `5AC038B23D66AA57B2C089639230055C021C461A72BD39BD5D680AFF9D9D40BA` |
| Derivative assertion report | 1,326 | `23FD100A28C0F2882045284EE78A3B8A31AD3C2324026C4B70A891809516A41A` |
| CLO native project | 2,314,885 | `723F6CDDEC96172CFD322E496D937820A84893B866CA1ED164F738099880D698` |
| CLO native input-information query | 516,384 | `30F0A509D59DFB83C9A20AB7E38FBDFDEC386EF7E0540EB8FC411CEDAA354B75` |
| Actual CLO 2D 1:1 snapshot | 899,231 | `DF4AA5B3A4101578FF6DC0A62FB588F4457F0E3F0761426FCD2675D3AA37A487` |
| Close crop of both named plackets | 336,554 | `77B79C3715FCD03740133B333479FEC688226DE96D30B3331C2CED512A178316` |

The snapshot is 17,820 × 4,200 pixels. Import returned these 12 pieces:
Woven front, back lower, back yoke, patch pocket, outer and inner stands,
upper and under pointed collars, button and buttonhole plackets, short sleeve,
and folded sleeve band. No DXF is present in the S637 `Output` directory.
The native query duplicate `native-input-information-copy.json` is redundant
diagnostic data and is not used for the conclusion.

## Verification and boundary record

- Start: `2026-10-09 20:32:00 UTC`, after S636 commit
  `04c37f4da6e4acde7add2638c63643361686c5d9`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  S637 was the unique next slice. Validated board start replay was
  `3688→3690`.
- Derivative checks: eight source block CIRCLEs became exactly 32
  same-layer quarter-ARCs; zero target CIRCLEs remain; all other parsed entity
  pairs remained identical; source and derivative hashes match the pinned
  report. The complete circle locus is mathematically preserved.
- Receiver checks: one DXF-AAMA import in the existing CLO session, 12 named
  patterns and zero query errors. For affected pieces, the native API reports
  only `Base Line` child shapes with `Straight type` lines, no arcs/circles,
  and has an unexplained one-child count/enumeration mismatch. Actual overview
  and detailed 1:1 crop were saved and reviewed; the expected placket circles
  and stand mark are not visible. Pre-export gate failed; no DXF was exported.
- Focused verification: generator and query-script syntax; hash/size
  verification for source, derivative, project, query, and both renders;
  derivative assertions; rendered review; `git diff --check`; and validated
  Control Center tests/replay. No production code changed, so production-code
  coverage is not applicable. The full repository suite and 100% coverage,
  integrated build/browser/output gate remain for the settled Epic/PR
  candidate.
- Start/exit board revisions: `3688→3690→3692`; exit replay adds evidence and
  a comment only. G04-V01/V02 stay Done; G04-V03/EPIC-17 stay In Progress.
- Elapsed time through closeout: approximately 22 minutes
  (`20:32–20:54 UTC`): derivative and setup 3m; one CLO import, native query,
  save and render 12m; focused verification and visual inspection 3m; durable
  records/board/closeout 4m; external-agent waits 0m; maintainer-decision time
  0m.

## Next action

Do not repeat the CLO button-mark entity-encoding trial or substitute more
import settings without new source/profile evidence. Reconcile S637 into the
current V03 matrix and select the next distinct blocking gate with a
documented receiver/profile and rights path; keep every V03 hold and the
existing `0.001 cm` geometry threshold unchanged. CLO remains open for later
evidence-driven work.
