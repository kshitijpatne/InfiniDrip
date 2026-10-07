# G04 V02 — Polo H station ring layer trial — Slice 412

## Start boundary and authority

- Started 2026-10-07 08:16:12 UTC from clean S411 `5d9a9d27dd38688a81288c044765cbab1d8c32a7` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 411; S412 is uniquely reserved. Canonical board revision 2375 records EPIC-17 and G04-V02 In Progress, V01 Done and V03 Backlog. The goal is active and still matches the admitted G04 objective. Usage at start: primary 36%, weekly 6%; ordinary work allowed.
- Investigate the repeated Polo H station mark/contour crowding diagnosed at S411 using the actual S399 production SVGs and same 17 option values. S399 remains the current Polo renderer output because no Polo production code has changed since it. Existing S391/S392/S394 evidence supplies the exact marker, source marks, paths and approval context.

## Scope and acceptance

- Trace `pom:polo:shoulder-seam` and `pom:polo:neck-width`, their common `(7,0)` source anchor, current source-centered ring, approved H glyph offset `(+0.45,+0.45 cm)`, target `front:outline`, and same-revision `front:shoulder` / `outerStand:shoulder` marks and nearby collar/stand paths.
- Create diagnostic-only SVG variants across all 17 S399 actual outputs. Test whether moving only the ring behind the existing source paths/marks, while keeping the exact ring center/radius and approved glyph/schedule fixed, improves source-stroke/mark readability without weakening the POM anchor or obscuring the ring. A second bounded layout candidate may be screened only if the source-aligned ring treatment does not improve readability; do not hide, merge, or relocate authored marks.
- Inspect default and limiting rendered crops and quantify path/mark/text/ring relationships for every option. Any potentially useful treatment is only a proposed view convention; no production mapping is implemented without required maintainer approval. All 34 Polo faces remain held regardless of this trial.

## Required checks and non-goals

- Preserve same-option/revision identity, the two exact POM rows, source anchor/target/path and mark identities, unchanged full schedule, colorway, paired backs, 0.25 cm residual gate and all holds. Keep the three unkeyed C fallback errors distinct from keyed H output.
- Focused trial syntax and 17-option assertion/output checks, actual Chromium detail renders, validated board replay/tests, and `git diff --check`. No production code coverage/build/export gate is due unless a production change is authorized in a later slice; full integrated gates remain at the settled Epic candidate.
- No H source marker/anchor change, source/cut/stitch geometry change, source mark suppression, POM change, new acceptance rule, physical/factory claim, V03 work or broad UI change. No safe disjoint delegated task is identified.

## Start board record

Start evidence and validated replay are captured in `S412-start-board-commands.json` and `replay-start.mjs`; board revision 2375 is the verified input.

## Exit evidence

### Source and output facts

- The two POMs are `pom:polo:shoulder-seam` and `pom:polo:neck-width`. Both name `pattern:polo:role:front:edge:shoulder`, target `flat:polo:FRONT_FLAT:component:front:outline`, and share the exact `(7,0)` station. The approved H glyph remains at the `(+0.45,+0.45 cm)` offset; its source ring is fixed at `(7,0)`, radius `0.22 cm`.
- The two independent source marks are `pattern:polo:mark:front:shoulder`, center `(7,0)`, radius `0.11 cm`, and `pattern:polo:mark:outerStand:shoulder`, center `(6.9687,0.0358)`, radius `0.11 cm` in the default output. These marks remain distinct source IDs and the source stitch graph does not connect them. The outer stand/collar contour is separate source geometry.
- The actual S399 SVG paints the H ring after source geometry. The in-memory trial moved only that exact circle to immediately after colorway fills and before every component silhouette path. For all 17 options, removing the circle from each source/trial SVG yields byte-identical remaining content. Thus POM data, source/target/revision IDs, the 11-row schedule, glyph, source paths and marks are unchanged; only ring paint order differs. Browser errors: 0.

### Rendered trial result

Inspected matched current/trial Chromium crops for `polo-default`, `polo-standFrontRise-max`, and `polo-standFrontRise-min`. Moving the ring below source paths preserves their painter precedence, but makes no useful visible difference at H: the authored mark circles sit inside the larger marker ring and the shoulder/stand contours still converge at the same station. The independent marks remain nearly coincident and their labels are still crowded. The exact samples and all-option source coordinates are in `h-ring-layer-trial-matrix.json` and `rendered/`.

This treatment is rejected as a readability fix; there is no production change and no new approval is needed for it. The current output issue is not a source uncertainty: code and geometry directly encode two nearby, distinct shoulder marks and one POM station. Separating the key visually would require moving the marker from that station or changing its callout routing, which is a distinct semantic view choice and remains unimplemented. All 34 Polo views remain held for this and the independent 0.68 cm residual against the unchanged 0.25 cm gate.

### Verification and closeout

- `node --check trial-h-ring-layer.mjs` and `node trial-h-ring-layer.mjs` pass: exact S399 identities/options for all 17 rows, one fixed H ring per SVG, and byte-identical non-ring SVG content after normalizing ring location.
- Actual Chromium default and standFrontRise limit/min crops were generated for both current and trial order; manual comparison shows no useful readability change. Browser errors: 0.
- Validated board start revision 2375 advanced to 2378; isolated exit preflight passed and validated replay advanced 2378→2388. `npm run control-center:test` passes 42/42 after the board update; `git diff --check` passes.
- No production behavior changed, so changed-code coverage/build/export gates do not apply. Full repository/global coverage and integrated output review remain for the settled Epic/PR candidate.
- Elapsed approximately 5m (08:16:12–08:20:45 UTC): source and SVG paint-order inspection 1m; exact 17-option trial and assertions 1m; rendered review 1m; durable packet/state/validated-board closeout and focused Control Center verification 2m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m. Board start/exit revisions: 2375→2378 / 2378→2388.
- EPIC-17/G04 remains In Progress; all 34 Polo faces remain held. Preserve all-seven V02, fixed residual threshold, V02-before-V03, legacy DXF, protected export identities and V03 rights/round-trip gates.

**Next action:** S413 will test a specific source-anchored H marker/routed-label layout against the exact 17 current outputs and present a concrete rendered proposal if one clears the crowding without hiding marks or misrepresenting the target. Until the applicable decision and review pass, hold all Polo views.
