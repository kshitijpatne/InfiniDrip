# G04 V02 — Polo H callout routing trial — Slice 413

## Start boundary and authority

- Started 2026-10-07 08:21:12 UTC from clean S412 `d422f033b2ee5a19e2d63420fbf32d508481593c` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice was 412; S413 is uniquely reserved. Canonical board revision 2388; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. The active goal remains required and matches admitted G04 through safe merge. Usage at start: primary 37%, weekly 6%; ordinary work allowed.
- Diagnostic-only search of the repeated H station crowding in the exact 17 saved S399 Polo outputs, after S412 found ring layer order ineffective. The source facts and current approved H glyph offset are recorded in S411/S412; do not repeat construction research.

## Scope and acceptance

- Preserve `pom:polo:shoulder-seam` and `pom:polo:neck-width`, common source anchor `(7,0)`, target `front:outline`, source mark identities/positions and exact source/cut/stitch geometry. Do not hide either shoulder mark. Preserve the approved glyph's current relative offset, values, tolerances, two schedule rows, all other schedule rows, colorway and paired backs.
- Screen a bounded set of view-only translations for the entire H marker (ring and letter together), connected to the exact source anchor by an explicit annotation leader. Evaluate leader/path and label collisions on all 17 outputs; the one exact contact at the POM target is intended. Render the most viable current and limiting options. Use a proposal only if it improves readable distinction without implying a different physical join or source point.
- Pass means either (a) an exact viable candidate with geometry, source identities, leader route, option incidence, rendered evidence and tradeoff ready for maintainer decision, or (b) a documented finding that tested routes do not solve the overlap and all faces remain held. No candidate may be implemented without required approval.

## Required checks and non-goals

- Exact option/revision identity; source station/ring/glyph linkage and all full-text rows remain unchanged in meaning. Focused candidate geometry checks, actual Chromium renders, validated board replay/tests, `git diff --check`.
- No production mapping or renderer change, source mark suppression/movement, pattern/POM/stitch/cut change, clearance-gate or acceptance change, release of Polo faces, V03, unrelated UI, physical sample or factory claim. No safe disjoint agent work is identified.

## Start board record

Start evidence and validated replay are in `S413-start-board-commands.json` and `replay-start.mjs`; revision 2388 is the verified input.

## Exit evidence

### Exact source station and candidate search

- The source POMs remain `pom:polo:shoulder-seam` and `pom:polo:neck-width`, sharing source `pattern:polo:role:front:edge:shoulder`, target `flat:polo:FRONT_FLAT:component:front:outline`, and anchor `(7,0)`. The current authored station is crowded by two distinct marks and nearby source contours. At the anchor, the nearest source geometry includes the target front outline (0.0012 cm center gap) and independent `pattern:polo:role:outerStand` outline (0.0476 cm center gap). The source stitch graph does not declare those outlines joined at this station.
- Eight shared diagonal translations were tested on every actual S399 option: ±0.8 cm and ±1.2 cm in the four diagonal directions. Each candidate moves the 0.22 cm ring and existing approved glyph together, preserving their relative position, and adds a direct view-only leader from `(7,0)` to the ring edge. The full-text schedule stays at eleven rows; no source geometry or mark moves.
- No translation passes the same-route all-option screen. `west-down-0.8` clears its moved ring/glyph from separate marks and text in 17/17, but the leader crosses `outerStand:outline`, `underCollar:outline`, and `upperCollar:outline` in the source body on the path in all 17 options (49 sampled path contacts). The default detail shows this diagonal entering the collar/stand stack; this candidate is rejected.
- The up-left/up-right candidates avoid additional path contacts after the intended source contact and keep moved rings clear in 17/17. Their unchanged relative H glyph, however, intersects existing source shoulder labels in 15/17 (west-up) and 2/17 (east-up). The remaining down-right candidates also cross source collar/stand paths. The full per-option path/mark/text identities and exact incidence are in `h-route-candidate-matrix.json`.
- At the shared source point, every route starts where the front silhouette is joined in projection by the independent outer-stand outline and the two marks are nearly co-located. No topology evidence authorizes depicting these as a physical stitch join. The source confirms which POM edge is targeted, but a usable shared visual route is not supported by this bounded search. No proposed production mapping is advanced and no new approval question is warranted for a candidate that fails option-wide checks.

### Render review, verification, and holds

- Actual Chromium rendered the source-anchored `west-down-0.8 cm` candidate for default, `standFrontRise=max`, and `standFrontRise=min`. The H marker moves away from the shoulder marks, but its direct leader runs through collar/stand outlines; these images document a rejected trial. Browser errors: 0.
- `node --check search-h-routes.mjs`, `node search-h-routes.mjs`, and `node render-h-route-candidate.mjs` pass. Search asserts 17 exact S399 option/revision rows and measures source paths, marks and other text; the rendered candidate retains the exact two POM identities, target, source anchor, ring radius, glyph-to-ring relationship, and eleven full schedule rows.
- Validated start board revision 2388 advanced to 2391; exit command preflight and replay are recorded in the packet. `npm run control-center:test` and `git diff --check` pass. No production code changed, so the global gate remains for the settled Epic/PR candidate.
- All 34 Polo faces stay held. The independent 0.68 cm assembly residual still exceeds the unchanged 0.25 cm gate. Preserve the all-seven V02 requirement, V02-before-V03, legacy DXF, protected export identities, and V03 rights/profile/round-trip gates.
- Elapsed approximately 9m (08:21:12–08:30:12 UTC): pattern/topology and candidate definition 2m; 8×17 route and output screening 3m; rendered review 1m; durable packet/state/validated-board closeout and focused Control Center checks 3m; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** continue to the next independent repeated G04 view blocker from refreshed project state. Do not implement an H route from this failed candidate set or release any Polo face.
