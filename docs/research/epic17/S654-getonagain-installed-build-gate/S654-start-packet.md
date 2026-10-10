# EPIC-17 / G04 V03 — GetonAgain installed-build gate — Slice 654 start

## Goal and scope

Record and reconcile the maintainer's newly completed installation of the
official GetonAgain Free desktop package. Verify the installed executable
versions and determine whether the app reaches its CAD workspace and exposes
the DXF path needed for the already-planned contract preflight. This is a
bounded evidence/state slice only; it does not qualify a receiver/profile.

## Verified starting state

- Start: 2026-10-10 06:20:09 UTC.
- Branch: `codex/epic-17-g04`; starting commit `fd0a51b3edddc344f318fe8f8690a49022aadbe5` (S653).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of the starting commit.
- Starting worktree was clean. S653 was the highest assigned slice; no S654 commit existed. Slice 654 is reserved uniquely.
- Starting canonical Control Center board revision: 3761. S653's packet incorrectly still described the desktop as uninstalled and requested UAC approval; the user reports setup complete and this slice rechecks from current Windows state.
- Maintainer already confirmed written product-evaluation/local-DXF permission and authorized the official free desktop setup. That permission does not authorize automating sign-in, registration, or entering credentials.

## Acceptance and required evidence

1. Verify the installed location, executable file/product versions, and actual app startup using the returned Windows UI state.
2. Identify whether the CAD workspace and local DXF path are reachable without authentication. Do not enter or request credentials, register, upload, or open a G04 fixture.
3. Record passed/failed/unproven V03 implications precisely. A successful install or menu label alone cannot qualify a DXF profile or clear any interoperability gate.
4. Reconcile `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, and the canonical board through the validated Control Center command layer; keep G04-V03 blocked and every V03 acceptance criterion unchanged.
5. Run the focused Control Center suite and `git diff --check`; no production source or tests are in scope, so production-code coverage is not applicable.

## Non-goals and stop conditions

- No credentials, registration, settings changes, fixture import/export, file upload, receiver/profile selection, format permutation, or conformance claim.
- No change to all-seven-recipe/options/grades scope; the fixed geometry, identity, seam/mark, malformed-input, repeatability, readable-output, protected-export identity, and legacy-DXF gates remain unchanged.
- Stop before CAD operations if the program requires authentication. After a user-authenticated workspace is available, resume with the S653 exact-contract preflight and verify the local route before any fixture operation.
- No fit, factory-acceptance, or production-readiness claim.

## Conditional delegation

No safe independent delegated task exists: installed-build/UI state and the
shared V03 board/state reconciliation require one integrated evidence owner.
Codex owns the review and closeout.
