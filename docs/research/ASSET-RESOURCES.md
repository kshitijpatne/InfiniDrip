# InfiniDrip — Apparel Design Resources: Verified Catalogue

_Every link in `apparel_design_resources.md` checked individually (license, activity,
actual contents — not just the name). Split into usable / not usable, with a
formalized integration plan for the usable set. Cross-referenced from ROADMAP.md §1.7._

---

## Usable — integrate

### 1. Fabric.js — the standout finding
- **What:** MIT-licensed, **written in TypeScript**, object model on top of HTML5
  canvas with a built-in **SVG-to-canvas and canvas-to-SVG parser**, drag/scale/
  rotate/skew/group out of the box, clipping regions, serialization (load/save
  state). (https://github.com/fabricjs/fabric.js, https://fabricjs.com/)
- **Why it matters:** it was originally built for an apparel-customization startup
  (printio.ru) — interactive placement of artwork on a garment is its founding use
  case. (https://www.sitepoint.com/introduction-to-fabric-js/)
- **Fit:** exact match for **ROADMAP.md Priority 3.1 — Artwork placement layer
  (prints, patches, colour blocking)**, which is already in scope and already
  SVG-based. Fabric.js reads our existing SVG pieces, adds interactive placement on
  top, and re-serializes back to SVG for export — no format conversion, no new
  dependency conflict (MIT, TS, browser-only, no backend).
- **Integration plan:** adopt as the library for Priority 3.1 when that slice comes
  up. No action before then. Logged in ROADMAP.md so the decision isn't re-litigated
  later.

### 2. Open TechPack (coatsdigital) — reference only, not adoption
- **What:** MIT-licensed community effort toward a standard TechPack file format.
  Verified: 1 star, 3 watchers, no releases, last substantive activity years old.
  The README states the goal plainly — no standard exists, and a TechPack should be
  both human- and machine-readable — but **defines no working schema yet**; the
  repo holds an early `examples/std 0.1` folder and an `svg-library` folder, not a
  ratified spec. (https://github.com/coatsdigital/opentechpack)
- **Fit:** we already auto-derive our POM/tech-pack structure from geometry, which
  is further along than this effort. **Not a dependency** — nothing to adopt today.
- **Integration plan:** none now. Worth a five-minute check of `examples/std 0.1`
  if our tech-pack JSON export format is ever revisited, purely as a naming/
  structure sanity-check against an industry attempt at the same problem — not as
  code or schema to import.

### 3. GarmentIQ — reference for later, not now
- **What:** MIT-licensed Python/PyTorch computer-vision pipeline: garment
  classification → segmentation → landmark detection → measurements from a photo.
  Requires trained models (tinyViT, BiRefNet, HRNet), GPU-friendly training,
  Kaggle-hosted image datasets. (https://github.com/lygitdata/GarmentIQ)
- **Fit today: NO.** This is exactly the "photo→pattern reconstruction" capability
  already excluded from MVP scope (MVP-PLAN.md §3.5) — needs ML infrastructure our
  local-first, no-backend, no-CV app explicitly doesn't have.
- **Integration plan:** log as a **reference implementation for Feature A / the
  post-MVP measuring-assistant work**, not something to build toward now. If/when
  the project revisits CV-based measurement (well beyond MVP), this is a real,
  working, permissively-licensed starting point rather than starting from zero.
  Filed as a pointer, not a task.

---

## Not usable — with reasons

| Resource | Category | Why not |
|---|---|---|
| **OpenPack Dataset/Toolkit** | "Data schema" | **False positive.** Verified: this is a warehouse logistics dataset for human-activity recognition (people packing shipping boxes, IoT sensor data), unrelated to garment tech packs. A keyword collision on "pack." |
| **GarmageSet / GarmageNet** (Style3D) | 3D dataset | 14,801-garment dataset for training a **diffusion-model** text/sketch/photo→3D-garment generator. Needs CUDA, PyTorch, GPU training. Wrong medium entirely — we're 2D SVG, no ML. |
| **Fashion-MNIST** | Dataset | 28×28 grayscale clothing-**classification** benchmark (is this a shirt or a shoe). Not pattern-generation data; irrelevant to drafting. |
| **CloPeMa Garment Dataset** | Dataset | Robotics cloth-perception/manipulation dataset. |
| **3D High-Quality Garment Dataset** | Dataset | 3D mesh assets for rendering/simulation — no 3D surface in our app. |
| **Awesome 3D Garments** | Curated list | Confirmed: an index of 3D-generation research papers (DressCode, Design2Cloth, Garment3DGen, GarmentDreamer…) — all GPU/diffusion pipelines, same category as GarmageSet. |
| **Valentina / Seamly2D** | Pattern CAD | Already researched in the original competitive landscape (ROADMAP.md §1). GPL-licensed desktop C++/Qt — not a code dependency, already positioned as our closest architectural peer, not a resource to integrate. |
| **Patro** | 2D pattern engine | Verified: **GPL-3.0** (copyleft — would force our codebase's license), Python (wrong language), small (24 stars). License alone rules out direct use; noted only as a conceptual reference for geometry-engine structure, no integration path. |
| **IMG.LY Apparel/Mockup Editor starter kits** (iOS/Android/React) | Canvas SDK | Verified: the starter kits are thin scaffolding around IMG.LY's **commercial CE.SDK** — MAU-based license, watermarked without a paid key, self-hosted asset bundles required. Directly conflicts with the "free, no subscription" product thesis; the underlying engine is proprietary, not open source. |
| **Figma Community UI Kits** | Design assets | Generic Figma design files, not fashion-specific, not code — nothing to integrate. |
| **DressCode** | 3D generation | Text→3D **sewing pattern + PBR texture** generation via a GPT-based model + Stable Diffusion. Research-grade generative pipeline, same bucket as GarmageNet. |
| **GarmentLab** | Simulation benchmark | Verified: a **robot-manipulation** benchmark (folding/washing clothes with robot arms), built on NVIDIA Isaac Sim, GPU-based. Completely unrelated domain — robotics research, not pattern design. |
| **JavaScript Cloth Simulation** | 3D physics | Toy cloth-physics demo. No 3D rendering surface in InfiniDrip; out per the standing 3D-drape-simulation exclusion. |
| **Three.js** | 3D engine | Well-known, MIT — but InfiniDrip has no 3D view. Out per the same standing exclusion (ROADMAP.md "Cut from v1"). |
| **ambientCG / Poly Haven / 3DAssets.one** | PBR textures | Photorealistic material libraries for 3D rendering. No 3D surface to texture; our fabric swatches are flat SVG colour fills by design. |
| **VecFashion / Designers Nexus** | Vector flat-sketch templates | Verified: proprietary Illustrator (.ai) artwork libraries — hand-drawn/hand-placed flat sketches for designers who sketch by hand, gated behind email signup or purchase. Same boundary as Fashion Design Central's toolkit (already logged in TOOLS-RESEARCH.md §4): **do not copy the artwork.** Nothing here is code or a schema; it's licensed illustration content, off-thesis for a parametric engine that draws pieces from geometry, not from a sketch library. |

---

## Formalized integration plan

**Do now:** nothing — no item here is urgent or blocking.

**Do when Priority 3.1 (artwork placement) is scheduled:** adopt **Fabric.js** as
the placement-layer library. This is the one concrete, load-bearing decision from
this pass — logged in ROADMAP.md so it's settled before that slice starts, not
re-researched then.

**Keep as forward references, not tasks:** Open TechPack's `examples/std 0.1` (a
five-minute sanity-check, not adoption) and GarmentIQ (a starting point if/when
CV-based measurement is ever revisited, well post-MVP). Neither is scheduled.

**Discard, no further action:** everything in the "not usable" table. Each has a
concrete, verified reason (wrong domain, wrong license, wrong medium, or proprietary/
paid), not a vague dismissal — so if any of these resurface later, the reasoning is
already on record.
