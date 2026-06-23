# Patternworks — Architecture

How the app fits together, in plain language. Read the top to re-orient; skim the
layers when you need detail. Updated every slice with only need-to-know changes.

## The one big idea

Everything runs off **one object: `measurements`** (your body numbers, in cm).
Change a number and the whole picture is rebuilt from scratch — there's no hidden
state to fall out of sync, because every layer is just a *function* of those
numbers:

The UI is the only part that isn't a pure function: it catches your typing and
presses "rebuild."

## The layers

**geometry — the alphabet.**
A `Point` is `{x, y}` in centimetres (real cm, so it maps to real cloth).
`distance` is just Pythagoras. A curve is a *Bézier*: it runs start → end, and its
two control points are **magnets** that bend the line toward them without ever
touching it. `cubicLength` measures a curve by walking it in tiny steps and adding
them up — quietly the most important tool in the whole app.

**drafting — measurements become a pattern.**
A `Piece` is a closed outline of named `Edge`s (each one a straight line or a
curve). Drafting drops a few construction points (neck, shoulder, underarm, hem)
and connects them. Edges carry *names* ("armhole", "side") so other layers can ask
a piece "how long is your armhole?" The clever bit: the sleeve cap's height is
**solved** — a quick guess-and-check loop finds the height that makes the cap the
same length as the armhole. (A cap that doesn't match its armhole is the #1 reason
a real pattern won't sew, so this is the heart of "it actually works.")

**render — pattern becomes a picture.**
Pure translation, no decisions. `pieceToPath` walks a piece's edges into one SVG
string (`M` move, `L` line, `C` curve, `Z` close). Everything is a **string**, not
live page elements — which is why it tests without a browser (you just search the
text). On screen, cm × a scale = pixels.

**guidance — the chef tasting the soup.**
Each check is one fact you could verify with a tape measure: "cap matches
armhole," "shoulder shouldn't pass the side seam," "armhole not too shallow." No
AI, no guessing — that's exactly what makes it trustworthy.

**style — a map of the design space.**
A style is a **box of ranges**. For each measurement: are you inside the box? If
not, the nudge to get in (e.g. "Ease +3 cm") is the distance. Inside every box =
your current style. Closest boxes you're just outside of = nearby styles. Tuning
it later is only editing numbers; the logic never changes.

**ui — the only impure layer.**
`mountApp` holds the `measurements`, builds the page once, then wires each input:
on change it makes a **new** measurements object (never edits the old one) and
calls `draw()`, which rebuilds canvas + guidance + style. The inputs know nothing
about pieces or SVG — they only know how to change a number.

## Why it stays clean

- **Pure functions = cheap tests.** Most layers are "inputs → outputs," so a test
  is one line: feed known numbers, check the answer. That's why 100% coverage came
  easily and why the lower layers need no browser.
- **Strict TypeScript = free enforcement.** Unused code is a *compile error* (the
  "everything has a purpose" rule, automated), and the build fails if coverage ever
  drops below 95%.

## Where things live

## A change, start to finish

You type Length = 80 → `applyChange` makes a new measurements object → `draw()`
re-drafts the pieces → the canvas redraws longer, guidance re-checks, and the
style panel now reads "Longline tee." One input, one rebuild, everything stays
consistent.
