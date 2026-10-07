# G04 V02 — Polo keyed marker clearance diagnosis — Slice 435

## Start boundary and authority

- Started 2026-10-07 19:30:37 UTC on `codex/epic-17-g04` from clean S434
  commit `1668e2e3d76bd08a8157e9fb0f1cbf5d05fb1a9a`.
- Fetched `origin/main` remains an ancestor; highest assigned slice is 434, so
  reserve 435. Board at start is revision 2588, EPIC-17 and G04-V02 In Progress,
  V01 Done, V03 Backlog; tally 56 accepted / 90 held across 73 configurations /
  146 faces.
- S434 implements the approved J/FG markers and establishes the current 17
  production Polo SVGs. Its preliminary raw glyph-to-path/mark replay recorded
  contacts at represented geometry and proposed a fixed-ring J-letter offset.
  S426's corrected full-label method is authoritative for readability; the raw
  contact count is not a collision acceptance metric and the offset is neither
  required nor implemented.
- S435 owns no production or test files. It diagnoses only the other current
  Polo keyed glyphs against their exact source paths, independent construction
  marks, POM anchors, 17 option revisions and rendered labels. It may correct
  measurement/reporting false positives by evidence, but must not change,
  retarget, or release previously approved markers.

## Scope and acceptance

1. Use S434's exact source revision, production-rendered front SVGs and option
   matrix for all 17 Polo configurations. Identify each non-J key's source POM,
   exact target outline/source edge or mark, key glyph box, expected marker
   station and any measured crossings/overlap.
2. Reuse the established S426 clearance analysis. Separate intentional contact
   between a ring and its represented anchor geometry from a glyph obscuring an
   unrelated seam, source mark, construction label, another glyph, or schedule
   row. Attribute each repeated finding by source ID, geometry ID and option.
3. Inspect representative complete outputs for default and option extremes.
   Reconcile S434's raw path/mark scan with S426's corrected complete-label
   evidence; do not reopen settled mappings or treat a negative anchor
   clearance alone as a production defect.
4. Record conclusions as directly source-encoded, pattern-specific rendering
   evidence, or proposed view decision. Give only source-supported fixes; do
   not implement a semantic view change in this diagnostic-only slice.
5. Keep all 34 Polo and 56 Woven faces held. Preserve all-seven V02,
   V02-before-V03, the exact S351 residual exception, 0.25 cm elsewhere,
   legacy DXF, protected export identities and CAD rights/round-trip gates.

## Non-goals and decisions

- No edits to production source, pattern geometry, stitches, POM definitions,
  marker anchors/offsets, colorways, option support, V02 acceptance, board
  statuses or evidence from older slices.
- No new recipe, physical sampling/fit claim, supplier contact, launch cost,
  hosted service, production-readiness claim, G09/D04 view or G05 tech-pack.
- The S434 J-letter `(0,+0.70 cm)` offset remains an unimplemented diagnostic
  trial. It is not recommended or needed by the corrected S435 label-collision
  result. Keep J at the approved source station and do not request approval for
  an unnecessary offset.

## Required checks and evidence

- Verify exact S434 revisions, marker/source identity, all 17 option rows and
  complete POM schedule bindings before clearance analysis.
- Run the corrected S426 full-label overlap analysis against the actual S434
  production SVGs and focused assertions; raw path/mark distances remain
  diagnostic only. No production code changes means no new coverage gate.
- Review actual rendered/cropped output, preserve the matrix and crops, and
  update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, admission history and the
  validated Control Center board at the exit boundary.
- Do not run the full repository gate for this evidence-only slice. Re-run
  Control Center tests if board data changes.

## Exit evidence

### Diagnosis and classification

The 17 S434 front SVGs are the actual production outputs for the exact
`live-draft:polo:S434:<caseId>` revisions, not reconstructed geometry. Each
retains 13 keyed full-text rows; the S435 matrix preserves the source POM IDs,
targets, source-entity IDs and text for every row. The audit contains 660
source-label instances and 153 marker glyphs. Across all options, it finds zero
source-label/source-label, marker/marker, marker/source-label,
schedule/schedule, marker/schedule or schedule/source-label box overlaps above
the documented 0.002 cm threshold, and no browser errors. All 34 Polo faces
remain held.

This reconciles S434's raw “path/mark conflict” count: those distances include
intentional marker proximity/contact with the represented source station and
outline strokes, so they do not establish unreadable annotation. S426 had
already documented that its own preliminary path-contact matrix omitted source
labels and misclassified target-station contacts; its corrected complete-label
replay found no label/key overlap. S435 applies that corrected method directly
to the newer S434 production SVGs and confirms the same result. The raw S434
matrix and offset scan remain historical diagnostic artifacts, not blockers or
approval requests. The unimplemented J text offset is withdrawn as
unnecessary by current evidence; the approved J ring and glyph remain at their
existing mapping.

### Rendered review

Reviewed full Chromium renders for the default, `standFrontRise=min`, and
`standFrontRise=max` cases. The key glyphs and full schedule are distinct in
these outputs; the source shoulder/collar annotation region is visually dense,
but the measured full-label boxes do not overlap. This is a callout-clearance
finding only: it does not certify every V02 output gate, arbitrary zoom
readability, or face acceptance. Rendered files are in `rendered/`.

### Verification and boundary

- `node docs/research/epic17/S435-polo-keyed-marker-clearance/review-full-label-clearance.mjs` passed across 17/17 actual S434 front SVGs: 34 faces held, 660 source-label instances, 153 keyed glyphs, 13 rows/front, zero measured overlaps and zero browser errors. Source row identity/target/source entity/text match the S434 production render matrix for every option.
- The three retained full-output PNGs were inspected. No production source or tests changed; changed-code coverage/build/export gates are not due for this evidence-only slice.
- The validated board start replay advanced 2588→2591. The exit replay is recorded separately; EPIC-17 and G04-V02 remain In Progress, V01 Done, V03 Backlog, with integrated accepted/held tally unchanged at 56/90 across 73 configurations / 146 faces.
- `npm run control-center:test` passes 42/42 after the exit replay; `git diff --check` passes. Do not run the full repository gate for this evidence-only slice.
- No face is accepted. All 34 Polo and 56 Woven faces remain held. The independent Polo eased-seam limit is still 0.25 cm except for the already approved exact S351 representation; V02 all-seven criteria, V02-before-V03, legacy DXF and protected export identities remain unchanged. Woven crossing/collar/topology holds remain. V03 remains gated by all-seven V02 plus documented rights review, receiver/profile selection and representative round-trip evidence.
- No new design decision remains from this audit. The maintainer's latest approval reconfirms the exact J/FG keyed schedule mapping; S435 required no additional semantic change.

### Time record and next action

Started 2026-10-07 19:30:37 UTC. Total elapsed to boundary: approximately
13m23s. Evidence diagnosis and reconciliation: ~5m; focused browser analysis
and rendered review: ~3m; implementation: 0m; durable packet/state/board
closeout: ~5m23s; external-agent waits: 0m; maintainer decision time: 0m.
These are elapsed-work estimates, recorded separately.

**Next action:** audit current per-face V02 acceptance evidence for Polo against
all applicable topology, joins, overlays, POM, readability and option-matrix
gates. Keep every Polo/Woven face held until the full applicable checks pass;
do not start V03 until all seven recipes pass V02.
