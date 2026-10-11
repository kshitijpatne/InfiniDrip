# EPIC-17 / G04 V03 — S713 returned grade-suffix identity

## Verified start

- Start: 2026-10-11 02:55 UTC, commit `30dea626aa7d363227596f789cade012796bc1bc` (`Slice 712: enforce fail-closed DXF audit results`), branch `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board revision 4179; EPIC-17/G04-V03 remain In Progress. S712 is highest assigned slice; S713 reserved once.
- Two untracked S700 diagnostic files predate this slice and remain untouched for final cleanup review.
- S711's exact CLO 2026.1.310 return records all nine piece blocks with the exact source block names plus `_M`; the source manifest grade is M. The 16-character source revision token and role portion are unchanged.

## Objective and boundaries

Adjust the returned-DXF identity comparator to accept either the exact source block name or that exact name followed by the selected grade label as a suffix. Require a one-to-one match for every block and INSERT, preserve the revision token, and reject any other suffix, altered identity, or collision after normalization. Add focused fixture tests for exact names, the measured M suffix, wrong suffix, and duplicate-normalized identity.

This is a source-backed name normalization only. It does not infer or repair units; CLO's returned file lacks `$INSUNITS`. It does not relax `0.001 cm`, semantic layer/mark checks, entity count, geometry, grades/options, rights/profile, or any V03 gate. Keep CLO return evidence as an artifact outside the repository; do not rerun an application. A test fixture demonstrates the exact normalization, not a complete CLO round-trip pass.

## Required verification and closeout

- Focused returned-audit tests with 100% statement, branch, function, and line coverage for changed production code.
- Focused package and protected export-byte identity regressions, TypeScript, validated Control Center suite, and `git diff --check`.
- Preserve S712's API fail-closed result and zero-count behavior.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `docs/planning/EPIC-17-ADMISSION.md`, and board only through its validated command layer.
- No safe independent ownership: this touches the shared returned-identity contract, so Codex retains integration and review.

## Non-goals and next gate

No receiver, format, setting, encoding, standards claim, acceptance change, UI expansion, profile qualification, broad option matrix, physical sampling, or cleanup before the final candidate. No new app candidate. The unit, geometry, semantic layer/mark, all-seven/options/grades, repeatability, malformed-receiver UI and readable-output gates remain open. Final full repository coverage/build/browser/Electron/output review, necessary-file cleanup, PR, safe merge, refreshed ancestry, required deployment and production E2E remain required.
