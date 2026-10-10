# S675 route decision — no current profile clears V03 entry

## Decision

No already documented route qualifies V03, so there is no truthful next
receiver operation to run under the current constraints. Mark G04-V03 Blocked
with its full acceptance unchanged; keep EPIC-17 In Progress. This is an
evidence-based receiver/access hold, not a product-code defect and not a
request for another exploratory app install.

## Evidence reconciliation

- **LibreCAD 2.2.1.5 R12:** S674 exact Polo M comparison passed 18/18 CUT/SEW
  paths at 0.000 cm, 38/38 marks, eight layers and clean reopen. Its output
  omits source `$INSUNITS=5`, so the tested profile fails unit self-description.
  Piece/revision identity, grades, malformed input, repeatability and complete
  readable output were not established. Generic 2D CAD is not an apparel CAD
  profile.
- **CLO 2026.1.310:** S672 Standard route fails measured CUT, units, mark/layer
  identity and readable-output gates. S627's DXF-AAMA route passes one repaired
  Woven geometry round trip and basic shape render, but its output is unitless
  and it does not prove marks, source identity, grade, or all-seven exchange.
  Earlier trials already cover the other nonqualified CLO paths; do not repeat.
- **DGS/GetonAgain:** prior native DXF controls yielded blank pattern import or
  metadata-only output; the installed GMS front end has no DXF pattern-import
  route. Retired; do not reopen.
- **Open CAD Studio R14:** S627 passes all 73 valid source fixtures for
  geometry, marks and second-generation byte stability, but the generic local
  receiver is not an industrial apparel profile and its output is unitless.
- **Existing grade evidence:** S559/S562 produce 35 source-size fixtures and
  stable source edge/SEW mappings. They contain no proven grade-bearing
  receiver representation, unit contract or receiver identity behavior.

C04's accepted contract selects no target and requires a named receiving CAD,
exact version/workflow, permitted profile and receiver fixture. It identifies
missing units as a negative case that must visibly fail or block. Its sidecar
allowance is limited to grade, piece identity and seam relations; it cannot
replace geometry or visible marks and does not repair absent unit semantics.
The independent reviewer confirmed this interpretation and found no existing
evidence that clears the entry gate. The reviewer also confirmed that S627 and
S559/S562 are reusable only after a receiver qualifies, and that the Polo M
fixture cannot assess identity because it has no identity payload.

## Smallest required input to resume V03

Provide access to one specifically named, rights-cleared apparel CAD receiver
and version that can be used locally for product-development DXF evaluation
and has an explicit unit interpretation compatible with C04. The route can
then be tested with the existing Polo, option, grade and negative fixtures.
No paid acquisition is authorized by this packet. An alternative is an
explicit owner-approved amendment to V03's industrial-profile criterion; that
would change the admitted acceptance and is not made here.

No ANSI/AAMA/ASTM conformance claim is inferred from a menu label. No physical
fit, factory acceptance, or production readiness is claimed.

## Verification and elapsed time

- Evidence review: C04 target/negative contract, S627 matrix, S559/S562
  grade-source packets, S672/S673/S674 candidate evidence.
- Independent reviewer: WORK FINISHED; bounded read-only Sol high review
  confirmed the stop condition and reusable fixture sources. Wait time about
  1 minute.
- Implementation and focused verification: documentation/board-only; no
  production-code tests or coverage apply. `npm run control-center:test`
  passed 42/42 after updating current-state assertions for G04-V03 Blocked;
  `git diff --check` passed. No production code or acceptance criteria changed.
- Maintainer-decision time: 0 minutes; no response was required to set a
  truthful blocked status.

## Slice closeout

Closed at 2026-10-10 17:10 UTC on the verified S674 base. Canonical board
revision 4016 records G04-V03 Blocked and EPIC-17 In Progress. The focused
Control Center suite passed 42/42 and diff check passed. The board-status test
updates assert the current board state; historical slice evidence remains
unchanged. Approximate elapsed wall time was 7 minutes: about 6 minutes active
implementation/reconciliation and 1 minute waiting for the independent review;
focused verification took about 2.3 seconds, and maintainer-decision time was
0 minutes. No production code changed, so changed-code coverage does not apply.
