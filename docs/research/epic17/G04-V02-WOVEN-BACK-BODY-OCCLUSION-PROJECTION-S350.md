# G04 V02 — Woven back body-occlusion projection candidate — Slice 350

## Start boundary

- **Started:** 2026-10-02 01:56 UTC.
- **Goal:** continue admitted EPIC-17/G04 through all-seven V02, evidence-backed
  V03, output review, required gates, and safe merge into `origin/main`.
- **Git:** clean `codex/epic-17-g04` at S349 `4919ec3b95610a469a111accb32b8dcb753aff8f`
  (`Slice 349: diagnose Woven back band crossings`). Refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest
  assigned slice is 349; reserve 350.
- **Board:** canonical revision 1357. EPIC-14/15/16 Closed, EPIC-17/G04-V02 In
  Progress, V01 Done, V03 Backlog. S349 exit and its source crosswalk/overlay
  are linked. Integrated status remains 56 accepted / 90 held of 146 faces.
- **Usage:** primary 11% used; weekly 22% (informational).
- **Approval:** maintainer approved the proposed Woven projection and asked to
  continue. This slice evaluates a view-only back-body occlusion candidate
  against that conditional approval; it does not change pattern geometry,
  source stitch topology, or the production mapping unless the exact output
  checks pass.

## Scope

Using the exact S348 production back SVGs and S349 same-option source crosswalk,
test a back-face mask that treats the complete back/yoke body region as
foreground over the sleeve and sleeve-band portions lying inside it. Retain
both mirrored sleeve/band instances, complete geometry and exact
`sleeveBand.top ↔ sleeve.hem` joins; clip only the view's interior display.
Preserve exterior sleeve and band contours. Do not mask other components,
change feature/layer semantics, or claim this projection is accepted until
review shows the cuffs and complete garment remain accurate and readable.

The candidate is a replay-only SVG transformation. Production source is not
edited unless every candidate gate succeeds. A rendered loss of either visible
sleeve/cuff, a false outer silhouette, a remaining crossing, invalid seam or
unreadable output rejects the candidate and preserves all Woven holds.

## Acceptance and gates

- Process all 28 Woven production back SVGs with matching S349 source data;
  verify same revision IDs, exactly two sleeve and band instances, unchanged
  source IDs/geometry outside the mask, and exact source seam joins.
- Confirm the mask uses the same-face closed back and yoke contours and does
  not affect front output or non-sleeve roles.
- Quantify visible exterior sleeve/band contour remaining after the mask and
  inspect default, combined-supported, and yoke-depth extremes in Chromium.
- Manually reject any candidate that hides a sleeve/cuff, masks a component
  that should be visible, or creates a misleading assembled back. Do not use
  an overlay candidate to accept a production face.
- Preserve all-seven acceptance, the integrated 56/90 status until eligible
  complete faces pass, Woven's 0/56 acceptance, all current source/output
  holds, legacy DXF and protected export identity. V03 remains gated.
- Update the packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and board only
  through its validated command layer. Control Center tests and `git diff
  --check` are required. No full repository coverage or build applies to an
  evidence-only replay candidate.
- No safe disjoint delegation is identified. Codex owns the candidate and
  output review. OpenCode remains restricted to Muse Spark 1.3 xhigh in normal
  mode; do not substitute.

## Exit record

### Candidate result

The replay-only candidate takes the closed, same-revision `back` and `yoke`
colorway-contour paths and uses them as a mask against only the `sleeve` and
`sleeveBand` `GARMENT_SILHOUETTE` paths in each production `BACK_FLAT` SVG.
Source pieces, SVG source geometries, source IDs, revision IDs, seam strokes,
front faces, non-sleeve roles, and the production mapping are unchanged.

All 28 existing Woven back SVGs were transformed and loaded in Chromium.
Each had one exact-revision mask built from the closed source body/yoke
contours and six matching sleeve/band silhouette paths; 168 target paths were
checked in total. Chromium reported zero console/page errors. Screenshots for
default, combined-supported, yoke-depth-min and yoke-depth-max were manually
inspected. The contour mask does remove the four orange band-pair crossings,
but it also hides both complete cuff/band shapes. The independently drawn
sleeve-cap seam strokes are on the later `SEAM` layer, are outside this mask,
and still cross over the body as a dashed X. Thus the candidate fails both
visible-sleeve/cuff and no-crossing requirements in every reviewed view.

This is an output failure, not a reason to change the source stitch graph,
shorten or translate a band, suppress the cap seam, or accept a partial view.
Reject the occlusion candidate for production; make no production mapping or
renderer change. Keep all 56 Woven faces held. The candidate's annotated
Chromium images and exact input/output matrix remain diagnostic evidence only.

### Slice exit

- **Disposition:** replay-only proposal test; no production source, pattern,
  stitch graph, projection, exports, or accepted count changed.
- **Evidence:** `S350-woven-back-occlusion/body-mask-matrix.json`,
  `S350-woven-back-occlusion/replay-body-mask.mjs`, and the four images in
  `S350-woven-back-occlusion/candidate-rendered/`. Inputs are the immutable
  production SVGs and matrix retained under `S348-woven-role-token/`.
- **Acceptance:** rejected. Candidate resolves band silhouette crossings by
  hiding both cuffs and leaves cap-seam X strokes across the body. It is not a
  valid all-seven technical flat.
- **Verification:** S350 replay loaded and inspected all 28 exact-revision
  back candidates in Chromium with 0 browser errors; four representative
  PNGs were manually reviewed. All 28 had 2 body/yoke masks and 6 sleeve/band
  silhouette paths per face. Because this slice adds no production behavior,
  a production-module coverage gate, build, export gate, and production app
  replay are not applicable.
- **Status:** integrated tally remains **56 accepted / 90 held** of 146;
  Woven remains **0/56 accepted**. G04-V02 stays In Progress with all-seven
  acceptance; G04-V03 remains gated. MQF-004–007, MQF-011, MQF-012 and MQF-015
  remain `To be reviewed` at their applicable output exits; post-G17 deferrals
  are unchanged.
- **Canonical board:** start evidence/comment are at revisions 1358–1359;
  exit, matrix, default render and yoke-depth extreme are linked through
  validated commands at revisions 1360–1363; exit evidence is linked to the
  EPIC-17 summary at 1364; exit comment is revision 1365.
- **Elapsed:** 8 minutes (01:56–02:04 UTC): implementation 0m in production;
  candidate script and source analysis 4m; focused Chromium verification 2m;
  visual review 1m; docs/board closeout 1m; external-agent waits 0m;
  maintainer-decision wait 0m within this slice (approval was received before
  the slice work).
- **Next action:** begin a separately numbered V02 diagnosis against the
  current 34 held Polo faces, whose 0.68 cm sleeve-cap residual and POM label
  collisions are independent of Woven. Refresh Git, board and usage and reserve
  the next unique slice before work. Preserve all existing holds and keep V03
  gated until every recipe passes the complete V02 output review.
