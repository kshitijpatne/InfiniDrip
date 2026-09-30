# G04 V02 integrated rendered-output review — Slice 284

## Start, authority and current state

- **Goal:** continue the admitted EPIC-17/G04 V01 → V02 → V03 sequence through
  required output evidence, safe merge and deployment verification.
- **Slice start:** 2026-09-30 05:24:03 UTC.
- **Starting Git:** clean at S283 commit
  `337ed72640500ef490a4bb3346cb34b09ed8d80d`
  (`Slice 283: implement source-backed skirt face segments`) on
  `codex/epic-17-g04`. `git fetch --prune origin` completed; refreshed
  `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor.
  S283 is the highest assigned slice; S284 is uniquely reserved.
- **Starting board:** canonical `ops/control-center/data/board.json`, revision
  437; validated S284 packet/start comment at revisions 438–439. EPIC-17 In
  Progress; G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog.
  `E-G04-S283-EXIT` is linked to G04-V02 and EPIC-17.
- **Authority/dependencies:** admitted V02 all-recipe output acceptance,
  roadmap G04 gates, S274's bounded option matrix contract, S281 source/visual
  dispositions and S283's source-backed Skirt segment implementation and
  retained six-view evidence. Maintainer explicitly authorized source-backed
  view metadata; no source supports the held sleeve/collar/cycle contours by
  that authorization alone. Re-read the S283 exit packet, canonical board,
  `PROJECT-STATE.md`, decisions, Architecture and mapped manual findings.
- **Blocking facts:** Polo/Woven collar face split still lacks a specific
  construction reference. Tee/Fitted sleeve exterior contours/instances,
  Trouser joins, Woven vent edges and detail anchors remain source-boundary
  questions. Keep affected faces visibly held. No decision is required to
  preserve those holds. Any newly found source-supported correction gets its
  own numbered slice and admission estimate update before implementation.

## Scope and exit criteria

Rerun the existing production Chromium matrix for all seven recipes, defaults,
all 32 declared option fields at both endpoints, and the two existing
source/test-backed combined cases: 73 configurations and 146 face requests.
Retain case inputs, revision IDs, every accepted SVG, visible hold text,
representative PNGs, parser/layout/label/POM checks and browser/page/remote
request diagnostics. Compare emitted/held faces with S281 and S283. Manually
inspect every emitted default face and representative option/overlay output;
parser success or a visible hold is not visual acceptance. Review output
against the G04 V02 roadmap criteria and MQF-004–007, MQF-011 and MQF-012;
review MQF-015 only if V03 output is in scope (it is not in S284). Keep mapped
findings statuses `To be reviewed` at the applicable exit, and retain every
post-G17 deferral.

Acceptance requires all seven recipes' required front/back views to be
coherent, proportional, construction-aware, same-revision, topology-valid,
readable and supported by source mappings; options and overlays must not imply
unsupported geometry; POM labels/leaders must target represented geometry.
Every unsupported combination must visibly explain its hold. If any criterion
fails, V02 stays In Progress and the report identifies the exact role/source
gap and one gated next slice. Preserve legacy DXF and every protected export
byte identity.

## Gates, constraints and non-goals

- Production Chromium 73-configuration/146-face matrix, retained rendered
  evidence, parsed geometry/revision/labels/POM/holds and zero browser/page/
  remote errors; manual review of all emitted defaults and representative
  changed options/overlay views.
- If production source changes are required, stop this review boundary, reserve
  the next unique slice, implement only an evidenced in-scope correction, and
  run focused changed-code tests at 100% statement/branch/function/line.
  Do not run global coverage per slice; run it once on the settled integrated
  candidate before merge. Re-render the integrated matrix after corrections.
- No source code, construction assumptions, receiver selection, DXF behavior,
  pattern/cut geometry, export baseline, recipe or unscoped finding remediation
  is authorized by a visual review alone. No G09/D04 side/oblique/inside views,
  G05 tech-pack scope, broad UI redesign, physical sampling, supplier contact,
  launch spending, hosted service, fit/factory acceptance or production claim.
- Keep user-visible guidance for every held face. Do not hide blockers by
  weakening validation or accepting crossed/partial drawings.
- Update this packet, `PROJECT-STATE.md`, Architecture/context/admission as
  needed, and the canonical board via its validated command layer. Record
  implementation, focused verification, agent waits and maintainer-decision
  time separately. No safe delegation is currently identified: the matrix,
  evidence integrity and cross-recipe visual review are one coupled audit;
  external-agent waits expected 0m. Codex owns integration and review.

## Exit evidence

- **Matrix and production output:** the existing production-preview Chromium
  harness completed 73 configurations and all 146 requested front/back
  faces, covering defaults, all 32 recipe/option endpoint pairs and both
  existing combined fixtures. Four views emitted SVGs (Tank and Skirt front
  and back); 142 were visibly withheld. Held breakdown: Tee 2 and Fitted 2 for
  unsupported sleeve contours/instances; Polo 34 and Woven shirt 54 for
  missing collar/stand face-split landmarks; Woven shirt 2 additional vent
  edge holds; Trouser 48 for front-fly/shield or four-leg-waistband placement
  conflicts. There were zero console, page or remote-request errors. Parser,
  revision, label bounds, text-overlap, notice-panel and anchored-callout
  checks passed for the four emitted faces. Exact requests, issue text,
  revisions, IDs, labels, representative UI PNGs, SVGs and execution log are
  in `S284-browser/matrix.json` and `S284-browser/run.log`.
- **Manual output review:** all four emitted defaults were inspected from the
  retained browser PNGs; the Tank views are symmetric with no center-axis
  duplicate and the Skirt segment/body outlines are coherent without a
  continuous body fold line. Source notices accurately disclose absent detail
  geometry and unsupported back POM anchors. Representative visible hold
  screenshots for Tee, Polo, Woven shirt and Trouser show exact source/assembly
  guidance and no partial drawing. Held faces are not acceptance passes.
- **Option/overlay review:** unsupported endpoints preserve their mapped holds;
  no invalid option is hidden or clamped. A first overlay check copied from
  the historical Tee fixture timed out because Tee is intentionally
  source-held and emits no SVG; its failure is retained in `overlay-run.log`
  and agrees with the matrix's sleeve hold. The same revision-bound overlay
  check against supported Tank passed: local asset `builtin-met-221932`,
  Charcoal `#3A4150`, front-only artwork boundary, color fill on both faces,
  same revision `live-draft:tank:1:4`, and parse/no-remote checks pass. The SVG
  marks placement; image content is not embedded and fabric response is not
  claimed. Outputs are `overlay-front/back.svg`, `overlay-front.png`,
  `overlay-matrix.json` and `tank-overlay-run.log`.
- **Mapped MQF review:** the findings register already marks MQF-004–007,
  MQF-011, MQF-012 and MQF-015 `To be reviewed`; those statuses remain pending
  the applicable capability exits. At this review, MQF-004 remains uncovered
  because every Woven-shirt view is held before button visibility can be
  reviewed. MQF-005 is partial: supported drawings provide contextual
  geometry/POM labels; pattern-key placement is outside these views. MQF-006
  is partial: emitted front POM leaders target represented geometry, while
  held faces and unsupported back anchors remain unavailable. MQF-007 is
  partial: current POM labels are readable and non-overlapping, while absent
  topstitch, pocket, closure, dart/pleat and construction annotation geometry
  is called out in source notices. MQF-011 is partial: Tank proves
  same-revision local artwork selection and color feedback as a placement
  boundary; direct manipulation, embedded image preview and fabric response
  remain deferred after G17. MQF-012 remains unreviewable for collar shape
  because the required specific Polo/Woven construction reference is absent;
  both are visibly held. MQF-015 remains assigned to V03 and is not applicable
  to this V02 output review. No finding creates new implementation scope, and
  every documented post-G17 deferral remains.
- **Acceptance/blockers:** matrix, visible-hold, automated geometry/layout and
  mapped-review evidence passed as a review exercise. G04 V02 output
  acceptance failed: 142/146 faces are held and Woven-shirt button visibility,
  Polo neckline/collar depiction, sleeve contour/multiplicity and Trouser
  assembly remain unverified. No validator, pattern geometry, export behavior
  or baseline changed. No CAD, physical-fit, factory or production-readiness
  claim is made.
- **Git/board:** started clean at `337ed72640500ef490a4bb3346cb34b09ed8d80d`
  (`Slice 283: implement source-backed skirt face segments`); refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  Board revision 437; S284 packet/start evidence and comment at 438–439;
  `E-G04-S284-EXIT` linked to G04-V02 and EPIC-17 at 440–441; exit comment at
  442; estimate revised through validated `editEpic` at 443 and synced to the
  summary card through validated `editItem` at 444. Landing subject
  is one `Slice 284: ...` commit.
- **Focused checks:** Control Center passed 33/33; S284 browser/replay helpers
  pass `node --check`; `git diff --check` passed. No production source changed,
  so changed-module coverage/build and protected export gates were not
  repeated; S283's passing gates remain applicable. No full repository
  test/global coverage run at this review boundary.
- **Next action:** reserve S285 for a bounded source audit to find or rule out
  construction references and exact source landmarks that can resolve the
  outstanding V02 face mapping without guessing. Start with local garment and
  construction research, then authoritative public construction references
  only if needed. If a specific collar source is not established, keep the
  Polo/Woven faces held and present the exact reference gap for maintainer
  input; do not begin V03 while V02 acceptance remains unmet.
- **Delegation:** no safe disjoint task identified; the matrix and rendered
  review are integrated. External-agent waits 0m; no OpenCode used.
- **Elapsed time:** matrix/rendered review and manual artifact inspection ~24m;
  focused Control Center/script/whitespace checks ~3m; durable closeout and
  validated board update ~10m (phases overlap). External-agent waits 0m;
  maintainer decision time 0m. Start 05:24:03 UTC; exit at 06:02:00 UTC;
  total 37m57s.
