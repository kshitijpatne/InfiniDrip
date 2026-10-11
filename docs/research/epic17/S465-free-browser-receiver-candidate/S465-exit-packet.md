# EPIC-17 / G04 V03 free browser receiver candidate — Slice 465 exit

## Finding

Pixie Space is a concrete free, no-install, no-login **candidate for a
receiver-specific trial**, not a qualified receiver/profile yet. Its public
site says it reads/writes DXF and AAMA, can round-trip AAMA pattern markers,
keeps drawings in the browser, has no conversion server, and does not upload
drawings. Its privacy page says drawings stay in the tab or in a locally saved
file and that its servers receive no drawing data. The site also identifies
itself as under construction. These are the publisher's claims, not independent
proof of a fixture round trip.

The live preview identified itself as **0.2.0**. Its file menu visibly offered
`DXF — generic` and `DXF — AAMA (ASTM D-6959)`. I attempted File → Open in the
current Codex browser surface; the menu closed but no file chooser or imported
drawing appeared. No S463 file was loaded or sent; no account, sign-in,
payment, terms acceptance, download, or file transfer occurred. This CUA
surface currently cannot operate the local file picker, so there is no actual
receiver/import/export result in this slice.

## Profile and rights assessment

- The candidate's no-cost/no-login drafting and local-only behavior are stated
  on its site and privacy page. Ordinary web requests still expose IP/request
  metadata to its CDN. No explicit EULA or software license was found during
  this bounded check; do not treat the no-cost claim as a license to reuse its
  software or claim standard conformance.
- The menu's `ASTM D-6959` label is a warning, not qualification. ASTM's
  catalog describes D6959 as a sewn-product plotting-device data format based
  on HPGL/2, limited to a static 1:1 plot and not editable interchange; the
  catalog lists D6959-08 as withdrawn in 2017. The separate apparel pattern
  interchange standard D6673-10 is also listed as withdrawn (2019). Do not
  label the candidate profile ASTM-conformant. If later tested, name only the
  exact application/version/menu mode and observed behaviors.
- Pixie's own public description says POM-based grading is a future module.
  Its present grade preservation and multi-size behavior are not established.
  S463 XS/M/XL are separate generic single-size files and do not substitute
  for a native graded fixture.
- A separate open-source Open Patterns repository documents an ASTM/AAMA
  parser that reads pieces, grade, marks and annotations into JSON/SVG, but
  its published CLI has no DXF writer and therefore is not a round-trip
  receiver. No code/package was installed or incorporated.

## V03 disposition and next action

No receiver/profile is selected, no fixture passed, and no compatibility claim
is made. Preserve the full V03 gate, V02-before-V03, all-seven V02 acceptance,
generic DXF behavior, and protected export identities. The candidate is
promising enough for a bounded witnessed test only if the local fixture can
be opened and exported without uploading it, and if the profile name is kept
receiver-specific rather than claiming ASTM D-6959 or current ASTM
conformance.

The next evidence needed is an actual same-version round trip of the S463
positive and negative fixtures, receiver-native output inspection, and an
independent geometry/unit/marks/labels comparison. Multi-size/grade remains
unproven and needs an appropriate fixture/profile or a documented fail-closed
limitation that still satisfies G04. If the current browser file chooser
remains inaccessible through Codex, ask the owner to perform only the local
open/export interaction or provide another lawful receiver path. No product
code or export behavior changed in S465.

## Checks, status, and timing

- Start from clean S464 `8deebdfa17cb64d09d7f2bc10d989d432130d1ce`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an
  ancestor. Board start replay: 2851→2855; EPIC-17/G04-V03 remain In Progress,
  V01/V02 Done.
- Control Center test, board schema/diff, and documentation checks are recorded
  after the validated exit replay. No production tests/build/coverage/export
  gate is due for this evidence-only slice.
- Start 2026-10-08 04:36:33 UTC; exit 04:38:01 UTC (~1m28s). Time: official
  source/current UI review and candidate assessment 1m08s; durable records,
  board replay and focused verification 20s; production implementation 0s;
  external-agent waits 0s; maintainer-decision time 0s.
- The goal remains active and necessary through actual V03 proof, final gates,
  PR, safe merge, ancestry verification, and any required deployment.

## Sources

- Pixie Space [product page](https://pixiespace.app/) and [privacy page](https://pixiespace.app/privacy/), checked 2026-10-08.
- ASTM [D6959-03 catalog entry](https://store.astm.org/d6959-03.html) and
  [textile standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html), checked 2026-10-08.
- Prior V03 profile boundary and writer contract: S460 exit packet; prepared
  fixture inputs: S463 packet and manifest.
- Open Patterns [ASTM/AAMA parser repository](https://github.com/ksons/astm-parser),
  read-only capability check, 2026-10-08.
