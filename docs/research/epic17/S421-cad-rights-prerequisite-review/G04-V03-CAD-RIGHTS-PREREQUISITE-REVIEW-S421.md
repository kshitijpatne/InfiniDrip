# G04 V03 CAD rights prerequisite review — Slice 421

## Start boundary and authority

- Started 2026-10-07 09:29:56 UTC from clean S420 `ccb21a0447490fe33be835169ff3b2293aca738a` on `codex/epic-17-g04`. Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Highest assigned slice is 420; S421 is unique. Canonical board revision is 2453. V01 Done, V02 In Progress, V03 Backlog. The active goal remains the full admitted G04 objective.
- The admission packet permits no-cost receiver/parser research before selecting a profile but gates receiver/profile implementation and exact compatibility claims until all-seven V02 passes. V02 has not passed. This slice is prerequisite rights/source research only; it does not start V03 implementation or select a receiver, version, or profile.
- Usage at entry was 48% primary / 8% weekly. The previous S420 exit was documentation/board-only; current HEAD is its landed commit.

## Scope and acceptance

- Review current official primary sources for plausible no-cost CAD receivers/parsers: their licensing/terms, apparel-pattern capabilities, documented interchange formats and units/grades/notches/labels, and stated import/export limits. Record exact source/version and access date.
- Distinguish: rights evidence, product capability claims, and properties that can only be proven by actual import/round-trip fixtures. A generic DXF viewer/parser does not establish an industrial apparel-CAD receiver.
- Do not install software, accept terms on the maintainer's behalf, spend money, open a trial/account, contact a supplier/vendor, send project files, change the exporter, produce an exact compatibility claim, or move G04-V03 out of Backlog.
- Preserve V02-before-V03, all-seven acceptance, generic legacy DXF behavior and protected export identities. Report the concrete receiver/profile qualification gap and what evidence a later admitted V03 implementation would require.
- Link the rights research packet to G04-V03 and EPIC-17 using the validated command layer, explicitly labeling it prerequisite research only. Run focused research assertions if present, Control Center tests and `git diff --check`; do not run global production gates for a documentation-only slice.

## Start-board record

Validated start commands and clone preflight are in `S421-start-board-commands.json` and `S421-start-preflight.json`.

## Findings (official public sources checked 2026-10-07)

| Candidate | Rights/access evidence | Documented CAD role and capability | Qualification result |
|---|---|---|---|
| CLO (current support docs; exact receiver version still to be selected) | CLO's trial requires an account, billing address, payment information and selected plan; the plan auto-starts as paid after 14 days unless canceled. Business/academic access requires separate vendor contact. No account, trial, or contact was initiated. | Official support documents Standard DXF, DXF-AAMA and DXF-ASTM import/export; import units, rotation and pattern annotations; seam-allowance conversion; export of one selected size group and grading embedded or in a separate rule file. CLO lists Yuka, Gerber, Lectra, StyleCAD, Optitex and PAD System as apparel CAD ecosystems. | Strongest documented industrial-apparel receiver candidate, but not available for this no-cost/no-contact research slice. Capability claims do not prove that our generic DXF imports correctly or survives export. No receiver/version/profile selected. |
| Valentina 1.1.x | Official project states GPL-3.0-or-later; the primary repository points to `LICENSE_GPL.txt`. | Official release notes explicitly describe DXF-AAMA/ASTM compatibility **for export to CLO3D**. The checked release notes do not establish DXF input as a pattern receiver. | No-cost patternmaking application, but public evidence checked supports outbound DXF, not receiving our DXF. Not qualified as receiver. This conclusion is limited to sources checked; it is not a claim that no import mechanism exists anywhere in the project. |
| Seamly2D current `develop` / 2026 release line | Official repository states GPLv3+ and shows Windows/macOS/Linux builds. | Official repository's current README describes `.sm2d` as the CLI input pattern file; source-tree inspection found the DXF library/export paths but did not identify a documented apparel-DXF importer. The current public user wiki is explicitly marked as needing updates. | No-cost patternmaking application; available evidence does not qualify it as a receiver for our DXF. Source-tree filename inspection is not a complete proof of feature absence, so this remains “not established,” not “impossible.” |
| LibreCAD 2.2.x | Official product site states GPLv2 and no subscription/license fee. | Official docs describe generic Autodesk DXF import/export and support limits for R12, R14, 2000, 2004 and 2007; no apparel grading, notch, seam-allowance or pattern-piece semantics are documented. | Useful only as a generic DXF viewer/parser candidate. It does not satisfy the industrial apparel CAD receiver criterion; an entity-level parse would not prove apparel interchange. |

### Evidence classes and limits

- **Rights evidence:** GPL statements describe rights to use/modify/distribute those applications subject to their licenses; they do not grant rights to a vendor's paid product or determine rights in exported files. CLO's published trial flow is not a no-cost basis here because it requires payment details and auto-converts to a paid plan. No terms were accepted.
- **Vendor capability claims:** CLO's current help center documents bidirectional format support and relevant options. Valentina's release notes document outbound DXF-AAMA/ASTM. LibreCAD documents generic DXF support. These statements identify testable candidates, not observed performance on InfiniDrip fixtures.
- **Not established without fixtures:** actual parsing of our POLYLINE/MARK_* content, centimeter scale, piece identity/count, orientation, bounds, notches/labels/grade/allowance semantics, preservation on re-export, and unsupported-content behavior. The frozen generic DXF is not asserted to be AAMA/ASTM.
- **Disposition:** this search found no demonstrably no-cost industrial apparel CAD receiver with public evidence of receiving our source profile. CLO is the best documented receiver but its currently published access path crosses the paid-license gate. No software was installed, no file was sent externally, and no import/round trip was run. V03 remains Backlog until V02 passes and a rights-cleared receiver/profile is available. At that later gate either obtain explicit direction for a lawful paid/contact path or document a source-supported no-go; do not silently substitute LibreCAD or an exporter for a receiver.

### Sources

Accessed 2026-10-07. Official/primary pages:

- CLO [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export) (updated 2026-09-28); [CLO trial terms and steps](https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version); [using CLO with another 2D CAD](https://support.clo3d.com/hc/en-us/articles/115013367108-I-use-a-2D-CAD-system-from-another-software-company-Can-I-still-use-CLO).
- [Valentina official project and license summary](https://gitlab.com/smart-pattern/valentina); [official Valentina releases](https://gitlab.com/smart-pattern/valentina/-/releases), including 1.0.0 DXF-AAMA/ASTM export-to-CLO3D notes.
- [Seamly2D official repository](https://github.com/FashionFreedom/Seamly2D), including current README/license and source tree.
- LibreCAD [official product/licensing/features](https://www.librecad.org/) and [official 2.2.x DXF documentation](https://docs.librecad.org/en/latest/ref/menu.html), plus [official DXF version limitations](https://dokuwiki.librecad.org/doku.php/usage:faq).

## Exit evidence

- Research closeout at 2026-10-07 09:33 UTC. S421 began 09:29:56 UTC from S420 `ccb21a0447490fe33be835169ff3b2293aca738a`; `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains the verified ancestor. Slice 421 is unique. Validated start replay advanced board 2453→2456; exit replay linked this packet to G04-V03 and EPIC-17 and added its closeout comment, advancing 2456→2459. All Epic and work-item statuses are unchanged; clone preflight from committed S420 reproduces 2453→2459 and preserves V03 Backlog.
- Result: no no-cost industrial apparel receiver is qualified by the checked public evidence. CLO is a documented receiver candidate but requires a paid-converting trial/payment details or separate business contact. Valentina's checked DXF evidence is export-oriented; Seamly2D and LibreCAD are not established as apparel-DXF receivers. No profile selected and no V03 implementation or compatibility claim.
- V02 remains In Progress; V03 remains Backlog. All 56 Woven and 34 Polo faces remain held, including unresolved S410 neckline and S419 H-marker decisions and the 0.68 cm Polo residual over 0.25 cm. V02 acceptance, all-seven recipe coverage, generic legacy DXF behavior and protected export identities are unchanged.
- Focused gates: `npm run control-center:test` passes 42/42; the command layer validated/replayed all three exit commands after successful clone preflight; the Control Center board parser/test validates canonical schema; both replay scripts pass `node --check`; `git diff --check` passes. No production code or production tests changed, so no changed-code coverage/build/export gate is due. Global integrated gates remain reserved for the settled Epic candidate.
- Elapsed work ~4m: official-source and local-source review 2m; packet, state and board closeout 1m; focused verification 1m; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** resume V02 blocker work from the latest verified board. Keep V03 Backlog; revisit receiver/profile selection only after all-seven V02 passes and a rights-cleared path is established.
