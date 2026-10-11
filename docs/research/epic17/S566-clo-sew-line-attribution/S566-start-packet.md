# EPIC-17 / G04 V03 — CLO waistband sew-line attribution — Slice 566 start

- Started: 2026-10-09 03:18:40 UTC.
- Start commit: S565 `0a7b4ca` on `codex/epic-17-g04`.
- Refreshed `origin/main`: `a5af5e1`, ancestor of start commit. Working tree
  clean; S565 is the highest assigned number and S566 is reserved here as the
  next unique slice. Canonical board revision 3377; G04-V03 remains In
  Progress.
- Usage: ordinary work available at primary 50% and weekly 65% used.
- Existing CLO 2026.1.310 session remains open. S565's re-imported project and
  all DXF, project and rendered evidence remain under
  `C:\G04-CLO-DXF-Exchange\S565-clo-grade-state-diagnosis`.

## Scope

Determine why S565's source-expected waistband SEW contour fails the 0.001 cm
comparison for sizes S/M/L/XL after the CUT points were corrected. Inspect the
read-only S565 CLO project archive, its corrected DXF entities/layers and the
S562/S559 source fixture mapping. Separate direct pattern-source facts from
receiver-output facts and unknown receiver semantics. Do not assume the
nearest DXF polyline is the SEW outline solely because of geometric
proximity.

The current desktop capture and CLO accessibility tree disagree: the
accessibility tree reports an `Export DXF` modal while the same capture shows
the base workspace without that modal. Prior durable findings record the
same control mismatch. Do not send further input to CLO while the current
visible and accessible states disagree. This slice is offline/read-only and
does not repeat an export.

## Acceptance

- Establish whether the saved corrected CLO project exposes size-group,
  piece, point and CUT/SEW contour identities sufficient to map the tested
  residual to a specific wrong or missing graded line.
- Independently enumerate the corrected DXF waistband polylines per size and
  compare them with the named source CUT and SEW contours under the unchanged
  0.001 cm criterion, preserving candidate layer/entity identity in the
  report.
- State exactly what the evidence proves and what remains unknowable without
  a trustworthy interactive CLO observation or a documented receiver
  profile. If project introspection cannot answer the cause, close with that
  boundary and a minimal non-redundant next experiment.
- Keep every V03 rights/profile, all-seven-recipe, CUT/SEW, marks, malformed
  input, grading/options and round-trip gate unchanged and held. No normative
  conformance, receiver acceptance, production readiness, fit or factory
  claim.

## Non-goals and gates

No UI action, new CLO export/import, product/source/pattern edit, grading
algorithm change, acceptance-threshold change, dependency change, legacy DXF
change, or protected export identity change. Any additional durable exchange
artifact remains C:-only in the existing S565 folder. Run focused read-only
parser/source checks, script syntax checks, and `git diff --check`; no full
repository tests or global coverage are due unless production source/tests
change, which is out of scope. The EPIC's one settled full repository gate
remains required at its integrated PR candidate.

## Delegation and next boundary

The investigation depends on one binary project archive and its matching DXF;
parallel work adds no independent evidence. No safe disjoint delegation.
Codex owns analysis, report and integration. Record implementation,
verification, external-agent waits and maintainer-decision time separately at
exit. S566 does not release any face or V03 gate.
