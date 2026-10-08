# EPIC-17 / G04 V03 — No-cost local CAD trial screen — Slice 537 exit

## Result

The official-source pass found one new desktop-trial lead worth considering:
Autometrix PatternSmith. Its public product page lists AAMA among import types
and DXF among export types. Its trial page advertises 30 days, all features,
and no credit card; its pricing page lists the post-trial product at
`$1,500/year`. The public pages do **not** state that exports are DXF-AAMA or
DXF-ASTM, do not document industrial apparel-profile conformance, and do not
establish local-only file handling. The privacy policy (last updated 2018)
allows product usage data, including product specifications, to be collected
from the product itself; it does not say whether pattern geometry or file
contents are transmitted.

The trial request form requires email, first name, last name, company name,
consent to process the request data, and a CAPTCHA. Its news and “contact me”
checkboxes are separate opt-ins. Submitting the trial form would disclose
personal/business details to Autometrix and crosses G04's no-supplier-contact
boundary. No form was submitted, no data was sent, and no application or
pattern file was downloaded or installed. PatternSmith is therefore an
unqualified lead, not a V03 receiver selection.

No other new in-scope no-cost local candidate qualified from the sources
reviewed. OROX CAD-X and CAD4Fashion state apparel/textile use and AAMA/ASTM
import/export, but expose inquiry/demo forms rather than a verified no-cost
local trial. Pro2CAD also claims AAMA/ASTM exchange and lists permanent
licenses. OpenCAD2D is free/open-source general 2D DXF CAD, without a
documented apparel AAMA/ASTM profile. garment.dev is hosted and already
excluded by the admitted non-goal; OpenMarker's missing export flow was
previously screened in S520.

## Candidate facts and evidence class

| Candidate | Public evidence | Classification for G04 |
|---|---|---|
| PatternSmith | Official site calls it textile pattern drafting/editing software; lists import `DXF, AAMA` and export `DXF, Eastman CMD, Gerber GBR`. Official trial page says 30 days, no card, all features. Official privacy page is dated 2018 and says product usage data may include product specifications. | **Unqualified lead.** No exact AAMA/ASTM export claim, no industrial-profile conformance evidence, no local-only guarantee, and trial access requires a user-data form. No G04 bytes used. |
| OROX CAD-X | Manufacturer page says it targets textile/apparel and imports/exports DXF AAMA/ASTM; information form requests identity, company, email, phone and other details. | **Not eligible on current scope/evidence.** No verified free trial or no-contact acquisition path. |
| CAD4Fashion | Manufacturer says fashion CAD with DXF ASTM/AAMA/AutoCAD and local or network data; offers an online demo by request. | **Not eligible on current scope/evidence.** No verified no-cost license or direct no-contact trial; “local or shared” is not a local-only guarantee. |
| Pro2CAD | Manufacturer says apparel CAD imports/exports DXF AAMA/ASTM and lists permanent licenses. | **Not eligible on current scope/evidence.** No no-cost trial evidence; no rights/data terms reviewed. |
| OpenCAD2D | Official page says free/open-source, strictly 2D CAD, DXF/SVG/PDF/PNG target, GPL-3.0-or-later. | **Generic CAD only.** It cannot establish apparel-specific profile semantics or receiver acceptance. |
| garment.dev | Official pages claim apparel DXF-AAMA/ASTM and a free tier, but describe a browser workspace, cloud library and invite access. | **Out of admitted scope.** G04 excludes hosted services; this is not reopened. |

These are vendor/product descriptions, not independent demonstrations.
PatternSmith's listed export direction is generic `DXF`; it must not be
represented as an AAMA/ASTM export until explicit evidence establishes that
profile. None of the source claims change the need for witnessed fixtures,
`0.001 cm` geometry fidelity, piece identity, semantics, grading, negative
input and round-trip review.

## Gate disposition and next decision

- **V03 unchanged:** receiver/profile selection, industrial-profile evidence,
  rights/handling, all-seven representative exchange, strict geometry,
  piece identity, CUT/SEW/mark semantics, grading, malformed-input behavior,
  and required round-trip acceptance remain open. The user-confirmed CLO trial
  authorization permits the bounded test already completed, but CLO's S536
  Polo result still fails its geometry gate.
- **PatternSmith next step:** no trial request or vendor contact can be sent
  inside the admitted no-supplier-contact boundary. If the maintainer later
  explicitly authorizes one narrowly scoped trial-form submission, it must be
  limited to obtaining the 30-day trial, avoid optional marketing/contact
  opt-ins, send no pattern or product data, and stop before any G04 fixture is
  used until applicable rights and local file handling are established.
- **Recommendation:** consider that narrow trial request only if the product
  owner wants to amend the boundary; otherwise retain the existing scope and
  continue with public evidence or another already-authorized local receiver.
  No paid license, hosted service, threshold change, or V03 success is implied.
- V01/V02 Done; EPIC-17/G04-V03 In Progress. CLO remains open for the admitted
  goal. No fit, factory, or production-readiness claim is made.

## Official sources reviewed

- PatternSmith format list and product: <https://patternsmith.com/> —
  imports DXF/AAMA; exports DXF/Eastman CMD/Gerber GBR.
- PatternSmith trial: <https://patternsmith.com/trial/> — 30-day, no-card,
  all-feature trial; required personal/business data, privacy consent, and
  CAPTCHA; optional news/contact boxes.
- PatternSmith pricing: <https://patternsmith.com/pricing/> — lists
  `$1,500/year` for PatternSmith 2D CAD.
- PatternSmith privacy: <https://patternsmith.com/privacy-policy/> — last
  updated 2018; product usage data may include product specifications, usage
  statistics, error reports and installation details, with no file-locality
  guarantee.
- OROX CAD-X: <https://www.oroxgroup.it/cad-pc-software/> — textile/apparel
  CAD and AAMA/ASTM/AutoCAD DXF; public information form.
- CAD4Fashion: <https://lakeview-technology.com/en/products/cad/cad4fashion/>
  — fashion CAD, AAMA/ASTM DXF, local/network storage, online demo request.
- Pro2CAD: <https://www.pro2dev.com/it-IT/pro2cad-programma-di-moda-per-abbigliamento.html>
  — AAMA/ASTM import/export and permanent licensing.
- OpenCAD2D: <https://www.opencad2d.org/> — free generic 2D CAD, GPL-3.0-or-later,
  DXF target; no apparel-specific profile claim.
- Existing S527/S528 exclusions: `docs/research/epic17/S527-no-cost-apparel-dxf-receiver-screen/S527-exit-packet.md` and `docs/research/epic17/S528-candidate-scope-reconciliation/S528-exit-packet.md`.

## Verification and time ledger

- Official source search and pages above reviewed; no account, message,
  form submission, download, install, CLO operation, or pattern transfer.
- Start and exit board commands are preflighted through the project command
  layer at revisions `3259→3261→3263`; the canonical board remains EPIC-17
  and G04-V03 In Progress.
- Focused Control Center tests: `42/42` passed; `git diff --check` passed.
  No production source or tests changed, so changed-code coverage and the full
  repository gate do not apply to this evidence-only slice.
- Started `2026-10-08 21:33:00 UTC` from S536
  `8294da256f89d98002763d497c32e0298b953c76`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Start/exit board
  revisions were `3259→3261→3263`. Closed `2026-10-08 21:35:14 UTC` (about
  `2m14s`): official source search and review `1m`; comparison and scope
  disposition `0m30s`; durable closeout and focused verification `0m44s`; external
  agent wait `0m`; maintainer-decision time `0m` (trial-form decision remains
  pending).
