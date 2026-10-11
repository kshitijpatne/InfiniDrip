# EPIC-17 / G04 V03 — Polo unit-invariance control — Slice 549 start

## Verified start and goal

Started `2026-10-08 22:56:52 UTC` on `codex/epic-17-g04` at S548 commit `90755ac`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board is revision 3307 and G04-V03 is In Progress. Highest slice is 548; reserve S549. Ordinary usage is allowed (primary 55%). Thread goal is active.

## Objective

Run one geometry-preserving unit-representation differential on the existing Polo M DXF in CLO 2026.1.310, using the same AAMA import/export profile and behavior settings as S545/S519, but convert all length coordinates from centimeters to millimeters and select millimeters in the receiver. Compare output after conversion back to centimeters against the hash-pinned source with the unchanged `0.001 cm` gate. This tests whether the stable loss at five corners depends on unit representation rather than physical feature size.

## Boundaries and acceptance

- Input is the exact S545 Polo M source DXF, SHA-256 `796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`. Keep it and every derived file, screenshot and analysis only under `C:\G04-CLO-DXF-Exchange\S549-polo-unit-invariance-control\`.
- Scale all geometric lengths uniformly by 10 for the temporary mm fixture; preserve topology and labels, verify inverse-scaled source geometry is byte-independent but coordinate-equivalent within `1e-9 cm`, and hash both input files.
- One CLO import/export cycle only; no other setting changes, no settings matrix, no app close/reopen. Use the running CLO session if a unique targetable window is exposed. Export as DXF-AAMA in mm at 100%, no rotation, with S545's equivalent remaining settings.
- Inspect the imported and exported rendered views. Analyze all 18 CUT/SEW contours; prioritize the five known CUT contours and confirm both topology and semantics, but do not claim full semantic/profile qualification from this single geometry control.
- Pass for this slice only if all source contours remain at or below `0.001 cm` after inverse unit conversion. Any other result is reported without changing V03 acceptance, recipe source, geometry, stitch graph, protected export baselines, or claims.

## Non-goals and method

No physical pattern/source edits, acceptance changes, layer remapping, new recipe, software install/vendor contact, supplier contact, or production-code work. Do not test if the unit conversion cannot be verified exactly or the CLO target is ambiguous. No independent delegation is safe for this one stateful application run.

## References

- S500 measured each lost source corner as following an incoming segment of `0.0456–0.0470 cm` and a `16.28–17.39°` local turn; current S545 AAMA output reproduces five missing vertices and `0.01274–0.01399 cm` contour error.
- S503/S519/S522 already cover the tested AAMA/ASTM, curve optimization, and draw-curve-points controls. This is a distinct unit-equivalence control, not a repeat of those settings.
- S545's source and settings evidence is in `docs/research/epic17/S545-clo-target-recovery/S545-exit-packet.md`; historical exact point geometry is in the S500 packet and JSON. Existing output remains C:-only under `C:\G04-CLO-DXF-Exchange\S544-aama-three-recipe-roundtrip`.
