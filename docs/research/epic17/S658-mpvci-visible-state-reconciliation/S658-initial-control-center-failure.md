# S658 initial focused-check failure and diagnosis

The first `npm run control-center:test` run after the validated board replay
reported 2 failures out of 42:

- `S361 evidence remains linked after the current summary reconciliation`
- `closed Epics 14–16 and admitted G04 status match their evidence`

Both assertions read the canonical EPIC-17 summary-card description. The first
requires the exact established phrase `S406's approved view-only
collar-over-plackets order remains implemented`; the second requires the
established `V01 and V02 are Done` and `Preserve V02-before-V03, legacy DXF
behavior and protected export identities` wording. The initial S658 edit had
compressed/rephrased those canonical status invariants while adding the live
installer observation. No evidence references, statuses, source code, or test
files were changed by that edit.

Correction: S658's validated `editItem` command restored those exact canonical
phrases and retained the new installer state. The full focused Control Center
suite then passed 42/42. Failure was limited to summary-card wording; no
acceptance criteria or production behavior changed.
