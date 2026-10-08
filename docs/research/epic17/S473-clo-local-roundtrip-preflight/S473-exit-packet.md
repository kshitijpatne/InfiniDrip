# EPIC-17 / G04 V03 CLO local-roundtrip preflight — Slice 473 exit

## Result

S473 records owner-provided preflight evidence and prepares the first actual
receiver test input. The owner reports CLO 2026.1.310 is available with all
features during a free 14-day trial and confirms that ordinary DXF operations
use local files. Use is limited to that no-charge trial window; no paid access,
subscription changes, account inspection, vendor contact or hosted service is
part of this test. This owner statement is not an independent legal review or a
claim about access after the stated 14 days.

The supplied screenshots show version `2026.1.310 (r58944)`, top-level
`File > Import > DXF`, and top-level `File > Export > DXF`. They show no
dialog-level profile, unit or export settings. The owner confirms local file
handling; the screenshots themselves do not prove that fact. No file has yet
been imported/exported through CLO, so the exact active exchange profile and
all round-trip behavior remain unverified. CLO remains a receiver candidate;
no apparel-CAD compatibility claim is made.

The S463 `tee-standard-m.dxf` source was copied byte-for-byte to `inputs/` and
verified against the source manifest SHA-256
`0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`.
The source fixture was not changed. The screenshot copies are preserved in
`evidence/`; their exact SHA-256 values and byte lengths are recorded in
`preflight-evidence.json`. The empty `receiver-outputs/` is ready for the
owner-operated native export.

## Gates and current disposition

- **Owner trial-access statement:** sufficient to proceed with this bounded
  no-charge test inside the reported 14-day access window; it does not
  authorize a purchase or test after the window.
- **Local handling:** owner-confirmed; no upload is reported.
- **Visible application menu:** top-level `DXF` on Import and Export, as shown
  in the attached screenshots.
- **Dialog-level profile/settings:** pending the actual import/export dialogs.
- **Receiver test:** pending an import, native save/reopen, DXF export and
  returned output file.
- **V03 acceptance:** still In Progress. No receiver profile is selected and
  no criterion is relaxed.
- **Preservation:** generic DXF writer, S463 source fixtures, protected export
  bytes and V02 status remain unchanged.

## Verification

- Start: 2026-10-08 05:59:47 UTC from clean S472 commit
  `af111518b0d1e9abe9b91acefcb36b963396036c`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; highest slice
  472, S473 unique.
- Canonical board revision 2911 at start; validated start replay 2911→2915;
  EPIC-17 and G04-V03 remain In Progress; V01/V02 Done.
- The S473 preflight verifier confirms the copied Tee fixture hash/length and
  screenshot PNG signatures. S463 originals remain unchanged.
- `npm run control-center:test`: 42/42 pass. Board exit replay advances
  revision 2915→2919 without changing Epic or V03 status.
- `git diff --check` passes. No production source or tests changed, so global
  coverage/build/Electron/export gates are not due.
- End: 2026-10-08 06:02:33 UTC (2m46s elapsed): evidence/context/runbook and
  fixture preparation 1m32s; focused verification and validated board work
  1m14s; external-agent waits 0m; maintainer-decision wait 0m (owner evidence
  was supplied before slice start).

## Next action

Use `clo-tee-trial-runbook.md` to import the prepared Tee copy in CLO 2026.1.310
within the reported free window. The source uses centimeter coordinates but
does not declare units; if asked, select centimeters and record the exact
dialog label/profile and warnings. Inspect the 2D pattern, save/reopen a native
copy, export to `receiver-outputs/tee-standard-m-clo-export.dxf`, and return
the output DXF with import/export/result screenshots. Codex then parses the
actual file and checks entity/layer inventory, closed contours, scale,
orientation, bounds and coordinate deltas against the original quantized
input (C04 maximum 0.001 cm). A successful menu invocation or visual open
alone does not pass the exchange gate.

No broad product code or new profile is authorized by this slice. If CLO's
actual export changes geometry beyond the bound or loses required entities,
record the failure and keep V03 open. Preserve legacy DXF and all protected
export byte identities.
