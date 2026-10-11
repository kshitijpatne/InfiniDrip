# EPIC-17 / G04 V03 — S692 Polo offset singularity source audit

## Verified start

- Started 2026-10-10 21:56:33 UTC from clean commit
  `3cb0f46e83791fc5f571acf1af154ce1c96937b2` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S691 is the highest assigned slice; S692 is unique.
- Canonical board revision 4103 records EPIC-17 In Progress, G04-V01/V02 Done,
  and G04-V03 Blocked. No acceptance/status or hold change is authorized here.
- Goal objective is complete G04 through V03, final gates, safe merge and
  deployment. Goal is active. Usage at start: primary 0%, weekly 27%.

## Bounded objective

Recheck the exact source geometry behind the five repeatedly omitted Polo CUT
vertices from S634/S635/S636/S672/S685/S689. Compute signed curvature directly
from the current recipe's cubic edges and compare it with the corresponding
1 cm production allowance. Determine whether the current fixed-sample offset
passes through a geometric cusp and whether that explains the short generated
edge near each omitted vertex. Reconcile this source calculation with the
hash-pinned historical outputs. Record what is mathematically established,
what remains a receiver observation, and the smallest safe product-side repair
boundary.

This is source analysis only. Do not edit recipe geometry, seam allowances,
DXF writers, package profiles, export baselines or V03 acceptance in S692. Do
not reopen CLO, test another app/format/setting/encoding, or imply that this
source finding alone passes a receiver gate. Raw analysis/helper output stays
outside Git in a named `C:\G04-CAD-Interchange\S692-polo-offset-singularity\`
folder; the short conclusion and exact reproduction method are retained here.

## Required gates and exit

- Keep the five source edge/piece mappings exact: back/neckline, both
  collar-stand/backCollar, and both pointed-collar/backCollarBase.
- Verify sign and cusp location from analytic cubic derivatives, not a sampled
  three-point radius estimate alone.
- State separately whether the result proves: source offset singularity,
  receiver omission cause, and a safe implementation change. Do not conflate
  these.
- Preserve 1 cm recipe allowances, original pattern revisions, all seven
  recipes/options/grades, 0.001 cm comparison, legacy DXF bytes and protected
  export identities. Any proposed corrective geometry must have a reversible,
  versioned profile boundary or a separately reviewed source-revision plan.
- Update the S691 V03 matrix/plan only if the new analysis changes the causal
  evidence or next action; do not loosen any gate.
- At exit, record focused verification, exact source/ref/board, elapsed work
  and separate analysis/documentation/verification/decision time. No full
  repository gate is due for this source-only analysis.

## Current evidence and hypothesis

S634 ties the unchanged product-generated Polo M DXF to the same five receiver
omissions and traces each vertex to a 14-sample seam-allowance point. Its
three-sample curvature estimate is about 1.0366 cm against a 1 cm allowance;
that estimate did not prove an exact cusp. S635/S636 show that changing
POLYLINE/LWPOLYLINE or Standard/ASTM import mode did not recover the points.
S689 shows the measured CUT losses remain after unit normalization. S691's
statement that no source repair is supported is provisional pending this
higher-precision analytic check.

Hypothesis to falsify: the source's +1 cm normal offset on the shared neckline/
collar-base cubic reaches an offset cusp near the exact source sample at
`t=13/14`, producing a sharp local geometry that the current 14-sample/miter
algorithm does not resolve. Even if proved, that does not establish CLO's
internal simplification cause, justify changing physical geometry, or clear
any V03 receiver/profile gate.
