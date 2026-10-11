# EPIC-17 / G04 V03 — CLO foreground activation and AAMA pilot — Slice 516 start

## Objective and boundary

Keep the already-running CLO 2026.1.310 process open. Use the documented
`sky.activate_window` method on the currently returned CLO window, then take
one fresh screenshot. S514 refreshed/reselected the target but did not record
calling the optional explicit foreground-activation method; this is a
distinct, bounded way to correct the capture mismatch, not a relaunch or
repeat of old DXF tests.

Proceed with exactly one menu/dialog-selected AAMA export → AAMA reimport →
second-generation export/reimport on the existing hash-pinned Polo M fixture
only if that screenshot visibly shows the selected CLO window. Keep all
test/import/export files and captures in
`C:\G04-CLO-DXF-Exchange\S516-clo-aama-roundtrip\`. Reuse the user-approved
local trial; no cloud upload, paid access, account change or installation.
Record exact dialog settings, messages, hashes and rendered output. Do not
repeat Standard modes, the earlier AAMA-import/ASTM-export matrix, or scale
variants. Preserve all V03 gates and protected export identities.

If activation/capture still does not yield a screenshot matching CLO, stop UI
input for this slice, leave CLO open, record the exact returned state, and
continue only independent V03 work. Do not click based on stale coordinates or
use another automation backend. If the one-profile pilot fails, diagnose its
actual import/export result and retain V03 In Progress. If it passes, scope the
remaining six recipes and rights/profile evidence as subsequent distinct
work; one recipe cannot satisfy all-seven acceptance.

## Verified start and reservation

- Started `2026-10-08 18:05:49 UTC` from clean S515 commit
  `aef45f3b42f79b2c9a4fa4d94b9d9c3a2a311a98` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. Highest assigned slice is 515; S516 is reserved. Board revision
  3175 has V01/V02 Done and V03/EPIC-17 In Progress.
- Re-read current project state, S515 packet, confirmed decisions, admission,
  context index and canonical board. Primary usage is 55%; ordinary usage is
  available.

## Exit test

Record activation/capture agreement and, only if safe, the one AAMA round trip.
Use focused evidence checks and the validated board command layer. Run
Control Center tests and `git diff --check` for a documentation-only result;
run implementation-specific focused checks if any production change is made.
No full repository gate unless this slice is independently mergeable.
