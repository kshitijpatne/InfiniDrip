# EPIC-17 / G04 V03 — actual receiver-output reimport and render — Slice 601 exit

## Verified boundary

- S601 started `2026-10-09 09:31:01 UTC` from S600
  `d2d9001cf8a60c830c135c2f248112d288abc269` on `codex/epic-17-g04`.
  Refreshed `origin/main` was `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and an ancestor. The clean worktree had only the validated S601 start
  replay afterward. Start board revision 3534; start replay 3534→3536.
- CLO 2026.1.310 remained open in the same session. The exact S595 receiver
  output was imported into a clean project with DXF-AAMA, centimeter, 100%,
  no rotation, original grain angle, notches Both/Position Ratio, import draw
  curve points on, and other import options unchanged/off. CLO displayed:
  “This DXF file contains seam allowances. They have been imported in Custom
  mode to preserve their original shape.” This was an informational notice;
  no import/format error appeared.
- The output-side reimport project was saved under the approved C: S601 folder.
  No source or DXF was modified; S601 performed no second export, profile
  variation, or geometry edit.

## Output-side rendered evidence

| Artifact (C: only) | Bytes | SHA-256 | What it supports |
|---|---:|---|---|
| `C:\G04-CLO-DXF-Exchange\S601-clo-roundtrip-output-render\S601-polo-m-output-reimport.zprj` | 2,333,121 | `A00394393B3D4C19F5742CC72870BC5A0EE245B3E543E9E14C686D3DBAF23B1C` | Saved project from the actual reimported receiver DXF |
| `C:\G04-CLO-DXF-Exchange\S601-clo-roundtrip-output-render\S601-polo-m-output-reimport.pdf` | 46,744 | `BE82820EC59BFC366E949CB4CAF4413699E0A6B3E2D99B6CD58C707A82704C95` | One-page CLO 2D snapshot at 1:1, 100%, 127 ppi; one page |
| `C:\G04-CLO-DXF-Exchange\S601-clo-roundtrip-output-render\S601-output-page-1.png` | 198,136 | `51068467942697959751C18D531749FB3AA824975EAE66546F91358547F86DB5` | Local raster used to inspect the full rendered sheet |

The PDF was made with all line categories selected and Pattern Name and Pattern
Annotations enabled; scale was 100%, rotation Do Not Rotate, resolution
127 ppi. `pdfinfo` reports one page, 6371.58 × 2685.6 pt. Visual review shows
all nine piece outlines, but CLO labels them numerically (0–8); outlines and
internal strokes are pale/faint. The collar group remains crowded and the
numeric label 5 is not an unambiguous source-linked piece/callout identity.
Some marks/lines are visible, but the render alone cannot establish whether a
specific source mark survived or what manufacturing role it has. The seam
allowance notice confirms CLO imported them in Custom mode; it is not a
measurement of their fidelity.

Compared with S600, this closes only the missing observation that the exact
receiver-emitted file itself was reimported and rendered. Both input-side and
output-side scenes show nine outlines and the same general faint-line and
crowded-collar readability concern. Neither snapshot proves source-linked
mark fidelity, CUT/SEW semantics, or contour acceptance.

## Acceptance and verification

- Narrow S601 objective passed: the hash-pinned emitted DXF imports without
  an application/format error, the resulting project saves, and actual
  output-side 2D rendered evidence was captured and reviewed.
- No G04 V03 gate clears. The exact S595 receiver result remains 4/9 CUT pass,
  5/9 CUT fail, and 9/9 SEW pass at the unchanged 0.001 cm limit. No CLO
  conformance or general receiver-suitability claim is made.
- V01/V02, all seven recipes, remaining V03 profile/identity/semantic/marks/
  grades/malformed/repeated-round-trip requirements, legacy DXF behavior,
  protected export identities, and all recorded holds remain unchanged.
- Focused verification passed: `npm run control-center:test` (42/42);
  `node --check` for all four S601 replay/preflight scripts; post-replay
  preflight confirmed board revision 3538 and all five pinned C: artifact
  sizes/hashes; `pdfinfo` confirmed one page; `git diff --check` passed.
  No product source/tests changed, so no full repository coverage gate is due
  at this evidence-only slice.
- Start `09:31:01 UTC`; verified closeout `09:40:59 UTC` (9m58s elapsed).
  Time accounting: CLO import/save UI 4m15s; output PDF capture 2m45s;
  rendered review/artifact capture 1m22s; durable packet/state/board closeout
  1m00s; focused verification 0m36s; implementation 0m; external-agent waits
  0m; maintainer-decision time 0m.

## Single next action

Choose a distinct V03 acceptance gate based on the controlling S601 matrix.
Do not repeat this unchanged Polo output render or S595 contour calculation.
Keep every measured failure and every untested criterion open; use an
independent source-linked test that can change a V03 disposition.
