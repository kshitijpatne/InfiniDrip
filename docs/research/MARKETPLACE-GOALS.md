# InfiniDrip — Marketplace Goals (vendor layer)

_Secondary track. NOT in active development. Research is async, chunked, and
prompt-triggered only — do nothing here unless the user explicitly says to run a
chunk._

## What this is
A future "design → make" layer: once a user has a complete design + tech pack ready
to export, connect them to **verified vendors** (manufacturers, material sources,
and the rest of the garment supply chain) instead of leaving them to hunt the open
web and hit dead-ends.

**Strategic thesis (UNDER TEST).** The tech pack is only step 1 — a design isn't
"done" until someone can physically make it. Monetize the **vendor side** (lead-gen
for qualified designer traffic) so the app stays **free for designers**. This is the
natural other half of the tech-pack export (build roadmap #15). Chunk 0 found both
incumbents failed to make vendor-pays work; this is now an open question, not a
premise.

**Honest framing.** This is a different product surface from the lightweight, local,
free design tool — it needs a backend, real vendor relationships, and business
development. Treat it as a separate surface, not a slice.

## Status
Planning. **Chunk 0 complete** (India — trust-signal audit).
**Chunk 1 complete** (India — GOTS registry harvest, tee-capable CMT).
**Chunk 2 complete** (India / Tirupur — recall problem: sizing the non-GOTS
population). Fork B chosen; the outreach pilot (Fork A) is deferred as an async task.
Next: **Chunk 3** — the outreach pilot, OR an association/intermediary-channel probe
(see Chunk 2 verdict). Decision pending priority/urgency.

## Locked scope
- **Geography:** one country per chunk — no global clutter, no quality compromise.
  India first; then sequence outward by vendor-base size; niche countries last.
- **User tier:** **indie brands doing 100–300pc runs.** (Moved up from hobbyist
  after Chunk 0: the sub-100pc tier is almost entirely unverifiable.) Scaling
  brand later.
- **Revenue model:** **OPEN QUESTION, not a premise.** Free-for-designers is a
  hypothesis the research must validate or kill. Both incumbents charge designers.

## Chunk 0 findings (India — trust-signal audit)
- **No open-web ranking data exists.** Every "top low-MOQ manufacturer in India"
  source is either factory self-promotion or an SEO listicle written by someone
  selling tech-pack services. The old schema's "reviews / satisfaction / on-time
  record" columns have **no source**. Do not fill them from marketing copy.
- **The checkable signals are audit records, not sentiment:**
  - GOTS public database — free, and (Chunk 1) programmatically queryable.
  - Open Supply Hub — free web tool. **API requires auth even for reads**
    (verified: HTTP 401 on `/api/facilities` and `/api/countries`). Bulk access
    is a paid subscription.
  - OEKO-TEX / WRAP / SA8000 — public issuer registries. (OEKO-TEX buying-guide
    data is behind a captcha-gated iframe — not cleanly harvestable; Chunk 2.)
  - India MCA / GST filings — proves the legal entity exists.
- **Ceiling on the word "verified."** These registries prove a third party audited
  a facility on a date. GOTS itself states its entries are not definitive proof —
  you ask the vendor for the Scope Certificate. Never promise more.
- **Revenue thesis under pressure.** Sewport (UK, 2017; £650K seed, no round since)
  and Maker's Row (US, 2012; Index/Comcast-backed, 300k+ businesses connected) both
  ended up charging the **designer** — Maker's Row now sells contact credits to
  brands. "Why will vendors pay, when the two biggest attempts couldn't?" must be
  answered before country #2.

## Chunk 1 findings (India × tee-capable CMT — registry harvest)
**Method.** The GOTS certified-supplier search is a thin front end over a public
JSON API (`global-trace-base.org/website-api/v2/certified-suppliers`). No auth, no
key. Accepts `country`, `field_of_operation`, `product_category`, `q`; a detail
endpoint returns address, city, state, licence numbers, certification body, fields
of operation, and product details down to a garment code. Harvested all India ×
Manufacturing records (1,333) and pulled full detail on each.

**The funnel.**

| Filter | Count |
|---|---|
| India, all GOTS-certified entities | 3,154 (27% of 11,780 worldwide) |
| … field of operation = Manufacturing | 1,333 |
| … makes T-shirts / singlets (PD0007) | 712 (53%) |
| … **and** "Manufacturing" only — CMT proxy, not vertically integrated | **148** |
| … **and** reachable (usable website or email on file) | **72** |

GOTS manufacturing entities by country: India 1,333 · Bangladesh 685 · China 656 ·
Turkey 445 · Portugal 284 · USA 25. Right country, confirmed.

**Geography.** Tamil Nadu holds 712 of 1,333. Tirupur alone is 388 once you
normalise `Tirupur` / `Tiruppur` / `TIRUPUR` — which the registry does not do.

**Three hard limits it exposed:**
1. **GOTS carries no MOQ and no lead-time.** The two columns that define our tier.
   No public registry has them. Outreach only.
2. **High precision, low recall.** GOTS certifies organic processing; a conventional
   tee CMT shop is invisible. (Chunk 2 quantifies the recall gap.)
3. **Only 34% of records carry any contact detail** (~28% of listed websites are
   junk like a bare `https://`).

**Artifact.** `india-tee-cmt-gots.csv` — 148 rows, T1-verified, reachable-first.

## Chunk 2 findings (Tirupur — the recall problem, Fork B)
**Question.** GOTS gave a precise numerator (388 Tirupur mfg facilities) with unknown
recall. What is the denominator — the true tee-capable CMT population — and where does
our 100–300pc tier actually live inside it?

**Denominator, layered (credible cluster studies, not marketing pages):**

| Layer | Count | Source |
|---|---|---|
| GOTS-certified manufacturing (our list) | **388** | our harvest |
| TEA member **exporters** | **1,360** (Jan 2026; 1,316 in 2024) | official (tea-india.org) |
| Manufacturer-exporters | ~800 | Sripuram Trust study |
| Merchant exporters | ~1,200 | Sripuram Trust study |
| **Job-work garment (CMT) units** | **~1,800** | Sripuram Trust study |
| MSMEs in cluster (majority do job work) | ~3,200 | BEE/UNIDO cluster program |
| Dyeing / supporting units | 425 / ~3,085 | Sripuram Trust study |

_(Marketing pages claim 10,000–20,000 "units" — that counts the whole value chain
incl. spinning/knitting. Not used as a garment denominator.)_

**The core result — verification and tier-fit are inversely correlated.**
- 90% of TEA's exporting units are MSMEs, yet **100 units contribute 50% of
  Tiruppur's knitwear exports.** The registry/verification layer (GOTS 388, TEA
  1,360) captures the concentrated **head** of the market.
- Our tier (100–300pc) is served by the **~1,800 job-work CMT shops** — the long
  **tail** that (a) doesn't hold the buyer relationship, so carries no GOTS;
  (b) isn't a TEA member (TEA = exporters); (c) has almost no web presence.
- GOTS's 388 against ~1,800 job-work units is a **~21% recall ceiling, and the real
  figure is far lower** because the 388 skew to exporters, not job-workers.
- **Conclusion:** a registry-built directory is a directory of *exporters who mostly
  want 500+ MOQ* — the wrong tier. The right-tier supply is structurally invisible
  to every public data source. This is not a "harvest more registries" problem; the
  data does not exist publicly.

**New, constructive angle — intermediaries as a cold-start channel.**
The associations (KNITMA, TEKPA, SIHMA, TEAMA) and the ~1,200 merchant exporters
exist precisely to broker the job-work shops. They are aggregators who already hold
the tier/MOQ knowledge. A marketplace might **partner with an intermediary** rather
than scrape a registry. Hold this for the revenue-model question.

**Verdict.** The vendor list was never the hard asset — registries give the wrong
tier for free. The hard asset is **MOQ + tier data on the invisible long tail**,
obtainable only by outreach or via an intermediary. Fork B has proven, from the
supply side, why the outreach pilot (Fork A) is unskippable.

## Research method
1. Take **one country at a time**, in the order below.
2. Decompose "make a garment from scratch" into supply-chain categories.
3. For each category, build a ranked vendor list using the schema below.
   Vendors come from **registries**, cross-checked — never from web listicles.
4. Append findings to the ranked lists + the research log. Stop; wait for the next
   prompt. Small chunks, depth over breadth.

## Vendor ranking schema (the backbone)
Each vendor entry carries:
- **Rank** (verification tier first, then fit)
- Name · Category · Country/City (normalise city names — registries don't)
- Garment focus · Fabric focus (knit / woven / both) · Gender focus
- **MOQ** · **Lead-time** — _not available from any registry; outreach only_
- **Verification tier**:
  - **T1** — third-party certified (GOTS / OEKO-TEX / WRAP / SA8000) **and**
    present in Open Supply Hub
  - **T2** — legal entity verified (MCA / GST) only
  - **T3** — self-declared; no independent signal
- **Reachable** (usable website or email on file) — yes/no
- Certificate IDs + issuing body · OS Hub ID · Last-verified date
- Rating basis (where the signal came from) · Notes

We surface what is *provable*. We never say "trusted."

## Garment supply-chain categories (DRAFT — refine during research)
- Fabric / textile mills & sellers
- Trims & notions (thread, zippers, buttons, elastic, interfacing)
- Cut-Make-Trim (CMT) manufacturers ← _Chunk 1 covered tee subset; Chunk 2 sized it_
- Full-package / FOB manufacturers
- Sample makers / small-batch ateliers
- Dyeing / washing / finishing
- Printing & embroidery (screen, DTG, sublimation)
- Labels, tags, packaging
- Distributors / wholesalers

## Country research order (proposed — adjustable)
1. India (start)  2. China  3. Turkey  4. Portugal  5. USA  6. Vietnam
7. Bangladesh (high-volume — aligns with the later scaling-brand tier)
Then niche: Italy, Mexico, Indonesia, Pakistan, …

_Chunk 1 note: by GOTS manufacturing count, Bangladesh (685) outranks China (656)
and belongs earlier than #7._

## Open hard-problems
- **Verification / trust** — RESOLVED (Chunk 0): "verified" = a third party audited
  a facility on a date, recorded in a public registry. Nothing stronger without our
  own sample orders or site audits.
- **Data sourcing** — RESOLVED (Chunk 1): GOTS public API is free and harvestable.
  OS Hub bulk is paid. OEKO-TEX buying guide is captcha-gated. WRAP / SA8000
  unexplored — but Chunk 2 shows more registries won't fix the tier problem.
- **Recall / tier mismatch** — RESOLVED (Chunk 2): the target tier lives in the
  ~1,800-unit job-work tail, which no public source indexes. Registries capture the
  export head. Verification and tier-fit are inversely correlated.
- **MOQ / lead-time data** — the biggest open one. Not in any registry. Only via
  outreach (Fork A) or an intermediary partnership.
- **Vendor-pays viability** — promoted from thesis to problem. Answer before
  expanding past India. Intermediary channel (Chunk 2) may reframe who the customer
  is.
- **Cold-start** — two-sided launch. Only 34% of the verified population is
  contactable from public data; the right-tier tail is barely online at all.
  Candidate channel: associations / merchant exporters as aggregators.
- **Backend / identity shift** — infra, ownership, where this lives relative to the
  local app.
- **Liability** — risks of vetting/recommending vendors. The verification-tier
  language is the first line of defence.

## Research log (append one row per chunk)
| Date | Country | Category | Covered | Key findings |
|------|---------|----------|---------|--------------|
| 2026-07-09 | India | (all) | Trust-signal audit | No open-web ranking data; public registries are the only hard signal; OS Hub API is auth-gated; incumbents (Sewport, Maker's Row) monetize designers, not vendors |
| 2026-07-09 | India | CMT (tee subset) | GOTS registry harvest, 1,333 records | 3,154 India entities → 1,333 manufacturing → 712 tee-capable → 148 CMT-only → 72 reachable. Tirupur = 388. No MOQ/lead-time in any registry; GOTS = organic only |
| 2026-07-09 | India / Tirupur | CMT (recall) | Fork B — sizing the non-GOTS population | Denominator: ~1,800 job-work CMT units, 1,360 TEA exporters, 388 GOTS. 100 units = 50% of exports. Our 100–300pc tier lives in the uncertified tail; GOTS recall ≤21% and skews to exporters. Verification ⟂ tier-fit. Intermediaries (associations, merchant exporters) surface as a cold-start channel |
