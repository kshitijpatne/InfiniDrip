# G04 V02 — Polo ease residual/source reconciliation — Slice 415

## Start boundary and authority

- Started 2026-10-07 08:35:12 UTC from clean S414 `aebce952f8682576ef15037bfd8828deb818272f` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 414; S415 is uniquely reserved. Canonical board revision 2408; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Goal remains active and matches current EPIC records; usage at start 39% primary / 6% weekly.
- The user has kept the Polo residual gate at 0.25 cm. Scope is a source/output reconciliation of the recurring 0.68 cm `Sleeve-cap ease` assembly residual across 17 supported Polo options, to distinguish intentional source ease from a projection/measurement defect. Reuse S382 and the current source; do not ask for general construction references. Correct a confirmed misleading diagnostic string without changing its measurement or gate.

## Acceptance and boundaries

- Inspect `src/drafting/sleeve.ts`, `src/drafting/polo.ts`, the exact `Sleeve-cap ease` stitch/edge topology, the approved S353 view projection, and S382's exact current residual evidence. Bind source revision and all 17 option rows.
- Determine what the 1.5 cm authored cap ease and 0.68 cm residual measure, whether the residual is source-length difference, pointwise projection error, or another independent quantity, and whether an exact source-grounded interpretation can satisfy the unchanged 0.25 cm gate without changing cut geometry or stitch graph.
- If a misleading metric description is confirmed, correct only its diagnostic wording with focused regression coverage; preserve the value, issue code, severity, comparison threshold, pattern geometry, stitches and face status.
- Clearly separate source facts from inference. If no source-supported mapping can reconcile the fixed gate, retain all 34 Polo holds and present only a concrete decision if the evidence requires one. No implementation of new semantics without maintainer approval.
- Preserve all-seven V02, V02-before-V03, every current face hold, legacy DXF, protected export byte identities and V03 rights/round-trip gates. No threshold change, source geometry/stitch edit, physical sampling, fit claim or factory-acceptance claim.
- No safe disjoint delegation: measurement semantics and the same-revision projected assembly share one contract. Full repository/global gates remain for the settled Epic candidate.

## Start-board record

Validated start replay: `S415-start-board-commands.json`, board revision 2408→2411.

## Exit evidence

### Source measure and output hold

- **Directly encoded source:** `src/drafting/sleeve.ts` sets `CAP_EASE = 1.5 cm`; `src/drafting/polo.ts` constructs the sleeve against the summed live front/back armhole length plus that ease. S382's exact 17-option measure is stable: total cap length `43.19145806476 cm`, combined receiving armhole `41.69145806677 cm`. The length difference is 1.5 cm as authored.
- **Separate assembly metric:** the production compiler passes the validated S353 Polo projection metadata into `assembleTechnicalFlatRoles`. That metadata preserves the front/back edge traversal and sleeve reflection used to compare corresponding interface landmarks. After rigid placement and endpoint anchoring, the relation records RMS Euclidean separation over its matched seam landmark pairs. Across all 17 option configurations and both faces, the result remains `0.68 cm` (34/34), above the maintainer-fixed `0.25 cm` gate. The source ease length and the RMS are different quantities; the former does not itself settle the latter.
- The approved normalized-arclength seam projection changes only the displayed seam representation; it does not modify the cut curves or source stitch. The assembly relation still fails the unchanged release gate. No source mapping supported by the current code/topology brings the RMS below 0.25 cm without changing the construction geometry, stitch graph, or acceptance threshold. Preserve all 34 Polo holds; no geometry or stitch edit is proposed.
- **Confirmed diagnostic defect:** `fitRigid` computes `sqrt(mean(distance(matched source landmark, transformed target landmark)^2))`, but the issue text called the result the sewn endpoints' distance. That wording is inaccurate. The issue now says “RMS separation across matched seam landmarks”; its value, issue code, severity, threshold, and fail-closed behavior are unchanged.
- The first direct helper-only test attempt measured `0.48 cm` because it omitted the approved projection map's reflected role and source-edge traversal. That is not the production compiler's measurement. The corrected test uses `compileTechnicalFlatLiveView` with the validated S353 mapping and asserts `0.68 cm` on all 17 supported option rows and both front/back faces. The first focused coverage run also exposed two existing expectations for the old phrase; those were updated to assert the accurate RMS wording.

### Output evidence and verification

- Reuse current S382's exact same-revision 17-option source/path matrix and S353's paired rendered diagnostic output; S399/S411 provide the later actual Chromium callout renders. The diagnostic edit changes only issue prose, not geometry, SVG paths, callouts or marker positions. The live compiler test confirms all 34 views still fail closed with the unchanged 0.25 cm acceptance tolerance.
- Focused tests: 61/61 pass across `technical-flat-assembly.test.ts` and `technical-flat-live.test.ts`. Changed production module `technical-flat-assembly.ts`: 100% statements, branches, functions, and lines. `npm run build` passes with the existing Vite large-chunk advisory. Protected export identity/regression tests pass 24/24. Control Center, board validation and `git diff --check` are required after the validated exit replay.
- No global repository gate is triggered by this focused wording correction; the one full global gate remains due on the settled integrated Epic/PR candidate. No safe independent delegation was identified.
- Elapsed approximately 5m14s (08:35:12–08:40:26 UTC): source/history reconciliation 1m; production wording/test correction 1m; focused verification/coverage/build/export checks 2m; durable board/state closeout and Control Center replay 1m14s; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** preserve the fixed 0.25 cm gate and all 34 Polo holds. Continue on the next source-resolvable repeated G04 output blocker; do not alter the authored ease or stitch topology based on this diagnostic alone.
