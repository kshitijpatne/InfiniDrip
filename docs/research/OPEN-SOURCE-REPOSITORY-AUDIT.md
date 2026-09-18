# InfiniDrip — Open-source repository audit

_Audited 2026-09-17. Repository state, licenses, releases, and dependencies can
change; re-check the exact revision and its full dependency tree before adding a
package or copying code. This is an engineering/license screen, not legal advice._

## Decision summary

The supplied repositories do not justify replacing InfiniDrip's drafting engine,
typed garment grammar, UI redesign, or export pipeline. Epic 4 already implements
the strongest idea present in GarmentCode: dependency-ordered components with
named interfaces and stitches. The 3D, virtual-try-on, and cloth-simulation
sources solve a different problem and would add GPU, dataset, privacy, licensing,
and maintenance burdens without improving 2D cut-pattern accuracy.

Four bounded opportunities survive the pressure test:

| Candidate | License posture | Decision | Classification | Roadmap fit |
|---|---|---|---|---|
| `dequelabs/axe-core` | MPL-2.0; notice/source duties apply to modifications of the covered library | Trial as a dev-only accessibility check; manual keyboard, focus, zoom, viewport, and screen-reader review still governs | **Enhancement** | Slice 121 final accessibility gate |
| `dubzzz/fast-check` | MIT | Adopt later as a dev-only generator/shrinker for bounded drafting, guidance, grading, and export properties | **Enhancement** | First separately scoped post-121 quality slice |
| `alexbol99/flatten-js` (`@flatten-js/core`) | MIT | Trial only as an independent test oracle over already-flattened loops; do not replace production geometry | **Enhancement** | Same or later post-121 quality slice, only where it adds an independent assertion |
| `JeroenGar/sparrow` + `sparrow-studio` | MIT at the top level; includes MPL-2.0 `jagua-rs` and other third-party notices | Preserve current deterministic shelf packer; later run an isolated, opt-in irregular-nesting proof after fabric constraints are explicit | **Redesign** | Deferred Priority 0.5 nesting lane |

GarmentCode also leaves three useful, trigger-based concepts, but not a package
integration: explicit stitch-side/orientation metadata, per-interface projected
length/ease correspondence, and declared option dependencies/compatibilities.
These are **additions** to the existing grammar when a real garment or guidance
case requires them; they are not a new Epic and do not delay the redesign.

The authoritative next action remains Slice 119B unfinished-draft recovery and
bounded Undo/Redo, followed by Slices 120 and 121. This audit changes neither the
current branch nor the reserved redesign sequence.

## Method and admission gate

The audit used repository `LICENSE` files, manifests, source and tests at the
revisions listed below; GitHub topic/API results; current InfiniDrip code; and the
current project/roadmap decisions. Claude Code performed an isolated deep audit
of OpenPattern, GarmentCode, and deepFashion3D. OpenCode audited the broad lists
and adjacent candidates. Codex independently cloned and sampled the sources,
checked their conclusions against InfiniDrip, and owns the decisions here.

Selected native gates were also run in disposable clones on Windows/Node 24.15:
Seamlint passed 187/187 tests, although its install audit reported one untriaged
high-severity dependency finding. `@flatten-js/core` passed 544/544 tests,
including concave, touching, containment, self-intersection and prior
infinite-loop cases; its source-development install reported many deprecated
dev packages and 30 audit findings, while the published runtime manifest itself
declares only `@flatten-js/interval-tree`. Sparrow Studio passed 16/19 test files
and 56/90 tests; all 34 failures were bundled-dataset byte hashes in a Windows
checkout. The sampled `albano.json` was 6,332 bytes with 381 CRLF pairs against
the catalogue's 5,951-byte hash target, with `core.autocrlf=true` and no
repository `.gitattributes`. That is a real clean-checkout portability failure,
not evidence of solver geometry failure, and strengthens the decision to require
an isolated proof rather than adopt it. Python was unavailable on the host, so
StitchProof and PaperSeam native gates were not executed; their code/tests were
inspected and that limitation remains explicit.

A candidate reaches the roadmap only if all of these are true:

1. Its license and every material transitive asset/dependency permit the intended
   distribution, with obligations we can satisfy.
2. It solves a demonstrated InfiniDrip problem better than the current code; star
   count, novelty, and an “awesome” listing are not evidence of fit.
3. It has an isolation boundary that preserves pure drafting, warning-not-clamp
   guidance, offline use, current export contracts, and the eight legacy hashes.
4. Its failure modes are detectable, reproducible, and recoverable. A stochastic
   result must retain its seed; a checker must not be treated as proof of physical
   fit; an optimizer must be followed by our own exact validation.
5. Maintenance, runtime, build, security, and data/asset costs are proportionate
   to user value.
6. It does not reopen photo-to-pattern, 3D drape, cloud accounts, or another
   excluded capability by implication.

License shorthand used below:

- Permissive licenses such as MIT/Apache-2.0/Boost generally allow commercial
  reuse with their required notices and conditions.
- GPL-3.0 permits commercial use, but distribution of a derivative combined work
  invokes strong copyleft/source obligations. It is therefore not approved for
  direct incorporation under InfiniDrip's current product posture.
- “No license” means no default permission to copy, modify, or redistribute code.
  Observable ideas and public interfaces may be researched, but any implementation
  must be independently specified and written without copying protected expression.
- A list's license covers that list, not every repository, model, paper, dataset,
  font, or asset it links.

## Supplied repository audits

### OpenPattern — reject direct use; provenance-sensitive reference only

- **Revision checked:** `c8138ca68f8a59a040a456887686082b802c129f`
  (2024-10-29).
- **License:** GPL-3.0.
- **What it contains:** a Python/matplotlib drafting library with numpy/scipy,
  SQLite measurements, full-scale/A4 output, and bodice, shirt, skirt, trouser,
  collar, cuff, and placket modules.
- **Legal result:** direct source integration is not approved. Doing so would
  require a deliberate GPL distribution decision. More importantly, the README
  says the pattern methods follow named commercial patternmaking authors, so code
  license alone does not establish clean provenance for the encoded drafting rules.
- **Technical result:** the mutable Python/render/database coupling conflicts with
  InfiniDrip's pure TypeScript geometry and downstream `Block` contract. The two
  test files do not provide a credible assertion-based regression suite for the
  drafting library. There are no capabilities here that InfiniDrip lacks strongly
  enough to justify a rewrite.
- **Safe learning boundary:** use only a high-level feature inventory (components,
  full-scale and tiled output). Any formula must be independently derived from an
  appropriate primary patternmaking source and documented in the garment research
  record. Do not translate the implementation line by line.
- **Roadmap:** none. InfiniDrip already supplies the relevant garment families and
  vector/print paths with stronger typed and regression contracts.

### GarmentCode — no runtime integration; retain three grammar concepts

- **Revision checked:** `d449629979028123a5c4dc9e732a2ec19b7fce31`
  (2025-06-29), version 2.0.2-era tree.
- **License:** MIT for the repository code. Body meshes, SMPL-related material,
  datasets, and external simulation assets must be checked separately; the top-level
  license must not be assumed to clear them.
- **What it contains:** Python `Panel`, `Component`, `Interface`, and stitching
  abstractions; garment programs; GUI/configuration; mesh generation; and optional
  3D simulation paths. The install surface includes numpy/scipy, SVG tooling,
  rendering/GUI packages and native/3D dependencies such as libigl/CGAL/pyrender;
  the simulation path also involves Warp/GPU tooling.
- **Overlap:** Epic 4 already provides dependency-ordered components, scoped
  options, named interfaces, stitches, cycle/missing-dependency errors, and all
  seven recipe migrations in TypeScript. Replacing it would erase independent
  work, expand the runtime, and threaten export identity without user benefit.
- **Concepts worth retaining:**
  - explicit right-side/wrong-side or stitch-direction semantics, so tech-pack and
    construction output can describe orientation rather than only naming two edges;
  - projected/eased interface correspondence, so multi-edge joins, gathering, and
    controlled ease express more than the present sum-of-lengths band;
  - declared option dependencies/ranges/compatibilities to power actionable
    invalid-combination guidance without silently clamping user choices.
- **Pressure test:** these ideas do not yet justify generic machinery. Introduce
  each only with a real consumer, independently specified TypeScript tests, a
  migration-free optional field where possible, and a demonstration that all
  current recipes/exports remain unchanged.
- **Roadmap:** trigger-based additions beside the completed Priority 1 grammar;
  no GarmentCode integration slice and no 3D work.

### awesome-virtual-try-on — reject as implementation input

- **Revision checked:** `93a51dca9be75b8a149039ca0ae0113305b64360`
  (2026-09-12).
- **License:** no repository license was present. Every linked implementation,
  weight set, dataset, and paper also has its own terms.
- **What it contains:** an extensive research index covering 2D/3D/video virtual
  try-on, diffusion/GAN methods, pose transfer, human image synthesis, and datasets.
- **Pressure test:** its output is an image or 3D representation, not a verified
  editable cut pattern. Shipping it would introduce model/dataset rights, GPU and
  download size, human-image privacy, bias, moderation, reproducibility, and model
  maintenance questions. None improves current pattern dimensions or sewability.
- **Roadmap:** reject all entries for v1. Retain the URL only as a market-watch
  index if the maintainer later reopens photo/CV or 3D scope explicitly.

### GitHub `apparel-design` topic — exhausted; no viable code candidate

The topic page is discovery metadata, not a licensed package. The 21 results at
the audit date were almost entirely generative-art repositories or copies:

`reyrove/Digital-Pollen-Generative-Art`, `Game-of-Life-Generative-Art`,
`Dreamscape-Watercolors-Generative-Art`, `Citrus-Mosaic-Generative-Art`,
`Fixed-Wave-Generative-Art`, `Pappus-Generative-Art`,
`Fibonaccis-Spin-Generative-Art`, `Girih-1-Generative-Art`,
`Crazy-Knight-Curve-Generative-Art`, `Polar-Memories-Generative-Art`,
`Wandering-Eyes-Generative-Art`, and `Ephemeral-Whirls-Generative-Art`, plus
similarly named forks/copies under `monikag9481`, `Karylinliquefiable980`,
`satheeshvm`, `Worthinesswatersapphire129`, `ericsociable922`, and
`gamesmistressherculesclub958`. They are unrelated to garment drafting.
`EnchanterMenhir/CLO-3D-2026-Creative-Collection` is a CLO portfolio, not a
reusable engine; `Wyrlight/Wyrlight` and `iamrichmack111/map-jinn` do not provide
an InfiniDrip integration seam. **Roadmap result: none.**

### GitHub `sewing-patterns` topic, Python — useful QA ideas, no adoption now

| Repository | License signal | Disposition and reason |
|---|---|---|
| `pricklygorse/Inkscape-Unroll-to-Straight-Extension` | no license detected | Inkscape-specific geometric utility; no redistribution permission and no current boundary |
| `rckTom/ChuteMaker` | GPL-3.0 | Parachute-specific generator; wrong garment/use case and copyleft integration cost |
| `destos/Patterner` | MIT | 2019 planning-stage Python scaffold, not a pattern engine |
| `neonfuzz/svg_quilter` | MIT | Quilt/SVG utility; no demonstrated missing InfiniDrip capability |
| `myogpatterns/tiled-pattern-exporter` | MIT | PNG-to-PDF tiling duplicates InfiniDrip's vector tiled PDF output |
| `pricklygorse/Inkscape-Quick-Measure` | no license detected | Inkscape utility; no safe direct reuse or product seam |
| `SewSphere/BraCupPattern` | Apache-2.0 | Narrow future garment research, not reusable proof for InfiniDrip; bra drafting needs its own sourced garment record |
| `KanadeK/stitchproof` | MIT | Thoughtful SVG metadata/preflight, but alpha and Python. It would require a second semantic SVG or mutate current output metadata; current block/seam/export checks overlap most rules. Native tests were not run because Python was unavailable |
| `kuavoc/tiledizer` | MIT | Raster/image tiler duplicates shipped vector PDF tiling |
| `KanadeK/paperseam` | MIT | Strong deterministic overlap-continuity concept, but alpha Python plus Pillow/pypdf/PDFium native parsing; defer until an actual tiled-PDF continuity defect survives current parsed-output checks. Native tests were not run because Python was unavailable |

`stitchproof` and `paperseam` are not dismissed: their read-only, report-not-repair
posture matches InfiniDrip well. They stay in the reject/defer ledger because an
extra language/runtime and adapter would currently duplicate stronger in-process
facts. Re-evaluate against a minimal failing InfiniDrip artifact, never against a
generic promise of “more QA.”

### awesome-cloth-simulation — reject

- **Revision checked:** `fd246262881c908ae3444d6e4940e58608b455ae`
  (2019-02-16); two-commit, README-only list.
- **License:** no license present.
- **Content:** Blender, commercial CLO/Marvelous Designer/Browzwear pointers and
  older cloth-simulation literature; no integrable code.
- **Roadmap:** none. It maps to the explicitly excluded 3D drape problem and is
  too stale/shallow even as a current survey.

### deepFashion3D — reject legally and technically

- **Revision checked:** `687111417225a7738e62affae2bd10ab69440285`
  (2024-01-16).
- **License:** CC BY-NC 4.0. NonCommercial restrictions make it unsuitable for a
  commercial product, and the terms also address database rights.
- **Content:** only README, license, and ignore files; the gated external dataset
  provides 3D point clouds/registered meshes, textures, feature lines, and SMPL
  pose information. There is no implementation to integrate.
- **Pressure test:** single-image 3D reconstruction does not produce InfiniDrip's
  editable, graded, printable 2D pattern contract. It adds the same GPU, body-model,
  dataset, and validation burdens already rejected above.
- **Roadmap:** none unless the maintainer explicitly reopens 3D/photo scope and a
  separate commercial dataset is found. Its feature-line taxonomy is not useful
  enough to justify even a schema addition.

### GitHub `sewing-patterns` topic, TypeScript — reference-only tools

| Repository | License signal | Disposition and reason |
|---|---|---|
| `ic3Dragon/sew-what` | no asserted license in topic metadata | Organizer for sewing/embroidery files, not parametric drafting |
| `kana001-bit/Seamlint` | MIT | Read-only SVG/ASTM-DXF geometry linter; its Node-24 native gate passed 187/187, but it is v0.1, the install audit flagged one untriaged high-severity dependency issue, and no defect was shown beyond current typed/parsed checks; reference only |
| `kana001-bit/Truer` | MIT | Automatic geometry correction conflicts with visible-invalid/actionable-guidance policy; reject product integration |
| `MateuszPiszczatowski/pattern_generator` | no license detected | Print tiling duplicates current output and lacks redistribution permission |
| `kana001-bit/Loomit` | MIT | Git-like external pattern workflow has no validated home-sewer need or safe UI seam |

Seamlint's focused checks—closed loops, seam length, endpoint/curve continuity—are
good test-case ideas. Re-express any missing invariant against InfiniDrip's typed
geometry or independent oracle; do not add a Node-24 CLI merely to reparse our own
SVG.

### sindresorhus/awesome — keep as a discovery index, never as approval

- **Revision checked:** `bc98e517ddca672f55f9857d714fc3ea3c3540b2`
  (2026-09-02).
- **License:** CC0 for the directory itself; downstream projects retain their own
  terms.
- **Useful branches:** accessibility, testing/fuzzing, computational geometry,
  SVG, Electron, and cross-platform Node directories.
- **Result:** accessibility/fuzzing/geometry led to the accepted trials below.
  Canvas/SVG/Electron lists did not uncover a replacement with better fit than the
  current stack. The index is a repeatable discovery source, not a dependency.

## Additional candidates found and pressure-tested

### axe-core — accepted for a bounded Slice 121 trial

- **Revision sampled:** `c026364f11fb848daa8257bf6e1f1790f4871e00`
  (2026-09-16); MPL-2.0.
- **Fit:** InfiniDrip already uses Playwright and Slice 121 already owns the final
  responsive/accessibility pass. Injecting the engine in a Playwright test keeps
  it out of the shipped runtime and can catch rule violations across the five
  stages and dialogs.
- **Limits:** automated checks cover only machine-detectable rules and can miss
  interaction meaning, reading order, announcement quality, focus recovery, and
  zoom usability. Results require human triage; zero findings is not “accessible.”
- **Admission criteria:** pin the package, record notices, fail only on reviewed
  high-confidence rules at first, document justified exclusions, exercise all
  major stage/dialog states, and keep manual/live evidence in Slice 121.
- **Failure containment:** dev dependency only; no production import; no generated
  markup repair; no snapshot/baseline relaxation to silence findings.

### fast-check — accepted for post-redesign property testing

- **Revision sampled:** `ab3ad402119608fee87a8ab57908c07b2443bb20`
  (2026-09-16); MIT; TypeScript, with `pure-rand` as the small runtime dependency
  of the testing package.
- **Fit:** current named fixtures and 100% coverage do not systematically explore
  interactions among measurements, scoped options, grading, and geometry. Generated
  properties can find and shrink an edge case to a reproducible counterexample.
- **First properties:** finite coordinates; input immutability; deterministic
  repeated drafts; closed/nondegenerate cut loops; interface/stitch references
  resolve; valid ranges do not throw; invalid combinations yield actionable
  guidance rather than silent clamping; grading labels/order remain coherent; and
  serializers are deterministic for the same input.
- **Limits:** generators encode assumptions and can manufacture meaningless bodies.
  Use domain-aware generators, separate valid and deliberately invalid cases,
  bounded run counts, stored seeds/paths, and permanent regression fixtures for
  every bug found. Do not replace sourced garment cases, rendered review, parsed
  consumers, physical validation, coverage, or hash gates.
- **Failure containment:** test-only import and fixed CI budget; no production
  branches added merely to appease generated data.

### @flatten-js/core — accepted only as an independent oracle trial

- **Revision sampled:** `5c02ff087b16d82c8c7d3a76086856c2bd3df58f`
  (2026-08-18); MIT; one interval-tree dependency.
- **Fit:** intersections, distances, containment, polygon validity and Boolean
  operations can independently check flattened cut/sew loops, nesting results,
  and future final-Edit validation.
- **Mismatch:** its polygon edges are segments/arcs, while InfiniDrip owns cubic
  curves and flattening tolerances. It cannot be the drafting source of truth and
  does not independently validate errors introduced by our own flattening step.
- **Admission criteria:** adapt copies of already-flattened points in test code;
  compare oracle results against owned implementations; include concave, touching,
  collinear, tiny-edge, self-crossing, and tolerance-boundary fixtures. A disagreement
  is an investigation, not automatic authority.
- **Observed gate:** the sampled source passed 544/544 native tests. Its development
  toolchain also pulled deprecated packages and reported 30 audit findings, so
  trial the published package in InfiniDrip's own lockfile/audit rather than
  importing its repository toolchain.
- **Failure containment:** no imports from production geometry/export modules into
  the library and no export-byte change. Promote to runtime only after a separately
  documented real failure, benchmark, and maintainer-approved baseline decision.

### sparrow / sparrow-studio — accepted as a deferred nesting redesign candidate

- **Revisions sampled:** `sparrow` at
  `7f0e10f946f70a86138d3938548a13ee46464f39` and `sparrow-studio` at
  `2eabe10698e899ce2c59124ff97ca28479484bf6` (both 2026-09-15).
- **License/dependencies:** both top-level projects are MIT. The solver stack uses
  `jagua-rs` under MPL-2.0; the studio ships a third-party notices file. A future
  build must preserve notices and determine source-offer/modification obligations
  for the exact WASM artifacts.
- **Fit:** local Rust/WASM workers, fixed seeds, strip width, clearance, quantities,
  allowed rotations, exact placement transforms, re-validation, tests, and active
  maintenance align far better than the old SVGnest JavaScript/GA implementation.
  Strip packing maps naturally to a fixed-width fabric roll.
- **Missing apparel constraints:** neither general nesting project understands
  grainline semantics, nap/directional print, fold-edge placement, mirrored/paired
  pieces, face-up/face-down cutting, size-set identity, or required annotation
  clearance. Nesting inside holes and automatic multi-sheet allocation are also
  unsupported in the studio.
- **Observed gate:** on a clean Windows checkout, 16/19 test files and 56/90 tests
  passed; the 34 failures were all catalogue SHA-256 mismatches caused by CRLF
  working-tree bytes with `core.autocrlf=true` and no `.gitattributes`. This must
  be fixed or contained in any proof, and a future Windows/Electron gate must pass
  from a genuinely clean checkout.
- **Safe integration shape:** keep today's shelf packer as the fast deterministic
  baseline. A future proof spike sends InfiniDrip-owned flattened loops and explicit
  constraints to an isolated worker, receives only seed + transforms, then applies
  those transforms to original typed pieces/annotations and rechecks overlap,
  boundaries, clearance, grain/fold/nap, quantities, and determinism itself.
- **Admission gate:** define the fabric-constraint model first; benchmark all seven
  recipes and graded markers; prove cancellation/time limits/fallback; confirm
  offline Electron/WASM packaging and worker security; compare waste, latency and
  memory; preserve/replay seeds; and keep existing export hashes unless a separately
  approved optimizer output intentionally changes.
- **Why not SVGnest:** SVGnest is MIT but effectively dormant since 2019, uses a
  nondeterministic genetic algorithm and older browser/worker patterns, and contains
  unresolved no-fit-polygon/worker concerns. It is a historical algorithm reference,
  not an integration candidate.

### Other discoveries — rejected or already covered

- **FreeSewing:** MIT and a strong peer, but its architecture has already informed
  the roadmap and the public GitHub mirror moved to Codeberg in 2025. Replacing the
  completed garment grammar would be a rewrite, not acceleration.
- **Clipper2 TypeScript ports:** potentially strong polygon offset/Boolean tools,
  but no real current defect justifies replacing owned allowance geometry. Young
  ports add quantization, fill-rule, curve-flattening, and export-baseline risk.
  Reopen only with a minimal failing artifact.
- **Fashion tech-pack schemas:** useful future interchange ideas, but no user need
  or broadly adopted standard was demonstrated. InfiniDrip's geometry-derived PDF
  tech pack remains the product contract; do not reshape recipes around an early
  external schema.
- **PatternAI / seamer-studio and similar:** auth, LLM/photo, WebGPU, avatar, or 3D
  scope conflicts with the local 2D product boundary.
- **Fabric.js:** already approved in `ASSET-RESOURCES.md` for the later surface
  placement layer. This audit does not pull it into the redesign.

## Roadmap integration without disruption

### Current redesign (119B → 120 → 121)

- **119B:** unchanged—recovery and bounded Undo/Redo.
- **120:** unchanged—export flow and remaining redesign behavior.
- **121:** add an axe-core dev-only trial to the existing accessibility gate. It
  supplements manual evidence and may be removed if it produces unmaintainable
  noise or cannot run cleanly inside the existing Playwright harness.

### First post-121 quality slice

Trial fast-check on a narrow set of high-value properties. Add flatten-js only
where it supplies a genuinely independent geometry result. Acceptance requires
seeded replay, bounded CI time, no production imports, 100% coverage, unchanged
legacy hashes, and at least one demonstrated class of defect or durable invariant.
If the trial yields only duplicated assertions, remove the dependency.

### Trigger-based grammar additions

When a future garment introduces gathers, nonuniform ease, directional joining,
or incompatible structural options, extend `Interface`/`Stitch` and option metadata
with the smallest optional typed fields that serve that garment. Do not generalize
from GarmentCode ahead of a consumer. Keep current recipe output byte-identical.

### Deferred nesting redesign

After 0.5.2–0.5.4 fabric inputs/constraints have a clear model, run the isolated
Sparrow proof. It is opt-in until it beats the baseline on real markers and passes
InfiniDrip's own constraint validator. Failure/time-out always falls back to the
current deterministic layout; solver output never bypasses export validation.

## Durable reject/defer triggers

Reopen a rejected item only when its trigger is true:

| Item | Reopen trigger |
|---|---|
| VTO, deepFashion3D, cloth simulation | Maintainer explicitly reopens photo/CV or 3D scope and commercial model/data rights are proven |
| OpenPattern | Maintainer chooses GPL-compatible distribution and every drafting rule receives independent source/provenance review |
| StitchProof / Seamlint | A minimal SVG semantic defect evades current typed and parsed checks, and an adapter can catch it without changing user SVG bytes |
| PaperSeam | A real tiled-PDF page-continuity defect survives current PDF parsing/geometry tests |
| Clipper2/runtime geometry replacement | A reproducible allowance/Boolean failure plus benchmarks demonstrates that owned code is insufficient |
| Tech-pack JSON schema | A real downstream consumer/customer requires machine-readable interchange and the chosen schema has credible adoption/governance |
| Sparrow production mode | Fabric constraints, offline packaging, deterministic replay, exact post-validation, and benchmark gates all pass |

## Source links

Primary repository pages: [OpenPattern](https://github.com/fmetivier/OpenPattern),
[GarmentCode](https://github.com/maria-korosteleva/GarmentCode),
[awesome-virtual-try-on](https://github.com/minar09/awesome-virtual-try-on),
[apparel-design topic](https://github.com/topics/apparel-design?o=asc&s=forks),
[Python sewing-patterns topic](https://github.com/topics/sewing-patterns?l=python&o=desc&s=stars),
[awesome-cloth-simulation](https://github.com/ksons/awesome-cloth-simulation),
[deepFashion3D](https://github.com/GAP-LAB-CUHK-SZ/deepFashion3D),
[TypeScript sewing-patterns topic](https://github.com/topics/sewing-patterns?l=typescript),
and [awesome](https://github.com/sindresorhus/awesome).

Accepted/deferred candidates: [axe-core](https://github.com/dequelabs/axe-core),
[fast-check](https://github.com/dubzzz/fast-check),
[flatten-js](https://github.com/alexbol99/flatten-js),
[sparrow](https://github.com/JeroenGar/sparrow), and
[sparrow-studio](https://github.com/JeroenGar/sparrow-studio).
