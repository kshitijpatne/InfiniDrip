# EPIC-17 / G04 V03 — Standard versus AAMA output diagnostic — Slice 553 start

## Verified start

Started `2026-10-08 23:23:21 UTC` on `codex/epic-17-g04` at S552 commit `aa3dadc`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Working tree was clean. Highest assigned slice was 552; reserve S553. Canonical board revision 3325, G04-V03 In Progress. Usage check: primary 62%, weekly 56%, ordinary usage allowed. The existing CLO 2026.1.310 session remains open with the Polo workspace visible.

## Objective and test

Export the already imported S551 millimeter Polo workspace once as **Standard DXF**, keeping unit/scale/orientation consistent, and compare its five known short-edge corners against the existing AAMA export from the same workspace. Hypothesis: if Standard DXF preserves the five corners while AAMA omits them, the defect is specific to the AAMA output path; if it repeats the omissions, this test does not distinguish an import-stage loss from a common export-stage loss. Do not overinterpret an inconclusive outcome.

## Acceptance and boundaries

- Confirm the visible CLO workspace matches the S551 Polo import before acting.
- Change only the output DXF format to Standard; retain millimeter scale, 100%, no rotation, and otherwise equivalent export choices where applicable. Do not reimport, edit pieces, alter geometry, grading, or source files.
- Save the exported DXF and rendered/settings captures only under `C:\G04-CLO-DXF-Exchange\S553-standard-vs-aama-diagnostic`.
- Hash-pin source/AAMA inputs and the new Standard DXF. Compare all 18 closed source contours at the unchanged 0.001 cm gate and map the five corners. Review the actual CLO rendering/settings capture.
- This is a diagnostic export-format control, not proof of industrial profile compatibility and not a V03 gate waiver. Preserve every all-seven, rights/profile, CUT/SEW/marks, grade/options, malformed-input, round-trip and output gate. Keep legacy DXF behavior and protected export byte identities unchanged.
- No new import/export cycle beyond this single Standard-format export. No network/cloud transfer, app install, paid action, source change, production-code change, or CLO close/reopen.
- No safe disjoint delegation exists for one live receiver control and its same-workspace output comparison; Codex owns the UI and review. No OpenCode/Claude CLI delegation planned.

## Exit record

Record exact input/output hashes, format settings, per-contour findings, rendered review, hypothesis disposition, time split (implementation/UI, focused geometry/output review, external-agent waits, maintainer decisions), validated board replay and next gate. Production coverage/full repository gate is not due unless production source/tests change.

**Next action:** preflight and replay the S553 start packet through the canonical Control Center command layer, then verify the current CLO workspace and perform one Standard DXF export to the named C: folder.
