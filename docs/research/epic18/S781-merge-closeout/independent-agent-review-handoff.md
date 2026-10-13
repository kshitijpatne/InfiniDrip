# S781 independent review handoff — PR #43

**Slice:** S781, merge/deployment/board closeout.
**Candidate:** PR #43, head `bfacbf68ef242f366e77b6c43ed548ee4fe130b8` (`codex/epic-18-g05`), base `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75`.
**Purpose:** obtain two independent, read-only technical reviews before Codex uses the normal GitHub rebase-merge path. Product owner explicitly limited project review/merge work to the owner, Codex and assigned agents. Do not contact other GitHub users or post GitHub reviews.

## Repository and acceptance context

Read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/planning/EPIC-18-ADMISSION.md`, `docs/planning/EPIC-18-GOAL.md`, `docs/planning/EPIC-18-S765-RESEQUENCING.md`, `docs/research/epic18/S780-integrated-gate/exit-packet.md`, and its `rendered-output-review.md`, `global-coverage-report.md`, and `coverage-confirmation-report.md`. Treat the current PR diff and current worktree as evidence; report unsupported claims or gaps.

The admitted scope covers the ordered T01–T05 work for all seven supported recipes and UIQ-10. The recorded integrated S780 gate is 179/179 test files, 3,161/3,161 tests, 100% statements/branches/functions/lines, build/readiness, browser/Electron review, actual PDF/ZIP inspection, and eight protected export identities. Known limitations are documented: the ordinary Windows Electron output rename failed twice with EPERM, while isolated alternate-path packaging passed functional review; an optional repeated full run had one timeout, and the isolated case passed. Local-first/no-cost and physical/supplier/production-claim holds remain.

## Claude Code assignment

**Contributor/model:** Claude Code CLI using its configured model.
**Why safe:** independent, read-only review of an already integrated and globally verified PR candidate; no source or test edits are assigned.
**Worktree/branch:** its own temporary worktree at the exact candidate commit on `claude/slice-781-pr43-review`.
**May modify:** no repository files. Codex captures the CLI response as review evidence.
**Must not:** edit files, run formatters or tests, commit, push, merge, change GitHub review state, or contact people.

## OpenCode assignment

**Contributor/model:** OpenCode CLI with exactly `opencode/muse-spark-1.3-contributor-free`, variant `xhigh`, normal mode, read-only `plan` agent.
**Why safe:** independently re-review the same exact candidate and acceptance evidence without changing files.
**Worktree/branch:** its own temporary worktree at the exact candidate commit on `opencode/slice-781-pr43-review`.
**May modify:** no repository files. Codex captures the CLI response as review evidence.
**Must not:** edit files, run formatters or tests, commit, push, merge, change GitHub review state, use fast mode or a different model, or contact people. If the exact configured model/variant cannot run, stop and report `blocked`; do not substitute.

## Exact prompt for each reviewer

> Review PR #43 independently and read-only at the exact head commit recorded in this handoff. First inspect the required repository context and S780 exit/rendered-output/coverage evidence named above. Then inspect the full `origin/main...HEAD` PR diff and the changed production code/tests. Assess concrete correctness regressions, data and revision compatibility, invalid-input behavior, seven-recipe scope, coverage/test integrity, all eight protected export byte identities, local-first/no-cost constraints, and unsupported physical/supplier/production claims. Validate claims against the actual files/evidence rather than trusting prior summaries. Do not change files or run tests; the qualifying S780 verification is already recorded and repeated tests are not assigned. Do not contact anyone or modify GitHub. Report only actionable findings with severity, exact file and one-based line, impact, and evidence. Return a valid JSON object using `status`, `summary`, `branch`, `changed_files`, `tests_run`, `coverage`, `build_and_typecheck`, `rendered_or_export_evidence`, `known_limitations`, and `follow_up_needed`, plus `review_decision` set to `APPROVE` only if no unresolved release-blocking or material correctness issue remains; otherwise set it to `REQUEST_CHANGES` or `BLOCKED`. Nonblocking observations must be labeled as such. End with the exact signal `WORK FINISHED` after the review and JSON report are complete.

## Integration gate

Codex waits for each explicit `WORK FINISHED` signal, verifies the actual PR diff and the reports, reconciles findings, and records both decisions. Only after both reviews approve and Codex's integrated check finds no blocker will Codex attempt the normal rebase merge. The actual GitHub merge result is authoritative; do not use `--admin`, bypass rules, or reinterpret an error. After merge, S781 still requires the main test/build/web-proof/deployment workflow, live preview verification, and validated board/document closeout.