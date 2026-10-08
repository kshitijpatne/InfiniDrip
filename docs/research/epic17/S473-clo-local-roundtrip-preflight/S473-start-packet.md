# EPIC-17 / G04 V03 — CLO local round-trip preflight — Slice 473 start

## Verified starting point

- **Start:** 2026-10-08 05:59:47 UTC.
- **Worktree / branch:** `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`, `codex/epic-17-g04`.
- **Starting commit:** `af111518b0d1e9abe9b91acefcb36b963396036c` (`Slice 472: qualify CLO receiver candidate`); clean.
- **Git:** refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. Highest assigned slice across refs is 472; S473 is unique.
- **Canonical board:** revision 2911; EPIC-17 and G04-V03 In Progress; V01/V02 Done.
- **Goal:** active, full admitted V01→V02→V03 objective remains required through safe merge and deployment.
- **Usage:** primary 2% used; ordinary work allowed.

## Objective

Record the owner's bounded CLO access evidence and prepare the first synthetic
local import/export trial without changing the generic DXF writer or source
fixtures. The owner reports that the free trial provides all features for 14
days and confirms ordinary DXF operations use local files. Use only that
reported no-charge access window; no purchase, paid license, subscription
change, account inspection, vendor contact, hosted transfer, or private pattern
is part of this slice.

The owner screenshots show CLO version `2026.1.310 (r58944)`, top-level
`File > Import > DXF`, and top-level `File > Export > DXF`. They do **not** show
any dialog-level profile or unit choices. The owner confirms local-file
handling; that is owner-reported, not independently observed. The app's exact
import/export sub-options, selected profile, and actual handling remain to be
captured during the synthetic trial.

## Scope and gates

1. Preserve the two supplied CLO menu screenshots in this packet and record
   their exact visible labels and limits.
2. Copy only S463's `tee-standard-m.dxf` into this packet's `inputs/` folder;
   verify the copy hash against the S463 manifest. Keep S463 originals
   read-only.
3. Prepare an empty `receiver-outputs/` folder and a concise operator runbook
   for one Tee import, native save/reopen, and DXF re-export. Record exact
   dialog mode, units, warnings, piece/contour inventory, output path and
   screenshots. Preserve every receiver output byte-for-byte.
4. Do not record an industrial profile as selected or claim interoperability
   until actual native CLO output is independently parsed and compared against
   the input geometry and C04's per-coordinate 0.001 cm bound.
5. Do not open the Polo/Woven, grade-family, or negative fixtures in this
   slice. Do not change V03 acceptance, generic DXF, protected export identity,
   or any production source.
6. Update `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, and the canonical board via
   the validated Control Center command layer; run focused checks and preserve
   evidence.

## Explicit evidence boundaries

- **Owner-reported:** CLO 2026.1.310 is running, the 14-day trial exposes all
  features, and DXF file operations are local. The owner confirms the local
  handling annotation; no upload claim is inferred from the screenshots.
- **Screenshot-observed:** application version label `2026.1.310 (r58944)`;
  top-level Import and Export menus each contain a `DXF` entry.
- **Not shown:** profile selection inside dialogs, units, warnings, actual
  local file chooser behavior, round-trip geometry/marks, malformed-file
  handling, grading, standards conformance or industrial acceptance.
- **Risk boundary:** conduct the bounded test within the owner-reported free
  feature window. No product/account/billing settings will be inspected or
  changed. No automatic conversion or future paid use is authorized by this
  packet.

## Delegation and effort

No safe disjoint delegation: the work binds one native receiver session, its
exact settings, the paired outputs and same-fixture geometry comparison.
Codex owns file/hash verification and review; the owner performs the native
menu actions because the receiver is on the owner's desktop.

## Exit condition

This slice can close as a preflight/trial packet only after its start records,
screenshots, copy hash, board replay and focused verification are durable. If
the owner has not yet produced native import/export output, that remains an
explicit V03 blocker and the next slice must continue the same receiver test;
no round-trip pass or compatibility claim may be stated.
