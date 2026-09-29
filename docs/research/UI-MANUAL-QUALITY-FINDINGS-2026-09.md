# Manual UI quality findings — 2026-09-26

**Intake:** 15 annotated observations on the rendered InfiniDrip app, supplied
by the maintainer on 2026-09-26.

**Disposition:** Findings only. Each is flagged **High / P1 candidate** for
future review. None is a roadmap commitment, Control Center work item, admitted
slice, or permission to change the G03–G17 sequence. Do not add these findings
to the implementation roadmap or board unless the maintainer confirms. Do not
let them interrupt the admitted capability sequence. Where a current capability
has related scope, review the finding against that capability's accepted
rendered output at its exit; mark it **To be reviewed** at that point. The
review is a check for coverage, not automatic approval to expand scope.

The comments describe user-observed problems, not independently reproduced
root causes. Keep that distinction until a future review reproduces them and
checks current code and output. No implementation or external research was
performed as part of this intake.

## Finding register

| ID | Browser comment | Priority | Relationship to G03–G17 | Review disposition |
|---|---:|---|---|---|
| MQF-001 | 1 | High / P1 | G03 M01 stage and measurement route | Reviewed at Slice 247: first-run Measure remains pending until the user explicitly opens the route; integration and reload/browser checks pass. |
| MQF-002 | 2 | High / P1 | No explicit global selected-card color contract | Defer color-system research and scoping until after G17. |
| MQF-003 | 3 | High / P1 | G02 project/style workflow is complete; no later onboarding scope identified | Defer broader project/style comprehension review until after G17. |
| MQF-004 | 4 | High / P1 | G04 V01–V02 construction views; G09 D03–D04 assembled views | **To be reviewed** at those output exits. |
| MQF-005 | 5 | High / P1 | G04 V01–V02 construction annotations | **To be reviewed** at G04 exit. |
| MQF-006 | 6 | High / P1 | G04 V01–V02 construction annotations | **To be reviewed** at G04 exit. |
| MQF-007 | 7 | High / P1 | G04 V01–V02 live technical-view annotations | **To be reviewed** at G04 exit. |
| MQF-008 | 8 | High / P1 | No explicit whole-app visual identity work packet | Defer evidence-led palette research and options until after G17 and maintainer confirmation. |
| MQF-009 | 9 | High / P1 | G09 D03–D04 pattern-linked assembled views | **To be reviewed** at G09 D04 exit. |
| MQF-010 | 10 | High / P1 | No explicit single-screen / outer-scroll remediation packet | Defer app-wide layout scoping until after G17. |
| MQF-011 | 11 | High / P1 | Partial overlap: G04 artwork views, G05 tech-pack data/exports, G17 library | **To be reviewed** at each relevant exit; defer unowned interaction/rendering research until after G17. |
| MQF-012 | 12 | High / P1 | Partial overlap: G04 garment views and G05 T03 construction content | **To be reviewed** at those exits; defer any uncovered collar research/remediation scope until after G17. |
| MQF-013 | 13 | High / P1 | G03 may touch its measurement route; no global material-control redesign identified | Reviewed at Slice 247 for G03 route clarity; broader Material/Stretch visual redesign remains deferred until after G17. |
| MQF-014 | 14 | High / P1 | G03 M01 measurement coaching | Reviewed at Slice 247 for inline measurement help and correction visibility; broader Guidance & material advice placement remains deferred until after G17. |
| MQF-015 | 15 | High / P1 | G03 M02 parity; G04 V03; G05 T02–T05; G13 X01 | **To be reviewed** against each relevant export at its capability exit. |

## Detailed observations and exit checks

### Workflow and instruction clarity

- **MQF-001 — premature Measure completion.** Browser target: “2 Measure —
  complete” (`button#journey-step-measure`). The maintainer reports that a
  fresh first load shows “2 Measure” green and checked before the user advances
  from garment selection. G03 M01 introduces the measurement-first route and
  recipe-specific guidance. At G03 exit, check fresh-profile and resumed-state
  journey indicators: only a stage the user has explicitly completed should
  show completion. Slice 246 fixed the first-run state and Slice 247 rechecked
  fresh and resumed behavior; see
  `docs/research/epic16/S247-M01-VALIDATION-EXIT.md`. Do not infer the original
  implementation cause from the screenshot alone.
- **MQF-003 — project/style panel is hard to understand.** Browser target:
  `div#project-manager-host > details.project-manager-details`. The maintainer
  does not know what the section does, how to use it, or what to expect. EPIC-15
  F01 already delivered the versioned project/style workflow; no explicit
  G03–G17 packet was found for re-explaining that completed workflow. Retain
  this as a post-G17 onboarding and information-architecture discussion item.
- **MQF-014 — Guidance & material advice is too hidden.** The maintainer values
  schematic warning messages but reports that the Guidance engine is buried in
  a collapsed section (`details#guidance-details > summary`). G03 M01 explicitly
  includes measurement help and missing/contradictory-value guidance, so review
  the visibility and correction path at its exit. This does not commit G03 to
  redesigning the entire app's guidance placement; retain that broader question
  for post-G17 review. Slice 247 records that M01's recipe-specific help and
  correction now appear inline with the capture fields. The global guidance
  section placement remains deferred.
  The future app-wide review should test whether a complete beginner can tell
  what each stage and control does, what result to expect, and how to proceed,
  using external expert and user evidence rather than relying on internal
  assumptions.

### Visual hierarchy and layout

- **MQF-002 — selected garment card contrast.** Browser target: selected
  garment card region (annotated area x=24.5, y=633.6, w=156, h=97.6 in the
  1042×811 viewport). The selected card is reported as yellow with mostly white
  text, making text hard to read. No current G03–G17
  acceptance criterion establishes a global selected-state color system. Keep
  as a high-priority post-G17 review finding.
- **MQF-008 — whole-app visual identity and palette.** Browser target:
  `main#infini-shell`. The maintainer likes the
  existing blue background but wants a cleaner, more deliberate, elevated,
  sleek, luxurious, playful visual language informed by modern art, technology,
  and high fashion. After G17, and before proposing palette choices, conduct
  the requested research across those industries, color theory, design tools,
  expert material, videos, and public user discussion. Analyze how references
  distribute color across selection, status, actions, and content, and how that
  affects readability and interaction. Return evidence-linked palette options
  for maintainer selection; no palette is selected by this finding.
- **MQF-010 — unexplained outer-page whitespace and scrolling.** Browser
  target: selected blank region (x=46.9, y=833.6, w=834.4, h=403.2 in the
  annotated full-page capture). The maintainer
  reports a long empty region below measurement and pattern view boxes and wants
  a single-screen workspace with scrolling contained in the relevant panels.
  No current capability packet explicitly owns this app-wide layout behavior.
  Reproduce across viewport sizes and journey stages after G17 before scoping a
  fix.
- **MQF-013 — material/stretch controls feel outdated.** Browser target:
  Material / Stretch section (`div#style-host > div:nth-of-type(2)`). The selected
  Cotton-woven card and material/stretch controls are described as dull and
  behind the complexity expected of a design tool. Slice 247 reviewed the
  clarity of the G03 measurement route only; it does not specify a global
  Material/Stretch panel redesign. Keep the wider visual/interaction question
  for post-G17 research and discussion.

### Pattern, garment, and artwork fidelity

- **MQF-004 — Woven-shirt Body view omits buttons.** Browser target: “Body figure
  inspection front” (`div#analysis-host > svg.inspection-svg`). The selected
  front Body figure reportedly lacks buttons despite the Woven shirt having
  them. G04 V01–V02 define construction-aware front/back technical views,
  including closures; G09 D03–D04 later own pattern-linked assembled garment views.
  Review both outputs against the same option and saved revision at those
  exits. The user's request for accuracy against sewn construction is a digital
  fidelity target only; no physical validation has occurred.
- **MQF-005 — Pattern key is detached from the pattern.** Browser target:
  “Pattern key” (`aside#pattern-annotation-key`). The separate key is
  described as counter-intuitive. G04 V01–V02 include construction annotations
  and callouts; review whether the live view communicates each piece and its
  instructions in context. No move into pattern geometry is pre-approved.
- **MQF-006 — labels lack clear anchors and meaning.** Browser target:
  “LABEL · Placement line · POCKET PLACEMENT” (`.pattern-annotation-row--label`).
  Placement-line and placement-point rows do not make the target piece or exact
  referenced area clear to the maintainer. At G04 exit, verify label semantics, explicit
  geometry anchors, readable placement, and consistency between label and
  pattern. Treat the browser screenshot as an observation, not a root-cause
  diagnosis.
- **MQF-007 — annotations requested directly on pattern pieces.** Browser
  target: pattern-piece inspection (`div#analysis-host > svg.inspection-svg`). The
  maintainer wants labels/instructions attached to the blocks, distinct
  consistent colors by annotation kind, readable text, accurate placement, and
  no overlap. G04 V01–V02 are the nearest planned review gates because they
  cover callouts, annotations, and layer order. Review legibility and collision
  behavior across supported recipes; if the contract does not cover pattern
  key placement, preserve that gap for later discussion.
- **MQF-009 — side schematic is incomplete and generic.** Browser target: “Side
  schematic croquis” (`div#analysis-host > svg.inspection-svg`). The maintainer
  reports the side schematic appears the same for every garment and adds
  little value. G09 D03–D04 explicitly plan pattern-linked assembled views,
  including side, oblique, and inside views across supported recipes. This is
  planned future coverage, not a claim that the current side schematic is
  already fixed. Mark **To be reviewed** at D04 and retain any uncovered gap.
- **MQF-011 — artwork selection and garment feedback are confusing or absent.**
  Browser target: SURFACE controls (`div#style-host > div:nth-of-type(2)`).
  The maintainer reports a catalog that feels irrelevant to garment print use,
  unintuitive selection, no visible applied-art feedback, and unclear
  translation to materials and the tech pack. Requested ideas include removing
  fields with no useful purpose and direct image placement. G17 covers
  rights-verified, relevant, findable local library assets; G04 covers artwork
  in garment views; G05 covers pack data and exports. These are partial
  overlaps: no current packet explicitly promises a Canva-like drag-to-place
  workflow or fully fabric-calibrated print rendering. At each relevant exit,
  review the shipped behavior and record uncovered questions; defer deeper
  interaction and fabric-response research until after G17. Do not claim
  physical print response without evidence.
- **MQF-012 — Polo collar/neckline remains visually wrong to the maintainer.**
  Browser target: selected Polo neckline region (x=658.9, y=511.2, w=78.4,
  h=52.8 in the 1042×811 viewport). The maintainer reports that the Polo V2
  neckline still looks wrong after prior iterations and asks for construction
  research. G04 V01–V02 and G05 T03 cover
  construction depiction and instructions, so review collar shape and
  construction representation at those exits. The comment does not establish
  whether the remaining concern is pattern geometry, schematic rendering, or
  tech-pack explanation. Defer diagnosis, external research, and any new fix
  scope until the relevant review and, if still open, post-G17 discussion.

### Export quality and professional comparison

- **MQF-015 — all export formats need a standards-based gap review.** Browser
  target: Design controls (`aside#studio-inspector`), at the Selected size files,
  Whole graded run, and Current style artwork sections. The maintainer found the
  tech-pack representation of button and buttonhole
  plackets misleading and construction instructions incomplete or outdated,
  and requests comparison of each export type with appropriate industry
  examples. G03 M02 requires the one-size route to match the existing workflow;
  it does not authorize changing export semantics. G04 V03 owns documented CAD
  round-trip proof. G05 T02–T05 cover POMs, operation-level construction,
  templates, and frozen exports. G13 X01 covers line sheets and size guides.
  Mark **To be reviewed** as each applicable output contract is completed.
  Any later cross-format standard comparison must identify suitable references,
  check their current status and access rights, and separate sourced
  requirements from estimates and product decisions. Existing export baselines
  and launch-cost restrictions remain in force.

## Handling rule

Keep this register outside the implementation roadmap and the canonical board
until the maintainer confirms placement. Do not create corrective slices from
these observations automatically. At the named G03–G17 exit checks, record
each relevant finding as **To be reviewed**, then document whether the accepted
implementation fully covers it, partly covers it, or leaves a separately
scoped question. Findings without a roadmap owner, plus residual work from
partial overlaps, go to a post-G17 maintainer review before any research,
implementation, or roadmap/board change. Maintain the user's direction to
continue the G03–G17 track without interruption.
