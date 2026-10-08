# EPIC-17 / G04 V03 CLO Tee round-trip — Slice 475 start

## Goal and verified start

- **Earliest known start:** 2026-10-08 06:07:20 UTC, immediately after S474's
  verified boundary. The receiver interaction began before this packet was
  written; this workflow deviation is recorded rather than backdated as a
  contemporaneous packet. The packet is being written at 2026-10-08 06:14:33
  UTC, after the first import/native save/export/reimport sequence.
- **Branch/worktree:** `codex/epic-17-g04`,
  `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`.
- **Base:** clean S474 commit `d34f6f32dd75b5043ca52faf6414273e54f36d86`;
  refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. Highest assigned slice across refs is 474; S475 is unique.
- **Board:** revision 2927; EPIC-17 and G04-V03 In Progress; V01/V02 Done.
- **Usage:** primary 6%; ordinary work allowed.
- **Decision:** the user directed Codex to operate CLO and keep every working
  import/export file on C: under `C:\G04-CLO-DXF-Exchange`. This slice follows
  that instruction. No vendor upload, purchase, account change or subscription
  setting change is in scope.

## Exact slice scope

Use one byte-identified, standard-M Tee fixture in CLO 2026.1.310 (r58944),
then independently inspect the emitted ASTM DXF and compare it to the S474
source geometry oracle under G04 C04's 0.001 cm per-coordinate limit. Keep
every working input, native project, output DXF and rendered screenshot in
`C:\G04-CLO-DXF-Exchange` (with `Input`, `Output`, and `Evidence` subfolders).
The repository stores the durable analysis and hashes; it does not store a
second receiver output or screenshot copy.

## Receiver actions already completed before packet creation

The following are directly observed in the open CLO UI; output geometry checks
are not yet complete:

1. Copied the S473 Tee input byte-for-byte to
   `C:\G04-CLO-DXF-Exchange\Input\tee-standard-m.dxf`; length 6,750 bytes and
   SHA-256 `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`,
   matching the S463 manifest and S474 oracle.
2. Imported the source using `DXF-AAMA`, `Centimeter`, 100%, `Do Not Rotate`,
   and `Maintain Original` grain angle. `Import Notch to Both` and Ratio notch
   position were enabled; pattern annotation, auto-trace, line swap, auto
   distribute, curve optimization, draw-curve import and non-grading removal
   were off. No warning appeared at import. The 2D view showed the front, back
   and sleeve with separate outer and dotted inner contours.
3. Saved
   `C:\G04-CLO-DXF-Exchange\Output\tee-standard-m-clo.zprj`, then reopened it
   successfully; the pattern view remained present.
4. Exported
   `C:\G04-CLO-DXF-Exchange\Output\tee-standard-m-clo-export.dxf` with
   `DXF-ASTM`, `Graded Nest`, `Centimeter`, 100%, and `Do Not Rotate`.
   `Duplicate Notch on Seam Allowance` was checked; export-without-grading,
   without-base-lines, without-seam-allowance, curve-to-straight conversion,
   curve optimization and pattern-bounding-box options were unchecked. No
   export warning appeared. The UI displayed `DXF-ASTM`; this is the tested
   profile for this trial, not a product-wide receiver selection or
   compatibility claim.
5. Reimported the emitted file using matching `DXF-ASTM`, `Centimeter`, 100%,
   `Do Not Rotate`, `Maintain Original` grain angle, and the observed default
   import toggles. CLO displayed an information notice: the DXF contains seam
   allowances and they were imported in Custom mode to preserve their original
   shape; disabling Custom mode resets shapes and corner types. The notice was
   acknowledged. The resulting 2D view displays three pieces. Rendered
   geometry inspection and numeric comparison remain pending.

Screenshots are retained only under
`C:\G04-CLO-DXF-Exchange\Evidence`. Their names, SHA-256 values and sizes will
be inventoried at slice exit. No `.zprj`, DXF or screenshot from the live trial
will be copied into the repository.

## Acceptance / exit evidence

1. Confirm source/output/Native project file hashes, lengths and C: paths.
2. Parse the actual CLO ASTM output without normalizing away differences. Report
   entity types, section/block/model-space inventories, layers, contours,
   closure, order/association when supportable, units claim from observed UI,
   scale/orientation, bounds and point counts.
3. Match every source CUT/SEW outline to the receiver output by a documented
   geometric method. Report per-outline maximum coordinate delta, using
   `<= 0.001 cm` as C04's unchanged threshold; fail if correspondence is
   ambiguous, entities are missing/merged/rescaled/reinterpreted, or evidence
   does not meet the threshold.
4. Inspect the rendered source import, native reopen and ASTM reimport views;
   record visible pieces, seam allowances/custom mode and any warnings or
   misleading changes.
5. Preserve all screenshots and actual DXF/project files only in the named C:
   folder, and reference their paths/hashes from the durable exit packet.
6. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md` and the canonical Control
   Center board through its validated command layer. Keep V03 In Progress unless
   every V03 gate passes; a single CLO Tee trial cannot prove Polo/Woven, grading
   or factory acceptance.

## Non-goals and gates

No production code/exporter change, profile-wide compatibility claim, broad
CAD support, protected byte-identity change, fixture editing, second garment,
physical sampling, fit claim, supplier/factory acceptance or paid receiver use.
Do not use another profile to make this round trip pass. Record failures as
failures. Preserve G04's all-seven V02 and C04/C05/C06/C07/C08/C09/C10 V03 gates.

## Workflow deviation and timing

The desktop trial operations preceded this start packet because continuation
began directly from S474's verified boundary. S475 records the sequence
retrospectively and requires all remaining checks to be executed from this
durable scope. Implementation/evidence gathering elapsed from the nearest
known start boundary (06:07:20–06:14:33 UTC: 7m13s); the exact portion before
packet creation cannot be split reliably. Focused output analysis, rendered
review after reimport, durable closeout, external-agent wait and maintainer
decision durations will be recorded separately at exit. No delegation is
appropriate: the live receiver trial and fixture-specific output association
require one accountable operator.

