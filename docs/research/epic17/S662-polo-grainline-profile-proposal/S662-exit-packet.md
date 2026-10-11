# EPIC-17 / G04 V03 — source-exact Polo grainline derivation — Slice 662 exit

## Result

S662 confirms the exact source geometry behind S661's nine DGS warnings.
The S648 fixture carries the generating revision
`ef28519c21314eed0280ed4e6982849284da16b6`, garment `polo`, size `M`, and nine
source-identified piece blocks. Its hash is
`ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461` (153,647
bytes). The grainline rule sources are `POLO_NOTCHES` and `TSHIRT_NOTCHES`;
`resolveGrainline`, `flattenPiece`, `layoutPieces`, and `exportDxf` at the
fixture-generating revision derive source rules and the writer's existing
translation/Y-axis mapping. The five mapped source files are unchanged at
the current HEAD relative to that fixture revision.

The read-only analyzer reconstructs every existing CUT polyline with zero
coordinate residual against its corresponding S648 block and tests 501 points
along each proposed grainline against the actual parsed block CUT polygon.
All 4,509/4,509 samples are inside the matching polygon. The segment endpoints
below are exact rule results rounded to the existing writer's 0.001 cm
precision and transformed into S648's centimeter DXF coordinates. “Top” means
the rule's `topEdge/topT`; “bottom” means `bottomEdge/bottomT`.

| Source role / DXF block | Source rule | DXF top (cm) | DXF bottom (cm) | CUT vertices / max residual | Inside samples |
|---|---|---:|---:|---:|---:|
| front / `IDR_POLO_FRONT` | neckline 0.5 → hem 0.5 | (5.950, 68.811) | (14.750, 4.468) | 33 / 0 cm | 501/501 |
| back / `IDR_POLO_BACK` | neckline 0.5 → hem 0.5 | (36.450, 72.732) | (45.250, 3.000) | 33 / 0 cm | 501/501 |
| sleeve / `IDR_POLO_SLEEVE` | capLeft 1.0 → hem 0.5 | (84.644, 74.742) | (84.644, 50.955) | 31 / 0 cm | 501/501 |
| buttonPlacket / `IDR_POLO_BUTTON_PLACKET` | top 0.5 → bottom 0.5 | (114.288, 74.742) | (114.288, 60.742) | 4 / 0 cm | 501/501 |
| buttonholePlacket / `IDR_POLO_BUTTONHOLE_PLACKET` | top 0.5 → bottom 0.5 | (126.288, 74.742) | (126.288, 60.742) | 4 / 0 cm | 501/501 |
| outerStand / `IDR_POLO_OUTER_COLLAR_STAND` | backCollar 0.5 → backNeckline 0.5 | (138.238, 64.676) | (138.238, 62.676) | 54 / 0 cm | 501/501 |
| innerStand / `IDR_POLO_INNER_COLLAR_STAND` | backCollar 0.5 → backNeckline 0.5 | (155.881, 64.676) | (155.881, 62.676) | 54 / 0 cm | 501/501 |
| upperCollar / `IDR_POLO_UPPER_POINTED_COLLAR` | backCollarBase 0.5 → outer 0.5 | (173.525, 64.676) | (177.548, 56.569) | 44 / 0 cm | 501/501 |
| underCollar / `IDR_POLO_UNDER_POINTED_COLLAR` | backCollarBase 0.5 → outer 0.5 | (193.125, 64.676) | (197.148, 56.569) | 44 / 0 cm | 501/501 |

## Facts versus proposal

- **Directly encoded in product source:** the listed edge names/fractions are
  the Polo M grainline rules. They resolve against the exact source piece
  geometry. Existing flatten/layout and DXF Y inversion produce the tabulated
  coordinates. No cut geometry, piece multiplicity, stitch graph, or legacy
  DXF bytes need to change.
- **Directly encoded in S648:** every block has a stable piece role and source
  revision XDATA; `$INSUNITS=5` declares centimeters; there are nine CUT
  polylines and no grainline layer/entity. Existing entity geometry matches
  the pinned source generator exactly.
- **Directly observed in DGS S661:** the selected AutoCAD import with Grainline
  `2 Way` reports one outside-border error for each of these nine pieces.
  Its manual/dialog does not document the mapping by which it finds a
  grainline.
- **Inference only:** adding one rule-resolved line inside each same-identity
  block may satisfy the receiver's requested grainline input. S661 does not
  prove this; `GRAINLINE` as a layer name and `LINE` as the represented entity
  are not documented by GetonAgain.

## Concrete proposed decision

If approved, create a distinct versioned profile `idr-pattern-exchange/2` and
add exactly one DXF `LINE` on layer `GRAINLINE` inside each of the nine
existing piece blocks at the coordinates above. Keep INSERT/XDATA identity,
centimeter units, CUT, SEW, marks, all existing vertices, order and layout
unchanged. Keep the legacy R12 writer and its protected bytes unchanged.
This proposal adds only source-defined direction markings; it does not claim
the profile is ASTM/AAMA or that GetonAgain documents or supports the
convention.

The single decisive follow-up is one re-import into the already open DGS
`VID:20250610` with the same AutoCAD mode, Grainline `2 Way`, unit-of-file and
other frozen settings. Pass only the narrow trial if all nine warnings clear,
rendered pieces stay readable, and independently compared CUT/SEW/marks/units
remain unchanged with CUT and SEW at `0.001 cm`. Stop on any warning or loss.
Even a pass clears only that narrow empirical warning/input-mapping question;
it does not establish export, round trip, repeatability, negative handling,
grades, C04 relationship semantics, seven-recipe breadth, receiver
qualification, or any standard-conformance claim.

## Slice boundary and next action

- Start: 2026-10-10 07:54 UTC from S661
  `9e18b83b6865768bfac487218c620a1fda0b3ac5`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  Highest landed slice was S661; S662 was reserved uniquely. Board revision
  3850 at start, 3855 after validated start replay, and 3865 after exit
  evidence/comments and refreshed Epic/V03 descriptions with regression-guarded
  V01/V02 decision facts preserved.
- Analyzer: `derive-polo-grainlines.mts` verifies fixture hash, 9/9 role/block
  matches, exact source CUT reconstruction (max residual 0 cm), and 501/501
  interior samples for each of nine proposed lines. It writes no exchange
  files and changes no production code or tests. Pinned source files are
  unchanged since the generator revision.
- Focused verification: analyzer exited 0; `npm run control-center:test`
  passes 42/42 after the final board replay; `git diff --check` passes. No
  production code changed, so changed-code coverage does not apply. No app or
  receiver operation occurred in S662; DGS remains open with the S661 error
  visible.
- Elapsed accounting: implementation 0m; source derivation/computation about
  2m; focused verification and diagnosis of the initial summary-guard failure
  about 3m; durable packet/state/board closeout about 4m; external-agent waits
  0m; maintainer-decision time 0m. Total about 9m35s
  (07:54–08:03:35 UTC).

**Next:** obtain the one explicit decision on this undocumented but
source-exact additive grainline-layer convention. Do not implement it or run a
second receiver import without approval. Keep all V03 gates and acceptance
unchanged; S661's narrow AutoCAD-mode warning-free pilot remains failed.
