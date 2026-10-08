# EPIC-17 / G04 V03 rights and receiver review — Slice 460 exit

## Result

S460 completed the current-source rights/capability recheck and inspected the actual InfiniDrip DXF writer, its tests, C04 profile contract, and protected export regression. The exact post-S459 board now has V03 In Progress. **No receiver or profile is selected, no interchange format is proven, and V03 is not complete.** The remaining critical gate is lawful, testable access to an industrial apparel-CAD receiver and its exact version/profile. The strongest documented candidate is CLO, but the current standard trial crosses the project’s no-spend/no-contact boundary and requires the account owner to satisfy its eligibility and payment steps.

## Current source evidence (checked 2026-10-08)

| Candidate | Directly sourced evidence | Finding for G04 |
|---|---|---|
| **CLO** | Current CLO help center (updated 2026-09-28) documents import as Standard DXF / DXF-AAMA / DXF-ASTM with selectable units, annotation import, notch placement, and seam-allowance conversion. Export offers those three format labels, selected size group, unit selection, and grading embedded or as a separate rule file. The trial article (updated 2026-10-07) says the Individual trial is 14 days, requires an account, billing address and payment information, automatically starts the chosen paid plan after the trial; enterprise/academic entities must contact business development separately. | **Best candidate for a receiver-specific proof, not a selected receiver.** Published capability is vendor documentation only; no InfiniDrip fixture has been imported or round-tripped. The public account path cannot be initiated under current no-spend/no-contact and user-eligibility constraints. If later approved and accessed, prefer testing the vendor-named `DXF-ASTM` mode as a CLO-version-specific profile; do not claim conformance to an active ASTM standard solely from that label. Record the exact installed CLO build and settings. |
| **Valentina 1.1.1** | Official project is GPL-3.0-or-later. Official v1.1.1 release notes dated 2026-09-18 describe DXF export fixes (including AAMA/ASTM text, labels/markers and size-dependent geometry); the v1.0.0 release notes describe AAMA/ASTM DXF compatibility for export to CLO3D. The checked current docs/releases do not establish import of InfiniDrip DXF into Valentina. | **Not qualified as receiver.** Current update strengthens its outbound export evidence; it does not close the receiving/round-trip gap. This is “not established by checked sources,” not proof that no import feature exists. GPL rights for the program do not establish profile fidelity. |
| **Seamly2D** | Official repository identifies GPLv3+; current release page lists immutable release `2026.9.28.151`. Its README describes native `.sm2d` pattern files; S421’s source-tree review found export-oriented DXF evidence and no documented apparel-DXF import path. | **Not qualified.** Current release recency is not receiver evidence. Keep the conclusion limited to the official evidence checked; no impossibility claim. |
| **LibreCAD 2.2.x** | Official manual documents a GPLv2 generic 2D CAD application that reads/writes DXF and supports generic drawing entities. | **Useful only as a generic DXF viewer/parser.** It does not document garment grading, apparel notch, allowance, piece identity or pattern-specific round-trip semantics; a LibreCAD open/save check cannot satisfy V03’s industrial receiver gate. |
| **OpenMarker (additional candidate)** | Project’s own repository states Apache-2.0, local apparel marker/nesting purpose, DXF import for ET-CAD-style INSERT files plus modelspace fallback, and “not yet production-ready.” It explicitly lists saved-layout export as still planned and says it does not target commercial-suite feature parity in its first version. | **Not a V03 receiver.** It is a useful future local pattern-layout/nesting research lead, but current importer-only support cannot provide the required import/export/round-trip proof or industrial CAD profile. No source files were sent; not installed. |

### Standards and profile wording

ASTM’s current catalog identifies **D6673-10 as withdrawn in 2019**. The older published D6673 scope describes sewn-pattern CAD exchange using DXF plus a separately formatted grade-rule file, but the withdrawal means we must not call a new output “compliant with the current ASTM D6673 standard.” CLO's current UI documentation still offers a product mode called `DXF-ASTM`; that is a receiver/product capability label, not evidence of present ASTM conformance. If CLO access is later approved, document the exact vendor mode and observed behavior, and limit any compatibility claim to the tested CLO version/settings and fixtures.

No rights-cleared, documented no-cost industrial apparel receiver emerged from this recheck. S421’s conclusions remain substantially current, with the addition that Valentina has a newer release and OpenMarker is a newly surfaced but incomplete parser/layout candidate.

## InfiniDrip source and fixture contract

**Directly encoded in source:** [src/export/dxf.ts](../../../../src/export/dxf.ts) emits an entities-only stream: closed `POLYLINE` / `VERTEX` / `SEQEND` cut and sew paths on `CUT` / `SEW`; marks are `LINE`, `CIRCLE` or `POINT` on `MARK_*`; Y is flipped for CAD-up; vertices and marks are rounded to 0.001 cm; source curves are flattened; `layoutPieces` separates source pieces on one sheet. The writer declares no `$ACADVER`, unit variable, tables, piece name/ID, size ID, grade rules or paired-seam identity. The current UI invokes a single-size export. Pattern-mark names/labels are not serialized. These are generic-DXF semantics only.

**Directly encoded in tests/contracts:** current tests check section/entity shape, cut/sew layer names and mark entity/layer presence. `src/export/regression.test.ts` freezes the legacy DXF hashes. The C04 contract at [C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md](../../epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md) defines the downstream pass comparison: separate selectable pieces; quantized coordinates with per-coordinate difference no greater than 0.001 cm; exact units/orientation, cut/sew/marks, closed contours, and explicit unsupported behavior; a receiver screenshot/native inspection; simple, complex marked, multi-size/grade and negative fixtures. It explicitly disallows replacing a receiver import with “DXF opened.”

**Unresolved and requiring real receiver evidence:** whether the selected profile can distinguish the flattened source-piece contours after layout; whether the importer knows scale/units absent a declaration; how CUT/SEW/`MARK_*` are interpreted; whether `CIRCLE` button points, fold/cut/placement lines, notches, seam allowance, identity and labels survive export; whether grade/rule data can be represented; exact warnings for dropped/unsupported data; and whether a re-export remains within the C04 0.001 cm per-coordinate digital threshold. Generic parsing or visual opening cannot resolve those questions.

The current source header comment broadly says the output is read by professional cutters/“virtually every tool”; the C04-supported user-facing description is narrower: “generic DXF geometry export (cm coordinate convention; no declared units or grade metadata).” S460 makes no UI or export change. A narrowly scoped truthful label correction should be included with any future V03 product-surface change if that claim remains visible; it must not alter the legacy file bytes.

## Recommendation and blocking decision

**Recommended next path:** retain all V03 criteria and ask the product owner to provide access to an already licensed local apparel-CAD receiver (CLO or another exact receiver/version) with permission for local test fixtures. For current available evidence, CLO is the strongest candidate. If no existing license is available, the owner must decide whether they personally want to initiate an eligible CLO Individual trial or authorize another lawful access path; the trial requires their own account, billing address, payment information, and cancellation before day 14 to avoid the paid plan. Codex must not initiate that workflow, enter billing/payment details, accept terms, or contact CLO. A hold/no-go would keep V03 incomplete unless the owner separately authorizes an explicit scope/acceptance revision; no acceptance was weakened here.

Once an exact licensed receiver/version is provided or authorized, the next slice can freeze the version/settings and fixtures, create additive versioned profile output alongside the generic writer, and verify the simple, complex, multi-size, negative and true import/export/round-trip cases. Keep all compatibility wording held until actual results are reviewed. Do not move protected hashes or claim factory acceptance.

## Exit checks and status

- S459 V02 remains accepted: all seven recipes / 73 configurations / 146 live faces. No V02 threshold, decision or acceptance criterion changed.
- G04-V03 remains **In Progress** for the admitted evidence and fixture-definition work, not marked Done or claimed to pass. Exact receiver access is an implementation/round-trip dependency. The Epic summary was reconciled to this current state through the validated `S460-summary-command.json` at board revision 2810.
- Manual finding MQF-015 remains **To be reviewed** for the actual V03 output exit; S460 does not close it or reopen deferred work.
- The first Control Center test run failed 8 status assertions because historical tests required V03 to remain Backlog. `control-center-initial-failure.log` retains the failure. The assertions were updated to current V02/V03 status, preserving historical evidence content. A later summary-description update exposed two stale wording assertions; `control-center-summary-failure.log` preserves them and the summary was reconciled to retain the historical Woven decision phrases while stating current V03 status. `npm run control-center:test` then passes 42/42. Start-board clone preflight/replay passed 2795→2801; exit evidence replay passed 2801→2808; summary update command preflight/replay passed 2809→2810. `git diff --check` passes. No production source or export changed; no global coverage/build/Electron/export identity rerun is due.
- Goal inspection at the S459/S460 boundary confirms its status is **active** and its wording matches the admitted objective through safe merge/deployment. It remains necessary. No UI resume action is needed.
- Preserve `origin/main` ancestry; no merge or push at this V03 gate.

## Sources

Official/primary pages checked 2026-10-08:

- CLO, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export) (updated 2026-09-28).
- CLO, [How do I start a CLO free trial version?](https://support.clo3d.com/hc/en-us/articles/115012788967-How-do-I-start-a-CLO-free-trial-version) (updated 2026-10-07).
- Valentina, [official release tags](https://gitlab.com/smart-pattern/valentina/-/tags), [official project/license](https://gitlab.com/smart-pattern/valentina).
- Seamly2D, [official repository](https://github.com/FashionFreedom/Seamly2D), [official releases](https://github.com/FashionFreedom/Seamly2D/releases).
- LibreCAD, [official 2.2 user manual](https://docs.librecad.org/en/2.2.0_a/about/).
- OpenMarker, [official repository and current README](https://github.com/Weilei424/openmarker) and [repository license](https://github.com/Weilei424/openmarker/blob/main/LICENSE).
- ASTM, [D6673-10 current catalog entry](https://store.astm.org/d6673-10.html), [textile standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html).
- InfiniDrip profile/fixture boundaries: `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`, especially “CAD decision and round-trip acceptance boundary.”

## Timing and next action

Start 04:02:26 UTC; exit 04:08:41 UTC (~6m15s elapsed). Category timing: research/source inspection ~2m30s; packet, fixture contract, state and board records ~2m15s; focused verification and stale-board-test repair ~1m30s; external-agent waits 0m; maintainer-decision time 0m. **Next action:** request the exact lawful local receiver/access path from the owner (or keep V03 on an explicit access hold); once resolved, freeze that version/profile and begin receiver-specific fixtures and actual round-trip proof. No manual goal resume is needed; it is already active.
