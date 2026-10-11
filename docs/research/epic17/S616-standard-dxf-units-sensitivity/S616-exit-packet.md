# EPIC-17 / G04 V03 — Standard-DXF unit-selector diagnostic — Slice 616 exit

## Verified result

- Closed 2026-10-09 12:39 UTC on `codex/epic-17-g04` from S615 commit
  `083f11f55b8aacc401473cbccc5bc6868d572958`. Fetched `origin`; current
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S615 was the highest assigned slice; S616 is unique. Board start replay was
  `3596→3598`; planned exit replay is `3598→3601`.
- The CLO 2026.1.310 trial changed only Standard-DXF import Unit from
  Centimeter (S614/S615) to Millimeter; import scale stayed at 100%. The same
  hash-pinned Polo M source, other import options, ASTM Graded Nest export at
  centimeters/100%, and `0.001 cm` gate remained fixed. CLO imported, exported
  and re-imported nine pieces without a format error and displayed its
  seam-allowance Custom-mode notice.
- **The unit-selector hypothesis also failed to change exported geometry.**
  S616 output is 199,028 bytes. Line comparison with S614's centimeter output
  finds only four metadata lines different (style name and creation time);
  every coordinate and remaining DXF line is identical. The source front
  remains 28.5 × 73.274 while output block `0_M` measures 2.850001 × 7.3274
  (0.1×). The exact scale diagnostic prefers factor 0.1 for all 18 CUT/SEW
  outlines; 8 match exactly at that factor, while 10 have changed vertices.
- The DXF declares neither `$INSUNITS` nor `$MEASUREMENT`; the file contains no
  unit metadata. This observation does not establish which unit convention the
  original author intended. Changing either the CLO import scale (S615) or
  unit selector (S616) does not change emitted geometry for this fixture.
- Same-profile ASTM re-import rendered nine gross pattern shapes. It does not
  prove readable production marks/details, layer semantics, stable piece
  identity, exact format compatibility, or full-profile interoperability.
  Direct source-contour gate remains 0/9 CUT and 0/9 SEW; no V03 gate clears.

## Evidence and hashes

All exchange and CLO scene/render evidence stays under
`C:\G04-CLO-DXF-Exchange\S616-standard-dxf-units-sensitivity\`.

| Artifact | SHA-256 |
|---|---|
| Hash-pinned source input | `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca` |
| ASTM DXF output | `e15b7929bc5c850bbfe348adf2b280deeb099a0c7be6c76135566fff978f0b9e` |
| Millimeter-import screenshot | `858161498a60ea1d390fedcd91b00ec38657461439f68b46adbd92d5901098d8` |
| Millimeter-import CLO scene `.zprj` | `599e6e0b3a8ace64a78dff965496b44add9e4178a8a0d48b00639bd8e9fbb808` |
| ASTM re-import screenshot | `846493bca3729f56546985e7e2ba9289cb2c7ab2ec5ba39cc0647b2b38a43672` |
| ASTM re-import CLO scene `.zprj` | `ec99bb1ce75438b811e2ec2caaa96b7755e02fc2b3e55c37ad6220f29f9fa7c9` |
| Exact scale diagnostic JSON | `cb78eba0cec1f116c7cdb50626e000d942958968875b0c7d4d0609e60508ca7f` |
| Contour comparison JSON | `15e5fe7e12aa0d9699e12d6e28c16a7067ad438b6ef79fa3454ad1f42d0905a0` |
| Output inventory JSON | `80d013a27a07389434e074fbd27421971dc9539ab5c1ff52184a7545db933695` |

The sampled-distance report uses `0.05 cm` spacing only to screen the gross
scale difference. It cannot certify a pass and does not replace the exact
`0.001 cm` gate. The earlier `0.0005 cm` brute-force comparison took over a
minute in S615 and was stopped; no full-repository gate or runner default was
changed.

## Gate disposition

S616 confirms that selecting Millimeter does not fix the Standard-DXF scale
loss; S614/S615/S616 exports have identical geometry. Do not repeat these
Standard-DXF control variations on the same fixture. Preserve all-seven
acceptance, the `0.001 cm` threshold, every rights/profile/identity/semantics/
marks/grades/options/negative-input/repeated-roundtrip/render hold, legacy DXF
behavior, and protected export byte identities. No product code, source
pattern, export baseline or acceptance criterion changed. Written CLO
product-development and local-only handling authorization is confirmed. No
physical-fit, factory-acceptance or production-readiness claim is made. CLO
remains open.

## Verification and time accounting

- `node --check analyze-units-roundtrip.mjs` passed. Exact scale diagnostic,
  output inventory and contour report completed; output was compared with
  S614, and both CLO screenshots/scenes were inspected and hash-pinned.
  `npm run control-center:test`, exit preflight, validated board replay and
  `git diff --check` are recorded at closeout. No production code or tests
  changed; changed-code coverage is not applicable. The one full repository
  tests/coverage gate remains due on the settled integrated Epic/PR candidate.
- Formal slice boundary began 12:32 UTC and closes at 12:39 UTC. CLO setup,
  round trip and evidence capture took about 4 minutes; focused analysis,
  closeout verification and board/state update about 3 minutes; external-agent
  waits 0; maintainer-decision time 0.

## Single next action

Do not run another CLO unit/scale variation against this same unchanged file.
Compare the existing source DXF's unitless Standard-DXF representation with
the prior AAMA route and source writer/fixture contract, then select one
evidence-based next receiver/profile test. Keep the all-seven requirement and
all V03 holds unchanged.
