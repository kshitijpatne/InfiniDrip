# EPIC-17 / G04 V03 Tee source geometry oracle — Slice 474 start

## Verified starting point

- **Start:** 2026-10-08 06:04:45 UTC.
- **Branch/worktree:** `codex/epic-17-g04`,
  `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- **Starting commit:** `852cabea299b64015c9ef91222f4aad27cc99ce8` (S473),
  clean. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  an ancestor.
- **Canonical board:** revision 2919; EPIC-17/V03 In Progress, V01/V02 Done.
- **Highest assigned slice:** 473 across refs; S474 reserved.
- **Usage:** primary 3%; ordinary work allowed.
- **Current blocker:** no CLO-exported file is in S473 `receiver-outputs/` yet.

## Objective and scope

Extract a deterministic geometry oracle from the exact S463 standard-M Tee DXF
copy already prepared in S473. Capture each serialized CUT/SEW polyline's
ordered quantized vertices, layer, closure, bounds and source piece association
in output order. This is the direct reference needed for the C04 maximum
per-coordinate delta comparison after CLO export.

No arbitrary receiver format is assumed. The parser handles only the exact
S463 generic source DXF entity profile used by this oracle. It does not normalize
unknown receiver encodings, imply garment piece IDs exist in the DXF, move
geometry, change units, alter the fixture, modify production/export code, open a
receiver fixture, or claim compatibility. The source uses centimeter
coordinates externally but does not declare DXF drawing units.

## Acceptance and verification

1. Read the S473 copy and confirm its SHA-256/byte length match the S463 source
   manifest before extraction.
2. Parse strict DXF group pairs and the `ENTITIES` section. Require six closed
   `POLYLINE` outlines in writer order `front CUT`, `front SEW`, `back CUT`,
   `back SEW`, `sleeve CUT`, `sleeve SEW`; retain every serialized coordinate
   string and numeric coordinate.
3. Write a stable JSON oracle with source hash/commit, external unit disclosure,
   per-outline vertices and bounds; reproduce it byte-for-byte from the same
   source.
4. Add focused tests for fixture identity, entity order/layers, vertex counts,
   finite coordinate values, exact bounds and deterministic reproduction.
5. Update project context and canonical board through the validated command
   layer. Run focused tests and `git diff --check`; preserve V03 and every
   acceptance gate.

## Non-goals and ownership

No CLO import/export, parser for unknown CLO output entities, output remapping,
UI work, broad CAD library, product feature, protected export baseline change,
or acceptance/status change. No safe disjoint delegation: this is a small,
fixture-specific evidence extractor whose exact assumptions Codex must review.

## Exit boundary

The oracle is only the original serialized Tee geometry reference. A later
slice must compare actual receiver output to it, inspect native receiver
screenshots, and either pass or retain V03 as In Progress. No “DXF opened” or
menu-label-only result can replace that proof.
