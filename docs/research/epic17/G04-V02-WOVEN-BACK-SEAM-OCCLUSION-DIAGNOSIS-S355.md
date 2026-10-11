# G04 V02 — Woven back seam-layer occlusion diagnosis — Slice 355

## Start boundary

- Started 2026-10-02 03:57:28 UTC from clean S354 `3a8af3f83b4092321cb7073c853293d7dc3c098f` (`Slice 354: reconcile approved UI guidance with G04`) on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S354 is the highest assigned number; S355 is reserved.
- Canonical board revision 1438: EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog. EPIC-14/15/16 are closed. The UIQ registrations remain Backlog and add no G04 dependency.
- Current integrated baseline is 56 accepted / 90 held across 73 configurations / 146 faces. Woven remains 0/56; Polo remains 0/34 on the unchanged 0.68 cm sleeve-cap residual (0.25 cm limit) and front callout holds. The 24 Trouser front requests, Tee/Fitted defaults, and 24 accepted Trouser backs are covered by the existing integrated evidence; no current evidence authorizes changing their counts.
- Read current `AGENTS.md`, context index, project state, decisions, G04 admission, S353/S354 packets and current board; Woven source/output findings S344, S348–S350 are the immediate technical basis. No additional maintainer decision is needed for a diagnostic-only candidate.

## Scope and question

Diagnose whether a narrowly scoped, view-only seam-layer occlusion can remove Woven BACK_FLAT sleeve-cap seam strokes that currently cross over the body, without hiding or deforming any garment silhouette, sleeve, or cuff/band. The previous S350 candidate masked complete sleeve/band silhouettes with body/yoke color fills; it hid both cuffs and failed, so do not reuse or treat that mask as acceptable.

Build replay-only views from the exact current 28 Woven option configurations and revisions. Test a candidate in which only portions of sleeve-cap or band seam strokes inside a closed, source-bound front-facing body/yoke contour are clipped; keep all piece silhouettes/cut outlines unchanged, keep source joins and the approved two mirrored sleeve and band instances, preserve the band-top-to-sleeve-hem seam, and retain yoke seam strokes on the approved back-facing layer. Compare exact rendered joins, crossings, occlusion endpoints, exposed cuff/band contours, overlap order, labels, and readability. Retain colored annotated views and per-option path/edge accounting.

The distinction to verify is precise: source piece/stitch identities, contour geometry, option transforms and current projection are directly encoded; whether this new body-over-sleeve seam concealment matches the intended flat is a proposed presentation convention unless a pattern-specific reference establishes it. Do not claim source evidence for it. Do not implement the convention in production in S355, even if a diagnostic passes; bring a concrete mapping and effect for maintainer review first.

## Acceptance and gates

- Exercise all 28 exact Woven options / 56 face requests, with special scrutiny on all backs and representative front controls. Keep FRONT_FLAT and every live production view held during this diagnostic.
- Candidate must preserve the complete sleeve and both band/cuff silhouettes, exact same-revision source IDs, exact source stitch joins, yoke ordering, and all current projected primitives. No seam may cross a non-receiving body edge or become detached; no label/mark may be obscured. Record any remaining band-contour crossings exactly.
- Render candidate and baseline through Chromium; retain SVG/PNG inputs and outputs, deterministic per-case collision/occlusion reports, and manually inspect default, combined-option, and yoke-depth extremes. A candidate that masks any cuff, creates ambiguous seam order, or otherwise misleads is rejected.
- No production code, projection metadata, pattern/cut geometry, stitch graph, options, POMs, exports, protected identity, renderer acceptance gate, all-seven V02 criterion, or V03 gate changes. No face is newly accepted. No full suite/build/export gate is due for a replay-only experiment; run focused analysis checks, Control Center tests, and `git diff --check`.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical board through its validated command layer. If a candidate suggests a new semantic convention, preserve it as a proposal and request maintainer approval before any production implementation.
- No safe disjoint task is identified: source identity, exact path clipping, option transforms and visual review are coupled. Codex owns the analysis. No OpenCode substitute or external agent is needed.

## Non-goals and holds

No garment geometry or stitch repair; no shortened/moved cuff; no suppressed silhouette or cut edge; no translation or rescaling; no change to the source stitch graph; no assembly solver or 0.25 cm threshold change; no Polo label or ease work; no G05 tech-pack or G09/D04 assembled-view scope; no CAD/V03 work; no physical sampling, fit/factory/production-readiness claims, supplier contact, spending, or hosted service. Preserve all 56 Woven holds and all 34 Polo holds.

## Exit record

### Findings

- **Directly encoded:** the current same-revision BACK_FLAT output identifies
  one compound mirrored `sleeveBand` silhouette path
  (`pattern:woven-shirt:role:sleeveBand`, feature `silhouette`) containing
  both band instances. Its source `top` remains joined to each sleeve's
  `hem`; S348's per-option seam audit records maximum endpoint residual
  `2.864289338439558e-14 cm`. The source marks both `bandFold` instances.
  Body and yoke colorway fill contours are also explicit in the exact-revision
  SVG. No source geometry or stitch edge changed after those outputs.
- **Output measurement:** Chromium rechecked all 28 Woven BACK_FLAT SVGs from
  S348 against each case's exact matrix revision. It sampled the compound band
  fill on a 0.1 cm grid and its contour at 0.08 cm; every sample inside the
  sleeve-band fill also falls inside the union of the back/yoke colorway
  fills. Area coverage is exactly 1.0 in all 28/28 backs (min 1.0, max 1.0),
  and boundary coverage is retained per case in
  `S355-woven-seam-occlusion/band-boundary-coverage.json`.
- **Candidate disposition:** masking only seam strokes cannot remove the
  crossing band contours because those crossing outlines/fills are the
  `sleeveBand` GARMENT_SILHOUETTE primitive, not a seam primitive. Placing the
  body/yoke fill above that entire mapped band fill clips the complete pair of
  bands in every current back (100% measured area), which removes the visible
  cuffs. S350's broad mask additionally left the separate `bandFold` marks and
  other seam strokes visible as an X. No occlusion candidate passes. This is a
  view-mapping conflict, not a stitch-join defect.
- **Evidence class:** source piece identities, edge roles, mirrored
  multiplicity, fold marks and joins are encoded; the intended overlap order
  of the band against the back body is not established by these source
  fields. The approved yoke layer and normalized-arclength mapping do not
  authorize suppressing the complete band or changing its visible instance
  placement. No new construction reference was needed for this measurable
  rejection. Any alternative sleeve/band view transform is a proposed display
  convention and needs a concrete separately reviewed candidate before
  production use.
- **Rendered review:** Chromium generated exact-revision annotated SVG/PNG
  pairs for default, combined-supported, yokeDepth-min and yokeDepth-max.
  Each has exactly two body/yoke fill contours and one compound mirrored band
  silhouette; all four loaded with zero browser errors. I manually inspected
  all four: both full bands form the same crossed X, and yokeDepth changes do
  not provide a non-crossing pose. The annotated files are in
  `S355-woven-seam-occlusion/annotated-views/` with a source/revision manifest.
- **Disposition:** diagnostic only; no production projection, rendering,
  pattern/stitch data, callout, export, threshold, or accepted count changed.
  All 56 Woven faces remain held; the integrated 56 accepted / 90 held tally
  and all-seven V02 / gated V03 criteria remain unchanged.
- **Verification:** `measure-band-containment.mjs` reproduces all 28 exact
  revisions and 100% compound-band area coverage by the body/yoke fills;
  `render-band-containment-overlays.mjs` reproduces the four Chromium views.
  `npm run control-center:test` passes 36/36, including the S355 board-link
  assertion; `git diff --check` passes. No
  production modules changed, so no changed-module coverage, build, or
  protected-export gate applies. No current view became accepted.
- **Board:** S355 start evidence/comment were added at revisions 1439–1441;
  exit evidence/comment were added at 1442–1444 through the validated command
  layer. The S355 packet is linked from both G04-V02 and EPIC-17.
- **Elapsed** 03:57:28–04:07 UTC, approximately 10 minutes: implementation in
  production 0m; focused source/output analysis and scripts 5m; rendered
  output review 2m; durable packet/context/board and checks 3m; external-agent
  waits 0m; maintainer-decision time 0m. No safe disjoint work was delegated.

**Next action:** S356 will investigate concrete source-preserving view
transforms for the two Woven sleeve/band instances against their exact hem and
band-top joins, with explicit instance identity and path overlays. It may
produce proposals only; preserve every Woven hold and obtain maintainer
approval before any new production semantic mapping. Keep Polo held and V03
gated.
