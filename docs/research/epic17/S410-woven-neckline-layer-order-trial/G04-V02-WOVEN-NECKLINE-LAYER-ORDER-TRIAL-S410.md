# G04 V02 — Woven neckline/collar layer-order trial — Slice 410

## Start boundary

- Started 2026-10-07 08:07 UTC from clean S409 commit `0ef673d807173fc7121e4e2f7964109fe970c752` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice was 409; S410 is uniquely reserved. Canonical board revision 2358; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Primary usage 33%, weekly 5%, ordinary work allowed.
- The user's latest collar-over-plackets approval reaffirms S406 and is already implemented. S407's separate choice remains unresolved: keep the body neckline seam continuous with the current contact/crossing, or accept a view-only clip that hides 0.8426–0.8433 cm per side under the projected collar. Preserve both production behavior and all face holds.

## Scope and diagnostic hypothesis

Test one diagnostic alternative against the exact S406 `live-draft:woven-shirt:14:14` output: keep both complete source `front.neckline` strokes and draw them above the projected upper/under-collar outer contours at their two mirrored center-front contacts. Keep the collar above the already-approved plackets and leave all other element order, clips, marks, labels, source paths, colorway, options, cut geometry and stitch topology unchanged. Compare actual Chromium detail and whole crops for `woven-shirt-default`, `neckEase-min`, and `neckEase-max` against S406 baseline and S407's collar-foreground seam-clip candidate.

Determine whether this view-only layer order preserves the continuous base seam while making the joined interface clearer, or creates a misleading seam-over-collar crossing/unreadable knot. This is a diagnostic trial only; do not implement it in the production renderer and do not assume its layer interpretation is construction evidence.

## Acceptance, gates and non-goals

- Bind each trial to the exact same-revision source entity/path and two measured S407 crossing stations. Prove the source neckline path `d`, source IDs, geometry, POM identities/schedule, colorway and back output are otherwise unchanged. Verify no unrelated entity is reordered.
- Render actual SVGs with Chromium and inspect default, neckEase limits, whole and detailed crops; record browser errors and visual consequence. Preserve every Woven/Polo hold and all-seven V02 acceptance.
- No production source/output, source/cut/stitch geometry, new physical seam/notch, gap, POM, option, threshold, approval, face status, or G04 V02/V03 criterion change. No general construction research, UI redesign, G05/G09 work, CAD claim, physical sample, supplier/launch action or factory claim.
- Run focused diagnostic syntax/data checks, preflight and replay board evidence through `executeBoardCommand`, `npm run control-center:test`, and `git diff --check`. No production code changes, so changed-code coverage/build/export gates are not triggered; the global gate remains at the settled Epic/PR candidate.
- No safe delegation: this one variant is bound to the same source path and renderer layer contract as S407. Codex retains output review and integration ownership.

## Start-board record

`S410-start-board-commands.json` records the validated start replay from board revision 2358.

## Exit record

### Source-bound paint-order finding

- The proposed “draw the continuous body neckline over the collar” order is already the actual S406 production SVG order in **all 28** Woven options at `live-draft:woven-shirt:14:14`. Each front has four projected `underCollar`/`upperCollar` outline path instances at SVG DOM indices 17–20 and both complete source `front.neckline` strokes at indices 21–22. SVG paints later paths over earlier paths, so the complete body seam already crosses over the collar outline. A same-order trial would be a no-op; no duplicate renderer output was generated.
- This matrix is built from exact entity IDs, source IDs and path data in `woven-neckline-paint-order-matrix.json`. The option rows are all bound to the same revision; each retains four collar outlines and two source neckline strokes. No source path, cut/stitch geometry, POM, annotation, colorway or renderer content was changed.
- Actual S407 Chromium baseline and clip-trial crops were inspected at default and both `neckEase` limits. In baseline, the continuous body neckline paints over the collar at the two mirrored contact stations. The S407 trial removes the center-front-to-contact portion of that source seam (0.8426–0.8433 cm per side), so the collar outline is exposed through the interruption. That change removes the line crossing but visibly breaks S342's approved continuous base-seam stroke.
- **Decision clarification:** S407 is not proposing a global SVG order swap; that order already exists. Its exact choice is whether a view may omit the stated portion of the source body neckline so the collar outline is visible at those stations, or whether to keep the complete seam and retain the front hold. The source stitch only establishes the neckline/stand base join; neither source topology nor approved S406 collar-over-plackets order establishes this body-seam occlusion. Treat clipping as a proposed design convention, not source evidence. The earlier collar-over-plackets approval does not answer it.

### Conclusion, holds and verification

- S410 rules out a distinct full-stroke foreground alternative: it is current behavior and leaves the repeated contacts unchanged. The existing S407 clip trial remains the only reviewed display treatment in this exact pair that removes the contact, with the documented base-seam interruption tradeoff. No production implementation or semantic mapping was changed.
- All 56 Woven and 34 Polo views remain held; all-seven acceptance, Polo's 0.25 cm gate, V02-before-V03, export/DXF identities and V03 rights/round-trip gates remain unchanged. The S381 no-gap back-hem disposition is not reopened.
- `inspect-source-layer-order.mjs` passes syntax and reconciles all 28 revisions, path counts, stable IDs and painter order. The actual S407 browser crops are reused as evidence for baseline and clip behavior; no new browser trial was needed because the alternate order is identical to production. Board start replay advanced 2358→2361; exit commands were isolated-preflighted and applied through the validated layer to revision **2365**. `npm run control-center:test` passes 42/42; `git diff --check` passes. No production code changed, so global coverage/build/export gates remain for the settled Epic candidate.
- Elapsed approximately 2 minutes (2026-10-07 08:07–08:09 UTC): source/output order trace 1m; actual crop comparison and closeout 1m; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** preserve all holds and present the clarified S407 seam-interruption decision; do not conflate it with the already-settled collar-over-plackets approval.
