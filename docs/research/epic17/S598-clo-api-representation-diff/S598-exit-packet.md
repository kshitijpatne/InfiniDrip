# EPIC-17 / G04 V03 — compare CLO outline API across DXF representations — Slice 598 exit

## Verified boundary

- Started `2026-10-09 09:04:00 UTC` on `codex/epic-17-g04` from S597
  `f785a532072d24fcc0da17c817e09460b1517872`. Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S597 was
  highest; S598 was uniquely reserved.
- Board start replay `3522→3524`; EPIC-17/G04-V03 remains In Progress and
  G04-V02 remains Done. The fixed `0.001 cm` round-trip threshold and all V03
  gates remain unchanged.
- CLO remained open and was not touched in S598. No import/export, project
  save, UI change, or CLO API call occurred. All new machine output was saved
  under `C:\G04-CLO-DXF-Exchange\S598-clo-api-representation-diff\`.

## Inputs and comparability

The two already-captured API responses both come from CLO `2026.1.310`, each
reports nine successful indexed results, and each uses source geometry traced
to the same Polo M R12 DXF (`796E537E…65944FCA`):

- S580 imported the S574 connected-LINE derivative
  (`A95E2CBA…A0D1B675`). Its derivative proof confirms all nine source CUT
  contours became 301 closed LINE edges with original endpoint strings, while
  non-CUT polylines were retained.
- S597 imported the S595 periodic-SPLINE candidate
  (`E050B9DD…06CAEBC`). Its source preflight proves the five re-encoded
  contours match their source curves exactly.
- Both packets record DXF-AAMA, centimeter/100%, no rotation and original
  grain, with the same documented notches/curve points and optional
  annotation, autotrace, cut/sew-swap, distribution and curve-optimization
  choices. These are two saved project contexts, however; the captures are
  not a single-variable, same-project controlled CLO trial.

Source, fixture, proof and raw response hashes are pinned in the machine
report. API indexes are compared only as within-capture observation slots;
they are not treated as stable physical-piece IDs.

## Measured API difference

| Observation slot | S580 line-chain count / nearest source | S597 periodic-SPLINE count / nearest source | Direct-frame path delta |
|---:|---|---|---:|
| 0 | 33 / source contour 1, literal SEW | 33 / contour 0, literal CUT | 22.3607 mm |
| 1 | 33 / contour 3, literal SEW | 6 / no source match | 22.9464 mm |
| 2 | 31 / contour 5, literal SEW | 31 / contour 4, literal CUT | 21.3147 mm |
| 3 | 4 / no source match | 4 / no source match | 0.00013 mm |
| 4 | 4 / contour 9, literal SEW | 4 / contour 8, literal CUT | 14.1422 mm |
| 5 | 58 / contour 11, literal SEW | 58 / contour 11, literal SEW | 0.00014 mm |
| 6 | 58 / contour 13, literal SEW | 58 / contour 13, literal SEW | 0.00014 mm |
| 7 | 44 / contour 15, literal SEW | 15 / no source match | 93.1085 mm |
| 8 | 44 / contour 17, literal SEW | 15 / no source match | 93.1085 mm |

The fixed value `0.001 cm = 0.01 mm` is used here only for direct-source
diagnostic screening. The metric is symmetric source-vertex-to-returned-
segment and returned-endpoint-to-source-segment distance, not the V03
round-trip contour-acceptance measurement. Both captures' returned lines are
continuous/closed and their endpoint bounds agree with CLO's reported boxes
within this screening value.

S580 has eight direct source-contour proximities, all to literal `SEW`
layers, and no `CUT` match. S597 has five, comprising three literal source
`CUT`-layer matches and two `SEW` matches. Critically, none of the five
source-exact contours re-encoded as periodic SPLINE (source contour ordinals
2, 10, 12, 14, 16) has an API result within 0.01 mm in the S597 capture.
Their closest API slots are respectively `1` at 33.145 mm, `5` at 93.109 mm,
`6` at 93.108 mm, `7` at 45.267 mm, and `8` at 45.267 mm. The three S597
literal CUT-layer matches are different, unchanged source CUT contours
0, 4, and 8.

## Conclusion and limits

The API's returned path content is representation/context-sensitive in these
two captures. In particular, the periodic-SPLINE capture does not directly
expose any of its five re-encoded CUT contours through this getter, despite
their independent source-exact proof. This explains why `GetPatternLineInfo`
cannot settle whether the periodic CUT outlines entered CLO's internal model.
The observation does **not** prove that CLO discarded those curves: the API
may omit or transform them, and its docs define neither CUT/SEW roles nor
import/export stage semantics. The two captures also differ in project
context, so the comparison is not causal attribution to entity type alone.

This closes the useful `GetPatternLineInfo` comparison; do not repeat this
getter or infer an import-stage failure from its output. S574's actual
connected-LINE round trip failed all nine Polo CUT contours; S595's actual
periodic-SPLINE round trip passed 4/9 CUT and 9/9 SEW, failing five CUTs at
the unchanged 0.001 cm gate. Those practical DXF results remain the relevant
receiver evidence. S598 clears no V03 gate and changes no acceptance.

## Evidence and verification

- Comparison helper:
  `docs/research/epic17/S598-clo-api-representation-diff/compare-representations.mjs`.
  SHA-256 `6534E82388217B8CB4DD93B32C21769ABFF9073597C13B319FC9ACEE86BF8E1E`.
- Machine report:
  `C:\G04-CLO-DXF-Exchange\S598-clo-api-representation-diff\Evidence\representation-comparison.json`.
  SHA-256 `A720C0B8317E7993886A639E45F7F7C82A5DE2CB8360B1E2AFCF94C9E4FF9F6F`.
- Raw API inputs remain at the pinned S580 and S597 C: paths. No source or
  exchange artifact was modified.
- `node --check` and the pinned-hash comparison pass. A first comparison
  preflight required exact zero closure; the S580 capture's documented
  floating-point gaps are within 0.01 mm, so the screen was correctly changed
  to use the existing diagnostic tolerance. No acceptance threshold changed.
  Validated board preflight/replay passed `3524→3526`; Control Center tests
  pass `42/42`; script syntax and `git diff --check` pass. No production
  source/tests changed; full repository gates remain due on the settled
  integrated candidate.
- Start `09:04:00 UTC`; verified boundary `09:11:31 UTC` (7m31s total).
  Approximate allocation: source/fixture audit and hash pinning `1m35s`;
  comparison analyzer and report `2m25s`; diagnose/fix and rerun screening
  `1m20s`; packet/matrix/state/board and focused checks `2m11s`; external-agent
  waits `0m`; maintainer-decision time `0m`.

## Single next action

Stop using this getter as a stage-attribution tool. At S599, use existing
source-to-output evidence to compare the S595 pre-export observations with
its actual exported DXF and determine whether any concrete stage conclusion
is possible. If not, record that boundary and move directly to the next
remaining V03 acceptance item without another CLO API survey. Keep CLO open
and preserve all gates.
