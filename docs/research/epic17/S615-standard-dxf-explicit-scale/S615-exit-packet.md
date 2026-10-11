# EPIC-17 / G04 V03 — Standard-DXF explicit-scale diagnostic — Slice 615 exit

## Verified result

- Closed 2026-10-09 12:29 UTC on `codex/epic-17-g04` from S614 commit
  `8a2e43de7a65ab0b5f71a1aed5ff174ba86db5d7`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S614 was the highest assigned slice; S615 is unique. Start replay was
  `3591→3593`; exit commands are `3593→3596`.
- The controlled CLO 2026.1.310 test changed only Standard-DXF import scale
  from 100% (S614) to 1000%. It retained the exact Polo M source
  (`796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`),
  centimeter unit selector, rotation, grain, notch/curve options, ASTM Graded
  Nest export settings, and `0.001 cm` comparison gate. CLO imported, exported
  and same-profile re-imported the result without a format error; it displayed
  the informational seam-allowance Custom-mode notice.
- **The scale hypothesis failed.** Output block `0_M` still measures
  2.850001 × 7.3274 against source front coordinates 28.5 × 73.274: 0.1× in
  both axes. Exact cyclic/reverse path correspondence still prefers factor
  0.1 for all 18 CUT/SEW outlines; 8 paths match exactly at that factor and 10
  have changed vertex counts/geometry. The unchanged 1000% gate was not met.
- Comparing S614 and S615 exported DXFs line by line finds only four metadata
  line differences: output style name and creation time. All geometry and
  remaining DXF content are identical. Thus changing import scale to 1000%
  produced no observed change in exported geometry for this fixture.
- The source header contains neither `$INSUNITS` nor `$MEASUREMENT`; it does
  not declare units. This is a directly checked file fact, not evidence for any
  particular physical unit convention. A unit-selector sensitivity test is a
  reasonable next diagnostic, but must remain isolated and measured.
- CLO's saved re-import scene and screenshot show nine recognizable piece
  shapes. They do not prove legible production marks, named layers, exact
  profile semantics, stable identity, or useful details at all required zooms.
  No V03 gate is cleared.

## Evidence and hashes

All CLO/import/export/review files are retained only under
`C:\G04-CLO-DXF-Exchange\S615-standard-dxf-explicit-scale\`.

| Artifact | SHA-256 |
|---|---|
| ASTM DXF output | `66e883f34672511aeee60621c7deb3544843e80a3f4b16a337a344da112918de` |
| Same-profile re-import scene `.zprj` | `39e0b44457cfd35715cb88345f0e0401a839f7c28d4e2f0a556da8ccc9435cfd` |
| Rendered CLO session PNG | `835aa4799621c02d511b54170e3ab016db19b6b3053dfbc4a059a17b944e4119` |
| Exact scale diagnostic JSON | `cb78eba0cec1f116c7cdb50626e000d942958968875b0c7d4d0609e60508ca7f` |
| Sampled geometry screening report JSON | `7dee4e7b45b2b056177bb6bdecfbcb7691970f0b804aa9053a51e67cd0467fda` |
| Output DXF inventory JSON | `80d013a27a07389434e074fbd27421971dc9539ab5c1ff52184a7545db933695` |

The exact vertex diagnostic and unchanged `0.001 cm` gate are controlling.
The sampled-distance report uses a documented `0.05 cm` step solely to screen
the gross 10× mismatch; its coarse bound cannot certify a pass and does not
replace the exact gate. The first `0.0005 cm` brute-force fallback exceeded a
minute without output; it was stopped, profiled, and excluded. The coarser
screen then completed in 1.65 seconds. No test-runner defaults changed and no
process from that analysis remains running.

## Gate disposition

S615 confirms that explicit 1000% Standard-DXF import scale does not fix the
observed scale loss in this fixture. Preserve the all-seven recipe criterion,
`0.001 cm` geometry gate, all V03 rights/profile/identity/semantic/marks/
grades/options/negative-input/repeated-round-trip/render gates, legacy DXF
behavior and protected export identities. CLO use for this evaluation and
local-only file handling are confirmed by the maintainer. No pattern source,
product code, export baseline, or acceptance criterion changed. No claim of
physical fit, factory acceptance, or production readiness is made.

## Verification and time accounting

- `node --check analyze-explicit-scale-roundtrip.mjs` passed. Exact scale
  diagnostic completed in about 2 seconds; the coarser gross-distance screen
  completed in 1.65 seconds. Rendered CLO screenshot was inspected and the
  `.zprj`, output DXF and diagnostics were hash-pinned. `npm run
  control-center:test` passed 42/42; exit preflight and validated board replay
  passed through revision 3596; `git diff --check` passed. No production code or
  tests changed; changed-code coverage is not applicable. Full repository
  tests/coverage remain due once on the settled integrated Epic/PR candidate.
- Formal packet boundary began 12:16 UTC and closed 12:29 UTC. Implementation
  and evidence production took about 8 minutes; focused verification took
  about 5 minutes; external-agent waits 0; maintainer-decision time 0. The
  initial `0.0005 cm` brute-force fallback consumed about 1 minute and was
  stopped; its failure is retained above.

## Single next action

Run one controlled import-unit sensitivity test on the same hash-pinned Polo M
source, changing only CLO's unit selector from centimeter to millimeter while
keeping scale at 100% and all other settings fixed. The file is unitless
(`$INSUNITS` and `$MEASUREMENT` are absent); measure emitted and re-imported
geometry, and retain all V03 holds unless the unchanged gates pass.
