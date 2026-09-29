# EPIC-16/G03 Slice 257 — deterministic Electron error assertion

**Status:** Complete; the exact Slice 257 candidate passed full coverage.
**Date:** 2026-09-29
**Parent:** Slice 256 at `cbf91ea`

## Finding and change

The full coverage run on the S256 candidate passed 132/133 files and
2,029/2,030 tests. Its sole failure was `reports an Electron export write
error without confirming export`: under coverage load, its polling assertion
observed an empty status after the app's two-second flash lifetime. The
underlying rejection path ran; the temporary UI message was not retained long
enough for the delayed poll.

Slice 257 makes the test deterministic: it clears shared browser storage,
asserts the save bridge was called, flushes the rejected promise's microtask,
and checks the error message before its timer can expire. It clears the storage
and bridge in cleanup. No product behavior, exporter, or baseline changes.

## Verification

- `npx vitest run src/ui/app.test.ts -t "reports an Electron export write
  error without confirming export"` — passed 1/1 (267 unrelated tests skipped).
- `npm run coverage -- --minWorkers=1 --maxWorkers=3 --testTimeout=15000` —
  passed on exact candidate `14dc0a76acae63ab7ec909988f49f428fb718e9c`.
  The emitted table and generated `coverage/coverage-final.json` report 100%
  statements (24,073/24,073), functions (1,453/1,453), branches
  (11,081/11,081), and lines (24,073/24,073). The complete table was emitted;
  the command exited without a failure summary.
- The protected export-identity suite passed 9/9 in the same coverage run.
- S254 production build and Electron build passed on the preceding candidate;
  Slice 255–257 change only tests and documentation. Reuse those build results;
  no production source or dependency changed after S254.
- The Control Center suite passed 33/33 on S253. No Control Center code changed
  after that verified run.

The full coverage gate is complete. Final PR readiness, merge ancestry, board
closure, and the post-merge GitHub Actions deployment remain separate gates.

No physical-fit, factory-readiness, or production-readiness claim is made.
