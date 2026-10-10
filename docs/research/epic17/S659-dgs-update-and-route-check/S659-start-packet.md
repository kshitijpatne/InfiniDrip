# EPIC-17 / G04 V03 — MPVCI verification, DGS update and route check — Slice 659 start

## Objective

Verify the now-closed MPVCI installer state, apply the already-authorized
official dated DGS update from the hash-pinned C:-drive package with the S657
rollback preserved, verify the exact installed build, and inspect the DGS
local DXF input/output dialogs without opening a fixture. This advances only
the candidate-access preflight; it cannot qualify a receiver/profile or clear
a V03 acceptance gate.

## Verified start

- Start: 2026-10-10 07:15 UTC.
- Branch `codex/epic-17-g04`, clean HEAD
  `c8397c0410cef333081727dff7a3c887c57a51a8` (`Slice 658`). Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; no
  Slice 659 exists on inspected refs. Board revision 3807; EPIC-17 In
  Progress, G04-V03 Blocked, V01/V02 Done. Goal record is active after the
  resumed continuation. Ordinary usage allowed; primary 7%, weekly 7%.
- The two MPVCI setup processes and wizard window have exited. Read-only
  uninstall-registry inspection now shows `MultiPack Visual C++ Installer
  V2.7`, plus Microsoft Visual C++ 2010 x64 and x86 Redistributables
  `10.0.40219`, all dated `20261010`. This verifies registration/completion
  of the prerequisite; it is not evidence that DGS was updated.
- GMS remains open at `GMS Untitled`; DGS has no process/window. The installed
  `DGS.exe` remains V2023.1.0.0, 45,050,880 bytes, SHA-256
  `EB48A6048CCE597162329E76DD6D4A6BED0303EE2AADF848AC6A81D744834722`,
  matching S657's rollback manifest.
- The vendor-provided C:-drive update archive
  `C:\G04-GetonAgain-CAD-Exchange\S651\package\Free_Version_DGS_20250610.zip`
  still hashes to
  `B8236F0B4BA00361D608C580B1738C551D771A3241E95A6492FE43013AF7B48F`.
  Its 15 flat entries (`DGS.exe` plus the 14 named `.lan` resources) exactly
  match the rollback inventory. All 15 rollback files currently match their
  recorded lengths and SHA-256 values. The official note says to install the
  CAD Free Version, install MPVCI 2.7, then use this zip to upgrade.
- C:-only apply destination
  `C:\G04-GetonAgain-CAD-Exchange\S659-dgs-update\` does not exist yet.

## Scope and gates

- Use only the already-acquired, hash-pinned official archive. Stage under the
  named S659 folder on C:. Replace only the exact 15 DGS files after checking
  extracted names and sizes. Preserve and verify the S657 rollback before and
  after the copy; write an apply manifest with before/after hashes.
- Do not download software, change Windows settings, contact the vendor,
  authenticate, open any G04 pattern/DXF fixture, or alter application source.
- If any archive member differs, any copy/hash check fails, or the app requires
  elevation/security interaction, stop and restore from S657 backups as needed.
  Do not automate security UI.
- After the copy, verify the DGS executable version/file hash and launch this
  already-installed module once. Inspect actual local open/export choices only;
  no DXF import/export until the exact route and input contract are observed.
- Preserve all V03 gates, seven recipes/options/grades, fixed `0.001 cm`
  threshold, legacy DXF behavior, protected export identities, and V02-before-
  V03. No standards-conformance, physical-fit, factory-acceptance, or
  production-readiness claim.
- No independent low-risk delegation: update and launch are sequential,
  machine-specific, rollback-sensitive work.

## Acceptance and stop conditions

- MPVCI registration/completion evidence recorded accurately.
- DGS update result and exact version/hashes recorded; rollback remains usable.
- Actual DGS window and DXF dialog choices observed, or exact launch/route
  failure recorded. A menu label or successful launch does not qualify the
  format or clear a V03 gate.
- Run `npm run control-center:test` and `git diff --check` for board/docs
  closeout; no production-code coverage applies. Full repository gate remains
  reserved for the settled integrated candidate.

## Next action

Extract the exact verified archive into the unused S659 C:-drive staging
folder, verify its members and metadata, then copy only the 15 matching files
to the GetonAgain installation directory. Keep the app open and inspect DGS
once after hash/version verification.
