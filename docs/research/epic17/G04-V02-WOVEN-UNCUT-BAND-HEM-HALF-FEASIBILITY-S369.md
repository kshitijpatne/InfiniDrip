# G04 V02 — Woven uncut-band to back hem-half feasibility — Slice 369

## Start boundary

- Started 2026-10-02 12:29:44 UTC from clean S368 commit `9ea4e8a7e528ca818b8627c299db75bfde90a2d6` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 368; S369 is reserved. Canonical board revision is 1709; EPIC-17/G04-V02 are In Progress, V01 Done, V03 Backlog.
- The existing EPIC-17 goal remains active and needed. Ordinary usage is allowed (primary 22%, weekly 53%). The maintainer reaffirmed Polo's 0.25 cm residual gate; no threshold/ease change is in scope.
- Integrated acceptance remains 56 accepted / 90 held across 73 configurations / 146 face requests. Keep all 56 Woven and 34 Polo faces held pending every required gate.

## Objective and bounded candidate

Evaluate the S321-approved **uncut** Woven sleeve-band view on the actual BACK sleeve run after S367 showed why cropping the band is not authorized and does not clear crossings. Rebuild the exact 28 supported options / 56 request identities at `live-draft:woven-shirt:14:14`. Preserve the two mirrored sleeve and band instances, existing back-facing yoke seam layer, source fold mark, piece IDs and stitch graph.

The diagnostic transfers the complete, uncut `sleeveBand.top[0,1]` to the exact BACK `sleeve.hem[0,0.5]` by normalized arclength, with the paired full band outline and `bandFold` carried from the source piece by the same source-bound correspondence. The view transform does not crop, re-stitch or alter cut geometry. Record any resulting length distortion and do not suppress or redraw the hem/shared seam merely to hide a conflict. Orient the band extension only from the mapped receiving sleeve's exterior side; preserve its authored outline and profile.

This is a diagnostic feasibility test of the existing conditional S321 approval, not a new pattern or physical construction fact. Source geometry provides the edge roles, paths, lengths, fold mark and exact same-revision stitch; normalized transfer and face-specific instance placement are approved view conventions. If mapping the complete band to the half-run makes its depiction distorted, crossed, overlapping or unreadable, the conditional approval has not passed and all Woven faces stay held. No production implementation or face acceptance is authorized in S369.

## Evidence and acceptance gates

- Reconcile all 28 current Woven configurations, 56 front/back request identities and exact source/output revision; preserve existing front holds and classify every back candidate as diagnostic/held.
- Record source stitch identity and residual separately from the view-mapped residual; retain full source edge intervals, orientation, lengths, instance transforms, reflection axis, paired edges and fold-mark mapping.
- Quantify normalized transfer length/scale, endpoint joins, self-intersections, left/right band intersections, sleeve/body/yoke crossings, overlap/occlusion, silhouette continuity and fold-mark placement for every option.
- Render annotated Chromium evidence for default, yoke-depth minimum/maximum, sleeve-band-depth maximum and combined-supported options. Inspect uncut band visibility, marks, center seam, clipping/page bounds, labels and any artificial or misleading edge.
- A passing diagnostic only supports a separately reviewable implementation step under the existing approval; it does not accept a face. If any option fails, retain all holds and state exact conflicts. Do not weaken the Polo 0.25 cm gate, all-seven V02, or V02-before-V03.

## Non-goals and ownership

No production renderer/projection or assembly change; cut geometry/stitch graph mutation; option, threshold, POM, acceptance, exporter, DXF or protected identity change; V03/CAD work; broad UI; G05/G09 scope; new recipes; physical sampling; supplier contact; launch costs; hosted service; fit/factory/readiness claim. No safe disjoint agent work exists because source mapping, topology and rendered output checks are coupled; Codex owns the diagnostic. OpenCode is not used. The settled Epic/PR candidate still requires the full global 100% coverage/build/export/render gates.

## Exit record

**Disposition: failed; retain all affected holds.** The full `sleeveBand.top[0,1]` is 37 cm while the receiving BACK `sleeve.hem[0,0.5]` run is 18.5 cm. Mapping the full band to that exact half-run preserves a zero mapped join residual only by compressing the displayed band to a 0.5 length ratio. Across all 28 configurations, the uncut outline has four self-crossings per instance (112 total), and the mirrored pair crosses once (28 options / 28 crossings). The source stitch remains valid (maximum full-join residual `2.5618982671915017e-14 cm`); it does not validate this distorted view projection. Band-to-sleeve and tested body/yoke crossings are zero, but do not offset the band’s own and paired crossings.

All five selected Chromium views (default, yoke-depth min/max, sleeve-band-depth max, combined-supported) have zero browser errors and were manually inspected. Each shows the two uncut bands as a central X; the sleeve-band-depth maximum view also fails. The output is visibly misleading and fails the proportional depiction, crossing and readability conditions on every option. The focused diagnostic regression passes 2/2 and asserts exact revision/configuration coverage and the failure counts. Setup corrections and final inspection are recorded in `S369-woven-uncut-band-feasibility/S369-verification-notes.md`.

No production renderer, projection, geometry, stitch graph, exporter, option, or acceptance change was made. Keep all 56 Woven and 34 Polo faces held; integrated acceptance remains 56 accepted / 90 held across 73 configurations / 146 face requests. The maintainer reaffirmed the Polo 0.25 cm residual gate during this slice; it remains unchanged. Preserve all-seven V02, V02-before-V03 and every existing hold. No physical fit/factory claim is made.

Evidence: `S369-woven-uncut-band-feasibility/uncut-band-hem-half-matrix.json`, five SVG/PNG pairs in the same directory, `uncut-band-hem-half.test.mjs`, `focused-test.log`, `control-center-test.log`, and `S369-verification-notes.md`. Validated S369 start evidence/comments end at revision 1713; exit evidence and comments end at revision 1727. The board remains EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Control Center tests pass 42/42 after board replay; `git diff --check` passes. No full repository coverage/build/export gate applies because no production files changed; full integrated gates remain required before PR merge.
