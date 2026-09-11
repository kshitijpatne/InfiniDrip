# Polo research — V1 collar-plus-stand knit polo

_Started 2026-09-11. Required research record before polo implementation. It
separates maintainer decisions from sourced construction rules and estimates.
Physical validation remains unstarted._

## Product scope

- **Garment / variant:** short-sleeve, loose-fit knit polo; collar-plus-stand;
  visible folded partial front placket.
- **Target user:** maker who needs a real, exportable custom polo pattern, not a
  visual approximation.
- **In scope:** loose tee body and current set-in sleeve; separate collar,
  stand, and two folded placket pieces; 14 cm finished placket length; 3 cm
  finished placket width; three buttons at 3.5 cm centre-to-centre; self knit
  with lightweight knit fusible stabilizer; real stitches, notches, grainlines,
  allowance, guidance, BOM, render, grade, nesting, and all exports.
- **Not in V1:** yoke, pocket, sleeve band, side vent, contrast fabric, long
  sleeve, collar variants, decorative topstitch variants, or shirt/blouse
  generalisation.

## Existing-engine reuse audit

- `bodice(..., { position })` + `sleeve({ targetArmhole })` correctly provide
  the loose knit body and its set-in sleeve: the new neckline does not alter
  the armhole, so the existing cap-ease check remains applicable.
- Existing shoulder, side, underarm, sleeve-cap, sleeve-hem, and body-hem
  construction can be reused only after the polo draft proves their same
  named edges still match.
- Existing crew neckline / neckband is not correct for a polo. A polo needs a
  collar, stand, placket opening, and button/buttonhole placement.
- A real placket exposes a current engine gap: `Piece` represents only an
  outer closed outline. The cut-on-fold front requires an internal centre-front
  cut line plus placement/fold/button marks. A fake exterior seam or an
  unmarked decorative line would make the export unsewable.
- Polo options must be recipe-owned, persisted design parameters; do not add
  collar/placket preferences to body `Measurements`.

## Measurements and adjustable parameters

| Aspect | User-adjustable input | Practical range | Source or decision | Guidance needed |
|---|---|---|---|---|
| Body / sleeve | Existing tee measurements + ease | Existing tee bounds | Maintainer: loose tee baseline; reuse sleeve | Existing plausibility, cap-ease, seam checks |
| Placket length | Yes; default 14 cm | Dynamic; final range needs edge-clearance rule | Maintainer decision: 14 cm | Must fit all three button centres plus end clearance; warn if it conflicts with neckline/hem construction |
| Finished placket width | Yes; default 3 cm | Starting estimate 2–4 cm; validate digitally and physically | Maintainer decision: 3 cm | Warn when folded layers/overlap cannot produce selected finished width |
| Button count | No in V1: fixed 3 | 3 | Maintainer decision | No silent count change |
| Button spacing | No in V1: fixed 3.5 cm centre-to-centre | 3.5 cm | Maintainer decision | Button centres must retain end clearance as placket length changes |
| Stand height | Yes; default 2 cm | 1–3 cm | Maintainer decision | Must not exceed usable neckline / placket-end geometry |
| Collar leaf depth / shape | Yes; default 5 cm, pointed | 4–7 cm | Maintainer decision | Collar seam must match stand; warn for impossible leaf/stand relation |
| Stabilizer | Material selection, not geometric control | Lightweight knit fusible default | Maintainer decision | BOM and instructions must state knit-compatible stabilizer |

## Construction and geometry research

| Rule or dimension | Source 1 | Source 2 | Agreement / conflict | Adopted treatment |
|---|---|---|---|---|
| Polo uses body front/back, sleeve, collar, stand, and placket pieces with marks | Maelo (pieces, notches, fold and button marks) | Jalie 3137 (front, collar, stand, placket pieces) | Agreement | Draft all as real pieces / marks, not artwork |
| Placket is a reinforced centre-front opening with folded placket pieces and reinforced lower triangle | Maelo steps 1–8 | Jalie front instructions | Agreement | Two visible folded self-knit placket pieces; expose and reinforce real slit base |
| Collar-plus-stand uses layered collar and stand; matching centre / notches is material | Maelo collar/stand steps | Threads collar construction | Agreement | Separate collar and stand, two layers each; stitch lengths checked |
| Light stabilizer/interfacing supports collar, stand, and placket | Maelo materials and placket steps | Jalie interfaces one collar and one stand | Agreement | Self knit + lightweight knit fusible; material choice is a maintainer decision, not a geometric substitute |
| Knit polo seam construction must preserve stretch | Maelo knit-polo needle / stitch advice | Jalie stretch sewing method | Agreement | Tech pack calls for knit-compatible construction; geometry remains stitch-agnostic |
| 14 cm length, 3 cm finished width, 3 buttons, 3.5 cm centres | Maintainer decision | Maintainer decision | Not claimed as sourced standard | Lock as V1 defaults; validate placement and physical sample |

## Guardrails and actionable guidance

- **Placket too short for button group:** calculate required length from fixed
  three-button, 3.5 cm spacing plus chosen end clearance. Warn with minimum
  acceptable length; do not move buttons silently.
- **Button centre outside finished placket:** warn with exact offending button
  and correction (increase length or restore valid width/clearance).
- **Stand / neckline mismatch:** stitch check between stand lower edge and
  front+back neckline interfaces; show both lengths and correction.
- **Collar / stand mismatch:** stitch check between collar inner edge and stand
  upper interface; show both lengths and correction.
- **Placket attachment mismatch:** each placket attachment edge must equal its
  corresponding front slit edge; show exact edge mismatch.
- **Oversized stand or leaf:** geometry-level warnings once the maintainer locks
  defaults/ranges; warn, never clamp.
- **Fabric mismatch:** if active fabric is unsuitable for a stabilized knit polo,
  BOM/guidance states required stabilizer and construction consequence.

## Pattern pieces, interfaces, and stitches

- **Pieces:** front body on fold with internal placket cut line; back body on
  fold; sleeve; collar (cut 2); collar stand (cut 2); button placket; buttonhole
  placket. Exact cut quantities / folded layout must appear in pattern exports.
- **Internal marks required:** centre-front slit/cut line; placket fold lines;
  placket attachment lines; placket base reinforcement; three button centres;
  three buttonhole centres; centre / shoulder / attachment notches.
- **Interfaces:** front+back neckline → stand; stand → collar; left/right front
  slit edges → their plackets; existing shoulder, side, underarm, sleeve-cap.
- **Stitches:** existing tee stitches plus collar-to-stand, stand-to-neckline,
  and both placket-to-front attachments. The lower placket reinforcement is a
  construction mark/check, not a fictitious garment seam.
- **Allowances:** current knit body/sleeve allowances may be reused only where
  edges retain same construction; collar, stand, placket, fold, and slit must
  declare their own named allowances before export.

## Render and export verification

- Render default, shortest valid, widest valid, longest valid, and each
  boundary-warning case in Pattern, Body front/back, assembled garment, Spec,
  Nesting, and Check views.
- Inspect cut lines, fold marks, button/buttonhole centres, placket overlap,
  collar/stand symmetry, seam / allowance visibility, and body-front opening.
- Parse SVG/DXF/PDF/projector/A0 outputs; assert all new marks and cut quantities
  exist at cm-true coordinates. Existing non-polo export hashes stay unchanged.
- Polo output establishes new fixtures; it never changes the established tee,
  darted tee, tank, or skirt regression baselines.
- Digital Slice 74 review found that the Body and assembled schematics must show
  a neckline-following stand with an attached pointed collar leaf; a straight
  rectangular bar perpendicular to the neckline is not an acceptable Polo
  convention. The Pattern view uses shelves for the nine pieces so labels and
  construction marks remain readable. Slice 76 digital review found that shelf
  separation alone was insufficient at the narrow placket/collar scale: title
  lanes now reserve width for long component names, compact mark labels sit
  beside their geometry at a smaller scale, and Body/assembled schematics use
  a neckline-following stand with collar points dropping onto the chest. This
  remains a flat digital convention, not physical collar-roll evidence.

## Physical validation plan (deferred)

Physical sampling is explicitly on hold because no manufacturer or printer is
currently available. Do not suggest this activity unless the maintainer
explicitly reopens it. The following is retained as a future evidence template,
not as an active next step.

- **Person / body:** record actual measured wearer after first digital gate.
- **Fabric / notions:** selected knit body fabric; lightweight knit fusible;
  three buttons; knit-safe thread/needle.
- **Export:** one ungraded default-size true-scale PDF/SVG, calibration square
  measured before cutting.
- **POMs:** chest, body length, sleeve length, finished placket length/width,
  stand height, collar leaf depth, and button spacing.
- **Sew / fit:** record collar roll, stand symmetry, placket flatness, button
  strain, neckline recovery, and wash behaviour. Do not mark validated before
  a cut/sew/fit record exists.

## Decisions and unresolved questions

### Confirmed maintainer decisions — 2026-09-11

- Collar-plus-stand construction.
- Loose tee body and current tee sleeve.
- Visible clean folded placket: 14 cm finished length, 3 cm finished width.
- Three buttons, 3.5 cm centre-to-centre.
- Main body knit throughout with lightweight knit stabilizer.
- Meaningful polo dimensions user-adjustable with guardrails.
- Finished stand defaults to 2 cm (range 1–3 cm).
- Finished pointed collar leaf defaults to 5 cm (range 4–7 cm).
- Button centres sit 3.5 cm, 7.0 cm, and 10.5 cm below placket top.
- Side vents are excluded from V1.

### Slice 68 infrastructure resolution

`Piece.marks` now records internal construction data without turning it into
an exterior seam. Canvas, SVG, DXF, tiled PDF, A0, and projector exports carry
those marks at true scale. Recipe-owned option schemas and version-3 saves now
carry per-garment design options separately from body measurements. No polo
geometry exists yet; Slice 69 may now draft the real centre-front slit and
placket pieces against this contract.

### Slice 69 shell resolution

The front remains cut on fold and carries a 14 cm internal `placketOpening`
cut line from the actual centre-front neckline point. The two physical slit
sides are declared individually through `MarkRef`, then measured against the
corresponding placket attachment line. Each placket's sew outline is 8 cm wide:
1 cm attachment allowance, 3 cm finished visible face, 3 cm inner facing, and
1 cm turn-under. This is an engineering construction decision for V1, pending
physical sewing; it is not claimed as a sourced universal placket formula.

### Slice 70 collar/stand resolution

The stand and pointed collar are each drafted as two physical half-pieces on
the centre-back fold: outer/inner stand plus upper/under collar. A half stand's
neckline edge is set to the measured sum of the true front and back neckline
edges; each collar base is set to that same length. The V1 pattern therefore
proves every declared collar, stand, neckline, placket, body, and sleeve stitch
length digitally. Its straight half-band stand is an engineering first draft,
not proof of collar roll or stabilized-knit behavior. Physical sewing must still
validate roll, stand shaping, placket flatness, and recovery before production.

### Slice 72 visual-schematic resolution

The Body and assembled views now render the selected finished placket length /
width, three fixed button centres, stand height, and pointed collar-leaf depth.
They are explicitly flat measurement schematics, not a claim about drape,
collar roll, stabilizer behavior, or a sewn result. Those four design values
persist per Polo recipe and feed every draft/export route without entering body
measurements.

## Sources

1. Maelo Studio, “How to Sew a Polo Shirt,” 2026,
   https://maelodesign.com/blogs/Sewing_a_Polo_Shirt (accessed 2026-09-11).
2. Jalie, “3137 — Men’s Polo Shirts: Sewing Instructions,”
   https://d2culxnxbccemt.cloudfront.net/sew/content/uploads/2016/08/29134157/Pattern-Instructions-PDF8.pdf
   (accessed 2026-09-11).
3. Peter Lappin, “Create a Professional-Looking Shirt Collar,” *Threads*,
   https://www.threadsmagazine.com/project-guides/fit-and-sew-tops/creating-professional-looking-shirt-collars
   (accessed 2026-09-11).
