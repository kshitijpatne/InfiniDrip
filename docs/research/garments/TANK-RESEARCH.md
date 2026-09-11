# Tank research — strap width & armhole geometry

> **Resolution recorded after Slice 63:** the open wide-versus-narrow strap
> question was resolved by making `strapWidth` user-adjustable rather than
> choosing one engine-owned value. `neckDrop` was made user-adjustable in the
> same slice. Kshitij subsequently confirmed that tank neckline width must also
> become user-adjustable, and that meaningful garment aspects should generally
> be adjustable with invalid combinations handled by actionable guidance. See
> `../../PROJECT-DECISIONS.md`.

Started Slice 63, per the Tank rework plan's research standard
(PROJECT-STATE.md): real numeric dimensions and construction specs from
genuine web research, cross-checked against at least two independent
sources, never recycled from our own existing garments' numbers, never
presented as sourced when it's actually an estimate.

## What's actually wrong today

`draftTank()` calls the SAME `bodice()` component tee/fitted use,
unmodified, for both the strap (shoulder edge) and the armhole curve.
That means today's "tank" is really a sleeveless tee: its shoulder point
sits at the full `shoulderHalf` (22.5 cm at STANDARD_M) — the same point
a set-in sleeve would attach to — and its armhole curve is the curve
shaped to smoothly fit a sleeve cap.

## Finding 1 — strap width is its own dimension, not the full shoulder

Every tank-specific drafting source found measures the strap as a
distance IN from the neckline point along the shoulder line:

- Nastix Patterns' tank generator lists "strap width" as a shaping input
  distinct from shoulder width, alongside armhole depth and neckline
  width.
- ShunVogue's from-scratch tank drafting guide: "From the upper end of
  the neckline, measure 2 to 3 inches (5 to 8 cm) along the top for the
  straps." Repeated across three separate how-to pages.
- ComfyThreads' tank-fit guide, describing strap position on a finished
  garment: "About 1 to 1.5 inches in from the outer edge of your
  shoulder."

**These two framings don't fully agree.** Measured from the NECKLINE
side, 5–8 cm gives a strap tip roughly 12–15 cm from centre front at
STANDARD_M (a narrow, spaghetti-adjacent strap). Measured as an INSET
from the shoulder EDGE, 1–1.5 in (2.5–3.8 cm) gives a strap tip roughly
18.7–19.3 cm from centre — a much wider, "classic tank" strap. Both are
real, sourced numbers; they likely describe different tank sub-styles.

**Proposed number (superseded before building — see below):** the wider
"classic tank" reading, strap tip at `shoulderHalf − 4 cm` (≈18.5 cm),
since `TANK_STYLES` had no slim-strap variant to justify going narrow.

## Finding 2 — armhole DEPTH doesn't change; armhole SHAPE does

Every drafting source treats "armhole depth" as the same input
regardless of sleeved or sleeveless — matches how `m.armholeDepth`
already works. What changes is the CURVE between the strap point and the
underarm:

- ComfyThreads: "the armhole should end just below your shoulder
  joint... muscle tanks have deep armholes on purpose."
- Three independent t-shirt-to-tank DIY conversion guides (UNIONBAY, You
  Make It Simple, Our Everyday Life) independently describe cutting the
  armhole OUTSIDE/BELOW the existing sleeve seam.

The mechanism: a sleeved armhole's curve is shaped to smoothly receive a
sleeve cap. A tank has nothing to fit there, so the curve can — and per
every source, should — cut further in, reading as a rounder, more open
scoop.

## Finding 3 — no named tank style needs princess seams

Checked directly against `style.ts`'s `TANK_STYLES`:
```
Fitted tank:   ease [0, 4],  length [59, 74]
Classic tank:  ease [5, 10], length [59, 74]
Relaxed tank:  ease [11, 16], length [59, 74]
Crop tank:     ease [0, 10],  length [40, 57]
Longline tank: ease [5, 14],  length [78, 100]
```
All five vary ONLY by ease and length. Cross-checked what princess seams
are for (TREASURIE, Couture Counsellor, M.Mueller & Sohn): curved
vertical panel seams shaping close-fitting garments through bust AND
waist beyond a single dart. This project's mechanism for that is a bust
dart (`fitted.ts`), not princess seams, and no tank style asks for it.

**Conclusion: princess seams out of scope.** The strap width + armhole
shape fix is a curve/dimension change, achievable entirely through
`NecklineParams`-style parameters.

## Proposed scope for the build (pending confirmation)

1. A new derived strap point for sleeveless garments (proposed
   `shoulderHalf − 4cm`, Finding 1).
2. A new armhole curve for sleeveless garments, cutting further in than
   the sleeve-cap curve.
3. Underarm point stays at `chestWidthHalf`, unchanged (Finding 2).
4. No princess seams, no new named styles (Finding 3).
5. Likely a small new shared function, same pattern as `necklineEdge()`.

**Resolved after this research was written:** the strap-width
discrepancy. Wide (18.5cm) "classic tank" or narrow (12–15cm)
spaghetti-adjacent? The engine does not choose between them; the user controls
`strapWidth`, with guidance responsible for flagging invalid combinations.
