# EPIC-16/G03 Slice 257 — deterministic Electron error assertion

**Status:** Focused regression passes; final full coverage run pending.
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

## Verification and remaining gate

- `npx vitest run src/ui/app.test.ts -t "reports an Electron export write
  error without confirming export"` — passed 1/1 (267 unrelated tests skipped).
- The latest full coverage run still has one failed assertion and emitted no
  global coverage table, so it does not confirm the 100% thresholds.
- Run one full coverage gate on the exact Slice 257 candidate. If it fails,
  record the specific finding and stop repeating the full gate.
- S254 production build and Electron build passed on the preceding candidate;
  Slice 257 changes only test code and documentation. Reuse those build results
  if the final source tree remains identical.

No physical-fit, factory-readiness, or production-readiness claim is made.
