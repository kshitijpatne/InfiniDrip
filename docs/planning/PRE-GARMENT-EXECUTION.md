# No-cost pre-garment development sequence

_Approved by the maintainer on 2026-09-22. This packet is the binding work
sequence before any new garment queue._

## Boundary and execution rules

Complete Phases 1–9 before proposing that garment implementation resume. Keep
all work local and within the existing no-cost boundary. Do not add or enable
accounts, profiles, a hosted database, cloud sync, hosted monitoring, email,
paid services, recurring services, remote runtime asset fetching, or other
launch-backed capability. No phase authorizes a new garment recipe.

Each implementation slice must retain 100% application coverage and export
byte-identity regression baselines, verify the actual rendered or drafted
result, and update `PROJECT-STATE.md`, `ARCHITECTURE.md`, and affected durable
context. Before reserving a slice number, inspect `origin/main` and active
history and choose the next unused number. Each landed slice gets one unique
`Slice N:` commit; historical duplicate subjects remain unchanged. Delegate
only independent, low-risk work under `docs/OPENCODE-WORKFLOW.md`.

Use the current primary usage window as the pause trigger. Pause when it is
exhausted and resume automatically after its reset; the weekly meter is
informational. Keep the goal active across pauses. The garment queue is gated
on Phase 9 and explicit maintainer review and approval.

## Phase 1 — Delivery board dogfooding and planning setup

Use the localhost Control Center and canonical `ops/control-center/data/board.json`
as the operational source of truth. Record each phase as a distinct work item
with explicit scope, acceptance criteria, owner, priority, dependencies and
history. Dogfood status transitions, editing, evidence and comments while
running the sequence. Fix only issues observed in real use. Each completed
implementation slice must update its board item's status, add a repository
evidence reference, and leave a concise completion note. Roles remain workflow
guidance, not security. Do not add accounts, sync, notifications, automation,
or hosted collaboration.

**Exit:** all nine phase items exist with ordered dependencies; the active item
and its acceptance criteria are clear; the board has been used for real work;
the maintenance rule is documented.

## Phase 2 — Read-only repository and documentation audit

Inventory the repository before proposing cleanup. Classify each candidate as
required source/test input, required durable evidence, generated-but-intended
to-retain, or clearly obsolete/accidental. Do not delete files during the
first-pass audit. Preserve local untracked artifacts. Do not rewrite history
to normalize old duplicate slice numbers. Pressure-test `README.md` and
`ARCHITECTURE.md` as a newcomer with no coding or fashion background; record
specific misunderstandings before editing either document.

**Exit:** a proposed cleanup list and newcomer-misunderstanding record exist;
no file has been removed without separate explicit approval and evidence.

## Phase 3 — First-load tutorial research and specification

Research a small number of effective onboarding patterns online. Before
implementation, specify tutorial copy, step/state model, local persistence,
keyboard and accessibility behavior, and acceptance criteria. Keep the tour to
five steps or fewer, with one clear primary action per step:

1. Welcome — “Create a digital sewing pattern that fits your design intent.”
2. Garment — choose what to make.
3. Measure — enter measurements and understand validation.
4. Style — adjust fit, material, options and artwork.
5. Check and Export — resolve guidance, confirm digital readiness and generate
   outputs.

Include “Start the tour”, “Skip for now”, and replay/help access. Highlight the
actual controls. Persist progress locally. Support keyboard navigation and
accessible focus. Explain what the app makes, what each action produces, the
available design freedom, what a finished digital product means, and how to
check export readiness. Do not imply physical fit or production validation.
Explain that meaningful choices remain adjustable while invalid combinations
stay visible with actionable corrections.

**Exit:** an implementation-ready spec exists before tutorial code changes.

## Phase 4 — Tutorial implementation and live verification

Implement the local-first tour against the approved spec. Verify first launch
with no saved workspace; returning users who completed or skipped it; replay;
reload mid-tour; keyboard and focus behavior; narrow viewports; invalid
measurement/option guidance; and truthful completion/readiness wording.

**Exit:** the first-load experience is brief, understandable, replayable and
verified in the running app.

## Phase 5 — README and ARCHITECTURE refinement

After the tutorial matches the product, revise both documents for a pure
newcomer. The README must explain the product, audience, local run steps,
five-stage flow, outputs, limitations, current garment boundary and no-cost
local-only boundary. The architecture guide must explain how measurements and
choices become garment geometry; how guidance, grading, nesting, surfaces and
exports use shared data; where local persistence occurs; what the Control
Center is; what Epic 8 is and is not; and which capabilities are deferred.
Keep historical material in the archive, not the orientation guide.

**Exit:** a non-stakeholder can explain the product and its boundaries from
these documents alone.

## Phase 6 — Existing garment UI and artwork form refinement

This is UI refinement only; do not add a recipe or curated artwork library.
Make every meaningful measurement editable and make measurement-to-diagram
correlation work on hover and keyboard focus everywhere. Integrate and simplify
the artwork form; clarify that “Artwork source” means provenance or local asset
identity; make validation actionable; explain placement, transforms, scale,
rotation and piece-role behavior; keep invalid inputs visible rather than
silently clamping; and verify desktop and narrow layouts.

**Exit:** existing artwork authoring is clear and reliable before file-import
complexity is introduced.

### Phase 6 amendment — pattern legibility and pattern-to-measurement navigation

Added 2026-09-22 at the maintainer's direction. This remains inside Phase 6's
existing-garment UI-refinement boundary. It does not add a garment recipe,
local asset import (Phase 7), or a curated artwork library (Phase 8).

Add these as two distinct acceptance criteria:

1. **Pattern-block legibility:** In every existing garment's Pattern view, make
   each block heading, label, and instruction readable and visually distinct.
   Prevent text collisions with other text or pattern geometry using deliberate
   positioning, wrapping, or leader lines as needed. Give headings, labels, and
   instructions distinct, high-contrast color roles, reinforced by typography
   or other cues so their meaning does not depend on color alone. Verify at
   desktop and narrow widths.
2. **Pattern-to-measurement navigation:** Activating a pattern block opens the
   measurement page containing its related editable field or fields, brings
   that page into view, and highlights the relevant field or fields. Preserve
   existing hover correlation. Provide equivalent keyboard operation and
   visible focus. Navigation must not change a measurement or other design
   value.

Before implementing this navigation, prepare and review a compact inventory
with one row per pattern block:

`pattern block → related editable measurement field(s) → measurement page`

For a block without a meaningful measurement relationship, record that
explicitly; do not route it to an unrelated field. Blocks that relate to fields
on multiple measurement pages require a maintainer decision about which page
to open and how to present the cross-page relationship. That behavior remains
unresolved and must not be guessed in implementation. The navigation criterion
is not ready for implementation until the inventory is reviewed and the
multi-page behavior is decided. This unresolved sub-scope does not block other
independently scoped Phase 6 work, including pattern-block legibility. This
amendment does not itself change Phase 6's backlog status.

**Progress:** Slice 196 completes the pattern-block legibility criterion. The
Pattern view keeps piece geometry free of text and presents headings, labels,
and construction instructions in an ordered, responsive key. A 40-block
candidate field/group mapping is recorded in the
[Phase 6 inventory](PRE-GARMENT-PHASE6-PATTERN-MEASUREMENT-INVENTORY.md). It
identifies 28 blocks that span multiple groups; navigation remains
unimplemented pending maintainer review and a cross-page behavior decision.
Other Phase 6 measurement and artwork-form criteria remain in progress.

## Phase 7 — Drag-and-drop local asset workflow

Accept PNG, JPEG, WebP and sanitized SVG, with a normal file-picker fallback.
Copy imports to an app-managed local asset store and reference them by stable
local IDs, never absolute source paths. Persist placement metadata and the
asset reference in the saved design; keep binary data local. Bundled assets use
stable IDs. Missing assets show a clear recovery state. Do not fetch remote
URLs or require accounts/cloud storage.

Initial safety limits: 10 MB per asset, 4096 px maximum raster dimension, and
2 MB maximum SVG source. Reject scripts, external SVG references, unsafe links,
animation and unsupported formats.

**Exit:** imported art survives reload independent of the original path;
placement persists; unsupported/unsafe files fail clearly; missing-asset
recovery is understandable.

## Phase 8 — Curated artwork library V1

Research fashion/design-oriented sources and select only assets whose license
and provenance can be verified. Build a small repository-local collection;
prefer public-domain or CC0. Do not assemble a generic image dump or make
runtime remote requests. Record for every asset: stable ID, title, creator,
source, license, attribution, retrieval date, modification status, file hash,
category, tags and technical properties.

Use discoverable categories: geometric; stripe/check/grid; dot/spot;
botanical/floral; organic/natural; abstract; ornamental/traditional;
typography/logo; texture/material; and novelty/illustrative. Tag technical
properties and garment relevance, including repeatability, direction,
transparency, vector/raster, garment families, piece roles, print use (all-over,
border/trim, panel, focal graphic or placement), and suggested scale range.

Search title, description, tags, creator and source. Combine filters with AND
semantics and keep all assets discoverable. Show “recommended”, “possible”, or
“needs review” guidance with the reason; never silently hide a potentially
useful asset.

**Exit:** the local V1 pack has verified provenance and is categorized,
searchable and useful for garment design rather than a generic image gallery.

## Phase 9 — V1 practice and expansion decision

Use the first curated library and local import flow. Qualitatively assess whether
users can find artwork; whether categories make sense; whether provenance,
filename and asset ID are distinct; whether assets persist after reload;
whether recommendations are useful without limiting freedom; whether formats
are sufficient; and whether the library feels meaningfully varied.

**Exit:** record the maintainer's decision to expand, revise taxonomy/formats,
change placement behavior, or keep V1. Do not infer approval of the next
garment from V1 completion.

## Final gate

The next garment queue remains closed until the tutorial is implemented and
verified; README and ARCHITECTURE pass newcomer review; cleanup has been audited
and any removals separately approved; existing artwork authoring is refined;
local drag/drop persistence is stable; the curated library is licensed,
categorized, searchable and tested; and the maintainer has reviewed V1 and
explicitly approved the next garment direction.
