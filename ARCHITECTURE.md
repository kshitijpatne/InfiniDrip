# InfiniDrip architecture guide

This guide explains how measurements and choices move through InfiniDrip and
become digital sewing-pattern files. You do not need coding or sewing
experience to follow it.

## What the app does

InfiniDrip is a local workspace for turning garment measurements and design
choices into a two-dimensional pattern draft. It is intended for both home
sewists and DIY makers, and independent designers and patternmakers. People
choose a garment, enter measurements, adjust design choices, review digital
checks, and save pattern files and planning views.

A sewing pattern is a set of shapes that can be cut from fabric and joined to
make a garment. InfiniDrip draws and checks those shapes on a screen. It does
not simulate cloth draping on a body, sew a sample, or prove that a finished
garment will fit or be ready for factory production.

The app currently includes seven garment types: Tee, Darted tee, Tank, Polo,
Woven shirt, Skirt, and Trouser. A Darted tee uses sewn-in folds called darts
to shape the fabric.

## The person's path through the app

1. **Garment:** Choose one of the seven garment types.
2. **Measure:** Enter the body and length measurements it uses.
3. **Style:** Choose how roomy the fit should be, fabric and its stretch,
   color, garment options, and where a design should appear on the garment.
4. **Check:** Review the Check view. Some warnings block Export; others are
   advice.
5. **Export:** Choose settings and save the pattern or its technical reference
   files.

On first use, the app offers an optional tour of the controls. It can be skipped
and replayed. It does not alter design values, mark a design as checked, or
start an export.

## How measurements become pattern shapes

The current design is the common source for most views, checks, planning tools,
and exports:

```text
measurements + design choices
              ↓
   chosen garment's rule set
              ↓
       pattern-piece shapes
              ↓
 shared views, checks and planning
              ↓
       digital files to save
```

Each garment has its own rule set (called a **recipe** in the code). It says
which measurements, options, pieces, and construction details to use. A tee
and a skirt use different rules and shapes, but the same app tools display,
check, compare sizes, estimate fabric layout, and export both drafts.

Pattern pieces are created from measurements and selected options. The app
does not draw a separate, unrelated design for each screen or file. Most areas
show or check the same current draft:

- **Pattern:** Flat outlines of the garment's pieces. Piece names, labels, and
  construction instructions appear in a separate, ordered key beside the
  drawing on wide screens and above it on narrow screens. Different text
  styles distinguish labels from instructions without placing text over the
  pattern shapes. Activate a piece by mouse or keyboard to open its related
  measurement page. When fields span pages, links open the other groups; each
  destination highlights and focuses the related fields without changing their
  values. A piece controlled only by design options explains that instead of
  jumping to an unrelated measurement.
- **Body:** A simplified front, back, or side drawing that shows where
  measurements apply. It is not a body scan or photo.
- **Assembled:** A flat diagram of how the cut pieces relate when joined. It is
  not a three-dimensional cloth simulation.
- **Size run:** Pattern pieces at the sizes supported by that garment. Applying
  size rules to make multiple sizes is often called grading.
- **Spec:** The finished measurements each supported size is expected to have
  and the allowed variation from those targets.
- **Nesting:** A proposed arrangement of pieces within a chosen fabric width;
  this is the fabric-layout estimate.
- **Check:** Digital rules and guidance for the current design. Some issues
  affect Export readiness; not every note blocks it.
- **Edit:** A local semantic pattern editor for named corners and curve
  controls. A committed movement is stored with the active style, checked
  across its registered size run, and consumed by its dependent outputs.

The **Edit** view keeps user-authored deltas against stable recipe-owned
anchors, rather than saving a disconnected picture. Pointer drags and keyboard
coordinate edits become semantic operations; Undo, Redo, Clear and explicit
Rebase operate on that history. A source measurement or option change makes
the edits stale until the user reviews and rebases them. Invalid edits remain
visible and block dependent outputs, including exports invoked outside the
normal button state. Pattern, POM/spec, size run, nesting, relevant views, tech
pack, projector and cutting files read from the same evaluated size block.

Edit remains a 2D pattern editor for representable corner and curve-control
moves. Topology changes such as dart transfer are not offered as final edits.
The Body and Assembled views remain schematic; this work does not add cloth
simulation or prove physical fit, drape, factory acceptance or CAD round-trip
compatibility. Saved styles now have immutable parent-linked revision
snapshots; the project manager can compare and restore them as new revisions.
Users can freeze and retrieve exact bytes for the seven supported digital
outputs after review and Save. These digests do not assert physical fit or
factory acceptance. See the [Slice 238 cross-output editing evidence](docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md)
and [Slice 239 revision evidence](docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md).

## What the shared tools do

- **Guidance and checks** look for incomplete, implausible, or incompatible
  choices. They keep invalid input visible and explain what to correct instead
  of silently changing it. Issues that affect readiness can block export; not
  every advisory note blocks it.
- **Fabric and stretch choices** affect some drafting advice. They do not make
  the app simulate how cloth drapes on a body or automatically reshape the
  pattern draft.
- **Size run** applies the garment's size rules across its supported sizes.
  The process of making multiple sizes is often called grading; it does not
  mean those sizes have been tested on people.
- **Nesting** estimates how pieces might fit within a chosen fabric width. This
  is a planning estimate—not guaranteed fabric savings or a factory cutting
  plan. “Fabric layout” is another way this guide describes the Nesting view.
- **Artwork placement** records a named print, patch, or colour-block area on a
  pattern piece. Its width and height define the rectangle before uniform
  scaling; X/Y offsets are measured from that piece's cut-box centre; rotation
  is in degrees; and a larger stack-order value draws above a smaller one. An
  optional source/asset reference is provenance text only (such as a creator,
  citation, URL, filename, or asset ID); the app does not fetch a URL from that
  field. A separate local file control can attach PNG, JPEG, WebP, or sanitized
  SVG artwork, which is previewed in the Style panel. The image bytes are kept
  outside the saved-design JSON—in browser-local storage for the web app and
  the app's data folder for the desktop app—while the design stores a stable
  local asset ID and optional source-pixel dimensions. Missing local files can
  be restored or replaced. Both picker and drag/drop imports are validated
  before storage; an unsafe or failed replacement leaves the prior asset
  reference intact. The placement preview still shows only its
  rectangle, not artwork on a garment. Import does not change garment geometry
  or exports. The repository also contains twelve source-verified bundled
  textile and print references: eight from The Met and four from the Cleveland
  Museum of Art. In the Style panel's **Local artwork library**, people can
  search, filter, inspect provenance and technical notes, then attach a stable
  `builtin-met-*` or `builtin-cma-*` reference to a new or existing placement.
  The catalog records each institution's API rights evidence separately: The
  Met's public-domain flag is not conflated with CMA's CC0 status. The preview
  resolves from a build-time local asset URL; it does not use the separate
  user-import store, and museum addresses are attribution text rather than
  runtime requests. Per-use suitability guidance is advisory. The collection
  is a small V1 reference set: museum photographs and paper studies are not
  necessarily clean artwork or seamless production tiles.
- **Exports** use the same pattern data. SVG and DXF are outline files used by
  pattern and drawing programs; their lines and curves stay crisp when resized.
  A tiled PDF splits a full-size pattern across regular printer pages; an A0
  PDF uses A0-sized pages, a large standard paper size. A projector file has
  layers to project the pattern at full size onto fabric. The draft Tech Pack
  PDF gives each pattern piece its own labeled, independently scaled overview
  cell; the overview is not to scale and must not be used to cut fabric. The
  PDF also includes calculated size measurements, recipe material/construction
  notes, and a blank fit-record sheet. Long labels and instructions wrap or
  paginate. It is a draft reference, not a finished technical-flat set,
  factory-approved specification, or production release. None of these files
  proves physical fit or successful sewing.

The project also keeps reference export files. Tests compare new exports with
those references so a change to one view or tool does not silently alter
unrelated files.

## Where information is saved

The browser and desktop versions run on the person's own device. The browser
version stores saved design, recovery, and tour progress with that site's local
data; clearing the site's data can remove them. Imported artwork bytes are kept
separately in the browser's IndexedDB site data. The desktop version stores
those records and imported artwork in the app's local data folder. Neither
version has a user account, hosted database, or cloud workspace.

When someone exports in a browser, the browser handles the download. The
desktop app asks where to save each export and writes that selected file. It
also keeps a small local record of the window size. The app does not scan other
files on the computer; an artwork file is read only after the person chooses or
drops it for import, and its stored copy stays in the app's local data.

The **Control Center** is a separate project-delivery board for the project
maintainer—the person who decides scope and approvals. It is not an account
role inside InfiniDrip, and it does not store user profiles or garment designs.
The board is available only on the same computer and stores its current state
in `ops/control-center/data/board.json`. Both its dashboard and command-line
tool use the same checks before saving. The command-line interface lets
maintainers edit an epic description, transition epic status, link work items,
and attach epic-level evidence through validated commands. The closed Epic 13 groups the nine
completed pre-garment phases but does not approve a garment direction.
“Evidence” means a linked commit, test result, document, or other record that
supports a work item's status.

The future G01–G17 goals are numbered Epic 14–30 in the board. Each has a
numbered Epic record and a matching work card, so the dashboard shows both the
Epic number and its G goal. EPIC-14/G01 is closed with accepted C01/C02/C05/C06
evidence, C03/C04 contracts, a readable draft-pack remediation, and a verified
final review. Its exit report lists every A-01–A-12 disposition and future
gate. This closure does not claim factory readiness, fit, CAD interoperability,
3D simulation, or marketplace service. The conditional shorts packet E remains
held in Epic 20. A maintainer-only
rename command updates dependent work-item links and leaves an audit note;
past evidence text is not rewritten. Planning records do not start product
work or change the app's local-first boundary.

After that verified closure, the maintainer admitted EPIC-15/G02 for a local,
versioned style foundation. Slices 229–234 completed F01: a shared IndexedDB
project/style repository, non-destructive SaveFile migration, per-style
recovery, user-led project/style workflow, and versioned portable package
import/export with referenced artwork. The narrow Electron restart proofs and
the browser/Electron package validation are recorded in the S230–S234 reports;
they do not establish permanent browser storage or physical fit. F01 is Done
with hash-verified evidence. F02 Slices 235–236 add C03-aligned field
definitions and per-style append-only value observations, plus a tested
dependency/recomputation map covering all 85 inputs across the seven current
recipes. The map distinguishes pattern/spec/grade/nesting/views/exports,
mark-only woven controls, surface-art export independence, and the woven-hem
and tank-shoulder propagation gaps. A changed field shows which outputs rebuild;
the active view redraws immediately, while other views and exports regenerate
when opened. The rendered Chromium save/reload proof, output comparisons,
complete matrix and residual risks are recorded in
[`docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md`](docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md).
F02 is complete; F03 constrained edits/revisions is the active ordered packet.
Slice 237 is now complete: it adds the semantic-anchor operation model,
per-size geometry/stitch/recipe/POM guards, explicit rebase/conflict/undo rules,
and an accessible warning for invalid edits in the still-exploratory Edit
preview. That preview remains outside saved styles and exports; a rendered
Chromium check confirmed the parametric SVG stayed byte-identical before and
after an invalid preview. Slice 238 now connects semantic operations to each
style's SaveFile, recovery and portable package; checks every registered size;
and routes pattern, POM/spec, nesting, relevant views, tech pack, projector and
cutting outputs through the same evaluated geometry. It also resolves woven
hem-turn cutting allowances and makes the tank shoulder-width/strap-width
boundary explicit. The full 1,781-test repository suite passed with 100%
statement, branch, function and line coverage. A production-built Chromium and
Electron proof verified six changed Tee outputs, style isolation, Save/reload,
pending-recovery restart, stale-source blocking and explicit rebase. A second
rendered Woven-shirt trace changed all six exports after a 1 cm→2 cm hem-turn
change and again after a semantic curve edit; the retained screenshot and
hashes cover both steps. The
controlled process-exit proof is not a power-loss or operating-system crash
test; none of this establishes physical fit or factory acceptance. Slice 239
adds immutable revisions, compare/restore-as-new-child and frozen manifests
with exact output bytes. Production-built Chromium and Electron Tee and
Woven-shirt traces confirmed that saved successors do not change earlier
revision or output hashes, and that historical SVG bytes can be retrieved
after profile relaunch. The full-repository/browser/Electron exit gate and
independent-style replay remain Slice 240 work. The S238
contract and hashes are in
[`docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md`](docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md).
Slice 239's contract, rendered verification, exact artifact digests and limits
are in
[`docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md`](docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md)
and [`docs/research/epic15/evidence/S239-rendered-verification.json`](docs/research/epic15/evidence/S239-rendered-verification.json).
The semantic model and Slice 237 preview limits are in
[`docs/research/epic15/F03-CONSTRAINED-EDIT-S237.md`](docs/research/epic15/F03-CONSTRAINED-EDIT-S237.md)
and its acceptance evidence is in
[`docs/research/epic15/F03-SLICE-237-EXIT.md`](docs/research/epic15/F03-SLICE-237-EXIT.md).
The detailed G02 packet and gates are in
[`docs/planning/EPIC-15-ADMISSION.md`](docs/planning/EPIC-15-ADMISSION.md).
The Slice 230 contract is at
[`docs/research/epic15/F01-STORAGE-CONTRACT-S230.md`](docs/research/epic15/F01-STORAGE-CONTRACT-S230.md).
Slice 231 adds strict versioned project/style/recovery records and a pure
SaveFile v1–v5 conversion. Slice 232 implements the IndexedDB repository,
revision-checked atomic writes, style switching, recovery, and non-destructive
legacy migration; Electron 44.1.0 / Chromium 152.0.7977.65 passed a real
restart-and-app-file-path-change proof. Slice 233 connects that repository to
application startup, Save/Load, per-style recovery, and an accessible local
project/style manager. The app fails closed with a retryable startup error if
storage or migration fails rather than mounting editing controls over
replacement defaults. Slice 234 adds strict portable package import/export,
collision-safe ID/artwork remapping, staged artwork verification, atomic
record commit, failure rollback, and a browser/Electron restart proof. It
documents its memory ceiling and does not claim bounded-memory streaming,
permanent browser storage, or broader durability. Details are in
[`docs/research/epic15/F01-TRANSACTIONAL-REPOSITORY-S232.md`](docs/research/epic15/F01-TRANSACTIONAL-REPOSITORY-S232.md) and
[`docs/research/epic15/F01-PROJECT-STYLE-WORKFLOW-S233.md`](docs/research/epic15/F01-PROJECT-STYLE-WORKFLOW-S233.md), plus
[`docs/research/epic15/F01-PACKAGE-EXPORT-IMPORT-S234.md`](docs/research/epic15/F01-PACKAGE-EXPORT-IMPORT-S234.md).
Slice 235's field-definition, migration, history, UI and verification record is
in [`docs/research/epic15/F02-FIELD-PROVENANCE-S235.md`](docs/research/epic15/F02-FIELD-PROVENANCE-S235.md).
This work remains deterministic and user-led and does not open new garment,
physical sampling, supplier, paid-service, or production-readiness scope.

## Epic 8: a small helper test, not a clone

Epic 8 tested whether a separate helper could suggest a pattern-piece
arrangement that might use less fabric. It was a bounded helper experiment,
not a clone or fork of another product. The helper could only suggest
placements; InfiniDrip would still own the garment shapes and check whether a
suggestion was safe.

Epic 8 is complete as a no-go decision: the build could not be reproduced
offline and the safety checks could not be verified. The repository keeps
records of the experiment and why it stopped, but no helper is integrated into
or run by the app. The existing Nesting view remains in use. Any retry needs
fresh maintainer approval and must keep the app's own checks and return to the
existing layout if the helper cannot offer a safe result. See the
[Epic 8 exit report](docs/release/EPIC-8-EXIT-REPORT.md).

## What is outside the current product

Accounts, profiles, a hosted database, cloud sync, monitoring, email, and
loading artwork from the internet are outside the local app. Any paid or hosted
work stays on hold until the maintainer explicitly approves starting launch
work. Research or planning alone does not add a garment; no new garment family
starts until the nine local-only preparation phases are complete and the
maintainer approves the next garment queue.

No garment has yet been cut, sewn, and fit-tested. Digital checks catch only
the issues they are programmed to check; a physical sample is needed to learn
how a garment behaves in fabric on a person. No fit result is claimed here.

## Where to find current project information

Start with the [README](README.md) for the product overview and local setup.
For current work and approved scope, see [Project state](PROJECT-STATE.md),
[Project decisions](docs/PROJECT-DECISIONS.md), and the
[nine-phase local work plan](docs/planning/PRE-GARMENT-EXECUTION.md). The
[Control Center guide](ops/control-center/README.md) explains the separate
maintainer board. The [architecture history](docs/archive/ARCHITECTURE-HISTORY.md)
is old background, not the current system description.
