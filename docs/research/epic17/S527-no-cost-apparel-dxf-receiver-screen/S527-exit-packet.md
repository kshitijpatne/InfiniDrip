# EPIC-17 / G04 V03 — No-cost apparel DXF receiver screen — Slice 527 exit

## Result

The one-pass official-source screen found two new technical leads, but **no
receiver can yet be selected or used to close V03**. CLO was not opened or
operated. No installer, account, invite, or test pattern was used. No V03
acceptance gate changed.

## Candidate findings

| Candidate | Official evidence | Free/import/export evidence | Rights and file handling | Disposition |
|---|---|---|---|---|
| **garment.dev** | Its current pages describe an apparel pattern CAD service and claim AAMA/ASTM import/export checked against 34 production files. Its import/export guides describe DXF input and AAMA/ASTM output, with output validation in a receiving system. | Hobby plan is listed as free and includes production DXF export. Service access is currently invite-only. | Terms allow storage/backups of user patterns; official data-use page says standard vector imports are processed locally, while cloud saving/collaboration send document data to the service. Account and patterns live on the service. The export guide says it downloads a file, but the full G04 no-cloud import/export path is not verified. | **Strongest desk-screen lead; not qualified.** Requires an invite and a narrowly controlled local-handling test before any G04 fixture. Never cloud-save or collaborate on G04 patterns under the C:-only boundary. |
| **GetonAgain Garment CAD V2024.1 / free version** | Manufacturer describes apparel drafting/grading; its V2024.1 manual shows an import dialog with ASTM/AAMA and AutoCAD choices. Its brochure claims DXF/PLT input/output. | Manufacturer lists a free phone-registration version with design/grading/marker tools and cloud nesting, but the public sources do not establish that this free build has the V2024.1 bidirectional DXF features or provide a stable build identity. | Local file paths appear in the manual, but no applicable free-build license, privacy/data-flow, offline behavior, or no-cloud guarantee was found. | **Conditional technical lead; not qualified.** Do not install or register until the exact free build, rights, and local handling are established. |
| **MPattern editor** | Its official page says the editor can import AAMA/ASTM DXF. | The free editor cannot export; DXF export from the editor requires MPattern Cloud, a paid add-on. Three generated patterns can be downloaded free, but that is not round-tripping an imported G04 pattern. | Browser/account/cloud service. | **Fails no-cost bidirectional gate.** No further test. |
| **Parmel CAD** | The public legacy page advertises apparel CAD and AAMA/DXF export. | It gives no current version, current download, import path, or round-trip documentation; page carries a 2005 copyright. | Current use rights and handling are unknown. | **Not a candidate on current evidence.** |
| **Previously screened** | S520/S521/S524 already cover CLO, Pixie, LibreCAD, Seamly2D, Open Patterns, OpenMarker, patternForge, and Richpeace candidates. | No prior candidate's disposition was reopened. | — | **Excluded from this repeat-free pass.** |

garment.dev is the only newly found candidate whose current official pages
claim both industry apparel DXF directions and a free plan. That is a
vendor-stated capability claim, not an independently verified profile or
round trip. Its service terms/data handling prevent treating it as a C:-only
receiver without a controlled no-save proof. The GetonAgain evidence mixes a
free registered build with a separately documented V2024.1 build; the feature
intersection is not established.

## Exact V03 effect

- Receiver/profile selection: **still held**.
- Rights and local-only handling: **still held** for every candidate.
- Import/export geometry, piece identity, CUT/SEW/fold/notch/internal marks,
  grades, negative-input behavior, and generation-two round trip across all
  seven recipes: **not tested by S527 and still held**.
- No export identity or V03 acceptance criterion changed. G04 remains In
  Progress; V01/V02 remain Done; no physical-fit, factory, or production claim
  is made.

## Next decision

Recommended next action: authorize one access request to garment.dev, which
would send the user's email address and access-request metadata to an outside
software service. The free plan is invite-only. If access is granted, the
first trial must use a synthetic non-product DXF and verify actual network/file
handling before any G04 pattern is considered. The official data-use page
claims standard vector import is processed in-browser but also documents cloud
storage and server processing for other operations. A G04 fixture must not be
used unless the test demonstrates the required C:-only path. No request has
been sent. Alternatively, keep this lead deferred and wait for applicable
written local-use evidence or another qualified no-cost receiver. CLO remains
open and idle.

## Official sources reviewed

- [garment.dev product page](https://garment.dev/) — claims AAMA/ASTM import and
  export checked against 34 production files; service is in alpha and
  invite-only.
- [garment.dev pricing](https://garment.dev/pricing) — Hobby plan is free and
  includes DXF export; access request is required.
- [garment.dev import guide](https://garment.dev/resources/import) — current
  guide for importing DXF into the browser editor.
- [garment.dev export guide](https://garment.dev/resources/export) — AAMA/ASTM
  export, downloadable handoff, and instruction to check it in a receiving CAD.
- [garment.dev data use](https://garment.dev/data-use) — standard vector
  imports run locally; graded DXF import, cloud saves, collaboration, and
  automatic grading have server-side handling.
- [garment.dev terms](https://garment.dev/terms), revision 2026-08-23 — app
  access by invite, pattern ownership retained by user, and permission to store
  and back up work.
- [garment.dev privacy](https://garment.dev/privacy), revision 2026-09-14 —
  account/pattern hosting and provider processing.
- [garment.dev security](https://garment.dev/security), updated 2026-09-07 —
  no SOC 2/ISO or independent audit claim.
- [MPattern free editor comparison](https://www.mpattern.app/en/free-pattern-making-software)
  — free AAMA/ASTM import; editor export requires paid Cloud.
- [GetonAgain free Garment CAD page](https://www.raiseagaintech.cn/cad_software/Clothing_CAD/448.html)
  — free phone-registration version and feature summary.
- [GetonAgain V2024.1 manual](https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf)
  — file-based ASTM/AAMA import dialog.
- [GetonAgain official V2024.1 brochure](https://d.getonagain.com/en/CAD/catalogue/20250801_GetonAgain_Garment_CAD_V2024.1.pdf)
  — DXF/PLT input/output claim; does not identify which free build has this
  behavior.
- [Parmel CAD legacy page](https://www.geocities.ws/freeparmelcad/) — AAMA/DXF
  export claim; no current build or import path shown.

## Verification and closeout

S527 started `2026-10-08 20:12:29 UTC` from S526 `629ad32` on
`codex/epic-17-g04`; `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
is an ancestor. Board start/exit replay is `3219→3220→3221→3222→3223` in the
accompanying command files. Replay preflight and canonical board validation
pass at revision 3223; `npm run control-center:test` passes 42/42; and
`git diff --check` passes. This was a source-only screen: no app was
opened, no account/invite request was made, no installer was downloaded, and
no pattern file was created or transferred. No production code changed.

Elapsed time: `20:12:29–20:16:55 UTC` (4m26s) — source search and comparison
2m40s, V03/handling reconciliation 0m45s, durable closeout 1m01s,
external-agent waits 0m, maintainer-decision time 0m.

**Next action:** wait for maintainer authorization before submitting the one
garment.dev invite request described above; do not touch CLO or transfer any
G04 pattern. No V03 gate is cleared.
