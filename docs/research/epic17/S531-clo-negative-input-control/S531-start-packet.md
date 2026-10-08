# EPIC-17 / G04 V03 — CLO malformed DXF negative control — Slice 531 start

## Objective

Run the one currently untested practical V03 negative-input check against the already-running CLO 2026.1.310 (r58944): import a synthetic malformed DXF and observe whether CLO rejects it visibly or silently repairs/accepts it. This avoids repeating completed garment import/export matrices.

## Boundaries

- Use one synthetic non-garment malformed DXF only. No G04 pattern or source geometry enters this test.
- Keep the source fixture, preserved CLO project copy, any output, and screenshot evidence only in `C:\G04-CLO-DXF-Exchange\S531-clo-negative-input-control\`.
- Preserve the currently open CLO project to the named folder before opening an isolated test project; do not overwrite existing files.
- Keep the current CLO process open throughout. Do not launch or close CLO, use CLO-SET/CONNECT, change account/settings, or send any external inquiry.
- Do not change the S463 malformed-input construction or V03 acceptance criteria. This single test can only inform the negative-input gate; it cannot qualify an industrial profile, rights, local-only handling, semantics, grading, geometry, or all-seven-recipe exchange.
- CLO Trial License and local-handling issues remain as recorded in S526. Use only non-garment synthetic data here; do not represent this as clearing the separate rights/data gate.

## Acceptance and evidence

Record exact synthetic DXF bytes/hash and the malformed group, importer/profile/settings, rendered/app behavior, any error/warning text, and whether any pattern was accepted. Inspect final app state and ensure no project/source was altered. Evidence stays C:-only. Verify start/exit board replay and canonical validation, focused Control Center tests, and `git diff --check`; no production code changed, so changed-code coverage and full repository gates do not apply.

## Verified start

Started `2026-10-08 20:33:39 UTC` from S530 `0045765` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S530 is the highest assigned slice; S531 is reserved. The clean worktree and G04 board revision 3235 were verified; EPIC-17 and G04-V03 are In Progress, with V01/V02 Done. CLO was already open in one window and remained open. See `S531-exit-packet.md` for the tested result and gate disposition.

## Delegation and elapsed-time ledger

This is one stateful UI validation with one screenshot review and has no safe disjoint work package. Codex retains control; no external agent is assigned. Closeout records app time, focused verification, external-agent wait, and maintainer-decision time separately.
