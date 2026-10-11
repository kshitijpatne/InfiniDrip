# EPIC-17 / G04 V03 — Polo CUT vertex-loss adjacency diagnosis — Slice 613 exit

## Verified findings

- Closed 2026-10-09 11:53:34 UTC on `codex/epic-17-g04`. Start was from
  `cc8bc9cf24e862d78c5c23ffd2504a326a1d1f77`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  Board start revision 3582; S613 start replay advanced to 3584 and exit
  replay advances 3584→3586. G04-V02 remains Done; G04-V03/EPIC-17 remain In
  Progress.
- Hash-pinned source-to-output sequence alignment uniquely maps one omitted
  source vertex for each of the five failing Polo M CUTs in **both** prior
  AAMA and S609 ASTM output. The equal-count extra paths in CLO blocks were
  grouped by geometry and listed by numeric layer only; no layer semantics
  were inferred. Every surviving source vertex aligns within `0.000025 cm`,
  well under the unchanged `0.001 cm` gate. The same single missing vertex
  accounts for the S609 conservative whole-contour failures.
- Each omitted corner terminates a short source edge of `0.0456–0.0470 cm`
  (`0.456–0.470 mm`) before an adjacent long edge (`1.244 cm` on back and
  `9.403 cm` on the collar pieces). The local interior angles are
  `162.6–163.7°`; replacing the corner by the neighboring chord moves it
  `0.012736–0.013970 cm` (`0.127–0.140 mm`), about 12.7–14.0 times the
  permitted tolerance. The source indices are 13 on back and 14 on the four
  collar pieces; these are contour-local indices, not shared semantic IDs.
- **Interpretation:** a receiver simplification of a short-edge/shallow-turn
  feature is now a concrete, plausible mechanism for the repeatable point
  loss. It is not proven: the earlier test changes R2000/R12 input encoding
  and AAMA/ASTM output mode together, and there is no evidence assigning the
  operation to CLO import, internal normalization, or export. No geometry
  repair or alternate DXF encoding is authorized by this analysis.
- CLO was not accessed or operated. All new computed exchange analysis is
  under `C:\G04-CLO-DXF-Exchange\S613-polo-cut-vertex-adjacency\`. No
  source, output, app project, production code, legacy DXF, or protected
  export identity was changed.

## V03 disposition and next action

The five Polo CUT contours still fail the exact source-bound `0.001 cm`
acceptance gate; 9/9 S609 SEWs still pass. The new diagnosis explains why one
small feature dominates the deviations but does not make the measured output
acceptable. Profile/receiver qualification, all-seven recipe and option/grade
coverage, identity, CUT/SEW layer semantics, marks, malformed inputs, useful
rendered detail, and repeated round trips remain open. No acceptance criterion
or hold changes.

The most discriminating remaining test is still the pre-admitted S612 trial:
import the same exact S609 source through Standard DXF instead of AAMA, retain
all other settings, export ASTM once, reimport once and measure the same
contours. This tests whether the AAMA import mode retains that particular
short-edge feature; it will not establish the other V03 gates. Run it only
through a working, freshly verified native CLO control surface. S612's `.310`
app-control blocker remains; no more UI retry, software relaunch, or guessed
script/API substitute is justified. S569's published SDK/API was for a
different build and did not validate exact-build import/export automation.

## Evidence and verification

- Analyzer: `analyze-adjacency.mjs`; run against three existing C:-only files
  whose hashes are embedded in its report and rechecked before computation.
- Machine-readable output:
  `C:\G04-CLO-DXF-Exchange\S613-polo-cut-vertex-adjacency\Evidence\s613-missing-vertex-adjacency.json`.
  It reports all five piece mappings, omitted vertex coordinates/indices,
  neighboring edge lengths, local angles, chord offsets, per-output matching
  residuals and limitations. Its SHA-256 is
  `e147bd7cb22bcecab34c25caf866d3a0e220184012e8c86c8560f83581540d3c`.
- Analyzer SHA-256:
  `1b2e8dc2038cd1021664a43c226f066d68b427a17d8f6775dc61096814283024`.
- Script syntax check, source hash checks, sequence correspondence assertions,
  S609 failure-row checks, report preflight, validated board replay,
  Control Center tests (42/42), and `git diff --check` passed at closeout.
  Documentation/research only; changed production-code coverage is not
  applicable. The full repository gate remains for the integrated Epic/PR
  candidate.
- No safe independent ownership split existed for the narrow shared parser/
  geometry correspondence task; no external-agent wait or maintainer decision
  time.
- Elapsed time (11:49:29–11:53:34 UTC): source artifact alignment and
  neighborhood analysis about 2 minutes; focused verification and durable
  closeout about 2 minutes; external-agent waits 0; maintainer-decision time 0.
