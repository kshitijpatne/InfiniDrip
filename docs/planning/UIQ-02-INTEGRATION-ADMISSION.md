# UIQ-02 — guided-tour foundation integration admission

Status: admitted by the maintainer's 2026-10-11 instruction to integrate the
accepted UI candidates. This packet authorizes only the bounded native
foundation integration below; it does not authorize a global redesign or a
release train change.

## Verified start and ownership

- Start: 2026-10-11 11:30 America/New_York / 15:30 UTC.
- Branch: `codex/uiq02-integration` in the clean managed worktree.
- Starting commit: `origin/main` `7484fe4452f9d34a8760bf1f2eeda0ee05d20209`
  (`Slice 733: close post-EPIC-17 UIQ readiness gate`).
- Canonical board: revision 4352. UIQ-GATE is Done; UIQ02-CANDIDATE is Done
  as an isolated candidate; UIQ-02 remains Backlog/unshipped before this
  admission. EPIC-17 is merged and closed. No concurrent owner is admitted to
  the shared app files in this packet.
- Slice 734 is the next unused numbered slice after checking all available
  branch history. It is reserved only for this integration and its durable
  exit evidence.
- Codex owns all shared application, stylesheet, flag, test, board, review and
  merge files. No CLI contributor is assigned because the bounded integration
  changes shared app wiring and no independent low-risk implementation remains.

## Scope

Use the accepted native UIQ-02 candidate (`foundation.ts` and `foundation.css`)
on the existing guided-tour panel in all active tour steps. Use its status
primitive for the existing local-storage-unavailable warning. Keep the existing
tour text, action IDs, navigation, focus target, warning meaning and persisted
journey state unchanged. Use literal text through the accepted DOM constructors.

The CSS remains scoped to `.uiq-foundation`; it is not attached to `#app`,
`#infini-shell`, the inspector, or every existing panel/control. The only
production host is the existing `#tutorial-host` content emitted by
`tutorialMarkup`. The accepted component API and candidate source hashes are
unchanged; a small adapter may compose them with the existing tour DOM.

## Feature flag and fallback

- Key: `uiq_foundation`.
- Owner: Codex. Audience: public preview users; embedded/local rollout only.
- Embedded default: enabled. Expiry: 2027-01-11. Removal release: the next
  UIQ visual-foundation adoption/cleanup release, no later than that expiry.
- ON: apply the scoped foundation panel to active guided-tour steps and the
  foundation warning component to the existing storage warning.
- OFF: keep the exact current `tutorialMarkup` structure and legacy
  `.tutorial-panel` styling.
- Fallback: `compatible-v1`. The existing renderer and content are retained;
  no saved state or data migration is involved.
- The only existing override is a deterministic local/programmatic resolver
  input, exposed to the app mount as `uiqFoundationEnabled` for local/test
  verification. There is no user-facing or remotely operated flag control. A
  public rollback requires changing the embedded default and deploying that
  build; this is not an instant kill switch. No hosted flag service or
  persistence is added.

## Exact file boundary

May change:

- `src/platform/feature-flags.ts` and its tests.
- `src/ui/app.ts` and its focused integration tests.
- `src/ui/view.ts` only to import the already accepted scoped foundation CSS.
- `src/ui/enhancements/foundation/tutorial-foundation.ts` and its tests as the
  bounded adapter between accepted primitives and existing tour markup.
- `src/ui/enhancements/foundation/tutorial-foundation.css` as a single scoped
  cascade correction so the existing tour-button rule cannot suppress the
  candidate's 44px minimum target on this host.
- `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `ARCHITECTURE.md`,
  `docs/planning/UI-ENHANCEMENT-SEQUENCE.md`, this admission, the Slice 734
  exit/evidence, and validated Control Center records.

Do not change:

- The accepted `foundation.ts` / `foundation.css` candidate content, journey
  model/text/persistence, other screens/panels, application-wide/global CSS,
  drafting, geometry, validation, output/export/rendering, catalog/assets,
  dependencies/lockfiles, or export baselines.
- Any other UIQ parent package. Integrations stay serialized; UIQ-03/04/05/07
  remain backlog until separately admitted after this boundary.

## Acceptance gates

1. Candidate file hashes match the immutable accepted manifest before use.
2. Flag default, expiry, ON/OFF/fallback metadata and unknown/stale fail-safe
   tests pass; no remote request or persistent setting is added.
3. Integration tests prove enabled and disabled rendering, exact tour text and
   action IDs, focus restoration/keyboard behavior, and preservation of the
   local-storage warning's visible meaning and live-region semantics.
4. Render the actual app at desktop and 320 CSS px / 200%-equivalent width;
   verify no clipping/overflow, visible focus, 44px foundation controls,
   reduced-motion and forced-colors behavior, and the legacy OFF screenshot.
   Visually inspect evidence, not just browser assertions.
5. Verify local-only network behavior/no egress, production build/typecheck,
   packaged Electron rendering, and protected export byte identity.
6. Changed production modules have 100% statement, branch, function and line
   coverage. The settled integrated PR candidate passes full repository tests
   and 100% global coverage, plus required build and output/browser gates.
7. Codex reviews the actual complete diff and evidence. Only after all gates
   pass may the board parent move to review/done, the Slice 734 commit be
   pushed, and a PR be merged. Deployment is the existing main-only Pages
   workflow; verify its result and the same public URL before claiming release.

## Explicit non-goals and risks

- No full-site design system/token migration, blanket minimum-control sizing,
  global color change, or UIQ-03 guidance redesign.
- No user-facing/remote feature-flag console; the embedded flag cannot provide
  immediate per-user rollback. This limitation is accepted for this
  presentation-only surface and must be communicated in the release record.
- No changes to tutorial steps, persisted journey state, local data, app
  functionality or network behavior.
- Main risks: retaining exact tour copy and focus behavior while composing a
  new DOM subtree; CSS cascade interactions; keyboard and narrow-window layout;
  packaged Electron asset resolution. Each has a named rendered/test gate.

## Goal and boundary accounting

Goal: integrate UIQ-02 on current main without affecting protected product
behavior, verify both flag paths in rendered contexts, and preserve durable
handoff for the next separately admitted UIQ candidate.

Start time is recorded above. Slice 734 implementation, focused verification,
full-gate time, external-agent wait, and maintainer-decision time will be
recorded separately in `docs/release/UIQ-02-INTEGRATION-S734-EXIT.md`. No
additional slice number is reserved by this packet.
