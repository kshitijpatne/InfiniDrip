# EPIC-17 / G04 V03 — Slice 498 live CLO practical retest

## Authority and verified start

The maintainer explicitly directed Codex to use the installed CLO trial for
practical import/export tests and to save every exchange file only beneath
`C:\\G04-CLO-DXF-Exchange`. At S497 closeout, the maintainer reported CLO was
running. This slice first inspects that existing app window; it will not start
another process if the app is absent or stuck.

Started `2026-10-08 14:20:55 UTC` from clean S497
`586fcf3ebe420c273a95297abb5838f05f21e53f` on `codex/epic-17-g04`;
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S497 is
the highest assigned slice; S498 is reserved. Board revision 3095 records
EPIC-17/G04-V03 In Progress and V01/V02 Done. Primary usage was 7% used. No
local code or exchange files were dirty before this packet.

## Scope

Observe whether CLO 2026.1.310 currently presents a responsive workspace. If
so, use the existing M-size Tee, Polo, and Woven source DXFs under
`C:\\G04-CLO-DXF-Exchange\\Input` to repeat import/export/reimport scenarios
in CLO's observed AAMA import and ASTM export menus. Save only new outputs,
native projects, and durable evidence beneath
`C:\\G04-CLO-DXF-Exchange\\S498-practical-retest`. Compare geometry, piece
counts, entity/mark behavior, warnings, and repeat-generation behavior with
S475–S478 without changing acceptance thresholds. Prior Polo 5/18 CUT-contour
failure is a specific target for reproduction.

No code/pattern geometry edits, cloud upload, CLO-SET/CONNECT use, account or
terms action, ACL/driver/security/network changes, acceptance-threshold change,
or production/physical/factory claim. Do not claim local-only processing from
the local file path alone. Preserve every failed or warning result.

## Gates and stop conditions

1. Inspect the existing CLO window; proceed only if a responsive 2D pattern
   workspace is visible and no login, permission, upload, account, or terms
   prompt needs action.
2. Confirm the exact import/export options from the visible app state before
   acting. Preserve source fixtures and previous output identities by using
   new S498 output names. Keep all import/export paths inside the named C:
   exchange folder.
3. Record each successful or failed operation and screenshot/output evidence.
   Recompute the same geometry metrics at the existing `0.001 cm` threshold;
   run only comparisons supported by the existing fixture/harness.
4. If the workspace is nonresponsive, a new application error appears, or an
   action would transmit files or change account/security/rights state, record
   the concrete observation and do not bypass it. Do not infer general CLO
   incompatibility from a machine startup issue.
5. Gate 0 rights and local-only processing remain claims gates pending written
   evidence. This maintainer-authorized practical trial may gather technical
   behavior; it does not itself establish contract scope or data-handling
   guarantees. V03 stays In Progress until every admitted acceptance gate is
   evidenced.

## Existing baseline

S493 records CLO 2026.1.310: Tee M 6/6 contours within threshold; Woven M
24/24 and second generation 24/24 with 114/114 inter-generation matches;
Polo M 13/18 with five CUT contours above threshold. Imports displayed a
seam-allowance information notice. Numeric layers remain semantically
ambiguous; piece identity/selectability, native grading, malformed-input
rejection, independent receiver acceptance, rights, and local-only processing
remain unproven. This retest may confirm or contradict technical observations;
it cannot retroactively clear the remaining gates.

The staged practical inputs copied beneath `S498-practical-retest\Input` were
hash-checked before UI use: malformed truncated-EOF Tee control SHA-256
`89C01B3DCE1424E9D6655A7D7383543EDDD4C070B801726DFE91BCF0832CBC24`;
Tee XS `565D1413ECF213900017F96A3F6E3E5B3686C511CAC2B644CDDE0878141FC030`;
Tee M `0B6CBA95C9AFD4CC6F17A2171F67303E0891BABB94828816C149767935165FC9`;
Tee XL `B4DAED074B1E261A4D20CB00A186D6D723F1D08D554E44A3F3774AFF5A06D9B3`.

## Ownership and next action

Codex owns the UI sequence, file paths, evidence capture and geometry
comparison. The integrated GUI trial is stateful and not safely delegable as a
parallel operation. No external agent is assigned. First action: inspect the
currently running CLO window through the approved Windows Computer Use API.
