# EPIC-17 / G04 V03 — S716 local DXF exchange and return audit exit

## Result

S716 adds a compact Export-panel flow around the existing schema-v5 package writer and fail-closed returned-DXF auditor. The user can save the opt-in CAD-exchange DXF and its JSON source package, then choose that JSON and a returned DXF for an accessible local result. The JSON includes the exact source DXF and the integrity-bound manifest. The legacy DXF export remains its existing separate button and implementation.

The panel reads selected files with the browser's local `File.text()` API. The page visibly says files are checked in the app and are not uploaded, and that the generic output makes no receiver-compatibility claim. Failure displays an alert with the auditor's reason and no partial counts. Success displays piece, outline, mark-entity counts and maximum geometry difference. The check remains disabled until both files are selected.

This clears only the product-visible local audit-flow criterion. It does not qualify a receiver, establish an industrial/standards profile, or clear the CLO failures. The exact CLO source/return still fails units, piece identity, semantic layers/marks, and five CUT contours above 0.001 cm. All V03 gates, thresholds, all-seven recipe/options/grade scope, and protected legacy-output identities remain unchanged.

## Implementation

- `src/ui/dxf-interchange-panel.ts` owns the isolated markup and local file/audit interaction. It rejects malformed JSON, reports errors accessibly, avoids stale async results, and never presents partial failure counts.
- `src/ui/app.ts` creates a package from the currently selected registered recipe size, its exact current source block, measurement revision, and options. It exports the schema-v5 DXF and matching JSON package under distinct names. Custom one-size styles are explicitly refused by the package builder because the schema currently requires a registered recipe grade.
- The existing legacy `#export-dxf` handler still calls `exportDxf(exportPieces(), exportAllowances())`; it was not modified.
- `ARCHITECTURE.md`, `PROJECT-STATE.md`, and `CONTEXT-INDEX.md` record the new bounded behavior and its limits.

## Verification

- Panel tests: 10/10 passed; changed panel module coverage is 100% statements, branches, functions, and lines.
- App integration tests: the opt-in CAD DXF equals the DXF embedded in its package JSON; schema version, generic profile label, centimeter declaration, and vector geometry were checked. Package creation failures show visible messages and create neither file. Both passed; the existing custom-size app test also confirms the package controls stay disabled for unregistered one-size styles and that the handler retains its guard (3 selected app tests; 268 unrelated app tests skipped by name filter).
- Protected legacy behavior check: existing app test that exercises SVG/DXF/PDF downloads passed (1 selected test; 269 unrelated app tests skipped).
- Production build/typecheck: `npm run build` passed. Vite emitted its existing large-chunk advisory; no build error.
- Control Center suite: 42/42 passed. `git diff --check` passed.
- Rendered review: Chromium at the local app's Export stage showed the CAD exchange panel, paired export buttons, local-only/no-compatibility text, labeled source and return inputs, and initially disabled audit action. The interaction tests separately covered valid response presentation, malformed JSON, auditor rejection, incomplete success output, read errors, and stale async results. No receiver was contacted and no CAD file was uploaded.
- One broad attempt to run the entire 270-test `app.test.ts` file alongside the focused panel suite was stopped after its worker exceeded 2 GB while continuing to consume CPU. It emitted the seven panel-test passes but no app-suite result before interruption. The focused app integration and legacy tests then passed independently. Worker defaults were not changed; the full repository coverage gate remains at the settled Epic/PR boundary.

## Time, state, and remaining gates

- Start: 2026-10-11 03:17 UTC at S715 `fcad996e66aae07339d5b11a481a6d0881a1f073`; board start replay advanced revision 4191→4193. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Close: 2026-10-11 03:31 UTC. Implementation about 5m; focused verification/build about 6m; rendered review and durable closeout about 3m; external-agent waits 0m; maintainer-decision time 0m.
- S716 is uniquely reserved and closed. Board closeout adds this packet and result at revisions 4194–4195. EPIC-17 and G04-V03 remain In Progress; the goal remains active.
- Still required: evidence-led resolution or explicit justified handling of V03 receiver/profile, rights, geometry, marks/layers, units, identity, grades/options, malformed-input cohort, repeatability, and readable-output gates; settled-candidate full 100% repository coverage; final integrated build, browser/Electron and rendered/output review; necessary-file cleanup; PR, safe merge, origin/main ancestry; any required deployment and production end-to-end verification. No physical-fit or factory-acceptance claim.

## Next action

Use the latest V03 gate matrix to choose a single source-supported code correction with a decisive check, or record why no code correction is supported. Do not repeat a receiver, format, setting, or encoding experiment already settled by the saved evidence. Keep cleanup deferred until the final PR candidate is ready, and preserve the two pre-existing S700 diagnostic files for that review.
