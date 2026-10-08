# EPIC-17 / G04 V03 — Polo contour remediation analysis — Slice 555 start

## Verified start

- Start: 2026-10-08 23:39:24 UTC.
- Worktree: `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`; branch `codex/epic-17-g04`.
- HEAD: `501c613` (`Slice 554: screen new receiver candidates`). Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Working tree was clean before S555 files. The highest assigned slice is 554; reserve unique S555.
- Control Center board revision 3333; `G04-V03` remains In Progress. Usage: primary 65%, weekly 57%, ordinary usage allowed.
- CLO 2026.1.310 remains open. Written product-development evaluation and local DXF processing are confirmed and are not a blocker.

## Objective

Determine whether a source- and standard-backed DXF encoding or pipeline change can preserve the five exact Polo CUT vertices lost in CLO's DXF-AAMA round trip, without changing cut geometry, relaxing the 0.001 cm gate, changing legacy DXF behavior, or moving protected export identities. Deliver one evidence-backed next action, not a list of speculative knobs.

## Required evidence

Review `src/export/dxf.ts` and relevant tests; S552's exact source/output vertex map; S536's geometry-identical R2000 LWPOLYLINE failure; S518's failed native-project measurement attempt; S503/S519/S522's already-exhausted settings; S545/S551/S553 outputs; and the governing project decisions. Compare the exact hash-pinned source/output entities and vertices on C:.

An independent Claude Code Opus 5.5 reviewer will receive a separate detached worktree and may create only its assigned `claude-analysis.md` handoff notes in this packet folder. It must classify source-observed facts, standards-backed facts, inference, and unknowns separately; it may recommend a new CLO trial only if one technical mechanism is directly evidenced and the test changes neither geometry nor any previously tested control. Codex independently reviews the findings and actual evidence. No OpenCode fallback is permitted unless Muse Spark 1.3 xhigh normal mode becomes available.

## Scope, acceptance and non-goals

- Static analysis and an external independent review only until a falsifiable, standards-backed candidate exists.
- No implementation, CLO input, new DXF fixture, or UI action without a concrete candidate. If no justified candidate exists, close this diagnostic and retain the exact fail evidence rather than run another blind trial.
- Do not repeat CLO import/export, unit, optimizer, Draw Curve Points, R2000 LWPOLYLINE, or native ZPRJ extraction trials already recorded in S503/S518/S519/S536/S545/S551/S553.
- Do not change pattern/cut geometry, stitch graph, export baseline, protected byte identities, tolerances, profile acceptance, gates, all-seven requirement, or claim boundary.
- Do not install software, transfer pattern data outside `C:\G04-CLO-DXF-Exchange\<named-slice-folder>`, contact a supplier, use cloud processing, or make physical/factory claims.

## Slice exit gates

1. Exact affected source and output paths remain mapped to S552 and source/output SHA-256 values.
2. Independent review has an explicit `WORK FINISHED` signal; Codex inspects its separate-worktree diff and every cited fact.
3. Either record a single technically justified no-geometry-change experiment and its falsifiable pass/fail outcomes, or record that current public/source evidence supports no untested CLO correction.
4. Update packet, project state, context index, and canonical board via validated commands; run relevant focused verification and `git diff --check`; no full production-code coverage gate unless production code changes.

## Single next action

Read the source emitter and hash-pinned contour fixtures, then complete the independent source/standards analysis before choosing any CLO interaction.
