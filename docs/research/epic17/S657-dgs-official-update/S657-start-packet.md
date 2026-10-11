# EPIC-17 / G04 V03 — official DGS update — Slice 657 start

## Objective

Follow the already-authorized official Free Version sequence to make the bundled Pattern Design & Grading module usable: apply the documented MPVCI 2.7 prerequisite if the setup can proceed without agent interaction with Windows security UI, then apply the official dated DGS upgrade. Preserve the installed DGS files for rollback. Afterward verify the build and inspect only the local DXF open/export dialogs; do not import a fixture until the route and exact input contract are established.

## Verified start

- Start: 2026-10-10 06:46:36 UTC.
- Branch `codex/epic-17-g04`, HEAD `df309435f86e9f90dc594efbb8d1760544b0dc6d` (S656); refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor; worktree clean before this packet.
- Canonical board revision 3787; S656 highest; S657 reserved uniquely.
- Official update archive remains hash-pinned in `C:\G04-GetonAgain-CAD-Exchange\S651\package\Free_Version_DGS_20250610.zip` with SHA-256 `B8236F0B4BA00361D608C580B1738C551D771A3241E95A6492FE43013AF7B48F`.
- Installed DGS is V2023.1. Registry query found no MPVCI or matching VC++ 2010 install entry. Official installation note specifies CAD Free Version → MPVCI 2.7 → DGS zip upgrade. The maintainer already authorized the official DGS update; this is not a profile qualification.

## Scope and gates

- Preserve rollback copies and manifests only under `C:\G04-GetonAgain-CAD-Exchange\S657-dgs-official-update\`.
- Use the official package contents only. Stop before interacting with any Windows security/elevation prompt. Do not change Windows settings.
- Keep GMS open; do not reauthenticate. No DXF fixture import/export, source changes, format permutations, or standards claims.
- V03 remains Blocked until direct local DXF input/output, exact dialect/contract and every unchanged geometry, units, identity/relations, mark, malformed-input, repeatability, readable-output, all-seven/options/grades gate passes. Preserve `0.001 cm`, legacy DXF behavior and protected export identities.
- Update board/context/state through the validated command layer; focused Control Center tests and `git diff --check` apply. No production code/tests means changed-code coverage is not applicable.

## Stop and rollback

If Windows security UI appears, stop without input and leave the prompt for the maintainer. If the MPVCI setup fails or requests payment/online service, do not apply the DGS archive. If DGS update fails or breaks startup, restore the exact backed-up DGS files and record the error. A successful launch only unlocks route inspection; it clears no V03 acceptance gate by itself.
