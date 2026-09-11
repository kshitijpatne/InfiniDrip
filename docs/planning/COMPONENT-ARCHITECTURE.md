# InfiniDrip — Component Architecture Design

_Slice 48. **A design document, not code.** Per MVP-PLAN.md Months 2–3, this is
reviewed and agreed BEFORE any implementation — architectural forks get flagged
before building, not discovered mid-slice._

**Status: AGREED.** §11's four questions are answered below. Ready for Phase A
(Slice 49+).

---

## 1. Why this document exists

MVP-PLAN.md puts component architecture in Months 2–3 and calls it "the
multiplier — the single most likely way this project fails is skipping or
rushing it." ROADMAP.md §1.2 gives the evidence: FreeSewing, our closest
architectural peer, shipped a "Library" refactor in 2026 precisely because
part re-use across designs had created ad-hoc dependencies that made the
software really hard to maintain, with every change to a foundational block
rippling into dependents.

The estimate that follows from it: **79–127 slices of garment library** in
Priority 2. Every one of those is cheaper or more expensive depending on what
this document decides. That is the whole reason it's worth writing carefully
before writing code.

---

## 2. What we have today — an honest inventory

Read from the code at `e13e37f`, not from memory.

### 2.1 The primitives that already work

| Type | Shape | Verdict |
|---|---|---|
| `Edge` | `{kind:"line"\|"curve", name, ...}` — a **named** oriented segment | Good. Keep unchanged. |
| `Piece` | `{name, onFold, edges[], dart?}` — a closed loop of named edges | Good. This is already a Panel. |
| `Block` | `{roles: Record<string, Piece>}` — pieces by structural role | Good, but incomplete (see 2.3). |
| `GarmentRecipe` | draft fn + notches + poms + grade + sizes + checks + guidance + styles + techPack + allowances | Works; is where duplication accumulates. |

The `Edge.name` decision — made in Slice 2, before any of this was
contemplated — is what makes everything below possible. Every edge is already
addressable by name (`"armhole"`, `"shoulder"`, `"sideUpper"`). Without that,
this refactor would be a rewrite. With it, it's additive.

Likewise the **role vs. name** split in `block.ts` (the slot a piece fills vs.
its printed label) is already correct and needs no change.

### 2.2 Real, measured duplication

`draftFront` and `draftBack` in `tshirt.ts` are ~90% identical. Both compute
the same `hps`, `shoulder`, `underarm`, `sideHem`. Both emit the same
`shoulder`, `armhole`, `side`, `hem` edges with the *same control points*.

They differ in exactly three things:
1. neck depth (`frontNeckDepth` vs `backNeckDepth`)
2. the neckline curve's first control point
3. the centre edge's name (`centerFront` vs `centerBack`)

`fitted.ts` then imports `draftBack` and `draftSleeve` wholesale and swaps one
panel — which is the right instinct, and is evidence the seam is already
roughly in the right place; it just isn't formalised.

Meanwhile `skirt.ts` already does the correct thing: one `panel(m, name)`
function producing both front and back. **The tee is the outlier, not the
skirt.**

### 2.3 The missing concept: Interface

`Block` records *what pieces exist*. It records **nothing about how they
connect**. That knowledge exists, but only as hand-written assertions inside
`tshirt-checks.ts` and `skirt.ts`:

```ts
matchLengths("Shoulder seam (front ↔ back)",
  edgeLength(pieceEdge(rolePiece(b, "front"), "shoulder")),
  edgeLength(pieceEdge(rolePiece(b, "back"), "shoulder")))
```

That is a **stitch, written as a test**. The pattern's construction knowledge
is encoded in its verification, which is backwards: it means every new garment
hand-writes its seam relationships from scratch, and nothing else in the system
(notches, allowances, construction order) can see them.

This is the single most important gap this document addresses.

### 2.4 A latent coupling, with evidence

```ts
// tshirt.ts
export function armholeLength(m: Measurements): number {
  return edgeLength(pieceEdge(draftFront(m), "armhole")) +
         edgeLength(pieceEdge(draftBack(m), "armhole"));
}
// draftSleeve: const capHeight = solveCapHeight(width, armholeLength(m) + CAP_EASE);
```

`draftSleeve` fits its cap to a **re-drafted tee bodice**, not to the bodice
actually present in the block being assembled.

Measured at `STANDARD_M`: tee armhole 41.691 / cap 43.191 / ease 1.500, and
fitted armhole 41.691 / cap 43.191 / ease 1.500. **Identical — so there is no
bug today.** It is correct only because `fitted`'s front reuses the same
shoulder and underarm points and the same armhole curve.

The fragility is real and structural: any future bodice whose armhole differs —
raglan, dropped shoulder, altered slope, a shirt block — gets a sleeve fitted to
a number from a different garment, silently. Components fix this by passing the
*actual assembled armhole* into the sleeve rather than re-deriving a hypothetical
one.

### 2.5 The neckline gap (from the Slice 47 review)

```ts
const neckWidthHalf = m.chest / 20 + 2;
// frontNeckDepth: neckWidthHalf + 1
// backNeckDepth: 2.5   ← a bare constant; does not scale with anything
```

Deriving neck width from chest is a defensible drafting simplification. The flaw
is that there is **no independent degree of freedom**: two people with the same
chest get the same neckline, and the only way to change it is to change chest,
which moves the armhole and side seam too. Competitors expose neckline
style/depth as a standard axis.

`backNeckDepth: 2.5` additionally doesn't scale at all — an XS and an XXL get
the same back neck drop.

**This is why the collar fix belongs here rather than as a standalone
`neckEase` measurement.** A raw input on `Measurements` would be a global bag
with no natural guardrail; a component parameter is scoped, defaulted, and
validated by the component that owns it — which is exactly FreeSewing's own
conclusion (options scoped to a part, not the whole pattern).

---

## 3. Reference architecture

**GarmentCode** (ETH Zurich, SIGGRAPH Asia 2023) is the strongest available
reference. Its four base types:

- **Edge** — an oriented curve segment (line, arc, quadratic/cubic Bézier).
- **Panel** — a leaf component: a closed loop of directed edges, plus placement.
- **Component** — an abstract assembly holding subcomponents, **stitches** (rules
  describing how subcomponents connect), and **interfaces** (objects describing
  how other components may connect to this one).
- **Interface** — a named selection of edges through which components join.

Its shipped component library: bodices (fitted or loose), skirts (flare, godet,
pencil, gather, compound), pants, sleeves with optional cuffs, and collar shapes.
That list is close enough to our Priority 2 target to be a genuine validation
rather than a coincidence.

Two of its details are worth adopting directly:
- A panel **may contain stitches between its own edges** — e.g. a dart. That
  neatly classifies our `dartLegCheck` as an intra-panel stitch rather than a
  special case.
- Assembly works by **projecting one component's interface onto another** — the
  formal version of the sleeve/armhole fix in §2.4.

**We adopt the vocabulary and the decomposition. We do not adopt their stack.**
PyGarment is Python and carries mesh generation, cloth simulation (NVIDIA Warp /
Qualoth) and a 3D pipeline. 3D drape is explicitly cut from v1 (ROADMAP §Cut).

---

## 4. Proposed architecture

### 4.1 What does NOT change

`Edge`, `Piece`, `Point`, the geometry layer, all export writers, grading, POM,
nesting, the editor, the UI. `GarmentRecipe` keeps its public shape, including
`draft: (m) => Block`. **The engine/recipe seam stays exactly where it is.**

This is a refactor *behind* the recipe contract, not a redefinition of it.

### 4.2 New: `EdgeRef`, `Interface`, `Stitch` (naming decided, §11 Q3: `Piece` stays; these three are additive)

```ts
/** One named edge on one piece (by role). */
interface EdgeRef { readonly piece: string; readonly edge: string }

/** An ordered set of edges that acts as one connectable seam.
 *  Multi-edge on purpose: a darted front's side seam is two edges; a
 *  sleeve cap is capLeft + capRight; an armhole spans front AND back. */
interface Interface { readonly edges: readonly EdgeRef[] }

/** Two interfaces sewn together.
 *  `ease` is len(a) − len(b); omitted means they must match exactly. */
interface Stitch {
  readonly label: string;
  readonly a: Interface;
  readonly b: Interface;
  readonly ease?: { readonly lo: number; readonly hi: number };
}
```

`Block` gains `readonly stitches: readonly Stitch[]`.

### 4.3 The payoff: sewability checks become derived, not written

```ts
const interfaceLength = (b: Block, i: Interface): number =>
  i.edges.reduce((s, r) => s + edgeLength(pieceEdge(rolePiece(b, r.piece), r.edge)), 0);

function stitchChecks(b: Block): CheckResult[] {
  return b.stitches.map((s) => {
    const la = interfaceLength(b, s.a);
    const lb = interfaceLength(b, s.b);
    return s.ease
      ? inBand(s.label, la - lb, s.ease.lo, s.ease.hi)
      : matchLengths(s.label, la, lb);
  });
}
```

**Claim, to be proved byte-identically in Phase A: 6 of our 8 current
sewability checks are exactly this function over declared data.**

| Current check | As a Stitch |
|---|---|
| Shoulder seam (front ↔ back) | `a=[front.shoulder]`, `b=[back.shoulder]` |
| Side seam (front ↔ back) | `a=frontSideEdges`, `b=[back.side]` — multi-edge covers the darted case |
| Sleeve underarm (left ↔ right) | `a=[sleeve.sideLeft]`, `b=[sleeve.sideRight]` — intra-piece |
| Sleeve-cap ease | `a=[sleeve.capLeft, sleeve.capRight]`, `b=[front.armhole, back.armhole]`, `ease={-1,4}` |
| Dart legs equal | `a=[front.bustDartUpper]`, `b=[front.bustDartLower]` — intra-panel |
| Skirt side seam | `a=[front.sideUpper, front.sideLower]`, `b=[back.sideUpper, back.sideLower]` |

The remaining two — "Hem square to the fold", "Waist square to the fold" — are
**not stitches**. They're geometric properties of a single panel. They stay
recipe-owned (later, panel-owned). Being explicit about that boundary is the
point: not everything is a stitch, and pretending otherwise would be the
over-abstraction failure mode.

### 4.4 Why stitches are worth more than checks

Declared stitches are readable by the whole system, not just the checker:

- **Notches.** `tshirt-notches.ts` is a hand-written table. Matched notches
  exist *because* two edges are sewn together — derivable from a stitch.
- **Seam allowance.** `AllowanceSpec.byEdge` keys by edge *name* globally; two
  stitched edges could silently carry different allowances. A stitch makes that
  checkable.
- **Construction order.** `techPack.construction` is hand-written prose today.
  A stitch graph is the raw material for generating it (later — not v1).

### 4.5 New: `Component`

```ts
interface ComponentResult {
  readonly pieces: Readonly<Record<string, Piece>>;   // role -> piece
  readonly stitches: readonly Stitch[];               // internal to this component
  readonly interfaces: Readonly<Record<string, Interface>>; // exposed for connection
}
type Component<P> = (m: Measurements, params: P) => ComponentResult;
```

A recipe's `draft` becomes: call components in dependency order, wire their
exposed interfaces together with stitches, merge into a `Block`.

**Dependency order is a real constraint, not a detail.** The sleeve needs the
assembled bodice's armhole length (§2.4). Assembly is an ordered pipeline where
later components may read earlier components' interfaces. Any design that
assumes components are independent and order-free is wrong for garments.

---

## 5. Component taxonomy for MVP scope

Scoped to MVP-PLAN.md §3.1's garment list. Nothing speculative.

| Component | Params (sketch) | Consumers |
|---|---|---|
| **Bodice** | `fit: loose\|fitted`, `dart?`, length | tee, fitted, tank, polo, shirt, blouse |
| **Sleeve** | `length: short\|¾\|long`, `cuff?`, **`targetArmhole: number`** | tee, fitted, shirt, polo, blouse |
| **Neckline** | see §6 | every top |
| **Collar** | `style: shirt\|polo`, stand height | shirt, polo |
| **Placket** | width, button count | shirt, polo |
| **Cuff** | depth, closure | shirt |
| **Waistband** | depth, closure | skirt, trouser |
| **SkirtPanel** | `silhouette: straight` (flare later) | skirt |

**Rule to prevent over-abstraction: no component is extracted until it has two
real consumers.** Collar/Placket/Cuff are specified here but built in Month 4
with the woven shirt block, not speculatively in Month 2.

---

## 6. The Neckline component (fully specified)

Carrying the Slice 47 finding into a concrete design.

```ts
interface NecklineParams {
  readonly shape: "crew" | "v" | "scoop" | "boat";
  readonly widthEase: number;  // cm added per side to the derived default; 0 = today
  readonly frontDrop: number;  // cm added to the derived front depth; 0 = today
}
const NECKLINE_DEFAULT: NecklineParams = { shape: "crew", widthEase: 0, frontDrop: 0 };
```

**Scope decision (answered, §11 Q2): `shape` is typed with all four now, but
only `"crew"` and `"v"` get real curve implementations in Phase B.** `"scoop"`
and `"boat"` are declared in the type (so the taxonomy doesn't need a breaking
change later) but throw a clear "not yet implemented" error if selected —
never a silent wrong curve. They ship with the woven shirt block in Month 4,
where a v-neck's sibling shapes are naturally in scope anyway.

**Byte-identity requirement:** with `NECKLINE_DEFAULT`, the component must emit
the *exact* neckline the tee and fitted emit today — `neckWidthHalf =
chest/20 + 2`, `frontNeckDepth = neckWidthHalf + 1`, same control points. The
regression hashes prove it.

**Guardrails — warn, never clamp** (the project's standing rule):
- `neckWidthHalf + widthEase >= shoulderHalf` → warn: the neckline has eaten the
  shoulder seam.
- `frontNeckDepth + frontDrop >= armholeDepth` → warn: the front neck has dropped
  below the underarm.

**Deliberately NOT in this component:** the neckband/rib itself (a separate
piece, and a separate component when we build it) and any change to
`backNeckDepth` — **answered, §11 Q1: left as-is for MVP.** `backNeckDepth`
stays the constant `2.5` it is today. Not touched in Phase A or B.

---

## 7. Option scoping (the FreeSewing lesson, applied)

Options belong to the component that owns them, **not** to a global bag.
Concretely: `NecklineParams` is passed to the neckline component by the recipe.
It does **not** get added to `Measurements`.

`Measurements` stays what its own doc comment says it is: "the numbers a person
measures." A neckline style preference is not a body measurement, and putting it
there would repeat exactly the mistake FreeSewing had to refactor out — global
options that every part can reach into.

This is the substantive reason the Slice 47 collar question was folded here
rather than shipped as a standalone `neckEase` input.

---

## 8. Shared croquis library (ROADMAP Priority 1.3)

`render/body.ts` (upper) and `render/skirt-figure.ts` (lower) each hand-draw a
figure. Proposed: one croquis library, `{upper, lower} × {front, side, back}`,
with **components contributing their own dimension annotations** rather than each
figure hand-listing every measurement.

Two constraints:
- **Render-layer only.** Croquis must never leak into drafting. A figure is
  presentation; it has no bearing on pattern geometry.
- Slice 43 already proved the technique (a silhouette as a chain of cubic
  segments walkable in either direction, so the left side is the right side
  reversed). Reuse it; don't reinvent it.

---

## 9. Migration plan

**Strangler-fig, never big-bang.** Every phase is independently shippable and
byte-identity gated. The standing rule for the whole migration:

> **Never refactor and change behaviour in the same slice.** A refactor slice
> must produce byte-identical output. A behaviour slice must not move code.

### Phase A — Stitches as data (~5–8 slices)
- **A1** `EdgeRef`/`Interface`/`Stitch` types + `interfaceLength` + `stitchChecks`.
  No recipe changes. Prove the 6 derivable checks reproduce the existing ones
  exactly, running *alongside* them.
- **A2** Recipes declare stitches; delete the hand-written equivalents.
  `Block` gains `stitches`. Byte-identity gate on every output.
- **A3** Derive matched notches from stitches; retire that part of the hand table.

### Phase B — Components (~8–12 slices)
- **B1** `Component`/`ComponentResult` types + ordered assembly helper.
- **B2** Extract **Bodice** — collapses `draftFront`/`draftBack` duplication (§2.2).
  Byte-identical.
- **B3** Extract **Sleeve**, taking `targetArmhole` from the assembled bodice.
  **Fixes §2.4.** Byte-identical at `STANDARD_M` by construction.
- **B4** Extract **Neckline**, default-only first (byte-identical), *then* a
  separate slice adding `shape`/`widthEase`/`frontDrop` (behaviour change).
- **B5** Extract **Waistband** / hem treatment.

### Phase C — Prove the multiplier (~4–6 slices)
- **C1** Re-express the skirt via components.
- **C2** **The real test:** add a genuinely new variant — a tank (bodice + no
  sleeve + different neckline) — and it should take *hours, not a slice-run*.
  If it doesn't, Phase B is not finished.
- **C3** Croquis library.

**Total ~17–26 slices**, consistent with MVP-PLAN's 20–35 for Months 2–3.

---

## 10. Risks and non-goals

| Risk | Mitigation |
|---|---|
| Over-abstraction — components nobody needs | "Two real consumers" rule (§5) |
| Refactor silently changes geometry | Byte-identity hashes every phase; §9's standing rule |
| Dependency order gets designed away | §4.5 states it as a first-class constraint |
| Scope creep into 3D / simulation | Explicitly cut (ROADMAP); we take vocabulary only |
| Neckline change smuggled into a refactor slice | B4 is deliberately split into two slices |

**Non-goals:** 3D drape, cloth simulation, auto-generated construction order,
GarmentCode's Python stack, a general-purpose pattern CAD.

---

## 11. Decisions (answered — this section is now a record, not a question list)

1. **`backNeckDepth: 2.5` doesn't scale with anything.** **Decision: leave as-is
   for MVP.** Not fixed in Phase A, Phase B, or anywhere in this migration. If
   it's ever addressed, it's its own slice with its own justification — never
   riding along in a refactor slice, per §9's standing rule. Flagged here so a
   future reader doesn't rediscover it as if it were new.
2. **Neckline shapes in MVP scope: crew + v now; scoop + boat with the woven
   shirt block in Month 4.** The `NecklineParams.shape` type declares all four
   from the start (§6) so the taxonomy doesn't take a breaking change later,
   but only crew/v get real curve math in Phase B. Selecting scoop or boat
   before Month 4 throws a clear "not yet implemented" error — never a wrong
   curve rendered silently.
3. **Naming: keep `Piece`.** `Interface`, `Stitch`, and `Component` are added
   alongside it, not replacing it. No file touches its existing `Piece`
   usages for naming reasons alone.
4. **`Block.stitches` is optional in Phase A1, required from A2 onward.** A1
   introduces the types and proves equivalence without any recipe committing
   to them yet; A2 is the slice where every recipe declares stitches and the
   hand-written checks are deleted — so the optional/required split has an
   exact, single-slice boundary, not an indefinite transitional state.
