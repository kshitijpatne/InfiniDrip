# EPIC-17 / G04 V03 — CLO mark geometry audit — Slice 629 start

## Verified start

- Started `2026-10-09 17:26:38 UTC` from clean S628 commit
  `f5e284fcdd1a11e63ac161c938a1218aab5997bf` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S628 is the highest assigned slice; S629 is reserved.
- Canonical Control Center board revision 3656 has EPIC-17 and G04-V03 In
  Progress and G04-V02 Done. The validated start replay adds evidence and a
  comment only; statuses, scope, gates, and all-seven acceptance stay fixed.
- The maintainer confirmed in writing that the installed CLO 2026.1.310 trial
  is authorized for InfiniDrip product-development DXF evaluation and that
  imported/exported DXF data is processed locally. Files remain under
  `C:\G04-CLO-DXF-Exchange\S629-clo-mark-geometry-audit\`.
- CLO remains open, with no S629 application operation planned.

## Bounded objective

Measure whether manufacturing-mark geometry authored in the exact S628 Woven
size-M source fixture remains represented in its already-produced CLO
DXF-AAMA export. Match each source piece and each source `MARK_*` primitive to
candidate output geometry in the corresponding size-suffixed BLOCK. Use direct
coordinates and only the existing `0.001 cm` gate; do not fit transforms,
infer numeric CLO layer meanings, or reinterpret mark semantics from entity
type alone. Record marks that are preserved, transformed, missing, ambiguous,
or not decidable from this one fixture. This reuses the hash-pinned S628 input
and output; it does not run another CLO import/export.

## Scope and gates

- Preserve S628's exact input/output DXF bytes and hashes.
- Independently parse BLOCK/INSERT structure and associate each source block
  with its observed one-size output block; reject missing, duplicate, or
  unresolved identities.
- Inventory every source mark by piece, source `MARK_*` layer, entity type,
  geometry, and relevant DXF attributes. Report candidate output geometry and
  residual for each mark using explicit matching rules and one-to-one
  assignment where the data supports it.
- Retain ambiguity when CLO's flattened numeric layers, generated points,
  or repeated entities prevent a unique source-mark correspondence. Numeric
  output layers are locators only; no standardized or apparel meaning is
  inferred.
- Inspect the corresponding existing CLO reimport render. It is gross-shape
  evidence only; do not call dense marks legible unless their detail is
  actually resolvable in that capture.
- Preserve the `0.001 cm` geometry threshold, V03 profile/rights, units,
  identity, grades, negative-input, all-seven, repeated-generation and
  rendered-output gates. A one-Woven-fixture mark geometry result cannot close
  V03 or establish apparel-profile mark semantics.

## Non-goals, dependencies, risks

- No second CLO operation unless inspection proves the existing output cannot
  answer the bounded question and the missing test is materially new. No
  alternate profile, mode, or unit permutation.
- No production writer, garment source, semantic convention, export-baseline,
  acceptance, or status change. No claim of industrial compatibility, factory
  acceptance, physical fit, or production readiness.
- Main risk: CLO output may turn authored mark entities into dense or
  untyped geometry. A nearest visual trace is not sufficient to call semantic
  preservation; keep such cases explicitly unresolved.
- No disjoint implementation assignment is planned: parser, source binding,
  output match, and interpretation are one evidence chain. Codex owns analysis,
  review, and closeout.

## Verification and single next action

- Focused preflight for input/output hashes and block/entity inventories;
  deterministic mark-matching report; review exact source/output DXF records
  and the saved reimport render; run focused report assertions and
  `npm run control-center:test`; validate board start/exit and `git diff
  --check`.
- No production code changes are expected, so changed-production-code
  coverage is not applicable. Reserve the full repository coverage/build and
  integrated rendering gates for the settled Epic/PR candidate.
- First action: replay the validated S629 start evidence/comment at board
  revision 3656, then implement the source-bound mark audit against the existing
  S628 artifacts. Preserve every unpassed V03 gate.