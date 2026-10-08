# EPIC-17 / G04 V03 — Richpeace Super V8 candidate check — Slice 483 exit

## Finding

Richpeace's **Garment CAD Super V8** is a distinct and potentially better free
candidate than the older **Garment CAD V8.0 Free Version-English** evaluation
copy. The official Super V8 page calls it “genuine free” and describes pattern
making, grading and marker work. That is positive publisher evidence for a
free offering, but no formal license terms were found. The publisher lists
Windows 7/8/10, so Windows 11 behavior is still outside its stated range.

The official Super V8 page documents import/export of **HPGL drawing files**
and **CUT cutting-machine files** in its marker/plotting discussion. It does
not document apparel DXF, AAMA, or ASTM interchange. It also says the product
uses Richpeace cloud-computing technology and offers a limited-time cloud
conversion function. The exact pattern-file exchange path and whether the
cloud functions can be excluded for local CAD interchange are not established.
The official Super V8 video page separately lists an installation video and
an account-registration video; whether registration is required for local
pattern work is unknown.

A third-party Chinese download listing claims Super V8 supports DXF/PLT import
and several formats including AAMA, ASTM, TIIP and AutoCAD DXF. It describes a
1.18 GB simplified-Chinese Windows 11 package from its own distribution
channels. This is a lead only: it does not establish that the package is
publisher-authentic, identical to the official Super V8 build, lawfully
redistributable, local-only, or capable of the exact apparel profile and
round-trip required by C04. Do not download or rely on that package. The
publisher's own official package listing is a separate 34.19 MB 64-bit
package updated 2022-10-13; it does not identify the installer hash or exact
app build, and its binary has not been retrieved.

The older V8 manual's AAMA/ASTM import/export instructions belong to a distinct
evaluation-copy listing. They are adjacent-version evidence only and cannot be
transferred to Super V8. Therefore Super V8 is a plausible **conditional
candidate to inspect**, not a selected receiver/profile and not proof of
interchange. No DXF/profile, rights, local handling, Windows 11, round-trip,
grade, or negative-case gate is cleared.

## Evidence classification

- **Publisher, exact Super V8 page:** calls the product genuine free; states
  system support Windows 7/8/10; describes cloud computing and limited-time
  cloud conversion; documents HPGL/CUT import/export. It does not list
  apparel DXF/AAMA/ASTM exchange or local-only behavior.
- **Publisher, exact Super V8 video page:** lists “Install Super V8” and
  “Register Super V8 Account” videos. This supports that account registration
  is documented, not that an account is mandatory for local CAD exchange.
- **Publisher-linked download listing:** names `Richpeace Garment CAD Super
  V8_64`, size 34.19 MB, update 2022-10-13. Listing metadata is not a binary
  hash, signature, license text, or version resource.
- **Third party:** DDOO claims DXF/PLT import and conversion involving AAMA,
  ASTM, TIIP and AutoCAD DXF, and advertises a separate 1.18 GB simplified-
  Chinese Windows 11 package. This cannot qualify that package/build or prove
  semantics, rights, local handling, or round-trip. It was not downloaded.
- **Adjacent version:** S481's V8 Free Version-English manual documents
  AAMA/ASTM modes, but is not an exact Super V8 manual; no feature parity is
  inferred.

## Decision and next gate

Super V8 merits one bounded, publisher-only local inspection if the product
owner authorizes it: obtain only the official package into
`C:\G04-CLO-DXF-Exchange`, inspect the file/signature, and then request explicit
action-time permission before a standard installation. If installation is
approved, inspect the displayed license, exact build, required registration,
exchange menus, and whether local file exchange is possible without cloud
services. Stop before account creation, term acceptance, compatibility
workarounds, or any fixture if a required decision or hosted transfer appears.
Only after Gate 0 passes may the existing S469/S463 local synthetic-fixture
runbook proceed. All V03 receiver/profile, representative round-trip,
grade/size, negative-input, and rights/local gates remain unchanged.

No files were downloaded; no app was installed/launched; no account or terms
were accepted; no fixture or pattern data was opened/transmitted. Only official
product and download pages, official video metadata, and one third-party
listing were read. No production code, V02 output, DXF behavior, or export
identity changed. CLO remains closed and unused.

## Verification and board

- Board start replay `2991→2995`; validated exit replay `2995→2999`. EPIC-17
  and G04-V03 remain In Progress; V01/V02 remain Done.
- `npm run control-center:test`: 42/42 passed; canonical board validates;
  `git diff --check` passes.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains
  an ancestor. Goal inspected at the S482 safe boundary: `active`, with an
  objective matching the admitted Epic; it remains needed and unchanged.
- No full repository test/coverage/build/render gate is due; this slice is
  external-source review only.

Started `2026-10-08 08:09:46 UTC` from clean S482 `64da604`; completed
`2026-10-08 08:12:02 UTC` (~2m16s): product implementation 0m; focused
source and candidate review ~1m; durable records, board and regression ~1m16s;
external-agent waits 0m; maintainer-decision time 0m.

## Sources

- Richpeace, [Garment CAD Super V8 product page](https://www.richpeace.com/garment_cad-show-751.html) — exact-version feature and OS disclosures.
- Richpeace, [Super V8 installation/account video page](https://www.richpeace.com/video/superV8.html) — install and registration videos.
- Richpeace download portal, [Super V8 64-bit listing](https://downsoft.richpeace.com/s/B4BPO3) — package name, listing date and size.
- DDOO, [third-party Super V8 listing](https://www.ddooo.com/softdown/94069.htm) — unverified DXF/AAMA/ASTM and Windows 11 claims; not used to qualify or retrieve software.
- S481, `docs/research/epic17/S481-v03-candidate-access-reconciliation/S481-exit-packet.md` — distinct V8 evaluation-copy/manual evidence.
