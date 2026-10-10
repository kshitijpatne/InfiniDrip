# EPIC-17 / G04 V03 — S698 corrected-precision CLO round trip

## Outcome

S698 completed the one authorized test of the S697 six-decimal candidate in
the already-installed CLO 2026.1.310 Standard DXF route. The same source file
was imported once, exported once, and the exact return was reopened once.
Import/export settings matched S694/S696: Standard DXF, millimeters, 100%, no
rotation; Import Draw Curve Points remained off. All interchange files,
project copies, comparison data, and renders are under
`C:\G04-CAD-Interchange\S698-clo-precision-recheck\`.

This corrected source materially improved two outlines, but the receiver
round trip still fails the fixed gates:

| Piece | CUT max symmetric distance | CUT gate | SEW max distance | SEW gate |
|---|---:|---|---:|---|
| Front | 0.000136924 cm | pass | 0.000006605 cm | pass |
| Back | 0.002576509 cm | fail | 0.000009235 cm | pass |
| Sleeve | 0.000768600 cm | pass | 0.000008220 cm | pass |
| Button placket | 0.000001649 cm | pass | 0.000001649 cm | pass |
| Buttonhole placket | 0.000001649 cm | pass | 0.000001649 cm | pass |
| Outer stand | 0.032929600 cm | fail | 0.000005903 cm | pass |
| Inner stand | 0.032929728 cm | fail | 0.000005999 cm | pass |
| Upper collar | 0.010843247 cm | fail | 0.000005326 cm | pass |
| Under collar | 0.010843239 cm | fail | 0.000006188 cm | pass |

The unchanged CUT/SEW threshold is 0.001 cm. The return contains nine piece
blocks and 132 `LWPOLYLINE` entities. Its CUT path counts are 380, 341, 488,
12, 12, 413, 413, 422, and 422; the candidate had 531, 448, 489, 12, 12,
751, 751, 763, and 763. The returned file declares millimeters. A comparison
copy divided only planar coordinates by ten and changed only the copied unit
header to centimeters.

The source candidate contains 108 typed mark entities. The return contains no
`LINE`, `POINT`, or `CIRCLE` entities: CLO returned 132 `LWPOLYLINE`s. The
current geometric comparison finds 105/108 source marks within 0.001 cm; the
three missing marks are the three `MARK_BUTTONHOLE` points, each 1.499998 cm
from the nearest returned path. The source has ten named layers; the return
uses numeric layers `1`, `7`, `8`, and `14`, so source-layer/mark identity is
not preserved by this route.

On reopen, CLO displayed its informational notice that it considers the DXF
to contain no seam allowances and therefore imports it in Custom mode to
preserve shape. The reopened pattern was visually inspected. The saved
source/return overview and inner-stand detail overlays are
`S698-return-overlay.png` and `S698-innerStand-detail.png`; their hashes are
in `S698-render-report.json`. The inner-stand detail visibly confirms the
0.03293 cm contour separation. This is receiver behavior evidence, not a
standards-conformance, fit, or factory result.

## V03 decision and next action

The measured result closes this exact CLO test. Do not repeat CLO Standard
with the same POLYLINE candidate or try another setting, encoding, or format
as an unplanned variation. Preserve the fixed gates. Next, inspect the
candidate writer and the exact source/return geometry to identify a specific
code-side correction for the repeated high-curvature CUT misses and the
discarded POINT marks. Any proposed output change must keep source coordinates
and pattern topology intact, retain the legacy exporter and protected output
identities, and name its distinct V03 gate before it is tested. No further
receiver trial is justified until that cause is demonstrated in code/output
evidence.

The precise route under test is **CLO 2026.1.310 / Standard DXF**, an
empirical vendor/version/mode profile only. The maintainer's rights and local
processing confirmations are recorded in the existing S694/S696 evidence.
This result does not establish apparel/industrial profile acceptance or
ANSI/AAMA/ASTM conformance. No receiver-side all-seven recipe/options/grade,
malformed-input, repeatability, identity, or full-readable-output gate passes.
V03 remains unaccepted and G04-V03 remains held; EPIC-17 and the goal remain
active. No acceptance, scope, status, legacy behavior, threshold, or physical
claim changes.

## Files and verification

Under the C: evidence folder:

- `polo-candidate-cm.dxf` — exact S697 candidate, SHA-256
  `f239a72f37fc7b5f333e6474cd5b70a375f9ebb3bb49ac427106fd63cf441fbd`.
- `polo-candidate-mm-input.dxf` — deterministic x10 coordinate/unit copy,
  SHA-256 `c487ba065b3722119fd4bbd4ee896c2a47651e214da11e9ce90fda884421a14d`.
- `polo-candidate-mm-return.dxf` — exact CLO return, 366575 bytes, SHA-256
  `3aee90bca1b7ea7b96fe9bb405e38c298c5d78ee089fa3242747f6000d5a1b00`.
- `polo-candidate-return-normalized-cm.dxf` — comparison-only copy, SHA-256
  `17d1ea99595af49c7ee5142e2cfcb6bba800270be9a5409d842a967c9b3e719a`.
- `S698-roundtrip-comparison.json`, `S698-entity-inventory.json`,
  `S698-normalization-report.json`, and `S698-render-report.json` — machine
  readable results.
- `S698-return-overlay.png` SHA-256
  `0534fa1b91e6c560858bc65ce2c20208e273a385e16f418e1e26e705c7941706`;
  `S698-innerStand-detail.png` SHA-256
  `a6d82ab6afc39ce15778dbe8c86bde9c2ef067bb59fb969b08a1b2e3c401ff8a`.
- `clo-session-before-S698.zprj` preserves the prior open session;
  `S698-imported-candidate.zprj` preserves the imported source state.
- `normalize-s698-return.mjs`, `compare-dxf-roundtrip.mjs`,
  `inventory-s698.mjs`, and `render-s698-overlay.mjs` reproduce the
  comparison/rendering without changing source or receiver files.

S698 made no production code/test change, so there is no changed-code coverage
run or full repository gate. After the validated board exit replay,
`npm run control-center:test` passed **42/42**. Full repository tests/coverage
remain reserved for the settled integrated Epic/PR candidate.

## Start, board, and time

- Started 2026-10-10 23:16:37 UTC from clean S697 commit
  `97a03014da88ccd29d220c95b8b23550a7f6c41a`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
- S697 was the highest assigned slice; S698 was reserved uniquely. The
  validated board start/exit replay advanced revision 4126→4127→4128→4129.
  V03 remains Blocked and EPIC-17 remains In Progress; the goal remains active.
  Exit evidence and the decision comment are in
  `S698-board-exit-evidence.json` and `S698-board-exit-comment.json`.
- Implementation: 0m. Focused receiver/comparison/render verification:
  approximately 8m. External-agent wait: 0m. Maintainer-decision time: 0m.
  Records, board closeout, and focused Control Center verification are
  recorded at the close boundary. No full repository gate was run.

No independent low-risk handoff was available: the exact desktop round trip,
source/receiver comparison, and actual output review share one stateful test.
Codex owns the results and integration.
