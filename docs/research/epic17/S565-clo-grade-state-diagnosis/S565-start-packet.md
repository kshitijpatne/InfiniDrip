# EPIC-17 / G04 V03 — CLO graded-state diagnosis — Slice 565 start

- Started: 2026-10-09 02:51:30 UTC.
- Start commit: S564 `a521b01` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e1`; it remains an ancestor. Working tree
  was clean, the latest assigned slice is 564, and S565 is the next unique
  number. Canonical board starts at revision 3373 with G04-V03 In Progress.
- Usage check: ordinary work allowed; primary 44%, weekly 64% used.
- CLO 2026.1.310 remains open. The saved disposable S564 project and all
  S565 exchange/render files remain on C:. S565 evidence folder:
  `C:\G04-CLO-DXF-Exchange\S565-clo-grade-state-diagnosis`.

## Scope and dependency

Diagnose the actual state mismatch from S564: source-derived 20 mm per-step
offsets were visible in CLO's grading-point editor, but all waistband size
blocks exported at the XS width, while the source expects widths
44.5/46.5/48.5/50.5/52.5 cm. Inspect the saved CLO project, active group and
piece membership, selected point identity, point-level increments, and
effective per-size outlines against the S562 source-point report. Use the
running CLO UI plus read-only project-file inspection as needed. Do not invent
or infer a grading point from shape similarity alone.

## Acceptance for this bounded diagnostic

- Identify, with direct project/UI evidence, whether the selected 20 mm values
  belong to the waistband piece's expected right-edge vertices and the
  exported five-size group.
- Explain whether values were unapplied, assigned to a different point/group,
  or lost by the actual exporter. Distinguish facts from any remaining
  unverified hypotheses.
- If the source-to-CLO mapping and a single corrective UI state are directly
  established, make one disposable correction in the named S565 C: folder,
  export a uniquely named DXF there, and compare it against all five source
  fixtures at 0.001 cm. Otherwise stop without another export and record the
  exact unresolved setting/evidence.
- Preserve the prior S564 files and every G04 acceptance gate, geometry,
  protected byte identity, and legacy DXF behavior.

## Non-goals and required checks

No product code, source pattern, grading algorithm, production UI, acceptance
threshold, or V03 gate change. No grade values inferred beyond the S562 source
report. No paid standard or external file transfer. No physical-fit, factory,
or production-readiness claim. Run focused project-state/parser checks and
inspect actual rendered output if an export occurs. No full repository gate is
due unless a settled integrated source/test candidate is produced.

## Delegation and timing

The saved CLO document, live UI selection, and actual export state are coupled;
no safe disjoint delegation exists. Codex owns UI inspection, project-state
comparison, any single gated correction/export, rendered review, and closeout.
Record implementation, focused verification, external-agent waits, and
maintainer-decision time separately at the exit boundary.

## Board start

Start evidence and comment are applied through the validated command layer;
replay is 3373→3375. G04-V03 remains In Progress and all V03 gates remain open.
