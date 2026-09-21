# EPIC 11 - Polo V2 Fidelity Refinement

Status: **RESEARCH AND EXECUTION PACKET COMPLETE - EPIC 7 GATE SATISFIED;
IMPLEMENTATION AWAITING SCHEDULING**

Owner: **Codex**. External coding agents may assist only with bounded test or
documentation work after Codex has supplied a slice packet. Codex owns geometry,
drafting, data contracts, review, repairs, integration and any push to
`origin/main`.

Scheduling note: the garment-expansion research wave completed Slices 149-154.
Epic 11's unchanged implementation plan is Slices 155-161; no scope or
acceptance criterion changed.

Research authority: `docs/research/garments/POLO-V2-RESEARCH.md`.

## Outcome

Upgrade the existing Polo recipe from its V1 rectangular collar stand and
front-only fidelity cues to a shaped, neckline-derived collar/stand system with
truthful front/back previews, explicit placket-base construction marks, open
side vents and an adjustable dropped back hem. Preserve every other garment,
shared output contract and legacy export hash.

## Start gate and parallel boundary

Epic 7 completed and was pushed to `origin/main` at `db14b63`, satisfying item
1 below. Implementation Slices 155-161 must not start until all of the
following remain true at start time:

1. Epic 7 Slices 132-134 are reviewed, merged and present on `origin/main`
   (**satisfied at `db14b63`**).
2. Codex rebases or recreates the Epic 11 branch from that verified main.
3. The full gate passes at the new base and the checkout contains no unrelated
   user changes in Epic 11's intended files.

Epic 11 must not modify `nestPieces`, Epic 7 buffer/on-hand/directional
semantics, nesting-planning persistence, Electron release code, or Epic 9/10
evidence. It consumes the final nesting behavior like every other recipe.

## Fixed scope

### P0

- Shaped lower/upper collar-stand curves derived from each drafted size's real
  front/back neckline interfaces.
- Collar bases derived from the real stand-upper seam, with CB/shoulder/CF
  construction landmarks.
- Four new recipe-owned options:
  `standFrontRise`, `collarPointExtension`, `sideVentDepth`, `backHemDrop`.
- Front and back Polo schematic details driven by shared pure geometry facts.
- Diagonal placket-base clip lines and a named reinforcement/box cue while
  preserving the existing slit and attachment stitches.
- Real open side-vent topology and separate front/back hems with an adjustable
  back drop.
- Guidance, POM, construction order, persistence, grading, nesting, surface,
  UI and all-export verification for the changed Polo.

### P1 only if P0 exits cleanly

- None. Keep this redesign bounded. Any direct-manipulation UI or additional
  style variant requires a separate packet.

### Explicitly excluded

- Sleeve rib/band, material-aware negative ease, turn-of-cloth differential,
  alternate collars, pocket/yoke, long sleeve, button-count/spacing controls,
  manual point grading, physical sampling, 3D/VTO, final-design Edit, signing,
  packaging and changes to another garment.

## File boundary

Expected implementation files include:

- `src/drafting/polo.ts` and focused tests;
- a small pure Polo collar/stand geometry module if separation improves shared
  draft/render truth;
- the smallest existing piece/curve/mark/stitch helpers needed for genuine
  reusable behavior, with invariant tests;
- `src/render/polo-details.ts`, Body/assembled routing and focused tests;
- `src/drafting/recipe.ts`, Polo POM/tech-pack metadata and tests;
- `src/ui/app.ts`, option rendering/persistence routing and focused tests;
- Polo parsed-export, surface and cross-size exit tests;
- this packet, research, architecture, decisions, roadmap, state and final exit
  report.

Any change to a shared primitive needs a before/after consumer audit. A change
to `src/export/nesting.ts`, Electron code, save-format version, or an existing
export baseline is a stop condition requiring a new written decision.

## Slice plan

### Slice 148 - Research, decisions and execution packet

Scope: inspect V1 geometry and outputs, review the supplied CAD reference,
cross-vet collar/placket/vent/band/grading evidence, resolve V2 scope, enumerate
edge cases and synchronize durable context.

Acceptance:

- research distinguishes sourced behavior, product defaults, engineering
  decisions and physical unknowns;
- every prior V2 backlog question receives an include/defer verdict;
- options, bounds, guidance and implementation slices are unambiguous;
- Epic 7 isolation and the implementation start gate are explicit.

Non-goals: application code, new geometry, baselines, UI behavior or an
implementation-start claim.

Owner/model: Codex, Sol high. Result: complete in this documentation change.

### Slice 155 - Pure shaped collar and stand geometry contract

Scope: add a pure deterministic geometry helper that consumes neckline
interface lengths/landmarks and the resolved collar options, returning shaped
stand/collar seam facts usable by drafting and previews.

Acceptance:

- lower stand arc equals the supplied neckline interface;
- upper stand and both collar bases agree by measured arc length;
- CB/shoulder/CF landmarks are ordered and reproducible;
- default, boundary and invalid combinations remain finite or produce a
  specific validation result;
- no recipe or UI output changes yet.

Non-goals: piece replacement, preview wiring, vents, placket marks, save/UI or
exports.

Owner/model: Codex, Sol high for curve construction and numeric pressure tests.
Gate: focused geometry properties plus the complete unchanged project gate.

Status: complete. The pure helper and 11-test focused contract suite preserve
the current recipe and output surface; strict TypeScript and the unchanged
100%-coverage baseline pass.

### Slice 156 - Replace V1 collar and stand pieces

Scope: use Slice 155 geometry for the four physical Polo collar/stand roles;
add the two new collar options, seam interfaces, allowances and landmarks.

Acceptance:

- all shaped pieces are valid and non-self-intersecting across sizes/options;
- the neckline, stand and collar stitches pass on actual curves;
- four physical roles and cut-on-fold semantics remain;
- Polo output changes only for the documented V2 reason; every non-Polo output
  and protected hash stays identical.

Non-goals: previews, placket, vents, UI, physical collar-roll claims.

Owner/model: Codex, Sol high. Gate: curve/allowance validation, stitch checks,
parsed Polo SVG/DXF and full regression.

Status: complete. The focused drafting gate is 25/25; the serial full project
gate is 102 files / 1,392 tests with 100% statements, branches, functions and
lines. The recipe remains nine roles, the four physical collar/stand roles
remain cut on fold, and no export baseline or non-Polo path was intentionally
changed.

### Slice 157 - Placket-base construction truth

Scope: add two diagonal clip/cut marks and the named base reinforcement/box cue
derived from the live placket and its 1 cm attachment allowance.

Acceptance:

- the current slit-side attachment interfaces remain exact;
- marks survive every cutting writer and projector mirror rule at true scale;
- invalid placket/hem/vent proximity produces an actionable warning;
- no exterior centre-front seam or extra role is introduced.

Non-goals: changing button count/spacing, changing finished placket defaults,
or adding a gusset.

Owner/model: Codex; Luna max is sufficient after a short Sol-high contract
review. Gate: pattern-mark writer matrix, parsed outputs and full regression.

Status: complete. The existing slit and
attachment interfaces remain exact, and the three new base marks are parsed in
SVG, DXF, tiled PDF, A0 and projector outputs. Full project verification is
102 files / 1,393 tests with 100% statements, branches, functions and lines.
Vent-aware guidance remains coupled to Slice 158/159.

### Slice 158 - Side vents and dropped back hem

Scope: implement the vent/open-edge topology and back-drop options while
preserving matched sewn side interfaces.

Acceptance:

- vent 0 uses the original uninterrupted topology;
- nonzero vents stop both sewn side seams at aligned marks;
- front/back body lengths and back drop measure exactly;
- guidance covers every incompatibility from the research record;
- existing woven-shirt vent output remains byte-identical if a shared helper is
  extracted.

Non-goals: curved Polo hem, sleeve band, new material model or nesting changes.

Owner/model: Codex, Sol high for topology and seam ownership. Gate: focused
topology/allowance tests, cross-size stitches, parsed exports and full regression.

### Slice 159 - Preview, controls, persistence and reports

Scope: route all four V2 options through the existing recipe UI/save contract;
render the same collar/stand facts on front and back; update POMs, guidance,
tech pack and construction sequence.

Acceptance:

- pre-Epic-11 Polo saves load with V2 defaults without a version bump;
- raw invalid values remain visible and recoverable;
- front/back previews expose the real stand continuation, vents and different
  hem lengths with correct option spotlight ownership;
- pattern, assembled, Body, Spec and Check views agree on values and names.

Non-goals: final-design Edit behavior, new workspace flow or global redesign.

Owner/model: Codex; Sol high for contract review, Luna max for mechanical
wiring/tests. Gate: persistence migration, mounted UI/accessibility, render DOM
and full regression.

### Slice 160 - Cross-size, surface, nesting and export pressure matrix

Scope: run the complete research edge-case matrix through every downstream
consumer after Epic 7 is present.

Acceptance:

- full graded run passes seam, allowance, bounds and finite-coordinate checks;
- Pattern/Body/assembled/Size run/Spec/Nesting/Check/surface views are rendered
  and inspected for default, boundary and crossed-risk cases;
- narrow/wide fabric layouts remain deterministic and Epic 7 verdicts remain
  semantically unchanged;
- SVG, DXF, tiled PDF, A0, projector and tech-pack outputs parse at true scale;
- all non-Polo bytes and protected baselines remain unchanged.

Non-goals: optimizing layout, moving baselines to hide failures or claiming
physical correctness.

Owner/model: Codex; Luna max executes the matrix, Sol high investigates any
geometry/export anomaly. Gate: 100% coverage, typecheck, production build,
property/oracle suite, rendered evidence and parsed outputs.

### Slice 161 - Epic 11 exit and durable handoff

Scope: review the total Epic diff, fix every defect, run the full gate from a
clean checkout, create `docs/release/EPIC-11-EXIT-REPORT.md`, synchronize all
durable context, commit and push only after evidence agrees.

Acceptance:

- no unresolved P0 issue, failing case, stale status or contradictory scope;
- exit report records exact tests, hashes, rendered cases and limitations;
- the roadmap identifies the next safe lane without implying physical proof;
- only Codex pushes the reviewed result to `origin/main`.

Owner/model: Codex, Sol high for final review; Luna max for repetitive gates.

## Mandatory edge-case matrix

At minimum, exercise:

- default M plus XS and XL;
- minimum/maximum neck and body length;
- every new option endpoint;
- stand 1/rise 2; leaf 4/point 3; vent 0/drop 1.5; vent 3/drop 5;
- maximum vent on the shortest body; maximum placket on that same body;
- pre-Epic-11 Polo save, V2 save, invalid recovery state and undo/redo;
- empty and populated surface placements;
- single-size and graded marker on narrow and wide fabric;
- every output format and unsupported/overflow failure state.

Passing tests alone is insufficient. Inspect actual drafted outlines, marks,
allowances, labels, front/back previews and representative PDF pages.

## Permanent exit gates

- 100% statements, branches, functions and lines.
- TypeScript and production build pass.
- Seeded property/oracle coverage remains green.
- Every affected output is parsed by a real consumer and representative output
  is visually inspected.
- Eight protected legacy export hashes remain byte-identical.
- No physical-fit, collar-roll, recovery, sewability, manufacturing or
  production-readiness claim.
- No Epic 7, Epic 8, Electron, signing, packaging or final-design Edit scope.

## Return contract

Each slice returns the exact commit, changed files, focused/full gate results,
rendered/output evidence, baseline status, known limitations and a statement
that the branch was not pushed to `main` by a contributor. Codex reviews the
actual diff and evidence before accepting the next slice.
