# EPIC-17 / G04 V03 — Polo AAMA vertex-preservation probe — Slice 536 start

## Objective and verified start

Started `2026-10-08 21:17:40 UTC` after S535 `ff953649e37efc307e41cc568099f68b39425438` on `codex/epic-17-g04`. The worktree was clean; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is S535; reserve S536. Canonical board revision is 3255; EPIC-17/G04-V03 remains In Progress. Ordinary usage is available.

The maintainer states that written confirmation covers both product-development trial use and file handling, and explicitly directs work to proceed without further concern. This clears the user's authorization to continue this bounded CLO test. The confirmation itself has not been supplied into the repository, so this packet will not quote it or claim independent legal review.

## Scope

Use the existing, hash-pinned Polo M DXF from S516 as the unchanged source. Create a separate, diagnostic encoding variant that preserves all source coordinates and path identities while representing closed contours as modern lightweight polylines; compare it with the existing R12 `POLYLINE` AAMA path. Test the new variant in the already-running CLO 2026.1.310 session using a documented, explicitly recorded import/export mode. Measure the same five Polo CUT contours against the fixed `0.001 cm` gate, and inspect CLO's rendered output for all nine pieces and visible marks.

All import inputs, derivative DXF, CLO exports/native projects, captures, and measurements stay under `C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\`. Do not edit source geometry, the stitch graph, the production exporter, protected export identities, or thresholds. Keep the current session open. This probe can disqualify the encoding candidate; it cannot by itself qualify the receiver/profile or clear V03.

## Acceptance and stop rules

- Verify the unchanged source bytes against the S516 input hash before creating the derivative; prove its path identities and coordinate sequences are unchanged.
- Record the derivative DXF version, unit declaration, encoding transformation, hash, exact CLO build and import/export settings. Do not mislabel the derivative as an AAMA-conforming file unless the exchange evidence establishes that claim.
- Compare every source CUT/SEW contour and piece count at the unchanged `0.001 cm` gate; specifically report all five established Polo CUT failures. Record warnings, marks and layer behavior rather than inferring numeric-layer semantics.
- Stop only for an observed UI/access failure, a concrete format error, missing piece/mark, or measured acceptance failure; preserve outputs. Do not repeat an unchanged S475/S476/S516/S519 configuration.
- All V03 profile, rights-documentation, local-handling, grade, negative-input, semantic and receiver gates remain separate. Preserve V02 all-seven acceptance, legacy DXF behavior, protected bytes, and the no-fit/no-factory boundary.

## Delegation and elapsed-time ledger

This is a single stateful CLO experiment with exact shared output ownership; no independent, low-risk contributor task is separable. Codex owns the interaction, measurements, rendered review and closeout. Exit accounting will separate implementation/receiver operations, focused verification, external-agent wait, and maintainer-decision time.
