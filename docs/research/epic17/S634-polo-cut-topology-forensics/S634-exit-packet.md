# EPIC-17 / G04 V03 — Polo CUT topology forensics — Slice 634 exit

## Result

S634 found the same single omitted CUT vertex on the same five Polo roles in
all three already-captured CLO outputs: S617 Standard-DXF import / ASTM export,
and S632 ASTM import/export generations 1 and 2. All nine pieces bind uniquely
through their unchanged SEW contours. The five failures are not caused by a
different CLO import-menu selection in these trials. S634 does not claim which
internal CLO operation removed the points.

The source edge is now traced through the current InfiniDrip code. Regenerating
`POLO × STANDARD_M` with the current product DXF writer produces the pinned
S617 pre-header fixture byte-for-byte (SHA-256
`796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA`). The
S617 cm-header source is that exact 24,261-byte entity body plus its 65-byte
AC1015/$INSUNITS header, for 24,326 bytes total. All nine CUT vertex arrays
match exactly and in order. This ties the failing points to today's product
allowance output, rather than to an unknown third-party source file.

| Piece | Source CUT vertex (0-based) | Coordinate (cm) | Current source edge / outline sample | Incoming CUT step | Outgoing CUT step | Receiver omission deviation |
|---|---:|---:|---|---:|---:|---:|
| back | 13 | (37.489, 74.514) | `neckline`, sample 13 | 0.045618 cm | 1.244020 cm | 0.012741 cm |
| outer collar stand | 14 | (139.277, 66.459) | `backCollar`, sample 14 | 0.046519 cm | 9.403408 cm | 0.012977 cm |
| inner collar stand | 14 | (156.921, 66.459) | `backCollar`, sample 14 | 0.046957 cm | 9.403249 cm | 0.013974 cm |
| upper pointed collar | 14 | (174.564, 66.459) | `backCollarBase`, sample 14 | 0.046519 cm | 9.403408 cm | 0.012990 cm |
| under pointed collar | 14 | (194.164, 66.459) | `backCollarBase`, sample 14 | 0.046519 cm | 9.403408 cm | 0.012999 cm |

For the four collar pieces, the mapped outline sample is at local
`(6.952907, -4.208440) cm`; its previous and next sampled seam points are
`(6.815131, -3.926761)` and `(7.000000, -4.500000) cm`. Those neighboring
seam samples are 0.313569 cm and 0.295339 cm away. A three-sample circumradius
estimate is 1.036595 cm, close to the product's 1 cm allowance. The back
neckline has the same local x station and sample geometry translated vertically;
its corresponding estimate is also 1.036595 cm. The CUT step is therefore a
very short step on the generated offset path around a tight curved source edge.
This is a source/code-supported geometric observation and a plausible reason
for import simplification; it is not evidence of CLO's internal threshold or
proof that the step is physically redundant.

`src/render/allowance.ts` establishes the code path: cubic edges are sampled at
14 positions, each sample retains its source `edgeName`, and `offsetOutline`
uses the incoming and outgoing edge allowances at each point. `POLO_ALLOWANCES`
sets the relevant named edges to 1 cm. The S634 trace script independently
recomputed the offset with sample provenance and asserted its unrounded path
against `seamAllowance`; it mapped the exact CUT vertices to the source edge
tags above. The S634 parser also pins the original source, all three receiver
DXFs, and five prior geometry/mark analyzer reports before matching pieces.

The point is about 1 cm from its source SEW outline and the nearest source mark
is 1.011–2.254 cm away. It is not coincident with a seam or mark. In all three
receiver outputs, the source point is omitted and its neighbors are connected
directly. The merged-segment deviation remains 0.012741–0.013974 cm, 12.7–14.0
times the fixed `0.001 cm` gate. The four other pieces retain their CUT vertex
counts; all nine SEW contours remain within the gate. S619 independently found
the reduced contours in the saved CLO pre-export/native representation for
the S617 Standard-import fixture; that narrows the observed point of
disagreement to before or at that representation, but does not expose CLO's
internal processing stage.

## Decision and next step

No source repair is recommended from this evidence. Deleting the five vertices
from generated contours would deliberately alter the current product CUT
geometry by up to 0.013974 cm and would make the producer's own expected
geometry differ beyond the unchanged tolerance. Neither the code nor the
researched evidence proves the feature redundant. No product source, pattern,
stitch graph, POM, DXF writer, output baseline, threshold, acceptance, status,
or hold changed.

S635's single selected practical test is to convert the nine existing CUT
`POLYLINE` entities to coordinate-identical `LWPOLYLINE` entities in a
disposable C:-only copy, then use the already authorized CLO Standard-DXF
import settings once and inspect imported/native CUT contours before export.
Keep all vertices, coordinates, units, settings, and all other entities fixed.
This tests one concrete representation difference, not a claim that either
entity form is inherently superior. If CLO still omits a point, stop this
representation path; do not export it or change source geometry. All V03
gates, all-seven acceptance, and holds remain unchanged.

## Raw evidence and verification

All exchange files and raw reports remain under
`C:\G04-CLO-DXF-Exchange\S634-polo-cut-topology-forensics\`.

| Artifact | SHA-256 |
|---|---|
| Original cm-header source | `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5` |
| Regenerated current product DXF, pre-header | `796E537EC77E86B16D6B82C3AADD4A9982933314097B707AE689936C65944FCA` |
| Three-route CUT topology report | `CA173E45C9885186F490342D212E17B78AFD0FE2F41E18940556ABF2A763DE32` |
| Product allowance/source-edge trace report | `07BB3D0D8D17579A0AD788E97475F57296EA9A26E470C874748308FFE33740D7` |

The report hashes above were rechecked at closeout. The deterministic analyzers
are `analyze-s634-cut-losses.mjs` and `trace-source-allowance.mjs`. Only
research/evidence scripts and documentation changed; changed-production-code
coverage is not applicable. The focused Control Center suite, output/evidence
preflight, board validation and `git diff --check` are recorded below. Full
repository tests, 100% global coverage, build, integrated browser/rendered
gate, PR, merge and deployment remain due at the settled Epic candidate.

## Slice ledger and status

- Started `2026-10-09 19:00:15 UTC` from S633 `cf367686b74b4572662d23b9cf12c459e1de4308`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; board start was 3676 and validated start replay advanced to 3678.
- Elapsed through closeout: approximately 26 minutes (19:00:15–19:26:31 UTC). Forensic analyzer and code-trace implementation/review: approximately 15 minutes; focused verification: approximately 2 minutes; durable packet, matrix, state and board closeout: approximately 9 minutes. External-agent waits: 0; maintainer-decision time: 0.
- CLO was not operated during S634 and remains open in the existing session. S634 used only saved C:-folder CAD evidence and local source code.
- Validated exit replay advances board revision 3678→3680, retaining G04-V01/V02 Done and G04-V03/EPIC-17 In Progress. Exact slice commit is the next boundary's `HEAD`.

No physical fit, factory acceptance, standards conformance, or production-readiness claim is made.
