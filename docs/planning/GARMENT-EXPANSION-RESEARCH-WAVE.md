# Garment Expansion Research Wave

Status: **ACTIVE - RESEARCH ONLY**

Owner: **Codex**. Claude Code CLI may contribute the isolated jogger and
sweatshirt/pullover-hoodie research records under this packet. Codex owns all
scope decisions, cross-family architecture, contributor review, corrections,
durable-context integration, commits to the integration branch, and any push to
`origin/main`.

## Outcome

Resolve the next useful garment families before any implementation begins:

1. casual shorts;
2. joggers;
3. cut-and-sew crewneck sweatshirt and pullover hoodie;
4. jeans as a denim derivative of the shipped straight-leg trouser.

The wave must distinguish reusable shipped engine behavior from garment-specific
construction, reject false reuse, record actionable invalid-combination rules,
and leave implementation-sized future epics without implying physical fit or
production readiness. It advances Polo V2's implementation slice numbers but
does not change Epic 11 scope or its Epic 7 start gate.

## Why this order

- Casual shorts are the smallest lower-body derivative and expose whether the
  current trouser block can truthfully support short inseams, hem openings and
  pocket/hem clearance without a new foundation.
- Joggers reuse the lower-body foundation but add knit stretch/recovery,
  elastic/drawcord waist and cuff/opening contracts that shorts do not solve.
- A crewneck sweatshirt establishes a stable cut-and-sew knit body, rib-band
  and sleeve-cuff contract before a pullover hood and kangaroo pocket are added.
- Jeans reuse the trouser block only after fly, yoke, pocket, waistband,
  topstitch and denim shrinkage boundaries are explicitly separated from the
  base trouser.
- Zip-up hoodies/lightweight zip jackets, woven chore jackets/overshirts and
  tailored jackets remain later families. A true knitted sweater is also later:
  yarn gauge, stitch counts and fully-fashioned shaping are a different engine
  domain from cut-and-sew fabric patterns.

## Shared family dependency contract

Research must classify every proposed capability as one of:

- **reuse unchanged** - the shipped behavior is construction-correct for the
  new garment, not merely convenient;
- **parameterized derivative** - the existing block remains authoritative but
  receives named garment-owned options and guidance;
- **new component contract** - a new piece/interface is required but can use
  the existing composed `Block`/stitch/check/export pipeline;
- **new engine input** - the feature would require material, hardware or other
  state not currently supplied to drafting; this is a stop/defer signal unless
  a future epic explicitly authorizes the architectural change;
- **physical unknown** - digital geometry can be checked, but wear, recovery,
  shrinkage, bulk, roll or production behavior cannot be claimed without a
  recorded sample.

Every packet must audit measurements/options, pieces and quantities, seam and
fold interfaces, allowances/finishes, grading behavior, material/notion inputs,
rendering, guidance, persistence, nesting/surface interactions and all export
formats. Numeric/geometric rules require two independent sources where
available. A single commercial pattern may establish a feature inventory but
not a universal drafting formula.

## Slice plan and ownership

### Slice 149 - Family contract, delegation and Polo renumbering

Scope: record this research wave, its common evidence standard, disjoint file
ownership, stop conditions and the unchanged Epic 11 scope renumbered to
Slices 155-161.

Acceptance:

- the four garment packets and dependency order are explicit;
- contributor file boundaries do not overlap;
- implementation remains unauthorized;
- Epic 7, Epic 8 and Polo V2 code boundaries remain unchanged.

Non-goals: garment-specific conclusions, production code, tests, baselines or
physical validation.

Owner/model: Codex, rigorous review.

### Slice 150 - Casual shorts research

Output: `docs/research/garments/CASUAL-SHORTS-RESEARCH.md`.

Owner: Codex. Determine which trouser options/interfaces can remain unchanged;
resolve short-inseam limits, hem-opening and rise relationships, pocket/hem and
fly/hem collisions, waistband/closure scope, grading risks, views/outputs and
the smallest honest first implementation variant.

### Slice 151 - Jogger research

Output: `docs/research/garments/JOGGERS-RESEARCH.md`.

Contributor: Claude Code CLI in an isolated worktree. Codex reviews and owns
every adopted decision. Resolve knit/woven boundary, stretch/recovery inputs,
elastic and drawcord treatment, waist and cuff/opening geometry, pocket scope,
grading, guidance and whether the current material contract is sufficient.

### Slice 152 - Sweatshirt and pullover-hoodie research

Output: `docs/research/garments/SWEATSHIRT-HOODIE-RESEARCH.md`.

Contributor: Claude Code CLI in the same isolated documentation track, with no
shared-context edits. Codex reviews and owns every adopted decision. Establish
crewneck sweatshirt first, then pullover hood and kangaroo-pocket additions;
resolve rib negative-ease/material dependency, hood-to-neckline seam truth,
hood overlap/opening, cuff/hem bands, pocket containment and grading.

### Slice 153 - Jeans research

Output: `docs/research/garments/JEANS-RESEARCH.md`.

Owner: Codex. Treat jeans as a trouser derivative only where evidence supports
it. Resolve contoured/straight waistband choice, fly/guard, front pockets and
coin pocket, back yoke and pockets, inseam/outseam ownership, topstitch metadata,
denim shrinkage/material limits, grading, construction order and outputs.

### Slice 154 - Cross-family synthesis and durable roadmap

Scope: independently review every packet, reconcile shared material/component
decisions, rank future epics, estimate slice bands, identify prerequisites and
update all durable project context.

Acceptance:

- each garment has an evidence-backed include/defer/reject verdict;
- no packet silently invents material data or physical proof;
- future epics have bounded outcomes, dependencies, risk and non-goals;
- Epic 11 remains the next implementation-ready geometry epic after its start
  gate unless the research reveals a documented higher-priority blocker;
- `PROJECT-STATE.md`, `ARCHITECTURE.md`, `CONTEXT-INDEX.md`,
  `docs/PROJECT-DECISIONS.md`, `docs/planning/ROADMAP.md`, `AGENTS.md` and the
  Epic 11 packet agree.

Non-goals: application implementation, physical validation, changing export
baselines, or starting any researched garment epic.

## Claude handoff boundary

Claude may modify only:

- `docs/research/garments/JOGGERS-RESEARCH.md`;
- `docs/research/garments/SWEATSHIRT-HOODIE-RESEARCH.md`.

Claude must read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
`docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`, this packet,
`docs/research/garments/TEMPLATE.md`, the existing trouser/tee/tank/Polo/woven
research records, and relevant current code/tests without editing them. It must
cite exact sources and access dates, label estimates/product decisions, test
source conflicts, and report uncertainty. It must not edit governance,
architecture, roadmap, state, code, dependencies, tests, baselines, or another
garment packet; must not commit, push or merge; and must not claim physical fit.

Required return: status, summary, branch/worktree, changed files, sources
consulted, important conflicts, adopted/deferred/rejected findings, checks run,
known limitations and follow-up needed. Codex treats this report as a claim to
verify, not proof.

## Research pressure matrix

Each garment packet must explicitly test at least:

- XS and XL plus the default size;
- minimum and maximum body lengths relevant to the garment;
- smallest and largest openings and adjacent component collisions;
- stretch/recovery absent, low and high where material behavior matters;
- zero-length optional features and boundary-adjacent optional features;
- front/back and left/right piece quantities, fold/mirror semantics and grain;
- seam-walk truth on curved interfaces rather than endpoint spans;
- allowance joins, concave/convex corners and zero-length edges;
- pre-feature save defaults, raw invalid values and actionable recovery;
- narrow/wide fabric, directional assumptions and optional fabric-on-hand;
- empty/populated surface placements;
- Pattern, assembled, Body, Size run, Spec, Nesting and Check views;
- SVG, DXF, tiled PDF, A0, projector and tech-pack outputs.

This is a research matrix, not a claim that these outputs already exist for the
new garments.

## Permanent stop conditions

Stop and return to Codex if research would require a new draft-time material or
hardware input, a changed shared geometry source of truth, a save-format change,
an export-baseline move, a change to Epic 7 behavior, or a physical-production
claim. Record the requirement and the smallest future decision that could
unblock it; do not paper over it with a fixed constant.

