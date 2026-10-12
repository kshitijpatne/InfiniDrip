# Slice 763 — T01 typed record and provenance contract

**Status:** In Progress. **Start:** 2026-10-12 20:09:15 UTC. **Reserved slice:**
763, confirmed unused after S762; prior highest slice was 762. **Starting
commit:** `2264e20a37b13929ad9be996c173417bb1ef6ac4` (`Slice 762: admit
EPIC-18 G05 and reconcile current state`). **Branch/worktree:**
`codex/epic-18-g05` at `C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
`origin/main` remains its ancestor at `e9221ea5033ccfdd91bf1ebb353926f189477d75`.
Canonical board starts at revision 4538 with G05-T01 Ready.

## Scope and contract decisions

Implement only the Slice 763 boundary in
`docs/planning/EPIC-18-ADMISSION.md`: the additive schema-v1 T01 typed record,
strict parser/validator, field envelope and provenance rules, with 100%
statement/branch/function/line coverage for changed production code.

The record will bind a style UUID, recipe ID/version and a nullable exact
G02-revision binding (`revisionId: null` with revision number 0 only before a
revision exists; otherwise a UUID and positive revision number). It contains
revision-bound cover fields; stable material/trim records with supplier,
article, lot, composition/construction, weight/width/finish/color and local
cost inputs; BOM rows with material and component references, placement,
quantity/unit/basis and requiredness; colorways and BOM/material assignments;
and a scoped approval/freeze state. Record and child IDs are stable UUIDs.
Unknown values are represented by a null value with `UNRESOLVED`, reason and
next action; the parser never supplies a default or clamps an invalid value.

Every decision-bearing scalar uses the C04 field envelope: stable `fieldId`,
C03 `semanticKind` and provenance vocabulary, typed value/unit, evidence and
validation status, source/method, actor/time, input/rule references, unresolved
reason/action, evidence IDs and `confidence: NOT_ASSESSED`. Provenance-specific
required references are enforced: user entries require actor/time/method;
presets identify their rule/source; calculations identify input IDs and rule
version; inherited values identify the prior revision and original source;
supplier/sample/photo facts carry attributable dated evidence; unresolved
values explain the gap and next action. `CONFLICT` cannot be rendered valid.
Strict exact-key checks, canonical timestamps, unique stable IDs, finite numeric
values and non-dangling BOM/colorway references reject invalid records.

The new code is isolated to `src/ui/tech-pack-records.ts` plus
`src/ui/tech-pack-records.test.ts`. Add no persistence/migration, style-record
schema changes, revision digest changes, UI, exports, recipe defaults,
supplier facts or physical/production claims in this slice. Those are later
admitted boundaries.

## Acceptance and verification

- Focused Vitest suite exercises every validator branch and malformed/cross-
  reference case; changed-module statement, branch, function and line coverage
  are each 100%.
- TypeScript typecheck passes.
- `git diff --check` passes; no protected export hash or application output
  changes because this slice adds no integrated behavior.
- Codex reviews the actual contract, parser and full focused coverage report.
- If validation or acceptance fails, preserve the focused output and use a new
  slice number for any follow-up; do not change scope silently.

No safe disjoint contribution is identified: type and parser invariants must be
designed and tested together. No external coding agent is used. Actual elapsed
time for contract design/implementation, focused verification, external wait,
and maintainer-decision wait will be recorded in the Slice 763 exit packet.
