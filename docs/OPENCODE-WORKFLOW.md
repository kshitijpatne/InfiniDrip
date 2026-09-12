# Codex-controlled external coding-agent workflow

This document defines how InfiniDrip uses Claude Code CLI and OpenCode CLI as
headless individual contributors. It is subordinate to `AGENTS.md`,
`PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, and the current code and Git
state.

## Roles and authority

### Product owner

The product owner has final authority over major decisions, scope, priorities,
trade-offs, and acceptance. Codex reports progress continuously and does not
silently make a major product decision.

### Codex — project manager and primary engineering agent

Codex is the main control point and owns roadmap interpretation, slice planning,
work classification, delegation, handoff prompts, progress reporting, PR
review, end-to-end verification, fixes, and integration into `main`. Codex may
push or merge approved work to `main` as authorized by the product owner.

### Claude Code CLI and OpenCode CLI — individual contributors

These agents handle only lower-intensity work explicitly assigned by Codex.
They run headlessly from Codex-controlled terminal sessions and follow the
repository instructions plus the task-specific handoff packet. They do not set
roadmap scope, override product decisions, merge to `main`, or bypass Codex
review.

This workflow intentionally uses direct CLI invocation only. It does not
require MCP wrappers, API-key integrations, or direct model-provider bridging.

## Standard operating sequence

1. Codex reads the required repository context and assesses the upcoming work.
2. Codex decides whether delegation is safe and whether Claude Code or OpenCode
   is the better contributor for the task.
3. Codex creates a complete handoff packet.
4. The contributor works in a separate branch and worktree.
5. The contributor returns machine-readable JSON plus the diff, tests, and
   evidence requested by the packet.
6. Codex reviews the result against the full project checklist.
7. Codex either fixes confirmed issues in a separate Codex branch or sends
   precise follow-up instructions to the contributor.
8. Only Codex-approved work reaches `main`.
9. Codex reports the outcome to the product owner and records useful lessons.

## Delegation decision

Suitable delegated work usually has narrow ownership and low coupling: research
and documentation, isolated UI polish, focused tests, export inspection, or
non-architectural tooling. Codex retains geometry and drafting changes, garment
architecture, shared pipeline changes, byte-identity-sensitive refactors,
physical-validation decisions, and work crossing several recipes or layers.

Parallel work is allowed only when file ownership and behavioral scope are
disjoint. Agents must never edit the same working tree concurrently. A task
that touches a shared contract is not parallel-safe merely because its files
appear separate.

## Required handoff packet

Codex produces this packet for every delegation:

```text
Slice and objective:
Why delegation is safe:
Chosen contributor and reason:
Repository state and relevant prior decisions:
Required files to read:
Files the contributor may modify:
Files the contributor must not modify:
Acceptance criteria:
Non-goals:
Required tests and verification commands:
Required rendered/drafted/output evidence:
Recommended model:
Recommended reasoning level/variant:
Exact task prompt:
Required JSON return format:
```

The prompt must tell the contributor to inspect the repository, follow
`AGENTS.md`, preserve tests and baselines, report uncertainty, and never invent
evidence. The contributor may access the GitHub repository and its checkout;
Codex does not need to transfer previous context files as a separate bundle.

## Branch, worktree, and PR rules

- Start from the latest approved `main` unless Codex explicitly specifies
  another base.
- Use one branch per delegated slice, preferably
  `claude/slice-<number>-<short-name>` or
  `opencode/slice-<number>-<short-name>`.
- Use a separate worktree for every concurrently active agent.
- Keep one logical slice per PR. No unrelated refactors, formatting churn,
  dependency upgrades, or opportunistic fixes.
- Claude Code and OpenCode must never push directly to `main`.
- Do not force-push, rewrite shared history, or commit secrets, credentials,
  generated local state, or machine-specific paths.
- Do not change export baselines, coverage thresholds, CI gates, branch
  protection, or governance documents unless Codex explicitly assigns that work
  and the product owner has approved the scope.
- Every contributor change returns through a PR or an equivalent Codex-reviewed
  branch diff before integration.

## Required contributor return packet

The contributor must return valid JSON, or a clearly delimited JSON block if
the CLI cannot emit pure JSON, containing:

```json
{
  "status": "complete|blocked|needs_follow_up",
  "summary": "...",
  "branch": "...",
  "changed_files": [],
  "tests_run": [],
  "coverage": "...",
  "build_and_typecheck": "...",
  "rendered_or_export_evidence": [],
  "known_limitations": [],
  "follow_up_needed": []
}
```

The JSON is a reporting contract, not proof. Codex verifies every claim in the
actual checkout.

## Codex review and merge gate

Codex reviews the actual diff and resulting checkout, not only the contributor
summary. Work is mergeable only when all applicable items pass:

1. The branch is based on the intended `main` state and contains only assigned
   scope.
2. Acceptance criteria and non-goals are satisfied.
3. TypeScript checks, production build, and the full coverage gate pass.
4. Coverage remains 100%; tests were not weakened, skipped, deleted, or
   rewritten merely to pass.
5. Export byte-identity regression tests and baselines remain unchanged unless
   an explicitly documented, product-owner-approved reason exists.
6. Drafted geometry, rendered UI, and exported/parsed output are inspected
   where relevant; tests alone are not visual or physical proof.
7. Guidance flags invalid combinations with actionable corrections and does
   not silently clamp user inputs.
8. Required garment research and affected durable context are updated in the
   same change as the behavior they describe.
9. No unrelated dependency, configuration, lockfile, security, or platform
   changes slipped into the PR.
10. The change does not claim physical fit or production readiness without
    recorded evidence.

Codex resolves conflicts by understanding both sides. It never accepts a
conflicting version wholesale merely to complete a merge. Codex may merge or
push an approved result to `main`; external contributors may not.

## Feedback and refinement

After each delegated task, Codex records recurring contributor mistakes and
successful prompt patterns in the relevant handoff or project feedback record.
Future packets include those lessons as explicit must-do and must-not-do
instructions. Feedback is evidence-based and never overrides repository
governance.

## Stop conditions

Return ownership to Codex when requirements are unclear, ownership overlaps, a
baseline fails, a physical-fit or architecture decision appears, evidence is
missing, corrections fail repeatedly, or a contributor requests weakening a
project gate.
