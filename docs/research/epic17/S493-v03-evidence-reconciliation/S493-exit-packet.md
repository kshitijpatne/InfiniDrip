# EPIC-17 / G04 V03 receiver evidence reconciliation — Slice 493 exit

## Result

S493 consolidates the actual CLO import/export measurements and current rights
review against the complete admitted V03/C04 acceptance boundary. The
gate-by-gate evidence and exact remaining requirements are in
`S493-v03-gate-matrix.md`.

The practical results are mixed, not hypothetical: Tee M passed 6/6 measured
contours (`0.0000160001 cm` max); Woven M passed 24/24 (`0.000074 cm` max)
and the second generation passed all 114 contour correspondences
(`0.000031 cm` max). Polo M passed 13/18; five CUT contours exceed the strict
`0.001 cm` gate with witnessed lower bounds of `0.01019–0.01118 cm` after
piece associations were corrected. Existing CLO transfers completed without
an application error dialog, but the import showed a seam-allowance notice,
numeric output layers remain semantically unmapped, and grade, option-wide,
and malformed-input gates are incomplete.

S479/S487/S490 show no affirmative account-specific permitted-use grant for
this product-development fixture work. The current public trial terms and the
visible trial screen do not prove that the exact use is authorized. This is a
fail-closed evidence result, not legal advice or a finding of past breach.
No CLO app/file/account action occurred in S493; prior C: files were neither
changed nor uploaded. Do not repeat transfers or select CLO as a V03 receiver
until the permitted-use and local-handling gates are resolved.

## Acceptance and status

- V03 acceptance remains **incomplete**. No receiver/profile is selected and
  no generalized AAMA/ASTM or industrial compatibility claim is made.
- G04-V03 and EPIC-17 remain **In Progress**; G04-V01/V02 remain **Done**.
- The all-seven-recipe V02 acceptance, all V03 gates, protected export byte
  identities, and physical/factory/production-readiness boundaries are
  unchanged.
- The immediate external dependency is affirmative rights-cleared access to
  an exact local receiver/build and documented local handling. After that,
  use the existing S463 fixture plan and target remaining gaps: a clean import
  without loss warnings, Polo within the fixed threshold, entity/layer
  semantics, multi-size/grade handling, malformed-input rejection, and
  receiver inspection. Do not rerun already-passing base contours without a
  targeted profile change or a reasoned need.

## Verification and durable state

- Current `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor; S492 `b402d571305e1d1256b091314271257447b5f1f4` is the verified
  start. S493 is unique.
- Canonical board start replay: revision `3064→3066`; validated exit replay:
  `3066→3071`. EPIC-17 and V03 statuses remain In Progress. Matrix and exit
  are linked to G04-V03; exit is also linked to EPIC-17.
- `npm run control-center:test -- --run` passed `42/42` after the start replay.
  S493 scripts pass `node --check`; `git diff --check` passes. Documentation-
  only changes mean no production-code coverage, build, export identity, or
  full repository gate is due in this slice.
- No production source/test, DXF fixture, CLO file, export baseline or
  protected byte identity changed.

Started `2026-10-08 13:45:59 UTC` at S492. Evidence review and reconciliation
approximately `8m`; documentation/board closeout approximately `5m`; focused
verification approximately `1m`; implementation `0m`; external-agent wait
`0m`; maintainer-decision time `0m`.

**Next action:** advance V03 only after a rights-cleared exact local receiver
and permitted local handling are evidenced; then run the specific remaining
fixture/profile gates in this matrix. If no such access appears, keep G04-V03
In Progress and preserve these exact measured failures and holds.

