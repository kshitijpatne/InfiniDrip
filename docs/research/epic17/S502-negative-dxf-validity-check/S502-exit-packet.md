# EPIC-17 / G04 V03 — Slice 502 negative-DXF control validity

## Finding

The S463 negative fixture is structurally malformed exactly as its plan says:
it contains an unmatched DXF group code with no associated value. The S463
generator replaces the valid Tee M file's terminal pair `0 / EOF` with a
single terminal `0`. The negative file therefore ends `0 / ENDSEC / 0`; after
the final group code there is no value line. Autodesk's DXF documentation
states that each group code is followed by its associated value, and that a
code `0` introduces an entity, section, table, or file-separator name. The
file also lacks the terminal `0 / EOF` pair used by the valid fixture. These
facts establish the fixture's invalidity under the documented group/value
structure; Autodesk's general pages do not prescribe a particular third-party
importer's recovery behavior.

S498 imported this exact malformed file in CLO without an error/warning and
rendered the three Tee outlines. Under the unchanged S463 acceptance rule—an
importer must reject or explicitly report a group code with no value—this is
a negative-control failure. The evidence does not reveal whether CLO ignored,
discarded, or repaired the trailing unmatched code internally, and it does not
establish behavior for other malformed inputs or general AAMA/ASTM/R12
conformance.

## Fixture identity and verification

- Positive Tee M: 6,750 bytes; ends `0 / ENDSEC / 0 / EOF`.
- Negative S463 file: 6,746 bytes; SHA-256
  `89C01B3DCE1424E9D6655A7D7383543EDDD4C070B801726DFE91BCF0832CBC24`;
  ends `0 / ENDSEC / 0` and has an odd line count.
- The negative file is byte-for-byte the positive fixture with only the
  generator's terminal replacement applied. The C: copy used by S498 has the
  same size and SHA-256 as the repository negative fixture.
- `node docs/research/epic17/S463-v03-receiver-fixture-pack/verify-fixtures.mjs`
  passes: 6 positive fixtures, 1 negative fixture, and the size series all
  match their hash/structure assertions.

### Primary format references

- [Autodesk, About Group Codes in DXF Files](https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-89CB823D-614D-4D1E-8204-568EC72DF869.htm): the line following each group code is its associated value; code `0` introduces a named entity/object/class/table entry or file separator; special codes mark section and file boundaries.
- [Autodesk, About the General DXF File Structure](https://help.autodesk.com/cloudhelp/2015/ENU/AutoCAD-DXF/files/GUID-D939EA11-0CEC-4636-91A8-756640A031D3.htm): an ASCII DXF is organized from code/value pairs, one item per line; sections begin with `0 / SECTION`, identify their name, and end with `0 / ENDSEC`.

These references support the unmatched-code finding. They do not define CLO's
parser recovery, nor do these general pages alone establish a receiver
certification profile. The actual CLO S498 result supplies the receiver
observation.

## Correction to S498 wording

S498 described the control as the Tee M fixture with only the final `EOF`
marker truncated away. That wording was incomplete. More precisely, S463's
single mutation replaces the complete terminal group/value pair `0 / EOF`
with an unmatched group code `0`; this both removes EOF and creates the
no-value condition named by the negative fixture and verifier. The original
S498 event and screenshots remain unchanged; its exit-packet wording is
corrected in this S502 change. This slice controls interpretation of S498's
earlier phrase “missing EOF.”

## Gate disposition and non-goals

- **Failed:** the tested CLO importer silently accepted/rendered this exact
  malformed negative control. Preserve it as a concrete negative-input gate
  failure.
- **Unchanged:** G04 V03 all-seven recipe coverage, 0.001 cm geometry
  tolerance, exchange-profile/rights/local-handling evidence, semantic
  layer/mark preservation, grading, independent receiver and round-trip gates.
- No fixture, source geometry, writer, receiver setting, tolerance, product
  acceptance criterion or historical slice was changed. No CLO retest was
  performed in S502.
- No physical fit, factory acceptance, exact AAMA/ASTM compatibility or
  production-readiness claim follows.

## Verification and closeout

Fixture byte identity/mutation check passed; S463's fixture verifier passed;
Autodesk primary documentation was inspected; `npm run control-center:test`
passed 42/42; board exit preflight, validated command replay, and
`git diff --check` passed. This is a documentation/evidence-only slice, so no
full repository coverage/build gate applies. No safe disjoint delegation was
identified for this focused correction.

Started 2026-10-08 15:06:03 UTC from S501 `5e75eb9` with board start
`3119→3121`. Timing estimate: implementation/evidence reconciliation 2m;
focused verification and durable closeout 2m; external-agent waits 0m;
maintainer-decision time 0m.

**Next:** resume the blocked practical V03 investigation when the running CLO
window is controllable. First retry S499's 2×2 AAMA/ASTM × optimization
import-options matrix using the already hash-pinned Polo input and fresh
outputs only in `C:\G04-CLO-DXF-Exchange\S501-polo-import-options`. Capture
what CLO actually does; if the window again cannot be targeted, record that
specific interruption and continue offline. Do not change the 0.001 cm gate or
any remaining V03 acceptance criteria.
