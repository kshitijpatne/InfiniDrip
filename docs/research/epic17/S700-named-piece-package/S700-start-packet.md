# EPIC-17 / G04 V03 — S700 named-piece interchange package

## Verified start and reserved slice

- Start: 2026-10-10 23:31:57 UTC; work begins after packet/board replay.
- Branch `codex/epic-17-g04`; starting commit S699 `27676a60` (full hash recorded at exit); clean at prior slice boundary.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- S699 is the highest assigned number; reserve S700 uniquely.
- Board revision 4132: EPIC-17 In Progress, V03 held; goal remains active.
- Evidence basis: S628 named BLOCK/INSERT CLO round trip plus S699 root-cause audit.

## Objective

Replace the opt-in package's flat, anonymous drawing with one deterministic named DXF BLOCK/INSERT per same-revision recipe piece, so the drawing itself carries piece-role identity and the receiver can preserve it. Preserve all existing CUT/SEW/mark entities, geometry, units, layers and coordinate values inside each piece group. Update manifest identity and mark-reference verification for per-block entities. Preserve legacy DXF byte identities.

## In-scope files and boundaries

Expected implementation ownership: opt-in DXF package/writer modules and their focused tests only. Update the package schema/version and verifier only as required to bind each block to recipe/role and resolve every mark within that block. Add exact expansion tests proving the embedded block entities reconstruct the current flat candidate entities without changes. Do not edit pattern source, stitch graphs, recipe geometry, protected legacy export, unrelated UI, or package dependencies. Generated candidate, CLO project, and rendered evidence stay only under `C:\G04-CAD-Interchange\S700-named-piece-package\`.

## Acceptance and decisive check

1. Run all registered recipe and size rows plus the 73 supported-option matrix. Every package must contain unique deterministic block names, exactly one INSERT per piece, correct role/revision metadata, and all expected mark entities associated to their piece. Block expansion must preserve exact existing entity types/layers/coordinates and CUT/SEW contours. Malformed/tampered package checks remain fail-closed.
2. Focused tests and changed-production-code coverage must reach 100% statements, branches, functions and lines. Typecheck passes. Protected export identity tests pass.
3. Render actual generated Polo M output and verify layout/labels, no overlap, crossings or missing entities. Hash-pin output under the C: folder.
4. Use the already-running CLO 2026.1.310 once with the same local route/settings as S698, except set `Import Draw Curve Points` **on** (S698 had it off). Import the named-block Polo M package; measure all CUT/SEW contours and typed marks at unchanged `0.001 cm`; export/reimport the exact result only if the representative import meets every applicable pre-export gate. Inspect actual output. Do not test another format, name placement, point density, or application.
5. Stop this CLO route if any curved CUT still exceeds `0.001 cm`, if role/revision binding is ambiguous, if geometry/mark identity is lost, or if output is unreadable. Record precise results; do not loosen the gate or select another app.

## Fixed scope and later gates

All-seven recipe, supported options/grades, 0.001 cm CUT/SEW, marks, stable piece/revision identity, units, malformed-input rejection, repeatability, rendered readability, documented empirical profile, rights and protected export byte identities remain required. This slice cannot declare V03 complete by itself. No ANSI/AAMA/ASTM conformance, physical fit, factory acceptance or production readiness claim. Full repository coverage/build/output review, repository cleanup, PR, safe merge, refreshed ancestry and required deployment remain completion gates.

## Delegation and timing

The package schema/writer/verifier and its shared geometry/byte-identity tests are coupled; no safe disjoint ownership is available, so Codex implements and reviews. At exit record code implementation, focused tests/coverage, rendered/CLO work, board closeout, external waits and maintainer-decision time separately.
