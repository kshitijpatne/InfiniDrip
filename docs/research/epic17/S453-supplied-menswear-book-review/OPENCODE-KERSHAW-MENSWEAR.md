# S453 supplied menswear book review — Kershaw (OpenCode)

## Scope and authority

- Research-only review of the user-supplied PDF at `F:\tank-sketches\patternbooks\Patternmaking for menswear -- Kershaw, Gareth -- ( WeLib.org ).pdf`.
- Admitted G04 context read before research: `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md` (S452 build-gate pass; S451 proposals; S450 drawing review), `docs/PROJECT-DECISIONS.md`, `docs/planning/EPIC-17-ADMISSION.md`, S451 packet `G04-WOVEN-BLOCKER-DECISION-PROPOSALS-S451.md`, S442 packet `G04-V02-V03-BLOCKER-DISPOSITION-S442.md`, S450 packet `G04-WOVEN-TECHNICAL-DRAWINGS-S450.md`.
- Questions: exact illustrated evidence for woven-shirt and polo construction; collar/stand and closure order; sleeve front/back identity and band/cuff joins; any front/back technical-flat example.
- Assess against two fixed boundaries: S451 front tradeoff (foreground-collar occlusion hiding about `0.8426–0.8433 cm` of visible neckline per side versus retaining the continuous neckline) and S442 hold (fixed S370 detached-band positions with all 28 Woven backs held).
- State what the book cannot establish about source revision `live-draft:woven-shirt:14:14`.
- Non-goals: no web search, no purchase, no code/source/view/board change, no copied figures, no extended quotations. Measurements below are short factual values from the depicted example blocks, not general rules.
- This file is the only worktree change; left uncommitted.

## Source identity

- Title/author from PDF metadata: `Patternmaking for Menswear`, Gareth Kershaw.
- PDF has 321 pages per `pdfinfo`; file size about 16,099,248 bytes.
- Contents page lists: long-sleeved collarless shirt printed p74, short-sleeved polo shirt printed pp80–87, hooded sweatshirt printed p88, casual long-sleeved shirt printed pp104–115, plus lumberjack/safari/bib shirts and later trouser/outerwear chapters.
- Mapping used here: printed page and step/figure label from the rendered footer/header, plus 1-based PDF page index. PDF index equals printed page plus one for the cited shirt chapters.

## Method

- Extracted layout text with Poppler `pdftotext` to `C:\Users\kshit\AppData\Local\Temp\opencode\kershaw-full.txt` outside the worktree for locating steps only.
- Rendered each cited page with Poppler `pdftoppm` at 150 dpi to PNG outside the worktree and visually inspected every cited figure in the render. Did not rely on extracted text alone.
- Paraphrased rather than quoting at length; no figures reproduced.

## Rendered pages reviewed

All of the following were rendered and visually inspected:

- Printed p62, collar terminology and collar-type list, PDF p63.
- Printed p65, placket photos and closure bullets plus pocket section, PDF p66.
- Printed p67, one-/two-piece sleeve drawings and cuff/cuff-guard text with four barrel-cuff variants, PDF p68.
- Polo printed p80, front/back line illustration plus Step 1 master plan, PDF p81.
- Polo printed p81, Step 2 armhole lowering plus Step 3 center-front placket/hem, PDF p82.
- Polo printed p82, Step 4 front pattern plus Step 5 back pattern, PDF p83.
- Polo printed p83, Step 6 upper/under placket facings, PDF p84.
- Polo printed p84, Step 7 collar-stand development plus Step 8 stand pattern and ribbed-collar note, PDF p85.
- Polo printed p85, Step 9 sleeve master plus Step 10 cap widening, PDF p86.
- Polo printed p86, Step 11 short sleeve plus Step 12 polo sleeve pattern, PDF p87.
- Polo printed p87, sewn polo back/front photos on form, PDF p88.
- Casual shirt printed p104, front/back line illustration plus Step 1 master plan, PDF p105.
- Casual shirt printed p105, Step 2 enlarged armhole/shoulder plus Step 3 new armhole/body shaping, PDF p106.
- Casual shirt printed p106, Step 4 grown-on placket plus Step 5 yoke/pocket development, PDF p107.
- Casual shirt printed p107, Step 6 front pattern plus Step 7 back pattern plus Step 8 pocket plus Step 9 yoke, PDF p108.
- Casual shirt printed p108, Step 10 collar-stand development plus Step 11 top-collar development, PDF p109.
- Casual shirt printed p109, Step 12 stand/top/under patterns, PDF p110.
- Casual shirt printed p110, Step 13 sleeve master plan and sleeve-measurement box, PDF p111.
- Casual shirt printed p113, Step 16 sleeve pattern plus Step 17 cuff development and cuff-measurement box, PDF p114.
- Casual shirt printed p114, Step 18 top cuff guard plus Step 19 bottom cuff guard, PDF p115.
- Casual shirt printed p115, sewn shirt front/back photos on form, PDF p116.

## What the book directly depicts or says

### General collar/closure/sleeve principles

- Printed p62, PDF p63: stand is described as a band that lifts the collar from the neckline to its roll point; it may be part of the collar shape or a separate pattern, visible or hidden. Most collars are described as rising from the neck edge and turning over to sit on the shoulders, covering the neckline; the turn point is named the collar roll. The list distinguishes a band/mandarin without roll, a turned-down rolled collar with convex neckline that can use a stand and points to the casual shirt chapter, a convertible rolled collar that can use a stand or sew straight to the neckline, and a straight rectangular collar sewn to the neckline without a stand that rolls from center back and is linked to activewear with manufactured preknit rib and to the polo chapter.
- Printed p65, PDF p66: three close photos labeled grown-on, sewn-on, and concealed placket. Text gives only two construction routes: fold back grown-on material or sew on a separate piece. It names a fitting line, usually center front, for buttons/buttonholes; describes the placket extending past that line by about half a button diameter; and states the fastened order as left side overlapping right, with the lower side carrying buttons and the upper side carrying buttonholes.
- Printed p67, PDF p68: upper drawings contrast tailored and casual two-piece sleeves. Text calls the common one-piece single-underarm-seam sleeve a set-in sleeve and points to the casual shirt chapter; tailored and some casual jackets use top and bottom panels. The casual two-piece is described as retaining the sloper cap and derived by folding outer sleeve sections; the tailored sleeve is described as drafted separately for padding/roll height. The cuff section says the book does not illustrate cuffs in depth; its shirt single cuff gathers wrist volume with ease for movement; sleeve length is fixed before cuff/hem allowance; the guard finishes and supports the hand opening, is rectangular with shaped or flat end, variable length, optionally buttoned mid-length, with a stated seam take on the opening. Four small drawings show single/two-button cut-corner, rounded, and turned barrel cuffs.

### Polo short-sleeved shirt, printed pp80–87

- Printed p80, PDF p81: stylized front/back line illustration with ribbed collar and sleeve cuffs shown with contrast stripes, center placket, hem and side shaping. Step 1 master plan shows joined back and front torso with labeled back/front notches on the armhole, chest/waist/hip levels, center back/front, side seam, and grainline.
- Printed p81, PDF p82: Step 2 lowers the body armhole by a stated small amount and moves the front/back notches with it. Step 3 develops a short center-front placket rectangle from the front neck point with stated length/width and adds a hem allowance at the bottom; the diagram marks a cut on one side of the placket zone.
- Printed p82, PDF p83: Step 4 traces the full front and cuts down one side of the placket to form the opening; the final front piece is labeled for self fabric with center front/grainline. Step 5 traces the full back piece for self fabric with center back/grainline.
- Printed p83, PDF p84: Step 6 drafts separate upper and under placket facings as rectangles with seam allowance on all sides; the upper is a flat facing and the under is folded to a narrower finished facing. Final labels read as upper and under facings for self fabric with fold and grainline marks.
- Printed p84, PDF p85: Step 7 drafts a narrow collar stand from a long rectangle using split half-back and half-front neck lengths taken from the master plan, including half the placket width in the front portion; it places a shoulder notch, raises and curves the front, offsets the upper edge by the stand width, squares the front, and marks center-front neck inset by half the placket. Step 8 traces the full stand. A note box says knitted ribbed collars are made to order or bought in standard neck sizes and set between the two stand parts. The final stand piece is labeled for self fabric with center back/front and shoulder notches.
- Printed p85, PDF p86: Step 9 builds the sleeve master from the basic sleeve sloper and explicitly calls the design a short sleeve with ribbed cuff. The master is split by a center line into labeled back-sleeve and front-sleeve halves with distinct back and front cap notches, back/front underarm seams, biceps level, and hem/cuff-hem. Step 10 widens the cap to match the lowered armhole by comparing old and new front/back armhole lengths and adding the difference; it states knit needs little cap ease so none is added in this example, then extends the biceps line on both sides and redraws the cap/notches.
- Printed p86, PDF p87: Step 11 shortens the sleeve a stated distance below biceps, sets a new cuff width each side of center, joins the cap to the cuff with curved underarm lines, then adds a further narrow seam below for attaching the knitted ribbed cuff with extended ends to match the folded cuff shape. Step 12 is the single polo sleeve piece with center/grainline and a marked attach-rib edge and seam allowance; it retains front/back notch identity but is one traced piece, not a mirrored pair layout.
- Printed p87, PDF p88: paired sewn photos show the back and front of the made polo on a form. The worn collar covers the neckline; the short set-in sleeves carry ribbed cuffs; the front shows the short placket. This is a worn-garment photo pair, not a dimensioned flat with joins/overlaps resolved.

### Casual long-sleeved woven shirt, printed pp104–115

- Printed p104, PDF p105: overlapping stylized front/back line illustration with point collar, full button front, breast pocket, back yoke, long sleeves with cuffs/guards, plus Step 1 back/front master plan with back/front armhole notches. This is the nearest woven-shirt front/back illustration, but it is a fashion-style flat without resolved seam overlap.
- Printed p105, PDF p106: Step 2 creates the relaxed extended-shoulder block by adding width at the side seams, repositioning the upper slopers, shifting the shoulder seam, and lengthening the body; Step 3 redraws the lowered armhole from the sloper template and transfers the new front/back notches, with side-seam and dart shaping.
- Printed p106, PDF p107: Step 4 drafts the grown-on placket centered over center front as nested rectangles plus seam allowance; Step 5 places the back yoke by measured drops from center-back neck and armhole and drafts the breast-pocket shape on the front.
- Printed p107, PDF p108: final separate pieces for front right/left with grown-on fold zones, back with darts, breast pocket with top facing, and back yoke. No front/back assembled flat with layer order is shown.
- Printed p108, PDF p109: Step 10 measures half the neck as back-neck length plus front-neck length to the placket finish, drafts a half-stand rectangle of that length by the stand width, places the shoulder notch on both edges, curves the front, and squares the stand front. Step 11 builds the top collar from the stand shape by extending center back upward, squaring to a collar point, joining to front neck, smoothing the tip, and drawing an inner edge mirroring the stand curve for the stated collar width.
- Printed p109, PDF p110: three final collar pieces are shown stacked: stand, top collar, and under collar. The under collar is described as a copy of the top reduced at center-back neck and blended to the points so the sewn edge pulls under and stays hidden. Labels distinguish self and fusing cuts, grainline, shoulder notches, and inner/outer edges.
- Printed p110, PDF p111: Step 13 sleeve master is again split into labeled back-sleeve and front-sleeve halves about a center line, with back/front cap notches, back/front underarm seams, biceps level, and cuff hem. The example uses a shaped sleeve with a back tuck; the measurement box uses half the summed front/back armhole, half the eased biceps, and a cuff/wrist-plus-tuck width. This establishes front/back cap identity for one sleeve, not a two-sleeve back-flat arrangement.
- Printed p113, PDF p114: Step 16 is a single one-piece sleeve with center grainline and a drill hole marking the cuff-opening top. Step 17 drafts a rectangular double cuff folded lengthwise; its length is derived from the measured guard-opening width minus tuck and seam allowances.
- Printed p114, PDF p115: Step 18 top guard and Step 19 bottom guard are narrow folded rectangles with seam allowances and shaped/pointed ends; the top guard is marked as stitched to the cuff bottom edge.
- Printed p115, PDF p116: paired sewn photos show the made shirt front and back on a form. The worn collar covers the back neckline; the back yoke seam is visible; the long sleeves hang separately. Like the polo photos, this does not resolve flat-view line priority where projected edges cross.

## Evidence classification

- Direct book evidence: the separate-stand plus top/under-collar piece set; grown-on versus sewn-on placket routes; left-over-right fastened order with buttons below and buttonholes above; front/back notch identity on one sleeve cap; one-piece sleeve with single underarm seam versus two-panel jacket sleeves; cuff as a doubled piece sewn to the sleeve end with a separate guard/rib at the opening; ribbed polo collar/cuff supplied as preknit components set into the stand/cuff seam.
- Generic convention, not source-specific proof: covering of the neckline by a worn collar; use of shoulder notches; measuring half-neck from the master plan; adding cap length to match a lowered armhole; example ease and facing widths.
- Inference that must not be treated as book fact: any claim that these illustrations prescribe `live-draft:woven-shirt:14:14` geometry, stitch graph, projection, visible-line priority, sleeve pose, band placement, viewBox, POMs, or acceptance. The book does not name that revision and does not dimension it.
- Product decision that remains separate: whether InfiniDrip renders a foreground collar over the continuous body neckline, and whether it preserves the fixed S370 band footprint.

## Assessment against the S451 collar-front tradeoff

- Nothing in the inspected pages changes the S451 tradeoff.
- The book supports that a sewn collar/stand assembly exists and that a worn collar hides the neckline, but it never shows the disputed flat-view case: a projected collar-exterior contour crossing a retained continuous body-neckline stroke with a measured visible overlap of about `0.8426–0.8433 cm` per side.
- Its front/back illustrations and photos deliberately hide that junction through stylization, viewpoint, or wear; its pattern pages show separated collar/stand pieces rather than an assembled front flat with painter order.
- In particular, the book gives no instruction to clip, gap, or retain a body-neckline stroke beneath a foreground collar in a technical flat, and no overlap length that would justify the S407/S410 clip as a construction rule.
- Retaining the continuous visible seam therefore remains a product/view decision under S425, and the foreground-occlusion candidate remains a deliberate display change with the already measured visibility cost. No face should be released on this book alone.

## Assessment against the S442 fixed S370 bands and back hold

- Nothing in the inspected pages changes the S442 hold.
- Sleeve evidence is consistently one sleeve at a time with front/back cap-notche identity and a cuff/guard or rib join at its own hem. There is no paired-sleeve back-flat placement, no sleeve-to-sleeve overlap rule, and no detached side-gutter band detail equivalent to S370.
- The polo rib cuff is attached at the sleeve hem edge; the woven cuff plus guards finish a hand opening on one sleeve. Neither shows two complete hem-to-band joins mirrored about center back in one back view, nor a truthful arrangement that preserves fixed band boxes while clearing crossings.
- The S441 local-Y consequence — outward band relocation by about `20.5737–22.4315 cm` per side with viewBox growth of about `41.1474–44.863 cm` — has no counterpart or alternative in this book.
- Keep S370 positions fixed and all 28 Woven backs held.

## What the book cannot establish about `live-draft:woven-shirt:14:14`

- It cannot identify that revision, its piece geometry, seam/stitch graph, projection, option set, POM anchors, colorway, or renderer mapping.
- It cannot supply the missing visible-layer order for the exact front neckline/collar contact or the missing sleeve-to-sleeve order for the exact back hem crossing.
- Its woven examples are long-sleeve casual blocks with different ease, grown-on placket, yoke, pocket, and cuff-guard construction, not the short-sleeve relaxed woven block with its specific yoke/pocket/curved-hem/vent recipe and detached-band view composition.
- Its polo is a ribbed-collar/ribbed-cuff knit construction with upper/under facings and a short center placket, not the InfiniDrip polo recipe and marker/POM/readability system.
- Example dimensions, notch positions, cap additions, facing sizes, stand widths, and guard shapes are tied to those demonstration blocks and cannot be transferred as exact values.
- The front/back illustrations and dress-form photos are not pattern-accurate technical flats and cannot settle topology, join, layer, POM, or acceptance gates.

## Limitations

- Supplied-PDF-only review; no web search, no purchase, no external source.
- Text extraction is layout-sensitive; all cited figures were checked in the 150-dpi renders, but small dimension strings in diagrams are example-specific and were not treated as normative.
- No sewn-measurement, wear, CAD round-trip, or option-wide output evidence was created.
- No production, test, board, view, hold, or acceptance change was made.

## Next action

- Preserve the S425 continuous-neckline decision and S442 fixed-band decision; keep all 56 Woven and 34 Polo faces held until a source-backed mapping or an explicit maintainer-approved trial with full 28-option rendered/topology evidence exists.
- Do not start V03 or claim compatibility, fit, or production readiness from this book.
