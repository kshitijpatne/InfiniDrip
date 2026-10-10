# EPIC-17 / G04 V03 — S692 Polo offset singularity source finding

## Result

S692 analytically evaluated the current `POLO × STANDARD_M` cubic source edge
behind the five repeatedly omitted CUT vertices. This changes the source-side
diagnosis: the curve has an exact offset cusp under the existing 1 cm positive
allowance. The current 14-sample outline/vertex-miter method samples close to
that cusp and emits a short, high-curvature CUT segment. This is a concrete
source-algorithm condition that the earlier three-point radius estimate could
not prove.

The same cubic geometry is used at these source locations:

| Pattern piece | Source edge | Exact cusp parameter | `t=13/14` signed curvature radius | Local cut step in the pinned receiver fixture |
|---|---|---:|---:|---:|
| Back | `neckline` | 0.9346892443 | −1.0195132256 cm | 0.045618 cm |
| Outer collar stand | `backCollar` | 0.9346892443 | −1.0195132256 cm | 0.046519 cm |
| Inner collar stand | `backCollar` | 0.9346892443 | −1.0195132256 cm | 0.046957 cm |
| Upper pointed collar | `backCollarBase` | 0.9346892443 | −1.0195132256 cm | 0.046519 cm |
| Under pointed collar | `backCollarBase` | 0.9346892443 | −1.0195132256 cm | 0.046519 cm |

The exact cubic minimum radius is 0.9114057099 cm at `t=0.99347`, below the
1 cm allowance. The production offset points along the curve's right normal;
its signed radius reaches −1 cm at `t=0.9346892443`, where the offset
derivative is zero. At the existing sample `t=13/14`, only 0.0195132256 cm of
offset radius remains before that cusp. The hash-pinned S634 source mapping
locates the corresponding emitted vertex and its 0.045618–0.046957 cm incoming
step. All values reproduce from the current source revision and the exact
analytic cubic derivative, rather than inferred garment convention.

## Conclusions and limits

- **Directly proven in product source:** the current 14-sample cubic outline,
  1 cm per-edge allowance, right-normal direction, and analytic cusp
  parameters listed above.
- **Supported by pinned output:** those five sampled locations are exactly the
  vertices the repeated CLO imports omit, with measured deviations beyond the
  unchanged 0.001 cm gate (S634–S636/S672/S685/S689). No output was altered.
- **Not proven:** CLO's internal reason for omitting them; whether an eligible
  industrial CAD receiver would do the same; whether a revised offset profile
  will pass any receiver; any physical or factory effect.
- S691's broad statement that no source repair is supported is superseded for
  these five points. Its receiver-eligibility, identity, marks, grade, negative,
  repeatability, readability, rights and final-gate findings remain current.

## Next implementation boundary

The evidence supports one bounded source change: add a cusp-aware, adaptive
offset representation to the **new G04 interchange exporter only**, with the
algorithm version included in its package revision. Keep `exportDxf`, its
legacy geometry/bytes, every protected identity and the current drawing
profile unchanged. Do not change the recipe's 1 cm allowance or sewn pattern
geometry. Before any receiver operation, verify the candidate against the
analytic offset to the unchanged 0.001 cm coordinate limit, test closed and
non-self-crossing outlines, generate/read rendered evidence, and run the
existing all-seven/73-option/grade package matrix. The implementation must
fail closed if it cannot form a valid offset. If this cannot be done without
changing the legacy writer or misrepresenting the package revision, do not
merge it.

This repair is not a V03 pass: the current local receiver evidence still has
independent marks/identity/profile/negative/repeatability/readability gaps.
Do not reopen a retired receiver route in this slice. The next action is the
versioned candidate-only offset implementation under a fresh slice, followed
by its focused 100%-coverage and rendered-output review.

## Verification and boundary

- Start: 2026-10-10 21:56:33 UTC from clean `3cb0f46e83791fc5f571acf1af154ce1c96937b2`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; highest slice was 691; board was revision 4103. Board start/exit replay reached revision 4106; `G04-V03` remains Blocked and EPIC-17 remains In Progress.
- Analytic report: `C:\G04-CAD-Interchange\S692-polo-offset-singularity\analytic-curvature-report.json`, SHA-256 `f806192422da2c0663a7870be2a36ead628e0dd965ea0b0cd66c32b4263e0df2`.
- Reproduction helper and raw JSON are outside Git in the same named C: folder. The helper loads the exact recipe modules and solves the signed-radius/allowance crossing by interval bracketing and bisection.
- No production source, test, allowance, pattern, DXF, package revision, baseline, acceptance or receiver state changed. No changed-code coverage gate applies. `npm run control-center:test` passed 42/42 and `git diff --check` passed after removing one trailing blank line found by the first diff check. The validated command layer linked `E-G04-S692-EXIT` and recorded the closeout note; no full repository gate is due for this evidence-only slice.
- Elapsed to verified closeout: 4m16s. Analytic source analysis/reproduction: 2m35s; packet/state/matrix correction: 1m05s; focused verification and board replay: 36s; implementation: 0; external-agent wait: 0; maintainer-decision time: 0. Implementation is the next numbered slice.
