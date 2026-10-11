# S630 independent official-source review handoff

## Slice and objective

Slice 630 is a documentation-only audit of the publicly inspectable official
CLO DXF help page, official ASTM D6673-10 status/product record, and the public
NISTIR 5969 apparel pattern information model. Independently determine whether
these sources establish a rights-accessible, normative, concrete mark encoding
for an industrial DXF-AAMA/D6673 exchange that could justify another S628-like
receiver test. This is source research, not a product implementation or CLO
test.

## Why delegation is safe

The task is read-only interpretation of named public sources. Codex owns all
project files, conclusions, status and board. Do not modify the working tree,
generate fixture evidence, perform network uploads, or interact with CLO.

## Exact authoritative sources

- CLO Help Center, https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export
- ASTM D6673-10 product record, https://store.astm.org/d6673-10.html
- ASTM textile standards catalog, https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html
- NISTIR 5969 public PDF, https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf
- NISTIR 5823 public PDF (historical catalog context only), https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5823.pdf

## Questions and limits

1. What exact edition/status and scope does ASTM's current public record state?
   Does the public record identify a replacement? Do not use or quote any
   unofficial full-standard repost.
2. Does CLO identify a precise normative edition or state how its DXF-AAMA
   mode maps LINE/CIRCLE/POINT marks or `MARK_*` roles? Be precise about what
   the help article lists versus omits.
3. In NISTIR 5969, what are the typed `MARK_FEATURE`/`MARK_FEATURE_TYPE`
   definitions and model drawings? Is this an EXPRESS/STEP research model or
   a normative DXF-AAMA encoding? Does it specify a representation equivalent
   to the S629 source `POINT` and `CIRCLE` output cases?
4. State whether any source-backed hypothesis is precise and authorized
   enough for an additional receiver experiment. Do not invent one from a
   conceptual mark-type match.

## Non-goals

No paid standard access, purchase recommendation as a blocker, third-party
contact, source code/geometry/threshold/gate changes, CLO operations, claim of
conformance, scope relaxation, or user decision request. Use only sources
listed above for normative/status assertions; report unsupported facts as
unknown.

## Return

Return concise findings with each claim tied to an exact page/section/line and
source URL; include what each source cannot prove. State limitations of any
legal/public access, version or date. Return no patch and no file changes. End
with the exact signal `WORK FINISHED`.
