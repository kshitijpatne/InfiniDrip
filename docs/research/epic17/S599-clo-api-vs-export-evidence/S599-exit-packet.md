# EPIC-17 / G04 V03 — join pre-export API evidence to CLO DXF result — Slice 599 exit

## Verified boundary

- Started `2026-10-09 09:12:46 UTC` on `codex/epic-17-g04` from S598
  `b8bed366ba7a5ab3ee7f4013a475080dc87ce7b4`. Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S598 was
  highest; S599 was uniquely reserved.
- Board start replay `3526→3528`; EPIC-17/G04-V03 remains In Progress and
  G04-V02 remains Done. All V03 gates and the `0.001 cm` output threshold are
  unchanged.
- CLO remained open and untouched. S599 read only existing C:-confined
  reports; it created no DXF, made no CLO call, and changed no project or
  pattern.

## Inputs and join

The analyzer hash-pins S595's periodic-fixture round-trip report and S597's
pre-export line-info/source-comparison report. Both refer to the same
hash-pinned S536 R2000 source and exact S595 periodic fixture. S595 binds each
export receiver block to its source piece by unchanged SEW contour, then
measures the paired CUT against the source CUT. S599 associates the pre-export
getter match to a CUT only by its literal source-contour ordinal; it does not
map getter indexes to garment pieces or assign the getter a CUT/SEW contract.

## Result

| S595 source CUT / piece bound by SEW | S595 export gate | S597 pre-export getter has a direct source CUT match? |
|---|---:|---:|
| contour 0 / front | Pass | Yes |
| contour 2 / back | Fail | No |
| contour 4 / sleeve | Pass | Yes |
| contour 6 / button placket | Pass | No |
| contour 8 / buttonhole placket | Pass | Yes |
| contour 10 / outer collar stand | Fail | No |
| contour 12 / inner collar stand | Fail | No |
| contour 14 / upper pointed collar | Fail | No |
| contour 16 / under pointed collar | Fail | No |

The getter directly matches 3 of the 4 passing S595 CUT contours and none of
the 5 failing contours. But one passing CUT (button placket) is also absent
from the getter. Therefore a direct getter match happened to coincide with a
passing output for 3 contours in this one fixture; getter absence does not
distinguish a failing CUT from a passing one. There is no API contract for
these role labels or a stable piece identity, so this is not a predictive or
causal rule.

This answers the narrow stage question: the read-only getter cannot tell us
whether CLO imported all five periodic SPLINE targets, nor whether their
measured output losses arise during import, internal representation, API
exposure, or export. The concrete fact remains S595's practical
DXF-AAMA round-trip: 4/9 CUTs pass, 5/9 fail, and all 9/9 SEWs pass at
`0.001 cm`. No gate is cleared or relaxed.

## Evidence and verification

- Join helper:
  `docs/research/epic17/S599-clo-api-vs-export-evidence/join-api-to-roundtrip.mjs`.
  SHA-256 `02C10E73EA813FD3383BB9B7282A8D9C28C55BBFDA059A676BE680F94FB0241F`.
- Machine report:
  `C:\G04-CLO-DXF-Exchange\S599-clo-api-vs-export-evidence\Evidence\api-vs-roundtrip-cut-join.json`.
  SHA-256 `44B421F29C1231DFE7EDDF7B60E8FE9F1BA4955C55E0E5B2E2AC758A412C9DDF`.
- Source/fixture/output hashes and the full nine-row result are in the
  machine report. Raw DXFs and projects remain in their earlier named C:
  folders and were not modified.
- `node --check`, pinned report hashes, nine-piece/source-ordinal assertions,
  and output/result counts pass. Validated board preflight/replay passed
  `3528→3530`; Control Center tests pass `42/42`; `git diff --check` passes.
  No product source or tests changed; full repository gates remain reserved
  for the settled integrated candidate.
- Start `09:12:46 UTC`; verified boundary `09:16:00 UTC` (3m14s total).
  Approximate allocation: report join and result analysis `1m05s`; focused
  verification `0m40s`; packet/matrix/state/board closeout `1m29s`;
  external-agent waits `0m`; maintainer-decision time `0m`.

## Single next action

Stop pursuing CLO API stage attribution. Continue the remaining G04 V03
acceptance work from the actual DXF evidence: the next slice should identify
one independently addressable gate (for example, all-seven exchange coverage,
stable source identity, marks, grading/options, or negative-input behavior)
and either produce verifiable evidence or record its concrete blocker. Keep
the five Polo CUT failures, profile/right limits, and all other V03 gates
open.
