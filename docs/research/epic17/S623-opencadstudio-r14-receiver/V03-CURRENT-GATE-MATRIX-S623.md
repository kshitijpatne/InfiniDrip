# EPIC-17 / G04 V03 — Current gate matrix at S623 exit

| V03 acceptance area | S623 evidence | Status |
|---|---|---|
| Candidate identity/licensing | Official Open CAD Studio project page/repository checked; project is GPL-3.0 and describes a general CAD browser app. | Candidate identified; rights/industrial apparel profile not established |
| Synthetic DXF import/render | Synthetic R12 rectangle (`CUT`) and diagonal (`SEW`) opened and visibly rendered. | Candidate-only pass; no product evidence |
| Output format | Save dialog exposes DXF R14. | UI capability observed; no file emitted |
| User-required C:-only storage | Save dialog exposes filename and format only; official README says browser drawing saves are local downloads; no way to select or verify the named C: output folder was available. | **Preflight fail / blocking this web workflow** |
| Local processing of product drawings | No product file was supplied. Official material describes browser-local file selection/download but this slice did not establish the full processing path. | Open; no product-data locality claim |
| Geometry/layer fidelity | No product input/output pair was generated. | Not run |
| Apparel-specific industrial profile and rights | No apparel receiver profile or normative garment semantics established. GPL project license alone is not an industrial profile. | **Open / blocking** |
| Seven recipes, options, and grading | No product fixtures were opened. | **Open / blocking** |
| CUT/SEW/marks and piece identity | Only synthetic layer names were displayed; no garment roles tested. | **Open / blocking** |
| Malformed-input handling and round-trip stability | No export was made. | **Open / blocking** |
| Rendered product-output readability | No product output exists. | **Open / blocking** |
| Legacy behavior and protected export identities | No product code or export changed. | Preserved; required regression gate remains |

S623 screened the browser workflow only. It neither accepts nor rejects Open CAD Studio's DXF parser/writer fidelity for InfiniDrip patterns because none were supplied. The output-path preflight fails the user's C:-only constraint, so the next candidate must provide a verifiable local output destination before any product fixture is exposed. V02 and every other V03 gate remain unchanged.
