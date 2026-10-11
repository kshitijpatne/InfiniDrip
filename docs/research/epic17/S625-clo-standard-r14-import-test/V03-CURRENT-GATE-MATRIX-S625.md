# EPIC-17 / G04 V03 — Current gate matrix at S625 exit

| V03 acceptance area | S624/S625 evidence | Status |
|---|---|---|
| Product-development rights and local handling | Maintainer confirmed in writing that CLO may be used for product-development evaluation and DXF files are processed locally. S625 used only named C: input/project/evidence paths. | **Settled for this CLO evaluation**; not an apparel profile or broad license/conformance statement |
| Candidate identity | CLO 2026.1.310 (`r58944`), Standard-DXF import, one S624-generated Polo M AC1014 fixture. | Identified bounded test only |
| Units | CLO import explicitly set to centimeters at 100%; S624 product generic DXFs carry no `$INSUNITS`. | One fixture observation; product-wide units contract remains open |
| Import acceptance / native geometry | S625 returned nine native patterns, no API error. Source comparison: 4/9 CUT and 4/9 SEW pass `0.001 cm`; max bounds 2.340120925973829 mm CUT and 0.45497215429687204 mm SEW. | **Fail / blocking** for this fixture's CLO Standard-DXF pre-export gate |
| Container-version hypothesis | Versus S622's R12 fixture, AC1014 keeps the same 4/9 CUT and 4/9 SEW pass counts; two prior ~93.1135 mm CUT misses become ~2.33 mm, but five CUT and five SEW contours still fail. Rendered curves remain visibly damaged. | Hypothesis closed; not a universal finding about CLO or DXF |
| CLO export / round trip | Export is explicitly gated on all 18 native contours and a readable render. S625 failed before export; the C: `Output` folder contains no DXF. | **Not tested; open / blocking** |
| General-CAD R14 comparison | S624 Open CAD Studio v2026.40.1 preserves all 90 CUT/SEW contours across seven size-M recipes plus Tee XS/XL, repeated R14 outputs byte-identically, rejects its tested malformed input, and produces reviewed plots. Product files lack `$INSUNITS` and contain only CUT/SEW polylines. | Positive bounded general-CAD result only; not apparel qualification |
| Industrial apparel profile and receiver qualification | Neither the S624 general-CAD profile nor the failed CLO Standard-DXF fixture establishes a normative, applicable apparel exchange profile. | **Open / blocking** |
| Stable piece/revision and manufacturing-role identity | Geometric fixture association is possible, but neither tested generic DXF nor receiver query proves persistent garment piece/revision or manufacturing semantics. | **Open / blocking** |
| Marks, POMs, notches, artwork and labels | The S625 dialog’s annotation option was off; the lower notch import was set to Both/Ratio, while the dependent Include Notches control was disabled. No semantic retention matrix was qualified. | **Open / blocking** |
| Seven recipes, supported options and grading | S624 covers seven default-M recipes plus Tee XS/XL for geometry. S625 covers one Polo M fixture. No full supported-option/grading matrix or apparel marks exchange was qualified. | **Open / blocking** |
| Malformed inputs | S624 general-CAD receiver rejected one truncated input without output. S625 did not submit malformed data to CLO. | One receiver-specific control only; CLO malformed-input policy open |
| Rendered output | S624 reviewed nine general-CAD plots without gross geometry defects. S625 CLO PDF shows nine pieces but visible spike/stray projections on multiple curves. | S624 partial pass; S625 CLO render fails its bounded no-gross-damage gate |
| Protected identities / legacy behavior | No product source, DXF writer, baseline, protected output, or acceptance threshold changed. | Preserved; full integrated regression still required |
| V02 / all-seven acceptance | V02 remains Done under its existing evidence. | Unchanged; no acceptance reduction |

S625 closes the single R14-container hypothesis in CLO Standard-DXF without export. It does not clear any full V03 acceptance gate. Keep all V03 and all-seven requirements unchanged. Details and hashes: `S625-exit-packet.md`; application artifacts under `C:\G04-CLO-DXF-Exchange\S625-clo-standard-r14-import-test\`. Prior bounded positive general-CAD evidence remains in `../S624-opencadstudio-desktop-r14-receiver/`.
