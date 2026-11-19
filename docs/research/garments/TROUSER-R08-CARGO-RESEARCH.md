# Trouser R08 — Cargo Trouser research record

**Slice:** EPIC-32 S1334, evidence-only source-and-engine contract
**Exact-main baseline:** `19a8826c9e75760d057ff6135c4d2900ea3b21ff`
**Status:** source review complete; the implementation remains digital-only and unbuilt.

## Scope and relationship to the existing Trouser block

The accepted `TROUSER-RESEARCH.md` defines the original straight Trouser block
and explicitly excludes cargo pockets. R08 is therefore an identity-scoped
starter profile on the existing Trouser root, not a change to the generic block
or to R01–R07.

The research question was limited to which cargo-pocket construction features
can truthfully distinguish R08, and which values must remain explicit product
choices. It did not seek a universal cargo-trouser standard, physical-fit
evidence, a production specification, or a fabric/load recommendation.

## Source-to-claim record

| ID | Source and route | Supported claim used for R08 | Applicability and limits |
|---|---|---|---|
| C1 | National Private Specifications (Pty) Ltd., *Cargo Trousers — Unisex Specification 2023*, SAA 1005, version 01.0, February 2023; copy hosted on South Africa’s eTenders portal. Sections 3 and 9.4, including the side-leg pocket requirements. [Document](https://www.etenders.gov.za/home/Download/?blobName=24149ba6-9eef-4e75-9e19-8449b20bd762.pdf&downloadedFileName=CARGO+TROUSERS+-+UNISEX++SPECIFICATION+2023.pdf) | This particular cargo-trouser design specifies two side-leg pockets with centered box pleats, flaps, and hook-and-loop closure. Section 9.4 also assigns size-specific pocket-mouth lengths. | The document identifies itself as a private specification compiled by National Private Specifications. It is a concrete tender specification, not a universal apparel standard. Its dimensions, size labels, materials, workmanship and closure requirements are not adopted as InfiniDrip standards or size grading. |
| C2 | Michigan Department of Technology, Management & Budget, Contract 071B9200, *Fatigue Uniforms*, archived procurement specification, pp. 24–25, “Fatigue Trousers” and “Cargo.” [Document](https://www.michigan.gov/-/media/Project/Websites/dtmb/Procurement/Contracts/inactive/Folder11/9200111.pdf?rev=2daab931c22a4d6b8e8631a7a4ddc51c) | This different, specific trouser contract describes centered inverted cargo-pocket pleats, bellows on the back and bottom, a center stitch line, a bar tack, and flaps with button closures. | It is an archived, contract-specific fatigue-uniform design. Its dimensions, fabric, reinforcement, hardware and construction are not current or universal requirements, and none are copied into R08. It demonstrates that pocket architecture varies by design brief. |
| L1 | Existing local source of truth: `docs/research/garments/TROUSER-RESEARCH.md`, Slice 94; exact-main implementation at the S1334 baseline. | The original Trouser block is a woven straight-leg base with front pocket bags and a separate waistband/fly. Cargo pockets were out of scope. Its engine already separates options, geometry, marks, POMs, guidance and outputs. | L1 is a code/product boundary, not a cargo construction source. R08 must be isolated by starter identity and leave the generic route and R01–R07 unchanged. |

## Evidence-backed conclusion and selected profile

The SAA 1005 example directly supports a bounded R08 profile with paired
side-leg patch pockets, centered box-pleat construction marks and flaps. R08
selects that architecture as one software profile. The Michigan contract is
retained as evidence of a different cargo-pocket variant; its bellows and
button construction are not part of this first profile.

The selected software profile keeps the base Trouser waistband, fly and front
pocket bags. It adds two mirrored cargo-pocket bodies with centered box-pleat
fold/placement marks and two matching flaps. The flap is shown with a
hook-and-loop placement reference, following C1’s example. The pattern marks
and Tech Pack describe digital construction intent only; they do not specify a
tested fastener, adhesive, strength, seam performance or sewing operation
standard. R08 does not add bellows/gussets, back pockets, belt loops, cargo
capacity, reinforcement, or a second closure variant.

This is a deliberate product choice informed by one published construction
example, not a claim that this is the only or correct cargo-trouser design.

## Product values versus sourced rules

The editable values and ranges in
`docs/planning/EPIC-32-S1334-R08-CARGO-CONTRACT.md` are InfiniDrip digital
defaults and guardrails. Neither C1 nor C2 is used as a size chart or copied
dimension set. Values are not sewing tolerances, body-fit formulas, or
manufacturing instructions. Relational and panel-clearance checks are software
consistency checks only.

## Explicit unknowns and claims boundary

- Pocket fit, placement comfort, load capacity, retention, stress strength,
  fabric response, wash durability and closure performance are unknown.
- Grade rules are inherited software behavior; R08 has no validated graded
  marker, nested output, sewn sample or physically assessed size range.
- The box pleat is a 2D pattern feature with fold and placement marks. The app
  will not claim a measured physical pocket volume.
- No claim of physical fit, wear, comfort, production efficiency, supplier
  readiness, manufacturing readiness or lossless third-party interchange is
  established.
- These are non-blocking limits for the digital blank. Physical validation is
  a separate later evidence gate and is not implied by a render or simulation.

## Bounded research close

The local accepted Trouser record/current-main code plus the two qualified
technical garment documents resolved the acceptance-changing construction
question. No third route is needed for this bounded profile; further broad
cargo research would not change S1335’s admitted digital acceptance. The
unresolved details remain labeled product choices or explicit unknowns rather
than being filled by additional speculative research.
