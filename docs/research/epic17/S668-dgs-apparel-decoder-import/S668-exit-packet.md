# EPIC-17 / G04 V03 — DGS apparel decoder on approved profile v2 — Slice 668 exit

## Result

S668 correctly tested the already-approved `idr-pattern-exchange/2` grainline mapping. The S664 base candidate was 155,176 bytes / SHA-256 `DFC15003F11AFEC33C4AADB3286D3354A808D834DCD1979B7CB2EE0BC94F07F2`. The new C:-only derivative is also 155,176 bytes / SHA-256 `E50E485B62FD127828271C67D95DCA6DBA10A48059BBCEC03BCE7065F0AC4D5D`. An independent byte and DXF AST check proves exactly nine bytes changed: one XDATA profile version digit in each of the nine same-identity piece INSERTs. `$INSUNITS=5` (cm), ordered piece identities, 11 blocks, CUT/SEW/marks, all other entities and geometry are unchanged. Each piece retains its single source-derived GRAINLINE LINE. S664's source-bound analyzer established 4,509/4,509 grainline samples inside the matching CUT contours.

The existing DGS V2024.1 / VID:20250610 local session performed one actual import using its `ASTM/AAMA` decoder, `Pattern` mode, `Import text` on, `Unit of file`, `2 Way` grainline, point type `Ignore`, `Only base size` off, `Recognize seam` on and `Nest pattern` on (the observed dialog indicated which controls were disabled/enabled). The dialog completed and DGS opened the selected source path as its document, without an error dialog; the actual canvas is blank and the status remains `0/0` patterns. That is a concrete import failure. The DGS apparel-decoder candidate is retired. No export, alternate setting/mode, or reimport was attempted.

## Gate disposition

- **Passed for this input only:** exact `/2` metadata update and source-preservation preflight; nine grainline lines remain source-bound and inside same-piece CUTs; centimeter units and all source bytes outside the nine profile-version digits are unchanged.
- **Failed:** the DGS ASTM/AAMA Pattern-mode import produced no visible or registered pattern (blank render, 0/0), despite completing without a warning dialog.
- **Unproven:** DGS's cause, output/roundtrip, semantic and mark handling, profile conformance, grades, malformed input, repeatability, all-seven/options/grades, and readable receiver output.
- **Unchanged:** every V03 acceptance condition and hold; V01/V02 Done; legacy DXF and protected byte identities.

Settings screenshot, actual blank result, final input manifest and machine comparison remain under `C:\G04-CLO-DXF-Exchange\S668-dgs-apparel-decoder-import\`. No product code changed, so changed-code coverage is not applicable. DGS and CLO stay open. No standards-conformance, physical-fit, factory-acceptance or production-readiness claim.

## Next action

S669 inspects the installed DGS distribution for vendor-supplied apparel DXF/RUL fixtures or a locally documented ASTM/AAMA input example, without opening or altering user data. This resolves one specific distinction: whether DGS requires a specific AAMA entity/layout contract absent from the source-derived `/2` fixture, or whether its decoder cannot consume this receiver candidate. Reuse any vendor sample only as structural reference and do not claim compatibility from it. If no usable local fixture exists, stop DGS and use the already-established local OpenCAD/CLO evidence to build an explicit candidate comparison and choose a practical route without further blind DGS variations. No approval is pending.

## Slice closeout

Record board replay, actual hashes and verification in the durable command records. Focused checks: S668 preflight rerun, parser syntax, Control Center 42/42 and `git diff --check`; no full-repository gate until the integrated candidate settles. Delegation: none, because one serial stateful receiver test and local sample inspection have no disjoint implementation ownership. Record implementation, focused verification, external waits and maintainer-decision time separately. S669 is the next unique slice.

Start time: 2026-10-10 10:03 UTC. Durable close time: 2026-10-10 10:00:03 UTC. Validated board replay: 3930→3936. The exact source comparison and manifest are in the named C: folder; the actual settings and blank result renders are saved there. Re-run of `prepare-and-verify-v2.mjs` passed; `node --check` passed; `npm run control-center:test` and `git diff --check` are required for the boundary. No product code changed. Implementation/preflight: 4 minutes; actual GUI import and evidence: 3 minutes; focused verification and durable closeout: record measured time at close; external waits 0; maintainer decisions 0. S669 is next.
