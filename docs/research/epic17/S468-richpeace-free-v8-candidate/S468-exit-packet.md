# EPIC-17 / G04 V03 Richpeace free V8 candidate review — Slice 468 exit

## Findings

Richpeace's official English download list publishes **Richpeace Garment CAD V8.0 Free Version-English Free** as a “full function evaluation copy” with DGS and GMS, and links a manual from that exact product row. The vendor's V8 manual documents opening AAMA/ASTM format files from a file chooser and an “Export ASTM file” command. This is stronger free-build evidence than the other candidates reviewed: the manual is linked directly to the free English V8 listing, and the free listing describes a full-function copy. It remains a vendor description, not proof that the installed build exposes every exchange mode or that any file round-trips correctly.

The exact V8 free product listing does not describe cloud processing. The separately named Super V8 edition advertises cloud conversion and cloud marker services; do not confuse or use those features for this candidate. Ordinary V8 file open/export appears to use local file paths in the manual, but the vendor has not published a clear privacy statement confirming the exchange operates only on-device. “Evaluation copy” is stated, but accessible license/usage terms were not found. No installer was downloaded or run, no account/terms were accepted, and no fixture or product file was sent.

## Disposition / next step

Recommend **Richpeace Garment CAD V8.0 Free Version-English Free** as the next owner-installed test candidate over GetonAgain Free, because its official product row links the V8 manual documenting the needed apparel DXF directions; GetonAgain Free's free-build page establishes import and generic DXF output but not AAMA/ASTM export, and requires phone registration. Richpeace is not yet a selected receiver/profile and V03 remains open. Owner may install only from the official vendor listing. First check About/version, the file-format menus, the evaluation terms, and whether standard import/export remains local without invoking cloud conversion. Only after those checks should a copy of S463's synthetic fixture pack be opened and round-tripped.

If the installed free build lacks AAMA/ASTM import or ASTM export, or its use requires cloud processing / terms incompatible with this test, reject it and keep all V03 gates. Do not infer compatibility from a file-menu label alone. Keep representative simple, complex, multi-size and negative fixtures, native-output inspection, measured geometry/units/mark/grade comparison and accurate receiver-specific wording unchanged.

## Scope and verification

No product source, generic DXF output, acceptance criterion, V01/V02 state, protected export identity, or physical/factory claim changed. V03 remains In Progress; V01/V02 Done.

- Started from clean S467 `e8c64a4b2c68b9dee2105ff014489bb5a9cf8c4a`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board start replay 2875→2879; exit replay 2879→2883; EPIC-17/V03 remain In Progress.
- `npm run control-center:test` and `git diff --check` are the documentation/board checks. No production code or output gate applies.
- Elapsed ~1m10s (04:48:15 UTC to 04:49:25 UTC): official source review ~34s, durable packet/board/state ~28s, focused checks ~8s; implementation 0s; agent waits 0s; maintainer-decision time 0s.

## Sources checked

- Richpeace [official CAD software list, page 3](https://www.richpeace.com/list-cad_software-3.html): exact English free V8 product entry, full-function evaluation copy, download and directly linked manual.
- Official vendor [English V8 free download page](https://downsoft.richpeace.com/s/rpoxq2): 64 MB package, dated 2021-10-13.
- Official Richpeace [V8 user manual](https://www.richpeace.com/uploadfile/202210/5085cf1486261f.pdf): documented AAMA/ASTM import and ASTM export. Product listing links this manual for the free English V8 edition.
- Richpeace [Super V8 product page](https://www.richpeace.com/garment_cad-show-751.html) and [launch notice](https://www.richpeace.com/richpeace_news-show-746.html): distinguish the separate Super V8/cloud features from V8 Free.