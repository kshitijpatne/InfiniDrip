# EPIC-17 / G04 — GetonAgain free desktop install and contract inspection — Slice 651 start

## Verified start and authority

Started 2026-10-10 00:04 UTC from committed S650 `2c7e1f3d` on
`codex/epic-17-g04`. `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
was refreshed and remains an ancestor. Worktree is clean. S650 is highest;
S651 is unique. Board revision 3746 shows G04-V01/V02 Done and G04-V03/EPIC-17
In Progress. Goal is active. Usage check: ordinary use allowed, primary window
28% used. CLO remains open as requested.

The maintainer confirms written product-development and local-DXF permission
for GetonAgain and conditionally authorizes acquiring/installing/running the
official desktop Free Version only if genuinely free and necessary. S650
records the official Free Version page, the separately online route exclusion,
and why this is the only remaining concrete local candidate after CLO's
tested failures and generic R14's insufficient industrial-apparel evidence.
During S651 the maintainer also reconfirmed approval for the official CAD
setup and DGS update, with MPVCI held unless a concrete missing-runtime error
occurs.

## Objective and bounded scope

Acquire only the official GetonAgain Garment CAD Free Version desktop package,
save downloaded installer/manual and any G04 exchange material only under
`C:\G04-GetonAgain-CAD-Exchange\S651\`, verify no payment is requested, record
the package/version and install behavior, and inspect the installed
version-matched input manual for the exact DXF dialect, units, metadata and
sidecar expectations. Verify that the direct DXF workflow can run locally
without routing files to the online edition before any garment fixture import.

No pattern import/export pilot is part of S651 unless the exact installed
input contract and local file route are both explicitly confirmed from
observable evidence. If either remains ambiguous, stop with no file opened in
the CAD system; return a source-exact fixture plan for S652. Do not create or
submit a new account or provide personal data; if registration is required,
stop and report it. The user has not supplied account credentials.

## Findings incorporated during slice

Official package retrieved directly from the Free Version page and hash-
verified in `S651-package-and-manual-findings.md`. Its outer ZIP contains the
unsigned CAD setup, a separate unsigned MPVCI 2.7 runtime installer, and the
2025-06-10 DGS update archive. The included install note requests both EXEs
before the update. The version-matched V2024.1 manual is downloaded, hash-
verified, and visually reviewed on its printed DXF import/export pages 239–241.
It documents ASTM/AAMA/AutoCAD vendor routes and a grade-dependent RUL
limitation, but not entity-level interchange semantics or normative
conformance. The official Free Version page says phone-number registration and
login are required. No account was created and no pattern was opened. After
action-time approval, the CAD setup launch timed out without a targetable
setup window. Two visible shell launch attempts likewise yielded no
targetable setup window or CAD process. Read-only process metadata showed
three `consent.exe` processes created at 20:18:00, 20:18:27, and 20:18:55
local time during those launch attempts; this is consistent with a Windows
elevation handoff but does not identify which prompt belongs to the setup.
Computer Use does not permit acting on Windows security prompts. No setup
completion, installed version, DGS application, or runtime error is evidenced.
Keep MPVCI held unless an observed missing-runtime error makes it necessary.

## Acceptance and gates

- Download only the official page's Free Version desktop artifact; abort on any
  payment, subscription, trial conversion, online-only route, or non-official
  mirror.
- The maintainer's action-time approval was received before the run attempt.
  Setup is held at a likely Windows elevation prompt that the agent cannot
  interact with; the maintainer must approve manually only if its displayed
  app/path matches the GetonAgain CAD installer.
- Record exact installed version, package hash, local install path, source URL,
  and manual pages covering supported DXF input, units, piece identity,
  grading/relationships, marks and warnings.
- Demonstrate local-only direct-DXF workflow without loading pattern data, or
  leave locality unproven and do not import.
- Do not select/qualify the profile based on menu labels. Do not claim AAMA/
  ASTM conformance. Preserve all V03 requirements, all-seven coverage, fixed
  tolerances, source geometry, export identities and holds.
- Update durable context and board through validated commands; run focused
  Control Center tests and `git diff --check`; close with `Slice 651:` commit.

## Non-goals and risks

No vendor contact, hosted/online edition, paid feature, account registration,
credential handling, fixture upload, pattern import, encoding/setting matrix,
product source change, acceptance relaxation, supplier contact, physical fit
or factory claim. Main risk: official instructions require phone registration
to use the free software; do not automate authentication or transmit personal
data. If a login is required, stop at the gate and ask the maintainer to
complete sign-in personally. The official install note also requests a
separate unsigned runtime package; do not run it without a concrete need.

## Delegation and estimates

No safe independent delegated work; inspect one version-matched artifact and
manual serially. S649 estimates remain stale; candidate pilot and later
seven-recipe coverage are still conditional on S651 proving an eligible local
input route. This slice alone has no delivery-date promise.

## Exit disposition (2026-10-10)

Package acquisition, hash verification, manual review, and mark-count inspection are complete. Installation is blocked on a Windows security elevation handoff. The evidence does not prove that the visible consent processes are this installer's prompt, so do not infer successful installation or accept any prompt on the maintainer's behalf. The maintainer must inspect the prompt and approve only if its displayed app/path matches the GetonAgain CAD setup; otherwise cancel it. After confirmation, use a new numbered slice to verify installation and inspect the local DXF input contract. Do not create an account or import patterns; stop at phone registration/login. S651 does not qualify or reject the receiver and clears no V03 gate. V01/V02 remain Done; V03/EPIC-17 remain open; all acceptance, thresholds, holds, protected export identities and legacy DXF behavior are unchanged.

### S651 time ledger

- Implementation/evidence preparation: approximately 11 minutes (official package/manual acquisition, hash checks, manual inspection, grade-count analyzer, and install attempt).
- Focused verification and launch diagnosis: approximately 4 minutes (analyzer syntax/run already recorded in findings, refreshed window and process checks; no Control Center suite run after this blocked exit yet).
- External-agent wait: 0 minutes; no delegation was appropriate.
- Maintainer-decision wait: under 1 minute for action-time approval. Manual Windows elevation handoff remains pending.
