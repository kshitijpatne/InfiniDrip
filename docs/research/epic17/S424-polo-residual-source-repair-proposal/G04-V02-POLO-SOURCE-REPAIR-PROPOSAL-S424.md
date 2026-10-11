# G04 V02 — Polo source-repair proposal — Slice 424

## Start boundary

- Started 2026-10-07 09:45:27 UTC from clean S423 `ab7a44db3b48f89f06849984931635b8a208da85` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice was 423; 424 is unique. Board revision 2469; V01 Done, V02 In Progress, V03 Backlog. Goal remains active. Usage at entry: 52% primary / 8% weekly.
- S423 proves source-supported rigid mapping cannot pass the fixed 0.25 cm gate. All 34 Polo faces remain held. No pattern-source repair is approved.

## Scope and decision boundary

Use the live Polo drafting source and all 17 existing option rows to construct one concrete source-only sleeve-cap repair proposal that retains the current body, option values, source stitch identity and 1.5 cm authored total cap ease. Measure the effect on sleeve dimensions and the endpoint-only assembly gate. This is diagnostic/proposal work only: do not modify production source, stitch graph, cut geometry, renderer, thresholds, output acceptance or holds. Do not claim fit or factory acceptance.

## Proposal to test

S423 found a 0.958604 cm cap/armhole half-chord mismatch. A hard-anchored RMS no greater than 0.25 cm requires a mismatch no greater than 0.353553 cm; this proposal targets 0.20 cm RMS (0.282843 cm mismatch) for margin. Test changing the sleeve component's `bicep` input only, which contracts the sleeve's full cap endpoint span and its full width by the same amount while the existing solver re-solves cap height to keep total cap arc length at the unchanged front-plus-back armhole length + 1.5 cm. Do not implement unless the maintainer accepts the dimensional tradeoff and the exact rendered/all-option verification plan.

## Required evidence

- Calculate the minimum `bicep` reduction needed for the 0.20 cm diagnostic target from exact `draftPolo` source and run the candidate through all 17 option rows, front and back.
- Record resulting cap arc length, endpoint chord mismatch/RMS, bicep dimension delta and unchanged source authored ease. State which existing source POM(s), body/armhole shapes and topology change or remain stable.
- Produce a rendered candidate crop from actual pattern source or explain why the candidate cannot be truthfully rendered without changing production code. Compare existing sleeve side and cap contour; do not interpret the diagnostic as fit evidence.
- Present the exact proposed edit location and value, verification gates needed after approval, tradeoff, and all held views. Await explicit implementation approval.

## Non-goals

No production implementation, source/stitch graph edit, threshold relaxation, display-only workaround, V02 release, new construction convention, physical sample, fit claim, or factory claim. Preserve all-seven V02, V02-before-V03, legacy DXF and protected export identities.

## Candidate results and recommendation

The live source's sleeve component computes width as `measurements.bicep + ease * 0.5`, uses that same width for the cap endpoints and the body of the sleeve, and solves cap height to the source total armhole length + the unchanged 1.5 cm `CAP_EASE`. A first search limited to a 5 cm raw-bicep reduction did not reach the 0.20 cm target. Extending the in-memory search found a unique reduction of **8.654851 cm** for all 17 rows: standard raw bicep circumference 38 cm → 29.345149 cm; finished sleeve-bicep span 43 cm → 34.345149 cm. This is a 20.1% reduction in the finished span. The re-solved candidate retains 1.49999999 cm total authored cap ease, has 0.200000 cm hard-endpoint RMS on both faces, and leaves body armholes and the source `Sleeve-cap ease` stitch unchanged.

The 17-row matrix is `candidate-matrix.json`. The actual source-piece overlay is `candidate-sleeve-overlay.svg` and its Chromium render is `candidate-sleeve-overlay.png` (gray: current sleeve; blue: in-memory trial, center-aligned). The render shows a substantially narrower cap and sleeve body. It is a sleeve-piece diagnostic, not a complete assembled technical flat; it makes no fit or physical construction claim. The candidate RMS is calculated from the same S423 endpoint-chord formula; it was not re-run through the production assembly compiler because the source proposal is not integrated. Exact source locations are `src/drafting/sleeve.ts` (`width`, `capHeight`, `capCurves`) and the Polo caller in `src/drafting/polo.ts`. No repository production source or tests changed.

**Recommendation: reject this simple bicep-input repair.** It would change the user-facing Sleeve bicep width POM by 8.654851 cm for every Polo draft, solely to satisfy the endpoint display gate. The code contains no source-backed instruction to apply that reduction, and no physical sample validates the result. A useful repair would need a separately sourced/design-approved sleeve-cap construction that changes the cap endpoint span while preserving a meaningful sleeve-bicep measurement and seam topology. This diagnostic does not establish such construction. Do not implement this trial or substitute a display distortion. Keep all 34 Polo faces held and the 0.25 cm gate unchanged.

## Exit evidence

- The exact in-memory candidate passes the 0.20 cm diagnostic endpoint RMS target and preserves 1.5 cm total source-authored ease in all 17 options / 34 face requests; raw parameter and finished span change are fully recorded above.
- Chromium-rendered actual source sleeve outlines were visually reviewed. The candidate is markedly narrower; no assembled output is accepted.
- `npm run control-center:test`: 42/42 passed. Candidate matrix generation and Chromium render complete; start/exit scripts pass syntax checks; `git diff --check` passes.
- No production code/test changed. Global coverage/build/export-identity/browser gates remain for the settled integrated Epic candidate; 56 Woven and 34 Polo faces remain held; V01 Done, V02 In Progress, V03 Backlog.
- The maintainer's latest Woven collar-over-plackets reply repeats the S406 mapping already implemented and verified; it does not authorize a new geometry edit or clear S410's separate neckline/base-seam hold.

Elapsed from 09:45:27 to 09:50:36 UTC (5m09s): source inspection and candidate exploration ~2m; all-option matrix and rendered review ~1m; focused verification and durable closeout ~2m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** present the exact 8.654851 cm Polo bicep reduction and its rendered tradeoff for a design decision; recommend retaining the current source and 34 holds unless a pattern-specific construction repair is approved. Continue independent V02 work; do not relax acceptance or alter the 0.25 cm gate.
