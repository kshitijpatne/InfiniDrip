# G04 V02 — Woven paired live-output review — Slice 401

## Start boundary and authority

- Started 2026-10-07 05:44:41 UTC from clean S400 `1952860e16d68af07b04814d294df035aa4aa4b8` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 400; S401 is uniquely reserved. Canonical board revision 2245 has EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Usage at start: primary 6%, weekly 1%, ordinary usage allowed.
- S400 added exact same-revision Woven front W callout mapping and its approved keyed rendering. S372's actual UI replay is the retained before-comparison: it emitted only 3/28 Woven fronts due to the finished-placket-width text collision but emitted 28/28 backs. S381 confirms the independent hem crossing is genuine continuous source geometry with no evidence for a truthful gap. This slice reconciles current paired output and the specific change's effect without reopening that decision.

## Scope and acceptance

- Rebuild all 28 supported Woven option rows at source revision `live-draft:woven-shirt:14:14`, with FRONT_FLAT and BACK_FLAT through `compileTechnicalFlatLiveView` and `renderTechnicalFlatSvg` using current colorway output. Retain compiler/render issues, exact POM metadata, SVG layer identities and path identity.
- Verify whether the S400 live mapping now emits all 28 keyed fronts with full source POM schedule, unchanged pattern/cut path identity and colorway fill. Verify back outputs remain complete and path/mark identities match S372's actual UI output. Reconcile the old S372 25-front hold count with current outputs; distinguish renderer emission from V02 face acceptance.
- Produce actual Chromium whole/detail views for default front/back and selected limiting front/back cases. Inspect the W marker, schedule and colorway, paired-back output, detached band detail composition, and the still-continuous back sleeve-hem crossing. Keep any face held if topology, join, overlap, crossing or readability gates fail.
- No production code change is expected. Verify matrix consistency, actual Chromium output, validated board replay and Control Center tests; `git diff --check`. Do not rerun full coverage/build/export gates for this evidence-only slice. Preserve 100% global coverage and protected export/DXF checks for the settled integrated candidate.

## Non-goals and holds

- No marker, source geometry, POM, stitch graph, seam projection, closure, option, colorway, export identity, renderer behavior, V02 threshold, face acceptance or criterion changes.
- Keep all 28 Woven back faces held at the unsupported continuous sleeve-hem crossing; preserve all 34 Polo holds at 0.68 cm against 0.25 cm. Even if Woven fronts now emit, do not mark faces accepted or advance V02 unless all V02 gates pass for all seven recipes.
- No V03 entry, G05/G09 scope, broad UI changes, physical or factory claims, supplier contact, or production-readiness claim.

## Dependencies and delegation

- Reuse S363 option rows, S372 retained back outputs, S400 actual front-output evidence, and S381 source/output evidence. No external construction research is needed.
- No safe disjoint delegated task: exact option/source revision, paired-path comparison and visual review are coupled. Codex owns the work; external-agent waits 0m.

## Start-board record

- `S401-start-board-commands.json` is replayed through the validated `executeBoardCommand` layer.

## Exit record

### Paired current output and reconciliation

- The same 28 S363 option rows were compiled at `live-draft:woven-shirt:14:14` through the current `compileTechnicalFlatLiveView` and production `renderTechnicalFlatSvg`. The matrix contains 56 revision-bound face requests: 28 front and 28 back outputs; zero compile issues, renderer issues, or browser errors.
- Current renderer emission is 28/28 fronts and 28/28 backs. Compared with S372's actual UI replay (3/28 fronts and 28/28 backs), the 25 former front `TEXT_COLLISION` holds no longer occur after S400's approved keyed W presentation. This is an emission and diagnostic-count reconciliation only; it does not accept any view or satisfy the integrated V02 construction, join, crossing, overlap, and readability gates.
- All 28 current fronts retain the exact same-revision W POM identity and full source schedule. Every back output has the same pattern path and colorway identity as its retained S372 output (28/28). The two detached sleeve/band outline instances and two band-fold mark instances remain present in each back output (28/28); no source geometry or stitch identity changed.
- Actual Chromium whole/detail images were generated and inspected for the default and limiting supported configurations. The approved W ring and glyph are present with the full schedule in the front output. Back whole and centered detail views at default, yokeDepth-min and yokeDepth-max retain the continuous central sleeve-hem X. S381's source review remains decisive: the hem is continuous and the source contains no break, gap, or over-under construction information, so an artificial separation would be misleading. Keep all 28 back faces held.
- Current renderer output can emit all 56 requests, but S401 releases zero faces. Keep all 56 Woven faces held pending integrated all-seven V02 gates; keep the 34 Polo faces held at the 0.68 cm sleeve residual against the unchanged 0.25 cm threshold. The 28 Woven back crossing remains a named blocking hold. No V02 criterion, acceptance, or V03 gate changes.

### Verification and disposition

- `node docs/research/epic17/S401-woven-paired-live-output-review/replay-woven-paired-output.mjs`: 28 options / 56 faces, 28 current fronts and backs emitted, zero current front text-collision holds, W/full schedule 28/28, detached band details 28/28, back path/colorway identity equal to S372 28/28, same-revision binding 56/56, and zero compile, renderer, or browser errors.
- Matrix consistency checks, current production-renderer SVG output and actual Chromium images are retained in `woven-paired-live-output-matrix.json` and `rendered/`. The matrix records current emission separately from the explicit all-56-held V02 disposition.
- S401 is evidence-only; no production code, tests, source geometry, pattern, cut/stitch graph, POM, option, colorway, output mapping, acceptance, or export identity changed. No full repository coverage/build/export gate is due for this slice; preserve those for the settled integrated candidate. `npm run control-center:test` and `git diff --check` pass at closeout.
- S397's MQF-004–007, MQF-011/012 and MQF-015 remain mapped to applicable G04 output exits as “To be reviewed”; this paired Woven review does not close them. Post-G17 deferrals remain unchanged. No physical fit, factory acceptance, or production-readiness claim.

### Time, board, and next action

- S401 started at 2026-10-07 05:44:41 UTC from clean S400 `1952860e16d68af07b04814d294df035aa4aa4b8`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor. Board revision 2245 recorded the preceding boundary; validated S401 start replay advanced it to 2247. S400 was highest; S401 was uniquely reserved.
- Approximate elapsed time through close: 10m. Implementation 0m; focused replay/matrix reconciliation 4m; rendered generation and inspection 3m; durable packet/state/board closeout and Control Center check 3m; external-agent waits 0m; maintainer-decision time 0m (the exact marker approval preceded this slice).
- Validated exit replay records the matrix, rendered images, packet, and G04/EPIC-17 evidence links/comments. The goal remains active and needed: its objective is the full admitted EPIC-17/G04 sequence through the required gates and safe merge. No goal status or wording was changed.
- **Next action:** inspect the refreshed durable state and highest-frequency remaining G04 blocker; retain every face hold, especially the evidence-unsupported Woven back crossing and Polo residual. Continue toward all-seven V02, then V03 rights/profile/round-trip evidence, final output review, integrated gates, PR, safe merge, ancestry and required deployment.
