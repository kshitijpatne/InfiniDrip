# UIQ-05 contributor return — artwork-owned isolated candidate

WORK FINISHED

Scope followed `docs/planning/UIQ-PARALLEL-ADMISSION.md` (UIQ-05 only) plus local
`AGENTS.md` / `CONTEXT-INDEX.md` / `PROJECT-STATE.md` / `docs/PROJECT-DECISIONS.md`.
No commits, pushes, PRs, installs, dependency edits, secrets, or other-worktree reads.
Existing catalog/search/assessment were imported read-only; no existing source,
asset, governance, config, or baseline was edited.

## Changed files (artwork-owned only)

- `src/ui/enhancements/artwork/artwork-panel.ts`
- `src/ui/enhancements/artwork/artwork-panel.css`
- `src/ui/enhancements/artwork/artwork-panel.test.ts`
- `ops/ui-candidates/artwork.html`
- `ops/ui-candidates/artwork-preview.ts`
- `docs/research/uiq05/CONTRIBUTOR-RETURN.md` (this file)
- `docs/research/uiq05/evidence/focused-gate/*` (focused coverage report)

Base: `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
(worktree HEAD `a5af5e1`, branch `opencode/uiq05-artwork-candidate`).
`docs/planning/UIQ-PARALLEL-ADMISSION.md` remains untracked as supplied; untouched.

## API delivered

`mountArtworkCatalog(host, options): { setSelection; dispose }` with
`ArtworkCatalogPanelOptions { catalog? (default ARTWORK_CATALOG), selectedAssetId? (default null), printUse? (default placement), onSelect }`.

Behavior:

- Native DOM only, no runtime deps, no global selectors/listeners, no remote fonts/canvas/React.
- Owned root appended to `host`; `dispose()` removes only that root, idempotent; disposed buttons cannot call back; `setSelection` never calls `onSelect`.
- Search input plus category / garment-family / piece-role / print-use selects use existing enums; empty means any. Results via `searchArtworkCatalog`; assessment via `assessArtworkUse` at default suggested size, labelled as catalog default, not user placement.
- Single print-use select drives both filter and assessment; empty maps assessment to supplied/default. Clear resets query/filters to all, retains external selection and supplied/default assessment use.
- Live `role=status aria-live=polite` count; empty catalog (`No references in this catalog.`) distinguished from no matches; clear action present.
- Cards show local preview (or descriptive fallback), title/category, institution/rights/checked date, presentation type, pixel dimensions, repeat verification, full assessment reason/details, provenance URLs as text only (never `<a>`, never fetched), asset ID, and a native `type=button` with `data-asset-id`, `title`, `aria-label`, `aria-pressed`. All levels remain selectable; callback only on explicit click with exact ID.
- Image safety: only `http:`/`https:` same-origin URLs without credentials become `img.src`; empty/invalid/remote/`data:`/`javascript:`/credentialed/cross-origin fall back with text, selection stays enabled; `img.onerror` swaps to fallback. All supplied strings via `textContent`/attributes, never HTML interpolation.
- Independent per-instance ID prefix, filter state, and cleanup; focus retained (only results container re-renders on keystroke).
- CSS scoped under `.uiq-artwork` only, with frozen `--uiq-*` variables and identical fallbacks (`#0a1422,#11273b,#edf5fa,#bdd1df,#88d7ef,#7ca4bd,#ffb4b4,10px,12px`), system fonts, solid backgrounds, 44px targets, visible focus, wrapping grid, `[hidden]` respect, reduced-motion/forced-colors rules, and solid-fallback glass class.

Preview (`ops/ui-candidates/`): separate unshipped `artwork.html` + `artwork-preview.ts`, served by existing Vite without entry/build changes, bannered `Isolated candidate — not a live feature`, no app imports beyond the new module/style.

## Verification (focused gate only per admission)

- `npx vitest run src/ui/enhancements/artwork/artwork-panel.test.ts --coverage --coverage.include='src/ui/enhancements/artwork/artwork-panel.ts' --coverage.reportsDirectory='docs/research/uiq05/evidence/focused-gate'`
  - 31/31 pass; 100% statements/branches/functions/lines for `artwork-panel.ts`.
  - Covers defaults/options, 12 records, literal/unicode search, each filter + intersections, no-matches/reset, empty catalog, hidden/unknown selection, setSelection/null, exact callback, two-instance/dispose, remote/failed/hostile previews + strings, all three assessment levels, deep-frozen fixtures, focus preservation, label association, no-mutation.
  - Report: `docs/research/uiq05/evidence/focused-gate/index.html`, `coverage-final.json`, `clover.xml`.
- `npx tsc --noEmit` — exit 0.
- No full repo gate, production build, or browser gate per admission; those remain Codex-owned.

## Known limitations (not claims)

- No contributor browser screenshot; real-browser local-asset, mouse/keyboard, egress, narrow/zoom, focus, opaque-fallback checks are pending Codex preview verification, not a pass.
- jsdom has no layout engine; 44px/contrast/wrapping are satisfied by scoped CSS tokens, not instrumented here.
- In jsdom, bundled `file://` catalog URLs are cross-origin and correctly fall back; in Vite http preview the same records resolve same-origin and render. Unit safe-image path is proven with synthetic same-origin URLs.
- No new rights audit, production repeat, physical printing, or app-integration claim.

## Follow-up needed

- Codex preview verification and integrated-candidate review under UIQ-GATE.
- Codex-owned full coverage/build/Control Center/rendered gates once combined.

```json
{
  "status": "complete",
  "summary": "UIQ-05 isolated artwork catalog panel delivered under frozen contract with 100% focused coverage and clean typecheck; no browser gate claimed.",
  "branch": "opencode/uiq05-artwork-candidate",
  "changed_files": [
    "src/ui/enhancements/artwork/artwork-panel.ts",
    "src/ui/enhancements/artwork/artwork-panel.css",
    "src/ui/enhancements/artwork/artwork-panel.test.ts",
    "ops/ui-candidates/artwork.html",
    "ops/ui-candidates/artwork-preview.ts",
    "docs/research/uiq05/CONTRIBUTOR-RETURN.md",
    "docs/research/uiq05/evidence/focused-gate/index.html",
    "docs/research/uiq05/evidence/focused-gate/coverage-final.json",
    "docs/research/uiq05/evidence/focused-gate/clover.xml",
    "docs/research/uiq05/evidence/focused-gate/artwork-panel.ts.html"
  ],
  "tests_run": [
    "npx vitest run src/ui/enhancements/artwork/artwork-panel.test.ts --coverage --coverage.include='src/ui/enhancements/artwork/artwork-panel.ts' --coverage.reportsDirectory='docs/research/uiq05/evidence/focused-gate'",
    "npx tsc --noEmit"
  ],
  "coverage": "100% statements/branches/functions/lines for src/ui/enhancements/artwork/artwork-panel.ts; 31/31 owned tests pass",
  "build_and_typecheck": "npx tsc --noEmit exit 0; no full build per admission (Codex owns full gate)",
  "rendered_or_export_evidence": [
    "ops/ui-candidates/artwork.html (isolated candidate banner, not a live feature)",
    "ops/ui-candidates/artwork-preview.ts (two independent mounts, callback-only notes)",
    "No contributor browser screenshot; rendered/desktop/narrow/reduced-motion/forced-colors/keyboard/asset-failure/no-egress checks remain Codex-controlled pending evidence, not a pass"
  ],
  "known_limitations": [
    "Focused gate only; full repo coverage/build/Control Center/browser gates not run (Codex-owned)",
    "jsdom cannot verify layout/contrast/viewport; CSS provides scoped 44px targets, solid fallbacks, focus, wrapping, reduced-motion/forced-colors",
    "Bundled file:// URLs fall back in jsdom by same-origin rule; http preview renders same-origin local assets",
    "No new rights audit, production repeat, physical printing, or app integration claimed"
  ],
  "follow_up_needed": [
    "Codex preview verification and integrated candidate review under UIQ-GATE",
    "Full repository coverage/build/Control Center/rendered gates on settled combined candidate"
  ]
}
```
