# EPIC-17 / G04 V03 — Additive profile source audit — Slice 645 exit

## Result

S645 reviewed the existing DXF writer and prior product/profile audits to
decide whether another source-side representation is justified. The legacy
writer emits minimal R12-style closed `POLYLINE` CUT and SEW outlines, pattern
marks, cm coordinates, Y-axis inversion and 0.001 cm rounding. It does not
emit a header/layer table, explicit units, stable piece/revision IDs, mark IDs
or grade relations. These are valid additive-profile metadata needs; the
source-to-output audit S586 found the same gaps.

The five Polo CUT residuals are a different problem. S536, S590–S594 and
S635–S642 already measured distinct representations or receiver controls:
R2000/LWPOLYLINE with units, fillet, line network, degree-1 spline variants,
profile/entity modes, and named BLOCK/INSERT grouping. None preserves all five
source CUT contours in the tested CLO paths within `0.001 cm`. S588 also
established that the tested CLO route drops all 56 custom XDATA IDs. S634
traces the failures to source-true allowance micro-segments; S643 shows those
regions persist across the 17 existing Polo option rows and that deleting
them exceeds the allowed geometric deviation.

**Conclusion:** there is no source-exact producer-side fix supported by the
current evidence. Adding metadata in a separate profile writer would not
remove the measured geometry failure and would be premature without an
eligible receiver. No serializer or pattern geometry was changed; no CLO
interaction occurred. The V03 matrix and every acceptance gate remain intact.

## Current blocker and next action

The current external dependency is rights-cleared local access to an
industrial apparel CAD receiver with a documented two-way profile that can
preserve the five source curves. CLO is authorized, but its measured result
fails before export; S644 found no newly surfaced free/local candidate that
can satisfy the receiver requirement. Keep V03 and EPIC-17 In Progress. Do
not resolve this by relaxing the all-seven requirement or the `0.001 cm`
threshold, changing source geometry, or calling generic R12 exchange
industrial compatibility. No new CLO test is justified without a specific
untested receiver mechanism.

## Acceptance and non-goals

- V01/V02 remain Done. V03 remains incomplete across receiver/profile, units,
  all-seven/options/grades, identity, CUT/SEW and marks, malformed input,
  repeated round trip, and readable output.
- Legacy DXF writer and protected export byte identities remain untouched.
- No install, supplier contact, spend, hosted service, production source/test
  change, physical sample, fit claim, factory acceptance, or production
  readiness claim.

## Verification and durable closeout

- Started `2026-10-09 23:06:39 UTC` from clean S644
  `0123bfa5dab60d383ce376adc13c3094a6647a4a`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
- S645 start replay advanced board revision `3722→3724`; exit replay is
  status-neutral and links this packet. V01/V02 remain Done, V03/Epic In
  Progress.
- Reviewed source, S586–S594, S634, S642/S643 and S644 evidence. No new CLO
  import, export, encoding, profile setting or renderer trial was run.
- `npm run control-center:test`: **42/42 passed**; S645 replay syntax and
  validated start/exit replays passed; `git diff --check` passed. No
  production-code change, so no changed-code coverage or full repository gate
  applies to this slice.
- Elapsed through closeout: about 3 minutes. Implementation 0; source/evidence
  analysis about 1m45s; focused verification and durable records about 1m15s;
  external-agent waits 0; maintainer-decision time 0.

## Next action

At the next slice boundary, verify current goal and repository state. Continue
only if new receiver access, rights evidence, or a new falsifiable product-side
mechanism is available; otherwise record the same concrete receiver-access
dependency and keep the goal active. Do not mark V03 complete or merge until
all admitted criteria and final gates are proven.
