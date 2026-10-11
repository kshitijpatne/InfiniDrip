# G04 Woven collar orientation audit — Slice 445

## Start boundary

- Started 2026-10-07 22:40:43 UTC from clean S444 commit `901499580391eb6f7aee20cc71dc776d7662194b` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 444; S445 is reserved.
- Canonical board revision 2667 at start, then 2669 after validated start replay: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; tally 56 accepted / 90 held across 73 configurations / 146 faces. The existing goal remains active.
- Usage at start: primary 45%, weekly 21%; ordinary work allowed.
- Validated board start added evidence/comment only and preserved all statuses, holds and acceptance criteria.

## Scope

Resolve S443's explicit Codex follow-up: inspect whether the currently approved Woven collar projection places the collar/stand stack in a misleading worn orientation under G04's construction-aware output requirement. Bind the review to source formulas/stitches, approved S359 mapping, exact Woven revision `live-draft:woven-shirt:14:14`, and existing current S406/S417 output/crops verified by S437. Reuse `docs/research/garments/WOVEN-SHIRT-RESEARCH.md`; the listed W3/W4 general sources were already reviewed. Do not repeat broad construction search or re-render an unchanged artifact merely to create more evidence.

## Controlling decisions and limits

- Preserve the S359 revision-bound signed-normal/arclength projection, same-revision piece/edge identities, fold-reflected front/back instances, and S343's single complete body-neckline seam unless the current product owner explicitly authorizes a change.
- Preserve the complete neckline and 28 Woven front holds; do not clip, mask, reorder into a fabricated seam relation, change criteria, or release faces.
- No cut geometry, stitch graph, POM, option values, export behavior, protected identity, Woven back convention, S370 layout, or V02/V03 gate changes.
- This is an evidence-only orientation audit. If source/research cannot determine the collar's viewed side/roll, report the precise fact still missing and a concrete decision with visual effect; do not implement or trial an alternative.

## Review method and exit evidence

- Distinguish direct source facts, the previously approved display convention, construction research, emitted output, and Codex inference.
- Read the actual current front SVG and retained default/edge-option Chromium crops. Identify neckline, stand neck/collar seams, collar leaf exterior, collar tips, center front, and which side of the continuous base seam the view places each contour. Reconcile coordinate direction and image/view transforms; do not infer orientation from the screenshot alone.
- Determine whether the current view is a flat construction schematic or an assembled/worn depiction from its metadata and labels. State whether this orientation itself fails “no misleading depiction,” separately from the already proven contour intersections.
- If any relevant existing source/reference statement is inconclusive, state its limit. No new web search unless one exact, previously unchecked source can establish this specific collar-layer relation.
- No production tests/render replay are due if current S406/S417 evidence is confirmed to remain same-revision and unchanged. Run canonical board tests, board validation, and `git diff --check` for documentation closeout.
- Keep all 56 Woven and 34 Polo faces held, 56 accepted / 90 held; V02 remains In Progress and V03 remains Backlog.

## Findings and classification

- **Directly encoded in source:** `src/drafting/shirt.ts` defines the Woven stand neckline/collar seam and upper/under collar bases and exteriors as distinct source edges. `WOVEN_SHIRT_COLLAR_STITCHES` joins the front body neckline to `outerStand.neckline`, each collar base to its stand seam, and the paired collar exterior edges. It does not stitch the body neckline directly to the collar exterior or encode an exterior-face/roll choice.
- **Approved view-only convention:** S359 in `docs/PROJECT-DECISIONS.md` authorizes the exact revision-bound arclength/signed-normal projection for `outerStand`, `innerStand`, `upperCollar`, and `underCollar`. It expressly says it is a view convention, changes apparent silhouette/layering, and does not assert sewn fit. S406 puts the projected collar above the closures under a separate approved display order. No new projection or layer trial is authorized or needed here.
- **Current rendered evidence:** inspected the retained same-revision `live-draft:woven-shirt:14:14` default and `collarLeafDepth-min` production Chromium whole-front outputs and the S417 default post-clip crop. SVG title/metadata say `FRONT_FLAT` and “Pattern-derived technical flat in centimetres.” These are technical-flat outputs, not worn/physical simulations. The projected collar/stand outline does not claim a specific sewn roll or exterior fabric face.
- **Research limit:** the maintained Woven research record W3/W4 says turn of cloth matters and equal flat layers do not prove roll. It gives general construction guidance, not a relation that can determine the rolled face of this exact pattern/revision. No unchecked pattern-specific reference was identified; further general search cannot establish this specific missing physical behavior.
- **Decision:** collar orientation is not a separate unresolved V02 mapping under the already-approved technical-flat convention. No code or production output change is needed. The two body-neckline/collar contour contacts remain the independent, repeated blocker in all 28 Woven fronts; S417/S437 establish them and the maintainer’s controlling choice is to preserve the complete base seam and keep those fronts held. In the backs, retain the explicit maintainer choice to keep S370 band-detail positions; therefore keep all 28 backs held. These decisions preserve all-seven V02.

## Slice exit

- S445 is an evidence-only audit. No source, projection, renderer, geometry, stitch, POM, output, face status, gate, protected identity or acceptance criterion changed.
- S441/S442 already record the maintainer’s choice to preserve S370 positions and hold all 28 Woven back views; that choice remains in force. The all-seven tally remains 56 accepted / 90 held across 73 configurations / 146 faces; all 56 Woven and 34 Polo faces remain held. V02 remains In Progress; V03 remains Backlog behind all-seven V02 and its rights/round-trip gates.
- No new manual decision is required for the collar-orientation audit. The unresolved blocker remains the source-to-view topology conflict, not an unspecified roll claim. A future proposal must change a named constraint or the source pattern design with explicit approval and exact option/render verification; do not silently clip the continuous seam, add a hem gap, move S370 details, or weaken acceptance.
- Focused closeout: `npm run control-center:test` 42/42; S445 exit clone preflight 2669→2671 and validated canonical replay to board revision 2671 pass; repository board invariants pass within the Control Center suite; `git diff --check` and all four S445 script syntax checks pass. Production tests, renderer replay, build, changed-code coverage and export tests were not due because no production code or behavior changed and the retained output remains bound to the unchanged source revision.
- Elapsed 2026-10-07 22:40:43–22:43:41 UTC (2m58s): implementation 0m; source/render/research review about 1m35s; durable packet/state/context/board closeout about 45s; focused verification about 38s; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** at the next slice boundary, reconcile the S443/S445 no-go evidence with current G04 records and define the smallest explicit, reviewable source/design constraint proposal that could clear the two Woven blocker classes while preserving all-seven V02. Do not change code or acceptance before a concrete proposal is approved; V03 remains gated.
