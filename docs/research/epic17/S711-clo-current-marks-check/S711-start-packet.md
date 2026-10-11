# EPIC-17 / G04 V03 — S711 current-source mark-retention check

## Verified start

- Start: 2026-10-11 02:35 UTC from clean S710 commit `93849c55554c565bb1052a271868dfd267f2632f`, branch `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Slice 710 is highest; reserve S711.
- Canonical board revision 4171. G04-V01/V02 Done; G04-V03 and EPIC-17 In Progress. Goal stays active. Ordinary use was allowed at 88% primary-window use.
- Only pre-existing untracked repository files are the two S700 coverage diagnostics. Leave them untouched; include them in final cleanup inventory.
- Exact current candidate: `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-buttonhole-cross.dxf`, 285,209 bytes, SHA-256 `734E8902D798D0D6FD4F911AF0902FF4C8EE1503B45BE3AABB6F649438FAE1DF`.

## Objective

Use the already-installed and already-tested CLO 2026.1.310 DXF-ASTM route once on the exact current S708 source. The specific question is whether the source correction from point-only buttonhole marks to centered visible cross lines (S705) now preserves those three marks through the same route that previously lost the three points. Also record returned piece/layer/unit identity if present, and compare contours only as a diagnosed result.

This is one source-changed, same-route comparison, not a search for a new receiver, format, or setting. CLO's prior geometric failures remain known; this slice cannot qualify CLO or clear V03. The test is justified only for the new source encoding's specifically measured mark-loss cause.

## Fixed controls and stop rules

- Reuse S703's exact DXF-ASTM route and recorded controls: centimeters, zero rotation, no automatic distribution, no curve-point optimization, no geometry simplification, no notch relocation; current Polo M only; export once as DXF-ASTM in centimeters, no grade synthesis, same notch duplication choice.
- Keep input, return, hash records, screenshots/render and reports under `C:\G04-CAD-Interchange\S711-clo-current-marks-check\` only. Never overwrite S703 or S708 evidence.
- Do not change geometry, acceptance, tolerance, output baselines, protected export identities, seven-recipe/options/grade scope, or any hold. No second attempt or setting/encoding variation.
- Record exact UI selections, warnings/errors, hashes and each measured fixed gate. The targeted decision is limited: do the three source-centered buttonhole crosses survive with correct anchor and mark layer? If not, identify the exact source entity/returned entity mismatch. Also record CUT/SEW geometry, unit declaration, names/instances and semantic layers from this same output to avoid losing useful evidence. Known contour failures are not excused.
- No full seven-recipe receiver matrix unless profile eligibility and a representative current-source pilot meet every fixed prerequisite. No conformance claim from the `DXF-ASTM` menu name.

## Verification and closeout

- Check exact source hash before UI operation and exact returned-file hash afterward.
- Compare with S703's saved same-route output and S710's manifest audit; render/reopen only as warranted by the actual returned file and existing stop gates.
- Record focused verification and output review, implementation time (expected zero), app-operation/diagnosis time, maintainer-decision time (zero), and external-agent waits (zero) separately.
- Update this packet, `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, the admission packet and validated board. No product code change is planned; no full repository gate is due for this evidence-only slice.

## Non-goals

No app install, app switch, new profile/format/setting, broad matrix, source geometry repair, threshold relaxation, V03 gate reclassification, physical-fit/factory claim, cleanup before final candidate, PR, or merge in this slice. The Epic goal remains active through implementation, final necessary-file cleanup, integrated full gates, PR merge, ancestry, deployment and production end-to-end verification.
