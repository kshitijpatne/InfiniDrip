# G04 V02 Trouser back-rise callout mapping — Slice 309

## Start and verified boundary

- **Start:** 2026-09-30 16:04:30 UTC.
- **Goal:** bind the existing finished Trouser back-rise method to a source-backed point on its same-revision assembled back geometry. Keep every unrelated POM and the Trouser front hold unchanged.
- **Git:** clean S308 commit `03dcb4f7327680eac81cbb4c582d1c65bac2d5f3` (`Slice 308: document Trouser front join hold`) on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 308; S309 is uniquely reserved.
- **Board:** canonical revision 632 at admission to the slice; S309 start packet/evidence and comments are linked through validated commands by revision 637. EPIC-17 and G04-V02 In Progress, V01 Done and V03 Backlog. Verified S308 result is linked; output tally is 28/146 accepted and 118 held.
- **Source:** `src/drafting/trouser-tables.ts` already computes “Back rise (finished incl. waistband)” from the `backLeft.centerBack` vertical edge plus the named waistband end edge, but declares no leader anchor. S307 assembles and accepts `backLeft` and its center-back contour for all 24 Trouser configurations. The back-rise anchor can name the authored crotch endpoint (`edgeStart(centerBack)`) on that exact role outline without inventing a new measurement or construction rule.
- **Required context:** standing `AGENTS.md` workflow; `CONTEXT-INDEX.md`; current `PROJECT-STATE.md`; `docs/PROJECT-DECISIONS.md`; `ARCHITECTURE.md`; G04 roadmap/admission; canonical Control Center board; S308 exit; S307 rendered/output evidence; S269 source-POM contract; the maintained Trouser research record; the MQF register and S273/S298/S307 rendered-review evidence.

## Scope and acceptance

1. Add an optional face-specific back anchor to the existing POM contract and map its role for a recipe only where its source method defines a valid back-face landmark. Keep the existing front anchor contract and behavior unchanged.
2. For the Trouser’s existing back-rise POM only, anchor to the authored `backLeft.centerBack` crotch endpoint. Resolve that role into `BACK_FLAT` output through the live same-revision outline, verify the anchor is an exact source vertex, and retain POM identity/value/tolerance.
3. Keep Trouser front geometry completely withheld at its existing source conflict. Do not add other Trouser back anchors, infer other POM endpoints, alter POM measurement formulas, source geometry, placement, roles, pattern/stitches/options, or callout layout policy.
4. Changed production modules must each pass 100% statement, branch, function and line coverage. Run focused POM, source-mapping and live-renderer tests; build; protected DXF/export identity regressions; validated Control Center tests; and `git diff --check`.
5. Build and inspect fresh production Chromium output for all 24 Trouser configurations / 48 faces. Require 24 accepted backs with one back-rise callout per face targeting the exact same-revision `backLeft` outline; all 24 fronts remain held with no partial geometry. Parse SVGs and check role/source IDs, revision, anchor vertex and rendered leader, labels/collision/clipping, layers/colorway, visible hold notice, and zero browser/page/request failures. Manually review the default and option endpoint output.
6. Review mapped MQF-004–007, MQF-011, MQF-012 and MQF-015 against this output. Keep canonical findings at **To be reviewed**; document partial coverage and unresolved findings without adding unscoped remediation or promoting post-G17 deferrals.
7. Preserve legacy DXF behavior and every protected export byte identity. Do not run the full repository/global coverage gate on this non-releaseable slice; retain it for the settled integrated Epic/PR candidate.

## Decisions, holds, risks and ownership

- No new maintainer decision is required: the source methods and assembled contour already define the proposed point, and the maintainer authorized source-backed view metadata.
- Woven closure and complete Woven flats remain held because no reference identifies physical placket fronts and overlap order. This Trouser work is independent of that missing artifact.
- Trouser fronts remain held under S308: the exact fly/shield joins rotate `frontRight` 180 degrees and the waistband fragments fail the center-front join; no source-supported orientation/overlap rule exists.
- Polo collar/stand, Tee/Fitted sleeve mapping, and other unsupported faces remain held. No V03 work starts before full V02 acceptance.
- No safe low-risk disjoint ownership exists: the recipe POM anchor, face-specific role mapping, callout target geometry, focused coverage and rendered SVG behavior form one contract. Codex owns implementation and integrated review; no external-agent waits are planned. OpenCode is not invoked.
- **Non-goals:** no POM definition beyond the existing back-rise point, measurement or tolerance change; no cut/pattern/stitch/options/export change; no other recipe, broad UI, G09/D04, G05, sampling, supplier contact, launch spending, hosted service, physical fit, factory acceptance, CAD interoperability or production-readiness claim.
- **Estimate:** S308's conditional 9–23 remaining-slice forecast remains active at start. This bounded, potentially releaseable behavior slice does not change acceptance or price unresolved source waits.

## Exit record

### Result and evidence

- **Implementation:** added optional face-specific back POM anchors. Only the existing “Back rise (finished incl. waistband)” method declares one, at `backLeft.centerBack`'s authored crotch endpoint. The live `BACK_FLAT` callout resolves to that exact vertex on the same revision's accepted backLeft outline. Existing front POM anchors remain unchanged; the unanchored front back-rise row is explicitly table-only. No measurement formula, value, tolerance, pattern/cut geometry, stitch graph, option, role count, or export implementation changed.
- **Held views:** all 24 Trouser backs continue to emit; all 24 fronts remain completely held at `view:trouser:waistband:center-front`. Woven closure/complete flats remain held because the maintainer confirmed no source reference is available for placket face instances/overlap. The all-recipe tally stays 28/146 accepted and 118 held; this annotation change adds no accepted faces.
- **Changed-module coverage:** the first coverage attempt exposed uncovered invalid-back-anchor and blank-fallback branches. Preserved the failure, added direct tests, and reran the changed modules. `pom.ts`, `technical-flat-mapping.ts`, and `technical-flat-poms.ts` each pass 100% statements, branches, functions and lines. Focused changed-module coverage: 26 tests. Affected renderer/live/geometry/overlay suites: 108/108.
- **Build and compatibility:** production build passes (existing Vite large-chunk advisory only). Protected export, regression and tech-pack surface tests pass 24/24, including legacy DXF and protected export identities. `node --check ops/web/verify-g04-s274-option-matrix.mjs` and `git diff --check` pass. No identity baseline moved.
- **Production output:** fresh production Chromium exercised 24 supported Trouser configurations / 48 faces. All 24 accepted backs contain exactly one finished back-rise callout whose source ID is the existing POM, target is the same-revision `BACK_FLAT` backLeft outline, and finite anchor is the exact mapped vertex. All 24 fronts remain held without partial geometry. SVG parsing, label collision/clipping and callout leader checks passed; browser/page/remote-request errors are zero. Retained captures, SVGs, PNGs and matrix data in `docs/research/epic17/S309-trouser-back-rise-browser/`. Manually reviewed default plus backRiseEase min/max: coherent back silhouette, leader on the center-back crotch endpoint, readable placement, and no crossing/overlap.
- **Manual findings:** reviewed mapped MQF-004–007, MQF-011, MQF-012 and MQF-015 as output checks. They remain canonical **To be reviewed** for the applicable G04 capability exits; this narrow Trouser back callout does not close cross-recipe construction, artwork, collar or CAD exchange findings. Preserve the findings register's post-G17 deferrals; no corrective work is inferred here.
- **Scope/limitations:** no CAD receiver/profile or industrial round-trip was evaluated in S309. V03 stays Backlog and cannot begin until V02 meets all seven-recipe/option acceptance. No physical fit, factory acceptance, CAD interoperability or production-readiness claim.
- **Board:** validated command-layer exit evidence/comment linked to G04-V02, EPIC-17 summary and the EPIC-17 record. Exit links/comments, Epic estimate and summary-card estimate are complete at canonical board revision 644. V01 remains Done; V02 In Progress; V03 Backlog.
- **Commit:** one landed commit subject: `Slice 309: map Trouser back-rise flat callout`. S310's fresh start boundary will record the resulting commit ID; the commit cannot embed its own hash.

### Exit gates and next action

All S309 acceptance gates passed. The current estimate is 57–71 landed slices total and 8–22 conditional slices remaining from S309: 0–7 further V02 implementation/evidence, 5–10 V03 only after all V02 exits, and 3–5 integrated review/merge/deployment. This is a one-slice reduction from S308's 9–23 estimate; source waits remain unpriced. Current accepted/held output remains 28/146 and 118. Board and archive revision is recorded in the Control Center exit evidence.

**Next action:** begin S310 only from the clean S309 commit after refreshing `origin/main`, the board, required context and highest slice history; select one independent source-backed V02 mapping/hold boundary. Do not start V03 while any supported face/options remain held.

### Elapsed time

S309 elapsed 28m52s (2026-09-30 16:04:30–16:33:22 UTC): implementation 5m; focused verification and coverage repair 7m; build/protected-export gates 3m; production Chromium and manual output review 5m; records/board/final verification 8m52s; external-agent waits 0m; maintainer-decision handling 0m. No safe disjoint delegation was available.
