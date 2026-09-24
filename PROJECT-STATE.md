# InfiniDrip — Project State

_Last updated: Slice 210 records the maintainer's acceptance of the bounded
12-item artwork reference V1 and closes Phase 9, 2026-09-24._
Next: verify the nine completed pre-garment work items and organize them under
Epic 13 in a separate reviewed slice before any branch merge. Do not start a
future-roadmap item or garment queue without explicit maintainer instruction.
The maintainer's requested post-Phase-9 capability sequence is planned in
`docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`; its dates and work packets
are conditional future backlog, not a change to the current Phase 8/9 gate.
Epics 7, 9 and 10 are implemented, Codex-reviewed, documented and pushed to
`origin/main`. Epic 11 implementation has completed the shaped collar/stand,
placket-base, vent/drop, front/back preview/control/report and downstream
pressure-matrix slices and the durable exit handoff. Physical validation and
production readiness remain unverified._

### Slice 183 — documentation and repository-truth pass

Slice 183 rewrites `README.md` as the current newcomer-facing product
overview and replaces the mixed current/history `ARCHITECTURE.md` with a
short orientation guide. The complete pre-Slice-183 architecture document is
preserved in `docs/archive/ARCHITECTURE-HISTORY.md` as historical evidence;
the archive is not current instruction.

The rewrite records the current seven-recipe local-first boundary, five-stage
journey, digital-only validation boundary, surface-artwork limitation, Epic 8
proof-only/no-go scope, Epic 11 completion, Slice 181 no-cost exit, and Slice
182 usage-pause rule. No implementation code, export baseline, dependency, or
launch-backed service changed.

Repository cleanup remains conservative: the known untracked `coverage-p1.log`,
`p1-focused.log`, and `tmp/` artifacts were preserved; tracked release,
research, archive, and local tooling evidence was not removed. Historical
duplicate Slice subjects remain unchanged because normalizing them requires a
commit-history rewrite and explicit maintainer authorization.

The maintainer subsequently resolved the Control Center v2 authoring,
canonical-state, transition-role, persistence, and minimum-scope decisions.
The implementation packet is
`docs/planning/CONTROL-CENTER-V2-EXECUTION.md`.

### Slice 184 — Control Center v2 schema and command layer complete

`ops/control-center/data/board.json` is now schema v2 with an explicit revision
and update time. It remains the sole canonical current-state file. Current
work-item state uses `Backlog → Ready → In Progress → Review → Done`, plus
`Blocked` and maintainer-controlled `Archived`; the original v1 labels remain
inside historical entries rather than being rewritten.

`ops/control-center/commands.mjs` is the pure mutation boundary for item edits,
status transitions, comments, evidence, and retained evidence-fact imports.
Role selection is workflow guidance rather than authentication. Every status
change records actor, role, time and reason; `Done` requires linked
non-incomplete evidence.

`ops/control-center/board-store.mjs` validates complete input/output, checks an
optional expected revision, obtains a short-lived local lock, flushes a
same-directory temporary file and atomically replaces the board. Invalid,
stale, busy and rename-failure paths leave the existing board intact. The CLI
and evidence importer use this same path. Focused tests cover the command,
schema, stale-write, lock and atomic-failure boundaries.

### Slice 185 — Control Center v2 local authoring complete

The Control Center now runs through a dependency-free Node service bound only
to `127.0.0.1`. `GET /api/board` validates and returns canonical state;
`POST /api/commands` invokes the Slice 184 executor with stale-revision
conflicts; referenced evidence is served through a repository-root and
realpath-constrained route. Static routing exposes only the dashboard assets.

The browser can edit item details, apply role-guided status transitions, add
notes, create or link evidence, inspect dependencies/evidence/history, search
literal title/slice/body text, and combine status/owner/priority/type filters.
Clean, unsaved, saving, saved, stale and error states are visible. Failed
saves retain the form. The responsive 375px layout has no horizontal overflow.
No account, auth, cloud, event log, provider, notification, monitoring,
garment, drafting or export behavior was added.

### Slice 186 — Control Center v2 exit and durable verification complete

An isolated local browser run saved an item through the UI, reloaded the page,
reselected the item and confirmed the edit persisted without console warnings
or errors. The canonical board was not used as the mutation fixture. The
focused Control Center suite remains 21/21; the full application gate is
105/105 files and 1,421/1,421 tests, coverage is 100%, the strict build passes,
and protected export regression/identity gates remain 8/8 and 9/9 with no
baseline movement. The no-cost local Control Center v2 is complete.

### Slice 187 — Control Center item creation and pre-garment planning setup

Real board use exposed a v2 gap: existing items could be edited but new work
could not be recorded from the local UI. The shared command layer now provides
validated `createItem`; the browser form collects schema-required fields,
starts items in `Backlog`, records actor/role/reason in transition history, and
uses the existing atomic save path. Invalid saves remain visible; cancel and
unsaved-state handling are available. The CLI and UI continue to share the
same command executor.

The maintainer-approved nine-phase sequence is documented in
`docs/planning/PRE-GARMENT-EXECUTION.md` and recorded as
`PREQUEUE-PHASE-01` through `PREQUEUE-PHASE-09` in canonical `board.json`, with
ordered dependencies and explicit acceptance criteria. The live UI created
those records through revision 9. The sequence stays local and no-cost; no
account, hosted service, paid feature, remote asset fetch, or new garment
recipe is authorized. Phase 1 completed through the board's In Progress →
Review → Done flow at revision 14 with a linked exit report and completion
note. Phase 2 follows Phase 1 as a separately tracked audit item. Each completed
slice must update its phase status, add evidence, and leave a concise completion
note. The next garment queue is gated on Phase 9 and explicit maintainer
approval.

### Slice 188 — pre-garment repository and newcomer audit

The read-only first pass is recorded in
`docs/planning/REPOSITORY-AND-NEWCOMER-AUDIT.md`. The inventory found no
tracked build outputs, logs, temporary files, or artwork binaries. Existing
untracked coverage logs and `tmp/` were preserved. The superseded apparel
resource list is explicitly retained for provenance; the local launch presets
are optional tooling rather than build inputs.

The audit identified `docs/archive/RESUME-LOG.md` as a possible de-tracking
candidate because it is personal resume staging rather than current project
status. It remains tracked under the non-destructive default; removing it later
would require explicit authorization and repair of older references. Phase 2
was accepted without deletion or history rewrite; Phase 3 is now the active
tutorial research/specification item.

The newcomer review found that the five-stage flow, local boundary, outputs,
and physical-validation disclaimer are understandable at a high level. At the
time, the intended audience was unconfirmed; on 2026-09-22 the maintainer
resolved that ambiguity by confirming both home sewists/DIY makers and
independent designers/patternmakers. The decision is recorded in
`docs/PROJECT-DECISIONS.md`. The review also records terminology, Epic 8
visibility, next-work link, maintainer-role, and welcome-versus-tutorial
clarity gaps. README and ARCHITECTURE were not changed in that audit.

The full available history has 24 groups of duplicate numeric slice subjects.
Commit-message-only renumbering could preserve per-commit file trees, but
would change commit and descendant IDs and invalidate signatures. No rewrite
was made. New work continues with unique, monotonic slice numbers.

Current usage policy: pause when the primary usage window is exhausted and
resume automatically after reset; the weekly meter is informational. No
launch-backed identity, database, cloud, hosted service, or recurring cost is
authorized.

### Slice 189 — accept Phase 2 and activate tutorial specification

Phase 2 is accepted without deletion or history rewriting. The canonical board
records `PREQUEUE-PHASE-02` as `Done` and `PREQUEUE-PHASE-03` as `In Progress`;
the latter follows the approved order and implementation remains gated on the
Phase 3 specification. Board revision 24 includes separate closure evidence
`E-PREQUEUE-PHASE2-CLOSURE`. `npm run control-center:test` passed 25/25.

### Slice 190 — specify the first-load tutorial

`docs/planning/FIRST-LOAD-TUTORIAL-SPEC.md` records the research, beginner
copy, five-step model (with Check and Export as two views of step five), actual
UI targets, one-primary-action rule, stage/navigation behavior, local-only
state and v1/v2 migration, accessible focus behavior, and Phase 4 acceptance
matrix. Claude's newcomer copy review and OpenCode's code/state map were
read-only and incorporated. Neither review performed live rendering; Phase 4
still requires browser verification. The stable tutorial host, real readiness
gate, no-clamp rule, and “no physical fit or production validation” wording are
explicit.

The Phase 3 work item is Done with `E-PREQUEUE-PHASE3-SPEC`; Phase 4 is Ready
after its dependency was satisfied at board revision 28. No tutorial source
code changed in Slice 190; Phase 4 is the next implementation slice. The
canonical-board test now checks the Ready count against the board rather than
assuming zero; this sequence legitimately has a prepared Ready item.
`npm run control-center:test` passes 25/25.

### Slice 191 — first-load tutorial implementation and verification

The accepted Phase 3 specification is implemented. First-time users see an
optional non-modal Welcome and can take the five-step Garment → Measure → Style
→ Check/Export tour. Version-3 local journey state migrates prior records,
resumes or replays safely, and stays separate from saved design values. The
existing readiness predicate still gates Export; invalid values remain visible
with an actionable correction, and finishing the tour does not export a file.

The tour uses a stable host beside the rebuilt journey bar, one primary action,
keyboard-operable controls, visible focus, and a polite screen-reader status
region. A live render caught the status text appearing visually; it now uses
the existing screen-reader-only class. `ARCHITECTURE.md` and `CONTEXT-INDEX.md`
reflect the shipped behavior. No dependency, account, service, cost, export
baseline, or physical-fit claim was introduced.

Verification: `npm run build` passes; `npm run coverage -- --reporter=dot`
passes all 105 test files and 1,434 tests with 100% line, statement, branch,
and function coverage. The protected export regression and byte-identity suites
pass 8/8 and 9/9. `npm run control-center:test` passes 25/25 and
`npm run web:release:test` passes 10/10. Live browser checks at 1280×720 and
600×838 show no horizontal overflow; keyboard traversal, invalid chest value
160 through Check and back to Measure, Skip/replay, and reload at Welcome all
preserve the intended state. See
`docs/planning/PRE-GARMENT-PHASE4-EXIT.md` for the evidence record.

Two independent static reviews found no blocking defects. Follow-up addressed
the stale replay assertion, preserved the established Measure entry for a
saved workspace with no tutorial decision, covered saved-workspace resume, and
kept the live announcement distinct from the focused heading. Reviewer limits
and remaining screen-reader verification are recorded in
`docs/planning/PRE-GARMENT-PHASE4-EXIT.md`. The canonical board's Review → Done
acceptance is complete with evidence `E-PREQUEUE-PHASE4-EXIT`; Phase 5 is now
the active board item. No physical sewing or fit validation is claimed.

### Slice 192 — Phase 6 pattern-view acceptance amendment

Phase 6 now has separate criteria for readable, non-colliding pattern-block
headings/labels/instructions and for keyboard-accessible navigation from a
pattern block to its related editable measurement field. Before implementing
the navigation, prepare one reviewed mapping row per block and explicitly mark
blocks without a meaningful measurement link. A block mapped across pages
requires a maintainer decision; that behavior must not be guessed. The
navigation sub-scope is not ready, but it does not block independently scoped
Phase 6 work such as pattern-block legibility. Phase 6 remained Backlog.

### Slice 193 — Phase 4 tutorial exit accepted

The canonical board accepted the Slice 191 tutorial work against
`E-PREQUEUE-PHASE4-EXIT`. The evidence and limitations remain in
`docs/planning/PRE-GARMENT-PHASE4-EXIT.md`; Phase 5 became the active work item.

### Slice 194 — README and architecture guide revision submitted

`README.md` now describes InfiniDrip for both home sewists/DIY makers and
independent designers/patternmakers, explains the five stages and outputs,
documents browser and desktop local development, and distinguishes the
temporary Edit preview from saved design changes. The confirmed audience is
also recorded in `docs/PROJECT-DECISIONS.md`; the older newcomer audit now
records that its audience ambiguity was resolved.

`ARCHITECTURE.md` is a plain-language guide to the measurement-to-pattern flow,
shared views and checks, local storage, the separate Control Center, and Epic
8's completed bounded-helper/no-go decision. The views use their current UI
names consistently; sewing and software terms are explained where they first
matter.

Claude Code and OpenCode completed separate read-only cold-reader simulations.
Codex verified and addressed their factual and clarity findings, including the
desktop startup steps, Electron file-write boundary, Trouser's left-front Edit
piece, and size/nesting terminology. This was not a live human user study. The
exit evidence is `docs/planning/PRE-GARMENT-PHASE5-EXIT.md`.

`git diff --check` and the relative Markdown-link check passed. No application
code, tests, dependencies, export baselines, accounts, or services changed;
the full app/build/export gates were not rerun for this documentation-only
slice. The canonical board moved Phase 5 to Review at revision 37; Phase 6
remains Backlog. Phase 6 navigation still requires the pattern-block mapping
inventory and maintainer choice for cross-page mappings before implementation.

### Slice 195 — accept Phase 5 documentation exit

The canonical board moved Phase 5 from Review to Done at revision 39 with
verified evidence `E-PREQUEUE-PHASE5-EXIT`, linked to
`docs/planning/PRE-GARMENT-PHASE5-EXIT.md` and Slice 194 (`27186f1`). Phase 5
is accepted. Phase 6 remains the next planned item; its pattern-to-measurement
navigation is still blocked on the inventory and explicit maintainer choice
for blocks linked across measurement pages. No implementation from Phase 6
began in this acceptance slice.

### Slice 196 — Phase 6 Pattern-block legibility

The Pattern view now renders piece geometry without overlaid text and places
piece headings, construction labels, and instructions in a separate ordered
key. Wide layouts place the key beside the drawing; narrow layouts stack it
above the drawing. High-contrast heading, label, and instruction roles use
typography and solid/dashed cues as well as color. Imperative construction
marks receive explicit instruction roles; other marks remain labels. Shared
SVG rendering keeps its existing inline-text default, so this app-only
presentation change does not alter export serialization.

Rendered behavior was checked with Playwright for every existing garment at
1280×720, 600×800, and 375×800. All 21 renders retained the key, had no text in
the pattern SVG, no horizontally overflowing annotation rows, and no browser
page errors; the dense Polo, Woven shirt, and Trouser keys were visually
inspected at each width. Focused renderer/key tests and the two narrow/wide
layout integration tests pass; `npm run build` passes. The full Vitest coverage
suite passes at 100% for statements, branches, functions, and lines. All eight
legacy export-hash regressions and nine export-identity checks pass unchanged;
no export baseline was moved.

This completes only the pattern-block legibility acceptance criterion, not
Phase 6. Pattern-to-measurement navigation remains gated on the compact
pattern-block → editable measurement field(s) → page inventory and the
maintainer's decision for blocks associated with multiple pages. The other
Phase 6 measurement and artwork-form refinements remain in progress.

### Slice 197 — draft Pattern-block measurement inventory

The draft
`docs/planning/PRE-GARMENT-PHASE6-PATTERN-MEASUREMENT-INVENTORY.md` maps all
40 current Pattern blocks to measurement fields and the existing control
groups they affect. It identifies 36 blocks with measurement links and four
with no meaningful measurement link; those four are explicitly documented as
option-only rather than routed to an unrelated measurement. Twenty-eight
measurement-linked blocks span multiple groups, including 21 spanning Body
measurements, Lengths & shape, and Fit allowance. The Fit allowance page is
part of the Fit stage, which matters to the navigation decision.

Mappings were checked by changing each recipe-declared measurement around
`STANDARD_M` and a second shifted profile while holding default options, then
comparing the drafted pieces. Option-only blocks were checked against their
design-option controls. This is a candidate inventory for maintainer review,
not authorization to implement navigation. A decision is still needed on how
click/keyboard activation should expose fields spread across multiple groups;
no application code changed, and app tests/build were not rerun in this
documentation-only slice.

### Slice 198 — Pattern-block measurement navigation

The maintainer approved opening the first linked measurement page in the order
Body measurements → Lengths & shape → Fit allowance, with links to each other
linked page. The Pattern key and SVG blocks now support mouse, Enter, and Space
activation. Activation selects the matching block, opens the first page,
brings it into view, focuses its first related field, and highlights only the
fields mapped to that page. The other page links do the same for their fields.
Four option-only blocks explain their controlling option group; an unreviewed
block reports the missing mapping rather than being misclassified as
option-only. Existing hover correlation remains intact, and navigation does
not modify measurements or design options.

The inventory and mapping cover the 40 blocks in the current default-option
drafts: 36 have measurement links and four are option-only. Non-default option
combinations were not exhaustively inventoried; any block without a reviewed
entry fails safely with an explanatory message. The implementation resolves
group indices from the live controls rather than hard-coding page positions.

Verification: the full coverage suite passes at 100% statements, branches,
functions, and lines; all eight existing export-hash regressions and nine
export-identity checks pass without baseline changes. `npm run build` passes.
Browser checks confirmed the linked-page path and unchanged values at desktop,
and at 375 px the Pattern-key action and all page links wrap without
horizontal overflow while the selected fields are highlighted and focused;
no browser errors appeared. The page selector changes as navigation requires;
measurement and design inputs remain unchanged.

This completes the pattern-to-measurement behavior for the reviewed inventory,
not Phase 6. General measurement editability/hover correlation and the artwork
form refinement remained in progress until Slice 199. The canonical Phase 6
board item then received the approved navigation evidence; its latest status
and revision are recorded below.

### Slice 199 — Phase 6 measurement and artwork-form refinement

Codex review confirms the seven-recipe test matrix: every declared measurement
appears exactly once as an enabled, labeled numeric field with decrement/increment
controls, is reachable in its measurement group, and has a truthful Body or
Assembled correlation on hover and keyboard focus. When Body has no matching
target, the UI leaves unrelated geometry undimmed and offers the Assembled
route. The matrix also edits one representative measurement per recipe through
its stepper and confirms that the value updates.

The artwork placement panel now groups identity/target, size, position and
transform, and optional source-pixel dimensions. Its optional source/asset
reference is explained as provenance text only; placement dimensions, centre-
relative offsets, uniform scale, rotation, layer ordering, and pixel-resolution
guidance are explained in the form. Current exact piece roles are suggested,
new placements take explicit base width/height, and invalid dimensions remain
visible with field-specific feedback. The preview is explicitly identified as
the placement rectangle rather than an imported image or garment rendering.
No image import, remote fetch, saved-schema, geometry, or export change is part
of this slice.

Verification: `npm run build` passes. All 107 test files and 1,456 tests pass;
statements, branches, functions, and lines are each 100%. The eight export-hash
regressions and nine export-identity checks pass without baseline changes. A
1280px in-app browser render and isolated 375×800 Chromium render show no
horizontal overflow. At 375px, keyboard Tab moves from name to type; invalid
width stays visible, is marked invalid and receives focus with a specific
message; a valid 12×16 cm placement and provenance URL string create the
expected rectangle without fetching the URL or changing the current
measurement. The Phase 6 board item is Done at revision 50, with evidence
`E-PREQUEUE-PHASE6-MEASUREMENTS-ARTWORK-S199`.

Slice 199 was committed as `b4ab9eb` (`Slice 199: refine measurement and
artwork placement UI`).

### Slice 200 — Safe local artwork import and persistence

Slice 200 completes Phase 7: the browser stores validated artwork bytes in
IndexedDB, and the desktop stores them in a fixed folder under Electron's
user-data directory. The saved design holds only a stable local asset ID and
optional source-pixel dimensions; imported bytes stay outside the design JSON.
PNG, JPEG, WebP, and sanitized static SVG are supported through the file picker
and drop targets for new or existing placements. Missing assets can be restored
or replaced, and a failed replacement leaves the previous reference unchanged.
The workflow remains local-only and does not change pattern geometry or
exports. Phase 7 is Done at board revision 55 with evidence
`E-PREQUEUE-PHASE7-S200`; Phase 8 is In Progress at revision 57.

Verification: the full Vitest coverage gate passes across 99 source files at
100% statements, branches, functions, and lines. `npm run build`,
`npm run electron:build-main`, the Control Center suite (25 tests), web release
suite (10 tests), and readiness drill (5 tests) pass. Existing export
byte-identity and regression checks pass with no baseline changes. The desktop
artwork verifier exercised picker import, reload, narrow layout, exact IPC byte
round-trip, app-data persistence across restart, cleanup, path-traversal
rejection, and active-SVG rejection. The in-app browser profile also retained
its imported SVG after reload; its 64×64 preview loaded at 375px with no
horizontal overflow and no browser-console errors. No account, database,
provider, network fetch, or paid service was introduced.

### Slice 201 — Seed the source-verified local artwork catalog

Slice 201 adds a typed catalog and eight original Met textile-reference JPEGs
under `src/surface/artwork-library/`. The image files total 27,505,499 bytes.
Each record stores a stable `builtin-met-<objectID>` ID, source-page and API
URLs, the Public Domain item label, the API rights flag, credit line, retrieval
and verification date, exact image dimensions/byte length/SHA-256, categories,
tags, repeat/direction observations, garment/piece-role suggestions, and a
clearly qualified placement-width range. `localImageUrl` resolves from the
catalog module to a build-time local asset; museum URLs are provenance text,
not rendering sources.

The Met item pages and API records were checked on 2026-09-23 for all eight
items; all pages displayed Public Domain and Download Image, all API records
reported `isPublicDomain: true`, and all had the exact `primaryImage` used for
the corresponding downloaded file. The original images were visually reviewed
and not edited. They are textile photographs or paper design studies, not
seamless production tiles. The collection currently covers seven of ten
approved taxonomy categories; dot/spot, abstract, and typography/logo remain
empty rather than being filled with unrelated images. In particular, the
632-pixel-wide pheasant reference is tagged for small focal use and may trigger
resolution guidance.

The focused catalog test verifies unique IDs, required metadata, local-only
render URLs, JPEG signatures and dimensions, and exact byte lengths and
SHA-256 values. The complete Vitest coverage run passed across 110 test files
and 100 source files at 100% statements, branches, functions, and lines; the
production TypeScript/Vite build and export byte-identity regressions also pass.
The catalog is seeded but not yet browseable in the application;
search/guidance and UI work follow in Slices 202 and 203. This seed does not
claim broad category coverage or production-print suitability. Phase 9 must
evaluate whether its variety is sufficient and record the maintainer's explicit
V1/expansion decision. No user artwork store, design schema, geometry, or
export was changed.

### Slice 202 — Local artwork search and suitability guidance

`src/surface/artwork-library/search.ts` adds pure catalog search/filter and
per-use suitability functions. Search uses case-insensitive NFKC-normalized
literal phrases with trimmed/collapsed whitespace across documented catalog
and human-readable source fields. Filters combine with AND across dimensions
and OR within each dimension, preserve catalog order, and never mutate or
remove catalog entries. All ten category values remain usable, including
currently empty categories.

The advisory evaluator covers all five print uses, including unsupported uses.
It keeps every item selectable, names the reason, and disclaims production,
physical-fit, and sewability validation. It evaluates both source-pixel axes
against explicit placement width/height, or defaults to the suggested maximum
width while preserving the source aspect ratio, using the existing 59 px/cm
guidance floor. Only all-over use requires a verified seamless tile; uncertain
direction/repeat and source photographs or paper studies remain visible as
caveats rather than positive claims.

Verification: the focused search suite passes 24 tests at 100% statements,
branches, functions, and lines for `search.ts`; `npm run build` passes. The full
`npm run coverage` gate passes 111 test files / 1,546 tests at 100% across all
four coverage metrics. Export regression and byte-identity tests pass. The UI,
runtime network behavior, saved-design schema, geometry, and export bytes were
not changed; rendered library verification belongs to Slice 203.

### Slice 203 — local artwork library UI

Added the searchable, filterable Local artwork library to the Style panel.
Eight source-verified textile references can be inspected and staged for a new
placement or attached to an existing one. Stable built-in IDs resolve through
local bundled assets, separately from user-imported artwork; museum source URLs
remain attribution text. Replacing a reference preserves unrelated placement
and design values. At the Slice 203 cutoff, Phase 8 was complete and Phase 9
awaited the maintainer's V1 review before any garment queue.

Verification: `npm run build` passes; full coverage passes 111 files / 1,555
tests at 100% statements, branches, functions, and lines. Manual local-browser
checks confirmed local asset preview through save/reload, stable IDs, safe
replacement, keyboard access, narrow viewport without horizontal overflow,
search, and no remote catalog/image request. Detailed evidence is in
`docs/planning/ARTWORK-LIBRARY-V1-EXECUTION.md`.

### Slice 206 — Phase 9 V1 review and expansion direction approved

The evidence-based review is recorded in
`docs/planning/ARTWORK-LIBRARY-PHASE9-REVIEW.md`. It finds the eight-item
Met collection useful as a locally bundled textile-reference starter, but
narrower than the requested dense artwork library: all items are raster JPEGs,
seven of ten categories are represented, and the source/era/subject range is
concentrated. The review recommends expanding with rights-verified, use-case-
relevant assets while clearly distinguishing reference images from clean or
repeat-verified artwork. The maintainer approved this direction on 2026-09-23.
At the Slice 206 cutoff, Phase 9 remained In Progress while the expansion was
scoped, researched, implemented and practiced; this did not authorize a
garment queue.

The prior Slice 203 rendered-browser record remains the evidence for keyboard,
narrow-width, search, local preview, save/reload and no-runtime-network checks.
Those interactions could not be repeated in the review turn because the
in-app browser could not connect to the local loopback server; the combined
import-plus-library flow remains an explicit evidence limitation.

### Slice 207 — scope the Phase 9 local artwork expansion

`docs/research/ARTWORK-EXPANSION-PHASE9-SCOPE.md` records a bounded four-image
CMA addition selected after Codex reviewed the independent AIC and CMA research
and visually inspected the exact object pages. Each selection showed the CMA
Public Domain reuse label and its live API record reported `CC0` with a null
copyright field. The images are reference photographs or a paper study, not
clean production artwork or seamless tiles. AIC items remain held out because
their official pages/images could not be inspected through ordinary access.

The selected print JPEGs total 19,405,468 bytes; with the unchanged eight-item
Met seed, source assets are projected to total 46,910,967 bytes before build
overhead. No image bytes or application behavior changed in this research
slice. Slice 208 implements exactly these four records, records the actual
build delta and preserves the existing asset IDs/bytes. The API-reported JPEG
sizes did not match the bytes currently served; the exact response lengths and
hashes supersede the selection-time projection in
`docs/research/ARTWORK-EXPANSION-PHASE9-SCOPE.md`.

### Slice 208 — implement and practice the scoped local artwork expansion

The catalog now has twelve stable bundled references: the eight unchanged Met
items plus exactly four approved CMA records. CMA records retain their own
item identifiers, API IDs, official source filenames, credit lines and exact
image hashes. The item-page Public Domain label is shown separately from the
CMA API's `CC0` status and null copyright field. The reference photographs and
paper study are not represented as clean standalone artwork or verified
seamless tiles. Met IDs and bytes are unchanged; source assets total
46,897,731 bytes, about 44.73 MiB.

Search includes the museum item identifier and source-specific API-rights
evidence. Provenance completeness checks validate the appropriate rights
evidence shape for each museum, and the UI describes the source by institution
and accession/record number. All ten taxonomy categories are represented.
Catalog image previews resolve from the local application bundle; museum
source addresses remain provenance text, not runtime image URLs.

Verification: `npm run coverage` passes at 100% for statements, branches,
functions and lines, including the export byte-identity regressions;
`npm run build` passes. The production build contains twelve JPEG assets
totaling 46,897,731 bytes, with every built image SHA-256 matching its source
file. In a separate local preview at 1280×720, the expanded catalog search,
CC0 search, Dot/spot filter, CMA staging and placement, and combined bundled-
plus-imported artwork save/reload were exercised. Both the stable CMA ID and
the separate local-import ID remained after reload; there were no browser
console errors. The practice and evidence limitations are recorded in
`docs/planning/ARTWORK-LIBRARY-V1-EXECUTION.md`.

At the Slice 208 cutoff, the bounded expansion and practice were complete and
Phase 9 still awaited maintainer exit review. Slice 210 records the later
acceptance of this small, useful local reference V1, while explicitly keeping
the denser production-art library as future backlog. No garment queue, paid
service, runtime museum request or physical-fit claim is authorized.

### Slice 209 — Verify real browser and desktop artwork drops

The Slice 200 unit test now exercises a failed replacement through drag/drop
(not the file picker) and confirms the prior stored asset record remains
unchanged. A new Chromium verifier creates real browser-realm `File`,
`DataTransfer` and `DragEvent` objects, then checks picker import, dropped new
placement, dropped replacement, unsafe-SVG replacement rejection, save/reload
with stable IDs, 375px layout, zero console/page errors and zero remote
requests. The Electron verifier performs the equivalent drop workflow in the
actual renderer and confirms both successful drops survive app restart with
stable IDs in the isolated user-data store. An unsafe dropped replacement is
rejected without changing the prior ID. Existing IPC byte-round-trip,
traversal-rejection and SVG-safety checks remain in place.

Verification: the focused unit test passes; the full gate passes all 111 test
files / 1,558 tests with 100% statements, branches, functions and lines,
including the 8 export regression and 9 export identity checks. `npm run build`,
`npm run web:verify-artwork-store`, and `npm run electron:verify-artwork-store`
pass. The browser viewport is exactly 375px wide with no horizontal overflow;
Electron reports the same narrow-layout result. No production source, schema,
dependency, export byte, artwork asset, account or service changed. Phase 7
remains Done; this supplemental test closes its real drag/drop evidence gap
without changing the acceptance scope.

### Slice 210 — accept bounded artwork reference V1 and close Phase 9

The maintainer accepted the twelve-item local reference catalog as the Phase 9
exit. The review records the actual scope and evidence: ten represented
categories, the limitations in subject/format/production readiness, Codex-run
practice rather than an independent user trial, and the remaining expanded-
catalog keyboard/narrow-width evidence gap. This does not call the catalog a
dense production-art library.

`CAPABILITY-G17` queues the denser fashion-oriented production-art library
after the already-scoped G01–G16 work. It remains Backlog, unestimated and
unstarted; refine its acceptance details later, and do not incur any one-time
or recurring cost without the maintainer reopening that boundary. This queue
does not open a garment queue or authorize other future-roadmap work.

The Phase 9 board item is transitioned to Done through the shared validated
Control Center command layer with exit-decision evidence. The other eight
pre-garment phase items were already Done with linked exit evidence. Slice 211
will make the separately requested Epic 13 grouping only after rechecking all
nine items and their evidence; the branch is not merged by this goal.

### Post-merge PR audit — 2026-09-21

GitHub PRs #7, #8 and #9 were reviewed as one stacked chain: Slice 128
guidance, Slice 129's cross-garment exit audit, and Slice 130's measured
surface guidance. Their heads were already ancestors of `origin/main` through
Codex's reviewed Epic 6 integration at `f92e28f`; merging them now would be an
empty duplicate. They were closed as superseded after the final audit.

The audit repaired one real edge case from Slice 130: clearing an optional
source-pixel field now removes the optional value and returns to unknown,
rather than storing `NaN` and showing a false error. Guidance Review focus now
selects the vertical offset when only Y leaves the frame and selects whichever
source dimension is actually resolution-limiting. The repair preserves the
warn-only, no-gating contract and all export baselines.

## Completed work — Epic 11 implementation

### Slice 155 — pure shaped collar and stand geometry contract complete

`src/drafting/polo-collar.ts` now unwraps the actual drafted front and back
neckline edges into measured CB/shoulder/CF seam facts, shapes the front rise
without silently clamping the requested value, derives the measured upper
stand and equal collar bases, and reports finite invalid choices as actionable
issues. The module is pure drafting geometry and is exported from the drafting
barrel; it does not yet change the Polo recipe, UI, renders or export bytes.

The focused collar contract suite is 11/11 (23/23 with the existing Polo
suite), strict TypeScript passes, and the
unchanged full baseline gate is 101 files / 1,378 tests with 100% statements,
branches, functions and lines. Slice 156 is next. No physical-fit claim is
made.

### Slice 156 — shaped collar and stand pieces complete

The existing nine-role Polo recipe now consumes the actual front/back neckline
edges through the Slice 155 contract. Outer/inner stands and upper/under collars
are four real cut-on-fold pieces with measured curved seams, CB/shoulder/CF
placement marks, explicit seam allowances, and collar bases copied from the
measured upper stand. `standFrontRise` and `collarPointExtension` are live
recipe options with the packet's defaults and bounds; existing placket seams,
POMs and non-Polo paths remain unchanged. Preview, persistence, vents and
placket-base marks remain in later slices. Focused drafting coverage is 25/25;
the full project gate is 102 files / 1,392 tests with 100% statements,
branches, functions and lines. No physical-fit claim is made.

### Slice 157 — placket-base construction marks complete

The on-fold Polo front retains the measured `placketOpening` and both exact
attachment stitches, while its live slit base now emits two diagonal
`placketBaseClipLeft` / `placketBaseClipRight` cut marks and a named
`placketBaseReinforcement` box line. All three are derived from the existing
1 cm attachment allowance; no exterior centre-front seam, gusset or button
change was introduced. Focused drafting and parsed SVG/DXF/PDF/projector tests
pass. The complete gate is 102 files / 1,393 tests with 100% statements,
branches, functions and lines. No physical-fit claim is made.

### Slice 158 — side vents and dropped back hem complete

Polo now exposes `sideVentDepth` (default 6 cm, 0–15 cm) and `backHemDrop`
(default 1.5 cm, 0–5 cm) as live recipe options. Zero vent plus zero drop
returns the original uninterrupted side/hem topology; an enabled vent splits
each body at an aligned `ventTop` mark, leaves the open `vent` edge out of the
sewn side interface, and extends only the back hem by the selected drop.
Separate front/back body-length and back-drop POMs read the drafted geometry.
Polo guidance now reports collar-curve issues, vent finishing/armhole/drop
conflicts, placket proximity and seam-length mismatches without changing raw
values. The woven-shirt vent code was not modified. The full gate is 102 files
/ 1,396 tests with 100% statements, branches, functions and lines. Strict
TypeScript and the production build also pass. No physical-fit claim is made.

### Slice 159 — front/back preview, controls, persistence and reports complete

All eight Polo option rows now carry units, grouping and actionable help, and
the existing option/persistence contract routes the four V2 values without a
save-version bump. Pre-Epic-11 Polo saves keep their raw option map and receive
the V2 defaults when resolved; invalid collar and seam guidance now targets
visible `option-*` controls. POMs no longer duplicate generic body length and
now measure the back vent separately; the tech pack records placket-base
reinforcement, vent finishing and separate front/back hemming.

The assembled and Body renderers now share the neckline-derived collar/stand
facts on front and back, with live vent and back-drop silhouette cues and all
eight option owners. Fresh-origin browser QA inspected both Body figures and
the assembled preview, and confirmed that vent/drop cues are emitted as actual
SVG paths. The complete gate is 102 files / 1,406 tests with 100% statements,
branches, functions and lines; strict TypeScript, the production build,
export-identity coverage and `git diff --check` pass. No physical-fit claim is
made.

### Slice 160 — cross-size, surface, nesting and export pressure matrix complete

The Polo V2 pressure matrix now covers XS, M and XL redrafts; endpoint and
crossed-risk options; shortest-body maximum placket/vent combinations; finite
cut loops and independent polygon simplicity; actionable guidance; incomplete
recovery; undo/redo; narrow/wide deterministic markers; populated surface
placements; and SVG, DXF, tiled PDF, A0, projector and tech-pack consumers.
The matrix is a downstream safety net and does not modify Epic 7 nesting
semantics or any protected export baseline.

The recipe-owned A0 path now opts into the existing whole-piece overflow mode
because true-scale default Polo pieces can exceed one portrait A0 sheet; parsed
page-local bounds prove that the resulting pages remain on-sheet without
silently shrinking geometry. Tech-pack construction text now follows the live
vent and back-drop options, and seam-mismatch guidance targets the active
option. The full gate is 103 files / 1,412 tests with 100% statements,
branches, functions and lines; strict TypeScript, production build, export
identity and rendered/parsed output checks pass. No physical-fit claim is made.

### Slice 161 — Epic 11 exit and durable handoff complete

The complete Epic 11 review is recorded in
`docs/release/EPIC-11-EXIT-REPORT.md`. Codex reviewed the six implementation
commits from Slices 155–160, independently assessed the bounded Claude Opus 5
audit, repaired its three real downstream findings, and completed the live
Pattern/Body/assembled/Size run/Spec/Nesting/Check/Edit/Style review. The full
gate remains 103 files / 1,412 tests with 100% statements, branches,
functions and lines; TypeScript, production build, parsed output checks and
protected export identity pass. No physical-fit or production-readiness claim
is made. Slice 161 changes documentation/evidence only; the next work is
the reviewed handoff is pushed to `origin/main` at `3057c6c`, followed by any
separately authorized promotion.

## Current work — Epic 12 Web Platform

### Approved interim static preview — deployed; automatic delivery active

The maintainer approved a zero-cost, local-first friend/family preview before
login, profiles, cloud sync, custom-domain or paid launch infrastructure. The
preview serves only the Vite `dist/` artifact from `main` at a Cloudflare Pages
`*.pages.dev` URL, keeps `noindex, nofollow, noarchive` in the HTML, and uses
URL-only access initially. It does not add a database, auth SDK, telemetry,
email sender or measurement egress; each user's saved work remains in that
browser's local storage.

Repository-side gates passed after the noindex hardening: `npm test` (104 files
/ 1,415 tests), strict TypeScript, production build, deterministic web
manifest, local HTTP asset smoke, and a fresh Playwright network capture with
only same-origin HTML/CSS/JS requests. Fresh desktop and mobile viewport checks
mounted InfiniDrip with no page errors. The noindex change is on
`origin/main` at `ae1afe8`.

The canonical production preview is live at
`https://infinidrip-preview.pages.dev/`. The successful GitHub Actions run #6
(`https://github.com/kshitijpatne/InfiniDrip/actions/runs/35680723851`) built
and deployed `main` commit `6ac4eddf83d8fa9c21860f4e21326dcd17b79d7f` to the
immutable URL `https://9160f7f6.infinidrip-preview.pages.dev`. Fresh-browser
checks and the maintainer's phone smoke test loaded the shared URL successfully.

The project remains Cloudflare Direct Upload; it cannot be converted to Git
integration. The bounded `.github/workflows/pages-deployment.yml` workflow is
now active: every push to `main` and an explicitly requested manual dispatch
run the full test/build/deterministic-artifact gates before uploading `dist/`
to the `infinidrip-preview` project. A failed gate leaves the last healthy
production deployment unchanged. The workflow uses the protected
`CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` GitHub secrets; the current
user-owned Pages token is not stored in the repository and is scheduled to
expire on 2027-03-20, so it must be rotated before then.

### Slice 176 — static preview noindex hardening complete

The approved friend/family preview now emits `noindex, nofollow, noarchive` in
its static HTML. This changed no drafting, persistence, export, account, data
or provider-runtime behavior. The hardening is on `origin/main` at `ae1afe8`,
and the existing fresh-browser, network-capture and static-artifact evidence
continues to cover the URL-only preview. Slice 176 is already assigned and
must not be reused for a later feature.

Slice 177 records the maintainer's launch-cost hold, verifies the no-cost
static-preview and public-repository CI boundaries, corrects the future slice
sequence from the next unused number, and adds the unique monotonically
increasing commit rule. It is documentation and delivery-governance work only;
no provider, account, database, auth path, personal-data flow or application
runtime behavior changed. Slice 177 is now assigned to this decision and must
not be reused.

### Slice 178 — local feature lifecycle and Polo rollout readiness complete

The repository-local flag contract is implemented in
`src/platform/feature-flags.ts` with typed metadata for owner, audience,
default, expiry, ON/OFF behavior, removal release, rollout mode and fallback
availability. Unknown keys, stale/invalid expiry metadata, embedded defaults,
deterministic local overrides and readiness-only flags return explicit,
truthful diagnostics. The catalog records `polo_v2` as readiness-only with no
compatible V1 fallback; no live toggle is wired and no V1 renderer was
invented.

Claude's read-only source audit confirmed that Polo V1 geometry was replaced
in place and that legacy saves feed the current V2 pipeline rather than a
parallel V1 renderer. Existing persistence coverage continues to prove that
pre-Epic-11 option maps load without a save-version bump. No drafting,
persistence, export, provider, network, account or personal-data behavior
changed.

The full gate passes 105 files / 1,421 tests with 100% statements, branches,
functions and lines; strict TypeScript, production build, focused flag tests,
deterministic export identity and parsed/rendered consumer coverage pass. Slice
179 followed as the next no-cost implementation slice.

### Slice 179 — local delivery and rollback rehearsal complete

The provider-neutral `ops/web/release-rehearsal.mjs` contract binds a commit/ref
identity to a stable whole-manifest SHA-256, explicit tests/build/manifest/
smoke booleans, reviewer approval and a timestamp. Invalid or failed checks
cannot be promoted. A smoke-only failure selects a fully validated previous
known-good candidate; malformed candidates and invalid rollback targets are
rejected, and every result records `operation: "none"`.

The versioned record in
`docs/release/SLICE-179-LOCAL-DELIVERY-REHEARSAL.md` supplies the freeze
checklist, smoke/incident matrix, no-CODEOWNERS/branch-protection assumption
boundary and explicit future migration deferral. The Control Center now
references the record and its evidence-file hash. No provider, account, cost,
database, auth/profile, personal-data or application-runtime behavior changed.

The focused release proof is `npm run web:release:test`; the full application,
coverage, build, Control Center and existing manifest gates pass. Slice 180 is
now the completed synthetic readiness boundary.

### Slice 180 — provider-neutral readiness dry-run complete

The deterministic fixture in `ops/readiness/readiness-drill.mjs` covers six
local-only synthetic scenarios—preview outage, artifact rollback, local-save
backup/restore, stale throwaway flag, malformed input and synthetic export/copy
removal—and two provider-backed scenarios that are structurally deferred.
Every scenario names an owner, runbook, fallback and evidence. Secret-like and
personal-measurement strings, missing/duplicate/unknown scenarios and any
provider scenario marked passed are rejected.

The durable record is
`docs/release/SLICE-180-READINESS-DRILL.md`. It explicitly separates local
export/copy removal from the unavailable hosted deletion feature, and requires
the stale-flag drill to use a throwaway definition without mutating the real
catalog. The summary is preview-only with six local passes, two provider
deferrals, and both authenticated-beta and production readiness false. No
application runtime, provider, database, auth, monitoring, garment or personal-
data behavior changed. Slice 181 closes the no-cost interim; launch-backed work
remains deferred.

### Slice 181 — preview-only/no-cost exit complete

Slice 181 closes the repository/local no-cost interim only. The exit record is
`docs/release/EPIC-12-NO-COST-INTERIM-EXIT.md`; the Control Center records the
full `Backlog → Ready → In Progress → In Review → Accepted → Closed` history
and verified evidence reference. The final application, coverage, build,
focused web/readiness and board gates pass at the recorded counts. This does
not claim authenticated-beta, public-production or production readiness.

Epic 12 and `REL-PLATFORM-FOUNDATION` remain `In Progress` because identity,
profiles, database/schema/RLS, cloud sync, hosted operations, provider-backed
delivery and the retained launch decision record remain deferred until the
maintainer explicitly reopens launch readiness and cost approval. No garment
implementation starts automatically; the maintainer discussion gate comes
first.

### Slices 171–174 and 176–181 complete; Slice 175 deferred; no-cost interim complete

The maintainer authorized the Public Web Platform and Delivery Governance
Epic after Epic 11. The execution packet is
`docs/planning/EPIC-12-EXECUTION.md`; the threat/data boundary is
`docs/research/WEB-PLATFORM-THREAT-MODEL.md`; the cost envelope remains in
`docs/research/PUBLIC-WEB-PLATFORM-COST-RESEARCH.md`.

Slice 171 defined the local-first boundary, staged identity/cloud-sync
contract, immutable preview/staging/production artifact lineage, logical
Blue/Green aliases, two-week Tuesday release train, two-business-day freeze,
expedited patch route, owned feature flags and repository-local Control Center.
Slices 172–173 implemented the local board and provider-independent web
delivery proof. The board is schema-validated, read-only, truthful about
missing history, and includes an explicit evidence importer that cannot infer
dates, owners, status or delivery. The web proof emits a sorted, repeatable
SHA-256 manifest and rehearses the built app over HTTP plus a fresh browser.
Slice 174 now records the provider-independent identity/cloud-workspace
contract: owner-only P0 workspaces, explicit sync consent, revision/idempotency
conflicts, RLS/grant matrix, expand/migrate/contract sequencing, export,
deletion and backup-retention outcomes, and pressure-tested failure paths. The
cost envelope remains the recommended approximately $59/month authenticated-
beta planning estimate.

The only external deployment exception is the free Cloudflare account/project
and its protected CI secrets used by this URL-only preview. No launch domain,
paid subscription, identity provider, database schema, email sender, telemetry
stream or personal-data collection has been created. The maintainer has now
confirmed that every one-time or recurring launch cost is held until launch
readiness is explicitly reopened. This includes paid plans, domains, profiles,
cloud sync, email, hosted monitoring, paid repository governance, code signing
and provider-backed operations. No drafting, export, legacy hash or physical-fit
boundary changed.

The Slice 175 admission audit is recorded in
`docs/planning/EPIC-12-SLICE-175-ADMISSION.md`. Its unresolved entity,
jurisdiction, privacy, data sensitivity, consent, data-region, retention,
authentication and support questions are retained as a future launch re-entry
checklist. Slice 175 is deferred by the cost hold, not treated as a current
engineering blocker. Login/profile UI, auth, database, cloud sync and
personal-data work remain out of scope.

`npm test` passes 105 files / 1,421 tests; strict TypeScript, the production
build, focused Node tests and the deterministic manifest gate pass. The web
delivery workflow repeats these gates on every production push. No launch
domain, paid subscription, identity provider, database schema, email sender,
telemetry stream or personal-data collection has been created. No drafting,
export, legacy hash or physical-fit boundary changed.

The reviewed Slice 172–173 implementation and automated delivery workflow are
pushed to `origin/main` at `6ac4edd`; Slice 174 and the Slice 175 admission
audit remain documentation-only until launch is explicitly reopened.

The no-cost interim is complete. Remote flags, provider promotion, hosted
monitoring, auth, database, email, cloud data and personal-data collection
remain deferred. Before the garment queue, the maintainer will discuss and
refine the tutorial, repository cleanup/history question, delivery board,
garment UI/artwork work and README/ARCHITECTURE rewrite; garment work then
requires a separately scheduled execution packet.

## Current work — post-Epic 6 planning

### Epic 8 — true-shape nesting proof admission contract complete; runtime blocked

The reserved Epic 8 slot has a bounded Codex-authored recommendation in
`docs/planning/EPIC-8-EXECUTION.md`, supported by
`docs/research/NESTING-REDESIGN-RESEARCH.md`. It evaluates an isolated,
fixed-seed Sparrow/Jagua Rust/WASM worker against the completed Epic 7 nesting
contract while keeping the current deterministic shelf packer as the default
and unconditional fallback. The candidate may return transforms only; owned
InfiniDrip validation must enforce finite geometry, overlap, clearance, width,
grain, fold, nap, pair/mirror, quantity and identity rules.

Slice 162 is complete at `src/export/nesting-proof-contract.ts` with focused
100%-covered contract tests and the durable record
`docs/research/EPIC-8-SLICE-162-ADMISSION.md`. It records exact candidate
revisions and confirms Sparrow's MIT / Jagua-RS's MPL-2.0 posture. The contract
only admits explicit one-material, non-fold, non-mirrored physical pieces and
rejects unknown facts. It changes no current behavior.

The safe Slice 163 artifact/legal/worker packet is complete in
`docs/research/EPIC-8-SLICE-163-ADMISSION.md`, with the InfiniDrip-owned locked
evidence under `docs/research/epic8/sparrow-wasm/`. It records the exact
Sparrow/Jagua/Sparrow Studio revisions, Cargo graph, full notices, hashes,
MPL-2.0 source/modification duties, build flags and offline rebuild gaps. The
evidence is not runtime admission: no pinned `wasm-pack`, Cargo vendor/source
replacement, generated WASM hash, local Rust build or offline replay exists.
The inspected upstream worker also fails InfiniDrip's hard memory/watchdog,
runtime malformed-output, deterministic-replay and unconditional shelf-fallback
requirements.

The original Slice 163 adapter and Slices 164–168 are therefore not admitted.
Epic 8 is on the proof-only/no-go exit lane; `nestPieces` remains the only
runtime nesting behavior and unconditional fallback. No solver, WASM, UI,
persistence, export, benchmark or legacy baseline changes are allowed without
a new maintainer-authorized packet that closes every failed gate. Provisional
later slices remain historical scope only. The completed durable exit is
`docs/release/EPIC-8-EXIT-REPORT.md`.

The retained future scope is a bounded helper/adapter proof around an external
candidate solver, not a clone or fork of Sparrow/Jagua and not a replacement
nesting engine. InfiniDrip would continue to own garment semantics, geometry
validation, export identity and unconditional shelf fallback.

### Slice 154 — garment-expansion research wave complete

Slices 149–154 now provide a shared dependency contract, four pressure-tested
garment records and the binding cross-family synthesis in
`docs/planning/GARMENT-EXPANSION-SYNTHESIS.md`. Codex authored shorts and jeans,
reviewed and corrected Claude's isolated jogger and sweatshirt/hoodie packets,
and reconciled the findings against current code and authoritative sources.

All four garment families belong in the future library, but implementation
remains unauthorized. The recommended order after the already-packeted Polo V2
is casual shorts, adult crewneck sweatshirt, adult jogger, pullover-hoodie
extension, then rigid five-pocket jeans. Exact estimates are 7–9, 6–9, 5–7,
5–8 additional and 11–14 slices respectively. Numbers are deliberately not assigned to
future epics because Epic 8 remains reserved and the product owner owns
scheduling.

The binding shared decisions are: no automatic material-derived rib/elastic/
shrinkage constants; no new global body field or save bump; user-owned finished
band/cuff lengths with a ratio-aware stretched-join interface; buttonhole marks
plus BOM text for P0 eyelets; adult-only jogger/hoodie P0; and explicit
multi-material nesting limitations. The current material record still lacks
recovery, weight, shrinkage and direction-specific stretch.

Epic 7 is reviewed, merged and pushed at `origin/main` commit `db14b63`, so the
Epic 11 Slices 155–161 start gate was satisfied. Epic 11 is complete; Epic 12
is now the active platform lane. Epic 8 remains runtime-gated by its artifact,
license and worker-admission conditions.

### Slice 149 — garment-expansion research wave started

The product owner authorized a parallel documentation-only research wave for
casual shorts, joggers, cut-and-sew crewneck sweatshirt/pullover hoodie, and
jeans. The binding scope, evidence standard, ownership and stop conditions are
recorded in `docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md`.

Codex owns the family dependency contract, shorts, jeans, cross-family
synthesis, final decisions and integration. Claude Code CLI may edit only the
jogger and sweatshirt/hoodie research records in an isolated worktree; Codex
must independently review every source, conclusion and diff. This work does
not authorize production code, new recipe IDs, material-contract changes,
baselines or physical-fit claims and does not touch Epic 7.

The research wave occupied Slices 149–154. Epic 11's implementation scope is
unchanged and renumbered to Slices 155–161; its reviewed-Epic-7 start gate is
now satisfied.

### Slice 148 — EPIC 11 Polo V2 research and execution packet complete

Codex completed the cross-vetted Polo V2 record in
`docs/research/garments/POLO-V2-RESEARCH.md` and the binding Slice 148 plus
Slices 155–161 packet in `docs/planning/EPIC-11-EXECUTION.md`. The review covered the shipped
V1 draft/render/export contracts, the supplied 22-page Polo CAD assignment,
independent collar/stand, placket, vent, band and grading sources, the existing
woven-shirt component evidence, and the active Epic 7 boundary.

Epic 11 P0 is now fixed: replace the rectangular stand/collar with shaped
neckline-derived curves; expose CB/shoulder/CF landmarks; render the same
collar/stand on front and back; add true placket-base clip/reinforcement marks;
and add adjustable side vents and a dropped back hem. `standFrontRise` defaults
to 0.75 cm, `collarPointExtension` to 1.5 cm, `sideVentDepth` to 6 cm, and
`backHemDrop` to 1.5 cm, with exact bounds and incompatibility guidance in the
research record.

Sleeve rib/band, material-dependent upper-collar turn-of-cloth and isolated
manual grade offsets are explicitly excluded: the current draft graph does not
receive fabric stretch/recovery, and the supplied CAD point movements are not a
complete grade specification. V2 continues the existing grade-by-redraft model
and proves every size from the actual neckline and stand seams.

This is an execution-ready documentation result, not an implementation-start or
physical-validation claim. Its Epic 7 prerequisite is now satisfied by the
reviewed `origin/main` integration at `db14b63`; Slices 155–161 still begin only
when the product owner schedules Epic 11. No application code or export
baseline changed in Slice 148.

### Slice 131 — EPIC 7/9/10 execution scopes recorded; Epic 7 re-scoped for implementation

Codex has recorded the durable execution packets before implementation:

- `docs/planning/EPIC-7-EXECUTION.md` is the Codex-owned Nesting Intelligence
  Pack implementation packet for OpenCode. It replaces the stale evidence-audit
  wording that had not reached the contributor's `241732e` checkout. It defines
  Slices 132–134, exact buffer/on-hand/directional decisions, file boundaries,
  gates, and the return contract.
- `docs/planning/EPIC-9-EXECUTION.md` is Codex-owned desktop release readiness
  for the current host-supported unpacked Electron package. Its bounded scope
  covers offline launch, native save, six exports, fresh/stale state, menu and
  window lifecycle, realistic failure handling, and package integrity. It does
  not authorize signing, updater feeds, installer claims, or cross-OS claims.
- `docs/planning/EPIC-10-EXECUTION.md` assigns isolated test/developer-only
  hardening to Claude Code CLI under Codex control. Seeded/bounded properties,
  a test-only geometry oracle, seven-recipe coverage, old-save compatibility,
  surface invariants, and permanent fixtures are in scope; production geometry
  and all baselines remain protected.

The durable goal to complete EPIC 9 and EPIC 10 end-to-end is complete. Codex
was the final reviewer, integrator, and sole pusher to `origin/main`; the
remote ref was verified at the integrated commit `c627ac5` before the final
documentation record. The execution order was Codex EPIC 9 Slices 135–139,
isolated Claude EPIC 10 Slices 140–144, Codex Slice 145 repair, Codex Slice
146 integration, and Slice 147 push verification. Epic 7 subsequently completed
in its isolated OpenCode branch/worktree and reached `origin/main` only through
Codex review and integration.

### Slice 132 — pure nesting metrics and contracts complete

Slice 132 added `src/export/nesting-intelligence.ts`: buffer validation and planned-length
math (default 10%, range 0–50%, step 1%), waste share from utilization,
optional fabric-on-hand fits/short-by verdicts that stay unknown for blank or
invalid input, and the truthful no-rotation nap notice. Unratable input yields
null, never a fabricated number. No UI, geometry, export, or save-schema
change. Difficulty rating stays deferred; Sparrow, rotation, interlocking,
physical validation, and production claims stay out of scope.

### Slice 133 — UI, persistence, and actionable guidance complete

Fabric-view planning controls (buffer with rail/steppers,
optional on-hand length, directional checkbox) with live readouts for
required length, buffered plan, waste %, on-hand state, fits/short-by-X
verdict, and the nap notice. Save/recovery carry an optional additive
section with no version bump: valid values round-trip, missing sections load
defaults, malformed current sections reject visibly, raw invalid recovery
entries restore verbatim. Invalid inputs stay visible with field-linked
guidance and never pause the draft or gate exports. Planning state is global
like fabric width; metrics recompute per draft across garment/style/scope
switches.

### Slice 134 — Epic 7 reviewed, merged and pushed

The exit audit proves empty, valid, invalid, too-short, and
too-narrow planning states plus deterministic scope round-trips, per-garment
save/load, and responsive rendering on all seven garments through the real
mounted app; `docs/release/EPIC-7-EXIT-REPORT.md` records commands, evidence,
limitations, and defects. Parsed SVG/DXF/tiled-PDF/A0/projector/tech-pack
consumers and all eight legacy hashes verified with planning state present.
No physical cutting, fit, cross-OS, signing, or geometry work. Codex reviewed
the contributor commits, integrated current `main`, ran the full gate and live
mounted-app checks, and pushed `db14b63` to `origin/main`; see
`docs/release/EPIC-7-EXIT-REPORT.md`.

### EPIC 9 — implementation complete on the supported host

The Codex-owned Electron readiness scope is implemented. The self-contained
developer harness covers offline unpacked launch, fresh and malformed state,
native-save success/cancel/write failure, all six exports through button and
menu routes, activation, close/relaunch, malformed window state, package
inventory, parsed output structure, and rendered screenshots. The Windows x64
unpacked artifact passed twice with the same package manifest hash. The
durable evidence is `docs/release/EPIC-9-EXIT-REPORT.md`; raw evidence remains
under `tmp/epic9-release/`. Signing, updater, installer, and unsupported-OS
claims remain explicitly unverified.

### EPIC 10 — implementation and adversarial hardening complete

The isolated Claude Code CLI contribution was reviewed from branch
`claude/epic-10-adversarial-hardening` at the EPIC 9 integration commit. It
added only the approved dev-only `fast-check` and `@flatten-js/core`
dependencies plus five bounded quality test files; no production module
imports either library. Fixed seeds and run bounds cover surface-placement
invariants, actionable invalid guidance, deterministic persistence and v1–v4
save compatibility, finite/deterministic geometry for all seven recipes, and
empty-placement export identity.

The independent oracle found a real concave seam-allowance CUT-loop defect in
the shipped trouser back and a replayed woven-shirt edge fixture. Codex
inspected the actual diff, added a local crossing-loop trim in
`src/render/allowance.ts`, added a focused regression test, and converted the
two permanent fixtures to ordinary assertions. This is a bounded shipped
defect repair, not a replacement geometry engine or changed source of truth;
all eight legacy export hashes remain unchanged.

The durable evidence is `docs/release/EPIC-10-EXIT-REPORT.md`; raw packaged
EPIC 9 evidence remains under `tmp/epic9-release/`. The integrated checkout
has passed the serial full suite, 100% coverage, typecheck, production build,
parsed-output checks, and the complete packaged Electron gate. Epic 7 remained
an independent OpenCode workstream at that point and has since completed under
Codex review, merge and push authority.

### Slice 147 — EPIC 9/10 goal closed after Codex-only push

Codex pushed the reviewed Slice 146 integration commit `c627ac5` to
`origin/main`; `git ls-remote origin refs/heads/main` returned the same commit
before this documentation-only record was prepared. The final documentation
update is also Codex-owned and preserves the user’s untracked logs and
`tmp/` evidence.

### Epic 6 — complete and pushed (Slices 122–130)

Slice 130 completes the previously blocked surface guidance boundary. It adds
an explicit piece-space anchor contract (artwork centred on the named piece's
true-scale cut-box centre plus offset at base size), measured containment
warnings, optional source-pixel dimensions with the documented 59 px/cm floor,
full-coverage warnings from real cut-outline area ratios, and an editable Name
control so invalid-ID guidance always has a focusable correction target. These
are digital, warn-only contracts: no save-format version change, export gating
change, physical-fit claim, or production-readiness claim is introduced.

Slices 122–130 are accepted on `origin/main`. The completed Epic provides a
headless placement contract, per-garment/style artwork sets with optional
save/recovery persistence, true-scale artwork-space preview, opt-in calibrated
print-sheet output, artwork placement in the tech pack, warn-only invalid-entry
guidance with Review/Set-aside/Show-again behavior, and a seven-garment mounted
app exit audit. Surface state remains outside drafting, grading, POM checks,
nesting, cutting writers, and export gating. Empty artwork preserves the eight
legacy export hashes. The implementation makes no physical-fit, drape,
sewability, manufacturing, or production-readiness claim.

### Slice 127 — tech-pack spec plus opt-in print output (accepted)

Slice 127 adds the output boundary on branch `opencode/slice-127-surface-output`: a fifth tech-pack page naming every artwork entry with true-scale geometry and INVALID flags (empty sets stay byte-identical), a true-scale print-sheet SVG writer carrying the locked 10 cm calibration square, and a Current-style-artwork export scope with an opt-in Print sheet button that stays disabled with an artwork reason while the style is empty. Whole-style semantics match tech pack and projector: the per-size picker is ignored and the copy says so. Artwork-space centimetres are the print specification and piece association is by role name; no on-piece anchor is invented. Cutting writers are untouched and placement never enters them — all eight legacy hashes stay green with artwork present in state. No physical-fit, drape, sewability, manufacturing, or production-readiness claim is made.

### Slice 128 — guidance warnings (accepted)

Slice 128 surfaces invalid placements as warn-only guidance on branch `opencode/slice-128-surface-guidance`: one note per invalid entry with its actionable correction and a Review action focusing the failing control, Set-aside/Show-again dismissal matching existing ignored-guidance behavior (persists across surface edits, clears on pattern change), visibility on the Check view, and no export gating. Panel rows gained the same Set-aside affordance canvas cues offer, since artwork warnings have no canvas target. Slice 130 later supplied the explicit digital anchor, optional source dimensions, and deterministic bounds/resolution/coverage thresholds that complete this guidance boundary. No physical-fit, drape, sewability, manufacturing, or production-readiness claim is made.

### Final Codex review and integration — 2026-09-20

OpenCode's stacked Slice 127–130 branches were reviewed against their actual
diffs. Slices 127–129 had already been reconciled into the local `origin/main`
baseline while Slice 130 was in progress; Codex then integrated Slice 130 after
reviewing its actual code, tests, and live behavior. No contributor branch
pushed directly to `main`. The verified Slice 130 code integration commit is
`f92e28f`; the remote `origin/main` ref was checked against the pushed result.

The review gate passed in bounded serial mode on this Windows checkout:
`npm test -- --maxWorkers=1 --minWorkers=1` passed 94 files / 1,255 tests;
`npm run coverage -- --maxWorkers=1 --minWorkers=1` passed 100% statements,
branches, functions, and lines; `npx tsc --noEmit` and `npm run build` passed.
The default parallel run had one accessibility timeout under host contention;
the same test passed in isolation and in the complete serial gate. This is
recorded as an execution-environment constraint, not a product failure.

The explicit parsed consumer suite passed 30/30 across SVG, DXF, tiled PDF, A0
PDF, projector SVG, tech pack, and the surface outputs, including all eight
unchanged legacy hashes. The mounted-app audit covered all seven garments,
valid and invalid piece-role guidance, low-resolution, out-of-bounds,
full-coverage, invalid-ID focus, artwork panel, preview, print sheet, tech
pack, save/load, warning dismissal/reappearance, responsive widths
1440/1024/768/390, and a clean browser console. No live physical or sewn
evidence exists.

### Slice 126 — UI wiring (accepted and pushed)

Slice 126 wires the headless surface foundation into the Style experience on branch `opencode/slice-126-surface-ui`. One canonical transform type remains (`PlacementTransform`; the `TransformInput` mirror is deleted), rows are identified by position so duplicate or hostile ids cannot confuse them, and placements persist per garment/style through an optional save/recovery section with no format-version bump — pre-surface saves and recovery payloads load with empty artwork, malformed sections are rejected, and raw invalid values round-trip verbatim for lazy validation. The panel offers add/edit/remove with numeric controls, Boundary Rails, and steppers reused from the shared primitives; validation is warn-only with per-row errors and aria-invalid sync; the preview is a true-scale artwork-space SVG that lists unplaceable entries instead of drawing them. Drafting, grading, checks, nesting, export writers, export gating, and legacy bytes are unchanged. Codex corrected two integration defects: `surfacePlaceable` now delegates to the full `placementError` contract, and native surface text/number inputs stay mounted while typing, committing on focusout; selects commit on change and steppers through a private step event. Fabric.js 7.4.0 (MIT, zero runtime dependencies) passed the scratch prove-or-stop round-trip with byte-identical cubic path data, but no dependency was added: numeric editing plus the string-based preview needs none, and direct canvas manipulation stays a deferred, explicitly re-verifiable decision. No physical-fit, drape, sewability, manufacturing, or production-readiness claim is made.

Acceptance evidence: `npm test` passed 89 files / 1,196 tests; `npm run coverage`
passed 100% statements, branches, functions, and lines; `npx tsc --noEmit` and
`npm run build` passed; the explicit parsed consumer suite passed 18/18 across
SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech pack, including all eight
unchanged legacy hashes. Live review covered Style wiring, direct field entry
and blur commit, invalid-value/no-preview behavior, +/- recovery, save/load,
style isolation, all seven garments, assembled preview, responsive widths
1280/900/700/560/390×844, and a clean browser console. This is digital evidence
only; physical fit, sewn validation, manufacturing, and production readiness
remain unverified.

### Slices 122–125 integration checkpoint — reviewed and passing

OpenCode PRs #1–#4 map to Slices 122–125 and their remote heads are
`bd6894b`, `90fde73`, `b374159`, and `a9a168d`. Each branch was accessible,
reviewed against its actual diff, and merged and pushed on top of the Epic 5 exit
`13d7195` (integration commit `065561c`). The changes are additive: two research/planning documents, a pure
placement model, headless transform math, and a pure SVG overlay renderer.

Codex corrected one contract gap during integration: effective resolution now
rejects non-positive source-pixel dimensions, and the overlay test consumes the
actual transform module output. At that historical checkpoint, persistence,
Fabric.js fidelity, UI wiring, tech-pack placement output, guidance warnings,
and print-ready output remained explicit future Slice 126–128 work; Slice 126
has since delivered and passed the UI/persistence boundary recorded above. No
drafting, grading, checks, nesting, export writers, or legacy bytes changed.

The complete gate for this checkpoint passed: 88 files / 1,139 tests, 100%
statements/branches/functions/lines, typecheck, production build, and parsed
SVG/DXF/tiled PDF/A0/projector/tech-pack plus eight unchanged legacy hashes.
The new modules have focused cross-module coverage; they are headless and do
not add a new live UI path. Physical fit, manufacturing, and production
readiness remain unverified and must not be claimed.

### Epic 5 beginner-facing workspace redesign — completed

### Open-source audit checkpoint — current sequence unchanged

The 2026-09-17 repository audit is complete and durable at
`docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md`. It covers every supplied repo,
both GitHub topic pages, the two awesome directories, a systematic reject/defer
ledger, and adjacent high-synergy candidates. Claude Code handled the isolated
deep source/license pass for OpenPattern, GarmentCode and deepFashion3D;
OpenCode handled the broad directory/topic sweep; Codex cloned and sampled the
sources, checked both reports against the current TypeScript architecture, and
made the final decisions. No external agent edited the product checkout.

No garment engine, 3D/virtual-try-on stack, or external geometry implementation
is approved for direct product integration. The bounded survivors are: an
`axe-core` dev-only trial inside Slice 121's existing accessibility gate;
post-121 `fast-check` property-test and `@flatten-js/core` test-oracle trials;
and the now-scoped but implementation-gated Epic 8 opt-in Sparrow
irregular-nesting proof, which still requires explicit grain, nap, fold,
pair/mirror and clearance constraints. GarmentCode remains reference-only for
future stitch orientation, projected ease/correspondence, and
option-compatibility metadata with real consumers. None authorizes 3D, photo/CV,
silent correction, output-baseline movement, or physical-fit claims.

Epic 5 / Slice 121 is complete on `codex/ux-studio`. The final code checkpoint
is `52ee690`; it adds the dev-only `axe-core` audit and fixes the two ARIA
violations it found without changing drafting, exports, or legacy bytes. The
research work changed documentation only. Preserve the existing untracked logs
and `tmp/`.

### Epic 5 exit — Slice 121 final integration gate — PASS — 2026-09-19

The actual history shows Epic 4 closed at `816b9ff` (Slice 113), followed by
the separately authorized redesign at Slice 114. This work is therefore named
Epic 5; historical Epic 4 documents remain unchanged. The stable execution
record is `docs/planning/UX-REDESIGN-EXECUTION.md`, titled and governed as
Epic 5.

Final gate evidence: `npm test` passed 85 files / 1,102 tests; `npm run coverage`
passed 85 files / 1,102 tests at 100% statements, branches, functions, and
lines; `npx tsc --noEmit` passed; `npm run build` passed after transforming 96
modules; the parsed SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech-pack
suite passed 18/18, including all eight unchanged legacy hashes. The separate
`axe-core` audit passed 2/2 stateful tests across the major stages and dirty
Load dialog; jsdom color contrast was intentionally excluded and reviewed in
the live browser matrix.

Live evidence covered all seven garments, all seven views and Assembled
round-trips, field +/-/rails/manual entry, appearance, guidance correction and
recall, recovery/history, Save/Load, selected-size nesting and a browser SVG
download. Responsive checks at 1280/900/700/560/390×844 found no page-level
horizontal overflow; the final rebuilt browser smoke had a clean console.
No physical-fit, sewn-sample, manufacturing, or production-readiness claim is
made. The full commit list is in the Epic 5 execution exit report.

Documentation/history audit before merge: `git diff origin/main...HEAD -- '*.md'`
contains only the intended current-context modifications and research additions;
it contains no documentation deletions. The parallel OpenCode/Claude
open-source research packet is present through `0dc1507`, and the Desktop
Release research blob matches the approved baseline byte-for-byte
(`e1c36989483f7a3c39ace14207114d97c7c743a8`). The separate Claude shell-
hardening branch was reviewed as a platform workstream and is intentionally not
mixed into Epic 5; its unverified Electron changes remain outside this merge.

### Slice 120 checkpoint — Check-to-Export context and selected-size nesting (historical checkpoint)

Slice 120 is committed in `330acb9` on `codex/ux-studio`. The Export stage now
places the selected-size picker before the format actions, states that it drives
the four selected-size files and Single size nesting, and gives every SVG, DXF,
tiled PDF, A0, Tech Pack, and Projector action a visible purpose/scope
description plus an accessible description. Existing export button IDs and
writers are unchanged.

Single size nesting now drafts from `draftAtSize` using the selected export step;
the visible nesting label and canvas redraw when that size changes. The graded
marker remains an all-size output and remains independent of the picker.

Changed paths: `src/ui/app.ts`, `src/ui/app.test.ts`, `src/ui/view.ts`,
`src/ui/view.test.ts`, and `src/ui/studio.css`.

Bounded verification passed: `npm run coverage` ran 84 files / 1,100 tests with
100% statements, branches, functions, and lines; `git diff --check` passed.
The TypeScript, production build, parsed-consumer, legacy-hash, and rendered
live matrix remain part of the final gate rather than being claimed here.

The remaining work recorded at this checkpoint was completed by Slice 121 and is
superseded by the Epic 5 exit report above.

### Slice 119B checkpoint — unfinished-draft recovery and bounded Undo/Redo; full gate pending

Slice 119B implementation is committed as `bd08991` on `codex/ux-studio`.
It adds a separate `patternworks_recovery_v1` local safety envelope: every
dirty draft can retain raw incomplete measurement/option strings, and a reload
or navigation attempt offers `Recover the last local edit?` with explicit
`Recover draft` and `Discard draft` choices. Recovered invalid values keep the
draft paused; formal Save, drafting, and export still reject invalid input.
The existing dirty replacement dialog remains separate for a validated saved
workspace, and `beforeunload` protects a dirty browser document.

The same slice adds a bounded 30-snapshot UI history. Visible Undo/Redo actions
and Ctrl/Cmd+Z, Shift+Z, and Y operate on workspace snapshots; native text,
textarea, select, and contenteditable editing is left to the browser. Redo is
cleared after a new edit. Spatial guidance now reports every additional warning
when the active lens cannot show all notes, including warnings without a direct
target, so the overflow cue is truthful.

Changed paths: `src/ui/app.ts`, `src/ui/app.test.ts`,
`src/ui/appearance.test.ts`, `src/ui/bugfix-p1.test.ts`, `src/ui/history.ts`,
`src/ui/history.test.ts`, `src/ui/persist.ts`, `src/ui/persist.test.ts`,
`src/ui/studio.css`, `src/ui/view.ts`, and `src/ui/view.test.ts`.

Bounded verification passed: `npx vitest run
src/ui/history.test.ts src/ui/persist.test.ts src/ui/view.test.ts` at 106/106;
`npx vitest run src/ui/app.test.ts -t "handles spatial guidance geometry
fallbacks" --reporter=verbose` at 1/1; `npx tsc --noEmit`; and
`git diff --check`. Live browser evidence recovered an unfinished blank Waist
draft without allowing drafting/export, discarded the recovery prompt, and
round-tripped an accidental `9192` edit through Undo and Redo before saving a
valid `92`; the recovery modal and `Draft paused` state were visually
inspected. This is bounded evidence, not the final redesign gate.

The full `npm test`, `npm run coverage`, production build, parsed SVG/DXF/PDF/
projector/tech-pack consumers, eight unchanged legacy export hashes, complete
seven-garment live matrix, and responsive/accessibility matrix remain pending.
No push or usage-credit reset was performed. Resume after a fresh usage check
with the focused app run, then the full gate; inspect the actual diff and
rendered/export evidence before accepting Slice 119B.

### Slice 119A checkpoint — dirty workspace replacement safety; full redesign gate pending

Current checkpoint: `codex/ux-studio` at `58ebd9c` after implementation commit
`84ee51f`; Slice 119A is
committed. Slice 114 research is complete; do not repeat it. The
implementation now has five actual stages:
Garment, Measure, Style, Check, and Export. Readiness—not earlier index—drives
completion: `styleReviewed` is set only on Style → Next, current Check review
is required, and the true Export gate applies to the desktop menu and buttons.

Design measurement, material, option, and target changes invalidate review and
file confirmation. Export size, nesting scope, fabric width, and color changes
invalidate file confirmation; a delayed old desktop write cannot confirm a new
revision. Measure separates body/length groups from Style ease/options groups;
corrections reveal the right stage/group and focus the field. Stage navigation
restores current-stage focus. More views keeps all seven views and supports
Escape, outside click, and selection focus. Skip introduction does not mark
readiness. Journey persistence is v2, accepts legacy v1, and resets historical
`exported` on load. The selected-garment header, named Style combobox, and
local rail containment fix are included. Garment selection is now a descriptive
seven-card library grouped by upper/lower body. Fit intent and material choices
are card-based presentations backed by the existing native selects, so keyboard
and state contracts remain intact. Untouched garment changes use the
garment-family material default; an explicit material choice persists across
garment changes and continues to surface compatibility guidance. Stage changes
reset the bounded inspector to its new context.
Appearance is an on-demand editor in Style: the compact palette opens a
hue/saturation wheel, exact Hex and native color entry, lightness, four screen
texture cues, and shine. The appearance extension is optional in the existing
v5 save payload, so older saves retain the smooth legacy cue. Only the
assembled screen preview receives texture/shine decoration; drafting and export
outputs still use the original color/geometry contracts.

Slice 118 extends the same target contract across the assembled silhouettes for
upper, skirt, and trouser renderers. A field with no target in the active Body or
Pattern lens leaves that lens undimmed and offers a one-click Assembled route.
Warnings with a real visible target render as translucent, collision-aware
spatial notes with connector arrows; a user can set an advisory aside for the
current draft, restore it from the panel or Check, and any draft change clears
the dismissal. Cleared warnings remove their notes automatically. Dismissed
advice is retained as a mild Check-stage reconsideration cue. These notes are
screen-only and never enter SVG, DXF, PDF, or other output contracts.

Slice 119A adds a persistent safety boundary around the existing local
workspace contract. A successful Save records the current output revision as
clean. Load still validates the stored snapshot first; when the current draft
is dirty, a focused replacement dialog offers Keep editing, Escape, or Load
saved workspace. Cancel/Escape preserve the current draft and return focus;
accepting applies the validated snapshot, synchronizes every visible control,
and establishes the loaded revision as the new clean baseline. Clean Load
remains direct. No save schema, export writer, geometry, or legacy baseline
changed, and unfinished recovery/Undo/Redo are not yet implemented.

Slice 119A verification includes `npx vitest run src/ui/app.test.ts
src/ui/view.test.ts` at 157/157 and `npx tsc --noEmit`. The live browser
verified dirty Load at the rendered desktop viewport: the modal appeared,
Keep editing preserved the changed Waist value, and accepting restored the
saved value; the modal treatment was visually inspected. Slice 118
verification includes the earlier app/view 156/156 before the final placement
refinement, a targeted app rerun at 2/2 afterward, and renderer contracts at
55/55 across
garment, skirt, and trouser figures. `npx tsc --noEmit` and `git diff --check`
are clean. The prior Slice 117 affected focused verification passes 201/201 across `app.test.ts`,
`appearance.test.ts`, `persist.test.ts`, and `view.test.ts`; `npx tsc --noEmit`
is clean. The prior Slice 115B checkpoint
passed 207/207 across the five affected UI test files. The actual browser
checkpoint exercised all seven garments through Garment → Measure → Style →
Check → Export, and every one of the seven views round-tripped through
Assembled and returned to its original view. Slice 116 live interaction
additionally rendered all seven garment cards, four fit cards, and five material
cards; selecting Woven shirt used Cotton woven without a warning, while an
explicit Cotton jersey choice surfaced the stable-woven warning and remained
selected. Slice 117 live interaction entered an exact custom color, selected
the wheel with a pointer and keyboard, and enabled Fine weave plus 60% shine;
the rendered editor stayed visible beside the body canvas and the assembled
preview contained the expected screen-only texture and sheen definitions. At
1280/900/700/560/390×844, document width matched the viewport
with no page horizontal overflow; the narrow inspector kept the canvas and a
focused second measurement page visible. Escape returned focus to More views
and an outside click closed it. Screenshots were inline only, not durable
artifacts.

This is still not the final redesign gate. Full per-control live interaction
coverage across every garment, options/material/appearance, persistence and
export path; zoom/text-size checks; `npm test`; 100% coverage; build; parsed
consumer checks; and the eight-hash legacy gate remain. Slices 120–121 remain.
No export writers, geometry, or export baselines changed. The workspace save
payload gained an optional appearance extension with a legacy default. Slices
119A and 119B changed persistence orchestration, recovery/history UI, modal
markup/style, and focused tests only.
Preserve user logs/tmp; no push or credits.

The maintainer has authorized a comprehensive UI/UX audit and redesign from
first launch to export, with research before implementation and the existing
usage pacing/full verification gates. Active branch: `codex/ux-studio`, based
on approved `main`/`origin/main` at `816b9ff`. The live execution record is
`docs/planning/UX-REDESIGN-EXECUTION.md`; research and exact baseline evidence
are in `docs/research/UX-REDESIGN-RESEARCH.md`. Slices 114–121 are reserved.
Slice 120 is committed as `330acb9`; after a fresh usage check, the exact next
action is Slice 121's focused audit followed by the full project gate. Do not
start another expensive slice if the weekly meter reaches the conservative 15%
remaining threshold.

Slice 114 has reproduced the long-control/off-screen-canvas loop, missing Ease
and Woven Body highlights, immediate destructive Load, misleading tour-complete
chips, and Single size nesting that ignores the selected size. The prior gate
proved routing/export behavior, not beginner usability or field/canvas
co-visibility; these new findings remain open. Research includes dated primary
UX literature, competitor documentation, public complaints and a live CLO video
frame. Claude Code's isolated source audit has been reviewed with corrections;
OpenCode's actual research report has also been reviewed, with selected sources
independently checked and overbroad recommendations rejected. BUG-UI-035–047
track the new findings; none is yet closed by a final integration gate.

The intended redesign keeps one canvas beside a bounded/grouped inspector,
uses explicit Garment/Measure/Style/Check/Export stages, integrates the
Assembled lens, improves selection/appearance and field-linked guidance, and
makes save/restore safety persistent. Appearance means screen color and
schematic texture/shine only; no physical-fit or material simulation claim.

Slice 115A now implements the viewport-height studio, grouped measurements,
reversible in-canvas Assembled lens, persistent Save/Load header, readable numeric
actions and explicitly named inputs. A missing target no longer dims a whole
figure. These changes leave geometry/export contracts and legacy baselines alone.
Files: src/main.ts; src/ui/{app.ts,view.ts,studio.css,studio.test.ts,app.test.ts,
view.test.ts,bugfix-p1.test.ts}; this file, ARCHITECTURE.md and UX execution record.

Verified: 19 new studio tests; 34-pass focused studio/Body-linking run; corrected
prior host assertions pass focused reruns; TypeScript and diff whitespace pass.
No current full-suite, coverage, build, parsed-output or legacy gate is claimed.
Live: real 1280/900/700/560/390 widths at height 844 retained the Woven shirt's
last edited control with its canvas. All seven views at 1280×720 switched into
Assembled and back. The viewport integration now works. Detailed evidence and
remaining limitations are in docs/planning/UX-REDESIGN-EXECUTION.md.

Next: continue Slice 115, not 116. Replace tour-complete chips with truthful
stage navigation/readiness, correction routes and stage-specific tools; check
short-height/text-zoom/focus and multi-SVG Fit, then run the full integration
gate. The old expert-skip all-tools state still exists. Later selector,
appearance, spatial-guidance, safety/recovery and export work remains scoped.
Resume with a fresh usage check and `git status --short --branch`; do not redo
research. Pre-documentation usage was 80% short-window / 59% weekly consumed;
next reset is 2026-09-14 03:35:32 UTC. Final checkpoint meter: 86% short-window /
60% weekly used. Supported continuation was confirmed ACTIVE for 23:40
America/New_York, just after that reset. Browser override reset and temporary
dev server stopped. Preserve coverage-p1.log, p1-focused.log and tmp/ (untouched
and unstaged). No push and no account reset credit use.

## Previous baseline — Epic 4 exit

The actual `main` checkout contains the verified Epic 3 work through
`9890beb`. Epic 4 is now confirmed and passed. Slice 105 records the
actual-code baseline, the full Priority 1 scope, the seven-recipe migration
contract, the one user-facing composition-proof boundary, and the separate
Desktop Release delegation workstream. Slices 106–113 implement, adopt, and
verify the typed grammar contract across all seven registered recipes. The
public recipe seam and downstream `Block` contract remain intact. Epic 4 is
closed; no later Epic has started.
The BUGFIX P1/P2/P3 and FC-01 records are closed. Preserved untracked logs and
`tmp/` evidence remain user artifacts and were not touched or staged.

Slice 94 is complete as a research/contract foundation. It adds
`docs/research/garments/TROUSER-RESEARCH.md` and
`docs/planning/EPIC-3-EXECUTION.md`, and records the reusable relaxed casual
straight-leg scope: explicit lower-body measurements, recipe-owned rise/
waistband/leg/closure/pocket controls, four-panel leg roles, separate
waistband, simple front fly, minimal paired pocket bags, guidance/grading/POM/
export/persistence contracts, and later shorts/jogger relationships. No
implementation code, output writer, or legacy baseline changed in Slice 94.

Slice 95 is complete as the shared lower-body data-model checkpoint. The
explicit `crotchDepth`, `thigh`, `knee`, and finished `inseam` fields now have
standards, controls, facets, plausible bounds, and v5 persistence migration;
the trouser option table preserves finite invalid work-in-progress values for
guidance and accepts v4 saves with deterministic fallbacks. The full checkpoint
passes 74 files / 969 tests, 100% coverage, TypeScript, production build,
parsed export suites, and all eight unchanged legacy hashes. No trouser recipe
or geometry is registered yet.

Slice 96 is complete as the geometry-only reusable leg-block checkpoint. The
new `draftTrouserLegs()` consumes the live lower-body fields and trouser
options, drafts four off-fold front/back panels with shared sewable side and
inseam paths, separate front/back crotch Béziers, explicit rise endpoints, and
hip/thigh/knee/hem/grain/crease landmarks. Focused geometry/render tests pass
7/7 and TypeScript passes; the full integration gate remains pending until the
block is assembled with its waistband, closure, and pockets.

Slice 97 is complete as the waistband/closure component checkpoint. The
combined `draftTrouserWithClosure()` block now adds a full off-fold trouser
waistband, center/fastening marks, a simple fly shield, and live front fly
marks. Its eight declared seams pass the focused stitch checks; focused
component tests pass 12/12 and TypeScript passes. The block is still not
registered with the application or export pipeline.

Slice 98 is complete as the minimal pocket/sewability checkpoint. The
`draftTrouserWithPockets()` block adds mirrored front pocket-opening marks and
two quadrilateral bag roles, with each opening joined to the actual front mark
by a length-checked stitch. The pocket angle, opening length, drop, and bag
depth remain live; invalid ranges and panel/rise/knee/hem crossings produce
option-linked guidance without clamping. `TROUSER_ALLOWANCES` and
`TROUSER_NOTCHES` cover all eight physical roles, and the actual Blueprint/SVG
render tests include the pocket marks and bags. Focused trouser tests pass
21/21 and TypeScript passes. The complete recipe, application routing, full
graded/output gate, and live browser verification remain pending.

Slice 99 is complete as the guidance/POM/grading/tech-pack checkpoint.
`trouserGuidance()` now catches body-order, rise/waistband/fly, positive
dimension, straight-leg progression, and pocket failures with actionable
measurement/option fields and no clamping. `TROUSER_GRADE`/`TROUSER_SIZES`
redraft an XS–XL run, `TROUSER_POMS` reads the live assembled geometry for
finished and body-reference rows, and `TROUSER_TECH_PACK` names the physical
roles, materials, closure, and construction order. Focused trouser tests pass
27/27; its checkpoint passed 78 files / 993 tests with 100% statements,
branches, functions, and lines. Slice 100 below resolves the recipe and
application boundary; output integration and live browser verification remain
later checkpoints.

Slice 100 is complete as digital recipe/application integration. `TROUSER` is
now a first-class registry entry with the complete lower-body contract,
`lower` region, and `frontLeft` Edit role. The shared shell routes its controls,
Style, Body front/back/side/pair, assembled preview, Pattern, Size run, Spec,
Nesting, Check, Guidance, persistence, and Edit flows; the trouser-specific
Body/Side/assembled renderers read the actual live block and components. The
focused app/render evidence is 92/92; full `npm test` passes 79 files / 1,007
tests, `npm run coverage` is 100% for statements/branches/functions/lines,
`npx tsc --noEmit` passes, and `npm run build` passes. The legacy regression
suite remains green with all eight unchanged hashes. Parsed trouser output
consumers and live responsive browser evidence are not yet accepted and are
the next safe work in Slices 101–102. Physical validation, surface design,
Polo V2, and production-readiness claims remain deferred.

Slice 101 is complete as the parsed/rendered output checkpoint. The selected
L-size trouser reaches SVG, DXF, tiled PDF, opt-in multi-page A0, projector,
and tech-pack consumers with actual artifacts in the thread evidence folder
`epic3-slice101-outputs/`: 16 SVG polygons, 16 DXF polylines, 80 tiled pages,
8 A0 pages, 5 projector layers / 80 polygons, and 4 tech-pack pages. The A0
nest diagnostic exposed a real one-page overflow risk; the recipe-owned
whole-piece fallback preserves true scale. The tiled PDF received a separate
recipe-owned page-local coordinate mode after rendered pages exposed global
coordinate placement; the default legacy path remains byte-identical.
Rendered A0, tiled, and tech-pack pages were visually inspected, and the
focused parsed/regression suite passes 28/28. The post-fix full checkpoint is
80 files / 1,013 tests, 100% coverage across all four metrics, TypeScript,
production build, and 8/8 unchanged legacy hashes. Physical validation,
surface design, Polo V2, and production-readiness claims remain deferred.

Slice 102 is complete as the live cross-surface and responsive checkpoint. In
the actual in-app browser, valid Cotton-woven Trouser state passed Pattern,
Body front/back/side/pair, assembled preview, Size run, Spec, Nesting,
Check, Edit, Guidance, Save/Load, and all six export-button paths. Waist 84 →
86 changed finished waist 94 → 96 and the rendered SVG; pocket angle 99 stayed
typed, paused the draft, disabled exports, and focused its Review action. An
in-range inseam 55 plus bag-depth 35 combination produced a side-seam guidance
warning and a focused correction target without clamping. The six existing
garments each passed live Pattern/Body/Spec/Check spot checks with compatible
materials, and browser diagnostics were empty. At 1280/900/700/560/390, page
scroll widths were 1265/885/685/545/375 respectively and no page-level
horizontal overflow was reported. Evidence screenshots are in the thread
folder `epic3-slice101-outputs/`. No source or shared output contract changed
in this slice, so the final full gate is reserved for Slice 103.

Slice 103 was a complete trouser/output closeout checkpoint. Its final gate
passed on the actual branch: `npm test`
passed 80 files / 1,013 tests; `npm run coverage` passed 100% statements,
branches, functions, and lines; `npx tsc --noEmit` passed; and `npm run build`
passed with 92 Vite modules transformed. Independent parsing of the actual
Trouser SVG/DXF/tiled PDF/A0/projector/tech-pack files passed with 16/16
polygons/polylines, 80 tiled pages, 8 A0 pages with in-bounds coordinates, five
projector layers, and four tech-pack pages. The legacy suite passed 8/8 with
all eight hashes unchanged; the exact manifest and rendered evidence are
recorded in `docs/planning/EPIC-3-EXECUTION.md`. Slice 104 is the maintainer-
requested final UI slice within this Epic, not a later Epic.

Slice 104 is complete. It adds the shared direct-entry plus click/hold +/-
control and Boundary Rail for measurements, recipe options, nesting fabric
width, and open-ended Edit coordinates. The implementation keeps manual raw
invalid values visible, disables only reached bounded endpoints, and does not
change drafting or export code. The focused interaction tests and the full
gate pass: `npm test` is 80 files / 1,021 tests; `npm run coverage` is 100% for
statements, branches, functions, and lines; `npx tsc --noEmit` passes; and
`npm run build` passes with 92 Vite modules (196.69 kB, 57.50 kB gzip).
Independent parsing of the actual selected Trouser artifacts passes: 16 SVG
polygons, 16 DXF polylines with CUT/SEW/placement/fold layers, 80 tiled PDF
pages, 8 A0 pages with calibration, 5 projector size layers / 80 polygons,
and 4 tech-pack pages with materials/BOM/construction/POM content; no parser
errors or `NaN` values were found. The live in-app audit found both flank
buttons and a rail on every numeric control in Tee, Fitted tee, Tank, Polo,
Woven shirt, Skirt, and Trouser; direct invalid entry, boundary recovery,
option/nesting controls, and 20 open Edit-coordinate rails were exercised.
The 8/8 legacy export hashes remain unchanged. Physical fit and
production-readiness remain deferred.

Epic 4 Slices 106–109 are the grammar adoption checkpoint. `src/drafting/grammar.ts`
now provides typed dependency ordering, scoped parameter resolution, exposed
interfaces, composition-owned stitches, and loud graph/reference failures.
`TEE_GRAMMAR`, `FITTED_GRAMMAR`, `TANK_GRAMMAR`, `POLO_GRAMMAR`,
`WOVEN_SHIRT_GRAMMAR`, `SKIRT_GRAMMAR`, and `TROUSER_GRAMMAR` route every
registered recipe through the same composition boundary while retaining the
ordinary assembled `Block` consumed by checks, guidance, grading, POM,
rendering, persistence, and export. Existing helper APIs remain for compatibility.

The migration checkpoint passes 81 test files / 1,031 tests and 100% coverage
for statements, branches, functions, and lines. The existing garment selector's
Tee ↔ Fitted route is the bounded user-facing composition proof: it changes the
actual composed front and is already covered through Pattern, Spec, Check, and
Edit. The final Slice 113 gate passed. Its exact commands, output evidence,
legacy hashes, live/rendered audit, delegated Desktop Release review,
limitations, and commit list are recorded in
`docs/planning/EPIC-4-EXECUTION.md`.

The live Slice 110–112 audit covered all seven garments through Pattern, Body,
Size run, Spec, Nesting, Check, and Edit. At 1280/900/700/560/390 px every
garment had no horizontal overflow, visible SVG, matching +/- and Boundary Rail
counts, and no browser diagnostics. Tee ↔ Darted tee changed the actual pattern
SVG and retained dart evidence in Spec/Check; Trouser waist changed 86 → 87 →
86 with the rail label tracking the value. The focused parsed-output suite
passed 21/21, including SVG, DXF, tiled PDF, A0 PDF, Projector SVG, Tech Pack,
and the 8/8 legacy hash regression tests.

The separate Desktop Release delegation was reviewed from actual isolated
worktrees. OpenCode's research packet is promoted as `7d84e7a`, and Claude
Code's Electron navigation hardening plus corrected real-shell verifiers are
promoted as `7ecc9c2`. Main-process build/typecheck and the real dev-shell save,
menu, identity/title, and bounded window-state checks pass. The research packet
records that packaging targets remain unpacked `dir` outputs, signing,
notarization, auto-update, and packaged/offline per-OS verification are still
open; the 125%-DPI multi-relaunch window-size creep is a known limitation, not
a production-readiness claim.

The independent functional-consistency audit (completed before Epic 3) closed BUG-UI-032 through
BUG-UI-034. Woven Body front/back inspection uses its real lower shaping and
highlights the waist/hip/hip-depth seam references; switching between upper and
lower garments synchronizes the Body projection toolbar while preserving the
valid Side schematic; focused field spotlights remain active when the pointer
leaves the row. Live checks covered
all six garments, all seven primary views, keyboard increment/decrement,
guidance correction targets, option markers, and responsive widths 1280/900/
700/560/390 with no horizontal overflow at fit zoom. Focused tests pass 129/129;
the final gate is recorded in `docs/planning/FUNCTIONAL-CONSISTENCY-AUDIT.md`:
73 files / 963 tests at 100% coverage, TypeScript, build, parsed export checks,
and 8 unchanged legacy hashes. All BUG-UI-001 through BUG-UI-034 records are
closed. Epic 3 work is recorded above; physical validation remains deferred.

EPIC-BUGFIX-P1 closes BUG-UI-001 through BUG-UI-012 except no IDs are skipped:
responsive layout, input truth, live totals, unified digital verdicts, full
workspace persistence, export-result truth, stale-export invalidation, woven
assembled preview, and honest digital-only copy are complete. The full P1 gate
passes: 73 test files / 935 tests, 100% statements/branches/functions/lines,
TypeScript, production build, parsed SVG/DXF/PDF/projector/tech-pack checks, and
eight unchanged legacy export hashes. BF-P2-01 also closes the intrinsic-canvas,
label-layout, Body-focus, and Side-context records: inspection surfaces are
bounded and zoomable, linear component drawings shelf-wrap, and single Body
figures can be inspected without browser zoom. BF-P2-02 now gives the
assembled SVG an owned collapse/expand section and groups woven construction
options with units and per-field correction help. BF-P2-03 now maps all woven
options to real assembled-detail markers and separates Material / stretch from
Color; knit material selected for the woven shirt is explicitly warned and
gated. BF-P2-04 now distinguishes one-selected-size exports from whole graded
run exports and reports button counts in buttons rather than cm. BF-P2-06 now
adds semantic landmarks/headings, named SVGs, pressed control states, keyboard-
equivalent Edit coordinate inputs, and field-linked Guidance Review actions.
The P2 full gate passes: 100% statements/branches/functions/lines across 73
test files and 956 tests, standalone TypeScript, production build, parsed
SVG/DXF/tiled-PDF/A0/projector/tech-pack checks, and eight unchanged legacy
export hashes. BF-P3-01 now aligns fresh material defaults with garment
construction and makes Style/journey copy truthful. BF-P3-02 now names the
selected-size versus every-graded-size nesting consequence. BF-P3-03 now adds
the visible product hierarchy and visible/semantically named swatches. The
full P3 gate passes across 73 test files / 959 tests at 100% statements,
branches, functions, and lines, with standalone TypeScript, production build,
parsed SVG/DXF/PDF/A0/projector/tech-pack checks, and eight unchanged legacy
export hashes. All BUG-UI-001 through BUG-UI-034 records are closed. Epic 3
has not begun; physical validation remains deferred.

BF-P1-01 closes BUG-UI-002/003: no silent clamp, verbatim negative ease,
associated input corrections and safe draft pause/recovery. Scope and evidence:
`docs/planning/BUGFIX-P1-EXECUTION.md`. P1, P2, and P3 are complete under the
same master goal; Epic 3 remains unstarted. Physical validation remains deferred.
BF-P1-01 gate: 73 files / 919 tests, 100% coverage,
TypeScript/build, parsed outputs and eight unchanged legacy hashes.

Tank rework step 4 is complete for automated and rendered verification;
physical sewn validation has not occurred and is intentionally deferred. Update
this after every slice and commit it WITH the code.

**Governing plan:** `docs/planning/MVP-PLAN.md` (operative — the 6-month execution plan) and
`docs/planning/ROADMAP.md` (strategic — full competitor analysis + long-term scope + the cut
list) are the current planning documents, added after Slice 44. This file
remains the engineering status log; it does not restate their content.

**Maintainer decisions confirmed after the Slice 65 handoff:** no physical
garment validation has occurred; the sequence is physical Tank validation →
fix any real-world failures → build polo end-to-end → Phase C3; Tank neckline width
must become user-adjustable; every meaningful garment aspect should be
adjustable, with invalid combinations detected by guidance and paired with
actionable corrections; code signing has not started; every future garment
requires a durable research document equivalent to
`docs/research/garments/TANK-RESEARCH.md`; and
`docs/research/ASSET-RESOURCES.md` supersedes
`apparel_design_resources.md`. See `docs/PROJECT-DECISIONS.md` for the durable
record.

**Woven shirt Slice 86 (2026-09-12):** construction semantics are now explicit:
neck is a body circumference, options own overlap/spacing/collar/placket/yoke/
pocket/band/vent/hem choices, six or seven front-placket buttons exclude one
stand button, and the 16 physical-role quantities are recorded. No geometry or
recipe is registered yet; that starts in Slice 87. Older saves default neck to
40 cm. Physical validation remains on hold.

**Woven shirt Slice 87 (2026-09-12):** `draftWovenShirtBody()` now drafts the
separate front and on-fold back with independent neck/neck-ease geometry,
relaxed waist/hip shaping, explicit centre-front/centre-back edges, and named
shoulder/armhole/side/hem interfaces. Collar, closures, components, recipe and
UI integration remain for later slices; physical validation remains on hold.

**Woven shirt Slice 88 (2026-09-12):** the body now composes separate folded
outer/inner stand and upper/under point-collar layers from the real neckline
seams. Four named joins are declared and tested; buttons, plackets, yoke,
pocket, sleeve, hem/vent, recipe and UI integration remain. Physical validation
remains on hold.

**Woven shirt Slice 89 (2026-09-12):** two full-length folded front plackets
now attach to the actual centre-front seam. Six or seven live, evenly spaced
button/buttonhole marks are supported, excluding one additional stand button
and hole. Placket joins and stand marks are explicit; yoke, pocket, sleeve,
hem/vent, recipe and UI integration remain. Physical validation remains on
hold.

**Woven shirt Slice 90 (2026-09-12):** the real back armhole is split into a
lower back and two-layer folded yoke with exact yoke-seam matching. The yoke
retains neckline/shoulder/upper armscye and the lower back retains lower
armscye/side/hem; one live-size patch pocket attaches to a named front
placement mark. Sleeve, hem/vent and recipe/UI integration remain. Physical
validation remains on hold.

**Woven shirt Slice 91 (2026-09-12):** an independent woven short sleeve is
fitted to the assembled armscye and joined to a folded band; both body hems
are curved and each side has an explicit open vent segment/mark. The knit
sleeve remains untouched. Recipe registration, guidance/report/POM/BOM and UI
integration remain for Slice 92; physical validation remains on hold.

**Woven shirt Slice 92 (2026-09-12):** the complete shirt is now registered as
the `woven-shirt` recipe. Its styles, measurement/options panel, invalid-state
guidance, grade/POM/notch/allowance data, dynamic six-or-seven-button BOM,
pattern/spec/check/nesting/export pipeline and assembled front preview are all
wired through the existing engine. Full verification passed at 71 test files /
911 tests, 100% statements/branches/functions/lines, TypeScript, production
build, parsed export suites and unchanged legacy export hashes. This verifies
digital behavior only; no physical sewing or fit claim is made. Physical
validation remains on hold; Slice 93 is the component-library exit.

**Woven shirt Slice 93 (2026-09-12):** the component-library exit audit now
proves the assembled block is closed and sewable across XS–XL, with every POM
finite and the readiness report green for the valid six-button sample. It also
parses the Pattern/preview editor output and every cutting/output writer: SVG,
DXF, tiled PDF, A0 PDF, projector SVG and four-page tech pack. The audit found
and fixed a real folded-yoke centre-back closure error and routed the
independent woven neck into Body and assembled previews without changing
legacy garment output. Full verification passed at 72 test files / 918 tests,
100% statements/branches/functions/lines, TypeScript, production build, parsed
output consumers and unchanged legacy export hashes. Physical validation
remains explicitly deferred; the digital component-library milestone is closed.

**UI Bug-Fix Phase (planned 2026-09-12):** before Epic 3 / Phase 5, the
maintainer inserted three sequential bug-fix epics based on the Slice 93 live
UI audit: `EPIC-BUGFIX-P1` (correctness and trust), `EPIC-BUGFIX-P2` (usable
inspection and interaction), and `EPIC-BUGFIX-P3` (polish and discoverability).
The stable records, separate severity/priority tags, root-cause fields, and
closure evidence live in `docs/BUG-LEDGER.md`; execution and goal-setting rules
live in `docs/planning/BUG-FIX-PHASE.md`. P1 implementation has started.
Epic 3 remains parked until the three bug-fix exit reports pass.

**Polo V1 (2026-09-11):** all geometry decisions are locked: collar-plus-stand,
loose tee body/current sleeve, self-knit lightly stabilized folded placket,
14 cm × 3 cm finished placket, three buttons at 3.5 cm centres, 2 cm finished
stand, 5 cm pointed collar leaf, and no V1 side vents. Slice 69 drafted the
front slit, tee body/sleeve reuse, both folded placket pieces, and the layered
collar/stand with warning-only geometry guardrails. Slices 71–72 made Polo a
full selectable recipe with live persisted design controls and visual/output
routing. Slice 73 now records the final cross-size/export proof; physical sewing
and fit validation remain outstanding.

## What it is
A lightweight, local 2D sewing-pattern designer in TypeScript. Type body
measurements → it drafts a real t-shirt pattern, renders it on a blueprint canvas
with seam allowances, notches, and grainlines, catches mistakes (guidance), lets
you pick a **target fit** and shows the exact gap to reach it, advises on ease from
fabric stretch, shows an assembled garment view with fabric colour, grades the
pattern into a size run (a tree-ring **nest**), auto-measures a **spec sheet**
across sizes, **estimates fabric usage** (a width-aware nesting layout with a
utilization read-out), runs a plain-English **production-readiness check** (one
pass/fail verdict), lets you **freeform-edit** a piece by dragging its points,
exports true-scale SVG + DXF + a tiled print-at-home PDF, and saves/loads your
work. The engine is fully garment-general: **tee, darted tee, tank, polo, and
skirt** all run through one `GarmentRecipe`-driven pipeline (draft → grade →
POM → check → nest → edit → export), plus **real-world exports** (projector
SVG / A0 PDF with a verified calibration square) and a **guided 5-step
journey** to a valid export. Repo: github.com/kshitijpatne/InfiniDrip

## Stack & rules
TypeScript · SVG · Vite · Vitest (jsdom for UI). Strict TS, 100% coverage held
(build fails <95%). Pure functions everywhere except the thin UI layer. See
ARCHITECTURE.md for the layer map.

## Workflow
Build in numbered slices, grouped into a feature/epic when no maintainer
decision is needed. Codex owns the sandbox/reality check, implementation,
durable-doc updates, rendered/output inspection, tests, commit, and push; the
maintainer remains the final authority for every major decision. Stop for a
major bug, structural redesign, material ambiguity, or required product review.
Every slice deliberately records model and reasoning level, stays token-efficient
without weakening test quality, runs the full coverage gate (100%), TypeScript,
production build, parsed export checks, and practical visual review. Commit
**PROJECT-STATE.md, ARCHITECTURE.md, and affected durable context in the same
commit as the behavior they describe.** Never claim physical fit or production
readiness until a real sample is cut, sewn, measured, and recorded.

## Slices done
F2. **(Fable) Guided journey UI** — the locked wireflow over the existing views:
    a coached **Start → Measure → Fit → Refine → Output** path (5 steps, ≤ 5 to a
    valid export), driven by a pure `ui/journey.ts` (step map, disclosure map,
    checklist, markup) + thin app.ts glue. **Progressive disclosure**: Start
    front-loads nothing; Measure reveals controls + Pattern/Body (landing on the
    body view, Slice-30 hover intact); Fit adds fabric + the style target;
    Refine unlocks Check/Edit; Output reveals Size run/Spec/Nesting + every
    export. **Onboarding**: first-run welcome card (Start the tour / Skip);
    per-step coach lines; journey persisted as versioned JSON
    (`patternworks_journey_v1`), so a reload resumes mid-tour and graduates to
    "done" (everything unlocked, chips become shortcuts). **Checklist**: "N of 5
    to an exportable design", every undone row naming its next action (no
    dead-ends); the production row obeys the honesty gate — `checksOk` alone
    cannot tick it while `measurementsPlausible` is false. **Light celebration**
    on export: dismissible, and it withholds the green ✓ while any input is
    implausible (same gate as the check banner and style ✓). No badges, points,
    or streaks. All F2 acceptance criteria self-checked; verified live in
    `npm run dev`. (530)
F1. **(Fable) Real-world export system** — two new writers on the existing export
    spine (`flatten → layout → writer`), beside SVG/DXF/PDF. (1) **Projector
    file** (`export/projector.ts`): one seamless cm-true SVG canvas, never tiled;
    every graded size on its own toggleable layer (Inkscape layer convention,
    `id="size-<LABEL>"`), sizes tree-ring-anchored per piece slot; bold
    projector-weight lines/labels/notches; cut-on-fold pieces **unfolded to full
    width** (`export/unfold.ts` mirrors the x=0 fold; single-layer fabric has no
    fold). (2) **A0 copyshop file** (`export/a0.ts`): one-page portrait-A0 PDF
    (landscape optional), whole pieces shelf-packed to the page width via
    `nestPieces`, piece labels + notches + grainlines, kept folds marked
    "PLACE ON FOLD". Both embed the LOCKED **10 cm × 10 cm calibration square**
    labelled "10 cm" (`export/calibration.ts`). Tests follow the SVG-bug lesson:
    projector validated by a REAL DOMParser parse measuring geometry out of the
    DOM (unfolded front sew width == (chest+ease)/2, exact); A0 validated by a
    REAL pdf-lib structural parse (page size in pt, the square measured at
    exactly 10 cm in points from the decoded content stream). Existing
    SVG/DXF/PDF/tech-pack outputs proven **byte-identical** to main\@4f7e796 by
    SHA-256 baseline (`regression.test.ts`). New buttons: Projector (whole-run,
    layered) + A0 (per-size picker). Boundary: geometry is NEVER scaled to fit —
    an extreme size can honestly outgrow even A0. (493)
1. geometry core (points, distance, Bézier + curve length)
2. drafting engine (measurements → t-shirt block)
3. render layer (pieces → blueprint SVG)
4. live measurement controls UI (58 tests)
5. guidance engine + sleeve-cap-fitted-to-armhole (72)
6. style suggester — current + nearby styles with cm deltas (82)
7. assembled garment view + fabric swatches (89)
8. seam allowance (cutting line) (94)
9. export layer — true-scale SVG + DXF cutting files, with Download buttons (103)
   [bugfix, post-s22: SVG tags were authored as HTML entities (&lt;/&gt;) from this
   slice on, so exported .svg wouldn't open in a browser ("Start tag expected");
   DXF/PDF unaffected. It went undetected because assertions matched the escaped
   output. Now emits real markup, guarded by a DOMParser parse test (no parsererror,
   <svg> root, 6 polygons + 3 labels). 327 → 328 tests.]
10. tiled PDF export — page-split + overlap + registration marks (119)
11. save/load — versioned JSON in localStorage, validated, with status feedback (139)
12. notches & grainlines — derived as rules on live pieces, grade for free (155)
13. ease/fabric guidance + prescriptive style target (171)
14. grading / size runs — re-draft over a size table → tree-ring nest; a Pattern /
    Size run view toggle (187)
15. tech pack (part 1) — auto-measured POM spec sheet across the size run, in a
    Spec view (202)
16. nesting / fabric estimator — width-aware shelf-pack of the cut pieces on a bolt,
    with a fabric-length + true (polygon-area) utilization read-out, in a Nesting
    view (219)
17. production-readiness checker — guidance grown into one pass/fail verdict
    (matched seams, cap ease, square-at-fold hem, notch/grain declared, size run
    grows), in a Check view (239)
18. freeform edit mode — drag a piece's vertices and curve controls to reshape it;
    edits are a manual override, Reset re-drafts from measurements; in an Edit view
    (257)
19. fitted/darted recipe — first non-tee garment: a bust-darted front (dart baked
    into the outline, apex marked), with the tee's back + sleeve reused; a
    Tee/Fitted toggle swaps the Pattern view (268)
20. garment generalization — a `GarmentRecipe` registry drives EVERY view (pattern,
    grade, spec, nest, check, edit, export); the engine no longer names a t-shirt.
    Fixes the Slice 19 side-seam bug; adds the dart-leg check; hides the bolt-width
    box outside the Nesting view (285)
21. dart manipulation + truing — pivot a dart about its apex onto another seam
    (same wedge, same fit, different seam), then blend the corner it leaves behind;
    driven from the Edit view (321)
22. per-size export — a size picker in the export area drafts the chosen graded
    size (via `draftAtSize`) and emits `<garment>-<SIZE>.<ext>`; scopes only the
    exports, every other view keeps its job (327)
64. Tank reality-check — rendered the Tank through body, assembled, pattern,
    guidance, and export paths and closed the confirmed practical gaps without
    redesigning the garment. Both Tank previews now reuse the exact curved
    `sleevelessArmhole()` geometry used by the draft. `neckWidthEase` is a
    user-adjustable finished-width delta from the derived default, persisted
    leniently with plausibility bounds and actionable neckline guidance. Tank
    tech-pack materials are selected from the active fabric family (woven vs
    knit), while the existing knit construction remains the default fallback.
    Added focused geometry, persistence, guidance, UI, and export tests.
    Gates: 59 files / 801 tests / 100% coverage, TypeScript check, production
    build, and parsed visual/export evidence. Physical sewn validation remains
    outstanding. Next: polo end-to-end, unless physical validation finds a
    Tank failure first.
65. Tank UX clarity — completed Body-view hover ownership for `strapWidth`,
    `neckDrop`, and `neckWidthEase`, including exact curved armhole/neckline
    overlays. Controls now show the derived finished chest/hip result so ease
    is understood as wearing room, while drafting math remains unchanged.
    Renamed the product-facing Fitted garment to Darted tee; recipe id and
    geometry remain stable. Added UI tests. Next: physical Tank validation,
    then polo. Slice 66 resolved strap semantics: `strapWidth` is finished
    span from neckline edge to armhole start; v1 saves migrate old strap-point
    values to this span under save version 2.
67. Tank/pre-polo Body view — Body tab now renders labeled Front and Back
    schematics together. Each panel uses the active recipe's derived neckline,
    exact tank armhole curve, and shared measurement hover metadata; front-only
    `neckDrop` guidance is not shown on the back. Existing nesting utilization
    readout was re-verified and required no new implementation. Physical sewn
    validation remains outstanding.
68. Polo foundation — added `Piece.marks` for internal cut, fold, placement,
    button, and buttonhole construction data, explicitly separate from exterior
    edges and seam allowance. Canvas plus true-scale SVG, DXF, tiled PDF, A0,
    and projector exports now preserve those marks; projector mirrors off-fold
    marks but keeps an on-fold mark singular. Added recipe-owned option schema
    support and version-3 save/load persistence for per-garment numeric options,
    separate from body `Measurements`. No polo garment geometry was drafted.
    Existing tee/darted-tee export regression hashes remain byte-identical.
    Gates: full coverage, TypeScript, production build, parsed export evidence.
    Next: Slice 69 polo front slit and folded placket pieces.
69. Polo shell — drafted loose tee front/back and current set-in sleeve with a
    true centre-front internal 14 cm slit, not a fake centre-front seam. Added
    two separate folded placket pieces: 3 cm finished outer face + 3 cm inner
    facing, 1 cm attachment/turn-under allowances, fixed 3.5/7/10.5 cm button
    or buttonhole centres, fold/attachment/reinforcement marks, and raw slit
    attachment stitch interfaces. `MarkRef` now lets a real internal cut line
    participate in a measured stitch while preserving exterior-edge-only
    notches. Default shell seams pass. Collar/stand are intentionally absent;
    next: Slice 70 collar, stand, option guardrails, and neckline stitches.
70. Polo collar/stand — completed the V1 collar-plus-stand draft with separate
    upper/under pointed collar and outer/inner stand half-pieces, each cut on
    centre-back fold so physical layer quantity is represented directly. Stand
    lower edge matches the actual front+back half-neckline; both collar bases,
    both stands, and collar outer seams are declared/measured stitches. Defaults
    are 2 cm finished stand and 5 cm pointed leaf. Polo options now draft
    verbatim and issue exact warning corrections for V1 ranges, insufficient
    button clearance, hem conflict, and stand/leaf conflict; no silent clamp.
    Physical sewing still must validate collar roll, stand curvature, placket
    flatness, and stabilizer behavior. Next: Slice 71 recipe integration.
71. Polo recipe pipeline — Polo is now selectable and passes draft, grade, POM,
    check, spec, nesting, tech-pack, and cutting-export pipelines through the
    existing generic recipe system. It has nine physical pieces, complete
    notch/grainline declarations, Polo-specific POMs, knit/stabilizer/buttons
    BOM, production construction order, and Polo fit-target labels. Parsed
    SVG/DXF proof includes all pieces plus slit/button/buttonhole marks; Tee and
    Darted tee baselines stay protected. Next: Slice 72 live option UI,
    persistence routing, assembled/Body Polo visual, and output review.
72. Polo live controls and visual/output routing — Polo's finished placket
    length/width, stand height, and collar-leaf depth now render as recipe-owned
    controls and persist in the existing version-3 options map, separate from
    body measurements. Live values route through draft, guidance, check, grade,
    nesting, all per-size cutting files, projector, and tech pack. Body and
    assembled schematic views show selected collar/stand, placket, and three
    buttons on the front only; this is a dimension-honest flat schematic, not
    drape simulation. Invalid typed combinations remain drafted and receive
    actionable warnings. Gates include default and altered-option DOM/render
    proof. Next: Slice 73 cross-size/export final gate and readiness evidence.
73. Polo cross-size/export final gate — graded XS–XL with altered live options,
    full nine-piece marker, stitch/readiness report, true-scale SVG/DXF/PDF,
    layered projector SVG, A0, and four-page tech-pack outputs were parsed with
    real consumers. All digital gates pass and established export baselines are
    unchanged. This is production-readiness evidence for sewability only; no
    physical sewing, fit, collar roll, placket recovery, or wash validation has
    occurred. Next: digital product-contract work, then Phase C3; physical
    sampling remains deferred unless explicitly reopened.
74. Polo digital UX and output audit — Pattern view now shelves the nine pieces
    into readable construction groups instead of one crowded strip. Body and
    assembled views share a neckline-following stand and pointed collar-leaf
    schematic; the old perpendicular rectangular collar was a misleading
    decorative representation. Polo finished-option rows now spotlight their
    corresponding Body-view features. The audit also confirms the Edit view is
    currently a front-only in-memory manual override: it does not flow into the
    assembled preview, checks, grading, or exports, so it is not yet a complete
    final-design editing workflow. All export writers remain digitally tested
    with real parsers/consumers; no physical sampling is planned at this time.
    Gate: 858 TypeScript tests / 100% coverage, typecheck, production build,
    visual browser review, parsed export suite, and unchanged legacy hashes.
    Next: resolve the Edit-view product contract, then Phase C3; physical
    sampling remains deferred until explicitly reopened by the maintainer.
75. Build hygiene fix — the root TypeScript check now uses `noEmit`, preventing
    `npm run build` from writing JavaScript test/module siblings into `src/`.
    Those generated siblings could cause Vite to resolve a missing `.js` module
    after cleanup and leave the dev app blank. A clean build emits only to the
    existing Vite `dist/` output. Physical sampling remains deferred.
    Gate: full test suite, 100% coverage, production build, clean source tree,
    and fresh dev-server DOM load.
76. Polo digital reference cleanup — the Pattern canvas now gives each narrow
    placket/collar component a title lane sized for its label, and construction
    labels are reduced and offset beside compact marks. The Body and assembled
    schematics now draw a neckline-following stand with collar leaves pointing
    down onto the chest, matching the real polo convention shown in the
    reference sketches. This is a digital schematic correction only; physical
    sampling remains deferred.
    Gate: focused render tests, full coverage, typecheck, production build, and
    fresh browser screenshots of Pattern, Body, and assembled views.
77. Polo V2 fidelity backlog committed — `POLO-RESEARCH.md` now records the
    required collar/stand geometry review, back-neck representation, placket
    shaping review, and explicit decisions for the reference's longer-back
    hem/side slit, sleeve rib, and Polo-specific grading. `docs/planning/ROADMAP.md`
    carries this as committed item 2.2a, standby until a future Polo
    refinement/version-upgrade slice is assigned. No implementation changes are
    included; current V1 scope remains unchanged and physical sampling remains
    deferred. Next: resolve the Edit-view product contract, then Phase C3.
78. Edit-view product contract clarified — Edit is explicitly an exploratory,
    front-piece-only preview. Dragging handles or using dart tools does not alter
    measurements, the assembled preview, checks, grading, nesting, persistence,
    or exports; Reset returns to the current parametric draft. This slice makes
    the existing quarantine visible and testable without claiming that a local
    SVG mutation is part of the final design. The underlying design model must
    change in a future, separately scoped slice if Edit is promoted to a
    final-design override: that slice must define persistence, size/grading
    semantics, downstream validation, and export behavior before implementation.
    Physical sampling remains deferred until explicitly reopened. Next: Phase C3
    after the model-backed Edit decision is either accepted or deliberately
    deferred.
79. Phase C3 croquis library — added render-only upper/lower croquis geometry
    with explicit front, side, and back entry points. The library keeps figure
    scaffolding separate from drafting and exports; side figures are available
    as honest schematic envelopes but are not exposed as a new UI tab in this
    slice. Existing Body and assembled outputs remain unchanged. No measurement,
    Piece/Block, grading, export, or Edit-model changes were made. Slice 80
    routes the existing upper-body Body renderer through the new contract;
    physical sampling remains deferred.
80. Phase C3 upper-body croquis routing — `upperCroquisFigure()` now owns the
    annotated Body view's upper-body torso and sleeve paths plus the anchors
    consumed by its measurement overlays. Front/back recipe-aware necklines,
    Tank strap/armhole geometry, and Polo's schematic details remain live at
    their existing boundaries. Tee output paths and Body measurement/edge tags
    were checked against the pre-slice render; Tank and Polo were re-rendered
    in the live app. No drafting, data-model, Piece/Block, grading, checks,
    nesting, Edit, or export-writer changes were made; the 8/8 legacy export
    hashes remain unchanged. Lower-body routing is now covered by Slice 81;
    Side UI remains Slice 82. Physical sampling remains deferred.
81. Phase C3 lower-body croquis routing — `lowerCroquisFigure()` now owns the
    Skirt Body view's measured lower-body silhouette and reusable anchors.
    `render/skirt-figure.ts` consumes that contract while retaining the
    skirt-specific cloth overlay and all annotated presentation. The lower
    front/back croquis entry points now use the shared figure; the side remains
    an honest schematic envelope. Existing skirt silhouette connectivity,
    symmetry, measured waist/hip/hipDepth behavior, viewBox gutters, and cloth
    separation were checked in parsed SVG and in the live app. No drafting,
    data-model, Piece/Block, grading, checks, nesting, Edit, or export-writer
    changes were made; the legacy export hashes remain unchanged. Side UI
    remains Slice 82. Physical sampling remains deferred.
82. Phase C3 visible Side view — the Body view now has an explicit `Front + Back`
    / `Side` selector. Side renders route through the shared upper/lower croquis
    paths for Tee, Darted tee, Tank, Polo, and Skirt, with a visible
    `SIDE · SCHEMATIC` label and no measurement dimensions or edge spotlight
    groups because no side-specific measurements exist. The existing annotated
    Front + Back mode remains intact, including Tank and Polo behavior, and
    switching between upper and lower garments preserves the render-only Side
    mode. No drafting, data-model, grading, checks, nesting, Edit, or export
    changes were made; the legacy export hashes remain unchanged. Slice 83 adds
    the cross-garment render-contract coverage. Physical sampling remains
    deferred.
83. Phase C3 cross-garment render contracts — registry-driven tests now exercise
    Tee, Darted tee, Tank, Polo, and Skirt across named Front, Side, and Back
    croquis views. The tests parse the actual render outputs, verify Side stays
    schematic and unannotated, and keep upper/lower Body routes intact. A
    render-only purity test calls both side regions and proves the SVG, DXF,
    tiled PDF, tech pack, marker, projector, and A0 outputs are unchanged;
    the existing 8/8 SHA-256 export baseline also passes. No production code,
    drafting, data-model, grading, checks, nesting, Edit, or export changes were
    made. Physical sampling remains deferred.
84. Phase C3 exit gate — the shared croquis migration and visible Side view are
    complete. The final repository gate passed at 69 test files / 883 tests,
    100% statements/branches/functions/lines, TypeScript, and production build.
    Parsed render checks cover upper/lower Front, Side, and Back contracts;
    live browser review covered Tee, Tank, Polo, and Skirt Side/Front + Back
    switching. The pre-C3 base-to-HEAD diff contains no drafting, measurement,
    data-model, grading, checks, nesting, or export-writer changes, and the
    complete export-family purity check plus 8/8 SHA-256 legacy hashes remain
    unchanged. Side is explicitly schematic and does not establish physical
    fit, sewability, or production readiness. Phase C3 is complete; next is
    Slice 85's researched woven-shirt block, with its required durable research
    document before implementation. Physical sampling remains deferred.
85. Woven-shirt research — created the required durable garment research record
    from the five applicable supplied Word references, the Patternmaking PDF,
    and independent primary construction sources. It separates sourced rules,
    conflicts, adjustable estimates, maintainer choices and deferred questions.
    The six/seven front buttons exclude the additional stand button, confirmed
    during research. Sleeve length includes cap/band; independent neck sizing,
    full opening/overlap, layered pieces and all physical quantities require the
    Slice 86 construction contract. No implementation/model changes, no physical
    claims. Next: Slice 86, then the requested continuous run through Slice 92;
    final woven milestone exit remains Slice 93. Gates: 69 files / 883 tests,
    100% coverage, TypeScript/production build, parsed export suites and 8/8
    unchanged legacy hashes. Word-layout rendering unavailable (no LibreOffice);
    reference text/tables and PDF hem diagrams inspected.
63. Tank rework, step 3 — real strap/armhole geometry for the tank, AND a
    scope change requested by Kshitij mid-slice that reshaped the whole
    approach: rather than the engine picking a single "correct" strap width
    (the open question left at the end of research), EVERY new dimension
    this slice touches ships as a real, user-adjustable measurement —
    `strapWidth` and `neckDrop` joined `Measurements` itself, with
    plausibility bounds, a UI slider, and save/load support, exactly like
    chest/shoulderWidth/etc. always have. "No measurement of any garment
    should be limited to just one specific width... the guidance engine
    already handles telling the user when values aren't synergetic" — the
    engine's job is to draft what's asked and flag what doesn't fit
    together, never to decide the answer for the person.
    New `drafting/armhole.ts` (`sleevelessArmhole()`), mirroring
    `necklineEdge()`'s shape: a real curve from the strap point to the
    underarm that cuts further in than the sleeved curve (TANK-RESEARCH.md
    Finding 2 — the underarm point itself never moves, only the curve's
    shape does), plus two "warn, never clamp" guardrails (strap narrower
    than the neckline; strap as wide as the full shoulder). `bodice.ts`
    gained an optional `strapWidth` — undefined draws the exact old sleeved
    armhole (byte-identical for tee/fitted), a value swaps in the new curve.
    `tank.ts` rewritten: `tankFrontNeckline`/`tankBackNeckline` are now
    functions of `Measurements` (frontDrop reads the live `m.neckDrop`), and
    `draftTank` passes `m.strapWidth` to both panels. Widening the strap
    surfaced a real, independent bug caught by `stitchChecks` failing
    during verification, not predicted in advance: since `strapWidth` is
    now literally the shared shoulder point for both panels, this is
    actually SIMPLER than Slice 62's `TANK_BACK_NECKLINE` workaround, not
    an addition to it — one shared value, both panels read it, seam matches
    by construction.
    A second pre-existing gap found and partially closed: `necklineEdge()`
    and `sleevelessArmhole()` both compute "warn, never clamp" guidance
    notes, but NOTHING in the codebase was reading them — every caller
    (`bodice.ts`, `fitted.ts`) destructured `notes` and silently dropped it.
    This was harmless while every neckline param was a fixed recipe
    constant nobody could push out of range; it stops being harmless the
    moment `neckDrop`/`strapWidth` are live sliders. Fixed for the tank
    specifically (`tankGuidance` now recomputes and surfaces both
    functions' notes) — flagged, not fixed wholesale, since the same gap
    exists for every OTHER neckline call too and fixing that generally is
    a separate, later decision, not assumed here.
    Render layer: found, and fixed proactively rather than waiting to be
    told a third time, that `render/body.ts`/`render/garment.ts` still drew
    the tank's shoulder corner at the full sleeved `shoulderHalf` — the
    exact "preview doesn't match the real pattern" gap Slice 61 fixed for
    the neckline, just never checked for the strap because the strap didn't
    exist as a concept until this slice. Both views gained an optional
    `strapWidth` (undefined = old sleeved behaviour, byte-identical);
    `body.ts`'s `shoulderWidth`/`armholeDepth` edge-highlight overlays also
    had to move to the real strap point, or they'd float visibly past the
    actual drawn silhouette — the measurement's own DIMENSION line (the
    labelled arrow) is unaffected, only which part of the outline it
    highlights.
    `recipe.ts`'s `frontNeckline`/`backNeckline` changed from static values
    to functions of `Measurements` (a real, necessary type change, not
    optional) — tee/fitted's just ignore the argument.
    Verified: 790/790 tests, 100% coverage, fresh-clone `git apply` + full
    gate + production build, all three views (body/garment/actual cut
    pattern) re-rendered and visually cross-checked at multiple strap
    widths — front and back always match. `regression.test.ts`'s 8/8
    baseline untouched (this never touches `drafting/tshirt.ts` or
    `drafting/fitted.ts`'s output). Gate: 59 files / 790 tests / 100% (25
    new: 8 in the new armhole.test.ts, +8 tank.test.ts, +3 persist.test.ts,
    +3 body.test.ts, +3 garment.test.ts; 0 changed from Slice 62's own
    count elsewhere). File set: 2 new (`armhole.ts`, `armhole.test.ts`), 16
    modified. Next: Tank rework step 4 — final confirmation that everything
    here is backed by reason before calling the Tank rework closed; polo
    stays parked until then.
62. Tank rework, step 2 (the neckline curve itself) — found because Slice 61
    worked exactly as intended. Kshitij flagged, with screenshots, that the
    neckline on the tee, fitted, AND tank — front and back — read as a sharp
    V-plunge, not a crew or scoop. Rendered it myself (not just trusted the
    report) and sampled the actual Bézier numerically to confirm before
    touching anything: the curve spent most of its length hugging the
    centre-fold before flaring out only in the last 20%, on both crew and
    Slice-60's scoop. Root cause, confirmed by checking tangent directions
    at both curve endpoints: `neckline.ts`'s `control1` sat directly above
    centre-front (`point(0, depth * c1)`) — same x as the curve's own start
    point — which gives a VERTICAL tangent at the fold. Every independent
    pattern-drafting source checked (5 of them, cross-referenced) states the
    same rule: a curved neckline must meet centre front/back at a RIGHT
    ANGLE to the fold, or mirroring it on the fold creates exactly the
    spike Kshitij saw — "In the Folds" describes the identical failure mode
    from real drafting, unprompted. Not a Slice 61 regression: this
    construction dates to Slice 55/56, in the actual cut pattern piece too,
    not just the previews — Slice 61 simply rendered it faithfully
    everywhere at once for the first time, which is what made it visible.
    Fix: `control1`/`control2` rebuilt as a true quarter-ellipse (the
    standard 0.5523 cubic-Bézier circle-approximation constant), each
    control point pinned on the axis that makes its tangent perpendicular to
    the line it meets. Second finding, verified by direct construction, not
    assumed: once the tangent rule holds, the curve's shape is FULLY
    determined by its two endpoints — there's no degree of freedom left for
    "rounder control points," so Slice 60's `scoopControlFactors` literally
    cannot express a different shape any more. This matches what the
    drafting sources say a scoop actually is: the same curve as crew, just
    deeper and wider. `scoopControlFactors`/`crewControlFactors` deleted;
    scoop is now crew geometry + `frontDrop`/`widthEase`, and `tank.ts`
    declares `{widthEase: 1.5, frontDrop: 5}` — a starting decision,
    rendered and eyeballed (no universal scoop spec exists per the sources),
    not a sourced exact. Widening the front's neckline surfaced a REAL
    structural bug the moment it was applied, caught by `stitchChecks`
    failing, not assumed away: the shoulder TIP point never moves, so
    widening only the front's neckline shortened its shoulder edge relative
    to the back's, breaking the seam match. Fixed with a new
    `TANK_BACK_NECKLINE` (same `widthEase` as the front, depth unchanged) —
    both shoulder points now move together. `regression.test.ts`'s tee/
    fitted SVG/DXF/PDF/tech-pack baseline DELIBERATELY moved (Kshitij's
    explicit sign-off, requested before building) — the old "byte-identical"
    bytes encoded the spiked curve, so preserving them would have meant
    preserving the bug. Verified: full suite 765/765, 100% coverage, clean
    build, fresh-clone `git apply` dry run before delivery, AND rendered and
    visually re-inspected every view (tee/fitted/tank, body + garment) —
    the actual failure mode here was screenshots the tests couldn't have
    caught, so the tests alone were never going to be the final check. Gate:
    58 files / 765 tests / 100%. File set: 0 new, 7 modified (`neckline.ts`,
    `neckline.test.ts`, `tank.ts`, `tank.test.ts`, `recipe.ts`,
    `neckline-path.test.ts`, `regression.test.ts`). Next: Tank rework step 3
    (the original step 2) — real armhole/strap geometry for the tank,
    researched per the standard below. See the renumbered Active directive.
61. Tank rework, step 1 — fix the render bugs completely, systemically (the
    plan agreed after Slice 60, item 1 of 4). Two confirmed bugs, both fixed
    at the root, not patched per-garment: (1) `render/body.ts`'s `bodyHalf =
    m.chest * 0.22` replaced with `derive(m).chestWidthHalf` — the real
    half-width every recipe actually drafts (27.5 vs the old wrong 22 at
    STANDARD_M). (2) Both `body.ts` and `garment.ts` drew a fixed placeholder
    neckline curve regardless of shape; both now call the real
    `necklineEdge()` through a new shared helper, `render/neckline-path.ts`
    (`necklinePathCommand`) — one function turns a `necklineEdge()` result
    into the mirrored SVG path fragment, used by both callers, so a crew,
    v, or scoop reads correctly on both views for the first time. Required
    one real design decision: `GarmentRecipe` gained optional
    `frontNeckline`/`backNeckline: NecklineParams` so the views know what
    each garment actually drafted — tee/fitted declare `NECKLINE_DEFAULT`
    explicitly (matching their draft, which passes nothing), tank declares
    `TANK_FRONT_NECKLINE`, a constant now exported from `tank.ts` and
    imported (not re-typed) into `recipe.ts`, closing off the exact kind of
    drift that caused the Slice 60 bug. The mandated audit of
    `render/skirt-figure.ts` found the SAME bug class on the skirt side:
    `figureOf()`'s `waistHalf`/`hipHalf` used an independent `waist * 0.20`
    / `hip * 0.22` guess (dropping ease) a few lines away from
    `renderSkirtGarment`'s correct formula in the very same file. Fixed by
    extracting `skirtWidths()` into `skirt.ts` as the one shared source;
    both the panel draft and both figure views now read it. Every new test
    proves the SYNC directly (reads the real `derive()`/`necklineEdge()`/
    `skirtWidths()` output and checks the rendered SVG against it), not just
    that a value updated — including a new `recipe.test.ts` block that
    redrafts each top garment and confirms `recipe.frontNeckline`/
    `backNeckline` reproduce the actual drafted edge, front AND back, for
    tee/fitted/tank. One pre-existing test legitimately updated, not
    reverted: `app.test.ts` asserted the assembled view's neckline matched
    `/Q /` — that was checking for the bug's own signature (the old
    placeholder), so it now checks for the real `/C /` cubic curve instead.
    Nothing here touches `drafting/` output or `export/` — confirmed by
    `regression.test.ts`'s 8/8 SHA-256 baseline passing unmodified, exactly
    as predicted before building. Gate: 58 files / 764 tests / 100%
    (14 new: 3 body.test.ts, 3 garment.test.ts, 2 skirt-figure.test.ts, 3
    recipe.test.ts, 3 in the new neckline-path.test.ts). File set: 2 new
    (`render/neckline-path.ts`, `render/neckline-path.test.ts`), 13 modified
    (`skirt.ts`, `skirt-figure.ts`, `tank.ts`, `recipe.ts`, `render/index.ts`,
    `body.ts`, `garment.ts`, `app.ts`, plus their 5 test files). Verified in
    `npm run dev`: tee/fitted/tank body view now matches the pattern/
    assembled view at the same measurements; tank's neckline visibly reads
    as a scoop, not a crew. Next: step 2 of the Tank rework plan — build the
    tank properly, with real armhole/strap geometry (not reused from the
    sleeved bodice), researched and recorded in `TANK-RESEARCH.md` per the
    standard below, with the styles-achievable-via-parameters-vs-needing-
    princess-seams split proposed and agreed before building.
60. Finish the tank properly — two real gaps flagged by Kshitij after Slice
    59, neither swept under "the tank was cheap": (1) the neckline choice
    was a shortcut, not a decision — v was picked only because it was the
    sole non-crew shape with real curve math, not because it's right for a
    tank (a tank is normally a deep, round scoop); (2) `render/garment.ts`
    (assembled view) and `render/body.ts` (measurement-dimension figure)
    both took only `Measurements`, no recipe — genuinely garment-blind, so
    both drew a tank as a short-sleeve tee (`m.sleeveLength`/`m.bicep`
    still exist on the object even when a garment's `fields` array doesn't
    expose them). `body.ts`'s own file header ("the figure only bends
    where we have a number... honesty is the whole point") made this a
    real violation of its own stated design, not just an aesthetic gap.
    Fixed both. New real curve math in `neckline.ts`: `scoopControlFactors`
    (0.85/0.8 front/back depth factor vs crew's 0.55/0.6, 0.65 vs crew's
    0.45 width factor) — a genuinely new design decision with no prior spec
    to match, unlike crew's byte-identical-inherited numbers; flagged as
    starting values, not claimed exact. `necklineEdge` now accepts "crew",
    "v", AND "scoop" (only "boat" still throws). `tank.ts`'s front switched
    from v to scoop. `renderGarment`/`renderBody` both gained a `hasSleeve`
    param (default `true` — tee/fitted byte-identical, confirmed:
    `regression.test.ts`'s 8/8 baseline and every pre-existing render test
    passed unmodified); `false` drops the sleeve extension, the dashed
    armhole "seam" (nothing sews to a bound edge), and the Sleeve/Bicep
    dimension lines entirely. `app.ts` computes `hasSleeve =
    recipe.fields.includes("sleeveLength")` — same idiom as the existing
    `isTop` check — and threads it through both call sites. Real gap found
    and closed during verification, not assumed away: the first mutation
    test (hardcoding `hasSleeve = true` in `app.ts`) was caught by NOTHING
    — every existing test proved the render FUNCTIONS work correctly in
    isolation, but nothing proved `app.ts` actually wires them right. Added
    a real DOM-level integration test (`app.test.ts`) that clicks the tank
    button and inspects the rendered SVG; re-ran the same mutation and
    confirmed it now fails immediately, before reverting — this is
    literally the bug Kshitij reported, now gated. Also mutation-tested the
    scoop math independently. Gate: 57 files / 750 tests / 100%. File set:
    10 modified (`neckline.ts`, `neckline.test.ts`, `tank.ts`,
    `tank.test.ts`, `render/garment.ts`, `render/garment.test.ts`,
    `render/body.ts`, `render/body.test.ts`, `ui/app.ts`, `ui/app.test.ts`),
    no new files. Next: polo (Slice 61) — the user's pick over a second
    long-sleeve garment, since sleeve length is already adjustable on the
    tee without a separate recipe. Polo needs a genuinely new piece (a
    collar, plus a partial button placket) — real new design surface,
    closer in kind to Waistband (Slice 57) than to the tank.
59. Component architecture Phase C2 — THE REAL TEST (COMPONENT-ARCHITECTURE.md
    §9): "add a genuinely new variant — a tank... it should take hours, not
    a slice-run. If it doesn't, Phase B is not finished." It did: new file
    `tank.ts` (~90 lines) + one real capability added to `bodice.ts` +
    5-line `TANK_STYLES` table + one `GarmentRecipe` object in `recipe.ts`.
    Zero engine-layer files touched — checked before building, not assumed:
    the garment picker, the "is this a top" figure logic, and the style
    panel all already walk `GARMENTS`/`recipe.fields` generically; adding
    `TANK` to the `GARMENTS` array was the only wiring needed outside the
    new/touched recipe files. The one real new capability: `BodiceParams`
    gained an optional `necklineParams?: NecklineParams` (defaults to
    `NECKLINE_DEFAULT`, so tee/fitted's output is provably unaffected —
    every pre-existing test, incl. `regression.test.ts`'s 8/8 baseline,
    passed unmodified). This is the wiring Slice 56 explicitly deferred
    ("nothing outside neckline.test.ts can reach a non-default value yet...
    building that now would be backwards from how every prior slice proved
    itself") — the tank is that real second consumer, finally needing it.
    `draftTank`: `bodice(front, {necklineParams: v-neck})` + `bodice(back)`
    (crew, unchanged) + shoulder/side stitches only, no sleeve, no cap-ease.
    Reused verbatim, not rewritten: `sleevedTopPanelChecks`/`frontHemWidth`
    from `tshirt-checks.ts` (read first to confirm neither is actually
    sleeve-specific despite the file name — they're not). NOT reusable:
    `sleevedTopGuidance` (calls `rolePiece(block,"sleeve")`, would throw) —
    new `tankGuidance` is the same function minus `armholeMatch`.
    `TANK_POMS` = `TSHIRT_POMS`'s first 7 entries (the last 3 are
    sleeve-only). `TANK_NOTCHES` mirrors the tee's own shoulder/side
    pattern, no armhole/cap notches (nothing sews to a tank's armhole — a
    finished, bound edge, not a seam). New `tank.test.ts`: structure
    (2 pieces, no sleeve role, v-neck front is a LINE, crew back is a
    CURVE), stitch correctness, `tankGuidance` never throws and still
    surfaces ease/armhole/shoulder warnings, POM/notch counts, and full
    end-to-end grading + `garmentReport` through the generic engine.
    Verified beyond unit tests: ran the REAL export pipeline
    (`exportSvg`/`exportDxf`/`exportTechPack`/`guide`) on a drafted tank —
    2 pieces, a V-shaped neckline path in the SVG, clean tech pack and DXF,
    real guidance notes. Mutation-tested: swapped the front's neckline
    shape back to crew and confirmed the v-neck test caught it immediately,
    before reverting. Gate: 57 files / 735 tests / 100%. File set: 2 new
    (`tank.ts`, `tank.test.ts`), 5 modified (`bodice.ts`, `recipe.ts`,
    `recipe.test.ts`, `style.ts`, `drafting/index.ts`). **Phase B/C's core
    claim is now empirically proven, not just argued.** Next (C3): a
    croquis library (ROADMAP Priority 1.3) — or, given how cheap the tank
    was, a second genuinely new garment might be worth more evidence before
    moving on; worth discussing before committing to C3's scope.
58. Component architecture Phase C1 (COMPONENT-ARCHITECTURE.md §5, §9) —
    re-express the skirt via components. Small, mechanical: Slice 57
    already did most of this incidentally (the waistband is a real
    `Component`, `draftSkirt` already ran through `assembleComponents`).
    What was left: `panel(m, name)` (the skirt's own real implementation
    since Slice 1) was still hand-wrapped into `ComponentResult` objects
    inline, twice, inside `draftSkirt`, instead of going through a real
    `Component` the way `bodice` does. New `skirtPanel: Component
    <SkirtPanelParams>` closes that — `{position, silhouette}`, mirroring
    `bodice`'s `{position}` pattern exactly, exposing a `waist` interface
    (unused today, same posture as `bodice`'s `armhole` before Sleeve
    existed to consume it). `silhouette: "straight" | "flare"` per §5's
    taxonomy; `"flare"` throws — the block's whole premise (its own file
    header: "waist darts / A-line flare are a later refinement"), typed
    now so the taxonomy doesn't need a breaking change later, same posture
    as Neckline's unimplemented shapes. Scoping note carried from Slice 58
    planning: §5's "two real consumers before extraction" rule is about
    NOT inventing a speculative abstraction — `panel` already existed and
    was already the skirt's real implementation; this slice wraps it in
    the shape everything else in Phase B/C uses, for consistency, not
    because a second consumer needs it yet. Byte-identical: `panel`'s own
    geometry is untouched, so every pre-existing test passed unmodified,
    including `regression.test.ts`'s 8/8 baseline and all of Slice 57's
    skirt tests (front/back piece content unchanged, notches/allowances/
    POMs untouched, since none of those reference `panel` directly).
    New tests in `skirt.test.ts`: the Component contract (role-keyed piece,
    `waist` interface, no internal stitches), the flare throw, and that
    `draftSkirt`'s front/back pieces ARE `skirtPanel`'s output. Verified
    empirically: disabled the silhouette guard and confirmed the throw
    test failed immediately, before reverting. Gate: 56 files / 723 tests
    / 100%. File set: 2 modified (`skirt.ts`, `skirt.test.ts`), no new
    files. Next (C2, the real test of Phase B/C): add a genuinely new
    variant — a tank (bodice + no sleeve + different neckline) — and it
    should take hours, not a slice-run. If it doesn't, Phase B isn't
    actually finished, whatever the checklist said at Slice 57.
57. Component architecture Phase B5 (COMPONENT-ARCHITECTURE.md §5, §9) —
    Waistband, Phase B's first genuinely NEW component (not a refactor: no
    waistband code existed anywhere to extract). §5's taxonomy only
    sketches `depth`/`closure`; the real design was scoped and flagged
    before building. New file `waistband.ts`: a plain strip cut on the fold
    — same convention as the skirt's own front/back panels — sized to
    `(waist+ease)/2` (doubled by the fold = the full finished circumference,
    the same number the existing "Waist (finished)" POM already reports, by
    construction). `closure` (`"button"|"hook"`) is deliberately
    geometry-inert: real waistbands are cut identically regardless of
    hardware — unlike Neckline's `shape`, where an unimplemented value would
    have changed the curve, `closure` genuinely has nothing to implement at
    the drafting layer. Course-corrected during build from the originally
    scoped "closure adds a width overlap": that would have broken the
    seam-length match against front+back's combined waist edges for no real
    benefit, since the overlap isn't part of the sewn seam. `draftSkirt` now
    wires it in for real via `assembleComponents` — skirt has NO
    byte-identity gate (`regression.test.ts` only covers tee/fitted), so
    unlike B2-B4 this slice does NOT preserve prior output; `skirt.test.ts`'s
    piece-count assertion and `stitch.test.ts`'s stitch-count/golden-master
    comparisons were updated to the new correct shape, not preserved.
    `garment-check-golden.ts`'s `SKIRT_GOLDEN_REPORTS` regenerated from a
    REAL run of post-change `garmentReport(SKIRT, m)` — per that file's own
    rule, correct only because it records a new *intentional* truth, not to
    paper over a break. `SKIRT_NOTCHES` gained the front/back/waistband
    join-point notches, derived via `matchedNotch` off the new waistband
    stitch (not hand-typed) — front at t=1 on its own waist edge, back at
    t=0, waistband at t=0.5 on its combined "seam" edge, all three the same
    physical point. `WOVEN_SKIRT_ALLOWANCES` gained `fold: 0` / `seam: 1`
    for the waistband's own edges. New `waistband.test.ts`: the Component
    contract, real geometry (half-circumference formula, edge names, depth
    genuinely applied), the closure-inertness claim proven directly
    (button vs. hook produce `toEqual` identical geometry, not just
    asserted in a comment), and the real `draftSkirt` wiring (role present,
    finished length matches the existing POM by construction, grades in
    order across the size run). Verified beyond unit tests, per project
    discipline (bugs get caught by rendering, not trusting coverage): ran
    the REAL export pipeline end-to-end — `exportSvg`/`exportDxf`/
    `exportTechPack` on a drafted skirt — confirmed 3 pieces, a "WAISTBAND"
    label in the SVG, "Waistband" in the tech pack, clean DXF output.
    Mutation-tested twice: corrupted the half-circumference formula
    (caught immediately — 6 tests across 3 files) and the notch edge
    index, both reverted after confirming failure. Gate: 56 files / 720
    tests / 100%. File set: 2 new (`waistband.ts`, `waistband.test.ts`), 6
    modified (`skirt.ts`, `skirt.test.ts`, `stitch.test.ts`,
    `garment-check-golden.ts`, `recipe.ts`, `drafting/index.ts` barrel
    export). Phase B is fully closed (B1-B5); next is Phase C — re-express
    the skirt via components (C1, arguably already substantially true
    after this slice), then the real test: a tank (bodice + no sleeve +
    different neckline) in hours, not a slice-run (C2). If it isn't,
    Phase B isn't actually finished, whatever the checklist says.
56. Component architecture Phase B4, part 2 of 2 (COMPONENT-ARCHITECTURE.md
    §6, §9) — the real behaviour change, scoped before building (no prior
    agreed design existed for any of this). `necklineEdge` now implements
    "v" for real: a straight line (`kind:"line"`) from cNeck to hps, no
    curve — the true-to-life V, two straight seams meeting at a point.
    `widthEase` genuinely widens `neckWidthHalf` (shared, so front/back stay
    shoulder-seam-compatible); `frontDrop` genuinely deepens the front only
    (back's depth is untouched by it, proven directly). Both §6 guardrails
    are real: `necklineEdge` takes `shoulderHalf`/`armholeDepth` and returns
    `notes: readonly Note[]` — warns (never blocks) when the effective
    width reaches the shoulder seam or the front depth reaches the armhole,
    both boundary-tested at the exact trigger value, both independently and
    together. "scoop"/"boat" still throw — no curve math exists for them
    anywhere, and §6 always scoped them to the shirt block, not invented
    here. Scoping decision made explicit before coding: `NecklineParams` is
    STILL not threaded through `BodiceParams` or any recipe — a v-neck tee
    isn't draftable end-to-end yet, only the capability is real and proven
    by direct tests. Wiring it to something a person can actually reach is
    its own later slice, once a UI control exists to drive it; building
    that now, nothing able to test it against, would be backwards from how
    every prior Phase B slice proved itself. Byte-identical at
    NECKLINE_DEFAULT: `bodice.ts`/`fitted.ts`'s calls now pass the 2 new
    required params (`shoulderHalf`, `armholeDepth` — always already in
    scope at both call sites) but every pre-existing test, incl.
    `regression.test.ts`'s 8/8 SHA-256 baseline, passed unmodified — the
    guardrails are mathematically silent at default measurements.
    `neckline.test.ts` rewritten for the new signature: crew geometry
    (unchanged from Slice 55) + v geometry + widthEase/frontDrop application
    + both guardrails solo and combined + the "no live code path reaches
    scoop/boat" throws + the 3 byte-identity equivalence checks. Verified
    empirically: disabled the shoulder-seam guardrail's condition and
    confirmed 2 tests failed immediately, before reverting. Gate: 55 files
    / 709 tests / 100%. File set: 4 modified (`neckline.ts`,
    `neckline.test.ts` rewritten, `bodice.ts`, `fitted.ts`), no new files
    this slice. Phase B: B1 ✅ B2 ✅ B3 ✅ B4 ✅ (both parts). Next
    (B5): extract Waistband/hem treatment — the last item on Phase B's own
    list before Phase C (re-express the skirt via components, then the real
    test: a tank in hours not a slice-run).
55. Component architecture Phase B4, part 1 of 2 (COMPONENT-ARCHITECTURE.md
    §6, §9) — extract Neckline, default-only, byte-identical. New file
    `neckline.ts`: `NecklineParams`/`NECKLINE_DEFAULT` typed per §6's full
    spec (all 4 shapes, `widthEase`, `frontDrop`), but `necklineEdge` only
    IMPLEMENTS `shape: "crew"` — the only case anything drafts today.
    Deliberately narrower than §6's end state, and flagged as such before
    building: throws for `"v"`/`"scoop"`/`"boat"` (not just scoop/boat —
    real v-curve math isn't designed anywhere yet, and building it now would
    be exactly the behaviour-change work the NEXT slice is scoped for), and
    throws on non-zero `widthEase`/`frontDrop` too rather than silently
    ignoring them (nothing calls them non-default yet, but a param that's
    quietly a no-op is a footgun once one becomes live). Guardrail checks
    (`neckWidthHalf+widthEase>=shoulderHalf`, `frontNeckDepth+frontDrop>=
    armholeDepth`) deferred to that same next slice — untestable at
    defaults, no live code path to exercise them yet. The 0.55 (front) /
    0.6 (back) control-point factor — previously `bodice.ts`'s
    `necklineControl1Factor`, passed in from outside — moves INTO
    `necklineEdge` as `crewControlFactor(position)`: genuinely part of what
    a crew neckline is, not something a bodice should own. `bodice.ts` and
    `fitted.ts`'s `draftFittedFront` both now call `necklineEdge` instead of
    each hand-drawing the same curve — closes a SECOND duplication B2 had
    explicitly flagged and left alone (fitted's front neckline matching the
    tee's only "by construction", not by a shared code path). Byte-
    identical: every pre-existing test passed unmodified, incl.
    `fitted.test.ts`'s "reuses the tee front's neckline... verbatim" check
    and `regression.test.ts`'s 8/8 SHA-256 baseline. New `neckline.test.ts`
    proves the crew geometry directly (front/back control-factor
    difference), all four throw paths (v, scoop, boat, non-zero
    widthEase/frontDrop — none reachable from any recipe yet, exercised
    only by calling `necklineEdge` directly), and that `draftFront`/
    `draftBack`/`draftFittedFront`'s neckline edges ARE `necklineEdge`'s
    output, not independent copies. Verified empirically: corrupted the
    back's control factor (0.6 → 0.55) and confirmed `regression.test.ts` +
    `neckline.test.ts` + `tshirt.test.ts` failed 9 tests across 2 files
    immediately, before reverting. Gate: 55 files / 702 tests / 100%. File
    set: 2 new (`neckline.ts`, `neckline.test.ts`), 3 modified (`bodice.ts`,
    `fitted.ts`, `drafting/index.ts` barrel export). Phase B: B1 ✅ B2 ✅
    B3 ✅ B4 part 1 ✅. Next (B4 part 2): the actual behaviour change — real
    "v" curve math, widthEase/frontDrop wired to do something, guardrails
    built and exercised for real.
54. Component architecture Phase B3 (COMPONENT-ARCHITECTURE.md §2.4, §5) —
    the real fix, not just infrastructure. New file `sleeve.ts`: the cap-
    fitting machinery (`capCurves`, `solveCapHeight`, `CAP_EASE`) moved out
    of `tshirt.ts` wholesale, behind `sleeve`, a `Component<SleeveParams>`
    taking `targetArmhole: number` instead of re-deriving it internally.
    §2.4's latent coupling: `draftSleeve` used to fit its cap to
    `armholeLength(m)` — a RE-DRAFTED tee bodice — not the bodice actually
    in the block being assembled; harmless today only because fitted's front
    happens to reuse the tee front's exact armhole curve. Fixed at both real
    consumers: `draftTshirt` now measures the armhole off the front/back
    pieces it just drafted via `bodice`, and `draftFitted` — also converted
    to `assembleComponents` this slice — measures it off `draftFittedFront`'s
    OWN armhole edge, not a generic one. `draftFront`/`draftBack`/
    `draftSleeve`/`armholeLength` all stay exported from `tshirt.ts` as thin
    legacy wrappers (still re-deriving, as before) for direct callers/tests;
    production drafting no longer goes through them. Byte-identical at
    STANDARD_M by construction (doc's own prediction): every pre-existing
    test passed unmodified, including `fitted.test.ts`'s
    `rolePiece(block,"sleeve")).toEqual(draftSleeve(m))` and
    `regression.test.ts`'s 8/8 SHA-256 baseline. New `sleeve.test.ts` proves
    the Component contract (role-keyed piece, no stitches/interfaces,
    targetArmhole genuinely changes the drafted cap — not just coverage from
    indirect use) and, explicitly, that `draftFitted`'s armhole is now
    measured off the real darted front (`dartedFront.name === "fitted
    front"`), not assumed identical to the generic tee's. Verified
    empirically: temporarily dropped the back's armhole from `draftTshirt`'s
    targetArmhole sum and confirmed `regression.test.ts` +
    `tshirt.test.ts` + `sleeve.test.ts` all failed immediately (5 tests),
    before reverting. Gate: 54 files / 692 tests / 100%. File set: 2 new
    (`sleeve.ts`, `sleeve.test.ts`), 3 modified (`tshirt.ts`, `fitted.ts`,
    `drafting/index.ts` barrel export). Phase B: B1 ✅ B2 ✅ B3 ✅. Next
    (B4): extract Neckline, default-only first (byte-identical), then a
    separate slice adding shape/widthEase/frontDrop (a real behaviour
    change, §2.5's neckline gap) — kept as two slices on purpose, not one.
53. Component architecture Phase B2 (COMPONENT-ARCHITECTURE.md §2.2, §5) —
    the FIRST real consumer of B1's `assembleComponents`. New file
    `bodice.ts`: `bodicePanel`, the exact shared 90% §2.2 measured between
    `draftFront`/`draftBack` (same hps/shoulder/underarm/sideHem, same
    shoulder/armhole/side/hem edges with the same control points),
    parameterised by the three things they actually differed on — neck
    depth, the neckline curve's first control point, and the centre edge's
    name — plus `bodice`, the `Component<BodiceParams>` that supplies those
    three for `position: "front" | "back"` and exposes an `armhole`
    interface for a later Sleeve component (B3) to read. `draftFront`/
    `draftBack` in `tshirt.ts` are now thin wrappers over `bodice(...)
    .pieces.front/back` — kept exported as-is so `armholeLength`,
    `fitted.ts`'s `draftBack` reuse, and existing tests don't change.
    `draftTshirt` itself now calls `assembleComponents` instead of `block`
    directly — real use, not synthetic. Scope deliberately narrow: this
    closes ONLY the draftFront/draftBack duplication B2 names. The fitted
    front shares the same neckline/shoulder/armhole prefix but diverges into
    dart edges and a shifted hem — real, different geometry, not folded into
    `bodice` here; flagged as a candidate for a later slice, not assumed.
    Byte-identical: `tshirt.test.ts`'s existing golden-point assertions
    (exact edge coordinates) passed unmodified, and `regression.test.ts`'s
    8/8 SHA-256 baseline (tee + fitted SVG/tech-pack) passed unmodified —
    fitted is included because it reuses `draftBack`. New `bodice.test.ts`
    proves the Component contract directly (role-keyed pieces, no internal
    stitches, `interfaces.armhole` names the right edge) and that
    `draftFront`/`draftBack` ARE `bodice`'s output, not a re-derivation of
    it (`toEqual`, not just "produces the same numbers"). Verified
    empirically: corrupted the back panel's neckline control-point factor
    and confirmed both `regression.test.ts` and the existing `tshirt.test.ts`
    golden-point tests failed immediately, before reverting. Gate: 53 files
    / 686 tests / 100%. File set: 2 new (`bodice.ts`, `bodice.test.ts`), 2
    modified (`tshirt.ts`, `drafting/index.ts` barrel export). Next (B3):
    extract Sleeve, taking `targetArmhole` from the assembled bodice —
    fixes §2.4.
52. Component architecture Phase B1 (COMPONENT-ARCHITECTURE.md §9) — first
    slice of Phase B. New file `component.ts`: `ComponentResult` (pieces by
    role, internal stitches, exposed interfaces), `Component<P>` (a pure
    `(m, params) => ComponentResult` fn, same shape as a garment's own
    `draft`), and `assembleComponents(results, connectingStitches?)`, which
    merges component results — in the order a recipe builds them, since a
    later component may depend on an earlier one's exposed interface (the
    sleeve needs the assembled bodice's armhole, §2.4) — plus the recipe's
    own connecting stitches, into a `Block`. Deliberately narrow, same
    posture as A1: NO existing recipe touched. Tee/fitted/skirt keep
    drafting exactly as they do today; zero consumers this slice, so zero
    byte-identity risk — the merge helper is proven against synthetic
    ComponentResults, not real garment geometry. `assembleComponents` throws
    on a role claimed by more than one component rather than silently
    letting the later one win — same "surface a mismatch immediately"
    posture `rolePiece` already takes. Verified empirically: temporarily
    disabled the duplicate-role guard and confirmed the test that names it
    fails immediately, before reverting. Gate: 52 files / 680 tests / 100%.
    File set: 2 new (`component.ts`, `component.test.ts`), 1 modified
    (`drafting/index.ts`, barrel export only). Next (B2): extract Bodice —
    the FIRST real consumer, and the first real test of whether this shape
    holds up outside a synthetic test.
51. Component architecture Phase A3 (COMPONENT-ARCHITECTURE.md §9) — closes
    Phase A. A matched notch exists *because* two edges are sewn together, so
    it should read its edge name off the stitch that sews them, not a second,
    independently hand-typed table entry that could silently drift from it.
    New `matchedNotch(stitch, side, t, edgeIndex?)` in `stitch.ts`, returning
    the same `{edgeName, t}` shape `NotchRule` needs — deliberately structural
    rather than importing `NotchRule` from `render/notch.ts`, since that file
    already imports the drafting barrel and a value import back would be a
    real drafting → render cycle. `edgeIndex` (default 0) picks which edge of
    a multi-edge interface carries the notch — the side seam is 2 edges
    (sideUpper/sideLower); the notch sits on sideLower, index 1, same as the
    hand table always placed it. Applied to `tshirt-notches.ts` (tee: shoulder,
    side, sleeve-underarm notches now derived from `sleevedTopStitches(["side"],
    false)`), `fitted-tables.ts` (fitted front: shoulder + side, derived from
    `sleevedTopStitches(["sideUpper","sideLower"], true)`), and `skirt.ts`
    (both balance notches derived from `SKIRT_STITCHES[0]`). Deliberately NOT
    derived: the armhole/sleeve-cap notches (t=0.33 / capLeft / capRight) —
    their stitch is the sleeve-cap-ease interface, multi-edge AND eased, so
    there's no single matched point the way an ordinary 1:1 seam has one.
    Those stay hand-authored, same boundary as A2's panel-owned hem/waist-
    square checks. Verified empirically, not assumed: temporarily corrupted
    the fitted side-seam's `edgeIndex` (1 → 0, picking sideUpper instead of
    sideLower) and confirmed `regression.test.ts`'s SHA-256 gate caught it
    immediately, before reverting. Proof this slice owed: each derived notch
    table compared field-by-field against the literal pre-migration hand
    values in `stitch.test.ts` (tee front/back/sleeve, fitted front, skirt
    front/back) — skirt has no export byte-identity baseline, so this is its
    only byte-level proof. `regression.test.ts`'s existing tee/fitted SHA-256
    baseline (unchanged from Slice 34) is the other half of the gate and
    passed unmodified — confirms zero export-writer output moved. Gate: 51
    files / 671 tests / 100%. File set: 5 modified (`stitch.ts`,
    `stitch.test.ts`, `tshirt-notches.ts`, `fitted-tables.ts`, `skirt.ts`),
    zero new files. Phase A (stitches as data) is now fully closed; Phase B
    (components) is next.
50. Component architecture Phase A2 (COMPONENT-ARCHITECTURE.md §9) — the
    migration lands. `Block.stitches` is now REQUIRED (§11 Q4's boundary);
    all three recipes declare their real stitches (`sleevedTopStitches` for
    tee/fitted, a plain `SKIRT_STITCHES` constant for skirt — no builder
    needed, there's only one skirt variant); `garmentReport` combines
    `stitchChecks(b, b.stitches)` with `recipe.checks(b, m)`, narrowed to
    panel-only (a hem or waist square to the fold — a property of one
    panel, not a seam). `dartLegCheck`/`frontHemWidth` deliberately
    untouched — independently useful, independently tested elsewhere.
    A real, solved circular-import risk, flagged at scoping time and
    confirmed rather than assumed: `stitch.ts` imports `Block` from
    `block.ts`, so `block.ts` importing `Stitch` back would be a genuine
    cycle. Used `import type { Stitch }` — erased at compile time, never
    touches the runtime module graph — and verified empirically: after the
    change, `tsc` raised zero complaints about the cycle, only the expected
    downstream call-site errors. The self-referential trap flagged when
    scoping this slice was real and required a real fix, not just caution:
    A1's equivalence tests compared declared stitches against
    `recipe.checks`, which THIS slice narrows to panel-only — comparing
    against it post-migration would either be vacuous or, since it no
    longer contains the stitch checks at all, would simply fail. Fixed by
    capturing a golden master (`garment-check-golden.ts`) — real
    `garmentReport` output, frozen as literal data, BEFORE any production
    code changed — and proving it byte-identical to live output first
    (a dedicated sanity test), mutation-tested (corrupted one detail
    string, confirmed the sanity test caught it, regenerated clean) BEFORE
    trusting it as the safety net for the rest of the slice. `stitch.ts`'s
    equivalence tests now compare the REAL production `b.stitches` (not a
    parallel test-only table that could drift) against golden-master
    truth. Mutation-tested the whole migration, not just the golden master:
    swapped `hasDart: false → true` on the tee's real stitch declaration —
    caught immediately, and more loudly than a numeric mismatch: the tee's
    front genuinely has no dart edges, so `pieceEdge` threw "no edge named"
    rather than silently reporting a wrong-but-plausible number. Two other
    test files directly tested the deleted functions
    (`tshirt-checks.test.ts`, `skirt.test.ts`) and needed real rewrites, not
    just call-site patches; `recipe.test.ts` asserted on `recipe.checks`
    directly and was fixed to read from `garmentReport` — the real
    production combination — instead. Gate: 51 files / 660 tests / 100%;
    byte-identity regression 8/8, confirming zero export-writer file moved.
    File set: 15 modified + 2 new (the golden master + its sanity test).
49. Component architecture Phase A1 (COMPONENT-ARCHITECTURE.md §9) —
    `drafting/stitch.ts`: `EdgeRef`/`Interface`/`Stitch` as pure data, plus
    `interfaceLength` and `stitchChecks`, both reusing the SAME primitives
    (`matchLengths`, `inBand`) the hand-written checks already called, not a
    reimplementation of check logic — only of how a seam's two sides are
    named and summed. Per §11 Q4, `Block` is untouched: no recipe declares a
    stitch yet, this is a pure library sitting alongside the existing
    checks, zero blast radius. The proof this slice owed: stitch tables
    declared as data (mirroring `tshirt-checks.ts`/`skirt.ts` exactly) run
    through `stitchChecks` on REAL drafted blocks and compared field-by-field
    (name, ok, AND detail string) against the REAL existing check functions
    — not "looks equivalent," byte-for-byte. Held across 4 tee points, 3
    fitted points, 3 skirt points, including one deliberately implausible
    chest (160cm) — the project's "warn, never clamp" philosophy means an
    implausible number still drafts and still must check out correctly.
    Confirms the design doc's own claim with numbers: tee's 4 stitch-
    derivable checks match exactly (hem-square, index 4, correctly excluded
    — a panel property, not a stitch); fitted's are ALL 5 checks
    stitch-derivable, a clean result since `hemSquareToFold=false` for
    fitted; skirt's 1 stitch-derivable check matches, with hem-square AND
    waist-square correctly excluded as the two panel checks. Mutation-tested
    before trusting the pass: dropped `back.armhole` from the cap-ease
    interface, confirmed all 4 tee-point tests fail with a clear ok
    true→false diff, restored. Gate: 50 files / 654 tests / 100% (21 new,
    all in `stitch.ts`/`stitch.test.ts`); byte-identity regression untouched
    (8/8) — confirms zero recipe, `Block`, or export-writer file changed.
    File set: 2 new files + a one-line barrel export addition, nothing else.
48. Component Architecture Design — a document, not code (MVP-PLAN.md
    Months 2–3, "the multiplier"; ROADMAP.md's own evidence for why it comes
    first: FreeSewing's 2026 "Library" refactor exists because they added
    garments before componentising and had to refactor out the resulting
    dependency tangle). Read the actual code before proposing anything —
    `Edge`/`Piece`/`Block` already have the right shape (every edge is
    already named, which is what makes any of this additive rather than a
    rewrite); what's genuinely missing is a formal `Interface`/`Stitch`
    concept, since seam relationships today live only as hand-written
    assertions inside the checker (`tshirt-checks.ts`), which is
    construction knowledge encoded backwards, in its own verification. Found
    a real, currently-harmless coupling with numbers, not a guess:
    `draftSleeve` fits its cap to a re-drafted TEE bodice
    (`armholeLength(m)`), not the bodice actually in the block being
    assembled — measured identical today (41.691/41.691) only because
    fitted's front reuses the same points; any future bodice with a
    different armhole would get a silently wrong sleeve. GarmentCode (ETH
    Zurich, SIGGRAPH Asia 2023) supplied the reference vocabulary
    (Edge/Panel/Component/Interface) and, concretely, its own shipped
    component list (bodice, sleeve, collar, skirts, pants) validates our
    Priority 2 target rather than just inspiring it. Proposed:
    `EdgeRef`/`Interface`/`Stitch` types + `Block.stitches`, proving 6 of 8
    current sewability checks (including the darted front's multi-edge side
    seam and the sleeve-cap-spans-front-and-back case) become one generic
    function over declared data — the remaining 2 ("hem/waist square to the
    fold") are correctly identified as panel properties, not stitches, and
    stay recipe-owned. The Slice 47 neckline finding resolved here, not as a
    standalone measurement: a `NecklineParams` component parameter
    (`shape`/`widthEase`/`frontDrop`), byte-identical at its default,
    scoped and guarded (warn-never-clamp) rather than a raw global input —
    exactly FreeSewing's own conclusion (options scoped to a part, not the
    whole pattern). Four decisions, reviewed and answered before any Phase A
    code: `backNeckDepth`'s non-scaling left as-is for MVP; neckline ships
    crew+v now, scoop+boat with the Month 4 shirt block (the type declares
    all four so the taxonomy doesn't take a breaking change later; the other
    two throw "not implemented" rather than render silently wrong);
    `Piece` stays, `Interface`/`Stitch`/`Component` are additive, not a
    rename; `Block.stitches` optional in Phase A1, required from A2 — an
    exact one-slice boundary, not an indefinite transitional state.
    Migration is strangler-fig, ~17–26 slices across three phases (A:
    stitches as data, B: components, C: prove the multiplier — adding a
    tank should take hours not a slice-run, or Phase B isn't finished),
    every phase byte-identity gated, with a standing rule carried
    throughout: never refactor and change behaviour in the same slice.
    Not a coding slice — no test-count change. `COMPONENT-ARCHITECTURE.md`
    is the full document; read it before Slice 49.
47. App menu + window state + a real product identity (rest of MVP-PLAN.md
    Month 1's Electron line). Two premises checked empirically before
    building on them, one right and one wrong: Electron already ships a full
    default menu (undo/redo/cut/copy/paste/select-all all genuinely worked,
    confirmed by a real `Ctrl+C` that copied `"100"` off the chest field) —
    so "fix broken shortcuts" was never the real gap. `app.getName()`
    returning `"Electron"` in dev mode WAS real, confirmed the same way.
    Built: a real `Menu` (File > Export mirrors all six export buttons
    exactly — main only names which kind was picked over IPC, `app.ts`
    clicks the real matching button, so the menu is provably the same code
    path as the mouse, never a second implementation; standard Edit/View/
    Window). Window-state persistence — deliberately SYNCHRONOUS file I/O,
    not the async pattern used everywhere else in `electron/`: an async
    write on the `close` event risks the process exiting before it lands,
    silently losing the save on every ordinary quit. A second, unplanned
    fix rode along once `app.getName()` was actually inspected: the packaged
    build reported the raw npm package name, not `"Electron"` — and a
    process-wide name sweep for consistency (not just this bug) found
    `index.html`'s `<title>` tag was the ACTUAL live bug — visible in every
    browser tab and, since Electron syncs window title to the page's own
    `<title>` by default, the desktop window chrome too — plus `package.json`'s
    `name`/`appId`, the packaged Linux binary's filename (was `patternworks`
    on disk, verified before AND after the fix), and **`ARCHITECTURE.md`'s
    own header, wrong through three prior full-file deliveries (43, the MVP
    rewrite, 45) and never caught until this sweep**. New
    `electron/verify-menu-and-window.cjs`: real launch, clicks the real
    native menu via Electron's own Menu API (Playwright cannot click an OS
    menu), a real resize→close→relaunch→check-bounds round trip on the SAME
    profile, and a real `win.title()` check — 4 checks, run against both dev
    mode and a real unsigned `electron-builder` output, twice each for
    stability. `src/` gate: 49 files / 633 tests / 100% (2 new: the menu-
    dispatch path proven to route through the SAME button the mouse uses,
    and a guard that mounting without `electronAPI` at all never throws).
    Anchor: commit TBD (this slice).
46. Electron shell — the desktop packaging spike (MVP-PLAN.md Month 1). The
    app was, honestly, "a locally hosted webpage called an app" until now; this
    slice makes it a real downloadable desktop app. `electron/main.cts` +
    `electron/preload.cts` (both `.cts` — TypeScript always compiles these to
    CommonJS regardless of the root package.json's `"type": "module"`, the one
    thing that needed to not fight the rest of the build): a `BrowserWindow`
    loads the SAME app that already runs in a browser tab — zero renderer code
    forked — plus one IPC channel, `save-file`, so a native save dialog can
    replace the browser's Blob-download trick. `src/ui/app.ts`'s `download()`
    now checks `window.electronAPI` first (set by the preload's
    `contextBridge`) and falls back to the exact unchanged Blob/`<a>` path when
    it's absent — additive, not a fork; every existing export test still
    exercises the browser path unmodified. TWO REAL BUGS, neither found by
    `tsc --noEmit` or the coverage gate:
    (1) Vite's default absolute asset paths (`/assets/index-*.js`) resolve to
    the filesystem root under Electron's `file://` loading, so the packaged
    app's script 404'd silently and never mounted — no error, just a blank
    window. Found by actually launching the packaged build, not by trusting
    the compile. Fixed with a new `vite.config.ts` (`base: "./"`); confirmed
    the plain `npm run dev` server is unaffected.
    (2) The first "it hangs" during verification was a false alarm mis-chased
    as a bug: Electron persists `localStorage` across launches by default (the
    same persistence that makes the app usable across restarts), so a SECOND
    test run against a REUSED profile correctly skipped the already-completed
    welcome card — the app was working the whole time. Root-caused by
    launching with a fresh `--user-data-dir` per run and confirming the
    failure disappeared; logged as a lesson because it's exactly the kind of
    thing that could get "fixed" by breaking something that wasn't broken.
    New `electron/verify-save.cjs`: launches the REAL Electron app (main +
    preload + the real built renderer) via Playwright's official Electron
    support, stubs only the native OS save dialog (the one piece a script
    can't click), clicks a real export button, and confirms a real file with
    real SVG content lands on disk — the round-trip a jsdom unit test
    fundamentally cannot prove, since jsdom has no real IPC, no real dialog,
    no real filesystem. Run via `npm run electron:verify` (dev, needs `npm run
    dev` running separately) or `electron:verify-packaged` (against a real
    `electron-builder` output). This is a NEW, separate gate from `npm run
    coverage` — it needs a display (`xvfb-run` in CI/containers) and a real
    Electron binary, and is not part of the 100%-coverage Vitest suite.
    Verified both the dev-mode path and a real unsigned `electron-builder`
    "dir" packaging output (mac/win/linux configured; only linux buildable in
    this container — mac/win need their native toolchains, untested here).
    Explicitly NOT in this slice: code signing (separate procurement track,
    MVP-PLAN.md §1.4), auto-update, app-menu/window-state polish — the rest of
    MVP-PLAN.md Month 1. `src/` unaffected beyond `app.ts`'s one new branch:
    48 files still 100% covered, only `app.ts` grew a test. (631)
45. Fit Validation Loop — the checker verifies sewability, never fit, and says so
    honestly; this slice builds the harness to close that gap. New pure module
    `drafting/fit-compare.ts`: `sampleSpec(recipe, m)` reads every POM off the
    EXACT block that gets cut (`recipe.draft(m)`, the same block the tech-pack
    sketch draws), so the sketch, the printed sheet, and the comparator can
    never quietly disagree about "predicted." `compareFit(predicted, actual)`
    returns a per-POM delta and `withinTolerance` — `true`/`false` when the POM
    has a declared tolerance, `null` when it doesn't (never an invented pass on
    a number it wasn't given a tolerance for, the same honesty rule the printed
    tolerance column already follows). The tech-pack PDF grows a 4th page, the
    Fit Record: every POM's predicted value plus blank ruled space for a real,
    hand-measured value after sewing — a print-and-write sheet, not an
    interactive form (this writer only emits plain ASCII text streams). REAL BUG,
    not found by a failing test: the first render's blank-fill header (Fabric /
    Sewn by / Date) used hardcoded cm offsets — the Date rule ran off the page
    edge, and Sewn-by's rule struck through Date's own label. Found by rendering
    the actual PDF to an image and looking at it, same discipline as the Slice 43
    silhouette bug. Fixed by sizing every column off `page.width`, not a fixed
    cm offset; verified visually across tee, fitted, and skirt after the fix.
    New regression gate parses the real rule-line coordinates out of the PDF
    content stream and asserts they stay inside the page, on both supported page
    sizes — the kind of test that would have caught the bug automatically.
    Updated two existing callout-count tests that legitimately changed (every
    POM label now also appears on page 4) and the tech-pack byte-identity
    baseline only — svg/dxf/pdf hashes untouched, confirming the blast radius is
    exactly the tech-pack writer. The loop still closes on paper, not in-app: no
    UI field exists yet to type actual measurements back in; that's a deliberate
    boundary, not an oversight (MVP-PLAN.md Month 1). (630)
44. Demo artifact — the coached journey to a real export, captured live off the
    running app, not staged. A scripted Chromium run against a fresh clone's
    actual `npm run dev` walks the real DOM: welcome card → Start → Measure →
    Fit → Refine → Output via `#journey-next`, hovers a measurement row to
    trigger the live Slice 29/30 spotlight, opens Check to a live "✓ Ready to
    cut" verdict, clicks `#export-projector`, and captures the file Chromium
    actually downloaded. The calibration claim is verified by PARSING the
    downloaded file's own SVG source (`width="10" height="10"` in a
    1-unit-=-1cm viewBox) — not the on-screen label. Ships as a 9-frame GIF +
    10 screenshots + the downloaded `tee-projector.svg` itself, so the claim
    is checkable without re-running anything. RESUME-LOG.md updated: demo
    artifact moved Pending → Earned; also caught and fixed a second stale
    Pending claim ("structurally different garment — not started"), true
    since Slice 43. Readiness threshold now 5 of 5. Not a coding slice — no
    test-count change. Anchor: commit `e6fd79d` (Slice 43 baseline).
43. Skirt body croquis (3 of 3 from the s40 review — the review queue is
    CLOSED) — `renderSkirtBody` rebuilt as a real lower-body figure: nothing
    above the waist (the old head/shoulder stub is gone), a waist→hip flare,
    a crotch, two legs run to y=118 (past the 100 cm hem the length slider
    allows), and the skirt drawn as a separate cloth shape draped outside the
    body. `hipDepth` gets its own `data-dim` (deferred from 42), so all four
    raw skirt fields are annotated. THREE REAL BUGS, none found by a failing
    test: (1) both legs traced in the same direction, so the outline skipped
    the LEFT HIP entirely — every envelope test (widest point, deepest point,
    viewBox fit) stayed green; found by reading the emitted `d` string, fixed
    by modelling a leg as a reversible chain of cubic segments so the left
    leg walks crotch → inner → ankle → outer → hip; (2) the hip dimension
    label collided with the crotch apex at shallow `hipDepth` — moved above
    the hip line, safe now that the head stub is gone; (3) waist 140 / hip 60
    (reachable, warned) made the cloth widest at the WAIST, not the hip, so a
    gutter sized off the hip alone ran the dim lines through the figure — the
    first gate written for this was itself wrong (a viewBox-containment test
    passed on the broken code, because the figure never left the viewBox,
    only overran the dim lines) and was replaced. Guardrails mutation-tested:
    bug (1) fails 4 gates, bug (3) fails 1, envelope tests stay green in both
    cases. Blast radius hashed against origin: only `skirt.body` changed
    (50bd2073→70da7d14); tee/fitted/skirt drafts, blueprints, DXF, and the
    skirt assembled view all byte-identical. (611)
42. hipDepth as a real measurement (2 of 3 from the s40 review) — the waist-to-hip
    vertical was a hard-coded `HIP_DROP = 20` duplicated in `drafting/skirt.ts` AND
    `render/skirt-figure.ts`, driven by no measurement. It is now a real
    `Measurements` field, joining the same six registries waist/hip did in s37:
    struct + `STANDARD_M` (default 20), `MEASUREMENT_BOUNDS` (12–35),
    `MEASURE_ROLE` (body, non-circumference — ease never applies to a vertical
    drop), `FIELDS` (slider 10–40), `persist` BOUNDS + a LENIENT read (old saves
    lack it, so it defaults rather than rejecting), and `SKIRT.fields`. Both
    constants deleted; draft and both figures read `m.hipDepth`.
    Default 20 == the old constant, so the skirt draft, both skirt figures, and
    tee/fitted guidance all hashed BYTE-IDENTICAL to origin. Making the field
    editable opened a failure mode that was unreachable while it was frozen — a hem
    at or above the hip line folds the panel over itself — so `skirtGuidance` gained
    a warn-never-clamp note for `length <= hipDepth`. `hipDepth` deliberately does
    NOT grade (real grading nudges it ~0.3 cm/size; adding it would move every graded
    skirt POM and forfeit the byte-identity gate) — a later refinement. The body
    figure has no `data-dim="hipDepth"` yet: left to 43, which redesigns it. (599)
41. Guidance garment-awareness (bugfix, 1 of 3 from the s40 screenshot review) —
    `plausibilityChecks`/`coherenceChecks`/`implausibleFields`/`measurementsPlausible`
    (`guidance/plausibility.ts`) now take `fields: (keyof Measurements)[]` and only
    judge a bound/ratio if every field it needs is in that set. Fixes a real bug: on
    the skirt, `chest` sits frozen at its STANDARD_M default (the skirt has no chest
    control), so shortening the skirt used to trip a spurious "Body length and chest
    look out of proportion" warning about a field the user never touched. `guide()`
    and all four `app.ts` call sites now pass `recipe.fields`. Tee unaffected: its
    7 fields already cover everything the 3 `RATIO_BOUNDS` touch and everything its
    own controls can push out of range — verified byte-identical across a 14-case
    measurement battery (the only 2 divergent cases force waist/hip out of range on
    the tee, a state its UI can never actually produce, since tee doesn't expose
    those fields). Two bugs from the same review remain queued: `hipDepth` as a real
    field (42), and the skirt body-figure redesign against it (43). (583)
40. Skirt figures — the LAST tee-shaped spot closed (app is fully garment-general).
    New `render/skirt-figure.ts`: `renderSkirtGarment` (assembled front/back panels,
    fabric-filled, waist→hip→hem) and `renderSkirtBody` (annotated lower-body figure
    with waist/hip/length dimension lines + `data-dim`/`data-edge` hover overlays like
    the tee). Both gated in app.ts on `isTop`. Fixes a real s38 bug: the assembled
    "PATTERN" view was drawing a fixed tee for the skirt (via `derive()` → chest) that
    didn't even respond to hip; it now draws a skirt that does. Both skirt placeholders
    removed; `unavailablePanel` deleted (dead code). Measurement-honest: the waist→hip
    taper is drawn because a skirt MEASURES both (unlike the tee); girths marked
    "(circ)". Tee byte-identical (garment d7d012c2, body 893568b0, style b9e41eb2). (573)
39. Recipe-owned styles + skirt style set (UI-honesty pass, part 1) — the style
    suggester is no longer tee-only. The style TABLE moved onto `recipe.styles`
    (`TEE_STYLES` for tee/fitted, new `SKIRT_STYLES`: Mini/Knee/Midi/Maxi + Fitted/
    Relaxed skirt); the style functions (`matchStyle`/`styleNames`/`nearbyStyles`/
    `currentStyles`/`styleSuggestions`) now take the table as an argument. The skirt's
    style panel shows real targets instead of a placeholder; `targetStyle` resets to
    the garment's first style on switch (so `matchStyle` never throws). Pure refactor
    for the tee: its style panel is byte-identical (b9e41eb2 / 18a14acd / 288a1de6).
    The body-view figure is the last tee-shaped spot (Slice 40). (565)
38. The SKIRT recipe (skirt bridge COMPLETE — thesis proven) — a structurally
    different garment runs through the whole engine with only a recipe added: it
    drafts (front/back panels, waist→side→hem→centre, no sleeve/armhole), checks
    READY, grades a waist/hip/length POM run, exports, and nests — all for free.
    New `drafting/skirt.ts` (draft + recipe-owned `skirtChecks`/`skirtGuidance` +
    grade/POM/notch tables); `SKIRT` assembled in recipe.ts and registered in
    GARMENTS (the toggle picks it up). Deferred bits from s37 landed: waist/hip
    plausibility bounds, `SKIRT_GRADE` deltas, and controls re-render + listener
    re-wiring on garment switch. Body view + style panel show an honest placeholder
    for the skirt (real lower-body figure + skirt styles = a later UI slice). Tee
    byte-identical (controls aa9c18d6, guide db6b584b, report a64eca53). (561)
37. Per-garment Measurements (skirt bridge, step 3) — `Measurements` gains required
    `waist` + `hip` (struct, not a generic bag — compile-time safety kept), and each
    recipe declares `fields: (keyof Measurements)[]`, the measurement set it uses, in
    order. `controlsMarkup(m, fields)` renders only that set, so a lower-body garment
    can show waist/hip and hide chest/sleeve. Forced total-records updated
    (`persist.BOUNDS`, `facets.MEASURE_ROLE`); persist migrates leniently — old saves
    with no waist/hip load with STANDARD_M defaults rather than erroring. Tee/fitted
    declare the same 7 upper-body fields, so tee output is byte-identical (controls
    aa9c18d6, guide db6b584b, report a64eca53). Deferred to the skirt recipe:
    plausibility/grade waist-bounds, body-view waist/hip, controls re-render on
    garment switch. (547)
36. Recipe-owned guidance (skirt bridge, step 2) — the guidance twin of s35. The
    tee guidance (`armholeMatch`, `easeRange`, `armholeDepthCheck`, `shoulderCheck`)
    moved to `drafting/tshirt-guidance.ts` (`sleevedTopGuidance`) and hangs off the
    recipe as `recipe.guidance(block, m)`. `guide()` is now `guide(recipe, m)` and
    GARMENT-AGNOSTIC — it runs the recipe's guidance then the sanity tiers, never
    naming a sleeve, so a sleeveless recipe runs through it (tested). `Note` / `Level`
    / `SEVERITY_ICON` extracted to a dependency-free `guidance/note.ts` so the recipe
    can speak in Notes without a drafting↔guidance cycle (re-exported from guidance
    for existing importers). Pure refactor: tee+fitted guide() output hashes
    byte-identical (e68c3e2d). (541)
35. Recipe-owned sewability checks (skirt bridge, step 1) — `garment-check.ts` is now
    GARMENT-AGNOSTIC. The tee/fitted seam/cap/hem/dart checks moved to
    `drafting/tshirt-checks.ts` (`sleevedTopChecks`) and hang off the recipe as
    `recipe.checks(block, m)`; the size-run orders by `recipe.sizeMetric`. The
    checker now owns only the truly universal checks (every piece declares notches;
    the graded run grows in order) and never reaches for a "sleeve", so a sleeveless
    garment runs through it instead of throwing (proven with a stub panel recipe).
    Pure refactor for tee+fitted: both reports hash byte-identical to s34
    (TEE a64eca53, FITTED be5a47b7). `CheckSpec` retired. (538)
34. Body-vs-finished measurement facets (last of Opus Phase A) — a displayed number
    is no longer ambiguous. New `drafting/facets.ts` classifies each raw field as a
    BODY measurement (taken off a person; garment may add ease) or a FINISHED garment
    dimension, and — where ease applies — exposes the finished value: chest gains full
    ease (`+ease`, mirrors the draft's `(chest+ease)/4`), the sleeve gains half
    (`bicep + ease*0.5`). Classifications trace to how the draft USES each number, not
    to assumption; verified against real geometry (facet finished-chest == 4×
    chestWidthHalf at every ease). `measurementFacet` / `MEASURE_ROLE` / `roleTag` are
    exposed data for Fable's F2; the control rows now carry a static "body · circ" /
    "finished" tag. (445)
33. Guidance message-quality pass (colour-blind safe, Fable-facing) — every guidance
    message is now stateful (names the current value) and ends in a plain verdict, and
    severity is shown as an ICON, not colour alone. `easeRange` no longer goes silent
    in range — it returns a positive "Ease is 10 cm — a comfortable amount" note;
    `shoulderCheck` names the offending width. New exported datum `SEVERITY_ICON`
    (`{ok:"✓", info:"ℹ", warn:"⚠"}`) is the single source of glyphs the panel renders
    and Fable's F2 will reuse — Phase-A data, not baked-in markup. (431)
32. Verdict & honest surfacing (the UI half of the sanity tiers) — geometry passing
    can no longer masquerade as validated. A top-line guidance verdict ("⚠ N to
    review" / "✓ Looks production-ready") heads the panel; implausible inputs get an
    amber outline at the field; and the two green signals — the check view's "Ready
    to cut" banner and the style panel's "You're making a X ✓" — withhold green
    while `measurementsPlausible` is false. New pure helpers `implausibleFields`
    (which fields to flag) and `measurementsPlausible` (the one gate the UI reads);
    `plausibilityChecks` now builds on `implausibleFields` (one source of truth).
    chest 160 sews together (`report.ok` true) yet the banner now reads "⚠ Sews
    together, but check the flagged measurements" — the falsely-validated screenshot
    is dead (429)
31. Plausibility & proportional-coherence checks — two new pure-function guidance
    families in `guidance/plausibility.ts`, both WARN, never clamp. (1) Absolute
    per-measurement bounds (`MEASUREMENT_BOUNDS`) for a real adult garment; (2)
    proportional coherence (`RATIO_BOUNDS`: shoulder↔chest, length↔chest,
    bicep↔chest) that catches an internally mismatched set even when each value
    passes its own bound. `guide()` folds both in after the geometric checks, so a
    chest of 160 — which sews together fine and used to draft silently — now raises
    four warnings. Bounds are DECLARED here, seeded from published adult ranges and
    centred on STANDARD_M: grading is relative (deltas around the user's base), so
    there was no size chart to read a ceiling/floor from — the roadmap's assumed
    source didn't exist. `ease` stays with easeRange (no double-warn) (412)
30. Hover highlights the outline too — the measurement→EDGES map, sibling of
    Slice 29's measurement→dimension map. `renderBody` now emits `<g data-edge=
    "<field>">` overlay segments tracing the outline each number shapes
    (shoulderWidth→shoulder slopes, armholeDepth→underarm diagonals, chest→side
    seams, length→hem, sleeveLength→arm outer edges, bicep→cuffs), drawn on top of
    the silhouette in its own colour/weight so they're invisible at rest. The
    silhouette is grouped as `data-edge="figure"` — never a field name, so it
    always dims and needs no UI special case. One `spotlight()` helper replaced the
    two duplicated highlight blocks in app.ts. Verified by external parse: every
    overlay endpoint lands on a real silhouette vertex, and no segment is owned by
    two measurements (396)
29. Slider ↔ body-view linking — each body dimension is wrapped in `<g data-dim=
    "<field>">` and each measurement row carries `data-dim-row="<field>"`; hovering
    or focusing a row spotlights that dimension and fades the rest (survives the
    body redraw via `activeDim`). Six raw inputs map to six dimensions; `ease` has
    none (it isn't a body measurement). Pure UI — no engine touched (386)
28. Graded marker — `gradedMarker(recipe, m, width)` nests the WHOLE size run on
    one bolt (via `markerPieces`, which size-labels each flat piece "<SIZE> <piece>"
    so 15 shapes aren't all "FRONT"). Same `nestPieces` estimator, bigger pile. The
    Nesting view gains a Single/Marker toggle. Tee marker: 15 pieces, 285 cm, 58%
    used vs the single 3 pieces / 76 cm / 44% — the run packs tighter. Still an
    estimator, not a production marker (381)
27. POM tolerances — each POM carries an optional `tolerance?` (cm, ±); it's a
    property of the point of measure, not the size, so it shows as one "Tol ±"
    column in the Spec view and a "Tol +/-" column in the tech-pack PDF (ASCII in
    the PDF, since pdfString maps ± to '?'). POMs without one show a dash. Tee +
    fitted authored: girths ±1.3, widths/armholes ±0.6, lengths ±1.0-1.3, small
    details ±0.3, dart intake ±0.5 (374)
26. Seam allowance done right — TWO REAL BUGS FIXED. (1) The corner offset slid
    along the bisector by `d`, so a 1 cm allowance was 0.707 cm at a right angle;
    it is now an exact 2x2 solve (`w·nIn = dIn`, `w·nOut = dOut`). (2) The cutting
    line ran 1 cm PAST the fold, adding **4 cm of chest** to every exported tee;
    fold edges now take zero allowance. Allowance is per-edge (`AllowanceSpec`)
    and recipe-owned — the two hardcoded constants (`ALLOWANCE` in app.ts,
    `SEAM_ALLOWANCE` in canvas.ts) are gone. Tee: hem 2, neckline 0.6, folds 0,
    everything else 1. Both bugs hid behind tests that asserted the outline "got
    bigger", never by how much — same lesson as the SVG bug (368)
25. Block generalization — `Block` is now `{ roles: Record<string, Piece> }` with
    `block()`, `blockPieces()` (engine: iterate) and `rolePiece()` (recipe: ask by
    role; throws if absent). Role ≠ piece name (the fitted "front" role holds a
    piece named "fitted front"). Size-run columns now derive from the block's
    roles instead of a hardcoded triple. Pure refactor: all 18 export/render
    outputs verified byte-identical to s24. Step 1 of 5 toward a skirt (360)
24. body view — an annotated upper-body figure (render/body.ts) drawn from the
    measurements; each raw input is a dimension line on the body, girths marked
    "(circ)", straight torso (no waist is measured). New "Body" view toggle.
    Measurement-layer only — touches none of the drafting engine (355)
23b. tech-pack callouts — a `Pom.anchor?` (a point on the front piece) drives
    callout leaders from a left gutter to the anchored POMs on the sketch (tee 5,
    fitted 3); table-only POMs get no leader (348)
23a. tech-pack document (part a) — a 3-page PDF on the export spine: real-piece
    flat sketch (sample size) + graded POM table + recipe BOM/construction stubs;
    a Tech Pack export button. NOT tied to the per-size picker. Callout leaders
    land in 23-b (343)

**Slice 13 note (design changed mid-build):** ease did NOT become an auto-applied
pre-draft transform. Instead: (a) **fabric/ease is guidance only** — the app
suggests an ease value from the fabric's stretch % and shows a plain-English note,
but the user owns the ease slider and dials it in by hand; nothing is written for
them. (b) The **style suggester became prescriptive** — you pick a target fit from
a dropdown and the panel shows the signed gap to it on every axis (e.g. "Ease +9
cm", "Length −13 cm"), confirming when you're there. Selecting a target changes no
measurement. This replaced the old descriptive "here are nearby styles" panel and
removed the redundancy between a separate Fit control and the style list.

**Slice 15 note (tech pack split into two passes):** the *measured heart* shipped
in Slice 15 — a POM spec sheet where each point of measure is a live geometry
query on named edges (`seam` length via `cubicLength`, `spanX`/`spanY` between
named points), run across the graded sizes so the table fills itself and grades
for free. The tech-pack *document* — a flat sketch with callout leaders, a PDF
doc writer on the export spine, and editable BOM/construction stubs — is a
deferred second pass (call it 15b), packaging around this core.

**Slice 16 note (rotation is inert, so it wasn't built):** for a grain-constrained
bounding-box pack, 0°/180°/mirror all yield the identical box and 90° tips the
grain sideways, so "grain-constrained rotation" cannot tighten this nest — real
savings need polygon (no-fit-polygon) nesting, which is out of scope. Nesting was
therefore shipped as an honest width-aware **shelf pack** (a sibling helper), and
the cutting-file exports were left on the existing translation-only `layoutPieces`
(rotating there would misplace SVG notches/grainlines, which are re-derived from
the original piece). Utilization uses true polygon area (shoelace), not the
bounding box, so it doesn't flatter the result.

**Slice 17 note (scoped to what a tee can honestly prove):** five real checks
shipped (seven rows). **Dart legs** and **smooth transitions** were left out (the
tee has no dart; smooth-transition is a fuzzy fit call, not a hard gate), and
right-angle-at-fold was scoped to the **hem** rather than the neckline (the shipped
neckline meets the fold on a vertical tangent by design — a checker slice shouldn't
retroactively flag intended geometry). Those arrive with the fitted/darted recipe.

**Slice 18 note (freeform vs. the parametric core):** freeform editing is the first
thing that stores geometry NOT derived from `measurements`. To protect the "one
source of truth" invariant it's quarantined: the Edit view snapshots the **front**,
edits are a manual override held only in the editor's state, they do **not** feed
back into measurements, and **Reset** re-drafts from the current measurements. The
reusable payload is a pure `moveHandle(piece, handle, to)` primitive — the exact
machinery dart manipulation (Slice 20) will rotate around an apex.

**Slice 19 note (first non-tee garment; dart representation):** the fitted recipe
reuses the tee's back and sleeve untouched and swaps in a darted front — proof that
a new garment is a new *recipe*, not a new app. The bust dart is modelled as two
named leg edges in the outline meeting at the apex (the correct *open* flat pattern
drawing), so it renders for free and the apex is a real vertex `moveHandle` can grab
in Slice 20. Scoped to the Pattern view via a Tee/Fitted toggle; the other views and
the `Pom` `TshirtBlock` type stay tee-shaped until a later slice generalises them.

**Slice 20 note (generalization, and a Slice 19 correction):** shipping the fitted
front exposed a real bug — its side seam was one dart intake (4 cm) SHORTER than the
back's, because the dart's mouth opens on that seam and closing the dart shortens it.
The draft now runs the side seam longer by the intake, so front and back match once
the dart is sewn (verified: 46.00 vs 46.00 cm). The consequence is an untrued,
side-slanted front hem — correct for an open flat pattern. The generalization made
this visible: `GarmentRecipe` lets the checker run on ANY garment, and the first
thing it did on the fitted block was demand the seams match. `render/canvas.ts` and
`export/svg.ts` no longer import the tee's notch table (a layering violation, now
fixed — they take notches as a parameter).

**Slice 21 note (what "truing" actually turned out to mean):** earlier notes said
truing would *level the front hem*. Working the geometry showed that was imprecise.
The dart's mouth sits on the side seam, so pivoting the dart away heals that seam —
but leaves a **kink there of exactly the dart angle** (18.361° on the standard
block). Truing is blending that kink straight, which costs ~4 mm of seam length.
Dart tools live in the **Edit view** (the quarantined override sandbox, per the
roadmap), not in the recipe: a transferred dart changes the piece's orientation
relative to the fold, which would silently invalidate the flat-span POMs in the Spec
sheet. Keeping it in the editor avoids claiming a spec we haven't earned.

## Active directive: Tank rework (agreed after Slice 60, before Slice 61)

**Why this exists.** Slice 60 was reported "finished" — 100% coverage, all
tests green, mutation-tested — but Kshitij compared the body view and the
assembled view side by side and found the body view drew a visibly different
torso shape from the actual pattern, from the SAME measurements. Root cause
(confirmed, not guessed): `render/body.ts`'s `bodyHalf = m.chest * 0.22` is
an independent, never-reconciled approximation of what `derive()` actually
computes as `chestWidthHalf = (chest + ease) / 4` — different formula,
`ease` silently dropped, and at STANDARD_M the two even invert the taper
direction (22 vs 22.5 vs the real 27.5 vs 22.5). This is a genuine
"silently wrong," not a stylistic simplification — `body.ts`'s own file
header says "honesty is the whole point." A second, same-root-cause bug: the
body view's neckline is a fixed placeholder curve, never synced to whichever
real shape (crew/v/scoop) the garment actually drafts. Neither bug was
introduced by the tank — both are pre-existing in the shared upper-body
renderer, just newly VISIBLE once a sleeveless silhouette removed the
sleeve's distraction from the rest of the shape. 100% test coverage proved
the code does what it was told; it never proved what it was told was
correct. That gap is the actual finding here, not just the two bugs.

**Standing principle this establishes, going forward, for every garment —
not just the tank:** a garment recipe may not silently reuse another
garment's geometry (an armhole curve, a body-width formula) without an
explicit, stated reason. Slice 59's tank literally reused the sleeved
bodice's armhole curve — built to fit a sleeve — unmodified, for a
sleeveless garment. That was never flagged as a simplification at the time.
Every garment needs a verified, independently-reasoned visual identity;
"it happened to reuse cleanly" is not the same claim as "it's correct for
this garment," and the two must not be conflated again.

**Research standard, going forward, for every future garment:** the
free-sketch PDFs Kshitij provided are visual/proportional reference ONLY —
useful for confirming relative proportions and naming distinct style
targets, NOT usable as numeric pattern data (no dimensions, no seam
allowances, no construction specs). Real numeric dimensions and construction
specs must come from genuine web research (drafting references, published
brand spec/size charts, sewing-pattern drafting tutorials), cross-checked
against at least two independent sources before being treated as a standard
— never recycled from one of our own existing garments' numbers, and never
presented as sourced when it's actually an estimate. Findings get recorded
in a durable repository doc, `docs/research/garments/TANK-RESEARCH.md`, following
the same convention as `docs/research/TOOLS-RESEARCH.md` and
`docs/research/ASSET-RESOURCES.md` — a persistent, checkable record,
not a one-off chat answer, so the NEXT new garment after the tank has a
repeatable process instead of starting from zero.

**The plan, in order (renumbered after Slice 62 — the neckline curve itself
turned out to be a second, deeper bug under step 1, not part of step 2):**
1. ~~**Fix the render bugs completely, systemically — not a tank patch.**~~
   **DONE — Slice 61.** `render/body.ts`'s chest-width formula and neckline
   sync, for EVERY upper-body garment (tee, fitted, tank), fixed via a real
   `necklineEdge()` call through a new shared helper
   (`render/neckline-path.ts`), not a placeholder curve. `render/garment.ts`
   got the same fix. The mandated audit of `render/skirt-figure.ts` found
   the identical bug class (`waistHalf`/`hipHalf` computed independently of
   `skirt.ts`'s real formula) and fixed it the same way — one shared
   `skirtWidths()` function, both consumers read it. "No missing link left
   unfixed" confirmed FOR THE RENDER LAYER: nothing else in `render/`
   independently re-derives a number `derive()`/`skirt.ts` already compute
   correctly. (It did not, and was never claimed to, cover the underlying
   curve CONSTRUCTION in `drafting/neckline.ts` — that's step 2.)
2. ~~**Fix the neckline curve construction itself.**~~ **DONE — Slice 62.**
   Slice 61 rendering the real curve everywhere is what exposed that the
   curve itself — `neckline.ts`, dating to Slice 55/56 — didn't meet the
   centre-front/back fold at a right angle, which is what spiked into a
   visible V once mirrored. Rebuilt as a true quarter-ellipse; `scoop` is
   now crew geometry + depth/width (no curve shape of its own — see the
   Slice 62 log entry above for the full reasoning and the sources).
   `regression.test.ts`'s tee/fitted export baseline moved, deliberately,
   with sign-off requested and given before building.
3. ~~**Build the tank properly and completely**, integrating real styling
   depth.~~ **DONE — Slice 63.** Real armhole/strap geometry for the tank
   (`drafting/armhole.ts`), researched per the standard above
   (`docs/research/garments/TANK-RESEARCH.md`) and NOT reused from the sleeved bodice. The
   parameters-vs-princess-seams split was resolved by the research itself,
   not assumed: `TANK_STYLES` has no style that varies by anything other
   than ease/length, and princess seams are for bust/waist contouring no
   current tank style asks for — so no princess seams, no new named styles,
   confirmed before building. A real scope change came from Kshitij mid-
   slice, ahead of the numeric strap-width call the research had left open:
   rather than the engine resolving that open question by picking a
   winner, `strapWidth` AND `neckDrop` both shipped as genuine
   user-adjustable measurements (joined `Measurements` itself, with
   plausibility bounds and a UI slider) — the standing principle now is
   that no garment dimension gets hardcoded to one value when the person
   could reasonably want a different one; the guidance engine's warn-never-
   clamp checks are what keep an extreme combination visible, not an
   engine-side ceiling on the input itself.
4. ~~**Confirm everything works correctly and is backed by reason**~~ **DONE — Slice 64.** Every
   dimension traceable to a source, every visual claim checked against the
   actual rendered output (not just against test assertions), before
   calling it done. **Largely satisfied by Slice 63's own verification**
   (fresh-clone dry run, all three views re-rendered and cross-checked at
   multiple strap widths). Slice 64 closed the confirmed drift: both Tank
   previews now use the exact curved armhole, neckline width is adjustable
   from its derived default with guardrails, and Tank tech-pack materials
   follow the selected fabric family. Automated gates and visual DOM checks
   pass; physical sewing remains an explicit maintainer validation item.
5. **Then, and only then, move on** — build the polo end-to-end, then
   complete Phase C3. This sequence was confirmed by Kshitij after the Slice 63
   handoff; polo remains parked until step 4 and any real-world failures it finds
   are closed.

## Refined forward plan confirmed 2026-09-12

Physical sampling and manufacturer/printer-dependent validation remain on hold;
never suggest them unless the maintainer explicitly reopens them. Phase C3
includes a visible Side view. Edit remains preview-only through Phase 5; final
cross-garment design editing is deferred until afterward.

The pre-bug-fix garment sequence below is retained as historical planning
context:

- **Epic 1 / Phase C3, Slices 80–84:** complete upper/lower shared-croquis
  routing, expose Side view, add cross-garment render-contract tests, prove
  croquis remains outside drafting/grading/checks/nesting/exports, and run the
  C3 exit gate.
- **Epic 2 / Phase 4, Slices 85–93:** research and implement the reusable
  relaxed woven short-sleeve button-up with point collar/stand, front placket,
  back yoke, one patch pocket, sleeve band, curved hem, side vent, adjustable
  research-derived six/seven-button spacing, and its complete digital gate.
- **Epic 3 / Phase 5, Slices 94–104:** research and implement the reusable
  relaxed straight-leg trouser with separate waistband, simple closure, minimal
  pockets, rise/seat/grading logic, then finish the shared numeric editing
  foundation; later surface design remains independent.

The supplied measurement, drafting, specification, stitch/seam, and Polo CAD
references are indexed in `CONTEXT-INDEX.md` and must be consulted by relevant
slices. The Polo CAD reference informs the committed Polo V2 standby backlog
only; it does not alter locked Polo V1. Full decisions and slice boundaries
are recorded in `docs/PROJECT-DECISIONS.md`.

**Current immediate next work:** finish Slice 104's full project gate and
rendered/live numeric-control audit, record the passing Epic 3 exit report, and
push the verified local `main` to `origin/main` as explicitly authorized by
the maintainer. Physical validation remains deferred.

## Roadmap — superseded by MVP-PLAN.md (kept below for slice-history context only)
The engine/recipe thesis is proven end-to-end: tee, fitted, and skirt — three
structurally different garments — all run through one recipe-driven pipeline,
with zero tee-shaped spots remaining (closed slice by slice: 35 checks, 36
guidance, 37 Measurements, 38 the skirt recipe itself, 39 styles, 40 both skirt
figures, 41 guidance garment-awareness, 42 hipDepth as a real field, 43 the
skirt body croquis rebuilt). The Fable epic (F1 real-world exports, F2 the
guided journey) merged clean on top, and Slice 44 captured the demo artifact
proving the coached journey reaches a real, calibration-verified export.

**As of Slice 44 the project moved from tactical slice-by-slice planning to a
strategic MVP plan.** The dependency spine below is COMPLETE; the roadmap
prose that used to follow it (skirt bridge → UX pressure test → photo/upcycle
features) is now either done or superseded — do not follow it. The live plan
lives in two project-knowledge docs:
- **ROADMAP.md** — full competitor analysis (Tailornova, FreeSewing,
  GarmentCode, CLO/Optitex/Lectra), the honest 145–235-slice full-scope
  estimate, and everything explicitly cut from v1 (photo→pattern
  reconstruction, the vendor marketplace database, 3D drape simulation, the
  tailored jacket).
- **MVP-PLAN.md** — the operative 6-month, ~117-slice execution plan: Month 1
  physical-fit validation + Electron packaging, Months 2–3 component
  architecture (the multiplier — study GarmentCode's decomposition first),
  Month 4 the woven shirt block, Month 5 trousers + surface design, Month 6
  beta. Velocity is measured from this repo's own `git log` (4.7 slices/week
  actual across 44 slices), not guessed.

**Slices 45–48 are all built.** MVP-PLAN.md Month 1's Electron line is done
except auto-update (deliberately unscoped — no real release feed to verify
against). **The component-architecture design doc is AGREED**
(`COMPONENT-ARCHITECTURE.md`) — all four open decisions answered, ready for
Phase A. Two things remain outside the codebase, and neither is code: sewing
the sample-size tee and filling in the Fit Record by hand, and starting the
code-signing certificate procurement (MVP-PLAN.md §1.4) — a lead-time
blocker, worth starting regardless of signing itself not being scoped yet.
**Phase A of the component-architecture migration is COMPLETE** — stitches
are real, declared data on every recipe's block, `garmentReport` reads them
generically, and the hand-written seam checks that used to encode
construction knowledge backwards (inside their own verification) are gone.
Byte-identity held at every step, proven against a frozen golden master, not
a live comparison that could have quietly become self-referential.
**Immediate next slice: Phase B** (COMPONENT-ARCHITECTURE.md §9) —
`Component`/`ComponentResult` types, then extracting Bodice (collapsing the
`draftFront`/`draftBack` duplication) and Sleeve (fixing the latent
armhole-coupling risk documented in §2.4: the sleeve currently fits itself
to a re-derived tee bodice rather than the one actually in the block).
No garment drafted by this engine has been physically validated yet; that
remains the single highest-priority open risk in the project until a Fit
Record comes back filled in.

Dependency spine (✓ = done, all done):
notches ✓ → ease ✓ → grading ✓ → tech pack ✓ (spec sheet + document) →
nesting ✓ → checker ✓ → editor ✓ → fitted recipe ✓ → darts ✓ → body view ✓ →
Block generalization ✓ → skirt bridge ✓ (checks/guidance/Measurements/
styles/figures, recipe-owned) → real-world export ✓ → guided journey ✓ →
demo artifact ✓ (Slice 44).

_The detailed "History:" sub-list previously here duplicated slices already
described above under "Slices done" (30–34) and has been removed rather than
kept as a second stale copy._

- ✓ **30 (D). Hover highlights the outline too** (done) — a measurement→edges map
  alongside the dimension-line map; hovering/focusing a row lifts the outline
  segments that measurement shapes to opacity 1 and fades the rest to 0.15. Pure
  UI, no engine touched.
- ✓ **31 (A). Plausibility & proportional-coherence checks** (done) — two pure
  guidance families in `plausibility.ts`, both **warn, never clamp**: (1) absolute
  per-measurement bounds (`MEASUREMENT_BOUNDS`); (2) proportional coherence
  (`RATIO_BOUNDS`: chest↔shoulder, chest↔length, bicep↔chest) catching a mismatched
  set even when each value passes its own bound. Correction found while building:
  grading is RELATIVE (deltas around the user's base), so the "size chart grading
  already uses" the plan named does not exist — bounds are instead DECLARED, seeded
  from published adult ranges and centred on STANDARD_M. `guide()` now warns on
  chest 160 (four notes) where it used to draft silently.
- ✓ **32 (C). Verdict & honest surfacing** (done) — a top-line guidance verdict
  ("⚠ N to review" / "✓ Looks production-ready"); implausible inputs get an amber
  outline at the field; the check banner and the style ✓ withhold green while
  `measurementsPlausible` is false. chest 160 sews yet reads "⚠ Sews together, but
  check the flagged measurements" — the falsely-validated screenshot is dead.
- ✓ **33 (B). Guidance message-quality pass** (done) — every message is stateful
  (names the current value) and ends in a plain verdict; `easeRange` now gives a
  positive in-range note instead of silence. Severity is an icon (`SEVERITY_ICON`
  = ⚠ / ℹ / ✓), rendered alongside colour so it survives colour-blindness/greyscale.
  `SEVERITY_ICON` is exposed data — Fable's F2 renders it, never redefines it.
- ✓ **34 (E). Body-vs-finished facets** (done) — `drafting/facets.ts` classifies
  each field body/finished and exposes the finished value where ease applies (chest
  +ease, sleeve +ease*0.5), traced to real draft usage. Control rows carry a static
  "body · circ" / "finished" tag; `measurementFacet` is the exposed datum Fable's F2
  renders. Completes Opus Phase A.

Then: the **skirt** recipe itself, once `Measurements` carries waist/hip. The
generalization is now well underway — Block (s25) and the checker (s35) are
garment-agnostic; guidance and `Measurements` are the remaining tee-shaped pieces.

Later: 2D body view → photo→pattern (Feature A) → upcycle planner (Feature B).

## Honest boundaries
Assembled view is a schematic, not a drape simulation. Photo features estimate
proportions (a photo has no scale) — "get close, then refine." Export files are in
centimetres (documented in code); the DXF is a minimal R12 (entities-only) — opens
clean (0 audit errors in ezdxf), but a picky tool may ask you to confirm "cm" on
import. The PDF is a minimal ASCII PDF-1.4 — opens in any PDF reader; 21 pages on
A4 for standard-M measurements (7 cols × 3 rows), tiles overlap 1 cm for taping.

Per feature (so we don't overclaim):
- **Ease**: guidance, not an auto-transform — the app *suggests* a value from the
  fabric's stretch % and explains it, but the user owns the ease number and dials
  it in manually. A heuristic, not drape physics.
- **Style**: prescriptive — you declare a target fit and the panel shows the gap on
  every axis; it never changes a measurement for you. The user closes the gaps.
- **Notches**: style is non-standardized — we pick one convention and document it;
  DXF notch representation may need a confirm on import (same caveat as our R12 DXF).
- **Save/Load**: persists measurements + fabric to localStorage (versioned JSON,
  bounds-validated); clears/migrates safely on a bad or wrong-version save.
- **Grading**: proportional re-draft around the user's measurements as base size,
  not editable grade-rule node-shifting; quality depends on the grade increments
  (the nest's tree-rings make a bad grade visible at a glance). Per-size **export**
  is built: a size picker drafts the chosen step through `draftAtSize` (the exact
  path the Spec/Nest views use, so all three agree) and emits `<garment>-<SIZE>`
  files. Boundary: it exports ONE size's pieces per download, not a graded *marker*
  (all sizes nested on one bolt) — that's separate marker-making. The size picker is
  export-local; and because both current garments share one size run, it's built at
  mount from the base garment — a future garment with its own sizes would want the
  picker rebuilt on garment switch (noted, not needed yet).
- **Tech pack**: the spec sheet auto-reads finished-garment measurements off the
  drafted geometry (front/back symmetric, so front stands in for the body); it's a
  credible measured spec, not a manufacturability guarantee. Tolerances, BOM, and
  how-to-measure are user-owned scaffolding, coming with the 15b document pass.
- **Nesting**: bounding-box / grain-constrained **shelf pack** only; no concave
  interlock (no no-fit-polygon), no rotation (inert under grain+bbox), plain fabric
  only (no nap/stripe/defect). It's an estimator and a layout helper, not a
  production marker. Don't quote efficiency vs commercial CAD.
- **Checker**: verifies **sewability (geometry)**, not fit — a muslin still decides
  fit. Knows intentional ease ≠ error (per the Slice 5 cap logic). Currently five
  checks; a **dart-leg** check runs on any darted garment (it arrived with the
  fitted block). Smooth-transition remains out (a fuzzy fit call). The checker is
  fully garment-driven: it reads the recipe's check spec, notches, and size run.
  **Slice 45 built the harness for exactly this gap** (`drafting/fit-compare.ts`
  + the tech-pack's 4th page): sewability ≠ fit, and the harness doesn't paper
  over that — it exists so an actual sewn garment's measurements can be checked
  against the prediction, per POM, against each POM's own declared tolerance.
- **Fitted / dart**: the first non-tee recipe reuses the tee's back and sleeve and
  swaps in a darted front. The bust dart is baked into the outline as two named leg
  edges meeting at the apex (so it renders truthfully and the apex is a real vertex
  for dart manipulation). Its side seam runs one dart-intake longer than the back's,
  so the two match once the dart is sewn shut — which means the **open front hem
  slants down at the side**. That is a correct *untrued* flat pattern; **truing**
  (levelling the hem after the dart closes) lands with dart manipulation, and until
  then the fitted front declares `hemSquareToFold: false` so the checker doesn't
  flag intended geometry.
- **Garments**: a `GarmentRecipe` (drafting/recipe.ts) carries everything
  garment-specific — draft fn, notch table, POM list, grade rule, size run, check
  spec, guidance, and styles. Every view is driven by it; the engine never imports
  a t-shirt table. **Three recipes ship: tee, fitted (darted), and skirt** — one
  structurally different garment family (no sleeve/armhole/neckline), proving the
  split holds across families, not just variants within one (Slices 35–43). What
  does NOT yet exist: component reuse BETWEEN recipes — the skirt's waistband and
  the tee's hem are two separate hand-written implementations, not shared parts.
  Building that (sleeve / neckline / collar / cuff / waistband as interchangeable,
  parameterised components) is Months 2–3 of MVP-PLAN.md and the top architectural
  priority right now. All garments share one body grade rule; a garment-specific
  grade is a later edit.
- **Dart manipulation**: `transferDart` pivots the wedge about the apex onto another
  **straight** seam (curved targets like the neckline/armhole would need Bézier
  splitting — not built). The fold is always the anchor and never moves. The
  conservation law is real and tested: every seam length survives the pivot, the
  apex and wedge angle are unchanged, and the legs stay equal. The mouth *widens*
  the farther the dart sits from the apex — same angle, longer legs. That's correct.
- **Truing**: moving a dart off a seam leaves a corner in it, exactly the size of
  the dart angle. `trueSeam` blends two straight edges into one. Honest cost: a
  straight line is shorter than the bent path, so that seam loses a little length
  (~4 mm on the standard block) and must be re-checked against its partner. Truing
  only handles straight seams, and only the Edit view offers it.
- **Editor**: freeform drag of one piece (the **front**) — a manual override, not a
  parametric change. Edits don't write back to measurements and don't survive a
  Reset (which re-drafts). It ignores the fold constraint on purpose (freeform means
  freeform). It's the interaction gate for darts, not a full pattern CAD yet
  (single piece, no add/delete points, no undo history).
- **Darts**: geometrically faithful but fit still needs a muslin; the basic tee has
  no dart, so 20 is gated on a fitted recipe (19).

## Research context
**Superseded by ROADMAP.md §1** (Slice 44's deeper, current competitive analysis).
Original landscape study (Seamly2D/Valentina, Tailornova, Fabra, Knitup,
Gerber/Lectra/Optitex) still holds; added since: **FreeSewing** (our closest
architectural peer — code-defined parametric patterns; their 2026 "Library"
refactor is a direct warning to build components BEFORE garments, which is why
that's Months 2–3 of MVP-PLAN.md and not later) and **GarmentCode** (ETH Zurich,
SIGGRAPH Asia 2023 — the strongest available reference for that component
architecture). Differentiators, updated: parametric grading, auto POM/tech-pack
export, fabric-aware ease guidance, the plain-English production-readiness
checker, and — new, and the one that actually matters — **physically verified
fit**, which no competitor in our tier claims.

## Test counts (proof a slice landed)
s4=58, s5=72, s6=82, s7=89, s8=94, s9=103, s10=119, s11=139, s12=155, s13=171,
s14=187, s15=202, s16=219, s17=239, s18=257, s19=268, s20=285, s21=321, s22=327
(+1 post-s22 SVG-export bugfix = 328), s23a=343, s23b=348, s24=355, s25=360, s26=368, s27=374, s28=381, s29=386, s30=396, s31=412, s32=429, s33=431, s34=445,
F1=493 (48 new: 9 unfold, 17 projector, 12 A0, 8 byte-identity regression, 2 UI),
F2=530 (37 new: 27 journey unit, 10 app journey-flow)
s35=538 (8 new: 6 tshirt-checks unit, 2 garment-agnostic stub)
s36=541 (net +3: sleevedTopGuidance + agnostic guide payoff; tee-guidance tests moved)
s37=547 (net +6: fields filter, waist/hip facets+persist round-trip+lenient migration)
s38=561 (14 new: skirt draft/checks/guidance/POM + garment-switch UI + waist/hip bounds)
s39=565 (4 new: recipe-owned style table + skirt style set; tee style panel unchanged)
s40=573 (8 new: skirt assembled + body figures, real-SVG-parse + geometry; tee unchanged)
s41=583 (10 new: garment-scoped plausibility/coherence tiers + guide()/app.ts skirt bugfix regression; tee byte-identical)
s42=599 (16 new: hipDepth field across 6 registries, measured-vertex figure gates, hem-clears-hip warn, legacy-save compat; skirt draft + both figures + tee/fitted guidance all byte-identical),
s43=611 (net +12: skirt body croquis rebuilt — path-connectivity + mirror-symmetry + crotch + dim-gutter + cloth-outside-body gates; tautological hip>waist test deleted; only skirt.body changed, every other output byte-identical),
s44: no test-count change (non-coding slice — demo capture; RESUME-LOG.md updated, not the repo),
s45=630 (19 new: 11 fit-compare unit incl. inclusive-tolerance boundary + null-when-no-tolerance + missing-label throw; 8 net tech-pack — new Fit Record page tests + page-bounds regression gate + 2 updated callout counts; tech-pack byte-identity baseline updated, svg/dxf/pdf untouched),
s46=631 (1 new: app.test.ts's electronAPI branch; the desktop shell itself — electron/main.cts, preload.cts, verify-save.cjs — is a new e2e gate outside the Vitest suite entirely, verified separately via npm run electron:verify[-packaged]),
s47=633 (2 new: menu-dispatch routes through the real button not a duplicate path, mount() never throws with electronAPI entirely absent; menu/window-state/identity/title are a second e2e gate, npm run electron:verify-menu[-packaged], 4 checks × 2 environments × 2 runs, all passing),
s48: no test-count change (design doc, not code — COMPONENT-ARCHITECTURE.md agreed, ready for Phase A),
s49=654 (21 new, all in stitch.ts/stitch.test.ts: interfaceLength + stitchChecks unit tests on synthetic data, plus the real equivalence proof — 4 tee points + 3 fitted points + 3 skirt points, field-by-field against the actual hand-written checks, mutation-verified. Zero other file's test count changed.),
s50=660 (net +6: golden-master sanity tests (3) + skirtPanelChecks/allSkirtChecks coverage (2) + sleevedTopStitches/sleevedTopPanelChecks rewrite (net, replacing the deleted sleevedTopChecks tests) — 15 files modified, 2 new; byte-identity regression 8/8 unchanged, confirming the migration touched zero export-writer output)
s51=671 (11 new, all in stitch.test.ts: 4 matchedNotch unit tests + 3 TSHIRT_NOTCHES + 2 FITTED_NOTCHES + 2 SKIRT_NOTCHES field-by-field equivalence tests against the pre-migration literal tables; 5 files modified, 0 new; regression.test.ts's 8/8 tee/fitted SHA-256 baseline unchanged, confirming zero export-writer output moved)
s52=680 (9 new, all in the new component.test.ts: 2 Component/ComponentResult shape tests + 7 assembleComponents tests incl. multi-component role-order, stitch-concatenation-order, connecting-stitches-appended-after, and the duplicate-role throw, mutation-verified; 2 new files (component.ts, component.test.ts), 1 file modified (index.ts barrel export only); zero existing recipe touched, so no byte-identity risk this slice)
s53=686 (6 new, all in the new bodice.test.ts: 4 Component-contract tests (role-keyed pieces, no internal stitches, correct armhole interface, front/back neckline depths differ) + 2 draftFront/draftBack-ARE-bodice's-output equivalence tests; 2 new files (bodice.ts, bodice.test.ts), 2 files modified (tshirt.ts, index.ts barrel export); tshirt.test.ts's pre-existing golden-point assertions + regression.test.ts's 8/8 SHA-256 baseline (tee + fitted) both passed unmodified, mutation-verified via a corrupted neckline control factor)
s54=692 (6 new, all in the new sleeve.test.ts: 3 Component-contract tests (role-keyed piece, no stitches/interfaces, targetArmhole genuinely used) + 1 draftSleeve-IS-sleeve's-output equivalence test + 2 §2.4-fix proof tests (draftTshirt/draftFitted measure the REAL assembled armhole, draftFitted's off the actual darted front by name); 2 new files (sleeve.ts, sleeve.test.ts), 3 files modified (tshirt.ts, fitted.ts, index.ts barrel export); every pre-existing test incl. fitted.test.ts's sleeve equivalence check and regression.test.ts's 8/8 baseline passed unmodified — byte-identical at STANDARD_M by construction, mutation-verified by dropping the back's armhole from the target sum and confirming 5 tests across 3 files failed immediately)
s55=702 (10 new, all in the new neckline.test.ts: 3 crew-geometry tests (point placement, front/back control-factor difference, params-default-to-NECKLINE_DEFAULT) + 4 deliberately-unimplemented tests (throws on v, scoop, boat, non-zero widthEase, non-zero frontDrop) + 3 draftFront/draftBack/draftFittedFront-ARE-necklineEdge's-output equivalence tests; 2 new files (neckline.ts, neckline.test.ts), 3 files modified (bodice.ts, fitted.ts, index.ts barrel export); every pre-existing test incl. fitted.test.ts's neckline-verbatim check and regression.test.ts's 8/8 baseline passed unmodified, mutation-verified by corrupting the back control factor and confirming 9 tests across 2 files failed immediately)
s56=709 (net +7 vs s55, neckline.test.ts rewritten for the new 6-arg necklineEdge signature: crew tests kept + v-geometry, widthEase/frontDrop application, guardrail solo/combined/silent-at-default, and the narrowed scoop/boat-only throw tests added; 0 new files, 4 modified (neckline.ts, neckline.test.ts, bodice.ts, fitted.ts); every pre-existing test, incl. regression.test.ts's 8/8 baseline, passed unmodified — byte-identical at NECKLINE_DEFAULT despite both call sites gaining 2 new required params; mutation-verified by disabling the shoulder guardrail's condition and confirming 2 tests failed immediately)
s57=720 (net +10 new in waistband.test.ts (Component contract, geometry, closure-inertness proven directly, real draftSkirt wiring) + skirt.test.ts/stitch.test.ts updated in place for the new 3-piece/2-stitch skirt shape — NOT preserved unmodified, since skirt has no byte-identity gate; garment-check-golden.ts's SKIRT_GOLDEN_REPORTS regenerated from a real post-change garmentReport run, per that file's own "regenerate only before a behaviour change" rule; 2 new files, 6 modified; regression.test.ts's 8/8 tee/fitted baseline untouched since neither recipe was touched; verified against the real export pipeline (SVG/DXF/tech-pack), not just unit tests; mutation-verified twice)
s58=723 (3 new, all in skirt.test.ts: the skirtPanel Component-contract test, the flare-throws test, and the draftSkirt-front/back-ARE-skirtPanel's-output equivalence test; 0 new files, 2 modified (skirt.ts, skirt.test.ts); every pre-existing test passed unmodified, incl. regression.test.ts's 8/8 baseline and every Slice-57 skirt test — panel()'s own geometry never changed; mutation-verified by disabling the silhouette guard and confirming the throw test failed immediately)
s59=735 (12 new, all in the new tank.test.ts: structure/neckline-kind/stitch tests (4) + tankGuidance never-throws + 2 guidance-content tests (3) + notch/POM-count tests (2) + 3 end-to-end tests (registry fields, graded spec sheet grows in order, full garmentReport passes); 2 new files (tank.ts, tank.test.ts), 5 modified (bodice.ts — gained optional necklineParams, recipe.ts, recipe.test.ts, style.ts, index.ts); every pre-existing test incl. regression.test.ts's 8/8 baseline passed unmodified since necklineParams defaults preserve tee/fitted exactly; verified against the real export pipeline (SVG/DXF/techpack/guidance), not just unit tests; mutation-verified by swapping the tank's front neckline back to crew and confirming immediate failure)
s60=750 (net +12 vs s59: 3 new scoop-geometry tests in neckline.test.ts (replacing the old throws-on-scoop test, since scoop is real now) + 1 updated tank.test.ts assertion (scoop vs crew control-factor comparison, replacing the old v-vs-crew kind check) + 4 new sleeveless-garment tests in garment.test.ts + 6 new sleeveless-figure tests in body.test.ts + 2 new DOM-level integration tests in app.test.ts (tank draws without a sleeve in both views; tee still draws WITH one); 0 new files, 10 modified; regression.test.ts's 8/8 baseline and every pre-existing render/body/garment test passed unmodified — hasSleeve defaults to true; the app.test.ts integration tests exist specifically because the first mutation test against a hardcoded app.ts wiring bug was caught by NOTHING until they were added — see the slice-60 log entry)
s61=764 (14 new: 3 body.test.ts (chest-width sync, real front-collar geometry, scoop-vs-crew collar differs) + 3 garment.test.ts (real front-collar geometry, changing only the front neckline moves only the front path, defaults to crew) + 2 skirt-figure.test.ts (real waist/hip sync, body/garment agreement across waist/hip/ease combos) + 3 recipe.test.ts (tee/fitted/tank's declared frontNeckline/backNeckline reproduce the actual drafted edge) + 3 in the new neckline-path.test.ts (curve emits two mirrored halves, V emits two lines not a curve, control points mirror correctly); 2 new files (render/neckline-path.ts, render/neckline-path.test.ts), 13 modified; regression.test.ts's 8/8 SHA-256 baseline unchanged by construction — nothing here touches drafting/ output or export/; one pre-existing app.test.ts assertion legitimately updated (it was checking for the OLD placeholder curve's "/Q /" signature — the bug's own fingerprint — now checks for the real "/C /" cubic curve), not reverted)
s62=765 (net +1: neckline.test.ts's crew "different control-point factors" test replaced with a right-angle-tangent proof (front AND back), its scoop-specific tests replaced with a byte-identical-to-crew-at-same-depth/width proof; tank.test.ts's scoop-vs-crew test rewritten for depth-only distinction + 1 new shoulder-alignment test (net +1 here); neckline-path.test.ts's mirror test fixed for a rounding-precision false failure, not a real bug. regression.test.ts's tee/fitted SVG/DXF/PDF/tech-pack baseline DELIBERATELY regenerated — Kshitij's explicit sign-off requested and given before building, since the old baseline encoded the exact spiked curve being fixed; this is only the 2nd time since Slice 34 this baseline has moved (1st: Slice 45's tech-pack-only page addition). 0 new files, 7 modified (neckline.ts, neckline.test.ts, tank.ts, tank.test.ts, recipe.ts, neckline-path.test.ts, regression.test.ts); verified on a fresh clone via plain `git apply` + full gate + production build, not just in the working copy; every OTHER test (structure, stitch-matching, POMs, checks) passed unmodified, confirming the blast radius is exactly the neckline curve's shape)
s63=790 (25 new: 8 in the new armhole.test.ts (strap/underarm points, cuts-in-vs-straight-line proof, guardrails) + 8 tank.test.ts (strapWidth/neckDrop actually wired into the real drafted edges, front-only neckDrop, both new guardrails surfacing through tankGuidance) + 3 persist.test.ts (round-trip + pre-Slice-63 lenient load + out-of-range default, mirroring hipDepth's own precedent) + 3 body.test.ts (real strap point, byte-identical when omitted, moves with strapWidth) + 3 garment.test.ts (same, both panels); 2 new files (drafting/armhole.ts, drafting/armhole.test.ts), 17 modified (measurements.ts, plausibility.ts, controls.ts, facets.ts, drafting/index.ts, bodice.ts, tank.ts, tank.test.ts, recipe.ts, recipe.test.ts, app.ts, persist.ts, persist.test.ts, render/body.ts, render/body.test.ts, render/garment.ts, render/garment.test.ts); regression.test.ts's 8/8 baseline untouched by construction (never touches tshirt.ts/fitted.ts output); verified on a fresh clone via plain `git apply` + full gate + production build + all three views (body/garment/actual pattern) re-rendered and visually cross-checked at 3 strap widths, front and back matching at every one)
s74=858 (2 new tests: readable Polo shelf layout and Polo option-to-Body-feature spotlight; shared Polo schematic refactor and browser visual audit; full coverage remains 100%, legacy export hashes unchanged)
s80=871 (3 new upper-body croquis contract/parity tests; Body now consumes shared upper figure paths and anchors; 67 files, 100% coverage, production build, and live Tee/Tank/Polo Body renders verified; legacy export hashes unchanged)
s81=873 (2 new lower-body croquis contract/parity tests; Skirt Body now consumes the shared lower silhouette and anchors while cloth remains skirt-owned; 67 files, 100% coverage, production build, and live Skirt Body render verified; legacy export hashes unchanged)
s82=877 (4 new side-view render/UI tests; Body exposes Front + Back / Side, upper and lower Side paths are rendered from the shared croquis library, and the live UI was checked for Tee and Skirt; 68 files, 100% coverage, production build, and legacy export hashes unchanged)
s83=883 (6 new registry-driven cross-garment/render-purity tests; all five garments are checked across Front/Side/Back, and SVG/DXF/PDF/tech-pack/marker/projector/A0 outputs remain unchanged after Side rendering; 69 files, 100% coverage, production build, and 8/8 legacy hashes unchanged)
s84=883 (no new tests; final Phase C3 exit gate passed with 69 test files, 100% coverage, typecheck, production build, live Side/Front + Back review, no export diff from the pre-C3 base, and unchanged 8/8 legacy hashes)
s85=883 (research-only; full coverage/typecheck/build and parsed export suite pass; eight legacy hashes unchanged; no implementation diff)
s92=911 (complete woven-shirt recipe and UI/render/export integration; 71 test files, 100% statements/branches/functions/lines, TypeScript/production build, parsed export suites, and unchanged legacy hashes; physical validation remains on hold)
s93=918 (component-library exit audit complete; 72 test files, 100% statements/branches/functions/lines, TypeScript/production build, parsed SVG/DXF/PDF/projector/tech-pack consumers, and unchanged legacy hashes; physical validation remains on hold)
s94: no test-count change (research/contract foundation only; trouser implementation has not started)
s95=969 (shared lower-body fields/options/facets/plausibility/persistence contract; 74 test files, 100% coverage, TypeScript/build, parsed export suites, and unchanged legacy hashes; trouser geometry remains unregistered)
s96: 7 focused geometry/render tests pass and TypeScript passes; the reusable
leg block is not yet registered with the application/export pipeline, so the
full Epic 3 integration gate remains pending
s97: 12 focused leg/component tests pass and TypeScript passes; the combined
waistband/fly block is not yet registered with the application/export pipeline
s98: 21 focused contract/geometry/component/pocket tests pass and TypeScript
passes; paired pocket bags, live opening marks, notch/grainline rules, and the
trouser allowance map are complete but not registered with the application
s99=993 (78 test files, 100% statements/branches/functions/lines; trouser
guidance, XS–XL grade/POM/tech-pack tables pass; recipe/UI and full export
integration remain pending)
s100=1007 (79 test files; recipe/application integration and actual
trouser-renderer checks pass, full test and coverage runs are green at 100% for
all four metrics, TypeScript/build pass, and the 8/8 legacy regression remains
unchanged; parsed trouser outputs and live browser verification remain for
Slices 101–102)
