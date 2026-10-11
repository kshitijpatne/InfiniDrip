# EPIC-17 / G04 V03 — Explicit unit contract in DXF package — S679 start

## Verified boundary and authority

- Started 2026-10-10 17:59:26 UTC from clean S678 commit `30a640c2` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S678 is the highest assigned slice; S679 is unique.
- Canonical board revision 4029 keeps EPIC-17 and G04-V03 In Progress, with V01/V02 Done.
- The active goal still matches the full admitted EPIC-17 objective.
- Authority: admitted G04 V03 and accepted C04 contract require explicit units; S674 receiver evidence proves LibreCAD's R12 save strips the `$INSUNITS=5` declaration from an input that had it. S678's manifest does not yet carry a typed units field.

## Scope

Add `units.length = cm` and `units.dxfInsunits = 5` to the versioned candidate sidecar. Make package verification require both the declaration and its matching `$INSUNITS=5` header in the paired DXF. Add focused tests for correct pairing and for mismatched/missing unit declarations. Regenerate the C:-only package sidecars and inspect representative serialized output; require unchanged DXF hashes and protected legacy output.

This is a source-side contract repair. It does not alter the legacy DXF writer or geometry, attempt to rewrite a receiver's output, prove the sidecar survives a round trip, qualify LibreCAD as an apparel receiver, or pass V03. Keep all seven recipes, supported options, grade, geometry/mark, malformed-input, repeatability, readability, rights/profile and protected-byte gates unchanged.

## Gates

- Focused package/DXF/protected regression checks.
- 100% statements, branches, functions and lines for changed production code.
- Build, Control Center tests, `git diff --check`, board validation.
- Regenerate and inspect actual sidecars; compare all seven DXF bytes/hashes to S678.
- Preserve all legacy and protected export identities; no V03 claim from metadata alone.

## Non-goals and blocker

No additional CAD application, format/mode/settings sweep, UI, change to source pattern geometry, acceptance/threshold reduction, standards claim, physical/factory claim, or package upload. The receiver output's unit-marker loss remains directly measured and cannot be repaired by pretending the receiver kept the marker. S679 only makes our own input package explicitly self-describing and consistent.

## Exit ledger

Record implementation, focused verification, package/output inspection, board/docs work, external waits and maintainer-decision time separately at slice exit. No safe disjoint delegated ownership is available for this small shared package contract; Codex owns implementation and review.
