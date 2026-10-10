# S665 focused verification failure and diagnosis

The first `npm run control-center:test` run failed 2/42 assertions after the
S665 summary refresh. Both failures are in `ops/control-center/app/board.test.mjs`:

- `S361 evidence remains linked after the current summary reconciliation`
  expected the canonical phrase `S459 accepts all seven recipes, 73 supported
  configurations and 146 front/back faces`.
- `closed Epics 14–16 and admitted G04 status match their evidence` expected
  the EPIC-17 admission packet link and the previously recorded S457/S406
  V02 acceptance facts on both the Epic record and summary card.

The S665 edit had replaced those durable V02 summary statements instead of
preserving them. This was a board-description regression, not a product or
test defect. Restore the exact protected statements and admission link while
retaining the new verified S664/S665 V03 status. Run the two affected tests,
then rerun this focused Control Center suite; do not alter the assertions.
