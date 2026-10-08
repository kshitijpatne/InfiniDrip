# G04 V03 gate matrix — S493

**Snapshot:** S492 `b402d571305e1d1256b091314271257447b5f1f4`, CLO
`2026.1.310 (r58944)`. This matrix consolidates existing evidence only. It
does not select CLO, clear rights, change thresholds, or replace receiver
tests.

| V03/C04 gate | Existing evidence | Classification | Remaining requirement |
|---|---|---|---|
| Permitted-use basis for exact receiver/build | S479/S487 reviewed current CLO Additional Terms §5.1.4 and trial eligibility; S490 observed the installed trial screen (`14 DAYS LEFT`, renewal text/date) but no account-specific grant. | **Unproven / Gate 0 held.** Terms limit trial purposes and exclude commercial/for-profit purposes. The account screen does not establish that this G04 product-development use is covered. This is not a legal conclusion or a past-breach finding. | Applicable written grant or other authoritative rights evidence for this exact use/build before new CLO acceptance testing or receiver selection. |
| Exact application/build/profile | S472 identifies owner-reported CLO 2026.1.310; S475–S478 visually observed `DXF-AAMA` import and `DXF-ASTM` export with centimeters, 100%, no rotation. Re-export declares AC1009 and no `$INSUNITS`. ASTM D6673-10 is historical/withdrawn; the menu label is not a conformance certificate. | **Observed, profile not selected.** The exact empirical settings are reproducible, but industrial standard conformance and licensed profile semantics are unproved. | After Gate 0, freeze an exact, permitted profile/build and state the empirical claim narrowly; do not label it current ASTM/AAMA conformance without evidence. |
| Local file handling | All prior trial input/output/native files are recorded beneath `C:\G04-CLO-DXF-Exchange`; prior packets record no CLO-SET/CONNECT upload. CLO terms document network connectivity/remote authentication and Content Analytics rights. | **Partially observed; local-only processing unproven.** Local path storage and no recorded manual upload do not prove the app never transmits file/content data. | Evidence that the chosen workflow meets G04's local-handling boundary, with no unapproved cloud transfer. |
| Clean import with no loss warning | S475/S476 imports showed CLO's seam-allowance notice; the generic source DXF does not carry seam-allowance metadata and imported in Custom mode. | **Not passed as written.** The observed warning conflicts with C04's clean-import/no-loss-warning criterion; semantic effect was not proven harmless. | A permitted profile/import that passes without an unresolved loss warning, or explicit receiver evidence that the warning is non-lossy for all required data. |
| Tee geometry round trip | S475: 6/6 source contours matched within 0.001 cm; maximum per-coordinate delta `0.0000160001 cm`. Three distinct pieces were visible. | **Passed for Tee M contour subset.** | Still need piece selectability/identity, mark/layer semantics, required options/grade package, and the admitted broader fixture matrix. |
| Polo geometry round trip | S476: 13/18 within 0.001 cm. S477 tied five mismatching CUT contours to their correct blocks using exact SEW matches; CLO output CUT contours had fewer vertices. Witnessed deviation lower bounds `0.01019–0.01118 cm`, above the 0.001 cm threshold. No app error dialog was reported. | **Failed for Polo M at the unchanged geometry threshold.** This is a measured acceptance failure, not a menu/runtime crash. | A rights-cleared candidate profile must preserve all required Polo geometry within threshold or G04 must retain the failure; no tolerance relaxation is authorized. |
| Woven geometry round trip | S476: 24/24 source contours within 0.001 cm (maximum `0.000074 cm`). S478 second generation: 24/24 source contours remain within threshold; 114/114 exported contours match between generations (maximum `0.000031 cm`). Twelve distinct pieces were visible. | **Passed for Woven M contour subset and observed second generation.** | Still need exact entity/layer semantics, grade/options, all required marks and the remaining receiver gates. |
| Piece identity and separate selection | Screenshots show 3 Tee, 9 Polo, and 12 Woven pieces visually laid out. DXFs contain named blocks/inserts in observed outputs. No controlled selection/reordering/identity-preservation acceptance was recorded for the full matrix. | **Partial.** Visual piece presence is established; identity preservation and independent selectability are not fully accepted. | Per-piece stable identity/count/bounds comparison and receiver inspection for every required fixture. |
| Cut/sew/mark semantics | CLO outputs include coincident repeated geometry across undocumented numeric layers (Tee, Polo, Woven); observed POINT/LINE/TEXT entities exist, but numeric layers are not mapped to source semantic types. | **Unproven.** Entity presence is not semantic fidelity. | A receiver-specific entity/layer mapping and exact per-entity comparison for CUT, SEW, fold, notches, internal marks, and construction detail. |
| Native grade / size relationship | Prior base tests used M fixtures. S463 includes three separately redrafted Tee size files; those fixtures do not encode native grading and have not completed the required CLO matrix. Selecting “Graded Nest” on export is not evidence of source grade-rule preservation. | **Unproven.** | Test size identity, mapping and grade-rule relationships using permitted fixtures; mark unsupported content explicitly rather than implying a graded nest. |
| Malformed/unsupported negative input | S463 has a truncated-group-value control. No accepted CLO rejection/reporting evidence exists. | **Untested.** | Import the negative control under the frozen permitted profile and verify visible rejection or explicit blocked status; silent repair must fail. |
| Receiver screenshot/independent evidence | Native CLO screenshots and parsed outputs exist for the tested M fixtures. No independent CAD receiver acceptance exists. Open Patterns rejected the current inputs and has no DXF writer (S480). | **Partial / independent acceptance absent.** | Required receiver inspection for every fixture plus independent evidence where the chosen profile relies on a parser or standard semantics. |
| Claims, legacy output, physical boundary | S475–S492 make no ASTM-wide, factory, physical-fit, or production-readiness claim; no generic writer or protected export baseline changed. | **Preserved.** | Keep protected bytes unchanged and restrict any future compatibility wording to witnessed build/profile/fixtures. No physical/factory claims. |

## Evidence sources

- `S472-clo-receiver-qualification/S472-exit-packet.md`
- `S475-clo-tee-roundtrip/S475-exit-packet.md`
- `S476-clo-representative-roundtrips/S476-exit-packet.md`
- `S477-polo-roundtrip-contour-diagnosis/S477-exit-packet.md`
- `S478-woven-generation-two-reimport/S478-exit-packet.md`
- `S479-clo-rights-profile-review/S479-exit-packet.md`
- `S487-clo-trial-purpose-boundary/S487-exit-packet.md`
- `S490-clo-account-grant-check/S490-exit-packet.md`
- `S480-open-patterns-parser-assessment/S480-exit-packet.md`
- `S463-v03-receiver-fixture-pack/fixture-plan.md`
- `docs/research/epic14/C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`,
  “CAD decision and round-trip acceptance boundary”.

## Decision

CLO is **not wholly technically unusable**: bounded Tee and Woven contour
checks passed and imports/exports completed without app error dialogs. It is
also **not qualified or selected for V03**: Gate 0 is not affirmatively clear,
the import emitted an unresolved warning, Polo fails the fixed geometry
threshold, and key semantic/grade/negative gates remain unproven. Preserve
V03 as In Progress and keep every criterion unchanged.
