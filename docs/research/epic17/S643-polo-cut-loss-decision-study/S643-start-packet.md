# EPIC-17 / G04 V03 — Polo CUT loss decision study — Slice 643 start

## Verified starting boundary

- Started 2026-10-09 22:49:48 UTC from clean S642 commit
  45281de549c5b17e4380f07d6600095620bb3c8e on codex/epic-17-g04.
- Refreshed origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0; it is an
  ancestor of HEAD. S642 is the highest assigned slice; reserve S643.
- Canonical board revision 3714 has G04-V01/V02 Done and G04-V03/EPIC-17 In
  Progress. S642's verified exit evidence and comment are linked. Start replay
  may add evidence/comment only.
- Current decisions, admission, state, V03 matrix, S642 packet, and S634
  source-topology evidence have been re-read. CLO remains open with the saved
  S642 project, but this source-analysis slice needs no further app operation.

## Objective and boundary

Reconcile S642's source-exact CLO failure with the existing five Polo CUT
losses and derive an approval-ready, pattern-specific source decision without
guessing which edges are expendable. Inspect the exact generated recipe/CUT
points for all affected Polo source roles and configurations; quantify what a
candidate geometry simplification would change relative to current pattern
output; distinguish a verified technical fact from a design assumption; and
update the consolidated V03 gate matrix with S639–S642.

This slice is proposal-only. Do not edit the recipe, exporter, cut
geometry, stitch graph, tolerance, fixture, acceptance criteria, CLO profile,
or protected export identities. Do not implement any source repair until the
maintainer approves an exact proposal. Do not reopen already-tested CLO
entity, block-grouping, setting, or import-mode trials. Keep the all-seven
recipe gate, 0.001 cm exchange tolerance, malformed-input, marks,
grades/options, repeatability, readability, profile, rights, legacy DXF and
all other V03 holds unchanged.

## Required result

1. Map each affected source edge/vertex to its current recipe role and exact
   emitted CUT sequence, including all Polo options/configurations where the
   same topology appears.
2. Evaluate the smallest mathematically explicit source change that would
   remove each imported micro-segment, measure the resulting source-shape
   deviation and projected output effect, and call out that it changes
   product geometry. Compare it with retaining the current geometry and
   holding the CLO candidate.
3. Label evidence as directly encoded, measured in output, or proposed
   design choice. Do not describe an estimated tolerance as physical or
   factory evidence.
4. Update the current V03 gate matrix with S642's nine identities, 13/18
   native contours and five CUT failures, alongside the already-reconciled
   CLO and generic R14 evidence. Identify one concrete next action and its
   decision gate; do not infer acceptance changes from a proposal.
5. Update PROJECT-STATE.md, CONTEXT-INDEX.md, and the validated board
   without changing any work-item status.

## Non-goals and risks

- No user-facing geometric choice is assumed or implemented.
- No physical sample, fit, cutting-machine resolution or factory claim.
- No supplier contact, spending, hosted upload, new application or scope
  extension.
- No safe independent ownership is identified: source topology, option
  generator, geometric effect and V03 matrix form one coupled decision study.
  Codex retains integration and final review.

## Verification and single next action

This documentation/evidence slice uses source-bound generator inspection and
deterministic geometry calculations, then the focused Control Center suite,
board replay validation, and git diff --check. There is no production code
change, so changed-code coverage and the full repository gate do not apply.
Record implementation/analysis, focused verification, external-agent wait,
and maintainer-decision time separately at exit.

First validate the start replay at board revision 3714, then inspect the five
exact source points and their all-option consequences. Do not implement a
candidate repair before presenting its measured effect for approval.
