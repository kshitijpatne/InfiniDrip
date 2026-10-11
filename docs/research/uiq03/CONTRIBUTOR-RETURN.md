# UIQ-03 guidance panel — contributor return

Contributor: Claude Code (claude-sonnet-5). Scope: `docs/planning/UIQ-CLARITY-ADMISSION.md`'s
UIQ-03 frozen API/behavior section only, in this dedicated worktree.

Branch: `claude/uiq03-guidance-candidate`
Base commit: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` (verified `origin/main` per the admission)
Worktree: `F:\designApp-worktrees\uiq03-guidance`
Started: 2026-10-02T15:24:23Z (per admission). Returned: 2026-10-02T15:54:03Z.

No commits, PRs, pushes, installs, or full global gate were run. No file outside
the assigned list below was created or modified. `src/ui/enhancements/foundation/**`
and the other pre-existing readonly context/docs in this worktree were read only,
never written.

## Changed files (all new)

- `src/ui/enhancements/guidance/guidance-panel.ts` — the frozen `mountGuidancePanel`
  API, types, and rendering/reconciliation logic.
- `src/ui/enhancements/guidance/guidance-panel.css` — root-scoped `.uiq-guidance`
  stylesheet reusing the frozen UIQ-02 token names/defaults.
- `src/ui/enhancements/guidance/guidance-panel.test.ts` — 89 focused tests.
- `ops/ui-candidates/guidance.html` — standalone preview entry page.
- `ops/ui-candidates/guidance-preview.ts` — standalone preview script (9 scenarios).
- `docs/research/uiq03/CONTRIBUTOR-RETURN.md` — this file.
- `docs/research/uiq03/evidence/focused-test-coverage.log`
- `docs/research/uiq03/evidence/focused-coverage-final.json`
- `docs/research/uiq03/evidence/typecheck-root.log`
- `docs/research/uiq03/evidence/typecheck-standalone-preview.log`

(`coverage-uiq03-focused/` at the repo root is the vitest-generated focused
coverage report directory produced by the command below; it is left in place
per instruction, not deleted, and its `coverage-final.json` is copied into the
evidence folder above for a self-contained record.)

## API delivered (matches the frozen contract verbatim)

```ts
GuidanceAction { readonly label: string; readonly step: JourneyStep; readonly field?: string }
GuidanceEntry { readonly id: string; readonly note: Note; readonly action?: GuidanceAction; readonly detail?: string }
GuidanceSnapshot { readonly revisionLabel: string; readonly step: JourneyStep; readonly readiness: StageReadiness;
  readonly blocker?: StageBlocker; readonly notes: readonly GuidanceEntry[]; readonly fitIntent: string | null;
  readonly validity: { readonly state: "valid"|"invalid"|"unknown"; readonly detail: string } }
GuidancePanelOptions { readonly snapshot: GuidanceSnapshot; readonly onReview: (action: GuidanceAction) => void }
mountGuidancePanel(host: HTMLElement, options: GuidancePanelOptions): { update(snapshot): void; dispose(): void }
```

Imports used: `Note`, `Level`, `SEVERITY_ICON` from `src/guidance/note.ts`;
`JourneyStep`, `StageReadiness`, `StageBlocker`, `COACHED_STEPS`, `journeyChecklist`
from `src/ui/journey.ts`. `journeyBarMarkup` is never called; no engine
readiness/validation/decision math is reimplemented — `journeyChecklist` is used
only to read already-computed per-stage completion flags.

## Design decisions worth noting

- **No `id` attributes are ever assigned.** Every element is addressed only by
  class/data-attribute, so "multiple simultaneous mounts have independent DOM
  IDs" is trivially true (there is no shared id namespace to collide in).
- **Single delegated `click` listener per mount**, attached to the panel root
  and removed in `dispose()`. Note-action and correction buttons are looked up
  by id against a closure-held map that `update()` always refreshes, so a
  reused (surviving) button always emits the latest action data even though
  its DOM node is never recreated. A detached/removed button's click event has
  no path back to the root listener (removed nodes lose their place in the
  tree), so stale/obsolete controls cannot emit — verified by test, not only
  asserted.
- **Keyed reconciliation by `GuidanceEntry.id`**: `update()` never recreates a
  surviving note's `<li>`, its `<details>` (so `open` state persists), or its
  action `<button>` (so focus persists) — it only updates text in place and
  repositions nodes via `insertBefore` when order changes. A synchronous
  `update()` call made from inside the `onReview` callback itself is covered
  by a dedicated test and preserves the same guarantees.
- **Duplicate note ids throw synchronously before any DOM mutation**, in both
  `mountGuidancePanel` and `update()`, so a caller mistake never partially
  corrupts previously rendered, still-valid content.
- **Keyboard activation (Enter/Space) relies on native `<button type="button">`
  default behavior**, not a hand-rolled `keydown` handler — matching the
  admission's "native semantics mandatory" requirement and avoiding the
  double-fire risk a manual keydown handler would introduce in real browsers
  (where Enter/Space on a focused button already dispatch a native `click`).
  jsdom does not implement that default action, so the test suite verifies
  behavior via direct `button.click()` calls and confirms every interactive
  control is a real `<button>`/`<details>` element (so the browser's and
  assistive technology's native keyboard semantics apply). This is a
  test-environment stand-in, not an implementation gap.
- **CSS is self-contained**: `guidance-panel.css` declares its own copies of
  the frozen `--uiq-*` token names/hex defaults scoped to `.uiq-guidance`
  (never `:root`, never relying on `foundation.css` being loaded), so the
  module works standalone in production. The preview page additionally links
  `foundation.css` for shared host chrome, matching "import its CSS in
  standalone previews, not a shared production stylesheet."
- Severity uses both the existing `SEVERITY_ICON` (decorative, `aria-hidden`)
  and a literal `OK`/`Info`/`Warning` text label — the text label alone is
  what satisfies "never color alone"; the icon is additive, not a replacement.

## Test commands and results

Focused suite + 100% four-metric coverage of the owned module only:

```
npx vitest run src/ui/enhancements/guidance/guidance-panel.test.ts --coverage \
  --coverage.include=src/ui/enhancements/guidance/guidance-panel.ts \
  --coverage.reportsDirectory=coverage-uiq03-focused
```

Result: **89 passed, 0 failed.**

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |      100 |     100 |     100 |
 guidance-panel.ts |     100 |      100 |     100 |     100 |
```

Full log: `docs/research/uiq03/evidence/focused-test-coverage.log`.
Raw coverage data: `docs/research/uiq03/evidence/focused-coverage-final.json`.

Root typecheck:

```
npx tsc --noEmit
```

Result: **clean, no diagnostics, exit 0.** (`docs/research/uiq03/evidence/typecheck-root.log`)

Standalone preview typecheck (the repo's root `tsconfig.json` scopes `include`
to `src`, so `ops/ui-candidates/guidance-preview.ts` is checked explicitly with
the same compiler options):

```
npx tsc --noEmit --target ES2020 --module ESNext --moduleResolution bundler \
  --strict --esModuleInterop --skipLibCheck ops/ui-candidates/guidance-preview.ts
```

Result: **clean, no diagnostics, exit 0.** (`docs/research/uiq03/evidence/typecheck-standalone-preview.log`)

No other command was run. No install, no `npm run build`, no `npm test` (full
repo suite), and no full coverage gate were executed in this worktree, per
scope.

## Rendered/export evidence — honest limitation

**No actual browser was opened and no screenshot was taken.** Per scope,
"Codex does final browser/full gates" and this contributor must not claim
those ran. The evidence above is jsdom-based: every test in
`guidance-panel.test.ts` builds and inspects a real DOM tree (via `vitest`'s
jsdom environment), including focus (`document.activeElement`), `<details
open>` state, event bubbling/dispatch, and literal-text/XSS-resistance
assertions — this is meaningful DOM-behavior evidence, but it is not a
rendered-pixel or real-browser proof, and contrast/reflow/forced-colors/
reduced-motion behavior was reasoned from the CSS (reusing the exact,
already-measured UIQ-02 hex values — see the provenance comment at the top of
`guidance-panel.css`) rather than measured in a live browser.

`ops/ui-candidates/guidance.html` + `guidance-preview.ts` are provided and
typecheck cleanly, and are structured identically to the already-accepted
UIQ-02/05 preview convention (a plain `.html` entry with a `<script
type="module">` reference, served by the project's existing Vite dev server
the same way `index.html` serves `src/main.ts`). They were not launched via
`npm run dev` or opened in a browser by this contributor.

## Known limitations

- Keyboard Enter/Space activation is exercised in tests via `button.click()`
  (see "Design decisions" above); it was not separately verified against a
  real browser's native keydown-to-click default action.
- Contrast, 320/390/1440px reflow, 480px-equivalent zoom, and forced-colors
  rendering were designed to the frozen, already-measured UIQ-02 palette and
  the same structural patterns as `foundation.css`, but were not independently
  re-measured pixel-by-pixel in a live browser by this contributor.
- No stress/property-based fuzzing beyond the literal hostile-string fixtures
  in the test file (script tags, event-handler attributes, long repeats,
  Unicode/RTL/emoji, empty/whitespace-only strings) was run.
- This module has never been wired into the real app; it is an isolated
  candidate only, per scope.

## WORK FINISHED

```json
{
  "status": "complete",
  "summary": "Implemented UIQ-03's frozen mountGuidancePanel native guidance panel (TypeScript DOM + scoped CSS), its standalone preview, and 89 focused tests reaching 100% statement/branch/function/line coverage on the owned module. Root tsc --noEmit and a standalone-flags tsc check of the preview script both pass clean. No other files were read-write, and no commit/PR/push/install/full gate was run.",
  "branch": "claude/uiq03-guidance-candidate",
  "changed_files": [
    "src/ui/enhancements/guidance/guidance-panel.ts",
    "src/ui/enhancements/guidance/guidance-panel.css",
    "src/ui/enhancements/guidance/guidance-panel.test.ts",
    "ops/ui-candidates/guidance.html",
    "ops/ui-candidates/guidance-preview.ts",
    "docs/research/uiq03/CONTRIBUTOR-RETURN.md",
    "docs/research/uiq03/evidence/focused-test-coverage.log",
    "docs/research/uiq03/evidence/focused-coverage-final.json",
    "docs/research/uiq03/evidence/typecheck-root.log",
    "docs/research/uiq03/evidence/typecheck-standalone-preview.log"
  ],
  "tests_run": [
    "npx vitest run src/ui/enhancements/guidance/guidance-panel.test.ts --coverage --coverage.include=src/ui/enhancements/guidance/guidance-panel.ts --coverage.reportsDirectory=coverage-uiq03-focused"
  ],
  "coverage": "100% statements, 100% branches, 100% functions, 100% lines on src/ui/enhancements/guidance/guidance-panel.ts (89/89 tests passed)",
  "build_and_typecheck": "npx tsc --noEmit (root): clean, exit 0. npx tsc --noEmit (standalone-flags check of ops/ui-candidates/guidance-preview.ts): clean, exit 0. No `npm run build` was run (out of scope).",
  "rendered_or_export_evidence": [
    "jsdom-based DOM assertions only (focus, details-open state, event bubbling/dispatch, literal-text rendering) in guidance-panel.test.ts; see docs/research/uiq03/evidence/focused-test-coverage.log",
    "No real-browser screenshot or rendered-pixel evidence was captured by this contributor; Codex owns that gate"
  ],
  "known_limitations": [
    "Keyboard Enter/Space activation verified via button.click() in jsdom, not a real browser's native keydown default action",
    "Contrast/reflow/forced-colors/reduced-motion were designed to the already-measured frozen UIQ-02 palette and foundation.css structural pattern, not independently re-measured in a live browser",
    "Standalone preview (ops/ui-candidates/guidance.html) was not launched via npm run dev or opened in a browser",
    "No property-based/fuzz testing beyond the fixed hostile-string literal set"
  ],
  "follow_up_needed": [
    "Codex: open ops/ui-candidates/guidance.html via the dev server and capture real-browser screenshots/DOM/contrast/target/reflow/forced-colors/reduced-motion/no-egress evidence",
    "Codex: independent-review (OpenCode QA) per the admission's Q stage after both UIQ-03/UIQ-04 WORK FINISHED signals land"
  ]
}
```
