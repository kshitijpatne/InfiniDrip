# UIQ-02 / UIQ-05 isolated candidate admission

Authority: maintainer said `begin` on 2026-10-02 New York after the two-track recommendation. Goal started 2026-10-02 04:01:02 UTC. This admits native foundation and existing artwork presentation candidates ONLY. No new numbered Epic, shared app wiring, main merge/push/deployment, hosted service or G04 work is admitted. The feature-spec skill makes states, ownership and falsifiable acceptance gates explicit.

## Starting point and slice boundaries

Result2026-10-02: both corrected root candidates independently accepted;
immutable proof is docs/research/uiq-parallel/CANDIDATE-EXIT.json. This result
does not expand the original admission. Parent releases remain unshipped and
integration still requires a separately admitted UIQ-GATE packet.

Approved base `origin/main` a5af5e13c2e967946b3f6035fcea66ff03a5e0e0; local HEAD50afb32ea8e5bd42ebb73fda13cc863e89fd9d8f has the same committed tree. The root's earlier planning edits/untracked research and empty Epic17 admission file are preserved. Epic17 landed S3543a8af3f and reserved S355 independently; its board/state are newer and will not be written here.

Numbered landing is deferred until fresh histories and reservations are checked; contributors must NOT commit, number slices, push or create PRs. Stable candidate boundaries: A admission/contracts/board; F UIQ-02 delivery; C UIQ-05 delivery; R Codex corrections/rendered and integrated-candidate gates. Codex allocates each unique numbered slice immediately before its eventual landing, not from an assumed number while G04 is reserving concurrently. No candidate is represented as shipped. Integration remains UIQ-GATE after settled merged Epic17.

Two contributor worktrees start from the approved base: `F:/designApp-worktrees/uiq02-foundation` (claude/uiq02-foundation-candidate) and `F:/designApp-worktrees/uiq05-artwork` (opencode/uiq05-artwork-candidate). Their extra context/handoff is this packet in F:/designApp; do not copy older governance over newer context. Scope is independent of pending G04 topology and holds.

## Common contract (frozen for this wave)

Native TypeScript DOM and original CSS only; no runtime dependencies, global selectors, remote fonts, body snapshots, canvas, React, shader or external library code. Reuse existing bundled images and search/assessment functions read-only. No draft, persistence, catalog/search/source schemas, baseline, package/config or existing app file edits. Mount appends an owned root; disposal removes only that root and its event handlers. No mutation of supplied records or any parent app state. Untrusted strings use textContent, never HTML interpolation. Native controls keep semantics and keyboard behavior.

CSS variable names: `--uiq-bg`, `--uiq-panel`, `--uiq-text`, `--uiq-muted`, `--uiq-accent`, `--uiq-border`, `--uiq-danger`, `--uiq-radius`, `--uiq-space`. Defaults respectively #0a1422,#11273b,#edf5fa,#bdd1df,#88d7ef,#7ca4bd,#ffb4b4,10px,12px. Candidate-only scoped root variables; the artwork stylesheet supplies identical fallbacks so tracks need not import each other's unfinished files. System fonts, readable solid backgrounds by default, no animation required. Minimum control target44px, normal text contrast4.5:1, keyboard outline3:1 against adjacent background. Future token overrides must retain evidence.

Candidate previews use separate unshipped HTML/module pages under ops/ui-candidates, served locally by the installed Vite without changing app entry/build config. Each clearly says isolated candidate, not live feature. A future integration packet defines flags/default/fallback and preserves old saved-state behavior; there is no app runtime flag or rollout in this wave.

## UIQ-02: native foundation

Problem: repeated panels/status/control treatments should explain state clearly without decorative rendering stacks or shared file churn. User story: a maker can distinguish neutral, advisory and blocking information and operate real controls at narrow widths/zoom.

Allowed writes only:
- src/ui/enhancements/foundation/foundation.ts, foundation.css, foundation.test.ts
- ops/ui-candidates/foundation.html, foundation-preview.ts
- docs/research/uiq02/CONTRIBUTOR-RETURN.md and evidence files beneath docs/research/uiq02/evidence/

Export `createFoundationPanel(title:string, description:string):HTMLElement` and `createFoundationStatus(message:string, kind:"info"|"warning"|"error"):HTMLElement`. Both use literal text. Panel root class uiq-foundation with h2 and paragraph. Status includes visible text label Info/Warning/Error (not color alone); error role alert, other states role status. Do not add live app controls or data contracts. Build CSS primitives for headings, panels, native inputs/selects/buttons, visible focus, disabled state, responsive wrapping and optional scoped glass class with solid fallback; no effects on any element outside uiq-foundation. Standard root box-sizing applies only within scope. Respect hidden, reduced motion and forced colors; avoid transitions for required behavior.

Preview demonstrates panels, three statuses, short/long/hostile-looking text, native enabled/disabled controls, labels, details, selected states and a solid/glass comparison. No application imports besides the new foundation module/style.

P0 acceptance: both functions and all branches100% coverage; XSS strings literal; isolated siblings unaffected; status semantics verified;320/390/1440 CSS px plus200% zoom-equivalent480px at960px content case no unintended horizontal overflow; keyboard focus and44px targets; measured color contrast; reduced-motion/forced-colors/opaque fallback visible. Preview not mistaken for sewn/output evidence. No measurable external requests or network import.

## UIQ-05: existing catalog presentation

Problem: existing12 reference images have important rights/print-use limitations that must be visible while browsing, not replaced by decorative certainty. Story: maker searches/filter results, inspects source and scale caveats, chooses an existing asset ID without changing the garment merely by browsing.

Allowed writes only:
- src/ui/enhancements/artwork/artwork-panel.ts, artwork-panel.css, artwork-panel.test.ts
- ops/ui-candidates/artwork.html, artwork-preview.ts
- docs/research/uiq05/CONTRIBUTOR-RETURN.md and evidence files beneath docs/research/uiq05/evidence/

Export `mountArtworkCatalog(host:HTMLElement, options:ArtworkCatalogPanelOptions):{setSelection(assetId:string|null):void;dispose():void}`. Options: optional readonly catalog (default ARTWORK_CATALOG), optional selectedAssetId:string|null (default null), optional printUse:ArtworkPrintUse (default placement), required onSelect:(assetId:string)=>void. Existing catalog/search/types are imported read-only. No custom search/assessment math. Search input plus category, garment-family, piece-role and print-use selects use existing enums; empty filter means any. Search results use searchArtworkCatalog; assessment uses assessArtworkUse at its existing default suggested size, labelled as such, not current user placement. Print-use selection updates the assessment and selected filter; clearing resets search/filters to all, retaining external selection and the supplied/default assessment use. Use a visible live result count and clear action, distinguish empty catalog versus no matches.

Each card shows local preview, title/category, source institution/rights/checked date, source presentation type, pixel dimensions, repeat verification and existing use assessment with full caveats/details. Provenance URLs appear as text, never fetched. All records remain selectable even `needs-review`; advisory status is not a fake authorization gate. Native button carries asset ID, accessible title, aria-pressed, selection callback only on explicit activation. setSelection does not call onSelect, filtering preserves external selection; an unknown/filtered selected ID is explained rather than silently reassigned. Callback never imports/saves/applies artwork. Search/query changes do not invoke callback.

Image safety: only same-origin local bundled URLs may become image src. No remote/data/javascript/credentialed URL loading; invalid URL or image error produces descriptive fallback without disabling selection. Use textContent for every supplied string. Multiple simultaneous instances have independent associated input IDs, filter state and cleanup. dispose is idempotent; disposed controls cannot call callbacks. Native input focus is retained while results change; no entire panel rerender on each keystroke. No global listeners.

P0 acceptance:100% four-metric changed-production coverage. Tests include all default/options paths, existing12 records, literal/unicode search, each filter and intersections, no matches/reset, empty catalog, selected hidden/unknown, setSelection/null, callback exact ID, repeated instances/dispose, failed/remote/hostile previews and strings, all assessment severities via valid fixtures. Deep-freeze fixtures where practical. Real browser tests verify local assets, selection by mouse/keyboard, no runtime egress, long text/narrow/zoom, focus, opaque fallback and visible advisory limitations. Do not claim new rights audit, production repeat, physical printing or app integration.

## Delegation / gates / pacing

Claude Code alias sonnet with high effort for F; OpenCode exact opencode/muse-spark-1.3-contributor-free --variant xhigh, normal mode, for C. No substitute if the required OpenCode configuration fails. CLI auth uses existing subscriptions; no provider keys/integration changes. Both work headlessly with no commit/push and return explicit WORK FINISHED plus JSON status, changed_files, tests_run, coverage, build_and_typecheck, rendered_or_export_evidence, known_limitations, follow_up_needed. Report blocker instead of inventing proof. Governance is Codex-owned.

Focused gate per track: installed npx vitest run <owned test> --coverage --coverage.include='<owned production module>' --coverage.reportsDirectory=<private evidence dir>; thresholds100/100/100/100 unchanged, then npx tsc --noEmit. No full gate or production build per contributor; Codex runs them once on settled combined candidate. Each cleans up DOM roots/jsdom/timers/listeners. Browser render is Codex-controlled after delivery; absence of contributor screenshot is explicit pending evidence, not a pass.

Codex reviews actual changes only after WORK FINISHED, fixes defects and combines under these exact boundaries. Required final candidate gates: full repository coverage100% all four metrics and protected export tests, TypeScript/build, Control Center tests, rendered desktop/narrow/reduced-motion/forced-colors/keyboard/asset-failure/no-egress checks, CSS isolation and actual evidence files. No production-merged Epic17 gate is claimed. Rollout, packaging and final merge remain separate.

Primary usage66% consumed at start, weekly31% informational; remain active while ordinary usage is allowed. No model switch is claimed where unavailable. Check at boundaries/before full gates, persist session IDs and verified results on exhaustion, resume with product heartbeat only if needed. No routine polling of contributor files; await WORK FINISHED signal. No hard delivery date; scope gives conditional2–4 implementation/review boundaries, numbered at landing; blocker/configuration and gate failures extend effort rather than reduce quality.

Single next action: dispatch F and C under this contract; then Codex owns preview verification and integrated candidate review. Parent UIQ packages retain unshipped release state; candidate child cards track admitted work separately from eventual production integration.
