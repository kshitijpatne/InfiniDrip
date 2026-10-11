# G04 V02 — Woven back sleeve/band pair crossing diagnosis — Slice 349

## Start boundary

- **Started:** 2026-10-02 01:28 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02 acceptance, documented V03 exchange proof, integrated gates, PR, safe merge and required deployment verification.
- **Git:** clean `codex/epic-17-g04` at S348 `02c467ae578b891558f8d8988d1cdf2b0a9e6ae7` (`Slice 348: resolve Woven source role identity`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest active/history slice is 348; reserve 349.
- **Board:** canonical revision 1351. EPIC-14/15/16 Closed; EPIC-17/G04-V02 In Progress; V01 Done; V03 Backlog. S348 exit/replay/join/overlay evidence is linked. Integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces.
- **Usage:** primary 9% used; weekly 22% used (informational); ordinary work allowed.
- **Trigger:** S348 fixed the exact source-role substring collision. All 112 rendered sleeve-band top edges now join their option-specific source sleeve hems within 0.000063 cm, but every one of the 28 back views has four proper crossings between the approved mirrored band contours. All Woven faces remain held.

## Exact diagnostic scope

1. Reconstruct the Woven sleeve, sleeveBand and body/yoke source pieces, named edges, authored marks, stitch graph and current projection metadata from the same pattern/options. Trace the exact stitched sleeve-cap interval and `sleeveBand.top ↔ sleeve.hem` interface separately.
2. Compare the current back transforms and both reflected instances to the source contour geometry for default, combined options and yoke-depth extremes; quantify crossing locations and contour/area overlap from the rendered S348 SVGs and same-option source blocks.
3. Determine whether source topology uniquely specifies which physical sleeve instance attaches to each back side and whether an already-approved view-only mapping can remove the crossing while retaining two mirrored sleeves/bands, exact seam joins, yoke layer order, and unchanged pattern/stitches.
4. Render annotated alternatives only as evidence. For every proposal, state exact roles/edges, face orientation and multiplicity, current or candidate transform/order, source facts that support it, assumptions not established by the source, and effects. Do not mutate production mapping or implement an unapproved candidate in this slice.
5. If no unique source-backed view correction exists, prepare a small set of concrete mutually exclusive view-only choices and recommendation for maintainer approval. Continue independent V02 work outside this blocker only if it does not depend on this decision.

## Required gates and non-goals

- No pattern geometry, source stitch graph, option behavior, accepted-face tally, or production projection changes. No weakening of all-seven acceptance, no new recipe or G05/G09/D04 scope, no V03 receiver/profile, physical sampling, supplier contact, launch cost, hosted service, or fit/factory/production-readiness claim.
- Retain a reproducible source-to-output coordinate report and colored annotated views. Validate all 28 existing Woven options, preserve same-revision identity, and record the exact crossing/overlap residuals and any unproven semantics.
- Since this is diagnostic-only, no full production replay, full repository coverage, or build/export gate is required unless its findings specifically require new output or production implementation. Any later mapping change gets a new slice and must run 100% changed-module coverage, build/protected exports as applicable, full 28-option / 56-face production replay, and manual inspection.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical board through its validated command layer. MQF-004–007, MQF-011, MQF-012 and MQF-015 remain review checks at applicable output exits; keep `To be reviewed` and preserve post-G17 deferrals.
- No safe disjoint coding/research task is identified; Codex owns source and transform diagnosis. OpenCode remains limited to Muse Spark 1.3 xhigh in normal mode; no substitution.

## Exit record

### Findings and decision boundary

**Directly encoded by the current pattern source:** `sleeve.onFold` and
`sleeveBand.onFold` are both false. The sleeve has `capLeft`, `capRight`,
`sideRight`, `hem`, and `sideLeft` edges. The band has `top`, `sideRight`,
`bottom`, and `sideLeft`, plus the authored `bandFold` mark. The exact source
stitch is `sleeveBand.top ↔ sleeve.hem`; the other relevant stitch is the
aggregate `Woven sleeve-cap ease` interface. The authored band top is drafted
to the same length as the sleeve hem. The recipe’s existing topology and
projection source contain no per-instance back cuff spacing or alternate
back-side pose.

**Previously approved view decisions:** use two mirrored sleeve instances and
two full band instances; keep the approved normalized-arclength sleeve-cap
transfer, the source-joined band top, and the yoke on the back-facing seam
layer. These decisions are view-only and preserve the pattern revision, cut
geometry and stitch graph. Their approval is conditional on joins, crossings,
overlap and readability passing output review.

**Verified in this slice:** the exact option-specific source seam is preserved
for all 28 Woven configurations and both faces (56 faces). Maximum source
endpoint residual is `2.864289338439558e-14 cm`. The production-rendered pair
has zero contour intersections on all 28 fronts and four proper intersections
on each of the 28 backs. For the default back, intersections are `(0,
23.665080)`, `(-1.858296, 21.123982)`, `(1.858296, 21.123982)`, and `(0,
18.582872) cm`; the yoke-depth extremes and remaining options show the same
four-intersection failure. The source crosswalk includes source edges,
same-revision transforms, stitch references, pair mappings, and per-face
crossings. Four annotated production-derived back views show the conflict.

**Unresolved:** the source establishes which seam edges join, but does not
establish a different physical-instance pose or cuff spacing that would move
the two complete band contours apart while preserving both exact sleeve-hem
joins. No candidate transform is source-unique or verified in this slice.
Do not infer that detached translation, shortened bands, suppressed edges, or
a changed instance count represents the garment. Keep all Woven faces held.
The maintainer's approval of the approved projection does not waive its
conditional rendered-output checks.

## Slice exit

- **Disposition:** diagnostic only; no production mapping, source geometry,
  stitch graph, option, export, or accepted-face changes. Integrated tally
  remains **56 accepted / 90 held** of 146 faces. Woven remains 0/56 accepted.
- **Evidence:** `S349-woven-back-band-pair/source-crossing-crosswalk.json`,
  `S349-woven-back-band-pair/diagnose-source-crossings.test.ts`,
  `S349-woven-back-band-pair/annotated-views/`, and the production SVG/matrix
  and seam audit retained in `S348-woven-role-token/production-replay/`.
- **Focused verification:** source-crosswalk test 1/1 passes and reproduces
  all 28 configurations / 56 faces, exact source joins, and the 28 back-pair
  crossing results. This is a documentation/evidence slice; no changed
  production module required a coverage gate, build, export gate, or second
  production replay.
- **Status:** G04-V02 remains In Progress and retains the all-seven recipe
  acceptance criterion; G04-V03 remains gated. MQF-004–007, MQF-011, MQF-012,
  and MQF-015 remain `To be reviewed` at their applicable output exits. Their
  post-G17 deferrals are unchanged.
- **Canonical board:** validated exit, crosswalk, and overlay evidence is
  linked to G04-V02 at revisions 1353–1355; exit evidence is linked to the
  EPIC-17 summary at revision 1356; the exit comment is revision 1357.
- **Next action:** continue with a separately bounded V02 source/output
  diagnosis for the next held recipe or face, after refreshing Git, board,
  usage and slice number. Do not change this Woven mapping or accept any Woven
  face until a concrete mapping passes all 28 options, both faces, seam joins,
  crossings, overlap and readability. Do not begin V03 before all seven
  recipes pass V02.
- **Elapsed:** 21 minutes total at this boundary (01:28–01:49 UTC):
  implementation 0m; focused source analysis and test 8m; visual review 5m;
  durable records and board 8m; external-agent waits 0m; maintainer-decision
  wait 0m within this slice (the projection approval was received before this
  resumed work).
