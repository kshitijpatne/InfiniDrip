# Patternworks — Architecture

How the app fits together, in plain language. Read the top to re-orient; skim the
layers when you need detail. Updated every slice with only need-to-know changes.

## The one big idea

Everything runs off **one object: `measurements`** (your body numbers, in cm).
Change a number and the whole picture is rebuilt from scratch — there's no hidden
state to fall out of sync, because every layer is just a *function* of those
numbers:

The UI is the only part that isn't a pure function: it catches your typing and
presses "rebuild." (The one deliberate exception is the freeform **Edit** view —
see the `edit/` layer below — which holds a hand-edited snapshot that is a manual
override, explicitly outside the parametric flow.)

## The layers

**geometry — the alphabet.**
A `Point` is `{x, y}` in centimetres (real cm, so it maps to real cloth).
`distance` is just Pythagoras. A curve is a *Bézier*: it runs start → end, and its
two control points are **magnets** that bend the line toward them without ever
touching it. `cubicLength` measures a curve by walking it in tiny steps and adding
them up — quietly the most important tool in the whole app.

**drafting — measurements become a pattern.**
A `Piece` is a closed outline of named `Edge`s (each one a straight line or a
curve). Drafting drops a few construction points (neck, shoulder, underarm, hem)
and connects them. Edges carry *names* ("armhole", "side") so other layers can ask
a piece "how long is your armhole?" The clever bit: the sleeve cap's height is
**solved** — a quick guess-and-check loop finds the height that makes the cap the
same length as the armhole. The garment-specific recipe also lives here: the
t-shirt drafting math, its **notch rules** (`tshirt-notches.ts`), its **fabric/ease
guidance** tables (`ease.ts`), its **grade table** (`tshirt-grade.ts`), and its
**POM list** (`tshirt-pom.ts`). Two pure engines also live in drafting: **grading**
(`grading.ts` — re-draft the block over a size run) and **POM measuring** (`pom.ts`
— read a measurement off the live geometry).

**render — pattern becomes a picture.**
Pure translation, no decisions. `pieceToPath` walks a piece's edges into one SVG
string (`M` move, `L` line, `C` curve, `Z` close). Everything is a **string**, not
live page elements — which is why it tests without a browser (you just search the
text). This layer also draws the seam-allowance cutting line, **notches and
grainlines** (`notch.ts`), the graded **nest** (`nest.ts` — overlaid size outlines
as tree rings), the **fabric nest** (`fabric.ts` — the shelf-packed pieces on a
bolt, for the estimator), and the **freeform editor** (`editor.ts` — the piece
outline plus its draggable handle dots). On screen, cm × a scale = pixels.

**export — the pattern leaves the screen.**
Screen drawing is for *looking*; export is for *making*, so it's its own layer with
one shared spine. `flattenPiece` turns each piece into two true-scale point loops —
the **sew line** and the **cut line** — and `layoutPieces` packs them side by side.
Thin format writers ride on top: `exportSvg`, `exportDxf` (CUT/SEW layers), and
`exportPdf` (tiled, print-at-home). The **nesting estimator** (`nesting.ts`) is a
sibling helper on this spine: a width-aware **shelf pack** onto a bolt with a true
(polygon-area, shoelace) utilization read-out. It leaves the cutting-file exports
untouched (rotating pieces there would misplace the SVG notches/grainlines, which
are re-derived from the original piece), and it carries no rotation — under a
grain-constrained bounding box, rotation is geometrically inert.

**guidance — the chef tasting the soup.**
Each check is one fact you could verify with a tape measure: "cap matches armhole,"
"shoulder shouldn't pass the side seam," "armhole not too shallow." The UI also
feeds in a **fabric ease note** here — advice, never an instruction the engine acts
on. Guidance grew up into the **production-readiness checker** (`check.ts` engine +
`tshirt-check.ts` recipe): the same tape-measure facts, rolled into one pass/fail
"can this be made?" verdict (matched seams, cap ease within a band, hem square to
the fold, notches/grain declared, the size run grows monotonically). The engine
primitives are garment-agnostic; which edges pair up and what the thresholds are is
recipe.

**style — declare a target, see the gap (prescriptive).**
A style is a **box of ranges** per measurement. You **pick a target fit** and the
panel reports the signed distance to it on every axis (e.g. "Ease +9 cm", "Length
−13 cm"), and confirms once you're inside every range. Selecting a target **writes
no measurement** — you close each gap yourself with the sliders.

**edit — freeform, on purpose outside the parametric flow.**
A pure engine for moving points on *any* piece. `pieceHandles` exposes a piece's
draggable **handles** — a **vertex** at each corner, plus two **control** magnets
per curve edge. `moveHandle(piece, handle, to)` returns a NEW piece with that
handle dragged, moving both edges that share a vertex so the outline stays closed.
`nearestHandle` is hit-testing; `editorViewBox` + `viewboxPointToCm` map the pointer
into cm. It's garment-agnostic and knows nothing about t-shirts. `moveHandle` is the
reusable primitive dart manipulation will later rotate around an apex.

**ui — the only impure layer.**
`mountApp` holds the `measurements`, builds the page once, then wires each input:
on change it makes a **new** measurements object and calls `draw()`, which rebuilds
canvas + guidance + style. A **View** toggle swaps the main canvas between
**Pattern**, the graded **Size run** (nest), the **Spec** sheet, the **Nesting**
estimate, the production-readiness **Check**, and the freeform **Edit** view. The
export buttons live here too. **Save/Load** (`persist.ts`) serialise measurements +
fabric to `localStorage` as versioned, validated JSON. The **Edit** view snapshots
the front into `editedFront`; three thin mouse handlers (down/move/up) turn a drag
into `moveHandle` calls, a **Reset** button re-drafts from measurements, and the
snapshot never feeds back into `measurements` — freeform is a manual override, so
the parametric core stays consistent everywhere else.

## Why it stays clean

- **Pure functions = cheap tests.** Most layers are "inputs → outputs," so a test
  is one line: feed known numbers, check the answer. That's why 100% coverage came
  easily and why the lower layers need no browser.
- **Strict TypeScript = free enforcement.** Unused code is a *compile error*, and
  the build fails if coverage ever drops below 95%.

## Where things live

  geometry/   points, distance, Bézier + curve length
  drafting/   measurements -> pieces; t-shirt recipe; notch rules; fabric/ease
              guidance; grading engine + grade table; POM measuring + POM list;
              dart engine (dart.ts) + fitted/darted recipe (fitted.ts)
  render/     pieces -> SVG string; seam allowance; notches + grainlines; graded
              nest; fabric nest; freeform editor; garment view; theme
  export/     pieces -> true-scale cutting files (SVG, DXF, tiled PDF); shared
              layout spine; nesting estimator (shelf pack + utilization)
  guidance/   tape-measure checks; production-readiness checker (engine + recipe)
  style/      style table; target-fit gap (prescriptive)
  edit/       freeform edit engine: handles, moveHandle, hit-test, viewbox/pointer
  ui/         the impure shell; sliders, fabric + style selectors, a Tee/Fitted
              garment toggle, the view toggle
              (Pattern/Size run/Spec/Nesting/Check/Edit), freeform drag handlers,
              save/load persistence

## A change, start to finish

You type Length = 80 → `applyChange` makes a new measurements object → `draw()`
re-drafts the pieces → the canvas redraws longer, guidance re-checks, the style
panel re-reads the gap, and — if you're in Size run / Spec / Nesting / Check view —
that view recomputes around the new numbers. One input, one rebuild, everything
stays consistent. (The Edit view is the deliberate exception: its snapshot is a
manual override and only a Reset re-syncs it to the measurements.)

## Engine vs. recipe (how new garments get added)

Two kinds of code live here. The **engine** doesn't care what garment it is —
geometry, the Piece/Edge model, the renderer, seam allowance, the notch engine
(`notch.ts`), the grading loop (`grading.ts`), the POM query helpers (`pom.ts`),
the nest renderers (`nest.ts`, `fabric.ts`), export + the nesting estimator, the
checker primitives (`check.ts`), the freeform edit engine (`edit/`), and the dart
engine (`dart.ts`). The
**recipe** is the garment-specific part — the drafting math, the guidance rules,
the style table, the notch rules (`tshirt-notches.ts`), the fabric/ease guidance
(`ease.ts`), the grade increments (`tshirt-grade.ts`), the POM list
(`tshirt-pom.ts`), the checker's edge-pairs + thresholds (`tshirt-check.ts`), and
the fitted/darted front (`fitted.ts`).

Adding a new garment = writing a new recipe that plugs into the same engine, not
building a new app. (One known engine spot still tee-shaped: the POM query type
`Pom.measure` takes a `TshirtBlock`; when garment #2 lands it becomes generic — a
small change, not a rewrite.)

## Where the roadmap plugs in (what's left, slices 19–20)

**Already built:** notches & grainlines; fabric/ease guidance; grading (tree-ring
nest); the POM spec sheet; the **nesting estimator** (`export/nesting.ts` +
`render/fabric.ts`); the **production-readiness checker** (`guidance/check.ts` +
`guidance/tshirt-check.ts`); the **freeform editor** (`edit/` engine +
`render/editor.ts` + an Edit view in `ui`); and the **fitted/darted recipe**
(`drafting/dart.ts` engine + `drafting/fitted.ts`), shown via a Tee/Fitted toggle in
the Pattern view.

  *Note on the editor's shape:* an earlier version of this map predicted the editor
  would be "a new impure surface, a sibling of `ui`." It landed lighter than that:
  the geometry is a **pure `edit/` engine**, and the interaction is just another
  **view inside the existing `ui` shell** (three mouse handlers), not a second
  mount. Same capability, less machinery — flagged here so the map matches reality.

- **Tech-pack document (15b).** The measured spec sheet is done; what's left is
  packaging: a flat sketch with callout leaders, a PDF doc writer on the export
  spine, and editable BOM/construction stubs. New writer on the export spine.
- **Fitted/darted recipe (19) — built.** The dart is baked into the outline as two
  named leg edges meeting at the apex, so the apex is a real vertex Slice 20 can
  rotate. Wired to the Pattern view only; grading/spec/nest/check/edit/export and the
  `Pom` `TshirtBlock` type stay tee-shaped until a later slice generalises them.
- **Dart manipulation (20).** Rotating a wedge around the apex — a pure engine
  *primitive* built on `moveHandle`, with "fit is conserved" as a free invariant —
  driven by the editor, operating on the darted recipe. That triple dependency
  (primitive + editor + darted garment) is why it comes last.
