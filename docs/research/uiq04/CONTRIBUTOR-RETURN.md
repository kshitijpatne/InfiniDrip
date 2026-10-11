# UIQ-04 (material) isolated native candidate — contributor return

Contributor: Claude Code (claude-sonnet-5), this worktree only.
Worktree: `F:\designApp-worktrees\uiq04-material`
Branch: `claude/uiq04-material-candidate`
Base / current HEAD (no commits made): `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
(matches `origin/main` and the merge-base; this worktree's tree was never
committed to — all new content is uncommitted working-tree files.)

Governing documents read, in order, before any code: `AGENTS.md`,
`CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`,
`ARCHITECTURE.md`, `docs/OPENCODE-WORKFLOW.md`,
`docs/planning/UIQ-CLARITY-ADMISSION.md` (binding contract for this task).
`src/ui/enhancements/foundation/*` was read as a reused reference/convention
only (scoped-class isolation pattern) and was not imported by or modified
for this candidate.

## Scope delivered

Only the UIQ-04 (material) frozen P0 scope. No other worktree was read or
written. No Epic17 contact. No existing source edited. No dependency,
lockfile, or config change. No commit, PR, push, deploy, or full/global
gate run.

### New files (all newly created; nothing pre-existing was modified)

- `src/ui/enhancements/material/material-panel.ts` — the frozen
  `MaterialSnapshot` / `MaterialPanelOptions` / `mountMaterialPanel` API.
- `src/ui/enhancements/material/material-panel.css` — self-contained,
  root-scoped styling (`.uiq-foundation.uiq-material` combined selector on
  every rule; no bare `.uiq-material-*` selector exists).
- `src/ui/enhancements/material/material-panel.test.ts` — 97 focused tests,
  100% statements/branches/functions/lines on the owned module.
- `ops/ui-candidates/material.html` — standalone rendered-preview harness
  (not part of the Vite build entry; served only by the dev server for
  manual verification).
- `ops/ui-candidates/material-preview.ts` — builds the 26 preview cases
  listed below and mounts the real `mountMaterialPanel` function with no
  app state, persistence, or network calls.
- `docs/research/uiq04/CONTRIBUTOR-RETURN.md` — this file.
- `docs/research/uiq04/evidence/render-verify.cjs` — one-off Playwright
  script used to capture the rendered evidence below (not wired into any
  npm script or CI gate).
- `docs/research/uiq04/evidence/render-verify-result.json` — its machine
  output.
- `docs/research/uiq04/evidence/material-preview-full.png`,
  `case-shine100.png`, `case-invalid-texture.png`, `case-hostile.png` —
  actual rendered screenshots (see "Rendered evidence" below).

### Generated, not hand-written

- `coverage-uiq04-focused/` — v8 coverage report directory produced by the
  focused test command below. Left in place per the admission's "do not
  delete generated directories" instruction.

## API conformance to the frozen contract

Implemented exactly the signatures frozen in
`docs/planning/UIQ-CLARITY-ADMISSION.md`'s UIQ-04 section:

```ts
MaterialSnapshot { revisionLabel, fabric, easeGuidance, compatibility, color, appearance }
MaterialPanelOptions { snapshot, onReview }
mountMaterialPanel(host, options): { update(snapshot): void; dispose(): void }
```

- Imports only `StretchFabric`/`STRETCH_FABRICS` from `src/drafting/ease.ts`
  and `Appearance`/`APPEARANCE_TEXTURES`/`normalizeHex`/`parseAppearance`
  from `src/ui/appearance.ts`. Never calls `suggestedEase`, `fabricEaseNote`,
  or any drafting/renderer function (confirmed by grep: neither identifier
  appears in `material-panel.ts`).
- Never recalculates, defaults, clamps, or mutates ease/stretch/color/
  appearance. Invalid fabric stretch (negative, `NaN`, `Infinity`) and
  invalid appearance (unknown texture id, out-of-range/non-finite shine,
  malformed object) are shown with their literal raw value plus a
  "not clamped" note; no upper cap is invented.
- Two sections titled exactly `"Material behavior guidance"` and
  `"Screen appearance only"`; revision shown literally.
- All five `STRETCH_FABRICS` presets rendered read-only from the imported
  table (no re-typed/duplicated table). A caller-supplied fabric is labeled
  "Known preset" only on an exact `{name, family, stretchPercent}` match
  against that table, else "Custom / unverified fabric"; `fabric === null`
  renders an explicit "Unknown fabric" line.
- `easeGuidance === null` renders the literal "Ease guidance unavailable.";
  any other string (including empty/hostile) is shown via `textContent`
  verbatim.
- `compatibility.state`/`.detail` are displayed exactly as supplied; the
  module never infers compatibility from fabric, color, or appearance
  (covered by an explicit test).
- `color` is validated with `normalizeHex` only; a valid 6-digit hex is
  applied to the swatch's `background-color` (the only style write, and
  only ever the already-regex-validated value); an invalid color shows the
  literal string `"Preview unavailable"` plus the raw supplied value as
  text, and is never written into any style or attribute.
- `appearance` is independently re-validated at runtime with
  `parseAppearance` (not trusted from the static type), because a caller
  can hand the module a structurally malformed runtime value even though
  the type says `Appearance | null`. Raw `texture`/`shine` values always
  remain visible as literal text. The illustrative CSS-only cue (one of
  `smooth`/`woven`/`rib`/`heather`, built from `repeating-linear-gradient`/
  `radial-gradient` only — no images, no generated SVG, no remote
  resources) and the static shine overlay are withheld whenever appearance
  is invalid **or** color is invalid.
- Exactly two native buttons, labeled exactly `"Review fabric"` and
  `"Review appearance"`, created once at mount and never recreated across
  `update()` calls (keyed-identity and focus-preservation tests cover a
  synchronous controlled update triggered from inside the `onReview`
  callback itself). No preset chooser or Apply button exists. Neither
  button is ever disabled, including for null/invalid/mismatch snapshots.
- `onReview` fires only on explicit click/keyboard activation of its own
  button, never on mount, update, or swatch hover.
- `dispose()` is idempotent; `update()` after `dispose()` is a no-op; a
  detached button reference cannot emit a callback after disposal (guarded
  by an internal `disposed` flag checked inside the click handler, not by
  removing the DOM listener).
- Mounting appends exactly one owned root (`section.uiq-foundation.uiq-material`)
  and preserves pre-existing siblings; two simultaneous mounts have fully
  independent DOM/state/cleanup (tested).
- Every supplied string is set through `textContent` only; no `innerHTML`
  call exists anywhere in `material-panel.ts` (confirmed by grep).

## Test commands and results

Focused-module command, exactly as specified in the admission:

```
npx vitest run src/ui/enhancements/material/material-panel.test.ts \
  --coverage \
  --coverage.include="src/ui/enhancements/material/material-panel.ts" \
  --coverage.reportsDirectory="coverage-uiq04-focused"
```

Result: **97 passed, 0 failed.**

```
 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |     100 |      100 |     100 |     100 |
 material-panel.ts |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|-------------------
```

All four required metrics (statements, branches, functions, lines) are
100% on the owned module, with no assertion-free snapshot tests; every test
asserts concrete DOM/text/attribute/callback outcomes.

Root typecheck:

```
npx tsc --noEmit
```

Result: **passed, no errors** (run twice — once before the test file
existed, once after — both clean).

The standalone preview script (`ops/ui-candidates/material-preview.ts`) was
additionally sanity-checked with matching compiler flags since it sits
outside the root `tsconfig.json` `include` (`src`) boundary:

```
npx tsc --noEmit --strict --target ES2020 --module ESNext \
  --moduleResolution bundler --esModuleInterop --skipLibCheck \
  ops/ui-candidates/material-preview.ts
```

Result: **passed, no errors.** This is an informal self-check, not the
"standalone preview typechecks" item in the admission's Final gates list,
which is explicitly reserved to Codex's own settled-candidate gate.

## Rendered evidence

Ran `npm run dev -- --port 5183 --strictPort` (Vite dev server) and drove
`ops/ui-candidates/material.html` with a real Chromium instance via
Playwright (`docs/research/uiq04/evidence/render-verify.cjs`), then stopped
the server. Captured in
`docs/research/uiq04/evidence/render-verify-result.json`:

- 26 rendered preview cases, 54 native review buttons present.
- Section headings confirmed literally `"Material behavior guidance"` /
  `"Screen appearance only"`.
- No horizontal overflow at 320px, 390px, or 1440px viewport widths
  (`narrowOverflow320/390/wideOverflow1440: false`).
- Keyboard focus + click on the first "Review fabric" button fired the
  callback exactly once (`firstLogText` shows a single timestamped event).
- The "Invalid color" case shows the literal text
  `"Preview unavailable (supplied color: cornflowerblue)."`.
- The "Hostile text" case's rendered DOM contains **zero** `<script>`
  elements and `window.__uiq04_pwned` is `false` — the literal
  `<script>...</script>` string the snapshot supplies is visible as text,
  never executed.
- **Zero console errors**, **zero external network requests**
  (`externalRequests: []`) — all 9 requests were same-origin dev-server
  asset loads.
- Full-page screenshot: `material-preview-full.png` (all 26 cases).
- Close-up screenshots confirming actual pixels, not just assertions:
  `case-shine100.png` (visible diagonal sheen overlay on a woven texture
  cue at shine 100), `case-invalid-texture.png` (cue correctly hidden, raw
  `"plaid"`/`"10"` values shown as text), `case-hostile.png` (all hostile
  strings — long repeats, HTML-looking tags, unicode/emoji/RTL — rendered
  as inert visible text with correct wrapping, no layout break).

I visually reviewed all four screenshots myself before writing this report;
they match the described behavior.

## Known limitations

- This return does not include a full/global coverage gate, a production
  build (`npm run build`), a commit, a PR, or any push — all explicitly out
  of scope for this delegated candidate per the admission and task
  instructions.
- `ops/ui-candidates/material.html`/`material-preview.ts` are not wired into
  `vite.config.ts`'s build input; they are reachable only through the Vite
  dev server, by design (no app-entry change).
- The CSS illustrative texture/shine cues are a deliberately simple,
  CSS-gradient-only approximation (per the frozen "native CSS-only
  illustrative cue" / "no images/SVG markup generation" constraint) — they
  are not a physically accurate material render and the module's own
  caveat text says so.
- I did not run the independent OpenCode QA pass, the sibling UIQ-03
  worktree, or any Epic17-adjacent check — all explicitly reserved to Codex
  per the admission.
- Coverage/typecheck numbers above are from commands I ran myself in this
  worktree; per the required contributor-return contract, these are claims
  for Codex to independently re-verify against the actual checkout, not
  proof on their own.

## WORK FINISHED

```json
{
  "status": "complete",
  "summary": "Implemented the UIQ-04 (material) isolated native candidate exactly to the frozen MaterialSnapshot/MaterialPanelOptions/mountMaterialPanel API in docs/planning/UIQ-CLARITY-ADMISSION.md: fabric-behavior guidance and screen-only appearance panel, reusing STRETCH_FABRICS/Appearance tables without recalculating or clamping any value, with a self-contained root-scoped stylesheet, a standalone rendered preview covering all required states, and 97 focused tests at 100% statements/branches/functions/lines on the owned module.",
  "branch": "claude/uiq04-material-candidate",
  "changed_files": [
    "src/ui/enhancements/material/material-panel.ts",
    "src/ui/enhancements/material/material-panel.css",
    "src/ui/enhancements/material/material-panel.test.ts",
    "ops/ui-candidates/material.html",
    "ops/ui-candidates/material-preview.ts",
    "docs/research/uiq04/CONTRIBUTOR-RETURN.md",
    "docs/research/uiq04/evidence/render-verify.cjs",
    "docs/research/uiq04/evidence/render-verify-result.json",
    "docs/research/uiq04/evidence/material-preview-full.png",
    "docs/research/uiq04/evidence/case-shine100.png",
    "docs/research/uiq04/evidence/case-invalid-texture.png",
    "docs/research/uiq04/evidence/case-hostile.png"
  ],
  "tests_run": [
    "npx vitest run src/ui/enhancements/material/material-panel.test.ts --coverage --coverage.include=\"src/ui/enhancements/material/material-panel.ts\" --coverage.reportsDirectory=\"coverage-uiq04-focused\" -> 97 passed, 0 failed",
    "npx tsc --noEmit -> passed, no errors"
  ],
  "coverage": "material-panel.ts: 100% statements, 100% branches, 100% functions, 100% lines (focused v8 report in coverage-uiq04-focused/)",
  "build_and_typecheck": "Root `npx tsc --noEmit` passed with no errors. No production build (`npm run build`) was run; out of scope for this candidate and reserved to Codex's settled-candidate final gate.",
  "rendered_or_export_evidence": [
    "docs/research/uiq04/evidence/render-verify-result.json (Playwright-driven live DOM/action/no-overflow/no-egress/no-XSS checks against the real Vite dev server)",
    "docs/research/uiq04/evidence/material-preview-full.png (full 26-case rendered screenshot)",
    "docs/research/uiq04/evidence/case-shine100.png, case-invalid-texture.png, case-hostile.png (close-up rendered screenshots)"
  ],
  "known_limitations": [
    "No full/global coverage gate, production build, commit, PR, or push was run (out of scope).",
    "ops/ui-candidates/material.html and material-preview.ts are intentionally not wired into vite.config.ts's build input.",
    "CSS texture/shine cues are a simple gradient-only illustrative approximation, not a physically accurate render; the panel's own caveat text says so.",
    "Did not run the OpenCode QA pass or touch the sibling UIQ-03 worktree or Epic17; reserved to Codex.",
    "All coverage/typecheck/rendered results above are self-reported from commands I ran in this worktree; Codex must independently re-verify against the actual checkout per the contributor-return contract."
  ],
  "follow_up_needed": [
    "Codex: freeze/record this candidate's snapshot hash alongside the UIQ-03 (guidance) candidate once both are WORK FINISHED.",
    "Codex: dispatch the exact-model OpenCode QA pass against both candidates per the admission.",
    "Codex: run the settled full-gate/global-coverage/production-build/browser verification and the protected-file hash comparison before any acceptance decision."
  ]
}
```
