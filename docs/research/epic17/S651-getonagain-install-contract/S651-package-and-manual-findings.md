# GetonAgain package and manual findings — S651

## Official package custody

The official Free Version page's Download link resolves to
`https://d.getonagain.com/en/CAD/package/GetonAgain_Garment_Free_version_250225.zip`.
Saved only as
`C:\G04-GetonAgain-CAD-Exchange\S651\GetonAgain_Garment_Free_version_250225.zip`.
Size: 255,970,412 bytes. SHA-256:
`859B42DB54D51A948A6524D83FEB7D7F89CE694425FAEFEE4BAD4582EFCCE7E6`.
The outer ZIP is readable and contains:

- `Garment CAD(GetonAgain Free version).exe` (104,300,563 bytes), Authenticode
  status **NotSigned**.
- `MPVCI_2.7_setup.exe` (90,343,232 bytes), Authenticode status **NotSigned**;
  version/company metadata says 2.7 / BobSpwg. The official package's install
  note instructs running both EXEs, then applying
  `Free_Version_DGS_20250610.zip`.
- `How to install the software.txt` and an upgrade video.

The ZIP package and contents are extracted only under
`C:\G04-GetonAgain-CAD-Exchange\S651\package\`. No executable was run.
The host's uninstall registry lists Microsoft Visual C++ 2015–2022 x64 and
x86 runtimes version 14.44.35211.0. No MPVCI action is justified by a measured
missing-runtime error; hold the third-party unsigned bundle unless the CAD
installer proves it is required and the maintainer approves it.

## Version-matched official manual

The official product page's Instruction Manual link resolves to
`https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf`.
Saved at `C:\G04-GetonAgain-CAD-Exchange\S651\Garment_CAD_V2024.1_Manual.pdf`,
14,227,101 bytes; SHA-256:
`1AC8D9B390C21E205B94F14C4D08566CDA853974A460995CE5EBDEA752D1514C`.
`pdfinfo` reports 487 pages. Pages printed 239–241 were rendered and visually
reviewed at PDF pages 242–244; text extraction is supplementary. Rendered
images and extracted text remain in the same C: folder.

### Exact import contract documented by the manual (printed page 239)

- File → Import DXF exposes separate `ASTM/AAMA`, `TIIP` (Japanese DXF), and
  `AUTOCAD` routes.
- The ASTM/AAMA UI offers `Unit of file` or a `Scale by mm` factor, import
  text, base size only/all sizes, recognize seam, nest pattern, and grain-line
  selection.
- The manual says that without an RUL file the importer may nest non-base
  sizes to the base size; if not nested, sizes remain as read and adjusting
  the base does not adjust the other sizes.

### Exact export contract documented by the manual (printed pages 240–241)

- File → Export DXF offers `ASTM`, `AAMA`, or `Auto CAD`, and selected pattern,
  work-area patterns, or all style patterns.
- File type offers only base size, include a separate `.RUL`, or no RUL; other
  toggles include unfold symmetry, ignore null material, insert control point
  at notch, level grain line, and convert seam line to assistant curve.
- The manual states that if the number of drill/buttonhole marks differs by
  grade, RUL export uses the base-size count. It also states RUL mode does not
  output quilt/sew lines, while no-RUL DXF mode is for quilt/sew-line output.
- The AutoCAD route has separate/overlap and design-line/pattern switches and
  an option to turn inner notches into outward contour notches.

### Does the RUL mark-count caveat affect existing source fixtures?

Read-only parsing of S559's 35 hash-pinned per-size DXFs (seven default
recipes × XS/S/M/L/XL) found grade-invariant explicit DXF construction-mark
counts: Polo has 3 buttons and 3 buttonholes per size; Trouser has 1 and 1;
Woven has 8 and 8; Tee, Fitted, Tank, and Skirt have zero of each; all seven
have zero `MARK_DRILL` entities. This means the manual's specific RUL caveat
is not triggered by differing drill/buttonhole counts in that existing
default-grade cohort. It says nothing about all supported option variants,
receiver retention, identity, or RUL semantics; keep those V03 gates open.
Reproducible analyzer: `analyze-s559-mark-counts.mjs`; it reads the existing
C:-only S559 fixtures, asserts 35 inputs and stable counts per recipe, and
writes `C:\G04-GetonAgain-CAD-Exchange\S651\s559-mark-counts.json`.

These are versioned vendor instructions and useful empirical profile inputs;
they do not define DXF entities, normative editions, a conformance test, piece
identity/revision, complete mark mapping, sidecar binding, or loss-warning
semantics. Therefore do not claim ANSI/AAMA or ASTM conformance from these
menu labels.

## Eligibility and remaining gate

The [official Free Version page](https://www.raiseagaintech.com/CAD_Software/garment_CAD/509.html)
says a mobile phone number is used to register and log in to the software.
No account, phone number, or credentials were supplied. Do not automate
authentication or create an account. If running the application reaches this
authentication requirement, stop at the sign-in screen for the maintainer to
complete personally or supply an approved access route. No pattern file has
been opened.

The manual narrows the input-choice and grade/RUL behavior questions but does
not establish the custom R14/XDATA fixture from S648 as a matched input. The
exact installed build and any local/offline behavior still require an actual
application session. The external login/account requirement is now the
concrete execution dependency after installation authorization.
