# InfiniDrip — Slices Chat Brief

We are building "InfiniDrip" (package name: patternworks), a lightweight, local
2D sewing-pattern designer in TypeScript (SVG, Vite, Vitest). It drafts a real
t-shirt pattern from body measurements, with live render, guidance, a prescriptive
**target-fit** style selector, fabric-aware ease guidance, an assembled garment
view, an annotated **2D body view**, seam allowances, notches + grainlines,
save/load, **parametric grading (a tree-ring size-run nest)**, an **auto-measured
POM spec sheet**, a **fabric-nesting estimator**, a plain-English
**production-readiness checker**, **freeform piece editing**, a second
**fitted/darted garment** (a bust-darted front), **dart manipulation** (pivot a
dart about its apex + true the seam it leaves), a three-page **tech-pack document**
(flat sketch + callout leaders + graded POM table + BOM/construction with
**per-row tolerances**), **per-edge seam allowance** (recipe-owned), a **graded
marker** (the whole size run nested on one bolt), **measurement-slider ↔ body-view
linking**, and true-scale SVG + DXF + tiled PDF export **at any graded size**. Repo:
github.com/kshitijpatne/InfiniDrip (push after each slice).

As of Slice 44 the engine is fully garment-general — tee, fitted, and a
structurally different **skirt** all run through one recipe (Slices 35–43) —
plus a **real-world export system** (projector SVG / A0 PDF with a verified
calibration square) and a **guided 5-step journey** to a valid export (the
Fable epic, F1+F2). **The project has since moved to a strategic MVP plan —
see MVP-PLAN.md and ROADMAP.md in project knowledge; they are now the
governing planning documents.** The SCOPE & ROADMAP section below, and the
per-slice history that follows it, are kept for context on how we got here,
not as the live plan.

HOW WE WORK — read PROJECT-STATE.md and ARCHITECTURE.md first; they hold the
current status, the codebase map, and the confirmed roadmap. Build proceeds in
small numbered "slices."

For any coding slice:
- Verify all code in your own environment first (typecheck + full coverage).
- Deliver a Claude Code prompt the user pastes into VS Code. New files in full;
  existing files as surgical find-and-replace patches to save tokens.
- Open every prompt with a VERBATIM instruction: write/patch exactly, do NOT
  rewrite or "improve," and confirm the exact expected test count + 100% coverage.
- If Claude Code reports it "fixed failing tests," that's a RED FLAG — the shipped
  code and tests already agree; have it re-copy the verbatim file, never edit
  assertions.
- The commit gate is BOTH `npm run coverage` (expected test count + 100%) AND
  `npm run dev` (the feature visibly on screen). Then commit + push.
  (For a pure REFACTOR slice the gate inverts: the pass condition is that nothing
  on screen changes. Prove it with output hashes against the previous commit —
  see Slice 25.)
- A very wide slice may be delivered as TWO back-to-back prompts (A = source,
  B = tests) to stay under the token ceiling. The tree won't compile between them;
  that's expected. Gate once, after both are applied.
- Docs (PROJECT-STATE.md, ARCHITECTURE.md) are committed in the SAME commit as the
  code they describe; small additive edits ride in the Claude Code prompt as
  find-and-replace hunks. SLICES-BRIEF.md is project-knowledge only (not tracked in
  the repo), so it is ALWAYS delivered as a full whole-file drop to paste in.
  PROJECT-STATE.md / ARCHITECTURE.md / MARKETPLACE-GOALS.md are also delivered as
  full whole-file drops when refreshing the project-knowledge copies — never as
  hunks, because project-knowledge files can't be edited in place.

CODE STANDARDS — lightweight, very readable, every construct purposeful, reusable;
strict TypeScript; 100% test coverage maintained (build fails below 95%). Pure
functions everywhere except the thin UI layer.
- Do NOT gate with `npm run build` — `tsc` emits `.js` next to the sources and
  Vitest then double-counts every test. Gate with `tsc --noEmit` + `npx vitest run
  --coverage`.
- Never clean a working tree with `git clean -fd src` mid-slice: it deletes new,
  untracked source files.

EXPLANATIONS — keep them simple, direct, and scannable; the user's attention
trails off with walls of text, so use intuitive language and metaphors. After a
strategy is set, get progressively brief. Acknowledge errors explicitly when
caught. Deliverables must be copy-paste-ready.

WORKING STANCE — the user values pushback and re-verification over speed; there is
no rush to ship. Flag design tension explicitly before building, verify against the
real repo rather than memory, and don't let the app's core philosophy (lightweight,
accurate, scalable, clean engine/recipe split) drift. Never reverse a shipped
decision silently. If a pasted brief or doc looks stale, verify against the repo
before building — the code on origin/main is ground truth, not the chat context.
A doc or code comment that CLAIMS an architecture we don't have is a bug; fix the
claim as readily as the code (see Slice 25).

SCOPE & ROADMAP (superseded — kept for history; see MVP-PLAN.md for the live
plan) — the t-shirt shipped end-to-end, the engine carries a second darted
garment AND a structurally different skirt (the engine/recipe thesis fully
proven, Slices 35–43), exports any graded size plus real-world projector/A0
files, and ships a guided 5-step journey (Fable F1+F2). Dependency spine
(✓ = done, all done): notches ✓ → ease ✓ → grading ✓ → tech pack ✓ → nesting ✓
→ checker ✓ → editor ✓ → fitted recipe ✓ → darts ✓ → body view ✓ → Block
generalization ✓ → skirt bridge ✓ (recipe-owned checks/guidance/Measurements/
styles/figures) → real-world export ✓ → guided journey ✓ → demo artifact ✓
(Slice 44). **Forward plan: MVP-PLAN.md** (operative, 6-month/~117-slice
execution) **and ROADMAP.md** (competitor analysis + full long-term scope +
the explicit cut list).

  ✓ 9.  Export layer — true-scale SVG + DXF (done)
        [post-22 bugfix: SVG tags were entity-escaped since this slice; see note below]
  ✓ 10. Tiled PDF export — page-split + overlap + registration marks (done)
  ✓ 11. Save/Load — versioned JSON in localStorage, validated, status feedback (done)
  ✓ 12. Notches & grainlines — derived as rules on the pieces, not saved points (done)
  ✓ 13. Ease/fabric **guidance** + **prescriptive** target-fit style (done — NOT the
        pre-draft transform first planned; see note below)
  ✓ 14. Grading / size runs — re-draft over a size table → a tree-ring nest, with a
        Pattern / Size run view toggle (done; carries notches free)
  ✓ 15. Tech pack, part 1 — auto-measured POM spec sheet across the size run, in a
        Spec view (done; the sketch + PDF doc + BOM shipped later as Slice 23)
  ✓ 16. Nesting / fabric estimator — width-aware shelf pack on a bolt + true
        (polygon-area) utilization, in a Nesting view (done; a helper, not a marker)
  ✓ 17. Production-readiness checker — guidance grown into one pass/fail verdict,
        in a Check view (done; five checks, seven rows)
  ✓ 18. Freeform edit mode — drag a piece's vertices + curve controls, in an Edit
        view (done; a manual override, Reset re-drafts; the gate for darts)
  ✓ 19. Fitted/darted recipe — first non-tee garment: a bust-darted front, tee back
        + sleeve reused; a Tee/Fitted toggle in the Pattern view (done)
  ✓ 20. Garment generalization — a `GarmentRecipe` registry drives EVERY view; the
        engine no longer names a t-shirt. Fixed the Slice 19 side-seam bug, added
        the dart-leg check (done — this is where the plan's old "20" slid to 21)
  ✓ 21. Dart manipulation + truing — pivot a dart about its apex onto another seam,
        then blend the kink it leaves behind; driven from the Edit view (done)
  ✓ 22. Per-size export — a size picker drafts the chosen graded size (via
        `draftAtSize`) and emits `<garment>-<SIZE>.<ext>`; exports only (done)
  ✓ 23a. Tech-pack document — a 3-page PDF on the export spine: real-piece flat
        sketch (sample size) + graded POM table + recipe BOM/construction stubs;
        a Tech Pack button, decoupled from the per-size picker (done)
  ✓ 23b. Tech-pack callouts — an optional `Pom.anchor` drives callout leaders from a
        left gutter to the anchored POMs on the sketch (tee 5, fitted 3) (done)
  ✓ 24. Body view — an annotated upper-body figure drawn from the measurements; each
        raw input is a dimension line on the body, girths marked "(circ)" (done;
        measurement-layer only, touches none of the drafting engine)
  ✓ 25. Block generalization — `Block` became a role-keyed piece collection; the
        engine stopped assuming a fixed {front, back, sleeve} triple (done; pure
        refactor, 18 outputs proven byte-identical).
  ✓ 26. Seam allowance done right — per-edge, recipe-owned, and TWO real bugs fixed
        (corner offset was 0.707cm not 1cm; the fold overhang added 4cm of chest).
  ✓ 27. POM tolerances — each POM carries an optional ±; a "Tol" column in the Spec
        view and the tech-pack PDF.
  ✓ 28. Graded marker — the whole size run nested on one bolt; a Single/Marker
        toggle on the Nesting view.
  ✓ 29. Slider ↔ body-view linking — hover/focus a measurement row, its dimension
        lights on the body figure (pure UI).
  ✓ 30. Hover highlights the outline too — the same hover also lifts the outline
        segments that measurement shapes; the silhouette dims behind them (pure UI).
  ✓ 31. Plausibility & proportional-coherence checks — two pure guidance families
        that WARN, never clamp; chest 160 now warns instead of drafting silently.
  ✓ 32. Verdict & honest surfacing — a top-line guidance verdict, amber outlines on
        implausible fields, and the check/style green signals withheld while inputs
        are implausible; the falsely-validated screenshot is dead (pure UI).

  HISTORICAL NOTE (kept for context — all resolved): after Slice 25 the
  proposed 26–29 bridge to a skirt was deferred in favour of finishing the tee
  first (allowance, tolerances, marker). The UX pressure-test pass (30–34,
  D→A→C→B→E) then ran to completion, unblocking Fable's F2. The skirt bridge
  that followed ran 35→43 and is COMPLETE: recipe-owned checks (35), recipe-
  owned guidance (36), per-garment Measurements (37), the skirt recipe (38),
  recipe-owned styles (39), both skirt figures (40), guidance garment-
  awareness (41), hipDepth as a real field (42), the skirt body croquis
  rebuilt (43). Zero tee-shaped spots remain. Slice 44 captured the demo
  artifact.

  **Forward plan is now MVP-PLAN.md, not a continuation of this list** — see
  that document for Months 1–6. Photo→pattern and the upcycle planner, once
  "Later" items here, are explicitly CUT from v1 in ROADMAP.md §1.5:
  photo→pattern is an active academic research frontier, not a buildable
  feature on this timeline; a cheaper honest substitute (a guidance-based
  measuring assistant + an upcycle helper that re-skins the existing nesting
  engine) is MVP-PLAN.md Priority 4, post-launch.

  SLICES 33–44 ARE NOT DETAILED IN THE PROSE BELOW — this file's per-slice
  narrative drifted after Slice 32 and was not backfilled, to avoid
  permanently maintaining two copies of the same history. **PROJECT-STATE.md
  is the current, detailed record through Slice 44** (project knowledge).
  Headline of what's missing here: Opus Phase A completed (33 message-quality
  pass, 34 body/finished facets); the skirt bridge shipped complete (35–43);
  the Fable epic merged (F1 real-world exports, F2 guided journey, 493→530
  tests); Slice 44 captured the demo artifact and closed out RESUME-LOG.md's
  readiness threshold at 5 of 5.

SLICE 9 — SVG EXPORT WAS ENTITY-ESCAPED (post-22 bugfix, committed as "Slice 22-b").
From Slice 9 on, `export/svg.ts` authored every SVG tag as HTML entities
(`&lt;`/`&gt;`), so exported `.svg` files opened as plain text in a browser ("Start
tag expected, '<' not found") instead of drawing. DXF and PDF were unaffected. It
hid for 13 slices because the tests asserted the *escaped* output (`startsWith
"&lt;svg"`), and earlier byte-diff validation only proved consistency, not validity.
Fix: un-escaped the 11 lines; replaced the tautological assertions with real markup
checks plus one **DOMParser parse test** (jsdom via the repo's `// @vitest-environment
jsdom` docblock idiom) that asserts no `parsererror`, an `<svg>` root, 6 polygons +
3 labels. 327 → **328 tests**, 100% held. Lesson: a passing test that mirrors the
output proves nothing about validity — for a file format, the gate is a real parse.
(Applied since: PDFs are parse-checked with `pypdf`, SVG with `xml.dom.minidom` /
DOMParser, before any prompt ships.)

SLICE 13 — WHAT CHANGED FROM THE ORIGINAL PLAN. Ease was going to be an auto-applied
pre-draft transform on `measurements`. It is NOT. Two things shipped instead:
- **Fabric/ease is guidance only.** `drafting/ease.ts` *suggests* an ease value from
  the fabric's stretch % and the UI shows a plain-English note; the user owns the
  ease slider and dials it in by hand. The engine never writes ease.
- **The style suggester is prescriptive.** You pick a target fit; the panel shows the
  signed gap to it on every axis and confirms when you're there. Selecting a target
  changes no measurement.

SLICE 15 — SPLIT INTO TWO PASSES. The *measured heart* shipped first: a POM spec
sheet where each point of measure is a live geometry query on named edges, run
across the graded sizes so the table fills itself. The tech-pack *document* (flat
sketch + callout leaders, PDF doc writer, BOM/construction stubs) was the deferred
second pass — shipped as Slice 23a/23b.

SLICE 16 — ROTATION IS INERT, SO IT WASN'T BUILT. Under a grain-constrained bounding
box, 0°/180°/mirror give the identical box and 90° tips the grain — rotation can't
tighten this nest (real savings need no-fit-polygon nesting, out of scope). So
nesting shipped as an honest width-aware **shelf pack** (a sibling helper) that
leaves the cutting-file exports untouched; utilization uses true polygon area, not
the bounding box.

SLICE 17 — SCOPED TO WHAT A TEE CAN PROVE. Five real checks (seven rows). **Dart
legs** and **smooth transitions** were left out (the tee has no dart; smooth
transition is a fuzzy fit call), and right-angle-at-fold was scoped to the **hem**,
not the neckline (which meets the fold on a vertical tangent by design — don't
retro-flag intended geometry). The dart-leg check arrived later with the fitted
recipe (Slice 20).

SLICE 18 — FREEFORM VS. THE PARAMETRIC CORE. Freeform editing is the first geometry
NOT derived from `measurements`, so it's quarantined: the Edit view snapshots the
**front**, edits are a manual override held only in editor state, they don't feed
back into measurements, and **Reset** re-drafts. It landed lighter than the old
"sibling of ui" prediction — a pure `edit/` engine + an Edit view inside the
existing shell (three mouse handlers), no second mount. The reusable payload is a
pure `moveHandle(piece, handle, to)` — the machinery darts rotate around an apex.

SLICE 19 — FIRST NON-TEE GARMENT; DART REPRESENTATION. The fitted recipe reuses the
tee's back and sleeve untouched and swaps in a darted front — proof that a new
garment in the SAME family is a new *recipe*, not a new app. The bust dart is
modelled as two named leg edges in the outline meeting at the apex (the correct
*open* flat-pattern drawing), so it renders for free and the apex is a real vertex
`moveHandle` can grab. Scoped to the Pattern view via a Tee/Fitted toggle.

SLICE 20 — GENERALIZATION, AND A SLICE 19 CORRECTION. Shipping the fitted front
exposed a real bug: its side seam was one dart intake (4 cm) SHORTER than the
back's, because closing the dart shortens the seam its mouth opens on. The draft now
runs that seam longer by the intake, so front and back match once the dart is sewn
(46.00 vs 46.00 cm) — leaving an untrued, side-slanted front hem, which is correct
for an open flat pattern. A `GarmentRecipe` registry now drives EVERY view (pattern,
grade, spec, nest, check, edit, export); the checker runs on ANY garment (that's how
the seam bug surfaced), and it gained a **dart-leg** check. `render/canvas.ts` and
`export/svg.ts` stopped importing the tee's notch table (a layering violation) — they
take notches as a parameter. NOTE: this slice is why the plan's original "20 = dart
manipulation" slid to Slice 21.

SLICE 21 — WHAT "TRUING" ACTUALLY MEANT. Earlier notes said truing would *level the
front hem*. The geometry showed that was imprecise. The dart's mouth sits on the side
seam, so pivoting the dart away heals that seam but leaves a **kink of exactly the
dart angle** (18.361° on the standard block). Truing is blending that kink straight,
which costs ~4 mm of seam length. Dart tools (`transferDart`, `trueSeam`) live in the
**Edit view** (the quarantined override sandbox), NOT in the recipe: a transferred
dart changes the piece's orientation relative to the fold, which would silently
invalidate the flat-span POMs in the Spec sheet. Keeping it in the editor avoids
claiming a spec we haven't earned. The conservation law is real and tested: every
seam length survives the pivot; apex + wedge angle unchanged; legs stay equal.

SLICE 22 — PER-SIZE EXPORT. `drafting/grading.ts` exposes `draftAtSize` (one garment
drafted at one grade step), which `gradeRun` now uses internally — so the size
picker, the Spec sheet, and the Size-run nest all agree on what a size is. The export
buttons draft the picked size and name the file `<garment>-<SIZE>`. Boundary: it
exports ONE size's pieces per download, not a graded *marker* (all sizes on one
bolt). The picker is export-local and built at mount from the base garment; a future
garment with its own size run would want it rebuilt on garment switch (noted, not
needed yet).

SLICE 23 — THE TECH-PACK DOCUMENT (SPLIT a/b). The doc rides the SAME PDF spine as
the tiled export (`assemblePdf`/`pt` were exported from `pdf.ts`; the tiled writer is
untouched) and composes three pages: real-piece flat sketch (base size) → graded POM
table (all sizes) → BOM + construction. Four decisions worth remembering:
- **"Editable BOM" became edit-as-DATA, not a live in-app editor.** A live editor
  would mean persisting arbitrary user text — a category the app has never held
  (save/load is measurements + fabric, bounds-validated). BOM/construction live on
  the `GarmentRecipe` (`techPack: { bom, construction }`). This narrowed the old
  roadmap word "editable" — flagged and confirmed, not done silently.
- **The sketch draws the REAL drafted pieces**, not the schematic silhouette from
  `render/garment.ts`, so every callout leader points at the exact geometry the POM
  measured.
- **Callouts are opt-in per POM** via an optional `Pom.anchor?: (block) => Point`
  (23b). Anchored POMs get a leader; the rest are table-only. Front-only for now.
- **NOT wired to the Slice 22 size picker.** A tech pack is a whole-style document
  (sketch at base size, table across the run); the picker stays scoped to cutting
  files.
`pdfString` escapes `\ ( )` and folds en/em dashes + × to ASCII — POM labels like
"Body length (HPS–hem)" would otherwise break a PDF `(...)Tj` literal.

SLICE 24 — THE BODY VIEW IS HONEST, NOT ANATOMICAL. `render/body.ts` is a sibling of
`render/garment.ts`: measurements in, one SVG out, touching NONE of the drafting
engine. It's an **upper-body** schematic, because the measurement set has no waist
and no hip. The honesty rules are the feature:
- The figure only bends where there's a number — the torso sides run **straight**,
  because no waist is measured.
- Girth inputs are labelled **"(circ)"** (Chest 100 (circ), Bicep 38 (circ)); the
  drawn span is a body width, not the circumference.
- The head/neck is a faint fixed-proportion placeholder for orientation only.
Only the six RAW inputs are annotated; derived/POM values stay in the Spec view.
Note: chest does not drive the viewBox width (the arms do) — a "wider chest ⇒ wider
viewBox" test was written, found to prove nothing, and deleted rather than shipped.

SLICE 25 — BLOCK GENERALIZATION; AND TWO FALSE CLAIMS FIXED. `Block` went from a
fixed `{front, back, sleeve}` triple to `{ roles: Record<string, Piece> }` with
`block()`, `blockPieces(b)` (engine: iterate whatever exists) and `rolePiece(b,
role)` (recipe: ask by name; **throws** if absent — `noUncheckedIndexedAccess` is
off, so a bare index would hand back `undefined` and fail later). Three things worth
remembering:
- **Role ≠ piece name.** The fitted garment fills the "front" ROLE with a piece
  NAMED "fitted front" (the name is its label in the notch table and on the canvas).
  A name-keyed lookup — the obvious design — would have silently broken the fitted
  garment.
- **`tsc` found a site grep missed.** `render/nest.ts` indexed the block dynamically
  (`g.block[type]` off a hardcoded `PIECE_TYPES`), so it never appeared in a
  `.front` search. Size-run columns now derive from the roles present in the run.
- **Refactor proof:** 18 outputs (SVG/DXF/PDF/tech-pack/nest/blueprint/check/
  guidance × tee + fitted, plus garment + body views) hashed **byte-identical** to
  the previous commit. That — not "the tests pass" — is what proves a refactor.
Two claims that were FALSE were corrected in the same slice: `garment-check.ts` said
"Nothing here names a t-shirt" while hard-coding sleeves, and ARCHITECTURE.md still
said `Pom.measure` takes a `TshirtBlock` "when garment #2 lands" (it landed at 21).

**THE BIG FINDING (Slice 25 planning) — `Block` was never the real blocker.**
`Measurements` is. It is `chest, shoulderWidth, bicep, length, armholeDepth,
sleeveLength, ease` — **no waist, no hip** — so a skirt cannot be drafted from it no
matter what shape `Block` is, and it is load-bearing in six places (controls FIELDS,
persist M_KEYS/BOUNDS, the style table, guidance, garment view, body view). The
per-garment-`Measurements` slice (part of the deferred skirt bridge) carries a real
design tension to decide deliberately:
a generic bag (`Record<string, number>`) buys flexibility but **loses the
compile-time safety** the "strict TypeScript" standard depends on (`m.chest` is
checked today; `m["chest"]` wouldn't be); generics (`GarmentRecipe<M>`) keep it but
get messy where the UI swaps garments.

AFTER SLICE 25 WE CHOSE TO FINISH THE TEE, NOT START THE SKIRT. The proposed 26–29
bridge (checks → guidance → Measurements → skirt) was deferred in favour of closing
the tee's real production gaps first. Slices 26–29 below are that work.

SLICE 26 — SEAM ALLOWANCE, DONE RIGHT (TWO REAL BUGS). Per-edge allowance is now an
`AllowanceSpec { default, byEdge }` on the recipe; the two hardcoded constants
(`ALLOWANCE` in app.ts, `SEAM_ALLOWANCE` in canvas.ts) are gone. Building it exposed
two bugs that had shipped since the export layer existed:
- **The corner offset was wrong.** It slid each corner along the bisector by `d`, so
  a 1 cm allowance came out **0.707 cm** (= d·cos45°) at a right angle. The fix is an
  exact 2×2 solve — the corner must sit `dIn` from one edge AND `dOut` from the other
  — which also makes per-edge (unequal allowances) fall out for free.
- **The cut line crossed the FOLD.** Nothing zeroed a fold edge, so the half-front's
  cutting line ran 1 cm past centre-front — **+4 cm of chest** on every exported tee.
  Fold edges (`centerFront`, `centerBack`) now take zero allowance.
Both hid behind tests that asserted the outline "got bigger", never *by how much* —
the exact SVG-bug lesson again. New tests measure perpendicular distance from the
cutting line back to each sewing edge. Tee spec: hem 2, neckline 0.6, folds 0, else 1.
NOT fixed (flagged, deferred): the neckline still overhangs the fold ~0.95 cm near
the neck (it meets the fold on a vertical tangent); dart legs keep the 1 cm default.

SLICE 27 — POM TOLERANCES. Each POM gained an optional `tolerance?` (cm, ±). It's a
property of the POINT OF MEASURE, not the size — the same ±1.3 at XS and XL — so it's
one "Tol" column, not a per-cell value. Rendered in the Spec view (`±`) and the
tech-pack PDF (`+/-`, because `pdfString` maps non-ASCII to `?`). POMs without one
show a dash. Values are conventional apparel defaults (girths ±1.3, widths/armholes
±0.6, lengths ±1.0–1.3, details ±0.3, dart intake ±0.5) — honest scaffolding like the
BOM, recipe-owned and trivial to change; not sourced from a real program.

SLICE 28 — GRADED MARKER. `gradedMarker(recipe, m, width)` nests the WHOLE size run
on one bolt. It's the SAME estimator (`nestPieces`) fed a bigger pile; the only new
work is `markerPieces`, which relabels each flat piece "<SIZE> <piece>" so 15 shapes
aren't all "FRONT". The Nesting view gained a Single/Marker toggle (no new view). The
tee marker (15 pieces, 285 cm, 58% used) packs *tighter* than a single garment (3
pieces, 76 cm, 44%) — more pieces fill shelf gaps, which is exactly why factories cut
markers. Still an estimator (bbox shelf pack, no interlock). It's a VIEW, not an
export file — a marker DXF would ride the export buttons and was left as a follow-up.

SLICE 29 — SLIDER ↔ BODY-VIEW LINKING (PURE UI). Each body dimension is wrapped in
`<g data-dim="<field>">`; each measurement row carries `data-dim-row="<field>"`.
Hovering or focusing a row spotlights that dimension and fades the rest. The tricky
part: the body SVG is re-rendered on every slider change, so the highlight is stored
in `activeDim` and re-applied at the end of `draw()` (a test proves it survives a
redraw). Six raw inputs map to six dimensions; `ease` has none — it isn't a body
measurement. One-directional (row → figure); figure → slider is a deferred mirror.
Touches no engine code.

SLICE 30 — HOVER HIGHLIGHTS THE OUTLINE TOO (PURE UI). Slice 29 lit the dimension
line; this lights the SHAPE. `renderBody` now emits a second tagged map,
`<g data-edge="<field>">`, holding the outline segments that measurement positions:
shoulderWidth→the shoulder slopes, armholeDepth→the underarm diagonals, chest→the
side seams, length→the hem, sleeveLength→the arm outer edges, bicep→the cuffs.
Ownership is non-overlapping, so a hover has one unambiguous answer.

Two decisions worth remembering:
- OVERLAY, not decompose. The silhouette is two filled paths (torso + two arms);
  you can't fade one edge of a single `<path>`. Rather than rebuild it as many
  sub-paths (losing the continuous fill and linejoin), the tagged segments are
  drawn ON TOP in the silhouette's own colour and weight — invisible at rest,
  liftable on hover. Verified externally: every overlay endpoint lands on a real
  silhouette vertex, so it coincides exactly and never reads as a doubled line.
- The silhouette group is tagged `data-edge="figure"` — deliberately never a
  measurement name, so it always falls to the dimmed state and the UI needs NO
  special case. That let one `spotlight(field)` helper replace the two duplicated
  highlight blocks in app.ts; it selects `[data-dim], [data-edge]` and reads
  `dataset.dim ?? dataset.edge`.
Still row → figure only; figure → slider remains the deferred mirror.

SLICE 31 — PLAUSIBILITY & PROPORTIONAL-COHERENCE CHECKS (guidance, warn-only).
Geometry (`garment-check.ts`) proves a pattern SEWS; it says nothing about whether
the numbers are real. A 160 cm chest sews fine, so the app drafted it silently and
still read "production-ready ✓". `guidance/plausibility.ts` adds the two missing
tiers, both pure, both WARN and never clamp:
- `plausibilityChecks` + `MEASUREMENT_BOUNDS` — each raw measurement against an
  absolute plausible adult range.
- `coherenceChecks` + `RATIO_BOUNDS` — chest↔shoulder, chest↔length, bicep↔chest,
  so a set that passes every individual bound but is internally impossible (narrow
  shoulder on a huge chest) is still caught.
`guide()` folds both in after the geometric notes. chest 160 now raises four
warnings (one bound + three coherence).

THE PLAN CORRECTION (record it — scope has been wrong before): the roadmap said to
read bounds "off the size chart grading already uses". THERE IS NO SUCH CHART.
Grading is RELATIVE — `TSHIRT_GRADE` deltas around the user's OWN base — so 160 just
shifts the whole run up, it never falls off anything. Bounds are therefore DECLARED
in `plausibility.ts`, seeded from published adult ranges and centred on STANDARD_M
(~50% of each range), deliberately loose: catch the absurd, not the unusual. `ease`
is left to `easeRange` (no double-warn). Warn Notes already flow to the guidance
panel via `guidanceMarkup`, so this shows on screen with no UI change — the top-line
verdict / green-signal fix is Slice 32.

SLICE 32 — VERDICT & HONEST SURFACING (UI, the sanity tiers made visible). Slice 31
made the checks; a set could still LOOK validated because geometry passed. One pure
gate, `measurementsPlausible(m)` (no out-of-range field via `implausibleFields`, no
bad ratio), now drives three surfaces:
- guidance panel gains a top-line verdict ("⚠ N to review" / "✓ Looks production-
  ready"), derived from the notes;
- every out-of-range input gets an amber outline (same `outline` convention as the
  fabric swatches; applied imperatively since controls aren't re-rendered per draw);
- the check view's "Ready to cut" banner and the style panel's "you're making a X ✓"
  WITHHOLD green while the gate is false.
`plausibilityChecks` was refactored to build on `implausibleFields` (one source of
truth for "which fields are out of bounds"). Result: chest 160 sews (`report.ok`
true) yet the banner reads "⚠ Sews together, but check the flagged measurements" —
the falsely-validated screenshot is dead. 429 tests.

Note for the Fable seam: `implausibleFields` and `measurementsPlausible` are exposed
pure functions returning plain data — exactly the Phase-A contract Fable's F2 renders
(it never recomputes). Slices 33 (severity data) and 34 (body/finished data) complete
that contract.

HONEST BOUNDARIES (do not overclaim, in code comments or UI):
- Assembled view is a schematic, not a drape sim. DXF is minimal R12 (cm; may need
  a confirm on import). PDF is minimal ASCII PDF-1.4 (opens anywhere). SVG now emits
  real markup and opens in a browser (parse-tested). Photo features estimate
  proportions — "get close, refine."
- Ease: guidance only — the app suggests a value from stretch %, the user owns and
  dials the ease number; never auto-applied. A heuristic, not drape physics.
- Style: prescriptive — declare a target, see the gap; it changes no measurement.
  **Recipe-owned since Slice 39**: tee/fitted share `TEE_STYLES` (nine
  definitions); the skirt has its own `SKIRT_STYLES` (Mini/Knee/Midi/Maxi ×
  Fitted/Relaxed). No longer tee-only.
- Notches: one documented convention (no universal standard); DXF caveat applies.
- Save/Load: measurements + fabric to localStorage, versioned + bounds-validated.
- Grading: proportional re-draft around the user's measurements as base size, not
  editable grade-rule node-shifting; the nest's tree-rings expose a bad grade.
  **Per-size export is built** (a size picker → `draftAtSize` → `<garment>-<SIZE>`
  files). The **graded marker** (all sizes nested on one bolt) is also built (s28) —
  as a Nesting-view toggle, not yet an export file.
- Tech pack: the spec sheet auto-reads finished measurements off the geometry
  (front/back symmetric → front stands in for the body); a credible measured spec,
  not a manufacturability guarantee. The **document** (3-page PDF) is built. BOM and
  construction are **recipe-authored stubs** (edit-as-data), NOT an in-app editor,
  and NOT sourced from real suppliers. **POM tolerances are built** (s27 — a ± per
  POM, conventional defaults, recipe-owned); how-to-measure is still out.
- Nesting: bounding-box / grain-constrained **shelf pack** only; no concave
  interlock, no rotation (inert), plain fabric only. An estimator, not a production
  marker — this is true of BOTH the single nest and the graded marker (s28). The
  marker packs tighter than a single garment (more pieces fill shelf gaps), which is
  real, but still bbox packing. Never quote efficiency vs commercial CAD.
- Seam allowance (s26): per-edge, recipe-owned, geometrically correct at corners
  (exact 2×2 offset, not a bisector slide). Fold edges take zero. KNOWN gaps: the
  neckline overhangs the fold ~0.95 cm near the neck (vertical-tangent meeting); dart
  legs use the default. Straight/curved edges handled; no notch/grade of the
  allowance itself.
- Checker: verifies sewability (geometry), not fit — a muslin, or now Slice 45's
  physical validation loop, still decides fit. Knows intentional ease ≠ error.
  Five checks, plus a **dart-leg** check on any darted garment. **Garment-
  agnostic since Slice 35** (this note used to say otherwise, and that claim
  was false at the time — it no longer is): `garment-check.ts` reads
  `recipe.checks(block, m)`, owns only the truly universal checks (notches
  declared, size run grows in order), and never names a sleeve. Proven on the
  skirt, which has no sleeve/armhole at all. Smooth-transition still out.
- Body view: an **upper-body** schematic (no waist/hip exists to draw); girths are
  labelled "(circ)" because the drawn span is a width, not a circumference; the head
  is a fixed-proportion orientation cue carrying no data. Annotates only the six raw
  inputs. Engine-independent. Each dimension is tagged (`data-dim`, s29) and each
  outline segment a measurement shapes is tagged (`data-edge`, s30) so the
  measurement sliders can spotlight both — row → figure only. The edge overlay is
  cosmetic: it traces the silhouette, it does not define it.
- Fitted / dart: the first non-tee recipe reuses the tee's back + sleeve and swaps in
  a darted front. The bust dart is baked into the outline as two named legs meeting at
  the apex (renders truthfully; apex is a real vertex). Its side seam runs one
  dart-intake longer than the back's so the two match once sewn — so the **open front
  hem slants down at the side**. That's a correct *untrued* flat pattern; the fitted
  front declares `hemSquareToFold: false` so the checker doesn't flag it.
- Dart manipulation: `transferDart` pivots the wedge about the apex onto another
  **straight** seam (curved targets need Bézier splitting — not built). The fold is
  always the anchor and never moves. Every seam length survives the pivot (tested).
  The mouth widens the farther the dart sits from the apex — same angle, longer legs.
- Truing: moving a dart off a seam leaves a corner exactly the dart angle. `trueSeam`
  blends two straight edges into one; honest cost is a little seam length (~4 mm), so
  the seam is re-checked against its partner. Straight seams only; Edit view only.
- Garments: a `GarmentRecipe` (`drafting/recipe.ts`) carries everything
  garment-specific — draft fn, notch table, POM list, grade rule, size run, check
  spec, guidance, and styles. **Three recipes ship: tee, fitted (darted), and
  skirt** — one structurally different garment family (no sleeve/armhole/
  neckline), proving the split holds across families, not just variants within
  one (Slices 35–43; every "still tee-shaped" item this note used to list —
  `Measurements`, the checker, guidance, the style table, both views — is now
  closed). What does NOT yet exist: component reuse BETWEEN recipes — the
  skirt's waistband and the tee's hem are two separate hand-written
  implementations, not shared parts. Building that (sleeve/neckline/collar/
  cuff/waistband as interchangeable, parameterised components) is Months 2–3
  of MVP-PLAN.md and the top architectural priority right now. All three garments currently
  share one body grade rule (a garment-specific grade is a later edit).
- Editor: freeform drag of ONE piece (the front) — a manual override, not parametric;
  edits don't write back and don't survive Reset. Ignores the fold on purpose. It's
  the interaction gate for darts, not full pattern CAD (no add/delete points, no undo).
- Don't disrupt the slice plan without saying so explicitly.

AT THE END OF ANY SLICE — remind the user to update PROJECT-STATE.md (and
ARCHITECTURE.md if the structure changed) and bump the test-count line, committed in
the same commit as the code. SLICES-BRIEF.md (project-knowledge only) is refreshed as
a full whole-file drop when it drifts.

RESEARCH — superseded by ROADMAP.md §1 (Slice 44's deeper, current competitive
analysis). Original study (Seamly2D/Valentina, Tailornova, Fabra, Knitup,
Gerber/Lectra/Optitex) still holds; added since: **FreeSewing** (our closest
architectural peer — code-defined parametric patterns; their 2026 "Library"
refactor is a direct warning to build components before garments) and
**GarmentCode** (ETH Zurich, SIGGRAPH Asia 2023 — the strongest reference for
the Months 2–3 component architecture). The **marketplace research track**
(MARKETPLACE-GOALS.md) is explicitly decoupled from the product roadmap as of
ROADMAP.md §1.6 — it is a business-development effort, not a software task,
and must not draw from the MVP-PLAN.md slice budget. Chunk 2 remains complete,
Chunk 3 remains on hold.
