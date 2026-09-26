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
| 248 | M02 deterministic one-size creation | Create and save one custom-size style through the established local project workflow from explicit measurements, targets and accepted defaults; preserve one-size as the first available output. | M01 complete. No grade inheritance. |
| 249 | M02 editor/output parity | Open the created design in the full editor; prove stable geometry, recipe options, POMs and one-size exports match the existing workflow for identical resolved inputs across all seven recipes. Preserve all protected legacy export identities and record actual output comparisons. | Slice 248. Resolve discrepancies with numbered remediation. |
| 250 | M03 explicit grade-plan record and review | Add strict versioned grade-plan data and user review/approval with rule source/decision, base, labels/range, increments, exceptions and provenance. Custom wearer defaults to one size and has no approved run until explicit approval. | M02 complete. Legacy default graded behavior remains byte-identical for unchanged legacy designs. |
| 251 | M03 approved graded output | Integrate approved plans with existing grade and cutting/export paths; check every size and POM/cutting quantity reconciliation, per-size overrides, unsupported exceptions, stale state, and invalid-state visibility. | Slice 250. No silently inherited XS–XL chart or physical fit claim. |
| 252 | G03 final review and merge exit | Reconcile all accepted criteria; remediate with new slices; run full coverage, strict builds, protected export identities, Control Center checks, browser/narrow/accessibility checks, actual output replay, PR review and safe merge verification. Close only after the board, `origin/main` ancestry, and exit evidence agree. | M01 → M02 → M03 complete. |

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
