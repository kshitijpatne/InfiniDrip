# InfiniDrip

InfiniDrip turns garment measurements and design choices into a two-dimensional
sewing-pattern draft that can be refined through the app's measurement and
style controls. It runs locally in a browser or desktop app and creates digital
files that can be reviewed, printed, or used in other design tools.

A sewing pattern is a set of shapes cut from fabric and joined to make a
garment. InfiniDrip helps prepare and inspect those shapes; it does not drape
cloth on a body or prove that a sewn garment will fit.

It is intended for both home sewists and DIY makers, and independent designers
and patternmakers who want a local workspace for drafting and inspecting digital
garment patterns.

## The five stages

1. **Garment** — choose one of the garment types currently in the app.
2. **Measure** — enter body and length measurements.
3. **Style** — choose how roomy or close-fitting the garment should be, fabric
   and its stretch, color, garment options, and where a design image would go.
   The current version records geometric placement but does not load an image.
4. **Check** — review digital warnings and correct issues that affect the
   draft or readiness. Some warnings block Export; others are advisory.
5. **Export** — choose settings and save the files you need.

An optional first-visit tour explains the controls. It can be skipped or
replayed and never changes design values or starts an export.

## What you can make

The app currently supports these seven garment types:

- Tee
- Darted tee
- Tank
- Polo
- Woven shirt
- Skirt
- Trouser

The same design feeds the app's views, guidance, Size run, Nesting, and
exported files. The Edit view is a temporary preview and does not change that
saved design. Depending on the garment, available outputs include:

- **SVG and DXF** — outline files made of lines and curves that stay crisp when
  zoomed or resized.
- **Tiled PDF** — a full-size pattern split across regular printer pages.
- **A0 PDF** — a full-size pattern on A0-size pages; A0 is a large standard
  paper size.
- **Projector file** — layered pattern lines designed to project at full size
  onto fabric.
- **Technical pack** — a reference with measurements, material information,
  and construction notes.
- **Size run** — compare the garment's supported sizes. **Nesting** estimates
  how its pieces may fit within a chosen fabric width.

“Full-size” means the pattern is intended to print at its measured dimensions;
printer scaling still needs to be set and checked. Digital checks and planning
views do not prove physical fit or factory readiness.

## Current limits

- The assembled view is a diagram, not a three-dimensional cloth simulation.
- The rules built into Guidance can find certain problems and point to
  corrections, but cannot replace cutting, sewing, or fitting a physical
  sample. No garment has yet been physically cut, sewn, and fit-tested.
- Artwork placements can attach local PNG, JPEG, WebP, or sanitized SVG files
  and preview them in the Style panel. Images stay on this device; the app does
  not fetch source URLs or place the image onto garment geometry. The curated
  artwork library is still future work.
- The **Edit** view is an exploratory preview of one pattern piece (the Trouser
  uses its left-front piece). Its changes do not update measurements, the
  assembled view, checks, other sizes, fabric layout, saved designs, or exports.
- **Nesting** is a planning estimate, not a guarantee of material savings or
  a finished cutting plan for factory production.

## Local use and saved work

The browser and desktop versions work locally. Saved designs, recovery data,
and tour progress are kept in separate on-device records. Imported image bytes
are stored separately from saved-design JSON: in the browser's site data or
the desktop app's local data folder. Clearing browser site data can remove
those local records and images. There is no account, user profile, hosted
database, or cloud sync.

Exporting in a browser uses its normal download flow. In the desktop app, a
local save dialog lets you choose where an export file is written. The current
workflow needs no paid hosting or online service.

## Run locally

Install [Node.js](https://nodejs.org/), then from the repository directory run:

```bash
npm install
npm run dev
```

Open the local address printed by the development server. To run the full test
suite with its coverage report:

```bash
npm run coverage
```

To run the desktop app during development, leave `npm run dev` running, open a
second terminal in the repository, and run:

```bash
npm run electron:dev
```

## Development boundary

The project is completing an approved nine-phase, local-only refinement of the
existing product before another garment type is scheduled. Research, planning,
and local tooling do not by themselves authorize a new garment. The next
garment queue requires completion of that sequence and explicit approval from
the maintainer—the person responsible for project scope and approvals.

## Read next

- [Architecture guide](ARCHITECTURE.md) — how the app turns choices into
  patterns, checks, and outputs.
- [Project state](PROJECT-STATE.md) — current work and verification status.
- [Project decisions](docs/PROJECT-DECISIONS.md) — approved scope and deferred
  decisions.
- [Pre-garment sequence](docs/planning/PRE-GARMENT-EXECUTION.md) — the ordered
  local development work before another garment family.
- [Control Center guide](ops/control-center/README.md) — the separate local
  project-delivery board.
