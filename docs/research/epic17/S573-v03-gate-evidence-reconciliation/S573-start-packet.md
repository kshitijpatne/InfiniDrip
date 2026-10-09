# EPIC-17 / G04 V03 — Gate evidence reconciliation — Slice 573 start

- Started: 2026-10-09 04:05:40 UTC.
- Branch: `codex/epic-17-g04`.
- Start commit: `1c22caff154da2a06f2da2adc7e579614a7d0cf1` (S572).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, ancestor of HEAD.
- Start board revision: 3405; `G04-V03` is In Progress.
- Highest assigned slice: 572; this reserves unique S573.

## Scope

Reconcile the admitted V03 criteria and latest roadmap gate picture (S558) with
the durable S557–S572 evidence and current source. Produce one concise,
evidence-linked matrix separating: profile identity, exact compatibility claim,
geometry, piece identity, cut/sew semantics, marks, grades/options, malformed
input, round-trip, rendered evidence, and protected exports. Correct current
state summaries if they wrongly say a second receiver or normative edition is
an acceptance prerequisite, or fail to distinguish a documented profile name
from a proven compatibility claim. Identify the next test only if it is not a
repeat of a tested scenario and is supported by current source/docs.

## Acceptance and non-goals

- Keep every admitted V03 acceptance criterion and the all-seven V02 criterion
  unchanged; no compatibility claim without passing import/round-trip evidence.
- Mark a subgate passed only where a current primary document and a matching
  observed receiver/build/settings support it. Keep current technical failures
  and unproven semantics/options held.
- Use the roadmap's current `CLO 2026.1.310 / DXF-AAMA` profile identification
  and S557's correction that a second receiver is optional; do not invent a
  conformance, standards-edition, or second-receiver requirement.
- No CLO rerun, source/pattern/edit, new format implementation, standard text
  purchase, threshold/baseline change, acceptance weakening, or new software
  installation in this evidence-reconciliation slice.

## Ownership and verification

Codex owns the cross-record review and corrections. The evidence spans one
shared gate matrix, so no safe parallel ownership exists. Reuse existing
hash-pinned analyzers and receipts. Validate board changes through the
Control Center command layer; run focused Control Center tests and
`git diff --check`. Full repository tests/coverage remain for the settled Epic
candidate; no production code changes are authorized here.

## Required output

Durable matrix with source/evidence references, explicit pass/fail/held status,
the latest authoritative acceptance source, exact remaining criteria, and one
non-redundant next action. Update `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, the
admission record and canonical board. No physical-fit/factory/production claim.
