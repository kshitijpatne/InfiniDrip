# UIQ-GATE — post-EPIC-17 integration readiness admission

Status: admitted by the maintainer's 2026-10-11 instruction to proceed after
EPIC-17 merged. This packet authorizes only the UIQ integration-readiness gate
and durable reconciliation of already accepted isolated candidates. It does
not authorize wiring a candidate into the live application or changing any
product behavior.

## Verified start and ownership

- Start: 2026-10-11 10:22:54 America/New_York / 14:22:54 UTC.
- Clean worktree branch: `codex/uiq-gate-s733`.
- Starting commit: `origin/main` `89e52024b3599d3c1977a2a73aec60476cdc5a74`
  (`Slice 732: close EPIC-17 after production verification (#19)`).
- EPIC-17 PR #17 and CI prerequisite PR #18 are merged; PR #19 records final
  closeout. Main's production workflow `38141301239` passed tests, build,
  artifact checks, deployment and the production browser path. `PROJECT-STATE.md`
  and the canonical board remain the current-status authorities.
- The previous coordinator checkout is intentionally left untouched; it has
  extensive unrelated dirty/untracked files. Candidate source and evidence
  were copied only after matching their recorded hashes (9 UIQ-02/05, 31
  UIQ-03/04, and 11 UIQ-07 source/evidence identities).
- Codex owns the gate, shared-file ownership, future integration, corrections,
  tests and merge review. No safe independent implementation task exists in
  this governance/reconciliation slice; no CLI contributor was dispatched.

## Exact S733 boundary

1. Reconcile the merged EPIC-17 state and latest main against the stale
   pre-merge UIQ handoffs.
2. Restore the previously accepted isolated UIQ-02/03/04/05/07 candidate code,
   tests and evidence into the current branch without changing their contents.
   They remain unmounted candidate modules, not application features.
3. Freeze the current host and ownership boundary below, update the durable
   index/state/sequence and replay candidate history to the canonical board
   only through its validated command layer.
4. Close UIQ-GATE only as an integration-readiness task. Leave every parent
   UIQ feature Backlog, `releaseId` null, and unshipped. No UIQ package is
   integrated in this slice.

## Frozen host/props/style ownership for the next package

- Browser host: `index.html` provides `#app`; `src/main.ts` owns startup and
  calls `mountApp(root, options)`.
- Application shell and dynamic host IDs: `src/ui/view.ts` emits
  `#infini-shell` and its stable task hosts; `src/ui/app.ts` owns runtime
  rendering, state and event wiring. The established stylesheet is
  `src/ui/studio.css`, imported from `src/ui/view.ts`.
- The accepted UIQ-02 component contract is the pure native-DOM API in
  `src/ui/enhancements/foundation/foundation.ts`; its styles remain scoped to
  `.uiq-foundation` and may not be promoted to `:root`, `body`, or the whole
  application shell by implication. No component owns app state or mutates
  draft, saved data, validation, geometry, catalog records or exports.
- Codex exclusively owns any future edits to `src/main.ts`, `src/ui/app.ts`,
  `src/ui/view.ts`, `src/ui/studio.css`, `src/platform/feature-flags.ts`, and
  their existing integration tests. Contributor-owned candidates may not edit
  those shared files. Each package will have its own exact host, props, flag,
  fallback and file list in a fresh admission before implementation.
- The current embedded flag resolver exposes deterministic defaults and a
  programmatic local override; it has no user-facing runtime flag console or
  persisted override. S733 adds no flag. A later UIQ package must explicitly
  scope its flag, default, compatible fallback and operational toggle limits;
  it must not promise a live kill switch that the current contract cannot
  provide.

## Candidate state and integration holds

The accepted candidate manifests remain immutable evidence of isolated
candidate work on their recorded older bases; they are not evidence of a
current-main integration. All listed source/evidence hashes were checked
before and after transfer. The source remains separate from live entry points.

- UIQ02-CANDIDATE and UIQ05-CANDIDATE: Done as isolated candidates; UIQ-02 and
  UIQ-05 parent cards remain Backlog.
- UIQ03-CANDIDATE, UIQ04-CANDIDATE and UIQ34-QA: Done as isolated candidates;
  their parent cards remain Backlog.
- UIQ07-CANDIDATE: Done as isolated candidate; UIQ-07 parent remains Backlog.
- UIQ-GATE: may close after the merged baseline, host/props/style ownership,
  candidate provenance, no-runtime-change boundary and durable board replay
  pass. Closing it does not ship a UIQ parent.
- Next separately admitted implementation after this gate: UIQ-02 native
  foundation, first revalidated against the current main base. UIQ-03/04/05/07
  stay serialized behind their dependencies and their own package admissions.

## Acceptance and non-goals

- Verify exact ancestry of `origin/main`, final EPIC-17 board state, absence of
  an active conflicting G04 owner, and clean branch start.
- Validate all copied immutable candidate manifest hashes and preserve their
  original dates/evidence; never rewrite old output proofs to imply a new-base
  test.
- Validate board operations against a cloned current board before applying
  them. Apply only additive candidate-child/evidence/comment updates and the
  UIQ-GATE status/evidence transition. Do not replace the board or alter parent
  release status, unrelated Epic history, dependencies, releases or dates.
- Keep the application entry, shared CSS, feature flag catalog, dependencies,
  persistence, geometry, validation, exports and baselines unchanged.
- Run the Control Center command tests and `git diff --check`. No full product
  suite is required for documentation/board-only behavior; if any app source,
  test configuration or dependency is changed, restore the full 100% coverage,
  build and rendered/output gates before accepting the slice.
- No new Epic, feature launch, deployment, paid service, login, account, cloud
  data, public flag service or physical-fit claim is part of S733.

## Timing and exit boundary

Record the final elapsed time separately for baseline inspection, candidate
hash reconciliation, documentation/board work, verification and any external
wait. At close, record the exact commit, canonical board revision, pass/fail
evidence and a single next action: separately admit UIQ-02 integration on the
then-current main. No future slice number is reserved by this packet.

## S733 closeout

S733 passed its acceptance gates and closed the readiness-only UIQ-GATE at
canonical board revision 4352. Evidence and exact verification results are in
`docs/release/UIQ-GATE-S733-EXIT.md` and
`docs/release/UIQ-GATE-S733-VERIFICATION.json`. Parent UIQ feature cards remain
Backlog/unshipped. The next action is a separately admitted UIQ-02 integration
packet on the then-current main; this admission does not authorize that work.
