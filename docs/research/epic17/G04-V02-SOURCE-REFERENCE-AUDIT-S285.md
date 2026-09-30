# G04 V02 source-reference audit — Slice 285

## Start record

- **Goal start:** 2026-09-30 06:05:18 UTC.
- **Scope:** source-only audit of the remaining held V02 face maps: Tee/Fitted
  sleeve contours and physical instances; Polo/Woven collar/stand face splits;
  Woven vent edges; and Trouser fly/shield and waistband assembly placement.
  Trace existing recipe/pattern/research evidence first, then primary
  construction references only where a precise view rule requires them.
- **Maintainer authorization:** on 2026-09-30 the maintainer authorized
  source-backed view metadata, including reflection for source-declared fold
  roles and face-specific landmarks/multiplicity only where source evidence
  supports them. Cut geometry must not change. Polo/Woven collar splits still
  require a specific construction reference; without it, the relevant faces
  remain held and V02 cannot pass.
- **Starting Git:** clean S284 `506d0280cbea5d6157f070b0981096dc55f27954`
  (`Slice 284: review integrated technical-flat output`) on
  `codex/epic-17-g04`. `origin` was fetched with prune; `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S284 is the
  highest assigned slice; S285 is reserved.
- **Starting board:** canonical Control Center revision 444; EPIC-17 In
  Progress, V01 Done, V02 In Progress, V03 Backlog; S284 exit evidence is
  linked. Estimated total remains 28–33 slices, subject to verified source
  findings.
- **Required context:** `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
  `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`,
  `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md`, the EPIC-17 admission,
  S284 exit, relevant seven-recipe research, and the current S277–S283 map
  contracts/implementation were reviewed before work.

## Acceptance and gates

1. Trace every held role to exact local drafted edges, marks, ordered stitches,
   quantity/on-fold metadata, and existing garment research. Distinguish
   maintained product decisions, sourced construction rules, and current
   pattern-specific choices/estimates.
2. For any external source, record the exact edition/page/section or
   reproducible official source location and the claim it supports. A generic
   convention does not prove a pattern-specific split, cut quantity, or
   internal landmark.
3. Record supported view metadata candidates and unresolved facts by recipe,
   role, face and source identity. The audit may authorize no coordinate,
   topology, cut geometry, multiplicity or geometry mutation on its own.
4. Keep unsupported Polo/Woven collar splits and any other unresolved faces
   visibly held. Do not start V03 while V02 has not passed.
5. If a precise source cannot be found, report the exact missing reference and
   the minimum maintainer-supplied evidence required; continue independent
   audits and do not infer.
6. Update `PROJECT-STATE.md`, context index, admission plan, decisions if needed,
   and the canonical board through its validated command layer. Preserve
   MQF-004–007, MQF-011/012 and MQF-015 status and every post-G17 deferral.

## Non-goals / blockers

- No implementation or cut-geometry changes in this audit; a source-supported
  implementation requires a separate unique slice and focused 100% coverage.
- No new recipe, generic drafting assumption, assembly-cycle workaround,
  fallback that hides a source hold, broad UI work, G09/D04 assembled views,
  G05 tech-pack content, physical sampling, supplier contact, launch spend,
  hosted service, or readiness/fit claim.
- V03 remains blocked on V02 acceptance and a separate rights/receiver/profile
  decision with round-trip evidence.
- No safe disjoint delegation is identified; cross-recipe source provenance
  and the exact blocker boundary remain Codex-owned. External-agent waits: 0.

## Start verification

- `origin/main` ancestry and branch cleanliness verified at start.
- Highest active slice/history checked; unique S285 reserved.
- Usage at start: primary 5% used; weekly 78% used.
- Initial board start packet/comment to be linked through the validated Control
  Center CLI; no direct board JSON edits.

## Source findings

| Recipe / role | Local source facts | Specific construction reference and supported conclusion | Disposition |
| --- | --- | --- | --- |
| Tee / Fitted `sleeve` | `src/drafting/tshirt.ts` calls the source sleeve a full symmetric piece. `src/drafting/sleeve.ts` authors `capLeft` and `capRight`; the sleeve-cap stitch pairs them to the actual front/back armhole edges, but the source piece has no named front/back cap notches or separate front/back sleeve contour. Fitted reuses the Tee sleeve unchanged. | Maelo BL-020, “How to Sew a Regular T-Shirt,” §3, identifies a centre-cap notch at the shoulder and front/back notches, and shows cap ease distributed into the armhole. It describes assembly but does not establish InfiniDrip's missing view-instance placements or exterior contour on the two orthographic faces. | Keep both faces held. A cap stitch and a symmetric cut piece do not establish two source-backed view instances or a 2D projection around a sleeve volume. |
| Polo `outerStand` / `upperCollar` | `src/drafting/polo-collar.ts` stores each seam as exact `[back, front]` edge segments and exact center-back, shoulder and center-front landmarks by arc length. `src/drafting/polo.ts` names the stand's back/front seam edges and collar-base segments; the collar and stand are source-declared on fold. The visible collar `outer` is one cubic from front tip to center back and has no shoulder-correspondence landmark. | Jalie 3137's official pattern instructions list two collar pieces and two stand pieces and document their layer/neckline assembly (pp. 1–2). Maelo BL-018 is a specific polo construction guide: it describes the two collar layers, stand sandwich, matching notches and neckline attachment. Threads, “Draft a Two-Piece Collar with a Stand,” names center-back, shoulder and center-front pattern notches. These establish the construction and shoulder split on the joined seams, but none supplies the missing point on InfiniDrip's particular cubic outer leaf edge. | The split of named stand and collar-base seams is source-supported. Keep the Polo exterior contour held until a specific point/relationship for the shoulder on the cubic outer edge is established. Do not proportionally interpolate it from the base seam. |
| Woven shirt `outerStand` / `upperCollar` | `src/drafting/shirt.ts` declares each stand/collar half on the center-back fold. Its base seams span the sum of the front neckline and back/yoke neckline; the block retains those exact curves and a shoulder endpoint shared with the source shoulder join. The authored straight collar/stand base edge runs from local x=0 to that measured total. | Thread Theory's Fairfield collar construction reference aligns stand notches at center back and shoulder seams, and fits the collar between its matching notches. The maintained Woven research already names Fairfield and Closet Core as collar/stand references. The exact view-only shoulder station is the accumulated back/yoke neckline source length from CB; the existing local-x line supplies that exact boundary on the authored linear base/outer edges. | Source-supported candidate for a view-only interface-boundary split, evaluated from the current Block/revision and cut-on-fold axis. Add no source pattern mark or cut-coordinate change. A production Chromium pass and manual review must still reject incoherent output. |
| Woven shirt `front.vent` / `back.vent` | `curvedHemAndVent` creates named vent edges from the live side-vent depth and a `ventTop` mark. At the supported 0 cm endpoint the edge is intentionally degenerate because the vent is closed; the adjacent side/hem construction remains the source. | The Woven research record maps an unsewn side segment with a stop/finished edges to the reviewed vent construction reference, while explicitly distinguishing that source's deeper hem from InfiniDrip's chosen curve. The recipe option help says 0 cm closes the vent. | A zero-depth vent has no visible edge and should be represented as a source-backed omitted/closed option state in view metadata, not emitted as a zero-length line. Nonzero depth remains bound to its source endpoints/mark. Implement separately and verify all declared endpoints. |
| Trouser front/back assembly | `src/drafting/trouser.ts` has four distinct mirrored leg roles and named center/fly/waist interfaces. The waist stitch orders four leg-waist edges around the full closed waistband; fly and band joins are separate stitches. The maintained research explicitly fixes four physical leg pieces, one full waistband and the simple fly shield as V1 decisions. | `docs/research/garments/TROUSER-RESEARCH.md` records the exact current source contract and distinguishes it from universal trouser construction. It gives enough role/cut and join identity to define face-specific leg membership, but not an already validated flat placement that avoids the current cycle conflicts. | Candidate for a separate view-only face-specific assembly implementation using the exact center seams and front fly interfaces. Keep current fly/waist cycles visibly held until that implementation proves unique same-revision placement and rendered output. |

## External references checked (2026-09-30)

- Jalie, [3137 — Men's Polo Shirts: official sewing instructions](https://d2culxnxbccemt.cloudfront.net/sew/content/uploads/2016/08/29134157/Pattern-Instructions-PDF8.pdf), pp. 1–2: collar/stand piece counts and layered assembly. The PDF is a construction reference, not an InfiniDrip pattern or CAD-license grant.
- Maelo Studio, [How to Sew a Polo Shirt (BL-018)](https://maelodesign.com/blogs/Sewing_a_Polo_Shirt), sections 3–4: collar/stand construction, matching notches and set-in sleeve cap notch. It is explicitly built around Maelo's own pattern modeler.
- Threads, [Draft a Two-Piece Collar with a Stand](https://www.threadsmagazine.com/project-guides/fit-and-sew-tops/draft-a-two-piece-collar-with-a-stand), steps “Complete the collar”: center-back, shoulder and center-front notches. It supports seam landmarks for this collar type, not InfiniDrip's outer-cubic control correspondence.
- Thread Theory, [Fairfield Sew-Along: The Collar](https://threadtheoryblog.wordpress.com/2016/06/08/fairfield-sew-along-the-collar/), collar steps: align stand notches to center back and shoulder seams and place the collar between its notches. This is the Woven research's named style-specific construction reference; it does not establish physical fit for InfiniDrip's digital draft.
- Maelo Studio, [How to Sew a Regular T-Shirt (BL-020)](https://maelodesign.com/blogs/Sewing_a_Regular_T_Shirt), section 3: center-cap and front/back sleeve notches. The assembly convention does not settle view instances or surface projection for InfiniDrip.

## Exit record

- **Source decision:** two recipe-specific construction references now support a source-derived Woven collar/stand shoulder boundary; the Polo stand and collar-base have authored shoulder segments, but the Polo cubic outer collar edge remains missing an exact shoulder-correspondence source. Keep that edge and role visible as a hold. No coordinates, cuts, source marks, quantities or export behavior changed in S285.
- **Other blockers:** Tee/Fitted sleeves lack a source-backed exterior view instance/contour rule. Woven zero-depth vent can be conditionally omitted as closed, with any change separately verified. Trouser role names and join identities support a bounded face-specific placement attempt, but current fly/waist cycles remain held until actual rendered evidence validates the transform.
- **V02 / V03:** V02 remains unmet; no V03 work begins. MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed`; MQF-015 stays assigned to V03. Findings do not add scope and post-G17 deferrals remain unchanged.
- **Next action:** Slice 286 implements only the source-supported Woven collar shoulder split and zero-depth vent omission as same-revision view metadata. Focused changed-module 100% coverage, relevant option/topology fixtures, existing protected export identities, build and the production Chromium matrix/output review are required. Polo, Tee/Fitted and Trouser holds remain explicit.
- **Focused verification:** `npm run control-center:test` passed 33/33. Two initial runs exposed stale S284-only board assertions after validated S285 changes: first the estimate/comment, then the latest V02 exit comment. Preserved and diagnosed both failures; updated the assertions to require the current 37–42 estimate, S285 V02 exit evidence and exit comment. Final run passed 33/33. `git diff --check` passed. No production source or tests outside the board test changed; full production coverage is not applicable to this research-only slice.
- **Board exit:** validated command layer linked verified `E-G04-S285-EXIT` to G04-V02 and EPIC-17 at revisions 448–449 and recorded the exit comment at 450. Updated the conditional estimate through `editEpic` at 451 and synced the summary card through `editItem` at 452. Final board revision 452; EPIC-17 In Progress, V01 Done, V02 In Progress, V03 Backlog.
- **Elapsed time:** start 06:05:18 UTC; exit 06:30:56 UTC; total 25m38s. Source/research review ~13m; focused Control Center verification and diagnosis ~4m; durable and validated-board closeout ~8m; external-agent waits 0m; maintainer-decision time 0m.
- **Landed slice:** one commit with subject `Slice 285: audit source-backed flat landmarks`; see repository history for its commit ID.
