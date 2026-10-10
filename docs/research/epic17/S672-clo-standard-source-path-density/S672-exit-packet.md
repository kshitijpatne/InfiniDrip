# EPIC-17 / G04 V03 — Slice 672 exit

## Outcome

S672 imported the hash-pinned S671 Polo M exact-path derivative into CLO
2026.1.310 via File → Import → DXF (Open), Standard DXF, centimeter, 100%, no
rotation, Maintain Original grain, notch Both/Ratio, and the frozen S617
settings. Nine pieces rendered in the native 2D window and the receiver
project was saved under the approved C: evidence folder. The source fixture
is byte-identical to the S671 preflighted input. This is one-generation
vendor-specific empirical evidence; it is not ANSI/AAMA or ASTM conformance.

The native snapshot PDF contains nine pieces but renders their linework very
faintly at the whole-layout scale and supplies no piece names. This saved
render therefore fails the readable-output gate. The reviewed PNG is a
Poppler rasterization of the saved CLO snapshot PDF, not a replacement for the
PDF evidence.

## Export deviation and measured result

The start packet required stopping before export if the representative native
import missed any gate. The measured import review had not been closed before
the operator proceeded to File → Export → DXF. That export was outside the
planned gate sequence. The deviation is disclosed here; it is not presented as
a qualified round trip and no re-import was attempted. The output is retained
only as exploratory diagnostic evidence. No further CLO mode/setting/entity
variation is authorized by this slice.

The pinned export is 104,416 bytes, SHA-256
`e0ab634dd03562c33cc3cd07f70c320bdfdb2a917045a48aa75ab6748c3e631f`.
It contains nine receiver-generated INSERT blocks named `0_M`–`8_M` (plus
model/paper-space blocks), 57 LWPOLYLINE entities, and numeric layers `1`,
`7`, `8`, and `14`; source names and semantic layer labels are not retained.
The original source inventory has nine CUT and nine SEW closed polylines,
18 placement points, and 20 additional typed marks (cutline, placement,
fold, button, and buttonhole entities). Output inventory does not retain
POINT, LINE, or CIRCLE entity types or source mark/layer identifiers.

The original S671 fixture declares `$INSUNITS=5` (centimeters). CLO output
declares `$INSUNITS=4` (millimeters), while inserted geometry coordinates
remain numerically in centimeter-scale values. A receiver honoring the output
header therefore interprets the same numbers at a 10× smaller physical scale.
This independently fails units/scale integrity.

The hash-pinned geometry analyzer binds pieces by unchanged SEW contours and
compares all 18 outlines without alignment. At the fixed `0.001 cm` threshold,
9/9 SEW and 4/9 CUT pass. Front, sleeve, button placket, and buttonhole
placket CUT pass. Back, outer and inner collar stands, upper collar, and
under-collar CUT fail at conservative upper-bound residuals `0.00706865`–
`0.00755961 cm`; CLO reduces those outlines from 57→44, 242→147, and 232→137
vertices. No geometry threshold changed. Independent source derivative
preflight remains exact (0.000 cm path residual); the receiver causes the
loss.

## V03 gate delta

- **Passed:** bounded CLO trial and local file handling (maintainer-confirmed);
  nine-piece presence; exact source/fixture hash binding; source derivative
  mathematical path preservation; 9/9 SEW geometry at `0.001 cm`; legacy DXF
  and protected output identities remain unaffected by this evidence-only
  slice.
- **Failed:** representative CUT fidelity (4/9); units/scale metadata;
  semantic layer and source identity preservation; typed marks inventory;
  whole-layout saved-render readability.
- **Unproven:** export re-import round trip (not attempted after gate failure),
  repeatability, malformed-input rejection, grades, seven-recipe/73-option
  breadth, all-option output readability, and completed exchange profile
  documentation.
- **Unchanged prerequisite:** V02 remains Done for seven recipes, 73 supported
  options, and 146 front/back views. No face hold or acceptance gate is
  relaxed.

## Verification and timing

- Receiver interaction and evidence analysis: 22 minutes total, including
  review of the native output, inventory/parser correction, and measurements.
- Focused verification: `node --check` and execution of both hash-pinned
  analyzers passed; measured geometry result is 4/9 CUT, 9/9 SEW. Rendered PDF
  and PNG reviewed. No production code or tests changed; changed-code coverage
  is not applicable.
- External-agent wait: 0 minutes. No safe independent ownership existed.
- Maintainer-decision time: 0 minutes. All prior approvals, including the
  `/2` grainline convention, remain settled.
- At this safe boundary, `get_goal` reports **active** and the objective still
  matches the admitted EPIC-17 completion path through safe merge. The app's
  “stalled” label is stale; the goal needs no wording or status reconciliation
  and no manual resume.

## Next action

Treat the tested CLO Standard-DXF route as disqualified for the admitted
profile, and DGS routes as retired by their recorded failures. Do not repeat
them. S673 must evaluate a source-bound lossless adapter path against the
existing DXF source/output fixtures and fixed acceptance gates before
production integration. If an adapter cannot restore receiver identity,
units, geometry, marks, invalid-input behavior, and re-import evidence without
making an unsupported CAD compatibility claim, keep V03 open and use the
verified external receiver blocker recorded in the updated gate plan.

No physical fit, factory acceptance, launch, or production-readiness claim is
made.
