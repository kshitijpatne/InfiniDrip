# G04 Woven source candidate study — Slice 447

## Start boundary

- Started 2026-10-07 22:47:58 UTC from clean S446 commit `28b9859de91590419124df688e4479fdceea37db` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice was 446; S447 is reserved.
- Canonical board revision 2675: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog, 56 accepted / 90 held across 73 configurations / 146 faces. Goal active and aligned.
- Usage at start: primary 46%, weekly 21%; ordinary work allowed.

## Scope and authority

Continue the user-authorized G04 blocker investigation without asking them to design the geometry. Search only a source-motivated Woven sleeve drafting parameter for a source-shape candidate that may clear the repeated back hem crossing while preserving the exact sleeve-cap interfaces and fixed S370 layout. Use the real source draft and production flat compiler/renderer in memory, across all 28 Woven option rows; retain rendered output for review. This is a diagnostic study only. Do not write a production source, mapping, test, recipe, option contract, stitch graph, acceptance, or view-status change. No collar projection trial: S359 and full-base-seam choices remain settled. Front collision math remains bounded by S446 and must not be reopened.

Candidate domain is justified by source code: `wovenSleeve()` owns one fixed `taper=3 cm`, uses it to set both hem endpoints, then stitches the full hem to `sleeveBand.top`. Examine only the continuous 0–6 cm taper interval around that authored 3 cm value (no negative taper/flare or asymmetric sleeves); keep all other source and view parameters unchanged. A candidate is not viable unless every option preserves cap-to-armhole and hem-to-band joins, clears the sleeve-pair and body/yoke crossings, clears the fixed S370 band-detail footprint and existing frame, and renders legibly. If the bounded source knob cannot satisfy these gates, report no-go without widening the parameter search.

## Acceptance/evidence boundaries

- Bind all candidate output to source revision `live-draft:woven-shirt:14:14` plus explicit candidate identity; never label candidate geometry as current production output.
- Generate actual `FRONT_FLAT`/`BACK_FLAT` SVGs with current compiler/renderer from in-memory modified drafts, and inspect actual Chromium output for any candidate that clears geometric screening.
- Preserve original controls, source paths, source geometry, POMs, artwork/colorway, same-revision joins, complete hems, fixed S370 positions, all seven recipe acceptance, all current holds, legacy DXF, protected export identities, and V02-before-V03.
- No candidate means no candidate-render gate; record the exact reason. No physical-fit, factory, supplier, or production-readiness claims.
- No independent disjoint work is safe: draft mutation, compiler output, option metrics and rendered joins are one coupled contract. Codex retains sole integration/review ownership.

## Start-board record

Validated replay of `S447-start-board-commands.json`: board revision 2675→2677; status and tally unchanged.

## Candidate result

- The actual production recipe/technical-flat compiler/renderer processed 13 taper values (`0, 0.5, …, 6 cm`) over all 28 current Woven source-option rows: 364 in-memory source candidates, 728 emitted SVG faces at revision `live-draft:woven-shirt:14:14`. Compile/render issue count and browser-error count are zero.
- The candidate mutates only lower sleeve hem endpoints and matching band width in the in-memory draft. Both cap curves/endpoints and the receiver armholes are unchanged; each candidate `sleeve.hem`/`sleeveBand.top` length matches exactly. No current production source changed.
- **No candidate is viable.** At every one of the 13 taper values, the two back sleeve outlines still cross in all 28 options; all 28 backs have sleeve strokes penetrating the body/yoke fill. No front sleeve-pair/body crossings appear. No value intersects either fixed S370 detail box, all views stay within the existing frame, and no compiler/renderer issue appears. This source knob cannot remove the topology conflict.
- The measured finished sleeve opening is `43 - 2*taper cm`: 43 cm at taper 0, 37 cm at the authored taper 3, and 31 cm at taper 6. The tested range changes the opening by +6/−6 cm from current and still leaves every back crossing. A larger parameter search would alter fit-relevant sleeve opening without addressing the crossing and is not justified.
- Reproducible matrix: `S447-taper-candidate-matrix.json`; generating/screening script: `render-taper-candidates.mjs`. Actual Chromium review of 24 sample SVGs (default, `collarLeafDepth-min/max`, and `combined-supported`; taper 0/3/6; front/back) has zero browser errors and is retained under `candidate-rendered/`. The three default-back crops visibly retain the central crossing at all taper endpoints and current value. Source revision, fixed band positions, POM schedule and face holds are unchanged.
- Two harness-only errors were diagnosed and corrected: the first full pass hit an undefined reporting shorthand (`svg` instead of `face.svg`) after rendering; the sample renderer then used a Windows URL pathname that doubled the drive prefix. Corrected runs completed with zero browser errors; neither failure involved production code or gate output.

## Slice exit

- The authored taper is not the missing source degree of freedom. Keep the Woven back holds; do not change `taper`, move S370 details, or imply an over/under/gap.
- S447 leaves the Woven front contacts and all 56 Woven/34 Polo holds unchanged. All-seven V02, V02-before-V03, legacy DXF, protected export identities, and the V03 rights/round-trip gate remain unchanged.
- Focused closeout: all S447 `.mjs` scripts pass `node --check`; `npm run control-center:test` 42/42; canonical board read and validated exit replay pass, board revision 2679; `git diff --check` passes. Production unit tests/build/coverage/export gates are not due because production code/tests did not change.
- Elapsed 2026-10-07 22:47:58–22:56:29 UTC (8m31s): production implementation 0m; diagnostic harness/mutation work ~2m; 728-face compiler/render matrix and geometric scan ~3m; sample Chromium rendering/review ~1m; durable closeout and board verification ~2m31s; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** continue only with a different source-supported degree of freedom capable of clearing the fixed-band conflict. Do not expand the taper search. If current source/evidence cannot define such a candidate without inventing construction, present the precise design authority needed and preserve all holds.
