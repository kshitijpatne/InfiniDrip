# UIQ-04 integration — Slice 739 pre-merge exit

Status: implementation and pre-merge verification gates passed. This slice is
not merged or deployed; UIQ-04 remains In Review pending the independent PR
review/merge and Slice 740 production closeout.

## Boundary

- Started from current `origin/main` at
  `9bdea4bc46d6a8fa282a4679dbb87ab544998ede` on
  `codex/uiq04-integration`, in the clean managed worktree recorded in
  `docs/planning/UIQ-04-GOAL.md`. The user's primary checkout and separate
  worktrees were not changed.
- Slice 739 implements only the admitted read-only material/appearance
  disclosure, embedded `uiq_material` default/fallback, local tests and evidence.
  Slice 740 remains post-merge deployment, live URL verification and board
  closeout.
- The accepted UIQ-04 candidate source, stylesheet and tests remain byte-for-
  byte unchanged and match the immutable manifest; see
  `docs/research/uiq04-integration/accepted-candidate-identity.json`.
- The disclosure is collapsed by default and visible only in the existing Fit
  step, when its material controls are available. This avoids a misleading
  Review action at steps that intentionally hide those controls, without
  navigating or editing design state. Review actions focus existing controls;
  appearance opens only when closed. Compatibility stays explicitly unknown.
- No drafting/ease math, persistence, recipe, export, output baseline,
  dependency, hosted service, global style or physical-fit claim changed.

## Verification

- Focused UIQ-04, feature-flag, shell/fallback and mapping tests passed. The
  helper also directly verifies unresolved fabric and absent ease guidance map
  to `null` rather than an inferred value.
- Settled repository coverage: 164/164 test files, 2,653/2,653 tests, and
  statements, branches, functions and lines all 100%; one worker; 946.08s in
  the final run after the board-test update.
  All existing export-byte-identity tests passed. The first parallel attempt
  had one timeout in the existing S425 all-option replay under worker
  contention; the test passed in isolation in 3.24s and again in the final
  settled one-worker run in 4.85s. Full gate history is retained in
  `docs/planning/UIQ-04-GOAL.md`.
- `npm run build`, preview TypeScript check, Control Center (42/42), web release
  (10/10), readiness drill (5/5), and `git diff --check` passed. Build reports
  the existing >500 kB chunk advisory; no dependency changed.
- Packaged Windows x64 / Electron 44.1.0 build and
  `npm run electron:verify-release` passed: 72-file inventory, packaged
  identity, fresh welcome, offline reload, malformed local-state recovery,
  six output families, byte-identical button/menu routes, failure/cancel paths,
  and window lifecycle all passed with zero errors and no absolute development
  path. Inventory SHA-256:
  `b6476aaef2b43716a729db252bd8a5939515f99d80192a44980ff46ee22ece09`.
- Actual production `dist` preview pressure test passed at desktop, 640 CSS px
  (200%-equivalent reflow), and 320 CSS px. The narrow viewport had no
  horizontal page overflow (320 px document / 320 px viewport); both review
  buttons met the 44 px touch-target minimum. Keyboard disclosure, focus
  routing, hidden-until-Fit behavior, read-only values, reduced motion, forced
  colors, zero off-origin requests and zero page errors were checked. Browser
  script and screenshots are under
  `docs/research/uiq04-integration/browser-pressure-test.mjs` and
  `docs/research/uiq04-integration/rendered/`.
- Machine-readable evidence summary:
  `docs/research/uiq04-integration/evidence/S739-verification.json`.

## Remaining gates

Passed: admission and candidate identity, flag metadata and fallback, exact
state mapping, hidden-until-Fit presentation, safe focus actions, immutable
design state, focused checks, global 100% coverage, build, operational checks,
export byte identity, rendered production preview pressure test, packaged
Electron verification and protected-file review.

Pending: final Codex diff review, unique-slice/history recheck, one
`Slice 739:` commit, push and PR, required CI, Codex merge, then Slice 740
deployment/public browser proof and board closure. The canonical board is
already at revision 4390 with UIQ-04 In Review and `E-UIQ04-S739` attached.
UIQ-05/07 remain Backlog and unadmitted. No production release is claimed at
this boundary.
