# EPIC-17 / G04 V03 — Polo CUT loss decision study — Slice 643 exit

## Result

S643 reconciled the persistent CLO Polo CUT failures against current recipe
code, the exact STANDARD_M source revision, and S380's existing 17-option
matrix. It adds no new CLO experiment and makes no source change.

The back body's failing `neckline` CUT segment is generated from the bodice
neckline. Polo's `sideVentDepth` and `backHemDrop` edits in `poloBodyPiece`
touch only side and hem edges. For collars, `buildPoloCollarGeometry` derives
the back path from the normalized source back neckline. The outer and inner
stand `backCollar` and pointed-collar `backCollarBase` copy that back path;
`standHeight` translates it vertically, while `standFrontRise` reshapes the
front path only. Collar leaf depth and point extension modify the exterior,
not the base seam. Placket options do not alter these five regions. This
establishes the same failing source features for all 17 S380 STANDARD_M
options; it is a source-code derivation, not receiver testing in every option.

S634's pinned source trace identifies the five CUT vertices at back neckline
sample 13, both stand `backCollar` sample 14s, and both collar-leaf
`backCollarBase` sample 14s. Their adjacent-step distances and maximum
omitted-point deviations are unchanged by the relevant rigid translations.
The maximum deviation is `0.013974 cm` (`0.13974 mm`). Removing those vertices
would alter the current generated product CUT contours by `0.012741–0.013974
cm`, which is greater than the fixed `0.001 cm` gate by 12.7–14.0 times. The
points are not coincident with a source seam or mark. Neither product code nor
pattern-specific construction evidence establishes physical redundancy.

**Decision:** no source repair is recommended. Keep the pattern and exchange
tolerance unchanged; the current CLO route remains unqualified. S642 remains
the current empirical result: nine role names retained, all nine SEW contours
and four CUT contours passing, five CUT contours failing before export. No
export/reimport was attempted. V03 remains In Progress and every open gate is
listed in `V03-CURRENT-GATE-MATRIX-S643.md`.

## Scope and acceptance

- Reconciled source and option behavior for the five failed CUT regions using
  the existing S380 17-row matrix and S634 trace.
- Compared the minimal chord simplification with the required exchange
  tolerance and preserved the source geometry because the candidate change
  exceeds that gate.
- Updated the V03 matrix with S642 evidence and a specific next gate: identify
  a distinct, eligible receiver/profile route that preserves source geometry.
- No recipe, pattern, stitch graph, DXF output, allowance, tolerance, baseline,
  acceptance criterion, hold, or board status changed.
- No physical fit, factory acceptance, or production-readiness claim.

## Verification and durable closeout

- Started `2026-10-09 22:49:48 UTC` from S642
  `45281de549c5b17e4380f07d6600095620bb3c8e` on `codex/epic-17-g04`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor.
- S643 start replay added only its evidence/comment at board revision
  `3714→3716`; V01/V02 remain Done and V03/Epic remain In Progress.
- Source inspection verified all eight option definitions and the 17
  configured S380 rows. The S634 numeric trace and S642 source/native
  comparison were re-read; no renderer or CLO trial was repeated.
- `npm run control-center:test` passed **42/42**. `node --check` passed for
  the S643 board replay. `git diff --check` passed. No production-code change
  occurred, so changed-code coverage is not applicable; the full repository
  gate remains for the settled integrated Epic candidate.
- Elapsed: about 9 minutes (`22:49:48–22:58 UTC`): source and option analysis
  about 4 minutes; focused verification about 1 minute; durable records and
  board closeout about 4 minutes; external-agent wait 0; maintainer-decision
  time 0.
- CLO remains open with the saved S642 evidence project. No application
  interaction occurred during S643.

## Next action

Reserve S644 from a refreshed clean slice boundary. Review existing receiver
research for any untested, eligible local apparel-CAD receiver/profile route
with a falsifiable capability to preserve the five CUT regions. Run one
practical receiver test only if that evidence supports it; otherwise document
the exact availability/rights dependency and preserve all V03 holds. Do not
remove source vertices or relax the `0.001 cm` criterion.
