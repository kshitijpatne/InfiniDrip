# Slice 768 — T02 typed POM definition contract

**Status:** In Progress. **Started:** 2026-10-13 00:40:58 UTC. **Reserved
slice:** 768, unique after the highest assigned slice, S767. **Branch/worktree:**
`codex/epic-18-g05` at
`C:\Users\kshit\.codex\worktrees\epic-18-g05\designApp`. **Starting
commit:** `a46ceaf3cb701b38b5c3418bada556e4a2ef0076` (`Slice 767: add local
all-recipe T01 editor`). A fresh fetch confirmed
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor. The
worktree was clean. No open PR or competing EPIC-18 integration branch was
found. The shared `F:\designApp` checkout remains outside this work and was
not changed. **Canonical board:** revision 4566; EPIC-18 is In Progress,
G05-T01 is Done, G05-T02 is Backlog, later G05 items remain Backlog, and
UIQ-09 remains gated by EPIC-19. **Usage at start:** primary 30%, weekly 50%.

## Authority and checkpoint

This is the next slice in the active, maintainer-approved order in
`docs/planning/EPIC-18-S765-RESEQUENCING.md`, after S767 closed T01. The
original hash-bound S762 admission is retained as historical admission
evidence; this addendum controls the updated slice numbers. The canonical
goal ledger names S768 as the next action. The referenced EPIC-17 and
open-source research chats were read, and their latest verified project
checkpoint is reconciled with current Git, project documents, and board state:
EPIC-17 and UIQ-08 are complete; EPIC-18/G05 is already admitted and active.
No new Epic admission is being inferred or created.

S767's digest-bound exit packet is
`docs/research/epic18/S767-T01-editor/exit-packet.md`. It records 127 focused
tests, 100% statement/branch/function/line coverage for the three changed
behavior modules, TypeScript, protected export identity 9/9, real-browser
output for all seven supported recipes, Control Center 42/42, and board
revision 4566. T01 remains Done. T02 starts from the board's corrected
768–770 sequence description.

## Scope

Create the strict typed model and parser/validator for T02 POM definitions.
Represent, without conflating them:

- a stable POM identity and recipe scope;
- the stated measurement method and named start/end or otherwise applicable
  landmarks;
- the measurement unit;
- separate lower and upper tolerance deltas, with an explicit source/evidence
  state; and
- explicit size-range and grade-rule references, each source-backed or
  visibly unresolved with a reason and next action.

Reject malformed identities/references, unsupported unit or method values,
non-finite or wrongly signed tolerance deltas, incomplete source claims, and
other contradictory states with actionable errors. Unresolved source facts
remain representable; do not fill them with pattern defaults or plausible
numbers. Existing recipe `Pom` functions and symmetric numeric tolerances are
legacy digital behavior, not source evidence for a new production tolerance.
The T02 record must preserve that distinction and must not alter the eight
protected export identities.

The contract is generic for Tee, Darted Tee, Tank, Polo, Woven Shirt, Skirt,
and Trouser. This slice does not seed recipe POM data or make recipe-specific
grading claims. It does not change any pattern, grading calculation, POM
measurement function, T01 schema, v2 revision payload, persistence, package,
exporter, user interface, or frozen-output behavior. S769 owns revision-bound
sample/QA records and their editable flow; actual readings must stay separate
from predicted POMs. S770 owns callout and size-run checks, all-recipe rendered
evidence, and T02 closure. No new garment/recipe, supplier fact, physical
sample/fit claim, factory acceptance, standards-conformance, or production
readiness claim is authorized.

## Acceptance and gates

1. A standalone additive T02 POM-definition type and strict parser/validator
   express method, landmarks, unit, sourced asymmetric tolerance, and explicit
   size/grade-rule source state.
2. The parser rejects invalid and conflicting combinations without silently
   clamping or substituting values. Missing facts can be recorded only as
   explicit unresolved state with reason and next action.
3. Tests cover valid sourced and unresolved forms, all supported recipe IDs,
   boundary values, malformed source envelopes, invalid units/methods,
   asymmetric tolerances, and defensive-copy/strict-key behavior as applicable.
4. Changed production code reaches 100% statement, branch, function, and line
   coverage. TypeScript, focused tests, protected export identity, Control
   Center after board replay, and `git diff --check` pass.
5. No UI/output behavior changes in S768; actual all-recipe rendered T02 proof
   remains an S770 gate. The integrated global 100% coverage, build,
   release/readiness, browser/Electron, and output-replay gate remains S780.

## Ownership, risks, and open facts

Codex owns the shared T02 data contract. No safe disjoint contributor task is
identified: schema/source semantics must remain aligned with the frozen T01
and immutable-revision boundaries, and a parallel contract proposal would
create review churn. No contributor wait or maintainer decision is pending.

Existing source documents do not authorize inferring a universal production
tolerance or a single size/grade rule. Some recipe research explicitly treats
digital grade behavior as provisional and physical POMs as unvalidated. The
contract therefore records source identity and unresolved state, not a source
claim or populated recipe fact. A future need to choose or adopt particular
technical source material is a separate owner decision; it does not block
building this source-aware representation.

## Start record

Start packet and board evidence are being recorded against revision 4566 before
implementation. Implementation, focused-verification, external-agent-wait,
and maintainer-decision elapsed time are recorded separately in the exit
packet. No full repository suite or Epic boundary gate is due in this slice.
