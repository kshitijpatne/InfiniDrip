# EPIC-17 / G04 V03 — DGS update and DXF route check — Slice 659 exit

## Result

The S657 rollback and official archive preflight held. The user had completed
the MPVCI setup while the goal was waiting: the installer processes/dialog are
gone, and read-only uninstall-registry entries now list MultiPack Visual C++
Installer V2.7 and Microsoft Visual C++ 2010 x64/x86 Redistributables
10.0.40219 dated 20261010.

The S651 official DGS upgrade archive still hashes to
`B8236F0B4BA00361D608C580B1738C551D771A3241E95A6492FE43013AF7B48F`.
Its 15 flat payload entries were extracted to
`C:\G04-GetonAgain-CAD-Exchange\S659-dgs-update\staging\`; each extracted
length and SHA-256 was checked against its own ZIP entry. All 15 live original
files first matched the S657 rollback manifest. The exact 15 official files
were then copied over the installed DGS payload. Post-copy length and SHA-256
match the staged official payload for every file. The S657 rollback remains
intact and rechecked. Full pre/post records are in the C:-only
`preupdate-manifest.json`, `staging-manifest.json`, and `apply-manifest.json`.

An initial staging guard incorrectly compared updated `.lan` payload sizes to
the old installed sizes and stopped before any installed file was changed.
The corrective check compared the extracted lengths and hashes to their exact
ZIP entries instead; it passed all 15 entries. This distinction and the
no-change-before-correction behavior are recorded here.

Updated DGS launches as a responsive window. The installed `DGS.exe` file
version is still `2023.1.0.0`, but its SHA-256 changed from the S657 build to
the archive's new payload
`97CBBEFCAAD74EF558D19695F898611F7FE0E8E503525D0832EECAC01C859EB0`.
More decisively, the actual Help → About DGS dialog reports `VID:20250610`,
matching the official archive date. Do not describe the update as a new
semantic version; record both identifiers.

## Actual local DXF route observed

With no pattern loaded, the actual updated DGS File menu shows:

- **Import DXF file** enabled.
- **Export DXF file** disabled while the workspace is empty.

Opening Import DXF opens a native local `Open` picker with filter
`DXF Files (*.dxf)` and the default Documents folder. No file was selected or
opened. The import dialog visibly offers `ASTM/AAMA`, `TIIP`, and `AUTOCAD`
modes; `Pattern`/`Design`; `Import text`; Grainline (`2 Way` shown); `Unit of
file` or `Scale by mm` (1.0 shown disabled); Point type (`Ignore` shown
disabled) and 2.5 mm radius; `Only base size`; `Recognize seam`; and `Nest
pattern`. The observed defaults were ASTM/AAMA, Pattern, Import text on,
Grainline 2 Way, Unit of file, Only base size off, Recognize seam on, Nest
pattern on. These are user-facing options only, not proof of standards
conformance or of entity semantics. The picker and import dialog were canceled
without selection; DGS remains at the empty workspace.

## Candidate/profile decision and gate disposition

GetonAgain is now proven to expose a direct local DXF input route in the
updated build. It is not yet an eligible, qualified V03 exchange profile:
S653's first-party manual review (printed pp. 239–241) and the actual dialog
still do not define the DXF database version, accepted entity/layer/role map,
coordinate precision, stable identity and relationship association, or
sidecar schema. The generic S648 OpenCAD R14 fixture is not shown by the manual
to satisfy the candidate's exact profile contract. Per S649's stop-first
plan, no fixture was imported because that contract cannot currently be
matched; no mode or encoding permutation was tried. No export dialog could be
opened without an imported/drafted pattern.

- MPVCI registry completion: **verified**.
- Official DGS bundle integrity, copy, rollback and `VID:20250610` launch:
  **passed**.
- Direct local DXF input path and `.dxf` filter: **verified**.
- Exact DXF profile/entity/layer/sidecar contract: **unproven**.
- Export route/settings: **unproven** (disabled with blank workspace).
- Geometry, units, piece/grade identity and relations, seams/marks,
  malformed-input behavior, repeated round trips, readable rendered output,
  and all-seven/options/grades: **unproven**; no fixture was exchanged.
- V03 remains Blocked; EPIC-17 remains In Progress. V01/V02 remain Done.
  All acceptance, `0.001 cm` threshold, holds, legacy DXF behavior, protected
  export identities and claim boundaries remain unchanged.
- No ANSI/AAMA or ASTM conformance, physical-fit, factory-acceptance, or
  production-readiness claim.

## Verification and closeout

- Start: 2026-10-10 07:15 UTC, clean S658 commit
  `c8397c0410cef333081727dff7a3c887c57a51a8`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; board revision
  3807; S658 highest and S659 unique.
- Board start evidence was linked through validated commands at revision
  3810; exit evidence and current descriptions/comments are linked at revision
  3817.
- C: preflight verified the official ZIP hash, 15 flat member names, all 15
  rollback hashes, and an unused S659 folder. C:-only stage and apply
  manifests preserve exact names, sizes, versions, and SHA-256 values.
- Read-only UI inspection verified About VID, enabled import route, local DXF
  filter, import options, and disabled empty-workspace export. No pattern or
  DXF file was opened or saved.
- Focused repository verification: `npm run control-center:test` passed
  42/42; `git diff --check` passed. No production source/test change;
  changed-code coverage is not applicable. Full repository coverage/build and
  final output review remain for the settled Epic/PR candidate.
- Time: implementation/update and UI route inspection 3 minutes; focused
  verification and durable closeout 3 minutes; external-agent wait 0;
  maintainer-decision time 0.

## Next action

Resolve the exact import profile and entity/sidecar contract from a specific
primary technical source or a clearly matching, source-exact profile fixture.
Do not import the generic S648 fixture or select an ASTM/AAMA/TIIP/AutoCAD mode
by assumption. Once a documented/matched contract exists, reserve one
representative Polo M pilot under S649's fixed no-repair, no-scale, no-rotate
pre-export gate. Keep DGS and GMS open for this ongoing evaluation.
