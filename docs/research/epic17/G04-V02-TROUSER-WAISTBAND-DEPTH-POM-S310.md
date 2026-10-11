# G04 V02 Trouser waistband-depth callout — Slice 310

## Start and verified boundary

- **Start:** 2026-09-30 16:41:59 UTC.
- **Goal:** prove whether the existing “Waistband depth (finished)” POM has a source-backed target on the same-revision compiled Trouser back, and record the exact renderer contract required to call out that target. This source/transform audit makes no production change; a proven mark-target implementation is reserved as the next unique slice because label placement must compose with already transformed fragment output without double-transforming or bypassing collision handling.
- **Git:** clean S309 `b89eec1db5ec93986d7f60d90199d6ee0be08a74` (`Slice 309: map Trouser back-rise flat callout`) on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned was 309; S310 is uniquely reserved.
- **Board:** canonical revision 644; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. S309 start/exit evidence and exit comments are linked; all-recipe tally is 28/146 accepted and 118 held.
- **Required context:** `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, G04 roadmap/admission, canonical board, S309 packet and rendered evidence, S305–S307 waistband view-fragment contracts/output, S303 source-dependency inventory, maintained Trouser construction record, and the applicable MQF register.
- **Source facts to verify:** the existing POM measures `waistband.endRight`; the authored waistband also carries a `centerBack` point mark. S305/S306 define exact source intervals and fragment transforms; S307 compiles the accepted back geometry. Their actual relationship to the emitted same-revision primitive and the output's semantic/layer behavior must be proved before any new anchor is accepted.

## Scope and acceptance

1. Trace the existing waistband-depth POM, exact source edge/mark, face fragment and transformed output entity across default and all 11 Trouser option endpoint cases plus the combined-supported case. Separate source fact from inference.
2. If one authored source point deterministically represents the measured POM on emitted `BACK_FLAT`, retain evidence of its target entity, source ID, transform, revision and value for every accepted back. The S309 back-rise anchor and all existing front behavior remain unchanged.
3. If the mark maps exactly, document the required typed face/role/entity anchor contract and why the production callout implementation is the next bounded slice. Otherwise preserve table-only behavior, name the missing source relation and do not reserve an implementation task absent evidence.
4. This research-only slice requires the retained matrix/SVG source probe, validated Control Center tests and `git diff --check`; no production build, export or global coverage rerun is needed because output/source are unchanged. The separate implementation slice, if source proof passes, requires 100% changed-module coverage; focused POM/fragment/mapping/live-renderer suites; build; protected DXF/export identity checks; Control Center/diff; fresh production Chromium 24 configurations/48 faces with both exact back callouts and 24 complete front holds; and default/endpoint manual review.
5. Review MQF-004–007, MQF-011, MQF-012 and MQF-015 as applicable output checks; keep canonical status **To be reviewed** and preserve post-G17 deferrals.

## Decisions, holds and ownership

- No new maintainer decision is required for this bounded source-backed map-or-hold. User authorization permits view metadata only where authored/source evidence supports it. No inferred geometry or role relation may be used to force an anchor.
- Woven placket/complete-face hold remains explicit: the maintainer has no construction reference for physical placket fronts and overlap. Trouser fronts remain held at the S308 front join/fly-shield conflict. No V03 work before full V02 acceptance.
- Non-goals: no POM formula/value/tolerance changes; no cut/pattern/stitch/option/export changes; no other POM/recipe mapping; no broad UI, G09/D04, G05, CAD/V03, sampling, supplier contact, spend, hosting, or physical/factory/readiness claim.
- The POM→fragment-transform→rendered-entity contract is coupled across source mapping and live rendering; no safe disjoint ownership. Codex owns implementation/review; external-agent waits 0m and OpenCode is not invoked.
- Conditional estimate at start: 57–71 total landed slices, 8–22 remaining from S309. This bounded slice consumes one V02 slot; unavailable source waits remain unpriced.

## Exit record

### Source-to-view result

- **Authored POM:** `TROUSER_POMS` measures “Waistband depth (finished)” as `seam(waistband, "endRight")`; the drafted trouser waistband's `endRight` length is exactly the selected waistband depth.
- **Authored target:** `src/drafting/trouser.ts` emits the source point mark `waistband.centerBack` at `(0, depth / 2)`, explicitly labelled “center back”. S305 documents the waistband's short-end center-back closure. This mark is not an inferred measurement endpoint; it is the authored center-back point at the midpoint of the exact band-depth closure edge.
- **Rendered target:** the retained S309 production SVGs already emit `live-flat:trouser:BACK_FLAT:waistband:mark:centerBack` with source ID `pattern:trouser:mark:waistband:centerBack`. An executable probe over all 24 accepted Trouser back configurations verified: the mark is the exact midpoint of the emitted center-back closure segment; closure length equals that case's waistbandDepth; mark and face revision IDs match. Default is depth 4 cm at `(0,-2)`; the supported depth endpoints are 2 cm at `(0,-1)` and 8 cm at `(0,-4)`. Full per-configuration checks are retained in `docs/research/epic17/S310-waistband-depth-anchor-probe.json`.
- **Implementation boundary:** source evidence supports using that exact mark as the POM target on each accepted back. The current callout compiler only accepts a vertex on one mapped role outline and compiles before the waistband fragments are merged; the center-back mark is a transformed fragment entity in view coordinates. Routing its point through the existing role-local callback would either fail vertex validation, target the wrong outline, double-transform it, or bypass shared readable-label collision placement. No production code is changed in S310. The smallest safe implementation needs an explicit same-revision mark-entity anchor reference and a layout path that composes it with the already placed S309 back-rise callout.
- **Output and scope:** the S309 matrix remains 24 accepted back views with the existing back-rise callout and 24 fully held front views. Current all-recipe tally remains 28/146 accepted, 118 held. No measurement/POM formula, pattern/cut/stitch/options/export behavior or protected identity changed.
- **Review/holds:** review mapped MQF-004–007, MQF-011, MQF-012, MQF-015 as relevant output checks; statuses remain **To be reviewed**, with post-G17 deferrals intact. Woven placket/complete-face hold remains because the maintainer confirmed no construction reference exists. Trouser fronts remain held at S308. V02 remains In Progress; V03 remains Backlog.
- **Verification:** source probe assertions pass for all 24 accepted back SVGs; existing S309 production Chromium matrix shows zero browser/page/request errors and is retained unchanged. This documentation/source-evidence boundary requires validated Control Center tests and `git diff --check`; production output was not modified, so no new build/export/coverage/browser gate is applicable.
- **Board:** verified S310 source exit evidence/comment linked to G04-V02, EPIC-17 summary and Epic record; estimate and summary description updated through validated commands. Canonical board final revision 656; no item status advances.
- **Landed commit:** `Slice 310: prove Trouser waistband-depth anchor source map` (S311 start will record the exact hash).

### Estimate and next action

Reforecast from S310: 57–71 landed slices total remains conditional; 7–21 slices remain (0–6 further V02 implementation/evidence slices including the next bounded anchor implementation, 5–10 V03 only after full V02 acceptance, and 3–5 integrated review/merge/deployment). This consumes one V02 source-evidence slice; the newly proven mark target has its own controlled implementation boundary. External source waits remain unpriced. Accepted/held matrix remains 28/146 and 118.

**Next action:** start S311 on the clean S310 commit, after refreshing Git, required context, board and slice history. Implement only the typed same-revision `centerBack` mark target for the existing Trouser waistband-depth POM on `BACK_FLAT`, sharing readable callout placement with S309 back rise. Preserve every front hold and all cut/stitch/export behavior. Require 100% changed-module coverage, focused tests, build, protected export checks, Control Center/diff, 24-configuration/48-face production Chromium and manual output review before landing.

### Elapsed time

S310 elapsed 11m04s (2026-09-30 16:41:59–16:53:03 UTC): source/source-output inspection and probe 4m; implementation 0m; focused Control Center/diff 1m; documentation/current context and final verification 2m; validated board closeout 4m04s; production build/export/browser 0m; external-agent waits 0m; maintainer-decision handling 0m. No safe disjoint delegation was available.
