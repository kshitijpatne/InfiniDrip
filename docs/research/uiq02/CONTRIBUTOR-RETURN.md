# UIQ-02 contributor return — native foundation

Admission source: `F:/designApp/docs/planning/UIQ-PARALLEL-ADMISSION.md` ("UIQ-02:
native foundation" section), dispatched to `claude/uiq02-foundation-candidate`
in worktree `F:/designApp-worktrees/uiq02-foundation`. Base: `origin/main` at
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; local HEAD matched the same tree
(`50afb32`) at start. No commits, pushes, or PRs were made; the working tree
remains clean of staged changes. This report and its evidence are the full
handoff for Codex's review and integration.

## Scope honored

Only the files explicitly allowed by the admission packet were written:

- `src/ui/enhancements/foundation/foundation.ts`
- `src/ui/enhancements/foundation/foundation.css`
- `src/ui/enhancements/foundation/foundation.test.ts`
- `ops/ui-candidates/foundation.html`
- `ops/ui-candidates/foundation-preview.ts`
- `docs/research/uiq02/CONTRIBUTOR-RETURN.md` (this file)
- `docs/research/uiq02/evidence/**` (this report's supporting evidence)

No `package.json`, lockfile, `node_modules`, `tsconfig.json`, `vite.config.ts`,
`vitest.config.ts`, or any existing application file was modified. No `npm
install`/`npm ci` was run; the worktree's already-installed dependencies
(including Playwright's locally cached Chromium at
`~/AppData/Local/ms-playwright`) were reused as-is, per "local dependency
installation only."

## What was implemented

`createFoundationPanel(title, description)` and `createFoundationStatus(message,
kind)` exactly match the frozen signatures. Both build their DOM with
`document.createElement` and set all caller-supplied strings via
`textContent` only — no `innerHTML`, no template interpolation into markup.

- Panel root: `<section class="uiq-foundation uiq-foundation-panel">`
  containing an `<h2 class="uiq-foundation-panel-title">` and a
  `<p class="uiq-foundation-panel-description">`. The root carries the
  required `uiq-foundation` scope class plus an `h2` and a paragraph, as
  specified.
- Status root: `<div class="uiq-foundation uiq-foundation-status"
  data-kind="info|warning|error" role="alert|status">` containing a
  `.uiq-foundation-status-label` span with the literal visible text
  `Info`/`Warning`/`Error`, and a `.uiq-foundation-status-message` span with
  the caller's message. `role="alert"` only for `error`; `role="status"` for
  `info` and `warning`. State is never conveyed by color alone — the text
  label is always present and differs per kind.

`foundation.css` is fully scoped under `.uiq-foundation` (and its descendant
selectors), so it cannot affect any element outside this module's own roots.
It declares the nine frozen `--uiq-*` custom properties on `.uiq-foundation`
itself (not `:root`), so nothing leaks onto the host page. It supplies:
headings, panel and status containers, native `button`/`select`/`input`
styling (44px minimum control size), a `:focus-visible` outline (3px solid
accent), a `:disabled` state (reduced opacity, `not-allowed` cursor),
responsive wrapping (`overflow-wrap: anywhere`, `min-width: 0`, no fixed
widths), an optional `.uiq-foundation-panel--glass` modifier with a solid
background declared before the `@supports (backdrop-filter: …)` translucent
enhancement (so unsupported browsers and forced-colors mode stay fully
opaque), a `prefers-reduced-motion: reduce` rule that removes all transitions
and animations, and a `forced-colors: active` rule that switches
backgrounds/text/borders to `Canvas`/`CanvasText`/`Highlight` and disables the
backdrop blur.

`ops/ui-candidates/foundation.html` + `foundation-preview.ts` render an
isolated preview (banner text: "Isolated UIQ-02 candidate preview — not a
live feature, not sewn or shipped evidence.") showing: three panels (short,
deliberately long, and an HTML/script-looking "hostile" string) to
demonstrate wrapping and literal-text rendering; all three status kinds;
native enabled and disabled `input`/`select`/`button` controls with real
`<label for>` associations; and a solid-vs-glass panel comparison over a
striped backdrop. The preview script imports only
`src/ui/enhancements/foundation/foundation.ts` and `foundation.css` — no other
application code.

## Gates run (focused, as instructed — not the full repository gate)

### Unit tests + coverage

```
npx vitest run src/ui/enhancements/foundation/foundation.test.ts --coverage \
  --coverage.include='src/ui/enhancements/foundation/foundation.ts' \
  --coverage.reportsDirectory=docs/research/uiq02/evidence/coverage
```

Result: **26/26 tests passed.** Coverage on `foundation.ts`:
**100% statements / 100% branches / 100% functions / 100% lines** (all four
metrics, as required). Full HTML report is in
`docs/research/uiq02/evidence/coverage/`.

Test coverage includes: both exports' default/typical paths; all three status
kinds (verifying the `role` branch: `alert` for error, `status` for the other
two, and that the three visible labels are distinct); a shared list of
"hostile" literal strings (`<script>`, `<img onerror>`, a closing-tag
injection attempt, `javascript:` text, an already-escaped entity, empty
string, whitespace-only, a 2000-character string, and Unicode/RTL text) run
through every string parameter of both functions, asserting `textContent`
equality and the absence of any injected `script`/`img`/`b` element; isolation
checks that creating panels/statuses never touches `document.head`, never
mutates an unrelated sibling element, and never adds classes to
`document.documentElement`.

### TypeScript

```
npx tsc --noEmit
```

Result: **clean, no errors.** (The repository's `tsconfig.json` only includes
`src/`, so this command type-checks `foundation.ts`/`foundation.test.ts`. I
additionally ran a standalone check of `ops/ui-candidates/foundation-preview.ts`
with the equivalent compiler flags — `npx tsc --noEmit --target ES2020 --module
ESNext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck
--lib ES2020,DOM ops/ui-candidates/foundation-preview.ts` — which also passed
clean. That file is outside `tsconfig.json`'s `include`, so it is not part of
Codex's eventual `npx tsc --noEmit` run unless `tsconfig.json` is changed;
I did not change it, per the file-ownership boundary.)

No full-repository test suite, full coverage run, or `npm run build` was
executed, per instruction ("Codex owns the integrated gate").

## Rendered browser evidence (not just claimed — actually captured)

The admission packet states contributor screenshots are optional ("absence of
a contributor screenshot is explicit pending evidence, not a pass"). Rather
than leave this pending, I found Playwright with a locally cached Chromium
already present in the worktree's dependencies (`~/AppData/Local/ms-playwright`,
no download/network install performed) and used it to render the real preview
page served by the installed Vite dev server (`npx vite --port 4312
--strictPort`, no config changes). All of this evidence is genuine, captured
by `docs/research/uiq02/evidence/verify-browser.mjs` (kept in the evidence
directory so Codex can re-run it: `node
docs/research/uiq02/evidence/verify-browser.mjs http://localhost:<port>`
against a running dev server), with full results in
`docs/research/uiq02/evidence/browser-verification.json` and screenshots in
`docs/research/uiq02/evidence/screenshots/`.

Measured results:

- **Viewport overflow** at 320px, 390px, 1440px, and the 200%-zoom-equivalent
  pair (480px and 960px): `scrollWidth === clientWidth` at every width —
  **no horizontal overflow** anywhere. See `screenshots/narrow-320.png` and
  `screenshots/default-1440.png`.
- **44px control targets**: every native `button`/`select`/`input` inside the
  preview (enabled and disabled) measured width ≥ 44px and height exactly
  44px — **all pass**.
- **Keyboard focus**: tabbing to the first enabled button produces a real
  `outline: 3px solid rgb(136, 215, 239)` (`#88d7ef`, the frozen accent) with
  `outline-style: solid`. Measured against the panel background
  (`#11273b`), the outline's contrast ratio is **9.45:1**, clearing the 3:1
  non-text/focus-indicator minimum. See `screenshots/keyboard-focus.png`.
- **Text contrast**: panel description text (`#bdd1df` on `#11273b`) and
  status message text (`#bdd1df` on `#11273b`) both measured **9.69:1**,
  clearing the 4.5:1 normal-text minimum. (Full pairwise contrast for every
  frozen `--uiq-*` combination is also computed arithmetically in a comment
  at the top of `foundation.css`; all pairs clear their respective
  thresholds, ranging from 5.74:1 to 16.76:1.)
- **`prefers-reduced-motion: reduce`**: emulated in the browser; the
  computed `transition-duration` on a focusable control is `0s` — animations
  and transitions are fully disabled. See `screenshots/reduced-motion.png`.
- **`forced-colors: active`**: emulated in the browser; the `.uiq-foundation-
  panel--glass` element's computed `backdrop-filter` is `none` and it renders
  with an opaque system background — the glass panel degrades to a fully
  legible, opaque panel rather than disappearing or staying translucent. See
  `screenshots/forced-colors.png`, where every panel, status, and control
  remains legible using system Canvas/CanvasText/Highlight colors.
- **Network egress**: all 6 requests the page issued during load were to
  `localhost`/`127.0.0.1` (the dev server itself); zero non-local requests —
  no remote fonts, no external assets, no telemetry.
- **Accessibility**: ran `axe-core` (already present in `node_modules`, no
  install) against the rendered `<main>` with the WCAG 2.0/2.1/2.2 A/AA
  rule sets. First pass found 2 real violations in my preview wiring (the
  demo `<select>` and the disabled demo `<input>` lacked accessible names,
  via `<label for>` associations I had omitted) — **not** in
  `foundation.ts`/`foundation.css` itself, which don't create those specific
  elements. I fixed `foundation-preview.ts` to associate real `<label for>`
  elements with both controls and re-ran the scan: **0 violations, 11 passes**
  (`docs/research/uiq02/evidence/axe-verification.json`). I also re-ran the
  full browser verification script after the fix to confirm all the
  measurements above still hold against the corrected preview.
- Visual spot-check of `screenshots/default-1440.png`,
  `screenshots/narrow-320.png`, and the glass comparison: the hostile string
  `<script>alert('xss')</script> & "quoted" <b>bold</b>` renders as plain
  visible text in the panel, never executes, and never becomes markup —
  confirmed visually in addition to the unit-test assertions.

All dev-server and headless-browser processes started for this verification
were stopped afterward; nothing was left running.

## Known limitations / honest gaps

- This is a contributor-run check, not Codex's integrated gate. I did not run
  the full repository test suite, full-repository coverage, the production
  `npm run build`, or Control Center tests — those are explicitly out of
  scope for this contract.
- The browser evidence above was gathered by me (the contributor), not Codex.
  The admission packet treats contributor screenshots as optional bonus
  evidence, not a substitute for Codex's own rendered verification — treat it
  as a strong signal, not the final gate.
- The glass panel's translucency is real (confirmed via computed style:
  `background-color: color(srgb … / 0.72)` and `backdrop-filter: blur(14px)`,
  both supported in this Chromium build) but is visually subtle against the
  specific tight-repeat striped backdrop used in the preview — a wider-period
  or photographic backdrop would make the blur more visually obvious. This
  doesn't affect correctness; it's a preview-content choice, noted for
  whoever reviews the screenshots.
- `ops/ui-candidates/foundation-preview.ts` is outside `tsconfig.json`'s
  `include`, so it is not covered by `npx tsc --noEmit` until a future,
  separately-owned change (if any) adds it to that config. I verified it
  manually with equivalent standalone compiler flags instead (see above).
- No physical/sewn evidence is claimed or implied anywhere in this candidate;
  it is UI-only.

## Files changed

- `src/ui/enhancements/foundation/foundation.ts` (new)
- `src/ui/enhancements/foundation/foundation.css` (new)
- `src/ui/enhancements/foundation/foundation.test.ts` (new)
- `ops/ui-candidates/foundation.html` (new)
- `ops/ui-candidates/foundation-preview.ts` (new)
- `docs/research/uiq02/CONTRIBUTOR-RETURN.md` (new, this file)
- `docs/research/uiq02/evidence/verify-browser.mjs` (new, reusable verification script)
- `docs/research/uiq02/evidence/browser-verification.json` (new, evidence)
- `docs/research/uiq02/evidence/axe-verification.json` (new, evidence)
- `docs/research/uiq02/evidence/coverage/**` (new, evidence — vitest HTML/JSON coverage report)
- `docs/research/uiq02/evidence/screenshots/*.png` (new, evidence — 5 real Chromium screenshots)

No commits were created; the branch `claude/uiq02-foundation-candidate`
remains at the same HEAD it started from, with these files untracked and
unstaged, ready for Codex's review.

## WORK FINISHED
