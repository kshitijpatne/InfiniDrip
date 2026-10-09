# S557 correction to S556 V03 gate interpretation

S556's original exit packet and matrix overconstrained V03 by treating an
independent second receiver as mandatory. The authoritative admitted G04
criterion is in `docs/planning/EPIC-17-ADMISSION.md` under V03 acceptance:
prove a documented industrial CAD exchange profile and representative
round-trip behavior; select the receiver/profile only after rights review and
evidence; claim exact compatibility only to the extent demonstrated by
imports and round trips. It does not require two applications.

Accordingly, a same-application CLO round trip is admissible evidence for the
round-trip portion if CLO's specific industrial profile is documented, the
rights review is satisfied, and every other admitted technical gate passes.
A second receiver is optional additional assurance. This removes only the
unadmitted independent-receiver prerequisite. It does not qualify CLO or
clear its exact-profile, measured Polo contour, CUT/SEW, mark, grade/option,
malformed-input, rendered-output, or all-seven acceptance requirements.

S557 updates the current matrix and project summaries to correct that
interpretation while preserving the original acceptance criteria. S556's
historical packet is retained unchanged as evidence of the mistake and its
correction.
