# EPIC-17 / G04 V03 — Super V8 format-source reconciliation — Slice 485 exit

## Finding

The manufacturer-branded Super V8 product page on Richpeace's `richpeace.cn`
site is the most direct published format statement found for this exact
product. It says Super V8 can **import DXF/PLT**, **save PLT**, and enable a
time-limited cloud-conversion feature to import native files from ET, BOKE,
Optitex and Lectra. In a separate marker/plotter section it says the app can
import and export HPGL and cutting-machine CUT files.

This verifies an advertised DXF import direction, but does not document DXF
export or AAMA/ASTM modes. The stated `save PLT` path is not a DXF round-trip.
The cloud-conversion description does not state that it exports DXF or AAMA/
ASTM; its direction, data transfer, and local alternatives remain unspecified.
Therefore the public exact-product evidence does not establish a local
apparel-DXF import/export profile or round-trip. Super V8 remains unqualified.

The manual linked from this page is at
`https://download.richpeace.cn/CN/CAD/FUZHUANG/super_v8/super_v8shuomingshu.pdf`.
The web PDF extractor rejected its 22,136,092-byte response as too large. A
bounded direct retrieval produced no file in `C:\G04-CLO-DXF-Exchange\Evidence\S485`,
and a subsequent HEAD request timed out after 10 seconds. Thus its contents,
version identity, and whether it documents any additional export mode remain
unreviewed. We do not infer the older V8 evaluation-copy manual's AAMA/ASTM
claims into Super V8.

## Candidate decision

Keep Super V8 as an **unqualified conditional inspection lead**, not as the
selected receiver. Its advertised genuine-free status is useful, but the
official exchange directions currently describe DXF import and PLT save, plus
HPGL/CUT plotter/marker exchange. The separate paid SaaS marker service is
excluded; the local path for cloud conversion is unknown. If a standard
installation is approved, the limited purpose is to inspect the exact build's
menus and local file path; do not open fixtures unless Gate 0 establishes
rights, local processing, and an actual usable apparel export mode first.

No download, install, account, term acceptance, app launch, cloud feature,
fixture, pattern transfer, or vendor contact occurred. The manual attempt
left no file. S485 changes no V03 criteria, V02 status, legacy DXF behavior,
or protected export identity. No physical-fit, factory-acceptance, or
production-readiness claim is made.

## Verification and next gate

- Reviewed exact manufacturer-branded Super V8 product page, the English
  Richpeace Super V8 feature page, and official launch news. Product site says
  import DXF/PLT and save PLT; the English page independently lists HPGL/CUT
  import/export and cloud features.
- Linked manual unavailable to the extractor due response size; direct
  retrieval left no artifact and HEAD timed out. No manual claim is made.
- Board start replay `3007→3011`; validated exit replay `3011→3015`. EPIC-17
  and G04-V03 remain In Progress; V01/V02 remain Done.
- `npm run control-center:test`: 42/42 passed; canonical board validates;
  `git diff --check` passes.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains
  an ancestor. Goal remains active and aligned.
- Full repository coverage/build/render gate remains for the settled Epic/PR
  candidate.

Started `2026-10-08 08:15:12 UTC`; completed `2026-10-08 08:20:00 UTC`
(~4m48s): product implementation 0m; focused official-source/manual access
review ~2m30s; durable records, board and regression ~2m18s; agent waits 0m;
maintainer-decision time 0m.

## Sources

- Richpeace/Richforever branded site, [Super V8 product page](https://forever.richpeace.cn/rj/show/55.html), section “Compatibility” — DXF/PLT import, PLT save, and cloud-conversion access to other native formats.
- Richpeace, [Super V8 English product page](https://www.richpeace.com/garment_cad-show-751.html) — Windows 7/8/10; cloud computing/conversion; HPGL/CUT import/export.
- Richpeace, [Super V8 launch article](https://www.richpeace.com/richpeace_news-show-746.html) — paid Cloud Super Arrangement sends marker commands for remote processing.
- Richpeace, [linked Super V8 user manual](https://download.richpeace.cn/CN/CAD/FUZHUANG/super_v8/super_v8shuomingshu.pdf) — linked, but not successfully retrieved or reviewed in this slice.
- Prior candidate review: `docs/research/epic17/S483-richpeace-super-v8-candidate/S483-exit-packet.md`.
