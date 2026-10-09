# EPIC-17 / G04 V03 — CLO helper recovery and periodic pre-export check — Slice 597 start

## Verified start

- Started `2026-10-09 08:53:13 UTC` on `codex/epic-17-g04` from S596
  `79642412076223663b24790d821c1f6cf93f4b7a`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S596 is the highest slice; S597 is uniquely reserved.
- Board revision `3518`: EPIC-17/G04-V03 In Progress; G04-V02 Done. All V03
  gates, all-seven coverage and the fixed `0.001 cm` geometry criterion stay
  unchanged.
- CLO 2026.1.310 remains running. Written product-development use and local
  file processing authorization are confirmed. Any S597 evidence goes only in
  `C:\G04-CLO-DXF-Exchange\S597-clo-helper-recovery\`.

## Bounded objective

S596 found that accessibility reported a hidden Export DXF dialog while its
simultaneous screenshot showed the 2D canvas. S597 first resets only the
computer-use JavaScript helper, not CLO, then selects the existing CLO window
again and takes one new screenshot/accessibility observation. Continue only
if those surfaces agree and any modal is independently visible/targetable.

If coherent, run one allowlisted, read-only `GetPatternLineInfo(index)` query
for indexes 0–8 against the already-open S595 post-import/pre-export scene,
without import/export, project save, settings change or pattern mutation.
Compare captured lines in the direct millimeter frame to the hash-pinned S536
R2000 contours used by the earlier round-trip analyses. S595's separate
source-exact proof uses its pinned R12 source; S597 does not assume those
files are byte-identical or that this API exposes or identifies SPLINE
entities. No fitted transform, implicit role mapping or inference about
CLO's internal stage.

If the state remains contradictory, stop UI input and record the concrete
helper result; do not attempt another way to dismiss or operate a hidden
dialog. No file/pattern/project mutation is permitted in either outcome.

## Focused checks and limits

Pin the saved project/candidate hashes; inspect the allowlisted capture
script; validate raw output schema, all geometry results, screenshot/state
coherence and C:-only paths. Treat source-proximity matches as diagnostic
screening, not the V03 contour gate or CUT/SEW-role proof. Update the V03
matrix only if a measurable new result warrants it, never to relax
acceptance. At exit run validated board
preflight/CLI replay, Control Center tests, script syntax and `git diff
--check`. No production code changes are expected; full repository gates
remain reserved for the settled Epic/PR candidate. Codex owns this single
app-state inspection; no independent safe delegation exists.

## Single next action

Use one fresh, coherent CLO state, then run the allowlisted query once. Stop
before input if accessibility and screenshot disagree.
