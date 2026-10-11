# EPIC-17 / G04 V03 — DGS apparel decoder with approved profile v2 — Slice 668 start

## Verified starting state and boundary

- Started 2026-10-10 10:03 UTC from clean S667 commit `eb1bc135`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S667 is the highest assigned number; S668 is unique. Control Center is revision 3924; EPIC-17 and G04-V03 are In Progress, V01/V02 Done.
- No product-code change is in scope. The exact approved grainline convention `idr-pattern-exchange/2` is already approved and recorded. No maintainer approval is pending.
- Input base is the S664 source-derived Polo M candidate (155,176 bytes; SHA-256 `DFC15003F11AFEC33C4AADB3286D3354A808D834DCD1979B7CB2EE0BC94F07F2`), whose grainlines are source-proven but its XDATA currently incorrectly says `/1`.

## One bounded route

Create a C:-only derivative by changing exactly the nine XDATA occurrences `profile=idr-pattern-exchange/1` to `/2`; no entity/layer/coordinate/units/identity changes. Independently prove that only those nine profile values changed, all 9 piece IDs and nine grainline entities remain, every grainline sample stays inside its same-identity CUT, `$INSUNITS=5`, and every other source entity is unchanged. Record both hashes and a machine-readable comparison before the receiver action.

In the existing DGS V2024.1 / VID:20250610 session, import this file once through the actual ASTM/AAMA apparel decoder (not AutoCAD Design/Pattern). Capture settings, warning state and full output; compare registered pieces, identity, units, CUT/SEW/marks/grainlines and geometry against the independently verified source at the unchanged 0.001 cm tolerance. No choice of menu label proves normative ASTM/AAMA conformance.

If import is fully clean and measurable, continue this same slice with one apparel-format export, independent parse, and one reimport of that exact output, checking unchanged units/geometry/identity/relations/layers/marks and readable render. Do not run a second format or entity encoding. Stop DGS on the first concrete warning or gate failure and retain the other candidates/holds; no round trip after an import failure.

## Unchanged acceptance and exit

V03 acceptance remains unchanged: rights and local processing; explicit empirical profile/receiver evidence; units; 0.001 cm geometry; piece/grade identity and relations; CUT/SEW/marks/grainlines; all seven recipes and supported options/grades; malformed-input rejection; repeatability; readable rendered output; protected export byte identities; and final full repository coverage/build/render/output gate, final review, PR, safe merge, origin/main ancestry, and required automatic deployment. V01/V02 and all current holds remain unchanged. No physical-fit, factory-acceptance, standards-conformance or production-readiness claim.

Only the serial DGS UI and source preflight are in scope; no disjoint low-risk delegated work exists. Keep both DGS and CLO open. All imported/exported/test fixture files and screenshots stay under `C:\G04-CLO-DXF-Exchange\S668-dgs-apparel-decoder-import\`. At close, record implementation, focused verification, external wait and maintainer-decision time separately. The next action is source-only fixture generation and exact-diff preflight; then perform one apparel decoder import.
