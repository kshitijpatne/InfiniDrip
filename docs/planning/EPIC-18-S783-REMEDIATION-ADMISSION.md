# EPIC-18/G05 Slice 783 — preserve generated PDF evidence on Windows checkouts

**Status:** Admitted as a bounded evidence-integrity follow-up to S782. **Started:** 2026-10-13 23:51:40 UTC. **Owner:** Codex.

## Authority and verified start

S782's production fix, regression, focused/full gates and actual rendered proof are complete. Both independent reviewers approved exact PR #43 head `19c101dfeff43a8761e431a488ab61d092dae73f`. Claude Code reported one low-severity, nonblocking evidence issue: the committed S782 PDF is not covered by the repository's path-specific `binary` attributes, so a fresh Windows checkout with `core.autocrlf=true` changes its bytes. OpenCode reported no findings. Their sanitized final reports (JSON only; no private reasoning) are in `docs/research/epic18/S782-T01-legacy-v1-save/`.

Codex reproduced the finding in a fresh review worktree at the exact S782 commit: committed blob 11,686 bytes, SHA-256 `d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4`; fresh checkout 11,887 bytes, SHA-256 `03a1c84a35f5d8809cf29daa48b52f0b2cbda6ec58c24c1691de611304efa297`; `git ls-files --eol` reported `i/lf w/crlf attr/`. The pre-existing S782 worktree still matches the correct blob because it existed before the PDF was added.

The verified branch is `codex/epic-18-g05`, at S782 commit `19c101dfeff43a8761e431a488ab61d092dae73f`; fresh `origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` is an ancestor. PR #43 is open on that exact head. The canonical board is revision 4725, with EPIC-18 and G05-EXIT In Progress. Slice 782 is the highest assigned commit; S783 is the next unique number.

## Scope and acceptance

Add one path-specific `binary` attribute for `docs/research/epic18/S782-T01-legacy-v1-save/S782-legacy-v1-tech-pack.pdf`, following the adjacent generated-PDF evidence rules. Preserve the committed PDF bytes. Verify the attribute is active and a new Windows checkout under the configured `core.autocrlf=true` retains exactly 11,686 bytes and SHA-256 `d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4`. Confirm the ZIP and embedded-PDF manifest records are unchanged. Record both independent S782 approval reports.

No production behavior, source code, tests, rendered output, export code, fixture, baseline, threshold, or PDF content may change. No test or build rerun is needed; the only focused gate is the Git attribute and clean-checkout byte/hash comparison. The updated PR head must still receive independent Claude Code and OpenCode approval plus Codex acceptance before merge.

## Ordered boundary and exit gates

| Slice | Boundary |
| ---: | --- |
| 783 | Add the path-specific binary attribute, verify fresh Windows checkout byte identity, and record the S782 exact-head review reports and S783 evidence. No product behavior or tests. |
| 784 | Review the exact updated PR head (review only the S783 delta plus confirm prior S782 approvals still apply), Codex accepts, normal rebase-merge PR #43, pass the main-only test/build/web-proof/Cloudflare Pages deployment, verify live preview output, then close the canonical board and durable records. |

The S782 remediation admission and its code/tests remain unchanged. This follow-up does not alter the local-first/no-cost scope, seven-recipe breadth, eight protected legacy-export hashes, physical/supplier/factory/production-claim holds, or launch/provider deferrals. No outside GitHub users are to be contacted and GitHub has no formal approval requirement for main; the two internal reviews are the maintainer's explicit merge condition.

## Verification, risks and ownership

The sole S783 implementation change is `.gitattributes`; generated PDF xref offsets require byte preservation. Risk is limited to the one path. Codex owns the attribute, records and hash verification. No independent coding task has safe disjoint ownership. After the S783 commit is pushed, Claude Code and OpenCode receive separate read-only worktrees at its exact SHA and inspect the attribute-only delta; they must return explicit `APPROVE` and `WORK FINISHED`. They must not run tests, change files, or touch GitHub review state. Codex checks both actual responses and the candidate diff. S784 owns merge and deployment.

**Effort assumptions:** one-file configuration plus durable checkpoint updates; hash verification only. Reviewer wait and deployment durations are unknown and will be recorded rather than guessed. No calendar date is promised.
