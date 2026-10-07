# G04 V02 — Polo H segmented locator trial — Slice 419

## Start boundary and authority

- Started 2026-10-07 09:09:39 UTC from clean S418 `02d9bb8e763f37cc2e79d4f11a8f7854e69d1320` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 418; S419 is uniquely reserved. Canonical board revision 2435; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Goal remains active and matches admitted scope. Usage at slice entry is 44% primary / 7% weekly.
- S416 established that every tested smaller continuous H ring still crosses a source contour; the approved exact station remains `(7,0)` with a 0.22 cm open ring, H glyph and full POM schedule. S419 tests a **diagnostic-only segmented-ring rendering** at the same center/radius, omitting only those arc portions that conflict with emitted source strokes/marks. This is not a production mapping or a claim that the ring is a physical notch.

## Acceptance and boundaries

- Use the same 17 saved S399 Polo `FRONT_FLAT` SVGs and exact revision IDs. Keep marker center, 0.22 cm radius, key identity, glyph location, POM values/targets/schedule, source paths/marks, options and pattern revision unchanged.
- Detect ring-to-path/mark interference in actual transformed component geometry; remove only colliding ring-angle spans in the diagnostic derivative, then measure the remaining arc count/length and spacing, retained clearance, and whether the marker still reads as one source-centered locator in actual rendered output.
- Review default and worst-case options in Chromium. If any option requires deleting so much ring that the point becomes ambiguous, hides a source feature, or leaves inconsistent/misleading indicators, reject the treatment and keep all 34 Polo faces held. No production change without a later explicit approval and complete option-wide verification.
- Preserve the 0.68 cm RMS residual against the unchanged 0.25 cm gate, all-seven V02, V02-before-V03, all current holds, legacy DXF, protected export byte identities and V03 rights/profile/round-trip gates.

## Non-goals and gates

No moving the H anchor, glyph, schedule or POM target; no cut/source geometry, stitch, option, threshold or acceptance change; no face release, V03 work, physical fit/factory claim or unrelated UI changes. No safe disjoint delegation: one same-revision marker/path trace and rendered comparison. Run diagnostic assertions, script syntax, actual Chromium review, validated board replay, focused Control Center tests and `git diff --check`; global coverage/build/export/browser gates remain for the settled integrated Epic candidate because production code is untouched.

## Start-board record

Validated start replay: `S419-start-board-commands.json`, board revision 2435→2438.

## Exit evidence

Pending.

## S419 results — segmented H locator feasibility

### Exact source mapping and method

All 17 saved S399 `FRONT_FLAT` SVGs were used with revision `live-draft:polo:S399:<caseId>`. The existing `H:key-marker` binds both `shoulder-seam` and `neck-width` source POM identities to the source-centered station `(7,0)` and front outline targets. The trial keeps the approved 0.22 cm radius, H glyph position, full schedule, POM targets, source marks, component paths, option values and revisions.

For each exact transformed output, Chromium tested 720 points around the ring against all current component path strokes and independent source mark strokes. Ring-angle spans containing a stroke hit were omitted, then buffered by 0.045 cm along the circumference. Segments shorter than 0.04 cm were dropped. Only the H circle in an in-memory SVG derivative was replaced with 2–3 round-capped arcs; no production source or baseline output changed. A second Chromium pass sampled the retained arcs at no more than 0.002 cm spacing against the exact component and mark strokes.

### All-option result

- The current continuous H ring intersects at least one source stroke in **17/17** options. The recurring source obstacles are `front:outline` and `outerStand:outline` (17/17); under/upper-collar outlines also touch at `standHeight-min` and `standFrontRise-min` (2/17); `outerStand:shoulder` mark also contacts at `standFrontRise-max` (1/17).
- The segmented diagnostic retains **60.139–72.361%** of circumference as **2–3 arcs**, with minimum retained segment length **0.08639 cm** after discarding micro-arcs. The retained arcs have **zero sampled contacts** with source component or mark strokes in all 17 options.
- DOM assertions prove the source component path IDs/data, independent marks, H identity/anchor/targets/glyph, and the full POM schedule are unchanged in every derivative. The H locator center/radius and exact S399 revision remain identical.
- Matched actual Chromium baseline/trial crops were inspected for `polo-default` and the least-coverage case `polo-standFrontRise-min`; browser/page errors are zero. The locator remains identifiable, and crossing source paths remain uninterrupted. The nearby source “SHOULDER” labels remain crowded; this localized ring treatment does not resolve unrelated POM/callout readability or Polo assembly.

### Decision boundary and holds

This is a concrete view-only annotation proposal, **not approved for production implementation yet**: replace the continuous 0.22 cm H ring with the option-specific 2–3 open arcs produced by the recorded 0.045 cm source-stroke clearance rule, dropping arcs shorter than 0.04 cm. Tradeoff: source paths/marks stay visible and the ring no longer crosses them, while the circular locator appears segmented and its arc count varies with current option geometry. If rejected, keep the current approved ring rendering and fail the affected Polo faces closed. If approved, approval covers implementation and option-wide verification only.

All **34 Polo faces remain held** either way: the independent production-mapped sleeve-cap residual remains 0.68 cm against the unchanged 0.25 cm gate; nearby label/callout review and all other V02 checks still apply. All 56 Woven faces remain held, including the distinct pending S410 neckline/base-seam decision and S381 back hem. No face is released and all-seven V02 remains unmet; V03 is not started.

### Verification and slice exit

- `try-segmented-h-locator.mjs` generates the 17-option matrix, candidate SVG derivatives, matched baseline/trial renders, and post-paint source-stroke checks. `check-segmented-h-locator.mjs` verifies all 17 exact revisions, zero post-paint contacts, unchanged source geometry/marks/H/POM schedule and minimum locator coverage. Both scripts pass syntax and assertions.
- Actual Chromium renders are saved in `rendered/`; the full option output and per-option obstacle, clearance, arc-count and coverage data are in `segmented-h-locator-matrix.json`.
- Validated board start/exit replay: 2435→2438 / 2438→2443. `npm run control-center:test` passes 42/42 after board closeout; `git diff --check` passes. No production code changed; no changed-production coverage/build/export gate applies. The integrated full coverage/build/export/browser gate remains due on the settled Epic/PR candidate.
- Elapsed approximately 10 minutes (09:09:39–09:19:39 UTC): source-output interpretation and trial design 2m; 17-option browser geometry and recheck 4m; rendered review 2m; packet/state/context/validated board and focused verification 2m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** do not implement the segmented H marker or release views without the maintainer's decision. Continue independent G04 work while awaiting the H marker and separate S410 neckline/base-seam decisions; preserve every hold and gate.
