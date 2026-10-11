# UIQ-03 — actionable guidance integration admission

Status: admitted by the maintainer's instruction to proceed with integration
of the completed UIQ candidates after UIQ-02 shipped.

## Verified start and ownership

- Goal started: 2026-10-11 18:10:25 UTC / 14:10:25 America/New_York.
- Clean worktree: `codex/uiq03-integration`.
- Starting ref: `origin/main` at `f25ff25779c9223284106cf745c94d0ebc5cb885`
  (UIQ-02 closeout merge, PR #22); clean ancestry verified.
- Canonical board revision 4370: UIQ-02 Done/deployed; UIQ-03 Backlog;
  UIQ-04/05/07 Backlog. EPIC-17 and UIQ-GATE are closed. No conflicting
  owner exists for shared app files. Existing dirty S425 material in the old
  UIQ-02 worktree and the primary `F:\designApp` checkout are untouched.
- Slice 736 is the next unique slice after checking reachable branch history;
  it is reserved for implementation and pre-merge evidence only. Slice 737
  is reserved for post-merge deployment/board closeout only.
- Codex owns the shared app, flag, tests, docs, board and integration. No
  independent low-risk task remains after the accepted candidate was built;
  no external contributor is dispatched.

## Scope and placement

Integrate the immutable accepted UIQ-03 module at
`src/ui/enhancements/guidance/guidance-panel.ts` and its scoped CSS into the
existing **Design readiness** disclosure (`#readiness-host`). The old
readiness checklist remains the flag-off fallback. Keep the existing journey
bar, stage navigation, Next/Back, blockers, tutorial, Guidance & corrections,
measurement flow, local persistence and exports intact. The panel is a
read-only presentation of existing caller-owned state; it never computes or
changes readiness, validation, fit, stage, draft, or export decisions.

Snapshot mapping uses the existing `readiness()`, `journey.step`,
`stageBlocker()`, and `currentNotes`. A fit intent is shown only after the
existing Style step has been explicitly reviewed (`styleReviewed`); otherwise
pass `null` and show the candidate's explicit no-preference state. Digital
validity comes from `designValid()`; an unresolved saved-semantic evaluation is
`unknown`, never an inferred pass. Details describe only those existing
results. Notes preserve literal text/severity; field actions route through the
existing correction/focus path and never edit a design value. When a legacy
recipe input key (for example `chest`) is routed into guided capture, resolve it
to that recipe's semantic capture-field ID before focusing the raw capture
input; do not make a correction button silently focus the wrong route.

Mount once on the stable readiness host, update the same controller with each
journey render, and dispose on app unmount. Preserve the component's keyed DOM,
focus and disclosure behavior. New scoped CSS is imported from the existing UI
view module; no shell/global selector is added.

## Feature flag and fallback

- Key: `uiq_guidance`; owner: Codex; audience: public preview users.
- Rollout: embedded/local; default enabled; expiry `2027-01-11`; cleanup at
  the UIQ clarity adoption/cleanup release, no later than expiry.
- ON: show the candidate guidance/journey/fit-versus-validity presentation
  inside the existing readiness disclosure.
- OFF, unknown or stale: render the exact existing `checklistMarkup` in that
  host. Existing journey navigation, warnings, corrections and decisions are
  identical in either mode.
- Add only the deterministic `MountAppOptions.uiqGuidanceEnabled` local/test
  override. No user-facing or remote kill switch, storage, migration, provider,
  network or hosted service is added. Public rollback requires changing the
  embedded default and deploying a reviewed build.

## Exact file boundary

May change:

- `src/platform/feature-flags.ts` and `src/platform/feature-flags.test.ts`.
- `src/ui/app.ts` and focused `src/ui/app.test.ts` integration tests.
- `ops/control-center/app/board.test.mjs` only to reconcile its canonical
  status expectation with the already-authorized UIQ-03 board admission.
- `src/ui/view.ts` only for importing the accepted scoped guidance CSS.
- `docs/planning/UIQ-03-INTEGRATION-ADMISSION.md`,
  `docs/planning/UIQ-03-GOAL.md`, `docs/planning/UIQ-03-BOARD-COMMANDS/`,
  `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, `CONTEXT-INDEX.md`,
  `PROJECT-STATE.md`, `ARCHITECTURE.md`, and the Slice 736/737 release/evidence
  records.
- Canonical board only through `ops/control-center/cli.mjs` and the validated
  command layer; retain its replayable command JSON in the admission folder.

Do not modify the three accepted candidate source/test/CSS files; journey or
validation logic; `journey.ts`; navigation copy/state; current warnings,
ignored-guidance semantics, measurement capture, persistence, patterns,
geometry, rendering, exports, baselines, catalog/assets, dependencies,
lockfiles, global CSS, release workflow, UIQ-04/05/07, EPIC-17 history, or
other worktrees. No physical-fit claim or new feature beyond this presentation.

## Acceptance gates

1. Verify the accepted candidate source/test/CSS against the immutable hashes
   in `docs/research/uiq-clarity/CANDIDATE-EXIT.json`; keep those files byte-
   identical.
2. Test flag metadata, default, local override, stale/unknown fail-safe, and
   the exact legacy readiness fallback.
3. Integration tests prove flag ON/OFF, notes/actions, valid/invalid/unknown,
   no reviewed fit preference versus explicit reviewed style, blocked/current/
   completed states, empty notes, stale semantic evaluation, literal text,
   focus/routing, repeated updates, and no mutations/callbacks from render.
   Preserve existing journey and guidance behavior.
4. Changed production code: 100% statements, branches, functions and lines.
   At the settled PR boundary run full repository tests/global 100% coverage,
   build/typecheck, operational checks, export byte-identity regression and
   unchanged baselines.
5. Render actual app at desktop, 320 CSS px and 200%-equivalent reflow; inspect
   the expanded readiness disclosure, existing journey/blocker beside it,
   keyboard actions/focus, target size/contrast, forced colors, reduced motion,
   hostile long text and zero external requests. Verify the legacy fallback
   screenshot and packaged Electron behavior if supported by the existing
   release gate.
6. Compare protected candidate/app/output identities and review the actual
   complete diff. No source change after a passing full gate without rerunning
   affected tests and the settled full gate.
7. After all pre-merge gates pass, Slice 736 may be committed and opened as a
   PR. Codex alone reviews/merges. Slice 737 records the successful main-only
   Pages workflow, same public URL, canonical-board Done evidence and final
   full-gate status. UIQ-04/05/07 remain Backlog.

## Risks and explicit non-goals

The new panel overlaps some information already visible in the journey bar;
placing it only inside the existing collapsed readiness disclosure limits
duplication and preserves the familiar top-level navigation. When expanded,
the blocker may be repeated there; rendered/accessibility review must ensure
this does not create confusing or repeated announcements. The underlying
readiness checklist and live stage bar remain authoritative. Feature flags are
build defaults, not instant public kill switches. No app-wide restyle,
workflow redesign, saved preference, navigation change, validity threshold,
physical validation, or hosted flag platform is admitted.

## Boundary accounting

At goal start, all acceptance gates are pending. Slice 736 covers integration
and pre-merge evidence; Slice 737 covers merge/deployment/board closeout.
Record implementation, focused verification, full-gate, rendered review,
external wait, and maintainer decision time separately at each boundary; mark
unmeasured values honestly. On primary usage exhaustion, stop at the last
verified boundary and preserve this packet/goal/board state for automatic
resume after reset. Do not stop only on a percentage or weekly meter.
