# EPIC-17 / G04 V03 — Pro2CAD public qualification screen — Slice 548 exit

## Result

**No-go for Pro2CAD executable use within the current G04 path.** The publisher's public materials establish a plausible apparel CAD lead with AAMA/ASTM import/export, but they do not qualify the currently offered build for this trial. No download, install, account/license request, contact, purchase, pattern transfer, or CLO UI action occurred. No G04 files were copied outside their existing C:-only evidence folders.

## Publisher evidence and limits

- The [Pro2CAD publisher page](https://www.pro2dev.it/pro2cad/index.html) advertises AAMA/ASTM DXF importers and exporters and links a Pro2CAD demo, installation guide, license-request document, and user manual. Marketing claims establish feature intent, not compatibility.
- The official [manual](https://www.pro2dev.it/pro2cad/doc/Guida%20Pro2CAD.pdf), *Guida di Pro2CAD*, identifies itself as v2.1.101. Its DXF import section (p.93, found via publisher-hosted manual text) says it imports under ANSI AAMA-292 or ASTM D6673 and supports separate-piece DXFs with RUL, single-model DXF with RUL, and graded-size DXF. This establishes documented import direction and some grade packaging; it does not state the normative edition of AAMA-292/ASTM D6673 or prove acceptance of our actual outputs.
- The same manual's AAMA preparation section (p.161) warns that some advanced Pro2CAD functions are not carried by AAMA DXF and says the model must be prepared to guarantee conformity between original and exported model. This is a reason to inspect the exact output, not proof of round-trip preservation.
- The publisher's English demo link names `Pro2CAD_Demo_Ver2.2.101_Eng.zip`, while the public manual is v2.1.101. The official [installation guide](https://www.pro2dev.it/pro2cad/install.html) describes continuing in DEMO and restoring sample models, but does not establish no-cost product-development rights, Windows 11 support, or local-only processing. The official [license request guide](https://www.pro2dev.it/pro2cad/doc/Richiesta%20Licenza.pdf) describes registration and a vendor-activated license file; it does not define the demo's permitted use or processing locality.
- The publisher's published system requirements list Windows through Windows 10, not Windows 11. Compatibility with the current Windows 11 device is unverified. No installation was attempted.

## Decision and V03 effect

The maintainer's written confirmation in this thread settles the CLO trial-use and local-DXF-processing questions for the already authorized CLO evaluation; this is recorded as owner-provided authorization, not an independent legal opinion. It does not transfer rights to Pro2CAD or prove Pro2CAD locality. Pro2CAD's public materials therefore do not justify downloading or running it for product-development patterns.

No V03 acceptance, recipe coverage, profile, geometry threshold, protected identity, or claim changed. S547 remains the current seven-recipe gate matrix: 77/82 contours pass per generation and five Polo CUT contours fail; layer 8 conflates CUT/SEW; full mark/grade-option semantics and malformed-input rejection remain unresolved. Same-app CLO round trips are evidence for tested behavior but do not independently qualify an industrial profile. V03 remains In Progress; V01/V02 remain Done.

## Next action

Do not pursue Pro2CAD installation without build-specific evidence for no-cost product-development use, Windows 11 operation, and the applicable data-handling terms. Continue against the unchanged V03 gates using the already authorized CLO session and its existing C:-only fixtures/evidence. Make the next practical step a single targeted, controlled investigation of the repeat Polo contour loss and semantic layer ambiguity using already retained files and outputs; do not repeat the same settings matrix or claim a pass unless geometry, semantics, grades/marks, negative-input behavior, and round-trip criteria all pass. If no tested CLO profile can meet them, report the concrete failure and the exact remaining receiver/profile dependency; do not silently weaken acceptance.

## Verification, board, and time

- Official-source screen only; no executable or product-data action.
- Start was `2026-10-08 22:51:07 UTC` from `7416e5b`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S548 is the unique next slice after S547.
- Board start revision 3303; exit replay records evidence/comment and advances to 3307. G04-V03 remains In Progress.
- `npm run control-center:test`: 42/42 passed. `git diff --check` passed. No production code changed; full repository gate is not due.
- Time: publisher-source review 3m; packet/state/board and focused verification 2m; external-agent waits 0m; maintainer-decision time 0m. (Closeout timings are rounded.)
- At this safe slice boundary, inspect the goal record; the admitted objective remains active through safe merge.\n