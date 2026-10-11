# EPIC-17 / G04 V03 — CLO tested-profile disposition — Slice 585 start

## Verified start

- Started 2026-10-09 06:09:32 UTC from S584 commit
  `2d1ed375558cacdd541921a71ce02590582781ea` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor of HEAD; worktree was clean before this packet.
- Canonical Control Center board revision 3453: EPIC-17 and G04-V03 In
  Progress; G04-V01/V02 Done. Highest assigned slice is 584; S585 is unique.
- The active goal remains active and aligned with the admitted EPIC-17/G04
  objective. Ordinary usage is allowed (primary 16%, weekly 70%).
- The maintainer's written product-development rights and local DXF-processing
  confirmation is settled in `docs/PROJECT-DECISIONS.md`; no further approval
  or locality query is needed for this bounded evidence review.
- CLO 2026.1.310 remains open. No CLO UI action is in scope for S585.

## Objective and evidence boundary

Determine whether any **already-tested** CLO profile and settings remain a
plausible receiver path for G04's unchanged Polo geometry and V03 acceptance,
using only the saved evidence. Reconcile the measured CLO Standard DXF run
(S508), AAMA-import/ASTM-export matrix (S498 and its setting variants),
DXF-AAMA import/export result (S516), connected-line input variant (S574),
and the pre-export getter observation (S584). Include S517's point-loss
diagnosis and S573's authoritative gate reconciliation where relevant.

The key geometry threshold remains 0.001 cm (0.01 mm). The documented profile
identity `CLO 2026.1.310 / DXF-AAMA` and maintainer-confirmed rights/local
processing are supported. The review must decide only the standing of the
tested CLO paths against the admitted acceptance; it must not infer a general
CLO or DXF-format limitation, attribute loss to an unisolated pipeline stage,
or treat profile identity as compatibility.

## Scope and non-goals

- Read and reconcile the existing pinned inputs, output diagnostics, rendered
  evidence, settings, and current V03 gate matrix. Record each distinct tested
  profile path and its relevant pass/fail evidence without rerunning it.
- Determine whether these tested paths can satisfy the current Polo geometry
  gate and the complete admitted profile/round-trip criteria. If they cannot,
  state the bounded candidate disposition and one next evidence-backed V03
  action.
- Preserve every V03 gate: geometry, piece/revision/size identity, CUT/SEW and
  mark semantics, native grade/options, malformed-input behavior, rendered
  inspection, round trips, representative/all-seven recipe coverage, and
  receiver/profile evidence. Preserve V02 all-seven acceptance, legacy DXF
  behavior, protected export byte identities, and the V02-before-V03 order.
- No new CLO transfer/UI action, API probe, DXF generation, profile variation,
  source or product implementation, pattern change, standards claim, scope or
  threshold change, or physical/factory/production-readiness claim.
- Keep CLO open while the admitted G04 work still needs it. All existing and
  future live-app files remain under the purpose-named C: exchange directory.

## Exit gates and verification

Pass the slice when the cited saved evidence has been hash/identity-checked
where records provide hashes; the tested paths are compared accurately to the
unchanged criteria; distinctions between observed, passed, failed, and
unproven gates are explicit; and the next action is stated without relaxing
acceptance. Link the S585 packet and summary to G04-V03 through the validated
Control Center command layer. Preserve G04-V03 and EPIC-17 as In Progress.

Run `npm run control-center:test` (42 expected focused tests), S585 command
preflight/replay/status checks, relevant evidence-file assertions or
reproducible analysis, syntax checks for S585 scripts, and `git diff --check`.
This is evidence/documentation only; no full production-code coverage/build
gate is due. The full repository gates remain required on the settled PR
candidate.

## Delegation and timing

No independent low-risk ownership split is available: the task reconciles one
shared receiver's profile identity, tested outcomes, and admitted V03 gates.
Codex retains evidence review and disposition. No external-agent wait is
required.

Slice start is 2026-10-09 06:09:32 UTC. At exit, separately record evidence
review, focused verification, durable state/board closeout, external-agent
waits, and maintainer-decision time. No pending maintainer decision is
identified at admission.
