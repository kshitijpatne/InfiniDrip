# First-load tutorial — implementation specification

_Status: Phase 3 specification accepted for implementation; Phase 4 must follow
this contract._

## Problem and audience

The app already shows a compact first-run welcome, but it is not a tutorial and
there is no persistent way to replay it. Both current welcome actions move the
workspace directly to Measure, so neither teaches the Garment controls; “Skip
introduction” also changes the current stage instead of simply dismissing help.
The five-stage bar teaches stage navigation but does not explain the digital
outputs or how to interpret readiness guidance.

Write for someone who is new to this app and may not know garment-making or
software terms. The product-owner audit found the intended customer segment is
not confirmed. Do not assume that the person is a fashion professional, home
sewer, business owner, or technical-pack specialist.

## Goals and user story

1. On a genuinely new local workspace, explain the app and its five-stage
   workflow in five numbered tutorial steps or fewer.
2. Let a new person learn by seeing the real controls in context, without a
   blocking dialog, required exercise, or changes to their design.
3. Explain that measurements, style, material, options, and artwork remain
   editable; invalid values stay visible with actionable guidance.
4. Explain digital export readiness without implying physical fit, sewability,
   manufacturing, or production validation.
5. Make the tour skippable, replayable, keyboard-operable, and locally
   resumable, without an account, network call, or telemetry.

**User story:** As someone opening InfiniDrip for the first time, I want a brief
explanation beside the real design controls so I can understand what the app
creates and where to begin, while keeping the choice to skip or revisit help.

## Non-goals

- Replacing the stage bar, readiness checklist, field help, or actionable
  guidance with a tutorial.
- Forcing a garment choice, measurement entry, export, or saved design as a
  condition of using the app or completing the tour.
- Changing drafting, validation, grading, persistence of design data, exports,
  or the existing rule that export is gated by current readiness.
- Claiming a pattern has been sewn, physically fitted, production-validated,
  or guaranteed to work for a body or manufacturer.
- Accounts, profiles, cross-device sync, remote services, analytics, or new
  paid/recurring costs.

## Research and design rationale

Nielsen Norman Group's 2020 comparison involved 70 participants and four
relatively simple iPhone apps. Tutorial and skip groups had similar task success
(91% and 94%, not statistically significant); the tutorial group was not faster
and rated tasks as less easy. This is a reason to keep the first screen
optional and short, not evidence that every tutorial harms every product; the
study was mobile-only and does not directly test a desktop garment-design app.
[Study and limitations](https://www.nngroup.com/articles/mobile-tutorials/).

NN/G's 2023 guidance recommends help in the context where it is needed, easy
to dismiss and recall, progressively disclosed, and shown alongside the task
so people do not have to memorize it. This supports a small coach card beside
the actual stage controls, plus a durable replay action, rather than a long
introductory manual.
[Onboarding tutorials vs. contextual help](https://www.nngroup.com/articles/onboarding-tutorials/).

For keyboard access, WCAG 2.2's focus-order guidance calls for a sequence that
preserves meaning and operation; its focus-visible guidance says keyboard
focus indicators must remain visible. These are implementation references, not
a claim that the app as a whole conforms to WCAG.
[Focus Order, SC 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html),
[Focus Visible, SC 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible).

## Tutorial structure and copy

Use a non-modal, in-page coach card in the existing journey area. Keep the
body copy to at most 45 words per visible panel, excluding the heading,
progress label, and controls. Show one visually primary action at a time.
“Back” and “Skip tour” are secondary. Do not dim or inert the workspace.

| Count | Panel and proposed copy | Actual target | Primary action |
| --- | --- | --- | --- |
| 1 of 5 | **Welcome.** “Create a digital sewing pattern that fits your design intent.” “Your measurements and choices make an editable digital outline of garment pieces and files you can save. Nothing has been sewn or fit-tested, so the files do not confirm physical fit or production readiness.” | Welcome card; no control is hidden behind it. | **Start the tour**. Secondary: **Skip for now**. |
| 2 of 5 | **Choose what to design.** “Choose what you want to design. The app will show its measurements and design choices. You can change this choice later.” | Garment selector (`#garment-toggle-host`). | **Continue to Measure**. |
| 3 of 5 | **Review measurements.** “Enter or adjust the listed body measurements. Values that need review stay visible with guidance. You can change them later.” | Measurement group (`#controls-panel`). | **Continue to Style**. |
| 4 of 5 | **Shape the design.** “Choose how close or relaxed the digital pattern should be. Change the fabric, color, details, or add a graphic. These editable choices do not test how a sewn garment will fit.” | Style, fabric, swatch, option, and surface controls (`#style-host`, `#stretch-host`, `#swatch-host`, and visible option controls). | **Continue to Check**. |
| 5 of 5a | **Check the digital draft.** “Review the drawing and guidance. If something needs attention, the app identifies it and points to a correction. These checks are not a physical fitting.” | Check view, readiness, and expanded guidance (`#guidance-details`, `#readiness-details`, `#guidance-host`, `#readiness-host`). | If blocked: **Review the first flagged item**. If current readiness permits export: **Continue to Export**. Only one primary action is visible. |
| 5 of 5b | **Choose digital files.** “Choose a size, then choose an outline or a file for printing. A reference file can show measurements and notes about putting the garment together. Some downloads cover one size; others include all sizes. A file does not prove physical fit or production readiness.” | Export controls (`#export-host`), with current readiness still visible. | **Finish the tour**. This does not trigger a download. |

The two subpanels in step 5 are sequential views of the one approved
“Check and Export” step, not a sixth numbered step. The second panel is
reachable only through the existing `canExport()` readiness gate; actual export
buttons retain their current disabled state and explanations until the design
passes that gate. Entering Check selects the actual Check view, so its current
guidance and readiness—not a tour-only green status—determine whether export
can be opened.

Keep the approved phrase “fits your design intent” verbatim, but keep the
physical-fit disclaimer adjacent to it. In later panels, explain “fit intent”
explain the closeness/relaxed-shape choice in ordinary language, not as a
measured or validated result. Keep technical file names visible as existing
controls label them, but explain their purpose in plain words. Do not introduce
internal terms such as “recipe,” “POM,” “nesting,” or “ease” in the tour. If a
control must use a domain term, explain it at the point where it appears.

## Navigation and interaction contract

- The Welcome panel is step 1 of 5. It appears only when the tour has not been
  decided and no prior local workspace/history establishes a returning user.
  It does not block the canvas, stage rail, or local workspace controls.
- **Start the tour** stores `in_progress / garment`, reveals the real Garment
  selector, and does not choose a garment or alter pattern data.
- **Skip for now** dismisses the Welcome and leaves the current Garment stage
  and design untouched. While active, **Skip tour** is available on every
  panel; it records `skipped` and leaves the current stage and design intact.
- Garment → Measure → Style → Check advances the tutorial and the corresponding
  existing app stage. Tour advancement does not synthesize, clamp, clear, or
  replace measurement, option, or artwork values. If a value is invalid, its
  raw value and actionable guidance remain visible; the tutorial may still
  explain later stages. Export remains gated by the existing readiness rule.
- While the tour is active, adapt the existing journey `Next` control as the
  one tutorial primary action and relabel it for the destination; do not add a
  second, competing primary button in a separate coach card. Keep stage chips,
  Back, and Skip as secondary actions. Tour advancement from Measure to Style
  may continue while an invalid value remains, because it changes only the
  visible stage; the raw value and guidance remain visible. The Check-to-Export
  action never bypasses `canExport()`.
- Entering Style through the tutorial uses the existing review transition.
  Entering Check selects the real Check view and exposes the current guidance
  and readiness details. If blocked, the first-correction action uses the
  existing field/stage correction route; the tour stays resumable and follows
  the actual stage while the person makes the correction.
- The export panel is step 5b. It describes only the file groups present in the
  current UI (selected-size SVG/DXF/PDF/A0, whole graded-run Tech Pack/Projector,
  and optional artwork print sheet). **Finish the tour** marks the tutorial
  complete but never starts an export.
- Existing stage navigation remains available during the tour. If a person
  selects a different stage, the active tutorial target follows the selected
  stage: Garment→2, Measure→3, Style→4, Check→5a, Export→5b. Do not mark the
  tutorial completed merely because they visit Export or export a file.
- After `skipped`, `suppressed`, or `completed`, never auto-open the tour again.
  Provide a persistent, keyboard-reachable **Take the tour** action in the
  journey area. Activating it returns to Welcome; starting again replays the
  same steps.
- Keep the message adjacent to the step it describes. Use a subtle outline on
  the real visible target; do not create a full-screen spotlight that obscures
  controls or rely on color alone. If an optional target is absent, keep the
  general Style target visible and do not point to a nonexistent control.

## Local state and migration

The existing UI journey is stored separately from the design workspace:
`patternworks_journey_v1` versus the workspace's `patternworks_save_v1`. Keep
tutorial state in that existing journey record; do not add a new storage key or
place tour state in the design payload, recovery snapshot, undo history, or
export. The tutorial stage must stay synchronized with the visible app stage;
one versioned record avoids two independently failing keys with conflicting
steps. This changes presentation state only, not the workspace save format or
export data. Retain the legacy storage key and version the record shape to
`v: 3` so existing v1/v2 journey records are handled explicitly.

Add a validated nested tutorial record:

```text
tutorial.status = unseen | in_progress | skipped | suppressed | completed
tutorial.step   = welcome | garment | measure | style | check | export
```

The existing top-level `step` remains the app's current stage (`start`,
`measure`, `fit`, `refine`, or `output`); it is not the tutorial step. `familiar`
may remain during migration for compatibility, but the nested status becomes
authoritative for tutorial display.

Migration rules:

1. A v1/v2 record with `familiar: true`, or a non-`start` legacy stage, maps to
   `suppressed`; do not unexpectedly show onboarding to an established local
   user. Keep the existing v1/v2 stage normalization and stale-export reset.
2. A fresh v1/v2 record (`start`, not familiar) maps to `unseen` and shows the
   Welcome offer.
3. A pre-existing local saved workspace with no tutorial decision maps to
   `suppressed`, not `skipped`; this records that the offer was withheld, not
   that the user explicitly dismissed it. The replay action remains available.
4. A valid v3 `in_progress` record resumes its precise step. If it says
   `export`, resume at Check (`5 of 5`) because Style/Check review flags and
   export readiness are deliberately not trusted across reloads. Recompute
   readiness before revealing Export.
5. Malformed, corrupt, or unsupported tour-only state falls back safely to
   `unseen` only when no saved workspace or legacy familiarity indicates a
   returning user; otherwise suppress the automatic offer. Never discard or
   rewrite design data because the tour record is malformed.

Save on each tutorial status/step transition using the current journey save
path. If local storage fails, continue in memory, leave the workspace usable,
and show a concise non-blocking notice that tour progress may not survive a
reload. Clearing browser data may reset this local preference; there is no
cross-device recovery or account.

## Accessibility and responsive behavior

- Implement the coach card as a labelled non-modal region, not `role=dialog` or
  `aria-modal`. Keep background controls operable and do not trap focus.
- Render tour content in a stable `#tutorial-host` adjacent to the journey
  stage bar, outside `#journey-host` (which is rebuilt during rendering).
  Update it only when tutorial state changes; when the current step's readiness
  changes, update its action without losing focus.
- Keep one visually primary action on each visible tour panel. When active,
  repurpose the journey's existing Next control for the tutorial transition
  rather than presenting duplicate primary actions.
- Use native `button` controls with an explicit accessible name and type. Tab,
  Shift+Tab, Enter, and Space must operate Start, Back, the primary action,
  Skip, and replay. Preserve the surrounding page's logical focus order.
- Do not steal focus merely because the page loaded. After a user starts,
  advances, or replays, announce the new step once (for example, “Step 3 of 5:
  Review measurements”) through a polite status region and move focus to the
  new tutorial heading or primary action. Keep `:focus-visible` clear, and
  avoid duplicating a live-region announcement when the stage rail also
  rerenders.
- Keep the visible target in the DOM, perceivable, and operable; expand the
  existing Check disclosures while step 5a is active. Ensure target navigation
  does not leave focus on a removed element.
- At narrow widths, wrap controls and copy without horizontal page scrolling,
  clipping, or covering the target. Any optional motion must honor
  `prefers-reduced-motion`; the current stylesheet already honors this for
  scrolling.
- These requirements follow the intent of WCAG 2.2 Focus Order and Focus
  Visible guidance; testing this feature does not certify overall conformance.

## Requirements and acceptance criteria

### Must have (P0)

1. **Fresh first visit:** Given no saved workspace and no tutorial decision,
   when the app opens, show the non-blocking Welcome as step 1 of 5 with the
   exact approved headline, **Start the tour**, and **Skip for now**.
2. **Real Garment target:** When Start is activated, show step 2 and visibly
   highlight `#garment-toggle-host`; do not silently jump straight to Measure
   or alter the selected garment.
3. **Measurement explanation:** Step 3 highlights `#controls-panel`. Given an
   invalid or implausible input, keep the entered value visible and show the
   existing actionable error/guidance; tour navigation never silently clamps
   or replaces the value.
4. **Editable design choices:** Step 4 exposes the current Style, material,
   color, option, and artwork controls that exist for the selected design;
   copy says the choices can be revisited and does not promise physical fit.
5. **Readiness is real:** Step 5a opens the real Check view and current guidance.
   Invalid combinations remain visible with a correction route. Export controls
   are shown only at step 5b and remain disabled until the existing readiness
   predicate passes.
6. **No accidental export:** Completing the tutorial changes only tutorial and
   presentation state; it does not click an export control or download a file.
7. **Skip and replay:** Skip leaves the current design and stage unchanged,
   persists the decision locally, and prevents another automatic offer. The
   persistent replay action is available after skip, suppression, or
   completion and opens Welcome without changing design data.
8. **Reload and migration:** Reloading at Welcome or any in-progress step
   restores the expected tour content. An in-progress export substate returns
   to Check and recomputes readiness. V1/v2 journey records migrate without
   repeating onboarding for established users.
9. **Storage failure:** Denied/unavailable local storage does not block design
   or export. Progress continues in memory with a visible, non-blocking notice.
10. **Keyboard and assistive technology:** Complete the tour with keyboard
    only; focus order is logical; focus is visible; the step is announced once;
    no trap or inaccessible overlay is introduced.
11. **Responsive and truthful:** At desktop and narrow viewports the card and
    target remain visible and usable. No tutorial step claims sewn fit,
    manufacturing suitability, or production validation.
12. **No-cost boundary:** No account, profile, service, network request,
    analytics, dependency, or recurring/one-time service cost is introduced.

### Nice to have (P1)

- A compact persistent replay action remains visible beside the journey controls
  after the tour is skipped, suppressed, or completed.
- Short inline explanations expand technical export labels without adding
  another numbered tutorial step.

### Future consideration (P2; not part of this packet)

- Audience-specific walkthroughs, analytics, automated personalization,
  external video, and remote help content. These need separate product and
  privacy decisions and are not needed to complete Phases 3–4.

## Success measures and verification method

There is no approved telemetry or confirmed audience, so do not invent an
adoption or completion-rate target. Phase 4 succeeds when every P0 criterion
passes automated tests, a live browser review completes the paths below, and a
reviewer unfamiliar with the code can explain (a) what the app creates, (b) the
five design stages, (c) how to correct a flagged value, and (d) why digital
readiness is not physical validation. Record the review as qualitative
evidence, not a representative user study.

## Independent review incorporated

Claude Code performed a read-only plain-language and newcomer pressure-test.
It confirmed that the approved five-step order and Welcome sentence were
preserved, and flagged unexplained tailoring vocabulary, the need to leave the
audience unassumed, and the risk of making Check and Export sound like two
competing primary actions. The copy above replaces “garment” as a standalone
instruction with “what to design,” explains the body-shape adjustment in
ordinary words, and treats Check/Export as two sequential subviews under one
numbered step.

OpenCode performed a read-only source and persistence map at the Slice 189
commit. It confirmed that the compact welcome's two actions currently both
advance to Measure; the stage controls are disclosed by `journey.step`; the
journey state is separate from the saved design; `#journey-host` is rebuilt
during rendering; and output readiness depends on current Style/Check review
and design validity. It found no replay-tour control. This led to the stable
`#tutorial-host`, the explicit v1/v2 migration contract, stage-to-tour mapping,
and the requirement not to reuse stale readiness after reload. Neither agent
changed files or ran a live browser review; rendered behavior remains a Phase 4
verification requirement.

Required live paths: clean first launch and Skip; clean first launch and Start
through all five counted steps; invalid measurement/option with correction and
no value clamping; saved returning workspace without interruption; completed
and skipped return with replay; reload mid-tour; reload at Export returning to
Check; storage unavailable; keyboard-only and narrow-viewport traversal.

## Open questions and boundary

| Question | Owner | Blocking? | Interim rule |
| --- | --- | --- | --- |
| Which customer segment should later product copy name? | Maintainer | No for Phases 3–4 | Keep copy audience-neutral; revisit in Phase 5 README review. |

No unresolved product choice blocks Phases 3–4. The current branch keeps all
launch-backed costs and services deferred, and the next garment queue remains
closed until all nine phases and the separate maintainer approval gate are
complete.

## Timeline and dependencies

Slice 190 is documentation and review only. Phase 4 begins in a separate,
uniquely numbered implementation slice after this spec is accepted; it must
pass the live and automated checks above before Phase 5 rewrites either
orientation document. No calendar deadline is set in the approved packet.

## Phase boundary

Phase 3 delivers this reviewed specification and source-linked rationale only.
No tutorial code changes belong in Slice 190. Phase 4 will implement against
this contract, verify rendered behavior and all current project gates, update
`PROJECT-STATE.md`, `ARCHITECTURE.md`, and the board in the same change, and
record any justified deviation before the tutorial code is accepted.
