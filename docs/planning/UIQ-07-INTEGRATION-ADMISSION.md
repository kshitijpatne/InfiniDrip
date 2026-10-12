# UIQ-07 — first-run welcome visual integration

Status: admitted by the maintainer's 2026-10-12 instruction, “proceed with
next goal,” after UIQ-06 completed through Slice 754. This is the next ordered
UIQ package. It admits only the reviewed native welcome visual on the existing
first-run tutorial welcome step. It does not admit authentication or a new
account-entry workflow.

## Start, authority and slice boundaries

- Started 2026-10-12 12:08 UTC / 08:08 America/New_York. Durable goal:
  `docs/planning/UIQ-07-INTEGRATION-GOAL.md`.
- Start commit: `origin/main` `5daa614fa9305be68ddfdd5c8e3f1c2f04a26351`.
- Clean isolated worktree: `C:\Users\kshit\.codex\worktrees\uiq07-integration\designApp`,
  branch `codex/uiq07-integration`. The dirty shared `F:\designApp` checkout
  and other worktrees are preserved.
- Canonical board starts at revision 4451. UIQ-GATE, UIQ-02, and UIQ-06 are
  Done; UIQ-07 is Backlog with the isolated candidate child already Done.
  No open PR or active UIQ integration owner was found. The candidate source
  and accepted proof are present on current main.
- The highest assigned main/available local-history slice is 754. Reserve
  Slice 755 for integration, complete candidate verification, review and PR;
  reserve Slice 756 for post-merge deployment/live verification, board closure
  and durable state reconciliation. Recheck all histories and reservations
  before each commit.
- Scope owner, integrator, reviewer and merge controller: Codex. The shared
  app host, existing tutorial lifecycle, feature-flag catalog and integration
  tests form one coupled unit; no safe disjoint implementation handoff is
  assigned. Preserve the reviewed component as immutable input.
- Goal-start usage: ordinary usage allowed; primary 0% used, weekly 32% used,
  no reset credits. Luna-max is the routine default where model choice is
  available. Recheck before the settled full gate and at each slice boundary.

## Evidence-led integration contract

The app already owns a first-run tutorial with an existing `Welcome` panel,
Start-the-tour and Skip-for-now actions, a persistent local tutorial state,
and an explicit statement that exported digital files do not establish sewn
fit or production readiness. The accepted UIQ-07 visual is a static native
DOM/CSS component. The safe integration is to present that visual only around
the existing tutorial welcome panel when the tutorial is unseen or on its
welcome step; the app's existing tutorial copy, actions, handlers, skip/replay
semantics and local state remain authoritative. Other tutorial steps and the
existing application-start/project-open flow do not change.

The application shell already has the page-level `InfiniDrip` H1. Preserve a
single H1 by rendering the candidate's wordmark as an H2 in the integrated
host while retaining its reviewed class, visible text, contrast fallback and
decorative treatment. Preserve the existing tutorial panel heading as its
current sibling-level H2. Keep the second physical-fit/production caveat
visible in the welcome panel, including when the existing UIQ-02 foundation
presentation is enabled.

The immutable candidate source and source/proof identities are recorded in
`docs/research/uiq07/CANDIDATE-EXIT.json`. Recompute those hashes before and
after integration. Do not revise the accepted component, candidate CSS, its
tests, standalone preview, or old candidate evidence in this package.

## Feature-flag and rollback contract

- Add embedded key `uiq_welcome` in the existing resolver. Public preview
  audience, default on for the accepted release, `compatible-v1` fallback,
  local `MountAppOptions` override for deterministic tests, expiry
  `2027-01-12`, with removal at UIQ-07 cleanup no later than expiry.
- Enabled: show the accepted native visual only during the existing first-run
  tutorial welcome state and retain the existing tutorial copy, actions,
  accessible behavior, physical-fit caveat and persistence rules.
- Disabled, unknown, or stale: render exactly the pre-UIQ-07 current welcome
  presentation and retain the existing `uiq_foundation` behavior. The flag is
  embedded/programmatic, not a user-facing or remote kill switch; public
  rollback requires a reviewed code-default change and redeployment.

## Non-goals and protected behavior

No login, authentication, account/profile, user allowlist, hosted service,
database, cloud sync, email, analytics, new route, new CTA, new onboarding
steps, new persistence, new dependencies, images/fonts, React/renderer,
global CSS, workspace/project startup changes, or provider/config/deployment
workflow changes. No changes to journey decisions, tutorial copy/caveat,
button IDs or actions, skip/replay semantics, draft/measurement state,
validation, geometry, source/revision identity, persistence, exports or output
baselines. Preserve the local-first/no-cost boundary and existing accessibility
and no-egress guarantees. UIQ-08 through UIQ-13 and BUG-UI-048 remain unadmitted
and untouched.

## Exact file boundary

May change only:

- `src/platform/feature-flags.ts` and its contract tests;
- `src/ui/app.ts` and `src/ui/app.test.ts` for the flag, bounded host
  composition and exact fallback;
- `src/ui/view.ts` for one import of the already accepted, root-scoped welcome
  candidate stylesheet;
- import of the already accepted `src/ui/enhancements/entry/welcome-panel.ts`
  and `.css` without changing either candidate file;
- bounded integration styles only if rendered evidence proves needed, scoped
  under the candidate root and existing tutorial host;
- `ops/control-center/app/board.test.mjs` for the UIQ-07 status/evidence
  lifecycle contract;
- this admission, `UIQ-07-INTEGRATION-GOAL.md`, replayable board commands,
  `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `ARCHITECTURE.md`,
  `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, Slice 755/756 release reports,
  and new `docs/research/uiq07-integration/` verification evidence;
- canonical board changes only through `ops/control-center/cli.mjs` and its
  validated command layer, using a freshly read expected revision per command.

If the candidate cannot be mounted without modifying its accepted bytes, if
the exact legacy fallback or page heading/caveat behavior cannot be preserved,
or if the visual does not materially improve the existing welcome experience,
stop and record the evidence rather than broadening scope.

## Acceptance gates

1. Candidate source and proof hashes match the immutable accepted manifest
   before and after integration; no prior UIQ proof or export baseline moves.
2. `uiq_welcome` metadata/default/local override/unknown/stale behavior is
   tested. Feature ON is limited to unseen/welcome tutorial state. OFF/unknown/
   stale is exact current markup and behavior, including the independent
   `uiq_foundation` contract.
3. DOM/app tests cover first-run welcome, existing start/skip actions, tutorial
   advancement, later steps, completed/skipped replay, clean and unavailable
   local storage, focus restoration, repeated render/mount cleanup, and one
   page H1. Keep the physical-fit/production caveat visible in all integrated
   welcome presentations.
4. Every changed production line reaches 100% statement/branch/function/line
   coverage. Focused tests pass before one settled full test/global-coverage
   gate at 100%; build/typecheck, Control Center, web-release/readiness,
   packaged Electron and export byte-identity checks pass. No baseline changes.
5. Exercise production-built output in a fresh browser profile at 1280/640/390/
   320 CSS px, keyboard/focus, screen-reader semantics, forced colors, reduced
   motion, zoom-equivalent reflow, legacy flag-off fallback, unavailable local
   storage and no-egress. Confirm no document/panel overflow, runtime errors or
   off-origin requests; retain machine evidence and screenshots.
6. Codex reviews the complete actual diff and evidence before opening/merging
   the PR. Slice 756 completes only after successful main deployment, stable
   and immutable URL health/live render verification, validated board closure,
   and current durable handoff. UIQ-07 becomes Done only with all such evidence.

## Decisions, risks and current next action

No product decision blocks this bounded integration: “welcome” means the
existing local tutorial welcome, not login or a new start route. Main's shell
already owns an H1; the integration preserves that hierarchy. Slice 755
pressure-tested the candidate's clipped decorative geometry and minimum-height
styling in the actual integrated build: 320px copy bounds, focus visibility,
forced colors and reduced motion pass. The code flag cannot remotely roll back
a live deployment. Slice 755 pre-merge acceptance completed on 2026-10-12; see
`docs/release/UIQ-07-INTEGRATION-S755-EXIT.md` and
`docs/research/uiq07-integration/evidence/S755-verification.json`. Slice 756
then verified PR #36's successful main deployment and fresh stable/immutable
public browser behavior, attached hash-bound evidence, and closed UIQ-07 Done
through the validated board command layer. See
`docs/release/UIQ-07-INTEGRATION-S756-CLOSEOUT.md` and
`docs/research/uiq07-integration/evidence/S756-public-verification.json`.
UIQ-08+ and BUG-UI-048 remain unadmitted. Do not broaden this admission.
