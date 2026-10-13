# Slice 770 — T02 callout and size-run checks

**Status:** Starting. **Start:** 2026-10-13 02:15:23 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** `65032f5dba1272b6edc3a926d08a878126f8dbb3`
(`Slice 769: add revision-bound T02 sample and QA records`). Fresh fetch
confirms `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor.
The worktree is clean, and 769 is the highest assigned slice; S770 is unique.
Canonical board revision 4575 records G05-T01 Done and G05-T02/EPIC-18 In
Progress. The S769 exit packet digest is
`d4a4dc5238e1866f4692a0880b1254066231a87eb94d97bbfb373be7b6d13fb1`.

## Authority and checkpoint

The unchanged, digest-bound S762 admission authorizes G05. The active order is
the S765 resequencing addendum and `EPIC-18-GOAL.md`: S768 defined the typed
POM contract, S769 persisted revision-bound sample/QA rounds, and this is the
single remaining T02 boundary. The older slice table in the S762 file remains
historical; it is superseded by that active addendum. Current code, the board,
`PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `ARCHITECTURE.md`, decisions, and the
goal ledger all identify S769 as complete and S770 as next. No checkpoint
repair or new admission is needed.

## Bounded work

Implement source-aware completeness and cross-record size-run checks for the
existing T02 data, then inspect the actual rendered T02 state for all seven
supported recipes. Preserve strict record compatibility and immutable
revision/CAS behavior.

The admitted contract already represents each POM callout's method,
landmarks, unit, sourced tolerance, sourced size range, and sourced grade-rule
reference. The validator will report missing, unresolved, or conflicting
facts with the recorded reason and next action; malformed or inconsistent
combinations will produce a direct correction. It will not invent a source,
coerce a unit, fill a missing value, or clamp an invalid size.

The size-run check will compare the explicitly sourced ordered size IDs and
base size with the active recipe run and style base-size field, and check each
sample round's size against that sourced run. A T02 definition will match a
current recipe POM by exact display label, the only shared key in the admitted
record and pattern contracts; a mismatch remains visible and actionable, with
no fuzzy match. For matched callouts, exercise the existing recipe grade and
POM functions across the source-confirmed run, show those numbers only as
pattern predictions, and validate finite output and full size coverage. The
existing T02 contract stores a grade-rule source ID/version but no formula;
checks will validate the reference and run relationships without claiming to
verify an external grading formula.

In this boundary, “callout” means a T02 POM definition checked against its
same-label recipe POM. The current pattern POMs do not expose stable machine
IDs, so the exact-label rule is deliberately fail-visible if a label changes.
This is not a CAD annotation/leader mapping and will not change technical-flat
geometry or add a new record field. If rendered evidence exposes a need for a
stable cross-contract ID, record it as a blocker rather than guessing one or
broadening this slice.

## Acceptance and gates

- Focused tests cover all source states, missing and duplicate/inconsistent
  facts, size-range/base/sample relationships, and all seven recipe IDs.
- Every changed production module reaches 100% statement, branch, function,
  and line coverage. `npx tsc --noEmit --pretty false` passes.
- Review actual browser-rendered T02 output for Tee, Darted Tee, Tank, Polo,
  Woven Shirt, Skirt, and Trouser. Unresolved data stays visibly actionable;
  no output implies physical fit, supplier acceptance, or production readiness.
- Protected export identity remains 9/9; no export baseline moves. After the
  validated board replay, Control Center tests pass and `git diff --check` is
  clean. Full repository/global coverage, integrated build, Electron and
  release gates remain at S780.
- Write S770 exit evidence before stopping, reserve no number besides S770 for
  this work, and land one commit whose subject starts `Slice 770:`.

## Non-goals, risks, and delegation

No new garment, recipe measurement/source, CAD callout, construction rule,
grade formula, export format, export baseline, paid/provider feature, physical
fit claim, supplier/factory acceptance, production-readiness claim, or launch
work. No T03+ work or UIQ-10 admission. `gradeRuleSource` does not contain
formula parameters, so external grade arithmetic is not verifiable in this
schema; an observed requirement for that is an explicit blocker for later
maintainer resolution. The principal compatibility risk is preserving S768's
strict source states and S769's sample targets while adding read-only checks.

No safe independent contribution is available: the validator, editor output,
all-seven render proof, and their focused coverage share the same T02 data
contract and integrated UI. Keep ownership in Codex; no external-agent wait or
maintainer decision is scheduled.

## Start evidence and elapsed time

The start packet digest will be attached to G05-T02 and EPIC-18 with the
validated board commands listed in `docs/planning/EPIC-18-S770-START-*.json`.
The validated start replay advances board revision 4575→4577 without changing
T02 or Epic status. At exit, record total elapsed time split among
implementation/review, focused verification/diagnosis, external-agent waits,
and maintainer-decision waits. Recheck usage before expensive gates and at the
slice boundary.
