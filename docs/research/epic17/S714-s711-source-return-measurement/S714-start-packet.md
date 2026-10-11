# EPIC-17 / G04 V03 — S714 exact S711 source/return measurement

## Verified start

- Start: 2026-10-11 03:02 UTC after S713 `f43fbc9a979d6805dfedd62e4df6c405feea29d9` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board revision 4183; S713 is the highest landed slice, so S714 is unique.
- S711 source, return, manifest, and report remain in `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\` and `C:\G04-CAD-Interchange\S711-clo-current-marks-check\`; CLO has been saved to that C: evidence folder and closed.

## Objective and boundary

Perform one read-only measurement of the exact existing S711 CLO DXF return against its exact S708 source package. Compare all nine matched pieces' CUT and SEW geometry at the unchanged 0.001 cm limit even when CLO renamed layers, using source revision/name plus exact selected grade suffix only. Record units/header, piece/INSERT identity, layer/entity types, marks and nearest geometry, and any output geometry residuals. Separate source serialization defects, receiver rewrites, and measurement limits using the bytes already on C:.

This does not rerun CLO, test another receiver/format/setting, alter output files, weaken the audit, or claim a gate passed. Write any diagnostic artifacts only under `C:\G04-CAD-Interchange\S714-s711-source-return-measurement\`. A source change is permitted only if the measurement demonstrates a specific correctable writer/verifier defect and must preserve every fixed acceptance criterion.

## Required closeout

- Record per-piece CUT/SEW matched entity types/layers, coordinate count, best correspondence, and maximum residual; classify each gate passed/failed/unproven.
- Preserve all V03 criteria, source revision/grade identity, 0.001 cm threshold, rights/profile proof, all-seven/options/grades, repeatability, malformed receiver UI, and rendered-output gates.
- Update packet, project state, context index, admission and board through the validated command layer. Use a single exit commit if the diagnostic or justified correction is complete.
- No safe delegated work exists: this is a single source/return measurement using existing fixed files.

## Non-goals

No receiver or CAD candidate changes, format/profile variations, standards claim, new UI, acceptance relaxation, garment/source geometry edits without measured proof, physical sampling, or final cleanup before the integrated candidate. Preserve legacy exports and byte identities. Final full coverage/build/browser/Electron/output review, necessary-file cleanup, PR, safe merge, refreshed ancestry, required deployment, and production end-to-end verification remain required.
