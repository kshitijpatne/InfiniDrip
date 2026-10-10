# EPIC-17 / G04 V03 — official DGS update — Slice 657 exit

## Result

Rollback preparation succeeded, but the documented MPVCI prerequisite did not expose an installer window, so the official update sequence is paused before installation and before the DGS archive is applied. The exact installed `DGS.exe` plus all 14 `DGS_*.lan` files were copied to `C:\G04-GetonAgain-CAD-Exchange\S657-dgs-official-update\rollback\installed-dgs\`; `rollback\manifest.json` records names, sizes, versions, and SHA-256 hashes. The original hash-pinned 2025 DGS ZIP remains untouched.

Codex launched the already-bundled `MPVCI_2.7_setup.exe` once through the approved computer-use runtime. The runtime reported `launched app did not expose a targetable window`. Read-only process inspection then found two live installer processes (the original executable and its temporary helper), with no main-window title/handle; they remained responsive but idle at low CPU. No `consent.exe`, matching Application event, or MPVCI uninstall registration appeared. The process command line had no extra arguments. No installer completion or error message can be verified, so neither MPVCI nor DGS was updated. The installer processes were left untouched; GMS remains open and authenticated. No DXF/pattern fixture was opened or exchanged.

This is a concrete UI availability block, not a DGS package failure or a DXF interoperability failure. We need the maintainer to inspect the visible desktop and report whether the MPVCI installer/security prompt is present or whether no window is visible. Do not launch another copy, kill the live setup processes, or apply the DGS ZIP until their state is clarified.

## Gate disposition

- Rollback copy and hash manifest of the installed DGS payload: **passed**.
- MPVCI installation: **unproven/incomplete**; setup remains live with no targetable window.
- DGS upgrade: **not attempted**.
- DGS build/window availability: **V2023.1 installed; current update path awaits visible installer state**.
- Local DXF route, exact dialect/contract, every technical V03 gate, all-seven/options/grades: **unproven**; no gate clears.
- G04-V03 remains Blocked; EPIC-17 remains In Progress. V01/V02 Done. No acceptance, threshold, scope, protected export identity, or legacy DXF change. No ANSI/AAMA or ASTM conformance, fit, factory acceptance, or production-readiness claim.

## Verification and closeout

- Start: 2026-10-10 06:46:36 UTC from clean S656 `df309435f86e9f90dc594efbb8d1760544b0dc6d`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; board revision 3787; S656 highest; S657 uniquely reserved. Start evidence advanced the board to 3788; exit evidence and canonical board replay completed through revision 3796.
- Focused verification: `npm run control-center:test` passed 42/42; final `git diff --check` passed. No production source/tests changed; changed-code coverage is not applicable.
- Time: rollback capture and installer attempt/observation approximately 2 minutes; documentation/board closeout and focused verification approximately 2 minutes; external-agent wait 0; maintainer-decision wait 0.

## Next action

Maintainer: inspect the current desktop for an MPVCI installer or Windows security prompt, and report the exact visible state. If no installer is visible, keep both setup processes untouched until the screen state is known. Then finish or cancel the official prerequisite, verify its result, apply the DGS archive with rollback available, verify the actual DGS build, and inspect the local DXF route without a fixture. Stop at any Windows security/elevation UI rather than interacting with it.
