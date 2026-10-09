# EPIC-17 / G04 V03 — CLO pattern information getters — Slice 583 start

## Verified start

- Start: 2026-10-09 05:35:27 UTC from S582 commit
  `80c6a44a8636ee746b6d965ff3157503a147d0b1` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; the worktree was clean.
- Canonical board revision 3445: G04-V02 Done, G04-V03 In Progress.
- Highest assigned slice 582; reserve unique S583. The goal record is active
  and aligned to EPIC-17/G04 through safe merge. Ordinary usage is available
  (primary 10%, weekly 69%).
- CLO 2026.1.310 remains open. The S582 runtime inventory confirmed both
  documented getters exist in this installed `pattern_api`.

## Objective and method

Make one read-only call to each of the documented methods
`GetPatternInformation(index)` and `GetPatternInputInformation(index)` for
each of the same nine CLO pattern indexes. Save returned strings and parsed
JSON, errors, piece names, and application version context only under
`C:\G04-CLO-DXF-Exchange\S583-clo-pattern-info-getters\Evidence`.

The first-party API list documents both as returning JSON strings but does
not document their schema. The purpose is to inspect whether actual returned
fields help diagnose input-side versus current pattern information for the
already-tested Polo M import. Do not assume a field means source geometry,
DXF layer, or a particular pipeline stage; map any such finding only against
the hash-pinned fixture and output evidence.

## Scope and safety boundary

- Call only `GetPatternCount`, `GetPatternPieceName(index)`,
  `GetPatternInformation(index)`, and
  `GetPatternInputInformation(index)`. The last two are documented and
  confirmed exposed by the S582 exact-build inventory.
- No setters, geometry changes, import/export, project save, simulation,
  cloud operation, undocumented method, or API survey.
- Preserve the 0.001 cm geometry tolerance, all-seven V02 criterion,
  CLO 2026.1.310 / DXF-AAMA profile identity, protected export byte
  identities, legacy DXF behavior, and all V03 technical gates. No
  compatibility claim or stage attribution from a field name alone.
- Product-use rights and local processing have written confirmation recorded
  in project decisions. Keep all CLO inputs/outputs and screenshot under the
  specifically named C: folder; keep CLO open.

## Acceptance and verification

Pass the slice if one live run completes all nine indexes or records a
specific per-method/per-index error without concealing it, and the saved JSON
is parseable with exact raw strings retained. Review the returned schemas
literally. This is diagnostic evidence only; it cannot clear a V03 gate.

Hash the result, source script, and live screenshot. Run JSON/schema checks,
`npm run control-center:test`, validated board replay/status checks and
`git diff --check`; update `PROJECT-STATE.md` and `CONTEXT-INDEX.md`. No
product source/tests changed, so no full repository gate is due. Codex owns
review and integration. No independent low-risk work exists for one live
read-only query.

## Next-action rule

After S583, stop API-only exploration. Map any useful metadata against the
already pinned S574/S575 input and output; then prioritize the remaining
documented V03 interchange acceptance items through actual CLO import/export
behavior and byte/geometry/rendered checks. Retain every hold and gate unless
the admitted evidence standard is met.
