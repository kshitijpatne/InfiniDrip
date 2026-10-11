# EPIC-17 / G04 V03 — Polo CUT corner representation trial — Slice 590 start

## Verified state

- Start `2026-10-09 06:51:17 UTC`, branch `codex/epic-17-g04`, from S589 `b4246c2a522d60dd58d5ce3571049c3d369380fa`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Working tree was clean. Highest assigned slice is 589; S590 is reserved.
- Board revision 3473; EPIC-17/G04-V03 In Progress; G04-V01/V02 Done. Written product-development and local-processing permission is settled.
- CLO 2026.1.310 is already running and stays open. Exchange artifacts, if any, are confined to `C:\G04-CLO-DXF-Exchange\S590-polo-cut-corner-curve-trial`.

## Question and hypothesis

S552 identifies the same omitted source vertex in five Polo CUT contours: index 13 on back and index 14 on each collar stand/collar leaf. Each corner has a short incoming edge (0.04562–0.04696 cm), a 16.28–17.39° turn, and a replacement-chord residual of about 0.0127–0.0140 cm. S536's geometry-identical R2000 `LWPOLYLINE` trial repeats the losses; S552's cm/mm comparison repeats them; CLO settings and optimizer variations are already exhausted.

Test a distinct, additive diagnostic representation: replace only those five sharp CUT vertices with circular fillets of radius 0.05 cm in the exchange derivative. Keep every other coordinate, outline role, layer, recipe piece and source pattern unchanged. A fillet is expected to keep the symmetric source-to-candidate contour deviation below 0.001 cm while avoiding the one short angular edge. The hypothesis is falsified if exact sampled/bounded geometry exceeds 0.001 cm, if the output still drops/changes the curved segment beyond tolerance, or if any unrelated contour changes.

## Ordered work and stop conditions

1. Hash-check the retained S536 source and output; parse the source and verify the five S552 vertex/edge/turn facts independently.
2. Generate one diagnostic DXF under the named C: folder; use the existing source as the base and change only those five diagnostic CUT corners. Record a complete entity/geometry diff and an exact analytic or conservatively sampled symmetric-distance bound for every contour. No production source or legacy export is edited.
3. If the derivative does not pass the unchanged 0.001 cm bound for all affected outlines and preserve all unrelated paths exactly, stop without opening/importing it in CLO.
4. If preflight passes, use the running CLO session once with the S536 DXF-AAMA import/export settings and a clean, isolated project/scene. Confirm the visible state before each action; keep project and all input/output/render files inside this C: slice folder. Parse the output against source and inspect the actual rendered result. No setting variations or second-generation exchange in this slice.
5. Record whether the exact hypothesis passed or failed. A local result does not clear all-seven, semantic, marks, grading/options, malformed-input, detail-render or repeated-round-trip gates.

## Non-goals and preserved gates

No source pattern/stitch graph change, no modification to existing generic DXF or protected byte identities, no threshold/acceptance change, no broad compatibility claim, no general CLO rejection, no new recipe, no physical sampling/fit, factory acceptance or production-readiness claim. If a future production profile writer uses this representation, its implementation and full seven-recipe round-trip remain separately gated.

## Verification and ownership

Codex owns the fixture, CLO interaction, exact output analysis and rendered review; there is no disjoint external-agent task. Require exact source/output hashes, variant-only-delta assertions, `0.001 cm` geometry check, one controlled receiver operation only if preflight passes, actual render inspection, focused syntax/checks, validated Control Center start/exit replay, and `git diff --check`. Full repository coverage remains reserved for the settled Epic/PR candidate.

## Start board command

The validated start replay links `E-G04-S590-START` and a scope comment to G04-V03, advancing board revision 3473→3475 without changing work status.
