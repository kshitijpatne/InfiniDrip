# EPIC-17 / G04 V03 — Local apparel CAD candidate screen — Slice 641 exit

## Result

No newly screened receiver qualifies for an in-scope controlled fixture under
the current no-cost, local-operation, no-supplier-contact, no-hosted-service
constraints. This is a bounded screen of three candidates, not proof that no
such receiver exists. It clears no V03 gate and does not change the acceptance
matrix, the `0.001 cm` geometry threshold, all-seven-recipe scope, status, or
holds.

The immediate capability missing is a receiver that is available for lawful
product-development use without a purchase or vendor contact, can operate on
local files under this task's C:-only handling rule, and supports a documented
apparel CAD import/export profile. A product page that merely advertises AAMA
or ASTM menus does not establish rights, a normative edition, or round-trip
behavior. CLO remains the already-authorized local empirical target; S635,
S636, S637, and S640 record concrete pre-export failures. This screen does not
justify another permutation of the already-tested receiver settings.

## Candidate evidence

| Candidate | Directly documented | Empirical evidence here | Scope disposition |
|---|---|---|---|
| Seamly2D | Its official repository identifies GPLv3+, Windows 10/11 support, and current Windows downloads. The Seamly forum maintainer says it exports DXF and DXF-AAMA but does not import them because its model is parametric. | Not installed or run. No InfiniDrip file was opened or exchanged. | Excluded as a two-way receiver: the documented absence of DXF import prevents the required round trip. It may be useful elsewhere for independently authored parametric patterns, but this screen does not establish compatibility with InfiniDrip exports. |
| garment.dev | The site advertises production AAMA/ASTM DXF and says access is by invite. Its data-use page says standard vector imports are local, but graded DXF import, cloud saving/collaboration, and automatic grading use server-side processing; its privacy page identifies Cloudflare for the app, storage, and computation. | Not accessed, invited, or run. No patterns or product data were uploaded. | Excluded from this Epic's current scope: it is a hosted service and not an available offline desktop receiver. Some local parsing does not make the hosted product an authorized local-only test route. Retain as future product research only. |
| CAD4Fashion (Lakeview Technology) | The vendor describes a fashion CAD with DXF (ASTM, AAMA, AutoCAD) import/export and local or network data handling. The public page offers an online demo request; public materials reviewed here do not state a no-cost local evaluation license or terms covering this product-development use. They do not name a normative profile edition or its conformance claims. | Not installed, requested, or run; no supplier was contacted. | Technically relevant but not eligible to test under current authority: availability, price/license, and rights are unverified, and obtaining access would require the prohibited vendor-contact step. Revisit only if the maintainer changes those boundaries. |

### Primary references

- Seamly2D official repository and platform/license statement: <https://github.com/FashionFreedom/Seamly2D>
- Seamly2D forum maintainer's DXF import/export statement: <https://forum.seamly.io/t/bootstrap-fashion-pattern-compatible/6078>
- garment.dev data processing: <https://garment.dev/data-use>
- garment.dev privacy and hosting providers: <https://garment.dev/privacy>
- garment.dev access and product description: <https://garment.dev/>
- Lakeview Technology CAD4Fashion features and demo route: <https://lakeview-technology.com/en/products/cad/cad4fashion/>

The claims above describe what those sources say; they are not independent
format-conformance or product-rights determinations. No standards text was
reproduced or relied on as licensed material.

## Reconciliation with existing V03 evidence

- S620–S622 already tried CLO DXF-AAMA and Standard using connected LINE
  contours; S640 was only a narrower mixed-entity subset isolation. The S640
  corrected packet records this overlap. Do not reopen that entity family.
- S623 used OpenCAD Studio in a browser, which did not satisfy the C:-only
  output/locality constraint. S624–S628 tested local OpenCAD Studio R14. That
  receiver supplies useful generic-DXF geometry and repeatability evidence,
  but not a documented apparel exchange profile or apparel-specific identity,
  mark, grade, and malformed-input semantics.
- CLO remains directly authorized by the maintainer for local product-use
  testing. Its documented menu modes are vendor features, not proof of an
  active normative standard or conformance. Actual CLO failures remain in the
  S638 matrix and S635–S640 packets.
- The S638 matrix remains authoritative for open V03 gates. This slice makes
  no rights claim beyond the explicitly reviewed public evidence and no
  industrial compatibility claim.

## Acceptance and non-goals

- Screened each candidate for relevant apparel DXF support, local workflow,
  evaluation availability/rights evidence, and whether it is a genuinely new
  route.
- Preserved distinctions among public vendor/project claims, task-specific
  empirical evidence, and unresolved rights/availability facts.
- No software install, vendor/demo request, purchase, service account, product
  data upload, export/import, source edit, or acceptance change occurred.
- No V03 criterion is passed. Seven-recipe exchange, units, geometry, marks,
  layer semantics, identities/grades/options, malformed-input rejection,
  repeated exchange, readable rendered output, documented profile and rights
  remain as recorded in the current gate matrix.
- No physical fit, factory acceptance, or production-readiness claim is made.

## Verification and closeout

- Read-only primary-source screen; no receiver fixture was created or run.
- `npm run control-center:test`: 42/42 passed.
- `node --check` passed for the validated S641 board replay script.
- Validated board command replay: start state revision 3708; S641 exit evidence
  and comment advance it to 3710. G04-V01/V02 remain Done and G04-V03/EPIC-17
  remain In Progress.
- `git diff --check`: passed. No production-code changes; changed-code
  coverage is not applicable.
- Implementation/research: approximately 10 minutes; focused verification,
  record and board closeout: approximately 6 minutes; external-agent wait:
  0 minutes; maintainer-decision wait: 0 minutes.

## Next action

Continue with the already-authorized CLO session only for a distinct
evidence-led hypothesis that can exercise a still-open acceptance gate; do
not repeat CLO import-setting/entity permutations already measured in
S620–S640. Keep all V03 gates open until a fixture actually passes the full
receiver/profile, rights, all-seven geometry/marks/identity, malformed-input,
repeat-round-trip, and readable-output criteria. If no distinct falsifiable
hypothesis remains, report the precise evidence and pause for a concrete
scope/receiver decision rather than relabeling generic DXF evidence as
industrial compatibility.
