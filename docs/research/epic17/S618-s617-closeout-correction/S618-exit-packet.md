# EPIC-17 / G04 — S617 closeout correction — Slice 618 exit

## Verified result

- Closed 2026-10-09 about 13:06 UTC (about 4m27s from the 13:01:33 UTC start) on `codex/epic-17-g04`. S618 started from S617 commit `bc0064c4eae0ecfda8406075b3f054022c249c88`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice was 617. Start replay was 3606→3608; exit replay is 3608→3610. EPIC-17/G04-V03 remains In Progress and G04-V02 remains Done.
- S617's actual commit timestamp is `2026-10-09T09:01:01-04:00` (13:01:01 UTC). Its packet now records the actual close time and elapsed duration 17m25s from 12:43:36 UTC, split as ~8m CLO diagnostic/exchange/render work and ~9m25s analysis/verification/records/board/commit; external waits and maintainer decision time are 0.
- Removed the extra final blank line in `PROJECT-STATE.md`. `git diff --check` passes. S617 results and holds are unchanged: 9/9 SEW, 4/9 CUT, five short-edge vertex omissions over the 0.001 cm threshold; the `$INSUNITS=5` scale finding applies to one disposable Polo M fixture only.
- S617's durable exit preflight now remains valid after subsequent board revisions, while still validating its 3603→3606 command simulation when run at its original boundary. It verifies all C:-only evidence hashes and the 4/9 versus 9/9 result.

## Verification and time accounting

- S618 start preflight initially rejected the literal text “Slice 617”; the packet names the subject as “S617.” Corrected the assertion to match the actual packet label. Its preflight then passed at board revision 3608. The S617 exit preflight initially assumed the current board would remain exactly revision 3606; updated it to validate the preserved S617 evidence at later revisions. Both preflights now pass.
- Focused Control Center tests: 42/42 pass. `node --check` passes for the touched preflight/replay scripts; S617's C:-artifact preflight passes; `git diff --check` passes. No production code or test code changed; no full repository test/coverage/build gate is due for this docs-only slice. Full global tests and 100% coverage remain required on the settled integrated Epic/PR candidate.
- Elapsed about 4m27s (13:01:33–13:06:00 UTC): documentation and preflight correction/board closeout about 2m; focused preflights, evidence checks, and Control Center tests about 2m27s; external-agent waits 0; maintainer-decision time 0.

## Scope and next step

No V03 gate, recipe coverage, geometry, receiver claim, or acceptance requirement changed. Preserve the all-seven criterion, protected export identities and legacy DXF behavior. CLO remains open during active G04 work. Next identify distinct evidence explaining the five short-edge CUT vertex losses before conducting another receiver exchange; no unit/scale repeats on this fixture.
