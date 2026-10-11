# EPIC-17 / G04 — Verify GetonAgain elevation handoff — Slice 652 start

Started 2026-10-10 00:25:38 UTC from clean S651 `396aa196d612131f4cda1f398ada6f8d5af8385d` on `codex/epic-17-g04`. Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Board revision 3752; V01/V02 Done, G04-V03 Blocked, EPIC-17 In Progress. S651's manual elevation handoff is the sole current blocker.

## Scope

Read-only verification of whether the user-authorized GetonAgain CAD setup is in fact the source of the outstanding Windows consent prompt. Inspect the process caption and whether an installation is already present. Do not accept/dismiss security UI, launch another installer, change any V03 gate, or import a pattern. Record the exact remaining user action.

## Acceptance and stop condition

- Confirm the exact targetable `consent.exe` process/window caption, process IDs, whether a GetonAgain CAD process is running, and whether an uninstall entry or start-menu shortcut exists.
- If the window caption identifies the authorized CAD setup, instruct the maintainer to approve that prompt manually; otherwise keep the install held.
- No executable or security prompt is operated by Codex. Stop after the read-only check and durable record.
- Preserve all V03 gates, all-seven recipe/option/grade scope, fixed thresholds, legacy DXF behavior, protected export identities, and all holds.

## Non-goals

No additional installation attempt, UAC interaction, runtime installation, account creation, login, personal-data entry, fixture import/export, profile qualification, or standards claim.

## Delegation and time

No independent delegated work. Start 00:25:38 UTC; close with actual read-only verification time recorded in the exit packet.
