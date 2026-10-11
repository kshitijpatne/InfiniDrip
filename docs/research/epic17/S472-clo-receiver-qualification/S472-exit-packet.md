# EPIC-17 / G04 V03 CLO receiver qualification — Slice 472 exit

## Disposition

S472 qualifies CLO 2026.1.310 as a **candidate for a bounded receiver proof**,
not as a selected receiver/profile. The maintainer reports the app is
downloaded, signed in, and at version 2026.1.310. Official CLO material
supports the host OS and documents apparel DXF-AAMA/DXF-ASTM import/export
modes. This advances the candidate from a documented link to an owner-reported
installed version with current published format support.

Rights are not yet cleared for fixture use: the standard trial is limited to
users eligible for an Individual license, requires payment setup, and
auto-starts a paid plan after 14 days unless canceled. Whether the owner is
eligible, whether the trial is active, and whether renewal has been canceled
are not known. The user has said they do not want paid software. No billing
account was inspected or changed. CLO menu choices and local-only data handling
have not been independently observed. **No S463 fixture was opened or
transmitted; no receiver/profile is selected and no compatibility claim is
made.** G04-V03 remains In Progress.

The owner-facing next steps are durable in `clo-receiver-preflight.md`. Before
Gate 0 passes, keep all S463 fixtures closed. If the Individual-license basis
does not apply or a no-charge trial cannot be confirmed, stop CLO testing; do
not contact the vendor or move to a hosted service under this Epic.

## Evidence classification

- **Officially documented:** CLO imports and exports Standard DXF, DXF-AAMA,
  and DXF-ASTM; its help page specifies import scale/unit and annotation
  settings, plus export size-group and grading options.
- **Officially documented:** current requirements list Windows 11 24H2 as
  minimum and 25H2 as recommended. S470 records this host as Windows 11 25H2.
- **Owner-reported:** installed version 2026.1.310 and signed-in state. No
  app-window or About screenshot was available to Codex in this slice.
- **Unverified:** the installed build's actual menu entries, file-local
  processing, rights for this project context, successful import/export,
  metadata preservation, malformed-file handling, and round-trip error.
- **Not claimed:** active ASTM conformance from CLO's `DXF-ASTM` menu label;
  standards-wide compatibility; grade-rule exchange; factory acceptance;
  production readiness.

## Verification and repository state

- Start: 2026-10-08 05:50:09 UTC, clean S471 commit `79de026ff27ec1b692f2770c5f72172a409bc087` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 471; S472 is unique.
- Start board revision 2907; EPIC-17 In Progress, V01/V02 Done, V03 In Progress.
- Evidence-only change. No production code, test, export, fixture, render, protected identity, account, license, subscription, or global gate changed.
- The validated command-layer replay advances board revision 2907→2911 and retains EPIC-17 In Progress, V01/V02 Done, V03 In Progress. S472 is linked as verified document evidence to G04-V03 and EPIC-17.
- `npm run control-center:test`: 42/42 pass. `git diff --check` passes. No production/global coverage, build, Electron or export gate is due.
- End: 2026-10-08 05:51:50 UTC; elapsed 1m41s. Time categories: candidate/research review 0m46s; durable packet, context, state, and board work 0m39s; focused verification 0m16s; external-agent waits 0m; maintainer-decision time 0m (the owner supplied the install/version update; rights eligibility remains unanswered).

## Next action

The owner must complete Gate 0 in `clo-receiver-preflight.md` without sharing
account or payment details: confirm applicable Individual-license eligibility
and a no-charge trial/cancellation state, then report the installed About
version, exact import/export menu modes, and whether DXF exchange stays on local
paths. Only if all gates pass should the representative synthetic fixture test
begin. The exact S463 sequence and comparison criteria are in the same
checklist. Re-estimate V03 after observed receiver behavior.

## Official sources checked

- CLO, [system requirements (April 2026)](https://support.clo3d.com/hc/en-us/articles/115000307168-CLO-system-requirements-April-2026), updated September 2026.
- CLO, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated September 2026.
- CLO, [download and current-version page](https://www.clo3d.com/en/clo/download), identifying version 2026.1.310.
- CLO, [free-trial eligibility and conversion](https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version).
- CLO, [license types](https://support.clo3d.com/hc/en-us/articles/115012951968-What-kind-of-licenses-do-you-offer) and [canceling a trial](https://support.clo3d.com/hc/en-us/articles/115012642347-Can-I-cancel-my-subscription?page=1).
- G04 profile and fixture criteria: `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`; fixture limits: `docs/research/epic17/S463-v03-receiver-fixture-pack/fixture-plan.md`.
