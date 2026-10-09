# EPIC-17 / G04 V03 — CLO tested-profile disposition — Slice 585 exit

## Finding

S585 reconciled and hash-checked the existing CLO Polo artifacts; it performed
no CLO import, export, API call, profile change, or project operation. CLO's
documented profile identity `CLO 2026.1.310 / DXF-AAMA` remains a supported,
narrow identity, and the maintainer's written product-development and
local-processing confirmation remains settled. Neither fact establishes
round-trip compatibility.

**Disposition: close CLO 2026.1.310 as the receiver candidate for the tested
G04 configurations.** Each of CLO's three visible output choices has a
measured Polo failure on at least one recorded path, and no tested setting
passes the unchanged source CUT geometry gate. This is a bounded rejection of
the tested build/profile/settings and fixtures. It is not a claim that all CLO
versions, every CLO setting, every DXF, or the DXF format generally is
incompatible. The S584 getter comparison has no documented CUT/SEW or
pipeline-stage semantics, so it does not assign the loss to CLO's importer or
exporter.

## Tested path reconciliation

| CLO path / evidence | Observed Polo result | Gate conclusion |
|---|---|---|
| Plain `DXF` (Standard profile), S508, centimeter settings and a corrected 100% reimport | The second-generation CLO workspace visibly collapses the outlines into a narrow overlapping stack. The actual rendered capture was inspected in this slice. The saved second output is 66,971 bytes, SHA-256 `ED1E13DDB359F4AB0E1FFFF1CA638AD8500A26A5A62FFBABDFAF230E8798CA04`. | Fails usable round trip for this fixture/path. Do not use the excluded 1000% exploratory reimport as a passing result. |
| `DXF-AAMA` import → `DXF-ASTM` export, S498; four AAMA/ASTM import × curve-optimizer combinations in S503 | S498 reproduces the same five CUT failures in both generations. Across all four S503 cells, the back, both collar stands, and upper/under collars each lose one CUT vertex; exact-segment lower bounds are `0.0101935–0.0111803 cm`, more than 10× the unchanged `0.001 cm` limit. Changing optimizer affects four button-mark loops, not the five CUT failures. AAMA/ASTM outputs differ in bytes but have identical ordered geometry at the tested settings. | Fails the Polo CUT geometry gate across the tested input/optimizer variations. This does not establish the internal import-versus-export stage. |
| `DXF-AAMA` import → `DXF-AAMA` export/reimport, S516 | Nine pieces render and the DXF exchange completes without a format error, but the same five CUT contours lose one vertex. Their measured deviations are `0.0101935`, `0.0103809`, `0.0111803`, `0.0103937`, and `0.0104024 cm`. | Fails the same fixed geometry gate despite a successful UI operation and gross piece render. |
| `DXF-AAMA` import/export with endpoint-identical connected-LINE CUT input, S574 | Nine pieces render, but all nine source CUT contours miss the gate; output residuals span `1.414220–9.310858 cm`. The corresponding source SEW paths associate pieces but do not prove layer semantics. | Fails; this tested source-entity representation does not provide a repair. Do not repeat it. |
| Read-only `GetPatternInputInformation` from the saved pre-export project, S584 | All nine calls/JSON parses succeeded. Eight paths have source-SEW candidates, zero have literal source-CUT candidates, and one path is unmatched. The API gives no documented manufacturing-role or stage contract. | Context only; neither proves input-stage CUT loss nor clears/assigns a compatibility gate. |

The product-specific failure is real at the measured output boundary: the
S498/S503/S516 paths omit one localized CUT corner on five contours beyond the
0.001 cm gate; S574's connected-LINE trial misses all nine CUTs. S508 has a
separate visible round-trip collapse. The records do not prove which
internal CLO stage caused the AAMA contour changes. These distinctions remain
explicit; no layer meaning is inferred from numeric labels.

## V03 status and remaining work

The supported profile-identity and rights/local-processing subgates do not
select a passing receiver. V03 remains In Progress. The remaining admitted
criteria include source-scale CUT/SEW geometry; piece/revision/size identity;
layer and construction-mark semantics; native grade and supported options;
malformed-input rejection/reporting; fine rendered detail; repeated exchange
and reimport; and representative coverage across all seven recipes. The
S573 gate matrix remains the current full checklist. Existing seven M/default
outputs and partial Tee/Woven contour successes do not cure the Polo failure
or clear those other gates. No second receiver or normative-edition search is
an independent admission requirement, but a measured passing receiver/profile
round trip remains required for V03 acceptance.

Keep G04-V03 and EPIC-17 In Progress; G04-V01/V02 remain Done. Preserve the
all-seven V02 criterion, legacy DXF behavior, protected export byte identities,
all geometry/semantic/grade/negative-input/round-trip thresholds, and the
physical/factory/production-readiness boundary. CLO stays open per the user's
instruction to keep the running session available until admitted G04 work is
complete; no further CLO trials should be run absent a newly identified,
measurable mechanism tied to a remaining gate.

## Next action

S586: inspect the product's current DXF writer and the seven hash-pinned
M/default output records against the S573 gate matrix. Make a source-to-output
map for the specific Polo CUT/SEW contours, marks, piece identity and units;
identify whether the product output has a concrete representation/semantic
defect that could explain the measured failures or be repaired in a separate
professional profile while leaving the legacy writer and protected bytes
untouched. This is a source/evidence audit first: no production edit, baseline
change, threshold adjustment, or CLO rerun until the audit yields a specific
testable mechanism. If it finds none, the next action is to use the prior
receiver-availability findings to choose a concrete independently testable
candidate, without repeating broad searches or relaxing V03.

## Evidence integrity, verification, and boundary

`verify-existing-evidence.mjs` confirmed 14 C:-only artifact hashes spanning
the pinned Polo M source, S498 first/second output, four S503 setting outputs,
S508 Standard exports, S516 AAMA output, S574 connected-LINE input/gen1 and
pre-export project, and S584 getter JSON. It also checked all nine S584 getter
records and their call/parse status. The actual S508 second-generation render
was opened and visually reviewed; S516's nine-piece output render and the
packet's measured vertex deltas were reviewed. No output or input file was
modified.

During checker development, the first run referenced a per-slice S498 source
copy that is not present; inspection found the hash-identical source in the
shared `C:\G04-CLO-DXF-Exchange\Input` folder. The second run had one mistyped
expected hash. Both were checker-record errors, corrected before the final
14-artifact verification passed. Neither was a CLO or format error.

The start-preflight helper was then exercised again after exit replay and
rejected board revision 3457 because its idempotency guard knew only the
pre-start and post-start revisions. The guard now accepts the completed
revision 3457 and checks both S585 start/exit evidence IDs. This was a stale
preflight expectation, not a board or acceptance failure.

Started 2026-10-09 06:09:32 UTC from S584 `2d1ed375558cacdd541921a71ce02590582781ea`; refreshed `origin/main` remained an ancestor. Unique slice 585. Board start replay advanced `3453→3455`; validated exit replay is recorded below and leaves every work-item status unchanged. `npm run control-center:test` passed `42/42` after start replay. The start-preflight helper was corrected after its post-replay check still required revision 3453; it now accepts the start state at 3453 or the applied state at 3455 and checks the start evidence after replay. No product source/tests or export baseline changed, so full coverage/build gates remain reserved for the settled Epic candidate.

The validated exit command links `E-G04-S585-EXIT` to G04-V03 at board
revision 3457. Focused closeout passed: five S585 script syntax checks,
14-artifact/hash and nine-getter verification, start/exit board preflight and
replay, Control Center tests 42/42, and `git diff --check`. No independent
delegation or maintainer decision was needed. Elapsed time was 4m27s
(06:09:32–06:13:59 UTC): existing evidence and rendered review 1m30s; focused
hash/gate verification 1m10s; durable packet/state/board closeout and checks
1m47s; production implementation 0m; agent wait 0m; maintainer decision 0m.
No physical-fit, factory-acceptance, or production-readiness claim is made.
