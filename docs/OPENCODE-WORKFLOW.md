# Codex ↔ OpenCode delegation workflow

This is the operating policy for using OpenCode as a parallel individual
contributor on InfiniDrip. It is subordinate to `AGENTS.md`,
`PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, and the current code and Git
state.

## Operating model

- Codex owns the roadmap, slice assignment, delegation decision, review, and
  final integration.
- OpenCode receives a complete handoff prompt from Codex and works as an
  individual contributor. It may inspect the GitHub repository and the files
  present in its checkout; previous context files are not transferred as a
  separate bundle.
- OpenCode must work only on a separate branch and must never push directly to
  `main`.
- Every OpenCode change returns through a pull request. Codex reviews every PR
  against the checklist below before it is merged.
- Codex may fix confirmed issues in a separate working tree/branch or send a
  precise follow-up request to OpenCode. No change is merged merely because an
  agent reports that it is complete.

## Delegation decision

Codex classifies each candidate slice before delegation.

Suitable OpenCode work usually has narrow ownership and low coupling: research
and documentation, isolated UI polish, focused tests, export inspection, or
non-architectural tooling. Codex retains geometry and drafting changes,
garment architecture, shared pipeline changes, byte-identity-sensitive
refactors, physical-validation decisions, and work crossing several recipes or
layers.

Parallel work is allowed only when file ownership and behavioral scope are
disjoint. Agents must not edit the same working tree concurrently. A task that
touches a shared contract is not parallel-safe merely because its files appear
separate.

## Required handoff packet

Codex produces this packet for every delegation:

```text
Slice and objective:
Why OpenCode is suitable:
Repository state and relevant prior decisions:
Required files to read:
Files OpenCode may modify:
Files OpenCode must not modify:
Acceptance criteria:
Non-goals:
Required tests and verification commands:
Required rendered/drafted/output evidence:
Recommended OpenCode provider/model:
Recommended reasoning level/variant:
Exact task prompt:
Required return format:
```

The prompt must tell OpenCode to inspect the repository rather than assume
missing context, follow `AGENTS.md`, preserve existing tests and baselines, and
report uncertainty instead of inventing evidence.

## Branch and PR rules

- Start from the latest approved `main` unless Codex explicitly specifies a
  different base.
- Use one branch per delegated slice, preferably
  `opencode/slice-<number>-<short-name>`.
- Keep one logical slice per PR. Do not mix opportunistic refactors,
  formatting-only churn, dependency upgrades, or unrelated fixes.
- Do not force-push, rewrite shared history, or commit secrets, credentials,
  generated local state, or machine-specific paths.
- Do not change export regression baselines, coverage thresholds, branch
  protection, CI gates, or repository governance documents unless the handoff
  explicitly requests it and Codex reviews the rationale.
- The PR must list changed files, tests run, coverage, build/typecheck results,
  rendered or parsed evidence, known limitations, and any files intentionally
  left untouched.

## Codex review and merge gate

Codex reviews the actual diff and the resulting checkout, not only the PR
description. A PR is mergeable only when all applicable items pass:

1. The branch is based on the intended `main` state and contains only the
   delegated scope.
2. Acceptance criteria and non-goals are satisfied.
3. TypeScript checks, production build, and the full coverage gate pass.
4. Coverage remains 100%; tests were not weakened, deleted, skipped, or
   rewritten merely to pass.
5. Export byte-identity regression tests and baselines remain unchanged unless
   an explicitly documented maintainer-approved reason exists.
6. Drafted geometry, rendered UI, and exported/parsed output are inspected
   where relevant; tests alone are not treated as visual or physical proof.
7. Guidance flags invalid combinations with actionable corrections and does
   not silently clamp user inputs.
8. Required garment research, `PROJECT-STATE.md`, `ARCHITECTURE.md`, and other
   affected durable context are updated in the same change.
9. No unrelated dependency, config, lockfile, security, or platform changes
   slipped into the PR.
10. The change does not claim physical fit or production readiness without
    recorded evidence.

Codex must resolve merge conflicts by understanding both sides. Never accept a
conflicting version wholesale just to make a merge complete. If the PR fails a
gate, Codex either sends a concrete correction packet to OpenCode or fixes it
on a separate Codex branch and submits/reviews the resulting change. Agents do
not bypass review by pushing unreviewed commits directly to `main`.

## Feedback loop

After review, Codex records recurring OpenCode mistakes and successful prompt
patterns in the handoff or project feedback record. Future packets must include
relevant lessons as explicit "must do" and "must not do" instructions. Feedback
must be evidence-based and must not replace the repository's governing rules.

## Stop conditions

Stop delegation and return ownership to Codex when OpenCode encounters unclear
requirements, overlapping ownership, a failing baseline, a physical-fit or
architecture decision, repeated failed corrections, missing evidence, or a
request to weaken a project gate. Ask for clarification only when the missing
decision materially changes scope or correctness; otherwise choose the safest
documented interpretation and state it in the PR.
