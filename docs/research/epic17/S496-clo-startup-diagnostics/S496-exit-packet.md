# EPIC-17 / G04 V03 CLO startup diagnostics — Slice 496 exit

## Findings

The read-only diagnostics found no recorded application crash or explicit
startup error, but a controlled second launch reproduced a concrete inability
to reach CLO's pattern workspace:

- The first launch's local `authentication.log` recorded `STARTUP`,
  `REQUEST_LOGIN_START`, and `LOGIN_SUCCESS` against CLO's API at 09:56:31,
  09:56:49, and 09:56:53 local time. No later app-log error was recorded.
- Windows Application events from 13:50–14:05 UTC contained no matching CLO
  process error/crash entries. The CLO cache contained downloaded library
  assets, but no `.dmp`/`.mdmp` or named crash/error file was present.
- A second launch at 10:05 local again recorded `LOGIN_SUCCESS`. The startup
  screen advanced from “Creating Scene and Library” to “Loading CLO”; Windows
  briefly reported the process as responding, then reported PID 64976 as
  `Responding: False` after about a minute, before any pattern workspace was
  exposed. Its cache contained 66 files and continued writing during startup.
- CLO displayed its integrated Intel graphics/DX11 performance notice. No
  graphics, network, firewall, app, or system setting was changed.
- The desktop bridge could capture CLO's windows but repeatedly rejected the
  modal click target as “window is not a usable app window”; a later state read
  reported that the foreground window did not provide a process ID. The target
  bridge therefore cannot reliably dismiss the subscription/startup notices.

The exact idle process was closed after the second reproduced stall. No project
or DXF was open, no import/export was attempted during S496, and no exchange
file was written or changed. The evidence supports “this installed CLO launch
did not reach a usable workspace twice,” not “CLO's DXF format is incompatible.”
No explicit vendor error message was observed.

## Effect on V03 evidence

S496 does not clear or revise any V03/C04 gate. Prior actual operations remain
the valid technical observations: Tee M and Woven M contour subsets passed,
Woven's second generation matched, and Polo M had five source CUT contours
outside the fixed `0.001 cm` tolerance. Those file tests predate this startup
problem and are not invalidated by it. Numeric-layer semantics remain
ambiguous as recorded in S495; S493's clean-import warning, rights/local
handling, grade, negative-input, and independent-receiver requirements remain
open. CLO is not selected or qualified. No compatibility, ASTM, factory,
physical-fit, or production-readiness claim is made.

## Verification and scope

- The application log was read with email/token/password-like content redacted;
  only the three timestamped status events above were retained.
- Relevant Windows Application events were queried around each launch; none
  matched CLO's process or reported its startup failure.
- Process PID 64976 was observed `Responding: False`, then stopped after the
  workspace failed to appear. A process query verified CLO closed.
- No code, tests, source geometry, DXF input/export, or protected byte identity
  changed. No application/system setting, account state, or network setting
  changed. CLO outputs, if any, remain confined to
  `C:\G04-CLO-DXF-Exchange`; none were produced in S496.
- No delegation or external-agent wait occurred.

## Boundary and next action

Started `2026-10-08 14:04:17 UTC` from clean S495
`7927620c4f14a6eecbecf1df31d47c471d7284e0` on `codex/epic-17-g04`;
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
S495 was highest; S496 is unique. Validated start replay advanced the board
`3083→3085`; exit replay records evidence through revision 3090 while keeping
EPIC-17/G04-V03 In Progress and V01/V02 Done.

Approximate elapsed-time accounting through closeout: implementation `0m`;
focused logs/event/process diagnostics `2m`; practical CLO launch checks and
close `2m`; external-agent wait `0m`; maintainer-decision time `0m`; durable
records and board closeout `1m`.

**Next:** preserve the existing technical results. To continue live exchange,
the installed app must reach a responsive workspace (or use another already
available exact receiver after its rights and local handling are established).
Do not retry repeatedly or change settings without a diagnosis. Keep Polo's
measured failure and every unproven V03 gate open until receiver evidence passes
the admitted criteria.
