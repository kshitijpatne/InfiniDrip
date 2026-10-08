# EPIC-17 / G04 V03 — CLO remaining-recipe round trips — Slice 523 start

## Objective and boundary

Fill the practical base-size receiver evidence gap for the four recipes not
covered by the existing CLO Tee, Polo and Woven tests: Fitted, Tank, Skirt and
Trouser. Use the already-installed, currently running CLO 2026.1.310 in one
continuous session, with one fixed AAMA import/export path per fixture. This
tests recipe coverage; it does not repeat Polo or retest Tee/Woven.

The maintainer explicitly instructed Codex to use CLO for practical local
import/export scenarios and to stop only on concrete errors/failures. Store
all input/output DXFs, manifests, native copies (if needed), screenshots and
analysis under
`C:\G04-CLO-DXF-Exchange\S523-clo-remaining-recipe-roundtrip\`. No CLO-SET,
CONNECT, cloud upload, account change, purchase, installation or external
message. Keep the existing CLO session open after the slice.

Started `2026-10-08 19:10:56 UTC` from clean S522 commit `079ca9f` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned
slice was 522; S523 is reserved. Canonical board revision is 3203;
G04-V03 is In Progress and V01/V02 are Done. Ordinary usage is available.

## Fixed trial plan

1. Generate hash-pinned, current-source M fixtures for Fitted, Tank, Skirt and
   Trouser from `STANDARD_M`, each recipe's declared default options and the
   unchanged legacy `exportDxf`. Write only to the named C: folder. Include
   source revision, file hashes, entity/layer counts, piece names/counts and
   closed CUT/SEW outline counts.
2. Confirm the exact returned CLO app/window and current workspace state; do
   not close or relaunch the app. If the workspace has unsaved user content,
   stop before replacing it and preserve the live session. Otherwise process
   each fixture once: DXF-AAMA import at centimeters/100%/no rotation, keep
   non-grading-point removal and curve optimization off, then DXF-AAMA export
   at centimeters/100%/no rotation with the observed baseline options.
   Capture the actual dialog/settings and rendered receipt. Do not edit pattern
   geometry or save to any other location.
3. Compare every source CUT/SEW contour against CLO output contours using
   cyclic/reverse geometry matching at the unchanged `0.001 cm` gate; record
   entity/layer/piece counts, coordinates, warnings and output hashes. Inspect
   the rendered output for every piece. Re-import generation two only for a
   fixture whose first measured exchange passes and whose state can be isolated
   without replacing unsaved work.
4. Continue all four independent fixtures despite a per-recipe failure, so
   the missing-recipe matrix is complete. Stop an individual fixture on a
   concrete format error, missing piece, destructive geometry/mark loss, or
   measured gate failure and preserve the exact observed output. No automatic
   repairs or threshold changes.

## Acceptance and limits

- Each fixture result is reported separately as pass, fail, or partial, with
  exact build, import/export profile, hashes and rendered evidence.
- These four base-size runs can expand observed technical coverage but do not
  alone prove the industrial apparel profile, rights/local-handling, every
  option, all marks/layers, native grading, malformed-input behavior, or
  generation-two round trips across the complete accepted matrix.
- V03 remains In Progress until every admitted gate passes. Preserve the
  existing strict threshold, all-seven coverage, legacy DXF behavior,
  protected export byte identities, and all physical/factory claim limits.
- No product source, pattern geometry, exporter, standard/profile, baseline,
  account, or acceptance criterion changes in this slice.

## Ownership and exit record

This is a single stateful CAD-interface run coupled to one shared comparison
matrix, so no disjoint external-agent ownership is safe. Codex retains the
session and integration. Record actual UI time, focused parser/geometry checks,
durable records/board work, agent waits and maintainer-decision time separately
at exit.

## Source-of-truth handoff

- Prior coverage and gates: `docs/research/epic17/S493-v03-evidence-reconciliation/S493-v03-gate-matrix.md`.
- Hash-pinned fixture contract: `docs/research/epic17/S463-v03-receiver-fixture-pack/`.
- CLO exact import/export settings: `docs/research/epic17/S516-clo-foreground-activation/S516-exit-packet.md`.
- CLO direct app/file evidence stays on C: only; prior user instruction requires
  the running app to remain open until G04 no longer needs it.
