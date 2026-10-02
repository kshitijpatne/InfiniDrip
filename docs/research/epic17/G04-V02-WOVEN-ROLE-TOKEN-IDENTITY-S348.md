# G04 V02 — Woven exact source-role identity — Slice 348

## Start boundary

- **Started:** 2026-10-02 01:02 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02 acceptance, documented V03 CAD exchange proof, integration gates, PR, safe merge and required deployment verification.
- **Git:** clean `codex/epic-17-g04` at S347 `5daf9b3af61ae5d3f00baae7126396b3788f1560` (`Slice 347: diagnose Woven role identity and collar output`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 347; reserve 348.
- **Board:** canonical revision 1341. EPIC-14/15/16 Closed; EPIC-17 and G04-V02 In Progress; V01 Done; V03 Backlog. S347 diagnosis/evidence is linked. Integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces.
- **Usage:** primary 7% used; weekly 22% used (informational); ordinary work allowed.
- **Authority:** the maintainer approved the view-only two-instance Woven sleeve/band projection. This slice corrects code that misidentifies the `sleeveBand` source role as `sleeve`; it introduces no new semantic mapping or source construction decision.
- **Dependencies and holds:** S347 source trace and overlays identify the prefix collision. Separately crossing sleeve outlines and detached/crossing collar contours remain held; Woven stays among the all-seven blockers and V03 remains gated.

## Exact slice scope

1. Replace substring matching in `technicalFlatPrimitiveRole` with exact colon-delimited source identity for `role`, `mark`, and `dart` identifiers. Preserve anchored-callout lookup and artwork target-role behavior.
2. Add focused regression cases proving that source role `sleeveBand` selects `sleeveBand` even when `sleeve` is checked first, and that delimiter-boundary role/mark/dart matching remains correct.
3. Re-render the 28 Woven option configurations (56 faces) from production Chromium and inspect role-colored source/output overlays. Verify that the band outline uses its own transform and its `top` interface joins `sleeve.hem`, with no band-induced crossing, overlap, or callout regression.
4. Keep every currently held Woven face held unless every complete-face output criterion independently passes. This narrow identity fix cannot accept the distinct sleeve or collar geometry.

## Gates and non-goals

- Focused tests for changed logic and `technical-flat-live.ts` with 100% statement, branch, function and line coverage; `npm run build`; protected legacy DXF/export identity checks; Control Center command/suite and canonical board validation; `git diff --check`.
- Retain the original failure and before/after replay artifacts, rendered screenshots and machine-readable join/crossing findings. No full repository coverage gate is due until the settled integrated Epic/PR candidate.
- No cut geometry, stitch graph, pattern topology, projection convention, POM value, recipe, option, generic DXF behavior or protected export identity changes. No collar-placement adjustment, remaining sleeve repair, physical sampling, supplier contact, fit/factory/production-readiness claim, V03 receiver selection, or broad UI work.
- No safe disjoint low-risk task is identified; Codex retains code and visual review. OpenCode's exact Muse Spark 1.3 xhigh normal-mode constraint is unchanged and no substitute is authorized.

## Exit record

### Change and results

- **Exact-role implementation:** `technicalFlatPrimitiveRole` now splits source identity on its documented colon separators and matches the full token following `role`, `mark`, or `dart`. Artwork target-role selection and anchored-callout source lookup are unchanged. Regression cases cover the `sleeve` / `sleeveBand` collision, suffix tokens, mark/dart identity, artwork, callouts, and unresolved IDs. No garment geometry, stitch graph, assembly convention, POM definition, export or option changed.
- **Focused checks:** `npm run coverage -- src/render/technical-flat-live.test.ts --coverage.include=src/render/technical-flat-live.ts` passes 32/32 with 100% statement, branch, function and line coverage for the changed production module. The retained option-aware production-SVG audit passes 1/1. `npm run build` passes with the pre-existing large-chunk advisory. Protected export checks pass 24/24 (export identity 9, export regression 8, tech-pack surface 7). `git diff --check` passes. The full repository coverage gate remains for the integrated PR candidate.
- **Production replay:** Playwright Chromium exercised all 28 Woven configurations on both faces: 56 SVGs, zero compiler/browser/console/request errors, and source/revision identity retained. Machine-readable output is in `S348-woven-role-token/production-replay/`; colored role overlays and the reproducible overlay script are in `S348-woven-role-token/role-overlays/` and `render-role-overlays.mjs`.
- **Join audit:** `band-join-audit.test.ts` compares each rendered SVG's source-role band contour to that exact option draft's projection-map assembly of `sleeveBand.top` and `sleeve.hem`. It passes all 56 same-revision faces / 112 reflected band top edges. Maximum source join residual is **2.9e-14 cm**; maximum rendered residual after four-decimal SVG serialization is **0.000063 cm** (limit 0.00011 cm). The face-specific assembly changes with yoke-depth options, so each case is computed independently.
- **Audit repair evidence:** the first overlay-only comparison used the S347 default transform as a fixed expected coordinate and failed at the minimum yoke-depth back view. Inspection confirmed that yoke depth changes the rigid back placement; the retained audit now drafts and assembles every matrix option with its exact projection map before comparing that view's production SVG. This corrects the audit basis, not production geometry.
- **Conditional visual gate fails:** both FRONT_FLAT band instances remain separate with no pairwise contour crossings. Every one of 28 BACK_FLAT outputs has **four proper intersections between the two approved mirrored band contours** (112 recorded crossing points across the matrix). In the standard default back, they intersect at approximately `(0, 23.6651)`, `(-1.8583, 21.1240)`, `(1.8583, 21.1240)`, and `(0, 18.5829)` cm. The orange band outlines and magenta joined edges in the retained overlays make the X-shaped overlap visible. Thus the source-role correction repairs identity and exact seam joins but the approved double-instance back projection still overlaps. Keep all 28 back flats held; do not add an offset, alter multiplicity or change the stitch graph without a separately approved decision.
- **Other complete-face criteria:** default FRONT_FLAT remains invalid because collar/stand contours are detached/crossing. Back sleeve and collar contours and small scaled callouts also remain under review. The replay does not clear the existing complete-face holds. Woven remains 0/56 accepted; integrated total remains **56 accepted / 90 held**, 146 faces. No unsupported face is released.
- **Required findings:** MQF-004–007, MQF-011, MQF-012 and MQF-015 remain **To be reviewed** at their applicable complete-output exits; their status does not authorize scope expansion. Post-G17 deferrals remain unchanged. V02 remains all-seven and In Progress; V03 remains gated/Backlog. No fit, factory-acceptance or production-readiness claim is made.
- **Board and context:** S348 start, verified exit, replay, join-audit and overlay evidence are linked through the validated command layer to G04-V02; the exit report is also linked to the EPIC-17 summary card and Epic record. Canonical board revision **1351** validates; `npm run control-center:test` passes 33/33 after the evidence/comments were added. EPIC-17/G04-V02 stay In Progress, V01 Done and V03 Backlog. Architecture and context index describe exact token identity and the held-state evidence. `git diff --check` passes.

### Timing and next gate

- **Started:** 2026-10-02 01:02 UTC. Exit recorded at 2026-10-02 01:26 UTC; elapsed about 24 minutes.
- **Elapsed breakdown (approximate):** implementation/regression cases 5m; focused coverage, build and protected-export verification 6m; production Chromium replay and per-option source/output join audit 5m; role-overlay generation and visual inspection 4m; durable records and board closeout 4m; external-agent waits 0m; maintainer-decision time during S348 0m.
- **Next action:** diagnose and propose a source-supported or explicitly approved view solution for the Woven BACK_FLAT pairwise band crossings and verify the independent sleeve/collar joins. Preserve complete-face holds while doing so; all-seven V02 still blocks V03.
