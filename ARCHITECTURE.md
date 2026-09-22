# InfiniDrip — Architecture guide

This is the short orientation guide for the current product. It explains what
the app does, where information flows, and which boundaries must not be
crossed. Historical slice narratives and older architecture snapshots are
preserved in [`docs/archive/ARCHITECTURE-HISTORY.md`](docs/archive/ARCHITECTURE-HISTORY.md).

## What the app is

InfiniDrip is a local-first, two-dimensional sewing-pattern design workspace.
A person chooses a garment, enters measurements, adjusts design intent, reviews
digital guidance, and exports pattern and technical files. The result is a
digital drafting aid, not a 3D drape simulator, physical fitting service,
production CAD system, or manufacturing validation system.

The app runs in a browser or Electron shell. The current product boundary does
not include login, profiles, a database, cloud sync, email, hosted monitoring,
or personal-data collection. Launch-backed services and code-signing
procurement remain deferred until the maintainer explicitly reopens launch
readiness and cost approval.

## The user journey

The workspace has five stages. A stage is a task and a review point, not merely
a page number.

| Stage | What the person does | What the app supplies |
| --- | --- | --- |
| Garment | Chooses a garment recipe | A descriptive library of the seven current recipes |
| Measure | Enters body and length measurements | Grouped controls and a schematic body view |
| Style | Chooses fit intent, material, options, appearance, and surface placement | Style controls, artwork placement, and a live assembled view |
| Check | Reviews warnings and digital construction checks | Actionable guidance tied to the relevant stage or field |
| Export | Chooses output settings and generates files | True-scale SVG, DXF, PDF, A0, projector, and tech-pack outputs |

The current first-load welcome is a compact introduction to these stages. It is
not yet a complete replayable tutorial or field-by-field walkthrough.

## The system map

The same owned design data moves through the product:

```text
measurements + choices
        ↓
declared garment recipe
        ↓
shared components and drafting blocks
        ↓
pattern pieces and construction relationships
        ↓
views · guidance · grading · nesting · surface placement
        ↓
SVG · DXF · PDF · A0 · projector · tech pack
```

### Recipes and shared geometry

Each garment declares its measurements, options, components, and construction
relationships through a `GarmentRecipe`. Shared drafting code assembles those
declarations into owned blocks and pattern pieces. Garment-specific behavior
belongs in the recipe or its focused drafting module; shared consumers should
not invent a second source of geometric truth.

The seven shipped recipes are Tee, Darted tee, Tank, Polo, Woven shirt, Skirt,
and Trouser. Future garment families have research records, but research alone
does not authorize implementation.

### Views and guidance

The app renders schematic pattern, body, style, and assembled views from the
current draft. Guidance describes invalid, implausible, or unresolved
combinations and routes the person to an actionable correction. Meaningful
garment aspects remain adjustable; the system must not hide an invalid
combination by silently clamping or rewriting the person’s input.

### Grading, nesting, and output identity

Grading derives a size run from the same recipe and geometry contracts. Nesting
places owned pieces under explicit constraints and retains deterministic output
identity. Export tests protect established byte-identity baselines; a baseline
must not move without an explicit documented reason and maintainer approval.

Epic 8 is not a second nesting engine. Its retained future scope is a bounded,
proof-only external-solver helper/adapter experiment. The candidate may propose
transforms, but InfiniDrip retains garment semantics, geometry validation,
export identity, and the unconditional `nestPieces` fallback. The proof-only
no-go exit does not admit a runtime solver, worker, UI mode, persistence path,
or export path.

## Local persistence and trust boundaries

Workspace data, including measurements and current design state, is saved and
loaded locally. The repository does not currently provide a user account,
remote workspace, multi-user permissions model, or cloud data path.

The repository-local operations surface is separate from the user workspace.
It records delivery work and evidence in versioned files for the maintainers;
it is not a hosted Control Center and must not be treated as a database for
user profiles or saved garments.

## Surface artwork: current boundary

The current surface layer stores an artwork placement with a name, kind, piece
role, numeric width/height and position, scale, rotation, stack order, and
optional source pixel dimensions. The `Artwork source` field is source text or
provenance text. It is not a file picker, URL fetcher, or image upload.

The current preview and output path render placement geometry/polygons. There is
no embedded bitmap artwork library, runtime remote asset fetch, or direct
drag-and-drop image workflow in the current architecture. Those are future
product work and require an explicit asset, provenance, format-safety, and
interaction contract before implementation.

## Operations and delivery evidence

The local Control Center lives under `ops/control-center/`. Its canonical
`data/board.json` is schema-validated and remains the sole current-state file.
Schema v2 adds a revision, current workflow labels, and a shared command layer
for CLI and browser-initiated edits. Commands validate the complete input and
result, reject stale revisions, acquire a short-lived local lock, and replace
the board through a flushed same-directory temporary file and atomic rename.
The evidence importer uses the same command path and still cannot infer missing
dates, owners, status, acceptance, or delivery.

The workflow is `Backlog → Ready → In Progress → Review → Done`, with
`Blocked` for unfinished work and maintainer-controlled archival/reopening.
Contributor, reviewer, and maintainer roles are local guidance rather than an
authorization boundary. Per-item history remains inside `board.json`; there is
no event store, hosted system, account, authentication, or remote collaboration
path. Legacy v1 history labels remain readable rather than being rewritten.

Slice 184 establishes the schema and shared persistence boundary. Slice 185
adds a localhost-only Node service and browser authoring through that boundary,
including item detail editing, workflow actions, evidence/notes/history,
search, filters and explicit save states. Static and evidence routes are
allowlisted; evidence resolution rejects paths outside the repository.
Slice 186 verified UI save/reload persistence on an isolated local board and
closed the v2 exit without changing application drafting or export behavior.

The provider-neutral web manifest and local delivery/readiness rehearsals under
`ops/web/` and `ops/readiness/` prove local behavior only. They do not create a
provider account, paid service, production deployment, or authenticated beta.

## Current status and controlled scope

- Epic 7 nesting intelligence is complete and reviewed.
- Epic 8 is complete as a proof-only/no-go bounded helper/adapter result.
- Epic 11 Polo V2 is complete through Slice 161.
- The no-cost Epic 12 interim is complete through Slice 181.
- Slice 182 records the rule to pause below 20% weekly usage remaining and
  resume only after explicit maintainer approval.
- No garment has completed physical cut, sew, or fit validation.
- The next garment queue requires a separately scheduled maintainer decision;
  it does not begin automatically.

## Where to read next

- [`README.md`](README.md) — newcomer-facing product overview and local setup.
- [`PROJECT-STATE.md`](PROJECT-STATE.md) — authoritative current engineering
  state, gates, and stopping points.
- [`docs/PROJECT-DECISIONS.md`](docs/PROJECT-DECISIONS.md) — confirmed
  maintainer decisions and deferred launch questions.
- [`docs/BUG-LEDGER.md`](docs/BUG-LEDGER.md) — durable UI/UX defect records.
- [`docs/planning/`](docs/planning/) — execution packets and roadmap context.
- [`docs/research/`](docs/research/) — construction, surface, platform, and
  open-source evidence.
- [`ops/control-center/README.md`](ops/control-center/README.md) — local board
  behavior and evidence rules.
- [`docs/archive/ARCHITECTURE-HISTORY.md`](docs/archive/ARCHITECTURE-HISTORY.md)
  — historical architecture and slice narrative; not current instructions.
