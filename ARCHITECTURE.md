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
- **Edit:** A temporary preview of one piece at a time, not a full pattern
  editor.

The **Edit** view is a deliberate exception to the shared-design flow. It lets
someone experiment with one piece (the Trouser uses its left-front piece; the
other garments use a front piece). It does not change measurements, Assembled,
Check, Size run, Nesting, the saved design, or exported files. Changes in this
preview are temporary; it is not a general pattern editor.

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
  be restored or replaced. The placement preview still shows only its
  rectangle, not artwork on a garment. Import does not change garment geometry
  or exports. A small source-verified catalog of textile references is now
  recorded in the repository, but is not yet browseable in the app. Its next
  steps add local search, explained guidance, and the authoring UI; museum
  links remain attribution text and are never fetched at runtime.
- **Exports** use the same pattern data. SVG and DXF are outline files used by
  pattern and drawing programs; their lines and curves stay crisp when resized.
  A tiled PDF splits a full-size pattern across regular printer pages; an A0
  PDF uses A0-sized pages, a large standard paper size. A projector file has
  layers to project the pattern at full size onto fabric. A technical pack
  summarizes measurements, materials, and construction notes. None of these files proves
  physical fit, successful sewing, or factory production readiness.

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
tool use the same checks before saving. “Evidence” means a linked commit, test
result, document, or other record that supports a work item's status.

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
