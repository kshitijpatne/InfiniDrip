# G04 V02 Woven body view metadata — Slice 293

## Start, authority, and boundary

- **Start:** 2026-09-30 09:01:47 UTC.
- **Goal:** represent only the source-proven Woven front pair and back/yoke center axes as view metadata. Bind the front multiplicity to the authored center-front edge, and validate both placket attachments/layer order against that same boundary. Keep the Woven face held whenever its sleeve-cap or collar construction is not yet mapped. No body output may imply a complete flat while those role gaps remain.
- **Git:** started clean at S292 `215cf3ddfbee41f33b3fcec49f7f4538ad96f5a7` on `codex/epic-17-g04`. `git fetch origin --prune` refreshed `origin/main` to `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S292 is the highest assigned slice; S293 is uniquely reserved.
- **Board:** canonical revision 502; EPIC-17 In Progress, G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog. S292 verified exit is linked.
- **Required context:** read `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, `docs/planning/EPIC-17-ADMISSION.md`, S292 source audit, S287 sleeve hold, S286 collar/vent mapping, S291 rendered review, current Woven drafting/role contract, projection/assembly/source-map validators and tests, and the current seven-recipe mapping.
- **Maintainer decision:** 2026-09-30 source-backed view metadata is allowed for authored folds, exact landmarks and multiplicity. It does not authorize geometric guesses or changes to source/cut geometry.

## Acceptance and gates

1. Verify exact same-revision source geometry for `front.centerFront`, back/yoke `centerBack`, physical-role quantities and supported yoke-depth options. Represent only explicit source-supported axes and front-pair instances.
2. Prove the two separately authored plackets attach to the correct front boundary and establish an explicit overlap/layer order from authored source evidence. If the source does not uniquely define the view order or closure boundary, keep affected roles held and document the fact.
3. The projection/output contract must retain full Woven face holds while any required visible sleeve-cap, collar or other construction role lacks a valid face map. It must not reveal a partial body flat or imply complete V02 acceptance.
4. No pattern construction, canonical source coordinates, cut geometry, DXF behavior or protected export byte identity changes. No inference from screenshots or generic sewing conventions.
5. If production modules change: changed-module focused coverage at 100% statements, branches, functions and lines; projection/compiler/live/output tests; TypeScript/build; protected export/DXF identity; full 28-configuration/56-face Woven Chromium replay with retained exact SVG/PNG and manual review; Control Center tests; `git diff --check`. Confirm all Woven faces remain held until all required mappings pass. Full global coverage remains for the settled Epic/PR candidate.
6. If the exact placket/view order is not supported or the view metadata would expose misleading partial output, record a bounded hold and run only the Control Center and diff checks.
7. MQF-004–007, MQF-011/012 remain review checks and `To be reviewed` until their mapped implementation is complete. MQF-015 remains assigned to V03; preserve post-G17 deferrals. V02 remains In Progress; V03 stays Backlog.

## Non-goals, dependencies, and risks

- No sleeve-cap split, collar construction reference, new recipe, G09/D04 side/oblique/inside assembled view, G05 tech-pack content, broad UI redesign, physical sampling, supplier contact, launch spend, hosted service, CAD receiver/profile, fit/factory-acceptance or production-readiness claim.
- S286/S287/S292 retain the unresolved Woven collar and sleeve boundaries. This candidate can record body source mapping only; it cannot pass the all-face Woven gate by itself.
- No safe disjoint low-risk delegation: role metadata, seam/layer validation, renderer fail-closed behavior and exact output are tightly coupled. Codex owns integration and review. Agent waits 0m; OpenCode is not used.
- Effort/date remains conditional; one bounded implementation-or-hold slice. No calendar promise.

## Exit record

- **Source result:** exact Woven source does establish front quantity 2, authored `centerFront` at x=0, `onFold` back/yoke axes at x=0, and named `Button placket ↔ right front centre front` / `Buttonhole placket ↔ left front centre front` interfaces. But both typed stitch records still target the single `front.centerFront` role edge; there are no typed front-instance references. The separate placket geometry uses the same source-side attachment origin and closure offset, while the source does not declare a face-layer order or how the overlap boundary occludes the opposite placket. A face map that reflects both front geometry and every attached overlay/callout would risk duplicating annotations and implying an unsupported closure. The exact source facts are recorded; no production metadata or output was changed.
- **Disposition:** retain the Woven front/back full-face holds. The source audit does not prove an instance-aware assembly contract for the two plackets and their layer order, and sleeve-cap/collar roles remain unresolved. The S291 production matrix remains current at 56/56 Woven faces visibly held; no incomplete partial flat was emitted. MQF statuses remain unchanged (`To be reviewed`); V02 remains In Progress and V03 remains Backlog.
- **Verification:** research-only boundary; no production test, build, coverage, export or Chromium gate applies because no production behavior changed. The required focused Control Center suite passes 33/33; `git diff --check` passes. No DXF or protected export identity changed.
- **Board and Git:** start packet/Epic links and start comment were recorded via the validated command layer at revisions 503–505. Verified exit evidence was added to G04-V02 at revision 506, linked to EPIC-17 at 507, and exit comment recorded at 508. Started clean at S292 `215cf3ddfbee41f33b3fcec49f7f4538ad96f5a7`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. S293 is uniquely reserved; one `Slice 293:` commit contains this audit.
- **Elapsed time:** start 09:01:47 UTC; exit 09:11:45 UTC; total 9m58s. Source/topology review 4m; documentation/board closeout 4m; Control Center test and diff check 1m; implementation 0m; rendering 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** S294 starts the next independently evidence-backed V02 role mapping gate after refreshing refs/history and checking the admission plan. Do not claim Woven acceptance or start V03.
