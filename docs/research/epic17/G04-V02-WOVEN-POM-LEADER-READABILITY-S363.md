# G04 V02 Woven POM leader readability — Slice 363

## Start and verified boundary

- **Goal:** remove the S362 max-`standHeight` Woven “Finished placket width” leader crossing without moving its source anchor or altering source/cut/stitch geometry; verify on the exact supported Woven matrix and retain every failed face hold.
- **Start:** 2026-10-02 09:30:41 UTC, from clean S362 `24a0c00fa8cb5d11b9e0b4b0c132c5c7efe5684c`, branch `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice on active/reachable history was S362; S363 is reserved. Canonical board was revision 1536; EPIC-17 and G04-V02 remain In Progress.
- **Goal record:** active; objective still matches admitted EPIC-17/G04 V01→V02→V03 through final evidence, required gates, and safe merge. It remains needed.
- **Maintainer decision:** Polo’s source-authored 1.5 cm cap ease and 0.25 cm residual gate remain confirmed. This slice does not alter the threshold; all 34 Polo faces stay held.

## Scope and acceptance

The S362 defect is specific to the Woven “Finished placket width” callout. Its measured straight leader is checked against the four projected collar outline paths: `outerStand`, `innerStand`, `upperCollar`, and `underCollar`. A candidate whose segment crosses one of those unrelated contours is rejected by the existing measured collision-free search. Preserve the exact source anchor (`pattern:woven-shirt:role:buttonPlacket:edge:top`, at its source midpoint), target primitive, revision, value, tolerance, and callout text. If no clear straight leader can be placed, fail closed with an actionable renderer issue; do not suppress the POM or render a partial face.

Replay all 28 supported Woven configurations / 56 front-back faces. Inspect default and `standHeight` maximum output, then other option extremes and any faces whose callout placement changes. Require readable label bounds, correct anchor and target IDs, same front/back revision, no new path crossings or renderer errors. The S361 sleeve/band X remains a separate failed gate; no Woven face can pass solely by clearing the callout.

## Explicit non-goals and holds

- No source pattern, cut geometry, piece topology, stitch graph, POM definition/value/tolerance, view transform, option behavior, or Polo residual threshold change.
- No legacy DXF/export change, protected byte-baseline movement, new recipe, broad UI work, G05 tech-pack content, G09/D04 assembled views, sampling, supplier contact, launch spending, hosted service, fit/factory acceptance, or production-readiness claim.
- Preserve all 56 Woven holds and all 34 Polo holds; do not advance V02 acceptance, MQF status, or V03.
- Preserve Woven sleeve/band crossings and collar-artwork fail-closed behavior as visible unresolved risks.

## Blocking decision and risk

No new design decision is required. The Woven POM anchor and finished-placket-width construction mark are already source-bound. Rendering a straight leader through unrelated collar contours is an output-readability defect inside admitted V02. Polo’s 0.25 cm decision is resolved and must remain unchanged. A broad geometry-crossing guard was tried, but it made a Trouser front-rise callout unplaceable; that broader change was reverted, and the shipped rule is limited to the four reviewed Woven collar outlines.

## Delegation and gates

The shared SVG renderer and its measured layout contract are the only safe ownership boundary for this fix. No independent low-risk, disjoint task is available, so Codex owns implementation and review; no external agent is assigned.

Use focused SVG renderer tests and require 100% statement, branch, function, and line coverage for changed production code. Run TypeScript/build, protected export byte-identity checks, the complete current Woven replay and rendered manual review, canonical Control Center tests/validated commands, and `git diff --check`. Do not run global repository coverage/browser gates before the settled integrated Epic/PR candidate.

## Exit result

- The SVG renderer now rejects candidate straight leader segments that cross those four Woven collar outline paths, while preserving the exact source entity and anchor. Other callouts retain existing behavior. A broad experiment against all unrelated paths was reverted after it caused a pre-existing Trouser front-rise callout to lose all measured positions; the implementation is intentionally limited to the reviewed Woven defect.
- The exact production anchor is `pattern:woven-shirt:role:buttonPlacket:edge:top`, at `(3, 8.2)` cm in the combined-supported front. `verify-production-callout.mjs` compares the S362 and S363 Chromium SVGs: target ID, same revision (`live-draft:woven-shirt:14:14`), and serialized anchor coordinates match exactly. Label placement/withholding did not alter the geometry target.
- The focused renderer test passes and checks that a candidate label endpoint clears a collar barrier while the source entity remains exact. `technical-flat-svg.test.ts` passes 31/31; `technical-flat-svg.ts` coverage is 100% statements, branches, functions, and lines.
- Production Chromium replay covers all 28 configurations / 56 faces with zero browser errors: 31 faces emit and 25 front faces fail closed with `TEXT_COLLISION` because no straight POM leader avoids the collar contours while keeping a readable measured label. In particular, default front and max-`standHeight` front no longer display the known crossing leader. The other 3 front faces emit; all 28 backs emit. Manual review of the max-height held screenshot confirms the drawing is replaced by visible hold guidance, not a partial flat. Review of the combined-supported emitted front and default back confirms the renderer preserves output where the callout route is clear; the rejected sleeve/band X remains visibly unresolved on the back.
- This removes the misleading crossing output by withholding the affected front view; it does not find an alternate bent route or clear the callout-readability gate. Accept zero new faces and retain all 56 Woven holds, all 34 Polo holds, and the integrated 56 accepted / 90 held tally. No Polo mapping or 0.25 cm residual threshold changed.
- `npm run build` passes with the existing Vite large-chunk advisory. Protected export regression passes 8/8. No full repository coverage/browser gate is run before the settled integrated Epic/PR candidate. The S363 production matrix, per-face JSON/SVG/PNG outputs and replay script are in `docs/research/epic17/S363-woven-pom-leader-readability/production-replay/`.
- Control Center initially failed 2/42 on stale S361 wording and a missing start-evidence link; the next run exposed one remaining outdated acceptance phrase. The canonical description/link and regression assertions were corrected through validated commands. Final Control Center passes 42/42 and `git diff --check` passes. A board evidence-kind command was rejected during clone preflight before any mutation; it was corrected to the schema's `rendered-output` kind.
- The canonical board began at revision 1536; validated start commands reached 1539 and exit records/summary corrections plus source-anchor comparison evidence reached revision 1559. No safe independent work was identified; external-agent waits: 0. Maintainer-decision time: 0 (Polo's retained gate was confirmed at slice start). Approximate active slice time 22m22s: implementation/diagnosis 7m; focused verification, browser replay, manual review and board gates 15m.
- **Next action:** reserve the next unique slice and investigate a view-only bent leader route around the collar endpoints, anchored to the same source entity. If no readable source-faithful route is proven, preserve the fail-closed output. Independently address the rejected Woven sleeve/band crossing; keep all-seven V02 and V02-before-V03.
