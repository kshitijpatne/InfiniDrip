# EPIC-17 / G04 V03 — CLO CUT LWPOLYLINE import — Slice 635 exit

## Outcome

S635 completed the single controlled CLO 2026.1.310 Standard-DXF import in
the already-running, authorized local CLO session. The disposable derivative
changed only the entity encoding of the nine closed `CUT` contours from
classic `POLYLINE`/`VERTEX`/`SEQEND` to coordinate-identical `LWPOLYLINE`.
The preflight proves all nine ordered 3-decimal coordinate arrays are
identical, and every other entity, layer, mark, header, unit, section and
record is unchanged.

The native CLO query returned nine numeric piece identities (`0`–`8`) with no
query errors. Geometric matching used the source contour order, same numeric
piece identity, and cyclic point comparison in both windings after cm-to-mm
conversion. Four controls match exactly within the unchanged `0.001 cm`
gate: front (33 vertices), sleeve (31), button placket (4), and buttonhole
placket (4). Five contours each omit one source vertex while their retained
vertices match within `0.000014 cm`:

| Piece | Missing source point | Adjacent source steps (cm) | Deviation from CLO's joined chord (cm) |
|---|---|---:|---:|
| back | P13 `(37.489, 74.514)` | 0.045618 / 1.244020 | 0.012736 |
| outer collar stand | P14 `(139.277, 66.459)` | 0.046519 / 9.403408 | 0.012983 |
| inner collar stand | P14 `(156.921, 66.459)` | 0.046957 / 9.403249 | 0.013970 |
| upper pointed collar | P14 `(174.564, 66.459)` | 0.046519 / 9.403408 | 0.012983 |
| under pointed collar | P14 `(194.164, 66.459)` | 0.046519 / 9.403408 | 0.012983 |

Each joined-chord deviation exceeds the `0.001 cm` requirement. The result
reproduces the same five source points identified by S634 and the prior
Standard/ASTM CLO routes. Therefore changing the CUT entity representation
alone does not resolve the native geometry defect. This is a direct
measurement of the returned CLO pattern geometry, not a claim about CLO's
internal simplification algorithm.

The saved actual CLO overview shows all nine imported pieces. Five magnified,
rendered overlays compare each actual native CLO chord against its
hash-pinned source neighborhood. The comparison JSON records the CLO project
hash, query hash, all matched shapes, each per-piece result, rendered artifact
hashes and the stop-before-export verdict. All are in the required C: folder.

The failure is the packet's explicit stop condition. No DXF was exported and
no second import, settings change, point deletion, source edit, tolerance
change, export-baseline change, acceptance change, status change, or hold
release occurred. V03 remains open and the full G04 exit criteria are
unchanged. CLO stays open in its current session.

## C:-only evidence and verification

The isolated exchange folder is
`C:\G04-CLO-DXF-Exchange\S635-cut-lwpolyline-import\`. Main pins:

| Artifact | SHA-256 |
|---|---|
| Original S617 cm-header fixture | `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5` |
| Coordinate-preserving LWPOLYLINE derivative | `606316F41F22E3AE930E2DE404B62AD4F6186120CEC0643A90EB96EA63D9F360` |
| Saved Standard-import CLO project | `E03E0762DB05AB9D7D8B4363F7DBAEFEF5E71DF48B01563C8EAE171ADA6D8ED0` |
| Native `GetPatternInputInformation` result | `1717BD1A75F43DD09D9D998601BACC52572D20BEB6669C17AFC0FF742754E934` |
| Native CUT comparison and evidence index | `99256CFC2036001AC0A52E97DF8E8ED968EB983D63328FFA9E5720D534B939B4` |
| Actual CLO nine-piece overview screenshot | `AAA721DB50891B1DE8C7BF654EEBC386D2F8E23C17B98B9EE919ACADF162088B` |

The comparison JSON also pins the individual SVG/PNG hashes for all five
affected contour crops. The exact import values were checked in CLO's live
Standard-DXF dialog against S617: centimeters, 100%, Do Not Rotate, original
grain, source draw-curve points retained, annotation/auto-trace/swap/auto-
distribution/curve-optimization/remove-non-grading-point disabled, notches
to both by position ratio, and unchanged seam-allowance handling. The 2D
overview was visually reviewed. No error modal or missing-piece condition
appeared. The settings were observed directly in the dialog; the dialog was
not saved as a screenshot, so its exact-setting evidence is the start packet
and the reused hash-pinned S617 settings record, not a newly retained dialog
image.

Focused verification: `node --check` passed for the native analyzer and exit
helpers; `preflight-derivative.mjs` passed all exact-change assertions;
`analyze-native-import.mjs` reproduced four passes and five expected native
omissions and refused the export branch; five PNG crops and the actual CLO
overview were opened and reviewed; validated exit replay passed at board
revision 3684; `preflight-exit.mjs` passed all hash, result, no-export,
status/hold and ancestry assertions; `npm run control-center:test` passed
42/42; and `git diff --check` reported no whitespace errors (only the
repository's LF/CRLF working-copy notices). This is research/evidence only;
no changed production code means changed-code coverage is not applicable.
Full repository tests/100% coverage, build, integrated browser/output review,
PR, safe merge, ancestry, and required deployment remain for the settled Epic
candidate.

## Gate disposition and next bounded test

Do not export this failed Standard-import project. S632 already tested the
DXF-ASTM import mode with classic POLYLINE CUT entities and found the same
five omissions. Together, S632 and S635 cover three cells of a small,
source-bounded receiver matrix: classic POLYLINE with ASTM, classic
POLYLINE with Standard, and LWPOLYLINE with Standard. The one remaining
matrix cell is LWPOLYLINE through CLO's recorded DXF-ASTM import settings.
It is justified because that is the only untested combination of the two
independent variables and the ASTM path is the tested industrial exchange
candidate; it does not repeat S632's exact fixture-and-mode pair. If S636
fails the native `0.001 cm` gate, stop this CLO CUT-encoding path and use the
matrix as evidence when selecting another receiver/profile. Only a full
native pass could permit its packet's single conditional round trip. No
standards-conformance inference follows from a menu label.

S635 started `2026-10-09 19:29:40 UTC` from committed S634
`10ed333ecb8323e7a3b1cb2a381e3c0a414af4eb`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; board start
replay was 3680→3682. At close, board replay is 3682→3684, preserving V01/V02
Done and V03/EPIC-17 In Progress. Elapsed through verification and closeout
was approximately 31m21s (19:29:40–20:01:01 UTC): controlled CLO import/setup
and native query 13m; source-bound comparison and rendered evidence 9m;
focused verification including the 42-test Control Center run 3m; durable
packet, state and board closeout 6m21s; external-agent wait 0m;
maintainer-decision time 0m. These categories are approximate and
non-overlapping.

No physical-fit, factory-acceptance, normative ASTM-conformance, or
production-readiness claim is made.
