# G04 V02 — Woven collar and back-stroke source diagnosis — Slice 347

## Start boundary

- **Started:** 2026-10-02 00:42 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, V03 exchange proof, integrated gates, PR, safe merge and any required deployment verification.
- **Verified Git:** clean branch `codex/epic-17-g04` at S346 `dacb77422a485244921a5b79e92caaf449e8df53` (`Slice 346: anchor Woven collar flats and POMs`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest unique slice is 346; reserve 347.
- **Board:** canonical revision 1326. EPIC-14/15/16 Closed; EPIC-17 and G04-V02 In Progress; V01 Done; V03 Backlog. S346's exit, review, replay, coverage and build evidence are linked. Integrated count remains 56 accepted / 90 held across 73 configurations and 146 faces.
- **Usage:** primary 5% used; weekly 21% used (informational); ordinary work allowed.
- **Previous boundary:** S346 source-backed Woven POM targets and approved both-face collar fill closures compile. Production replay emits 56 Woven SVGs with zero compiler/browser errors, but manual review rejects all 56: front collar forms are detached/crossing and long back strokes cross the torso. No Woven face was accepted. Source cut geometry, source stitches, POM values/tolerances and protected export identities remain unchanged.
- **Packet:** `docs/research/epic17/G04-V02-WOVEN-COLLAR-BACK-CROSSING-DIAGNOSIS-S347.md`.

## Exact scope

Diagnose only the visible Woven assembly defects in the production output from
S346:

1. On FRONT_FLAT, trace the source outlines and transforms for
   `outerStand`, `upperCollar`, and `underCollar`, the approved CB-to-CF
   exterior transfer landmarks, their output face orientation, and their layer
   and overlap order. Identify the exact entity/role relationships responsible
   for detached and crossing contour segments.
2. On BACK_FLAT, identify each long crossing stroke by exact emitted entity
   identity, source role, source edge/mark, transform, and layer. Compare it
   with its source topology and the already-approved view metadata. Do not
   assume the collar causes these strokes without source/entity trace.
3. Produce annotated views from the exact S346 production SVGs and the current
   same-revision pattern source. For every candidate projection, classify its
   basis as source-encoded, already approved, or a new design decision. State
   which exact joins/overlaps it would display and which potential source
   semantics remain unknown.

This is a diagnosis and decision packet. Do not alter production mappings,
pattern geometry, source stitches, role multiplicity, POM formulas/anchors,
options, assembly tolerances, export code or any unrelated recipe in S347.
The user has approved prior specific projection decisions, including the
normalized collar exterior transfer; that approval does not accept the current
render or imply an unrecorded placement/overlap decision. If the source and
existing approved mapping do not uniquely determine a correction, preserve the
hold and prepare a concrete decision request; do not silently select a new
semantic projection.

## Required evidence and exit gates

- Inspect exact default plus the combined-option and relevant min/max S346 SVG,
  screenshot, result JSON and revision. Link emitted IDs back to source role,
  edge/mark, source transform, face and layer order.
- Create/review role-colored overlays for both faces and a written edge/entity
  inventory. Retain source paths, transform coordinates, overlay views and
  reproducible script under `docs/research/epic17/S347-woven-crossings/`.
- Distinguish visible crossings from inferred cause. If no unique fix exists,
  make no production change and record affected acceptance criteria as still
  failed. No full replay is required for a no-code diagnostic slice.
- Any later implementation slice must have its own reserved packet and must
  run focused tests at 100% statement/branch/function/line coverage for every
  changed production file, then the 28-option/56-face production Chromium
  replay and manual review. Preserve source geometry, stitch graph, approved
  Woven collar/sleeve/base-seam/placket decisions, protected exports and every
  other hold unless separately authorized.
- Review MQF-004–007, MQF-011, MQF-012 and MQF-015 at the applicable output
  exit; retain **To be reviewed** and post-G17 deferrals while complete
  acceptance remains unmet.
- At exit record source findings, annotated/rendered evidence, any design
  decision still needed, focused checks, board revision, unchanged all-seven
  acceptance state, and implementation/verification/replay-review/docs,
  external-agent and maintainer-decision elapsed time separately.

## Non-goals and ownership

No broad UI changes, new garment recipe, G05 tech-pack content, G09/D04
assembled side/oblique/inside views, V03 CAD receiver/profile work, physical
sampling, supplier contact, launch spending, hosted service or
production-readiness claim. Codex owns the coupled source trace and final
review. No safe disjoint low-risk work was identified, so no external coding
agent is assigned and OpenCode is not used.

## Exit record

### Source and entity findings

- **Directly encoded Woven role order:** `G04_TECHNICAL_FLAT_MAPPINGS` lists
  `sleeve` before `sleeveBand` on both faces. The drafted stitch is exactly
  `sleeveBand.top` to `sleeve.hem`, without ease; the band is drafted at the
  sleeve-hem length, so these interfaces have equal length.
- **Source output identity defect:** `technicalFlatPrimitiveRole` currently
  finds a role using substring tests (`sourceId.includes("role:<roleId>")`).
  The emitted source ID `pattern:woven-shirt:role:sleeveBand` therefore
  matches the earlier role token `role:sleeve`. Since `sleeve` precedes
  `sleeveBand`, both `component:sleeve:outline` and
  `component:sleeveBand:outline` are placed with the sleeve transform. This is
  an exact identifier-prefix collision in code, not an inferred garment
  convention.
- **Measured consequence:** for the standard default Woven draft, the correct
  assembled back transforms are sleeve offset `(8.084063, -15.072511)` at
  `53.822233°` and band offset `(7.970955, 34.564867)` at `-126.177767°`.
  The band's source `top` under its own transform has endpoints
  `(7.970955, 34.564867)` and `(-13.869867, 4.698858)`, exactly the transformed
  endpoints of `sleeve.hem`. The emitted S346 back band instead starts at
  `(8.0841, -15.0725)` and runs toward `(29.9249, 14.7935)`, matching the
  sleeve transform. This misplaced band is the purple
  `flat:woven-shirt:BACK_FLAT:component:sleeveBand:outline` and
  `:approved-view-pair` in the retained overlay. The same source-role matcher
  orders `sleeve` before `sleeveBand` on FRONT_FLAT, so the defect affects both
  faces and is configuration-independent. The overlay and exact transform
  evidence are in `docs/research/epic17/S347-woven-crossings/`.
- **Other back crossing:** the orange
  `flat:woven-shirt:BACK_FLAT:component:sleeve:outline` and its approved-view
  pair also cross the torso. This is a separate sleeve-role placement result;
  the role-token collision does not explain it. Keep the S321/S344 approved
  mirrored sleeve mapping and S345 eased-cap display intact while the band
  identity fix is verified, then re-review the residual sleeve contour.
- **Collar facts:** on the default source, `outerStand.neckline` is a straight
  25.7772 cm edge. The exact stitch relates it to the two curved body edges
  `front.neckline` and `yoke.neckline` whose lengths sum to that value. The
  rigid solver produces the S346 front outer-stand/upper/under placement at
  offset `(21.139570, -5.510094)`, rotation `141.340192°`; those three roles
  share that transform because their source stitch interfaces have matching
  lengths. The front/back screenshots and source-colored overlays show the
  detached/crossing collar contours. Length equality does not give the straight
  source edge the same shape as the two curved necklines, and the prior
  approved body-neckline single-seam display suppresses only the duplicate
  stroke; it does not change role placement. No role-name collision identifies
  or fixes that separate collar assembly problem. Preserve the collar holds.

### Decision and next gate

No new design decision is needed to correct the exact role-token collision:
source role IDs are colon-delimited identifiers, the current implementation
already selects a unique source role, and S321 explicitly approves the
two-instance sleeve/band view. A follow-up implementation should compare role
tokens exactly (including `role:<id>` at end-of-ID and mark/dart forms), then
prove that `sleeveBand` uses its own transformed top edge and remains joined to
`sleeve.hem`. It must not silently accept the remaining sleeve crossings or
the detached collar. This diagnosis slice makes no production change.

All 56 Woven candidates remain unaccepted; integrated count is still 56
accepted / 90 held over 73 configurations / 146 faces. All-seven V02 remains
unmet and V03 remains gated. MQF-004–007, MQF-011, MQF-012 and MQF-015 remain
**To be reviewed** at their applicable exits; post-G17 deferrals are unchanged.
No physical fit, factory acceptance, or production-readiness claim is made.

- **Focused diagnosis:** a temporary Vitest probe exercised the actual default
  draft and exact role assembly, recording both face transform/edge endpoints
  in `role-transforms-standard-default.json`. The production Chromium SVG
  entity IDs and full screenshots are retained with the replayable overlay
  script. The original 28-option/56-face production matrix remains the source
  of emitted views; no redundant replay or full gate was run for this
  diagnostic-only slice.
- **Board:** S347 start, exit, review and source-transform evidence are linked
  to G04-V02 and the EPIC-17 work card/Epic record through validated commands
  at canonical board revision **1341**. `npm run control-center:test` passes
  33/33, canonical board schema validation passes, and `git diff --check`
  passes. EPIC-17/G04-V02 remain In Progress; V01 Done; V03 Backlog.
- **Elapsed (2026-10-02 00:42–00:59 UTC; approximately 17m):** code/source and
  entity trace ~5m; overlay generation and visual review ~5m; source-transform
  probe and interpretation ~2m; durable records/board closeout ~5m; production
  implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** close S347, reserve S348, and implement only the exact
  source-role token match. Require focused 100% coverage, build/export
  verification and a new 28-configuration/56-face production replay. Reinspect
  all band/sleeve joins, crossings and callouts. Keep all 56 Woven holds until
  the collar and independent sleeve geometry also pass manual review.
