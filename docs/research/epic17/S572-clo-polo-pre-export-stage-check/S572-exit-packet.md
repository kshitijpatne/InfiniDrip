# EPIC-17 / G04 V03 — CLO Polo pre-export stage check — Slice 572 exit

## Result

S572 confirmed that the bounded source Polo M fixture imports into the already
running CLO 2026.1.310 workspace using the documented UI route and without a
DXF-format error. CLO displayed its informational seam-allowance notice and
continued in Custom mode; this is not a format failure. The imported pattern
was visible in Edit Pattern mode. The visual workspace and current
accessibility observation agreed.

The native Property Editor exposed only whole-pattern 2D and 3D line totals,
8029.3 mm and 8029.0 mm respectively, rounded to 0.1 mm. It did not expose
individual vertex coordinates, source-point identity, or a point-to-chord
measurement. The admitted tolerance is 0.001 cm = 0.01 mm, so the visible
aggregate precision is ten times coarser than the tolerance and cannot
determine whether any of the five source corners survived import. No point was
dragged or otherwise edited. No DXF was exported; repeating the round trip
would not improve stage attribution. Thus S572 neither proves nor clears an
import-side geometry change. The five known CUT failures remain attributed
only to the tested combined source→CLO→DXF path.

The maintainer's written confirmation for this bounded product-development
evaluation and local file processing remains settled. The fixture and saved
pre-test CLO project copy are on C: inside the named S572 folder. No cloud or
external transfer was used. CLO remains open as instructed.

## Exact target points and existing result

S552 source mapping identifies these five CUT vertices and over-gate
source-to-output residuals; S545's two generations retain these same five
failures:

| Piece | Source point (cm) | Vertex | Existing residual range (cm) |
|---|---:|---:|---:|
| Back (`1_M`) | (37.489, 74.514) | 13 | 0.012741–0.012746 |
| Outer collar stand (`5_M`) | (139.277, 66.459) | 14 | 0.012983–0.012988 |
| Inner collar stand (`6_M`) | (156.921, 66.459) | 14 | 0.013969–0.013974 |
| Upper pointed collar (`7_M`) | (174.564, 66.459) | 14 | 0.012983–0.012988 |
| Under pointed collar (`8_M`) | (194.164, 66.459) | 14 | 0.012983–0.012988 |

The deviations are 12.7–14.0 times the 0.001 cm limit. S572's native view
could not determine whether the imported native geometry had the original
corners or the replacement chords. The already saved gen1/gen2 outputs remain
the only precise geometry measurements for this trial path.

## Trial record and artifacts

- Input: `C:\G04-CLO-DXF-Exchange\S572-clo-polo-pre-export-stage-check\Input\polo-source-m.dxf`
  (24,261 bytes; SHA-256
  `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`),
  identical to the S544/S559 product-generated fixture.
- Pre-test safety copy:
  `C:\G04-CLO-DXF-Exchange\S572-clo-polo-pre-export-stage-check\Evidence\clo-session-before-polo-stage-check.zprj`
  (2,094,997 bytes; SHA-256
  `D796E8420FB2B6B3A2BD138AF759EA078B0AF1D9023DB3A29AE64DEC045BDF3E`).
- CLO import settings: Add; DXF-AAMA; centimeters; 100%; no rotation;
  preserve grain angle; notch to both/ratio; annotation off; auto-trace off;
  CUT/SEW swap off; auto-distribute off; Optimize All Curve Points off;
  Import Draw Curve Points on; Remove Non-Grading Points off.
- No output DXF or modified saved project was produced. The currently open CLO
  session contains the imported fixture; the hash-pinned safety copy predates
  that import.
- The in-app screenshot was inspected live and not saved as a separate image;
  no rendered export exists for this observation.

## Gate disposition

No V03 acceptance criterion, tolerance, profile, receiver claim, baseline, or
legacy export behavior changed. Rights/local handling are settled. Geometry
and piece identity remain held; CUT/SEW and marks, grades/options, malformed
input, exact industrial profile, and all-seven representative round trip
remain held or failed only for the already documented tested cases. The
S531 malformed-input control remains a failure. No physical-fit,
factory-acceptance, or production-readiness claim is made.

## Verification, board, and timing

- Started 2026-10-09 03:54:02 UTC from S571 commit
  `9035d325cbd5a11b81f04126912627047ce0d5d6`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
- S572 is unique after S571. Start board revision 3401; start replay reached
  3403 with G04-V03 still In Progress. Exit board replay was preflighted at
  3403 and applied through the validated command layer, revisions 3404→3405;
  G04-V03 remains In Progress with `E-G04-S572-EXIT` linked.
  `npm run control-center:test` passes 42/42 and `git diff --check` passes.
- Refreshed `origin/main` remains `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`,
  an ancestor of HEAD.
- This is evidence-only; no production code or tests changed and the full
  repository gate is not due.
- Elapsed 9m23s (03:54:02–04:03:25 UTC): production implementation 0m; live
  CLO observation and focused evidence verification 2m00s; external-agent
  waits 0m; maintainer-decision time 0m; durable records, validated board
  replay, branch/integrity review and focused checks 7m23s.

## Next action

Do not repeat the Polo import/export solely to locate which stage changed its
five corners. Continue with one distinct, evidence-led V03 task that can
address the remaining exact-profile/receiver or semantics/grade gates without
weakening the 0.001 cm threshold or all-seven scope. Keep every unresolved
gate held and CLO open.
