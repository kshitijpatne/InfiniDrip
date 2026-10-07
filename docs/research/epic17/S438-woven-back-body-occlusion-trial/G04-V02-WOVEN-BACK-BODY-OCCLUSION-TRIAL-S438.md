# G04 V02 — Woven back-body occlusion trial — Slice 438

## Start boundary and authority

- Started 2026-10-07 20:07:51 UTC from clean S437 `bc3e252cee1f1b9fa3b86ad7692445a3cc6fe449` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 437; S438 is reserved. Canonical board revision 2613; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held across 73 configurations / 146 faces. Goal record is active and matches admitted completion through safe merge. Usage at start: primary 20%, weekly 17%; ordinary work allowed.
- Validated start commands are separate from the S437 closeout and make no status or tally change.

## Trial scope and hypothesis

Test one offline, view-only Woven BACK_FLAT candidate against the exact S406 production outputs, revision `live-draft:woven-shirt:14:14`, all 28 supported option rows. Hypothesis: after the existing sleeve-band and sleeve fills, the exact back-body fill/outline could occlude only sleeve path portions inside the body silhouette, with the source-joined sleeve-cap seam drawn above the fill. This may remove the repeated reflected sleeve-hem X without cutting or interrupting either hem path and without asserting a sleeve-to-sleeve over/under relation.

This is an **unapproved display hypothesis**, not source-encoded depth evidence. Source directly encodes the back/yoke-to-sleeve cap stitch and a complete sleeve-hem-to-band stitch, but no sleeve/body paint order. Preserve every source SVG path string and source/cut/stitch geometry in the candidate. Produce explicit path/clip identity and visible-segment traces, render every option in Chromium, and inspect default plus collision-sensitive extremes at whole and detail scales. Include a counterexample/failure if body fill does not bound the crossings cleanly, hides required edges/annotations, creates silhouette gaps, damages colorway or changes back details.

No production renderer change, mapping decision, source geometry, stitch graph, acceptance criterion, face release, CAD work or hold change is authorized by this trial. Do not render a false detached hem gap; do not reopen the continuous neckline decision. If fill occlusion does not truthfully resolve the overlap, preserve all 28 back holds and return the measured result. If it appears viable, show the exact view mapping, geometry, effect and rendered evidence for maintainer review before production implementation.

## Acceptance and non-goals

- Bind all candidate files and report rows to exact source revision, option values, face, source/instance IDs and source path `d` values.
- Retain two mirrored sleeve instances, complete source hem paths and each `sleeveBand.top ↔ sleeve.hem` source stitch. Retain the cap-to-body/yoke joins and original `GARMENT_SILHOUETTE`/`SEAM` identities.
- Measure sleeve-outline visibility inside/outside the body mask and every remaining inter-role crossing after the candidate painter order. The pair should not be reported clear if another outline, seam, fill, POM, label or colorway boundary becomes misleading/unreadable.
- Reuse the exact existing 28-option S406 output matrix and S373/S381/S428 source traces. Actual Chromium output review is required for any promising candidate. No source-specific construction research is needed for this abstract painter-order hypothesis; qualify it as a proposed convention.
- Preserve all 56 Woven and 34 Polo holds, all-seven V02, V02-before-V03, Polo's exception-only S351 residual and 0.25 cm general gate, DXF/protected export identities, V03 rights/profile/round-trip gates, and the G05/G09 and physical/factory claim boundaries.
- Run only bounded diagnostic assertions and Chromium trial review plus focused Control Center tests for board changes and `git diff --check`. No product source/test change is planned, so no changed-code coverage or full Epic gate applies.

## Ownership

No safe independent ownership exists: the overlay must be traced against exact production strokes, source layer IDs, colorway fills and rendered output. Codex owns the candidate and review; no agent is assigned.

## Start-board record

`S438-start-board-commands.json` passed clone preflight from S437 board revision 2613 and was replayed through the validated command layer to revision 2616. Statuses and the 56 accepted / 90 held tally are unchanged.

## Trial result — reject as visually destructive

- **Exact binding:** reused 28 S406 production BACK_FLAT SVGs at `live-draft:woven-shirt:14:14`, joined to the exact S373 crossing trace. The offline candidate adds a luminance mask to only the two emitted sleeve outline stroke paths. Its black mask shapes are the unchanged S406 source-derived `back` and `yoke` colorway fill paths; the white complement keeps strokes outside those body fills. No source path string, ID, revision, original layer, colorway/POM entity or stitch changed.
- **Measured result:** all 28/28 original crossings fall inside the back/yoke fill masks. The candidate preserves both sleeve outline paths and their complete `d` strings in the SVG, but SVG geometry sampling reports **0% of either sleeve outline visible outside the mask** in every option. This is not a partial hem occlusion; the entire pair disappears beneath the body fill.
- **Rendered review:** Chromium rendered 28/28 candidate SVGs with zero browser errors. Manually inspected default, `yokeDepth-min`, and the default crossing-detail crop. Both images show the back body, yoke, collar, and detached side-gutter bands, but no assembled sleeve outlines; the candidate would remove required garment content. It fails the explicit visibility requirement and is rejected. The result is not a source-backed resolution and does not clear any crossing or face.
- **Evidence class:** body/yoke fill boundaries are source-derived. Their use as an occlusion mask for the sleeve pair was a proposed display convention, not a source-encoded assembly layer. The exact rendered result disproves its usability across this view: all sleeve strokes are obscured. Do not refine it into a local mask around only the X; that would reintroduce an unsupported local interruption/occlusion.
- No production code or output, geometry, stitch graph, face status, gate or hold changed. Keep all 56 Woven and 34 Polo faces held; retain the continuous neckline, complete source hems, all-seven V02 criterion and V02-before-V03.

Diagnostic renderer: `render-body-mask-candidate.mjs`; option matrix and 28 candidate SVGs/renders: `body-mask-candidate/`.

## Exit verification

- The validated exit command set was applied to the canonical board via `executeBoardCommand`. A clone preflight applies S438 start+exit from committed S437 board revision 2613 through revision 2622 and confirms unchanged statuses/tally, both evidence links and exit comment. Canonical-state verification matches revision 2622. The first post-replay verifier attempted to execute the command set a second time at stale expected revision 2616; it failed before mutation. The script was corrected to inspect canonical post-replay state rather than replay commands twice.
- `npm run control-center:test` passes 42/42. Candidate renderer syntax and 28-option assertions pass; Chromium reports zero page/console errors; `git diff --check` passes (only the existing line-ending advisory for the canonical JSON). This is a diagnostic/documentation slice with no production source/test changes; no coverage/build/export/full-Epic gate is due.
- Board start/exit: 2613→2616→2622. EPIC-17 and V02 remain In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held unchanged. All 56 Woven and 34 Polo faces remain held.
- **Elapsed time:** 2026-10-07 20:07:51–20:12:16 UTC (~4m25s): production implementation 0m; source/output candidate design 1m; focused geometry/render script and harness adjustment 1m; Chromium option renders and visual review 1m; durable packet/board/state and focused regression 1m25s; external-agent waits 0m; maintainer-decision time 0m.

## Next action

Do not implement or reuse the body mask. If continuing the Woven back hold, derive one source-length-preserving outward display path from the exact underarm receiver station and sleeve `sideRight`/half-`hem` lengths; render every option and name its unencoded direction/pose assumption as a proposed design decision. Do not repeat S361's rejected normal-offset candidate. Ask for approval only after the exact proposal and images exist. V02 remains blocked and V03 stays gated.
