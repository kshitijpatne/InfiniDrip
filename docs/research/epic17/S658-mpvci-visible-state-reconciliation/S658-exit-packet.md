# EPIC-17 / G04 V03 — MPVCI visible-state reconciliation — Slice 658 exit

## Result

S657's request for the maintainer to inspect the installer state is resolved
with direct read-only observation. The MPVCI 2.7 wizard is visibly open as a
transient modal over GMS. It is on the Information page, with Next and Cancel
buttons; the text says Next continues setup and warns uninstalling this
package removes all Visual C++ packages found on the system. No Windows
Security/elevation prompt is visible. The installer has not advanced and no
installation result is present.

This corrects S657's narrower statement that the installer had no targetable
window: its processes still expose no separate targetable main window, but the
wizard is visible in the screenshot captured for the returned GMS window.
Both MPVCI processes remain live and responsive. GMS remains open at its blank
nesting workspace; DGS is not running. No fixture was opened and no DXF
operation occurred. The maintainer's prior manual sign-in is already recorded
in S655; the present view does not show a sign-in page or reveal any further
authentication state.

The next Windows UI action would advance an installer. The applicable
Computer Use policy requires action-time confirmation for software
installation even after earlier general authorization. The latest user
instruction authorized checking the screen, not clicking Next. Therefore the
wizard and its processes are left untouched pending explicit action-time
approval. No V03 gate clears.

## Gate disposition

- Visible MPVCI wizard state: **verified**; installation: **unproven/not
  advanced**.
- DGS update and usable DGS window: **not attempted/unproven**.
- Direct local DXF input/output route and exact profile: **unproven**.
- Geometry, units, piece/grade identity and relations, seams/marks,
  malformed-input behavior, repeatability, readable output, and all-seven /
  options / grades round trips: **unproven**.
- V03 and Epic remain Blocked and In Progress respectively. V01/V02 remain
  Done. Acceptance, fixed `0.001 cm` tolerance, holds, legacy DXF behavior,
  and protected export identities are unchanged.
- No ANSI/AAMA or ASTM conformance, physical-fit, factory-acceptance, or
  production-readiness claim.

## Verification and closeout

- Start: 2026-10-10 06:52 UTC, clean S657 commit `3be7aae3870aaed47731afe71b7a9e8a36580ae9`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; canonical board revision 3796; Slice 658 unique.
- Evidence: fresh Computer Use screenshot of returned GMS window; read-only
  process snapshot for GMS, MPVCI and DGS; no user files or credentials read,
  saved, or transmitted.
- Focused verification: the first `npm run control-center:test` run failed
  2/42 assertions because the summary description edit omitted established
  canonical phrases. The exact assertions and diagnosis are preserved in
  `S658-initial-control-center-failure.md`; a validated wording correction
  restored those phrases, and the rerun passed 42/42. `git diff --check`
  passed. Documentation/board-only changes; production-code coverage is not
  applicable and the full repository gate remains for the settled Epic/PR
  candidate.
- Board: start evidence linked at revision 3799; exit evidence and latest
  description/comments linked through validated commands at revision 3807.
- Time: implementation and evidence reconciliation 1 minute; focused
  verification 1 minute; external-agent wait 0; maintainer-decision wait 0.

## Next action

The one immediate next action is for the maintainer to give action-time
approval to click **Next** in the visible MPVCI 2.7 installer. If approved,
click once and stop if Windows Security/elevation appears. Only after the
prerequisite's result is verified may the already-authorized official DGS
update be applied with the S657 rollback copies available. A successful DGS
launch unlocks local-DXF dialog inspection only; the fixture remains closed
until the exact local input/profile contract is observed.
