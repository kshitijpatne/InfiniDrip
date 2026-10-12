# Approved UI enhancement sequence

Maintainer approved the research recommendations and proposed implementation order on **2026-10-01 (America/New_York)**. This packet records planning/board authority, not a claim that features have shipped. It does not start CLI contributors or a new numbered Epic. Each implementation package requires a bounded admission/handoff, a durable goal, exact file ownership and a fresh unique slice allocation before work.

Research: `docs/research/ui-repo-review-2026-10-01/UI-REPOSITORY-RECOMMENDATIONS.md`; visuals: `UI-VISUAL-ATLAS.html` in that directory. The 42 research rows include keep/exclusion decisions, not 42 development tasks. Preserve those exclusions. Existing durable semantic edits remain revision-bound and feed dependent outputs; the research table's shorthand about preview-only editing must not be interpreted as reverting completed G02/F03 behavior.

## Verified coordination baseline

Planning began 2026-10-02 03:03:33 UTC (2026-10-01 23:03:33 New York). Fetched main is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`. This checkout is `codex/execution-time-efficiency` at `50afb32`, with an identical committed tree, pre-existing untracked research/logs/coverage and a pre-existing empty EPIC-17 admission file. They are preserved.

Historical planning observation from 2026-10-02: Epic17 was independently active on `codex/epic-17-g04`, worktree `C:/Users/kshit/.codex/worktrees/epic-17-g04/designApp`, at Slice352 with V02 open and V03 gated. This was superseded by the 2026-10-11 EPIC-17/G04 closure recorded below; it is not current task state. At that historical boundary, the active task's packet/board—not this checkout's older Slice260 handoff—governed its work. Never copy a stale board or old PROJECT-STATE across worktrees.

This planning update has no landed slice assignment or commit. Epic17 is allocating slices concurrently; the integrating task must reserve the next unused number after inspecting main and every active history/reservation at its normal boundary. Do not invent a future numbered slice or reuse 352. No message was sent to or interruption made in the active task.

## Ordered packages and ownership

All new cards start Backlog. Codex owns scope, review, required fixes, integrated gates and merge. Contributor ownership means delivery of a bounded candidate with tests and actual output evidence, not permission to merge or redefine the product.

| Order / board ID | Outcome | Roadmap owner | Predecessor / production gate | Safe parallel work and contributor |
|---|---|---|---|---|
| 1 UIQ-01 | G04 recommendation reconciliation: exact geometry/piece identity, construction fidelity, readable source-bound POM callouts, existing artwork overlay contract | Existing EPIC-17 / G04 V02 then V03 | Current slice finishes first; existing all-seven/options V02 gate stays intact | No duplicate renderer/task. Codex retains core; independent output QA can be delegated. This external checkpoint does not add a new Epic17 closure dependency. |
| 2 UIQ-02 | Native visual foundation: spacing/type/contrast/focus, restrained panels, opaque fallback, reduced motion | Cross-cutting UI lane, no new Epic number | Bounded candidate admission; production wiring through UIQ-GATE | Claude Code owns isolated CSS/components/tests; no global stylesheet or app mount writes. |
| 3 UIQ-03 | Actionable guidance, fit intent versus validity, current/completed/blocked journey presentation | UI lane; G03 follow-up presentation, no reopening its scope | UIQ-02 candidate; UIQ-GATE before production integration | Claude owns read-only presentation/fixtures. Codex retains journey, validation and output gating. |
| 4 UIQ-04 | Material behavior versus appearance, explicit preset limits and illustrative native swatches/shine | UI lane now; EPIC-22/G09 later for actual 3D materials | UIQ-02 candidate; UIQ-GATE before wiring | Claude owns candidate; no invented fabric behavior, geometry or saved-value changes. |
| 5 UIQ-05 | Existing artwork catalog presentation: previews, rights/suitability/resolution, search/filter/no-match | Existing artwork V1 UI; not EPIC-30/G17 expansion | May build isolated candidate alongside UIQ-02; adopt accepted visual contract before integration through UIQ-GATE | OpenCode owns panel/tests with read-only existing catalog fixtures. No new artwork acquisition/store/schema. |
| 6 UIQ-06 | Legible measurement/provenance, grading exceptions, nesting/Check readouts, project/history/recovery/import and export-scope messages | UI follow-up lane; G05 pack-specific presentation stays EPIC-18 | UIQ-GATE; bounded subpackages, not a wholesale rewrite | CLI presentation/tests; Codex retains schemas, persistence, validation, approvals and exports. |
| 7 UIQ-07 | Static native welcome backdrop and original metal-inspired wordmark | UI lane; reuse later within EPIC-21/G08 A01, without starting brand-profile logic | UIQ-02; UIQ-GATE before entry-flow wiring | Claude owns isolated visuals/assets; no login, hosted service or Shield code. |
| 8 UIQ-08 | Restrained native inspection toolbar glass with solid buttons and opaque fallback | UI lane against settled inspection surface | UIQ-02 and UIQ-GATE | Claude owns treatment/QA; preserve pointer/keyboard/zoom behavior. No page-sampling implementation. |
| 9 UIQ-09 | Truthful recipe/starter thumbnails and construction summaries | EPIC-19/G06 L02 | EPIC-19 admission and accepted relevant G04 source-to-view contracts; existing starter gates remain | Claude visual assets and OpenCode evidence audit; Codex binds recipe/size/revision. No independent polished sewn-design redraw. |
| 10 UIQ-10 | Readable production-pack forms/tables, revision/approval visibility and selected sections | EPIC-18/G05 T01–T05 | Epic18 admission and accepted data contracts; later outputs consume G03/G04 | CLI forms/document QA; Codex schema, numeric/POM reconciliation, freeze and export logic. |
| 11 UIQ-11 | Bounded R3F versus direct Three renderer proof: lazy stable host, cleanup, local assets, SVG fallback, revision identity | EPIC-22/G09 proof boundary supporting D01/D03 | Separate Epic22 admission; production snapshot bridge after required upstream contracts | Claude may own isolated renderer/asset/notice harness. Codex chooses architecture and owns state bridge. A flat-mesh demo is not Epic22 completion. |
| 12 UIQ-12 | Pattern-linked assembled/all-recipe views, measurement-driven avatar and later material/cloth behavior | EPIC-22/G09 D02–D06 | Epic22 admission, accepted UIQ-11 proof, G03/G04 contracts and D-stage gates | Codex geometry/fitting/solver integration; independent assets and visual QA only. Physical claims stay held. |
| 13 UIQ-13 | Optional ShaderGradient welcome pilot, only if it earns its cost over native CSS | Conditional UI lane | UIQ-07, UIQ-GATE, full exact-version notices/assets and device/network/performance evidence | Claude can own isolated experiment; no automatic runtime adoption. Native CSS remains default if benefit/cost gate fails. |

### Post-EPIC-17 status — 2026-10-11

EPIC-17/G04 is closed on `origin/main` after PR #19 and production verification.
The accepted isolated candidates UIQ-02/03/04/05/07 and UIQ-03/04 independent QA
were tracked as Done child work at this historical post-EPIC-17 checkpoint.
Parent UIQ-02 was subsequently integrated and deployed; UIQ-03's current
admitted integration status below supersedes this snapshot. Other parent cards
remain Backlog/unshipped. Their exact proofs and current integration boundary
are indexed in `CONTEXT-INDEX.md` and `docs/planning/UIQ-GATE-ADMISSION.md`.

UIQ-GATE depended on EPIC-17 and closed as a readiness-only task at board
revision 4352. UIQ-02 was subsequently admitted from current main as Slice 734,
integrated, reviewed and merged in PR #21 at main `5726a1ff`. Its full web,
repository, rendered and packaged Electron gates passed; production workflow
`38158498775` deployed successfully and the share URL returned HTTP 200. The
canonical UIQ-02 parent is Done after Slice 735 closeout at board revision
4370. See `docs/planning/UIQ-02-INTEGRATION-ADMISSION.md`,
`docs/release/UIQ-02-INTEGRATION-S734-EXIT.md`, and
`docs/release/UIQ-02-INTEGRATION-S735-CLOSEOUT.md`. Closing the gate is not a
promise to integrate every package in one giant PR. Each feature integrates
and is verified under its own packet; its release is recorded independently.
Candidate cards must distinguish component delivery from app release in exit
evidence and comments. No candidate receives a delivered release date for
unshipped app behavior.

On 2026-10-11 the maintainer authorized serial integration. UIQ-02 is first,
admitted on `origin/main` `7484fe4` as Slice 734 in
`docs/planning/UIQ-02-INTEGRATION-ADMISSION.md`. Its bounded host is the active
guided tour and existing local-storage warning; it does not authorize a global
shell/control restyle. The embedded flag has no live/remote toggle; rollback
requires a code-default change and deployment. UIQ-03/04/05/07 remain backlog;
a fresh admission is required before the next package. UIQ-02's initial
transient Electron runtime-folder rename
failure is retained as negative evidence; the later clean retry and full
packaged verification passed. The parent UIQ-02 is Done and deployed; see its
Slice 735 closeout. The Slice 734 exit packet remains the pre-merge
implementation record.

No historical roadmap dates are re-promised: target/release/delivery dates for new cards are null until the next admission/scoping decision. Added work uses genuinely spare independent capacity first; shared UI integration is serialized and reforecast rather than squeezing Epic17's gates or adding cosmetic critical-path work. Future Epic18/19/21/22/30 admissions and existing garment, launch-cost, supplier, physical and legal gates remain intact.

### UIQ-03 integration status — 2026-10-11

UIQ-02 is Done/deployed. The maintainer authorized UIQ-03 as the next serial
integration; its fresh current-main admission is
`docs/planning/UIQ-03-INTEGRATION-ADMISSION.md` (Slice 736 implementation,
Slice 737 deployment closeout). The accepted panel is limited to the existing
Design readiness disclosure behind `uiq_guidance`; existing journey controls
and decisions are preserved, with the old checklist as the flag-off fallback.
UIQ-03's presentation omits the exact blocker duplicate from the ordinary note
list. Slice 736's full coverage, packaged verification and rendered evidence
are in `docs/release/UIQ-03-INTEGRATION-S736-EXIT.md` and
`docs/research/uiq03-integration/`. PR #23 is merged; deployment run
`38173525917` passed and the existing public URL returned HTTP 200 with the
panel visible. Slice 737 closed UIQ-03 Done at board revision 4380; see
`docs/release/UIQ-03-INTEGRATION-S737-CLOSEOUT.md`. UIQ-04/05/07 remain
Backlog at this historical UIQ-03 closeout boundary. Final closeout PR #24 and main
workflow `38176394059` succeeded, and the existing public URL passed a fresh
post-deployment browser check; see `docs/release/UIQ-03-S738-FINAL-CLOSEOUT.md`.

### Current integration status — 2026-10-12, UIQ-04 shipped

After UIQ-03's complete merge, deployment and board closeout, the maintainer
authorized UIQ-04 material clarity. Its contract is
`docs/planning/UIQ-04-INTEGRATION-ADMISSION.md`; the completed goal ledger is
`docs/planning/UIQ-04-GOAL.md`. Slices 739–740 completed the bounded,
flag-gated integration, full pre-merge gate, merge, deployment and board
closeout. The accepted component is
collapsed by default next to existing material/appearance controls and appears
only during Fit, when those existing controls are available. All old controls
remain unchanged, and flag-off/unknown/stale renders the exact legacy shell.
Compatibility remains explicitly unknown; no material math, saved state,
renderer, global restyle, or physical claim is admitted. PR #26 merged at
`956c5c5dd1eee83aca9153f759c21c693843b095`; main deployment run 38185891574
passed, both stable and immutable public URLs passed browser checks, and UIQ-04
is Done at board revision 4394. Reports:
`docs/release/UIQ-04-INTEGRATION-S739-EXIT.md` and
`docs/release/UIQ-04-INTEGRATION-S740-CLOSEOUT.md`. UIQ-05 was subsequently
admitted as the next serial package on 2026-10-11; UIQ-07 remains Backlog and
unadmitted.

### UIQ-05 admission — 2026-10-11

The maintainer authorized the next ordered goal after UIQ-04. UIQ-05 is
admitted from `origin/main` `f4cbfc45` as Slice 741 (bounded Surface artwork
catalog presentation redesign) and Slice 742 (post-merge deployment and board
closeout). The current artwork screen already contains catalog search,
filters, local previews, provenance/rights, print suitability/resolution and
no-match states; it additionally has explicit stage/apply placement actions
that the isolated candidate lacks; it also couples the current independent
curated-use filter and assessment selector. Accordingly, reuse only the
accepted scoped visual treatment on the app's existing catalog markup and
logic; do not mount a duplicate component, and preserve both actions and the
separate filter/assessment controls. `uiq_artwork` is embedded/default-on for local rollback testing;
OFF/unknown/stale must retain the exact legacy screen. Candidate source remains
immutable. No artwork, storage, rights, acquisition, placement schema, math,
exports, baseline or other UIQ scope is included. Full boundaries and gates:
`docs/planning/UIQ-05-INTEGRATION-ADMISSION.md` and
`docs/planning/UIQ-05-GOAL.md`. S741 merged via PR #28 at `7f5e6263`; S742
deployment and stable/immutable live verification passed. UIQ-05 is Done at
board revision 4404 with verified S742 evidence; final durable current-state
reconciliation is complete. UIQ-07 remains Backlog/unadmitted.

## Parallel boundaries

- Track A: current Codex Epic17 scope and source/render/CAD contracts.
- Track B: Claude native foundation, guidance/material presentation candidates, then welcome/wordmark and toolbar.
- Track C: OpenCode existing artwork-panel candidate and disjoint narrow/a11y QA. OpenCode must use Muse Spark1.3 xhigh normal; stop rather than substitute if unavailable.
- Freeze input/prop/token specifications before dependent candidates. Suggested candidate roots are new isolated directories such as `src/ui/enhancements/foundation/`, `guidance/`, `material/`, `artwork/`, `entry/`, `toolbar/`; exact ownership is assigned by the future packet, not by this suggested path list.
- Contributors must not touch `src/ui/app.ts`, `view.ts`, `journey.ts`, `persist.ts`, `technical-flat-panel.ts`, shared/global styling, `src/render/technical-flat*`, drafting, persistence, exporters, baselines, package/lock files, board/governance or other active files unless explicitly assigned at a coordinated boundary. Separate filenames alone do not make shared behavior parallel-safe.
- Separate worktrees and branch diffs; explicit WORK FINISHED before inspection. Sonnet is preferred for bounded Claude UI work; heavier reviews only when needed. Codex default Luna-max where selectable, short high/extra-high Sol/Terra exceptions per AGENTS; never claim an unavailable model switch.

## Acceptance and exclusions

Keep 100% changed-code coverage and final integrated global coverage, export byte-identity baselines, actual browser/Electron/output review where applicable, native semantics/keyboard access, narrow/zoom/contrast/reduced-motion and readable error states. Retain raw invalid inputs, explicit correction and stale/rebase gates, source/revision identity, missing local assets and opaque/SVG fallback. Scoped local effects must not introduce outbound asset/HDR/font/analytics/upload requests.

Optional new behavior uses the approved local feature-flag contract where applicable; its exact flag, default, fallback and persisted-state compatibility are scoped before admission. No hosted flag service is authorized.

No full React migration; no Liquid Glass body snapshot/DIV control substitution; no restricted Liquid Logo wrapper/GLSL/public uploads; no new Control Center redesign; no paid/hosted/login/cloud/databases; no new recipe or physical-fit/production-certification claim. Direct runtime adoption remains conditional even though research recommendations are approved. Do not weaken or prematurely pass Epic17 construction-source or visibility holds.

## Board replay and durable integration

`UI-ENHANCEMENT-BOARD-COMMANDS.json` contains additive validated commands with stable UIQ IDs and comments. Apply through the existing `executeBoardCommand` interface, with freshly read expectedRevision for each operation. Preflight the complete sequence with `applyBoardCommand` on a clone before writing. Never write board JSON directly.

On a newer board, skip a createItem if its ID already exists, skip an evidence creation only if the same evidence identity/content exists, skip an evidence link already present and skip an identical comment already recorded. Do not edit or reset existing UIQ execution status, contributor evidence, old Epic metadata/history or unrelated work. If an existing ID describes different scope, stop for reconciliation. A partial interrupted application is resumed with those checks, not by replacing the board. `UI-ENHANCEMENT-LOCAL-STATUS-COMMANDS.json` is only for this stale checkout's explicit Epic17 status reconciliation; it must NOT be replayed over a newer active board or a closed Epic.

At the next ordinary Epic17 boundary, the user-pasted instruction in `UI-ENHANCEMENT-EPIC17-NOTE.md` asks that task to read this packet, absorb the new research/planning files and relevant additive context sections, and replay the additive commands against its latest board. Do not copy this checkout's board, PROJECT-STATE, AGENTS or full older roadmap over its newer versions. Retain that task's exact slice/commit and current packet. Inspect duplicate work before adding anything; keep the current G04 fixes and QA, queue unrelated UI packages outside its critical path.

Historical planning boundary: this roadmap/board update began local and uncommitted; its subsequent durability is tracked through the admitted UIQ integration branch, PR and release records below. The original planning task did not directly push to main or deploy.
