# EPIC-17 / G04 V03 — AAMA pre-export contour check — Slice 620 exit

## Result

- Reused the already-saved S574 CLO 2026.1.310 project from DXF-AAMA import, before export, and queried only `GetPatternCount`, `GetPatternPieceName`, and `GetPatternInputInformation`. No new exchange, edit, export, or project save occurred. All nine getters returned without errors.
- Geometric comparisons of the native point lists against the original source contours show **9/9 SEW paths match** their ordinal-associated CLO patterns within 0.000014 cm maximum. **0/9 source CUT paths match** any returned native point list within the existing 0.001 cm gate; best available candidates miss by 1.414–9.311 cm, and two collar-stand source paths have no cyclic point-count candidate. The five short-edge pieces (back, both stands, both pointed collars) are included in the larger CUT mismatch.
- Every ordinal-bound S574 gen1 block contains three closed contours; at least one contour in each block matches the same pattern's returned native point list within 0.000020 cm. Those output layers are numeric and unverified, so this is a geometric carry-through observation, not a CUT-layer mapping or claim that all three lines have the same role. CLO's API labels native shapes “Base Line” and does not document source-layer/stage semantics.
- **Conclusion bounded to this fixture:** the native pattern geometry exposed after this AAMA import tracks the source SEW contour, not the source CUT contour, before export. The already-existing AAMA gen1 output carries forward that exposed geometry. This is evidence of an import/profile-stage geometry or role-selection failure before export; it does not identify CLO's internal mechanism. The previously reported 0/9 CUT gate remains failed and no V03 gate clears.

## Evidence

- Existing S574 input, pre-export project, and gen1 output are hash-pinned in the S620 start packet. All additional data is under `C:\G04-CLO-DXF-Exchange\S620-aama-preexport-contour-check\Evidence\`.
- `preexport-input-information.json` SHA-256 `873a12aa58579e04172b67e53649b640c667cf3a36f779e45de6ac50eb33f5ed`; comparison report `preexport-cut-contour-comparison.json` SHA-256 `68c26baa491b949c87cf5e1a14cda0757c7fa1759f6cd8c69ca543ee1c82e6f7`. The report binds all nine source pieces to the input project’s API pattern order using source SEW geometry, and records the output candidates and unverified numeric layers.
- The original source DXF and its S574 connected-LINE derivative have identical source vertex coordinates; S574's derivative report records representation-only CUT conversion. Existing S574 rendered review is retained and unchanged.

## Verification, limits, and next action

- `node --check`, the S620 hash/geometry exit preflight, `npm run control-center:test` (42/42), validated board replay and `git diff --check` pass. Changed files are research-only; changed-production-code coverage does not apply. The full repo gate remains for the settled integrated Epic/PR candidate.
- No acceptance, 0.001 cm threshold, all-seven requirement, receiver/rights/profile claim, source geometry, production code, legacy DXF behavior, or protected byte identity changed. V02 remains Done; V03 and EPIC-17 remain In Progress. CLO remains open. No physical fit, factory acceptance, or production-readiness claim is made.
- **Next:** make one evidence-driven CLO import test with the documented AAMA “swap cut and sewing lines” option enabled (S574 had it off), using the same line-chain input and a new isolated C:-only folder. Query native geometry first. If source CUT contours are still not represented within tolerance, stop CLO AAMA trials for this failure and proceed to the next qualified receiver/profile candidate. Only if import-stage geometry passes, perform the controlled export/round-trip gate. Do not infer or relabel numeric layers.

## Time

Slice start: 2026-10-09 13:25:39 UTC. Implementation/UI evidence work, focused verification, external waits, and maintainer-decision time are recorded in `PROJECT-STATE.md` at this exit.
