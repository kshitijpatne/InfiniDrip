# EPIC-17 / G04 V03 — CLO mark geometry audit — Slice 629 exit

## Result

S629 independently parses the unchanged S628 named-block input and CLO
DXF-AAMA output. The source contains 29 `MARK_*` entities in nine Woven size-M
piece blocks. Input/output SHA-256 hashes match the S628-pinned values. This is
a single-configuration geometric audit, not V03 acceptance.

| Source mark geometry | Observed same-piece output | Result at the existing 0.001 cm threshold |
| --- | --- | --- |
| 13 LINE (`MARK_PLACEMENTLINE`, `MARK_FOLDLINE`) | 13 separate open two-vertex POLYLINEs, one-to-one; max endpoint residual `0.00002 cm` | Point/segment geometry passes. Four stand/collar placement lines also lie exactly on CUT and SEW outline boundary segments; output layer identity is numeric, so line/outline role is not semantically separable. The machine report records output type, vertex count, and open/closed state for each matched target. |
| 8 CIRCLE (`MARK_BUTTON`) | 8 closed 12-vertex POLYLINE approximations; vertex radial residual max `0.000026 cm` | Whole-curve deviation does not pass: max chord sagitta `0.005113 cm`, over threshold. These are tessellated circles, not unchanged circle entities. |
| 8 POINT (`MARK_BUTTONHOLE`) | No discrete output POINT at source coordinates. Seven source locations intersect the same `61.8 cm` open output polyline; the eighth has no non-outline output geometry within threshold and is about 1 cm from the nearest outline. | No one-to-one point-mark representation. The seven shared line intersections are candidate-only coincidences; they are not counted as seven preserved buttonhole marks. |

CLO's output numeric layers and coincident entities do not preserve source
`MARK_*` meaning. The existing import and reimport screenshots render the piece
set, but marks are too small at overview scale to certify detailed visibility
or readability. No new CLO operation was made. The 13 geometric line matches
are useful bounded evidence; they do not clear the CLO mark, profile, or V03
gate. Keep the 8 circle curves, all 8 point marks, semantic layer identity,
all-seven/options/grades, units, repeatability, negative-input, independent
profile rights/conformance, and detailed rendered review unresolved. No gate,
threshold, source geometry, production writer, protected export identity, or
work-item status changed.

## Evidence and independent review

- Deterministic analyzer: `analyze-clo-mark-geometry.mjs`.
- Machine report and pinned DXFs:
  `C:\G04-CLO-DXF-Exchange\S629-clo-mark-geometry-audit\Evidence\clo-mark-geometry-audit.json`,
  `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Input\woven-zero-vent-named-piece-blocks.dxf`,
  `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Output\woven-zero-vent-named-piece-blocks-clo-export.dxf`.
- Existing reviewed S628 overview captures:
  `C:\G04-CLO-DXF-Exchange\S628-named-block-piece-identity-pilot\Renders\named-block-import-overview.jpg`
  (SHA-256 `CD0B6E64E18753EE9AC0CCD78798BC46F1F2372C103DEE0DC84C33B03CAACDC6`),
  and `...\named-block-clo-reimport-overview.png` (SHA-256
  `93C02F237DC438BF84D685CE9F69B84BDEAF85EE9805C18B7B92072A875D2BC8`).
  They support gross piece presence/name review, not detailed marker legibility.
- Claude Opus 5.5 `xhigh` read-only return is recorded in
  `claude-review-return.md`. It returned explicit `WORK FINISHED`; its
  per-entity interpretation independently agrees with Codex's pinned local
  analyzer. Its residuals were hand-calculated; Codex recomputed both DXF
  hashes. No review worktree changes were accepted.

## Start, verification, and timing

- Started `2026-10-09 17:26:38 UTC` from clean S628 `f5e284fcdd1a11e63ac161c938a1218aab5997bf`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor; S628 was highest. Board 3656 had V02 Done and V03/EPIC In Progress. Validated start replay: `3656→3658`.
- Deterministic analysis completed with both SHA-256 checks passing. Evidence preflight confirms 29 source marks, 13 one-to-one line matches, 0/8 circle whole-curve passes at `0.001 cm`, zero direct POINT entities, seven shared-path coincidences and one absent mark. Saved S628 overview captures were inspected; detail/readability remains unproven.
- `npm run control-center:test`: 42/42 passed. The report preflight confirms each of the 13 matched targets is an open two-vertex POLYLINE; the board validates at revision 3660 after the validated evidence/comment replay. `git diff --check`: passed. No production code changed; changed-production-code coverage is not applicable, and the full repository gate remains for the settled integrated Epic candidate.
- External-agent wait: approximately 8 minutes. Implementation/analysis: approximately 5 minutes. Focused verification/render review: approximately 3 minutes. Durable records/board/commit: approximately 6 minutes. Maintainer-decision time: 0 minutes. Total elapsed is approximately 22 minutes; no source-code or CLO changes were needed.
- No independent delegated implementation task was safe; the independent model review was read-only and completed before integration.

## Exit and next action

- Keep G04-V02 Done; G04-V03 and EPIC-17 In Progress. The CLO trial use and local-file handling are authorized. CLO remains open. Preserve all-seven acceptance and every V03 gate.
- Next reserve S630 after a fresh Git and board audit. Reconcile the official
  CLO help pages with the observed mark representations and determine whether
  any accessible primary standard specifies compatible marker semantics. Do
  not infer profile semantics from a menu label, repeat S628 or the earlier
  S603 grade-point selection attempt, or claim compatibility without evidence.
  Before committing, confirm each of the 13 line-match targets is an open
  two-vertex POLYLINE. The next S630 packet should identify and inspect the
  relevant official CLO documentation and any accessible primary standard;
  do not infer profile semantics from a menu label or repeat a conversion
  trial without a source-supported hypothesis.
