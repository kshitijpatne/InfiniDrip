# EPIC-17 / G04 V03 — DXF header/profile audit — Slice 541 start

## Verified start

- Started `2026-10-08 22:01:10 UTC` from clean S540 commit
  `e8c93d754bdca770d76162cb06bf8aca074fc343` on `codex/epic-17-g04`.
  Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  still an ancestor of HEAD.
- Highest assigned slice across reachable history is S540; reserve unique
  S541. Canonical board revision 3275; EPIC-17 and G04-V03 are In Progress,
  V01/V02 Done. Goal is active. Current usage permits work.
- The maintainer has confirmed written authorization for product-development
  use and local DXF processing of the CLO trial; this prerequisite is settled.
  CLO remains open, but this slice requires no CLO interaction.

## Objective and scope

Read-only audit the saved outputs already used for the all-seven recipe
round-trip cohort: S498's first DXF-ASTM-labeled exports for Tee, Polo, and
Woven; S523's second DXF-AAMA-labeled exports for Fitted, Tank, Skirt, and
Trouser; and the synthetic S532/S540 AAMA control only as context. Recheck
each output's pinned byte count/hash, raw `$ACADVER`, `$INSUNITS` and header
presence. Compare those actual values with primary Autodesk DXF version
documentation and the official ASTM D6673-04 listing's explicit AutoCAD
Version 13 requirement; retain ASTM D6673-10 withdrawal status and historical
AAMA-292 context as separate facts. State exactly what the headers establish
and what they cannot establish about CLO's selected profile or conformance.

All source and exchange DXFs stay in their existing named folders under
`C:\G04-CLO-DXF-Exchange`. New derived report, scripts, and screenshots (if
needed) stay in `C:\G04-CLO-DXF-Exchange\S541-dxf-header-profile-audit`.
Only this durable packet and code-like audit record belong in the repository.
No CLO import/export, file rewrite, receiver change, or V03 gate change.

## Acceptance and gates

- Verify the four S523 and three S498 saved-file hashes against their pinned
  prior evidence before parsing. Report every recipe separately and preserve
  each observed UI mode as an observation, not a standards claim.
- Parse DXF group-code pairs and report raw `$ACADVER`, units declaration,
  and relevant sections for every file; fail closed on an invalid/missing
  header rather than infer an edition.
- Cite primary documentation for the version-code mapping and the exact ASTM
  edition requirement. Do not turn a file-version mismatch into a claim of
  ASTM nonconformance unless the documented CLO profile promise is established.
- Preserve all-seven, semantics, geometry, grading, malformed-input, rights,
  and qualified-receiver gates; no acceptance threshold, legacy DXF behavior,
  or protected export identity changes.

## Verification, delegation, and next boundary

This is a bounded report-only audit over existing files with already pinned
hashes; there is no safe disjoint contributor task. Run a deterministic
hash-checking parser twice, syntax and diff checks, and the focused Control
Center suite after validated board closeout. No production code/tests change,
so changed-code coverage and the full repository gate are not due.

At exit, identify whether the observed version headers narrow the receiver
route. Keep V03 In Progress unless an exact documented apparel profile and
all-seven semantic/round-trip acceptance are actually established. Record
remaining evidence gaps and one next action; do not repeat CLO cases.
