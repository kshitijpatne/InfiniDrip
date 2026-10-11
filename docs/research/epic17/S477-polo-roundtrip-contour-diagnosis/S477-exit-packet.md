# EPIC-17 / G04 V03 Polo contour diagnosis — Slice 477 exit

## Result

S477 resolved the apparent 2.000004 cm back mismatch and 9.298007 cm pointed
collar mismatches as **wrong contour associations produced by an exact
same-vertex-count matcher**, not as multi-centimeter receiver geometry changes.
The source CUT outlines are associated to their correct receiver blocks using
the paired source SEW contours, which have exact cyclic coordinate matches
within the unchanged 0.001 cm gate. Within each matched block, CLO emitted the
corresponding CUT outline with one or two fewer vertices. Each matched pair
has a witnessed continuous-polyline deviation above 0.01 cm, so none of these
five CUT contours passes the strict 0.001 cm same-vertex gate as currently
defined. V03 remains In Progress; no compatibility claim is made.

## Verified inputs and piece attribution

The S463 source fixture has 18 closed source polylines: one CUT then one SEW
for each manifest-ordered piece. The relevant source ordinals are zero-based
within the diagnostic script and correspond to these piece ordinals:

| Piece | Source CUT ordinal | Source CUT vertices | CLO block proven by paired SEW | Nearest candidate in block | Coarse symmetric estimate | Witness lower bound |
|---|---:|---:|---|---|---:|---:|
| Back | 2 | 33 | `1_M` | output polyline 18, layer 8, 32 vertices | 0.012741 cm | 0.010193496 cm |
| Outer collar stand | 10 | 54 | `5_M` | output polyline 64, layer 8, 53 vertices | 0.012977 cm | 0.010380902 cm |
| Inner collar stand | 12 | 54 | `6_M` | output polyline 74, layer 8, 53 vertices | 0.013974 cm | 0.011180295 cm |
| Upper pointed collar | 14 | 44 | `7_M` | output polyline 78, layers 1/14 coincident, 43 vertices | 0.012990 cm | 0.010393672 cm |
| Under pointed collar | 16 | 44 | `8_M` | output polyline 90, layer 8, 43 vertices | 0.012999 cm | 0.010402442 cm |

The diagnostic reverified source SHA-256
`796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca` and
S476 CLO output SHA-256
`734ecfee3c458f7293da3d58e283ad9356bbf8cd856e84f554dacae6a69d804b`.
All five paired source CUT/SEW contours are closed, straight polylines with
zero bulges. Each of the nine source SEW contours maps by exact cyclic/reverse
coordinate match to one unique receiver block within 0.001 cm. This geometry
match—not ordinal alone—proves the receiver piece association for this trial.

The 0.1 cm symmetric Hausdorff values are **coarse diagnostic estimates**,
not exact global maxima. The recorded witnesses are actual sampled points on
straight source segments measured against exact target line segments; each
distance is greater than 0.01 cm, independently proving the exact 0.001 cm
threshold is exceeded. S476's three large values resulted from pairing some
CUT contours with their paired SEW contours because those had the same vertex
count; the two stand CUTs had no same-count candidate because CLO removed a
vertex. The corrected piece association identifies near, same-bounds CUT
contours with fewer vertices, but does not establish that CLO's resampling is
acceptable for a formal round-trip profile.

## Visual evidence

Codex generated and inspected five actual-pattern overlays from the
hash-bound source and CLO files. They are saved only under
`C:\G04-CLO-DXF-Exchange\Evidence`:

- `polo-contour-diagnosis-overlays.png` — inspected rendered output; red is
  source CUT, green dashed is paired source SEW, and blue dashed is the nearest
  CLO contour in the SEW-proven block.
- `polo-contour-diagnosis-overlays.svg` — source vector overlay.
- `polo-contour-diagnosis.json` — hashes, source-to-block associations,
  candidate identities, bounds, estimates, and witness points.

The rendered overlay confirms the blue contours follow the correct pattern
outlines and sit near the source CUTs; the green SEW lines are visibly inset.
The image also makes vertex-loss areas visible. No source geometry, settings,
or export behavior changed in the diagnostic.

## Direct CLO interface follow-up

Using CLO 2026.1.310 (r58944), Codex opened File → Export → DXF on the
Woven reimported native project. The visible export dialog showed DXF-ASTM,
Graded Nest, Centimeter, 100%, Do Not Rotate, no seam-allowance export, and
the default duplicate-notch-on-seam-allowance option checked; the CLO export
completed without changing the reimported pattern. The resulting file is
`C:\G04-CLO-DXF-Exchange\Output\woven-shirt-standard-m-clo-reexport-from-reimport.dxf`,
140,107 bytes, SHA-256
`44f3580f1175b84342f1d21ef847214cbbe5bc883c0795fdc4e69c09e2e21579`.
This is a second export from a DXF-reimported CLO project, not a second
reimport or an additional acceptance pass. The earlier S476 import/export/
reimport results remain the primary trial.

## Independent source-only review

The delegated OpenCode review completed in exact required normal-mode
`xhigh` configuration and returned `WORK FINISHED`. Its durable summary is
`S477-opencode-review-result.md`. It confirmed source piece/entity ordering
and the limitations of the vertex matcher, but did not inspect CLO bytes.
Codex independently inspected the hash-bound CLO output and performed the
actual output association above. No delegated implementation was integrated.

## Scope, acceptance, and holds

- No production code, pattern geometry, stitch graph, DXF writer, import/export
  defaults, protected export identities, V02/V03 criteria, receiver profile,
  or product claim changed.
- V02 all-seven-recipe acceptance remains passed from earlier records; this
  diagnostic does not reopen or alter those checks.
- V03 remains In Progress. Exact industrial-format compatibility is unproven:
  rights/profile selection, complete mark/layer semantics, receiver round-trip
  behavior at the required tolerance, supported-grade/option coverage, and
  independent receiver evidence remain required. CLO's “DXF-ASTM” label does
  not certify a standard.
- No physical fit, factory acceptance, or production-readiness claim is made.

## Focused verification and boundary

- `diagnose-polo.mjs` ran against the hash-pinned C: files; all nine SEW block
  associations passed, and all five CUT witnesses exceeded 0.01 cm.
- The five-row overlay was rendered from SVG into PNG under the C: exchange
  folder and visually inspected by Codex.
- `S477-opencode-review-result.md` records the independent review and its
  boundary.
- A separate CLO re-export was verified by existence, size, and SHA-256 under
  the same C: folder.
- No production code changed. Focused product tests and changed-code coverage
  are not applicable; do not run the full repository gate before the settled
  integrated Epic candidate.

Started `2026-10-08 06:52:52 UTC` from S476 commit
`04aa3d2c111aa1a9554b7f79c12e7246f534abf3`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S477 was
unique after S476. Start board revision 2943 advanced to 2947 and validated
exit replay advanced 2947 to 2951. Goal remains active and aligned with
admitted EPIC-17.

`npm run control-center:test` passes 42/42; board preflight/exit verification,
script syntax, and `git diff --check` pass. No production code changed.
Elapsed 2026-10-08 06:52:52–07:13:25 UTC (20m33s, approximate): implementation
0m; source/output analysis 9m; focused verification 4m; CLO UI
export/verification 4m; rendered overlay inspection 1m; external-agent wait and
review 1m30s; packet/state/context/board closeout 1m; maintainer-decision time
0m. Keep CLO open as requested.

**Next action:** continue remaining V03 rights/profile and receiver evidence
work from the exact unresolved gates in the S476 and S477 packets. Keep every
compatibility claim fail-closed until documentary rights and receiver
round-trip evidence satisfy the admitted exit criteria.
