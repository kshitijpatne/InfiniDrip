# EPIC-17 / G04 V03 — S705 candidate-only buttonhole display encoding

## Verified start

- Start time: 2026-10-11 00:27 UTC (record exact time at closeout).
- Branch: `codex/epic-17-g04`; start commit `f7e5043aceb13086ca513169c5f0acb7e04c8abb` (S704).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Highest assigned slice is S704; reserve S705 only.
- Canonical Control Center board revision 4148: EPIC-17 In Progress, G04-V03 Blocked, G04-V01/V02 Done. Goal remains active.
- Known untracked cleanup inventory remains the two S700 changed-coverage diagnostics; do not delete them in this slice.

## Scope

Implement the evidence-backed buttonhole representation in the opt-in G04 DXF interchange package only: one logical source point remains at the exact source anchor, represented by a centered two-line cross on the existing semantic mark layer, using the 0.25 cm half-span used by the current PDF point-mark convention. Version the package/manifest representation, bind emitted entity ordinals and coordinates to the same piece/revision and its source-to-drawing transform, and make the verifier reject missing, reordered, malformed, shifted, or wrong-layer cross entities. Keep DXF legacy defaults byte-identical.

## Acceptance and verification

- All seven registered recipes, all registered grade rows and all 73 supported option configurations retain exact source anchors and verify the emitted cross geometry/layer/identity.
- Package expansion and manifest entity counts agree exactly; older schema v2-v4 remain verifiable.
- 100% statements, branches, functions and lines for changed production modules under focused tests.
- Existing protected DXF regression hashes remain unchanged.
- Generate and inspect a readable, rendered candidate with buttonhole labels and source marks visible. Preserve evidence in this packet's evidence subfolder only if small; bulky generated receiver CAD artifacts remain in `C:\G04-CAD-Interchange\`.
- `git diff --check`; validated Control Center exit replay; update project state/context and packet with pass/fail/pending gates and actual timing.

## Non-goals / holds

No garment cut geometry, stitch graph, source anchor, global DXF behavior, legacy export, threshold, V03 acceptance, app installation, receiver variation, conformance claim, or scope change. Do not claim this display fix clears CLO's unrelated contour losses or qualifies any receiver. No cleanup deletion, physical fit, factory acceptance or production-readiness claim. No safe disjoint delegation: manifest, serialization, verifier and byte-identity behavior form one coupled contract.

## Planned steps

1. Add a candidate-only point display option while preserving all legacy call defaults.
2. Bump package schema and bind two LINE entity ordinals, source anchor, transformed drawing center, semantic layer and representation rule; keep v2-v4 compatibility.
3. Add mutation tests for each verifier rejection and the seven-recipe / grade / 73-option matrix; enforce changed-code coverage and legacy hashes.
4. Generate/render representative output and visually inspect source-linked marks. If any exact binding, mark readability or byte-identity gate fails, repair this slice before closing.
5. Close only after packet, state, board and verification evidence are durable. The next action remains a single current-package test in the already installed LibreCAD 2.2.1.5 R2000 route.

## Timing ledger

Implementation: pending. Focused verification: pending. External-agent waits: 0m. Maintainer decisions: 0m. Record actual values at closeout.
