# EPIC-17 / G04 V03 — S689 closeout

## Result

S689 tested one bounded hypothesis on the already authorized CLO 2026.1.310 Standard DXF route: the exact S681 Polo M geometry was expressed in millimeters because S685 showed CLO returning millimeter units without changing centimeter-valued coordinates. The scaled input preserves the same physical geometry and entity topology. CLO imported/exported/reopened the exact mm file without warnings and displayed nine pieces.

The mm representation fixes unit declaration/scale for this diagnostic pilot, and all nine SEW paths pass the unchanged `0.001 cm` gate. It does **not** make CLO a qualifying V03 route: five of nine CUT outlines fail at `0.012742–0.013969 cm`; eight of 108 marks are not present at their source positions; the return has generic piece blocks/numeric layers and no typed LINE/POINT/CIRCLE marks; the saved overview is dark/cropped and does not prove readable output. The CUT/mark failures match S685. No source-code defect is established. No production source, geometry, export baseline, protected identity, or acceptance criterion changed.

CLO Standard is rejected for this V03 route, and the bounded test stops here. Keep the original centimeter package authoritative. Do not fill receiver losses from a sidecar or run another setting/encoding variant. Full gate-by-gate disposition and the concrete safe path are in `S689-V03-route-decision.md`. All CAD exchange files and rendered evidence remain under `C:\G04-CAD-Interchange\S689-clo-millimeter-input-test\`.

## Gate status

- **Passed for this single pilot:** rights/local handling; truthful returned millimeter scale; all nine SEW outlines.
- **Failed:** CLO route pilot's five CUT outlines and eight visible marks. Prior CLO AAMA malformed-input handling is also a recorded failure.
- **Unproven:** full industrial profile qualification, returned identity/sidecar semantics, receiver grade/options, repeatability, readable output, and all-seven/options receiver matrix.
- **Preserved but final recheck due:** source all-seven/options/grades and legacy/protected export identities.
- **Pending after an eligible route exists:** one exact receiver pilot, existing 73-row/options and grade matrix, malformed-input control, repeatability, rendered output review, full repository 100% coverage/build, PR, safe merge, ancestry and required deployment.

No physical fit, factory acceptance, production readiness, ANSI/AAMA or ASTM conformance is claimed.

## Verification and accounting

- Start: 2026-10-10 19:54:22 UTC from clean S688 `bc30d838` on
  `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  is an ancestor. Board was 4071 before S689's validated start replay; start
  packets moved it to 4074 and temporarily set G04-V03 In Progress.
- Exact source, candidate, return, and normalized comparator-copy SHA-256s plus
  input transformation are in `S689-V03-route-decision.md`. Original return
  is 80,049 bytes, SHA-256
  `b6187bef2f7ceae9ea04fbaf18fb9c38f016ceb97ee7cb3673bbd47213b669b2`.
- The saved CLO overview was inspected; nine pieces are laid out, but the image
  is too dark/cropped to prove readable output.
- Focused diagnostics: the source-mm transform preserved entity types/counts,
  layers, ordering, vertices, closed state, bulges and physical coordinates;
  return comparison and localization identify the five CUT misses and eight
  mark misses; block inventory finds 125 LWPOLYLINEs and zero typed marks.
  Diagnostic scripts are not production code. `node --check` and the final
  Control Center suite are recorded after closeout; changed production-code
  coverage is not applicable. Full repository coverage/build is deferred until
  a settled eligible candidate.
- No acceptance, protected bytes or source pattern geometry changed. All
  unresolved gates remain explicit; there is no manual user action pending.
- Approximate elapsed time from 19:54:22 UTC to close: 18 minutes total.
  Controlled import/export, comparison, and rendered inspection: about 10 min;
  focused diagnostics and durable packet/state/board checks: about 7 min;
  external reviewer wait: not separately instrumented (bounded Sol result was
  available at this boundary); maintainer-decision time: 0 min.

## Durable closeout and next action

The validated Control Center closeout returns G04-V03 to **Blocked** while
EPIC-17 remains **In Progress** and V01/V02 remain Done. Acceptance is
unchanged. Do not reserve a receiver experiment until a specifically named,
already available and rights-cleared profile has preflight evidence that can
cover the fixed gates. This is a technical qualification condition, not a
request for pattern geometry, construction research, or a manual UI click.

If that condition becomes true, run one hash-pinned Polo M exact round-trip and
stop at its first gate failure. After a passing pilot, use the existing 73-row
matrix once, then the final full gates and PR/merge/deployment sequence.

- Validated board exit commands advanced revision 4074→4078; G04-V03 is Blocked,
  EPIC-17 remains In Progress, V01/V02 remain Done. `npm run
  control-center:test` passed 42/42; all four diagnostic scripts passed
  `node --check`. `git diff --check` passed after final whitespace cleanup.
