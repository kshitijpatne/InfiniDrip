# G04 V02 — Polo sleeve-cap repair alternatives — Slice 427

## Start boundary and authority

- Started 2026-10-07 16:19:12 UTC from clean S426 `3eba932a9ad752d3e08014610350b51e568adf8c` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 426; S427 is the next unique number. Canonical Control Center board revision is 2503. EPIC-17 In Progress, G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog. Goal is active and still names full V01→V02→V03 completion/safe merge. Usage: 9% primary / 10% weekly.
- S423 proved the exact Polo sleeve-cap endpoint residual is 0.677835 cm hard-anchored RMS on each face; even the best two-endpoint rigid fit is 0.479302 cm, above the fixed 0.25 cm gate. S424's proposal to reduce the entire sleeve bicep width by 8.654851 cm was rejected. Do not reinterpret that approval as authorization for another geometry change.
- All 34 Polo and 56 Woven faces remain held; integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces. S426 cleared the specific source-label/marker-label overlap diagnosis only.

## Objective and exact scope

Inspect the production Polo and shared sleeve source, the exact S423 residual evidence and all 17 supported Polo option rows. Diagnose whether a bounded Polo-specific sleeve-cap geometry change could reduce endpoint RMS below 0.25 cm while retaining the existing finished bicep span, the 1.5 cm total authored cap ease, source role/stitch identity, upright panels, and current user-facing measurements. Evaluate concrete candidate formulas only in memory; calculate cap/armhole lengths, endpoints and implications for side seams, POMs, other recipes and cut topology. Render a same-source sleeve overlay or comparable digital evidence for any viable candidate.

This is a diagnostic and proposal slice only. Do not change production drafting source, stitch graph, cut geometry, options, POM values, acceptance, threshold, renderer or holds. Do not treat a mathematically feasible silhouette as pattern-specific construction evidence or fit validation. Present only a specific candidate supported by this source/topology inspection; if all alternatives materially redefine Polo construction or cannot preserve measurements, recommend no change and retain the hold. Any production geometry/stitch edit requires explicit maintainer approval of the exact mapping and source change.

## Acceptance evidence

- Reproduce the current source/pattern endpoint measurements for all 17 supported option rows and both front/back faces.
- Test and record at least one bounded candidate that narrows cap endpoint span independently of finished sleeve bicep span, if the source architecture allows it, including exact changed edge coordinates/formula, re-solved height/ease, retained POMs and side-seam/hem consequences.
- Compare the candidate against the current source in an actual SVG/Chromium overlay; inspect for self-intersection, changed piece topology, misleading joins and visual consequences. The candidate remains diagnostic and the default output remains unchanged.
- Separate facts directly encoded in source, arithmetic/inference, and unresolved design choices. State all option rows and views affected, tradeoffs, assumptions, and exact source location of a proposed change.
- Keep the 0.25 cm gate, all-seven V02 criterion, 34 Polo and 56 Woven holds, V02-before-V03, legacy DXF behavior and every protected export byte identity unchanged.
- Update the packet, project state, context index and canonical board using the validated command layer; focused verification and `npm run control-center:test`; `git diff --check`. Do not run the global repository gate before the settled integrated candidate.

## Non-goals and ownership

No production pattern/source/stitch change without a new explicit approval; no general construction-reference search unless a specific unchecked source can substantively establish this Polo cap relationship; no display-only distortion to mask the residual; no threshold relaxation, face release, physical sampling, fit/factory/production-readiness claim, other recipe changes, V03 CAD profile work, G05 tech-pack content, G09/D04 assembled views, UI redesign, supplier contact, launch spending or hosted service. S423 and S424 establish the source-metric lower bound and rejected bicep-only tradeoff; use them rather than repeating their work.

Codex owns the tightly coupled source-geometry reasoning and output review. No independent low-risk, disjoint ownership is available for this diagnostic, so no external coding agent is used.

## Required time record

At exit, report implementation (expected 0m), focused verification, rendered review, external-agent waits (0m), and maintainer-decision time separately. Current decision time is 0m. One global repository coverage/build/export/146-face rendered gate remains reserved for the settled integrated Epic candidate.

**Admission next action:** inspect the exact Polo sleeve component and parameter binding, then calculate a Polo-only cap-span candidate in a diagnostic harness without editing production source.

## Source facts and candidate result

**Directly encoded in current source:** `src/drafting/sleeve.ts` sets `CAP_EASE = 1.5`, derives the entire sleeve-cap endpoint span from `bicep + ease * 0.5`, uses that span in both cap halves and the body-side endpoints, and solves cap height to make total cap length equal target armhole length + 1.5 cm. `src/drafting/polo.ts` passes the actual front+back armhole length to this shared sleeve component. The `Sleeve bicep width` POM is inherited through `POLO_BODY_POMS`; `src/drafting/tshirt-pom.ts` measures horizontally from `sleeve.sideLeft:end` to `sleeve.sideRight:start`, which are exactly the cap/side junction endpoints. Its tolerance is ±0.6 cm. The source declares no separate cap-span input, bicep station below the cap, or side-shaping landmark. `src/drafting/tshirt-checks.ts` permits the source stitch `Sleeve-cap ease` in the numeric range −1…4 cm. Existing `docs/research/garments/POLO-RESEARCH.md` adopts reuse of the current tee sleeve and supplies no alternate Polo cap/bicep separation rule.

**Reproduced baseline:** the production source formula matches S423 for every one of 17 options and both faces: cap half length 21.595729 cm, receiver half length 20.845729 cm, 1.5 cm total ease, equal half chords 21.574132 cm versus 20.615528 cm, and hard-endpoint RMS 0.677835 cm. The options do not alter cap or armhole geometry.

**In-memory candidate, not source evidence:** retaining the existing 1.5 cm total cap ease but shrinking cap endpoint span independently requires the largest passing width to be 35.730905 cm for the fixed 0.25 cm gate. This is a −7.269095 cm change from 43 cm; re-solving cap height moves it from 1.786944 to 10.978524 cm. The current POM method then measures 35.730905 cm, a −7.269095 cm change, more than twelve times its 0.6 cm tolerance. The two body armholes, source stitch, and total cap arc stay unchanged; the sleeve silhouette and both side seams change. The candidate's cap/side endpoints remain joined and the existing hem endpoints remain fixed. Its actual-source outline overlay is retained at `candidate-sleeve-cap-span-overlay.svg` and `.png`; Chromium reports two rendered contours and no browser errors. The candidate passes the numeric residual only by materially changing a user-facing POM and cap shape, so it is **not recommended for implementation**.

At the nearest cap span still within the existing POM tolerance (42.4 cm), retaining 1.5 cm authored ease yields 0.631366 cm RMS, still above the gate. The sampled matrix of spans 43, 42.4, 42, 41, 40, 39 cm and cap ease −1, 0, 1.5 cm has no case satisfying both the residual gate and existing POM tolerance. Even the −1 cm ease lower bound paired with 42.4 cm gives 0.413284 cm RMS. The minimum passing width 35.730905 cm was solved continuously under unchanged +1.5 cm ease. Matrix: `candidate-matrix.json`.

## Evidence classification and decision

- **Pattern-source facts:** source-width/ease formulas, actual armhole target, POM anchor and tolerance, stitch identity and existing accepted ease interval, as stated above.
- **Arithmetic/inference:** the endpoint RMS and candidate width/height/POM consequences follow from the exact source Bézier construction and the S423 endpoint formula. This does not establish garment fit or factory construction.
- **Design decision needed for any alternate source repair:** whether Polo should gain a distinct cap width plus a separately located underarm/bicep measurement station, and the station's construction position/relationship to the current 43 cm POM. The source and existing Polo research define none. A particular station depth would be an invented construction convention; this slice does not silently add one. The only fully specified tested cap-only candidate materially violates the current POM tolerance and is rejected by recommendation. S424's already rejected bicep reduction and the present evidence support keeping the existing pattern and all 34 Polo holds; no additional approval request is made for this nonviable candidate.

## Exit verification

- `npx tsx docs/research/epic17/S427-polo-sleeve-cap-repair-alternatives/probe-candidates.ts`: 17 exact source option rows / 34 face metrics. Baseline matches all S423 residuals; the threshold candidate reaches 0.25 cm at 35.730905 cm cap span, retains 1.5 cm total ease and has a −7.269095 cm `Sleeve bicep width` POM change. All rows produce the same source geometry result; zero sampled candidate combinations pass both residual and POM tolerance.
- `node docs/research/epic17/S427-polo-sleeve-cap-repair-alternatives/render-candidate-overlay.mjs`: rendered actual-source versus in-memory sleeve outlines in Chromium, two contours, zero page/console errors. Manual overlay review confirms a visibly taller cap and narrower cap/side junction; the source hem stays fixed. It is not an assembled or accepted flat.
- Start board preflight/replay from revision 2503→2505 preserves all statuses; start `npm run control-center:test` passes 42/42. Validated exit commands move the board 2505→2514 without status changes and link the packet, matrix and rendered overlay. Exit `npm run control-center:test` passes 42/42; `readBoardFile()` and `git diff --check` pass. Two interim focused test failures were caused by outdated summary-phrase assertions and are documented in `S427-control-center-test-failure-notes.md`.
- Diagnostic-only slice; no production source, tests, renderer, geometry, stitch graph, POM or export baseline changes. The all-repository coverage/build/export/146-face rendered gate remains reserved for the settled integrated Epic candidate.

Elapsed 2026-10-07 16:19:12–16:27:12 UTC (8m): implementation 0m; focused verification ~3m (17-option diagnostic, board preflight/replay, Control Center 42/42); rendered-output review ~2m; durable packet/board/context/state and closeout ~3m; maintainer-decision time 0m; external-agent waits 0m.

**Next action:** do not implement the cap-span trial. Continue the independent Woven all-face review with current source/output evidence while retaining the exact sleeve/Polo holds and all G04 gates.
