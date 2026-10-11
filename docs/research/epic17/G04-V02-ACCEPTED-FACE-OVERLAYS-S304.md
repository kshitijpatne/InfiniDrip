# G04 V02 accepted-face artwork and colorway review — Slice 304

## Start and verified boundary

- **Start:** 2026-09-30 13:02:44 UTC.
- **Goal:** close a narrow rendered-evidence gap by exercising existing local artwork and colorway overlays on the only currently accepted live technical-flat faces (Tank and Skirt front/back). Verify revision binding, face targeting, layer/role/color metadata, parseability, and absence of remote requests; do not treat these four faces as proof for blocked recipes.
- **Git:** clean at S303 `86af28b396059a64b145dd118ed4a1863586084c`, `Slice 303: map remaining V02 source dependencies`, on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned slice is 303; 304 is reserved.
- **Board:** canonical revision 581; EPIC-17 and G04-V02 In Progress, V01 Done and V03 Backlog; S303 exit evidence/comment are linked. Working estimate is conditional at 57–71 slices, with source waits unpriced.
- **Evidence baseline:** S298 production Chromium verified 73 configurations / 146 face requests, four accepted default faces (Tank/Skirt front/back) and 142 held. S274 exercised a same-revision overlay in the Tee UI, which is now held for independent sleeve geometry reasons; S304 checks overlays directly on the four currently accepted faces.

## Scope and acceptance

1. Use the existing live Style controls and local bundled artwork on Tank and Skirt without modifying production behavior or saved/shared project state.
2. Render both faces for each recipe from the same exact pattern/draft revision. Where artwork targeting is supported, prove it appears only on the intended face/role and retains asset/source/placement/revision identity. If a recipe has no valid artwork target, record that as not applicable rather than forcing it.
3. Select a distinct available local colorway and prove both emitted SVGs carry the same revision-bound color metadata and face silhouette fill. Parse the output and verify overlay ordering/layers, no entity revision mismatch, no unreadable or misleading contour, and no remote asset requests.
4. Retain exact input, per-face metadata, SVGs and manually inspected production Chromium captures. MQF-011 remains `To be reviewed` for the relevant G04 exit; this limited overlay checkpoint cannot close it.
5. No source projection, pattern/cut geometry, production code, V02 status/acceptance, manual-finding status, export behavior or protected byte identities change. Do not work on held recipe composition, V03, G09/D04, G05, physical/factory/readiness claims or post-G17 deferrals.
6. Focused verification is the production build/Chromium runner if required for actual output, Control Center tests and `git diff --check`; no full/global coverage gate applies absent a production change. Preserve any failure and diagnose its cause.

## Risks and delegation

- Existing overlay evidence is from a different recipe and predates the latest held-output matrix; a passing S304 result is strictly limited to accepted Tank/Skirt faces.
- Actual UI workflows are serial and share one preview/browser state; no safe disjoint low-risk work exists. Codex owns the capture, SVG inspection, manual review and closeout. External-agent waits 0m; OpenCode is not invoked.
- Do not claim embedded artwork content or fabric response from an SVG placement boundary/color fill. Source waits for Tee/Fitted, Polo, Woven and Trouser remain independent blockers; Woven placket overlap remains held per maintainer instruction.

## Exit record

- **Result:** the production Chromium replay passed for Tank and Skirt front/back (4/4 faces). Each recipe's front/back faces share one `live-draft:<recipe>:1:4` revision. `builtin-met-221932` artwork is visible only on the front role at layer `ARTWORK`; selected local Charcoal `#3A4150` is on both front and back shell/waistband silhouettes. Every SVG parses and every entity matches its face revision; no external requests occurred. Front faces retain 5 Tank / 2 Skirt POM leader groups, and every leader target resolves to an emitted geometry entity. Back faces have zero POM leaders by current source mapping; this is recorded as intentional face selection, not missing front callouts. Z-order/layer order is `GARMENT_SILHOUETTE → ARTWORK → CALLOUT` on front and silhouette-only on back.
- **Rendered review:** manually inspected the retained four PNGs. Both front artwork boundaries lie within the body silhouette and do not cover visible contour or POM leaders; back views remain free of the front-targeted artwork. The existing S298 output evidence remains the broader measured text/notice-bound review. This overlay check does not claim embedded artwork imagery or fabric response.
- **Verification and diagnosis:** `npm run build` passes with the existing Vite large-chunk advisory. The initial S304 replay stopped at a verifier assertion that incorrectly expected back-face POM callouts; inspection of the exact S304 SVGs and the source map confirmed this recipe's POMs are front-mapped. The assertion was narrowed to front faces; the full actual-browser replay then passed all four faces. The first Control Center closeout run also exposed the expected-last-comment assertion still pointing at S303; the test was updated for S304 and the suite passed 33/33. `git diff --check` passes. The exact passing SVGs, screenshots and matrix are retained in `docs/research/epic17/S304-browser/`. No production code changed, so no changed-module/global coverage or export baseline gate applies.
- **Board closeout:** `E-G04-S304-EXIT` and the exit comment are linked to G04-V02, the EPIC-17 summary card and Epic record through validated commands at revisions 586–589. Board final revision is 589; V02 remains In Progress and V03 remains Backlog.
- **Elapsed time:** 2026-09-30 13:02:44–13:13:15 UTC (10m31s): output-contract and harness review 2m; verifier creation/diagnosis 3m; production build 14s; Chromium replay 1m; manual screenshot review 1m; focused Control Center/diff verification and stale-comment assertion repair 2m; documentation/board closeout 1m30s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- **Landed slice:** pending `Slice 304: verify overlays on accepted technical flats` commit ID.
- **Next action:** use any pattern-specific artifacts supplied by the maintainer for a bounded V02 source-map packet; retain all other holds and keep V03 gated until the full V02 matrix passes.
