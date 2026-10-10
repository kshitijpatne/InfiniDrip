# EPIC-17 / G04 V03 — GetonAgain installed-build gate — Slice 654 exit

## Outcome

The package is installed at `C:\Garment CAD(GetonAgain Free version)`.
Windows' uninstall record is `Garment CAD(GetonAgain Free version)` with a
generic `GetonAgain Free version` display version and that install location.
File metadata identifies:

- `GMS.exe`: 2024.1.0.0 / V2024.1, product name in Chinese identifying a
  garment CAD/nesting system. It launches successfully into the actual
  GetonAgain Garment CAD sign-in dialog. Its accessible UI exposes Sign in,
  Register, Forgot password, and credential fields; no CAD workspace is open.
- `DGS.exe`: 2023.1.0.0 / V2023.1, `Pattern Design & Grading`. One launch
  attempt produced no targetable window and no live DGS process. No relevant
  Windows Application error record was found. This app's launch and role in the
  exchange path remain unproven.
- The install folder includes `mfc100.dll`, `msvcp100.dll`, and `msvcr100.dll`;
  there is no observed missing-runtime error and no basis to install MPVCI.

No account was created, credentials entered, fixture opened, or DXF imported or
exported. The UI stops at sign-in/registration; therefore the installed
workspace's actual import/export menus, supported entity contract, and local
file processing route remain unverified. The V2024.1 manual describes menu
choices but cannot substitute for this build-specific inspection.

## V03 gate disposition

- Official package present and exact executable builds inspected: **passed**.
- Authorized product-evaluation/local-file handling: **passed by maintainer
  confirmation**, not an independent legal opinion.
- Authenticated access to receiver workspace and local direct-DXF path:
  **unproven; blocked at Sign in/Register**.
- Specific vendor/profile contract, DXF geometry and marks, units, piece/grade
  identity and relations, malformed-input rejection, repeatability, and
  rendered-output readability: **unproven**. No V03 acceptance gate clears.
- ANSI/AAMA or ASTM conformance: **unproven and not claimed**.
- V01/V02 and the all-seven recipes/options/grades scope: unchanged.
- Legacy DXF behavior and protected export byte identities: unchanged.

## Verification and slice accounting

- Git and upstream refreshed at start: `origin/main` remained
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of S653
  `fd0a51b3edddc344f318fe8f8690a49022aadbe5`; worktree was clean and S654 was
  reserved as the next unused number. Starting board revision 3761. S653's
  packet incorrectly described the desktop as uninstalled and requested UAC
  approval; this slice reconciles that stale state. Validated command-layer
  replay advanced the board `3761→3769`, retaining G04-V03 Blocked and
  EPIC-17 In Progress.
- Focused verification: the first `npm run control-center:test` caught one
  assertion in `closed Epics 14–16 and admitted G04 status match their
  evidence`: the Epic description had lost the exact “Preserve
  V02-before-V03, legacy DXF behavior and protected export identities” clause.
  The wording was restored using two additional validated board commands.
  The targeted assertion then passed 1/1; the settled Control Center suite
  passed 42/42; `git diff --check` passed. No production code/tests changed;
  changed-code coverage is not applicable.
- State reconciliation and command preparation/replay: approximately 2
  minutes.
- Focused verification and correction: approximately 1 minute.
- External-agent wait: 0 minutes; no delegation was safe.
- Maintainer-decision time: 0 minutes during the slice; no new product/design
  decision was requested.

## Durable records and next action

`CONTEXT-INDEX.md`, `PROJECT-STATE.md`, and the canonical board now reflect
that the package is installed, GMS opens to authentication, and the DXF path
remains blocked/unproven. G04-V03 remains **Blocked**, while EPIC-17 remains
**In Progress**. The user must complete sign-in/registration in GetonAgain;
Codex will not automate authentication. Once the app is open to its workspace,
the next action is one source-contract/local-path preflight following S653,
with no fixture opened until the exact receiver contract is matched to
source-exact evidence. All acceptance gates and holds remain unchanged.

No physical-fit, factory-acceptance, or production-readiness claim is made.
