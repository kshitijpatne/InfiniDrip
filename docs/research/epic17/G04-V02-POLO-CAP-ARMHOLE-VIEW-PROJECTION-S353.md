# G04 V02 — Polo cap-to-armhole view projection — Slice 353

## Start boundary

- Started 2026-10-02 03:03:24 UTC from clean `codex/epic-17-g04` at S352
  `4f0e2d50a80de1ecad3b0c6ad0b1507ed083fc69` (`Slice 352: retain Polo POM
  label holds`). Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S353 is the next
  unused monotonic slice number.
- Canonical board revision 1392: EPIC-17 and G04-V02 In Progress, G04-V01
  Done, G04-V03 Backlog; EPIC-14/15/16 Closed. S352 exit, route matrix and
  rendered diagnostic evidence are linked; its landed commit evidence and
  S353 start evidence are being added through the validated command layer.
- Usage at start: primary 24%; weekly 24% informational.
- Current V02 tally: 56 accepted / 90 held across 73 configurations / 146
  requested faces. Polo is 0/34 accepted; all 17 option cases have the
  recurring 0.68 cm sleeve-cap assembly residual and 51 source-anchored POM
  label blockers. Preserve these holds and the 0.25 cm threshold.
- Authority: the maintainer explicitly approved the exact view-only Polo
  normalized-arclength projection in S351 on 2026-10-02. The durable decision
  is in `docs/PROJECT-DECISIONS.md` with ID
  `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH`.

## Scope

Implement only the approved Polo seam depiction in the revision-validated
source-to-view metadata and geometry compiler:

- FRONT: correspond `sleeve.capLeft` underarm→shoulder to `front.armhole`
  underarm→shoulder by normalized arclength. Suppress the duplicate sleeve-cap
  stroke and represent the body armhole contour once on the seam layer.
- BACK: correspond `sleeve.capRight` underarm→shoulder to `back.armhole`
  underarm→shoulder by normalized arclength. Suppress the duplicate sleeve-cap
  stroke and represent the body armhole contour once on the seam layer.
- Validate the exact current one-per-block `Sleeve-cap ease` stitch, source
  piece/edge identities, endpoint order and complete edge accounting. Keep
  both source cut outlines, original stitch/ease graph, rigid placement
  solver, and source edge lengths intact. Do not assert physical length
  equality or a source-authored ease distribution.
- Keep Polo's two reflected sleeve instances, existing colorway/artwork
  mapping, artwork/POM source identities and all other recipe mappings intact.
  Test whether view-only colorway area boundaries still meet the projected
  armhole endpoints exactly; on any mismatch or ambiguous contour, withhold
  that candidate and keep the face held.

## Acceptance and verification

- Focused projection/geometry/live tests; require 100% statement, branch,
  function and line coverage on every changed production module. Add negative
  validation cases for wrong stitch role/order, missing/duplicate receiving
  edges, altered decision metadata and stale revisions.
- Redraft all exact 17 Polo option cases from S331 and render both faces (34
  revision-bound diagnostic views) through the changed projection/geometry
  compiler. Check body/cap landmarks, unique seam stroke, endpoint joins,
  crossings, layer order, overlap, fill closure and readable output at default
  and collar/sleeve option extremes. Keep every production face held if any
  test fails.
- Recheck applicable colorway overlays and artwork on the diagnostic views.
  Existing callout and label blockers remain held; do not claim readable
  production POM output or exclude a required POM to pass.
- Preserve the 0.25 cm assembly-residual hold. The unchanged 0.68 cm Polo
  residual is expected to keep `technicalFlatLive` from emitting an accepted
  face; diagnostic output is for review only. Do not turn that diagnostic into
  a production acceptance path or alter the solver/residual policy.
- No pattern/cut/stitch/DXF/export-baseline/UI/threshold changes. Verify legacy
  protected export byte identities with focused affected export checks if any
  source or writer is touched; none is expected. Run `npm run
  control-center:test` and `git diff --check`.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`,
  `docs/PROJECT-DECISIONS.md` if implementation detail requires it, and the
  canonical board through validated commands. Do not run the full repository
  global gate until the integrated Epic/PR candidate settles.
- No safe disjoint ownership exists: the role map, source validator, projected
  contours, reflected instances and rendered overlays are coupled. Codex owns
  implementation/integration/review; no external coding agent is used.

## Non-goals and holds

No geometry/stitch solver repair, seam easing or length normalization in the
pattern model, threshold relaxation, label rail implementation, Polo
acceptance, unrelated recipe/hold changes, V03 CAD profile/research, physical
sampling, fit/factory/production-readiness claims, supplier contact, launch
spending, hosted service, G05 tech-pack scope or G09/D04 assembled views.

## Exit record

**Disposition: approved view projection implemented and verified; Polo remains
held.** S353 was completed 2026-10-02 at approximately 03:34 UTC. The source
map now carries the maintainer-approved `G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH`
representation on the exact current Polo `Sleeve-cap ease` stitch. For the
front face, `sleeve.capLeft` is displayed on `front.armhole`; for the back,
`sleeve.capRight` is displayed on `back.armhole`, both underarm→shoulder by
normalized arclength. Each rendered diagnostic face has exactly two receiving
armhole seam paths, no `capLeft`/`capRight` stroke reference, and two exact
receiving-armhole source references. The geometry compiler keeps the receiving
body armhole as the single seam stroke, suppresses the duplicate sleeve-cap
stroke, and binds it to the exact block revision. Colorway fill-only sleeve
closures are projected to the corresponding receiving shoulder endpoints.
Source cut outlines, stitch/ease graph, cap/armhole lengths, rigid solver and
0.25 cm acceptance tolerance remain unchanged. No claim is made that the eased
seam has equal physical length or a source-authored easing distribution.

The exact 17 option configurations were replayed against rebuilt production
Chromium. The live UI returned 0 SVG faces and explicitly held all 34 face
requests: each front/back pair still has the 0.68 cm `Sleeve-cap ease`
endpoint residual above the 0.25 cm limit. The front retains two recurring
POM label-placement issues per configuration (`Finished collar stand height`
and `Stand front rise`, 34 total); the prior back `Sleeve bicep width` label
issue no longer appears in this replay. That improvement does not release any
face. Browser/page/request errors: 0. Current integrated tally remains 56
accepted / 90 held across 73 configurations / 146 faces.

The diagnostic compiler generated 34 exact-revision SVGs and PNGs with an
explicit held/diagnostic banner. Across all configurations there were 0
projection mapping issues, 0 colorway-closure issues, 0 transform issues and
0 SVG-render issues. The retained manifest separates these diagnostic views
from the live UI's fail-closed output; blocked front POM labels are omitted
from diagnostic art and remain recorded as blockers. Manually inspected the
default front/back, maximum stand-height front/back, and collar-leaf-depth
minimum front / maximum back. The mapped armhole is emitted as a single seam
path per mirrored body side with the sleeve cap edge absent; no wrong join,
crossing, or fill-closure gap was visible at that boundary. The neck/shoulder
construction labels remain crowded in the diagnostic images, and front POM
placement remains blocked. These views are diagnostic evidence only, not
accepted production flats.

### Verification

- Focused suites: 92/92 projection, geometry and live tests passed. Changed
  production modules `technical-flat-projection.ts`,
  `technical-flat-geometry.ts`, and `technical-flat-live.ts` each achieved
  100% statement, branch, function and line coverage.
- `npx tsc --noEmit` passed.
- `npm run build` passed; Vite printed the repository's existing large-chunk
  advisory.
- Production Chromium replay: 17 configurations / 34 face requests; 0 emitted
  SVGs / 34 held, 0 browser/page/request errors.
- Diagnostic Chromium output: 34 SVG/PNG pairs; all revision-bound, with 2
  projected seam paths and 2 receiving armhole-source references per face,
  0 sleeve-cap edge references, and no mapping/closure/transform/render
  errors.
- `npm run control-center:test` passes 33/33 after board revisions 1398–1402;
  `git diff --check` passes. No export writer, DXF behavior, protected
  export identity or baseline changed. No full Epic gate applies at this
  intermediate slice.
- Canonical board revisions 1398–1402 link the S353 exit report, production
  hold matrix and diagnostic rendered matrix to G04-V02; the exit comment is
  also recorded against G04-V02, and the exit report is linked to EPIC-17.

Elapsed from 03:03:24 UTC start to approximately 03:34 UTC: implementation
about 11 minutes; focused verification/type/build about 7 minutes; browser
replay and visual review about 11 minutes; documentation/board closeout about
1 minute; external-agent waits 0 minutes; maintainer-decision wait 0 minutes
(the approval was present at the slice start). No safe disjoint delegation
was identified.

MQF-004–007, MQF-011 and MQF-012 were reviewed against these held technical
views; their applicable status remains **To be reviewed** at the G04 output
exit. MQF-015 remains pending the applicable CAD exchange profile/output exit.
This slice did not begin unscoped visual redesign or label remediation.
Post-G17 deferrals remain unchanged.

**Acceptance status:** the approved view-only mapping and same-revision output
checks pass for all 17 configurations. Polo V02 acceptance remains failed:
0/34 production faces emitted, with assembly and front-callout blockers.
All-seven recipe acceptance is unmet, so V03 remains gated.

**Next action:** at S354, refresh Git/board/slice state; read
`docs/planning/UI-ENHANCEMENT-SEQUENCE.md` and
`UI-ENHANCEMENT-EPIC17-NOTE.md` alongside the current admission packet/state/
board; reconcile only recommendations already covered by G04, preflight and
replay the supplied UI enhancement board commands through the validated
command layer, and queue independent UI packages outside G04 without
authorizing their implementation. Preserve G04's existing holds and gates.
