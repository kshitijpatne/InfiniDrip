# EPIC-17 / G04 V03 — Source-backed graded DXF fixture — Slice 559 start

- Started: 2026-10-09 00:06:03 UTC.
- Start commit: S558 `3965653`; branch `codex/epic-17-g04`.
- Refreshed-origin state from S558 remains: `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; clean working tree before this packet.
- Board start revision 3349; next unique slice 559. V01/V02 Done; V03 In Progress.
- Usage: primary 6%, ordinary use available.

## Scope

Inspect the actual per-recipe grade definitions, supported size ranges,
`gradeRun` output, DXF writer, and retained source fixtures. Determine whether
the repository contains enough source truth to create a genuine
multi-size/grade fixture for the documented CLO `DXF-AAMA` grade-inclusion
route. If it does, build one bounded fixture from existing authoritative
rules, save only under `C:\G04-CLO-DXF-Exchange\S559-source-backed-grade-fixture`,
and test it once in the existing CLO session, comparing each size and grade
relationship to source truth. If it does not, make no synthetic grade claim;
document the exact missing format/relationship. Preserve one-size legacy DXF
behavior and all protected byte identities.

## Non-goals and gates

No new garment recipe, invented grading rule, cut-geometry edit, broad exporter
rewrite, repeat of known M/default or contour trials, external receiver,
vendor contact, paid/cloud service, or physical/factory claim. Keep the all-
seven and existing V03 gates. No acceptance or hold changes without measured
evidence.

## Exit gates

1. Trace each relevant recipe's grade source and size definitions into actual
   generated geometry; distinguish authored rules from computed sizes.
2. Verify whether current DXF output represents grade relationships or only
   one selected size; assess additive test-fixture feasibility.
3. If a genuine fixture can be generated without invention, run one targeted
   CLO AAMA round trip with grade inclusion and compare to the exact source.
   Keep all data and captures in the named C: folder. If the UI state cannot
   be targeted reliably, preserve the evidence and do not force blind input.
4. Record pass/fail/unknown per exact scope, update state, matrix and board;
   preserve all still-failing V03 gates.

No maintainer decision blocks this source audit. CLO remains open.
