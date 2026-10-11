# V03 gate reconciliation — S688 source audit supplement

This supplement updates the current S686 matrix with the completed Sol
read-only source audit and S687's direct all-entity audit. It does not replace
the matrix or change any gate, threshold, recipe/option cohort, hold, or
acceptance criterion.

## Finding

The reviewed product writer emits the source DXF and its optional centimeters
header. The package verifier binds the centimeters declaration, drawing hash,
piece/grade/stitch data and source mark records. The exact S685 input passes
those source-side checks. In the exact S685 CLO Standard return, CLO changes
the unit code without scaling the coordinates, omits five CUT vertices enough
to exceed `0.001 cm`, and fails to return eight visible marks. S687 checked all
nine returned piece blocks and found only 125 `LWPOLYLINE` entities, with no
`LINE`, `POINT`, or `CIRCLE` entities. Therefore the S685 comparison did not
miss another typed mark entity.

The bounded Sol audit found no specific source serialization defect causally
connected to these returned failures and no supported source-code correction.
Prior source-representation work (S574, S631, S671–S672) did not resolve the
same contour misses; the exact output remains the decisive evidence. A header
rewrite or another entity-encoding variation would conceal or repeat measured
receiver behavior without clearing the other gates.

## Updated gate interpretation

| Gate group | Current disposition | Evidence and next proof |
|---|---|---|
| Source package: centimeters, source hashes, options, grades, piece/stitch identity, visible mark records | Passed at source/package level | S676–S681 verification covers all seven recipes, 73 supported configurations and source grade rows. It is not receiver proof. |
| Exact CLO Standard return: units, CUT geometry, visible marks | Failed for the measured Polo M return | S685 exact source/return comparison and S687 all-entity audit; failures remain. No causal source-code fix is supported. |
| CLO returned sidecar identity/grade relation | Unproven | S685 did not round-trip the C04 sidecar; this cannot cure the independent direct-drawing failures. |
| GetonAgain/GMS/DGS route | Failed or not a usable DXF route in observed build | S655 GMS opens a marker file and exposes no enabled direct DXF path; DGS's actual imports render/register 0/0 and its exports contain metadata text without pattern geometry (S668–S670). Do not retry the retired routes. |
| LibreCAD R12 | Failed as a complete route | S674 preserves measured geometry/typed marks for one Polo M but omits the centimeter declaration and is generic CAD, not a documented industrial apparel profile. |
| OpenCAD R14 | Failed as a complete route | Existing S627/S646 evidence identifies generic profile/readability and malformed-input failures. Its passing geometry/metadata/repeatability subchecks cannot combine with another receiver's results. |
| Full all-seven/options/grades receiver exchange, malformed-input rejection, repeatability, readable saved output, industrial profile | Unproven overall | No candidate has passed the exact representative pilot. A future proof requires one already available and rights-cleared receiver/profile that can satisfy every fixed gate; then use the existing fixtures and 73-row matrix once. |
| Legacy DXF, protected export bytes, final review, PR, merge, ancestry, deployment | Preserved to date / final proof pending | Candidate package changes are additive; full integrated gate is due only on a settled eligible candidate. |

## Decision and shortest credible path

No source change, new receiver, format, profile, or encoding trial is supported
by the current evidence. The only route that can resume V03 without changing
acceptance is a specifically identified, rights-cleared receiver/profile that
is already available and can meet the direct geometry/unit/mark gates plus
C04's bound sidecar allowance. At that point, run one exact Polo M pilot and
stop on its first fixed-gate miss. Only after a full pilot pass should the
existing all-seven/73-option/grade cohort, malformed-input fixtures,
repeat-round-trip, and rendered-output checks run.

There is no pending maintainer design approval or manual UI action. No tested
receiver currently satisfies the admitted exchange contract. Keep G04-V03
Blocked while that prerequisite is absent; keep EPIC-17 open and all V03
criteria unchanged. No physical-fit, factory-acceptance, production-readiness,
ANSI/AAMA, or ASTM conformance claim is made.
