# EPIC-17 / G04 V03 — S697 candidate DXF coordinate precision

## Start and verified state

- Start time: 2026-10-10 23:07:54 UTC.
- Branch: `codex/epic-17-g04`, clean at S696 commit
  `7ae407cce73caa76fff3cb08bc47ab67a28d43d5`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- S696 is the highest assigned slice; S697 is unique. The canonical board is
  revision 4124: EPIC-17 In Progress, V01/V02 Done, V03 Blocked. Goal record is
  active and remains active.
- Existing V03 evidence: exact S693 DXF regeneration is byte-identical to the
  submitted file. S696's CLO return fails six CUT contours and three button
  stations; all nine SEW contours pass. The fixed CUT/SEW tolerance remains
  `0.001 cm`; no receiver or profile variation is part of this slice.

## One source-backed correction

The candidate path writer rounds each DXF coordinate to `0.001 cm`, the same
size as the entire allowed contour error. At a rounded two-dimensional vertex,
that alone permits up to approximately `0.000707 cm` of positional error,
before any receiver changes the path. The adaptive candidate computes its
curved offsets to `0.0001 cm`, so the serializer discards precision the
candidate geometry already computed. S697 will preserve six decimal places
for the opt-in centimeter-package geometry and its visible marks, while leaving
the legacy writer's exact three-decimal output unchanged.

This is a measurable source serialization defect, not an explanation for
S696's large collar misses or misplaced button stations. S697 will report the
per-coordinate quantization error before/after and will not claim CLO or V03
passes from offline evidence. If any legacy output byte changes, revert the
legacy-path change before closeout. Do not modify pattern geometry, allowance,
marks, fixed tolerance, package identity rules, acceptance, or protected
baselines.

## Scope, acceptance evidence, and stop conditions

- Add candidate-only coordinate precision; keep `exportDxf` and protected
  legacy bytes unchanged.
- Add focused tests for the candidate's emitted coordinate precision and a
  byte-identity regression for the legacy route.
- Run focused DXF/package/export tests, changed production-code coverage at
  100% statements/branches/functions/lines, TypeScript check, protected export
  identity check, Control Center suite, and `git diff --check`.
- Render actual generated candidate output at overview and high-detail scale;
  compare it against the unchanged source pattern. Keep rendered artifacts and
  all other generated/test files outside Git under
  `C:\G04-CAD-Interchange\S697-candidate-precision\`.
- Stop if rounding/formatting changes source geometry, introduces invalid DXF,
  changes legacy bytes, or cannot meet changed-code coverage. Do not run another
  CAD receiver trial: the S696 route plan requires a qualified receiver/profile
  before resuming receiver tests.
- V03 remains unaccepted until a qualifying apparel/industrial receiver profile
  is evidenced and all fixed receiver gates pass. The full all-seven/73-option,
  grades, malformed-input, repeat-roundtrip, readability, final 100% repository
  gate, necessary-file cleanup, PR, safe merge, `origin/main` ancestry and
  required production end-to-end gates remain unchanged.

## Non-goals and risks

No new software, CAD format, mode, receiver, geometry recipe, UI redesign,
physical sampling, supplier contact, spending, hosted service, or production
readiness claim. Six-decimal coordinates may reduce a small part of source
quantization error but cannot make CLO's measured contour simplification or
button-mark displacement pass. This slice creates no exact standards claim.

## Verification and slice accounting

Implementation, focused verification, rendered review, external waits, and
maintainer decision time will be recorded separately at slice exit. No safe
disjoint implementation handoff was identified; the candidate writer,
legacy-byte constraint, tests and output review are coupled and remain
Codex-owned. One full repository gate remains reserved for the settled
integrated Epic/PR candidate.

**Next action:** implement six-decimal candidate serialization, prove the
legacy writer is byte-identical, and compare rendered/output evidence before
closing S697.
