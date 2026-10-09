# EPIC-17 / G04 V03 — ASTM CUT vertex-loss source diagnosis — Slice 610 exit

## Verified result

- Closed 2026-10-09 11:39:06 UTC on `codex/epic-17-g04`, from S609 commit
  `6bead7fe6ad139909f41cadbbf5ff07c72556fde`. At start,
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor; the
  tree was clean; board revision 3570; and S609 was the highest slice. Start
  replay moved 3570→3572; exit replay moves 3572→3574. EPIC-17/G04-V03 remains
  In Progress and G04-V02 remains Done.
- S610 parsed the exact hash-pinned S609 original R12 source and actual ASTM
  output, plus the prior S536 AAMA output. The five failing S609 pieces bind
  to their existing receiver blocks using the S609 exact-SEW piece map. Their
  source CUT point counts are back 33, outer/inner stands 54 each, and upper/
  under collars 44 each. The S609 measured worst source samples are `(37.489,
  74.514)`, `(139.277, 66.459)`, `(156.921, 66.459)`, `(174.564, 66.459)`, and
  `(194.164, 66.459)` cm respectively. These are maximum-deviation witness
  samples, not a claim about the CLO internal stage.
- The prior S536 DXF-AAMA output and S609 DXF-ASTM output both contain a
  one-vertex-short closed CUT outline for those same five roles. S536 used a
  geometry-identical R2000 LWPOLYLINE source; S609 used original R12 POLYLINE
  source. Because source entity encoding and export format both changed
  between the trials, they are confounded and their individual effects cannot
  be separated. The joint change did not eliminate the same five failures.
- S609 had curve-point optimization disabled on import and export and had
  AAMA non-grading-point removal disabled. The earlier S536 input had no seam
  allowances yet showed the same affected piece roles; this means automatic
  seam-allowance conversion alone is not a sufficient explanation. The exact
  point-loss stage—import, internal normalization, or export—remains unknown.
- The official CLO help review describes these options but does not document
  the observed vertex loss or promise this exact tolerance. No evidence-backed
  change to these same CLO options predicts a pass. See
  `CLO-DXF-HELP-REVIEW-S610.md`.

## Evidence and hashes

All new computed DXF comparison files are under
`C:\G04-CLO-DXF-Exchange\S610-astm-vertex-loss-source-diagnosis\`.

- `analyze-vertex-loss.mjs` SHA-256
  `d1909e2184cac9d71d6bb520950511b563c93fed7df914ec63571b788a462cec`.
- `Evidence\s610-vertex-loss-comparison.json` SHA-256
  `8215dd7ad011c387651380aad683d414c13df24dba2601616be2af8e99005c85`.
- S610 analysis pins the S609 source (`796e537e…c65944fca`), S609 ASTM output
  (`be0f11fc…fffcb9e0`), and S536 AAMA output
  (`06ede87a…354ef4de`). Full hashes and per-path layer/count inventories are
  in the comparison JSON.
- Official source: CLO Help Center, “2D Pattern (DXF) Import/Export,”
  https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export
  (updated 2026-09-28; checked 2026-10-09). It documents available modes and
  controls, not a fix or topology guarantee for this specific failure.

## Gate disposition and next action

S610 clears no V03 acceptance gate and authorizes no source/profile change.
The tested CLO 2026.1.310 Polo M AAMA-input/AAMA-output and AAMA-input/ASTM-
output routes both retain five CUT outline failures at the unchanged
`0.001 cm` gate. CLO imports and renders the patterns, but these tested
exchange paths cannot be accepted for this Polo M geometry. This is a scoped
rejection of the tested paths/settings for this fixture, not a claim that all
CLO versions, recipes, or every feature of CLO are unsuitable.

Keep all-seven-recipe acceptance, every V03 geometry/profile/identity/layer/
marks/grades/options/negative/repeated-round-trip/rendered-detail gate,
V02-before-V03, legacy DXF behavior, protected export identities and the
`0.001 cm` threshold unchanged. Product-development permission and local-only
handling are settled. No physical-fit, factory-acceptance, or production-
readiness claim is made. Keep the existing CLO session open while the goal is
active.

Next research a genuinely distinct free/local apparel-CAD receiver or
independently supported profile route against its official capabilities and
exchange licensing; do not guess at another CLO optimization toggle or repeat
the confounded AAMA/ASTM pair. A practical pass must still prove all applicable
CUT/SEW contours, marks/roles, size/options, and repeated round trips. If no
receiver offers a documented rights-compatible apparel profile and a testable
path, report that concrete blocker for a product decision without weakening
V03.

## Focused verification and time accounting

- `analyze-vertex-loss.mjs` passed `node --check` and parsed all 18 source
  contours, nine S536 blocks and nine S609 blocks. It verified three source/
  output SHA-256 identities and recorded the five source-bound failure roles
  with layer and vertex-count inventories. The report is separate from the
  S609 conservative geometry gate; duplicate numeric-layer paths are retained
  as inventory and no output layer receives inferred semantics.
- S610 start preflight and validated board replay passed at 3570→3572. Final
  report preflight, validated exit replay, focused Control Center suite,
  script syntax checks, and `git diff --check` pass at close. No production
  code changed; changed-code coverage is not applicable. Full repository
  gates stay at the settled Epic/PR candidate.
- Elapsed time (11:32:46–11:39:06 UTC): source/output analysis and official
  documentation review approximately 4 minutes; focused verification and
  closeout approximately 2 minutes; external-agent waits 0; maintainer-decision
  time 0.
