# G04 V02 — Woven exact-POM wrapped-label feasibility — Slice 374

## Start boundary

- Start: 2026-10-02 15:31:46 UTC from clean S373 commit `13b756dba1bc62e158835968d54685cfca549d32` on `codex/epic-17-g04`. `origin/main` was refreshed to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 373; reserve S374. Canonical board revision is 1817. EPIC-17/G04-V02 remain In Progress; all current holds, 56 accepted / 90 held and fixed V02/V03 gates remain unchanged. Goal status is active and matches the admitted G04 objective. Usage entering S374: primary 44% used; weekly 69% informational.
- Authority: admitted G04 V02 exact source-bound POM and readable-output criteria; exact Woven POM decisions in S363/S364/S371; same-revision `buttonPlacket.top` anchor and `buttonPlacket` target; Polo's retained 0.25 cm threshold. S373's separate mirrored-sleeve overlap decision remains pending and is not a dependency for this front-label diagnostic.

## Result

No wrapping layout passes across the 28-option matrix; keep the Woven POM and all affected faces held. The current source identity is unchanged: callout `pom:woven-shirt:finished-placket-width`, source entity `pattern:woven-shirt:role:buttonPlacket:edge:top`, target `flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline`, revision `live-draft:woven-shirt:14:14`. The source callout's complete wording, 3.0 cm value and ±0.2 cm tolerance remain unchanged; only line breaks were varied. The measurement method remains attached to the existing source POM and was not recomputed or altered.

Chromium measured the two-line rows at 3.2362 cm and 2.3978 cm, and the three-line rows at 2.3118 cm, 1.8847 cm and 1.3490 cm, with 0.40 cm line advance. The search used a 1 cm placement lattice, 30 nearest clear label boxes per layout, direct/x-first/y-first leaders and six y-corridor values; it enforced at least 0.25 cm clearance from same-revision geometry, visible labels and other callout leaders, excluded the exact target geometry at the anchor, and ended leaders at the label-box edge. This bounded scan is not a proof that no sub-centimeter placement exists.

Only the `woven-shirt-combined-supported` option row produces candidates: one two-line and two three-line positions. The best three-line candidate is centered at `(7.5, 7.5) cm`, has a 4.5541 cm anchor-to-center span, 3.3135 cm leader, 0.2724 cm minimum geometry/leader clearance and 1.9110 cm collar clearance. Actual rendered close-up shows the full text legible and the leader ends at the label edge without crossing text. That row is not consistent with the other 27 configurations, so it cannot clear the matrix gate. Default has 7,616 viable sampled boxes for two lines and 7,791 for three lines but zero qualifying routes under the tested paths and constraints. The search summary records zero candidates for the other 27 option rows in both layouts.

The visual evidence is diagnostic, not a proposal for implementation: it shows one option-specific possibility and does not establish a stable source-to-view placement. All 56 Woven faces and 34 Polo faces remain held (56 accepted / 90 held). Do not implement wrapping, weaken the gate, change the POM, or change any view mapping from this result. Continue with a separately scoped search or another independent V02 hold; keep S373's pending hem-overlap decision independent.

## Bounded diagnostic objective

Determine whether wrapping the existing Woven finished-placket-width label into two or three lines makes any same-source POM callout readable in the existing single front-flat renderer, while preserving the complete text, measurement method/value/tolerance, exact anchor/target, revision, geometry, stitch graph and fail-closed behavior. Test the exact 28 supported Woven option configurations; preserve their paired-back request identities from the baseline matrix. The front-only POM is not synthesized on paired back views. This studies a V02 callout presentation option not tested by S371's single-line label-box search; S364's seven-segment perimeter-following route and its rendered rejection remain prior constraints.

Candidate complete-text layouts are: (1) `Finished placket width:` / `3.0 cm (±0.2 cm)` and (2) `Finished placket` / `width: 3.0 cm` / `(±0.2 cm)`. Preserve exact words, punctuation, unit, method, value and tolerance; only line breaks may differ. Measure each actual line and line spacing in Chromium, then search source-bound label positions and leaders using exact production geometry and the current view frame. Require at least 0.25 cm clearance from visible geometry/other leaders, no label overlap or clipping, no collar-perimeter tracking or seam-like false path, and a legible anchor association. A route must be consistent and readable across all 28 configurations. Inspect actual rendered candidates at default, topology-distinct options and extremes.

## Scope, holds and exclusions

- Diagnostic/proposal only. Do not modify the production renderer, POM source/anchor/method/value/tolerance, pattern/cut geometry, stitches, mapping metadata, options, assembly, acceptance, board holds, exported DXF, or protected byte-identity fixtures.
- Keep all 56 Woven and 34 Polo faces held; integrated tally stays 56 accepted / 90 held. A passing label candidate is not approval to implement it or accept any face. Do not relax the all-seven V02 criterion, V02-before-V03, or Polo's 0.25 cm residual gate.
- Keep S373's pending Woven sleeve-overlap choice separate. Preserve legacy DXF, protected export identities, UIQ work outside G04, G05 tech-pack scope, G09/D04 assembled views, MQF checks/deferrals, and all physical/supplier/launch/hosted/production-readiness boundaries.
- No safe disjoint owner exists for the coupled exact-render/source-route analysis; Codex owns the diagnostic. No external agent is assigned.

## Required evidence and gates

- Exact source callout identity, target, anchor, output revision, current single-line fail-closed status and all 28 options are recorded.
- Chromium measures all candidate line widths and line spacing. Every route and label box is evaluated against same-revision geometry, colorway overlays and other labels/leaders with the unchanged minimum clearances.
- Keep all 28 face identities accounted for; zero browser errors. Generate and manually inspect candidate rendered whole views and close-ups. Document source facts versus layout choices and any assumptions.
- Focused diagnostic self-check, Control Center tests after validated board exit, and `git diff --check`. No repository-wide production coverage/build/export gate applies if no production source changes; the integrated Epic still requires its full settled-candidate gates before merge.

## Evidence and verification

- `S374-woven-pom-wrapped-label/search-wrapped-pom-labels.mjs` compiles current modules through the Vite-served app in Chromium and records measured line boxes, exact source identity, option records, sampled labels/routes, clearances and candidate counts in `wrapped-pom-feasibility.json` and `search-summary.json`.
- Manually inspected `annotated/woven-shirt-combined-supported-three-line-candidate-whole.png`, its three-line close-up, and the two-line close-up. The leader ends at the measured text-box edge in both close-ups. The label is locally readable in the whole view, but a candidate exists in only one of 28 configurations. The default has no candidate. No candidate is promoted.
- The first diagnostic run exposed a check defect: a center-terminated leader crossed its own text. I corrected routing to terminate at the label-box edge before interpreting results. A subsequent live-renderer run checked actual same-revision labels, visible geometry and other callout leaders; zero browser errors were reported.
- Candidate outputs are annotated derivatives of the actual renderer's geometry, not source or production output. The 1 cm lattice and six corridor offsets bound this exploratory search; absence of a sampled candidate outside the one combined row does not prove mathematical nonexistence.
- No production files, tests, pattern geometry, stitches, POM data, DXF behavior, byte identities, mappings, holds or acceptance status changed. `npm run control-center:test` and `git diff --check` are required after the exit command layer is updated. No full coverage/build/export gate applies to this documentation/diagnostic-only slice.

## Exit record

S374 closes as diagnostic-only at board revision 1834. No label mapping is approved or implemented. All existing holds and V02/V03 gates remain unchanged. `npm run control-center:test` passes 42/42; `git diff --check` passes. Elapsed time: approximately 19m40s (15:31:46–15:51:26 UTC); production implementation 0m; Chromium diagnostic and correction 8m; rendered review 2m; records and board 8m; focused verification 1m; external-agent waits 0m; maintainer-decision time 0m.
