# G04 V02 — Polo H source-ring radius trial — Slice 416

## Start boundary and authority

- Started 2026-10-07 08:41:04 UTC from clean S415 `46c1b91d462159dc1aeab8e537c7dc9b3d3526fb` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 415; S416 is uniquely reserved. Board revision 2414; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Goal remains active and matches current EPIC records. Usage at start 41% primary / 6% weekly.
- Trial only: inspect whether a smaller open ring, fixed at Polo's approved H source anchor `(7,0)`, can reveal the two distinct construction marks currently crowded by the approved 0.22 cm H ring. Reuse the exact 17 S399 current production SVGs and S411/S412 source-mark findings.

## Acceptance and boundaries

- Screen bounded ring radii from the same source-centered anchor across all 17 exact option rows. Keep H text at its currently approved offset, full POM identities/targets/schedule, source marks/paths, geometry and revision fixed. Measure ring-to-path, ring-to-mark and letter-to-ring clearance; reject any size that weakens station identification, merges with the glyph, or remains ambiguous at rendered scale.
- Render actual Chromium default and limiting candidates and inspect source marks, anchor legibility, label relation, neighboring paths and output scale. If no candidate is clearly readable for every option, document the failed trial and preserve all 34 Polo holds. Any production change requires a later explicit approval.
- Preserve the 0.25 cm residual gate, 0.68 cm residual, all-seven V02, V02-before-V03, all current face holds, legacy DXF, protected export identities, and V03 rights/profile/round-trip gates. No anchor or POM semantic change, geometry/stitch edit, threshold change, V03 work or physical/factory claim.
- No safe disjoint agent work: one source-centered ring rendered against same-revision exact paths and marks. No production implementation is authorized by this diagnostic.

## Start-board record

Validated start replay: `S416-start-board-commands.json`, board revision 2414→2417.

## Exit evidence

### All-option results

- The exact S399 source is `live-draft:polo:S399:<caseId>` for 17 rows: default plus both bounds for each of the eight supported Polo options. The H source station remains `(7,0)`; the H glyph stays at its approved location; POM identities, targets, full schedule, source marks and component paths remain unchanged.
- Diagnostic radii tested: 0.10, 0.12, 0.14, 0.16 and 0.18 cm. For each candidate, the circumference was sampled against every current front-component path and source-mark shape in Chromium using actual element transforms and stroke widths. The H text-to-ring relationship was also checked.
- **No candidate clears the same-revision path geometry across all options:** `optionsWithClearPaths` is 0/17 for every tested radius. The worst path clearance stays approximately −0.017 cm, so every radius still paints across an unrelated source contour near the shared station. At 0.10–0.16 cm, no size clears all source-mark outlines; 0.18 cm clears 16/17 but leaves one option in contact. The approved H glyph is separated from each ring, but that does not resolve the underlying path crossing.
- Actual Chromium crops were inspected for default at 0.10 and 0.18 cm, and `placketLength-min` at 0.18 cm (the limiting source-mark case). The 0.10 cm ring still cuts across the tightly converging source contours and is visually small; the 0.18 cm ring reveals more of one mark but still overlaps the source-path cluster. No candidate is proposed for implementation or approval.
- This is a distinct remaining H presentation hold after S412's ineffective ring-layer test and S413's failed position/leader candidates. Keep all 34 Polo faces held; preserve the 0.68 cm assembly RMS against the fixed 0.25 cm gate and all other current holds. No production mapping, geometry, POM, schedule, source path or acceptance changed.

### Verification, board, and elapsed time

- `search-h-ring-radii.mjs` screens five radii across the exact 17 S399 outputs and saves ten actual Chromium PNG crops; `check-h-ring-radii.mjs` validates source revision count, option count, candidate set, browser errors, measured all-option result and the rejected default-candidate conclusion. Both scripts pass syntax/data checks. Rendered images and numeric matrix are in this directory.
- Validated start board replay advanced 2414→2417; validated exit replay closes at 2420. `npm run control-center:test` passes 42/42 after replay; board is canonical/valid and `git diff --check` passes. No production source changed, so production coverage/build/export gates are not triggered; settled Epic global gates remain downstream.
- Elapsed approximately 4m45s (08:41:04–08:45:49 UTC): current source/output reconciliation 1m; bounded 5×17 browser screen and matrix 2m; rendered review 1m; packet/state/context/board closeout and Control Center verification 0m45s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** preserve all 34 Polo holds and do not implement a smaller ring. Continue with the next repeated V02 blocker that has an actionable source/output path; all-seven acceptance and every G04 gate remain unchanged.
