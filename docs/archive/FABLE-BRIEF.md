# InfiniDrip — Fable Brief (Stage 0 freeze + epic spec)

**VERBATIM INSTRUCTION — read first.** Execute this brief exactly. Do NOT invent
product decisions the spec doesn't state, do NOT touch the files marked off-limits,
and do NOT "improve" the engine. Deliver on a **branch**, never on main. Hold the
project gate at every step: `tsc --noEmit` clean AND `npx vitest run --coverage` at
100% with the exact test count confirmed. If a test fails, re-copy the verbatim file
— never edit an assertion to make it pass. When done, open a branch diff for review;
do not merge.

This is a two-feature epic (F1, then F2). Nothing here builds until **Stage 0** is
signed off by the maintainer: the journey wireflow (below), the export-format spec
(below), and this brief's done-gate.

---

## 0. Context & the one rule that keeps two models safe

InfiniDrip is a lightweight, local, TypeScript + SVG parametric pattern designer
(no backend). Two models now work the repo in parallel along one seam:

- **Opus owns LOGIC** — the drafting engine, garment recipes, guidance *checks*,
  the verdict *function*, and the skirt. You do not touch these.
- **Fable (you) own PRESENTATION + OUTPUT** — the guided journey UI (the shell)
  and the export *writers*. That is your whole world.

Hold that line and file collisions nearly vanish. Read `PROJECT-STATE.md` and
`ARCHITECTURE.md` in the repo first — they are ground truth over anything in this
brief if they ever disagree.

### OFF-LIMITS (do not edit)
- The engine: `geometry/`, `drafting/` (recipes, draft fns, grading, dart), the
  `Piece`/`Edge`/`Block` model.
- The guidance LOGIC: `guidance/` check files, `plausibility.ts`, the verdict
  function, ease/style logic. You **render** their outputs; you do not compute them.
- Anything the skirt track is adding (recipe/engine files).
- Packaging (Tauri/PWA) — explicitly a later Opus phase, not this epic.

### The interface contract (what you may rely on)
Opus's Phase A exposes every guidance result as a **pure function** returning plain
data — the top-line verdict, per-message `{severity, text}`, per-field plausibility
flags, and body-vs-finished measurement values. **F2 renders that data; it never
recomputes it.** If a value you need isn't exposed as a function yet, stop and flag
it — do not reach into logic files to derive it yourself.

---

## F1 — Real-world export system (build FIRST; independent of Phase A)

**Why:** printing-and-taping is the #1 functional pain in this market, and projector
sewing exploded to escape it. You already have the geometry, seam allowance, notches,
grainlines, and grade layers — this is new **writers on the existing export spine**
(`flatten → layout → writer`), beside the current SVG/DXF/PDF.

### Export-format spec (LOCKED — build to this, do not reinterpret)

**A. Projector file** (single, seamless file for projecting straight onto fabric):
- **No page breaks** — one continuous canvas, not tiled.
- **Layered size toggles** — each graded size on its own toggleable layer (reuse the
  existing size run / graded marker geometry).
- **Bold, thick, high-contrast lines**; clearly labelled pieces and markings
  (notches, grainlines, fold lines) at projector-legible weight.
- **Pieces unfolded** where practical (mirror cut-on-fold pieces to full width);
  where a fold is kept, mark it unmistakably.
- **Generous margins / white space**; pieces arranged with grain consistent.

**B. A0 / copyshop file** — a single large-format sheet (A0), whole pieces (not
tiled), for print-shop output. Same geometry, print-oriented styling.

**C. Calibration square** — EVERY real-world file embeds a square of an **exact,
stated size** (e.g. a 10 cm × 10 cm square labelled "10 cm"). This is the scale
anchor the user calibrates the projector / verifies the print against.

### F1 tests (non-negotiable)
- **Real-parse validation** — validate output with a real parser (DOMParser / xml
  minidom for SVG, a real PDF parse), NOT assertions that mirror the writer's own
  strings. (This is the documented SVG-bug lesson: a test that echoes the output
  proves nothing.)
- **Calibration-square scale test** — assert the emitted square measures EXACTLY its
  stated size in real units. This is the single most important test in F1: a wrong
  scale silently ruins every projected or cut pattern.
- **Existing exports byte-identical** — current SVG/DXF/PDF outputs are unchanged
  (snapshot them before, compare after).
- 100% coverage held; exact new test count stated.

---

## F2 — Guided journey UI (build AFTER Opus Phase A lands)

**Why:** the steep-learning-curve / cluttered-technical-UI complaint is the field's
#1 barrier. The fix is a guided, progressively-disclosed journey — **not** heavy
gamification. Show essentials first; tuck advanced views away; celebrate lightly and
skippably. No badges/points/streaks (they patronise a designer audience).

### Journey wireflow (LOCKED — baseline → finished)
A guided path overlaid on the existing View toggle (Pattern / Body / Size run / Spec
/ Nesting / Check / Edit). Beginners are walked the spine; advanced views remain
one click away but are not front-loaded.

1. **Start** — pick a garment (Tee / Fitted / [Skirt when it lands]) or defaults.
2. **Measure** — enter measurements; **surface Opus's plausibility flags** (amber
   outline on implausible fields) and the body view (preserve the Slice-30 hover
   highlight behaviour: hovering a row spotlights its dimension + outline segments).
3. **Fit** — target fit + fabric/ease; show the gap-to-target and the ease note
   (Opus strings, rendered statefully).
4. **Refine** — Pattern view + optional Edit; show the **production-readiness
   verdict** (Opus's verdict function) as a top-line status: "⚠ 2 to review" /
   "✓ looks production-ready". **Gate the green signals** — style "Classic tee ✓"
   and any "validated" impression must NOT read green while inputs are implausible.
5. **Size** — grade into a size run; Spec sheet; Nesting / fabric estimate.
6. **Output** — export: existing SVG/DXF/PDF/tech-pack **+ the new F1 real-world
   files**. This is the finished handoff.

### Journey mechanics
- **Progressive disclosure** — Nesting / Spec / Check / Edit are available but not
  shown until relevant; core path is Measure → Fit → Refine → Output.
- **Onboarding** — a first-run welcome + a coached first pattern; empty states
  coach rather than dead-end.
- **Checklist + progress** — visible "how far to a finished, exportable design."
- **Contextual help** — tooltips / coach marks on first encounter with a control.
- **Light celebration** — a subtle confirmation on reaching a valid export; skippable.
- **Body/finished labels** — render Opus's body-vs-finished data as a clear label so
  "Chest 100 (circ)" is unambiguous.

### F2 acceptance criteria (the subjective gate — coverage can't judge these)
- Every advanced control is hidden until its step is relevant.
- A first-time user reaches a valid export in a small, coached number of steps.
- No empty state dead-ends (each offers the next action).
- No path lets a green "validated / ✓" signal show while any input is implausible.
- The Slice-30 hover-highlight behaviour still works in the new shell.

---

## Guardrails (the seven checks — all apply)

1. **Design freeze (Stage 0).** Build only to the locked wireflow + export spec
   above. Do not invent product decisions; if the spec is silent, ask.
2. **Logic before presentation.** F2 starts only after Opus Phase A (verdict fn,
   stateful messages, body/finished data) is merged — so you decorate a stable base.
3. **Interface freeze + file ownership.** Once you branch, you own the UI shell
   (`app.ts`); Opus works in logic files only. Do not edit engine/recipe/guidance
   logic. Consume guidance via its exposed functions only.
4. **Acceptance criteria for subjective UI** — the F2 list above is the done-bar the
   coverage number can't enforce; self-check against it before declaring done.
5. **Two regression gates the coverage number won't catch:**
   - existing SVG/DXF/PDF outputs byte-identical; no existing view broken;
   - real-parse validation of new files + the calibration-square scale test.
6. **Docs + merge discipline.** Write PROJECT-STATE / ARCHITECTURE deltas on your
   branch only; the maintainer reconciles them at merge. Do not rewrite main's docs.
7. **Budget guard.** F1 first (cheaper, self-contained, higher-severity). If budget
   tightens, a fully-shipped F1 is a clean stopping point; F2 is the stretch.

---

## Definition of done
- **F1:** projector + A0 + calibration-square files ship on the export spine; real-
  parse + scale tests pass; existing exports byte-identical; 100% coverage; visible
  in `npm run dev`.
- **F2:** the guided journey (Start→Output) with progressive disclosure, onboarding,
  checklist/progress, contextual help, and surfaced guidance (verdict, flags, gated
  green signals, body/finished labels); all F2 acceptance criteria met; Slice-30
  behaviour preserved; 100% coverage; visible in `npm run dev`.
- Delivered on a branch, diff open for review, **not merged**.

## Staged execution plan
1. Stage 0 sign-off (wireflow + export spec + this gate).
2. **F1** — export writers + tests, in parallel with Opus Phase A. Ship, self-verify.
3. Wait for Opus Phase A (verdict fn + stateful messages + body/finished data) on main.
4. **F2** — journey UI surfacing that logic. Ship, self-verify against acceptance list.
5. Open the branch diff for review.

## Budget note
Scope is bounded and the gate makes "done" objective, but Fable is premium-priced, so
cost is the one variable. The locked specs + the repo docs keep it predictable by
removing exploration. F1 is the guaranteed-valuable, self-contained core; F2 is the
stretch on top.
