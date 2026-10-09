# EPIC-17 / G04 V03 — Mark and grade evidence audit — Slice 557 start

- Started: 2026-10-08 23:52:28 UTC.
- Start commit: S556 `66e087dc9f88d560ef2024be85189a63d68fe16b`, branch `codex/epic-17-g04`.
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, verified ancestor. Working tree clean before this packet.
- Start board revision 3341; start replay will advance to 3343. G04-V03 remains In Progress.
- Slice number 557 is unique after S556.

## Scope

Inspect retained C:-only CLO input/output DXFs, S525's semantic audit, and actual saved CLO renders for source-to-output mark evidence across the seven M/default recipes. Separately inspect repository source and existing output fixtures to determine whether the app can generate a genuine multi-size/grade DXF with a source-of-truth grade relationship or only individually selected-size DXFs. Write conclusions and any derived report only under `C:\G04-CLO-DXF-Exchange\S557-mark-and-grade-evidence-audit`; do not modify imported/exported fixtures. Use exact source identities and distinguish directly matched, transformed/split, missing, and ambiguous marks.

## Non-goals / unchanged gates

No new CLO import/export or repeat of the S523/S545 M/default round trips; no malformed-fixture repeat; no Polo contour trial; no source/pattern/stitch changes; no implementation or acceptance edit. Do not infer mark loss from absent direct-coordinate matches. Do not call individually generated sizes “graded DXF.” All V03 gates, seven-recipe requirement, 0.001 cm geometry tolerance, legacy exporter behavior, protected byte identities, local-only folder rule, and no physical/factory/production-readiness claim remain unchanged. The maintainer's product-development and local-processing confirmation is settled; do not ask again.

## Exit gates

1. Verify hashes and identities of every retained input/output/report used.
2. Review source/output mark correspondence and saved renders; list exact limitations.
3. Verify `exportDxf` and its callers/fixtures for selected-size versus actual grade interchange support.
4. State which subgates the retained evidence can close, which cannot, and the shortest next evidence step.
5. Update the durable packet, project/context/roadmap, and G04-V03 board via the validated command layer; run focused verification and preserve every hold.

## Decisions / dependencies

No maintainer decision blocks this audit. Exact industrial profile, five Polo contour gate, CUT/SEW semantics, malformed input, and independent receiver acceptance remain unresolved from S556. CLO stays open. No delegation is safe for one shared source/output evidence set.
