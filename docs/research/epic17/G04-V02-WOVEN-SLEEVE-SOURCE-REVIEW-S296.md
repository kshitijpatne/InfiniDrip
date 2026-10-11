# G04 V02 Woven sleeve source review — Slice 296

## Start, authority, and verified boundary

- **Start:** 2026-09-30 09:49:02 UTC.
- **Goal:** inspect the garment-specific Fairfield sleeve-construction references already named by the Woven research, plus any directly linked primary pattern/instruction artifact, for an exact sleeve-cap front/back boundary or view-instance relation that can map to the current Woven Block. Add view metadata only if the reference binds uniquely to the current source topology; otherwise retain the sleeve hold and record the precise missing artifact.
- **Git:** started clean at S295 `15b36f962f484d44bcb1b7f7046afea906c50b58` on `codex/epic-17-g04`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S295 is the highest assigned slice; S296 is uniquely reserved.
- **Board:** revision 520; EPIC-17 In Progress, G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog. S295 verified exit is linked to G04-V02 and EPIC-17.
- **Required context:** current `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, G04 admission/roadmap, S287 sleeve-cap audit, S290 Tee/Fitted sleeve audit, S292/S293 Woven source/closure audits, S295 fold-map exit and browser evidence, `docs/research/garments/WOVEN-SHIRT-RESEARCH.md`, exact Woven sleeve/pattern/stitch/physical-role source and current mapping/assembly validators.
- **Maintainer authority:** source-backed view metadata is authorized for exact source-declared axes, landmarks and multiplicity only. It does not authorize a guessed split, copied foreign coordinates, pattern/cut edits, or partial live output.
- **Dependencies:** S295 exact back/yoke fold mapping; existing S286 collar mapping and S287 aggregate sleeve-cap issue; S293's finding that current Woven sleeve role has no distinct front/back cap landmark/instance rule. This source review can only remove a blocker if same-model evidence maps to exact current source geometry and all other visible roles remain fail-closed.

## Acceptance and gates

1. Record exact source identity/author/date, the directly relevant construction claim, and the local edge/mark/stitch relation it supports. Separate explicit source facts, local code facts, and inference.
2. Check whether the source identifies a sleeve-cap boundary and visible face-instance rule for this same construction and whether that rule resolves against the current authored cap edges, current notch marks, and ordered Woven armhole joins. Generic sewing guidance or another pattern's coordinates are not sufficient.
3. If no exact correspondence exists, change no production code and retain the Woven sleeve and complete-face holds with an actionable missing-evidence record.
4. Keep V02 In Progress and V03 Backlog. Keep MQF-004–007/011/012 as review checks and `To be reviewed`; MQF-015 remains gated for V03. Preserve post-G17 deferrals.
5. Research-only closeout uses Control Center tests and `git diff --check`. If exact evidence justifies production metadata in this slice, stop before implementation, revise the admitted packet and required gates, and continue only after that boundary is durable.

## Non-goals, risks, and ownership

- No new recipe, sleeve geometry, source marks, physical sewing, generic sleeve splitting, screen-derived coordinate estimate, DXF/export change, broad UI, G09/D04 view, G05 content, supplier contact, spending, hosted service, CAD profile, V03 implementation, fit/factory acceptance or production-readiness claim.
- The specific blocker is a same-model relation between the current aggregate two-edge eased cap and an orthographic front/back sleeve contour/instance. A reference that only describes notch alignment, easing or sewing order may not resolve it.
- No safe disjoint delegated task is identified: source identity and its exact current-Block correspondence form one bounded review. Codex owns the comparison and exit evidence; external-agent waits 0m; OpenCode is not used.
- Effort/date remains conditional; no calendar promise.

## Exit record

- **Source reviewed:** Thread Theory, “Fairfield Sew-Along: Attach Sleeves,” June 3, 2016, the garment-specific maker's own construction tutorial. The text directs sewing the sleeve to the armhole with a 3/8-inch seam allowance and describes handling sleeve-cap excess in manageable 1–2 cm easing segments in the author response. It does not identify a front/back cap boundary, label a cap notch that separates the two orthographic views, give a cap-edge station, or specify a sleeve-view instance count/orientation. The tutorial's construction instruction is not a coordinate or split rule for InfiniDrip's separately authored cap.
- **Local comparison:** current Woven source has one sleeve role with physical quantity two and a generic midpoint notch; ordered `Woven sleeve-cap ease` joins two cap edges to three ordered armhole edges with aggregate ease. Neither local mark/stitch topology nor the Fairfield tutorial binds a precise cap point to a front-versus-back contour or a unique per-view transform. S287's source hold is unchanged. No production code, source pattern, or cut geometry changed.
- **Disposition:** no unique current-pattern relation is established; keep the Woven sleeve held and both complete live faces fail-closed. V02 remains In Progress and V03 Backlog. The exact additional evidence needed is a same-model pattern drawing/specification identifying the front/back cap break or a source-authored mark/relationship on this Woven draft. Generic easing instructions do not clear the hold.
- **Verification:** research-only; no changed production code, so no production coverage/build/export/browser gate applies. The canonical Control Center tests pass 33/33 after the current-board fixture is updated; `git diff --check` passes. No DXF or protected export identity changed.
- **Board:** S296 start evidence/comment were recorded at revisions 521–523 through validated commands. Exit evidence is linked to G04-V02 and EPIC-17, and the exit comment is recorded through the same command layer. EPIC-17 and G04-V02 stay In Progress; G04-V03 stays Backlog. MQF-004–007/011/012 remain `To be reviewed`; MQF-015 remains gated for V03. Findings remain checks; post-G17 deferrals are unchanged.
- **Failures/decisions:** no source supports production metadata, so implementation was not started. No safe disjoint delegation was used. OpenCode was not invoked. Maintainer source-file question is pending; continue with repository evidence if no same-model drawing is provided.
- **Elapsed time:** 2026-09-30 09:49:02–09:57 UTC (about 8m). Primary-source/local-topology comparison 2m; S295 mapped-finding review 1m; durable documentation/board closeout 3m; Control Center/diff verification 2m; implementation 0m; build/export/browser rendering 0m; external-agent waits 0m; maintainer-decision time 0m (the view-metadata rule was already decided; the request for a source drawing is pending).
- **Next action:** continue one bounded V02 source-to-view blocker at a time, keeping Woven held; do not start V03 before the complete V02 gate passes.

**Primary reference:** [Thread Theory, Fairfield Sew-Along: Attach Sleeves](https://threadtheoryblog.wordpress.com/2016/06/03/fairfield-sew-along-attach-sleeves/).
