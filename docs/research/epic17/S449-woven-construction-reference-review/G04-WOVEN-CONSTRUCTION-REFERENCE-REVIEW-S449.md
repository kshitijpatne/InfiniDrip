# G04 Woven source-design study: construction-reference review — Slice 449

## Start boundary

- Started 2026-10-08 00:03 UTC from clean S448 `f2c9906c05faff13063ece74d4f9aa1913dab1fa` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S448 is the highest assigned slice; S449 is unique.
- Canonical Control Center board revision 2699: EPIC-17 and G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held over 73 options / 146 faces. `get_goal` reports the admitted EPIC-17 objective active.
- Usage at start: primary 0% / weekly 22%; ordinary work allowed.

## Authority and scope

The maintainer authorized a **proposal-only Woven source-design study** and asked Codex to locate reliable construction references with useful technical drawings for the remaining Woven V02 blockers. This slice searches and qualifies references against the exact two current blocker classes. It may inspect source and existing evidence, but may not alter production source, pattern geometry, stitch graph, projection/view mapping, face holds, V02 acceptance, the fixed S370 band positions, or the V03 gate. No candidate is promoted or implemented here.

## Current exact questions the drawings would need to answer

The source/output baseline is `live-draft:woven-shirt:14:14` and the current evidence remains S417/S437/S441/S443/S447/S448.

1. **Front collar/neckline, 28 options:** the approved S359 collar projection runs from signed offset `-standHeight` to `collarLeafDepth - standHeight`; the continuous body neckline is retained. Because `collarLeafDepth - standHeight >= 0.5 cm` throughout the supported matrix, the projected contour crosses the body neckline twice in each front. A useful construction drawing must establish whether the visible body neckline is exposed, covered, or interrupted by the sewn stand/collar stack and identify the actual collar/stand faces and seam order. A generic collar drafting rule alone cannot establish this custom block's visible-line convention.
2. **Back sleeve pair, 28 options:** source has one complete symmetric sleeve role; both cap halves join the front/yoke/back armhole chain and its complete hem joins `sleeveBand.top`. Source does not encode sleeve handedness or an over/under relation between the two mirrored view instances. A useful drawing must establish the sleeve's front/back orientation and how a true back technical view represents both sleeve outlines and their attached bands without crossing or misleading gaps. Any remedy must retain the maintainer's fixed S370 band-detail positions unless a new decision is explicitly approved.

## Reference search and qualification (accessed 2026-10-08)

### Best single licensed reference to inspect next

- Myoungok Kim and Injoo Kim, *Patternmaking for Menswear: Classic to Contemporary*, 2nd ed. (Bloomsbury/Fairchild Books, 2025), ISBN 9798765106167. The publisher and Google Books describe hundreds of illustrated patternmaking steps for woven garments and finished drafts; the contents identify chapters on necklines/collars, sleeves/cuffs, plackets/pockets, and woven shirts. Target those chapters and the finished shirt patterns. [Bloomsbury title and chapter list](https://www.bloomsbury.com/in/patternmaking-for-menswear-9798765106167/) · [Google Books bibliographic record](https://books.google.com/books?id=vE-fEQAAQBAJ).
- **What it can establish if the actual figures are inspected:** a defensible menswear drafting baseline, component geometry, seam interfaces, sleeve-cap orientation/notches, and collar/placket construction examples from one coherent source.
- **What current online evidence cannot establish:** the actual drawings in the book are not exposed in the checked Google Books record; the publisher offers paid text access. Its general shirt patterns cannot by themselves determine what the InfiniDrip source author intended for this distinct revision, nor prove a selected technical-flat overlap order. This search does not authorize purchasing/access charges.

### Immediately accessible industry technical drawings

- M. Müller & Sohn, Alexander Sextl, “Pattern Construction for Shirts” (2022). This official industry publisher page shows a technical shirt drawing and draft figures for front/back pattern, sleeve, and collar. Its worked design is explicitly a loose-fitting **raglan** shirt with placket, cuffed sleeve, and shirt collar/stand; it documents armhole-notch transitions, the cuff/slit/pleats, and measuring/checking collar length against the neckline. [Article and figures](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-shirts/).
- **Use:** reference for how a professional draft names and transitions actual cut edges and compares collar/neckline lengths. The sleeve example is raglan, so it is not direct proof for this source's set-in two-cap sleeve. It does not specify the Woven block's collar projection or the correct line visibility where the approved projection contacts the continuous neckline.
- M. Müller & Sohn, “Pattern Construction for Collar with Stand” (2022) gives construction diagrams and steps for a separated collar stand/collar. It instructs measuring a lowered neckline, drafting the stand/collar and checking seam transitions; it notes material-dependent roll width for the upper collar. [Article and figures](https://www.muellerundsohn.com/en/allgemein/pattern-construction-for-collar-with-stand/).
- **Use:** supports treating neckline/stand, stand/collar, and collar exterior as distinct construction relationships and checking lengths/roll. It does not establish this block's sewn outer-face visibility or authorize clipping the approved complete base-seam stroke.
- M. Müller & Sohn, *Pattern Making for Men: Shirts* e-dossier advertises four full shirt construction drafts, including a sleeve/cuff, shirt collar with stand, and a separate overlapping-yoke design. [Publisher contents/access](https://www.muellerundsohn.com/en/shop/pattern-making-for-men-shirts/).
- **Access boundary:** purchase is required to inspect the complete figures. The sales description identifies potentially relevant models but is not itself evidence of their geometry. Do not purchase without separate authorization.

### Academic sleeve-construction reference

- Cornell University, *Draping the Human Form — Shirt Sleeve*, steps 1–20. The public university page includes linked step and back-view images and states that its flat-cap sleeve is appropriate for casual shirts with large, open armscyes. [Cornell lesson](https://fit.cit.cornell.edu/textiles/draping/drapes/shirtsleev/steps/default.html).
- **Use:** an academic, shirt-specific source for how a sleeve cap relates to an armscye and how a casual shirt sleeve is set. The page's 3D draping sequence does not define the exact 2D technical-flat pose, mirrored instance order, sleeve-band side-gutter placement, or a valid way around the S370 footprint. It cannot clear the 28 output crossings on its own.

### Academic pattern drawing and official training material screened, not accepted as a fix

- Hong Kong Polytechnic University thesis, §3.5.2, Fig. 3.41, “Men's Shirt Pattern.” Search-indexed text describes front, back, yoke and sleeve pattern panels and a parameterized technical drawing. [Institutional thesis PDF](https://theses.lib.polyu.edu.hk/bitstream/200/4256/1/b18181028.pdf).
- **Use/limit:** a traceable university thesis figure for shirt-piece geometry/parameterization. It does not include the exact collar stack and its displayed visibility, nor establish a view-only sleeve arrangement for this source. The 14.7 MB PDF could not be opened by the browser fetcher; claims are limited to the indexed abstract/figure text, not a visual inspection.
- India's Bharat Skills / CITS dressmaking practical textbooks surfaced shirt drafting figures for body/yoke/sleeve, collar/plackets, and a marker layout listing cut quantities. [CITS Fashion Design & Technology practical textbook](https://www.bharatskills.gov.in/pdf/E_Books/CITS/433/English/Fashion%20Design%20Technology%20%28Trade%20Practical%29.pdf) · [Dress Making, Vol. I practical](https://bharatskills.gov.in/pdf/E_Books/Dress_Making_Volume_I_of_II_Practical.pdf).
- **Use/limit:** government vocational-training source suitable for common piece inventory and drafting terminology. Both files exceed this browser's fetch limit; this slice did not inspect the drawings. Search-indexed pattern-layout text is insufficient to infer collar layer order or solve the current source-specific intersections.

### Targeted search conclusion

The search found reliable **general construction drawings** and the exact categories of professionally illustrated references needed for a source-design comparison. It found no external drawing tied to `live-draft:woven-shirt:14:14`, and none of the accessible figures proves the custom missing semantics. This distinction matters: a reference can justify a candidate redraw or revised flat convention; only exact source/option and rendered checks can show that candidate is coherent here. Do not call a general convention “source evidence” or a verified fix.

## Study disposition and next action

- No production code, source pattern, renderer, view metadata, tests, acceptance criteria, holds, board status, export baseline, or receiver/profile changed in the research itself.
- Keep all 28 Woven fronts and 28 Woven backs held; Polo remains held under all-seven V02. Preserve the current 56 accepted / 90 held tally, S370 positions, full continuous neckline, 0.25 cm rule, V02-before-V03, legacy DXF, protected output identities, and V03 rights/round-trip gate.
- The strategically strongest next reference is Kim & Kim (2025), Chapters 3–8, if accessible through existing licensed/library access. Work from the exact source-owned draft and those illustrated conventions to generate bounded **in-memory** collar and sleeve source-design proposals; record which construction facts are direct, which are reference-backed and which remain a maintainer design choice. The accessible M. Müller/Cornell drawings are a qualified secondary cross-check. Do not widen to another generic web search.
- The next study output must give exact source-piece/edge changes, expected seam and POM impacts, all-option bounds, and actual rendered candidate comparisons. Production edits and any proposal depending on a new semantic/product decision remain outside the authorization until separately approved.
- No purchase, supplier contact, physical sample, fit/factory claim, broad UI work, new recipe, G05/G09 work, or V03 implementation.

## Slice exit evidence

- The targeted research produced accessible M. Müller & Sohn collar and shirt-drafting drawings, an academic Cornell shirt-sleeve draping sequence, publisher-verified contents for the 2025 Kim & Kim menswear text, and university/government pattern-drawing leads. The source-by-source support and access limits are recorded above.
- No public, accessible reference located here is a pattern-specific construction sheet for `live-draft:woven-shirt:14:14`. No external drawing independently settles the current collar visible-layer relation or the back sleeve placement under fixed S370 detail positions. The references are suitable design inputs, not a verified fix.
- No production source, renderer, test, source geometry, stitch graph, view map, option, acceptance, face status, export identity, or CAD claim changed. All 28 Woven fronts and backs remain held; the integrated tally remains 56 accepted / 90 held. V02 stays In Progress, V03 stays Backlog, and all-seven V02 / V02-before-V03 remain unchanged.
- Validated board start commands advanced revision 2699→2701. Exit commands advanced 2701→2706; the Control Center regression then found the Epic summary no longer included the required admission-packet link. The initial failure is preserved in `initial-control-center-test.log`. Diagnosis was limited to the summary-description string contract; an additive validated repair preserved the historical link and advanced revision 2706→2707. No status, acceptance, or hold changed.
- Focused verification: packet and command JSON parse; all S449 JavaScript scripts pass `node --check`; clone preflight/replay preserves status and tally; canonical board read/schema validation passes; final `npm run control-center:test` passes 42/42; `git diff --check` passes. No production tests, build, global coverage, or export replay were due for this research/documentation-only slice.
- No independent delegated task was safe; external-agent waits 0m. Elapsed 2026-10-08 00:03:15–00:08:51 UTC (5m36s): source/research review ~2m30s; packet/state/context/board work ~2m10s; focused verification, failure diagnosis and board replay ~56s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** reserve S450 for an exact-source, in-memory Woven collar and sleeve/back-view candidate study, using the qualified drawings as bounded construction references. Compare candidate seam lengths/topology, POMs, fixed S370 footprint, all 28 option renders and actual output readability. Return exact proposals for approval; do not implement or release faces based on this research packet.
