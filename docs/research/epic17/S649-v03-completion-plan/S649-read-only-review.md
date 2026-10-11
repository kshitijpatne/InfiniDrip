# S649 bounded independent review and Codex disposition

## Assignment

One read-only high-reasoning review of the V03 matrix and completion plan only;
no repository edits, tests, receiver/UI operation, or gate decisions delegated.
Reviewer: GPT-6.1 Sol, high reasoning. Explicit completion signal received:
`WORK FINISHED — read-only review complete`.

## Review findings

- C04's accepted contract (lines 693–706) allows a version-matched sidecar
  for grade, piece identity, and seam relations when the CAD exchange format
  cannot carry them. The plan should verify sidecar binding and reconciliation
  rather than require every field to survive as receiver-native DXF metadata.
- S531 is concrete negative-input evidence: CLO DXF-AAMA silently accepts a
  malformed synthetic file and omits its inset SEW contour. Include it beside
  S626's generic OpenCAD negative result, while keeping scope limited to tested
  routes.
- S627 is the corrected 73-row generic R14 cohort; S559/S562 provide existing
  35-size grade fixtures and source point mapping. Reuse these rather than
  repeat broad fixture research.
- S648's file is generic R14/custom XDATA, not proven as GetonAgain's exact
  AAMA/ASTM input dialect. Document the candidate's first-party input contract
  and match a source-exact fixture before treating an import as dispositive.
- S640/S646 large cyclic point-list residuals are comparator results, not
  physical contour displacements. S634 independently measured source-to-path
  deviations above `0.001 cm`; keep those quantities distinct.
- Separate user-confirmed CLO trial/local-file rights from technical/profile
  acceptance. The only explicit receiver decision supported now is
  `NOT_SELECTED_NOT_PROVEN`; CLO is a vendor-specific empirical route only,
  with no ANSI/AAMA or ASTM conformance claim.

## Codex disposition

Codex verified these findings against the referenced C04, S531, S559/S562,
S627, S634, S640, S646, S647 and S648 repository evidence and applied all
material corrections to `V03-GATE-RECONCILIATION-S649.md` and
`V03-COMPLETION-PLAN-S649.md`. C04 sidecars are allowed only with explicit
version/revision binding, association, integrity and limitations. S531 is
recorded as a failed malformed-input test for that exact CLO profile/fixture;
it is not generalized to all candidates. The candidate-specific dialect
preflight now precedes receiver import. Point-list residuals are explicitly
separated from source-to-path deviation. No reviewer statement marks a gate
passed; the matrix dispositions remain Codex's evidence-based assessment.

The plan remains stop-first: no eligible receiver currently has a passing
representative fixture; no CLO permutation is scheduled. GetonAgain remains
blocked on first-party rights/locality evidence and explicit install/run
authorization. Exact standards claims remain disallowed absent normative
conformance evidence.
