# EPIC-17 / G04 V03 — source-exact Polo grainline mapping proposal — Slice 662 start

## Start state

- Start: 2026-10-10 07:54 UTC.
- Worktree: `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`,
  branch `codex/epic-17-g04`; clean S661 commit
  `9e18b83b6865768bfac487218c620a1fda0b3ac5`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S661 is the highest landed slice; reserve unique S662. The board
  is at revision 3850; EPIC-17 and G04-V03 remain In Progress; V01/V02 Done.
- S661's exact DGS AutoCAD-mode test imported all nine pieces but returned a
  grainline-outside-border error for each, then stopped before export. DGS
  remains open with that document and error; the S661 packet and C:-only
  evidence remain authoritative.

## Objective and scope

Using only the S648 hash-pinned Polo M fixture and the exact source revision
that generated it, derive the source-bound grainline endpoints and determine
whether they can be serialized losslessly in an additive, versioned G04
profile without changing any existing CUT/SEW/mark geometry, source pattern,
legacy DXF behavior or protected output identity. Inventory current source and
receiver evidence; identify what is encoded versus inferred. Produce the
concrete proposed profile mapping and its limits for maintainer review.

This is a read-only source/evidence study. Do not edit or generate an import
DXF, modify production code, interact with DGS, test a new mode/encoding, or
claim GetonAgain recognizes any proposed entity/layer. All future exchange
files, if separately approved, stay inside
`C:\G04-CLO-DXF-Exchange\<slice-folder>`.

## Acceptance and stop conditions

- Verify exact S646 generator revision and source fixture piece/block mapping.
- Compute all nine Polo M grainline segments from the actual piece geometry
  and recipe-specific `resolveGrainline` rules. Record local block coordinates,
  units and source piece identity; independently prove each segment is inside
  its associated source cut boundary and does not intersect a different
  piece's block or alter an existing entity.
- Reconcile each proposed segment with the native DGS diagnostic and S661
  layer/entity inventory. Separate direct source facts from proposal and
  receiver unknowns.
- Recommend one versioned-profile representation and specify exactly what a
  later single DGS re-import would prove and its unchanged `0.001 cm` geometry
  stop gate. Preserve generic/empirical labeling; no ASTM/AAMA claim.
- Stop without implementation or a second DGS import. V03 acceptance,
  all-seven recipes/options/grades, marks, units, identity/sidecars, malformed
  input, repeatability, round trip, rendering, legacy behavior and protected
  output identities remain unchanged. No V03 gate is presumed passed.

## Verification and closeout

No production/test change is expected. Use a reproducible read-only analyzer
and record its source commit, input hash, assertions and output hash. Update
this packet, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, admission handoff and the
validated board at the slice boundary; run focused relevant checks and
`git diff --check`. Full repository coverage remains for the settled Epic/PR
candidate. Do not delegate this tightly coupled source-geometry proof. At exit,
record implementation, focused verification, external wait and maintainer
decision time separately, then name one next action.
