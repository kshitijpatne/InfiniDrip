# EPIC-17 / G04 V03 — CLO trial rights and file-handling check — Slice 526 exit

## Finding

The current official CLO trial terms do **not affirmatively authorize** using
the standard 14-day Trial License for G04 product-development exchange tests.
The CLO Additional Terms §5.1.4 say a Trial License is solely for “Trial
Purposes”; the same section defines those purposes as evaluation and
demonstration but expressly excludes “any commercial, promotional, marketing,
advertising, or for-profit purposes.” G04's receiver investigation is part of
developing InfiniDrip's product for professional CAD exchange. Treating that
work as a commercial/for-profit purpose is the project-context interpretation
of the clause, not a legal opinion. The clause is concrete enough that prior
user authorization to operate CLO locally cannot by itself clear the separate
license-rights gate.

CLO's current support pages distinguish trial eligibility from trial purpose:
the 14-day web trial is reserved to users eligible for Individual licensing,
while CLO's Individual license can cover individual commercial use for a
qualifying freelancer, sole proprietor, or one-person company. That general
Individual-license permission does not supersede the separate and narrower
Trial License restriction. G04 must not continue importing or exporting
product fixtures in the trial unless CLO provides an applicable written
authorization or another valid license and data-handling basis is established.
No paid software is selected or recommended here.

## Local-file handling

The current CLO General Terms §6(c–d) state that some software aspects
automatically connect to CLO-maintained websites or servers and that
installation/access and continued use may require remote authentication.
Section 7(h)(iii) gives CLO a license for operating the software and for
Content Analytics, including analysis of how users use the software and
characteristics of Work Product such as file type and structural attributes.
The Privacy Policy (last updated 2026-03-30) says it may receive content users
create, input, upload, or submit to Services and may use service providers for
hosting/storage and analytics. These terms do not prove that a particular
standalone DXF operation transmits its pattern content. They also do not
establish or guarantee G04's required local-only handling boundary. That gate
remains unresolved.

## Source findings

| Source | Current version/date | Finding for this gate |
|---|---|---|
| [CLO Additional Terms](https://legal.clo-set.com/additional-clo), §§2.2.1, 3.1.1, 5.1.4, 5.3.4 | Last updated 2024-09-02 | Trial eligibility classes; Trial Purposes exclude commercial and for-profit purposes; standard trial is 14 days absent a written agreement. |
| [CLO General Terms of Use](https://legal.clo-set.com/modal-tou-general), §§6(c–d), 7(h)(iii) | Last updated 2026-03-30 | Automatic connections and remote authentication may occur; Work Product Content Analytics license is granted. |
| [CLO Privacy Policy](https://legal.clo-set.com/modal-pp), §§2, 3, 5, 11 | Last updated 2026-03-30 | Content provided to or created through Services may be received/processed; service providers include hosting/storage and analytics; cross-border service processing is described. It does not specify whether local standalone DXF operations send file contents. |
| [How do I start a CLO free trial?](https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version) | Updated 2026-10-07 | Standard 14-day trial is for users eligible for an Individual license; enterprise/academic users need a separate trial. |
| [CLO Individual vs Enterprise](https://support.clo3d.com/hc/en-us/articles/115013509228-What-is-the-difference-between-CLO-for-Individual-and-CLO-for-Enterprise) | Updated 2026-10-01 | Individual license is for personal use or individual commercial use by a qualifying individual; businesses with more than one employee require Business. This describes license class, not the Trial Purposes exclusion. |

## Gate disposition and next decision

- **Trial permitted-use basis:** unresolved for this G04 product-development
  purpose and not cleared by the standard trial evidence. The S503 user
  authorization permits a bounded local evaluation but explicitly does not
  establish commercial-use rights.
- **Local-only handling:** unproven. No claim is made that pattern bytes were
  transmitted, and no telemetry test was performed; the published terms do
  not guarantee the required local-only boundary.
- **Next CLO fixture operation:** held pending a written authorization that
  covers this product-development use and acceptable file handling, or a
  separately qualifying license/profile. Do not repeat the completed base-M
  tests, contact CLO, create an account, or purchase a plan under this slice.
- **V03:** remains In Progress. No rights/profile, geometry, semantic, grade,
  warning, negative-input, or independent-receiver gate is changed or cleared.
  No acceptance threshold or claim boundary changes.

## Verification and closeout

S526 started `2026-10-08 20:05:50 UTC` from S525 `288e77ca811045d0738f40b55d3f1a113a415a65`
on `codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S526 is
unique after assigned S525. Validated board start/exit replay is
`3215→3217→3219`. Primary-source page sections and update dates were reviewed.
No CLO UI, account, file, or network action occurred; no production code
changed. `preflight-exit.mjs` and canonical board validation pass at 3219;
`npm run control-center:test` passes 42/42; `git diff --check` passes.
Changed-code coverage and the full repository gate do not apply to this
read-only review.

Elapsed time: `20:05:50–20:11:25 UTC` (5m35s) — official source review 1m40s,
decision/gate reconciliation 0m35s, durable closeout 3m20s,
external-agent waits 0m, maintainer-decision time 0m.

**Next action:** obtain authoritative written rights and a compatible data-
handling basis, or keep CLO out of further pattern trials. Since the current
candidate set contains no independently qualified no-cost apparel receiver,
G04-V03 cannot be closed safely until a qualified permitted receiver/profile
path is identified and all remaining geometry, semantics, grade, negative,
and round-trip gates pass. Keep CLO open while the Epic still requires it.
