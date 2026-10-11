# EPIC-17 / G04 V03 — TUKAcad trial/profile screen — Slice 491 exit

## Result

The official product page advertises a free 14-day TUKAcad Learning Edition
trial. Its named CLE plan lists apparel pattern making/grading, 14 pieces per
file, four graded sizes, and marker making. The page lists “Data import / export”
under TUKAcad CPE (Professional Edition), not under CLE. It does not say that
the trial temporarily unlocks CPE features. A publisher tutorial documents
legacy DXF artwork import, but not current-trial garment-pattern exchange or
export. The evidence does not support choosing the CLE trial as a receiver.

The page says free trials run through TUKAweb account creation and checkout.
Current public copy says subscriptions bill monthly and may be cancelled;
the detailed tutorial describing card entry and post-payment download was
published in 2021, so its checkout details are recorded as dated, not current
trial terms. No account or checkout was opened, and no payment, contact,
download, installation, fixture, or file operation occurred.

The product page lists Windows 11 support and an active internet connection.
It does not establish that all trial processing/file handling is local or
that product-development use is rights-cleared. Exact DXF profile,
directionality, pattern semantics, and round-trip behavior were not tested.
See `S491-source-matrix.md` for the exact claim/source boundary.

## Gate and status

- TUKAcad CLE is **not selected**: no published evidence that the no-cost
  trial includes the advertised CPE import/export feature or that its rights
  and file handling clear Gate 0.
- No compatibility claim or fixture result is made. Exact apparel-profile
  import/export, same-receiver round-trip, graded behavior, malformed-input
  handling, and local file processing remain required V03 evidence.
- G04-V03 and EPIC-17 remain In Progress; V01/V02 remain Done. Keep all V03
  gates, generic legacy DXF behavior, protected export identities, and
  no-physical/factory/production-readiness boundaries unchanged.

## Verification and next action

Validated board commands link this source matrix and exit packet to G04-V03,
link the exit to EPIC-17, and preserve both statuses. `npm run
control-center:test` passes `42/42` on the settled board. S491 scripts pass
`node --check`; `git diff --check` passes. No production code or garment output
changed, so changed-code coverage and rendered review do not apply. Run the
full repository gate on the settled integrated Epic/PR candidate.

Next: only pursue a receiver whose exact no-cost tier publicly documents
rights-cleared local use and the required apparel-profile import/export. If
none is available, V03 remains held; do not register, pay, install, or weaken
acceptance criteria as a workaround.

## Timing

Elapsed `2m37s` (`09:19:30–09:22:07 UTC`; estimates): official-source review
`0m45s`; implementation `0m`; focused verification `0m10s`; durable
packet/board work `1m42s`; external-agent wait `0m`; maintainer-decision time
`0m`.
