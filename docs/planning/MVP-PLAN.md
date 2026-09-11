# InfiniDrip — MVP Execution Plan (v1 Launch)

_Created after Slice 44. **This is the operative plan.** ROADMAP.md remains the
strategic reference (competitor analysis, full long-term scope, cut list); this
document is what we actually execute against for the next 26 weeks._

**Governing rule: scope is fixed, date is fixed, depth is the variable.** Anything
not in §3 does not get built before launch, regardless of how good the idea is.

---

## 1. Velocity — measured, not estimated

From `git log` on origin/main:

| Window | Slices | Calendar days | Rate |
|---|---|---|---|
| Slice 1 (2026-06-20) → Slice 43 (2026-08-25) | 44 | 66 | **4.7 / week** |
| Slice 1 → Slice 42 (2026-08-06), excluding the late gap | 42 | 47 | **6.3 / week** |
| Slice 42 → 43 | 1 | 19 | (real life happens) |

**Planning rate: 4.5 slices/week.** Deliberately below the historical average,
because that average already includes one long gap and there will be others.

**Budget: 26 weeks × 4.5 = ~117 slices.**
**MVP scope estimate: 94–155 slices.**

> Six months is achievable **at the low-to-mid end of the estimate range, with no
> slack.** Four months is not achievable. Every scope addition pushes the date.

Calendar risk that is *not* slice-shaped and must be tracked separately:
- Physical sewing turnaround (fabric, cutting, sewing, measuring) — days per cycle.
- Code-signing certificate issuance — days to weeks. **Start week 1.**
- Beta tester recruitment and their sewing time — weeks. **Start month 3.**

---

## 2. What the MVP is

**Promise (the one sentence everything is measured against):**

> Design a garment from a real component library, fit it to your own
> measurements, and export true-scale cutting files that produce a garment which
> actually fits — as a desktop app you download and own.

**The three things that must be true at launch:**
1. **It fits.** A garment sewn from our export fits the body it was drafted for.
   Verified physically, on every block we ship.
2. **It's a real app.** Signed, downloadable, installs and runs offline.
3. **There are real design choices.** Not 10 fixed garments — a component system
   where sleeve × neckline × collar × length × cuff combine.

**Positioning (from ROADMAP §1.2):** Tailornova is broad-and-shallow, and its
users report the silhouettes, necklines and sleeves are basic enough that
stylistic changes still need manual pattern adaptation. We win on *depth and
correctness in a narrower band*, not on breadth. The physical-fit guarantee is
the differentiator no competitor in our tier advertises.

---

## 3. Scope

### 3.1 In — garment blocks

| Block | Garments it yields |
|---|---|
| Knit top (have: tee, fitted) | Tee, fitted tee, tank, long-sleeve tee |
| Woven bodice + collar/placket/cuff | Button-up shirt (short + long sleeve), blouse, women's woven top, **polo** (knit body + woven placket/collar) |
| Skirt (have) | Straight skirt, variants by length |
| Trouser | Casual pants, joggers, shorts |

**~10–12 named garments**, but the honest marketing number is combinatorial:
sleeve type × sleeve length × neckline × collar × cuff × body length × fit ease.

### 3.2 In — components (the actual product)

Sleeve (set-in / raglan / sleeveless; short / ¾ / long) · Neckline (crew / v /
scoop / boat) · Collar (shirt collar + stand / polo) · Placket · Cuff · Waistband
· Pocket (patch / inseam) · Dart placement · Hem & vent

### 3.3 In — surface design (non-geometric, parallelisable)

Prints, patches, colour blocking, fabric preview, placement spec into the tech
pack. **Not** embroidery machine formats (DST/PES) — that's a v2 file-writer.

### 3.4 In — platform

Electron desktop app, signed installers for Windows + macOS, offline-capable,
native file save, auto-update scaffold.

### 3.5 Explicitly OUT of MVP

Hoodie / zip jacket · tailored blazer · jeans (denim-specific) · photo→pattern
reconstruction · upcycle helper · measuring assistant · vendor marketplace ·
3D drape simulation · embroidery machine file formats · mobile · cloud sync ·
multi-user.

**These are not cancelled. They are the post-launch 2–3 year roadmap, to be built
by a team.**

---

## 4. The six months

Each month has an **exit criterion** that is objectively pass/fail. If a month
misses its exit criterion, the response is to cut scope from a later month, not
to slip the date.

### Month 1 — De-risk and containerise (~18 slices)

Why this order: packaging early means every subsequent slice is built *inside*
the real shipping environment. Discovering at month 6 that file-save, offline
assets, or print paths break under Electron would be catastrophic. Same principle
as "test the format, not the output" — ship the container first, then fill it.

- **Fit Validation Loop** (S45–46) — build it as a *reusable engine feature*, not
  a one-off: export at a real person's measurements, then record the finished
  garment's actual measurements against the POM predictions. Every future block
  reuses this harness.
- **Sew the tee.** Offline. Record the result honestly, including failure.
- **Electron shell** (S47–50) — main process, native file save replacing browser
  download, app menu, window state, auto-update scaffold.
- **Signing procurement started** (admin, week 1).

**Exit: a physically sewn tee that fits, and a signed installer a stranger can
download and run.**

### Months 2–3 — Component architecture (~40 slices)

The multiplier. Skipping or rushing this is the single most likely way the
project fails (ROADMAP §1.2 — FreeSewing had to refactor exactly this).

- **Design doc first, reviewed before any code.** Architectural forks get flagged,
  not discovered mid-slice. Study GarmentCode's decomposition first.
- Re-express tee / fitted / skirt as components. **Byte-identity gate applies:**
  the refactor must produce identical output to today's recipes.
- Structural primitives: dart placement, pocket application, placket, vent.
- Component-aware checks, guidance, grading, POM.
- **Side view + shared croquis library** (ROADMAP.md Priority 1.3) — a body-view
  requirement folded into this design doc rather than built separately, since it
  answers the same "how does a body-region figure generalise across garments"
  question this refactor is already solving. Ships as part of this phase's exit,
  not before.

**Exit: adding a garment variant (e.g. long-sleeve tee, tank) takes hours, not a
slice-run. Existing three garments byte-identical.**

### Month 4 — Woven shirt + knit variants (~18 slices)

- Woven bodice block; collar + stand; placket; cuff; yoke.
- Tank, long-sleeve tee, polo, blouse via components.
- **Sew one button-up.** Block does not ship unvalidated.

**Exit: 8+ garments, one physically validated woven shirt.**

### Month 5 — Trousers + surface design (~18 slices)

- Trouser block. **Budget extra for the crotch curve — it is the hardest single
  curve in patternmaking and will take longer than it looks.**
- Pants / joggers / shorts.
- Surface design layer (parallelisable; doesn't touch geometry).
- **Sew one trouser.**
- **Beta recruitment already underway since month 3.**

**Exit: 10–12 garments, prints/colour working, trouser validated.**

### Month 6 — Beta and hardening (~23 slices)

- Onboarding for a first-time user who is not us.
- Bug-fix from beta feedback (reserve genuine capacity — this always overruns).
- Docs, sewing instructions, help.
- **10–20 real makers who have sewn a garment and said so on record with photos.**

**Exit: launch-ready build + testimonials from people who actually sewed.**

---

## 5. Building for the team you'll hire

You plan to hire post-launch. **The component architecture is the hiring plan** —
it's the seam along which work divides. This is not speculative: we have already
proven it once. The Fable epic shipped F1 (real-world exports) and F2 (guided
journey) onto a 445-test codebase with a **file-ownership map that held — no
engine, drafting-recipe, or guidance-logic file was touched** — and merged clean
with coverage intact.

Design months 2–3 so that after launch:
- One dev owns **components** (new sleeves, collars, cuffs).
- One owns **garment blocks** (new families).
- One owns **platform** (Electron, packaging, updates).
- One owns **surface/UI**.
These touch disjoint files. That's only true if the architecture makes it true.

**Keep the non-negotiables when the team grows:** 100% coverage gate, byte-identity
regression hashes, verify-against-fresh-clone, and never letting an agent edit
tests to make them pass. These are what make parallel work safe.

---

## 6. Risks and kill criteria

| Risk | Signal | Response |
|---|---|---|
| **The tee doesn't fit** | Month 1 sew test fails badly | **Stop the roadmap.** Fix the drafting model before anything else. This is why it's first. |
| Component architecture overruns | Month 3 exit missed | Cut trousers from MVP; ship tops + skirt only |
| Crotch curve eats month 5 | Trouser block not validated by week 22 | Ship shorts only, defer full trousers |
| Beta testers don't sew | Few finished garments by week 24 | Pay for fabric; recruit from sewing guilds, not general users |
| Scope creep | Any new feature request | Measure against §3. Default answer is post-launch. |

**Hard rule: no garment block ships without one physically sewn validation.** This
will slow us down and it is the entire reason anyone will trust the product.

---

## 7. Decisions still needed (not blocking week 1)

1. **Customer confirmation.** The MVP scope implies **indie makers / home sewers**
   — self-serve, download-and-use, no vendor layer, design-choice-led. That is
   consistent with everything stated, but it should be a conscious choice, not a
   default, because it sets pricing, distribution, and who we recruit for beta.
2. **Pricing model** — one-time purchase (fits "download and own", local-first
   philosophy) vs subscription (fits competitors; Tailornova is ~$24/mo tier).
   Needed by month 4 for beta messaging.
3. **Open-source posture** — FreeSewing and GarmentCode are free and are our
   architectural peers. We need a clear answer to "why pay for this." Current best
   answer: *verified physical fit + a real app + coached workflow*. Needs testing
   with beta users.
4. **Vendor track** — runs separately or pauses entirely until post-launch. Must
   not draw from the 117-slice budget.
5. **Fabric width as a draft-time input** — not needed for anything in §3; would
   be needed for a future zero-waste recipe (ROADMAP.md §2 Priority 4.3, tracked
   not scheduled). Flagged now, decide later.

**One small, explicit exception to "scope is fixed":** a waste-% readout on the
existing nesting view (ROADMAP.md §2, Priority 0.5.1) is approved as a pull-in-
whenever-convenient addition — it rides already-shipped code, touches no file on
the Priority 1 critical path, and is not scheduled into a specific month. Nothing
else from the Priority 0.5 research backlog is scheduled; each needs its own
conscious pull-in, same as any other scope addition.

---

## 8. Immediate next actions

1. **Slice 45: Fit Validation Loop** — POM-prediction-vs-actual harness + true-scale
   export for a real person's measurements + fit-record sheet.
2. **This week, non-slice: start code-signing certificate procurement.**
3. **This week, non-slice: read GarmentCode's component decomposition.**
4. Slices 46–50: sew test recorded, then Electron shell.
5. **End of month 1: component architecture design doc, reviewed before code.**
