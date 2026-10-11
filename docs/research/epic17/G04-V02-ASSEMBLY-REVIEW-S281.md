# G04 V02 sewn-component assembly review — Slice 281

## Authority and start gate

- **Authority:** admitted V02 output correction and rendered review in
  `docs/planning/EPIC-17-ADMISSION.md`. S279–280 output demonstrates that source
  edge accounting and fold projection alone do not produce acceptable flats.
- **Start:** 2026-09-30 03:02:00 UTC. Clean parent is S280 commit
  `8cb935c5c189a50c882284914e00f14c6bafdb92` on
  `codex/epic-17-g04`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S280 was the
  highest reachable/active slice; S281 is reserved. Board revision 427 at
  start; validated S281 start comment is at revision 428. EPIC-17 is In
  Progress, V01 Done, V02 In Progress, V03 Backlog.
- **Dependencies:** S270 exact sewn-role placement, S275 subdivision/cycle
  review, S276 collar source-gap record, S279 live projection and S280 view
  metadata. Read `S280-browser/` rendered captures and
  `S280-reflection-pre-correction/` only as a rejected historical diagnostic.
- **Maintainer decision:** on 2026-09-30, the maintainer authorized source-backed
  view metadata for explicit on-fold axes and face-specific landmarks or
  multiplicity only where construction evidence supports them. This authorizes
  a mapping rule; it does not supply the missing evidence for any particular
  role. No pattern or cut geometry may change.

## Scope

Review the emitted Tee/Fitted sleeve intersections and Skirt waistband-to-front
placement against exact drafted edges and sewn-interface ordering. Identify
whether the current rigid transform is wrong despite source-known matching
landmarks, or whether the source join is insufficient for a finished-face
placement. Correct only a rigid placement supported by exact seam endpoints,
named edge direction and explicit face mapping. The authorized projection
metadata may represent a source-supported face distinction; if evidence does
not establish a contour or instance rule, withhold that role/face with precise
guidance instead of guessing. Re-review all eight previously emitted default
faces and all previously held defaults after each accepted correction.

Polo/Woven collar exterior splits remain held until a specific construction
reference supplies exact front/back landmarks. Trouser faces remain held while
the fly/waist assembly conflicts lack a source-supported rigid solution. Do
not force joins by scaling, warping, reorienting cut geometry or suppressing a
required source edge. This slice may conclude that V02 remains blocked.

## Source audit and projection disposition

- **Tee/Fitted sleeve:** `sleevedTopStitches` declares the ordered interface
  `sleeve.capLeft + sleeve.capRight ↔ front.armhole + back.armhole` with a
  permitted cap-ease range. This locates sewn interface intervals and explains
  the rigid endpoint residual; it does not declare which complete sleeve
  contour is visible in each orthographic face or how many view instances that
  pattern role supplies. `Piece.onFold` does not apply to the sleeve. The S280
  Chromium output shows the whole sleeve outline crossing the bodice. No
  source-backed rigid transform can make that whole outline a face contour.
  Both mapped sleeve roles are now held on both faces with this source gap.
- **Skirt waistband:** `SKIRT_STITCHES` maps the ordered front/back waist
  interfaces to one `waistband.seam`; `waistband.ts` defines a folded strip,
  and S280 established that its `onFold` edge is not the garment center axis.
  The source join supports placing the seam interface but does not select a
  face-specific segment or instance of the complete half-circumference strip.
  The S280 front screenshot shows the full strip extending past the front
  panel. Both face mappings now hold the waistband rather than show that full
  strip as a front or back contour.
- **Other held roles:** Polo/Woven-shirt collar roles remain held until a
  specific construction reference gives front/back landmarks. Trouser front
  and back remain held on the unresolved fly/shield and waist-interface
  cycles. These holds are not treated as visual passes.
- **Disposition:** the source does not support changing these rigid transforms
  or drawing a face-specific contour. `G04_UNRESOLVED_PROJECTION_ROLES` records
  the precise holds; the source block and cut coordinates remain unchanged.
  Slice 282 must establish a validated face-segment/instance contract from
  authored landmarks before any of these roles can emit.

## Acceptance criteria

1. Each reviewed join is traced to the exact `Block.stitches` entry, named
   edges, ordered interface segments, face role mapping, and current option
   draft. Record accepted transforms or the exact unsupported source fact.
2. Any accepted placement remains rigid, scale-preserving, same-block/revision
   bound, and leaves all source/cut geometry unchanged. Role identity, fold
   metadata, overlays and POM anchors remain attached to represented geometry.
3. Changed production code has 100% statement, branch, function and line
   coverage. Run focused assembly/projection/live/POM tests, TypeScript/Vite
   build, protected DXF/export identity checks and `git diff --check`.
4. Render affected default and relevant option/combined cases through
   production Chromium. Manually inspect all emitted defaults for crossed
   component outlines, unreadable annotations, POM anchor mismatch, and
   overlays that imply unsupported geometry. Verify held faces keep actionable
   source guidance.
5. Review MQF-004–007, MQF-011 and MQF-012 as `To be reviewed` only at a
   relevant successful G04 output exit; do not close findings or expand scope
   from a failed/incomplete view. MQF-015 remains assigned to V03.
6. Update this packet, admission plan, architecture, context, project state and
   canonical board evidence with exact rendered findings, blockers, elapsed
   time by category and one next action. V02 stays open if any required face
   remains misleading or held.

## Non-goals and delegation

No canonical pattern/cut coordinate change, new recipe, unproven face split,
fabric drape or physical-fit claim, broad UI redesign, G09/D04 side/oblique/
inside view, G05 production tech-pack content, supplier contact, spending,
hosted service, factory-acceptance or production-readiness claim. Preserve
legacy DXF and every protected export identity. No safe disjoint low-risk
ownership is identified; Codex owns the coupled assembly/output boundary and
external-agent waits are expected to be 0m.

## Exit evidence — source gaps held, V02 remains open

- **Implementation:** the exact source audit found no rigid-transform correction
  for the reviewed full-role contours. The projection map now holds Tee/Fitted
  `sleeve` and Skirt `waistband` on both faces, with role-specific guidance.
  Their source edges remain fully accounted for as held; no sew transform,
  pattern point, curve, cut line, option, POM, overlay or protected export was
  changed. The maintainer's view-metadata authorization was used only to permit
  evidence-backed mapping; it did not create missing contour or instance facts.
- **Focused gates:** projection, live-view and assembly suites passed 30/30.
  `technical-flat-projection.ts` passed 100% statement, branch, function and
  line coverage. `npm run build` passed TypeScript and Vite with the existing
  large-chunk advisory. `npm run control-center:test` passed 33/33. Protected
  export identity, generic DXF regression and tech-pack surface checks passed
  24/24. Browser-harness syntax and `git diff --check` passed.
- **Rendered matrix:** production Chromium exercised all 73 configurations,
  32 option fields at min/max and both combined fixtures: 146 face requests,
  two emitted and 144 withheld. There were zero browser-console errors,
  page errors or remote requests. Every held face retained visible guidance;
  no held case was caused by measured text collision. Tee/Fitted and Skirt
  defaults show no partial SVG: their precise source holds are visible in
  retained screenshots. Polo/Woven collar holds and Trouser sew-cycle holds
  remain. The Woven-shirt zero-length vent holds are also retained, not
  suppressed.
- **Manual emitted-output review:** the only emitted recipe was Tank. Its front
  and back default views were rendered from the same revision
  `live-draft:tank:3:3`; both screenshots were reviewed. The silhouette and
  center reflection are coherent and symmetric. The front's five POM callouts
  resolve to represented geometry and their leaders end at their labels; label
  bounds and notice bounds fit, with no measured overlap. The back correctly
  carries no inferred callouts from its front-only POM methods. SVG parsing and
  revision checks passed. Tank's output is digitally coherent; this is not a
  fit or factory-acceptance claim. Screenshots, SVGs and matrix are in
  `docs/research/epic17/S281-browser/`.
- **Acceptance disposition:** source-gated fail-closed behavior passed. G04
  V02 acceptance did not pass: six recipes have held or conflicting required
  views, and the emitted Tank view does not substitute for the seven-recipe
  gate. Do not mark V02 Done or close MQF-004–007, MQF-011 or MQF-012. Keep
  those findings `To be reviewed` at a successful output exit; MQF-015 remains
  assigned to V03. Preserve the post-G17 deferrals. No physical fit, factory
  acceptance, production readiness or CAD compatibility is claimed.
- **Board:** S281 start comment at revision 428; verified rendered-output
  evidence `E-G04-S281-EXIT` linked to G04-V02 at 429; the re-estimated
  27–31-slice range is synchronized to the Epic and summary card through
  validated commands at revisions 430–431. EPIC-17 remains In Progress and
  V02 remains In Progress.
- **Remaining blockers:** Tee/Fitted need authored front/back sleeve contour
  and view-instance rules; Skirt needs a source-mapped face segment for its
  waist strip; Polo/Woven need specific exterior collar split references;
  Trouser needs source-supported front fly/shield and four-leg waistband
  placement. Woven's zero-length vent edges need topology evidence before they
  can be represented. None may be inferred from screenshots.
- **Next action:** Slice 282 defines and validates the narrow face-segment and
  instance metadata contract against authored construction landmarks. Until
  exact evidence exists for a role, keep it held and keep V02 open.
- **Elapsed-time breakdown:** approximately 40m19s from 2026-09-30 03:02:00
  through validated board revision 431 at 03:42:19 UTC. Source audit and
  fail-closed implementation ~10m; focused coverage/build ~4m; Control
  Center/protected checks ~3m; production Chromium matrix and manual output
  review ~23m; documentation/board closeout ~5m (workstreams overlapped);
  external-agent waits 0m; maintainer-decision wait 0m.
