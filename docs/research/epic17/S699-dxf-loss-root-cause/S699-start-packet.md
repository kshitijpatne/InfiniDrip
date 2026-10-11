# EPIC-17 / G04 V03 — S699 source/return loss root-cause audit

## Goal and slice boundary

Determine, from the exact S698 Polo M input/return and current candidate writer, why the six failing CUT contours lose fidelity and why three buttonhole POINT marks disappear. Separate source serialization defects from receiver transformations using entity-by-entity evidence. This slice does not run another CAD application or receiver variation.

## Verified start

- Start: 2026-10-10 23:27:33 UTC (slice work begins after this packet/board reservation).
- Branch `codex/epic-17-g04`; starting commit S698 `a4c1354361da8e514e1ff65eaa8bd8e76e4f0e52`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- S698 is the highest assigned slice; reserve S699 uniquely.
- Board revision 4129: EPIC-17 In Progress, G04-V03 Blocked; goal remains active.
- Latest receiver output, hashes, and rendered evidence are in S698 packet and `C:\G04-CAD-Interchange\S698-clo-precision-recheck\`.

## Audit work and acceptance

1. Inspect `src/export/dxf.ts`, `src/export/dxf-centimeters.ts`, mark/layer/block handling, and the candidate package call chain.
2. Parse S698 input and returned DXFs by block, layer, entity type, vertex count, bulge/closed flags, units, and coordinates; bind each to exact source geometry and comparison results.
3. Identify causes separately for curved CUT losses, buttonhole point disappearance, and named layer/entity identity loss. Mark each as directly encoded by our writer, receiver transformation, or still unproven. Do not blame receiver behavior without evidence and do not mask exporter defects as receiver quirks.
4. Deliver the shortest evidence-backed source repair path, affected output entities, preserved legacy identities, exact focused tests/coverage, and one decisive verification per cause. If the audit proves a bounded source correction, reserve a separate fresh slice for implementation; no code change is silently bundled into this audit.

## Gates and non-goals

- Keep all V03 gates and thresholds unchanged: all seven recipes, supported options/grades, CUT/SEW fidelity at 0.001 cm, marks, identity, units, malformed-input rejection, repeat round trip, rendered/readable output, rights, documented profile, legacy export byte identities, and protected outputs.
- No new receiver, software, format, setting, grade, or encoding experiment. No standards-conformance, physical-fit, or factory claim.
- Do not alter source pattern geometry, acceptance, baselines, or legacy `exportDxf`.
- Keep CAD files and derived receiver evidence under the named C: folder; repository stores source code, concise reports, and reproducible audit artifacts only.
- No production code changed in this slice, so no changed-code coverage requirement; run focused audit tests only if required to reproduce a code claim. Full repository gate remains for the settled Epic candidate.

## Exit record requirements

Record concrete source/entity causes and evidence, focused checks performed, changed files, state/board revision, timing by implementation/verification/waits/maintainer decisions, remaining gates, and one next action. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical board through validated commands. Keep V03 held and the overall goal active.
