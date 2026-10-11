# EPIC-17 / G04 V03 — rendered-detail review of the existing CLO scene — Slice 600 exit

## Verified boundary

- S600 began at `2026-10-09 09:20:50 UTC` from S599
  `0c376e922a22dc2d5c4f7f9a3be0bdb2ef066343` on
  `codex/epic-17-g04`. `origin/main` was refreshed to
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Start board
  revision was 3530; validated start replay reached 3532.
- S600 inspected the already-open CLO 2026.1.310 scene associated with the
  S595 Polo M periodic-SPLINE trial. The scene was the input-side imported
  receiver project, not a project reloaded from S595's exported DXF. The
  Python Editor overlay was dismissed without editing its script. No project,
  source, or DXF was changed; no import or export ran.
- The worktree started clean except for the expected validated start replay;
  no production source or tests changed. CLO remains open.

## Rendered evidence

CLO's 2D snapshot dialog was set to a one-page 1:1 PDF at 127 ppi. Pattern name
and annotation checkboxes were enabled for this captured sheet. The sheet
contains all nine outlines in the scene. Whole-sheet output and reviewed crops:

| Artifact (C: only) | Bytes | SHA-256 | What it supports |
|---|---:|---|---|
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-polo-m-whole.pdf` | 39,746 | `FA321866B9C54E2F6F5AAF769EE9AA708C7C608162744DC6D892E2734228A331` | One-page 1:1 snapshot, all nine scene outlines present |
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-polo-m-whole.png` | 287,554 | `738B98A96318AEC22E0E1A9032F0F96F1AEE3A54D2D49585203D3B1BBA2006E1` | Full-sheet raster used for visual inspection |
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-detail-left.png` | 75,126 | `64D1B8DE4DF818410DF2F365B67282982F54A92069BF975B2C67A68E0CC039B7` | Left-side crop |
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-detail-center.png` | 65,816 | `20904BEB676B159DB14CC87704C8AAFE021930F983D7CE7B2E18AFB5186830A8` | Center crop |
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-detail-right.png` | 82,432 | `FA5C66D72708A60299FEF0DA05CBEF3368F78223BD54B16BA879496277F79CD4` | Right-side crop |
| `C:\G04-CLO-DXF-Exchange\S600-clo-rendered-detail-review\S600-collar-label-overlap.png` | 22,878 | `6860A377FA73A2D05351652E7AA2FB23B38AAC7B88F4E5BA3D8D1AC218B144EB` | Collar group detail showing label/outline crowding |

The PDF was rasterized locally with `pdftoppm` at 127 ppi (11,239 × 4,738
pixels); the whole sheet and detail crops were visually inspected. All nine
piece outlines are present. Strokes are pale and thin. Piece identification
uses numeric labels; label `5` crowds/crosses nearby collar outlines, so that
local identity/callout area is ambiguous at this rendered scale. The visible
sheet includes some marks (including a triangle notch and a circular mark on
the placket), but this inspection does not pair them to source identities or
establish their manufacturing meaning. It cannot show that marks were
preserved or that absent-looking marks were lost.

The pattern-name/annotation options were explicitly enabled for this PDF.
This is a CLO PDF snapshot of the imported input-side scene, not the DXF export
or a reload of the exported DXF. Therefore it establishes rendered presence
and a readable-detail limitation only. It is not evidence of CUT/SEW layer
semantics, source/output mark fidelity, units/scale acceptance, contour
round-trip fidelity, or complete V03 rendered acceptance. The independent
S595 round-trip remains 4/9 CUT pass, 5/9 CUT fail, and 9/9 SEW pass at the
unchanged `0.001 cm` gate. All existing V03 holds remain.

## Acceptance and verification

- The narrow S600 objective passed: an unambiguous whole-scene PDF and
  useful-detail crops were saved under the approved C: folder and inspected.
- No G04 V03 acceptance gate is cleared by this slice. In particular,
  rendered detail remains incomplete for source-linked marks/callouts and
  source-versus-exported output comparison.
- No DXF, project, product source, tests, threshold, protected export identity,
  profile, or acceptance criterion changed. All seven recipes, all five S595
  Polo CUT failures, other held gates, and the `0.001 cm` requirement remain.
- Validated board replay applies `E-G04-S600-EXIT` and its closeout comment
  from board revision 3532 to 3534, retaining EPIC-17/V03 In Progress and
  V02 Done. `npm run control-center:test` passes 42/42; S600 script
  `node --check`, C-artifact size/hash/page assertions, and `git diff --check`
  pass. No full repository gate is appropriate for this evidence-only slice.
- The first post-closeout artifact preflight still expected start revision
  3532, so it failed after the validated transition to 3534. The check was
  corrected to assert the exit revision and exit evidence, then all six C:
  artifact size/hash checks passed. This was a stale assertion, not a board
  replay or artifact failure.
- Start `09:20:50 UTC`; verified evidence/board boundary `09:28:39 UTC`
  (7m49s total). Time accounting: UI inspection and snapshot capture 3m10s;
  raster/PDF and detail review 1m35s; packet/state/board closeout 2m17s;
  focused verification 0m47s; implementation 0m; external-agent waits 0m;
  maintainer-decision time 0m.

## Single next action

Use the S599 gate matrix and S600's readability result to select one genuinely
new V03 acceptance item whose evidence can change a gate disposition. Do not
repeat the same Polo import/export, unchanged all-seven cohort, API queries,
or snapshot settings. Continue to keep every failed or untested gate open.
