# UIQ-03 / UIQ-04 isolated clarity-candidate admission

Authority: maintainer approved the explicit recommendation and said proceed on 2026-10-02 America/New_York. Goal started 2026-10-02 15:24:23 UTC /11:24:23 New York. Feature-spec skill used to freeze falsifiable contracts, states, ownership and non-goals. This admits ONLY isolated native guidance/journey clarity and material behavior-versus-appearance candidates plus independent QA. No production wiring, new numbered Epic, commit/PR/push/merge/deployment or additional UIQ work.

## Verified base, boundaries and risks

Completed local H boundary2026-10-02: both corrected candidates independently
accepted,immutable docs/research/uiq-clarity/CANDIDATE-EXIT.json; candidate/QA
cards Done on board447. Parent releases Backlog/unshipped. Initial dispatch
instructions and snapshots below are historical; current next action is the
separate admitted UIQ-GATE after settled merged Epic17,not contributor restart.

Fetched origin/main a5af5e13c2e967946b3f6035fcea66ff03a5e0e0; root codex/uiq-parallel-candidates HEAD50afb32ea8e5bd42ebb73fda13cc863e89fd9d8f has the same committed tree, with pre-existing local planning/research and accepted UIQ02/UIQ05 files preserved. Epic7 db14b63 ancestry rechecked. Accepted foundation dependency: docs/research/uiq-parallel/CANDIDATE-EXIT.json; preserve ALL existing enhancement/preview source and accepted evidence hashes. Copy accepted foundation files read-only into private contributor checkouts because they are uncommitted; do not use original contributor versions. No change to their APIs/CSS/tests.

Epic17 latest read-only snapshot: HEAD9fbd38f/S372, PROJECT-STATE records S373 complete, V02 remains open, V03 gated, board1817. Its independently advancing worktree C:/Users/kshit/.codex/worktrees/epic-17-g04/designApp is forbidden for writes, messages or interruption. Business lane ownership remains separate. Fresh current-main reconciliation is a later UIQ-GATE obligation, not something candidates can pre-pass.

Stable boundaries A admission/contracts/dependency digest and validated board; G Claude guidance delivery; M separate Claude material delivery; Q exact-model OpenCode independent review after BOTH WORK FINISHED; R Codex actual-diff corrections, focused/rendered/no-egress and settled full gates; H independently accepted candidate-only durable handoff. Numbered landing is deferred as in previous admission: inspect fresh active histories/reservations and assign unique slices immediately before later authorized landing. Never invent/reuse a number concurrently allocated by Epic17. All boundaries retain the same original goal until complete.

Risks: display-only panels could imply readiness or physical certainty, reinvent engine decisions, lose focus during controlled updates, retain obsolete listeners, leak CSS or accept unsafe swatch strings. Explicit counterexamples below must pass. No blocking maintainer decision: existing engines remain authorities. Integration flags, shared ownership, desktop packaging and releases remain held. No guaranteed delivery date; two implementations run concurrently, final verification serialized; failures extend effort, not reduce gates.

## Common frozen contract

Native TypeScript DOM + original scoped CSS only. No runtime dependency, installation, package/lock/config/baseline edit, new catalog/asset, renderer/math, persistence or app entry change. Reuse accepted UIQ02 token names/defaults exactly; import its CSS in standalone previews, not a shared production stylesheet. Each component root has uiq-foundation plus its own uiq-guidance or uiq-material class; selectors REQUIRE its own root, including modifiers/children/media rules. No effects on lookalikes outside that root.

Minimum native button/summary targets44px; normal text contrast4.5:1 and focus3:1; native semantics, keyboard focus,320/390/1440px and480px zoom-equivalent reflow, long Unicode/unbroken/HTML-looking text, reduced-motion and forced-colors with opaque fallback. System fonts, no animation needed. No fetch, images, URL-based CSS, links, fonts, analytics or network import. All supplied text via textContent. No HTML interpolation/body snapshots/shader/React/canvas.

Mount appends exactly one owned root, preserving siblings. Public controller update(snapshot):void and dispose():void; updates never emit callbacks or mutate data. dispose idempotent, update after disposal inert; detached old controls cannot emit callbacks. Multiple simultaneous mounts have independent DOM IDs/state/cleanup. Surviving keyed action buttons and disclosures retain their DOM nodes/focus/open state across controlled update, including synchronous update called from the parent callback. Remove obsolete event handlers; no global listeners/timers. Callback receives a fresh readonly action value, not a mutable alias of supplied data.

Contribution must read local AGENTS/CONTEXT-INDEX/PROJECT-STATE/PROJECT-DECISIONS/ARCHITECTURE, this exact packet, docs/OPENCODE-WORKFLOW.md, relevant existing modules and dependency evidence. Codex provides readonly copied context/dependency inputs; do not overwrite them or treat old main-based status as authority over this admission.

## UIQ-03 frozen API and behavior (P0)

Allowed NEW writes only:
- src/ui/enhancements/guidance/guidance-panel.ts, guidance-panel.css, guidance-panel.test.ts
- ops/ui-candidates/guidance.html, guidance-preview.ts
- docs/research/uiq03/CONTRIBUTOR-RETURN.md and evidence/**

Export types:
GuidanceAction {readonly label:string; readonly step:JourneyStep; readonly field?:string}
GuidanceEntry {readonly id:string; readonly note:Note; readonly action?:GuidanceAction; readonly detail?:string}
GuidanceSnapshot {readonly revisionLabel:string; readonly step:JourneyStep; readonly readiness:StageReadiness; readonly blocker?:StageBlocker; readonly notes:readonly GuidanceEntry[]; readonly fitIntent:string|null; readonly validity:{readonly state:"valid"|"invalid"|"unknown";readonly detail:string}}
GuidancePanelOptions {readonly snapshot:GuidanceSnapshot;readonly onReview:(action:GuidanceAction)=>void}
mountGuidancePanel(host:HTMLElement,options:GuidancePanelOptions):{update(snapshot:GuidanceSnapshot):void;dispose():void}

Import existing Note/Level from src/guidance/note.ts and JourneyStep/StageReadiness/StageBlocker, COACHED_STEPS and journeyChecklist from src/ui/journey.ts. Do NOT call journeyBarMarkup or write/reimplement engine readiness/validation/decision math. Snapshot validity is caller-provided; warn notes never become invalidity or export permissions by inference.

Display revision label literally, five existing COACHED_STEPS names/hints and readiness-driven completion via existing journeyChecklist. Legacy step done maps visually to output without pretending a successful export. Current, completed and blocker-target states are independent visible labels; a current step can also be complete or blocked. Never infer preceding stages complete from navigation position, fit intent, valid inputs alone or an export-looking screen. No navigation/Next/export buttons or physical-ready claims.

Separate fixed headings "Fit preference" and "Digital input validity": null fit is "No fit preference supplied"; caller validity valid/invalid/unknown + full detail is visible; never call preferred fit a validation pass. Fixed caveat: "Digital checks are not physical fit validation." Existing exported readiness describes confirmed file status, not manufacture/sewn fit.

Blocker is a visible role=alert with exact message and a native "Review correction" button emitting its exact step/optional field, label "Review correction". Notes preserve literal full text and severity labels OK/Info/Warning, never color alone, every note including non-actionable warnings remains visible. Stable keyed IDs belong to caller; require unique entry IDs (reject duplicates explicitly before mount/update mutates DOM). Empty notes is an explicit no-guidance state, NOT "all checks pass". Supplied detail appears in a native disclosure with clear summary; empty supplied detail remains literal, not fabricated rationale. An action appears only when explicitly supplied and emits its exact label/step/field once on click/Enter/Space; no guessed target, querySelector into external app, navigation or design write. Repeated IDs from distinct mounts are independent. Controlled update preserves surviving keyed buttons/details; removed or replaced action buttons cannot emit obsolete requests.

Preview: valid-but-not-reviewed, invalid/blocked with exact field review, unknown validity, no fit/empty notes, all severities, legacy done with unconfirmed file, current-and-complete state, long/hostile Unicode and two mounts; explicit callback/status display, never actual app navigation.

Focused tests: every production branch/function100%, deep-frozen snapshot/options, all note levels/stages/readiness/validity/blocker/optional paths, duplicate-ID rejection leaves prior DOM intact, legacy done, action callback exact once/fresh object, update has no callback, synchronous controlled update keeps node/focus/details, idempotent disposal + detached/obsolete controls inert, siblings/multiple mounts, literal malicious text. No snapshots that merely bless markup.

## UIQ-04 frozen API and behavior (P0)

Allowed NEW writes only:
- src/ui/enhancements/material/material-panel.ts, material-panel.css, material-panel.test.ts
- ops/ui-candidates/material.html, material-preview.ts
- docs/research/uiq04/CONTRIBUTOR-RETURN.md and evidence/**

Export types:
MaterialSnapshot {readonly revisionLabel:string;readonly fabric:StretchFabric|null;readonly easeGuidance:string|null;readonly compatibility:{readonly state:"compatible"|"mismatch"|"unknown";readonly detail:string};readonly color:string;readonly appearance:Appearance|null}
MaterialPanelOptions {readonly snapshot:MaterialSnapshot;readonly onReview:(target:"fabric"|"appearance")=>void}
mountMaterialPanel(host:HTMLElement,options:MaterialPanelOptions):{update(snapshot:MaterialSnapshot):void;dispose():void}

Import existing StretchFabric/STRETCH_FABRICS from src/drafting/ease.ts and Appearance/APPEARANCE_TEXTURES/normalizeHex/parseAppearance from src/ui/appearance.ts. Do NOT call suggestedEase/fabricEaseNote or any drafting/renderer function: easeGuidance is already computed upstream and displayed literally. Never recalculate, apply default values, set ease/stretch/color/appearance, fabricate measurements or modify a preset/schema.

Two distinct sections "Material behavior guidance" and "Screen appearance only", revision literal. Show provided fabric name/family/stretch exactly and all five existing preset names/families/stretch percentages read-only. If fabric null show unknown; known preset requires exact name/family/stretch match, otherwise visibly label custom/unverified. All preset values are heuristic defaults, not measurements/certified material specifications. Numeric stretch must be finite and >=0 to present as a usable supplied value; invalid raw values stay visible with correction, never clamped; no invented upper cap for actual stretch. Null ease guidance is explicit unavailable; supplied empty/hostile text stays literal. Compatibility status and exact detail supplied by caller, never inferred from appearance/recipe/name. Fixed caveats: advice is a heuristic, not drape physics; physical sampling is still needed; color/texture/shine do not change material behavior or establish compatibility.

Color accepts only normalizeHex-valid six-digit hex for inline swatch color; any invalid input appears literally with "Preview unavailable" and no use of the raw value in CSS/attributes capable of loading URLs. Appearance uses existing parseAppearance for supported texture and finite shine0–100; null/malformed values are explicit unavailable and raw texture/shine values remain visible. Never silently clamp or replace invalid appearance. Known textures have native CSS-only illustrative cues (smooth/woven/rib/heather), shine is a static screen cue, not reflection/BRDF/physics; invalid color OR appearance withholds the appearance preview. Raw hostile runtime fields must remain literal and cannot become arbitrary classes/styles/URLs. No images/SVG markup generation/remote gradients.

Two stable native "Review fabric" / "Review appearance" buttons emit only that target on explicit click/Enter/Space. There is no preset chooser or Apply button in this candidate. Buttons remain same nodes/focused across updates, including controlled callback updates. No callbacks on mount/update or swatch hover. Unknown/mismatch/invalid information does not disable the review affordance or pretend engine export gating.

Preview: all five presets, custom/unverified, missing fabric/guidance/appearance, compatible/mismatch/unknown, all four textures and shine0/100, invalid color/shine/texture/stretch, malicious long strings, two mounts and controlled updates. Data comes from existing tables and synthetic labeled states, not an invented fabric test.

Focused tests100% owned module all four metrics, deep freeze data/tables, full optional/state/guard matrix, invalid values and CSS injection/XSS, known/custom classification exact match, no hidden default/clamp, all cues, callbacks exact once, controlled focus, disposal/obsolete listeners/siblings/multiple mounts.

## Independent QA (Q) and Codex ownership

Claude Code sonnet/high owns G and M in DIFFERENT worktrees, two headless sessions. No commits/PRs/push/install/full global gate. Exact owned files only; copies of context and foundation are readonly inputs. Each returns explicit WORK FINISHED + JSON status, branch, changed_files, tests_run, coverage, build_and_typecheck, rendered_or_export_evidence, known_limitations, follow_up_needed. Honest blocker instead of invented proof. Focused command installed npx vitest run <owned test> --coverage --coverage.include=<owned module> --coverage.reportsDirectory=<private focused directory>, then npx tsc --noEmit. Do not delete generated directories, change assertion/timeout/config/threshold or run repeated full gates.

After BOTH WORK FINISHED, Codex freezes and records actual returned snapshot hashes, supplies exact files to a THIRD disjoint OpenCode QA worktree. Required opencode/muse-spark-1.3-contributor-free --variant xhigh, normal build agent; no fast/OpenAI/substitute. Confirm metadata at dispatch. QA owns only docs/research/uiq34-qa/RETURN.md, evidence/** and test-only adversarial checks under ops/ui-candidates/qa/** (Node built-in or browser, not new product code/config). Read/audit both snapshots + source modules + accepted foundation; no source edits, other-worktree reads, shared governance/board edits or premature production claims. Inspect actual contracts/negative states, actions/focus/lifecycle, literal text/CSS, data honesty and scoped keyboard/narrow behavior where tool available. Wait WORK FINISHED before result inspection. QA findings are suggestions, not acceptance; Codex independently verifies/fixes. No manufactured QA dependencies on Epic17 or cycle requiring candidate Done before review starts.

Codex owns admission/goal/board/evidence, combined unshipped clarity preview and rendered assertion harness under ops/ui-candidates/clarity*, review docs/research/uiq-clarity/**, exact corrections in owned new modules, browser/runtime output and final acceptance. Prior ops/ui-candidates/index/review/foundation/artwork and src/ui/enhancements/foundation/artwork MUST remain hash-identical. No writing existing core source.

Final gates: focused100% four metrics each, root and standalone preview typechecks, production build with unchanged app entry, complete settled own-product suites/global100% and export identity, all operational/board tests, actual browser screenshots/DOM/action/contrast/target/reflow/media/no-egress evidence, protected source/dependency/digest comparison, final actual-diff audit. Foreign tmp/ui-repo-sources research suites excluded from discovery only, all original exclusions/thresholds/assertions preserved; use measured one-worker CLI scheduling from prior proof, no runner defaults change. Full gate once after settled corrections, focused first on any failure, retain diagnostics. Board child cards close only after Codex verified exit proof; parents remain Backlog/unshipped. Reviewer/date identifies isolated acceptance, not deployment.

Primary usage36% used at start; weekly68% informational. Check at boundaries and before expensive gates; no pause solely at percentage/weekly level. No model switching claimed where unavailable; Luna-max default where selectable, short Sol high/extra-high only as necessary, never routine max/Astra. No reset credits/account changes. Preserve live terminal IDs and last verified boundary on actual primary exhaustion; quiet heartbeat resume if needed, no duplicate contributors or constant check-ins. Record focused/global/rendered/edit/external-wait/decision time separately, explicitly unmeasured where not instrumented.

Single next action: create bounded worktrees/readonly inputs and validated candidate/QA tracking, then dispatch the two Claude contributors concurrently. Wait their explicit WORK FINISHED, collect once, dispatch exact-model QA, then Codex settles/verifies both. Production rollout is later, not goal completion here.
