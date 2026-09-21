# Garment expansion research synthesis

_Slice 154. Status: complete research decision record. This document ranks and
scopes future work; it does not authorize garment implementation or claim
physical fit, recovery, shrinkage, sewability, safety, manufacturing, or
production readiness._

## Outcome

The Slices 149–154 wave has completed evidence-backed records for:

1. casual woven fly-front shorts;
2. adult knit joggers;
3. an adult cut-and-sew crewneck sweatshirt followed by a pullover-hoodie
   addition;
4. rigid relaxed straight-leg five-pocket jeans.

All four belong in InfiniDrip. None is a label-only variation of a shipped
recipe, and none may start from a copied commercial pattern shape. Epic 11 Polo
V2 remains the next already-packeted geometry epic. Epic 7 is now reviewed,
merged and pushed, so its start gate is satisfied; beginning Epic 11 still
requires the product owner's scheduling decision.

## Cross-family findings

### Reuse that is real

- Shorts, joggers and jeans can reuse the shipped lower-body waist/hip/rise/
  crotch foundation, grade-by-redraft path, paired-leg ownership and generic
  component/check/render/export pipeline.
- Sweatshirt and hoodie can reuse the shipped upper-body bodice, set-in sleeve,
  real neckline curves, grade-by-redraft path and generic pipeline.
- All curved joins must use actual interface arc length. Endpoint span is never
  seam evidence.
- Recipe-owned numeric options are backward-compatible when absent from old
  saves; adding a new global `Measurements` field is not.

### Reuse that would be false

- A short cannot be produced by supplying a short trouser `inseam`: the current
  knee station is 52% of garment length and would invent a knee inside the
  upper leg.
- A jogger is not the trouser with its fly hidden; it needs a pull-on waist,
  different pocket containment, taper/ankle decisions and knit guidance.
- A sweatshirt is not a heavier tee with turned hems. Its neckband, sleeve
  cuffs and hem band are defining physical roles and must appear in pattern,
  nesting, surface, reports and exports.
- A hoodie is not a crewneck with a hood overlay. Centre-front neckline drop/
  overlap changes the body neckline, and the hood neck edge must be walked from
  that live front/back neckline.
- Jeans are not trousers with topstitch lines. They require a real back yoke,
  scoop-pocket cut topology, facings/linings/coin pocket, asymmetric fly,
  paired back pockets, two-layer waistband, loops and construction marks.

## Shared decision gates

The Claude packets exposed six shared questions. Codex reviewed the code and
resolves them once here so later execution packets cannot answer them
differently.

| Gate | Slice 154 decision | Consequence |
| --- | --- | --- |
| G1 — material stretch/recovery in drafting | **Defer automatic material-derived geometry.** P0 uses explicit user-owned finished band/cuff lengths and reports the implied stretch ratio. | No `GarmentRecipe.draft` signature expansion, recovery field or hidden reduction constant. |
| G2 — new ankle/head body measurements | **Do not add them in this wave.** | No save-version bump. Jogger cuff and hood dimensions are recipe options and make no body-fit claim. |
| G3 — eyelet mark kind | **Use existing buttonhole marks plus BOM/construction text for P0.** | Add a distinct eyelet union member only when a downstream consumer needs different geometry. |
| G4 — multiple material bolts | **Required truth boundary, not Epic 7 scope.** A future banded-garment packet must add role/material grouping with separate estimates, or explicitly omit secondary-material yardage as unknown. | Never present all main/rib/lining pieces as one truthful bolt estimate. Existing recipes remain unchanged. |
| G5 — direction of greatest stretch | **Construction metadata and guidance for P0; richer piece semantics later.** | Grain stays grain. Do not rename nominal stretch direction as grain or modify Epic 7's directional flag. |
| G6 — non-1:1 band/cuff joins | **Trigger roadmap 0.5.16. Add a ratio-aware stretch-to-fit interface.** It validates finite positive paths and reports `opening / band` rather than applying absolute-cm `Stitch.ease`. | One shared enhancement serves sweatshirt bands, jogger cuffs and a later Polo sleeve band. Exact acceptable ratios remain user/material decisions. |

Additional fixed decisions:

- P0 jogger and hoodie are adult-only. No child age/size mapping is inferred
  from XS–XL. Child drawcord behavior remains a later legal/product decision.
- Elastic cut length is user-measured/test-fit and recorded as notion data. The
  app may expose width and construction clearance but does not compute a
  universal elastic reduction.
- Band pieces use full off-fold physical roles in the first execution packet
  unless a rendered/export audit proves an on-fold representation is clearer.
- Physical relaxed and stretched POMs remain distinct. The app can predict only
  the relaxed geometry until real material state and sample evidence exist.

## Future garment candidates

Epic numbers are deliberately unassigned because Epic 8 is already reserved
and the product owner retains scheduling authority.

| Candidate | Category | Smallest product-complete outcome | Estimate | Required first work | Principal risk |
| --- | --- | --- | ---: | --- | --- |
| Casual woven shorts | Addition + lower-body enhancement | Separate fly-front `shorts` recipe; true upper-thigh-to-hem continuation, adjustable short length/opening, waistband, fly and paired front pockets | 7–9 slices | Extract an upper-block result while proving shipped trouser bytes unchanged | Short hem collisions with fly/pockets and topology around the anatomical knee |
| Adult knit jogger | Addition + lower-body redesign | Pull-on casing waistband, user-fit elastic, drawcord, paired slant pockets, tapered leg and plain hem; cuff is first addition | 5–7 slices; cuff +2–3 | Reuse the lower-body foundation; re-derive waist/pocket guidance | Material/recovery overclaim and non-1:1 cuff semantics |
| Adult crewneck sweatshirt | Addition + targeted upper-body redesign | Set-in sweatshirt with real neckband, paired cuffs and hem band using user-owned lengths | 6–9 slices | Ratio-aware stretch-to-fit interface; truthful secondary-material plan | Band grading, material grouping and preview/export drift |
| Pullover-hoodie extension | Addition to sweatshirt | Two-piece lined hood derived from live neckline, adult drawcord casing, and on-fold kangaroo pocket | +5–8 slices | Sweatshirt P0 complete; hood dimension/default execution packet | Hood grading without head measurement; pocket/hood containment |
| Rigid five-pocket jeans | Addition + major lower-body redesign | Relaxed straight rigid-denim recipe with real yoke, five-pocket inventory, asymmetric zipper fly, two-layer straight waistband, six loops and marks | 11–14 slices | Stable lower-body shared contract and dedicated execution packet | Highest piece/interface count; allowance/topstitch/fly complexity; no shrinkage automation |

## Recommended implementation order

1. **Epic 11 Polo V2, Slices 155–161**, if the product owner starts it. Epic 7's
   merge gate is now satisfied.
2. **Casual shorts.** It is the smallest lower-body derivative and forces a
   clean upper-block/continuation seam without material-engine expansion.
3. **Crewneck sweatshirt P0.** It is the strongest visible upper-body addition
   and establishes the shared stretched-join contract.
4. **Adult jogger.** Start after the shorts lower-body source of truth is stable;
   reuse the sweatshirt's stretched-join contract only for the optional cuff.
5. **Pullover-hoodie extension.** Build only on the accepted sweatshirt body,
   band and neckline contracts.
6. **Rigid jeans.** It has the highest complexity and should consume the stable
   lower-body contract rather than reshape it while shorts/joggers are moving.

This order is not a promise to implement every candidate before other roadmap
work. Each needs a fresh Codex-authored execution packet with exact options,
bounds, file ownership, pressure matrix and exit gate.

## Safe parallelism

- After Epic 11, **shorts lower-body geometry** and **sweatshirt upper-body/
  stretched-join foundation** can run in parallel in separate worktrees.
- Their shared registry, UI, persistence, preview, nesting and export integration
  slices must be serialized and Codex-owned; those files are not independent.
- Jogger must not develop lower-body source-of-truth changes concurrently with
  shorts. Jeans must not do so concurrently with either.
- Hoodie hood/pocket geometry can be researched or drafted while a lower-body
  epic runs, but only after the sweatshirt neckline/band contract is accepted.
- Epic 8 retains its existing hold/reservation; this wave does not repurpose it.

## Pressure-tested exclusions

- No global plausibility weakening for shorts.
- No automatic rib, cuff, elastic or shrinkage factor.
- No stretch-jeans P0; the current material record has no recovery, weight or
  direction-specific stretch contract.
- No true fully-fashioned knitted sweater in the cut-and-sew engine.
- No zip hoodie/lightweight zip jacket in this wave; it needs a split-front,
  closure, split-pocket and hood-to-zip architecture.
- No cargo/athletic/swim shorts, woven track pant, raglan, three-piece hood,
  contoured jeans waistband, washes, machine settings, or production claims.
- No changed export baseline, save version or Epic 7 nesting behavior.

## Evidence and verification boundary

The four garment records contain source-conflict tables, option and component
audits, grading/allowance/persistence/output plans, adversarial matrices and
physical-validation plans. Slice 154 additionally checked the shipped code for:

- current-version save behavior when a new global measurement is missing;
- absolute-centimeter `Stitch.ease` behavior;
- the tee BOM/construction neckband that has no drafted piece;
- single-width, all-piece `nestPieces` behavior;
- real lower-body knee/pocket/fly dependencies; and
- real neckline/shoulder coupling.

No new garment has been rendered, exported, cut or sewn because this is a
research wave. Those are mandatory future implementation gates, not evidence
that the garments already exist.

## Authoritative packet set

- `docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md`
- `docs/research/garments/CASUAL-SHORTS-RESEARCH.md`
- `docs/research/garments/JOGGERS-RESEARCH.md`
- `docs/research/garments/SWEATSHIRT-HOODIE-RESEARCH.md`
- `docs/research/garments/JEANS-RESEARCH.md`
- this synthesis

Where a contributor proposal conflicts with this synthesis, the reviewed
Slice 154 decision here controls.
