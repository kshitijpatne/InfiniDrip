# EPIC-17 / G04 V03 — seven-recipe grainline source coverage — Slice 663 start

## Start state

- Start: 2026-10-10 08:06:58 UTC.
- Worktree: `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`,
  branch `codex/epic-17-g04`, clean S662 commit
  `81e53b6686e7371ff08518a61366de1ec8300ff0`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Highest landed slice is S662; reserve unique S663. Canonical board
  revision is 3865; EPIC-17/G04-V03 remain In Progress and V01/V02 Done.
- DGS `VID:20250610` is open with the S661 S648 Polo M import loaded. That one
  import produced nine grainline-outside-border warnings. The S662 profile
  encoding proposal is still awaiting maintainer approval.

## Objective and scope

Read-only source coverage study: resolve recipe-declared grainline rules for
every named piece across the accepted S330/S459 matrix of seven recipes and 73
supported configurations, and verify the 501-point line samples remain inside
their corresponding rendered CUT polygons under current product source.
Compare common piece identities/rules and report whether S662's proposed
additive same-block grainline mapping can be derived without a recipe-specific
exception. This provides breadth evidence for the pending profile decision;
it does not approve or implement the representation.

## Acceptance and stop conditions

- Pin current HEAD, `origin/main` ancestry, S330 matrix hash, and current
  product-source revisions used by the analyzer.
- Re-draft all 73 canonical M configurations through each recipe's current
  source API; require every emitted piece to have exactly one applicable
  grainline rule and a stable recipe/role identity.
- Flatten/layout from the existing recipe allowance data, resolve each
  grainline using the current source rule, and test 501 evenly spaced samples
  against that exact piece's CUT polygon. Record every endpoint and any
  invalid/missing rule or outside sample. Do not infer receiver recognition.
- Preserve S459's seven-recipe/73-configuration scope, all grade and other V03
  gates, `0.001 cm`, legacy DXF behavior, protected export identities, and all
  existing holds. Do not write an exchange DXF, alter product source, operate
  DGS, or claim V03 acceptance.
- Stop and retain affected mappings as unproven if current source cannot
  resolve a complete supported configuration or if a grainline leaves its
  matched CUT polygon. The profile representation remains a maintainer choice.

## Verification and closeout

Use a reproducible read-only analyzer and record inputs, source revisions,
matrix/analysis hashes, totals and per-recipe results. No changed production
code is expected; run focused analyzer checks, the Control Center test after
board replay, and `git diff --check`. Update `CONTEXT-INDEX.md`,
`PROJECT-STATE.md`, admission handoff, and canonical board via validated
commands. Do not delegate this shared source-geometry audit. Full repository
tests/coverage remain for the settled Epic/PR candidate.
