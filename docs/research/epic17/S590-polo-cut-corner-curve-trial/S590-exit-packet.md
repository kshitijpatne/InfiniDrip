# EPIC-17 / G04 V03 — Polo CUT corner-curve trial — Slice 590 exit

## Verified boundary

- Started `2026-10-09 06:51:17 UTC` on `codex/epic-17-g04` from S589
  `b4246c2a522d60dd58d5ce3571049c3d369380fa`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor.
  S590 is the unique slice number. Start board replay: `3473→3475`.
- G04-V01/V02 remain Done; G04-V03 and EPIC-17 remain In Progress.
  Product-development trial use and local-only DXF processing are covered by
  the maintainer's written confirmation. That decision is settled and is not
  a technical acceptance result.
- CLO 2026.1.310 was already running and remains open for admitted G04 work.
  The pre-existing S588 CLO scene was preserved via Save As at
  `C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot\Evidence\clo-scene-before-S590.zprj`;
  S590 then began from a new, empty project. All S590 import/export/render
  files stayed under
  `C:\G04-CLO-DXF-Exchange\S590-polo-cut-corner-curve-trial\`.

## Hypothesis and exact fixture

S552 identifies five repeatedly omitted Polo CUT vertices: back vertex 13,
and vertex 14 on each outer stand, inner stand, upper collar, and under collar.
S536/S552 document short incoming edges `0.04562–0.04696 cm`, turns
`16.28–17.39°`, and earlier replacement-chord residuals around
`0.0127–0.0140 cm`. S536's geometry-identical R2000 LWPOLYLINE test and S552's
cm/mm comparison already failed; the CLO curve-point and settings variants
were exhausted.

This trial replaced only those five corners in an exchange-only derivative
with radius-`0.05 cm` tangent fillets. The hash-pinned S536 input remains
`9062b0d6442354165c5640ef3ca98b717aaef6f4339eac1de99255d7d1750fa2`.
The derivative hash is
`db1932397a17b07ccdd85e566c966d74ac82b806931d13a4e94c3174d7ed9078`.
Its five analytic symmetric deviation bounds, including serialization
allowance, are `0.000509168–0.000581487 cm`, below the fixed `0.001 cm`
gate. All other source entities remain exact, and the 18 CUT/SEW contours
remain present. The production pattern, stitch graph and generic DXF writer
were not edited.

## One controlled CLO exchange

The S590 derivative was imported into an empty CLO project using the pinned
S536 settings:

- Load Type `Open`; File Format `DXF-AAMA`; Unit `Centimeter`; Scale `100%`;
  Rotation `Do Not Rotate`; Grain `Maintain Original`.
- Pattern annotation, autotrace, cut/sew swap, automatic distribution,
  curve optimization and removal of non-grading points were off.
- Import Notches was on with `Both` / `Ratio`; Import Draw Curve Points was
  on.
- CLO displayed its seam-allowance notice: the DXF contains seam allowances,
  which it imports in Custom mode to preserve their original shape. This was a
  notice, not an error dialog.

All nine expected pieces rendered in the clean scene. The saved 2D snapshot
uses PDF, 127 dpi, 1:1 preset, 100% scale, no rotation, all line options
selected, and no additional labels/images. The PDF was rendered to PNG and
visually inspected; the collar crop is saved separately. Snapshot evidence
was captured after import and before export; no second-generation re-import
was performed.

One DXF-AAMA export then used the pinned S536 settings: Graded Nest, cm at
100%, no rotation; Duplicate Notch on Seam Allowance on; Export without
Grading/Baselines/Seam Allowance off; curve-to-straight conversion,
optimization, and pattern bounding box off. CLO returned to the scene without
an error dialog. This is one import/export generation, not a conformance or
all-seven pass.

## Round-trip result

The input derivative has 18 closed contours (9 CUT, 9 SEW). The CLO output has
9 piece inserts and 47 block polylines, including internal paths, across
numeric output layers `1`, `8`, and `14`; no manufacturing meaning is assigned
to those numbers. Each unchanged SEW outline binds one source piece to a CLO
block by cyclic/reverse vertex comparison. All 9/9 SEW contours pass, with
maximum coordinate delta `0.000035128 cm`.

Within each bound piece block, the CUT comparison excludes the matched SEW
path and tests each remaining closed outline candidate. The report samples
straight and bulge-arc paths every at most `0.0005 cm` of arc length and adds
`0.00025 cm` as a conservative sampling allowance. Four of nine CUT contours
pass. The five filleted CUT contours fail; the sampled maximum is already
above threshold, so the fail is independent of that added allowance:

| Piece | Derivative vertices → closest output | Output arcs | Sampled max (cm) | Conservative upper bound (cm) |
|---|---:|---:|---:|---:|
| Back | 34 → 33 | 0 | 0.007124169 | 0.007374169 |
| Outer collar stand | 55 → 54 | 0 | 0.007584680 | 0.007834680 |
| Inner collar stand | 55 → 54 | 0 | 0.006813382 | 0.007063382 |
| Upper pointed collar | 45 → 44 | 0 | 0.007582903 | 0.007832903 |
| Under pointed collar | 45 → 44 | 0 | 0.007582926 | 0.007832926 |

Thus the source-side fillets satisfy the gate, but this receiver round trip does
not: all five changed CUT contours remain over six times the `0.001 cm`
limit, with one fewer output vertex and no output bulge arc. The exact DXF
comparison is in the C:-only `Evidence\Analysis\S590-roundtrip-analysis.json`.
This describes the output; it does not assert an undocumented internal CLO
cause. The hypothesis is falsified for this build, profile, and fixture.

## Preserved scope and open gates

No pattern/stitch source, recipe, V02 face/hold, acceptance criterion,
tolerance, layer meaning, legacy DXF behavior, or protected export identity
changed. No exact apparel-AAMA conformance, universal CLO/DXF incompatibility,
physical fit, factory acceptance, or production readiness is claimed. V03
still requires a geometry pass and representative all-seven/configuration
round trips, explicit piece/revision/size identity, CUT/SEW semantics, marks,
grading/options, malformed-input handling, and useful rendered detail.

S590 does not authorize repeating the fillet, previously tested R2000/
LWPOLYLINE or LINE representation, custom XDATA route, or old UI settings.
The next bounded action is S591: inspect the exact five residual loci against
their source, S590 derivative and output sequences, then assess one distinct
source-side representation with a hash-pinned proof below `0.001 cm`. Do not
import another file until that proof passes. If no coherent variant follows
from those exact paths, record that and keep the gate held.

## Artifacts and hashes

All entries below are within the named S590 C: folder:

- Input `Input\polo-standard-m-fillet-r005cm.dxf` — SHA-256
  `DB1932397A17B07CCDD85E566C966D74AC82B806931D13A4E94C3174D7ED9078`.
- CLO output `Output\polo-standard-m-fillet-r005cm-clo-aama.dxf` — SHA-256
  `3EFA330D125664449E3D092E92F096AFDB607C867E7BEBD3DDBC9FA40536C457`.
- Preflight `Evidence\fillet-preflight.json` — SHA-256
  `5F7525A42F1C5953B73ED5E2932B74929ADA7AD5AC777A9750E6D7C9194E0DEB`.
- Round-trip analysis `Evidence\Analysis\S590-roundtrip-analysis.json` —
  SHA-256 `8439654FD220238CD288BF1E485CBFFBAFAE9005C69D1927E15246DC19F61A1D`.
- CLO 2D snapshot `Evidence\S590-import-render.pdf` — SHA-256
  `5D304920CB5AC109B0286E8A6A92BF1C34C9BDAB1596B87EE2CBCA5A136316A1`.
- Rendered snapshot `Evidence\S590-import-render.png` — SHA-256
  `447A474356145D7716EAC44F69F9D7116F543B83A28F1B5EE044F50E38980C3A`.
- Collar crop `Evidence\S590-import-render-collars.png` — SHA-256
  `1689CC1A3523ED017AF76BA982C27A3B7DFE435157B0E6B744045B7A439D1319`.

## Verification, board and time

- Start board replay linked `E-G04-S590-START` and a scope comment at
  `3473→3475`. The validated exit replay updated the current EPIC summary and
  description, linked `E-G04-S590-EXIT` to G04-V03, and recorded the measured
  failure while preserving statuses; actual revision `3475→3479`.
- Focused verification: `node --check` passed for all five S590 prepare,
  analyze, and replay scripts; all 42 Control Center tests passed; validated
  command replay and board preflight passed at revision 3479; `git diff --check`
  passed. No production source changed; changed-production-code
  coverage/build and full repository gates are not applicable to this
  evidence-only slice. Full gates remain due on the settled Epic/PR candidate.
- No external-agent wait or maintainer design decision was required.
- Exit: `2026-10-09 07:21:55 UTC`; total wall-clock elapsed `30m 38s`.
  Retrospective rounded allocation: fixture/preparation and analysis scripts
  `5m`; CLO import/export and snapshot work `13m`; geometry and rendered-output
  verification `7m`; durable packet/context/board/check closeout `5m`.
  External-agent waits `0m`; maintainer-decision time `0m` (the written
  trial-use/local-processing authorization was already settled before S590).
- Commit subject: `Slice 590: evaluate Polo DXF fillet transfer`.

## Next action

Begin S591 from this exit packet and the exact C:-only analyzer evidence.
Keep CLO open; do not change any V02/V03 gate or modify pattern-source
geometry without the applicable separate approval.
