# UIQ-08 — isolated inspection-toolbar visual candidate

Authority: the maintainer said “proceed with next goal” on 2026-10-12 after
UIQ-07 completed. This admits only the next ordered UIQ package's isolated,
unshipped candidate. It does not admit production app wiring or deployment.

Goal start: 2026-10-12 14:21 UTC / 10:21 America/New_York. The durable live
ledger is `docs/planning/UIQ-08-GOAL.md`.

## Verified base and prerequisites

- Starting commit and `origin/main`: `5c4fa650ea9fc5c6bdb1c70c5c458b7e61081210`.
- Starting board revision: 4464. UIQ-02 and UIQ-GATE are Done. UIQ-07 is Done
  and deployed; UIQ-08 is Backlog. EPIC-17/G04 is closed on main.
- Isolated Codex worktree: `C:\Users\kshit\.codex\worktrees\uiq-next\designApp`,
  branch `codex/uiq08-candidate`. The shared `F:\designApp` checkout is dirty
  and preserved. Historical/stale worktrees are not treated as active owners.
- Latest assigned slice found across reachable refs and active worktree
  histories: 756; no higher active reservation was found. Slice 757 is the
  standalone candidate, its review evidence and board closeout; no app release.

## Target and design contract

Target only the existing inspection header in `src/ui/view.ts`'s
`inspectionMarkup`: `#inspection-toolbar`, its heading, zoom-out/Fit/zoom-in
buttons (`data-inspection-zoom`), and live zoom output. Preserve the existing
normal-flow position above `#inspection-viewport`; do not turn it into an
overlay, make it sticky, resize/transform the canvas, or sample the page/canvas.

Produce a restrained native CSS translucent surface with clearly solid,
high-contrast controls and an opaque default when translucency or backdrop
filtering is unsupported or forced off. The toolbar and controls remain
legible over both the real dark inspection-frame context and deterministic
locally generated dense-artwork test backdrops. Keep all visual selectors
scoped to a candidate root/class. Use no frameworks, renderer, external assets,
URL-valued CSS, new dependency, network request, or production entry import.

The reusable candidate adapter may add scoped presentation classes to the
existing toolbar/buttons and remove only redundant inline visual declarations
that the candidate stylesheet replaces. It must not rewrite text, attributes,
button order, IDs, data actions, accessibility names, keyboard behavior,
listeners, viewport/content dimensions, zoom state, scroll, or artwork/data.
The standalone preview must label itself as an isolated candidate and exercise
the existing 50%–250% zoom bounds and Fit behavior without claiming to be a
production deployment.

## Boundaries, ownership and non-goals

Codex owns admission, candidate implementation, this packet and goal, canonical
board/context changes, independent review, corrections, final evidence and
merge decision. Claude Code was the planned contributor, but `claude auth
status` on 2026-10-12 reported `loggedIn: false`; therefore no CLI delegation
was started and no alternative model/owner was substituted. This is a bounded
candidate and Codex can own it end-to-end without changing the approved
contributor choice or blocking on account setup.

Codex may add only:

- `src/ui/enhancements/inspection/inspection-toolbar.ts`
- `src/ui/enhancements/inspection/inspection-toolbar.css`
- `src/ui/enhancements/inspection/inspection-toolbar.test.ts`
- `ops/ui-candidates/inspection-toolbar.html`
- `ops/ui-candidates/inspection-toolbar-preview.ts`
- `ops/ui-candidates/inspection-toolbar-verify.mjs`
- candidate-specific files beneath `docs/research/uiq08/`

Codex must not modify `src/ui/app.ts`, `src/ui/view.ts`, `src/ui/studio.css`,
the app mount/entry, feature-flag registry, package/lock/config, board, shared
context, release workflows, or any protected export/baseline. No login, data,
persistence, app behavior, user preference, feature flag, production wiring,
public release or physical-fit claim is included. Keep parent UIQ-08 Backlog and
unshipped; the child card tracks candidate progress only. Any app integration
requires a later explicit admission, fresh base review and a separate
rollback/flag/file-boundary decision.

## Slice 757 acceptance and exit gates

Slice 757 is one isolated candidate slice. It is accepted only when all of the
following are independently confirmed by Codex against the actual branch and
rendered output:

1. Focused production-component tests pass with 100% statement, branch,
   function and line coverage. Strict preview typecheck and production build
   pass; the candidate is not imported by the shipped app bundle.
2. Browser evidence covers 320/360/390/480/768/1280/1440 CSS-pixel widths,
   zoom-equivalent reflow, the exact existing controls/semantics, zoom-in/out
   boundaries, Fit reset, keyboard activation, pointer activation, and data/
   artwork identity. Test the opaque fallback, supported translucency,
   forced-colors/high-contrast, reduced-motion and dense/variable local
   backdrops. No horizontal overflow, lost focus, obscured control, or unreadable
   label is accepted.
3. Contrast meets WCAG AA text and non-text thresholds in the opaque default,
   translucent supported mode and forced-colors mode. Browser console/page
   errors and external requests are zero. CSS contains no remote fetch, image,
   font or URL dependency.
4. The actual candidate and same-surface legacy control are visually compared;
   the effect must add clear control grouping without obscuring or competing
   with pattern/artwork. If glass adds no meaningful value in the real layout,
   keep a restrained solid native treatment and document the no-go on
   translucency rather than forcing blur.
5. Protect the parent app shell, entry flow, all current output/export
   identities and accepted UIQ candidate evidence. Record before/after hashes
   for the protected-file set; do not move any baseline.
6. Reviewer evidence and verified exit report are attached to the child card.
   The child moves through Review to Done only after independent Codex
   acceptance. Parent UIQ-08 remains Backlog/unshipped. A candidate PR may be
   merged only if the PR diff remains unreferenced by the production app and
   its deployment bundle identity is unchanged.

## Risks and decision gates

- Dense or high-contrast artwork behind translucency could lower button/label
  contrast; solid controls and an opaque fallback are mandatory, not optional
  polish.
- `backdrop-filter` and `color-mix` vary across browser/Electron versions; the
  base style must be fully readable without either property.
- The real toolbar is a normal-flow sibling above the artwork viewport, not an
  overlay. Do not reposition it merely to make blur appear stronger. If a
  transparent treatment cannot show measurable UX value in this layout, reject
  translucency and retain only native surface hierarchy.
- Shared UI files are protected during this candidate. A future integration
  must separately test keyboard, pointer, zoom, scroll and narrow-layout
  behavior on the real app.

## Effort and elapsed-time ledger

Start: 2026-10-12 14:21 UTC. Slice boundaries: one candidate slice, Slice 757.
Codex owns implementation and review because the planned Claude CLI is not
authenticated. Focused verification, browser pressure testing, Codex review/
corrections and maintainer decisions will be recorded separately at closeout.
Conditional planning estimate: 2–4 focused engineering/QA hours; not a delivery
promise. No recurring or one-time service cost is introduced.

## Current verified boundary

Slice 757 candidate implementation and rendered review are complete in the
isolated worktree. `UIQ08-CANDIDATE` is Done with digest-bound exit, browser,
coverage and review evidence at canonical board revision 4481; UIQ-08 parent
remains Backlog/unshipped. Production app integration and deployment still
require separate maintainer admission. The first default-worker coverage run
had three contention-sensitive failures; the full two-worker rerun passed all
165 files/2,672 tests with 100% global coverage. See
`docs/research/uiq08/CODEX-REVIEW.md` and `CANDIDATE-EXIT.json` for details and
hashes.
