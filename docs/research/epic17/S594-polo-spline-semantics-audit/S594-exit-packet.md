# EPIC-17 / G04 V03 — Polo SPLINE semantics audit — Slice 594 exit

## Verified boundary

- Started `2026-10-09 08:14:48 UTC` from S593
  `42317d233677d4d2fae10b494f12feeb2cf73f4c` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an
  ancestor. S593 was the highest prior slice; S594 was unique.
- Board start replay `3500→3502`; planned exit is `3502→3506`. EPIC-17/V03
  remain In Progress; V02 remains Done. The goal is still active and matches
  the admitted objective through verified merge; no resume or goal edit is
  needed.
- CLO product-development trial permission and local-file-processing
  authorization are confirmed in `docs/PROJECT-DECISIONS.md`. No CLO UI
  operation occurred in S594; CLO remains open. All exchange artifacts remain
  under `C:\G04-CLO-DXF-Exchange\`.

## Finding

The S591/S592 Polo M source SPLINEs are source-exact degree-1 B-splines under
independent evaluation. All ten entities across five CUT pieces and two
variants have hash-pinned controls/knots, and 3,206 active-span evaluations
match the original source POLYLINE edges with maximum numeric residual `0 cm`.
S591 group 70=`25` (closed + planar + linear); S592 group 70=`24` (planar +
linear). Their only changed field is the closed bit; the mathematical curve
does not change. Both use the same repeated endpoint, nonperiodic clamped
knots, no fit points, and no explicit weights. See the full start packet for
per-piece counts, exact flags/fields, method, source links and detailed limits:
`docs/research/epic17/S594-polo-spline-semantics-audit/S594-start-packet.md`.

| Polo M CUT | Source vertices | Degree-1 controls | Knots | Maximum source residual |
|---|---:|---:|---:|---:|
| Back | 33 | 34 | 36 | 0 cm |
| Outer collar stand | 54 | 55 | 57 | 0 cm |
| Inner collar stand | 54 | 55 | 57 | 0 cm |
| Upper pointed collar | 44 | 45 | 47 | 0 cm |
| Under pointed collar | 44 | 45 | 47 | 0 cm |

Autodesk's [DXF SPLINE reference](https://help.autodesk.com/cloudhelp/2024/ENU/AutoCAD-DXF/files/GUID-E1F884F8-AA90-4864-A215-3182D47A9C74.htm)
defines the flag bits and group fields. Autodesk's [AcDbSpline constructor
reference](https://help.autodesk.com/cloudhelp/2027/ENU/OARX-RefGuide/files/GUID-AcDbSpline__AcDbSpline_int_Adesk__Boolean_Adesk__Boolean_Adesk__Boolean_AcGePoint3dArray__AcGeDoubleArray__AcGeDoubleArray__double_double.html)
distinguishes closed loops from periodicity and gives the nonperiodic/periodic
knot-count conventions. Neither source documents CLO's internal interpretation
or accounts for the measured output deviation.

**Acceptance remains failed for five CLO Polo CUT contours.** S591/S592's
measured output bounds and S593's no-candidate result are unchanged. This
source math audit is not receiver round-trip acceptance and clears no V03
gate. It rejects another flag-only trial. S595's only proposed CLO experiment
is a periodic degree-1 representation, and only after its periodic knot/control
format and all five source curves are independently proven exact. If that
preflight fails, no CLO trial occurs. Preserve all seven recipes, every
identity/semantic/marks/grades/negative-input/detail/repeated-round-trip gate,
the fixed `0.001 cm` threshold, legacy DXF behavior and protected export
identities. No industrial-conformance, universal compatibility, physical-fit,
factory-acceptance or production-readiness claim.

## Evidence and verification

- Analyzer: `docs/research/epic17/S594-polo-spline-semantics-audit/audit-splines.mjs`.
- Machine report:
  `C:\G04-CLO-DXF-Exchange\S594-polo-spline-semantics-audit\Evidence\Analysis\S594-spline-semantics-audit.json`,
  SHA-256 `4e5aedb57dc5c42436bfb2f8cc4f6045120db4379ecb5e6d8ff30df9d3c910ad`.
- The initial analyzer mistakenly bound source entity index 2 to the compacted
  derivative POLYLINE array. This failed assertion was diagnosed; the
  implementation now binds each target to exactly one SPLINE by the complete
  ordered control-coordinate sequence and repeated endpoint, then hash-checks
  all five original/source/preflight files. A wording correction changed
  LWPOLYLINE to the actual source POLYLINE and regenerated the report. Final
  script syntax, hash checks, unique bindings, field/count assertions and all
  curve evaluations pass.
- `node --check` passes for the analyzer and board-command scripts;
  deterministic analyzer replay reports SHA-256
  `4e5aedb57dc5c42436bfb2f8cc4f6045120db4379ecb5e6d8ff30df9d3c910ad`.
- Validated board clone preflight and CLI replay pass at `3502→3506`, retaining
  EPIC-17/V03 In Progress and V02 Done. `npm run control-center:test` passes
  `42/42`; `git diff --check` passes.
  No production code changed; changed-production-code coverage is N/A. The
  full repository gate remains reserved for the settled integrated candidate.

## Time accounting and next action

- Start `08:14:48 UTC`; verified boundary `08:22:18 UTC` (7m30s total).
  Analysis-tool implementation 3m; specification/source analysis 2m;
  focused verification 1m; documentation/board closeout 1m30s; external-agent
  waits 0m; maintainer-decision time 0m. No production code or CLO interaction.
- Start board revision `3500`; validated start replay `3500→3502`; validated
  exit replay `3502→3506`. Control Center passes 42/42. `origin/main` was
  refreshed and remained an ancestor at both start and exit; S594 is unique.
- Next: S595 prepares one periodic degree-1 candidate, independently verifies
  exact curve equality and counts before a bounded CLO round-trip. Do not test
  if the exact-source proof is not complete; do not change source geometry or
  V03 gates.
