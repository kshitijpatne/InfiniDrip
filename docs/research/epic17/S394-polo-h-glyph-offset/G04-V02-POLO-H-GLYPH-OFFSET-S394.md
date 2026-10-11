# G04 V02 — Polo H glyph offset — Slice 394

## Start boundary and authority

- Started 2026-10-03 04:26:06 UTC from clean S393 commit `3ec8bbf` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 393; S394 is uniquely reserved. Board revision 2161 records S393; EPIC-17 and G04-V02 remain In Progress, V01 Done, V03 Backlog. Primary usage 32%; weekly 98% informational.
- The maintainer approved S393's exact H-letter translation `(+0.45,+0.45 cm)` on 2026-10-03. This authorizes a view-only H glyph offset and option-wide validation, not face acceptance or changes to marker centers, source geometry, POM data, labels, schedule, or projection.
- S393 binds both H POMs to `front.edge.shoulder` at `(7,0)` cm, grouped under a fixed radius-0.22 cm ring. The distinct `front:shoulder` and `outerStand:shoulder` source marks remain visible and unrelated; no stitch join is inferred. Its 17-option candidate has positive measured path/mark/text clearance, with the letter 0.186332 cm beyond the ring stroke and no leader.

## Scope and acceptance criteria

- Add the exact approved `(+0.45,+0.45 cm)` translation to the Polo H glyph only in `src/render/technical-flat-svg.ts`.
- Add focused assertions that the H text moves to the approved coordinate while both source-centered H ring positions/radius, POM source/target/revision identities and full schedule rows remain unchanged. Verify H in non-Polo and E/I/D/C behavior remain unchanged.
- Replay all 17 supported Polo option rows with the production renderer, bind source revision/options/POM schedule identities, retain exact source paths and both H source marks, and inspect actual default and limiting rendered output. Compare geometry and paired back output to baseline.
- Require focused tests and 100% statement, branch, function and line coverage for the changed production module; run the production build and relevant protected export/byte-identity checks. Preserve browser/output evidence, zero console errors, and current output holds.
- **Pass for this slice:** the approved H glyph-only change renders across all 17 options, retains its fixed ring and exact source/schedule identities, produces no new renderer/browser errors or obscuring overlap, and leaves unaffected output unchanged. This does not pass Polo V02 or release a face.

## Required verification and non-goals

- Follow `AGENTS.md` and `docs/OPENCODE-WORKFLOW.md`; no safe delegated work exists because renderer change and exact output review are coupled.
- Preserve all 34 Polo face holds, including the independent 0.68 cm sleeve-cap residual against 0.25 cm. Preserve all-seven recipe acceptance, V02-before-V03, legacy DXF behavior, protected export byte identities, every other G04 hold, and V03 rights/receiver/round-trip gates.
- No source/cut/stitch/POM/marker-center/schedule/source-mark changes; no acceptance, gate, threshold or hold changes; no general typography redesign, UI work or CAD work in this slice. No physical-fit, factory-acceptance or production-readiness claim.
- Global coverage and integrated Epic browser/output gate remain reserved for the settled candidate unless this slice proves independently mergeable.

## Start-board record

Preflight and validated replay are captured by the S394 start command packet and scripts in this directory. The canonical board remains In Progress for EPIC-17/G04-V02.

## Exit record

### Implementation and option-wide evidence

- Implemented only Polo H text coordinates at `src/render/technical-flat-svg.ts`: anchor `(7,0)` plus the approved `(0.45,0.45 cm)` glyph offset, producing `text x=7.45, y=0.52`. The shared open ring stays at `(7,0)`, radius `0.22 cm`. Both POMs (`pom:polo:shoulder-seam` and `pom:polo:neck-width`), their source edge/target/revision data, both separate source shoulder marks, all paths and schedule content are unchanged. Non-Polo H, Polo E/I/D/C and other keyed behavior retain their established coordinates.
- Focused `npm run coverage -- src/render/technical-flat-svg.test.ts --coverage.include=src/render/technical-flat-svg.ts`: 38/38 tests pass; changed renderer module is 100% statement, branch, function and line coverage. The first run failed only because the new schedule assertion omitted the established `H  ` key prefix; corrected the assertion to the emitted full row and reran successfully. `npm run build` passes with the existing Vite large-chunk advisory. `npx vitest run src/quality/export-identity.test.ts` passes 9/9 and `npx vitest run src/export/regression.test.ts` passes 8/8, including legacy DXF hashes. Both S394 evidence scripts pass syntax checks and `git diff --check` passes.
- The actual production renderer/Chromium harness replays all 17 exact S331-supported Polo option values under S394 revision-bound IDs. Keyed front renders pass 17/17 with zero keyed renderer issues and zero browser errors; 170 source-centered POM entries retain eight keyed stations per front, seven open rings and eleven complete full-text schedule rows. All 17 colorway overlays render and all 17 paired backs are unchanged. The H marker retains exactly two source POM identities at `(7,0)`, with ring radius `0.22`, and its text is `(7.45,0.52)` on every option. Source/mark geometry and identities compare unchanged to the unkeyed same-run view.
- `verify-h-glyph-output.mjs` compares actual S394 renderer SVGs with S390 output for the identical 17 option rows. After restoring only the H glyph coordinates and normalizing S394 revision/title tokens, all 17 SVGs are byte-identical to S390. This confines the renderer delta to the approved H letter translation plus revision/title identity. Evidence is `h-output-diff-verification.json`; metrics are in `polo-keyed-marker-trial-matrix.json`; full SVGs, whole views, detail crops and schedule crops are in `rendered/`. Manually inspected actual Chromium H crops for `polo-default`, `polo-standFrontRise-max`, and `polo-collarPointExtension-min`; H is legible and the two source shoulder marks remain present and discernible. No source relationship or stitch join is implied by the moved glyph.
- The same current-source replay still reproduces three unkeyed baseline `TEXT_COLLISION` rows for C: `collarLeafDepth=max`, `standFrontRise=max`, and `collarPointExtension=min`; all keyed renders have zero renderer errors. This is preserved historical C baseline behavior, not an S394 regression or addressed scope. Other Polo display/topology holds and the independent 0.68 cm sleeve-cap residual against the fixed 0.25 cm gate remain. **All 34 Polo faces stay held; zero production holds were released.** All-seven recipe coverage, V02-before-V03, V03 rights and round-trip gates, legacy DXF behavior, protected identities, and no-fit/no-factory claim limits remain unchanged.

### Validated closeout

- Board start revision 2161–2165; exit commands were clone-preflighted and replayed through `executeBoardCommand`, closing at revision 2175. EPIC-17/G04-V02 remain In Progress, V01 Done, V03 Backlog. `npm run control-center:test` passes 42/42 after exit replay.
- Elapsed 04:26:06–04:35:53 UTC (about 9m47s): implementation and focused source review about 1m; focused tests, 100% coverage, build and export/DXF checks about 3m; 17-option browser replay, byte comparison and rendered review about 3m; durable packet/board/state/control-center closeout about 2m47s; external-agent waits 0m; maintainer-decision time 0m (approval preceded S394).
- **Exit status:** the approved Polo-only H glyph offset is implemented and verified across all 17 option rows. It does not clear Polo V02. G04 remains In Progress; no V02 exit or V03 work is authorized by this slice.
- **Single next action:** refresh Git, board and usage at the verified S394 commit; reserve S395 for the highest-priority remaining repeated G04 V02 output blocker while preserving all holds and acceptance gates.
