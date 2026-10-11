# UIQ-04 — material clarity integration admission

Status: admitted by the maintainer's 2026-10-11 instruction, “proceed with next
goal,” after UIQ-03 was merged, deployed, and closed. This authorizes only the
bounded integration below; it does not admit another UIQ package or a broader
redesign.

## Verified start and ownership

- Goal start: 2026-10-11 22:13:53 UTC / 18:13:53 America/New_York.
- Starting ref: `origin/main` / `9bdea4bc46d6a8fa282a4679dbb87ab544998ede`.
- Clean worktree: `codex/uiq04-integration` at the same commit; ancestry and
  clean status verified before edits. The stale, dirty `F:\designApp` checkout
  and prior candidate/review worktrees are preserved.
- Canonical board revision 4383: UIQ-02, UIQ-03, UIQ-GATE and the UIQ-04
  isolated candidate are Done; the UIQ-04 parent is Backlog/unshipped. No open
  GitHub PR or active main-based UIQ integration owner was found. Reachable
  history and inspected branch reservations contain no slice above 738.
- Slice 739 is reserved for the admission, integration, pre-merge evidence,
  complete review and PR. Slice 740 is reserved only for post-merge deployment,
  public verification and board closeout. Do not allocate another number
  without rechecking all active histories/reservations.
- Codex owns shared app wiring, feature-flag contract, tests, documentation,
  board commands, actual-diff review, corrections, gates, PR and merge. No safe
  disjoint implementation task remains; no external contributor is dispatched.

## Scope and placement

Integrate the accepted, immutable native module in
`src/ui/enhancements/material/material-panel.ts` and its scoped CSS into a new
collapsed **Material and screen appearance guidance** disclosure in the
existing design-controls inspector, immediately after the existing material
and appearance controls. The disclosure is shown only in the existing Fit
journey step where the underlying material and appearance controls are
available; it is hidden at steps that intentionally conceal those controls.
This prevents a review action from targeting an invisible control without
advancing or otherwise changing the user's journey. The accepted component is additive/read-only; current
material choices, color/texture/shine controls, all seven recipe flows,
journey navigation and validation remain available and unchanged.

The component mounts only when the embedded `uiq_material` flag resolves
enabled. With the flag off, unknown, or stale, the shell must be byte-for-byte
the existing shell markup and all existing controls retain their prior
behavior. The disclosure remains collapsed by default when enabled.

Snapshot mapping is caller-owned and uses existing state only:

- `revisionLabel`: current design revision label; it identifies the displayed
  snapshot but does not imply versioned output approval.
- `fabric`: the exact selected `StretchFabric` already used by `stretchFabric`,
  or `null` if the value cannot be resolved. Never infer custom properties.
- `easeGuidance`: the existing `fabricEaseNote(...)` result already rendered in
  current `guidanceNotes`, or `null` when unavailable; do not recompute it in
  the component or create a new recommendation.
- `compatibility`: always `unknown` with explicit text that the app has no
  independent fabric/material compatibility assessment. Do not repurpose
  draft validity, fit/style similarity, warnings, or recipe identity as a
  material compatibility verdict.
- `color` and `appearance`: current existing `fabric` color and `appearance`
  values only. They are display state; never mutate or normalize saved state.

`Review fabric` focuses the existing visible material-choice control without
changing its selection. `Review appearance` opens the existing appearance
editor only if closed, then focuses its existing first relevant control; it
must not toggle an already-open editor closed. Neither action may alter draft,
appearance, persistence, revision, journey, or output. Preserve focus for all
other controls during snapshot updates.

## Feature flag and fallback

- Key: `uiq_material`; owner: Codex; audience: public preview users.
- Rollout: embedded/local; default enabled; expiry `2027-01-11`; removal at the
  UIQ clarity adoption/cleanup release, no later than expiry.
- ON: mount the accepted read-only panel in the collapsed inspector disclosure.
- OFF, unknown, or stale: do not add the disclosure markup; render the exact
  pre-UIQ-04 app shell and existing material/appearance controls.
- Add only deterministic `MountAppOptions.uiqMaterialEnabled` for local tests.
  No remote/user-facing toggle, storage, migration, network, provider, or
  hosted service. Public rollback requires a reviewed embedded-default change
  and deployment.

## Exact file boundary

May change:

- `src/platform/feature-flags.ts`, `src/platform/feature-flags.test.ts`;
- `src/ui/app.ts`, `src/ui/app.test.ts`, and `src/ui/view.ts` for the scoped
  CSS import;
- `ops/control-center/app/board.test.mjs` only to update its current UIQ
  lifecycle expectation and protect parent/child distinctions;
- `docs/planning/UIQ-04-INTEGRATION-ADMISSION.md`,
  `docs/planning/UIQ-04-GOAL.md`, `docs/planning/UIQ-04-BOARD-COMMANDS/`,
  `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, `CONTEXT-INDEX.md`,
  `PROJECT-STATE.md`, `ARCHITECTURE.md`,
  `docs/release/UIQ-04-INTEGRATION-S739-EXIT.md`,
  `docs/release/UIQ-04-INTEGRATION-S740-CLOSEOUT.md`, and the scoped evidence
  under `docs/research/uiq04-integration/`;
- canonical board only through `ops/control-center/cli.mjs` and its validated
  command layer; retain replayable command JSON under the admission folder.

Do not modify accepted UIQ-04 candidate source, CSS, tests, preview, or hashes;
UIQ-02/03 implementation; draft/material math; `fabricEaseNote` behavior;
appearance parsing/rendering; validation, style matching, journey, persistence,
SaveFile, project workflow, patterns, geometry, exports, baselines, global CSS,
dependencies, lockfiles, release workflows, artwork, other UIQ packages,
EPIC-17 history, or other worktrees. No new compatibility logic, physical-fit
claim, actual fabric simulation, saved preference, or global redesign.

## Acceptance gates

1. Recompute accepted material source/CSS/test hashes from
   `docs/research/uiq-clarity/CANDIDATE-EXIT.json`; retain exact identity.
2. Prove `uiq_material` metadata/default/override/stale/unknown behavior and
   exact flag-off shell compatibility; test the embedded flag's documented
   expiry and fallback.
3. Test enabled/disabled mounting, exact snapshot mapping, unresolved material,
   unknown compatibility honesty, guidance reuse, immutable saved state,
   fit-step-only disclosure visibility, stable collapsed default, explicit
   focus routing, no-op updates and
   existing appearance-open behavior. Existing app/journey/material/appearance
   control tests must remain valid.
4. Require 100% statements, branches, functions, and lines for all changed
   production code. At the settled PR candidate run the full repository suite
   and 100% global coverage, TypeScript and standalone preview checks,
   production build, operational/Control Center checks, export-byte-identity
   tests, and unchanged protected output identities/baselines.
5. Inspect the actual mounted app at desktop, 320 CSS px, 200%-equivalent
   reflow, keyboard/focus and touch-target sizes, contrast, forced colors,
   reduced motion and long/hostile text. Exercise expanded/collapsed states,
   invalid/missing caller snapshots, both Review actions and exact flag-off
   screenshot. Confirm zero off-origin requests and no page errors.
6. Run the existing packaged Electron release gate as supported by the settled
   Epic workflow; inspect the actual complete diff and immutable candidate
   hashes. Any source/test/config/dependency change after the settled full gate
   reruns focused checks and the full gate.
7. After all pre-merge checks, submit Slice 739 for PR review; Codex reviews,
   corrects, and merges only after all gates pass. Slice 740 verifies merged
   ancestry, main Actions deployment, the same preview URL, visible behavior,
   no errors/off-origin requests, and closes UIQ-04 Done with verified board
   evidence. UIQ-05/07 remain Backlog and unadmitted.

## Risks and boundaries

The panel repeats some selected-material and appearance facts already visible
in the inspector. The collapsed-by-default placement limits clutter; rendered
review must judge whether the extra context is helpful and not misleading.
Compatibility stays explicitly unknown because no such engine exists. Its
illustrative texture/shine cue is not physical rendering. The flag is a build
default, not a live kill switch. No upstream decision, recipe, feature, or
launch/physical gate changes.

## Boundary accounting

At goal start, all implementation and release gates are pending. Slice 739
covers admission, implementation and pre-merge verification; Slice 740 covers
only post-merge release and closeout. Record implementation, focused checks,
full gates, rendered review, merge/deployment, external waits, and maintainer
decision time separately; mark anything not instrumented as unmeasured. Pause
only at a verified boundary if primary usage is actually exhausted. Do not
pause merely because of a percentage or weekly meter.
