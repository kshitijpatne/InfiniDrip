# EPIC-17 / G04 V03 — CLO account grant check — Slice 490 exit

## Result

The read-only CLO account/trial display did not provide an affirmative grant
covering local product-development CAD exchange evaluation. It showed CLO
Standalone OnlineAuth version `2026.1.310`, `14 DAYS LEFT`, “Your subscription
will be renewed,” the date `22.10.2026`, and a notice that an already
unsubscribed account will expire on that date. No account-specific grant,
license-scope statement, or agreement text authorizing the intended G04 use was
shown. A displayed trial period and enabled features are not rights evidence.

No project, pattern, fixture, or DXF was opened or created; no import/export,
settings change, account action, acceptance, upload, payment, or file save
occurred. The notice was dismissed with its `OK` button; the “Don't show
again” checkbox was left unchanged. CLO was then closed. A fresh app inventory
verified `isRunning: false` and `windows: []`. Chrome and its tabs were not
changed.

## Gate and status

- CLO does not clear V03 Gate 0 from the visible account/trial display.
  This is an evidence hold, not a legal conclusion about the account or any
  past use.
- No receiver/profile is selected. Rights-cleared local handling, exact
  apparel-profile input/output, same-receiver round-trip, graded fixtures,
  and malformed-input behavior remain untested and required.
- G04-V03 and EPIC-17 remain In Progress; V01/V02 remain Done. Preserve the
  all-seven V02 acceptance, every V03 gate, legacy DXF behavior, and protected
  export byte identities. Do not claim physical fit, factory acceptance, or
  production readiness.

## Verification and next action

The validated board command layer records this exit packet against G04-V03,
links it to EPIC-17, and records the held Gate 0 without changing status.
`npm run control-center:test` passes `42/42` on the settled board; S490 board
scripts pass `node --check`; `git diff --check` passes. No production code
changed, so changed-code coverage and rendered garment output are not
applicable. Keep the full repository gate for the settled integrated Epic/PR
candidate.

Next: proceed only when an exact local receiver/build has affirmative
rights-cleared access and local file handling. If the no-paid-software
preference continues, no candidate reviewed through S490 currently meets Gate
0. Do not use CLO fixtures or weaken V03 gates on the basis of this trial
screen.

## Timing

Elapsed `5m57s` (`09:10:34–09:16:31 UTC`; category estimates): account UI
inspection `3m10s`; implementation `0m`; focused verification `0m09s`; app
closure and inventory verification `0m40s`; durable record and board work
`1m58s`; external-agent wait `0m`; maintainer-decision time `0m`.
