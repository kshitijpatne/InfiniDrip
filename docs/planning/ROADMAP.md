# InfiniDrip — Product Roadmap & Commercial Plan

_Created after Slice 44. This document holds the competitive analysis, the
feature prioritisation, and the timeline to a commercial product. It is the
strategic companion to SLICES-BRIEF.md (which holds the tactical slice plan)._

_For the current maintainer-directed sequence after the active nine-phase
pre-garment program, including evidence gates, stable work-packet IDs,
conditional dates, and the complete digital capability path, use
[END-TO-END-CAPABILITY-ROADMAP.md](END-TO-END-CAPABILITY-ROADMAP.md).
`PROJECT-STATE.md` and the pre-garment packet still control what may start now._

**Rule this document inherits from RESUME-LOG.md: every claim carries an anchor,
and nothing is marked done that isn't. Estimates are marked as estimates.**

---

## 0. Where we actually are (honest baseline)

**Current committed baseline:** origin/main contains the Codex-reviewed Slice
130 exit and the 2026-09-21 surface-guidance repair at `d8996c4`; its code
integration parent is recorded at `f92e28f`. The earlier pre-repair Slice 130
view at `241732e` is not the active baseline.
Epic 5 and Epic 6 are complete; the next work is post-Epic 6 quality, release,
or deliberately selected product expansion.

**Built and proven on the committed baseline:**

- A garment-agnostic engine (draft → grade → POM → check → nest → edit → export)
  driven by a declarative GarmentRecipe, with seven registered recipes: Tee,
  Darted tee, Tank, Polo, Woven shirt, Skirt, and Trouser.
- The completed Epic 5 beginner-facing workspace: Garment, Measure, Style, Check,
  and Export stages; recovery and bounded Undo/Redo; contextual appearance;
  spatial guidance; selected-size nesting; responsive/accessibility evidence;
  and the full parsed-output/legacy-hash gate.
- SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech-pack outputs with the
  eight unchanged legacy hashes and true-scale calibration contracts.
- Epic 6 Slices 122–130: surface placement data/validation, transform math,
  Style-panel/save wiring, true-scale preview, tech-pack placement, opt-in
  calibrated print sheet, warn-only invalid-entry guidance, measured
  bounds/resolution/coverage guidance, and the cross-garment exit audit. The
  bounded serial gate passed 94 files / 1,255 tests, 100% coverage, typecheck,
  production build, parsed consumers, and the eight legacy hashes. Surface
  state remains outside geometry and cutting.
- The open-source audit is durable in
  docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md; its accepted candidates remain
  bounded test/accessibility/nesting options, not engine replacements.

**NOT proven — and this is the load-bearing gap:**
> **No garment produced by this tool has ever been cut and sewn.**

Our own checker verifies *sewability* (do seam lengths agree, is the hem square)
and explicitly **not fit**. The assembled view is logged as a schematic, not a
drape simulation. Nesting is an estimator. Every one of those boundaries was
documented honestly — but together they mean the tool's core promise ("drafts a
real, cuttable garment") is **untested against physical reality**.

This matters more than any geometry or garment-expansion feature on the wish
list. If the tee doesn't fit a real body, then 12 more garment types are 12
more things that don't fit. Test hardening and desktop distribution work can
continue independently, but no physical-fit or production-readiness claim may
be made until this constraint is reopened.

### Current Now / Next / Later decision view

This view supersedes the historical Slice 45 timeline below. It is the current
planning surface for Codex after the completed Epic 11 work and Epic 12
foundation.

| Horizon | Initiative | Status / owner | Dependencies and exit |
|---|---|---|---|
| **Done** | **Epic 6 Slices 122–130** — surface placement, preview, persistence, tech-pack/print output, measured warn-only guidance, and cross-garment exit | **Complete — Codex reviewed and pushed** | 94 files / 1,255 tests, 100% coverage, typecheck, build, parsed consumers, 8/8 legacy hashes; no physical-fit claim |
| **Done / gate recorded** | **EPIC 9 — Desktop release readiness (Slices 135–139)** | **Complete — Codex reviewed and pushed** | Windows x64 unpacked package passed offline/native-save/six-export/menu-window/fresh-stale/failure/integrity checks; repeated manifest hash; no signing, updater, installer, or cross-OS claim |
| **Done / gate recorded** | **EPIC 10 — Quality and adversarial hardening (Slices 140–146)** | **Complete — Claude contributed; Codex repaired, reviewed, and pushed** | 99 files / 1,330 tests, 100% coverage, seeded properties, test-only oracle, seven recipes, old-save compatibility, permanent fixtures, bounded concave-offset repair; no baseline movement |
| **Done / gate recorded** | **EPIC 7 — Nesting Intelligence Pack (Slices 132–134)** | **Complete — OpenCode contributed; Codex reviewed and pushed** | Additive metrics/UI/persistence around `nestPieces`; exact 10% buffer, 0–50% bounds, optional fabric-on-hand, truthful directional flag; `origin/main` `db14b63`; no geometry or export changes |
| **Done / research-only** | **Garment-expansion research wave (Slices 149–154)** | **Complete — Codex-owned; Claude contributed two isolated packets** | Four garment records plus binding synthesis; no implementation authorized |
| **Done / gate recorded** | **EPIC 11 — Polo V2 fidelity refinement (Slices 155–161)** | **Complete — Codex reviewed and pushed** | Shaped neckline-derived collar/stand, back preview, placket-base marks, side vents and adjustable back drop; see `docs/release/EPIC-11-EXIT-REPORT.md` |
| **Done / proof-only no-go** | **EPIC 8 — True-shape nesting proof and controlled redesign (Slices 162–163 admission packet, 169 exit)** | **Codex-owned; runtime deliberately withheld** | Exact source/lock/notices/hashes recorded in the [exit report](../release/EPIC-8-EXIT-REPORT.md); offline build and worker-containment gates failed; `nestPieces` remains the only runtime behavior |
| **Conditional** | **Surface v1 stabilization** — follow-up only for a reproducible defect or real user evidence | **Conditional** | Epic 6 exit evidence plus a concrete failure; no speculative polish |
| **Later / researched** | **Garment candidates** — shorts → sweatshirt → jogger → pullover hoodie → rigid jeans | **Packets researched; execution packets still required** | Shared stretched-join and lower-body boundaries in `GARMENT-EXPANSION-SYNTHESIS.md`; do not start from the research record alone |
| **Later / blocked** | **Physical fit validation** | **Blocked by maintainer constraint** | No manufacturer/printer is available; no sewn-fit claim or schedule until explicitly reopened |
| **Proof-only / reopen-only** | **Sparrow irregular nesting helper/adapter proof** | **Epic 8 no-go recorded; not authorized; not a clone or replacement engine** | Reopen only with a new packet closing pinned-toolchain, offline-build, worker-isolation, replay, validator and fallback gates |
| **Interim complete / launch-backed deferred** | **EPIC 12 — local feature lifecycle, delivery rehearsal and readiness dry-run (Slices 178–181)** | **Codex-owned; no-cost interim complete in Slice 181; Epic 12 remains In Progress for deferred launch work** | Repository/local and provider-neutral work only; existing static preview may continue; no new account, plan, domain, database, auth, email, monitoring or personal-data path |
| **Deferred until launch is explicitly reopened** | **EPIC 12 launch-backed identity, cloud workspace and public beta (Slice 175 plus provider portions of 176–178)** | **Not a current blocker; future re-entry track** | Cost approval plus the retained privacy, jurisdiction, data-region, retention, auth and support decisions are required before implementation |

### Codex next-work options

Epics 7, 9, 10 and 11 and the garment research wave are complete. Current
choices:

1. **Epic 8 proof-only/no-go exit.** Slice 162 established the owned
   reject-by-default contract and Slice 163 recorded the exact artifact/legal/
   worker evidence. Offline reproducibility and containment failed, so no
   Sparrow/Jagua invocation is admitted; current nesting stays the product
   behavior.
2. **Future garment execution packet.** If work after Polo is selected, scope
   casual shorts first. A separate upper-body sweatshirt geometry track may run
   in parallel only with disjoint files and serialized shared integration.
3. **EPIC 12 no-cost interim.** Slices 171–174 and 176–181 are complete as
   provider-neutral contracts, local proofs, the explicit cost/re-sequencing
   decision, readiness-only flag catalog, local delivery rehearsal, synthetic
   readiness drill and preview-only exit. Slice 175, remote flags, cloud sync
   and provider-backed beta work remain deferred until launch readiness and
   cost approval are explicitly reopened. Before the garment queue, hold the
   maintainer discussion on the tutorial, repository/history question, local
   delivery board, garment UI/artwork and README/ARCHITECTURE rewrite.
4. **Conditional stabilization.** Act only on a reproducible Epic 6/7 defect or
   real user evidence; no speculative polish.

Future garment work must be separately scoped before implementation. The
open-source audit does not authorize direct reuse of a drafting engine, VTO/3D
stack, or linter as a replacement for InfiniDrip's own contracts. Epic 8's
packet is now a proof-only/no-go record; its runtime may be reopened only after
the exact revisions, notices, offline artifact provenance, worker containment,
apparel constraints, deterministic fallback and benchmark gates pass.

---

## 1. Competitive analysis

### 1.1 The market has four distinct categories

Current buyer's guides split the space into: 3D garment simulation, 2D
pattern/CAD, AI design platforms, and general creative tools — and note that most
teams use a combination rather than one product. We compete in **2D
pattern/CAD**, adjacent to made-to-measure.

| Tier | Players | What they do | Our relationship |
|---|---|---|---|
| Enterprise 3D | CLO 3D, Browzwear VStitcher, Style3D | Physics drape sim, virtual sampling, photoreal render | Not competing. Different problem. |
| Enterprise 2D/production | Optitex, Lectra Modaris, Gerber AccuMark, TUKAcad | Drafting, grading, marker-making, cutting-room integration | Aspirational peer on *output*, not on price or scale |
| Made-to-measure consumer | **Tailornova**, Lekala, Sewist, Bootstrap Fashion | Pick style elements + enter measurements → custom pattern | **Direct competitor.** Closest to our product shape. |
| Open-source parametric | **FreeSewing**, Seamly2D/Valentina, **GarmentCode** (ETH) | Code- or DSL-defined parametric patterns | **Direct architectural peer.** Best calibration data. |

### 1.2 How competitors solve "many garment types + design options"

This is the crux, so it gets the most attention.

**Tailornova (the closest commercial analogue).** Users intermix and match design
elements — sleeves, necklines, silhouettes — and click an element in the design to
edit or change it, previewing each change as a flat sketch and pattern set
immediately. Output is PDF (home-printer tiled) and DXF, with selectable
industry-standard seam allowances and auto-generated step-by-step sewing
instructions. Subscription pricing (reported around $24/month at the base tier
for a pattern quota).

**Critically — user reports say the silhouettes, necklines and sleeves are fairly
basic, and stylistic changes (e.g. a gathered shoulder seam, a half placket) still
require manual pattern adaptation.** That is the honest ceiling of the
combinatorial approach, and it is a real opening for us: a smaller, deeper library
beats a broad shallow one for makers who actually sew.

**FreeSewing (the architectural twin).** JavaScript, patterns implemented as
code, explicitly supporting mixing and matching parts from different designs,
extending them, and adding options that turn one base design into many. This is
*exactly* the model the user is asking for.

**The warning is in their own engineering history.** FreeSewing's v4.5 "Library"
release exists because designers had been re-using parts from designs that were
never intended for reuse, creating a growing number of ad-hoc dependencies that
made the software really hard to maintain — with every change to a foundational
block rippling into many dependent designs. They had to introduce a curated
library layer, part re-use with independent settings, and design options scoped to
a specific part rather than the whole pattern.

> **Read that as a direct instruction to us:** if we add garments first and
> componentise later, we will build the exact dependency tangle FreeSewing had to
> refactor out of. Component architecture must come **before** the garment
> library, not after.

**GarmentCode (ETH Zurich, SIGGRAPH Asia 2023) — the strongest reference design.**
A DSL for garment modelling that applies object-oriented programming principles to
garment construction, building sewing patterns in a hierarchical,
component-oriented manner, with interchangeable parameterised components, and
automation of low-level tasks like placing a dart at a desired location. It
explicitly targets the gap we're facing: switching or combining garment elements
and doing semantic editing **while keeping the sewing pattern valid**.

It is open source (`github.com/maria-korosteleva/GarmentCode`, PyGarment), has a
public configurator, and ships a taxonomy of components. **Action: study its
component decomposition before designing ours.** We are not copying code (it's
Python, we're TypeScript) — we're adopting a validated decomposition instead of
inventing one and discovering its flaws in slice 80.

### 1.3 What "design additions" actually means — a split the brief conflates

The wish list groups embroidery, prints, pockets, buttons, zips, patches, colour
patterns and darts together. **These are two unrelated engineering problems:**

**(a) Structural details — change pattern geometry.**
Pockets, darts, plackets, collars, cuffs, yokes, zip openings, vents.
→ Adds/edits pattern pieces, alters seam lines, changes what must be checked.
→ Deep engine work. Belongs to the component architecture.
→ **Expensive.** This is most of the real work.

**(b) Surface design — does not change geometry.**
Prints, embroidery placement, patches, colour blocking, fabric patterns.
→ Artwork placed onto an existing piece, plus a placement preview and a
  print/embroidery-ready output. Geometry untouched.
→ **Far cheaper**, and highly visible to users and investors.
→ Note: our existing engine already renders pieces as SVG with named edges — an
  artwork placement layer sits on top of that cleanly.

Splitting these lets us ship visible design capability early (b) without waiting
on the hard architectural work (a). **Tailornova already does colour/fabric
audition on the flat sketch, so (b) is table stakes, not differentiation.**

### 1.4 Desktop app — the easiest item on the list

Two credible paths, both mature in 2026:

| | Electron | Tauri 2.x |
|---|---|---|
| Bundle | ~120–200 MB (ships Chromium + Node) | ~3–10 MB (uses OS WebView) |
| Backend language | JavaScript/TypeScript throughout | Rust |
| Rendering | Consistent Chromium everywhere | WebView differs per OS — needs testing |
| Updater | `electron-updater`, differential updates, industry standard | Full-binary updates, well documented |

**Recommendation: Electron.** Reasoning specific to us — we are a solo TypeScript
codebase with zero Rust exposure; guidance is explicit that teams entirely on
JS/TS with near-term shipping pressure should choose Electron, and that migrating
Electron→Tauri later is closer to a rewrite than a refactor. Tauri's win is
bundle size, which is not our bottleneck. Our app is a local-first pure-function
engine with an SVG UI — it is nearly the ideal Electron candidate.

**Non-negotiable either way: code signing.** Unsigned apps trigger macOS
Gatekeeper and Windows Defender warnings that destroy user trust. Budget for an
Apple Developer account (~$99/yr) and a Windows code-signing certificate. This is
a cost and a lead-time item (certificate issuance takes days-to-weeks), not a
coding task — **start it early because it blocks distribution, not development.**

### 1.5 Photo → pattern, and upcycling — the reality check

The brief lists "upload target garment → get build directions" and "upcycle old
clothes from photos" as secondary features. Research reality:

Recovering sewing patterns from a single image is an **active academic research
frontier**, not a product feature. The leading work (Sewformer, SIGGRAPH Asia
2023) had to synthesise a training dataset of ~1 million image-and-sewing-pattern
pairs and build a two-level Transformer to do it. Follow-on work continues
through 2025–2026 (ISP + diffusion mapping, AIpparel, GarmentCodeData,
ChatGarment) — the fact that it is still generating SIGGRAPH papers is the
signal: **it is not solved, and it is not a sprint.**

> **Verdict: cut photo→pattern from the v1 scope entirely.** Attempting it would
> consume the entire timeline and likely fail. It is a credible *research
> direction* or a *post-funding* bet, not a launch feature.

**However — there is a cheap, honest version of the same user need**, and it fits
our stated philosophy exactly ("guide the user to solve it themselves; don't
autonomously solve it"):

- **Garment measuring assistant:** user photographs/measures a garment they own,
  enters key measurements, and we tell them which of our blocks it corresponds to
  and what to adjust. Guidance, not reconstruction. **Buildable.**
- **Upcycle helper:** user enters the dimensions of usable fabric from an existing
  garment; our *existing* nesting engine already answers "what can you cut from
  this?" That's a re-skin of `nestPieces`, not new science. **Cheap and honest.**

This reframe preserves the differentiating user story while removing the research
risk. It is a genuinely good trade, not a climbdown.

### 1.6 The vendor marketplace — this is not a software problem

The brief asks for a vetted India-wide vendor database with MOQs, specialisations,
client preferences, lead times, and costs.

**Finding: that data does not exist in any structured, reliable, harvestable
form.** Every accessible source is one of: a manufacturer's own marketing page, a
listicle authored by a manufacturer to promote itself, or a sourcing agent selling
their brokerage. Sourcing guidance itself tells buyers not to ask only for a
garment MOQ but to request several distinct numbers, and notes MOQ shifts with
fabric, trims and prints — i.e. **MOQ is a negotiated, per-enquiry, per-order
variable, not a static attribute of a vendor.** The same is true of price and lead
time.

This is compounded by two findings **already in our own research** (MARKETPLACE-GOALS.md):
- Chunk 0: Sewport and Maker's Row both **failed to monetize the vendor side.**
- Chunk 2: a registry-built vendor directory **structurally serves the wrong
  customer tier** — verification and tier-fit are inversely correlated.

> **Verdict:** building this database is a **business-development operation**
> (calls, relationships, possibly staff in India, ongoing re-verification and
> liability for "vetted"), not a research or engineering task. It cannot be
> completed by analysis, and it does not belong on the software timeline.
>
> It also **conflicts with our stated product philosophy** — a one-stop-shop that
> places orders on the user's behalf is the opposite of "preserve user
> independence and full understanding." That tension needs a deliberate decision,
> not a drift.
>
> **Recommendation: decouple entirely.** Keep it as a separate track with its own
> timeline, and do not let it block or share budget with the product. The Fork B
> intermediary probe (associations, merchant exporters) remains the correct cheap
> first step, because it tests whether the channel exists before we invest in
> populating a database.

---

### 1.7 Research pass — adjacent tools, toolkits & techniques (Slice 44+)

Full report: `TOOLS-RESEARCH.md`. Verified against primary sources (vendor sites,
user tutorials, one arXiv paper); Instagram sources were inaccessible (robots-
blocked) and are not reflected below. Three findings changed how items already in
this roadmap are sequenced or scoped:

- **Maniccia's "Pants Builder"** (a live 10-step garment configurator with
  front/back preview, swatches, numeric steppers, and a running build summary —
  https://pantsbuilder.pages.dev) is independent, working confirmation that the
  stepped-journey shape F2 shipped with is the right one. No action; noted as
  validation.
- **Roughcut Patterns** independently validates two things already shipped or
  planned: A0 export is a genuine market need (F1), and per-piece built-in seam
  allowance + a difficulty grade are real, buyer-facing product signals — folded
  into Priority 0.5 below.
- **Timeless Templates' "Magic Modular System"** and the academic *Refashion*
  paper (arXiv 2510.11941) both describe swapping garment components across a
  shared interface (their "key-fitting lines" ≈ our matched-edge checker rule) —
  this is external confirmation that Priority 1's component architecture, with
  the checker verifying matched seams across a swap, is the correct shape, not a
  new idea to build.

**Second pass — a curated resource list (`apparel_design_resources.md`), verified
link-by-link.** Full catalogue: `ASSET-RESOURCES.md`. One concrete decision came
out of it (Fabric.js, folded into Priority 3.1 below); everything else was either
a reference-only pointer (Open TechPack's schema attempt, GarmentIQ as a future
CV-measurement starting point) or discarded with a verified reason — mostly 3D/ML
research repos (GarmageNet, DressCode, GarmentLab, Awesome-3D-Garments) that don't
fit a 2D, no-backend, no-CV app, plus one proprietary SDK (IMG.LY) that conflicts
with the free/no-subscription thesis, and one false positive (OpenPack — a
warehouse logistics dataset, unrelated despite the name).

### 1.8 Open-source repository pressure test — 2026-09-17

Full evidence, license analysis and reject ledger:
`OPEN-SOURCE-REPOSITORY-AUDIT.md`. This pass inspected the product-owner-supplied
OpenPattern, GarmentCode, virtual-try-on, cloth-simulation and deepFashion3D
sources; both sewing-pattern topic pages; the apparel-design topic; the general
awesome index; and adjacent candidates discovered from them.

The result is deliberately narrower than the input list:

- no external garment engine replaces the completed Epic 4 grammar. GarmentCode
  independently confirms the component/interface/stitch shape already shipped;
  only optional orientation, projected-ease correspondence and compatibility
  metadata remain as consumer-triggered additions;
- OpenPattern is GPL-3.0, Python-coupled and provenance-sensitive because its
  formulas follow named commercial patternmaking authors. deepFashion3D is a
  gated, code-free CC BY-NC 4.0 dataset. Neither is an integration source;
- virtual try-on and cloth simulation remain different products with GPU/model,
  dataset/privacy, licensing and 3D-validation costs. Nothing in those directories
  reopens the existing cut list;
- the high-synergy findings sit at existing clean seams: automated accessibility
  evidence, property-based test generation, an independent geometry oracle, and
  a future deterministic irregular-nesting worker.

This pass adds the bounded backlog rows below. It does not displace Slice 119B,
120 or 121, authorize a runtime dependency, or move an export baseline.

## 2. Prioritisation

Scored on: **multiplier effect** (does it make later work cheaper?), **risk
retired**, **user-visible value**, and **cost**.

### Priority 0 — De-risk before building (do first, cheap, non-negotiable)

| # | Item | Why first | Est. |
|---|---|---|---|
| 0.1 | **Sew a physical tee from our own export** | Retires the single largest unvalidated assumption in the project. If it fails, everything downstream changes. Costs one afternoon and some cheap fabric. | 1–2 slices + real-world time |
| 0.2 | **Desktop packaging spike (Electron)** | Converts "locally hosted webpage" → downloadable app. Cheap, high perceived value, unblocks all user testing. | 2–3 slices |
| 0.3 | **Start code-signing certificate procurement** | Lead-time blocker, not dev work. Start the clock now. | admin, parallel |

**0.1 is the highest-value action available to this project right now, and it
was not on the original list.**

### Priority 0.5 — Small independent wins (research-derived, ~S effort each)

All of these are refinements to already-shipped engine code (nesting, seam
allowance, checker, tech pack), independent of Priority 1, and small enough that
none should block or displace it. **Per MVP-PLAN.md's own rule ("scope is fixed
… anything not in §3 does not get built before launch"), none of these are
scheduled into the fixed 6-month plan by default** — logged here as a vetted,
ready-to-pull backlog. EPIC 7 is the explicit conscious decision to implement
0.5.1–0.5.4 now without changing the underlying nesting algorithm.

| # | Item | Rides | Natural attach point | Status |
|---|---|---|---|---|
| 0.5.1 | **Waste-% readout** on the nesting view | nesting (shipped) | anywhere — fully independent | **Complete in Epic 7 / Slices 132–134** — exact utilization-derived readout |
| 0.5.2 | **Fabric-first "will it fit?"** — enter fabric on hand, get fits/short-by-X + layout | nesting (shipped) | same as 0.5.1 | **Complete in Epic 7** — optional positive length, blank means unknown |
| 0.5.3 | **Nap / directional-print flag** in nesting | nesting (shipped) | bundle with 0.5.1 | **Complete in Epic 7** — truthful advisory, no rotation |
| 0.5.4 | **Cutting-buffer setting** (default ~10–15%, editable) | fabric estimate | bundle with 0.5.1 | **Complete in Epic 7** — 10% default, 0–50% bounds |
| 0.5.5 | **Per-edge variable seam allowance** (hem ≠ fly ≠ waistband) | seam-allowance engine | Priority 2.3 trouser (fly/waistband need it anyway) | Backlog |
| 0.5.6 | **Checker rule: new seamline has seam allowance** | checker (shipped) | Priority 1.1/1.2 (components create new seamlines) | Backlog |
| 0.5.7 | **Seam & stitch type notation** on pattern + tech pack (original artwork only — do not copy Fashion Design Central's assets) | tech pack, named edges | anywhere | Backlog |
| 0.5.8 | **Garment difficulty rating (01–05), per garment** — tee=01, skirt=02… | recipe metadata | surfaced in Month 6 onboarding | Backlog — sequencing confirmed: **per-garment, not per journey-step** |
| 0.5.9 | **Named customisation axes** presentation (Knitup-style) | journey UI (shipped) | Month 6 onboarding | Backlog |
| 0.5.10 | **In-app "101" education hub** | content, not code | Month 6 (already scopes docs/help) | Backlog — content cost, not slice cost |
| 0.5.11 | **Back view in the Body view tab** (all garments) — the identical derivation already used for front (walk the piece's outer edges relative to a croquis), applied a second time to the back piece. Real derived geometry, same honesty tier as front. Industry-verified as the true minimum: professional flats standardise on front+back, side is a situational add, not a universal one. | body-figure rendering (shipped, per-garment) | anywhere — fully independent, no component-architecture dependency | **Approved** — pull in whenever convenient |
| 0.5.12 | **Automated accessibility evidence** — trial `axe-core` in the existing Playwright harness, without treating automation as complete accessibility | Slice 121 final gate | existing manual keyboard/focus/zoom/viewport audit | **Accepted trial** — dev-only; triage findings and retain manual evidence |
| 0.5.13 | **Property-based drafting/guidance regression** — bounded, seeded `fast-check` generators whose failures become permanent fixtures | test harness only | first separately scoped post-Epic-6 quality slice | **Accepted trial** — no production import; remove if it only duplicates fixtures |
| 0.5.14 | **Independent flattened-geometry oracle** — `@flatten-js/core` intersections/containment/validity in tests, never as drafting truth | test harness only | with 0.5.13 or a later demonstrated geometry defect after Epic 6 | **Accepted trial** — flattened loops only; no output-byte changes |
| 0.5.15 | **Irregular fabric nesting proof** — optional deterministic Sparrow worker returning seed + transforms, followed by owned constraint validation and shelf-packer fallback | current nesting/export boundary | only after 0.5.2–0.5.4 define grain/nap/fold/pair/clearance semantics | **Epic 8 proof-only/no-go** — artifact/offline-worker gates failed; reopen only with a new admission packet |
| 0.5.16 | **Richer seam-interface semantics** — first add a ratio-aware stretch-to-fit join for user-owned band/cuff lengths; later optional stitch side/orientation, per-section correspondence/projected ease and option compatibility only when consumed | completed component grammar | first banded sweatshirt execution packet; also serves jogger cuff and later Polo sleeve band | **Triggered, not implemented** — reports path ratio, never invents recovery or reuses absolute-cm `Stitch.ease`; independently specified TypeScript, not a GarmentCode port |

### Priority 1 — The multiplier (architecture before library)

| # | Item | Why | Est. |
|---|---|---|---|
| 1.1 | **Component architecture** — decompose recipes into interchangeable parameterised components (bodice / sleeve / collar / cuff / waistband / closure) with scoped options | **Completed in Epic 4.** GarmentCode's decomposition was studied and confirms the shipped direction; no external runtime or rewrite is warranted. | completed |
| 1.2 | **Structural detail primitives** — dart placement, pocket application, placket, vent | These are the shared vocabulary all garments need. Belongs with 1.1, not after. | 8–15 slices |
| 1.3 | **Side view + croquis-library split** — deliberately bundled into this phase, not built separately: a shared, engine-level croquis library (`{upper-body, lower-body} × {front, side, back}`, six reusable figures) decoupled from garment-specific silhouette derivation, so no recipe ever draws a body. Front/back derivation is the existing edge-walk pattern (0.5.11) applied uniformly; **side is a separately-named function** — a labelled schematic approximation from flat measurements (chest/hip ease → stand-off, length → hem drop, hem circumference → flare), carrying the same "schematic, not simulation" honesty label as the assembled view, never conflated with the front/back derivation. A `bilaterallySymmetric` flag (default true) lets the engine mirror one side view instead of computing two identical ones — true for every garment drafted so far; a future asymmetric garment can flip it. **Why bundled here and not built standalone first:** it answers the same "how does a body-region figure generalise across garments" question Priority 1.1 is already solving — building it against today's per-garment recipes and rebuilding it after the refactor is the exact throwaway-work risk FreeSewing's Library refactor already warns us about (§1, ROADMAP context). | fold into the 1.1 design doc; no separate estimate |

**This is the hardest and least glamorous phase, and skipping it is the single
most likely way this project fails.** External confirmation this shape is right:
Timeless Templates' modular pattern system and the *Refashion* paper (arXiv
2510.11941) both build garments from swappable components across a shared
interface — our version of that interface is the checker verifying matched edges
across a swap (0.5.6 above, and the checker's existing matched-seam-length rule).
Cross-recipe component swapping itself is not new scope; it is what 1.1 already is.

### Priority 2 — Garment library (in dependency order, not wish-list order)

Ordered so each block unlocks several garments:

| Order | Block | Unlocks | Est. |
|---|---|---|---|
| 2.1 | **Woven shirt block** (collar + stand, placket, cuff, yoke) | Button-up (long/short sleeve), blouse, overshirt | 15–25 slices |
| 2.2 | **Knit top variants** (extends existing tee) | Polo (needs placket+collar from 2.1), tank, women's tops | 8–12 slices |
| 2.2a | **EPIC 11 Polo V2 fidelity refinement** — shaped neckline-derived collar/stand, truthful back-neck representation, placket-base clip/reinforcement marks, side vents and adjustable dropped back hem. Sleeve rib, material-dependent turn-of-cloth and manual point grading are explicitly deferred. | Polo V2 / upgraded Polo | Research/packet complete in Slice 148; Epic 7 gate satisfied; Slices 155–161 await scheduling |
| 2.2b | **Edit-view final-design contract** — if exploratory front editing is promoted to a final-design override, add a durable design-state model, define persistence and size/grading semantics, route validation/nesting/preview/export through it, and verify every output; otherwise retain the explicit preview-only contract | Edit workflow | Decision gate after Phase C3; model change is mandatory before claiming edits affect final outputs |
| 2.3 | **Shipped trouser block plus researched derivatives.** Casual woven shorts require an upper-block/short-continuation split (7–9 slices). Adult knit joggers require a pull-on casing, user-fit elastic, pockets and taper (5–7; rib cuff +2–3). Do not develop both lower-body sources of truth concurrently. | Casual pants, shorts, joggers, formal-trouser base | shipped base; researched derivatives |
| 2.4 | **Rigid five-pocket denim variant** — relaxed straight leg, real back yoke, scoop pockets/facings/linings/coin pocket, asymmetric zipper fly, back pockets, two-layer straight waistband, loops and marks. Stretch, shrinkage automation and washes are deferred. | Jeans | research complete; 11–14 slices after lower-body derivatives stabilize |
| 2.5 | **Cut-and-sew sweatshirt then pullover hoodie** — adult set-in crewneck with real user-sized rib bands and ratio-aware stretched joins (6–9), then two-piece lined hood plus kangaroo pocket (+5–8). Zip front, raglan and fully-fashioned knitting are separate later domains. | Sweatshirt, pullover hoodie | research complete; execution packet required |
| 2.6 | **Tailored jacket** (2- or 3-piece sleeve, lapel roll line, welt pockets, canvas) | Blazer, jacket | 25–40 slices |

**Note on 2.6:** tailoring is a master-craft domain. It is correctly *last*, and
is a candidate to cut from v1 entirely. The crotch curve in 2.3 is the hardest
single curve in patternmaking and should be expected to take longer than it looks.

### Priority 3 — Surface design (cheap, visible, parallelisable)

| # | Item | Est. | Current status |
|---|---|---|---|
| 3.1 | Artwork placement layer (prints, patches, colour blocking) on existing SVG pieces — Fabric.js remains a verified but unneeded optional proof, not a runtime dependency | 6–10 slices | **Complete in Epic 6:** Slices 122–130 provide the model/UI/preview/output/guidance/exit; surface remains geometry-independent |
| 3.2 | Print/embroidery-ready output + placement spec in tech pack | 4–8 slices | **Complete in Epic 6:** Slice 127 shipped calibrated print sheet and tech-pack placement; embroidery machine formats remain out of scope |

Can run in parallel with Priority 2 because it doesn't touch geometry.

### Priority 4 — Differentiators (after the core is real)

| # | Item | Est. |
|---|---|---|
| 4.1 | Garment measuring assistant (guidance-based, not CV reconstruction) | 8–12 slices |
| 4.2a | **Upcycle helper — honest version, build first.** A guided "clone your favourite garment" flow: the app coaches which flat measurements to take off a garment the user already owns (fold flat, measure armhole, etc.), takes those as the `measurements` object, drafts parametrically, runs existing plausibility checks. No photo/scan input. | 5–8 slices |
| 4.2b | **Upcycle helper — nuanced version, later.** Photo/CV-based garment reconstruction. Confirmed to come *after* 4.2a, not in parallel — same "cannot honestly replicate without real capability" boundary as §1.5. | — (research-grade; see §1.5) |
| 4.3 | **Zero-waste garment recipe** — a recipe drafted from rectangles/geometry, parameterised by measurements *and* fabric width, with a waste-% target. **Tracked, not scheduled.** Blocked on an architectural decision, not a feature decision: fabric width would need to become a first-class *draft-time* input (today it's export/nesting-time only). Flagged in §5 so it isn't rediscovered mid-slice. Reference point for honesty: practitioners report <2% scrap vs a 15–20% industry average — a real number to hold ourselves to if this is ever built. | untracked — architecture question first |
| 4.4 | **Dense production-art library (G17)** — a curated, fashion-use-specific, rights-verified and searchable asset collection; keep reference images distinct from clean production art and verified repeat tiles. Sequenced after all already-scoped G01–G16 work; backlog only, with scope and cost gates to be reopened before implementation. | future backlog — see `ARTWORK-LIBRARY-G17-QUEUE.md` |

### Cut from v1

- **Photo→pattern reconstruction** (research-grade; §1.5)
- **Vendor marketplace database** (not software; separate track; §1.6)
- **3D drape simulation** (competing with CLO/Browzwear is not winnable)
- Possibly **tailored jacket** (2.6) depending on schedule

---

## 3. Timeline — and why 4–6 months does not fit the stated scope

### 3.1 The calibration data we have

We have unusually good velocity data, from our own repo:

- **44 slices** completed to date.
- The **skirt bridge took 9 slices** (35–43) — and that was for the *simplest
  possible* second garment family (two panels, no sleeve, no collar, no closure),
  on an engine already designed to accept it.

A button-up shirt is not 1× a skirt. Collar + stand + placket + cuff + yoke is
conservatively **5–8× the geometry**, plus new checks, new POMs, new grading rules.

### 3.2 Honest arithmetic

Summing the estimates above (excluding cut items):

| Phase | Slices (est.) |
|---|---|
| P0 de-risk | 3–5 |
| P1 architecture | 20–35 |
| P2 garment library | 79–127 |
| P3 surface design | 10–18 |
| P4 differentiators | 13–20 |
| Beta hardening, bug-fix, docs, packaging polish | 20–30 |
| **Total** | **145–235 slices** |

Against 44 slices of history, that is **3–5× everything built so far.**

> **Conclusion: the full stated scope is a 2–3 year solo effort, or roughly
> 9–15 months for a small funded team. It is not 4–6 months.**
>
> Stating otherwise to an investor would be the same failure mode this project
> has spent 44 slices engineering against: a confident claim with no evidence
> behind it. The discipline that found the SVG export bug and the silhouette bug
> applies here too.

### 3.3 What 4–6 months *can* realistically deliver

The timeline is achievable — for a deliberately narrowed product. **This is the
recommended plan.**

**Target: a commercially credible, narrow, genuinely excellent product**, not a
broad shallow one. Our competitive analysis says this is also the *better market
position*: Tailornova is already broad-and-shallow, and users report its style
options are basic enough to require manual pattern adaptation. Beating it on
depth for a focused segment is winnable. Beating it on breadth is not.

| Month | Focus | Exit criterion |
|---|---|---|
| **1** | P0 de-risk + Electron packaging + signing started | A physically sewn tee that fits. A signed installer someone can download. |
| **2–3** | P1 component architecture + structural primitives | Tee/fitted/skirt re-expressed as components; adding a variant is hours, not a slice-run. |
| **4** | P2.1 woven shirt block + P2.2 knit variants | 6–8 real garment types (tee, fitted, polo, tank, button-up ×2, blouse, skirt) |
| **5** | P2.3 trouser block + P3.1 surface design | Pants/shorts/joggers + prints & colour blocking |
| **6** | Beta hardening + recruited beta testers + feedback loop | 10–20 real makers who have sewn a garment from the tool and said so on record |

**Explicitly deferred past month 6:** hoodie/zip, tailored jacket, jeans variant,
differentiators (P4), and everything in the cut list.

### 3.4 Non-negotiable conditions for even that plan

1. **Beta testers must actually sew.** "Vetted client testaments" are worthless if
   the testers only clicked around. Recruit from sewing communities, and require a
   finished garment photo. Budget fabric costs for testers.
2. **Physical validation gates every garment block.** No block ships until one has
   been sewn. This will slow us down and it is the reason anyone will trust us.
3. **The vendor track must not consume product time.** Separate track, separate
   budget, or it silently eats the roadmap.
4. **Beta recruitment starts month 3, not month 6.** Testers take time to find.
5. **Scope is defended.** Every new feature request gets measured against this
   document, not added by enthusiasm.

---

## 4. Immediate next actions (Slice 45 onward)

1. **Slice 45: physical validation kit** — export a tee at real measurements,
   print/assemble at true scale, sew it, document the fit result honestly
   (including if it fails). This is the highest-value slice available.
2. **Slice 46–48: Electron packaging** + signed installer.
3. **Parallel, non-slice: begin code-signing certificate procurement.**
4. **Parallel, non-slice: read GarmentCode's component decomposition** before
   designing P1.
5. **Then: component architecture design doc, reviewed before any code** — this is
   an architectural fork and, per our own working rules, tensions get flagged
   before building, not discovered mid-slice.

---

## 5. Open strategic questions (need decisions, not analysis)

1. **Who is the customer?** Home sewers (Tailornova's market, subscription,
   low ACV, high volume) or small brands/manufacturers (higher ACV, needs the
   vendor layer, longer sales cycle)? **The roadmap changes materially depending
   on the answer, and it hasn't been decided.**
2. **Does the marketplace belong in the product at all**, given it conflicts with
   the stated "guide, don't solve for them" philosophy and that two prior entrants
   failed to monetize it?
3. **Is the tailored jacket in or out of v1?** It is ~25–40 slices for one garment.
4. **Open-source posture?** FreeSewing and GarmentCode are our architectural peers
   and both are open. Competing against free requires a clear reason to pay.
5. **Should fabric width become a first-class draft-time input?** Not needed for
   anything currently scoped — today it's an export/nesting-time parameter only.
   It *would* be needed for 4.3 (zero-waste recipe). Not blocking; flagged now so
   it's a conscious decision when 4.3 is revisited, not a surprise mid-slice.
