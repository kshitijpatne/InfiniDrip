# InfiniDrip workspace redesign — research and observed baseline

Slice 114, 2026-09-13. Baseline: `816b9ff`. Status: initial research/audit and
implementation specification checkpoint complete; no redesign implementation
or new full-gate claim yet. Verification gaps remain explicitly listed.

## Scope and evidence quality

The maintainer supplied ten screenshots and requested a beginner-oriented
redesign from first launch to export. The current request authorizes workflow,
selection, appearance, guidance and workspace-safety changes; it does not
authorize new garments, physical validation, a drape simulator, or export
baseline changes. Screenshot suggestions are inputs to design, not a mandate
to reproduce every proposed widget regardless of usability.

Codex inspected the current branch and live app using a fresh development
origin, leaving the user's existing saved workspace and untracked artifacts
alone. UI interactions, DOM geometry and screenshots supplement source review.
Competitor documentation establishes described capabilities, not comparative
usability scores. Forum posts are self-selected anecdotes, not prevalence data.
No interviews, task-time study, retention measurement or accessibility
certification has occurred. Do not invent numerical improvement claims.

The earlier exit checks established working routes, export regressions and
absence of page-level horizontal overflow. They did not establish field/canvas
co-visibility, useful highlights, or beginner task completion. Those narrower
claims do not close the problems below.

## Reproduced baseline findings

At an actual 1280 × 720 viewport, Woven shirt after skipping the tour:

- Controls: 2,059.1 px tall; analytical canvas: 313.2 px tall, beginning at
  y=489. Assembled preview began at y=1,005.6, below the initial viewport.
- Editing pocket height from 13 to 14 scrolled the page to y=1,364. The Body
  canvas then occupied y=-887.8 through -574.6: completely off-screen.
- The pocket-height control had zero matching Body markers, one assembled
  marker, and dimmed 42 Body elements despite having no visible target there.
- After explicitly selecting Cotton woven and saving the baseline, Load
  immediately replaced pocket height 14 with saved 13; no dialog intervened.
- Switching from the fresh Tee to Woven shirt carried the default Cotton
  jersey across, creating a material warning before an intentional material
  decision. A user's explicit material choice must not be silently changed;
  an untouched default should not create this trap.
- Skipping the tour displayed five checked stage chips while the design
  checklist still reported incomplete work. Tour familiarity and design
  completion are different states.
- Trouser Single size nesting says it uses the selected size. Switching M
  (0) to L (1) left the entire rendered nesting canvas byte-for-byte identical.
  Source confirms the single-size branch uses `draftCurrent()` rather than
  `draftAtSize()`. This is a functional defect, not just copy placement.

Live Body front+back inventory (every declared measurement/option row):

| Garment | Rows | Control height (px) | Keys without a Body target |
|---|---:|---:|---|
| Tee | 7 | 430 | ease |
| Darted tee | 7 | 430 | ease |
| Tank | 8 | 480 | ease |
| Polo | 11 | 714.4 | ease |
| Woven shirt | 24 | 2059.1 | ease and all 13 construction options |
| Skirt | 5 | 330 | ease |
| Trouser | 19 | 1697.8 | ease |

Presence of a marker is only an inventory, not proof that it identifies the
correct seam or stays visible during use. Front/back/Side and assembled targets
still require the more detailed contract and rendered verification.

Additional source-backed concerns:

- Numeric step buttons are 21 × 28 CSS px and range endpoints use 9 px text.
  Dense grouping and weak hierarchy impair discoverability; minimum target
  sizes and text legibility need explicit checks, not a color-only redesign.
- `spotlight()` dims every tagged group unconditionally. It needs a matching,
  visible target before dimming, plus a useful alternative for another side.
- Save/Load is inside the export toolbar, so it disappears during early tour
  stages. Save replaces one local slot; copy does not explain that scope.
- Invalid drafts cannot be saved through the validated workspace contract.
  Recovery of unfinished input must be a separate explicit safety mechanism,
  not a weakened cutting/export validity gate.
- Garment switches reset the transient Edit snapshot. That exploratory work
  needs an explicit discard/recovery decision; ordinary parametric measurement
  values are retained and should not trigger needless switch confirmations.
- Fit intent, fabric behavior, display color, numeric limits and physical
  confidence are not interchangeable. The UI must name these distinctions at
  the moment they matter.

Responsive baseline limitation: a requested 390 × 844 browser override did not
change the measured page viewport (it remained 1280 × 720). That attempt is
NOT mobile evidence. The supported viewport mechanism must be resolved and
actual dimensions recorded before responsive acceptance. Do not reuse the
old no-overflow result as proof of the redesigned mobile workflow.

## Reviewed sources and implications

Sources below were accessed on 2026-09-13. Each implication is a design inference
for InfiniDrip, not a claim that the source tested this application.

| Source / evidence | What was inspected | Implication |
|---|---|---|
| [Nielsen, Noncommand User Interfaces (1993)](https://www.nngroup.com/articles/noncommand/), §4.5 | Author's revised ACM paper: direct manipulation depends on visible objects; hidden objects need discoverable inspection paths. | Keep the edited garment visible; hiding a tool is acceptable only with a clear route back. |
| [Nielsen, Progressive Disclosure (2006)](https://www.nngroup.com/articles/progressive-disclosure/) | Article distinguishes primary needs from secondary commands and warns about poor disclosure boundaries. | Persistent canvas/navigation/save; stage-relevant inspector; advanced tools remain discoverable. Do not make every field a separate wizard page. |
| [NN/G, Complex Applications (2020)](https://www.nngroup.com/articles/complex-application-design/) | Sections on clutter, task switching and access to secondary information. | Reduce simultaneous panels without deleting capability or forcing users to memorize another screen. |
| [NN/G, Onboarding vs Contextual Help (2023)](https://www.nngroup.com/articles/onboarding-tutorials/) | Contextual help should be dismissible, recallable and tied to the current task. | An optional tour cannot be the only place that explains body/finished measurements, Edit limitations or exports. |
| [CLO, Color Window (updated 2025-01-20)](https://support.clo3d.com/hc/en-us/articles/360047316974-Color-Window-How-do-I-change-colors-in-my-project) | Official instructions and linked color-window image reference: chip opens editor; exact values, custom palettes, named palette search, multiple views. | Provide click-to-open editing, exact color entry and reusable swatches. Do not ship copied proprietary color libraries or imply licensed Pantone matching. |
| [CLO, Colorways deep dive (2024-11-15)](https://www.youtube.com/watch?v=vsAOiSbi-7E&t=170s) | Live YouTube frame at 2:50 and visible chapter metadata; CLO channel, dedicated Colorway Editor beside garment/material context. Not a full-video review. | Appearance editing can be a contextual workspace within the design journey; it need not occupy every screen. |
| [Browzwear, Colorways workspace](https://browzwear.com/blog/the-first-and-only-comprehensive-colorways-workspace-for-professional-apparel-designers) | Official product explanation of coordinated fabrics, colors and trims across colorways. | Group visual appearance coherently; do not pretend a color swatch selects physical fabric behavior. Full multi-colorway management is outside this redesign. |
| [Blender 5.2 color picker](https://docs.blender.org/manual/en/latest/interface/controls/templates/color_picker.html) | Official wheel/field, separate value/lightness, HSV/HSL/RGB/Hex and display/linear distinction. | A wheel needs exact input and a separate lightness control; document display color as sRGB, not a manufactured color guarantee. |
| [Figma color picker](https://help.figma.com/hc/en-us/articles/360041003774-Update-fills-using-the-color-picker) | Official picker anatomy, hue/opacity, color models, stored styles and contextual sidebar entry. | Keep precise input and swatches with the picker; appearance controls should not be permanently scattered under the canvas. |
| [Seamly forum (2026-05-07)](https://forum.seamly.io/t/some-possible-improvements-features/17224?tl=en) | Original complaint and replies: repeated print dialogs, buried calculated values, measurement diagram highlighting, zoom-to-selection discoverability. Replies show some requested capabilities already exist. | Discoverability matters as much as feature presence. Our missing highlights and repetitive inspection loop reproduce related problems; do not claim Seamly lacks all requested functions. |
| [Figma UI3 user discussion (2024)](https://www.reddit.com/r/FigmaDesign/comments/1duvd2b/ui3_is_a_nightmare/) | First-person complaints about floating panels, obstructed canvas and displaced rulers; mixed opinions. | Dock the main inspector. Spatial notes need collision/occlusion controls and a compact recallable list; novelty is not a reason to cover the garment. |
| [W3C, Target Size Minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 24 × 24 CSS-pixel minimum and exceptions; larger targets recommended for important controls. | Use comfortably sized repeated +/- and primary actions; verify actual bounding boxes and spacing. |
| [W3C, Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html) | Sticky headers, footers and translucent overlays can obscure keyboard focus. | Test focused fields, dialogs, scrolling inspectors and guidance together. Transparency alone does not solve occlusion. |
| [FreeSewing Editor](https://freesewing.eu/docs/editor/) | Official design/measurement/draft sequence, optional side menus, garment gallery, undo/restore, export views and documented canvas-scroll confusion. | Use a visual garment library and task stages, retain advanced tools, and make canvas versus inspector scrolling explicit. |
| [Browzwear UI overview (2026-03-26)](https://help.browzwear.com/en/articles/13065239-vstitcher-user-interface) | Official named 2D/3D, resources, contextual menu and Context View regions. | Give each region a clear job; do not present view, garment and projection choices as one undifferentiated button group. |
| [Browzwear fabric properties (2025-12-09)](https://help.browzwear.com/en/articles/13065504-editing-fabric-properties) | Official independent sheen, tint, metalness and clear-coat settings with numeric controls. | Provide restrained appearance editing with exact inputs; do not copy a professional shader's entire complexity into this schematic product. |

Public images located through image search included CLO's color-window example,
Property Editor Colors and a user reset-color-window screenshot. These are
reference discovery, not proof of a current installed-product interaction.
No remote image was downloaded to bypass display restrictions.

## Design direction — a stable studio with a focus-linked inspector

1. **One work area.** A stable canvas and bounded inspector share the available
   viewport. On small screens the canvas sits above a paged inspector; changing
   fields must not scroll the design out of view. Zoom and table overflow remain
   local to the canvas, never shrink the entire application.
2. **Five explicit stages.** Garment → Measure → Style → Check → Export.
   Stage navigation reports actual readiness, not whether a tutorial was
   skipped. Back and revisiting preserve work. Disabled forward actions explain
   the remaining correction. Construction details live in Style, not among
   body inputs; secondary analysis tools remain reachable deliberately.
3. **A reversible Assembled lens.** One named toggle replaces the analytical
   canvas and returns to the exact previous view when turned off. It does not
   create another box below the page or change drafting/export state.
4. **Controls in meaningful groups.** Body, proportions/lengths, fit allowance,
   then recipe-declared construction groups. A group chooser and previous/next
   navigation avoid both the 2,000 px form and a 24-page wizard. Errors identify
   their group and can reveal/focus a hidden field directly.
5. **A garment library, not seven identical pills.** Recognizable silhouette
   cards with short construction descriptions, a clear selected state, and
   upper/lower grouping. Fit intent is a separate choice beside its relevant
   controls; it never silently writes measurements.
6. **Appearance on demand.** A wheel, exact Hex/HSV entry, useful swatches and
   restrained texture/shine controls in a contextual editor. These are visible
   schematic styling cues, persisted as appearance; not drape, stiffness,
   pressure, translucency calibration or a textile manufacturing promise.
7. **Guidance attached to the work.** Issue pins use actual rendered targets.
   A readable active note opens near a seam, with a leader and corrective action;
   additional notes remain compact and discoverable. No-target/global advice
   goes to its real control, not an invented seam. Fixing an issue removes it.
   Ignored advice stays in Check and can be recalled. Invalid inputs, incompatible
   construction and failed geometry cannot be dismissed into a passing gate.
8. **Workspace safety is always present.** Save status and restore actions stay
   in the header. Explain local-slot scope, confirm replacement of changed work,
   support recovery of unfinished drafts and deliberate Undo/Redo, and preserve
   the separate preview-only Edit contract.
9. **Outputs have a destination.** After Check, select size first, then a format
   card explaining print-at-home, copyshop, CAD, projector or documentation use.
   Whole-run formats explicitly identify their size scope. Nesting must use the
   size it claims to use; errors/cancel/failure never count as completed exports.

The distinctive proposal is the continuity between a field's Boundary Rail,
its on-garment highlight, its correction note and its stage readiness. These
should act as one explanation of the current design. No claim of global
uniqueness or proven learning-curve improvement is made.

## Contributor review

Claude Code ran headlessly with the `sonnet` alias; CLI output resolves it to
`claude-sonnet-5`. Its isolated branch contains only the assigned audit report.
Codex reproduced the missing Ease/Woven Body targets and unconfirmed Load
replacement in the live app. The report is useful input, not accepted wholesale:

- Woven shirt has **13** options, not the report's repeated count of 12.
- No-target dimming is also an application-routing defect; adding renderer tags
  alone cannot handle a front-only feature while viewing the back.
- Absence of Side measurement tags follows the explicitly schematic Side
  contract. Do not fabricate measured side seams to satisfy a highlight count.
- “All non-trouser paths are approximate” is too broad: Tank neckline and
  armhole paths consume shared drafting geometry. A stitch-line highlight is
  also not automatically a cutting-line highlight with seam allowance.
- Do not add tests whose only purpose is to freeze the current absence of a
  needed feature. Tests should verify the intended correction and interaction.

OpenCode ran headlessly with `opencode/muse-spark-1.3-contributor-free`; its
isolated branch contains only the assigned research report (16 source groups,
39 URLs, mostly search excerpts, three full-page reads). Codex read the actual
report and independently opened FreeSewing's editor guide and Browzwear's UI
and fabric-property pages before incorporating those conclusions above.
Unverified excerpt-only comparisons were not promoted into product facts.
The following contributor recommendations were not accepted:

- Converting absolute garment dimensions to proportional options is outside
  UI scope and would alter the established drafting/input contract.
- A creation-ordered scene graph or four user-experience permission levels is
  unnecessary for seven parametric garments; group by user task instead.
- “Proven” stage superiority and claims about every mature tool overstate this
  evidence. These are researched design hypotheses, not measured outcomes.
- Journey state is currently stored separately from the workspace; the report's
  assertion that it already persists together is not correct.
- Avoid labeling our heuristic stretch/ease tables as tested fabric physics.

Both raw contributor reports remain in their isolated branches as review inputs;
only the corrected, source-checked synthesis is included in this checkpoint.
No agent changed implementation, tests, exports or baselines. Implementation,
responsive verification and final live/parsed-output acceptance remain pending.
Physical validation remains deferred by maintainer instruction.
