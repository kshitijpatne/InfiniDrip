# EPIC-17 / G04 — Verify GetonAgain elevation handoff — Slice 652 exit

## Verified result

At approximately 2026-10-10 00:26 UTC, read-only process inspection found two live consent processes (PIDs 66192 and 111192). Both exposed the exact main-window caption `Garment CAD(GetonAgain Free version).exe is requesting your permission`. This confirms that the current Windows elevation prompt identifies the user-authorized CAD setup. Neither process has been operated by Codex. No GetonAgain CAD process, uninstall-registry entry, or Start Menu shortcut was found, so installation is not verified.

## Gate disposition and next action

The exact user-authorized setup is awaiting manual Windows elevation. The user must approve the matching prompt in Windows; if they no longer want installation, they can cancel it. Once the user reports approval, reserve the next unique slice and verify the installed version and local input route. Stop at phone registration/login; do not create an account, provide personal data, or import a pattern until the exact local DXF input contract is evidenced.

This handoff clears no V03 acceptance gate and does not qualify a receiver/profile. V01/V02 remain Done, G04-V03 remains Blocked, EPIC-17 remains In Progress, and all acceptance criteria, holds, thresholds, legacy behavior, and protected export identities are unchanged. No physical-fit, factory-acceptance, or production-readiness claim.

## Verification and time

- Read-only PowerShell process/registry/start-menu inspection: exact consent caption verified; no install evidence found.
- No test code or production code changed. `npm run control-center:test` and `git diff --check` are run for the board/evidence closeout.
- Approximate elapsed time: approximately 2 minutes total; read-only verification and evidence capture approximately 2 minutes; external-agent wait 0 minutes; maintainer-decision wait still pending.
