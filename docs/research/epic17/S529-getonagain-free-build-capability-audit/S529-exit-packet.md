# EPIC-17 / G04 V03 — GetonAgain free-build capability audit — Slice 529 exit

## Findings

The official GetonAgain **Garment CAD V2024.1** manual is concrete evidence
that this specific product version imports and exports apparel DXF-AAMA/ASTM:

- Manual pp. 242–243: the import dialog explicitly identifies ASTM/AAMA and
  supports units, text, base size vs. graded sizes, seam recognition, and
  grading/nesting behavior.
- Manual pp. 243–244: File → Export DXF offers ASTM/AAMA and AutoCAD formats,
  selected/work-area/style patterns, base-size/RUL choices, notch control
  points, grain-line orientation, and sew-line output options.
- Official product materials identify V2024.1 as apparel patternmaking and
  grading software and claim DXF/PLT input/output.

The official free-build page identifies a downloadable package named
`FUZHUANGCAD_MIANFEI_20260306.zip`; it requires phone registration and login
and advertises cloud nesting. The official page does not identify that package
as V2024.1, enumerate its DXF-AAMA/ASTM features, or provide an applicable
end-user license/data-handling statement. The product-level V2024.1 manual
cannot be treated as proof that the free package contains the same features.
The manual's local file dialogs show local path selection, but do not establish
that the free phone-registered build never transmits pattern contents.

This makes GetonAgain a **credible desktop technical lead**, but not a
qualified receiver. Product-level technical capability is now established;
free-build identity, product-development rights, local-only handling, actual
build behavior, fidelity, and all seven-recipe round trips remain unverified.

## Evidence and limits

| Question | Evidence | Finding |
|---|---|---|
| Does a current apparel product version support AAMA/ASTM DXF input and output? | Official V2024.1 manual pp. 242–244, direct manufacturer-hosted PDF; official V2024.1 product brochure. | **Yes, for Garment CAD V2024.1.** Manual explicitly documents both directions and format options. This is documentation evidence, not a practical round trip. |
| Is the free package that same build? | Official free page exposes `FUZHUANGCAD_MIANFEI_20260306.zip`, phone registration/login; no version/feature manifest. | **Unknown.** Filename date is not a version identity. |
| Is product-development use permitted? | No applicable free-build EULA/license text found on public official pages reviewed. | **Unknown.** “Free” does not itself establish use rights. |
| Can G04 patterns stay local through import and export? | Manual has local browse paths; free build requires phone login and advertises cloud nesting; no file-flow commitment found. | **Unknown.** Do not put a G04 pattern in the app. |
| Does it pass V03? | No build execution or G04 fixture test was performed. | **No.** All profile, rights, local-handling, geometry/identity/semantics/grade, negative-input, and round-trip gates remain. |

Official references:

- [GetonAgain Garment CAD V2024.1 manual](https://d.getonagain.com/en/CAD/manual/Garment_CAD_V2024.1_Manual.pdf) — manufacturer-hosted; local verification copy SHA-256 `1ac8d9b390c21e205b94f14c4d08566cda853974a460995ce5ebdea752d1514c`, saved only at `C:\G04-CLO-DXF-Exchange\S529-getonagain-free-build-capability-audit\`.
- [GetonAgain official V2024.1 product brochure](https://d.getonagain.com/en/CAD/catalogue/20250801_GetonAgain_Garment_CAD_V2024.1.pdf) — generic DXF/PLT input/output claim.
- [GetonAgain free Garment CAD download page](https://www.raiseagaintech.cn/cad_software/Clothing_CAD/448.html) — phone registration/login, free-build feature list, cloud nesting, and package link `FUZHUANGCAD_MIANFEI_20260306.zip`.
- [GetonAgain V2024.1 product page](https://www.raiseagaintech.cn/cad_software/Clothing_CAD/335.html) — separate product page with local/standalone, network, and database product variants.

## Disposition and next action

No app was installed or opened; no account, phone number, external inquiry,
pattern file, or CLO action was used. The manual copy remains on C: in the
named S529 folder; no input/output CAD files were created. No acceptance gate
changed.

The next safe step is one static inspection of the official free package,
downloaded only to a named C: folder, to identify its build/version, bundled
terms, and local dependencies before any execution. Do not install or register
it if the package still cannot establish use rights and a viable local-only
path. A vendor inquiry would require a separate explicit authorization.

## Verification and closeout

S529 started `2026-10-08 20:21:21 UTC` from S528 `5dc6af0` on
`codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Board
start/exit replay is `3227→3228→3229→3230→3231`. Replay preflight and
canonical board validation pass at revision 3231. `npm run control-center:test`
passes 42/42; `git diff --check` passes.
No production code changed; full build/coverage does not apply.

Elapsed time: `20:21:21–20:25:32 UTC` (4m11s) — official artifact review
2m20s, build/rights/data-flow reconciliation 0m45s, durable closeout 1m06s,
external-agent waits 0m, maintainer-decision time 0m.

**Next:** a C:-only static package inspection may establish free-build identity
and bundled terms. Do not execute, register, or transfer G04 patterns until
rights and local handling are confirmed. CLO remains open and untouched.
