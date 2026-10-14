# Slice 783 start — exact-byte preservation for the S782 PDF evidence

**Started:** 2026-10-13 23:51:40 UTC. **Usage at start:** primary 31%, weekly 26%. **Worktree:** `C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`. **Branch:** `codex/epic-18-g05`. **Starting commit:** `19c101dfeff43a8761e431a488ab61d092dae73f`. **Fresh origin/main:** `e9221ea5033ccfdd91bf1ebb353926f189477d75`, verified ancestor. **Board:** revision 4725.

The S782 fix was approved on its exact PR #43 head by Claude Code and OpenCode; reports are stored in `docs/research/epic18/S782-T01-legacy-v1-save/claude-review-report.json` and `opencode-review-report.json`. Claude flagged the S782 PDF's missing `binary` attribute. Codex reproduced the mismatch in a fresh Windows worktree: committed 11,686-byte PDF hash `d27d230005e9a97bf6e739ecc109bb03b6219f24368177ee129b81180f9e57c4`, checked-out 11,887-byte PDF hash `03a1c84a35f5d8809cf29daa48b52f0b2cbda6ec58c24c1691de611304efa297`.

## Exact boundary

1. Register this admission and start record through the validated Control Center command layer; keep EPIC-18/G05-EXIT In Progress.
2. Add only a path-specific `.gitattributes` `binary` rule for the retained S782 PDF. Restore the current tracked file from the committed blob after Git begins honoring the rule.
3. Verify the rule and check out the committed S783 candidate into a fresh Windows worktree with `core.autocrlf=true`. Compare its PDF bytes and SHA-256 with the committed blob and recorded manifest. Confirm the ZIP and embedded PDF remain unchanged.
4. Update current durable context and board so S783 is the evidence-integrity follow-up and S784 is the exact-head review, merge, main CI/deploy, live-preview, and closeout boundary.
5. Do not rerun tests, builds, browser/Electron, or rendering: S782 source/tests are unchanged, and their complete passing evidence remains valid. The S783 gate is Git attribute plus exact hash preservation. Record a fresh-head internal CLI review by each agent as the S784 prerequisite.

No code, test, generated artifact, PDF content, ZIP, export baseline, product scope, or GitHub review state is to change in this slice.
