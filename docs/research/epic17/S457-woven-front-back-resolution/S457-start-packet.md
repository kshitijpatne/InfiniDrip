# G04 V02 — Woven front and back resolution — Slice 457

## Start boundary

- Started 2026-10-08 02:56 UTC from clean S456 `61f69681d48e990cd8c3568e62705c435ca7f614` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Highest assigned slice is 456; reserve S457.
- Canonical Control Center board revision 2754: EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held over 73 configurations / 146 faces.
- The goal record still reports `blocked` as of this boundary, although the user has now supplied the S454/S441 decisions below. This slice proceeds under that explicit continuation/approval; the goal status must be reconciled in the UI at a safe boundary and must remain associated with the full admitted objective.
- Usage at start: primary 22%, weekly 26%; work allowed.

## Maintainer decisions recorded for this slice

1. The maintainer approves S454's exact same-revision collar-leaf silhouette mask for Woven fronts. This is a view-only convention, supersedes S425's continuous visibly drawn base-neckline decision, and hides only neckline stroke inside the actual upper/under-collar leaf fills. Keep the open-V neckline visible. It changes no cut geometry, stitch graph, POM, or option value.
2. The maintainer authorizes revisiting the S442 fixed S370 detached-band layout for Woven backs and implementing the already measured S441 local-Y sleeve-view candidate, including its source-scale detached bands relocated to maintain clearance. This is a view-only convention. Preserve piece geometry, source stitch graph, revision identity, band scale, two sleeve and band instances, and all source joins. The candidate's documented cost is a 20.5737–22.4315 cm outward band movement per side and a 41.1474–44.863 cm back viewBox-width increase across the option matrix. This is explicit user-authorized layout change, not source evidence of sleeve handedness.
3. Neither decision accepts a face before implementation and current option-wide geometry/render/readability verification. Keep all unrelated V02 gates and the all-seven recipe criterion unchanged.

## Objective and exact scope

Implement and verify the two approved Woven view-only resolutions against `live-draft:woven-shirt:14:14` across all 28 supported options: (a) the same-revision collar-leaf silhouette mask on FRONT_FLAT, and (b) the local-Y reflected whole-sleeve pair plus geometrically cleared source-scale detached-band details on BACK_FLAT. Preserve source topology, source revision binding, the existing collar/placket front order, colorway/artwork, POM identities/schedule, S321/S370 instance counts, and source-generated outlines. Update decision/state/architecture/context as affected; record rendered output evidence and validated board evidence.

## Acceptance gates

- Every generated candidate is bound to the same exact pattern/revision on both faces; stale/missing collar contours or back-axis/band source identity fail closed.
- FRONT_FLAT: only the exact two front-neckline source strokes are masked by the projected same-revision `underCollar` and `upperCollar` filled silhouettes; leaves the measured open-V segment visible; preserves shoulder/stand base-seam convention and all existing front overlap clips.
- BACK_FLAT: two complete sleeve instances retain approved seam correspondence and form zero proper crossings with each other, body outlines, yoke fill, source joins or callouts. Two complete source-scale band details remain legible and have at least the approved 1.0 cm clearance. Layout movement and resulting viewBox are finite, deterministic, and recorded for all 28 options.
- Run focused changed-area tests with 100% statement, branch, function and line coverage; build/typecheck as applicable; protected legacy DXF/export identity tests; 28-option/56-face actual production replay; inspect actual rendered default and extremes/collision-heavy crops in Chromium. No missing primitives, browser errors, unreadable schedule/callouts, overlaps or new crossings.
- Preserve the all-seven V02 gate, every non-Woven hold, V02-before-V03, legacy DXF behavior, protected export byte identities, and V03 rights/profile/import-round-trip gate. No physical, fit, factory or production-readiness claim.
- Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`, `CONTEXT-INDEX.md`, board evidence/comments through its validated command layer, and this packet. Keep S425/S442 decision history and S370 baseline in history while recording explicit supersession.

## Non-goals and risks

- No cut-pattern geometry, stitch graph, POM definitions, recipe options, exports, or protected baselines change.
- No UI redesign, new recipe, G05 tech-pack content, G09 assembled views, physical sampling, supplier contact, spending, hosted service, or production-readiness claim.
- The sleeve orientation is now a maintainer-approved view decision because the source does not encode handedness. Its materially wider page layout may reduce convenient full-sheet readability; if output review finds that effect unacceptable, hold the affected back views and report measured evidence rather than silently reflowing S370 again.
- The collar mask hides a substantial measured segment of the source-joined base neckline under the leaves; its display endpoint does not claim a new physical seam termination.
- No safe independent low-risk ownership exists for shared projection/renderer/test behavior. Codex owns implementation, integrated review and fixes.

## Exit accounting template

Record implementation time, focused verification time, rendered/output review time, documentation/board time, external-agent wait time, and maintainer-decision time separately at the verified slice boundary. Full-repository 100% coverage remains due once for the settled Epic/PR candidate unless this slice becomes independently mergeable.

## Next action

Implement the approved source-bound front mask and back local-Y/band-layout metadata in the smallest coherent renderer contract, add focused regression coverage, then replay and inspect the complete 28-option matrix. Keep Woven faces held if any acceptance gate fails.
