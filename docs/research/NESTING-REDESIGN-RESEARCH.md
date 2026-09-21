# Epic 8 nesting-redesign research

_Scoping record started 2026-09-21. This document recommends a bounded Epic 8
proof; it does not authorize production integration, change the current nesting
engine, or make a production-marker, physical-fit, or material-saving claim._

## Decision summary

The reserved Epic 8 slot is best used for a **true-shape nesting proof and
controlled redesign** around the completed Epic 7 planning contract. The proof
should evaluate `JeroenGar/sparrow` through an isolated adapter/worker while
keeping InfiniDrip's deterministic bounding-box shelf packer as the default and
the unconditional fallback.

This is a **redesign with an opt-in addition**, not a replacement of
`nestPieces`. The solver may only return candidate placement transforms. Owned
InfiniDrip validation must re-check every candidate against the original typed
cut loops and apparel constraints before it can be displayed or considered for
future export use.

No production adoption is earned until the admission gates in the Epic 8
execution packet pass. A proof-only or no-go result is a valid completion if the
candidate does not beat the current baseline safely.

## Why this belongs in Epic 8

Epic 7 made the current nesting estimate explicit: waste percentage, buffered
planning length, fabric-on-hand fit/shortage, and a truthful directional-print
notice. It deliberately left irregular nesting, rotation and interlocking out of
scope. The current `nestPieces` implementation still shelf-packs cut-line
bounding boxes with grain kept upright. That is honest and deterministic, but it
can overestimate fabric for concave pieces and cannot exploit safe interlocking.

The deferred roadmap item 0.5.15 is the only existing reserved initiative that
both depends naturally on Epic 7's constraints and has a vetted open-source
candidate. Epic 8 must not be repurposed into a garment, photo/CV, 3D, or
physical-validation Epic.

## Candidate pressure test

| Candidate | Fit | Failure / maintenance risk | Epic 8 decision |
| --- | --- | --- | --- |
| Current shelf packer | Fast, deterministic, already integrated | Bounding-box waste; no interlock | Keep as default and fallback |
| Sparrow + `jagua-rs` | Local Rust/WASM, fixed seed, strip packing, clearance and transforms | Apparel constraints are absent; worker/legal/packaging cost | **Isolated proof candidate** |
| SVGnest-style browser GA | Familiar SVG shape input | Dormant, non-deterministic optimization, weaker worker/runtime posture | Reject |
| New owned no-fit-polygon solver | Full control | Large geometry/optimization maintenance burden; duplicates active research | Reject for Epic 8 |
| Difficulty metadata or measuring/upcycle helper | Useful independent features | Does not address the reserved nesting dependency or Epic 7 boundary | Keep as separate roadmap work |

## License and dependency posture

The live upstream pages were rechecked on 2026-09-21:

- [`sparrow`](https://github.com/JeroenGar/sparrow) is top-level MIT and
  documents fixed RNG seeds, strip width, clearances, worker-count controls and
  SVG/JSON solutions.
- [`sparrow-studio`](https://github.com/JeroenGar/sparrow-studio) is top-level
  MIT and runs the Rust solver as WebAssembly in a Web Worker. It carries a
  third-party notices file.
- [`jagua-rs`](https://github.com/JeroenGar/jagua-rs) is MPL-2.0 and is the
  collision-detection dependency used by Sparrow. Its notices, exact source
  offer/modification obligations and the license of every shipped WASM artifact
  must be recorded before distribution.

This is an engineering/license screen, not legal advice. Epic 8 may not copy
source or add a runtime dependency from an unpinned revision. Before any
package or WASM artifact is admitted, record exact SHAs, manifests, generated
artifacts, notices, source-availability obligations and an offline rebuild or
reproducible-artifact plan. A failed legal or reproducibility check stops the
integration and leaves the proof disposable.

## Architecture fit

The existing spine already exposes the right narrow data boundary:

- `FlatPiece` contains true-scale flattened sew and cut polylines;
- `NestResult` contains placed pieces, width, length, utilization and fit;
- `markerPieces` builds a single-size or graded-marker input;
- all current writers and the mounted app consume the existing placement truth;
- Epic 7 planning values are additive and do not change geometry or exports.

The proposed adapter must not hand Sparrow a second pattern truth. It should
convert an InfiniDrip-owned, versioned nesting instance into the solver's JSON
shape format, receive only a seed plus transforms, apply those transforms to the
original `FlatPiece` loops, and run the owned validator. Names, size labels,
cut/sew loops, marks, fold semantics and any future physical quantity metadata
remain InfiniDrip-owned.

The current code does **not** yet have a generic physical-quantity/fold policy
for an irregular solver. `markerPieces` is the existing estimate contract, and
`unfoldFlat` is an export-specific operation. Epic 8 must resolve this explicitly
before claiming a true marker: it may support only a declared subset in the
proof, or add a typed adapter contract. It must never silently double, omit,
rotate, mirror or unfold a piece.

## Apparel constraints required before solver admission

The instance contract must represent, or explicitly mark as unknown:

1. bolt width, usable length, edge margin and inter-piece clearance;
2. finite closed cut loops and the corresponding sew loops;
3. piece identity, garment/size identity and requested physical quantity;
4. grain axis and allowed rotations; a directional/nap fabric cannot silently
   become rotation-free or rotation-permissive;
5. cut-on-fold edges, whether a piece must remain on a fold, and whether an
   unfolded full-width representation is being used;
6. mirrored/paired requirements and face-up/face-down restrictions;
7. annotation/mark clearance and the preservation of original marks/labels; and
8. single-bolt versus multi-material grouping. A combined main/rib/lining result
   is not one truthful fabric estimate.

Unknown constraints are not approximated. The proof must reject or quarantine
the case and fall back to the shelf packer with an actionable reason.

## Required failure containment

- Shelf packing remains the default until a maintainer-approved promotion gate
  passes.
- Solver errors, malformed output, unsupported fold/quantity semantics,
  cancellation, timeout, memory pressure, non-finite coordinates, overlap,
  boundary violation, clearance violation, grain/nap violation, or a failed
  deterministic replay fall back to the current shelf result.
- Fallback must be visible in proof evidence and, if a later UI is admitted,
  visible to the user. No silent “successful” result may hide a fallback.
- Solver transforms never bypass existing output parsing, placement validation,
  export gates, or protected legacy hashes.
- No optimizer result may be described as physical fit, sewability, production
  readiness, or guaranteed material savings.

## Benchmark corpus and admission hypotheses

The proof must compare the candidate with the same input semantics used by the
baseline across all seven current recipes, at least the selected-size and
graded-marker scopes, and representative narrow/default/wide fabric widths.
Include empty input, an item wider than the usable bolt, concave pieces,
touching/near-touching edges, fold pieces, mirrored pairs, duplicate quantities,
directional/nap mode, invalid/non-finite values, maximum clearance, and all
candidate timeout/failure paths. Repeat each admitted case with the same seed.

The provisional promotion hypothesis is:

- zero validator failures or baseline regressions in the supported corpus;
- byte-for-byte identical candidate transforms on fixed-seed replay;
- median required-length reduction of at least 5% versus the shelf baseline on
  the representative corpus, or an explicitly documented maintainer-approved
  reason why a smaller reduction is worth the measured complexity;
- p95 worker time within 5 seconds for a selected-size case and 15 seconds for a
  graded marker on the supported host, with cancellation and fallback working;
- no unbounded memory growth, UI blocking, or offline/package failure; and
- no change to any protected export hash unless a separate written decision
  explicitly approves a new placement contract.

If the hypothesis fails, Epic 8 exits as a proof/no-go record and the current
shelf packer remains the product behavior.

## Non-goals

- no replacement of `nestPieces` by default;
- no automatic fabric-stretch, recovery, shrinkage or material inference;
- no general-purpose CAD/CAM marker, hole nesting, automatic multi-bolt
  allocation, machine toolpath generation or production cutting claim;
- no new garment recipe, photo-to-pattern, VTO, 3D cloth simulation, cloud
  service or physical validation;
- no direct import of Sparrow's geometry as InfiniDrip drafting truth;
- no baseline movement to make the optimizer appear successful; and
- no UI/persistence change until the proof earns promotion.

## Open questions before implementation

These are genuine gates, not details to guess during coding:

1. **Product owner:** should an approved solver ever become a user-visible
   opt-in, or should Epic 8 remain an internal proof until physical validation?
2. **Engineering:** what exact fold/quantity representation is truthful for the
   current seven recipes and the future garment records?
3. **Legal/release:** can the chosen Sparrow/Jagua WASM artifact be shipped in
   the supported Electron package with all MPL/MIT notice and source obligations
   satisfied?
4. **Product/engineering:** are the provisional 5%/5-second/15-second promotion
   thresholds appropriate after the first benchmark corpus is measured?

Until questions 2 and 3 have answers, no runtime dependency or export path may
be added.

