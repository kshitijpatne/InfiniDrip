# EPIC-16 / G03 admission and execution contract

**Status:** Admitted by the maintainer on 2026-09-26 after EPIC-15/G02 closed and merged.
**Epic:** EPIC-16 — G03 Measurement-first creation.
**Admission slice:** Slice 244.
**Verified repository start:** `origin/main` at `afb4bba` (Slice 242), with the already recorded Slice 243 manual-quality findings at `9c0ac8c8ef3f2784c56e654effc4480172d73430`. Slice 243 is preserved in this Epic branch and will reach `origin/main` with its reviewed PR.
**Current implementation boundary:** Local-first, deterministic, user-directed digital drafting for the seven existing recipes. No claim of fit validation, physical fit, production readiness, or professional qualification.
**Conditional target exit:** 2027-05-14, from the current roadmap estimate; reforecast at M01 and M02 exits. This is a planning estimate only.

## Decision and intended result

The maintainer explicitly admitted G03. EPIC-16 implements the roadmap's M01 measurement coaching, M02 deterministic one-size creation and M03 separately approved grading, then closes only after an evidence-backed final review and a safe merge to `origin/main`.

The initial product result is one custom digital draft that records what the user entered, shows how each value is used, keeps unresolved design targets explicit, and opens the existing full editor with the same recipe, measurements, options, and geometry. A user may choose a named preset as a starting point, but a preset stays visibly a preset and never becomes a claim about that wearer's body. The flow does not require step-by-step use after creation.

The seven existing recipes remain the complete recipe set: Tee, Darted Tee, Tank, Polo, Woven Shirt, Skirt, and Trouser. Each route must follow the field-to-output semantics and limitations in the accepted C03 contract. No recipe is fit-qualified by this Epic. Product language must describe generated output as a digital draft, not a garment that is known to fit.

Grading is a separate opt-in operation. A custom wearer cannot inherit the repository's XS–XL rule by default. A grade plan must identify its population or explicitly state that it is a product-defined digital size range, name the chart/rule source or decision, state base size and labels/range, declare each increment and exception, and receive explicit user approval before it produces a graded run. A one-size design and one-size outputs remain available without a grade plan.

## Verified starting point and implementation facts

EPIC-15/G02 closed at Slice 241 after PR #11 merged to `origin/main`; `PROJECT-STATE.md`, `docs/release/EPIC-15-G02-MERGE-EXIT-S241.md`, and Control Center revision 315 record that state. The current G03 branch contains Slice 243's separate manual UI findings; MQF-001 and MQF-014 are G03 review checks, and MQF-013 is a measurement-route clarity check. They do not authorize broad application redesign.

Repository inspection for this admission confirms:

- `src/drafting/measurements.ts` defines one numeric-centimetre `Measurements` object and `STANDARD_M`. `src/drafting/facets.ts` applies broad body/finished labels; C03 corrects the semantic conflicts those broad labels cannot express.
- `src/ui/field-provenance.ts` has C03-aligned definitions and append-only edit history, but `recordedAt` is an edit time unless a future capture guide supplies a distinct capture time. New capture evidence must not relabel existing edits as body-capture events.
- `src/ui/project-workflow.ts` and the G02 project/style records provide local persistence, style identity and revision history. G03 must use that foundation rather than create a second unsynchronized project store.
- Recipe geometry, recipe-specific fields/options, grade rules, POMs and the legacy exports are under `src/drafting/` and `src/export/`. The editor and rendering remain in `src/ui/` and `src/render/`.
- C03 says no recipe has accepted fit-qualified quick-start status. Exact landmark capture procedures require licensed source access or a separately authored, qualified technical-designer-reviewed guide. The current `STANDARD_M` is a digital fixture, not a measured person.
- C03 identifies two source-level contradictions that must be handled visibly: skirt style metadata offers 95–120 cm while the shared length guardrail stops at 100 and warns above 95; Trouser thigh and knee mappings use unreviewed pattern heuristics and must remain finished-garment targets, not body measurements.
- Tee, Darted Tee, Tank and Polo derive neck openings from chest; do not ask for or fabricate a wearer neck measure for them. `armholeDepth` is a pattern target, not a captured body measurement. `sleeveLength` and Trouser `inseam` are finished targets. Ease and Tank strap/neck controls are design controls.
- The existing grade rules and graded output path are digital repository behavior, not an approved population chart. Existing unchanged legacy export byte identities remain protected throughout this Epic.

## Product and data decisions fixed by this admission

1. The route starts from an explicit garment selection and offers two clear choices: guided measurement-first creation or direct use of the existing full measurement editor. Neither route silently advances another route or hides the user's ability to edit.
2. Each recipe lists only fields that its current geometry actually consumes. Every field is named by meaning and reference frame: body input, finished-garment target, pattern target, style control, or derived output. Help must say what is known and what remains unresolved.
3. A capture guide may only give anatomical landmarks, posture, measuring path, and technique when supported by an accepted source or qualified review. If that evidence is unavailable, the UI says so and offers the value as user-entered/unconfirmed only where C03 permits; it must not present invented steps as authoritative instruction.
4. Missing, conflicting, invalid, and unresolved values remain visible with a correction or choice path. The route does not silently clamp, round a tape reading to an increment, average conflicting values, infer gender/body shape, or substitute an unrelated `STANDARD_M` value.
5. Every default or retained value is visibly labeled by provenance. A default needed for geometry is an explicit digital draft choice the user can inspect and accept; it is never recorded as a user measurement.
6. A successful M02 action saves one custom-size style through the existing project/style workflow, retains the capture/source distinction, and opens the full editor with the same recipe and values. The result is deterministic and must match the full-editor path for identical complete inputs.
7. Grading remains unavailable for a custom style until a grade plan is complete, reviewed in the UI, and explicitly approved by the user. The plan names its rule source/decision, base size, size labels and range, per-measure/POM increments, exceptions, and review/approval state. The user can continue with a single size at every stage.
8. Existing projects, SaveFile v1–v5 compatibility, local-only operation, current recipes, current export baselines, and G01/G02 decisions remain intact. New provenance fields require strict versioning and non-destructive migration.
9. G03 is not a route to a different garment or a general visual redesign. The 15 manual quality findings stay in their existing register; review only the scoped MQF checks at their specified G03 exits.

## Ordered slice plan

The baseline is seven implementation slices, plus this admission and a final review. This fits the roadmap's 6–9 landed-slice estimate. Failures or incomplete all-recipe evidence add a separately numbered remediation slice; no acceptance gate is weakened to preserve the estimate.

| Slice | Packet | Scope and exit evidence | Dependency / boundary |
| ---: | --- | --- | --- |
| 244 | G03 admission | This contract, verified start point, seven-recipe semantic boundary, risk/delegation plan, linked board work, and EPIC-16 transition to In Progress. No product code. | G02 closed; maintainer admitted G03. |
| 245 | M01 capture contract | Versioned measurement-first session and field-resolution model over G02 records; exact per-recipe required inputs, targets, controls, explicit preset/default handling, unit/precision/provenance, capture source, and missing/conflict actions. Resolve the skirt range contradiction for this route. | Slice 244. Do not publish unreviewed capture procedures. |
| 246 | M01 guided route | Garment selection with guided or direct-editor routes; recipe-specific landmarks/help only where source-qualified; accessible capture/edit flow for all seven existing recipes. Clearly distinguish body facts, garment/pattern targets, controls, and calculated outputs. | Slice 245. No forced wizard and no false fit claim. |
| 247 | M01 validation and rendered QA | Complete missing/invalid/conflict handling without clamping; provenance and resume behavior; narrow viewport and accessibility verification; fresh and resumed stage completion proof. Review MQF-001, MQF-013 and MQF-014 for scoped coverage. | Slice 246. M01 must pass every recipe's source/field matrix. |
| 248 | M02 deterministic one-size creation | Create and save one custom-size style through the established local project workflow from explicit measurements, targets and accepted defaults; retain capture/source distinctions and make selected-size pattern outputs available first. | M01 complete. No grade inheritance or silent schema fillers. |
| 249 | M02 editor/output parity | Open the created design in the full editor; prove stable geometry, recipe options, POMs and one-size exports match the existing workflow for identical resolved inputs across all seven recipes. Withhold whole-run Tech Pack, Projector and Marker until an approved grade plan exists. Preserve protected legacy export identities and record actual output comparisons. | Slice 248. Resolve discrepancies with numbered remediation. |
| 250 | M03 explicit grade-plan record and review | Add strict versioned grade-plan data and user review/approval with rule source/decision, base, labels/range, increments, exceptions and provenance. Custom wearer defaults to one size and has no approved run until explicit approval. | M02 complete. Legacy default graded behavior remains byte-identical for unchanged legacy designs. |
| 251 | M03 approved graded output | Integrate approved plans with existing grade and cutting/export paths; check every size and POM/cutting quantity reconciliation, per-size overrides, unsupported exceptions, stale state, and invalid-state visibility. | Slice 250. No silently inherited XS–XL chart or physical fit claim. |
| 252 | G03 final review and merge exit | Reconcile all accepted criteria; remediate with new slices; run full coverage, strict builds, protected export identities, Control Center checks, browser/narrow/accessibility checks, actual output replay, PR review and safe merge verification. Close only after the board, `origin/main` ancestry, and exit evidence agree. | M01 → M02 → M03 complete. |

## Slice 245 capture-contract resolutions

`src/ui/measurement-capture.ts` is the versioned, recipe-specific record of
what the user entered, selected, or explicitly accepted as a digital preset.
It preserves raw text, entered unit, exact centimetre conversion, source label,
optional method/date/measurer, evidence state, and append-only reading revision.
The session starts empty; repeated readings remain separate and require a
deliberate selection. It rejects unknown recipes and stale/unsupported field
definitions. It does not attach or rewrite a project until the existing G02
workflow is used by M02.

The source audit
(`docs/research/epic16/MEASUREMENT-HELP-SOURCE-AUDIT.md`) found no accepted
fit-qualified measurement procedure for the seven current recipe mappings.
M01 may explain the digital meaning, present use, guardrail and uncertainty of
each input; it may not invent anatomical steps. User-entered body fields remain
unconfirmed unless supported by the contract's allowed evidence. A preset is
added only after an explicit user choice and is labeled as a digital starting
value, not wearer data.

The guided Skirt route uses the existing shared 40–100 cm software range. The
Maxi style's 100–120 cm extension is unavailable in this route; entries above
100 cm remain inspectable and block continuation with an explicit explanation.
No value is clamped and no legacy SaveFile range is changed.

The Claude Code mapping audit's executed findings and Slice 245 dispositions
are recorded in
`docs/research/epic16/ONE-SIZE-RECIPE-MAPPING-AUDIT.md` §12. In particular,
known differences between an entered digital target and a legacy draft/POM
remain visible facts. Slice 245 does not alter legacy drafting formulas or
export baselines. M01 help and output review must describe those mappings
truthfully; geometry correction, option fallback, and output identity decisions
stay at their assigned M01/M02 gates. Woven hip-station validity is an explicit
M01 check in Slice 247. Body inputs retained only for the Tank body view must
be distinguished from values used by its pattern block. Any acceptance failure
that needs code beyond its assigned slice gets a separately numbered
remediation slice.

Legacy `Measurements` still has more keys than some recipes use. M02 must keep
unused values out of the capture record and identify any value required to
populate a legacy record as an explicit, reviewable digital default. It must
not copy another recipe's capture or label a schema filler as a body reading.
One-size filenames and whether whole-run outputs require an approved plan are
decided and verified in Slices 248–249.

## Slice 246 route decisions

The Garment stage offers the existing full editor and an optional guided
measurement route as separate, explicit choices. The guided route uses
recipe-specific field definitions and the source-audited help catalog. It
states field kind/reference frame, current digital draft use, known unresolved
mapping, software guardrail, and source scope. Because no accepted
fit-qualified capture procedure exists, it does not teach anatomical
landmarks, posture, or tape paths. It preserves entered raw text and unit,
optional source/method/date/measurer notes, separate readings and explicit
selection. It never averages readings or treats a preset as wearer data. The
existing full editor remains available after garment selection.

The first-run project repository creates a starter style to initialize the
workspace. That generated record is not proof that the user advanced from the
Garment stage. Slice 246 carries an `initializedFirstRun` signal through both
journey selection and restoration so Measure remains pending until the user
advances. Slice 247 attaches capture sessions and unrecorded text drafts to
existing G02 style records through a strict additive IndexedDB store and
package format. It validates stale-write conflicts, persistence failure
behavior, all seven field routes, the Woven-shirt hip-station blocker, narrow
layout, accessible field semantics, and reload resume. Its production-browser
screenshots, Axe results, accessible role tree and layout metrics are recorded
in `docs/research/epic16/evidence/S247-guided-measurements-verification.json`;
the review and exit boundaries are in
`docs/research/epic16/S247-M01-VALIDATION-EXIT.md`. The full 127-file/1,898-test
suite passed at 100% statement, branch, function and line coverage; strict app
and Electron builds and Control Center tests passed. M01 is complete after its
validated Control Center transition. Slice 248 began M02 under the existing
one-size, recipe-parity, and protected-output gates. Its exit evidence is
recorded in the Slice 248 section below.

## Acceptance gates

### M01 — guided measurements for every existing recipe

- Seven recipe routes are checked against the complete C03 field matrix. Only values consumed by that recipe are requested; derived neck values, finished targets, pattern targets, style controls, and body measures remain distinct.
- Each body-measure instruction that specifies anatomical technique has an accepted source or qualified review. No paid source, standards access, or external technical service may be purchased under this admission. Unsupported capture procedures are visibly withheld; unresolved digital targets can only be offered as explicit user choices under their C03 semantic kind.
- Values preserve entered unit and precision plus capture date/method/source where the user supplies them. Existing edit history is not relabeled. Presets/defaults are disclosed and never passed off as wearer measurements.
- Every missing, conflicting, invalid, or unresolved value has an explicit correction or acceptance path. Typed values are not silently clamped or rounded to a UI step. Invalid combinations remain visible and block only dependent actions.
- A fresh and resumed app prove that a stage is complete only after the user completed it; test M01 at narrow sizes and with keyboard/screen-reader accessibility checks.

### M02 — deterministic one-size creation

- A user can choose one garment, capture/select the complete values needed for its current deterministic digital draft, choose all unresolved targets/defaults explicitly, create one design, and continue in the existing full editor.
- The design is saved by the G02 project/style workflow and survives reload. Its capture values and unresolved/selected values retain distinct provenance.
- With the same resolved inputs, guided creation and the existing full editor produce the same recipe options, geometry, POMs, and one-size exports for all seven recipes.
- No result is described as physically fitted, fit-qualified, production-ready, or supported by a population chart. No style is forced through a wizard.
- Existing project/SaveFile migration and all eight protected export identities remain unchanged.

### M03 — separately approved grading

- A newly created custom-size style remains single-size by default. No existing recipe size table is silently attached as if it describes the wearer or a population.
- A graded run requires a versioned plan with a declared population or product-defined digital range; named source/decision; base size; size labels/range; per-measure/POM increments; explicit exceptions/overrides; review state; and user approval.
- Changing a base input or plan makes dependent grade outputs visibly stale and requires a fresh review/approval before export. Invalid plans remain visible and cannot emit current-looking output.
- Approved per-size measurement tables reconcile with cut-ready size geometry/quantity data and the appropriate selected-size/whole-run exports. One-size exports remain usable without a grade plan.
- Legacy existing designs preserve their current export bytes. Digital plan approval is not a fit or sample approval.

## Boundaries, risks, and unresolved evidence

| Risk or unknown | Current evidence | Required treatment |
| --- | --- | --- |
| Capture technique qualification | C03 defines field semantics but says exact landmark procedures need licensed content or qualified technical-designer review. | No purchase is authorized. Collect public primary evidence where sufficient; seek maintainer technical review if available; otherwise withhold authoritative capture steps and retain digital target choices without fit claims. |
| Measurement record migration | G02 observations currently record edits; capture events have richer C03 semantics. | Define a versioned additive capture/session schema and strict non-destructive migration. Do not reinterpret old values. |
| Recipe body-to-pattern mapping | Several existing draft relationships are heuristics or fixed formulas, including Trouser thigh/knee and chest-derived necklines. | Expose only truthful existing behavior; retain mappings as digital draft rules. Do not characterize them as body-fit transformations. |
| Grade rules | Current repository XS–XL increments lack a named population chart and approval. | Require explicit user-reviewed plan for new custom styles; maintain a legacy-compatible path and byte identities. |
| Export scope | G03's parity gate touches legacy, selected-size, whole-run, and cutting outputs. Broader technical-pack redesign belongs to later admitted capability work. | Keep this Epic's export changes limited to parity and truthful grade-plan use; do not change protected files without a documented reason and explicit maintainer approval. |
| Control Center admission | Board is revision 315; EPIC-16 is Backlog and has only its summary card. | Link this packet, create sequenced M01/M02/M03/final-review work cards, record evidence criteria, and transition EPIC-16 only through the validated command layer. |

## Ownership and delegation

Codex owns this admission, shared data contracts and migration, recipe/drafting integration, project/style persistence, grade semantics, cross-output parity, Control Center, full verification, review, and merge. No contributor may edit those files or merge to `main`.

At M01, reassess safe, disjoint contributor tasks under `docs/OPENCODE-WORKFLOW.md`. Potential independent tasks are a source-traced, non-prescriptive measurement-help evidence dossier and an isolated narrow-viewport/accessibility audit with recommendations. Each task gets its own worktree, exact model/reasoning check, immutable handoff packet, and exclusive file ownership. Require the contributor's explicit `WORK DONE` signal before reviewing its files. If the requested model configuration is unavailable, do not substitute another model; report the specific unavailable configuration and continue Codex-owned work that does not depend on it.

## Verification and closure

For every implementation slice, run the focused and full gates required by the repository. Preserve 100% statement, function, branch, and line coverage and the eight protected legacy export identities. At every recipe boundary inspect actual drafted/rendered/exported outputs, not tests alone. At M01 and M02 verify the app in the browser at supported narrow and desktop viewports; at M03 replay selected-size and whole-run/cutting outputs. Final review records exact commands, counts, hashes, browser/output evidence, residual limits, and downstream reforecast.

EPIC-16 remains open until every linked work item is Done with verified non-incomplete evidence, its summary card is Done, the Epic is Closed through the validated Control Center command layer, the reviewed pull request is safely merged, and `origin/main` contains the reviewed head in its ancestry. Closure does not admit G04 or any later Epic, approve manual quality findings for broader roadmap work, authorize costs or supplier contact, or establish physical fit.

## Slice 248 — M02 custom one-size materialization

The maintainer confirmed on 2026-09-26 that a custom style without an approved
grade plan exposes selected-size pattern outputs only. Whole-run Tech Pack,
Projector and Marker exports stay withheld until a grade plan has been reviewed
and explicitly approved. Existing legacy-style export behavior remains intact.

Slice 248 turns a ready, recipe-matched M01 capture into one deterministic
custom-size style using the existing local project/style workflow, and opens
that saved style in the full editor. Every value consumed by the chosen recipe
must come from a selected capture reading or a clearly named, inspectable and
explicitly accepted digital default. Capture provenance remains distinct from
controls and derived values. The unchanged SaveFile v6 schema requires all
legacy measurement keys, so fields not consumed by the chosen recipe receive
`STANDARD_M` as explicit schema-only padding. Those keys are never treated as
body measurements or recipe inputs, carried from another style, or used to
claim fit; a custom style remains locked to its recipe. Do not inherit an
XS–XL chart or change legacy SaveFile schemas or protected export bytes. S248
establishes the create/save/resume boundary; S249 owns seven-recipe geometry,
options, POM, selected-size export parity and actual output comparison,
including the whole-run withholding gate.

S248 acceptance: unresolved or invalid capture cannot create a style; explicit
accepted defaults are disclosed and retained with the proper provenance; a
successful action saves exactly one style with recipe, target style, full
options and resolved measurements, preserves its capture record, and opens the
full editor. Inactive SaveFile measurement keys are initialized from the
documented schema-only baseline above and are not part of this style's capture
history. Repeating with identical resolved values is deterministic. Reload
and project/style switching do not lose or misattribute the captured source.

S248 exit evidence (2026-09-26): full Vitest coverage passed with 546/546
suites, 1,919/1,919 tests, and 100% statement/branch/function/line coverage;
`npm run build` passed; `npm run control-center:test` passed 33/33. The
production preview on isolated `http://localhost:4176/` created a Woven-shirt
custom style from 24 explicitly accepted digital presets, resumed it in the
full editor, and showed selected-size-only Check text without a graded-run
claim. At Export, the picker read “One size”; SVG, DXF, PDF and A0 remained
enabled; Tech Pack and Projector were disabled with the approved-grade-plan
reason. Automated tests proved Marker and whole-run freeze stay blocked and no
frozen manifest is created. The user's existing `http://127.0.0.1:4173/` tab
was untouched. Responsive and accessibility cases passed in the full test
suite; the in-app browser did not expose viewport resizing, so a separate
narrow-browser screenshot was not recorded. All eight protected legacy export
identities passed. M02 remains In Progress; S249 owns all-recipe output parity.

## Slice 249 — seven-recipe parity and M02 exit

Slice 249 is complete. With the same resolved recipe inputs, the custom-size
path matches the existing step-zero drafting path for the complete block,
recipe options, all unrounded POM values, and exact selected-size SVG, DXF,
tiled PDF, and A0 PDF writer content for each of the seven recipes. The custom
editor's POM view shows one `One size` column. Custom-size export selection,
semantic Edit, history restore, and recovery restore remain on step zero.
Existing legacy export writers and all eight protected identities remain
unchanged. Tech Pack, Projector, Marker, graded specifications, and frozen
whole-run capture remain withheld until an approved grade plan exists.

Slice 249 does not claim fit or change the existing recipe-to-body/POM
relationships. The independent source audits' unresolved Woven, Skirt and
Trouser mappings are listed in
`docs/research/epic16/S249-RECIPE-PARITY-AND-OUTPUT-VERIFICATION.md` for their
already assigned downstream review; parity proves consistent software paths,
not that those relationships are physically correct.

Verification: the full coverage run passed 128/128 files and 1,922/1,922 tests
with 100% statements, branches, functions and lines. The 9 protected export
identity cases passed. `npm run build`, `npm run electron:build-main`, and
`npm run control-center:test` (33/33) passed; `npx tsc --noEmit` and
`git diff --check` passed. The focused all-recipe output comparison and the
production browser output review are recorded in the S249 evidence report.
The validated Control Center linked this report as verified evidence and moved
M02 through Review to Done at board revision 340. Slice 250 may begin M03's strict,
versioned grade-plan record and review flow; do not infer a grade plan or
population chart.

## Slice 250 — explicit grade-plan record and review (complete)

Slice 250 begins after M02 completed at board revision 340. Its implementation
packet is
`docs/research/epic16/S250-EXPLICIT-GRADE-PLAN-RECORD-AND-REVIEW.md`. The
packet scopes a versioned, style-bound, user-authored plan with explicit basis,
base revision, size labels/range, per-measure/POM/control rules, exceptions,
review/approval state, and invalidation when the base or plan changes. No
source, population, size label, rule, or increment is supplied by the app.

The separate, Codex-reviewed
`docs/research/epic16/S250-GRADE-PLAN-DECISION-RECONCILIATION.md` records the
completed Claude Code and OpenCode read-only audits, contract-derived choices,
storage and approval boundaries, and S251 risks. No contributor code was
merged; implementation remains Codex-owned.

Slice 250 is complete; verified evidence is in
`docs/research/epic16/S250-EXIT.md`. It owns persistence and plan review/
approval. Slice 251 owns applying an
approved plan to grade every supported size, reconciling POMs and cutting
quantities, showing the base-to-size diff, and enabling whole-run outputs. Until
that integration exists, an approved plan record must not make generated
graded output appear available. Existing legacy grading and bytes stay
unchanged. No fit, population, standards-conformity, or physical approval claim
is authorized.
