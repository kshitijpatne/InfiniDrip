# EPIC-17 / G04 V03 — CLO input-info path identity — Slice 606 start

## Verified start and goal

- Start: 2026-10-09 10:40 UTC, from S605 commit `b057e11f19aef6e1eee234ae27991318421f6f8d` on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S605 was highest; S606 is unique. Worktree was clean. Board revision 3554: EPIC-17/G04-V03 In Progress, G04-V02 Done.
- The active goal remains EPIC-17/G04 through durable evidence, remaining gates, PR, safe merge, ancestry and any required deployment. This slice only investigates a grade-path identity subgate; it does not change acceptance.
- User has confirmed in writing that CLO product-development evaluation is authorized and exchange files are processed locally. All query artifacts stay under `C:\G04-CLO-DXF-Exchange\S606-clo-inputinfo-grade-identity\`. Keep the existing CLO 2026.1.310 (r58944) process open.

## Scope and method

S603 could not tell whether an Edit Grading point was on the waistband's internal sewn line or the cut outline. S604 found no documented, version-specific GUI selection cue. S605's query plan missed the S582 exact-build inventory and called an undefined `utility_api`; that planning miss and its empty outline result are recorded. Do not repeat that call or inventory.

S583 establishes that documented `pattern_api.GetPatternInputInformation(index)` was callable in the same CLO build and returned parseable JSON containing `LineList`, `PointList`, and child information for nine other patterns. Its schema and semantic layer meanings are undocumented. S606 makes one read-only call per currently indexed S565 pattern (three, as observed in S605), saves raw strings, then checks whether their coordinates can be uniquely matched to the exact S567 source CUT and SEW contours. The getter's presence and S583 behavior are prior observation; any exact coordinate match will be separately classified as observed geometry, not assumed CUT/SEW semantics.

- No project change, selection change, grade value, setter, geometry edit, save, import, export, profile change, or source-file change.
- No additional CLO API inventory, guessing at missing methods, or claim from numeric piece names.
- If no unique source match exists at 0.001 cm, retain the S603 grading hold and end this line of inquiry; do not relax tolerance.

## Exit evidence and gates

Record exact script/raw-output hashes, returned schema, per-index counts, coordinate units/frames if documented, candidate source matches/residuals, and rendered execution context. This identity check alone cannot clear profile, native grading, all-seven, geometry, semantics, marks, malformed-input, rendered-detail, or repeated-round-trip gates. Keep V02 Done, V03/Epic In Progress, legacy DXF behavior, and protected export byte identities unchanged. No physical-fit, factory-acceptance or production-readiness claim.

No independent delegation is safe for a single exact-session runtime query; Codex owns execution and review. Full repository coverage/build remains reserved for the settled integrated Epic/PR candidate.
