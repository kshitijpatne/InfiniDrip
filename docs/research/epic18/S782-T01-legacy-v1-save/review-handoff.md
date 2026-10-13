# S782 independent review handoff — PR #43

## Slice and objective

Review the settled S782 remediation in the existing PR #43. The candidate is the exact immutable commit that Codex will provide after committing and pushing Slice 782. At dispatch, Codex will verify PR #43's head SHA, pass that 40-character SHA in the prompt, and place the reviewer worktree at that exact commit. Reviewers must verify HEAD equals the assigned SHA and must not follow a moving branch.

The owner requires two independent internal reviews: one by Claude Code CLI and one by OpenCode CLI. This is an internal review gate, not a request to post GitHub reviews or contact other GitHub users.

## Repository state and context

The code is on codex/epic-18-g05, after S781 commit 9d5e35bdb5e1a60fe48e60fb9d86c88968a9095d. The currently verified main ancestor is e9221ea5033ccfdd91bf1ebb353926f189477d75; Codex refreshes origin/main and confirms ancestry at dispatch.

Read the following before review:
- AGENTS.md, CONTEXT-INDEX.md, PROJECT-STATE.md, ARCHITECTURE.md, docs/PROJECT-DECISIONS.md
- docs/planning/EPIC-18-ADMISSION.md, docs/planning/EPIC-18-GOAL.md, docs/planning/EPIC-18-S765-RESEQUENCING.md, docs/planning/EPIC-18-S782-REMEDIATION-ADMISSION.md
- docs/research/epic18/S781-merge-closeout/review-reconciliation.md
- docs/research/epic18/S782-T01-legacy-v1-save/exit-packet.md, focused-verification.json, boundary-verification.json, rendered-proof-verification.json, rendered-output-review.md, and the PDF/ZIP artifact manifest and inspection records.

Inspect the full PR diff from the current refreshed origin/main to the assigned immutable HEAD, especially src/ui/project-workflow.ts and src/ui/project-repository.test.ts. Verify review claims against those files and evidence.

## Why this review is safe and bounded

The first S781 review found a migration compatibility bug: a real v8 database upgrade can load a payload-v1 revision head with no T01 data in that historical payload, while migration creates an unlinked T01 record with revisionId null and revisionNumber 0. The previous first T01 save was rejected until an unrelated design revision had been created.

S782 should allow only this guarded case: a verified payload-v1 head for the same active style; a stored unlinked T01 record for that same style and recipe with null/zero identity; and a user-authored changed T01 candidate based on that stored record. The save should create one payload-v2 child, preserve the v1 parent and digest, leave a no-op stable, retain validation and ordinary v2 identity checks, and reject a stale repository compare-and-swap write. The real migration fixture covers the path through local review and freeze.

## Reviewer ownership and limits

- Claude Code branch/worktree: claude/slice-782-pr43-review in its own temporary worktree at the assigned exact SHA.
- OpenCode branch/worktree: opencode/slice-782-pr43-review in a separate temporary worktree at the same exact SHA.
- May modify: no repository files. Capture the CLI response outside the candidate worktree.
- Must not: edit or format files; run tests or builds; commit, push or merge; alter GitHub review state; contact anyone; or include any reviewer's private reasoning.
- Do not rerun the passing tests: the focused and full coverage results and relevant browser/Electron output checks are recorded in the packet. Review only the changed behavior, tests, diff scope, and evidence.
- Assess backward compatibility, malformed/invalid data rejection, no-op behavior, stale-tab/repository CAS protection, parent/digest preservation, payload-v2 binding, local-only approval/freeze scope, the eight protected export identities, and absence of unsupported physical/supplier/production claims.
- Report actionable findings with severity, exact file and one-based line, impact, and evidence. Label nonblocking observations explicitly.

## Models and modes

- Claude Code uses its configured Claude account/model in read-only mode.
- OpenCode must use exactly opencode/muse-spark-1.3-contributor-free, variant xhigh, normal mode, read-only plan agent. Never use fast mode or a different model. If this exact setup is unavailable, return BLOCKED and stop; do not substitute.

## Exact review prompt to be supplied at dispatch

Review the current PR #43 candidate independently and read-only at exact commit SHA [Codex supplies the verified 40-character SHA]. First confirm your worktree HEAD exactly matches it and inspect the required repository context and S782/S781 evidence listed in this handoff. Inspect the complete refreshed origin/main...HEAD diff and the changed production logic/test fixture. Assess correctness, migration and revision compatibility, invalid/malformed record handling, no-op and stale/CAS behavior, all eight protected export identities, local/no-cost boundaries, and unsupported physical/supplier/production claims. Do not modify files or run tests/builds; qualifying focused/full checks and actual browser/Electron/PDF/ZIP review already pass and their evidence is linked here. Do not contact people or alter GitHub state. Return the repository-required JSON fields status, summary, branch, changed_files, tests_run, coverage, build_and_typecheck, rendered_or_export_evidence, known_limitations, and follow_up_needed, plus review_decision set to APPROVE only if no unresolved release-blocking or material correctness issue remains; otherwise set REQUEST_CHANGES or BLOCKED. Give actionable findings with severity, file and line, impact, and evidence; label nonblocking observations. End with the exact signal WORK FINISHED after the review and JSON report are complete.

## Codex integration gate

Codex waits for each contributor's explicit WORK FINISHED signal, verifies the exact reviewed SHA, full findings, actual PR diff and evidence, and reconciles both reports. Merge is permitted only after both return APPROVE and Codex accepts the integrated candidate. GitHub has no formal approval gate on main; the owner's two independent internal approvals are the gate. No outside GitHub reviewers are to be contacted.
