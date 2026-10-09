# EPIC-17 / G04 V03 — CLO waistband sew-line attribution — Slice 566 exit

- Closed: 2026-10-09 03:25 UTC.
- Started: 2026-10-09 03:18:40 UTC at S565 commit `0a7b4ca` on
  `codex/epic-17-g04`.
- Refreshed `origin/main` was `a5af5e1`, an ancestor of S566 start. Board
  replay: S566 start revision 3377→3379; exit revision 3379→3381.
- CLO remains open. No input, import, or export was sent during S566.
- All source exchange files remain under
  `C:\G04-CLO-DXF-Exchange\S565-clo-grade-state-diagnosis`.

## Source-to-output comparison

S562/S559 source identifies the waistband SEW contour and its width by size as
XS 43 cm, S 45 cm, M 47 cm, L 49 cm, and XL 51 cm. S565's corrected export
report contains the waistband block `2_<size>` for each size. S566 added a
reproducible symmetric point-to-segment comparison after first-vertex layout
alignment, reusing the 0.001 cm gate and S564 comparison method.

| Size | Source SEW width | Closest output candidate to that size's SEW | Candidate matching base XS SEW | Base-shape candidate identity |
|---|---:|---:|---:|---|
| XS | 43 cm | 0.000015 cm | 0.000015 cm | layer 8, polyline 6 |
| S | 45 cm | 2.000000 cm | 0.000015 cm | layer 8, polyline 4 |
| M | 47 cm | 2.500000 cm | 0.000015 cm | layer 8, polyline 4 |
| L | 49 cm | 2.915463 cm | 0.000015 cm | layer 8, polyline 4 |
| XL | 51 cm | 2.915463 cm | 0.000015 cm | layer 8, polyline 4 |

For each larger-size block, a candidate is geometrically the base XS SEW
shape to within 0.000015 cm, while no output candidate matches that size's
source SEW contour within 0.001 cm. This directly shows that the tested
graded-nest output lacks the required larger-size sewn outline and retains a
base-size-shaped internal contour. Because CLO output layers are numeric and
the project does not supply a semantic mapping we can decode, the layer-8
candidate is **not proven** to be the receiver's semantic SEW line. The
evidence is a receiver-output geometry failure; it does not locate whether
the lost grading occurred during import, size-group editing, or export.

The outer waistband CUT contour continues to match all five sizes within
0.000015 cm, as recorded in S565. The S566 candidate report preserves every
candidate vertex list, output layer/index, current-size residual, base-XS
residual, source report hash, and DXF hash:
`s566-sew-candidate-report.json`.

## Saved CLO project and desktop evidence

The saved `.zprj` has SHA-256
`CD2D620B42148A21E800F6D7DD6183757955B2BEC19FD745BB86FDCD3D3B8423`.
`inspect-s566-project-container.mjs` found 15 ZIP records behind a 15,479-byte
application prefix. Its only `.xml` entry is an environment document with no
pattern, piece, sewing, or grading tags; the geometry/group payloads are
application-specific binary entries (`.zpac`, `.vmp`, `.vlp`, `.smp`, `.vrp`)
that this read-only inspection cannot semantically decode. This project-file
path therefore cannot establish which CLO control owns the missing SEW
grading.

The active CLO observation reported an `Export DXF` accessibility modal while
its screenshot showed the base workspace with no modal. This mismatch was
previously recorded in `docs/PROJECT-DECISIONS.md`. No click, key, import, or
export was issued after detecting it. This is a control-observation limit,
not a CLO format failure. The prior S565 actual re-import screenshot remains
the only rendered evidence for this corrected project and shows one waistband
with an internal line, not a size overlay.

## Gate and slice disposition

- S566 answers the geometry question strategically: a base-XS-shaped contour
  persists through all larger blocks, while required graded SEW shapes are
  absent. It does not prove the layer semantic or source of the transfer
  failure, so V03 grade/semantic/round-trip gates remain held.
- No receiver-rights/profile, all-seven recipe, mark, malformed-input, or
  production-readiness gate is cleared. No V02 acceptance or seven-recipe
  criterion was changed.
- No product code, pattern, export implementation, protected byte identity,
  legacy behavior, or acceptance threshold changed.
- Focused verification: both analysis scripts pass `node --check`; the
  candidate analyzer assertions pass against the S565 report/DXF hashes;
  project container inspection finds 15 entries and an Environment-only XML;
  `git diff --check` passes. Product tests/global coverage are not due.
- Timing estimate: evidence/container and candidate analysis 3m; report and
  durable closeout/verification 4m; external-agent waits 0m; maintainer
  decision time 0m.
- Next action: keep the CLO session open, do not replay the inaccessible
  dialog. Continue V03 evidence that can be closed from source and prior
  verified output. Resume CLO UI grading only after a new capture channel
  yields agreeing screenshot and accessibility state; the first controlled
  test must inspect the sew-line grading points before another export. Keep
  the 0.001 cm threshold and every V03 gate unchanged.
