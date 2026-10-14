# EPIC-18/G05 Slice 784 — merge, deployment and canonical closeout

**Status at start:** In Progress. **Owner:** Codex. **Started:** 2026-10-14 00:18:10 UTC, the recorded creation time of this slice's exact-head review handoff.

## Verified starting checkpoint

- S783 candidate: codex/epic-18-g05 at f7543010e3932096572549fca36d4e275eceb9c5; PR #43 targeted main, OPEN, CLEAN and MERGEABLE. The prior base was origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75.
- Highest assigned slice on origin/main and the S783 branch was 783; reserve unique next slice 784.
- Canonical board revision 4735: EPIC-18 and G05-EXIT In Progress; G05-T01–T05 and UIQ-10 Done; UIQ-09 Backlog behind EPIC-19.
- The sole S783 technical delta is the path-scoped .gitattributes binary rule. Its fresh Windows checkout verification is in docs/research/epic18/S783-pdf-evidence-line-endings/. The existing S782 product code, regression, rendered output and global gate are unchanged.
- GitHub's effective main rules have no formal approval requirement. The maintainer's gate is two independent, internal, read-only approvals plus Codex acceptance. Do not contact outside GitHub users.

## Exact ordered scope and exit gates

1. Obtain Claude Code and OpenCode final approvals for exact PR head f7543010e3932096572549fca36d4e275eceb9c5, reviewing the S783 delta and confirming S782's prior approvals still apply. Neither reviewer may edit files, run tests/build/render, or post review state.
2. Codex checks both explicit decisions and accepts the actual S783 diff.
3. Rebase-merge PR #43 only if its head remains the reviewed SHA; verify the merge commit is on origin/main.
4. Follow the main-only GitHub workflow through its full test suite, build, deterministic web proof and Cloudflare Pages deploy.
5. Verify the immutable deployment URL and stable preview return HTTP 200.
6. Record reviewer, merge and deployment evidence; update the goal ledger, project state, decision/context indexes, and canonical board through its validated command layer. Close G05-EXIT and EPIC-18 only after all gates pass.

## Non-goals, delegation and verification plan

No product source or test change, output regeneration, export-baseline move, garment admission, physical/supplier/factory claim, paid service, code signing, compliance or production-readiness claim. Preserve all existing holds. The S783 affected Control Center suite already passed 42/42 after summary updates; the S782 global 179-file/3,161-test four-metric gate and rendered output remain valid. Do not repeat local product tests, builds, browser sessions, rendering or export checks. The post-merge main workflow is the required full integrated gate. After its success, only the Control Center suite is in scope if final board changes need that focused check.

Claude Code and OpenCode own disjoint read-only exact-head reviews in the separate worktrees listed in review-handoff.md. No safe independent implementation task remains for the documentation/board closeout; Codex owns it and reviews the final diff. Effort, external-review wait, and CI/deploy duration are measured at exit; no delivery date is promised.
