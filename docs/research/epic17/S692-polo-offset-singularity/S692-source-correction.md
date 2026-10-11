# S692 correction to S691's source-cause conclusion

S691's V03 matrix and completion plan correctly retain the measured receiver,
identity, marks, negative-input, repeatability, readability, breadth and rights
gaps. Their narrower conclusion that no source offset defect was supported is
superseded for the five Polo cut vertices listed below.

S692 evaluates the exact current cubic and its analytic first/second
derivatives. Under the current 1 cm right-normal offset, curvature radius
falls below the allowance; the offset derivative reaches zero at
`t=0.9346892443`. The existing outline sampler uses fourteen equal parameter
steps; its last pre-end sample is `t=13/14=0.9285714286`, only 0.019513 cm of
signed offset radius from the singularity. The same source cubic is mapped to:

| Piece | Source edge | S634 emitted short CUT step |
|---|---|---:|
| Back | `neckline` | 0.045618 cm |
| Outer collar stand | `backCollar` | 0.046519 cm |
| Inner collar stand | `backCollar` | 0.046957 cm |
| Upper pointed collar | `backCollarBase` | 0.046519 cm |
| Under pointed collar | `backCollarBase` | 0.046519 cm |

The source-to-output mapping and exact calculations are recorded in
`S692-exit-packet.md`; the reproducible helper and JSON are outside Git at
`C:\G04-CAD-Interchange\S692-polo-offset-singularity\`. The report is
hash-pinned there.

This establishes the exporter-side offset singularity and a plausible source
condition aligned with the observed receiver losses. It does not reveal CLO's
internal simplification behavior, prove another receiver will fail, validate a
new algorithm, or establish any physical sewing consequence.

The corrective work is additive and scoped to G04's new interchange package:
use a separately versioned, cusp-aware adaptive polyline representation for
the same mathematical offset, or fail closed if the outline cannot be
represented without self-crossing. Do not alter recipe edges, allowances,
stitch graph, legacy DXF output, protected identities or the 0.001 cm limit.
The candidate must pass analytic-distance, topology, rendered-output,
all-seven/73-option/grade, and changed-code 100% coverage checks before another
receiver operation. V03 remains unpassed until every independent acceptance
gate is also evidenced.
