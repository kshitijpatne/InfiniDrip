# EPIC-17 / G04 V03 — DGS launch diagnosis — Slice 656 exit

## Result

The no-window result has a concrete package-context explanation to test next, though it is not yet proven as the launch cause. The installed `DGS.exe` is V2023.1 (45,050,880 bytes). The already-acquired first-party `Free_Version_DGS_20250610.zip` (SHA-256 `B8236F0B4BA00361D608C580B1738C551D771A3241E95A6492FE43013AF7B48F`) contains a later dated DGS bundle: `DGS.exe` (45,265,920 bytes) plus language resources. The vendor's packaged install note specifies installing the CAD Free Version, installing `MPVCI_2.7_setup.exe`, then upgrading through this DGS zip. The Start-menu DGS shortcut points directly to the installed executable with no arguments or working directory.

This means the installed DGS is older than the version supplied in the official package, and the vendor identifies a runtime installer and a DGS upgrade as setup steps. It does not prove either is the exact launch failure. The GMS log folder contains a single recent GMS `.dat` file; its contents were not opened. There are no matching Application events in the observed post-launch window and no DGS crash dump was checked. No installer or archive member was executed, extracted, or copied; no system setting changed. The prior S654 conclusion that MPVCI lacked a basis came from the absence of a runtime error; the vendor install note is new first-party evidence and supersedes that limited evidence basis.

## Gate disposition

- Authenticated GMS workspace: **passed**, but it is the nesting module.
- DGS V2023.1 presence: **verified**; startup/window availability: **failed once**.
- Official package includes dated DGS upgrade and identifies MPVCI as part of its install sequence: **verified**.
- Whether old DGS build or absent MPVCI caused startup failure: **unproven**.
- Any GetonAgain local DXF input/output route, exact dialect/contract, and all technical V03 gates: **unproven**. No fixture has been exchanged; no gate clears.
- No ANSI/AAMA or ASTM conformance claim. All-seven scope, fixed thresholds, legacy DXF, protected identities, and all holds remain unchanged.

## Verification and closeout

- Start: 2026-10-10 06:43:25 UTC from clean S655 `86e9bd77e65f6eb66731d63f31676471403e3dbc`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor; board revision 3778; S655 highest, S656 unique. The validated start-evidence command advanced the board to 3779.
- Read-only checks: verified official DGS ZIP SHA-256, enumerated archive entry names/sizes without extraction, read the included install note, inspected DGS shortcut target/arguments/working directory, executable file version/size, recent log metadata, and matching Windows Application events.
- Focused verification: `npm run control-center:test` passed 42/42. `git diff --check` passed after trimming a duplicate newline at EOF from the prepended state/context summaries. No production source or tests changed; changed-code coverage is not applicable.
- No production source or tests changed; changed-code coverage is not applicable. Time: implementation 0; read-only package/launch diagnosis approximately 3 minutes; focused verification and durable closeout approximately 3 minutes; external-agent wait 0; maintainer-decision time 0.

## Next action

Use the already-authorized official DGS upgrade path as one bounded setup repair: follow the vendor sequence for MPVCI 2.7 and then apply the dated DGS bundle while preserving recoverable copies under the named C: G04 evidence folder. Stop immediately if Windows security UI requires interaction; do not handle that prompt. After a successful update, verify the resulting DGS build and inspect its local DXF open/export dialogs without opening a fixture. Only proceed to a source-exact representative pilot if the exact local route and contract are observed.
