# G04 V02 — Polo current-output review correction — Slice 409

## Start boundary

- Started 2026-10-07 08:03 UTC from clean S408 commit `12b725557bb533fb7e229748cbea30261d907f4d` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice was 408; S409 is uniquely reserved. Canonical board revision is 2351; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Primary usage 32%, weekly 5%, ordinary work allowed.
- S408's review used S394 images for MQF-012 even though S399 contains a later Polo glyph change and all-17 production replay. S409 will inspect S399's exact current artifacts, establish whether its view preserves the S394 collar/neckline finding and update the review accordingly. No new output is assumed.
- The latest Woven collar-over-plackets approval remains satisfied by S406. The distinct S407 Woven center-front seam decision remains pending; this slice does not touch it.

## Scope and acceptance

- Inspect S399's 17-option production-renderer matrix, exact revision/options, corresponding default and limiting actual Chromium whole/detail output, and its change relative to S394.
- Reassess only the Polo evidence portion of MQF-012 from S408. If the collar/neckline geometry is unchanged and the later FG glyph move does not bear on that finding, explain the scoped basis; otherwise correct the review to S399 evidence. Keep MQF-012 **To be reviewed**, state the remaining interpretation gap, and retain all 34 Polo holds.
- Supersede any stale S408 phrasing that calls S394 the latest applicable Polo output. Keep S408's other finding dispositions, all G04 gates, deferrals, and all-seven acceptance unchanged.
- Preflight and replay a bounded additive board update through `executeBoardCommand`; validate current board, run `npm run control-center:test`, evidence script/JSON syntax checks and `git diff --check`.

## Non-goals and gates

No production source/output change, design decision, new construction research, source/cut/stitch/POM/option modification, release of views, threshold or acceptance change, export change, UI redesign, G05/G09 work or CAD implementation. Preserve the Polo 0.25 cm residual gate (current 0.68 cm), all-seven V02, V02-before-V03, every existing hold, legacy DXF, protected export byte identities, V03 rights/profile/import/round-trip gates and physical/factory boundaries. No safe delegated work exists; this versioned evidence correction is kept with its underlying rendered evidence.

## Start-board record

`S409-start-board-commands.json` and `replay-start.mjs` record the validated start at revision 2351.

## Exit record

### S399 evidence and finding correction

- The S399 current production-renderer package contains 17 distinct Polo option rows with S399 revision-bound IDs. All are `rendered`, retain 11 full schedule rows, source-centered marker identity, paired-back identity and colorway fill. Its S394 baseline comparison records 17 keyed fronts, 17 colorway fronts, 17 unchanged paired backs, zero browser errors, zero production holds released, and the unchanged 0.68 cm sleeve residual against the 0.25 cm gate.
- `fg-output-diff-verification.json` establishes that restoring only the FG glyph coordinates and normalizing S399's revision/title tokens makes every S399 SVG byte-identical to S394. The FG ring, source POM IDs/targets/entities, all source paths/marks, full schedules, colorway and pattern geometry are unchanged. S394 remains the comparison baseline, not the current output reference.
- I inspected actual S399 default whole/detail/schedule output, `collarPointExtension-min` whole/detail output, and the `standFrontRise-max` H crop. FG's approved text translation places its label above-left of the fixed ring; the collars/neckline and placket paths remain crowded/crossing at the source geometry, and the H ring retains visible contacts among independent marks and contours. The whole image provides scale context; the detail crops expose these contacts. This does not establish physical construction.
- **MQF-012 correction:** S408's Polo reference is corrected from S394 to S399. The current Polo flat visibly depicts the collar/neckline, but the exact same-revision source paths remain visually congested and the updated label does not resolve the underlying report. Root cause and a construction-truth decision remain undetermined. MQF-012 is still **To be reviewed**; all 34 Polo faces remain held. Other S408 finding results/statuses are unchanged.
- The evidence check script initially failed on two assumptions: it expected fields named `scheduleRows`/`ringUnchanged` instead of `fullScheduleRows`/`sourceCenteredMarker` in the S399 matrix, then expected “were byte-identical” where the source record says “are byte-identical.” Inspection confirmed the durable records; assertions were corrected to the exact schema/prose and the check now passes. No source/test/output was changed.

### Verification and closeout

- `verify-s399-polo-evidence.mjs` passes, reconciling all 17 distinct current revisions, complete schedule/marker/back/colorway flags, byte-diff rows, zero released holds and unchanged residual values. Script syntax and S409 JSON checks pass.
- Start-board replay advances 2351→2354. Exit commands are preflighted on an isolated board and then replayed through the validated command layer to revision **2358**. `npm run control-center:test` passes **42/42**; `git diff --check` passes. This evidence correction changes no production output, so global coverage/build/export/browser gates remain at the settled Epic candidate.
- EPIC-17/G04-V02 remain In Progress; G04-V01 Done and V03 Backlog. All 56 Woven and 34 Polo views remain held; all-seven V02, Polo 0.25 cm, V02-before-V03, export/DXF, V03 rights/round-trip and physical/factory gates are unchanged.
- Elapsed time is approximately 3 minutes (2026-10-07 08:03–08:06 UTC): version/evidence inspection and rendered review 1m; script correction/check 1m; S408/state/context/board correction and validation 1m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** keep all holds and the S407 neckline decision intact; return to the next independently evidenced G04 blocker.
