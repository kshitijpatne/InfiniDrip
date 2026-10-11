# G04 V02 — Approved Polo collar-point keyed callout — Slice 380

## Start boundary

- Started 2026-10-02 20:41:13 UTC on `codex/epic-17-g04` from clean S379 commit `de3b07a852baca03f91dbfb2c41b129cb482869f`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Highest assigned slice is 379; S380 is reserved. Canonical board is revision 1930; EPIC-17 and G04-V02 are In Progress, V01 Done and V03 Backlog. Integrated tally remains 56 accepted / 90 held across 73 configurations / 146 view requests; all 34 Polo faces remain held.
- Goal was verified `active` at the S379 boundary. Its original “Begin by admitting” phrase is stale, while the objective still applies through G04 gates and safe merge. Goal status/wording will not be changed; no UI resume is needed while active.
- Ordinary usage is allowed at 47% primary and 85% weekly informational. No remaining approval is needed for the C marker/schedule. S379's distinct callout crossings and the 0.25 cm sleeve residual remain independent blocking evidence; S380 will not attempt to clear them.
- The maintainer approved the exact S378 proposal for all 17 Polo option rows: replace only the front `Collar point extension` label/leader with a source-centered `C` marker at `upperCollar.frontTip:end` and show the unchanged complete POM text/value/tolerance as the `C` row in a schedule below the flat. This is a view-only mapping and adds no physical notch or construction claim.
- No safe delegated task: the feature binds the current draft/revision, same-revision source anchor, emitted marker/key/schedule, measured text and vector frame as one production rendering change. Codex owns implementation and integrated review.

## Scope and acceptance

Implement only the approved `Collar point extension` presentation in Polo `FRONT_FLAT` production output. Preserve the source-authored horizontal edge-delta measurement, exact same-revision `upperCollar.frontTip` endpoint, target outline identity, all exact POM words/value/tolerance, all other callouts and all pattern/stitch/cut geometry.

- The marker is a 0.22 cm radius ring centered on the transformed `upperCollar.frontTip:end`, with centered `C` glyph and source POM/revision/target metadata. It is rendered above the existing pattern/callout layers.
- Suppress only the C text leader and inline text; preserve every other POM primitive/error. Emit the full unchanged C row in a readable bottom schedule, below existing construction notices and in the same expanded SVG frame. Avoid clipping at option-dependent sizes.
- Exercise all 17 supported option rows against the exact source option matrix and confirm same-revision identities, values and tolerance. Exactly two prior renderer failures (`standFrontRise-max`, `collarPointExtension-min`) are specifically expected to clear their `Collar point extension` `TEXT_COLLISION`; other issues remain actionable and all 34 faces stay held.
- Verify front output and its back partner, browser console/errors, measured schedule bounds, existing labels, colorway-on/off layering, retained S379 collision behavior, and rendered whole/detail/schedule output across all options. Compare unrelated source/POM/geometry identity and legacy export outputs.
- Focused production tests must attain 100% statement, branch, function and line coverage for changed production code. Run changed-area tests first; focused build/export identity and Chromium matrix apply because this changes production renderer. Run Control Center 42/42, JSON/evidence validation, `git diff --check` and command-layer board evidence. Do not run the full repository/global coverage gate until the settled integrated Epic/PR candidate.

## Non-goals and holds

No other Polo leader relocation, source or stitch graph change, pattern/cut geometry change, new POM/construction mark, option or colorway scope change, export baseline change, board status transition, face acceptance, all-seven criterion relaxation, V03 start, broad UI redesign, G05/G09 scope, physical sampling, supplier contact, launch spend, hosted service or production-readiness claim. Preserve legacy DXF behavior and protected export byte identities. Do not claim physical fit or factory acceptance.

## Implementation

- `src/render/technical-flat-live.ts` now marks only the exact Polo FRONT_FLAT `pom:polo:collar-point-extension` primitive when its revision, `upperCollar.frontTip` source entity and upper-collar outline target all match. Duplicate or stale/misdirected matches return a POM issue. The helper is a no-op on back faces and for unrelated callouts.
- `src/render/technical-flat.ts` validates the optional `keyed-marker-schedule` presentation and its key/radius.
- `src/render/technical-flat-svg.ts` suppresses only that callout's inline leader/text, renders its 0.22 cm source-centered C ring with the exact source/revision/target metadata, and reserves measured frame space for the full unchanged `C  Collar point extension: <value> cm (±0.2 cm)` schedule row below any notices. Other callouts keep their normal renderer behavior. Invalid heading or row font metrics fail closed.
- No pattern, stitch graph, cut geometry, POM method/value/tolerance, export, receiver/profile, acceptance rule or face status changed.

## Verification and rendered evidence

- Focused changed-area suite: 85/85 passed. Changed production modules each have 100% statement, branch, function and line coverage.
- `npm run build` passed; Vite retained its existing large-chunk advisory.
- Chromium replay of the exact S331-supported 17 Polo rows used same-revision draft data and the production callout mapper/SVG renderer. All 17 keyed front diagnostics emitted with zero browser errors; the prior base C `TEXT_COLLISION` rows `standFrontRise-max` and `collarPointExtension-min` were reproduced, and the keyed variant cleared both. The complete unchanged POM text and tolerance, exact `upperCollar.frontTip:end` point, target outline, revision, radius and measured schedule row were checked per option.
- Collision-count reconciliation: S378 and the final S380 replay use the same 17 option values, per-row live revision identity and actual SVG renderer; each reproduces exactly two unkeyed C `TEXT_COLLISION` rows. An intermediate S380 harness revision showed only one because it inserted an isolated callout without applying `mapPoloDimensionCallouts`, omitting the live callout's dimension references and layout state. The corrected harness prefers the exact built callout, and maps an isolated fallback through the same Polo dimension mapper. The final matrix records the cause and correction; no input or production behavior changed to force the expected count.
- The paired BACK_FLAT mapper was a no-op and its render result was exactly equal before and after for all 17 rows. Source path primitives and all non-target POM primitives were equal between base/keyed inputs. In the 15 rows where the unkeyed base rendered, serialized pattern-source path IDs/data/revisions also matched exactly.
- Colorway-on diagnostic rendering passed for all 17 rows on the currently closed mapped roles `front`, `buttonPlacket`, `outerStand`, `underCollar`, and `upperCollar`; colorway-off keyed rendering also passed 17/17 and retained the marker/full-text row. The sleeve role is intentionally omitted from this check because the existing full Polo colorway fails closed with `COLORWAY_CONTOUR_UNCLOSED` at the independently held sleeve outline. This is evidence for the collar/body overlays only, not full-colorway acceptance.
- Manually reviewed the default marker detail, standFrontRise-max schedule, and collarPointExtension-min whole output. The C marker is legible at the source endpoint and the full scheduled text is readable. Existing neighboring POMs still visibly cross geometry/labels and remain a readability blocker.
- Protected output checks: `src/export/regression.test.ts`, `src/quality/export-identity.test.ts` and `src/export/polo-final.test.ts` passed 21/21 (including the eight protected legacy hashes and byte-identity checks). No baseline moved.
- `npm run control-center:test` passed 42/42 after exit evidence was replayed. The 17-command validated board replay started at revision 1933 and ended at revision 1950, keeping EPIC-17/G04-V02 In Progress. Both command and matrix JSON parse; the canonical board status/evidence cross-check and `git diff --check` pass.
- Persistent outputs include `polo-keyed-render-matrix.ts`, `collar-point-callout-matrix.json`, `search-summary.json`, the default detail, standFrontRise-max schedule and collarPointExtension-min whole PNGs, plus each option's SVG/whole PNG and selected detail/schedule PNGs. Start/exit commands and the replay helper are in this folder.

## Acceptance status and remaining holds

The approved C-presentation change is implemented and its local two collision cases clear across the all-option diagnostic. The normal Polo production compiler still withholds views because the separate 0.68 cm sleeve-cap assembly residual exceeds the unchanged 0.25 cm limit. The S379 matrix's remaining front-leader crossings and collisions are unaffected. All 34 Polo faces remain held, the integrated tally stays 56 accepted / 90 held, G04-V02 stays In Progress and V03 stays Backlog. No G04 acceptance criterion is passed by this slice; no claim of physical fit, factory acceptance, production readiness or CAD compatibility is made.

## Exit record

The S380 closeout is durable at board revision 1950. Active-time estimates: production implementation 12m; focused tests/100% coverage/build/export checks 8m; 17-option Chromium and rendered review 4m; packet/state/architecture/board closeout 3m; external-agent waits 0m; maintainer-decision time 0m. Next, reconcile the already-approved UI planning overlay at the safe S380 boundary as directed by the maintainer, then continue G04 V02 holds. Do not advance V02/V03 or release faces while any independent hold remains.
