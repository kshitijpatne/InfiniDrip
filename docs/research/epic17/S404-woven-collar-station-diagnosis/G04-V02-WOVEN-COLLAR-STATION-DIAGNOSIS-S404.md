# G04 V02 — Woven collar station and shoulder-crossing diagnosis — Slice 404

## Start boundary

- Started 2026-10-07 06:25 UTC from clean S403 `c2eca277105d6a1bf9b47cffe64251f2122380d7` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 403; S404 is reserved. Canonical board revision is 2281; EPIC-17 and G04-V02 are In Progress, G04-V01 Done and G04-V03 Backlog. Ordinary usage is allowed (primary 14%, weekly 2%).
- The active G04 goal remains required and active; its objective matches the admitted Epic. No goal mutation is part of this slice.
- Pending S402 derived-midpoint D-marker and S403 pocket/placket display-order decisions are independent and do not authorize implementation here. Keep every current Woven/Polo hold and every G04 gate.

## Scope

Diagnose the repeated Woven front `front:outline` / `outerStand:outline` shoulder crossing from S403 against the exact source revision, approved S359 collar projection, exact role/path station mapping, and current option-specific assembled geometry. Determine whether the crossing arises from a directly encoded interface, from the approved view convention, or remains a choice the existing source and qualified references cannot settle. If source and output allow it, compare only diagnostic, view-space alternatives; do not modify production metadata or behavior in this slice. Preserve Woven front/back cut and stitch source, the single base-seam rule, and every held face.

## Acceptance and gates

- Reproduce the exact current 28-option Woven block and production `FRONT_FLAT` outputs; retain revision, option, piece/edge identity, source transforms, station and layer for each relevant contour.
- Trace the body-front shoulder, front neckline, outer-stand neckline and projected outer-stand silhouette through their exact endpoint/station correspondence. Compare source-encoded stitch endpoints to the observed crossing, including neckEase, standHeight and collarLeafDepth boundaries.
- If a view-only candidate is diagnostically evaluated, prove the affected source contour/edge and joins it changes, render actual Chromium whole/detail output, inspect crossings/occlusion/label readability, and report option-wide effects. Do not promote a candidate without maintainer approval if it adds a semantic construction decision.
- No production source, test assertions, pattern/cut geometry, stitch graph, renderer, POM, acceptance, output-release status, export or DXF behavior may change. No face is released by this diagnostic.
- Focused reproducible analysis, actual rendered evidence when new output is produced, `npm run control-center:test`, validated board command replay and `git diff --check`. Full global coverage/build/export gates remain for the settled integrated Epic candidate.
- Preserve all-seven V02, all Woven and Polo holds, Woven back hem/sleeve crossing, Polo 0.25 cm residual threshold, V02-before-V03, V03 rights and round-trip gates, protected export identities, MQF dispositions and post-G17 deferrals.

## Non-goals, dependencies and ownership

No new general construction-reference search unless an unchecked pattern-specific source could resolve this exact shoulder crossing; no new mapping implementation, physical or factory claim, Woven D-marker implementation, pocket/placket order, sleeve/hem repair, Polo change, V03 receiver claim, broad UI work, G05/G09 work, new recipe, supplier contact, launch spending or hosted service. S402 and S403 maintainer decisions remain pending independently. No safe disjoint delegation exists for a same-revision source/projection/render diagnosis; Codex retains integration and review.

## Exit findings and decision boundary

The S403 matrix and exact current projection map establish the recurring geometry. On `FRONT_FLAT`, `outerStand.collar` is the first front run of the S359-approved collar projector. It is projected from the collar-transfer station over the front-neckline interval with signed source-normal offset. The front body outline's first subpath is the separately authored `front.shoulder` segment, from the HPS/neckline junction to the shoulder point. The source stitch `Outer stand ↔ woven neckline` joins `outerStand.neckline` to `front.neckline` and `yoke.neckline`; it does not join `outerStand.collar` to `front.shoulder`.

`analyze-collar-crossing.mjs` reconciles the exact 28 S403 same-revision production outputs (`live-draft:woven-shirt:14:14`) to those source runs. Every configuration has one direct shoulder/collar crossing; both physical-pair sides are mirrored in the actual view. Crossing coordinates range x=11.7294–13.7019 cm and y=0.3019–0.7045 cm. It lies at 19.7–28.4% of the displayed shoulder line, 1.5099–3.5230 cm from the HPS endpoint; default is `(12.7156,0.5032) cm`, 2.5165 cm from HPS. Its endpoint-to-path numerical residual is below `2e-15 cm`. The crossing changes with `neckEase`, `standHeight`, and the supported combination; collarLeafDepth and the other tested options do not move this point. Exact per-option values, option records, path IDs and fractions are in `woven-collar-crossing-stations.json`.

The crossing therefore comes from the approved view projection and the independent source shoulder edge, not from a source-defined seam junction. Source and previously qualified construction references do not determine whether this overlay should obscure the shoulder seam. No further general construction-source search was performed.

The default actual Chromium output was re-reviewed alongside the S403 `standHeight-max` boundary render. `rendered/woven-shirt-default-shoulder-occlusion-trial.png` is an explicitly diagnostic-only edit of the retained S403 production SVG: it trims the body shoulder stroke from its exact HPS endpoint to the first projected-collar intersection on both physical sides, leaving the collar outline and the remaining shoulder seam. It hides 2.5165 cm of the default shoulder seam; the matrix range is 1.5099–3.5230 cm. This turns the crossing into an apparent collar/shoulder contour junction, which the source stitch graph does not identify as a sewn junction. It demonstrates a possible foreground/occlusion rule but is not a production mapping and is not yet approved. No cut geometry or source stitch changed.

**Decision needed for follow-up:** approve or reject this exact view-only overlap convention: show `outerStand.collar` in front, and suppress only `front.shoulder` from `front.neckline`'s shoulder endpoint to the option-specific first intersection, mirrored on the paired side. It removes the crossing but hides 1.51–3.52 cm of the shoulder seam and makes the visible seam begin at an unstitched visual contact. Recommendation: keep the affected views held unless the maintainer accepts that tradeoff. Do not implement without approval. The D interval marker and pocket/placket order remain separate pending decisions.

## Exit verification and disposition

- Diagnostic matrix and Chromium trial are reproducible from the checked-in scripts; both scripts pass `node --check`. The script's 28 rows all match the exact S403 renderer revision. Rendered default trial and S403 default/standHeight-max crops were manually inspected.
- No production code or test source changed; changed-production coverage, build, export and DXF gates are not applicable. `npm run control-center:test` and `git diff --check` are required after validated exit replay.
- No face is released. All 56 Woven views remain held for the repeated back crossing, the collar/shoulder output conflict, pending D decision, pending pocket/placket order, and remaining joins/POM/colorway/overlay/readability checks. All 34 Polo views remain held at the 0.68 cm sleeve residual versus 0.25 cm gate. All-seven V02, V02-before-V03, protected export identities and V03 rights/round-trip gates are unchanged.
- **Next action:** obtain the concrete view-only shoulder-occlusion decision together with the already-documented S402 D-marker and S403 pocket/placket decisions. Continue independent V02 blocker work while awaiting answers; preserve all holds.
- **Elapsed time:** approximately 7m (06:25–06:32 UTC): production implementation 0m; source/matrix diagnosis 3m; diagnostic render and visual review 2m; durable records, validated board replay and focused verification 2m; external-agent waits 0m; maintainer-decision time 0m.
- Board start/exit revisions: 2281→2284 / 2284→2291.
