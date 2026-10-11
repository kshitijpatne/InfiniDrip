# EPIC-17 / G04 V03 — Polo named-block import trial — Slice 642 start

## Verified starting boundary

- Started `2026-10-09 22:29:57 UTC` from clean S641 commit
  `f0386ce665e1b2dabe8e27a1764500e529ecc370` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an
  ancestor of HEAD. S641 is the highest assigned slice; reserve S642.
- Canonical board revision 3710 retains G04-V01/V02 Done and G04-V03/EPIC-17
  In Progress. Start replay must add evidence/comment only.
- CLO 2026.1.310 remains running in the existing session. Product-development
  test use and local processing were explicitly confirmed by the maintainer.
  All trial files and captures for this slice stay beneath
  `C:\G04-CLO-DXF-Exchange\S642-polo-block-wrapper-cut-retention\`.
- Exact source is S617's `polo-standard-m-cm-units-header.dxf`, SHA-256
  `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`
  (24,326 bytes). S634 tied its entity body to current `exportDxf` output.

## Hypothesis and bounded objective

S628 provides a positive CLO control: a Woven zero-vent file with each source
piece's CUT, SEW and marks inside a named DXF `BLOCK`, and one identity
`INSERT` per piece, survived CLO DXF-AAMA import/export/reimport with source
CUT/SEW geometry within the existing tolerance. No Polo trial has applied
that tested grouping mechanism to the five shallow CUT outlines that fail in
flat model-space entity streams.

Test exactly this one new hypothesis: **embedding each unchanged Polo piece
entity group in a named identity-transform BLOCK/INSERT preserves the five
short CUT vertices in CLO's native import representation, while preserving
all nine piece-role names and all other imported contour/mark evidence.** This
is a test-fixture encoding only. It changes no cut coordinates, entities
inside groups, stitch graph, product writer, pattern, threshold or acceptance.

## Procedure and fail-closed gates

1. Generate a disposable wrapper from the pinned S617 source. Derive the nine
   role names from current `POLO × STANDARD_M` piece objects. Require one CUT
   per role, source-order bijection, unique role/block/INSERT names, identity
   transforms, and exact entity-record equivalence after block expansion.
   Preserve all non-ENTITIES source sections byte-for-byte. Record hashes.
2. Import once in CLO using the S516/S628 `DXF-AAMA`, cm, 100%, no-rotation,
   no-optimization settings. Save the project and C:-only actual screenshots.
3. Before any export, query all nine piece identities and native CUT/SEW
   geometry. Pass requires one-to-one identity, every CUT and SEW contour at
   `0.001 cm`, and no gross rendered damage. Compare the five previously
   failing Polo CUTs explicitly.
4. If pre-export passes, export once using DXF-AAMA, then reimport once into a
   clean project. Compare CUT/SEW geometry, all piece-role names and marks
   against the pinned source at the unchanged threshold; save a readable
   overall render and detail crops. Stop and preserve evidence on any import,
   query, geometry, identity, mark or render failure.
5. Do not try another entity wrapper, CLO mode, or alternative settings in
   this slice. A pass is only one M/default Polo fixture and does not clear
   all-seven options/grades, semantic layer/mark, malformed-input, profile or
   rights gates.

## Acceptance, risks, and non-goals

- Primary acceptance: exact preflight proves only the BLOCK/INSERT grouping
  changed; CLO's source-bound native measurements resolve all five CUT losses
  (or produce a durable measured failure); successful cases receive a full
  output/reimport/render review.
- All V03 criteria, all-seven scope, geometry tolerance, CLO profile/rights
  caveats, legacy DXF behavior, protected export byte identities and every
  existing hold stay unchanged. No compatibility, industry-standard
  conformance, production-readiness, fit, physical-sampling or factory claim.
- No vendor/supplier contact, spending, hosted service, cloud upload, new
  software install, broad UI redesign, or out-of-scope UI integration.
- Principal risk is the importer expanding blocks but still simplifying the
  short offset segments; a failure remains useful only as a precise negative
  result for this distinct mechanism.
- No safe independent ownership exists: fixture generation, CLO state,
  geometry query and rendered review form one coupled experiment. Keep it in
  Codex; no OpenCode/Claude delegation.

## Verification and time accounting

- Focused checks: wrapper preflight and source-regeneration assertion;
  read-only native CLO query and explicit geometry analyzer; actual rendered
  output inspection; Control Center tests and board validation; syntax and
  `git diff --check`. No production code is planned, so changed-code coverage
  is not applicable. Do not run the full repository gate for this evidence
  slice.
- Record implementation/evidence, focused verification, external-agent wait,
  and maintainer-decision time separately in the exit packet.

## Single next action

Replay this validated start packet and comment at board revision 3710, then
run the deterministic source-bound wrapper preflight. Do not touch CLO until
the preflight proves the input is exactly the pinned Polo entity set under
identity BLOCK/INSERT wrappers.
