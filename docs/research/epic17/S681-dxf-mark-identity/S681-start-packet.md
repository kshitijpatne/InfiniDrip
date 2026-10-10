# EPIC-17 / G04 V03 — Source-bound DXF mark identity — S681 start

## Verified boundary and authority

- Started 2026-10-10 18:13:08 UTC from clean S680 `5042e110` on
  `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Highest assigned slice is 680; S681 is unique.
- Canonical board revision 4037 has EPIC-17 In Progress and G04-V03 In
  Progress; V01/V02 Done. The durable goal is active and retains the complete
  admitted EPIC-17 objective.
- Sol's bounded read-only S680 review found a concrete source omission:
  `patternMarksDxf` emits mark geometry/layers but omits each source mark's
  stable `name` and optional `label`; the package manifest has no per-mark
  identity table. C04 records this limitation and requires construction marks
  not be lost or replaced by sidecar metadata.

## Scope

Add an additive, revision-bound mark identity table to the candidate DXF
package manifest. For every source `PatternMark`, record stable mark ID,
piece/role ID, source mark name, kind, entity type, layer, source-space
coordinates, and optional human label/label role. Keep the actual DXF mark
entities and geometry visible and unchanged; the sidecar supplements those
entities and does not replace them. Detect duplicate IDs or inconsistent mark
definitions instead of silently producing ambiguous records.

Reuse the canonical S330 73-option source matrix and existing grade fixtures.
Generate evidence under `C:\G04-CAD-Interchange\S681-mark-identity` only.

## Acceptance and verification

- Every recipe/grade package carries all named source marks, with IDs bound to
  exact recipe and piece role and complete type/layer/geometry semantics.
- All 73 S330 option packages generate and verify; mark counts/records match
  the source pieces, while DXF entities and existing source drawing geometry
  remain byte-for-byte unchanged from the same S680 package inputs.
- Changed production-code coverage is 100% in all four metrics; focused tests,
  build, Control Center suite, evidence/hash checks, rendered output review,
  board validation and `git diff --check` pass.
- Legacy DXF and every protected export identity remain unchanged.

## Non-goals and limits

No new CAD program, receiver operation, candidate/profile claim, acceptance
change, user-interface wiring, new visible text entity, mark geometry edit,
physical/factory claim, or protected baseline move. A manifest record does
not prove that a receiver preserves it; no V03 receiver gate is promoted by
source package generation.

## Slice ledger

Keep implementation, focused verification, package/render inspection, board
and documentation closeout, external waits, and maintainer decision time
separate in the exit packet. The package contract is shared and serial; no
safe disjoint delegation exists. Codex owns integration and final review.
