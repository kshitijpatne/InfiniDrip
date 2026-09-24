# C06 — Starter library, assortment, upcycling, and supplier dossier

**Research snapshot:** 2026-09-24<br>
**Status:** reviewed and accepted 2026-09-24; Slice 219<br>
**Future destinations:** G06 starter designs; G08 collection planning; G10 reference/upcycling; G11 local supplier-ready workflow; G12 marketplace infrastructure.<br>
**Boundary:** research and workflow/schema proposal only. No new recipe, demand forecast, supplier outreach, paid source, sample request, order, hosted feature, contract, or physical sampling is admitted.

## Decision summary

“Hundreds of blanks” is a count, not a quality signal. A competitive starter library should contain fewer original or properly licensed pattern systems with documented fit/fabric/population scope, editable geometry, measurement and POM definitions, grade provenance, BOM and construction, tested exports, explicit unsupported combinations, and independent technical review. Digital maturity and physical maturity must be labeled separately; the product has no sewn sample evidence and the owner has placed physical sampling on hold.

Collection planning should be a user-authored assortment and scenario workspace until InfiniDrip has representative, dated sales and inventory data. Assortment research treats choice breadth, depth, size mix, inventory and uncertain demand as coupled decisions. It does not justify an AI-generated “optimal collection” or a demand claim from a prompt.

For upcycling, the owner’s agreed decision is sound: optional photos may begin *visual concept exploration*. Photos alone cannot establish hidden seams, exact scale, fiber content, material condition, or whether all required pattern pieces fit on usable reclaimed panels. The product should expose evidence tiers—from photo concept, to coached flat garment measurements, to confirmed panel geometry and material/defect map—and never call the first tier cut-feasible.

A supplier bridge needs far more than a directory and chat box: a complete, frozen style revision; compatible manufacturer capability and MOQ facts; explicit quote inputs/assumptions; timestamps and evidence source; version-bound clarifications and responses; and clear platform/business responsibility. A supplier badge, paid listing, AI match, or quick quote is not quality assurance. The safest later marketplace sequence starts with discovery and RFQ collaboration; transaction handling, escrow, merchant-of-record, and fulfillment are separate, higher-burden business decisions.

## 1. Vetted starter library

### Evidence and rule

ISO body measurement standards, size-designation standards, garment-measurement standards, and stitch/seam practices address distinct parts of the problem; none supplies one universal fit block or grade rule. C02 records their verified scope. Population tables need a declared source/population. Body measurements, finished-garment POMs, ease/design settings, and pattern dimensions must not share a single vague “measurement” meaning.

Self-measurement quality also requires care. Yoon and Radwin’s 1994 study of 103 women reported measurement-specific self-measurement errors and a mean absolute error of 4.10 cm for self-measured values versus 3.34 cm when measurements were taken by a partner; hip circumference was significantly underestimated. That older, scoped study is not a modern error distribution for all populations, garments, or current measuring tools. It is evidence that measurement instructions, repetition and uncertainty are meaningful controls—not proof of one universal error allowance. ([study](https://journals.sagepub.com/doi/10.1177/001872089403600311))

### Starter admission rubric

Score and publish each starter only against a declared domain. A starter must not be counted as professionally reviewed simply because it draws, exports, or passes unit tests.

| Review area | Required record and checks |
| --- | --- |
| Rights and provenance | Origin/author of block, code, diagrams, pattern/artwork/data; license terms and commercial redistribution rights; source version/date; third-party asset and dependency record. Standards text/diagrams require appropriate license. |
| Intended domain | Garment category and silhouette; target wearer/population and body-data source; fit intent; supported base sizes/range; intended material family/stretch domain; intended use and known exclusions. |
| Measurement semantics | Every field typed as body measure, finished POM, pattern value, grade rule, ease/design option, derived value, or unresolved; unit; named landmark/path; body posture/garment state; capture instructions; source/owner/date. |
| User control and constraints | Meaningful editable parameters, bounds and interaction of options; invalid combinations preserved visibly with actionable guidance; no silent clamping or unannounced auto-design. |
| Pattern structure | Stable panel/component identifiers; grain/fold/cut direction; sewline/cutline and allowance policy; seam adjacency and paired-seam length; notches, drills/internal marks; darts, closures and operation links; topology/geometry fixtures. |
| POM and grading | Distinct body and finished measurement charts; illustrated callouts; source and method for each POM/tolerance; base size; grade rule, per-size values and provenance; grade-order and all-boundary test. No size labels without a stated basis. |
| BOM and construction | Fabric/trim/label/packaging identity; composition/construction/weight/width/finish/color/placement; quantity and basis; supplier/article source; operation sequence tied to components; seam/stitch/material context; unknowns visible. |
| Digital QA | Property and invariant coverage of valid/invalid edge cases; rendered-view parity; export unit/scale/legibility review; file round-trip in explicitly named receiving system; regression and revision-propagation evidence. |
| Independent technical review | Reviewer role and relevant expertise, date, reviewed revision, findings, disposition, unresolved items and re-review outcome. A review does not imply physical fit. |
| Physical stage | Future measured sample evidence only after owner reopens sampling: sample ID, material/size/pattern revision, actual POM, comments/actions, acceptance and sign-off. Currently held; no starter can pass this stage today. |

### Maturity labels

Keep these discrete labels in every future catalog and export: **authored** → **digital geometry checks passed** → **independent technical review passed** → **physical validation passed** (held) → **supplier/production release accepted** (requires its own later evidence and agreement). Do not merge “digital verified” with “fit approved” or “factory-ready.”

## 2. Collection and assortment planning

Fashion retail research models assortment using coupled choices such as variety/breadth, depth/quantity, basics-versus-fashion balance and constrained inventory; the demand is uncertain and product life cycles are short. Later reviews of assortment models identify differing assumptions around demand, substitution, uncertainty, objectives and constraints. These papers establish problem complexity, not an InfiniDrip market forecast. ([Rajaram, fashion assortment](https://www.sciencedirect.com/science/article/abs/pii/S0377221799004063); [2024 assortment-planning review](https://link.springer.com/article/10.1007/s00291-024-00752-4))

The owner’s idea of building collections remains viable without a prompt-driven design agent. Use a deterministic collection matrix where the user chooses the styles and product decisions; then make impacts visible.

| Input/output | Initial user-led scope | Provenance/guardrail |
| --- | --- | --- |
| Assortment rows | User-selected category/style, role (hero/support/basic), fit intent, shared block, size range and colorway. | User choice; do not invent style demand or claim brand suitability. |
| Unit plan | User-entered units by style/colorway/size with totals and budget caps. | User scenario, editable; identify currency, channel/region, date and time horizon. |
| Shared materials | Link potential common fabric/trim/article across styles; display estimated/quoted requirements and conflicts. | Each quantity labeled as estimate, user input, pattern/marker calculation or supplier quote; include fabric width and waste assumptions before claiming consumption. |
| Constraints | Budget, supplier MOQ by its actual basis (style, color, material, order/lot), lead time, capacity date, material minimum and size curve. | Supplier values are contextual, dated quotes and may expire; never use a global static “industry MOQ.” |
| Scenario outputs | Totals, budget/constraint warnings, material-sharing view, scenario comparison, missing inputs and uncertainty. | Deterministic arithmetic from named inputs, not an “optimal” collection, predicted sell-through or market-launch result. |
| Later forecasting gate | Only after representative, rights-cleared and dated sales/inventory/returns/substitution data exist for named region/channel/product cohorts. | Separate research/model validation, explainability, privacy, drift and release decision. The reported results of large-store sales datasets do not transfer to a new app with no history. |

An initial version should not generate designs or assign market winners. It can help users learn the relationship among styles, size curves, shared materials, MOQs, prices and lead times while they make the choices.

## 3. Photo reference and upcycling feasibility

### What evidence says

Upcycling/remanufacturing sources describe irregular, pre-shaped and variable recovered garments/materials; patternmakers must judge what fits on available regions, and single-item handling/cutting can be more labor-intensive than conventional multi-ply work. Studies of industrial leftover-fabric upcycling show that pattern nesting into remnants is possible but it is not the same task as accurately transforming an unknown worn garment. A single-view garment reconstruction paper depends on geometric/statistical priors; a photo is not a measured pattern. ([remanufacturing study](https://eprints.whiterose.ac.uk/id/eprint/92519/3/papaer%20final%20accepted.pdf); [circular-fashion practice study](https://link.springer.com/article/10.1186/s40691-021-00262-9); [single-view garment reconstruction](https://arxiv.org/abs/1608.01250))

The closest computational research proof is **Rags2Riches** (ACM SIGGRAPH 2025): given a source garment design and its sewing pattern, plus a target design and its pattern, the algorithm selects source panels and seams/hems to reuse, then optimizes panel placement/deformation. It quantizes panel shapes and solves a discrete assignment with an integer-linear-programming solver; the authors compare with a professional designer and manufacture a physical reused garment. This is strong evidence that carefully modeled panel-level upcycling can be computationally assisted. It is also clear evidence of the prerequisites: the input is not an uncalibrated photo alone, but two designs and corresponding patterns. Its research demo does not prove arbitrary photo-to-garment-to-cut-plan automation. ([paper/project page](https://korosteleva.com/publication/rags2riches/))

### Evidence tiers for the product

Photos may be optional when the user is just collecting references or exploring a design. If the photo has no known scale, camera plane and calibration it must not be treated as metric geometry. Guided measurement screens should explain how to place, measure and record each specific garment; exact mandatory values come from the source and target pattern’s semantic needs, not a one-size-fits-all list.

| Tier | User supplies | The app can responsibly show | Must remain unknown / prohibited conclusion |
| --- | --- | --- | --- |
| **1 — photo-only concept exploration** | Optional front/back/side/interior/detail/damage/reference photos; user identifies source garment and desired manual edits. | Visual reference annotation, visible features, likely categories/components with uncertainty, user-authored inspiration board and proposed step checklist. | No scale-accurate measurements, material identity/strength, hidden construction, donor panel map, “will fit”, “can cut”, or ready-to-sew statement. |
| **2 — measured assembled source garment** | Coached flat measurements by garment type: state whether full circumference or half-width; flat position; named points; units; no-stretch instructions; label/interior/construction/damage photos; repeat/second measurement where needed. | Approximate shape/size comparison; identify likely alterations or source constraints; flag missing values. Measurements support screening, not recovered-panel geometry. | No exact under-seam allowance, hidden panel dimension, usable area after unpicking, fiber blend, seam durability, or cut plan. |
| **3 — confirmed recovered-panel/cut feasibility** | After unpicking or otherwise exposing donor panels: each panel boundary/shape, usable dimensions, grain/stretch direction, seam reserves, excluded stains/holes/wear/damage, lining/interfacing/trims and known material facts; calibrated photo/grid can assist but user confirms geometry. | Deterministic 2D layout test of target pattern pieces against declared usable panels, shortages/waste estimate, component re-use plan and unresolved questions. | No unknown fiber content, strength, colorfastness, stretch recovery, shrinkage or sewing survivability claim without material evidence/testing. |

### Guided measurement/checklist requirements

Use three different capture playbooks: wearer body measurements; an assembled donor garment laid flat; and reclaimed panels after deconstruction. They use different references and must not share labels without stating the coordinate system.

- Photos may start the flow and are sufficient for reference annotation and user-led concept exploration. They do not block exploration and do not become measurements. To improve a feasibility screen, the app should recommend a guided flat-measurement set, explain how to take each value, and distinguish required fields for the selected check from useful extra observations.
- For an assembled top, the screening set should expose chest width at a named level, shoulder width, front/back body length, armhole depth, sleeve length and opening, neck/collar/placket, and hem width where those parts exist. For trousers, expose waistband/waist width, seat/hip width at a named level, front/back rise, inseam/outseam, thigh, knee and leg-opening widths. For skirts, expose waist, hip width at a named level, center-front/back length, hem width, and any slit, pleat, closure or waistband measurements required by its construction. Capture is flat, relaxed, and without pulling; identify half-width versus circumference, body/garment measurement method, named start/end points, units, and the selected target check.
- These assembled-garment values screen whether the donor appears large enough for a proposed conversion; they are not sufficient to claim cut feasibility. The precise mandatory field set must be derived from the selected donor-to-target recipe/panel dependencies: ask only for measurements that can resolve a stated constraint, and show a blocker when any required input is missing. This field mapping is an owned C03/G10 contract, not a universal garment checklist. A photo-only estimate remains labeled as an estimate until user-confirmed.
- For cut feasibility after unpicking, record the true boundary of every recovered panel, cuttable region excluding defects, grain/stretch direction, component orientation, available seam reserves, and panel-to-target-pattern assignment. A calibrated grid/photo can assist tracing, but the user must confirm panel geometry and defects; exposed panels are the source of required geometry, not assembled-garment circumferences.
- Each guided step should show placement, named start/end points, tape/straightedge route, flat position, relaxed/no-pull condition, unit conversion, photo angle, repeat-measurement prompt, and what the result can and cannot establish. Preserve original and repeated values, method, measurer, date, source photo, confidence, and correction history. Validate contradictions and ask the user to remeasure instead of silently clamping.
- Preserve original value, repeated value, unit, capture method, measurer/user, date, source photo, confidence and correction history. A photo estimate stays labeled estimate until user-confirmed measurement.
- Validate internally inconsistent values and direct the user to remeasure; retain invalid inputs with clear remediation rather than silently clamping them.

## 4. Supplier/manufacturer bridge and marketplace

### Public workflow evidence and its limits

Public supplier platforms document distinct models. Maker’s Row describes project briefs, references, manufacturer discovery, direct messaging, quote requests and production tracking; it says a detailed tech pack helps suppliers understand the product and provide more accurate quotes. Its brand portal is U.S.-focused, while other company pages also describe international suppliers, so global network coverage should be treated as unverified. The pricing page snapshot (2026-09-24) displayed a free brand tier; Starter at $49/month or $39/month billed annually; Preferred at $129/month or $99/month billed annually; and Premium at $599/month. Its annual Premium figure conflicts within the same page: the plan card shows $499/month billed annually, while the lower comparison table shows $449/month; both remain vendor-page claims, not a quote. On the supplier side the page showed Starter $499/month or $399/month billed annually, Preferred $1,499/month or $1,199/month billed annually, and Premium $2,999/month or $2,399/month billed annually. Supplier tiers increase direct-message allowances and search visibility/rank; this is a paid acquisition/visibility model whose rankings must be disclosed if used in marketplace matching. The page also contains unmethodologized success and time-savings claims; they are not used as performance evidence. Sewport describes guided enquiry, proposals, negotiation and escrow-style fund release; its manufacturer FAQ says the brand/customer pays commission but states no universal public rate. FOURSOURCE publicly sells supplier growth/premium/enterprise visibility plans with paid ranking and connection limits; as checked 2026-09-24 its one-time prices were €2,500/€3,200/€3,900, subject to rechecking before budgeting. ([Maker’s Row brand portal](https://makersrow.com/brand/), [pricing](https://makersrow.com/pricing/); [Sewport workflow](https://sewport.com/how-it-works), [manufacturer FAQ](https://sewport.com/faq-for-manufacturers), [brand/escrow FAQ](https://sewport.com/faq-for-brands); [FOURSOURCE pricing](https://foursource.com/pricing/))

**Genpire's public order terms conflict internally about the platform's legal/commercial role.** Section 21.1 says Genpire is merchant of record, the buyer contracts with Genpire, and the factory is not party to that buyer agreement; §21.5 says Genpire selects manufacturers and remains responsible to the buyer for fulfillment. Later in the same terms FAQ, the response about manufacturer interactions says the brand and factory establish the contract directly, Genpire is not a party, and it only facilitates introductions. These descriptions cannot all be treated as one settled workflow or liability model. Until clarified in a current executed agreement, C06 records the mismatch and does not assert which governs in practice. For InfiniDrip, merchant-of-record or fulfillment responsibility remains a separate, deferred business/legal decision; a local discovery/RFQ bridge should not imply it. ([Genpire Terms of Service, §§21.1, 21.5 and manufacturer FAQ](https://www.genpire.com/terms))

Alibaba distinguishes supplier assessments from order protection. Its Verified Supplier material describes third-party assessment/report/video, while platform disclaimers limit guarantees about assessment accuracy/timeliness. Trade Assurance is based on eligible orders placed and paid through the service, with order terms governing claims. A verification badge is neither a garment-quality test nor blanket fulfillment guarantee. ([verification explanation](https://activity.alibaba.com/page/verifiedsuppliers.html), [Trade Assurance](https://tradeassurance.alibaba.com/), [buyer guide](https://activity.alibaba.com/page/tradeassurance/buyer/story.html))

### Candidate supplier profile schema

Every value needs its source/status and freshness. Separate **self-reported**, **document reviewed**, **independent audit**, **reference-backed**, and **observed transaction performance**. Do not let supplier-paid placement affect or masquerade as a trust score.

| Field group | Minimum supplier record |
| --- | --- |
| Identity | Legal entity, operating factory/site, country/city, owner/operator contact, role (manufacturer, trader, agent, sourcing office), relationship between legal entity and production site. |
| Capability | Garment/product categories, operation types, machines/equipment, construction/material limitations, sample capability, finishing/printing/embroidery/wash processes, certifications with issuer/scope/site/date/expiry. |
| Capacity | Current capacity range, unit/time basis, committed-load date or availability window, seasonality, response SLA, sample and bulk lead-time definitions. |
| Commercial terms | MOQ by each basis (style/color/material/lot/order/size, where relevant), price breaks and currency, setup/tooling/sample charges, buyer-supplied vs factory-sourced material scope, payment terms, Incoterms/delivery responsibility, quote-valid-through date. |
| Verification | Evidence source, verifier and method, site/remote distinction, date/expiry/revalidation trigger, exact inspected entity/site, limitations, permitted document/photo use, dispute and correction process. |
| Performance | Version-bound RFQ and quoted assumptions, schedule/communication history, delivery/quality outcomes only if supported by documented transactions and with both sides’ dispute/review rights. |

Matching should begin with hard constraints the user can inspect: category/process/material, geography/shipping need, quantity/MOQ basis, lead-time window and required certificates. Any ranked list should show which user-selected inputs drove the ordering, the underlying source age, paid placement disclosures, and why a match is excluded. Marketplace market coverage, capacity and acquisition incentives are currently unknown; no supplier outreach has occurred.

### Version-pinned RFQ and response workflow

**Future proposed state machine (product inference, not an existing feature):**

`Draft request → completeness/provenance check → user reviews unresolved facts → freeze exact style/spec/files/quantities and hash → select recipient(s) → submit → supplier clarification tied to frozen revision → supplier quote with line assumptions/exclusions → normalized comparison → user shortlists/negotiates → terms/contract gate → sample gate (held) → approved sample → bulk/QC/shipping/dispute operations (future gated scope)`

Minimum RFQ fields:

- style/product ID and immutable revision/hash; front/back/side and detail views; tech pack and CAD files/formats/units;
- garment size range/base size; single-size vs explicitly approved graded run; size-by-color quantity breakdown;
- complete BOM with exact material specs, trims, colors/article IDs, source or supplier-sourcing responsibility, substitutes and unresolved items;
- construction, seam/stitch, artwork/label placement, packaging, quality tolerances and inspection requirements;
- required sample rounds and target/delivery dates/ship-to location, channel/country context, currency and Incoterms;
- requested process/scope (CMT vs full package), supplier MOQ basis, capacity and lead-time definition, price breaks/setup/tooling/sample costs, quote expiry, payment assumptions and excluded services.

Supplier response must say what version was priced, what is included/excluded, any deviations/substitutions, minimums by relevant basis, currency/date/quote-validity, sample/production lead time, capacity window, Incoterms, payment and every unresolved/unquotable field. Any design/material/quantity change after quote creates a new revision and re-request or delta quote. Supplier messages remain attached to the revision they concern.

### Marketplace business-model choice

| Model | Revenue example | Operational/legal burden | Product decision |
| --- | --- | --- | --- |
| Directory/introduction | Supplier listing, brand subscription, disclosed referral fee. | Supplier-data freshness, identity checks, dispute process, conflict-of-interest disclosure; platform does not promise order result. | Lowest-risk discovery/RFQ starting point, but verified badges/rank transparency remain essential. |
| Collaboration SaaS | Brand and/or supplier seats for versioned spec/RFQ/collaboration. | Permissions, data security, file/version integrity, support and retention/deletion. | A plausible extension after local spec/version systems mature; remains separate from manufacturing/quality guarantee. |
| Transaction fee / mediated payment | Percentage/take-rate or payment-service revenue on eligible orders. | KYC/KYB, payout, refunds, chargebacks, taxes, escrow/payment provider terms, fraud/support and dispute flows. Payment-provider marketplaces document these as actual platform operations, not a simple connector. ([Stripe Connect marketplace guide](https://stripe.com/connect/marketplaces), [features](https://stripe.com/connect/features)) | Defer until operating owner, legal scope, target countries, payment provider and cost/claims model are explicitly approved. |
| Merchant-of-record / seller / fulfillment orchestrator | Gross-margin or fee on sourced and fulfilled production. | Highest: contract and product liability roles, tax/customs, payment, quality control, shipping, missed delivery, returns/disputes, insurance and working capital. | Not part of the current local-first roadmap admission. Do not imply this responsibility from a supplier directory or messaging feature. |

### Privacy and trust prerequisites

Body measurements, body images and garment photos may be personal or sensitive contextual data. Before any cloud account, supplier sharing, marketplace, or third-party image processing is enabled, define explicit consent, least access, purpose, sharing preview, deletion/retention, export, breach/contact, and whether photos are transmitted. The current local-first/no-hosted boundary remains binding. Supplier due-diligence documents may include business/personal details; store only necessary scoped evidence and preserve license/permission status.

## 5. Facts, inference, unknowns, and no-go decisions

| Category | Finding |
| --- | --- |
| **Sourced fact** | Body-data tables, garment dimensions and seam/stitch specifications are distinct problem domains in the referenced standards; no single universal size chart/grade rule solves them. |
| **Sourced fact** | Self-measurement can contain meaningful error; one older 103-woman study observed mean absolute error differences between self and partner measures, with body-region variation. |
| **Sourced fact** | Assortment models couple breadth/depth/inventory and uncertain demand. Upcycling manufacturing must account for irregular recovered material and more labor/individual handling. |
| **Sourced fact** | Rags2Riches demonstrates a physically manufactured upcycled garment from an algorithm supplied with source and target sewing patterns; its optimization operates on panels, seam/hem reuse and panel placement, not just images. |
| **Sourced fact** | Supplier platforms monetize through different models; some sell paid visibility, others facilitate quotes/transactions. External supplier verifications have limited scope/disclaimers. |
| **Product inference** | InfiniDrip should start with transparent, user-authored assortment scenarios; photo-only concept exploration; later tiered, evidence-based material feasibility; and a version-pinned RFQ layer before any payment/production operations. |
| **Product inference** | Every starter should have maturity labels, provenance, a declared domain, deterministic fixtures, visual/export QA and independent technical review. A number of templates alone does not establish quality. |
| **Unknown** | Target markets/populations, standard licenses, technical designer review coverage, demand history, supplier network, factory capacity, supplier data rights/freshness, regional MOQ and quote conventions, platform role and fee economics. |
| **Unknown** | Exact required donor measurements by each garment conversion and each pattern recipe; must derive from C03 semantic models and technical review, then test measurement instructions with users. |
| **No-go at present** | No user-facing prompt-to-design agent; no demand forecast/market-success assertion; no photo-only cut-feasibility or fit guarantee; no supplier contact, paid badge/source, order or hosted supplier directory; no sample/production fulfillment claim; no physical sample. |

## Dependencies and later handoff

| Future work | Must consume / resolve first |
| --- | --- |
| G06 starter library expansion | C01 recipe baseline and C02 standards/tool evidence; C03 measurement semantics; C04 view/pack/CAD contract; per-garment construction research and rights; technical review coverage. |
| G08 assortment/collection planner | Versioned multi-style product foundation; manual source-aware quantities/materials; quote/MOQ representation; demand-data/privacy decisions before forecast models. |
| G10 reference/upcycling | User-led manual design controls; photo references as non-metric evidence; C03 capture schema; 2D pattern/panel geometry; material/defect map; explicit confidence tier and failure UX. |
| G11 supplier-ready local workflow | Frozen style and professional tech-pack contract, user-approved size/grade state, full BOM/quantity/provenance and RFQ completeness state. This can start with export/share after its own gate; no transactions assumed. |
| G12 live marketplace | G11 data foundation, target geography, supplier acquisition/verifications, stale-data policy, roles/permissions, privacy/legal, ranking economics, paid-placement disclosure and support ownership. |
| G15 physical validation / G16 manufacturing | Explicit maintainer reopening; technical designer/factory/sample partner; version-matched sample and quality process. Current hold remains. |

## Sources

### Standards, body measurement and sizing

- [ISO 8559-1:2017](https://www.iso.org/standard/61686.html), [ISO 8559-2:2025](https://www.iso.org/standard/85590.html), [ISO 8559-3:2018](https://www.iso.org/standard/67334.html), [ISO 18890:2018](https://www.iso.org/standard/63693.html). See C02 for verified scope, dates and boundaries.
- [ASTM D6193-16(2025)](https://store.astm.org/d6193-16r25.html), [D5585-21](https://store.astm.org/d5585-21.html), [ASTM D6673 committee history](https://www.astm.org/membership-participation/technical-committees/committee-d13/subcommittee-d13/jurisdiction-d1355).
- Yoon & Radwin, 1994, [Self-measurement of anthropometric dimensions](https://journals.sagepub.com/doi/10.1177/001872089403600311).

### Assortment and recovered-material research

- Rajaram, 2001, [Assortment planning in fashion retailing](https://www.sciencedirect.com/science/article/abs/pii/S0377221799004063).
- 2024, [Systematic review of assortment planning models](https://link.springer.com/article/10.1007/s00291-024-00752-4).
- [Remanufacturing and upcycling using pre-shaped material](https://eprints.whiterose.ac.uk/id/eprint/92519/).
- [Industrial upcycling/circular-fashion practice study](https://link.springer.com/article/10.1186/s40691-021-00262-9).
- [Single-view garment reconstruction paper](https://arxiv.org/abs/1608.01250).
- Qi et al., [Rags2Riches: Computational Garment Reuse](https://korosteleva.com/publication/rags2riches/), ACM SIGGRAPH 2025.

### Supplier systems and platform operations

- [Maker’s Row for brands](https://makersrow.com/brand/) and [pricing](https://makersrow.com/pricing/).
- Sewport [how it works](https://sewport.com/how-it-works), [manufacturer FAQ](https://sewport.com/faq-for-manufacturers) and [brand escrow FAQ](https://sewport.com/faq-for-brands).
- [FOURSOURCE pricing](https://foursource.com/pricing/).
- Alibaba [Verified Supplier explanation](https://activity.alibaba.com/page/verifiedsuppliers.html), [Trade Assurance](https://tradeassurance.alibaba.com/) and [buyer guide](https://activity.alibaba.com/page/tradeassurance/buyer/story.html).
- Stripe [marketplace platform operations](https://stripe.com/connect/marketplaces) and [Connect capabilities](https://stripe.com/connect/features).

## Exit decision

C06 is reviewed and accepted (Slice 219). The starter rubric, scenario-planning boundaries, three-tier photo/measurement/panel evidence contract, supplier/RFQ model, business-model consequences, privacy gates and source caveats were checked. Photo-only exploration remains available; the exact mandatory measures for a particular donor-to-target conversion are explicitly assigned to the C03/G10 semantic dependency map and cannot be replaced by a generic checklist. This research creates future design inputs; it does not authorize implementation, outreach, transactions, sampling or production claims.
