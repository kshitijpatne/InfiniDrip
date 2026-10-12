# UIQ-08 — solid inspection-toolbar integration

Status: admitted by the maintainer's 2026-10-12 instruction, “proceed with
next goal,” after the isolated UIQ-08 candidate and Slice 758 closeout completed.
This admits only the evidence-backed solid, opaque toolbar grouping in the
existing inspection UI. It does not admit glass/translucency or broader UI work.

## Start, authority, base and ownership

- Goal start: 2026-10-12 17:05 UTC / 13:05 America/New_York.
- Starting `origin/main`: `b71a59336fa8d41a1663ef3bb7dd687b200288ba`.
- Starting canonical board revision: 4488. EPIC-17/G04, UIQ-GATE and UIQ-02
  are Done; `UIQ08-CANDIDATE` and Slice 758 are Done; parent UIQ-08 is Backlog.
- Highest assigned slice across fetched refs and local history: 758. No open PR
  or competing UI integrator/reservation found. Reserve Slice 759 for admission,
  integration, acceptance evidence, Codex review and PR; reserve Slice 760 for
  post-merge deployment/live verification, board closure and durable sync.
  Recheck branch histories and reservations before each commit.
- Isolated worktree: `C:\Users\kshit\.codex\worktrees\uiq-next\designApp`,
  branch `codex/uiq08-integration`, based directly on `origin/main`. Preserve
  the pre-existing dirty `F:\designApp` checkout and all other worktrees.
- Codex owns integration, review, corrections, gates, PR and merge. The feature
  flag, app render lifecycle and exact legacy fallback are a coupled unit; no
  safe disjoint contributor task was identified. Do not manufacture a CLI
  delegation.
- Usage at task start: ordinary primary usage allowed (26% used); weekly 36%
  used, no reset credits. Routine model remains Luna-max where selectable;
  recheck before full gates and at slice boundaries. No usage threshold alone
  pauses work.

## Frozen product contract

The accepted candidate under `src/ui/enhancements/inspection/` is the immutable
visual and behavior source. Its Codex review found that translucent glass adds
no value because the real toolbar is a normal-flow sibling above, not over, the
artwork. Integrate only its restrained solid native grouping. Use the existing
scoped candidate adapter and stylesheet; apply the stylesheet's opaque modifier
so its optional backdrop-filter branch cannot render. Do not edit the accepted
candidate component, CSS, test, standalone preview, verifier, or evidence.

In the real inspection view, add embedded feature flag `uiq_inspection_toolbar`
with public audience, default ON, `compatible-v1` fallback, local test override,
an explicit expiry and removal release. ON adds only the candidate presentation
classes and opaque modifier. OFF, unknown, or stale leaves the exact existing
inspection markup and appearance untouched. This embedded flag has no remote
or user-facing runtime switch: changing its code default and redeploying is the
rollback path, and the limitation must be explicit in UIQ-08 records.

Preserve the current toolbar's heading, accessible name, button IDs/order,
labels, zoom actions and 50%–250% bounds, Fit behavior, keyboard/pointer
activation, focus visibility, scroll, viewport/canvas dimensions, artwork/data
identity, and all inspection modes including paused/error output. This is
presentation-only; it cannot alter drafts, geometry, validity, history,
exports, or persistence.

## Exact file boundary

May change only:

- `src/platform/feature-flags.ts` and `src/platform/feature-flags.test.ts`;
- `src/ui/app.ts` and `src/ui/app.test.ts` for flag resolution, candidate
  stylesheet/adapter wiring and opaque-only class application;
- `src/ui/enhancements/inspection/inspection-toolbar.css` only if integration
  evidence proves the existing accepted opaque treatment needs a scoped
  correction; any such edit requires documenting why candidate immutability is
  not breached. Preferred path is no candidate file edits;
- `ops/control-center/app/board.test.mjs` only if a focused regression is
  needed for the UIQ-08 integration evidence/status contract;
- this packet and goal ledger, replayable validated board commands,
  `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `ARCHITECTURE.md`,
  `docs/PROJECT-DECISIONS.md`, `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`,
  `docs/release/` exit records, and verifier/reports/screenshots beneath new
  `docs/research/uiq08-integration/` evidence;
- canonical `ops/control-center/data/board.json` through the validated
  `ops/control-center/cli.mjs` command layer only.

Do not edit `src/ui/view.ts`, `src/ui/studio.css`, geometry/renderers, design or
draft state, exports, baselines, dependencies/lockfiles, auth/data/network
systems, global app shell, tutorial, or other UIQ packages. If exact flag-off
rendering, source identity, existing toolbar actions or output invariants cannot
be preserved within this boundary, stop and record the evidence instead of
broadening scope.

## Slice boundaries and exit gates

### Slice 759 — admission, integration and pre-merge acceptance

1. Register the validated work item, admission evidence, parent In Progress
   state and replayable commands at the current board revision; link this packet
   and ledger from the context index, project state and architecture.
2. Add the embedded flag and deterministic local override; connect the accepted
   adapter/style to the existing inspection toolbar, forcing the opaque
   treatment. ON is default for the accepted release; OFF/unknown/stale retains
   exact legacy behavior. No remote flag provider or UI toggle is added.
3. Test both flag paths across normal and paused inspection renders, existing
   controls and all app inspection modes. Recompute the accepted candidate and
   protected export identities before/after.
4. Require 100% statement, branch, function and line coverage for every changed
   production module, focused tests, strict type/build, Control Center and
   release/readiness checks, export byte-identity, and the settled full repo
   suite at 100% four-metric global coverage. Preserve diagnostic output for any
   failed gate and rerun the settled gate after the final source/test change.
5. Run the production build in a fresh browser at 320/360/390/480/768/1280/1440
   CSS px with the default-on flag; inspect keyboard/pointer zoom, min/max/Fit,
   focus, contrast, forced colors, reduced motion, paused output,
   viewport/artwork invariants, axe and zero egress/page/console errors. The
   actual app's OFF override is covered by DOM integration tests that compare
   exact toolbar markup to the pre-UIQ-08 `inspectionMarkup`; verify the
   candidate stylesheet is inert when those classes are absent. Capture
   machine results and screenshots.
6. Codex reviews the complete actual diff and rendered evidence, moves the
   contributor-owned card only to Review, then independently accepts it. Open a
   PR only after every gate passes; merge only the reviewed tree.

### Slice 760 — merged deployment, live check and durable closeout

1. Verify the automatic main workflow completes tests, production build,
   deterministic artifact validation and Pages deployment successfully.
2. In a fresh browser, verify stable and immutable deployment URLs at desktop
   and narrow widths, toolbar visibility/controls, no overflow/runtime errors,
   and no off-origin requests. The default flag is ON in the accepted build.
3. Attach hash-bound public evidence, close the integration child and UIQ-08
   parent Done through validated commands only after all evidence passes, then
   reconcile the goal ledger, project state, context index, architecture and
   sequence status. Confirm the shared checkout remains untouched.

Completion means both slices pass and the merged deployment is live and
verified. A candidate/PR alone is not completion. Do not move any export
baseline; preserve existing byte-identity checks and all prior UIQ candidate
evidence.

## Risks, holds and estimate

- Main risk is a visually changed but functionally unchanged zoom control being
  applied to only some render paths; exercise normal, error/paused and mode
  transitions, not just a static screenshot.
- The accepted CSS contains an optional glass branch. The opaque class is a
  required integration invariant and must be asserted in tests and rendered
  evidence; no glass-over-artwork repositioning is allowed.
- The embedded flag is not a live kill switch. A reported issue requires a
  reviewed code-default change and a new deployment; do not promise instant
  rollback.
- No product decisions block the bounded integration. No launch cost,
  third-party service, network access or account is needed.
- Conditional effort estimate: one focused implementation/review block plus
  the repository and deployment gates; CI/browser gate wall time may dominate.
  No target date is promised. Record implementation, focused verification,
  full gates, external waits and maintainer-decision time separately at each
  boundary.

## Current verified boundary

Admitted from `origin/main` `b71a5933` with board revision 4488, on isolated
branch `codex/uiq08-integration`. Slice 759 implementation and pre-merge gates
are complete and submitted for review at board revision 4496; Slice 760 remains
reserved for post-merge verification and closeout. The exact candidate adapter
and stylesheet hashes still match the accepted candidate. See
`docs/release/UIQ-08-INTEGRATION-S759-EXIT.md` and the machine evidence beside
the rendered browser report.
