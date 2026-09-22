# InfiniDrip

InfiniDrip is a local-first 2D sewing-pattern design workspace. It turns body
measurements and design choices into editable digital pattern pieces, checks,
and true-scale outputs. It is not a 3D drape simulator, a physical fitting
service, production CAD, or a hosted account application.

## The five-stage journey

1. **Garment** — choose the kind of garment to draft.
2. **Measure** — enter the body and length measurements that shape the draft.
3. **Style** — choose fit intent, material, appearance, options, and surface
   artwork placement.
4. **Check** — review digital guidance and correct warnings before export.
5. **Export** — produce the selected true-scale pattern and technical outputs.

The stages are a guided workspace, not a claim that a digital pattern has been
physically cut, sewn, or fit-tested.

## What it currently does

Seven garment recipes use the shared drafting system:

- Tee
- Darted tee
- Tank
- Polo
- Woven shirt
- Skirt
- Trouser

Across those recipes, the workspace provides:

- measurement-driven digital drafting and schematic front, back, side, and
  assembled views;
- plain-language guidance for invalid or implausible combinations, with
  actionable corrections and no silent clamping;
- target-fit styles, grading, points-of-measure/specification output, and
  deterministic nesting;
- surface artwork placement with numeric geometry and a true-scale placement
  preview. The current surface layer stores placement geometry and source text;
  it is not yet an image-upload or bitmap artwork library;
- local save/load for the workspace;
- SVG, DXF, tiled PDF, A0, projector, and tech-pack outputs;
- digital construction checks. These checks do not prove physical fit,
  sewability in fabric, manufacturing readiness, or production readiness.

## How it works

The user’s measurements and choices feed a declared garment recipe. The recipe
is assembled from shared components and blocks, then the same owned geometry is
used by the views, guidance, grading, nesting, surface layer, and exporters.
This keeps garment-specific rules in recipes while shared behavior stays in the
engine.

## Local-first boundary

The browser and Electron app work locally. The current workflow does not
require login, profiles, a database, cloud sync, email, hosted monitoring, paid
operational services, or personal-data collection. Those launch-backed items,
along with code-signing procurement, remain deferred until launch readiness and
cost approval are explicitly reopened.

A repository-local Control Center records delivery evidence for the project. It
is an operations dashboard, not a hosted user workspace or a user-profile
database.

## Run it

```bash
npm install      # one time
npm run dev      # open the local URL it prints
npm run coverage # run the test suite with a coverage report
```

Requires Node.js. No other setup is required for local development.

## Development status

InfiniDrip is developed in numbered slices. Epic 6 surface design and Epics 7,
9, and 10 are complete. Epic 11 Polo V2 implementation is complete through
Slice 161. The no-cost local/preview interim of Epic 12 is complete through
Slice 181; Slice 182 records the weekly usage-limit pause rule.

The next garment queue does not start automatically. The existing garment UI,
first-load tutorial, local delivery board, artwork workflow, repository cleanup,
and documentation are being refined before another garment family is scheduled.
No garment has completed physical cut, sew, or fit validation.

## Read next

- [Architecture guide](ARCHITECTURE.md) — how the product fits together.
- [Project state](PROJECT-STATE.md) — current engineering status and gates.
- [Project decisions](docs/PROJECT-DECISIONS.md) — maintainer-confirmed scope
  and boundaries.
- [Planning documents](docs/planning/) — execution packets and roadmap
  context.
- [Research records](docs/research/) — evidence behind garment, surface, and
  platform decisions.

## Tech

TypeScript · SVG · Vite · Vitest
