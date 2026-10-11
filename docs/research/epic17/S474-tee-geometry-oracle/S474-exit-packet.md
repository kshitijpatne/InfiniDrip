# EPIC-17 / G04 V03 Tee source geometry oracle — Slice 474 exit

## Result

S474 adds a fixture-specific, deterministic source geometry oracle for the
S463 standard-M Tee DXF copy prepared in S473. It parses the exact source DXF
group pairs and records the six closed `POLYLINE` contours' original
coordinate strings/numbers, layers, bounds and order association with source
pieces `front`, `back`, and `sleeve`. The oracle includes the S463 source hash,
fixture-manifest commit, external centimeter basis, and 0.001 cm serialization
quantum. It contains 190 vertices across 6 outlines.

This is the original quantized input geometry reference—not a parser for CLO
output and not proof of import/export. CLO round-trip output has not yet been
returned. The DXF itself has no units variable or embedded piece names; these
associations are sidecar source knowledge from the S463 fixture manifest and
generator order. No output transformation or tolerance is silently applied.

## Verification

- Start: 2026-10-08 06:04:45 UTC from clean S473 commit
  `852cabea299b64015c9ef91222f4aad27cc99ce8`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; highest slice
  473 and S474 unique.
- Board revision 2919 at start; validated start replay 2919→2923. EPIC-17 and
  G04-V03 remain In Progress; V01/V02 Done.
- The source SHA matches the S463 manifest and the S473 prepared-copy SHA.
  The extractor preserves layer order `CUT, SEW` for each source piece and
  records six closed outlines with 32/32/32/32/31/31 vertices. It independently
  recomputes bounds from every stored coordinate.
- `node --test docs/research/epic17/S474-tee-geometry-oracle/tee-geometry-oracle.test.mjs`:
  3/3 pass, including deterministic regeneration and hash/piece/order/bounds
  checks.
- The receiver-independent S463 fixture verifier remains passing. No
  production source, test, DXF fixture, export baseline or protected byte
  identity changed. No global gate is due.
- Validated exit board replay advances revision 2923→2927 with G04-V03 and
  EPIC-17 still In Progress.
- End: 2026-10-08 06:07:20 UTC (2m35s elapsed): source inspection and oracle
  implementation 1m20s; focused verification/durable closeout 1m15s; external
  agent waits 0m; maintainer-decision time 0m.

## Next action

Use the S473 runbook for the local Tee import, native save/reopen and DXF export
in CLO 2026.1.310 within the reported free trial. Per the maintainer's direction,
stage and use every import/export file only inside
`C:\G04-CLO-DXF-Exchange`; capture exact dialog mode/units, warnings and native
output there. Compare output against this oracle and C04: correct source
geometry/layers/closed contours and no more than 0.001 cm coordinate error,
plus receiver-native screenshot inspection. If the file cannot preserve those
semantics, record the exact failure and keep V03 In Progress. Do not generalize
one Tee result to Polo/Woven, size grading, ASTM/AAMA conformance or factory
acceptance. Preserve generic DXF and protected export byte identities.
