# UIQ-05 artwork catalog presentation — integration admission

Status: admitted by the maintainer's 2026-10-11 instruction, “proceed with
next goal,” after UIQ-04 was merged, deployed, verified and closed. This is a
serial integration of the already accepted UIQ-05 candidate on current main;
it does not authorize artwork-library expansion or another UIQ package.

## Verified start, goal and slice reservation

- Start ref: `origin/main` at `f4cbfc45ca3bf2237b226a159ebe78e738ea3016`.
- Clean task worktree: `C:\Users\kshit\.codex\worktrees\uiq04-integration\designApp`;
  branch `codex/uiq05-integration`, created from the verified `origin/main`.
- The checked-in root `F:\designApp` is on an older branch and is preserved.
- Reachable numbered slice subjects and current repository histories end at
  Slice 740. No active current-main UIQ implementation owner or newer slice
  reservation was found. Recheck all histories/reservations before commit.
- Slice 741: admission, bounded app integration, tests, rendered evidence,
  settled full gates and reviewed PR.
- Slice 742: post-merge deployment/live verification, board closure and durable
  release/context reconciliation. No code change is planned in Slice 742.
- Durable goal: `docs/planning/UIQ-05-GOAL.md` and the active Codex goal.
- Codex owns shared UI wiring, feature flag, tests, review/corrections, gates,
  PR and merge. No safe disjoint coding handoff remains: the candidate's
  selection API must be reconciled with the app's existing stage/apply
  semantics and shared Surface render lifecycle. No CLI contributor is
  dispatched.
- Codex usage at goal start: ordinary usage allowed; primary 2% used, weekly
  24% used, no reset credits. Recheck at slice gates/boundaries; Luna-max is
  the routine default where model choice is available.

## Evidence-led scope and fit

The existing app already has local previews, search, category/family/piece-role
and print-use filters, no-match messaging, provenance/rights, resolution and
suitability caveats. It also has two explicit operations missing from the
isolated candidate: stage a new placement and attach to an existing placement.
Therefore UIQ-05 is a presentation redesign of this one existing library, not
a second catalog or additive duplicate. Integrate the accepted panel only if
its source identity remains exact and the app adapter preserves both existing
operations as separate, explicit actions. Preserve the current library as the
exact OFF/unknown/stale fallback. Never turn selection, filter changes,
keyboard navigation or browsing into an implicit garment edit.

The original component contract and immutable proof are in
`docs/planning/UIQ-PARALLEL-ADMISSION.md` and
`docs/research/uiq-parallel/CANDIDATE-EXIT.json`. The candidate is imported as
an existing local module; its TypeScript component is not mounted. The shipped
app already implements the same catalog tasks and owns additional per-card
actions and independent filter/assessment controls; mounting the prototype
would duplicate logic and collapse those distinctions. Adopt its immutable,
scoped CSS and visual contract on the existing app markup instead. The
candidate component, CSS, tests, preview and accepted hashes are read-only.
The app keeps its current catalog/query state and event handlers.

## Feature contract

- Embedded key: `uiq_artwork`; default enabled for the preview; local-only
  `MountAppOptions` override for deterministic tests; expiry/removal review by
  2027-01-12.
- Enabled: restyle only the current catalog browsing/presentation surface
  with the accepted scoped visual treatment. Preserve the app's separate
  curated-use filter and assessment-use selector, current selected target,
  search/filter state and existing per-card “stage new” and “attach to
  selected” actions. Browsing and filtering remain non-mutating; only the
  existing explicit action buttons may stage or attach artwork.
- Disabled, unknown or stale: render the exact pre-UIQ-05 library shell and
  preserve its existing behavior. Flag is a code default, not a live switch;
  public rollback requires reviewed code change and redeployment.
- The existing catalog/search/assessment math and asset schema remain the
  source of truth. Bundled images only; no remote fetch, upload, store, new
  assets, licensing interpretation, rights claims, external service or paid
  dependency.

## Protected behavior and non-goals

Preserve every current search/filter/intersection/reset/no-match behavior,
rights and suitability qualifications, source text only (never fetch
provenance URLs), local bundled image handling, current target invalidation
when style changes, selected-asset identity, stage/apply semantics and action
status messages. Keep keyboard/focus and accessible names, dynamic result
counts, 44px targets, narrow/zoom/forced-colors/reduced-motion operation,
safe local URL constraints, and no-egress behavior. No changes to source
artwork records, catalog/search/assessment math, surface placement schema,
file import, persistence, revision, rendering geometry, exports, baselines,
other UIQ features, dependencies, lockfiles, global CSS or deployment
workflow. Do not claim physical-print verification or expand the 12-record
catalog.

## Exact file boundary

May change:

- `src/platform/feature-flags.ts`, `src/platform/feature-flags.test.ts`;
- `src/ui/app.ts`, `src/ui/app.test.ts`, `src/ui/view.ts`, and the scoped
  application style import/stylesheet needed to host the accepted component;
- `ops/control-center/app/board.test.mjs` only for the UIQ-05 lifecycle
  contract;
- this admission, `docs/planning/UIQ-05-GOAL.md`, replayable UIQ-05 board
  commands, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `ARCHITECTURE.md`,
  `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, the Slice 741/742 release
  reports, and scoped `docs/research/uiq05/` evidence.
- canonical board mutations only through `ops/control-center/cli.mjs` and its
  validated command layer, with a freshly read revision for every mutation.

Do not edit the accepted candidate component/CSS/tests/previews or prior
UIQ-02/03/04 code. Do not modify app state or functionality outside the
Surface artwork library and its action adapter. If exact flag-off markup,
placement workflows, protected identities or global coverage cannot be
maintained, stop at the verified boundary and re-scope instead of weakening
acceptance.

## Acceptance gates

1. Recompute the accepted candidate file hashes from immutable exit evidence;
   preserve every candidate byte. Verify integration consumes only its scoped
   CSS/visual contract and keeps app-owned behavior.
2. Test flag metadata/default/override/unknown/stale and exact legacy fallback.
3. Test enabled markup and app-owned event handlers; catalog options,
   empty/no-match/reset; independent curated-use filter and assessment-use
   selector; stage/attach actions; no-target and stale-target behavior; style
   change; preserved provenance, warnings and local-only images; no runtime
   network requests.
4. Changed production code meets 100% statement, branch, function and line
   coverage. Focused tests first, then one settled full repo test/100% global
   coverage gate, build/typecheck and Control Center/web gates; retain export
   byte-identity regression evidence. No baseline changes.
5. Render and exercise actual built output: default/flag-off, mouse and
   keyboard selection/actions, empty/no-match, long hostile-looking text,
   missing/local image, no-egress, 1280/640/320 CSS px, zoom, focus, forced
   colors and reduced motion. Confirm both stage and attach outcomes against
   the actual Surface UI, not tests alone.
6. Codex reviews the entire actual diff and all evidence before PR/merge.
   Slice 742 closes only after merged deployment succeeds, stable URL is
   healthy and the deployed UI is verified. Board UIQ-05 becomes Done only
   after evidence-gated closeout.

## Decisions/blockers and next action

No maintainer decision is currently blocking. The code-level audit found that
the standalone candidate's print-use selector couples filtering and
assessment, and its one selection callback cannot preserve the app's two
per-card operations. Those behaviors are intentionally not adopted. Slice
741 applies the accepted visual design through scoped CSS and existing app
markup, preserving those product-specific distinctions; if the rendered
design does not provide a material usability improvement, stop and record the
evidence without shipping it.
