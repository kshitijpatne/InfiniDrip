# S489 board replay diagnostic

- At `2026-10-08 09:08 UTC`, `replay-exit.mjs` saved the first two validated
  commands, reaching board revision 3043, then failed while atomically
  renaming the third temporary JSON into `board.json` with Windows
  `EPERM: operation not permitted`.
- The failed command did not advance revision 3043. The board parsed and
  validated; the two evidence IDs were present and correctly linked. No
  `.board.json.*.tmp` or `board.json.lock` remained. The board file was not
  read-only and current-user ACL allowed full control. Control Center tests
  passed 42/42 at that partial state.
- The precise cause of the one OS-level rename denial could not be attributed
  to a specific process. No inference of corruption or product-code failure
  was made. The original error is preserved in the Codex task tool output.
- Recovery: `replay-exit.mjs` now checks for exact persisted effects when a
  command's expected revision is older than the board. It fails closed if the
  effect is absent, otherwise continues from the live revision. The retry
  verified commands at revisions 3042 and 3043 as already applied, then
  completed the remaining validated commands through revision 3047.
- After recovery, `npm run control-center:test` passes 42/42; all S489
  preflight/replay scripts pass `node --check`; `git diff --check` passes.
