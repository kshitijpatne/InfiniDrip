# InfiniDrip — Tools, Toolkits & Techniques Research

_Research pass over the supplied sources plus zero-waste, upcycling, modular and
fabric-first methods. Scored for a parametric, measurement-driven, browser-based,
no-backend, no-3D tool. Every claim carries a source; unverified items are marked._

---

## 1. Executive summary — the 5 most valuable findings

**1. The Maniccia "Pants Builder" is a working proof of the F2 guided journey.**
A live, made-to-order garment configurator built as a **10-step wizard** with a
front/back preview, swatch pickers, waist/inseam steppers, an inline size chart, and
a running "your build so far" summary panel.
(https://pantsbuilder.pages.dev, linked from https://maniccia.shop/)
This is the single most directly transferable artifact found: it's independent
evidence that a stepped, progressive-disclosure configurator is the right shape for
garment design — exactly what the locked F2 wireflow specifies. **Take the pattern,
not the code.**

**2. "Will it fit on the fabric I have?" is a nearly-free, high-value feature.**
Consumer fabric calculators already ship a **reverse mode** — not just "how much do
I need" but "how many pieces can I cut from fabric I already have," with a row-by-row
cutting layout. (https://infinitycalculator.com/crafts/fabric-calculator,
https://activecalculator.com/calculators/everyday/fabric-calculator)
InfiniDrip **already has** the nesting/fabric-estimate engine. Inverting the query
(user enters fabric width + length they own → app answers fits / doesn't fit, and by
how much) is a small addition to an existing engine that solves a real, frequent,
emotionally-charged problem: standing at the cutting counter guessing.

**3. Roughcut independently validates F1 — and hands over a journey structure.**
Roughcut ships **A4, US Letter and A0** formats, sells a printed-and-shipped option
explicitly to skip printing and taping, builds **¼″ seam allowance into the pattern
line**, and grades every pattern **01–05 by difficulty**, sequenced as a deliberate
ladder. (https://roughcutpatterns.com/pages/patterns,
https://roughcutpatterns.com/products/the-roughcut-shorts-sewing-pattern,
https://roughcutpatterns.com/)
Two takeaways: A0 export is a validated commercial need (F1 is correctly aimed), and
a **difficulty ladder across garments** (tee = 01, skirt = 02, darted bodice = 03…)
is a structural idea that plugs straight into the F2 journey.

**4. Rub-off / garment cloning is the honest bridge to upcycling — via measurements.**
Copying an existing well-fitting garment ("rub-off", "cloning", "duplicating") is a
mainstream, well-documented technique with books, PBS episodes and dozens of
tutorials. (https://mellysews.com/clone-your-t-shirt/,
https://brooksann.com/duplicating-the-vintage-dresss-pattern-without-taking-it-apart/,
https://www.pbs.org/video/sewing-with-nancy-copy-cat-patterns-part-1)
It is a **physical** technique (pins, carbon paper, tracing) — so InfiniDrip cannot
perform it. But it can own the *next* step: a guided **"clone your favourite tee"**
measurement-capture flow that tells the user exactly which flat measurements to take
off a garment they already own, then drafts a parametric pattern to match. That
converts an unbuildable technique into a buildable one that fits the engine exactly.

**5. Zero-waste drafting is unusually well-suited to a parametric engine.**
The governing constraint of zero-waste design is **fabric width** — you cannot design
zero-waste without knowing exactly how wide the textile is
(https://hannah-lane-hl8n.squarespace.com/s/LEARN_Zerowaste_ENG_Nov2019.pdf), and the
core method is arranging pieces jigsaw-style so the layout resolves to a rectangle,
using geometric shapes that tile without gaps
(https://www.insidefashiondesign.com/post/the-future-of-fashion-meet-the-zero-waste-designers-leading-the-way).
A parametric engine whose pieces are functions of measurements — with a nesting
engine and a fabric-width parameter already present — is a genuinely good host for a
**zero-waste-oriented recipe + a waste-percentage readout**. Reference point for
honesty: zero-waste practitioners report scraps typically under 2% against an
industry average of 15–20%
(https://hannah-lane-hl8n.squarespace.com/s/LEARN_Zerowaste_ENG_Nov2019.pdf).

---

## 2. Full catalogue by category

### A. Toolkits & asset libraries

**The Ultimate Fashion Design Toolkit for Adobe Illustrator** — Fashion Design Central
- **What / who / cost:** 500+ Illustrator assets for fashion designers; paid one-off,
  instant download, explicitly no subscription.
  (https://fashiondesigncentral.com/products/the-ultimate-fashion-design-toolkit-for-adobe-illustrator,
  https://fashiondesigncentral.com/collections/all)
- **Contents:** clasps & buckles, drawstrings & ties, hoods & collars, pockets,
  buttons & rhinestones, zipper pulls, locks & closures, **seam & stitch type
  illustrations**, a **tech pack template**, and fabric swatches (knit, woven, lace,
  leather, tulle, denim, mesh). (https://fashiondesigncentral.com/)
- **Why users value it:** the vendor's own claim is that accurate stitch brushes
  prevent costly production errors; a customer review reports producing a more
  professional tech pack than before. (https://fashiondesigncentral.com/)
- **Buildable?** **PARTIALLY.** The *asset library* is NO — it is proprietary,
  paid, Illustrator-specific, and a content problem (13 years of drawing), not a code
  problem. But one component is YES: **seam & stitch type notation**. Stitch and seam
  types are a finite, standardised vocabulary renderable as SVG stroke patterns
  (dash arrays, double lines, overlock zigzag) applied to already-named edges.
- **Synergy:** **Medium-High** for stitch/seam notation — InfiniDrip already has named
  edges and a tech-pack document; a per-edge `seamType` is a natural recipe-side
  field that flows into the construction callouts. Low for everything else.
- **Effort / depends on:** S–M. Depends on the existing tech-pack document and named
  edges. **Must not copy their artwork** — draw original notation from the standard
  vocabulary.

---

### B. Pattern systems & sellers

**Roughcut Patterns (RoughcutMYOG)** — the richest single source
- **What / who / cost:** indie PDF sewing patterns (jackets, trousers, bags, shirts,
  hats); individual patterns ~£15.95, full 18-pattern archive £179, plus free entry
  patterns (Industrial Tote, Kit Duffle).
  (https://roughcutpatterns.com/products/the-roughcut-shorts-sewing-pattern,
  https://roughcutpatterns.com/products/the-complete-roughcut-collection,
  https://roughcutpatterns.com/pages/free-patterns)
- **Capabilities worth stealing (conceptually):**
  - **Difficulty ladder 01–05.** Every pattern is graded so the buyer knows the
    commitment before cutting; the catalogue is explicitly ordered as a progression,
    and the site warns that building out of order is the fastest route to
    frustration. (https://roughcutpatterns.com/,
    https://roughcutpatterns.com/products/the-complete-roughcut-collection)
  - **Format tiers:** A4, US Letter and A0 where they exist; some older patterns are
    A4 only. (https://roughcutpatterns.com/pages/patterns)
  - **Seam allowance built into the line** — ¼″ included, cut directly on the pattern
    line, with specific areas (fly, waistband, hem) using different allowances.
    (https://roughcutpatterns.com/products/the-roughcut-shorts-sewing-pattern)
  - **Modularity as a product feature:** one trouser pattern offers classic or
    pleated front, button or zip fly, and four back-pocket systems, so no two builds
    need match. (https://roughcutpatterns.com/)
  - **Video-first teaching** — the site's stated position is that nobody learns a
    set-in sleeve from a paragraph, so every pattern ships as a filmed build rather
    than written instructions. (https://roughcutpatterns.com/pages/patterns)
- **Why users value it:** a review highlights that many patterns carry a hundred
  overlapping size lines while this one stayed clear, praising fit and instructions.
  (https://roughcutpatterns.com/)  → **This is a direct argument for layered,
  toggleable size lines in F1** rather than every size printed at once.
- **Buildable?** **YES** for difficulty grading, format tiers, per-edge variable seam
  allowance, and modular options. **NO** for the video library (content).
- **Synergy:** **High.** Difficulty rating is a recipe-side constant; per-edge seam
  allowance is a refinement of an existing engine feature; modular options are recipe
  variants; format tiers are already in the F1 spec.
- **Effort / depends on:** S (difficulty rating), M (per-edge seam allowance —
  touches the offset engine), M–L (modular options — needs the recipe registry).

**Timeless Templates "Magic Modular Sewing System"**
- **What / cost:** a vintage pattern range designed for mix-and-match; paid.
  (https://timelesstemplates.blog/magic-modular-sewing-system/)
- **Capability:** patterns carry **clearly marked key-fitting lines** so pieces can be
  cut and pasted between patterns — exchange collars, sleeves or skirts across
  designs to build new garments. Patterns are regraded to modern sizes.
- **Buildable?** **YES, and this is the key mechanism.** "Key-fitting lines" is just a
  **shared interface contract between recipes**: if two garments expose an armhole of
  matching length and shape, their sleeves are interchangeable. InfiniDrip's checker
  can *verify* that swap (matched seam lengths) rather than leaving it to trust.
- **Synergy:** **High** — it is the engine/recipe split expressed as a product
  feature, and the production-readiness checker becomes the safety net that makes
  mixing trustworthy.
- **Effort / depends on:** M–L. Depends on the recipe registry and the checker.

**Maniccia — "Pants Builder"** (see Executive Summary #1)
- **What / who / cost:** a made-to-order pants configurator for a small label; the
  garment is paid, the configurator is free to use. 8–12 week hand-sewn lead time.
  (https://maniccia.shop/pages/pants-builder, https://pantsbuilder.pages.dev)
- **Capability (from the page's own template structure):** a **10-step** flow
  ("Step N of 10") with per-step titles and notes, a progress label, front/back
  preview, swatch selection, an expandable inline size chart, **waist and inseam
  numeric steppers in inches**, and a persistent "Your build so far" key/value summary
  before purchase.
- **Buildable?** **YES** — this is UI structure, and it is precisely the F2 spec.
- **Synergy:** **High.** Note one genuine difference: Maniccia's builder configures a
  *product order*; InfiniDrip's journey produces a *pattern*. The step scaffolding
  transfers; the commerce ending does not.
- **Effort / depends on:** already scoped as F2.

**Knitup** — knitwear design → on-demand manufacture
- **What / who / cost:** browser design studio plus manufacturing, aimed at emerging
  designers and brands; account required, no minimums, ~3 weeks for the Essentials
  tier, two service tiers (Essentials vs Atelier). (https://home.knitup.io/)
- **Capabilities:** pre-built silhouettes with customisation along five clean axes —
  **Shapes, Yarns, Stitches, Colors, Graphics** — with real-time preview, plus a
  structured education hub ("Knitup 101": How to, Materials, Essential Stitches,
  Mastering Jacquard, Top 10 Silhouettes, FAQ) and Shopify integration.
  (https://home.knitup.io/, https://home.knitup.io/knitup101/how-to-knitup)
- **Why users value it:** the pitch is test-small/scale-fast production with no
  inventory risk and no minimums. (https://home.knitup.io/about/knitup-advantage)
- **Buildable?** **PARTIALLY.** The **named customisation axes** and the **education
  hub** are YES. The knitting machines, on-demand manufacture and Shopify pipeline
  are NO (that is the marketplace track, not a slice).
- **Synergy:** **Medium-High.** "Curated silhouettes + a few clear axes" is a good
  mental model for how garment recipes should present themselves in the journey;
  the 101 hub maps onto Phase C's in-app tutorials.
- **Effort / depends on:** S–M (axis presentation), M (education content — content
  cost, not code cost).

**Timothy Kohei** — ⚠️ **partially verified**
- Product and garment designer in Denver offering concept, pattern, sample and
  production work, client work, one-of-one commissions, **and sewing patterns**
  (from site metadata; https://timothykohei.com/).
- The page body is JavaScript-rendered and returned no content; two targeted searches
  surfaced nothing. **No technique or toolkit could be extracted.** Marked
  unverified — see §5.

**Seaggs** — ❌ **not a tool**
- A garment retail store (e.g. a 500 GSM hoodie with embroidery, screenprint, stealth
  pockets, oversized fit; $48). (https://seaggs.com/products/meadow-hoodie)
- No design tool, toolkit or technique. Only marginal relevance: their product copy
  is a reminder that construction/finish details (GSM, pocket type, fit) are the
  vocabulary customers actually shop on — useful for style-table naming, nothing more.

---

### C. Techniques — zero-waste pattern cutting

- **What it is:** designing so pattern pieces consume ~100% of the cloth, tackling
  waste at the design stage rather than the cutting stage; pieces interlock like a
  jigsaw. Traceable to kimono and sari construction, where the garment is plotted to
  the fabric's length and width.
  (https://www.trvst.world/sustainable-living/fashion/zero-waste-pattern-cutting/,
  https://textilevaluechain.in/in-depth-analysis/articles/textile-articles/zero-waste-pattern-cutting)
- **The five named techniques:** jigsaw layout, subtraction cutting, geometric
  draping, tessellation, and textile origami — with jigsaw layout and geometric
  draping cited as the most accessible starting points.
  (https://www.portugalclothingfactory.com/blog/zero-waste-pattern-drafting-small-brands/)
- **Implementable specifics:**
  - **Fabric width is the design frame** — the space within which the whole design
    must resolve.
    (https://hannah-lane-hl8n.squarespace.com/s/LEARN_Zerowaste_ENG_Nov2019.pdf)
  - **Work backwards to a rectangle** — the total layout must end as a rectangle.
    (same source)
  - **Prefer rectangles and squares**, which leave virtually no waste on wovens; plan
    **triangles in pairs** so they combine into rectangles; keep circles for accent
    pieces and plan their offcuts.
    (https://www.insidefashiondesign.com/post/the-future-of-fashion-meet-the-zero-waste-designers-leading-the-way)
  - **Surplus becomes structure, not scrap** — e.g. kimono neck fullness is pleated
    inside the collar rather than cut away.
    (https://textilevaluechain.in/in-depth-analysis/articles/textile-articles/zero-waste-pattern-cutting)
- **Buildable?** **PARTIALLY → YES if scoped.** A **zero-waste recipe** (a garment
  drafted from rectangles/geometry parameterised by measurements *and* fabric width)
  plus a **waste-percentage readout** from the existing nesting engine: YES.
  Automatic conversion of an arbitrary drafted garment into a zero-waste layout: NO
  (that is a research-grade optimisation problem — see §4).
- **Synergy:** **High** for the readout, **High** for a dedicated recipe. It is
  ideologically aligned too: a free, local, lightweight tool that reduces material
  waste is a coherent product story.
- **Effort / depends on:** S (waste % readout — nesting exists), M–L (a zero-waste
  recipe — needs fabric width as a first-class draft input).

---

### D. Upcycling & garment reconstruction

- **The method — "rub-off" / cloning / duplicating:** produce a pattern from an
  existing garment **without taking it apart**. Documented technique set:
  - Work with the garment **folded in half**, because front and back differ; each
    pattern piece is a half-section, and matching seams are pinned together so the
    halves cannot shift.
    (https://thethriftystitcher.co.uk/have-you-ever-tried-cloning-your-clothes/)
  - Use an **anchor line** (e.g. pinned horizontally across the chest) and trace in
    sections, releasing and re-pinning, because sleeved garments will not lie flat
    all at once. (same source; also
    https://brooksann.com/duplicating-the-vintage-dresss-pattern-without-taking-it-apart/)
  - **Pins pushed through into card** capture seams you cannot trace around (sleeve
    and collar seams); carbon paper is an alternative transfer method.
    (https://mellysews.com/clone-your-t-shirt/,
    https://cardinalsewingnest.com/copy-your-clothes/)
  - **Transfer the markings** — grainline, seams, darts, notches, hem allowances —
    then add seam allowances and test with a muslin.
    (https://createwhimsy.com/projects/copying-a-ready-to-wear-dress/,
    https://www.pbs.org/video/sewing-with-nancy-copy-cat-patterns-part-1)
  - **Start with a t-shirt**, and avoid garments with darts, panel lines, tucks or
    gathers for a first attempt; garments that will not lie flat are harder.
    (https://inthefolds.com/q-a-series/2024/tips-for-copying-your-clothes)
- **Why users value it:** the recurring motivation is a garment that fits perfectly
  and is worn out or discontinued, where destroying the original is not an option
  (https://thethriftystitcher.co.uk/have-you-ever-tried-cloning-your-clothes/); a
  long-running tutorial notes the appeal is not damaging the original
  (https://mellysews.com/clone-your-t-shirt/).
- **Buildable?** **PARTIALLY — and the framing decides it.**
  - Performing a rub-off: **NO.** It is physical, and any automated version needs
    photo/scan input, which is explicitly out of scope.
  - A **guided "clone your favourite garment" measurement flow**: **YES.** The app
    tells the user which flat measurements to take from a garment they own (and how
    to lay it folded, where to measure the armhole, etc.), takes those numbers as the
    `measurements` object, drafts parametrically, and warns via existing plausibility
    checks. This is measurement capture, not geometry capture — squarely inside the
    architecture.
  - **Upcycling from limited fabric** (garment → available cloth → what can I make):
    **PARTIALLY** — reduces to the fabric-first "will it fit" query (§E).
- **Synergy:** **High** for the guided-clone flow — it is the F2 journey applied to a
  new, very common entry point ("I want another one of this"), and it produces a
  parametric, re-gradable, re-exportable pattern where the physical method produces a
  one-off paper shape. That is a real advantage worth stating.
- **Effort / depends on:** M. Depends on the journey UI and the existing guidance /
  plausibility checks. **Honest boundary:** the app cannot verify what the user
  measured; the muslin still decides.

---

### E. Fabric-first drafting ("design to the cloth you have")

- **What it is:** starting from the fabric on hand rather than the pattern. Consumer
  tooling already splits into two modes: forward ("how much do I need") and reverse
  ("how many pieces can I cut from fabric I already have"), the latter returning a
  row-by-row cutting layout across the bolt width.
  (https://infinitycalculator.com/crafts/fabric-calculator,
  https://activecalculator.com/calculators/everyday/fabric-calculator)
- **Implementable specifics:**
  - The core arithmetic is bolt-width-driven: how many pieces fit across the width →
    number of rows → total length.
    (https://inspiredtosew.com/blogs/sewing-essentials-getting-started/how-much-fabric-do-i-need)
  - **Width conversion matters:** yardage quoted for one fabric width must be
    rescaled for a different actual width.
    (https://sewingwithease.com/fabrics/fabric-yardage-calculator/)
  - **Buffers and constraints:** add roughly 10–15% for cutting errors, flaws and
    squaring; **nap/directional prints force all pieces one way** and cost noticeably
    more fabric; pattern repeats add a repeat per cutting row.
    (https://activecalculator.com/calculators/everyday/fabric-calculator,
    https://www.costumecalc.com/fabric-yardage-calculator/,
    https://www.fabricyardagecalculator.com/)
  - Fitted garments consume more than unfitted ones because more pieces mean more
    seam allowances and more dead space in the layout.
    (https://www.costumecalc.com/fabric-yardage-calculator/)
  - Honest limit these tools state themselves: a calculator estimates, but the result
    should be checked against the real cutting layout.
    (https://www.canvasetc.com/fabric-yardage-calculator/)  → InfiniDrip is
    *better positioned than a calculator here*, because it nests the actual pieces
    rather than approximating with rectangles.
- **Buildable?** **YES.** The nesting engine and fabric estimate already exist; this
  is an inversion plus a few parameters (owned length, nap flag, buffer %).
- **Synergy:** **High.** Pure engine work, garment-agnostic, no new plumbing, and it
  gives the Output step of the journey a genuinely useful answer.
- **Effort / depends on:** S–M. Depends on the existing nesting/fabric estimate.

---

### F. Modular & hackable pattern systems

- **What it is:** building many garments from a few well-fitting bases. Hacking spans
  small changes (length, fabric type) to large ones (sleeve from one pattern, bodice
  from a second, skirt from a third); practitioners keep a small set of patterns that
  fit and vary them rather than re-fitting from scratch.
  (https://thethriftystitcher.co.uk/pattern-hacking/)
- **The core mechanism is dart rotation** — the stated basic principle of garment
  design, with darts radiating from the bust apex at any angle and convertible to
  gathers, pleats or tucks. (same source)
  → **InfiniDrip already ships dart manipulation and truing.** The engine primitive
  for pattern hacking is *already built*; what is missing is the product framing.
- **Modular components:** detachable or swappable collars, cuffs and belts, and
  patterns that work in both knits and wovens, are cited as what makes a pattern
  versatile.
  (https://www.seamwork.com/fabric-guides/how-to-sew-clothes-on-a-budget-fabric-patterns-and-tools)
- **Academic reference:** *Refashion: Reconfigurable Garments via Modular Design*
  (arXiv 2510.11941) formalises garments assembled from a shared set of fabric
  modules, reconfigurable across fit and style — panels swapped for larger ones,
  sleeves mixed across tops, a garment resized by redrawing its pattern to new target
  dimensions and reassembling from a new module combination.
  (https://arxiv.org/html/2510.11941)
- **Practitioner rules worth encoding as guidance:** always copy the pattern before
  hacking, and **add seam allowance to every new seamline created**.
  (https://thethriftystitcher.co.uk/pattern-hacking/) The second is a checkable fact —
  a natural production-readiness check.
- **Buildable?** **YES, incrementally.** Cross-recipe component swapping (sleeve from
  A onto bodice B) is the ambitious end and depends on the recipe registry plus
  matched-seam verification. The cheap end — "new seamline missing seam allowance" as
  a checker rule, and presenting existing dart manipulation as *hacking* — is
  available now.
- **Synergy:** **High**, and notably it re-uses capability already shipped.
- **Effort / depends on:** S (checker rule, framing), L (true cross-recipe swapping).

---

## 3. Ranked implementable ideas

Score = user value × buildability × synergy. Effort: S / M / L.

| # | Idea | User value | Buildable | Synergy | Effort | Depends on |
|---|------|-----------|-----------|---------|--------|------------|
| 1 | **"Will it fit?" fabric-first check** — enter fabric width + length you own → fits / short by X, with layout | Very high | YES | High | S–M | nesting (built) |
| 2 | **Guided clone-your-garment measurement flow** — coached flat-measure capture from an existing garment → parametric draft | Very high | YES (as measurement capture) | High | M | journey UI, plausibility checks |
| 3 | **Layered / toggleable size lines in export** — one file, sizes on switchable layers | Very high | YES | High | S | already in F1 spec |
| 4 | **Garment difficulty ladder (01–05)** + ordered progression in the journey | High | YES | High | S | recipe registry, journey |
| 5 | **Waste-% readout** on the nesting view (with an honest, non-industrial framing) | High | YES | High | S | nesting (built) |
| 6 | **Per-edge variable seam allowance** (hem ≠ side seam ≠ fly) | High | YES | High | M | seam-allowance engine |
| 7 | **Seam & stitch type notation** on tech pack + pattern (original artwork only) | High | YES | Med-High | S–M | tech pack, named edges |
| 8 | **Checker rule: every new seamline has seam allowance** | Med-High | YES | High | S | checker (built) |
| 9 | **Nap / directional-print flag** in nesting (forces one-way layout, adjusts estimate) | Med-High | YES | High | S | nesting |
| 10 | **Modular options within a recipe** (pocket style, fly type, sleeve length) | High | YES | Med-High | M–L | recipe registry |
| 11 | **Cutting-buffer setting** (default ~10–15%, user-editable) | Medium | YES | High | S | fabric estimate |
| 12 | **Zero-waste recipe** (rectangle/geometry garment parameterised by measurements + fabric width) | High | YES (scoped) | High | M–L | fabric width as draft input |
| 13 | **Named customisation axes** per garment (Knitup-style presentation) | Medium | YES | Medium | S–M | journey, recipe registry |
| 14 | **Cross-recipe component swapping** ("key-fitting lines") verified by the checker | Very high | PARTIALLY | High | L | recipe registry, checker, matched seams |
| 15 | **In-app education hub** (Knitup 101 analogue) | Medium | YES | Medium | M (content) | Phase C tutorials |

**Suggested placement.** Items 1, 3, 5, 9, 11 cluster naturally around the existing
export/nesting spine and are small — a strong "fabric & output" batch. Items 2, 4, 13
belong to the F2 journey. Items 6, 7, 8 are refinements of shipped engine features.
Items 10, 12, 14 are post-skirt, once the recipe registry has proven itself on a
third garment.

---

## 4. Cannot honestly replicate — with reasons

Being strict, per your instruction:

1. **The Illustrator asset library itself** (500+ trims, brushes, swatches). Paid,
   proprietary, and a *content* problem built over 13 years of drawing.
   (https://fashiondesigncentral.com/) **Do not copy the artwork.** Only the
   standardised stitch/seam *vocabulary* is fair game, drawn originally.
2. **Video build-along tutorials.** Roughcut's teaching model is filmed builds
   (https://roughcutpatterns.com/pages/patterns) — a production operation, not a
   feature. InfiniDrip can link out or teach in text/diagram; it cannot ship films.
3. **Automatic zero-waste conversion of an arbitrary garment.** Turning a drafted
   pattern into a genuinely zero-waste layout is a hard optimisation problem — the
   published approach involves 3D surface generation, patch merging, shape
   optimisation and packing (https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12422826),
   and is patented. A *zero-waste recipe* is honest; an "auto zero-waste" button is not.
   ⚠️ **Patent flag** — do not implement that pipeline.
4. **Rub-off / cloning as an automated capture.** Physical technique requiring pins,
   tracing and carbon paper; automating it means photo or scan input, explicitly out
   of scope. Only the *guided measurement* version is honest.
5. **On-demand manufacturing, Shopify integration, no-minimum production**
   (Knitup, Maniccia's made-to-order flow). Logistics and commerce businesses —
   these belong to the marketplace track, and even there they are partnerships, not
   features.
6. **Made-to-measure fit guarantees.** Nothing found changes the standing boundary:
   a muslin still decides fit. Cloning tutorials say the same — trace, add
   allowances, then test with a muslin.
   (https://createwhimsy.com/projects/copying-a-ready-to-wear-dress/)
7. **Draping-based methods** (geometric draping, textile origami, subtraction
   cutting as practised). These are worked on a body or dress form
   (https://www.insidefashiondesign.com/post/the-future-of-fashion-meet-the-zero-waste-designers-leading-the-way) —
   no 3D, no form, no drape sim. Their *outputs* (rectangle-based geometry) are
   replicable; their *methods* are not.
8. **Vintage pattern libraries / regraded historical patterns**
   (https://timelesstemplates.blog/magic-modular-sewing-system/). Licensed content.
   The modular *mechanism* is replicable; the pattern catalogue is not.

---

## 5. Open questions & dead ends

**Could not access:**
- **All five Instagram links** — confirmed blocked by robots policy
  (`ROBOTS_DISALLOWED`). No captions, video content or comments retrievable. These
  reportedly hold the upcycling methods, so **the upcycling section above is built
  from independent research, not from your reels.** If those specific techniques
  matter, the reliable path is you describing or screenshotting them.
- **timothykohei.com** — reachable but JavaScript-rendered; only metadata returned
  (Denver product/garment designer; concept, pattern, sample, production; sells
  sewing patterns). Two targeted searches found nothing further. **Unverified** —
  no technique extracted. Worth a manual look at its patterns page.
- **maniccia.shop product/about pages** — only the storefront shell and the Pants
  Builder were retrievable. The builder's *content* (the actual 10 step titles,
  option sets) is Vue-templated and did not render, so the step list above is
  structural, not literal. A manual walkthrough would yield the real 10 steps —
  **worth doing, since it is the closest analogue to F2.**

**Open questions for you:**
1. **How far into upcycling do you want to go?** The honest version is a
   measurement-capture flow (#2) plus the fabric-first check (#1). Anything more
   needs photo input, which is post-MVP by your own scope.
2. **Should fabric width become a first-class draft input?** Today it is an
   export/nesting parameter. Zero-waste (#12) requires it at *draft* time. That is a
   genuine architectural decision, not a slice-level one — flagging it now rather
   than discovering it mid-slice.
3. **Difficulty ladder — per garment or per feature?** Roughcut grades whole
   patterns; InfiniDrip could grade garments (tee=01, skirt=02) or journey steps.
   Cheap either way, but the choice shapes the journey's shape.

**Not pursued (low value, flagged for completeness):** seaggs.com is retail only;
general Illustrator tutorial sites (successfulfashiondesigner.com, Adobe's own
guides) teach a different tool and offer nothing transferable to a parametric engine.
