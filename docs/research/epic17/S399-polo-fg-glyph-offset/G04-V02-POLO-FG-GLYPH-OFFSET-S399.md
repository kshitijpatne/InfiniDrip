# G04 V02 — Polo FG glyph offset — Slice 399

## Start boundary and authority

- Started 2026-10-07 05:19 UTC from clean S398 `d5daee6f9f684dbc7f19edf934c18ef61b439700` on `codex/epic-17-g04`; refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 398; S399 is reserved. Canonical board revision 2220 records EPIC-17/G04-V02 In Progress, V01 Done and V03 Backlog. Ordinary usage is allowed (primary 1%; weekly 0%).
- The maintainer approved S398's exact diagnostic proposal: Polo FG glyph-only offset `(-0.424264,-0.424264 cm)`. Approval authorizes implementation and option-wide verification only. This slice may change only this annotation's displayed letter position. It must preserve the fixed 0.22 cm open ring at its source anchor, POM source and target identities, revision binding, source marks and paths, full schedule rows, pattern/cut geometry, colorway behavior, paired backs, 0.25 cm residual gate and every current hold.

## Scope and acceptance

- Apply the exact approved offset to the Polo `FG` keyed marker glyph in the production SVG renderer.
- Add focused assertions for marker center/radius, FG source/target IDs, letter coordinates, schedule row retention, and unchanged behavior for other keyed markers and recipes.
- Replay the actual production renderer on the same 17 Polo configurations/options used by S394. Compare each current SVG against its S394 counterpart allowing only the FG letter coordinates and the slice-bound revision/title token. Verify the ring, IDs, source anchors, schedule, paths, source marks, options, colorway, and paired-back outputs are unchanged.
- Inspect actual rendered default and `collarPointExtension-min` details and one whole view; record collision/readability findings. This glyph change may clear only the FG text-placement proposal. Every Polo view remains held because the independent sleeve-cap ease is 0.68 cm against the unchanged 0.25 cm gate and other checks remain.

## Required gates and non-goals

- Focused renderer tests with changed-production-code statement, branch, function and line coverage all at 100%; production build; protected export byte-identity and legacy DXF regressions; Control Center command/test validation; `git diff --check`.
- Use actual renderer outputs and rendered review, not tests alone. Full repository tests/global coverage and integrated full output replay remain reserved for the settled Epic/PR candidate.
- No movement of the marker ring/anchor, POM identity/target/source, full text schedule, source/cut/stitch geometry, exported bytes, threshold, hold or all-seven acceptance. No Woven candidate, V03 work, other callout offset, or unrelated design/UI work. No safe disjoint delegated task is identified for this tightly coupled renderer/output change.

## Start board record

Validated start evidence and command replay are captured in `S399-start-board-commands.json` and `replay-start.mjs`.

## Exit evidence

### Implemented output and rendered review

- The production renderer applies only the approved Polo FG glyph translation `(-0.424264,-0.424264 cm)`. The ring remains fixed at its source-centered 0.22 cm station; both POM IDs and exact front-neckline/button-placket targets remain on revision-bound geometry. No cut/source/stitch geometry, option, colorway, schedule, source marks, path, paired back, DXF writer or protected export identity changed.
- Actual production renderer + Chromium replay covered all 17 S394 option values at revision-bound S399 IDs. All 17 keyed fronts rendered with zero errors; all 17 colorway overlays rendered; all 17 paired backs remained unchanged; there were zero browser errors. Three existing unkeyed C fallback text collisions persist in `collarLeafDepth=max`, `standFrontRise=max`, and `collarPointExtension=min`; keyed output has zero renderer issues in 17/17. This FG change does not alter that reconciliation.
- `verify-fg-glyph-output.mjs` confirms each S399 SVG is byte-identical to its S394 counterpart after restoring only the FG glyph coordinates and normalizing revision/title tokens. All 17 retain the fixed ring attributes, both exact source IDs, both exact targets and source entities, all 11 full-text schedule rows, and all path/mark/colorway content. Detailed evidence: `fg-output-diff-verification.json` and `polo-keyed-marker-trial-matrix.json`.
- Inspected actual Chromium default and `collarPointExtension-min` detail crops plus the default whole flat. In both details the FG glyph sits above-left and reads separately from the stationary ring; the dense underlying neckline/fold/stand/collar/placket paths still cross or touch the ring and remain visible. The whole-flat render keeps the complete schedule, though the pattern-scale glyph is small at page zoom. These are output observations only; they do not establish physical construction or clear other held checks.

### Focused verification and disposition

- `npm run coverage -- src/render/technical-flat-svg.test.ts --coverage.include=src/render/technical-flat-svg.ts`: 38/38 tests pass; changed production module is 100% statements, branches, functions and lines.
- Actual 17-option output replay: 17/17 keyed fronts, 17/17 colorway overlays, 17/17 unchanged backs, zero browser errors. S394/S399 exact diff verification passes all 17.
- `npm run build` passes with the existing Vite large-chunk advisory. `npx vitest run src/quality/export-identity.test.ts src/export/regression.test.ts` passes 17/17, preserving export identity and legacy DXF regressions. `npm run control-center:test` passes 42/42. Evidence scripts and JSON parse; `git diff --check` passes.
- The S397 review of MQF-004–007, MQF-011/012 and MQF-015 remains the current finding-specific reference. Keep applicable findings **To be reviewed** at integrated G04 output exits and retain post-G17 deferrals; S399 does not close a finding.
- All 34 Polo views and all 56 Woven views remain held. The Polo `stitch:Sleeve-cap ease` residual remains 0.68 cm against the unchanged 0.25 cm gate. All-seven recipe V02, V02-before-V03, protected exports, legacy DXF, and V03 rights/profile/round-trip requirements are unchanged. No face is accepted and no physical-fit/factory claim is made.

### Time, board and next action

- Elapsed execution: approximately 6m (2026-10-07 05:19:49–05:25:32 UTC): implementation 1m; focused coverage/build/export/board verification 1m; actual 17-option replay and exact comparison 2m; rendered inspection 1m; durable packet/state/board closeout 1m; external-agent waits 0m; maintainer-decision time 0m.
- Start/exit board revisions: 2220→2222 / 2232. Exit evidence and comments are recorded in `S399-exit-board-commands.json` through the validated command layer.
- **Next action:** continue with one bounded unresolved G04 blocker, starting from the verified S399 exit and preserving every hold. The pending W marker display choice remains independent.
