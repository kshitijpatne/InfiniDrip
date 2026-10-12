# UIQ-05 integration — Slice 741 pre-merge exit

Status: implementation and pre-merge acceptance gates passed. The canonical
board records UIQ-05 in Review at revision 4400. This slice is not merged or
deployed. Slice 742 remains the
post-merge deployment, live verification, board closure, and durable handoff.

## Scope and boundary

- Started from `origin/main` at `f4cbfc45ca3bf2237b226a159ebe78e738ea3016`
  on `codex/uiq05-integration` in the managed task worktree.
- UIQ-05 restyles the existing Surface artwork catalog behind embedded
  `uiq_artwork`. It does not mount a duplicate prototype or change catalog,
  artwork assets, rights/assessment logic, placement data, saving, drafting,
  exports, or baselines.
- The app continues to own the independent “Curated print use” filter and
  “Show guidance for” selector, per-card stage-new and attach-to-selected
  actions, target validation, action status, and local bundled-image rules.
  Browsing/filtering stays non-mutating; clear-search restores defaults and
  focus without changing the chosen placement.
- Candidate TS/CSS/tests remain byte-identical to the immutable manifest after
  normalizing Windows CRLF checkout bytes to canonical LF. The integration
  consumes only the candidate's scoped visual contract and ships a separate
  app adapter stylesheet.
- Flag off, unknown, and stale states retain the exact legacy Surface markup
  and behavior. Flag rollback is not live; the embedded code default requires
  a reviewed code change and redeploy.

## Verification

- Focused UIQ artwork/flag/view selection passed: 79 tests. It includes filter
  independence, clear/no-match recovery, flag fallback, and explicit stage/
  attach behavior. A prior detached-JSDOM-only focus assertion was removed;
  the connected rendered-browser check below proves focus restoration.
- Settled global coverage passed with one worker: 164/164 test files,
  2,657/2,657 tests, and 100% statements, branches, functions, and lines in
  979.26 seconds. Export byte-identity regressions passed. Coverage artifact
  SHA-256: `f39f6828857239a4be8038db2d2efc7a9fd1f423cff7e5847ab9169e40e4cb4a`.
- Production TypeScript/Vite build and Electron TypeScript build passed. The
  existing >500 kB JS chunk advisory remains; no dependency changed.
- Operational gates passed: Control Center 42/42, web release 10/10, and
  readiness drill 5/5. `git diff --check` passed before this report was added.
- The actual built web UI passed a fresh isolated Playwright browser pressure
  test at 1280, 640 (200%-equivalent reflow), and 320 CSS px with no horizontal
  overflow. Clear returns keyboard focus to search; Tab reaches category.
  Forced-colors and reduced-motion modes work; targets are at least 44 px;
  images remain same-origin. Both explicit actions were exercised: staging
  alone does not add a placement, and attaching changes artwork metadata while
  preserving placement values. Zero off-origin requests, page errors, or
  console errors. Machine results and rendered captures are under
  `docs/research/uiq05/evidence/`.
- Windows x64 packaged Electron 44.1.0 verification passed: fresh profile,
  offline reload, stale-state recovery, all six output families, button/menu
  byte parity, cancellation/failure paths, and window lifecycle; 72-file
  package inventory, no absolute development path, zero errors. Inventory
  SHA-256: `fccb60ec28f8de692b9a76ec843fa3ffe8da9878eb7c40fbe8d491ecf19de08c`.
  Full machine output was generated under ignored `tmp/epic9-release/` and its
  summarized proof is retained in the S741 verification record.
- Export baselines, candidate bytes, dependencies, and lockfiles were not
  changed. No physical print/fit claim is made.

## Remaining work

Codex performs the final actual-diff/evidence review and opens the S741 PR.
Only after merge does Slice 742 verify the main-branch deployment and live
catalog, update UIQ-05 to Done through the validated Control Center command
layer, reconcile project context, and close the durable goal.
