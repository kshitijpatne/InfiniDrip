# Slice 769 — T02 revision-bound sample and QA rounds

**Status:** In Progress. **Start:** 2026-10-13 00:59:04 UTC. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`.
**Starting commit:** S768 `e39ebe9f6cdb0cd1af5abe7c0e0ecc70cbd8fdf6`
(`Slice 768: define source-aware T02 POM record contract`). Fresh fetch retained
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` as an ancestor. Highest
assigned slice was 768; S769 is unique. Canonical board revision 4571 has
EPIC-18 and G05-T02 In Progress; G05-T01 is Done.

## Authority and ordered boundary

The maintainer-admitted authority is `docs/planning/EPIC-18-ADMISSION.md`
(S762), with active order and scope in
`docs/planning/EPIC-18-S765-RESEQUENCING.md`. S768's exit packet records the
source-aware schema-v1 POM definition contract and identifies S769 as next.
The T02 board card requires editable sample/QA readings bound to one immutable
style revision, with actuals separate from predicted POMs. S769 implements
that single ordered boundary; S770 retains callout/size-run validation and
all-seven-recipe rendered review.

## Scope

1. Persist the S768 POM definitions with a strict backward-compatible
   tech-pack record extension. Preserve the original T01 v1 record shape and
   historical style-revision payload digests; new T02 content must enter the
   immutable revision content and CAS save path.
2. Add editable sample/QA rounds whose target is an explicit existing style
   revision for the same style. Keep a stable target revision when the round is
   edited and when a later pack revision is saved. Actual measurements remain
   separately typed, unit-bearing data; no write path may mutate or replace
   pattern-derived `sampleSpec()` / predicted POM values.
3. Provide a local user flow to create/edit/remove definitions and rounds,
   enter actual readings and QA observations, preserve unknown/missing facts
   visibly, and save through existing stale-head protection. Do not seed
   recipe measurements, tolerance, grading, fit, supplier, or standards facts.
4. Validate sample target references against immutable style history and
   preserve/remap internal references when copying project history. Keep all
   existing T01 compatibility and protected export identities.
5. Capture actual browser-rendered evidence of the editable T02 flow and test
   the strict schema, persistence/reload, revision identity/CAS, historical
   compatibility, and project-copy behavior.

## Acceptance and required gates

- Focused tests pass for strict new-record parsing, historical T01 v1 parsing,
  source/unresolved/conflict preservation, revision-target identity, actual vs
  predicted separation, save/reload and stale edit rejection, and project-copy
  reference remapping. Changed production code has 100% statement, branch,
  function, and line coverage.
- TypeScript passes; the protected export identity suite remains 9/9 with no
  baseline movement. Control Center tests pass after validated board replay.
- Browser evidence shows the actual editable sample/QA flow and explicit
  actual/predicted separation. Seven-recipe callout/size-run rendering remains
  S770; no PDF/export surface changes in this slice.
- `git diff --check` passes. Do not run the full global/Electron/build gate
  unless a focused dependency requires it; the settled integrated gate remains
  S780.

## Non-goals, holds and risks

No callout completeness or grade/size-run arithmetic (S770), export changes,
new garment, provider service, paid cost, physical fit, sewn-sample validation,
supplier acceptance, factory acceptance, or production-readiness claim. A
recorded user measurement is not independent evidence of correct fit. Missing
source/method/tolerance/grade facts must stay unresolved and actionable; do not
clamp or invent values. The main risks are preserving legacy v1 canonical
revision digests and keeping round target revision IDs valid across strict
repository validation, immutable revisioning and project copy.

No safe disjoint contribution was identified: the record extension crosses
strict parsing, revision digests/CAS, history validation, project-copy remap,
and one editable flow. No external coding-agent wait or maintainer decision is
planned; if an actual product ambiguity blocks this boundary, record it before
implementing the dependent behavior.

## Elapsed-time record

At exit, record separately: total time; implementation/review; focused
verification and diagnosis; external-agent waits; maintainer-decision waits.
This slice starts at 2026-10-13 00:59:04 UTC. The last usage check showed
primary 62% used and weekly 55%; ordinary usage remains allowed. Recheck limits
before focused/full gates and at the slice boundary.

## Exit evidence and next action

The start packet hash is attached to G05-T02 and EPIC-18 through the validated
commands in `docs/planning/EPIC-18-S769-START-T02-BOARD-COMMAND.json` and
`docs/planning/EPIC-18-S769-START-EPIC-BOARD-COMMAND.json`. The exit packet will
record final commit, board replay, gates, rendered evidence, unresolved risks,
and the elapsed-time split. The single next action after S769 is S770's
source-aware callout/size-run checks and all-seven-recipe rendered review.
