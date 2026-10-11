# EPIC-17 / G04 V03 — Polo periodic degree-1 SPLINE round trip — Slice 595 exit

## Verified boundary and authority

- Started `2026-10-09 08:24:23 UTC` on `codex/epic-17-g04` from S594
  `9e9903241150c606dbf1942f7b44d1e616729592`. Refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
  S594 was the highest landed slice; S595 was reserved uniquely.
- Board start replay `3506→3508`; validated exit replay `3508→3512`; summary
  wording correction replay `3512→3514`. EPIC-17 and G04-V03 remain In
  Progress; G04-V02 remains Done.
- The maintainer's written confirmation authorizes CLO product-development use
  and confirms local-only DXF processing. S595 used the existing CLO
  2026.1.310 session. All S595 files are under
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\`.

## Exact-source periodic candidate

The hash-pinned source is the S536 Polo M R12 DXF, SHA-256
`796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`.
S595 replaced only its five named CUT POLYLINE contours (back, outer stand,
inner stand, upper collar, under collar) with degree-one periodic SPLINEs:
group 70=`27`, unique cyclic controls, distinct integer knots `0…n`, and
`n+1` knots. The other 13 POLYLINE records were retained. The candidate is
29,412 bytes, SHA-256
`e050b9dd3e49677494878be9460e0e740bebe3ce1f97a731a328786e706caebc`.

An independent cyclic degree-one basis evaluator checked 1,603 parameters,
including all span endpoints, against every original source edge. All five
curves close over one period, represent every source segment once, and have
maximum source residual `0 cm`. The source preflight JSON SHA-256 is
`8e605cf2e6662bc9cfe2a52eff5898ac8d9e004bcc5cdce7127c696bd97daafa`.
This proves the candidate input geometry; it does not assert receiver behavior.

## CLO trial and measured result

The clean-scene CLO import used the recorded S591/S592 DXF-AAMA settings:
Open, centimeter, 100%, no rotation, original grain; the same annotation,
curve-point, notch, and cut/sew options; no geometry or optimization option
was varied. CLO displayed its informational notice that DXF seam allowances
were imported in Custom mode to preserve shape. Export used DXF-AAMA, Graded
Nest, centimeter/100%, no rotation, Duplicate Notch on Seam Allowance on, and
the same grading/baseline/seam allowance and curve-optimization toggles as
the pinned prior trial. CLO returned to the scene without a format error.

The exported AC1009 DXF is 219,416 bytes, SHA-256
`e31f45437ecadb4ed40e7b2bfb99468509ceebf17027c87f4e9f8150906c22f2`.
The fixed analyzer binds nine receiver blocks via unchanged SEW contours and
measures CUT/SEW contours with a conservative sampled-distance bound at
0.0005 cm spacing. The gate remains `0.001 cm`.

| Polo M piece | CUT upper bound (cm) | CUT | SEW coordinate delta (cm) | SEW |
|---|---:|---|---:|---|
| Front | 0.000257465 | Pass | 0.000013038 | Pass |
| Back | 4.063040000 | Fail | 0.000013601 | Pass |
| Sleeve | 0.000261180 | Pass | 0.000013454 | Pass |
| Button placket | 0.000256708 | Pass | 0.000006708 | Pass |
| Buttonhole placket | 0.000271213 | Pass | 0.000021213 | Pass |
| Outer collar stand | 9.311107947 | Fail | 0.000022561 | Pass |
| Inner collar stand | 9.311054798 | Fail | 0.000023345 | Pass |
| Upper pointed collar | 0.159214023 | Fail | 0.000035128 | Pass |
| Under pointed collar | 0.159193055 | Fail | 0.000022204 | Pass |

Overall: **4/9 CUT pass, 5/9 CUT fail, and 9/9 SEW pass** for this one Polo M
generation. The back and two stand failures remain about 4.063 cm and 9.311
cm; both pointed-collar failures remain about 0.1592 cm. This periodic
encoding does not resolve the observed round-trip geometry defect and is
rejected for this receiver/profile test. S592 remains the best previously
measured bounds for the stands; this result is not a regression claim about
the product writer. No cause inside CLO is inferred.

## Render evidence and limits

CLO's one-page 1:1, 127-dpi 2D snapshot includes all nine pattern pieces.
PDF SHA-256 `929498fcd9affe8617ff2271f1e32305430d8c41ec994b649ffb32746cc87542`;
PNG inspection SHA-256
`f07f7388b6da98fe115f4a0c6dc938d9c556c5fbbe2c923a853a362e29c75154`.
This is gross piece-presence evidence only; its thin/light strokes are not a
fine-mark readability check and it does not override the numeric contour
failures. The saved CLO project SHA-256 is
`f402095a5907b0719cce2c76bee4e42e3607016c369ba38c30a9bef03ca834d4`.

The tested representation is not accepted. S595 clears no V03 gate and
does not establish all-seven coverage, a qualified industrial apparel CAD
profile, exact format compatibility, full identity/semantics/marks/grades,
negative-input handling, or repeated-generation stability. The fixed
`0.001 cm` gate, all-seven acceptance, rights/profile/round-trip requirements,
V02-before-V03, legacy DXF behavior, and protected export identities are
unchanged. No physical fit, factory acceptance, or production-readiness claim
is made.

## Evidence locations

- Source and candidate proof:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Evidence\Analysis\S595-periodic-source-preflight.json`
- Round-trip analysis:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Evidence\Analysis\S595-roundtrip-analysis.json`
- Receiver DXF:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Output\polo-m-periodic-degree1-spline-clo-aama.dxf`
- Rendered one-page PDF and inspected PNG:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Evidence\Rendered\S595-periodic-spline-clo-2d.pdf` and `.png`
- Saved CLO project:
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Evidence\CLO\S595-periodic-spline-import.zprj`
- Current V03 matrix: `V03-CURRENT-GATE-MATRIX-S595.md`.

## Focused verification and time accounting

- Candidate generator and analyzer pass `node --check`; candidate/preflight,
  receiver DXF, analysis JSON, snapshot PDF/PNG and CLO project hashes were
  independently rechecked at closeout.
- The initial post-exit Control Center run found one existing regression
  assertion requiring the exact phrase `Preserve V02-before-V03, legacy DXF
  behavior and protected export identities` in the Epic summary. The source
  evidence was unaffected. The summary was corrected through the validated
  command layer, with clone preflight and replay passing at `3512→3514`;
  statuses and exit evidence remain intact. The final Control Center suite
  passes `42/42`; `git diff --check` passes.
- No production source or tests changed; changed-production-code coverage is
  not applicable. Full repository coverage/build remains due at the settled
  integrated Epic/PR candidate. Control Center tests, board preflight/replay,
  and `git diff --check` are the S595 focused closeout gates.
- Start `08:24:23 UTC`; verified closeout `08:45:59 UTC`. Approximate elapsed
  allocation: source candidate and independent proof `4m25s`; CLO import/export
  `6m01s`; output analysis `1m55s`; snapshot, render and visual review `2m02s`;
  documentation, focused tests, board and closeout `7m13s`, including the
  diagnosed stale summary assertion and validated correction. External-agent
  wait `0m`; maintainer-decision time `0m`.

## Single next action

S596: use existing pinned evidence to identify one source- and receiver-
measurable representation or exchange-stage question before any further CLO
trial. Do not repeat periodic/closed-bit variants, change geometry/settings,
or infer a cause from CLO output. Keep all V03 gates and the five failed Polo
CUTs open until a concrete candidate passes the fixed gate and the remaining
all-seven/profile/identity/semantics/marks/grades/negative/repeated-round-trip
evidence is complete.
