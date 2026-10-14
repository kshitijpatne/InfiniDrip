# S784 exact-head internal review handoff — PR #43

## Objective and gate

Review the S783 update in PR #43 at immutable head
`f7543010e3932096572549fca36d4e275eceb9c5`. The parent S782 head is
`19c101dfeff43a8761e431a488ab61d092dae73f`; refreshed `origin/main` is
`e9221ea5033ccfdd91bf1ebb353926f189477d75` and is an ancestor. GitHub reports
PR #43 OPEN, CLEAN and MERGEABLE. Two separate internal approvals, one from
Claude Code CLI and one from OpenCode CLI, plus Codex's integrated acceptance,
are the maintainer's merge gate. This is not a request to submit formal GitHub
review states or contact other GitHub users.

## Separate reviewer worktrees

- Claude Code: `C:/Users/kshit/.codex/worktrees/s784-claude-review`, detached
  at the exact head above.
- OpenCode: `C:/Users/kshit/.codex/worktrees/s784-opencode-review`, detached
  at the exact head above.
- Both worktrees have `core.autocrlf=true`, are clean, and check out the S782
  PDF as `i/lf w/lf attr/-text`, 11,686 bytes, SHA-256
  `d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4`.

## Review scope

Inspect `git diff 19c101dfeff43a8761e431a488ab61d092dae73f..f7543010e3932096572549fca36d4e275eceb9c5`
and the full PR for context. Re-review the S783 delta and verify the prior S782
approval still applies. Confirm the `.gitattributes` pattern is scoped to the
retained S782 PDF, Git honors the binary attribute, and the committed PDF, ZIP
and artifact manifest hashes agree with the durable evidence. Inspect the
validated board replay and S782 exit-evidence reconciliation; EPIC-18 and
G05-EXIT must remain In Progress at board revision 4735. Review for accidental
product/test/output/export changes, unsupported product or production claims,
and missing relevant acceptance evidence.

## Required context

Read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `ARCHITECTURE.md`,
`docs/PROJECT-DECISIONS.md`, the EPIC-18 goal/admission/resequencing documents,
the S783 admission/start/exit/hash-verification records, the S782 reviewer
reports and retained artifact manifest/ZIP inspection, and
`S782-board-evidence-reconciliation.md`.

## Limits and verification

This is read-only review work. Do not edit or format repository files; run no
tests, builds, browser/Electron sessions, or rendering; create no commit or
branch; and do not post to GitHub, change review state, or contact anyone.
The S783-focused hash/attribute gate and affected Control Center 42/42 suite
already passed, while the S782 product and full-global gates remain valid.

OpenCode must use exactly `opencode/muse-spark-1.3-contributor-free`, variant
`xhigh`, normal mode, and the `plan` agent. If unavailable, return BLOCKED and
stop without substitution. Claude Code must use its configured model with
read-only plan/permission mode.

## Required response

Return JSON only, with `status`, `review_decision`, `summary`, `branch`,
`changed_files`, `tests_run`, `coverage`, `build_and_typecheck`,
`rendered_or_export_evidence`, `findings`, `known_limitations`, and
`follow_up_needed`. Use `APPROVE` only if no unresolved release-blocking or
material correctness issue remains. Give findings with severity, exact file
and one-based line, impact and evidence; clearly label nonblocking notes. Do
not include private reasoning. Finish with the exact signal `WORK FINISHED`.
