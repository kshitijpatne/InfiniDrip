# EPIC-17 / G04 V03 — read-only periodic pre-export outline query — Slice 597 exit

## Verified boundary

- Started `2026-10-09 08:53:13 UTC` on `codex/epic-17-g04` from S596
  `79642412076223663b24790d821c1f6cf93f4b7a`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S596 was highest; S597 was uniquely reserved.
- Start board replay `3518→3520`; EPIC-17/G04-V03 remains In Progress and
  G04-V02 remains Done. All V03 gates and the fixed `0.001 cm` acceptance
  threshold remain unchanged.
- CLO 2026.1.310 remained running throughout. Only the computer-use helper
  was reset. The subsequent accessibility state and screenshot both showed
  the same nine-piece pattern canvas, with no hidden Export DXF dialog.
  Existing S595 pre-export scene remained open. The maintainer's written
  product-development and local-processing authorization remains on record.
- All new CLO output is in
  `C:\G04-CLO-DXF-Exchange\S597-clo-helper-recovery\`; no project or DXF was
  imported/exported or saved in this slice.

## Allowlisted read-only operation

The inspected Python helper calls only
`pattern_api.GetPatternCount`, `GetPatternPieceName(index)`, and
`GetPatternLineInfo(index)` for indexes 0–8. It writes a JSON capture to the
S597 C: evidence folder. No setter, export, save, simulation, option change,
or pattern mutation is present. CLO ran the script from its visible Python
Editor and returned 9 pieces with no API-call errors. The capture file's
SHA-256 is
`63A3857B8398F6723B041B3C6E305F3006B364C0EF1FAD185A71590537ACC269`.

Input identities:

- S536 Polo M R12 source DXF: SHA-256
  `9062B0D6442354165C5640EF3CA98B717AAEF6F4339EAC1DE99255D7D1750FA2`.
- S595 periodic degree-1 SPLINE candidate: SHA-256
  `E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC`.
- S595 saved pre-export CLO project: SHA-256
  `f402095a5907b0719cce2c76bee4e42e3607016c369ba38c30a9bef03ca834d4`.
- Read-only CLO API helper: SHA-256
  `3406E7A4BE791995BC5E272FA332937BA6F0545A73CE333E446B23EE47C121B1`.

## Measured result and interpretation

For all nine returned line sequences, adjacent endpoints and the closing
endpoint coincide exactly in the captured numeric frame; their endpoint
bounds exactly equal CLO's reported boxes. API line counts are
`33, 6, 31, 4, 4, 58, 58, 15, 15`.

The machine comparison converts source centimeters to API millimeters by
`×10`, without fitting a transform. It applies the unchanged 0.001 cm value
only as a **diagnostic source-proximity screening threshold** using symmetric
vertex-to-opposing-segment minimum distances. It is not the V03 contour
acceptance measurement and cannot clear or fail that gate. Five API outlines
screen uniquely near source contours: indexes 0, 2 and 4 are near contours
whose literal source DXF layer is `CUT` (residuals `0.0000764`, `0.0001037`,
and `0.0001184 mm`); indexes 5 and 6 are near literal `SEW` contours
(`0.0001172` and `0.0001174 mm`). Indexes 1, 3, 7 and 8 have no direct source
match at that threshold; their best screen residuals are `22.9465`,
`117.2060`, `45.2668`, and `45.2667 mm`, respectively.

The API docs do not assign CUT/SEW manufacturing roles or say whether these
lines represent imported, normalized, or export-stage geometry. The numeric
API indexes are not mapped to garment-piece identities here. The five exact
source matches establish only that returned paths geometrically coincide
with those source contours in this queried scene. The four non-matches are
specific measurable observations, but do not identify their cause. S595's
separate DXF-AAMA export remains the controlling receiver round-trip evidence:
it passed 4/9 Polo M CUTs and 9/9 SEWs and failed five CUTs at `0.001 cm`.
S597 changes none of those results and clears no V03 gate.

## Scope, evidence and gates

No product code, pattern geometry, stitch graph, settings, legacy DXF
behavior, protected export identity, user-facing UI, or acceptance criterion
changed. No seven-recipe evidence, qualified industrial CAD profile, stable
serialized identity, CUT/SEW semantics, useful-zoom marks, grades/options,
malformed-input rejection, or repeated-round-trip proof was added. All V03
gates remain open, including the five S595 Polo CUT failures. No physical-fit,
factory-acceptance, or production-readiness claim is made.

The result matrix is
`docs/research/epic17/S597-clo-helper-recovery/V03-CURRENT-GATE-MATRIX-S597.md`.
Raw API capture and comparison report remain under the named C: folder. The
comparison analyzer SHA-256 is
`916E73C60BEB49EE0285ECC3A32DAC89D48C97D6C52083E871F650E4104F0D4A`; its
report SHA-256 is
`ACEBFB70D57967EEEE79B51BC4BC91EF0EF1DA5D15D436682085F29D213146D9`.

## Focused verification and time

- `node --check` and the pinned-hash comparison analyzer pass. CLO's
  successful JSON result verifies the helper script executed; `py` is not
  installed in the Windows shell, so no separate local Python compile was
  available.
- The initial comparison analyzer failed `node --check` because of one
  missing closing parenthesis. It was fixed before relying on its output and
  rerun successfully against all pinned inputs.
- Start and exit board commands are preflighted and replayed through the
  validated command layer; the Control Center suite and `git diff --check`
  are exit gates. No production code/tests changed, so changed-code coverage
  is not applicable. Full repository gates remain reserved for the settled
  integrated Epic/PR candidate.
- Start `08:53:13 UTC`; verified boundary `09:03:52 UTC` (10m39s total).
  Approximate allocation: helper recovery and coherent UI check `2m10s`; CLO
  API query and output retrieval `1m30s`; source comparison and diagnosis
  `2m10s`; packet/matrix/state and board work `3m10s`; focused gates, board
  replay and final review `1m39s`; external-agent waits `0m`; maintainer-
  decision time `0m`.

## Single next action

Reserve S598 only after refreshing Git history and board state. Select one
falsifiable receiver-stage question from the four unmatched API outlines, and
design a controlled trial that measures input geometry, the CLO-imported
scene, and exported DXF separately. Preserve all current V03 gates, and do
not repeat SPLINE flag/knot variants or infer API semantics from these
coordinates.
