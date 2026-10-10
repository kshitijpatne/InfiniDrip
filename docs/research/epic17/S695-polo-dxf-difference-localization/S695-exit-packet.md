# EPIC-17 / G04 V03 — S695 exit packet

## Result

S695 completed the bounded read-only comparison of the exact Polo M candidate
and S694 CLO return. Re-running the current package generator for the recorded
Polo defaults, size M/step 0 reproduced the submitted 177,875-byte DXF exactly
(SHA-256 `7cb7f95263ac15b9ff4ebbeaafe9fd07d80cf3f999b6e7355ee85d285c54d56a`);
the exact candidate package revision is
`cc0e1c5f111b2485ffdc7fafac60820f654d6bd541620fff47af51e747a3846d`.
This rules out an accidental or hand-edited input file.

The actual normalized CLO return still exceeds `0.001 cm` on seven CUT paths:
front 0.001035292, back 0.002991975, sleeve 0.001491971, outer stand
0.011015115, inner stand 0.039767881, upper collar 0.011015117, and under
collar 0.011018607 cm. Both placket CUTs and all nine SEW paths remain within
the fixed threshold. On the four stand/collar pieces, the same source vertex
182 maps to the same cubic back-collar source edge at t=0.93468; each submitted
point is within 0.000235–0.000319 cm of the exact source-code normal offset,
but the returned paths miss it by 0.011–0.040 cm. Annotated actual-source vs
actual-return crops are rendered and visually inspected. This establishes
round-trip geometry loss on this exact candidate, not the receiver's internal
cause and not a product-source defect.

The existing candidate must not be changed to compensate. A narrowly bounded
S696 test is justified for one previously unisolated setting: turn off CLO's
observed **Import Draw Curve Points** checkbox and hold every other input,
build, mode, unit, scale, rotation, and export setting fixed. The exact
purpose, first-party documentation limits, verification, and stop condition
are recorded in `S695-v03-completion-plan.md`. This is the only further CLO
Standard setting test planned. A failure ends that route's trials; a pass
clears only representative geometry/mark checks, not all V03.

## Scope, state, and gate limits

- No production or pattern code changed; no DXF candidate, importer, receiver,
  or export setting was changed during S695.
- No file in the main repository root or the separate `F:\designApp` checkout
  was modified. Diagnostic scripts, regenerated candidate/manifest, exact
  point report, and rendered image stay under
  `C:\G04-CAD-Interchange\S694-clo-candidate-cuts\S695-localization\`.
- V01/V02 remain Done. G04-V03 remains unaccepted and Blocked on its current
  board record; EPIC-17 remains In Progress and the goal remains active.
  Acceptance, all-seven/options/grade requirements, `0.001 cm` gate, legacy
  DXF behavior and protected export identities are unchanged.
- CLO Standard remains a vendor-specific empirical candidate, with no
  ANSI/AAMA or ASTM claim. Existing other-receiver outcomes are not reopened.
- No physical fit, sampling, factory acceptance, or production-readiness claim.

## Verification and evidence

- Exact source regeneration and manifest binding were executed through the
  current TypeScript modules with the repository's `vite-node`; the resulting
  drawing hash equals S694's exact input hash.
- A read-only parser recomputed all nine piece CUT residuals against the
  exact normalized return and recovered the same S694 fixed-threshold results.
  It also traced the four repeated vertex-182 maxima to their exact source
  curves and offset parameters. No comparison threshold was altered.
- The seven-panel source/return local detail PNG was inspected. SHA-256:
  `d86ab2bebcc6e2efeb5178a03679cf91dd766a9bb44bd51e56d09dbefb51f022`.
  Machine-readable measurements and exact file hashes are in
  `S695-localization-report.json` in the C: evidence folder.
- One targeted first-party CLO help review was made because the observed
  import curve-point option is the sole variable in the next check. CLO's
  current help explains curve-point optimization but does not establish the
  installed build's exact checkbox effect for these straight-vertex paths;
  a separate CLO help answer suggests enabling it for incomplete patterns.
  Those sources justify only a controlled test, not a cause or pass.
- Evidence-only slice: changed production-code coverage is not applicable.
  `npm run control-center:test` passed 42/42 and `git diff --check` passed.
  The full repository gate remains for the settled integrated candidate.

## Start, closeout, and accounting

- Started 2026-10-10 22:38:09 UTC from clean S694 commit
  `ee132a30da9df569da09db6f91902c38fa32f408`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
  Slice 694 was the highest assigned; S695 was reserved. Board revision 4113;
  validated S695 start evidence moved it to 4114.
- Goal inspection at this boundary found the original admitted EPIC objective
  unchanged and status **active**. No goal tool mutation was made.
- Approximate elapsed time through closeout: 8 minutes. Exact-source
  regeneration and point/curve localization: about 3 minutes; actual crop
  rendering/inspection and targeted documentation review: about 2 minutes;
  durable packet/state/board and focused verification: about 3 minutes.
  External-agent wait: 0; maintainer-decision time: 0.
- The next slice is one controlled import-option check only; no manual user
  action is pending.
